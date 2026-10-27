// Contrôle d'accessibilité (axe-core) sur tous les écrans. Nécessite Chromium :
// `npx playwright install chromium` (ou CHROME_PATH=/chemin/vers/chrome).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { startSite, PHONE, DESKTOP } = require('../helpers/site.js');

const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

let site, browser, base;

test.before(async () => {
  site = await startSite();
  browser = site.browser;
  base = site.base;
});

test.after(async () => { await site.close(); });

async function violations(page) {
  // Laisse finir les animations (séquence des notifications) : axe lit les couleurs et opacités réelles.
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'));
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate((tags) => axe.run(document, { runOnly: { type: 'tag', values: tags } }), TAGS);
  return result.violations.map((v) => v.id + ' : ' + v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' ; '));
}

for (const scheme of ['light', 'dark']) {
  test('téléphone, thème ' + scheme + ' : verrouillage, accueil, applications, réglages', async () => {
    const ctx = await browser.newContext({ ...PHONE, colorScheme: scheme });
    const page = await ctx.newPage();
    await page.goto(base);
    assert.deepEqual(await violations(page), [], 'écran verrouillé');
    await page.tap('#enter');
    await page.waitForTimeout(700);
    assert.deepEqual(await violations(page), [], 'accueil');
    for (const app of ['parcours', 'travail', 'dispo', 'hobbies', 'contact', 'reglages']) {
      await page.tap('#home [data-app=' + app + ']');
      await page.waitForTimeout(450);
      assert.deepEqual(await violations(page), [], 'application ' + app);
      if (app === 'travail') {
        await page.tap('.ios-row-nav');
        await page.waitForTimeout(450);
        assert.deepEqual(await violations(page), [], 'écran empilé (détail Réalisations)');
      }
      await page.tap('#home-ind');
      await page.waitForTimeout(350);
    }
    await ctx.close();
  });

  test('bureau, thème ' + scheme + ' : verrouillage et fenêtres', async () => {
    const ctx = await browser.newContext({ ...DESKTOP, colorScheme: scheme });
    const page = await ctx.newPage();
    await page.goto(base);
    assert.deepEqual(await violations(page), [], 'écran verrouillé');
    await page.click('#enter');
    await page.waitForTimeout(600);
    for (const app of ['parcours', 'travail', 'hobbies']) {
      await page.click('.dock [data-app=' + app + ']');
      await page.waitForTimeout(300);
      assert.deepEqual(await violations(page), [], 'fenêtre ' + app);
    }
    await ctx.close();
  });
}

test('version classique (mobile)', async () => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 740 } });
  const page = await ctx.newPage();
  await page.goto(base);
  await page.evaluate(() => localStorage.setItem('mode', 'classic'));
  await page.reload();
  assert.deepEqual(await violations(page), []);
  await ctx.close();
});

for (const scheme of ['light', 'dark']) {
  test('page 404, thème ' + scheme, async () => {
    const ctx = await browser.newContext({ ...DESKTOP, colorScheme: scheme });
    const page = await ctx.newPage();
    await page.goto(base + '404.html');
    assert.deepEqual(await violations(page), []);
    await ctx.close();
  });
}
