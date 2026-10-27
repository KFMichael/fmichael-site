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
  var home = document.getElementById('home');
  var dock = os.querySelector('.dock');
  var toOs = document.getElementById('to-os');
  var homeInd = document.getElementById('home-ind');
  var opener = null;
  var histDepth = 0;

  function isPhone() { return root.classList.contains('phone-mode'); }

  var APPS = {
    parcours: { title: 'Parcours', src: '#parcours' },
    travail: { title: 'Réalisations', build: buildTravail },
    dispo: { title: 'Disponibilité', build: buildDispo },
    hobbies: { title: 'Hobbies', src: '#hobbies' },
    contact: { title: 'Contact', src: '#contact' },
    reglages: { title: 'Réglages', build: buildReglages }
  };

  function store(key, value) {
    try { if (value === undefined) return localStorage.getItem(key); localStorage.setItem(key, value); } catch { /* ignoré */ }
    return null;
  }

  /* ---------- Horloge ---------- */
  function tick() {
    var c = OsUtils.clockParts(new Date());
    document.getElementById('lock-date').textContent = c.date;
    document.getElementById('lock-time').textContent = c.time;
    document.getElementById('mb-clock').textContent = c.short + ' ' + c.time;
    document.getElementById('mb-time').textContent = c.time;
    var fill = { '.w-day': c.day, '.w-dow': c.weekday, '.w-month': c.month, '.cal-num': c.day, '.cal-dow': c.dow };
    Object.keys(fill).forEach(function (selector) {
      Array.prototype.forEach.call(os.querySelectorAll(selector), function (el) { el.textContent = fill[selector]; });
    });
  }

  /* ---------- Écran d'accueil (téléphone) : widgets + copie des icônes du dock ---------- */
  var SHORT_LABEL = { dispo: 'Dispo' };
  var ICON_GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/></svg>';

  function homeItem(app, icoClass, iconHtml, label, short) {
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'dock-item home-item';
    b.setAttribute('data-app', app);
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-expanded', 'false');
    b.innerHTML = '<span class="ico ' + icoClass + '" aria-hidden="true">' + iconHtml + '</span>' + OsUtils.labelHtml(label, short);
    li.appendChild(b);
    return li;
  }

  function buildHome() {
    var widgets = document.createElement('div');
    widgets.className = 'widgets';
    widgets.innerHTML =
      '<button type="button" class="widget" data-app="dispo" aria-haspopup="dialog" aria-expanded="false">' +
        '<span class="w-dow"></span><span class="w-day"></span>' +
        '<span class="w-note">En mission longue, dispo pour des projets courts</span>' +
      '</button>' +
      '<button type="button" class="widget widget-cv" data-app="parcours" aria-haspopup="dialog" aria-expanded="false">' +
        '<span class="w-big">11 ans</span><span class="w-note">entre métier et tech, dont 6 chez Louis Vuitton</span>' +
      '</button>' +
      '<button type="button" class="widget widget-code" data-app="hobbies" aria-haspopup="dialog" aria-expanded="false">' +
        '<span class="w-big" aria-hidden="true">&lt;/&gt;</span><span class="w-note">Vibecoding : deux projets à essayer</span>' +
      '</button>';
    home.insertBefore(widgets, home.firstChild);

    var list = home.querySelector('ul');
    Array.prototype.forEach.call(dock.querySelectorAll('.dock-item'), function (item) {
      var copy = item.cloneNode(true);
      copy.classList.add('home-item');
      Array.prototype.forEach.call(copy.querySelectorAll('[id]'), function (el) { el.removeAttribute('id'); });
      var tip = copy.querySelector('.tip');
      var id = copy.getAttribute('data-app');
      if (id && SHORT_LABEL[id]) {
        tip.className = 'home-label';
        tip.setAttribute('aria-hidden', 'true');
        tip.textContent = SHORT_LABEL[id];
        var full = document.createElement('span');
        full.className = 'visually-hidden';
        full.textContent = item.querySelector('.tip').textContent;
        copy.appendChild(full);
      } else {
        tip.className = 'home-label';
        tip.innerHTML = tip.textContent.replace(' (nouvel onglet)', '<span class="visually-hidden"> (nouvel onglet)</span>');
      }
      var li = document.createElement('li');
      li.appendChild(copy);
      list.appendChild(li);
    });
    list.appendChild(homeItem('reglages', 'i-set', ICON_GEAR, 'Réglages'));
  }

  /* ---------- Réalisations (id interne « travail ») : liste, puis détail empilé (téléphone) ---------- */
  function buildTravail(body, nav) {
    if (!nav) { cloneSection('#travail', body); return; }
    var sec = document.querySelector('#travail');
    if (!sec) return;
    ['p', 'ul.tags'].forEach(function (sel) {
      var el = sec.querySelector(':scope > ' + sel);
      if (el) body.appendChild(el.cloneNode(true));
    });
    var list = document.createElement('ul');
    list.className = 'ios-list';
    Array.prototype.forEach.call(sec.querySelectorAll('article.card'), function (card) {
      var title = card.querySelector('h3').textContent.trim();
      var when = card.querySelector('.when');
      var context = card.querySelector('p:not(.when)');
      var li = document.createElement('li');
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'ios-row ios-row-nav';
      row.innerHTML = '<span class="ios-row-text"><span class="ios-row-title"></span><span class="ios-row-sub"></span></span><span class="ios-chev" aria-hidden="true">' + ICON_CHEV + '</span>';
      row.querySelector('.ios-row-title').textContent = title;
      var summary = OsUtils.rowSummary(context ? context.textContent : '');
      row.querySelector('.ios-row-sub').textContent = (when ? when.textContent.trim() + ' · ' : '') + summary;
      row.addEventListener('click', function () {
        var detail = document.createElement('div');
        Array.prototype.forEach.call(card.children, function (child) {
          if (child.tagName !== 'H3') detail.appendChild(child.cloneNode(true));
        });
        nav.push(title, detail);
      });
      li.appendChild(row);
      list.appendChild(li);
    });
    body.appendChild(list);
  }

  /* ---------- Réglages (téléphone) ---------- */
  function buildReglages(body) {
    var dark = root.getAttribute('data-theme') === 'dark';
    body.innerHTML =
      '<h3 class="ios-head">Affichage</h3>' +
      '<ul class="ios-list"><li><button type="button" class="ios-row" id="rg-theme" role="switch" aria-checked="' + dark + '">' +
        '<span>Thème sombre</span><span class="ios-switch" aria-hidden="true"></span></button></li></ul>' +
      '<h3 class="ios-head">Navigation</h3>' +
      '<ul class="ios-list">' +
        '<li><button type="button" class="ios-row" id="rg-classic"><span>Version classique</span><span class="ios-chev" aria-hidden="true">' + ICON_CHEV + '</span></button></li>' +
        '<li><button type="button" class="ios-row" id="rg-lock"><span>Verrouiller l\'écran</span><span class="ios-chev" aria-hidden="true">' + ICON_CHEV + '</span></button></li>' +
      '</ul>' +
      '<p class="ios-foot">La version classique est mémorisée sur cet appareil. Le bouton « Mode téléphone », en haut de la page classique, la réactive.</p>';
    var sw = body.querySelector('#rg-theme');
    sw.addEventListener('click', function () {
      document.getElementById('theme-toggle').click();
      syncTheme();
      sw.setAttribute('aria-checked', root.getAttribute('data-theme') === 'dark' ? 'true' : 'false');
    });
    body.querySelector('#rg-classic').addEventListener('click', function () { store('mode', 'classic'); disable(true); });
    body.querySelector('#rg-lock').addEventListener('click', function () { closeAll(); showLock(); });
  }

  function appButtons(id) { return os.querySelectorAll('button[data-app="' + id + '"]'); }

  function setInert(on) {
    [os.querySelector('.menubar'), home, dock].forEach(function (el) { if (el) el.inert = on; });
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
    body.innerHTML =
      '<p><strong>En mission longue, disponible pour des projets de courte durée.</strong></p>' +
      '<p>Pour en discuter, réserve un créneau ou écris-moi.</p>' +
      '<p><a class="button" href="https://calendly.com/kangahmichael/new-meeting" target="_blank" rel="noopener">Prendre rendez-vous <span class="visually-hidden">(s\'ouvre dans un nouvel onglet)</span></a></p>' +
      '<p><a href="mailto:k@fmichael.cloud?subject=Prise%20de%20contact">Ou écrire un message</a></p>';
  }

  /* ---------- Fenêtres ---------- */
  var ICON_CLOSE = '<svg viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M2 2l6 6M8 2L2 8" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
  var ICON_BACK = '<svg viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M6.5 1.5L3 5l3.5 3.5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_CHEV = '<svg viewBox="0 0 10 16" aria-hidden="true" focusable="false"><path d="M2 2l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_MIN = '<svg viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M2 5h6" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
  var ICON_ZOOM ='<svg viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M5 2v6M2 5h6" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';

  function dockButton(id) { return dock.querySelector('.dock-item[data-app="' + id + '"]'); }

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
    if (openWins[id]) {
      if (openWins[id].classList.contains('minimized')) restoreApp(id);
      setActive(openWins[id]); openWins[id].focus(); return;
    }
    var phone = isPhone();
    if (phone) Object.keys(openWins).forEach(function (k) { closeApp(k, false); });

    var win = document.createElement('div');
    win.className = 'win';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-labelledby', 'wt-' + id);
    win.setAttribute('tabindex', '-1');
    win.setAttribute('data-title', app.title);
    win.setAttribute('data-app', id);

    if (!phone) {
      var step = (cascade++ % 6) * 28;
      win.style.left = Math.max(16, Math.round((layer.clientWidth - 672) / 2) - 90 + step) + 'px';
      win.style.top = (24 + step) + 'px';
    }

    var controls = phone
      ? '<button type="button" class="back">' + ICON_BACK + '<span class="back-label">Accueil</span></button>'
      : '<div class="lights">' +
          '<button type="button" class="light close" aria-label="Fermer la fenêtre ' + app.title + '">' + ICON_CLOSE + '</button>' +
          '<button type="button" class="light min" aria-label="Réduire la fenêtre ' + app.title + '">' + ICON_MIN + '</button>' +
          '<button type="button" class="light zoom" aria-label="Agrandir la fenêtre ' + app.title + '" aria-pressed="false">' + ICON_ZOOM + '</button>' +
        '</div>';

    win.innerHTML =
      '<div class="titlebar">' + controls +
        '<h2 class="win-title" id="wt-' + id + '">' + app.title + '</h2>' +
      '</div>' +
      '<div class="win-body" tabindex="0" role="region" aria-labelledby="wt-' + id + '"></div>';

    var body = win.querySelector('.win-body');
    var nav = null;
    if (phone) {
      // Pile de navigation : les écrans empilés vivent dans .screens, la barre du haut est partagée
      var screens = document.createElement('div');
      screens.className = 'screens';
      win.insertBefore(screens, body);
      screens.appendChild(body);
      win._screens = [{ title: app.title, body: body }];
      nav = { push: function (title, node) { pushScreen(win, title, node); } };
    }
    if (app.build) app.build(body, nav); else cloneSection(app.src, body);

    layer.appendChild(win);
    openWins[id] = win;
    Array.prototype.forEach.call(appButtons(id), function (b) { b.setAttribute('aria-expanded', 'true'); });

    if (phone) {
      var from = opener && opener.isConnected ? opener.getBoundingClientRect() : null;
      win.style.setProperty('--ox', (from ? from.left + from.width / 2 : window.innerWidth / 2) + 'px');
      win.style.setProperty('--oy', (from ? from.top + from.height / 2 : window.innerHeight / 2) + 'px');
      body.insertAdjacentHTML('afterbegin', '<p class="large-title" aria-hidden="true">' + app.title + '</p>');
      watchScroll(win, body);
      syncBar(win);
      homeInd.hidden = false;
      win.querySelector('.back').addEventListener('click', retour);
      win.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.stopPropagation(); retour(); }
      });
      // Retour par glissement depuis le bord gauche
      var tx, ty;
      win.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
      win.addEventListener('touchend', function (e) {
        if (tx === undefined) return;
        var x0 = tx;
        var dx = e.changedTouches[0].clientX - tx;
        var dy = e.changedTouches[0].clientY - ty;
        tx = undefined;
        if (OsUtils.isEdgeSwipeBack(x0, dx, dy)) retour();
      }, { passive: true });
      setInert(true);
      history.pushState({ app: id, depth: 1 }, '');
      histDepth = 1;
    } else {
      win.querySelector('.close').addEventListener('click', function () { closeApp(id, true); });
      win.querySelector('.min').addEventListener('click', function () { minimizeApp(id); });
      var zoom = win.querySelector('.zoom');
      zoom.addEventListener('click', function () {
        var on = win.classList.toggle('max');
        zoom.setAttribute('aria-pressed', on ? 'true' : 'false');
        zoom.setAttribute('aria-label', (on ? 'Restaurer' : 'Agrandir') + ' la fenêtre ' + app.title);
      });
      // Double-clic sur la barre de titre : agrandir / restaurer (le bouton vert reste là pour le clavier)
      win.querySelector('.titlebar').addEventListener('dblclick', function (e) {
        if (!e.target.closest('button')) zoom.click();
      });
      win.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.stopPropagation(); closeApp(id, true); }
      });
      win.addEventListener('pointerdown', function () { setActive(win); });
      win.addEventListener('focusin', function () { if (!win.classList.contains('active')) setActive(win); });
      enableDrag(win);
      enableResize(win);
    }

    setActive(win);
    win.focus();
  }

  // Retire un élément après son animation de sortie (tout de suite si les animations sont réduites)
  function removeAnimated(el, cls) {
    if (reduced.matches) { el.remove(); return; }
    el.inert = true;
    el.classList.add(cls);
    var done = function (e) { if (!e || e.target === el) el.remove(); };
    el.addEventListener('animationend', done);
    setTimeout(done, 450);
  }

  /* Réduire : la fenêtre part dans le dock (point sous l'icône), un clic sur l'icône la rouvre. */
  function lastVisible() {
    var ids = Object.keys(openWins).filter(function (k) { return !openWins[k].classList.contains('minimized') && !openWins[k].classList.contains('minimizing'); });
    return ids.length ? openWins[ids[ids.length - 1]] : null;
  }

  function minimizeApp(id) {
    var win = openWins[id];
    if (!win || isPhone() || win.classList.contains('minimized')) return;
    var finish = function () { win.classList.remove('minimizing'); win.classList.add('minimized'); };
    win.inert = true;
    if (reduced.matches) finish();
    else { win.classList.add('minimizing'); setTimeout(finish, 230); }
    Array.prototype.forEach.call(appButtons(id), function (b) {
      b.setAttribute('aria-expanded', 'false');
      b.setAttribute('data-min', 'true');
    });
    win.classList.remove('active');
    setActive(lastVisible());
    var btn = dockButton(id);
    if (btn) btn.focus();
  }

  function restoreApp(id) {
    var win = openWins[id];
    if (!win) return;
    win.classList.remove('minimized', 'minimizing');
    win.inert = false;
    Array.prototype.forEach.call(appButtons(id), function (b) {
      b.setAttribute('aria-expanded', 'true');
      b.removeAttribute('data-min');
    });
  }

  function closeApp(id, returnFocus, immediate) {
    var win = openWins[id];
    if (!win) return;
    delete openWins[id];
    if (isPhone() && !immediate) removeAnimated(win, 'closing');
    else win.remove();
    Array.prototype.forEach.call(appButtons(id), function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (isPhone()) {
      homeInd.hidden = true;
      setInert(false);
      if (returnFocus) {
        var target = opener && opener.isConnected ? opener : home.querySelector('[data-app="' + id + '"]');
        if (target) target.focus();
      }
    } else if (returnFocus) {
      var btn = dockButton(id);
      if (btn) btn.focus();
    }
    Array.prototype.forEach.call(appButtons(id), function (b) { b.removeAttribute('data-min'); });
    setActive(lastVisible());
  }

  /* ---------- Pile de navigation (téléphone) ---------- */
  function topScreen(win) { return win._screens[win._screens.length - 1]; }

  function watchScroll(win, body) {
    body.addEventListener('scroll', function () {
      if (topScreen(win).body === body) win.classList.toggle('scrolled', body.scrollTop > 24);
    }, { passive: true });
  }

  // Barre du haut : le bouton de retour porte le titre de l'écran précédent, le titre central celui de l'écran courant
  function syncBar(win) {
    var n = win._screens.length;
    var label = n > 1 ? win._screens[n - 2].title : 'Accueil';
    win.querySelector('.back-label').textContent = label;
    win.querySelector('.back').setAttribute('aria-label', 'Retour à ' + (n > 1 ? label : "l'accueil"));
    win.querySelector('.win-title').textContent = topScreen(win).title;
  }

  function pushScreen(win, title, node) {
    var body = document.createElement('div');
    body.className = 'win-body pushed';
    body.tabIndex = 0;
    body.setAttribute('role', 'region');
    body.setAttribute('aria-label', title);
    body.insertAdjacentHTML('afterbegin', '<p class="large-title" aria-hidden="true"></p>');
    body.firstChild.textContent = title;
    body.appendChild(node);
    watchScroll(win, body);
    var below = topScreen(win);
    below.body.inert = true;
    below.body.classList.add('behind');
    win._screens.push({ title: title, body: body, opener: document.activeElement });
    win.querySelector('.screens').appendChild(body);
    syncBar(win);
    win.classList.remove('scrolled');
    history.pushState({ app: win.getAttribute('data-app'), depth: win._screens.length }, '');
    histDepth++;
    body.focus();
  }

  function popScreen(win) {
    var top = win._screens.pop();
    var below = topScreen(win);
    below.body.inert = false;
    below.body.classList.remove('behind');
    removeAnimated(top.body, 'leaving');
    syncBar(win);
    win.classList.toggle('scrolled', below.body.scrollTop > 24);
    if (top.opener && top.opener.isConnected) top.opener.focus();
  }

  /* « Retour » = bouton Précédent du navigateur (History API) : dépile un écran, ou ferme l'application */
  function retour() {
    if (histDepth) history.back();
    else Object.keys(openWins).forEach(function (id) { closeApp(id, true); });
  }

  // Barre « accueil » : ferme l'application en entier, quelle que soit la profondeur de la pile
  function goHome() {
    Object.keys(openWins).forEach(function (id) { closeApp(id, true); });
    if (histDepth) { var n = histDepth; histDepth = 0; history.go(-n); }
  }

  function closeAll() {
    Object.keys(openWins).forEach(function (id) { closeApp(id, false, true); });
    if (histDepth) { var n = histDepth; histDepth = 0; history.go(-n); }
  }

  window.addEventListener('popstate', function () {
    var ids = Object.keys(openWins);
    if (!ids.length) { histDepth = 0; return; }
    if (!isPhone()) return;
    var win = openWins[ids[0]];
    if (win._screens && win._screens.length > 1) { popScreen(win); histDepth = Math.max(0, histDepth - 1); }
    else { histDepth = 0; closeApp(ids[0], true); }
  });

  /* Redimensionner : bords droit et bas et coin, à la souris ; Alt + Maj + flèches au clavier. Taille minimale 22 × 14 rem, jamais au-delà du bureau. */
  function resizeWin(win, w, h) {
    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    var maxW = layer.clientWidth - win.offsetLeft;
    var maxH = layer.clientHeight - win.offsetTop;
    win.style.width = Math.max(Math.min(22 * rem, maxW), Math.min(w, maxW)) + 'px';
    win.style.height = Math.max(Math.min(14 * rem, maxH), Math.min(h, maxH)) + 'px';
  }

  function enableResize(win) {
    ['rs-e', 'rs-s', 'rs-se'].forEach(function (cls) {
      var h = document.createElement('div');
      h.className = 'resize ' + cls;
      h.setAttribute('aria-hidden', 'true');
      win.appendChild(h);
      var sx, sy, sw, sh, on = false;
      h.addEventListener('pointerdown', function (e) {
        if (win.classList.contains('max')) return;
        on = true; sx = e.clientX; sy = e.clientY; sw = win.offsetWidth; sh = win.offsetHeight;
        h.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      h.addEventListener('pointermove', function (e) {
        if (!on) return;
        resizeWin(win, cls === 'rs-s' ? sw : sw + e.clientX - sx, cls === 'rs-e' ? sh : sh + e.clientY - sy);
      });
      var stop = function () { on = false; };
      h.addEventListener('pointerup', stop);
      h.addEventListener('pointercancel', stop);
    });
    win.addEventListener('keydown', function (e) {
      if (!(e.altKey && e.shiftKey) || win.classList.contains('max') || e.target.closest('input, textarea')) return;
      var d = { ArrowRight: [24, 0], ArrowLeft: [-24, 0], ArrowDown: [0, 24], ArrowUp: [0, -24] }[e.key];
      if (!d) return;
      e.preventDefault();
      resizeWin(win, win.offsetWidth + d[0], win.offsetHeight + d[1]);
    });
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
    closeMenus(false);
    spotClose(false);
    lock.hidden = false;
    lock.inert = false;
    lock.classList.remove('leaving');
    desktop.inert = true;
    enterBtn.focus({ preventScroll: true });
  }

  function unlock(appId) {
    lock.inert = true;
    desktop.inert = false;
    var done = function () {
      lock.hidden = true;
      lock.classList.remove('leaving');
      if (appId) openApp(appId);
      else { var first = (isPhone() ? home : dock).querySelector('.dock-item'); if (first) first.focus(); }
    };
    if (reduced.matches) { done(); return; }
    lock.classList.add('leaving');
    setTimeout(done, 460);
  }

  function syncTheme() {
    var dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.textContent = dark ? 'Thème clair' : 'Thème sombre';
    themeBtn.setAttribute('aria-checked', dark ? 'true' : 'false');
  }

  /* Menus déroulants de la barre de menus (motif « menu button » : flèches, Début/Fin, Échap, Entrée, survol pour passer d'un menu à l'autre) */
  var menuTriggers = [];
  function menuOf(trigger) { return document.getElementById(trigger.getAttribute('aria-controls')); }
  function menuItems(menu) {
    return Array.prototype.slice.call(menu.querySelectorAll('[role^="menuitem"]')).filter(function (i) { return !i.hidden; });
  }
  function activeWinId() {
    return Object.keys(openWins).filter(function (k) { return openWins[k].classList.contains('active'); })[0] || null;
  }
  function syncWindowMenu() {
    var id = activeWinId();
    var win = id ? openWins[id] : null;
    ['mw-close', 'mw-min', 'mw-zoom'].forEach(function (k) {
      document.getElementById(k).setAttribute('aria-disabled', win ? 'false' : 'true');
    });
    document.getElementById('mw-zoom').textContent = win && win.classList.contains('max') ? 'Restaurer la fenêtre' : 'Agrandir la fenêtre';
  }
  function closeMenus(returnFocus) {
    menuTriggers.forEach(function (t) {
      if (t.getAttribute('aria-expanded') !== 'true') return;
      t.setAttribute('aria-expanded', 'false');
      menuOf(t).hidden = true;
      if (returnFocus) t.focus();
    });
  }
  function openMenu(trigger, which) {
    closeMenus(false);
    var menu = menuOf(trigger);
    if (menu.id === 'menu-win') syncWindowMenu();
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    var items = menuItems(menu);
    var target = which === 'last' ? items[items.length - 1] : items[0];
    if (target) target.focus();
  }
  function initMenus() {
    menuTriggers = Array.prototype.slice.call(os.querySelectorAll('.mb-trigger'));
    menuTriggers.forEach(function (t, i) {
      t.addEventListener('click', function () {
        if (t.getAttribute('aria-expanded') === 'true') closeMenus(true); else openMenu(t);
      });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); openMenu(t); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); openMenu(t, 'last'); }
      });
      t.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'mouse' && menuTriggers.some(function (o) { return o !== t && o.getAttribute('aria-expanded') === 'true'; })) openMenu(t);
      });
      var menu = menuOf(t);
      menu.addEventListener('keydown', function (e) {
        var items = menuItems(menu);
        var at = items.indexOf(document.activeElement);
        var move = function (n) { e.preventDefault(); items[(n + items.length) % items.length].focus(); };
        if (e.key === 'ArrowDown') move(at + 1);
        else if (e.key === 'ArrowUp') move(at - 1);
        else if (e.key === 'Home') move(0);
        else if (e.key === 'End') move(items.length - 1);
        else if (e.key === 'ArrowRight') { e.preventDefault(); openMenu(menuTriggers[(i + 1) % menuTriggers.length]); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); openMenu(menuTriggers[(i - 1 + menuTriggers.length) % menuTriggers.length]); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenus(true); }
        else if (e.key === 'Tab') closeMenus(false);
      });
      // Après une action : le menu se ferme ; si le focus n'est allé nulle part, il revient au bouton du menu
      menu.addEventListener('click', function (e) {
        var item = e.target.closest('[role^="menuitem"]');
        if (!item || item.getAttribute('aria-disabled') === 'true') return;
        closeMenus(false);
        var a = document.activeElement;
        if (!a || a === document.body || menu.contains(a)) t.focus();
      });
    });
    document.addEventListener('pointerdown', function (e) { if (!e.target.closest('.mb-menu')) closeMenus(false); });
    os.querySelector('.mb-left').addEventListener('focusout', function (e) {
      if (e.relatedTarget && !e.relatedTarget.closest('.mb-menu')) closeMenus(false);
    });

    document.getElementById('mw-close').addEventListener('click', function () {
      var id = activeWinId();
      if (id) closeApp(id, true);
    });
    document.getElementById('mw-min').addEventListener('click', function () {
      var id = activeWinId();
      if (id) minimizeApp(id);
    });
    document.getElementById('mw-zoom').addEventListener('click', function () {
      var id = activeWinId();
      if (id) openWins[id].querySelector('.zoom').click();
    });
  }

  /* Recherche (Ctrl+K ou Cmd+K, ou l'icône de la barre) : applications, actions, liens. Combobox + listbox, flèches, Entrée, Échap. */
  var spot = document.getElementById('spot');
  var spotInput = document.getElementById('spot-input');
  var spotList = document.getElementById('spot-list');
  var spotEmpty = document.getElementById('spot-empty');
  var spotStatus = document.getElementById('spot-status');
  var spotBtn = document.getElementById('mb-search');
  var spotReturn = null, spotShown = [], spotActive = 0;
  var SPOT_INERT = ['.menubar', '.dock', '#win-layer', '.desk-widgets', '.desk-photo'];
  var SPOT_GROUPS = ['Applications', 'Actions', 'Liens'];
  var LINK_NOTE = 'nouvel onglet';

  function spotEntries() {
    var dark = root.getAttribute('data-theme') === 'dark';
    var fs = document.fullscreenElement ? 'Quitter le plein écran' : 'Plein écran';
    var list = [
      { group: 'Applications', label: 'Parcours', hint: 'CV et expériences', keywords: 'cv formation louis vuitton davidson wemanity omnilog', run: function () { openApp('parcours'); } },
      { group: 'Applications', label: 'Réalisations', hint: 'Études de cas', keywords: 'shopify boutiques e-commerce portfolio', run: function () { openApp('travail'); } },
      { group: 'Applications', label: 'Disponibilité', hint: 'En mission longue, projets courts', keywords: 'mission freelance rendez-vous', run: function () { openApp('dispo'); } },
      { group: 'Applications', label: 'Hobbies', hint: 'Vibecoding, tennis, football, jeux, voyage', keywords: 'echecs budget', run: function () { openApp('hobbies'); } },
      { group: 'Applications', label: 'Contact', hint: 'E-mail, LinkedIn, GitHub', keywords: 'mail email', run: function () { openApp('contact'); } },
      { group: 'Actions', label: 'Verrouiller l\'écran', hint: '', keywords: 'ecran verrouillage', run: function () { document.getElementById('os-lock').click(); } },
      { group: 'Actions', label: dark ? 'Passer au thème clair' : 'Passer au thème sombre', hint: '', keywords: 'theme sombre clair apparence', run: function () { themeBtn.click(); } },
      { group: 'Actions', label: 'Version classique', hint: 'Page simple', keywords: 'classique page simple', run: function () { os.querySelector('#menu-brand [data-action="classic"]').click(); } },
      { group: 'Liens', label: 'Prendre rendez-vous', hint: 'Calendly, ' + LINK_NOTE, keywords: 'calendly disponibilite reunion', url: 'https://calendly.com/kangahmichael/new-meeting' },
      { group: 'Liens', label: 'LinkedIn', hint: LINK_NOTE, keywords: 'profil reseau', url: 'https://www.linkedin.com/in/kangahmichael/' },
      { group: 'Liens', label: 'GitHub', hint: LINK_NOTE, keywords: 'code profil', url: 'https://github.com/KFMichael' },
      { group: 'Liens', label: 'Apprendre à jouer aux échecs', hint: 'Vibecoding, ' + LINK_NOTE, keywords: 'projet', url: 'https://echecs.fmichael.cloud/' },
      { group: 'Liens', label: 'Apprendre à gérer son budget', hint: 'Vibecoding, ' + LINK_NOTE, keywords: 'projet patrimoine', url: 'https://monpatrimoine.fmichael.cloud/' }
    ];
    if (document.fullscreenEnabled) list.splice(8, 0, { group: 'Actions', label: fs, hint: '', keywords: 'fullscreen ecran', run: function () { os.querySelector('#menu-brand [data-action="fullscreen"]').click(); } });
    return list;
  }

  function spotRender() {
    var found = OsUtils.searchEntries(spotInput.value, spotEntries());
    spotShown = [];
    spotList.textContent = '';
    SPOT_GROUPS.forEach(function (g, gi) {
      var items = found.filter(function (e) { return e.group === g; });
      if (!items.length) return;
      var group = document.createElement('div');
      group.className = 'spot-group';
      group.setAttribute('role', 'group');
      group.setAttribute('aria-labelledby', 'spot-g' + gi);
      var label = document.createElement('div');
      label.className = 'spot-group-label';
      label.id = 'spot-g' + gi;
      label.textContent = g;
      group.appendChild(label);
      items.forEach(function (entry) {
        var opt = document.createElement('div');
        opt.className = 'spot-opt';
        opt.id = 'spot-opt-' + spotShown.length;
        opt.setAttribute('role', 'option');
        var name = document.createElement('span');
        name.textContent = entry.label;
        opt.appendChild(name);
        if (entry.hint) {
          var hint = document.createElement('span');
          hint.className = 'spot-opt-hint';
          hint.textContent = entry.hint;
          opt.appendChild(hint);
        }
        var n = spotShown.length;
        opt.addEventListener('mousemove', function () { if (spotActive !== n) spotSelect(n); });
        opt.addEventListener('mousedown', function (e) { e.preventDefault(); });
        opt.addEventListener('click', function () { spotRun(entry); });
        group.appendChild(opt);
        spotShown.push(entry);
      });
      spotList.appendChild(group);
    });
    spotEmpty.hidden = spotShown.length > 0;
    spotStatus.textContent = spotShown.length ? spotShown.length + (spotShown.length > 1 ? ' résultats' : ' résultat') : 'Aucun résultat';
    spotSelect(0);
  }

  function spotSelect(n) {
    spotActive = n;
    Array.prototype.forEach.call(spotList.querySelectorAll('[role="option"]'), function (o, i) {
      o.setAttribute('aria-selected', i === n ? 'true' : 'false');
      if (i === n) o.scrollIntoView({ block: 'nearest' });
    });
    spotInput.setAttribute('aria-activedescendant', spotShown.length ? 'spot-opt-' + n : '');
  }

  function spotOpen() {
    if (!spot.hidden || isPhone() || os.hidden || !lock.hidden) return;
    closeMenus(false);
    spotReturn = document.activeElement;
    SPOT_INERT.forEach(function (sel) { var el = desktop.querySelector(sel); if (el) el.inert = true; });
    spot.hidden = false;
    spotBtn.setAttribute('aria-expanded', 'true');
    spotInput.value = '';
    spotRender();
    spotInput.focus();
  }

  function spotClose(restoreFocus) {
    if (spot.hidden) return;
    spot.hidden = true;
    spotBtn.setAttribute('aria-expanded', 'false');
    SPOT_INERT.forEach(function (sel) { var el = desktop.querySelector(sel); if (el) el.inert = false; });
    if (restoreFocus) {
      var back = spotReturn && spotReturn.isConnected && !spotReturn.closest('[inert]') ? spotReturn : spotBtn;
      back.focus();
    }
  }

  function spotRun(entry) {
    spotClose(false);
    opener = null;
    if (entry.url) {
      var a = document.createElement('a');
      a.href = entry.url; a.target = '_blank'; a.rel = 'noopener';
      a.click();
    } else {
      entry.run();
    }
    var a2 = document.activeElement;
    if (!a2 || a2 === document.body || spot.contains(a2)) (spotReturn && spotReturn.isConnected ? spotReturn : spotBtn).focus();
  }

  function initSpot() {
    spotBtn.addEventListener('click', function () { if (spot.hidden) spotOpen(); else spotClose(true); });
    document.getElementById('spot-backdrop').addEventListener('pointerdown', function () { spotClose(true); });
    spotInput.addEventListener('input', spotRender);
    spot.addEventListener('keydown', function (e) {
      var n = spotShown.length;
      if (e.key === 'ArrowDown' && n) { e.preventDefault(); spotSelect((spotActive + 1) % n); }
      else if (e.key === 'ArrowUp' && n) { e.preventDefault(); spotSelect((spotActive - 1 + n) % n); }
      else if (e.key === 'Enter') { e.preventDefault(); if (spotShown[spotActive]) spotRun(spotShown[spotActive]); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); spotClose(true); }
      else if (e.key === 'Tab') e.preventDefault();
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        if (isPhone() || os.hidden || !lock.hidden) return;
        e.preventDefault();
        if (spot.hidden) spotOpen(); else spotClose(true);
      }
    });
  }

  /* Dock qui grossit au survol (souris seulement, coupé si les animations sont réduites).
     Chaque icône est mise à l'échelle par transform et décalée pour rester centrée : la mise en page ne bouge pas. */
  function initDockMagnify() {
    var items = Array.prototype.slice.call(dock.querySelectorAll('.dock-item'));
    var frame = 0, lastX = 0;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    var MAX = 0.55, RADIUS = 112;

    function reset() {
      dock.classList.remove('mag');
      items.forEach(function (it) { it.style.removeProperty('--mag'); it.style.removeProperty('--tx'); });
    }
    function apply() {
      frame = 0;
      var left = dock.getBoundingClientRect().left + dock.clientLeft;
      var extras = items.map(function (it) {
        var center = left + it.offsetLeft + it.offsetWidth / 2;
        var t = Math.max(0, 1 - Math.abs(lastX - center) / RADIUS);
        var scale = 1 + MAX * (t * t * (3 - 2 * t));
        return { it: it, scale: scale, extra: (scale - 1) * it.offsetWidth };
      });
      var total = extras.reduce(function (n, e) { return n + e.extra; }, 0);
      var before = 0;
      extras.forEach(function (e) {
        e.it.style.setProperty('--mag', e.scale.toFixed(3));
        e.it.style.setProperty('--tx', (before + e.extra / 2 - total / 2).toFixed(1) + 'px');
        before += e.extra;
      });
    }
    dock.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || isPhone() || reduced.matches || !fine.matches) return;
      dock.classList.add('mag');
      lastX = e.clientX;
      if (!frame) frame = requestAnimationFrame(apply);
    });
    dock.addEventListener('pointerleave', function () {
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      reset();
    });
  }

  /* Plein écran : proposé, jamais imposé (Échap en sort). Caché si le navigateur ne le permet pas. */
  function initFullscreen() {
    var buttons = os.querySelectorAll('[data-action="fullscreen"]');
    if (!document.fullscreenEnabled || !root.requestFullscreen) return;
    function sync() {
      var on = !!document.fullscreenElement;
      Array.prototype.forEach.call(buttons, function (b) {
        b.hidden = false;
        b.textContent = on ? 'Quitter le plein écran' : 'Plein écran';
        b.setAttribute(b.getAttribute('role') === 'menuitemcheckbox' ? 'aria-checked' : 'aria-pressed', on ? 'true' : 'false');
      });
    }
    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener('click', function () {
        var p = document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen();
        if (p && p.catch) p.catch(function () {});
      });
    });
    document.addEventListener('fullscreenchange', sync);
    sync();
  }

  function init() {
    if (ready) return;
    ready = true;
    buildHome();
    tick();
    setInterval(tick, 15000);
    syncTheme();

    enterBtn.addEventListener('click', function () { unlock(); });
    Array.prototype.forEach.call(os.querySelectorAll('.notif'), function (b) {
      b.addEventListener('click', function () { opener = null; unlock(b.getAttribute('data-app')); });
    });
    Array.prototype.forEach.call(desktop.querySelectorAll('button[data-app]'), function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-app');
        opener = b;
        if (!isPhone() && openWins[id] && openWins[id].classList.contains('active')) closeApp(id, false);
        else openApp(id);
      });
    });

    homeInd.addEventListener('click', goHome);
    var ix, iy;
    homeInd.addEventListener('touchstart', function (e) { ix = e.touches[0].clientX; iy = e.touches[0].clientY; }, { passive: true });
    homeInd.addEventListener('touchend', function (e) {
      if (iy === undefined) return;
      var dx = e.changedTouches[0].clientX - ix;
      var dy = e.changedTouches[0].clientY - iy;
      iy = undefined;
      if (OsUtils.isSwipeUp(dx, dy, 40)) goHome();
    }, { passive: true });

    // Glisser vers le haut pour déverrouiller (jamais obligatoire : « Entrer » reste là)
    var sx, sy;
    lock.addEventListener('touchstart', function (e) {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    lock.addEventListener('touchend', function (e) {
      if (!isPhone() || sy === undefined) return;
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      sy = undefined;
      if (OsUtils.isSwipeUp(dx, dy)) { opener = null; unlock(); }
    }, { passive: true });
    Array.prototype.forEach.call(os.querySelectorAll('[data-action="classic"]'), function (b) {
      b.addEventListener('click', function () { store('mode', 'classic'); disable(true); });
    });
    initFullscreen();
    initDockMagnify();
    initMenus();
    initSpot();
    document.getElementById('os-lock').addEventListener('click', showLock);
    themeBtn.addEventListener('click', function () {
      document.getElementById('theme-toggle').click();
      syncTheme();
    });
  }

  function enable() {
    closeAll();
    root.classList.add('os-mode');
    root.classList.toggle('phone-mode', !mq.matches);
    os.hidden = false;
    init();
    syncTheme();
    showLock();
  }

  function disable(focusMain) {
    closeMenus(false);
    spotClose(false);
    closeAll();
    root.classList.remove('os-mode', 'phone-mode');
    os.hidden = true;
    if (focusMain) {
      var main = document.getElementById('contenu');
      if (main) main.focus();
    }
  }

  function syncSwitch() {
    if (toOs) toOs.textContent = mq.matches ? 'Mode bureau' : 'Mode téléphone';
  }

  if (toOs) toOs.addEventListener('click', function () { store('mode', 'os'); enable(); });

  // Changement de taille (rotation, zoom) : on bascule entre bureau et téléphone sans toucher au choix « classique »
  mq.addEventListener('change', function () {
    syncSwitch();
    if (store('mode') === 'classic') return;
    if (!root.classList.contains('os-mode') || isPhone() === mq.matches) enable();
  });

  syncSwitch();
  if (root.classList.contains('os-mode')) enable();
  else root.classList.remove('phone-mode');
})();
