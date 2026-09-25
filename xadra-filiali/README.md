# PDP Academy — Xadra filiali, 2-qavat

Yangi joyni jihozlash loyihasi. Founder namunalari tartibida tayyorlangan: Beruniy filiali jihozlash rejasi va Quyluq filiali xonalar izohi.

## Hujjatlar (`chizma/`)

| Fayl | Mazmuni |
|---|---|
| `PDP_Academy_-_Chizma_-_Xadra_filiali_2-qavat_v1.0.pdf` | A3, 1:100, 3 varaq: 1 — mavjud holat va o'zgarishlar, 2 — jihozlash rejasi, 3 — havo almashinuvi sxemasi |
| `Xadra_2-qavat_xonalar_izoh_v1.0.pdf` | A4, 11 bet: umumiy ko'rsatkichlar, 3D ko'rinishlar, har bir xona, havo almashinuvi, butun qavat masalalari, tasdiqlash uchun savollar |

## Asosiy yechim

- **Talab:** 22–24 o'rinli 6 ta xona, 18–20 o'rinli 1 ta xona, 4 kishilik admin/sotuv xonasi (15–20 m²). Ikkala zina va ular yonidagi kichik xonalar o'zgarmaydi.
- **SR1–SR6** — eski 8, 9, 10, 13, 14, 15-xonalar o'rnida, har biri 24 o'rin: 6×4, Beruniy standarti.
- **SR7** — eski 7 va 11-xonalar o'rnida, 20 o'rin: 5×4 (2 + 3 bloklar). Derazalar o'quvchilarning chap tomonida.
- **ADM** — 12-xona (17,6 m²), 4 ish o'rni. Xona mavjud holicha qoladi.
- **K1** (1500) koridori o'rta devor bo'ylab SR1–SR6 ni bog'laydi. **K2** (1500) koridori ZN2 zinasini (asosiy kirish), sanuzel blokini va ZN1 zinasini bog'laydi.
- **Havo almashinuvi:** har sinfga alohida rekuperatorli PV qurilma, hisob 30 m³/soat har bir kishiga. Toza havo doska tomonga beriladi, orqa tomondan so'riladi. Har sinfga 2 ta konditsioner.
- **Jami:** 7 sinf, 164 o'rin. Avtomatik tekshiruv: to'qnashuv 0, doskani to'suvchi ustun 0.

## Taxminlar (joyida o'lchanadi)

O'lchamlar mavjud holat chizmasining fotosidan olingan (`manba/mavjud-holat-2-qavat.jpg`). Quyidagilar taxminiy:

- derazalar joyi;
- toza balandlik — 3,0 m;
- devor qalinliklari;
- U8 va U9 ustunlari (fotoda ko'rinmaydi);
- dunyo tomonlari.

## Qayta yig'ish

O'lcham yoki talab o'zgarsa, `manba/model.mjs` tahrirlanadi. Keyin quyidagi buyruqlar ishga tushiriladi:

```sh
cd manba
npm install          # three.js (3D ko'rinishlar uchun)
node build.mjs       # chizma/ ichidagi ikkala PDF qayta yaratiladi; --png — varaqlarning rasmi ham
```

Playwright Chromium bilan o'rnatilgan bo'lishi kerak. Generator avval tekshiruvni bajaradi: partalar, devorlar, ustunlar, eshiklar va doskalar orasidagi to'qnashuvlar.

| Fayl | Vazifasi |
|---|---|
| `model.mjs` | geometriya: devorlar (mavjud / yangi / buziladi), ustunlar, derazalar, eshiklar, xonalar, parta to'ri |
| `tekshiruv.mjs` | xona ko'rsatkichlari, havo hisobi, avtomatik tekshiruv, evakuatsiya yo'li |
| `reja-svg.mjs` | reja chizmasi (SVG) |
| `varaqlar.mjs`, `izoh.mjs` | A3 varaqlar va A4 izoh (HTML) |
| `sahna3d.html`, `sahna3d.mjs` | 3D ko'rinishlar (three.js) |
