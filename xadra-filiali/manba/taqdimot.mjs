// Taqdimot varag'i (A3 portret) — buyurtmachi namunasidagi tartibda:
// rangli reja + koworking zalining ikki rejimi + havo aylanishi + xonalar maydonlari.
import { LOYIHA, XONALAR, H } from './model.mjs';
import { renderSvg, kwKorinish, XONA_NOMI } from './render-svg.mjs';
import { korsatkichlar, admHavo, xonaMaydoni, xizmatHavo, kwHavo, HAVO } from './tekshiruv.mjs';
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
.past { display: grid; grid-template-columns: 184mm 1fr; gap: 4mm; margin-top: 1mm; height: 103mm; }
.chap { display: grid; grid-template-rows: auto 1fr; gap: 2.5mm; }
.rejimlar { display: grid; grid-template-columns: 1fr 9mm 1fr; align-items: center; }
.rejimlar h2, .havo h2, .jadval h2 { font-size: 10.5pt; margin-bottom: 1.2mm; color: #1f1f1f; }
.rejimlar .rasm { border: .3mm solid #cfcac2; }
.rejimlar .rasm svg { display: block; }
.strelka { font-size: 20pt; text-align: center; color: #333; padding-top: 6mm; }
.rejimlar p { font-size: 6.8pt; color: #555; margin-top: .8mm; }
.havo { border: .3mm solid #cfcac2; border-radius: 2mm; padding: 2.2mm 2.8mm; background: #fbfaf8; display: grid; grid-template-columns: 92mm 1fr; gap: 3mm; align-items: start; }
.havo h2 { grid-column: 1 / -1; margin-bottom: 0; }
.havo ul { padding-left: 3.5mm; }
.havo li { font-size: 6.9pt; color: #444; line-height: 1.32; margin-bottom: .5mm; }
.jadval { background: #f1f0ed; border-radius: 2mm; padding: 3mm 3.2mm; }
.jadval table { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
.jadval td { padding: .6mm .4mm; }
.jadval td.r { text-align: right; white-space: nowrap; }
.jadval .sar td { font-weight: 700; padding-top: 1.8mm; color: #333; }
.jadval .jami td { border-top: .3mm solid #999; font-weight: 700; }
.jadval p { font-size: 7.4pt; color: #444; }
.katta { font-size: 13pt; font-weight: 700; color: #1f1f1f; margin-top: 1mm; }
`;

export function taqdimotHtml() {
  const kor = korsatkichlar();
  const x = kod => xonaMaydoni(XONALAR.find(r => r.kod === kod));
  const kw = kwHavo();
  const sinfQ = kor.map(k => `<tr><td>${XONA_NOMI[k.kod]}</td><td class="r">${k.A.toFixed(1)} m²</td><td class="r">${k.orin} o'rin</td></tr>`).join('');
  const xizmatQ = xizmatHavo().map(z => `<tr><td>Xizmat xonasi ${z.kod.slice(2)}</td><td class="r">${z.A.toFixed(1)} m²</td><td></td></tr>`).join('');
  const jamiA = kor.reduce((s, k) => s + k.A, 0), jamiO = kor.reduce((s, k) => s + k.orin, 0);
  const zinaWc = x('ZN1') + x('ZN2') + ['2', '3', '4', '5', '6'].reduce((s, k) => s + x(k), 0);
  const reja = renderSvg({ vb: { x1: -1300, y1: -2000, x2: 25900, y2: 25700 }, olchamMm: true });
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — ${LOYIHA.qavat} rejasi</title><style>${CSS}</style></head><body>
  <section class="varaq">
    <header>
      <div><div class="brend">${LOYIHA.brend} · ${LOYIHA.filial}</div><h1>${LOYIHA.qavat} rejasi — 7 xona, ${jamiO} o'rin</h1></div>
      <div class="ong"><div>Masshtab 1:100 (A3) · ${LOYIHA.versiya} · ${LOYIHA.sana}</div><div class="bar"><i></i><i></i><i></i><i></i><i></i></div><div class="son"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5 m</span></div></div>
    </header>
    <div class="reja">${reja}</div>
    <div class="past">
      <div class="chap">
        <div class="rejimlar">
          <div><h2>Koworking rejimi (kundalik)</h2><div class="rasm">${kwKorinish('kundalik')}</div><p>~35 o'rin: stollar, dumaloq stollar, dam olish burchagi</p></div>
          <div class="strelka">⇄</div>
          <div><h2>Tadbirlar rejimi (zarur paytda)</h2><div class="rasm">${kwKorinish('tadbir')}</div><p>${11 * 6} o'rin, ekran chap devorda (zinapoya tomoni)</p></div>
        </div>
        <div class="havo"><h2>Havo aylanishi</h2>
          <div>${kesimSvg(1.75)}</div>
          <ul>
            <li>Har bir sinfga <b>rekuperatorli PV qurilma</b> (~750 m³/soat) — ${HAVO.kishiga} m³/soat har bir kishiga, CO₂ ≤ 1000 ppm.</li>
            <li><b>4-xona va xizmat xonalarida deraza yo'q</b> — mexanik ventilyatsiya va konditsioner shart.</li>
            <li>Koworking: kundalik ~${kw.kundalik.Q} m³/soat, tadbirda ~${kw.tadbir.Q} m³/soat.</li>
            <li>Toza havo doska tomonga beriladi, orqadan so'riladi. Har sinfga 2 ta konditsioner, CO₂ datchigi.</li>
          </ul></div>
      </div>
      <div class="jadval"><h2>Xonalar maydonlari</h2>
        <table>${sinfQ}
          <tr class="jami"><td>O'quv xonalari</td><td class="r">${jamiA.toFixed(1)} m²</td><td class="r">${jamiO} o'rin</td></tr>
          <tr class="sar"><td colspan="3">Xizmat xonalari</td></tr>${xizmatQ}
          <tr class="sar"><td colspan="3">Boshqa</td></tr>
          <tr><td>Koworking / Tadbirlar zali</td><td class="r">${x('KW').toFixed(1)} m²</td><td></td></tr>
          <tr><td>Admin / sotuv</td><td class="r">${x('ADM').toFixed(1)} m²</td><td class="r">4 o'rin</td></tr>
          <tr><td>Koridorlar, kirish zali</td><td class="r">${(x('K1') + x('K2') + x('ZL')).toFixed(1)} m²</td><td></td></tr>
          <tr><td>Zinapoyalar, WC, xo'jalik</td><td class="r">${zinaWc.toFixed(1)} m²</td><td></td></tr>
        </table>
        <p style="margin-top:2mm">Umumiy foydali maydon (hujjat):</p>
        <div class="katta">${LOYIHA.foydali} m²</div>
        <p style="margin-top:1mm;font-size:6.2pt;color:#777">O'lchamlar mavjud holat chizmasidan. Derazalar joyi va toza balandlik (${H / 1000} m) joyida aniqlanadi.</p></div>
    </div>
  </section></body></html>`;
}
