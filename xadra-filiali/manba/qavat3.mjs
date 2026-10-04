// 3-qavat (yuqori qavat): 5-xona — o'quv xonasi (24 o'rin), 2-xona — erkaklar hojatxonasi.
// Qolganlari o'zgarmaydi: 1 — koridor, 3 — qozonxona, 4 — yopiq xona (bino egasiniki).
// Koordinata — binoning tashqi yuqori-chap burchagidan, mm; bino 11 850 × 12 300 (3-qavat chizmasi).
// O'lchamlar chizma fotosidan olingan — joyida o'lchanadi.
import { LOYIHA, PARTA, STUL } from './model.mjs';
import { defs } from './render-svg.mjs';
import { eshikSektori } from './tekshiruv.mjs';

export const BINO3 = { L: 11850, B: 12300, umumiy: 118, foydali: 110.82 };
const r = (x1, x2, y1, y2, q = {}) => ({ x1, x2, y1, y2, ...q });

// ---------- devorlar ----------
export const DEVOR3 = [
  // tashqi devorlar
  r(0, 11850, 0, 300, { tashqi: true }), r(0, 11850, 12000, 12300, { tashqi: true }),
  r(0, 300, 0, 12300, { tashqi: true }), r(11550, 11850, 0, 12300, { tashqi: true }),
  // zinapoya qutisi (eshik koridorga)
  r(2900, 3000, 300, 500), r(2900, 3000, 1400, 6050),
  // qozonxona (3) va yopiq xona (4)
  r(300, 3500, 6050, 6150), r(4300, 4400, 6050, 9050),
  r(300, 4600, 9050, 9250), r(5400, 5750, 9050, 9250),
  // koridor bilan o'ng qator (2 va 5-xona) orasidagi devor — eshiklar bilan
  r(5750, 6100, 300, 1450), r(5750, 6100, 2350, 4400), r(5750, 6100, 5300, 12000),
  // hojatxona va o'quv xonasi orasidagi devor
  r(6100, 11550, 3150, 3400),
];
// hojatxona kabinalari: 4 ta, har biri 1.00 × 1.10 m; yupqa to'siqlar (40 mm), eshigi 650 mm
export const KABINA = { x0: 7550, en: 1000, chuq: 1100, soni: 4, eshik: 650 };
const kabinaXi = i => KABINA.x0 + i * KABINA.en;
export const KABINA_DEVOR = [
  ...Array.from({ length: KABINA.soni }, (_, i) => r(kabinaXi(i) - 20, kabinaXi(i) + 20, 300, 300 + KABINA.chuq)),
  ...Array.from({ length: KABINA.soni }, (_, i) => {
    const x0 = kabinaXi(i), yon = (KABINA.en - KABINA.eshik) / 2;
    return [r(x0, x0 + yon, 1360, 1400), r(x0 + KABINA.en - yon, x0 + KABINA.en, 1360, 1400)];
  }).flat(),
];

// ---------- derazalar (joyi taxminiy) ----------
export const DERAZA3 = [[900, 2600], [4600, 6200], [7200, 8800], [9800, 11400]].map(([a, b]) => r(11550, 11850, a, b));

// ---------- eshiklar ----------
const e = (kod, devor, a, b, yuz, yon, ilgak, q = {}) => ({ kod, devor, a, b, yuz, yon, ilgak, en: b - a, ...q });
export const ESHIK3 = [
  e('Z', 'v', 500, 1400, 3000, +1, 'a'),          // zinapoyadan koridorga
  e('3', 'h', 3500, 4300, 6050, -1, 'b'),
  e('4', 'h', 4600, 5400, 9050, -1, 'b'),
  e('2', 'v', 1450, 2350, 5750, -1, 'a', { shisha: false }),   // hojatxona eshigi koridorga ochiladi
  e('5', 'v', 4400, 5300, 6100, +1, 'a', { shisha: true }),    // o'quv xonasi: kirganda chapda doska va ustoz joyi
  ...Array.from({ length: KABINA.soni }, (_, i) => {
    const x0 = kabinaXi(i), yon = (KABINA.en - KABINA.eshik) / 2;
    return e(`K${i + 1}`, 'h', x0 + yon, x0 + KABINA.en - yon, 1400, +1, 'a', { kabina: true });
  }),
];

// ---------- xonalar ----------
export const XONA3 = [
  { kod: '1', nomi: 'Koridor', A: 17.35, tur: 'koridor', bolaklar: [r(3000, 5750, 300, 6050), r(4400, 5750, 6050, 9050)] },
  { kod: '2', nomi: 'Erkaklar hojatxonasi', A: 15.53, tur: 'wc', ...r(6100, 11550, 300, 3150) },
  { kod: '3', nomi: 'Qozonxona', A: 15.81, tur: 'yopiq', ...r(300, 4300, 6150, 9050) },
  { kod: '4', nomi: 'Yopiq xona (bino egasiniki)', A: 15.26, tur: 'yopiq', ...r(300, 5750, 9250, 12000) },
  { kod: '5', nomi: "O'quv xonasi", A: 46.87, tur: 'sinf', ...r(6100, 11550, 3400, 12000) },
  { kod: 'Z', nomi: 'Zinapoya', tur: 'zina', ...r(300, 2900, 300, 6050) },
];

// ---------- 5-xona: 24 o'rin ----------
// Doska shimoliy (2-xona tomondagi) 5.45 m lik devorda — eshikdan kirganda chapda; derazalar o'ng tomonda.
// Qatorda 3 ta ikki kishilik parta (140 × 60), oralarida 50 sm yo'lak; 4 qator, qadam 1.40 m (stul orqasidan 36 sm).
export const SINF3 = { x1: 6100, y1: 3400, W: 5450, D: 8600, u0: 100, yolak: 500, doska: 2440, qadam: 1400, qatorlar: 4, qatorda: 3, doskaEni: 3000 };
export function sinf3() {
  const s = SINF3, R = (u1, u2, v1, v2) => r(s.x1 + u1, s.x1 + u2, s.y1 + v1, s.y1 + v2);
  const orinEni = PARTA.eni / PARTA.kishi;
  const partalar = [], stullar = [];
  for (let q = 0; q < s.qatorlar; q++) {
    const v = s.doska + q * s.qadam;
    for (let i = 0; i < s.qatorda; i++) {
      const u = s.u0 + i * (PARTA.eni + s.yolak);
      partalar.push({ ...R(u, u + PARTA.eni, v, v + PARTA.chuq), qator: q + 1 });
      for (let k = 0; k < PARTA.kishi; k++) {
        const su = u + k * orinEni + (orinEni - STUL.eni) / 2, sv = v + PARTA.chuq + STUL.oraliq;
        stullar.push({ ...R(su, su + STUL.eni, sv, sv + STUL.chuq), qator: q + 1 });
      }
    }
  }
  const dc = s.W / 2;
  return {
    partalar, stullar,
    doska: R(dc - s.doskaEni / 2, dc + s.doskaEni / 2, 0, 60),
    ustozStoli: R(s.W - 150 - 1200, s.W - 150, 700, 1300),     // deraza tomonda, eshikdan uzoqda
    ustozStuli: R(s.W - 150 - 825, s.W - 150 - 375, 220, 670),
  };
}
export function sinf3Korsatkich() {
  const s = SINF3, j = sinf3();
  const blokEni = s.qatorda * PARTA.eni + (s.qatorda - 1) * s.yolak;
  const oxirgi = s.doska + (s.qatorlar - 1) * s.qadam + PARTA.chuq;
  const chetki = s.W / 2 - (s.u0 + PARTA.eni / PARTA.kishi / 2);
  return {
    orin: j.stullar.length, parta: j.partalar.length, oxirgi, orqaDevorgacha: s.D - oxirgi,
    stulOrqasi: s.qadam - PARTA.chuq - STUL.oraliq - STUL.chuq, orqaZona: s.D - oxirgi - STUL.oraliq - STUL.chuq,
    yonKoridor: s.u0, yonDeraza: s.W - s.u0 - blokEni,
    burchak: Math.atan(chetki / (s.doska + 350)) * 180 / Math.PI,
  };
}

// ---------- 2-xona: erkaklar hojatxonasi ----------
// Kirganda chapda 2 ta rakovina, shimoliy devor bo'ylab 4 ta kabina (1-sida unitaz, 2–4-da chashagen,
// har birida mustahab), janubiy devor bo'ylab taxorat joyi (3 ta jo'mrak), eshik yonida trap.
export const WC3 = {
  rakovina: [[6550, 500], [7150, 500]],
  unitaz: [[kabinaXi(0) + 500, 590]],
  chashagen: [1, 2, 3].map(i => [kabinaXi(i) + 500, 650]),
  mustahab: [0, 1, 2, 3].map(i => [kabinaXi(i) + KABINA.en - 100, 1000]),
  taxorat: r(7900, 11100, 2750, 3150),
  taxoratJomrak: [8433, 9500, 10567].map(x => [x, 3110]),
  trap: [6500, 2750],
};

// ---------- tekshiruv: jihozlar xonada, o'zaro va eshik ochilishi bilan to'qnashmaydi ----------
const kesishadi = (a, b) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
export function tekshiruv3() {
  const j = sinf3(), sinf = XONA3.find(x => x.kod === '5'), xato = [];
  const jihoz = [...j.partalar, ...j.stullar, j.ustozStoli, j.ustozStuli];
  jihoz.forEach((a, i) => {
    if (a.x1 < sinf.x1 || a.x2 > sinf.x2 || a.y1 < sinf.y1 || a.y2 > sinf.y2) xato.push(`5-xona: jihoz ${i + 1} xonadan chiqib ketgan`);
    jihoz.slice(i + 1).forEach((b, k) => kesishadi(a, b) && xato.push(`5-xona: jihoz ${i + 1} ↔ ${i + k + 2}`));
    ESHIK3.forEach(e => kesishadi(a, eshikSektori(e).quti) && xato.push(`5-xona: jihoz ${i + 1} ↔ ${e.kod} eshigi`));
  });
  const wc = [...WC3.rakovina.map(([x, y]) => r(x - 260, x + 260, y - 200, y + 200)), r(...[WC3.taxorat.x1, WC3.taxorat.x2, WC3.taxorat.y1, WC3.taxorat.y2])];
  ESHIK3.forEach(e => wc.forEach((a, i) => kesishadi(a, eshikSektori(e).quti) && xato.push(`hojatxona: jihoz ${i + 1} ↔ ${e.kod} eshigi`)));
  return { orin: j.stullar.length, xato };
}

// ---------- chizma (SVG) ----------
let N = 0;
const f = v => Math.round(v * 10) / 10;
const QOSHIMCHA_DEFS = id => `<defs>
  <g id="${id}chashagen"><rect x="-225" y="-300" width="450" height="600" rx="70" fill="#fff" stroke="#9aa3ad" stroke-width="10"/>
    <path d="M-105,-170 L105,-170 L125,90 A125,125 0 0 1 -125,90 Z" fill="#eef2f5" stroke="#b9c1ca" stroke-width="8"/>
    <rect x="-185" y="150" width="120" height="120" rx="25" fill="#e3e8ec"/><rect x="65" y="150" width="120" height="120" rx="25" fill="#e3e8ec"/>
    <circle cx="0" cy="-230" r="28" fill="#9aa3ad"/></g>
  <g id="${id}mustahab"><circle r="60" fill="#dfeaf4" stroke="#5f93ba" stroke-width="12"/><line x1="0" y1="-60" x2="0" y2="-150" stroke="#5f93ba" stroke-width="16"/></g>
  <g id="${id}jomrak"><rect x="-70" y="-35" width="140" height="70" rx="15" fill="#c9d3dc" stroke="#7d8a96" stroke-width="8"/><circle cy="-60" r="30" fill="#7d8a96"/></g>
  <pattern id="${id}shtrix" width="300" height="300" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="300" height="300" fill="#e2dfd9"/><line x1="0" y1="0" x2="0" y2="300" stroke="#c4bfb6" stroke-width="40"/></pattern>
</defs>`;

function chiz(id, o = {}) {
  const q = [defs(id), QOSHIMCHA_DEFS(id)];
  const rect = (b, a) => `<rect x="${f(b.x1)}" y="${f(b.y1)}" width="${f(b.x2 - b.x1)}" height="${f(b.y2 - b.y1)}" ${a}/>`;
  const use = (s, x, y, rot = 0) => `<use href="#${id}${s}" transform="translate(${f(x)},${f(y)})${rot ? ` rotate(${rot})` : ''}"/>`;
  const markaz = b => [(b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2];

  // pollar
  q.push(rect({ x1: 0, y1: 0, x2: BINO3.L, y2: BINO3.B }, 'fill="#d8d5cf"'));
  XONA3.forEach(x => {
    const bl = x.bolaklar || [x];
    const fill = { koridor: `url(#${id}plitka)`, wc: `url(#${id}wc)`, sinf: `url(#${id}parket)`, yopiq: `url(#${id}shtrix)`, zina: '#d8d5cf' }[x.tur];
    bl.forEach(b => q.push(rect(b, `fill="${fill}"`)));
  });
  // zinapoya: U shaklida, ikki marsh va yuqorida maydoncha
  [r(400, 1550, 1400, 4450), r(1650, 2800, 1400, 4450)].forEach(m => {
    q.push(rect(m, 'fill="#e4e1db" stroke="#8f8b84" stroke-width="10"'));
    for (let y = m.y1 + 280; y < m.y2; y += 280) q.push(`<line x1="${m.x1}" y1="${y}" x2="${m.x2}" y2="${y}" stroke="#9c978f" stroke-width="12"/>`);
  });
  q.push(`<path d="M400,1400 A1200,1100 0 0 1 2800,1400" fill="none" stroke="#8f8b84" stroke-width="10"/>`);
  q.push(`<line x1="2200" y1="1700" x2="2200" y2="4100" stroke="#333" stroke-width="22"/><path d="M2090,3950 L2200,4150 L2310,3950" fill="none" stroke="#333" stroke-width="22"/>`);

  // jihozlar (soya bilan)
  const j = [];
  const s = sinf3();
  s.partalar.forEach(p => j.push(use('parta', ...markaz(p), 0)));
  s.stullar.forEach(p => j.push(use('stul', ...markaz(p), 0)));
  j.push(use('ustozStol', ...markaz(s.ustozStoli), 180), use('ofisStul', ...markaz(s.ustozStuli), 180));
  WC3.rakovina.forEach(([x, y]) => j.push(use('rakovina', x, y)));
  WC3.unitaz.forEach(([x, y]) => j.push(use('unitaz', x, y)));
  WC3.chashagen.forEach(([x, y]) => j.push(use('chashagen', x, y)));
  q.push(`<g filter="url(#${id}soya)">${j.join('')}</g>`);
  // taxorat joyi, jo'mraklar, mustahab, trap
  q.push(rect(WC3.taxorat, 'rx="40" fill="#f4f7f9" stroke="#9aa3ad" stroke-width="12"'));
  q.push(`<line x1="${WC3.taxorat.x1 + 80}" y1="${WC3.taxorat.y1 + 170}" x2="${WC3.taxorat.x2 - 80}" y2="${WC3.taxorat.y1 + 170}" stroke="#b9c1ca" stroke-width="10" stroke-dasharray="60 40"/>`);
  WC3.taxoratJomrak.forEach(([x, y]) => q.push(use('jomrak', x, y)));
  WC3.mustahab.forEach(([x, y]) => q.push(use('mustahab', x, y, 90)));
  const [tx, ty] = WC3.trap;
  q.push(`<path d="M${tx},${ty - 110} L${tx + 110},${ty} L${tx},${ty + 110} L${tx - 110},${ty} Z" fill="#c9d3dc" stroke="#555" stroke-width="12"/>`);
  // doska
  q.push(rect({ ...s.doska, y2: s.doska.y1 + 90 }, 'fill="#fdfdfd" stroke="#8d949c" stroke-width="12"'));

  // eshiklar
  ESHIK3.forEach(e => {
    const sk = eshikSektori(e);
    let leaf, arcEnd, sweep;
    if (e.devor === 'h') {
      leaf = { x: sk.ilgak.x, y: e.yuz + e.yon * e.en };
      arcEnd = { x: e.ilgak === 'a' ? e.b : e.a, y: e.yuz };
      sweep = (e.ilgak === 'a') === (e.yon > 0) ? 0 : 1;
      q.push(rect({ x1: sk.ilgak.x - 15, x2: sk.ilgak.x + 15, y1: Math.min(e.yuz, leaf.y), y2: Math.max(e.yuz, leaf.y) }, e.kabina ? 'fill="#8b939c"' : 'fill="#a8804f"'));
    } else {
      leaf = { x: e.yuz + e.yon * e.en, y: sk.ilgak.y };
      arcEnd = { x: e.yuz, y: e.ilgak === 'a' ? e.b : e.a };
      sweep = (e.ilgak === 'a') === (e.yon > 0) ? 1 : 0;
      q.push(rect({ y1: sk.ilgak.y - 20, y2: sk.ilgak.y + 20, x1: Math.min(e.yuz, leaf.x), x2: Math.max(e.yuz, leaf.x) }, e.shisha ? 'fill="#9cc9e6" stroke="#5f93ba" stroke-width="8"' : 'fill="#a8804f"'));
    }
    q.push(`<path d="M${f(leaf.x)},${f(leaf.y)} A${e.en},${e.en} 0 0 ${sweep} ${f(arcEnd.x)},${f(arcEnd.y)}" fill="none" stroke="#6f6a63" stroke-width="${e.kabina ? 7 : 9}"/>`);
  });

  // devorlar va derazalar
  q.push(`<g filter="url(#${id}dsoya)">${DEVOR3.map(d => rect(d, `fill="${d.tashqi ? '#2b2d31' : '#34373c'}"`)).join('')}</g>`);
  KABINA_DEVOR.forEach(d => q.push(rect(d, 'fill="#8b939c"')));
  DERAZA3.forEach(d => {
    q.push(rect(d, 'fill="#cfe4f2" stroke="#f7fbfd" stroke-width="14"'));
    q.push(`<line x1="${(d.x1 + d.x2) / 2}" y1="${d.y1}" x2="${(d.x1 + d.x2) / 2}" y2="${d.y2}" stroke="#fff" stroke-width="18"/>`);
  });
  return q;
}

const SHRIFT = `font-family="Liberation Sans, Arial, sans-serif" paint-order="stroke" stroke="#fbf6ee" stroke-opacity=".85" stroke-linejoin="round"`;

// Butun qavat rejasi (taqdimot uslubida)
export function q3Svg(o = {}) {
  const id = `q${++N}`;
  const vb = o.vb || { x1: -800, y1: -1200, x2: 13050, y2: 12400 };
  const q = chiz(id, o);
  const t = (x, y, s, size, a = '') => `<text x="${f(x)}" y="${f(y)}" font-size="${size}" stroke-width="${size * 0.28}" text-anchor="middle" ${a}>${s}</text>`;
  const B = 'font-weight="700" fill="#262626"', R = 'fill="#262626"', G = 'fill="#5a5a5a"';
  const k = sinf3Korsatkich();
  const L = [
    t(1600, 5300, 'Zinapoya', 300, B), t(1600, 5650, '(2-qavatdan)', 230, G),
    t(4350, 2900, '1 · Koridor', 320, B), t(4350, 3250, '17.35 m²', 260, R),
    t(9300, 2250, '2 · Erkaklar hojatxonasi', 300, B), t(9300, 2580, '15.53 m² · 4 kabina', 220, R),
    t(2300, 7450, '3 · Qozonxona', 300, B), t(2300, 7800, '15.81 m² · ishlatilmaydi', 220, G),
    t(3000, 10500, '4 · Yopiq xona', 300, B), t(3000, 10850, '15.26 m² · bino egasiniki', 220, G),
    t(8600, 4550, "5 · O'quv xonasi", 340, B), t(8600, 4920, `46.87 m² · ${k.orin} o'rin`, 280, R),
  ];
  // o'lcham zanjirlari
  const d = [];
  const zX = (y, n, ust = true, katta = false) => {
    d.push(`<line x1="${n[0]}" y1="${y}" x2="${n.at(-1)}" y2="${y}" stroke="#777" stroke-width="10"/>`);
    n.forEach(x => d.push(`<line x1="${x - 70}" y1="${y + 70}" x2="${x + 70}" y2="${y - 70}" stroke="#555" stroke-width="18"/>`));
    for (let i = 1; i < n.length; i++) if (n[i] - n[i - 1] >= 900)
      d.push(`<text x="${(n[i] + n[i - 1]) / 2}" y="${ust ? y - 90 : y + 260}" font-size="${katta ? 300 : 230}" text-anchor="middle" fill="#444" font-family="Liberation Sans, Arial">${((n[i] - n[i - 1]) / 1000).toFixed(2)}</text>`);
  };
  const zY = (x, n, chap = true, katta = false) => {
    d.push(`<line x1="${x}" y1="${n[0]}" x2="${x}" y2="${n.at(-1)}" stroke="#777" stroke-width="10"/>`);
    n.forEach(y => d.push(`<line x1="${x - 70}" y1="${y + 70}" x2="${x + 70}" y2="${y - 70}" stroke="#555" stroke-width="18"/>`));
    for (let i = 1; i < n.length; i++) if (n[i] - n[i - 1] >= 900) {
      const m = (n[i] + n[i - 1]) / 2, tx = chap ? x - 90 : x + 90;
      d.push(`<text x="${tx}" y="${m}" font-size="${katta ? 300 : 230}" text-anchor="middle" fill="#444" font-family="Liberation Sans, Arial" transform="rotate(${chap ? -90 : 90} ${tx} ${m})">${((n[i] - n[i - 1]) / 1000).toFixed(2)}</text>`);
    }
  };
  if (o.olcham !== false) {
    zX(-850, [0, BINO3.L], true, true);
    zX(-400, [300, 2900, 3000, 5750, 6100, 11550]);
    zY(-450, [0, 6150, BINO3.B]);
    zY(12300, [300, 3150, 3400, 12000], false);
    zY(12650, [0, BINO3.B], false, true);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x1} ${vb.y1} ${vb.x2 - vb.x1} ${vb.y2 - vb.y1}" width="${(vb.x2 - vb.x1) / 50}mm" height="${(vb.y2 - vb.y1) / 50}mm">${q.join('')}<g ${SHRIFT}>${L.join('')}</g>${d.join('')}</svg>`;
}

// Hojatxona (2-xona) kattaroq masshtabda, buyurtmachi chizgan ko'rinishda: eshik tepada, deraza pastda.
// Reja 90° buriladi: (x, y) → (−y, x).
export function wcDetalSvg(mashtab = 50) {
  const id = `q${++N}`;
  const P = (x, y) => [-y, x];
  const vb = { x1: -3430, y1: 5050, x2: 800, y2: 11950 };
  const q = chiz(id);
  // yozuv burilgan rejada: tik (−90°) yozuv tor joylarga (kabina, taxorat joyi) sig'adi
  const t = (x, y, s, size, a = '', tik = false) => {
    const [X, Y] = P(x, y);
    return `<text x="${f(X)}" y="${f(Y)}" font-size="${size}" stroke-width="${size * 0.28}" text-anchor="middle" ${a}${tik ? ` transform="rotate(-90 ${f(X)} ${f(Y)})"` : ''}>${s}</text>`;
  };
  const B = 'font-weight="700" fill="#262626"', R = 'fill="#262626"';
  const L = [
    t(6830, 1300, 'Rakovina × 2', 170, B),
    t(kabinaXi(0) + 450, 1230, 'unitaz', 140, R, true),
    ...[1, 2, 3].map(i => t(kabinaXi(i) + 450, 1230, 'chashagen', 140, R, true)),
    t(9500, 2620, "Taxorat joyi — 3 jo'mrak", 170, B, true),
    t(6650, 2450, 'trap', 150, R),
  ];
  const d = [];
  const chiziq = (a, b) => d.push(`<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="#777" stroke-width="8"/>`);
  const belgi = p => d.push(`<line x1="${f(p[0] - 55)}" y1="${f(p[1] + 55)}" x2="${f(p[0] + 55)}" y2="${f(p[1] - 55)}" stroke="#555" stroke-width="14"/>`);
  // shimoliy devor bo'ylab (burilgan rejada o'ngda, vertikal): rakovina zonasi va 4 ta kabina
  const nx = [6100, 7550, 8550, 9550, 10550, 11550];
  chiziq(P(nx[0], -450), P(nx.at(-1), -450)); nx.forEach(x => belgi(P(x, -450)));
  for (let i = 1; i < nx.length; i++) {
    const [X, Y] = P((nx[i] + nx[i - 1]) / 2, -450);
    d.push(`<text x="${f(X + 80)}" y="${f(Y)}" font-size="170" text-anchor="middle" fill="#444" font-family="Liberation Sans, Arial" transform="rotate(90 ${f(X + 80)} ${f(Y)})">${((nx[i] - nx[i - 1]) / 1000).toFixed(2)}</text>`);
  }
  // g'arbiy devor bo'ylab (tepada, gorizontal): kabina chuqurligi, o'tish, taxorat joyi
  const ny = [300, 1400, 2750, 3150];
  chiziq(P(5450, ny[0]), P(5450, ny.at(-1))); ny.forEach(y => belgi(P(5450, y)));
  for (let i = 1; i < ny.length; i++) {
    const [X, Y] = P(5450, (ny[i] + ny[i - 1]) / 2);
    d.push(`<text x="${f(X)}" y="${f(Y - 80)}" font-size="170" text-anchor="middle" fill="#444" font-family="Liberation Sans, Arial">${((ny[i] - ny[i - 1]) / 1000).toFixed(2)}</text>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x1} ${vb.y1} ${vb.x2 - vb.x1} ${vb.y2 - vb.y1}" width="${(vb.x2 - vb.x1) / mashtab}mm" height="${(vb.y2 - vb.y1) / mashtab}mm">
    <g transform="rotate(90)">${q.join('')}</g><g ${SHRIFT}>${L.join('')}</g>${d.join('')}</svg>`;
}

// ---------- A3 (landshaft) varaq ----------
const CSS = `
@page { size: 420mm 297mm; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
body { font-family: 'Liberation Sans', Arial, sans-serif; color: #222; }
.varaq { width: 420mm; height: 297mm; padding: 6mm 7mm; background: #fff; overflow: hidden; }
header { display: flex; justify-content: space-between; align-items: flex-end; height: 11mm; }
header .brend { font-size: 8pt; color: #6b6b6b; font-weight: 700; }
header h1 { font-size: 15pt; color: #1f1f1f; }
header .ong { text-align: right; font-size: 7.2pt; color: #555; display: flex; flex-direction: column; align-items: flex-end; gap: 1mm; }
.bar { display: flex; width: 100mm; height: 1.5mm; border: .2mm solid #222; }
.bar i { flex: 1 } .bar i:nth-child(odd) { background: #222 }
.son { display: flex; justify-content: space-between; width: 102mm; font-size: 5.8pt; }
.asosiy { display: grid; grid-template-columns: 278mm 1fr; gap: 4mm; margin-top: 1mm; }
.ong-ust h2 { font-size: 10pt; color: #1f1f1f; margin: 1mm 0 1mm; }
.detal { display: grid; grid-template-columns: auto 1fr; gap: 2mm; align-items: start; }
.detal svg { display: block; border: .3mm solid #cfcac2; }
.belgi { font-size: 6.8pt; color: #333; line-height: 1.45; }
.belgi b { display: block; margin-top: 1.5mm; }
table { width: 100%; border-collapse: collapse; font-size: 7pt; margin-top: 1mm; }
td, th { padding: .55mm .8mm; border-bottom: .2mm solid #ddd; text-align: left; }
th { background: #f1f0ed; }
td.r { text-align: right; white-space: nowrap; }
.izoh { font-size: 6.3pt; color: #666; margin-top: 1.5mm; line-height: 1.35; }
`;

export function qavat3Html() {
  const k = sinf3Korsatkich();
  const m = v => (v / 1000).toFixed(2);
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — 3-qavat rejasi</title><style>${CSS}</style></head><body>
  <section class="varaq">
    <header>
      <div><div class="brend">${LOYIHA.brend} · ${LOYIHA.filial}</div><h1>3-qavat rejasi — o'quv xonasi (${k.orin} o'rin) va erkaklar hojatxonasi</h1></div>
      <div class="ong"><div>Masshtab 1:50 (A3) · ${LOYIHA.versiya} · ${LOYIHA.sana}</div><div class="bar"><i></i><i></i><i></i><i></i><i></i></div><div class="son"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5 m (1:50)</span></div></div>
    </header>
    <div class="asosiy">
      <div>${q3Svg()}</div>
      <div class="ong-ust">
        <h2>2-xona — erkaklar hojatxonasi (buyurtmachi chizgan ko'rinishda)</h2>
        <div class="detal">${wcDetalSvg()}
          <div class="belgi">Reja 90° burilgan: eshik tepada (koridordan), deraza pastda.
            <b>Kirganda chapda</b>2 ta rakovina (jo'mrak bilan)
            <b>Kabinalar</b>4 ta, har biri 1.00 × 1.10 m: 1 ta unitazli, 3 ta chashagenli; har birida mustahab; eshiklari 65 sm, tashqariga ochiladi
            <b>Taxorat joyi</b>janubiy devor bo'ylab 3.2 m, 3 ta jo'mrak
            <b>Pol</b>eshik yonida trap (pol suvi uchun)
            <b>Kafel</b>devor 58 m², pol 16 m²</div>
        </div>
        <table><tr><th>Xona</th><th>Vazifasi</th><th class="r">m²</th></tr>
          <tr><td>1</td><td>Koridor (zinapoyadan)</td><td class="r">17.35</td></tr>
          <tr><td>2</td><td>Erkaklar hojatxonasi</td><td class="r">15.53</td></tr>
          <tr><td>3</td><td>Qozonxona — ishlatilmaydi</td><td class="r">15.81</td></tr>
          <tr><td>4</td><td>Yopiq xona — bino egasiniki</td><td class="r">15.26</td></tr>
          <tr><td>5</td><td>O'quv xonasi, ${k.orin} o'rin</td><td class="r">46.87</td></tr>
          <tr><th colspan="2">Umumiy / foydali maydon</th><th class="r">${BINO3.umumiy} / ${BINO3.foydali}</th></tr></table>
        <table><tr><th colspan="2">5-xona: o'quv xonasi</th></tr>
          <tr><td>Partalar</td><td class="r">${k.parta} ta ikki kishilik, ${PARTA.eni / 10} × ${PARTA.chuq / 10} sm — 4 qator × 3</td></tr>
          <tr><td>Doska</td><td class="r">interaktiv, shimoliy devorda (kirganda chapda)</td></tr>
          <tr><td>Doska → 1-parta / qator qadami</td><td class="r">${m(SINF3.doska)} m / ${m(SINF3.qadam)} m</td></tr>
          <tr><td>Yo'lak / devorgacha</td><td class="r">${SINF3.yolak / 10} sm / ${k.yonKoridor / 10}–${k.yonDeraza / 10} sm</td></tr>
          <tr><td>Oxirgi parta (doskadan) / orqa devorgacha</td><td class="r">${m(k.oxirgi)} m / ${m(k.orqaDevorgacha)} m</td></tr>
          <tr><td>Chetki o'rindan qarash burchagi</td><td class="r">${k.burchak.toFixed(1)}° (Beruniy — 39.8°)</td></tr>
          <tr><td>Bambuk panel</td><td class="r">3 devor, 2.5 m balandlikda</td></tr></table>
        <p class="izoh">O'lchamlar 3-qavat chizmasi fotosidan olingan (11.85 × 12.30 m); derazalar joyi taxminiy — joyida o'lchanadi. 2-qavatdagi WC — ayollar hojatxonasi (2 unitaz, 1 chashagen). Hojatxona ventilyatsiyasi (chiqarish) va suv/kanalizatsiya yo'li santexnik bilan aniqlanadi.</p>
      </div>
    </div>
  </section></body></html>`;
}
