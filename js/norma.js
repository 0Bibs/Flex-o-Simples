/* ---------------------------------------------------------------------------
   Flexo Simples - parametros normativos (ABNT NBR 6118)
   Unidades internas: cm, kN, MPa (para fck/fyk).
   --------------------------------------------------------------------------- */
(function (root) {
  'use strict';

  var FS = (root.FS = root.FS || {});

  /* Modulo de elasticidade do aco - NBR 6118 item 8.3.5 */
  var Es = 21000; /* kN/cm2  (210 GPa) */

  /* 1 tf = 10 kN (convencao de engenharia adotada tambem pelo TQS) */
  var KN_POR_TF = 10;

  /* Parametros do diagrama parabola-retangulo / bloco retangular equivalente.
     NBR 6118 itens 8.2.10 e 17.2.2 */
  function parametros(fck) {
    var p = {};
    if (fck <= 50) {
      p.lambda = 0.8;
      p.alphaC = 0.85;
      p.epsC2 = 2.0;   /* por mil */
      p.epsCu = 3.5;   /* por mil */
      p.betaXLim = 0.45;
      p.grupo = 'I';
    } else {
      p.lambda = 0.8 - (fck - 50) / 400;
      p.alphaC = 0.85 * (1 - (fck - 50) / 200);
      p.epsC2 = 2.0 + 0.085 * Math.pow(fck - 50, 0.53);
      p.epsCu = 2.6 + 35 * Math.pow((90 - fck) / 100, 4);
      p.betaXLim = 0.35;
      p.grupo = 'II';
    }
    /* Resistencia a tracao - NBR 6118 item 8.2.5 */
    if (fck <= 50) {
      p.fctm = 0.3 * Math.pow(fck, 2 / 3);
    } else {
      p.fctm = 2.12 * Math.log(1 + 0.11 * fck);
    }
    p.fctkInf = 0.7 * p.fctm;
    p.fctkSup = 1.3 * p.fctm;
    return p;
  }

  /* Taxa minima de armadura - NBR 6118 item 17.3.5.2.1 (Tabela 17.3).
     A tabela da norma deriva do momento minimo Md,min = 0,8.W0.fctk,sup
     com braco de alavanca 0,78.h, com piso de 0,15%.
     Reproduz a tabela para CA-50 / gc=1,4 / gs=1,15 e generaliza para
     outros acos e coeficientes. */
  function rhoMin(fck, fyd_MPa) {
    var p = parametros(fck);
    var rho = 0.1709 * p.fctkSup / fyd_MPa;
    return Math.max(0.0015, rho);
  }

  FS.Norma = {
    Es: Es,
    KN_POR_TF: KN_POR_TF,
    parametros: parametros,
    rhoMin: rhoMin,
    /* conversoes */
    tfmParaKNcm: function (m) { return m * KN_POR_TF * 100; },
    kNcmParaTfm: function (m) { return m / (KN_POR_TF * 100); },
    kNParaTf: function (f) { return f / KN_POR_TF; },
    MPaParaKNcm2: function (v) { return v / 10; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
