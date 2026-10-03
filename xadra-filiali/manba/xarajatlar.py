# Xarajatlar jadvali (Excel): chizmadagi yangi devorlar, shisha, bambuk panel, interaktiv doska, perila.
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
    ('K1', "K1 koridori"), ('K2', "K2 koridori"), ('KW', "Koworking zali"), ('ZL', "Kirish zali"),
    ('ZINA', "Zinapoya"), ('YQ', "Yuqori qavat o'quv xonasi"),
]
NOM = dict(XONALAR)
BOLIM = [("O'quv xonalari", ['SR1', 'SR2', 'SR3', 'SR4', 'SR5', 'SR6', 'SR7', 'YQ']),
         ("Ofis xonalari", ['XZ1', 'XZ2', 'XZ3', 'XZ4']),
         ("Umumiy joylar", ['K1', 'K2', 'KW', 'ZL', 'ZINA'])]
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
    ('H', "Devor balandligi (poldan shiftgacha)", 3.5, "m", "Buyurtmachi: bino balandligi 3.5 m"),
    ('Hsh', "Shisha qism balandligi", 2.5, "m", "Buyurtmachi"),
    ('Hust', "Shisha ustidagi GKL", '=C{H}-C{Hsh}', "m", "Hisob: devor balandligi − shisha"),
    ('Hesh', "Eshik balandligi", 2.1, "m", "Taxmin: standart eshik 900 × 2100"),
    ('HeUst', "Eshik ustidagi GKL", '=C{H}-C{Hesh}', "m", "Hisob: devor balandligi − eshik"),
    ('eshEn', "Eshik eni", 0.9, "m", "Chizmadan"),
    ('Hb', "Bambuk panel balandligi", '=C{H}', "m", "Taxmin: poldan shiftgacha. Pastroq bo'lsa, shu katakka raqam yozing"),
]

# ---------- Batafsil qatorlar ----------
qatorlar = {k: [] for k, _ in XONALAR}


def qosh(xona, tur, joy, uz=None, bal=None, miqdor=None, birlik='m²', narx=None):
    qatorlar[xona].append(dict(tur=tur, joy=joy, uz=uz, bal=bal, miqdor=miqdor, birlik=birlik, narx=narx))


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

for e in d['eshiklar']:
    kor = KORIDOR.get(e['kod']) or next(s['koridor'] for s in d['sinflar'] if s['kod'] == e['kod'])
    qosh(e['kod'], 'Gips karton (GKL)', f"Eshik ustidagi GKL ({NOM[kor]} bilan orasida)", 'eshEn', 'HeUst', narx='gkl')
    qosh(kor, 'Gips karton (GKL)', f"Eshik ustidagi GKL ({NOM[e['kod']]} eshigi)", 'eshEn', 'HeUst', narx='gkl')

for s in d['sinflar']:
    qosh(s['kod'], 'Bambuk panel', "Doska devori", s['doskaDevor'] / 1000, 'Hb', narx='bambuk')
    qosh(s['kod'], 'Bambuk panel', "Orqa devor" + (" (L shaklining keng qismi)" if s['kod'] == 'SR4' else ''), s['orqaDevor'] / 1000, 'Hb', narx='bambuk')
    qosh(s['kod'], 'Interaktiv doska', "Doska devoriga", miqdor=1, birlik='dona', narx='doska')
qosh('YQ', 'Interaktiv doska', "Yuqori qavatdagi o'quv xonasi uchun", miqdor=1, birlik='dona', narx='doska')
qosh('ZINA', 'Perila', "Perila (buyurtmachi bergan uzunlik)", 'perilaUz', None, birlik='m', narx='perila')

TURLAR = ['Shisha devor', 'Gips karton (GKL)', 'Bambuk panel', 'Interaktiv doska', 'Perila']
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
    q.number_format = USD if birlik.startswith('$') else '0.00'
    wn.cell(row=rr, column=1).alignment = Alignment(horizontal='center')
oxir = r + len(NARX_QATORLAR)
izohlar = [
    "Hisoblash qoidalari",
    "• Gips karton (GKL) devor: uzunlik × balandlik. Devorning har bir tomoni o'zi qaragan xonaga yoziladi (xona tomoni — xonaga, koridor tomoni — koridorga).",
    "• Shisha devor: shisha qism (2.5 m) xonaga yoziladi; ustidagi GKL (1 m) ikki tomonlama — xona va koridor tomoni alohida.",
    "• Eshik ustida (eshik tepasidan shiftgacha) GKL — ikki tomonlama. Eshikning o'zi narxi berilmagani uchun kiritilmadi.",
    "• Bambuk panel: har bir o'quv xonasining doska devori va orqa devori, poldan shiftgacha. Interaktiv doska orqasidagi qism ayirilmagan.",
    "• Interaktiv doska: 7 ta shu qavat sinflariga va 1 ta yuqori qavatdagi o'quv xonasiga — jami 8 ta.",
    "• Perila: buyurtmachi bergan uzunlik (24 m), «Zinapoya» qatorida.",
    "• Uzunliklar chizma v1.0 dan (mavjud holat chizmasining fotosi asosida) — ish boshlanishidan oldin joyida o'lchanadi.",
    "• Kirmagan: eshiklar, pol, shift, bo'yoq, elektr, ventilyatsiya va konditsioner, mebel, ish haqi (agar narxga kirmagan bo'lsa).",
    "Ranglar: ko'k — qo'lda kiritilgan qiymat; yashil — boshqa varaqdan olingan; qora — formula; sariq fon — o'zgartirish mumkin bo'lgan kataklar.",
]
for i, t in enumerate(izohlar):
    c = wn.cell(row=oxir + 1 + i, column=2, value=t)
    c.font = f_qalin if i == 0 else f_kichik
for col, w in zip('ABCDE', [5, 38, 12, 9, 80]):
    wn.column_dimensions[col].width = w


def narx_havola(k):
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
            miqdor = f"=E{r}*F{r}"
        elif q['birlik'] == 'm':
            miqdor = f"=E{r}"
        else:
            miqdor = q['miqdor']
        vals = [n, nom, q['tur'], q['joy'], uz_val, bal_val, miqdor, q['birlik'], narx_havola(q['narx']), f"=G{r}*I{r}"]
        for j, v in enumerate(vals, 1):
            c = wd.cell(row=r, column=j, value=v)
            c.font, c.border = f_oddiy, chegara
        wd.cell(row=r, column=5).font = f_yashil if isinstance(uz, str) else f_kok
        if bal_val:
            wd.cell(row=r, column=6).font = f_yashil
        if q['birlik'] == 'dona':
            wd.cell(row=r, column=7).font = f_kok
        wd.cell(row=r, column=9).font = f_yashil
        wd.cell(row=r, column=1).alignment = Alignment(horizontal='center')
        wd.cell(row=r, column=8).alignment = Alignment(horizontal='center')
        for j, fmt in [(5, SON), (6, SON), (7, SON if q['birlik'] != 'dona' else DONA), (9, USD), (10, USD)]:
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
UST = ['Xona', 'Shisha devor, m²', 'Shisha devor, $', 'Gips karton (GKL), m²', 'Gips karton (GKL), $',
       'Bambuk panel, m²', 'Bambuk panel, $', 'Interaktiv doska, dona', 'Interaktiv doska, $', 'Perila, m', 'Perila, $', 'Jami, $']
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
    for j in range(1, 13):
        ws.cell(row=r, column=j).fill = fill_guruh
    r += 1
    bosh = r
    for kod in kodlar:
        nom = NOM[kod]
        ws.cell(row=r, column=1, value=nom).font = f_oddiy
        for t, tur in enumerate(TURLAR):
            mq = ws.cell(row=r, column=2 + 2 * t, value=f'=SUMIFS({rng("G")},{rng("B")},$A{r},{rng("C")},"{tur}")')
            sm = ws.cell(row=r, column=3 + 2 * t, value=f'=SUMIFS({rng("J")},{rng("B")},$A{r},{rng("C")},"{tur}")')
            mq.font = sm.font = f_yashil
            mq.number_format = DONA if tur == 'Interaktiv doska' else SON
            sm.number_format = USD0
        jm = ws.cell(row=r, column=12, value=f"=C{r}+E{r}+G{r}+I{r}+K{r}")
        jm.font, jm.number_format = f_qalin, USD0
        for j in range(1, 13):
            ws.cell(row=r, column=j).border = chegara
        r += 1
    ws.cell(row=r, column=1, value=f"{bolim} — jami").font = f_qalin
    for j in range(2, 13):
        L = get_column_letter(j)
        c = ws.cell(row=r, column=j, value=f"=SUM({L}{bosh}:{L}{r - 1})")
        c.font = f_qalin
        c.number_format = ws.cell(row=r - 1, column=j).number_format
    for j in range(1, 13):
        ws.cell(row=r, column=j).fill = fill_jami
        ws.cell(row=r, column=j).border = chegara
    bolim_jami.append(r)
    r += 2
ws.cell(row=r, column=1, value="JAMI").font = Font(name=SHRIFT, size=11, bold=True)
for j in range(2, 13):
    L = get_column_letter(j)
    c = ws.cell(row=r, column=j, value='=' + '+'.join(f"{L}{x}" for x in bolim_jami))
    c.font = Font(name=SHRIFT, size=11, bold=True)
    c.number_format = ws.cell(row=bolim_jami[0], column=j).number_format
for j in range(1, 13):
    ws.cell(row=r, column=j).fill = PatternFill('solid', fgColor='D9E1F2')
    ws.cell(row=r, column=j).border = chegara
JAMI_QATOR = r
r += 2
ws.cell(row=r, column=1, value="Tekshiruv: batafsil varaqdagi jami bilan farq (0 bo'lishi kerak)").font = f_kichik
c = ws.cell(row=r, column=12, value=f"=L{JAMI_QATOR}-{D_}!J{OXIRGI + 1}")
c.font, c.number_format = f_kichik, USD
ws.column_dimensions['A'].width = 28
for j in range(2, 13):
    ws.column_dimensions[get_column_letter(j)].width = 13
ws.column_dimensions['L'].width = 14
ws.freeze_panes = 'B5'

for sh in wb.worksheets:
    sh.page_setup.orientation = 'landscape'
    sh.page_setup.fitToWidth = 1
    sh.page_setup.fitToHeight = 0
    sh.sheet_properties.pageSetUpPr.fitToPage = True

CHIQISH.parent.mkdir(exist_ok=True)
wb.save(CHIQISH)
print(CHIQISH)
