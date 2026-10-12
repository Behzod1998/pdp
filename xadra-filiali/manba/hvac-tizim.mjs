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
// Buyurtmachi tanlovi va narxlari (12.10): sinflarga bittadan 24 000 BTU, xizmat xonalariga bittadan 12 000 BTU;
// CEO va koworkingda konditsioner mavjud (koworkingda 24 000 + 18 000 BTU — koridorlar ham shu orqali sovutiladi).
export const TANLOV = { sinf: { btu: 24000, n: 1, narx: 1120 }, ofis: { btu: 12000, n: 1, narx: 380 } };
export const MAVJUD = { KW: [24000, 18000], X12: [] };
export const NARX = { rekuperator: 28000000, kanalM: 300000, kurs: 11900, kanalZaxira: 0.10 };   // so'm; rekuperator — bittasi
export const ISSIQ = 0.87;           // 42–43 °C li kunlarda split quvvati (nominalga nisbatan, umumiy holat)
export const KISHI_SINF = 24;        // m³/soat har bir kishiga — sinflar uchun loyiha qiymati (me'yoriy ~22, CO₂ ≈ 1 150–1 200 ppm)
export const EER = 3.2;              // sovutishda o'rtacha energiya samaradorligi (elektr quvvatini baholash uchun)
const k10 = v => Math.ceil(v / 10) * 10;
const uzunlik = pts => pts.slice(1).reduce((t, p, i) => t + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
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
    const markazlar = n === 1 ? [(der.x1 + der.x2) / 2] : [(x.x1 + der.x1) / 2, (der.x2 + x.x2) / 2];
    return markazlar.map(cx => ({
      x1: cx - en / 2, x2: cx + en / 2, y1, y2, tb: { x1: cx - 450, x2: cx + 450, y1: ty1, y2: ty2 } }));
  }
  if (kod === 'SR4') return (n === 1 ? [12200] : [9200, 15200]).map(cy => ({ x1: x.x2 - 250, x2: x.x2, y1: cy - en / 2, y2: cy + en / 2,
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
    const nTav = r.tur === 'sinf' ? 2 : 1;
    const tavsiya = SPLIT.find(s => s.kw * nTav >= q[1] / ISSIQ) || SPLIT.at(-1);
    const tn = TANLOV[r.tur], n = tn.n, split = SPLIT.find(s => s.btu === tn.btu);
    const quvvat = n * split.kw, issiq = quvvat * ISSIQ;
    // baho: 42–43 °C da ham yetadi | yukning past–o'rta qismida yetadi | kam
    const baho = issiq >= q[1] ? 'yetarli' : quvvat >= q[0] ? 'chegarada' : 'kam';
    const t = terminallar(r.kod);
    const kirish = g.kod === 'R2' && r.kod !== 'SR4' && r.kod.startsWith('SR') ? 'past' : 'yuqori';
    return {
      ...r, R: g.kod, oa, oaMeyor: r.oaMin, co2: F.co2Tashqi + r.odam * F.co2Kishi / oa * 1e6, oaQoldiq, q, n, split,
      nTav, tavsiya, quvvat, issiq, baho, narx: n * tn.narx,
      qNout: q[1] + r.noutbuk, noutbukOk: issiq >= q[1] + r.noutbuk,
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
  // 11 xonadan tashqari: koworking va CEO — konditsionerlari mavjud (buyurtmachi). Koworking tekshiruvi: kundalik ~35 va
  // tadbirda ~70 kishi; uning sovug'i koridorlarga ham yetadi (koridorlar koworkingga to'g'ridan ochiladi).
  const kwX = XONALAR.find(x => x.kod === 'KW'), ceoX = XONALAR.find(x => x.kod === 'X12');
  const kwA = xonaMaydoni(kwX), kwOdam = KW_TADBIR.stullar.length + 2;
  const kwOa = kwOdam * 20;   // KMK: ≤ 3 soatlik tadbirlar — 20 m³/soat·kishi
  const korYuk = 2 * (0.3 + 0.2);   // ikkala koridor: yoritish va o'tib-qaytuvchi odamlar, kW (taxminiy)
  const kwYuk = odam => {
    const ichki = odam * (F.odamS + F.odamL) / 1000 + kwA * F.yoritish / 1000 + 0.3;
    return [ichki + 0.6 + korYuk, ichki + 3.4 + F.tom * kwA + korYuk];
  };
  const kwMavjud = MAVJUD.KW.reduce((t, b) => t + SPLIT.find(s => s.btu === b).kw, 0);
  const qoshimcha = [
    { kod: 'KW', nomi: 'Koworking + koridorlar', odam: 35, odamTadbir: kwOdam, A: kwA, oa: kwOa, q: kwYuk(35), qTadbir: kwYuk(kwOdam),
      mavjud: MAVJUD.KW, quvvat: kwMavjud, izoh: `mavjud ${MAVJUD.KW.map(btuNom).join(' + ')}; tashqi havo (tadbirda ~${kwOa} m³/soat) R1/R2 ga kirmaydi` },
    { kod: 'X12', nomi: 'CEO xonasi', odam: XIZMAT_JIHOZ.find(z => z.kod === 'X12').stullar.length, A: xonaMaydoni(ceoX), oa: null, mavjud: [], quvvat: null,
      izoh: 'konditsioner mavjud; derazali — tashqi havo derazadan' },
  ];
  // jamlar
  const soni = {};
  xona.forEach(x => { soni[x.split.btu] = (soni[x.split.btu] || 0) + x.n; });
  const nominal11 = xona.reduce((t, x) => t + x.quvvat, 0);
  const nominalJami = nominal11;
  // havo kanallari uzunligi (chizmadagi taklif yo'nalish bo'yicha) va narx
  const kanalChizma = guruh.reduce((t, g) => t + uzunlik(g.oa) + uzunlik(g.ea) + 2 * (KOR_OXIRI - g.joy.x2), 0)
    + xona.reduce((t, x) => t + uzunlik(x.saYol) + uzunlik(x.raYol), 0);
  const kanalUz = Math.ceil(kanalChizma / 1000 * (1 + NARX.kanalZaxira));
  const narx = {
    rekuperator: GURUH.length * NARX.rekuperator, kanal: kanalUz * NARX.kanalM,
    split: xona.reduce((t, x) => t + x.narx, 0),
  };
  narx.somJami = narx.rekuperator + narx.kanal;
  narx.usdJami = narx.somJami / NARX.kurs + narx.split;
  const Qjami = xona.reduce((t, x) => t + x.oa, 0);
  const qishTashqi = Qjami * F.rho * F.c * (F.tIchkiQish - F.tQish) / 3600;
  const tKirishQish = F.tQish + REK.etaQish * (F.tIchkiQish - F.tQish);
  const tKirishYoz = F.tTashqi - REK.etaYoz * (F.tTashqi - F.tIchki);
  return {
    xona, guruh, qoshimcha, soni, nominal11, nominalJami, Qjami, kanalChizma, kanalUz, narx,
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
  const BAHO = { yetarli: '✓', chegarada: '≈', kam: '✗' };
  const qator = x => `<tr><td>${x.kod}</td><td class="r">${x.odam}</td><td class="r">${x.oa}</td><td>${x.R}</td><td class="r">${n0(x.co2)}</td><td class="r">${n1(x.q[0])}–${n1(x.q[1])}</td><td><b>${x.n > 1 ? x.n + ' × ' : ''}${btuNom(x.split.btu)}</b> ${BAHO[x.baho]}</td></tr>`;
  const [kw, ceo] = T.qoshimcha;
  return `<div><h3>VENTILYATSIYA — 2 TA REKUPERATOR (${REK.brend.toUpperCase()})</h3><table>
    <tr><th>Qurilma</th><th>Xonalar</th><th class="r">Loyiha, m³/soat</th><th class="r">Me'yoriy min</th><th class="r">Kanal</th></tr>
    ${T.guruh.map(g => `<tr><td><b>${g.kod}</b> · ${g.koridor}</td><td>${g.xonalar.join(', ')}</td><td class="r">${n0(g.Q)}</td><td class="r">${n0(g.Qmin)}</td><td class="r">${g.magistral.a}×${g.magistral.b}</td></tr>`).join('')}
    <tr class="jami"><td>Jami</td><td>havo kanallari ~${T.kanalUz} m</td><td class="r">${n0(T.Qjami)}</td><td class="r">${n0(T.guruh.reduce((t, g) => t + g.Qmin, 0))}</td><td></td></tr>
  </table></div>
  <div><h3>XONALAR: TASHQI HAVO VA SPLIT (BUYURTMACHI TANLOVI)</h3><table>
    <tr><th>Xona</th><th class="r">Odam</th><th class="r">Havo, m³/soat</th><th>Rek.</th><th class="r">CO₂, ppm</th><th class="r">Yuk, kW</th><th>Split</th></tr>
    ${T.xona.map(qator).join('')}
    <tr><td>KW</td><td class="r">35/${kw.odamTadbir}</td><td class="r">—</td><td>—</td><td></td><td class="r">${n1(kw.q[0])}–${n1(kw.qTadbir[1])}</td><td>mavjud ${kw.mavjud.map(btuNom).join(' + ')}</td></tr>
    <tr><td>CEO</td><td class="r">${ceo.odam}</td><td class="r">—</td><td>—</td><td></td><td></td><td>mavjud</td></tr>
  </table></div>
  <div><h3>HISOB ASOSI</h3><p class="izoh">
    <b>Tashqi havo:</b> sinflarda ${KISHI_SINF} m³/soat·kishi (me'yoriy ~22), derazasiz xizmat xonalarida 60 m³/soat·kishi (KMK). R2 ga ${n0(T.guruh[1].Q)} m³/soat kerak — <b>${REK.nominal[1]} m³/soatlik model</b> (kanal qarshiligi ~${REK.esp} Pa da).<br>
    <b>Split:</b> yuk — odamlar (115 W/kishi), yoritish, panel/kompyuter, devor-oyna-tom (oraliq) va rekuperatordan keyingi tashqi havo qoldig'i. ✓ — 42–43 °C da ham yetadi; ≈ — yukning past–o'rta qismida yetadi (derazalar yo'nalishi va tomga bog'liq). Sinflarda 24k — deraza ustida, xizmat xonalarida 12k. Koworkingdagi mavjud konditsionerlar koridorlarni ham sovutadi.<br>
    Toza havo doska oldida beriladi, orqa devor yonida so'riladi. Kanallar koridorlar osma shifti ichida (~2.8 m), koworkingda — shift ostida (fasadgacha). Kanallar yo'nalishi — taklif, buyurtmachi o'zgartirishi mumkin.
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
export function tizimHtml() {
  const T = tizimHisob();
  let bet = 0;
  const sahifa = ichki => `<section class="bet"><div class="bar"></div>${ichki}<footer><span>${LOYIHA.brend} · ${LOYIHA.filial} · 2-qavat · HVAC hisobi (rekuperator + split) · ${LOYIHA.versiya} · ${LOYIHA.sanaISO}</span><span>${++bet}</span></footer></section>`;
  const R2 = T.guruh[1];
  const sinf = T.xona.filter(x => x.tur === 'sinf'), ofis = T.xona.filter(x => x.tur === 'ofis');
  const perim = sinf.filter(x => x.derazali);
  const [kw] = T.qoshimcha;
  const BAHO = { yetarli: '<span class="ok">yetarli</span>', chegarada: '<span class="f">chegarada</span>', kam: '<span class="og">kam</span>' };
  const som = v => (Math.round(v / 1e5) / 10).toLocaleString('en-US').replace(/,/g, ' ') + ' mln so\'m';
  const xq = x => `<tr><td><b>${x.kod}</b></td><td class="r">${x.odam}</td><td class="r">${x.oa}</td><td class="r">${n0(x.co2)}</td><td class="r">${n1(x.odamS + x.odamL)}</td><td class="r">${n1(x.yorit + x.jihoz)}</td><td class="r f">${n1(x.env[0])}–${n1(x.env[1])}</td><td class="r">${n1(x.oaQoldiq)}</td><td class="r"><b>${n1(x.q[0])}–${n1(x.q[1])}</b></td><td style="white-space:nowrap"><b>${x.n > 1 ? x.n + ' × ' : ''}${btuNom(x.split.btu)}</b> <span class="kichik">${n1(x.quvvat)} / ${n1(x.issiq)} kW</span></td><td>${BAHO[x.baho]}</td><td class="kichik">${x.nTav > 1 ? x.nTav + ' × ' : ''}${btuNom(x.tavsiya.btu)}</td></tr>`;
  const b1 = sahifa(`
    <div class="sub">${LOYIHA.brend} · ${LOYIHA.filial} · ${LOYIHA.manzil}</div>
    <h1>2-qavat: ventilyatsiya (2 ta rekuperator) va konditsionerlash (split) — hisob</h1>
    <div class="sub">Buyurtmachi qarori (12.10): tashqi havo — 2 ta ${REK.brend} rekuperatori (${REK.nominal[0]}–${REK.nominal[1]} m³/soat); sinflarga bittadan 24 000 BTU, xizmat xonalariga bittadan 12 000 BTU split; CEO va koworkingda konditsioner mavjud. Oldingi tahlil (2 ta 96-ka + 30% toza havo): Xadra_2-qavat_HVAC_tahlil_${LOYIHA.versiya}.pdf.</div>
    <h2>1. Rekuperatorlar</h2>
    <table><tr><th>Qurilma</th><th>Joyi</th><th>Xonalar</th><th class="r">Loyiha sarfi</th><th class="r">Me'yoriy min</th><th class="r">3 000 lik bilan zaxira</th><th class="r">Magistral</th><th class="r">Fasadgacha</th></tr>
      ${T.guruh.map(g => `<tr><td><b>${g.kod}</b></td><td>${g.koridor} koridori shiftida (g'arbiy uchi)</td><td>${g.xonalar.join(', ')}</td><td class="r">${n0(g.Q)} m³/soat</td><td class="r">${n0(g.Qmin)}</td><td class="r">${n0(g.zaxira)} (${n0(g.zaxira / REK.tanlov * 100)}%)</td><td class="r">${g.magistral.a}×${g.magistral.b} · ${n1(g.magistral.v)} m/s</td><td class="r">${g.tashqi.a}×${g.tashqi.b} · ${n1(g.tashqi.v)} m/s</td></tr>`).join('')}
      <tr class="jami"><td colspan="3">Jami 11 xona</td><td class="r">${n0(T.Qjami)}</td><td class="r">${n0(T.guruh.reduce((t, g) => t + g.Qmin, 0))}</td><td colspan="3"></td></tr>
    </table>
    <div class="xulosa"><b>Xulosa.</b> 2 ta ${REK.brend} 11 xonaning tashqi havosini ta'minlaydi, agar har biri <b>~${REK.esp} Pa kanal qarshiligida ham ≥ ${n0(R2.Q)} m³/soat</b> bersa — <b>${REK.nominal[1]} m³/soatlik model</b> kerak; ${REK.nominal[0]} lik R2 ning me'yoriy minimumiga (${n0(R2.Qmin)}) yetmaydi. Pasportdan: sarf — bosim egri chizig'i, FIK, muzlashdan himoya, filtrlar (G4 + F7), shovqin (korpus va kanal chiqishlari, oktava bo'yicha), elektr quvvati, o'lchamlari (koridor shiftiga: eni ≤ ~1.3 m, balandligi ≤ ~0.5 m).</div>
    <p class="kichik">Loyiha sarfi: sinflarda ${KISHI_SINF} m³/soat·kishi (me'yoriy ~22; CO₂ ~${n0(Math.min(...sinf.map(x => x.co2)))}–${n0(Math.max(...sinf.map(x => x.co2)))} ppm), derazasiz xizmat xonalarida 60 m³/soat·kishi (KMK). Kanal kesimi: magistral ≤ 4.5 m/s, fasadgacha ≤ 4.0, xona tarmog'i ≤ 3.0 m/s. Rejadagi kanallar yo'nalishi — taklif; uni buyurtmachi hal qiladi.</p>

    <h2>2. Split konditsionerlar — buyurtmachi tanlovi tekshiruvi</h2>
    <table style="font-size:6.9pt"><tr><th>Xona</th><th class="r">Odam</th><th class="r">Havo, m³/soat</th><th class="r">CO₂, ppm</th><th class="r">Odamlar</th><th class="r">Yoritish, uskuna</th><th class="r">Devor, oyna, tom</th><th class="r">Tashqi havo qoldig'i</th><th class="r">Yuk, kW</th><th>Tanlov (35 / 42 °C)</th><th>Baho</th><th>Hisob tavsiyasi</th></tr>
      ${T.xona.map(xq).join('')}
      <tr class="jami"><td colspan="8">11 xona</td><td class="r">${n1(T.xona.reduce((t, x) => t + x.q[0], 0))}–${n1(T.xona.reduce((t, x) => t + x.q[1], 0))}</td><td colspan="3">${n1(T.nominal11)} kW nominal</td></tr>
      <tr><td><b>KW</b></td><td class="r">35 / ${kw.odamTadbir}</td><td colspan="6" class="kichik">koworking va ikkala koridor (koridorlar koworkingga ochiq); ${kw.izoh}</td><td class="r"><b>${n1(kw.q[0])}–${n1(kw.q[1])}</b><br><span class="kichik">tadbirda ${n1(kw.qTadbir[0])}–${n1(kw.qTadbir[1])}</span></td><td><b>mavjud</b> <span class="kichik">${n1(kw.quvvat)} / ${n1(kw.quvvat * ISSIQ)} kW</span></td><td>${kw.quvvat * ISSIQ >= kw.q[1] ? BAHO.yetarli : BAHO.chegarada}<br><span class="kichik">tadbirda: ${kw.quvvat >= kw.qTadbir[0] ? 'chegarada' : 'kam'}</span></td><td></td></tr>
      <tr><td><b>CEO</b></td><td class="r">${T.qoshimcha[1].odam}</td><td colspan="8" class="kichik">${T.qoshimcha[1].izoh}</td><td><b>mavjud</b></td><td></td></tr>
    </table>
    <p class="kichik"><b>Hisob:</b> yuk — odamlar (${F.odamS}+${F.odamL} W), yoritish ${F.yoritish} W/m², interaktiv panel ${F.panel} kW, kompyuterli ish joyi ${F.ishJoyi} kW, devor-oyna-tom oralig'i (derazalar o'lchami va yo'nalishi, tom noma'lum) va rekuperatordan keyin qolgan tashqi havo issiqligi (yozda ~${n1(T.tKirishYoz)} °C). Split nominali 35 °C da; 42–43 °C da ~${ISSIQ * 100}%. <b>Baho:</b> yetarli — 42–43 °C da ham yuqori chegarani qoplaydi; chegarada — yukning past–o'rta qismida yetadi. Hisob tavsiyasi — eng og'ir holat uchun (sinfda 2 ta blok).</p>
    <div class="xulosa"><b>Natija.</b> Xizmat xonalari (12k) va 4-xona (24k) — <b>yetarli</b>. Derazali 6 sinfda bitta 24k (7.0 kW, 42–43 °C da ~${n1(perim[0].issiq)} kW) yuk ${n1(perim[0].q[0])}–${n1(perim[0].q[1])} kW ning past–o'rta qismini qoplaydi: derazalar shimol yoki sharqqa qaragan, pardali va xona ustida 3-qavat bo'lsa — yetadi; g'arbga qaragan pardasiz deraza, ochiq tom va 42 °C li kunda ~${n1(perim[0].q[1] - perim[0].issiq)} kW kam (noutbuklar bilan ~${n1(perim[0].qNout - perim[0].issiq)} kW). Bitta blok 44 m² sinfda havoni bir tomondan beradi — deraza ustida, o'rtada joylashgan. Koworkingdagi mavjud ${kw.mavjud.map(btuNom).join(' + ')} (${n1(kw.quvvat)} kW) kundalik rejimda koridorlar bilan birga yetadi; 70 kishilik tadbirda chegarada (${n1(kw.qTadbir[0])}–${n1(kw.qTadbir[1])} kW, tashqi havosiz), derazadan shamollatilsa — kam.</div>
  `);
  const b2 = sahifa(`
    <h2 style="margin-top:0">3. Narx (buyurtmachi narxlari, 12.10)</h2>
    <table><tr><th>Nomi</th><th class="r">Soni</th><th class="r">Narxi</th><th class="r">Summa</th></tr>
      <tr><td>Rekuperator ${REK.brend}, ${REK.nominal[1]} m³/soat</td><td class="r">${GURUH.length} ta</td><td class="r">${som(NARX.rekuperator)}</td><td class="r">${som(T.narx.rekuperator)}</td></tr>
      <tr><td>Havo kanallari (chizmadan ${n0(T.kanalChizma / 1000)} m + ${NARX.kanalZaxira * 100}% burilish va ulanishlar)</td><td class="r">${T.kanalUz} m</td><td class="r">${n0(NARX.kanalM)} so'm/m</td><td class="r">${som(T.narx.kanal)}</td></tr>
      <tr><td>Split 24 000 BTU (SR1–SR7)</td><td class="r">${sinf.length} ta</td><td class="r">$${TANLOV.sinf.narx}</td><td class="r">$${n0(sinf.length * TANLOV.sinf.narx)}</td></tr>
      <tr><td>Split 12 000 BTU (XZ1–XZ4)</td><td class="r">${ofis.length} ta</td><td class="r">$${TANLOV.ofis.narx}</td><td class="r">$${n0(ofis.length * TANLOV.ofis.narx)}</td></tr>
      <tr class="jami"><td colspan="3">Jami (kurs ${n0(NARX.kurs)} so'm/$)</td><td class="r">$${n0(T.narx.usdJami)} · ${som(T.narx.usdJami * NARX.kurs)}</td></tr>
    </table>
    <p class="kichik">Kirmagan (narxi aniqlanadi): montaj (agar narxga kirmagan bo'lsa), diffuzor va so'rish panjaralari (sinfga 2 + 2, xizmat xonasiga 1 + 1), fasad panjaralari (4 ta), shovqin so'ndirgichlar (8 ta), egiluvchan ulanishlar, kanal izolyatsiyasi (koworking orqali o'tadigan tashqi havo va chiqarish kanallari), freon trassalari va drenaj, CO₂ datchiklari. Kanal uzunligi — taklif yo'nalish bo'yicha; yo'nalish o'zgarsa qayta hisoblanadi.</p>

    <h2>4. Elektr, qishki rejim va boshqa talablar</h2>
    <ul>
      <li><b>Elektr quvvati:</b> splitlar to'liq yuklamada ~${n0(T.elektr11)} kW (EER ≈ ${EER}); rekuperator ventilyatorlari — pasportdan (taxminan 2 × 1.5–2.5 kW).</li>
      <li><b>Qish:</b> tashqi ${F.tQish} °C da ${n0(T.Qjami)} m³/soat havoni isitish ~${n0(T.qishTashqi)} kW; rekuperatordan keyin (FIK ${REK.etaQish * 100}%) havo ~${n1(T.tKirishQish)} °C, qolgan ~${n0(T.qishQoldiq)} kW ni splitlar (isitish rejimi) yoki radiatorlar beradi; kerak bo'lsa kanalda isitgich (18 °C gacha ~${n0(T.isitgich)} kW). Rekuperatorda muzlashdan himoya.</li>
      <li><b>Shovqin:</b> rekuperatorlar tebranishdan himoyalovchi osmalarda, kanallar bilan egiluvchan ulanadi; toza havo va so'rish kanallarida 1–1.5 m, tashqi havo va chiqarish kanallarida ≥ 1 m shovqin so'ndirgich; rekuperator ostida ~2.5 m yopiq GKL shift (mineral paxta bilan) va lyuk. Maqsad: koridorda ≤ 40, sinfda ≤ 35 dB(A). R2 ni SR7 va XZ1 eshiklari ustidan 1.5–2 m sharqqa surish tavsiya etiladi.</li>
      <li><b>Kondensat va freon:</b> sinflarda split tashqi devorda — drenaj va trassa qisqa (3–5 m); SR4 va xizmat xonalarida tashqi blok joyi aniqlanadi (tom yoki o'ng devor ortidagi oraliq), trassa ≤ 15–20 m, drenaj nishab bilan yoki nasos.</li>
      <li><b>Boshqarish:</b> har sinfda CO₂ datchigi; yong'in signalida rekuperatorlar o'chadi; kanallar devor va koridordan o'tishda yong'inga qarshi klapan.</li>
      <li><b>Koworking:</b> tadbirda ~${kw.oa} m³/soat tashqi havo kerak — R1, R2 ga sig'maydi; derazadan shamollatish yoki alohida qurilma — qaror kerak.</li>
    </ul>
    <h3>Aniqlashtirilishi kerak</h3>
    <ol>
      <li>Rekuperator narxi — bittasi uchunmi (hisobda: 2 × 28 mln so'm)? Narxga montaj kiradimi?</li>
      <li>Splitlar narxiga montaj kiradimi?</li>
      <li>${REK.brend} modeli: aniq kodi, ${REK.nominal[1]} m³/soatda tashqi statik bosimi, shovqini, o'lchamlari.</li>
      <li>Derazalar yo'nalishi va qaysi xonalar ochiq tom ostida — sinflardagi 24k ning yetarliligi shunga bog'liq.</li>
      <li>Tashqi bloklar joyi (fasad, tom, o'ng devor ortidagi oraliq).</li>
    </ol>
  `);
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — HVAC hisobi</title><style>${CSS}</style></head><body>${b1}${b2}</body></html>`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const T = tizimHisob();
  T.xona.forEach(x => console.log(x.kod, x.R, x.odam, x.oa, Math.round(x.co2), x.q.map(v => v.toFixed(2)).join('–'), `${x.n}x${x.split.btu}`, x.quvvat.toFixed(1), x.issiq.toFixed(2), x.baho, 'tavsiya', `${x.nTav}x${x.tavsiya.btu}`));
  T.guruh.forEach(g => console.log(g.kod, g.Q, g.Qmin, g.magistral, g.tashqi));
  T.qoshimcha.forEach(x => console.log(x.kod, x.odam, x.q && x.q.map(v => v.toFixed(1)), x.qTadbir && x.qTadbir.map(v => v.toFixed(1)), x.quvvat));
  console.log(T.soni, 'nominal', T.nominal11.toFixed(1), 'elektr', T.elektr11.toFixed(1), 'kanal', (T.kanalChizma / 1000).toFixed(1), T.kanalUz, 'narx', T.narx);
}
