// 2-qavat: ustalar uchun o'lchamli ish chizmasi (A3, 2 varaq) — devorlar, shisha devorlar va eshiklar.
//   1-varaq (1:100): butun qavat — devor turlari, o'qlar, xonalarning ichki o'lchamlari, yangi devorlar va bo'shliqlarni
//                    yopish joylari o'lcham zanjirlari bilan; umumiy talablar va joyida tekshiriladiganlar.
//   2-varaq (1:50):  K1, K2 koridorlari va xizmat xonalari (XZ1–XZ4) — har bir shisha bo'lagi, eshik va GKL bo'lagi
//                    o'lcham zanjirida; eshiklar, shisha devorlar va GKL jadvallari; shisha devorning tipik yoyilmasi.
// Barcha o'lchamlar mm da; boshlanish nuqtasi — mavjud devor yuzasi yoki ustun yuzasi (o'qlar — ustunlar markazi).
//   node ish-chizma.mjs → ../chizma/Xadra_2-qavat_ish_chizmasi_<versiya>.pdf va -1.png, -2.png
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { PDFDocument } from 'pdf-lib';
import { LOYIHA, H, ICHKI, DEVOR, DEVORLAR, ESHIKLAR, USTUNLAR, XONALAR, OQLAR, ZINALAR, DERAZALAR, PANJARA } from './model.mjs';
import { xonaMaydoni } from './tekshiruv.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(join(process.execPath, '../../lib/node_modules/playwright'))); }
const BU = dirname(fileURLToPath(import.meta.url)), CH = join(BU, '..', 'chizma');

// ---------- balandliklar (buyurtmachi va loyiha qarorlari) ----------
export const BAL = { shift: H, shisha: 2500, eshik: 2100, matDan: 1000, matGacha: 1600 };
const son = v => Math.round(v).toLocaleString('en-US').replace(/,/g, ' ');
const RANG = { mavjud: '#5b6270', gkl: '#e8913a', shisha: '#cfe8f7', shishaCh: '#2f7fbf', buz: '#c62828', matn: '#1d2733', olcham: '#1d2733', oq: '#9aa3ad' };
const NOM = {
  SR1: '1-xona', SR2: '2-xona', SR3: '3-xona', SR4: '4-xona', SR5: '5-xona', SR6: '6-xona', SR7: '7-xona',
  XZ1: 'XZ1 · sotuv', XZ2: 'XZ2 · admin', XZ3: 'XZ3 · ustozlar', XZ4: 'XZ4 · call-markaz', KW: 'Koworking', X12: 'CEO',
  K1: 'K1', K2: 'K2', ZL: 'Kirish zali', ZN1: 'ZN1', ZN2: 'ZN2',
};

// ---------- belgilash: yangi elementlarga kod ----------
const YANGI = DEVORLAR.filter(w => w.holat === 'yangi');
const SHISHA = YANGI.filter(w => w.shisha).sort((a, b) => a.y1 - b.y1 || a.x1 - b.x1).map((w, i) => ({ ...w, id: `S${i + 1}` }));
const GKL = YANGI.filter(w => !w.shisha).sort((a, b) => (a.x2 - a.x1 > a.y2 - a.y1 ? 0 : 1) - (b.x2 - b.x1 > b.y2 - b.y1 ? 0 : 1) || a.y1 - b.y1 || a.x1 - b.x1)
  .map((w, i) => ({ ...w, id: `G${i + 1}` }));
const ESH = ESHIKLAR.filter(e => e.holat === 'yangi').map((e, i) => ({ ...e, id: `E${i + 1}` }));
const uz = w => Math.max(w.x2 - w.x1, w.y2 - w.y1), qal = w => Math.min(w.x2 - w.x1, w.y2 - w.y1);
const gor = w => w.x2 - w.x1 >= w.y2 - w.y1;
// eshik qaysi koridor / xona chizig'ida (matn uchun)
const CHIZIQ = { 7700: "K1 shimoliy devori", 9300: "K1 janubiy devori", 15000: "K2 shimoliy devori", 16600: "K2 janubiy devori" };
const chiziqNomi = w => CHIZIQ[w.y1] || CHIZIQ[w.yuz] || (gor(w) ? `y ${son(w.y1)}–${son(w.y2)}` : `x ${son(w.x1)}–${son(w.x2)} o'qida`);

// ---------- chizish yordamchilari ----------
const T = (x, y, s, size, a = '') => `<text x="${x}" y="${y}" font-size="${size}" font-family="Liberation Sans, Arial" paint-order="stroke" stroke="#fff" stroke-width="${size * 0.26}" stroke-linejoin="round" ${a}>${s}</text>`;
const R = (r, a) => `<rect x="${r.x1}" y="${r.y1}" width="${r.x2 - r.x1}" height="${r.y2 - r.y1}" ${a}/>`;
// o'lcham zanjiri: nuqtalar bo'ylab; gorizontal (joy — y) yoki vertikal (joy — x); qisqa bo'laklar yozuvi navbat bilan narigi tomonda
function zanjir(nuqtalar, joy, gorz, k, { tomon = -1, rang = RANG.olcham, size = 1, yozuv = null } = {}) {
  const P = [...new Set(nuqtalar)].sort((a, b) => a - b), q = [];
  const t = 95 * k * size, sw = 6 * k;
  const pt = v => (gorz ? [v, joy] : [joy, v]);
  const [a, b] = [pt(P[0]), pt(P.at(-1))];
  q.push(`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${rang}" stroke-width="${sw}"/>`);
  P.forEach(v => {
    const [x, y] = pt(v), d = 45 * k;
    q.push(`<line x1="${x - d}" y1="${y + d}" x2="${x + d}" y2="${y - d}" stroke="${rang}" stroke-width="${sw * 2}"/>`,
      gorz ? `<line x1="${x}" y1="${y - 90 * k}" x2="${x}" y2="${y + 90 * k}" stroke="${rang}" stroke-width="${sw}"/>`
        : `<line x1="${x - 90 * k}" y1="${y}" x2="${x + 90 * k}" y2="${y}" stroke="${rang}" stroke-width="${sw}"/>`);
  });
  let alt = false;
  const yon = (oddiy) => (oddiy === (tomon < 0)) ? (gorz ? joy - t * 0.45 : joy - t * 0.4) : (gorz ? joy + t * 1.1 : joy + t * 1.0);
  for (let i = 1; i < P.length; i++) {
    const L = P[i] - P[i - 1], m = (P[i] + P[i - 1]) / 2, s = yozuv ? yozuv(P[i - 1], P[i]) : son(L);
    if (s === '' || s === null) continue;
    const qisqa = L < String(s).length * t * 0.6 + 40;
    const oddiy = qisqa ? !(alt = !alt) : true;          // qisqa bo'laklarda yozuv navbat bilan narigi tomonga
    if (!qisqa) alt = false;
    const v = yon(oddiy);
    if (gorz) q.push(T(m, v, s, t, `text-anchor="middle" fill="${rang}"`));
    else q.push(T(v, m, s, t, `text-anchor="middle" fill="${rang}" transform="rotate(-90 ${v} ${m})"`));
  }
  return q.join('');
}

// ---------- asos: devorlar, eshiklar, ustunlar, o'qlar, xonalar ----------
function asos(vb, k, { oqlar = true, xonaYozuv = true, kodlar = false } = {}) {
  const q = [];
  q.push(`<defs><pattern id="gklsh" patternUnits="userSpaceOnUse" width="${70 * k}" height="${70 * k}" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="${70 * k}" stroke="#a85a12" stroke-width="${14 * k}"/></pattern>
    <pattern id="buzsh" patternUnits="userSpaceOnUse" width="${90 * k}" height="${90 * k}" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="${90 * k}" stroke="${RANG.buz}" stroke-width="${10 * k}"/></pattern></defs>`);
  q.push(R({ x1: -DEVOR.chap, y1: -DEVOR.yuqori, x2: ICHKI.x + DEVOR.ong, y2: ICHKI.y + DEVOR.past }, 'fill="#fff"'));
  // xonalar foni
  XONALAR.forEach(x => q.push(R(x, `fill="${x.tur === 'sanuzel' ? '#f1f1ef' : '#fbfaf7'}"`)));
  ZINALAR.forEach(z => q.push(R(z, 'fill="#f1f1ef"')));
  // o'qlar
  if (oqlar) {
    OQLAR.x.forEach(([n, x]) => q.push(`<line x1="${x}" y1="${vb.y1 + 350 * k}" x2="${x}" y2="${vb.y2 - 350 * k}" stroke="${RANG.oq}" stroke-width="${5 * k}" stroke-dasharray="${160 * k} ${50 * k} ${30 * k} ${50 * k}"/>`));
    OQLAR.y.forEach(([n, y]) => q.push(`<line x1="${vb.x1 + 350 * k}" y1="${y}" x2="${vb.x2 - 350 * k}" y2="${y}" stroke="${RANG.oq}" stroke-width="${5 * k}" stroke-dasharray="${160 * k} ${50 * k} ${30 * k} ${50 * k}"/>`));
  }
  // devorlar
  DEVORLAR.forEach(w => {
    if (w.holat === 'buziladi') q.push(R(w, `fill="url(#buzsh)" stroke="${RANG.buz}" stroke-width="${8 * k}" stroke-dasharray="${40 * k} ${25 * k}"`));
    else if (w.shisha) q.push(R(w, `fill="${RANG.shisha}" stroke="${RANG.shishaCh}" stroke-width="${7 * k}"`),
      gor(w) ? `<line x1="${w.x1}" y1="${(w.y1 + w.y2) / 2}" x2="${w.x2}" y2="${(w.y1 + w.y2) / 2}" stroke="${RANG.shishaCh}" stroke-width="${6 * k}"/>`
        : `<line x1="${(w.x1 + w.x2) / 2}" y1="${w.y1}" x2="${(w.x1 + w.x2) / 2}" y2="${w.y2}" stroke="${RANG.shishaCh}" stroke-width="${6 * k}"/>`);
    else if (w.holat === 'yangi') q.push(R(w, `fill="#fde3c4" stroke="${RANG.gkl}" stroke-width="${7 * k}"`), R(w, 'fill="url(#gklsh)"'));
    else q.push(R(w, `fill="${RANG.mavjud}"`));
  });
  // derazalar (fasad)
  DERAZALAR.forEach(d => q.push(R(d, `fill="#eef6fc" stroke="#7aa7c7" stroke-width="${5 * k}"`)));
  // ustunlar
  USTUNLAR.forEach(u => q.push(R(u, u.holat === 'taxminiy' ? `fill="#fff" stroke="#111" stroke-width="${12 * k}" stroke-dasharray="${40 * k} ${25 * k}"` : 'fill="#111"')));
  // eshiklar: tabaqa va ochilish yoyi
  ESHIKLAR.forEach(e => {
    const yangi = e.holat === 'yangi', w = e.b - e.a, rang = yangi ? RANG.shishaCh : '#555';
    if (e.devor === 'h') {
      const hx = e.ilgak === 'a' ? e.a : e.b, ox = e.ilgak === 'a' ? e.b : e.a, y = e.yuz, yy = y + e.yon * w;
      q.push(`<line x1="${hx}" y1="${y}" x2="${hx}" y2="${yy}" stroke="${rang}" stroke-width="${18 * k}"/>`,
        `<path d="M${ox},${y} A${w},${w} 0 0 ${(e.ilgak === 'a') === (e.yon > 0) ? 1 : 0} ${hx},${yy}" fill="none" stroke="${rang}" stroke-width="${6 * k}" stroke-dasharray="${40 * k} ${25 * k}"/>`);
    } else {
      const hy = e.ilgak === 'a' ? e.a : e.b, oy = e.ilgak === 'a' ? e.b : e.a, x = e.yuz, xx = x + e.yon * w;
      q.push(`<line x1="${x}" y1="${hy}" x2="${xx}" y2="${hy}" stroke="${rang}" stroke-width="${18 * k}"/>`,
        `<path d="M${x},${oy} A${w},${w} 0 0 ${(e.ilgak === 'a') === (e.yon < 0) ? 1 : 0} ${xx},${hy}" fill="none" stroke="${rang}" stroke-width="${6 * k}" stroke-dasharray="${40 * k} ${25 * k}"/>`);
    }
  });
  // zina panjarasi (devor o'rniga)
  PANJARA.forEach(p => {
    q.push(`<line x1="${p.x1}" y1="${p.y}" x2="${p.x2}" y2="${p.y}" stroke="#2b2f36" stroke-width="${32 * k}"/>`);
    for (let x = p.x1 + 150; x < p.x2; x += 450) q.push(R({ x1: x - 45, x2: x + 45, y1: p.y - 45, y2: p.y + 45 }, 'fill="#2b2f36"'));
  });
  // xona yozuvlari: nomi va ichki o'lchami
  if (xonaYozuv) XONALAR.forEach(x => {
    if (['sanuzel', 'zina'].includes(x.tur) || !NOM[x.kod] || x.kod === 'ZN1') return;
    const bol = x.bolaklar ? x.bolaklar.reduce((a, b) => ((b.x2 - b.x1) * (b.y2 - b.y1) > (a.x2 - a.x1) * (a.y2 - a.y1) ? b : a)) : x;
    const cx = (bol.x1 + bol.x2) / 2, cy = (bol.y1 + bol.y2) / 2 + ({ KW: 1300, SR4: 1300, SR1: -900, SR2: -900, SR3: -900, SR5: 900, SR6: 900, SR7: 900 }[x.kod] || 0);
    const kor = x.kod === 'K1' || x.kod === 'K2';
    if (kor) return;
    q.push(T(cx, cy - 60 * k, NOM[x.kod], 240 * k, `text-anchor="middle" font-weight="700" fill="${RANG.matn}"`),
      T(cx, cy + 190 * k, `${son(x.x2 - x.x1)} × ${son(x.y2 - x.y1)}${x.bolaklar ? ' (L)' : ''} · ${xonaMaydoni(x).toFixed(1)} m²`, 170 * k, `text-anchor="middle" fill="#555"`));
  });
  // kodlar: eshik va shisha bo'laklari
  if (kodlar) {
    ESH.forEach(e => {
      const m = (e.a + e.b) / 2, y = e.yuz + e.yon * (e.b - e.a) * 0.55;
      q.push(T(m, y + 40 * k, `${e.id}`, 200 * k, `text-anchor="middle" font-weight="700" fill="${RANG.shishaCh}"`));
    });
  }
  return q.join('');
}
const oqBelgi = (vb, k) => {
  const r = 230 * k, q = [];
  OQLAR.x.forEach(([n, x]) => [vb.y1 + 230 * k, vb.y2 - 230 * k].forEach(y => q.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#333" stroke-width="${8 * k}"/>`, T(x, y + 70 * k, n, 190 * k, 'text-anchor="middle" font-weight="700" fill="#333"'))));
  OQLAR.y.forEach(([n, y]) => [vb.x1 + 230 * k, vb.x2 - 230 * k].forEach(x => q.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#333" stroke-width="${8 * k}"/>`, T(x, y + 70 * k, n, 190 * k, 'text-anchor="middle" font-weight="700" fill="#333"'))));
  return q.join('');
};

// devor chizig'idagi barcha bo'lak chegaralari (mavjud, yangi, eshik) — zanjir nuqtalari
function chiziqNuqtalari(y1, y2, xMin, xMax) {
  const P = [];
  DEVORLAR.filter(w => w.holat !== 'buziladi' && gor(w) && w.y1 === y1 && w.y2 === y2 && w.x2 > xMin && w.x1 < xMax).forEach(w => P.push(Math.max(w.x1, xMin), Math.min(w.x2, xMax)));
  ESHIKLAR.filter(e => e.devor === 'h' && (e.yuz === y1 || e.yuz === y2) && e.a >= xMin && e.b <= xMax).forEach(e => P.push(e.a, e.b));
  // tutashgan vertikal devorlar (chiziqni kesib o'tadigan yoki tegadigan) yuzlari
  return P;
}

// ---------- 1-varaq: butun qavat 1:100 ----------
function varaq1Svg() {
  const vb = { x1: -2900, y1: -2700, x2: 26700, y2: 26500 }, k = 1;
  const q = [asos(vb, k), oqBelgi(vb, k)];
  const T0 = -DEVOR.yuqori, P0 = ICHKI.y + DEVOR.past, L0 = -DEVOR.chap, R0 = ICHKI.x + DEVOR.ong;
  // tashqi zanjirlar: o'qlar va umumiy
  const ox = OQLAR.x.map(([, x]) => x), oy = OQLAR.y.map(([, y]) => y);
  const Z = { size: 2.1 };
  q.push(zanjir(ox, T0 - 900, true, k, Z), zanjir([L0, R0], T0 - 1650, true, k, Z),
    zanjir(oy, L0 - 900, false, k, Z), zanjir([T0, P0], L0 - 1650, false, k, Z));
  // ichki zanjirlar: xonalar va koridorlar chuqurligi
  const Zc = { tomon: -1, size: 1.9 }, Zo = { tomon: 1, size: 1.9 };
  q.push(zanjir([0, 7700, 7800, 9300, 9400, 12200, 12400, 15000, 15100, 16600, 16700, ICHKI.y], 11300, false, k, Zc),
    zanjir([0, 7700, 7800, 16600, 16700, ICHKI.y], 21300, false, k, Zc),
    zanjir([0, 5950, 6250, 11950, 12150, 17950, 18150, ICHKI.x], 14550, true, k, Zc),
    zanjir([0, 5950, 6250, 11950, 12150, 17950, 18150, ICHKI.x], 3900, true, k, Zc),
    zanjir([0, 5950, 6150, 11950, 12150, 17950, 18150, ICHKI.x], 20200, true, k, Zc));
  // bo'shliqlarni yopish (3-o'q va 4-o'qdagi, koworking chegarasidagi) — vertikal zanjirlar
  q.push(zanjir([16700, 18850, 21600, ICHKI.y], 12450, false, k, Zo), zanjir([16700, 18850, 21600, ICHKI.y], 18450, false, k, Zo),
    zanjir([16600, 18250, 18650, 21250, 21450], 6450, false, k, Zo),
    zanjir([6500, 7400, 7800, 9300, 10000, 12100], 6550, false, k, Zo),
    zanjir([9400, 10300, 12100], 12450, false, k, Zo), zanjir([9400, 10400, 12100], 18450, false, k, Zo));
  // zina panjarasi: uzunligi va yozuv
  PANJARA.forEach(p => q.push(zanjir([p.x1, p.x2], p.y - 380, true, k, { tomon: -1, size: 1.9 }),
    T((p.x1 + p.x2) / 2, p.y + 420, `${p.kod}: zina panjarasi, h ${son(p.bal)}`, 170, 'text-anchor="middle" font-weight="700" fill="#2b2f36"')));
  // 1:50 detal chegarasi
  const det = { x1: 5600, y1: 7150, x2: 19750, y2: 17150 };
  q.push(R(det, `fill="none" stroke="#1F3657" stroke-width="${16 * k}" stroke-dasharray="${180 * k} ${80 * k}"`),
    T(det.x1 + 120, det.y1 - 110, "2-varaq: 1:50 detal (shisha bo'laklari va eshiklar)", 170 * k, 'fill="#1F3657" font-weight="700"'));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x1} ${vb.y1} ${vb.x2 - vb.x1} ${vb.y2 - vb.y1}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">${q.join('')}</svg>`;
}

// ---------- 2-varaq: koridorlar va xizmat xonalari 1:50 ----------
function varaq2Svg() {
  const vb = { x1: 5450, y1: 7000, x2: 19850, y2: 17250 }, k = 0.55;
  const q = [asos(vb, k, { oqlar: true, xonaYozuv: false, kodlar: true })];
  // o'q belgilari (faqat ko'rinadiganlar)
  const r = 190 * k;
  OQLAR.x.filter(([, x]) => x > vb.x1 && x < vb.x2).forEach(([n, x]) => q.push(`<circle cx="${x}" cy="${vb.y1 + 170}" r="${r}" fill="#fff" stroke="#333" stroke-width="${8 * k}"/>`, T(x, vb.y1 + 170 + 55 * k, n, 150 * k, 'text-anchor="middle" font-weight="700" fill="#333"')));
  OQLAR.y.filter(([, y]) => y > vb.y1 && y < vb.y2).forEach(([n, y]) => q.push(`<circle cx="${vb.x1 + 170}" cy="${y}" r="${r}" fill="#fff" stroke="#333" stroke-width="${8 * k}"/>`, T(vb.x1 + 170, y + 55 * k, n, 150 * k, 'text-anchor="middle" font-weight="700" fill="#333"')));
  // koridor devorlari bo'ylab zanjirlar (koridor ichida): K1 shimoliy / janubiy, K2 shimoliy / janubiy
  const X0 = 5950, X1 = 19400;
  const S2 = 1.8;
  q.push(zanjir([X0, ...chiziqNuqtalari(7700, 7800, 6250, 19400), X1], 7800 + 230, true, k, { tomon: 1, size: S2 }),
    zanjir([X0, ...chiziqNuqtalari(9300, 9400, 6250, 19400), X1], 9300 - 230, true, k, { tomon: -1, size: S2 }),
    zanjir([X0, ...chiziqNuqtalari(15000, 15100, 6250, 19400), X1], 15100 + 230, true, k, { tomon: 1, size: S2 }),
    zanjir([X0, ...chiziqNuqtalari(16600, 16700, 6150, 19400), X1], 16600 - 230, true, k, { tomon: -1, size: S2 }));
  // umumiy (o'qdan o'qqa) zanjirlar — koridor o'rtasida
  q.push(zanjir([X0, 6050, 12050, 18050, X1], 8700, true, k, { tomon: -1, rang: '#6b7380', size: S2 }),
    zanjir([X0, 6050, 12050, 18050, X1], 16000, true, k, { tomon: -1, rang: '#6b7380', size: S2 }));
  // vertikal zanjirlar: xizmat xonalari va koridorlar chuqurligi
  q.push(zanjir([7700, 7800, 9300, 9400, 12200, 12400, 15000, 15100, 16600, 16700], 7400, false, k, { tomon: -1, size: S2 }),
    zanjir([7700, 7800, 9300, 9400, 12200, 12400, 15000, 15100, 16600, 16700], 14500, false, k, { tomon: -1, size: S2 }),
    zanjir([7700, 7800, 9300, 9400, 15000, 15100, 16600, 16700], 19650, false, k, { tomon: 1, size: S2 }));
  // xizmat xonalari: ichki eni zanjiri (o'rta devor yonida)
  q.push(zanjir([5950, 6250, 11950, 12150, 17950, 18150, 19400], 11950, true, k, { tomon: -1, size: S2 }),
    zanjir([5950, 6250, 11950, 12150, 17950, 18150, 19400], 12650, true, k, { tomon: 1, size: S2 }));
  // xona nomlari
  [['XZ2', 9100, 10650], ['XZ1', 9100, 13900], ['XZ3', 15050, 10650], ['XZ4', 15050, 13900]].forEach(([kod, x, y]) => {
    const z = XONALAR.find(r => r.kod === kod);
    q.push(T(x, y, NOM[kod], 220 * k * 1.6, `text-anchor="middle" font-weight="700" fill="${RANG.matn}"`),
      T(x, y + 250, `ichki: ${son(z.x2 - z.x1)} × ${son(z.y2 - z.y1)} · ${xonaMaydoni(z).toFixed(1)} m²`, 150 * k * 1.6, 'text-anchor="middle" fill="#555"'));
  });
  [['K1', 13300, 8800], ['K2', 13300, 16100]].forEach(([n, x, y]) => q.push(T(x, y, `${n} koridori · eni 1 500`, 150 * k * 1.6, 'text-anchor="middle" fill="#777" font-weight="700"')));
  [['SR1', 9100, 7350], ['SR2', 15050, 7350], ['SR7', 9100, 17050], ['SR6', 15050, 17050], ['SR4', 19100, 12300]].forEach(([kod, x, y]) =>
    q.push(T(x, y, NOM[kod], 150 * k * 1.6, 'text-anchor="middle" fill="#888" font-weight="700"')));
  q.push(T(5700, 12300, 'KW', 150 * k * 1.6, 'text-anchor="middle" fill="#888" font-weight="700"'));
  // shisha bo'laklari kodlari
  SHISHA.filter(w => w.x1 >= vb.x1 && w.x2 <= vb.x2 && w.y1 >= vb.y1 && w.y2 <= vb.y2).forEach(w => {
    const m = (w.x1 + w.x2) / 2, ust = [7700, 15000].includes(w.y1), y = ust ? w.y1 - 120 : w.y2 + 200;
    q.push(T(m, y, w.id, 120 * k * 2.2, `text-anchor="middle" font-weight="700" fill="${RANG.shishaCh}"`));
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x1} ${vb.y1} ${vb.x2 - vb.x1} ${vb.y2 - vb.y1}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">${q.join('')}</svg>`;
}

// shisha devorning tipik yoyilmasi (eshik bilan)
function yoyilma() {
  const W = 3300, Hh = BAL.shift, q = [], Y = z => Hh - z;
  const d1 = 1200, d2 = d1 + 900;
  q.push(`<rect x="0" y="0" width="${W}" height="${Hh}" fill="#fff"/>`,
    `<rect x="0" y="${Y(Hh)}" width="${W}" height="${Hh - BAL.shisha}" fill="#fde3c4" stroke="${RANG.gkl}" stroke-width="12"/>`,
    `<rect x="0" y="${Y(BAL.shisha)}" width="${W}" height="${BAL.shisha}" fill="${RANG.shisha}" stroke="${RANG.shishaCh}" stroke-width="14"/>`,
    `<rect x="0" y="${Y(BAL.matGacha)}" width="${d1}" height="${BAL.matGacha - BAL.matDan}" fill="#dfe7ee" opacity=".9"/>`,
    `<rect x="${d2}" y="${Y(BAL.matGacha)}" width="${W - d2}" height="${BAL.matGacha - BAL.matDan}" fill="#dfe7ee" opacity=".9"/>`,
    `<rect x="${d1}" y="${Y(BAL.eshik)}" width="900" height="${BAL.eshik}" fill="#e6f2fb" stroke="${RANG.shishaCh}" stroke-width="20"/>`,
    `<rect x="${d1 + 60}" y="${Y(BAL.matGacha)}" width="780" height="${BAL.matGacha - BAL.matDan}" fill="#dfe7ee" opacity=".9"/>`,
    `<line x1="${d1}" y1="${Y(BAL.eshik)}" x2="${d2}" y2="${Y(BAL.eshik)}" stroke="${RANG.shishaCh}" stroke-width="20"/>`,
    `<rect x="${d2 - 140}" y="${Y(1100)}" width="40" height="300" fill="#333"/>`,
    `<line x1="-200" y1="${Y(0)}" x2="${W + 200}" y2="${Y(0)}" stroke="#333" stroke-width="20"/>`);
  const z = [0, BAL.matDan, BAL.matGacha, BAL.eshik, BAL.shisha, Hh];
  q.push(zanjir(z.map(Y), W + 260, false, 1.4, { tomon: 1, yozuv: (a, b) => son(Math.abs(b - a)) }),
    zanjir([0, d1, d2, W], -260 - 0, true, 1.4, { tomon: -1 }));
  q.push(T(W / 2, Y(BAL.shisha + 380), 'GKL (shisha ustida)', 120, 'text-anchor="middle" fill="#a85a12"'),
    T(d1 / 2, Y(1300) + 40, 'matli plyonka', 105, 'text-anchor="middle" fill="#555"'),
    T(d1 + 450, Y(2300) + 40, 'shisha', 105, 'text-anchor="middle" fill="#2f5f88"'),
    T(d1 + 450, Y(600), 'eshik', 120, 'text-anchor="middle" fill="#2f5f88" font-weight="700"'));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-500 -700 ${W + 1500} ${Hh + 1000}" width="100%">${q.join('')}</svg>`;
}

// ---------- HTML ----------
const CSS = `
@page { size: 420mm 297mm; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
body { font-family: 'Liberation Sans', Arial, sans-serif; color: #222; }
.varaq { width: 420mm; height: 297mm; padding: 6mm 7mm; position: relative; display: grid; grid-template-columns: 1fr 112mm; gap: 4mm; page-break-after: always; overflow: hidden; }
.ram { border: .45mm solid #111; height: 285mm; position: relative; }
.ram svg { display: block; }
.ong { display: flex; flex-direction: column; height: 285mm; font-size: 6.6pt; }
h2 { font-size: 9pt; color: #1F3657; margin: 0 0 1mm; border-bottom: .3mm solid #1F3657; padding-bottom: .5mm; }
h3 { font-size: 7.6pt; color: #1F3657; margin: 1.6mm 0 .6mm; }
table { width: 100%; border-collapse: collapse; font-size: 6.2pt; }
th { background: #1F3657; color: #fff; text-align: left; padding: .45mm .8mm; font-weight: 700; } td { padding: .35mm .8mm; border-bottom: .15mm solid #ddd; }
td.r, th.r { text-align: right; white-space: nowrap; }
ul { margin: 0 0 0 3.2mm; line-height: 1.35; } li { margin-bottom: .35mm; }
.belgi { display: grid; grid-template-columns: 1fr 1fr; gap: .8mm 2mm; margin: .6mm 0 1mm; }
.belgi div { display: flex; align-items: center; gap: 1.4mm; } .belgi i { display: inline-block; width: 7mm; height: 2.4mm; flex: none; }
.ogoh { border: .3mm solid #c62828; background: #fff4f4; padding: 1mm 1.4mm; margin-top: 1mm; }
.shtamp { margin-top: auto; border: .45mm solid #111; font-size: 6.4pt; }
.shtamp div { border-bottom: .2mm solid #111; padding: .9mm 1.6mm; } .shtamp div:last-child { border-bottom: 0; }
.shtamp .nom { font-weight: 700; color: #16307a; font-size: 8.2pt; }
.shtamp .ch { display: grid; grid-template-columns: 20mm 1fr; padding: 0; } .shtamp .ch span { padding: 1.2mm 1.6mm; }
.shtamp .ch span + span { border-left: .2mm solid #111; font-size: 10pt; font-weight: 700; }
.shtamp .g4 { display: grid; grid-template-columns: repeat(4, 1fr); padding: 0; } .shtamp .g4 span { padding: .7mm 1.6mm; }
.shtamp .g4 span:not(:first-child) { border-left: .2mm solid #111; } .shtamp .g4 small { display: block; color: #666; font-size: 5.4pt; }
.yorliq { position: absolute; left: 3mm; top: 2.5mm; font-size: 8.5pt; font-weight: 700; color: #1F3657; background: rgba(255,255,255,.9); padding: .5mm 1.2mm; }
`;
const shtamp = (nom, masshtab, n) => `<div class="shtamp"><div class="nom">${LOYIHA.brend} · ${LOYIHA.filial}</div>
  <div class="ch"><span>Chizma</span><span>${nom}</span></div>
  <div>Ish chizmasi — ustalar uchun. ${LOYIHA.manzil} — 2-qavat</div>
  <div class="g4"><span><small>Masshtab</small>${masshtab}</span><span><small>Sana</small>14.10.2026</span><span><small>Versiya</small>${LOYIHA.versiya}</span><span><small>Varaq</small>${n} / 2</span></div>
  <div>Bajardi: ____________ &nbsp;&nbsp; Tekshirdi: ____________</div></div>`;
const belgilar = () => `<div class="belgi">
  <div><i style="background:${RANG.mavjud}"></i>mavjud devor / ustun (saqlanadi)</div>
  <div><i style="background:#fde3c4;border:.3mm solid ${RANG.gkl};background-image:repeating-linear-gradient(45deg,#a85a12 0 .3mm,transparent .3mm 1.2mm)"></i>yangi GKL devor, 100 mm</div>
  <div><i style="background:${RANG.shisha};border:.3mm solid ${RANG.shishaCh}"></i>yangi shisha devor (S…)</div>
  <div><i style="border:.3mm dashed ${RANG.buz};background-image:repeating-linear-gradient(-45deg,${RANG.buz} 0 .25mm,transparent .25mm 1.3mm)"></i>buziladigan devor</div>
  <div><i style="border-top:.5mm solid ${RANG.shishaCh};height:0"></i>yangi shisha eshik (E…), yoy — ochilishi</div>
  <div><i style="border:.3mm dashed #111"></i>ustun — joyida tekshiriladi</div>
  <div><i style="border-top:.9mm solid #2b2f36;height:0"></i>zina panjarasi (P1), metall</div></div>`;

function html() {
  const xz = ['XZ1', 'XZ2', 'XZ3', 'XZ4'].map(k => XONALAR.find(r => r.kod === k));
  const xonalar = XONALAR.filter(x => NOM[x.kod] && !['K1', 'K2', 'ZN1', 'ZN2'].includes(x.kod));
  const v1 = `<section class="varaq"><div class="ram"><div class="yorliq">1-varaq · Devorlar va eshiklar rejasi (butun qavat), 1:100</div>${varaq1Svg()}</div>
  <div class="ong">
    <h2>DEVORLAR VA ESHIKLAR — UMUMIY REJA</h2>${belgilar()}
    <h3>Xonalar: ichki o'lchamlari (devor yuzidan devor yuzigacha)</h3>
    <table><tr><th>Xona</th><th class="r">Eni × chuqurligi, mm</th><th class="r">Maydon, m²</th></tr>
      ${xonalar.map(x => `<tr><td>${NOM[x.kod]}</td><td class="r">${son(x.x2 - x.x1)} × ${son(x.y2 - x.y1)}${x.bolaklar ? ' (L shakl)' : ''}</td><td class="r">${xonaMaydoni(x).toFixed(1)}</td></tr>`).join('')}</table>
    <h3>Devor turlari</h3>
    <ul>
      <li><b>GKL 100:</b> metall profil 75 mm (stoyka qadami 600), ikki tomonida 12.5 mm gipsokarton; ichida 50 mm mineral paxta (shovqin uchun, tavsiya); poldan shiftgacha ${son(H)} mm.</li>
      <li><b>Shisha devor:</b> poldan ${son(BAL.shisha)} mm gacha shisha (laminatlangan, kamida 2 × 6 mm yoki 10 mm toblangan), alyumin profilda; ${son(BAL.shisha)}–${son(H)} mm — GKL (shisha ustida). ${son(BAL.matDan)}–${son(BAL.matGacha)} mm da matli plyonka.</li>
      <li><b>Eshiklar:</b> shisha, ${son(900)} × ${son(BAL.eshik)} mm, ustida ${son(BAL.shisha - BAL.eshik)} mm qo'zg'almas shisha; hammasi xona ichiga ochiladi. Jadvali — 2-varaqda.</li>
      <li><b>Bo'shliqlarni yopish</b> (eski eshik va o'tish joylari, 1-varaqdagi to'q sariq bo'laklar) — GKL, mavjud devor qalinligida (200–300 mm), ikki tomoni tekislanadi.</li>
    </ul>
    <div class="ogoh"><b>Buyurtmachi qarorlari (14.10):</b> (1) xizmat xonalari zonasidagi <b>eski o'rta devor (C o'qi) buzilmaydi</b> — 2 × 2 xona: K2 tomonda XZ1 sotuv va XZ2 admin (yonma-yon, eshiklari o'rtada), K1 tomonda XZ4 call-markaz va XZ3 ustozlar; koridor tomoni shisha. (2) <b>Kirishdagi ZN2 zinasi bilan koworking orasidagi devor buziladi</b> — o'rniga zina tuynugi chetida metall panjara P1 (h ${son(PANJARA[0].bal)}, uzunligi ${son(PANJARA[0].x2 - PANJARA[0].x1)}).</div>
    <h3>Ishni boshlashdan oldin joyida tekshiriladi</h3>
    <ul>
      <li>Barcha o'lchamlar mavjud chizma fotosidan olingan: ish boshlashdan oldin ustunlar (U1–U9) va mavjud devorlar yuzasi o'lchab chiqiladi; farq 30 mm dan katta bo'lsa — loyihachiga xabar beriladi.</li>
      <li>U8, U9 ustunlari fotoda ko'rinmaydi — U7 bilan bir chiziqda deb olingan (punktir).</li>
      <li>Shisha devorlar GKL karkas va eshik o'rinlari belgilangandan keyin <b>joyida o'lchanib</b> buyurtma qilinadi (jadvaldagi o'lchamlar — loyiha bo'yicha).</li>
      <li>Poldan shiftgacha ${son(H)} mm (buyurtmachi); to'sinlar bo'lsa, GKL va shisha ustidagi qism moslanadi.</li>
      <li>ZN2 devorini buzishdan oldin: devor yuk ko'taruvchi emasligi va zinapoya to'sig'i bo'yicha yong'in xavfsizligi talabi tekshiriladi (ijaraga beruvchi va yong'in nazorati bilan kelishiladi). Panjara: balandligi ${son(PANJARA[0].bal)} mm, tik ustunchalar orasi ≤ 110 mm (bolalar uchun xavfsiz).</li>
    </ul>
    ${shtamp("Devorlar va eshiklar rejasi (o'lchamli)", '1:100', 1)}
  </div></section>`;

  const glass = SHISHA.filter(w => w.y1 >= 7000 && w.y2 <= 17250 && w.x1 >= 5450);
  const gklB = GKL.filter(w => w.y1 >= 7300 && w.y2 <= 17000 && w.x1 >= 5900 && w.x2 <= 19500);
  const v2 = `<section class="varaq"><div class="ram"><div class="yorliq">2-varaq · K1, K2 koridorlari va xizmat xonalari (XZ1–XZ4), 1:50</div>${varaq2Svg()}</div>
  <div class="ong">
    <h2>SHISHA DEVORLAR, ESHIKLAR VA GKL — JADVALLAR</h2>
    <h3>Eshiklar (yangi, shisha) — ${ESH.length} ta</h3>
    <table><tr><th>Kod</th><th>Xona</th><th>Joyi</th><th class="r">x, mm</th><th class="r">O'lchami</th><th>Ilgagi (koridordan)</th></tr>
      ${ESH.map(e => `<tr><td><b>${e.id}</b></td><td>${NOM[e.kod] || e.kod}</td><td>${chiziqNomi({ ...e, y1: e.yuz === 7700 ? 7700 : e.yuz === 9400 ? 9300 : e.yuz === 15000 ? 15000 : e.yuz === 16700 ? 16600 : e.yuz })}</td><td class="r">${son(e.a)}–${son(e.b)}</td><td class="r">${son(e.en)} × ${son(BAL.eshik)}</td><td>${(e.yon > 0) === (e.ilgak === 'a') ? "o'ngda" : 'chapda'}</td></tr>`).join('')}</table>
    <h3>Shisha devorlar (S) — balandligi ${son(BAL.shisha)} mm</h3>
    <table><tr><th>Kod</th><th>Joyi</th><th class="r">x, mm</th><th class="r">Uzunligi</th><th class="r">m²</th></tr>
      ${glass.map(w => `<tr><td><b>${w.id}</b></td><td>${chiziqNomi(w)}</td><td class="r">${son(w.x1)}–${son(w.x2)}</td><td class="r">${son(uz(w))}</td><td class="r">${(uz(w) * BAL.shisha / 1e6).toFixed(2)}</td></tr>`).join('')}
      <tr><td></td><td><b>Jami (eshiklarsiz)</b></td><td></td><td class="r"><b>${son(glass.reduce((t, w) => t + uz(w), 0))}</b></td><td class="r"><b>${(glass.reduce((t, w) => t + uz(w), 0) * BAL.shisha / 1e6).toFixed(1)}</b></td></tr></table>
    <p style="margin-top:1mm">Yangi GKL bo'laklari (to'q sariq) — eshik va ustunlar yonida; o'lchamlari zanjirlarda. Bo'shliqlarni yopish — 1-varaqda.</p>
    <h3>Shisha devor — tipik yoyilma (koridordan ko'rinish)</h3>
    <div style="width:70%;margin:0 auto">${yoyilma()}</div>
    <ul>
      <li>Zanjirlar koridor ichida, koworking devori yuzasidan (x = ${son(5950)}) boshlanadi; o'qlar 2, 3, 4 — ustunlar markazi.</li>
      <li>XZ xonalari ichki eni ${son(xz[0].x2 - xz[0].x1)} (XZ1, XZ2) va ${son(xz[2].x2 - xz[2].x1)} (XZ3, XZ4); chuqurligi K1 tomonda ${son(xz[1].y2 - xz[1].y1)}, K2 tomonda ${son(xz[0].y2 - xz[0].y1)} (o'rta devor ${son(200)} mm).</li>
    </ul>
    ${shtamp("Koridorlar va xizmat xonalari — shisha, eshiklar", '1:50', 2)}
  </div></section>`;
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — ish chizmasi</title><style>${CSS}</style></head><body>${v1}${v2}</body></html>`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const V = LOYIHA.versiya, nom = join(CH, `Xadra_2-qavat_ish_chizmasi_${V}`);
  const brauzer = await chromium.launch();
  const p = await brauzer.newPage({ viewport: { width: 1588, height: 1123 }, deviceScaleFactor: 2 });
  await p.setContent(html(), { waitUntil: 'load' });
  await p.pdf({ path: nom + '.pdf', width: '420mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
  const v = await p.$$('section.varaq');
  for (let i = 0; i < v.length; i++) await v[i].screenshot({ path: `${nom}-${i + 1}.png` });
  await brauzer.close();
  console.log(nom + '.pdf', 'eshik', ESH.length, 'shisha', SHISHA.length, 'gkl', GKL.length);
}
export { html as ishChizmaHtml };
