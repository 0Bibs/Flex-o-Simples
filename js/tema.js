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

  function lerTema() {
    try {
      var t = localStorage.getItem(CHAVE);
      return CORES[t] ? t : 'classico';
    } catch (e) {
      return 'classico';
    }
  }

  function aplicar(tema) {
    document.documentElement.setAttribute('data-tema', tema);

    /* a cor da barra do sistema, quando instalada como aplicativo */
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', CORES[tema]);

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
