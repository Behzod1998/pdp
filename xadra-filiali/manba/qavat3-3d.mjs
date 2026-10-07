// 3-qavat 3D ko'rinishlari — A3 landshaft varaq (PDF va PNG).
// Avval Blender renderlari tayyor bo'lishi kerak (blender3.py → ../chizma/3d/).
//   node qavat3-3d.mjs
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { LOYIHA } from './model.mjs';
import { sinf3Korsatkich, BINO3 } from './qavat3.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch {
  ({ chromium } = require(join(process.execPath, '../../lib/node_modules/playwright')));
}
const BU = dirname(fileURLToPath(import.meta.url));
const D3 = join(BU, '..', 'chizma', '3d');
const CHIQISH = join(BU, '..', 'chizma');

const FAYL = { umumiy: '1-umumiy', sinf: '2-sinf-doska', wc1: '3-hojatxona-rakovinalar', wc2: '4-hojatxona-taxorat' };
const rasm = async nom => `data:image/jpeg;base64,${(await readFile(join(D3, `Xadra_3-qavat_3D_${FAYL[nom]}.jpg`))).toString('base64')}`;
const belgi = JSON.parse(await readFile(join(D3, 'umumiy-belgilar.json'), 'utf8'));
const k = sinf3Korsatkich();
const NOM = {
  1: ['1 · Koridor', ''], 2: ['2 · Erkaklar hojatxonasi', '4 kabina'], 3: ['3 · Qozonxona', 'ishlatilmaydi'],
  4: ['4 · Yopiq xona', 'bino egasiniki'], 5: ["5 · O'quv xonasi", `${k.orin} o'rin`], Z: ['Zinapoya', '2-qavatdan'],
};

const CSS = `
@page { size: 420mm 297mm; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
body { font-family: 'Liberation Sans', Arial, sans-serif; color: #222; }
.varaq { width: 420mm; height: 297mm; padding: 6mm 7mm; background: #fff; overflow: hidden; }
header { display: flex; justify-content: space-between; align-items: flex-end; height: 11mm; }
header .brend { font-size: 8pt; color: #6b6b6b; font-weight: 700; }
header h1 { font-size: 15pt; color: #1f1f1f; }
header .ong { text-align: right; font-size: 7.2pt; color: #555; }
.asosiy { display: grid; grid-template-columns: 1fr 146mm; gap: 4mm; margin-top: 2mm; }
figure { position: relative; }
figure img { display: block; width: 100%; border-radius: 1.2mm; }
figcaption { font-size: 7.6pt; color: #333; margin: 1mm 0 2.2mm; line-height: 1.3; }
figcaption b { color: #1f1f1f; }
.yorliq { position: absolute; transform: translate(-50%, -50%); background: rgba(255,255,255,.88); border-radius: 1mm;
  padding: .7mm 1.8mm; font-size: 8pt; font-weight: 700; color: #1f1f1f; white-space: nowrap; box-shadow: 0 .3mm 1mm rgba(0,0,0,.25); text-align: center; }
.yorliq small { display: block; font-weight: 400; font-size: 6.5pt; color: #555; }
.izoh { display: grid; grid-template-columns: 1fr 1fr; gap: 1mm 6mm; font-size: 7pt; color: #333; line-height: 1.4; margin-top: 1mm; }
.izoh b { color: #1f1f1f; }
.izoh p { margin-bottom: .8mm; }
.kichik { font-size: 6.3pt; color: #666; grid-column: 1 / -1; margin-top: 1mm; }
`;

const html = async () => `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>3-qavat 3D</title><style>${CSS}</style></head><body>
<section class="varaq">
  <header>
    <div><div class="brend">${LOYIHA.brend} · ${LOYIHA.filial}</div><h1>3-qavat — 3D ko'rinishlar (Blender)</h1></div>
    <div class="ong">${LOYIHA.versiya} · ${LOYIHA.sana}<br>Reja: Xadra_3-qavat_reja_${LOYIHA.versiya}.pdf</div>
  </header>
  <div class="asosiy">
    <div>
      <figure><img src="${await rasm('umumiy')}">
        ${Object.entries(belgi).map(([kod, [x, y]]) => `<div class="yorliq" style="left:${(x * 100).toFixed(2)}%;top:${(y * 100).toFixed(2)}%">${NOM[kod][0]}${NOM[kod][1] ? `<small>${NOM[kod][1]}</small>` : ''}</div>`).join('')}
      </figure>
      <figcaption><b>Umumiy ko'rinish</b> — janubi-g'arbdan, shift olib tashlangan, devorlar 2.7 m da kesilgan. Bino ${BINO3.L / 1000} × ${BINO3.B / 1000} m, umumiy ${BINO3.umumiy} m².</figcaption>
      <div class="izoh">
        <div>
          <p><b>5-xona — o'quv xonasi.</b> ${k.parta} ta ikki kishilik parta (140 × 60 sm), 4 qator × 3, ${k.orin} o'rin. Interaktiv doska shimoliy devorda, eshikdan kirganda chapda; ikki yonida oq doska. Ustoz stoli deraza tomonda. Bambuk panel 3 devorda, 2.5 m gacha (doska devori, orqa devor, eshikli devor). Eshik shisha, matli polosa bilan. Konditsioner orqa devorda.</p>
          <p><b>2-xona — erkaklar hojatxonasi.</b> Kirganda chapda 2 ta rakovina, ko'zgu va qo'l quritgich. Shimoliy devor bo'ylab 4 ta kabina (1.00 × 1.10 m): 1-sida unitaz, 2–4-sida chashagen, har birida mustahab. Janubiy devor bo'ylab taxorat joyi (3.2 m, 3 ta jo'mrak). Devorlar shiftgacha kafel, eshik yonida trap.</p>
        </div>
        <div>
          <p><b>Taxminlar (joyida aniqlanadi).</b> Shift balandligi 3.5 m (bino balandligi). Derazalar joyi va o'lchami (tokcha 0.9 m, tepasi 2.6 m) chizma fotosidan taxminiy. Kabina to'siqlari HPL, 2.0 m balandlikda. Chashagenlar polga botirilgan. Pol, kafel va jihozlar rangi — namuna uchun, tanlovga qarab o'zgaradi.</p>
          <p><b>Fayllar.</b> chizma/3d/: har bir ko'rinishning rasmi (JPG) va Xadra_3-qavat.blend (Blender 4.2, 4 ta kamera). Sahna manba/blender3.py dan qayta yig'iladi.</p>
        </div>
      </div>
    </div>
    <div>
      <figure><img src="${await rasm('sinf')}"></figure>
      <figcaption><b>5-xona → doska.</b> Orqa qatordan: interaktiv doska, bambuk panel, o'ngda derazalar va ustoz stoli.</figcaption>
      <figure><img src="${await rasm('wc1')}"></figure>
      <figcaption><b>Hojatxona ichi — rakovinalar va 1-kabina.</b> Chapda kirish eshigi, 2 ta rakovina va ko'zgu, o'ngda unitazli kabina (mustahab bilan).</figcaption>
      <figure><img src="${await rasm('wc2')}"></figure>
      <figcaption><b>Hojatxona ichi — eshikdan sharqqa.</b> Chapda kabinalar, o'ngda taxorat joyi (3 ta jo'mrak), oldinda deraza (xira oyna).</figcaption>
    </div>
  </div>
</section></body></html>`;

const brauzer = await chromium.launch();
const p = await brauzer.newPage({ viewport: { width: 1587, height: 1123 }, deviceScaleFactor: 2 });
await p.setContent(await html(), { waitUntil: 'load' });
const nom = `Xadra_3-qavat_3D_${LOYIHA.versiya}`;
await p.pdf({ path: join(CHIQISH, `${nom}.pdf`), width: '420mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
await (await p.$('section.varaq')).screenshot({ path: join(CHIQISH, `${nom}.png`) });
await brauzer.close();
console.log('Tayyor:', join(CHIQISH, `${nom}.pdf`));
