/* Testes do nucleo de calculo - executar com:  node --test  */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

require('../js/norma.js');
require('../js/flexao.js');

const { Flexao, Norma } = globalThis.FS;

/* Entrada padrao = dados do print de referencia do TQS */
function base(extra) {
  return Object.assign({
    fck: 30,
    fyk: 500,
    tipoAco: 'A',
    gammaC: 1.4,
    gammaS: 1.15,
    gammaF: 1.4,
    secao: 'RET',
    bw: 20,
    bf: 0,
    hf: 0,
    d: 45,
    dl: 4,
    Msd: 3.22,
    armaduraDupla: true,
    usarArmaduraMinima: true
  }, extra || {});
}

test('caso de referencia: reproduz os valores da calculadora comercial', () => {
  const r = Flexao.dimensionar(base());

  assert.ok(Math.abs(r.As - 1.68) < 0.005, `As = ${r.As}`);
  assert.ok(Math.abs(r.Asl - 0.0) < 1e-9, `As' = ${r.Asl}`);
  assert.ok(Math.abs(r.x - 2.51) < 0.01, `x = ${r.x}`);
  assert.ok(Math.abs(r.betaX - 0.056) < 0.001, `betaX = ${r.betaX}`);
  assert.ok(Math.abs(r.epsC - 0.59) < 0.01, `epsC = ${r.epsC}`);
  assert.ok(Math.abs(r.epsS - 10.0) < 1e-9, `epsS = ${r.epsS}`);
  assert.ok(Math.abs(r.RstTf - 7.32) < 0.01, `Rst = ${r.RstTf} tf`);
  assert.ok(Math.abs(r.RccTf - 7.32) < 0.01, `Rcc = ${r.RccTf} tf`);
  assert.strictEqual(r.dominio, '2');
  assert.ok(Math.abs(r.epsYd - 2.07) < 0.005, `epsYd = ${r.epsYd}`);
  assert.ok(Math.abs(r.h - 49) < 1e-9);
  assert.strictEqual(r.avisos.length, 0);
});

test('parametros do concreto do grupo I', () => {
  const p = Norma.parametros(30);
  assert.strictEqual(p.lambda, 0.8);
  assert.strictEqual(p.alphaC, 0.85);
  assert.strictEqual(p.epsCu, 3.5);
  assert.strictEqual(p.betaXLim, 0.45);
  assert.ok(Math.abs(p.fctm - 2.896) < 0.002);
  assert.ok(Math.abs(p.fctkSup - 3.765) < 0.005);
});

test('parametros do concreto do grupo II (fck > 50)', () => {
  const p = Norma.parametros(60);
  assert.ok(Math.abs(p.lambda - 0.775) < 1e-9);
  assert.ok(Math.abs(p.alphaC - 0.8075) < 1e-9);
  assert.ok(p.epsCu < 3.5 && p.epsCu > 2.6);
  assert.strictEqual(p.betaXLim, 0.35);
});

test('rho,min reproduz a Tabela 17.3 da NBR 6118', () => {
  const fyd = 500 / 1.15; /* MPa */
  const esperado = { 20: 0.150, 25: 0.150, 30: 0.150, 35: 0.164, 40: 0.179, 45: 0.194, 50: 0.208 };
  for (const fck of Object.keys(esperado)) {
    const rho = Norma.rhoMin(Number(fck), fyd) * 100;
    assert.ok(Math.abs(rho - esperado[fck]) < 0.001,
      `fck ${fck}: ${rho.toFixed(3)}% != ${esperado[fck]}%`);
  }
});

test('ida e volta: dimensionar e depois verificar fecha no mesmo momento', () => {
  const e = base();
  const r1 = Flexao.dimensionar(e);
  const r2 = Flexao.verificar(base({ As: r1.As, Asl: r1.Asl }));
  assert.ok(Math.abs(r2.MRdTfm - e.Msd) / e.Msd < 0.005,
    `MRd = ${r2.MRdTfm} tfm != Msd = ${e.Msd} tfm`);
  assert.ok(Math.abs(r2.x - r1.x) < 0.02, `x: ${r2.x} != ${r1.x}`);
  assert.strictEqual(r2.dominio, r1.dominio);
});

test('ida e volta tambem no dominio 3', () => {
  const e = base({ Msd: 18.0 });
  const r1 = Flexao.dimensionar(e);
  assert.strictEqual(r1.dominio, '3');
  assert.ok(r1.betaX > 0.259 && r1.betaX <= 0.45, `betaX = ${r1.betaX}`);
  const r2 = Flexao.verificar(base({ As: r1.As, Asl: r1.Asl }));
  assert.ok(Math.abs(r2.MRdTfm - e.Msd) / e.Msd < 0.005, `MRd = ${r2.MRdTfm}`);
});

test('acima do limite de ductilidade exige armadura dupla', () => {
  const e = base({ Msd: 30.0 });
  const r = Flexao.dimensionar(e);
  assert.ok(r.Asl > 0, "As' deveria ser positiva");
  assert.ok(Math.abs(r.betaX - 0.45) < 1e-6, `betaX = ${r.betaX}`);
  /* equilibrio de forcas: Rcc + Rsc = Rst */
  assert.ok(Math.abs(r.Rcc + r.Rsc - r.Rst) < 1e-6, 'equilibrio de forcas');
  /* e o momento resistente reproduz o solicitante */
  const v = Flexao.verificar(base({ As: r.As, Asl: r.Asl }));
  assert.ok(Math.abs(v.MRdTfm - e.Msd) / e.Msd < 0.01, `MRd = ${v.MRdTfm}`);
});

test('sem permitir armadura dupla, resolve com armadura simples e avisa', () => {
  const r = Flexao.dimensionar(base({ Msd: 30.0, armaduraDupla: false }));
  assert.strictEqual(r.Asl, 0, "nao deve gerar As' quando a dupla esta desativada");
  assert.ok(r.avisos.some((a) => a.includes('armadura dupla')), r.avisos.join(' | '));
  assert.ok(r.betaX > 0.45, `betaX = ${r.betaX}`);
  assert.strictEqual(r.dominio, '4');
  /* no dominio 4 o aco nao escoa: a armadura tem de ser maior que Rcc/fyd */
  assert.ok(r.As > r.Rcc / r.fyd, `As = ${r.As}`);
  /* e o equilibrio de forcas continua fechando */
  assert.ok(Math.abs(r.Rcc - r.As * r.fyd) > 1, 'Rst calculado com fyd nao vale aqui');
  const v = Flexao.verificar(base({ As: r.As, armaduraDupla: false }));
  assert.ok(Math.abs(v.MRdTfm - 30.0) / 30.0 < 0.01, `MRd = ${v.MRdTfm}`);
});

test('secao T com linha neutra dentro da mesa equivale a retangular de largura bf', () => {
  /* sem armadura minima, que depende da area da secao e mascararia a comparacao */
  const t = Flexao.dimensionar(base({ secao: 'T', bf: 80, hf: 10, Msd: 10, usarArmaduraMinima: false }));
  const ret = Flexao.dimensionar(base({ bw: 80, Msd: 10, usarArmaduraMinima: false }));
  assert.ok(t.y <= t.hf, `y = ${t.y} deveria estar na mesa`);
  assert.ok(Math.abs(t.As - ret.As) < 1e-6, `${t.As} != ${ret.As}`);
});

test('secao T com linha neutra na alma usa a decomposicao mesa + alma', () => {
  const e = base({ secao: 'T', bf: 80, hf: 8, Msd: 55, d: 45 });
  const r = Flexao.dimensionar(e);
  assert.ok(r.y > r.hf, `y = ${r.y} deveria passar da mesa`);
  assert.ok(r.betaX <= 0.45, `betaX = ${r.betaX} deveria dispensar armadura dupla`);
  assert.strictEqual(r.Asl, 0);
  const v = Flexao.verificar(base({ secao: 'T', bf: 80, hf: 8, As: r.As, Asl: r.Asl }));
  assert.ok(v.y > v.hf, `y = ${v.y} na verificacao`);
  assert.ok(Math.abs(v.MRdTfm - e.Msd) / e.Msd < 0.01, `MRd = ${v.MRdTfm} != ${e.Msd}`);
});

test('armadura minima governa em viga pouco solicitada', () => {
  const r = Flexao.dimensionar(base({ Msd: 0.5 }));
  assert.ok(Math.abs(r.asMin - 0.0015 * 20 * 49) < 1e-6, `As,min = ${r.asMin}`);
  assert.strictEqual(r.As, r.asMin);
  assert.ok(r.asCalc < r.asMin);
  assert.ok(r.avisos.some((a) => a.includes('minima')));
});

test('diagrama do aco tipo B desloca o patamar de escoamento', () => {
  const fyd = 600 / 1.15 / 10; /* kN/cm2 */
  const a = Flexao.criarAco('A', fyd);
  const b = Flexao.criarAco('B', fyd);
  assert.ok(b.epsYd > a.epsYd, `${b.epsYd} <= ${a.epsYd}`);
  assert.ok(Math.abs(b.sigma(b.epsYd) - fyd) < 1e-9);
  assert.ok(Math.abs(a.sigma(a.epsYd) - fyd) < 1e-9);
  assert.ok(b.sigma(1000) === fyd && a.sigma(1000) === fyd);
  assert.ok(b.sigma(-1000) === -fyd);
});

test('area de armadura pelas tres formas de entrada', () => {
  assert.ok(Math.abs(Flexao.areaBarras(2, 6.3) - 0.6234) < 0.001);
  assert.ok(Math.abs(Flexao.areaBarras(5, 10) - 3.927) < 0.001);
  assert.ok(Math.abs(Flexao.areaEspacamento(10, 20) - 3.927) < 0.001);
  assert.strictEqual(Flexao.areaEspacamento(10, 0), 0);
});

test('conversoes de unidade adotam 1 tf = 10 kN', () => {
  assert.ok(Math.abs(Norma.tfmParaKNcm(3.22) - 3220) < 1e-9);
  assert.ok(Math.abs(Norma.kNParaTf(73.2) - 7.32) < 1e-9);
  assert.ok(Math.abs(Norma.kNcmParaTfm(3220) - 3.22) < 1e-12);
});

test('momento nulo nao gera armadura nem NaN', () => {
  const r = Flexao.dimensionar(base({ Msd: 0 }));
  assert.strictEqual(r.As, 0);
  assert.strictEqual(r.x, 0);
  assert.ok(Number.isFinite(r.betaX));
  const v = Flexao.verificar(base({ As: 0 }));
  assert.strictEqual(v.MRd, 0);
});
