// Cohérence des fichiers pour les moteurs de recherche : adresse canonique, plan du site, robots, page 404.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const index = read('index.html');
const canonical = index.match(/<link rel="canonical" href="([^"]+)"/)[1];

test('sitemap.xml : une seule adresse, celle de la page canonique, en HTTPS et avec « / » final', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs, [canonical]);
  assert.match(canonical, /^https:\/\/fmichael\.cloud\/$/);
});

test('robots.txt : tout est autorisé et le plan du site est annoncé', () => {
  const robots = read('robots.txt');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.doesNotMatch(robots, /^Disallow: \/\s*$/m, 'le site ne se bloque pas lui-même');
  assert.match(robots, /^Sitemap: https:\/\/fmichael\.cloud\/sitemap\.xml$/m);
});

test('indexation : la page d\'accueil est indexable, la 404 ne l\'est pas', () => {
  assert.doesNotMatch(index, /<meta name="robots"[^>]*noindex/);
  assert.match(read('404.html'), /<meta name="robots" content="noindex">/);
});

test('le domaine du CNAME est celui de l\'adresse canonique', () => {
  assert.equal('https://' + read('CNAME').trim() + '/', canonical);
});
