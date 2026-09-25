// PDP Academy · Xadra filiali, 2-qavat — geometriya modeli.
//
// Barcha o'lchamlar mm. Koordinata boshi — ichki yuzaning yuqori-chap burchagi,
// X o'ngga, Y pastga (mavjud holat chizmasidagi kabi). O'lchamlar chizma fotosidan
// olingan: joyida o'lchanmaguncha taxminiy.

export const LOYIHA = {
  brend: 'PDP Academy',
  filial: 'Xadra filiali',
  qavat: '2-qavat',
  manzil: 'Toshkent sh., Xadra',
  versiya: 'v1.0',
  sana: '25.09.2026',
  sanaISO: '2026-09-25',
  umumiy: 617,       // chizmadagi "Umumiy maydoni"
  foydali: 557.74,   // chizmadagi "Foydali maydoni"
};

export const H = 3000; // toza balandlik — taxmin, joyida o'lchanadi
export const ICHKI = { x: 23900, y: 24400 };
export const DEVOR = { chap: 400, ong: 400, yuqori: 300, past: 300 };

// Ustunlar to'ri (ustun markazlari). Chetki o'qlar devor ichida.
export const OQLAR = {
  x: [['1', -200], ['2', 6050], ['3', 12050], ['4', 18050], ['5', 24100]],
  y: [['A', -200], ['B', 6300], ['C', 12300], ['D', 18450], ['E', 24600]],
};
const OX = Object.fromEntries(OQLAR.x), OY = Object.fromEntries(OQLAR.y);

// ---------- Standart (Beruniy) ----------
export const PARTA = { eni: 690, chuq: 500 };
export const STUL = { eni: 380, chuq: 420, oraliq: 20 };
export const STANDART = { bloklar: [2, 2, 2], yolak: 600, doska: 2440, qadam: 1300, qatorlar: 4, oxirgi: 6840 };

// ---------- Ustunlar ----------
const ustun = (kod, ox, oy, holat = 'mavjud') => ({ kod, ox, oy, x: OX[ox], y: OY[oy], o: 400, holat });
export const USTUNLAR = [
  ustun('U1', '2', 'B'), ustun('U2', '3', 'B'), ustun('U3', '4', 'B'),
  ustun('U4', '2', 'C'), ustun('U5', '3', 'C'), ustun('U6', '4', 'C'),
  ustun('U7', '2', 'D'),
  ustun('U8', '3', 'D', 'taxminiy'), ustun('U9', '4', 'D', 'taxminiy'),
  // tashqi devorlardagi ustunlar (chizmada ko'ringanlari)
  ...[['1', 'A'], ['3', 'A'], ['4', 'A'], ['5', 'A'], ['1', 'E'], ['2', 'E'], ['3', 'E'], ['4', 'E'], ['5', 'E'],
    ['1', 'B'], ['1', 'C'], ['1', 'D'], ['5', 'B'], ['5', 'C'], ['5', 'D']].map(([a, b]) => ustun('', a, b)),
].map(u => {
  // tashqi ustunlar ichki yuzaga tekislanadi
  const r = { ...u, x1: u.x - 200, x2: u.x + 200, y1: u.y - 200, y2: u.y + 200 };
  if (u.ox === '1') { r.x1 = -400; r.x2 = 0; }
  if (u.ox === '5') { r.x1 = ICHKI.x; r.x2 = ICHKI.x + 400; }
  if (u.oy === 'A') { r.y1 = -400; r.y2 = 0; }
  if (u.oy === 'E') { r.y1 = ICHKI.y; r.y2 = ICHKI.y + 400; }
  r.ichki = !!u.kod;
  return r;
});

// ---------- Derazalar (joylari taxminiy: chizmada ko'rsatilmagan) ----------
// devor: yuqori | past | chap; a..b — devor bo'ylab oraliq.
export const DERAZALAR = [
  { devor: 'yuqori', a: 900, b: 2100 },
  { devor: 'yuqori', a: 7900, b: 10300 },
  { devor: 'yuqori', a: 13850, b: 16250 },
  { devor: 'yuqori', a: 19825, b: 22225 },
  { devor: 'past', a: 1775, b: 4175 },
  { devor: 'past', a: 7850, b: 10250 },
  { devor: 'past', a: 13850, b: 16250 },
  { devor: 'past', a: 19825, b: 22225 },
  { devor: 'chap', a: 2400, b: 3600 },
  { devor: 'chap', a: 8100, b: 10500 },
  { devor: 'chap', a: 14175, b: 16575 },
  { devor: 'chap', a: 19250, b: 20450 },
  { devor: 'chap', a: 22300, b: 23600 },
].map(d => {
  if (d.devor === 'yuqori') return { ...d, x1: d.a, x2: d.b, y1: -DEVOR.yuqori, y2: 0 };
  if (d.devor === 'past') return { ...d, x1: d.a, x2: d.b, y1: ICHKI.y, y2: ICHKI.y + DEVOR.past };
  return { ...d, x1: -DEVOR.chap, x2: 0, y1: d.a, y2: d.b };
});

// ---------- Devorlar ----------
// holat: tashqi | mavjud (saqlanadi) | yangi | buziladi
const d = (x1, x2, y1, y2, holat, izoh = '') => ({ x1, x2, y1, y2, holat, izoh });

const tashqi = [
  d(-DEVOR.chap, ICHKI.x + DEVOR.ong, -DEVOR.yuqori, 0, 'tashqi'),
  d(-DEVOR.chap, ICHKI.x + DEVOR.ong, ICHKI.y, ICHKI.y + DEVOR.past, 'tashqi'),
  d(-DEVOR.chap, 0, 0, ICHKI.y, 'tashqi'),
  d(ICHKI.x, ICHKI.x + DEVOR.ong, 0, ICHKI.y, 'tashqi'),
];

// O'zgarmaydigan blok: ZN1 zinasi va sanuzel bloki (2–6), ZN2 zinasi, 12-xona.
const qotgan = [
  d(3000, 3100, 0, 5300, 'mavjud'), d(3000, 3100, 6100, 6300, 'mavjud'),
  d(4350, 4450, 0, 3850, 'mavjud'),
  d(3100, 3350, 1600, 1700, 'mavjud'), d(3950, 4800, 1600, 1700, 'mavjud'), d(5400, 5900, 1600, 1700, 'mavjud'),
  d(3100, 3500, 3850, 3950, 'mavjud'), d(4150, 4750, 3850, 3950, 'mavjud'), d(5400, 5900, 3850, 3950, 'mavjud'),
  d(5900, 6250, 0, 6300, 'mavjud'),
  d(0, 4450, 6300, 6500, 'mavjud'), d(5150, 6250, 6300, 6500, 'mavjud'),
  d(0, 3650, 18350, 18450, 'mavjud', 'ZN2 to\'sig\'i'),
  d(0, 4550, 21250, 21450, 'mavjud'), d(5450, 5950, 21250, 21450, 'mavjud'),
];

// Yangi bo'linish (buyurtmachi namunasi bo'yicha):
// yuqori qator 1–3-xona | K1 koridori | xizmat xonalari 1–4 va 4-xona | K2 koridori | pastki qator 7–5-xona;
// chap qanotda koworking / tadbirlar zali.
const ichki = [
  // 2-o'q (B) — koworking va asosiy blok orasida; K1 va K2 uchun ochiq
  d(5950, 6250, 6500, 7400, 'mavjud'), d(5950, 6250, 7400, 7800, 'yangi', 'bo\'shliq yopiladi'),
  d(5950, 6250, 9300, 10000, 'yangi', 'bo\'shliq yopiladi'), d(5950, 6250, 10000, 12100, 'mavjud'),
  d(5950, 6250, 12500, 15100, 'mavjud'), d(5950, 6150, 15100, 16200, 'buziladi', 'K2 koridori'),
  d(5950, 6150, 16600, 18250, 'yangi', 'bo\'shliq yopiladi'), d(5950, 6150, 18650, 21250, 'yangi', 'bo\'shliq yopiladi'),
  d(5950, 6150, 21250, ICHKI.y, 'mavjud'),
  // eski o'rta devor (C o'qi) — xizmat xonalari va 4-xona ichida qolgani uchun buziladi
  d(6250, 11850, 12200, 12400, 'buziladi', 'eski o\'rta devor'), d(12250, 17850, 12200, 12400, 'buziladi', 'eski o\'rta devor'),
  d(18250, 19000, 12200, 12400, 'buziladi', 'eski o\'rta devor'), d(20500, ICHKI.x, 12200, 12400, 'buziladi', 'eski o\'rta devor'),
  d(0, 4200, 12200, 12400, 'buziladi', '7 va 11-xonalar orasidagi devor'),
  // 3-o'q (C)
  d(11950, 12150, 0, 7700, 'mavjud'), d(11950, 12150, 9400, 10300, 'yangi', 'bo\'shliq yopiladi'),
  d(11950, 12150, 10300, 12100, 'mavjud'), d(11950, 12150, 12500, 15000, 'mavjud'),
  d(11950, 12150, 15100, 16600, 'buziladi', 'K2 koridori'), d(11950, 12150, 16700, 18850, 'mavjud'),
  d(11950, 12150, 18850, 21600, 'yangi', 'bo\'shliq yopiladi'), d(11950, 12150, 21600, ICHKI.y, 'mavjud'),
  // 4-o'q (D)
  d(17950, 18150, 0, 7700, 'mavjud'), d(17950, 18150, 7800, 7900, 'buziladi', 'K1 koridori'),
  d(17950, 18150, 9400, 10400, 'yangi', 'bo\'shliq yopiladi'), d(17950, 18150, 10400, 12100, 'mavjud'),
  d(17950, 18150, 12500, 15000, 'mavjud'), d(17950, 18150, 15100, 16600, 'buziladi', 'K2 koridori'),
  d(17950, 18150, 16700, 18850, 'mavjud'), d(17950, 18150, 18850, 21600, 'yangi', 'bo\'shliq yopiladi'),
  d(17950, 18150, 21600, ICHKI.y, 'mavjud'),
  // K1 shimoliy devori (1–3-xonalar doskasi) — eshiklar bilan
  d(6250, 6450, 7700, 7800, 'yangi'), d(7350, 12350, 7700, 7800, 'yangi'),
  d(13250, 18300, 7700, 7800, 'yangi'), d(19200, ICHKI.x, 7700, 7800, 'yangi'),
  d(19300, 19400, 7800, 9300, 'yangi'),
  // K1 janubiy devori (xizmat xonalari eshiklari bilan)
  d(6250, 6400, 9300, 9400, 'yangi'), d(7300, 9300, 9300, 9400, 'yangi'), d(10200, 12300, 9300, 9400, 'yangi'),
  d(13200, 15250, 9300, 9400, 'yangi'), d(16150, 19400, 9300, 9400, 'yangi'),
  // xizmat xonalari orasidagi devorlar
  d(9050, 9150, 9400, 15000, 'yangi'), d(15000, 15100, 9400, 15000, 'yangi'),
  // K2 shimoliy devori
  d(6250, 19400, 15000, 15100, 'yangi'),
  d(19300, 19400, 15100, 15300, 'yangi'), d(19300, 19400, 16200, 16600, 'yangi'),
  // K2 janubiy devori (5–7-xonalar doskasi) — eshiklar bilan
  d(6150, 6350, 16600, 16700, 'yangi'), d(7250, 12350, 16600, 16700, 'yangi'),
  d(13250, 18300, 16600, 16700, 'yangi'), d(19200, ICHKI.x, 16600, 16700, 'yangi'),
];

export const DEVORLAR = [...tashqi, ...qotgan, ...ichki];

// ---------- Eshiklar ----------
// devor: 'h' (gorizontal devorda, a..b bo'yicha X) yoki 'v' (vertikal devorda, a..b bo'yicha Y).
// yuz — eshik polotnosi ochiladigan tomondagi devor yuzasi koordinatasi; yon: +1/-1 ochilish yo'nalishi.
// ilgak: 'a' | 'b' — qaysi uchida ilgak.
const e = (kod, devor, a, b, yuz, yon, ilgak, holat = 'yangi') => ({ kod, devor, a, b, yuz, yon, ilgak, holat, en: b - a });
export const ESHIKLAR = [
  e('SR1', 'h', 6450, 7350, 7700, -1, 'a'),
  e('SR2', 'h', 12350, 13250, 7700, -1, 'a'),
  e('SR3', 'h', 18300, 19200, 7700, -1, 'a'),
  e('SR4', 'v', 15300, 16200, 19400, +1, 'b'),
  e('SR5', 'h', 18300, 19200, 16700, +1, 'a'),
  e('SR6', 'h', 12350, 13250, 16700, +1, 'a'),
  e('SR7', 'h', 6350, 7250, 16700, +1, 'a'),
  e('XZ1', 'h', 6400, 7300, 9400, +1, 'a'),
  e('XZ2', 'h', 9300, 10200, 9400, +1, 'a'),
  e('XZ3', 'h', 12300, 13200, 9400, +1, 'a'),
  e('XZ4', 'h', 15250, 16150, 9400, +1, 'a'),
  e('ADM', 'h', 4550, 5450, 21250, -1, 'b', 'mavjud'),
  e('SU6', 'h', 4450, 5150, 6500, +1, 'a', 'mavjud'),
  e('ZN1', 'v', 5300, 6100, 3100, +1, 'b', 'mavjud'),
  e('SU2', 'h', 3350, 3950, 1700, +1, 'a', 'mavjud'),
  e('SU3', 'h', 4800, 5400, 1700, +1, 'b', 'mavjud'),
  e('SU4', 'h', 3500, 4150, 3950, +1, 'a', 'mavjud'),
  e('SU5', 'h', 4750, 5400, 3950, +1, 'b', 'mavjud'),
];

// ---------- Zinalar ----------
export const ZINALAR = [
  { kod: 'ZN1', x1: 0, y1: 0, x2: 3000, y2: 6300,
    marshlar: [{ x1: 150, x2: 1450, y1: 1300, y2: 4400, yo: 'y' }, { x1: 1550, x2: 2850, y1: 1300, y2: 4400, yo: 'y' }],
    strelka: { x: 2200, y1: 1600, y2: 4200, matn: 'pastga' } },
  { kod: 'ZN2', x1: 0, y1: 18450, x2: 3650, y2: 21250,
    marshlar: [{ x1: 1500, x2: 3650, y1: 18550, y2: 19850, yo: 'x' }, { x1: 150, x2: 1400, y1: 19950, y2: 21150, yo: 'y' }],
    strelka: { x: 700, y1: 20150, y2: 21000, matn: '1-qavat' } },
];

// ---------- Xonalar ----------
// doska: 'yuqori' (y1 devori) | 'past' (y2 devori)
// SR1–SR7 = namunadagi 1–7-xona (yuqori qator 1–3, o'ngda 4, pastki qator o'ngdan chapga 5–7).
export const XONALAR = [
  { kod: 'SR1', nomi: 'Study Room 1', tur: 'sinf', x1: 6250, y1: 0, x2: 11950, y2: 7700, doska: 'past', eshik: 'SR1', eskiRaqam: '8', koridor: 'K1' },
  { kod: 'SR2', nomi: 'Study Room 2', tur: 'sinf', x1: 12150, y1: 0, x2: 17950, y2: 7700, doska: 'past', eshik: 'SR2', eskiRaqam: '9', koridor: 'K1' },
  { kod: 'SR3', nomi: 'Study Room 3', tur: 'sinf', x1: 18150, y1: 0, x2: ICHKI.x, y2: 7700, doska: 'past', eshik: 'SR3', eskiRaqam: '10', koridor: 'K1' },
  { kod: 'SR4', nomi: 'Study Room 4', tur: 'sinf', x1: 18150, y1: 7800, x2: ICHKI.x, y2: 16600, doska: 'yuqori', eshik: 'SR4', eskiRaqam: '10 va 15 (o\'rta qism)', koridor: 'K2',
    bolaklar: [{ x1: 19400, x2: ICHKI.x, y1: 7800, y2: 9400 }, { x1: 18150, x2: ICHKI.x, y1: 9400, y2: 15000 }, { x1: 19400, x2: ICHKI.x, y1: 15000, y2: 16600 }],
    kontur: [[19400, 7800], [ICHKI.x, 7800], [ICHKI.x, 16600], [19400, 16600], [19400, 15000], [18150, 15000], [18150, 9400], [19400, 9400]],
    sinf: { sxema: [[2, 2, 2], [2, 2, 2], [2, 2, 2], [0, 0, 2]] } },
  { kod: 'SR5', nomi: 'Study Room 5', tur: 'sinf', x1: 18150, y1: 16700, x2: ICHKI.x, y2: ICHKI.y, doska: 'yuqori', eshik: 'SR5', eskiRaqam: '15', koridor: 'K2' },
  { kod: 'SR6', nomi: 'Study Room 6', tur: 'sinf', x1: 12150, y1: 16700, x2: 17950, y2: ICHKI.y, doska: 'yuqori', eshik: 'SR6', eskiRaqam: '14', koridor: 'K2' },
  { kod: 'SR7', nomi: 'Study Room 7', tur: 'sinf', x1: 6150, y1: 16700, x2: 11950, y2: ICHKI.y, doska: 'yuqori', eshik: 'SR7', eskiRaqam: '13', koridor: 'K2' },
  { kod: 'XZ1', nomi: 'Xizmat xonasi 1', tur: 'xizmat', x1: 6250, y1: 9400, x2: 9050, y2: 15000, eshik: 'XZ1', eskiRaqam: '8, 13' },
  { kod: 'XZ2', nomi: 'Xizmat xonasi 2', tur: 'xizmat', x1: 9150, y1: 9400, x2: 11950, y2: 15000, eshik: 'XZ2', eskiRaqam: '8, 13' },
  { kod: 'XZ3', nomi: 'Xizmat xonasi 3', tur: 'xizmat', x1: 12150, y1: 9400, x2: 15000, y2: 15000, eshik: 'XZ3', eskiRaqam: '9, 14' },
  { kod: 'XZ4', nomi: 'Xizmat xonasi 4', tur: 'xizmat', x1: 15100, y1: 9400, x2: 17950, y2: 15000, eshik: 'XZ4', eskiRaqam: '9, 14' },
  { kod: 'KW', nomi: 'Koworking / Tadbirlar zali', tur: 'koworking', x1: 0, y1: 6500, x2: 5950, y2: 18350, eskiRaqam: '7, 11' },
  { kod: 'ADM', nomi: 'Admin va sotuv', tur: 'ofis', x1: 0, y1: 21450, x2: 5950, y2: ICHKI.y, eshik: 'ADM', eskiRaqam: '12', qotgan: true },
  { kod: 'K1', nomi: 'Koridor 1500', tur: 'koridor', x1: 5950, y1: 7800, x2: 19300, y2: 9300 },
  { kod: 'K2', nomi: 'Koridor 1500', tur: 'koridor', x1: 5950, y1: 15100, x2: 19300, y2: 16600 },
  { kod: 'ZL', nomi: 'Kirish zali', tur: 'koridor', x1: 3650, y1: 18350, x2: 5950, y2: 21250 },
  { kod: 'ZN1', nomi: 'Zina 1 (zaxira)', tur: 'zina', x1: 0, y1: 0, x2: 3000, y2: 6300, qotgan: true, chizmaMaydon: 18.79 },
  { kod: 'ZN2', nomi: 'Zina 2 (asosiy)', tur: 'zina', x1: 0, y1: 18450, x2: 3650, y2: 21250, qotgan: true },
  { kod: '2', nomi: '', tur: 'sanuzel', x1: 3100, y1: 0, x2: 4350, y2: 1600, qotgan: true, chizmaMaydon: 2.00 },
  { kod: '3', nomi: '', tur: 'sanuzel', x1: 4450, y1: 0, x2: 5900, y2: 1600, qotgan: true, chizmaMaydon: 2.24 },
  { kod: '4', nomi: '', tur: 'sanuzel', x1: 3100, y1: 1700, x2: 4350, y2: 3850, qotgan: true, chizmaMaydon: 2.68 },
  { kod: '5', nomi: '', tur: 'sanuzel', x1: 4450, y1: 1700, x2: 5900, y2: 3850, qotgan: true, chizmaMaydon: 3.01 },
  { kod: '6', nomi: '', tur: 'sanuzel', x1: 3100, y1: 3950, x2: 5900, y2: 6300, qotgan: true, chizmaMaydon: 6.54 },
];

// Xonaning to'rtburchak bo'laklari (4-xona L-shaklida)
export const bolaklar = x => x.bolaklar || [{ x1: x.x1, x2: x.x2, y1: x.y1, y2: x.y2 }];

// Mavjud holat chizmasidagi xonalar (1-varaq uchun)
export const ESKI_XONALAR = [
  ['1', 18.79, 1500, 3150], ['2', 2.00, 3725, 800], ['3', 2.24, 5175, 800], ['4', 2.68, 3725, 2775],
  ['5', 3.01, 5175, 2775], ['6', 6.54, 4500, 5100], ['7', 33.88, 2975, 9350], ['8', null, 9100, 6100],
  ['9', 70.56, 15050, 6100], ['10', 69.99, 21025, 6100], ['11', 52.48, 2975, 15400], ['12', 17.37, 2975, 22925],
  ['13', 69.40, 9050, 18900], ['14', 69.40, 15050, 18900], ['15', 68.84, 21025, 18900],
];

// ---------- Jihozlar ----------
function joylash(xona) {
  const s = { ...STANDART, doskaEni: 3000, ...(xona.sinf || {}) };
  const W = xona.x2 - xona.x1;
  const blokEni = s.bloklar.reduce((t, n) => t + n * PARTA.eni, 0) + (s.bloklar.length - 1) * s.yolak;
  const u0 = (W - blokEni) / 2;
  const L = (u1, u2, v1, v2) => xona.doska === 'yuqori'
    ? { x1: xona.x1 + u1, x2: xona.x1 + u2, y1: xona.y1 + v1, y2: xona.y1 + v2 }
    : { x1: xona.x1 + u1, x2: xona.x1 + u2, y1: xona.y2 - v2, y2: xona.y2 - v1 };
  const partalar = [], stullar = [];
  const sxema = s.sxema || Array.from({ length: s.qatorlar }, () => s.bloklar);
  s.qatorlar = sxema.length;
  sxema.forEach((qator, q) => {
    const v = s.doska + q * s.qadam;
    let u = u0;
    s.bloklar.forEach((n, bi) => {
      for (let i = 0; i < n; i++) {
        if (i < qator[bi]) {
          partalar.push({ ...L(u, u + PARTA.eni, v, v + PARTA.chuq), qator: q + 1, blok: bi });
          const su = u + (PARTA.eni - STUL.eni) / 2;
          const sv = v + PARTA.chuq + STUL.oraliq;
          stullar.push({ ...L(su, su + STUL.eni, sv, sv + STUL.chuq), qator: q + 1 });
        }
        u += PARTA.eni;
      }
      u += s.yolak;
    });
  });
  const dc = W / 2;
  const doska = { ...L(dc - s.doskaEni / 2, dc + s.doskaEni / 2, 0, 60) };
  // o'qituvchi stoli — eshikka qarama-qarshi old burchakda
  const esh = ESHIKLAR.find(x => x.kod === xona.eshik);
  const eshikChapda = esh.devor === 'h' ? (esh.a + esh.b) / 2 < (xona.x1 + xona.x2) / 2 : esh.yuz < (xona.x1 + xona.x2) / 2;
  const tu = eshikChapda ? W - 150 - 1200 : 150;
  const ustozStoli = L(tu, tu + 1200, 700, 1300);
  const ustozStuli = L(tu + 375, tu + 825, 220, 670);
  return { s, W, blokEni, u0, partalar, stullar, doska, ustozStoli, ustozStuli };
}

export function sinflar() {
  return XONALAR.filter(x => x.tur === 'sinf').map(x => ({ ...x, j: joylash(x) }));
}

// Admin xonasi: 4 ish o'rni + mijozlar uchun stullar
export const ADM_JIHOZ = (() => {
  const stol = [], stul = [];
  [350, 1700, 3050, 4400].forEach(x => {
    stol.push({ x1: x, x2: x + 1200, y1: 22800, y2: 23400 });
    stul.push({ x1: x + 375, x2: x + 825, y1: 23450, y2: 23900, tur: 'xodim' });
    stul.push({ x1: x + 375, x2: x + 825, y1: 22250, y2: 22700, tur: 'mijoz' });
  });
  return { stol, stul };
})();

// Xizmat xonalari: stol, ofis stuli, 2 ta mehmon stuli, shkaf
export const XIZMAT_JIHOZ = XONALAR.filter(x => x.tur === 'xizmat').map(x => ({
  kod: x.kod,
  stol: { x1: x.x1 + 250, x2: x.x1 + 1650, y1: x.y2 - 1650, y2: x.y2 - 950 },
  stul: { x1: x.x1 + 725, x2: x.x1 + 1175, y1: x.y2 - 900, y2: x.y2 - 450, tur: 'xodim' },
  mehmon: [{ x1: x.x1 + 400, x2: x.x1 + 850, y1: x.y2 - 2250, y2: x.y2 - 1800 }, { x1: x.x1 + 1050, x2: x.x1 + 1500, y1: x.y2 - 2250, y2: x.y2 - 1800 }],
  shkaf: { x1: x.x2 - 450, x2: x.x2, y1: 12600, y2: x.y2 - 300 },
}));

// Koworking / tadbirlar zali. O'ng tomonda (x 4300–5950) o'tish yo'lagi bo'sh qoladi:
// sanuzel eshigi, K1/K2 koridorlari va kirish zali shu yo'lak orqali bog'lanadi.
const stul4 = (cx, cy) => [
  { x1: cx - 225, x2: cx + 225, y1: cy - 950, y2: cy - 500, yon: 'n' }, { x1: cx - 225, x2: cx + 225, y1: cy + 500, y2: cy + 950, yon: 's' },
  { x1: cx - 950, x2: cx - 500, y1: cy - 225, y2: cy + 225, yon: 'w' }, { x1: cx + 500, x2: cx + 950, y1: cy - 225, y2: cy + 225, yon: 'e' },
];
export const KW_KUNDALIK = {
  stollar: [
    { x1: 900, x2: 3300, y1: 7400, y2: 8400 },
    { x1: 900, x2: 1900, y1: 10000, y2: 13200 },
  ],
  dumaloq: [[1150, 14800], [3250, 14800], [1150, 16800], [3250, 16800]].map(([cx, cy]) => ({ cx, cy, r: 450, x1: cx - 450, x2: cx + 450, y1: cy - 450, y2: cy + 450 })),
  stullar: [
    ...[1300, 2100, 2900].flatMap(cx => [{ x1: cx - 225, x2: cx + 225, y1: 6900, y2: 7350, yon: 'n' }, { x1: cx - 225, x2: cx + 225, y1: 8450, y2: 8900, yon: 's' }]),
    ...[10300, 11100, 11900, 12700].flatMap(y => [{ x1: 400, x2: 850, y1: y, y2: y + 450, yon: 'w' }, { x1: 1950, x2: 2400, y1: y, y2: y + 450, yon: 'e' }]),
    ...[[1150, 14800], [3250, 14800], [1150, 16800], [3250, 16800]].flatMap(([cx, cy]) => stul4(cx, cy)),
  ],
  divan: [{ x1: 3400, x2: 4250, y1: 10800, y2: 12800 }],
  kreslo: [{ x1: 2650, x2: 3350, y1: 9900, y2: 10600 }, { x1: 2650, x2: 3350, y1: 13000, y2: 13700 }],
  jurnal: [{ x1: 2750, x2: 3250, y1: 11300, y2: 12300 }],
  shkaf: [{ x1: 300, x2: 3300, y1: 17950, y2: 18350 }],
};
// Tadbirlar rejimi: 11 qator × 6 stul, ekran yuqori devorda
export const KW_TADBIR = {
  stullar: Array.from({ length: 11 }, (_, r) => [400, 900, 1400, 2600, 3100, 3600].map(x => ({ x1: x, x2: x + 450, y1: 8300 + r * 900, y2: 8750 + r * 900, yon: 'n' }))).flat(),
  ekran: { x1: 650, x2: 3800, y1: 6500, y2: 6580 },
  minbar: { x1: 3950, x2: 4300, y1: 7000, y2: 7500 },
};

export const maydon = r => (r.x2 - r.x1) * (r.y2 - r.y1) / 1e6;
