// La mesure d'audience ne se charge que sur fmichael.cloud, et respecte « Do Not Track » et l'exclusion.
const test = require('node:test');
const assert = require('node:assert/strict');
const { startSite, DESKTOP } = require('../helpers/site.js');

let site;
test.before(async () => { site = await startSite(); });
test.after(async () => { await site.close(); });

const SELECTOR = 'script[src*="static.cloudflareinsights.com"]';

// Fait croire au navigateur qu'il est sur fmichael.cloud (le contenu vient du serveur local de test)
async function onProduction(options = {}) {
  const ctx = await site.browser.newContext({ ...DESKTOP, ...options });
  const beacon = [];
  await ctx.route('https://static.cloudflareinsights.com/**', (route) => {
    beacon.push(route.request().url());
    return route.fulfill({ contentType: 'text/javascript', body: '' });
  });
  await ctx.route('http://fmichael.cloud/**', async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: site.base.replace(/\/$/, '') + url.pathname + url.search });
    return route.fulfill({ response });
  });
  const page = await ctx.newPage();
  return { ctx, page, beacon };
}

test('en local : aucun script de mesure', async () => {
  const ctx = await site.browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  await page.goto(site.base);
  assert.equal(await page.locator(SELECTOR).count(), 0);
  await ctx.close();
});

test('sur fmichael.cloud : le script est ajouté avec le jeton du site', async () => {
  const { ctx, page, beacon } = await onProduction();
  await page.goto('http://fmichael.cloud/');
  await page.waitForSelector(SELECTOR, { state: 'attached' });
  const attr = await page.locator(SELECTOR).getAttribute('data-cf-beacon');
  assert.match(JSON.parse(attr).token, /^[0-9a-f]{32}$/);
  await page.waitForFunction(() => performance.getEntriesByType('resource').some((r) => r.name.includes('cloudflareinsights')));
  assert.equal(beacon.length, 1);
  await ctx.close();
});

test('« Do Not Track » : rien n\'est chargé', async () => {
  const { ctx, page } = await onProduction();
  await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }));
  await page.goto('http://fmichael.cloud/');
  assert.equal(await page.locator(SELECTOR).count(), 0);
  await ctx.close();
});

test('?analytics=off exclut le navigateur, ?analytics=on le réactive', async () => {
  const { ctx, page } = await onProduction();
  await page.goto('http://fmichael.cloud/?analytics=off');
  assert.equal(await page.locator(SELECTOR).count(), 0);
  await page.goto('http://fmichael.cloud/');
  assert.equal(await page.locator(SELECTOR).count(), 0, 'le choix est mémorisé');
  await page.goto('http://fmichael.cloud/?analytics=on');
  await page.waitForSelector(SELECTOR, { state: 'attached' });
  await ctx.close();
});
