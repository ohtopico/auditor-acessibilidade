import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import {
  coletarEstrutura, descreverFoco, desenharOrdem, analisarEstrutura, analisarFoco,
} from './checagens.js';
import { IMPACTO, DICAS, DICAS_PROPRIAS, TITULOS_FALTANTES, EQUIVALENTES, nomeCriterio } from './dicas.js';

const require = createRequire(import.meta.url);
const AXE_FONTE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const AXE_PT = require('axe-core/locales/pt_BR.json');

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

export const TELAS = {
  computador: { width: 1280, height: 800 },
  celular: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};

/** Aceita URL ou caminho de arquivo local. */
export function normalizarEndereco(alvo) {
  if (/^(https?|file):\/\//i.test(alvo)) return alvo;
  if (existsSync(alvo)) return pathToFileURL(resolve(alvo)).href;
  return `https://${alvo}`;
}

/**
 * Audita uma página e devolve um objeto com tudo o que o relatório precisa.
 * @param {string} alvo URL ou caminho de arquivo .html
 * @param {object} [opcoes]
 * @param {'computador'|'celular'} [opcoes.tela]
 * @param {number} [opcoes.maxTab] limite de elementos percorridos com Tab
 * @param {boolean} [opcoes.captura] gerar imagem com a ordem do Tab
 * @param {import('playwright').Browser} [opcoes.navegador] reaproveitar um navegador aberto
 */
export async function auditar(alvo, opcoes = {}) {
  const { tela = 'computador', maxTab = 80, captura = true } = opcoes;
  const endereco = normalizarEndereco(alvo);
  const navegador = opcoes.navegador || await chromium.launch();
  const contexto = await navegador.newContext({ ...semMobile(TELAS[tela]), viewport: viewport(TELAS[tela]), locale: 'pt-BR', bypassCSP: true });
  const pagina = await contexto.newPage();

  try {
    await pagina.goto(endereco, { waitUntil: 'load', timeout: 45000 });
    await pagina.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

    // 1) axe-core, com as mensagens em português
    await pagina.addScriptTag({ content: AXE_FONTE });
    const axe = await pagina.evaluate(async ({ locale, tags }) => {
      window.axe.configure({ locale });
      return window.axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations', 'incomplete'] });
    }, { locale: AXE_PT, tags: TAGS });

    // 2) estrutura (títulos, imagens, idioma)
    const estrutura = await pagina.evaluate(coletarEstrutura);

    // 3) ordem de foco pelo teclado. Recarrega para o Tab começar do zero,
    // como numa visita real (tabindex positivo vem primeiro).
    await pagina.reload({ waitUntil: 'load' });
    await pagina.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    const ordem = await percorrerTab(pagina, maxTab);

    const problemasProprios = [...analisarFoco(ordem), ...analisarEstrutura(estrutura)];

    let imagem = null;
    if (captura && ordem.length) {
      await pagina.evaluate(() => document.activeElement?.blur());
      await pagina.evaluate(desenharOrdem, ordem);
      const altura = await pagina.evaluate(() => document.documentElement.scrollHeight);
      const larg = viewport(TELAS[tela]).width;
      imagem = await pagina.screenshot({
        type: 'jpeg', quality: 70, fullPage: altura <= 6000,
        clip: altura > 6000 ? { x: 0, y: 0, width: larg, height: 6000 } : undefined,
      });
    }

    return montarResultado({ endereco, tela, axe, estrutura, ordem, problemasProprios, imagem, maxTab });
  } finally {
    await contexto.close();
    if (!opcoes.navegador) await navegador.close();
  }
}

async function percorrerTab(pagina, maxTab) {
  const ordem = [];
  const vistos = new Set();
  for (let i = 0; i < maxTab; i++) {
    await pagina.keyboard.press('Tab');
    const info = await pagina.evaluate(descreverFoco);
    if (!info) { if (ordem.length) break; else continue; }
    if (vistos.has(info.id)) break; // deu a volta
    vistos.add(info.id);
    ordem.push(info);
  }
  return ordem;
}

function montarResultado({ endereco, tela, axe, estrutura, ordem, problemasProprios, imagem, maxTab }) {
  const problemas = [];

  for (const v of axe.violations) {
    const dica = DICAS[v.id] || {};
    problemas.push({
      origem: 'axe',
      regra: v.id,
      titulo: TITULOS_FALTANTES[v.id] || v.help,
      descricao: v.description,
      impacto: v.impact || 'moderate',
      criterio: nomeCriterio(v.tags),
      porque: dica.porque || '',
      corrigir: dica.corrigir || '',
      saibaMais: v.helpUrl,
      ocorrencias: v.nodes.map((n) => ({
        seletor: n.target.join(' '),
        html: n.html.slice(0, 300),
        resumo: n.failureSummary || '',
      })),
    });
  }

  const regrasAxe = new Set(axe.violations.map((v) => v.id));
  for (const p of problemasProprios) {
    if (regrasAxe.has(EQUIVALENTES[p.tipo])) continue;
    const d = DICAS_PROPRIAS[p.tipo];
    problemas.push({
      origem: 'auditor',
      regra: p.tipo,
      titulo: d.titulo,
      descricao: '',
      impacto: p.impacto,
      criterio: d.wcag,
      porque: d.porque,
      corrigir: d.corrigir,
      saibaMais: '',
      ocorrencias: p.detalhes.map((t) => ({ seletor: '', html: '', resumo: t })),
    });
  }

  problemas.sort((a, b) => IMPACTO[a.impacto].ordem - IMPACTO[b.impacto].ordem || b.ocorrencias.length - a.ocorrencias.length);

  const contagem = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const p of problemas) contagem[p.impacto]++;

  // Índice indicativo: começa em 100 e perde pontos por regra violada,
  // com um pouco a mais quando a regra aparece muitas vezes.
  const perda = problemas.reduce((s, p) => s + IMPACTO[p.impacto].peso * (1 + Math.min(p.ocorrencias.length - 1, 9) * 0.1), 0);
  const indice = Math.max(0, Math.round(100 - perda));

  return {
    endereco,
    tela,
    data: new Date().toISOString(),
    tituloPagina: estrutura.titulo,
    idioma: estrutura.lang,
    indice,
    contagem,
    problemas,
    paraConferir: axe.incomplete.map((v) => ({ regra: v.id, titulo: v.help, ocorrencias: v.nodes.length, saibaMais: v.helpUrl })),
    regrasAprovadas: axe.passes?.length ?? null,
    titulos: estrutura.titulos,
    imagens: { total: estrutura.imagens.length, semAlt: estrutura.imagens.filter((i) => i.alt === null && !i.decorativa).length },
    ordemFoco: ordem.map(({ id, ...resto }) => resto),
    ordemFocoCompleta: ordem.length < maxTab,
    imagemOrdem: imagem ? imagem.toString('base64') : null,
    versaoAxe: axe.testEngine?.version,
  };
}

function viewport({ width, height }) { return { width, height }; }
function semMobile({ width, height, ...resto }) { return resto; }
