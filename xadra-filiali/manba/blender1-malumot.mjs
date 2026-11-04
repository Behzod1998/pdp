// 1-qavat geometriyasi Blender uchun (JSON). Ishlatish: node blender1-malumot.mjs > 1qavat.json
import { BINO1, DEVOR1, USTUN1, ESHIK1, ZINA1, TAMBUR, RESEPSHN, TURNIKET, MEHMON } from './qavat1.mjs';

// ikki tavaqali eshik: har bir tavaqa uchun qalinlik — o'sha teshik chetidagi devordan
const teshik = { ichki: [3350, 4850], tashqi: [2880, 4290] };
console.log(JSON.stringify({
  bino: BINO1, devorlar: DEVOR1, ustunlar: USTUN1, zina: ZINA1, tambur: TAMBUR, resepshn: RESEPSHN, turniket: TURNIKET, mehmon: MEHMON,
  eshiklar: ESHIK1.map(e => {
    const [a, b] = teshik[e.kod.split('-')[0]];
    const d = DEVOR1.find(w => w.y1 <= e.yuz && e.yuz <= w.y2 && (w.x2 === a || w.x1 === b));
    return { ...e, shisha: true, qalinlik: d ? [d.y1, d.y2] : null, teshik: [a, b] };
  }),
}));
