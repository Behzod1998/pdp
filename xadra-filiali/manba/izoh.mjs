// A4 hujjat: "2-qavat: xonalar bo'yicha izoh" (Quyluq namunasidagi tartibda).
import { LOYIHA, H, ICHKI, STANDART, XONALAR, PARTA } from './model.mjs';
import { rejaSvg, QURILMALAR } from './reja-svg.mjs';
import { korsatkichlar, baho, tekshiruv, evakuatsiya, ishlar, xizmatHavo, kwHavo, ceoHavo, xonaMaydoni, HAVO } from './tekshiruv.mjs';

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
.kor td, .kor th { border-bottom: .2mm solid #d9dde4; padding: .85mm 1.5mm; vertical-align: top; font-size: 7.6pt; }
.kor th { background: #eef1f5; text-align: left; color: #444; }
.kor td:first-child { color: #444; width: 32%; }
.kor td:nth-child(2) { font-weight: 700; }
.kor td:last-child { text-align: center; color: #555; width: 16%; }
.og { color: #c0392b; }
.qn { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-top: 4mm; }
.qn > div { padding: 3mm 3.5mm; }
.qulay { background: #eef7ee; border-left: 1mm solid #2e7d32; }
.noqulay { background: #fbeeee; border-left: 1mm solid #c0392b; }
.qulay h4 { color: #2e7d32; } .noqulay h4 { color: #c0392b; }
h4 { font-size: 10pt; margin-bottom: 1.5mm; }
ul { padding-left: 3.5mm; } li { margin-bottom: 1.3mm; }
.tavsiya { margin-top: 3mm; background: #fff6e0; border-left: 1mm solid #b7791f; padding: 3mm 4mm; }
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
    <td class="${new Set(k.partaQator).size > 1 ? 'og' : ''}">${k.parta} (${k.orin})</td><td>${sm(k.qadam)}</td><td>${sm(k.doska)}</td><td>${mm(k.oxirgi)}</td>
    <td class="${Math.min(k.yonChap, k.yonOng) < 200 ? 'og' : ''}">${sm(k.yonChap)}–${sm(k.yonOng)}</td><td class="${k.orqaZona < 650 ? 'og' : ''}">${sm(k.orqaZona)}</td><td class="${bahoKlass(baho(k))}">${baho(k)}</td></tr>`;
  const plan = rejaSvg({ rejim: 'izoh', vb: { x1: -700, y1: -700, x2: ICHKI.x + 700, y2: ICHKI.y + 700 }, k: 1.5 });
  const sigim = [...new Set(kor.map(k => k.orin))].sort((a, b) => b - a)
    .map(o => `${kor.filter(k => k.orin === o).length} ta ${o} o'rinli`).join(' + ');
  return bet(1, `
    <div class="brend">${LOYIHA.brend} · ${LOYIHA.filial}</div>
    <h1>${LOYIHA.qavat}: xonalar bo'yicha izoh</h1>
    <div class="sub">${LOYIHA.manzil} · ${LOYIHA.qavat} (umumiy ${LOYIHA.umumiy} m², foydali ${LOYIHA.foydali} m²) · Chizma ${LOYIHA.versiya}, ${LOYIHA.sana} · O. Mirzayev tasdig'i uchun</div>
    <div class="kpi">
      <div><b>7 sinf</b><span>${sigim}</span></div>
      <div><b>${jamiOrin} o'rin</b><span>jami bir vaqtda</span></div>
      <div><b>${Math.round(jamiA)} m²</b><span>sinflar; + sotuv, admin, ustozlar, call-markaz, CEO; koworking ${b1(xonaMaydoni(XONALAR.find(x => x.kod === 'KW')))} m²</span></div>
      <div><b>${t.toqnashuv.length + t.toSilgan.length}</b><span>to'qnashuv va doskani to'suvchi ustun</span></div>
    </div>
    <div style="width:122mm;margin:0 auto">${plan}</div>
    <h2 style="margin-top:3mm">Xonalar solishtiruvi</h2>
    <table class="solish">
      <tr><th>Xona</th><th>O'lcham, m</th><th>Maydon, m²</th><th>1 kishiga, m²</th><th>Partalar (o'rin)</th><th>Qator qadami, sm</th><th>Doska → 1-parta, sm</th><th>Oxirgi parta, m</th><th>Yon chekka, sm</th><th>Orqa zona, sm</th><th>Baho</th></tr>
      ${kor.map(qator).join('')}
      <tr class="std"><td>Beruniy</td><td>—</td><td>—</td><td>—</td><td>24 (24)</td><td>130</td><td>244</td><td>6.84</td><td>—</td><td>—</td><td>standart</td></tr>
    </table>
    <p class="izohm">1–3 va 5–7-xonalarda doska yon devorda (deraza o'quvchilarning chap tomonida): o'lcham — doska devori bo'ylab × doskadan orqa devorgacha. Partalar ikki kishilik, ${PARTA.eni / 10} × ${PARTA.chuq / 10} sm (Beruniyda bir kishilik, ${STANDART.parta.eni / 10} × ${STANDART.parta.chuq / 10} sm). Qator qadami = parta (${PARTA.chuq / 10} sm) + stul va o'tish joyi. Oxirgi parta = doskadan eng orqa partaning orqa chetigacha. Yon chekka = eng chetdagi partadan devorgacha. Orqa zona = oxirgi stuldan orqa devorgacha bo'sh joy. Baho: A'lo — to'liq standart va yon chekka ≥ 40 sm; Yaxshi — standart qadam va masofalar, lekin yon chekka tor; Qoniqarli — qadam yoki masofa standartdan kam.</p>
  `);
}

// ---------- 2-bet: 3D ----------
function bet2(rasm) {
  const r = (k, t) => `<div><img src="${rasm[k]}"><p>${t}</p></div>`;
  return bet(2, `<h2 style="margin-top:0">3D ko'rinishlar</h2><div class="rasmlar">
    ${r('sr1', '1-xona — orqa devordan doskaga: doska yon devorda, derazalar o\'quvchilarning chap tomonida')}
    ${r('sr4', '4-xona — orqa devordan doskaga: doska o\'ng asosiy (tashqi) devorda, derazasiz xona')}
    ${r('kw', 'Koworking / tadbirlar zali — kirish zalidan: chapda derazalar, o\'ngda o\'tish yo\'lagi')}
    ${r('sotuv', 'Koworking yo\'lagidan K2 koridoriga (kirish zalidan 2 m): chapda offline sotuv va admin xonalarining shisha devorlari')}
    ${r('k1', 'K1 koridori — koworkingdan o\'ngga: chapda 1–3-xonaning shisha devorlari, o\'ngda xizmat xonalari')}
    ${r('tepa', 'Butun qavat — tepadan umumiy ko\'rinish (to\'q sariq — yangi devorlar)')}
  </div>
  <p class="izohm" style="margin-top:4mm">3D model chizmadagi o'lchamlardan qurilgan; derazalar joyi va toza balandlik (${H / 1000} m) taxminiy. To'sinlar fotoda ko'rsatilmagan — joyida o'lchanadi.</p>`);
}

// ---------- xona sahifalari ----------
const TAVSIF = {
  SR1: '1-xona · yuqori qator, chap', SR2: '2-xona · yuqori qator, o\'rta', SR3: '3-xona · yuqori qator, o\'ng',
  SR4: '4-xona · o\'ng qanot, derazasiz', SR5: '5-xona · pastki qator, o\'ng', SR6: '6-xona · pastki qator, o\'rta', SR7: '7-xona · pastki qator, chap',
};

function xonaMatni(k, ev) {
  const x = k.xona;
  const yuqori = x.doska === 'past';
  const yon = Math.min(k.yonChap, k.yonOng);
  const ustunlar = k.ustunlar.filter(u => u.partagacha < 1000);
  const ustunMatn = ustunlar.map(u => u.kod).join(', ');
  const taxminiy = k.ustunlar.filter(u => u.holat === 'taxminiy').map(u => u.kod);
  const q = [], n = [];
  let tavsiya = '';
  const shishaTavsiya = k.shisha ? `Koridor tomonidagi shisha — laminatlangan akustik, 1.0–1.6 m balandlikda matli polosa bilan. ` : '';
  if (x.kod === 'SR4') {
    q.push(`Doska <b>o'ng asosiy (tashqi) devorda</b> — mustahkam devor, doska va proyektor qavsi uchun qulay; deraza yo'q — ekranga yorug'lik tushmaydi.`);
    q.push(`Eshik <b>orqa tomonda</b> (K2 koridoridan) — kechikkan o'quvchi darsni buzmaydi.`);
    q.push(`1 kishiga <b>${k.kishiga.toFixed(2)} m²</b> — qavatdagi eng keng sinf.`);
    q.push(`Koridor tomonidagi devorlar shisha (${mm(k.shisha)} m) — derazasiz xona yopiq tuyulmaydi.`);
    if (ustunlar.length) q.push(`${ustunMatn} ustuni orqa devorda, guruhlar orasidagi yo'lak ro'parasida — doskani to'smaydi.`);
    n.push(`<b>Derazasiz</b>: tabiiy yorug'lik va shamollatish yo'q — PV qurilma va konditsioner majburiy, yoritish kunduzgi spektrda (4000 K).`);
    n.push(`O'ng devor qo'shni bino bilan umumiy; egasining aytishicha orqasida tor oraliq bor — PV-4 panjaralari shu oraliqqa chiqariladi (kirish va chiqish bir-biridan ~7 m uzoq). Oraliq eni joyida o'lchanadi; havo turg'un bo'lsa, kanal K2 shifti orqali fasadga.`);
    n.push(`L shaklidagi xona: 1–2-qatorlar butun uzunlik bo'ylab (4 tadan parta, 8 o'rin), 3-qator faqat keng qismda (2 parta, 4 o'rin) — tor uchlari 4.5 m chuqur.`);
    n.push(`Doska → 1-parta ${sm(k.doska)} sm, stul orqasidan keyingi partagacha ${sm(k.stulOrqasi)} sm, chetki old o'rindan qarash burchagi ${b1(k.burchak)}° (Beruniy: ${sm(STANDART.doska)} sm, 36 sm, 39.8°) — Beruniy mezoni bo'yicha "Qoniqarli"; orqa bo'sh zona ${sm(k.orqaZona)} sm.`);
    tavsiya = `${shishaTavsiya}Devorlar va shift och rangda, yoritish ≥ 500 lk. CO₂ datchigi majburiy.`;
  } else {
    const devor = x.kod === 'SR3' ? "o'ng tashqi devorda (qo'shni bino tomoni)" : x.kod === 'SR7' ? 'kirish zali va CEO xonasi bilan umumiy devorda' : "qo'shni sinf bilan umumiy mavjud devorda";
    q.push(`Doska derazaga qarama-qarshi emas — <b>yon devorda</b>: deraza o'quvchilarning chap tomonida, kunduzgi yorug'lik doska va proyektor ekraniga tushmaydi, yozayotgan qo'l soya tashlamaydi.`);
    q.push(`Noutbuk ekranlariga ham deraza aksi tushmaydi — yorug'lik yondan keladi.`);
    q.push(`Oxirgi parta doskadan ${mm(k.oxirgi)} m (Beruniy — ${mm(STANDART.oxirgi)} m): orqa qatordan ham doska yaqin. Oxirgi partadan orqa devorgacha ${sm(k.D - k.oxirgi)} sm — Beruniy qoidasi (≥ 65 sm) bajarilgan.`);
    q.push(`Qatorda ${Math.max(...k.partaQator)} ta ikki kishilik parta (${PARTA.eni / 10} × ${PARTA.chuq / 10} sm), oralarida ${sm(k.yolak)} sm yo'lak — har bir o'rinning yonida yo'lak yoki bitta sherik.`);
    if (ustunlar.length) q.push(`Ustun xona ichida emas: ${ustunMatn} devorda, partalardan ${sm(Math.min(...ustunlar.map(u => u.partagacha)))} sm narida — doskani to'smaydi.`);
    q.push(`Derazadan qarama-qarshi devorgacha ${mm(k.W)} m — tabiiy shamollatish (≈ 2.5 × H) deyarli butun xonaga yetadi.`);
    n.push(`Chetdagi old partadan doskaga qarash burchagi <b>${b1(k.burchak)}°</b> (Beruniy — 39.8°): doska devori uzun (${mm(k.W)} m), 1-qatorning chetki o'rinlaridan doska qiyaroq ko'rinadi.`);
    n.push(`Parta ${PARTA.chuq / 10} sm chuqur (Beruniyda ${STANDART.parta.chuq / 10} sm): 3 qator ${mm(k.D)} m ga sig'ishi uchun doska → 1-parta ${sm(k.doska)} sm (standart ${sm(STANDART.doska)}), stul orqasidan keyingi partagacha ${sm(k.stulOrqasi)} sm (standart 36) — Beruniy mezoni bo'yicha "Qoniqarli".`);
    n.push(`1 kishiga <b>${k.kishiga.toFixed(2)} m²</b>; orqa bo'sh zona <b>${sm(k.orqaZona)} sm</b> — oxirgi qator orqasidan o'tib bo'lmaydi, shkaf uchun joy yo'q.`);
    n.push(`Deraza tomonidagi partalar devordan ${sm(k.partadanOynagacha ?? yon)} sm — radiator joyi joyida tekshiriladi (kerak bo'lsa yupqa panel radiator).`);
    n.push(k.eshikOldda ? `Eshik doska tomonda — kechikkan o'quvchi sinf oldidan kiradi.`
      : `Eshik orqa tomonda (K1 uchida, boshqa joy yo'q) — eshik oldidagi 2 o'rin olingan, sig'im ${k.orin}.`);
    n.push(`Doska ${devor} — doska va proyektor qavsi uchun devor mustahkamligi tekshiriladi.`);
    if (taxminiy.length) n.push(`${taxminiy.join(', ')} ustun(lar)i fotoda ko'rinmaydi — joyida tekshirish kerak.`);
    if (x.kod === 'SR3' || x.kod === 'SR5') n.push(`Koridorning berk uchida: eng uzoq o'rindan ZN2 zinasigacha ~${Math.round(ev.gacha2 / 1000)} m.`);
    tavsiya = `${shishaTavsiya}Derazalarga roller parda yoki jalyuzi. Proyektor o'rniga interaktiv panel (LED) qo'yilsa, yorug'lik muammosi umuman qolmaydi. Sumkalar uchun parta ostiga ilgak.`;
  }
  return { q, n, tavsiya };
}

function xonaBeti(k, i, ev) {
  const x = k.xona;
  const vb = { x1: x.x1 - 600, y1: x.y1 - 600, x2: x.x2 + 600, y2: x.y2 + 600 };
  const plan = rejaSvg({ rejim: 'izoh', vb, urgu: x, k: 1 });
  const d = k.derazalar;
  const derazaMatn = d.length ? `${d.map(z => mm(z.uz)).join(' + ')} m, ${d[0].devor} devorda (${d[0].tomon}) — taxminiy` : 'yo\'q (derazasiz xona)';
  const ustun = k.ustunlar.filter(u => u.partagacha < 1000);
  const ustunMatn = ustun.length ? `${ustun.map(u => u.kod + (u.holat === 'taxminiy' ? '*' : '')).join(', ')} devordan 10 sm chiqadi; eng yaqin partagacha ${sm(Math.min(...ustun.map(u => u.partagacha)))} sm (${x.kod === 'SR4' ? 'orqa devorda, yo\'lak ro\'parasida' : 'yon tomonda'})` : 'yo\'q';
  const esh = `${x.koridor} koridori devorida, ${k.eshikOldda ? 'old tomonda (doska yonida)' : 'orqa tomonda'}, 90 sm`;
  const std = STANDART;
  const tekis = new Set(k.partaQator).size === 1;
  const qatorMatn = tekis ? `${k.partaQator.length} qator × ${k.partaQator[0]} parta` : `${k.partaQator.join(' + ')} parta`;
  const r = (a, b, c, og = false) => `<tr><td>${a}</td><td class="${og ? 'og' : ''}">${b}</td><td>${c}</td></tr>`;
  const pv = QURILMALAR[i];
  const rows = [
    r("O'lcham", `${mm(k.W)} × ${mm(k.D)} m`, '—'),
    r('1 kishiga maydon', `${k.kishiga.toFixed(2)} m²`, '—'),
    r('Partalar joylashuvi', `${qatorMatn}, ${PARTA.eni / 10}×${PARTA.chuq / 10} sm (${PARTA.kishi} kishilik)`, `4 × 6, ${STANDART.parta.eni / 10}×${STANDART.parta.chuq / 10}`, !tekis),
    r('Doska → 1-parta', `${sm(k.doska)} sm`, `${sm(std.doska)} sm`, k.doska < std.doska),
    r('Qator qadami', `${sm(k.qadam)} sm`, `${sm(std.qadam)} sm`, k.qadam < std.qadam),
    r('Stul orqasi → keyingi parta', `${sm(k.stulOrqasi)} sm`, '36 sm'),
    r("Guruhlar orasidagi yo'lak", `${sm(k.yolak)} sm`, `${sm(std.yolak)} sm`, k.yolak < std.yolak),
    r('Oxirgi parta (doskadan)', `${mm(k.oxirgi)} m`, `${mm(std.oxirgi)} m`, k.oxirgi > std.oxirgi),
    r("Chetdagi o'quvchining qarash burchagi", `${b1(k.burchak)}°`, '39.8°'),
    r('Yon chekka (devor)', `${sm(k.yonChap)}–${sm(k.yonOng)} sm`, '—', Math.min(k.yonChap, k.yonOng) < 200),
    r("Orqa bo'sh zona", `${sm(k.orqaZona)} sm`, '—', k.orqaZona < 650),
    r('Deraza', derazaMatn, '—'),
    r('Partadan oynagacha', k.partadanOynagacha == null ? '—' : `${sm(k.partadanOynagacha)} sm`, '—'),
    r('Ustun', ustunMatn, '—'),
    r('Eshik', esh, '—'),
    r('Koridor tomoni', k.shisha ? `shisha devor ${mm(k.shisha)} m` : 'faqat eshik (koridor uchi)', '—'),
    r('Havo almashinuvi', `${k.havo.Q} m³/soat · ${b1(k.havo.karra)} marta/soat · ${pv.kod}`, '—'),
    r('Sovutish (taxminiy)', `≈ ${b1(k.havo.sovutishYaxlit)} kVt`, '—'),
    r('Evakuatsiya (eng uzoq o\'rindan ZN2 gacha)', `~${Math.round(ev.gacha2 / 1000)} m`, '—'),
  ];
  const { q, n, tavsiya } = xonaMatni(k, ev);
  return bet(i + 3, `
    <div class="sarlavha"><b>${k.kod} — ${TAVSIF[k.kod]}</b><span>${b1(k.A)} m² · ${k.orin} o'rin · ${k.parta} parta</span></div>
    <div class="ikki"><div>${plan}<p class="izohm">Eski ${x.eskiRaqam}-xona o'rnida. Qizil ramka — xona chegarasi.</p></div>
      <table class="kor"><tr><th>Ko'rsatkich</th><th>${k.kod}</th><th style="text-align:center">Beruniy</th></tr>${rows.join('')}</table></div>
    <div class="qn"><div class="qulay"><h4>Qulayliklar</h4><ul>${q.map(t => `<li>${t}</li>`).join('')}</ul></div>
      <div class="noqulay"><h4>Noqulayliklar</h4><ul>${n.map(t => `<li>${t}</li>`).join('')}</ul></div></div>
    <div class="tavsiya"><b>Tavsiya.</b> ${tavsiya}</div>
  `);
}

// ---------- havo almashinuvi ----------
export function kesimSvg(m = 1) {
  // Sinf kesimi doska devoriga parallel: chapda deraza (fasad), o'ngda koridor devori, orqa fonda yon devordagi doska.
  // Shift ichida PV (deraza devori yonida), kanal, diffuzorlar (doska tomonda) va so'rish panjaralari (orqa devor yonida).
  const sr = korsatkichlar().find(k => k.kod === 'SR2');
  const L = sr.W, Hh = 3000, s = [], j = sr.xona.j;
  s.push(`<rect x="0" y="0" width="${L}" height="${Hh}" fill="#f5f3ee"/>`);
  s.push(`<rect x="-300" y="-500" width="300" height="${Hh + 700}" fill="#4d5566"/><rect x="-300" y="900" width="300" height="1500" fill="#fff" stroke="#555" stroke-width="15"/>`);
  s.push(`<rect x="${L}" y="-500" width="100" height="${Hh + 700}" fill="#262b36"/>`);
  s.push(`<rect x="-300" y="${Hh}" width="${L + 400}" height="200" fill="#8a8f99"/><rect x="-300" y="-500" width="${L + 400}" height="200" fill="#8a8f99"/>`);
  s.push(`<line x1="0" y1="-20" x2="${L}" y2="-20" stroke="#bbb" stroke-width="10"/><line x1="0" y1="300" x2="${L}" y2="300" stroke="#999" stroke-width="15" stroke-dasharray="80 50"/>`);
  // yon devordagi doska — kesim ortida (orqa fonda)
  const d1 = L / 2 - j.s.doskaEni / 2;
  s.push(`<rect x="${d1}" y="900" width="${j.s.doskaEni}" height="1200" fill="#2e5e45" opacity=".28" stroke="#2e5e45" stroke-width="20" stroke-dasharray="70 40"/>`);
  // partalar va o'quvchilar (bir qator: 4 ta ikki kishilik parta)
  let u = j.u0;
  j.s.bloklar.forEach(n => {
    for (let i = 0; i < n; i++) {
      s.push(`<rect x="${u}" y="${Hh - 750}" width="${PARTA.eni}" height="30" fill="#c9a36e"/>`);
      for (let o = 0; o < PARTA.kishi; o++) {
        const c = u + (o + 0.5) * j.orinEni;
        s.push(`<rect x="${c - 195}" y="${Hh - 470}" width="390" height="40" fill="#7f9cd6"/>`);
        s.push(`<circle cx="${c}" cy="${Hh - 1250}" r="120" fill="#c7cbd3"/><rect x="${c - 100}" y="${Hh - 1130}" width="200" height="650" rx="80" fill="#c7cbd3"/>`);
      }
      u += PARTA.eni;
    }
    u += j.s.yolak;
  });
  // PV, kanal, panjaralar
  const df = [L / 3, 2 * L / 3];
  s.push(`<rect x="250" y="20" width="1300" height="260" fill="#fff" stroke="#222" stroke-width="20" stroke-dasharray="60 30"/><text x="900" y="200" font-size="170" text-anchor="middle" font-weight="700">PV</text>`);
  s.push(`<line x1="-1500" y1="90" x2="240" y2="90" stroke="#1f6fd1" stroke-width="60" marker-end="url(#kk)"/>`);
  s.push(`<line x1="240" y1="220" x2="-1500" y2="220" stroke="#d1452f" stroke-width="60" marker-end="url(#kq)"/>`);
  s.push(`<line x1="1550" y1="120" x2="${df[1] + 450}" y2="120" stroke="#1f6fd1" stroke-width="90"/>`);
  df.forEach(x => s.push(`<rect x="${x - 250}" y="280" width="500" height="40" fill="#1f6fd1"/><path d="M${x},340 L${x},900" stroke="#1f6fd1" stroke-width="40" marker-end="url(#kk)"/>`));
  df.forEach(x => s.push(`<rect x="${x + 250}" y="280" width="450" height="40" fill="#d1452f" opacity=".75"/><path d="M${x + 475},1000 L${x + 475},360" stroke="#d1452f" stroke-width="40" stroke-dasharray="90 50" marker-end="url(#kq)"/>`));
  const t = (x, y, matn, a = 'middle', c = '#333') => `<text x="${x}" y="${y}" font-size="${210 * m}" text-anchor="${a}" fill="${c}">${matn}</text>`;
  const fs = 210 * m;
  const R = L + 250;
  s.push(t(-2550, 30, 'toza havo', 'start', '#1f6fd1'), t(-2550, 260 + fs, 'chiqarish', 'start', '#d1452f'),
    t(-2550, 700 + 2 * fs, 'fasad', 'start', '#555'), t(-2550, 760 + 3 * fs, 'panjarasi', 'start', '#555'),
    t(-2550, 2300 + fs, 'deraza', 'start', '#333'),
    t(L / 2, 1300, 'doska (yon devorda)', 'middle', '#2e5e45'),
    t(R, 30, 'diffuzor —', 'start', '#1f6fd1'), t(R, 30 + fs, 'doska oldida', 'start', '#1f6fd1'),
    t(R, 400 + 2 * fs, 'so\'rish —', 'start', '#d1452f'), t(R, 400 + 3 * fs, 'orqa devorda', 'start', '#d1452f'),
    t(R, 2300 + fs, 'koridor', 'start', '#555'), t(R, 2300 + 2 * fs, 'devori', 'start', '#555'));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2650 -600 ${L + 5350} ${Hh + 850}" width="100%" font-family="Liberation Sans, Arial">
    <defs>${['kk:#1f6fd1', 'kq:#d1452f', 'kh:#5b8fd6'].map(v => { const [i, c] = v.split(':'); return `<marker id="${i}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`; }).join('')}</defs>${s.join('')}</svg>`;
}

function havoBeti(kor, n) {
  const xz = xizmatHavo(), kw = kwHavo();
  const q = (nom, odam, h, deraza, pv) => `<tr><td><b>${nom}</b></td><td>${odam}</td><td>${b1(h.A)}</td><td>${Math.round(h.V)}</td><td>${h.Q}</td><td>${b1(h.karra)}</td><td>${b1(h.sovutishYaxlit)}</td><td>${deraza}</td><td>${pv}</td></tr>`;
  const rows = kor.map((k, i) => q(k.kod, k.odam, { ...k.havo, A: k.A }, k.derazalar.length ? k.derazalar[0].tomon : '<span class="og">yo\'q</span>', QURILMALAR[i].kod));
  xz.forEach(z => rows.push(q(`${z.kod} · ${z.nomi}`, z.odam, z, '<span class="og">yo\'q</span>', 'PV-9')));
  rows.push(q('KW (tadbir)', 70, kw.tadbir, 'chap devorda', 'PV-8'));
  rows.push(q('X12 · CEO', 5, ceoHavo(), 'burchak (2 devor)', 'tabiiy + KD'));
  const barcha = [...kor.map(k => k.havo), ...xz, kw.tadbir];
  const jamiQ = barcha.reduce((s, h) => s + h.Q, 0);
  const jamiS = barcha.reduce((s, h) => s + h.sovutishYaxlit, 0);
  return bet(n, `
    <h2 style="margin-top:0">Havo almashinuvi</h2>
    <p><b>Nima uchun mexanik ventilyatsiya kerak.</b> 1–3 va 5–7-xonalarda derazadan qarama-qarshi devorgacha 7.7 m: bir tomonlama tabiiy shamollatish (~2.5 × H ≈ 7.5 m) deyarli butun xonaga yetadi, lekin qishda va +40 °C yozda derazalar yopiq turadi — 25 kishi soatiga ~450 l CO₂ chiqaradi, 20–30 daqiqada havo og'irlashadi. <b>4-xona, offline sotuv, admin, ustozlar xonasi va call-markazda deraza umuman yo'q</b> — ular uchun mexanik ventilyatsiya majburiy.</p>
    <h2>Hisob</h2>
    <table class="havo"><tr><th>Xona</th><th>Odam</th><th>Maydon, m²</th><th>Hajm, m³</th><th>Havo, m³/soat</th><th>Marta / soat</th><th>Sovutish, kVt</th><th>Deraza</th><th>Qurilma</th></tr>
      ${rows.join('')}<tr class="jami"><td>Jami</td><td></td><td></td><td></td><td>${jamiQ}</td><td></td><td>${b1(jamiS)}</td><td></td><td>9 ta PV</td></tr></table>
    <p class="izohm">${HAVO.kishiga} m³/soat har bir kishiga: bir kishi soatiga ~18 l CO₂ chiqaradi, 18 l ÷ (1000 − 420) ppm ≈ 31 m³/soat — shunda xonada CO₂ 1000 ppm dan oshmaydi. Hajm toza balandlik ${H / 1000} m (taxmin) bo'yicha. Sovutish — odamlar, noutbuklar, proyektor, yoritish, derazadan quyosh va toza havo (rekuperator FIK ${HAVO.rekuperator * 100}%) yig'indisi; OV loyihachisi aniqlashtiradi.</p>
    <h2>Yechim</h2>
    <div style="margin:1mm auto 2mm;width:76%">${kesimSvg(1.1)}</div>
    <ul>
      <li><b>PV-1…PV-7</b> — har sinfga rekuperatorli kiritish-chiqarish qurilmasi, ~750 m³/soat, shovqin ≤ 35 dB(A), deraza devori yonida shift ichida. Toza havo <b>doska oldida</b> beriladi, <b>orqa devor yonida</b> so'riladi — oqim o'quvchilar ustidan doskadan orqaga o'tadi.</li>
      <li><b>PV-4 (4-xona)</b> — o'ng devor qo'shni bino bilan umumiy, orqasida tor oraliq bor: panjaralar shu oraliqqa chiqariladi, kirish va chiqish bir-biridan ~7 m uzoq. Oraliq eni joyida o'lchanadi; havo turg'un bo'lsa, kanal K2 koridori shifti orqali fasadga.</li>
      <li><b>PV-9</b> — sotuv (XZ1), admin (XZ2), ustozlar (XZ3) va call-markaz (XZ4) uchun: havo koworking chap devoridan olinadi va K1 koridori shifti orqali beriladi. Xodimlar kun bo'yi o'tiradi — qurilma ish vaqti davomida to'xtovsiz ishlaydi.</li>
      <li><b>PV-8 (koworking)</b> — tadbirda ~70 kishi uchun ~${kw.tadbir.Q} m³/soat; kundalik rejimda ~${kw.kundalik.Q} m³/soat.</li>
      <li><b>CO₂ datchigi</b> qurilmani boshqaradi: xona bo'sh bo'lsa o'chadi, dars paytida havo miqdorini oshiradi.</li>
      <li><b>Konditsioner:</b> har sinfga 2 ta ichki blok (kasseta yoki kanalli), jami ~${Math.round(jamiS)} kVt; tashqi bloklar fasadda yoki tomda — joyini ijaraga beruvchi bilan kelishish.</li>
      <li><b>V-1</b> — sanuzel chiqarish ventilyatsiyasi 4 × 50 = 200 m³/soat; mavjud shaxta ishlashini tekshirish. Tutun chiqarish talabini yong'in xavfsizligi mutaxassisi belgilaydi.</li>
    </ul>
    <p class="izohm">Joylashuv sxemasi — A3 chizmaning 3-varag'i ("Havo almashinuvi sxemasi").</p>
  `);
}

// ---------- butun qavat ----------
function qavatBeti(kor, t, ev, n) {
  const ish = ishlar();
  const eng = ev.reduce((a, b) => (Math.min(b.gacha1, b.gacha2) > Math.min(a.gacha1, a.gacha2) ? b : a));
  const berk = (19300 - 5950) / 1000;
  const yon = kor.filter(k => k.xona.deraza);
  const m = (a, b) => `<tr><td>${a}</td><td>${b}</td></tr>`;
  return bet(n, `
    <h2 style="margin-top:0">Butun qavat bo'yicha masalalar</h2>
    <table class="masala">
      ${m('Evakuatsiya', `Ikkala zina (ZN1, ZN2) qavatning chap qismida, ikkala koridor koworking zaliga chiqadi. K1 va K2 ning o'ng uchlari berk: koworkinggacha ${berk.toFixed(1)} m. Eng uzoq o'rindan (${eng.kod}) eng yaqin zinagacha ~${Math.round(Math.min(eng.gacha1, eng.gacha2) / 1000)} m. ZN1 ga faqat xo'jalik xonasi (6) orqali, ~70 sm eshik bilan chiqiladi. Koworking o'ng tomonidagi ~1.6 m yo'lak doim bo'sh turishi kerak. ${t.orinlar} o'quvchi va xodimlar uchun evakuatsiya yo'llarini yong'in xavfsizligi mutaxassisi bilan tasdiqlatish kerak.`)}
      ${m('Derazasiz xonalar', `4-xona (20 o'rin), offline sotuv, admin, ustozlar xonasi va call-markazda tabiiy yorug'lik va shamollatish yo'q; xodimlar kun bo'yi o'tiradi. Mexanik ventilyatsiya, konditsioner va yaxshi yoritish majburiy (10-bet). CEO xonasi derazali (2 devor).`)}
      ${m('Doska va yorug\'lik', `1–3 va 5–7-xonalarda doska derazaga qarama-qarshi devordan <b>yon devorga</b> ko'chirildi: deraza o'quvchilarning chap tomonida, yorug'lik doska va proyektor ekraniga tushmaydi. Evaziga xona doska bo'ylab keng (7.7 m) va sayoz (${mm(Math.min(...yon.map(k => k.D)))}–${mm(Math.max(...yon.map(k => k.D)))} m) bo'lib qoldi: 3 qator × 4 ta ikki kishilik parta (${PARTA.eni / 10} × ${PARTA.chuq / 10} sm), doska → 1-parta ${sm(yon[0].doska)} sm, stul orqasidan keyingi partagacha ${sm(yon[0].stulOrqasi)} sm, chetki old o'rindan qarash burchagi ~${Math.round(yon[0].burchak)}° (Beruniy — 244 sm, 36 sm, 39.8°). 3-xonada eshik faqat orqa tomonda bo'la oladi — 22 o'rin. 4-xonada doska o'ng asosiy (tashqi) devorda, eshik orqada (K2 dan).`)}
      ${m('Shisha devorlar', `Sinflarning koridor tomonidagi devorlari shisha (jami ~${b1(kor.reduce((s, k) => s + k.shisha, 0) / 1000)} m; 3 va 5-xonada koridorga faqat eshik chiqadi). Eshiklar yog'och (ovoz uchun). Shisha — laminatlangan akustik (kamida 2 × 6 mm), 1.0–1.6 m balandlikda matli polosa; doskalar shisha devorda emas.`)}
      ${m('Sinflar zichligi', `1–3 va 5–7-xonalarda 1 kishiga ~${b1(yon.reduce((s, k) => s + k.kishiga, 0) / yon.length)} m², orqa bo'sh zona ${sm(Math.min(...yon.map(k => k.orqaZona)))}–${sm(Math.max(...yon.map(k => k.orqaZona)))} sm — Beruniy qoidasi (oxirgi partadan devorgacha ≥ 65 sm) bajariladi, lekin shkaf uchun joy yo'q.`)}
      ${m('Hojatxona yetishmaydi', `WC (A) va WC (B) da jami 4 ta unitaz. ${t.orinlar} o'quvchi va ~10 xodimga taxminan 6–8 unitaz kerak (1 unitaz 20–30 kishiga). Yechim: tanaffuslarni xonalar bo'yicha 5–10 daqiqa farq bilan qo'yish; 1-qavatdagi hojatxonalardan foydalanish imkonini ijaraga beruvchi bilan aniqlash.`)}
      ${m('Yangi devorlar', `~${ish.yangiUz.toFixed(1)} m GKL 100 (≈ ${Math.round(ish.yangiUz * 3)} m²) va ~${ish.shishaUz.toFixed(1)} m shisha devor (sinflar, sotuv va admin), ${ish.buzUz.toFixed(1)} m devor buziladi (eski o'rta devor va koridorlarga tushgan bo'laklar), ${ish.yangiEshik} ta yangi eshik. Doskalar mavjud yoki tashqi devorlarda (3 va 4-xonada — o'ng tashqi devorda).`)}
      ${m('Joyida o\'lchanmagan', `Derazalar joyi va o'lchami; U8, U9 ustunlari (fotoda ko'rinmaydi); devor qalinliklari; toza balandlik (hisobda ${H / 1000} m); to'sinlar; radiatorlar; o'ng devor ortidagi oraliq eni.`)}
      ${m('Hujjatlar', `Mavjud chizmada: «Xonalar ichki qismi loyiha hujjatlarisiz qayta ta'mirlangan». Devorlarni buzish va qurishdan oldin ijaraga beruvchining yozma roziligi olinadi. 8-xonaning raqami fotoda ko'rinmaydi.`)}
    </table>
    <h2>Chizma tekshiruvi (avtomatik)</h2>
    <ul class="check">
      <li>Partalar va stullar: ${t.orinlar} o'rin, jami ${t.jihozlar} ta jihoz (sinflar, xizmat xonalari, koworkingning ikki rejimi, admin) — o'zaro, devor, ustun va zina bilan to'qnashuv: <b>${t.toqnashuv.length}</b>.</li>
      <li>Ustun doskani to'sib qo'ygan o'rin: <b>${t.toSilgan.length}</b> (har bir o'rindan doskaning ikki cheti va markazigacha to'g'ri chiziq tekshirildi).</li>
      <li>Beruniy ustun qoidasi (ustundan parta oldi/orqasi kamida 50 sm): ${t.ustunQoidasi.length ? `<b class="og">${t.ustunQoidasi.length} ta buzilish</b>` : 'bajarilgan'}.</li>
      <li>Eshik ochilganda boshqa eshik, doska yoki jihozga tegishi: <b>${t.eshik.length}</b>.</li>
      <li>Barcha doskalar kar devorda: ${t.doskaDevor.length ? `<b class="og">${t.doskaDevor.join('; ')}</b>` : 'ha'}.</li>
    </ul>
    <h2>Tasdiqlash uchun savollar</h2>
    <ul>
      <li>XZ1 (offline sotuv) ning koworking tomonidagi devorini ham shisha qilamizmi — mijoz kirish zalidan to'g'ridan-to'g'ri ko'radi?</li>
      <li>O'ng devor ortidagi oraliq eni — o'lchangach PV-4 yechimi aniqlashtiriladi.</li>
      <li>Havo almashinuvi: har xonaga alohida PV qurilma (tavsiya) yoki markaziy tizim?</li>
      <li>Tanaffuslarni xonalar bo'yicha surish (hojatxona va koridorlar yuklamasi uchun) ma'qulmi?</li>
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
