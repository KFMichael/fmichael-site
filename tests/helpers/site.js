// Sert le site en local et lance Chromium pour les tests de navigateur.
// Chromium : `npx playwright install chromium` (ou CHROME_PATH=/chemin/vers/chrome).
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

async function startSite() {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
    if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const base = 'http://localhost:' + server.address().port + '/';
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  return {
    base,
    browser,
    async close() { await browser.close(); server.close(); }
  };
}

const PHONE = { viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true };
const DESKTOP = { viewport: { width: 1440, height: 900 } };

// Simule un glissement au doigt (événements tactiles) sur un élément
async function swipe(page, selector, from, to) {
  await page.evaluate(([sel, a, b]) => {
    const el = document.querySelector(sel);
    const touch = (x, y) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
    const fire = (type, x, y) => el.dispatchEvent(new TouchEvent(type, {
      bubbles: true,
      touches: type === 'touchend' ? [] : [touch(x, y)],
      changedTouches: [touch(x, y)]
    }));
    fire('touchstart', a[0], a[1]);
    fire('touchend', b[0], b[1]);
  }, [selector, from, to]);
}

module.exports = { startSite, PHONE, DESKTOP, swipe };
