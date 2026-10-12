// A3 chizma varaqlari (HTML → PDF): 1 — mavjud holat va o'zgarishlar, 2 — jihozlash rejasi, 3 — havo almashinuvi.
import { LOYIHA, ICHKI, USTUNLAR, OQLAR, STANDART, PARTA, STUL, H, ESKI_XONALAR, XONALAR, KW_TADBIR } from './model.mjs';
import { rejaSvg, RANG, son, KOR_RANG } from './reja-svg.mjs';
import { tizimPanel, TZ_RANG, REK } from './hvac-tizim.mjs';
import { korsatkichlar, ishlar, xizmatHavo, kwHavo, ceoHavo, xonaMaydoni, HAVO } from './tekshiruv.mjs';

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
.panel { position: absolute; right: 3mm; top: 3mm; bottom: 3mm; width: 108mm; display: flex; flex-direction: column; gap: 1.5mm; font-size: 6.1pt; }
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
    <tr><td>Offline sotuv (XZ1) va admin (XZ2)</td><td class="r">${m2(x('XZ1') + x('XZ2'))}</td></tr>
    <tr><td>Ustozlar (XZ3), call-markaz (XZ4)</td><td class="r">${m2(x('XZ3') + x('XZ4'))}</td></tr>
    <tr><td>Koworking / tadbirlar zali (KW)</td><td class="r">${m2(x('KW'))}</td></tr>
    <tr><td>CEO xonasi (12-xona, o'zgarmaydi)</td><td class="r">${m2(x('X12'))}</td></tr>
    <tr><td>Koridorlar K1, K2 va kirish zali ZL</td><td class="r">${m2(kor2)}</td></tr>
    <tr><td>Zinalar, ayollar WC va o'tish yo'lagi (devorlari o'zgarmaydi)</td><td class="r">${m2(x('ZN1') + x('ZN2') + ['2', '3', '4', '5', '6'].reduce((t, k2) => t + x(k2), 0))}</td></tr>
    <tr><td>Balandlik (poldan shiftgacha)</td><td class="r">${H} mm (buyurtmachi)</td></tr>
  </table>`;
}

function xonalarJadvali() {
  const kor = korsatkichlar();
  const x12 = XONALAR.find(r => r.kod === 'X12');
  const rows = kor.map(k => `<tr><td>${k.kod} · ${k.kod.slice(2)}-xona</td><td>${(k.W / 1000).toFixed(2)} × ${(k.D / 1000).toFixed(2)}${k.xona.bolaklar ? ' (L)' : ''}</td><td class="r">${v(k.A)}</td><td class="r">${k.orin}</td><td class="r">${v(k.kishiga)}</td><td>${k.partaQator.join('+')}</td></tr>`).join('');
  const xz = XONALAR.filter(r => r.tur === 'xizmat');
  return `<h3>XONALAR</h3><table><tr><th>Xona</th><th>O'lcham, m</th><th class="r">m²</th><th class="r">O'rin</th><th class="r">m²/kishi</th><th>Partalar</th></tr>${rows}
    <tr><td>XZ1 · sotuv</td><td>2.80 × 5.60</td><td class="r">${v(xonaMaydoni(xz[0]))}</td><td class="r">2</td><td class="r">—</td><td>2 stol + 4 mijoz stuli, shisha devor</td></tr>
    <tr><td>XZ2 · admin</td><td>2.80 × 5.60</td><td class="r">${v(xonaMaydoni(xz[1]))}</td><td class="r">2</td><td class="r">—</td><td>2 stol + 2 mehmon stuli, shisha devor</td></tr>
    <tr><td>XZ3 · ustozlar</td><td>2.85 × 5.60</td><td class="r">${v(xonaMaydoni(xz[2]))}</td><td class="r">9</td><td class="r">—</td><td>umumiy stol, lokerlar</td></tr>
    <tr><td>XZ4 · call-markaz</td><td>2.85 × 5.60</td><td class="r">${v(xonaMaydoni(xz[3]))}</td><td class="r">6</td><td class="r">—</td><td>devor bo'ylab 6 ish o'rni</td></tr>
    <tr><td>CEO (12-xona)</td><td>5.95 × 2.95</td><td class="r">${v(xonaMaydoni(x12))}</td><td class="r">1</td><td class="r">—</td><td>ish stoli + 4 kishilik stol, derazali</td></tr>
    <tr><td>KW</td><td>5.95 × 11.85</td><td class="r">${v(xonaMaydoni(XONALAR.find(r => r.kod === 'KW')))}</td><td class="r">~35</td><td class="r">—</td><td>koworking; sahna — XZ1 devori, tadbirda ${KW_TADBIR.stullar.length} o'rin</td></tr>
    <tr class="jami"><td>Jami</td><td></td><td class="r">${v(kor.reduce((t, k) => t + k.A, 0))}</td><td class="r">${kor.reduce((t, k) => t + k.orin, 0)}</td><td></td><td>${[...new Set(kor.map(k => k.orin))].sort((a, b) => b - a).map(o => `${kor.filter(k => k.orin === o).length} × ${o}`).join(' + ')}</td></tr></table>`;
}

function ustunJadvali() {
  const rows = USTUNLAR.filter(u => u.ichki).map(u => `<tr><td>${u.kod}</td><td>${u.ox}-${u.oy}</td><td class="r">${son(u.x)}</td><td class="r">${son(u.y)}</td><td class="r">400 × 400${u.holat === 'taxminiy' ? ' <span class="qizil">*</span>' : ''}</td></tr>`).join('');
  const oq = a => a.slice(1).map((p, i) => son(p[1] - a[i][1])).join(' · ');
  return `<h3>USTUNLAR — MAVJUD</h3><table><tr><th>Kod</th><th>O'q</th><th class="r">X</th><th class="r">Y</th><th class="r">O'lcham</th></tr>${rows}</table>
  <p class="izoh" style="margin-top:.6mm">Koordinata — ichki yuzaning yuqori-chap burchagidan, ustun markazi bo'yicha; o'qlar taxminiy. <span class="qizil">*</span> U8, U9 fotoda ko'rinmaydi — to'r bo'yicha qo'yilgan (devor ichida), joyida tekshirilsin.</p>`;
}

function partaQoidasi() {
  const t = XONALAR.find(r => r.kod === 'SR1').sinf, n = t.bloklar.length;
  return `<h3>PARTA TO'RI (Xadra filiali)</h3><p class="izoh">
    parta ${PARTA.eni} × ${PARTA.chuq} (${PARTA.kishi} kishilik) · stul ${STUL.eni} × ${STUL.chuq}<br>
    qatorda ${n} parta (${n * PARTA.kishi} o'rin) · yo'lak ${t.yolak} · deraza tomonda devorgacha ${t.oynaChekka}<br>
    ${t.qatorlar} qator · qadam ${son(t.qadam)} (parta ${PARTA.chuq} + stul va o'tish ${t.qadam - PARTA.chuq})<br>
    doskadan 1-partagacha ${son(t.doska)} · oxirgi parta ${son(t.doska + (t.qatorlar - 1) * t.qadam + PARTA.chuq)} · sig'im ${n * PARTA.kishi * t.qatorlar}<br>
    <span class="qizil">ISTISNO: SR3 — doska va ustoz joyi kirish tomonida (buyurtmachi), deraza o'quvchilarning o'ng tomonida; SR4 — 4 + 4 + 2 parta, 20 o'rin (doska o'ng tashqi devorda)</span><br>
    <span style="color:#777">Beruniy standarti: parta ${STANDART.parta.eni} × ${STANDART.parta.chuq} (1 kishilik), 2 + 2 + 2 × ${STANDART.qatorlar} qator, qadam ${son(STANDART.qadam)}, doskadan ${son(STANDART.doska)}, oxirgi ${son(STANDART.oxirgi)}</span><br>
    ustundan: oldi/orqa 500 · yon 0. Doska 3000 yon (kar) devorda, deraza o'quvchilarning chap tomonida (SR3 dan tashqari); eshiklar 900.<br>
    K1, K2 koridorlari 1500. Yangi devorlar — GKL 100; sinflarning koridor tomoni — akustik shisha.<br>
    KW: o'ng tomonda ~1,6 m o'tish yo'lagi bo'sh (6-xona — ZN1 ga o'tish, K1, K2, kirish zali); sahna — XZ1 devorida, podiumsiz.<br>
    Ayollar WC: 2 kabina eng ichkarida (2, 3 — unitaz), oldida tambur (4, 5 — rakovina); ikki eshik orqali kiriladi.<br>
    Ofis xonalari (XZ1–XZ4): eshik tomoni shisha devor; barcha yangi eshiklar shisha.<br>
    XZ3 — ustozlar xonasi, XZ4 — call-markaz va online sotuv; 12-xona — CEO (mavjud holicha).<br>
    Zinalar mavjud holicha; 1-qavatda zina oldida resepshn va turniket.
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
    sw(`background:#cfe6f7;border:.3mm solid ${RANG.yangi}`, 'yangi shisha devor (koridor tomoni)'),
    sw(`background:repeating-linear-gradient(45deg,#b9b4a8 0 .4mm,#fff .4mm 1.6mm)`, 'o\'zgarmaydigan qism'),
    sw(`border:0;border-top:.5mm solid ${RANG.yangi}`, 'yangi eshik (900)'),
    sw(`background:${RANG.devorT}`, 'tashqi devor'),
    sw(`background:${RANG.ustun};width:3.2mm`, 'ustun'),
  ];
  else if (rejim === 'jihoz') q = [...umumiy,
    sw(`background:${RANG.parta};border-color:${RANG.partaCh}`, `parta ${PARTA.eni} × ${PARTA.chuq} (${PARTA.kishi} kishilik)`),
    sw(`background:${RANG.stul};border-color:${RANG.stulCh};width:3.2mm`, `stul ${STUL.eni} × ${STUL.chuq}`),
    sw(`background:${RANG.doska};height:1.2mm`, 'doska (kar devorda)'),
    sw(`background:${RANG.ustoz}`, 'o\'qituvchi / xodim stoli'),
    sw(`background:#e3f2fb;border:.3mm solid #2f78b7;height:1.4mm`, 'shisha devor (koridor tomoni)'),
    sw(`background:${KOR_RANG.logo};height:1.2mm;border:0`, 'yorituvchi logotip (koridor oxiri, GKL devor)'),
    sw(`background:${KOR_RANG.elon};height:1.2mm;border:0`, "e'lonlar doskasi"),
    sw(`background:${KOR_RANG.etirof};height:1.2mm;border:0`, "e'tirof doskasi (faxriylar, oy o'quvchisi)"),
    sw(`background:#2a2e33;height:1.4mm;border:0;box-shadow:inset -1mm 0 0 ${KOR_RANG.logo}`, 'koworking sahnasi (XZ1 devori): logotip, ekran, reyka'),
  ];
  else q = [
    sw(`background:#fff;border:.35mm dashed #222`, `R1, R2 — ${REK.brend} rekuperatori (koridor shiftida)`),
    sw(`background:${TZ_RANG.sa};height:1.2mm;border:0`, 'toza havo kanali (rekuperatordan xonalarga)'),
    sw(`background:${TZ_RANG.ra};height:1.2mm;border:0`, "so'rish kanali (xonalardan rekuperatorga)"),
    sw(`background:${TZ_RANG.oa};height:1.2mm;border:0`, 'tashqi havo kanali (fasaddan)'),
    sw(`background:${TZ_RANG.ea};height:1.2mm;border:0`, 'chiqarish kanali (fasadga)'),
    sw(`background:#dbe9fb;border:.3mm solid ${TZ_RANG.sa};width:3.2mm`, 'toza havo diffuzori'),
    sw(`background:#fbe1dc;border:.3mm solid ${TZ_RANG.ra};width:3.2mm`, "so'rish panjarasi"),
    sw(`background:#eef0f3;border:.3mm solid ${TZ_RANG.split};width:3.2mm`, 'split — ichki blok (devorda), yozuv: BTU/soat'),
    sw(`background:#fff;border:.3mm solid ${TZ_RANG.split};width:3.2mm`, 'split — tashqi blok (fasadda; punktir — joyi aniqlanadi)'),
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
    <b>O'zgarmaydi</b> (buyurtmachi talabi): ZN1 va ZN2 zinalari, sanuzel bloki devorlari (2–6; ichi — ayollar WC, 6 — ZN1 ga o'tish yo'lagi), 12-xona.<br>
    <b>Buziladi:</b> eski o'rta devor (8–10 va 13–15-xonalar orasida); 7 va 11-xonalar orasidagi devor; K1, K2 koridorlariga tushgan devor bo'laklari.<br>
    <b>Quriladi:</b> K1 va K2 koridorlarining devorlari (sinflar tomoni — shisha; doskalar yon va tashqi devorlarda), o'rta qatordagi 4 ta ofis xonasi (sotuv, admin, ustozlar, call-markaz) va 4-xona devorlari; xonalar orasidagi bo'shliqlar yopiladi.
  </p></div>
  <div><h3>ISHLAR HAJMI (taxminiy)</h3><table>
    <tr><td>Yangi devor, GKL 100</td><td class="r">${v(ish.yangiUz)} m · ≈ ${Math.round(ish.yangiUz * H / 1000)} m²</td></tr>
    <tr><td>Shisha devor (koridor tomoni)</td><td class="r">${v(ish.shishaUz)} m · ≈ ${Math.round(ish.shishaUz * H / 1000)} m²</td></tr>
    <tr><td>Buziladigan devor</td><td class="r">${v(ish.buzUz)} m</td></tr>
    <tr><td>Yangi eshik, 900 × 2100</td><td class="r">${ish.yangiEshik} ta</td></tr>
  </table></div>
  <div><h3>IZOH</h3><p class="izoh">Fotodagi chizmada: «Xonalar ichki qismi loyiha hujjatlarisiz qayta ta'mirlangan». Devorlarni buzish va qurishdan oldin ijaraga beruvchining yozma roziligi olinadi. O'lchamlar fotodan olingan — ish boshlanishidan oldin joyida o'lchanadi.</p></div>`;
}

function havoPanel() {
  return tizimPanel();
}

export function varaqlarHtml(faqat = [1, 2, 3]) {
  const plan = rejim => rejaSvg({ rejim, vb: VB, olchamlar: true, olchamMm: true, annotatsiya: rejim === 'jihoz' });
  const varaq = (rejim, panel, nom, n) => `<section class="varaq"><div class="ramka">
      <div class="reja">${plan(rejim)}</div>
      <div class="panel">${panel}${masshtab}${belgilar(rejim)}${shtamp(nom, n)}</div>
    </div></section>`;
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — chizma</title><style>${CSS}</style></head><body>
    ${faqat.includes(1) ? varaq('mavjud', mavjudPanel(), 'Mavjud holat va o\'zgarishlar', 1) : ''}
    ${faqat.includes(2) ? varaq('jihoz', maydonJadvali() + xonalarJadvali() + ustunJadvali() + partaQoidasi(), 'Jihozlash rejasi', 2) : ''}
    ${faqat.includes(3) ? varaq('havo', havoPanel(), 'Ventilyatsiya va konditsionerlash', 3) : ''}
  </body></html>`;
}
