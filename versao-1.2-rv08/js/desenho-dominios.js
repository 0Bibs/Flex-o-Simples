/* ---------------------------------------------------------------------------
   Flexo Simples - desenho dos dominios de deformacao (NBR 6118 item 17.2.2)
   Escalas horizontais independentes para alongamento e encurtamento.
   --------------------------------------------------------------------------- */
(function (root) {
  'use strict';

  var FS = (root.FS = root.FS || {});

  var VB_W = 720, VB_H = 330;
  var Y0 = 58, ALT = 200, Y1 = Y0 + ALT;
  var X0 = 430;              /* eixo de deformacao nula */
  var K_TRA = 19.5;          /* px por milesimo, lado tracionado */
  var LARG_COMP = 118;       /* px do eixo ate eps_cu */
  var X_TRA = X0 - 10 * K_TRA;

  function n(v) { return Math.round(v * 100) / 100; }

  function texto(x, y, s, cls, extra) {
    return '<text x="' + n(x) + '" y="' + n(y) + '" class="' + cls + '"' +
      (extra || '') + '>' + s + '</text>';
  }
  function linha(x1, y1, x2, y2, cls, extra) {
    return '<line x1="' + n(x1) + '" y1="' + n(y1) + '" x2="' + n(x2) + '" y2="' +
      n(y2) + '" class="' + cls + '"' + (extra || '') + '/>';
  }
  function ponto(p, rot, cls) {
    return '<circle cx="' + n(p[0]) + '" cy="' + n(p[1]) + '" r="3" class="dg-pivo"/>' +
      texto(p[0] + 6, p[1] + (rot === 'B' ? 15 : -5), rot, cls || 'dg-txt-cinza');
  }
  /* x da reta p1-p2 na altura y */
  function xEm(p1, p2, y) {
    if (Math.abs(p2[1] - p1[1]) < 1e-9) return p1[0];
    return p1[0] + ((y - p1[1]) * (p2[0] - p1[0])) / (p2[1] - p1[1]);
  }
  /* arco de raio r centrado em c, do angulo do ponto pa ate o do ponto pb */
  function arco(c, pa, pb, r) {
    var a1 = Math.atan2(pa[1] - c[1], pa[0] - c[0]);
    var a2 = Math.atan2(pb[1] - c[1], pb[0] - c[0]);
    var p1 = [c[0] + r * Math.cos(a1), c[1] + r * Math.sin(a1)];
    var p2 = [c[0] + r * Math.cos(a2), c[1] + r * Math.sin(a2)];
    var dif = a2 - a1;
    while (dif <= -Math.PI) dif += 2 * Math.PI;
    while (dif > Math.PI) dif -= 2 * Math.PI;
    var sweep = dif > 0 ? 1 : 0;
    return '<path class="dg-arco" d="M' + n(p1[0]) + ' ' + n(p1[1]) + ' A' + n(r) +
      ' ' + n(r) + ' 0 0 ' + sweep + ' ' + n(p2[0]) + ' ' + n(p2[1]) + '"/>';
  }

  function cotaVertical(x, ya, yb, rotulo) {
    var s = linha(x, ya, x, yb, 'dg-cota',
      ' marker-start="url(#doSetaC)" marker-end="url(#doSetaB)"');
    s += '<circle cx="' + n(x) + '" cy="' + n(ya) + '" r="2.6" class="dg-cota-pt"/>';
    s += '<circle cx="' + n(x) + '" cy="' + n(yb) + '" r="2.6" class="dg-cota-pt"/>';
    var ym = (ya + yb) / 2;
    s += '<text x="' + n(x - 5) + '" y="' + n(ym) + '" class="dg-cota-txt" ' +
      'transform="rotate(-90 ' + n(x - 5) + ' ' + n(ym) + ')">' + rotulo + '</text>';
    return s;
  }

  function desenhar(r) {
    var h = r.h, d = r.d, dl = r.dl;
    var kC = LARG_COMP / r.epsCu;
    var X_CU = X0 + LARG_COMP;
    var sy = ALT / h;
    var yd = Y0 + d * sy;
    var ydl = Y0 + dl * sy;

    var A = [X_TRA, yd];
    var B = [X_CU, Y0];
    var yC = Y0 + (1 - r.epsC2 / r.epsCu) * ALT;
    var xC = X0 + r.epsC2 * kC;
    var C = [xC, yC];
    var P0 = [X0, Y0];                       /* topo, deformacao nula */
    var Pyd = [X0 - r.epsYd * K_TRA, yd];    /* nivel de As, eps = eps_yd */
    var Pd = [X0, yd];                       /* nivel de As, deformacao nula */
    var Ph = [X0, Y1];                       /* base, deformacao nula */

    var s = '';

    s += '<defs>' +
      '<marker id="doSetaB" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" ' +
      'markerHeight="7" orient="auto"><path d="M0,1 L9,5 L0,9 z" class="dg-verde-f"/></marker>' +
      '<marker id="doSetaC" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" ' +
      'markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" class="dg-verde-f"/></marker>' +
      '</defs>';

    /* ---- cabecalhos ---- */
    s += texto((X_TRA + X0) / 2, 24, 'Alongamento', 'dg-titulo', ' text-anchor="middle"');
    s += texto((X0 + X_CU) / 2 + 30, 24, 'Encurtamento', 'dg-titulo', ' text-anchor="middle"');

    /* ---- regiao sombreada do estado atual ---- */
    var xTopo = X0 + r.epsC * kC;
    var xAs = X0 - r.epsS * K_TRA;
    s += '<polygon class="dg-eps-area" points="' +
      n(xTopo) + ',' + n(Y0) + ' ' + n(X_CU) + ',' + n(Y0) + ' ' +
      n(X_CU) + ',' + n(yd) + ' ' + n(xAs) + ',' + n(yd) + '"/>';

    /* ---- retangulo da secao ---- */
    s += '<rect class="dg-quadro" x="' + n(X_TRA) + '" y="' + n(Y0) + '" width="' +
      n(X_CU - X_TRA) + '" height="' + n(ALT) + '"/>';
    s += linha(X_TRA, yd, X_CU, yd, 'dg-aux');

    /* ---- retas limite dos dominios ---- */
    s += linha(A[0], A[1], P0[0], P0[1], 'dg-lim');   /* 1 / 2 */
    s += linha(A[0], A[1], B[0], B[1], 'dg-lim');     /* 2 / 3 */
    s += linha(B[0], B[1], Pyd[0], Pyd[1], 'dg-lim'); /* 3 / 4 */
    s += linha(B[0], B[1], Pd[0], Pd[1], 'dg-lim');   /* 4 / 4a */
    s += linha(B[0], B[1], Ph[0], Ph[1], 'dg-lim');   /* 4a / 5 */
    s += linha(xC, Y0, xC, Y1, 'dg-lim');             /* compressao uniforme */

    /* arcos indicando a rotacao em torno dos polos */
    var larg = B[0] - A[0];
    s += arco(A, [A[0], Y0], B, Math.min(0.3 * larg, 0.62 * (yd - Y0)));
    s += arco(B, A, Ph, 0.34 * larg);

    /* ---- eixo de deformacao nula ---- */
    s += linha(X0, Y0 - 16, X0, Y1 + 16, 'dg-eixo');

    /* ---- numeracao dos dominios ---- */
    var yn = Y0 + 0.78 * ALT;
    function meio(p1a, p1b, p2a, p2b, y) {
      return (xEm(p1a, p1b, y) + xEm(p2a, p2b, y)) / 2;
    }
    s += texto(meio([X_TRA, Y0], [X_TRA, Y1], A, P0, Y0 + 0.42 * ALT) - 6,
      Y0 + 0.42 * ALT, '1', 'dg-num');
    s += texto(X_CU - 44, Y0 + 22, '2', 'dg-num');
    s += texto(meio(A, B, B, Pyd, yn) - 6, yn, '3', 'dg-num');
    s += texto(meio(B, Pyd, B, Pd, yn) - 6, yn, '4', 'dg-num');
    s += texto(X0 + 3, Y1 - 7, '4a', 'dg-num-p');
    s += texto((xEm(B, Ph, yn) + xC) / 2 - 6, yn, '5', 'dg-num');

    /* ---- polos ---- */
    s += ponto(A, 'A');
    s += ponto(B, 'B');
    s += ponto(C, 'C');

    /* ---- cotas ---- */
    s += cotaVertical(X_TRA + 22, Y0, yd, 'd= ' + n(d) + ' cm');
    s += cotaVertical(X_CU + 24, Y0, Y1, 'h= ' + n(h) + ' cm');
    if (dl > 0) {
      s += linha(X_TRA + 78, Y0, X_TRA + 78, ydl, 'dg-cota',
        ' marker-start="url(#doSetaC)" marker-end="url(#doSetaB)"');
      s += texto(X_TRA + 84, ydl + 4, "d'= " + n(dl) + ' cm', 'dg-cota-txt-h');
    }

    /* ---- rotulos de deformacao (os fixos cedem lugar ao valor atual) ---- */
    var LONGE = 28;
    if (Math.abs(xAs - X_TRA) > LONGE) {
      s += texto(X_TRA, Y1 + 18, (10).toFixed(1) + '‰', 'dg-txt-cinza',
        ' text-anchor="middle"');
    }
    if (Math.abs(xAs - Pyd[0]) > LONGE) {
      s += texto(Pyd[0], Y1 + 18, r.epsYd.toFixed(2) + '‰', 'dg-txt-cinza',
        ' text-anchor="middle"');
    }
    if (Math.abs(xTopo - X_CU) > LONGE) {
      s += texto(X_CU, Y0 - 8, r.epsCu.toFixed(2) + '‰', 'dg-txt-cinza',
        ' text-anchor="middle"');
    }

    /* ---- reta do estado atual ---- */
    s += '<line x1="' + n(xTopo) + '" y1="' + n(Y0) + '" x2="' + n(xAs) + '" y2="' +
      n(yd) + '" class="dg-eps-lin"/>';
    s += texto(xTopo - 6, Y0 - 8, r.epsC.toFixed(1) + '‰', 'dg-txt-azul',
      ' text-anchor="end"');
    s += texto(xAs, Y1 + 18, r.epsS.toFixed(1) + '‰', 'dg-txt-azul',
      ' text-anchor="middle"');

    return '<svg viewBox="0 0 ' + VB_W + ' ' + VB_H + '" class="dg" ' +
      'xmlns="http://www.w3.org/2000/svg" role="img" ' +
      'aria-label="Dominios de deformacao">' + s + '</svg>';
  }

  FS.DesenhoDominios = { desenhar: desenhar };
})(typeof window !== 'undefined' ? window : globalThis);
