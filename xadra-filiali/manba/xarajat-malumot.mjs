// Xarajatlar jadvali uchun ma'lumot: har bir yangi devorning qaysi xonaga qaragan yuzlari va uzunligi,
// yangi eshiklar, sinflardagi bambuk panel devorlari. Natija JSON — xarajatlar.py o'qiydi.
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
console.log(JSON.stringify({ devorlar: out, eshiklar: esh, sinflar }, null, 0));
