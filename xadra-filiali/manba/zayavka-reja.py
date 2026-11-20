# Zayavkalar rejasi (ochilish 06.12.2026 gacha): har bir xarid/xizmat guruhi — alohida varaq, kompaniya zayavka shaklida
# («Заявка на приобретение ТМЦ и услуг»: nomi, birlik, soni, narx, summa, korporativ/naqd), birinchi varaqda — muddatlar va holat.
# Miqdor va narxlar — asosiy xarajatlar jadvalidan (Xadra_xarajatlar_v1.2.xlsx, «Hisob (batafsil)», qayta hisoblangan holati);
# 3-qavat erkaklar hojatxonasi — berilgan zayavka (30.10.2026, hisob/zayavkalar/).
# Ishlatish: python3 zayavka-reja.py → ../hisob/Xadra_zayavkalar_reja_v1.2.xlsx (keyin recalc)
import os, datetime as dt
from collections import OrderedDict
from openpyxl import Workbook, load_workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.datavalidation import DataValidation

BU = os.path.dirname(os.path.abspath(__file__))
ASOSIY = os.path.join(BU, '..', 'hisob', 'Xadra_xarajatlar_v1.2.xlsx')
CHIQ = os.path.join(BU, '..', 'hisob', 'Xadra_zayavkalar_reja_v1.2.xlsx')
OCHILISH = dt.date(2026, 12, 6)

# ---------------- asosiy jadvaldan: kalit bo'yicha jamlash ----------------
wa = load_workbook(ASOSIY, data_only=True)
KURS = next(r[2] for r in wa['Narxlar'].iter_rows(min_row=5, values_only=True) if r[1] == 'Dollar kursi')
MANBA = {r[1]: ((r[4] or ''), (r[3] or '')) for r in wa['Narxlar'].iter_rows(min_row=5, values_only=True) if r[1]}
NOM = {}
for r in wa['Fazalar'].iter_rows(values_only=True):
    if r[0] and r[1] and r[2] and isinstance(r[3], (int, float)) and str(r[0])[0].islower(): NOM[r[0]] = r[1]
ITEM = OrderedDict()
for r in wa['Hisob (batafsil)'].iter_rows(min_row=6, values_only=True):
    if not isinstance(r[0], int): continue
    k = r[10]
    it = ITEM.setdefault(k, dict(turi=r[2], miqdor=0.0, birlik=r[7], narx=r[8], summa=0.0))
    it['miqdor'] += r[6] or 0; it['summa'] += r[9] or 0

NAQD = {'kameraOrn', 'netMontaj', 'elMontaj', 'tochka', 'kafelUsta', 'buzish', 'chiqindi'}   # ish haqi — naqd (sanuzel zayavkasidagidek)

# (kod, nomi, kalitlar yoki turlar, berish: ochilishdan N kun oldin, yetkazish/o'rnatish: N kun oldin, savol/izoh)
Z = [
    ('Z01', "Konditsioner va ventilyatsiya", ['Konditsioner va ventilyatsiya'], 16, 6,
     "Kanalli blok modeli: hisob bo'yicha ~130k BTU kerak (96k olingan). Montaj + sozlash/sinov ochilishgacha"),
    ('Z02', "Mebel va interyer", ['Mebel va interyer'], 15, 2, "Narxlar TAXMIN — tijoriy taklif bilan almashtiring; tayyorlash 2–3 hafta"),
    ('Z03', "Shisha devor, eshiklar va matli plyonka", ['Shisha devor', 'Eshiklar', 'Matli plyonka'], 15, 3,
     "Shisha o'lchovi GKL karkasdan keyin; avans 50%"),
    ('Z04', "Interaktiv doskalar", ['Interaktiv doska'], 15, 3, ""),
    ('Z05', "Bambuk panel", ['Bambuk panel'], 15, 5, ""),
    ('Z06', "Logotiplar", ['Logotip'], 15, 2, "Tayyorlash 2–3 hafta"),
    ('Z07', "Gips karton (GKL) devorlar", ['Gips karton (GKL)'], 14, 8, ""),
    ('Z08', "Elektr va yoritish", ['Elektr', 'Yoritish'], 14, 4, "Mavjud shit kirish avtomati va bo'sh joyi (~46 kW) aniqlansin"),
    ('Z09', "Kamera tizimi, internet va Wi-Fi", ['Kamera tizimi', 'Internet va Wi-Fi'], 13, 3,
     "NVR 24 kamera uchun 32 kanalli bo'lishi kerak; provayder optikasi kirishi"),
    ('Z10', "Santexnika (ikkala hojatxona)", ['Santexnika'], 13, 3,
     "Erkaklar hojatxonasi kafeli va ish haqi — Z00 da (berilgan); asosiy jadvaldagi kafel (74 m²) bu yerga kiritilmadi"),
    ('Z11', "Perila", ['Perila'], 12, 3, ""),
    ('Z12', "Yong'in xavfsizligi", ["Yong'in xavfsizligi"], 12, 2, "Buyurtmachi summasi 18 mln — yangi miqdorlarni (53 datchik) qoplaydimi?"),
    ('Z13', "E'lon va e'tirof doskalari", ["E'lon va e'tirof doskalari"], 8, 1, ""),
    ('Z14', "Buzish ishlari", ['Buzish ishlari'], 16, 12, "Ehtimol bajarilgan — holatini belgilang"),
]
SANUZEL = [   # berilgan zayavka (30.10.2026, rasm — hisob/zayavkalar/)
    ("Dekor panel plenkali", 'dona', 28, 240000, 'Korporativ'), ("Ugol", 'dona', 20, 35000, 'Korporativ'),
    ("Soedinitel", 'dona', 30, 35000, 'Korporativ'), ("Kley", 'dona', 40, 40000, 'Korporativ'),
    ("Betonokontakt", 'chelak', 1, 200000, 'Korporativ'), ("Kley plitochniy", 'qop', 20, 40000, 'Korporativ'),
    ("Kafel", 'm²', 20, 80000, 'Korporativ'), ("Gidroizolyatsiya", 'chelak', 1, 150000, 'Korporativ'),
    ("Styajka", 'm²', 9, 100000, 'Naqd'), ("G'isht terish", 'tochka', 4, 100000, 'Naqd'),
    ("Ish haqi dekor", 'm²', 95.2, 60000, 'Naqd'), ("Kafel yopishtirish", 'm²', 20, 100000, 'Naqd'),
    ("Devor tekislash (suvoq ishlari)", 'm²', 12, 50000, 'Naqd'),
]

# ---------------- uslublar ----------------
SOM, USD, SANA = '#,##0', '$#,##0', 'DD.MM.YYYY'
ing = Side(style='thin', color='BFBFBF'); CH = Border(left=ing, right=ing, top=ing, bottom=ing)
SARL = PatternFill('solid', fgColor='1F3864'); OQ = Font(color='FFFFFF', bold=True)
JAMI = PatternFill('solid', fgColor='FFF2CC'); KIR = PatternFill('solid', fgColor='E2EFDA'); TX = PatternFill('solid', fgColor='FCE4D6')
QALIN = Font(bold=True); KOK = Font(color='0000FF')
WR = Alignment(wrap_text=True, vertical='top'); MK = Alignment(horizontal='center', vertical='top', wrap_text=True)


def k(ws, r, c, v, fmt=None, font=None, fill=None, al=WR):
    x = ws.cell(r, c, v); x.border, x.alignment = CH, al
    if fmt: x.number_format = fmt
    if font: x.font = font
    if fill: x.fill = fill
    return x


def bosh(ws, r, nomlar):
    for i, n in enumerate(nomlar, 1):
        c = ws.cell(r, i, n); c.fill, c.font, c.alignment, c.border = SARL, OQ, MK, CH


wb = Workbook()
rj = wb.active; rj.title = 'Reja'
HOLAT = '"Berilmagan,Tayyorlanmoqda,Berildi,Tasdiqlandi,To\'landi,Bajarildi"'


def zayavka_varaq(kod, nomi, qatorlar, yetkazish_ref, izoh=None, sana=None, holat_izoh=None):
    """Kompaniya zayavka shakli. qatorlar: (nomi, birlik, soni, narx so'm, turi, izoh, taxmin). Qaytaradi: (varaq, korp, naqd, jami katak)."""
    ws = wb.create_sheet(kod)
    for i, w in enumerate([5, 50, 10, 10, 14, 16, 13, 46], 1): ws.column_dimensions[get_column_letter(i)].width = w
    ws['A1'] = 'Заявка на приобретение ТМЦ и услуг'; ws['A1'].font = Font(bold=True, size=13)
    ws['A2'] = f"{kod} · {nomi}"; ws['A2'].font = Font(bold=True, size=11)
    sh = [("Организация:", 'ООО "PDP Academy" — Xadra filiali'), ("Дата формирования заявки:", sana),
          ("Планируемая дата поставки:", f"={yetkazish_ref}"), ("Департамент:", 'CIMO'), ("Ф.И.О. сотрудника:", None), ("Должность:", None)]
    for i, (a, b) in enumerate(sh, 3):
        ws.cell(i, 1, a).font = QALIN; ws.merge_cells(start_row=i, start_column=1, end_row=i, end_column=2)
        c = ws.cell(i, 3, b); ws.merge_cells(start_row=i, start_column=3, end_row=i, end_column=6)
        if 'Дата' in a: c.number_format = SANA
        if b is None or (a.startswith('Дата формирования') and sana is None): c.fill = KIR
    r0 = 10
    bosh(ws, r0, ['№', 'Наименование закупаемой ТМЦ или услуги', 'Ед. изм.', 'Кол-во', 'Цена, so\'m', 'Сумма, so\'m', 'Turi', 'Izoh / manba'])
    dv = DataValidation(type='list', formula1='"Korporativ,Naqd"', allow_blank=True); ws.add_data_validation(dv)
    r = r0 + 1
    for i, (n, b, s, p, t, iz, tx) in enumerate(qatorlar, 1):
        f = TX if tx else None
        k(ws, r, 1, i, al=MK, fill=f); k(ws, r, 2, n, fill=f); k(ws, r, 3, b, al=MK, fill=f)
        k(ws, r, 4, s, '#,##0.##', KOK, f); k(ws, r, 5, p, SOM, KOK, f); k(ws, r, 6, f'=D{r}*E{r}', SOM, fill=f)
        k(ws, r, 7, t, al=MK, fill=f); dv.add(ws.cell(r, 7)); k(ws, r, 8, iz, fill=f)
        r += 1
    a, b_ = r0 + 1, r - 1
    jam = {}
    for nom_, kr in (("Jami material (korporativ)", 'Korporativ'), ("Jami ish haqi (naqd)", 'Naqd')):
        k(ws, r, 2, nom_, font=QALIN, fill=JAMI)
        for c in (1, 3, 4, 5, 7, 8): k(ws, r, c, None, fill=JAMI)
        k(ws, r, 6, f'=SUMIF(G{a}:G{b_},"{kr}",F{a}:F{b_})', SOM, QALIN, JAMI); jam[kr] = f"'{kod}'!$F${r}"; r += 1
    k(ws, r, 2, 'ITOGO', font=QALIN, fill=JAMI)
    for c in (1, 3, 4, 5, 7, 8): k(ws, r, c, None, fill=JAMI)
    k(ws, r, 6, f'=SUM(F{a}:F{b_})', SOM, QALIN, JAMI); itogo = f"'{kod}'!$F${r}"
    r += 2
    if izoh: ws.cell(r, 2, izoh).alignment = WR; ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=8); ws.row_dimensions[r].height = 30; r += 1
    ws.cell(r, 2, "Pushti — narx taxminiy (TAXMIN). Ko'k raqamlarni (soni, narx) va «Turi» ni o'zgartirish mumkin — summa qayta hisoblanadi.").font = Font(italic=True, color='595959')
    ws.freeze_panes = f'A{r0 + 1}'
    ws.page_setup.orientation = 'landscape'; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0; ws.sheet_properties.pageSetUpPr.fitToPage = True
    return jam['Korporativ'], jam['Naqd'], itogo


# ---------------- Reja varag'i (bosh qism) ----------------
for i, w in enumerate([6, 38, 15, 15, 16, 11, 13, 10, 13, 15, 16, 52], 1): rj.column_dimensions[get_column_letter(i)].width = w
rj['A1'] = "PDP Academy · Xadra filiali — zayavkalar rejasi (ochilishgacha)"; rj['A1'].font = Font(bold=True, size=14)
rj['A2'] = ("Har bir zayavka — alohida varaqda, kompaniya shaklida (Z00–Z14). Summa — o'sha varaqdan formula bilan. Muddatlar — ochilish sanasidan "
            "orqaga (sanani o'zgartirsangiz qayta hisoblanadi). «Holati» ni ro'yxatdan tanlang; muddati o'tgan va berilmaganlar qizil bo'ladi.")
rj['A2'].alignment = WR; rj.merge_cells('A2:L2'); rj.row_dimensions[2].height = 32
rj['B4'] = 'Ochilish sanasi'; rj['B4'].font = QALIN; k(rj, 4, 3, OCHILISH, SANA, KOK, KIR)
rj['B5'] = 'Bugun'; rj['B5'].font = QALIN; k(rj, 5, 3, '=TODAY()', SANA)
rj['B6'] = "Kurs, so'm/$"; rj['B6'].font = QALIN; k(rj, 6, 3, KURS, SOM, KOK, KIR)
rj['E4'] = "Ochilishgacha qolgan kun"; rj['E4'].font = QALIN; k(rj, 4, 6, '=C4-C5', '0', QALIN)
wb.defined_names['Ochilish'] = DefinedName('Ochilish', attr_text='Reja!$C$4')
wb.defined_names['Kurs'] = DefinedName('Kurs', attr_text='Reja!$C$6')
R0 = 8
bosh(rj, R0, ['№', 'Zayavka', "Korporativ (material), so'm", "Naqd (ish haqi), so'm", "Jami, so'm", 'Jami, $', 'Berish muddati', 'Qolgan kun',
              "Yetkazish / o'rnatish", 'Holati', "Mas'ul", 'Hal qilinadigan savol / izoh'])
dvh = DataValidation(type='list', formula1=HOLAT, allow_blank=True); rj.add_data_validation(dvh)

r = R0 + 1
# Z00 — berilgan sanuzel zayavkasi
korp, naqd, itogo = zayavka_varaq('Z00', "Sanuzel remonti — 3-qavat erkaklar hojatxonasi (berilgan)",
                                  [(n, b, s, p, t, '', False) for n, b, s, p, t in SANUZEL], f'Reja!$I${r}',
                                  izoh="Berilgan zayavka (30.10.2026, CIMO, Haytbayev N) — rasmdan ko'chirilgan. Santexnika jihozlari va kabinalar bunga kirmagan (Z10).",
                                  sana=dt.date(2026, 10, 30))
qatorlar_reja = [('Z00', "Sanuzel remonti — 3-qavat erkaklar hojatxonasi", korp, naqd, itogo, dt.date(2026, 10, 30), 3, 'Berildi',
                  "Berilgan 30.10. Panel soni (28 dona) chizmaga nisbatan ko'p (~15 dona) — tekshirish; profil rangi — kumush (tasdiqlashda)")]
for kod, nomi, turlar, b_kun, y_kun, savol in Z:
    q = []
    for key, it in ITEM.items():
        if it['turi'] not in turlar: continue
        nm = NOM.get(key, key); manba, nb = MANBA.get(nm, ('', ''))
        tx = 'TAXMIN' in manba.upper()
        miq = round(it['miqdor'], 1) if it['birlik'] in ('m²', 'm') else round(it['miqdor'], 2)
        narx = round(it['summa'] / it['miqdor'] * KURS, -1) if it['miqdor'] else 0
        izoh = ('TAXMIN' if tx else 'Buyurtmachi narxi') + (f" — ${it['narx']:,.0f}/{it['birlik']} × kurs" if str(nb).startswith('$') else '')
        q.append((nm, it['birlik'], miq, narx, 'Naqd' if key in NAQD else 'Korporativ', izoh, tx))
    korp, naqd, itogo = zayavka_varaq(kod, nomi, q, f'Reja!$I${r + len(qatorlar_reja)}', izoh=savol or None)
    qatorlar_reja.append((kod, nomi, korp, naqd, itogo, f'=Ochilish-{b_kun}', y_kun, 'Berilmagan', savol))

for kod, nomi, korp, naqd, itogo, berish, y_kun, holat, savol in qatorlar_reja:
    k(rj, r, 1, kod, al=MK); c = k(rj, r, 2, nomi); c.hyperlink = f"#'{kod}'!A1"; c.font = Font(color='0563C1', underline='single')
    k(rj, r, 3, f'={korp}', SOM); k(rj, r, 4, f'={naqd}', SOM); k(rj, r, 5, f'={itogo}', SOM, QALIN); k(rj, r, 6, f'=E{r}/Kurs', USD)
    k(rj, r, 7, berish, SANA, al=MK); k(rj, r, 8, f'=G{r}-$C$5', '0', al=MK)
    k(rj, r, 9, f'=Ochilish-{y_kun}' if kod != 'Z00' else '=Ochilish-3', SANA, al=MK)
    k(rj, r, 10, holat, al=MK, fill=KIR); dvh.add(rj.cell(r, 10)); k(rj, r, 11, None, fill=KIR); k(rj, r, 12, savol)
    r += 1
a, b = R0 + 1, r - 1
k(rj, r, 2, 'JAMI (barcha zayavkalar)', font=QALIN, fill=JAMI)
for c in (1, 7, 8, 9, 10, 11, 12): k(rj, r, c, None, fill=JAMI)
for c in (3, 4, 5): k(rj, r, c, f'=SUM({get_column_letter(c)}{a}:{get_column_letter(c)}{b})', SOM, QALIN, JAMI)
k(rj, r, 6, f'=E{r}/Kurs', USD, QALIN, JAMI); rj_jami = r; r += 1
k(rj, r, 2, "shundan berilmagan", font=QALIN)
k(rj, r, 5, f'=SUMIF(J{a}:J{b},"Berilmagan",E{a}:E{b})+SUMIF(J{a}:J{b},"Tayyorlanmoqda",E{a}:E{b})', SOM, QALIN); k(rj, r, 6, f'=E{r}/Kurs', USD); r += 1
k(rj, r, 2, "Kutilmagan xarajatlar uchun zaxira (10%)"); k(rj, r, 5, f'=E{rj_jami}*0.1', SOM); k(rj, r, 6, f'=E{r}/Kurs', USD); r += 2
for t in [
    "Izoh:",
    "• Miqdor va narxlar — asosiy xarajatlar jadvalidan (Xadra_xarajatlar_v1.2.xlsx). Narx berilmagan joylar — TAXMIN (pushti); tijoriy taklif kelgach almashtiring.",
    "• Turi: material — korporativ, usta ishi (montaj, o'rnatish, buzish) — naqd (sanuzel zayavkasidagidek). Har varaqda o'zgartirish mumkin.",
    "• Asosiy jadvaldagi erkaklar hojatxonasi kafeli (74 m², 14.8 mln) Z00 bilan almashgan — bu rejaga qo'shilmadi.",
    "• Montaj, osma shift, pol va bo'yoq narxlari asosiy jadvalda yo'q (buyurtmachi bermagan) — kerak bo'lsa alohida zayavka qo'shiladi.",
    "• Muddatlar taxminiy: tayyorlanishi uzoq (konditsioner, mebel, shisha, doska, logotip) — darhol; montaj materiallari — shu hafta; yetkazish ochilishdan 1–8 kun oldin.",
]:
    c = rj.cell(r, 2, t); c.alignment = WR; rj.merge_cells(start_row=r, start_column=2, end_row=r, end_column=12)
    if t == "Izoh:": c.font = QALIN
    r += 1
rng = f'A{a}:L{b}'
rj.conditional_formatting.add(rng, FormulaRule(formula=[f'AND($H{a}<0,OR($J{a}="Berilmagan",$J{a}="Tayyorlanmoqda"))'], fill=PatternFill('solid', fgColor='F8CBAD')))
rj.conditional_formatting.add(rng, FormulaRule(formula=[f'AND($H{a}>=0,$H{a}<=2,OR($J{a}="Berilmagan",$J{a}="Tayyorlanmoqda"))'], fill=PatternFill('solid', fgColor='FFE699')))
rj.conditional_formatting.add(rng, FormulaRule(formula=[f'OR($J{a}="Bajarildi",$J{a}="To\'landi")'], fill=PatternFill('solid', fgColor='C6EFCE')))
rj.freeze_panes = f'C{R0 + 1}'
rj.page_setup.orientation = 'landscape'; rj.page_setup.fitToWidth = 1; rj.page_setup.fitToHeight = 0; rj.sheet_properties.pageSetUpPr.fitToPage = True
wb.save(CHIQ)
print('Saqlandi:', os.path.normpath(CHIQ), '· zayavkalar:', len(qatorlar_reja))
