// TAKLIF (eskiz, tasdiq uchun, 16.10.2026): buyurtmachi va founder o'zgarishlari — koridorlar 4-xona orqali davom etadi,
// 4-xona o'rtasida koridor eshik bilan yopiladi (orqasi — kladovka), kladovka ustida devorga taqab kanalli konditsioner
// (havo koridor bo'ylab to'g'ri kanal bilan, xonalarga avvalgi chizmadagidek; tashqi havo 30% — tashqi devordan);
// 3-, 4-, 5-xonaning koridorga qaragan devori kladovkagacha shisha; eshiklar 1 m, yonga suriladigan (Damas eshigi kabi).
// Model (model.mjs) hali o'zgartirilmagan — bu varaq faqat tushunganimni ko'rsatadi; tasdiqdan keyin hammasi qayta chiziladi.
//   node taklif-koridor.mjs
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { LOYIHA, H, ICHKI, DEVORLAR, ESHIKLAR, USTUNLAR, XONALAR } from './model.mjs';
import { T, R, zanjir, son, RANG, NOM } from './ish-chizma.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(join(process.execPath, '../../lib/node_modules/playwright'))); }
const BU = dirname(fileURLToPath(import.meta.url)), CH = join(BU, '..', 'chizma');
const X = Object.fromEntries(XONALAR.map(x => [x.kod, x]));

// ---------- taklif geometriyasi (mm) ----------
export const TK = {
  xk: 21000,                 // kladovka devori — 4-xonaning o'rtasi ((18 150 + 23 900) / 2 ≈ 21 000)
  kor: { K1: [7800, 9300], K2: [15100, 16600] },
  klEshik: { K1: [8200, 9000], K2: [15400, 16200] },     // kladovka eshigi (800, ichkariga ochiladi)
  surma: 1000,               // suriladigan eshik eni
  eshik: { SR3: { a: 18300, y: 7700, kor: +1 }, SR4: { a: 18250, y: 15000, kor: +1 }, SR5: { a: 18300, y: 16600, kor: -1 } },
  blok: { en: 1400, chuq: 900, bal: 450 },               // kanalli ichki blok (taxminiy)
  tozaUlush: 0.30,
};
const XK = TK.xk;
const SR4 = { x1: 18150, x2: ICHKI.x, y1: 9400, y2: 15000 };
const KL = k => ({ x1: XK + 100, x2: ICHKI.x, y1: TK.kor[k][0], y2: TK.kor[k][1] });
const m2 = r => ((r.x2 - r.x1) * (r.y2 - r.y1) / 1e6);

// devorlar: hozirgi devorlardan o'zgaradiganlari olib tashlanadi, o'rniga yangilari
const almash = w => w.logo || (w.y1 === 7700 && w.x1 === 19200) || (w.y1 === 9300 && w.x1 >= 18150 && w.x1 < 19400)
  || (w.y1 === 15000 && w.x1 === 19150) || (w.y1 === 16600 && w.x1 === 19200);
const OLIB = DEVORLAR.filter(w => w.logo);
const DEV = DEVORLAR.filter(w => !almash(w));
const sh = (x1, x2, y1, y2) => ({ x1, x2, y1, y2, holat: 'yangi', shisha: true, taklif: true });
const gk = (x1, x2, y1, y2) => ({ x1, x2, y1, y2, holat: 'yangi', taklif: true });
const YANGI = [
  sh(18300 + TK.surma, XK, 7700, 7800), gk(XK, ICHKI.x, 7700, 7800),            // K1 — 3-xona tomoni
  sh(18150, XK, 9300, 9400), gk(XK, ICHKI.x, 9300, 9400),                      // K1 — 4-xona tomoni
  sh(18250 + TK.surma, XK, 15000, 15100), gk(XK, ICHKI.x, 15000, 15100),      // K2 — 4-xona tomoni
  sh(18300 + TK.surma, XK, 16600, 16700), gk(XK, ICHKI.x, 16600, 16700),      // K2 — 5-xona tomoni
  ...['K1', 'K2'].flatMap(k => [gk(XK, XK + 100, TK.kor[k][0], TK.klEshik[k][0]), gk(XK, XK + 100, TK.klEshik[k][1], TK.kor[k][1])]),
];
const RG = { ber: '#1f6fd1', berF: '#d9e8fb', toza: '#14896f', tozaF: '#d3eee7', so: '#b7372a', yangi: '#7b1fa2', yangiF: '#f3e5f5' };

// ---------- reja (sharqiy qism, ~1:50) ----------
const VB = { x1: 14400, y1: 5600, x2: 25200, y2: 19400 };
function devorSvg(w, k = 1) {
  const gor = w.x2 - w.x1 >= w.y2 - w.y1;
  if (w.shisha) return R(w, `fill="${RANG.shisha}" stroke="${w.taklif ? RG.yangi : RANG.shishaCh}" stroke-width="${w.taklif ? 14 : 7}"`) +
    (gor ? `<line x1="${w.x1}" y1="${(w.y1 + w.y2) / 2}" x2="${w.x2}" y2="${(w.y1 + w.y2) / 2}" stroke="${RANG.shishaCh}" stroke-width="6"/>`
      : `<line x1="${(w.x1 + w.x2) / 2}" y1="${w.y1}" x2="${(w.x1 + w.x2) / 2}" y2="${w.y2}" stroke="${RANG.shishaCh}" stroke-width="6"/>`);
  if (w.holat === 'buziladi') return '';
  if (w.holat === 'yangi') return R(w, `fill="#fde3c4" stroke="${w.taklif ? RG.yangi : RANG.gkl}" stroke-width="${w.taklif ? 14 : 7}"`) + R(w, 'fill="url(#gklsh)"');
  return R(w, `fill="${RANG.mavjud}"`);
}
function ilmaEshik(e) {   // oddiy (ilgakli) eshik — ish-chizma.mjs dagi kabi
  const w = e.b - e.a, rang = e.holat === 'yangi' ? RANG.shishaCh : '#555';
  if (e.devor !== 'h') return '';
  const hx = e.ilgak === 'a' ? e.a : e.b, ox = e.ilgak === 'a' ? e.b : e.a, y = e.yuz, yy = y + e.yon * w;
  return `<line x1="${hx}" y1="${y}" x2="${hx}" y2="${yy}" stroke="${rang}" stroke-width="18"/>` +
    `<path d="M${ox},${y} A${w},${w} 0 0 ${(e.ilgak === 'a') === (e.yon > 0) ? 1 : 0} ${hx},${yy}" fill="none" stroke="${rang}" stroke-width="6" stroke-dasharray="40 25"/>`;
}
// suriladigan eshik (rejada): barg koridor tomonda, devor bo'ylab sharqqa suriladi
function surmaEshik(kod) {
  const e = TK.eshik[kod], a = e.a, b = a + TK.surma, yk = e.y + (e.kor > 0 ? 100 : 0), s = e.kor;
  const y1 = yk + s * 20, y2 = yk + s * 60;
  return `<line x1="${a - 30}" y1="${yk + s * 85}" x2="${b + TK.surma + 30}" y2="${yk + s * 85}" stroke="${RG.yangi}" stroke-width="10"/>` +   // relsli yo'naltiruvchi
    R({ x1: a - 30, x2: b + 30, y1: Math.min(y1, y2), y2: Math.max(y1, y2) }, `fill="${RANG.shishaCh}"`) +
    R({ x1: a + TK.surma - 30, x2: b + TK.surma + 30, y1: Math.min(y1, y2), y2: Math.max(y1, y2) }, `fill="none" stroke="${RANG.shishaCh}" stroke-width="10" stroke-dasharray="40 25"`) +
    strelka([a + 250, yk + s * 230], [a + TK.surma + 250, yk + s * 230], RG.yangi, 22) +
    T(a - 100, e.y + (e.kor > 0 ? -260 : 100 + 330), `${NOM[kod]} eshigi: 1 000, suriladi`, 150, `text-anchor="middle" font-weight="700" fill="${RG.yangi}"`);
}
const strelka = (a, b, rang, w = 40) => {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 170, u = 0.45;
  const p1 = [b[0] - L * Math.cos(ang - u), b[1] - L * Math.sin(ang - u)], p2 = [b[0] - L * Math.cos(ang + u), b[1] - L * Math.sin(ang + u)];
  return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${rang}" stroke-width="${w}"/><path d="M${b[0]},${b[1]} L${p1[0]},${p1[1]} L${p2[0]},${p2[1]} z" fill="${rang}"/>`;
};
const kanal = (pts, a, rang, fon) => {
  const d = pts.map(p => p.join(',')).join(' ');
  return `<polyline points="${d}" fill="none" stroke="${rang}" stroke-width="${a + 36}" stroke-linejoin="miter"/><polyline points="${d}" fill="none" stroke="${fon}" stroke-width="${a - 14}" stroke-linejoin="miter"/>`;
};
const diff = (x, y, s = 225) => `<rect x="${x - s}" y="${y - s}" width="${2 * s}" height="${2 * s}" fill="${RG.berF}" stroke="${RG.ber}" stroke-width="24"/><path d="M${x - s},${y - s} L${x + s},${y + s} M${x + s},${y - s} L${x - s},${y + s}" stroke="${RG.ber}" stroke-width="14"/>`;

function rejaSvg() {
  const q = [];
  q.push(`<defs><pattern id="gklsh" patternUnits="userSpaceOnUse" width="70" height="70" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="70" stroke="#a85a12" stroke-width="14"/></pattern>
    <pattern id="klsh" patternUnits="userSpaceOnUse" width="160" height="160" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="160" stroke="${RG.yangi}" stroke-width="10" opacity=".35"/></pattern></defs>`);
  q.push(R(VB, 'fill="#fff"'));
  // xonalar foni
  ['SR2', 'SR3', 'SR5', 'SR6', 'XZ2', 'XZ3'].forEach(k => q.push(R(X[k], 'fill="#fbfaf7"')));
  q.push(R(SR4, 'fill="#fbfaf7"'));
  ['K1', 'K2'].forEach(k => q.push(R({ x1: X[k].x1, x2: XK, y1: TK.kor[k][0], y2: TK.kor[k][1] }, 'fill="#f4f6f8"'), R(KL(k), `fill="${RG.yangiF}"`), R(KL(k), 'fill="url(#klsh)"')));
  // olib tashlanadigan logotip devorlari
  OLIB.forEach(w => q.push(R(w, `fill="none" stroke="${RANG.buz}" stroke-width="16" stroke-dasharray="50 30"`),
    `<path d="M${w.x1 - 120},${w.y1 + 100} L${w.x2 + 120},${w.y2 - 100} M${w.x2 + 120},${w.y1 + 100} L${w.x1 - 120},${w.y2 - 100}" stroke="${RANG.buz}" stroke-width="14"/>`));
  [...DEV, ...YANGI].forEach(w => q.push(devorSvg(w)));
  USTUNLAR.forEach(u => q.push(R(u, u.holat === 'taxminiy' ? 'fill="#fff" stroke="#111" stroke-width="12" stroke-dasharray="40 25"' : 'fill="#111"')));
  ESHIKLAR.filter(e => !TK.eshik[e.kod]).forEach(e => q.push(ilmaEshik(e)));
  Object.keys(TK.eshik).forEach(k => q.push(surmaEshik(k)));
  // kladovka eshiklari (ichkariga ochiladi)
  ['K1', 'K2'].forEach(k => { const [a, b] = TK.klEshik[k];
    q.push(`<line x1="${XK + 100}" y1="${a}" x2="${XK + 100 + (b - a)}" y2="${a}" stroke="#555" stroke-width="18"/><path d="M${XK + 100},${b} A${b - a},${b - a} 0 0 0 ${XK + 100 + (b - a)},${a}" fill="none" stroke="#555" stroke-width="6" stroke-dasharray="40 25"/>`); });

  // ---- konditsioner: blok kladovka ustida, kanal koridor bo'ylab, xonalarga tarmoqlar ----
  const B = TK.blok;
  ['K1', 'K2'].forEach(k => {
    const [y1, y2] = TK.kor[k], yc = (y1 + y2) / 2;
    const blok = { x1: XK + 150, x2: XK + 150 + B.en, y1: yc - B.chuq / 2, y2: yc + B.chuq / 2 };
    // tashqi havo 30%: tashqi devordagi panjara → blokning orqasiga
    q.push(kanal([[ICHKI.x + 400, yc], [blok.x2, yc]], 300, RG.toza, RG.tozaF));
    q.push(R({ x1: ICHKI.x, x2: ICHKI.x + 400, y1: yc - 300, y2: yc + 300 }, `fill="${RG.tozaF}" stroke="${RG.toza}" stroke-width="20"`));
    q.push(strelka([ICHKI.x + 1150, yc], [ICHKI.x + 450, yc], RG.toza, 40));
    // berish kanali: blokdan g'arbga, koridor o'qi bo'ylab
    q.push(kanal([[blok.x1, yc], [VB.x1, yc]], 500, RG.ber, RG.berF));
    q.push(R(blok, `fill="#e9eef5" stroke="#26313d" stroke-width="36"`), `<path d="M${blok.x1},${blok.y1} L${blok.x2},${blok.y2} M${blok.x2},${blok.y1} L${blok.x1},${blok.y2}" stroke="#8a96a3" stroke-width="12"/>`,
      T((blok.x1 + blok.x2) / 2, yc + 70, k === 'K1' ? 'KK1' : 'KK2', 200, 'text-anchor="middle" font-weight="700" fill="#26313d"'));
    // qaytish havosi: koridordan kladovka eshigidagi panjara orqali
    q.push(strelka([XK - 700, k === 'K1' ? y2 - 230 : y1 + 230], [XK + 60, k === 'K1' ? y2 - 230 : y1 + 230], '#6b7682', 26));
  });
  // tarmoqlar (avvalgi chizmadagidek): [x, y diffuzor, koridor] — 3- va 5-xonaning sharqiy diffuzori L shaklida
  const D = [
    [16000, 6200, 'K1'], [15500, 10600, 'K1'], [19650, 6200, 'K1'], [20450, 10900, 'K1'],
    [16000, 18200, 'K2'], [16300, 13800, 'K2'], [19650, 18200, 'K2'], [20450, 13700, 'K2'],
  ];
  const yc = k => (TK.kor[k][0] + TK.kor[k][1]) / 2;
  D.forEach(([x, y, k]) => q.push(kanal([[x, yc(k)], [x, y]], 220, RG.ber, RG.berF)));
  [['K1', 6200, 7000], ['K2', 18200, 17400]].forEach(([k, yd, yb]) => q.push(kanal([[20700, yc(k)], [20700, yb], [22500, yb], [22500, yd]], 220, RG.ber, RG.berF)));
  [...D.map(([x, y]) => [x, y]), [22500, 6200], [22500, 18200]].forEach(([x, y]) => q.push(diff(x, y)));
  // vitechka (o'zgarmaydi) — xira
  q.push(`<line x1="18850" y1="${VB.y1}" x2="18850" y2="${VB.y2}" stroke="${RG.so}" stroke-width="420" opacity=".13"/>`,
    T(18850 + 280, 12300, "vitechka magistrali (o'zgarmaydi)", 150, `fill="${RG.so}" opacity=".85" transform="rotate(-90 ${18850 + 280} 12300)" text-anchor="middle"`));

  // ---- yozuvlar ----
  const yoz = (x, y, s, size = 230, rang = '#26313d', w = 700) => T(x, y, s, size, `text-anchor="middle" font-weight="${w}" fill="${rang}"`);
  q.push(yoz(21500, 5300, '3-xona', 230), yoz(21500, 19150, '5-xona', 230), yoz(15800, 5300, '2-xona', 230), yoz(15800, 19150, '6-xona', 230));
  q.push(yoz(21500, 12000, '4-xona (kichrayadi)', 250, RG.yangi), yoz(21500, 12330, `${son(SR4.x2 - SR4.x1)} × ${son(SR4.y2 - SR4.y1)} · ${m2(SR4).toFixed(1)} m² (avval 46.6)`, 170, RG.yangi, 400));
  ['K1', 'K2'].forEach(k => {
    const kl = KL(k), c = (kl.y1 + kl.y2) / 2;
    q.push(yoz((kl.x1 + kl.x2) / 2 + 500, c + (k === 'K1' ? -520 : 680), `${k === 'K1' ? 'KL1' : 'KL2'} · kladovka ${son(kl.x2 - kl.x1)} × ${son(kl.y2 - kl.y1)}`, 150, RG.yangi));
    q.push(yoz(16900, k === 'K1' ? TK.kor[k][0] + 230 : TK.kor[k][1] - 110, `${k} → 4-xona o'rtasigacha davom etadi`, 150, RG.yangi));
  });
  q.push(T(14600, 11900, 'XZ3', 170, 'fill="#8a96a3"'), T(14600, 12900, 'XZ2', 170, 'fill="#8a96a3"'));
  // zanjirlar
  const Z = { size: 1.5 };
  q.push(zanjir([18150, XK, ICHKI.x], 6750, true, 1, { ...Z, tomon: -1 }), zanjir([18150, XK, ICHKI.x], 17800, true, 1, { ...Z, tomon: 1 }));
  q.push(zanjir([TK.kor.K1[0], TK.kor.K1[1], 9400, 15000, TK.kor.K2[0], TK.kor.K2[1]], 24750 - 200, false, 1, { ...Z, tomon: 1 }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB.x1} ${VB.y1} ${VB.x2 - VB.x1} ${VB.y2 - VB.y1}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">${q.join('')}</svg>`;
}

// ---------- kesim A–A: K1 o'qi bo'ylab (shimolga, 3-xona devoriga qarab) ----------
function kesimSvg() {
  const x0 = 15500, x1 = ICHKI.x + 400, zf = (z) => -z;       // SVG: y = −z
  const q = [];
  const yc = 8550, HS = 2850, KLS = 2500;                     // koridor osma shifti va kladovka shifti
  q.push(R({ x1: x0, x2: x1, y1: zf(H + 250), y2: zf(-250) }, 'fill="#fff"'));
  q.push(R({ x1: x0, x2: x1, y1: zf(0), y2: zf(-250) }, 'fill="#b9b5ae"'), R({ x1: x0, x2: x1, y1: zf(H + 250), y2: zf(H) }, 'fill="#b9b5ae"'));
  // orqa fon: 3-xona tomonidagi devor (ko'rinish) — shisha 2.5 m gacha, mat polosa, ustida GKL; suriladigan eshik
  const sx1 = 17750, sx2 = XK;
  q.push(R({ x1: 15500, x2: 17750, y1: zf(H), y2: zf(0) }, 'fill="#eef3f6" stroke="#9aa3ad" stroke-width="8"'));
  q.push(R({ x1: sx1, x2: sx2, y1: zf(2500), y2: zf(0) }, `fill="${RANG.shisha}" stroke="${RANG.shishaCh}" stroke-width="8"`),
    R({ x1: sx1, x2: sx2, y1: zf(1600), y2: zf(1000) }, 'fill="#dfe6ea" opacity=".9"'),
    R({ x1: sx1, x2: XK, y1: zf(H), y2: zf(2500) }, 'fill="#fde3c4" stroke="#e8913a" stroke-width="8"'),
    R({ x1: XK, x2: ICHKI.x, y1: zf(H), y2: zf(0) }, `fill="${RG.yangiF}" stroke="${RG.yangi}" stroke-width="8"`));
  const ea = TK.eshik.SR3.a;
  q.push(R({ x1: ea, x2: ea + TK.surma, y1: zf(2100), y2: zf(0) }, `fill="#cfe3f2" stroke="${RANG.shishaCh}" stroke-width="22"`),
    R({ x1: ea + TK.surma, x2: ea + 2 * TK.surma, y1: zf(2100), y2: zf(0) }, `fill="none" stroke="${RANG.shishaCh}" stroke-width="14" stroke-dasharray="50 30"`),
    `<line x1="${ea - 50}" y1="${zf(2150)}" x2="${ea + 2 * TK.surma + 50}" y2="${zf(2150)}" stroke="${RG.yangi}" stroke-width="40"/>`,
    strelka([ea + 300, zf(1100)], [ea + TK.surma + 300, zf(1100)], RG.yangi, 30));
  // osma shift (koridor) va kladovka shifti
  q.push(`<line x1="${x0}" y1="${zf(HS)}" x2="${XK}" y2="${zf(HS)}" stroke="#555" stroke-width="20" stroke-dasharray="80 40"/>`,
    `<line x1="${XK + 100}" y1="${zf(KLS)}" x2="${ICHKI.x}" y2="${zf(KLS)}" stroke="#555" stroke-width="20" stroke-dasharray="80 40"/>`);
  // kesilgan: kladovka devori (eshik o'rni) va tashqi devor
  q.push(R({ x1: XK, x2: XK + 100, y1: zf(H), y2: zf(2100) }, `fill="#fde3c4" stroke="${RG.yangi}" stroke-width="14"`),
    R({ x1: ICHKI.x, x2: ICHKI.x + 400, y1: zf(H), y2: zf(0) }, `fill="${RANG.mavjud}"`));
  // blok kladovka ustida, devorga taqalgan; tashqi havo panjarasi; berish kanali koridorga
  const bz1 = 2950, bz2 = bz1 + TK.blok.bal, bx1 = XK + 150, bx2 = bx1 + TK.blok.en;
  q.push(kanal([[bx1, zf((bz1 + bz2) / 2)], [x0, zf((bz1 + bz2) / 2)]], 350, RG.ber, RG.berF));
  q.push(kanal([[ICHKI.x + 400, zf((bz1 + bz2) / 2)], [bx2, zf((bz1 + bz2) / 2)]], 300, RG.toza, RG.tozaF));
  q.push(R({ x1: ICHKI.x, x2: ICHKI.x + 400, y1: zf(bz2 - 40), y2: zf(bz1 + 40) }, `fill="${RG.tozaF}" stroke="${RG.toza}" stroke-width="18"`));
  q.push(R({ x1: bx1, x2: bx2, y1: zf(bz2), y2: zf(bz1) }, 'fill="#e9eef5" stroke="#26313d" stroke-width="30"'),
    T((bx1 + bx2) / 2, zf((bz1 + bz2) / 2) + 70, 'KK1', 200, 'text-anchor="middle" font-weight="700" fill="#26313d"'));
  // diffuzor tushishi (3-xonaga) va qaytish havosi kladovka eshigidan
  [19650, 16000].forEach(x => q.push(kanal([[x, zf(3150)], [x, zf(HS)]], 200, RG.ber, RG.berF), strelka([x, zf(HS - 60)], [x, zf(HS - 650)], RG.ber, 26)));
  q.push(strelka([XK - 800, zf(2250)], [XK + 400, zf(2250)], '#6b7682', 26), strelka([XK + 500, zf(2300)], [bx1 + 300, zf(bz1 - 80)], '#6b7682', 22));
  q.push(strelka([ICHKI.x + 1300, zf((bz1 + bz2) / 2)], [ICHKI.x + 450, zf((bz1 + bz2) / 2)], RG.toza, 34));
  // vitechka magistrali (kesishadi)
  q.push(R({ x1: 18650, x2: 19050, y1: zf(3400), y2: zf(3150) }, `fill="#f7d8d2" stroke="${RG.so}" stroke-width="14"`));
  // yozuvlar
  const t = (x, z, s, a = '', size = 150) => T(x, z, s, size, a);
  q.push(t(XK + 1550, zf(1500), 'KL1 · kladovka', `text-anchor="middle" font-weight="700" fill="${RG.yangi}"`, 170),
    t(XK + 1550, zf(1250), 'eshigi 800 (panjarali)', 'text-anchor="middle" fill="#555"'),
    t((bx1 + bx2) / 2 + 200, zf(2640), 'blok — kladovka shifti ustida, devorga taqalgan', 'text-anchor="middle" fill="#26313d"', 125),
    t(ICHKI.x + 500, zf(2600), 'tashqi havo 30%', `font-weight="700" fill="${RG.toza}"`),
    t(15650, zf(2650), "← berish kanali: koridor osma shifti ichida, g'arbga", `fill="${RG.ber}" font-weight="700"`),
    t(ea + TK.surma, zf(2250) - 40, "1 000 — yonga suriladi (Damas eshigi kabi)", `text-anchor="middle" font-weight="700" fill="${RG.yangi}"`),
    t(18850, zf(3480) - 30, 'vitechka', `text-anchor="middle" fill="${RG.so}"`, 130),
    t(16000, zf(1300), '2-xona (orqa fonda)', 'fill="#8a96a3"'));
  // balandlik zanjiri
  q.push(zanjir([-H, -HS, -KLS, -2100, 0], x1 + 1700, false, 1, { size: 1.4, tomon: 1 }));
  q.push(zanjir([18150, XK, ICHKI.x], zf(-650), true, 1, { size: 1.4, tomon: 1 }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0 - 100} ${zf(H + 650)} ${x1 - x0 + 2200} ${H + 1700}" width="100%">${q.join('')}</svg>`;
}

// ---------- suriladigan eshik — ko'rinish (koridordan) ----------
function eshikSvg() {
  const q = [], zf = z => -z, a = 1000, b = a + TK.surma;
  q.push(R({ x1: 0, x2: 3400, y1: zf(3550), y2: zf(-100) }, 'fill="#fff"'));
  q.push(`<line x1="0" y1="0" x2="3400" y2="0" stroke="#333" stroke-width="30"/>`);
  q.push(R({ x1: 100, x2: 3300, y1: zf(3500), y2: zf(2500) }, 'fill="#fde3c4" stroke="#e8913a" stroke-width="10"'));
  // qo'zg'almas shisha (chapda 900, o'ngda 1 300) va eshik o'rni
  q.push(R({ x1: 100, x2: a, y1: zf(2500), y2: zf(0) }, `fill="${RANG.shisha}" stroke="${RANG.shishaCh}" stroke-width="10"`),
    R({ x1: b, x2: 3300, y1: zf(2500), y2: zf(0) }, `fill="${RANG.shisha}" stroke="${RANG.shishaCh}" stroke-width="10"`),
    R({ x1: a, x2: b, y1: zf(2500), y2: zf(2100) }, `fill="${RANG.shisha}" stroke="${RANG.shishaCh}" stroke-width="10"`));
  [[100, a], [b, 3300]].forEach(([u, v]) => q.push(R({ x1: u, x2: v, y1: zf(1600), y2: zf(1000) }, 'fill="#dfe6ea"')));
  // barg — yopiq (to'liq) va ochiq (punktir, o'ng tomonga surilgan)
  q.push(`<line x1="${a - 60}" y1="${zf(2160)}" x2="${b + TK.surma + 60}" y2="${zf(2160)}" stroke="${RG.yangi}" stroke-width="45"/>`);
  q.push(R({ x1: a - 30, x2: b + 30, y1: zf(2120), y2: zf(10) }, `fill="#cfe3f2" fill-opacity=".85" stroke="#4a4e54" stroke-width="28"`),
    R({ x1: a - 30, x2: b + 30, y1: zf(1600), y2: zf(1000) }, 'fill="#dfe6ea"'),
    R({ x1: a + 70, x2: a + 100, y1: zf(1450), y2: zf(750) }, 'fill="#c9ccce"'));
  q.push(R({ x1: a + TK.surma - 30, x2: b + TK.surma + 30, y1: zf(2120), y2: zf(10) }, `fill="none" stroke="#4a4e54" stroke-width="16" stroke-dasharray="60 40"`));
  q.push(strelka([a + 350, zf(500)], [a + TK.surma + 350, zf(500)], RG.yangi, 30));
  q.push(zanjir([a, b], 280, true, 1, { size: 1.3, tomon: 1 }), zanjir([-2500, -2100, 0], 3420, false, 1, { size: 1.3, tomon: 1 }));
  q.push(T(a + TK.surma, zf(2350), 'relsli yo\'naltiruvchi (koridor tomonda)', 120, `text-anchor="middle" fill="${RG.yangi}" font-weight="700"`));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 ${zf(3650)} 3900 ${3650 + 650}" width="100%">${q.join('')}</svg>`;
}

// ---------- HTML ----------
const CSS = `
@page { size: 420mm 297mm; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
body { font-family: 'Liberation Sans', Arial, sans-serif; color: #222; }
.varaq { width: 420mm; height: 297mm; padding: 6mm 7mm; display: grid; grid-template-columns: 196mm 1fr; gap: 5mm; overflow: hidden; }
.ram { border: .45mm solid #111; position: relative; height: 285mm; }
.ram svg { display: block; }
.yorliq { position: absolute; left: 3mm; top: 2.5mm; font-size: 8.5pt; font-weight: 700; color: #1F3657; background: rgba(255,255,255,.92); padding: .5mm 1.2mm; z-index: 2; }
.ong { display: flex; flex-direction: column; gap: 2.5mm; font-size: 7.6pt; line-height: 1.4; }
h1 { font-size: 13pt; color: ${RG.yangi}; } h2 { font-size: 9pt; color: #1F3657; border-bottom: .3mm solid #1F3657; padding-bottom: .4mm; margin-bottom: 1mm; }
.blok { border: .3mm solid #ccc; border-radius: 1mm; padding: 1.5mm 2mm; }
.ikki { display: grid; grid-template-columns: 74mm 1fr; gap: 3mm; }
ol { margin-left: 4.5mm; } li { margin-bottom: .7mm; }
.savol { border: .4mm solid ${RG.yangi}; background: ${RG.yangiF}; border-radius: 1mm; padding: 1.5mm 2mm; }
.belgi { display: flex; flex-wrap: wrap; gap: .8mm 3.5mm; font-size: 7pt; } .belgi i { display: inline-block; width: 6mm; height: 2.4mm; vertical-align: -.3mm; margin-right: 1mm; }
.kichik { font-size: 6.8pt; color: #555; }
`;
export function taklifHtml() {
  const sr4 = m2(SR4), kl = m2(KL('K1'));
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>Taklif — koridor davomi</title><style>${CSS}</style></head><body>
  <section class="varaq">
    <div class="ram"><div class="yorliq">TAKLIF (eskiz) · Sharqiy qism rejasi: koridor davomi, kladovka, konditsioner — ~1:50</div>${rejaSvg()}</div>
    <div class="ong">
      <div><h1>Koridorlar 4-xona orqali davom etadi — tushunganim (tasdiq uchun)</h1>
        <div class="kichik">${LOYIHA.brend} · ${LOYIHA.filial} · 2-qavat · 16.10.2026 · model hali o'zgartirilmagan — tasdiqdan keyin chizmalar, 3D, xarajat qayta tayyorlanadi</div></div>
      <div class="belgi"><span><i style="border:.5mm solid ${RG.yangi};background:${RANG.shisha}"></i>yangi shisha devor</span><span><i style="border:.5mm solid ${RG.yangi};background:#fde3c4"></i>yangi GKL</span>
        <span><i style="border:.4mm dashed ${RANG.buz}"></i>olib tashlanadi (logotip devori)</span><span><i style="background:${RG.yangiF};border:.3mm solid ${RG.yangi}"></i>kladovka</span>
        <span><i style="background:${RG.berF};border:.4mm solid ${RG.ber}"></i>konditsioner kanali, diffuzor</span><span><i style="background:${RG.tozaF};border:.4mm solid ${RG.toza}"></i>tashqi havo 30%</span></div>
      <div class="blok"><h2>Kesim A–A: K1 koridori o'qi bo'ylab (3-xona devoriga qarab), ~1:50</h2>${kesimSvg()}</div>
      <div class="ikki">
        <div class="blok"><h2>Eshik: 1 m, yonga suriladi (Damas eshigi kabi)</h2>${eshikSvg()}
          <div class="kichik">Barg devor bo'ylab suriladi, ochilganda yonidagi shisha oldida turadi — koridorga ham, xonaga ham ochilmaydi.</div></div>
        <div class="blok"><h2>Tushunganim</h2><ol>
          <li><b>K1 va K2 koridorlari</b> 4-xona orqali davom etadi; koridor oxiridagi logotip devorlari (hozir 19.3 m da) olib tashlanadi.</li>
          <li><b>4-xonaning o'rtasida</b> (x ≈ ${son(XK)}) koridor ko'ndalang devor bilan yopiladi, eshigi bor — orqasi <b>kladovka</b> (KL1, KL2, ~${son(KL('K1').x2 - KL('K1').x1)} × 1 500, ${kl.toFixed(1)} m²).</li>
          <li><b>4-xona kichrayadi:</b> ${son(SR4.x2 - SR4.x1)} × ${son(SR4.y2 - SR4.y1)} = ${sr4.toFixed(1)} m² (avval 46.6). 24 o'rin sig'ishi tekshiriladi.</li>
          <li><b>3-, 4-, 5-xonaning</b> koridorga qaragan devori kladovkagacha <b>shisha</b>; kladovka qismi — GKL.</li>
          <li><b>Eshiklar 1 m, yonga suriladigan</b> (founder taklifi) — rasmda 3-, 4-, 5-xona eshiklari.</li>
          <li><b>Konditsioner:</b> har kladovka ustida, devorga taqalgan kanalli blok (KK1, KK2); havo koridor bo'ylab to'g'ri kanal bilan, xonalarga avvalgi chizmadagidek (sinfga 2, XZ ga 1 diffuzor). Qaytish havosi — kladovka eshigidagi panjara orqali.</li>
          <li><b>Tashqi havo 30%</b> — kladovka orqasidagi tashqi devordan (derazasiz), panjara orqali blokka. 3-xona fasadidan olish endi kerak emas.</li>
          <li><b>Vitechka</b> o'zgarmaydi (magistral koridorlarni kesib o'tadi — kanallar balandlik bo'yicha ajratiladi).</li></ol></div>
      </div>
      <div class="savol"><b>Diqqat:</b> 30% tashqi havoda har blok ~1 500 m³/soat oladi — sinfga ~400 m³/soat (me'yor 600): to'la sinfda CO₂ ~1 400–1 500 ppm, havo biroz og'irlashadi. Shuning uchun vitechka ham shunga moslab (~3 000 m³/soat) kamaytiriladi, aks holda qavat manfiy bosimda qoladi. Blok quvvati masalasi (96k yetmasligi) hali ochiq.</div>
    </div>
  </section></body></html>`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const nom = join(CH, `Xadra_2-qavat_taklif_koridor-davomi_${LOYIHA.versiya}`);
  const brauzer = await chromium.launch();
  const p = await brauzer.newPage({ viewport: { width: 1588, height: 1123 }, deviceScaleFactor: 2 });
  await p.setContent(taklifHtml(), { waitUntil: 'load' });
  await p.pdf({ path: nom + '.pdf', width: '420mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
  await (await p.$('section.varaq')).screenshot({ path: nom + '.png' });
  const tosh = await p.$eval('.ong', e => e.scrollHeight - e.clientHeight);
  await brauzer.close();
  console.log(nom + '.pdf', '4-xona', m2(SR4).toFixed(1), 'm2; kladovka', m2(KL('K1')).toFixed(1), 'm2; panel toshishi', tosh);
}
