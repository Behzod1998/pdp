// A3 chizma varaqlari (HTML → PDF): 1 — mavjud holat va o'zgarishlar, 2 — jihozlash rejasi, 3 — havo almashinuvi.
import { LOYIHA, ICHKI, USTUNLAR, OQLAR, STANDART, PARTA, STUL, H, ESKI_XONALAR, XONALAR } from './model.mjs';
import { rejaSvg, RANG, QURILMALAR, son } from './reja-svg.mjs';
import { korsatkichlar, ishlar, admHavo, xonaMaydoni, HAVO } from './tekshiruv.mjs';

const VB = { x1: -2500, y1: -2300, x2: 25600, y2: 25700 };
const v = n => n.toFixed(1).replace('.', ',');           // Beruniy panelidagi kabi vergul
const m2 = n => `${v(n)} m²`;

const CSS = `
@page { size: 420mm 297mm; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
body { font-family: 'Liberation Sans', Arial, sans-serif; color: #1a1f2b; }
.varaq { width: 420mm; height: 297mm; position: relative; overflow: hidden; page-break-after: always; background: #fff; }
.ramka { position: absolute; left: 12mm; top: 6mm; right: 6mm; bottom: 6mm; border: 0.6mm solid #111; }
.reja { position: absolute; left: 1.5mm; top: 1.5mm; }
.panel { position: absolute; right: 3mm; top: 3mm; bottom: 3mm; width: 108mm; display: flex; flex-direction: column; gap: 1.9mm; font-size: 6.3pt; }
h3 { font-size: 7.4pt; color: #16307a; letter-spacing: .02em; border-bottom: 0.35mm solid #16307a; padding-bottom: .6mm; margin-bottom: .8mm; }
table { width: 100%; border-collapse: collapse; }
td, th { padding: .4mm .8mm; border-bottom: .15mm solid #d5d8de; text-align: left; vertical-align: top; }
th { font-weight: 700; color: #444; font-size: 6.2pt; }
td.r, th.r { text-align: right; }
tr.jami td { font-weight: 700; border-top: .3mm solid #999; }
.izoh { color: #444; line-height: 1.38; }
.izoh b { color: #1a1f2b; }
.qizil { color: ${RANG.qizil}; }
.belgi { display: grid; grid-template-columns: 7mm 1fr 7mm 1fr; gap: .9mm 1.6mm; align-items: center; }
.sw { height: 3.2mm; border: .15mm solid #777; }
.shtamp { margin-top: auto; border: .45mm solid #111; font-size: 6.4pt; }
.shtamp div { border-bottom: .2mm solid #111; padding: 1mm 1.6mm; }
.shtamp .nom { font-weight: 700; color: #16307a; font-size: 8.2pt; }
.shtamp .chizma { display: grid; grid-template-columns: 22mm 1fr; padding: 0; }
.shtamp .chizma span { padding: 1.4mm 1.6mm; }
.shtamp .chizma span + span { border-left: .2mm solid #111; font-size: 11pt; font-weight: 700; }
.shtamp .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); padding: 0; }
.shtamp .grid4 span { padding: .8mm 1.6mm; }
.shtamp .grid4 span:not(:first-child) { border-left: .2mm solid #111; }
.shtamp .grid4 small { display: block; color: #666; font-size: 5.6pt; }
.shtamp .grid4 b { font-size: 8pt; }
.shtamp .imzo { display: flex; justify-content: space-between; color: #555; }
.shtamp .imzo i { flex: 1; border-bottom: .2mm solid #777; margin-left: 4mm; }
.shtamp div:last-child { border-bottom: 0; }
.masshtab { display: flex; flex-direction: column; gap: .8mm; }
.masshtab .bar { display: flex; width: 50mm; height: 1.8mm; border: .2mm solid #111; }
.masshtab .bar i { flex: 1; }
.masshtab .bar i:nth-child(odd) { background: #111; }
.masshtab .son { display: flex; justify-content: space-between; width: 52mm; font-size: 5.8pt; }
`;

function shtamp(chizma, varaq) {
  return `<div class="shtamp">
    <div class="nom">${LOYIHA.brend} · ${LOYIHA.filial}</div>
    <div class="chizma"><span>Chizma</span><span>${chizma}</span></div>
    <div>Manba: mavjud holat chizmasi (foto), ${LOYIHA.qavat} · umumiy ${LOYIHA.umumiy} m², foydali ${String(LOYIHA.foydali).replace('.', ',')} m²</div>
    <div>${LOYIHA.manzil} — ${LOYIHA.qavat}</div>
    <div class="grid4"><span><small>Masshtab</small><b>1:100</b></span><span><small>Sana</small><b>${LOYIHA.sana}</b></span><span><small>Versiya</small><b>${LOYIHA.versiya}</b></span><span><small>Varaq</small><b>${varaq} / 3</b></span></div>
    <div class="imzo">Bajardi <i></i></div>
    <div class="imzo">Tekshirdi / tasdiqladi — direktor <i></i></div>
  </div>`;
}

const masshtab = `<div class="masshtab"><b style="font-size:6.6pt">MASSHTAB 1:100</b><div class="bar"><i></i><i></i><i></i><i></i><i></i></div><div class="son"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5 m</span></div></div>`;
const sw = (css, t) => `<span class="sw" style="${css}"></span><span>${t}</span>`;

function maydonJadvali() {
  const kor = korsatkichlar();
  const sinf = kor.reduce((t, k) => t + k.A, 0);
  const x = kod => xonaMaydoni(XONALAR.find(r => r.kod === kod));
  const kor2 = x('K1') + x('K2') + x('ZL');
  return `<h3>MAYDON</h3><table>
    <tr><td>Ichki gabarit</td><td class="r">${son(ICHKI.x)} × ${son(ICHKI.y)}</td></tr>
    <tr><td>Umumiy maydon (hujjat)</td><td class="r">${LOYIHA.umumiy} m²</td></tr>
    <tr><td>Foydali maydon (hujjat)</td><td class="r">${String(LOYIHA.foydali).replace('.', ',')} m²</td></tr>
    <tr><td>O'quv xonalari, 7 ta · ${kor.reduce((t, k) => t + k.orin, 0)} o'rin</td><td class="r">${m2(sinf)}</td></tr>
    <tr><td>Admin va sotuv (ADM, 12-xona)</td><td class="r">${m2(x('ADM'))}</td></tr>
    <tr><td>Koridorlar K1, K2 va zina oldi zali ZL</td><td class="r">${m2(kor2)}</td></tr>
    <tr><td>Zinalar va sanuzel bloki (o'zgarmaydi)</td><td class="r">${m2(x('ZN1') + x('ZN2') + ['2', '3', '4', '5', '6'].reduce((t, k2) => t + x(k2), 0))}</td></tr>
    <tr><td>Toza balandlik</td><td class="r">${H} mm <span class="qizil">(taxmin)</span></td></tr>
  </table>`;
}

function xonalarJadvali() {
  const kor = korsatkichlar();
  const adm = XONALAR.find(r => r.kod === 'ADM');
  const rows = kor.map(k => `<tr><td>${k.kod}</td><td>${(k.W / 1000).toFixed(2)} × ${(k.D / 1000).toFixed(2)}</td><td class="r">${v(k.A)}</td><td class="r">${k.orin}</td><td class="r">${v(k.kishiga)}</td><td>${k.qatorlar.length} × ${k.qatorlar[0]} (${k.bloklar.join('+')})</td></tr>`).join('');
  return `<h3>XONALAR</h3><table><tr><th>Xona</th><th>O'lcham, m</th><th class="r">m²</th><th class="r">O'rin</th><th class="r">m²/kishi</th><th>Partalar</th></tr>${rows}
    <tr><td>ADM</td><td>5.95 × 2.95</td><td class="r">${v(xonaMaydoni(adm))}</td><td class="r">4</td><td class="r">—</td><td>4 stol + 4 mijoz stuli</td></tr>
    <tr class="jami"><td>Jami</td><td></td><td class="r">${v(kor.reduce((t, k) => t + k.A, 0))}</td><td class="r">${kor.reduce((t, k) => t + k.orin, 0)}</td><td></td><td>6 × 24 + 1 × 20</td></tr></table>`;
}

function ustunJadvali() {
  const rows = USTUNLAR.filter(u => u.ichki).map(u => `<tr><td>${u.kod}</td><td>${u.ox}-${u.oy}</td><td class="r">${son(u.x)}</td><td class="r">${son(u.y)}</td><td class="r">400 × 400${u.holat === 'taxminiy' ? ' <span class="qizil">*</span>' : ''}</td></tr>`).join('');
  const oq = a => a.slice(1).map((p, i) => son(p[1] - a[i][1])).join(' · ');
  return `<h3>USTUNLAR — MAVJUD</h3><table><tr><th>Kod</th><th>O'q</th><th class="r">X</th><th class="r">Y</th><th class="r">O'lcham</th></tr>${rows}</table>
  <p class="izoh" style="margin-top:1mm">Koordinata — ichki yuzaning yuqori-chap burchagidan, ustun markazi bo'yicha. O'qlar (taxminiy): 1…5 — ${oq(OQLAR.x)}; A…E — ${oq(OQLAR.y)}.<br><span class="qizil">*</span> U8, U9 fotoda ko'rinmaydi — to'r bo'yicha qo'yilgan, ular devor ichiga tushadi. Joyida tekshirilsin.</p>`;
}

function partaQoidasi() {
  const blok = STANDART.bloklar.reduce((t, n) => t + n * PARTA.eni, 0) + (STANDART.bloklar.length - 1) * STANDART.yolak;
  return `<h3>PARTA TO'RI (Beruniy standarti)</h3><p class="izoh">
    parta ${PARTA.eni} × ${PARTA.chuq} · stul ${STUL.eni} × ${STUL.chuq}<br>
    qatorda 6 parta: 2 + 2 + 2 · guruhlar orasi ${STANDART.yolak} · blok eni ${son(blok)}<br>
    qator qadami ${son(STANDART.qadam)} (parta 500 + o'tish 800) · 4 qator<br>
    doskadan 1-partagacha ${son(STANDART.doska)} · oxirgi parta ${son(STANDART.oxirgi)} · sig'im 24<br>
    ustundan: oldi/orqa 500 · yon 0<br>
    <span class="qizil">ISTISNO: SR7 — qatorda 5 parta (2 + 3), 4 qator, sig'im 20; yon chekka 150</span><br>
    Doska 3000 (SR7 — 2400) kar devorda; eshiklar 900, ichkariga ochiladi, doska yonida.<br>
    K1, K2 koridorlari 1500. Yangi devorlar — GKL 100, ovoz izolyatsiyali.<br>
    ADM (12-xona) va zinalar mavjud holicha; 1-qavatda zina oldida resepshn va turniket.
  </p>`;
}

function belgilar(rejim) {
  const umumiy = [
    sw(`background:${RANG.devorI}`, 'kesilgan ichki devor'),
    sw(`background:${RANG.devorT}`, 'kesilgan tashqi devor'),
    sw(`background:${RANG.ustun};width:3.2mm`, 'mavjud ustun 400 × 400'),
    sw(`background:#fff;border:.35mm dashed #111;width:3.2mm`, 'taxminiy ustun (fotoda yo\'q)'),
    sw(`background:#fff;border:.2mm solid #555;height:1.6mm`, 'deraza (joyi taxminiy)'),
  ];
  let q = [];
  if (rejim === 'mavjud') q = [
    sw(`background:${RANG.devorI}`, 'saqlanadigan devor'),
    sw(`background:#fff;border:.35mm dashed ${RANG.buz}`, 'buziladigan devor'),
    sw(`background:${RANG.yangi}`, 'yangi devor (GKL 100 / bo\'shliqni yopish)'),
    sw(`background:repeating-linear-gradient(45deg,#b9b4a8 0 .4mm,#fff .4mm 1.6mm)`, 'o\'zgarmaydigan qism'),
    sw(`border:0;border-top:.5mm solid ${RANG.yangi}`, 'yangi eshik (900)'),
    sw(`background:${RANG.devorT}`, 'tashqi devor'),
    sw(`background:${RANG.ustun};width:3.2mm`, 'ustun'),
  ];
  else if (rejim === 'jihoz') q = [...umumiy,
    sw(`background:${RANG.parta};border-color:${RANG.partaCh}`, `parta ${PARTA.eni} × ${PARTA.chuq}`),
    sw(`background:${RANG.stul};border-color:${RANG.stulCh};width:3.2mm`, `stul ${STUL.eni} × ${STUL.chuq}`),
    sw(`background:${RANG.doska};height:1.2mm`, 'doska (kar devorda)'),
    sw(`background:${RANG.ustoz}`, 'o\'qituvchi / xodim stoli'),
  ];
  else q = [
    sw(`background:#fff;border:.35mm dashed #222`, 'PV — rekuperatorli kiritish-chiqarish qurilmasi (shift ichida)'),
    sw(`background:${RANG.kok};height:1.2mm;border:0`, 'toza havo kanali'),
    sw(`background:#dbe9fb;border:.3mm solid ${RANG.kok};width:3.2mm`, 'toza havo diffuzori'),
    sw(`background:#fbe1dc;border:.3mm solid ${RANG.havoQ};width:3.2mm`, 'so\'rish panjarasi'),
    sw(`background:${RANG.kok};height:2mm;border:0;width:2.4mm`, 'fasad panjarasi: toza havo kirishi'),
    sw(`background:${RANG.havoQ};height:2mm;border:0;width:2.4mm`, 'fasad panjarasi: iflos havo chiqishi'),
    sw(`background:#f1f2f4;border:.3mm solid #555;width:3.2mm`, 'KD — konditsioner ichki bloki'),
    sw(`border:0;border-top:.5mm dashed #5b8fd6`, 'xonadagi havo oqimi'),
    sw(`background:#fff;border:.3mm solid #2e7d32;border-radius:50%;width:3.2mm`, 'CO₂ datchigi'),
  ];
  return `<h3>SHARTLI BELGILAR</h3><div class="belgi">${q.join('')}</div>`;
}

function mavjudPanel() {
  const ish = ishlar();
  const rows = ESKI_XONALAR.map(([n, a]) => `<tr><td>${n}</td><td class="r">${a ? a.toFixed(2).replace('.', ',') : '—'}</td></tr>`);
  const yarmi = Math.ceil(rows.length / 2);
  const ustun = (r) => `<table><tr><th>№</th><th class="r">m²</th></tr>${r.join('')}</table>`;
  return `<div><h3>MAVJUD HOLAT (fotodagi chizma)</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4mm">${ustun(rows.slice(0, yarmi))}${ustun(rows.slice(yarmi))}</div>
    <p class="izoh" style="margin-top:1mm">Umumiy maydon ${LOYIHA.umumiy} m², foydali ${String(LOYIHA.foydali).replace('.', ',')} m². 8-xonaning raqami va maydoni fotoda ko'rinmaydi (hisob bo'yicha ≈ 70 m²).</p></div>
  <div><h3>O'ZGARISHLAR</h3><p class="izoh">
    <b>O'zgarmaydi</b> (buyurtmachi talabi): ZN1 va ZN2 zinalari, sanuzel bloki (2–6), 12-xona — ADM.<br>
    <b>Buziladi:</b> 7 va 11-xonalar orasidagi devor; 13–15-xonalarning koridor qismidagi devorlari; SR1–SR3 eshiklari uchun o'rta devorda teshik.<br>
    <b>Quriladi:</b> K1 koridorining janubiy devori (SR4–SR6 doskalari shu devorda), SR7 va K2 orasidagi devor, xonalar orasidagi bo'shliqlar yopiladi.
  </p></div>
  <div><h3>ISHLAR HAJMI (taxminiy)</h3><table>
    <tr><td>Yangi devor, GKL 100</td><td class="r">${v(ish.yangiUz)} m · ≈ ${Math.round(ish.yangiUz * H / 1000)} m²</td></tr>
    <tr><td>Buziladigan devor</td><td class="r">${v(ish.buzUz)} m</td></tr>
    <tr><td>Yangi eshik, 900 × 2100</td><td class="r">${ish.yangiEshik} ta</td></tr>
  </table></div>
  <div><h3>IZOH</h3><p class="izoh">Fotodagi chizmada: «Xonalar ichki qismi loyiha hujjatlarisiz qayta ta'mirlangan». Devorlarni buzish va qurishdan oldin ijaraga beruvchining yozma roziligi olinadi. O'lchamlar fotodan olingan — ish boshlanishidan oldin joyida o'lchanadi.</p></div>`;
}

function havoPanel() {
  const kor = korsatkichlar();
  const adm = admHavo();
  const qatorlar = kor.map((k, i) => `<tr><td>${k.kod}</td><td class="r">${k.odam}</td><td class="r">${son(k.havo.Q)}</td><td class="r">${Math.round(k.havo.V)}</td><td class="r">${v(k.havo.karra)}</td><td class="r">${v(k.havo.sovutishYaxlit)}</td><td>${QURILMALAR[i].kod}</td></tr>`);
  qatorlar.push(`<tr><td>ADM</td><td class="r">6</td><td class="r">${son(adm.Q)}</td><td class="r">${Math.round(adm.V)}</td><td class="r">${v(adm.karra)}</td><td class="r">${v(adm.sovutishYaxlit)}</td><td>PV-8</td></tr>`);
  const jamiQ = kor.reduce((t, k) => t + k.havo.Q, 0) + adm.Q;
  const jamiS = kor.reduce((t, k) => t + k.havo.sovutishYaxlit, 0) + adm.sovutishYaxlit;
  return `<div><h3>HAVO ALMASHINUVI — XONALAR BO'YICHA</h3><table>
    <tr><th>Xona</th><th class="r">Odam</th><th class="r">Havo, m³/soat</th><th class="r">Hajm, m³</th><th class="r">Marta / soat</th><th class="r">Sovutish, kVt</th><th>Qurilma</th></tr>
    ${qatorlar.join('')}
    <tr class="jami"><td>Jami</td><td></td><td class="r">${son(jamiQ)}</td><td></td><td></td><td class="r">${v(jamiS)}</td><td></td></tr>
  </table></div>
  <div><h3>HISOB ASOSI</h3><p class="izoh">
    <b>${HAVO.kishiga} m³/soat har bir kishiga</b> (o'quvchilar + o'qituvchi). Bir kishi soatiga ~18 l CO₂ chiqaradi: 18 l ÷ (1000 − 420) ppm ≈ 31 m³/soat — xonada CO₂ 1000 ppm dan oshmaydi.<br>
    Hajm — toza balandlik ${H} mm (taxmin) bo'yicha. Sovutish — odamlar, noutbuklar, proyektor, yoritish, derazadan quyosh va toza havo (rekuperator FIK ${HAVO.rekuperator * 100}%) yig'indisi, Toshkent yozi (+40 °C) uchun dastlabki baho.
  </p></div>
  <div><h3>YECHIM</h3><p class="izoh">
    <b>Nega faqat deraza yetmaydi:</b> SR1–SR6 chuqurligi 10,4–12,2 m, deraza faqat orqadagi qisqa devorda. Bir tomonlama tabiiy shamollatish ~2,5 × H ≈ 7,5 m gacha yetadi — doska tomondagi 3–5 m havosiz qoladi. Qish va yozda derazalar yopiq bo'ladi.<br>
    <b>Har sinfga alohida PV qurilma</b> (rekuperatorli, ~750 m³/soat, shovqin ≤ 35 dB(A)): deraza devori yonida shift ichida, havo fasad panjarasidan olinadi va chiqariladi. Toza havo doska tomonga beriladi, orqa tomondan so'riladi — oqim o'quvchilar ustidan o'tadi. CO₂ datchigi bilan boshqariladi; bo'sh xona o'chadi.<br>
    <b>Konditsioner:</b> har sinfga 2 ta KD (kasseta yoki kanalli), tashqi bloklar fasadda yoki tomda.<br>
    <b>SR7:</b> derazalar uzun (chap) devorda, xona eni 4,35 m — tabiiy shamollatish yaxshi ishlaydi; PV-7 yopiq deraza mavsumi uchun.<br>
    <b>V-1:</b> sanuzel chiqarish ventilyatsiyasi 4 × 50 = 200 m³/soat — mavjud shaxtani tekshirish. Koridorlar sanuzel orqali so'riladigan havo bilan shamollatiladi; tutun chiqarish talabini yong'in xavfsizligi mutaxassisi belgilaydi.
  </p></div>`;
}

export function varaqlarHtml() {
  const plan = rejim => rejaSvg({ rejim, vb: VB, olchamlar: true, olchamMm: true, annotatsiya: rejim === 'jihoz' });
  const varaq = (rejim, panel, nom, n) => `<section class="varaq"><div class="ramka">
      <div class="reja">${plan(rejim)}</div>
      <div class="panel">${panel}${masshtab}${belgilar(rejim)}${shtamp(nom, n)}</div>
    </div></section>`;
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — chizma</title><style>${CSS}</style></head><body>
    ${varaq('mavjud', mavjudPanel(), 'Mavjud holat va o\'zgarishlar', 1)}
    ${varaq('jihoz', maydonJadvali() + xonalarJadvali() + ustunJadvali() + partaQoidasi(), 'Jihozlash rejasi', 2)}
    ${varaq('havo', havoPanel(), 'Havo almashinuvi sxemasi', 3)}
  </body></html>`;
}
