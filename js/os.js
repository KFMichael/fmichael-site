(function () {
  var root = document.documentElement;
  var os = document.getElementById('os');
  if (!os) return;

  var QUERY = '(min-width: 900px) and (min-height: 560px)';
  var mq = window.matchMedia(QUERY);
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  var lock = document.getElementById('lock');
  var desktop = document.getElementById('desktop');
  var layer = document.getElementById('win-layer');
  var enterBtn = document.getElementById('enter');
  var appLabel = document.getElementById('mb-app');
  var themeBtn = document.getElementById('os-theme');
  var openWins = {};
  var zTop = 10;
  var cascade = 0;
  var ready = false;

  var APPS = {
    parcours: { title: 'Parcours', src: '#parcours' },
    travail: { title: 'Travail', src: '#travail' },
    dispo: { title: 'Disponibilité', build: buildDispo },
    hobbies: { title: 'Hobbies', src: '#hobbies' },
    contact: { title: 'Contact', src: '#contact' }
  };

  function store(key, value) {
    try { if (value === undefined) return localStorage.getItem(key); localStorage.setItem(key, value); } catch (e) { /* ignoré */ }
    return null;
  }

  /* ---------- Horloge ---------- */
  function tick() {
    var now = new Date();
    var date = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
    var time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(now);
    var short = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(now);
    document.getElementById('lock-date').textContent = date;
    document.getElementById('lock-time').textContent = time;
    document.getElementById('mb-clock').textContent = short + ' ' + time;
    var day = document.getElementById('cal-day');
    if (day) day.textContent = now.getDate();
  }

  /* ---------- Contenu des fenêtres ---------- */
  function cloneSection(selector, body) {
    var sec = document.querySelector(selector);
    if (!sec) return;
    Array.prototype.forEach.call(sec.children, function (child) {
      if (child.tagName === 'H2') return;
      body.appendChild(child.cloneNode(true));
    });
    Array.prototype.forEach.call(body.querySelectorAll('[id]'), function (el) { el.removeAttribute('id'); });
  }

  function buildDispo(body) {
    var d = new Date();
    var y = d.getFullYear(), m = d.getMonth(), today = d.getDate();
    var offset = (new Date(y, m, 1).getDay() + 6) % 7;
    var days = new Date(y, m + 1, 0).getDate();
    var heads = [['lun.', 'lundi'], ['mar.', 'mardi'], ['mer.', 'mercredi'], ['jeu.', 'jeudi'], ['ven.', 'vendredi'], ['sam.', 'samedi'], ['dim.', 'dimanche']];
    var cap = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(d);
    var html = '<p><strong>Disponible en freelance</strong>, en hybride (2 à 4 jours par semaine sur site) et à l\'international.</p>';
    html += '<table class="cal"><caption>' + cap + '</caption><thead><tr>';
    heads.forEach(function (h) { html += '<th scope="col"><abbr title="' + h[1] + '">' + h[0] + '</abbr></th>'; });
    html += '</tr></thead><tbody>';
    var n = 1 - offset;
    while (n <= days) {
      html += '<tr>';
      for (var i = 0; i < 7; i++, n++) {
        if (n < 1 || n > days) html += '<td></td>';
        else if (n === today) html += '<td aria-current="date"><span><span class="visually-hidden">Aujourd\'hui, </span>' + n + '</span></td>';
        else html += '<td>' + n + '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    html += '<p><a class="button" href="mailto:k@fmichael.cloud?subject=Prise%20de%20contact">Prendre contact</a></p>';
    body.innerHTML = html;
  }

  /* ---------- Fenêtres ---------- */
  var ICON_CLOSE = '<svg viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M2 2l6 6M8 2L2 8" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
  var ICON_ZOOM = '<svg viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M5 2v6M2 5h6" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';

  function dockButton(id) { return os.querySelector('.dock-item[data-app="' + id + '"]'); }

  function setActive(win) {
    Object.keys(openWins).forEach(function (k) { openWins[k].classList.remove('active'); });
    if (!win) { appLabel.textContent = ''; return; }
    win.classList.add('active');
    win.style.zIndex = ++zTop;
    appLabel.textContent = win.getAttribute('data-title');
  }

  function openApp(id) {
    var app = APPS[id];
    if (!app) return;
    if (openWins[id]) { setActive(openWins[id]); openWins[id].focus(); return; }

    var win = document.createElement('div');
    win.className = 'win';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-labelledby', 'wt-' + id);
    win.setAttribute('tabindex', '-1');
    win.setAttribute('data-title', app.title);
    win.setAttribute('data-app', id);

    var step = (cascade++ % 6) * 28;
    win.style.left = Math.max(16, Math.round((layer.clientWidth - 672) / 2) - 90 + step) + 'px';
    win.style.top = (24 + step) + 'px';

    win.innerHTML =
      '<div class="titlebar">' +
        '<div class="lights">' +
          '<button type="button" class="light close" aria-label="Fermer la fenêtre ' + app.title + '">' + ICON_CLOSE + '</button>' +
          '<button type="button" class="light zoom" aria-label="Agrandir la fenêtre ' + app.title + '" aria-pressed="false">' + ICON_ZOOM + '</button>' +
        '</div>' +
        '<h2 class="win-title" id="wt-' + id + '">' + app.title + '</h2>' +
      '</div>' +
      '<div class="win-body" tabindex="0" role="region" aria-labelledby="wt-' + id + '"></div>';

    var body = win.querySelector('.win-body');
    if (app.build) app.build(body); else cloneSection(app.src, body);

    layer.appendChild(win);
    openWins[id] = win;
    var btn = dockButton(id);
    if (btn) btn.setAttribute('aria-expanded', 'true');

    win.querySelector('.close').addEventListener('click', function () { closeApp(id, true); });
    var zoom = win.querySelector('.zoom');
    zoom.addEventListener('click', function () {
      var on = win.classList.toggle('max');
      zoom.setAttribute('aria-pressed', on ? 'true' : 'false');
      zoom.setAttribute('aria-label', (on ? 'Restaurer' : 'Agrandir') + ' la fenêtre ' + app.title);
    });
    win.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); closeApp(id, true); }
    });
    win.addEventListener('pointerdown', function () { setActive(win); });
    win.addEventListener('focusin', function () { if (!win.classList.contains('active')) setActive(win); });
    enableDrag(win);

    setActive(win);
    win.focus();
  }

  function closeApp(id, returnFocus) {
    var win = openWins[id];
    if (!win) return;
    win.remove();
    delete openWins[id];
    var btn = dockButton(id);
    if (btn) { btn.setAttribute('aria-expanded', 'false'); if (returnFocus) btn.focus(); }
    var ids = Object.keys(openWins);
    setActive(ids.length ? openWins[ids[ids.length - 1]] : null);
  }

  function enableDrag(win) {
    var bar = win.querySelector('.titlebar');
    var startX, startY, baseLeft, baseTop, dragging = false;
    bar.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button') || win.classList.contains('max')) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      baseLeft = win.offsetLeft; baseTop = win.offsetTop;
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var left = baseLeft + e.clientX - startX;
      var top = baseTop + e.clientY - startY;
      win.style.left = Math.min(Math.max(-win.offsetWidth + 120, left), layer.clientWidth - 120) + 'px';
      win.style.top = Math.min(Math.max(0, top), layer.clientHeight - 60) + 'px';
    });
    function stop() { dragging = false; }
    bar.addEventListener('pointerup', stop);
    bar.addEventListener('pointercancel', stop);
  }

  /* ---------- Écran verrouillé / bureau ---------- */
  function showLock() {
    lock.hidden = false;
    lock.inert = false;
    lock.classList.remove('leaving');
    desktop.inert = true;
    enterBtn.focus();
  }

  function unlock(appId) {
    lock.inert = true;
    desktop.inert = false;
    var done = function () {
      lock.hidden = true;
      lock.classList.remove('leaving');
      if (appId) openApp(appId);
      else { var first = os.querySelector('.dock-item'); if (first) first.focus(); }
    };
    if (reduced.matches) { done(); return; }
    lock.classList.add('leaving');
    setTimeout(done, 460);
  }

  function syncTheme() {
    var dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.textContent = dark ? 'Thème clair' : 'Thème sombre';
    themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
  }

  function init() {
    if (ready) return;
    ready = true;
    tick();
    setInterval(tick, 15000);
    syncTheme();

    enterBtn.addEventListener('click', function () { unlock(); });
    Array.prototype.forEach.call(os.querySelectorAll('.notif'), function (b) {
      b.addEventListener('click', function () { unlock(b.getAttribute('data-app')); });
    });
    Array.prototype.forEach.call(os.querySelectorAll('.dock-item[data-app]'), function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-app');
        if (openWins[id] && openWins[id].classList.contains('active')) closeApp(id, false);
        else openApp(id);
      });
    });
    Array.prototype.forEach.call(os.querySelectorAll('[data-action="classic"]'), function (b) {
      b.addEventListener('click', function () { store('mode', 'classic'); disable(true); });
    });
    document.getElementById('os-lock').addEventListener('click', showLock);
    themeBtn.addEventListener('click', function () {
      document.getElementById('theme-toggle').click();
      syncTheme();
    });
  }

  function enable() {
    root.classList.add('os-mode');
    os.hidden = false;
    init();
    syncTheme();
    showLock();
  }

  function disable(focusMain) {
    root.classList.remove('os-mode');
    os.hidden = true;
    Object.keys(openWins).forEach(function (id) { closeApp(id, false); });
    if (focusMain) {
      var main = document.getElementById('contenu');
      if (main) main.focus();
    }
  }

  var toOs = document.getElementById('to-os');
  if (toOs) toOs.addEventListener('click', function () { store('mode', 'os'); enable(); });

  mq.addEventListener('change', function () {
    if (mq.matches && store('mode') !== 'classic') enable();
    else if (!mq.matches && root.classList.contains('os-mode')) disable(false);
  });

  if (root.classList.contains('os-mode') && mq.matches) enable();
  else root.classList.remove('os-mode');
})();
