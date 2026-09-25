// Taqdimot varag'i (A3 portret): rangli reja + sinf yaqindan + havo aylanishi + maydonlar jadvali.
import { LOYIHA, XONALAR, H } from './model.mjs';
import { renderSvg, sinfYaqindan, XONA_NOMI } from './render-svg.mjs';
import { korsatkichlar, admHavo, xonaMaydoni, HAVO } from './tekshiruv.mjs';
import { kesimSvg } from './izoh.mjs';

const CSS = `
@page { size: 297mm 420mm; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
body { font-family: 'Liberation Sans', Arial, sans-serif; color: #222; }
.varaq { width: 297mm; height: 420mm; padding: 8mm 9mm; background: #fff; position: relative; overflow: hidden; }
header { display: flex; justify-content: space-between; align-items: flex-end; height: 14mm; }
header .brend { font-size: 8.5pt; color: #6b6b6b; font-weight: 700; }
header h1 { font-size: 17pt; color: #1f1f1f; }
header .ong { text-align: right; font-size: 7.5pt; color: #555; display: flex; flex-direction: column; align-items: flex-end; gap: 1.2mm; }
.bar { display: flex; width: 50mm; height: 1.6mm; border: .2mm solid #222; }
.bar i { flex: 1 } .bar i:nth-child(odd) { background: #222 }
.son { display: flex; justify-content: space-between; width: 52mm; font-size: 6pt; }
.reja { margin-top: 1mm; }
.past { display: grid; grid-template-columns: 76mm 106mm 1fr; gap: 4mm; margin-top: 1.5mm; height: 101mm; }
.past h2 { font-size: 10.5pt; margin-bottom: 1.5mm; color: #1f1f1f; }
.quti { border: .3mm solid #cfcac2; border-radius: 2mm; padding: 2.5mm; background: #fbfaf8; overflow: hidden; }
.quti p, .quti li { font-size: 7.4pt; color: #444; line-height: 1.4; }
.quti li { margin-bottom: .8mm; }
.quti ul { padding-left: 3.5mm; margin-top: 1.5mm; }
.jadval { background: #f1f0ed; border: 0; }
.jadval table { width: 100%; border-collapse: collapse; font-size: 7.6pt; }
.jadval td { padding: .75mm .5mm; }
.jadval td.r { text-align: right; white-space: nowrap; }
.jadval .sar td { font-weight: 700; padding-top: 2mm; color: #333; }
.jadval .jami td { border-top: .3mm solid #999; font-weight: 700; }
.katta { font-size: 13pt; font-weight: 700; color: #1f1f1f; margin-top: 2mm; }
`;

export function taqdimotHtml() {
  const kor = korsatkichlar();
  const x = kod => xonaMaydoni(XONALAR.find(r => r.kod === kod));
  const adm = admHavo();
  const sinfQ = kor.map(k => `<tr><td>${XONA_NOMI[k.kod]}</td><td class="r">${k.A.toFixed(1)} m²</td><td class="r">${k.orin} o'rin</td></tr>`).join('');
  const jamiA = kor.reduce((s, k) => s + k.A, 0), jamiO = kor.reduce((s, k) => s + k.orin, 0);
  const zinaWc = x('ZN1') + x('ZN2') + ['2', '3', '4', '5', '6'].reduce((s, k) => s + x(k), 0);
  const reja = renderSvg({ vb: { x1: -1300, y1: -2000, x2: 25900, y2: 25700 }, olchamMm: true });
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — ${LOYIHA.qavat} rejasi</title><style>${CSS}</style></head><body>
  <section class="varaq">
    <header>
      <div><div class="brend">${LOYIHA.brend} · ${LOYIHA.filial}</div><h1>${LOYIHA.qavat} rejasi — 7 sinf, ${jamiO} o'rin</h1></div>
      <div class="ong"><div>Masshtab 1:100 (A3) · ${LOYIHA.versiya} · ${LOYIHA.sana}</div><div class="bar"><i></i><i></i><i></i><i></i><i></i></div><div class="son"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5 m</span></div></div>
    </header>
    <div class="reja">${reja}</div>
    <div class="past">
      <div class="quti"><h2>Sinf joylashuvi — 24 o'rin</h2>
        <div style="height:74mm;display:flex;justify-content:center">${sinfYaqindan('SR5').replace('width="100%"', 'height="100%"')}</div>
        <p style="margin-top:1mm">5-xona misolida. Parta 690 × 500, qatorda 6 parta (2 + 2 + 2), yo'lak 600, qator qadami 1300, doskadan 1-partagacha 2440 — Beruniy standarti. 7-xonada qatorda 5 parta (2 + 3).</p></div>
      <div class="quti"><h2>Havo aylanishi — har bir sinf</h2>
        <div style="margin:1mm 0 1.5mm">${kesimSvg(1.75)}</div>
        <ul>
          <li>Har sinfga alohida <b>rekuperatorli PV qurilma</b> (~750 m³/soat, shovqin ≤ 35 dB(A)) — deraza devori yonida, shift ichida.</li>
          <li>Hisob: <b>${HAVO.kishiga} m³/soat har bir kishiga</b> — xonada CO₂ 1000 ppm dan oshmaydi. Jami ${kor.reduce((s, k) => s + k.havo.Q, 0) + adm.Q} m³/soat.</li>
          <li>Toza havo doska tomonga beriladi, orqa tomondan so'riladi — oqim o'quvchilar ustidan o'tadi. CO₂ datchigi boshqaradi.</li>
          <li>Har sinfga 2 ta konditsioner (~8 kVt). Derazalar ochiladigan — tanaffusda shamollatish uchun.</li>
          <li>7-xona va Admin: derazalar uzun devorda — tabiiy shamollatish ham yaxshi ishlaydi.</li>
        </ul></div>
      <div class="quti jadval"><h2>Xonalar maydonlari</h2>
        <table>${sinfQ}
          <tr class="jami"><td>O'quv xonalari</td><td class="r">${jamiA.toFixed(1)} m²</td><td class="r">${jamiO} o'rin</td></tr>
          <tr class="sar"><td colspan="3">Boshqa xonalar</td></tr>
          <tr><td>Admin / sotuv</td><td class="r">${x('ADM').toFixed(1)} m²</td><td class="r">4 o'rin</td></tr>
          <tr><td>Koridorlar va kirish zali</td><td class="r" colspan="2">${(x('K1') + x('K2') + x('ZL')).toFixed(1)} m²</td></tr>
          <tr><td>Zinapoyalar va WC bloki</td><td class="r" colspan="2">${zinaWc.toFixed(1)} m²</td></tr>
        </table>
        <p style="margin-top:2.5mm">Umumiy foydali maydon (hujjat):</p>
        <div class="katta">${LOYIHA.foydali} m²</div>
        <p style="margin-top:1.5mm;font-size:6.3pt;color:#777">O'lchamlar mavjud holat chizmasidan. Derazalar joyi va toza balandlik (${H / 1000} m) joyida aniqlanadi.</p></div>
    </div>
  </section></body></html>`;
}
