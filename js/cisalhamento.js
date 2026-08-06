/* ---------------------------------------------------------------------------
   Flexo Simples - nucleo de calculo de cortante e torcao
   ABNT NBR 6118, itens 17.4 (forca cortante) e 17.5 (torcao).

   Cortante
     Modelo I  (17.4.2.2): bielas a 45 graus, parcela Vc constante.
     Modelo II (17.4.2.3): bielas entre 30 e 45 graus, Vc decrescente com Vsd.

   Torcao (17.5): secao vazada equivalente de espessura he, com armadura
   transversal (A90) e longitudinal (Asl) distribuidas no perimetro.

   Unidades internas: cm, kN, kN/cm2, kN.cm.
   --------------------------------------------------------------------------- */
(function (root) {
  'use strict';

  var FS = (root.FS = root.FS || {});
  var Norma = FS.Norma;

  /* NBR 6118 item 17.4.2.2 c): fywd nunca acima de 435 MPa */
  var FYWD_MAX = 435;

  function rad(g) { return (g * Math.PI) / 180; }
  function cotg(r) { return 1 / Math.tan(r); }
  function area(diamMm, n) { return (n * Math.PI * Math.pow(diamMm / 10, 2)) / 4; }

  /* Espacamentos maximos dos estribos - NBR 6118 item 18.3.3.2 */
  function espacamentosMaximos(Vsd, VRd2, d) {
    return {
      longitudinal: Vsd <= 0.67 * VRd2 ? Math.min(0.6 * d, 30) : Math.min(0.3 * d, 20),
      transversal: Vsd <= 0.20 * VRd2 ? Math.min(d, 80) : Math.min(0.6 * d, 35)
    };
  }

  /* Propriedades comuns aos dois calculos */
  function materiais(e) {
    var p = Norma.parametros(e.fck);
    var fywdMPa = Math.min(e.fyk / e.gammaS, FYWD_MAX);
    return {
      p: p,
      fcd: Norma.MPaParaKNcm2(e.fck) / e.gammaC,
      alphaV2: 1 - e.fck / 250,
      fctd: p.fctkInf / e.gammaC,                        /* MPa */
      fctdK: Norma.MPaParaKNcm2(p.fctkInf / e.gammaC),
      fywdMPa: fywdMPa,
      fywd: Norma.MPaParaKNcm2(fywdMPa),
      limitadoFywd: e.fyk / e.gammaS > FYWD_MAX,
      /* taxa minima de armadura transversal - item 17.4.1.1.1 */
      rhoMin: (0.2 * p.fctm) / e.fyk
    };
  }

  /* ---------------------------------------------------------------------
     CORTANTE - item 17.4
     --------------------------------------------------------------------- */
  function cortante(e, m, avisos) {
    var bw = e.bwMin > 0 ? e.bwMin : e.bw;
    var d = e.d;
    var Vsd = e.Vsd * Norma.KN_POR_TF;
    var alpha = rad(e.alpha), theta = rad(e.modelo === 'II' ? e.theta : 45);

    var Vc0 = 0.6 * m.fctdK * bw * d;
    var VRd2, Vc;
    if (e.modelo === 'II') {
      VRd2 = 0.54 * m.alphaV2 * m.fcd * bw * d * Math.pow(Math.sin(theta), 2) *
        (cotg(alpha) + cotg(theta));
      /* Vc1 vale Vc0 ate Vsd = Vc0 e cai a zero quando Vsd atinge VRd2 */
      Vc = Vsd <= Vc0 ? Vc0 : Math.max(0, (Vc0 * (VRd2 - Vsd)) / (VRd2 - Vc0));
    } else {
      VRd2 = 0.27 * m.alphaV2 * m.fcd * bw * d;
      Vc = Vc0;
    }

    if (Vsd > VRd2) {
      avisos.push('V<sub>Sd</sub> = ' + Norma.kNParaTf(Vsd).toFixed(2) +
        ' tf supera V<sub>Rd2</sub> = ' + Norma.kNParaTf(VRd2).toFixed(2) +
        ' tf: a biela comprimida rompe. Aumente b<sub>w</sub>, d ou f<sub>ck</sub>.');
    }

    var Vsw = Vsd - Vc;                                   /* pode ser negativo */
    var braco = e.modelo === 'II'
      ? 0.9 * d * m.fywd * (cotg(alpha) + cotg(theta)) * Math.sin(alpha)
      : 0.9 * d * m.fywd * (Math.sin(alpha) + Math.cos(alpha));
    var aswCalc = braco > 0 ? Math.max(0, Vsw) / braco : 0;   /* cm2/cm, 2 ramos */
    var aswMin = m.rhoMin * bw * Math.sin(alpha);

    return {
      bw: bw, Vsd: Vsd, VsdTf: Norma.kNParaTf(Vsd),
      VskTf: Norma.kNParaTf(Vsd) / (e.gammaF || 1),
      VRd2: VRd2, VRd2Tf: Norma.kNParaTf(VRd2),
      Vc0: Vc0, Vc: Vc, VcTf: Norma.kNParaTf(Vc), Vc0Tf: Norma.kNParaTf(Vc0),
      Vsw: Vsw, VswTf: Norma.kNParaTf(Vsw),
      aswCalc: aswCalc, aswCalcM: aswCalc * 100,
      aswMin: aswMin, aswMinM: aswMin * 100,
      aswNec: Math.max(aswCalc, aswMin),
      aswNecM: Math.max(aswCalc, aswMin) * 100,
      minimaGoverna: aswCalc < aswMin,
      biela: VRd2 > 0 ? Vsd / VRd2 : Infinity,
      braco: braco
    };
  }

  /* ---------------------------------------------------------------------
     TORCAO - item 17.5, secao vazada equivalente
     --------------------------------------------------------------------- */
  function torcao(e, m, avisos) {
    var bw = e.bw, h = e.h;
    var Tsd = e.Tsd * Norma.KN_POR_TF * 100;              /* tfm -> kN.cm */
    var theta = rad(e.modelo === 'II' ? e.theta : 45);

    /* espessura da parede equivalente: he <= A/u e he >= 2.c1 */
    var A = bw * h, u = 2 * (bw + h);
    var he = A / u;
    if (he < 2 * e.c1) {
      he = 2 * e.c1;
      avisos.push('h<sub>e</sub> limitado por 2·c₁ = ' + (2 * e.c1).toFixed(1) + ' cm.');
    }
    if (he >= Math.min(bw, h) / 2) {
      avisos.push('h<sub>e</sub> = ' + he.toFixed(1) +
        ' cm é grande frente à seção: confira a geometria.');
    }

    var bnuc = bw - he, hnuc = h - he;
    var Ae = bnuc * hnuc;                                  /* area da linha media */
    var ue = 2 * (bnuc + hnuc);                            /* perimetro da linha media */

    var TRd2 = 0.50 * m.alphaV2 * m.fcd * Ae * he * Math.sin(2 * theta);
    if (Tsd > TRd2) {
      avisos.push('T<sub>Sd</sub> = ' + (Tsd / 1000).toFixed(2) +
        ' tfm supera T<sub>Rd2</sub> = ' + (TRd2 / 1000).toFixed(2) +
        ' tfm: a biela comprimida rompe por torção.');
    }

    /* armadura transversal (1 ramo) e longitudinal (por metro de perimetro) */
    var a90 = Tsd / (2 * Ae * m.fywd * cotg(theta));       /* cm2/cm, 1 ramo */
    var asl = (Tsd * Math.tan(theta)) / (2 * Ae * m.fywd); /* cm2/cm de perimetro */

    /* minimos - item 17.5.1.2, com a largura de referencia escolhida */
    var bRef = e.refMin === 'he' ? he : (e.refMin === 'bw' ? bw : bw / 2);
    var a90Min = m.rhoMin * bRef;                          /* cm2/cm, 1 ramo */
    var aslMin = m.rhoMin * he;                            /* cm2/cm de perimetro */

    var a90Nec = Math.max(a90, a90Min);
    var aslNec = Math.max(asl, aslMin);

    /* Fatores da trelica espacial: multiplicados pela taxa de armadura
       (cm2/cm) devolvem o torque resistido, em kN.cm. Ficam separados
       porque TRd3 so pode ser fechado depois que o estribo e adotado. */
    var fatorT3 = 2 * Ae * m.fywd * cotg(theta);
    var fatorT4 = (2 * Ae * m.fywd) / Math.tan(theta);

    /* TRd4 depende da armadura longitudinal que sera de fato detalhada, e
       nao da que o programa acabou de calcular — item 17.5.1.3. Sem esse
       dado nao existe verificacao, so a area necessaria. */
    var aslEf = e.aslEf > 0 ? e.aslEf : 0;                 /* cm2, total */
    var aslEfPorCm = ue > 0 ? aslEf / ue : 0;
    var TRd4 = aslEf > 0 ? fatorT4 * aslEfPorCm : null;
    if (TRd4 !== null && Tsd > TRd4) {
      avisos.push('T<sub>Sd</sub> = ' + (Tsd / 1000).toFixed(2) +
        ' tfm supera T<sub>Rd4</sub> = ' + (TRd4 / 1000).toFixed(2) +
        ' tfm: a armadura longitudinal informada não equilibra a torção.');
    }

    return {
      Tsd: Tsd, TsdTfm: Tsd / 1000, TskTfm: Tsd / 1000 / (e.gammaF || 1),
      he: he, bnuc: bnuc, hnuc: hnuc, Ae: Ae, ue: ue, c1: e.c1,
      TRd2: TRd2, TRd2Tfm: TRd2 / 1000,
      fatorT3: fatorT3, fatorT4: fatorT4,
      aslEf: aslEf, aslEfM: aslEfPorCm * 100,
      TRd4Tfm: TRd4 === null ? null : TRd4 / 1000,
      a90: a90, a90M: a90 * 100,
      a90Min: a90Min, a90MinM: a90Min * 100,
      a90MinDuploM: m.rhoMin * bw * 100,
      a90Nec: a90Nec, a90NecM: a90Nec * 100,
      asl: asl, aslM: asl * 100,
      aslMin: aslMin, aslMinM: aslMin * 100,
      aslNec: aslNec, aslNecM: aslNec * 100,
      aslTotal: aslNec * ue,
      aslFaceHor: aslNec * bnuc,
      aslFaceVer: aslNec * hnuc,
      minimaGoverna: a90 < a90Min,
      biela: TRd2 > 0 ? Tsd / TRd2 : Infinity
    };
  }

  /* ---------------------------------------------------------------------
     Calculo completo
     --------------------------------------------------------------------- */
  function calcular(e) {
    var avisos = [];
    var m = materiais(e);
    var modo = e.modo || 'CORTANTE';
    var comV = modo === 'CORTANTE' || modo === 'AMBOS';
    var comT = modo === 'TORCAO' || modo === 'AMBOS';

    var alphaG = e.alpha > 0 ? e.alpha : 90;
    var thetaG = e.modelo === 'II' ? e.theta : 45;
    if (alphaG < 45 || alphaG > 90) {
      avisos.push('A NBR 6118 admite estribos entre 45° e 90°; α = ' +
        alphaG.toFixed(0) + '° está fora desse intervalo.');
    }
    if (e.modelo === 'II' && (thetaG < 30 || thetaG > 45)) {
      avisos.push('No modelo II a biela deve ficar entre 30° e 45°; θ = ' +
        thetaG.toFixed(0) + '° está fora desse intervalo.');
    }

    var V = comV ? cortante(e, m, avisos) : null;
    var T = comT ? torcao(e, m, avisos) : null;

    /* interacao cortante + torcao - item 17.7.2.2 */
    var interacao = null;
    if (comV && comT) {
      interacao = V.Vsd / V.VRd2 + T.Tsd / T.TRd2;
      if (interacao > 1) {
        avisos.push('(V<sub>Sd</sub>/V<sub>Rd2</sub>) + (T<sub>Sd</sub>/T<sub>Rd2</sub>) = ' +
          interacao.toFixed(2) + ' > 1: as bielas não resistem à combinação.');
      }
    }

    /* estribo adotado: area por ramo, espacamento e limites */
    var areaPorRamo = area(e.diamEstribo, 1);
    var areaRamos = area(e.diamEstribo, e.nRamos);
    /* cortante distribui entre os n ramos; torcao usa apenas o ramo externo */
    var demandaPorRamo = (comV ? V.aswNec / e.nRamos : 0) + (comT ? T.a90Nec : 0);
    var sExato = demandaPorRamo > 0 ? areaPorRamo / demandaPorRamo : Infinity;

    var VsdRef = comV ? V.Vsd : 0;
    var VRd2Ref = comV ? V.VRd2 : Infinity;
    var lim = espacamentosMaximos(VsdRef, VRd2Ref, e.d);
    var sAdotado = Math.floor(Math.min(sExato, lim.longitudinal) * 2) / 2;
    if (sExato > lim.longitudinal) {
      avisos.push('Espaçamento limitado por s<sub>máx</sub> = ' +
        lim.longitudinal.toFixed(1) + ' cm (item 18.3.3.2).');
    }
    if (isFinite(sAdotado) && sAdotado < 5) {
      avisos.push('Espaçamento de ' + sAdotado.toFixed(1) +
        ' cm é impraticável: use bitola maior ou mais ramos.');
    }

    /* VRd3 = Vc + Vsw do estribo efetivamente adotado. Da parcela de cada
       ramo desconta-se o que a torcao consome, quando ha torcao. */
    if (comV && isFinite(sAdotado) && sAdotado > 0) {
      var porRamo = areaPorRamo / sAdotado - (comT ? T.a90Nec : 0);
      var aswReal = Math.max(0, porRamo) * e.nRamos;
      V.aswRealM = aswReal * 100;
      V.VswRealTf = Norma.kNParaTf(aswReal * V.braco);
      V.VRd3Tf = V.VcTf + V.VswRealTf;
      V.folga = V.VRd3Tf / V.VsdTf;
    }

    /* TRd3 = torque que o ramo externo do estribo adotado ainda equilibra,
       depois de reservada a demanda do cortante. E o espelho do VRd3, que
       reserva a demanda da torcao: cada verificacao atende a necessidade da
       outra e fica com a sobra do arredondamento do espacamento. */
    if (comT && isFinite(sAdotado) && sAdotado > 0) {
      var a90Disp = areaPorRamo / sAdotado - (comV ? V.aswNec / e.nRamos : 0);
      T.a90RealM = Math.max(0, a90Disp) * 100;
      T.TRd3Tfm = (T.fatorT3 * Math.max(0, a90Disp)) / 1000;
      if (T.TsdTfm > T.TRd3Tfm) {
        avisos.push('T<sub>Sd</sub> = ' + T.TsdTfm.toFixed(2) +
          ' tfm supera T<sub>Rd3</sub> = ' + T.TRd3Tfm.toFixed(2) +
          ' tfm: o estribo adotado não equilibra a torção.');
      }
    }

    return {
      modo: modo, cortante: V, torcao: T, interacao: interacao,
      /* materiais */
      fck: e.fck, fyk: e.fyk, gammaC: e.gammaC, gammaS: e.gammaS, gammaF: e.gammaF,
      fcd: m.fcd, fctm: m.p.fctm, fctkInf: m.p.fctkInf, fctd: m.fctd,
      fywd: m.fywd, fywdMPa: m.fywdMPa, limitadoFywd: m.limitadoFywd,
      alphaV2: m.alphaV2, rhoMin: m.rhoMin,
      /* geometria */
      bw: e.bw, bwMin: e.bwMin > 0 ? e.bwMin : e.bw, h: e.h, d: e.d, c1: e.c1,
      modelo: e.modelo, theta: thetaG, alpha: alphaG, refMin: e.refMin,
      /* detalhamento */
      diamEstribo: e.diamEstribo, nRamos: e.nRamos,
      areaPorRamo: areaPorRamo, areaRamos: areaRamos,
      demandaPorRamoM: demandaPorRamo * 100,
      sExato: sExato, sAdotado: sAdotado,
      sMax: lim.longitudinal, stMax: lim.transversal,
      avisos: avisos
    };
  }

  FS.Cisalhamento = {
    calcular: calcular,
    area: area,
    espacamentosMaximos: espacamentosMaximos,
    FYWD_MAX: FYWD_MAX
  };
})(typeof window !== 'undefined' ? window : globalThis);
