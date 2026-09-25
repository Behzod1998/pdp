// Chizma (A3) va xonalar izohini (A4) PDF qilib yig'adi.
//   npm install && node build.mjs [--png]
// Playwright global o'rnatilgan bo'lishi kerak (Chromium bilan).
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { varaqlarHtml } from './varaqlar.mjs';
import { izohHtml } from './izoh.mjs';
import { tekshiruv } from './tekshiruv.mjs';
import { LOYIHA } from './model.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch {
  ({ chromium } = require(join(process.execPath, '../../lib/node_modules/playwright')));
}

const BU = dirname(fileURLToPath(import.meta.url));
const CHIQISH = join(BU, '..', 'chizma');
const PNG = process.argv.includes('--png');

// 3D sahna uchun oddiy statik server (ES modullar file:// dan yuklanmaydi)
const TUR = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    const p = join(BU, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    res.writeHead(200, { 'content-type': TUR[extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

const t = tekshiruv();
const xatolar = [...t.toqnashuv, ...t.toSilgan, ...t.ustunQoidasi, ...t.eshik, ...t.doskaDevor];
console.log(`O'rinlar: ${t.orinlar}, jihozlar: ${t.jihozlar}, xatolar: ${xatolar.length}`);
xatolar.forEach(x => console.log('  ! ' + x));

await mkdir(CHIQISH, { recursive: true });
const brauzer = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

// 1. 3D ko'rinishlar
const sahna = await brauzer.newPage({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: 1 });
await sahna.goto(`http://localhost:${port}/sahna3d.html`);
await sahna.waitForFunction(() => window.tayyor === true, null, { timeout: 60000 });
const korinishlar = {};
for (const nom of await sahna.evaluate(() => Object.keys(window.KORINISHLAR))) {
  korinishlar[nom] = await sahna.evaluate(n => window.chiz(n), nom);
}
await sahna.close();

// 2. A3 varaqlar
const nom = `${LOYIHA.brend.replace(/ /g, '_')}_-_Chizma_-_${LOYIHA.filial.replace(/ /g, '_')}_2-qavat_${LOYIHA.versiya}`;
const a3 = await brauzer.newPage();
await a3.setContent(varaqlarHtml(), { waitUntil: 'load' });
await a3.pdf({ path: join(CHIQISH, `${nom}.pdf`), width: '420mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
if (PNG) {
  await a3.setViewportSize({ width: 1588, height: 1123 });
  const varaqlar = await a3.$$('section.varaq');
  for (let i = 0; i < varaqlar.length; i++) await varaqlar[i].screenshot({ path: join(CHIQISH, `varaq-${i + 1}.png`) });
}
await a3.close();

// 3. A4 izoh
const a4 = await brauzer.newPage();
await a4.setContent(izohHtml(korinishlar), { waitUntil: 'load' });
const izohNom = `Xadra_2-qavat_xonalar_izoh_${LOYIHA.versiya}`;
await a4.pdf({ path: join(CHIQISH, `${izohNom}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true });
if (PNG) {
  await a4.setViewportSize({ width: 794, height: 1123 });
  const betlar = await a4.$$('section.bet');
  for (let i = 0; i < betlar.length; i++) await betlar[i].screenshot({ path: join(CHIQISH, `bet-${i + 1}.png`) });
}
await a4.close();

await brauzer.close();
server.close();
console.log('Tayyor:', CHIQISH);
