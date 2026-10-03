// Xarajatlar jadvali uchun ma'lumot: har bir yangi devorning qaysi xonaga qaragan yuzlari va uzunligi,
// yangi eshiklar, sinflar, ofis xonalari va CEO xonasidagi bambuk panel devorlari. Natija JSON — xarajatlar.py o'qiydi.
import { DEVORLAR, XONALAR, ESHIKLAR, bolaklar, lokal } from './model.mjs';
const xonalar = XONALAR.flatMap(x => bolaklar(x).map(b => ({ kod: x.kod, ...b })));
const ustma = (a1, a2, b1, b2) => Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
const yuzlar = w => {
  const gor = w.x2 - w.x1 > w.y2 - w.y1;
  const r = [];
  for (const x of xonalar) {
    let l = 0, tomon = '';
    if (gor) {
      if (x.y2 === w.y1) { l = ustma(w.x1, w.x2, x.x1, x.x2); tomon = 'yuqori'; }
      if (x.y1 === w.y2) { l = ustma(w.x1, w.x2, x.x1, x.x2); tomon = 'past'; }
    } else {
      if (x.x2 === w.x1) { l = ustma(w.y1, w.y2, x.y1, x.y2); tomon = 'chap'; }
      if (x.x1 === w.x2) { l = ustma(w.y1, w.y2, x.y1, x.y2); tomon = 'ong'; }
    }
    // a1..a2 — yuzning devor bo'ylab oralig'i (qarshi tomondagi xonani topish uchun)
    const [a1, a2] = gor ? [Math.max(w.x1, x.x1), Math.min(w.x2, x.x2)] : [Math.max(w.y1, x.y1), Math.min(w.y2, x.y2)];
    if (l > 0) r.push({ kod: x.kod, l, tomon, a1, a2 });
  }
  return r;
};
const out = DEVORLAR.filter(w => w.holat === 'yangi').map(w => ({
  x1: w.x1, x2: w.x2, y1: w.y1, y2: w.y2, shisha: !!w.shisha, izoh: w.izoh,
  uz: Math.max(w.x2 - w.x1, w.y2 - w.y1), yuz: yuzlar(w),
}));
const esh = ESHIKLAR.filter(e => e.holat === 'yangi').map(e => ({ kod: e.kod, en: e.en, shisha: !!e.shisha }));
// bambuk panel: sinfning doska devori va orqa devori (4-xonada orqa devor — L shaklining keng qismi, 5.6 m)
const sinflar = XONALAR.filter(x => x.tur === 'sinf').map(x => {
  const W = lokal(x).W;
  const orqa = x.kod === 'SR4' ? 15000 - 9400 : W;
  return { kod: x.kod, doskaDevor: W, orqaDevor: orqa, koridor: x.koridor };
});
// bambuk panel ofis xonalarida va CEO xonasida — sinflardagi kabi ikkita devor:
// ofis xonalarida ikkala uzun yon devor (2.8 × 5.6 m xonada 5.6 m lik devorlar, eshik ularda yo'q);
// CEO xonasida ikkita ichki kar devor (derazali tashqi devorlarga qilinmaydi), eshik o'rni ayiriladi.
const xona = kod => XONALAR.find(r => r.kod === kod);
const uzun = kod => xona(kod).y2 - xona(kod).y1;
const ofislar = [
  { kod: 'XZ1', devorlar: [{ nom: "Koworking bilan orasidagi devor", uz: uzun('XZ1') }, { nom: "Admin (XZ2) bilan orasidagi devor", uz: uzun('XZ1') }] },
  { kod: 'XZ2', devorlar: [{ nom: "Offline sotuv (XZ1) bilan orasidagi devor", uz: uzun('XZ2') }, { nom: "Ustozlar xonasi (XZ3) bilan orasidagi devor", uz: uzun('XZ2') }] },
  { kod: 'XZ3', devorlar: [{ nom: "Admin (XZ2) bilan orasidagi devor", uz: uzun('XZ3') }, { nom: "Call-markaz (XZ4) bilan orasidagi devor", uz: uzun('XZ3') }] },
  { kod: 'XZ4', devorlar: [{ nom: "Ustozlar xonasi (XZ3) bilan orasidagi devor", uz: uzun('XZ4') }, { nom: "4-xona bilan orasidagi devor", uz: uzun('XZ4') }] },
  { kod: 'X12', devorlar: [
    { nom: "Zinapoya va kirish zali bilan orasidagi devor (eshikli)", uz: xona('X12').x2 - xona('X12').x1, eshik: true },
    { nom: "7-xona bilan orasidagi devor", uz: xona('X12').y2 - xona('X12').y1 }] },
];
console.log(JSON.stringify({ devorlar: out, eshiklar: esh, sinflar, ofislar }, null, 0));
