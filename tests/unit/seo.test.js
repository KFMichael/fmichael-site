// Cohérence des fichiers pour les moteurs de recherche : adresse canonique, plan du site, robots, page 404.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const index = read('index.html');
const canonical = index.match(/<link rel="canonical" href="([^"]+)"/)[1];

const express = read('express.html');
const expressCanonical = express.match(/<link rel="canonical" href="([^"]+)"/)[1];

test('sitemap.xml : l\'accueil (canonique, en HTTPS et avec « / » final) et la version express', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs, [canonical, expressCanonical]);
  assert.match(canonical, /^https:\/\/fmichael\.cloud\/$/);
  assert.equal(expressCanonical, 'https://fmichael.cloud/express');
});

test('version express : indexable, une seule page de plus, mêmes outils et mêmes chiffres que le site complet', () => {
  assert.doesNotMatch(express, /<meta name="robots"[^>]*noindex/);
  assert.match(express, /<html lang="fr">/);
  assert.equal((express.match(/<h1[ >]/g) || []).length, 1);
  assert.match(express, /<meta property="og:url" content="https:\/\/fmichael\.cloud\/express">/);
  const tools = (html) => [...html.matchAll(/<ul class="tags">(.*?)<\/ul>/g)].map((m) => m[1]).filter((t) => /Jira|Claude|Shopify|WebViews/.test(t)).join('').match(/<li>[^<]+<\/li>/g);
  assert.deepEqual(tools(express), tools(index), 'mêmes outils dans la version express et dans le site complet');
  assert.deepEqual(tools(express), ['<li>Jira</li>', '<li>Confluence</li>', '<li>Trello</li>', '<li>Claude</li>', '<li>Shopify</li>', '<li>Salesforce</li>', '<li>WebViews</li>', '<li>Moteurs de personnalisation 3D (Threekit)</li>']);
  for (const figure of ['11 ans', '6 ans', '<dd>5</dd>', '<dd>4</dd>']) assert.ok(express.includes(figure), figure);
  assert.match(index, /11 ans entre équipes métier et équipes tech, dont 6 chez Louis Vuitton/);
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
