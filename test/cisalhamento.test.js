/* Testes do nucleo de cortante e torcao.
   Os valores de referencia sao os da calculadora comercial equivalente,
   para a mesma entrada: bw = 40, h = 50, d = 47,5, C30, CA-50,
   Vsk = 5,00 tf e Tsk = 4,97 tfm com gamma_f = 1,4, c1 = 2,5 cm. */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

require('../js/norma.js');
require('../js/cisalhamento.js');

const { Cisalhamento } = globalThis.FS;

function base(extra) {
  return Object.assign({
    modo: 'CORTANTE',
    fck: 30,
    fyk: 500,
    gammaC: 1.4,
    gammaS: 1.15,
    gammaF: 1.4,
    bw: 40,
    bwMin: 40,
    h: 50,
    d: 47.5,
    c1: 2.5,
    modelo: 'I',
    theta: 45,
    alpha: 90,
    refMin: 'bw/2',
    Vsd: 7.0,
    Tsd: 6.96,
    diamEstribo: 6.3,
    nRamos: 2
  }, extra || {});
}

const perto = (a, b, tol) => Math.abs(a - b) <= tol;

test('cortante: reproduz os valores da calculadora comercial', () => {
  const r = Cisalhamento.calcular(base());
  const V = r.cortante;
  assert.ok(perto(V.VRd2Tf, 96.74, 0.01), `VRd2 = ${V.VRd2Tf}`);
  assert.ok(perto(V.VcTf, 16.51, 0.01), `Vc = ${V.VcTf}`);
  assert.ok(perto(V.VswTf, -9.51, 0.01), `Vsw = ${V.VswTf}`);
  assert.ok(perto(V.aswMinM, 4.63, 0.01), `Asw,min = ${V.aswMinM}`);
  /* com Vsw negativo, a armadura necessaria e a minima */
  assert.ok(perto(V.aswNecM, 4.63, 0.01), `Asw,nec = ${V.aswNecM}`);
  assert.ok(V.minimaGoverna);
  /* VRd3 aqui e a resistencia do estribo adotado, nao um eco do solicitante:
     tem de superar Vsd com folga, ja que a armadura minima governa */
  assert.ok(V.VRd3Tf > V.VsdTf, `VRd3 = ${V.VRd3Tf} <= Vsd = ${V.VsdTf}`);
  assert.ok(perto(V.VRd3Tf, V.VcTf + V.VswRealTf, 1e-9));
});

test('torcao: reproduz a secao vazada equivalente da referencia', () => {
  const r = Cisalhamento.calcular(base({ modo: 'TORCAO' }));
  const T = r.torcao;
  assert.ok(perto(T.he, 11.11, 0.01), `he = ${T.he}`);
  assert.ok(perto(T.bnuc, 28.89, 0.01), `bnuc = ${T.bnuc}`);
  assert.ok(perto(T.hnuc, 38.89, 0.01), `hnuc = ${T.hnuc}`);
  assert.ok(perto(T.TRd2Tfm, 11.77, 0.01), `TRd2 = ${T.TRd2Tfm}`);
});

test('torcao: armaduras transversal e longitudinal da referencia', () => {
  const r = Cisalhamento.calcular(base({ modo: 'TORCAO' }));
  const T = r.torcao;
  assert.ok(perto(T.a90NecM, 7.12, 0.01), `A90,nec = ${T.a90NecM}`);
  assert.ok(perto(T.aslNecM, 7.12, 0.01), `Asl,nec = ${T.aslNecM}`);
  assert.ok(perto(T.aslFaceHor, 2.06, 0.01), `Asl,fc hor = ${T.aslFaceHor}`);
  assert.ok(perto(T.aslFaceVer, 2.77, 0.01), `Asl,fc ver = ${T.aslFaceVer}`);
  assert.ok(perto(T.aslMinM, 1.29, 0.01), `Asl,min = ${T.aslMinM}`);
  assert.ok(perto(T.a90MinM, 2.32, 0.01), `A90,min 1R = ${T.a90MinM}`);
  assert.ok(perto(T.a90MinDuploM, 4.63, 0.01), `A90,min 2R = ${T.a90MinDuploM}`);
  /* TRd3 e TRd4 fecham no solicitante quando se adota a armadura necessaria */
  assert.ok(perto(T.TRd3Tfm, 6.96, 0.01), `TRd3 = ${T.TRd3Tfm}`);
  assert.ok(perto(T.TRd4Tfm, 6.96, 0.01), `TRd4 = ${T.TRd4Tfm}`);
});

test('cortante + torcao: interacao das bielas', () => {
  /* bitola de 10 mm: com 6,3 o espacamento cairia para 3 cm, impraticavel */
  const r = Cisalhamento.calcular(base({ modo: 'AMBOS', diamEstribo: 10 }));
  assert.ok(perto(r.interacao, 0.66, 0.005), `interacao = ${r.interacao}`);
  assert.strictEqual(r.avisos.length, 0);
  /* o estribo atende cortante (dividido nos ramos) e torcao (ramo externo) */
  const esperado = r.cortante.aswNec / 2 + r.torcao.a90Nec;
  assert.ok(perto(r.demandaPorRamoM, esperado * 100, 1e-9));
});

test('modelo II com theta = 45 graus da a mesma biela do modelo I', () => {
  const a = Cisalhamento.calcular(base({ Vsd: 30 }));
  const b = Cisalhamento.calcular(base({ Vsd: 30, modelo: 'II', theta: 45 }));
  assert.ok(perto(a.cortante.VRd2, b.cortante.VRd2, 1e-6),
    `${a.cortante.VRd2} != ${b.cortante.VRd2}`);
  /* a armadura, porem, difere: no modelo II a parcela Vc decresce com Vsd,
     entao sobra mais esforco para os estribos */
  assert.ok(b.cortante.Vc < a.cortante.Vc, `Vc: ${b.cortante.Vc} >= ${a.cortante.Vc}`);
  assert.ok(b.cortante.aswCalc > a.cortante.aswCalc);
});

test('modelo II com theta menor exige menos estribo', () => {
  const t45 = Cisalhamento.calcular(base({ Vsd: 30, modelo: 'II', theta: 45 }));
  const t30 = Cisalhamento.calcular(base({ Vsd: 30, modelo: 'II', theta: 30 }));
  assert.ok(t30.cortante.aswCalc < t45.cortante.aswCalc,
    `theta=30 deveria pedir menos armadura: ${t30.cortante.aswCalc} vs ${t45.cortante.aswCalc}`);
  /* mas a biela fica mais solicitada */
  assert.ok(t30.cortante.VRd2 < t45.cortante.VRd2);
});

test('ruptura da biela e avisada', () => {
  const r = Cisalhamento.calcular(base({ Vsd: 120 }));
  assert.ok(r.cortante.biela > 1, `aproveitamento = ${r.cortante.biela}`);
  assert.ok(r.avisos.some((a) => a.includes('biela comprimida rompe')), r.avisos.join(' | '));
});

test('fywd fica limitado a 435 MPa', () => {
  const ca50 = Cisalhamento.calcular(base());
  const ca60 = Cisalhamento.calcular(base({ fyk: 600 }));
  assert.ok(!ca50.limitadoFywd, 'CA-50 nao deve ser limitado');
  assert.ok(ca60.limitadoFywd, 'CA-60 deve ser limitado');
  assert.strictEqual(ca60.fywdMPa, Cisalhamento.FYWD_MAX);
});

test('espacamento maximo segue o item 18.3.3.2', () => {
  /* pouco solicitada: 0,6d limitado a 30 cm */
  const leve = Cisalhamento.calcular(base({ Vsd: 20 }));
  assert.ok(perto(leve.sMax, Math.min(0.6 * 47.5, 30), 1e-9), `sMax = ${leve.sMax}`);
  /* acima de 0,67.VRd2: 0,3d limitado a 20 cm */
  const pesada = Cisalhamento.calcular(base({ Vsd: 70 }));
  assert.ok(pesada.cortante.Vsd > 0.67 * pesada.cortante.VRd2);
  assert.ok(perto(pesada.sMax, Math.min(0.3 * 47.5, 20), 1e-9), `sMax = ${pesada.sMax}`);
});

test('o espacamento adotado nunca ultrapassa o maximo', () => {
  for (const Vsd of [5, 20, 40, 60, 80]) {
    const r = Cisalhamento.calcular(base({ Vsd }));
    assert.ok(r.sAdotado <= r.sMax + 1e-9, `Vsd=${Vsd}: s=${r.sAdotado} > ${r.sMax}`);
    assert.ok(r.sAdotado > 0, `Vsd=${Vsd}: s=${r.sAdotado}`);
  }
});

test('estribo escolhido cobre a demanda de cortante e torcao', () => {
  const r = Cisalhamento.calcular(base({ modo: 'AMBOS', diamEstribo: 8, nRamos: 2 }));
  /* area efetivamente disponivel por ramo no espacamento adotado */
  const disponivel = r.areaPorRamo / r.sAdotado;
  const necessario = r.cortante.aswNec / r.nRamos + r.torcao.a90Nec;
  assert.ok(disponivel >= necessario - 1e-9,
    `disponivel ${disponivel} < necessario ${necessario}`);
});

test('a taxa minima independe do modo e vale 0,2.fctm/fywk', () => {
  const r = Cisalhamento.calcular(base());
  assert.ok(perto(r.rhoMin, (0.2 * 2.89648) / 500, 1e-6), `rhoMin = ${r.rhoMin}`);
});
