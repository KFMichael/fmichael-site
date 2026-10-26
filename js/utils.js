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

  // Glisser vers le haut pour déverrouiller : assez long et plutôt vertical
  function isSwipeUp(dx, dy) {
    return dy < -80 && Math.abs(dx) < Math.abs(dy) / 2;
  }

  // Libellé d'icône : version courte visible, nom complet pour les lecteurs d'écran
  function labelHtml(label, short) {
    if (!short) return '<span class="home-label">' + label + '</span>';
    return '<span class="home-label" aria-hidden="true">' + short + '</span><span class="visually-hidden">' + label + '</span>';
  }

  return { clockParts: clockParts, isSwipeUp: isSwipeUp, labelHtml: labelHtml };
});
