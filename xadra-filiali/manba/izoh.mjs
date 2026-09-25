// A4 hujjat: "2-qavat: xonalar bo'yicha izoh" (Quyluq namunasidagi tartibda).
import { LOYIHA, H, ICHKI, STANDART, XONALAR } from './model.mjs';
import { rejaSvg, QURILMALAR } from './reja-svg.mjs';
import { korsatkichlar, baho, tekshiruv, evakuatsiya, ishlar, admHavo, xonaMaydoni, HAVO } from './tekshiruv.mjs';

const mm = v => (v / 1000).toFixed(2);           // m
const sm = v => Math.round(v / 10);              // sm
const b1 = v => v.toFixed(1);

const CSS = `
@page { size: A4; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
body { font-family: 'Liberation Sans', Arial, sans-serif; color: #1c2433; font-size: 8.4pt; line-height: 1.38; }
.bet { width: 210mm; height: 297mm; position: relative; overflow: hidden; page-break-after: always; background: #fff; }
.bar { height: 7mm; background: #1f3657; }
.ichki { padding: 8mm 14mm 0; }
footer { position: absolute; bottom: 7mm; left: 14mm; right: 14mm; display: flex; justify-content: space-between; font-size: 7pt; color: #7b8190; }
.brend { color: #5b6272; font-weight: 700; font-size: 9pt; }
h1 { font-size: 20pt; color: #1f3657; margin: 1.5mm 0 1mm; }
h2 { font-size: 13pt; color: #1f3657; margin: 5mm 0 2.5mm; }
.sub { color: #5b6272; font-size: 8pt; }
.kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.2mm; margin: 4mm 0 3mm; }
.kpi div { background: #eef1f5; padding: 3mm 3.5mm; }
.kpi b { display: block; font-size: 17pt; color: #1f3657; line-height: 1.1; }
.kpi span { font-size: 7.2pt; color: #5b6272; }
table { width: 100%; border-collapse: collapse; }
.solish th { background: #1f3657; color: #fff; font-size: 7pt; padding: 1.6mm 1mm; border: .2mm solid #c9ced8; }
.solish td { text-align: center; padding: 1.1mm 1mm; border: .2mm solid #c9ced8; font-size: 7.4pt; }
.solish td:first-child { font-weight: 700; }
.solish tr.std td { font-style: italic; color: #555; }
.alo { color: #2e7d32; background: #e8f5e9; font-weight: 700; }
.yaxshi { color: #2e7d32; background: #f1f8e9; font-weight: 700; }
.qoniq { color: #a8680b; background: #fff4d9; font-weight: 700; }
.izohm { color: #5b6272; font-size: 7.4pt; margin-top: 2mm; }
.sarlavha { background: #1f3657; color: #fff; display: flex; justify-content: space-between; align-items: baseline; padding: 3.2mm 5mm; }
.sarlavha b { font-size: 14pt; }
.sarlavha span { font-size: 9pt; font-weight: 700; }
.ikki { display: grid; grid-template-columns: 60mm 1fr; gap: 5mm; margin-top: 4mm; align-items: start; }
.kor td, .kor th { border-bottom: .2mm solid #d9dde4; padding: 1.25mm 1.5mm; vertical-align: top; font-size: 7.6pt; }
.kor th { background: #eef1f5; text-align: left; color: #444; }
.kor td:first-child { color: #444; width: 32%; }
.kor td:nth-child(2) { font-weight: 700; }
.kor td:last-child { text-align: center; color: #555; width: 16%; }
.og { color: #c0392b; }
.qn { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-top: 5mm; }
.qn > div { padding: 3mm 3.5mm; }
.qulay { background: #eef7ee; border-left: 1mm solid #2e7d32; }
.noqulay { background: #fbeeee; border-left: 1mm solid #c0392b; }
.qulay h4 { color: #2e7d32; } .noqulay h4 { color: #c0392b; }
h4 { font-size: 10pt; margin-bottom: 1.5mm; }
ul { padding-left: 3.5mm; } li { margin-bottom: 1.3mm; }
.tavsiya { margin-top: 4mm; background: #fff6e0; border-left: 1mm solid #b7791f; padding: 3mm 4mm; }
.rasmlar { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm 4mm; }
.rasmlar img { width: 100%; display: block; }
.rasmlar p { font-size: 7.4pt; color: #444; margin-top: 1mm; }
.masala td { padding: 2mm 2mm; border-bottom: .2mm solid #d9dde4; vertical-align: top; }
.masala td:first-child { font-weight: 700; width: 36mm; }
.havo th { background: #1f3657; color: #fff; font-size: 7pt; padding: 1.5mm 1mm; }
.havo td { text-align: center; padding: 1.2mm 1mm; border-bottom: .2mm solid #d9dde4; font-size: 7.6pt; }
.havo tr.jami td { font-weight: 700; border-top: .4mm solid #1f3657; }
.check li { margin-bottom: 1mm; }
`;

const footer = n => `<footer><span>${LOYIHA.brend} · ${LOYIHA.filial} · ${LOYIHA.qavat} · ${LOYIHA.versiya} · ${LOYIHA.sanaISO}</span><span>${n}</span></footer>`;
const bet = (n, ichki) => `<section class="bet"><div class="bar"></div><div class="ichki">${ichki}</div>${footer(n)}</section>`;
const bahoKlass = b => b === "A'lo" ? 'alo' : b === 'Yaxshi' ? 'yaxshi' : 'qoniq';

// ---------- 1-bet: umumiy ----------
function bet1(kor, t) {
  const jamiOrin = kor.reduce((s, k) => s + k.orin, 0);
  const jamiA = kor.reduce((s, k) => s + k.A, 0);
  const qator = k => `<tr><td>${k.kod}</td><td style="white-space:nowrap">${mm(k.W)} × ${mm(k.D)}</td><td>${b1(k.A)}</td><td>${k.kishiga.toFixed(2)}</td>
    <td class="${k.bloklar.join() !== STANDART.bloklar.join() ? 'og' : ''}">${k.qatorlar[0]}×${k.qatorlar.length}</td><td>${sm(k.qadam)}</td><td>${sm(k.doska)}</td><td>${mm(k.oxirgi)}</td>
    <td class="${Math.min(k.yonChap, k.yonOng) < 200 ? 'og' : ''}">${sm(k.yonChap)}–${sm(k.yonOng)}</td><td>${sm(k.orqaZona)}</td><td class="${bahoKlass(baho(k))}">${baho(k)}</td></tr>`;
  const plan = rejaSvg({ rejim: 'izoh', vb: { x1: -700, y1: -700, x2: ICHKI.x + 700, y2: ICHKI.y + 700 }, k: 1.5 });
  return bet(1, `
    <div class="brend">${LOYIHA.brend} · ${LOYIHA.filial}</div>
    <h1>${LOYIHA.qavat}: xonalar bo'yicha izoh</h1>
    <div class="sub">${LOYIHA.manzil} · ${LOYIHA.qavat} (umumiy ${LOYIHA.umumiy} m², foydali ${LOYIHA.foydali} m²) · Chizma ${LOYIHA.versiya}, ${LOYIHA.sana} · O. Mirzayev tasdig'i uchun</div>
    <div class="kpi">
      <div><b>7 sinf</b><span>6 ta 24 o'rinli + 1 ta 20 o'rinli</span></div>
      <div><b>${jamiOrin} o'rin</b><span>jami bir vaqtda</span></div>
      <div><b>${Math.round(jamiA)} m²</b><span>sinflar maydoni; ADM ${b1(xonaMaydoni(XONALAR.find(x => x.kod === 'ADM')))} m²</span></div>
      <div><b>${t.toqnashuv.length + t.toSilgan.length}</b><span>to'qnashuv va doskani to'suvchi ustun</span></div>
    </div>
    <div style="width:122mm;margin:0 auto">${plan}</div>
    <h2 style="margin-top:3mm">Xonalar solishtiruvi</h2>
    <table class="solish">
      <tr><th>Xona</th><th>O'lcham, m</th><th>Maydon, m²</th><th>1 kishiga, m²</th><th>Partalar</th><th>Qator qadami, sm</th><th>Doska → 1-parta, sm</th><th>Oxirgi parta, m</th><th>Yon chekka, sm</th><th>Orqa zona, sm</th><th>Baho</th></tr>
      ${kor.map(qator).join('')}
      <tr class="std"><td>Beruniy</td><td>—</td><td>—</td><td>—</td><td>6×4</td><td>130</td><td>244</td><td>6.84</td><td>—</td><td>—</td><td>standart</td></tr>
    </table>
    <p class="izohm">Qator qadami = parta (50 sm) + stul va o'tish joyi. Oxirgi parta = doskadan eng orqa partaning orqa chetigacha. Yon chekka = eng chetdagi partadan devorgacha. Orqa zona = oxirgi stuldan orqa devorgacha bo'sh joy. Baho: A'lo — to'liq standart va yon chekka ≥ 40 sm; Yaxshi — standart qadam va masofalar, lekin yon chekka tor; Qoniqarli — qadam yoki masofa standartdan kam.</p>
  `);
}

// ---------- 2-bet: 3D ----------
function bet2(rasm) {
  const r = (k, t) => `<div><img src="${rasm[k]}"><p>${t}</p></div>`;
  return bet(2, `<h2 style="margin-top:0">3D ko'rinishlar</h2><div class="rasmlar">
    ${r('sr1', 'SR1 — oxirgi qatordan (6.84 m) doskaga: doska mavjud o\'rta devorda, ustunlar devor ichida')}
    ${r('sr7', 'SR7 — oxirgi qatordan: derazalar chap tomonda, doska to\'liq ko\'rinadi')}
    ${r('k1', 'K1 koridori — tutashuvdan o\'ngga: chapda SR1–SR3, o\'ngda yangi devor va SR4–SR6 eshiklari')}
    ${r('tepa', 'Butun qavat — tepadan umumiy ko\'rinish (to\'q sariq — yangi devorlar)')}
  </div>
  <p class="izohm" style="margin-top:4mm">3D model chizmadagi o'lchamlardan qurilgan; derazalar joyi va toza balandlik (${H / 1000} m) taxminiy. To'sinlar fotoda ko'rsatilmagan — joyida o'lchanadi.</p>`);
}

// ---------- xona sahifalari ----------
const TAVSIF = {
  SR1: 'yuqori qator, chap sinf', SR2: 'yuqori qator, o\'rta sinf', SR3: 'yuqori qator, o\'ng sinf',
  SR4: 'pastki qator, chap sinf', SR5: 'pastki qator, o\'rta sinf', SR6: 'pastki qator, o\'ng sinf', SR7: 'chap qanotdagi uzun sinf',
};

function xonaMatni(k, ev) {
  const x = k.xona;
  const yuqori = x.doska === 'past';
  const yon = Math.min(k.yonChap, k.yonOng);
  const ustunlar = k.ustunlar.filter(u => u.partagacha < 1000);
  const ustunMatn = ustunlar.length ? ustunlar.map(u => u.kod).join(', ') : '';
  const taxminiy = k.ustunlar.some(u => u.holat === 'taxminiy');
  const q = [], n = [];
  let tavsiya = '';
  if (x.kod === 'SR7') {
    q.push(`Yorug'lik o'quvchilarning <b>chap tomonidan</b> (chap devordagi 2 ta deraza) — sinf uchun ideal yo'nalish.`);
    q.push(`Eshik <b>orqa tomonda</b> — kechikkan o'quvchi darsni buzmaydi; eshik zina oldi zaliga yaqin.`);
    q.push(`Standart qadam ${sm(k.qadam)} sm, doska → 1-parta ${sm(k.doska)} sm, oxirgi parta ${mm(k.oxirgi)} m.`);
    q.push(`Xona eni ${mm(k.W)} m — derazadan tabiiy shamollatish butun xonaga yetadi.`);
    q.push(`Ustun yo'q; doska mavjud kar devorda (ZN1 zinasi va sanuzel bloki devori). Chetdagi o'quvchining qarash burchagi ${b1(k.burchak)}° — Beruniy'dan (39.8°) qulayroq.`);
    q.push(`Orqada <b>${sm(k.orqaZona)} sm</b> bo'sh zona — shkaf, sumkalar uchun.`);
    n.push(`Qatorda 5 parta (<b>2 + 3</b>): uch kishilik blokning o'rtasidagi o'ringa faqat qator orasidan (36 sm) kiriladi.`);
    n.push(`Yon chekka <b>${sm(yon)} sm</b> — devor bo'ylab yurib bo'lmaydi; chetki o'rinlarga qator orasidan kiriladi.`);
    n.push(`Chap derazalar partadan ${sm(k.partadanOynagacha)} sm narida — radiator yoki tokcha chiqib tursa, partalar suriladi; quyosh tushsa jalyuzi kerak.`);
    n.push(`Doska ortidagi devorda sanuzel bloki: doska mahkamlanadigan joyda quvur yo'qligini tekshirish kerak; suv shovqini eshitilishi mumkin.`);
    n.push(`Xona uzun va tor (${mm(k.W)} × ${mm(k.D)} m) — orqa ${sm(k.orqaZona)} sm dars uchun ishlatilmaydi.`);
    tavsiya = `Muqobil variant: <b>16 o'rin</b> (4 qator × 4, 2 + 2 bloklar, yon chekka 50 sm) — to'liq Beruniy standarti. 20 o'rin kerak bo'lsa, hozirgi 2 + 3 joylashuv qoladi. Orqa bo'sh zonaning ~2 m qismini devor bilan ajratib, zina oldi zali (ZL) ni kengaytirish mumkin — o'rinlar soni o'zgarmaydi.`;
  } else {
    q.push(`To'liq Beruniy standarti: qadam ${sm(k.qadam)} sm, doska → 1-parta ${sm(k.doska)} sm, guruh yo'lagi ${sm(k.yolak)} sm, oxirgi parta ${mm(k.oxirgi)} m.`);
    q.push(`1 kishiga <b>${k.kishiga.toFixed(2)} m²</b>; orqada <b>${sm(k.orqaZona)} sm</b> bo'sh zona — shkaf, sumkalar, kichik guruh ishi uchun.`);
    if (ustunlar.length) q.push(`Ustun xona o'rtasida emas: ${ustunMatn} devordan 10 sm chiqadi va partaning <b>yon</b> tomonida qoladi (${sm(Math.min(...ustunlar.map(u => u.partagacha)))} sm) — hech bir o'rindan doskani to'smaydi.`);
    q.push(yuqori ? `Doska mavjud o'rta devorda (kar devor) — alohida devor qurilmaydi.` : `Deraza orqa devorda — doskaga va proyektor ekraniga quyosh tushmaydi.`);
    q.push(`Eshik to'g'ridan-to'g'ri K1 koridoriga, kirish tomonga yaqin burchakda.`);
    n.push(`Yon chekka <b>${sm(yon)} sm</b> — xona eni ustunlar oralig'i bilan cheklangan (${mm(k.W)} m); chetki o'rinlarga qatorlar orasidan kiriladi.`);
    n.push(`Deraza faqat orqa (${yuqori ? 'yuqori' : 'pastki'}) devorda: doska tomoni derazadan ~${Math.round((k.D - 1500) / 1000)} m uzoqda — sun'iy yorug'likka bog'liq; noutbuk ekranlarida deraza aksi bo'ladi.`);
    n.push(`Eshik doska yonida — kechikkan o'quvchi sinf oldidan kiradi.`);
    n.push(`Xona chuqur (${mm(k.D)} m), deraza bitta qisqa devorda — tabiiy shamollatish doska tomonga yetmaydi (PV qurilma shart, 10-bet).`);
    if (!yuqori) n.push(`Doska yangi GKL devorda (K1 janubiy devori) — doska osiladigan joyga devor ichida mustahkamlovchi profil yoki fanera qo'yiladi.`);
    if (taxminiy) n.push(`${k.ustunlar.filter(u => u.holat === 'taxminiy').map(u => u.kod).join(', ')} ustun(lar)i fotoda ko'rinmaydi — to'r bo'yicha qo'yilgan, joyida tekshirish kerak.`);
    if (x.kod === 'SR3' || x.kod === 'SR6') n.push(`K1 koridorining berk uchida: eng uzoq o'rindan ZN2 zinasigacha ~${Math.round(ev.gacha2 / 1000)} m.`);
    tavsiya = yuqori
      ? `Orqa devordagi derazaga roller parda; doska ustiga alohida yoritish (doska chirog'i). Orqa ${sm(k.orqaZona)} sm zonaga shkaflar va 2–3 kishilik ishlash stoli qo'yish mumkin.`
      : `Doska uchun GKL devorni mustahkamlash; derazaga roller parda; doska chirog'i. Orqa ${sm(k.orqaZona)} sm zonaga shkaflar qo'yish mumkin.`;
  }
  return { q, n, tavsiya };
}

function xonaBeti(k, i, ev) {
  const x = k.xona;
  const vb = { x1: x.x1 - 600, y1: x.y1 - 600, x2: x.x2 + 600, y2: x.y2 + 600 };
  const plan = rejaSvg({ rejim: 'izoh', vb, urgu: x, k: 1 });
  const d = k.derazalar;
  const derazaMatn = d.length ? `${d.map(z => mm(z.uz)).join(' + ')} m, ${d[0].devor} devorda (${d[0].tomon}) — taxminiy` : 'yo\'q';
  const ustun = k.ustunlar.filter(u => u.partagacha < 1000);
  const ustunMatn = ustun.length ? `${ustun.map(u => u.kod + (u.holat === 'taxminiy' ? '*' : '')).join(', ')} devordan 10 sm chiqadi; eng yaqin partagacha ${sm(Math.min(...ustun.map(u => u.partagacha)))} sm (yon tomonda)` : 'yo\'q';
  const esh = x.kod === 'SR7' ? 'K2 koridori devorida, orqa tomonda, 90 sm' : `K1 koridori devorida, old tomonda (doska yonida), 90 sm`;
  const std = STANDART;
  const qatorMatn = `${k.qatorlar[0]}×${k.qatorlar.length} (${k.bloklar.join(' + ')})`;
  const r = (a, b, c, og = false) => `<tr><td>${a}</td><td class="${og ? 'og' : ''}">${b}</td><td>${c}</td></tr>`;
  const pv = QURILMALAR[i];
  const rows = [
    r("O'lcham", `${mm(k.W)} × ${mm(k.D)} m`, '—'),
    r('1 kishiga maydon', `${k.kishiga.toFixed(2)} m²`, '—'),
    r('Partalar joylashuvi', qatorMatn, '6×4 (4 qator)', k.bloklar.join() !== std.bloklar.join()),
    r('Doska → 1-parta', `${sm(k.doska)} sm`, `${sm(std.doska)} sm`, k.doska < std.doska),
    r('Qator qadami', `${sm(k.qadam)} sm`, `${sm(std.qadam)} sm`, k.qadam < std.qadam),
    r('Stul orqasi → keyingi parta', `${sm(k.stulOrqasi)} sm`, '36 sm'),
    r("Guruhlar orasidagi yo'lak", `${sm(k.yolak)} sm`, `${sm(std.yolak)} sm`, k.yolak < std.yolak),
    r('Oxirgi parta (doskadan)', `${mm(k.oxirgi)} m`, `${mm(std.oxirgi)} m`, k.oxirgi > std.oxirgi),
    r("Chetdagi o'quvchining qarash burchagi", `${b1(k.burchak)}°`, '39.8°'),
    r('Yon chekka (devor)', `${sm(k.yonChap)}–${sm(k.yonOng)} sm`, '—', Math.min(k.yonChap, k.yonOng) < 200),
    r("Orqa bo'sh zona", `${sm(k.orqaZona)} sm`, '—'),
    r('Deraza', derazaMatn, '—'),
    r('Partadan oynagacha', `${sm(k.partadanOynagacha)} sm`, '—', k.partadanOynagacha < 200),
    r('Ustun', ustunMatn, '—'),
    r('Eshik', esh, '—'),
    r('Havo almashinuvi', `${k.havo.Q} m³/soat · ${b1(k.havo.karra)} marta/soat · ${pv.kod}`, '—'),
    r('Sovutish (taxminiy)', `≈ ${b1(k.havo.sovutishYaxlit)} kVt`, '—'),
    r('Evakuatsiya (eng uzoq o\'rindan ZN2 gacha)', `~${Math.round(ev.gacha2 / 1000)} m`, '—'),
  ];
  const { q, n, tavsiya } = xonaMatni(k, ev);
  return bet(i + 3, `
    <div class="sarlavha"><b>${k.kod} — ${TAVSIF[k.kod]}</b><span>${b1(k.A)} m² · ${k.orin} o'rin · ${qatorMatn}</span></div>
    <div class="ikki"><div>${plan}<p class="izohm">Eski ${x.eskiRaqam}-xona o'rnida. Qizil ramka — xona chegarasi.</p></div>
      <table class="kor"><tr><th>Ko'rsatkich</th><th>${k.kod}</th><th style="text-align:center">Beruniy</th></tr>${rows.join('')}</table></div>
    <div class="qn"><div class="qulay"><h4>Qulayliklar</h4><ul>${q.map(t => `<li>${t}</li>`).join('')}</ul></div>
      <div class="noqulay"><h4>Noqulayliklar</h4><ul>${n.map(t => `<li>${t}</li>`).join('')}</ul></div></div>
    <div class="tavsiya"><b>Tavsiya.</b> ${tavsiya}</div>
  `);
}

// ---------- havo almashinuvi ----------
function kesimSvg() {
  // Sinf kesimi: chapda deraza (orqa), o'ngda doska (old); shift ichida PV, kanal, diffuzorlar
  const L = 12200, Hh = 3000, s = [];
  s.push(`<rect x="0" y="0" width="${L}" height="${Hh}" fill="#f5f3ee"/>`);
  s.push(`<rect x="-300" y="-500" width="300" height="${Hh + 700}" fill="#4d5566"/><rect x="-300" y="900" width="300" height="1500" fill="#fff" stroke="#555" stroke-width="15"/>`);
  s.push(`<rect x="${L}" y="-500" width="200" height="${Hh + 700}" fill="#262b36"/>`);
  s.push(`<rect x="-300" y="${Hh}" width="${L + 500}" height="200" fill="#8a8f99"/><rect x="-300" y="-500" width="${L + 500}" height="200" fill="#8a8f99"/>`);
  s.push(`<line x1="0" y1="-20" x2="${L}" y2="-20" stroke="#bbb" stroke-width="10"/><line x1="0" y1="300" x2="${L}" y2="300" stroke="#999" stroke-width="15" stroke-dasharray="80 50"/>`);
  s.push(`<rect x="${L - 60}" y="900" width="60" height="1200" fill="#2e5e45"/>`);
  // partalar va o'quvchilar
  for (let i = 0; i < 4; i++) {
    const x = L - 2440 - i * 1300 - 500;
    s.push(`<rect x="${x}" y="${Hh - 750}" width="500" height="30" fill="#c9a36e"/><rect x="${x + 520}" y="${Hh - 470}" width="400" height="40" fill="#7f9cd6"/>`);
    s.push(`<circle cx="${x + 720}" cy="${Hh - 1250}" r="120" fill="#c7cbd3"/><rect x="${x + 620}" y="${Hh - 1130}" width="200" height="650" rx="80" fill="#c7cbd3"/>`);
  }
  // PV, kanal, panjaralar
  s.push(`<rect x="350" y="20" width="1300" height="260" fill="#fff" stroke="#222" stroke-width="20" stroke-dasharray="60 30"/><text x="1000" y="200" font-size="170" text-anchor="middle" font-weight="700">PV</text>`);
  s.push(`<line x1="-1500" y1="90" x2="340" y2="90" stroke="#1f6fd1" stroke-width="60" marker-end="url(#kk)"/>`);
  s.push(`<line x1="340" y1="220" x2="-1500" y2="220" stroke="#d1452f" stroke-width="60" marker-end="url(#kq)"/>`);
  s.push(`<line x1="1650" y1="120" x2="${L - 2800}" y2="120" stroke="#1f6fd1" stroke-width="90"/>`);
  [L - 4100, L - 2900].forEach(x => s.push(`<rect x="${x - 250}" y="280" width="500" height="40" fill="#1f6fd1"/><path d="M${x},340 L${x},900" stroke="#1f6fd1" stroke-width="40" marker-end="url(#kk)"/>`));
  s.push(`<rect x="2300" y="280" width="500" height="40" fill="#d1452f"/><path d="M2550,1000 L2550,360" stroke="#d1452f" stroke-width="40" marker-end="url(#kq)"/>`);
  // oqim
  s.push(`<path d="M${L - 3500},1100 C${L - 5000},2000 5200,2100 3000,1300" fill="none" stroke="#5b8fd6" stroke-width="35" stroke-dasharray="160 90" marker-end="url(#kh)"/>`);
  const t = (x, y, m, a = 'middle', c = '#333') => `<text x="${x}" y="${y}" font-size="210" text-anchor="${a}" fill="${c}">${m}</text>`;
  s.push(t(-2550, 20, 'toza havo', 'start', '#1f6fd1'), t(-2550, 470, 'chiqarish', 'start', '#d1452f'), t(L - 3500, 1450, 'diffuzorlar', 'middle', '#1f6fd1'),
    t(2550, 1250, 'so\'rish', 'middle', '#d1452f'), t(L - 250, 2450, 'doska', 'end', '#2e5e45'), t(150, 2750, 'deraza (orqa)', 'start'), t(4300, 2000, 'havo oqimi', 'middle', '#5b8fd6'),
    t(-2550, 1500, 'fasad', 'start', '#555'), t(-2550, 1750, 'panjarasi', 'start', '#555'));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2650 -700 ${L + 3150} ${Hh + 1100}" width="100%" font-family="Liberation Sans, Arial">
    <defs>${['kk:#1f6fd1', 'kq:#d1452f', 'kh:#5b8fd6'].map(v => { const [i, c] = v.split(':'); return `<marker id="${i}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`; }).join('')}</defs>${s.join('')}</svg>`;
}

function havoBeti(kor, n) {
  const adm = admHavo();
  const rows = kor.map((k, i) => `<tr><td><b>${k.kod}</b></td><td>${k.odam}</td><td>${b1(k.A)}</td><td>${Math.round(k.havo.V)}</td><td>${k.havo.Q}</td><td>${b1(k.havo.karra)}</td><td>${b1(k.havo.sovutishYaxlit)}</td><td>${k.derazalar.length ? k.derazalar[0].tomon : '—'}</td><td>${QURILMALAR[i].kod}</td></tr>`);
  rows.push(`<tr><td><b>ADM</b></td><td>6</td><td>${b1(adm.A)}</td><td>${Math.round(adm.V)}</td><td>${adm.Q}</td><td>${b1(adm.karra)}</td><td>${b1(adm.sovutishYaxlit)}</td><td>burchak (2 devor)</td><td>PV-8</td></tr>`);
  const jamiQ = kor.reduce((s, k) => s + k.havo.Q, 0) + adm.Q;
  const jamiS = kor.reduce((s, k) => s + k.havo.sovutishYaxlit, 0) + adm.sovutishYaxlit;
  return bet(n, `
    <h2 style="margin-top:0">Havo almashinuvi</h2>
    <p><b>Nega faqat deraza yetmaydi.</b> SR1–SR6 chuqurligi 10.4–12.2 m, deraza esa faqat orqadagi qisqa devorda. Bir tomonlama tabiiy shamollatish taxminan 2.5 × H ≈ 7.5 m gacha yetadi — doska tomondagi 3–5 m qism havosiz qoladi. Qishda va +40 °C yozda derazalar yopiq turadi, 25 kishi esa soatiga ~450 l CO₂ chiqaradi: 20–30 daqiqada havo og'irlashadi, diqqat pasayadi.</p>
    <h2>Hisob</h2>
    <table class="havo"><tr><th>Xona</th><th>Odam</th><th>Maydon, m²</th><th>Hajm, m³</th><th>Havo, m³/soat</th><th>Marta / soat</th><th>Sovutish, kVt</th><th>Deraza</th><th>Qurilma</th></tr>
      ${rows.join('')}<tr class="jami"><td>Jami</td><td>${kor.reduce((s, k) => s + k.odam, 0) + 6}</td><td></td><td></td><td>${jamiQ}</td><td></td><td>${b1(jamiS)}</td><td></td><td>8 ta PV</td></tr></table>
    <p class="izohm">${HAVO.kishiga} m³/soat har bir kishiga: bir kishi soatiga ~18 l CO₂ chiqaradi, 18 l ÷ (1000 − 420) ppm ≈ 31 m³/soat — shunda xonada CO₂ 1000 ppm dan oshmaydi. Hajm toza balandlik ${H / 1000} m (taxmin) bo'yicha. Sovutish — odamlar, noutbuklar, proyektor, yoritish, derazadan quyosh va toza havo (rekuperator FIK ${HAVO.rekuperator * 100}%) yig'indisi; OV loyihachisi aniqlashtiradi.</p>
    <h2>Yechim: har sinfga alohida PV qurilma</h2>
    <div style="margin:1mm 0 3mm">${kesimSvg()}</div>
    <ul>
      <li><b>PV</b> — rekuperatorli kiritish-chiqarish qurilmasi, ~750 m³/soat, shovqin ≤ 35 dB(A). Deraza devori yonida shift ichida; toza havo fasad panjarasidan olinadi va chiqariladi — uzun kanallar va koridor shiftidan o'tish kerak emas.</li>
      <li>Toza havo <b>doska tomonga</b> 2 ta diffuzor orqali beriladi, <b>orqa tomondan</b> so'riladi — oqim o'quvchilar ustidan o'tadi, xonada havosiz burchak qolmaydi.</li>
      <li><b>CO₂ datchigi</b> qurilmani boshqaradi: xona bo'sh bo'lsa o'chadi, dars paytida havo miqdorini oshiradi.</li>
      <li><b>Konditsioner:</b> har sinfga 2 ta ichki blok (kasseta yoki kanalli), jami ~${Math.round(jamiS)} kVt; tashqi bloklar fasadda yoki tomda — joyini ijaraga beruvchi bilan kelishish.</li>
      <li><b>Derazalar</b> ochiladigan (mikroshamollatish rejimi bilan) qoldiriladi — tanaffusda tez shamollatish uchun.</li>
      <li><b>V-1</b> — sanuzel chiqarish ventilyatsiyasi 4 × 50 = 200 m³/soat; mavjud shaxta ishlashini tekshirish. Koridorlar sanuzel orqali so'riladigan havo bilan shamollatiladi; tutun chiqarish talabini yong'in xavfsizligi mutaxassisi belgilaydi.</li>
    </ul>
    <p class="izohm">Joylashuv sxemasi — A3 chizmaning 3-varag'i ("Havo almashinuvi sxemasi").</p>
  `);
}

// ---------- butun qavat ----------
function qavatBeti(kor, t, ev, n) {
  const ish = ishlar();
  const eng = ev.reduce((a, b) => (b.gacha2 > a.gacha2 ? b : a));
  const berk = (ICHKI.x - 5950) / 1000;
  const m = (a, b) => `<tr><td>${a}</td><td>${b}</td></tr>`;
  return bet(n, `
    <h2 style="margin-top:0">Butun qavat bo'yicha masalalar</h2>
    <table class="masala">
      ${m('Evakuatsiya', `Ikkala zina (ZN1, ZN2) qavatning chap qismida. K1 koridorining o'ng uchi berk: tutashuvdan ${berk.toFixed(1)} m. Eng uzoq o'rindan (${eng.kod}) ZN2 gacha ~${Math.round(eng.gacha2 / 1000)} m. ZN1 ga faqat sanuzel oldi xonasi (6) orqali, ~70 sm eshik bilan chiqiladi. 164 o'quvchi va xodimlar uchun evakuatsiya yo'llari, eshiklar eni va yo'nalishini yong'in xavfsizligi mutaxassisi bilan tasdiqlatish kerak.`)}
      ${m('Hojatxona yetishmaydi', `Sanuzel blokida 4 ta kichik xona (2–5). 164 o'quvchi va ~10 xodimga taxminan 6–8 unitaz kerak (1 unitaz 20–30 kishiga). Yechim: tanaffuslarni xonalar bo'yicha 5–10 daqiqa farq bilan qo'yish; 1-qavatdagi hojatxonalardan foydalanish imkonini ijaraga beruvchi bilan aniqlash.`)}
      ${m('Zina oldi zali tor', `ZL 2.3 × 2.8 m — 24 kishilik guruhlar almashganda odam to'planadi. Tanaffuslarni surish; kerak bo'lsa SR7 orqa zonasining ~2 m qismini ZL ga qo'shish (SR7 20 o'rinligicha qoladi).`)}
      ${m('Havo almashinuvi', `SR1–SR6 chuqur, deraza bitta qisqa devorda — mexanik ventilyatsiya shart. Har sinfga rekuperatorli PV qurilma (10-bet va A3 chizmaning 3-varag'i).`)}
      ${m('Yorug\'lik va quyosh', `SR1–SR6 da deraza o'quvchilar orqasida — doska tomoni sun'iy yorug'likka bog'liq, noutbuk ekranlarida deraza aksi bo'ladi: roller parda va doska chirog'i. Dunyo tomonlari chizmada yo'q — quyosh tomoni aniqlangach jalyuzi talabi belgilanadi. SR7 da yorug'lik chapdan — ideal.`)}
      ${m('Yangi devorlar', `~${ish.yangiUz.toFixed(1)} m GKL 100 (≈ ${Math.round(ish.yangiUz * 3)} m²), ${ish.buzUz.toFixed(1)} m devor buziladi, ${ish.yangiEshik} ta yangi eshik. SR4–SR6 doskalari yangi devorda — doska joyiga ichki mustahkamlash. Sinflar orasidagi devorlarda ovoz izolyatsiyasi (mineral paxta).`)}
      ${m('Joyida o\'lchanmagan', `Derazalar joyi va o'lchami; U8, U9 ustunlari (fotoda ko'rinmaydi); devor qalinliklari; toza balandlik (hisobda ${H / 1000} m); to'sinlar; radiatorlar. SR7 da parta derazadan 15 sm — radiator chiqib tursa, joylashuvni qayta hisoblaymiz.`)}
      ${m('Hujjatlar', `Mavjud chizmada: «Xonalar ichki qismi loyiha hujjatlarisiz qayta ta'mirlangan». Devorlarni buzish va qurishdan oldin ijaraga beruvchining yozma roziligi olinadi. 8-xonaning raqami fotoda ko'rinmaydi.`)}
    </table>
    <h2>Chizma tekshiruvi (avtomatik)</h2>
    <ul class="check">
      <li>Partalar va stullar: ${t.orinlar} o'rin, jami ${t.jihozlar} ta jihoz — o'zaro, devor, ustun va zina bilan to'qnashuv: <b>${t.toqnashuv.length}</b>.</li>
      <li>Ustun doskani to'sib qo'ygan o'rin: <b>${t.toSilgan.length}</b> (har bir o'rindan doskaning ikki cheti va markazigacha to'g'ri chiziq tekshirildi).</li>
      <li>Beruniy ustun qoidasi (ustundan parta oldi/orqasi kamida 50 sm): ${t.ustunQoidasi.length ? `<b class="og">${t.ustunQoidasi.length} ta buzilish</b>` : 'bajarilgan'}.</li>
      <li>Eshik ochilganda boshqa eshik, doska yoki partaga tegishi: <b>${t.eshik.length}</b>.</li>
      <li>Barcha doskalar kar devorda: ${t.doskaDevor.length ? `<b class="og">${t.doskaDevor.join('; ')}</b>` : 'ha'}.</li>
    </ul>
    <h2>Tasdiqlash uchun savollar</h2>
    <ul>
      <li>ADM uchun 12-xona (17.6 m², 4 ish o'rni, zina yonida) — to'g'rimi?</li>
      <li>SR7: <b>20 o'rin</b> (2 + 3 bloklar, yon chekka 15 sm) yoki <b>16 o'rin</b> (to'liq standart)?</li>
      <li>SR1–SR6: doska koridor devorida, deraza orqada — ma'qulmi?</li>
      <li>Havo almashinuvi: har sinfga alohida PV qurilma (tavsiya) yoki markaziy tizim?</li>
      <li>Sanuzel: 2–5 xonalar hojatxona deb qabul qilindi — to'g'rimi? Tanaffuslarni xonalar bo'yicha surish ma'qulmi?</li>
    </ul>
  `);
}

export function izohHtml(rasm) {
  const kor = korsatkichlar();
  const t = tekshiruv();
  const ev = evakuatsiya();
  const betlar = [bet1(kor, t), bet2(rasm), ...kor.map((k, i) => xonaBeti(k, i, ev[i]))];
  betlar.push(havoBeti(kor, betlar.length + 1));
  betlar.push(qavatBeti(kor, t, ev, betlar.length + 1));
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — ${LOYIHA.qavat}: xonalar bo'yicha izoh</title><style>${CSS}</style></head><body>${betlar.join('')}</body></html>`;
}
