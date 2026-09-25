// Reja chizmasi (SVG). Rejimlar: 'mavjud' (1-varaq), 'jihoz' (2-varaq), 'havo' (3-varaq), 'izoh' (A4 hujjat).
import {
  ICHKI, DEVOR, USTUNLAR, DERAZALAR, DEVORLAR, ESHIKLAR, ZINALAR, XONALAR, ESKI_XONALAR, ADM_JIHOZ,
  sinflar, PARTA,
} from './model.mjs';
import { eshikSektori, korsatkichlar, xonaMaydoni } from './tekshiruv.mjs';

export const RANG = {
  devorT: '#4d5566', devorI: '#262b36', ustun: '#121418', pol: '#f5f3ee', koridor: '#eceae4', qotgan: '#e6e3dc',
  parta: '#ebdfc7', partaCh: '#b3a17c', stul: '#b9cbee', stulCh: '#7894c6', doska: '#2e5e45', ustoz: '#c69c62',
  matn: '#1b2a5e', kul: '#6b7280', qizil: '#c0392b', yangi: '#e07b28', buz: '#d63031', kok: '#1f6fd1', havoQ: '#d1452f',
  deraza: '#ffffff',
};

let IDN = 0;
const f = n => Math.round(n * 10) / 10;
const son = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export function rejaSvg(o = {}) {
  const id = `r${++IDN}`;
  const rejim = o.rejim || 'jihoz';
  const k = o.k || 1;                 // chiziq va matn kattaligi koeffitsienti
  const vb = o.vb || { x1: -2500, y1: -2300, x2: 26100, y2: 25900 };
  const w = vb.x2 - vb.x1, h = vb.y2 - vb.y1;
  const q = [];
  const rect = (r, attrs) => `<rect x="${f(r.x1)}" y="${f(r.y1)}" width="${f(r.x2 - r.x1)}" height="${f(r.y2 - r.y1)}" ${attrs}/>`;
  const matn = (x, y, t, s, attrs = '') => `<text x="${f(x)}" y="${f(y)}" font-size="${f(s * k)}" ${attrs}>${t}</text>`;
  const chiziq = (x1, y1, x2, y2, attrs) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${attrs}/>`;

  q.push(`<defs>
    <pattern id="${id}sh" width="${220 * k}" height="${220 * k}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="${220 * k}" stroke="#b9b4a8" stroke-width="${14 * k}"/></pattern>
    <marker id="${id}ak" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${RANG.kok}"/></marker>
    <marker id="${id}aq" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${RANG.havoQ}"/></marker>
    <marker id="${id}ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${RANG.qizil}"/></marker>
    <marker id="${id}ad" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#333"/></marker>
    <marker id="${id}ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#5b8fd6"/></marker>
  </defs>`);

  // ---- pol ----
  q.push(rect({ x1: 0, y1: 0, x2: ICHKI.x, y2: ICHKI.y }, `fill="${RANG.pol}"`));
  if (rejim !== 'mavjud') {
    XONALAR.filter(x => x.tur === 'koridor').forEach(x => q.push(rect(x, `fill="${RANG.koridor}"`)));
    XONALAR.filter(x => x.qotgan && x.tur !== 'zina').forEach(x => q.push(rect(x, `fill="${RANG.qotgan}"`)));
  } else {
    // o'zgarmaydigan qismlar shtrixlanadi
    [{ x1: 0, y1: 0, x2: 6250, y2: 6500 }, { x1: 0, y1: 18350, x2: 3650, y2: 21250 }, { x1: 0, y1: 21250, x2: 5950, y2: ICHKI.y }]
      .forEach(r => q.push(rect(r, `fill="url(#${id}sh)"`)));
  }

  // ---- zinalar ----
  ZINALAR.forEach(z => {
    q.push(rect(z, `fill="${rejim === 'mavjud' ? 'none' : '#fbfaf7'}" stroke="#555" stroke-width="${8 * k}"`));
    z.marshlar.forEach(m => {
      q.push(rect(m, `fill="#fff" stroke="#555" stroke-width="${8 * k}"`));
      if (m.yo === 'y') for (let y = m.y1 + 280; y < m.y2; y += 280) q.push(chiziq(m.x1, y, m.x2, y, `stroke="#777" stroke-width="${7 * k}"`));
      else for (let x = m.x1 + 270; x < m.x2; x += 270) q.push(chiziq(x, m.y1, x, m.y2, `stroke="#777" stroke-width="${7 * k}"`));
    });
    const s = z.strelka;
    q.push(chiziq(s.x, s.y1, s.x, s.y2, `stroke="#333" stroke-width="${10 * k}" marker-end="url(#${id}ad)"`));
  });

  // ---- devorlar ----
  DEVORLAR.forEach(wl => {
    if (wl.holat === 'tashqi') return q.push(rect(wl, `fill="${RANG.devorT}"`));
    if (rejim === 'mavjud') {
      if (wl.holat === 'mavjud') q.push(rect(wl, `fill="${RANG.devorI}"`));
      if (wl.holat === 'yangi') q.push(rect(wl, `fill="${RANG.yangi}"`));
      if (wl.holat === 'buziladi') q.push(rect(wl, `fill="#fff" stroke="${RANG.buz}" stroke-width="${14 * k}" stroke-dasharray="${60 * k} ${40 * k}"`));
    } else if (wl.holat !== 'buziladi') {
      q.push(rect(wl, `fill="${rejim === 'havo' ? '#5d6472' : RANG.devorI}"`));
    }
  });
  // ---- derazalar ----
  DERAZALAR.forEach(d => {
    q.push(rect(d, `fill="${RANG.deraza}" stroke="#555" stroke-width="${7 * k}"`));
    if (d.devor === 'chap') {
      const m = (d.x1 + d.x2) / 2;
      q.push(chiziq(m - 40, d.y1, m - 40, d.y2, `stroke="#555" stroke-width="${6 * k}"`), chiziq(m + 40, d.y1, m + 40, d.y2, `stroke="#555" stroke-width="${6 * k}"`));
    } else {
      const m = (d.y1 + d.y2) / 2;
      q.push(chiziq(d.x1, m - 40, d.x2, m - 40, `stroke="#555" stroke-width="${6 * k}"`), chiziq(d.x1, m + 40, d.x2, m + 40, `stroke="#555" stroke-width="${6 * k}"`));
    }
  });
  // ---- ustunlar ----
  USTUNLAR.forEach(u => {
    if (u.holat === 'taxminiy') q.push(rect(u, `fill="#fff" stroke="${RANG.ustun}" stroke-width="${16 * k}" stroke-dasharray="${50 * k} ${30 * k}"`));
    else q.push(rect(u, `fill="${RANG.ustun}"`));
  });

  // ---- eshiklar ----
  ESHIKLAR.forEach(e => {
    const s = eshikSektori(e);
    const rang = rejim === 'mavjud' && e.holat === 'yangi' ? RANG.yangi : '#333';
    let leaf, arcEnd, sweep;
    if (e.devor === 'h') {
      leaf = { x: s.ilgak.x, y: e.yuz + e.yon * e.en };
      arcEnd = { x: e.ilgak === 'a' ? e.b : e.a, y: e.yuz };
      sweep = (e.ilgak === 'a') === (e.yon > 0) ? 0 : 1;
    } else {
      leaf = { x: e.yuz + e.yon * e.en, y: s.ilgak.y };
      arcEnd = { x: e.yuz, y: e.ilgak === 'a' ? e.b : e.a };
      sweep = (e.ilgak === 'a') === (e.yon > 0) ? 1 : 0;
    }
    q.push(chiziq(s.ilgak.x, s.ilgak.y, leaf.x, leaf.y, `stroke="${rang}" stroke-width="${14 * k}"`));
    q.push(`<path d="M${f(leaf.x)},${f(leaf.y)} A${e.en},${e.en} 0 0 ${sweep} ${f(arcEnd.x)},${f(arcEnd.y)}" fill="none" stroke="${rang}" stroke-width="${6 * k}" stroke-dasharray="${30 * k} ${20 * k}"/>`);
  });

  // ---- jihozlar ----
  const sinf = sinflar();
  if (rejim === 'jihoz' || rejim === 'izoh' || rejim === 'havo') {
    const soya = rejim === 'havo' ? ' opacity="0.35"' : '';
    q.push(`<g${soya}>`);
    sinf.forEach(x => {
      const j = x.j;
      j.partalar.forEach(p => q.push(rect(p, `fill="${RANG.parta}" stroke="${RANG.partaCh}" stroke-width="${8 * k}"`)));
      j.stullar.forEach(p => q.push(rect(p, `fill="${RANG.stul}" stroke="${RANG.stulCh}" stroke-width="${8 * k}"`)));
      q.push(rect(j.ustozStoli, `fill="${RANG.ustoz}" stroke="#8a6a3c" stroke-width="${8 * k}"`));
      q.push(rect(j.ustozStuli, `fill="${RANG.stul}" stroke="${RANG.stulCh}" stroke-width="${8 * k}"`));
      q.push(rect(j.doska, `fill="${RANG.doska}"`));
    });
    ADM_JIHOZ.stol.forEach(p => q.push(rect(p, `fill="${RANG.ustoz}" stroke="#8a6a3c" stroke-width="${8 * k}"`)));
    ADM_JIHOZ.stul.forEach(p => q.push(rect(p, `fill="${RANG.stul}" stroke="${RANG.stulCh}" stroke-width="${8 * k}"`)));
    q.push('</g>');
  }

  // ---- havo almashinuvi ----
  if (rejim === 'havo') q.push(havoQatlami(id, k, sinf));

  // ---- yozuvlar ----
  const fam = 'font-family="Liberation Sans, Arial, sans-serif"';
  q.push(`<g ${fam}>`);
  if (rejim === 'mavjud') {
    ESKI_XONALAR.forEach(([n, a, x, y]) => {
      q.push(matn(x, y, n, 380, `text-anchor="middle" fill="#444" font-style="italic"`));
      q.push(matn(x, y + 400 * k, a ? a.toFixed(2) : '—', 300, `text-anchor="middle" fill="#444" font-style="italic"`));
    });
    q.push(matn(800, 19350, 'ZN2', 260, `text-anchor="middle" fill="#555"`));
  } else {
    const kor = Object.fromEntries(korsatkichlar().map(x => [x.kod, x]));
    XONALAR.forEach(x => {
      const cx = (x.x1 + x.x2) / 2;
      let cy = (x.y1 + x.y2) / 2;
      if (x.tur === 'sinf') {
        const K = kor[x.kod];
        // yozuv orqa bo'sh zonada
        cy = x.kod === 'SR7' ? 15900 : x.doska === 'past' ? 2400 : ICHKI.y - 2350;
        if (rejim === 'havo') {
          const hx = x.kod === 'SR7' ? 2700 : x.x1 + (x.x2 - x.x1) * 0.27;
          const hy = x.kod === 'SR7' ? 15400 : x.doska === 'past' ? 3000 : ICHKI.y - 2600;
          q.push(matn(hx, hy, x.kod, 520, `text-anchor="middle" font-weight="700" fill="${RANG.matn}"`));
          return;
        }
        q.push(matn(cx, cy, x.kod, 520, `text-anchor="middle" font-weight="700" fill="${RANG.matn}"`));
        q.push(matn(cx, cy + 420 * k, x.nomi, 250, `text-anchor="middle" fill="#555"`));
        q.push(matn(cx, cy + 760 * k, `${K.A.toFixed(1)} m² · ${K.orin} o'rin`, 240, `text-anchor="middle" fill="#888"`));
      } else if (x.kod === 'ADM') {
        q.push(matn(1300, 22080, 'ADM', 420, `text-anchor="middle" font-weight="700" fill="${RANG.matn}"`));
        if (rejim !== 'havo') q.push(matn(2100, 22040, `admin · sotuv · 4 ish o'rni`, 190, `text-anchor="start" fill="#555"`));
      } else if (x.kod === 'K1') {
        q.push(matn(15000, cy + 110, 'K1', 380, `text-anchor="middle" font-weight="700" fill="${RANG.matn}"`));
        q.push(matn(16800, cy + 90, `Koridor 1500 · ${xonaMaydoni(x).toFixed(1)} m²`, 220, `text-anchor="start" fill="#555"`));
      } else if (x.kod === 'K2') {
        q.push(`<g transform="rotate(-90 ${cx} 11200)">${matn(cx, 11200 + 110, 'K2 · Koridor 1500', 260, `text-anchor="middle" fill="#555"`)}</g>`);
      } else if (x.kod === 'ZL') {
        q.push(matn(4800, 20500, 'ZL', 300, `text-anchor="middle" font-weight="700" fill="${RANG.matn}"`));
      } else if (x.kod === 'ZN1' || x.kod === 'ZN2') {
        const zy = x.kod === 'ZN1' ? 5200 : 19350;
        q.push(matn(x.kod === 'ZN1' ? 1500 : 800, zy, x.kod, 300, `text-anchor="middle" font-weight="700" fill="${RANG.matn}"`));
      } else if (x.tur === 'sanuzel') {
        q.push(matn(cx, cy + 90, x.kod, 240, `text-anchor="middle" fill="#666"`));
      }
    });
    // kirish strelkasi
    q.push(chiziq(3700, 19200, 4900, 19200, `stroke="${RANG.qizil}" stroke-width="${22 * k}" marker-end="url(#${id}ar)"`));
    q.push(matn(3650, 18850, 'KIRISH', 230, `fill="${RANG.qizil}" font-weight="700"`));
  }
  // ustun kodlari
  if (o.ustunKod !== false) USTUNLAR.filter(u => u.ichki).forEach(u => {
    q.push(matn(u.x2 + 60, u.y1 - 60, u.kod, 210, `fill="${RANG.qizil}" font-weight="700"`));
  });
  q.push('</g>');

  // bitta xonani ajratib ko'rsatish (izoh sahifalari uchun)
  if (o.urgu) {
    const u = o.urgu;
    q.push(`<path d="M${vb.x1},${vb.y1} H${vb.x2} V${vb.y2} H${vb.x1} Z M${u.x1},${u.y1} V${u.y2} H${u.x2} V${u.y1} Z" fill="#fff" fill-opacity="0.6" fill-rule="evenodd"/>`);
    q.push(rect(u, `fill="none" stroke="${RANG.qizil}" stroke-width="${26 * k}"`));
  }
  if (o.olchamlar) q.push(olchamlar(id, k, fam));
  if (o.annotatsiya) q.push(annotatsiya(id, k, fam, sinf.find(x => x.kod === 'SR2')));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x1} ${vb.y1} ${w} ${h}" ${o.olchamMm ? `width="${w / 100}mm" height="${h / 100}mm"` : 'width="100%"'} preserveAspectRatio="xMidYMid meet">${q.join('')}</svg>`;
}

// ---- o'lcham zanjirlari ----
function olchamlar(id, k, fam) {
  const q = [`<g ${fam} fill="#333" stroke="#444">`];
  const s = 7 * k, t = 200 * k;
  const zanjirX = (y, nuqtalar, yozuv = true) => {
    q.push(`<line x1="${nuqtalar[0]}" y1="${y}" x2="${nuqtalar.at(-1)}" y2="${y}" stroke-width="${s}"/>`);
    nuqtalar.forEach(x => q.push(`<line x1="${x - 90}" y1="${y + 90}" x2="${x + 90}" y2="${y - 90}" stroke-width="${s * 2}"/>`,
      `<line x1="${x}" y1="${y - 180}" x2="${x}" y2="${y + 180}" stroke-width="${s}"/>`));
    if (yozuv) for (let i = 1; i < nuqtalar.length; i++) {
      const a = nuqtalar[i - 1], b = nuqtalar[i];
      if (b - a < 300) continue;
      q.push(`<text x="${(a + b) / 2}" y="${y - 70}" font-size="${t}" text-anchor="middle" stroke="none">${son(b - a)}</text>`);
    }
  };
  const zanjirY = (x, nuqtalar) => {
    q.push(`<line x1="${x}" y1="${nuqtalar[0]}" x2="${x}" y2="${nuqtalar.at(-1)}" stroke-width="${s}"/>`);
    nuqtalar.forEach(y => q.push(`<line x1="${x - 90}" y1="${y + 90}" x2="${x + 90}" y2="${y - 90}" stroke-width="${s * 2}"/>`,
      `<line x1="${x - 180}" y1="${y}" x2="${x + 180}" y2="${y}" stroke-width="${s}"/>`));
    for (let i = 1; i < nuqtalar.length; i++) {
      const a = nuqtalar[i - 1], b = nuqtalar[i];
      if (b - a < 300) continue;
      q.push(`<text x="${x - 70}" y="${(a + b) / 2}" font-size="${t}" text-anchor="middle" stroke="none" transform="rotate(-90 ${x - 70} ${(a + b) / 2})">${son(b - a)}</text>`);
    }
  };
  const T = -DEVOR.yuqori, P = ICHKI.y + DEVOR.past, L = -DEVOR.chap, R = ICHKI.x + DEVOR.ong;
  zanjirX(T - 700, [0, 3000, 3100, 5900, 6250, 11950, 12150, 17950, 18150, ICHKI.x]);
  zanjirX(T - 1500, [L, R]);
  zanjirX(P + 700, [0, 5950, 6150, 11950, 12150, 17950, 18150, ICHKI.x]);
  zanjirY(L - 700, [0, 6300, 6500, 18350, 18450, 21250, 21450, ICHKI.y]);
  zanjirY(L - 1500, [T, P]);
  zanjirY(R + 800, [0, 12200, 12400, 13900, 14000, ICHKI.y]);
  q.push('</g>');
  return q.join('');
}

// ---- SR2 dagi qizil o'lcham annotatsiyasi (Beruniy namunasidagi kabi) ----
function annotatsiya(id, k, fam, x) {
  const j = x.j, q = [`<g ${fam} fill="${RANG.qizil}" stroke="${RANG.qizil}">`];
  const s = 6 * k, t = 150 * k;
  // gorizontal: devor – partalar – yo'laklar – devor, 1-qator oldida
  const y = j.partalar[0].y2 + 260;
  const xs = [x.x1];
  let u = x.x1 + j.u0;
  xs.push(u);
  j.s.bloklar.forEach((n, bi) => { for (let i = 0; i < n; i++) { u += PARTA.eni; xs.push(u); } if (bi < j.s.bloklar.length - 1) { u += j.s.yolak; xs.push(u); } });
  xs.push(x.x2);
  q.push(`<line x1="${xs[0]}" y1="${y}" x2="${xs.at(-1)}" y2="${y}" stroke-width="${s}"/>`);
  xs.forEach(v => q.push(`<line x1="${v}" y1="${y - 80}" x2="${v}" y2="${y + 80}" stroke-width="${s}"/>`));
  for (let i = 1; i < xs.length; i++) q.push(`<text x="${(xs[i - 1] + xs[i]) / 2}" y="${y + 230}" font-size="${t}" text-anchor="middle" stroke="none">${Math.round(xs[i] - xs[i - 1])}</text>`);
  q.push(`<text x="${x.x1 + 150}" y="${y + 460}" font-size="${t}" stroke="none">parta qadami</text>`);
  // vertikal: doska → 1-parta, keyin parta 500 / o'tish 800
  const vx = x.x1 + j.u0 - 90;
  const ys = [x.y2, x.y2 - j.s.doska];
  for (let r = 0; r < j.s.qatorlar; r++) { const v = x.y2 - j.s.doska - r * j.s.qadam; ys.push(v - PARTA.chuq); if (r < j.s.qatorlar - 1) ys.push(v - j.s.qadam); }
  q.push(`<line x1="${vx}" y1="${ys[0]}" x2="${vx}" y2="${ys.at(-1)}" stroke-width="${s}"/>`);
  ys.forEach(v => q.push(`<line x1="${vx - 80}" y1="${v}" x2="${vx + 80}" y2="${v}" stroke-width="${s}"/>`));
  for (let i = 1; i < ys.length; i++) {
    const m = (ys[i - 1] + ys[i]) / 2;
    q.push(`<text x="${vx - 60}" y="${m}" font-size="${t}" text-anchor="middle" stroke="none" transform="rotate(-90 ${vx - 60} ${m})">${Math.round(ys[i - 1] - ys[i])}</text>`);
  }
  const m = (ys[2] + ys.at(-1)) / 2;
  q.push(`<text x="${vx + 170}" y="${m}" font-size="${t}" text-anchor="middle" stroke="none" transform="rotate(-90 ${vx + 170} ${m})">qator qadami</text>`);
  q.push('</g>');
  return q.join('');
}

// ---- havo almashinuvi qatlami ----
export const QURILMALAR = (() => {
  const r = [];
  sinflar().forEach((x, i) => {
    const cx = (x.x1 + x.x2) / 2;
    const d = { kod: `PV-${i + 1}`, xona: x.kod };
    if (x.kod === 'SR7') {
      Object.assign(d, { qurilma: { x1: 350, x2: 1150, y1: 15300, y2: 16600 }, devor: 'chap',
        kirish: { x1: -400, x2: 0, y1: 12900, y2: 13500 }, chiqish: { x1: -400, x2: 0, y1: 17300, y2: 17900 },
        kanal: [[750, 15300], [750, 12900], [2175, 12900], [2175, 9300]],
        diffuzor: [[2175, 9500], [2175, 12100]], sorish: [[2175, 17300]],
        konditsioner: [[1100, 10300], [3250, 10300]], co2: [3900, 8200] });
    } else {
      const orqa = x.doska === 'past' ? x.y1 : x.y2;       // deraza devori
      const ichkari = x.doska === 'past' ? 1 : -1;
      const yq = orqa + ichkari * 350;
      const qut = ichkari > 0 ? { y1: yq, y2: yq + 800 } : { y1: yq - 800, y2: yq };
      const der = DERAZALAR.find(dd => (dd.devor === (x.doska === 'past' ? 'yuqori' : 'past')) && dd.x1 >= x.x1 && dd.x2 <= x.x2);
      const devY = ichkari > 0 ? { y1: -DEVOR.yuqori, y2: 0 } : { y1: ICHKI.y, y2: ICHKI.y + DEVOR.past };
      const oldi = x.doska === 'past' ? x.y2 : x.y1;       // doska devori
      const v = n => oldi - ichkari * n;                  // doskadan n mm
      Object.assign(d, { qurilma: { x1: cx - 650, x2: cx + 650, ...qut }, devor: x.doska === 'past' ? 'yuqori' : 'past',
        kirish: { x1: (x.x1 + der.x1) / 2 - 300, x2: (x.x1 + der.x1) / 2 + 300, ...devY },
        chiqish: { x1: (der.x2 + x.x2) / 2 - 300, x2: (der.x2 + x.x2) / 2 + 300, ...devY },
        kanal: [[cx, (qut.y1 + qut.y2) / 2], [cx, v(3200)]],
        diffuzor: [[cx, v(3400)], [cx, v(5900)]], sorish: [[cx, orqa + ichkari * 2000]],
        konditsioner: [[x.x1 + (x.x2 - x.x1) / 4, v(4650)], [x.x1 + 3 * (x.x2 - x.x1) / 4, v(4650)]],
        co2: [x.x2 - 500, v(1600)] });
    }
    r.push(d);
  });
  r.push({ kod: 'PV-8', xona: 'ADM', qurilma: { x1: 2400, x2: 3300, y1: 23500, y2: 24000 }, devor: 'past',
    kirish: { x1: 900, x2: 1400, y1: ICHKI.y, y2: ICHKI.y + DEVOR.past }, chiqish: { x1: 4700, x2: 5200, y1: ICHKI.y, y2: ICHKI.y + DEVOR.past },
    kanal: [[2850, 23500], [2850, 21950]], diffuzor: [[2850, 21950]], sorish: [[4900, 23150]], konditsioner: [[4000, 21900]], co2: [5700, 21750] });
  return r;
})();

function havoQatlami(id, k, sinf) {
  const q = [];
  const s = 300;
  const kv = (x, y, r, attrs) => `<rect x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}" ${attrs}/>`;
  QURILMALAR.forEach(d => {
    // kanal
    q.push(`<polyline points="${d.kanal.map(p => p.join(',')).join(' ')}" fill="none" stroke="${RANG.kok}" stroke-width="${70 * k}" stroke-linejoin="round" opacity="0.8"/>`);
    // qurilma (shift ortida — punktir)
    q.push(`<rect x="${d.qurilma.x1}" y="${d.qurilma.y1}" width="${d.qurilma.x2 - d.qurilma.x1}" height="${d.qurilma.y2 - d.qurilma.y1}" fill="#fff" stroke="#222" stroke-width="${16 * k}" stroke-dasharray="${60 * k} ${30 * k}"/>`);
    q.push(`<text x="${(d.qurilma.x1 + d.qurilma.x2) / 2}" y="${(d.qurilma.y1 + d.qurilma.y2) / 2 + 80 * k}" font-size="${230 * k}" text-anchor="middle" font-weight="700" fill="#222" font-family="Liberation Sans, Arial">${d.kod}</text>`);
    // fasad panjaralari va strelkalar
    const tash = (r, rang, ichkariga) => {
      q.push(`<rect x="${r.x1}" y="${r.y1}" width="${r.x2 - r.x1}" height="${r.y2 - r.y1}" fill="${rang}"/>`);
      const cx = (r.x1 + r.x2) / 2, cy = (r.y1 + r.y2) / 2;
      let a, b;
      if (d.devor === 'chap') { a = [cx - 1100, cy]; b = [cx + 700, cy]; }
      else if (d.devor === 'yuqori') { a = [cx, cy - 1100]; b = [cx, cy + 700]; }
      else { a = [cx, cy + 1100]; b = [cx, cy - 700]; }
      if (!ichkariga) [a, b] = [b, a];
      q.push(`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${rang}" stroke-width="${40 * k}" marker-end="url(#${id}${rang === RANG.kok ? 'ak' : 'aq'})"/>`);
    };
    tash(d.kirish, RANG.kok, true);
    tash(d.chiqish, RANG.havoQ, false);
    // diffuzorlar va so'rish panjaralari
    d.diffuzor.forEach(([x, y]) => q.push(kv(x, y, s, `fill="#dbe9fb" stroke="${RANG.kok}" stroke-width="${18 * k}"`),
      `<path d="M${x - s},${y - s} L${x + s},${y + s} M${x + s},${y - s} L${x - s},${y + s}" stroke="${RANG.kok}" stroke-width="${12 * k}"/>`));
    d.sorish.forEach(([x, y]) => q.push(kv(x, y, s, `fill="#fbe1dc" stroke="${RANG.havoQ}" stroke-width="${18 * k}"`),
      `<path d="M${x - s},${y} L${x + s},${y} M${x},${y - s} L${x},${y + s}" stroke="${RANG.havoQ}" stroke-width="${12 * k}"/>`));
    d.konditsioner.forEach(([x, y]) => q.push(kv(x, y, 420, `fill="#f1f2f4" stroke="#555" stroke-width="${14 * k}"`),
      `<rect x="${x - 250}" y="${y - 250}" width="500" height="500" fill="none" stroke="#999" stroke-width="${10 * k}"/>`,
      `<text x="${x}" y="${y + 70 * k}" font-size="${200 * k}" text-anchor="middle" fill="#444" font-family="Liberation Sans, Arial">KD</text>`));
    const [cx, cy] = d.co2;
    q.push(`<circle cx="${cx}" cy="${cy}" r="${210 * k}" fill="#fff" stroke="#2e7d32" stroke-width="${14 * k}"/>`,
      `<text x="${cx}" y="${cy + 55 * k}" font-size="${140 * k}" text-anchor="middle" fill="#2e7d32" font-family="Liberation Sans, Arial" font-weight="700">CO₂</text>`);
  });
  // xonadagi havo oqimi strelkalari (oldindan orqaga)
  sinf.forEach(x => {
    if (x.kod === 'SR7') {
      [1100, 3250].forEach(xx => q.push(`<path d="M${xx},${9800} L${xx},${14500}" stroke="#5b8fd6" stroke-width="${30 * k}" stroke-dasharray="${160 * k} ${90 * k}" fill="none" marker-end="url(#${id}ah)"/>`));
      return;
    }
    const W = x.x2 - x.x1;
    const oldi = x.doska === 'past' ? x.y2 : x.y1, ich = x.doska === 'past' ? 1 : -1;
    [x.x1 + W * 0.12, x.x2 - W * 0.12].forEach(xx => q.push(`<path d="M${xx},${oldi - ich * 3200} L${xx},${oldi - ich * 8200}" stroke="#5b8fd6" stroke-width="${30 * k}" stroke-dasharray="${160 * k} ${90 * k}" fill="none" marker-end="url(#${id}ah)"/>`));
  });
  // sanuzel chiqarish ventilyatsiyasi
  q.push(`<circle cx="3725" cy="3350" r="${340 * k}" fill="#fff" stroke="${RANG.havoQ}" stroke-width="${18 * k}"/>`,
    `<text x="3725" y="${3350 + 70 * k}" font-size="${190 * k}" text-anchor="middle" fill="${RANG.havoQ}" font-family="Liberation Sans, Arial" font-weight="700">V-1</text>`);
  return q.join('');
}

export { son };
