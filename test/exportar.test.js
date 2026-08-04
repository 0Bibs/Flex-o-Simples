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
    querySelectorAll: () => (o.linhas || []).map((t) => ({ textContent: t }))
  };
}

/* monta um documento com a mesma estrutura do relatorio real */
function documentoFalso(tema, titulo, filhos, id) {
  const campos = Object.assign({ norma: '2023' }, id || {});
  const mapa = { relatorio: el('main', { id: 'relatorio', filhos: filhos }) };
  for (const k of Object.keys(campos)) mapa[k] = el('input', { value: campos[k] });
  mapa.relatorio.children = [el('h1', { texto: titulo })].concat(filhos);
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
    el('div', { classes: ['bloco'], linhas: ['As = 1,68 cm2', 'x = 2,5 cm'] }),
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
    assert.strictEqual(Number(m[1]), 1120, nome);
    assert.ok(Number(m[2]) > 600, nome + ': folha curta demais — ' + m[2]);
    /* tags abertas e fechadas em numero igual */
    const abre = (svg.match(/<svg[ >]/g) || []).length;
    const fecha = (svg.match(/<\/svg>/g) || []).length;
    assert.strictEqual(abre, fecha, nome + ': <svg> aninhado sem fechar');
  }
});

test('a folha traz a identificacao, o titulo e a norma', () => {
  const svg = folhaFlexao('classico', {
    idProjeto: 'Plataforma P-99', idElemento: 'V12', idResponsavel: 'Eng. Fulano',
    idRevisao: '2', norma: '2023'
  });
  assert.ok(svg.includes('IDENTIFICAÇÃO'));
  for (const t of ['Plataforma P-99', 'V12', 'Eng. Fulano', 'ABNT NBR 6118:2023',
    'Flexão simples', 'Projeto', 'Elemento', 'Responsável', 'Revisão', 'Data']) {
    assert.ok(svg.includes(t), 'faltou na folha: ' + t);
  }
  /* campos em branco viram travessao, e nao 'undefined' */
  assert.ok(folhaFlexao('classico').includes('—'));
});

test('a folha leva os desenhos e o texto do relatorio, mas nao o rodape da tela', () => {
  const svg = folhaFlexao('classico');
  assert.ok(svg.includes('class="dg"'), 'o desenho perdeu a classe que casa com o CSS');
  assert.ok(svg.includes('As = 1,68 cm2'), 'faltou o texto dos resultados');
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
    { idElemento: 'Viga V-12 (apoio)', idRevisao: '3' });
  const nome = comDocumento(doc, Exp.nomeArquivo);
  assert.strictEqual(nome, 'flexo-simples-viga-v-12-apoio-r3.png');

  const vazio = comDocumento(documentoFalso('classico', 'x', []), Exp.nomeArquivo);
  assert.strictEqual(vazio, 'flexo-simples.png');
});

/* ------------------------------------------------------------------
   3. a exportacao esta ligada nas duas paginas e vai para o cache */

test('as duas paginas tem os campos de identificacao e os botoes', () => {
  for (const pagina of ['index.html', 'cisalhamento/index.html']) {
    const h = fs.readFileSync(path.join(raiz, pagina), 'utf8');
    for (const id of ['idProjeto', 'idElemento', 'idResponsavel', 'idRevisao',
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
