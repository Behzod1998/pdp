// Past tokli va elektr tizimlari (buyurtmachi, 18.10): kamera kuzatuvi, internet va Wi-Fi, yong'in signalizatsiyasi, elektr.
// Qurilmalar joyi — buyurtmachi belgilagan rasmlar bo'yicha (taxminiy koordinata, joyida aniqlanadi). Har tizim — alohida PDF:
// 2-qavat varag'i (yoki varaqlari) va 1- + 3-qavat varag'i; kabel yo'llari, raqamlar, uzunliklar va jadvallar.
// Kabel yo'li: qurilmadan eng yaqin lotokka (shift ostida) to'g'ri burchakli tarmoq, lotok bo'ylab shkaf/pultgacha, qavatlar orasida —
// zina bo'ylab stoyak (S1 — 1↔2-qavat, S2 — 2↔3-qavat). Uzunlik: gorizontal × 1.1 (burilish va aylanib o'tish) + tushish + zaxira.
// Ishlatish: node tizim-chizma.mjs → chizma/Xadra_tizim_{kamera,internet,pojarniy,elektr}_v….pdf (+ png)
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { LOYIHA, H, ICHKI, XONALAR, KLADOVKA, sinflar, bolaklar } from './model.mjs';
import { asos, oqBelgi, T, R, son, ISH_CSS } from './ish-chizma.mjs';
import { ventHisob, VC } from './vent-chizma.mjs';
import { rangsiz1Svg, rangsiz3Svg } from './rangsiz-13.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(join(process.execPath, '../../lib/node_modules/playwright'))); }
const BU = dirname(fileURLToPath(import.meta.url)), CH = join(BU, '..', 'chizma');
const X = Object.fromEntries(XONALAR.map(x => [x.kod, x]));
const KX = KLADOVKA.x;
const SANA = '18.10.2026';

// ===================== kabel yo'llari (lotoklar) =====================
// past tokli lotok (kamera, internet, yong'in): koridorlarda XZ tomondagi devor yonida (kladovka shifti ustidan tashqi devorgacha),
// koworkingda sharqiy devor bo'ylab
const LT = {
  2: [[[5800, 9200], [23500, 9200]], [[5800, 15200], [23500, 15200]], [[5800, 5600], [5800, 21600]],
    [[2800, 5600], [5800, 5600]], [[3550, 18700], [5800, 18700]], [[6550, 9200], [6550, 11850]]],
  3: [[[2800, 5800], [5600, 5800]], [[3200, 600], [3200, 5800]], [[5600, 1000], [5600, 5800]], [[5600, 4850], [6300, 4850]]],   // oxirgisi — 5-xonaga eshik ustidan
  1: [[[6150, 2300], [6150, 2950]], [[6150, 2950], [6150, 5700]], [[800, 3300], [6150, 3300]]],
};
// kuch lotogi (elektr): koridorlarning qarama-qarshi devori yonida; shit — 6-xonada (o'tish yo'lagi), kirishda o'ng tomonda
const EL = {
  2: [[[5650, 6150], [5650, 21600]], [[5650, 7950], [23500, 7950]], [[5650, 16450], [23500, 16450]], [[3550, 18700], [5650, 18700]]],
  1: [[[6150, 2300], [6150, 5700]]],
};
// stoyaklar (zina bo'ylab, gofra quvurda): S1 — ZN2 (asosiy zina) 2-qavat ↔ 1-qavat zina maydonchasi devori; S2 — ZN1 ↔ 3-qavat zinasi
const STOYAK = [
  { kod: 'S1', a: [2, [3550, 18700]], b: [1, [6150, 2300]], L: 4000, izoh: '1↔2-qavat, asosiy zina (ZN2) bo\'ylab' },
  { kod: 'S2', a: [2, [2800, 5600]], b: [3, [2800, 5800]], L: 4000, izoh: '2↔3-qavat, ZN1 zinasi bo\'ylab' },
];
const SHIFT = H - 200;          // lotok sathi, mm
// 2-qavat lotok nomlari (LT[2], EL[2] tartibida) va xona qaysi lotokka ulanadi: K1 tomondagi xonalar — K1 lotogiga,
// K2 tomondagilar — K2 ga (devor orqali qo'shni xonaga o'tib ketmasin); 4-xona — ikkalasiga ham
const LT_NOM = ['K1', 'K2', 'KW', 'ZN1', 'ZN2', 'XZ4'], EL_NOM = ['KW', 'K1', 'K2', 'ZN2'];
const XONA_LOTOK = Object.fromEntries([
  ...['SR1', 'SR2', 'SR3', 'XZ3', 'K1', 'KL1'].map(k => [k, ['K1']]), ['XZ4', ['K1', 'XZ4']],
  ...['SR5', 'SR6', 'SR7', 'XZ1', 'XZ2', 'K2', 'KL2'].map(k => [k, ['K2']]), ['SR4', ['K1', 'K2']],
]);

// ---------- graf ----------
const kalit = (q, p) => `${q}:${Math.round(p[0])},${Math.round(p[1])}`;
const d1 = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
const ustida = (s, p) => (s[0][1] === s[1][1]
  ? Math.abs(p[1] - s[0][1]) < 1 && p[0] >= Math.min(s[0][0], s[1][0]) - 1 && p[0] <= Math.max(s[0][0], s[1][0]) + 1
  : Math.abs(p[0] - s[0][0]) < 1 && p[1] >= Math.min(s[0][1], s[1][1]) - 1 && p[1] <= Math.max(s[0][1], s[1][1]) + 1);
function graf(tarmoq, stoyaklar, nomlar = []) {
  const qirra = [], tugun = new Map();
  const qosh = (k, p, q) => { if (!tugun.has(k)) tugun.set(k, { k, p, q, qo: [] }); return tugun.get(k); };
  for (const [q, segs] of Object.entries(tarmoq)) {
    const nuq = segs.flatMap(s => s);
    segs.forEach(s => segs.forEach(t => {     // kesishuvlar
      if (s === t || (s[0][1] === s[1][1]) === (t[0][1] === t[1][1])) return;
      const h = s[0][1] === s[1][1] ? s : t, v = h === s ? t : s, p = [v[0][0], h[0][1]];
      if (ustida(h, p) && ustida(v, p)) nuq.push(p);
    }));
    segs.forEach(s => {
      const pts = nuq.filter(p => ustida(s, p)).sort((a, b) => d1(a, s[0]) - d1(b, s[0]))
        .filter((p, i, a) => i === 0 || d1(p, a[i - 1]) > 1);
      for (let i = 0; i < pts.length - 1; i++) {
        const u = qosh(kalit(q, pts[i]), pts[i], +q), v = qosh(kalit(q, pts[i + 1]), pts[i + 1], +q), L = d1(pts[i], pts[i + 1]);
        const e = { u, v, L, q: +q, n: 0, id: qirra.length };
        qirra.push(e); u.qo.push(e); v.qo.push(e);
      }
    });
  }
  stoyaklar.forEach(s => {
    const u = tugun.get(kalit(...s.a)), v = tugun.get(kalit(...s.b));
    if (!u || !v) return;
    const e = { u, v, L: s.L, q: 0, stoyak: s, n: 0, id: qirra.length };
    qirra.push(e); u.qo.push(e); v.qo.push(e);
  });
  return { qirra, tugun, segs: tarmoq, nomlar };
}
function dijkstra(G, bosh) {
  const d = new Map([[bosh.k, 0]]), oldin = new Map(), ochiq = new Set([bosh]);
  while (ochiq.size) {
    let u = null; for (const t of ochiq) if (!u || d.get(t.k) < d.get(u.k)) u = t;
    ochiq.delete(u);
    for (const e of u.qo) {
      const v = e.u === u ? e.v : e.u, nd = d.get(u.k) + e.L;
      if (!d.has(v.k) || nd < d.get(v.k)) { d.set(v.k, nd); oldin.set(v.k, { u, e }); ochiq.add(v); }
    }
  }
  return { d, oldin };
}
// qurilmani eng yaqin lotokka ulash: lotokka perpendikulyar; lotok chetidan tashqarida bo'lsa — avval xona devori bo'ylab, keyin lotokka
function ulash(G, q, p, xona = null) {
  let eng = null;
  const ruxsat = q === 2 && XONA_LOTOK[xona];
  (G.segs[q] || []).forEach((s, i) => {
    if (ruxsat && !ruxsat.includes(G.nomlar[i])) return;
    const gor = s[0][1] === s[1][1];
    const [a, b] = gor ? [Math.min(s[0][0], s[1][0]), Math.max(s[0][0], s[1][0])] : [Math.min(s[0][1], s[1][1]), Math.max(s[0][1], s[1][1])];
    const t = Math.min(b, Math.max(a, gor ? p[0] : p[1]));
    const oyoq = gor ? [t, s[0][1]] : [s[0][0], t];
    const yol = (gor ? t === p[0] : t === p[1]) ? [p, oyoq] : [p, gor ? [t, p[1]] : [p[0], t], oyoq];
    const L = d1(p, oyoq), baho = L + Math.abs((gor ? p[0] : p[1]) - t);     // lotok chetidan aylanib o'tish — jarima
    if (!eng || baho < eng.baho - 1) eng = { oyoq, yol, L, baho };
  });
  const e = G.qirra.find(e => e.q === q && ustida([e.u.p, e.v.p], eng.oyoq));
  return { ...eng, e };
}
// bosh nuqtagacha yo'l: [{e, qism: 'to'liq' | {dan: tugun, L}}], uzunlik
function yolTop(G, D, ul) {
  const { e, oyoq } = ul;
  const du = D.d.get(e.u.k) + d1(oyoq, e.u.p), dv = D.d.get(e.v.k) + d1(oyoq, e.v.p);
  const [t, Lq] = du <= dv ? [e.u, d1(oyoq, e.u.p)] : [e.v, d1(oyoq, e.v.p)];
  const bolak = [{ e, dan: t, L: Lq }];
  let k = t.k;
  while (D.oldin.has(k)) { const { u, e: ee } = D.oldin.get(k); bolak.push({ e: ee, toliq: true }); k = u.k; }
  return { bolak, L: Math.min(du, dv), pts: [oyoq, t.p] };
}
// bir nechta yo'lning birlashmasi (shleyf yoki guruh kabeli lotokda bir marta yotadi)
function birlashma(yollar) {
  const m = new Map();
  yollar.forEach(y => y.bolak.forEach(b => {
    const o = m.get(b.e.id) || { e: b.e, toliq: false, u: 0, v: 0 };
    if (b.toliq) o.toliq = true; else if (b.dan === b.e.u) o.u = Math.max(o.u, b.L); else o.v = Math.max(o.v, b.L);
    m.set(b.e.id, o);
  }));
  let L = 0;
  for (const o of m.values()) L += o.toliq ? o.e.L : Math.min(o.e.L, o.u + o.v);
  return { L, qirralar: [...m.values()] };
}
const uzunR = pts => pts.slice(1).reduce((t, p, i) => t + d1(pts[i], p), 0);
const m1 = v => Math.round(v / 1000);             // mm → m (butun)
const KOEF = 1.1;

// ===================== qurilmalar =====================
const qur = (kod, q, p, xona, izoh = '', o = {}) => ({ kod, q, p, xona, izoh, ...o });
// ---------- kameralar (24): 2-qavat 20, 3-qavat 3, 1-qavat 1 ----------
export const KAMERALAR = [
  qur('K1', 2, [400, 400], 'ZN1', 'zina — shimoli-g\'arbiy burchak'), qur('K2', 2, [400, 6000], 'ZN1', 'zina — janubi-g\'arbiy burchak'),
  qur('K3', 2, [400, 6900], 'KW', 'koworking — shimoli-g\'arbiy burchak'),
  qur('K4', 2, [6450, 300], 'SR1', 'shimoli-g\'arbiy burchak'), qur('K5', 2, [12350, 300], 'SR2', 'shimoli-g\'arbiy burchak'),
  qur('K6', 2, [23050, 350], 'SR3', 'shimoli-sharqiy burchak (GKL quti chetida)'),
  qur('K7', 2, [6450, 7950], 'K1', 'g\'arbiy boshi'), qur('K8', 2, [20800, 8950], 'K1', 'sharqiy oxiri, kladovka oldida'),
  qur('K9', 2, [11800, 12050], 'XZ4', 'janubi-sharqiy burchak', { yoz: 'chap' }), qur('K10', 2, [17800, 12050], 'XZ3', 'janubi-sharqiy burchak', { yoz: 'chap' }),
  qur('K11', 2, [11800, 12550], 'XZ1', 'shimoli-sharqiy burchak'), qur('K12', 2, [17800, 12550], 'XZ2', 'shimoli-sharqiy burchak'),
  qur('K13', 2, [23100, 14850], 'SR4', 'janubi-sharqiy burchak (GKL quti chetida)'),
  qur('K14', 2, [6450, 15250], 'K2', 'g\'arbiy boshi'), qur('K15', 2, [20800, 16350], 'K2', 'sharqiy oxiri, kladovka oldida'),
  qur('K16', 2, [400, 18200], 'KW', 'koworking — janubi-g\'arbiy burchak, panjara oldida'), qur('K17', 2, [400, 18750], 'ZN2', 'kirish zinasi — g\'arbiy devorda'),
  qur('K18', 2, [11800, 24250], 'SR7', 'janubi-sharqiy burchak', { yoz: 'chap' }), qur('K19', 2, [17800, 24250], 'SR6', 'janubi-sharqiy burchak', { yoz: 'chap' }),
  qur('K20', 2, [23700, 24250], 'SR5', 'janubi-sharqiy burchak'),
  qur('K21', 3, [11400, 11850], '5', "o'quv xonasi — janubi-sharqiy burchak"), qur('K22', 3, [3200, 5900], '1', 'koridor — zina va qozonxona devori burchagi'),
  qur('K23', 3, [450, 450], 'Z', 'zina — shimoli-g\'arbiy burchak'),
  qur('K24', 1, [6150, 2550], 'zal', 'resepshn — sharqiy devor, zal va eshikka qaragan'),
];
// ---------- internet: RJ-45 (ikki portli, poldan 30 sm) 16 ta, Wi-Fi nuqtasi (PoE, shiftda) 6 ta ----------
export const RJ45 = [
  qur('R1', 2, [11800, 400], 'SR1', 'doska devori, deraza cheti', { yoz: 'chap' }), qur('R2', 2, [17800, 400], 'SR2', 'doska devori, deraza cheti', { yoz: 'chap' }),
  qur('R3', 2, [18300, 400], 'SR3', 'doska devori, deraza cheti'), qur('R4', 2, [11800, 9550], 'XZ4', 'shimoli-sharqiy burchak', { yoz: 'chap' }),
  qur('R5', 2, [17800, 9550], 'XZ3', 'shimoli-sharqiy burchak', { yoz: 'chap' }), qur('R6', 2, [18400, 9550], 'SR4', 'doska devori, shimoliy cheti'),
  qur('R7', 2, [150, 11900], 'KW', "g'arbiy devor o'rtasida"), qur('R8', 2, [5800, 11900], 'KW', "sahna devori (ekran ostida)", { yoz: 'chap' }),
  qur('R9', 2, [6350, 14750], 'XZ1', 'janubi-g\'arbiy burchak'), qur('R10', 2, [12250, 14800], 'XZ2', 'janubi-g\'arbiy burchak'),
  qur('R11', 2, [5800, 24250], 'X12', 'janubi-sharqiy burchak', { yoz: 'chap' }), qur('R12', 2, [6250, 24250], 'SR7', 'doska devori, deraza cheti'),
  qur('R13', 2, [12250, 24250], 'SR6', 'doska devori, deraza cheti'), qur('R14', 2, [18250, 24250], 'SR5', 'doska devori, deraza cheti'),
  qur('R15', 3, [11450, 3550], '5', 'doska devori, deraza cheti'), qur('R16', 1, [6150, 5500], 'zal', 'resepshn stoykasi ortida'),
];
export const AP = [
  qur('W1', 2, [9750, 8550], 'K1', 'koridor shifti'), qur('W2', 2, [17700, 8550], 'K1', 'koridor shifti'),
  qur('W3', 2, [9550, 15850], 'K2', 'koridor shifti'), qur('W4', 2, [18000, 15850], 'K2', 'koridor shifti'),
  qur('W5', 2, [3200, 13350], 'KW', 'koworking markazi'), qur('W6', 3, [8800, 7000], '5', "o'quv xonasi o'rtasi"),
];
const SHKAF = { q: 2, p: [6550, 11850], r: { x1: 6250, x2: 6850, y1: 11550, y2: 12150 } };     // XZ4 — NVR va tarmoq shkafi

// ---------- yong'in signalizatsiyasi ----------
// datchiklar (tutun, adressiz) — buyurtmachi belgilagan 50 ta + kladovkalar (2) + 3-qavat tamburi (yangi devor ortida, me'yor bo'yicha)
const DAT = {
  Sh1: [['ZN1', [2100, 1050]], ['ZN1', [2100, 4350]], ['4', [4430, 2650]], ['6', [5050, 5100]], ['KW', [2040, 9110]], ['KW', [4430, 9110]],
    ['KW', [2040, 15160]], ['KW', [4120, 15200]], ['ZN2', [1270, 19530]], ['ZL', [3900, 19560]], ['X12', [1290, 22710]], ['X12', [4735, 22710]]],
  Sh2: [['SR1', [8870, 1980]], ['SR1', [9020, 5480]], ['SR2', [14620, 1820]], ['SR2', [14670, 5560]], ['SR3', [20400, 1770]], ['SR3', [20320, 5480]],
    ['K1', [8920, 8550]], ['K1', [18980, 8550]], ['KL1', [22500, 8550]], ['XZ4', [7940, 11100]], ['XZ4', [10300, 11100]], ['XZ3', [13720, 11100]], ['XZ3', [15880, 11100]]],
  Sh3: [['SR4', [20800, 10500]], ['SR4', [20700, 13380]], ['XZ1', [7610, 13250]], ['XZ1', [10950, 13250]], ['XZ2', [13720, 13300]], ['XZ2', [16240, 13300]],
    ['K2', [8920, 15850]], ['K2', [15980, 15850]], ['KL2', [22500, 15850]], ['SR7', [8840, 18280]], ['SR7', [8770, 22500]], ['SR6', [14750, 18200]], ['SR6', [14540, 22580]],
    ['SR5', [20650, 18230]], ['SR5', [20600, 22530]]],
  Sh4: [['Z', [1420, 1630]], ['Z', [1460, 4660]], ['1', [4130, 2150]], ['1', [4080, 4440]], ['1t', [5200, 2000]], ['2', [7190, 2130]], ['2', [10700, 2070]],
    ['3', [1030, 7800]], ['3', [3250, 7740]], ['5', [8450, 5860]], ['5', [8270, 9740]]],
  Sh5: [['zal', [4090, 3230]], ['zal', [1460, 3390]]],
};
const SHLEYF_Q = { Sh1: 2, Sh2: 2, Sh3: 2, Sh4: 3, Sh5: 1 };
const SHLEYF_NOM = { Sh1: "2-qavat g'arbiy qismi: zina ZN1, WC, 6-xona, koworking, kirish, CEO", Sh2: '2-qavat K1 tomoni: 1–3-xona, K1, KL1, XZ4, XZ3',
  Sh3: '2-qavat K2 tomoni: 4–7-xona, K2, KL2, XZ1, XZ2', Sh4: '3-qavat: zina, koridor, tambur, WC, qozonxona, 5-xona', Sh5: '1-qavat: zal' };
const DATCHIK = Object.entries(DAT).flatMap(([sh, l]) => l.map(([xona, p], i) => qur(`${sh.slice(2)}.${i + 1}`, SHLEYF_Q[sh], p, xona, '', { sh })));
// qo'lda ishga tushiriladigan tugmalar (IPR, poldan 1.5 m) — evakuatsiya yo'lida, chiqishlar yonida
const IPR = [
  qur('Q1', 2, [3700, 19150], 'ZL', 'ZN2 zinasiga chiqishda'), qur('Q2', 2, [3200, 5000], '6', 'ZN1 zinasiga chiqishda'),
  qur('Q3', 2, [12050, 7850], 'K1', "K1 o'rtasida (1–2-xona orasidagi ustunda)"), qur('Q4', 2, [12050, 16550], 'K2', "K2 o'rtasida (7–6-xona orasidagi ustunda)"),
  qur('Q5', 3, [3050, 1650], '1', 'zinadan chiqishda'), qur('Q6', 1, [3150, 6000], 'zal', 'chiqish eshigi yonida'),
];
// ogohlantirish: ovozli-yorug'lik sirenalari, «CHIQISH» tablolari (SOUE 2-tur), avariya chiroqlari (akkumulyatorli)
const SIRENA = [
  qur('O1', 2, [1800, 6650], 'KW', 'koworking shimoliy devori'), qur('O2', 2, [15000, 9200], 'K1', 'K1, XZ3 devori'),
  qur('O3', 2, [15000, 15150], 'K2', 'K2, XZ2 devori'), qur('O4', 2, [4800, 18450], 'ZL', 'kirish zali'),
  qur('O5', 3, [3800, 5900], '1', 'koridor'), qur('O6', 1, [3000, 200], 'zal', 'shimoliy devor'),
];
const TABLO = [
  qur('T1', 2, [3750, 18950], 'ZL', 'ZN2 zinasiga chiqish'), qur('T2', 2, [4800, 6650], 'KW', '6-xona (ZN1 ga) eshigi ustida'),
  qur('T3', 2, [3250, 5700], '6', 'ZN1 zina eshigi ustida'), qur('T4', 2, [13000, 8550], 'K1', "yo'nalish ko'rsatkichi (koworking tomonga)"),
  qur('T5', 2, [13000, 15850], 'K2', "yo'nalish ko'rsatkichi (koworking tomonga)"), qur('T6', 3, [3150, 950], '1', 'zina eshigi ustida'),
  qur('T7', 1, [4100, 5950], 'zal', 'chiqish eshigi ustida'),
];
const AVARIYA = [
  qur('A1', 2, [10400, 8550], 'K1'), qur('A2', 2, [17000, 8550], 'K1'), qur('A3', 2, [10400, 15850], 'K2'), qur('A4', 2, [17000, 15850], 'K2'),
  qur('A5', 2, [2975, 9500], 'KW'), qur('A6', 2, [2975, 16000], 'KW'), qur('A7', 2, [4800, 20300], 'ZL'), qur('A8', 2, [4500, 5600], '6'),
  qur('A9', 2, [1500, 3000], 'ZN1'), qur('A10', 2, [1800, 19800], 'ZN2'),
  qur('A11', 3, [3800, 3500], '1'), qur('A12', 3, [1600, 3000], 'Z'), qur('A13', 1, [3500, 5200], 'zal'),
];
const PULT = { q: 1, p: [6150, 2950], r: { x1: 5950, x2: 6250, y1: 2700, y2: 3200 } };   // PPK — 1-qavat resepshn (sharqiy devor)

// ---------- elektr ----------
// rozetkalar (kvadrat X — poldan 30 sm), interaktiv doska rozetkasi (uchburchak — 1.6 m), vyklyuchatel (aylana X — 0.9 m)
const roz = (xona, ...pts) => pts.map(p => ({ xona, p, tur: 'r' }));
const ROZETKA = [
  ...roz('SR1', [6350, 1540], [6350, 3080], [6350, 4620], [6350, 6160], [11850, 850], [11850, 2050], [11850, 5650], [11850, 6850]),
  ...roz('SR2', [12250, 1540], [12250, 3080], [12250, 4620], [12250, 6160], [17850, 850], [17850, 2050], [17850, 5650], [17850, 6850]),
  ...roz('SR3', [18250, 850], [18250, 2050], [18250, 5650], [23800, 1540], [23800, 3080], [23800, 4620], [23800, 6160]),
  ...roz('SR4', [18350, 9900], [18350, 10400], [18350, 14100], [23300, 9500], [23800, 11300], [23800, 13100], [23300, 14900]),
  ...roz('SR5', [18250, 17550], [18250, 18750], [18250, 22350], [18250, 23550], [23800, 18240], [23800, 19780], [23800, 21320], [23800, 22860]),
  ...roz('SR6', [12250, 17550], [12250, 18750], [12250, 22350], [12250, 23550], [17850, 18240], [17850, 19780], [17850, 21320], [17850, 22860]),
  ...roz('SR7', [6250, 17550], [6250, 18750], [6250, 22350], [6250, 23550], [11850, 18240], [11850, 19780], [11850, 21320], [11850, 22860]),
  ...roz('XZ4', [6350, 11250], [8350, 12100], [10350, 12100], [11850, 10800]),
  ...roz('XZ3', [12250, 10800], [14500, 12100], [16000, 12100], [17850, 12050]),
  ...roz('XZ1', [6350, 14300], [8100, 12500], [10650, 12500], [11850, 14800]),
  ...roz('XZ2', [12250, 13300], [13400, 12500], [16700, 12500], [17850, 14850]),
  ...roz('KW', [100, 8000], [100, 12400], [100, 16800], [4250, 6600], [5800, 12200]),
  ...roz('X12', [5850, 22900], [1500, 24300], [4400, 24300]),
];
const DOSKA_R = sinflar().map(s => {
  const d = s.j.doska, cy = (d.y1 + d.y2) / 2, x = s.doska === 'ong' ? d.x1 - 100 : d.x2 + 100;
  return { xona: s.kod, p: [x, cy], tur: 'd' };
});
const VYKL = [
  ['SR1', [11850, 7600]], ['SR2', [17850, 7600]], ['SR3', [18225, 7600]], ['SR4', [18325, 14850]], ['SR5', [18225, 16800]], ['SR6', [12250, 16800]],
  ['SR7', [6250, 16800]], ['XZ4', [6350, 9500]], ['XZ3', [12250, 9500]], ['XZ1', [6350, 14900]], ['XZ2', [12250, 14900]],
  ['K1', [5900, 9450]], ['K2', [5900, 16800]],
].map(([xona, p]) => ({ xona, p, tur: 'v' }));
const ROZ1 = [{ xona: 'zal', p: [6150, 5060], tur: 'r' }, { xona: 'zal', p: [6150, 5570], tur: 'r' }];
const SHIT = { q: 2, p: [5650, 6150], r: { x1: 5150, x2: 5800, y1: 6150, y2: 6300 } };   // mavjud shit — 6-xona, kirishda o'ngda

// chiroqlar — 3D bilan bir xil (blender2.py): sinflarda 6 ta panel 600×600, XZ da 3 ta, koworkingda 11, koridorlarda chiziqli
function chiroqlar() {
  const V = ventHisob();
  const L = [];
  const qo = (x, y, a, b, o = {}) => L.push({ p: [x, y], a, b, ...o });
  sinflar().forEach(s => bolaklar(s).forEach(b => {
    if (b.x2 - b.x1 < 3000 || b.y2 - b.y1 < 3000) { [0.3, 0.75].forEach(f => qo(b.x1 + (b.x2 - b.x1) * f, (b.y1 + b.y2) / 2, 600, 600)); return; }
    const gor = b.x2 - b.x1 >= b.y2 - b.y1, [na, nb] = gor ? [3, 2] : [2, 3];
    for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++)
      qo(b.x1 + (b.x2 - b.x1) * (2 * i + 1) / (2 * na), b.y1 + (b.y2 - b.y1) * (2 * j + 1) / (2 * nb), 600, 600);
  }));
  ['XZ1', 'XZ2', 'XZ3', 'XZ4'].forEach(k => { const x = X[k]; [0.22, 0.5, 0.78].forEach(f => qo(x.x1 + (x.x2 - x.x1) * f, (x.y1 + x.y2) / 2, 600, 600)); });
  qo(1500, 22900, 600, 600); qo(4400, 22900, 600, 600);
  [1150, 3000, 4800].forEach(x => [8000, 11500, 15000].forEach(y => qo(x, y, 600, 600)));
  qo(1500, 17200, 600, 600); qo(3300, 17200, 600, 600); qo(4800, 19800, 600, 600); qo(4500, 2800, 400, 400); qo(4500, 5100, 400, 400);
  // diffuzor yoki panjaraga tegsa — eng yaqin bo'sh joyga (blender2.py bosh_joy)
  const TOS = [...V.D.map(d => [d.p[0], d.p[1], d.panel / 2 + 100]), ...V.P.map(p => [p.p[0], p.p[1], p.d / 2 + 150])];
  const XB = XONALAR.flatMap(x => bolaklar(x));
  const tegadi = (cx, cy, w, d) => TOS.some(([x, y, r]) => cx - w / 2 < x + r && x - r < cx + w / 2 && cy - d / 2 < y + r && y - r < cy + d / 2);
  L.forEach(l => {
    const [x, y] = l.p, w = l.a, d = l.b;
    if (!tegadi(x, y, w, d)) return;
    const bol = XB.find(b => b.x1 <= x && x <= b.x2 && b.y1 <= y && y <= b.y2);
    for (let k = 1; k < 16; k++) for (const [dx, dy] of [[k * 100, 0], [-k * 100, 0], [0, k * 100], [0, -k * 100]]) {
      const cx = x + dx, cy = y + dy;
      if (bol && !(bol.x1 + w / 2 + 150 <= cx && cx <= bol.x2 - w / 2 - 150 && bol.y1 + d / 2 + 150 <= cy && cy <= bol.y2 - d / 2 - 150)) continue;
      if (!tegadi(cx, cy, w, d)) { l.p = [cx, cy]; return; }
    }
  });
  ['K1', 'K2'].forEach(k => {
    const kr = X[k], yc = (kr.y1 + kr.y2) / 2, xk = kr.x2 - 2400;
    for (let x = 6700; x < xk - 300; x += 1200) qo(x, yc, 50, 1150, { chiziq: true });
    [-160, 0, 160].forEach(dy => qo(xk + 1000, yc + dy, 1900, 26, { kanopi: true }));
    qo(KX - 30, yc, 60, 700, { logo: true });
  });
  L.forEach(l => { l.xona = xonaTop(2, l.p); l.W = l.logo ? 30 : l.kanopi ? 25 : l.chiziq ? 36 : l.a === 400 ? 24 : 36; });
  return L;
}
function xonaTop(q, p) {
  if (q !== 2) return null;
  const x = XONALAR.find(x => bolaklar(x).some(b => b.x1 - 1 <= p[0] && p[0] <= b.x2 + 1 && b.y1 - 1 <= p[1] && p[1] <= b.y2 + 1));
  return x ? x.kod : null;
}

// ===================== hisob =====================
// yulduz sxemasi: har qurilmaga bosh nuqtadan alohida kabel (kamera, internet)
function yulduz(G, D, qurilmalar, { tushish, zaxira, bosh = 0 }) {
  return qurilmalar.map(d => {
    const ul = ulash(G, d.q, d.p, d.xona), y = yolTop(G, D, ul);
    y.bolak.forEach(b => { b.e.n++; });
    const stoyak = y.bolak.filter(b => b.e.stoyak).reduce((t, b) => t + b.e.L, 0);
    const gor = ul.L + y.L - stoyak;
    const L = gor * KOEF + stoyak + (tushish(d) + bosh + zaxira) * 1000 / 1;
    return { ...d, ul, y, L: L / 1000 };
  });
}
// shleyf / guruh: lotokdagi qismi bir marta, tarmoqlar — ikki marta (kirish-chiqish), oxirgisi bir marta
function shleyf(G, D, qurilmalar, { tushish, bosh = 0, ikki = true }) {
  const u = qurilmalar.map(d => { const ul = ulash(G, d.q, d.p, d.xona); return { ...d, ul, y: yolTop(G, D, ul) }; });
  const B = birlashma(u.map(d => d.y));
  const stoyak = B.qirralar.filter(o => o.e.stoyak).reduce((t, o) => t + o.e.L, 0);
  const tarmoq = u.reduce((t, d) => t + d.ul.L * (ikki ? 2 : 1), 0) - (ikki && u.length ? Math.max(...u.map(d => d.ul.L)) : 0);
  const vert = u.reduce((t, d) => t + tushish(d) * 1000 * (ikki ? 2 : 1), 0);
  const L = ((B.L - stoyak + tarmoq) * KOEF + stoyak + vert + bosh * 1000) / 1000;
  return { qurilmalar: u, B, L };
}
// xona ichidagi zanjir (rozetkadan rozetkaga devor ichida, chiroqdan chiroqqa shiftda): eng yaqin qo'shni tartibida
function zanjirTartib(boshP, nuqtalar) {
  const qol = [...nuqtalar], tar = []; let p = boshP;
  while (qol.length) { qol.sort((a, b) => d1(a.p, p) - d1(b.p, p)); const n = qol.shift(); tar.push(n); p = n.p; }
  return tar;
}

export function tizimHisob() {
  const GL = graf(LT, STOYAK, LT_NOM), GE = graf(EL, STOYAK.filter(s => s.kod === 'S1'), EL_NOM);
  const shkafT = GL.tugun.get(kalit(2, SHKAF.p)), pultT = GL.tugun.get(kalit(1, PULT.p)), shitT = GE.tugun.get(kalit(2, SHIT.p));
  // ---- kamera va internet: shkafdan yulduz ----
  const DL = dijkstra(GL, shkafT);
  GL.qirra.forEach(e => { e.n = 0; });
  const kam = yulduz(GL, DL, KAMERALAR, { tushish: () => 0.3, bosh: 2.3, zaxira: 2.0 });
  const nKam = new Map(GL.qirra.map(e => [e.id, e.n]));
  GL.qirra.forEach(e => { e.n = 0; });
  const rj = yulduz(GL, DL, RJ45, { tushish: () => 3.0, bosh: 2.3, zaxira: 2.0 });
  GL.qirra.forEach(e => { e.n *= 2; });          // ikki portli — har rozetkaga 2 kabel
  const ap = yulduz(GL, DL, AP, { tushish: () => 0.3, bosh: 2.3, zaxira: 2.0 });
  const nNet = new Map(GL.qirra.map(e => [e.id, e.n]));
  // ---- yong'in: 1-qavat pultidan shleyflar ----
  const DP = dijkstra(GL, pultT);
  const shl = Object.keys(DAT).map(sh => ({ sh, nom: SHLEYF_NOM[sh], ...shleyf(GL, DP, DATCHIK.filter(d => d.sh === sh), { tushish: () => 0.2, bosh: 1.5 }) }));
  const ipr = shleyf(GL, DP, IPR, { tushish: () => 1.8, bosh: 1.5 });
  const sir = shleyf(GL, DP, SIRENA, { tushish: () => 1.0, bosh: 1.5 });
  const tab = shleyf(GL, DP, TABLO, { tushish: () => 1.0, bosh: 1.5 });
  // ---- elektr: 6-xonadagi mavjud shitdan guruhlar ----
  const DE = dijkstra(GE, shitT);
  const LED = chiroqlar();
  const ROZ = [...ROZETKA, ...DOSKA_R];
  const guruh = [];
  const rGr = (kod, xonalar, nom, P, q = 2, roz = ROZ) => {
    const qism = xonalar.map(k => {
      const n = roz.filter(r => r.xona === k);
      const bosh = n.filter(r => r.tur === 'r').sort((a, b) => ulash(GE, q, a.p, k).L - ulash(GE, q, b.p, k).L)[0];
      return { xona: k, bosh, n, tar: zanjirTartib(bosh.p, n.filter(r => r !== bosh)) };
    });
    const yol = qism.map(z => { const ul = ulash(GE, q, z.bosh.p, z.xona); return { ul, y: yolTop(GE, DE, ul) }; });
    const B = birlashma(yol.map(y => y.y));
    const st = B.qirralar.filter(o => o.e.stoyak).reduce((t, o) => t + o.e.L, 0);
    let ichki = 0;
    qism.forEach((z, i) => {
      let p = z.bosh.p;
      z.tar.forEach(r => { ichki += d1(p, r.p) + (r.tur === 'd' ? 1300 * 2 : 0); p = r.p; });
      ichki += yol[i].ul.L + 3000;
    });
    const L = ((B.L - st) * KOEF + st + ichki * KOEF + 1500) / 1000;
    guruh.push({ kod, tur: 'r', nom, xonalar, qism, yol, B, L, P, ichki: ichki / 1000, kabel: 'VVGng-LS 3×2.5', avt: 'C16, 30 mA (difavtomat)', soni: qism.reduce((t, z) => t + z.n.filter(r => r.tur === 'r').length, 0), doska: qism.reduce((t, z) => t + z.n.filter(r => r.tur === 'd').length, 0) });
  };
  ['SR1', 'SR2', 'SR3', 'SR4', 'SR5', 'SR6', 'SR7'].forEach((k, i) => rGr(`R${i + 1}`, [k], `${k.slice(2)}-xona`, 2.0));
  rGr('R8', ['XZ4'], 'call-markaz (+ tarmoq shkafi)', 2.0); rGr('R9', ['XZ3'], 'ustozlar', 1.5);
  rGr('R10', ['XZ1'], 'sotuv', 1.0); rGr('R11', ['XZ2'], 'admin', 1.0); rGr('R12', ['KW', 'X12'], 'koworking, CEO', 2.0);
  rGr('R13', ['zal'], '1-qavat resepshn', 0.5, 1, ROZ1);
  // yoritish: vyklyuchatel — eng yaqin chiroq — zanjir
  const yGr = (kod, xonalar, nom) => {
    const qism = xonalar.map(k => {
      const v = VYKL.find(s => s.xona === k), ch = LED.filter(l => l.xona === k);
      const kirish = v || ch.slice().sort((a, b) => ulash(GE, 2, a.p, k).L - ulash(GE, 2, b.p, k).L)[0];
      return { xona: k, v, kirish, ch, tar: zanjirTartib(kirish.p, ch.filter(l => l !== kirish)) };
    });
    const yol = qism.map(z => { const ul = ulash(GE, 2, z.kirish.p, z.xona); return { ul, y: yolTop(GE, DE, ul) }; });
    const B = birlashma(yol.map(y => y.y));
    let ichki = 0;
    qism.forEach((z, i) => {
      let p = z.kirish.p;
      z.tar.forEach(l => { ichki += d1(p, l.p); p = l.p; });
      ichki += yol[i].ul.L + (z.v ? 2400 * 2 : 300);
    });
    const W = qism.reduce((t, z) => t + z.ch.reduce((s, l) => s + l.W, 0), 0) + (xonalar.includes('K1') ? 2 * 290 : 0);
    const L = (B.L * KOEF + ichki * KOEF + 1500) / 1000;
    guruh.push({ kod, tur: 'y', nom, xonalar, qism, yol, B, L, P: W / 1000, ichki: ichki / 1000, kabel: 'VVGng-LS 3×1.5', avt: 'C10', soni: qism.reduce((t, z) => t + z.ch.length, 0), vykl: qism.filter(z => z.v).length });
  };
  ['SR1', 'SR2', 'SR3', 'SR4', 'SR5', 'SR6', 'SR7'].forEach((k, i) => yGr(`Y${i + 1}`, [k], `${k.slice(2)}-xona`));
  yGr('Y8', ['XZ4', 'XZ3', 'XZ1', 'XZ2'], 'xizmat xonalari (XZ1–XZ4)');
  yGr('Y9', ['K1', 'K2'], 'koridorlar, kanopi, logotiplar, yashil LED');
  yGr('Y10', ['KW', 'ZL', 'X12', '5', '6'], 'koworking, kirish zali, CEO, WC tamburi, 6-xona');
  // kuch liniyalari: KK1, KK2 (tashqi bloklar tomda — kladovkadan tomga stoyak), VV1
  const kuch = [
    { kod: 'KK1', p: [21600, 8400], P: 10, kabel: 'VVGng-LS 5×4', avt: '3P C25', nom: 'KK1 — tashqi blok (tomda) + ichki blok', tom: 4000 },
    { kod: 'KK2', p: [21600, 15700], P: 10, kabel: 'VVGng-LS 5×4', avt: '3P C25', nom: 'KK2 — tashqi blok (tomda) + ichki blok', tom: 4000 },
    { kod: 'VV1', p: [VC.xM, VC.ven.y2], P: 0.4, kabel: 'VVGng-LS 3×1.5', avt: 'C10', nom: 'VV1 — vitechka ventilyatori', tom: 0 },
  ].map(k => { const ul = ulash(GE, 2, k.p, k.kod === 'VV1' ? 'SR2' : k.kod === 'KK2' ? 'K2' : 'K1'), y = yolTop(GE, DE, ul); return { ...k, ul, y, L: ((ul.L + y.L) * KOEF + k.tom + 3000) / 1000 }; });
  return { GL, GE, kam, rj, ap, nKam, nNet, shl, ipr, sir, tab, LED, guruh, kuch };
}

// ===================== chizish =====================
const RG = { kam: '#6a1b9a', net: '#1565c0', ap: '#00838f', yon: '#c62828', yonF: '#ffebee', roz: '#d84315', yor: '#a06a00', kuch: '#2e7d32', lotok: '#9aa3ad' };
const VB = { x1: -2900, y1: -2700, x2: 26700, y2: 26500 };
const svgOch = (vb, q) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x1} ${vb.y1} ${vb.x2 - vb.x1} ${vb.y2 - vb.y1}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">${q.join('')}</svg>`;
const chiz = (pts, rang, w, a = '') => `<polyline points="${pts.map(p => p.map(v => Math.round(v)).join(',')).join(' ')}" fill="none" stroke="${rang}" stroke-width="${w}" stroke-linejoin="round" ${a}/>`;
const XNOM = { SR1: '1-xona', SR2: '2-xona', SR3: '3-xona', SR4: '4-xona', SR5: '5-xona', SR6: '6-xona', SR7: '7-xona', XZ1: 'XZ1 sotuv', XZ2: 'XZ2 admin',
  XZ3: 'XZ3 ustozlar', XZ4: 'XZ4 call-markaz', KW: 'Koworking', X12: 'CEO', K1: 'K1', K2: 'K2', KL1: 'KL1', KL2: 'KL2', ZL: 'Kirish zali', ZN1: 'ZN1', ZN2: 'ZN2',
  4: 'WC tambur', 5: 'WC', 6: "6 · o'tish yo'lagi" };
const NOM3 = { 1: 'koridor', '1t': 'tambur', 2: 'WC', 3: 'qozonxona', 5: "5-xona (o'quv)", Z: 'zina' };
const joyNom = d => (d.q === 2 ? XNOM[d.xona] || d.xona : d.q === 3 ? `3-q. ${NOM3[d.xona] || d.xona}` : '1-q. zal');
const XYOZ = { SR1: [9100, 3600], SR2: [15050, 3600], SR3: [21000, 3600], SR4: [21300, 12300], SR5: [21000, 20700], SR6: [15050, 20700], SR7: [9050, 20700],
  XZ4: [9100, 10350], XZ3: [15050, 10350], XZ1: [9100, 14650], XZ2: [15050, 14650], KW: [2975, 12600], X12: [2975, 23700], ZL: [4800, 20800], ZN1: [1500, 5500], ZN2: [1800, 20600], KL1: [22500, 9150], KL2: [22500, 15350] };
const xonaNomlari = () => Object.entries(XYOZ).map(([k, [x, y]]) => T(x, y, XNOM[k], 220, 'text-anchor="middle" font-weight="700" fill="#8a929b"')).join('');
function asos2(h) { return [asos(VB, 1, { xonaYozuv: false }), oqBelgi(VB, 1), xonaNomlari()].join(''); }
// 1- va 3-qavat: rangsiz rejalar xira asos sifatida, yonma-yon (3-qavat chapda, 1-qavat o'ngda)
const DX1 = 15200, VB13 = { x1: -1500, y1: -2600, x2: 23700, y2: 21600 };
const ichi = s => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
function asos13() {
  return [`<rect x="${VB13.x1}" y="${VB13.y1}" width="${VB13.x2 - VB13.x1}" height="${VB13.y2 - VB13.y1}" fill="#fff"/>`,
    `<g opacity=".42">${ichi(rangsiz3Svg())}</g>`, `<g transform="translate(${DX1} 0)" opacity=".42">${ichi(rangsiz1Svg())}</g>`,
    T(5500, -1900, '3-QAVAT', 420, 'text-anchor="middle" font-weight="700" fill="#1F3657"'), T(DX1 + 3250, -1900, '1-QAVAT (kirish zali)', 420, 'text-anchor="middle" font-weight="700" fill="#1F3657"')].join('');
}
const tr = q => (q === 1 ? p => [p[0] + DX1, p[1]] : p => p);       // 1-qavat nuqtalarini umumiy varaqqa
const trR = (q, r) => { const f = tr(q), a = f([r.x1, r.y1]), b = f([r.x2, r.y2]); return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }; };

// lotoklar (ishlatilgan qirralar) va stoyaklar
function lotoklar(G, qavatlar, n = null, rang = RG.lotok) {
  const q = [];
  G.qirra.filter(e => qavatlar.includes(e.q) && (!n || n.get(e.id) > 0)).forEach(e => {
    const f = tr(e.q);
    q.push(chiz([f(e.u.p), f(e.v.p)], rang, 150, 'stroke-opacity=".35" stroke-linecap="square"'));
  });
  return q.join('');
}
function soniYozuv(G, qavatlar, n, rang, birlik = '') {
  const q = [];
  G.qirra.filter(e => qavatlar.includes(e.q) && n.get(e.id) > 0 && e.L >= 1200).forEach(e => {
    const f = tr(e.q), a = f(e.u.p), b = f(e.v.p), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], gor = a[1] === b[1];
    const s = `${n.get(e.id)}${birlik}`;
    q.push(gor ? `<rect x="${m[0] - 190}" y="${m[1] - 125}" width="380" height="250" rx="40" fill="#fff" stroke="${rang}" stroke-width="18"/>` + T(m[0], m[1] + 62, s, 165, `text-anchor="middle" fill="${rang}" font-weight="700"`)
      : `<rect x="${m[0] - 125}" y="${m[1] - 190}" width="250" height="380" rx="40" fill="#fff" stroke="${rang}" stroke-width="18"/>` + T(m[0] + 58, m[1], s, 165, `text-anchor="middle" fill="${rang}" font-weight="700" transform="rotate(-90 ${m[0] + 58} ${m[1]})"`));
  });
  return q.join('');
}
function stoyakSvg(qavatlar, G) {
  return STOYAK.flatMap(s => [s.a, s.b].filter(([q]) => qavatlar.includes(q)).map(([q, p]) => {
    if (!G.tugun.has(kalit(q, p))) return '';
    const [x, y] = tr(q)(p), yuqori = (q === s.a[0] ? s.b[0] : s.a[0]) > q;
    return `<circle cx="${x}" cy="${y}" r="230" fill="#fff" stroke="#26313d" stroke-width="30"/><path d="M${x - 110},${y + (yuqori ? 70 : -70)} L${x},${y + (yuqori ? -100 : 100)} L${x + 110},${y + (yuqori ? 70 : -70)}" fill="none" stroke="#26313d" stroke-width="34"/>` +
      T(x - 300, y + 70, s.kod, 190, 'text-anchor="end" font-weight="700" fill="#26313d"');
  })).join('');
}
const tarmoqChiz = (d, rang, w = 26, dash = '') => chiz(d.ul.yol.map(tr(d.q)), rang, w, dash ? `stroke-dasharray="${dash}"` : '');
// belgilar
const kameraSvg = (d, rang = RG.kam) => {
  const [x, y] = tr(d.q)(d.p);
  const cx = d.q === 2 ? (() => { const r = X[d.xona]; return r ? [(r.x1 + r.x2) / 2, (r.y1 + r.y2) / 2] : [x, y + 1]; })() : d.q === 3 ? [6000, 6000] : [3000, 4000];
  const [tx, ty] = d.q === 1 ? [cx[0] + DX1, cx[1]] : cx;
  const a = Math.atan2(ty - y, tx - x), r = 900, u = 0.55;
  return `<path d="M${x},${y} L${x + r * Math.cos(a - u)},${y + r * Math.sin(a - u)} A${r},${r} 0 0 1 ${x + r * Math.cos(a + u)},${y + r * Math.sin(a + u)} Z" fill="${rang}" fill-opacity=".14" stroke="none"/>` +
    `<circle cx="${x}" cy="${y}" r="170" fill="${rang}"/><circle cx="${x}" cy="${y}" r="70" fill="#fff"/>`;
};
const yozuv = (d, s, rang, dx = 260, dy = 70, anchor = 'start', size = 170) => { const [x, y] = tr(d.q)(d.p); return T(x + dx, y + dy, s, size, `text-anchor="${anchor}" fill="${rang}" font-weight="700"`); };
// yozuv kabel chizig'iga tushmasin: kabel gorizontal ketsa — ustida (yoki ostida), vertikal ketsa — yonida (o'ng chetda — chapda)
function aqlliYozuv(d, s, rang, size = 170, r = 260) {
  const [x, y] = tr(d.q)(d.p), b = d.ul ? d.ul.yol[1] : [x, y + 1], [bx, by] = d.ul ? tr(d.q)(b) : b;
  const W = d.q === 2 ? ICHKI.x : d.q === 3 ? 11550 : DX1 + 6250;
  const X0 = d.q === 1 ? DX1 : 0;
  if (d.yoz === 'ust' || d.yoz === 'ost' || (!d.yoz && Math.abs(bx - x) > Math.abs(by - y))) {
    const past = d.yoz === 'ost' || (!d.yoz && y < 900);
    const [ax, anc] = x - X0 < 1500 ? [x - 150, 'start'] : x > W - 1500 ? [x + 150, 'end'] : [x, 'middle'];
    return T(ax, past ? y + r + 150 : y - r, s, size, `text-anchor="${anc}" fill="${rang}" font-weight="700"`);
  }
  const chap = d.yoz ? d.yoz === 'chap' : x > W - 2500;
  return T(chap ? x - r : x + r, y + 60, s, size, `text-anchor="${chap ? 'end' : 'start'}" fill="${rang}" font-weight="700"`);
}
const rj45Svg = (d, rang = RG.net) => { const [x, y] = tr(d.q)(d.p); return `<rect x="${x - 160}" y="${y - 160}" width="320" height="320" fill="#fff" stroke="${rang}" stroke-width="34"/><rect x="${x - 105}" y="${y - 70}" width="80" height="140" fill="${rang}"/><rect x="${x + 25}" y="${y - 70}" width="80" height="140" fill="${rang}"/>`; };
const apSvg = (d, rang = RG.ap) => { const [x, y] = tr(d.q)(d.p); return `<circle cx="${x}" cy="${y}" r="230" fill="#fff" stroke="${rang}" stroke-width="34"/>` + [70, 135].map(r => `<path d="M${x - r},${y + 40 - r * 0.55} A${r},${r} 0 0 1 ${x + r},${y + 40 - r * 0.55}" fill="none" stroke="${rang}" stroke-width="26"/>`).join('') + `<circle cx="${x}" cy="${y + 55}" r="30" fill="${rang}"/>`; };
const datchikSvg = (d, rang = RG.yon) => { const [x, y] = tr(d.q)(d.p); return `<circle cx="${x}" cy="${y}" r="170" fill="#fff" stroke="${rang}" stroke-width="30"/><path d="M${x - 110},${y - 110} L${x + 110},${y + 110} M${x + 110},${y - 110} L${x - 110},${y + 110}" stroke="${rang}" stroke-width="22"/>`; };
const iprSvg = (d, rang = RG.yon) => { const [x, y] = tr(d.q)(d.p); return `<rect x="${x - 170}" y="${y - 170}" width="340" height="340" fill="${rang}"/><circle cx="${x}" cy="${y}" r="80" fill="#fff"/>`; };
const sirenaSvg = (d, rang = RG.yon) => { const [x, y] = tr(d.q)(d.p); return `<path d="M${x - 170},${y - 90} L${x - 40},${y - 90} L${x + 120},${y - 200} L${x + 120},${y + 200} L${x - 40},${y + 90} L${x - 170},${y + 90} Z" fill="#fff" stroke="${rang}" stroke-width="30"/><path d="M${x + 190},${y - 120} Q${x + 290},${y} ${x + 190},${y + 120}" fill="none" stroke="${rang}" stroke-width="26"/>`; };
const tabloSvg = (d, rang = '#1b7f3b') => { const [x, y] = tr(d.q)(d.p); return `<rect x="${x - 330}" y="${y - 120}" width="660" height="240" fill="${rang}"/>` + T(x, y + 52, 'CHIQISH', 140, 'text-anchor="middle" fill="#fff" font-weight="700" stroke="none"'); };
const avariyaSvg = (d, rang = '#1b7f3b') => { const [x, y] = tr(d.q)(d.p); return `<rect x="${x - 220}" y="${y - 110}" width="440" height="220" fill="#fff" stroke="${rang}" stroke-width="30"/><path d="M${x - 220},${y - 110} L${x + 220},${y + 110}" stroke="${rang}" stroke-width="22"/>` + T(x, y + 60, 'A', 140, `text-anchor="middle" fill="${rang}" font-weight="700"`); };
const rozSvg = (r, rang = RG.roz) => { const [x, y] = r.p; return `<rect x="${x - 130}" y="${y - 130}" width="260" height="260" fill="#fff" stroke="${rang}" stroke-width="28"/><path d="M${x - 85},${y - 85} L${x + 85},${y + 85} M${x + 85},${y - 85} L${x - 85},${y + 85}" stroke="${rang}" stroke-width="20"/>`; };
const doskaRSvg = (r, rang = RG.roz) => { const [x, y] = r.p; return `<path d="M${x},${y - 180} L${x + 170},${y + 130} L${x - 170},${y + 130} Z" fill="${rang}" stroke="${rang}" stroke-width="20"/>`; };
const vyklSvg = (v, rang = RG.yor) => { const [x, y] = v.p; return `<circle cx="${x}" cy="${y}" r="150" fill="#fff" stroke="${rang}" stroke-width="28"/><path d="M${x - 100},${y - 100} L${x + 100},${y + 100} M${x + 100},${y - 100} L${x - 100},${y + 100}" stroke="${rang}" stroke-width="20"/>`; };
const chiroqSvg = (l, rang = RG.yor) => { const [x, y] = l.p; return l.logo ? `<rect x="${x - 60}" y="${y - 350}" width="120" height="700" fill="${rang}"/>` : l.kanopi ? `<rect x="${x - l.a / 2}" y="${y - 20}" width="${l.a}" height="40" fill="${rang}"/>` : `<rect x="${x - l.a / 2}" y="${y - l.b / 2}" width="${l.a}" height="${l.b}" fill="#fff8e1" stroke="${rang}" stroke-width="${l.chiziq ? 30 : 26}"/>` + (l.chiziq ? '' : `<path d="M${x - l.a / 2},${y - l.b / 2} L${x + l.a / 2},${y + l.b / 2} M${x + l.a / 2},${y - l.b / 2} L${x - l.a / 2},${y + l.b / 2}" stroke="${rang}" stroke-width="10" stroke-opacity=".6"/>`); };
const shkafSvg = (r, nom, rang = '#111') => R(r, `fill="${rang}"`) + T((r.x1 + r.x2) / 2, (r.y1 + r.y2) / 2 + 55, nom, 150, 'text-anchor="middle" fill="#fff" font-weight="700" stroke="none"');

// ---------- varaq qoliplari ----------
const CSS2 = `.kichik { font-size: 5.8pt; color: #555; } .belgi i.k { width: 3.4mm; height: 3.4mm; } td.c, th.c { text-align: center; }
.yashil { border: .3mm solid #14896f; background: #effaf6; padding: 1mm 1.4mm; margin-top: 1mm; } table.ix td { padding: .25mm .7mm; } table.ix { font-size: 5.9pt; }
tr.j td { font-weight: 700; border-top: .3mm solid #1F3657; }`;
const shtamp = (nom, n, jami, qavat = '2-qavat') => `<div class="shtamp"><div class="nom">${LOYIHA.brend} · ${LOYIHA.filial}</div>
  <div class="ch"><span>Chizma</span><span>${nom}</span></div>
  <div>Ish chizmasi — ustalar uchun. Qurilmalar joyi — buyurtmachi belgilagan (18.10). ${LOYIHA.manzil} — ${qavat}</div>
  <div class="g4"><span><small>Masshtab</small>${qavat === '2-qavat' ? '1:100' : '~1:90'}</span><span><small>Sana</small>${SANA}</span><span><small>Versiya</small>${LOYIHA.versiya}</span><span><small>Varaq</small>${n} / ${jami}</span></div>
  <div>Bajardi: ____________ &nbsp;&nbsp; Tekshirdi: ____________</div></div>`;
const varaq = (yorliq, svg, ong) => `<section class="varaq"><div class="ram"><div class="yorliq">${yorliq}</div>${svg}</div><div class="ong">${ong}</div></section>`;
const sahifa = (nom, varaqlar) => `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — ${nom}</title><style>${ISH_CSS}${CSS2}</style></head><body>${varaqlar.join('')}</body></html>`;
const QNOM = { 1: '1-qavat', 2: '2-qavat', 3: '3-qavat' };
const jamiM = l => Math.round(l.reduce((t, d) => t + d.L, 0));

// ===================== 1. KAMERA =====================
function kameraHtml(h) {
  const k2 = h.kam.filter(d => d.q === 2), k13 = h.kam.filter(d => d.q !== 2);
  const svg2 = (() => {
    const q = [asos2(h), lotoklar(h.GL, [2], h.nKam)];
    k2.forEach(d => q.push(tarmoqChiz(d, RG.kam, 26)));
    q.push(soniYozuv(h.GL, [2], h.nKam, RG.kam), stoyakSvg([2], h.GL));
    q.push(shkafSvg(SHKAF.r, 'NVR'), T(SHKAF.r.x1 + 700, SHKAF.r.y1 - 250, 'NVR / tarmoq shkafi 18U', 150, `fill="#111" font-weight="700"`));
    k2.forEach(d => { q.push(kameraSvg(d)); q.push(aqlliYozuv(d, `${d.kod} · ${Math.round(d.L)} m`, RG.kam)); });
    return svgOch(VB, q);
  })();
  const svg13 = (() => {
    const q = [asos13(), lotoklar(h.GL, [1, 3], h.nKam)];
    k13.forEach(d => q.push(tarmoqChiz(d, RG.kam, 26)));
    q.push(stoyakSvg([1, 3], h.GL));
    k13.forEach(d => { q.push(kameraSvg(d)); q.push(aqlliYozuv(d, `${d.kod} · ${Math.round(d.L)} m`, RG.kam)); });
    q.push(sxemaKamera(h));
    return svgOch(VB13, q);
  })();
  const jadval = l => `<table class="ix"><tr><th>Kod</th><th>Joy</th><th>Xona</th><th class="r">Cat6, m</th></tr>${l.map(d => `<tr><td><b>${d.kod}</b></td><td>${d.izoh}</td><td>${joyNom(d)}</td><td class="r">${Math.round(d.L)}</td></tr>`).join('')}</table>`;
  const belgi = `<div class="belgi"><div><i class="k" style="border-radius:50%;background:${RG.kam}"></i>IP kamera (PoE), shiftda yoki devor tepasida; ko'rish yo'nalishi</div>
    <div><i style="border-top:.6mm solid ${RG.kam};height:0"></i>Cat6 kabeli (har kameraga alohida)</div>
    <div><i style="background:${RG.lotok};opacity:.5"></i>past tokli lotok (shift ostida); raqam — kabellar soni</div>
    <div><i class="k" style="background:#111"></i>NVR / tarmoq shkafi (XZ4)</div>
    <div><i class="k" style="border-radius:50%;border:.4mm solid #26313d"></i>S1, S2 — qavatlararo stoyak</div></div>`;
  const J = jamiM(h.kam);
  const v1 = varaq("1-varaq · Kamera kuzatuvi — 2-qavat, 1:100", svg2, `<h2>KAMERA KUZATUVI — 24 ta IP kamera (PoE)</h2>${belgi}
    <h3>2-qavat — ${k2.length} ta</h3>${jadval(k2)}
    <p class="kichik">Uzunlik: kameradan lotokkacha va lotok bo'ylab shkafgacha × 1.1 (burilish va aylanib o'tish) + kamerada 0.3 m tushish, shkafda 2.3 m + zaxira 2 m. Lotokdagi raqam — shu bo'lakdagi kabellar soni (lotok eni tanlash uchun).</p>
    <ul><li>Har kamera o'z Cat6 (U/UTP, 4×2×0.5, LSZH) kabeli bilan shkafdagi PoE switchga; kabel uzunligi ≤ 90 m.</li>
      <li>Koridor va xonalarda kabel shift ostidagi lotokda / shift bo'shlig'ida, devorda — gofra quvurda (Ø20); GKL va mavjud devordan teshik orqali.</li>
      <li>Kamera balandligi ~2.8–3.2 m; ko'rish burchagi joyida sozlanadi (sxemadagi sektor — taxminiy).</li></ul>
    ${shtamp('Kamera kuzatuvi — 2-qavat', 1, 2)}`);
  const v2 = varaq("2-varaq · Kamera kuzatuvi — 3-qavat va 1-qavat; tuzilma sxemasi", svg13, `<h2>KAMERA — 3- VA 1-QAVAT, SHKAF</h2>${belgi}
    <h3>3-qavat va 1-qavat — ${k13.length} ta</h3>${jadval(k13)}
    <h3>Shkaf (XZ4, g'arbiy burchak, pol shkafi 600 × 600, 18U)</h3>
    <table class="ix"><tr><th>Jihoz</th><th class="r">Soni</th></tr>
      <tr><td>NVR 32 kanal, 4 HDD (jami ~16 TB — ~30 kun, 4 MP H.265+)</td><td class="r">1</td></tr>
      <tr><td>PoE switch 24 port (kameralar uchun, ≥ 370 W)</td><td class="r">1</td></tr>
      <tr><td>Patch-panel 24 port Cat6 (kameralar)</td><td class="r">1</td></tr>
      <tr><td>UPS 1.5 kVA (shkaf uchun umumiy), PDU, organayzerlar</td><td class="r">1</td></tr></table>
    <h3>Kabel</h3><table class="ix"><tr><th>Nomi</th><th class="r">m</th></tr>
      <tr><td>Cat6 U/UTP LSZH — 24 ta kamera (+ ~10% zaxira — Excel)</td><td class="r"><b>${J}</b></td></tr>
      <tr><td>shundan 2-qavat / 3-qavat / 1-qavat</td><td class="r">${jamiM(k2)} / ${jamiM(h.kam.filter(d => d.q === 3))} / ${jamiM(h.kam.filter(d => d.q === 1))}</td></tr></table>
    <ul><li>3-qavat kabellari ZN1 zinasi bo'ylab (S2), 1-qavatniki — asosiy zina (ZN2) bo'ylab (S1) gofra quvurda 2-qavat lotokiga.</li>
      <li>Shkafga provayder kirishi (optika) — tashqi devordan, shkaf yonida; shkafga alohida rozetka (R8 guruhi, XZ4 g'arbiy devor).</li></ul>
    ${shtamp('Kamera kuzatuvi — 3- va 1-qavat', 2, 2, '3- va 1-qavat')}`);
  return sahifa('kamera kuzatuvi', [v1, v2]);
}
// tuzilma sxemasi (2-varaqning pastida): provayder → router → switch → kameralar
function sxemaBlok(x, y, w, h2, s, rang = '#26313d', fon = '#fff') {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h2}" rx="80" fill="${fon}" stroke="${rang}" stroke-width="30"/>` + s.split('\n').map((t, i, a) => T(x + w / 2, y + h2 / 2 + 70 + (i - (a.length - 1) / 2) * 260, t, 200, `text-anchor="middle" fill="${rang}" font-weight="${i ? 400 : 700}"`)).join('');
}
const ulanish = (a, b, rang = '#26313d') => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${rang}" stroke-width="30"/>`;
function sxemaKamera(h) {
  const y0 = 14300, q = [T(-1000, y0 - 400, 'TUZILMA SXEMASI', 300, 'font-weight="700" fill="#1F3657"')];
  q.push(sxemaBlok(-1000, y0, 3400, 1100, 'Provayder\noptika'), sxemaBlok(3200, y0, 3400, 1100, 'Router\n(shkafda)'), sxemaBlok(7400, y0, 4200, 1100, 'PoE switch 24\nCat6, ≤ 90 m'),
    sxemaBlok(7400, y0 + 2300, 4200, 1100, 'NVR 32 kanal\n4 HDD, monitor (CEO)'));
  q.push(ulanish([2400, y0 + 550], [3200, y0 + 550]), ulanish([6600, y0 + 550], [7400, y0 + 550]), ulanish([9500, y0 + 1100], [9500, y0 + 2300]));
  const kq = [['2-qavat', 20], ['3-qavat', 3], ['1-qavat', 1]];
  kq.forEach(([n, s], i) => { const x = 13000 + i * 3500; q.push(sxemaBlok(x, y0 + 1200, 3100, 1100, `${n}\n${s} kamera`, RG.kam), ulanish([11600, y0 + 550], [x + 1550, y0 + 550], RG.kam), ulanish([x + 1550, y0 + 550], [x + 1550, y0 + 1200], RG.kam)); });
  return q.join('');
}

// ===================== 2. INTERNET =====================
function internetHtml(h) {
  const r2 = h.rj.filter(d => d.q === 2), a2 = h.ap.filter(d => d.q === 2), r13 = h.rj.filter(d => d.q !== 2), a13 = h.ap.filter(d => d.q !== 2);
  const qurBelgi = (q, l, f, rang) => l.forEach(d => { q.push(f(d)); q.push(aqlliYozuv(d, `${d.kod} · ${f === rj45Svg ? '2 × ' : ''}${Math.round(d.L)} m`, rang, 170, 300)); });
  const svg2 = (() => {
    const q = [asos2(h), lotoklar(h.GL, [2], h.nNet)];
    r2.forEach(d => q.push(tarmoqChiz(d, RG.net, 34))); a2.forEach(d => q.push(tarmoqChiz(d, RG.ap, 26, '120 60')));
    q.push(soniYozuv(h.GL, [2], h.nNet, RG.net), stoyakSvg([2], h.GL), shkafSvg(SHKAF.r, 'SW'), T(SHKAF.r.x1 + 700, SHKAF.r.y1 - 250, 'tarmoq shkafi: router, switch', 150, 'fill="#111" font-weight="700"'));
    qurBelgi(q, r2, rj45Svg, RG.net); qurBelgi(q, a2, apSvg, RG.ap);
    return svgOch(VB, q);
  })();
  const svg13 = (() => {
    const q = [asos13(), lotoklar(h.GL, [1, 3], h.nNet)];
    r13.forEach(d => q.push(tarmoqChiz(d, RG.net, 34))); a13.forEach(d => q.push(tarmoqChiz(d, RG.ap, 26, '120 60')));
    q.push(stoyakSvg([1, 3], h.GL)); qurBelgi(q, r13, rj45Svg, RG.net); qurBelgi(q, a13, apSvg, RG.ap);
    q.push(sxemaInternet(h));
    return svgOch(VB13, q);
  })();
  const jadval = (rl, al) => `<table class="ix"><tr><th>Kod</th><th>Joy</th><th>Xona</th><th class="r">Cat6, m</th></tr>
    ${rl.map(d => `<tr><td><b>${d.kod}</b></td><td>RJ-45 × 2 — ${d.izoh}</td><td>${joyNom(d)}</td><td class="r">2 × ${Math.round(d.L)}</td></tr>`).join('')}
    ${al.map(d => `<tr><td><b>${d.kod}</b></td><td>Wi-Fi nuqtasi (PoE) — ${d.izoh}</td><td>${joyNom(d)}</td><td class="r">${Math.round(d.L)}</td></tr>`).join('')}</table>`;
  const belgi = `<div class="belgi"><div><i class="k" style="border:.5mm solid ${RG.net}"></i>RJ-45 rozetka, 2 portli, poldan 30 sm</div>
    <div><i class="k" style="border-radius:50%;border:.5mm solid ${RG.ap}"></i>Wi-Fi nuqtasi (shiftda, PoE)</div>
    <div><i style="border-top:.8mm solid ${RG.net};height:0"></i>2 × Cat6 (har rozetkaga)</div>
    <div><i style="border-top:.6mm dashed ${RG.ap};height:0"></i>Cat6 Wi-Fi nuqtasiga</div>
    <div><i style="background:${RG.lotok};opacity:.5"></i>past tokli lotok; raqam — kabellar soni</div>
    <div><i class="k" style="background:#111"></i>tarmoq shkafi (XZ4)</div></div>`;
  const kab = Math.round(h.rj.reduce((t, d) => t + 2 * d.L, 0) + h.ap.reduce((t, d) => t + d.L, 0));
  const v1 = varaq('1-varaq · Internet (RJ-45) va Wi-Fi — 2-qavat, 1:100', svg2, `<h2>INTERNET — 16 ta RJ-45 (2 portli), 6 ta Wi-Fi nuqtasi</h2>${belgi}
    <h3>2-qavat — ${r2.length} ta rozetka, ${a2.length} ta Wi-Fi</h3>${jadval(r2, a2)}
    <p class="kichik">Uzunlik: rozetkadan lotokkacha, lotok bo'ylab shkafgacha × 1.1 + rozetkaga 3.0 m tushish (devorda, gofra quvurda), shkafda 2.3 m + zaxira 2 m. Rozetkaga 2 ta kabel (2 port). Lotokdagi raqam — kabellar soni.</p>
    <ul><li>Kabel — Cat6 U/UTP LSZH; har port alohida kabel bilan shkafdagi patch-panelga (≤ 90 m), uchlari belgilanadi (R1-1, R1-2 …).</li>
      <li>Wi-Fi nuqtalari shiftda, PoE orqali; koridorda — lotok yonida, koworkingda — markazda.</li></ul>
    ${shtamp('Internet va Wi-Fi — 2-qavat', 1, 2)}`);
  const v2 = varaq('2-varaq · Internet va Wi-Fi — 3-qavat va 1-qavat; tuzilma sxemasi', svg13, `<h2>INTERNET — 3- VA 1-QAVAT, SHKAF</h2>${belgi}
    <h3>3-qavat va 1-qavat</h3>${jadval(r13, a13)}
    <h3>Shkafdagi jihozlar (kamera bilan umumiy shkaf, XZ4)</h3>
    <table class="ix"><tr><th>Jihoz</th><th class="r">Soni</th></tr>
      <tr><td>Router (2 WAN, ≥ 1 Gbit/s)</td><td class="r">1</td></tr>
      <tr><td>Switch 48 port (8 tasi PoE+ — Wi-Fi uchun), gigabit</td><td class="r">1</td></tr>
      <tr><td>Patch-panel 24 port Cat6 (internet: ${h.rj.length * 2} + ${h.ap.length} port)</td><td class="r">2</td></tr>
      <tr><td>Wi-Fi nuqtasi (shift, PoE, Wi-Fi 6, kontrollersiz/bulutli)</td><td class="r">${h.ap.length}</td></tr>
      <tr><td>RJ-45 rozetka, 2 portli, Cat6 (ramka bilan)</td><td class="r">${h.rj.length}</td></tr></table>
    <h3>Kabel</h3><table class="ix"><tr><th>Nomi</th><th class="r">m</th></tr>
      <tr><td>Cat6 U/UTP LSZH — ${h.rj.length * 2} port + ${h.ap.length} Wi-Fi</td><td class="r"><b>${kab}</b></td></tr></table>
    ${shtamp('Internet va Wi-Fi — 3- va 1-qavat', 2, 2, '3- va 1-qavat')}`);
  return sahifa('internet va Wi-Fi', [v1, v2]);
}
function sxemaInternet(h) {
  const y0 = 14300, q = [T(-1000, y0 - 400, 'TUZILMA SXEMASI', 300, 'font-weight="700" fill="#1F3657"')];
  q.push(sxemaBlok(-1000, y0, 3400, 1100, 'Provayder\noptika'), sxemaBlok(3200, y0, 3400, 1100, 'Router'), sxemaBlok(7400, y0, 4200, 1100, 'Switch 48\n(8 PoE+)'));
  q.push(ulanish([2400, y0 + 550], [3200, y0 + 550]), ulanish([6600, y0 + 550], [7400, y0 + 550]));
  const kq = [['2-qavat', `${h.rj.filter(d => d.q === 2).length} RJ-45, ${h.ap.filter(d => d.q === 2).length} Wi-Fi`], ['3-qavat', '1 RJ-45, 1 Wi-Fi'], ['1-qavat', '1 RJ-45']];
  kq.forEach(([n, s], i) => { const x = 13000 + i * 3500; q.push(sxemaBlok(x, y0 + 1200, 3100, 1100, `${n}\n${s}`, RG.net), ulanish([11600, y0 + 550], [x + 1550, y0 + 550], RG.net), ulanish([x + 1550, y0 + 550], [x + 1550, y0 + 1200], RG.net)); });
  return q.join('');
}

// ===================== 3. YONG'IN SIGNALIZATSIYASI =====================
const SH_RANG = { Sh1: '#c62828', Sh2: '#ad1457', Sh3: '#e65100', Sh4: '#c62828', Sh5: '#c62828' };
function yonginHtml(h) {
  const qism = (qavatlar) => {
    const q = [];
    h.shl.forEach(s => {
      const r = SH_RANG[s.sh];
      s.B.qirralar.filter(o => qavatlar.includes(o.e.q)).forEach(o => {
        const f = tr(o.e.q);
        if (o.toliq) q.push(chiz([f(o.e.u.p), f(o.e.v.p)], r, 30, 'stroke-opacity=".55"'));
        else {
          const dir = (a, b, L) => [a[0] + Math.sign(b[0] - a[0]) * L, a[1] + Math.sign(b[1] - a[1]) * L];
          if (o.u) q.push(chiz([f(o.e.u.p), f(dir(o.e.u.p, o.e.v.p, Math.min(o.u, o.e.L)))], r, 30, 'stroke-opacity=".55"'));
          if (o.v) q.push(chiz([f(o.e.v.p), f(dir(o.e.v.p, o.e.u.p, Math.min(o.v, o.e.L)))], r, 30, 'stroke-opacity=".55"'));
        }
      });
      s.qurilmalar.filter(d => qavatlar.includes(d.q)).forEach(d => q.push(tarmoqChiz(d, r, 22)));
    });
    [[h.ipr, '#7b1fa2'], [h.sir, '#5d4037'], [h.tab, '#1b7f3b']].forEach(([s, r]) => s.qurilmalar.filter(d => qavatlar.includes(d.q)).forEach(d => q.push(tarmoqChiz(d, r, 18, '90 50'))));
    q.push(stoyakSvg(qavatlar, h.GL));
    h.shl.forEach(s => s.qurilmalar.filter(d => qavatlar.includes(d.q)).forEach(d => { q.push(datchikSvg(d, SH_RANG[s.sh])); q.push(yozuv(d, d.kod, SH_RANG[s.sh], 210, -170, 'start', 150)); }));
    h.ipr.qurilmalar.filter(d => qavatlar.includes(d.q)).forEach(d => { q.push(iprSvg(d, '#7b1fa2')); q.push(yozuv(d, d.kod, '#7b1fa2', 230, -150, 'start', 160)); });
    h.sir.qurilmalar.filter(d => qavatlar.includes(d.q)).forEach(d => { q.push(sirenaSvg(d, '#5d4037')); q.push(yozuv(d, d.kod, '#5d4037', 0, 400, 'middle', 160)); });
    h.tab.qurilmalar.filter(d => qavatlar.includes(d.q)).forEach(d => { q.push(tabloSvg(d)); q.push(yozuv(d, d.kod, '#1b7f3b', 0, -190, 'middle', 150)); });
    AVARIYA.filter(d => qavatlar.includes(d.q)).forEach(d => { q.push(avariyaSvg(d)); q.push(yozuv(d, d.kod, '#1b7f3b', 0, 330, 'middle', 140)); });
    if (qavatlar.includes(1)) { const r = trR(1, PULT.r); q.push(R(r, 'fill="#c62828"'), T(r.x1 - 120, r.y1 + 250, 'PPK', 200, 'text-anchor="end" font-weight="700" fill="#c62828"')); }
    return q.join('');
  };
  const svg2 = svgOch(VB, [asos2(h), lotoklar(h.GL, [2]), qism([2])]);
  const svg13 = svgOch(VB13, [asos13(), lotoklar(h.GL, [1, 3]), qism([1, 3]), sxemaYongin(h)]);
  const belgi = `<div class="belgi"><div><i class="k" style="border-radius:50%;border:.5mm solid #c62828;background:#fff"></i>tutun datchigi (adressiz), raqam — shleyf.tartib</div>
    <div><i class="k" style="background:#7b1fa2"></i>qo'lda ishga tushirish tugmasi (IPR), 1.5 m</div>
    <div><i class="k" style="border:.5mm solid #5d4037"></i>ovozli-yorug'lik sirenasi, 2.3 m</div>
    <div><i style="background:#1b7f3b"></i>«CHIQISH» tablosi / yo'nalish ko'rsatkichi</div>
    <div><i style="border:.5mm solid #1b7f3b"></i>avariya chirog'i (akkumulyatorli, 3 soat)</div>
    <div><i style="border-top:.7mm solid #c62828;height:0"></i>shleyf kabeli (lotokda — bir marta)</div>
    <div><i style="border-top:.5mm dashed #7b1fa2;height:0"></i>IPR / sirena / tablo liniyalari</div>
    <div><i class="k" style="border-radius:50%;border:.4mm solid #26313d"></i>S1, S2 — stoyak</div></div>`;
  const shJ = l => `<table class="ix"><tr><th>Shleyf</th><th>Xonalar</th><th class="r">Datchik</th><th class="r">Kabel, m</th></tr>${l.map(s => `<tr><td><b>${s.sh}</b></td><td>${s.nom}</td><td class="r">${s.qurilmalar.length}</td><td class="r">${Math.round(s.L)}</td></tr>`).join('')}</table>`;
  const sh2 = h.shl.filter(s => SHLEYF_Q[s.sh] === 2), sh13 = h.shl.filter(s => SHLEYF_Q[s.sh] !== 2);
  const nDat = h.shl.reduce((t, s) => t + s.qurilmalar.length, 0);
  const kab1 = Math.round(h.shl.reduce((t, s) => t + s.L, 0) + h.ipr.L), kab2 = Math.round(h.sir.L + h.tab.L);
  const v1 = varaq("1-varaq · Yong'in signalizatsiyasi va ogohlantirish — 2-qavat, 1:100", svg2, `<h2>YONG'IN SIGNALIZATSIYASI — ADRESSIZ, ${nDat} DATCHIK</h2>${belgi}
    <h3>2-qavat shleyflari (pult — 1-qavat resepshnda, S1 orqali)</h3>${shJ(sh2)}
    <h3>2-qavat: qo'shimcha (me'yor bo'yicha)</h3>
    <table class="ix"><tr><th>Qurilma</th><th>Joyi</th><th class="r">Soni</th></tr>
      <tr><td>IPR (qo'lda)</td><td>${h.ipr.qurilmalar.filter(d => d.q === 2).map(d => `${d.kod} — ${d.izoh}`).join('; ')}</td><td class="r">${h.ipr.qurilmalar.filter(d => d.q === 2).length}</td></tr>
      <tr><td>Sirena</td><td>${h.sir.qurilmalar.filter(d => d.q === 2).map(d => `${d.kod} — ${d.izoh}`).join('; ')}</td><td class="r">${h.sir.qurilmalar.filter(d => d.q === 2).length}</td></tr>
      <tr><td>«CHIQISH» / ko'rsatkich</td><td>${h.tab.qurilmalar.filter(d => d.q === 2).map(d => `${d.kod} — ${d.izoh}`).join('; ')}</td><td class="r">${h.tab.qurilmalar.filter(d => d.q === 2).length}</td></tr>
      <tr><td>Avariya chirog'i</td><td>koridorlar, koworking, kirish zali, 6-xona, zinalar</td><td class="r">${AVARIYA.filter(d => d.q === 2).length}</td></tr></table>
    <ul><li>Datchiklar shiftda, devordan ≥ 0.5 m, diffuzor va panjaradan ≥ 1 m (joyida suriladi); kladovkalarda (KL1, KL2) ham — konditsioner bloklari ustida.</li>
      <li>Shleyf — 2 simli, oxirida rezistor; bir shleyfda ≤ 10 xona. Kabel olovga chidamli, kuch kabellaridan alohida (gofra quvurda, lotokda ≥ 0.5 m oraliq).</li></ul>
    ${shtamp("Yong'in signalizatsiyasi — 2-qavat", 1, 2)}`);
  const v2 = varaq("2-varaq · Yong'in signalizatsiyasi — 3-qavat va 1-qavat; tuzilma sxemasi", svg13, `<h2>YONG'IN — 3- VA 1-QAVAT, PULT</h2>${belgi}
    <h3>3- va 1-qavat shleyflari</h3>${shJ(sh13)}
    <h3>Jami (1–3-qavat)</h3>
    <table class="ix"><tr><th>Qurilma</th><th class="r">Soni</th></tr>
      <tr><td>Pult PPK (adressiz, ≥ 8 shleyf, akkumulyatorli; 1-qavat resepshn, sharqiy devor)</td><td class="r">1</td></tr>
      <tr><td>Tutun datchigi (buyurtmachi belgilagan 50 + kladovkalar 2 + 3-qavat tamburi 1)</td><td class="r">${nDat}</td></tr>
      <tr><td>IPR — qo'lda ishga tushirish tugmasi</td><td class="r">${h.ipr.qurilmalar.length}</td></tr>
      <tr><td>Ovozli-yorug'lik sirenasi</td><td class="r">${h.sir.qurilmalar.length}</td></tr>
      <tr><td>«CHIQISH» tablosi va yo'nalish ko'rsatkichi</td><td class="r">${h.tab.qurilmalar.length}</td></tr>
      <tr><td>Avariya chirog'i (220 V, akkumulyatorli; yaqin yoritish guruhidan)</td><td class="r">${AVARIYA.length}</td></tr>
      <tr><td>Kabel olovga chidamli 1×2×0.75 (shleyflar, IPR)</td><td class="r"><b>${kab1} m</b></td></tr>
      <tr><td>Kabel olovga chidamli 1×2×1.0 (sirena, tablo)</td><td class="r"><b>${kab2} m</b></td></tr></table>
    <ul><li>Uzunlik: lotokdagi qismi bir marta, datchikka tarmoq ikki marta (kirish va chiqish) × 1.1, tushishlar va pultda 1.5 m.</li>
      <li>3-qavat shleyfi ZN1 (S2) va ZN2 (S1) orqali pultga; 3-qavat tamburiga (yangi devor ortida) 1 datchik qo'shildi.</li>
      <li>Narx — buyurtmachi summasi (Excel, «Yong'in xavfsizligi»); chizmadagi miqdorlar pudratchi smetasini tekshirish uchun.</li></ul>
    ${shtamp("Yong'in signalizatsiyasi — 3- va 1-qavat", 2, 2, '3- va 1-qavat')}`);
  return sahifa("yong'in signalizatsiyasi", [v1, v2]);
}
function sxemaYongin(h) {
  const y0 = 14300, q = [T(-1000, y0 - 400, 'TUZILMA SXEMASI', 300, 'font-weight="700" fill="#1F3657"')];
  q.push(sxemaBlok(-1000, y0, 4200, 1600, 'PPK (1-qavat)\nresepshn\nakkumulyator', '#c62828'));
  const l = [...h.shl.map(s => [s.sh, `${s.qurilmalar.length} datchik`]), ['IPR', `${h.ipr.qurilmalar.length} tugma`], ['Sirena', `${h.sir.qurilmalar.length} ta`], ['Tablo', `${h.tab.qurilmalar.length} ta`]];
  const yb = y0 + 1500;                 // umumiy chiziq qatorlar orasida
  q.push(ulanish([3200, yb], [4200 + 3 * 4700 + 2100, yb], '#c62828'));
  l.forEach(([n, s], i) => {
    const x = 4200 + (i % 4) * 4700, qator = Math.floor(i / 4), y = y0 + qator * 1700;
    q.push(sxemaBlok(x, y, 4200, 1300, `${n}\n${s}`, '#c62828'), ulanish([x + 2100, yb], [x + 2100, qator ? y : y + 1300], '#c62828'));
  });
  return q.join('');
}

// ===================== 4. ELEKTR =====================
function elektrHtml(h) {
  const gr = h.guruh;
  const guruhChiz = (g, rang) => {
    const q = [];
    g.B.qirralar.filter(o => o.e.q === 2).forEach(o => {
      const dir = (a, b, L) => [a[0] + Math.sign(b[0] - a[0]) * L, a[1] + Math.sign(b[1] - a[1]) * L];
      if (o.toliq) q.push(chiz([o.e.u.p, o.e.v.p], rang, 26, 'stroke-opacity=".35"'));
      else { if (o.u) q.push(chiz([o.e.u.p, dir(o.e.u.p, o.e.v.p, o.u)], rang, 26, 'stroke-opacity=".35"')); if (o.v) q.push(chiz([o.e.v.p, dir(o.e.v.p, o.e.u.p, o.v)], rang, 26, 'stroke-opacity=".35"')); }
    });
    g.yol.forEach(y => q.push(chiz(y.ul.yol, rang, 24)));
    g.qism.forEach(z => { let p = (z.bosh || z.kirish).p; z.tar.forEach(n => { q.push(chiz([p, [n.p[0], p[1]], n.p], rang, 16, 'stroke-dasharray="70 45"')); p = n.p; }); });
    return q.join('');
  };
  const yGr = (g, x, y, rang) => T(x, y, g.kod, 210, `text-anchor="middle" fill="${rang}" font-weight="700"`);
  const XG = { SR1: [9100, 4300], SR2: [15050, 4300], SR3: [21000, 4300], SR4: [21300, 13000], SR5: [21000, 21400], SR6: [15050, 21400], SR7: [9050, 21400],
    XZ4: [9100, 10950], XZ3: [15050, 10950], XZ1: [9100, 13500], XZ2: [15050, 13500], KW: [2975, 13200], X12: [2975, 24100], K1: [12500, 8350], K2: [12500, 15650] };
  const shitSvg = () => R(SHIT.r, 'fill="#fff" stroke="#111" stroke-width="30"') + `<path d="M${SHIT.r.x1},${SHIT.r.y2} L${SHIT.r.x2},${SHIT.r.y1} L${SHIT.r.x2},${SHIT.r.y2} Z" fill="#111"/>` +
    T(SHIT.r.x1 - 120, SHIT.r.y1 + 120, 'ShR (mavjud)', 190, 'text-anchor="end" font-weight="700" fill="#111"');
  // 1-varaq: rozetkalar va kuch liniyalari
  const svgR = (() => {
    const q = [asos2(h), lotoklar(h.GE, [2], null, '#e0a080')];
    gr.filter(g => g.tur === 'r' && g.kod !== 'R13').forEach(g => q.push(guruhChiz(g, RG.roz)));
    h.kuch.forEach(k => q.push(chiz(k.ul.yol, RG.kuch, 40), `<circle cx="${k.p[0]}" cy="${k.p[1]}" r="200" fill="${RG.kuch}"/>`, T(k.p[0] + (k.kod === 'VV1' ? 260 : -260), k.p[1] + (k.kod === 'VV1' ? 380 : -260), `${k.kod} · ${k.kabel.replace('VVGng-LS ', '')} · ${Math.round(k.L)} m`, 170, `text-anchor="${k.kod === 'VV1' ? 'start' : 'end'}" fill="${RG.kuch}" font-weight="700"`)));
    [...ROZETKA, ...DOSKA_R].forEach(r => q.push(r.tur === 'd' ? doskaRSvg(r) : rozSvg(r)));
    gr.filter(g => g.tur === 'r' && g.kod !== 'R13').forEach(g => g.xonalar.forEach(k => XG[k] && q.push(yGr(g, ...XG[k], RG.roz))));
    q.push(stoyakSvg([2], h.GE), shitSvg());
    return svgOch(VB, q);
  })();
  // 2-varaq: yoritish
  const svgY = (() => {
    const q = [asos2(h), lotoklar(h.GE, [2], null, '#e0c080')];
    gr.filter(g => g.tur === 'y').forEach(g => q.push(guruhChiz(g, RG.yor)));
    h.LED.forEach(l => q.push(chiroqSvg(l)));
    VYKL.forEach(v => q.push(vyklSvg(v)));
    const XGY = { ...XG, XZ4: [7000, 11900], XZ3: [12900, 11900], XZ1: [7000, 12850], XZ2: [12900, 12850], K1: [6300, 8150], K2: [6300, 16350] };
    gr.filter(g => g.tur === 'y').forEach(g => g.xonalar.forEach(k => XGY[k] && q.push(yGr(g, ...XGY[k], RG.yor))));
    q.push(T(5300, 20600, 'Y10', 210, `text-anchor="middle" fill="${RG.yor}" font-weight="700"`), T(4500, 3400, 'Y10', 170, `text-anchor="middle" fill="${RG.yor}" font-weight="700"`));
    q.push(shitSvg());
    return svgOch(VB, q);
  })();
  // 3-varaq: 1-qavat (resepshn rozetkalari), 3-qavat — mavjud; guruhlar jadvali
  const svg13 = (() => {
    const q = [asos13(), lotoklar(h.GE, [1], null, '#e0a080')];
    const g = gr.find(g => g.kod === 'R13');
    g.yol.forEach(y => q.push(chiz(y.ul.yol.map(tr(1)), RG.roz, 24)));
    ROZ1.forEach(r => q.push(rozSvg({ p: tr(1)(r.p) })));
    q.push(T(DX1 + 6150 - 300, 4750, `R13 · ${Math.round(g.L)} m`, 190, `text-anchor="end" fill="${RG.roz}" font-weight="700"`), stoyakSvg([1], h.GE));
    q.push(sxemaShit(h));
    q.push(`<rect x="0" y="0" width="11850" height="12300" fill="#fff" fill-opacity=".55"/>`, T(5900, 6300, '3-qavat elektri — mavjud (buyurtmachi):', 330, 'text-anchor="middle" font-weight="700" fill="#1F3657"'),
      T(5900, 6750, 'konditsioner va vitechka uchun tayyor, chizilmaydi', 280, 'text-anchor="middle" fill="#1F3657"'));
    return svgOch(VB13, q);
  })();
  const rG = gr.filter(g => g.tur === 'r'), yG = gr.filter(g => g.tur === 'y');
  const P = [...gr.map(g => g.P), ...h.kuch.map(k => k.P)].reduce((a, b) => a + b, 0);
  const sum = (l, k) => Math.round(l.filter(g => g.kabel === k).reduce((t, g) => t + g.L, 0));
  const belgiR = `<div class="belgi"><div><i class="k" style="border:.5mm solid ${RG.roz}"></i>rozetka (poldan 30 sm), 2P+E</div>
    <div><i class="k" style="background:${RG.roz};clip-path:polygon(50% 0,100% 100%,0 100%)"></i>interaktiv doska rozetkasi, 1.6 m</div>
    <div><i style="border-top:.6mm solid ${RG.roz};height:0"></i>guruh kabeli 3×2.5 (shitdan xonagacha)</div>
    <div><i style="border-top:.5mm dashed ${RG.roz};height:0"></i>xona ichida — devorda gofra quvurda</div>
    <div><i style="border-top:.9mm solid ${RG.kuch};height:0"></i>kuch liniyasi (KK1, KK2, VV1)</div>
    <div><i style="background:#e0a080;opacity:.5"></i>kuch lotogi (shift ostida)</div></div>`;
  const v1 = varaq('1-varaq · Elektr — rozetkalar va kuch liniyalari, 2-qavat, 1:100', svgR, `<h2>ELEKTR — ROZETKALAR, KUCH LINIYALARI (2-qavat)</h2>${belgiR}
    <h3>Rozetka guruhlari — har sinfga alohida avtomat</h3>
    <table class="ix"><tr><th>Guruh</th><th>Xona</th><th class="r">Roz.</th><th class="r">1.6 m</th><th class="r">kW</th><th class="r">3×2.5, m</th></tr>
      ${rG.map(g => `<tr><td><b>${g.kod}</b></td><td>${g.nom}</td><td class="r">${g.soni}</td><td class="r">${g.doska || ''}</td><td class="r">${g.P.toFixed(1)}</td><td class="r">${Math.round(g.L)}</td></tr>`).join('')}
      <tr class="j"><td>Jami</td><td></td><td class="r">${rG.reduce((t, g) => t + g.soni, 0)}</td><td class="r">${rG.reduce((t, g) => t + g.doska, 0)}</td><td class="r">${rG.reduce((t, g) => t + g.P, 0).toFixed(1)}</td><td class="r">${sum(rG, 'VVGng-LS 3×2.5')}</td></tr></table>
    <h3>Kuch liniyalari</h3><table class="ix"><tr><th>Liniya</th><th>Kabel</th><th>Avtomat</th><th class="r">kW</th><th class="r">m</th></tr>
      ${h.kuch.map(k => `<tr><td><b>${k.kod}</b> — ${k.nom.split(' — ')[1]}</td><td>${k.kabel}</td><td>${k.avt}</td><td class="r">${k.P}</td><td class="r">${Math.round(k.L)}</td></tr>`).join('')}</table>
    <ul><li>Kabel shitdan xonagacha — shift ostidagi kuch lotogida (past tokli lotokdan alohida), xona ichida — devorda gofra quvurda (Ø20), rozetkadan rozetkaga.</li>
      <li>KK1, KK2 — 380 V, tashqi blokka (tomda) kladovkadan stoyak; ichki blok tashqi blokdan (3×1.5, konditsioner bilan birga keladi).</li>
      <li>Rozetkalar joyi — buyurtmachi belgilagan; 2-xonadagi qizil «+» — xato (buyurtmachi), qo'yilmaydi.</li></ul>
    ${shtamp('Elektr — rozetkalar va kuch liniyalari', 1, 3)}`);
  const belgiY = `<div class="belgi"><div><i class="k" style="border:.5mm solid ${RG.yor};background:#fff8e1"></i>LED panel 600×600, 36 W (3D bilan bir xil joyda)</div>
    <div><i style="border:.5mm solid ${RG.yor};background:#fff8e1;height:1.2mm"></i>koridor chiziqli chirog'i 1150, 36 W</div>
    <div><i class="k" style="border-radius:50%;border:.5mm solid ${RG.yor}"></i>vyklyuchatel, 0.9 m</div>
    <div><i style="border-top:.6mm solid ${RG.yor};height:0"></i>guruh kabeli 3×1.5</div>
    <div><i style="border-top:.5mm dashed ${RG.yor};height:0"></i>chiroqdan chiroqqa (shiftda)</div></div>`;
  const v2 = varaq('2-varaq · Elektr — yoritish, 2-qavat, 1:100', svgY, `<h2>ELEKTR — YORITISH (2-qavat)</h2>${belgiY}
    <h3>Yoritish guruhlari</h3>
    <table class="ix"><tr><th>Guruh</th><th>Xonalar</th><th class="r">Chiroq</th><th class="r">Vykl.</th><th class="r">kW</th><th class="r">3×1.5, m</th></tr>
      ${yG.map(g => `<tr><td><b>${g.kod}</b></td><td>${g.nom}</td><td class="r">${g.soni}</td><td class="r">${g.vykl || '—'}</td><td class="r">${g.P.toFixed(2)}</td><td class="r">${Math.round(g.L)}</td></tr>`).join('')}
      <tr class="j"><td>Jami</td><td></td><td class="r">${yG.reduce((t, g) => t + g.soni, 0)}</td><td class="r">${yG.reduce((t, g) => t + g.vykl, 0)}</td><td class="r">${yG.reduce((t, g) => t + g.P, 0).toFixed(2)}</td><td class="r">${sum(yG, 'VVGng-LS 3×1.5')}</td></tr></table>
    <ul><li>Chiroqlar joyi 3D bilan bir xil (diffuzor va panjaralardan suriladi). Vyklyuchatel — buyurtmachi belgilagan 13 ta: 7 sinf, 4 xizmat xonasi, K1 va K2 (koworking tomonda).</li>
      <li>Koworking, kirish zali, CEO, WC tamburi va 6-xonada vyklyuchatel qo'shilmaydi (buyurtmachi) — Y10 guruh avtomatidan yoki mavjud vyklyuchateldan.</li>
      <li>Y9: koridor chiroqlari, kanopi LED, yoritilgan logotiplar (2) va yashil LED tasma (2 × 12.6 m, 24 V blok bilan).</li>
      <li>Avariya chiroqlari — yong'in chizmasida (akkumulyatorli, yaqin guruhdan).</li></ul>
    ${shtamp('Elektr — yoritish', 2, 3)}`);
  const tok = P => (P * 1000 / 220).toFixed(1);
  const v3 = varaq('3-varaq · Elektr — 1-qavat resepshn rozetkalari; guruhlar jadvali (shit)', svg13, `<h2>ELEKTR — SHIT GURUHLARI (mavjud ShR, 6-xona)</h2>
    <table class="ix"><tr><th>Guruh</th><th>Iste'molchi</th><th>Avtomat</th><th>Kabel</th><th class="r">kW</th><th class="r">m</th></tr>
      ${[...rG, ...yG].map(g => `<tr><td><b>${g.kod}</b></td><td>${g.nom}</td><td>${g.avt}</td><td>${g.kabel.replace('VVGng-LS ', '')}</td><td class="r">${g.P.toFixed(1)}</td><td class="r">${Math.round(g.L)}</td></tr>`).join('')}
      ${h.kuch.map(k => `<tr><td><b>${k.kod}</b></td><td>${k.nom.split(' — ')[1]}</td><td>${k.avt}</td><td>${k.kabel.replace('VVGng-LS ', '')}</td><td class="r">${k.P}</td><td class="r">${Math.round(k.L)}</td></tr>`).join('')}
      <tr><td>—</td><td>zaxira (2 ta)</td><td>C16</td><td></td><td></td><td></td></tr>
      <tr class="j"><td>Jami</td><td>o'rnatilgan quvvat</td><td></td><td></td><td class="r">${P.toFixed(1)}</td><td></td></tr></table>
    <h3>Kabel va materiallar (2- va 1-qavat)</h3>
    <table class="ix"><tr><th>Nomi</th><th class="r">m</th></tr>
      <tr><td>VVGng-LS 3×2.5 (rozetkalar)</td><td class="r"><b>${sum(gr, 'VVGng-LS 3×2.5')}</b></td></tr>
      <tr><td>VVGng-LS 3×1.5 (yoritish, VV1)</td><td class="r"><b>${sum(gr, 'VVGng-LS 3×1.5') + Math.round(h.kuch.find(k => k.kod === 'VV1').L)}</b></td></tr>
      <tr><td>VVGng-LS 5×4 (KK1, KK2)</td><td class="r"><b>${Math.round(h.kuch.filter(k => k.kabel.includes('5×4')).reduce((t, k) => t + k.L, 0))}</b></td></tr>
      <tr><td>Kuch lotogi (shift ostida, 100 mm) — koridorlar va koworking</td><td class="r">${Math.round(EL[2].reduce((t, s) => t + d1(s[0], s[1]), 0) / 1000)}</td></tr></table>
    <div class="ogoh"><b>Diqqat:</b> o'rnatilgan quvvat ~${P.toFixed(0)} kW (shundan konditsionerlar 20 kW) — mavjud shit va kirish kabelining quvvati (3 faza, avtomat ≥ 63 A) tekshirilsin; shitda ${rG.length + yG.length + h.kuch.length + 2} ta guruh uchun joy bo'lmasa, yoniga 36 modulli qo'shimcha quti. Har sinf rozetkasi — alohida difavtomat (30 mA).</div>
    <ul><li>1-qavat resepshn: 2 rozetka (R13) — 2-qavat shitidan, asosiy zina bo'ylab (S1).</li>
      <li>3-qavat elektri mavjud (buyurtmachi) — chizilmaydi.</li></ul>
    ${shtamp('Elektr — shit guruhlari, 1-qavat', 3, 3, '1- va 2-qavat')}`);
  return sahifa('elektr', [v1, v2, v3]);
}

// shitning bir chiziqli sxemasi (3-varaq pastida)
function sxemaShit(h) {
  const l = [...h.guruh, ...h.kuch.map(k => ({ ...k, nom: k.nom.split(' — ')[1] })), { kod: 'Z1', nom: 'zaxira', avt: 'C16', kabel: '', P: 0, L: 0 }, { kod: 'Z2', nom: 'zaxira', avt: 'C16', kabel: '', P: 0, L: 0 }];
  const y0 = 14000, x0 = 300, dx = (23300 - x0) / l.length, q = [T(-1000, y0 - 900, "SHIT ShR — BIR CHIZIQLI SXEMA (mavjud shit, 6-xona)", 300, 'font-weight="700" fill="#1F3657"')];
  q.push(ulanish([-1000, y0 - 400], [-1000, y0]), ulanish([-1000, y0], [x0 + dx * (l.length - 0.5), y0]), `<rect x="-1150" y="${y0 - 350}" width="300" height="200" fill="#fff" stroke="#26313d" stroke-width="24"/>`,
    T(-700, y0 - 450, 'kirish 3F ~380 V (mavjud), bosh avtomat ≥ 63 A', 200, 'fill="#26313d"'));
  l.forEach((g, i) => {
    const x = x0 + dx * (i + 0.5), rang = g.kod.startsWith('R') ? RG.roz : g.kod.startsWith('Y') ? RG.yor : g.kod.startsWith('Z') ? '#9aa3ad' : RG.kuch;
    q.push(ulanish([x, y0], [x, y0 + 1800], rang), `<rect x="${x - 90}" y="${y0 + 450}" width="180" height="300" fill="#fff" stroke="${rang}" stroke-width="22"/><line x1="${x - 90}" y1="${y0 + 750}" x2="${x + 90}" y2="${y0 + 450}" stroke="${rang}" stroke-width="18"/>`,
      T(x, y0 + 2100, g.kod, 180, `text-anchor="middle" font-weight="700" fill="${rang}"`));
    const s = [g.avt.replace(' (difavtomat)', ''), g.kabel.replace('VVGng-LS ', ''), g.P ? `${(+g.P).toFixed(1)} kW` : '', g.L ? `${Math.round(g.L)} m` : ''].filter(Boolean).join(' · ');
    const ty = y0 + 2300, nom = g.nom.length > 30 ? g.nom.slice(0, 28).replace(/[ ,]+\S*$/, '') + ' …' : g.nom;
    q.push(T(x + 60, ty, `${s} — ${nom}`, 150, `fill="#26313d" transform="rotate(90 ${x + 60} ${ty})" text-anchor="start"`));
  });
  return q.join('');
}

// xarajatlar uchun yig'ma (xarajat-malumot.mjs → xarajatlar.py): soni va kabel uzunliklari, m
export function tizimXulosa() {
  const h = tizimHisob(), m = v => Math.round(v);
  const segL = t => Object.values(t).flat().reduce((s, g) => s + d1(g[0], g[1]), 0) / 1000;
  const kab = k => h.guruh.filter(g => g.kabel === k).reduce((t, g) => t + g.L, 0);
  const vv = h.kuch.find(k => k.kod === 'VV1').L, k54 = h.kuch.filter(k => k.kabel.includes('5×4')).reduce((t, k) => t + k.L, 0);
  const rG = h.guruh.filter(g => g.tur === 'r'), yG = h.guruh.filter(g => g.tur === 'y');
  return {
    kamera: h.kam.length, kameraM: m(jamiM(h.kam)), rj: h.rj.length, ap: h.ap.length,
    netM: m(h.rj.reduce((t, d) => t + 2 * d.L, 0) + h.ap.reduce((t, d) => t + d.L, 0)), ltM: m(segL(LT)),
    datchik: h.shl.reduce((t, s) => t + s.qurilmalar.length, 0), ipr: h.ipr.qurilmalar.length, sirena: h.sir.qurilmalar.length,
    tablo: h.tab.qurilmalar.length, avariya: AVARIYA.length, yonM1: m(h.shl.reduce((t, s) => t + s.L, 0) + h.ipr.L), yonM2: m(h.sir.L + h.tab.L),
    rozetka: rG.reduce((t, g) => t + g.soni, 0), doskaR: rG.reduce((t, g) => t + g.doska, 0), vykl: VYKL.length, chiroq: h.LED.length,
    k25: m(kab('VVGng-LS 3×2.5')), k15: m(kab('VVGng-LS 3×1.5') + vv), k54: m(k54), gofra: m(h.guruh.reduce((t, g) => t + g.ichki, 0)), elM: m(segL(EL)),
    difavt: rG.length, avt1: yG.length + 1 + 2, avt3: 2, P: +([...h.guruh.map(g => g.P), ...h.kuch.map(k => k.P)].reduce((a, b) => a + b, 0)).toFixed(1),
  };
}

// ===================== chiqish =====================
export async function tizimChizmalar() {
  const h = tizimHisob(), V = LOYIHA.versiya;
  const ish = [['kamera', kameraHtml(h)], ['internet', internetHtml(h)], ['pojarniy', yonginHtml(h)], ['elektr', elektrHtml(h)]];
  const brauzer = await chromium.launch();
  const p = await brauzer.newPage({ viewport: { width: 1588, height: 1123 }, deviceScaleFactor: 2 });
  const natija = [];
  for (const [nom, html] of ish) {
    const fayl = join(CH, `Xadra_tizim_${nom}_${V}`);
    await p.setContent(html, { waitUntil: 'load' });
    await p.pdf({ path: fayl + '.pdf', width: '420mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
    const v = await p.$$('section.varaq');
    for (let i = 0; i < v.length; i++) await v[i].screenshot({ path: `${fayl}-${i + 1}.png` });
    const tosh = await p.$$eval('.ong', els => els.map(e => e.scrollHeight - e.clientHeight));
    natija.push(`${nom}: ${v.length} varaq, panel toshishi ${JSON.stringify(tosh)}`);
  }
  await brauzer.close();
  return { h, natija };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { h, natija } = await tizimChizmalar();
  natija.forEach(s => console.log(s));
  console.log('kamera Cat6', jamiM(h.kam), 'm; internet', Math.round(h.rj.reduce((t, d) => t + 2 * d.L, 0) + h.ap.reduce((t, d) => t + d.L, 0)), 'm; shleyflar',
    h.shl.map(s => `${s.sh}:${s.qurilmalar.length}/${Math.round(s.L)}`).join(' '), '; elektr', h.guruh.map(g => `${g.kod}:${Math.round(g.L)}`).join(' '));
}
