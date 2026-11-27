// 2-qavat koworking sahnasi — interaktiv logotipli devor (fotozona): fasad chizmasi (o'lchamlar bilan) va 3D renderlar, A3 (PDF va PNG).
// Avval Blender renderlari tayyor bo'lishi kerak (blender-sahna.py → ../chizma/3d/).
//   node sahna-varaq.mjs
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { LOYIHA } from './model.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch {
  ({ chromium } = require(join(process.execPath, '../../lib/node_modules/playwright')));
}
const BU = dirname(fileURLToPath(import.meta.url));
const D3 = join(BU, '..', 'chizma', '3d');
const CHIQISH = join(BU, '..', 'chizma');

// devor (blender-sahna.py bilan bir xil): eni, balandligi, kompozitsiya (b — PRAZA 677, t — taroq), logotip
export const SAHNA_DEVOR = {
  en: 5900, bal: 3500, plintus: 150, chok: 8, planka: 120,
  seg: [['b', 0, 850], ['t', 850, 1450], ['b', 1450, 1750], ['b', 1750, 2050], ['b', 2050, 2350], ['b', 2350, 3550],
    ['b', 3550, 3850], ['b', 3850, 4150], ['b', 4150, 4450], ['t', 4450, 5050], ['b', 5050, 5900]],
  logo: { en: 1600, z: 2250 },
  rozetka: [425, 2150, 3750, 5475], rozetkaZ: 370,
};
const S = SAHNA_DEVOR;
const FAYL = { old: '1-togridan', qiya: '2-qiya', yaqin: '3-logotip-yaqin', old_led: '4-togridan-LED', yaqin_led: '5-logotip-yaqin-LED' };
const rasmFayl = nom => join(D3, `Xadra_2-qavat_koworking-sahna_${FAYL[nom]}.jpg`);
const rasm = async nom => `data:image/jpeg;base64,${(await readFile(rasmFayl(nom))).toString('base64')}`;
const m = v => (v / 1000).toFixed(2);

async function fasad() {
  const logoSvg = await readFile(join(BU, 'logo', 'pdp-academy-primary-yashil-academy.svg'), 'utf8');
  const [, , lw, lh] = logoSvg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const LW = S.logo.en, LH = LW * lh / lw, Y = z => S.bal - z;
  const q = [];
  q.push(`<rect x="0" y="0" width="${S.en}" height="${S.bal}" fill="#141414"/>`);                       // qora asos (choklar)
  for (const [t, a, b] of S.seg) {
    const a1 = a + (a > 0 ? S.chok / 2 : 0), b1 = b - (b < S.en ? S.chok / 2 : 0);
    if (t === 'b') q.push(`<rect x="${a1}" y="0" width="${b1 - a1}" height="${S.bal - S.plintus}" fill="url(#p677)"/>`);
    else {
      const n = Math.round((b1 - a1) / S.planka), w = (b1 - a1) / n;
      q.push(`<rect x="${a1}" y="0" width="${b1 - a1}" height="${S.bal - S.plintus}" fill="#6a4a33"/>`);
      for (let i = 0; i < n; i++) for (const [u1, u2, h] of [[0, 31.6, 1], [31.6, 44, 0], [44, 60, 1], [60, 72, 0], [72, 87, 1], [87, 100, 0], [100, 120, 1]]) {
        const k = w / S.planka;
        q.push(`<rect x="${a1 + i * w + u1 * k + 1}" y="0" width="${(u2 - u1) * k - 2}" height="${S.bal - S.plintus}" fill="${h ? '#7d5a3e' : '#5a3d2a'}"/>`);
      }
    }
  }
  q.push(`<rect x="0" y="${Y(S.plintus)}" width="${S.en}" height="${S.plintus}" fill="#d8d6d1" stroke="#999" stroke-width="4"/>`);
  for (const x of S.rozetka) q.push(`<rect x="${x - 75}" y="${Y(S.rozetkaZ + 40)}" width="150" height="80" rx="8" fill="#1d1d1d"/>`);
  q.push(`<image href="data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}" x="${S.en / 2 - LW / 2}" y="${Y(S.logo.z) - LH / 2}" width="${LW}" height="${LH}"/>`);
  // o'lchamlar
  const f = 'font-family="Liberation Sans, Arial" text-anchor="middle"', ch = '#333';
  const zan = (x1, x2, y, matn, fs = 95) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${ch}" stroke-width="5"/>
    <line x1="${x1}" y1="${y - 45}" x2="${x1}" y2="${y + 45}" stroke="${ch}" stroke-width="5"/><line x1="${x2}" y1="${y - 45}" x2="${x2}" y2="${y + 45}" stroke="${ch}" stroke-width="5"/>
    <line x1="${x1 - 25}" y1="${y + 25}" x2="${x1 + 25}" y2="${y - 25}" stroke="${ch}" stroke-width="9"/><line x1="${x2 - 25}" y1="${y + 25}" x2="${x2 + 25}" y2="${y - 25}" stroke="${ch}" stroke-width="9"/>
    <text x="${(x1 + x2) / 2}" y="${y - 30}" font-size="${fs}" ${f} fill="${ch}">${matn}</text>`;
  const tik = (x, y1, y2, matn) => `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${ch}" stroke-width="5"/>
    <line x1="${x - 45}" y1="${y1}" x2="${x + 45}" y2="${y1}" stroke="${ch}" stroke-width="5"/><line x1="${x - 45}" y1="${y2}" x2="${x + 45}" y2="${y2}" stroke="${ch}" stroke-width="5"/>
    <line x1="${x - 25}" y1="${y1 + 25}" x2="${x + 25}" y2="${y1 - 25}" stroke="${ch}" stroke-width="9"/><line x1="${x - 25}" y1="${y2 + 25}" x2="${x + 25}" y2="${y2 - 25}" stroke="${ch}" stroke-width="9"/>
    <text transform="translate(${x - 35} ${(y1 + y2) / 2}) rotate(-90)" font-size="95" ${f} fill="${ch}">${matn}</text>`;
  for (const [, a, b] of S.seg) q.push(zan(a, b, -170, b - a, 85));
  q.push(zan(0, S.en, -420, `${S.en} (devor eni)`, 105));
  q.push(zan(S.en / 2 - LW / 2, S.en / 2 + LW / 2, Y(S.logo.z) - LH / 2 - 120, `logotip ${LW}`, 85).replaceAll(`fill="${ch}"`, 'fill="#fff"').replaceAll(`stroke="${ch}"`, 'stroke="#fff"'));
  q.push(tik(S.en + 250, 0, S.bal, `${S.bal} (shiftgacha)`));
  q.push(tik(-200, Y(S.logo.z), S.bal, `${S.logo.z} (logo markazi)`));
  q.push(`<text x="${S.rozetka[0]}" y="${Y(S.rozetkaZ) + 160}" font-size="70" ${f} fill="#fff">rozetka +${S.rozetkaZ}</text>`);
  // belgilar: B / T
  const bel = (x, t) => `<circle cx="${x}" cy="${S.bal + 230}" r="95" fill="${t === 't' ? '#6a4a33' : '#d9b98c'}" stroke="#333" stroke-width="6"/>
    <text x="${x}" y="${S.bal + 262}" font-size="95" font-weight="700" ${f} fill="${t === 't' ? '#fff' : '#222'}">${t === 't' ? 'T' : 'B'}</text>`;
  for (const [t, a, b] of S.seg) q.push(bel((a + b) / 2, t));
  return `<svg viewBox="-450 -620 ${S.en + 900} ${S.bal + 980}" xmlns="http://www.w3.org/2000/svg">
    <defs><pattern id="p677" width="1200" height="2800" patternUnits="userSpaceOnUse"><rect width="1200" height="2800" fill="#d9b98c"/>
      ${Array.from({ length: 40 }, (_, i) => `<line x1="${i * 30 + 7}" y1="0" x2="${i * 30 + 12}" y2="2800" stroke="#c9a676" stroke-width="${3 + (i * 7) % 5}" opacity=".55"/>`).join('')}</pattern></defs>
    ${q.join('\n')}</svg>`;
}

const CSS = `
@page { size: 420mm 297mm; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
body { font-family: 'Liberation Sans', Arial, sans-serif; color: #222; }
.varaq { width: 420mm; height: 297mm; padding: 6mm 7mm; background: #fff; overflow: hidden; }
header { display: flex; justify-content: space-between; align-items: flex-end; height: 11mm; }
header .brend { font-size: 8pt; color: #6b6b6b; font-weight: 700; }
header h1 { font-size: 15pt; color: #1f1f1f; }
header .ong { text-align: right; font-size: 7.2pt; color: #555; }
.asosiy { display: grid; grid-template-columns: 1fr 128mm; gap: 4mm; margin-top: 2mm; }
figure img { display: block; width: 100%; border-radius: 1.2mm; }
figcaption { font-size: 7.4pt; color: #333; margin: 1mm 0 2.2mm; line-height: 1.3; }
figcaption b { color: #1f1f1f; }
.raqam { display: inline-block; min-width: 4.2mm; height: 4.2mm; line-height: 4.2mm; border-radius: 50%; background: #d6452f; color: #fff;
  font-size: 7pt; font-weight: 700; text-align: center; margin-right: 1.2mm; }
.fasad svg { display: block; width: 100%; height: auto; }
.izoh { font-size: 7pt; color: #333; line-height: 1.42; } .izoh b { color: #1f1f1f; } .izoh p { margin-bottom: 1.2mm; }
.namuna { display: flex; gap: 3mm; margin: 1mm 0 2mm; } .namuna div { font-size: 6.6pt; color: #444; text-align: center; }
.namuna img { width: 30mm; height: 22mm; object-fit: cover; border: .3mm solid #bbb; border-radius: .8mm; display: block; margin-bottom: .6mm; }
.led { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-top: 2mm; }
`;

const tekstura = async f => `data:image/jpeg;base64,${(await readFile(join(BU, 'teksturalar', f))).toString('base64')}`;
const izoh = async () => `<div class="izoh">
  <div class="namuna"><div><img src="${await tekstura('praza_677.jpg')}">B · PRAZA № 677</div><div><img src="${await tekstura('taroq.jpg')}" style="object-fit:fill">T · taroq (namuna)</div></div>
  <p><b>Devor:</b> ${m(S.en)} × ${m(S.bal)} m, polda sahna yo'q — faqat devor (fotozona, interaktiv joy). Kompozitsiya buyurtmachi chizmasi bo'yicha, simmetrik:
    bambuk ${m(850)} · taroq ${m(600)} · 3 ta tor B bo'lak ${m(300)} dan · markaz ${m(1200)} (logotip) · va teskari tartibda.</p>
  <p><b>B (bambuk)</b> — PRAZA № 677 devor paneli (1-qavat resepshndagi bilan bir xil). Bo'laklar orasidagi choklar ${S.chok} mm, qora (devorga qora asos yoki qora profil).
    <b>T (taroq)</b> — buyurtmachi namunasi: jigarrang qovurg'ali yog'och panel, baland va past qovurg'alar navbatma-navbat; planka ~${S.planka} mm, har tomonda 5 ta.</p>
  <p><b>Logotip:</b> hajmli harflar (qalinligi ~20 mm), devordan ~30 mm tayanchlarda; belgi — yashil halqa va sariq doira, PDP — qora, Academy — yashil (buyurtmachi namunasi).
    Eni ${m(S.logo.en)} m, markazi poldan ${m(S.logo.z)} m. LED variant (2-varaq): harflar ortidan devorga oq nur.</p>
  <p><b>Joyi — buyurtmachining fotosi bo'yicha:</b> alohida GKL devor; uning chizig'i ikki yonda shift ostidagi to'sin bo'lib davom etadi, ostida — shisha xonalar.
    Yonida qolgan joylar (to'sinlar yuzi, devor uchlari) ham PRAZA № 677. Mavjud och plintus (~${S.plintus} mm) qoladi.</p>
  <p><b>Chiroqlar:</b> mavjud osma dumaloq chiroqlar (foto); logotipga shiftdan 2 ta qora spot (taklif). Shift qora. Rozetkalar — fotodagi teshiklar o'rnida (+${S.rozetkaZ / 1000} m).</p>
  <p><b>Taxminlar (joyida aniqlanadi):</b> taroq plankasining aniq eni va uzunligi (3.42 m dan qisqa bo'lsa — yotiq chok joyi), tor B bo'laklar eni (chizmadan ${m(300)}), plintus rangi, spotlar soni. Pol — mavjud kulrang plitka (tozalangan, musorsiz).</p>
</div>`;

const html = async () => `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>Koworking sahnasi</title><style>${CSS}</style></head><body>
<section class="varaq">
  <header>
    <div><div class="brend">${LOYIHA.brend} · ${LOYIHA.filial}</div><h1>2-qavat koworking — sahna devori (logotipli interaktiv joy): fasad va 3D</h1></div>
    <div class="ong">${LOYIHA.versiya} · 27.11.2026<br>Buyurtmachi chizmasi, foto va namunalari bo'yicha</div>
  </header>
  <div class="asosiy">
    <div>
      <figure><img src="${await rasm('old')}"></figure>
      <figcaption><span class="raqam">1</span><b>To'g'ridan</b> — fotodagi nuqtadan (koworking tomondan, devor markazidan).</figcaption>
      <div class="fasad">${await fasad()}</div>
      <figcaption><b>Fasad (mm).</b> B — PRAZA № 677, T — taroq; choklar qora ${S.chok} mm; pastda plintus ${S.plintus} mm.</figcaption>
    </div>
    <div>
      <figure><img src="${await rasm('qiya')}"></figure>
      <figcaption><span class="raqam">2</span><b>Qiya ko'rinish</b> — o'ng tomondan (2-foto kabi): taroq qovurg'alari, tor bo'laklar, yon to'sin va shisha xona.</figcaption>
      <figure><img src="${await rasm('yaqin')}"></figure>
      <figcaption><span class="raqam">3</span><b>Logotip yaqindan</b> — hajmli harflar, spotlar bilan yoritilgan.</figcaption>
      ${await izoh()}
    </div>
  </div>
</section>
<section class="varaq">
  <header>
    <div><div class="brend">${LOYIHA.brend} · ${LOYIHA.filial}</div><h1>2-qavat koworking — sahna devori: logotip LED yoritgich bilan</h1></div>
    <div class="ong">${LOYIHA.versiya} · 27.11.2026<br>Harflar ortidan devorga oq LED nur (kechki va tadbir rejimi)</div>
  </header>
  <div class="led">
    <div><figure><img src="${await rasm('old_led')}"></figure><figcaption><span class="raqam">4</span><b>To'g'ridan, LED yoqilgan.</b></figcaption></div>
    <div><figure><img src="${await rasm('yaqin_led')}"></figure><figcaption><span class="raqam">5</span><b>Logotip yaqindan, LED yoqilgan.</b> Harflar old yuzi o'z rangida, ortidan devorga oq nur tushadi.</figcaption></div>
  </div>
</section></body></html>`;

if (!Object.keys(FAYL).every(n => existsSync(rasmFayl(n)))) { console.log('sahna-varaq: renderlar hali tayyor emas'); process.exit(0); }
const brauzer = await chromium.launch();
const p = await brauzer.newPage({ viewport: { width: 1587, height: 1123 }, deviceScaleFactor: 2 });
await p.setContent(await html(), { waitUntil: 'load' });
const nom = `Xadra_2-qavat_koworking-sahna_${LOYIHA.versiya}`;
await p.pdf({ path: join(CHIQISH, `${nom}.pdf`), width: '420mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
const vs = await p.$$('section.varaq');
await vs[0].screenshot({ path: join(CHIQISH, `${nom}.png`) });
await vs[1].screenshot({ path: join(CHIQISH, `${nom}_LED.png`) });
await brauzer.close();
console.log('tayyor:', nom);
