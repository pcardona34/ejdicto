// service-worker.js
// Service Worker : from vanilla-pwa
// By Arjun Mahishi
// Code Source : https://github.com/arjunmahishi/vanilla-pwa
// License : MIT

let version = 1.0;

let cacheName = "MyCacheV" + version;

let filesToCache = [
	"/",
	"./index.html",
	"./favicon.ico",
	"./manifest.webmanifest",
	"./service-worker.js",
	"./scripts/app.min.js",
	"./scripts/ejdicto.min.js",
	"./scripts/w3.min.js",
	"./static/audio/dictee31.mp3",
	"./static/audio/dictee31.ogg",
	"./static/audio/dictee32.mp3",
	"./static/audio/dictee32.ogg",
	"./static/audio/dictee33.mp3",
	"./static/audio/dictee33.ogg",
	"./static/audio/dictee34.mp3",
	"./static/audio/dictee34.ogg",
	"./static/audio/dictee35.mp3",
	"./static/audio/dictee35.ogg",
	"./static/audio/dictee51.mp3",
	"./static/audio/dictee51.ogg",
	"./static/audio/dictee52.mp3",
	"./static/audio/dictee52.ogg",
	"./static/audio/dictee53.mp3",
	"./static/audio/dictee53.ogg",
	"./static/audio/dictee54.mp3",
	"./static/audio/dictee54.ogg",
	"./static/audio/dictee55.mp3",
	"./static/audio/dictee55.ogg",
	"./static/config/apropos.json",
	"./static/config/liste_dictees.json",
	"./static/config/liste_reecritures.json",
    "./static/data/dictee31.json",
    "./static/data/dictee32.json",
    "./static/data/dictee33.json",
    "./static/data/dictee34.json",
    "./static/data/dictee35.json",
    "./static/data/dictee51.json",
    "./static/data/dictee52.json",
    "./static/data/dictee53.json",
    "./static/data/dictee54.json",
    "./static/data/dictee55.json",
    "./static/data/jecho32.json",
    "./static/data/jecho501.json",
    "./static/data/jecho502.json",
    "./static/data/jecho52.json",
    "./static/icones/icomoon.eot",
    "./static/icones/icomoon.ttf",
    "./static/icones/icomoon.woff",
    "./static/icones/style.min.css",
    "./static/images/encrie.jpg",
    "./static/images/encrier144.png",
    "./static/images/encrie16.png",
    "./static/images/encrie168.png",
    "./static/images/encrie180.png",
    "./static/images/encrie192.png",
    "./static/images/encrie48.pnh",
    "./static/images/encrie512.png",
    "./static/images/encrie72.png",
    "./static/images/encrie96.png",
    "./static/images/github.png",
    "./styles/ejdicto.min.css",
    "./styles/w3.min.css"
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