const test = require('node:test');
const assert = require('node:assert/strict');
const { clockParts, isSwipeUp, isEdgeSwipeBack, rowSummary, labelHtml, normalize, searchEntries } = require('../../js/utils.js');

// Lundi 26 octobre 2026, 22 h 44 (heure locale)
const monday = new Date(2026, 9, 26, 22, 44);

test('clockParts : date et heure en français', () => {
  const c = clockParts(monday);
  assert.equal(c.date, 'lundi 26 octobre');
  assert.equal(c.weekday, 'lundi');
  assert.equal(c.month, 'octobre');
  assert.equal(c.day, 26);
  assert.match(c.time, /^22[:h]44$/);
});

test('clockParts : jour abrégé sur 3 lettres majuscules, sans point', () => {
  assert.equal(clockParts(monday).dow, 'LUN');
  assert.equal(clockParts(new Date(2026, 9, 28)).dow, 'MER');
  assert.equal(clockParts(new Date(2026, 9, 31)).dow, 'SAM');
});

test('clockParts : le jour suit la vraie date (plus de « 26 » écrit en dur)', () => {
  assert.equal(clockParts(new Date(2027, 0, 5)).day, 5);
});

test('isSwipeUp : un long geste vertical vers le haut déverrouille', () => {
  assert.equal(isSwipeUp(5, -200), true);
  assert.equal(isSwipeUp(-30, -120), true);
});

test('isSwipeUp : trop court, vers le bas ou en diagonale ne déverrouille pas', () => {
  assert.equal(isSwipeUp(0, -40), false);
  assert.equal(isSwipeUp(0, 200), false);
  assert.equal(isSwipeUp(150, -160), false);
});

test('labelHtml : libellé simple', () => {
  assert.equal(labelHtml('Contact'), '<span class="home-label">Contact</span>');
});

test('labelHtml : version courte visible, nom complet gardé pour les lecteurs d\'écran', () => {
  const html = labelHtml('Disponibilité', 'Dispo');
  assert.match(html, /aria-hidden="true">Dispo</);
  assert.match(html, /class="visually-hidden">Disponibilité</);
});

test('isSwipeUp : le seuil est réglable (barre « accueil » : 40 px)', () => {
  assert.equal(isSwipeUp(0, -50), false);
  assert.equal(isSwipeUp(0, -50, 40), true);
});

test('isEdgeSwipeBack : depuis le bord gauche, vers la droite, plutôt horizontal', () => {
  assert.equal(isEdgeSwipeBack(8, 150, 20), true);
  assert.equal(isEdgeSwipeBack(100, 150, 20), false, 'ne part pas du bord');
  assert.equal(isEdgeSwipeBack(8, 40, 0), false, 'trop court');
  assert.equal(isEdgeSwipeBack(8, 100, 90), false, 'trop en diagonale');
});

test('rowSummary : première phrase du contexte, sans « Contexte. »', () => {
  assert.equal(rowSummary('Contexte. Deux sites à fort trafic, en micro-services. Autre phrase.'), 'Deux sites à fort trafic, en micro-services.');
});

test('rowSummary : texte long tronqué avec une ellipse', () => {
  const s = rowSummary('Contexte. ' + 'mot '.repeat(40) + '.');
  assert.ok(s.length <= 90);
  assert.ok(s.endsWith('…'));
});

test('rowSummary : le point d\'un nom de domaine ne coupe pas la phrase', () => {
  assert.equal(rowSummary('Contexte. Sites sur louisvuitton.com, en ligne. Autre phrase.'), 'Sites sur louisvuitton.com, en ligne.');
});

const entries = [
  { label: 'Parcours', hint: 'CV, expériences', keywords: 'formation louis vuitton' },
  { label: 'Réalisations', hint: 'Études de cas', keywords: 'shopify boutiques' },
  { label: 'Hobbies', hint: 'Vibecoding, tennis', keywords: 'échecs budget football' },
  { label: 'Prendre rendez-vous', hint: 'Calendly', keywords: 'disponibilité' },
  { label: 'Apprendre à jouer aux échecs', hint: 'Vibecoding', keywords: '' }
];
const labels = (q) => searchEntries(q, entries).map((e) => e.label);

test('normalize : sans accents, sans majuscules, espaces simples', () => {
  assert.equal(normalize('  Réalisations   ÉCHECS '), 'realisations echecs');
});

test('searchEntries : sans saisie, tout, dans l\'ordre (et sans modifier la liste)', () => {
  const out = searchEntries('  ', entries);
  assert.deepEqual(out, entries);
  assert.notEqual(out, entries);
});

test('searchEntries : ignore accents et majuscules, cherche dans les mots-clés', () => {
  assert.deepEqual(labels('realisation'), ['Réalisations']);
  assert.deepEqual(labels('SHOPIFY'), ['Réalisations']);
  assert.deepEqual(labels('louis vuitton'), ['Parcours']);
});

test('searchEntries : un libellé qui commence par le mot passe avant un simple mot-clé', () => {
  assert.deepEqual(labels('echecs'), ['Apprendre à jouer aux échecs', 'Hobbies']);
  assert.deepEqual(labels('vibecoding'), ['Hobbies', 'Apprendre à jouer aux échecs']);
});

test('searchEntries : tous les mots doivent correspondre, aucun résultat sinon', () => {
  assert.deepEqual(labels('rendez calendly'), ['Prendre rendez-vous']);
  assert.deepEqual(labels('shopify tennis'), []);
  assert.deepEqual(labels('zzz'), []);
});
