/* ---------------------------------------------------------------------------
   Flexo Simples - service worker

   Guarda a ferramenta inteira em cache para que ela funcione sem internet
   depois da primeira visita, e é o que permite instalar o site como aplicativo.

   Estrategia: "stale-while-revalidate" — responde na hora com o que está em
   cache e busca a versao nova em segundo plano, que passa a valer no
   carregamento seguinte. Assim a ferramenta abre instantaneamente e offline,
   sem congelar numa versao antiga.
   --------------------------------------------------------------------------- */
'use strict';

var CACHE = 'flexo-simples-v4';

/* Tudo o que a ferramenta precisa para funcionar offline.
   Mantido em sincronia com index.html pelo test/pagina.test.js */
var ARQUIVOS = [
  './',
  'index.html',
  'manifest.json',
  'manifest-corporativo.json',
  'css/styles.css',
  'js/norma.js',
  'js/flexao.js',
  'js/desenho-equilibrio.js',
  'js/desenho-dominios.js',
  'js/app.js',
  'js/tema.js',
  'cisalhamento/',
  'cisalhamento/index.html',
  'js/cisalhamento.js',
  'js/desenho-cisalhamento.js',
  'js/app-cisalhamento.js',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/corp-180.png',
  'icons/corp-192.png',
  'icons/corp-512.png',
  'icons/corp-maskable-512.png'
];

self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(ARQUIVOS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (evento) {
  evento.waitUntil(
    caches.keys()
      .then(function (nomes) {
        return Promise.all(nomes.map(function (nome) {
          return nome === CACHE ? null : caches.delete(nome);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (evento) {
  var req = evento.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  evento.respondWith(
    caches.match(req).then(function (cacheado) {
      var daRede = fetch(req).then(function (resposta) {
        if (resposta && resposta.ok) {
          var copia = resposta.clone();
          caches.open(CACHE).then(function (cache) { cache.put(req, copia); });
        }
        return resposta;
      }).catch(function () {
        /* offline: vale o que estiver em cache, e a navegacao cai na pagina */
        return cacheado || caches.match('index.html');
      });
      return cacheado || daRede;
    })
  );
});
