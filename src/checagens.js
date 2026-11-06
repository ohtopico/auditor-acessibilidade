// Checagens próprias, que rodam dentro da página (via page.evaluate).
// Complementam o axe-core com o que ele não cobre: ordem de foco pelo
// teclado, foco visível, estrutura de títulos, textos alternativos pouco
// úteis e idioma do conteúdo.

const ALT_SUSPEITOS = /^(imagem|image|img|foto|photo|picture|figura|banner|logo|icone|ícone|icon|grafico|gráfico|untitled|sem título|\d+)$/i;
const ALT_ARQUIVO = /\.(jpe?g|png|gif|webp|svg|bmp)$|^(img|dsc|image|screenshot|whatsapp)[\s_-]?\d/i;

/** Estrutura de títulos, imagens e idioma (roda no navegador). */
export function coletarEstrutura() {
  const visivel = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const texto = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();

  const titulos = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')]
    .filter(visivel)
    .map((el) => ({
      nivel: el.getAttribute('role') === 'heading'
        ? Number(el.getAttribute('aria-level') || 2)
        : Number(el.tagName[1]),
      texto: texto(el).slice(0, 120),
    }));

  const imagens = [...document.querySelectorAll('img')].map((el) => ({
    src: (el.currentSrc || el.src || '').split('/').pop().split('?')[0].slice(0, 80),
    alt: el.getAttribute('alt'),
    decorativa: el.getAttribute('role') === 'presentation' || el.getAttribute('role') === 'none' || el.getAttribute('aria-hidden') === 'true',
  }));

  return {
    titulo: document.title,
    lang: document.documentElement.getAttribute('lang') || '',
    amostraTexto: texto(document.body).slice(0, 4000),
    titulos,
    imagens,
  };
}

/** Descreve o elemento com foco agora e verifica se o foco aparece na tela. */
export function descreverFoco() {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return null;

  const r = el.getBoundingClientRect();
  const nome = (
    el.getAttribute('aria-label') ||
    el.getAttribute('alt') ||
    el.getAttribute('title') ||
    el.getAttribute('placeholder') ||
    (el.innerText || el.value || '') ||
    el.querySelector?.('img[alt]')?.getAttribute('alt') ||
    ''
  ).replace(/\s+/g, ' ').trim().slice(0, 60);

  // Compara o estilo com foco e sem foco. Se nada muda, o foco é invisível.
  const props = ['outlineStyle', 'outlineWidth', 'outlineColor', 'boxShadow', 'backgroundColor', 'color', 'borderTopColor', 'borderBottomColor', 'borderBottomWidth', 'textDecorationLine'];
  const foto = () => {
    const s = getComputedStyle(el);
    return props.map((p) => s[p]).join('|');
  };
  const comFoco = foto();
  const s = getComputedStyle(el);
  const temContorno = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
  el.blur();
  const semFoco = foto();
  el.focus({ preventScroll: true });
  const focoVisivel = temContorno || comFoco !== semFoco;

  const tabindex = el.getAttribute('tabindex');
  return {
    tag: el.tagName.toLowerCase(),
    papel: el.getAttribute('role') || '',
    nome,
    tabindex: tabindex === null ? null : Number(tabindex),
    focoVisivel,
    // coordenadas na página (não na janela)
    x: Math.round(r.left + window.scrollX),
    y: Math.round(r.top + window.scrollY),
    largura: Math.round(r.width),
    altura: Math.round(r.height),
    id: el.__auditorId || (el.__auditorId = Math.random().toString(36).slice(2)),
  };
}

/** Desenha números sobre a página mostrando a ordem do Tab. */
export function desenharOrdem(itens) {
  const camada = document.createElement('div');
  camada.id = '__auditor-camada';
  camada.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none';
  for (const [i, it] of itens.entries()) {
    const caixa = document.createElement('div');
    const cor = it.problema ? '#c21f3a' : '#166c40';
    caixa.style.cssText = `position:absolute;left:${it.x}px;top:${it.y}px;width:${Math.max(it.largura, 4)}px;height:${Math.max(it.altura, 4)}px;outline:2px solid ${cor};outline-offset:1px;border-radius:4px`;
    const num = document.createElement('div');
    num.textContent = String(i + 1);
    num.style.cssText = `position:absolute;left:${it.x - 10}px;top:${it.y - 10}px;min-width:20px;height:20px;padding:0 4px;border-radius:999px;background:${cor};color:#fff;font:700 12px/20px system-ui,sans-serif;text-align:center;border:1.5px solid #111;box-sizing:border-box`;
    camada.append(caixa, num);
  }
  document.body.append(camada);
}

/** Analisa a estrutura coletada e devolve problemas das checagens próprias. */
export function analisarEstrutura(estrutura) {
  const problemas = [];
  const { titulos, imagens, lang, amostraTexto } = estrutura;

  const h1 = titulos.filter((t) => t.nivel === 1);
  if (h1.length === 0) problemas.push({ tipo: 'sem-h1', impacto: 'moderate', detalhes: [] });
  if (h1.length > 1) problemas.push({ tipo: 'varios-h1', impacto: 'minor', detalhes: h1.map((t) => `h1: ${t.texto}`) });

  const pulos = [];
  for (let i = 1; i < titulos.length; i++) {
    if (titulos[i].nivel > titulos[i - 1].nivel + 1) {
      pulos.push(`h${titulos[i - 1].nivel} → h${titulos[i].nivel}: "${titulos[i].texto}"`);
    }
  }
  if (pulos.length) problemas.push({ tipo: 'nivel-pulado', impacto: 'moderate', detalhes: pulos });

  const ruins = imagens
    .filter((im) => im.alt && !im.decorativa)
    .filter((im) => ALT_SUSPEITOS.test(im.alt.trim()) || ALT_ARQUIVO.test(im.alt.trim()))
    .map((im) => `alt="${im.alt}" (${im.src})`);
  if (ruins.length) problemas.push({ tipo: 'alt-suspeito', impacto: 'serious', detalhes: ruins });

  if (lang && !/^pt\b/i.test(lang) && parecePortugues(amostraTexto)) {
    problemas.push({ tipo: 'idioma-diferente', impacto: 'serious', detalhes: [`lang="${lang}"`] });
  }
  return problemas;
}

/** Analisa a sequência do Tab: saltos para trás, tabindex positivo, foco invisível. */
export function analisarFoco(ordem, { tolerancia = 10 } = {}) {
  const problemas = [];
  if (ordem.length === 0) {
    problemas.push({ tipo: 'sem-foco', impacto: 'critical', detalhes: [] });
    return problemas;
  }
  const rotulo = (it, i) => `${i + 1}. <${it.tag}>${it.nome ? ` "${it.nome}"` : ''}`;

  const saltos = [];
  for (let i = 1; i < ordem.length; i++) {
    const a = ordem[i - 1];
    const b = ordem[i];
    // salto para trás: o próximo elemento está inteiro acima do anterior
    if (b.y + b.altura <= a.y + 2 && a.y - b.y >= tolerancia) {
      saltos.push(`${rotulo(a, i - 1)} → ${rotulo(b, i)} (sobe ${a.y - b.y}px)`);
      b.problema = true;
    }
  }
  if (saltos.length) problemas.push({ tipo: 'salto-ordem', impacto: 'serious', detalhes: saltos });

  const positivos = ordem.map((it, i) => [it, i]).filter(([it]) => it.tabindex > 0);
  if (positivos.length) {
    positivos.forEach(([it]) => { it.problema = true; });
    problemas.push({ tipo: 'tabindex-positivo', impacto: 'serious', detalhes: positivos.map(([it, i]) => `${rotulo(it, i)} tabindex="${it.tabindex}"`) });
  }

  const invisiveis = ordem.map((it, i) => [it, i]).filter(([it]) => !it.focoVisivel);
  if (invisiveis.length) {
    invisiveis.forEach(([it]) => { it.problema = true; });
    problemas.push({ tipo: 'foco-invisivel', impacto: 'serious', detalhes: invisiveis.map(([it, i]) => rotulo(it, i)) });
  }
  return problemas;
}

// Heurística simples: compara palavras muito comuns do português e do inglês.
// Só acusa quando o português domina com folga (evita falso alarme em sites
// com interface em inglês e um trecho em português, como o GitHub).
function parecePortugues(texto) {
  const palavras = texto.toLowerCase().match(/[a-zà-ú]+/g) || [];
  if (palavras.length < 20) return false;
  const pt = new Set(['de', 'que', 'não', 'para', 'com', 'uma', 'os', 'das', 'dos', 'são', 'você', 'também', 'mais', 'como', 'pela', 'pelo', 'sobre', 'aqui', 'está', 'ação', 'página', 'nossa', 'nosso', 'ou', 'em', 'no', 'na']);
  const en = new Set(['the', 'and', 'of', 'to', 'is', 'you', 'for', 'with', 'this', 'that', 'your', 'on', 'are', 'from', 'by', 'or', 'in', 'it', 'be']);
  const nPt = palavras.filter((p) => pt.has(p)).length;
  const nEn = palavras.filter((p) => en.has(p)).length;
  return nPt / palavras.length > 0.08 && nPt > 3 * nEn;
}
