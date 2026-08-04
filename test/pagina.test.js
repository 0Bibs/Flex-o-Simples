/* Testes de consistencia entre a pagina e o codigo da interface.
   Sem dependencias: apenas leitura dos arquivos. */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(raiz, 'js/app.js'), 'utf8');

function idsDoHtml() {
  const ids = new Set();
  for (const m of html.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]);
  return ids;
}

test('todo id usado pela interface existe na pagina', () => {
  const ids = idsDoHtml();
  const usados = new Set();
  /* $('x') e as referencias diretas do tipo document.getElementById */
  for (const m of app.matchAll(/\$\('([^']+)'\)/g)) usados.add(m[1]);
  for (const m of app.matchAll(/getElementById\('([^']+)'\)/g)) usados.add(m[1]);
  /* ids citados dentro das listas de ligacao de eventos */
  for (const m of app.matchAll(/'([a-zA-Z][a-zA-Z0-9]*)'(?=[,\]])/g)) {
    if (ids.has(m[1])) usados.add(m[1]);
  }
  const faltando = [...usados].filter((id) => !ids.has(id));
  assert.deepStrictEqual(faltando, [], 'ids ausentes no index.html: ' + faltando.join(', '));
  assert.ok(usados.size > 20, `esperava muitos ids em uso, achei ${usados.size}`);
});

test('os ids de saida do relatorio existem', () => {
  const ids = idsDoHtml();
  ['repResultados', 'repAvisos', 'repArmadura', 'repComparacao', 'repEquilibrio',
    'repDominios', 'repGeral', 'repGeometria', 'repMateriais', 'repEsforcos',
    'outRhoMin', 'outAsMin', 'outAsMax', 'outMdMin'].forEach(function (id) {
    assert.ok(ids.has(id), 'faltou #' + id);
  });
});

test('os scripts sao carregados na ordem de dependencia', () => {
  const ordem = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  assert.deepStrictEqual(ordem, [
    'js/norma.js',
    'js/flexao.js',
    'js/desenho-equilibrio.js',
    'js/desenho-dominios.js',
    'js/app.js',
    'js/exportar.js',
    'js/tema.js'
  ]);
});

/* toda referencia local da pagina: css/, js/, icons/, manifest.json ... */
function referenciasLocais() {
  return [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)]
    .map((m) => m[1])
    .filter((ref) => !ref.startsWith('data:') && !ref.startsWith('//'));
}

test('todos os arquivos referenciados pela pagina existem', () => {
  const refs = referenciasLocais();
  assert.ok(refs.length >= 8, `poucas referencias encontradas: ${refs.length}`);
  refs.forEach(function (ref) {
    assert.ok(fs.existsSync(path.join(raiz, ref)), 'arquivo ausente: ' + ref);
  });
});

test('a pagina nao carrega nada de fora (sem dependencia externa)', () => {
  const externos = [...html.matchAll(/(?:src|href)="(https?:)?\/\/[^"]+"/g)];
  assert.deepStrictEqual(externos.map((m) => m[0]), [],
    'a ferramenta deve funcionar offline, sem recursos externos');
});

test('os modulos de calculo funcionam fora do navegador', () => {
  const escopo = {};
  new Function('globalThis', fs.readFileSync(path.join(raiz, 'js/norma.js'), 'utf8'))(escopo);
  new Function('globalThis', fs.readFileSync(path.join(raiz, 'js/flexao.js'), 'utf8'))(escopo);
  assert.ok(escopo.FS && escopo.FS.Flexao && escopo.FS.Norma);
  const r = escopo.FS.Flexao.dimensionar({
    fck: 30, fyk: 500, tipoAco: 'A', gammaC: 1.4, gammaS: 1.15, gammaF: 1.4,
    secao: 'RET', bw: 20, d: 45, dl: 4, Msd: 3.22,
    armaduraDupla: true, usarArmaduraMinima: true
  });
  assert.ok(Math.abs(r.As - 1.68) < 0.005);
});

test('os desenhos produzem SVG valido para os dois tipos de secao', () => {
  const escopo = {};
  for (const f of ['js/norma.js', 'js/flexao.js', 'js/desenho-equilibrio.js',
    'js/desenho-dominios.js']) {
    new Function('globalThis', fs.readFileSync(path.join(raiz, f), 'utf8'))(escopo);
  }
  const FS = escopo.FS;
  const casos = [
    { nome: 'retangular', e: { secao: 'RET', bw: 20, d: 45, Msd: 3.22 } },
    { nome: 'T', e: { secao: 'T', bw: 20, bf: 80, hf: 10, d: 45, Msd: 20 } },
    { nome: 'armadura dupla', e: { secao: 'RET', bw: 20, d: 45, Msd: 30 } },
    { nome: 'momento nulo', e: { secao: 'RET', bw: 20, d: 45, Msd: 0 } }
  ];
  for (const caso of casos) {
    const dados = Object.assign({
      fck: 30, fyk: 500, tipoAco: 'A', gammaC: 1.4, gammaS: 1.15, gammaF: 1.4,
      dl: 4, armaduraDupla: true, usarArmaduraMinima: true
    }, caso.e);
    const r = FS.Flexao.dimensionar(dados);
    for (const [nome, svg] of [['equilibrio', FS.DesenhoEquilibrio.desenhar(r)],
      ['dominios', FS.DesenhoDominios.desenhar(r)]]) {
      const onde = `${caso.nome}/${nome}`;
      assert.ok(svg.startsWith('<svg ') && svg.endsWith('</svg>'), onde);
      assert.ok(!/NaN|undefined|Infinity/.test(svg), `${onde} tem valor invalido: ` +
        (svg.match(/[^ "]*(NaN|undefined|Infinity)[^ "]*/) || [''])[0]);
    }
  }
});

/* ------------------------------------------------------------------ PWA */

const manifesto = JSON.parse(fs.readFileSync(path.join(raiz, 'manifest.json'), 'utf8'));
const sw = fs.readFileSync(path.join(raiz, 'sw.js'), 'utf8');

/* largura e altura de um PNG: bytes 16..24 do cabecalho IHDR */
function dimensoesPng(arquivo) {
  const b = fs.readFileSync(path.join(raiz, arquivo));
  return { largura: b.readUInt32BE(16), altura: b.readUInt32BE(20) };
}

test('a pagina declara o manifesto e a cor do tema', () => {
  assert.match(html, /<link rel="manifest" href="manifest\.json">/);
  assert.match(html, /<meta name="theme-color" content="#1f6fc4">/);
});

test('o manifesto tem o que o navegador exige para instalar', () => {
  for (const campo of ['name', 'short_name', 'start_url', 'display', 'icons']) {
    assert.ok(manifesto[campo], 'faltou o campo ' + campo);
  }
  assert.strictEqual(manifesto.display, 'standalone');
  /* caminhos relativos: o site fica em /Flex-o-Simples/, nao na raiz */
  assert.ok(manifesto.start_url.startsWith('.'), manifesto.start_url);
  assert.ok(manifesto.scope.startsWith('.'), manifesto.scope);
});

test('os icones do manifesto existem e tem o tamanho declarado', () => {
  const tamanhos = new Set();
  for (const icone of manifesto.icons) {
    assert.ok(fs.existsSync(path.join(raiz, icone.src)), 'icone ausente: ' + icone.src);
    const { largura, altura } = dimensoesPng(icone.src);
    assert.strictEqual(`${largura}x${altura}`, icone.sizes,
      `${icone.src}: real ${largura}x${altura} != declarado ${icone.sizes}`);
    tamanhos.add(icone.sizes);
  }
  /* o Chrome exige ao menos um icone de 192 e um de 512 */
  assert.ok(tamanhos.has('192x192'), 'faltou o icone de 192x192');
  assert.ok(tamanhos.has('512x512'), 'faltou o icone de 512x512');
  assert.ok(manifesto.icons.some((i) => i.purpose === 'maskable'), 'faltou icone maskable');
});

test('o service worker guarda em cache tudo que a pagina usa', () => {
  const lista = sw.slice(sw.indexOf('var ARQUIVOS'), sw.indexOf('];', sw.indexOf('var ARQUIVOS')));
  const emCache = [...lista.matchAll(/'([^']+)'/g)].map((m) => m[1]);

  assert.ok(emCache.includes('./'), 'falta a raiz do escopo no cache');
  assert.ok(emCache.includes('index.html'), 'falta index.html no cache');

  const precisa = referenciasLocais().concat(manifesto.icons.map((i) => i.src));
  for (const ref of new Set(precisa)) {
    assert.ok(emCache.includes(ref), 'fora do cache do service worker: ' + ref);
  }
  /* e nada listado no cache pode estar faltando no disco */
  for (const arq of emCache) {
    if (arq === './') continue;
    assert.ok(fs.existsSync(path.join(raiz, arq)), 'no cache mas ausente no disco: ' + arq);
  }
});

/* O service worker revalida cada arquivo por conta propria. Se o nome do
   cache nao mudar quando o conteudo muda, o navegador pode acabar servindo
   pagina de um deploy e script de outro — e o relatorio aparece pela
   metade. Amarrar o nome ao conteudo tira isso das maos de quem lembra. */
test('o nome do cache acompanha o conteudo dos arquivos', () => {
  const crypto = require('node:crypto');
  const lista = sw.slice(sw.indexOf('var ARQUIVOS'), sw.indexOf('];', sw.indexOf('var ARQUIVOS')));
  const arquivos = [...new Set([...lista.matchAll(/'([^']+)'/g)].map((m) => m[1]))]
    .filter((a) => !a.endsWith('/'))
    .sort();

  const h = crypto.createHash('sha1');
  for (const a of arquivos) {
    h.update(a); h.update('\0');
    h.update(fs.readFileSync(path.join(raiz, a))); h.update('\0');
  }
  const esperado = 'flexo-simples-' + h.digest('hex').slice(0, 10);
  const atual = (/var CACHE = '([^']+)'/.exec(sw) || [])[1];
  assert.strictEqual(atual, esperado,
    `o cache ficou para tras. Em sw.js troque por:\n  var CACHE = '${esperado}';`);
});

test('o registro do service worker so acontece sob http/https', () => {
  assert.match(app, /serviceWorker' in navigator/);
  assert.match(app, /location\.protocol/);
  assert.match(app, /register\('sw\.js'\)/);
});

/* ------------------------------------------------ segunda ferramenta */

const htmlCis = fs.readFileSync(path.join(raiz, 'cisalhamento/index.html'), 'utf8');
const appCis = fs.readFileSync(path.join(raiz, 'js/app-cisalhamento.js'), 'utf8');

/* referencias da pagina de cisalhamento, normalizadas para a raiz do site */
function referenciasCis() {
  return [...htmlCis.matchAll(/(?:src|href)="([^"#:]+)"/g)]
    .map((m) => m[1])
    .filter((ref) => !ref.startsWith('data:') && !ref.startsWith('//'))
    .map((ref) => (ref.startsWith('../') ? ref.slice(3) : 'cisalhamento/' + ref));
}

test('a pagina de cisalhamento referencia apenas arquivos existentes', () => {
  const refs = referenciasCis();
  assert.ok(refs.length >= 6, `poucas referencias: ${refs.length}`);
  refs.forEach(function (ref) {
    assert.ok(fs.existsSync(path.join(raiz, ref)), 'arquivo ausente: ' + ref);
  });
});

test('as duas ferramentas se referenciam mutuamente', () => {
  assert.match(html, /href="cisalhamento\/index\.html"/);
  assert.match(htmlCis, /href="\.\.\/index\.html"/);
});

test('todo id usado pela interface de cisalhamento existe na pagina', () => {
  const ids = new Set();
  for (const m of htmlCis.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]);
  const usados = new Set();
  for (const m of appCis.matchAll(/\$\('([^']+)'\)/g)) usados.add(m[1]);
  for (const m of appCis.matchAll(/'([a-zA-Z][a-zA-Z0-9]*)'(?=[,\]])/g)) {
    if (ids.has(m[1])) usados.add(m[1]);
  }
  const faltando = [...usados].filter((id) => !ids.has(id));
  assert.deepStrictEqual(faltando, [], 'ids ausentes: ' + faltando.join(', '));
  assert.ok(usados.size > 15, `esperava muitos ids, achei ${usados.size}`);
});

test('a pagina de cisalhamento tambem nao carrega nada de fora', () => {
  const externos = [...htmlCis.matchAll(/(?:src|href)="(https?:)?\/\/[^"]+"/g)];
  assert.deepStrictEqual(externos.map((m) => m[0]), []);
});

test('o service worker guarda em cache a segunda ferramenta', () => {
  const lista = sw.slice(sw.indexOf('var ARQUIVOS'), sw.indexOf('];', sw.indexOf('var ARQUIVOS')));
  const emCache = [...lista.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(emCache.includes('cisalhamento/'), 'falta a raiz da segunda ferramenta');
  for (const ref of new Set(referenciasCis())) {
    assert.ok(emCache.includes(ref), 'fora do cache: ' + ref);
  }
});

test('os desenhos de cortante e torcao produzem SVG valido', () => {
  const escopo = {};
  for (const f of ['js/norma.js', 'js/cisalhamento.js', 'js/desenho-cisalhamento.js']) {
    new Function('globalThis', fs.readFileSync(path.join(raiz, f), 'utf8'))(escopo);
  }
  const FS2 = escopo.FS;
  const base = {
    fck: 30, fyk: 500, gammaC: 1.4, gammaS: 1.15, gammaF: 1.4,
    bw: 40, bwMin: 40, h: 50, d: 47.5, c1: 2.5,
    modelo: 'I', theta: 45, alpha: 90, refMin: 'bw/2',
    Vsd: 7, Tsd: 6.96, diamEstribo: 10, nRamos: 2
  };
  for (const modo of ['CORTANTE', 'TORCAO', 'AMBOS']) {
    const r = FS2.Cisalhamento.calcular(Object.assign({}, base, { modo }));
    const figuras = [['secao', FS2.DesenhoCisalhamento.secao(r)],
      ['bielas', FS2.DesenhoCisalhamento.bielas(r)]];
    if (r.torcao) figuras.push(['vazada', FS2.DesenhoCisalhamento.vazada(r)]);
    for (const [nome, svg] of figuras) {
      const onde = `${modo}/${nome}`;
      assert.ok(svg.startsWith('<svg ') && svg.endsWith('</svg>'), onde);
      assert.ok(!/NaN|undefined|Infinity/.test(svg), `${onde}: ` +
        (svg.match(/[^ "]*(NaN|undefined|Infinity)[^ "]*/) || [''])[0]);
    }
  }
});

/* ------------------------------------------------ atalho do Windows */

test('o icone .ico e valido e tem varios tamanhos', () => {
  const b = fs.readFileSync(path.join(raiz, 'icons/flexo-simples.ico'));
  assert.strictEqual(b.readUInt16LE(0), 0, 'campo reservado deve ser zero');
  assert.strictEqual(b.readUInt16LE(2), 1, 'tipo deve ser 1 (ícone)');
  const n = b.readUInt16LE(4);
  assert.ok(n >= 4, `esperava vários tamanhos, achei ${n}`);
  const vistos = [];
  for (let i = 0; i < n; i++) {
    const off = 6 + i * 16;
    const lado = b[off] === 0 ? 256 : b[off];
    const bytes = b.readUInt32LE(off + 8);
    const inicio = b.readUInt32LE(off + 12);
    assert.ok(inicio + bytes <= b.length, `entrada ${i} aponta fora do arquivo`);
    vistos.push(lado);
  }
  for (const lado of [16, 32, 48, 256]) {
    assert.ok(vistos.includes(lado), `faltou o tamanho ${lado}: ${vistos.join(', ')}`);
  }
});

test('o script do atalho aponta para arquivos que existem', () => {
  const ps1 = fs.readFileSync(path.join(raiz, 'atalho/criar-atalho.ps1'), 'utf8');
  const cmds = ['Criar atalho (Windows).cmd', 'Criar atalho corporativo (Windows).cmd']
    .map((n) => ({ nome: n, txt: fs.readFileSync(path.join(raiz, 'atalho', n), 'utf8') }));

  for (const { nome, txt } of cmds) {
    /* o .cmd precisa de CRLF para o interpretador do Windows */
    assert.ok(txt.includes('\r\n'), nome + ' deve usar quebra de linha CRLF');
    assert.match(txt, /criar-atalho\.ps1/);
  }
  /* o .cmd corporativo passa o tema adiante */
  assert.match(cmds[1].txt, /-Tema corporativo/);

  /* todo .ico citado no script existe mesmo */
  const icones = [...ps1.matchAll(/'([\w-]+\.ico)'/g)].map((m) => m[1]);
  assert.ok(icones.length >= 2, 'esperava um ícone por tema: ' + icones.join(', '));
  for (const ico of icones) {
    assert.ok(fs.existsSync(path.join(raiz, 'icons', ico)), 'ícone ausente: ' + ico);
  }
  assert.match(ps1, /icons\\\$arqIcone/);

  assert.match(ps1, /'index\.html'/);
  assert.ok(fs.existsSync(path.join(raiz, 'index.html')));
  /* abre em modo aplicativo, sem barra de enderecos */
  assert.match(ps1, /--app=/);
  /* e o tema corporativo entra pela URL */
  assert.match(ps1, /\?tema=corporativo/);
});

/* ------------------------------------------------ identidade do app por tema */

const manCorp = JSON.parse(
  fs.readFileSync(path.join(raiz, 'manifest-corporativo.json'), 'utf8'));

test('o manifesto corporativo e completo e usa a identidade da empresa', () => {
  for (const campo of ['name', 'short_name', 'start_url', 'display', 'icons']) {
    assert.ok(manCorp[campo], 'faltou o campo ' + campo);
  }
  assert.strictEqual(manCorp.theme_color, '#2b2b2b');
  assert.ok(manCorp.start_url.includes('tema=corporativo'), manCorp.start_url);
  /* icones proprios, nao os do tema classico */
  const usados = manCorp.icons.map((i) => i.src);
  assert.ok(usados.every((s) => s.includes('corp-')), usados.join(', '));
  for (const icone of manCorp.icons) {
    assert.ok(fs.existsSync(path.join(raiz, icone.src)), 'ausente: ' + icone.src);
    const { largura, altura } = dimensoesPng(icone.src);
    assert.strictEqual(`${largura}x${altura}`, icone.sizes, icone.src);
  }
  const tamanhos = manCorp.icons.map((i) => i.sizes);
  assert.ok(tamanhos.includes('192x192') && tamanhos.includes('512x512'));
  assert.ok(manCorp.icons.some((i) => i.purpose === 'maskable'));
});

test('o tema troca o manifesto e respeita ?tema= na URL', () => {
  const tema = fs.readFileSync(path.join(raiz, 'js/tema.js'), 'utf8');
  assert.match(tema, /manifest-corporativo\.json/);
  assert.match(tema, /link\[rel="manifest"\]/);
  assert.match(tema, /tema=\(\[a-z\]\+\)/);
});

test('os dois manifestos e os icones corporativos estao no cache offline', () => {
  const lista = sw.slice(sw.indexOf('var ARQUIVOS'), sw.indexOf('];', sw.indexOf('var ARQUIVOS')));
  const emCache = [...lista.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(emCache.includes('manifest-corporativo.json'));
  for (const icone of manCorp.icons) {
    assert.ok(emCache.includes(icone.src), 'fora do cache: ' + icone.src);
  }
});

test('o .ico corporativo e valido', () => {
  const b = fs.readFileSync(path.join(raiz, 'icons/flexo-simples-corporativo.ico'));
  assert.strictEqual(b.readUInt16LE(0), 0);
  assert.strictEqual(b.readUInt16LE(2), 1);
  assert.ok(b.readUInt16LE(4) >= 4);
});
