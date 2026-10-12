// 2-qavat: split konditsionerlarni o'rnatish detallari (A3 landshaft) — sinf deraza devori (ichkaridan ko'rinish),
// tashqi devor kesimi (ichki blok, trassa, drenaj, tashqi blok kronshteynda), bloklar o'lchami, o'rnatish talablari va 3D.
// Joylashuv rejasi — chizmalar to'plamining 4-varag'i (varaqlar.mjs, reja-svg 'kd' rejimi).
import { LOYIHA, XONALAR, DERAZALAR } from './model.mjs';
import { tizimHisob, kdRoyxat, KD_OLCHAM, KD_Z, ISSIQ } from './hvac-tizim.mjs';

const n1 = v => v.toFixed(1);
const btuNom = b => `${b / 1000}k`;
const RANG = { blok: '#1d2733', trassa: '#e07a1f', havo: '#2f78b7', devor: '#4d5566', beton: '#b8b4ac', oyna: '#cfe4f2' };
const T = (x, y, s, size, a = '') => `<text x="${x}" y="${y}" font-size="${size}" font-family="Liberation Sans, Arial" ${a}>${s}</text>`;

// o'lcham chizig'i (vertikal): z qiymatlari bo'yicha, x — chiziq joyi
function olchamV(x, zlar, Y, size = 95, chap = false) {
  const q = [`<line x1="${x}" y1="${Y(zlar[0])}" x2="${x}" y2="${Y(zlar.at(-1))}" stroke="#666" stroke-width="8"/>`];
  zlar.forEach(z => q.push(`<line x1="${x - 45}" y1="${Y(z) + 45}" x2="${x + 45}" y2="${Y(z) - 45}" stroke="#444" stroke-width="12"/>`,
    T(chap ? x - 70 : x + 70, Y(z) + 32, (z / 1000).toFixed(2).replace(/0$/, ''), size, `text-anchor="${chap ? 'end' : 'start'}" fill="#333"`)));
  return q.join('');
}

// D1: sinf deraza devori — ichkaridan (SR2 misolida)
function derazaDevori() {
  const x = XONALAR.find(r => r.kod === 'SR2'), der = DERAZALAR.find(d => d.devor === 'yuqori' && d.x1 >= x.x1 && d.x2 <= x.x2);
  const W = x.x2 - x.x1, Hh = KD_Z.shift, d1 = der.x1 - x.x1, d2 = der.x2 - x.x1;
  const o = KD_OLCHAM[24000].ichki, to = KD_OLCHAM[24000].tashqi;
  const Y = z => Hh - z, cx = (d1 + d2) / 2;
  const q = [];
  q.push(`<rect x="-300" y="${Y(Hh) - 200}" width="${W + 600}" height="200" fill="${RANG.beton}"/>`,
    `<rect x="-300" y="${Y(0)}" width="${W + 600}" height="250" fill="${RANG.beton}"/>`,
    `<rect x="-300" y="${Y(Hh)}" width="300" height="${Hh}" fill="${RANG.devor}"/><rect x="${W}" y="${Y(Hh)}" width="300" height="${Hh}" fill="${RANG.devor}"/>`,
    `<rect x="0" y="0" width="${W}" height="${Hh}" fill="#f4f1ea"/>`);
  // deraza
  q.push(`<rect x="${d1}" y="${Y(KD_Z.derazaTepa)}" width="${d2 - d1}" height="${KD_Z.derazaTepa - KD_Z.tokcha}" fill="${RANG.oyna}" stroke="#555" stroke-width="30"/>`,
    `<line x1="${cx}" y1="${Y(KD_Z.derazaTepa)}" x2="${cx}" y2="${Y(KD_Z.tokcha)}" stroke="#555" stroke-width="30"/>`,
    `<rect x="${d1 - 40}" y="${Y(KD_Z.tokcha)}" width="${d2 - d1 + 80}" height="45" fill="#e8e6e1" stroke="#777" stroke-width="10"/>`);
  // tashqi blok (devor ortida — punktir) va trassa
  const tbx = cx - to[0] / 2;
  q.push(`<rect x="${tbx}" y="${Y(KD_Z.tashqi + to[1])}" width="${to[0]}" height="${to[1]}" fill="none" stroke="#555" stroke-width="16" stroke-dasharray="70 45"/>`,
    `<circle cx="${cx}" cy="${Y(KD_Z.tashqi + to[1] / 2)}" r="${to[1] * 0.34}" fill="none" stroke="#777" stroke-width="12" stroke-dasharray="50 35"/>`);
  const hx = cx + o[0] / 2 + 90, hz = KD_Z.ichki + 100;
  q.push(`<polyline points="${hx},${Y(hz)} ${d2 + 180},${Y(hz)} ${d2 + 180},${Y(KD_Z.tashqi + to[1] - 120)} ${tbx + to[0]},${Y(KD_Z.tashqi + to[1] - 120)}" fill="none" stroke="${RANG.trassa}" stroke-width="34" stroke-dasharray="90 55"/>`,
    `<circle cx="${hx}" cy="${Y(hz)}" r="45" fill="#fff" stroke="${RANG.trassa}" stroke-width="16"/>`);
  // ichki blok
  q.push(`<rect x="${cx - o[0] / 2}" y="${Y(KD_Z.ichki + o[1])}" width="${o[0]}" height="${o[1]}" rx="70" fill="#fff" stroke="${RANG.blok}" stroke-width="26"/>`,
    `<rect x="${cx - o[0] / 2 + 90}" y="${Y(KD_Z.ichki + 75)}" width="${o[0] - 180}" height="28" rx="12" fill="#c9d1da"/>`,
    `<circle cx="${cx + o[0] / 2 - 120}" cy="${Y(KD_Z.ichki + o[1] - 90)}" r="16" fill="#2fbf66"/>`);
  // havo oqimi (old tomonga — xona ichiga, rejada ko'rinmaydi; bu yerda pastga og'ish)
  [-300, 0, 300].forEach(dx => q.push(`<path d="M${cx + dx},${Y(KD_Z.ichki - 40)} q ${dx * 0.4},250 ${dx * 0.7},560" fill="none" stroke="${RANG.havo}" stroke-width="22" stroke-dasharray="70 45" marker-end="url(#kdo)"/>`));
  // partalar (o'lchov uchun)
  [600, W - 2000].forEach(px => q.push(`<rect x="${px}" y="${Y(750)}" width="1400" height="35" fill="#c9a36e"/><rect x="${px + 60}" y="${Y(715)}" width="40" height="715" fill="#8d8a84"/><rect x="${px + 1300}" y="${Y(715)}" width="40" height="715" fill="#8d8a84"/>`));
  // o'lchamlar
  q.push(olchamV(W + 520, [0, KD_Z.tokcha, KD_Z.derazaTepa, KD_Z.ichki, KD_Z.ichki + o[1], Hh], Y, 105));
  q.push(`<line x1="${cx - o[0] / 2}" y1="${Y(Hh) - 330}" x2="${cx + o[0] / 2}" y2="${Y(Hh) - 330}" stroke="#666" stroke-width="8"/>`,
    ...[cx - o[0] / 2, cx + o[0] / 2].map(v => `<line x1="${v - 40}" y1="${Y(Hh) - 290}" x2="${v + 40}" y2="${Y(Hh) - 370}" stroke="#444" stroke-width="12"/>`),
    T(cx, Y(Hh) - 380, `${o[0]}`, 100, 'text-anchor="middle" fill="#333"'));
  q.push(`<line x1="${d1}" y1="${Y(0) + 420}" x2="${d2}" y2="${Y(0) + 420}" stroke="#666" stroke-width="8"/>`, T(cx, Y(0) + 390, `deraza ${d2 - d1} (taxminiy)`, 95, 'text-anchor="middle" fill="#333"'),
    `<line x1="0" y1="${Y(0) + 620}" x2="${W}" y2="${Y(0) + 620}" stroke="#666" stroke-width="8"/>`, T(W / 2, Y(0) + 590, `xona devori ${W}`, 95, 'text-anchor="middle" fill="#333"'));
  // yozuvlar
  q.push(T(cx + o[0] / 2 + 260, Y(KD_Z.ichki + o[1]) - 40, 'KD — ichki blok 24 000 BTU', 115, `fill="${RANG.blok}" font-weight="700"`),
    T(cx + o[0] / 2 + 260, Y(KD_Z.ichki + o[1]) + 100, `~${o.join(' × ')} mm, deraza ustida, o'rtada`, 95, 'fill="#333"'),
    T(d2 + 280, Y(hz) + 40, 'Ø70 teshik — trassa va drenaj', 95, `fill="${RANG.trassa}"`),
    T(d2 + 260, Y(1500), 'trassa — tashqarida,', 95, `fill="${RANG.trassa}"`), T(d2 + 260, Y(1500) + 120, 'fasad bo\'ylab qutida', 95, `fill="${RANG.trassa}"`),
    T(cx, Y(KD_Z.tashqi + to[1] / 2) + 30, 'TB (tashqarida)', 100, 'text-anchor="middle" fill="#555"'),
    T(cx, Y(1800), 'deraza', 110, 'text-anchor="middle" fill="#3d5a73"'));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-500 -600 ${W + 1500} ${Hh + 1400}" width="100%">
    <defs><marker id="kdo" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${RANG.havo}"/></marker></defs>${q.join('')}</svg>`;
}

// D2: tashqi devor kesimi — ichki blok, devordan o'tish, fasaddagi trassa qutisi, kronshteyndagi tashqi blok, havo oqimi
function kesim() {
  const Hh = KD_Z.shift, Y = z => Hh - z, o = KD_OLCHAM[24000].ichki, to = KD_OLCHAM[24000].tashqi;
  const D = 4600, q = [];
  q.push(`<rect x="-300" y="${Y(0)}" width="${D + 300}" height="250" fill="${RANG.beton}"/>`, `<rect x="-300" y="${Y(0) + 250}" width="300" height="350" fill="${RANG.devor}"/>`, `<rect x="-300" y="${Y(Hh) - 200}" width="${D + 300}" height="200" fill="${RANG.beton}"/>`,
    `<rect x="0" y="0" width="${D}" height="${Hh}" fill="#f4f1ea"/>`,
    // tashqi devor: deraza ostida va ustida, deraza kesimi
    `<rect x="-300" y="${Y(KD_Z.tokcha)}" width="300" height="${KD_Z.tokcha}" fill="${RANG.devor}"/>`,
    `<rect x="-300" y="${Y(Hh)}" width="300" height="${Hh - KD_Z.derazaTepa}" fill="${RANG.devor}"/>`,
    `<rect x="-190" y="${Y(KD_Z.derazaTepa)}" width="70" height="${KD_Z.derazaTepa - KD_Z.tokcha}" fill="${RANG.oyna}" stroke="#555" stroke-width="14"/>`,
    `<rect x="-120" y="${Y(KD_Z.tokcha)}" width="200" height="40" fill="#e8e6e1" stroke="#777" stroke-width="8"/>`);
  // ichki blok (yon ko'rinish)
  q.push(`<path d="M0,${Y(KD_Z.ichki + o[1])} L${o[2] - 60},${Y(KD_Z.ichki + o[1])} Q${o[2]},${Y(KD_Z.ichki + o[1])} ${o[2]},${Y(KD_Z.ichki + o[1] - 60)} L${o[2]},${Y(KD_Z.ichki + 90)} L${o[2] - 90},${Y(KD_Z.ichki)} L0,${Y(KD_Z.ichki)} Z" fill="#fff" stroke="${RANG.blok}" stroke-width="22"/>`);
  // devordan o'tish (tashqariga nishab) va fasaddagi quti
  const z1 = KD_Z.ichki + 110, z2 = z1 - 60, zTB = KD_Z.tashqi + to[1];
  q.push(`<polygon points="0,${Y(z1) - 40} 0,${Y(z1) + 40} -300,${Y(z2) + 40} -300,${Y(z2) - 40}" fill="#fff" stroke="${RANG.trassa}" stroke-width="12"/>`,
    `<line x1="20" y1="${Y(z1)}" x2="-300" y2="${Y(z2)}" stroke="${RANG.trassa}" stroke-width="28"/>`,
    `<rect x="-390" y="${Y(z2) - 60}" width="90" height="${z2 - zTB + 120}" fill="#fff" stroke="#777" stroke-width="10"/>`,
    `<line x1="-345" y1="${Y(z2)}" x2="-345" y2="${Y(zTB - 150)}" stroke="${RANG.trassa}" stroke-width="28"/>`,
    `<line x1="-345" y1="${Y(zTB - 150)}" x2="-${300 + 120 + to[2] - 40}" y2="${Y(zTB - 150)}" stroke="${RANG.trassa}" stroke-width="28"/>`,
    // drenaj — pastga, umumiy quvurga
    `<line x1="-370" y1="${Y(z2)}" x2="-370" y2="${Y(-560)}" stroke="#2f78b7" stroke-width="16" stroke-dasharray="60 35"/>`);
  // tashqi blok kronshteynda
  const tx2 = -300 - 120, tx1 = tx2 - to[2];
  q.push(`<rect x="${tx1}" y="${Y(zTB)}" width="${to[2]}" height="${to[1]}" rx="25" fill="#f2f3f5" stroke="#333" stroke-width="20"/>`,
    `<line x1="${tx1 + 40}" y1="${Y(zTB) + 80}" x2="${tx1 + 40}" y2="${Y(KD_Z.tashqi) - 80}" stroke="#777" stroke-width="10"/>`,
    `<path d="M-300,${Y(KD_Z.tashqi)} L${tx1 - 60},${Y(KD_Z.tashqi)} L-300,${Y(KD_Z.tashqi - 420)} Z" fill="none" stroke="#333" stroke-width="22"/>`);
  // o'quvchi (o'lchov uchun) va havo oqimi
  q.push(`<rect x="1700" y="${Y(750)}" width="1400" height="35" fill="#c9a36e"/><rect x="1760" y="${Y(715)}" width="40" height="715" fill="#8d8a84"/>`,
    `<rect x="3250" y="${Y(450)}" width="420" height="40" fill="#475569"/><rect x="3620" y="${Y(900)}" width="40" height="450" fill="#475569"/>`,
    `<circle cx="3420" cy="${Y(1230)}" r="110" fill="#c7cbd3"/><rect x="3330" y="${Y(1120)}" width="190" height="640" rx="70" fill="#c7cbd3"/>`,
    `<path d="M${o[2] + 40},${Y(KD_Z.ichki + 60)} C 1400,${Y(KD_Z.ichki - 40)} 2500,${Y(2350)} 3900,${Y(1900)}" fill="none" stroke="${RANG.havo}" stroke-width="26" stroke-dasharray="90 55" marker-end="url(#kdk)"/>`,
    `<path d="M${o[2] + 40},${Y(KD_Z.ichki + 20)} C 1200,${Y(KD_Z.ichki - 300)} 2000,${Y(2000)} 2900,${Y(1500)}" fill="none" stroke="${RANG.havo}" stroke-width="20" stroke-dasharray="70 50" marker-end="url(#kdk)" opacity=".7"/>`);
  q.push(olchamV(D + 300, [0, KD_Z.tokcha, KD_Z.derazaTepa, KD_Z.ichki, KD_Z.ichki + o[1], Hh], Y, 105),
    olchamV(-1350, [0, KD_Z.tashqi, zTB], Y, 105, true));
  q.push(T(o[2] + 120, Y(KD_Z.ichki + o[1]) - 50, 'KD — ichki blok', 115, `fill="${RANG.blok}" font-weight="700"`),
    T(1250, Y(1250), 'sovuq havo — deraza tomondan', 100, `fill="${RANG.havo}"`), T(1250, Y(1250) + 125, 'koridor tomonga, o\'quvchilar ustidan', 100, `fill="${RANG.havo}"`),
    T(-420, Y(z2) - 150, 'Ø70, tashqariga nishab', 95, `text-anchor="end" fill="${RANG.trassa}"`),
    T(-430, Y(1700), 'trassa qutisi', 95, `text-anchor="end" fill="${RANG.trassa}"`), T(-430, Y(1700) + 115, '(mis quvur, kabel,', 85, 'text-anchor="end" fill="#555"'), T(-430, Y(1700) + 220, 'drenaj)', 85, 'text-anchor="end" fill="#555"'),
    T(tx1 - 80, Y(zTB) + 160, 'TB', 120, 'text-anchor="end" fill="#333" font-weight="700"'), T(tx1 - 80, Y(zTB) + 290, 'kronshteynda', 90, 'text-anchor="end" fill="#555"'),
    T(-450, Y(-470), 'drenaj → fasaddagi quvurga', 85, `text-anchor="end" fill="#2f78b7"`),
    T(-150, Y(Hh) - 260, 'TASHQARI', 100, 'text-anchor="middle" fill="#777" font-weight="700"'), T(2300, Y(Hh) - 260, 'SINF', 100, 'text-anchor="middle" fill="#777" font-weight="700"'));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2600 -500 ${D + 3400} ${Hh + 1100}" width="100%">
    <defs><marker id="kdk" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${RANG.havo}"/></marker></defs>${q.join('')}</svg>`;
}

const CSS = `
@page { size: 420mm 297mm; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
body { font-family: 'Liberation Sans', Arial, sans-serif; color: #222; }
.varaq { width: 420mm; height: 297mm; padding: 7mm 8mm; position: relative; overflow: hidden; }
header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: .4mm solid #1F3657; padding-bottom: 1.5mm; }
header .brend { font-size: 8pt; color: #6b6b6b; font-weight: 700; } header h1 { font-size: 15pt; color: #1F3657; }
header .ong { text-align: right; font-size: 7.2pt; color: #555; }
.grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 146mm 1fr; gap: 3mm 5mm; margin-top: 3mm; height: 266mm; }
h3 { font-size: 9pt; color: #1F3657; margin: 1.5mm 0 1mm; }
.ram { border: .3mm solid #ccc; border-radius: 1mm; padding: 1.5mm 2mm; overflow: hidden; }
.ram svg { display: block; width: 100%; height: 124mm; }
table { width: 100%; border-collapse: collapse; font-size: 7pt; margin-bottom: 2mm; }
th { background: #1F3657; color: #fff; text-align: left; padding: .8mm 1mm; } td { padding: .6mm 1mm; border-bottom: .2mm solid #ddd; }
td.r, th.r { text-align: right; }
ul { margin: 0 0 0 4mm; font-size: 7.2pt; line-height: 1.4; } li { margin-bottom: .6mm; }
.rasmlar { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; } .rasmlar img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 1mm; display: block; } .izoh { font-size: 6.8pt; color: #555; margin-top: .8mm; }
`;

export function kdDetalHtml(rasm = {}) {
  const T2 = tizimHisob(), R = kdRoyxat();
  const sinf = T2.xona.find(x => x.kod === 'SR2');
  const bloklar = [24000, 12000].map(b => ({ b, o: KD_OLCHAM[b], soni: R.filter(u => u.btu === b).length }));
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — konditsionerlar</title><style>${CSS}</style></head><body>
  <section class="varaq">
    <header><div><div class="brend">${LOYIHA.brend} · ${LOYIHA.filial} · 2-qavat</div><h1>Split konditsionerlar — qanday o'rnatiladi (sinf, 24 000 BTU)</h1></div>
      <div class="ong">${LOYIHA.versiya} · ${LOYIHA.sana}<br>Joylashuv rejasi — chizmalar to'plamining 4-varag'i</div></header>
    <div class="grid">
      <div class="ram"><h3>1. Sinf deraza devori — ichkaridan ko'rinish (SR2 misolida, 1:40)</h3>${derazaDevori()}
        <div class="izoh">Ichki blok deraza ustida, o'rtada: pastki qirrasi ${KD_Z.ichki / 1000} m, ustki ${(KD_Z.ichki + KD_OLCHAM[24000].ichki[1]) / 1000} m, shiftgacha ~${((KD_Z.shift - KD_Z.ichki - KD_OLCHAM[24000].ichki[1]) / 1000).toFixed(2)} m. Deraza tokchasi ${KD_Z.tokcha / 1000} m va tepasi ${KD_Z.derazaTepa / 1000} m — taxminiy, joyida o'lchanadi; deraza baland bo'lsa, blok deraza yoniga (tashqi devorda) qo'yiladi. Punktir — devor ortida (tashqarida).</div></div>
      <div class="ram"><h3>2. Kesim: tashqi devor — sinf (1:40)</h3>${kesim()}
        <div class="izoh">Trassa (mis quvurlar izolyatsiyada, aloqa kabeli) va drenaj blok yonidagi Ø70 teshikdan tashqariga nishab bilan chiqadi, fasad bo'ylab dekorativ qutida pastga tushadi. Tashqi blok deraza tokchasi ostida, kronshteynda — xizmat derazadan. Drenaj fasaddagi umumiy quvurga ulanadi (trotuarga tomizmaydi).</div></div>
      <div class="ram">
        ${rasm.ichki || rasm.fasad ? `<h3>3. 3D: sinf ichidan (SR2) va fasaddan</h3><div class="rasmlar">${[rasm.ichki, rasm.fasad].filter(Boolean).map(r => `<img src="${r}">`).join('')}</div>
        <div class="izoh">Chapda — 24 000 BTU ichki blok deraza ustida; o'ngda — tashqi bloklar deraza ostida kronshteynda, trassa deraza yonidagi oq qutida. 1-qavat fasadi shartli.</div>` : ''}
        <h3>Qayerda nima turadi (qisqacha)</h3>
        <table><tr><th>Xonalar</th><th>Ichki blok</th><th>Tashqi blok</th></tr>
          <tr><td>SR1–SR3, SR5–SR7</td><td>deraza ustida, o'rtada, 2.75 m</td><td>fasadda, shu deraza ostida (kronshteyn)</td></tr>
          <tr><td>SR4</td><td>o'ng (sharqiy) devorda, doska ustida</td><td>devor ortidagi oraliqda yoki tomda — aniqlanadi</td></tr>
          <tr><td>XZ1–XZ4</td><td>ichki devorda, 12 000 BTU</td><td>tomda yoki koworking fasadida — aniqlanadi</td></tr>
          <tr><td>Koworking, CEO</td><td colspan="2">mavjud konditsionerlar, joyi o'zgarmaydi</td></tr>
        </table>
      </div>
      <div>
      <h3>Bloklar (taxminiy o'lchamlar — model pasportidan aniqlanadi)</h3>
      <table><tr><th>Split</th><th class="r">Soni</th><th>Ichki blok, mm</th><th>Tashqi blok, mm</th><th class="r">TB, kg</th><th>Elektr liniyasi</th></tr>
        ${bloklar.map(x => `<tr><td><b>${x.b.toLocaleString('en-US').replace(',', ' ')} BTU</b></td><td class="r">${x.soni}</td><td>${x.o.ichki.join(' × ')}</td><td>${x.o.tashqi.join(' × ')}</td><td class="r">~${x.o.kg}</td><td>${x.o.kabel}, avtomat ${x.o.avtomat} A</td></tr>`).join('')}
      </table>
      <h3>O'rnatish talablari</h3>
      <ul>
        <li><b>Ichki blok:</b> shiftgacha ≥ 150 mm, yon devorgacha ≥ 150 mm; havo deraza tomondan koridor tomonga — doska va ustozga to'g'ridan emas, jalyuzi pastga 20–30°. Bitta 24k: 7.0 kW (42–43 °C da ~${n1(sinf.issiq)} kW), sinf yuki ${n1(sinf.q[0])}–${n1(sinf.q[1])} kW.</li>
        <li><b>Trassa:</b> sinflarda 3–4 m (ko'pchilik modellar uchun minimum ~3 m); mis quvurlar diametri — pasport bo'yicha, butun uzunligi izolyatsiyada. SR4 va xizmat xonalarida trassa uzunligi tashqi blok joyiga bog'liq (4–20 m), uzun bo'lsa freon qo'shiladi.</li>
        <li><b>Drenaj:</b> Ø16–20 mm, nishab ≥ 1–2%; xizmat xonalarida — shift ichida stoyakka yoki drenaj nasosi bilan.</li>
        <li><b>Tashqi blok:</b> ankerli kronshteyn (≥ 100 kg yuk), devordan 100–150 mm (havo aylanishi uchun); hamma sinflarda bir xil balandlikda va bir xil qutilar bilan — fasad toza ko'rinadi. Koworking fasadidagi rekuperator tashqi havo panjaralaridan ≥ 3 m uzoqda.</li>
        <li><b>Elektr:</b> har bir split — shitdan alohida liniya (jadvaldagi kabel va avtomat), tashqi blokka aloqa kabeli — pasport bo'yicha. 11 ta split to'liq yuklamada ~${Math.round(T2.elektr11)} kW.</li>
        <li><b>Ruxsat:</b> fasadga tashqi blok osish — ijaraga beruvchi bilan kelishiladi.</li>
      </ul>
      </div>
    </div>
  </section></body></html>`;
}
