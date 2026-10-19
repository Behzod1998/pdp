// 2-qavat rejasi — rangsiz (oq-qora), mebelsiz (buyurtmachi, 17.10): xonalarga bo'lingan holati.
// Devorlar: mavjud va tashqi — qora; yangi GKL — shtrixli; shisha — ingichka qo'sh chiziq; eshiklar, derazalar, zinalar,
// ustunlar, doskalar; xona nomi, ichki o'lchami va maydoni; o'lcham zanjirlari. build.mjs → Xadra_2-qavat_reja_rangsiz (A3 portret).
import {
  LOYIHA, H, ICHKI, DEVOR, DEVORLAR, DERAZALAR, USTUNLAR, ESHIKLAR, ZINALAR, XONALAR, PANJARA, KW_SAHNA, sinflar, lokal, wcJihozlari,
} from './model.mjs';
import { eshikSektori, korsatkichlar, xonaMaydoni } from './tekshiruv.mjs';
import { surmaEshikSvg } from './eshik-svg.mjs';
import { zanjir } from './ish-chizma.mjs';

const Q = '#111';
const R = (r, a) => `<rect x="${r.x1}" y="${r.y1}" width="${r.x2 - r.x1}" height="${r.y2 - r.y1}" ${a}/>`;
const L = (x1, y1, x2, y2, a) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${a}/>`;
const T = (x, y, s, size, a = '') => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" fill="${Q}" font-family="Liberation Sans, Arial, sans-serif" paint-order="stroke" stroke="#fff" stroke-width="${size * 0.25}" stroke-linejoin="round" ${a}>${s}</text>`;
const olch = x => `${((x.x2 - x.x1) / 1000).toFixed(2)} × ${((x.y2 - x.y1) / 1000).toFixed(2)} m`;

export const VB_RANGSIZ = { x1: -2350, y1: -2400, x2: 25450, y2: 25900 };

export function rangsizSvg({ vb = VB_RANGSIZ, olchamMm = false } = {}) {
  const q = [`<defs><pattern id="gkl" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="120" stroke="${Q}" stroke-width="16"/></pattern></defs>`];
  q.push(R(vb, 'fill="#fff"'));
  // zinalar
  ZINALAR.forEach(z => {
    z.marshlar.forEach(m => {
      q.push(R(m, `fill="none" stroke="${Q}" stroke-width="8"`));
      if (m.yo === 'y') for (let y = m.y1 + 280; y < m.y2; y += 280) q.push(L(m.x1, y, m.x2, y, `stroke="#444" stroke-width="6"`));
      else for (let x = m.x1 + 270; x < m.x2; x += 270) q.push(L(x, m.y1, x, m.y2, `stroke="#444" stroke-width="6"`));
    });
    const s = z.strelka;
    q.push(L(s.x, s.y1, s.x, s.y2 - 150, `stroke="${Q}" stroke-width="16"`), `<path d="M${s.x - 100},${s.y2 - 190} L${s.x},${s.y2} L${s.x + 100},${s.y2 - 190}" fill="none" stroke="${Q}" stroke-width="16"/>`);
  });
  PANJARA.forEach(p => {
    q.push(L(p.x1, p.y, p.x2, p.y, `stroke="${Q}" stroke-width="30"`));
    for (let x = p.x1 + 150; x < p.x2; x += 450) q.push(R({ x1: x - 40, x2: x + 40, y1: p.y - 40, y2: p.y + 40 }, `fill="${Q}"`));
  });
  // sanuzel jihozlari (unitaz, rakovina) — kontur
  wcJihozlari().forEach(p => q.push(R(p, `rx="${p.tur === 'unitaz' ? 150 : 80}" fill="#fff" stroke="${Q}" stroke-width="8"`)));
  // doskalar — devordagi ingichka to'rtburchak
  sinflar().forEach(x => {
    const Lk = lokal(x), d = Lk.T(x.j.doska);
    q.push(R(Lk.R(d.u1, d.u2, d.v1, d.v1 + 80), `fill="#fff" stroke="${Q}" stroke-width="10"`));
  });
  // eshiklar
  ESHIKLAR.forEach(e => {
    if (e.surma) { q.push(surmaEshikSvg(e, { rang: Q, fon: '#fff', k: 1.3 })); return; }
    const s = eshikSektori(e);
    let leaf, arcEnd, sweep;
    if (e.devor === 'h') {
      leaf = { x: s.ilgak.x, y: e.yuz + e.yon * e.en }; arcEnd = { x: e.ilgak === 'a' ? e.b : e.a, y: e.yuz };
      sweep = (e.ilgak === 'a') === (e.yon > 0) ? 0 : 1;
    } else {
      leaf = { x: e.yuz + e.yon * e.en, y: s.ilgak.y }; arcEnd = { x: e.yuz, y: e.ilgak === 'a' ? e.b : e.a };
      sweep = (e.ilgak === 'a') === (e.yon > 0) ? 1 : 0;
    }
    q.push(L(s.ilgak.x, s.ilgak.y, leaf.x, leaf.y, `stroke="${Q}" stroke-width="14"`),
      `<path d="M${leaf.x},${leaf.y} A${e.en},${e.en} 0 0 ${sweep} ${arcEnd.x},${arcEnd.y}" fill="none" stroke="${Q}" stroke-width="6" stroke-dasharray="30 20"/>`);
  });
  // devorlar: mavjud va tashqi — qora; yangi GKL — shtrix; shisha — qo'sh chiziq
  DEVORLAR.filter(w => w.holat !== 'buziladi').forEach(w => {
    if (w.shisha) {
      const gor = w.x2 - w.x1 > w.y2 - w.y1;
      q.push(R(w, `fill="#fff" stroke="${Q}" stroke-width="8"`),
        gor ? L(w.x1, (w.y1 + w.y2) / 2, w.x2, (w.y1 + w.y2) / 2, `stroke="${Q}" stroke-width="5"`) : L((w.x1 + w.x2) / 2, w.y1, (w.x1 + w.x2) / 2, w.y2, `stroke="${Q}" stroke-width="5"`));
    } else if (w.holat === 'yangi') q.push(R(w, `fill="#fff" stroke="${Q}" stroke-width="10"`), R(w, 'fill="url(#gkl)"'));
    else q.push(R(w, `fill="${Q}"`));
  });
  q.push(R(KW_SAHNA.devor, `fill="#fff" stroke="${Q}" stroke-width="10"`), R(KW_SAHNA.devor, 'fill="url(#gkl)"'));   // sahna karkasi (GKL)
  DERAZALAR.forEach(d => {
    q.push(R(d, `fill="#fff" stroke="${Q}" stroke-width="7"`));
    if (d.devor === 'chap') { const m = (d.x1 + d.x2) / 2; q.push(L(m - 40, d.y1, m - 40, d.y2, `stroke="${Q}" stroke-width="5"`), L(m + 40, d.y1, m + 40, d.y2, `stroke="${Q}" stroke-width="5"`)); }
    else { const m = (d.y1 + d.y2) / 2; q.push(L(d.x1, m - 40, d.x2, m - 40, `stroke="${Q}" stroke-width="5"`), L(d.x1, m + 40, d.x2, m + 40, `stroke="${Q}" stroke-width="5"`)); }
  });
  USTUNLAR.forEach(u => q.push(u.holat === 'taxminiy' ? R(u, `fill="#fff" stroke="${Q}" stroke-width="14" stroke-dasharray="45 28"`) : R(u, `fill="${Q}"`)));

  // yozuvlar: nomi, ichki o'lchami, maydoni
  const kor = Object.fromEntries(korsatkichlar().map(z => [z.kod, z]));
  const X = kod => XONALAR.find(r => r.kod === kod);
  sinflar().forEach(x => {
    const cx = (x.x1 + x.x2) / 2, cy = (x.y1 + x.y2) / 2;
    q.push(T(cx, cy - 250, `${x.kod.slice(2)}-xona`, 520, 'font-weight="700"'), T(cx, cy + 200, olch(x), 300), T(cx, cy + 560, `${kor[x.kod].A.toFixed(1)} m²`, 300));
  });
  [['XZ1', 'Offline sotuv'], ['XZ2', 'Admin'], ['XZ3', 'Ustozlar xonasi'], ['XZ4', 'Call-markaz']].forEach(([kod, nom]) => {
    const x = X(kod), cx = (x.x1 + x.x2) / 2, cy = (x.y1 + x.y2) / 2;
    q.push(T(cx, cy - 120, nom, 330, 'font-weight="700"'), T(cx, cy + 250, `${olch(x)} · ${xonaMaydoni(x).toFixed(1)} m²`, 230));
  });
  const kw = X('KW'), x12 = X('X12');
  q.push(T(2975, 11900, 'Koworking /', 380, 'font-weight="700"'), T(2975, 12350, 'Tadbirlar zali', 380, 'font-weight="700"'), T(2975, 12800, `${olch(kw)} · ${xonaMaydoni(kw).toFixed(1)} m²`, 260));
  q.push(T(2975, 22700, 'CEO xonasi', 380, 'font-weight="700"'), T(2975, 23150, `${olch(x12)} · ${xonaMaydoni(x12).toFixed(1)} m²`, 260));
  q.push(T(1500, 5150, 'Zinapoya', 340, 'font-weight="700"'), T(1500, 5600, '18.79 m²', 280));
  q.push(T(4500, 2560, 'Ayollar WC', 250, 'font-weight="700"'), T(4500, 2860, '2 kabina · tambur', 190));
  q.push(T(4500, 4900, "O'tish yo'lagi", 250, 'font-weight="700"'), T(4500, 5200, '3-qavatga (ZN1)', 200));
  ['K1', 'K2'].forEach(k => { const x = X(k); q.push(T(12600, (x.y1 + x.y2) / 2 + 110, `Koridor ${k} · 1.50 m · ${xonaMaydoni(x).toFixed(1)} m²`, 300, 'font-weight="700"')); });
  ['KL1', 'KL2'].forEach(k => { const x = X(k), cx = (x.x1 + x.x2) / 2 + 150, cy = (x.y1 + x.y2) / 2;
    q.push(T(cx, cy - 20, 'Kladovka', 250, 'font-weight="700"'), T(cx, cy + 270, `${olch(x)} · ${xonaMaydoni(x).toFixed(1)} m²`, 165)); });
  q.push(T(4800, 20050, 'Kirish zali', 290, 'font-weight="700"'), T(2600, 20750, 'Zinapoya (kirish)', 240, 'font-weight="700"'));
  q.push(L(3750, 19200, 4550, 19200, `stroke="${Q}" stroke-width="40"`), `<path d="M4450,19040 L4700,19200 L4450,19360 Z" fill="${Q}"/>`, T(4150, 18920, 'KIRISH', 220, 'font-weight="700"'));

  // o'lcham zanjirlari: o'qlar bo'yicha va umumiy
  const T0 = -DEVOR.yuqori, P0 = ICHKI.y + DEVOR.past, L0 = -DEVOR.chap, R0 = ICHKI.x + DEVOR.ong, Z = { rang: Q, size: 2.8 };
  q.push(zanjir([0, 3000, 6250, 11950, 12150, 17950, 18150, ICHKI.x], T0 - 700, true, 1, { ...Z, tomon: -1 }),
    zanjir([L0, R0], T0 - 1550, true, 1, { ...Z, tomon: -1 }),
    zanjir([0, 5950, 6150, 11950, 12150, 17950, 18150, ICHKI.x], P0 + 700, true, 1, { ...Z, tomon: 1 }),
    zanjir([0, 6500, 9300, 15100, 18350, 18450, 21250, 21450, ICHKI.y], L0 - 700, false, 1, { ...Z, tomon: -1 }),
    zanjir([T0, P0], L0 - 1550, false, 1, { ...Z, tomon: -1 }),
    zanjir([0, 7700, 7800, 9300, 9400, 15000, 15100, 16600, 16700, ICHKI.y], R0 + 700, false, 1, { ...Z, tomon: 1 }));
  const size = olchamMm ? `width="${(vb.x2 - vb.x1) / 100}mm" height="${(vb.y2 - vb.y1) / 100}mm"` : 'width="100%"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x1} ${vb.y1} ${vb.x2 - vb.x1} ${vb.y2 - vb.y1}" ${size}>${q.join('')}</svg>`;
}

const CSS = `
@page { size: 297mm 420mm; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
body { font-family: 'Liberation Sans', Arial, sans-serif; color: #111; }
.varaq { width: 297mm; height: 420mm; padding: 8mm 7mm; background: #fff; position: relative; overflow: hidden; }
header { display: flex; justify-content: space-between; align-items: flex-end; height: 13mm; border-bottom: .4mm solid #111; padding-bottom: 1.5mm; }
header .brend { font-size: 8.5pt; color: #444; font-weight: 700; } header h1 { font-size: 16pt; }
header .ong { text-align: right; font-size: 7.5pt; color: #333; display: flex; flex-direction: column; align-items: flex-end; gap: 1.2mm; }
.bar { display: flex; width: 50mm; height: 1.6mm; border: .2mm solid #111; } .bar i { flex: 1 } .bar i:nth-child(odd) { background: #111 }
.son { display: flex; justify-content: space-between; width: 52mm; font-size: 6pt; }
.reja { margin-top: 1mm; display: flex; justify-content: center; }
.past { display: grid; grid-template-columns: 1fr 1fr 88mm; gap: 4mm; margin-top: 1mm; }
table { width: 100%; border-collapse: collapse; font-size: 7.4pt; }
th { text-align: left; font-size: 6.9pt; border-bottom: .3mm solid #111; padding: .5mm .4mm; } td { padding: .45mm .4mm; border-bottom: .15mm solid #bbb; }
td.r, th.r { text-align: right; white-space: nowrap; } tr.j td { font-weight: 700; border-bottom: none; }
.izoh { border: .3mm solid #111; padding: 2mm 2.5mm; font-size: 6.9pt; line-height: 1.38; } .izoh h2 { font-size: 9pt; margin-bottom: 1mm; }
.izoh ul { padding-left: 3.2mm; } .izoh li { margin-bottom: .6mm; }
.belgi { display: grid; grid-template-columns: 9mm 1fr; gap: .8mm 2mm; align-items: center; margin-top: 1.2mm; } .belgi svg { display: block; }
`;
const belgi = (ichi) => `<svg viewBox="0 0 90 30" width="9mm" height="3mm">${ichi}</svg>`;
export function rangsizRejaHtml() {
  const kor = korsatkichlar();
  const X = kod => XONALAR.find(r => r.kod === kod);
  const NOMI = { XZ1: 'Offline sotuv', XZ2: 'Admin', XZ3: 'Ustozlar xonasi', XZ4: 'Call-markaz', KW: 'Koworking / Tadbirlar zali', X12: 'CEO xonasi',
    K1: 'K1 koridori', K2: 'K2 koridori', KL1: 'Kladovka (K1 oxiri)', KL2: 'Kladovka (K2 oxiri)', ZL: 'Kirish zali' };
  const nom = kod => NOMI[kod] || `${kod.slice(2)}-xona`;
  const qator = kod => { const x = X(kod); return `<tr><td>${nom(kod)}</td><td class="r">${olch(x)}</td><td class="r">${xonaMaydoni(x).toFixed(1)} m²</td></tr>`; };
  const bosh = '<tr><th>Xona</th><th class="r">Ichki o\'lcham</th><th class="r">Maydon</th></tr>';
  const zw = ['ZN1', 'ZN2', '2', '3', '4', '5', '6'].reduce((t, k) => t + xonaMaydoni(X(k)), 0);
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — ${LOYIHA.qavat} rejasi (rangsiz)</title><style>${CSS}</style></head><body>
  <section class="varaq">
    <header>
      <div><div class="brend">${LOYIHA.brend} · ${LOYIHA.filial}</div><h1>${LOYIHA.qavat} rejasi — xonalarga bo'linishi</h1></div>
      <div class="ong"><div>Masshtab 1:100 (A3) · ${LOYIHA.versiya} · 17.10.2026</div><div class="bar"><i></i><i></i><i></i><i></i><i></i></div><div class="son"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5 m</span></div></div>
    </header>
    <div class="reja">${rangsizSvg({ olchamMm: true })}</div>
    <div class="past">
      <table>${bosh}${['SR1', 'SR2', 'SR3', 'SR4', 'SR5', 'SR6', 'SR7', 'XZ1', 'XZ2', 'XZ3', 'XZ4'].map(qator).join('')}
        <tr class="j"><td>O'quv xonalari, jami</td><td></td><td class="r">${kor.reduce((t, k) => t + k.A, 0).toFixed(1)} m²</td></tr></table>
      <table>${bosh}${['KW', 'X12', 'K1', 'K2', 'KL1', 'KL2', 'ZL'].map(qator).join('')}
        <tr><td>Zinapoyalar, WC, o'tish yo'lagi</td><td></td><td class="r">${zw.toFixed(1)} m²</td></tr>
        <tr class="j"><td>Umumiy foydali maydon (hujjat)</td><td></td><td class="r">${LOYIHA.foydali} m²</td></tr></table>
      <div class="izoh"><h2>Shartli belgilar va izoh</h2>
        <div class="belgi">
          ${belgi('<rect x="2" y="8" width="86" height="14" fill="#111"/>')}<span>mavjud va tashqi devor</span>
          ${belgi('<defs><pattern id="b1" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#111" stroke-width="2"/></pattern></defs><rect x="2" y="8" width="86" height="14" fill="url(#b1)" stroke="#111" stroke-width="2"/>')}<span>yangi devor — GKL 100</span>
          ${belgi('<rect x="2" y="10" width="86" height="10" fill="#fff" stroke="#111" stroke-width="1.6"/><line x1="2" y1="15" x2="88" y2="15" stroke="#111" stroke-width="1"/>')}<span>shisha devor (2.5 m gacha)</span>
          ${belgi('<rect x="20" y="9" width="50" height="7" fill="#fff" stroke="#111" stroke-width="2"/><rect x="40" y="18" width="46" height="6" fill="none" stroke="#111" stroke-width="1.4" stroke-dasharray="4 3"/>')}<span>suriladigan eshik 1 m (barg xona ichida)</span>
          ${belgi('<rect x="35" y="4" width="20" height="22" fill="#111"/>')}<span>ustun</span>
        </div>
        <ul style="margin-top:1.5mm">
          <li>Ichki o'lcham — devor yuzidan devor yuzigacha, m; maydon ustunlarsiz. Mavjud chizmadan, joyida o'lchanadi.</li>
          <li>Balandlik ${H / 1000} m. Doska — yon devorda (oq to'rtburchak); 4-xonada eshik tomonida, U6 bilan tekis GKL qoplama.</li>
          <li>Kladovka ustida kanalli konditsioner (KK1, KK2).</li></ul></div>
    </div>
  </section></body></html>`;
}
