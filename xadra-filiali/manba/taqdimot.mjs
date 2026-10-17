// Taqdimot varag'i (A3 portret) — buyurtmachi namunasidagi tartibda:
// rangli reja + koworking zalining ikki rejimi + havo aylanishi + xonalar maydonlari.
import { LOYIHA, XONALAR, H, KW_TADBIR } from './model.mjs';
import { tizimHisob, REK } from './hvac-tizim.mjs';
import { ventHisob } from './vent-chizma.mjs';
const TZ = tizimHisob();
import { renderSvg, kwKorinish, XONA_NOMI } from './render-svg.mjs';
import { korsatkichlar, xonaMaydoni, xizmatHavo, kwHavo, HAVO } from './tekshiruv.mjs';
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

const VH = ventHisob();
export function taqdimotHtml() {
  const kor = korsatkichlar();
  const x = kod => xonaMaydoni(XONALAR.find(r => r.kod === kod));
  const kw = kwHavo();
  const sinfQ = kor.map(k => `<tr><td>${XONA_NOMI[k.kod]}</td><td class="r">${k.A.toFixed(1)} m²</td><td class="r">${k.orin} o'rin</td></tr>`).join('');
  const orinX = { XZ1: 2, XZ2: 2, XZ3: 9, XZ4: 6 };
  const xizmatQ = xizmatHavo().map(z => `<tr><td>${z.nomi}</td><td class="r">${z.A.toFixed(1)} m²</td><td class="r">${orinX[z.kod]} o'rin</td></tr>`).join('');
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
          <div><h2>Tadbirlar rejimi (zarur paytda)</h2><div class="rasm">${kwKorinish('tadbir')}</div><p>${KW_TADBIR.stullar.length} o'rin, stullar sahnaga qaragan (XZ1/XZ2 devori: logotip, ekran)</p></div>
        </div>
        <div class="havo"><h2>Havo aylanishi</h2>
          <div>${kesimSvg(1.75)}</div>
          <ul>
            <li><b>2 ta kanalli konditsioner</b> (KK1, KK2) koridorlar oxiridagi <b>kladovka shifti ustida</b> — kladovka shovqinni to'sadi. Havo koridor bo'ylab magistral bilan: sinfga 2 ta, xizmat xonasiga 1 ta diffuzor. KK1 — ${VH.guruh.K1.xonalar.join(', ')}; KK2 — ${VH.guruh.K2.xonalar.join(', ')} (SR4 — ikkala blokdan bittadan diffuzor).</li>
            <li><b>Tashqi havo 30%</b> — 3-xonaning ko'cha tomonidan vertikal kanal bilan bloklarga (har biriga ${Math.round(VH.guruh.K1.oa)} m³/soat). To'la sinfda CO₂ ~${Math.round(Math.min(...Object.values(VH.xona).map(x => x.co2)) / 50) * 50}–${Math.round(Math.max(...Object.values(VH.xona).map(x => x.co2)) / 50) * 50} ppm.</li>
            <li><b>Vitechka</b> — alohida so'rish tarmog'i: fasadlar bo'ylab (deraza tomonda) va XZ xonalarida; VV1 ${VH.venQ} m³/soat.</li>
            <li>Koworking: mavjud konditsionerlar (${TZ.qoshimcha[0].mavjud.map(b => b / 1000 + 'k').join(' + ')}). Doska yon devorda, deraza o'quvchilarning chap tomonida (3-xonada — doska kirish tomonida) — yorug'lik doska va proyektorga tushmaydi.</li>
          </ul></div>
      </div>
      <div class="jadval"><h2>Xonalar maydonlari</h2>
        <table>${sinfQ}
          <tr class="jami"><td>O'quv xonalari</td><td class="r">${jamiA.toFixed(1)} m²</td><td class="r">${jamiO} o'rin</td></tr>
          <tr class="sar"><td colspan="3">Ofis xonalari</td></tr>${xizmatQ}
          <tr class="sar"><td colspan="3">Boshqa</td></tr>
          <tr><td>Koworking / Tadbirlar zali</td><td class="r">${x('KW').toFixed(1)} m²</td><td></td></tr>
          <tr><td>CEO xonasi (12-xona)</td><td class="r">${x('X12').toFixed(1)} m²</td><td></td></tr>
          <tr><td>Koridorlar, kirish zali</td><td class="r">${(x('K1') + x('K2') + x('ZL')).toFixed(1)} m²</td><td></td></tr>
          <tr><td>Kladovkalar (ustida konditsioner)</td><td class="r">${(x('KL1') + x('KL2')).toFixed(1)} m²</td><td></td></tr>
          <tr><td>Zinapoyalar, ayollar WC, o'tish yo'lagi</td><td class="r">${zinaWc.toFixed(1)} m²</td><td></td></tr>
        </table>
        <p style="margin-top:2mm">Umumiy foydali maydon (hujjat):</p>
        <div class="katta">${LOYIHA.foydali} m²</div>
        <p style="margin-top:1mm;font-size:6.2pt;color:#777">O'lchamlar mavjud holat chizmasidan. Derazalar joyi joyida aniqlanadi; balandlik ${H / 1000} m.</p></div>
    </div>
  </section></body></html>`;
}

// Mebelsiz reja (buyurtmachi, 17.10): xonalar stol-stullarsiz — devorlar, eshiklar, doskalar, xona nomi, ichki o'lchami va maydoni
const CSS_BOSH = `
.bpast { display: grid; grid-template-columns: 1fr 96mm; gap: 4mm; margin-top: 2mm; }
.bpast table { width: 100%; border-collapse: collapse; font-size: 7.6pt; }
.bpast th { text-align: left; font-size: 7pt; color: #666; font-weight: 700; border-bottom: .3mm solid #999; padding: .6mm .4mm; }
.bpast td { padding: .55mm .4mm; border-bottom: .15mm solid #e3e0da; } .bpast td.r, .bpast th.r { text-align: right; white-space: nowrap; }
.bjad { display: grid; grid-template-columns: 1fr 1fr; gap: 0 5mm; background: #f1f0ed; border-radius: 2mm; padding: 3mm 3.2mm; }
.bjad h2 { grid-column: 1 / -1; font-size: 10.5pt; margin-bottom: 1.2mm; color: #1f1f1f; }
.bizoh { border: .3mm solid #cfcac2; border-radius: 2mm; padding: 2.5mm 3mm; background: #fbfaf8; font-size: 7.1pt; color: #444; line-height: 1.4; }
.bizoh h2 { font-size: 10.5pt; margin-bottom: 1.2mm; color: #1f1f1f; } .bizoh ul { padding-left: 3.5mm; } .bizoh li { margin-bottom: .7mm; }
`;
export function boshRejaHtml() {
  const kor = korsatkichlar();
  const reja = renderSvg({ vb: { x1: -1300, y1: -2000, x2: 25900, y2: 25700 }, olchamMm: true, jihoz: false });
  const o = x => `${((x.x2 - x.x1) / 1000).toFixed(2)} × ${((x.y2 - x.y1) / 1000).toFixed(2)}`;
  const NOMI = { XZ1: 'Offline sotuv', XZ2: 'Admin', XZ3: 'Ustozlar xonasi', XZ4: 'Call-markaz', KW: 'Koworking / Tadbirlar zali', X12: 'CEO xonasi',
    K1: 'K1 koridori', K2: 'K2 koridori', KL1: 'Kladovka (K1 oxiri)', KL2: 'Kladovka (K2 oxiri)', ZL: 'Kirish zali', ...XONA_NOMI };
  const qator = kod => { const x = XONALAR.find(r => r.kod === kod); return `<tr><td>${NOMI[kod]}</td><td class="r">${o(x)} m</td><td class="r">${xonaMaydoni(x).toFixed(1)} m²</td></tr>`; };
  const bosh = '<tr><th>Xona</th><th class="r">Eni × chuqurligi</th><th class="r">Maydon</th></tr>';
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — ${LOYIHA.qavat} rejasi (mebelsiz)</title><style>${CSS}${CSS_BOSH}</style></head><body>
  <section class="varaq">
    <header>
      <div><div class="brend">${LOYIHA.brend} · ${LOYIHA.filial}</div><h1>${LOYIHA.qavat} rejasi — xonalar (mebelsiz)</h1></div>
      <div class="ong"><div>Masshtab 1:100 (A3) · ${LOYIHA.versiya} · 17.10.2026</div><div class="bar"><i></i><i></i><i></i><i></i><i></i></div><div class="son"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5 m</span></div></div>
    </header>
    <div class="reja">${reja}</div>
    <div class="bpast">
      <div class="bjad"><h2>Xonalar: ichki o'lchamlari va maydoni</h2>
        <table>${bosh}${['SR1', 'SR2', 'SR3', 'SR4', 'SR5', 'SR6', 'SR7', 'XZ1', 'XZ2', 'XZ3', 'XZ4'].map(qator).join('')}
          <tr><td><b>O'quv xonalari, jami</b></td><td></td><td class="r"><b>${kor.reduce((t, k) => t + k.A, 0).toFixed(1)} m²</b></td></tr></table>
        <table>${bosh}${['KW', 'X12', 'K1', 'K2', 'KL1', 'KL2', 'ZL'].map(qator).join('')}
          <tr><td>Zinapoyalar, ayollar WC, o'tish yo'lagi</td><td></td><td class="r">${(['ZN1', 'ZN2', '2', '3', '4', '5', '6'].reduce((t, k) => t + xonaMaydoni(XONALAR.find(r => r.kod === k)), 0)).toFixed(1)} m²</td></tr>
          <tr><td><b>Umumiy foydali maydon (hujjat)</b></td><td></td><td class="r"><b>${LOYIHA.foydali} m²</b></td></tr></table></div>
      <div class="bizoh"><h2>Izoh</h2><ul>
        <li>O'lchamlar — xonaning ichki (devor yuzidan devor yuzigacha) o'lchami, metr; maydon — ustunlarsiz. Mavjud holat chizmasidan olingan, ish boshlanishidan oldin joyida o'lchanadi.</li>
        <li>Balandlik (poldan shiftgacha) — ${H / 1000} m.</li>
        <li>Koridor tomonidagi devorlar — shisha (2.5 m gacha, ustida GKL), 1.0–1.6 m da mat plyonka.</li>
        <li>Eshiklar — 11 ta, 1 m, yonga suriladigan (barg xona ichida); kladovka eshiklari — 800 mm.</li>
        <li>Doskalar (oq chiziq) — yon devorda; 4-xonada eshik tomonida, devor U6 ustuni bilan tekis GKL qoplanadi (100 mm).</li>
        <li>Kladovka ustida — kanalli konditsioner (KK1, KK2); tashqi havo 30% — 3-xonaning ko'cha tomonidan.</li>
        <li>Jihozlangan variant — Xadra_2-qavat_taqdimot_reja_${LOYIHA.versiya}.</li></ul></div>
    </div>
  </section></body></html>`;
}
