// 2-qavat: vitechka (so'rish ventilyatsiyasi) va kanalli konditsioner — buyurtmachi eskizi bo'yicha (15.10.2026).
// Buyurtmachi ish chizmasining 1-varag'i ustiga ikki tizimni qo'lda chizib berdi, kanallari alohida:
//  (1) «Вытяжка» — fasadlar bo'ylab (oyna tomonda) va XZ xonalarida o'rta devor yonida so'rish kanallari, dumaloq
//      panjaralar; koridor oxirlari orqali o'tadigan magistral; ventilyator — 3-xonada fasad yonida;
//  (2) «Кондиционер» — har koridor oxirida kanalli konditsioner ichki bloki, koridor bo'ylab magistral, har sinfga 2 ta,
//      xizmat xonalariga 1 ta diffuzor, 4-xonaga ikkala koridordan bittadan; tashqi havo 3-xona fasadidan vertikal kanal
//      bilan ikkala blokka; yozuv «100», «96 ka» — blok quvvati 96 000 BTU deb olindi (buyurtmachidan tasdiq kutiladi).
// Bu varaqlarda eskizdagi yo'nalishlar o'lchamli qilinadi, havo sarfi va kanal kesimlari hisoblanadi, kesishuvlar belgilanadi.
// Joylar eskizdan 0.2–0.7 m siljitilgan: kanallar ustun, eshik, logotip devori va bloklar bilan to'qnashmasligi uchun.
// 16.10 (buyurtmachi va founder): koridorlar 4-xona o'rtasigacha davom etadi; bloklar kladovka shifti ustida, devorga taqalib
// turadi (kladovka shovqinni to'sadi) — havoni koridor bo'ylab to'g'ri magistral bilan beradi, 3-, 4-, 5-xonaga ham koridordan;
// tashqi havo 30% — avvalgidek 3-xonaning ko'cha tomonidan (vertikal kanal, koridorlar bo'ylab bloklarning orqasiga);
// vitechka yo'nalishlari o'zgarmaydi, havosi tashqi havoga moslanadi (90%).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { LOYIHA, H, ICHKI, XONALAR, KLADOVKA } from './model.mjs';
import { asos, zanjir, oqBelgi, T, R, son, RANG, NOM, ISH_CSS } from './ish-chizma.mjs';
import { tizimHisob, NARX } from './hvac-tizim.mjs';
import { F } from './hvac.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(join(process.execPath, '../../lib/node_modules/playwright'))); }
const BU = dirname(fileURLToPath(import.meta.url)), CH = join(BU, '..', 'chizma');
const X = Object.fromEntries(XONALAR.map(x => [x.kod, x]));

// ---------- asosiy o'lchamlar (reja koordinatalari, mm) ----------
const KX = KLADOVKA.x;
export const VC = {
  yF: 1000,                 // fasad bo'ylab so'rish kanali o'qi — fasad ichki yuzidan
  xM: 18850,                // so'rish magistrali o'qi (eskizda ~19 200)
  xT: 19900,                // tashqi havo vertikal kanali o'qi — 3-xona fasadidan (buyurtmachi: hozirgi joyida)
  yXZ: { K1: 11700, K2: 12900 },          // XZ xonalaridagi so'rish kanallari — o'rta devor yuzidan 500
  diffSinf: 1500, diffXZ: 1200,           // diffuzor markazi koridor devoridan
  // kanalli bloklar — kladovka shifti ustida, iloji boricha tashqi devorga yaqin (buyurtmachi, 16.10): orqasidagi qaytish
  // kamerasi (tashqi havo shu yerga) tashqi devordan 50 mm; chiqishi g'arbga — magistral kladovka shifti ustidan koridorga
  blok: { K1: { x1: ICHKI.x - 1800, x2: ICHKI.x - 400, y1: 8250, y2: 9150 }, K2: { x1: ICHKI.x - 1800, x2: ICHKI.x - 400, y1: 15550, y2: 16450 } },
  qaytish: { K1: { x1: ICHKI.x - 400, x2: ICHKI.x - 50, y1: 8250, y2: 9150 }, K2: { x1: ICHKI.x - 400, x2: ICHKI.x - 50, y1: 15550, y2: 16450 } },
  magY: { K1: 8700, K2: 16000 },          // berish magistrali o'qi (koridorda)
  tozaY: { K1: 8010, K2: 15310 },         // tashqi havo kanali — koridorning shimoliy chetida, blok yonidan qaytish kamerasiga
  ven: { x1: 18400, x2: 19300, y1: 150, y2: 750 },   // VV1 — so'rish ventilyatori (kanalli)
  blokQ: 5000,              // 96k kanalli blokning nominal havo sarfi, m³/soat (taxminiy — tanlangan model pasportidan)
  tozaUlush: 0.30,          // buyurtmachi: konditsioner tashqaridan 30% toza havo oladi
  sorUlush: 0.90,           // vitechka — kelayotgan tashqi havoning 90% i (xonalar biroz ortiqcha bosimda)
  blokBtu: 96000, blokKw: 28.1, issiq: 0.87,
};
const yP = ICHKI.y - VC.yF;     // sharqiy fasad bo'ylab so'rish kanali

// ---------- yordamchilar ----------
const d2 = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const uzun = pts => pts.slice(1).reduce((t, p, i) => t + d2(pts[i], p), 0);
function masofa(pts, p) {
  let s = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], L = d2(a, b);
    if (Math.abs(d2(a, p) + d2(p, b) - L) < 2) return s + d2(a, p);
    s += L;
  }
  throw new Error(`nuqta yo'lda emas: ${p}`);
}
function nuqta(pts, s) {
  let t = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const L = d2(pts[i], pts[i + 1]);
    if (s <= t + L + 1e-6) { const u = (s - t) / L; return [pts[i][0] + u * (pts[i + 1][0] - pts[i][0]), pts[i][1] + u * (pts[i + 1][1] - pts[i][1])]; }
    t += L;
  }
  return pts.at(-1);
}
function qism(pts, s1, s2) {
  const q = [nuqta(pts, s1)]; let t = 0;
  for (let i = 0; i < pts.length - 1; i++) { t += d2(pts[i], pts[i + 1]); if (t > s1 + 1 && t < s2 - 1) q.push(pts[i + 1]); }
  q.push(nuqta(pts, s2));
  return q;
}
// kanal kesimi: to'rtburchak, tekis yotqiziladi (rejadagi eni — katta tomoni); tezlik chegarasiga mos eng kichigi
const KESIM = [[200, 150], [250, 150], [250, 200], [300, 200], [400, 200], [400, 250], [500, 250], [500, 300], [600, 300], [600, 350], [600, 400], [700, 400], [800, 400], [800, 500]];
const kesim = (Q, v) => { const [a, b] = KESIM.find(([a, b]) => Q / 3600 / (a * b / 1e6) <= v) || KESIM.at(-1); return { a, b, v: Q / 3600 / (a * b / 1e6) }; };
const vMax = Q => (Q > 2000 ? 5.0 : 4.0);
// liniya: uzoq uchidan manbagacha (so'rishda — ventilyatorga, berishda — blokka); voqealar — panjara/diffuzor ulanishi va
// boshqa liniyaning qo'shilishi. Har bo'lakdagi havo — undan oldingi (uzoq tomondagi) voqealar yig'indisi.
function liniya(id, pts, voqealar) {
  const L = uzun(pts);
  const ev = voqealar.map(v => ({ ...v, s: masofa(pts, v.p) })).sort((a, b) => a.s - b.s);
  const kes = [...new Set([0, ...ev.map(e => Math.round(e.s)).filter(s => s > 1 && s < L - 1), Math.round(L)])].sort((a, b) => a - b);
  const bolak = [];
  for (let i = 0; i < kes.length - 1; i++) {
    const Q = ev.filter(e => e.s <= kes[i] + 1).reduce((t, e) => t + e.Q, 0);
    bolak.push({ id, pts: qism(pts, kes[i], kes[i + 1]), Q, L: kes[i + 1] - kes[i], ...kesim(Q, vMax(Q)) });
  }
  return { id, pts, L, Q: ev.reduce((t, e) => t + e.Q, 0), bolak };
}

// ---------- hisob ----------
export function ventHisob() {
  const T0 = tizimHisob();
  const X0 = Object.fromEntries(T0.xona.map(x => [x.kod, x]));
  const yuk = Object.fromEntries(T0.xona.map(x => [x.kod, x.q.map(v => v - x.oaQoldiq)]));   // xona yuki (tashqi havosiz), kW

  // ===== KONDITSIONER: diffuzorlar va havo taqsimoti =====
  // KK1 — K1 bo'ylab: 1-, 2-, 3-xona, XZ4, XZ3; KK2 — K2 bo'ylab: 7-, 6-, 5-xona, XZ1, XZ2.
  // 4-xona (buyurtmachi, 17.10): ikkala blokdan bittadan diffuzor — D (shimoliy) KK1 dan K1 tomondan, D (janubiy) KK2 dan K2 tomondan;
  // har guruhda 4-xonaning yarmi (yuki va odami) hisoblanadi.
  const GR = {
    K1: { blok: 'KK1', xonalar: ['SR1', 'SR2', 'SR3', 'SR4', 'XZ3', 'XZ4'] },
    K2: { blok: 'KK2', xonalar: ['SR5', 'SR6', 'SR7', 'SR4', 'XZ1', 'XZ2'] },
  };
  const UL = k => (k === 'SR4' ? 0.5 : 1);
  const yS = { K1: X.SR1.y2 - VC.diffSinf, K2: X.SR7.y1 + VC.diffSinf };       // sinf diffuzorlari qatori
  const yX = { K1: X.XZ4.y1 + VC.diffXZ, K2: X.XZ1.y2 - VC.diffXZ };            // XZ diffuzorlari
  const uch = (kod) => { const r = X[kod], W = r.x2 - r.x1; return [r.x1 + W / 3, r.x1 + 2 * W / 3].map(v => Math.round(v / 50) * 50); };
  const M = VC.magY;
  // diffuzor: [x, y, magistraldan yo'l (ixtiyoriy — L shaklida)]
  const tik = (x, y, kor) => [x, y, [[x, M[kor]], [x, y]]];
  const L3 = (k, yb, yd) => [22300, yd, [[20750, M[k]], [20750, yb], [22300, yb], [22300, yd]]];   // 3-/5-xonaning sharqiy diffuzori
  const DJ = {
    SR1: uch('SR1').map(x => tik(x, yS.K1, 'K1')), SR2: uch('SR2').map(x => tik(x, yS.K1, 'K1')),
    SR3: [tik(19650, yS.K1, 'K1'), L3('K1', 7000, yS.K1)],
    SR4: { K1: [tik(20900, 10900, 'K1')], K2: [tik(20900, 13700, 'K2')] },   // har biri o'z koridori magistralidan
    XZ4: [tik(10750, yX.K1, 'K1')], XZ3: [tik(15500, yX.K1, 'K1')],
    SR7: uch('SR7').map(x => tik(x, yS.K2, 'K2')), SR6: uch('SR6').map(x => tik(x, yS.K2, 'K2')),
    SR5: [tik(19650, yS.K2, 'K2'), L3('K2', 17400, yS.K2)],
    XZ1: [tik(10750, yX.K2, 'K2')], XZ2: [tik(16300, yX.K2, 'K2')],
  };
  const D = [], guruh = {}, xona = {};
  for (const [kor, g] of Object.entries(GR)) {
    // havo xonalarga yuk ulushi va odam ulushidan kattasi bo'yicha (odam ko'p, yuk kam xonada ham toza havo yetishi uchun)
    const yukU = g.xonalar.map(k => yuk[k][1] * UL(k)), sy = yukU.reduce((a, b) => a + b, 0);
    const odamU = g.xonalar.map(k => X0[k].odam * UL(k)), so = odamU.reduce((a, b) => a + b, 0);
    const w = g.xonalar.map((k, i) => Math.max(yukU[i] / sy, odamU[i] / so)), sw = w.reduce((a, b) => a + b, 0);
    g.xonalar.forEach((k, i) => {
      const Q = Math.round(VC.blokQ * w[i] / sw / 10) * 10, dj = Array.isArray(DJ[k]) ? DJ[k] : DJ[k][kor];
      const avval = xona[k];          // 4-xona: ikkinchi blokdan kelgan havo birinchisiga qo'shiladi
      const Qj = Q + (avval?.Q || 0), toza = Qj * VC.tozaUlush, odam = X0[k].odam;
      xona[k] = { kod: k, kor, blok: avval ? `${avval.blok} + ${g.blok}` : g.blok, Q: Qj, toza, sor: Math.round(toza * VC.sorUlush / 10) * 10, odam,
        co2: F.co2Tashqi + odam * F.co2Kishi / toza * 1e6, yuk: yuk[k] };
      dj.forEach(j => D.push({ xona: k, kor, p: [j[0], j[1]], yol: j[2], Q: Q / dj.length }));
    });
    const toza = VC.blokQ * VC.tozaUlush, xonaYuk = sy, oaYuk = toza * F.kwPerKm3;
    guruh[kor] = { ...g, kor, Q: VC.blokQ, oa: toza, ulush: VC.tozaUlush, xonaYuk, oaYuk, jami: xonaYuk + oaYuk,
      yuk0: g.xonalar.reduce((t, k) => t + yuk[k][0] * UL(k), 0) };
  }
  const DT = ['SR1', 'SR2', 'SR3', 'SR4', 'SR5', 'SR6', 'SR7', 'XZ4', 'XZ3', 'XZ1', 'XZ2'];
  D.sort((a, b) => DT.indexOf(a.xona) - DT.indexOf(b.xona) || a.p[1] - b.p[1] || a.p[0] - b.p[0]);
  D.forEach((d, i) => {
    d.kod = `D${i + 1}`;
    d.ulanish = d.yol[0];
    d.panel = d.Q >= 500 ? 600 : 450; d.boyin = kesim(d.Q, 3.5);
    d.tarmoqL = uzun(d.yol);
  });
  const kLin = [];
  for (const kor of ['K1', 'K2']) {
    const g = D.filter(d => d.kor === kor && d.ulanish[1] === M[kor]);
    const xg = Math.min(...g.map(d => d.ulanish[0]));
    const voq = D.filter(d => d.kor === kor).map(d => ({ p: d.ulanish, Q: d.Q }));
    kLin.push(liniya(`${kor}g`, [[xg, M[kor]], [VC.blok[kor].x1, M[kor]]], voq));
  }
  // tashqi havo (30%): 3-xona fasadidan vertikal kanal, koridorlar bo'ylab bloklarning qaytish kamerasiga
  const qk = k => [(VC.qaytish[k].x1 + VC.qaytish[k].x2) / 2, VC.qaytish[k].y1];
  const t1 = liniya('T1', [qk('K1'), [qk('K1')[0], VC.tozaY.K1], [VC.xT, VC.tozaY.K1]], [{ p: qk('K1'), Q: guruh.K1.oa }]);
  const tV = liniya('TV', [qk('K2'), [qk('K2')[0], VC.tozaY.K2], [VC.xT, VC.tozaY.K2], [VC.xT, -300]],
    [{ p: qk('K2'), Q: guruh.K2.oa }, { p: [VC.xT, VC.tozaY.K1], Q: guruh.K1.oa }]);
  const tLin = [t1, tV];

  // ===== VITECHKA: so'rish panjaralari — havo: xonaga kelayotgan tashqi havoning 90% i =====
  const chorak = (kod, y) => { const r = X[kod], W = r.x2 - r.x1; return [[r.x1 + W / 4, y], [r.x1 + 3 * W / 4, y]]; };
  const P = [];
  const qosh = (k, joylar) => joylar.forEach((p, i) => P.push({ xona: k, p, Q: Math.round(xona[k].sor / joylar.length / 5) * 5, n: i }));
  qosh('SR1', chorak('SR1', VC.yF)); qosh('SR2', chorak('SR2', VC.yF));
  qosh('SR3', [[20600, VC.yF], [22800, VC.yF]]);
  qosh('SR4', [[VC.xM, 10800], [VC.xM, 13600]]);
  qosh('SR5', [[VC.xM, 19000], [VC.xM, 21700]]);
  qosh('SR6', chorak('SR6', yP)); qosh('SR7', chorak('SR7', yP));
  const xzX = kod => (X[kod].x1 + X[kod].x2) / 2;
  qosh('XZ4', [[xzX('XZ4'), VC.yXZ.K1]]); qosh('XZ3', [[xzX('XZ3'), VC.yXZ.K1]]);
  qosh('XZ1', [[xzX('XZ1'), VC.yXZ.K2]]); qosh('XZ2', [[xzX('XZ2'), VC.yXZ.K2]]);
  P.forEach(p => { p.d = p.Q <= 350 ? 200 : p.Q <= 550 ? 250 : 315; p.v = p.Q / 3600 / (Math.PI * (p.d / 2000) ** 2); });
  const TART = ['SR1', 'SR2', 'SR3', 'SR4', 'SR5', 'SR6', 'SR7', 'XZ4', 'XZ3', 'XZ1', 'XZ2'];
  P.sort((a, b) => TART.indexOf(a.xona) - TART.indexOf(b.xona) || (a.xona === 'SR6' || a.xona === 'SR7' ? b.p[0] - a.p[0] : a.p[0] - b.p[0] || a.p[1] - b.p[1]));
  P.forEach((p, i) => { p.kod = `V${i + 1}`; });
  const pv = k => P.filter(p => p.xona === k).map(p => ({ p: p.p, Q: p.Q }));
  const VT = liniya('VT', [[P.find(p => p.xona === 'SR1').p[0], VC.yF], [VC.xM, VC.yF]], [...pv('SR1'), ...pv('SR2')]);
  const VS3 = liniya('VS3', [[22800, VC.yF], [VC.xM, VC.yF]], pv('SR3'));
  const VP = liniya('VP', [[P.filter(p => p.xona === 'SR7').at(-1).p[0], yP], [VC.xM, yP]], [...pv('SR7'), ...pv('SR6')]);
  const VX1 = liniya('VX1', [[xzX('XZ4'), VC.yXZ.K1], [VC.xM, VC.yXZ.K1]], [...pv('XZ4'), ...pv('XZ3')]);
  const VX2 = liniya('VX2', [[xzX('XZ1'), VC.yXZ.K2], [VC.xM, VC.yXZ.K2]], [...pv('XZ1'), ...pv('XZ2')]);
  const VM = liniya('VM', [[VC.xM, yP], [VC.xM, VC.yF], [VC.xM, VC.ven.y2]], [
    { p: [VC.xM, yP], Q: VP.Q }, ...pv('SR5'), ...pv('SR4'), { p: [VC.xM, VC.yXZ.K2], Q: VX2.Q }, { p: [VC.xM, VC.yXZ.K1], Q: VX1.Q },
    { p: [VC.xM, VC.yF], Q: VT.Q + VS3.Q }]);
  const vLin = [VT, VS3, VP, VX1, VX2, VM];
  const vQ = VM.Q, venQ = Math.ceil(vQ * 1.07 / 500) * 500;
  const chiqish = kesim(vQ, 5.0);

  // kesishuvlar (bir sathda o'tib bo'lmaydi — biri ikkinchisining ostidan)
  const KES = [
    { p: [VC.xT, VC.yF], izoh: "3-xona: so'rish kanali (3-xona panjaralari) × tashqi havo vertikal kanali" },
    { p: [VC.xM, M.K1], izoh: "K1: so'rish magistrali × berish magistrali" },
    { p: [VC.xT, M.K1], izoh: "K1: tashqi havo vertikal kanali × berish magistrali" },
    { p: [20750, VC.tozaY.K1], izoh: "K1: 3-xonaga tarmoq × tashqi havo kanali (KK1 ga)" },
    { p: [VC.xM, M.K2], izoh: "K2: so'rish magistrali × berish magistrali" },
    { p: [20900, VC.tozaY.K2], izoh: "K2: 4-xonaga tarmoq (KK2 dan, D8) × tashqi havo kanali (KK2 ga)" },
  ].map((k, i) => ({ ...k, n: i + 1 }));

  // uzunliklar, m
  const sumL = lins => lins.reduce((t, l) => t + l.L, 0) / 1000;
  const uzV = sumL(vLin) + (VC.ven.y1 + 300) / 1000;
  const uzK = sumL(kLin) + D.reduce((t, d) => t + d.tarmoqL, 0) / 1000 + 2.8;
  const uzT = sumL(tLin);
  return { P, vLin, vQ, venQ, chiqish, D, kLin, tLin, guruh, xona, KES, uz: { V: uzV, K: uzK, T: uzT, jami: uzV + uzK + uzT } };
}

// ---------- chizish ----------
const RG = { so: '#b7372a', soF: '#f7d8d2', ber: '#1f6fd1', berF: '#d9e8fb', toza: '#14896f', tozaF: '#d3eee7', xira: '#c3c8ce', xiraF: '#eef0f2' };
const kanal = (pts, a, rang, fon) => {
  const d = pts.map(p => p.map(v => Math.round(v)).join(',')).join(' ');
  return [`<polyline points="${d}" fill="none" stroke="${rang}" stroke-width="${a + 40}" stroke-linejoin="miter"/>`,
    `<polyline points="${d}" fill="none" stroke="${fon}" stroke-width="${Math.max(a - 16, 20)}" stroke-linejoin="miter"/>`];
};
// liniyalarni chizish: avval hamma tashqi chiziqlar, keyin ichki fon — tutashgan joylar bir butun ko'rinadi
function kanallar(lins, rang, fon, qoshimcha = []) {
  const ich = [], tash = [];
  lins.forEach(l => l.bolak.forEach(b => { const [o, i] = kanal(b.pts, b.a, rang, fon); tash.push(o); ich.push(i); }));
  qoshimcha.forEach(([pts, a]) => { const [o, i] = kanal(pts, a, rang, fon); tash.push(o); ich.push(i); });
  return tash.join('') + ich.join('');
}
// bo'lak yozuvi: kesim va havo sarfi — eng uzun bo'laklarda
function bolakYozuv(lins, rang, { min = 1800, yon = 1, istisno = [], joy = {} } = {}) {
  const q = [];
  lins.forEach(l => {
    if (joy[l.id]) {   // qo'lda berilgan joylar: [x, y, burilgan, tanlov] — tanlov 'min' bo'lsa eng kichik, aks holda eng katta bo'lak
      joy[l.id].forEach(([x, y, r, t]) => {
        const b = l.bolak.reduce((a, c) => ((t === 'min' ? c.Q < a.Q : c.Q > a.Q) ? c : a));
        q.push(T(x, y, `${b.a}×${b.b} · ${son(b.Q)}`, 175, `text-anchor="middle" fill="${rang}" font-weight="700"${r ? ` transform="rotate(-90 ${x} ${y})"` : ''}`));
      });
      return;
    }
    l.bolak.forEach(b => {
      if (b.L < min || istisno.includes(l.id)) return;
      let best = [b.pts[0], b.pts[1]], bl = 0;
      for (let i = 0; i < b.pts.length - 1; i++) { const L = d2(b.pts[i], b.pts[i + 1]); if (L > bl) { bl = L; best = [b.pts[i], b.pts[i + 1]]; } }
      if (bl < min) return;
      const [p1, p2] = best, mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2, gor = Math.abs(p2[0] - p1[0]) > Math.abs(p2[1] - p1[1]);
      const s = `${b.a}×${b.b} · ${son(b.Q)}`, o = b.a / 2 + 150, vx = mx + yon * o + (yon > 0 ? 150 : 0);
      if (gor) q.push(T(mx, my + yon * o + (yon > 0 ? 150 : 0), s, 175, `text-anchor="middle" fill="${rang}" font-weight="700"`));
      else q.push(T(vx, my, s, 175, `text-anchor="middle" fill="${rang}" font-weight="700" transform="rotate(-90 ${vx} ${my})"`));
    });
  });
  return q.join('');
}
const panjaraSvg = (p, rang = RG.so, fon = '#fff', r = 210) => `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${fon}" stroke="${rang}" stroke-width="30"/><circle cx="${p[0]}" cy="${p[1]}" r="${r * 0.35}" fill="${rang}"/>`;
const diffSvg = (p, s, rang = RG.ber, fon = RG.berF) => `<rect x="${p[0] - s}" y="${p[1] - s}" width="${2 * s}" height="${2 * s}" fill="${fon}" stroke="${rang}" stroke-width="28"/><path d="M${p[0] - s},${p[1] - s} L${p[0] + s},${p[1] + s} M${p[0] + s},${p[1] - s} L${p[0] - s},${p[1] + s}" stroke="${rang}" stroke-width="16"/>`;
const strelka = (a, b, rang, w = 50) => {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 260, u = 0.45;
  const p1 = [b[0] - L * Math.cos(ang - u), b[1] - L * Math.sin(ang - u)], p2 = [b[0] - L * Math.cos(ang + u), b[1] - L * Math.sin(ang + u)];
  return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${rang}" stroke-width="${w}"/><path d="M${b[0]},${b[1]} L${p1[0]},${p1[1]} L${p2[0]},${p2[1]} z" fill="${rang}"/>`;
};
const venSvg = (r, rang, nom) => {
  const cx = (r.x1 + r.x2) / 2, cy = (r.y1 + r.y2) / 2, rr = Math.min(r.x2 - r.x1, r.y2 - r.y1) * 0.36;
  return R(r, `fill="#fff" stroke="${rang}" stroke-width="40"`) + `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="${rang}" stroke-width="28"/>` +
    [0, 120, 240].map(a => { const t = a * Math.PI / 180; return `<path d="M${cx},${cy} Q${cx + rr * 0.9 * Math.cos(t + 0.9)},${cy + rr * 0.9 * Math.sin(t + 0.9)} ${cx + rr * Math.cos(t)},${cy + rr * Math.sin(t)}" fill="none" stroke="${rang}" stroke-width="24"/>`; }).join('') +
    T(r.x2 + 160, cy + 80, nom, 230, `fill="${rang}" font-weight="700"`);
};
const blokSvg = (r, nom, rang = RG.ber) => R(r, `fill="#e9eef5" stroke="#26313d" stroke-width="40"`) +
  `<path d="M${r.x1},${r.y1} L${r.x2},${r.y2} M${r.x2},${r.y1} L${r.x1},${r.y2}" stroke="#8a96a3" stroke-width="14"/>` +
  T((r.x1 + r.x2) / 2, (r.y1 + r.y2) / 2 + 80, nom, 230, `text-anchor="middle" font-weight="700" fill="#26313d"`);
const kesBelgi = (k, rang = '#6a1b9a') => `<circle cx="${k.p[0]}" cy="${k.p[1]}" r="170" fill="#fff" stroke="${rang}" stroke-width="26"/>` +
  T(k.p[0], k.p[1] + 62, k.n, 170, `text-anchor="middle" font-weight="700" fill="${rang}"`);
// xona nomlari — kanallardan bo'sh joyda (asos() dagi markaziy yozuvlar o'rniga)
const XYOZ = { SR1: [9100, 3500], SR2: [15050, 3500], SR3: [22100, 3500], SR4: [22600, 11300], SR5: [21300, 20500], SR6: [15050, 20800], SR7: [9050, 20800],
  XZ4: [8100, 10050], XZ3: [13900, 10050], XZ1: [8000, 14250], XZ2: [13700, 14250], KW: [2975, 13100], X12: [2975, 22900], ZL: [4800, 19800] };
const xonaNomlari = () => Object.entries(XYOZ).map(([k, [x, y]]) => T(x, y, NOM[k], 230, `text-anchor="middle" font-weight="700" fill="#5d6873"`)).join('');
const VB = { x1: -2900, y1: -2700, x2: 26700, y2: 26500 };
const svgOch = q => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB.x1} ${VB.y1} ${VB.x2 - VB.x1} ${VB.y2 - VB.y1}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">${q.join('')}</svg>`;

// boshqa tizim — xira (muvofiqlashtirish uchun)
function xiraKonditsioner(h) {
  const q = [kanallar([...h.kLin, ...h.tLin], RG.xira, RG.xiraF, h.D.map(d => [d.yol, d.boyin.a]))];
  h.D.forEach(d => q.push(diffSvg(d.p, d.panel / 2, RG.xira, '#fff')));
  ['K1', 'K2'].forEach(k => q.push(R(VC.blok[k], `fill="#fff" stroke="${RG.xira}" stroke-width="30"`), R(VC.qaytish[k], `fill="#fff" stroke="${RG.xira}" stroke-width="30"`)));
  return q.join('');
}
function xiraVitechka(h) {
  const q = [kanallar(h.vLin, RG.xira, RG.xiraF)];
  h.P.forEach(p => q.push(panjaraSvg(p.p, RG.xira, '#fff', 180)));
  q.push(R(VC.ven, `fill="#fff" stroke="${RG.xira}" stroke-width="30"`));
  return q.join('');
}

// ---------- 1-varaq: vitechka ----------
function vitechkaSvg(h) {
  const q = [asos(VB, 1, { xonaYozuv: false }), oqBelgi(VB, 1), xonaNomlari(), xiraKonditsioner(h)];
  q.push(kanallar(h.vLin, RG.so, RG.soF, [[[[VC.xM, VC.ven.y1], [VC.xM, -300]], h.chiqish.a]]));
  q.push(venSvg(VC.ven, RG.so, 'VV1'));
  q.push(strelka([VC.xM, -300], [VC.xM, -1500], RG.so, 60), T(VC.xM - 250, -1650, 'chiqish (eskizda — fasaddan)', 175, `text-anchor="end" fill="${RG.so}" font-weight="700"`));
  h.P.forEach(p => {
    q.push(panjaraSvg(p.p));
    const pastda = p.p[1] === VC.yF || p.p[1] === VC.yXZ.K2, chapda = p.p[0] === VC.xM;
    if (chapda) q.push(T(p.p[0] - 300, p.p[1] + 65, `${p.kod} · ${son(p.Q)}`, 175, `text-anchor="end" fill="${RG.so}" font-weight="700"`));
    else q.push(T(p.p[0], p.p[1] + (pastda ? 480 : -300), `${p.kod} · ${son(p.Q)}`, 175, `text-anchor="middle" fill="${RG.so}" font-weight="700"`));
  });
  q.push(bolakYozuv(h.vLin, RG.so, { min: 2000, yon: 1, istisno: ['VX1'] }), bolakYozuv(h.vLin.filter(l => l.id === 'VX1'), RG.so, { min: 2000, yon: -1 }));
  // o'lcham zanjirlari
  const Z = { size: 1.9 }, P = h.P;
  const xs = k => P.filter(p => p.xona === k).map(p => p.p[0]);
  q.push(zanjir([6250, ...xs('SR1'), 11950, 12150, ...xs('SR2'), 17950, 18150, VC.xM, ...xs('SR3'), ICHKI.x], 2300, true, 1, { ...Z, tomon: -1 }));
  q.push(zanjir([6150, ...xs('SR7'), 11950, 12150, ...xs('SR6'), 17950, 18150, VC.xM, ICHKI.x], 22200, true, 1, { ...Z, tomon: 1 }));
  q.push(zanjir([0, VC.yF], 6750, false, 1, Z), zanjir([yP, ICHKI.y], 6750, false, 1, Z));
  q.push(zanjir([9400, VC.yXZ.K1, 12200, 12400, VC.yXZ.K2, 15000], 6900, false, 1, { ...Z, tomon: -1 }));
  q.push(zanjir([6250, xs('XZ4')[0], 11950, 12150, xs('XZ3')[0], 17950], 10750, true, 1, { ...Z, tomon: -1 }));
  q.push(zanjir([9400, 10800, 13600, 15000], 20300, false, 1, { ...Z, tomon: 1 }), zanjir([16700, 19000, 21700, ICHKI.y], 20300, false, 1, { ...Z, tomon: 1 }));
  q.push(zanjir([18150, VC.xM], 14550, true, 1, { ...Z, tomon: 1 }));
  return svgOch(q);
}

// ---------- 2-varaq: konditsioner ----------
function konditsionerSvg(h) {
  const q = [asos(VB, 1, { xonaYozuv: false }), oqBelgi(VB, 1), xonaNomlari(), xiraVitechka(h)];
  q.push(kanallar(h.tLin, RG.toza, RG.tozaF));
  q.push(kanallar(h.kLin, RG.ber, RG.berF, h.D.map(d => [d.yol, d.boyin.a])));
  ['K1', 'K2'].forEach(k => {
    const b = VC.blok[k], kq = VC.qaytish[k], cy = (b.y1 + b.y2) / 2;
    // blok va qaytish kamerasi — kladovka shifti ustida (punktir), blokdan koridorga chiqish
    q.push(R(b, `fill="#e9eef5" fill-opacity=".9" stroke="#26313d" stroke-width="36" stroke-dasharray="110 50"`),
      `<path d="M${b.x1},${b.y1} L${b.x2},${b.y2} M${b.x2},${b.y1} L${b.x1},${b.y2}" stroke="#8a96a3" stroke-width="12"/>`,
      R(kq, `fill="${RG.tozaF}" stroke="#26313d" stroke-width="30" stroke-dasharray="80 40"`),
      T((b.x1 + b.x2) / 2, cy + 80, h.guruh[k].blok, 230, 'text-anchor="middle" font-weight="700" fill="#26313d"'),
      T((b.x1 + b.x2) / 2, k === 'K1' ? b.y2 + 330 : b.y1 - 160, 'kladovka shifti ustida', 150, 'text-anchor="middle" fill="#26313d"'));
    // qaytish panjarasi (17.10) — koridor shiftida, kladovka devori yonida, 600 × 300 (logoli variantda reykalar ortida);
    // havo shift ustidagi bo'shliq orqali ko'ndalang devordan blokning qaytish kamerasiga o'tadi
    const kc = k === 'K1' ? 8550 : 15850, gp = { x1: KX - 600, x2: KX - 300, y1: kc - 300, y2: kc + 300 };
    q.push(R(gp, `fill="#fff" stroke="#26313d" stroke-width="20"`),
      ...[1, 2, 3, 4, 5].map(i => `<line x1="${gp.x1 + 40}" x2="${gp.x2 - 40}" y1="${gp.y1 + i * 100}" y2="${gp.y1 + i * 100}" stroke="#26313d" stroke-width="12"/>`),
      T(gp.x1 - 70, kc + 55, 'QP', 150, 'text-anchor="end" fill="#26313d" font-weight="700"'));
  });
  h.D.forEach(d => {
    q.push(diffSvg(d.p, d.panel / 2));
    if (d.xona.startsWith('XZ') || d.xona === 'SR4') q.push(T(d.p[0] + d.panel / 2 + 120, d.p[1] + 65, `${d.kod} · ${son(d.Q)}`, 175, `fill="${RG.ber}" font-weight="700"`));
    else q.push(T(d.p[0], d.p[1] + (d.p[1] < 8000 ? -d.panel / 2 - 130 : d.panel / 2 + 300), `${d.kod} · ${son(d.Q)}`, 175, `text-anchor="middle" fill="${RG.ber}" font-weight="700"`));
  });
  q.push(bolakYozuv(h.kLin, RG.ber, { min: 1900, yon: -1 }));
  // tashqi havo: 3-xona fasadidagi panjara va yozuv
  q.push(strelka([VC.xT, -1500], [VC.xT, -350], RG.toza, 60), T(VC.xT + 250, -1650, "tashqi havo 30% — 3-xona ko'cha tomonidan", 175, `fill="${RG.toza}" font-weight="700"`));
  q.push(bolakYozuv(h.tLin, RG.toza, { min: 2500, yon: 1, joy: { TV: [[VC.xT + 560, 3300, 1], [VC.xT + 560, 12300, 1, 'min']], T1: [] } }));
  h.KES.forEach(k => q.push(kesBelgi(k)));
  // o'lcham zanjirlari
  const Z = { size: 1.9 }, D = h.D;
  const xs = k => D.filter(d => d.xona === k).map(d => d.p[0]);
  q.push(zanjir([6250, ...xs('SR1'), 11950, 12150, ...xs('SR2'), 17950, 18150, VC.xT, ...xs('SR3'), ICHKI.x], 5000, true, 1, { ...Z, tomon: -1 }));
  q.push(zanjir([6150, ...xs('SR7'), 11950, 12150, ...xs('SR6'), 17950, 18150, VC.xT, ...xs('SR5'), ICHKI.x], 19500, true, 1, { ...Z, tomon: 1 }));
  q.push(zanjir([D.find(d => d.xona === 'SR1').p[1], 7700, 7800, VC.tozaY.K1, VC.magY.K1, 9300, 9400, D.find(d => d.xona === 'XZ4').p[1]], 6750, false, 1, { ...Z, tomon: -1 }));
  q.push(zanjir([D.find(d => d.xona === 'XZ1').p[1], 15000, 15100, VC.tozaY.K2, VC.magY.K2, 16600, 16700, D.find(d => d.xona === 'SR7').p[1]], 6750, false, 1, { ...Z, tomon: -1 }));
  q.push(zanjir([6250, xs('XZ4')[0], 11950, 12150, xs('XZ3')[0], 17950], 11300, true, 1, { ...Z, tomon: -1 }));
  q.push(zanjir([6250, xs('XZ1')[0], 11950, 12150, xs('XZ2')[0], 17950], 13200, true, 1, { ...Z, tomon: 1 }));
  q.push(zanjir([KX, KX + 100, VC.blok.K1.x1, VC.blok.K1.x2, VC.qaytish.K1.x2, ICHKI.x], 9750, true, 1, { ...Z, tomon: 1 }));
  q.push(zanjir([7800, VC.blok.K1.y1, VC.blok.K1.y2, 9300], 23500, false, 1, { ...Z, tomon: 1 }), zanjir([15100, VC.blok.K2.y1, VC.blok.K2.y2, 16600], 23500, false, 1, { ...Z, tomon: 1 }));
  q.push(zanjir([9400, 10900, 13700, 15000], 21550, false, 1, { ...Z, tomon: 1 }), zanjir([18150, 20900, ICHKI.x], 12300, true, 1, { ...Z, tomon: -1 }));
  return svgOch(q);
}

// ---------- HTML ----------
const CSS2 = `
.belgi i.d { width: 3.2mm; height: 3.2mm; } .kichik { font-size: 5.8pt; color: #555; }
td.c, th.c { text-align: center; } .ikki { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; }
.yashil { border: .3mm solid #14896f; background: #effaf6; padding: 1mm 1.4mm; margin-top: 1mm; }
`;
const shtamp = (nom, n) => `<div class="shtamp"><div class="nom">${LOYIHA.brend} · ${LOYIHA.filial}</div>
  <div class="ch"><span>Chizma</span><span>${nom}</span></div>
  <div>Ish chizmasi — ustalar uchun. Buyurtmachi eskizi (15.10) va qarorlari (16.10) asosida. ${LOYIHA.manzil} — 2-qavat</div>
  <div class="g4"><span><small>Masshtab</small>1:100</span><span><small>Sana</small>16.10.2026</span><span><small>Versiya</small>${LOYIHA.versiya}</span><span><small>Varaq</small>${n} / 2</span></div>
  <div>Bajardi: ____________ &nbsp;&nbsp; Tekshirdi: ____________</div></div>`;
const n1 = v => v.toFixed(1);

export function ventHtml() {
  const h = ventHisob(), G = h.guruh;
  const blokKw = VC.blokKw, blokIssiq = VC.blokKw * VC.issiq;
  const vMag = h.vLin.flatMap(l => l.bolak.map(b => ({ ...b, lid: l.id }))).filter(b => b.L >= 300);
  const LNOM = { VT: "1–2-xona, fasad bo'ylab", VS3: '3-xona, fasad bo\'ylab', VP: "7–6-xona, fasad bo'ylab", VX1: 'XZ4, XZ3 (o\'rta devor yonida)', VX2: 'XZ1, XZ2 (o\'rta devor yonida)', VM: 'magistral (koridor oxirlari)',
    K1g: 'K1 koridori (KK1 dan)', K2g: 'K2 koridori (KK2 dan)', T1: 'tashqi havo → KK1', TV: 'tashqi havo: 3-xona fasadi → KK2' };
  const bolakJadval = (lins, sarlavha) => {
    const r = [];
    lins.forEach(l => {
      // bir xil kesimli qo'shni bo'laklarni birlashtirib ko'rsatamiz
      const g = [];
      l.bolak.forEach(b => { const o = g.at(-1); if (o && o.a === b.a && o.b === b.b) { o.L += b.L; o.Qmax = Math.max(o.Qmax, b.Q); } else g.push({ a: b.a, b: b.b, L: b.L, Qmin: b.Q, Qmax: b.Q, v: b.v }); });
      g.forEach(b => r.push(`<tr><td>${LNOM[l.id]}</td><td class="r">${b.Qmin === b.Qmax ? son(b.Qmax) : `${son(b.Qmin)}–${son(b.Qmax)}`}</td><td class="r"><b>${b.a} × ${b.b}</b></td><td class="r">${n1(b.L / 1000)}</td></tr>`));
    });
    return `<table><tr><th>${sarlavha}</th><th class="r">m³/soat</th><th class="r">Kesim, mm</th><th class="r">Uzunlik, m</th></tr>${r.join('')}</table>`;
  };
  const vP = h.P;
  const v1 = `<section class="varaq"><div class="ram"><div class="yorliq">1-varaq · Vitechka (so'rish ventilyatsiyasi) — kanallar rejasi, 1:100</div>${vitechkaSvg(h)}</div>
  <div class="ong">
    <h2>VITECHKA — SO'RISH KANALLARI (buyurtmachi eskizi bo'yicha)</h2>
    <div class="belgi">
      <div><i style="background:${RG.soF};border:.5mm solid ${RG.so}"></i>so'rish kanali (kesim × havo, m³/soat)</div>
      <div><i class="d" style="border-radius:50%;border:.5mm solid ${RG.so};background:radial-gradient(${RG.so} 30%,#fff 32%)"></i>so'rish panjarasi (klapan) V…</div>
      <div><i style="background:#fff;border:.5mm solid ${RG.so}"></i>VV1 — kanalli ventilyator</div>
      <div><i style="background:${RG.xiraF};border:.4mm solid ${RG.xira}"></i>konditsioner kanallari (2-varaq, xira)</div></div>
    <h3>Panjaralar — ${vP.length} ta, jami ${son(h.vQ)} m³/soat</h3>
    <table><tr><th>Kod</th><th>Xona</th><th class="r">x, mm</th><th class="r">y, mm</th><th class="r">m³/soat</th><th class="r">Ø, mm</th></tr>
      ${vP.map(p => `<tr><td><b>${p.kod}</b></td><td>${NOM[p.xona]}</td><td class="r">${son(p.p[0])}</td><td class="r">${son(p.p[1])}</td><td class="r">${son(p.Q)}</td><td class="r">${p.d}</td></tr>`).join('')}</table>
    <p class="kichik">x — chap (g'arbiy) fasad ichki yuzidan, y — yuqori fasad ichki yuzidan (1-varaqdagi o'qlar bo'yicha). So'rish havosi — xonaga konditsioner orqali kelayotgan tashqi havoning (30%) ${Math.round(VC.sorUlush * 100)}% i: xonalar biroz ortiqcha bosimda, koridordan chang kirmaydi.</p>
    <h3>Kanallar (galvanizlangan po'lat, to'rtburchak, tekis yotqiziladi)</h3>
    ${bolakJadval(h.vLin, 'Liniya')}
    <p style="margin-top:.8mm"><b>VV1:</b> kanalli ventilyator ${son(h.venQ)} m³/soat, ~400 Pa (to'rtburchak, ${h.chiqish.a}×${h.chiqish.b} ga mos), shovqin so'ndirgich bilan; kanallar jami ~${Math.round(h.uz.V)} m.</p>
    <h3>O'rnatish</h3>
    <ul>
      <li>Kanallar shift ostida, osmalarda (har 2–2.5 m); pastki qirrasi ≥ 2.9 m. Shisha devorlar ustidagi GKL (2.5–3.5 m) va mavjud devorlardan teshik orqali o'tadi; teshik atrofi germetiklanadi.</li>
      <li>Ventilyator osma rezina amortizatorlarda, kanalga egiluvchan ulanadi; har liniya boshida rostlash klapani, panjaralar sozlanadigan (havo — jadval bo'yicha).</li>
      <li>Kanallar 2-varaqdagi konditsioner kanallari bilan ${h.KES.length} joyda kesishadi — so'rish kanali yuqorida, berish kanali ostida (2-varaq, ①–${['', '①', '②', '③', '④', '⑤', '⑥', '⑦'][h.KES.length]}).</li>
    </ul>
    <div class="ogoh"><b>Diqqat — chiqish joyi:</b> eskizda VV1 chiqishi va konditsionerning tashqi havo olish panjarasi 3-xona fasadida, oralig'i ~${son(VC.xT - VC.xM)} mm — chiqarilgan havo qaytib so'rib olinadi. Me'yor: olish va chiqarish orasi ≥ 8 m. Fasad o'zgarmasligi kerak (oyna ustida faqat ~400 mm devor bor). <b>Tavsiya:</b> tashqi havo buyurtmachi qarori bilan 3-xona ko'cha tomonidan qoladi — shuning uchun VV1 chiqishini to'g'ridan tomga (tom sathidan ≥ 1 m baland, soyabon bilan) chiqarish kerak.</div>
    ${shtamp("Vitechka — so'rish kanallari rejasi", 1)}
  </div></section>`;

  const kG = ['K1', 'K2'].map(k => G[k]);
  const holat = (q, c) => (c >= q ? '<b style="color:#14896f">yetadi</b>' : `<b style="color:#c62828">yetmaydi (−${n1(q - c)} kW)</b>`);
  const XN = Object.values(h.xona).sort((a, b) => ['SR1', 'SR2', 'SR3', 'SR4', 'XZ4', 'XZ3', 'SR5', 'SR6', 'SR7', 'XZ1', 'XZ2'].indexOf(a.kod) - ['SR1', 'SR2', 'SR3', 'SR4', 'XZ4', 'XZ3', 'SR5', 'SR6', 'SR7', 'XZ1', 'XZ2'].indexOf(b.kod));
  const co2 = XN.map(x => x.co2), co2Min = Math.round(Math.min(...co2) / 50) * 50, co2Max = Math.round(Math.max(...co2) / 50) * 50;
  const v2 = `<section class="varaq"><div class="ram"><div class="yorliq">2-varaq · Konditsioner (kanalli) va tashqi havo — kanallar rejasi, 1:100</div>${konditsionerSvg(h)}</div>
  <div class="ong">
    <h2>KANALLI KONDITSIONER — BERISH KANALLARI (16.10)</h2>
    <div class="belgi">
      <div><i style="background:${RG.berF};border:.5mm solid ${RG.ber}"></i>sovuq havo kanali (kesim × m³/soat)</div>
      <div><i class="d" style="background:${RG.berF};border:.5mm solid ${RG.ber}"></i>shift diffuzori D… (4 tomonga)</div>
      <div><i style="background:${RG.tozaF};border:.5mm solid ${RG.toza}"></i>tashqi havo kanali (30%, blokka)</div>
      <div><i style="background:#e9eef5;border:.5mm dashed #26313d"></i>KK — ichki blok, kladovka shifti ustida</div>
      <div><i style="background:${RG.xiraF};border:.4mm solid ${RG.xira}"></i>vitechka (1-varaq, xira)</div>
      <div><i class="d" style="border-radius:50%;border:.5mm solid #6a1b9a"></i>①–${['', '①', '②', '③', '④', '⑤', '⑥', '⑦'][h.KES.length]} kesishuvlar</div></div>
    <h3>Ichki bloklar — kladovka (KL1, KL2) shifti ustida, devorga taqalgan (96 000 BTU deb olindi)</h3>
    <table><tr><th>Blok</th><th>Xonalar</th><th class="r">Havo</th><th class="r">Tashqi havo</th></tr>
      ${kG.map(g => `<tr><td><b>${g.blok}</b></td><td>${g.xonalar.map(k => NOM[k].replace('-xona', '') + (k === 'SR4' ? ' (1 diffuzor)' : '')).join(', ')}</td><td class="r">${son(g.Q)}</td><td class="r">${son(g.oa)} (${Math.round(g.ulush * 100)}%)</td></tr>`).join('')}</table>
    <h3>Quvvat tekshiruvi (kW, eng issiq payt)</h3>
    <table><tr><th>Blok</th><th class="r">Xonalar</th><th class="r">+ tashqi havo 30%</th><th class="r">Jami</th><th>96k (${n1(blokIssiq)} kW issiqda)</th></tr>
      ${kG.map(g => `<tr><td><b>${g.blok}</b></td><td class="r">${n1(g.yuk0)}–${n1(g.xonaYuk)}</td><td class="r">${n1(g.oaYuk)}</td><td class="r"><b>${n1(g.jami)}</b></td><td>${holat(g.jami, blokIssiq)}</td></tr>`).join('')}</table>
    <h3>Xonalar: havo, tashqi havo, so'rish, CO₂</h3>
    <table><tr><th>Xona</th><th class="r">Odam</th><th class="r">Havo</th><th class="r">Tashqi (30%)</th><th class="r">So'rish</th><th class="r">CO₂, ppm</th></tr>
      ${XN.map(x => `<tr><td>${NOM[x.kod]} (${x.blok})</td><td class="r">${x.odam}</td><td class="r">${son(x.Q)}</td><td class="r">${son(x.toza)}</td><td class="r">${son(x.sor)}</td><td class="r">${son(Math.round(x.co2 / 10) * 10)}</td></tr>`).join('')}</table>
    <h3>Diffuzorlar — ${h.D.length} ta</h3>
    <table><tr><th>Kod</th><th>Xona</th><th class="r">x</th><th class="r">y</th><th class="r">m³/soat</th><th class="r">Panel</th><th class="r">Patrubok</th></tr>
      ${h.D.map(d => `<tr><td><b>${d.kod}</b></td><td>${NOM[d.xona]}</td><td class="r">${son(d.p[0])}</td><td class="r">${son(d.p[1])}</td><td class="r">${son(d.Q)}</td><td class="r">${d.panel}×${d.panel}</td><td class="r">${d.boyin.a}×${d.boyin.b}</td></tr>`).join('')}</table>
    ${bolakJadval([...h.kLin, ...h.tLin], 'Magistral')}
    <p class="kichik">Kanallar jami: berish ~${Math.round(h.uz.K)} m (patrubokli), tashqi havo ~${Math.round(h.uz.T)} m, vitechka ~${Math.round(h.uz.V)} m — hammasi ~${Math.round(h.uz.jami)} m (narx: ${son(NARX.kanalM)} so'm/m). Qaytish havosi (QP): koridor shiftidagi panjara 600 × 300, kladovka devori yonida (logoli variantda reykalar ortida) — shift ustidagi bo'shliq orqali blokning qaytish kamerasiga.</p>
    <div class="ogoh"><b>Diqqat:</b> (1) 2 × 96k yetmaydi — har blokka ~${Math.round(Math.max(...kG.map(g => g.jami)))} kW (~${Math.round(Math.max(...kG.map(g => g.jami)) * 3.412 / 10) * 10}k BTU) kerak; 96k issiqda ~${n1(blokIssiq)} kW beradi. (2) 30% tashqi havoda to'la sinfda CO₂ ~${son(co2Min)}–${son(co2Max)} ppm (me'yor ≤ 1 000–1 200): darsdan keyin shamollatish yoki tashqi havoni ~45–50% ga oshirish (blok shunga mos tanlansa) tavsiya.</div>
    ${shtamp('Konditsioner (kanalli) va tashqi havo', 2)}
  </div></section>`;
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — vitechka va konditsioner</title><style>${ISH_CSS}${CSS2}</style></head><body>${v1}${v2}</body></html>`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const V = LOYIHA.versiya, nom = join(CH, `Xadra_2-qavat_vitechka_konditsioner_${V}`);
  const brauzer = await chromium.launch();
  const p = await brauzer.newPage({ viewport: { width: 1588, height: 1123 }, deviceScaleFactor: 2 });
  await p.setContent(ventHtml(), { waitUntil: 'load' });
  await p.pdf({ path: nom + '.pdf', width: '420mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
  const v = await p.$$('section.varaq');
  for (let i = 0; i < v.length; i++) await v[i].screenshot({ path: `${nom}-${i + 1}.png` });
  // panel to'lib ketmaganini tekshirish
  const tosh = await p.$$eval('.ong', els => els.map(e => e.scrollHeight - e.clientHeight));
  await brauzer.close();
  const h = ventHisob();
  console.log(nom + '.pdf', 'panjara', h.P.length, 'diffuzor', h.D.length, 'vitechka', h.vQ, 'm3/h; KK1', h.guruh.K1.Q, 'KK2', h.guruh.K2.Q,
    'kanal m', Math.round(h.uz.jami), 'panel toshishi', tosh);
}
