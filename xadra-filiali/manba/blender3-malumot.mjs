// 3-qavat geometriyasi Blender uchun (JSON): devorlar, eshiklar, derazalar, 5-xona jihozlari, hojatxona jihozlari.
// Ishlatish: node blender3-malumot.mjs > 3qavat.json  (blender3.py shu faylni o'qiydi)
import { BINO3, DEVOR3, KABINA, KABINA_DEVOR, DERAZA3, ESHIK3, XONA3, SINF3, sinf3, WC3 } from './qavat3.mjs';

// eshik o'rnidagi devor qalinligi: eshik chetiga tutashgan devor bo'lagidan olinadi
function qalinlik(e) {
  if (e.kabina) return null;
  const d = DEVOR3.find(w => e.devor === 'v'
    ? w.x1 <= e.yuz && e.yuz <= w.x2 && (w.y2 === e.a || w.y1 === e.b)
    : w.y1 <= e.yuz && e.yuz <= w.y2 && (w.x2 === e.a || w.x1 === e.b));
  return d && (e.devor === 'v' ? [d.x1, d.x2] : [d.y1, d.y2]);
}

const s = sinf3();
console.log(JSON.stringify({
  bino: BINO3, sinf: SINF3, kabina: KABINA,
  devorlar: DEVOR3, kabinaDevor: KABINA_DEVOR, derazalar: DERAZA3,
  eshiklar: ESHIK3.map(e => ({ ...e, qalinlik: qalinlik(e) })),
  xonalar: XONA3.map(x => ({ kod: x.kod, tur: x.tur, bolaklar: x.bolaklar || [{ x1: x.x1, x2: x.x2, y1: x.y1, y2: x.y2 }] })),
  partalar: s.partalar, stullar: s.stullar, doska: s.doska, ustozStoli: s.ustozStoli, ustozStuli: s.ustozStuli,
  wc: WC3,
}, null, 1));
