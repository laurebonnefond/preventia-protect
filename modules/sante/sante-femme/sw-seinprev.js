/* SeinPrév — fonctionnement hors connexion de l'application « Connaître mes seins »
   Pages : réseau d'abord (pour recevoir les mises à jour), copie locale si pas de réseau.
   Images, styles, polices : copie locale d'abord.
   Le journal n'est PAS ici : il reste dans le stockage du navigateur du téléphone. */
const CACHE = 'seinprev-app-v1';
const BASE = [
  'seinprev.html', 'seinprev.html?app=1', 'femme.css', 'seinprev.webmanifest',
  'img/app-sein-192.png', 'img/app-sein-512.png',
  'img/auto-miroir.webp', 'img/auto-allongee.webp', 'img/auto-doigts.webp', 'img/auto-pressions.webp', 'img/auto-zone.webp', 'img/auto-parcours.webp',
  ...['nuque', 'doigts', 'aisselle', 'clavicule'].map(f => `img/spsti-palp-${f}.webp`),
  ...['masse', 'forme', 'fossettes', 'rougeurs', 'peau', 'ganglions', 'ecoulement', 'mamelon'].map(f => `img/spsti-signe-${f}.webp`)
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(BASE.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('seinprev-app-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  const page = r.mode === 'navigate';
  const utile = url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(url.host);
  if (!utile) return;
  if (page) {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); return res; })
      .catch(() => caches.match(r, { ignoreSearch: false }).then(m => m || caches.match('seinprev.html?app=1'))));
    return;
  }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => {
    if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
    return res;
  })));
});
