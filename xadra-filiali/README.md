# PDP Academy — Xadra filiali yangi binosi

Xadra filiali uchun yangi binoni loyihalash bo'yicha ishchi hujjatlar.

## Hujjatlar

| Fayl | Mazmuni |
|---|---|
| [`01-loyiha-topshirigi.md`](01-loyiha-topshirigi.md) | Loyiha topshirig'i: maqsad, foydalanuvchilar, zonalar, texnik talablar, ochiq savollar |
| [`02-xonalar-dasturi.md`](02-xonalar-dasturi.md) | Xonalar dasturi: xonalar soni va maydoni, umumiy maydon, stsenariylar |
| [`xonalar_dasturi.py`](xonalar_dasturi.py) | Xonalar dasturini hisoblaydigan skript (barcha taxminlar shu yerda) |

## Dastlabki natija

Taxminiy parametrlar bilan (1 200 faol talaba, 16 kishilik guruhlar, 4 qavat):
**10 ta o'quv xonasi**, foydali maydon **~1 600 m²**, umumiy maydon **~2 250 m²**.
Bu raqamlar ochiq savollarga javob olingach aniqlashtiriladi.

## Bosqichlar

- [ ] **0. Talablarni aniqlash** — topshiriq va xonalar dasturi *(hozir shu bosqich)*
  - [x] Topshiriq qoralamasi
  - [x] Xonalar dasturi va stsenariylar
  - [ ] Ochiq savollarga javoblar va parametrlarni yangilash
- [ ] **1. Uchastka / bino** — tanlash va tahlil, arxitektura-rejalashtirish topshirig'i (APZ),
  muhandislik tarmoqlariga texnik shartlar, geodezik va geologik tadqiqotlar
- [ ] **2. Eskiz loyiha** — qavatlar rejasi, hajm va fasad, interyer konsepsiyasi, dastlabki smeta
- [ ] **3. Loyiha hujjatlari** — arxitektura, konstruksiya, muhandislik tizimlari
  (elektr, isitish-ventilyatsiya-konditsioner, suv-kanalizatsiya, kam tokli tizimlar),
  yong'in xavfsizligi; ekspertiza
- [ ] **4. Ruxsatnoma va pudratchi** — qurilishga ruxsat, pudratchi tanlash
- [ ] **5. Qurilish** — texnik va mualliflik nazorati
- [ ] **6. Jihozlash va ochilish** — mebel, IT jihozlar, sinov, foydalanishga topshirish

## Xonalar dasturini qayta hisoblash

Parametrlarni `xonalar_dasturi.py` boshida o'zgartiring yoki buyruq satrida bering:

```sh
python3 xonalar_dasturi.py > 02-xonalar-dasturi.md               # asosiy variant
python3 xonalar_dasturi.py --talabalar 1600 --qavatlar 5         # boshqa stsenariy
python3 xonalar_dasturi.py --help                                # barcha parametrlar
```
