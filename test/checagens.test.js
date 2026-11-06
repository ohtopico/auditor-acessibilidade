import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analisarFoco, analisarEstrutura } from '../src/checagens.js';
import { nomeCriterio } from '../src/dicas.js';

const item = (y, extra = {}) => ({ tag: 'a', nome: 'x', tabindex: null, focoVisivel: true, x: 0, y, largura: 100, altura: 20, ...extra });
const tipos = (ps) => ps.map((p) => p.tipo).sort();

test('ordem de cima para baixo não gera problema', () => {
  assert.deepEqual(analisarFoco([item(0), item(30), item(60)]), []);
});

test('salto para trás é detectado', () => {
  const ps = analisarFoco([item(0), item(200), item(100)]);
  assert.deepEqual(tipos(ps), ['salto-ordem']);
  assert.equal(ps[0].detalhes.length, 1);
});

test('elementos na mesma linha não contam como salto', () => {
  assert.deepEqual(analisarFoco([item(100), item(98), item(102)]), []);
});

test('tabindex positivo e foco invisível', () => {
  const ps = analisarFoco([item(0, { tabindex: 2 }), item(40, { focoVisivel: false })]);
  assert.deepEqual(tipos(ps), ['foco-invisivel', 'tabindex-positivo']);
});

test('página sem nenhum elemento focável', () => {
  assert.deepEqual(tipos(analisarFoco([])), ['sem-foco']);
});

test('títulos: sem h1, vários h1 e nível pulado', () => {
  const base = { imagens: [], lang: 'pt-BR', amostraTexto: '' };
  assert.deepEqual(tipos(analisarEstrutura({ ...base, titulos: [{ nivel: 2, texto: 'a' }] })), ['sem-h1']);
  assert.deepEqual(tipos(analisarEstrutura({ ...base, titulos: [{ nivel: 1, texto: 'a' }, { nivel: 1, texto: 'b' }] })), ['varios-h1']);
  assert.deepEqual(tipos(analisarEstrutura({ ...base, titulos: [{ nivel: 1, texto: 'a' }, { nivel: 3, texto: 'b' }] })), ['nivel-pulado']);
});

test('texto alternativo suspeito', () => {
  const r = analisarEstrutura({
    titulos: [{ nivel: 1, texto: 'a' }], lang: 'pt-BR', amostraTexto: '',
    imagens: [
      { src: 'a.jpg', alt: 'IMG_2034.jpg', decorativa: false },
      { src: 'b.jpg', alt: 'imagem', decorativa: false },
      { src: 'c.jpg', alt: 'Turma da escola visitando o laboratório', decorativa: false },
      { src: 'd.jpg', alt: '', decorativa: false },
    ],
  });
  assert.deepEqual(tipos(r), ['alt-suspeito']);
  assert.equal(r[0].detalhes.length, 2);
});

test('idioma: português declarado como inglês', () => {
  const texto = 'Aqui você encontra planos de aula para professores da rede pública, com materiais gratuitos que podem ser usados em sala. Não é preciso se cadastrar para ver os planos, que também estão disponíveis para impressão e para uso com a turma.';
  const base = { titulos: [{ nivel: 1, texto: 'a' }], imagens: [], amostraTexto: texto };
  assert.deepEqual(tipos(analisarEstrutura({ ...base, lang: 'en' })), ['idioma-diferente']);
  assert.deepEqual(analisarEstrutura({ ...base, lang: 'pt-BR' }), []);
});

test('nomes de critérios WCAG', () => {
  assert.equal(nomeCriterio(['wcag2aa', 'wcag143']), 'WCAG 1.4.3');
  assert.equal(nomeCriterio(['wcag2a', 'wcag2411']), 'WCAG 2.4.11');
  assert.equal(nomeCriterio(['best-practice']), 'Boa prática');
});
