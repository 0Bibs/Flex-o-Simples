/* ---------------------------------------------------------------------------
   Flexo Simples - desenho do equilibrio da secao
   Secao transversal + diagrama de deformacoes + bloco de tensoes + resultantes
   --------------------------------------------------------------------------- */
(function (root) {
  'use strict';

  var FS = (root.FS = root.FS || {});

  var VB_W = 720, VB_H = 300;
  var Y0 = 48, ALT = 200;          /* topo e altura do desenho da secao (px) */
  var Y1 = Y0 + ALT;
  var SEC_X = 28, SEC_MAX = 88;    /* posicao e largura maxima da secao (px) */
  var EIXO = 258;                  /* eixo de deformacao nula (px) */
  var K_EPS = 7.8;                 /* px por milesimo de deformacao */
  var COTA_D = 332, COTA_X = 386, COTA_Y = 410;
  var BLOCO_X = 442, BLOCO_L = 72;
  var TXT_F = 552;                 /* coluna dos rotulos de forca */

  function n(v) { return Math.round(v * 100) / 100; }

  function texto(x, y, s, cls, extra) {
    return '<text x="' + n(x) + '" y="' + n(y) + '" class="' + cls + '"' +
      (extra || '') + '>' + s + '</text>';
  }

  function linha(x1, y1, x2, y2, cls, extra) {
    return '<line x1="' + n(x1) + '" y1="' + n(y1) + '" x2="' + n(x2) +
      '" y2="' + n(y2) + '" class="' + cls + '"' + (extra || '') + '/>';
  }

  /* Cota vertical com setas nas duas pontas e rotulo girado */
  function cotaVertical(x, ya, yb, rotulo, cls) {
    var s = '';
    s += linha(x, ya, x, yb, cls, ' marker-start="url(#eqSetaC)" marker-end="url(#eqSetaB)"');
    s += '<circle cx="' + n(x) + '" cy="' + n(ya) + '" r="2.6" class="' + cls + '-pt"/>';
    s += '<circle cx="' + n(x) + '" cy="' + n(yb) + '" r="2.6" class="' + cls + '-pt"/>';
    var ym = (ya + yb) / 2;
    s += '<text x="' + n(x - 5) + '" y="' + n(ym) + '" class="dg-cota-txt" ' +
      'transform="rotate(-90 ' + n(x - 5) + ' ' + n(ym) + ')">' + rotulo + '</text>';
    return s;
  }

  function desenhar(r) {
    var h = r.h, d = r.d, dl = r.dl;
    var sy = ALT / h;
    var yd = Y0 + d * sy;
    var xVis = Math.max(0, Math.min(r.x, h));           /* LN visivel */
    var yLN = Y0 + xVis * sy;
    var yBloco = Y0 + Math.max(0, Math.min(r.y, h)) * sy;

    /* largura da secao em px */
    var bTopo = r.secaoT ? r.bf : r.bw;
    var esc = SEC_MAX / bTopo;
    var wBw = r.bw * esc, wBf = bTopo * esc;
    var cx = SEC_X + wBf / 2;
    var yhf = Y0 + (r.secaoT ? r.hf : 0) * sy;

    var s = '';

    /* ---- defs ---- */
    s += '<defs>' +
      '<marker id="eqSetaB" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" ' +
      'markerHeight="7" orient="auto"><path d="M0,1 L9,5 L0,9 z" class="dg-verde-f"/></marker>' +
      '<marker id="eqSetaC" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" ' +
      'markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" class="dg-verde-f"/></marker>' +
      '<marker id="eqSetaCinza" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" ' +
      'markerHeight="8" orient="auto"><path d="M0,1 L9,5 L0,9 z" class="dg-cinza-f"/></marker>' +
      '<marker id="eqSetaVerm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" ' +
      'markerHeight="8" orient="auto"><path d="M0,1 L9,5 L0,9 z" class="dg-verm-f"/></marker>' +
      '</defs>';

    /* ---- secao transversal ---- */
    if (r.secaoT) {
      var xw0 = cx - wBw / 2, xw1 = cx + wBw / 2;
      s += '<path class="dg-secao" d="M' + n(SEC_X) + ' ' + n(Y0) +
        ' H' + n(SEC_X + wBf) + ' V' + n(yhf) + ' H' + n(xw1) + ' V' + n(Y1) +
        ' H' + n(xw0) + ' V' + n(yhf) + ' H' + n(SEC_X) + ' Z"/>';
    } else {
      s += '<rect class="dg-secao" x="' + n(SEC_X) + '" y="' + n(Y0) +
        '" width="' + n(wBf) + '" height="' + n(ALT) + '"/>';
    }

    /* marca de quebra na lateral esquerda */
    var ymq = Y0 + ALT * 0.52, xq = SEC_X;
    s += '<path class="dg-quebra" d="M' + n(xq - 7) + ' ' + n(ymq - 9) +
      ' L' + n(xq + 5) + ' ' + n(ymq - 3) + ' L' + n(xq - 5) + ' ' + n(ymq + 3) +
      ' L' + n(xq + 7) + ' ' + n(ymq + 9) + '"/>';

    /* armadura tracionada */
    var xa0 = (r.secaoT ? cx - wBw / 2 : SEC_X) + 3;
    var xa1 = (r.secaoT ? cx + wBw / 2 : SEC_X + wBf) - 3;
    s += '<rect class="dg-as" x="' + n(xa0) + '" y="' + n(yd - 2.2) + '" width="' +
      n(xa1 - xa0) + '" height="4.4"/>';
    s += texto(xa1 + 6, yd - 4, 'A<tspan class="sub" dy="2.5">s</tspan>', 'dg-txt-verm');

    /* armadura comprimida, quando existir */
    if (r.Asl > 0 && dl > 0) {
      var ydl = Y0 + dl * sy;
      s += '<rect class="dg-as" x="' + n(xa0) + '" y="' + n(ydl - 2.2) + '" width="' +
        n(xa1 - xa0) + '" height="4.4"/>';
      s += texto(xa1 + 6, ydl + 12,
        'A<tspan class="sub" dy="2.5">s</tspan><tspan dy="-2.5">\u2032</tspan>', 'dg-txt-verm');
    }

    /* ---- linha neutra atravessando todo o desenho ---- */
    s += linha(14, yLN, 700, yLN, 'dg-ln');
    s += texto(16, yLN - 6, 'LN', 'dg-txt-cinza');

    /* ---- diagrama de deformacoes ---- */
    var epsH = r.x > 0 ? (r.epsC * (h - r.x)) / r.x : 10; /* deformacao na base */
    var pTopo = EIXO + r.epsC * K_EPS;
    var pBase = EIXO - epsH * K_EPS;
    s += '<polygon class="dg-eps-area" points="' +
      n(pTopo) + ',' + n(Y0) + ' ' + n(EIXO) + ',' + n(yLN) + ' ' +
      n(pBase) + ',' + n(Y1) + ' ' + n(EIXO) + ',' + n(Y1) + ' ' +
      n(EIXO) + ',' + n(Y0) + '"/>';
    s += '<polyline class="dg-eps-lin" points="' + n(pTopo) + ',' + n(Y0) + ' ' +
      n(EIXO) + ',' + n(yLN) + ' ' + n(pBase) + ',' + n(Y1) + '"/>';
    s += linha(EIXO, Y0, EIXO, Y1, 'dg-eixo');
    s += texto(pTopo + 4, Y0 - 5, r.epsC.toFixed(1) + '‰', 'dg-txt-azul');
    s += texto(EIXO - r.epsS * K_EPS - 4, yd + 14, r.epsS.toFixed(1) + '‰',
      'dg-txt-azul', ' text-anchor="end"');

    /* ---- cotas ---- */
    s += cotaVertical(COTA_D, Y0, yd, 'd= ' + n(d) + ' cm', 'dg-cota');
    if (xVis > 1.5) s += cotaVertical(COTA_X, Y0, yLN, 'x', 'dg-cota');
    else s += texto(COTA_X + 4, Y0 + 12, 'x', 'dg-cota-txt');
    s += cotaVertical(COTA_Y, Y0, Math.max(yBloco, Y0 + 1),
      r.lambda.toFixed(2) + 'x', 'dg-cota');

    /* ---- bloco de tensoes e resultantes ---- */
    s += '<rect class="dg-bloco" x="' + n(BLOCO_X) + '" y="' + n(Y0) + '" width="' +
      n(BLOCO_L) + '" height="' + n(Math.max(yBloco - Y0, 1)) + '"/>';
    s += texto(BLOCO_X, Y0 - 8,
      r.alphaC.toFixed(2) + 'f<tspan class="sub" dy="2.5">cd</tspan>', 'dg-txt-cinza');

    var yRcc = Y0 + Math.max(yBloco - Y0, 6) / 2;
    s += linha(BLOCO_X + BLOCO_L + 46, yRcc, BLOCO_X + 6, yRcc, 'dg-forca-c',
      ' marker-end="url(#eqSetaCinza)"');
    s += texto(TXT_F + 20, yRcc + 5, r.RccTf.toFixed(2) + ' tf', 'dg-txt-forca-c');

    s += linha(BLOCO_X + 6, yd, BLOCO_X + BLOCO_L + 46, yd, 'dg-forca-t',
      ' marker-end="url(#eqSetaVerm)"');
    s += texto(TXT_F + 20, yd + 5, r.RstTf.toFixed(2) + ' tf', 'dg-txt-forca-t');

    return '<svg viewBox="0 0 ' + VB_W + ' ' + VB_H + '" class="dg" ' +
      'xmlns="http://www.w3.org/2000/svg" role="img" ' +
      'aria-label="Equilibrio da secao">' + s + '</svg>';
  }

  FS.DesenhoEquilibrio = { desenhar: desenhar };
})(typeof window !== 'undefined' ? window : globalThis);
