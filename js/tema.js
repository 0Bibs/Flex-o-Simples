/* ---------------------------------------------------------------------------
   Flexo Simples - alternancia de tema

   Sao dois temas com o mesmo calculo por tras: "classico" (azul) e
   "corporativo" (cinza grafite com amarelo). A escolha fica guardada no
   navegador e vale para as duas ferramentas.

   O tema e aplicado ainda no <head>, por um trecho embutido no HTML, para
   que a pagina ja nasca com a aparencia certa. Este arquivo cuida so do
   botao que alterna.
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  var CHAVE = 'flexo-simples-tema';
  var CORES = { classico: '#1f6fc4', corporativo: '#2b2b2b' };
  var NOMES = { classico: 'Clássico', corporativo: 'Corporativo' };
  /* cada tema tem o seu manifesto, para o aplicativo instalado assumir o
     nome, as cores e o icone do tema escolhido */
  var MANIFESTOS = {
    classico: 'manifest.json',
    corporativo: 'manifest-corporativo.json'
  };

  function lerTema() {
    /* ?tema=... tem prioridade: e por ele que o atalho e o aplicativo
       instalado abrem ja no tema certo */
    var naUrl = (location.search.match(/[?&]tema=([a-z]+)/) || [])[1];
    if (CORES[naUrl]) return naUrl;
    try {
      var t = localStorage.getItem(CHAVE);
      return CORES[t] ? t : 'classico';
    } catch (e) {
      return 'classico';
    }
  }

  /* o <link rel=manifest> e relativo a pagina: na subpasta sobe um nivel */
  function prefixo() {
    var css = document.querySelector('link[rel="stylesheet"]');
    var href = css ? css.getAttribute('href') : '';
    return href.indexOf('../') === 0 ? '../' : '';
  }

  function aplicar(tema) {
    document.documentElement.setAttribute('data-tema', tema);

    /* a cor da barra do sistema, quando instalada como aplicativo */
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', CORES[tema]);

    /* e a identidade do aplicativo: nome, cores e icone da instalacao */
    var man = document.querySelector('link[rel="manifest"]');
    if (man) man.setAttribute('href', prefixo() + MANIFESTOS[tema]);

    var bt = document.getElementById('btTema');
    if (bt) {
      bt.textContent = NOMES[tema];
      bt.title = 'Tema ' + NOMES[tema].toLowerCase() + ' — clique para alternar';
      bt.setAttribute('aria-label', bt.title);
    }
    try { localStorage.setItem(CHAVE, tema); } catch (e) { /* modo privado */ }
  }

  function ligar() {
    var bt = document.getElementById('btTema');
    if (!bt) return;
    bt.addEventListener('click', function () {
      aplicar(lerTema() === 'corporativo' ? 'classico' : 'corporativo');
    });
  }

  aplicar(lerTema());
  ligar();
})();
