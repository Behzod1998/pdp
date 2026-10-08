# Xarajatlar xulosasi (albom uchun): qayta hisoblangan Excel'dan (LibreOffice recalc) qiymatlarni JSON qilib chiqaradi.
#   python3 xarajat-xulosa.py → stdout (JSON)
import json
from pathlib import Path
from openpyxl import load_workbook

BU = Path(__file__).resolve().parent
fayl = sorted((BU.parent / 'hisob').glob('Xadra_xarajatlar_v*.xlsx'))[-1]
wb = load_workbook(fayl, data_only=True)
wy, ws = wb['Yakuniy'], wb["Xonalar bo'yicha"]

turlar, bolimlar, qoshimcha, bolim = [], [], {}, None
for row in wy.iter_rows(min_row=4, values_only=True):
    a, b, c, d, e = (list(row) + [None] * 5)[:5]
    if a == "2. Qavat va bo'limlar bo'yicha": bolim = True; continue
    if isinstance(a, int) and isinstance(c, (int, float)):
        (bolimlar if bolim else turlar).append({'nom': b, 'usd': c, 'som': d, 'ulush': e})
    elif b in ('JAMI', 'UMUMIY JAMI') and not bolim:
        qoshimcha[b] = {'usd': c, 'som': d}
    elif isinstance(b, str) and b.startswith('Kutilmagan'):
        qoshimcha['zaxira'] = {'usd': c, 'som': d, 'nom': b}
    elif isinstance(b, str) and b.startswith('shundan taxminiy'):
        qoshimcha['taxmin'] = {'usd': c, 'som': d}
xonalar, joriy = [], None
oxirgi = ws.max_column
for row in ws.iter_rows(min_row=5, values_only=True):
    a, jami = row[0], row[oxirgi - 1]
    if not a: continue
    if jami is None and not str(a).startswith(('JAMI', 'UMUMIY', 'Kutilmagan', 'Tekshiruv')):
        joriy = a; continue
    if str(a).endswith('— jami') or str(a).startswith(('JAMI', 'UMUMIY', 'Kutilmagan', 'Tekshiruv')): continue
    xonalar.append({'bolim': joriy, 'nom': a, 'usd': jami})
kurs = wb['Narxlar']
kurs_q = next(r[2] for r in kurs.iter_rows(min_row=5, values_only=True) if r[1] == 'Dollar kursi')
print(json.dumps({'fayl': fayl.name, 'turlar': turlar, 'bolimlar': bolimlar, 'xonalar': xonalar, 'kurs': kurs_q, **qoshimcha}, ensure_ascii=False))
