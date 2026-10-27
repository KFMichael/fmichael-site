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

test('contact (page classique) : mission longue, projets courts et lien de rendez-vous', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem('mode', 'classic'));
  await page.goto(site.base);
  const text = await page.locator('#contact').innerText();
  assert.match(text, /mission longue/);
  assert.match(text, /courte durée/);
  const [href, target, rel] = await page.$eval('#contact a.button', (a) => [a.href, a.target, a.rel]);
  assert.deepEqual([href, target, rel], ['https://calendly.com/kangahmichael/new-meeting', '_blank', 'noopener']);
  await ctx.close();
});

test('bureau : le widget Vibecoding est en verre, avec les deux projets, et il passe derrière les fenêtres', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
  const w = page.locator('.desk-widget[aria-label="Vibecoding"]');
  assert.equal(await w.isVisible(), true);
  assert.notEqual(await w.evaluate((el) => getComputedStyle(el).backdropFilter), 'none', 'flou du verre');
  const links = await w.locator('a').evaluateAll((as) => as.map((a) => [a.href, a.target, a.rel]));
  assert.deepEqual(links, [
    ['https://echecs.fmichael.cloud/', '_blank', 'noopener'],
    ['https://monpatrimoine.fmichael.cloud/', '_blank', 'noopener'],
  ]);
  await page.click('.dock [data-app=hobbies]');
  const winOnTop = await page.evaluate(() => {
    const r = document.querySelector('.win').getBoundingClientRect();
    const w2 = document.querySelector('.desk-widgets').getBoundingClientRect();
    const x = Math.max(r.left, w2.left) + 5, y = Math.max(r.top, w2.top) + 5;
    const overlap = r.left < w2.right && r.right > w2.left && r.top < w2.bottom && r.bottom > w2.top;
    return !overlap || !!document.elementFromPoint(x, y).closest('.win');
  });
  assert.equal(winOnTop, true, 'une fenêtre ouverte recouvre le widget');
  await ctx.close();
});

test('hobbies : la carte Vibecoding est la première (page classique)', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem('mode', 'classic'));
  await page.goto(site.base);
  assert.equal(await page.locator('.hobbies > li').first().getAttribute('class'), 'hobby hobby-code');
  await ctx.close();
});

test('bureau : le widget Disponibilité affiche le statut et le lien de rendez-vous', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
  const w = page.locator('.desk-widget[aria-label="Disponibilité"]');
  assert.equal(await w.isVisible(), true);
  assert.match(await w.innerText(), /mission longue, disponible pour des projets de courte durée/);
  const [href, target, rel, name] = await w.locator('a').evaluate((a) => [a.href, a.target, a.rel, a.textContent]);
  assert.deepEqual([href, target, rel], ['https://calendly.com/kangahmichael/new-meeting', '_blank', 'noopener']);
  assert.match(name, /nouvel onglet/);
  await ctx.close();
});

test('accueil (page classique) : bouton de rendez-vous visible, puis « Me contacter »', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem('mode', 'classic'));
  await page.goto(site.base);
  const links = await page.$$eval('.hero-actions a', (as) => as.map((a) => [a.getAttribute('href'), a.target, a.rel]));
  assert.deepEqual(links, [
    ['https://calendly.com/kangahmichael/new-meeting', '_blank', 'noopener'],
    ['#contact', '', ''],
  ]);
  const box = await page.locator('.hero-actions a').first().boundingBox();
  assert.ok(box.y + box.height < 900, 'visible sans défiler à 1440×900');
  await ctx.close();
});

test('partage : titre, description, image absolue et adresse canonique', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  const meta = (sel) => page.$eval(sel, (m) => m.getAttribute('content') || m.getAttribute('href'));
  assert.equal(await meta('link[rel=canonical]'), 'https://fmichael.cloud/');
  assert.equal(await meta('meta[property="og:image"]'), 'https://fmichael.cloud/img/share.png');
  assert.equal(await meta('meta[property="og:title"]'), await page.title());
  assert.equal(await meta('meta[property="og:description"]'), await meta('meta[name=description]'));
  assert.ok((await meta('meta[property="og:image:alt"]')).length > 10, 'texte alternatif de l\'image de partage');
  assert.equal(await meta('meta[name="twitter:card"]'), 'summary_large_image');
  await ctx.close();
});

test('404 : message clair, retour à l\'accueil, non indexée', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base + '404.html');
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.$eval('meta[name=robots]', (m) => m.content), 'noindex');
  assert.equal(await page.$eval('main a.button', (a) => a.getAttribute('href')), '/');
  assert.notEqual(await page.$eval('main', (el) => getComputedStyle(el).backdropFilter), 'none', 'verre dépoli');
  await ctx.close();
});

test('notifications : elles arrivent une à une, une seule fois, en moins de 5 s, sans bouger la mise en page', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  const box = () => page.locator('.notifs').boundingBox();
  const before = await box();
  const timings = await page.evaluate(() => document.getAnimations()
    .filter((a) => a.effect.target.closest && a.effect.target.closest('.notifs'))
    .map((a) => { const t = a.effect.getComputedTiming(); return [t.delay, t.iterations, t.endTime]; }));
  assert.deepEqual(timings.map((t) => t[0]), [600, 1700, 2800], 'une notification toutes les 1,1 s');
  assert.ok(timings.every((t) => t[1] === 1), 'une seule fois, pas de boucle');
  assert.ok(Math.max(...timings.map((t) => t[2])) < 5000, 'moins de 5 s au total');
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'));
  const after = await box();
  assert.deepEqual([after.y, after.height], [before.y, before.height], 'la liste ne bouge pas quand les notifications arrivent');
  await ctx.close();
});

test('notifications : tout est visible tout de suite avec mouvement réduit', async () => {
  const ctx = await site.browser.newContext({ ...DESKTOP, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(site.base);
  const n = await page.evaluate(() => document.getAnimations().filter((a) => a.effect.target.closest && a.effect.target.closest('.notifs')).length);
  assert.equal(n, 0);
  const opacities = await page.$$eval('.notifs li', (els) => els.map((el) => getComputedStyle(el).opacity));
  assert.deepEqual(opacities, ['1', '1', '1']);
  await ctx.close();
});

test('fonds : emplacements des photos (voile et photo) pris en compte, bureau et écran verrouillé', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  await page.addStyleTag({ content: '#os { --lock-photo: linear-gradient(rgb(255, 0, 0), rgb(0, 0, 255)); --lock-veil: linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)); --desk-photo: linear-gradient(rgb(0, 255, 0), rgb(0, 0, 255)); --desk-veil: linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)); }' });
  const bg = (sel) => page.$eval(sel, (el) => getComputedStyle(el).backgroundImage);
  const lock = await bg('#lock');
  assert.ok(lock.indexOf('rgba(0, 0, 0, 0.55)') < lock.indexOf('rgb(255, 0, 0)'), 'le voile est au-dessus de la photo (verrouillage)');
  const desk = await bg('#desktop');
  assert.ok(desk.indexOf('rgba(0, 0, 0, 0.55)') < desk.indexOf('rgb(0, 255, 0)'), 'le voile est au-dessus de la photo (bureau)');
  await ctx.close();
});

test('plein écran : proposé (jamais automatique) sur l\'écran verrouillé et dans la barre de menus', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  assert.equal(await page.evaluate(() => !!document.fullscreenElement), false, 'pas de plein écran imposé');
  if (!(await page.evaluate(() => document.fullscreenEnabled))) { await ctx.close(); return; }
  const btn = page.locator('#lock [data-action=fullscreen]');
  assert.equal(await btn.isVisible(), true);
  assert.equal(await btn.getAttribute('aria-pressed'), 'false');
  await btn.click();
  await page.waitForFunction(() => !!document.fullscreenElement, null, { timeout: 3000 }).catch(() => {});
  const on = await page.evaluate(() => !!document.fullscreenElement);
  assert.equal(await btn.textContent(), on ? 'Quitter le plein écran' : 'Plein écran');
  await ctx.close();
});

test('bureau : la photo cadrée est visible à 1440 px et masquée en dessous de 1100 px', async () => {
  let ctx = await site.browser.newContext(DESKTOP);
  let page = await ctx.newPage();
  await page.goto(site.base);
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
  assert.equal(await page.locator('.desk-photo').isVisible(), true);
  const photo = await page.locator('.desk-photo').boundingBox();
  assert.ok(photo.height < 300 && photo.width < 200, 'la photo reste un petit cadre (' + Math.round(photo.width) + '×' + Math.round(photo.height) + ')');
  await ctx.close();
  ctx = await site.browser.newContext({ viewport: { width: 1000, height: 700 } });
  page = await ctx.newPage();
  await page.goto(site.base);
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
  assert.equal(await page.locator('.desk-photo').isVisible(), false);
  await ctx.close();
});
