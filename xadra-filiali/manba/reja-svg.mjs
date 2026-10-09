// Reja chizmasi (SVG). Rejimlar: 'mavjud' (1-varaq), 'jihoz' (2-varaq), 'havo' (3-varaq), 'izoh' (A4 hujjat).
import {
  ICHKI, DEVOR, USTUNLAR, DERAZALAR, DEVORLAR, ESHIKLAR, ZINALAR, XONALAR, ESKI_XONALAR, ADM_JIHOZ,
  XIZMAT_JIHOZ, KW_KUNDALIK, sinflar, PARTA, bolaklar, xizmatJihozlari, lokal, KORIDOR_LOGO, DOSKALAR, DOSKA_NOMI, wcJihozlari,
} from './model.mjs';
import { eshikSektori, korsatkichlar, xonaMaydoni } from './tekshiruv.mjs';

export const RANG = {
  devorT: '#4d5566', devorI: '#262b36', ustun: '#121418', pol: '#f5f3ee', koridor: '#eceae4', qotgan: '#e6e3dc',
  parta: '#ebdfc7', partaCh: '#b3a17c', stul: '#b9cbee', stulCh: '#7894c6', doska: '#2e5e45', ustoz: '#c69c62',
  matn: '#1b2a5e', kul: '#6b7280', qizil: '#c0392b', yangi: '#e07b28', buz: '#d63031', kok: '#1f6fd1', havoQ: '#d1452f',
  deraza: '#ffffff',
};

let IDN = 0;

// Koridor oxiridagi yorituvchi logotip (GKL devorda) va e'lon / e'tirof doskalari — texnik va taqdimot rejalari uchun.
export const KOR_RANG = { logo: '#00B533', nuqta: '#FFCC19', elon: '#8a7d66', etirof: '#d9a300' };
export function koridorElementlar(k = 1, qoshimcha = '') {
  const q = [];
  const fam = `font-family="Liberation Sans, Arial, sans-serif" ${qoshimcha}`;
  KORIDOR_LOGO.forEach(l => {
    const ym = (l.y1 + l.y2) / 2, cx = l.x - 380, r = 150;
    q.push(`<rect x="${l.x - 45}" y="${ym - l.en / 2}" width="45" height="${l.en}" fill="${KOR_RANG.logo}"/>`);
    q.push(`<circle cx="${cx}" cy="${ym}" r="${r}" fill="none" stroke="${KOR_RANG.logo}" stroke-width="${r * 0.42}"/><circle cx="${cx + r * 0.3}" cy="${ym - r * 0.3}" r="${r * 0.33}" fill="${KOR_RANG.nuqta}"/>`);
    q.push(`<text x="${cx - 260}" y="${ym + 65 * k}" font-size="${190 * k}" stroke-width="${190 * k * 0.28}" text-anchor="end" font-weight="700" fill="#1d7a35" ${fam}>Logotip</text>`);
  });
  DOSKALAR.forEach(b => {
    const t = 50, y1 = b.yon < 0 ? b.y - t : b.y;
    q.push(`<rect x="${b.x1}" y="${y1}" width="${b.x2 - b.x1}" height="${t}" fill="${KOR_RANG[b.tur]}"/>`);
    const ty = b.yon < 0 ? b.y - 140 : b.y + 290;
    q.push(`<text x="${(b.x1 + b.x2) / 2}" y="${ty}" font-size="${170 * k}" stroke-width="${170 * k * 0.28}" text-anchor="middle" fill="${b.tur === 'etirof' ? '#8a6a00' : '#5e5444'}" ${fam}>${DOSKA_NOMI[b.tur]}</text>`);
  });
  return q.join('');
}
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
    XONALAR.filter(x => x.tur === 'xizmat' || x.tur === 'koworking').forEach(x => q.push(rect(x, `fill="#f1eee7"`)));
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
      if (wl.holat === 'yangi') q.push(rect(wl, wl.shisha ? `fill="#cfe6f7" stroke="${RANG.yangi}" stroke-width="${12 * k}"` : `fill="${RANG.yangi}"`));
      if (wl.holat === 'buziladi') q.push(rect(wl, `fill="#fff" stroke="${RANG.buz}" stroke-width="${14 * k}" stroke-dasharray="${60 * k} ${40 * k}"`));
    } else if (wl.shisha) {
      q.push(rect(wl, `fill="#e3f2fb" stroke="#2f78b7" stroke-width="${10 * k}"`));
      if (wl.x2 - wl.x1 > wl.y2 - wl.y1) q.push(chiziq(wl.x1, (wl.y1 + wl.y2) / 2, wl.x2, (wl.y1 + wl.y2) / 2, `stroke="#2f78b7" stroke-width="${7 * k}"`));
      else q.push(chiziq((wl.x1 + wl.x2) / 2, wl.y1, (wl.x1 + wl.x2) / 2, wl.y2, `stroke="#2f78b7" stroke-width="${7 * k}"`));
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
    XIZMAT_JIHOZ.forEach(z => {
      [...z.stollar, ...z.shkaflar].forEach(p => q.push(rect(p, `fill="${RANG.ustoz}" stroke="#8a6a3c" stroke-width="${8 * k}"`)));
      z.dumaloq.forEach(d => q.push(`<circle cx="${d.cx}" cy="${d.cy}" r="${d.r}" fill="${RANG.parta}" stroke="${RANG.partaCh}" stroke-width="${8 * k}"/>`));
      z.divanlar.forEach(p => q.push(rect(p, `rx="100" fill="#c9ccd2" stroke="#8a8f99" stroke-width="${8 * k}"`)));
      z.stullar.forEach(p => q.push(rect(p, `fill="${RANG.stul}" stroke="${RANG.stulCh}" stroke-width="${8 * k}"`)));
    });
    const kw = KW_KUNDALIK;
    [...kw.stollar, ...kw.jurnal, ...kw.shkaf].forEach(p => q.push(rect(p, `fill="${RANG.ustoz}" stroke="#8a6a3c" stroke-width="${8 * k}"`)));
    kw.dumaloq.forEach(d => q.push(`<circle cx="${d.cx}" cy="${d.cy}" r="${d.r}" fill="${RANG.parta}" stroke="${RANG.partaCh}" stroke-width="${8 * k}"/>`));
    [...kw.divan, ...kw.kreslo].forEach(p => q.push(rect(p, `rx="120" fill="#c9ccd2" stroke="#8a8f99" stroke-width="${8 * k}"`)));
    kw.stullar.forEach(p => q.push(rect(p, `fill="${RANG.stul}" stroke="${RANG.stulCh}" stroke-width="${8 * k}"`)));
    // ayollar hojatxonasi: unitaz (kabinalarda), rakovina (tamburlarda)
    wcJihozlari().forEach(p => q.push(rect(p, `rx="${p.tur === 'unitaz' ? 150 : 80}" fill="#fff" stroke="#6f7a85" stroke-width="${8 * k}"`)));
    q.push('</g>');
    if (rejim !== 'havo') q.push(koridorElementlar(k));
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
        const K = kor[x.kod], L = lokal(x);
        if (rejim === 'havo') {
          const p = L.G(L.W / 2, L.D * 0.55);
          q.push(matn(p.x, p.y + 170, x.kod, 480, `text-anchor="middle" font-weight="700" fill="${RANG.matn}"`));
          return;
        }
        // yozuv doska oldidagi bo'sh zonada (doska va 1-qator orasida), o'qituvchi stoli bilan eshik oralig'ida;
        // o'lcham annotatsiyasi bor xonada — zanjirlardan chetroqda
        const p = L.G(o.annotatsiya && x.kod === 'SR2' ? L.W * 0.69 : L.W / 2, K.doska / 2);
        const ust = p.y - 380 * k;
        q.push(matn(p.x, ust, x.kod, 440, `text-anchor="middle" font-weight="700" fill="${RANG.matn}"`));
        q.push(matn(p.x, ust + 360 * k, `${x.kod.slice(2)}-xona`, 300, `text-anchor="middle" font-weight="700" fill="${RANG.matn}"`));
        q.push(matn(p.x, ust + 680 * k, `${K.A.toFixed(1)} m²`, 240, `text-anchor="middle" fill="#666"`));
        q.push(matn(p.x, ust + 960 * k, `${K.orin} o'rin`, 240, `text-anchor="middle" fill="#666"`));
      } else if (x.tur === 'xizmat') {
        const ly = { XZ1: 9950, XZ2: 12200, XZ3: 14400, XZ4: 14350 }[x.kod];
        const lx = { XZ1: 7650, XZ2: 10400, XZ3: 13300, XZ4: 15950 }[x.kod];
        q.push(matn(lx, ly, x.kod, 380, `text-anchor="middle" font-weight="700" fill="${RANG.matn}"`));
        if (rejim !== 'havo') q.push(matn(lx, ly + 360 * k, `${x.qisqa} · ${xonaMaydoni(x).toFixed(1)} m²`, 200, `text-anchor="middle" fill="#666"`));
      } else if (x.tur === 'koworking') {
        q.push(matn(rejim === 'havo' ? 2200 : 2975, rejim === 'havo' ? 13800 : 9380, 'KW', 420, `text-anchor="middle" font-weight="700" fill="${RANG.matn}"`));
        if (rejim !== 'havo') q.push(matn(2975, 9380 + 360 * k, `koworking / tadbirlar · ${xonaMaydoni(x).toFixed(1)} m²`, 200, `text-anchor="middle" fill="#666"`));
      } else if (x.kod === 'X12') {
        q.push(matn(2700, 21850, 'CEO', 380, `text-anchor="middle" font-weight="700" fill="${RANG.matn}"`));
        if (rejim !== 'havo') q.push(matn(2700, 22150, `12-xona · ${xonaMaydoni(x).toFixed(1)} m²`, 200, `text-anchor="middle" fill="#555"`));
      } else if (x.kod === 'K1' || x.kod === 'K2') {
        q.push(matn(10600, cy + 120, x.kod, 360, `text-anchor="middle" font-weight="700" fill="${RANG.matn}"`));
        q.push(matn(11100, cy + 90, `Koridor 1500 · ${xonaMaydoni(x).toFixed(1)} m²`, 210, `text-anchor="start" fill="#555"`));
      } else if (x.kod === 'ZL') {
        q.push(matn(4800, 20500, 'ZL', 300, `text-anchor="middle" font-weight="700" fill="${RANG.matn}"`));
      } else if (x.kod === 'ZN1' || x.kod === 'ZN2') {
        const zy = x.kod === 'ZN1' ? 5200 : 19350;
        q.push(matn(x.kod === 'ZN1' ? 1500 : 800, zy, x.kod, 300, `text-anchor="middle" font-weight="700" fill="${RANG.matn}"`));
      } else if (x.tur === 'sanuzel') {
        // 2–5 — ayollar hojatxonasi (kabina va tambur), 6 — ZN1 ga o'tish yo'lagi
        const sy = { 2: 1050, 3: 1050, 4: 2450, 5: 2450, 6: 4950 }[x.kod];
        q.push(matn(cx, sy, x.kod, 240, `text-anchor="middle" fill="#666"`));
        if (rejim !== 'havo') q.push(matn(cx, sy + 260 * k, { 2: 'kabina', 3: 'kabina', 4: 'tambur', 5: 'tambur', 6: "o'tish yo'lagi" }[x.kod], 160, `text-anchor="middle" fill="#666"`));
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
    const kontur = u.kontur || [[u.x1, u.y1], [u.x2, u.y1], [u.x2, u.y2], [u.x1, u.y2]];
    const yol = 'M' + kontur.map(p => p.join(',')).join(' L') + ' Z';
    q.push(`<path d="M${vb.x1},${vb.y1} H${vb.x2} V${vb.y2} H${vb.x1} Z ${yol}" fill="#fff" fill-opacity="0.6" fill-rule="evenodd"/>`);
    q.push(`<path d="${yol}" fill="none" stroke="${RANG.qizil}" stroke-width="${26 * k}"/>`);
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
  zanjirY(R + 800, [0, 7700, 7800, 9300, 9400, 15000, 15100, 16600, 16700, ICHKI.y]);
  q.push('</g>');
  return q.join('');
}

// ---- SR2 dagi qizil o'lcham annotatsiyasi (Beruniy namunasidagi kabi) ----
function annotatsiya(id, k, fam, x) {
  const j = x.j, L = lokal(x), q = [`<g ${fam} fill="${RANG.qizil}" stroke="${RANG.qizil}">`];
  const s = 6 * k, t = 150 * k;
  // o'lcham zanjiri: lokal nuqtalar → chiziq, belgilar va qiymatlar (vertikal zanjirda matn buriladi)
  const zanjir = (nuqtalar, izoh) => {
    const P = nuqtalar.map(([u, v]) => L.G(u, v));
    const vert = Math.abs(P[0].x - P.at(-1).x) < 1;
    q.push(`<line x1="${f(P[0].x)}" y1="${f(P[0].y)}" x2="${f(P.at(-1).x)}" y2="${f(P.at(-1).y)}" stroke-width="${s}"/>`);
    P.forEach(p => q.push(vert ? `<line x1="${f(p.x - 80)}" y1="${f(p.y)}" x2="${f(p.x + 80)}" y2="${f(p.y)}" stroke-width="${s}"/>`
      : `<line x1="${f(p.x)}" y1="${f(p.y - 80)}" x2="${f(p.x)}" y2="${f(p.y + 80)}" stroke-width="${s}"/>`));
    const yoz = (mx, my, matn) => q.push(vert
      ? `<text x="${f(mx - 60)}" y="${f(my)}" font-size="${t}" text-anchor="middle" stroke="none" transform="rotate(-90 ${f(mx - 60)} ${f(my)})">${matn}</text>`
      : `<text x="${f(mx)}" y="${f(my + 230)}" font-size="${t}" text-anchor="middle" stroke="none">${matn}</text>`);
    for (let i = 1; i < P.length; i++) yoz((P[i - 1].x + P[i].x) / 2, (P[i - 1].y + P[i].y) / 2, Math.round(Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y)));
    const a = P[1], b = P.at(-2);
    if (vert) yoz(a.x + 230, (a.y + b.y) / 2, izoh);
    else yoz((a.x + b.x) / 2, a.y + 230, izoh);
  };
  // doska devori bo'ylab: devor – partalar – yo'laklar – devor, 1-qator oldida
  const us = [0];
  let u = j.u0;
  us.push(u);
  j.s.bloklar.forEach((n, bi) => { for (let i = 0; i < n; i++) { u += PARTA.eni; us.push(u); } if (bi < j.s.bloklar.length - 1) { u += j.s.yolak; us.push(u); } });
  us.push(j.W);
  zanjir(us.map(uu => [uu, j.s.doska - 260]), 'parta qadami');
  // doskadan orqaga: doska → 1-parta, keyin parta / o'tish — o'rtadagi yo'lakda
  const vs = [0, j.s.doska];
  for (let r = 0; r < j.s.qatorlar; r++) { const v = j.s.doska + r * j.s.qadam; vs.push(v + PARTA.chuq); if (r < j.s.qatorlar - 1) vs.push(v + j.s.qadam); }
  const ortaYolak = j.u0 + j.s.bloklar.slice(0, Math.floor(j.s.bloklar.length / 2)).reduce((t, n) => t + n * PARTA.eni + j.s.yolak, 0) - j.s.yolak / 2;
  zanjir(vs.map(v => [ortaYolak - 200, v]), 'qator qadami');
  q.push('</g>');
  return q.join('');
}

// ---- havo almashinuvi qatlami ----
export const QURILMALAR = (() => {
  const r = [];
  sinflar().forEach((x, i) => {
    const cx = (x.x1 + x.x2) / 2;
    const d = { kod: `PV-${i + 1}`, xona: x.kod };
    if (x.kod === 'SR4') {
      // derazasiz xona: havo o'ng devor ortidagi oraliq orqali. Doska ham o'ng devorda — qurilma
      // doskadan chetda (yuqori burchakda), toza havo doska oldida beriladi, orqa devor yonida so'riladi;
      // chiqarish kanali o'ng devor bo'ylab shift ichida pastki uchidagi panjaraga boradi.
      const L = lokal(x), P = (u, v) => { const p = L.G(u, v); return [p.x, p.y]; };
      const [d1, d2] = [P(L.W / 3, 1800), P(2 * L.W / 3, 1800)], [s1, s2] = [P(L.W / 3, L.D - 400), P(2 * L.W / 3, L.D - 400)];
      Object.assign(d, { qurilma: { x1: 22700, x2: 23600, y1: 8800, y2: 10100 }, devor: 'ong', taxminiy: true,
        kirish: { x1: ICHKI.x, x2: ICHKI.x + 400, y1: 8300, y2: 8900 }, chiqish: { x1: ICHKI.x, x2: ICHKI.x + 400, y1: 15700, y2: 16300 },
        kanallar: [[[22700, 9500], [d1[0], 9500], d2], [s2, s1, [19900, s1[1]], [19900, 9000], [22700, 9000]], [[23300, 10100], [23300, 16000], [ICHKI.x, 16000]]],
        diffuzor: [d1, d2], sorish: [s1, s2],
        konditsioner: [P(L.W / 4, L.D * 0.55), P(3 * L.W / 4, L.D * 0.55)], co2: [23680, 14800] });
    } else {
      // qurilma deraza devori yonida shift ichida; toza havo doska tomonda beriladi, orqa devor yonida so'riladi
      const L = lokal(x), D = L.D, W = L.W;
      const der = DERAZALAR.find(dd => dd.devor === x.deraza && dd.x1 >= x.x1 && dd.x2 <= x.x2);
      const devY = x.deraza === 'yuqori' ? { y1: -DEVOR.yuqori, y2: 0 } : { y1: ICHKI.y, y2: ICHKI.y + DEVOR.past };
      const oyna = L.U(cx, x.deraza === 'yuqori' ? x.y1 : x.y2).u;   // deraza devorining u koordinatasi
      const w = n => (oyna === 0 ? n : W - n);                        // deraza devoridan n mm
      const P = (u, v) => { const p = L.G(u, v); return [p.x, p.y]; };
      const [qx, qy] = P(w(575), D / 2);
      Object.assign(d, { qurilma: { x1: cx - 650, x2: cx + 650, y1: qy - 325, y2: qy + 325 }, devor: x.deraza,
        kirish: { x1: (x.x1 + der.x1) / 2 - 300, x2: (x.x1 + der.x1) / 2 + 300, ...devY },
        chiqish: { x1: (der.x2 + x.x2) / 2 - 300, x2: (der.x2 + x.x2) / 2 + 300, ...devY },
        kanallar: [[[qx, qy], P(w(575), 1800), P(w(W * 2 / 3), 1800)], [[qx, qy], P(w(575), D - 400), P(w(W * 2 / 3), D - 400)]],
        diffuzor: [P(w(W / 3), 1800), P(w(W * 2 / 3), 1800)], sorish: [P(w(W / 3), D - 400), P(w(W * 2 / 3), D - 400)],
        konditsioner: [P(w(W / 4), D * 0.55), P(w(W * 3 / 4), D * 0.55)],
        co2: P(w(W - 350), D / 2) });
    }
    r.push(d);
  });
  r.push({ kod: 'PV-8', xona: 'KW', qurilma: { x1: 300, x2: 1300, y1: 11600, y2: 12600 }, devor: 'chap',
    kirish: { x1: -400, x2: 0, y1: 10800, y2: 11400 }, chiqish: { x1: -400, x2: 0, y1: 13300, y2: 13900 },
    kanallar: [[[1300, 12100], [3700, 12100]], [[1800, 7900], [3700, 7900], [3700, 16900], [1800, 16900]]],
    diffuzor: [[1800, 7900], [3700, 10000], [3700, 14300], [1800, 16900]], sorish: [[900, 9400], [900, 15500]],
    konditsioner: [[2600, 9200], [2600, 15600]], co2: [5700, 12900] });
  const xz = XONALAR.filter(x => x.tur === 'xizmat');
  r.push({ kod: 'PV-9', xona: 'XZ', qurilma: { x1: 6500, x2: 7500, y1: 8150, y2: 8950 }, devor: 'chap',
    kirish: { x1: -400, x2: 0, y1: 6700, y2: 7100 }, chiqish: { x1: -400, x2: 0, y1: 7600, y2: 8000 },
    kanallar: [[[0, 7300], [5600, 7300], [5600, 8550], [6500, 8550]], [[7500, 8550], [16600, 8550]], ...xz.map(x => [[(x.x1 + x.x2) / 2 - 300, 8550], [(x.x1 + x.x2) / 2 - 300, 10200]])],
    diffuzor: xz.map(x => [(x.x1 + x.x2) / 2 - 300, 10300]), sorish: xz.map(x => [(x.x1 + x.x2) / 2 - 300, 14000]),
    konditsioner: [], co2: null });
  return r;
})();

function havoQatlami(id, k, sinf) {
  const q = [];
  const s = 300;
  const kv = (x, y, r, attrs) => `<rect x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}" ${attrs}/>`;
  QURILMALAR.forEach(d => {
    // kanal
    d.kanallar.forEach(kn => q.push(`<polyline points="${kn.map(p => p.join(',')).join(' ')}" fill="none" stroke="${RANG.kok}" stroke-width="${70 * k}" stroke-linejoin="round" opacity="0.8"/>`));
    // qurilma (shift ortida — punktir)
    q.push(`<rect x="${d.qurilma.x1}" y="${d.qurilma.y1}" width="${d.qurilma.x2 - d.qurilma.x1}" height="${d.qurilma.y2 - d.qurilma.y1}" fill="#fff" stroke="#222" stroke-width="${16 * k}" stroke-dasharray="${60 * k} ${30 * k}"/>`);
    q.push(`<text x="${(d.qurilma.x1 + d.qurilma.x2) / 2}" y="${(d.qurilma.y1 + d.qurilma.y2) / 2 + 80 * k}" font-size="${230 * k}" text-anchor="middle" font-weight="700" fill="#222" font-family="Liberation Sans, Arial">${d.kod}</text>`);
    // fasad panjaralari va strelkalar
    const tash = (r, rang, ichkariga) => {
      q.push(`<rect x="${r.x1}" y="${r.y1}" width="${r.x2 - r.x1}" height="${r.y2 - r.y1}" fill="${rang}"/>`);
      const cx = (r.x1 + r.x2) / 2, cy = (r.y1 + r.y2) / 2;
      let a, b;
      if (d.devor === 'chap') { a = [cx - 1100, cy]; b = [cx + 700, cy]; }
      else if (d.devor === 'ong') { a = [cx + 1100, cy]; b = [cx - 700, cy]; }
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
    if (!d.co2) return;
    const [cx, cy] = d.co2;
    q.push(`<circle cx="${cx}" cy="${cy}" r="${210 * k}" fill="#fff" stroke="#2e7d32" stroke-width="${14 * k}"/>`,
      `<text x="${cx}" y="${cy + 55 * k}" font-size="${140 * k}" text-anchor="middle" fill="#2e7d32" font-family="Liberation Sans, Arial" font-weight="700">CO₂</text>`);
  });
  // xonadagi havo oqimi strelkalari (doskadan orqaga)
  sinf.forEach(x => {
    const L = lokal(x);
    // 4-xonada strelkalar L shaklining keng qismida (tor uchlari 4.5 m chuqur)
    const us = x.kod === 'SR4' ? [L.W * 0.3, L.W * 0.7] : [L.W * 0.12, L.W * 0.88];
    us.forEach(u => {
      const [v1, v2] = [2200, L.D - 700];
      const a = L.G(u, v1), b = L.G(u, v2);
      q.push(`<path d="M${f(a.x)},${f(a.y)} L${f(b.x)},${f(b.y)}" stroke="#5b8fd6" stroke-width="${30 * k}" stroke-dasharray="${160 * k} ${90 * k}" fill="none" marker-end="url(#${id}ah)"/>`);
    });
  });
  // sanuzel chiqarish ventilyatsiyasi
  q.push(`<circle cx="3725" cy="3350" r="${340 * k}" fill="#fff" stroke="${RANG.havoQ}" stroke-width="${18 * k}"/>`,
    `<text x="3725" y="${3350 + 70 * k}" font-size="${190 * k}" text-anchor="middle" fill="${RANG.havoQ}" font-family="Liberation Sans, Arial" font-weight="700">V-1</text>`);
  return q.join('');
}

export { son };
