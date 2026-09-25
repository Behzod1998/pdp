// Xonalar ko'rsatkichlari, havo almashinuvi hisobi va chizmaning avtomatik tekshiruvi.
import {
  H, ICHKI, PARTA, STUL, STANDART, USTUNLAR, DERAZALAR, DEVORLAR, ESHIKLAR, ZINALAR, XONALAR,
  XIZMAT_JIHOZ, KW_KUNDALIK, KW_TADBIR, sinflar, maydon, bolaklar, xizmatJihozlari,
} from './model.mjs';

// ---------- geometriya ----------
const kesishadi = (a, b) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
const kesim = (a, b) => ({ x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1), x2: Math.min(a.x2, b.x2), y2: Math.min(a.y2, b.y2) });
const bosh = r => r.x2 <= r.x1 || r.y2 <= r.y1;
export const masofa = (a, b) => {
  const dx = Math.max(0, a.x1 - b.x2, b.x1 - a.x2), dy = Math.max(0, a.y1 - b.y2, b.y1 - a.y2);
  return Math.hypot(dx, dy);
};
const nuqtaMasofa = (p, r) => Math.hypot(Math.max(0, r.x1 - p.x, p.x - r.x2), Math.max(0, r.y1 - p.y, p.y - r.y2));
// kesma to'rtburchakdan o'tadimi (Liang–Barsky)
function kesmaKesadi(p, q, r) {
  let t0 = 0, t1 = 1;
  const dx = q.x - p.x, dy = q.y - p.y;
  for (const [pp, qq] of [[-dx, p.x - r.x1], [dx, r.x2 - p.x], [-dy, p.y - r.y1], [dy, r.y2 - p.y]]) {
    if (pp === 0) { if (qq < 0) return false; continue; }
    const t = qq / pp;
    if (pp < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t1 - t0 > 1e-6;
}

// Eshik polotnosi aylanadigan chorak doira
export function eshikSektori(e) {
  const r = e.en;
  if (e.devor === 'h') {
    const hx = e.ilgak === 'a' ? e.a : e.b;
    const quti = { x1: e.ilgak === 'a' ? e.a : e.b - r, x2: e.ilgak === 'a' ? e.a + r : e.b,
      y1: e.yon > 0 ? e.yuz : e.yuz - r, y2: e.yon > 0 ? e.yuz + r : e.yuz };
    return { ilgak: { x: hx, y: e.yuz }, r, quti };
  }
  const hy = e.ilgak === 'a' ? e.a : e.b;
  const quti = { y1: e.ilgak === 'a' ? e.a : e.b - r, y2: e.ilgak === 'a' ? e.a + r : e.b,
    x1: e.yon > 0 ? e.yuz : e.yuz - r, x2: e.yon > 0 ? e.yuz + r : e.yuz };
  return { ilgak: { x: e.yuz, y: hy }, r, quti };
}
const sektorKesadi = (s, rect) => {
  const k = kesim(s.quti, rect);
  if (bosh(k)) return false;
  return nuqtaMasofa(s.ilgak, k) < s.r - 1;
};

// ---------- ko'rsatkichlar ----------
const ichidagiUstunlar = xona => USTUNLAR.flatMap(u => bolaklar(xona).filter(b => kesishadi(u, b)).map(b => ({ ...u, kesim: kesim(u, b) })));
const sofMaydon = xona => bolaklar(xona).reduce((t, b) => t + maydon(b), 0) - ichidagiUstunlar(xona).reduce((t, u) => t + maydon(u.kesim), 0);

function xonaDerazalari(xona) {
  return DERAZALAR.map(d => {
    let uz = 0;
    if (d.devor === 'yuqori' && xona.y1 === 0) uz = Math.min(d.x2, xona.x2) - Math.max(d.x1, xona.x1);
    if (d.devor === 'past' && xona.y2 === ICHKI.y) uz = Math.min(d.x2, xona.x2) - Math.max(d.x1, xona.x1);
    if (d.devor === 'chap' && xona.x1 === 0) uz = Math.min(d.y2, xona.y2) - Math.max(d.y1, xona.y1);
    return uz > 0 ? { ...d, uz } : null;
  }).filter(Boolean);
}

// o'quvchilar qaysi tomonga qaraydi: doska 'past' → +y, 'yuqori' → -y
function derazaTomoni(xona, devor) {
  const pastga = xona.doska === 'past';
  if (devor === 'yuqori') return pastga ? 'orqada' : 'oldida';
  if (devor === 'past') return pastga ? 'oldida' : 'orqada';
  if (devor === 'chap') return pastga ? "o'ng tomonda" : 'chap tomonda';
  return pastga ? 'chap tomonda' : "o'ng tomonda";
}

export const HAVO = { kishiga: 30, rekuperator: 0.6, dh: 21 }; // m³/soat·kishi; FIK; yozgi entalpiya farqi kJ/kg

export function havoHisobi(xona, odam, jihozKvt) {
  const A = sofMaydon(xona);
  const V = A * H / 1000;
  const Q = odam * HAVO.kishiga;
  const der = xonaDerazalari(xona).reduce((t, d) => t + d.uz, 0) / 1000;
  const yuk = {
    odamlar: odam * 0.12,
    jihozlar: jihozKvt,
    yoritish: A * 0.008,
    quyosh: der * 1.8 * 0.15,
    ventilyatsiya: Q / 3600 * 1.2 * HAVO.dh * (1 - HAVO.rekuperator),
  };
  const jami = Object.values(yuk).reduce((t, v) => t + v, 0);
  return { A, V, Q, karra: Q / V, yuk, sovutish: jami, sovutishYaxlit: Math.ceil(jami * 2) / 2 };
}

export function korsatkichlar() {
  return sinflar().map(x => {
    const j = x.j, s = j.s;
    const D = x.y2 - x.y1;
    const orin = j.partalar.length;
    const qatorlar = [...new Set(j.partalar.map(p => p.qator))].map(q => j.partalar.filter(p => p.qator === q).length);
    const oxirgi = s.doska + (s.qatorlar - 1) * s.qadam + PARTA.chuq;
    const stulOrqasi = s.qadam - PARTA.chuq - STUL.oraliq - STUL.chuq;
    // orqa zona: orqasida parta bo'lmagan har bir stuldan xona chegarasigacha (eng kichigi)
    const orqada = (st, p) => p.x1 < st.x2 && st.x1 < p.x2 && (x.doska === 'yuqori' ? p.y1 > st.y2 : p.y2 < st.y1);
    const orqaZona = Math.min(...j.stullar.filter(st => !j.partalar.some(p => orqada(st, p))).map(st => {
      const cx = (st.x1 + st.x2) / 2, cy = (st.y1 + st.y2) / 2;
      const b = bolaklar(x).find(r => cx >= r.x1 && cx <= r.x2 && cy >= r.y1 && cy <= r.y2) || x;
      const pastki = bolaklar(x).filter(r => cx >= r.x1 && cx <= r.x2).reduce((a, r) => (x.doska === 'yuqori' ? Math.max(a, r.y2) : Math.min(a, r.y1)), x.doska === 'yuqori' ? b.y2 : b.y1);
      return x.doska === 'yuqori' ? pastki - st.y2 : st.y1 - pastki;
    }));
    const yonChap = j.u0, yonOng = j.W - j.u0 - j.blokEni;
    // chetdagi o'quvchining qarash burchagi: old qatordagi chetki parta markazidan doska markaziga
    const chetki = Math.max(j.W / 2 - (j.u0 + PARTA.eni / 2), (j.u0 + j.blokEni - PARTA.eni / 2) - j.W / 2);
    const burchak = Math.atan(chetki / (s.doska + 350)) * 180 / Math.PI;
    const derazalar = xonaDerazalari(x).map(d => ({ ...d, tomon: derazaTomoni(x, d.devor) }));
    const partadanOynagacha = derazalar.length ? Math.min(...derazalar.flatMap(d => j.partalar.map(p => masofa(p, d)))) : null;
    const ustunlar = ichidagiUstunlar(x).map(u => ({
      kod: u.kod || `${u.ox}-${u.oy}`, chiqish: Math.min(u.kesim.x2 - u.kesim.x1, u.kesim.y2 - u.kesim.y1),
      partagacha: Math.min(...[...j.partalar, ...j.stullar].map(p => masofa(p, u))),
      holat: u.holat,
    }));
    const esh = ESHIKLAR.find(e => e.kod === x.eshik);
    const eshMarkaz = esh.devor === 'h' ? { x: (esh.a + esh.b) / 2, y: esh.yuz } : { x: esh.yuz, y: (esh.a + esh.b) / 2 };
    const eshV = x.doska === 'yuqori' ? eshMarkaz.y - x.y1 : x.y2 - eshMarkaz.y;
    const eshikOldda = eshV < s.doska;
    const odam = orin + 1;
    const havo = havoHisobi(x, odam, orin * 0.05 + 0.3);
    return {
      kod: x.kod, nomi: x.nomi, xona: x, W: j.W, D, A: sofMaydon(x), orin, qatorlar, bloklar: s.bloklar,
      qadam: s.qadam, doska: s.doska, yolak: s.yolak, oxirgi, stulOrqasi, orqaZona, yonChap, yonOng,
      burchak, derazalar, partadanOynagacha, ustunlar, eshik: esh, eshikOldda, havo, odam,
      kishiga: sofMaydon(x) / orin, koridor: x.koridor,
    };
  });
}

export function baho(k) {
  const standart = k.qadam >= STANDART.qadam && k.doska >= STANDART.doska && k.oxirgi <= STANDART.oxirgi && k.yolak >= STANDART.yolak;
  if (!standart) return 'Qoniqarli';
  const yon = Math.min(k.yonChap, k.yonOng);
  const uchlik = k.bloklar.some(n => n > 2);
  return yon >= 400 && !uchlik ? "A'lo" : 'Yaxshi';
}

// ---------- avtomatik tekshiruv ----------
export function tekshiruv() {
  const sinf = sinflar();
  const devorlar = DEVORLAR.filter(d => d.holat !== 'buziladi');
  const ustunlar = USTUNLAR;
  const sektorlar = ESHIKLAR.map(e => ({ e, s: eshikSektori(e) }));
  const natija = { toqnashuv: [], toSilgan: [], ustunQoidasi: [], eshik: [], doskaDevor: [], orinlar: 0, jihozlar: 0 };

  const hammaJihoz = [];
  for (const x of sinf) {
    const j = x.j;
    natija.orinlar += j.partalar.length;
    j.partalar.forEach((p, i) => hammaJihoz.push({ r: p, nom: `${x.kod} parta ${i + 1}`, xona: x.kod }));
    j.stullar.forEach((p, i) => hammaJihoz.push({ r: p, nom: `${x.kod} stul ${i + 1}`, xona: x.kod }));
    hammaJihoz.push({ r: j.ustozStoli, nom: `${x.kod} o'qituvchi stoli`, xona: x.kod });
    hammaJihoz.push({ r: j.ustozStuli, nom: `${x.kod} o'qituvchi stuli`, xona: x.kod });
  }
  XIZMAT_JIHOZ.forEach(z => xizmatJihozlari(z).forEach((p, i) => hammaJihoz.push({ r: p, nom: `${z.kod} jihoz ${i + 1}`, xona: z.kod })));
  const kw = KW_KUNDALIK;
  [...kw.stollar, ...kw.dumaloq, ...kw.stullar, ...kw.divan, ...kw.kreslo, ...kw.jurnal, ...kw.shkaf]
    .forEach((p, i) => hammaJihoz.push({ r: p, nom: `KW jihoz ${i + 1}`, xona: 'KW' }));
  natija.jihozlar = hammaJihoz.length;
  // tadbirlar rejimi alohida tekshiriladi (kundalik jihozlar bilan emas)
  const tadbir = [...KW_TADBIR.stullar, KW_TADBIR.minbar].map((p, i) => ({ r: p, nom: `KW tadbir ${i + 1}`, xona: 'KWt' }));
  hammaJihoz.push(...tadbir);

  // 1. Jihozlar: o'zaro, devor, ustun, zina, eshik bilan
  for (let i = 0; i < hammaJihoz.length; i++) {
    const a = hammaJihoz[i];
    for (let k = i + 1; k < hammaJihoz.length; k++) {
      const b = hammaJihoz[k];
      if (a.xona === b.xona && kesishadi(a.r, b.r)) natija.toqnashuv.push(`${a.nom} ↔ ${b.nom}`);
    }
    devorlar.forEach(w => kesishadi(a.r, w) && natija.toqnashuv.push(`${a.nom} ↔ devor`));
    ustunlar.forEach(u => kesishadi(a.r, u) && natija.toqnashuv.push(`${a.nom} ↔ ustun ${u.kod}`));
    ZINALAR.forEach(z => kesishadi(a.r, z) && natija.toqnashuv.push(`${a.nom} ↔ ${z.kod}`));
    sektorlar.forEach(({ e, s }) => sektorKesadi(s, a.r) && natija.eshik.push(`${e.kod} eshigi ↔ ${a.nom}`));
  }

  // 2. Doskani to'suvchi ustun: har bir o'rindan doskaning ikki cheti va markaziga
  for (const x of sinf) {
    const j = x.j, d = j.doska;
    const yuz = x.doska === 'yuqori' ? d.y2 : d.y1;
    const nuqtalar = [d.x1 + 50, (d.x1 + d.x2) / 2, d.x2 - 50].map(xx => ({ x: xx, y: yuz }));
    j.stullar.forEach((st, i) => {
      const koz = { x: (st.x1 + st.x2) / 2, y: (st.y1 + st.y2) / 2 };
      const tosilgan = nuqtalar.filter(n => ustunlar.some(u => kesmaKesadi(koz, n, u)));
      if (tosilgan.length) natija.toSilgan.push(`${x.kod} o'rin ${i + 1} (${tosilgan.length}/3)`);
    });
    // 3. Beruniy ustun qoidasi: ustun parta oldi/orqasida bo'lsa kamida 500 mm
    ustunlar.filter(u => kesishadi(u, x)).forEach(u => {
      j.partalar.forEach((p, i) => {
        const ustma = p.x1 < u.x2 && u.x1 < p.x2;
        if (ustma) {
          const oraliq = Math.max(u.y1 - p.y2, p.y1 - u.y2);
          if (oraliq < 500) natija.ustunQoidasi.push(`${x.kod} parta ${i + 1}: ustungacha ${Math.round(oraliq)} mm`);
        }
      });
    });
    // 5. Doska kar devorda: doska orqasidagi devor bo'lagi to'liq devor bilan qoplangan
    const devorChizig = x.doska === 'yuqori' ? d.y1 : d.y2;
    const qoplovchi = devorlar.filter(w => (x.doska === 'yuqori' ? Math.abs(w.y2 - devorChizig) < 1 : Math.abs(w.y1 - devorChizig) < 1));
    let qoplangan = 0;
    qoplovchi.forEach(w => { qoplangan += Math.max(0, Math.min(w.x2, d.x2) - Math.max(w.x1, d.x1)); });
    const ustunQism = ustunlar.filter(u => (x.doska === 'yuqori' ? u.y1 < devorChizig && u.y2 >= devorChizig : u.y1 <= devorChizig && u.y2 > devorChizig))
      .reduce((t, u) => t + Math.max(0, Math.min(u.x2, d.x2) - Math.max(u.x1, d.x1)), 0);
    if (qoplangan + ustunQism < d.x2 - d.x1 - 1) natija.doskaDevor.push(`${x.kod}: doska ortida bo'shliq`);
    // 4. Eshik doskaga tegmasligi
    sektorlar.forEach(({ e, s }) => sektorKesadi(s, d) && natija.eshik.push(`${e.kod} eshigi ↔ ${x.kod} doskasi`));
  }
  // eshiklar o'zaro
  for (let i = 0; i < sektorlar.length; i++)
    for (let k = i + 1; k < sektorlar.length; k++) {
      const A = sektorlar[i].s, B = sektorlar[k].s;
      if (!bosh(kesim(A.quti, B.quti)) && Math.hypot(A.ilgak.x - B.ilgak.x, A.ilgak.y - B.ilgak.y) < A.r + B.r - 1 && sektorKesadi(A, B.quti) && sektorKesadi(B, A.quti))
        natija.eshik.push(`${sektorlar[i].e.kod} ↔ ${sektorlar[k].e.kod} eshiklari`);
    }
  return natija;
}

// ---------- evakuatsiya (taxminiy yo'l uzunligi) ----------
export const KORIDOR_Y = { K1: 8550, K2: 15850 };
export function evakuatsiya() {
  const kw = { x: 5100 };                            // koworking ichidagi o'tish yo'lagi
  const zn2 = { x: 4200, y: 19200 };                // ZN2 marshining yuqori uchi
  const zn1 = { x: 3100, y: 5700 };                 // ZN1 eshigi (6-xona orqali)
  const su6 = { x: 4800, y: 6500 };
  const L1 = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  return korsatkichlar().map(k => {
    const x = k.xona, e = k.eshik;
    const eshik = e.devor === 'h' ? { x: (e.a + e.b) / 2, y: e.yuz } : { x: e.yuz, y: (e.a + e.b) / 2 };
    const ichkari = Math.max(...x.j.stullar.map(s => L1({ x: (s.x1 + s.x2) / 2, y: (s.y1 + s.y2) / 2 }, eshik)));
    const ky = KORIDOR_Y[x.koridor];
    const kP = { x: Math.min(eshik.x, 19000), y: ky }, tut = { x: kw.x, y: ky };
    const bosh = L1(eshik, kP) + L1(kP, tut);
    return { kod: k.kod, ichkari, gacha2: ichkari + bosh + L1(tut, zn2), gacha1: ichkari + bosh + L1(tut, su6) + L1(su6, zn1) };
  });
}

// ---------- devor ishlari hajmi ----------
export function ishlar() {
  const uz = w => Math.max(w.x2 - w.x1, w.y2 - w.y1) / 1000;
  const yangi = DEVORLAR.filter(w => w.holat === 'yangi');
  const buz = DEVORLAR.filter(w => w.holat === 'buziladi');
  return {
    yangiUz: yangi.reduce((t, w) => t + uz(w), 0),
    buzUz: buz.reduce((t, w) => t + uz(w), 0),
    yangiEshik: ESHIKLAR.filter(e => e.holat === 'yangi').length,
  };
}


// Xizmat xonalari (sotuv 6, admin 4, qolganlari 3 kishi) va koworking (kundalik ~35, tadbirda ~70 kishi)
export function xizmatHavo() {
  return XONALAR.filter(x => x.tur === 'xizmat').map(x => ({ kod: x.kod, nomi: x.nomi, odam: x.odam, ...havoHisobi(x, x.odam, x.odam * 0.1) }));
}
export function kwHavo() {
  const x = XONALAR.find(r => r.kod === 'KW');
  return { kundalik: havoHisobi(x, 35, 35 * 0.05), tadbir: havoHisobi(x, 70, 0.8) };
}

export const xonaMaydoni = sofMaydon;
