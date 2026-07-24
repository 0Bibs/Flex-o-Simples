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
  ['repResultados', 'repAvisos', 'repEquilibrio', 'repDominios', 'repGeral',
    'repGeometria', 'repMateriais', 'repEsforcos', 'outRhoMin', 'outAsMin',
    'outAsMax', 'outMdMin'].forEach(function (id) {
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
    'js/app.js'
  ]);
});

test('todos os arquivos referenciados pela pagina existem', () => {
  const refs = [...html.matchAll(/(?:src|href)="((?:css|js|test)\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(refs.length >= 6, `poucas referencias encontradas: ${refs.length}`);
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
