(function () {
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  var label = document.getElementById('theme-label');

  function systemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function read() {
    try { return localStorage.getItem('theme'); } catch { return null; }
  }

  function save(value) {
    try { localStorage.setItem('theme', value); } catch { /* stockage indisponible */ }
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    if (toggle) {
      toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      label.textContent = theme === 'dark' ? 'Thème clair' : 'Thème sombre';
    }
  }

  apply(read() || systemTheme());

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      save(next);
    });
  }

  var year = document.getElementById('annee');
  if (year) year.textContent = new Date().getFullYear();

  // Marque le lien de navigation de la section visible (aria-current)
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-list a'));
  if ('IntersectionObserver' in window && links.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    links.forEach(function (a) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) observer.observe(target);
    });
  }
})();
