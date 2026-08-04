/* ---------------------------------------------------------------------------
   Flexo Simples - interface de cortante e torcao
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  var Cis = window.FS.Cisalhamento;
  var Dg = window.FS.DesenhoCisalhamento;

  var BITOLAS = [5.0, 6.3, 8.0, 10.0, 12.5, 16.0];
  var atualizando = false;

  function $(id) { return document.getElementById(id); }
  function val(id) { var v = parseFloat($(id).value.replace(',', '.')); return isNaN(v) ? 0 : v; }
  function set(id, v) { $(id).value = v; }
  function dec(v, c) { return isFinite(v) ? v.toFixed(c) : '—'; }
  function num(v) {
    if (!isFinite(v)) return '—';
    return Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v))
      : String(Math.round(v * 100) / 100);
  }

  function modoAtual() {
    return document.querySelector('input[name="modo"]:checked').value;
  }

  function entrada() {
    return {
      modo: modoAtual(),
      fck: val('fck'), fyk: val('fyk'),
      gammaC: val('gammaC'), gammaS: val('gammaS'), gammaF: val('gammaF'),
      bw: val('bw'), bwMin: val('bwMin'), h: val('h'), d: val('d'), c1: val('c1'),
      modelo: $('modelo').value,
      theta: val('theta'), alpha: val('alpha'),
      refMin: $('refMin').value,
      Vsd: val('vsd'), Tsd: val('tsd'),
      diamEstribo: parseFloat($('diamEstribo').value),
      nRamos: Math.max(2, Math.round(val('nRamos')))
    };
  }

  function erros(e) {
    var lista = [];
    if (!(e.bw > 0)) lista.push('Informe b<sub>w</sub> maior que zero.');
    if (!(e.h > 0)) lista.push('Informe h maior que zero.');
    if (!(e.d > 0)) lista.push('Informe d maior que zero.');
    if (e.d >= e.h) lista.push('d deve ser menor que h.');
    if (!(e.fck > 0)) lista.push('Informe f<sub>ck</sub> maior que zero.');
    if (!(e.fyk > 0)) lista.push('Informe f<sub>ywk</sub> maior que zero.');
    if (!(e.gammaC > 0) || !(e.gammaS > 0)) {
      lista.push('Coeficientes γ devem ser maiores que zero.');
    }
    if (e.bwMin > e.bw) lista.push('b<sub>w,mín</sub> não pode superar b<sub>w</sub>.');
    return lista;
  }

  /* ------------------------------------------------ render */
  /* Escreve num campo do relatorio se ele existir: com um service worker
     servindo pagina e script de versoes diferentes, um id novo pode faltar
     no HTML em cache, e um id ausente nao pode derrubar o relatorio todo. */
  function escreve(id, html) {
    var e = $(id);
    if (e) e.innerHTML = html;
  }
  function escreveTexto(id, texto) {
    var e = $(id);
    if (e) e.textContent = texto;
  }

  function calcular() {
    var e = entrada();
    var problemas = erros(e);
    if (problemas.length) {
      escreve('repAvisos', problemas.map(function (m) {
        return '<p class="aviso">' + m + '</p>';
      }).join(''));
      return;
    }
    var r = Cis.calcular(e);
    render(r, e);
  }

  function render(r, e) {
    var comV = !!r.cortante, comT = !!r.torcao;

    document.body.classList.toggle('modo-v', comV);
    document.body.classList.toggle('modo-t', comT);
    document.body.classList.toggle('modo-vt', comV && comT);

    escreveTexto('titulo', comV && comT ? 'Cortante + torção'
      : (comT ? 'Torção' : 'Cortante'));

    escreve('repAvisos', r.avisos.map(function (m) {
      return '<p class="aviso">' + m + '</p>';
    }).join(''));

    if (comV) {
      var V = r.cortante;
      escreve('repCortante',
      '<p>A<sub>sw,nec</sub> = ' + dec(V.aswNecM, 2) + ' cm²/m (' + r.nRamos + 'R)' +
        (V.minimaGoverna ? ' <span class="marca-min">mínima governa</span>' : '') + '</p>' +
        '<p>A<sub>sw,mín</sub> = ' + dec(V.aswMinM, 2) + ' cm²/m</p>' +
        '<p>A<sub>sw,calc</sub> = ' + dec(V.aswCalcM, 2) + ' cm²/m</p>' +
        '<p>V<sub>Rd2</sub> = ' + dec(V.VRd2Tf, 2) + ' tf</p>' +
        '<p>V<sub>c</sub> = ' + dec(V.VcTf, 2) + ' tf</p>' +
        '<p>V<sub>sw</sub> = ' + dec(V.VswTf, 2) + ' tf</p>' +
        (V.VRd3Tf !== undefined
          ? '<p>V<sub>Rd3</sub> = ' + dec(V.VRd3Tf, 2) + ' tf (estribo adotado)</p>' : ''));
    }

    if (comT) {
      var T = r.torcao;
      escreve('repTorcao',
      '<p>A<sub>90,nec</sub> = ' + dec(T.a90NecM, 2) + ' cm²/m (1R)' +
        (T.minimaGoverna ? ' <span class="marca-min">mínima governa</span>' : '') + '</p>' +
        '<p>A<sub>90,mín</sub> = ' + dec(T.a90MinM, 2) + ' cm²/m (1R)</p>' +
        '<p>A<sub>sl,nec</sub> = ' + dec(T.aslNecM, 2) + ' cm²/m de perímetro</p>' +
        '<p>A<sub>sl,mín</sub> = ' + dec(T.aslMinM, 2) + ' cm²/m de perímetro</p>' +
        '<p>A<sub>sl</sub> total = ' + dec(T.aslTotal, 2) + ' cm²</p>' +
        '<p>A<sub>sl,face</sub> = ' + dec(T.aslFaceHor, 2) + ' cm² (horizontal) · ' +
        dec(T.aslFaceVer, 2) + ' cm² (vertical)</p>' +
        '<p>T<sub>Rd2</sub> = ' + dec(T.TRd2Tfm, 2) + ' tfm</p>' +
        '<p>T<sub>Rd3</sub> = ' + dec(T.TRd3Tfm, 2) + ' tfm</p>' +
        '<p>T<sub>Rd4</sub> = ' + dec(T.TRd4Tfm, 2) + ' tfm</p>' +
        '<p>h<sub>e</sub> = ' + dec(T.he, 1) + ' cm · b<sub>nuc</sub> = ' +
        dec(T.bnuc, 1) + ' cm · h<sub>nuc</sub> = ' + dec(T.hnuc, 1) + ' cm</p>');
    }

    if (comV && comT) {
      escreve('repInteracao',
      '<p>(V<sub>Sd</sub>/V<sub>Rd2</sub>) + (T<sub>Sd</sub>/T<sub>Rd2</sub>) = ' +
        dec(r.interacao, 2) +
        (r.interacao > 1 ? ' <span class="marca-ruim">acima do limite</span>'
          : ' <span class="marca-ok">≤ 1,00</span>') + '</p>');
    }

    escreve('repEstribos',
      '<p>Ø ' + dec(r.diamEstribo, 1) + ' mm c/ <strong>' + dec(r.sAdotado, 1) +
      ' cm</strong> (' + r.nRamos + ' ramos)</p>' +
      '<p>Espaçamento exato: ' + dec(r.sExato, 1) + ' cm</p>' +
      '<p>s<sub>máx</sub> = ' + dec(r.sMax, 1) + ' cm · s<sub>t,máx</sub> = ' +
      dec(r.stMax, 1) + ' cm (item 18.3.3.2)</p>' +
      '<p>Demanda por ramo: ' + dec(r.demandaPorRamoM, 2) + ' cm²/m</p>');
    escreveTexto('outS', dec(r.sAdotado, 1));

    /* desenhos */
    escreve('repSecao', Dg.secao(r));
    if (comT) escreve('repVazada', Dg.vazada(r));
    escreve('repBielas', Dg.bielas(r));

    /* dados */
    escreve('repGeral',
      '<p>Norma utilizada: NBR-6118:' + $('norma').value + '</p>' +
      '<p>Modelo de cálculo: ' + (r.modelo === 'II' ? 'II (biela a ' + num(r.theta) + '°)'
        : 'I (biela a 45°)') + '</p>' +
      '<p>Inclinação do estribo: α = ' + num(r.alpha) + '°</p>');

    escreve('repGeometria',
      '<p>b<sub>w</sub> = ' + num(r.bw) + ' cm</p>' +
      '<p>b<sub>w,mín</sub> = ' + num(r.bwMin) + ' cm</p>' +
      '<p>h = ' + num(r.h) + ' cm</p>' +
      '<p>d = ' + num(r.d) + ' cm</p>' +
      (comT ? '<p>c<sub>1</sub> = ' + num(r.c1) + ' cm</p>' : ''));

    escreve('repMateriais',
      '<p>f<sub>ck</sub> = ' + num(r.fck) + ' MPa</p>' +
      '<p>f<sub>ywk</sub> = ' + num(r.fyk) + ' MPa</p>' +
      '<p>γ<sub>c</sub> = ' + dec(r.gammaC, 2) + '</p>' +
      '<p>γ<sub>s</sub> = ' + dec(r.gammaS, 2) + '</p>' +
      '<p>f<sub>ywd</sub> = ' + dec(r.fywdMPa, 1) + ' MPa' +
      (r.limitadoFywd ? ' (limitado a ' + Cis.FYWD_MAX + ' MPa)' : '') + '</p>' +
      '<p>f<sub>ctm</sub> = ' + dec(r.fctm, 2) + ' MPa · f<sub>ctd</sub> = ' +
      dec(r.fctd, 2) + ' MPa</p>');

    escreve('repEsforcos',
      (comV ? '<p>V<sub>Sk</sub> = ' + dec(r.cortante.VskTf, 2) + ' tf</p>' : '') +
      (comT ? '<p>T<sub>Sk</sub> = ' + dec(r.torcao.TskTfm, 2) + ' tfm</p>' : '') +
      '<p>γ<sub>f</sub> = ' + dec(r.gammaF, 2) + '</p>');

    $('gammaFT').textContent = dec(r.gammaF, 2);
  }

  /* ------------------------------------------------ ligacoes */
  function preencherBitolas() {
    $('diamEstribo').innerHTML = BITOLAS.map(function (b) {
      return '<option value="' + b + '">' + b.toFixed(1) + '</option>';
    }).join('');
    $('diamEstribo').value = '6.3';
  }

  function sincronizar(origem) {
    var gf = val('gammaF') || 1;
    if (origem === 'vsk' || origem === 'gammaF') set('vsd', dec(val('vsk') * gf, 2));
    else if (origem === 'vsd') set('vsk', dec(val('vsd') / gf, 2));
    if (origem === 'tsk' || origem === 'gammaF') set('tsd', dec(val('tsk') * gf, 2));
    else if (origem === 'tsd') set('tsk', dec(val('tsd') / gf, 2));
  }

  function ligar() {
    document.querySelectorAll('.grupo .cab .chev').forEach(function (c) {
      c.parentNode.addEventListener('click', function () {
        c.closest('.grupo').classList.toggle('aberto');
      });
    });

    ['fck', 'fyk', 'gammaC', 'gammaS', 'bw', 'bwMin', 'h', 'd', 'c1',
      'modelo', 'theta', 'alpha', 'refMin', 'diamEstribo', 'nRamos', 'norma']
      .forEach(function (id) {
        $(id).addEventListener('input', calcular);
        $(id).addEventListener('change', calcular);
      });

    ['vsd', 'vsk', 'tsd', 'tsk', 'gammaF'].forEach(function (id) {
      $(id).addEventListener('input', function () {
        if (atualizando) return;
        atualizando = true;
        sincronizar(id);
        atualizando = false;
        calcular();
      });
    });

    document.querySelectorAll('input[name="modo"]').forEach(function (r) {
      r.addEventListener('change', calcular);
    });
  }

  function registrarServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('../sw.js').catch(function () {});
    });
  }

  preencherBitolas();
  ligar();
  calcular();
  registrarServiceWorker();
})();
