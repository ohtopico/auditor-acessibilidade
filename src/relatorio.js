import { IMPACTO } from './dicas.js';

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const CLASSE = { critical: 'critico', serious: 'grave', moderate: 'moderado', minor: 'leve' };

function faixa(indice) {
  if (indice >= 90) return { nome: 'muito bom', classe: 'bom' };
  if (indice >= 70) return { nome: 'precisa de ajustes', classe: 'medio' };
  return { nome: 'precisa de atenção', classe: 'ruim' };
}

/** Gera um relatório HTML autocontido a partir de um ou mais resultados. */
export function gerarHtml(resultados) {
  const lista = Array.isArray(resultados) ? resultados : [resultados];
  const data = new Date(lista[0].data).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relatório de acessibilidade</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;600&family=Sniglet:wght@800&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
<main id="conteudo">
  <header class="capa">
    <p class="pilula">auditor de acessibilidade</p>
    <h1>Relatório de <mark>acessibilidade</mark></h1>
    <p class="sub">Gerado em ${esc(data)} · ${lista.length} página${lista.length > 1 ? 's' : ''} analisada${lista.length > 1 ? 's' : ''}</p>
  </header>
  ${lista.map(secaoPagina).join('\n')}
  <section class="janela nota">
    <div class="barra"><span></span><span></span><span></span><b>LEIA-ME.TXT</b></div>
    <div class="miolo">
      <h2>Sobre este relatório</h2>
      <p>As verificações automáticas encontram por volta de um terço dos problemas de acessibilidade. Elas não substituem testar com teclado, com leitor de tela (NVDA, TalkBack, VoiceOver) e, principalmente, com pessoas com deficiência.</p>
      <p>O índice de 0 a 100 é só uma referência para comparar versões da mesma página. Ele não é uma certificação.</p>
      <p>Regras: axe-core ${esc(lista[0].versaoAxe || '')} (WCAG 2.2 A/AA e boas práticas) e checagens próprias de ordem de foco, foco visível, títulos, textos alternativos e idioma.</p>
    </div>
  </section>
</main>
<footer class="rodape">
  <span>JÚLIA ROBERTA QUOOS ALVES</span>
  <a class="pilula" href="https://ohtopico.com.br">ohtopico.com.br</a>
</footer>
</body>
</html>`;
}

function secaoPagina(r, i) {
  const f = faixa(r.indice);
  const total = r.problemas.length;
  const nomeArquivo = (() => {
    try { const u = new URL(r.endereco); return (u.hostname || u.pathname.split('/').pop() || 'pagina').toUpperCase(); }
    catch { return 'PAGINA'; }
  })();

  return `<section class="janela pagina" aria-labelledby="p${i}">
  <div class="barra"><span></span><span></span><span></span><b>${esc(nomeArquivo)}</b></div>
  <div class="miolo">
    <h2 id="p${i}">${esc(r.tituloPagina || 'Página sem título')}</h2>
    <p class="endereco"><a href="${esc(r.endereco)}">${esc(r.endereco)}</a> · tela de ${esc(r.tela)}</p>

    <div class="resumo">
      <div class="indice ${f.classe}" role="img" aria-label="Índice ${r.indice} de 100, ${f.nome}">
        <strong>${r.indice}</strong><span>de 100</span><em>${f.nome}</em>
      </div>
      <ul class="contagem" aria-label="Problemas por gravidade">
        ${Object.entries(r.contagem).map(([k, n]) => `<li class="${CLASSE[k]}"><strong>${n}</strong> ${IMPACTO[k].nome}${n === 1 ? '' : 's'}</li>`).join('')}
      </ul>
      <ul class="fatos">
        <li><b>Idioma:</b> ${r.idioma ? `<code>${esc(r.idioma)}</code>` : 'não declarado'}</li>
        <li><b>Imagens:</b> ${r.imagens.total} (${r.imagens.semAlt} sem texto alternativo)</li>
        <li><b>Títulos:</b> ${r.titulos.length} (${r.titulos.filter((t) => t.nivel === 1).length} h1)</li>
        <li><b>Paradas do Tab:</b> ${r.ordemFoco.length}${r.ordemFocoCompleta ? '' : '+ (limite atingido)'}</li>
      </ul>
    </div>

    <h3>${total ? `${total} problema${total > 1 ? 's' : ''} encontrado${total > 1 ? 's' : ''}` : 'Nenhum problema encontrado pelas checagens automáticas'}</h3>
    ${r.problemas.map(cartaoProblema).join('\n')}

    ${r.imagemOrdem ? `<h3>Ordem do teclado (Tab)</h3>
    <p>Os números mostram a sequência em que o foco passa quando se aperta Tab. Em <span class="tag-ok">verde</span>, sem problemas; em <span class="tag-erro">vermelho</span>, foco invisível, salto para trás ou tabindex positivo.</p>
    <figure class="captura"><img src="data:image/jpeg;base64,${r.imagemOrdem}" alt="Captura da página com a ordem de foco numerada de 1 a ${r.ordemFoco.length}."></figure>
    <details><summary>Lista da ordem do Tab</summary><ol class="ordem">${r.ordemFoco.map((o) => `<li class="${o.problema ? 'erro' : ''}"><code>&lt;${esc(o.tag)}&gt;</code> ${esc(o.nome) || '<i>sem nome</i>'}${o.focoVisivel ? '' : ' · <b>foco invisível</b>'}</li>`).join('')}</ol></details>` : ''}

    ${r.titulos.length ? `<h3>Sumário de títulos</h3>
    <p>É assim que quem usa leitor de tela "vê" a estrutura da página.</p>
    <ul class="titulos">${r.titulos.map((t) => `<li style="--n:${t.nivel - 1}"><span class="pilula mini">h${t.nivel}</span> ${esc(t.texto) || '<i>vazio</i>'}</li>`).join('')}</ul>` : ''}

    ${r.paraConferir.length ? `<h3>Para conferir manualmente</h3>
    <p>Itens que a ferramenta não conseguiu decidir sozinha.</p>
    <ul class="conferir">${r.paraConferir.map((c) => `<li>${esc(c.titulo)} <span class="pilula mini">${c.ocorrencias}×</span></li>`).join('')}</ul>` : ''}
  </div>
</section>`;
}

function cartaoProblema(p) {
  const MAX = 8;
  const oc = p.ocorrencias;
  return `<article class="problema ${CLASSE[p.impacto]}">
  <header>
    <span class="pilula selo">${IMPACTO[p.impacto].nome}</span>
    <h4>${esc(p.titulo)}</h4>
    ${p.criterio ? `<span class="pilula mini">${esc(p.criterio)}</span>` : ''}
    ${oc.length ? `<span class="pilula mini">${oc.length}×</span>` : ''}
  </header>
  ${p.porque ? `<p><b>Por que importa:</b> ${esc(p.porque)}</p>` : p.descricao ? `<p>${esc(p.descricao)}</p>` : ''}
  ${p.corrigir ? `<p><b>Como corrigir:</b> <mark>${esc(p.corrigir)}</mark></p>` : ''}
  ${oc.length ? `<details><summary>Onde aparece</summary><ul class="ocorrencias">${oc.slice(0, MAX).map((o) => `<li>${o.html ? `<code>${esc(o.html)}</code>` : ''}${o.resumo ? `<p>${esc(o.resumo).replace(/\n/g, '<br>')}</p>` : ''}</li>`).join('')}${oc.length > MAX ? `<li>… e mais ${oc.length - MAX}</li>` : ''}</ul></details>` : ''}
  ${p.saibaMais ? `<p class="mais"><a href="${esc(p.saibaMais)}">Saiba mais sobre a regra <code>${esc(p.regra)}</code></a></p>` : ''}
</article>`;
}

/** Resumo curto em texto, para o terminal. */
export function gerarTexto(r) {
  const linhas = [
    `${r.tituloPagina || r.endereco}`,
    `  ${r.endereco}`,
    `  Índice: ${r.indice}/100 · ${Object.entries(r.contagem).map(([k, n]) => `${n} ${IMPACTO[k].nome}`).join(' · ')}`,
  ];
  for (const p of r.problemas) {
    linhas.push(`  [${IMPACTO[p.impacto].nome}] ${p.titulo}${p.ocorrencias.length ? ` (${p.ocorrencias.length}×)` : ''}`);
  }
  return linhas.join('\n');
}

const CSS = `
:root{--papel:#fff;--papel2:#f4f4f2;--tinta:#111;--tinta2:#4a4a4a;--linha:#d9d9d6;--verde:#166c40;--verde-suave:#e3f1e8;--cinza:#545a56;--vermelho:#c21f3a;--vermelho-suave:#fbe6ea;--grifo:#fff36b;--ambar-suave:#fff8c9}
*{box-sizing:border-box}
html{color-scheme:light}
body{margin:0;background:var(--papel2);background-image:radial-gradient(#cfcfca 1.2px,transparent 1.2px);background-size:18px 18px;color:var(--tinta);font:16px/1.6 Lexend,system-ui,sans-serif}
main{max-width:980px;margin:0 auto;padding:32px 16px}
h1,h2,h3{font-family:Sniglet,Lexend,sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.15}
h1{font-size:clamp(2rem,6vw,3.2rem);margin:.3em 0}
h2{font-size:1.5rem;margin:0 0 .2em}
h3{font-size:1.1rem;margin:2em 0 .6em}
h4{font-size:1rem;margin:0;flex:1 1 220px}
mark{background:var(--grifo);color:inherit;padding:0 .15em}
a{color:var(--verde);text-underline-offset:3px}
code{font:13px/1.45 ui-monospace,Menlo,Consolas,monospace;background:var(--papel2);padding:.1em .35em;border-radius:6px;word-break:break-all}
.pular{position:absolute;left:-999px}.pular:focus{left:16px;top:16px;background:var(--grifo);padding:8px 14px;border:2px solid var(--tinta);border-radius:999px;z-index:9}
:focus-visible{outline:3px solid var(--tinta);outline-offset:2px}
.capa{margin-bottom:28px}.sub{color:var(--tinta2);margin:0}
.pilula{display:inline-block;border:1.5px solid var(--tinta);border-radius:999px;padding:.15em .8em;background:var(--papel);font-size:.85rem;font-weight:600;text-decoration:none;color:var(--tinta)}
.pilula.mini{font-size:.75rem;padding:.05em .6em;font-weight:400}
.janela{background:var(--papel);border:2.5px solid var(--tinta);border-radius:28px;box-shadow:8px 8px 0 var(--tinta);margin:0 0 36px;overflow:hidden}
.barra{display:flex;align-items:center;gap:8px;padding:10px 18px;border-bottom:2.5px solid var(--tinta);background:var(--papel2)}
.barra span{width:13px;height:13px;border-radius:50%;border:1.5px solid var(--tinta);background:var(--papel)}
.barra span:nth-child(1){background:var(--grifo)}.barra span:nth-child(2){background:var(--verde-suave)}
.barra b{margin-left:8px;font:800 .8rem Sniglet,sans-serif;letter-spacing:.12em}
.miolo{padding:24px clamp(16px,4vw,36px) 32px}
.endereco{margin:0 0 20px;color:var(--tinta2)}.endereco a{word-break:break-all}
.resumo{display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:start}
@media (max-width:640px){.resumo{grid-template-columns:1fr}}
.indice{grid-row:span 2;width:150px;height:150px;border:2.5px solid var(--tinta);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:5px 5px 0 var(--tinta);text-align:center}
.indice strong{font:800 3rem/1 Sniglet,sans-serif}.indice span{font-size:.8rem;color:var(--tinta2)}.indice em{font-style:normal;font-size:.75rem;font-weight:600;max-width:110px;line-height:1.2;margin-top:2px}
.indice.bom{background:var(--verde-suave)}.indice.medio{background:var(--ambar-suave)}.indice.ruim{background:var(--vermelho-suave)}
.contagem,.fatos{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.contagem li{border:1.5px solid var(--tinta);border-radius:999px;padding:.2em .9em;background:var(--papel)}
.contagem strong{font-family:Sniglet,sans-serif;font-size:1.1rem}
.contagem .critico,.contagem .grave{background:var(--vermelho-suave)}.contagem .moderado{background:var(--ambar-suave)}.contagem .leve{background:var(--papel2)}
.fatos li{font-size:.9rem;color:var(--tinta2)}.fatos li:not(:last-child)::after{content:"·";margin-left:8px}
.problema{border:2px solid var(--tinta);border-left-width:10px;border-radius:18px;padding:14px 18px;margin:14px 0;background:var(--papel)}
.problema.critico,.problema.grave{border-left-color:var(--vermelho)}.problema.moderado{border-left-color:#d6b800}.problema.leve{border-left-color:var(--cinza)}
.problema header{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:6px}
.problema p{margin:.4em 0}
.selo{text-transform:uppercase;font-size:.7rem;letter-spacing:.08em}
.critico .selo,.grave .selo{background:var(--vermelho);color:#fff;border-color:var(--vermelho)}.moderado .selo{background:var(--grifo)}.leve .selo{background:var(--papel2)}
details{margin:.5em 0}summary{cursor:pointer;font-weight:600}
.ocorrencias{padding-left:1.1em}.ocorrencias li{margin:.5em 0}.ocorrencias p{font-size:.85rem;color:var(--tinta2);margin:.2em 0}
.mais{font-size:.85rem}
.captura{margin:0;border:2px solid var(--tinta);border-radius:18px;overflow:auto;max-height:720px;background:var(--papel2)}
.captura img{display:block;width:100%;height:auto}
.tag-ok{color:var(--verde);font-weight:600}.tag-erro{color:var(--vermelho);font-weight:600}
.ordem li.erro{color:var(--vermelho)}
.titulos{list-style:none;padding:0}.titulos li{padding-left:calc(var(--n)*22px);margin:.25em 0}
.nota .miolo p{color:var(--tinta2)}
.rodape{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;max-width:980px;margin:0 auto;padding:8px 16px 40px;font:800 .85rem Sniglet,sans-serif;letter-spacing:.12em}
@media print{body{background:#fff}.janela{box-shadow:none;break-inside:avoid-page}.captura{max-height:none}details{display:block}details>summary{display:none}details>*{display:block}}
`;
