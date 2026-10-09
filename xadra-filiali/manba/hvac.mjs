// 2-qavat: 11 xona (SR1–SR7, XZ1–XZ4) bo'yicha HVAC tahlili — tashqi havo sarfi, sovutish yuklamasi,
// «2 ta 96-ka (96 000 BTU/soat) konditsioner + 30% toza havo» sxemasining yetarliligi. Hisobot: A4 (build.mjs → PDF).
//
// Ma'lumot manbalari: maydon va o'rinlar — loyiha modeli (model.mjs, jihozlash rejasi); balandlik — buyurtmachi;
// qolgan ko'rsatkichlar — hisob farazlari (F), har biri jadvalda belgilangan va obyektda tasdiqlanadi.
import { LOYIHA, H, XONALAR, XIZMAT_JIHOZ, KW_TADBIR } from './model.mjs';
import { korsatkichlar, xonaMaydoni } from './tekshiruv.mjs';

// ---------- hisob farazlari (F) ----------
export const F = {
  tTashqi: 38, tIchki: 24,            // °C: yozgi hisobiy tashqi (taxminiy, KMK 2.01.01 bo'yicha tasdiqlanadi) va ichki
  tQish: -8, tIchkiQish: 20,          // °C: qishki hisobiy tashqi (taxminiy) va ichki
  rho: 1.2, c: 1.005,                 // havo zichligi, kg/m³; issiqlik sig'imi, kJ/(kg·K)
  odamS: 70, odamL: 45,               // W/kishi: o'tirgan, juda yengil ish (ASHRAE Fundamentals, 18-bob)
  yoritish: 8,                        // W/m², LED (≈500 lk)
  panel: 0.3,                         // kW: sinfdagi interaktiv panel
  ishJoyi: 0.15,                      // kW: kompyuter + monitor (xizmat xonalarida loyihadagi monitorli stollar)
  noutbuk: 0.05,                      // kW: bitta noutbuk (ssenariy — soni noma'lum)
  dT: 10,                             // K: xonaga beriladigan sovuq havo va xona harorati farqi (≈14 °C → 24 °C)
  tom: 0.025,                         // kW/m²: tom ostidagi xona uchun yuqori chegara (tom ustida 3-qavat bo'lmasa)
  devorOyna: [0.3, 1.7],              // kW: derazali tashqi devor (deraza o'lchami va yo'nalishi noma'lum) — oraliq
  co2Kishi: 0.018,                    // m³/soat CO₂ bir kishidan (o'tirgan kattalar va o'smirlar)
  co2Tashqi: 420,                     // ppm
  ulush: 0.30,                        // buyurtmachi: tashqi havo ulushi — umumiy havo sarfining 30%
  kwPerKm3: null,
};
// tashqi havoni yozda sovutish (sezilarli issiqlik), kW har 1 m³/soat uchun; Toshkentda tashqi havo quruq — yashirin qism kichik
F.kwPerKm3 = F.rho * F.c * (F.tTashqi - F.tIchki) / 3600;
const SUV = F.rho * F.c * F.dT / 3.6;     // W har 1 m³/soat: xonaga berilgan havo F.dT da olib ketadigan sezilarli issiqlik

// ---------- me'yorlar ----------
// Mahalliy (KMK 2.04.05 — SNiP 2.04.05 asosidagi «Isitish, ventilyatsiya va konditsionerlash»): jamoat va ma'muriy
// xonalarda 1 kishiga tashqi havo — tabiiy shamollatiladigan xonada 40, shamollatilmaydiganida 60 m³/soat; odamlar
// 3 soatgacha uzluksiz bo'ladigan zallarda 20 m³/soat ruxsat etiladi. Joriy tahriri loyihachi tomonidan tasdiqlanadi.
// ASHRAE 62.1-2022 (VRP): Vbz = Rp·Pz + Ra·Az; Voz = Vbz / Ez (shiftdan sovuq havo — Ez = 1.0; issiq havo — 0.8).
export const MEYOR = {
  sinf: { kmk: 20, kmkIzoh: "20 m³/soat·kishi (dars ≤ 3 soat)", Rp: 5, Ra: 0.6, ashraeIzoh: 'sinf (9+ yosh): 5 L/s·kishi + 0.6 L/s·m²' },
  ofis: { kmk: 60, kmkIzoh: "60 m³/soat·kishi (tabiiy shamollatishsiz)", Rp: 2.5, Ra: 0.3, ashraeIzoh: 'ofis: 2.5 L/s·kishi + 0.3 L/s·m²' },
  co2: 30,     // m³/soat·kishi — CO₂ ≈ 1000 ppm (EN 16798-1 II toifa darajasi atrofida)
};

export function hvacHisob() {
  const kor = korsatkichlar();
  const xonalar = [];
  kor.forEach(k => {
    const derazali = k.derazalar.length > 0;
    xonalar.push({
      kod: k.kod, nomi: k.kod.replace('SR', '') + '-xona', tur: 'sinf', A: k.A, odam: k.odam, odamIzoh: `${k.orin} o'quvchi + ustoz`,
      derazali, derazaUz: k.derazalar.reduce((t, d) => t + d.uz, 0) / 1000,
      tashqiDevor: k.kod === 'SR4' ? "o'ng devor — qo'shni bino bilan umumiy" : derazali ? (['SR1', 'SR2', 'SR3'].includes(k.kod) ? 'yuqori (fasad)' : 'past (fasad)') : '—',
      jihoz: F.panel, jihozIzoh: 'interaktiv panel', noutbuk: k.orin * F.noutbuk,
      env: k.kod === 'SR4' ? [0, 0.2 + F.tom * k.A] : [F.devorOyna[0], F.devorOyna[1] + F.tom * k.A],
    });
  });
  XONALAR.filter(x => x.tur === 'xizmat').forEach(x => {
    const z = XIZMAT_JIHOZ.find(j => j.kod === x.kod);
    const A = xonaMaydoni(x), odam = z.stullar.length, ish = z.stollar.filter(s => s.monitor).length;
    xonalar.push({
      kod: x.kod, nomi: x.nomi, tur: 'ofis', A, odam, odamIzoh: `${odam} o'rindiq (jihozlash rejasi)`,
      derazali: false, derazaUz: 0, tashqiDevor: "yo'q (ichki xona)",
      jihoz: ish * F.ishJoyi, jihozIzoh: ish ? `${ish} ta ish joyi (kompyuter)` : "noma'lum (noutbuklar)",
      noutbuk: x.kod === 'XZ3' ? odam * F.noutbuk : 0,
      env: [0, F.tom * A],
    });
  });

  xonalar.forEach(r => {
    const m = MEYOR[r.tur];
    r.H = H / 1000; r.V = r.A * r.H;
    r.kmk = r.odam * m.kmk;
    r.ashrae = (m.Rp * r.odam + m.Ra * r.A) * 3.6;
    r.ashraeQish = r.ashrae / 0.8;
    r.co2 = r.odam * MEYOR.co2;
    r.oaMin = Math.max(r.kmk, r.ashrae);
    r.karra = r.oaMin / r.V;
    r.odamS = r.odam * F.odamS / 1000; r.odamL = r.odam * F.odamL / 1000;
    r.yorit = r.A * F.yoritish / 1000;
    r.ichkiS = r.odamS + r.yorit + r.jihoz;
    r.ichki = r.ichkiS + r.odamL;
    r.oaYuk = r.oaMin * F.kwPerKm3;
    r.xonaS = [r.ichkiS + r.env[0], r.ichkiS + r.env[1]];                 // xonaning sezilarli yuklamasi (tashqi havosiz)
    r.jami = [r.ichki + r.env[0] + r.oaYuk, r.ichki + r.env[1] + r.oaYuk]; // xona + me'yoriy tashqi havo
    r.suv = r.xonaS.map(s => s * 1000 / SUV);                             // sovutish uchun kerakli havo sarfi, m³/soat
    r.oa30 = r.suv.map(v => v * F.ulush);                                  // shu havoning 30% i — tashqi havo
    r.zd = r.suv.map(v => r.oaMin / v);                                    // kerakli tashqi havo ulushi
    r.co2_30 = r.oa30.map(q => F.co2Tashqi + r.odam * F.co2Kishi / q * 1e6);
    r.co2Min = F.co2Tashqi + r.odam * F.co2Kishi / r.oaMin * 1e6;
    r.suvKerak = r.suv.map(v => Math.max(v, r.oaMin / F.ulush));            // 30% sxemada xonaga kerakli havo
  });

  const S = (f) => xonalar.reduce((t, r) => t + f(r), 0);
  const jam = {
    A: S(r => r.A), V: S(r => r.V), odam: S(r => r.odam), kmk: S(r => r.kmk), ashrae: S(r => r.ashrae), co2: S(r => r.co2),
    oaMin: S(r => r.oaMin), ichki: S(r => r.ichki), oaYuk: S(r => r.oaYuk), noutbuk: S(r => r.noutbuk),
    env: [S(r => r.env[0]), S(r => r.env[1])], xonaS: [S(r => r.xonaS[0]), S(r => r.xonaS[1])],
    jami: [S(r => r.jami[0]), S(r => r.jami[1])], suv: [S(r => r.suv[0]), S(r => r.suv[1])],
    suvKerak: [S(r => r.suvKerak[0]), S(r => r.suvKerak[1])],
  };
  jam.oaYukCo2 = jam.co2 * F.kwPerKm3;
  jam.suv30 = jam.oaMin / F.ulush;                   // 30% ulush bilan me'yoriy tashqi havo uchun umumiy havo sarfi
  jam.qishOA = jam.oaMin * F.rho * F.c * (F.tIchkiQish - F.tQish) / 3600;

  // Buyurtmachi (09.10): «2 ta 100-lik» — 2 ta «96-ka», ya'ni 96 000 BTU/soat (1 BTU/soat = 0.29307 W). Aniq quvvat — shildikdan.
  const kond = { nom: '96 000 BTU/soat («96-ka»)', btu: 96000, soni: 2 };
  kond.kw = kond.btu * 0.29307 / 1000;
  kond.jami = kond.soni * kond.kw;
  kond.issiq = kond.jami * 0.87;                     // 42–43 °C da ~13% kamayish (umumiy holat; aniq qiymat — model jadvalidan)
  // umumiy havo sarfi uchun mo'ljal: kanalli bloklarda odatda ~150–200 m³/soat har 1 kW (aniq — pasportdan)
  kond.havo = [kond.jami * 150, kond.jami * 200];
  kond.oa30 = kond.havo.map(v => v * F.ulush);
  // tashqi havo qanday berilishiga qarab konditsionerlarga tushadigan yuklama, kW
  const xona = [jam.ichki + jam.env[0], jam.ichki + jam.env[1]];       // xonalarning o'z issiqligi (tashqi havosiz)
  const ss = [
    { kod: 'A', nom: "Me'yoriy tashqi havo (" + Math.round(jam.oaMin) + " m³/soat) shu konditsionerlar orqali", yuk: jam.jami },
    { kod: 'B', nom: "Buyurtmachi sxemasi: 30% tashqi havo (odatiy havo sarfida " + kond.oa30.map(v => Math.round(v / 10) * 10).join('–') + " m³/soat — me'yordan kam)",
      yuk: [xona[0] + kond.oa30[0] * F.kwPerKm3, xona[1] + kond.oa30[1] * F.kwPerKm3] },
    { kod: 'C', nom: "Tashqi havo alohida rekuperatorli tizim bilan (issiqlik 55% qaytariladi), qolgani konditsionerlarda", yuk: [xona[0] + jam.oaYuk * 0.45, xona[1] + jam.oaYuk * 0.45] },
    { kod: 'D', nom: "Tashqi havo alohida tizim o'z sovutgichi bilan; konditsionerlar faqat xonalar issiqligini oladi", yuk: xona },
  ];
  ss.forEach(x => {
    x.noutbuk = [x.yuk[0] + jam.noutbuk, x.yuk[1] + jam.noutbuk];
    x.baho = kond.issiq >= x.noutbuk[1] ? 'yetarli' : kond.jami >= x.yuk[1] ? 'yetarli' : kond.jami < x.yuk[0] || kond.issiq < x.yuk[0] ? 'emas' : 'chegara';
  });
  return { F, MEYOR, xonalar, jam, kond, ss, xona };
}

// ---------- hisobot (A4) ----------
const n0 = v => Math.round(v).toLocaleString('en-US').replace(/,/g, ' ');
const n1 = v => v.toFixed(1);
const n2 = v => v.toFixed(2);
const or = (a, f = n1) => `${f(a[0])}–${f(a[1])}`;

const CSS = `
@page { size: A4; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
body { font-family: 'Liberation Sans', Arial, sans-serif; color: #222; font-size: 8.4pt; line-height: 1.38; }
.bet { width: 210mm; height: 297mm; padding: 11mm 11mm 12mm; position: relative; page-break-after: always; overflow: hidden; }
.bar { position: absolute; top: 0; left: 0; right: 0; height: 4mm; background: #1F3657; }
footer { position: absolute; bottom: 5mm; left: 11mm; right: 11mm; display: flex; justify-content: space-between; font-size: 6.6pt; color: #888; }
h1 { font-size: 15pt; color: #1F3657; margin: 2mm 0 1mm; }
h2 { font-size: 11pt; color: #1F3657; margin: 4mm 0 1.6mm; border-bottom: .3mm solid #1F3657; padding-bottom: .6mm; }
h3 { font-size: 9pt; margin: 2.5mm 0 1mm; color: #1f1f1f; }
p { margin-bottom: 1.4mm; } ul, ol { margin: 0 0 1.6mm 4.5mm; } li { margin-bottom: .6mm; }
.sub { color: #555; font-size: 8pt; }
table { width: 100%; border-collapse: collapse; font-size: 7.3pt; margin: 1mm 0 2mm; }
th { background: #1F3657; color: #fff; font-weight: 700; padding: .9mm 1mm; text-align: left; vertical-align: bottom; }
td { padding: .7mm 1mm; border-bottom: .2mm solid #ddd; vertical-align: top; }
td.r, th.r { text-align: right; white-space: nowrap; }
tr.jami td { font-weight: 700; background: #eef1f6; }
.f { color: #8a5a00; } .og { color: #b3261e; font-weight: 700; } .ok { color: #1d7a35; font-weight: 700; }
.xulosa { border-left: 1.4mm solid #1F3657; background: #f4f6fa; padding: 1.6mm 2.5mm; margin: 1.5mm 0 2.2mm; }
.xulosa b.v { display: inline-block; padding: .2mm 1.6mm; border-radius: .8mm; color: #fff; margin-right: 1.5mm; }
.v-emas { background: #b3261e; } .v-yetarli { background: #1d7a35; } .v-malumot { background: #8a5a00; } .v-hisob { background: #1F3657; }
.ikki { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
.kichik { font-size: 7pt; color: #555; }
`;
const xulosa = (tur, matn) => {
  const [cls, nom] = { emas: ['v-emas', 'YETARLI EMAS'], yetarli: ['v-yetarli', 'YETARLI'], malumot: ['v-malumot', "MA'LUMOT YETARLI EMAS"], hisob: ['v-hisob', 'HISOBLANDI'] }[tur];
  return `<div class="xulosa"><b class="v ${cls}">${nom}</b>${matn}</div>`;
};

export function hvacHtml() {
  const { xonalar: X, jam: J, kond: K, ss: SS, xona: XO } = hvacHisob();
  const ssBaho = { yetarli: '<span class="ok">yetarli</span>', emas: '<span class="og">yetarli emas</span>', chegara: '<span class="f">chegarada</span>' };
  let bet = 0;
  const sahifa = ichki => `<section class="bet"><div class="bar"></div>${ichki}<footer><span>${LOYIHA.brend} · ${LOYIHA.filial} · 2-qavat · HVAC tahlili · ${LOYIHA.versiya} · ${LOYIHA.sanaISO}</span><span>${++bet}</span></footer></section>`;
  const sinflar = X.filter(r => r.tur === 'sinf'), ofislar = X.filter(r => r.tur === 'ofis');
  const yomonSinf = sinflar.filter(r => r.oa30[1] < r.oaMin).length;

  // ---- 1-bet: kirish, mavjud ma'lumotlar, savollar ----
  const b1 = sahifa(`
    <div class="sub">${LOYIHA.brend} · ${LOYIHA.filial} · ${LOYIHA.manzil}</div>
    <h1>2-qavat: konditsionerlash va ventilyatsiya — texnik tahlil</h1>
    <div class="sub">11 xona: o'quv xonalari SR1–SR7 va xizmat xonalari XZ1–XZ4. Sxema: 2 ta «96-ka» (96 000 BTU/soat) «media» (ehtimol Midea brendi) konditsioneri, umumiy havo sarfining 30% i — tashqi (toza) havo. Dastlabki hisob: uskuna tanlash yoki xarid uchun asos emas.</div>

    <h2>1. Mavjud ma'lumotlar va aniqlashtirilishi kerak bo'lgan savollar</h2>
    <h3>1.1. «100-lik» atamasi</h3>
    <p>Buyurtmachi ma'lumoti: <i>«konditsioner 2 ta 100 talik 7000 $ ustanovka birga; vozduxovod 200 kv metr 7000 $»</i>. Buyurtmachi aniqlashtirdi (09.10): <b>«2 ta 100-lik» — 2 ta «96-ka»</b>, ya'ni 96 000 BTU/soat.</p>
    <table><tr><th>Ko'rsatkich</th><th class="r">1 ta</th><th class="r">2 ta</th></tr>
      <tr><td>Nominal sovutish quvvati, 96 000 BTU/soat × 0.293 W (tashqi 35 °C da)</td><td class="r">${n1(K.kw)} kW</td><td class="r">${n1(K.jami)} kW</td></tr>
      <tr><td>42–43 °C li kunlarda (~13% kam; aniq qiymat — model jadvalidan)</td><td class="r">~${n1(K.kw * 0.87)} kW</td><td class="r">~${n1(K.issiq)} kW</td></tr>
      <tr><td>Havo sarfi — mo'ljal (kanalli bloklarda 1 kW ga ~150–200 m³/soat; aniq — pasportdan)</td><td class="r">${or(K.havo.map(v => v / 2), n0)} m³/soat</td><td class="r">${or(K.havo, n0)} m³/soat</td></tr>
    </table>
    <p>Model kodi, aniq quvvat, havo sarfi, tashqi statik bosim va tashqi havo qabul qilish imkoniyati — ichki va tashqi blok shildigidan olinadi.</p>

    <h3>1.2. Loyihadan olingan ma'lumotlar</h3>
    <ul>
      <li><b>Maydonlar</b> — 2-qavat chizmasi (mavjud holat fotosi asosida, joyida o'lchanmagan), devorlar orasidagi sof maydon.</li>
      <li><b>Balandlik</b> — ${H / 1000} m (buyurtmachi: «bino balandligi»). Osma shift balandligi va kanallar uchun shift ostidagi bo'shliq <b>noma'lum</b>.</li>
      <li><b>Odamlar</b> — jihozlash rejasidagi o'rinlar: sinflarda o'quvchilar + 1 ustoz, xizmat xonalarida o'rindiqlar (XZ3 da rejada 9 o'rin, izohda 8 kishi — 9 olindi).</li>
      <li><b>Derazalar</b> — SR1–SR3 va SR5–SR7 da tashqi devorda; SR4 va XZ1–XZ4 da <b>deraza yo'q</b> (tabiiy shamollatishsiz). Derazalar o'lchami va dunyo tomonlari <b>noma'lum</b>.</li>
      <li><b>Uskunalar</b> — sinflarda interaktiv panel; XZ1, XZ2 da 2 tadan, XZ4 da 6 ta kompyuterli ish joyi (rejadagi monitorli stollar). Noutbuklar soni noma'lum — alohida ssenariy.</li>
    </ul>

    <h3>1.3. Aniqlashtirilishi kerak bo'lgan savollar</h3>
    <ol>
      <li>Konditsionerlar <b>mavjudmi yoki rejalashtirilganmi</b>? Aniq model, turi (kanalli / kolonna / kasseta / rooftop), quvvati, havo sarfi, statik bosimi.</li>
      <li>2 ta konditsioner faqat shu 11 xonagami yoki koworking (tadbirda ${KW_TADBIR.stullar.length} kishi), CEO xonasi va koridorlarga ham xizmat qiladimi? Hozirgi tahlil faqat 11 xona uchun.</li>
      <li>«30% toza havo» qanday beriladi: konditsionerning tashqi havo patrubkasi orqalimi yoki alohida fan bilanmi? Ifloslangan havo qayerdan chiqariladi (chiqarish tizimi)?</li>
      <li>Xonalardagi maksimal odamlar soni va dars jadvali: 7 sinf bir vaqtda to'ladimi?</li>
      <li>O'quvchilar noutbuk bilan ishlaydimi (har biri ~50 W)?</li>
      <li>2-qavat ustida qaysi xonalar ochiq tom ostida (3-qavat faqat ~11.9 × 12.3 m)? Derazalar qaysi tomonga qaragan, o'lchami, oyna turi, pardalar?</li>
      <li>Qishda isitish qanday: radiatorlarmi yoki shu konditsionerlarmi? Kanallar uchun osma shift qilinadimi va qaysi balandlikda?</li>
      <li>«200 m² vozduxovod» — kanal tunukasining maydonimi? Kanal sxemasi bormi?</li>
    </ol>
  `);

  // ---- 2-bet: jadval 1 (ma'lumotlar) va jadval 2 (tashqi havo) ----
  const qator1 = r => `<tr><td><b>${r.kod}</b></td><td>${r.nomi}</td><td class="r">${n1(r.A)}</td><td class="r">${n1(r.H)}</td><td class="r">${n0(r.V)}</td><td class="r">${r.odam}</td><td>${r.odamIzoh}</td><td>${r.derazali ? `bor (${n1(r.derazaUz)} m eni)` : "<span class='og'>yo'q</span>"}</td><td>${r.tashqiDevor}</td><td>${r.jihozIzoh}</td></tr>`;
  const qator2 = r => `<tr><td><b>${r.kod}</b></td><td class="r">${r.odam}</td><td class="r">${n1(r.A)}</td><td class="r">${n0(r.kmk)}</td><td class="r">${n0(r.ashrae)}</td><td class="r">${n0(r.co2)}</td><td class="r"><b>${n0(r.oaMin)}</b></td><td class="r">${n1(r.oaMin / r.odam)}</td><td class="r">${n2(r.karra)}</td><td class="r">${n0(r.co2Min)}</td><td class="r">${n0(r.ashraeQish)}</td></tr>`;
  const b2 = sahifa(`
    <h2>2. 11 ta xona bo'yicha hisob-kitob</h2>
    <h3>Jadval 1. Xonalar bo'yicha mavjud ma'lumotlar</h3>
    <table><tr><th>Kod</th><th>Xona</th><th class="r">A, m²</th><th class="r">H, m</th><th class="r">V, m³</th><th class="r">Odam</th><th>Odam manbai</th><th>Deraza</th><th>Tashqi devor</th><th>Issiqlik beruvchi uskuna</th></tr>
      ${X.map(qator1).join('')}
      <tr class="jami"><td colspan="2">Jami</td><td class="r">${n1(J.A)}</td><td></td><td class="r">${n0(J.V)}</td><td class="r">${J.odam}</td><td colspan="4"></td></tr>
    </table>
    <p class="kichik">Deraza eni — chizmadagi taxminiy joyi (balandligi noma'lum). H — buyurtmachi ma'lumoti; osma shift bo'lsa hajm kamayadi.</p>

    <h3>Jadval 2. Zarur tashqi havo sarfi, m³/soat</h3>
    <table><tr><th>Kod</th><th class="r">Odam</th><th class="r">A, m²</th><th class="r">KMK¹</th><th class="r">ASHRAE 62.1²</th><th class="r">CO₂ ≈ 1000 ppm³</th><th class="r">Me'yoriy min⁴</th><th class="r">1 kishiga</th><th class="r">Karra, 1/soat</th><th class="r">CO₂ min da, ppm</th><th class="r">Qishda (Ez 0.8)</th></tr>
      ${X.map(qator2).join('')}
      <tr class="jami"><td>Jami</td><td class="r">${J.odam}</td><td class="r">${n1(J.A)}</td><td class="r">${n0(J.kmk)}</td><td class="r">${n0(J.ashrae)}</td><td class="r">${n0(J.co2)}</td><td class="r">${n0(J.oaMin)}</td><td colspan="4"></td></tr>
    </table>
    <p class="kichik">¹ KMK 2.04.05 (SNiP 2.04.05 asosida): sinflar — ${MEYOR.sinf.kmkIzoh}; XZ1–XZ4 — ${MEYOR.ofis.kmkIzoh}. Joriy tahrir va ta'lim muassasalari uchun maxsus sanitariya talablari loyihachi tomonidan tasdiqlanadi.
      ² ASHRAE 62.1-2022: ${MEYOR.sinf.ashraeIzoh}; ${MEYOR.ofis.ashraeIzoh}; Ez = 1.0 (shiftdan sovuq havo). ³ 30 m³/soat·kishi — tavsiya darajasi (EN 16798-1 II toifa atrofida). ⁴ KMK va ASHRAE dan kattasi.
      CO₂ — barqaror holat: tashqi ${F.co2Tashqi} ppm + 18 L/soat·kishi.</p>
    ${xulosa('hisob', `<b>2-savol.</b> 11 xona uchun me'yoriy minimal tashqi havo — <b>${n0(J.oaMin)} m³/soat</b> (sinflar ${n0(sinflar.reduce((t, r) => t + r.oaMin, 0))}, xizmat xonalari ${n0(ofislar.reduce((t, r) => t + r.oaMin, 0))}); CO₂ ≈ 1000 ppm uchun — ${n0(J.co2)} m³/soat. Sinfda 1 kishiga ~${n0(sinflar[0].oaMin / sinflar[0].odam)} m³/soat; derazasiz xizmat xonalarida 60 m³/soat — chunki u yerda tabiiy shamollatish yo'q va xodimlar kun bo'yi o'tiradi.`)}
  `);

  // ---- 3-bet: jadval 3 (sovutish yuklamasi) va 5-savol ----
  const qator3 = r => `<tr><td><b>${r.kod}</b></td><td class="r">${n2(r.odamS)}</td><td class="r">${n2(r.odamL)}</td><td class="r">${n2(r.yorit)}</td><td class="r">${n2(r.jihoz)}</td><td class="r f">${or(r.env, n2)}</td><td class="r">${n2(r.oaYuk)}</td><td class="r"><b>${or(r.jami)}</b></td><td class="r f">+${n2(r.noutbuk)}</td></tr>`;
  const b3 = sahifa(`
    <h3>Jadval 3. Sovutish yuklamasi (yozgi hisobiy holat), kW</h3>
    <table><tr><th>Kod</th><th class="r">Odam, sezilarli</th><th class="r">Odam, yashirin</th><th class="r">Yoritish</th><th class="r">Uskuna</th><th class="r">Devor, oyna, tom (F)</th><th class="r">Tashqi havo (me'yoriy min)</th><th class="r">Jami</th><th class="r">Noutbuk bilan</th></tr>
      ${X.map(qator3).join('')}
      <tr class="jami"><td>Jami</td><td class="r">${n1(X.reduce((t, r) => t + r.odamS, 0))}</td><td class="r">${n1(X.reduce((t, r) => t + r.odamL, 0))}</td><td class="r">${n1(X.reduce((t, r) => t + r.yorit, 0))}</td><td class="r">${n1(X.reduce((t, r) => t + r.jihoz, 0))}</td><td class="r">${or(J.env)}</td><td class="r">${n1(J.oaYuk)}</td><td class="r">${or(J.jami)}</td><td class="r">+${n1(J.noutbuk)}</td></tr>
    </table>
    <p class="kichik"><b>Farazlar (F):</b> odam ${F.odamS} W sezilarli + ${F.odamL} W yashirin (o'tirgan, juda yengil ish — ASHRAE Fundamentals); yoritish ${F.yoritish} W/m² (LED); interaktiv panel ${F.panel} kW; kompyuterli ish joyi ${F.ishJoyi} kW; noutbuk ${F.noutbuk} kW.
      Tashqi havo: ${F.tTashqi} °C → ${F.tIchki} °C, ${n2(F.kwPerKm3 * 1000)} kW har 1000 m³/soat (Toshkentda yozda tashqi havo quruq — yashirin issiqlik ichki havodan kam, sovutishni sezilarli qism belgilaydi; hisobiy parametrlar KMK 2.01.01 bo'yicha tasdiqlanadi).
      <b>Devor, oyna, tom</b> — eng noaniq qism: pastki chegara — deraza shimolda yoki soyada, ustida 3-qavat; yuqori chegara — deraza g'arb/sharqda, pardasiz (+${F.devorOyna[1]} kW) va xona ochiq tom ostida (+${F.tom * 1000} W/m²).</p>

    <h3>5-savol. Yuklamaga ta'sir qiluvchi omillar</h3>
    <table><tr><th>Omil</th><th>11 xonadagi ulushi</th><th>Ta'siri</th></tr>
      <tr><td>Odamlar</td><td class="r">${n1(X.reduce((t, r) => t + r.odamS + r.odamL, 0))} kW</td><td>Asosiy ichki yuklama: ${J.odam} kishi × ${F.odamS + F.odamL} W. Sinflar zich (1 kishiga ~1.8 m²) — 1 m² ga ~65 W faqat odamlardan. Har bir qo'shimcha 10 kishi ≈ +1.2 kW va +200–300 m³/soat tashqi havo.</td></tr>
      <tr><td>Tashqi havo</td><td class="r">${n1(J.oaYuk)} kW</td><td>Me'yoriy ${n0(J.oaMin)} m³/soatni ${F.tTashqi} °C dan ${F.tIchki} °C gacha sovutish. Tashqi harorat har +1 °C ≈ +${n2(J.oaMin * F.rho * F.c / 3600)} kW. 42–43 °C li issiq kunlarda bu qism ~${n1(J.oaMin * F.rho * F.c * 18.5 / 3600)} kW ga yetadi; shu paytda konditsionerning o'z quvvati ham ~10–15% kamayadi. Toshkentda yozgi havo quruq, namlik yuklamasi asosan odamlardan; bahor va kuzdagi nam kunlarda tashqi havoning yashirin issiqligi ortadi.</td></tr>
      <tr><td>Uskunalar</td><td class="r">${n1(X.reduce((t, r) => t + r.jihoz, 0))} kW (+${n1(J.noutbuk)} noutbuk)</td><td>Interaktiv panellar va xizmat xonalaridagi kompyuterlar. Agar har o'quvchi noutbuk bilan ishlasa, sinfga +1.2 kW — sinf yuklamasining ~15–20% i.</td></tr>
      <tr><td>Yoritish</td><td class="r">${n1(X.reduce((t, r) => t + r.yorit, 0))} kW</td><td>LED bilan kichik; lyuminessent lampalar bo'lsa ~2 baravar.</td></tr>
      <tr><td>Quyosh va to'siqlar</td><td class="r">${or(J.env)} kW</td><td>Deraza yo'nalishi, o'lchami, pardalar va tom ostida bo'lishiga bog'liq — eng katta noaniqlik. G'arbga qaragan pardasiz deraza 1 m² ga ~300–350 W beradi; shimolda ~50 W. Ochiq tom ostidagi sinf +1 kW gacha.</td></tr>
    </table>
  `);

  // ---- 4-bet: konditsionerlar va 30% ----
  const qator4 = r => `<tr><td><b>${r.kod}</b></td><td class="r">${or(r.xonaS)}</td><td class="r">${or(r.suv, n0)}</td><td class="r">${or(r.oa30, n0)}</td><td class="r">${n0(r.oaMin)}</td><td class="r ${r.oa30[1] < r.oaMin ? 'og' : 'ok'}">${or(r.oa30.map(v => v / r.oaMin * 100), n0)}%</td><td class="r">${or(r.zd.map(z => z * 100).reverse(), n0)}%</td><td class="r">${or(r.co2_30.slice().reverse(), n0)}</td></tr>`;
  const sinfOA = sinflar.reduce((t, r) => t + r.oaMin, 0);
  const b4 = sahifa(`
    <h2>3. Ikki konditsionerning umumiy quvvati va havo sarfi</h2>
    <p>2 × 96 000 BTU/soat = <b>${n1(K.jami)} kW</b> nominal (42–43 °C da ~${n0(K.issiq)} kW). Konditsionerlarga tushadigan yuklama tashqi havo qanday berilishiga bog'liq — 4 ssenariy, 11 xona bir vaqtda band:</p>
    <table><tr><th>Ssenariy</th><th class="r">Yuklama, kW</th><th class="r">Noutbuk bilan, kW</th><th>${n1(K.jami)} kW bilan</th></tr>
      ${SS.map(x => `<tr><td><b>${x.kod}.</b> ${x.nom}</td><td class="r">${or(x.yuk, n0)}</td><td class="r">${or(x.noutbuk, n0)}</td><td>${ssBaho[x.baho]}</td></tr>`).join('')}
    </table>
    <p class="kichik">Xonalarning o'z issiqligi (odamlar, yoritish, uskuna, devor, oyna, tom) — ${or(XO, n0)} kW; oraliq derazalar va tom noma'lumligidan (Jadval 3). «Yetarli» — nominal quvvat yuklamaning yuqori chegarasidan ham katta (noutbuklar bilan va 42–43 °C li kunlarda tekshiriladi); «yetarli emas» — 42–43 °C da yuklamaning pastki chegarasiga ham yetmaydi; «chegarada» — nominal quvvat oraliq ichida: derazalar shimolda yoki soyada va xonalar ustida 3-qavat bo'lsa yetadi, aks holda issiq kunlarda kam. Havo sarfi — kanalli bloklar uchun odatiy nisbat, pasport qiymati emas.</p>
    ${xulosa(SS[1].baho === 'emas' ? 'emas' : 'malumot', `<b>1-savol — 2 ta 96-ka (${n1(K.jami)} kW) 11 xonani sovutadimi.</b> Xonalarning o'z issiqligi uchun <b>yetarli</b> (${or(XO, n0)} kW, D ssenariy; o'quvchilar noutbuk bilan ishlasa ${or(SS[3].noutbuk, n0)} kW — 42–43 °C li kunlarda chegarada). Me'yoriy tashqi havoni ham shu ikkala blok sovutsa — <b>yetarli emas</b> (${or(J.jami, n0)} kW kerak, A ssenariy). Buyurtmachi sxemasida (30%, B) yuklama ${or(SS[1].yuk, n0)} kW — <b>chegarada</b>: aniq javob uchun derazalar (o'lcham, yo'nalish) va tom ma'lumoti kerak; bu sxemada tashqi havo me'yordan kam (4-bo'lim). Bundan tashqari, 2 blokning havosi 11 xonaga yuklamasiga qarab taqsimlanishi kerak (klapanlar, termostatlar) — aks holda ba'zi xonalar sovuq, ba'zilari issiq bo'ladi.`)}

    <h2>4. 30% tashqi havo ulushining yetarliligi</h2>
    <p>Har xonaga beriladigan havo uning <b>sezilarli issiqlik yuklamasi</b> bo'yicha taqsimlanadi (havo ${F.dT} K sovuqroq beriladi). 30% sxemada har xonaga tushadigan tashqi havo = shu havoning 30% i. Odam ko'p, issiqlik nisbatan kam bo'lgan xonalarda bu me'yordan kam bo'ladi.</p>
    <h3>Jadval 4. Xonalar bo'yicha 30% sxema</h3>
    <table><tr><th>Kod</th><th class="r">Sezilarli yuk, kW</th><th class="r">Sovutish havosi</th><th class="r">Shundan 30%</th><th class="r">Me'yoriy min</th><th class="r">Ta'minlanadi</th><th class="r">Kerakli ulush</th><th class="r">CO₂, ppm</th></tr>
      ${X.map(qator4).join('')}
      <tr class="jami"><td>Jami</td><td class="r">${or(J.xonaS)}</td><td class="r">${or(J.suv, n0)}</td><td class="r">${or(J.suv.map(v => v * F.ulush), n0)}</td><td class="r">${n0(J.oaMin)}</td><td class="r">${or(J.suv.map(v => v * F.ulush / J.oaMin * 100), n0)}%</td><td class="r">${or(J.suv.map(v => J.oaMin / v * 100).reverse(), n0)}%</td><td></td></tr>
    </table>
    <p class="kichik">Havo sarflari — m³/soat. CO₂ — 30% sxemadagi tashqi havo bilan barqaror holat (tashqi ${F.co2Tashqi} ppm). Sinf hajmi ~150 m³, vaqt doimiysi 0.3–0.5 soat — 1.5–2 soatlik darsda CO₂ shu darajaga yetadi.</p>
    ${xulosa('emas', `<b>3-savol.</b> 30% ulush me'yoriy tashqi havoni faqat umumiy havo sarfi kamida <b>${n0(J.suv30)} m³/soat</b> bo'lganda beradi (${n0(J.oaMin)} ÷ 0.30). 11 xonani sovutish uchun kerakli havo esa ${or(J.suv, n0)} m³/soat — ya'ni 30% bilan tashqi havo ${or(J.suv.map(v => v * F.ulush / J.oaMin * 100), n0)}% ta'minlanadi. ${yomonSinf} ta sinfda tashqi havo kerakli ulushi 30% dan katta (${or([Math.min(...sinflar.map(r => r.zd[1])), Math.max(...sinflar.map(r => r.zd[0]))].map(z => z * 100), n0)}%); derazasiz xizmat xonalarida kerakli ulush ${n0(Math.min(...ofislar.map(r => r.zd[1])) * 100)}–${n0(Math.max(...ofislar.map(r => r.zd[0])) * 100)}% — XZ1–XZ3 da tashqi havo sovutish uchun kerakli havoning o'zidan ham ko'p yoki unga teng. 30% sxemada CO₂ sinflarda ~${n0(Math.min(...sinflar.map(r => r.co2_30[1])))}–${n0(Math.max(...sinflar.map(r => r.co2_30[0])))} ppm, XZ3 da ~${n0(ofislar.find(r => r.kod === 'XZ3').co2_30[1])}–${n0(ofislar.find(r => r.kod === 'XZ3').co2_30[0])} ppm (sifat mezoni: ≤ 1000 ppm yaxshi, ~1400 ppm gacha qoniqarli).`)}
  `);

  // ---- 5-bet: birgalikda, yechimlar, o'lchovlar ----
  const b5 = sahifa(`
    ${xulosa('emas', `<b>4-savol — ventilyatsiya va sovutish birgalikda.</b> Ventilyatsiya qismi <b>yetarli emas</b>: odatiy havo sarfida 2 ta 96-kaning 30% i ${or(K.oa30, n0)} m³/soat, kerak — ${n0(J.oaMin)} m³/soat. Tashqi havoni shu bloklar orqali me'yorgacha oshirsa, uning yozgi yuklamasi ${n1(J.oaYuk)} kW bo'ladi va umumiy talab ${or(J.jami, n0)} kW ga yetadi — ${n1(K.jami)} kW dan ko'p (A ssenariy). Ya'ni me'yoriy tashqi havo va sovutishni faqat shu ikki blok bilan birga ta'minlab bo'lmaydi; tashqi havo alohida berilsa, sovutish yetadi yoki chegarada (C, D ssenariylar).`)}

    <h2>5. Zarur qo'shimcha uskunalar va muhandislik yechimlari (ko'rib chiqish uchun)</h2>
    <p class="kichik">Bu yerda xarid yoki montaj bo'yicha qat'iy tavsiya berilmaydi — quyidagilar loyihachi bilan ko'rib chiqiladigan variantlar.</p>
    <ol>
      <li><b>Alohida tashqi havo tizimi (6-savol).</b> 30% sxema me'yorni bajarmagani uchun tashqi havo alohida berilishi kerak bo'ladi: kiritish-chiqarish qurilmasi (rekuperatorli), sarfi ~${n0(J.oaMin)} m³/soat (me'yoriy) — ${n0(J.co2)} m³/soat (CO₂ ≈ 1000 ppm). Variantlar: bitta markaziy qurilma, sinflar va xizmat xonalari uchun 2 ta, yoki xona bo'yicha. Rekuperator (samaradorligi 50–70%) yozgi tashqi havo yuklamasini ~${n1(J.oaYuk)} kW dan ~${n1(J.oaYuk * 0.4)}–${n1(J.oaYuk * 0.5)} kW gacha, qishki isitishni ~${n0(J.qishOA)} kW dan ~${n0(J.qishOA * 0.3)}–${n0(J.qishOA * 0.5)} kW gacha kamaytiradi.</li>
      <li><b>Chiqarish (so'rish).</b> Berilgan tashqi havo hajmida ifloslangan havo chiqarilishi kerak — aks holda xonalarda ortiqcha bosim bo'ladi, eshiklar qiyin yopiladi, havo koridorlarga siqiladi. Har xonada so'rish panjarasi va chiqarish kanali; sanuzel chiqarishi alohida.</li>
      <li><b>Sovutish quvvati.</b> 2 ta 96-ka (${n1(K.jami)} kW) xonalarning o'z issiqligiga (${or(XO, n0)} kW) yetadi. Tashqi havo rekuperator orqali berilsa, yuklama ${or(SS[2].yuk, n0)} kW — issiq kunlar uchun tekshiriladi; tashqi havo shu bloklar orqali me'yorda berilsa — ${or(J.jami, n0)} kW, quvvat kam.</li>
      <li><b>Zonalash va boshqarish.</b> 11 xonaning yuklamasi turlicha va o'zgaruvchan (dars bor-yo'qligi). 2 ta blok bilan har xonani alohida boshqarish uchun havo klapanlari (VAV) yoki xona bo'yicha bloklar kerak bo'ladi. Har sinfda CO₂ va harorat datchigi.</li>
      <li><b>Havo taqsimlash.</b> Kanallarning yo'nalishi va sxemasini buyurtmachi hal qiladi; tahlil faqat har xonaga kerakli havo sarfini beradi (Jadval 2 va 4). Har xonaga diffuzor va so'rish panjarasi kerak bo'ladi. Kanal kesimi shovqin bo'yicha tanlanadi: magistralda ≤ 4–5 m/s, xonaga yaqinda ≤ 2.5–3 m/s, sinfda shovqin ≤ 35 dBA. Devor va koridordan o'tishda yong'inga qarshi klapanlar. «200 m² vozduxovod» kanal sxemasi bilan tekshiriladi.</li>
      <li><b>Filtr va qishki rejim.</b> Toshkent havosi changli — tashqi havoga kamida G4 + F7 filtrlar. Qishda (hisobiy ~${F.tQish} °C) tashqi havoni isitish va muzlashdan himoya kerak; konditsionerning isitish quvvati sovuqda kamayadi.</li>
      <li><b>11 xonadan tashqari.</b> Koworking (tadbirda 68 kishi — ~1 400–2 000 m³/soat tashqi havo, ~10–13 kW), CEO xonasi va koridorlar alohida hisoblanadi.</li>
    </ol>

    <h2>6. HVAC mutaxassisi obyektda o'lchashi kerak bo'lgan parametrlar</h2>
    <div class="ikki"><ul>
      <li>Konditsionerlar: shildik (model, kW, havo sarfi, statik bosim, kuchlanish), tashqi bloklar joyi va freon trassasi uzunligi, kondensat chiqarish joyi.</li>
      <li>Xonalar: aniq o'lchamlar, pol — shift balandligi, to'sinlar, osma shift va kanallar uchun bo'shliq balandligi.</li>
      <li>Derazalar: o'lchami, dunyo tomoni, oyna turi (bir / ikki kamerali, past emissiyali), ochiladimi, soyabon va pardalar.</li>
      <li>To'siqlar: tashqi devor qalinligi va materiali, tom (qaysi xonalar ochiq tom ostida), o'ng devor ortidagi oraliq eni.</li>
    </ul><ul>
      <li>Mavjud ventilyatsiya: shaxtalar, ularning kesimi va tortishi, fasadda tashqi havo olish va chiqarish uchun joy (bir-biridan ≥ 8–10 m).</li>
      <li>Ichki holat: dars paytida CO₂, harorat va namlik (datchik bilan 1–2 kun), xonadagi haqiqiy odamlar soni va uskunalar.</li>
      <li>Elektr ta'minoti: ajratilgan quvvat (kW), uch fazali liniya borligi.</li>
      <li>Shovqin va tebranish: tashqi bloklar yonidagi qo'shnilar, sinflardagi fon shovqini.</li>
    </ul></div>

    <h2>Yakuniy xulosalar</h2>
    <table><tr><th>Savol</th><th>Xulosa</th><th>Asos</th></tr>
      <tr><td>1. Sovutish: 2 ta 96-ka (${n1(K.jami)} kW)</td><td><span class="ok">yetarli</span> / <span class="og">yetarli emas</span> / <span class="f">ma'lumot yetarli emas</span></td><td>Xonalarning o'z issiqligi (${or(XO, n0)} kW) — yetarli. Me'yoriy tashqi havo ham shu bloklardan (${or(J.jami, n0)} kW) — yetarli emas. 30% sxema (${or(SS[1].yuk, n0)} kW) — chegarada: derazalar va tom ma'lumoti kerak.</td></tr>
      <tr><td>2. Zarur tashqi havo</td><td><b>hisoblandi</b></td><td>Me'yoriy minimal ${n0(J.oaMin)} m³/soat, tavsiya ${n0(J.co2)} m³/soat (Jadval 2).</td></tr>
      <tr><td>3. 30% ulush har xonaga</td><td class="og">yetarli emas</td><td>Buning uchun umumiy havo ≥ ${n0(J.suv30)} m³/soat kerak, sovutish havosi ${or(J.suv, n0)} m³/soat. Xizmat xonalarida kerakli ulush ${n0(Math.min(...ofislar.map(r => r.zd[1])) * 100)}–${n0(Math.max(...ofislar.map(r => r.zd[0])) * 100)}%.</td></tr>
      <tr><td>4. Ventilyatsiya va sovutish birgalikda</td><td class="og">yetarli emas</td><td>30% bilan tashqi havo ${or(K.oa30, n0)} m³/soat, kerak ${n0(J.oaMin)}; me'yorgacha oshirilsa sovutish quvvati kam.</td></tr>
      <tr><td>6. Qo'shimcha yechim kerakmi</td><td><b>ha</b> (ventilyatsiya), sovutish — pasportdan keyin</td><td>Alohida tashqi havo va chiqarish tizimi, xona bo'yicha boshqarish, havo taqsimlash kanallari.</td></tr>
    </table>
  `);
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${LOYIHA.brend} · ${LOYIHA.filial} — HVAC tahlili</title><style>${CSS}</style></head><body>${b1}${b2}${b3}${b4}${b5}</body></html>`;
}

// node hvac.mjs — natijalarni konsolga chiqaradi
if (import.meta.url === `file://${process.argv[1]}`) {
  const { xonalar, jam, kond, ss } = hvacHisob();
  xonalar.forEach(r => console.log(r.kod, r.odam, r.A.toFixed(1), 'OA', Math.round(r.kmk), Math.round(r.ashrae), Math.round(r.oaMin),
    'yuk', r.jami.map(v => v.toFixed(1)).join('–'), 'suv', r.suv.map(Math.round).join('–'), 'zd', r.zd.map(z => (z * 100).toFixed(0)).join('–'),
    'co2', r.co2_30.map(Math.round).join('–')));
  console.log('JAMI', JSON.stringify(jam, (k, v) => typeof v === 'number' ? Math.round(v * 10) / 10 : v));
  console.log(kond.nom, kond.kw.toFixed(2), kond.jami.toFixed(1), kond.issiq.toFixed(1), kond.havo.map(Math.round), kond.oa30.map(Math.round));
  ss.forEach(x => console.log(x.kod, x.yuk.map(v => v.toFixed(1)).join('–'), x.noutbuk.map(v => v.toFixed(1)).join('–'), x.baho));
}
