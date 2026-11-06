// Testes de ponta a ponta: abrem as páginas de exemplo no Chromium.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { auditar, gerarHtml } from '../index.js';

const pagina = (nome) => fileURLToPath(new URL(`./paginas/${nome}`, import.meta.url));
let navegador;
before(async () => { navegador = await chromium.launch(); });
after(async () => { await navegador?.close(); });

test('página boa: nenhum problema e índice 100', async () => {
  const r = await auditar(pagina('boa.html'), { navegador });
  assert.deepEqual(r.problemas.map((p) => p.regra), []);
  assert.equal(r.indice, 100);
  assert.equal(r.ordemFoco.length, 4); // 2 links do menu, campo de e-mail e botão
  assert.ok(r.ordemFoco.every((o) => o.focoVisivel));
});

test('página ruim: encontra os problemas plantados', async () => {
  const r = await auditar(pagina('ruim.html'), { navegador });
  const regras = new Set(r.problemas.map((p) => p.regra));
  for (const esperado of ['image-alt', 'button-name', 'link-name', 'color-contrast', 'document-title', 'tabindex',
    'foco-invisivel', 'salto-ordem', 'alt-suspeito', 'idioma-diferente']) {
    assert.ok(regras.has(esperado), `deveria acusar ${esperado}`);
  }
  // não repete o que o axe já disse
  assert.ok(!regras.has('tabindex-positivo'));
  // tabindex positivo vem primeiro na ordem do Tab
  assert.equal(r.ordemFoco[0].nome, 'Pula a fila');
  assert.ok(r.indice < 50);
  // textos em português
  assert.ok(r.problemas.find((p) => p.regra === 'image-alt').titulo.includes('Imagens'));
});

test('relatório HTML é gerado e escapa o conteúdo da página', async () => {
  const r = await auditar(pagina('ruim.html'), { navegador, captura: false });
  const html = gerarHtml(r);
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /Relatório de <mark>acessibilidade<\/mark>/);
  assert.ok(!html.includes('<img src="logo.png">'), 'HTML da página deve aparecer escapado');
  assert.ok(html.includes('&lt;img src=&quot;logo.png&quot;&gt;'));
});

test('modo celular usa a tela pequena', async () => {
  const r = await auditar(pagina('boa.html'), { navegador, tela: 'celular', captura: false });
  assert.equal(r.tela, 'celular');
});
