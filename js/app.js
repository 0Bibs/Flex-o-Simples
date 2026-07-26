/* ---------------------------------------------------------------------------
   Flexo Simples - interface
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  var Flexao = window.FS.Flexao;
  var Eq = window.FS.DesenhoEquilibrio;
  var Dom = window.FS.DesenhoDominios;

  var BITOLAS = [5.0, 6.3, 8.0, 10.0, 12.5, 16.0, 20.0, 25.0, 32.0, 40.0];

  var el = {};
  var atualizando = false;

  function $(id) { return document.getElementById(id); }
  function val(id) { var v = parseFloat($(id).value.replace(',', '.')); return isNaN(v) ? 0 : v; }
  function set(id, v) { $(id).value = v; }

  /* numero "limpo": inteiro sem casas, fracionario com ate 2 casas */
  function num(v) {
    if (!isFinite(v)) return '-';
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    return (Math.round(v * 100) / 100).toString();
  }
  function dec(v, c) { return isFinite(v) ? v.toFixed(c) : '-'; }

  /* ------------------------------------------------ leitura da interface */
  function secaoAtual() {
    return document.querySelector('input[name="secao"]:checked').value;
  }
  function modoAs() {
    return document.querySelector('input[name="modoAs"]:checked').value;
  }

  function areaAsAtual() {
    var m = modoAs();
    if (m === 'barras') return Flexao.areaBarras(val('nBarras'), parseFloat($('diamBarras').value));
    if (m === 'esp') return Flexao.areaEspacamento(parseFloat($('diamEsp').value), val('espacamento'));
    return val('asArea');
  }

  function entrada() {
    return {
      norma: $('norma').value,
      fck: val('fck'),
      fyk: val('fyk'),
      tipoAco: $('tipoAco').value,
      gammaC: val('gammaC'),
      gammaS: val('gammaS'),
      gammaF: val('gammaF'),
      secao: secaoAtual(),
      bw: val('bw'),
      bf: val('bf'),
      hf: val('hf'),
      d: val('d'),
      dl: val('dl'),
      Msd: val('msd'),
      As: areaAsAtual(),
      Asl: val('aslArea'),
      betaXLim: val('betaXLim'),
      armaduraDupla: $('usarDupla').checked,
      usarArmaduraMinima: $('usarMin').checked
    };
  }

  function entradaValida(e) {
    var erros = [];
    if (!(e.bw > 0)) erros.push('Informe b<sub>w</sub> maior que zero.');
    if (!(e.d > 0)) erros.push('Informe d maior que zero.');
    if (!(e.fck > 0)) erros.push('Informe f<sub>ck</sub> maior que zero.');
    if (!(e.fyk > 0)) erros.push('Informe f<sub>yk</sub> maior que zero.');
    if (!(e.gammaC > 0) || !(e.gammaS > 0)) erros.push('Coeficientes γ devem ser maiores que zero.');
    if (e.secao === 'T') {
      if (!(e.bf >= e.bw)) erros.push('Na seção T, b<sub>f</sub> deve ser maior ou igual a b<sub>w</sub>.');
      if (!(e.hf > 0)) erros.push('Na seção T, informe h<sub>f</sub> maior que zero.');
      if (e.hf >= e.d + e.dl) erros.push('h<sub>f</sub> deve ser menor que a altura da seção.');
    }
    if (e.fck > 90) erros.push('A NBR 6118 cobre concretos até C90.');
    return erros;
  }

  /* ------------------------------------------------ calculo e render */
  function dimensionar() {
    var e = entrada();
    var erros = entradaValida(e);
    if (erros.length) return render(null, erros);
    var r = Flexao.dimensionar(e);
    atualizando = true;
    document.querySelector('input[name="modoAs"][value="area"]').checked = true;
    set('asArea', dec(r.As, 2));
    set('aslArea', dec(r.Asl, 2));
    atualizando = false;
    render(r, []);
  }

  function verificar() {
    var e = entrada();
    var erros = entradaValida(e);
    if (erros.length) return render(null, erros);
    var r = Flexao.verificar(e);
    atualizando = true;
    set('asArea', dec(r.As, 2));
    set('msd', dec(r.MRdTfm, 2));
    set('msk', dec(r.MRdTfm / (e.gammaF || 1), 2));
    atualizando = false;
    render(r, []);
  }

  function render(r, erros) {
    var avisos = $('repAvisos');
    if (erros && erros.length) {
      avisos.innerHTML = erros.map(function (m) {
        return '<p class="aviso">' + m + '</p>';
      }).join('');
      return;
    }
    avisos.innerHTML = (r.avisos || []).map(function (m) {
      return '<p class="aviso">' + m + '</p>';
    }).join('');

    /* --- resultados --- */
    $('repResultados').innerHTML =
      '<p>A<sub>s</sub> = ' + dec(r.As, 2) + ' cm2</p>' +
      '<p>A<sub>s</sub>′ = ' + dec(r.Asl, 2) + ' cm2</p>' +
      '<p>x = ' + dec(r.x, 1) + ' cm</p>' +
      '<p>β<sub>x</sub> = x/d = ' + dec(r.betaX, 2) + '</p>' +
      '<p>Domínio ' + r.dominio + '</p>';

    /* --- desenhos --- */
    $('repEquilibrio').innerHTML = Eq.desenhar(r);
    $('repDominios').innerHTML = Dom.desenhar(r);

    /* --- dados --- */
    $('repGeral').innerHTML =
      '<p>Norma utilizada: NBR-6118:' + $('norma').value + '</p>';

    var geo = '<p>b<sub>w</sub> = ' + num(r.bw) + ' cm</p>';
    if (r.secaoT) {
      geo += '<p>b<sub>f</sub> = ' + num(r.bf) + ' cm</p>' +
        '<p>h<sub>f</sub> = ' + num(r.hf) + ' cm</p>';
    }
    geo += '<p>h = ' + num(r.h) + ' cm</p>' +
      '<p>d = ' + num(r.d) + ' cm</p>' +
      "<p>d' = " + num(r.dl) + ' cm</p>';
    $('repGeometria').innerHTML = geo;

    $('repMateriais').innerHTML =
      '<p>f<sub>ck</sub> = ' + num(r.fck) + ' MPa</p>' +
      '<p>f<sub>yk</sub> = ' + num(r.fyk) + ' MPa (tipo ' + r.tipoAco + ')</p>' +
      '<p>γ<sub>c</sub> = ' + dec(r.gammaC, 2) + '</p>' +
      '<p>γ<sub>s</sub> = ' + dec(r.gammaS, 2) + '</p>' +
      '<p>f<sub>ctk</sub> = ' + dec(r.fctkSup, 2) + ' MPa</p>';

    $('repEsforcos').innerHTML =
      '<p>M<sub>sk</sub> = ' + dec(r.MsdTfm / (r.gammaF || 1), 2) + ' tfm</p>' +
      '<p>γ<sub>f</sub> = ' + dec(r.gammaF, 2) + '</p>';

    /* --- painel de armadura minima --- */
    $('outRhoMin').textContent = dec(r.rhoMin * 100, 3);
    $('outAsMin').textContent = dec(r.asMin, 2);
    $('outAsMax').textContent = dec(r.asMax, 2);
    $('outMdMin').textContent = dec(r.MdMinTfm, 2);
  }

  /* ------------------------------------------------ ligacoes da interface */
  function preencherBitolas() {
    var opts = BITOLAS.map(function (b) {
      return '<option value="' + b + '">' + b.toFixed(1) + '</option>';
    }).join('');
    $('diamBarras').innerHTML = opts;
    $('diamEsp').innerHTML = opts;
    $('diamBarras').value = '6.3';
    $('diamEsp').value = '6.3';
  }

  function sincronizarMomentos(origem) {
    var gf = val('gammaF') || 1;
    if (origem === 'msk' || origem === 'gammaF') {
      set('msd', dec(val('msk') * gf, 2));
    } else {
      set('msk', dec(val('msd') / gf, 2));
    }
  }

  function ligar() {
    /* grupos recolhiveis */
    document.querySelectorAll('.grupo .cab .chev').forEach(function (c) {
      c.parentNode.addEventListener('click', function () {
        c.closest('.grupo').classList.toggle('aberto');
      });
    });

    /* entradas que levam ao dimensionamento */
    ['fyk', 'tipoAco', 'gammaS', 'gammaC', 'fck', 'bw', 'bf', 'hf', 'd', 'dl',
      'betaXLim', 'norma'].forEach(function (id) {
      $(id).addEventListener('input', dimensionar);
      $(id).addEventListener('change', dimensionar);
    });
    $('usarMin').addEventListener('change', dimensionar);
    $('usarDupla').addEventListener('change', dimensionar);

    ['msd', 'msk', 'gammaF'].forEach(function (id) {
      $(id).addEventListener('input', function () {
        if (atualizando) return;
        sincronizarMomentos(id);
        dimensionar();
      });
    });

    document.querySelectorAll('input[name="secao"]').forEach(function (r) {
      r.addEventListener('change', function () {
        document.body.classList.toggle('secao-t', secaoAtual() === 'T');
        dimensionar();
      });
    });

    /* entradas que levam a verificacao */
    ['asArea', 'aslArea', 'nBarras', 'diamBarras', 'diamEsp', 'espacamento']
      .forEach(function (id) {
        $(id).addEventListener('input', function () { if (!atualizando) verificar(); });
        $(id).addEventListener('change', function () { if (!atualizando) verificar(); });
      });
    document.querySelectorAll('input[name="modoAs"]').forEach(function (r) {
      r.addEventListener('change', verificar);
    });

    $('btDimensionar').addEventListener('click', dimensionar);
    $('btVerificar').addEventListener('click', verificar);
  }

  /* ------------------------------------------------ instalacao offline
     Registra o service worker, que guarda a ferramenta em cache e permite
     instala-la como aplicativo. So faz sentido sob http/https: aberta por
     duplo clique (file://) a pagina ja funciona sem rede, e o navegador
     nem permite service worker. */
  function registrarServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {
        /* sem cache offline; a ferramenta continua funcionando normalmente */
      });
    });
  }

  preencherBitolas();
  ligar();
  dimensionar();
  registrarServiceWorker();
})();
