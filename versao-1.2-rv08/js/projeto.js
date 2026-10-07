/* ---------------------------------------------------------------------------
   Flexão Simples - projeto: memoria entre abas, salvar, abrir e historico

   1. Memoria entre abas. Flexao e Cortante/Torcao sao paginas separadas;
      trocar de aba recarrega a pagina. Todo campo editado e gravado no
      navegador (localStorage) e restaurado ao voltar, entao o vai e vem
      entre abas nao perde nada.

   2. Salvar / Abrir. O projeto inteiro (as duas abas) vira um arquivo
      .flexo (JSON). No aplicativo de desktop usa a janela nativa do
      sistema; no navegador cai para download e seletor de arquivo.

   3. Historico. Cada salvamento ou abertura guarda uma copia do estado
      numa lista local (ate MAX_HIST itens), reabrivel com um clique mesmo
      que o arquivo tenha sido movido.
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  var CHAVE_ESTADO = 'flexao-simples-rv08-estado';
  var CHAVE_HIST = 'flexao-simples-rv08-historico';
  var MAX_HIST = 40;
  var FORMATO = 'flexo-simples';

  /* RV08: a pagina e reconhecida pelo seletor de operacao que so ela tem */
  var cis = !!document.getElementById('operacaoCis');
  var pagina = cis ? 'cisalhamento' : 'flexao';
  var OPERACAO = cis ? 'operacaoCis' : 'operacao';
  var UNIDADE = cis ? 'unidadeEsforcos' : 'unidadeMomento';
  if (!document.getElementById(OPERACAO)) return;
  /* ponte do Electron (desktop/preload.js); ausente no navegador */
  var nativo = window.flexoNativo || null;

  /* ------------------------------------------------ armazenamento */
  function ler(chave, padrao) {
    try {
      var v = JSON.parse(localStorage.getItem(chave));
      return v == null ? padrao : v;
    } catch (e) { return padrao; }
  }
  function gravar(chave, v) {
    try { localStorage.setItem(chave, JSON.stringify(v)); } catch (e) { /* sem memoria */ }
  }

  /* ------------------------------------------------ campos da pagina */
  function campos() {
    return Array.prototype.slice.call(
      document.querySelectorAll('.janela input, .janela select'));
  }

  function capturar() {
    var c = {};
    campos().forEach(function (e) {
      if (e.type === 'radio') { if (e.checked) c['@' + e.name] = e.value; }
      else if (e.type === 'checkbox') { if (e.id) c[e.id] = e.checked; }
      else if (e.id) c[e.id] = e.value;
    });
    return { campos: c };
  }

  function disparar(e) { e.dispatchEvent(new Event('change', { bubbles: true })); }

  /* A interface guarda o valor exato de cada campo (sem arredondamento) e so
     o esquece num evento 'input', que ela escuta em captura no .painel. Um
     'input' interrompido no proprio campo limpa esse valor sem acionar os
     demais tratadores (sincronizacao, troca de operacao, recalculo). */
  function esquecerExato(e) {
    var parar = function (ev) { ev.stopImmediatePropagation(); };
    e.addEventListener('input', parar, { capture: true, once: true });
    e.dispatchEvent(new Event('input', { bubbles: true }));
    e.removeEventListener('input', parar, { capture: true });
  }

  function aplicar(dados) {
    if (!dados || !dados.campos) return;
    var c = dados.campos;
    /* 1. unidade primeiro, pela propria interface: ela converte os valores
          atuais e acerta a unidade de referencia interna */
    var un = document.getElementById(UNIDADE);
    if (un && UNIDADE in c && un.value !== c[UNIDADE]) { un.value = c[UNIDADE]; disparar(un); }
    /* 2. demais campos, ja na unidade gravada, sem disparar eventos */
    campos().forEach(function (e) {
      if (e.id === UNIDADE) return;
      if (e.type === 'radio') {
        if (('@' + e.name) in c) e.checked = (c['@' + e.name] === e.value);
      } else if (e.id && e.id in c) {
        if (e.type === 'checkbox') e.checked = !!c[e.id];
        else { e.value = c[e.id]; esquecerExato(e); }
      }
    });
    var secao = document.querySelector('input[name="secao"]:checked');
    if (secao) document.body.classList.toggle('secao-t', secao.value === 'T');
    /* 3. um unico recalculo, pela operacao escolhida (dimensionar/verificar) */
    disparar(document.getElementById(OPERACAO));
  }

  function estadoGeral() { return ler(CHAVE_ESTADO, {}); }

  var descartando = false;
  function salvarPagina() {
    if (descartando) return;
    var e = estadoGeral();
    e[pagina] = capturar();
    gravar(CHAVE_ESTADO, e);
  }

  /* grava depois que a interface terminou de reagir ao evento, para pegar
     tambem os campos preenchidos pelo calculo */
  var pendente = null;
  function agendar() {
    clearTimeout(pendente);
    pendente = setTimeout(salvarPagina, 0);
  }

  /* ------------------------------------------------ arquivo de projeto */
  function nomeSugerido() {
    var p = ($('idProjeto') || {}).value || '';
    var el = ($('idElemento') || {}).value || '';
    var nome = [p, el].filter(Boolean).join(' - ') || 'Projeto Flexão Simples';
    return nome.replace(/[\\/:*?"<>|]+/g, '_').trim() + '.flexo';
  }
  function $(id) { return document.getElementById(id); }

  function documento() {
    salvarPagina();
    return { formato: FORMATO, versao: 1, salvoEm: new Date().toISOString(),
      estado: estadoGeral() };
  }

  function carregarDocumento(doc, nome, caminho) {
    if (!doc || doc.formato !== FORMATO || !doc.estado) {
      throw new Error('O arquivo não é um projeto do Flexão Simples.');
    }
    gravar(CHAVE_ESTADO, doc.estado);
    registrarHistorico(nome, caminho, doc.estado);
    aplicar(doc.estado[pagina]);
    salvarPagina();
  }

  function salvarArquivo() {
    var doc = documento();
    var texto = JSON.stringify(doc, null, 2);
    var nome = nomeSugerido();
    if (nativo) {
      return nativo.salvar(nome, texto).then(function (caminho) {
        if (caminho) {
          registrarHistorico(baseName(caminho), caminho, doc.estado);
          avisar('Salvo em ' + caminho);
        }
      }).catch(falha);
    }
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    registrarHistorico(nome, '', doc.estado);
    avisar('Projeto baixado como ' + nome);
  }

  function abrirArquivo() {
    if (nativo) {
      return nativo.abrir().then(function (r) {
        if (r) carregarDocumento(JSON.parse(r.texto), baseName(r.caminho), r.caminho);
      }).catch(falha);
    }
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.flexo,.json,application/json';
    inp.onchange = function () {
      var f = inp.files[0];
      if (!f) return;
      f.text().then(function (t) { carregarDocumento(JSON.parse(t), f.name, ''); })
        .catch(falha);
    };
    inp.click();
  }

  function novoProjeto() {
    if (!confirm('Limpar as duas abas e começar um projeto novo?')) return;
    descartando = true;
    gravar(CHAVE_ESTADO, {});
    location.reload();
  }

  function baseName(c) { return String(c).split(/[\\/]/).pop(); }

  /* ------------------------------------------------ historico */
  function registrarHistorico(nome, caminho, estado) {
    var h = ler(CHAVE_HIST, []).filter(function (i) {
      return !(caminho && i.caminho === caminho);
    });
    h.unshift({ nome: nome, caminho: caminho || '', data: new Date().toISOString(),
      estado: estado });
    gravar(CHAVE_HIST, h.slice(0, MAX_HIST));
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function mostrarHistorico() {
    var h = ler(CHAVE_HIST, []);
    var dlg = $('dlgHistorico');
    var lista = h.length ? h.map(function (i, n) {
      var d = new Date(i.data);
      return '<li><div class="hist-info"><b>' + esc(i.nome) + '</b>' +
        '<small>' + d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0, 5) +
        (i.caminho ? ' · ' + esc(i.caminho) : '') + '</small></div>' +
        '<button type="button" class="botao botao-mini" data-abrir="' + n + '">Abrir</button>' +
        '<button type="button" class="hist-x" data-excluir="' + n +
        '" title="Remover do histórico">×</button></li>';
    }).join('') : '<li class="hist-vazio">Nenhum projeto salvo ainda.</li>';
    dlg.querySelector('ul').innerHTML = lista;
    dlg.showModal();
  }

  function cliqueHistorico(ev) {
    var b = ev.target.closest('button');
    if (!b) return;
    var h = ler(CHAVE_HIST, []);
    if (b.dataset.abrir != null) {
      var i = h[+b.dataset.abrir];
      gravar(CHAVE_ESTADO, i.estado);
      aplicar(i.estado[pagina]);
      $('dlgHistorico').close();
      avisar('Aberto: ' + i.nome);
    } else if (b.dataset.excluir != null) {
      h.splice(+b.dataset.excluir, 1);
      gravar(CHAVE_HIST, h);
      mostrarHistorico();
    } else if (b.dataset.fechar != null) {
      $('dlgHistorico').close();
    }
  }

  /* ------------------------------------------------ interface */
  function avisar(msg) {
    var t = $('avisoProjeto');
    t.textContent = msg;
    t.classList.add('visivel');
    clearTimeout(avisar.t);
    avisar.t = setTimeout(function () { t.classList.remove('visivel'); }, 3500);
  }
  function falha(e) { alert((e && e.message) || 'Não foi possível concluir a operação.'); }

  function montarInterface() {
    var barra = document.createElement('span');
    barra.className = 'bt-projeto';
    barra.innerHTML =
      '<button type="button" id="btNovo" title="Novo projeto (Ctrl+N)">Novo</button>' +
      '<button type="button" id="btAbrir" title="Abrir projeto (Ctrl+O)">Abrir</button>' +
      '<button type="button" id="btSalvar" title="Salvar projeto (Ctrl+S)">Salvar</button>' +
      '<button type="button" id="btHistorico" title="Projetos recentes (Ctrl+H)">Histórico</button>';
    var tema = $('btTema');
    tema.parentNode.insertBefore(barra, tema);

    var dlg = document.createElement('dialog');
    dlg.id = 'dlgHistorico';
    dlg.className = 'dlg-historico';
    dlg.innerHTML = '<h3>Histórico de projetos</h3><ul></ul>' +
      '<p class="hist-rodape"><button type="button" class="botao botao-mini" ' +
      'data-fechar>Fechar</button></p>';
    document.body.appendChild(dlg);
    dlg.addEventListener('click', cliqueHistorico);

    var aviso = document.createElement('div');
    aviso.id = 'avisoProjeto';
    aviso.className = 'aviso-projeto';
    document.body.appendChild(aviso);

    $('btNovo').addEventListener('click', novoProjeto);
    $('btAbrir').addEventListener('click', abrirArquivo);
    $('btSalvar').addEventListener('click', salvarArquivo);
    $('btHistorico').addEventListener('click', mostrarHistorico);

    document.addEventListener('keydown', function (ev) {
      if (!(ev.ctrlKey || ev.metaKey)) return;
      var f = { s: salvarArquivo, o: abrirArquivo, h: mostrarHistorico, n: novoProjeto }[
        ev.key.toLowerCase()];
      if (f) { ev.preventDefault(); f(); }
    });
  }

  /* ------------------------------------------------ partida */
  /* no desktop a janela e de verdade: some com os botoes desenhados */
  if (nativo) document.documentElement.classList.add('desktop');
  montarInterface();
  aplicar(estadoGeral()[pagina]);
  document.addEventListener('input', agendar, true);
  document.addEventListener('change', agendar, true);
  document.addEventListener('click', agendar, true);
  window.addEventListener('pagehide', salvarPagina);

  /* arquivo .flexo aberto por duplo clique no Windows (desktop) */
  if (nativo && nativo.arquivoInicial) {
    nativo.arquivoInicial().then(function (r) {
      if (r) carregarDocumento(JSON.parse(r.texto), baseName(r.caminho), r.caminho);
    }).catch(falha);
  }
})();
