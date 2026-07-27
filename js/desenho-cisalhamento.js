/* ---------------------------------------------------------------------------
   Flexo Simples - desenhos de cortante e torcao
     secao()      secao transversal com o estribo adotado
     vazada()     secao vazada equivalente da torcao (item 17.5)
     bielas()     aproveitamento das bielas comprimidas
   --------------------------------------------------------------------------- */
(function (root) {
  'use strict';

  var FS = (root.FS = root.FS || {});

  function n(v) { return Math.round(v * 100) / 100; }

  function texto(x, y, s, cls, extra) {
    return '<text x="' + n(x) + '" y="' + n(y) + '" class="' + cls + '"' +
      (extra || '') + '>' + s + '</text>';
  }
  function linha(x1, y1, x2, y2, cls, extra) {
    return '<line x1="' + n(x1) + '" y1="' + n(y1) + '" x2="' + n(x2) + '" y2="' +
      n(y2) + '" class="' + cls + '"' + (extra || '') + '/>';
  }
  function defsSetas(id) {
    return '<defs>' +
      '<marker id="' + id + 'B" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" ' +
      'markerHeight="7" orient="auto"><path d="M0,1 L9,5 L0,9 z" class="dg-verde-f"/></marker>' +
      '<marker id="' + id + 'C" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" ' +
      'markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" ' +
      'class="dg-verde-f"/></marker></defs>';
  }
  /* cota vertical, com o rotulo girado */
  function cotaV(id, x, ya, yb, rotulo) {
    var ym = (ya + yb) / 2;
    return linha(x, ya, x, yb, 'dg-cota',
      ' marker-start="url(#' + id + 'C)" marker-end="url(#' + id + 'B)"') +
      '<circle cx="' + n(x) + '" cy="' + n(ya) + '" r="2.6" class="dg-cota-pt"/>' +
      '<circle cx="' + n(x) + '" cy="' + n(yb) + '" r="2.6" class="dg-cota-pt"/>' +
      '<text x="' + n(x - 5) + '" y="' + n(ym) + '" class="dg-cota-txt" ' +
      'transform="rotate(-90 ' + n(x - 5) + ' ' + n(ym) + ')">' + rotulo + '</text>';
  }
  /* cota horizontal */
  function cotaH(id, y, xa, xb, rotulo) {
    return linha(xa, y, xb, y, 'dg-cota',
      ' marker-start="url(#' + id + 'C)" marker-end="url(#' + id + 'B)"') +
      '<circle cx="' + n(xa) + '" cy="' + n(y) + '" r="2.6" class="dg-cota-pt"/>' +
      '<circle cx="' + n(xb) + '" cy="' + n(y) + '" r="2.6" class="dg-cota-pt"/>' +
      texto((xa + xb) / 2, y + 15, rotulo, 'dg-cota-txt', ' text-anchor="middle"');
  }
  function svg(w, h, corpo, rotulo) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="dg" ' +
      'xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + rotulo + '">' +
      corpo + '</svg>';
  }

  /* escala que cabe a secao numa area de desenho */
  function escala(bw, h, maxL, maxA) {
    return Math.min(maxL / bw, maxA / h);
  }

  /* ------------------------------------------------ secao com estribos */
  function secao(r) {
    var W = 720, H = 300, x0 = 150, y0 = 40;
    var esc = escala(r.bw, r.h, 190, 210);
    var L = r.bw * esc, A = r.h * esc;
    var cob = Math.max(4, 2.5 * esc);              /* recuo visual do estribo */
    var s = defsSetas('cs');

    /* concreto */
    s += '<rect class="dg-secao" x="' + n(x0) + '" y="' + n(y0) + '" width="' + n(L) +
      '" height="' + n(A) + '"/>';

    /* estribo fechado */
    s += '<rect class="dg-estribo" x="' + n(x0 + cob) + '" y="' + n(y0 + cob) +
      '" width="' + n(L - 2 * cob) + '" height="' + n(A - 2 * cob) + '" rx="' + n(cob * 0.6) + '"/>';

    /* ramos internos, quando houver mais de dois */
    var i, xr;
    for (i = 1; i < r.nRamos - 1; i++) {
      xr = x0 + cob + ((L - 2 * cob) * i) / (r.nRamos - 1);
      s += linha(xr, y0 + cob, xr, y0 + A - cob, 'dg-estribo-ramo');
    }

    /* barras longitudinais nos cantos */
    var rb = Math.max(3, 1.6 * esc);
    [[x0 + cob + rb, y0 + cob + rb], [x0 + L - cob - rb, y0 + cob + rb],
     [x0 + cob + rb, y0 + A - cob - rb], [x0 + L - cob - rb, y0 + A - cob - rb]]
      .forEach(function (p) {
        s += '<circle cx="' + n(p[0]) + '" cy="' + n(p[1]) + '" r="' + n(rb) +
          '" class="dg-barra"/>';
      });

    /* cotas */
    s += cotaH('cs', y0 + A + 26, x0, x0 + L, 'b<tspan class="sub" dy="2.5">w</tspan>= ' +
      n(r.bw) + ' cm');
    s += cotaV('cs', x0 - 26, y0, y0 + A, 'h= ' + n(r.h) + ' cm');
    s += cotaV('cs', x0 + L + 30, y0, y0 + (r.d / r.h) * A, 'd= ' + n(r.d) + ' cm');

    /* legenda do estribo adotado */
    var y = y0 + 24, xt = x0 + L + 76;
    s += texto(xt, y, 'Estribo adotado', 'dg-titulo');
    y += 26;
    s += texto(xt, y, 'Ø ' + r.diamEstribo.toFixed(1) + ' mm c/ ' +
      (isFinite(r.sAdotado) ? r.sAdotado.toFixed(1) : '—') + ' cm', 'dg-txt-destaque');
    y += 22;
    s += texto(xt, y, r.nRamos + ' ramos · ' + r.demandaPorRamoM.toFixed(2) +
      ' cm²/m por ramo', 'dg-txt-cinza');
    y += 20;
    s += texto(xt, y, 's' + '<tspan class="sub" dy="2.5">máx</tspan>' +
      '<tspan dy="-2.5"> = ' + r.sMax.toFixed(1) + ' cm</tspan>', 'dg-txt-cinza');
    if (r.cortante) {
      y += 20;
      s += texto(xt, y, 'A' + '<tspan class="sub" dy="2.5">sw</tspan>' +
        '<tspan dy="-2.5"> = ' + r.cortante.aswNecM.toFixed(2) + ' cm²/m (' +
        r.nRamos + 'R)</tspan>', 'dg-txt-cinza');
    }
    if (r.torcao) {
      y += 20;
      s += texto(xt, y, 'A' + '<tspan class="sub" dy="2.5">90</tspan>' +
        '<tspan dy="-2.5"> = ' + r.torcao.a90NecM.toFixed(2) + ' cm²/m (1R)</tspan>',
      'dg-txt-cinza');
    }
    return svg(W, H, s, 'Secao transversal com estribos');
  }

  /* ------------------------------------------------ secao vazada equivalente */
  function vazada(r) {
    var T = r.torcao;
    var W = 720, H = 300, x0 = 210, y0 = 34;
    var esc = escala(r.bw, r.h, 200, 220);
    var L = r.bw * esc, A = r.h * esc, e = T.he * esc;
    var s = defsSetas('vz');

    /* parede: area cheia menos o nucleo vazado */
    s += '<path class="dg-parede" fill-rule="evenodd" d="' +
      'M' + n(x0) + ' ' + n(y0) + ' h' + n(L) + ' v' + n(A) + ' h' + n(-L) + ' Z ' +
      'M' + n(x0 + e) + ' ' + n(y0 + e) + ' h' + n(L - 2 * e) + ' v' + n(A - 2 * e) +
      ' h' + n(-(L - 2 * e)) + ' Z"/>';
    s += '<rect class="dg-secao-vazio" x="' + n(x0) + '" y="' + n(y0) + '" width="' +
      n(L) + '" height="' + n(A) + '"/>';
    s += '<rect class="dg-secao-vazio" x="' + n(x0 + e) + '" y="' + n(y0 + e) +
      '" width="' + n(L - 2 * e) + '" height="' + n(A - 2 * e) + '"/>';

    /* linha media da parede: e onde atuam Ae e ue */
    s += '<rect class="dg-linha-media" x="' + n(x0 + e / 2) + '" y="' + n(y0 + e / 2) +
      '" width="' + n(L - e) + '" height="' + n(A - e) + '"/>';

    /* cotas: hnuc, he e bnuc, como na referencia */
    s += cotaV('vz', x0 - 24, y0 + e / 2, y0 + A - e / 2, T.hnuc.toFixed(1));
    s += cotaH('vz', y0 + A + 28, x0 + e / 2, x0 + L - e / 2, T.bnuc.toFixed(1));
    s += cotaH('vz', y0 + A / 2, x0, x0 + e, '');
    s += texto(x0 + e + 10, y0 + A / 2 + 5, 'h<tspan class="sub" dy="2.5">e</tspan>' +
      '<tspan dy="-2.5"> = ' + T.he.toFixed(1) + ' cm</tspan>', 'dg-cota-txt-h');

    /* legenda */
    var y = y0 + 24, xt = x0 + L + 60;
    s += texto(xt, y, 'Seção vazada equivalente', 'dg-titulo');
    y += 26;
    s += texto(xt, y, 'A<tspan class="sub" dy="2.5">e</tspan><tspan dy="-2.5"> = ' +
      T.Ae.toFixed(0) + ' cm²</tspan>', 'dg-txt-cinza');
    y += 20;
    s += texto(xt, y, 'u<tspan class="sub" dy="2.5">e</tspan><tspan dy="-2.5"> = ' +
      T.ue.toFixed(1) + ' cm</tspan>', 'dg-txt-cinza');
    y += 20;
    s += texto(xt, y, 'A<tspan class="sub" dy="2.5">sl</tspan>' +
      '<tspan dy="-2.5"> total = ' + T.aslTotal.toFixed(2) + ' cm²</tspan>', 'dg-txt-cinza');
    y += 20;
    s += texto(xt, y, 'por face: ' + T.aslFaceHor.toFixed(2) + ' cm² (hor.) · ' +
      T.aslFaceVer.toFixed(2) + ' cm² (vert.)', 'dg-txt-cinza');
    return svg(W, H, s, 'Secao vazada equivalente');
  }

  /* ------------------------------------------------ aproveitamento das bielas */
  function bielas(r) {
    var W = 720, H = 0, x0 = 150, larg = 420;
    var itens = [];
    if (r.cortante) {
      itens.push(['V<tspan class="sub" dy="2.5">Sd</tspan><tspan dy="-2.5">/V</tspan>' +
        '<tspan class="sub" dy="2.5">Rd2</tspan>', r.cortante.biela]);
    }
    if (r.torcao) {
      itens.push(['T<tspan class="sub" dy="2.5">Sd</tspan><tspan dy="-2.5">/T</tspan>' +
        '<tspan class="sub" dy="2.5">Rd2</tspan>', r.torcao.biela]);
    }
    if (r.interacao !== null && r.interacao !== undefined) {
      itens.push(['soma', r.interacao]);
    }
    H = 46 + itens.length * 40;

    var s = '';
    /* trilho de 0 a 1 com a marca do limite */
    itens.forEach(function (item, i) {
      var y = 34 + i * 40;
      var v = isFinite(item[1]) ? Math.max(0, item[1]) : 0;
      s += texto(x0 - 12, y + 5, item[0], 'dg-txt-cinza', ' text-anchor="end"');
      s += '<rect class="dg-trilho" x="' + n(x0) + '" y="' + n(y - 9) + '" width="' +
        n(larg) + '" height="18" rx="2"/>';
      s += '<rect class="' + (v > 1 ? 'dg-barra-ruim' : 'dg-barra-boa') + '" x="' + n(x0) +
        '" y="' + n(y - 9) + '" width="' + n(Math.min(v, 1.15) * larg) + '" height="18" rx="2"/>';
      s += texto(x0 + larg + 12, y + 5, v.toFixed(2), v > 1 ? 'dg-txt-verm' : 'dg-txt-cinza');
    });
    /* limite 1,00 */
    s += linha(x0 + larg, 16, x0 + larg, H - 12, 'dg-limite');
    s += texto(x0 + larg, 12, '1,00', 'dg-txt-cinza', ' text-anchor="middle"');
    return svg(W, H, s, 'Aproveitamento das bielas comprimidas');
  }

  FS.DesenhoCisalhamento = { secao: secao, vazada: vazada, bielas: bielas };
})(typeof window !== 'undefined' ? window : globalThis);
