/* ---------------------------------------------------------------------------
   Flexo Simples - interface
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  var Flexao = window.FS.Flexao;
  var Eq = window.FS.DesenhoEquilibrio;
  var Dom = window.FS.DesenhoDominios;
  var Entrada = window.FS.EntradaFlexao;
  var Painel = window.FS.PainelFlexao;
  var ultimoResultado = null;
  var valoresExatos = Object.create(null);
  function operacao(){return $('operacao').value;}
  function recalcular(){if(operacao()==='dimensionar')dimensionar();else verificar();}
  var unidadeAnterior = 'tfm';
  function unidade() { return $('unidadeMomento').value; }
  function momento(v) { return Entrada.doMotor(v, unidade()); }
  function rotuloMomento() { return Entrada.rotulo(unidade()); }
  function preciso(v) { return Number.isFinite(v) ? v : ''; }

  var BITOLAS = [5.0, 6.3, 8.0, 10.0, 12.5, 16.0, 20.0, 25.0, 32.0, 40.0];

  var el = {};
  var atualizando = false;

  function $(id) { return document.getElementById(id); }
  function val(id) {if(Object.prototype.hasOwnProperty.call(valoresExatos,id))return valoresExatos[id];var v=Entrada.numero($(id).value);return v;}
  function set(id,v){var x=typeof v==='number'?v:Entrada.numero(v);if(v===''||!Number.isFinite(x)){delete valoresExatos[id];$(id).value='';return;}valoresExatos[id]=x;$(id).value=x.toFixed(2);}

  /* numero "limpo": inteiro sem casas, fracionario com ate 2 casas */
  function num(v) {
    if (!isFinite(v)) return '-';
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    return (Math.round(v * 100) / 100).toString().replace('.', ',');
  }
  function dec(v, c) { return isFinite(v) ? v.toFixed(Math.min(c,2)).replace('.', ',') : '—'; }

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
      h: val('h'),
      d: val('d'),
      dl: val('dl'),
      Msd: Entrada.paraMotor($('msd').value.trim()?val('msd'):NaN, unidade()),
      As: areaAsAtual(),
      Asl: val('aslArea'),
      betaXLim: val('betaXLim'),
      armaduraDupla: $('usarDupla').checked,
      usarArmaduraMinima: $('usarMin').checked
    };
  }

  function entradaValida(e, inverso) {
    var erros = [];
    if (!Entrada.coerente(e)) erros.push('Informe geometria coerente: h = d + d′, com h e d positivos e 0 ≤ d′ &lt; d.');
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
    if (!(e.betaXLim > 0 && e.betaXLim <= 1)) erros.push('Informe βx,lim entre zero (exclusivo) e um.');
    if (e.fck > 90 || (e.fck > 0 && e.fck < 10)) erros.push('f<sub>ck</sub> deve estar na faixa implementada: 10 a 90 MPa.');
    if (!(e.gammaF > 0)) erros.push('Informe γ<sub>f</sub> maior que zero.');
    if (!(e.dl >= 0 && e.dl < e.d)) erros.push('Informe 0 ≤ d′ &lt; d.');
    if (operacao()!=='capacidade' && (!Number.isFinite(e.Msd) || e.Msd < 0 || !$('msd').value.trim())) erros.push('Informe a magnitude não negativa do momento e oriente a seção para a face comprimida.');
    if ((Number.isFinite(e.As)&&e.As < 0) || (Number.isFinite(e.Asl)&&e.Asl < 0)) erros.push('As áreas de armadura não podem ser negativas.');
    if (inverso) {
      var ids = modoAs() === 'area' ? ['asArea','aslArea'] : modoAs() === 'barras' ? ['nBarras','diamBarras','aslArea'] : ['diamEsp','espacamento','aslArea'];
      ids.forEach(function(id){if (!$(id).value.trim() || !Number.isFinite(Entrada.numero($(id).value))) erros.push('Informe um valor válido em '+id+'. Zero e ausência de dado são distintos.');});
      if(modoAs()==='barras' && (!Number.isInteger(val('nBarras')) || val('nBarras')<1)) erros.push('Informe quantidade inteira positiva de barras.');
      if(modoAs()==='esp' && !(val('espacamento')>0)) erros.push('Informe espaçamento positivo.');
    }
    return erros;
  }

  /* A imagem deve corresponder a um calculo valido, nunca ao ultimo
     resultado que sobrou na tela antes de uma entrada incorreta. */
  function estadoRelatorio(valido) {
    var rel = $('relatorio');
    rel.setAttribute('data-calculo-valido', String(valido));
    ['btBaixarImagem', 'btCopiarImagem', 'btBaixarSvg', 'btExportarPainel', 'btRelatorioCompleto'].forEach(function (id) {
      var b = $(id); if (b) b.disabled = !valido;
    });
    if (!valido) {
      ultimoResultado = null;
      rel.querySelectorAll('.bloco, .figura').forEach(function (b) { b.innerHTML = ''; });
      document.querySelectorAll('.painel output').forEach(function (o) { o.textContent = '—'; });
    }
  }

  /* ------------------------------------------------ calculo e render */
  function dimensionar() {
    var e = entrada();
    var erros = entradaValida(e);
    if (erros.length) return render(null, erros);
    var r = Flexao.dimensionar(e);
    atualizando = true;
    document.querySelector('input[name="modoAs"][value="area"]').checked = true;
    set('asArea', preciso(r.As));
    set('aslArea', preciso(r.Asl));
    atualizando = false;
    render(r, []);
  }

  function verificar() {
    var e = entrada();
    var erros = entradaValida(e, true);
    if (erros.length) return render(null, erros);
    var r = operacao()==='capacidade'?Flexao.verificar(e):window.FS.VerificacaoFlexao.verificar(e);
    atualizando = true;
    if(modoAs()!=='area')set('asArea', preciso(r.As));
    atualizando = false;
    render(r, []);
  }

  /* Same ordering as the SVG; formatting never determines the inequality. */
  function comparacao(r, usaMin) {
    var q=Painel.ordenarAreas(r);
    var terms=q.itens.map(function(t,i){var name=t.rotulo.replace('As,','s,');
      return (i?' <span class="op">'+q.operadores[i-1]+'</span> ':'')+(t.id==='adotada'?'<b>':'')+'A<sub>'+name+'</sub> ('+dec(t.valor,q.casas)+' cm²)'+(t.id==='adotada'?'</b>':'');});
    return '<p>'+terms.join('')+'</p>';
  }

  /* Escreve num campo do relatorio se ele existir. Parece zelo demais, mas
     nao e: com um service worker servindo pagina e script de versoes
     diferentes, um id novo pode faltar no HTML em cache. Antes disso um id
     ausente derrubava o render inteiro, e o relatorio ficava so com os
     titulos — quebra muito pior do que a secao que faltava. */
  function escreve(id, html) {
    var e = $(id);
    if (e) e.innerHTML = html;
  }
  function escreveTexto(id, texto) {
    var e = $(id);
    if (e) e.textContent = texto;
  }


  /* ------------------------------------------------ avisos de erro e barra de status
     Apenas apresentacao. O resumo da secao (SVG) ja traz os indices, a tabela
     de esforcos e as advertencias; aqui ficam so os erros de entrada e a
     barra de estado no rodape da janela. */
  function ajustaNumeros(m) {
    return String(m).replace(/(-?\d+)\.(\d+)/g, function (_, a, b) {
      return b.length >= 3 ? dec(Number(a + '.' + b), 2) : a + ',' + b;
    });
  }
  function escreveFaixa(html) { var f = $('faixaResultado'); if (f) f.innerHTML = html; }
  var estadoStatus = {r: null, erros: []};
  function pintaStatus() {
    var esq = $('statusEsq'), sit = $('statusSit'), dir = $('statusDir');
    if (!esq || !sit || !dir) return;
    var nome = String(($('idElemento') || {}).value || '').trim(), s = 'ERRO', txt = 'dados inválidos';
    if (estadoStatus.r) {
      try {
        var ev = window.FS.ResumoHorizontal.avaliarFlexao(estadoStatus.r, {norma: $('norma').value, unidade: unidade()});
        s = estadoStatus.r.modo === 'AS_MRD' ? 'CAPACIDADE' : ev.situacao;
        txt = s === 'ATENDE' ? 'atende aos critérios' : s === 'NÃO ATENDE' ? 'não atende' : s === 'CAPACIDADE' ? 'capacidade (sem demanda)' : 'verificação pendente';
      } catch (err) { s = 'ERRO'; txt = 'resumo indisponível'; }
    }
    esq.textContent = 'Flexão Simples 1.2.0 / RV08 • ' + (nome ? nome + ' • ' : '') + 'resumo da seção';
    sit.textContent = txt;
    sit.setAttribute('data-situacao', s);
    dir.textContent = rotuloMomento() + ' · cm · MPa';
  }

  (function () { var id = $('idElemento'); if (id) id.addEventListener('input', pintaStatus); })();

  function render(r, erros) {
    if (erros && erros.length) {
      estadoRelatorio(false);
      Painel.atualizar(null, erros);
      escreveFaixa('<div class="aviso aviso-erro" role="alert"><strong>Corrija os dados para calcular:</strong><ul>' +
        erros.map(function (m) { return '<li>' + ajustaNumeros(m) + '</li>'; }).join('') + '</ul></div>');
      estadoStatus = {r: null, erros: erros}; pintaStatus();
      escreve('repAvisos', erros.map(function (m) {
        return '<p class="aviso">' + String(m).replace(/(-?\d+)\.(\d{3,})/g,function(_,a,b){return dec(Number(a+'.'+b),2);}) + '</p>';
      }).join(''));
      return;
    }
    estadoRelatorio(true);
    ultimoResultado = r;
    Painel.atualizar(r);
    escreveFaixa('');
    estadoStatus = {r: r, erros: []}; pintaStatus();
    escreve('repAvisos', (r.avisos || []).map(function (m) {
      return '<p class="aviso">' + m + '</p>';
    }).join(''));

    /* --- resultados --- */
    escreve('repResultados', '<p>A<sub>s</sub> = ' + dec(r.As, 2) + ' cm2</p>' +
      '<p>A<sub>s</sub>′ = ' + dec(r.Asl, 2) + ' cm2</p>' +
      '<p>x = ' + dec(r.x, 1) + ' cm</p>' +
      '<p>β<sub>x</sub> = x/d = ' + dec(r.betaX, 2) + '</p>' +
      '<p>Domínio ' + r.dominio + '</p>');

    /* --- armadura: calculada, minima e adotada --- */
    var usaMin = $('usarMin').checked;
    escreve('repArmadura',
      '<p>A<sub>s,' + (r.modo !== 'MSD_AS' ? 'informada' : 'calc') + '</sub> = ' + dec(r.asCalc, 2) + (r.modo !== 'MSD_AS' ? ' cm² — informada</p>' : ' cm² — do equilíbrio da seção</p>') +
      '<p>A<sub>s,mín</sub> = ' + dec(r.asMin, 2) + ' cm² — ρ<sub>mín</sub> · A<sub>c</sub> = ' +
        dec(r.rhoMin * 100, 3) + ' % · ' + dec(r.Ac, 0) + ' cm²' +
        (usaMin ? '' : ' (não adotada)') + '</p>' +
      '<p>A<sub>s,' + (r.modo === 'AS_MRD' ? 'considerada' : 'adotada') + '</sub> = ' + dec(r.As, 2) + ' cm²' +
        (r.modo !== 'MSD_AS' ? ' — utilizada pelo motor' : (usaMin ? ' — máx(A<sub>s,calc</sub> ; A<sub>s,mín</sub>)' : ' = A<sub>s,calc</sub>')) +
        '</p>' +
      "<p>A<sub>s</sub>′ = " + dec(r.Asl, 2) + ' cm² — armadura no nível d′; sinal da força conforme o estado</p>');

    escreve('repComparacao', r.modo==='AS_MSD'?'<p>Armadura adotada × esforço aplicado: '+r.atendimentoFlexao+'. MSd = '+dec(momento(r.MsdTfm),2)+' '+rotuloMomento()+'; MRd = '+dec(momento(r.MRdTfm),2)+' '+rotuloMomento()+'.</p>':r.modo === 'AS_MRD' ? '<p>Armadura informada considerada; mínimo é limite de referência, não adoção automática. Sem demanda independente.</p>' : comparacao(r, usaMin));

    /* --- desenhos --- */
    escreve('repEquilibrio', Painel.equilibrio(r));
    escreve('repDominios', Painel.dominios(r));

    /* --- dados --- */
    escreve('repGeral', '<p>Norma utilizada: NBR-6118:' + $('norma').value + '</p>' +
      '<p>Operação: ' + (r.modo === 'AS_MSD' ? 'verificação de armadura adotada e esforço independente' : r.modo === 'AS_MRD' ? 'momento resistente a partir da armadura' :
        'armadura a partir do momento solicitante') + '</p>' +
      '<p>Convenção de unidades do motor: 1 tf = 10 kN.</p>');

    var geo = '<p>b<sub>w</sub> = ' + num(r.bw) + ' cm</p>';
    if (r.secaoT) {
      geo += '<p>b<sub>f</sub> = ' + num(r.bf) + ' cm</p>' +
        '<p>h<sub>f</sub> = ' + num(r.hf) + ' cm</p>';
    }
    geo += '<p>h = ' + num(r.h) + ' cm</p>' +
      '<p>d = ' + num(r.d) + ' cm</p>' +
      "<p>d' = " + num(r.dl) + ' cm</p>';
    escreve('repGeometria', geo);

    escreve('repMateriais', '<p>f<sub>ck</sub> = ' + num(r.fck) + ' MPa</p>' +
      '<p>f<sub>yk</sub> = ' + num(r.fyk) + ' MPa (tipo ' + r.tipoAco + ')</p>' +
      '<p>γ<sub>c</sub> = ' + dec(r.gammaC, 2) + '</p>' +
      '<p>γ<sub>s</sub> = ' + dec(r.gammaS, 2) + '</p>' +
      '<p>f<sub>ctk</sub> = ' + dec(r.fctkSup, 2) + ' MPa</p>');

    escreve('repEsforcos', r.modo==='AS_MSD'?'<p>MSd = '+dec(momento(r.MsdTfm),2)+' '+rotuloMomento()+'; MRd = '+dec(momento(r.MRdTfm),2)+' '+rotuloMomento()+'. Flexão: '+r.atendimentoFlexao+'.</p>':r.modo === 'AS_MRD'
      ? '<p>M<sub>Rd</sub> = ' + dec(momento(r.MRdTfm), 2) + ' ' + rotuloMomento() + '</p>' +
        '<p>Modo inverso: determinação de capacidade, não comparação com uma demanda independente.</p>'
      : '<p>M<sub>sk</sub> = ' + dec(momento(r.MsdTfm / r.gammaF), 2) + ' ' + rotuloMomento() + '</p>' +
        '<p>γ<sub>f</sub> = ' + dec(r.gammaF, 2) + '</p>' +
        '<p>M<sub>Sd</sub> = ' + dec(momento(r.MsdTfm), 2) + ' ' + rotuloMomento() + '</p>');

    /* --- painel de armadura minima --- */
    escreveTexto('outRhoMin', dec(r.rhoMin * 100, 3));
    escreveTexto('outAsMin', dec(r.asMin, 2));
    escreveTexto('outAsMax', dec(r.asMax, 2));
    escreveTexto('outMdMin', dec(momento(r.MdMinTfm), 2));
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
      set('msd', preciso(($('msk').value.trim()?val('msk'):NaN) * gf));
    } else {
      set('msk', preciso(($('msd').value.trim()?val('msd'):NaN) / gf));
    }
  }

  function ligar() {
    document.querySelector('.painel').addEventListener('input',function(ev){if(ev.target.id)delete valoresExatos[ev.target.id];},true);
    document.querySelectorAll('.painel input[type="number"]').forEach(function(input){input.addEventListener('blur',function(){if(input.value.trim()&&Number.isFinite(Entrada.numero(input.value)))set(input.id,val(input.id));});});
    $('operacao').addEventListener('change',recalcular);
    /* grupos recolhiveis */
    document.querySelectorAll('.grupo .cab .chev').forEach(function (c) {
      c.parentNode.addEventListener('click', function () {
        c.closest('.grupo').classList.toggle('aberto');
      });
    });

    // Afastamento d′ mantido ao editar h/d. Valores incoerentes nao sao limitados silenciosamente.
    ['h', 'd', 'dl'].forEach(function (id) {
      $(id).addEventListener('input', function () {
        var g = Entrada.sincronizar({h: $('h').value.trim()?val('h'):NaN, d: $('d').value.trim()?val('d'):NaN, dl: $('dl').value.trim()?val('dl'):NaN}, id);
        if (id === 'd' && Number.isFinite(g.h)) set('h', preciso(g.h));
        if (id !== 'd' && Number.isFinite(g.d)) set('d', preciso(g.d));
        recalcular();
      });
    });
    $('unidadeMomento').addEventListener('change', function () {
      var nova = unidade();
      ['msd', 'msk'].forEach(function (id) {
        var v = Entrada.converter($(id).value.trim()?val(id):NaN, unidadeAnterior, nova);
        if (Number.isFinite(v)) set(id, preciso(v));
      });
      unidadeAnterior = nova;
      document.querySelectorAll('[data-unidade-momento]').forEach(function (e) {e.textContent = rotuloMomento();});
      // Trocar a unidade e uma operacao de apresentacao: nao redimensiona nem perde a escolha de barras.
      if (ultimoResultado) render(ultimoResultado, []); else recalcular();
    });
    function focar(id) {
      var alvo = $(id), grupo = alvo.closest('.grupo');
      if (grupo) grupo.classList.add('aberto');
      alvo.focus(); alvo.scrollIntoView({block: 'nearest'});
    }
    document.querySelectorAll('[data-foco]').forEach(function (b) {
      b.addEventListener('click', function () { focar(b.getAttribute('data-foco')); });
    });
    $('btRecalcular').addEventListener('click', recalcular);
    $('btExportarPainel').addEventListener('click', function () { window.FS.Exportar.copiar(); });
    document.addEventListener('keydown', function (ev) {
      var campos = {F2: 'bw', F3: 'fck', F4: 'asArea', F5: 'msd'};
      if (campos[ev.key]) {ev.preventDefault(); focar(campos[ev.key]);}
      if (ev.key === 'F9') {ev.preventDefault(); recalcular();}
    });

    /* entradas que levam ao dimensionamento */
    ['fyk', 'tipoAco', 'gammaS', 'gammaC', 'fck', 'bw', 'bf', 'hf',
      'betaXLim', 'norma'].forEach(function (id) {
      $(id).addEventListener('input', recalcular);
      $(id).addEventListener('change', recalcular);
    });
    $('usarMin').addEventListener('change', recalcular);
    $('usarDupla').addEventListener('change', recalcular);

    ['msd', 'msk', 'gammaF'].forEach(function (id) {
      $(id).addEventListener('input', function () {
        if (atualizando) return;
        sincronizarMomentos(id);
        recalcular();
      });
    });

    document.querySelectorAll('input[name="secao"]').forEach(function (r) {
      r.addEventListener('change', function () {
        document.body.classList.toggle('secao-t', secaoAtual() === 'T');
        recalcular();
      });
    });

    /* entradas que levam a verificacao */
    ['asArea', 'aslArea', 'nBarras', 'diamBarras', 'diamEsp', 'espacamento']
      .forEach(function (id) {
        $(id).addEventListener('input', function () { if (!atualizando) {if(operacao()!=='capacidade')$('operacao').value='conferir';verificar();} });
        $(id).addEventListener('change', function () { if (!atualizando) verificar(); });
      });
    document.querySelectorAll('input[name="modoAs"]').forEach(function (r) {
      r.addEventListener('change',function(){if(operacao()!=='capacidade')$('operacao').value='conferir';verificar();});
    });

    $('btDimensionar').addEventListener('click',function(){$('operacao').value='dimensionar';dimensionar();});
    $('btVerificar').addEventListener('click',function(){$('operacao').value='conferir';verificar();});
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
  ['msd','msk'].forEach(function(id){set(id,Entrada.converter(val(id),'tfm',unidade()));});
  unidadeAnterior=unidade();
  document.querySelectorAll('[data-unidade-momento]').forEach(function(e){e.textContent=rotuloMomento();});
  dimensionar();
  registrarServiceWorker();
})();
