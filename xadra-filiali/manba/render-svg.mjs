// Taqdimot uslubidagi reja (SVG): parket, plitka, mebel, o'simliklar, soyalar.
// Geometriya model.mjs dan olinadi — o'lchamlar chizma bilan bir xil.
import {
  ICHKI, DEVOR, USTUNLAR, DERAZALAR, DEVORLAR, ESHIKLAR, ZINALAR, XONALAR, ADM_JIHOZ, XIZMAT_JIHOZ,
  KW_KUNDALIK, KW_TADBIR, sinflar, bolaklar,
} from './model.mjs';
import { eshikSektori, korsatkichlar, xonaMaydoni } from './tekshiruv.mjs';

let N = 0;
const f = v => Math.round(v * 10) / 10;
export const XONA_NOMI = { SR1: '1-xona', SR2: '2-xona', SR3: '3-xona', SR4: '4-xona', SR5: '5-xona', SR6: '6-xona', SR7: '7-xona' };

function defs(id) {
  const parket = [];
  const ranglar = ['#e6cda5', '#dfc49a', '#e9d3ae', '#dbbd90', '#e3c89f'];
  [0, 450, 900, 225, 675, 1125].forEach((o, i) => {
    for (let k = -1; k < 2; k++) parket.push(`<rect x="${o + k * 1350}" y="${i * 160}" width="1350" height="160" fill="${ranglar[(i * 2 + k + 3) % ranglar.length]}" stroke="#cbb088" stroke-width="5"/>`);
  });
  const barg = [0, 45, 90, 135, 180, 225, 270, 315].map((a, i) =>
    `<ellipse cx="0" cy="-165" rx="72" ry="150" fill="${i % 2 ? '#5f9f47' : '#4a8a39'}" transform="rotate(${a + 20})"/>`).join('');
  const barg2 = [0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="0" cy="-95" rx="50" ry="100" fill="#79b85a" transform="rotate(${a})"/>`).join('');
  return `<defs>
    <pattern id="${id}parket" width="1350" height="960" patternUnits="userSpaceOnUse">${parket.join('')}</pattern>
    <pattern id="${id}plitka" width="600" height="600" patternUnits="userSpaceOnUse"><rect width="600" height="600" fill="#ebe8e2" stroke="#d6d1c8" stroke-width="7"/></pattern>
    <pattern id="${id}wc" width="300" height="300" patternUnits="userSpaceOnUse"><rect width="300" height="300" fill="#eef2f5" stroke="#d3dae1" stroke-width="5"/></pattern>
    <linearGradient id="${id}yog" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dcbc8c"/><stop offset="1" stop-color="#c69b67"/></linearGradient>
    <linearGradient id="${id}yogT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9a7550"/><stop offset="1" stop-color="#7d5b3c"/></linearGradient>
    <filter id="${id}soya" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="30" dy="45" stdDeviation="40" flood-color="#2a2016" flood-opacity=".30"/></filter>
    <filter id="${id}dsoya" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx="40" dy="60" stdDeviation="70" flood-color="#000" flood-opacity=".35"/></filter>
    <g id="${id}stul"><rect x="-190" y="-195" width="380" height="350" rx="75" fill="#475569"/><rect x="-205" y="130" width="410" height="95" rx="45" fill="#303b4b"/><ellipse cx="-45" cy="-60" rx="110" ry="75" fill="#fff" opacity=".10"/></g>
    <g id="${id}parta"><rect x="-345" y="-250" width="690" height="500" fill="url(#${id}yog)" stroke="#a88155" stroke-width="7"/>
      <rect x="-160" y="-35" width="320" height="215" rx="16" fill="#737b88"/><rect x="-145" y="-20" width="290" height="115" rx="8" fill="#949cab"/><rect x="-160" y="-72" width="320" height="36" rx="10" fill="#22262d"/></g>
    <g id="${id}ustozStol"><rect x="-600" y="-300" width="1200" height="600" fill="url(#${id}yogT)" stroke="#5f4630" stroke-width="8"/>
      <rect x="-280" y="-230" width="560" height="60" rx="14" fill="#1f2329"/><rect x="-220" y="-40" width="440" height="140" rx="12" fill="#3b414b"/><circle cx="330" cy="40" r="55" fill="#e9e4dc"/></g>
    <g id="${id}ofisStul"><circle r="230" fill="#353b45"/><path d="M-230,60 A235,235 0 0 0 230,60 L200,130 A220,220 0 0 1 -200,130 Z" fill="#1f242b"/><ellipse cx="-50" cy="-60" rx="110" ry="80" fill="#fff" opacity=".08"/></g>
    <g id="${id}kreslo"><rect x="-350" y="-350" width="700" height="700" rx="140" fill="#7d858f"/><rect x="-350" y="170" width="700" height="180" rx="80" fill="#626a74"/><rect x="-350" y="-350" width="150" height="700" rx="70" fill="#6d757f"/><rect x="200" y="-350" width="150" height="700" rx="70" fill="#6d757f"/><rect x="-190" y="-300" width="380" height="440" rx="60" fill="#8c949e"/></g>
    <g id="${id}osimlik"><circle r="200" fill="#7b5a3c"/>${barg}${barg2}<circle r="45" fill="#3a6e2c"/></g>
    <g id="${id}unitaz"><rect x="-190" y="-270" width="380" height="170" rx="30" fill="#fff" stroke="#9aa3ad" stroke-width="10"/><ellipse cx="0" cy="40" rx="175" ry="230" fill="#fff" stroke="#9aa3ad" stroke-width="10"/><ellipse cx="0" cy="55" rx="110" ry="150" fill="#eef2f5" stroke="#b9c1ca" stroke-width="6"/></g>
    <g id="${id}rakovina"><rect x="-260" y="-200" width="520" height="400" rx="60" fill="#fff" stroke="#9aa3ad" stroke-width="10"/><ellipse cx="0" cy="20" rx="170" ry="120" fill="#e8edf1" stroke="#b9c1ca" stroke-width="6"/><circle cx="0" cy="-130" r="25" fill="#9aa3ad"/></g>
  </defs>`;
}

// stul qaysi tomonda turganiga qarab burilishi (belgida suyanchiq +y da, o'tirgan odam -y ga qaraydi)
const BURISH = { n: 180, s: 0, w: 90, e: -90 };

// o'simliklar: o'qituvchi stoli oldidagi burchakda (sinflar zich — orqa zona tor)
function osimliklar() {
  const r = [];
  sinflar().forEach(x => {
    if (x.kod === 'SR4') { r.push([23550, 9750], [23500, 16200]); return; }
    r.push([x.x2 - 350, x.doska === 'past' ? x.y2 - 1950 : x.y1 + 1950]);
  });
  XONALAR.filter(x => x.tur === 'xizmat').forEach(x => r.push([x.x2 - 320, x.y1 + 420]));
  r.push([3900, 13950], [3700, 17650], [400, 23950]);
  return r;
}

export function renderSvg(o = {}) {
  const id = `t${++N}`;
  const vb = o.vb || { x1: -900, y1: -1700, x2: 26000, y2: 25300 };
  const kwRejim = o.kwRejim || 'kundalik';
  const k = o.k || 1;
  const q = [defs(id)];
  const rect = (r, a) => `<rect x="${f(r.x1)}" y="${f(r.y1)}" width="${f(r.x2 - r.x1)}" height="${f(r.y2 - r.y1)}" ${a}/>`;
  const use = (s, x, y, rot = 0) => `<use href="#${id}${s}" transform="translate(${f(x)},${f(y)})${rot ? ` rotate(${rot})` : ''}"/>`;
  const markaz = r => [(r.x1 + r.x2) / 2, (r.y1 + r.y2) / 2];
  const sinf = sinflar();

  // ---- pollar ----
  q.push(rect({ x1: 0, y1: 0, x2: ICHKI.x, y2: ICHKI.y }, `fill="url(#${id}plitka)"`));
  XONALAR.forEach(x => {
    if (['sinf', 'ofis', 'xizmat', 'koworking'].includes(x.tur)) bolaklar(x).forEach(b => q.push(rect(b, `fill="url(#${id}parket)"`)));
    if (x.tur === 'sanuzel') q.push(rect(x, `fill="url(#${id}wc)"`));
    if (x.tur === 'zina') q.push(rect(x, `fill="#d8d5cf"`));
  });

  // ---- zinalar ----
  ZINALAR.forEach(z => {
    z.marshlar.forEach(m => {
      q.push(rect(m, `fill="#e4e1db" stroke="#8f8b84" stroke-width="10"`));
      if (m.yo === 'y') for (let y = m.y1 + 280; y < m.y2; y += 280) q.push(`<line x1="${m.x1}" y1="${y}" x2="${m.x2}" y2="${y}" stroke="#9c978f" stroke-width="12"/>`);
      else for (let x = m.x1 + 270; x < m.x2; x += 270) q.push(`<line x1="${x}" y1="${m.y1}" x2="${x}" y2="${m.y2}" stroke="#9c978f" stroke-width="12"/>`);
    });
    const s = z.strelka;
    q.push(`<line x1="${s.x}" y1="${s.y1}" x2="${s.x}" y2="${s.y2 - 150}" stroke="#333" stroke-width="22"/><path d="M${s.x - 110},${s.y2 - 200} L${s.x},${s.y2} L${s.x + 110},${s.y2 - 200}" fill="none" stroke="#333" stroke-width="22"/>`);
  });

  // ---- jihozlar (soya bilan) ----
  const j = [];
  const shkaf = r => {
    j.push(rect(r, `fill="url(#${id}yog)" stroke="#9c7649" stroke-width="8"`));
    const gor = r.x2 - r.x1 > r.y2 - r.y1;
    for (let t = (gor ? r.x1 : r.y1) + 600; t < (gor ? r.x2 : r.y2); t += 600)
      j.push(gor ? `<line x1="${t}" y1="${r.y1}" x2="${t}" y2="${r.y2}" stroke="#9c7649" stroke-width="7"/>` : `<line x1="${r.x1}" y1="${t}" x2="${r.x2}" y2="${t}" stroke="#9c7649" stroke-width="7"/>`);
  };
  sinf.forEach(x => {
    const orqa = x.doska === 'past' ? 180 : 0;   // o'quvchi doskaga qaraydi
    x.j.partalar.forEach(p => j.push(use('parta', ...markaz(p), orqa)));
    x.j.stullar.forEach(p => j.push(use('stul', ...markaz(p), orqa)));
    j.push(use('ustozStol', ...markaz(x.j.ustozStoli), x.doska === 'past' ? 0 : 180));
    j.push(use('ofisStul', ...markaz(x.j.ustozStuli), x.doska === 'past' ? 0 : 180));
  });
  ADM_JIHOZ.stol.forEach(p => j.push(use('ustozStol', ...markaz(p), 0)));
  ADM_JIHOZ.stul.forEach(p => j.push(p.tur === 'xodim' ? use('ofisStul', ...markaz(p), 0) : use('stul', ...markaz(p), 180)));
  XIZMAT_JIHOZ.forEach(z => {
    j.push(rect(z.stol, `fill="url(#${id}yogT)" stroke="#5f4630" stroke-width="8"`));
    const [cx, cy] = markaz(z.stol);
    j.push(`<rect x="${cx - 280}" y="${z.stol.y1 + 60}" width="560" height="60" rx="14" fill="#1f2329"/><rect x="${cx - 220}" y="${cy - 30}" width="440" height="140" rx="12" fill="#3b414b"/>`);
    j.push(use('ofisStul', ...markaz(z.stul), 0));
    z.mehmon.forEach(m => j.push(use('stul', ...markaz(m), 180)));
    shkaf(z.shkaf);
  });
  // koworking / tadbirlar zali
  if (kwRejim === 'kundalik') {
    const kw = KW_KUNDALIK;
    kw.stollar.forEach(r => j.push(rect(r, `rx="60" fill="url(#${id}yogT)" stroke="#5f4630" stroke-width="10"`)));
    kw.dumaloq.forEach(d => j.push(`<circle cx="${d.cx}" cy="${d.cy}" r="${d.r}" fill="url(#${id}yog)" stroke="#a88155" stroke-width="10"/>`));
    kw.stullar.forEach(s => j.push(use('stul', ...markaz(s), BURISH[s.yon])));
    kw.divan.forEach(r => {
      j.push(rect(r, `rx="120" fill="#7d858f"`), rect({ ...r, x1: r.x2 - 220 }, `rx="90" fill="#626a74"`));
      const n = 3, h = (r.y2 - r.y1 - 160) / n;
      for (let i = 0; i < n; i++) j.push(rect({ x1: r.x1 + 60, x2: r.x2 - 240, y1: r.y1 + 80 + i * h + 20, y2: r.y1 + 80 + (i + 1) * h - 20 }, `rx="60" fill="#8c949e"`));
    });
    kw.kreslo.forEach((r, i) => j.push(use('kreslo', ...markaz(r), i === 0 ? 180 : 0)));
    kw.jurnal.forEach(r => j.push(rect(r, `rx="50" fill="url(#${id}yog)" stroke="#a88155" stroke-width="8"`)));
    kw.shkaf.forEach(shkaf);
  } else {
    KW_TADBIR.stullar.forEach(s => j.push(use('stul', ...markaz(s), 0)));
    j.push(rect(KW_TADBIR.minbar, `fill="url(#${id}yogT)" stroke="#5f4630" stroke-width="8"`));
  }
  // sanuzel
  [[3725, 290], [5175, 290], [3725, 1990], [5175, 1990]].forEach(([x, y]) => j.push(use('unitaz', x, y)));
  [[5690, 4700], [5690, 5550]].forEach(([x, y]) => j.push(use('rakovina', x, y, 90)));
  q.push(`<g filter="url(#${id}soya)">${j.join('')}</g>`);
  // doskalar va ekran
  sinf.forEach(x => {
    const d = x.j.doska;
    q.push(rect({ ...d, y1: x.doska === 'yuqori' ? d.y1 : d.y2 - 90, y2: x.doska === 'yuqori' ? d.y1 + 90 : d.y2 }, `fill="#fdfdfd" stroke="#8d949c" stroke-width="12"`));
  });
  if (kwRejim === 'tadbir') q.push(rect({ ...KW_TADBIR.ekran, y2: KW_TADBIR.ekran.y1 + 110 }, `fill="#fdfdfd" stroke="#555" stroke-width="16"`));
  else q.push(rect({ x1: 1200, x2: 3000, y1: 6500, y2: 6590 }, `fill="#1f2329"`));   // koworkingdagi ekran
  q.push(`<g filter="url(#${id}soya)">${osimliklar().map(([a, b]) => use('osimlik', a, b)).join('')}</g>`);

  // ---- eshiklar ----
  ESHIKLAR.forEach(e => {
    const s = eshikSektori(e);
    let leaf, arcEnd, sweep;
    if (e.devor === 'h') {
      leaf = { x: s.ilgak.x, y: e.yuz + e.yon * e.en };
      arcEnd = { x: e.ilgak === 'a' ? e.b : e.a, y: e.yuz };
      sweep = (e.ilgak === 'a') === (e.yon > 0) ? 0 : 1;
      q.push(rect({ x1: s.ilgak.x - 20, x2: s.ilgak.x + 20, y1: Math.min(e.yuz, leaf.y), y2: Math.max(e.yuz, leaf.y) }, `fill="#a8804f"`));
    } else {
      leaf = { x: e.yuz + e.yon * e.en, y: s.ilgak.y };
      arcEnd = { x: e.yuz, y: e.ilgak === 'a' ? e.b : e.a };
      sweep = (e.ilgak === 'a') === (e.yon > 0) ? 1 : 0;
      q.push(rect({ y1: s.ilgak.y - 20, y2: s.ilgak.y + 20, x1: Math.min(e.yuz, leaf.x), x2: Math.max(e.yuz, leaf.x) }, `fill="#a8804f"`));
    }
    q.push(`<path d="M${f(leaf.x)},${f(leaf.y)} A${e.en},${e.en} 0 0 ${sweep} ${f(arcEnd.x)},${f(arcEnd.y)}" fill="none" stroke="#6f6a63" stroke-width="9"/>`);
  });

  // ---- devorlar, ustunlar, derazalar (soya bilan) ----
  const w = [];
  DEVORLAR.filter(d => d.holat !== 'buziladi').forEach(d => w.push(rect(d, `fill="${d.holat === 'tashqi' ? '#2b2d31' : '#34373c'}"`)));
  USTUNLAR.forEach(u => w.push(rect(u, `fill="#8e9297" stroke="#2b2d31" stroke-width="30"`)));
  q.push(`<g filter="url(#${id}dsoya)">${w.join('')}</g>`);
  DERAZALAR.forEach(d => {
    q.push(rect(d, `fill="#cfe4f2" stroke="#f7fbfd" stroke-width="14"`));
    if (d.devor === 'chap') q.push(`<line x1="${(d.x1 + d.x2) / 2}" y1="${d.y1}" x2="${(d.x1 + d.x2) / 2}" y2="${d.y2}" stroke="#fff" stroke-width="18"/>`);
    else q.push(`<line x1="${d.x1}" y1="${(d.y1 + d.y2) / 2}" x2="${d.x2}" y2="${(d.y1 + d.y2) / 2}" stroke="#fff" stroke-width="18"/>`);
  });

  // ---- yozuvlar ----
  const fam = `font-family="Liberation Sans, Arial, sans-serif" paint-order="stroke" stroke="#fbf6ee" stroke-opacity=".85" stroke-linejoin="round"`;
  const t = (x, y, s, size, a = '') => `<text x="${f(x)}" y="${f(y)}" font-size="${size * k}" stroke-width="${size * k * 0.28}" text-anchor="middle" ${a}>${s}</text>`;
  const B = 'font-weight="700" fill="#262626"', R = 'fill="#262626"', G = 'fill="#4b4b4b"';
  const L = [];
  if (o.yozuv !== false) {
    const kor = Object.fromEntries(korsatkichlar().map(z => [z.kod, z]));
    sinf.forEach(x => {
      const K = kor[x.kod];
      // yozuv doska oldidagi bo'sh zonada (qatorlar va o'qituvchi stoli orasida)
      let cx = (x.x1 + x.x2) / 2 - 500, cy = x.doska === 'past' ? x.y2 - 1650 : x.y1 + 1350;
      if (x.kod === 'SR4') { cx = 21650; cy = 15650; }
      L.push(t(cx, cy, XONA_NOMI[x.kod], 440, B));
      L.push(t(cx, cy + 400 * k, `${K.A.toFixed(1)} m² · ${K.orin} o'rin`, 300, R));
    });
    XONALAR.filter(x => x.tur === 'xizmat').forEach(x => {
      const cx = (x.x1 + x.x2) / 2 - 150;
      L.push(t(cx, 11300, 'Xizmat', 330, B), t(cx, 11680, `xonasi ${x.kod.slice(2)}`, 330, B), t(cx, 12080, `${xonaMaydoni(x).toFixed(1)} m²`, 300, R));
    });
    const kwx = XONALAR.find(x => x.kod === 'KW');
    L.push(t(2975, 9460, 'Koworking / Tadbirlar zali', 330, B), t(2975, 9820, `${xonaMaydoni(kwx).toFixed(1)} m²`, 300, R));
    const adm = XONALAR.find(x => x.kod === 'ADM');
    L.push(t(2975, 21820, 'Admin / sotuv', 380, B), t(2975, 22110, `${xonaMaydoni(adm).toFixed(1)} m² · 4 ish o'rni`, 230, G));
    L.push(t(1500, 5150, 'Zinapoya', 380, B), t(1500, 5650, '18.79 m²', 330, R));
    L.push(t(3725, 3200, 'WC (A)', 250, B), t(3725, 3520, '4.68 m²', 220, R));
    L.push(t(5175, 3200, 'WC (B)', 250, B), t(5175, 3520, '5.25 m²', 220, R));
    L.push(t(4300, 5000, "Xo'jalik", 270, B), t(4300, 5320, '6.54 m²', 230, R));
    L.push(t(12600, 8680, 'Koridor · 1.50 m', 320, 'font-weight="700" fill="#3a3a3a"'));
    L.push(t(12600, 15980, 'Koridor · 1.50 m', 320, 'font-weight="700" fill="#3a3a3a"'));
    L.push(t(4800, 20050, 'Kirish zali', 300, 'font-weight="700" fill="#3a3a3a"'));
    L.push(t(2600, 20750, 'Zinapoya (kirish)', 250, B));
    L.push(`<line x1="3750" y1="19200" x2="4550" y2="19200" stroke="#c0392b" stroke-width="45"/><path d="M4450,19030 L4700,19200 L4450,19370 Z" fill="#c0392b"/>`);
    L.push(t(4150, 18900, 'KIRISH', 230, 'font-weight="700" fill="#c0392b"'));
  }
  q.push(`<g ${fam}>${L.join('')}</g>`);

  // ---- o'lchamlar ----
  if (o.olcham !== false) {
    const d = [];
    const T = -DEVOR.yuqori, P = ICHKI.y + DEVOR.past, Lx = -DEVOR.chap, Rx = ICHKI.x + DEVOR.ong;
    const yT = T - 1100, xR = Rx + 1000;
    d.push(`<line x1="${Lx}" y1="${yT}" x2="${Rx}" y2="${yT}" stroke="#222" stroke-width="16"/>`);
    [Lx, Rx].forEach(x => d.push(`<line x1="${x}" y1="${yT - 250}" x2="${x}" y2="${yT + 250}" stroke="#222" stroke-width="16"/><line x1="${x - 110}" y1="${yT + 110}" x2="${x + 110}" y2="${yT - 110}" stroke="#222" stroke-width="30"/>`));
    d.push(`<text x="${(Lx + Rx) / 2}" y="${yT - 170}" font-size="${420 * k}" text-anchor="middle" fill="#222" font-family="Liberation Sans, Arial">24.70</text>`);
    d.push(`<line x1="${xR}" y1="${T}" x2="${xR}" y2="${P}" stroke="#222" stroke-width="16"/>`);
    [T, P].forEach(y => d.push(`<line x1="${xR - 250}" y1="${y}" x2="${xR + 250}" y2="${y}" stroke="#222" stroke-width="16"/><line x1="${xR - 110}" y1="${y + 110}" x2="${xR + 110}" y2="${y - 110}" stroke="#222" stroke-width="30"/>`));
    d.push(`<text x="${xR + 170}" y="${(T + P) / 2}" font-size="${420 * k}" text-anchor="middle" fill="#222" font-family="Liberation Sans, Arial" transform="rotate(90 ${xR + 170} ${(T + P) / 2})">25.00</text>`);
    const zX = (y, n, ust) => {
      d.push(`<line x1="${n[0]}" y1="${y}" x2="${n.at(-1)}" y2="${y}" stroke="#8a8a8a" stroke-width="8"/>`);
      n.forEach(x => d.push(`<line x1="${x - 70}" y1="${y + 70}" x2="${x + 70}" y2="${y - 70}" stroke="#777" stroke-width="16"/>`));
      for (let i = 1; i < n.length; i++) if (n[i] - n[i - 1] >= 1000)
        d.push(`<text x="${(n[i] + n[i - 1]) / 2}" y="${ust ? y - 90 : y + 260}" font-size="${230 * k}" text-anchor="middle" fill="#666" font-family="Liberation Sans, Arial">${((n[i] - n[i - 1]) / 1000).toFixed(2)}</text>`);
    };
    zX(T - 450, [0, 3000, 6250, 11950, 12150, 17950, 18150, ICHKI.x], true);
    zX(P + 450, [0, 5950, 6150, 11950, 12150, 17950, 18150, ICHKI.x], false);
    const zY = (x, n) => {
      d.push(`<line x1="${x}" y1="${n[0]}" x2="${x}" y2="${n.at(-1)}" stroke="#8a8a8a" stroke-width="8"/>`);
      n.forEach(y => d.push(`<line x1="${x - 70}" y1="${y + 70}" x2="${x + 70}" y2="${y - 70}" stroke="#777" stroke-width="16"/>`));
      for (let i = 1; i < n.length; i++) if (n[i] - n[i - 1] >= 1000) {
        const m = (n[i] + n[i - 1]) / 2;
        d.push(`<text x="${x - 90}" y="${m}" font-size="${230 * k}" text-anchor="middle" fill="#666" font-family="Liberation Sans, Arial" transform="rotate(-90 ${x - 90} ${m})">${((n[i] - n[i - 1]) / 1000).toFixed(2)}</text>`);
      }
    };
    zY(Lx - 450, [0, 6500, 18350, 18450, 21250, 21450, ICHKI.y]);
    zY(Rx + 450, [0, 7700, 7800, 9300, 9400, 15000, 15100, 16600, 16700, ICHKI.y]);
    q.push(d.join(''));
  }
  if (o.qoshimcha) q.push(o.qoshimcha);

  // burish (koworking kichik ko'rinishlari uchun): -90° — yuqori devor chapga o'tadi
  let icht = q.join(''), v = vb;
  if (o.aylantir) {
    icht = `<g transform="rotate(-90)">${icht}</g>`;
    v = { x1: vb.y1, y1: -vb.x2, x2: vb.y2, y2: -vb.x1 };
  }
  const size = o.olchamMm ? `width="${(v.x2 - v.x1) / 100}mm" height="${(v.y2 - v.y1) / 100}mm"` : 'width="100%"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${v.x1} ${v.y1} ${v.x2 - v.x1} ${v.y2 - v.y1}" ${size}>${icht}</svg>`;
}

// Koworking zalining ikki rejimi (namunadagi kichik ko'rinishlar)
export function kwKorinish(rejim) {
  return renderSvg({ vb: { x1: -450, y1: 6250, x2: 6300, y2: 18600 }, kwRejim: rejim, yozuv: false, olcham: false, aylantir: true });
}
