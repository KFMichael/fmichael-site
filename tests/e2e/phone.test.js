// Comportement du mode téléphone (écran verrouillé, accueil, pile de navigation, réglages).
const test = require('node:test');
const assert = require('node:assert/strict');
const { startSite, PHONE, swipe } = require('../helpers/site.js');

let site;
test.before(async () => { site = await startSite(); });
test.after(async () => { await site.close(); });

async function open(options = {}) {
  const ctx = await site.browser.newContext({ ...PHONE, ...options });
  const page = await ctx.newPage();
  await page.goto(site.base);
  return { ctx, page };
}
async function unlock(page) {
  await page.tap('#enter');
  await page.waitForSelector('#lock', { state: 'hidden' });
}
const winCount = (page) => page.locator('.win').count();
const gone = (page) => page.waitForSelector('.win', { state: 'detached' });

test('verrouillage : « En mission » est affiché, et glisser vers le haut déverrouille', async () => {
  const { ctx, page } = await open();
  assert.match(await page.locator('#lock').innerText(), /En mission/);
  await swipe(page, '#lock', [160, 500], [165, 300]);
  await page.waitForSelector('#lock', { state: 'hidden' });
  await ctx.close();
});

test('verrouillage : un glissement trop court ne déverrouille pas', async () => {
  const { ctx, page } = await open();
  await swipe(page, '#lock', [160, 500], [160, 470]);
  await page.waitForTimeout(600);
  assert.equal(await page.locator('#lock').isVisible(), true);
  await ctx.close();
});

test('application : le widget ouvre Parcours, « Accueil » ferme et rend le focus au widget', async () => {
  const { ctx, page } = await open();
  await unlock(page);
  await page.tap('.widget-cv');
  assert.equal(await page.locator('.win').getAttribute('data-app'), 'parcours');
  assert.equal(await page.locator('.back-label').innerText(), 'Accueil');
  await page.tap('.back');
  await gone(page);
  assert.equal(await page.evaluate(() => document.activeElement.className.includes('widget-cv')), true);
  await ctx.close();
});

test('application : barre « accueil », glissement vers le haut, Précédent et Échap ferment', async () => {
  const { ctx, page } = await open();
  await unlock(page);
  await page.tap('#home [data-app=contact]');
  await page.tap('#home-ind');
  await gone(page);

  await page.tap('#home [data-app=contact]');
  await swipe(page, '#home-ind', [100, 30], [100, -40]);
  await gone(page);

  await page.tap('#home [data-app=contact]');
  await page.goBack();
  await gone(page);

  await page.tap('#home [data-app=contact]');
  await page.keyboard.press('Escape');
  await gone(page);
  await ctx.close();
});

test('pile de navigation : Travail liste puis détail, le retour porte le titre précédent', async () => {
  const { ctx, page } = await open();
  await unlock(page);
  await page.tap('#home [data-app=travail]');
  const rows = await page.locator('.ios-row-nav').count();
  assert.ok(rows >= 4, 'une ligne par réalisation');
  const title = await page.locator('.ios-row-title').first().innerText();
  assert.match(await page.locator('.ios-row-sub').first().innerText(), /^\d{4} – /, 'chaque réalisation affiche sa période');
  await page.locator('.ios-row-nav').first().tap();
  await page.waitForFunction(() => document.querySelectorAll('.screens .win-body').length === 2);
  assert.equal(await page.locator('.back-label').innerText(), 'Travail');
  assert.equal(await page.locator('.win-title').innerText(), title);
  assert.equal(await page.locator('.back').getAttribute('aria-label'), 'Retour à Travail');

  await page.goBack(); // dépile un écran seulement
  await page.waitForFunction(() => document.querySelectorAll('.screens .win-body').length === 1);
  assert.equal(await winCount(page), 1);
  assert.equal(await page.locator('.back-label').innerText(), 'Accueil');

  await page.goBack(); // ferme l'application
  await gone(page);
  await ctx.close();
});

test('pile de navigation : Échap et glissement depuis le bord gauche dépilent un écran', async () => {
  const { ctx, page } = await open();
  await unlock(page);
  await page.tap('#home [data-app=travail]');
  await page.locator('.ios-row-nav').first().tap();
  await page.waitForFunction(() => document.querySelectorAll('.screens .win-body').length === 2);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelectorAll('.screens .win-body').length === 1);

  await page.locator('.ios-row-nav').nth(1).tap();
  await page.waitForFunction(() => document.querySelectorAll('.screens .win-body').length === 2);
  await swipe(page, '.win', [8, 300], [200, 310]);
  await page.waitForFunction(() => document.querySelectorAll('.screens .win-body').length === 1);
  await ctx.close();
});

test('pile de navigation : la barre « accueil » ferme toute la pile, et la suite reste cohérente', async () => {
  const { ctx, page } = await open();
  await unlock(page);
  await page.tap('#home [data-app=travail]');
  await page.locator('.ios-row-nav').first().tap();
  await page.waitForFunction(() => document.querySelectorAll('.screens .win-body').length === 2);
  await page.tap('#home-ind');
  await gone(page);
  await page.tap('#home [data-app=contact]');
  await page.goBack();
  await gone(page); // pas de retour « coincé » après la pile fermée d'un coup
  await ctx.close();
});

test('Disponibilité : « indisponible », sans grille de calendrier', async () => {
  const { ctx, page } = await open();
  await unlock(page);
  await page.tap('#home [data-app=dispo]');
  const text = await page.locator('.win-body').innerText();
  assert.match(text, /indisponible/i);
  assert.equal(await page.locator('.win table').count(), 0);
  await ctx.close();
});

test('Réglages : thème, verrouillage, version classique et retour au mode téléphone', async () => {
  const { ctx, page } = await open({ colorScheme: 'light' });
  await unlock(page);
  await page.tap('#home [data-app=reglages]');
  assert.equal(await page.getAttribute('#rg-theme', 'aria-checked'), 'false');
  await page.tap('#rg-theme');
  assert.equal(await page.getAttribute('#rg-theme', 'aria-checked'), 'true');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  await page.tap('#rg-theme');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');

  await page.tap('#rg-lock');
  await page.waitForSelector('#lock', { state: 'visible' });
  await unlock(page);

  await page.tap('#home [data-app=reglages]');
  await page.tap('#rg-classic');
  assert.equal(await page.evaluate(() => document.documentElement.className), '');
  assert.equal(await page.locator('#to-os').innerText(), 'Mode téléphone');
  await page.tap('#to-os');
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('phone-mode')), true);
  await ctx.close();
});

test('animations : sortie animée par défaut, immédiate si les animations sont réduites', async () => {
  const normal = await open({ reducedMotion: 'no-preference' });
  await unlock(normal.page);
  await normal.page.tap('#home [data-app=contact]');
  await normal.page.tap('#home-ind');
  assert.equal(await normal.page.locator('.win.closing').count(), 1, 'la fermeture est animée');
  await gone(normal.page);
  await normal.ctx.close();

  const calm = await open({ reducedMotion: 'reduce' });
  await unlock(calm.page);
  await calm.page.tap('#home [data-app=contact]');
  await calm.page.tap('#home-ind');
  assert.equal(await winCount(calm.page), 0, 'fermeture immédiate');
  await calm.ctx.close();
});

test('taille de texte à 200 % : pas de défilement horizontal sur l\'accueil ni dans une application', async () => {
  const { ctx, page } = await open({ viewport: { width: 320, height: 640 } });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await unlock(page);
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth
    || [...document.querySelectorAll('#home, .win, .screens .win-body')].some((el) => el.scrollWidth > el.clientWidth + 1));
  assert.equal(await overflow(), false, 'accueil');
  await page.tap('#home [data-app=travail]');
  assert.equal(await overflow(), false, 'liste Travail');
  await ctx.close();
});
