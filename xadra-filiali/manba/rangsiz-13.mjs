// 1- va 3-qavat rejasi — rangsiz (oq-qora), mebelsiz (buyurtmachi, 17.10): devorlar, zina, eshiklar, derazalar, ustunlar,
// sanuzel jihozlari (kontur), 1-qavatda turniket chizig'i va resepshn stoykasi (zalni bo'ladi); xona nomi, o'lchami, maydoni,
// o'lcham zanjirlari. build.mjs → Xadra_1-qavat_reja_rangsiz, Xadra_3-qavat_reja_rangsiz (A3 landshaft, 1:50).
import { LOYIHA } from './model.mjs';
import { eshikSektori } from './tekshiruv.mjs';
import { zanjir } from './ish-chizma.mjs';
import { BINO1, TAMBUR, DEVOR1, USTUN1, ESHIK1, ZINA1, RESEPSHN, TURNIKET } from './qavat1.mjs';
import { BINO3, DEVOR3, KABINA, KABINA_DEVOR, DERAZA3, ESHIK3, XONA3, WC3, sinf3 } from './qavat3.mjs';

const Q = '#111';
const R = (r, a) => `<rect x="${r.x1}" y="${r.y1}" width="${r.x2 - r.x1}" height="${r.y2 - r.y1}" ${a}/>`;
const L = (x1, y1, x2, y2, a) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${a}/>`;
const T = (x, y, s, size, a = '') => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" fill="${Q}" font-family="Liberation Sans, Arial, sans-serif" paint-order="stroke" stroke="#fff" stroke-width="${size * 0.25}" stroke-linejoin="round" ${a}>${s}</text>`;
const m2 = (a, b) => `${(a / 1000).toFixed(2)} × ${(b / 1000).toFixed(2)} m`;
const DEFS = `<defs><pattern id="sh" width="160" height="160" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <line x1="0" y1="0" x2="0" y2="160" stroke="#888" stroke-width="10"/></pattern>
  <pattern id="gkl" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <line x1="0" y1="0" x2="0" y2="120" stroke="#000" stroke-width="16"/></pattern></defs>`;

// oddiy (ilgakli) eshik: barg chizig'i va punktir yoy
function eshik(e, w = 12) {
  const s = eshikSektori(e);
  let leaf, arcEnd, sweep;
  if (e.devor === 'h') {
    leaf = { x: s.ilgak.x, y: e.yuz + e.yon * e.en }; arcEnd = { x: e.ilgak === 'a' ? e.b : e.a, y: e.yuz };
    sweep = (e.ilgak === 'a') === (e.yon > 0) ? 0 : 1;
  } else {
    leaf = { x: e.yuz + e.yon * e.en, y: s.ilgak.y }; arcEnd = { x: e.yuz, y: e.ilgak === 'a' ? e.b : e.a };
    sweep = (e.ilgak === 'a') === (e.yon > 0) ? 1 : 0;
  }
  return L(s.ilgak.x, s.ilgak.y, leaf.x, leaf.y, `stroke="${Q}" stroke-width="${w}"`) +
    `<path d="M${leaf.x},${leaf.y} A${e.en},${e.en} 0 0 ${sweep} ${arcEnd.x},${arcEnd.y}" fill="none" stroke="${Q}" stroke-width="${w * 0.5}" stroke-dasharray="${w * 2.5} ${w * 1.6}"/>`;
}
const strelka = (x1, y1, x2, y2, w = 14) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = w * 9;
  return L(x1, y1, x2 - Math.cos(a) * h * 0.8, y2 - Math.sin(a) * h * 0.8, `stroke="${Q}" stroke-width="${w}"`) +
    `<path d="M${x2},${y2} L${x2 - Math.cos(a - 0.45) * h},${y2 - Math.sin(a - 0.45) * h} L${x2 - Math.cos(a + 0.45) * h},${y2 - Math.sin(a + 0.45) * h} z" fill="${Q}"/>`;
};

// ---------- 1-qavat ----------
export const VB1 = { x1: -1700, y1: -1700, x2: 8300, y2: 9300 };
export function rangsiz1Svg() {
  const q = [DEFS, R(VB1, 'fill="#fff"')];
  const Z = ZINA1, I = BINO1.ichki;
  // zina: pastki marsh va maydoncha (kesimgacha); yuqori marsh — tepada (punktir); ostida h < 2 m
  q.push(R(Z.past, 'fill="url(#sh)"'));
  q.push(R(Z.pastki, `fill="#fff" stroke="${Q}" stroke-width="10"`));
  const t1 = (Z.pastki.x2 - Z.pastki.x1) / Z.pastki.soni;
  for (let i = 1; i < Z.pastki.soni; i++) q.push(L(Z.pastki.x1 + i * t1, Z.pastki.y1, Z.pastki.x1 + i * t1, Z.pastki.y2, `stroke="${Q}" stroke-width="6"`));
  q.push(R(Z.maydoncha, `fill="none" stroke="${Q}" stroke-width="10"`));
  q.push(R(Z.yuqori, `fill="none" stroke="${Q}" stroke-width="10" stroke-dasharray="60 40"`));
  const t2 = (Z.yuqori.x2 - Z.yuqori.x1) / Z.yuqori.soni;
  for (let i = 1; i < Z.yuqori.soni; i++) q.push(L(Z.yuqori.x1 + i * t2, Z.yuqori.y1, Z.yuqori.x1 + i * t2, Z.yuqori.y2, `stroke="#555" stroke-width="5" stroke-dasharray="35 35"`));
  q.push(strelka(Z.pastki.x1 + 150, 750, Z.pastki.x2 - 200, 750), strelka(Z.yuqori.x2 - 300, 1900, Z.yuqori.x1 + 200, 1900, 10));
  // turniket chizig'i: to'siqlar, evakuatsiya darvozasi, turniketlar
  const TT = TURNIKET;
  TT.tosiq.forEach(t => q.push(R(t, `fill="${Q}"`)));
  q.push(R(TT.darvoza, `fill="#fff" stroke="${Q}" stroke-width="8" stroke-dasharray="40 25"`),
    `<path d="M${TT.darvoza.x2},${TT.chiziq} A900,900 0 0 1 ${TT.darvoza.x1},${TT.chiziq + 900}" fill="none" stroke="${Q}" stroke-width="6" stroke-dasharray="30 20"/>`,
    L(TT.darvoza.x1, TT.chiziq, TT.darvoza.x1, TT.chiziq + 900, `stroke="${Q}" stroke-width="14"`));
  TT.turniketlar.forEach(t => {
    q.push(R(t.korpus, `rx="40" fill="#fff" stroke="${Q}" stroke-width="12"`));
    [-1, 0, 1].forEach(k => { const a = (k * 120 - 180) * Math.PI / 180; q.push(L(t.korpus.x1, TT.chiziq, t.korpus.x1 + Math.cos(a) * 520, TT.chiziq + Math.sin(a) * 520, `stroke="${Q}" stroke-width="14" stroke-linecap="round"`)); });
    const cx = (t.otish.x1 + t.otish.x2) / 2, kir = t.yonalish === 'kirish';
    q.push(kir ? strelka(cx, 4950, cx, 3350, 16) : strelka(cx, 3350, cx, 4950, 16));
  });
  // resepshn stoykasi va to'siq panellari (kontur), xodim eshigi
  const RS = RESEPSHN;
  q.push(R(RS.stol, `fill="#fff" stroke="${Q}" stroke-width="12"`), R(RS.peshtaxta, `fill="#fff" stroke="${Q}" stroke-width="12"`));
  RS.panellar.forEach(p => q.push(R(p, `fill="${Q}"`)));
  const xe = RS.xodimEshik;
  q.push(L(xe.x2, xe.y1, xe.x2 + xe.en, xe.y1, `stroke="${Q}" stroke-width="12"`), `<path d="M${xe.x2 + xe.en},${xe.y1} A${xe.en},${xe.en} 0 0 1 ${xe.x2},${xe.y2}" fill="none" stroke="${Q}" stroke-width="6" stroke-dasharray="30 20"/>`);
  ESHIK1.forEach(e => q.push(eshik(e)));
  DEVOR1.forEach(d => q.push(R(d, `fill="${Q}"`)));
  USTUN1.forEach(u => q.push(R(u, `fill="${Q}"`)));
  // yozuvlar
  q.push(T(1650, 5250, 'Kirish zali', 300, 'font-weight="700"'), T(1650, 5600, `${m2(I.x2 - I.x1, I.y2 - I.y1)} · ${BINO1.maydon.toFixed(2)} m²`, 190),
    T(3300, 1100, 'Zina (mavjud) — 2-qavatga', 190, 'font-weight="700"'), T(2700, 2280, 'yuqori marsh (tepada)', 150),
    T(4100, 2280, 'h < 2 m', 150), T(1100, 2100, 'zina osti', 160),
    T(5560, 5750, 'Resepshn', 200, 'font-weight="700"'), T(3500, 4750, 'Turniketlar (mavjud)', 180, 'font-weight="700"'),
    T(2950, 3650, 'chiqish', 150), T(4010, 3650, 'kirish', 150), T(2000, 4380, 'evak. darvoza 900', 140),
    T(3600, 7120, 'Tambur', 220, 'font-weight="700"'), T(3600, 7400, m2(TAMBUR.x2 - TAMBUR.x1 - 240, TAMBUR.y2 - TAMBUR.y1 - 120), 160),
    strelka(3585, 9050, 3585, 8350, 30), T(4250, 8800, 'KIRISH', 220, 'font-weight="700"'));
  // o'lcham zanjirlari
  const Zc = { rang: Q, size: 1.75 };
  q.push(zanjir([0, BINO1.L], -1250, true, 1, { ...Zc, tomon: -1 }),
    zanjir([0, 250, 1550, 2450, 2650, 3250, 3550, 3710, 4310, 4610, 4880, 6250, BINO1.L], -600, true, 1, { ...Zc, size: 1.4, tomon: -1 }),
    zanjir([TAMBUR.x1, 2880, 4290, TAMBUR.x2], 8250, true, 1, { ...Zc, size: 1.4, tomon: 1 }),
    zanjir([0, BINO1.B, TAMBUR.y2], -1250, false, 1, { ...Zc, tomon: -1 }),
    zanjir([100, 1400, 2400, 4050, 6100], -600, false, 1, { ...Zc, size: 1.4, tomon: -1 }),
    zanjir([2400, 3500, 5300, 6100], 7150, false, 1, { ...Zc, size: 1.4, tomon: 1 }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB1.x1} ${VB1.y1} ${VB1.x2 - VB1.x1} ${VB1.y2 - VB1.y1}" width="${(VB1.x2 - VB1.x1) / 50}mm" height="${(VB1.y2 - VB1.y1) / 50}mm">${q.join('')}</svg>`;
}

// ---------- 3-qavat ----------
export const VB3 = { x1: -1300, y1: -1300, x2: 13000, y2: 12850 };
export function rangsiz3Svg() {
  const q = [DEFS, R(VB3, 'fill="#fff"')];
  // o'zgarmaydigan xonalar (3 — qozonxona, 4 — yopiq xona) — xira shtrix
  XONA3.filter(x => x.tur === 'yopiq').forEach(x => q.push(R(x, 'fill="url(#sh)" opacity=".55"')));
  // zinapoya
  [{ x1: 400, x2: 1550, y1: 1400, y2: 4450 }, { x1: 1650, x2: 2800, y1: 1400, y2: 4450 }].forEach(m => {
    q.push(R(m, `fill="#fff" stroke="${Q}" stroke-width="10"`));
    for (let y = m.y1 + 280; y < m.y2; y += 280) q.push(L(m.x1, y, m.x2, y, `stroke="${Q}" stroke-width="6"`));
  });
  q.push(`<path d="M400,1400 A1200,1100 0 0 1 2800,1400" fill="none" stroke="${Q}" stroke-width="10"/>`, strelka(2200, 1700, 2200, 4150, 16));
  // hojatxona jihozlari (kontur)
  WC3.rakovina.forEach(([x, y]) => q.push(R({ x1: x - 230, x2: x + 230, y1: y - 180, y2: y + 180 }, `rx="70" fill="#fff" stroke="${Q}" stroke-width="10"`)));
  WC3.unitaz.forEach(([x, y]) => q.push(R({ x1: x - 190, x2: x + 190, y1: y - 270, y2: y + 270 }, `rx="150" fill="#fff" stroke="${Q}" stroke-width="10"`)));
  WC3.chashagen.forEach(([x, y]) => q.push(R({ x1: x - 225, x2: x + 225, y1: y - 300, y2: y + 300 }, `rx="70" fill="#fff" stroke="${Q}" stroke-width="10"`),
    `<path d="M${x - 105},${y - 170} L${x + 105},${y - 170} L${x + 125},${y + 90} A125,125 0 0 1 ${x - 125},${y + 90} Z" fill="none" stroke="${Q}" stroke-width="7"/>`));
  WC3.mustahab.forEach(([x, y]) => q.push(`<circle cx="${x}" cy="${y}" r="60" fill="#fff" stroke="${Q}" stroke-width="10"/>`));
  q.push(R(WC3.taxorat, `rx="40" fill="#fff" stroke="${Q}" stroke-width="10"`));
  WC3.taxoratJomrak.forEach(([x, y]) => q.push(R({ x1: x - 70, x2: x + 70, y1: y - 35, y2: y + 35 }, `fill="#fff" stroke="${Q}" stroke-width="8"`)));
  const [tx, ty] = WC3.trap;
  q.push(`<path d="M${tx},${ty - 110} L${tx + 110},${ty} L${tx},${ty + 110} L${tx - 110},${ty} Z" fill="#fff" stroke="${Q}" stroke-width="10"/>`);
  // doska (5-xona)
  const d = sinf3().doska;
  q.push(R({ ...d, y2: d.y1 + 80 }, `fill="#fff" stroke="${Q}" stroke-width="10"`));
  ESHIK3.forEach(e => q.push(eshik(e, e.kabina ? 8 : 12)));
  DEVOR3.forEach(w => q.push(w.yangi ? R(w, `fill="#fff" stroke="${Q}" stroke-width="10"`) + R(w, 'fill="url(#gkl)"') : R(w, `fill="${Q}"`)));
  KABINA_DEVOR.forEach(w => q.push(R(w, `fill="${Q}"`)));
  DERAZA3.forEach(w => {
    const m = (w.x1 + w.x2) / 2;
    q.push(R(w, `fill="#fff" stroke="${Q}" stroke-width="7"`), L(m - 40, w.y1, m - 40, w.y2, `stroke="${Q}" stroke-width="5"`), L(m + 40, w.y1, m + 40, w.y2, `stroke="${Q}" stroke-width="5"`));
  });
  // yozuvlar
  const X = kod => XONA3.find(x => x.kod === kod);
  const w = x => m2(x.x2 - x.x1, x.y2 - x.y1);
  q.push(T(1650, 5250, 'Zinapoya', 260, 'font-weight="700"'), T(1650, 5560, '(2-qavatdan)', 190),
    T(4350, 4000, '1 · Koridor', 280, 'font-weight="700"'), T(4350, 4320, `${X('1').A.toFixed(2)} m²`, 210), T(5220, 1100, 'tambur', 180),
    T(9300, 2150, '2 · Erkaklar hojatxonasi', 260, 'font-weight="700"'), T(9300, 2450, `${w(X('2'))} · ${X('2').A.toFixed(2)} m²`, 190),
    T(2300, 7500, '3 · Qozonxona', 260, 'font-weight="700"'), T(2300, 7800, `${w(X('3'))} · ${X('3').A.toFixed(2)} m²`, 190),
    T(3000, 10600, '4 · Yopiq xona', 260, 'font-weight="700"'), T(3000, 10900, `${w(X('4'))} · ${X('4').A.toFixed(2)} m²`, 190),
    T(8825, 7600, "5 · O'quv xonasi", 340, 'font-weight="700"'), T(8825, 7980, `${w(X('5'))} · ${X('5').A.toFixed(2)} m²`, 240));
  const Zc = { rang: Q, size: 1.75 };
  q.push(zanjir([0, BINO3.L], -1000, true, 1, { ...Zc, tomon: -1 }),
    zanjir([300, 2900, 3000, 4600, 4700, 5750, 6100, 7550, 11550], -450, true, 1, { ...Zc, size: 1.4, tomon: -1 }),
    zanjir([0, 300, 4300, 4400, 5750, 6100, 11550, BINO3.L], 12550, true, 1, { ...Zc, size: 1.4, tomon: 1 }),
    zanjir([0, BINO3.B], -1050, false, 1, { ...Zc, tomon: -1 }),
    zanjir([300, 6050, 6150, 9050, 9250, 12000], -500, false, 1, { ...Zc, size: 1.4, tomon: -1 }),
    zanjir([300, 1400, 3150, 3400, 12000], 12450, false, 1, { ...Zc, size: 1.4, tomon: 1 }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB3.x1} ${VB3.y1} ${VB3.x2 - VB3.x1} ${VB3.y2 - VB3.y1}" width="${(VB3.x2 - VB3.x1) / 50}mm" height="${(VB3.y2 - VB3.y1) / 50}mm">${q.join('')}</svg>`;
}

// ---------- A3 landshaft varaqlar ----------
const CSS = `
@page { size: 420mm 297mm; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
body { font-family: 'Liberation Sans', Arial, sans-serif; color: #111; }
.varaq { width: 420mm; height: 297mm; padding: 6mm 7mm; display: grid; grid-template-columns: 1fr 100mm; gap: 6mm; overflow: hidden; }
.reja { display: flex; align-items: center; justify-content: center; border: .4mm solid #111; }
.ong { display: flex; flex-direction: column; gap: 4mm; font-size: 8pt; line-height: 1.4; }
.brend { font-size: 8.5pt; color: #444; font-weight: 700; } h1 { font-size: 15pt; margin-top: 1mm; } .kichik { font-size: 7.5pt; color: #333; margin-top: 1mm; }
.bar { display: flex; width: 50mm; height: 1.6mm; border: .2mm solid #111; margin-top: 2mm; } .bar i { flex: 1 } .bar i:nth-child(odd) { background: #111 }
.son { display: flex; justify-content: space-between; width: 52mm; font-size: 6pt; }
table { width: 100%; border-collapse: collapse; font-size: 8pt; } th { text-align: left; font-size: 7.4pt; border-bottom: .3mm solid #111; padding: .7mm .4mm; }
td { padding: .7mm .4mm; border-bottom: .15mm solid #bbb; } td.r, th.r { text-align: right; white-space: nowrap; } tr.j td { font-weight: 700; border-bottom: none; }
.izoh { border: .3mm solid #111; padding: 2.5mm 3mm; } .izoh h2 { font-size: 9.5pt; margin-bottom: 1mm; } .izoh ul { padding-left: 3.5mm; } .izoh li { margin-bottom: .8mm; }
`;
const sarlavha = (qavat, kichik) => `<div><div class="brend">${LOYIHA.brend} · ${LOYIHA.filial}</div><h1>${qavat} rejasi — rangsiz, mebelsiz</h1>
  <div class="kichik">${kichik}</div><div class="kichik">Masshtab 1:50 (A3) · ${LOYIHA.versiya} · 17.10.2026</div>
  <div class="bar"><i></i><i></i><i></i><i></i><i></i></div><div class="son"><span>0</span><span>0.5</span><span>1</span><span>1.5</span><span>2</span><span>2.5 m</span></div></div>`;
const sahifa = (svg, ong) => `<!doctype html><html lang="uz"><head><meta charset="utf-8"><style>${CSS}</style></head><body>
  <section class="varaq"><div class="reja">${svg}</div><div class="ong">${ong}</div></section></body></html>`;

export function rangsiz1Html() {
  const I = BINO1.ichki;
  return sahifa(rangsiz1Svg(), `${sarlavha('1-qavat', "Kirish zali: resepshn, turniketlar, zina (mavjud)")}
    <table><tr><th>Joy</th><th class="r">Ichki o'lcham</th><th class="r">Maydon</th></tr>
      <tr><td>Kirish zali</td><td class="r">${m2(I.x2 - I.x1, I.y2 - I.y1)}</td><td class="r">${BINO1.maydon.toFixed(2)} m²</td></tr>
      <tr><td>Tambur</td><td class="r">${m2(TAMBUR.x2 - TAMBUR.x1 - 240, TAMBUR.y2 - TAMBUR.y1 - 120)}</td><td class="r">${((TAMBUR.x2 - TAMBUR.x1 - 240) * (TAMBUR.y2 - TAMBUR.y1 - 120) / 1e6).toFixed(2)} m²</td></tr>
      <tr><td>Zal (tashqi o'lcham)</td><td class="r">${m2(BINO1.L, BINO1.B)}</td><td></td></tr></table>
    <div class="izoh"><h2>Izoh</h2><ul>
      <li>Devorlar va ustunlar — qora (mavjud); eshiklar — ikki tavaqali, tashqariga ochiladi.</li>
      <li>Zina mavjud: pastki marsh (to'liq chiziq) sharqqa ko'tariladi, yuqori marsh (punktir) — tepada, g'arbga; ostida bosh balandligi 2 m dan kam (shtrix).</li>
      <li>Turniket chizig'i zal bo'ylab: o'ngda kirish, chapda chiqish (turniketlar mavjud), chetda evakuatsiya darvozasi 900 — chiqishga ochiladi; qolgani past to'siq (qora).</li>
      <li>Resepshn stoykasi (1.8 m) va past to'siq panellari — o'ng devor bo'ylab, L shaklida; xodim eshigi zina tomondan.</li>
      <li>O'lchamlar chizma fotosi va videodan — joyida o'lchanadi. Balandlik ${BINO1.H / 1000} m.</li></ul></div>`);
}
export function rangsiz3Html() {
  const X = kod => XONA3.find(x => x.kod === kod);
  const qator = (kod, nom, olch = true) => { const x = X(kod); return `<tr><td>${nom}</td><td class="r">${olch ? m2(x.x2 - x.x1, x.y2 - x.y1) : 'L shakli'}</td><td class="r">${x.A.toFixed(2)} m²</td></tr>`; };
  return sahifa(rangsiz3Svg(), `${sarlavha('3-qavat', "5-xona — o'quv xonasi, 2-xona — erkaklar hojatxonasi; 1, 3, 4 o'zgarmaydi")}
    <table><tr><th>Xona</th><th class="r">Ichki o'lcham</th><th class="r">Maydon</th></tr>
      ${qator('1', '1 · Koridor', false)}${qator('2', '2 · Erkaklar hojatxonasi')}${qator('3', '3 · Qozonxona')}${qator('4', '4 · Yopiq xona (bino egasiniki)')}${qator('5', "5 · O'quv xonasi")}
      <tr class="j"><td>Foydali maydon (hujjat)</td><td></td><td class="r">${BINO3.foydali} m²</td></tr></table>
    <div class="izoh"><h2>Izoh</h2><ul>
      <li>Devorlar — qora; 3 va 4-xona o'zgarmaydi (xira shtrix).</li>
      <li>2-xona: ${KABINA.soni} ta kabina (${KABINA.en / 1000} × ${KABINA.chuq / 1000} m, eshigi ${KABINA.eshik}), 1-sida unitaz, qolganlarida chashagen, har birida mustahab; kirganda chapda 2 ta rakovina; janubiy devor bo'ylab taxorat joyi (3 jo'mrak), eshik yonida trap.</li>
      <li>5-xona: doska shimoliy devorda (oq to'rtburchak) — eshikdan kirganda chapda; derazalar o'ng tomonda.</li>
      <li>Derazalar joyi taxminiy; o'lchamlar chizma fotosidan — joyida o'lchanadi.</li></ul></div>`);
}
