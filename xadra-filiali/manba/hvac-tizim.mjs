// 2-qavat: tanlangan HVAC sxemasi (buyurtmachi, 12.10.2026) — tashqi havo 2 ta Welkin rekuperatori (2 500–3 000 m³/soat)
// orqali, sovutish har xonadagi alohida split konditsioner bilan. Hisob (xona bo'yicha havo, split tanlovi, kanal o'lchamlari),
// chizma qatlami (reja-svg, 'havo' rejimi), A3 varaq paneli va A4 hisobot.
//
// Xonalarning issiqlik yuklamasi (odamlar, yoritish, uskuna, devor/oyna/tom) va me'yoriy tashqi havo — hvac.mjs dan.
import { LOYIHA, H, XONALAR, XIZMAT_JIHOZ, KW_TADBIR, DERAZALAR, lokal, sinflar } from './model.mjs';
import { xonaMaydoni } from './tekshiruv.mjs';
import { hvacHisob, F } from './hvac.mjs';

// ---------- uskunalar ----------
// Rekuperator: buyurtmachi — Welkin, 2 500–3 000 m³/soat. Samaradorlik va bosim — farazlar (pasportdan tasdiqlanadi).
export const REK = { brend: 'Welkin', nominal: [2500, 3000], tanlov: 3000, etaYoz: 0.55, etaQish: 0.70, esp: 300 };
// Split: odatiy nominal sovutish quvvati (tashqi 35 °C); en — ichki blok eni (rejada), mm. Aniq qiymat — tanlangan model pasportidan.
export const SPLIT = [
  { btu: 9000, kw: 2.6, en: 800 }, { btu: 12000, kw: 3.5, en: 850 }, { btu: 18000, kw: 5.3, en: 1000 }, { btu: 24000, kw: 7.0, en: 1100 },
];
export const KASSETA = [{ btu: 36000, kw: 10.5 }, { btu: 48000, kw: 14.0 }];
export const ISSIQ = 0.87;           // 42–43 °C li kunlarda split quvvati (nominalga nisbatan, umumiy holat)
export const KISHI_SINF = 24;        // m³/soat har bir kishiga — sinflar uchun loyiha qiymati (me'yoriy ~22, CO₂ ≈ 1 150–1 200 ppm)
export const EER = 3.2;              // sovutishda o'rtacha energiya samaradorligi (elektr quvvatini baholash uchun)
const k10 = v => Math.ceil(v / 10) * 10;
const btuNom = b => `${b / 1000}k`;

// ---------- joylashuv (reja koordinatalari, mm) ----------
// R1 — K1 koridori shiftida (g'arbiy uchida): SR1, SR2, SR3, XZ3, XZ4. R2 — K2 shiftida: SR4, SR5, SR6, SR7, XZ1, XZ2.
// Tashqi havo olish va chiqarish — koworkingning chap (fasad) devoridagi kar qismlarda: chiqarish panjaralari chetlarda,
// olish panjaralari o'rtada (R1 va R2 olishi bir-biridan ~2 m, chiqarishlardan ~4 m uzoq). Kanallar koworking shifti ostidan.
export const GURUH = [
  { kod: 'R1', koridor: 'K1', xonalar: ['SR1', 'SR2', 'SR3', 'XZ3', 'XZ4'], joy: { x1: 6350, x2: 7850, y1: 7950, y2: 9150 }, sa: 8250, ra: 8850,
    oa: [[0, 11300], [2400, 11300], [2400, 8850], [6350, 8850]], ea: [[6350, 8250], [5600, 8250], [5600, 7300], [0, 7300]],
    oaP: { y1: 11000, y2: 11600 }, eaP: { y1: 7000, y2: 7600 } },
  { kod: 'R2', koridor: 'K2', xonalar: ['SR4', 'SR5', 'SR6', 'SR7', 'XZ1', 'XZ2'], joy: { x1: 6350, x2: 7850, y1: 15250, y2: 16450 }, sa: 15550, ra: 16150,
    oa: [[0, 13300], [2400, 13300], [2400, 15550], [6350, 15550]], ea: [[6350, 16150], [5600, 16150], [5600, 17500], [0, 17500]],
    oaP: { y1: 13000, y2: 13600 }, eaP: { y1: 17200, y2: 17800 } },
];
const KOR_OXIRI = 19000;    // magistral kanallar koridor oxirigacha (logotip devori 19300 da)

// xona terminallari: diffuzor (toza havo) va so'rish panjarasi; sinflarda — doska oldida beriladi, orqa devor yonida so'riladi
function terminallar(kod) {
  const s = sinflar().find(x => x.kod === kod);
  if (s) {
    const L = lokal(s), W = L.W, D = L.D, P = (u, v) => { const p = L.G(u, v); return [p.x, p.y]; };
    return { sa: [P(W / 3, 1800), P(2 * W / 3, 1800)], ra: [P(W / 3, D - 400), P(2 * W / 3, D - 400)] };
  }
  const x = XONALAR.find(r => r.kod === kod), cx = (x.x1 + x.x2) / 2;
  // XZ1, XZ2 — eshik K2 tomonda: toza havo uzoq (shimoliy) qismda; XZ3, XZ4 — eshik K1 tomonda: toza havo janubiy qismda
  return ['XZ1', 'XZ2'].includes(kod)
    ? { sa: [[cx + 150, 10400]], ra: [[cx - 150, 14100]] }
    : { sa: [[cx + 150, 13700]], ra: [[cx - 150, 10300]] };
}

// tarmoq: magistraldan terminallargacha; koridordan tashqaridagi xonalarga (x > KOR_OXIRI) burilib boradi
function tarmoq(nuqtalar, magY, xKir, aylanmaY) {
  const yo = nuqtalar.slice().sort((a, b) => Math.abs(a[1] - magY) - Math.abs(b[1] - magY));
  const [yaqin, uzoq] = [yo[0], yo[yo.length - 1]];
  const x = yaqin[0];
  if (x <= KOR_OXIRI) return [[x, magY], [x, uzoq[1]]];
  const y = aylanmaY ?? yaqin[1];
  return [[xKir, magY], [xKir, y], [x, y], [x, uzoq[1]]];
}

// split ichki bloklari: sinflarda tashqi (deraza) devorda, deraza ikki yonida; SR4 — o'ng devorda; xizmat xonalarida — ko'rsatilgan devorda
function splitJoy(kod, n, en) {
  const x = XONALAR.find(r => r.kod === kod);
  if (x.deraza) {
    const der = DERAZALAR.find(d => d.devor === x.deraza && d.x1 >= x.x1 && d.x2 <= x.x2);
    const yuq = x.deraza === 'yuqori', y1 = yuq ? 0 : x.y2 - 250, y2 = yuq ? 250 : x.y2;
    const ty1 = yuq ? -700 : x.y2 + 350, ty2 = ty1 + 350;
    return [(x.x1 + der.x1) / 2, (der.x2 + x.x2) / 2].slice(0, n).map(cx => ({
      x1: cx - en / 2, x2: cx + en / 2, y1, y2, tb: { x1: cx - 450, x2: cx + 450, y1: ty1, y2: ty2 } }));
  }
  if (kod === 'SR4') return [9200, 15200].slice(0, n).map(cy => ({ x1: x.x2 - 250, x2: x.x2, y1: cy - en / 2, y2: cy + en / 2,
    tb: { x1: x.x2 + 450, x2: x.x2 + 800, y1: cy - 450, y2: cy + 450, taxminiy: true } }));
  const v = { XZ1: ['x1', 10300], XZ2: ['x2', 10200], XZ3: ['y2', 13525], XZ4: ['y2', 16525] }[kod];
  if (v[0] === 'x1') return [{ x1: x.x1, x2: x.x1 + 250, y1: v[1] - en / 2, y2: v[1] + en / 2 }];
  if (v[0] === 'x2') return [{ x1: x.x2 - 250, x2: x.x2, y1: v[1] - en / 2, y2: v[1] + en / 2 }];
  return [{ x1: v[1] - en / 2, x2: v[1] + en / 2, y1: x.y2 - 250, y2: x.y2 }];
}

// kanal o'lchami: to'rtburchak kesimlar ichidan havo tezligi chegarasiga mos eng kichigi
const KESIMLAR = [[200, 150], [250, 150], [250, 200], [300, 200], [400, 200], [400, 250], [500, 250], [500, 300], [600, 300], [600, 350], [700, 400]];
export const kanal = (Q, vMax) => {
  const [a, b] = KESIMLAR.find(([a, b]) => Q / 3600 / (a * b / 1e6) <= vMax) || KESIMLAR.at(-1);
  return { a, b, v: Q / 3600 / (a * b / 1e6) };
};

export function tizimHisob() {
  const { xonalar } = hvacHisob();
  const xona = xonalar.map(r => {
    const g = GURUH.find(g => g.xonalar.includes(r.kod));
    const oa = k10(Math.max(r.oaMin, r.tur === 'sinf' ? KISHI_SINF * r.odam : 0));
    const oaQoldiq = oa * F.kwPerKm3 * (1 - REK.etaYoz);
    const q = [r.ichki + r.env[0] + oaQoldiq, r.ichki + r.env[1] + oaQoldiq];
    const n = r.tur === 'sinf' ? 2 : 1;
    const tanla = qq => SPLIT.find(s => s.kw * n >= qq) || SPLIT.at(-1);
    const split = tanla(q[1] / ISSIQ), splitMin = tanla(q[0] / ISSIQ);
    const t = terminallar(r.kod);
    const kirish = g.kod === 'R2' && r.kod !== 'SR4' && r.kod.startsWith('SR') ? 'past' : 'yuqori';
    return {
      ...r, R: g.kod, oa, oaMeyor: r.oaMin, co2: F.co2Tashqi + r.odam * F.co2Kishi / oa * 1e6, oaQoldiq, q, n, split, splitMin,
      qNout: q[1] + r.noutbuk, noutbukOk: n * split.kw * ISSIQ >= q[1] + r.noutbuk,
      kanal: kanal(oa, 3.0), terminal: t,
      saYol: tarmoq(t.sa, g.sa, KOR_OXIRI, null),
      raYol: tarmoq(t.ra, g.ra, KOR_OXIRI - 300, kirish === 'yuqori' ? 6700 : 17700),
      splitlar: splitJoy(r.kod, n, split.en),
    };
  });
  const guruh = GURUH.map(g => {
    const xs = xona.filter(x => x.R === g.kod);
    const Q = xs.reduce((t, x) => t + x.oa, 0), Qmin = xs.reduce((t, x) => t + x.oaMeyor, 0);
    return { ...g, Q, Qmin, zaxira: REK.tanlov - Q, magistral: kanal(Q, 4.5), tashqi: kanal(Q, 4.0) };
  });
  // 11 xonadan tashqari: koworking (tadbir rejimi) va CEO — split tanlovi; tashqi havosi R1/R2 ga kirmaydi
  const kwX = XONALAR.find(x => x.kod === 'KW'), ceoX = XONALAR.find(x => x.kod === 'X12');
  const kwA = xonaMaydoni(kwX), kwOdam = KW_TADBIR.stullar.length + 2;
  const kwOa = kwOdam * 20;   // KMK: ≤ 3 soatlik tadbirlar — 20 m³/soat·kishi
  const kwIchki = kwOdam * (F.odamS + F.odamL) / 1000 + kwA * F.yoritish / 1000 + 0.3;
  const kwQ = [kwIchki + 0.6 + kwOa * F.kwPerKm3 * (1 - REK.etaYoz), kwIchki + 3.4 + F.tom * kwA + kwOa * F.kwPerKm3 * (1 - REK.etaYoz)];
  const kwK = KASSETA.find(s => 2 * s.kw >= kwQ[1] / ISSIQ) || KASSETA.at(-1);
  const ceoA = xonaMaydoni(ceoX), ceoOdam = XIZMAT_JIHOZ.find(z => z.kod === 'X12').stullar.length;
  const ceoQ = [ceoOdam * (F.odamS + F.odamL) / 1000 + ceoA * F.yoritish / 1000 + F.ishJoyi + 0.4,
    ceoOdam * (F.odamS + F.odamL) / 1000 + ceoA * F.yoritish / 1000 + F.ishJoyi + 2.6 + F.tom * ceoA];
  const ceoS = SPLIT.find(s => s.kw >= ceoQ[1] / ISSIQ) || SPLIT.at(-1);
  const qoshimcha = [
    { kod: 'KW', nomi: 'Koworking (tadbirda)', odam: kwOdam, A: kwA, oa: kwOa, q: kwQ, n: 2, split: kwK, kasseta: true,
      izoh: `tashqi havo ~${kwOa} m³/soat — R1/R2 ga kirmaydi; alohida rekuperator bilan hisoblangan` },
    { kod: 'X12', nomi: 'CEO xonasi', odam: ceoOdam, A: ceoA, oa: null, q: ceoQ, n: 1, split: ceoS,
      izoh: 'derazali (2 devor) — tashqi havo derazadan; mexanik ventilyatsiya kirmagan' },
  ];
  // jamlar
  const barcha = [...xona.map(x => ({ n: x.n, kw: x.split.kw, btu: x.split.btu })), ...qoshimcha.map(x => ({ n: x.n, kw: x.split.kw, btu: x.split.btu }))];
  const soni = {};
  barcha.forEach(b => { soni[b.btu] = (soni[b.btu] || 0) + b.n; });
  const nominal11 = xona.reduce((t, x) => t + x.n * x.split.kw, 0);
  const nominalJami = barcha.reduce((t, b) => t + b.n * b.kw, 0);
  const Qjami = xona.reduce((t, x) => t + x.oa, 0);
  const qishTashqi = Qjami * F.rho * F.c * (F.tIchkiQish - F.tQish) / 3600;
  const tKirishQish = F.tQish + REK.etaQish * (F.tIchkiQish - F.tQish);
  const tKirishYoz = F.tTashqi - REK.etaYoz * (F.tTashqi - F.tIchki);
  return {
    xona, guruh, qoshimcha, soni, nominal11, nominalJami, Qjami,
    elektr11: nominal11 / EER, elektrJami: nominalJami / EER,
    qishTashqi, qishQoldiq: qishTashqi * (1 - REK.etaQish), tKirishQish, tKirishYoz,
    isitgich: Qjami * F.rho * F.c * (18 - tKirishQish) / 3600,
  };
}

// ---------- chizma qatlami (reja-svg, 'havo' rejimi) ----------
export const TZ_RANG = { sa: '#1f6fd1', ra: '#d1452f', oa: '#1b9e8a', ea: '#8d6e63', split: '#5f6b78' };
export function tizimQatlam(id, k = 1) {
  const T = tizimHisob(), q = [];
  const pl = (pts, rang, w, dash = '') => `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="#fff" stroke-width="${w + 70 * k}" stroke-linejoin="round"/>` +
    `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${rang}" stroke-width="${w}" stroke-linejoin="round" ${dash}/>`;
  const t = (x, y, s, size, a = '') => `<text x="${x}" y="${y}" font-size="${size * k}" font-family="Liberation Sans, Arial" paint-order="stroke" stroke="#fff" stroke-width="${size * k * 0.3}" stroke-linejoin="round" ${a}>${s}</text>`;
  q.push(`<defs><marker id="${id}tz" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker></defs>`);
  // tashqi havo va chiqarish kanallari (fasad — rekuperator)
  T.guruh.forEach(g => { q.push(pl(g.oa, TZ_RANG.oa, 170 * k), pl(g.ea, TZ_RANG.ea, 170 * k)); });
  // magistrallar va xona tarmoqlari
  T.guruh.forEach(g => {
    q.push(pl([[g.joy.x2, g.ra], [KOR_OXIRI, g.ra]], TZ_RANG.ra, 170 * k), pl([[g.joy.x2, g.sa], [KOR_OXIRI, g.sa]], TZ_RANG.sa, 170 * k));
  });
  T.xona.forEach(x => { q.push(pl(x.raYol, TZ_RANG.ra, 95 * k), pl(x.saYol, TZ_RANG.sa, 95 * k)); });
  // terminallar
  const s = 230;
  T.xona.forEach(x => {
    x.terminal.sa.forEach(([cx, cy]) => q.push(`<rect x="${cx - s}" y="${cy - s}" width="${2 * s}" height="${2 * s}" fill="#dbe9fb" stroke="${TZ_RANG.sa}" stroke-width="${16 * k}"/><path d="M${cx - s},${cy - s} L${cx + s},${cy + s} M${cx + s},${cy - s} L${cx - s},${cy + s}" stroke="${TZ_RANG.sa}" stroke-width="${10 * k}"/>`));
    x.terminal.ra.forEach(([cx, cy]) => q.push(`<rect x="${cx - s}" y="${cy - s}" width="${2 * s}" height="${2 * s}" fill="#fbe1dc" stroke="${TZ_RANG.ra}" stroke-width="${16 * k}"/><path d="M${cx - s},${cy} L${cx + s},${cy} M${cx},${cy - s} L${cx},${cy + s}" stroke="${TZ_RANG.ra}" stroke-width="${10 * k}"/>`));
    // havo sarfi yozuvi — birinchi diffuzor yonida
    const [dx, dy] = x.terminal.sa[x.terminal.sa.length > 1 ? 1 : 0];
    q.push(t(dx + 320, dy + 80, `${x.oa} m³/soat`, 190, `fill="${TZ_RANG.sa}" font-weight="700"`));
  });
  // split ichki va tashqi bloklari
  T.xona.forEach(x => {
    x.splitlar.forEach(b => {
      q.push(`<rect x="${b.x1}" y="${b.y1}" width="${b.x2 - b.x1}" height="${b.y2 - b.y1}" rx="40" fill="#c9d1da" stroke="${TZ_RANG.split}" stroke-width="${22 * k}"/>`);
      if (b.tb) q.push(`<rect x="${b.tb.x1}" y="${b.tb.y1}" width="${b.tb.x2 - b.tb.x1}" height="${b.tb.y2 - b.tb.y1}" fill="#fff" stroke="${TZ_RANG.split}" stroke-width="${12 * k}" ${b.tb.taxminiy ? `stroke-dasharray="${40 * k} ${25 * k}"` : ''}/>`);
    });
    const b = x.splitlar[0], gor = b.x2 - b.x1 > b.y2 - b.y1;
    const lx = gor ? (x.splitlar.length > 1 ? (x.splitlar[0].x2 + x.splitlar[1].x1) / 2 : (b.x1 + b.x2) / 2) : b.x1 - 120;
    const ly = gor ? (b.y1 < 1000 ? b.y2 + 330 : b.y1 - 160) : (x.splitlar.length > 1 ? (x.splitlar[0].y2 + x.splitlar[1].y1) / 2 : (b.y1 + b.y2) / 2);
    q.push(t(lx, ly, `${x.n > 1 ? x.n + ' × ' : ''}${btuNom(x.split.btu)}`, 210, `text-anchor="${gor ? 'middle' : 'end'}" fill="#333" font-weight="700"`));
  });
  // rekuperatorlar va fasad panjaralari
  T.guruh.forEach(g => {
    const j = g.joy;
    q.push(`<rect x="${j.x1}" y="${j.y1}" width="${j.x2 - j.x1}" height="${j.y2 - j.y1}" fill="#fff" stroke="#222" stroke-width="${18 * k}" stroke-dasharray="${60 * k} ${30 * k}"/>`,
      `<path d="M${j.x1},${j.y1} L${j.x2},${j.y2} M${j.x2},${j.y1} L${j.x1},${j.y2}" stroke="#999" stroke-width="${10 * k}"/>`,
      t((j.x1 + j.x2) / 2, (j.y1 + j.y2) / 2 + 90, g.kod, 300, 'text-anchor="middle" font-weight="700" fill="#222"'),
      t(j.x2 + 150, g.koridor === 'K1' ? j.y1 - 120 : j.y2 + 300, `${REK.brend} · ${g.Q} m³/soat`, 200, 'fill="#222" font-weight="700"'));
    const panjara = (p, rang, kirish, yoz) => {
      q.push(`<rect x="-400" y="${p.y1}" width="400" height="${p.y2 - p.y1}" fill="${rang}"/>`);
      const cy = (p.y1 + p.y2) / 2;
      const [a, b] = kirish ? [-1500, 200] : [200, -1500];
      q.push(`<line x1="${a}" y1="${cy}" x2="${b}" y2="${cy}" stroke="${rang}" stroke-width="${45 * k}" marker-end="url(#${id}tz)"/>`,
        t(450, cy + (kirish ? -280 : 420), yoz, 170, `fill="${rang}" font-weight="700"`));
    };
    panjara(g.oaP, TZ_RANG.oa, true, `${g.kod} · tashqi havo`);
    panjara(g.eaP, TZ_RANG.ea, false, `${g.kod} · chiqarish`);
  });
  q.push(t(23100, 19000, '', 10));
  return q.join('');
}

// ---------- A3 varaq paneli ----------
const n0 = v => Math.round(v).toLocaleString('en-US').replace(/,/g, ' ');
const n1 = v => v.toFixed(1);
export function tizimPanel() {
  const T = tizimHisob();
  const qator = x => `<tr><td>${x.kod}</td><td class="r">${x.odam}</td><td class="r">${x.oa}</td><td>${x.R}</td><td class="r">${n0(x.co2)}</td><td class="r">${n1(x.q[0])}–${n1(x.q[1])}</td><td><b>${x.n > 1 ? x.n + ' × ' : ''}${btuNom(x.split.btu)}</b></td></tr>`;
  const qo = x => `<tr><td>${x.kod}</td><td class="r">${x.odam}</td><td class="r">${x.oa ?? '—'}</td><td>—</td><td></td><td class="r">${n1(x.q[0])}–${n1(x.q[1])}</td><td><b>${x.n} × ${btuNom(x.split.btu)}${x.kasseta ? ' kas.' : ''}</b></td></tr>`;
  return `<div><h3>VENTILYATSIYA — 2 TA REKUPERATOR (${REK.brend.toUpperCase()})</h3><table>
    <tr><th>Qurilma</th><th>Xonalar</th><th class="r">Loyiha, m³/soat</th><th class="r">Me'yoriy min</th><th class="r">Kanal</th></tr>
    ${T.guruh.map(g => `<tr><td><b>${g.kod}</b> · ${g.koridor}</td><td>${g.xonalar.join(', ')}</td><td class="r">${n0(g.Q)}</td><td class="r">${n0(g.Qmin)}</td><td class="r">${g.magistral.a}×${g.magistral.b}</td></tr>`).join('')}
    <tr class="jami"><td>Jami</td><td></td><td class="r">${n0(T.Qjami)}</td><td class="r">${n0(T.guruh.reduce((t, g) => t + g.Qmin, 0))}</td><td></td></tr>
  </table></div>
  <div><h3>XONALAR: TASHQI HAVO VA SPLIT</h3><table>
    <tr><th>Xona</th><th class="r">Odam</th><th class="r">Havo, m³/soat</th><th>Rek.</th><th class="r">CO₂, ppm</th><th class="r">Yuk, kW</th><th>Split</th></tr>
    ${T.xona.map(qator).join('')}${T.qoshimcha.map(qo).join('')}
  </table></div>
  <div><h3>HISOB ASOSI</h3><p class="izoh">
    <b>Tashqi havo:</b> sinflarda ${KISHI_SINF} m³/soat·kishi (me'yoriy ~22), derazasiz xizmat xonalarida 60 m³/soat·kishi (KMK). Har rekuperator ${REK.nominal[0]}–${REK.nominal[1]} m³/soat: R2 ga ${n0(T.guruh[1].Q)} m³/soat kerak — <b>${REK.nominal[1]} m³/soatlik model</b> (kanal qarshiligi ~${REK.esp} Pa da).<br>
    <b>Split:</b> xona yuklamasi (odamlar 115 W/kishi, yoritish, panel/kompyuter, devor-oyna-tom oralig'i) + rekuperatordan keyingi tashqi havo qoldig'i (FIK ${Math.round(REK.etaYoz * 100)}%); tanlov — 42–43 °C da (quvvat ~${ISSIQ * 100}%) yuqori chegarani qoplaydi. Sinflarda 2 tadan blok — havo bir tekis taqsimlanadi.<br>
    Toza havo doska oldida beriladi, orqa devor yonida so'riladi. Kanallar koridorlar osma shifti ichida (~2.8 m), koworkingda — shift ostida (fasadgacha). Tashqi bloklar fasadda; SR4 va xizmat xonalarinikini — tomda yoki o'ng devor ortidagi oraliqda (aniqlanadi). Kanallar yo'nalishi — taklif, buyurtmachi o'zgartirishi mumkin.
  </p></div>`;
}

// ---------- A4 hisobot ----------
const CSS = `
@page { size: A4; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
body { font-family: 'Liberation Sans', Arial, sans-serif; color: #222; font-size: 8.4pt; line-height: 1.38; }
.bet { width: 210mm; height: 297mm; padding: 11mm 11mm 12mm; position: relative; page-break-after: always; overflow: hidden; }
.bar { position: absolute; top: 0; left: 0; right: 0; height: 4mm; background: #1F3657; }
footer { position: absolute; bottom: 5mm; left: 11mm; right: 11mm; display: flex; justify-content: space-between; font-size: 6.6pt; color: #888; }
h1 { font-size: 15pt; color: #1F3657; margin: 2mm 0 1mm; }
h2 { font-size: 11pt; color: #1F3657; margin: 4mm 0 1.6mm; border-bottom: .3mm solid #1F3657; padding-bottom: .6mm; }
h3 { font-size: 9pt; margin: 2.5mm 0 1mm; }
p { margin-bottom: 1.4mm; } ul, ol { margin: 0 0 1.6mm 4.5mm; } li { margin-bottom: .6mm; }
.sub { color: #555; font-size: 8pt; }
table { width: 100%; border-collapse: collapse; font-size: 7.3pt; margin: 1mm 0 2mm; }
th { background: #1F3657; color: #fff; font-weight: 700; padding: .9mm 1mm; text-align: left; vertical-align: bottom; }
td { padding: .7mm 1mm; border-bottom: .2mm solid #ddd; vertical-align: top; }
td.r, th.r { text-align: right; white-space: nowrap; }
tr.jami td { font-weight: 700; background: #eef1f6; }
.f { color: #8a5a00; } .og { color: #b3261e; font-weight: 700; } .ok { color: #1d7a35; font-weight: 700; }
.xulosa { border-left: 1.4mm solid #1F3657; background: #f4f6fa; padding: 1.6mm 2.5mm; margin: 1.5mm 0 2.2mm; }
.kichik { font-size: 7pt; color: #555; }
.rasm { border: .3mm solid #ddd; border-radius: 1mm; margin: 1mm 0 2mm; }
`;
export function tizimHtml(rejaSvgHtml = '') {
  const T = tizimHisob();
  let bet = 0;
  const sahifa = ichki => `<section class="bet"><div class="bar"></div>${ichki}<footer><span>${LOYIHA.brend} · ${LOYIHA.filial} · 2-qavat · HVAC hisobi (rekuperator + split) · ${LOYIHA.versiya} · ${LOYIHA.sanaISO}</span><span>${++bet}</span></footer></section>`;
  const [R1, R2] = T.guruh;
  const sinf = T.xona.filter(x => x.tur === 'sinf');
  const xq = x => `<tr><td><b>${x.kod}</b></td><td class="r">${x.odam}</td><td class="r">${x.oa}</td><td class="r">${n0(x.co2)}</td><td class="r">${n1(x.odamS + x.odamL)}</td><td class="r">${n1(x.yorit + x.jihoz)}</td><td class="r f">${n1(x.env[0])}–${n1(x.env[1])}</td><td class="r">${n1(x.oaQoldiq)}</td><td class="r"><b>${n1(x.q[0])}–${n1(x.q[1])}</b></td><td style="white-space:nowrap"><b>${x.n > 1 ? x.n + ' × ' : ''}${btuNom(x.split.btu)}</b> <span class="kichik">${n1(x.n * x.split.kw)} kW</span></td><td class="kichik">${x.splitMin.btu !== x.split.btu ? `${x.n > 1 ? x.n + ' × ' : ''}${btuNom(x.splitMin.btu)}` : '—'}</td><td class="kichik">${x.noutbuk ? (x.noutbukOk ? '<span class="ok">yetadi</span>' : `<span class="og">+${n1(x.qNout - x.n * x.split.kw * ISSIQ)} kW</span>`) : '—'}</td></tr>`;
  const qo = x => `<tr><td><b>${x.kod}</b></td><td class="r">${x.odam}</td><td class="r">${x.oa ?? '—'}</td><td></td><td colspan="4" class="kichik">${x.izoh}</td><td class="r"><b>${n1(x.q[0])}–${n1(x.q[1])}</b></td><td style="white-space:nowrap"><b>${x.n} × ${btuNom(x.split.btu)}${x.kasseta ? ' kas.' : ''}</b> <span class="kichik">${n1(x.n * x.split.kw)} kW</span></td><td></td><td></td></tr>`;
  const sonlar = Object.entries(T.soni).sort((a, b) => +a[0] - +b[0]).map(([b, n]) => `${n} × ${btuNom(+b)}`).join(', ');
  const IKKI = `
    <h2>2. Xonalar bo'yicha: tashqi havo va split konditsioner tanlovi</h2>
    <table style="font-size:6.9pt"><tr><th>Xona</th><th class="r">Odam</th><th class="r">Havo, m³/soat</th><th class="r">CO₂, ppm</th><th class="r">Odamlar</th><th class="r">Yoritish, uskuna</th><th class="r">Devor, oyna, tom</th><th class="r">Tashqi havo qoldig'i</th><th class="r">Yuk, kW</th><th>Tanlov (BTU/soat)</th><th>Kichikroq¹</th><th>Noutbuk²</th></tr>
      ${T.xona.map(xq).join('')}
      <tr class="jami"><td colspan="8">11 xona</td><td class="r">${n1(T.xona.reduce((t, x) => t + x.q[0], 0))}–${n1(T.xona.reduce((t, x) => t + x.q[1], 0))}</td><td colspan="3">${n1(T.nominal11)} kW nominal</td></tr>
      ${T.qoshimcha.map(qo).join('')}
    </table>
    <p class="kichik"><b>Tanlov qoidasi:</b> yuk — xonaning o'z issiqligi (odamlar ${F.odamS}+${F.odamL} W, yoritish ${F.yoritish} W/m², interaktiv panel ${F.panel} kW, kompyuterli ish joyi ${F.ishJoyi} kW, devor-oyna-tom oralig'i) va rekuperatordan keyin qolgan tashqi havo issiqligi (yozda ${F.tTashqi} °C → rekuperatordan keyin ~${n1(T.tKirishYoz)} °C). Split nominali (35 °C) × ${ISSIQ} (42–43 °C) ≥ yukning yuqori chegarasi. Sinflarda 2 ta bir xil blok. Standart qator: ${SPLIT.map(s => `${btuNom(s.btu)} ≈ ${s.kw} kW`).join(', ')} (aniq — model pasportidan). Xona tarmoqlari (≤ 3 m/s): ${Object.entries(T.xona.reduce((m, x) => { const k = x.kanal.a + '×' + x.kanal.b; (m[k] ||= []).push(x.kod); return m; }, {})).map(([k, v]) => `${v.join(', ')} — ${k}`).join('; ')} mm; sinfda 2 diffuzor va 2 so'rish panjarasi (har biri ~${T.xona[0].oa / 2} m³/soat).
      ¹ Derazalar shimolda yoki soyada va xona ustida 3-qavat bo'lsa (yukning pastki chegarasi) — kichikroq blok yetadi. ² Har o'quvchi noutbuk bilan (+50 W): sinflarda tanlangan blok 42–43 °C da ham yetadimi.</p>
    <div class="xulosa"><b>Natija:</b> 11 xonaga ${T.xona.reduce((t, x) => t + x.n, 0)} ta ichki blok — ${Object.entries(T.xona.reduce((m, x) => ({ ...m, [x.split.btu]: (m[x.split.btu] || 0) + x.n }), {})).sort((a, b) => +a[0] - +b[0]).map(([b, n]) => `${n} × ${btuNom(+b)}`).join(', ')} (jami ${n1(T.nominal11)} kW nominal). Koworking va CEO bilan: ${sonlar} (${n1(T.nominalJami)} kW). Har sinfda 2 × ${btuNom(sinf[0].split.btu)}: 25 kishi + quyosh + tom eng og'ir holatda ham, noutbuklar bilan ham yetadi; derazalar shimolda bo'lsa 2 × ${btuNom(sinf[0].splitMin.btu)} yetarli.</div>`;
  const b1 = sahifa(`
    <div class="sub">${LOYIHA.brend} · ${LOYIHA.filial} · ${LOYIHA.manzil}</div>
    <h1>2-qavat: ventilyatsiya (2 ta rekuperator) va konditsionerlash (split) — hisob</h1>
    <div class="sub">Buyurtmachi qarori (12.10): tashqi havo — 2 ta ${REK.brend} rekuperatori (${REK.nominal[0]}–${REK.nominal[1]} m³/soat); har xonaga alohida split konditsioner. Oldingi tahlil (2 ta 96-ka + 30% toza havo): Xadra_2-qavat_HVAC_tahlil_${LOYIHA.versiya}.pdf.</div>
    ${rejaSvgHtml ? `<div class="rasm">${rejaSvgHtml}</div>` : ''}
    <h2>1. Rekuperatorlar</h2>
    <table><tr><th>Qurilma</th><th>Joyi</th><th>Xonalar</th><th class="r">Loyiha sarfi</th><th class="r">Me'yoriy min</th><th class="r">3 000 lik bilan zaxira</th><th class="r">Magistral</th><th class="r">Fasadgacha</th></tr>
      ${T.guruh.map(g => `<tr><td><b>${g.kod}</b></td><td>${g.koridor} koridori shiftida (g'arbiy uchi)</td><td>${g.xonalar.join(', ')}</td><td class="r">${n0(g.Q)} m³/soat</td><td class="r">${n0(g.Qmin)}</td><td class="r">${n0(g.zaxira)} (${n0(g.zaxira / REK.tanlov * 100)}%)</td><td class="r">${g.magistral.a}×${g.magistral.b} · ${n1(g.magistral.v)} m/s</td><td class="r">${g.tashqi.a}×${g.tashqi.b} · ${n1(g.tashqi.v)} m/s</td></tr>`).join('')}
      <tr class="jami"><td colspan="3">Jami 11 xona</td><td class="r">${n0(T.Qjami)}</td><td class="r">${n0(T.guruh.reduce((t, g) => t + g.Qmin, 0))}</td><td colspan="3"></td></tr>
    </table>
    <div class="xulosa"><b>Xulosa.</b> 2 ta ${REK.brend} 11 xonaning tashqi havosini ta'minlaydi, agar har biri <b>~${REK.esp} Pa kanal qarshiligida ham ≥ ${n0(R2.Q)} m³/soat</b> bersa — shuning uchun <b>${REK.nominal[1]} m³/soatlik model</b> kerak. ${REK.nominal[0]} m³/soatlik model R2 ning me'yoriy minimumiga (${n0(R2.Qmin)} m³/soat) ham yetmaydi. Pasportdan: ventilyator egri chizig'i (sarf — bosim), rekuperator FIK (yoz/qish), muzlashdan himoya, filtrlar (kamida G4 + F7), shovqin, elektr quvvati, o'lchamlari (koridor shiftiga sig'ishi: eni ≤ ~1.3 m, balandligi ≤ ~0.5 m).</div>
    <p class="kichik">Loyiha sarfi: sinflarda ${KISHI_SINF} m³/soat·kishi (me'yoriy minimum ~22 — KMK va ASHRAE 62.1 dan kattasi; CO₂ ~${n0(Math.min(...sinf.map(x => x.co2)))}–${n0(Math.max(...sinf.map(x => x.co2)))} ppm), derazasiz xizmat xonalarida 60 m³/soat·kishi (KMK). Kanal kesimi: magistral ≤ 4.5 m/s, fasadgacha ≤ 4.0 m/s, xona tarmog'i ≤ 3.0 m/s (shovqin). Rejadagi kanallar yo'nalishi — taklif; uni buyurtmachi hal qiladi.</p>
  ` + IKKI);

  const b2 = sahifa(`
    <h2 style="margin-top:0">3. Elektr, qishki rejim va boshqa talablar</h2>
    <ul>
      <li><b>Elektr quvvati:</b> splitlar to'liq yuklamada ~${n0(T.elektr11)} kW (11 xona), koworking va CEO bilan ~${n0(T.elektrJami)} kW (EER ≈ ${EER}); rekuperator ventilyatorlari — pasportdan (taxminan 2 × 1.5–2.5 kW). Binoda ajratilgan quvvat va uch fazali liniya tekshiriladi.</li>
      <li><b>Qish:</b> tashqi ${F.tQish} °C da ${n0(T.Qjami)} m³/soat havoni isitish ~${n0(T.qishTashqi)} kW; rekuperatordan keyin (FIK ${REK.etaQish * 100}%) havo ~${n1(T.tKirishQish)} °C bo'ladi, qolgan ~${n0(T.qishQoldiq)} kW ni splitlar (isitish rejimi) yoki radiatorlar beradi. Sinfga ~${n0(T.tKirishQish)} °C li havo noqulay bo'lsa — kanalda isitgich (18 °C gacha ~${n0(T.isitgich)} kW, elektr yoki suvli) yoki diffuzorlarni splitlar yoniga qo'yish. Rekuperatorda muzlashdan himoya (pasport bo'yicha).</li>
      <li><b>Kondensat:</b> sinflarda splitlar tashqi devorda — drenaj fasadga qisqa; SR4 va xizmat xonalarida — shift ichida nishab bilan sanuzel stoyakigacha yoki drenaj nasosi.</li>
      <li><b>Freon trassalari:</b> sinflarda 3–5 m (tashqi blok shu xona fasadida); SR4 va XZ1–XZ4 da tashqi blok joyi aniqlanadi (tom yoki o'ng devor ortidagi oraliq), trassa ≤ 15–20 m.</li>
      <li><b>Shovqin:</b> rekuperatorlar koridor shiftida, sinflar yonida — kirish va chiqish kanallarida shovqin so'ndirgich (≥ 1 m), sinfda ≤ 35 dB(A). Splitlar «tun» rejimida ~25–30 dB(A).</li>
      <li><b>Boshqarish:</b> har sinfda CO₂ datchigi (rekuperator tezligini boshqaradi yoki xona klapanini ochadi); splitlar — xona bo'yicha termostat bilan. Yong'in signalida rekuperatorlar o'chadi; kanallar devor va koridordan o'tishda yong'inga qarshi klapan (yong'in xavfsizligi mutaxassisi belgilaydi).</li>
      <li><b>Koworking (tadbirda ${T.qoshimcha[0].odam} kishi):</b> tashqi havosi (~${T.qoshimcha[0].oa} m³/soat) ikkala rekuperatorga sig'maydi (R1, R2 deyarli to'liq) — alohida qurilma yoki derazadan shamollatish masalasi ochiq.</li>
    </ul>
    <h3>Aniqlashtirilishi va o'lchanishi kerak</h3>
    <ol>
      <li>${REK.brend} modeli: aniq kodi, ${REK.nominal[1]} m³/soatda tashqi statik bosimi, FIK, o'lchamlari, elektr quvvati.</li>
      <li>Derazalar o'lchami va dunyo tomonlari, qaysi xonalar ochiq tom ostida — split tanlovini ${'«agar yuk past bo\'lsa»'} ustuniga tushirish mumkinmi.</li>
      <li>O'quvchilar noutbuk bilan ishlaydimi; dars paytidagi maksimal odamlar soni.</li>
      <li>Tashqi bloklar joyi (fasad, tom, o'ng devor ortidagi oraliq eni), fasadda panjaralar uchun ruxsat.</li>
      <li>Koridorlarda osma shift balandligi (rekuperator va kanallar uchun ≥ 0.6–0.7 m bo'shliq).</li>
    </ol>
  `);
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — HVAC hisobi</title><style>${CSS}</style></head><body>${b1}${b2}</body></html>`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const T = tizimHisob();
  T.xona.forEach(x => console.log(x.kod, x.R, x.odam, x.oa, Math.round(x.co2), x.q.map(v => v.toFixed(2)).join('–'), `${x.n}x${x.split.btu}`, 'min', x.splitMin.btu, 'nout', x.noutbukOk, x.kanal.a + 'x' + x.kanal.b, JSON.stringify(x.saYol), JSON.stringify(x.raYol)));
  T.guruh.forEach(g => console.log(g.kod, g.Q, g.Qmin, g.magistral, g.tashqi));
  T.qoshimcha.forEach(x => console.log(x.kod, x.odam, x.q.map(v => v.toFixed(1)), x.n, x.split.btu));
  console.log(T.soni, T.nominal11.toFixed(1), T.nominalJami.toFixed(1), T.elektr11.toFixed(1), T.elektrJami.toFixed(1), T.qishTashqi.toFixed(1), T.tKirishQish.toFixed(1), T.isitgich.toFixed(1), T.tKirishYoz.toFixed(1));
}
