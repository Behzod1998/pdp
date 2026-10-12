// 2-qavat: split konditsionerlarni o'rnatish detallari (A3 landshaft) — sinf deraza devori (ichkaridan ko'rinish),
// tashqi devor kesimi (ichki blok, trassa, drenaj, tashqi blok kronshteynda), bloklar o'lchami, o'rnatish talablari va 3D.
// Joylashuv rejasi — chizmalar to'plamining 4-varag'i (varaqlar.mjs, reja-svg 'kd' rejimi).
import { LOYIHA, XONALAR, DERAZALAR } from './model.mjs';
import { tizimHisob, kdRoyxat, KD_OLCHAM, KD_Z, ISSIQ, KD_OYNADAN, OYNA, TANLOV } from './hvac-tizim.mjs';

const VG = DERAZALAR.find(d => d.vitraj && d.devor === 'yuqori');   // SR1–SR3 oynasi: tokcha, tepa

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

// tomdagi tashqi blok (yon ko'rinish): tayanch rama, blok, ventilyator
function tbTomda(q, u1, en, zTom, to, ventilyator = true) {
  const zR = zTom + 400, zB = zR + to[1];
  q.push(`<rect x="${u1 + 40}" y="${Y0(zR)}" width="40" height="400" fill="#555"/><rect x="${u1 + en - 80}" y="${Y0(zR)}" width="40" height="400" fill="#555"/>`,
    `<rect x="${u1 - 60}" y="${Y0(zR) - 10}" width="${en + 120}" height="40" fill="#555"/>`,
    `<rect x="${u1}" y="${Y0(zB)}" width="${en}" height="${to[1]}" rx="25" fill="#f2f3f5" stroke="#333" stroke-width="20"/>`);
  if (ventilyator) q.push(`<circle cx="${u1 + en * 0.42}" cy="${Y0((zR + zB) / 2)}" r="${to[1] * 0.34}" fill="none" stroke="#555" stroke-width="14"/>`);
  return zB;
}
let Y0 = z => z;   // har chizmada qayta belgilanadi (z → svg y)

// D1: sinf orqa yon devori — ichkaridan ko'rinish (SR2): o'ngda oynali fasad (kesimda), chapda koridor devori, tepada tom
function yonDevor() {
  const x = XONALAR.find(r => r.kod === 'SR2'), u = kdRoyxat().find(k => k.xona === 'SR2');
  const D = x.y2 - x.y1, Hh = KD_Z.shift, TOM = Hh + 300;
  const o = KD_OLCHAM[24000].ichki, to = KD_OLCHAM[24000].tashqi;
  const Y = z => 5300 - z; Y0 = Y;
  const uk = D - KD_OYNADAN;                                  // blok markazi (chapdan — koridor devoridan)
  const tbu = D - ((u.tb.y1 + u.tb.y2) / 2 - x.y1);           // TB markazi shu o'qda
  const q = [];
  q.push(`<rect x="-300" y="${Y(0)}" width="${D + 600}" height="250" fill="${RANG.beton}"/>`,
    `<rect x="-300" y="${Y(TOM)}" width="${D + 600}" height="300" fill="${RANG.beton}"/>`,
    `<rect x="0" y="${Y(Hh)}" width="${D}" height="${Hh}" fill="#f4f1ea"/>`,
    `<rect x="-150" y="${Y(Hh)}" width="150" height="${Hh}" fill="${RANG.devor}"/>`,
    // oynali fasad (kesim): pastida 1 m devor, oyna, ustida devor; parapet
    `<rect x="${D}" y="${Y(VG.tokcha)}" width="300" height="${VG.tokcha}" fill="${RANG.devor}"/>`,
    `<rect x="${D}" y="${Y(Hh)}" width="300" height="${Hh - VG.tepa}" fill="${RANG.devor}"/>`,
    `<rect x="${D + 110}" y="${Y(VG.tepa)}" width="80" height="${VG.tepa - VG.tokcha}" fill="${RANG.oyna}" stroke="#555" stroke-width="14"/>`,
    `<rect x="${D}" y="${Y(TOM + 600)}" width="300" height="600" fill="${RANG.devor}"/>`);
  // partalar (o'lchov uchun)
  [600, 2400, 4200].forEach(px => q.push(`<rect x="${px}" y="${Y(750)}" width="1400" height="35" fill="#c9a36e"/><rect x="${px + 60}" y="${Y(715)}" width="40" height="715" fill="#8d8a84"/><rect x="${px + 1300}" y="${Y(715)}" width="40" height="715" fill="#8d8a84"/>`));
  // trassa qutisi devorda (blok ortidan shiftgacha), plitadagi gilza, tomdagi gusak va TB gacha
  const tx = uk + o[0] / 2 - 160;
  q.push(`<rect x="${tx - 50}" y="${Y(Hh)}" width="100" height="${Hh - KD_Z.ichki - o[1]}" fill="#fff" stroke="#999" stroke-width="10"/>`);
  const zTB = tbTomda(q, tbu - to[0] / 2, to[0], TOM, to);
  q.push(`<path d="M${tx},${Y(KD_Z.ichki + o[1])} L${tx},${Y(TOM + 350)} Q${tx},${Y(TOM + 520)} ${tx - 170},${Y(TOM + 520)} L${tbu + to[0] / 2 + 120},${Y(TOM + 520)} L${tbu + to[0] / 2},${Y(TOM + 520)}" fill="none" stroke="${RANG.trassa}" stroke-width="34" stroke-dasharray="90 55"/>`,
    `<rect x="${tx - 90}" y="${Y(TOM + 40)}" width="180" height="380" fill="none" stroke="#777" stroke-width="12"/>`,
    `<path d="M${tx + 30},${Y(KD_Z.ichki + 40)} L${tx + 30},${Y(TOM + 300)}" fill="none" stroke="${RANG.havo}" stroke-width="16" stroke-dasharray="50 35"/>`,
    `<rect x="${tx + 70}" y="${Y(KD_Z.ichki + 60)}" width="120" height="90" fill="#dbe9fb" stroke="${RANG.havo}" stroke-width="10"/>`);
  // ichki blok
  q.push(`<rect x="${uk - o[0] / 2}" y="${Y(KD_Z.ichki + o[1])}" width="${o[0]}" height="${o[1]}" rx="70" fill="#fff" stroke="${RANG.blok}" stroke-width="26"/>`,
    `<rect x="${uk - o[0] / 2 + 90}" y="${Y(KD_Z.ichki + 75)}" width="${o[0] - 180}" height="28" rx="12" fill="#c9d1da"/>`,
    `<circle cx="${uk + o[0] / 2 - 120}" cy="${Y(KD_Z.ichki + o[1] - 90)}" r="16" fill="#2fbf66"/>`);
  [-300, 0, 300].forEach(dx => q.push(`<path d="M${uk + dx},${Y(KD_Z.ichki - 40)} q ${dx * 0.4},250 ${dx * 0.7},560" fill="none" stroke="${RANG.havo}" stroke-width="22" stroke-dasharray="70 45" marker-end="url(#kdo)"/>`));
  // o'lchamlar
  q.push(olchamV(D + 700, [0, VG.tokcha, KD_Z.ichki, VG.tepa, Hh, TOM, zTB], Y, 100));
  q.push(`<line x1="${uk}" y1="${Y(0) + 430}" x2="${D}" y2="${Y(0) + 430}" stroke="#666" stroke-width="8"/>`,
    ...[uk, D].map(v => `<line x1="${v - 40}" y1="${Y(0) + 470}" x2="${v + 40}" y2="${Y(0) + 390}" stroke="#444" stroke-width="12"/>`),
    T((uk + D) / 2, Y(0) + 400, `${KD_OYNADAN} — oynadan`, 95, 'text-anchor="middle" fill="#333"'),
    `<line x1="0" y1="${Y(0) + 640}" x2="${D}" y2="${Y(0) + 640}" stroke="#666" stroke-width="8"/>`, T(D / 2, Y(0) + 610, `xona chuqurligi ${D}`, 95, 'text-anchor="middle" fill="#333"'));
  // yozuvlar
  q.push(T(uk - o[0] / 2 - 120, Y(KD_Z.ichki + o[1]) + 60, 'KD — ichki blok 24 000 BTU', 110, `text-anchor="end" fill="${RANG.blok}" font-weight="700"`),
    T(uk - o[0] / 2 - 120, Y(KD_Z.ichki + o[1]) + 190, `~${o.join(' × ')} mm, orqa yon devorda`, 90, 'text-anchor="end" fill="#333"'),
    T(tx + 140, Y(Hh) + 170, 'trassa qutisi', 90, `fill="${RANG.trassa}"`),
    T(tx + 230, Y(KD_Z.ichki + 20), 'drenaj nasosi', 80, `fill="${RANG.havo}"`),
    T(tbu, Y(zTB) - 90, 'TB — tomda, tayanchda', 105, 'text-anchor="middle" fill="#333" font-weight="700"'),
    T(tx + 60, Y(TOM + 600), 'gusak (germetik o\'tish)', 85, 'fill="#555"'),
    T(D - 120, Y(VG.tepa) + 160, 'oyna', 100, 'text-anchor="end" fill="#3d5a73"'),
    T(D - 120, Y(VG.tokcha) + 140, '1 m devor', 85, 'text-anchor="end" fill="#555"'),
    T(D + 150, Y(TOM + 700), 'FASAD', 90, 'text-anchor="middle" fill="#777" font-weight="700"'),
    T(-75, Y(Hh) - 380, 'KORIDOR', 90, 'text-anchor="middle" fill="#777" font-weight="700"'),
    T(1300, Y(TOM) - 100, 'TOM', 100, 'fill="#777" font-weight="700"'));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-700 -100 ${D + 1900} ${5300 + 900}" width="100%">
    <defs><marker id="kdo" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${RANG.havo}"/></marker></defs>${q.join('')}</svg>`;
}

// D2: kesim xona bo'ylab (oynadan 1.8 m da): chapda blok (yon ko'rinish), havo doskaga, orqa fonda oyna, tepada TB
function kesim() {
  const x = XONALAR.find(r => r.kod === 'SR2'), u = kdRoyxat().find(k => k.xona === 'SR2');
  const W = x.x2 - x.x1, Hh = KD_Z.shift, TOM = Hh + 300, o = KD_OLCHAM[24000].ichki, to = KD_OLCHAM[24000].tashqi;
  const Y = z => 5300 - z; Y0 = Y;
  const tbx = (u.tb.x1 + u.tb.x2) / 2 - x.x1, q = [];
  q.push(`<rect x="-250" y="${Y(0)}" width="${W + 500}" height="250" fill="${RANG.beton}"/>`, `<rect x="-250" y="${Y(TOM)}" width="${W + 500}" height="300" fill="${RANG.beton}"/>`,
    `<rect x="0" y="${Y(Hh)}" width="${W}" height="${Hh}" fill="#f4f1ea"/>`,
    // orqa fonda — oynali fasad
    `<rect x="150" y="${Y(VG.tepa)}" width="${W - 300}" height="${VG.tepa - VG.tokcha}" fill="${RANG.oyna}" opacity=".55" stroke="#8fb3cc" stroke-width="12"/>`,
    ...[1, 2, 3].map(i => `<line x1="${150 + (W - 300) * i / 4}" y1="${Y(VG.tepa)}" x2="${150 + (W - 300) * i / 4}" y2="${Y(VG.tokcha)}" stroke="#8fb3cc" stroke-width="14"/>`),
    `<rect x="-200" y="${Y(Hh)}" width="200" height="${Hh}" fill="${RANG.devor}"/><rect x="${W}" y="${Y(Hh)}" width="200" height="${Hh}" fill="${RANG.devor}"/>`);
  // doska va panel (o'ng devorda)
  q.push(`<rect x="${W - 60}" y="${Y(2100)}" width="60" height="1200" fill="#2e5e45"/>`);
  // o'quvchilar doskaga qarab
  [700, 2300, 3900].forEach(px => q.push(`<rect x="${px}" y="${Y(750)}" width="600" height="35" fill="#c9a36e"/><rect x="${px + 560}" y="${Y(715)}" width="40" height="715" fill="#8d8a84"/>`,
    `<rect x="${px - 420}" y="${Y(450)}" width="380" height="40" fill="#475569"/><rect x="${px - 460}" y="${Y(900)}" width="40" height="450" fill="#475569"/>`,
    `<circle cx="${px - 240}" cy="${Y(1230)}" r="110" fill="#c7cbd3"/><rect x="${px - 335}" y="${Y(1120)}" width="190" height="640" rx="70" fill="#c7cbd3"/>`));
  // ichki blok (yon ko'rinish) va havo oqimi
  q.push(`<path d="M0,${Y(KD_Z.ichki + o[1])} L${o[2] - 60},${Y(KD_Z.ichki + o[1])} Q${o[2]},${Y(KD_Z.ichki + o[1])} ${o[2]},${Y(KD_Z.ichki + o[1] - 60)} L${o[2]},${Y(KD_Z.ichki + 90)} L${o[2] - 90},${Y(KD_Z.ichki)} L0,${Y(KD_Z.ichki)} Z" fill="#fff" stroke="${RANG.blok}" stroke-width="22"/>`,
    `<path d="M${o[2] + 40},${Y(KD_Z.ichki + 60)} C 1500,${Y(KD_Z.ichki - 20)} 3200,${Y(2500)} ${W - 500},${Y(1900)}" fill="none" stroke="${RANG.havo}" stroke-width="26" stroke-dasharray="90 55" marker-end="url(#kdk)"/>`,
    `<path d="M${o[2] + 40},${Y(KD_Z.ichki + 20)} C 1300,${Y(KD_Z.ichki - 300)} 2400,${Y(2000)} 3600,${Y(1500)}" fill="none" stroke="${RANG.havo}" stroke-width="20" stroke-dasharray="70 50" marker-end="url(#kdk)" opacity=".7"/>`);
  // trassa: devordagi quti → shift → plita (gilza) → tomda TB
  const tx = 60;
  const zTB = tbTomda(q, tbx - to[2] / 2, to[2], TOM, to, false);
  q.push(`<rect x="10" y="${Y(Hh)}" width="100" height="${Hh - KD_Z.ichki - o[1]}" fill="#fff" stroke="#999" stroke-width="10"/>`,
    `<path d="M${tx},${Y(KD_Z.ichki + o[1])} L${tx},${Y(TOM + 350)} Q${tx},${Y(TOM + 520)} ${tx + 170},${Y(TOM + 520)} L${tbx - to[2] / 2},${Y(TOM + 520)}" fill="none" stroke="${RANG.trassa}" stroke-width="34" stroke-dasharray="90 55"/>`,
    `<rect x="${tx - 90}" y="${Y(TOM + 40)}" width="180" height="380" fill="none" stroke="#777" stroke-width="12"/>`);
  // toza havo diffuzori (R1) — doska tomonda
  q.push(`<rect x="${W - 2100}" y="${Y(Hh) - 10}" width="600" height="40" fill="#1f6fd1"/>`);
  q.push(olchamV(W + 600, [0, KD_Z.ichki, KD_Z.ichki + o[1], Hh, TOM, zTB], Y, 100));
  q.push(`<line x1="0" y1="${Y(0) + 450}" x2="${W}" y2="${Y(0) + 450}" stroke="#666" stroke-width="8"/>`, T(W / 2, Y(0) + 420, `xona eni ${W} — havo doskagacha ~${(W / 1000).toFixed(1)} m`, 95, 'text-anchor="middle" fill="#333"'));
  q.push(T(o[2] + 140, Y(KD_Z.ichki + o[1]) - 60, 'KD', 120, `fill="${RANG.blok}" font-weight="700"`),
    T(1500, Y(1300), 'sovuq havo — o\'quvchilar ustidan doskaga', 100, `fill="${RANG.havo}"`),
    T(W / 2, Y(VG.tepa) + 180, 'orqa fonda — oynali fasad', 95, 'text-anchor="middle" fill="#3d5a73"'),
    T(W - 120, Y(2100) - 80, 'doska', 95, 'text-anchor="end" fill="#2e5e45"'),
    T(W - 1800, Y(Hh) + 170, 'toza havo (R1)', 85, 'text-anchor="middle" fill="#1f6fd1"'),
    T(tbx + to[2] / 2 + 120, Y(zTB) + 200, 'TB — tomda', 105, 'fill="#333" font-weight="700"'),
    T(tbx + to[2] / 2 + 120, Y(zTB) + 330, `trassa ~${u.trassaM} m`, 90, `fill="${RANG.trassa}"`),
    T(200, Y(Hh) + 170, 'trassa qutisi', 85, `fill="${RANG.trassa}"`));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-500 -100 ${W + 1900} ${5300 + 900}" width="100%">
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
  const oynali = T2.xona.filter(x => x.payt);
  const bloklar = [24000, 12000].map(b => ({ b, o: KD_OLCHAM[b], soni: R.filter(u => u.btu === b).length }));
  const BAHO = { yetarli: '<b style="color:#1d7a35">yetarli</b>', chegarada: '<b style="color:#8a5a00">chegarada</b>', kam: '<b style="color:#b3261e">kam</b>' };
  const trs = R.map(u => u.trassaM);
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — konditsionerlar</title><style>${CSS}</style></head><body>
  <section class="varaq">
    <header><div><div class="brend">${LOYIHA.brend} · ${LOYIHA.filial} · 2-qavat</div><h1>Split konditsionerlar — qanday o'rnatiladi (oynali sinf, 24 000 BTU; tashqi blok — tomda)</h1></div>
      <div class="ong">${LOYIHA.versiya} · ${LOYIHA.sana}<br>Joylashuv rejasi — chizmalar to'plamining 4-varag'i</div></header>
    <div class="grid">
      <div class="ram"><h3>1. Sinfning orqa yon devori — ichkaridan (SR2, ~1:50)</h3>${yonDevor()}
        <div class="izoh">Ko'cha tomoni to'liq oynali — oyna ustida blokka joy yo'q, fasad o'zgarmaydi. Ichki blok doskaga qarama-qarshi yon devorda, oynadan ${KD_OYNADAN / 1000} m, pastki qirrasi ${KD_Z.ichki / 1000} m. Trassa blok ortidan devordagi qutida shiftga, plitadagi gilza va tomdagi gusak orqali TB ga. Drenaj — mini-nasos bilan trassa yonidan tomga (yoki shift ichida nishab bilan stoyakka). SR5–SR7 da oyna poldan shiftgacha — joylashuv xuddi shunday.</div></div>
      <div class="ram"><h3>2. Kesim: oynadan ${KD_OYNADAN / 1000} m da, xona bo'ylab (SR2, ~1:50)</h3>${kesim()}
        <div class="izoh">Havo o'quvchilar ustidan doska tomonga, oynaga yaqin zonani ham qamraydi; jalyuzi pastga 20–30°. Toza havo (R1) doska tomonda shiftdan beriladi. TB — tomda, tayanch ramada (tomdan ≥ 0.4 m, tebranishga qarshi yostiqlar), xona ustida; SR1, XZ1, XZ2 ustida 3-qavat — TB yaqin ochiq tomda (trassa uzunroq).</div></div>
      <div class="ram">
        ${rasm.ichki || rasm.fasad ? `<h3>3. 3D: sinf ichidan (SR6, oyna poldan shiftgacha) va tomdagi tashqi bloklar</h3><div class="rasmlar">${[rasm.ichki, rasm.fasad].filter(Boolean).map(r => `<img src="${r}">`).join('')}</div>
        <div class="izoh">Chapda — ichki blok orqa yon devorda, oyna yonida; o'ngda — tashqi bloklar tomda, fasad toza (oynalarga reklama plyonkasi tortiladi). 1-qavat va 3-qavat shartli/ko'rsatilmagan.</div>` : ''}
        <h3>Qayerda nima turadi</h3>
        <table><tr><th>Xonalar</th><th>Ichki blok</th><th>Tashqi blok</th><th class="r">Trassa</th></tr>
          <tr><td>SR1–SR3 (g'arb), SR5–SR7 (sharq)</td><td>doskaga qarama-qarshi yon devorda, oynadan ${KD_OYNADAN / 1000} m, 2.75 m</td><td>tomda, xona ustida (SR1 — 3-qavat yonida)</td><td class="r">~${Math.min(...trs)}–${R.find(u => u.xona === 'SR1').trassaM} m</td></tr>
          <tr><td>SR4</td><td>o'ng devorda, doska ustida</td><td>tomda, xona ustida</td><td class="r">~${R.find(u => u.xona === 'SR4').trassaM} m</td></tr>
          <tr><td>XZ1–XZ4</td><td>ichki devorda, 12 000 BTU</td><td>tomda (XZ1, XZ2 — 3-qavat yonida)</td><td class="r">~${Math.min(...R.filter(u => u.xona.startsWith('XZ')).map(u => u.trassaM))}–${Math.max(...R.filter(u => u.xona.startsWith('XZ')).map(u => u.trassaM))} m</td></tr>
          <tr><td>Koworking, CEO</td><td colspan="3">mavjud (koworkingda 24k + 18k — koworking va koridorlar), joyi o'zgarmaydi</td></tr>
        </table>
      </div>
      <div>
      <h3>Oynali sinflar: sovutish yuki va bitta 24k (reklama plyonkasi bilan)</h3>
      <table><tr><th>Xona</th><th>Fasad</th><th class="r">Oyna, m²</th><th>Og'ir payt</th><th class="r">Yuk, kW</th><th class="r">Plyonkasiz</th><th class="r">24k: nominal / inverter maks.</th><th>Baho</th></tr>
        ${oynali.map(x => `<tr><td><b>${x.kod}</b></td><td>${x.payt.yon}</td><td class="r">${x.payt.Ao.toFixed(1)}</td><td>${x.payt.soat}</td><td class="r"><b>${x.q[0].toFixed(1)}–${x.q[1].toFixed(1)}</b></td><td class="r">${x.payt.qToza.toFixed(1)}</td><td class="r">${x.issiq.toFixed(1)} / ${x.issiqMaks.toFixed(1)}</td><td>${BAHO[x.baho]} / ${BAHO[x.bahoMaks]}</td></tr>`).join('')}
      </table>
      <h3>Narx o'zgarmagan holda tavsiya</h3>
      <ul>
        <li><b>Reklama plyonkasi oynaning hammasiga</b> — perforatsiyali, tashqi tomoni oq/ochiq rang: quyosh issiqligini ~40–50% kamaytiradi (plyonkasiz yuk 2–4 kW ko'p).</li>
        <li><b>Inverter split, T3 sinfi (+52 °C gacha), maksimal sovutish ≥ 8 kW</b> — shu narx oralig'ida tanlanadi.</li>
        <li><b>Ichki blok oynaga yaqin</b> (yon devorda), <b>TB tomda soyaroq joyda</b>, qora yopmadan ≥ 0.4 m yuqorida.</li>
        <li><b>Oldindan sovutish:</b> SR5–SR7 — birinchi darsdan 30–40 daqiqa oldin, SR1–SR3 — 13:00 dan; eshiklar yopiq, rekuperatorlar ishlaydi, 24–25 °C.</li>
        <li><b>Iyul–avgustda</b> 14:00–18:00 da katta guruhlar quyoshsiz SR4 ga.</li>
      </ul>
      <div class="izoh" style="margin-top:1mm">Natija: SR5–SR7 — ko'p kunlarda yetadi, eng issiq ertalablarda chegarada; SR1–SR3 — eng issiq kunlarda 15:00–18:00 da to'liq guruh bilan ~1.5–3 kW kam (~26–28 °C). Eng arzon qo'shimcha (narxga kiritilmagan) — SR1–SR3 ga bittadan 12k: 3 × $${TANLOV.ofis.narx}. Hisob: HVAC hisobi, 2a-bo'lim.</div>
      <h3>Bloklar (taxminiy o'lchamlar — model pasportidan)</h3>
      <table><tr><th>Split</th><th class="r">Soni</th><th>Ichki blok, mm</th><th>Tashqi blok, mm</th><th class="r">TB, kg</th><th>Elektr liniyasi</th></tr>
        ${bloklar.map(x => `<tr><td><b>${x.b.toLocaleString('en-US').replace(',', ' ')} BTU</b></td><td class="r">${x.soni}</td><td>${x.o.ichki.join(' × ')}</td><td>${x.o.tashqi.join(' × ')}</td><td class="r">~${x.o.kg}</td><td>${x.o.kabel}, avtomat ${x.o.avtomat} A</td></tr>`).join('')}
      </table>
      <ul>
        <li><b>Tomda:</b> tayanch rama (tebranishga qarshi yostiqlar), tom yopmasi teshilgan joylar germetiklanadi; tomga chiqish va o'rnatishga ijaraga beruvchining ruxsati kerak.</li>
        <li><b>Elektr:</b> har bir split — shitdan alohida liniya; 11 ta to'liq yuklamada ~${Math.round(T2.elektr11)} kW.</li>
      </ul>
      </div>
    </div>
  </section></body></html>`;
}
