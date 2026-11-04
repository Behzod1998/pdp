// 1-qavat: kirish zali — resepshn, turniketlar (buyurtmachida mavjud) va logotiplar.
// Koordinata — zalning tashqi yuqori-chap burchagidan, mm; x — o'ngga, y — pastga (kirish pastda, ko'chadan).
// O'lchamlar buyurtmachi yuborgan chizma fotosidan: zal 6.50 × 6.30 (ichi 6.00 × 6.00, 36.50 m²), tambur 4.25 m.
// Joylashuv — buyurtmachi chizgan sxema bo'yicha: zal bo'ylab turniket chizig'i (chapda chiqish, o'ngda kirish),
// o'ng (sharqiy) devor bo'ylab L shaklidagi resepshn va logotip. Zina — mavjud (video bo'yicha): pastki marsh
// shimoliy devor bo'ylab sharqqa, sharqiy maydoncha, yuqori marsh uning oldidan g'arbga — 2-qavatga.
// Devor qalinligi, ustunlar va zina o'lchamlari foto va videodan taxminiy — joyida o'lchanadi.
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

// ---------- zina (mavjud, 2-qavatga) ----------
// Pastki marsh shimoliy devor bo'ylab sharqqa ko'tariladi (10 pog'ona), sharqiy maydonchadan yuqori marsh
// pastki marshning oldidan g'arbga — 2-qavatga (13 pog'ona). Yuqori marsh ostida, sharqiy qismida bosh balandligi < 2 m.
export const ZINA1 = {
  pastki: r(2000, 4600, 100, 1400, { yo: 'sharq', soni: 10, kotarilish: 150 }),
  maydoncha: r(4600, 6250, 100, 2400, { z: 1500 }),
  yuqori: r(1600, 4600, 1400, 2400, { yo: "g'arb", soni: 13, z1: 1500, z2: 3750 }),
  past: r(3600, 4600, 1400, 2400),          // yuqori marsh ostida, bosh balandligi < 2 m — o'tib bo'lmaydi
  boshi: { x: 1900, y: 750 },               // pastki marshning birinchi pog'onasi (g'arbdan kiriladi)
};
export const ZINA_ZONA = [ZINA1.pastki, ZINA1.maydoncha, ZINA1.past];

// ---------- resepshn, turniketlar, logotiplar ----------
// Resepshn o'ng devor bo'ylab L shaklida (buyurtmachi sxemasi): x = 4880 chizig'ida stoyka va past to'siq panellari,
// shimolda — zina maydonchasi tagidagi yopuvchi panel. Stoyka zalga (g'arbga) qaragan — turniketlar va eshik ko'rinadi.
export const RESEPSHN = {
  chiziq: 4880,
  stol: r(4880, 5530, 3500, 5300),          // stoyka 1.8 m: g'arb tomonida 1.10 m lik peshtaxta, sharqda 0.75 m ish yuzasi
  peshtaxta: r(4860, 5100, 3500, 5300),
  panellar: [r(4880, 4930, 2450, 2550), r(4880, 4930, 3350, 3500), r(4880, 4930, 5300, 6100), r(4880, 6250, 2400, 2450)],
  xodimEshik: r(4880, 4930, 2550, 3350, { en: 800 }),
  kreslo: r(5640, 6090, 4175, 4625),
  logoDevor: { x: 6250, y1: 3300, y2: 5300, z1: 1100, z2: 2700, en: 1500, bal: 440 },    // xodim orqasidagi devor (to'q panel)
  logoStol: { x: 4860, y1: 3900, y2: 4900, z: 620, en: 1000, bal: 125 },                  // stoykaning zal tomonidagi paneli
};
export const TURNIKET = {
  chiziq: 4050,
  tosiq: [r(250, 1550, 4020, 4080), r(2450, 2650, 4020, 4080), r(3550, 3710, 4020, 4080), r(4610, 4880, 4020, 4080)],
  darvoza: r(1550, 2450, 4020, 4080, { ochiladi: 'janub' }),                         // evakuatsiya darvozasi 900, chiqishga ochiladi
  turniketlar: [
    { yonalish: 'chiqish', korpus: r(3250, 3550, 3750, 4350), otish: r(2650, 3250, 3750, 4350) },
    { yonalish: 'kirish', korpus: r(4310, 4610, 3750, 4350), otish: r(3710, 4310, 3750, 4350) },
  ],
};
export const MEHMON = {
  divan: r(250, 1050, 4500, 5700),
  stolcha: r(1150, 1500, 4800, 5400),
  osimlik: [[650, 4300], [2150, 5750]],
};

export function tekshiruv1() {
  const xato = [];
  const kesishadi = (a, b) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
  const T = TURNIKET, R = RESEPSHN;
  const jihoz = [R.stol, R.kreslo, ...R.panellar, MEHMON.divan, MEHMON.stolcha, ...T.turniketlar.map(t => t.korpus), ...T.tosiq, T.darvoza];
  jihoz.forEach((a, i) => {
    jihoz.slice(i + 1).forEach((b, k) => kesishadi(a, b) && xato.push(`jihoz ${i + 1} ↔ ${i + k + 2}`));
    USTUN1.forEach(u => kesishadi(a, u) && xato.push(`jihoz ${i + 1} ↔ ustun`));
    ESHIK1.forEach(e => kesishadi(a, eshikSektori(e).quti) && xato.push(`jihoz ${i + 1} ↔ eshik ${e.kod}`));
    ZINA_ZONA.forEach(z => kesishadi(a, z) && xato.push(`jihoz ${i + 1} zinaga tushgan`));
  });
  // evakuatsiya darvozasi janubga to'liq ochilganda jihozga tegmasin
  const dq = r(T.darvoza.x1, T.darvoza.x2, T.chiziq, T.chiziq + (T.darvoza.x2 - T.darvoza.x1));
  [MEHMON.divan, MEHMON.stolcha].forEach((a, i) => kesishadi(a, dq) && xato.push(`darvoza ↔ mehmon jihozi ${i + 1}`));
  T.turniketlar.forEach(t => { if (t.otish.x2 - t.otish.x1 < 550) xato.push(`turniket yo'lagi tor (${t.yonalish})`); });
  const darvoza = T.darvoza.x2 - T.darvoza.x1;
  if (darvoza < 900) xato.push(`evakuatsiya darvozasi tor: ${darvoza}`);
  // eshikdan turniketgacha; turniketdan zina boshigacha (yuqori marsh ostidan, bosh balandligi ≥ 2 m bo'lgan qismdan)
  const eshikdan = 6100 - T.chiziq;
  const zinagacha = Math.round(Math.hypot(T.turniketlar[0].otish.x1 - ZINA1.boshi.x, T.chiziq - ZINA1.boshi.y));
  return { xato, otish: T.turniketlar.map(t => t.otish.x2 - t.otish.x1), darvoza, eshikdan, zinagacha, stoyka: R.stol.y2 - R.stol.y1 };
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
    <rect width="220" height="220" fill="#ece8e1"/><line x1="0" y1="0" x2="0" y2="220" stroke="#c4bfb6" stroke-width="30"/></pattern>
    <pattern id="${id}oktagon" width="600" height="600" patternUnits="userSpaceOnUse"><rect width="600" height="600" fill="#ece3d2"/>
      <path d="M-70,0 L0,-70 L70,0 L0,70 Z M530,0 L600,-70 L670,0 L600,70 Z M-70,600 L0,530 L70,600 L0,670 Z M530,600 L600,530 L670,600 L600,670 Z" fill="#4a4038"/></pattern></defs>`];
  const rect = (b, a) => `<rect x="${f(b.x1)}" y="${f(b.y1)}" width="${f(b.x2 - b.x1)}" height="${f(b.y2 - b.y1)}" ${a}/>`;
  const use = (s, x, y, rot = 0) => `<use href="#${id}${s}" transform="translate(${f(x)},${f(y)})${rot ? ` rotate(${rot})` : ''}"/>`;
  const markaz = b => [(b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2];
  const I = BINO1.ichki;

  // pollar (mavjud: och oktagon plitka, burchaklarida to'q romb)
  q.push(rect({ x1: 0, y1: 0, x2: BINO1.L, y2: BINO1.B }, 'fill="#d8d5cf"'));
  q.push(rect(I, `fill="url(#${id}oktagon)"`));
  q.push(rect({ x1: TAMBUR.x1 + 120, x2: TAMBUR.x2 - 120, y1: TAMBUR.y1, y2: TAMBUR.y2 - 120 }, `fill="url(#${id}shtrix)"`));
  q.push(rect({ x1: 3350, x2: 4850, y1: 6100, y2: 6300 }, `fill="url(#${id}oktagon)"`));
  q.push(rect({ x1: 2880, x2: 4290, y1: 6900, y2: 7520 }, 'fill="#6b6f75" rx="40"'));   // gilamcha (tamburda)

  // zina: pastki marsh va maydoncha (kesimgacha), yuqori marsh — tepada (shtrix chiziq bilan)
  const Z = ZINA1;
  q.push(rect(Z.pastki, 'fill="#9b8676" stroke="#5a4a3e" stroke-width="10"'));
  const t1 = (Z.pastki.x2 - Z.pastki.x1) / Z.pastki.soni;
  for (let i = 1; i < Z.pastki.soni; i++) q.push(`<line x1="${f(Z.pastki.x1 + i * t1)}" y1="${Z.pastki.y1}" x2="${f(Z.pastki.x1 + i * t1)}" y2="${Z.pastki.y2}" stroke="#5a4a3e" stroke-width="12"/>`);
  q.push(rect(Z.maydoncha, 'fill="#a8968a" stroke="#5a4a3e" stroke-width="10"'));
  q.push(rect(Z.yuqori, 'fill="none" stroke="#5a4a3e" stroke-width="12" stroke-dasharray="60 40"'));
  const t2 = (Z.yuqori.x2 - Z.yuqori.x1) / Z.yuqori.soni;
  for (let i = 1; i < Z.yuqori.soni; i++) q.push(`<line x1="${f(Z.yuqori.x1 + i * t2)}" y1="${Z.yuqori.y1}" x2="${f(Z.yuqori.x1 + i * t2)}" y2="${Z.yuqori.y2}" stroke="#7d6c60" stroke-width="7" stroke-dasharray="40 40"/>`);
  q.push(rect(Z.past, `fill="url(#${id}shtrix)" fill-opacity=".55"`));
  q.push(`<path d="M${Z.pastki.x1 + 150},750 L${Z.pastki.x2 - 250},750" fill="none" stroke="#fff" stroke-width="24"/><path d="M${Z.pastki.x2 - 380},640 L${Z.pastki.x2 - 230},750 L${Z.pastki.x2 - 380},860" fill="none" stroke="#fff" stroke-width="24"/>`);
  q.push(`<path d="M${Z.yuqori.x2 - 300},1900 L${Z.yuqori.x1 + 250},1900" fill="none" stroke="#5a4a3e" stroke-width="18" stroke-dasharray="70 45"/><path d="M${Z.yuqori.x1 + 380},1790 L${Z.yuqori.x1 + 230},1900 L${Z.yuqori.x1 + 380},2010" fill="none" stroke="#5a4a3e" stroke-width="18"/>`);

  // jihozlar (soya bilan)
  const j = [];
  const R = RESEPSHN;
  j.push(rect(R.stol, `rx="30" fill="url(#${id}yog)"`));                                 // ish yuzasi
  j.push(rect(R.peshtaxta, `rx="30" fill="${RANG1.resepshn}"`), rect({ ...R.peshtaxta, x2: R.peshtaxta.x1 + 120 }, 'fill="#f2efe9"'));
  R.panellar.forEach(p => j.push(rect(p, `fill="${RANG1.resepshn}"`)));
  j.push(use('ofisStul', ...markaz(R.kreslo), 90));
  j.push(`<rect x="${R.stol.x1 + 300}" y="${(R.stol.y1 + R.stol.y2) / 2 - 280}" width="60" height="560" rx="14" fill="#1f2329"/>`);
  const M = MEHMON;
  j.push(rect(M.divan, 'rx="120" fill="#7d858f"'), rect({ ...M.divan, x2: M.divan.x1 + 220 }, 'rx="90" fill="#626a74"'));
  for (let i = 0; i < 2; i++) {
    const h = (M.divan.y2 - M.divan.y1 - 160) / 2;
    j.push(rect({ x1: M.divan.x1 + 240, x2: M.divan.x2 - 60, y1: M.divan.y1 + 80 + i * h + 20, y2: M.divan.y1 + 80 + (i + 1) * h - 20 }, 'rx="60" fill="#8c949e"'));
  }
  j.push(rect(M.stolcha, `rx="60" fill="url(#${id}yog)" stroke="#a88155" stroke-width="8"`));
  q.push(`<g filter="url(#${id}soya)">${j.join('')}${M.osimlik.map(([x, y]) => use('osimlik', x, y)).join('')}</g>`);
  // xodim eshigi (resepshnga, zina tomondagi zonadan)
  const xe = R.xodimEshik;
  q.push(`<line x1="${xe.x2}" y1="${xe.y1}" x2="${xe.x2 + xe.en}" y2="${xe.y1}" stroke="${RANG1.resepshn}" stroke-width="22"/><path d="M${xe.x2 + xe.en},${xe.y1} A${xe.en},${xe.en} 0 0 1 ${xe.x2},${xe.y2}" fill="none" stroke="#6f6a63" stroke-width="9"/>`);

  // turniket chizig'i
  const T = TURNIKET;
  T.tosiq.forEach(t => q.push(rect(t, `fill="${RANG1.tosiq}"`)));
  q.push(rect(T.darvoza, 'fill="#c9d2db" stroke="#5f6b78" stroke-width="8" stroke-dasharray="40 25"'));
  q.push(`<path d="M${T.darvoza.x2},${T.chiziq} A900,900 0 0 1 ${T.darvoza.x1},${T.chiziq + 900}" fill="none" stroke="#6f6a63" stroke-width="9"/><line x1="${T.darvoza.x1}" y1="${T.chiziq}" x2="${T.darvoza.x1}" y2="${T.chiziq + 900}" stroke="#5f6b78" stroke-width="22"/>`);
  T.turniketlar.forEach(t => {
    q.push(rect(t.korpus, 'rx="40" fill="#b9c1ca" stroke="#5f6b78" stroke-width="12"'));
    [-1, 0, 1].forEach(k => {
      const a = (k * 120 - 180) * Math.PI / 180, cx = t.korpus.x1, cy = T.chiziq;
      q.push(`<line x1="${cx}" y1="${cy}" x2="${f(cx + Math.cos(a) * 520)}" y2="${f(cy + Math.sin(a) * 520)}" stroke="#4b5563" stroke-width="30" stroke-linecap="round"/>`);
    });
    // yo'nalish strelkasi
    const cx = (t.otish.x1 + t.otish.x2) / 2, kir = t.yonalish === 'kirish';
    const [ya, yb] = kir ? [4900, 3300] : [3300, 4900];
    q.push(`<line x1="${cx}" y1="${ya}" x2="${cx}" y2="${yb + (kir ? 120 : -120)}" stroke="${kir ? '#1d7a35' : '#c0392b'}" stroke-width="34"/><path d="M${cx - 110},${yb + (kir ? 170 : -170)} L${cx},${yb} L${cx + 110},${yb + (kir ? 170 : -170)} Z" fill="${kir ? '#1d7a35' : '#c0392b'}"/>`);
  });

  // logotiplar
  const LD = R.logoDevor, LS = R.logoStol;
  q.push(rect({ x1: 6190, x2: 6250, y1: LD.y1, y2: LD.y2 }, 'fill="#1d2b22"'), rect({ x1: 6160, x2: 6190, y1: (LD.y1 + LD.y2) / 2 - LD.en / 2, y2: (LD.y1 + LD.y2) / 2 + LD.en / 2 }, `fill="${RANG1.logo}"`));
  q.push(rect({ x1: 4820, x2: 4860, y1: LS.y1, y2: LS.y2 }, `fill="${RANG1.logo}"`));
  q.push(logoBelgi(5990, 2750, 130), logoBelgi(4550, 4500, 110));

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
    t(3250, 5300, 'Kirish zali', 330, B), t(3250, 5650, `${BINO1.maydon.toFixed(2)} m²`, 260, Rr),
    t(3300, 1050, 'Zina (mavjud) — 2-qavatga', 210, 'font-weight="700" fill="#ffffff" stroke="none"'),
    t(2700, 2250, 'yuqori marsh (tepada)', 160, G),
    t(4100, 1700, 'h < 2 m', 150, G),
    t(1100, 2100, 'zina osti', 170, G),
    t(5520, 5650, 'Resepshn', 220, B),
    t(2950, 3600, 'chiqish', 160, 'font-weight="700" fill="#c0392b"'), t(4010, 3600, 'kirish', 160, 'font-weight="700" fill="#1d7a35"'),
    t(3500, 4720, 'Turniketlar (mavjud)', 200, B),
    t(2000, 4350, 'evak. darvoza', 150, G),
    t(1050, 6000, 'Mehmonlar', 190, G),
    t(2250, 7100, 'Tambur', 220, 'font-weight="700" fill="#444"'),
    t(5990, 3150, 'Logotip', 140, 'font-weight="700" fill="#1d7a35"'),
    `<text x="3800" y="9000" font-size="230" stroke-width="64" font-weight="700" fill="#c0392b">KIRISH</text>`,
  ];
  q.push(`<line x1="3585" y1="9150" x2="3585" y2="8760" stroke="#c0392b" stroke-width="45"/><path d="M3420,8800 L3585,8560 L3750,8800 Z" fill="#c0392b"/>`);

  // o'lchamlar
  const d = [];
  const zX = (y, n, ust = true, katta = false) => {
    d.push(`<line x1="${n[0]}" y1="${y}" x2="${n.at(-1)}" y2="${y}" stroke="#777" stroke-width="10"/>`);
    n.forEach(x => d.push(`<line x1="${x - 60}" y1="${y + 60}" x2="${x + 60}" y2="${y - 60}" stroke="#555" stroke-width="16"/>`));
    for (let i = 1; i < n.length; i++) if (n[i] - n[i - 1] >= 500)
      d.push(`<text x="${(n[i] + n[i - 1]) / 2}" y="${ust ? y - 80 : y + 230}" font-size="${katta ? 260 : 190}" text-anchor="middle" fill="#444" font-family="Liberation Sans, Arial">${((n[i] - n[i - 1]) / 1000).toFixed(2)}</text>`);
  };
  const zY = (x, n, chap = true, katta = false) => {
    d.push(`<line x1="${x}" y1="${n[0]}" x2="${x}" y2="${n.at(-1)}" stroke="#777" stroke-width="10"/>`);
    n.forEach(y => d.push(`<line x1="${x - 60}" y1="${y + 60}" x2="${x + 60}" y2="${y - 60}" stroke="#555" stroke-width="16"/>`));
    for (let i = 1; i < n.length; i++) if (n[i] - n[i - 1] >= 500) {
      const m = (n[i] + n[i - 1]) / 2, tx = chap ? x - 80 : x + 80;
      d.push(`<text x="${tx}" y="${m}" font-size="${katta ? 260 : 190}" text-anchor="middle" fill="#444" font-family="Liberation Sans, Arial" transform="rotate(${chap ? -90 : 90} ${tx} ${m})">${((n[i] - n[i - 1]) / 1000).toFixed(2)}</text>`);
    }
  };
  if (o.olcham !== false) {
    zX(-1000, [0, BINO1.L], true, true);
    zX(9350, [TAMBUR.x1, TAMBUR.x2], false, true);
    zX(2650, [250, 1550, 2450, 2650, 3250, 3550, 3710, 4310, 4610, 4880], true);
    zY(-700, [0, BINO1.B], true, true);
    zY(-350, [100, 1400, 2400, 4050, 6100], true);
    zY(7200, [6300, TAMBUR.y2], false);
    zY(7000, [2400, 3500, 5300, 6100], false);
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
.ong-ust p, .ong-ust li { font-size: 7.4pt; line-height: 1.42; color: #333; }
.ong-ust ul { padding-left: 4mm; }
table { width: 100%; border-collapse: collapse; font-size: 7.2pt; margin-top: 1mm; }
td, th { padding: .6mm 1mm; border-bottom: .2mm solid #ddd; text-align: left; vertical-align: top; }
th { background: #f1f0ed; }
td.r { text-align: right; white-space: nowrap; }
.izoh { font-size: 6.6pt; color: #666; margin-top: 2mm; line-height: 1.4; }
.rasmlar { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; margin-top: 1.5mm; }
.rasmlar img { width: 100%; display: block; border-radius: 1mm; }
.rasmlar div { font-size: 6.6pt; color: #555; margin-top: .5mm; }
`;

export function qavat1Html(o = {}) {
  const t = tekshiruv1();
  const m = v => (v / 1000).toFixed(2);
  const rasm = (o.rasmlar || []).filter(x => x.src);
  const rasmlar = rasm.length ? `<div class="rasmlar">${rasm.map(x => `<figure><img src="${x.src}"><div>${x.nom}</div></figure>`).join('')}</div>` : '';
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — 1-qavat rejasi</title><style>${CSS}</style></head><body>
  <section class="varaq">
    <header>
      <div><div class="brend">${LOYIHA.brend} · ${LOYIHA.filial}</div><h1>1-qavat rejasi — kirish zali: resepshn, turniketlar va logotiplar</h1></div>
      <div class="ong"><div>Masshtab 1:50 (A3) · ${LOYIHA.versiya} · ${LOYIHA.sana}</div><div class="bar"><i></i><i></i><i></i><i></i><i></i></div><div class="son"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5 m (1:50)</span></div></div>
    </header>
    <div class="asosiy">
      <div>${q1Svg()}</div>
      <div class="ong-ust">
        <h2>Yechim (buyurtmachi sxemasi bo'yicha)</h2>
        <ul>
          <li><b>Zina mavjud holicha</b>: pastki marsh shimoliy devor bo'ylab sharqqa, sharqiy maydoncha (~1.5 m), undan yuqori marsh g'arbga — 2-qavatga. Shuning uchun zalning shimoliy qismi (${m(ZINA1.maydoncha.y2 - 100)} m) zinaga band.</li>
          <li><b>Turniket chizig'i</b> eshikdan ${m(t.eshikdan)} m ichkarida, zal bo'ylab: o'ngda <b>kirish</b> (resepshn yonida), chaprog'ida <b>chiqish</b> — turniketlar buyurtmachida mavjud; o'tish yo'llari ${t.otish.map(v => v / 10).join(' va ')} sm. Chapda <b>evakuatsiya darvozasi</b> ${t.darvoza / 10} sm (antipanika, chiqishga ochiladi), qolgan qismi to'siq.</li>
          <li><b>Resepshn</b> o'ng devor bo'ylab L shaklida: stoyka ${m(t.stoyka)} m, zalga qaragan (turniketlar va eshik ko'rinadi), mijoz tomonida 1.10 m lik peshtaxta; qolgan qismi past to'siq panellari, shimolda — zina maydonchasi tagidagi yopuvchi panel. Xodim resepshnga turniketdan o'tgan zonadan, 80 sm eshikcha orqali kiradi.</li>
          <li><b>Logotiplar</b> (design.pdp.uz, PDP Academy): xodim orqasidagi o'ng devorda to'q panelda ichidan yoritilgan katta logotip (~${m(RESEPSHN.logoDevor.en)} m) — eshikdan kirganda o'ng tomonda, zaldan ko'rinadi; stoykaning zal tomonidagi panelida ikkinchi logotip (~${m(RESEPSHN.logoStol.en)} m, yoritilgan).</li>
          <li><b>Mehmonlar joyi</b>: chap devor bo'ylab divan va jurnal stolchasi — kirish zonasida (turniketgacha).</li>
          <li>Pol (oktagon plitka), devorlar va zina — mavjud holicha (videodagi kabi).</li>
        </ul>
        <table>
          <tr><th>Ko'rsatkich</th><th class="r">Qiymat</th></tr>
          <tr><td>Zal (tashqi / ichki)</td><td class="r">6.50 × 6.30 m / 6.00 × 6.00 m · ${BINO1.maydon.toFixed(2)} m²</td></tr>
          <tr><td>Turniket yo'llari / evakuatsiya darvozasi</td><td class="r">${t.otish.join(' / ')} / ${t.darvoza} mm</td></tr>
          <tr><td>Resepshn stoykasi / to'siq panellari</td><td class="r">${m(t.stoyka)} m · h 1.10 / 0.75 m</td></tr>
          <tr><td>Avtomatik tekshiruv (to'qnashuv, eshik, zina)</td><td class="r">${t.xato.length ? t.xato.join('; ') : 'xato yo\'q'}</td></tr>
        </table>
        ${rasmlar}
        <h2>Tasdiqlash uchun</h2>
        <ul>
          <li>Turniketlar 2 ta (kirish va chiqish) deb olindi — to'g'rimi? To'siq va evakuatsiya darvozasi komplektda bormi?</li>
          <li>Zina o'lchamlari videodan taxminiy — joyida o'lchanadi (ayniqsa yuqori marsh ostidagi balandlik).</li>
        </ul>
        <p class="izoh">O'lchamlar buyurtmachi yuborgan 1-qavat chizmasi, sxemasi va videosidan; ustunlar, devor qalinliklari va zina taxminiy — joyida o'lchanadi.</p>
      </div>
    </div>
  </section></body></html>`;
}
