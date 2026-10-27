/* Fonctions pures du mode bureau / téléphone, sans accès à la page : testables avec `npm test`. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OsUtils = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function fmt(options, date) {
    return new Intl.DateTimeFormat('fr-FR', options).format(date);
  }

  // Textes de date et d'heure affichés sur l'écran verrouillé, la barre et les widgets
  function clockParts(now) {
    return {
      date: fmt({ weekday: 'long', day: 'numeric', month: 'long' }, now),
      time: fmt({ hour: '2-digit', minute: '2-digit' }, now),
      short: fmt({ weekday: 'short', day: 'numeric', month: 'short' }, now),
      weekday: fmt({ weekday: 'long' }, now),
      month: fmt({ month: 'long' }, now),
      dow: fmt({ weekday: 'short' }, now).replace('.', '').slice(0, 3).toUpperCase(),
      day: now.getDate()
    };
  }

  // Glisser vers le haut (déverrouiller, revenir à l'accueil) : assez long et plutôt vertical
  function isSwipeUp(dx, dy, min) {
    return dy < -(min || 80) && Math.abs(dx) < Math.abs(dy) / 2;
  }

  // Retour par un glissement depuis le bord gauche de l'écran, comme dans une pile de navigation iOS
  function isEdgeSwipeBack(startX, dx, dy) {
    return startX <= 24 && dx > 70 && Math.abs(dy) < dx / 2;
  }

  // Sous-titre d'une ligne de liste : première phrase du contexte, sans le mot « Contexte. », tronquée
  function rowSummary(text) {
    var t = String(text).replace(/^\s*Contexte\.\s*/, '').trim();
    var m = t.match(/^.*?\.(?=\s|$)/); // fin de phrase = point suivi d'une espace (pas le point d'un nom de domaine)
    var s = m ? m[0] : t;
    return s.length > 90 ? s.slice(0, 87).trimEnd() + '…' : s;
  }

  // Libellé d'icône : version courte visible, nom complet pour les lecteurs d'écran
  function labelHtml(label, short) {
    if (!short) return '<span class="home-label">' + label + '</span>';
    return '<span class="home-label" aria-hidden="true">' + short + '</span><span class="visually-hidden">' + label + '</span>';
  }

  // Texte comparable : minuscules, sans accents, espaces simples
  function normalize(text) {
    return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  // Recherche dans les entrées {label, hint, keywords} : tous les mots saisis doivent se trouver
  // dans le libellé, l'indice ou les mots-clés. Classement : libellé qui commence par le mot, puis libellé qui le
  // contient, puis le reste ; à égalité, l'ordre d'origine. Sans saisie : toutes les entrées, dans l'ordre.
  function searchEntries(query, entries) {
    var tokens = normalize(query).split(' ').filter(Boolean);
    if (!tokens.length) return entries.slice();
    var scored = [];
    entries.forEach(function (entry, index) {
      var label = normalize(entry.label);
      var rest = normalize((entry.hint || '') + ' ' + (entry.keywords || ''));
      var score = 0;
      for (var i = 0; i < tokens.length; i++) {
        var t = tokens[i];
        if (label.split(' ').some(function (w) { return w.indexOf(t) === 0; })) score += 0;
        else if (label.indexOf(t) !== -1) score += 1;
        else if (rest.indexOf(t) !== -1) score += 2;
        else return;
      }
      scored.push({ entry: entry, score: score, index: index });
    });
    scored.sort(function (a, b) { return a.score - b.score || a.index - b.index; });
    return scored.map(function (r) { return r.entry; });
  }

  return { normalize: normalize, searchEntries: searchEntries, clockParts: clockParts, isSwipeUp: isSwipeUp, isEdgeSwipeBack: isEdgeSwipeBack, rowSummary: rowSummary, labelHtml: labelHtml };
});
