# 01. Loyiha topshirig'i (dastlabki)

**Holati:** qoralama · **Sana:** 2026-09-25

Bu hujjat PDP Academy Xadra filiali yangi binosini loyihalash uchun boshlang'ich
topshiriq. U arxitektor/loyiha tashkilotiga beriladi va [ochiq savollarga](#8-ochiq-savollar)
javob olingach yangilanib boriladi.

## 1. Maqsad

IT ta'limga mo'ljallangan zamonaviy filial binosini loyihalash: kompyuterli o'quv
xonalari, mustaqil ishlash maydoni, tadbirlar zali va ma'muriy qism bitta binoda,
talabalar uchun qulay, xavfsiz va "IT kompaniya ofisi" muhitini beradigan tarzda.

## 2. Bino foydalanuvchilari

| Guruh | Kimlar | Bino ulardan nimani talab qiladi |
|---|---|---|
| Talabalar | maktab o'quvchilari, oliygoh talabalari, ishlayotgan kattalar | dars, mustaqil ishlash, dam olish |
| Ustozlar va mentorlar | asosiy ustozlar, support/assistentlar | o'quv xonalari, ustozlar xonasi, qo'shimcha dars xonalari |
| Ma'muriyat | filial rahbari, sotuv/qabul, o'quv bo'limi, buxgalteriya | ofislar, uchrashuv xonalari |
| Ota-onalar va mehmonlar | yangi mijozlar, ota-onalar, tadbir ishtirokchilari | qabulxona, kutish zali, tadbirlar zali |

## 3. Ish rejimi (taxmin)

- Guruhlar haftada 3 kun o'qiydi: **toq kunlar** (Du-Chor-Ju) yoki **juft kunlar** (Se-Pay-Sha).
- Kuniga 5 ta dars vaqti (09:00, 11:00, 14:00, 16:00, 18:00), har biri ~2 soat.
- Bino ish vaqti taxminan 08:30–21:00; dam olish kunlari tadbirlar.

Shu jadval asosida bitta o'quv xonasi 8 tagacha guruhga xizmat qiladi
(2 kun turi × 5 dars vaqti × 0,8 bandlik). Batafsil hisob:
[`02-xonalar-dasturi.md`](02-xonalar-dasturi.md).

## 4. Funksional zonalar va joylashuv

| Zona | Tarkibi |
|---|---|
| O'quv | kompyuterli o'quv xonalari, mentor/qo'shimcha dars xonalari |
| Jamoat | qabulxona, kovorking, tadbirlar zali, kafe, namozxona |
| Ma'muriy | sotuv bo'limi, rahbar kabineti, ma'muriyat, ustozlar xonasi, uchrashuv xonalari |
| Xizmat va texnik | server, texnik xonalar, omborlar, sanitariya uzellari |

Joylashuv tamoyillari:

- **1-qavat** — ko'p odam oqimi bo'ladigan joylar: qabulxona, sotuv bo'limi, kafe,
  tadbirlar zali (chiqish yo'liga yaqin).
- **Yuqori qavatlar** — tinch zona: o'quv xonalari va kovorking.
- Ma'muriyat alohida qanotda yoki bitta qavatda jamlanadi.
- Har qavatda: sanitariya uzeli, farrosh xonasi, kichik dam olish burchagi.
- Server xonasi suv quvurlari o'tmaydigan joyda, iloji boricha binoning markazida.

## 5. Texnik talablar

### O'quv xonalari
- Tabiiy yorug'lik; ekranlarga quyosh tushmasligi uchun jalyuzi yoki rulonli pardalar.
- Har bir o'rinda kamida 2 ta rozetka, stol ostida kabel kanali.
- Proyektor yoki katta ekran (75" va undan katta), oq doska.
- Xonalar orasida shovqin izolyatsiyasi.
- Mexanik ventilyatsiya va konditsioner: odamlar va kompyuterlar ko'p issiqlik
  chiqaradi, Toshkentda yozda harorat +40 °C dan oshadi.

### IT infratuzilma
- Strukturalashtirilgan kabel tizimi (SKS), har o'quv xonasida Wi-Fi nuqtasi.
- Ikki mustaqil internet provayderi, optik kirish.
- Server xonasi: alohida konditsioner, UPS, avtomatik yong'in o'chirish.

### Xavfsizlik
- Videokuzatuv, kirish nazorati (turniket: karta yoki yuzni aniqlash).
- Yong'in signalizatsiyasi, ovozli ogohlantirish, me'yor bo'yicha evakuatsiya yo'llari.

### Inklyuzivlik
- Kirishda pandus, lift, keng eshiklar, har qavatda imkoniyati cheklanganlar uchun hojatxona.

### Konstruksiya va energiya
- Toshkent seysmik faol hudud: konstruktiv yechim seysmik me'yorlar va uchastkaning
  geologik tadqiqoti asosida tanlanadi.
- Issiqlik izolyatsiyasi, energiya tejovchi derazalar, LED yoritish.
- Tomda quyosh panellari varianti ko'rib chiqilsin.

### Interyer
- PDP brendbukiga mos interyer, ochiq va yorug' makonlar.

## 6. Me'yoriy hujjatlar

Loyiha O'zbekiston Respublikasining amaldagi shaharsozlik normalari va qoidalari
(ShNQ/KMK), sanitariya va yong'in xavfsizligi qoidalariga mos bo'lishi shart.
Dastlabki ro'yxat — **amaldagi tahrirlarini litsenziyali loyiha tashkiloti tekshiradi**:

- ShNQ 2.08.02-09 "Jamoat binolari va inshootlari"
- KMK 2.01.02-04 "Binolar va inshootlarning yong'in xavfsizligi"
- ShNQ 2.01.03-19 "Seysmik hududlarda qurilish"
- Kompyuter bilan ishlash joylari uchun sanitariya qoidalari va me'yorlari (SanQvaM)

## 7. Taxminlar

Barcha raqamli taxminlar (talabalar soni, guruh hajmi, dars jadvali, qavatlar soni,
maydon me'yorlari) bitta joyda — [`xonalar_dasturi.py`](xonalar_dasturi.py) faylining
boshida. Ular hozircha taxminiy va quyidagi savollarga javob olingach almashtiriladi.

## 8. Ochiq savollar

Loyihaning keyingi bosqichi shu savollarga bog'liq.

**A. Uchastka va bino**
1. Yangi qurilishmi yoki mavjud binoni rekonstruksiya qilish / moslashtirishmi?
2. Aniq manzil, yer maydoni, kadastr hujjatlari bormi? Qavatlar soni bo'yicha cheklov bormi?
3. Avtoturargoh uchun nechta joy kerak?

**B. Sig'im va ta'lim modeli**
4. Filialda nechta faol talaba rejalashtirilgan — ochilishda va 3–5 yildan keyin?
5. Qaysi yo'nalishlar o'qitiladi, guruh hajmi qancha?
6. Talabalar markaz kompyuterlarida ishlaydimi yoki o'z noutbuklari bilan keladimi?
7. Dars jadvali: toq/juft kunlar, kuniga nechta dars vaqti, dars davomiyligi?

**C. Qo'shimcha maydonlar**
8. Tadbirlar zali kerakmi, necha kishilik?
9. Kafe, namozxona, dam olish yoki sport zonasi kerakmi?
10. Binoda boshqa faoliyat ham bo'ladimi (masalan, ijaraga beriladigan joylar)?

**D. Tashkiliy**
11. Budjet chegarasi va rejalashtirilgan ochilish sanasi?
12. Loyihani qaysi litsenziyali loyiha tashkiloti bajaradi — tanlanganmi?
13. Qarorlarni kim tasdiqlaydi?
