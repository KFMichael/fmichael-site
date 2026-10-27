// Comportement du mode bureau et bascule entre bureau et téléphone.
const test = require('node:test');
const assert = require('node:assert/strict');
const { startSite, DESKTOP } = require('../helpers/site.js');

let site;
test.before(async () => { site = await startSite(); });
test.after(async () => { await site.close(); });

const classes = (page) => page.evaluate(() => document.documentElement.className);

test('bureau : une fenêtre s\'ouvre depuis le dock, Échap la ferme et rend le focus au dock', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  assert.equal(await classes(page), 'os-mode');
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
  await page.click('.dock [data-app=travail]');
  assert.equal(await page.locator('.win .light').count(), 2, 'boutons de fenêtre (fermer, agrandir)');
  assert.ok((await page.locator('.win article.card').count()) >= 4, 'le contenu complet, pas une liste');
  assert.ok((await page.locator('.win article.card .when').count()) >= 4, 'chaque réalisation affiche sa période');
  await page.keyboard.press('Escape');
  await page.waitForSelector('.win', { state: 'detached' });
  assert.equal(await page.evaluate(() => document.activeElement.dataset.app), 'travail');
  await ctx.close();
});

test('bascule : le mode suit la taille de l\'écran (rotation, zoom 200 %)', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  assert.equal(await classes(page), 'os-mode');
  await page.setViewportSize({ width: 720, height: 450 }); // équivalent d'un zoom à 200 % sur 1440 px
  await page.waitForFunction(() => document.documentElement.classList.contains('phone-mode'));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForFunction(() => !document.documentElement.classList.contains('phone-mode'));
  assert.equal(await classes(page), 'os-mode');
  await ctx.close();
});

test('version classique : mémorisée, et la page classique n\'est pas masquée', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  await page.click('#enter');
  await page.click('.menubar [data-action=classic]');
  assert.equal(await classes(page), '');
  assert.equal(await page.locator('main').isVisible(), true);
  await page.reload();
  assert.equal(await classes(page), '', 'le choix survit au rechargement');
  await ctx.close();
});

test('glass (bureau) : les fenêtres sont en verre dépoli', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
  await page.click('.dock [data-app=parcours]');
  const blur = await page.evaluate(() => getComputedStyle(document.querySelector('.win')).backdropFilter);
  assert.notEqual(blur, 'none', 'flou du verre');
  const bg = await page.evaluate(() => getComputedStyle(document.querySelector('.win')).backgroundColor);
  const alpha = Number((bg.match(/\/\s*([\d.]+)\)$/) || bg.match(/,\s*([\d.]+)\)$/) || [])[1]);
  assert.ok(alpha > 0 && alpha < 1, 'fond semi-transparent, pas opaque : ' + bg);
  await ctx.close();
});

test('hobbies : la carte Vibecoding propose les deux projets', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
  await page.click('.dock [data-app=hobbies]');
  const links = await page.$$eval('.win .hobby-code a', (as) => as.map((a) => [a.textContent.replace('↗', '').replace("(s'ouvre dans un nouvel onglet)", '').trim(), a.href]));
  assert.deepEqual(links, [
    ['Apprendre à jouer aux échecs', 'https://echecs.fmichael.cloud/'],
    ['Apprendre à gérer son budget', 'https://monpatrimoine.fmichael.cloud/'],
  ]);
  const attrs = await page.$$eval('.win .hobby-code a', (as) => as.map((a) => [a.target, a.rel, a.textContent.includes('nouvel onglet')]));
  assert.deepEqual(attrs, [['_blank', 'noopener', true], ['_blank', 'noopener', true]], 'nouvel onglet, noopener, et annoncé dans le nom du lien');
  await ctx.close();
});
