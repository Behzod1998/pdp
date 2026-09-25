# PDP Academy — Xadra filiali, 2-qavat

Yangi joyni jihozlash loyihasi. Founder namunalari tartibida tayyorlangan: Beruniy filiali jihozlash rejasi va Quyluq filiali xonalar izohi.

## Hujjatlar (`chizma/`)

| Fayl | Mazmuni |
|---|---|
| `Xadra_2-qavat_taqdimot_reja_v1.0.pdf` / `.png` | A3 portret, namuna formatida (`manba/namuna-format.webp`): rangli reja, koworking zalining ikki rejimi (kundalik va tadbir), havo aylanishi, xonalar maydonlari |
| `PDP_Academy_-_Chizma_-_Xadra_filiali_2-qavat_v1.0.pdf` | A3, 1:100, 3 varaq: 1 — mavjud holat va o'zgarishlar, 2 — jihozlash rejasi, 3 — havo almashinuvi sxemasi |
| `Xadra_2-qavat_xonalar_izoh_v1.0.pdf` | A4, 11 bet: umumiy ko'rsatkichlar, 3D ko'rinishlar, har bir xona, havo almashinuvi, butun qavat masalalari, tasdiqlash uchun savollar |

## Asosiy yechim

Xonalarga bo'linish buyurtmachi yuborgan namuna (`manba/namuna-format.webp`) bo'yicha qilingan. O'lchamlar real chizmadan olingan.

- **Talab:** 22–24 o'rinli 6 ta xona, 18–20 o'rinli 1 ta xona, 4 kishilik admin/sotuv xonasi (15–20 m²). Ikkala zina va ular yonidagi kichik xonalar o'zgarmaydi.
- **Yuqori qator:** 1, 2, 3-xona (SR1–SR3), har biri 24 o'rin, 5.70–5.80 × 7.70 m.
- **Pastki qator:** 7, 6, 5-xona (SR7–SR5), har biri 24 o'rin, 5.70–5.80 × 7.70 m.
- **O'rta qator:** XZ1 — offline sotuv bo'limi (2 konsultant, mijoz stullari, kutish divani) va XZ2 — admin (2 ish o'rni). Ikkalasining K2 tomonidagi devori va eshigi shishadan: kirish zalidan chiqqan mijoz darhol ko'radi. XZ3, XZ4 — xizmat xonalari. O'ngda 4-xona (SR4) — sinf, 20 o'rin (6 + 6 + 6 + 2), L shaklida, derazasiz.
- **4-xona havosi:** o'ng devor qo'shni bino bilan umumiy, orqasida tor oraliq bor (egasining aytishicha). PV-4 panjaralari shu oraliqqa chiqariladi; oraliq eni joyida o'lchanadi.
- **Koridorlar:** ikkita gorizontal koridor K1 va K2, har biri 1500 mm. Ikkalasi ham koworking zaliga chiqadi.
- **Koworking / tadbirlar zali (KW):** chap qanotda, 70.5 m². Kundalik rejimda ~35 o'rin, tadbirda 66 o'rin.
- **Qolgan xonalar:** WC (A), WC (B), xo'jalik xonasi va 12-xona (17.6 m², hozircha zaxira) mavjud holicha qoladi.
- **Havo almashinuvi:** har bir sinfga alohida rekuperatorli PV qurilma, hisob 30 m³/soat har bir kishiga. Derazasiz xonalar (4-xona va xizmat xonalari) uchun mexanik ventilyatsiya majburiy.
- **Jami:** 7 xona, 164 o'rin. Avtomatik tekshiruv: to'qnashuv 0, doskani to'suvchi ustun 0.

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
node build.mjs       # chizma/ ichidagi barcha PDF va taqdimot PNG qayta yaratiladi; --png — boshqa varaqlarning rasmi ham
```

Playwright Chromium bilan o'rnatilgan bo'lishi kerak. Generator avval tekshiruvni bajaradi: partalar, devorlar, ustunlar, eshiklar va doskalar orasidagi to'qnashuvlar.

| Fayl | Vazifasi |
|---|---|
| `model.mjs` | geometriya: devorlar (mavjud / yangi / buziladi), ustunlar, derazalar, eshiklar, xonalar, parta to'ri |
| `tekshiruv.mjs` | xona ko'rsatkichlari, havo hisobi, avtomatik tekshiruv, evakuatsiya yo'li |
| `reja-svg.mjs` | reja chizmasi (SVG) |
| `varaqlar.mjs`, `izoh.mjs` | A3 varaqlar va A4 izoh (HTML) |
| `render-svg.mjs`, `taqdimot.mjs` | taqdimot uslubidagi rangli reja va A3 portret varaq |
| `sahna3d.html`, `sahna3d.mjs` | 3D ko'rinishlar (three.js) |
