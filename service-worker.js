/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* 
   service-worker.js
   Service Worker : from vanilla-pwa
   By Arjun Mahishi
   Code Source : https://github.com/arjunmahishi/vanilla-pwa
   License : MIT
*/

let version = "2.0.1";

let cacheName = "MyCacheV" + version;

let filesToCache = [
"./index.html",
"./favicon.ico",
"./manifest.webmanifest",
"./public/app.min.js",
"./public/lib/styles/ejdicto.min.css",
"./static/audio/dictee31.mp3",
"./static/audio/dictee31.ogg",
"./static/audio/dictee31.aac",
"./static/audio/dictee32.mp3",
"./static/audio/dictee32.ogg",
"./static/audio/dictee32.aac",
"./static/audio/dictee33.mp3",
"./static/audio/dictee33.ogg",
"./static/audio/dictee33.aac",
"./static/audio/dictee34.mp3",
"./static/audio/dictee34.ogg",
"./static/audio/dictee34.aac",
"./static/audio/dictee35.mp3",
"./static/audio/dictee35.ogg",
"./static/audio/dictee35.aac",
"./static/audio/dictee36.mp3",
"./static/audio/dictee36.ogg",
"./static/audio/dictee36.aac",
"./static/audio/dictee51.mp3",
"./static/audio/dictee51.ogg",
"./static/audio/dictee51.aac",
"./static/audio/dictee52.mp3",
"./static/audio/dictee52.ogg",
"./static/audio/dictee52.aac",
"./static/audio/dictee53.mp3",
"./static/audio/dictee53.ogg",
"./static/audio/dictee53.aac",
"./static/audio/dictee54.mp3",
"./static/audio/dictee54.ogg",
"./static/audio/dictee54.aac",
"./static/audio/dictee55.mp3",
"./static/audio/dictee55.ogg",
"./static/audio/dictee55.aac",
"./static/audio/dictee56.mp3",
"./static/audio/dictee56.ogg",
"./static/audio/dictee56.aac",
"./static/config/apropos.json",
"./static/config/format_audio.json",
"./static/config/licence.json",
"./static/config/liste_dictees.json",
"./static/config/liste_reecritures.json",
"./static/config/menu_accueil_exercice.json",
"./static/config/menu_accueil.json",
"./static/config/menu_aide.json",
"./static/config/menu_consigne.json",
"./static/config/menu_dictee.json",
"./static/config/menu_ecouter.json",
"./static/config/menu_liste.json",
"./static/config/menu_mentions_dictee.json",
"./static/config/menu_mentions_reecriture.json",
"./static/config/menu_modprefs.json",
"./static/config/menu_profil.json",
"./static/config/menu_reecriture.json",
"./static/config/menu_saisir_dictee.json",
"./static/config/menu_saisir_reecriture.json",
"./static/config/messages.json",
"./static/config/niveaux.json",
"./static/config/popups.json",
"./static/config/rubriques_apropos.json",
"./static/config/rubriques_dictam.json",
"./static/config/rubriques_licence.json",
"./static/config/table_caracteres.json",
"./static/data/dictam31.json",
"./static/data/dictam36.json",
"./static/data/dictam56.json",
"./static/data/dictee31.json",
"./static/data/dictee32.json",
"./static/data/dictee33.json",
"./static/data/dictee34.json",
"./static/data/dictee35.json",
"./static/data/dictee36.json",
"./static/data/dictee51.json",
"./static/data/dictee52.json",
"./static/data/dictee53.json",
"./static/data/dictee54.json",
"./static/data/dictee55.json",
"./static/data/dictee56.json",
"./static/data/jecho32.json",
"./static/data/jecho501.json",
"./static/data/jecho502.json",
"./static/data/jecho52.json",
"./static/images/ccbync.png",
"./static/images/encrier144.png",
"./static/images/encrier168.png",
"./static/images/encrier16.png",
"./static/images/encrier180.png",
"./static/images/encrier192.png",
"./static/images/encrier32.png",
"./static/images/encrier48.png",
"./static/images/encrier512.png",
"./static/images/encrier72.png",
"./static/images/encrier96.png",
"./static/images/encrier.jpg",
"./static/images/github.png",
"./vendor/icomoon/fonts/icomoon.eot",
"./vendor/icomoon/fonts/icomoon.svg",
"./vendor/icomoon/fonts/icomoon.ttf",
"./vendor/icomoon/fonts/icomoon.woff",
"./vendor/icomoon/style.min.css",
"./vendor/w3school/styles/w3.min.css"
];

self.addEventListener("install", function(event) {
	event.waitUntil(caches.open(cacheName).then((cache) =>{
		return cache.addAll(filesToCache);
	}));
    console.log("service worker installed...")
});

self.addEventListener('fetch', function(event) {
    console.log(event.request.url);
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', function(e) {
    console.log('service worker: Activate');
    e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName) {
          console.log('service worker: Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
    );
    return self.clients.claim();
});