/* Adaptacao de entrada: nao altera as formulas de resistencia do motor.
   d' continua sendo o afastamento efetivo e simetrico usado pela versao 1.1.
   A conversao 10 e a convencao legada, e nao a definicao fisica exata de tf. */
(function (root) {
  'use strict';
  var FS = root.FS = root.FS || {};
  var FATOR = 10;
  function numero(v) {
    if (typeof v === 'string' && !v.trim()) return NaN;
    return Number(typeof v === 'string' ? v.replace(',', '.') : v);
  }
  function unidade(u) {
    if (u !== 'tfm' && u !== 'knm') throw new Error('Unidade de momento desconhecida.');
    return u;
  }
  function paraMotor(v, u) { return numero(v) / (unidade(u) === 'knm' ? FATOR : 1); }
  function doMotor(v, u) { return numero(v) * (unidade(u) === 'knm' ? FATOR : 1); }
  function converter(v, de, para) { return doMotor(paraMotor(v, de), para); }
  function rotulo(u) { return unidade(u) === 'knm' ? 'kN·m' : 'tf·m'; }
  function sincronizar(g, origem) {
    var h = numero(g.h), d = numero(g.d), dl = numero(g.dl);
    if (origem === 'd' && Number.isFinite(d) && Number.isFinite(dl)) h = d + dl;
    else if ((origem === 'h' || origem === 'dl') && Number.isFinite(h) && Number.isFinite(dl)) d = h - dl;
    return { h: h, d: d, dl: dl };
  }
  function coerente(g) {
    var h = numero(g.h), d = numero(g.d), dl = numero(g.dl);
    return Number.isFinite(h) && Number.isFinite(d) && Number.isFinite(dl) &&
      h > 0 && d > 0 && dl >= 0 && dl < d &&
      Math.abs(h - d - dl) <= 1e-8 * Math.max(1, h);
  }
  FS.EntradaFlexao = { FATOR: FATOR, numero: numero, paraMotor: paraMotor,
    doMotor: doMotor, converter: converter, rotulo: rotulo,
    sincronizar: sincronizar, coerente: coerente };
})(typeof window !== 'undefined' ? window : globalThis);
