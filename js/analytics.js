/* Mesure d'audience : Cloudflare Web Analytics (sans cookie). Chargée uniquement sur fmichael.cloud.
   - jamais en local, dans les tests ni sur une autre adresse ;
   - jamais si le navigateur envoie « Do Not Track » ;
   - jamais pour un navigateur exclu : ouvrir https://fmichael.cloud/?analytics=off (et ?analytics=on pour réactiver). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else {
    var api = factory();
    api.start(root);
  }
})(typeof self !== 'undefined' ? self : this, function () {
  var TOKEN = '1cf45463ad064b8a9fb21180793b3c9e'; // jeton public du site (pas un secret)
  var HOSTS = ['fmichael.cloud', 'www.fmichael.cloud'];
  var BEACON = 'https://static.cloudflareinsights.com/beacon.min.js';
  var FLAG = 'no-analytics';

  function shouldTrack(env) {
    return HOSTS.indexOf(env.hostname) !== -1 && !env.doNotTrack && !env.optedOut;
  }

  // Lit ?analytics=off|on, mémorise le choix et le renvoie (true = exclu)
  function readOptOut(win) {
    var store;
    try { store = win.localStorage; } catch { store = null; }
    var param = new URLSearchParams(win.location.search).get('analytics');
    try {
      if (store && param === 'off') store.setItem(FLAG, '1');
      if (store && param === 'on') store.removeItem(FLAG);
      return !!(store && store.getItem(FLAG));
    } catch { return param === 'off'; }
  }

  function start(win) {
    if (!win || !win.document) return;
    var nav = win.navigator || {};
    var dnt = nav.doNotTrack === '1' || nav.doNotTrack === 'yes' || win.doNotTrack === '1';
    var env = { hostname: win.location.hostname, doNotTrack: dnt, optedOut: readOptOut(win) };
    if (!shouldTrack(env)) return;
    var s = win.document.createElement('script');
    s.type = 'module';
    s.src = BEACON;
    s.setAttribute('data-cf-beacon', JSON.stringify({ token: TOKEN }));
    win.document.head.appendChild(s);
  }

  return { shouldTrack: shouldTrack, start: start };
});
