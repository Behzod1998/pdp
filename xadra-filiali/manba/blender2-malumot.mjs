// 2-qavat geometriyasi Blender uchun (JSON): devorlar, derazalar, ustunlar, eshiklar, zinalar, xonalar, sinf jihozlari,
// xizmat xonalari va koworking mebeli, koridor logotiplari va doskalar.
// Ishlatish: node blender2-malumot.mjs > 2qavat.json  (blender2.py shu faylni o'qiydi)
import {
  ICHKI, DEVOR, H, DEVORLAR, DERAZALAR, USTUNLAR, ESHIKLAR, ZINALAR, XONALAR, XIZMAT_JIHOZ, KW_KUNDALIK,
  KORIDOR_LOGO, DOSKALAR, AYOLLAR_WC, KW_SAHNA, sinflar, bolaklar,
} from './model.mjs';

// eshik o'rnidagi devor qalinligi: eshik chetiga tutashgan devor bo'lagidan
function qalinlik(e) {
  const d = DEVORLAR.find(w => w.holat !== 'buziladi' && (e.devor === 'v'
    ? w.x1 <= e.yuz && e.yuz <= w.x2 && (w.y2 === e.a || w.y1 === e.b)
    : w.y1 <= e.yuz && e.yuz <= w.y2 && (w.x2 === e.a || w.x1 === e.b)));
  return d && (e.devor === 'v' ? [d.x1, d.x2] : [d.y1, d.y2]);
}

console.log(JSON.stringify({
  ichki: ICHKI, devor: DEVOR, H,
  devorlar: DEVORLAR.filter(w => w.holat !== 'buziladi'),
  derazalar: DERAZALAR, ustunlar: USTUNLAR, zinalar: ZINALAR,
  eshiklar: ESHIKLAR.map(e => ({ ...e, qalinlik: qalinlik(e) })),
  xonalar: XONALAR.map(x => ({ kod: x.kod, tur: x.tur, nomi: x.nomi, doska: x.doska || null, x1: x.x1, x2: x.x2, y1: x.y1, y2: x.y2, bolaklar: bolaklar(x) })),
  sinflar: sinflar().map(x => ({ kod: x.kod, doska: x.doska, x1: x.x1, x2: x.x2, y1: x.y1, y2: x.y2, bolaklar: bolaklar(x),
    partalar: x.j.partalar, stullar: x.j.stullar, doskaR: x.j.doska, ustozStoli: x.j.ustozStoli, ustozStuli: x.j.ustozStuli })),
  xizmat: XIZMAT_JIHOZ, kw: KW_KUNDALIK, logo: KORIDOR_LOGO, doskalar: DOSKALAR, sahna: KW_SAHNA,
  osimlik: [[23550, 9750], [23500, 16200], [8750, 10600], [11550, 11700], [14700, 9800], [17550, 11900], [3900, 13950], [3700, 17650], [5650, 24050]],
  sanuzel: { unitaz: AYOLLAR_WC.unitaz, rakovina: AYOLLAR_WC.rakovina },
}));
