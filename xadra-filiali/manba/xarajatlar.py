# Xarajatlar jadvali (Excel): chizmadagi yangi devorlar, shisha, bambuk panel, interaktiv doska, perila,
# shisha eshiklar, yoritish, videokuzatuv, logotiplar, matli plyonka, yong'in xavfsizligi, buzish ishlari va
# 10% kutilmagan xarajat; 1-qavat (resepshn, logotiplar), sotuv va admin xonalari mebeli, koridor doskalari, koworking sahnasi — taxminiy narxlar.
# So'mdagi narxlar «Narxlar» varag'idagi kurs bo'yicha dollarga o'tkaziladi.
# Uzunliklar model.mjs dan (xarajat-malumot.mjs orqali), narx va balandliklar «Narxlar» varag'ida —
# ularni Excelda o'zgartirsa, butun hisob formulalar bilan qayta hisoblanadi.
#   python3 xarajatlar.py            → ../hisob/Xadra_xarajatlar_v1.2.xlsx (1, 2 va 3-qavat)
import json
import subprocess
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

BU = Path(__file__).resolve().parent
CHIQISH = BU.parent / 'hisob' / 'Xadra_xarajatlar_v1.2.xlsx'

d = json.loads(subprocess.check_output(['node', str(BU / 'xarajat-malumot.mjs')], text=True))

XONALAR = [
    ('Q1', "1-qavat — kirish zali (resepshn, turniket)"),
    ('SR1', "1-xona"), ('SR2', "2-xona"), ('SR3', "3-xona"), ('SR4', "4-xona"),
    ('SR5', "5-xona"), ('SR6', "6-xona"), ('SR7', "7-xona"),
    ('XZ1', "Offline sotuv (XZ1)"), ('XZ2', "Admin (XZ2)"), ('XZ3', "Ustozlar xonasi (XZ3)"), ('XZ4', "Call-markaz (XZ4)"),
    ('X12', "CEO xonasi (12-xona)"),
    ('K1', "K1 koridori"), ('K2', "K2 koridori"), ('KL1', "Kladovka (K1 oxiri)"), ('KL2', "Kladovka (K2 oxiri)"),
    ('KW', "Koworking zali"), ('ZL', "Kirish zali"),
    ('ZINA', "Zinapoya"), ('BQ', "Butun qavat (umumiy ishlar)"), ('YQ', "3-qavat 5-xona — o'quv xonasi (24 o'rin)"),
    ('HJ', "Hojatxonalar (3-qavat erkaklar, 2-qavat ayollar)"),
]
NOM = dict(XONALAR)
BOLIM = [("1-qavat: kirish zali", ['Q1']),
         ("2-qavat: o'quv xonalari", ['SR1', 'SR2', 'SR3', 'SR4', 'SR5', 'SR6', 'SR7']),
         ("2-qavat: ofis xonalari", ['XZ1', 'XZ2', 'XZ3', 'XZ4', 'X12']),
         ("2-qavat: umumiy joylar", ['K1', 'K2', 'KL1', 'KL2', 'KW', 'ZL', 'ZINA', 'BQ']),
         ("3-qavat va hojatxonalar", ['YQ', 'HJ'])]
KORIDOR = {'XZ1': 'K2', 'XZ2': 'K2', 'XZ3': 'K1', 'XZ4': 'K1'}   # 14.10: XZ1, XZ2 — K2 tomonda (yonma-yon); XZ3, XZ4 — K1 tomonda
UMUMIY = {'K1', 'K2', 'KW', 'ZL'}

# ---------- Narxlar varag'i: kataklar ----------
N = {}  # nom → katak manzili
NARX_QATORLAR = [
    ('shisha', "Shisha devor", 55, "$/m²", "Buyurtmachi"),
    ('gkl', "Gips karton devor (bir tomoni)", 12, "$/m²", "Buyurtmachi; devorning har tomoni alohida hisoblanadi"),
    ('bambuk', "Bambuk panel", 15.5, "$/m²", "Buyurtmachi"),
    ('doska', "Interaktiv doska", 1032, "$/dona", "Buyurtmachi; 7 ta shu qavat sinflariga + 1 ta yuqori qavatdagi sinfga = 8 ta"),
    ('perila', "Perila", 84, "$/m", "Buyurtmachi"),
    ('perilaUz', "Perila uzunligi", 24, "m", "Buyurtmachi"),
    ('yorKatta', "Yoritish — koridor va koworking (har biriga)", 336, "$/joy", "Buyurtmachi: K1, K2 koridorlari va koworking zali"),
    ('yorXona', "Yoritish — xona (har biriga)", 168, "$/xona", "Buyurtmachi: 7 ta o'quv xonasi, 4 ta ofis xonasi va CEO xonasi"),
    ('kamera', "Videokamera", 40, "$/dona", "Buyurtmachi"),
    ('kameraSoni', "Videokameralar soni", d['tizim']['kamera'], "dona", "Buyurtmachi (18.10): joylari belgilandi — 2-qavat 20, 3-qavat 3, 1-qavat 1 (Xadra_tizim_kamera)"),
    ('kameraOrn', "Kamera o'rnatish (har biri)", 21, "$/dona", "Buyurtmachi"),
    ('nvr', "NVR (videoregistrator)", 840, "$/dona", "Buyurtmachi; 24 kamera uchun 32 kanalli NVR kerak — narxi 16 kanalliki bo'lsa, almashtiring"),
    ('kabel', "Kamera kabellari (jami, 16 kamera uchun)", 303, "$/komplekt", "Buyurtmachi: jami summa"),
    ('kabelUlush', "Kamera kabellari — kamera soniga mutanosib", '=C{kameraSoni}/16', "komplekt",
     f"Hisob: buyurtmachi summasi 16 kamera uchun; chizma bo'yicha Cat6 ~{d['tizim']['kameraM']} m (24 kamera)"),
    # 18.10: past tokli va elektr tizimlari (tizim-chizma.mjs) — narxlar TAXMIN (Toshkent bozori), miqdorlar chizmadan
    ('poeSw', "PoE switch 24 port (kameralar uchun, ≥ 370 W)", 280, "$/dona", "TAXMIN — Toshkent bozori"),
    ('shkaf18', "Tarmoq shkafi 18U, pol, 600 × 600 (PDU, polka, organayzer bilan) — NVR, router, switch", 220, "$/dona", "TAXMIN"),
    ('ups', "UPS 1.5 kVA (tarmoq shkafi uchun)", 180, "$/dona", "TAXMIN"),
    ('router', "Router (2 WAN, ≥ 1 Gbit/s)", 200, "$/dona", "TAXMIN"),
    ('sw48', "Switch 48 port, gigabit (8 tasi PoE+ — Wi-Fi uchun)", 350, "$/dona", "TAXMIN"),
    ('patch', "Patch-panel 24 port Cat6 (patch-kordlar bilan)", 60, "$/dona", "TAXMIN"),
    ('patchSoni', "Patch-panellar soni", 3, "dona", "Internet 2 (32 + 6 port), kamera 1"),
    ('rj45', "RJ-45 rozetka, 2 portli, Cat6 (podrozetnik va ramka bilan)", 120000, "so'm/dona", "TAXMIN — Toshkent bozori"),
    ('rj45Soni', "RJ-45 rozetkalar soni (poldan 30 sm)", d['tizim']['rj'], "dona", "Buyurtmachi (18.10): 2-qavat 14, 3-qavat 1, 1-qavat 1"),
    ('ap', "Wi-Fi nuqtasi — shiftga, PoE, Wi-Fi 6", 130, "$/dona", "TAXMIN"),
    ('apSoni', "Wi-Fi nuqtalari soni", d['tizim']['ap'], "dona", "Buyurtmachi (18.10): 2-qavat 5, 3-qavat 1"),
    ('cat6', "Cat6 U/UTP LSZH kabeli", 6000, "so'm/m", "TAXMIN — Toshkent (305 m quti ~1.8 mln so'm)"),
    ('cat6Uz', "Cat6 uzunligi — internet va Wi-Fi", d['tizim']['netM'], "m", "Tizim chizmasidan: har portga alohida kabel; burilish, tushish va zaxira kiritilgan"),
    ('netMontaj', "Internet montaji (kabel tortish, rozetka, patch-panelga ulash, test)", 60000, "so'm/port", "TAXMIN"),
    ('netPort', "Internet portlari soni", 2 * d['tizim']['rj'] + d['tizim']['ap'], "port", "RJ-45 × 2 + Wi-Fi"),
    ('lotok', "Kabel lotogi 100 × 50, perforatsiyali, qopqoqli (shift ostida, osmalar bilan)", 55000, "so'm/m", "TAXMIN"),
    ('ltUz', "Past tokli lotok uzunligi", d['tizim']['ltM'], "m", "Tizim chizmasidan (2-qavat koridorlari, koworking, 3- va 1-qavat)"),
    ('elUz', "Kuch lotogi uzunligi", d['tizim']['elM'], "m", "Tizim chizmasidan (koridorlar, koworking)"),
    ('k25', "Kabel VVGng-LS 3×2.5 (rozetkalar)", 15000, "so'm/m", "TAXMIN — Toshkent"),
    ('k25Uz', "VVGng-LS 3×2.5 uzunligi", d['tizim']['k25'], "m", "Elektr chizmasidan (guruhlar R1–R13, zaxira bilan)"),
    ('k15', "Kabel VVGng-LS 3×1.5 (yoritish, VV1)", 10000, "so'm/m", "TAXMIN"),
    ('k15Uz', "VVGng-LS 3×1.5 uzunligi", d['tizim']['k15'], "m", "Elektr chizmasidan (Y1–Y10, VV1)"),
    ('k54', "Kabel VVGng-LS 5×4 (KK1, KK2 — tashqi bloklarga)", 45000, "so'm/m", "TAXMIN"),
    ('k54Uz', "VVGng-LS 5×4 uzunligi", d['tizim']['k54'], "m", "Elektr chizmasidan (kladovkadan tomga stoyak bilan)"),
    ('gofra', "Gofra quvur Ø20 (devorda, xona ichida)", 1500, "so'm/m", "TAXMIN"),
    ('gofraUz', "Gofra quvur uzunligi", d['tizim']['gofra'], "m", "Elektr chizmasidan (xona ichidagi qism)"),
    ('rozetka', "Rozetka 2P+E (podrozetnik bilan), shu jumladan doska rozetkasi 1.6 m", 45000, "so'm/dona", "TAXMIN"),
    ('rozSoni', "Rozetkalar soni", d['tizim']['rozetka'] + d['tizim']['doskaR'], "dona", f"Buyurtmachi (18.10): {d['tizim']['rozetka']} oddiy (2-qavat 78, 1-qavat 2) + {d['tizim']['doskaR']} doska (1.6 m)"),
    ('vykl', "Vyklyuchatel (podrozetnik bilan)", 40000, "so'm/dona", "TAXMIN"),
    ('vyklSoni', "Vyklyuchatellar soni", d['tizim']['vykl'], "dona", "Buyurtmachi (18.10): 7 sinf, 4 xizmat xonasi, K1, K2"),
    ('difavt', "Difavtomat C16, 30 mA (har sinf rozetkasiga alohida)", 220000, "so'm/dona", "TAXMIN"),
    ('difSoniE', "Difavtomatlar soni", d['tizim']['difavt'], "dona", "Rozetka guruhlari R1–R13"),
    ('avt1', "Avtomat 1P C10/C16", 45000, "so'm/dona", "TAXMIN"),
    ('avt1Soni', "1P avtomatlar soni", d['tizim']['avt1'], "dona", "Yoritish Y1–Y10, VV1, zaxira 2"),
    ('avt3', "Avtomat 3P C25 (KK1, KK2)", 180000, "so'm/dona", "TAXMIN"),
    ('shitQuti', "Qo'shimcha shit qutisi 36 modul (mavjud shitda joy bo'lmasa)", 450000, "so'm/dona", "TAXMIN — joyida aniqlanadi"),
    ('elMontaj', "Elektr montaji (nuqta: rozetka, vyklyuchatel, chiroq, kuch liniyasi; shtroba, gofra)", 50000, "so'm/nuqta", "TAXMIN — Toshkent"),
    ('elNuqta', "Elektr nuqtalari soni", d['tizim']['rozetka'] + d['tizim']['doskaR'] + d['tizim']['vykl'] + d['tizim']['chiroq'] + 3, "nuqta",
     f"Rozetka {d['tizim']['rozetka'] + d['tizim']['doskaR']}, vyklyuchatel {d['tizim']['vykl']}, chiroq {d['tizim']['chiroq']}, kuch liniyasi 3"),
    ('logo', "Logotiplar — 2-qavat (jami)", 2500, "$/komplekt", "Buyurtmachi: jami summa. Koridor oxiridagi 2 ta yorituvchi logotip shu summaga kirgan deb olindi — alohida bo'lsa, qo'shing"),
    ('kurs', "Dollar kursi", 11900, "so'm/$", "Buyurtmachi; so'mdagi narxlar shu kurs bo'yicha $ ga o'tadi"),
    ('plyonka', "Matli plyonka (shisha devorga)", 800000, "so'm/dona", "Buyurtmachi"),
    ('plyonkaSoni', "Matli plyonka soni", 8, "dona", "Buyurtmachi"),
    ('yongin', "Yong'in xavfsizligi (signalizatsiya, o't o'chirgich, belgilar, avariya chiroqlari)", 18000000, "so'm/komplekt",
     f"Buyurtmachi: jami summa. Chizma (18.10): {d['tizim']['datchik']} datchik, {d['tizim']['ipr']} IPR, {d['tizim']['sirena']} sirena, {d['tizim']['tablo']} tablo, {d['tizim']['avariya']} avariya chirog'i, PPK; kabel ~{d['tizim']['yonM1'] + d['tizim']['yonM2']} m"),
    ('buzish', "Devor buzish", 50000, "so'm/m²", "Buyurtmachi"),
    ('chiqindi', "Qurilish chiqindisini olib chiqish", 1200000, "so'm/komplekt", "Buyurtmachi: jami summa"),
    ('chashagen', "Chashagen", 700000, "so'm/dona", "Buyurtmachi"),
    ('chashagenSoni', "Chashagen soni", 3, "dona", "Buyurtmachi: 3 ta erkaklar (3-qavat); ayollar hojatxonasi 2 kabinali, unitazli (09.10)"),
    ('unitaz', "Unitaz", 1200000, "so'm/dona", "Buyurtmachi"),
    ('unitazSoni', "Unitaz soni", 3, "dona", "Buyurtmachi: 1 ta erkaklar, 2 ta ayollar"),
    ('rakovina', "Rakovina", 650000, "so'm/dona", "Buyurtmachi"),
    ('rakovinaSoni', "Rakovina soni", 4, "dona", "Buyurtmachi: 2 ta erkaklar hojatxonasida, 2 tasi ayollarnikida (har bir tamburda)"),
    ('mustahab', "Mustahab", 200000, "so'm/dona", "Buyurtmachi"),
    ('mustahabSoni', "Mustahab soni", 6, "dona", "Har bir kabinaga: erkaklar 4 ta, ayollar 2 ta (09.10)"),
    ('taxoratSm', "Taxorat smesiteli", 400000, "so'm/dona", "Buyurtmachi"),
    ('taxoratSmSoni', "Taxorat smesiteli soni", 4, "dona", "Buyurtmachi: 3 tasi erkaklar taxorat joyida, 1 tasi ayollarnikida"),
    ('rakovinaSm', "Rakovina smesiteli", 400000, "so'm/dona", "Buyurtmachi"),
    ('rakovinaSmSoni', "Rakovina smesiteli soni", 4, "dona", "Buyurtmachi: har bir rakovinaga"),
    ('tochka', "Santexnika nuqtasi (usta ishi)", 1000000, "so'm/nuqta", "Buyurtmachi"),
    ('tochkaSoni', "Santexnika nuqtalari soni", 16, "nuqta", "Buyurtmachi"),
    ('kafel', "Kafel (material)", 100000, "so'm/m²", "Buyurtmachi"),
    ('kafelUsta', "Kafel yotqizish (usta)", 100000, "so'm/m²", "Buyurtmachi"),
    ('kafelDevor', "Kafel — erkaklar hojatxonasi devori", 58, "m²", "Buyurtmachi"),
    ('kafelPol', "Kafel — erkaklar hojatxonasi poli", 16, "m²", "Buyurtmachi"),
    ('kabina', "Hojatxona kabinasi", 1200000, "so'm/dona", "Buyurtmachi"),
    ('kabinaSoni', "Hojatxona kabinalari soni", 4, "dona", "Buyurtmachi: erkaklar hojatxonasi (3-qavat)"),
    ('issiqQuvur', "Issiq suv quvuri", 25000, "so'm/m", "Buyurtmachi"),
    ('issiqUz', "Issiq suv quvuri uzunligi", 40, "m", "Buyurtmachi"),
    ('sovuqQuvur', "Sovuq suv quvuri", 12000, "so'm/m", "Buyurtmachi «12 0000» deb yozgan — 12 000 deb olindi (issiq suv quvuridan arzon); tekshiring"),
    ('sovuqUz', "Sovuq suv quvuri uzunligi", 40, "m", "Buyurtmachi"),
    ('aksessuar', "Quvur aksessuarlari (fitinglar)", 5000, "so'm/dona", "Buyurtmachi"),
    ('aksessuarSoni', "Quvur aksessuarlari soni", 100, "dona", "Buyurtmachi: jami 500 000 so'm"),
    ('kanal', "Kanalizatsiya quvuri (40 m) va otvodlar", 4000000, "so'm/komplekt", "Buyurtmachi: jami summa"),
    # 16.10: rekuperatorlar va splitlar o'rniga — koridor oxiridagi kladovka shifti ustida 2 ta kanalli konditsioner (30% tashqi havo)
    ('kk', "Kanalli konditsioner 96 000 BTU (ichki kanalli blok, tashqi blok, tashqi havo aralashtirish kamerasi)", 5000, "$/dona",
     "TAXMIN — chizmada 96 000 BTU deb olingan; issiq kunda yetmaydi (~130 000 BTU kerak, vent-chizma 2-varaq) — model tanlangach almashtiring"),
    ('kkSoni', "Kanalli konditsionerlar soni", 2, "dona", "KK1 (K1 oxiri), KK2 (K2 oxiri) — kladovka shifti ustida; orqasida tashqi havo kanali (sharqiy devor bo'ylab)"),
    ('kanalM', "Havo kanali (vozduxovod), 1 m", 300000, "so'm/m", "Buyurtmachi (12.10)"),
    ('kanalUz', "Havo kanallari uzunligi", d['kanalUz'], "m",
     f"Kanallar rejasidan: {d['kanalChizma']} m (berish ~{d['vent']['berish']}, tashqi havo ~{d['vent']['toza']}, vitechka ~{d['vent']['vitechka']}) + 10% burilish va ulanishlar"),
    ('diffuzor', "Shift diffuzori 4 tomonga (600 × 600 / 450 × 450), adapter kamerasi va rostlash klapani bilan", 60, "$/dona", "TAXMIN"),
    ('difSoni', "Diffuzorlar soni", d['vent']['dif'], "dona", "Kanallar rejasidan: sinflarga 2 tadan, xizmat xonalariga 1 tadan"),
    ('sorPanjara', "So'rish panjarasi Ø200 (vitechka), klapan bilan", 15, "$/dona", "TAXMIN"),
    ('sorSoni', "So'rish panjaralari soni", d['vent']['sor'], "dona", "Kanallar rejasidan"),
    ('qPanjara', "Qaytish (2 × 600 × 300, koridor shiftida) va tashqi havo panjaralari, tomdagi chiqish soyaboni", 400, "$/komplekt", "TAXMIN"),
    ('vv', "Vitechka ventilyatori VV1 — kanalli, 3 000 m³/soat (~400 Pa), shovqin so'ndirgich bilan", 900, "$/dona", "TAXMIN"),
    # 16.10: koridor eshiklari 1 m, yonga suriladigan (founder); koridor oxirida kladovka eshiklari
    ('surmaMex', "Suriladigan eshik mexanizmi: yuqori rels va qopqog'i (~2.1 m), roliklar, soft-close, pastki yo'naltirgich, tutqichlar", 150, "$/dona", "TAXMIN — founder (16.10): eshiklar 1 m, Damas eshigi kabi yonga suriladi"),
    ('eshKL', "Kladovka eshigi 800 × 2100 — yashirin (ko'rinmas korobka, bargi koridor oxiri paneli bilan bir xil qoplanadi, bosib ochiladi)", 350, "$/dona", "TAXMIN — logoli variant; logosiz variantda oddiy eshik ~$150"),
    ('kond3', "Konditsioner — 3-qavat o'quv xonasi", 1000, "$/dona", "Buyurtmachi"),
    # Taxminiy narxlar (buyurtmachi: «narxi va qanday mebel bo'lishi noma'lum — taxminan narx qo'yib berasan»)
    ('stolOfis', "Ofis stoli 140 × 70 (LDSP, tumba bilan)", 220, "$/dona", "TAXMIN — Toshkent bozori; mebelchi narxi bilan almashtiring"),
    ('kreslo', "Ofis kreslosi (to'r suyanchiqli)", 130, "$/dona", "TAXMIN"),
    ('mijozStul', "Mijoz / mehmon stuli", 60, "$/dona", "TAXMIN"),
    ('divan', "Divan, 2–3 o'rinli (kutish joyi)", 450, "$/dona", "TAXMIN"),
    ('shkaf', "Hujjat shkafi / stellaj", 350, "$/dona", "TAXMIN"),
    ('stolcha', "Jurnal stolchasi", 100, "$/dona", "TAXMIN"),
    ('interyerXZ1', "Sotuv xonasi interyeri: brend devor (logotip, plakat), o'simliklar, dekor", 600, "$/komplekt", "TAXMIN"),
    ('interyerXZ2', "Admin xonasi interyeri: dekor, o'simliklar", 300, "$/komplekt", "TAXMIN"),
    ('elonDoska', "E'lonlar doskasi 1.8 × 1.0 m (probka/magnit, alyuminiy ramka)", 120, "$/dona", "TAXMIN"),
    ('etirofDoska', "E'tirof doskasi 1.8 × 1.0 m (brend panel, A4 akril cho'ntaklar — faxriylar, oy o'quvchisi nomzodlari)", 250, "$/dona", "TAXMIN"),
    ('resepshn', "Resepshn stoykasi 1.8 m (buyurtma: peshtaxta 1.10 m, zal tomonidagi panelda logotip uchun joy)", 1500, "$/dona", "TAXMIN — buyurtma asosida yasaladi"),
    ('resepshnPanel', "Resepshn to'siq panellari (past, L shaklida ~3.4 m) va xodim eshikchasi", 500, "$/komplekt", "TAXMIN"),
    ('logoDevor1', "1-qavat: devordagi yorituvchi logotip ~1.5 m (to'q panelda)", 500, "$/dona", "TAXMIN"),
    ('logoStol1', "1-qavat: resepshn stoykasidagi logotip ~1.0 m (yoritilgan)", 250, "$/dona", "TAXMIN"),
    ('sahnaDevor', "Koworking sahnasi: GKL karkas devor 5.8 × 3.5 m (U4 ustuni bilan tekislanadi) va markazdagi grafit panel 3.9 m", 700, "$/komplekt", "TAXMIN"),
    ('sahnaReyka', "Sahna: yog'och reykali panellar (2 × 0.95 × 3.5 m, qora asos ustida)", 450, "$/komplekt", "TAXMIN"),
    ('sahnaLogo', "Sahna logotipi ~1.7 m, ichidan yoritilgan (akril harflar, LED)", 600, "$/dona", "TAXMIN — reklama ustasi narxi bilan almashtiring"),
    ('sahnaYor', "Sahna yoritishi: trek shina 5.2 m va 7 ta spot, tik va yuqori yashil LED chiziqlar", 450, "$/komplekt", "TAXMIN"),
    ('sahnaEkran', "Sahna ekrani 86\": koworkingdagi mavjud ekranni ko'chirish, kronshteyn va kabel", 60, "$/komplekt", "TAXMIN — ekran buyurtmachida mavjud (09.10); faqat kronshteyn va kabel"),
    ('sahnaAudio', "Ovoz: 2 ta faol kolonka (devorga osiladi), simsiz mikrofon", 500, "$/komplekt", "TAXMIN"),
    ('sahnaPol', "Sahna maydoni poli: yog'och ko'rinishli vinil ~9 m², pol bilan bir sathda (o'tish profili bilan)", 250, "$/komplekt", "TAXMIN"),
    ('minbar', "Minbar (tribuna), ko'chma, logotip bilan", 300, "$/dona", "TAXMIN"),
    ('sahnaOsimlik', "Katta o'simlik tuvakda (sahna yonida)", 100, "$/dona", "TAXMIN"),
    # 15.10: koridor oxiri — Jahon School namunasi uslubida (marmar panel, mox polosalari, egilgan yog'och reykalar, yashil LED)
    ('korMarmar', "Koridor oxiri: marmar ko'rinishli keramogranit panel 1.0 × 2.85 m (logotip ostida), o'rnatish bilan", 250, "$/dona", "TAXMIN"),
    ('korMox', "Koridor oxiri: stabillashgan mox polosalari 2 × 0.25 × 2.85 m (ramkada), orasida yashil LED chiziqlar", 300, "$/komplekt", "TAXMIN — namuna bo'yicha dizayner narxi bilan almashtiring"),
    ('korReyka', "Koridor oxiri: yog'och reykali kanopi — shiftda ~2.4 m, devorga egilib tushadi (R ≈ 0.45 m), 18 reyka 40 × 80 mm, reykalar orasida 3 ta chiziqli LED", 800, "$/komplekt", "TAXMIN — egilgan reyka buyurtma asosida (MDF shpon yoki yog'och ko'rinishli alyuminiy profil)"),
    ('korYashil', "Koridor: shift chetlarida yashil LED chiziqlar (2 × ~11 m, profil va blok bilan)", 250, "$/komplekt", "TAXMIN"),
    ('turniketSoni', "Turniketlar (buyurtmachida mavjud: kirish va chiqish)", 2, "dona", "Buyurtmachi: mavjud — narxi hisobga kirmaydi"),
    ('zaxira', "Kutilmagan xarajatlar", 0.10, "ulush", "Buyurtmachi: umumiy summadan 10%"),
    ('H', "Devor balandligi (poldan shiftgacha)", 3.5, "m", "Buyurtmachi: bino balandligi 3.5 m"),
    ('Hsh', "Shisha qism balandligi", 2.5, "m", "Buyurtmachi"),
    ('Hust', "Shisha ustidagi GKL", '=C{H}-C{Hsh}', "m", "Hisob: devor balandligi − shisha"),
    ('Hesh', "Eshik balandligi", 2.1, "m", "Eshik 1000 × 2100"),
    ('HeUst', "Eshik ustidagi GKL", '=C{H}-C{Hesh}', "m", "Hisob: devor balandligi − eshik"),
    ('eshEn', "Eshik eni — koridor eshiklari", 1.0, "m", "Founder (16.10): 1 m, suriladigan"),
    ('eshEnM', "Eshik eni — CEO xonasi va 3-qavat o'quv xonasi", 0.9, "m", "Chizmadan (mavjud eshiklar)"),
    ('Hb', "Bambuk panel balandligi", '=C{H}', "m", "Taxmin: poldan shiftgacha. Pastroq bo'lsa, shu katakka raqam yozing"),
    ('HbYQ', "Bambuk panel balandligi — yuqori qavat o'quv xonasi", 2.5, "m", "Buyurtmachi"),
]

# ---------- Batafsil qatorlar ----------
qatorlar = {k: [] for k, _ in XONALAR}


def qosh(xona, tur, joy, uz=None, bal=None, miqdor=None, birlik='m²', narx=None, manfiy=False):
    # manfiy=True — ayiriladigan maydon (masalan, eshik o'rni)
    qatorlar[xona].append(dict(tur=tur, joy=joy, uz=uz, bal=bal, miqdor=miqdor, birlik=birlik, narx=narx, manfiy=manfiy))


def nomlar(kodlar):
    return ', '.join(NOM.get(k, k) for k in kodlar)


def qarshi(f, yuz):
    # devorning qarshi tomonidagi, shu yuz bilan ustma-ust tushadigan xonalar
    return [g['kod'] for g in yuz if g['tomon'] != f['tomon'] and min(f['a2'], g['a2']) > max(f['a1'], g['a1'])]


for w in d['devorlar']:
    yuz = [f for f in w['yuz'] if f['kod'] in NOM]
    if not yuz:
        continue  # 10 sm lik ustuncha (shisha devorlar orasida) — hisobga kirmaydi
    if w['shisha']:
        egasi = next(f for f in yuz if f['kod'] not in UMUMIY)
        kor = [f['kod'] for f in yuz if f['kod'] in UMUMIY]
        qosh(egasi['kod'], 'Shisha devor', f"Shisha devor ({nomlar(kor)} tomoni)", egasi['l'] / 1000, 'Hsh', narx='shisha')
        for f in yuz:
            qosh(f['kod'], 'Gips karton (GKL)', f"Shisha ustidagi GKL ({nomlar(qarshi(f, yuz))} bilan orasida)", f['l'] / 1000, 'Hust', narx='gkl')
        continue
    for f in yuz:
        boshqa = qarshi(f, yuz)
        if w.get('logo'):
            joy = (f"Koridor oxiridagi logotip devori ({nomlar(boshqa)} bilan orasida)" if f['kod'] in UMUMIY
                   else f"{nomlar(boshqa)} oxiridagi logotip devori (xona tomoni)")
            qosh(f['kod'], 'Gips karton (GKL)', joy, f['l'] / 1000, 'H', narx='gkl')
            continue
        if not boshqa:
            joy = "Koridor uchidagi burchak ustunchasi"
        elif f['l'] <= 550 and not w['izoh']:
            joy = f"Eshik yonidagi kesak ({nomlar(boshqa)} tomoni)"
        else:
            joy = f"{nomlar(boshqa)} bilan orasidagi devor" + (" — mavjud devordagi bo'shliqni yopish" if w['izoh'] else '')
        qosh(f['kod'], 'Gips karton (GKL)', joy, f['l'] / 1000, 'H', narx='gkl')

# Yangi eshiklar shisha, 1 m, suriladigan: eshik (2.1 m) va ustidagi shisha (0.4 m) — shisha devor bilan bir chiziqda 2.5 m gacha;
# ustida, shisha devordagi kabi, 1 m GKL ikki tomondan; har biriga suriladigan mexanizm. Kladovka eshiklari — alohida.
for e in d['eshiklar']:
    if e['kladovka']:
        qosh(e['kod'], 'Eshiklar', "Kladovka eshigi 800 × 2100 (koridor oxirida; logoli variantda yashirin)", miqdor=1, birlik='dona', narx='eshKL')
        continue
    kor = KORIDOR.get(e['kod']) or next(s['koridor'] for s in d['sinflar'] if s['kod'] == e['kod'])
    if e['surma']:
        qosh(e['kod'], 'Eshiklar', "Suriladigan eshik mexanizmi (rels, roliklar, soft-close, tutqichlar)", miqdor=1, birlik='dona', narx='surmaMex')
    qosh(e['kod'], 'Shisha devor', f"Shisha eshik va ustidagi shisha ({NOM[kor]} tomoni)", 'eshEn', 'Hsh', narx='shisha')
    qosh(e['kod'], 'Gips karton (GKL)', f"Eshik ustidagi GKL ({NOM[kor]} bilan orasida)", 'eshEn', 'Hust', narx='gkl')
    qosh(kor, 'Gips karton (GKL)', f"Eshik ustidagi GKL ({NOM[e['kod']]} eshigi)", 'eshEn', 'Hust', narx='gkl')

for s in d['sinflar']:
    qosh(s['kod'], 'Bambuk panel', "Doska devori", s['doskaDevor'] / 1000, 'Hb', narx='bambuk')
    qosh(s['kod'], 'Bambuk panel', "Orqa devor", s['orqaDevor'] / 1000, 'Hb', narx='bambuk')
    qosh(s['kod'], 'Interaktiv doska', "Doska devoriga", miqdor=1, birlik='dona', narx='doska')
for o in d['ofislar']:
    for dv in o['devorlar']:
        qosh(o['kod'], 'Bambuk panel', dv['nom'], dv['uz'] / 1000, 'Hb', narx='bambuk')
        if dv.get('eshik'):
            qosh(o['kod'], 'Bambuk panel', "Eshik o'rni (ayiriladi)", 'eshEnM', 'Hesh', narx='bambuk', manfiy=True)
# Yuqori qavatdagi o'quv xonasi (buyurtmachi bergan chizma: 5.45 × 8.60 m, 46.87 m²) — 3 devorga 2.5 m balandlikda:
# doska devori va unga qarama-qarshi devor (5.45 m), eshikli uzun devor (8.60 m); derazali uzun devorga qilinmaydi.
qosh('YQ', 'Bambuk panel', "Doska devori (eni)", 5.45, 'HbYQ', narx='bambuk')
qosh('YQ', 'Bambuk panel', "Orqa devor (eni)", 5.45, 'HbYQ', narx='bambuk')
qosh('YQ', 'Bambuk panel', "Uzun devor (eshikli)", 8.60, 'HbYQ', narx='bambuk')
qosh('YQ', 'Bambuk panel', "Eshik o'rni (ayiriladi)", 'eshEnM', 'Hesh', narx='bambuk', manfiy=True)
qosh('YQ', 'Interaktiv doska', "Shimoliy devorga (eshikdan kirganda chapda)", miqdor=1, birlik='dona', narx='doska')
# Hojatxonalar: santexnika ikkala qavat uchun jami (buyurtmachi bergan sonlar), kafel — faqat erkaklar hojatxonasi
for kalit, nom in [('chashagen', "Chashagen — 3 ta erkaklar (3-qavat)"),
                   ('unitaz', "Unitaz — 1 ta erkaklar, 2 ta ayollar"),
                   ('rakovina', "Rakovina — 2 ta erkaklar, 2 ta ayollar (tamburlarda)"),
                   ('mustahab', "Mustahab — har bir kabinaga (erkaklar 4, ayollar 2)"),
                   ('taxoratSm', "Taxorat smesiteli — 3 ta erkaklar taxorat joyida, 1 ta ayollar"),
                   ('rakovinaSm', "Rakovina smesiteli — har bir rakovinaga")]:
    qosh('HJ', 'Santexnika', nom, miqdor=f'{kalit}Soni', birlik='dona', narx=('som', kalit))
qosh('HJ', 'Santexnika', "Santexnika nuqtalari — usta ishi (suv va kanalizatsiya)", miqdor='tochkaSoni', birlik='nuqta', narx=('som', 'tochka'))
qosh('HJ', 'Santexnika', "Hojatxona kabinalari (erkaklar, 3-qavat)", miqdor='kabinaSoni', birlik='dona', narx=('som', 'kabina'))
# 18.10: 3-qavat koridorida to'siq devor — zinadan chiqqan odamga hojatxona (tahoratxona) eshigi ko'rinmasin (GKL 100, ikki tomoni)
for tomon in ("koridor tomoni", "tambur tomoni"):
    qosh('HJ', 'Gips karton (GKL)', f"3-qavat koridoridagi to'siq devor — {tomon}", 2.85, 'H', narx='gkl')
qosh('HJ', 'Santexnika', "Issiq suv quvuri", miqdor='issiqUz', birlik='m', narx=('som', 'issiqQuvur'))
qosh('HJ', 'Santexnika', "Sovuq suv quvuri", miqdor='sovuqUz', birlik='m', narx=('som', 'sovuqQuvur'))
qosh('HJ', 'Santexnika', "Quvur aksessuarlari (fitinglar)", miqdor='aksessuarSoni', birlik='dona', narx=('som', 'aksessuar'))
qosh('HJ', 'Santexnika', "Kanalizatsiya quvuri (40 m) va otvodlar (jami)", miqdor=1, birlik='komplekt', narx=('som', 'kanal'))
qosh('HJ', 'Kafel', "Erkaklar hojatxonasi devori — kafel (material)", miqdor='kafelDevor', birlik='m²', narx=('som', 'kafel'))
qosh('HJ', 'Kafel', "Erkaklar hojatxonasi devori — yotqizish (usta)", miqdor='kafelDevor', birlik='m²', narx=('som', 'kafelUsta'))
qosh('HJ', 'Kafel', "Erkaklar hojatxonasi poli — kafel (material)", miqdor='kafelPol', birlik='m²', narx=('som', 'kafel'))
qosh('HJ', 'Kafel', "Erkaklar hojatxonasi poli — yotqizish (usta)", miqdor='kafelPol', birlik='m²', narx=('som', 'kafelUsta'))
qosh('ZINA', 'Perila', "Perila (buyurtmachi bergan uzunlik)", 'perilaUz', None, birlik='m', narx='perila')
for p in d['panjara']:     # 14.10: ZN2 bilan koworking orasidagi devor o'rniga zina panjarasi
    qosh('ZINA', 'Perila', f"Zina panjarasi — {p['izoh']}", p['uz'], None, birlik='m', narx='perila')

# Yoritish (buyurtmachi narxi joy boshiga): koridorlar va koworking — katta, xonalar — kichik komplekt
for kod in ['SR1', 'SR2', 'SR3', 'SR4', 'SR5', 'SR6', 'SR7', 'XZ1', 'XZ2', 'XZ3', 'XZ4', 'X12']:
    qosh(kod, 'Yoritish', "Lampalar (xona uchun)", miqdor=1, birlik='komplekt', narx='yorXona')
for kod in ['K1', 'K2', 'KW']:
    qosh(kod, 'Yoritish', "Lampalar", miqdor=1, birlik='komplekt', narx='yorKatta')
# Videokuzatuv va logotiplar — butun qavat uchun
qosh('BQ', 'Kamera tizimi', "Videokamera", miqdor='kameraSoni', birlik='dona', narx='kamera')
qosh('BQ', 'Kamera tizimi', "Kamera o'rnatish", miqdor='kameraSoni', birlik='dona', narx='kameraOrn')
qosh('BQ', 'Kamera tizimi', "NVR (videoregistrator)", miqdor=1, birlik='dona', narx='nvr')
qosh('BQ', 'Kamera tizimi', "Kabellar (Cat6, har kameraga alohida)", miqdor='kabelUlush', birlik='komplekt', narx='kabel')
qosh('BQ', 'Kamera tizimi', "PoE switch 24 port", miqdor=1, birlik='dona', narx='poeSw')
qosh('BQ', 'Kamera tizimi', "Tarmoq shkafi 18U (XZ4) — kamera va internet uchun umumiy", miqdor=1, birlik='dona', narx='shkaf18')
qosh('BQ', 'Kamera tizimi', "UPS 1.5 kVA (shkaf)", miqdor=1, birlik='dona', narx='ups')
# 18.10: internet va Wi-Fi, elektr — tizim chizmalari bo'yicha (Xadra_tizim_internet, Xadra_tizim_elektr)
qosh('BQ', 'Internet va Wi-Fi', "RJ-45 rozetka, 2 portli", miqdor='rj45Soni', birlik='dona', narx=('som', 'rj45'))
qosh('BQ', 'Internet va Wi-Fi', "Wi-Fi nuqtasi (shift, PoE)", miqdor='apSoni', birlik='dona', narx='ap')
qosh('BQ', 'Internet va Wi-Fi', "Router", miqdor=1, birlik='dona', narx='router')
qosh('BQ', 'Internet va Wi-Fi', "Switch 48 port (8 PoE+)", miqdor=1, birlik='dona', narx='sw48')
qosh('BQ', 'Internet va Wi-Fi', "Patch-panellar (internet 2, kamera 1)", miqdor='patchSoni', birlik='dona', narx='patch')
qosh('BQ', 'Internet va Wi-Fi', "Cat6 kabeli — internet va Wi-Fi", miqdor='cat6Uz', birlik='m', narx=('som', 'cat6'))
qosh('BQ', 'Internet va Wi-Fi', "Past tokli lotok (kamera, internet, yong'in)", miqdor='ltUz', birlik='m', narx=('som', 'lotok'))
qosh('BQ', 'Internet va Wi-Fi', "Internet montaji", miqdor='netPort', birlik='port', narx=('som', 'netMontaj'))
qosh('BQ', 'Elektr', "Kabel VVGng-LS 3×2.5 (rozetkalar)", miqdor='k25Uz', birlik='m', narx=('som', 'k25'))
qosh('BQ', 'Elektr', "Kabel VVGng-LS 3×1.5 (yoritish, VV1)", miqdor='k15Uz', birlik='m', narx=('som', 'k15'))
qosh('BQ', 'Elektr', "Kabel VVGng-LS 5×4 (KK1, KK2)", miqdor='k54Uz', birlik='m', narx=('som', 'k54'))
qosh('BQ', 'Elektr', "Kuch lotogi (shift ostida)", miqdor='elUz', birlik='m', narx=('som', 'lotok'))
qosh('BQ', 'Elektr', "Gofra quvur Ø20", miqdor='gofraUz', birlik='m', narx=('som', 'gofra'))
qosh('BQ', 'Elektr', "Rozetkalar (shu jumladan doska rozetkasi 1.6 m)", miqdor='rozSoni', birlik='dona', narx=('som', 'rozetka'))
qosh('BQ', 'Elektr', "Vyklyuchatellar", miqdor='vyklSoni', birlik='dona', narx=('som', 'vykl'))
qosh('BQ', 'Elektr', "Difavtomatlar C16, 30 mA (rozetka guruhlari)", miqdor='difSoniE', birlik='dona', narx=('som', 'difavt'))
qosh('BQ', 'Elektr', "Avtomatlar 1P (yoritish, VV1, zaxira)", miqdor='avt1Soni', birlik='dona', narx=('som', 'avt1'))
qosh('BQ', 'Elektr', "Avtomatlar 3P C25 (KK1, KK2)", miqdor=2, birlik='dona', narx=('som', 'avt3'))
qosh('BQ', 'Elektr', "Qo'shimcha shit qutisi 36 modul (kerak bo'lsa)", miqdor=1, birlik='dona', narx=('som', 'shitQuti'))
qosh('BQ', 'Elektr', "Elektr montaji (nuqta bo'yicha)", miqdor='elNuqta', birlik='nuqta', narx=('som', 'elMontaj'))
qosh('BQ', 'Logotip', "Logotiplar — 2-qavat, jami (koridor oxiridagi 2 ta yorituvchi logotip bilan)", miqdor=1, birlik='komplekt', narx='logo')
# So'mdagi ishlar (narx $ = so'm ÷ kurs)
qosh('BQ', 'Matli plyonka', "Shisha devorlarga matli plyonka", miqdor='plyonkaSoni', birlik='dona', narx=('som', 'plyonka'))
qosh('BQ', "Yong'in xavfsizligi", "Signalizatsiya, o't o'chirgichlar, evakuatsiya belgilari, avariya chiroqlari (jami)", miqdor=1, birlik='komplekt', narx=('som', 'yongin'))
for w in d['buziladi']:
    joy = f"{w['izoh']} o'rnidagi bo'lak" if 'koridori' in w['izoh'] else w['izoh']
    qosh('BQ', 'Buzish ishlari', f"Devorni buzish — {joy}", w['uz'] / 1000, 'H', narx=('som', 'buzish'))
qosh('BQ', 'Buzish ishlari', "Qurilish chiqindisini olib chiqish (jami)", miqdor=1, birlik='komplekt', narx=('som', 'chiqindi'))
# Konditsioner va ventilyatsiya (16.10): 2 ta kanalli konditsioner kladovka shifti ustida (KK1 — K1, KK2 — K2), havo koridor
# bo'ylab magistral kanal bilan xonalarga; 30% tashqi havo 3-xonaning ko'cha tomonidan; vitechka — alohida so'rish tarmog'i
qosh('BQ', 'Konditsioner va ventilyatsiya', "Kanalli konditsioner KK1, KK2 (kladovka shifti ustida, tashqi devor yonida)", miqdor='kkSoni', birlik='dona', narx='kk')
qosh('BQ', 'Konditsioner va ventilyatsiya', "Havo kanallari (vozduxovod) — berish, tashqi havo va vitechka (kanallar rejasi bo'yicha)", miqdor='kanalUz', birlik='m', narx=('som', 'kanalM'))
# 18.10: tashqi havo kanali sharqiy devor bo'ylab — 3- va 4-xonada shift ostida GKL qutida (pastki va yon tomoni)
for g in d['gklQuti']:
    qosh(g['kod'], 'Gips karton (GKL)', f"Tashqi havo kanali qutisi — sharqiy devor bo'ylab, shift ostida (yoyilmasi {g['yoyma']} m)", g['uz'], miqdor=round(g['uz'] * g['yoyma'], 2), narx='gkl')
qosh('BQ', 'Konditsioner va ventilyatsiya', "Shift diffuzorlari (sinflarga 2 tadan, xizmat xonalariga 1 tadan)", miqdor='difSoni', birlik='dona', narx='diffuzor')
qosh('BQ', 'Konditsioner va ventilyatsiya', "Vitechka so'rish panjaralari Ø200", miqdor='sorSoni', birlik='dona', narx='sorPanjara')
qosh('BQ', 'Konditsioner va ventilyatsiya', "Qaytish va tashqi havo panjaralari, chiqish soyaboni", miqdor=1, birlik='komplekt', narx='qPanjara')
qosh('BQ', 'Konditsioner va ventilyatsiya', "Vitechka ventilyatori VV1 (3 000 m³/soat)", miqdor=1, birlik='dona', narx='vv')
qosh('YQ', 'Konditsioner va ventilyatsiya', "Konditsioner (o'quv xonasi)", miqdor=1, birlik='dona', narx='kond3')

# Sotuv (XZ1) va admin (XZ2) xonalari: mebel va interyer — taxminiy (jihozlar soni chizmadagi kabi)
qosh('XZ1', 'Mebel va interyer', "Konsultant stoli", miqdor=2, birlik='dona', narx='stolOfis')
qosh('XZ1', 'Mebel va interyer', "Konsultant kreslosi", miqdor=2, birlik='dona', narx='kreslo')
qosh('XZ1', 'Mebel va interyer', "Mijoz stuli (har konsultantga 2 ta)", miqdor=4, birlik='dona', narx='mijozStul')
qosh('XZ1', 'Mebel va interyer', "Kutish divani", miqdor=1, birlik='dona', narx='divan')
qosh('XZ1', 'Mebel va interyer', "Hujjat shkafi", miqdor=1, birlik='dona', narx='shkaf')
qosh('XZ1', 'Mebel va interyer', "Interyer: brend devor, o'simliklar, dekor", miqdor=1, birlik='komplekt', narx='interyerXZ1')
qosh('XZ2', 'Mebel va interyer', "Ish stoli", miqdor=2, birlik='dona', narx='stolOfis')
qosh('XZ2', 'Mebel va interyer', "Ofis kreslosi", miqdor=2, birlik='dona', narx='kreslo')
qosh('XZ2', 'Mebel va interyer', "Mehmon stuli", miqdor=2, birlik='dona', narx='mijozStul')
qosh('XZ2', 'Mebel va interyer', "Hujjat shkafi", miqdor=1, birlik='dona', narx='shkaf')
qosh('XZ2', 'Mebel va interyer', "Interyer: dekor, o'simliklar", miqdor=1, birlik='komplekt', narx='interyerXZ2')
# Koridorlarning kar devorlarida doskalar (har bir koridorda bittadan) — taxminiy
# 14.10: xizmat xonalarining oldi shisha — doskalar koworkingning shimoliy (mavjud) devoriga ko'chirildi, bittadan
qosh('KW', "E'lon va e'tirof doskalari", "E'lonlar doskasi (koworking shimoliy devorida, K1 ga kirishda)", miqdor=1, birlik='dona', narx='elonDoska')
qosh('KW', "E'lon va e'tirof doskalari", "E'tirof doskasi — faxriylar, oy o'quvchisi nomzodlari (koworking shimoliy devorida)", miqdor=1, birlik='dona', narx='etirofDoska')
# Koridor oxiri (15.10): logotip devorining pardozi va koridor yoritishi — taxminiy, har koridorda bir xil
for kod in ['K1', 'K2']:
    qosh(kod, 'Mebel va interyer', "Koridor oxiri: marmar ko'rinishli panel (logotip ostida)", miqdor=1, birlik='dona', narx='korMarmar')
    qosh(kod, 'Mebel va interyer', "Koridor oxiri: mox polosalari va yashil LED", miqdor=1, birlik='komplekt', narx='korMox')
    qosh(kod, 'Mebel va interyer', "Koridor oxiri: egilgan yog'och reykali kanopi, LED bilan", miqdor=1, birlik='komplekt', narx='korReyka')
    qosh(kod, 'Mebel va interyer', "Koridor shifti chetlarida yashil LED chiziqlar", miqdor=1, birlik='komplekt', narx='korYashil')
# 1-qavat: resepshn, mehmonlar joyi, logotiplar — taxminiy; turniket buyurtmachida mavjud
qosh('Q1', 'Mebel va interyer', "Resepshn stoykasi (buyurtma asosida)", miqdor=1, birlik='dona', narx='resepshn')
qosh('Q1', 'Mebel va interyer', "Resepshn to'siq panellari va xodim eshikchasi (L shaklida)", miqdor=1, birlik='komplekt', narx='resepshnPanel')
qosh('Q1', 'Mebel va interyer', "Resepshn xodimi kreslosi", miqdor=1, birlik='dona', narx='kreslo')
qosh('Q1', 'Mebel va interyer', "Mehmonlar divani", miqdor=1, birlik='dona', narx='divan')
qosh('Q1', 'Mebel va interyer', "Jurnal stolchasi", miqdor=1, birlik='dona', narx='stolcha')
qosh('Q1', 'Logotip', "Resepshn orqasidagi o'ng devorda yorituvchi logotip", miqdor=1, birlik='dona', narx='logoDevor1')
qosh('Q1', 'Logotip', "Resepshn stoykasining zal tomonidagi panelidagi logotip", miqdor=1, birlik='dona', narx='logoStol1')
# Koworking sahnasi — XZ1 xonasining koworkingga qaragan devori (buyurtmachi, 09.10): interyer va logotip — taxminiy
for kalit, nom, birlik in [('sahnaDevor', "Sahna devori: GKL karkas va grafit panel", 'komplekt'),
                           ('sahnaReyka', "Sahna devori: yog'och reykali yon panellar", 'komplekt'),
                           ('sahnaLogo', "Sahna logotipi, ichidan yoritilgan (~2.0 m)", 'dona'),
                           ('sahnaYor', "Sahna yoritishi (trek shina, 7 ta spot, yashil LED chiziqlar)", 'komplekt'),
                           ('sahnaEkran', "86\" ekranni sahna devoriga ko'chirish (kronshteyn, kabel)", 'komplekt'),
                           ('sahnaAudio', "Ovoz tizimi: 2 ta kolonka (devorga), mikrofon", 'komplekt'),
                           ('sahnaPol', "Sahna maydoni poli (vinil, pol bilan bir sathda)", 'komplekt'),
                           ('minbar', "Minbar (tribuna)", 'dona'),
                           ('sahnaOsimlik', "O'simlik (sahna yonida)", 'dona')]:
    qosh('KW', 'Mebel va interyer', nom, miqdor=1, birlik=birlik, narx=kalit)

TURLAR = ['Shisha devor', 'Gips karton (GKL)', 'Bambuk panel', 'Interaktiv doska', 'Perila', 'Yoritish', 'Kamera tizimi', 'Logotip',
          'Matli plyonka', "Yong'in xavfsizligi", 'Buzish ishlari', 'Santexnika', 'Kafel', 'Konditsioner va ventilyatsiya',
          'Mebel va interyer', "E'lon va e'tirof doskalari", 'Eshiklar', 'Internet va Wi-Fi', 'Elektr']
JUFT = TURLAR[:5]    # «Xonalar bo'yicha» varag'ida miqdor va summa ustunlari bilan
YAKKA = TURLAR[5:]   # faqat summa ustuni bilan
for k in qatorlar:
    qatorlar[k].sort(key=lambda q: TURLAR.index(q['tur']))

# ---------- Uslublar ----------
SHRIFT = 'Arial'
f_oddiy = Font(name=SHRIFT, size=10)
f_kok = Font(name=SHRIFT, size=10, color='0000FF')       # qo'lda kiritilgan qiymat
f_yashil = Font(name=SHRIFT, size=10, color='008000')    # boshqa varaqqa havola
f_qalin = Font(name=SHRIFT, size=10, bold=True)
f_sarlavha = Font(name=SHRIFT, size=14, bold=True, color='1F3657')
f_kichik = Font(name=SHRIFT, size=9, italic=True, color='555555')
f_bosh = Font(name=SHRIFT, size=10, bold=True, color='FFFFFF')
fill_bosh = PatternFill('solid', fgColor='1F3657')
fill_guruh = PatternFill('solid', fgColor='E8EEF6')
fill_jami = PatternFill('solid', fgColor='F2F2F2')
fill_sariq = PatternFill('solid', fgColor='FFFF00')
fill_taxmin = PatternFill('solid', fgColor='FFC000')     # taxminiy narx
ingichka = Side(style='thin', color='BFBFBF')
chegara = Border(left=ingichka, right=ingichka, top=ingichka, bottom=ingichka)
USD = '$#,##0.00;($#,##0.00);"-"'
USD0 = '$#,##0;($#,##0);"-"'
SON = '#,##0.00;(#,##0.00);"-"'
DONA = '#,##0;(#,##0);"-"'

wb = Workbook()

# ---------- 1. Narxlar ----------
wn = wb.active
wn.title = 'Narxlar'
wn['A1'] = "PDP Academy · Xadra filiali (1, 2 va 3-qavat): narxlar va o'lchamlar"
wn['A1'].font = f_sarlavha
wn['A2'] = "Sariq kataklardagi narx va balandliklarni o'zgartirsangiz, «Hisob (batafsil)» va «Xonalar bo'yicha» varaqlari avtomatik qayta hisoblanadi."
wn['A2'].font = f_kichik
for i, h in enumerate(['№', "Ko'rsatkich", 'Qiymat', 'Birlik', 'Manba / izoh'], 1):
    c = wn.cell(row=4, column=i, value=h)
    c.font, c.fill, c.border = f_bosh, fill_bosh, chegara
    c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
r = 5
for i, (k, _, _, _, _) in enumerate(NARX_QATORLAR):
    N[k] = r + i
for i, (k, nom, qiymat, birlik, manba) in enumerate(NARX_QATORLAR):
    rr = r + i
    if isinstance(qiymat, str):
        qiymat = qiymat.format(**N)
    vals = [i + 1, nom, qiymat, birlik, manba]
    for j, v in enumerate(vals, 1):
        c = wn.cell(row=rr, column=j, value=v)
        c.font, c.border = f_oddiy, chegara
    q = wn.cell(row=rr, column=3)
    if isinstance(qiymat, str):
        q.font = f_oddiy
        if k == 'Hb':
            q.fill = fill_sariq   # sukut bo'yicha devor balandligi, lekin o'zgartirish mumkin
    else:
        q.font, q.fill = f_kok, (fill_taxmin if manba.startswith('TAXMIN') else fill_sariq)
    q.number_format = (USD if birlik.startswith('$') else '#,##0 "so\'m"' if birlik.startswith("so'm/") else '#,##0' if birlik == "so'm/$"
                       else '0%' if birlik == 'ulush' else '0' if birlik in ('dona', 'nuqta') else '0.00')
    wn.cell(row=rr, column=1).alignment = Alignment(horizontal='center')
oxir = r + len(NARX_QATORLAR)
izohlar = [
    "Hisoblash qoidalari",
    "• Gips karton (GKL) devor: uzunlik × balandlik. Devorning har bir tomoni o'zi qaragan xonaga yoziladi (xona tomoni — xonaga, koridor tomoni — koridorga).",
    "• Shisha devor: shisha qism (2.5 m) xonaga yoziladi; ustidagi GKL (1 m) ikki tomonlama — xona va koridor tomoni alohida.",
    "• Koridor eshiklari (11 ta) shisha, 1 m, yonga suriladigan (founder, 16.10; barg xona ichida): eshik (2.1 m) va ustidagi shisha (0.4 m) — 2.5 m gacha shisha narxida; ustida 1 m GKL ikki tomondan; mexanizm (rels, roliklar, soft-close, tutqichlar) — «Eshiklar». Kladovka eshiklari (2 ta, 800 × 2100) — «Eshiklar», kladovka qatorlarida. Qulflar kirmagan.",
    "• Bambuk panel, poldan shiftgacha: o'quv xonalarida doska devori va orqa devor (interaktiv doska orqasi ayirilmagan); ofis xonalarida ikkala uzun yon devor; CEO xonasida ikkita ichki kar devor, eshik o'rni ayiriladi. Derazali tashqi va shisha devorlarga qilinmaydi.",
    "• Yuqori qavat o'quv xonasi (5.45 × 8.60 m, buyurtmachi chizmasi): bambuk panel 3 devorga, 2.5 m balandlikda — doska devori, orqa devor va eshikli uzun devor (eshik o'rni ayiriladi); derazali uzun devorga qilinmaydi.",
    "• Interaktiv doska: 7 ta shu qavat sinflariga va 1 ta yuqori qavatdagi o'quv xonasiga — jami 8 ta.",
    "• Perila: buyurtmachi bergan uzunlik (24 m), «Zinapoya» qatorida.",
    "• Uzunliklar chizma v1.2 dan (mavjud holat chizmasining fotosi asosida) — ish boshlanishidan oldin joyida o'lchanadi.",
    "• Yoritish: koridorlar (K1, K2) va koworking zaliga 336 $ dan, o'quv xonalari (7), ofis xonalari (4) va CEO xonasiga 168 $ dan. Kirish zali, WC va yuqori qavat xonasi kiritilmagan.",
    "• Videokuzatuv (18.10, Xadra_tizim_kamera): 24 ta kamera (40 $) va o'rnatish (21 $ dan), NVR, kabellar (buyurtmachi summasi kamera soniga mutanosib), PoE switch, tarmoq shkafi va UPS (TAXMIN); logotiplar jami — «Butun qavat» qatorida.",
    "• Internet va Wi-Fi (18.10, Xadra_tizim_internet): 16 ta 2 portli RJ-45, 6 ta Wi-Fi nuqtasi, router, switch, patch-panellar, Cat6 va lotok — chizmadagi miqdor, Toshkent taxminiy narxi. Elektr (Xadra_tizim_elektr): kabellar (3×2.5, 3×1.5, 5×4), lotok, gofra, rozetka, vyklyuchatel, avtomatlar, montaj — xuddi shunday; chiroqlar — buyurtmachi narxi («Yoritish»). Yong'in — buyurtmachi summasi (miqdorlar chizmada).",
    "• So'mdagi narxlar (matli plyonka, yong'in xavfsizligi, devor buzish va chiqindi, havo kanallari, santexnika) «Dollar kursi» katagi bo'yicha (11 900 so'm/$) $ ga o'tkaziladi.",
    "• Devor buzish: chizmadagi buziladigan devorlar uzunligi × devor balandligi (3.5 m) × 50 000 so'm/m².",
    "• Kutilmagan xarajatlar: umumiy summadan 10% — «Xonalar bo'yicha» varag'ining oxirida.",
    "• 3-qavat: 5-xona — o'quv xonasi (24 o'rin, bambuk panel va interaktiv doska); 2-xona — erkaklar hojatxonasi. Santexnika soni ikkala hojatxona uchun jami (2-qavatdagisi — ayollar: 2 kabina, unitazli, eng ichkarida; oldida rakovinali tambur — 6-xona 3-qavatga o'tish yo'lagi bo'lgani uchun ikki eshik orqali kiriladi); kafel faqat erkaklar hojatxonasi uchun (devor 58 m², pol 16 m²).",
    "• Konditsioner va ventilyatsiya (16.10, kanallar rejasi — Xadra_2-qavat_vitechka_konditsioner): 2 ta kanalli konditsioner (KK1, KK2) koridor oxiridagi kladovka shifti ustida, tashqi devor yonida — havo koridor bo'ylab magistral kanal bilan sinflarga (2 tadan) va xizmat xonalariga (1 tadan) diffuzorlar orqali; 30% tashqi havo 3-xonaning ko'cha tomonidan, sharqiy devor bo'ylab bloklarning orqasiga (3- va 4-xonada GKL qutida, 18.10); vitechka — alohida so'rish tarmog'i (18 panjara, VV1 3 000 m³/soat; magistral 2-xona, ustozlar, admin va 6-xona markazidan, VV1 2-xona fasadida — 19.10). Konditsioner, diffuzor, panjara va ventilyator narxlari TAXMIN. 96 000 BTU issiq kunda yetmaydi (har blokka ~130 000 BTU kerak) — model tanlangach narx almashtiriladi. Avvalgi taklif (2 ta rekuperator va 11 ta split) bekor qilindi. CEO xonasi va koworkingda konditsioner mavjud; 3-qavat o'quv xonasiga 1 ta konditsioner. Kirmagan: montaj (narxga kirmagan bo'lsa), kanal izolyatsiyasi, freon trassalari, tashqi blok tayanch ramasi, drenaj nasoslari (kerak bo'lsa), CO₂ datchiklari.",
    "• Santexnika: 4 ta kabina, issiq va sovuq suv quvurlari (40 m dan), 100 ta aksessuar, kanalizatsiya quvuri va otvodlar — «Hojatxonalar» qatorida.",
    "• 2-qavat koridorlari (16.10): K1 va K2 4-xona orqali kladovkagacha davom etadi; koridor oxiri — kladovkaning ko'ndalang GKL devori. Logoli variant hisoblangan (Jahon School namunasi uslubida): marmar ko'rinishli panel, mox polosalari, egilgan yog'och reykali kanopi, shift chetlarida yashil LED (taxmin, K1 va K2 qatorlarida); kladovka eshigi yashirin. Logosiz variantda marmar, mox va kanopi kirmaydi (2 × $1 350 = $2 700 kam), kladovka eshigi oddiy (~$150). E'lonlar va e'tirof doskalari — koworking qatorida.",
    "• TAXMINIY narxlar (to'q sariq fon): sotuv va admin xonalari mebeli va interyeri, koridor doskalari, koworking sahnasi (karkas devor, reyka, logotip, trek yoritish, ovoz, pol, minbar), 1-qavat resepshn stoykasi, mehmonlar mebeli va logotiplari, kanalli konditsionerlar, diffuzor va panjaralar, vitechka ventilyatori, suriladigan eshik mexanizmlari va kladovka eshiklari — Toshkent bozori bo'yicha dastlabki baho; mebelchi va reklama ustasi narxi bilan almashtiring. «Yakuniy» varag'ida taxminiy qism alohida ko'rsatilgan.",
    "• Kirmagan: o'quv xonalari, ustozlar xonasi, call-markaz, CEO va koworking mebeli — mavjud; pol (kafel) va internet provayderi (optika kirishi) — mavjud; turniketlar (2 ta) — mavjud (o'rnatish, to'siq va evakuatsiya darvozasi alohida aniqlanadi); eshik furniturasi; shift va bo'yoq; ish haqi (agar narxga kirmagan bo'lsa).",
    "Ranglar: ko'k — qo'lda kiritilgan qiymat; yashil — boshqa varaqdan olingan; qora — formula; sariq fon — o'zgartirish mumkin bo'lgan kataklar.",
]
for i, t in enumerate(izohlar):
    c = wn.cell(row=oxir + 1 + i, column=2, value=t)
    c.font = f_qalin if i == 0 else f_kichik
for col, w in zip('ABCDE', [5, 38, 12, 9, 80]):
    wn.column_dimensions[col].width = w


def narx_havola(k):
    if isinstance(k, tuple):   # ('som', kalit) — so'mdagi narx, kurs bo'yicha $ ga
        return f"=Narxlar!$C${N[k[1]]}/Narxlar!$C${N['kurs']}"
    return f"=Narxlar!$C${N[k]}"


# ---------- 2. Hisob (batafsil) ----------
wd = wb.create_sheet('Hisob (batafsil)')
wd['A1'] = "PDP Academy · Xadra filiali (1, 2 va 3-qavat): xarajatlar hisobi, xonalar bo'yicha batafsil"
wd['A1'].font = f_sarlavha
wd['A2'] = "Uzunliklar chizmadan (m). Balandlik va narx «Narxlar» varag'idan olinadi (yashil). Miqdor = uzunlik × balandlik; summa = miqdor × narx."
wd['A2'].font = f_kichik
SARLAVHA = ['№', 'Xona', 'Ish turi', 'Joyi / izoh', 'Uzunlik, m', 'Balandlik, m', 'Miqdor', 'Birlik', 'Narx, $', 'Summa, $', 'Kalit (narx)']
for i, h in enumerate(SARLAVHA, 1):
    c = wd.cell(row=4, column=i, value=h)
    c.font, c.fill, c.border = f_bosh, fill_bosh, chegara
    c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
r = 5
n = 0
BIRINCHI = r
xona_jami = {}
for kod, nom in XONALAR:
    if not qatorlar[kod]:
        continue
    c = wd.cell(row=r, column=1, value=nom)
    c.font = f_qalin
    for j in range(1, 11):
        wd.cell(row=r, column=j).fill = fill_guruh
    r += 1
    bosh = r
    for q in qatorlar[kod]:
        n += 1
        uz = q['uz']
        uz_val = narx_havola(uz) if isinstance(uz, str) else uz
        bal_val = narx_havola(q['bal']) if q['bal'] else None
        if q['miqdor'] is not None:
            miqdor = narx_havola(q['miqdor']) if isinstance(q['miqdor'], str) else q['miqdor']
        elif q['birlik'] == 'm²':
            miqdor = f"=-E{r}*F{r}" if q['manfiy'] else f"=E{r}*F{r}"
        else:
            miqdor = f"=E{r}"
        kalit = q['narx'][1] if isinstance(q['narx'], tuple) else q['narx']
        vals = [n, nom, q['tur'], q['joy'], uz_val, bal_val, miqdor, q['birlik'], narx_havola(q['narx']), f"=G{r}*I{r}", kalit]
        for j, v in enumerate(vals, 1):
            c = wd.cell(row=r, column=j, value=v)
            c.font, c.border = f_oddiy, chegara
        wd.cell(row=r, column=5).font = f_yashil if isinstance(uz, str) else f_kok
        if bal_val:
            wd.cell(row=r, column=6).font = f_yashil
        if q['miqdor'] is not None:
            wd.cell(row=r, column=7).font = f_yashil if isinstance(q['miqdor'], str) else f_kok
        wd.cell(row=r, column=9).font = f_yashil
        wd.cell(row=r, column=11).font = f_kichik
        wd.cell(row=r, column=1).alignment = Alignment(horizontal='center')
        wd.cell(row=r, column=8).alignment = Alignment(horizontal='center')
        for j, fmt in [(5, SON), (6, SON), (7, SON if q['birlik'] in ('m²', 'm') else DONA), (9, USD), (10, USD)]:
            wd.cell(row=r, column=j).number_format = fmt
        r += 1
    c = wd.cell(row=r, column=4, value=f"Jami: {nom}")
    c.font = f_qalin
    c = wd.cell(row=r, column=10, value=f"=SUM(J{bosh}:J{r - 1})")
    c.font, c.number_format = f_qalin, USD
    for j in range(1, 11):
        wd.cell(row=r, column=j).fill = fill_jami
        wd.cell(row=r, column=j).border = chegara
    xona_jami[kod] = r
    r += 2
OXIRGI = r - 1
c = wd.cell(row=r, column=4, value="JAMI (barcha xonalar)")
c.font = f_qalin
c = wd.cell(row=r, column=10, value='=' + '+'.join(f"J{x}" for x in xona_jami.values()))
c.font, c.number_format = f_qalin, USD
for j in range(1, 11):
    wd.cell(row=r, column=j).fill = fill_jami
    wd.cell(row=r, column=j).border = chegara
for col, w in zip('ABCDEFGHIJK', [5, 24, 18, 58, 11, 11, 10, 7, 11, 13, 12]):
    wd.column_dimensions[col].width = w
wd.freeze_panes = 'A5'

# ---------- 3. Xonalar bo'yicha ----------
ws = wb.create_sheet("Xonalar bo'yicha", 0)
ws['A1'] = "PDP Academy · Xadra filiali (1, 2 va 3-qavat): xarajatlar, xonalar bo'yicha"
ws['A1'].font = f_sarlavha
ws['A2'] = "Har bir qator «Hisob (batafsil)» varag'idan olinadi (SUMIFS). Narxlarni «Narxlar» varag'ida o'zgartiring."
ws['A2'].font = f_kichik
UST = ['Xona', 'Shisha (devor va eshik), m²', 'Shisha (devor va eshik), $', 'Gips karton (GKL), m²', 'Gips karton (GKL), $',
       'Bambuk panel, m²', 'Bambuk panel, $', 'Interaktiv doska, dona', 'Interaktiv doska, $', 'Perila, m', 'Perila, $',
       'Yoritish, $', 'Kamera tizimi, $', 'Logotip, $', 'Matli plyonka, $', "Yong'in xavfsizligi, $", 'Buzish ishlari, $',
       'Santexnika, $', 'Kafel, $', 'Konditsioner va ventilyatsiya, $', 'Mebel va interyer (taxmin), $', "E'lon va e'tirof doskalari (taxmin), $",
       'Eshiklar: mexanizm, kladovka (taxmin), $', 'Internet va Wi-Fi (taxmin), $', 'Elektr (taxmin), $', 'Jami, $']
assert len(UST) == 2 + 2 * len(JUFT) + len(YAKKA), "UST ustunlari TURLAR bilan mos emas"
NC = len(UST)                      # ustunlar soni
JAMI_UST = get_column_letter(NC)   # «Jami, $» ustuni
for i, h in enumerate(UST, 1):
    c = ws.cell(row=4, column=i, value=h)
    c.font, c.fill, c.border = f_bosh, fill_bosh, chegara
    c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
ws.row_dimensions[4].height = 32
D_ = "'Hisob (batafsil)'"
rng = lambda col: f"{D_}!${col}${BIRINCHI}:${col}${OXIRGI}"
r = 5
bolim_jami = []
for bolim, kodlar in BOLIM:
    c = ws.cell(row=r, column=1, value=bolim)
    c.font = f_qalin
    for j in range(1, NC + 1):
        ws.cell(row=r, column=j).fill = fill_guruh
    r += 1
    bosh = r
    for kod in kodlar:
        nom = NOM[kod]
        ws.cell(row=r, column=1, value=nom).font = f_oddiy
        for t, tur in enumerate(JUFT):
            mq = ws.cell(row=r, column=2 + 2 * t, value=f'=SUMIFS({rng("G")},{rng("B")},$A{r},{rng("C")},"{tur}")')
            sm = ws.cell(row=r, column=3 + 2 * t, value=f'=SUMIFS({rng("J")},{rng("B")},$A{r},{rng("C")},"{tur}")')
            mq.font = sm.font = f_yashil
            mq.number_format = DONA if tur == 'Interaktiv doska' else SON
            sm.number_format = USD0
        for t, tur in enumerate(YAKKA):
            sm = ws.cell(row=r, column=2 + 2 * len(JUFT) + t, value=f'=SUMIFS({rng("J")},{rng("B")},$A{r},{rng("C")},"{tur}")')
            sm.font, sm.number_format = f_yashil, USD0
        summa_ust = [get_column_letter(3 + 2 * t) for t in range(len(JUFT))] + [get_column_letter(2 + 2 * len(JUFT) + t) for t in range(len(YAKKA))]
        jm = ws.cell(row=r, column=NC, value='=' + '+'.join(f"{L}{r}" for L in summa_ust))
        jm.font, jm.number_format = f_qalin, USD0
        for j in range(1, NC + 1):
            ws.cell(row=r, column=j).border = chegara
        r += 1
    ws.cell(row=r, column=1, value=f"{bolim} — jami").font = f_qalin
    for j in range(2, NC + 1):
        L = get_column_letter(j)
        c = ws.cell(row=r, column=j, value=f"=SUM({L}{bosh}:{L}{r - 1})")
        c.font = f_qalin
        c.number_format = ws.cell(row=r - 1, column=j).number_format
    for j in range(1, NC + 1):
        ws.cell(row=r, column=j).fill = fill_jami
        ws.cell(row=r, column=j).border = chegara
    bolim_jami.append(r)
    r += 2
ws.cell(row=r, column=1, value="JAMI").font = Font(name=SHRIFT, size=11, bold=True)
for j in range(2, NC + 1):
    L = get_column_letter(j)
    c = ws.cell(row=r, column=j, value='=' + '+'.join(f"{L}{x}" for x in bolim_jami))
    c.font = Font(name=SHRIFT, size=11, bold=True)
    c.number_format = ws.cell(row=bolim_jami[0], column=j).number_format
for j in range(1, NC + 1):
    ws.cell(row=r, column=j).fill = PatternFill('solid', fgColor='D9E1F2')
    ws.cell(row=r, column=j).border = chegara
JAMI_QATOR = r
# kutilmagan xarajatlar va umumiy jami ($ va so'mda)
yakun = [
    (f'="Kutilmagan xarajatlar ("&TEXT(Narxlar!$C${N["zaxira"]},"0%")&" — «Narxlar» varag\'idan)"', f"={JAMI_UST}{JAMI_QATOR}*Narxlar!$C${N['zaxira']}", USD0, False),
    ("UMUMIY JAMI (kutilmagan xarajatlar bilan), $", f"={JAMI_UST}{JAMI_QATOR}+{JAMI_UST}{JAMI_QATOR + 1}", USD0, True),
    ("UMUMIY JAMI, so'm (kurs bo'yicha)", f"={JAMI_UST}{JAMI_QATOR + 2}*Narxlar!$C${N['kurs']}", '#,##0 "so\'m"', True),
]
for i, (nom, formula, fmt, qalin) in enumerate(yakun):
    rr = JAMI_QATOR + 1 + i
    ws.cell(row=rr, column=1, value=nom).font = Font(name=SHRIFT, size=11 if qalin else 10, bold=qalin)
    c = ws.cell(row=rr, column=NC, value=formula)
    c.font, c.number_format = Font(name=SHRIFT, size=11 if qalin else 10, bold=qalin), fmt
    for j in range(1, NC + 1):
        ws.cell(row=rr, column=j).fill = PatternFill('solid', fgColor='D9E1F2' if qalin else 'F2F2F2')
        ws.cell(row=rr, column=j).border = chegara
    ws.merge_cells(start_row=rr, start_column=1, end_row=rr, end_column=NC - 1)
r = JAMI_QATOR + len(yakun) + 2
ws.cell(row=r, column=1, value="Tekshiruv: batafsil varaqdagi jami bilan farq (0 bo'lishi kerak)").font = f_kichik
c = ws.cell(row=r, column=NC, value=f"={JAMI_UST}{JAMI_QATOR}-{D_}!J{OXIRGI + 1}")
c.font, c.number_format = f_kichik, USD
ws.column_dimensions['A'].width = 28
for j in range(2, NC + 1):
    ws.column_dimensions[get_column_letter(j)].width = 12
ws.column_dimensions[JAMI_UST].width = 14
ws.freeze_panes = 'B5'

# ---------- 0. Yakuniy: xarajat turlari va bo'limlar bo'yicha jami ----------
wy = wb.create_sheet('Yakuniy', 0)
wy['A1'] = "PDP Academy · Xadra filiali (1, 2 va 3-qavat): jami xarajatlar — yakuniy"
wy['A1'].font = f_sarlavha
wy['A2'] = "Barcha summalar «Hisob (batafsil)» varag'idan formulalar bilan olinadi; so'm — «Narxlar» varag'idagi kurs bo'yicha."
wy['A2'].font = f_kichik
KURS = f"Narxlar!$C${N['kurs']}"
def sarlavha(row, nomlar):
    for i, h in enumerate(nomlar, 1):
        c = wy.cell(row=row, column=i, value=h)
        c.font, c.fill, c.border = f_bosh, fill_bosh, chegara
        c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
def qator(row, vals, fmts, font=f_oddiy, fill=None):
    for i, (v, fm) in enumerate(zip(vals, fmts), 1):
        c = wy.cell(row=row, column=i, value=v)
        c.font, c.border = font, chegara
        if fm: c.number_format = fm
        if fill: c.fill = fill
    wy.cell(row=row, column=1).alignment = Alignment(horizontal='center')
SOM = '#,##0 "so\'m"'
r = 4
wy.cell(row=r, column=1, value="1. Xarajat turlari bo'yicha").font = f_qalin
r += 1
sarlavha(r, ['№', 'Xarajat turi', 'Summa, $', "Summa, so'm", 'Ulush'])
r += 1
tur_bosh = r
for i, tur in enumerate(TURLAR, 1):
    qator(r, [i, tur, f'=SUMIFS({rng("J")},{rng("C")},"{tur}")', f"=C{r}*{KURS}", f"=IF($C${tur_bosh + len(TURLAR)}=0,0,C{r}/$C${tur_bosh + len(TURLAR)})"],
          [None, None, USD, SOM, '0.0%'])
    wy.cell(row=r, column=3).font = f_yashil
    r += 1
JY = r
qator(r, ['', 'JAMI', f"=SUM(C{tur_bosh}:C{r - 1})", f"=C{r}*{KURS}", f"=SUM(E{tur_bosh}:E{r - 1})"], [None, None, USD, SOM, '0.0%'], f_qalin, fill_jami)
r += 1
qator(r, ['', f'="Kutilmagan xarajatlar ("&TEXT(Narxlar!$C${N["zaxira"]},"0%")&")"', f"=C{JY}*Narxlar!$C${N['zaxira']}", f"=C{r}*{KURS}", ''], [None, None, USD, SOM, None], f_oddiy, fill_jami)
r += 1
UY = r
qator(r, ['', 'UMUMIY JAMI', f"=C{JY}+C{JY + 1}", f"=C{r}*{KURS}", ''], [None, None, USD, SOM, None], Font(name=SHRIFT, size=11, bold=True), PatternFill('solid', fgColor='D9E1F2'))
r += 1
# taxminiy qism — manbasi «TAXMIN» bo'lgan barcha narx kalitlari bo'yicha (Hisob varag'ining K ustuni — narx kaliti)
TAXMIN_K = [k for k, _n, _v, _b, manba in NARX_QATORLAR if str(manba).startswith('TAXMIN')]
taxmin_f = '=' + '+'.join(f'SUMIFS({rng("J")},{rng("K")},"{k}")' for k in TAXMIN_K)
qator(r, ['', "shundan taxminiy narxlar (mebel, interyer, koworking sahnasi, koridor oxiri dekori, doskalar, 1-qavat logotiplari, kanalli konditsionerlar, diffuzor va panjaralar, eshik mexanizmlari) — kutilmagan xarajatsiz", taxmin_f, f"=C{r}*{KURS}", ''], [None, None, USD, SOM, None], f_kichik)
wy.cell(row=r, column=3).fill = fill_taxmin
r += 2
wy.cell(row=r, column=1, value="2. Qavat va bo'limlar bo'yicha").font = f_qalin
r += 1
sarlavha(r, ['№', "Bo'lim", 'Summa, $', "Summa, so'm", 'Ulush'])
r += 1
b_bosh = r
SX = "'Xonalar bo''yicha'"
for i, ((bolim, _), qq) in enumerate(zip(BOLIM, bolim_jami), 1):
    qator(r, [i, bolim, f"={SX}!${JAMI_UST}${qq}", f"=C{r}*{KURS}", f"=IF($C${b_bosh + len(BOLIM)}=0,0,C{r}/$C${b_bosh + len(BOLIM)})"], [None, None, USD, SOM, '0.0%'])
    wy.cell(row=r, column=3).font = f_yashil
    r += 1
qator(r, ['', 'JAMI', f"=SUM(C{b_bosh}:C{r - 1})", f"=C{r}*{KURS}", f"=SUM(E{b_bosh}:E{r - 1})"], [None, None, USD, SOM, '0.0%'], f_qalin, fill_jami)
r += 2
wy.cell(row=r, column=2, value="Tekshiruv: ikki jadval jamisi farqi (0 bo'lishi kerak)").font = f_kichik
c = wy.cell(row=r, column=3, value=f"=C{JY}-C{r - 2}")
c.font, c.number_format = f_kichik, USD
r += 1
wy.cell(row=r, column=2, value="Dollar kursi (so'm/$) — «Narxlar» varag'idan").font = f_kichik
c = wy.cell(row=r, column=3, value=f"={KURS}")
c.font, c.number_format = f_yashil, '#,##0'
for col, w in zip('ABCDE', [5, 46, 16, 20, 9]):
    wy.column_dimensions[col].width = w

# ---------- 5. Fazalar: ishlar ketma-ketligi, sanalar va pul oqimi ----------
# Har bir narx kaliti bo'yicha summa fazalarga ulush bilan taqsimlanadi (ko'k — o'zgartirish mumkin): uzoq tayyorlanadigan
# buyurtmalarga avans (mebel, logotip, kanalli konditsioner, shisha), qoldig'i yetkazib berish / o'rnatishda. Sanalar — boshlanish
# sanasidan, ish kunlari bo'yicha (dushanba–shanba, bayramlar chiqarib tashlanadi).
import datetime as dt
from openpyxl.formatting.rule import FormulaRule
FAZALAR = [
    ('F0', "Tayyorgarlik va buyurtmalar", 6,
     "Ijaraga beruvchining yozma roziligi (devor buzish, tomga tashqi bloklar); joyida o'lchov (oynalar, ustunlar, tom); pudratchilar bilan shartnomalar; "
     "uzoq tayyorlanadigan buyurtmalar — kanalli konditsionerlar, mebel va resepshn, logotiplar (avans)"),
    ('F1', "Buzish ishlari", 4, "Eski devorlarni buzish, qurilish chiqindisini olib chiqish; pol, oyna va eshiklarni himoyalash"),
    ('F2', "Qora ishlar va muhandislik tarmoqlari", 12,
     "GKL karkaslar va birinchi tomoni; elektr (yoritish, konditsioner liniyalari, kamera va yong'in signalizatsiyasi kabellari); santexnika quvurlari va nuqtalari; "
     "kanalli konditsionerlar (kladovka shifti ustida), vitechka ventilyatori, havo kanallari, freon trassalari va drenaj — shift yopilishidan oldin; tashqi blok tayanch ramalari"),
    ('F3', "Pardoz ishlari", 10,
     "GKL ikkinchi tomoni, shpaklyovka, bo'yoq; hojatxona kafeli; bambuk panellar; sahna poli; shisha devorlar o'lchovi va buyurtmasi (avans)"),
    ('F4', "O'rnatish ishlari", 10,
     "Shisha devor va suriladigan eshiklar, kladovka eshiklari, perila, yoritish, diffuzor va panjaralar, santexnika jihozlari va kabinalar, kameralar va NVR, "
     "yong'in signalizatsiyasi asboblari, interaktiv doskalar, matli plyonka, sahna yoritishi va ekran"),
    ('F5', "Mebel, brending va ishga tushirish", 6,
     "Mebel va resepshn (qoldiq), logotiplar, e'lon va e'tirof doskalari, sahna reykalari, ovoz, minbar; HVAC sozlash va sinov, "
     "yong'in xavfsizligi qabuli, tozalash"),
]
NF = len(FAZALAR)
def ul(**k): return [k.get(f, 0) for f, *_ in FAZALAR]
TAQSIMOT = {
    'buzish': ul(F1=1), 'chiqindi': ul(F1=1),
    'gkl': ul(F2=.5, F3=.5), 'sahnaDevor': ul(F2=.5, F3=.5),
    'issiqQuvur': ul(F2=1), 'sovuqQuvur': ul(F2=1), 'aksessuar': ul(F2=1), 'kanal': ul(F2=1), 'tochka': ul(F2=.5, F4=.5),
    'kk': ul(F0=.5, F2=.5), 'vv': ul(F2=1), 'kanalM': ul(F2=1), 'kabel': ul(F2=1), 'yongin': ul(F2=.4, F4=.6),
    'cat6': ul(F2=1), 'lotok': ul(F2=1), 'k25': ul(F2=1), 'k15': ul(F2=1), 'k54': ul(F2=1), 'gofra': ul(F2=1), 'shitQuti': ul(F2=1),
    'netMontaj': ul(F2=.5, F4=.5), 'elMontaj': ul(F2=.6, F4=.4),
    'poeSw': ul(F4=1), 'shkaf18': ul(F4=1), 'ups': ul(F4=1), 'router': ul(F4=1), 'sw48': ul(F4=1), 'patch': ul(F4=1), 'rj45': ul(F4=1), 'ap': ul(F4=1),
    'rozetka': ul(F4=1), 'vykl': ul(F4=1), 'difavt': ul(F4=1), 'avt1': ul(F4=1), 'avt3': ul(F4=1),
    'kafel': ul(F3=1), 'kafelUsta': ul(F3=1), 'bambuk': ul(F3=1), 'sahnaPol': ul(F3=1),
    'shisha': ul(F3=.5, F4=.5), 'kond3': ul(F3=1),
    'diffuzor': ul(F4=1), 'sorPanjara': ul(F4=1), 'qPanjara': ul(F4=1), 'surmaMex': ul(F4=1), 'eshKL': ul(F4=1),
    'doska': ul(F4=1), 'perila': ul(F4=1), 'yorXona': ul(F4=1), 'yorKatta': ul(F4=1),
    'chashagen': ul(F4=1), 'unitaz': ul(F4=1), 'rakovina': ul(F4=1), 'mustahab': ul(F4=1), 'taxoratSm': ul(F4=1), 'rakovinaSm': ul(F4=1), 'kabina': ul(F4=1),
    'kamera': ul(F4=1), 'kameraOrn': ul(F4=1), 'nvr': ul(F4=1), 'plyonka': ul(F4=1), 'sahnaYor': ul(F4=1), 'sahnaEkran': ul(F4=1),
    'stolOfis': ul(F0=.5, F5=.5), 'kreslo': ul(F0=.5, F5=.5), 'mijozStul': ul(F0=.5, F5=.5), 'divan': ul(F0=.5, F5=.5), 'shkaf': ul(F0=.5, F5=.5),
    'stolcha': ul(F0=.5, F5=.5), 'resepshn': ul(F0=.5, F5=.5), 'resepshnPanel': ul(F0=.5, F5=.5),
    'logo': ul(F0=.5, F5=.5), 'logoDevor1': ul(F0=.5, F5=.5), 'logoStol1': ul(F0=.5, F5=.5), 'sahnaLogo': ul(F0=.5, F5=.5),
    'interyerXZ1': ul(F5=1), 'interyerXZ2': ul(F5=1), 'elonDoska': ul(F5=1), 'etirofDoska': ul(F5=1),
    'sahnaReyka': ul(F5=1), 'sahnaAudio': ul(F5=1), 'minbar': ul(F5=1), 'sahnaOsimlik': ul(F5=1),
    'korMarmar': ul(F4=1), 'korYashil': ul(F4=1), 'korMox': ul(F5=1), 'korReyka': ul(F0=.5, F5=.5),
}
# ishlatilgan kalitlar (Hisob qatorlari tartibida) — har biriga taqsimot bo'lishi shart
KALITLAR, KTUR = [], {}
for kod, _ in XONALAR:
    for q in qatorlar[kod]:
        k = q['narx'][1] if isinstance(q['narx'], tuple) else q['narx']
        if k not in KTUR: KALITLAR.append(k); KTUR[k] = q['tur']
yoq = [k for k in KALITLAR if k not in TAQSIMOT]
assert not yoq, f"Fazalar taqsimoti yo'q: {yoq}"
assert all(abs(sum(v) - 1) < 1e-9 for v in TAQSIMOT.values())
KALITLAR.sort(key=lambda k: (min(i for i, v in enumerate(TAQSIMOT[k]) if v), TURLAR.index(KTUR[k])))
NARX_NOM = {k: nom for k, nom, *_ in NARX_QATORLAR}

wf = wb.create_sheet('Fazalar', 1)
wf['A1'] = "PDP Academy · Xadra filiali: xarajatlar fazalar bo'yicha — ishlar ketma-ketligi, sanalar va pul oqimi"
wf['A1'].font = f_sarlavha
wf['A2'] = ("Boshlanish sanasini (ko'k) o'zgartirsangiz, barcha sanalar qayta hisoblanadi. Ish haftasi — dushanba–shanba, bayramlar chiqariladi. "
            "Summalar «Hisob (batafsil)» dan, fazalarga ulush bilan (pastdagi 3-jadval; ko'k ulushlarni o'zgartirish mumkin).")
wf['A2'].font = f_kichik
SANA = 'DD.MM.YYYY'
wf['B4'] = 'Boshlanish sanasi'; wf['B4'].font = f_qalin
c = wf['C4']; c.value = dt.date(2026, 10, 19); c.number_format = SANA; c.font = Font(name=SHRIFT, size=10, bold=True, color='0000FF'); c.fill = PatternFill('solid', fgColor='FFF2CC')
wf['D4'] = "Taxmin: ruxsat va shartnomalardan keyingi dushanba — aniq sana bilan almashtiring"; wf['D4'].font = f_kichik
wf['B5'] = 'Bayramlar (ish kuni emas)'; wf['B5'].font = f_qalin
BAYRAM = [dt.date(2026, 12, 8), dt.date(2026, 12, 31), dt.date(2027, 1, 1), dt.date(2027, 1, 2)]
for i, b in enumerate(BAYRAM):
    c = wf.cell(row=5, column=3 + i, value=b); c.number_format = SANA; c.font = f_kok
BAY = f"$C$5:${get_column_letter(2 + len(BAYRAM))}$5"
WK = '"0000001"'    # faqat yakshanba dam

# 1-jadval: fazalar
r = 7
wf.cell(row=r, column=1, value="1. Fazalar: ishlar va sanalar").font = f_qalin
r += 1
SAR1 = ['Faza', 'Nomi', 'Ishlar', 'Ish kuni', 'Boshlanishi', 'Tugashi', 'Xarajat, $', 'Kutilmagan, $', 'Jami, $', "Jami, so'm", 'Ulush', "Yig'ma, $"]
for i, h in enumerate(SAR1, 1):
    c = wf.cell(row=r, column=i, value=h); c.font, c.fill, c.border = f_bosh, fill_bosh, chegara
    c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
F1R = r + 1
fq = {}
for i, (fk, nom, kun, ish) in enumerate(FAZALAR):
    r = F1R + i; fq[fk] = r
    bosh = f"=WORKDAY.INTL($C$4-1,1,{WK},{BAY})" if i == 0 else f"=WORKDAY.INTL(F{r - 1},1,{WK},{BAY})"
    vals = [fk, nom, ish, kun, bosh, f"=WORKDAY.INTL(E{r},D{r}-1,{WK},{BAY})", None, f"=G{r}*Narxlar!$C${N['zaxira']}", f"=G{r}+H{r}",
            f"=I{r}*{KURS}", f"=IF($I${F1R + NF}=0,0,I{r}/$I${F1R + NF})", f"=SUM($I${F1R}:I{r})"]
    for j, v in enumerate(vals, 1):
        c = wf.cell(row=r, column=j, value=v); c.font, c.border = f_oddiy, chegara
        c.alignment = Alignment(vertical='top', wrap_text=j in (2, 3))
    wf.cell(row=r, column=1).font = f_qalin; wf.cell(row=r, column=2).font = f_qalin
    wf.cell(row=r, column=4).font = f_kok
    for j, fm in [(5, SANA), (6, SANA), (7, USD0), (8, USD0), (9, USD0), (10, '#,##0'), (11, '0.0%'), (12, USD0)]:
        wf.cell(row=r, column=j).number_format = fm
    wf.row_dimensions[r].height = 52
r = F1R + NF
vals = ['', 'JAMI', '', f"=SUM(D{F1R}:D{r - 1})", f"=E{F1R}", f"=F{r - 1}", f"=SUM(G{F1R}:G{r - 1})", f"=SUM(H{F1R}:H{r - 1})",
        f"=SUM(I{F1R}:I{r - 1})", f"=I{r}*{KURS}", f"=SUM(K{F1R}:K{r - 1})", '']
for j, v in enumerate(vals, 1):
    c = wf.cell(row=r, column=j, value=v); c.font, c.border, c.fill = f_qalin, chegara, fill_jami
for j, fm in [(5, SANA), (6, SANA), (7, USD0), (8, USD0), (9, USD0), (10, '#,##0'), (11, '0.0%')]:
    wf.cell(row=r, column=j).number_format = fm
FJ = r
r += 1
wf.cell(row=r, column=2, value="Tekshiruv: «Yakuniy» UMUMIY JAMI bilan farq (0 bo'lishi kerak)").font = f_kichik
c = wf.cell(row=r, column=9, value=f"=I{FJ}-Yakuniy!$C${UY}"); c.font, c.number_format = f_kichik, USD
r += 1
wf.cell(row=r, column=2, value="Kalendar kunlar (boshlanishdan tugashgacha)").font = f_kichik
c = wf.cell(row=r, column=4, value=f"=F{FJ}-E{FJ}+1"); c.font = f_kichik

# 2-jadval: haftalik grafik va oylik pul oqimi
r += 2
wf.cell(row=r, column=1, value="2. Haftalik grafik (rangli — faza ishlaydigan hafta)").font = f_qalin
r += 1
HAFTA = 10
HR = r
wf.cell(row=r, column=1, value='Faza').font = f_bosh
wf.cell(row=r, column=2, value='Hafta boshi (dushanba)').font = f_bosh
for j in (1, 2): wf.cell(row=r, column=j).fill = fill_bosh
for h in range(HAFTA):
    c = wf.cell(row=r, column=3 + h, value=f"=$C$4-WEEKDAY($C$4,2)+1+7*{h}")
    c.number_format = 'DD.MM'; c.font, c.fill, c.border = f_bosh, fill_bosh, chegara
    c.alignment = Alignment(horizontal='center')
for i, (fk, nom, *_rest) in enumerate(FAZALAR):
    r += 1
    wf.cell(row=r, column=1, value=fk).font = f_qalin
    wf.cell(row=r, column=2, value=nom).font = f_oddiy
    for h in range(HAFTA):
        col = get_column_letter(3 + h)
        c = wf.cell(row=r, column=3 + h, value=f"=IF(AND($E${fq[fk]}<={col}${HR}+6,$F${fq[fk]}>={col}${HR}),1,0)")
        c.number_format = ';;;'; c.border = chegara
G1, G2 = HR + 1, r
wf.conditional_formatting.add(f"C{G1}:{get_column_letter(2 + HAFTA)}{G2}", FormulaRule(formula=[f'C{G1}=1'], fill=PatternFill('solid', fgColor='5B9BD5')))
r += 2
wf.cell(row=r, column=1, value="Oylik pul oqimi: faza summasi uning kalendar kunlariga teng taqsimlanadi (avanslar faza boshida to'lanishini hisobga oling)").font = f_qalin
r += 1
OY = 4
OR_ = r
wf.cell(row=r, column=1, value='Faza').font = f_bosh
wf.cell(row=r, column=2, value='Oy').font = f_bosh
for j in (1, 2): wf.cell(row=r, column=j).fill = fill_bosh
for m in range(OY):
    c = wf.cell(row=r, column=3 + m, value=f"=EDATE(DATE(YEAR($C$4),MONTH($C$4),1),{m})")
    c.number_format = 'MMM YYYY'; c.font, c.fill, c.border = f_bosh, fill_bosh, chegara
    c.alignment = Alignment(horizontal='center')
for i, (fk, nom, *_rest) in enumerate(FAZALAR):
    r += 1
    wf.cell(row=r, column=1, value=fk).font = f_qalin
    wf.cell(row=r, column=2, value=nom).font = f_oddiy
    for m in range(OY):
        col = get_column_letter(3 + m)
        f = (f"=$I${fq[fk]}*MAX(0,MIN($F${fq[fk]},EOMONTH({col}${OR_},0))-MAX($E${fq[fk]},{col}${OR_})+1)"
             f"/($F${fq[fk]}-$E${fq[fk]}+1)")
        c = wf.cell(row=r, column=3 + m, value=f); c.number_format = USD0; c.border = chegara
r += 1
wf.cell(row=r, column=2, value="Jami, $").font = f_qalin
wf.cell(row=r + 1, column=2, value="Jami, so'm").font = f_qalin
for m in range(OY):
    col = get_column_letter(3 + m)
    c = wf.cell(row=r, column=3 + m, value=f"=SUM({col}{OR_ + 1}:{col}{r - 1})"); c.number_format, c.font, c.fill, c.border = USD0, f_qalin, fill_jami, chegara
    c = wf.cell(row=r + 1, column=3 + m, value=f"={col}{r}*{KURS}"); c.number_format, c.font, c.fill, c.border = '#,##0', f_qalin, fill_jami, chegara
r += 3

# 3-jadval: taqsimot (narx kaliti × faza ulushi)
wf.cell(row=r, column=1, value="3. Xarajatlarning fazalarga taqsimoti (ulush — ko'k, o'zgartirish mumkin; har qatorda jami 100%)").font = f_qalin
r += 1
SAR3 = ['Kalit', 'Xarajat', 'Turi', 'Jami, $'] + [f"{fk}, %" for fk, *_ in FAZALAR] + ['Σ %'] + [f"{fk}, $" for fk, *_ in FAZALAR]
for i, h in enumerate(SAR3, 1):
    c = wf.cell(row=r, column=i, value=h); c.font, c.fill, c.border = f_bosh, fill_bosh, chegara
    c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
T3 = r + 1
for k in KALITLAR:
    r += 1
    vals = [k, NARX_NOM.get(k, k), KTUR[k], f'=SUMIFS({rng("J")},{rng("K")},$A{r})'] + TAQSIMOT[k] \
        + [f"=SUM({get_column_letter(5)}{r}:{get_column_letter(4 + NF)}{r})"] \
        + [f"=$D{r}*{get_column_letter(5 + i)}{r}" for i in range(NF)]
    for j, v in enumerate(vals, 1):
        c = wf.cell(row=r, column=j, value=v); c.font, c.border = f_oddiy, chegara
    wf.cell(row=r, column=1).font = f_kichik
    wf.cell(row=r, column=4).font = f_yashil; wf.cell(row=r, column=4).number_format = USD0
    for i in range(NF):
        c = wf.cell(row=r, column=5 + i); c.font, c.number_format = f_kok, '0%;;"-"'
        wf.cell(row=r, column=6 + NF + i).number_format = USD0
    wf.cell(row=r, column=5 + NF).number_format = '0%'
    if k.startswith(('stol', 'kreslo', 'mijoz', 'divan', 'shkaf', 'resepshn', 'logo', 'sahna', 'interyer', 'minbar', 'elon', 'etirof')):
        wf.cell(row=r, column=2).fill = fill_taxmin
T3E = r
r += 1
vals = ['', 'JAMI', '', f"=SUM(D{T3}:D{T3E})"] + ['' for _ in range(NF)] + [''] + [f"=SUM({get_column_letter(6 + NF + i)}{T3}:{get_column_letter(6 + NF + i)}{T3E})" for i in range(NF)]
for j, v in enumerate(vals, 1):
    c = wf.cell(row=r, column=j, value=v); c.font, c.border, c.fill = f_qalin, chegara, fill_jami
for j in [4] + list(range(6 + NF, 6 + 2 * NF)): wf.cell(row=r, column=j).number_format = USD0
T3J = r
r += 1
wf.cell(row=r, column=2, value="Tekshiruv: «Yakuniy» JAMI (kutilmagansiz) bilan farq (0 bo'lishi kerak)").font = f_kichik
c = wf.cell(row=r, column=4, value=f"=D{T3J}-Yakuniy!$C${JY}"); c.font, c.number_format = f_kichik, USD
wf.conditional_formatting.add(f"{get_column_letter(5 + NF)}{T3}:{get_column_letter(5 + NF)}{T3E}",
                              FormulaRule(formula=[f'ABS({get_column_letter(5 + NF)}{T3}-1)>0.0001'], fill=PatternFill('solid', fgColor='FFC7CE')))
# 1-jadvaldagi faza xarajati — 3-jadval ustunlari jamisidan
for i, (fk, *_r) in enumerate(FAZALAR):
    c = wf.cell(row=fq[fk], column=7, value=f"={get_column_letter(6 + NF + i)}{T3J}"); c.font, c.border, c.number_format = f_yashil, chegara, USD0
r += 2
for t in ["Izoh:",
          "• Avanslar (F0): mebel, resepshn va logotiplarga 50% (tayyorlash 3–4 hafta); kanalli konditsionerlarga 50% — qoldig'i yetkazib berilganda (F2).",
          "• Shisha devorlar: o'lchov GKL karkasdan keyin (F3) — avans 50%, qoldig'i o'rnatishda (F4). Kanalli konditsionerlar, kanallar va freon trassalari F2 da (shiftdan oldin); diffuzor va panjaralar F4 da.",
          "• Montaj, osma shift, pol, elektr kabellari va bo'yoq narxlari jadvalda yo'q (buyurtmachi bermagan) — kelishilgach shu fazalarga qo'shiladi.",
          "• Fazalar ketma-ket olingan; ustalar soni yetarli bo'lsa F2 va F3 qisman parallel ketishi mumkin — shunda «Ish kuni» ni kamaytiring."]:
    wf.cell(row=r, column=1, value=t).font = f_kichik; r += 1
for col, w in zip('ABCDEFGHIJKLMNOPQ', [7, 34, 60, 10, 12, 12, 12, 12, 12, 16, 9, 12, 10, 10, 10, 10, 10]):
    wf.column_dimensions[col].width = w
wf.freeze_panes = 'A4'

for sh in wb.worksheets:
    sh.page_setup.orientation = 'landscape'
    sh.page_setup.fitToWidth = 1
    sh.page_setup.fitToHeight = 0
    sh.sheet_properties.pageSetUpPr.fitToPage = True

CHIQISH.parent.mkdir(exist_ok=True)
wb.save(CHIQISH)
print(CHIQISH)
