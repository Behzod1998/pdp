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
import { taqdimotHtml } from './taqdimot.mjs';
import { tekshiruv } from './tekshiruv.mjs';
import { LOYIHA } from './model.mjs';
import { qavat3Html, tekshiruv3 } from './qavat3.mjs';
import { qavat1Html, tekshiruv1 } from './qavat1.mjs';
import { hvacHtml } from './hvac.mjs';

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
const t3 = tekshiruv3();
console.log(`3-qavat: o'rinlar ${t3.orin}, xatolar ${t3.xato.length}`);
t3.xato.forEach(x => console.log('  ! ' + x));
const t1 = tekshiruv1();
console.log(`1-qavat: xatolar ${t1.xato.length}`);
t1.xato.forEach(x => console.log('  ! ' + x));

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

// 3a. HVAC tahlili (A4): 11 xona — tashqi havo, sovutish yuklamasi, 2 ta konditsioner va 30% toza havo sxemasi
const hv = await brauzer.newPage();
await hv.setContent(hvacHtml(), { waitUntil: 'load' });
await hv.pdf({ path: join(CHIQISH, `Xadra_2-qavat_HVAC_tahlil_${LOYIHA.versiya}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true });
await hv.close();

// 4. Taqdimot varag'i (A3 portret) — PDF va katta PNG
const tq = await brauzer.newPage({ viewport: { width: 1123, height: 1587 }, deviceScaleFactor: 2.5 });
await tq.setContent(taqdimotHtml(), { waitUntil: 'load' });
const tqNom = `Xadra_2-qavat_taqdimot_reja_${LOYIHA.versiya}`;
await tq.pdf({ path: join(CHIQISH, `${tqNom}.pdf`), width: '297mm', height: '420mm', printBackground: true, preferCSSPageSize: true });
await (await tq.$('section.varaq')).screenshot({ path: join(CHIQISH, `${tqNom}.png`) });
await tq.close();

// 5. 3-qavat rejasi (A3 landshaft) — PDF va PNG
const q3 = await brauzer.newPage({ viewport: { width: 1587, height: 1123 }, deviceScaleFactor: 2.5 });
await q3.setContent(qavat3Html(), { waitUntil: 'load' });
const q3Nom = `Xadra_3-qavat_reja_${LOYIHA.versiya}`;
await q3.pdf({ path: join(CHIQISH, `${q3Nom}.pdf`), width: '420mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
await (await q3.$('section.varaq')).screenshot({ path: join(CHIQISH, `${q3Nom}.png`) });
await q3.close();

// 6. 1-qavat rejasi (A3 landshaft) — PDF va PNG; Blender rasmlari bo'lsa, varaqqa qo'shiladi
const q1 = await brauzer.newPage({ viewport: { width: 1587, height: 1123 }, deviceScaleFactor: 2.5 });
const q1Rasm = async f => { try { return `data:image/jpeg;base64,${(await readFile(join(CHIQISH, '3d', f))).toString('base64')}`; } catch { return null; } };
await q1.setContent(qavat1Html({ rasmlar: [
  { src: await q1Rasm('Xadra_1-qavat_3D_2-kirish.jpg'), nom: '3D: eshikdan kirganda' },
  { src: await q1Rasm('Xadra_1-qavat_3D_3-resepshn.jpg'), nom: '3D: resepshn va logotip' },
] }), { waitUntil: 'load' });
const q1Nom = `Xadra_1-qavat_reja_${LOYIHA.versiya}`;
await q1.pdf({ path: join(CHIQISH, `${q1Nom}.pdf`), width: '420mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
await (await q1.$('section.varaq')).screenshot({ path: join(CHIQISH, `${q1Nom}.png`) });
await q1.close();

await brauzer.close();
server.close();
console.log('Tayyor:', CHIQISH);
