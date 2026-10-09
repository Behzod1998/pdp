// Loyiha albomi: 1, 2 va 3-qavat — bitta PDF. Avval: node build.mjs, Blender renderlari (blender1/2/3.py),
// python3 xarajatlar.py + LibreOffice recalc. So'ng: node albom.mjs
// Yaratadi: chizma/Xadra_1-qavat_3D, Xadra_2-qavat_3D, Xadra_xarajatlar_xulosa (A3) va
//           chizma/Xadra_filiali_loyiha_albomi_<versiya>.pdf (muqova, mundarija, barcha varaqlar).
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { PDFDocument } from 'pdf-lib';
import { LOYIHA, H, KW_SAHNA, KW_TADBIR } from './model.mjs';
import { kwKorinish } from './render-svg.mjs';
import { tekshiruv } from './tekshiruv.mjs';
import { sinf3Korsatkich } from './qavat3.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch {
  ({ chromium } = require(join(process.execPath, '../../lib/node_modules/playwright')));
}
const BU = dirname(fileURLToPath(import.meta.url));
const CH = join(BU, '..', 'chizma'), D3 = join(CH, '3d');
const V = LOYIHA.versiya;

const rasm = async f => existsSync(join(D3, f)) ? `data:image/jpeg;base64,${(await readFile(join(D3, f))).toString('base64')}` : null;
const json = async f => existsSync(join(D3, f)) ? JSON.parse(await readFile(join(D3, f), 'utf8')) : { belgi: {} };
const usd = v => '$' + Math.round(v).toLocaleString('en-US');
const som = v => (Math.round(v / 1e5) / 10).toLocaleString('en-US') + ' mln so\'m';

const CSS = `
@page { size: 420mm 297mm; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
body { font-family: 'Liberation Sans', Arial, sans-serif; color: #222; }
.varaq { width: 420mm; height: 297mm; padding: 6mm 7mm; background: #fff; overflow: hidden; position: relative; page-break-after: always; }
header { display: flex; justify-content: space-between; align-items: flex-end; height: 11mm; }
header .brend { font-size: 8pt; color: #6b6b6b; font-weight: 700; }
header h1 { font-size: 15pt; color: #1f1f1f; }
header .ong { text-align: right; font-size: 7.2pt; color: #555; }
figure { position: relative; }
figure img { display: block; width: 100%; border-radius: 1.2mm; }
figcaption { font-size: 7.4pt; color: #333; margin: 1mm 0 2mm; line-height: 1.3; }
figcaption b { color: #1f1f1f; }
.yorliq { position: absolute; transform: translate(-50%, -50%); background: rgba(255,255,255,.88); border-radius: 1mm;
  padding: .6mm 1.6mm; font-size: 7.4pt; font-weight: 700; color: #1f1f1f; white-space: nowrap; box-shadow: 0 .3mm 1mm rgba(0,0,0,.25); }
.ikki { display: grid; grid-template-columns: 1fr 146mm; gap: 4mm; margin-top: 2mm; }
.tor { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3mm 4mm; margin-top: 2mm; }
.tor figure img { height: 108mm; object-fit: cover; }
.matn { font-size: 7.6pt; line-height: 1.45; color: #333; }
.matn p { margin-bottom: 1.4mm; } .matn b { color: #1f1f1f; }
.matn h3 { font-size: 9.5pt; margin: 0 0 1.5mm; color: #1f1f1f; }
table { width: 100%; border-collapse: collapse; font-size: 8pt; }
td, th { padding: .9mm 1.4mm; border-bottom: .2mm solid #ddd; text-align: left; }
th { background: #1F3657; color: #fff; font-weight: 700; }
td.r, th.r { text-align: right; white-space: nowrap; }
tr.jami td { font-weight: 700; background: #f2f2f2; }
tr.katta td { font-weight: 700; background: #d9e1f2; font-size: 9pt; }
tr.taxmin td { color: #8a5a00; background: #fff4d6; }
`;
const bosh = (sarlavha, o = '') => `<header><div><div class="brend">${LOYIHA.brend} · ${LOYIHA.filial}</div><h1>${sarlavha}</h1></div>
  <div class="ong">${V} · ${LOYIHA.sana}${o ? `<br>${o}` : ''}</div></header>`;
const yorliqlar = (b, nomlar) => Object.entries(b).filter(([k]) => nomlar[k]).map(([k, [x, y]]) =>
  `<div class="yorliq" style="left:${(x * 100).toFixed(2)}%;top:${(y * 100).toFixed(2)}%">${nomlar[k]}</div>`).join('');
const fig = (src, izoh, qosh = '') => src ? `<figure><img src="${src}">${qosh}</figure><figcaption>${izoh}</figcaption>` : '';

// ---------- 1-qavat 3D ----------
async function q1Varaq() {
  const b = (await json('umumiy-belgilar-1.json')).belgi;
  const nom = { resepshn: 'Resepshn', turniket: 'Turniketlar (kirish / chiqish)', zina: 'Zina (mavjud) — 2-qavatga', mehmon: 'Mehmonlar', logo: 'Logotip', tambur: 'Tambur' };
  return `<section class="varaq">${bosh("1-qavat — 3D ko'rinishlar (Blender): kirish zali", `Reja: Xadra_1-qavat_reja_${V}.pdf`)}
  <div class="ikki"><div>
    ${fig(await rasm('Xadra_1-qavat_3D_1-umumiy.jpg'), "<b>Umumiy ko'rinish</b> — shift olib tashlangan, devorlar 2.7 m da kesilgan. Zina, pol (oktagon plitka) va devorlar — mavjud holat (video bo'yicha).", yorliqlar(b, nom))}
    <div class="matn"><h3>Yechim (buyurtmachi sxemasi bo'yicha)</h3>
      <p><b>Turniket chizig'i</b> zal bo'ylab, eshikdan ~2 m ichkarida: o'ngda kirish (resepshn yonida), chaprog'ida chiqish; chapda evakuatsiya darvozasi (90 sm, chiqishga ochiladi), qolgani shisha to'siq. Turniketlar buyurtmachida mavjud.</p>
      <p><b>Resepshn</b> o'ng devor bo'ylab L shaklida: 1.8 m stoyka zalga qaragan (turniketlar va eshik ko'rinadi), qolgani past to'siq panellari; xodim turniketdan o'tgan zonadan eshikcha orqali kiradi. <b>Logotiplar</b>: xodim orqasidagi devorda ichidan yoritilgan katta logotip va stoyka panelida ikkinchisi (design.pdp.uz).</p>
    </div></div>
    <div>
      ${fig(await rasm('Xadra_1-qavat_3D_2-kirish.jpg'), "<b>Eshikdan kirganda.</b> Oldinda mavjud zina, turniketlar; o'ngda resepshn va yoritilgan logotip.")}
      ${fig(await rasm('Xadra_1-qavat_3D_3-resepshn.jpg'), "<b>Resepshn.</b> Stoyka va devordagi logotip, oldinda kirish turniketi.")}
    </div></div></section>`;
}

// ---------- 2-qavat 3D (2 varaq) ----------
async function q2Varaqlar(x) {
  const b = (await json('umumiy-belgilar-2.json')).belgi;
  const nom = { SR1: '1-xona', SR2: '2-xona', SR3: '3-xona', SR4: '4-xona', SR5: '5-xona', SR6: '6-xona', SR7: '7-xona', XZ1: 'Sotuv', XZ2: 'Admin',
    XZ3: 'Ustozlar', XZ4: 'Call-markaz', KW: 'Koworking', X12: 'CEO', K1: 'K1', K2: 'K2', ZL: 'Kirish zali' };
  const a = `<section class="varaq">${bosh("2-qavat — 3D ko'rinishlar (Blender): umumiy va koridorlar", `Rejalar: Xadra_2-qavat_taqdimot_reja_${V}.pdf`)}
  <div class="ikki"><div>
    ${fig(await rasm('Xadra_2-qavat_3D_1-umumiy.jpg'), `<b>Umumiy ko'rinish</b> — shiftsiz, devorlar 2.7 m da kesilgan. 7 sinf (${tekshiruv().orinlar} o'rin), sotuv, admin, ustozlar, call-markaz, koworking va CEO xonasi; ayollar WC — 2 kabina tambur ortida.`, yorliqlar(b, nom))}
    <div class="matn"><p><b>Koridorlar yorug' va zamonaviy:</b> shiftda uzluksiz chiziqli LED, och pol va devorlar, sinflarning shisha devorlari (1.0–1.6 m da matli polosa). Ikkala koridor oxirida 4-xonaning devori GKL, markazida ichidan yoritilgan PDP Academy logotipi — koridor boshidan to'g'ri ko'rinadi. 4-xonaning barcha devorlari GKL, faqat eshigi shisha. Kar devorlarda e'lonlar va e'tirof doskalari.</p></div>
  </div><div>
    ${fig(await rasm('Xadra_2-qavat_3D_2-koridor-K1.jpg'), "<b>K1 koridori</b> — koworkingdan: chapda 1–3-xona, o'ngda sotuv va admin orqa devorida doskalar, oxirida logotip.")}
    ${fig(await rasm('Xadra_2-qavat_3D_3-koridor-K2.jpg'), "<b>K2 koridori</b> — chapda sotuv va admin (shisha), o'ngda 5–7-xona, oxirida logotip.")}
    ${fig(await rasm('Xadra_2-qavat_3D_4-koridor-logotip.jpg'), "<b>K2 oxiri:</b> yorituvchi logotip devori va e'tirof doskasi.")}
  </div></div></section>`;
  const r = [
    ['Xadra_2-qavat_3D_5-koridor-doskalar.jpg', "<b>K1: e'lonlar va e'tirof doskasi</b> (faxriylar, oy o'quvchisi nomzodlari) — sotuv va admin xonalarining orqa devorida."],
    ['Xadra_2-qavat_3D_6-sotuv-xonasi.jpg', "<b>Offline sotuv (XZ1):</b> 2 konsultant, mijoz stullari, shkaf; orqa devorda brend devor (logotip), yon devorlarda bambuk panel."],
    ['Xadra_2-qavat_3D_7-admin-xonasi.jpg', "<b>Admin (XZ2):</b> 2 ish o'rni, shkaf, logotip, bambuk panel."],
    ['Xadra_2-qavat_3D_8-sinf-doska.jpg', "<b>2-xona → doska:</b> interaktiv doska yon devorda, bambuk panel; chapda derazalar, o'ngda koridor tomondagi shisha devor."],
    ['Xadra_2-qavat_3D_9-koworking.jpg', "<b>Koworking</b> — kundalik rejim, kirish zalidan; o'ngda sahna devori."],
  ];
  const kat = (await Promise.all(r.map(async ([f, iz]) => `<div>${fig(await rasm(f), iz)}</div>`))).join('');
  const b2 = `<section class="varaq">${bosh("2-qavat — 3D ko'rinishlar (Blender): doskalar, sotuv va admin, sinf, koworking")}
  <div class="tor">${kat}<div class="matn"><h3>Sotuv va admin xonalari — mebel va interyer</h3>
    <p>Mebel: konsultant / ish stollari (140 × 70, tumbali), ofis kreslolari, mijoz stullari, kutish divani (sotuvda), hujjat shkaflari. Interyer: orqa devorda brend devor (logotip, yashil chiziq), yon devorlarda bambuk panel, o'simliklar.</p>
    <p>Narxi noma'lum bo'lgani uchun xarajatlar jadvalida <b>taxminiy</b> (Toshkent bozori): sotuv ~$2,340, admin ~$1,470 — mebelchi narxi bilan almashtiriladi.</p>
    <p>Ranglar va materiallar — namuna; logotip design.pdp.uz dan.</p></div></div></section>`;
  const S = KW_SAHNA, xs = x.sahna, m = v => (v / 1000).toFixed(2).replace(/0$/, '');
  const b3 = `<section class="varaq">${bosh("2-qavat — koworking sahnasi (XZ1 devori): logotip va interyer", `Reja: Xadra_2-qavat_taqdimot_reja_${V}.pdf`)}
  <div class="ikki"><div>
    ${fig(await rasm('Xadra_2-qavat_3D_11-sahna-tomoshabin.jpg'), `<b>Tomoshabin tomonidan</b> — tadbir rejimi (${KW_TADBIR.stullar.length} o'rin), oxirgi qator ortidan, ko'z balandligi 1.65 m. Uslub — buyurtmachi yuborgan namunalar (Najot Ta'lim sahnasi va AI varianti), real o'lchamlarda.`)}
    <div class="matn"><h3>Sahna devori — o'lchamlar</h3>
      <p><b>Devor:</b> XZ1 xonasining koworkingga qaragan devori, ${m(S.devor.y2 - S.devor.y1)} × ${m(H)} m (K1 va K2 koridorlari orasida). Oldida GKL karkas 100 mm — U4 ustuni bilan tekislanadi.</p>
      <p><b>Markaz:</b> to'q grafit panel ${m(S.panel.y2 - S.panel.y1)} m. <b>Logotip</b> (design.pdp.uz, to'q fon uchun) ~${m(S.logo.en)} m, ichidan yoritilgan, poldan ~${m(S.logo.z - 250)}–${m(S.logo.z + 250)} m — ma'ruzachi boshidan yuqorida. <b>Ekran</b> 86" (${m(S.ekran.en)} × ${m(S.ekran.z2 - S.ekran.z1)} m), poldan ${m(S.ekran.z1)}–${m(S.ekran.z2)} m.</p>
      <p><b>Yonlar:</b> ${m(S.reyka[0].y2 - S.reyka[0].y1)} m dan yog'och reykali panellar (qora asos ustida), chetlarida tik yashil LED chiziqlar; devor tepasida yashil chiziq. Kolonkalar reyka panellariga osiladi (2.05–2.5 m).</p>
      <p><b>Yoritish:</b> shiftdan ${m(S.devor.x1 - S.trek.x)} m narida qora trek shina (${m(S.trek.y2 - S.trek.y1)} m), ${S.trek.spot} ta spot — navbat bilan logotip va ekranga.</p>
      <p><b>Pol va xavfsizlik:</b> sahna maydoni (${m(S.pol.x2 - S.pol.x1)} × ${m(S.pol.y2 - S.pol.y1)} m) — pol bilan bir sathda yog'och ko'rinishli vinil, podiumsiz: koworkingning o'ng tomonidagi o'tish yo'lagi (K1, K2, kirish zali, 3-qavat zinasi) bo'sh qoladi. Namunadagi shtativli kolonkalar shu sababli devorga osildi.</p>
      <p><b>Narxi (taxminiy):</b> ~${usd(xs.jami)} — ${xs.qatorlar.map(q => `${q.nom} ${usd(q.usd)}`).join(', ')}. Ekran mavjud deb olingan (yangi 86" — ~$1,300).</p></div>
  </div><div>
    ${fig(await rasm('Xadra_2-qavat_3D_10-koworking-sahna.jpg'), "<b>Kundalik rejim</b> — dam olish burchagidan sahnaga.")}
    <figure style="border:.3mm solid #ddd;border-radius:1.2mm;overflow:hidden">${kwKorinish('tadbir')}</figure>
    <figcaption><b>Tadbirlar rejimi:</b> ${KW_TADBIR.stullar.length} o'rin (4 qator × 17, ikki yo'lak), stullar sahnaga qaragan (rejada sahna yuqorida); sahna oldi va o'tish yo'lagi bo'sh.</figcaption>
  </div></div></section>`;
  return a + b2 + b3;
}

// ---------- xarajatlar xulosasi ----------
function xulosaVaraq(x) {
  const qator = (t, cls = '') => `<tr class="${cls}"><td>${t.nom}</td><td class="r">${usd(t.usd)}</td><td class="r">${som(t.som)}</td>${t.ulush != null ? `<td class="r">${(t.ulush * 100).toFixed(1)}%</td>` : '<td></td>'}</tr>`;
  const xb = {};
  x.xonalar.forEach(r => (xb[r.bolim] ||= []).push(r));
  return `<section class="varaq">${bosh('Xarajatlar — yakuniy (1, 2 va 3-qavat)', `To'liq hisob: hisob/${x.fayl}`)}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:3mm">
    <div>
      <table><tr><th>Xarajat turi</th><th class="r">$</th><th class="r">so'm</th><th class="r">ulush</th></tr>
        ${x.turlar.map(t => qator(t, /taxmin|Mebel|E'lon/i.test(t.nom) ? 'taxmin' : '')).join('')}
        ${qator({ nom: 'JAMI', ...x.JAMI }, 'jami')}
        ${qator({ nom: x.zaxira.nom, ...x.zaxira })}
        ${qator({ nom: 'UMUMIY JAMI', ...x['UMUMIY JAMI'] }, 'katta')}
        ${qator({ nom: "shundan taxminiy narxlar (mebel, interyer, doskalar, 1-qavat logotiplari)", ...x.taxmin }, 'taxmin')}
      </table>
      <table style="margin-top:4mm"><tr><th>Qavat / bo'lim</th><th class="r">$</th><th class="r">so'm</th><th class="r">ulush</th></tr>
        ${x.bolimlar.map(t => qator(t)).join('')}</table>
    </div>
    <div>
      <table><tr><th>Xona</th><th class="r">$</th></tr>
        ${Object.entries(xb).map(([bolim, rr]) => `<tr class="jami"><td colspan="2">${bolim}</td></tr>${rr.map(r => `<tr><td>${r.nom}</td><td class="r">${usd(r.usd)}</td></tr>`).join('')}`).join('')}
      </table>
      <div class="matn" style="margin-top:3mm">
        <p>Dollar kursi: ${x.kurs.toLocaleString('en-US')} so'm/$. Kutilmagan xarajatlar — umumiy summadan 10%.</p>
        <p><b>Taxminiy narxlar</b> (sariq): sotuv va admin xonalari mebeli va interyeri, koridor doskalari, 1-qavat resepshni, mehmonlar mebeli va logotiplari — buyurtmachi «narxi noma'lum» degan qismlar; mebelchi va reklama ustasi narxi bilan almashtiriladi (Excel, «Narxlar» varag'i).</p>
        <p>Tekshirib qo'ying: sovuq suv quvuri «12 0000» — 12 000 so'm/m deb olindi; 2-qavat konditsioneri $7000 — 2 ta uchun jami, o'rnatish bilan. Turniketlar (2 ta) — mavjud; to'siq va evakuatsiya darvozasi kirmagan.</p>
      </div>
    </div>
  </div></section>`;
}

// ---------- muqova ----------
function muqova(x, mundarija, rasmSrc) {
  const orin = tekshiruv().orinlar + sinf3Korsatkich().orin;
  return `<section class="varaq" style="padding:0;display:grid;grid-template-columns:1fr 150mm">
    <div style="position:relative;background:#111">${rasmSrc ? `<img src="${rasmSrc}" style="width:100%;height:297mm;object-fit:cover;display:block;opacity:.96">` : ''}
      <div style="position:absolute;left:12mm;bottom:12mm;color:#fff;font-size:9pt;text-shadow:0 0 2mm #000">2-qavat, K2 koridori oxiri — yorituvchi logotip (Blender)</div></div>
    <div style="padding:16mm 12mm 12mm;display:flex;flex-direction:column">
      <div style="font-size:9pt;color:#6b6b6b;font-weight:700">${LOYIHA.brend}</div>
      <div style="font-size:26pt;font-weight:700;line-height:1.1;margin-top:2mm">${LOYIHA.filial}</div>
      <div style="font-size:13pt;color:#333;margin-top:2mm">Loyiha albomi: 1, 2 va 3-qavat</div>
      <div style="height:1.2mm;width:40mm;background:#00B533;margin:6mm 0"></div>
      <table style="font-size:8.6pt"><tr><td>1-qavat</td><td>kirish zali: resepshn, 2 turniket, logotiplar</td></tr>
        <tr><td>2-qavat</td><td>7 sinf (${tekshiruv().orinlar} o'rin), sotuv, admin, ustozlar, call-markaz, koworking va sahna, CEO</td></tr>
        <tr><td>3-qavat</td><td>o'quv xonasi (24 o'rin), erkaklar hojatxonasi</td></tr>
        <tr><td><b>Jami o'rin</b></td><td><b>${orin}</b></td></tr>
        <tr><td><b>Xarajat</b></td><td><b>${usd(x['UMUMIY JAMI'].usd)}</b> (10% kutilmagan bilan) · ${som(x['UMUMIY JAMI'].som)}</td></tr></table>
      <h3 style="font-size:10pt;margin:8mm 0 2mm">Mundarija</h3>
      <table style="font-size:8.4pt">${mundarija.map(([n, s]) => `<tr><td>${n}</td><td class="r">${s}</td></tr>`).join('')}</table>
      <div style="margin-top:auto;font-size:7.4pt;color:#777">${V} · ${LOYIHA.sana} · ${LOYIHA.manzil}. O'lchamlar buyurtmachi chizmalari, fotosurat va videolaridan — joyida o'lchanadi. Xarajatlar batafsil: hisob/Xadra_xarajatlar_${V}.xlsx</div>
    </div></section>`;
}

// ---------- yig'ish ----------
const pdfQil = async (brauzer, html, fayl) => {
  const p = await brauzer.newPage();
  await p.setContent(`<!doctype html><html lang="uz"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${html}</body></html>`, { waitUntil: 'load' });
  await p.pdf({ path: fayl, width: '420mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
  await p.close();
  return fayl;
};

execFileSync(process.execPath, [join(BU, 'qavat3-3d.mjs')], { stdio: 'inherit' });
const x = JSON.parse(execFileSync('python3', [join(BU, 'xarajat-xulosa.py')], { encoding: 'utf8' }));
const brauzer = await chromium.launch();
const f1 = await pdfQil(brauzer, await q1Varaq(), join(CH, `Xadra_1-qavat_3D_${V}.pdf`));
const f2 = await pdfQil(brauzer, await q2Varaqlar(x), join(CH, `Xadra_2-qavat_3D_${V}.pdf`));
const fx = await pdfQil(brauzer, xulosaVaraq(x), join(CH, `Xadra_xarajatlar_xulosa_${V}.pdf`));

const BOLIMLAR = [
  ['1-qavat — reja (resepshn, turniketlar, logotiplar)', `Xadra_1-qavat_reja_${V}.pdf`],
  ["1-qavat — 3D ko'rinishlar", f1],
  ['2-qavat — taqdimot rejasi', `Xadra_2-qavat_taqdimot_reja_${V}.pdf`],
  ["2-qavat — chizmalar: mavjud holat, jihozlash, havo almashinuvi", `PDP_Academy_-_Chizma_-_Xadra_filiali_2-qavat_${V}.pdf`],
  ["2-qavat — 3D ko'rinishlar", f2],
  ['2-qavat — xonalar izohi (A4)', `Xadra_2-qavat_xonalar_izoh_${V}.pdf`],
  ['3-qavat — reja', `Xadra_3-qavat_reja_${V}.pdf`],
  ["3-qavat — 3D ko'rinishlar", `Xadra_3-qavat_3D_${V}.pdf`],
  ['Xarajatlar — yakuniy', fx],
].map(([n, f]) => [n, f.startsWith('/') ? f : join(CH, f)]);

const hujjatlar = await Promise.all(BOLIMLAR.map(async ([n, f]) => [n, await PDFDocument.load(await readFile(f))]));
const mundarija = []; let bet = 2;
for (const [n, d] of hujjatlar) { const k = d.getPageCount(); mundarija.push([n, k > 1 ? `${bet}–${bet + k - 1}` : `${bet}`]); bet += k; }
const fm = await pdfQil(brauzer, muqova(x, mundarija, await rasm('Xadra_2-qavat_3D_4-koridor-logotip.jpg')), join(BU, '..', '.muqova.pdf'));
await brauzer.close();

const albom = await PDFDocument.create();
albom.setTitle(`${LOYIHA.brend} · ${LOYIHA.filial} — loyiha albomi ${V}`);
albom.setAuthor(LOYIHA.brend); albom.setSubject("1, 2 va 3-qavat: rejalar, 3D ko'rinishlar, izoh, xarajatlar");
for (const d of [await PDFDocument.load(await readFile(fm)), ...hujjatlar.map(h => h[1])]) {
  (await albom.copyPages(d, d.getPageIndices())).forEach(p => albom.addPage(p));
}
const chiq = join(CH, `Xadra_filiali_loyiha_albomi_${V}.pdf`);
await writeFile(chiq, await albom.save());
(await import('node:fs/promises')).unlink(fm);
console.log('Albom:', chiq, albom.getPageCount(), 'bet');
