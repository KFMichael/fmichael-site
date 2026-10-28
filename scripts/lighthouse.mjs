// Contrôle Lighthouse du site tel qu'il est publié : assemble _site, le sert en local, audite l'écran d'entrée
// en mobile puis en bureau, et échoue si une note descend sous son seuil.
// Chrome : CHROME_PATH=/chemin/vers/chrome (Chrome du runner en CI, Chromium Playwright en local).
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { launch } from 'chrome-launcher';
import lighthouse, { desktopConfig } from 'lighthouse';

// Seuils bloquants (0 à 1). La performance est affichée mais ne bloque pas : elle varie trop d'un runner à l'autre.
const SEUILS = { accessibility: 0.95, 'best-practices': 0.9, seo: 0.9 };
const PERF_ALERTE = 0.9;
const SORTIE = '_site';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain', '.xml': 'application/xml' };

execFileSync('bash', ['scripts/assemble-site.sh', SORTIE], { stdio: 'inherit' });

const serveur = createServer(async (req, res) => {
  const chemin = decodeURIComponent(req.url.split('?')[0]);
  let fichier = normalize(join(SORTIE, chemin === '/' ? 'index.html' : chemin));
  try {
    if (!fichier.startsWith(SORTIE) || (await stat(fichier)).isDirectory()) throw new Error('introuvable');
    res.writeHead(200, { 'Content-Type': TYPES[extname(fichier)] || 'application/octet-stream' });
    res.end(await readFile(fichier));
  } catch {
    try {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(await readFile(join(SORTIE, '404.html')));
    } catch { res.end(); }
  }
});
await new Promise((ok) => serveur.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${serveur.address().port}/`;
const PAGES = [['accueil', base], ['express', base + 'express.html']];

const chrome = await launch({
  chromePath: process.env.CHROME_PATH,
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu']
});

let echec = false;
try {
  for (const [page, url] of PAGES) for (const [mode, config] of [['mobile', undefined], ['bureau', desktopConfig]]) {
    const nom = `${page} ${mode}`;
    const { lhr } = await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error' }, config);
    const notes = Object.fromEntries(Object.entries(lhr.categories).map(([id, c]) => [id, c.score]));
    console.log(`\nLighthouse ${nom} : ` + Object.entries(notes).map(([id, n]) => `${id} ${Math.round(n * 100)}`).join(', '));
    for (const [id, seuil] of Object.entries(SEUILS)) {
      if (notes[id] < seuil) {
        echec = true;
        console.error(`  ECHEC ${nom} : ${id} ${Math.round(notes[id] * 100)} < ${Math.round(seuil * 100)}`);
        for (const ref of lhr.categories[id].auditRefs) {
          const a = lhr.audits[ref.id];
          if (a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative') console.error(`    - ${a.title} (${ref.id})`);
        }
      }
    }
    if (notes.performance < PERF_ALERTE) console.warn(`  Alerte ${nom} : performance ${Math.round(notes.performance * 100)} < ${Math.round(PERF_ALERTE * 100)} (non bloquant)`);
  }
} finally {
  await chrome.kill();
  serveur.close();
}
process.exit(echec ? 1 : 0);
