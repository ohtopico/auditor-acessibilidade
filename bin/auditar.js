#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import { auditar } from '../src/auditar.js';
import { gerarHtml, gerarTexto } from '../src/relatorio.js';

const AJUDA = `
Auditor de acessibilidade: analisa páginas e gera um relatório em português.

Uso:
  auditar <endereço> [<endereço> ...] [opções]

O endereço pode ser uma URL (https://...) ou um arquivo .html local.

Opções:
  -s, --saida <pasta>     pasta do relatório (padrão: ./relatorio-acessibilidade)
  -c, --celular           simula a tela de um celular (390×844)
      --max-tab <n>       quantos elementos percorrer com Tab (padrão: 80)
      --sem-captura       não gera a imagem com a ordem do Tab
      --minimo <n>        sai com erro se algum índice ficar abaixo de n (útil em CI)
  -h, --ajuda             mostra esta ajuda

Exemplos:
  auditar ohtopico.com.br
  auditar https://exemplo.com.br/contato --celular
  auditar pagina.html --minimo 80
`;

let args;
try {
  args = parseArgs({
    allowPositionals: true,
    options: {
      saida: { type: 'string', short: 's', default: 'relatorio-acessibilidade' },
      celular: { type: 'boolean', short: 'c', default: false },
      'max-tab': { type: 'string', default: '80' },
      'sem-captura': { type: 'boolean', default: false },
      minimo: { type: 'string' },
      ajuda: { type: 'boolean', short: 'h', default: false },
    },
  });
} catch (e) {
  console.error(`Opção inválida: ${e.message}\n${AJUDA}`);
  process.exit(2);
}

const { values: op, positionals: alvos } = args;
if (op.ajuda || alvos.length === 0) {
  console.log(AJUDA);
  process.exit(alvos.length === 0 && !op.ajuda ? 2 : 0);
}

const navegador = await chromium.launch();
const resultados = [];
let falhou = false;
try {
  for (const alvo of alvos) {
    process.stdout.write(`Analisando ${alvo}... `);
    try {
      const r = await auditar(alvo, {
        navegador,
        tela: op.celular ? 'celular' : 'computador',
        maxTab: Number(op['max-tab']) || 80,
        captura: !op['sem-captura'],
      });
      resultados.push(r);
      console.log('pronto.\n');
      console.log(gerarTexto(r));
      console.log('');
    } catch (e) {
      falhou = true;
      console.log('erro.');
      console.error(`  Não foi possível analisar ${alvo}: ${e.message.split('\n')[0]}`);
    }
  }
} finally {
  await navegador.close();
}

if (resultados.length) {
  const pasta = resolve(op.saida);
  mkdirSync(pasta, { recursive: true });
  writeFileSync(join(pasta, 'relatorio.html'), gerarHtml(resultados));
  writeFileSync(join(pasta, 'relatorio.json'), JSON.stringify(resultados.map(({ imagemOrdem, ...r }) => r), null, 2));
  console.log(`Relatório salvo em ${join(pasta, 'relatorio.html')}`);
}

if (op.minimo !== undefined) {
  const min = Number(op.minimo);
  const abaixo = resultados.filter((r) => r.indice < min);
  if (abaixo.length) {
    console.error(`\n${abaixo.length} página(s) abaixo do índice mínimo ${min}.`);
    process.exit(1);
  }
}
process.exit(falhou ? 1 : 0);
