/* Testes da exportacao da folha de resultados como imagem.

   A folha exportada viaja sozinha: o SVG gerado nao tem acesso a
   css/styles.css. Por isso o modulo repete as regras dos desenhos em
   ESTILO_DESENHOS — e o primeiro teste daqui existe justamente para que essa
   copia nao fique para tras quando a folha de estilo mudar.

   A montagem da folha e exercitada com um DOM de mentira, pequeno o
   suficiente para caber aqui e fiel a estrutura do relatorio real. */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(raiz, 'css/styles.css'), 'utf8');

function carregar(arquivos) {
  const escopo = {};
  for (const f of arquivos) {
    new Function('globalThis', fs.readFileSync(path.join(raiz, f), 'utf8'))(escopo);
  }
  return escopo.FS;
}

const Exp = carregar(['js/exportar.js']).Exportar;

/* ------------------------------------------------------------------
   1. as regras dos desenhos nao podem divergir da folha de estilo */

/* variaveis do :root, para resolver os var(--x) da folha de estilo */
function variaveis() {
  const bloco = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
  const vars = new Map();
  for (const m of bloco.matchAll(/(--[\w-]+):\s*([^;]+);/g)) vars.set(m[1], m[2].trim());
  for (const [k, v] of vars) {                       /* --teal: var(--painel-cab) */
    vars.set(k, v.replace(/var\((--[\w-]+)\)/g, (_, nome) => vars.get(nome) || _));
  }
  return vars;
}

/* '.dg-as { fill: var(--vermelho); }' -> ['.dg-as', 'fill:#c00000'] */
function regras(texto, vars) {
  const mapa = new Map();
  for (const m of texto.matchAll(/(\.dg[\w .-]*?)\s*\{([^}]*)\}/g)) {
    const decls = m[2]
      .replace(/var\((--[\w-]+)\)/g, (todo, nome) => (vars ? vars.get(nome) || todo : todo))
      .split(';')
      .map((d) => d.replace(/\s+/g, '').trim())
      .filter(Boolean)
      .sort();
    mapa.set(m[1].trim(), decls.join(';'));
  }
  return mapa;
}

test('ESTILO_DESENHOS reproduz as regras .dg da folha de estilo', () => {
  const naFolha = regras(css, variaveis());
  const noExport = regras(Exp.ESTILO_DESENHOS, null);

  /* .dg sozinha so define a fonte, que a folha exportada declara de outro
     jeito (um text{} global): fica de fora da comparacao */
  naFolha.delete('.dg');

  assert.ok(naFolha.size > 30, `poucas regras .dg na folha de estilo: ${naFolha.size}`);
  for (const [seletor, decls] of naFolha) {
    assert.ok(noExport.has(seletor), 'regra fora do ESTILO_DESENHOS: ' + seletor);
    assert.strictEqual(noExport.get(seletor), decls,
      seletor + ' divergiu entre css/styles.css e js/exportar.js');
  }
  for (const seletor of noExport.keys()) {
    assert.ok(naFolha.has(seletor), 'regra sobrando no ESTILO_DESENHOS: ' + seletor);
  }
});

test('toda classe usada pelos desenhos tem regra no ESTILO_DESENHOS', () => {
  /* alguns desenhos montam o atributo class por concatenacao, entao a busca
     e pelo proprio nome da classe onde quer que ele apareca no codigo */
  const usadas = new Set();
  for (const f of ['js/desenho-equilibrio.js', 'js/desenho-dominios.js',
    'js/desenho-cisalhamento.js']) {
    const src = fs.readFileSync(path.join(raiz, f), 'utf8');
    for (const m of src.matchAll(/\bdg-[a-z0-9-]+/g)) usadas.add(m[0]);
  }
  assert.ok(usadas.size > 20, `poucas classes encontradas: ${usadas.size}`);
  for (const c of usadas) {
    assert.ok(Exp.ESTILO_DESENHOS.includes('.' + c + '{'),
      'classe sem regra na folha exportada: .' + c);
  }
});

test('o ESTILO_DESENHOS nao depende de variaveis da pagina', () => {
  assert.ok(!Exp.ESTILO_DESENHOS.includes('var(--'),
    'a folha exportada viaja sozinha: as cores precisam estar resolvidas');
});

/* ------------------------------------------------------------------
   2. montagem da folha, sobre um DOM de mentira */

function svgFalso(texto) {
  return {
    getAttribute: (a) => (new RegExp(a + '="([^"]*)"').exec(texto) || [])[1] || null,
    innerHTML: texto.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
  };
}

function el(tag, o) {
  o = o || {};
  return {
    tagName: tag.toUpperCase(),
    id: o.id || '',
    classList: { contains: (c) => (o.classes || []).indexOf(c) >= 0 },
    textContent: o.texto || '',
    children: o.filhos || [],
    offsetParent: o.oculto ? null : {},
    value: o.value,
    querySelector: () => o.svg || null,
    querySelectorAll: () => (o.linhas || []).map(paragrafo)
  };
}

/* um <p> de mentira: 'A|s|,ado = 1,68' com o pipe marcando o subscrito */
function paragrafo(fonte) {
  const partes = String(fonte).split('|');
  return {
    tagName: 'P',
    textContent: partes.join(''),
    childNodes: partes.map((t, i) => (i % 2
      ? { nodeType: 1, tagName: 'SUB', classList: { contains: () => false },
          childNodes: [{ nodeType: 3, nodeValue: t }] }
      : { nodeType: 3, nodeValue: t }))
  };
}

/* monta um documento com a mesma estrutura do relatorio real */
function documentoFalso(tema, titulo, filhos, id) {
  const campos = Object.assign({ norma: '2023' }, id || {});
  const mapa = { relatorio: el('main', { id: 'relatorio', filhos: filhos }) };
  for (const k of Object.keys(campos)) mapa[k] = el('input', { value: campos[k] });
  mapa.relatorio.children = [el('h1', { texto: titulo })].concat(filhos);
  /* a frase que cada pagina declara sai do HTML de verdade */
  const pagina = titulo.startsWith('Flexão') ? 'index.html' : 'cisalhamento/index.html';
  const descricao = (/data-descricao="([^"]+)"/
    .exec(fs.readFileSync(path.join(raiz, pagina), 'utf8')) || [])[1] || '';
  mapa.relatorio.getAttribute = (a) => (a === 'data-descricao' ? descricao : null);
  return {
    documentElement: { getAttribute: () => tema },
    getElementById: (i) => mapa[i] || null
  };
}

function comDocumento(doc, fn) {
  const antes = global.document;
  global.document = doc;
  try { return fn(); } finally {
    if (antes === undefined) delete global.document; else global.document = antes;
  }
}

/* --- flexao --- */
function folhaFlexao(tema, id) {
  const FS = carregar(['js/norma.js', 'js/flexao.js', 'js/desenho-equilibrio.js',
    'js/desenho-dominios.js']);
  const r = FS.Flexao.dimensionar({
    fck: 30, fyk: 500, tipoAco: 'A', gammaC: 1.4, gammaS: 1.15, gammaF: 1.4,
    secao: 'RET', bw: 20, d: 45, dl: 4, Msd: 3.22,
    armaduraDupla: true, usarArmaduraMinima: true
  });
  const filhos = [
    el('h2', { texto: 'Resultados' }),
    el('div', { id: 'repAvisos', filhos: [el('p', { classes: ['aviso'], texto: 'atenção' })] }),
    el('div', { classes: ['bloco'], linhas: ['A|s| = 1,68 cm2', 'x = 2,5 cm'] }),
    el('h2', { texto: 'Armadura' }),
    el('div', { classes: ['bloco'], linhas: ['A|s,calc| = 1,68 cm²', 'A|s,mín| = 1,47 cm²',
      'A|s,ado| = 1,68 cm²', 'A|s|′ = 0,00 cm²'] }),
    el('div', { classes: ['bloco', 'destaque'],
      linhas: ['A|s,ado| = 1,68 cm² > A|s,mín| = 1,47 cm² < A|s,calc| = 1,68 cm²'] }),
    el('h2', { texto: 'Equilíbrio' }),
    el('div', { classes: ['figura'], svg: svgFalso(FS.DesenhoEquilibrio.desenhar(r)) }),
    el('h2', { texto: 'Deformação/Domínios' }),
    el('div', { classes: ['figura'], svg: svgFalso(FS.DesenhoDominios.desenhar(r)) }),
    el('hr', {}),
    el('h2', { texto: 'Dados' }),
    el('h3', { texto: 'Geometria' }),
    el('div', { classes: ['bloco'],
      linhas: ['bw = 20 cm', 'd = 45 cm', 'h = 49 cm', 'Seção retangular', 'd′ = 4 cm'] }),
    el('p', { classes: ['rodape'], texto: 'não deve sair na folha' })
  ];
  return comDocumento(documentoFalso(tema, 'Flexão simples', filhos, id), Exp.montarSvg);
}

/* --- cortante/torcao, com um bloco escondido pelo modo --- */
function folhaCisalhamento(tema) {
  const FS = carregar(['js/norma.js', 'js/cisalhamento.js', 'js/desenho-cisalhamento.js']);
  const r = FS.Cisalhamento.calcular({
    fck: 30, fyk: 500, gammaC: 1.4, gammaS: 1.15, gammaF: 1.4,
    bw: 40, bwMin: 40, h: 50, d: 47.5, c1: 2.5,
    modelo: 'I', theta: 45, alpha: 90, refMin: 'bw/2',
    Vsd: 7, Tsd: 6.96, diamEstribo: 10, nRamos: 2, modo: 'CORTANTE'
  });
  const filhos = [
    el('h2', { texto: 'Resultados' }),
    el('div', { id: 'repAvisos', filhos: [] }),
    el('div', { classes: ['so-v'], filhos: [
      el('h3', { texto: 'Cortante' }),
      el('div', { classes: ['bloco'], linhas: ['VSd = 7,00 tf', 'VRd2 = 91,8 tf'] })
    ] }),
    /* modo torção desligado: nao pode aparecer na folha */
    el('div', { classes: ['so-t'], oculto: true, filhos: [
      el('h3', { texto: 'Torção' }),
      el('div', { classes: ['bloco'], linhas: ['NAO DEVE SAIR'] })
    ] }),
    el('h2', { texto: 'Seção' }),
    el('div', { classes: ['figura'], svg: svgFalso(FS.DesenhoCisalhamento.secao(r)) }),
    el('h2', { texto: 'Bielas comprimidas' }),
    el('div', { classes: ['figura'], svg: svgFalso(FS.DesenhoCisalhamento.bielas(r)) })
  ];
  return comDocumento(documentoFalso(tema, 'Cortante', filhos), Exp.montarSvg);
}

test('a folha e um SVG valido nas duas ferramentas e nos dois temas', () => {
  for (const [nome, svg] of [
    ['flexão/clássico', folhaFlexao('classico')],
    ['flexão/corporativo', folhaFlexao('corporativo')],
    ['cortante/clássico', folhaCisalhamento('classico')],
    ['cortante/corporativo', folhaCisalhamento('corporativo')]
  ]) {
    assert.ok(svg.startsWith('<svg xmlns='), nome + ': falta o namespace do SVG');
    assert.ok(svg.endsWith('</svg>'), nome + ': SVG truncado');
    assert.ok(!/NaN|undefined|Infinity/.test(svg), nome + ': valor inválido — ' +
      (svg.match(/[^ "]*(NaN|undefined|Infinity)[^ "]*/) || [''])[0]);
    /* dimensoes reais, do jeito que a rasterizacao espera encontrar */
    const m = /^<svg[^>]*\swidth="(\d+)"\sheight="(\d+)"/.exec(svg);
    assert.ok(m, nome + ': a folha precisa declarar largura e altura inteiras');
    assert.strictEqual(Number(m[1]), 760, nome);
    assert.ok(Number(m[2]) > 600, nome + ': folha curta demais — ' + m[2]);
    /* tags abertas e fechadas em numero igual */
    const abre = (svg.match(/<svg[ >]/g) || []).length;
    const fecha = (svg.match(/<\/svg>/g) || []).length;
    assert.strictEqual(abre, fecha, nome + ': <svg> aninhado sem fechar');
  }
});

/* Colada no Word, a imagem e reduzida ate a largura util da pagina. O que
   define se o texto fica legivel e a razao entre a fonte e a largura da
   folha — 1,8 % dela da por volta de 9 pt numa pagina A4 com margens
   normais. Este teste existe para que a folha nao volte a engordar sem que
   as fontes acompanhem. */
test('o texto da folha e grande o bastante para ser lido depois de colado', () => {
  const svg = folhaFlexao('classico', { idProjeto: 'P-99', idElemento: 'V1' });
  const larg = Number(/^<svg[^>]*\swidth="(\d+)"/.exec(svg)[1]);
  const tamanhos = [...svg.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));

  assert.ok(tamanhos.length > 20, `poucos textos na folha: ${tamanhos.length}`);
  const pt = (t) => (t / larg) * 16 /* cm úteis da página */ / 2.54 * 72;

  /* o grosso da folha — resultados, dados, identificacao — precisa sair
     confortavel. Rotulos secundarios (rodape, legenda do quadro de
     identificacao) podem ser menores, mas nao microscopicos. */
  const confortaveis = tamanhos.filter((t) => pt(t) >= 8.5).length;
  assert.ok(confortaveis / tamanhos.length >= 0.7,
    `so ${(100 * confortaveis / tamanhos.length).toFixed(0)} % dos textos sairiam com 8,5 pt ou mais`);

  const menor = Math.min(...tamanhos);
  assert.ok(pt(menor) >= 7, `o menor texto da folha sairia com ${pt(menor).toFixed(1)} pt`);

  /* e a folha nao pode alargar sem que as fontes acompanhem */
  assert.ok(larg <= 900, `folha larga demais (${larg}): o Word encolhe tudo`);
});

test('a folha traz a identificacao e o titulo', () => {
  const svg = folhaFlexao('classico', { idProjeto: 'Plataforma P-99', idElemento: 'V12' });
  assert.ok(svg.includes('IDENTIFICAÇÃO'));
  for (const t of ['Plataforma P-99', 'V12', 'Flexão simples', 'Projeto', 'Elemento']) {
    assert.ok(svg.includes(t), 'faltou na folha: ' + t);
  }
  /* o quadro ficou so com projeto e elemento */
  for (const t of ['Responsável', 'Revisão', '>Data<', 'ABNT NBR 6118:']) {
    assert.ok(!svg.includes(t), 'saiu do quadro mas continua na folha: ' + t);
  }
  /* campos em branco viram travessao, e nao 'undefined' */
  assert.ok(folhaFlexao('classico').includes('—'));
});

test('cada ferramenta declara na folha o que ela dimensiona', () => {
  assert.ok(folhaFlexao('classico').includes(
    'Dimensionamento armaduras longitudinais em concreto armado.'));
  assert.ok(folhaCisalhamento('classico').includes(
    'Dimensionamento de armaduras transversais em concreto armado.'));
});

test('a frase de cada ferramenta vem do proprio HTML, e nao do codigo', () => {
  const frases = {
    'index.html': 'Dimensionamento armaduras longitudinais em concreto armado.',
    'cisalhamento/index.html': 'Dimensionamento de armaduras transversais em concreto armado.'
  };
  for (const [pagina, frase] of Object.entries(frases)) {
    const h = fs.readFileSync(path.join(raiz, pagina), 'utf8');
    assert.ok(h.includes('data-descricao="' + frase + '"'), pagina + ': faltou a frase');
  }
});

test('a folha leva os desenhos e o texto do relatorio, mas nao o rodape da tela', () => {
  const svg = folhaFlexao('classico');
  assert.ok(svg.includes('class="dg"'), 'o desenho perdeu a classe que casa com o CSS');
  assert.ok(svg.includes('>A</tspan>') && svg.includes('>s</tspan>'),
    'faltou o texto dos resultados');
  assert.ok(svg.includes('atenção'), 'faltou o aviso');
  assert.ok(!svg.includes('não deve sair na folha'), 'o rodapé da tela vazou para a folha');
  assert.ok(svg.includes('conferir por profissional habilitado'), 'faltou o rodapé da folha');
});

test('blocos escondidos pelo modo ficam de fora da folha', () => {
  const svg = folhaCisalhamento('classico');
  assert.ok(svg.includes('VSd = 7,00 tf'), 'faltou o bloco visível');
  assert.ok(!svg.includes('NAO DEVE SAIR'), 'bloco de outro modo vazou para a folha');
  assert.ok(!svg.includes('>Torção<'), 'título de modo desligado vazou para a folha');
});

test('o tema muda a identidade visual da folha, nao as cores do desenho', () => {
  const classico = folhaFlexao('classico');
  const corporativo = folhaFlexao('corporativo');
  assert.ok(classico.includes('#1f6fc4'), 'faltou o azul do tema clássico');
  assert.ok(corporativo.includes('#2b2b2b') && corporativo.includes('#ffc20e'),
    'faltou a identidade corporativa');
  assert.ok(!corporativo.includes('#1f6fc4'), 'o azul do tema clássico sobrou no corporativo');
  /* convencao do desenho tecnico: igual nos dois */
  for (const cor of ['#3aa84f', '#c00000', '#2e75b6']) {
    assert.ok(classico.includes(cor) && corporativo.includes(cor),
      'a cor de convenção ' + cor + ' mudou com o tema');
  }
});

test('o texto que vem da tela e escapado antes de entrar no SVG', () => {
  const svg = folhaFlexao('classico', { idProjeto: 'A & B <script>' });
  assert.ok(svg.includes('A &amp; B &lt;script&gt;'), 'texto sem escape');
  assert.ok(!svg.includes('<script>'), 'marcacao crua entrou na folha');
});

test('o nome do arquivo sai limpo a partir da identificacao', () => {
  const doc = documentoFalso('classico', 'Flexão simples', [],
    { idElemento: 'Viga V-12 (apoio)' });
  const nome = comDocumento(doc, Exp.nomeArquivo);
  assert.strictEqual(nome, 'flexo-simples-viga-v-12-apoio.png');

  const vazio = comDocumento(documentoFalso('classico', 'x', []), Exp.nomeArquivo);
  assert.strictEqual(vazio, 'flexo-simples.png');
});

/* ------------------------------------------------------------------
   3. a exportacao esta ligada nas duas paginas e vai para o cache */

test('as duas paginas tem os campos de identificacao e os botoes', () => {
  for (const pagina of ['index.html', 'cisalhamento/index.html']) {
    const h = fs.readFileSync(path.join(raiz, pagina), 'utf8');
    for (const id of ['idProjeto', 'idElemento',
      'btBaixarImagem', 'btCopiarImagem', 'exportAviso']) {
      assert.ok(h.includes('id="' + id + '"'), pagina + ': faltou #' + id);
    }
    assert.match(h, /<script src="\.?\.?\/?js\/exportar\.js"><\/script>/,
      pagina + ': faltou carregar js/exportar.js');
  }
});

test('a exportacao entra no cache offline', () => {
  const sw = fs.readFileSync(path.join(raiz, 'sw.js'), 'utf8');
  const lista = sw.slice(sw.indexOf('var ARQUIVOS'), sw.indexOf('];', sw.indexOf('var ARQUIVOS')));
  assert.ok(lista.includes("'js/exportar.js'"), 'js/exportar.js fora do cache');
});

test('a exportacao nao usa nada de fora do navegador', () => {
  const src = fs.readFileSync(path.join(raiz, 'js/exportar.js'), 'utf8');
  assert.ok(!/\bfetch\s*\(|XMLHttpRequest|https?:\/\/(?!www\.w3\.org)/.test(src),
    'a exportação precisa funcionar offline');
  /* data: em vez de blob: no <img>, senao o canvas fica contaminado e o
     toBlob e recusado quando a pagina abre por duplo clique */
  assert.match(src, /img\.src = 'data:image\/svg\+xml/);
});

/* ------------------------------------------------------------------
   4. armadura: as tres areas e a linha de comparacao */

test('os subscritos do relatorio viram tspan na folha', () => {
  const svg = folhaFlexao('classico');
  /* 'A' na linha de base, 's,calc' rebaixado e menor, e a volta a base */
  assert.match(svg, /<tspan xml:space="preserve">A<\/tspan><tspan dy="[\d.]+" font-size="[\d.]+"/,
    'o subscrito não virou tspan rebaixado');
  /* dentro de cada <text> montado pela exportacao (os tspans com
     xml:space), o deslocamento acumulado tem de voltar a zero antes de
     qualquer pedaco na linha de base — senao o resto da linha desce junto.
     Os desenhos embutidos tem tspans proprios e ficam de fora da conta. */
  for (const bloco of svg.matchAll(/<text\b[^>]*>((?:(?!<\/text>).)*)<\/text>/g)) {
    const meus = [...bloco[1].matchAll(/<tspan([^>]*xml:space[^>]*)>/g)];
    if (!meus.length) continue;
    let nivel = 0;
    for (const t of meus) {
      const dy = Number((/dy="(-?[\d.]+)"/.exec(t[1]) || [0, 0])[1]);
      const sub = /font-size/.test(t[1]);
      nivel += dy;
      assert.ok(sub ? nivel > 0 : Math.abs(nivel) < 1e-9,
        `tspan fora da linha esperada (nível ${nivel.toFixed(2)}): ${t[1]}`);
    }
  }
});

test('a comparacao das areas sai destacada na folha', () => {
  const svg = folhaFlexao('classico');
  const linha = 'A' + 's,ado';   /* o texto chega quebrado em tspans */
  assert.ok(svg.includes('s,ado') && svg.includes('s,mín') && svg.includes('s,calc'),
    'faltaram as três áreas na folha: ' + linha);
  /* a faixa de fundo do bloco de destaque */
  assert.ok(svg.includes('fill="#f2f7fc"'), 'o bloco de destaque perdeu o fundo');
  /* e o bloco de destaque nao vira duas colunas */
  assert.ok(svg.includes('&gt;') || svg.includes('&lt;'),
    'os operadores da comparação precisam sair escapados');
});
