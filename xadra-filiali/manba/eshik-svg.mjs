// Suriladigan eshik (founder, 16.10: 1 m, Damas eshigi kabi) — rejadagi belgi: yopiq barg (to'liq), ochiq holati (punktir),
// surilish yo'nalishi (strelka) va relsli yo'naltiruvchi. Barg xona ichida, devor bo'ylab yuradi. Barcha reja chizmalari uchun.
import { surmaBarg, SURMA } from './model.mjs';

export function surmaEshikSvg(e, { rang = '#2f7fbf', fon = '#cfe3f2', k = 1, strelka = true } = {}) {
  const a = surmaBarg(e), b = surmaBarg(e, true);
  const yR = e.yuz + e.yon * (SURMA.oraliq + SURMA.barg + 12);            // rels — barg ortida (xona tomonda)
  const rx1 = Math.min(a.x1, b.x1), rx2 = Math.max(a.x2, b.x2);
  const q = [
    `<line x1="${rx1}" y1="${yR}" x2="${rx2}" y2="${yR}" stroke="${rang}" stroke-width="${8 * k}"/>`,
    `<rect x="${b.x1}" y="${b.y1}" width="${b.x2 - b.x1}" height="${b.y2 - b.y1}" fill="none" stroke="${rang}" stroke-width="${7 * k}" stroke-dasharray="${35 * k} ${22 * k}"/>`,
    `<rect x="${a.x1}" y="${a.y1}" width="${a.x2 - a.x1}" height="${a.y2 - a.y1}" fill="${fon}" stroke="${rang}" stroke-width="${10 * k}"/>`,
  ];
  if (strelka) {
    const s = e.park === 'a' ? -1 : 1, y = e.yuz + e.yon * (SURMA.oraliq + SURMA.barg + 170);
    const x1 = (e.a + e.b) / 2 - s * 180, x2 = (e.a + e.b) / 2 + s * 420, h = 70 * k;
    q.push(`<line x1="${x1}" y1="${y}" x2="${x2 - s * h}" y2="${y}" stroke="${rang}" stroke-width="${10 * k}"/>`,
      `<path d="M${x2},${y} L${x2 - s * h * 1.6},${y - h * 0.7} L${x2 - s * h * 1.6},${y + h * 0.7} z" fill="${rang}"/>`);
  }
  return q.join('');
}
