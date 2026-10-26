// Contrôle d'accessibilité (axe-core) sur tous les écrans. Nécessite Chromium :
// `npx playwright install chromium` (ou CHROME_PATH=/chemin/vers/chrome).
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../..');
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

let server, browser, base;

test.before(async () => {
  server = http.createServer((req, res) => {
    const file = path.join(root, req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, resolve));
  base = 'http://localhost:' + server.address().port + '/';
  browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
});

test.after(async () => {
  await browser.close();
  server.close();
});

async function violations(page) {
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate((tags) => axe.run(document, { runOnly: { type: 'tag', values: tags } }), TAGS);
  return result.violations.map((v) => v.id + ' : ' + v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' ; '));
}

for (const scheme of ['light', 'dark']) {
  test('téléphone, thème ' + scheme + ' : verrouillage, accueil, applications, réglages', async () => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true, colorScheme: scheme });
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
      await page.tap('#home-ind');
      await page.waitForTimeout(350);
    }
    await ctx.close();
  });

  test('bureau, thème ' + scheme + ' : verrouillage et fenêtres', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: scheme });
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
