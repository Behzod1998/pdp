// Logotip SVG (design.pdp.uz) → Blender uchun PNG teksturalar: shaffof fonli logotip va yorituvchi logotip uchun
// "halqa" (xira nur, devorga tushadigan yorug'lik). Natija: logo/*.png
//   node logo-png.mjs
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch {
  ({ chromium } = require(join(process.execPath, '../../lib/node_modules/playwright')));
}
const BU = join(dirname(fileURLToPath(import.meta.url)), 'logo');
const NOMLAR = ['pdp-academy-primary-on-dark', 'pdp-academy-primary-on-light', 'pdp-academy-inline-on-dark', 'pdp-academy-inline-on-light'];
const EN = 3000, CHET = 160;   // px; chekkadagi bo'sh joy — halqa kesilmasligi uchun

const brauzer = await chromium.launch();
const p = await brauzer.newPage();
for (const nom of NOMLAR) {
  const svg = await readFile(join(BU, `${nom}.svg`), 'utf8');
  const [, , w, h] = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const H = Math.round(EN * h / w);
  for (const [qosh, filtr] of [['', ''], ['-halqa', 'filter: blur(38px) brightness(1.6);']]) {
    await p.setViewportSize({ width: EN + 2 * CHET, height: H + 2 * CHET });
    await p.setContent(`<html><body style="margin:0;background:transparent">
      <div style="padding:${CHET}px;width:${EN}px;height:${H}px"><img style="width:${EN}px;height:${H}px;${filtr}" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></div></body></html>`);
    await p.screenshot({ path: join(BU, `${nom}${qosh}.png`), omitBackground: true });
  }
  console.log(nom, `${EN + 2 * CHET}×${H + 2 * CHET}`, `nisbat ${(w / h).toFixed(3)}`);
}
await brauzer.close();
