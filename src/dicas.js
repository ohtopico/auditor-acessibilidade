// Explicações curtas, em português simples, para as regras mais comuns.
// O axe-core já traz os textos oficiais traduzidos (locales/pt_BR.json);
// aqui ficam o "por que importa" e o "como corrigir" pensados para quem
// não é especialista.

export const DICAS = {
  'color-contrast': {
    porque: 'Pessoas com baixa visão, daltonismo ou usando o celular no sol não conseguem ler texto com pouco contraste.',
    corrigir: 'Escureça o texto ou clareie o fundo até chegar a 4,5:1 (texto normal) ou 3:1 (texto grande, a partir de 24px ou 19px em negrito).',
  },
  'image-alt': {
    porque: 'Leitores de tela não enxergam a imagem: sem texto alternativo, a pessoa cega ouve só "imagem" ou o nome do arquivo.',
    corrigir: 'Adicione alt="..." descrevendo o que a imagem comunica. Se for só decoração, use alt="" (vazio).',
  },
  'input-image-alt': {
    porque: 'Um botão feito de imagem sem texto alternativo fica mudo para leitores de tela.',
    corrigir: 'Coloque alt="..." dizendo o que o botão faz, por exemplo alt="Pesquisar".',
  },
  'label': {
    porque: 'Sem rótulo, quem usa leitor de tela não sabe o que digitar no campo.',
    corrigir: 'Ligue um <label for="id-do-campo"> ao campo, ou use aria-label quando não houver texto visível.',
  },
  'select-name': {
    porque: 'Uma lista de opções sem nome não diz para que serve.',
    corrigir: 'Ligue um <label> ao <select> ou use aria-label.',
  },
  'link-name': {
    porque: 'Um link sem texto (por exemplo, só um ícone) é anunciado apenas como "link".',
    corrigir: 'Coloque texto no link, um alt na imagem de dentro ou aria-label="Destino do link".',
  },
  'button-name': {
    porque: 'Um botão sem nome é anunciado apenas como "botão", sem dizer o que faz.',
    corrigir: 'Escreva um texto no botão ou use aria-label="O que o botão faz".',
  },
  'html-has-lang': {
    porque: 'Sem o idioma declarado, o leitor de tela pode ler o português com pronúncia de outra língua.',
    corrigir: 'Use <html lang="pt-BR">.',
  },
  'html-lang-valid': {
    porque: 'Um código de idioma inválido tem o mesmo efeito de não ter idioma.',
    corrigir: 'Use um código válido, como lang="pt-BR".',
  },
  'document-title': {
    porque: 'O título da página é a primeira coisa que o leitor de tela anuncia e é o nome da aba.',
    corrigir: 'Coloque um <title> que descreva a página.',
  },
  'heading-order': {
    porque: 'Quem usa leitor de tela navega pelos títulos como se fosse um sumário; pular níveis confunde a estrutura.',
    corrigir: 'Siga a ordem h1 → h2 → h3, sem pular níveis. Use CSS para mudar o tamanho, não o nível do título.',
  },
  'page-has-heading-one': {
    porque: 'O título principal (h1) diz do que a página trata.',
    corrigir: 'Coloque um único <h1> com o assunto principal da página.',
  },
  'region': {
    porque: 'Regiões (cabeçalho, navegação, conteúdo principal, rodapé) permitem pular direto para o que interessa.',
    corrigir: 'Envolva o conteúdo em <header>, <nav>, <main> e <footer>.',
  },
  'landmark-one-main': {
    porque: 'Sem <main>, não há atalho para pular direto ao conteúdo principal.',
    corrigir: 'Envolva o conteúdo principal em <main>.',
  },
  'meta-viewport': {
    porque: 'Bloquear o zoom impede pessoas com baixa visão de ampliar a página no celular.',
    corrigir: 'Remova user-scalable=no e maximum-scale=1 da tag <meta name="viewport">.',
  },
  'list': {
    porque: 'Listas mal formadas não são anunciadas como listas ("lista com 5 itens").',
    corrigir: 'Dentro de <ul> e <ol> use apenas <li> como filhos diretos.',
  },
  'listitem': {
    porque: 'Um <li> fora de lista perde o significado de item.',
    corrigir: 'Coloque os <li> dentro de <ul> ou <ol>.',
  },
  'frame-title': {
    porque: 'Um iframe sem título (vídeo, mapa) é anunciado sem dizer o que contém.',
    corrigir: 'Adicione title="..." ao <iframe>, por exemplo title="Vídeo da aula".',
  },
  'duplicate-id-aria': {
    porque: 'IDs repetidos fazem rótulos e descrições apontarem para o elemento errado.',
    corrigir: 'Use um id diferente em cada elemento.',
  },
  'aria-hidden-focus': {
    porque: 'Um elemento escondido do leitor de tela mas que recebe foco deixa a pessoa "perdida" num lugar mudo.',
    corrigir: 'Remova aria-hidden ou tire o elemento da ordem de foco (tabindex="-1").',
  },
  'tabindex': {
    porque: 'tabindex maior que 0 bagunça a ordem natural do teclado.',
    corrigir: 'Use tabindex="0" ou reorganize o HTML para que a ordem do código seja a ordem de leitura.',
  },
  'link-in-text-block': {
    porque: 'Links que se distinguem só pela cor somem para quem não enxerga cores.',
    corrigir: 'Sublinhe os links dentro de parágrafos.',
  },
  'target-size': {
    porque: 'Botões e links muito pequenos ou colados uns nos outros são difíceis de acertar para quem tem tremor, mobilidade reduzida ou usa o celular.',
    corrigir: 'Deixe cada alvo com pelo menos 24×24 px (o ideal é 44×44 px) ou com espaço livre ao redor.',
  },
  'video-caption': {
    porque: 'Pessoas surdas não acompanham vídeos sem legenda.',
    corrigir: 'Adicione legendas com <track kind="captions">.',
  },
};

// Dicas das checagens próprias (que o axe-core não faz).
export const DICAS_PROPRIAS = {
  'foco-invisivel': {
    titulo: 'Foco do teclado invisível',
    porque: 'Quem navega pelo teclado (Tab) precisa ver onde está. Sem contorno de foco, a pessoa fica "às cegas".',
    corrigir: 'Não remova o outline. Se quiser mudar o visual, use :focus-visible { outline: 3px solid #111; outline-offset: 2px; }.',
    wcag: 'WCAG 2.4.7',
  },
  'salto-ordem': {
    titulo: 'Ordem de foco salta para trás',
    porque: 'O Tab deveria seguir a ordem de leitura (de cima para baixo, da esquerda para a direita). Saltos fazem a pessoa perder o contexto.',
    corrigir: 'Deixe a ordem do HTML igual à ordem visual. Evite reordenar com CSS (order, flex-direction: reverse, position) e evite tabindex positivo.',
    wcag: 'WCAG 2.4.3',
  },
  'tabindex-positivo': {
    titulo: 'tabindex positivo',
    porque: 'Elementos com tabindex maior que 0 passam na frente de todos os outros, fora da ordem de leitura.',
    corrigir: 'Troque por tabindex="0" ou remova o atributo.',
    wcag: 'WCAG 2.4.3',
  },
  'sem-h1': {
    titulo: 'Página sem título principal (h1)',
    porque: 'O h1 diz do que a página trata e é o primeiro ponto do "sumário" de quem usa leitor de tela.',
    corrigir: 'Coloque um <h1> com o assunto principal.',
    wcag: 'WCAG 1.3.1',
  },
  'varios-h1': {
    titulo: 'Mais de um h1',
    porque: 'Vários títulos principais deixam a estrutura ambígua.',
    corrigir: 'Mantenha um h1 e transforme os outros em h2.',
    wcag: 'Boa prática',
  },
  'nivel-pulado': {
    titulo: 'Nível de título pulado',
    porque: 'Pular de h2 para h4, por exemplo, sugere que falta uma seção.',
    corrigir: 'Siga a sequência h1 → h2 → h3 sem pular níveis.',
    wcag: 'Boa prática',
  },
  'alt-suspeito': {
    titulo: 'Texto alternativo pouco útil',
    porque: 'Textos como "imagem", "foto" ou o nome do arquivo não dizem nada sobre o conteúdo.',
    corrigir: 'Descreva o que a imagem mostra e por que ela está ali.',
    wcag: 'WCAG 1.1.1',
  },
  'idioma-diferente': {
    titulo: 'Idioma declarado não é português',
    porque: 'O conteúdo parece estar em português, mas o lang diz outra língua: o leitor de tela vai pronunciar errado.',
    corrigir: 'Use <html lang="pt-BR">.',
    wcag: 'WCAG 3.1.1',
  },
  'sem-foco': {
    titulo: 'Nenhum elemento recebe foco pelo teclado',
    porque: 'Se o Tab não chega em nenhum link ou botão, a página não pode ser usada sem mouse.',
    corrigir: 'Use elementos nativos (<a href>, <button>, <input>) em vez de <div onclick>.',
    wcag: 'WCAG 2.1.1',
  },
};

export const IMPACTO = {
  critical: { nome: 'crítico', peso: 10, ordem: 0 },
  serious: { nome: 'grave', peso: 6, ordem: 1 },
  moderate: { nome: 'moderado', peso: 3, ordem: 2 },
  minor: { nome: 'leve', peso: 1, ordem: 3 },
};

// "wcag143" -> "WCAG 1.4.3"; "wcag2aa" -> "WCAG 2 AA"
export function nomeCriterio(tags = []) {
  const crit = tags
    .map((t) => /^wcag(\d)(\d)(\d+)$/.exec(t))
    .filter(Boolean)
    .map((m) => `WCAG ${m[1]}.${m[2]}.${m[3]}`);
  if (crit.length) return crit.join(', ');
  if (tags.includes('best-practice')) return 'Boa prática';
  return '';
}

// Regras que ainda não têm tradução no pt_BR do axe-core.
export const TITULOS_FALTANTES = {
  'target-size': 'Áreas de toque devem ter pelo menos 24×24 px ou espaço suficiente ao redor',
  'aria-braille-equivalent': 'Atributos ARIA de braille devem ter um equivalente sem braille',
  'aria-conditional-attr': 'Atributos ARIA devem ser usados como indicado para o papel do elemento',
  'aria-deprecated-role': 'Papéis ARIA obsoletos não devem ser usados',
  'aria-prohibited-attr': 'Elementos devem usar apenas atributos ARIA permitidos',
  'meta-refresh-no-exceptions': 'A página não deve se atualizar ou redirecionar sozinha',
  'summary-name': 'Elementos <summary> devem ter um texto discernível',
};

// Checagens próprias que repetem uma regra do axe: se o axe já acusou,
// a nossa não aparece de novo.
export const EQUIVALENTES = {
  'tabindex-positivo': 'tabindex',
  'sem-h1': 'page-has-heading-one',
};
