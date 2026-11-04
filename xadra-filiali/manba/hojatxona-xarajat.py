# 3-qavat erkaklar hojatxonasi — alohida xarajatlar jadvali (founder tasdig'i va loyiha arxivi uchun).
# Manbalar: buyurtmachi zayavkasi «Sanuzel remonti» (30.10.2026, rasm — hisob/zayavkalar/), oldin berilgan santexnika narxlari
# (xarajatlar.py → Xadra_xarajatlar_v1.2.xlsx), hajmlar — 3-qavat modeli (qavat3.mjs, joyidagi foto 04.11).
# Ishlatish: python3 hojatxona-xarajat.py  → ../hisob/Xadra_3-qavat_hojatxona_xarajatlar_v1.2.xlsx (keyin recalc)
import json, os, subprocess
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

BU = os.path.dirname(os.path.abspath(__file__))
CHIQ = os.path.join(BU, '..', 'hisob', 'Xadra_3-qavat_hojatxona_xarajatlar_v1.2.xlsx')
D = json.loads(subprocess.check_output(['node', 'blender3-malumot.mjs'], cwd=BU))
WC = next(x for x in D['xonalar'] if x['kod'] == '2')['bolaklar'][0]
W3 = D['wc']
WC_DER = [d for d in D['derazalar'] if d.get('wc')]
ESH = next(e for e in D['eshiklar'] if e['kod'] == '2')

KURS = 11900      # so'm/$ — asosiy xarajatlar jadvalidagi kurs (buyurtmachi)

# ---------------- uslublar ----------------
SOM = '#,##0'
USD = '$#,##0'
ingichka = Side(style='thin', color='BFBFBF')
CHEGARA = Border(left=ingichka, right=ingichka, top=ingichka, bottom=ingichka)
SARLAVHA = PatternFill('solid', fgColor='1F3864')
BOLIM = PatternFill('solid', fgColor='D9E1F2')
JAMI = PatternFill('solid', fgColor='FFF2CC')
KIRITISH = PatternFill('solid', fgColor='E2EFDA')
TAXMIN = PatternFill('solid', fgColor='FCE4D6')
OQ = Font(color='FFFFFF', bold=True)
QALIN = Font(bold=True)
KOK = Font(color='0000FF')          # kiritiladigan raqamlar (narx, soni) — ko'k
WRAP = Alignment(wrap_text=True, vertical='top')
MARKAZ = Alignment(horizontal='center', vertical='top', wrap_text=True)

wb = Workbook()


def ustunlar(ws, kenglik):
    for i, k in enumerate(kenglik, 1):
        ws.column_dimensions[get_column_letter(i)].width = k


def bosh(ws, satr, nomlar):
    for i, n in enumerate(nomlar, 1):
        c = ws.cell(satr, i, n)
        c.fill, c.font, c.alignment, c.border = SARLAVHA, OQ, MARKAZ, CHEGARA


def katak(ws, r, c, v, fmt=None, font=None, fill=None, al=WRAP):
    x = ws.cell(r, c, v)
    x.border, x.alignment = CHEGARA, al
    if fmt: x.number_format = fmt
    if font: x.font = font
    if fill: x.fill = fill
    return x


def jadval(ws, r, qatorlar, bolim=None, ustun_turi=True):
    """qatorlar: (nomi, birlik, soni, narx, turi, chizma, izoh, taxmin). Summa = soni × narx. Qaytaradi: (birinchi, oxirgi) satr."""
    r0 = r
    for i, (nom, birlik, soni, narx, turi, chizma, izoh, tx) in enumerate(qatorlar, 1):
        f = TAXMIN if tx else None
        katak(ws, r, 1, i, al=MARKAZ, fill=f)
        katak(ws, r, 2, nom, fill=f)
        katak(ws, r, 3, birlik, al=MARKAZ, fill=f)
        katak(ws, r, 4, soni, '#,##0.##', KOK, f)
        katak(ws, r, 5, narx, SOM, KOK, f)
        katak(ws, r, 6, f'=D{r}*E{r}', SOM, fill=f)
        katak(ws, r, 7, f'=F{r}/Kurs', USD, fill=f)
        katak(ws, r, 8, turi, al=MARKAZ, fill=f)
        katak(ws, r, 9, chizma, fill=f)
        katak(ws, r, 10, izoh, fill=f)
        r += 1
    return r0, r - 1


def jami_satr(ws, r, nom, a, b, fill=JAMI):
    katak(ws, r, 2, nom, font=QALIN, fill=fill)
    for c in (1, 3, 4, 5, 8, 9, 10): katak(ws, r, c, None, fill=fill)
    katak(ws, r, 6, f'=SUM(F{a}:F{b})', SOM, QALIN, fill)
    katak(ws, r, 7, f'=F{r}/Kurs', USD, QALIN, fill)


USTUN = ['№', 'Nomi', 'Birlik', 'Soni', "Narxi, so'm", "Summa, so'm", 'Summa, $', "To'lov turi", "Chizma bo'yicha", 'Izoh / tekshiruv']
KENG = [5, 44, 9, 9, 14, 16, 11, 12, 22, 58]

# ---------------- Hajmlar (chizma bo'yicha) — formulalar bilan ----------------
hj = wb.active; hj.title = 'Hajmlar'
ustunlar(hj, [52, 12, 10, 70])
hj['A1'] = "Chizma bo'yicha hajmlar — 3-qavat erkaklar hojatxonasi (2-xona)"; hj['A1'].font = Font(bold=True, size=13)
hj['A2'] = ("Manba: 3-qavat modeli (qavat3.mjs), joyidagi foto (04.11). Shift, deraza tokchasi va supa balandliklari — fotodan taxminiy; "
            "yashil kataklarni joyida o'lchab o'zgartiring — hamma hisob qayta hisoblanadi.")
hj['A2'].alignment = WRAP; hj.merge_cells('A2:D2'); hj.row_dimensions[2].height = 30
bosh(hj, 4, ["Ko'rsatkich", 'Qiymat', 'Birlik', 'Izoh'])
H = {}


def hq(r, kod, nom, v, birlik, izoh, kirit=False):
    katak(hj, r, 1, nom); c = katak(hj, r, 2, v, '#,##0.00', KOK if kirit else None, KIRITISH if kirit else None)
    katak(hj, r, 3, birlik, al=MARKAZ); katak(hj, r, 4, izoh)
    H[kod] = f"Hajmlar!$B${r}"
    return r + 1


r = 5
mm = lambda v: round(v / 1000, 3)
r = hq(r, 'L', "Xona uzunligi (eshikdan deraza devorigacha)", mm(WC['x2'] - WC['x1']), 'm', 'qavat3.mjs', True)
r = hq(r, 'B', "Xona eni", mm(WC['y2'] - WC['y1']), 'm', 'qavat3.mjs', True)
r = hq(r, 'Hs', "Shift balandligi (mavjud PVX reyka)", W3['shift'] / 1000, 'm', 'Fotodan taxminiy — joyida o\'lchang', True)
r = hq(r, 'Pol', "Pol maydoni", f"={H['L']}*{H['B']}", 'm²', '')
r = hq(r, 'Per', "Devorlar perimetri", f"=2*({H['L']}+{H['B']})", 'm', '')
r = hq(r, 'Esh', "Eshik o'rni (en × balandlik)", f"={mm(ESH['b'] - ESH['a'])}*2.1", 'm²', f"Eshik {ESH['b'] - ESH['a']} × 2100", )
der_formula = '+'.join(f"{mm((d['x2'] - d['x1']) if (d['x2'] - d['x1']) > (d['y2'] - d['y1']) else (d['y2'] - d['y1']))}*{mm(d['tepa'] - d['tokcha'])}" for d in WC_DER)
r = hq(r, 'Der', "Derazalar (3 ta lenta deraza)", f"={der_formula}", 'm²', 'Shimoliy devorda 2 ta, sharqiyda 1 ta; tokcha ~1.85 m, tepasi ~2.55 m (foto)')
st = W3['stoyak']
r = hq(r, 'Sty', "Stoyak qutisi yuzalari", f"=({mm(st['x2'] - st['x1'])}+{mm(st['y2'] - st['y1'])})*{H['Hs']}", 'm²', "Shimoliy-g'arbiy burchakda, panel bilan qoplanadi")
r = hq(r, 'Dev', "Panel qoplanadigan devor maydoni (sof)", f"={H['Per']}*{H['Hs']}-{H['Esh']}-{H['Der']}+{H['Sty']}", 'm²', "Poldan shiftgacha, eshik va derazalar ayirilgan")
r = hq(r, 'PanelM', "Bitta panel maydoni (1.22 × 2.80 m)", 3.416, 'm²', "Zayavkada 95.2 m² / 28 dona = 3.4 m²", True)
r = hq(r, 'Zap', "Zapas (kesish, chiqindi)", 0.10, '', '10%', True)
r = hq(r, 'PanelSon', "Kerakli panel soni (zapas bilan)", f"=ROUNDUP({H['Dev']}*(1+{H['Zap']})/{H['PanelM']},0)", 'dona', '')
ks, sp, tl = W3['kabinaSupa'], W3['supa'], W3['taxorat']
r = hq(r, 'Supa', "Supa va kabinalar supasi maydoni (styajka)", f"={mm(ks['x2'] - ks['x1'])}*{mm(ks['y2'] - ks['y1'])}+{mm(sp['x2'] - sp['x1'])}*{mm(sp['y2'] - sp['y1'])}", 'm²',
       f"Kabinalar supasi +0.30 ({mm(ks['x2'] - ks['x1'])} × {mm(ks['y2'] - ks['y1'])}), supa +0.15 ({mm(sp['x2'] - sp['x1'])} × {mm(sp['y2'] - sp['y1'])})")
yon = (f"={mm(ks['y2'] - ks['y1'])}*{ks['h'] / 1000}+{mm(sp['y2'] - sp['y1'])}*{sp['h'] / 1000}+{mm(ks['x2'] - ks['x1'])}*{(ks['h'] - sp['h']) / 1000}"
       f"+{mm(tl['x2'] - tl['x1'])}*({tl['h'] / 1000}*2+{tl['lab'] / 1000})+{mm(tl['y2'] - tl['y1'])}*{tl['h'] / 1000}*2")
r = hq(r, 'Yon', "Supa, pog'ona va taxorat lotogi yon yuzalari (kafel)", yon, 'm²', "Supa old yuzalari, kabinalar supasining yon yuzasi, lotok labi va uchi (ikki tomoni va usti)")
r = hq(r, 'Kafel', "Kafel — pol, supa va lotok (zapas bilan)", f"=({H['Pol']}+{H['Yon']})*(1+{H['Zap']})", 'm²', '')
r = hq(r, 'Kafel_sarf', "Kafel kleyi sarfi (odatdagi me'yor)", 5, 'kg/m²', "Pol kafeli uchun odatda 4–6 kg/m² (TAXMIN)", True)
r = hq(r, 'KleyQop', "Kafel kleyi (25 kg qop)", f"=ROUNDUP({H['Kafel']}*{H['Kafel_sarf']}/25,0)", 'qop', '')
hj.freeze_panes = 'A5'

# ---------------- Narxlar (kurs) — nomlangan katak ----------------
from openpyxl.workbook.defined_name import DefinedName

# ---------------- Zayavka ----------------
zy = wb.create_sheet('Zayavka', 0)
ustunlar(zy, KENG)
zy['A1'] = "Zayavka: TMTs va xizmatlar xaridi — «Sanuzel remonti» (3-qavat erkaklar hojatxonasi)"; zy['A1'].font = Font(bold=True, size=13)
zy['A2'] = ("OOO «PDP Academy» · Zayavka sanasi: 30.10.2026 · Departament: CIMO · Tashabbuskor: Haytbayev N (bo'lim boshlig'i). "
            "Raqamlar zayavka rasmidan ko'chirilgan; summa = soni × narx (formula). «Chizma bo'yicha» — 3-qavat modelidan hisob (Hajmlar varag'i).")
zy['A2'].alignment = WRAP; zy.merge_cells('A2:J2'); zy.row_dimensions[2].height = 30
bosh(zy, 4, USTUN)
r = 5
katak(zy, r, 1, 'A', font=QALIN, fill=BOLIM); katak(zy, r, 2, 'Materiallar', font=QALIN, fill=BOLIM)
for c in range(3, 11): katak(zy, r, c, None, fill=BOLIM)
r += 1
MAT = [
    ("Dekor panel plenkali (PVX marmar panel)", 'dona', 28, 240000, 'Korporativ', f"={H['PanelSon']}", "Chizma bo'yicha devor ~44 m² → 15 dona (10% zapas bilan). Zayavkada 28 dona = 95.2 m² — tekshirish kerak (balandligi yoki boshqa joy ham kiradimi?)", False),
    ("Ugol (panel burchak profili)", 'dona', 20, 35000, 'Korporativ', None, "", False),
    ("Soedinitel (panel ulash profili)", 'dona', 30, 35000, 'Korporativ', None, "", False),
    ("Kley (panel uchun)", 'dona', 40, 40000, 'Korporativ', None, "", False),
    ("Betonokontakt", 'chelak', 1, 200000, 'Korporativ', None, "", False),
    ("Kley plitochniy (kafel kleyi)", 'qop', 20, 40000, 'Korporativ', f"={H['KleyQop']}", "Odatdagi sarf 4–6 kg/m² → ~5 qop (25 kg). Zayavkada 20 qop — supa/tekislash uchun ham bo'lsa, izohlansin", False),
    ("Kafel", 'm²', 20, 80000, 'Korporativ', f"={H['Kafel']}", "Pol 15.5 m² + supa va lotok yuzalari + 10% — mos", False),
    ("Gidroizolyatsiya", 'chelak', 1, 150000, 'Korporativ', None, "", False),
]
mat = jadval(zy, r, MAT); r = mat[1] + 1
for i in range(mat[0], mat[1] + 1):
    if zy.cell(i, 9).value: zy.cell(i, 9).number_format = '#,##0.0'
jami_satr(zy, r, 'Jami materiallar', *mat); r_mat = r; r += 1
katak(zy, r, 1, 'B', font=QALIN, fill=BOLIM); katak(zy, r, 2, "Ish haqi", font=QALIN, fill=BOLIM)
for c in range(3, 11): katak(zy, r, c, None, fill=BOLIM)
r += 1
ISH = [
    ("Styajka", 'm²', 9, 100000, 'Naqd', f"={H['Supa']}", "Supa (+0.15) va kabinalar supasi (+0.30) — mos", False),
    ("G'isht terish", 'tochka', 4, 100000, 'Naqd', None, "Supa, kabinalar supasi, taxorat lotogi labi", False),
    ("Ish haqi dekor (panel o'rnatish)", 'm²', 95.2, 60000, 'Naqd', f"={H['Dev']}", "Chizma bo'yicha ~44 m² — panel soni bilan birga tekshirilsin", False),
    ("Kafel yopishtirish", 'm²', 20, 100000, 'Naqd', f"={H['Kafel']}", "", False),
    ("Devor tekislash (suvoq ishlari)", 'm²', 12, 50000, 'Naqd', None, "Fotoda: shimoliy devorda eski suvoq ko'chgan (deraza ostida ~5.5 × 1 m) va eshik yonida", False),
]
ish = jadval(zy, r, ISH); r = ish[1] + 1
for i in range(ish[0], ish[1] + 1):
    if zy.cell(i, 9).value: zy.cell(i, 9).number_format = '#,##0.0'
jami_satr(zy, r, "Jami ish haqi", *ish); r_ish = r; r += 1
katak(zy, r, 2, "JAMI ZAYAVKA (ITOGO)", font=QALIN, fill=JAMI)
for c in (1, 3, 4, 5, 8, 9, 10): katak(zy, r, c, None, fill=JAMI)
katak(zy, r, 6, f'=F{r_mat}+F{r_ish}', SOM, QALIN, JAMI); katak(zy, r, 7, f'=F{r}/Kurs', USD, QALIN, JAMI); r_zy = r
r += 2
zy.cell(r, 2, "Tekshiruv: zayavkadagi jami summalar — materiallar 12 820 000, ish haqi 9 612 000, jami 22 432 000 so'm.").font = Font(italic=True, color='595959')
zy.cell(r + 1, 2, "Farq (formula − zayavka), so'm:").font = Font(italic=True, color='595959')
katak(zy, r + 1, 6, f'=F{r_zy}-22432000', SOM)
zy.freeze_panes = 'C5'

# ---------------- Santexnika (oldin berilgan narxlar) ----------------
sx = wb.create_sheet('Santexnika', 1)
ustunlar(sx, KENG)
sx['A1'] = "Santexnika jihozlari va kabinalar — 3-qavat erkaklar hojatxonasi"; sx['A1'].font = Font(bold=True, size=13)
sx['A2'] = ("Narxlar — buyurtmachi oldin bergan (asosiy jadval Xadra_xarajatlar_v1.2.xlsx, «Narxlar»). Soni — shu hojatxona chizmasi bo'yicha "
            "(asosiy jadvalda ikkala hojatxona birga). Zayavkaga kirmagan — alohida tasdiqlanadi.")
sx['A2'].alignment = WRAP; sx.merge_cells('A2:J2'); sx.row_dimensions[2].height = 30
bosh(sx, 4, USTUN)
r = 5
SX = [
    ("Chashagen", 'dona', len(W3['chashagen']), 700000, '', '3 ta kabina (supada)', "Buyurtmachi narxi", False),
    ("Unitaz", 'dona', len(W3['unitaz']), 1200000, '', '1-kabina (pastki polda)', "Buyurtmachi narxi", False),
    ("Rakovina", 'dona', len(W3['rakovina']), 650000, '', 'Quyma rakovina 1.50 m, 2 chanoq', "Buyurtmachi narxi 2 × 650 000 olindi. Quyma (yaxlit) rakovina narxi boshqacha bo'lsa — almashtiring", False),
    ("Rakovina smesiteli", 'dona', len(W3['rakovina']), 400000, '', 'Har chanoqqa', "Buyurtmachi narxi", False),
    ("Mustahab", 'dona', len(W3['mustahab']), 200000, '', 'Har kabinada', "Buyurtmachi narxi", False),
    ("Taxorat smesiteli (jo'mrak)", 'dona', len(W3['taxoratJomrak']), 400000, '', 'Taxorat lotogida', "Buyurtmachi narxi", False),
    ("Hojatxona kabinasi (HPL to'siq va eshik bilan)", 'dona', 4, 1200000, '', '4 ta (1 unitazli, 3 chashagenli)', "Buyurtmachi narxi", False),
]
sxj = jadval(sx, r, SX); r = sxj[1] + 1
jami_satr(sx, r, "Jami santexnika jihozlari va kabinalar", *sxj); r_sx = r; r += 2
katak(sx, r, 1, 'i', font=QALIN, fill=BOLIM)
katak(sx, r, 2, "Ma'lumot uchun: ikkala hojatxona (3-qavat erkaklar + 2-qavat ayollar) uchun umumiy santexnika ishlari va quvurlar — asosiy jadvaldan", font=QALIN, fill=BOLIM)
for c in range(3, 11): katak(sx, r, c, None, fill=BOLIM)
sx.row_dimensions[r].height = 30
r += 1
UM = [
    ("Santexnika nuqtalari — usta ishi (suv va kanalizatsiya)", 'nuqta', 16, 1000000, '', '', "Buyurtmachi: 16 nuqta ikkala hojatxona uchun. Bu hojatxona ulushi aniqlanmagan", False),
    ("Issiq suv quvuri", 'm', 40, 25000, '', '', "Buyurtmachi", False),
    ("Sovuq suv quvuri", 'm', 40, 12000, '', '', "Buyurtmachi «12 0000» deb yozgan — 12 000 olindi; tekshiring", False),
    ("Quvur aksessuarlari (fitinglar)", 'dona', 100, 5000, '', '', "Buyurtmachi: jami 500 000", False),
    ("Kanalizatsiya quvuri (40 m) va otvodlar", 'komplekt', 1, 4000000, '', '', "Buyurtmachi: jami summa", False),
]
umj = jadval(sx, r, UM); r = umj[1] + 1
jami_satr(sx, r, "Jami — ikkala hojatxona uchun (bu hojatxona jamiga kirmagan, ulushi aniqlanadi)", *umj, fill=BOLIM); r_um = r
sx.row_dimensions[r].height = 30
sx.freeze_panes = 'C5'

# ---------------- Qo'shimcha (TAXMIN) ----------------
qx = wb.create_sheet("Qo'shimcha", 2)
ustunlar(qx, KENG)
qx['A1'] = "Loyihada bor, lekin zayavkada va oldingi ma'lumotlarda narxi yo'q — TAXMIN (Toshkent bozori)"; qx['A1'].font = Font(bold=True, size=13)
qx['A2'] = "Pushti qatorlar — taxminiy narx. Kerak bo'lmasa, sonini 0 qiling; narx aniqlansa — almashtiring."
qx['A2'].alignment = WRAP; qx.merge_cells('A2:J2')
bosh(qx, 4, USTUN)
r = 5
QX = [
    ("Trap (zanglamas, 15 × 15 sm)", 'dona', 3, 150000, '', 'Eshik yonida, supada, lotokda', "TAXMIN", True),
    ("Ko'zgu (rakovina ustida, ~1.2 × 0.7 m) va tokcha", 'komplekt', 1, 600000, '', 'Quyma rakovina ustida', "TAXMIN", True),
    ("Qo'l quritgich (elektr)", 'dona', 1, 700000, '', "G'arbiy devorda", "TAXMIN", True),
    ("Hojatxona qog'ozi ushlagichi", 'dona', 4, 60000, '', 'Har kabinada', "TAXMIN", True),
]
qxj = jadval(qx, r, QX); r = qxj[1] + 1
jami_satr(qx, r, "Jami qo'shimcha (TAXMIN)", *qxj); r_qx = r
qx.freeze_panes = 'C5'

# ---------------- Xulosa ----------------
xl = wb.create_sheet('Xulosa', 0)
ustunlar(xl, [5, 62, 18, 13, 14, 46])
xl['A1'] = "PDP Academy · Xadra filiali — 3-qavat erkaklar hojatxonasi (sanuzel remonti): xarajatlar"; xl['A1'].font = Font(bold=True, size=14)
xl['A2'] = ("Founder tasdig'i va loyiha arxivi uchun · tuzilgan: 04.11.2026 · loyiha v1.2. Batafsil — keyingi varaqlarda; "
            "summa — formulalar (zayavka va narxlar o'zgarsa, qayta hisoblanadi).")
xl['A2'].alignment = WRAP; xl.merge_cells('A2:F2'); xl.row_dimensions[2].height = 30
bosh(xl, 4, ['№', "Bo'lim", "Summa, so'm", 'Summa, $', "To'lov turi", 'Manba / holati'])
QT = [
    ('1', "Zayavka — materiallar (dekor panel, profillar, kley, kafel, gidroizolyatsiya)", f"=Zayavka!F{r_mat}", 'Korporativ', "Zayavka 30.10.2026 (CIMO, Haytbayev N)"),
    ('2', "Zayavka — ish haqi (styajka, g'isht, panel va kafel o'rnatish, suvoq)", f"=Zayavka!F{r_ish}", 'Naqd', "Zayavka 30.10.2026"),
    ('3', "Santexnika jihozlari va kabinalar (chashagen, unitaz, rakovina, smesitellar, mustahab, 4 ta kabina)", f"=Santexnika!F{r_sx}", '', "Buyurtmachi narxlari (oldin berilgan); zayavkaga kirmagan"),
    ('4', "Qo'shimcha jihozlar (trap, ko'zgu, qo'l quritgich va b.)", f"=\'Qo\'\'shimcha\'!F{r_qx}", '', "TAXMIN — narxi aniqlanadi"),
]
r = 5
for n, nom, f, turi, manba in QT:
    katak(xl, r, 1, n, al=MARKAZ); katak(xl, r, 2, nom); katak(xl, r, 3, f, SOM); katak(xl, r, 4, f'=C{r}/Kurs', USD)
    katak(xl, r, 5, turi, al=MARKAZ); katak(xl, r, 6, manba, fill=TAXMIN if n == '4' else None)
    r += 1
katak(xl, r, 2, "Zayavka bo'yicha jami (1 + 2) — tasdiqlash uchun", font=QALIN, fill=JAMI)
katak(xl, r, 3, '=C5+C6', SOM, QALIN, JAMI); katak(xl, r, 4, f'=C{r}/Kurs', USD, QALIN, JAMI)
for c in (1, 5, 6): katak(xl, r, c, None, fill=JAMI)
r_z = r; r += 1
katak(xl, r, 2, "HOJATXONA JAMI (1 + 2 + 3 + 4)", font=QALIN, fill=JAMI)
katak(xl, r, 3, '=SUM(C5:C8)', SOM, QALIN, JAMI); katak(xl, r, 4, f'=C{r}/Kurs', USD, QALIN, JAMI)
for c in (1, 5, 6): katak(xl, r, c, None, fill=JAMI)
r += 1
katak(xl, r, 1, 'i', al=MARKAZ, fill=BOLIM)
katak(xl, r, 2, "Ma'lumot uchun (jamiga kirmagan): ikkala hojatxona uchun umumiy santexnika ishlari va quvurlar", fill=BOLIM)
katak(xl, r, 3, f"=Santexnika!F{r_um}", SOM, fill=BOLIM); katak(xl, r, 4, f'=C{r}/Kurs', USD, fill=BOLIM)
katak(xl, r, 5, None, fill=BOLIM); katak(xl, r, 6, "Asosiy jadvaldan; bu hojatxona ulushi aniqlanadi", fill=BOLIM)
r += 2
xl.cell(r, 2, 'Kurs, so\'m/$').font = QALIN
k = katak(xl, r, 3, KURS, '#,##0', KOK, KIRITISH); r_kurs = r
xl.cell(r, 6, "Asosiy xarajatlar jadvalidagi kurs (buyurtmachi)")
wb.defined_names['Kurs'] = DefinedName('Kurs', attr_text=f"Xulosa!$C${r_kurs}")
r += 2
xl.cell(r, 2, "Tekshirish kerak (chizma bilan solishtirish):").font = QALIN
izohlar = [
    "• Dekor panel: zayavkada 28 dona (95.2 m²); chizma bo'yicha panel qoplanadigan devor ~44 m² (shift ~3.0 m, derazalar va eshik ayirilgan) → 15 dona yetadi. "
    "Shift balandligi boshqacha yoki boshqa joy (tambur, 2-qavat ayollar hojatxonasi) ham kirsa — aniqlansin.",
    "• Kafel kleyi: zayavkada 20 qop; 20 m² kafel uchun odatda ~5 qop (25 kg) yetadi.",
    "• Styajka 9 m² va kafel 20 m² — chizmaga mos (supa 8.4 m²; pol, supa va lotok yuzalari ~20 m²).",
    "• Santexnika jihozlari va kabinalar zayavkada yo'q — alohida zayavka yoki tasdiq kerak.",
    "• Asosiy xarajatlar jadvalida (Xadra_xarajatlar_v1.2.xlsx) erkaklar hojatxonasi devori kafel bilan (58 m²) hisoblangan — endi devor dekor panel (shu zayavka); asosiy jadval yangilanishi kerak.",
]
for t in izohlar:
    r += 1; c = xl.cell(r, 2, t); c.alignment = WRAP; xl.merge_cells(start_row=r, start_column=2, end_row=r, end_column=6); xl.row_dimensions[r].height = 32
r += 2
for t in ("Tayyorladi: ______________________   sana: ____________", "Tasdiqlayman (Founder): ______________________   sana: ____________"):
    xl.cell(r, 2, t).font = QALIN; r += 2
xl.freeze_panes = 'A5'

for ws in wb.worksheets:
    ws.sheet_view.zoomScale = 90
    ws.page_setup.orientation = 'landscape'; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
os.makedirs(os.path.dirname(CHIQ), exist_ok=True)
wb.save(CHIQ)
print('Saqlandi:', os.path.normpath(CHIQ))
