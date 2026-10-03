# Xarajatlar jadvali (Excel): chizmadagi yangi devorlar, shisha, bambuk panel, interaktiv doska, perila,
# shisha eshiklar, yoritish, videokuzatuv, logotiplar, matli plyonka, yong'in xavfsizligi, buzish ishlari va
# 10% kutilmagan xarajat. So'mdagi narxlar «Narxlar» varag'idagi kurs bo'yicha dollarga o'tkaziladi.
# Uzunliklar model.mjs dan (xarajat-malumot.mjs orqali), narx va balandliklar «Narxlar» varag'ida —
# ularni Excelda o'zgartirsa, butun hisob formulalar bilan qayta hisoblanadi.
#   python3 xarajatlar.py            → ../hisob/Xadra_2-qavat_xarajatlar_v1.0.xlsx
import json
import subprocess
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

BU = Path(__file__).resolve().parent
CHIQISH = BU.parent / 'hisob' / 'Xadra_2-qavat_xarajatlar_v1.0.xlsx'

d = json.loads(subprocess.check_output(['node', str(BU / 'xarajat-malumot.mjs')], text=True))

XONALAR = [
    ('SR1', "1-xona"), ('SR2', "2-xona"), ('SR3', "3-xona"), ('SR4', "4-xona"),
    ('SR5', "5-xona"), ('SR6', "6-xona"), ('SR7', "7-xona"),
    ('XZ1', "Offline sotuv (XZ1)"), ('XZ2', "Admin (XZ2)"), ('XZ3', "Ustozlar xonasi (XZ3)"), ('XZ4', "Call-markaz (XZ4)"),
    ('X12', "CEO xonasi (12-xona)"),
    ('K1', "K1 koridori"), ('K2', "K2 koridori"), ('KW', "Koworking zali"), ('ZL', "Kirish zali"),
    ('ZINA', "Zinapoya"), ('BQ', "Butun qavat (umumiy ishlar)"), ('YQ', "Yuqori qavat o'quv xonasi (5.45 × 8.60)"),
]
NOM = dict(XONALAR)
BOLIM = [("O'quv xonalari", ['SR1', 'SR2', 'SR3', 'SR4', 'SR5', 'SR6', 'SR7', 'YQ']),
         ("Ofis xonalari", ['XZ1', 'XZ2', 'XZ3', 'XZ4', 'X12']),
         ("Umumiy joylar", ['K1', 'K2', 'KW', 'ZL', 'ZINA', 'BQ'])]
KORIDOR = {'XZ1': 'K2', 'XZ2': 'K2', 'XZ3': 'K1', 'XZ4': 'K1'}
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
    ('kameraSoni', "Videokameralar soni", 16, "dona", "Buyurtmachi"),
    ('kameraOrn', "Kamera o'rnatish (har biri)", 21, "$/dona", "Buyurtmachi"),
    ('nvr', "NVR (videoregistrator)", 840, "$/dona", "Buyurtmachi"),
    ('kabel', "Kamera kabellari (jami)", 303, "$/komplekt", "Buyurtmachi: jami summa"),
    ('logo', "Logotiplar (jami)", 2500, "$/komplekt", "Buyurtmachi: jami summa"),
    ('kurs', "Dollar kursi", 11900, "so'm/$", "Buyurtmachi; so'mdagi narxlar shu kurs bo'yicha $ ga o'tadi"),
    ('plyonka', "Matli plyonka (shisha devorga)", 800000, "so'm/dona", "Buyurtmachi"),
    ('plyonkaSoni', "Matli plyonka soni", 8, "dona", "Buyurtmachi"),
    ('yongin', "Yong'in xavfsizligi (signalizatsiya, o't o'chirgich, belgilar, avariya chiroqlari)", 18000000, "so'm/komplekt", "Buyurtmachi: jami summa"),
    ('buzish', "Devor buzish", 50000, "so'm/m²", "Buyurtmachi"),
    ('chiqindi', "Qurilish chiqindisini olib chiqish", 1200000, "so'm/komplekt", "Buyurtmachi: jami summa"),
    ('zaxira', "Kutilmagan xarajatlar", 0.10, "ulush", "Buyurtmachi: umumiy summadan 10%"),
    ('H', "Devor balandligi (poldan shiftgacha)", 3.5, "m", "Buyurtmachi: bino balandligi 3.5 m"),
    ('Hsh', "Shisha qism balandligi", 2.5, "m", "Buyurtmachi"),
    ('Hust', "Shisha ustidagi GKL", '=C{H}-C{Hsh}', "m", "Hisob: devor balandligi − shisha"),
    ('Hesh', "Eshik balandligi", 2.1, "m", "Taxmin: standart eshik 900 × 2100"),
    ('HeUst', "Eshik ustidagi GKL", '=C{H}-C{Hesh}', "m", "Hisob: devor balandligi − eshik"),
    ('eshEn', "Eshik eni", 0.9, "m", "Chizmadan"),
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
        if not boshqa:
            joy = "Koridor uchidagi burchak ustunchasi"
        elif f['l'] <= 550 and not w['izoh']:
            joy = f"Eshik yonidagi kesak ({nomlar(boshqa)} tomoni)"
        else:
            joy = f"{nomlar(boshqa)} bilan orasidagi devor" + (" — mavjud devordagi bo'shliqni yopish" if w['izoh'] else '')
        qosh(f['kod'], 'Gips karton (GKL)', joy, f['l'] / 1000, 'H', narx='gkl')

# Yangi eshiklar shisha: eshik (2.1 m) va ustidagi shisha (0.4 m) — shisha devor bilan bir chiziqda 2.5 m gacha;
# ustida, shisha devordagi kabi, 1 m GKL ikki tomondan.
for e in d['eshiklar']:
    kor = KORIDOR.get(e['kod']) or next(s['koridor'] for s in d['sinflar'] if s['kod'] == e['kod'])
    qosh(e['kod'], 'Shisha devor', f"Shisha eshik va ustidagi shisha ({NOM[kor]} tomoni)", 'eshEn', 'Hsh', narx='shisha')
    qosh(e['kod'], 'Gips karton (GKL)', f"Eshik ustidagi GKL ({NOM[kor]} bilan orasida)", 'eshEn', 'Hust', narx='gkl')
    qosh(kor, 'Gips karton (GKL)', f"Eshik ustidagi GKL ({NOM[e['kod']]} eshigi)", 'eshEn', 'Hust', narx='gkl')

for s in d['sinflar']:
    qosh(s['kod'], 'Bambuk panel', "Doska devori", s['doskaDevor'] / 1000, 'Hb', narx='bambuk')
    qosh(s['kod'], 'Bambuk panel', "Orqa devor" + (" (L shaklining keng qismi)" if s['kod'] == 'SR4' else ''), s['orqaDevor'] / 1000, 'Hb', narx='bambuk')
    qosh(s['kod'], 'Interaktiv doska', "Doska devoriga", miqdor=1, birlik='dona', narx='doska')
for o in d['ofislar']:
    for dv in o['devorlar']:
        qosh(o['kod'], 'Bambuk panel', dv['nom'], dv['uz'] / 1000, 'Hb', narx='bambuk')
        if dv.get('eshik'):
            qosh(o['kod'], 'Bambuk panel', "Eshik o'rni (ayiriladi)", 'eshEn', 'Hesh', narx='bambuk', manfiy=True)
# Yuqori qavatdagi o'quv xonasi (buyurtmachi bergan chizma: 5.45 × 8.60 m, 46.87 m²) — 3 devorga 2.5 m balandlikda:
# doska devori va unga qarama-qarshi devor (5.45 m), eshikli uzun devor (8.60 m); derazali uzun devorga qilinmaydi.
qosh('YQ', 'Bambuk panel', "Doska devori (eni)", 5.45, 'HbYQ', narx='bambuk')
qosh('YQ', 'Bambuk panel', "Orqa devor (eni)", 5.45, 'HbYQ', narx='bambuk')
qosh('YQ', 'Bambuk panel', "Uzun devor (eshikli)", 8.60, 'HbYQ', narx='bambuk')
qosh('YQ', 'Bambuk panel', "Eshik o'rni (ayiriladi)", 'eshEn', 'Hesh', narx='bambuk', manfiy=True)
qosh('YQ', 'Interaktiv doska', "Yuqori qavatdagi o'quv xonasi uchun", miqdor=1, birlik='dona', narx='doska')
qosh('ZINA', 'Perila', "Perila (buyurtmachi bergan uzunlik)", 'perilaUz', None, birlik='m', narx='perila')

# Yoritish (buyurtmachi narxi joy boshiga): koridorlar va koworking — katta, xonalar — kichik komplekt
for kod in ['SR1', 'SR2', 'SR3', 'SR4', 'SR5', 'SR6', 'SR7', 'XZ1', 'XZ2', 'XZ3', 'XZ4', 'X12']:
    qosh(kod, 'Yoritish', "Lampalar (xona uchun)", miqdor=1, birlik='komplekt', narx='yorXona')
for kod in ['K1', 'K2', 'KW']:
    qosh(kod, 'Yoritish', "Lampalar", miqdor=1, birlik='komplekt', narx='yorKatta')
# Videokuzatuv va logotiplar — butun qavat uchun
qosh('BQ', 'Kamera tizimi', "Videokamera", miqdor='kameraSoni', birlik='dona', narx='kamera')
qosh('BQ', 'Kamera tizimi', "Kamera o'rnatish", miqdor='kameraSoni', birlik='dona', narx='kameraOrn')
qosh('BQ', 'Kamera tizimi', "NVR (videoregistrator)", miqdor=1, birlik='dona', narx='nvr')
qosh('BQ', 'Kamera tizimi', "Kabellar (jami)", miqdor=1, birlik='komplekt', narx='kabel')
qosh('BQ', 'Logotip', "Logotiplar (jami)", miqdor=1, birlik='komplekt', narx='logo')
# So'mdagi ishlar (narx $ = so'm ÷ kurs)
qosh('BQ', 'Matli plyonka', "Shisha devorlarga matli plyonka", miqdor='plyonkaSoni', birlik='dona', narx=('som', 'plyonka'))
qosh('BQ', "Yong'in xavfsizligi", "Signalizatsiya, o't o'chirgichlar, evakuatsiya belgilari, avariya chiroqlari (jami)", miqdor=1, birlik='komplekt', narx=('som', 'yongin'))
for w in d['buziladi']:
    joy = f"{w['izoh']} o'rnidagi bo'lak" if 'koridori' in w['izoh'] else w['izoh']
    qosh('BQ', 'Buzish ishlari', f"Devorni buzish — {joy}", w['uz'] / 1000, 'H', narx=('som', 'buzish'))
qosh('BQ', 'Buzish ishlari', "Qurilish chiqindisini olib chiqish (jami)", miqdor=1, birlik='komplekt', narx=('som', 'chiqindi'))

TURLAR = ['Shisha devor', 'Gips karton (GKL)', 'Bambuk panel', 'Interaktiv doska', 'Perila', 'Yoritish', 'Kamera tizimi', 'Logotip',
          'Matli plyonka', "Yong'in xavfsizligi", 'Buzish ishlari']
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
wn['A1'] = "PDP Academy · Xadra filiali — 2-qavat: narxlar va o'lchamlar"
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
        q.font, q.fill = f_kok, fill_sariq
    q.number_format = (USD if birlik.startswith('$') else '#,##0 "so\'m"' if birlik.startswith("so'm/") else '#,##0' if birlik == "so'm/$"
                       else '0%' if birlik == 'ulush' else '0' if birlik == 'dona' else '0.00')
    wn.cell(row=rr, column=1).alignment = Alignment(horizontal='center')
oxir = r + len(NARX_QATORLAR)
izohlar = [
    "Hisoblash qoidalari",
    "• Gips karton (GKL) devor: uzunlik × balandlik. Devorning har bir tomoni o'zi qaragan xonaga yoziladi (xona tomoni — xonaga, koridor tomoni — koridorga).",
    "• Shisha devor: shisha qism (2.5 m) xonaga yoziladi; ustidagi GKL (1 m) ikki tomonlama — xona va koridor tomoni alohida.",
    "• Eshiklar shisha: eshik (2.1 m) va ustidagi shisha (0.4 m) — 2.5 m gacha shisha narxida; ustida 1 m GKL ikki tomondan. Eshik furniturasi (ilgak, qulf, tutqich, dovodchik) kirmagan.",
    "• Bambuk panel, poldan shiftgacha: o'quv xonalarida doska devori va orqa devor (interaktiv doska orqasi ayirilmagan); ofis xonalarida ikkala uzun yon devor; CEO xonasida ikkita ichki kar devor, eshik o'rni ayiriladi. Derazali tashqi va shisha devorlarga qilinmaydi.",
    "• Yuqori qavat o'quv xonasi (5.45 × 8.60 m, buyurtmachi chizmasi): bambuk panel 3 devorga, 2.5 m balandlikda — doska devori, orqa devor va eshikli uzun devor (eshik o'rni ayiriladi); derazali uzun devorga qilinmaydi.",
    "• Interaktiv doska: 7 ta shu qavat sinflariga va 1 ta yuqori qavatdagi o'quv xonasiga — jami 8 ta.",
    "• Perila: buyurtmachi bergan uzunlik (24 m), «Zinapoya» qatorida.",
    "• Uzunliklar chizma v1.0 dan (mavjud holat chizmasining fotosi asosida) — ish boshlanishidan oldin joyida o'lchanadi.",
    "• Yoritish: koridorlar (K1, K2) va koworking zaliga 336 $ dan, o'quv xonalari (7), ofis xonalari (4) va CEO xonasiga 168 $ dan. Kirish zali, WC va yuqori qavat xonasi kiritilmagan.",
    "• Videokuzatuv: 16 ta kamera (40 $) va o'rnatish (21 $ dan), NVR, kabellar jami; logotiplar jami — «Butun qavat» qatorida.",
    "• So'mdagi narxlar (matli plyonka, yong'in xavfsizligi, devor buzish va chiqindi) «Dollar kursi» katagi bo'yicha (11 900 so'm/$) $ ga o'tkaziladi.",
    "• Devor buzish: chizmadagi buziladigan devorlar uzunligi × devor balandligi (3.5 m) × 50 000 so'm/m².",
    "• Kutilmagan xarajatlar: umumiy summadan 10% — «Xonalar bo'yicha» varag'ining oxirida.",
    "• Kirmagan: konditsioner va ventilyatsiya (usta bilan keyin aniqlanadi); mebel va pol (kafel) mavjud; internet — mavjud; eshik furniturasi; shift va bo'yoq; ish haqi (agar narxga kirmagan bo'lsa).",
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
wd['A1'] = "PDP Academy · Xadra filiali — 2-qavat: xarajatlar hisobi, xonalar bo'yicha batafsil"
wd['A1'].font = f_sarlavha
wd['A2'] = "Uzunliklar chizmadan (m). Balandlik va narx «Narxlar» varag'idan olinadi (yashil). Miqdor = uzunlik × balandlik; summa = miqdor × narx."
wd['A2'].font = f_kichik
SARLAVHA = ['№', 'Xona', 'Ish turi', 'Joyi / izoh', 'Uzunlik, m', 'Balandlik, m', 'Miqdor', 'Birlik', 'Narx, $', 'Summa, $']
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
        if q['birlik'] == 'm²':
            miqdor = f"=-E{r}*F{r}" if q['manfiy'] else f"=E{r}*F{r}"
        elif q['birlik'] == 'm':
            miqdor = f"=E{r}"
        else:
            miqdor = narx_havola(q['miqdor']) if isinstance(q['miqdor'], str) else q['miqdor']
        vals = [n, nom, q['tur'], q['joy'], uz_val, bal_val, miqdor, q['birlik'], narx_havola(q['narx']), f"=G{r}*I{r}"]
        for j, v in enumerate(vals, 1):
            c = wd.cell(row=r, column=j, value=v)
            c.font, c.border = f_oddiy, chegara
        wd.cell(row=r, column=5).font = f_yashil if isinstance(uz, str) else f_kok
        if bal_val:
            wd.cell(row=r, column=6).font = f_yashil
        if q['birlik'] not in ('m²', 'm'):
            wd.cell(row=r, column=7).font = f_yashil if isinstance(q['miqdor'], str) else f_kok
        wd.cell(row=r, column=9).font = f_yashil
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
for col, w in zip('ABCDEFGHIJ', [5, 24, 18, 58, 11, 11, 10, 7, 11, 13]):
    wd.column_dimensions[col].width = w
wd.freeze_panes = 'A5'

# ---------- 3. Xonalar bo'yicha ----------
ws = wb.create_sheet("Xonalar bo'yicha", 0)
ws['A1'] = "PDP Academy · Xadra filiali — 2-qavat: xarajatlar, xonalar bo'yicha"
ws['A1'].font = f_sarlavha
ws['A2'] = "Har bir qator «Hisob (batafsil)» varag'idan olinadi (SUMIFS). Narxlarni «Narxlar» varag'ida o'zgartiring."
ws['A2'].font = f_kichik
UST = ['Xona', 'Shisha (devor va eshik), m²', 'Shisha (devor va eshik), $', 'Gips karton (GKL), m²', 'Gips karton (GKL), $',
       'Bambuk panel, m²', 'Bambuk panel, $', 'Interaktiv doska, dona', 'Interaktiv doska, $', 'Perila, m', 'Perila, $',
       'Yoritish, $', 'Kamera tizimi, $', 'Logotip, $', 'Matli plyonka, $', "Yong'in xavfsizligi, $", 'Buzish ishlari, $', 'Jami, $']
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

for sh in wb.worksheets:
    sh.page_setup.orientation = 'landscape'
    sh.page_setup.fitToWidth = 1
    sh.page_setup.fitToHeight = 0
    sh.sheet_properties.pageSetUpPr.fitToPage = True

CHIQISH.parent.mkdir(exist_ok=True)
wb.save(CHIQISH)
print(CHIQISH)
