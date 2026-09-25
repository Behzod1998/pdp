# 02. Xonalar dasturi (dastlabki hisob)

> Bu fayl `xonalar_dasturi.py` orqali yaratilgan — qo'lda tahrirlamang.
> Raqamlar taxminlarga asoslangan va ochiq savollarga javob olingach
> qayta hisoblanadi (qarang: `01-loyiha-topshirigi.md`).

## Parametrlar

| Parametr | Qiymat | Izoh |
|---|---:|---|
| `talabalar` | 1 200 | oylik faol talabalar soni |
| `guruh` | 16 | bitta guruhdagi talabalar |
| `kun_turlari` | 2 | toq kunlar (Du-Chor-Ju) va juft kunlar (Se-Pay-Sha) |
| `smenalar` | 5 | kuniga dars vaqtlari: 09, 11, 14, 16, 18 |
| `band` | 0,80 | o'quv xonalaridan foydalanish koeffitsienti |
| `kovorking_ulushi` | 0,25 | darsdagi talabalarga nisbatan kovorking o'rinlari |
| `zal_orinlari` | 120 | tadbirlar zalidagi o'rinlar |
| `qavatlar` | 4 | yer usti qavatlari soni |
| `brutto` | 1,40 | netto -> brutto: koridor, zinapoya, lift, devorlar |

## Xonalar ro'yxati

| Zona | Xona | Soni | 1 ta, m² | Jami, m² | Izoh |
|---|---|---:|---:|---:|---|
| O'quv | Kompyuterli o'quv xonasi | 10 | 76,5 | 765 | 16 talaba + ustoz, 4,5 m²/o'rin |
| O'quv | Mentor / qo'shimcha dars xonasi | 4 | 20 | 80 | 4–6 kishi, har 3 o'quv xonasiga 1 ta |
| Jamoat | Qabulxona va kutish zali | 1 | 60 | 60 | resepshn, ota-onalar uchun kutish joyi |
| Jamoat | Kovorking (mustaqil ishlash) | 1 | 120 | 120 | 40 o'rin |
| Jamoat | Tadbirlar zali | 1 | 138 | 138 | 120 o'rin + sahna; meetup, demo day, ochiq darslar |
| Jamoat | Kafe / dam olish zonasi | 1 | 60 | 60 | choy-qahva, mikroto'lqinli pech |
| Jamoat | Namozxona | 2 | 18 | 36 | erkaklar va ayollar uchun alohida (ixtiyoriy) |
| Ma'muriy | Sotuv va qabul bo'limi | 1 | 36 | 36 | 6 ta konsultant |
| Ma'muriy | Filial rahbari kabineti | 1 | 18 | 18 |  |
| Ma'muriy | Ma'muriyat ofisi | 1 | 36 | 36 | o'quv bo'limi, buxgalteriya, kadrlar |
| Ma'muriy | Ustozlar xonasi | 1 | 56 | 56 | 14 o'rin |
| Ma'muriy | Uchrashuv xonasi | 2 | 15 | 30 | 6 kishilik |
| Xizmat va texnik | Server xonasi | 1 | 12 | 12 | alohida konditsioner, UPS |
| Xizmat va texnik | Sanitariya uzeli (unitazlar) | 12 | 3,5 | 42 | har qavatda 3 ta, 1 unitaz / 25 kishi |
| Xizmat va texnik | Imkoniyati cheklanganlar hojatxonasi | 4 | 5 | 20 | har qavatda 1 ta |
| Xizmat va texnik | Farrosh inventari xonasi | 4 | 4 | 16 | har qavatda 1 ta |
| Xizmat va texnik | Omborxona | 2 | 10 | 20 |  |
| Xizmat va texnik | Elektr shchitovaya | 1 | 12 | 12 |  |
| Xizmat va texnik | Issiqlik punkti | 1 | 20 | 20 |  |
| Xizmat va texnik | Ventilyatsiya kamerasi | 1 | 30 | 30 |  |
| | **Foydali (netto) maydon** | | | **1 607** | |

## Zonalar bo'yicha

| Zona | Netto, m² | Ulushi |
|---|---:|---:|
| O'quv | 845 | 53% |
| Jamoat | 414 | 26% |
| Ma'muriy | 176 | 11% |
| Xizmat va texnik | 172 | 11% |

## Xulosa

- Guruhlar soni: **75**, o'quv xonalari: **10**
- Eng yuqori bir vaqtdagi bandlik (tadbirlar zalisiz): **~245 kishi**
- Foydali (netto) maydon: **1 607 m²**
- Umumiy (brutto) maydon: **~2 250 m²** (koeffitsient 1,40)
- Bir qavat maydoni (4 qavat): **~560 m²**

## Stsenariylar

Faqat talabalar soni o'zgaradi, qolgan parametrlar yuqoridagidek.

| Talabalar | O'quv xonalari | Netto, m² | Brutto, m² | 1 qavat (4 qavat), m² |
|---:|---:|---:|---:|---:|
| 800 | 7 | 1 292 | ~1 810 | ~450 |
| 1 200 | 10 | 1 607 | ~2 250 | ~560 |
| 1 600 | 13 | 1 922 | ~2 690 | ~670 |
| 2 000 | 16 | 2 224 | ~3 110 | ~780 |
