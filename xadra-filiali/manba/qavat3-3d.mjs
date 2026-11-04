// 3-qavat 3D ko'rinishlari — A3 landshaft varaq (PDF va PNG).
// Avval Blender renderlari tayyor bo'lishi kerak (blender3.py → ../chizma/3d/).
//   node qavat3-3d.mjs
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { LOYIHA } from './model.mjs';
import { sinf3Korsatkich, BINO3, q3Svg } from './qavat3.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch {
  ({ chromium } = require(join(process.execPath, '../../lib/node_modules/playwright')));
}
const BU = dirname(fileURLToPath(import.meta.url));
const D3 = join(BU, '..', 'chizma', '3d');
const CHIQISH = join(BU, '..', 'chizma');

const FAYL = { umumiy: '1-umumiy', sinf: '2-sinf-doska', wc1: '3-hojatxona-rakovinalar', wc2: '4-hojatxona-taxorat', wc3: '5-hojatxona-supadan' };
const rasmFayl = (nom, panel = null, yopiq = false) => join(D3, `Xadra_3-qavat_3D${panel ? `_WC-panel-${panel}` : ''}${yopiq ? '_yopiq' : ''}_${FAYL[nom]}.jpg`);
const rasm = async (nom, panel = null, yopiq = false) => `data:image/jpeg;base64,${(await readFile(rasmFayl(nom, panel, yopiq))).toString('base64')}`;
const tekstura = async n => `data:image/jpeg;base64,${(await readFile(join(BU, 'teksturalar', `wc_panel_${n}.jpg`))).toString('base64')}`;
const { belgi, kamera } = JSON.parse(await readFile(join(D3, 'umumiy-belgilar.json'), 'utf8'));

// kalit reja: 3-qavat rejasi ustida ichki ko'rinishlar kameralari (raqam — rasm raqami)
function kalitReja(kameralar = [['2', 'kamera_sinf'], ['3', 'kamera_hojatxona_1'], ['4', 'kamera_hojatxona_2']], vb = { x1: -200, y1: -200, x2: 12050, y2: 12500 }, d = 1500) {
  const svg = q3Svg({ olcham: false, vb });
  const k = kameralar.filter(([, nom]) => kamera[nom]).map(([n, nom]) => {
    const [[x, y], [tx, ty]] = kamera[nom];
    const L = Math.hypot(tx - x, ty - y), ux = (tx - x) / L, uy = (ty - y) / L;
    const ex = x + ux * d, ey = y + uy * d, px = -uy, py = ux;
    return `<line x1="${x}" y1="${y}" x2="${ex}" y2="${ey}" stroke="#d6452f" stroke-width="70"/>
      <path d="M${ex + ux * 260},${ey + uy * 260} L${ex + px * 200},${ey + py * 200} L${ex - px * 200},${ey - py * 200} Z" fill="#d6452f"/>
      <circle cx="${x}" cy="${y}" r="300" fill="#d6452f" stroke="#fff" stroke-width="50"/>
      <text x="${x}" y="${y + 120}" font-size="340" font-weight="700" fill="#fff" text-anchor="middle" font-family="Liberation Sans, Arial">${n}</text>`;
  }).join('');
  return svg.replace('</svg>', `${k}</svg>`);
}
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
.past { display: grid; grid-template-columns: 62mm 1fr; gap: 5mm; margin-top: 1mm; }
.kalit svg { display: block; width: 62mm; height: auto; }
.kalit div { font-size: 6.8pt; color: #555; margin-top: .8mm; }
.izoh { grid-template-columns: 1fr; gap: 0; align-content: start; }
.raqam { display: inline-block; min-width: 4.2mm; height: 4.2mm; line-height: 4.2mm; border-radius: 50%; background: #d6452f; color: #fff;
  font-size: 7pt; font-weight: 700; text-align: center; margin-right: 1.2mm; }
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
      <figcaption><span class="raqam">1</span><b>Umumiy ko'rinish</b> — janubi-g'arbdan, shift olib tashlangan, devorlar 2.7 m da kesilgan. Bino ${BINO3.L / 1000} × ${BINO3.B / 1000} m, umumiy ${BINO3.umumiy} m².</figcaption>
      <div class="past">
      <div class="kalit">${kalitReja()}<div>Kamera nuqtalari: 2 — sinf, 3 va 4 — hojatxona</div></div>
      <div class="izoh">
        <div>
          <p><b>5-xona — o'quv xonasi.</b> ${k.parta} ta ikki kishilik parta (140 × 60 sm), 4 qator × 3, ${k.orin} o'rin. Interaktiv doska shimoliy devorda, eshikdan kirganda chapda; ikki yonida oq doska. Ustoz stoli deraza tomonda. Bambuk panel 3 devorda, 2.5 m gacha (doska devori, orqa devor, eshikli devor). Eshik shisha, matli polosa bilan. Konditsioner orqa devorda.</p>
          <p><b>2-xona — erkaklar hojatxonasi (03.11).</b> Kirganda chapda 1.50 m quyma rakovina (2 ta chanoq), ko'zgu va qo'l quritgich, so'ng unitazli kabina. Eshikdan 2.50 m dan keyin supa +0.15 (usti kafel): chashagenli 3 ta kabina g'isht supada +0.30, janubiy devor bo'ylab taxorat lotogi (ariqcha va g'isht labi, 3 ta jo'mrak); har kabinada mustahab, eshik yonida va supada trap. Joyidagi foto bo'yicha (04.11): baland lenta derazalar, sharqiy devorda radiator va konditsioner, mavjud PVX reykali shift. Devorlar — plastik marmar panel, 3 variant keyingi varaqlarda (bu varaqda — kafel bilan).</p>
        </div>
        <div>
          <p><b>Taxminlar (joyida aniqlanadi).</b> Shift balandligi 3.5 m (bino balandligi). Derazalar joyi va o'lchami (tokcha 0.9 m, tepasi 2.6 m) chizma fotosidan taxminiy; hojatxonada — joyidagi fotodan: derazalar tokchasi ~1.85 m, shift ~3.0 m (mavjud PVX reyka). Kabina to'siqlari HPL, 2.0 m balandlikda. Chashagenlar supaga botirilgan. Pol, kafel va jihozlar rangi — namuna uchun, tanlovga qarab o'zgaradi. Ko'zgu va qo'l quritgich xarajatlar jadvalida yo'q — ko'rinish uchun qo'yilgan.</p>
          <p><b>Fayllar.</b> chizma/3d/: har bir ko'rinishning rasmi (JPG) va Xadra_3-qavat.blend (Blender 4.2, 4 ta kamera). Sahna manba/blender3.py dan qayta yig'iladi.</p>
        </div>
      </div>
      </div>
    </div>
    <div>
      <figure><img src="${await rasm('sinf')}"></figure>
      <figcaption><span class="raqam">2</span><b>5-xona → doska.</b> Orqa qatordan: interaktiv doska, bambuk panel, o'ngda derazalar va ustoz stoli.</figcaption>
      <figure><img src="${await rasm('wc1')}"></figure>
      <figcaption><span class="raqam">3</span><b>Hojatxona ichi — quyma rakovina va 1-kabina.</b> Chapda kirish eshigi, 1.50 m quyma rakovina va ko'zgu, o'ngda unitazli kabina (mustahab bilan).</figcaption>
      <figure><img src="${await rasm('wc2')}"></figure>
      <figcaption><span class="raqam">4</span><b>Hojatxona ichi — eshikdan sharqqa.</b> Supa (+0.15) va kabinalar supasi (+0.30): chapda chashagenli kabinalar, o'ngda taxorat lotogi (3 ta jo'mrak), oldinda radiator, deraza va konditsioner.</figcaption>
    </div>
  </div>
</section></body></html>`;

// 2-varaq (03.11): hojatxona devorlari — buyurtmachi ko'rgan 3 xil plastik marmar panel, har biri 3 ko'rinishda
const PANEL = [
  [1, "Och bej, yaltiroq", "Bir tekis och bej, ingichka tik tola naqshi; yaltiroq sirt. Eng sokin variant."],
  [2, "Oq marmar, jigarrang tomirli", "Oq fonda jigarrang-kulrang yirik tomirlar (Calacatta uslubi); yaltiroq. Eng hashamatli ko'rinish."],
  [3, "Oq marmar, kulrang tomirli", "Oq fonda ingichka kulrang tomirlar (Carrara uslubi); yarim mat, mayda tekstura — suv izi kam ko'rinadi."],
];
const CSS2 = `.p2 { display: grid; grid-template-columns: 64mm 1fr 1fr 1fr; gap: 4mm; margin-top: 2mm; }
.p2 .ust { display: grid; grid-template-columns: 22mm 1fr; gap: 2.5mm; align-items: center; margin-bottom: 1.5mm; height: 30mm; }
.p2 .ust img { width: 22mm; height: 30mm; object-fit: cover; border: .3mm solid #bbb; border-radius: .8mm; }
.p2 .ust h2 { font-size: 10.5pt; color: #1f1f1f; } .p2 .ust p { font-size: 6.9pt; color: #444; line-height: 1.35; margin-top: .8mm; }
.p2 figure img { border-radius: .8mm; } .p2 figcaption { font-size: 6.6pt; margin: .5mm 0 1.6mm; }
.p2 .chap { font-size: 7pt; color: #333; line-height: 1.4; } .p2 .chap b { color: #1f1f1f; } .p2 .chap p { margin-bottom: 1.4mm; }
.p2 .kalit svg { width: 64mm; }`;
const panelVaraq = async (yopiq = false) => {
  if (!PANEL.every(([n]) => ['wc1', 'wc2', 'wc3'].every(v => existsSync(rasmFayl(v, n, yopiq))))) return '';
  const IZ = { wc1: "eshikdan kirganda — quyma rakovina va unitazli kabina", wc2: "eshikdan supaga — chashagenli kabinalar va taxorat lotogi", wc3: "supadan eshik tomonga" };
  const ustun = async ([n, nom, izoh]) => `<div><div class="ust"><img src="${await tekstura(n)}"><div><h2>${n}-variant · ${nom}</h2><p>${izoh}</p></div></div>
    ${(await Promise.all(['wc1', 'wc2', 'wc3'].map(async (v, i) => `<figure><img src="${await rasm(v, n, yopiq)}"></figure><figcaption><span class="raqam">${i + 1}</span>${IZ[v]}</figcaption>`))).join('')}</div>`;
  return `<section class="varaq">
  <header>
    <div><div class="brend">${LOYIHA.brend} · ${LOYIHA.filial}</div><h1>3-qavat hojatxonasi — devor panellari: 3 variant (3D)${yopiq ? ' · kabina eshiklari yopiq' : ''}</h1></div>
    <div class="ong">${LOYIHA.versiya} · 04.11.2026<br>Panellar — buyurtmachi ko'rgan namunalar (rasmdan); xona — joyidagi foto bo'yicha</div>
  </header>
  <div class="p2">
    <div class="chap">
      <div class="kalit">${kalitReja([['1', 'kamera_hojatxona_1'], ['2', 'kamera_hojatxona_2'], ['3', 'kamera_hojatxona_3']], { x1: 5600, y1: -300, x2: 12000, y2: 3600 }, 900)}</div>
      <p style="margin-top:1.5mm"><b>Kamera nuqtalari</b> — har variantda bir xil (1, 2, 3).${yopiq ? ' Bu varaqda kabina eshiklari yopiq; ochiq holati — oldingi varaqda.' : ''}</p>
      <p><b>Hojatxona (joyidagi foto bo'yicha, 04.11):</b> kirganda chapda 1.50 m quyma rakovina, so'ng unitazli kabina (1.00 m). Eshikdan 2.50 m dan keyin supa +0.15 (usti kafel); 3 ta chashagenli kabina g'isht supada +0.30; janubiy devor bo'ylab taxorat lotogi — ariqcha va g'isht labi, 3 ta jo'mrak. Sharqiy devorda radiator va konditsioner, derazalar baland (tokcha ~1.85 m), shift — mavjud PVX reyka, 4 ta dumaloq chiroq.</p>
      <p><b>Panel:</b> plastik (PVX) marmar list, ~1.22 × 2.8 m, poldan shiftgacha (derazalar ostida — tokchagacha); choklari ingichka. Pol, supa va lotok — kafel, kabinalar — kulrang HPL.</p>
      <p><b>Eslatma:</b> panel teksturasi buyurtmachi yuborgan rasmlardan olingan — rang va naqsh taxminan; yaltirashi (1, 2 — yaltiroq, 3 — yarim mat) do'kondagi namunaga qarab.</p>
    </div>
    ${(await Promise.all(PANEL.map(ustun))).join('')}
  </div>
</section>`;
};

const brauzer = await chromium.launch();
const p = await brauzer.newPage({ viewport: { width: 1587, height: 1123 }, deviceScaleFactor: 2 });
const v2 = (await panelVaraq()) + (await panelVaraq(true));
await p.setContent((await html()).replace('</body></html>', `${v2}</body></html>`).replace('</style>', `${CSS2}</style>`), { waitUntil: 'load' });
const nom = `Xadra_3-qavat_3D_${LOYIHA.versiya}`;
await p.pdf({ path: join(CHIQISH, `${nom}.pdf`), width: '420mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
const vs = await p.$$('section.varaq');
await vs[0].screenshot({ path: join(CHIQISH, `${nom}.png`) });
if (vs[1]) {
  await vs[1].screenshot({ path: join(CHIQISH, `Xadra_3-qavat_WC_panellar_${LOYIHA.versiya}.png`) });
  if (vs[2]) await vs[2].screenshot({ path: join(CHIQISH, `Xadra_3-qavat_WC_panellar_yopiq_${LOYIHA.versiya}.png`) });
  // alohida PDF — faqat panellar varaqlari (ochiq va yopiq eshiklar; yuborish uchun)
  const p2 = await brauzer.newPage({ viewport: { width: 1587, height: 1123 } });
  await p2.setContent(`<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>3-qavat hojatxona — panellar</title><style>${CSS}${CSS2}</style></head><body>${v2}</body></html>`, { waitUntil: 'load' });
  await p2.pdf({ path: join(CHIQISH, `Xadra_3-qavat_WC_panellar_${LOYIHA.versiya}.pdf`), width: '420mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
}
await brauzer.close();
console.log('Tayyor:', join(CHIQISH, `${nom}.pdf`));
