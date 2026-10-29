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
  assert.equal(await page.locator('.win .light').count(), 3, 'boutons de fenêtre (fermer, réduire, agrandir)');
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
  await page.click('#mb-brand-btn');
  await page.click('#menu-brand [data-action=classic]');
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
  // Le navigateur change l'état du plein écran, puis déclenche `fullscreenchange` : on attend que le texte du bouton suive l'état.
  await page.waitForFunction(() => {
    const b = document.querySelector('#lock [data-action=fullscreen]');
    return b.textContent === (document.fullscreenElement ? 'Quitter le plein écran' : 'Plein écran');
  }, null, { timeout: 3000 });
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

async function enterDesktop(page) {
  await page.goto(site.base);
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
}

test('réduire : la fenêtre part dans le dock (point), l\'icône la rouvre, focus et étiquettes cohérents', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await enterDesktop(page);
  await page.click('.dock [data-app=parcours]');
  assert.equal(await page.getAttribute('.win .light.min', 'aria-label'), 'Réduire la fenêtre Parcours');
  assert.equal(await page.locator('.mb-app').textContent(), 'Pages');
  await page.click('.win .light.min');
  await page.waitForSelector('.win.minimized', { state: 'attached' });
  assert.equal(await page.locator('.win').isVisible(), false, 'la fenêtre est cachée');
  const btn = page.locator('.dock [data-app=parcours]');
  assert.equal(await btn.getAttribute('aria-expanded'), 'false');
  assert.equal(await btn.getAttribute('data-min'), 'true');
  const dot = await btn.evaluate((el) => getComputedStyle(el, '::after').content);
  assert.notEqual(dot, 'none', 'le point reste sous l\'icône');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.app), 'parcours', 'le focus revient au dock');
  assert.equal(await page.locator('.mb-app').textContent(), 'Finder', 'plus de fenêtre active');
  assert.equal(await page.locator('.win').count(), 1, 'la fenêtre n\'est pas fermée');
  await btn.click();
  await page.waitForFunction(() => document.querySelector('.win') && !document.querySelector('.win').classList.contains('minimized'));
  assert.equal(await page.locator('.win').isVisible(), true);
  assert.equal(await btn.getAttribute('aria-expanded'), 'true');
  assert.equal(await btn.getAttribute('data-min'), null);
  assert.equal(await page.locator('.mb-app').textContent(), 'Pages');
  await ctx.close();
});

test('réduire : atteignable au clavier, la fenêtre suivante devient active', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await enterDesktop(page);
  await page.click('.dock [data-app=parcours]');
  await page.click('.dock [data-app=hobbies]');
  assert.equal(await page.locator('.mb-app').textContent(), 'Photos');
  await page.focus('.win[data-app=hobbies] .light.min');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.win[data-app=hobbies].minimized', { state: 'attached' });
  assert.equal(await page.locator('.mb-app').textContent(), 'Pages', 'la fenêtre visible reprend la main');
  await ctx.close();
});

test('double-clic sur la barre de titre : agrandit puis restaure (jamais sur un bouton)', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await enterDesktop(page);
  await page.click('.dock [data-app=travail]');
  const win = page.locator('.win');
  await page.dblclick('.win .win-title');
  assert.equal(await win.evaluate((el) => el.classList.contains('max')), true);
  assert.equal(await page.getAttribute('.win .light.zoom', 'aria-pressed'), 'true');
  await page.dblclick('.win .win-title');
  assert.equal(await win.evaluate((el) => el.classList.contains('max')), false);
  await page.dblclick('.win .light.min').catch(() => {});
  assert.equal(await win.evaluate((el) => el.classList.contains('max')), false, 'un double-clic sur un bouton n\'agrandit pas');
  await ctx.close();
});

test('dock : les icônes grossissent près de la souris, sans bouger la mise en page', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await enterDesktop(page);
  const dock = page.locator('.dock');
  const before = await dock.boundingBox();
  const items = page.locator('.dock .dock-item');
  const first = await items.first().boundingBox();
  await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
  await page.mouse.move(first.x + first.width / 2 + 1, first.y + first.height / 2);
  await page.waitForFunction(() => document.querySelector('.dock').classList.contains('mag'));
  const scale = (i) => items.nth(i).evaluate((el) => parseFloat(el.style.getPropertyValue('--mag')));
  const near = await scale(0);
  const far = await scale(6);
  assert.ok(near > 1.4, 'l\'icône sous la souris grossit (' + near + ')');
  assert.equal(far, 1, 'une icône éloignée ne bouge pas');
  const after = await dock.boundingBox();
  assert.deepEqual([after.x, after.y, after.width, after.height], [before.x, before.y, before.width, before.height], 'la mise en page ne bouge pas');
  await page.mouse.move(700, 300);
  await page.waitForFunction(() => !document.querySelector('.dock').classList.contains('mag'));
  assert.equal(await items.first().evaluate((el) => el.style.getPropertyValue('--mag')), '', 'tout revient à la taille normale');
  await ctx.close();
});

test('dock : pas de grossissement avec mouvement réduit', async () => {
  const ctx = await site.browser.newContext({ ...DESKTOP, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await enterDesktop(page);
  const first = await page.locator('.dock .dock-item').first().boundingBox();
  await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
  await page.mouse.move(first.x + first.width / 2 + 2, first.y + first.height / 2);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => document.querySelector('.dock').classList.contains('mag')), false);
  await ctx.close();
});

test('menus : le menu à ton nom s\'ouvre au clavier, flèches / Début / Fin / Échap, focus rendu au bouton', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await enterDesktop(page);
  const trigger = page.locator('#mb-brand-btn');
  assert.equal(await trigger.getAttribute('aria-haspopup'), 'menu');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('#menu-brand').isVisible(), false);
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  const focused = () => page.evaluate(() => document.activeElement.textContent.trim());
  assert.equal(await focused(), 'À propos de ce site');
  await page.keyboard.press('ArrowDown');
  assert.equal(await focused(), 'Verrouiller l\'écran');
  await page.keyboard.press('ArrowDown');
  assert.equal(await focused(), 'Thème sombre');
  await page.keyboard.press('End');
  assert.equal(await focused(), 'Version classique');
  await page.keyboard.press('ArrowDown');
  assert.equal(await focused(), 'À propos de ce site', 'la navigation boucle');
  await page.keyboard.press('Home');
  assert.equal(await focused(), 'À propos de ce site');
  await page.keyboard.press('Escape');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'mb-brand-btn', 'le focus revient au bouton du menu');
  await ctx.close();
});

test('menus : thème, verrouillage et version classique depuis le menu', async () => {
  const ctx = await site.browser.newContext({ ...DESKTOP, colorScheme: 'light' });
  const page = await ctx.newPage();
  await enterDesktop(page);
  await page.click('#mb-brand-btn');
  assert.equal(await page.getAttribute('#os-theme', 'aria-checked'), 'false');
  await page.click('#os-theme');
  assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-theme')), 'dark');
  assert.equal(await page.locator('#menu-brand').isVisible(), false, 'le menu se ferme après l\'action');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'mb-brand-btn', 'focus rendu au bouton du menu');
  await page.click('#mb-brand-btn');
  assert.equal(await page.getAttribute('#os-theme', 'aria-checked'), 'true');
  assert.equal(await page.textContent('#os-theme'), 'Thème clair');
  await page.click('#os-lock');
  await page.waitForSelector('#lock', { state: 'visible' });
  assert.equal(await page.evaluate(() => document.activeElement.id), 'enter', 'le verrouillage garde le focus sur « Entrer »');
  await ctx.close();
});

test('menu Fenêtre : désactivé sans fenêtre, puis réduire, agrandir et fermer la fenêtre active', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await enterDesktop(page);
  await page.click('#mb-win-btn');
  assert.equal(await page.getAttribute('#mw-close', 'aria-disabled'), 'true');
  await page.click('#mw-close', { force: true });
  assert.equal(await page.locator('#menu-win').isVisible(), true, 'une action désactivée ne ferme pas le menu');
  await page.keyboard.press('Escape');
  await page.click('.dock [data-app=parcours]');
  await page.click('#mb-win-btn');
  assert.equal(await page.getAttribute('#mw-close', 'aria-disabled'), 'false');
  assert.equal(await page.textContent('#mw-zoom'), 'Agrandir la fenêtre');
  await page.click('#mw-zoom');
  assert.equal(await page.locator('.win').evaluate((el) => el.classList.contains('max')), true);
  await page.click('#mb-win-btn');
  assert.equal(await page.textContent('#mw-zoom'), 'Restaurer la fenêtre');
  await page.click('#mw-min');
  await page.waitForSelector('.win.minimized', { state: 'attached' });
  await page.click('.dock [data-app=parcours]');
  await page.click('#mb-win-btn');
  await page.click('#mw-close');
  assert.equal(await page.locator('.win').count(), 0, 'la fenêtre est fermée');
  await ctx.close();
});

test('menus : survol pour passer d\'un menu à l\'autre, clic ailleurs ferme', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await enterDesktop(page);
  await page.click('#mb-brand-btn');
  await page.hover('#mb-win-btn');
  assert.equal(await page.getAttribute('#mb-win-btn', 'aria-expanded'), 'true');
  assert.equal(await page.getAttribute('#mb-brand-btn', 'aria-expanded'), 'false', 'un seul menu ouvert à la fois');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.getAttribute('#mb-view-btn', 'aria-expanded'), 'true', 'flèche gauche : menu voisin (Présentation)');
  assert.equal(await page.getAttribute('#mb-win-btn', 'aria-expanded'), 'false');
  await page.mouse.click(600, 400);
  assert.equal(await page.getAttribute('#mb-view-btn', 'aria-expanded'), 'false');
  await ctx.close();
});

test('menus : absents en mode téléphone', async () => {
  const ctx = await site.browser.newContext({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(site.base);
  assert.equal(await page.locator('#mb-brand-btn').isVisible(), false);
  await ctx.close();
});

const settle = (page) => page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'));
const optionTexts = (page) => page.$$eval('#spot-list [role=option]', (os) => os.map((o) => o.firstChild.textContent));

test('recherche : s\'ouvre au bouton et à Ctrl+K, combobox + listbox accessibles, groupes', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await enterDesktop(page);
  assert.equal(await page.locator('#spot').isVisible(), false);
  assert.equal(await page.getAttribute('#mb-search', 'aria-haspopup'), 'dialog');
  await page.click('#mb-search');
  assert.equal(await page.locator('#spot').isVisible(), true);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'spot-input', 'le champ a le focus');
  assert.equal(await page.getAttribute('#spot-input', 'role'), 'combobox');
  assert.equal(await page.getAttribute('#spot-list', 'role'), 'listbox');
  assert.equal(await page.getAttribute('#mb-search', 'aria-expanded'), 'true');
  const groups = await page.$$eval('.spot-group-label', (els) => els.map((e) => e.textContent));
  assert.deepEqual(groups, ['Applications', 'Actions', 'Liens']);
  assert.ok((await optionTexts(page)).length >= 12, 'sans saisie : tout est listé');
  assert.equal(await page.$eval('#spot-opt-0', (o) => o.getAttribute('aria-selected')), 'true');
  assert.equal(await page.getAttribute('#spot-input', 'aria-activedescendant'), 'spot-opt-0');
  await page.keyboard.press('Control+k');
  assert.equal(await page.locator('#spot').isVisible(), false, 'Ctrl+K referme');
  await page.keyboard.press('Control+k');
  assert.equal(await page.locator('#spot').isVisible(), true, 'Ctrl+K ouvre');
  await ctx.close();
});

test('recherche : filtrer, naviguer aux flèches (avec bouclage) et ouvrir avec Entrée', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await enterDesktop(page);
  await page.keyboard.press('Control+k');
  await page.keyboard.type('realisa');
  assert.deepEqual(await optionTexts(page), ['Réalisations']);
  assert.equal(await page.textContent('#spot-status'), '1 résultat');
  await page.fill('#spot-input', 'echecs');
  assert.deepEqual(await optionTexts(page), ['Hobbies', 'Apprendre à jouer aux échecs'], 'les groupes gardent leur ordre : applications, actions, liens');
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.getAttribute('#spot-input', 'aria-activedescendant'), 'spot-opt-1');
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.getAttribute('#spot-input', 'aria-activedescendant'), 'spot-opt-0', 'la sélection boucle');
  await page.keyboard.press('ArrowUp');
  assert.equal(await page.getAttribute('#spot-input', 'aria-activedescendant'), 'spot-opt-1', 'et boucle en remontant');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.win[data-app=hobbies]');
  assert.equal(await page.locator('#spot').isVisible(), false);
  assert.equal(await page.locator('.mb-app').textContent(), 'Photos');
  assert.equal(await page.evaluate(() => document.querySelector('.dock').inert), false, 'le bureau n\'est plus inerte');
  await ctx.close();
});

test('recherche : aucun résultat, Échap rend le focus, clic à côté ferme', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await enterDesktop(page);
  await page.click('#mb-search');
  await page.fill('#spot-input', 'zzzzz');
  assert.equal(await page.locator('#spot-empty').isVisible(), true);
  assert.equal(await page.textContent('#spot-status'), 'Aucun résultat');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.win').count(), 0, 'Entrée ne fait rien sans résultat');
  assert.equal(await page.locator('#spot').isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#spot').isVisible(), false);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'mb-search', 'le focus revient au bouton');
  await page.click('#mb-search');
  assert.equal(await page.evaluate(() => document.querySelector('.menubar').inert), true, 'le reste est inerte pendant la recherche');
  await page.mouse.click(60, 600);
  assert.equal(await page.locator('#spot').isVisible(), false, 'un clic à côté ferme');
  await ctx.close();
});

test('recherche : actions (thème) et liens (nouvel onglet, noopener)', async () => {
  const ctx = await site.browser.newContext({ ...DESKTOP, colorScheme: 'light' });
  const page = await ctx.newPage();
  await enterDesktop(page);
  await page.keyboard.press('Control+k');
  await page.fill('#spot-input', 'sombre');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-theme')), 'dark');
  await page.evaluate(() => {
    window.__opened = [];
    HTMLAnchorElement.prototype.click = function () { window.__opened.push([this.href, this.target, this.rel]); };
  });
  await page.keyboard.press('Control+k');
  await page.fill('#spot-input', 'calendly');
  await page.keyboard.press('Enter');
  assert.deepEqual(await page.evaluate(() => window.__opened), [['https://calendly.com/kangahmichael/new-meeting', '_blank', 'noopener']]);
  assert.equal(await page.locator('#spot').isVisible(), false);
  await ctx.close();
});

test('recherche : inactive sur l\'écran verrouillé et en mode téléphone', async () => {
  let ctx = await site.browser.newContext(DESKTOP);
  let page = await ctx.newPage();
  await page.goto(site.base);
  await page.keyboard.press('Control+k');
  assert.equal(await page.locator('#spot').isVisible(), false, 'rien sur l\'écran verrouillé');
  await ctx.close();
  ctx = await site.browser.newContext({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true });
  page = await ctx.newPage();
  await page.goto(site.base);
  await page.tap('#enter');
  await page.waitForTimeout(600);
  await page.keyboard.press('Control+k');
  assert.equal(await page.locator('#spot').isVisible(), false);
  assert.equal(await page.locator('#mb-search').isVisible(), false);
  await ctx.close();
});

test('fenêtres : un clic sur une fenêtre de derrière la met au premier plan, la voisine devient inactive', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await enterDesktop(page);
  await page.click('.dock [data-app=parcours]');
  await page.click('.dock [data-app=travail]');
  await page.click('.dock [data-app=hobbies]');
  await settle(page);
  const first = page.locator('.win[data-app=parcours]');
  const last = page.locator('.win[data-app=hobbies]');
  assert.equal(await last.evaluate((el) => el.classList.contains('active')), true);
  const light = (loc) => loc.locator('.light.close').evaluate((el) => getComputedStyle(el, '::before').backgroundColor);
  assert.equal(await light(last), 'rgb(255, 95, 87)', 'fenêtre active : bouton rouge');
  assert.notEqual(await light(first), 'rgb(255, 95, 87)', 'fenêtre inactive : bouton grisé');
  const box = await first.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + 12); // bande de la barre de titre que les fenêtres suivantes ne recouvrent pas
  assert.equal(await first.evaluate((el) => el.classList.contains('active')), true);
  assert.equal(await last.evaluate((el) => el.classList.contains('active')), false);
  const z = (loc) => loc.evaluate((el) => Number(el.style.zIndex));
  assert.ok((await z(first)) > (await z(last)), 'au premier plan');
  assert.equal(await page.locator('.mb-app').textContent(), 'Pages');
  assert.equal(await light(first), 'rgb(255, 95, 87)');
  await ctx.close();
});

test('fenêtres : redimensionner par le coin, taille minimale et limite du bureau', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await enterDesktop(page);
  await page.click('.dock [data-app=parcours]');
  await settle(page);
  const win = page.locator('.win');
  const size = async () => { const b = await win.boundingBox(); return [Math.round(b.width), Math.round(b.height)]; };
  const [w0, h0] = await size();
  const handle = await page.locator('.win .rs-se').boundingBox();
  const hx = handle.x + handle.width / 2, hy = handle.y + handle.height / 2;
  await page.mouse.move(hx, hy);
  await page.mouse.down();
  await page.mouse.move(hx + 120, hy + 60, { steps: 4 });
  await page.mouse.up();
  const [w1, h1] = await size();
  assert.ok(Math.abs(w1 - (w0 + 120)) <= 2 && Math.abs(h1 - (h0 + 60)) <= 2, 'plus grande de 120 × 60 (' + w1 + '×' + h1 + ')');
  const h2 = await page.locator('.win .rs-se').boundingBox();
  await page.mouse.move(h2.x + 7, h2.y + 7);
  await page.mouse.down();
  await page.mouse.move(0, 0, { steps: 4 });
  await page.mouse.up();
  const [w2, h2s] = await size();
  assert.equal(w2, 352, 'largeur minimale 22 rem');
  assert.equal(h2s, 224, 'hauteur minimale 14 rem');
  const left = await win.evaluate((el) => el.offsetLeft);
  const h3 = await page.locator('.win .rs-se').boundingBox();
  await page.mouse.move(h3.x + 7, h3.y + 7);
  await page.mouse.down();
  await page.mouse.move(1430, 890, { steps: 4 });
  await page.mouse.up();
  const [w3] = await size();
  assert.ok(w3 <= 1440 - left, 'ne dépasse pas le bureau (' + w3 + ')');
  await ctx.close();
});

test('fenêtres : redimensionner au clavier (Alt + Maj + flèches), poignées cachées quand agrandie', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await enterDesktop(page);
  await page.click('.dock [data-app=travail]');
  await settle(page);
  const win = page.locator('.win');
  const w0 = (await win.boundingBox()).width;
  await win.focus();
  await page.keyboard.press('Alt+Shift+ArrowRight');
  assert.equal(Math.round((await win.boundingBox()).width), Math.round(w0 + 24));
  await page.keyboard.press('Alt+Shift+ArrowLeft');
  await page.keyboard.press('Alt+Shift+ArrowLeft');
  assert.equal(Math.round((await win.boundingBox()).width), Math.round(w0 - 24));
  await page.click('.win .light.zoom');
  assert.equal(await page.locator('.win .rs-se').isVisible(), false, 'pas de poignée quand la fenêtre est agrandie');
  await ctx.close();
});

test('bureau : le widget Réalisations reprend exactement les 4 boutiques de la section Réalisations', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await enterDesktop(page);
  const widget = page.locator('.desk-widget[aria-label="Réalisations"]');
  assert.equal(await widget.isVisible(), true);
  const links = await widget.locator('a').evaluateAll((as) => as.map((a) => [a.href, a.target, a.rel, a.textContent.includes('nouvel onglet')]));
  assert.equal(links.length, 4);
  assert.ok(links.every((l) => l[1] === '_blank' && l[2] === 'noopener' && l[3] === true), 'nouvel onglet, noopener, annoncé');
  const published = await page.evaluate(() => {
    const card = [...document.querySelectorAll('#travail article')].find((a) => a.querySelector('h3').textContent.trim() === '4 boutiques Shopify');
    return [...card.querySelectorAll('.links a')].map((a) => a.href);
  });
  assert.deepEqual(links.map((l) => l[0]), published, 'mêmes adresses que dans la section, dans le même ordre');
  await ctx.close();
});

test('bureau : sur un écran bas, le widget Réalisations laisse la place aux deux autres', async () => {
  const ctx = await site.browser.newContext({ viewport: { width: 1280, height: 700 } });
  const page = await ctx.newPage();
  await enterDesktop(page);
  assert.equal(await page.locator('.desk-widget[aria-label="Réalisations"]').isVisible(), false);
  assert.equal(await page.locator('.desk-widget[aria-label="Vibecoding"]').isVisible(), true);
  assert.equal(await page.locator('.desk-widget[aria-label="Disponibilité"]').isVisible(), true);
  await ctx.close();
});

test('bureau : les trois widgets tiennent à l\'écran sur 1440 × 900', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await enterDesktop(page);
  const box = await page.locator('.desk-widgets').boundingBox();
  assert.ok(box.y + box.height <= 900, 'la colonne de widgets ne déborde pas de l\'écran (' + Math.round(box.y + box.height) + ' px)');
  await ctx.close();
});

test('parcours : le stage au CNRS est dans la frise (dates, texte, lien HAL) sous Omnilog', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem('mode', 'classic'));
  await page.goto(site.base);
  const items = await page.$$eval('#parcours .timeline > li', (lis) => lis.map((li) => li.querySelector('h3').textContent.replace(/\s+/g, ' ').trim()));
  assert.equal(items[items.length - 1], 'Stagiaire ingénieur d\'étude et développement · CNRS', 'dernier de la frise (le plus ancien)');
  assert.ok(items[items.length - 2].includes('Omnilog'), 'juste sous Omnilog');
  const cnrs = page.locator('#parcours .timeline > li').last();
  assert.deepEqual(await cnrs.locator('time').evaluateAll((ts) => ts.map((t) => t.getAttribute('datetime'))), ['2015-05', '2015-10']);
  assert.match(await cnrs.innerText(), /M2 MIAGE NTDP/);
  assert.match(await cnrs.innerText(), /Node\.js, HTML5, Git et GitHub, web sémantique, RDFS/);
  const link = await cnrs.locator('a').evaluate((a) => [a.href, a.target, a.rel, a.textContent.includes('nouvel onglet')]);
  assert.deepEqual(link, ['https://univ-cotedazur.hal.science/hal-01400924v1', '_blank', 'noopener', true]);
  await ctx.close();
});

test('parcours : Chaumet (depuis le 14 septembre 2026) et Louis Vuitton jusqu\'en juin 2026', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem('mode', 'classic'));
  await page.goto(site.base);
  const items = page.locator('#parcours .timeline > li');
  const freelance = items.nth(0);
  assert.match(await freelance.innerText(), /Chaumet/);
  assert.deepEqual(await freelance.locator('time').evaluateAll((ts) => ts.map((t) => t.getAttribute('datetime'))), ['2022', '2026-09-14']);
  const link = await freelance.locator('a').evaluate((a) => [a.href, a.target, a.rel, a.textContent.includes('nouvel onglet')]);
  assert.deepEqual(link, ['https://www.chaumet.com/', '_blank', 'noopener', true]);
  const lv = items.nth(1);
  assert.deepEqual(await lv.locator('time').evaluateAll((ts) => ts.map((t) => t.getAttribute('datetime'))), ['2020-03', '2026-06']);
  await ctx.close();
});

test('réalisations : les domaines ne collent pas à la première carte', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem('mode', 'classic'));
  await page.goto(site.base);
  const gap = await page.evaluate(() => {
    const tags = document.querySelector('#travail .tags').getBoundingClientRect();
    const card = document.querySelector('#travail .grid .card').getBoundingClientRect();
    return card.top - tags.bottom;
  });
  assert.ok(gap >= 16, 'écart entre les domaines et la première carte : ' + gap + ' px');
  await ctx.close();
});

test('barre de menus : logo dessiné, nom d\'application macOS et titre de fenêtre descriptif', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  await page.click('#enter');
  assert.equal(await page.locator('.mb-app').textContent(), 'Finder');
  assert.equal(await page.locator('#mb-brand-btn .mb-logo').count(), 1, 'logo SVG dans le bouton');
  assert.match(await page.locator('#mb-brand-btn').textContent(), /Michaël Kangah/);
  const names = { parcours: 'Pages', travail: 'Safari', dispo: 'Calendrier', hobbies: 'Photos', contact: 'Mail' };
  for (const [id, mac] of Object.entries(names)) {
    await page.click('.dock-item:not(.home-item)[data-app=' + id + ']');
    assert.equal(await page.locator('.mb-app').textContent(), mac, id);
    await page.keyboard.press('Escape');
  }
  await ctx.close();
});

test('à propos de ce site : boîte modale, le bureau est inerte, Échap la ferme et rend le focus', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
  await page.click('#mb-brand-btn');
  await page.click('#os-about');
  assert.equal(await page.locator('#about').isVisible(), true);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'about-ok', 'le focus va au bouton OK');
  assert.equal(await page.getAttribute('#about .about-panel', 'role'), 'dialog');
  assert.equal(await page.getAttribute('#about .about-panel', 'aria-modal'), 'true');
  assert.equal(await page.evaluate(() => document.querySelector('.menubar').inert && document.querySelector('.dock').inert), true, 'le reste est inerte');
  assert.match(await page.locator('#about .about-panel').innerText(), /sans lien avec Apple/i);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#about').isVisible(), false);
  assert.equal(await page.evaluate(() => document.querySelector('.dock').inert), false, 'plus d\'inertie');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'mb-brand-btn', 'le focus revient au menu');
  await page.click('#mb-brand-btn');
  await page.click('#os-about');
  await page.click('#about-ok');
  assert.equal(await page.locator('#about').isVisible(), false, 'OK ferme la boîte');
  await ctx.close();
});

test('centre de contrôle : thème, plein écran masqué si impossible, version classique', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
  const theme = () => page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const before = await theme();
  await page.click('#mb-ctrl-btn');
  assert.equal(await page.getAttribute('#mb-ctrl-btn', 'aria-expanded'), 'true');
  const checked = await page.getAttribute('#cc-theme', 'aria-checked');
  await page.click('#cc-theme');
  assert.notEqual(await theme(), before, 'le thème change');
  await page.click('#mb-ctrl-btn');
  assert.notEqual(await page.getAttribute('#cc-theme', 'aria-checked'), checked, 'l\'état suit le thème');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#menu-ctrl').isVisible(), false);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'mb-ctrl-btn');
  await page.click('#mb-ctrl-btn');
  await page.click('#cc-classic');
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('os-mode')), false, 'version classique');
  await ctx.close();
});

test('raccourcis : Alt + 1 à 5 ouvrent les applications, rien quand la recherche est ouverte', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
  await page.keyboard.press('Alt+Digit1');
  assert.equal(await page.locator('.mb-app').textContent(), 'Pages');
  await page.keyboard.press('Alt+Digit4');
  assert.equal(await page.locator('.mb-app').textContent(), 'Photos');
  assert.equal(await page.locator('.win').count(), 2);
  assert.equal(await page.getAttribute('.dock-item:not(.home-item)[data-app=parcours]', 'aria-keyshortcuts'), 'Alt+1');
  await page.keyboard.press('Control+k');
  await page.keyboard.press('Alt+Digit5');
  assert.equal(await page.locator('.win').count(), 2, 'la recherche ouverte bloque le raccourci');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Alt+Digit5');
  assert.equal(await page.locator('.mb-app').textContent(), 'Mail');
  await ctx.close();
});

test('menu Fichier : ouvre les applications sans fenêtre, puis liste les liens de l\'application active', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
  await page.click('#mb-file-btn');
  const items = () => page.locator('#menu-file [role=menuitem]').allInnerTexts();
  assert.deepEqual((await items()).map((t) => t.trim()), ['Ouvrir Parcours', 'Ouvrir Réalisations', 'Ouvrir Disponibilité', 'Ouvrir Hobbies', 'Ouvrir Contact']);
  await page.click('#menu-file >> text=Ouvrir Contact');
  assert.equal(await page.locator('.mb-app').textContent(), 'Mail');
  await page.click('#mb-file-btn');
  const labels = (await items()).map((t) => t.replace(/\s+/g, ' ').trim());
  assert.ok(labels.some((t) => /Prendre rendez-vous/.test(t)), labels.join(' | '));
  assert.ok(labels.some((t) => /k@fmichael\.cloud/.test(t)));
  assert.ok(labels.some((t) => /LinkedIn/.test(t)));
  assert.equal(labels[labels.length - 1], 'Fermer la fenêtre');
  await ctx.route('**/calendly.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Calendly</title>' }));
  const [popup] = await Promise.all([ctx.waitForEvent('page'), page.click('#menu-file >> text=/Prendre rendez-vous/')]);
  await popup.waitForLoadState();
  assert.match(popup.url(), /calendly\.com/);
  await popup.close();
  await page.click('#mb-file-btn');
  await page.click('#menu-file >> text=Fermer la fenêtre');
  assert.equal(await page.locator('.win').count(), 0);
  assert.equal(await page.locator('.mb-app').textContent(), 'Finder');
  await ctx.close();
});

test('menus Présentation et Aide : thème, raccourcis, contact', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
  const theme = () => page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const before = await theme();
  await page.click('#mb-view-btn');
  const checked = await page.getAttribute('#vw-theme', 'aria-checked');
  await page.click('#vw-theme');
  assert.notEqual(await theme(), before);
  await page.click('#mb-view-btn');
  assert.notEqual(await page.getAttribute('#vw-theme', 'aria-checked'), checked);
  await page.keyboard.press('Escape');
  await page.click('#mb-help-btn');
  await page.click('#hp-keys');
  assert.equal(await page.locator('#about').isVisible(), true);
  await page.keyboard.press('Escape');
  await page.click('#mb-help-btn');
  await page.click('#hp-contact');
  assert.equal(await page.locator('.mb-app').textContent(), 'Mail');
  await ctx.close();
});

test('menu contextuel du bureau : clic droit sur le fond seulement, clavier et Échap', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
  await page.mouse.click(700, 420, { button: 'right' });
  assert.equal(await page.locator('#menu-ctx').isVisible(), true);
  const first = await page.evaluate(() => document.activeElement.textContent.trim());
  assert.equal(first, 'Ouvrir Parcours', 'le focus va au premier élément');
  await page.keyboard.press('End');
  assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Version classique');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#menu-ctx').isVisible(), false);
  await page.mouse.click(700, 420, { button: 'right' });
  await page.click('#menu-ctx >> text=Ouvrir Hobbies');
  assert.equal(await page.locator('.mb-app').textContent(), 'Photos');
  assert.equal(await page.locator('#menu-ctx').isVisible(), false, 'le menu se ferme après l\'action');
  const win = await page.locator('.win').boundingBox();
  await page.mouse.click(win.x + win.width / 2, win.y + win.height / 2, { button: 'right' });
  assert.equal(await page.locator('#menu-ctx').isVisible(), false, 'pas de menu sur une fenêtre');
  await page.mouse.click(700, 420, { button: 'right' });
  await page.mouse.click(20, 800);
  assert.equal(await page.locator('#menu-ctx').isVisible(), false, 'un clic ailleurs le ferme');
  await ctx.close();
});

test('dock : l\'icône rebondit à la première ouverture, la fenêtre part vers l\'icône en se réduisant et en revient', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
  const icon = '.dock-item:not(.home-item)[data-app=parcours] .ico';
  const dock = '.dock-item:not(.home-item)[data-app=parcours]';
  await page.click(dock);
  assert.equal(await page.locator(icon).evaluate((el) => el.classList.contains('bounce')), true, 'rebond à l\'ouverture');
  await page.waitForTimeout(900);
  assert.equal(await page.locator(icon).evaluate((el) => el.classList.contains('bounce')), false, 'le rebond se termine');
  await page.keyboard.press('Alt+Digit1');
  assert.equal(await page.locator(icon).evaluate((el) => el.classList.contains('bounce')), false, 'pas de rebond si la fenêtre est déjà ouverte');

  await page.click('.win .light.min');
  const win = page.locator('.win');
  assert.equal(await win.evaluate((el) => el.classList.contains('minimizing')), true, 'la fenêtre se réduit');
  const vars = await win.evaluate((el) => [el.style.getPropertyValue('--mdx'), el.style.getPropertyValue('--mdy')]);
  assert.match(vars[0], /^-?\d+px$/);
  assert.match(vars[1], /^\d+px$/, 'l\'icône est sous la fenêtre : trajet vers le bas');
  await page.waitForTimeout(500);
  assert.equal(await win.evaluate((el) => el.classList.contains('minimized')), true);
  await page.click(dock);
  assert.equal(await win.evaluate((el) => el.classList.contains('restoring')), true, 'la fenêtre revient depuis l\'icône');
  await page.waitForTimeout(500);
  assert.equal(await win.evaluate((el) => el.classList.contains('restoring') || el.classList.contains('minimized')), false);
  assert.equal(await win.isVisible(), true);
  await ctx.close();
});

test('dock : sans animation si les animations sont réduites (pas de rebond, réduction immédiate)', async () => {
  const ctx = await site.browser.newContext({ ...DESKTOP, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(site.base);
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
  const dock = '.dock-item:not(.home-item)[data-app=parcours]';
  await page.click(dock);
  assert.equal(await page.locator(dock + ' .ico').evaluate((el) => el.classList.contains('bounce')), false);
  await page.click('.win .light.min');
  const state = await page.locator('.win').evaluate((el) => [el.classList.contains('minimizing'), el.classList.contains('minimized')]);
  assert.deepEqual(state, [false, true], 'réduite tout de suite, sans étape animée');
  await page.click(dock);
  assert.equal(await page.locator('.win').evaluate((el) => el.classList.contains('restoring')), false);
  assert.equal(await page.locator('.win').isVisible(), true);
  await ctx.close();
});

test('version express : proposée sur l\'écran verrouillé, dans le menu Aide, la recherche et la version classique', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  const lockLink = page.locator('#lock a.lock-btn');
  assert.equal(await lockLink.textContent(), 'Version express');
  assert.equal(await lockLink.getAttribute('href'), 'express.html');
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
  await page.click('#mb-help-btn');
  assert.equal((await page.locator('#hp-express').textContent()).trim(), 'Version express');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+k');
  await page.fill('#spot-input', 'express');
  assert.match(await page.locator('#spot-list').innerText(), /Version express/);
  await page.keyboard.press('Escape');
  await page.click('#mb-help-btn');
  await Promise.all([page.waitForURL('**/express.html'), page.click('#hp-express')]);
  assert.equal(await page.locator('h1').textContent(), 'Michaël Kangah');
  await ctx.close();

  const classic = await site.browser.newContext(DESKTOP);
  const page2 = await classic.newPage();
  await page2.addInitScript(() => localStorage.setItem('mode', 'classic'));
  await page2.goto(site.base);
  assert.equal(await page2.getAttribute('.nav-list a[href="express.html"]', 'href'), 'express.html');
  await classic.close();
});

test('page express : lisible sans JavaScript, chiffres, outils, parcours, contact', async () => {
  const ctx = await site.browser.newContext({ ...DESKTOP, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(site.base + 'express.html');
  assert.equal(await page.locator('h1').count(), 1);
  assert.deepEqual(await page.locator('.stats dd').allTextContents(), ['11 ans', '6 ans', '5', '4']);
  const tools = await page.locator('.tool-groups .tags li').allTextContents();
  assert.deepEqual(tools, ['Jira', 'Confluence', 'Trello', 'Claude', 'Shopify', 'Salesforce', 'WebViews', 'Moteurs de personnalisation 3D (Threekit)']);
  assert.equal(await page.locator('.brief li').count(), 5);
  assert.match(await page.locator('main').innerText(), /En mission longue, disponible pour des projets de courte durée/);
  const hrefs = await page.locator('main a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  for (const h of ['https://calendly.com/kangahmichael/new-meeting', 'mailto:k@fmichael.cloud', 'https://www.linkedin.com/in/kangahmichael/', 'https://github.com/KFMichael', '/']) assert.ok(hrefs.includes(h), h);
  const calendly = page.locator('main a[href^="https://calendly.com"]');
  assert.equal((await calendly.first().innerText()).replace(/\s+/g, ' ').trim().startsWith('Prendre rendez-vous'), true);
  const hidden = await calendly.first().locator('.visually-hidden').evaluate((el) => { const r = el.getBoundingClientRect(); return [r.width, r.height]; });
  assert.deepEqual(hidden, [1, 1], 'la mention « nouvel onglet » n\'est pas visible (réservée aux lecteurs d\'écran)');
  assert.equal(await calendly.getAttribute('target'), '_blank');
  assert.equal(await calendly.getAttribute('rel'), 'noopener');
  // Pas de défilement horizontal à 320 px
  await page.setViewportSize({ width: 320, height: 700 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'pas de débordement à 320 px');
  await ctx.close();
});

test('parcours : la carte « Outils du quotidien » est dans la page classique et dans la fenêtre du bureau', async () => {
  const expected = ['Jira', 'Confluence', 'Trello', 'Claude', 'Shopify', 'Salesforce', 'WebViews', 'Moteurs de personnalisation 3D (Threekit)'];
  const classic = await site.browser.newContext(DESKTOP);
  const page = await classic.newPage();
  await page.addInitScript(() => localStorage.setItem('mode', 'classic'));
  await page.goto(site.base);
  const card = page.locator('#parcours .card', { has: page.locator('h3', { hasText: 'Outils du quotidien' }) });
  assert.deepEqual(await card.locator('.tags li').allTextContents(), expected);
  assert.match(await card.innerText(), /Mon Monogram/);
  await classic.close();

  const ctx = await site.browser.newContext(DESKTOP);
  const desk = await ctx.newPage();
  await desk.goto(site.base);
  await desk.click('#enter');
  await desk.waitForSelector('#lock', { state: 'hidden' });
  await desk.click('.dock-item:not(.home-item)[data-app=parcours]');
  assert.deepEqual(await desk.locator('.win .tags li').allTextContents(), expected);
  await desk.keyboard.press('Escape');
  await desk.keyboard.press('Control+k');
  await desk.fill('#spot-input', 'jira');
  assert.match(await desk.locator('#spot-list').innerText(), /Parcours/);
  await ctx.close();
});

test('code QR : les fichiers se décodent vers l\'adresse de la version express, à toutes les tailles', async () => {
  const canonical = require('node:fs').readFileSync(require('node:path').resolve(__dirname, '../../express.html'), 'utf8').match(/<link rel="canonical" href="([^"]+)"/)[1];
  assert.equal(canonical, 'https://fmichael.cloud/express');
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base + 'express.html');
  await page.addScriptTag({ path: require.resolve('jsqr/dist/jsQR.js') });
  const decode = (src, size) => page.evaluate(async ([url, px]) => {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#fff';
    g.fillRect(0, 0, px, px);
    g.drawImage(img, 0, 0, px, px);
    const r = window.jsQR(g.getImageData(0, 0, px, px).data, px, px);
    return r ? r.data : null;
  }, [src, size]);
  for (const size of [148, 296, 1000]) {
    assert.equal(await decode(site.base + 'img/qr-express.svg', size), canonical, 'SVG à ' + size + ' px');
  }
  assert.equal(await decode(site.base + 'img/qr-express.png', 1000), canonical, 'PNG à 1000 px');
  await ctx.close();
});

test('« Ouvrir sur mon téléphone » : boîte modale avec le code QR, Tab reste dedans, Échap la ferme et rend le focus', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  await page.click('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
  await page.click('#mb-help-btn');
  await page.click('#hp-qr');
  assert.equal(await page.locator('#phone-qr').isVisible(), true);
  assert.equal(await page.getAttribute('#phone-qr .about-panel', 'aria-modal'), 'true');
  assert.match(await page.getAttribute('#phone-qr img', 'alt'), /fmichael\.cloud\/express/);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'phone-qr-ok');
  assert.equal(await page.evaluate(() => document.querySelector('.dock').inert), true);
  const focus = () => page.evaluate(() => document.activeElement.textContent.trim());
  const seen = [];
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Tab'); seen.push(await focus()); }
  assert.deepEqual(seen, ['PNG', 'SVG', 'OK', 'PNG'], 'Tab fait le tour de la boîte sans en sortir');
  assert.equal(await page.getAttribute('#phone-qr a[href$=".png"]', 'download'), 'qr-michael-kangah-express.png');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await focus(), 'OK', 'Maj + Tab revient en arrière');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#phone-qr').isVisible(), false);
  assert.equal(await page.evaluate(() => document.querySelector('.dock').inert), false);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'mb-help-btn', 'le focus revient au menu Aide');
  // Par la recherche, et pas deux boîtes à la fois
  await page.keyboard.press('Control+k');
  await page.fill('#spot-input', 'telephone');
  assert.match(await page.locator('#spot-list').innerText(), /Ouvrir sur mon téléphone/);
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#phone-qr').isVisible(), true);
  await page.keyboard.press('Control+k');
  assert.equal(await page.locator('#spot').isVisible(), false, 'la recherche ne s\'ouvre pas par-dessus la boîte');
  await ctx.close();
});

test('parcours : les certifications sont regroupées par thème, avec le lien LinkedIn', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem('mode', 'classic'));
  await page.goto(site.base);
  const card = page.locator('#parcours .card', { has: page.locator('h3', { hasText: 'Certifications' }) });
  assert.deepEqual(await card.locator('h4').allTextContents(), ['Produit et agilité', 'Test et qualité', 'Intelligence artificielle', 'Gestion des services']);
  const groups = await card.locator('h4 + ul').evaluateAll((uls) => uls.map((ul) => [...ul.querySelectorAll('li')].map((li) => li.textContent.trim())));
  assert.deepEqual(groups, [
    ['Certified Scrum Product Owner (2018)', 'Leading SAFe 4.6 (2019)'],
    ['ISTQB Test Manager (2017)'],
    ['Anthropic AI Professional (2026)'],
    ['ITIL 4 Foundation (en cours)'],
  ], 'les 5 certifications publiées, sans ajout ni oubli');
  const link = await card.locator('a').evaluate((a) => [a.href, a.target, a.rel, a.textContent.includes('nouvel onglet')]);
  assert.deepEqual(link, ['https://www.linkedin.com/in/kangahmichael/details/certifications/', '_blank', 'noopener', true]);
  await ctx.close();
});

test('parcours : la fenêtre du bureau reprend le stage et les certifications, la recherche les trouve', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await enterDesktop(page);
  await page.keyboard.press('Control+k');
  await page.fill('#spot-input', 'cnrs');
  assert.deepEqual(await page.$$eval('#spot-list [role=option]', (os) => os.map((o) => o.firstChild.textContent)), ['Parcours']);
  await page.keyboard.press('Enter');
  await page.waitForSelector('.win[data-app=parcours]');
  const text = await page.locator('.win[data-app=parcours]').innerText();
  assert.match(text, /CNRS/);
  assert.match(text, /Produit et agilité/);
  await ctx.close();
});
