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

const ichki = [
  // 2-o'q (B-o'q) — yuqori qism
  d(5950, 6250, 6500, 7400, 'mavjud'), d(5950, 6250, 7400, 10000, 'yangi', 'bo\'shliq yopiladi'),
  d(5950, 6250, 10000, 12100, 'mavjud'),
  // o'rta devor (C o'qi) — SR1–SR3 va K1 orasida
  d(6250, 6450, 12200, 12400, 'mavjud'), d(6450, 7350, 12200, 12400, 'buziladi', 'SR1 eshigi'),
  d(7350, 11850, 12200, 12400, 'mavjud'),
  d(12250, 12350, 12200, 12400, 'mavjud'), d(12350, 13250, 12200, 12400, 'buziladi', 'SR2 eshigi'),
  d(13250, 17850, 12200, 12400, 'mavjud'),
  d(18250, 18350, 12200, 12400, 'mavjud'), d(18350, 19000, 12200, 12400, 'buziladi', 'SR3 eshigi'),
  d(19250, 20500, 12200, 12400, 'yangi', 'bo\'shliq yopiladi'),
  d(20500, ICHKI.x, 12200, 12400, 'mavjud'),
  d(0, 4200, 12200, 12400, 'buziladi', '7 va 11-xonalar orasidagi devor'),
  // 3 va 4-o'qlar — yuqori qism
  d(11950, 12150, 0, 7700, 'mavjud'), d(11950, 12150, 7700, 10300, 'yangi', 'bo\'shliq yopiladi'),
  d(11950, 12150, 10300, 12100, 'mavjud'),
  d(17950, 18150, 0, 7900, 'mavjud'), d(17950, 18150, 7900, 10400, 'yangi', 'bo\'shliq yopiladi'),
  d(17950, 18150, 10400, 12100, 'mavjud'),
  // 2, 3, 4-o'qlar — pastki qism
  d(5950, 6150, 12500, 13900, 'buziladi', 'koridor tutashuvi'),
  d(5950, 6150, 13900, 16200, 'mavjud'), d(5950, 6150, 16200, 18250, 'yangi', 'bo\'shliq yopiladi'),
  d(5950, 6150, 18650, 21250, 'yangi', 'bo\'shliq yopiladi'), d(5950, 6150, 21250, ICHKI.y, 'mavjud'),
  d(11950, 12150, 12500, 13900, 'buziladi', 'koridor'), d(11950, 12150, 14000, 18850, 'mavjud'),
  d(11950, 12150, 18850, 21600, 'yangi', 'bo\'shliq yopiladi'), d(11950, 12150, 21600, ICHKI.y, 'mavjud'),
  d(17950, 18150, 12500, 13900, 'buziladi', 'koridor'), d(17950, 18150, 14000, 18850, 'mavjud'),
  d(17950, 18150, 18850, 21600, 'yangi', 'bo\'shliq yopiladi'), d(17950, 18150, 21600, ICHKI.y, 'mavjud'),
  // K1 koridorining janubiy devori (SR4–SR6 doskalari shu devorda)
  d(6150, 6350, 13900, 14000, 'yangi'), d(7250, 12350, 13900, 14000, 'yangi'),
  d(13250, 18350, 13900, 14000, 'yangi'), d(19250, ICHKI.x, 13900, 14000, 'yangi'),
  // SR7 va K2 koridori orasidagi devor
  d(4350, 4450, 6500, 16950, 'yangi'), d(4350, 4450, 17850, 18350, 'yangi'),
  d(3650, 4450, 18350, 18450, 'yangi'),
];

export const DEVORLAR = [...tashqi, ...qotgan, ...ichki];

// ---------- Eshiklar ----------
// devor: 'h' (gorizontal devorda, a..b bo'yicha X) yoki 'v' (vertikal devorda, a..b bo'yicha Y).
// yuz — eshik polotnosi ochiladigan tomondagi devor yuzasi koordinatasi; yon: +1/-1 ochilish yo'nalishi.
// ilgak: 'a' | 'b' — qaysi uchida ilgak.
const e = (kod, devor, a, b, yuz, yon, ilgak, holat = 'yangi') => ({ kod, devor, a, b, yuz, yon, ilgak, holat, en: b - a });
export const ESHIKLAR = [
  e('SR1', 'h', 6450, 7350, 12200, -1, 'a'),
  e('SR2', 'h', 12350, 13250, 12200, -1, 'a'),
  e('SR3', 'h', 18350, 19250, 12200, -1, 'a'),
  e('SR4', 'h', 6350, 7250, 14000, +1, 'a'),
  e('SR5', 'h', 12350, 13250, 14000, +1, 'a'),
  e('SR6', 'h', 18350, 19250, 14000, +1, 'a'),
  e('SR7', 'v', 16950, 17850, 4350, -1, 'b'),
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
export const XONALAR = [
  { kod: 'SR1', nomi: 'Study Room 1', tur: 'sinf', x1: 6250, y1: 0, x2: 11950, y2: 12200, doska: 'past', eshik: 'SR1', eskiRaqam: '8' },
  { kod: 'SR2', nomi: 'Study Room 2', tur: 'sinf', x1: 12150, y1: 0, x2: 17950, y2: 12200, doska: 'past', eshik: 'SR2', eskiRaqam: '9' },
  { kod: 'SR3', nomi: 'Study Room 3', tur: 'sinf', x1: 18150, y1: 0, x2: ICHKI.x, y2: 12200, doska: 'past', eshik: 'SR3', eskiRaqam: '10' },
  { kod: 'SR4', nomi: 'Study Room 4', tur: 'sinf', x1: 6150, y1: 14000, x2: 11950, y2: ICHKI.y, doska: 'yuqori', eshik: 'SR4', eskiRaqam: '13' },
  { kod: 'SR5', nomi: 'Study Room 5', tur: 'sinf', x1: 12150, y1: 14000, x2: 17950, y2: ICHKI.y, doska: 'yuqori', eshik: 'SR5', eskiRaqam: '14' },
  { kod: 'SR6', nomi: 'Study Room 6', tur: 'sinf', x1: 18150, y1: 14000, x2: ICHKI.x, y2: ICHKI.y, doska: 'yuqori', eshik: 'SR6', eskiRaqam: '15' },
  { kod: 'SR7', nomi: 'Study Room 7', tur: 'sinf', x1: 0, y1: 6500, x2: 4350, y2: 18350, doska: 'yuqori', eshik: 'SR7', eskiRaqam: '7, 11',
    sinf: { bloklar: [2, 3], qatorlar: 4, doskaEni: 2400 } },
  { kod: 'ADM', nomi: 'Admin va sotuv', tur: 'ofis', x1: 0, y1: 21450, x2: 5950, y2: ICHKI.y, eshik: 'ADM', eskiRaqam: '12', qotgan: true },
  { kod: 'K1', nomi: 'Koridor 1500', tur: 'koridor', x1: 5950, y1: 12400, x2: ICHKI.x, y2: 13900 },
  { kod: 'K2', nomi: 'Koridor 1500', tur: 'koridor', x1: 4450, y1: 6500, x2: 5950, y2: 18450 },
  { kod: 'ZL', nomi: 'Zina oldi zali', tur: 'koridor', x1: 3650, y1: 18450, x2: 5950, y2: 21250 },
  { kod: 'ZN1', nomi: 'Zina 1 (zaxira)', tur: 'zina', x1: 0, y1: 0, x2: 3000, y2: 6300, qotgan: true, chizmaMaydon: 18.79 },
  { kod: 'ZN2', nomi: 'Zina 2 (asosiy)', tur: 'zina', x1: 0, y1: 18450, x2: 3650, y2: 21250, qotgan: true },
  { kod: '2', nomi: '', tur: 'sanuzel', x1: 3100, y1: 0, x2: 4350, y2: 1600, qotgan: true, chizmaMaydon: 2.00 },
  { kod: '3', nomi: '', tur: 'sanuzel', x1: 4450, y1: 0, x2: 5900, y2: 1600, qotgan: true, chizmaMaydon: 2.24 },
  { kod: '4', nomi: '', tur: 'sanuzel', x1: 3100, y1: 1700, x2: 4350, y2: 3850, qotgan: true, chizmaMaydon: 2.68 },
  { kod: '5', nomi: '', tur: 'sanuzel', x1: 4450, y1: 1700, x2: 5900, y2: 3850, qotgan: true, chizmaMaydon: 3.01 },
  { kod: '6', nomi: '', tur: 'sanuzel', x1: 3100, y1: 3950, x2: 5900, y2: 6300, qotgan: true, chizmaMaydon: 6.54 },
];

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
  for (let q = 0; q < s.qatorlar; q++) {
    const v = s.doska + q * s.qadam;
    let u = u0;
    s.bloklar.forEach((n, bi) => {
      for (let i = 0; i < n; i++) {
        partalar.push({ ...L(u, u + PARTA.eni, v, v + PARTA.chuq), qator: q + 1, blok: bi });
        const su = u + (PARTA.eni - STUL.eni) / 2;
        const sv = v + PARTA.chuq + STUL.oraliq;
        stullar.push({ ...L(su, su + STUL.eni, sv, sv + STUL.chuq), qator: q + 1 });
        u += PARTA.eni;
      }
      u += s.yolak;
    });
  }
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

export const maydon = r => (r.x2 - r.x1) * (r.y2 - r.y1) / 1e6;
