// SR4 ga koridorlar (K1, K2) kirgan joylar — yaqinlashtirilgan reja va o'lchamlar (PNG + PDF).
//   node sr4-koridor.mjs → ../chizma/Xadra_2-qavat_SR4_koridor_uchlari_<versiya>.png/.pdf
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { LOYIHA, XONALAR } from './model.mjs';
import { rejaSvg } from './reja-svg.mjs';
import { korsatkichlar } from './tekshiruv.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(join(process.execPath, '../../lib/node_modules/playwright'))); }
const BU = dirname(fileURLToPath(import.meta.url)), CH = join(BU, '..', 'chizma');

const X = k => XONALAR.find(r => r.kod === k);
const sr4 = X('SR4'), k1 = X('K1'), k2 = X('K2');
const LOGO = 100, DV = 100;                                 // logotipli GKL devor va SR4/koridor devori, mm
const chiz = sr4.x1;                                        // SR3/SR5 devori chizig'i — SR4 shu yerdan boshlanadi
const kir = k1.x2 - chiz;                                   // koridor SR4 ga kirgan chuqurlik
const o1 = { x1: chiz, x2: k1.x2 + LOGO, y1: k1.y1, y2: k1.y2 + DV };   // K1 uchi devorlari bilan
const o2 = { x1: chiz, x2: k2.x2 + LOGO, y1: k2.y1 - DV, y2: k2.y2 };   // K2 uchi
const m2 = r => ((r.x2 - r.x1) * (r.y2 - r.y1) / 1e6);
const A4 = korsatkichlar().find(k => k.kod === 'SR4').A, Atol = (sr4.x2 - sr4.x1) * (sr4.y2 - sr4.y1) / 1e6;
const f1 = v => v.toFixed(1), son = v => Math.round(v).toLocaleString('en-US').replace(/,/g, ' ');

const vb = { x1: 15900, y1: 6500, x2: 25000, y2: 17900 };
const T = (x, y, s, size, a = '') => `<text x="${x}" y="${y}" font-size="${size}" font-family="Liberation Sans, Arial" paint-order="stroke" stroke="#fff" stroke-width="${size * 0.28}" stroke-linejoin="round" ${a}>${s}</text>`;
// o'lcham chizig'i: gorizontal (y da) yoki vertikal (x da), nuqtalar va yozuvlar
function olcham(nuqtalar, joy, gor, rang = '#b3261e', yozuvlar = null, size = 170) {
  const q = [];
  const P = v => gor ? [v, joy] : [joy, v];
  const [a, b] = [P(nuqtalar[0]), P(nuqtalar.at(-1))];
  q.push(`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${rang}" stroke-width="14"/>`);
  nuqtalar.forEach(v => { const [x, y] = P(v); q.push(`<line x1="${x - 60}" y1="${y + 60}" x2="${x + 60}" y2="${y - 60}" stroke="${rang}" stroke-width="22"/>`); });
  for (let i = 1; i < nuqtalar.length; i++) {
    const m = (nuqtalar[i - 1] + nuqtalar[i]) / 2, s = (yozuvlar && yozuvlar[i - 1]) ?? son(nuqtalar[i] - nuqtalar[i - 1]);
    if (!s) continue;
    q.push(gor ? T(m, joy - 70, s, size, `text-anchor="middle" fill="${rang}" font-weight="700"`)
      : T(joy - 70, m, s, size, `text-anchor="middle" fill="${rang}" font-weight="700" transform="rotate(-90 ${joy - 70} ${m})"`));
  }
  return q.join('');
}
const q = [];
q.push(`<defs><pattern id="shtrix" patternUnits="userSpaceOnUse" width="160" height="160" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="160" stroke="#b3261e" stroke-width="28"/></pattern></defs>`);
[o1, o2].forEach(o => q.push(`<rect x="${o.x1}" y="${o.y1}" width="${o.x2 - o.x1}" height="${o.y2 - o.y1}" fill="#b3261e" fill-opacity=".13"/>`,
  `<rect x="${o.x1}" y="${o.y1}" width="${o.x2 - o.x1}" height="${o.y2 - o.y1}" fill="url(#shtrix)" opacity=".35"/>`,
  `<rect x="${o.x1}" y="${o.y1}" width="${o.x2 - o.x1}" height="${o.y2 - o.y1}" fill="none" stroke="#b3261e" stroke-width="30"/>`));
// SR4 ning to'liq chegarasi (koridorlar kirmaganda)
q.push(`<line x1="${chiz}" y1="${sr4.y1}" x2="${chiz}" y2="${sr4.y2}" stroke="#b3261e" stroke-width="20" stroke-dasharray="120 80"/>`);
// o'lchamlar: K1 uchi
q.push(olcham([chiz, k1.x2, k1.x2 + LOGO], o1.y2 + 330, true, '#b3261e', [son(kir), '']),
  olcham([chiz, k1.x2 + LOGO], o1.y2 + 700, true, '#b3261e', [''], 150), T(o1.x2 + 140, o1.y2 + 750, `${son(kir + LOGO)} — devor bilan`, 150, 'fill="#b3261e" font-weight="700"'),
  olcham([k1.y1, k1.y2, k1.y2 + DV], chiz - 450, false, '#b3261e', [son(k1.y2 - k1.y1), '']),
  // K2 uchi
  olcham([chiz, k2.x2, k2.x2 + LOGO], o2.y1 - 330 + 140, true, '#b3261e', [son(kir), '']),
  olcham([chiz, k2.x2 + LOGO], o2.y1 - 700 + 140, true, '#b3261e', [''], 150), T(o2.x2 + 140, o2.y1 - 560 + 50, `${son(kir + LOGO)} — devor bilan`, 150, 'fill="#b3261e" font-weight="700"'),
  olcham([k2.y1 - DV, k2.y1, k2.y2], chiz - 450, false, '#b3261e', ['', son(k2.y2 - k2.y1)]),
  // SR4 umumiy
  olcham([sr4.y1, sr4.y2], sr4.x2 + 650, false, '#1F3657', null, 180),
  olcham([chiz, sr4.x2], sr4.y2 + 600, true, '#1F3657', [`${son(sr4.x2 - chiz)} (koridorlar kirmasa)`], 170),
  olcham([o1.x2, sr4.x2], (o1.y1 + o1.y2) / 2 + 60, true, '#1F3657', [`${son(sr4.x2 - o1.x2)} — tor qism`], 150),
  olcham([o2.x2, sr4.x2], (o2.y1 + o2.y2) / 2 + 60, true, '#1F3657', [`${son(sr4.x2 - o2.x2)} — tor qism`], 150));
// yozuvlar
[[o1, 'K1 uchi', o1.y1 + 420], [o2, 'K2 uchi', o2.y2 - 260]].forEach(([o, n, y]) =>
  q.push(T(o.x2 + 220, y, `${n}: ${son(o.x2 - o.x1)} × ${son(o.y2 - o.y1)} = ${f1(m2(o))} m²`, 170, 'fill="#b3261e" font-weight="700"')));
q.push(T(chiz + 170, 11000, "SR3/SR5 devori chizig'i", 140, `text-anchor="middle" fill="#b3261e" transform="rotate(-90 ${chiz + 170} 11000)"`),
  T(21800, 13900, `koridorlar kirmasa — ${f1(Atol)} m²`, 170, 'text-anchor="middle" fill="#1F3657" font-weight="700"'),
  T(17300, (k1.y1 + k1.y2) / 2 + 60, 'K1', 260, 'text-anchor="middle" fill="#555" font-weight="700"'),
  T(17300, (k2.y1 + k2.y2) / 2 + 60, 'K2', 260, 'text-anchor="middle" fill="#555" font-weight="700"'),
  '');

const svg = rejaSvg({ rejim: 'jihoz', vb, ustunKod: true }).replace(/<\/svg>\s*$/, q.join('') + '</svg>');
const html = `<!doctype html><html lang="uz"><head><meta charset="utf-8"><style>
@page { size: 297mm 297mm; margin: 0 } * { box-sizing: border-box; margin: 0; padding: 0 }
body { font-family: 'Liberation Sans', Arial, sans-serif; color: #222; }
.varaq { width: 297mm; height: 297mm; padding: 8mm 9mm; }
header { border-bottom: .4mm solid #1F3657; padding-bottom: 1.5mm; display: flex; justify-content: space-between; align-items: flex-end; }
header .b { font-size: 8pt; color: #6b6b6b; font-weight: 700; } h1 { font-size: 15pt; color: #1F3657; } .o { font-size: 7.4pt; color: #555; text-align: right; }
.ram { margin-top: 3mm; border: .3mm solid #ccc; border-radius: 1mm; height: 222mm; } .ram svg { width: 100%; height: 100%; display: block; }
table { width: 100%; border-collapse: collapse; font-size: 8.4pt; margin-top: 3mm; } td, th { padding: 1mm 1.6mm; border-bottom: .2mm solid #ddd; text-align: left; }
th { background: #1F3657; color: #fff; } td.r, th.r { text-align: right; } tr.j td { font-weight: 700; background: #f2f2f2; }
p { font-size: 7.6pt; color: #444; margin-top: 1.6mm; line-height: 1.35; }
</style></head><body><section class="varaq">
<header><div><div class="b">${LOYIHA.brend} · ${LOYIHA.filial} · 2-qavat</div><h1>SR4 ga koridorlar kirgan joylar (K1 va K2 uchlari), 1:75</h1></div>
<div class="o">${LOYIHA.versiya} · ${LOYIHA.sana}<br>o'lchamlar mm da, chizma fotosidan — joyida tekshiriladi</div></header>
<div class="ram">${svg}</div>
<table><tr><th>Joy</th><th class="r">Koridor SR4 ichiga</th><th class="r">Koridor eni</th><th class="r">Koridor polining maydoni</th><th class="r">Devorlari bilan</th></tr>
<tr><td>K1 uchi (SR4 ning yuqori chap burchagi)</td><td class="r">${son(kir)} mm</td><td class="r">${son(k1.y2 - k1.y1)} mm</td><td class="r">${(kir * (k1.y2 - k1.y1) / 1e6).toFixed(2)} m²</td><td class="r">${son(o1.x2 - o1.x1)} × ${son(o1.y2 - o1.y1)} = ${f1(m2(o1))} m²</td></tr>
<tr><td>K2 uchi (SR4 ning pastki chap burchagi)</td><td class="r">${son(kir)} mm</td><td class="r">${son(k2.y2 - k2.y1)} mm</td><td class="r">${(kir * (k2.y2 - k2.y1) / 1e6).toFixed(2)} m²</td><td class="r">${son(o2.x2 - o2.x1)} × ${son(o2.y2 - o2.y1)} = ${f1(m2(o2))} m²</td></tr>
<tr class="j"><td>Jami SR4 dan</td><td></td><td></td><td class="r">${(2 * kir * (k1.y2 - k1.y1) / 1e6).toFixed(2)} m²</td><td class="r">${f1(m2(o1) + m2(o2))} m²</td></tr></table>
<p>Qizil shtrix — koridor uchi va uni o'rab turgan 100 mm GKL devorlar (koridor oxiridagi logotipli devor va SR4 bilan koridor orasidagi devor). Qizil punktir — SR3/SR5 devori chizig'i: koridorlar shu yerda tugasa, SR4 ${son(sr4.x2 - chiz)} × ${son(sr4.y2 - sr4.y1)} mm to'g'ri to'rtburchak (${f1(Atol)} m²) bo'ladi; hozir ${f1(A4)} m², ikki chetidagi ${son(o1.y2 - o1.y1)} mm lik qismlarda eni ${son(sr4.x2 - o1.x2)} mm.</p>
</section></body></html>`;

const V = LOYIHA.versiya, nom = join(CH, `Xadra_2-qavat_SR4_koridor_uchlari_${V}`);
const brauzer = await chromium.launch();
const p = await brauzer.newPage({ viewport: { width: 1123, height: 1123 }, deviceScaleFactor: 2 });
await p.setContent(html, { waitUntil: 'load' });
await p.pdf({ path: nom + '.pdf', width: '297mm', height: '297mm', printBackground: true });
await (await p.$('section.varaq')).screenshot({ path: nom + '.png' });
await brauzer.close();
console.log(nom + '.png');
