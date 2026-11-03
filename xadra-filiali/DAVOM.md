# Xadra filiali — ishni davom ettirish uchun (holat: 03.11.2026)

Branch: `claude/pdp-academy-xadra-flialni-building-id9rwi` (hammasi push qilingan). Manba — `manba/`, natijalar — `chizma/`,
xarajatlar — `hisob/Xadra_xarajatlar_v1.2.xlsx`. Fayllar va vazifalari — `README.md`. Ish qoidalari — repo ildizidagi `CLAUDE.md`.

## Joriy holat (buyurtmachi qarorlari bilan)

**1-qavat** — kirish zali: resepshn (o'ng devor bo'ylab, L shakl), 2 ta turniket (mavjud), logotiplar.

**2-qavat** (`manba/model.mjs`) — 7 sinf, 162 o'rin (4-xona — 18 o'rin):
- XZ1 offline sotuv: eshigi **g'arbiy chetda, koworking tomonda** (18.10). XZ2 admin, XZ3 ustozlar.
- XZ4 call-markaz: 4 + 1 ish o'rni; g'arbiy burchakda **tarmoq shkafi 600 × 600 (NVR, router, switch)** (18.10).
- Koridorlar K1, K2 kladovkagacha (x = 21.0 m); kladovka KL1/KL2; 11 ta 1 m suriladigan eshik; koworking va sahna; CEO; ayollar WC.
- **Konditsioner** (`vent-chizma.mjs`, 2-varaq): KK1, KK2 (96k) kladovka shifti ustida, tashqi devorga taqalgan; magistral koridor
  bo'ylab, 18 diffuzor; 4-xonaga ikkala blokdan bittadan. Tashqi havo 30% — 3-xona ko'cha tomoni (sharqiy burchak, oyna ustidan),
  kanal sharqiy devor bo'ylab blok bilan devor orasidan bloklar orqasiga; 3- va 4-xonada GKL qutida (18.10).
  **Buyurtmachi (19.10): konditsioner tizimini umuman o'zgartirma.**
- **Vitechka** (1-varaq): magistral **2-xona, ustozlar, admin va 6-xona markazidan** (x = 15.0 m), VV1 va chiqish — 2-xona fasadida
  (19.10); yon xonalardan fasad bo'ylab va o'rta devor yonidan tarmoqlar; 18 panjara, VV1 3 000 m³/soat.

**3-qavat** (`manba/qavat3.mjs`) — 5-xona o'quv xonasi (24 o'rin), erkaklar hojatxonasi + tahorat; koridorda yangi GKL to'siq
devor (zinadan hojatxona eshigi ko'rinmasin, 18.10). 3-qavat elektri mavjud — chizilmaydi.
- **Erkaklar hojatxonasi (03.11):** kirganda chapda 1.50 m quyma rakovina (2 chanoq), so'ng unitazli kabina (1.00 m);
  eshikdan 2.50 m dan keyin pol +0.30 supa (+0.15 pog'ona, usti kafel) — 3 ta chashagenli kabina va taxorat joyi (3 jo'mrak).
  Devorlar — plastik marmar panel, 3 variant (`Xadra_3-qavat_WC_panellar_v1.2.pdf`; teksturalar `manba/teksturalar/`).
  Asosiy 3D varaqda devorlar kafel ko'rinishida.

**Tizim chizmalari** (`manba/tizim-chizma.mjs`, 18.10; qurilmalar joyi — buyurtmachi belgilagan, kodda koordinatalar bilan):
kamera 24 (har biriga Cat6, XZ4 shkafi); internet 16 ta 2 portli RJ-45 (30 sm) + 6 Wi-Fi; yong'in 53 datchik (50 + kladovkalar 2 +
3-qavat tamburi 1), 5 shleyf, pult 1-qavat resepshnda, IPR/sirena/tablo/avariya me'yor bo'yicha; elektr — 78 rozetka + 7 doska
rozetkasi (1.6 m), 13 vyklyuchatel, chiroqlar 3D dagidek, har sinfga alohida difavtomat, mavjud shit 6-xonada (kirishda o'ngda).

**Xarajatlar:** Excel (umumiy ~96 000 $ kutilmagan xarajatlar bilan, 18.10). Yong'in — buyurtmachi summasi (18 mln so'm);
internet va elektr — Toshkent taxminiy narxlari.

## Ochiq savollar (buyurtmachidan javob kutilmoqda)

1. NVR narxi (840 $) — 16 kanallikmi? 24 kamera uchun 32 kanal kerak.
2. Mavjud shitning kirish avtomati va bo'sh joyi (o'rnatilgan quvvat ~46 kW, shundan konditsionerlar 20 kW).
3. Yong'in uchun 18 mln so'm yangi miqdorlarni qoplaydimi?
4. Provayder optikasi qayerdan kiradi; kabellarni zina bo'ylab (S1 — asosiy zina, S2 — ZN1) o'tkazishga ruxsat.
5. Kanalli konditsioner modeli: hisob bo'yicha har blokka ~130k BTU kerak (96k yetmaydi); 30% tashqi havoda CO₂ yuqori.
6. Founder tanlovlari: koridor oxiri logoli/logosiz; shisha devor A/B; 1 m suriladigan eshik.
7. Rotband cheki — buyurtmachi yuborganini aytdi, lekin sessiyaga kelmagan; qayta yuborishi so'ralgan.
8. Hojatxona paneli: qaysi variant (1/2/3), narxi; Excel'dagi devor kafeli o'rniga panel qo'yilsinmi.
9. Supa chegarasi (eshikdan 2.50 m) va unitaz kabinasi kengligi (1.00 m) to'g'rimi.

## Qayta yig'ish (yangi muhitda)

```sh
cd xadra-filiali/manba
npm install                        # three, pdf-lib; Playwright Chromium kerak (cloud muhitda o'rnatilgan)
pip install openpyxl               # xarajatlar.py uchun; qayta hisoblash — LibreOffice (xlsx skill'ining recalc.py skripti)
node build.mjs                     # barcha rejalar, ish chizmasi, vent, tizim chizmalari + tekshiruv (xatolar 0 bo'lishi kerak)
python3 xarajatlar.py              # hisob/Xadra_xarajatlar_v1.2.xlsx, keyin recalc
node albom.mjs                     # 3D varaqlar va albom (50 bet); 3-qavat panel varaqlari uchun avval blender3.py --panel 1..3
```

3D: Python 3.11 venv'da `pip install bpy==4.2.0`; `node blender2-malumot.mjs > 2q.json && python blender2.py 2q.json ../chizma/3d --faqat <ko'rinishlar>`
(ko'rinish nomlari — `blender2.py` dagi `KOR`; bitta ichki ko'rinish ~6 daqiqa). Xona/diffuzor/panjara o'zgarsa — ta'sirlangan
ko'rinishlarni qayta render qilib, keyin `node albom.mjs`.
