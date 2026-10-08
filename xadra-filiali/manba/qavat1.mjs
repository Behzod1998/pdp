// 1-qavat: kirish zali — resepshn, turniket (buyurtmachida mavjud) va logotiplar.
// Koordinata — zalning tashqi yuqori-chap burchagidan, mm; x — o'ngga, y — pastga (kirish pastda, ko'chadan).
// O'lchamlar buyurtmachi yuborgan chizma fotosidan: zal 6.50 × 6.30 (ichi 6.00 × 6.00, 36.50 m²), tambur 4.25 m.
// Devor qalinligi, ustunlar va zina chegarasi fotodan taxminiy — joyida o'lchanadi.
import { LOYIHA } from './model.mjs';
import { defs } from './render-svg.mjs';
import { eshikSektori } from './tekshiruv.mjs';

export const BINO1 = { L: 6500, B: 6300, ichki: { x1: 250, x2: 6250, y1: 100, y2: 6100 }, maydon: 36.5, H: 3500 };
const r = (x1, x2, y1, y2, q = {}) => ({ x1, x2, y1, y2, ...q });

// ---------- devorlar ----------
export const TAMBUR = r(1480, 5730, 6300, 7750);           // kirish tamburi (chizmada shtrixlangan), 4.25 m
export const DEVOR1 = [
  r(0, 250, 0, 6300, { tashqi: true }), r(6250, 6500, 0, 6300, { tashqi: true }),
  r(0, 6500, 0, 100, { tashqi: true }),                       // yuqori chegara (ustunlar orasida)
  r(0, 3350, 6100, 6300, { tashqi: true }), r(4850, 6500, 6100, 6300, { tashqi: true }),
  // tambur devorlari
  r(1480, 1600, 6300, 7750, { tambur: true }), r(5610, 5730, 6300, 7750, { tambur: true }),
  r(1480, 2880, 7630, 7750, { tambur: true }), r(4290, 5730, 7630, 7750, { tambur: true }),
];
export const USTUN1 = [r(250, 600, 100, 450), r(5900, 6250, 100, 450), r(250, 600, 5750, 6100), r(5900, 6250, 5750, 6100)];

// ---------- eshiklar (ikki tavaqali, evakuatsiya yo'nalishida — tashqariga ochiladi) ----------
const e = (kod, a, b, yuz, yon, ilgak) => ({ kod, devor: 'h', a, b, yuz, yon, ilgak, en: b - a });
export const ESHIK1 = [
  e('ichki-a', 3350, 4100, 6300, +1, 'a'), e('ichki-b', 4100, 4850, 6300, +1, 'b'),
  e('tashqi-a', 2880, 3585, 7750, +1, 'a'), e('tashqi-b', 3585, 4290, 7750, +1, 'b'),
];

// ---------- zina (2-qavatga) ----------
// Chap qismda zina boshi (shimolga ko'tariladi), burchakda maydoncha, keyin yuqori devor bo'ylab sharqqa marsh.
export const ZINA1 = {
  zona: r(250, 4010, 100, 2100),
  marshlar: [r(380, 1890, 1480, 2100, { yo: 'y', qadam: 310 }), r(1890, 4010, 100, 1480, { yo: 'x', qadam: 265 })],
  maydoncha: r(380, 1890, 100, 1480),
  boshi: { x: 1135, y: 2100 },
};

// ---------- resepshn, turniket, logotiplar ----------
// Turniket chizig'i y = 2700 da: kirish zonasi (janub) va zina zonasi (shimol) ajraladi; resepshn chiziqning o'ng qismida —
// xodim har bir o'tganni ko'radi. Evakuatsiya uchun turniket yonida 900 mm lik darvoza (antipanika).
export const RESEPSHN = {
  stol: r(4050, 6250, 2000, 2700),      // stoyka: old tomoni janubga (kirishga), ustida 1.10 m lik peshtaxta
  peshtaxta: r(4050, 6250, 2550, 2750),
  kreslo: r(4900, 5350, 1300, 1750),
  logoDevor: { x1: 4100, x2: 5850, y: 100, z1: 1100, z2: 2600, en: 1500, bal: 440 },   // stoyka orqasidagi devor
  logoStol: { x1: 4500, x2: 5800, y: 2750, z: 700, en: 1000, bal: 125 },              // stoykaning old paneli
};
export const TURNIKET = {
  chiziq: 2700,
  tosiq: [r(250, 1300, 2670, 2730), r(2200, 2300, 2670, 2730), r(3200, 4050, 2670, 2730)],   // to'siq (ograda)
  darvoza: r(1300, 2200, 2670, 2730, { ochiladi: 'janub' }),                                // evakuatsiya darvozasi 900, chiqishga ochiladi
  korpus: r(2900, 3200, 2400, 3000),                                                         // tripod turniket korpusi
  otish: r(2300, 2900, 2400, 3000),                                                          // o'tish yo'lagi 600
};
export const MEHMON = {
  divan: r(250, 1050, 3600, 5500),
  stolcha: r(1350, 1950, 4250, 4850),
  osimlik: [[5850, 5400], [1700, 5650]],
};

export function tekshiruv1() {
  const xato = [];
  const kesishadi = (a, b) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
  const jihoz = [RESEPSHN.stol, RESEPSHN.kreslo, MEHMON.divan, MEHMON.stolcha, TURNIKET.korpus, ...TURNIKET.tosiq, TURNIKET.darvoza];
  jihoz.forEach((a, i) => {
    jihoz.slice(i + 1).forEach((b, k) => kesishadi(a, b) && xato.push(`jihoz ${i + 1} ↔ ${i + k + 2}`));
    USTUN1.forEach(u => kesishadi(a, u) && xato.push(`jihoz ${i + 1} ↔ ustun`));
    ESHIK1.forEach(e => kesishadi(a, eshikSektori(e).quti) && xato.push(`jihoz ${i + 1} ↔ eshik ${e.kod}`));
    if (kesishadi(a, ZINA1.zona)) xato.push(`jihoz ${i + 1} zinaga tushgan`);
  });
  const otish = TURNIKET.otish.x2 - TURNIKET.otish.x1, darvoza = TURNIKET.darvoza.x2 - TURNIKET.darvoza.x1;
  if (otish < 550) xato.push(`turniket yo'lagi tor: ${otish}`);
  if (darvoza < 900) xato.push(`evakuatsiya darvozasi tor: ${darvoza}`);
  // eshikdan turniketgacha va turniketdan zina boshigacha masofa
  const eshikdan = 6100 - TURNIKET.chiziq, zinagacha = TURNIKET.chiziq - ZINA1.boshi.y;
  return { xato, otish, darvoza, eshikdan, zinagacha };
}

// ---------- chizma (SVG) ----------
let N = 0;
const f = v => Math.round(v * 10) / 10;
const SHRIFT = `font-family="Liberation Sans, Arial, sans-serif" paint-order="stroke" stroke="#fbf6ee" stroke-opacity=".85" stroke-linejoin="round"`;
export const RANG1 = { logo: '#00B533', nuqta: '#FFCC19', tosiq: '#5f6b78', resepshn: '#2b2f36' };

const logoBelgi = (cx, cy, rr) =>
  `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="none" stroke="${RANG1.logo}" stroke-width="${f(rr * 0.42)}"/><circle cx="${f(cx + rr * 0.3)}" cy="${f(cy - rr * 0.3)}" r="${f(rr * 0.33)}" fill="${RANG1.nuqta}"/>`;

export function q1Svg(o = {}) {
  const id = `b${++N}`;
  const vb = o.vb || { x1: -1300, y1: -1300, x2: 8100, y2: 9700 };
  const q = [defs(id), `<defs><pattern id="${id}shtrix" width="220" height="220" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="220" height="220" fill="#ece8e1"/><line x1="0" y1="0" x2="0" y2="220" stroke="#c4bfb6" stroke-width="30"/></pattern></defs>`];
  const rect = (b, a) => `<rect x="${f(b.x1)}" y="${f(b.y1)}" width="${f(b.x2 - b.x1)}" height="${f(b.y2 - b.y1)}" ${a}/>`;
  const use = (s, x, y, rot = 0) => `<use href="#${id}${s}" transform="translate(${f(x)},${f(y)})${rot ? ` rotate(${rot})` : ''}"/>`;
  const markaz = b => [(b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2];
  const I = BINO1.ichki;

  // pollar
  q.push(rect({ x1: 0, y1: 0, x2: BINO1.L, y2: BINO1.B }, 'fill="#d8d5cf"'));
  q.push(rect(I, `fill="url(#${id}plitka)"`));
  q.push(rect({ x1: TAMBUR.x1 + 120, x2: TAMBUR.x2 - 120, y1: TAMBUR.y1, y2: TAMBUR.y2 - 120 }, `fill="url(#${id}shtrix)"`));
  q.push(rect({ x1: 3350, x2: 4850, y1: 6100, y2: 6300 }, `fill="url(#${id}plitka)"`));
  q.push(rect({ x1: 2880, x2: 4290, y1: 6900, y2: 7520 }, 'fill="#6b6f75" rx="40"'));   // gilamcha (tamburda)

  // zina
  q.push(rect(ZINA1.zona, 'fill="#e4e1db"'));
  ZINA1.marshlar.forEach(m => {
    q.push(rect(m, 'fill="#ece9e3" stroke="#8f8b84" stroke-width="10"'));
    if (m.yo === 'x') for (let x = m.x1 + m.qadam; x < m.x2 - 10; x += m.qadam) q.push(`<line x1="${f(x)}" y1="${m.y1}" x2="${f(x)}" y2="${m.y2}" stroke="#9c978f" stroke-width="12"/>`);
    else for (let y = m.y2 - m.qadam; y > m.y1 + 10; y -= m.qadam) q.push(`<line x1="${m.x1}" y1="${f(y)}" x2="${m.x2}" y2="${f(y)}" stroke="#9c978f" stroke-width="12"/>`);
  });
  q.push(rect(ZINA1.maydoncha, 'fill="#e9e6e0" stroke="#8f8b84" stroke-width="10"'));
  q.push(`<path d="M1135,2050 L1135,800 L3700,800" fill="none" stroke="#333" stroke-width="22"/><path d="M3560,690 L3760,800 L3560,910" fill="none" stroke="#333" stroke-width="22"/>`);

  // jihozlar (soya bilan)
  const j = [];
  const R = RESEPSHN;
  j.push(rect(R.stol, `rx="40" fill="${RANG1.resepshn}"`));
  j.push(rect({ x1: R.stol.x1 + 60, x2: R.stol.x2, y1: R.stol.y1 + 40, y2: R.stol.y1 + 480 }, `fill="url(#${id}yog)"`));       // ish yuzasi
  j.push(rect(R.peshtaxta, `rx="30" fill="#f2efe9" stroke="#9a948a" stroke-width="10"`));
  j.push(use('ofisStul', ...markaz(R.kreslo), 180));
  j.push(`<rect x="${5000 - 280}" y="${2120}" width="560" height="60" rx="14" fill="#1f2329"/>`);
  const M = MEHMON;
  j.push(rect(M.divan, 'rx="120" fill="#7d858f"'), rect({ ...M.divan, x2: M.divan.x1 + 220 }, 'rx="90" fill="#626a74"'));
  for (let i = 0; i < 3; i++) {
    const h = (M.divan.y2 - M.divan.y1 - 160) / 3;
    j.push(rect({ x1: M.divan.x1 + 240, x2: M.divan.x2 - 60, y1: M.divan.y1 + 80 + i * h + 20, y2: M.divan.y1 + 80 + (i + 1) * h - 20 }, 'rx="60" fill="#8c949e"'));
  }
  j.push(rect(M.stolcha, `rx="60" fill="url(#${id}yog)" stroke="#a88155" stroke-width="8"`));
  q.push(`<g filter="url(#${id}soya)">${j.join('')}${M.osimlik.map(([x, y]) => use('osimlik', x, y)).join('')}</g>`);

  // turniket chizig'i
  const T = TURNIKET;
  T.tosiq.forEach(t => q.push(rect(t, `fill="${RANG1.tosiq}"`)));
  q.push(rect(T.darvoza, 'fill="#c9d2db" stroke="#5f6b78" stroke-width="8" stroke-dasharray="40 25"'));
  q.push(`<path d="M${T.darvoza.x2},${T.chiziq} A900,900 0 0 1 ${T.darvoza.x1},${T.chiziq + 900}" fill="none" stroke="#6f6a63" stroke-width="9"/><line x1="${T.darvoza.x1}" y1="${T.chiziq}" x2="${T.darvoza.x1}" y2="${T.chiziq + 900}" stroke="#5f6b78" stroke-width="22"/>`);
  q.push(rect(T.korpus, `rx="40" fill="#b9c1ca" stroke="#5f6b78" stroke-width="12"`));
  [-1, 0, 1].forEach(k => {
    const a = (k * 120 - 180) * Math.PI / 180, cx = T.korpus.x1, cy = (T.korpus.y1 + T.korpus.y2) / 2;
    q.push(`<line x1="${cx}" y1="${cy}" x2="${f(cx + Math.cos(a) * 520)}" y2="${f(cy + Math.sin(a) * 520)}" stroke="#4b5563" stroke-width="30" stroke-linecap="round"/>`);
  });

  // logotiplar
  const LD = R.logoDevor, LS = R.logoStol;
  q.push(rect({ x1: LD.x1, x2: LD.x2, y1: 100, y2: 160 }, `fill="#1d2b22"`), rect({ x1: (LD.x1 + LD.x2) / 2 - LD.en / 2, x2: (LD.x1 + LD.x2) / 2 + LD.en / 2, y1: 160, y2: 190 }, `fill="${RANG1.logo}"`));
  q.push(rect({ x1: LS.x1, x2: LS.x2, y1: 2750, y2: 2790 }, `fill="${RANG1.logo}"`));
  q.push(logoBelgi(4500, 620, 150), logoBelgi(LS.x1 - 260, 3020, 110));

  // eshiklar
  ESHIK1.forEach(e => {
    const sk = eshikSektori(e);
    const leaf = { x: sk.ilgak.x, y: e.yuz + e.yon * e.en };
    const arcEnd = { x: e.ilgak === 'a' ? e.b : e.a, y: e.yuz };
    const sweep = (e.ilgak === 'a') === (e.yon > 0) ? 0 : 1;
    q.push(rect({ x1: sk.ilgak.x - 18, x2: sk.ilgak.x + 18, y1: Math.min(e.yuz, leaf.y), y2: Math.max(e.yuz, leaf.y) }, 'fill="#9cc9e6" stroke="#5f93ba" stroke-width="8"'));
    q.push(`<path d="M${f(leaf.x)},${f(leaf.y)} A${e.en},${e.en} 0 0 ${sweep} ${f(arcEnd.x)},${f(arcEnd.y)}" fill="none" stroke="#6f6a63" stroke-width="9"/>`);
  });

  // devorlar va ustunlar
  q.push(`<g filter="url(#${id}dsoya)">${DEVOR1.map(d => rect(d, `fill="${d.tambur ? '#8d8a84' : '#2b2d31'}"`)).join('')}${USTUN1.map(u => rect(u, 'fill="#8e9297" stroke="#2b2d31" stroke-width="30"')).join('')}</g>`);
  // qo'shni qism (chizmada uzilish chizig'i bilan): yuqorida va o'ngda
  q.push(`<path d="M0,-650 L2900,-650 L3050,-900 L3150,-400 L3300,-650 L7700,-650" fill="none" stroke="#9a968f" stroke-width="14"/><path d="M6500,-650 L6500,0" stroke="#9a968f" stroke-width="10"/>`);
  q.push(`<path d="M7700,-650 L7700,2800 L7950,2900 L7450,3050 L7700,3150 L7700,7750 L6650,7750 L6650,6300" fill="none" stroke="#9a968f" stroke-width="14"/>`);

  // yozuvlar
  const t = (x, y, s, size, a = '') => `<text x="${f(x)}" y="${f(y)}" font-size="${size}" stroke-width="${size * 0.28}" text-anchor="middle" ${a}>${s}</text>`;
  const B = 'font-weight="700" fill="#262626"', Rr = 'fill="#262626"', G = 'fill="#5a5a5a"';
  const L = [
    t(3300, 4350, 'Kirish zali', 330, B), t(3300, 4700, `${BINO1.maydon.toFixed(2)} m²`, 260, Rr),
    t(2950, 1800, 'Zinapoya', 240, B), t(2950, 2040, '2-qavatga', 190, G),
    t(5150, 3150, 'Resepshn', 240, B),
    t(2750, 3400, 'Turniket', 210, B), t(2750, 3620, '(mavjud)', 170, G),
    t(1750, 3850, 'evakuatsiya', 150, G), t(1750, 4030, 'darvozasi', 150, G),
    t(1650, 5150, 'Mehmonlar', 200, G),
    t(2250, 7100, 'Tambur', 220, 'font-weight="700" fill="#444"'),
    t(4950, 950, 'Logotip', 190, 'font-weight="700" fill="#1d7a35"'),
    `<text x="3800" y="9000" font-size="230" stroke-width="64" font-weight="700" fill="#c0392b">KIRISH</text>`,
  ];
  q.push(`<line x1="3585" y1="9150" x2="3585" y2="8760" stroke="#c0392b" stroke-width="45"/><path d="M3420,8800 L3585,8560 L3750,8800 Z" fill="#c0392b"/>`);

  // o'lchamlar
  const d = [];
  const zX = (y, n, ust = true, katta = false) => {
    d.push(`<line x1="${n[0]}" y1="${y}" x2="${n.at(-1)}" y2="${y}" stroke="#777" stroke-width="10"/>`);
    n.forEach(x => d.push(`<line x1="${x - 60}" y1="${y + 60}" x2="${x + 60}" y2="${y - 60}" stroke="#555" stroke-width="16"/>`));
    for (let i = 1; i < n.length; i++) if (n[i] - n[i - 1] >= 500)
      d.push(`<text x="${(n[i] + n[i - 1]) / 2}" y="${ust ? y - 80 : y + 230}" font-size="${katta ? 260 : 200}" text-anchor="middle" fill="#444" font-family="Liberation Sans, Arial">${((n[i] - n[i - 1]) / 1000).toFixed(2)}</text>`);
  };
  const zY = (x, n, chap = true, katta = false) => {
    d.push(`<line x1="${x}" y1="${n[0]}" x2="${x}" y2="${n.at(-1)}" stroke="#777" stroke-width="10"/>`);
    n.forEach(y => d.push(`<line x1="${x - 60}" y1="${y + 60}" x2="${x + 60}" y2="${y - 60}" stroke="#555" stroke-width="16"/>`));
    for (let i = 1; i < n.length; i++) if (n[i] - n[i - 1] >= 500) {
      const m = (n[i] + n[i - 1]) / 2, tx = chap ? x - 80 : x + 80;
      d.push(`<text x="${tx}" y="${m}" font-size="${katta ? 260 : 200}" text-anchor="middle" fill="#444" font-family="Liberation Sans, Arial" transform="rotate(${chap ? -90 : 90} ${tx} ${m})">${((n[i] - n[i - 1]) / 1000).toFixed(2)}</text>`);
    }
  };
  if (o.olcham !== false) {
    zX(-1000, [0, BINO1.L], true, true);
    zX(9350, [TAMBUR.x1, TAMBUR.x2], false, true);
    zX(2450, [250, 1300, 2200, 2300, 2900, 3200, 4050], true);
    zY(-700, [0, BINO1.B], true, true);
    zY(-350, [100, 2100, 2700, 6100], true);
    zY(7200, [6300, TAMBUR.y2], false);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x1} ${vb.y1} ${vb.x2 - vb.x1} ${vb.y2 - vb.y1}" width="${(vb.x2 - vb.x1) / (o.mashtab || 50)}mm" height="${(vb.y2 - vb.y1) / (o.mashtab || 50)}mm">${q.join('')}<g ${SHRIFT}>${L.join('')}</g>${d.join('')}</svg>`;
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
.asosiy { display: grid; grid-template-columns: 186mm 1fr; gap: 7mm; margin-top: 2mm; }
.ong-ust h2 { font-size: 10pt; color: #1f1f1f; margin: 2mm 0 1mm; }
.ong-ust h2:first-child { margin-top: 0 }
.ong-ust p, .ong-ust li { font-size: 7.6pt; line-height: 1.45; color: #333; }
.ong-ust ul { padding-left: 4mm; }
table { width: 100%; border-collapse: collapse; font-size: 7.3pt; margin-top: 1mm; }
td, th { padding: .7mm 1mm; border-bottom: .2mm solid #ddd; text-align: left; vertical-align: top; }
th { background: #f1f0ed; }
td.r { text-align: right; white-space: nowrap; }
.izoh { font-size: 6.6pt; color: #666; margin-top: 2mm; line-height: 1.4; }
.rasm img { width: 100%; display: block; border-radius: 1mm; margin-top: 1mm; }
.rasm div { font-size: 6.8pt; color: #555; margin-top: .6mm; }
`;

export function qavat1Html(o = {}) {
  const t = tekshiruv1();
  const m = v => (v / 1000).toFixed(2);
  const rasm = o.rasm ? `<div class="rasm"><img src="${o.rasm}"><div>3D: kirishdan resepshn va turniket tomonga (Blender)</div></div>` : '';
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — 1-qavat rejasi</title><style>${CSS}</style></head><body>
  <section class="varaq">
    <header>
      <div><div class="brend">${LOYIHA.brend} · ${LOYIHA.filial}</div><h1>1-qavat rejasi — kirish zali: resepshn, turniket va logotiplar</h1></div>
      <div class="ong"><div>Masshtab 1:50 (A3) · ${LOYIHA.versiya} · ${LOYIHA.sana}</div><div class="bar"><i></i><i></i><i></i><i></i><i></i></div><div class="son"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5 m (1:50)</span></div></div>
    </header>
    <div class="asosiy">
      <div>${q1Svg()}</div>
      <div class="ong-ust">
        <h2>Yechim</h2>
        <ul>
          <li><b>Turniket chizig'i</b> zalni ikkiga bo'ladi: janubda kirish va mehmonlar zonasi, shimolda zina (2-qavatga). Eshikdan turniketgacha ${m(t.eshikdan)} m, turniketdan zina boshigacha ${m(t.zinagacha)} m.</li>
          <li><b>Turniket</b> — buyurtmachida mavjud (tripod). O'tish yo'lagi ${t.otish / 10} sm. Yonida <b>evakuatsiya darvozasi</b> ${t.darvoza / 10} sm (antipanika: yong'in signalida ochiladi, resepshndan ochib beriladi — sumka, aravacha, nogironlar aravasi uchun), qolgan qismi to'siq bilan yopiladi.</li>
          <li><b>Resepshn stoykasi</b> turniket chizig'ining o'ng qismida, eshikka qaragan: xodim kirgan har bir kishini ko'radi va turniketni boshqaradi. Uzunligi ${m(RESEPSHN.stol.x2 - RESEPSHN.stol.x1)} m, mijoz tomonida 1.10 m lik peshtaxta, xodim tomonida 0.75 m ish yuzasi.</li>
          <li><b>Logotiplar</b> (design.pdp.uz, PDP Academy asosiy logotipi): stoyka orqasidagi devorda ichidan yoritilgan katta logotip (~${m(RESEPSHN.logoDevor.en)} × ${m(RESEPSHN.logoDevor.bal)} m, to'q panelda) — eshikdan kirganda ro'parada ko'rinadi; stoykaning old panelida ikkinchi logotip (~${m(RESEPSHN.logoStol.en)} m, yoritilgan).</li>
          <li><b>Mehmonlar zonasi</b>: chap devor bo'ylab 3 o'rinli divan va jurnal stolchasi (ota-onalar, kutayotganlar).</li>
        </ul>
        <table>
          <tr><th>Ko'rsatkich</th><th class="r">Qiymat</th></tr>
          <tr><td>Zal (tashqi / ichki)</td><td class="r">6.50 × 6.30 m / 6.00 × 6.00 m · ${BINO1.maydon.toFixed(2)} m²</td></tr>
          <tr><td>Tambur</td><td class="r">4.25 × 1.45 m, ikki tavaqali eshiklar</td></tr>
          <tr><td>Turniket yo'lagi / evakuatsiya darvozasi</td><td class="r">${t.otish} / ${t.darvoza} mm</td></tr>
          <tr><td>Resepshn stoykasi</td><td class="r">${m(RESEPSHN.stol.x2 - RESEPSHN.stol.x1)} × 0.70 m, h 1.10 / 0.75 m</td></tr>
          <tr><td>Logotiplar</td><td class="r">2 ta: devorda (yoritilgan) va stoykada</td></tr>
          <tr><td>Avtomatik tekshiruv (to'qnashuv, eshik, zina)</td><td class="r">${t.xato.length ? t.xato.join('; ') : 'xato yo\'q'}</td></tr>
        </table>
        ${rasm}
        <h2>Tasdiqlash uchun</h2>
        <ul>
          <li>Turniket nechta va qanday turda (tripod / tumba)? To'siq va evakuatsiya darvozasi uning komplektida bormi — bo'lmasa, alohida olinadi.</li>
          <li>Tambur (chizmada shtrixlangan) — mavjudmi yoki quriladimi?</li>
          <li>Zal shifti balandligi va yoritish (hisobda ${BINO1.H / 1000} m) — joyida aniqlanadi.</li>
        </ul>
        <p class="izoh">O'lchamlar buyurtmachi yuborgan 1-qavat chizmasi fotosidan; ustunlar, devor qalinliklari va zina chegarasi taxminiy — joyida o'lchanadi. Zina 2-qavatdagi kirish zinasiga (ZN2) olib chiqadi.</p>
      </div>
    </div>
  </section></body></html>`;
}
