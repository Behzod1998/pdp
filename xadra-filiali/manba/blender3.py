# 3-qavat — Blender sahnasi va renderlar (Cycles). Umumiy qismlar: blender_umumiy.py
# Ishlatish:
#   node blender3-malumot.mjs > 3qavat.json
#   python blender3.py 3qavat.json ../chizma/3d [--tez] [--blend] [--faqat umumiy,sinf,wc1,wc2]
# (bpy moduli kerak: pip install bpy==4.2.0 — Python 3.11)
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import blender_umumiy as bu
from blender_umumiy import Q, P, M, H, KESIM, SILL, HEAD, ESH_H

A = bu.argv()
D = json.load(open(A['json']))
BAMBUK_H = 2500   # 5-xonada bambuk panel balandligi (buyurtmachi)
bu.boshla()

# ---------------- pollar ----------------
WC_X = D['wc']
CHASH = [(x - 225, x + 225, y - 300, y + 300) for x, y in WC_X['chashagen']]
QUDUQ = (300, 2900, 1400, 6050)      # zinapoya quduq'i (pastga ochiq)
B = D['bino']
q = Q()
for r in bu.tesik((0, B['L'], 0, B['B']), [QUDUQ, *CHASH]):
    q.box(*r, -250, 0, M['beton'])
q.obj('plita', 'asos')
POL = {'sinf': M['pol_parket'], 'koridor': M['pol_plitka'], 'wc': M['wc_pol'], 'yopiq': M['yopiq_pol'], 'zina': M['zina']}
for x in D['xonalar']:
    q = Q()
    for b in x['bolaklar']:
        r = (b['x1'], b['x2'], b['y1'], b['y2'])
        tesh = CHASH if x['tur'] == 'wc' else [QUDUQ] if x['tur'] == 'zina' else []
        for rr in bu.tesik(r, tesh):
            q.box(*rr, 0, 10, POL[x['tur']])
    q.obj(f"pol_{x['kod']}", 'asos')

# ---------------- devorlar ----------------
DERAZALAR = D['derazalar']
def devor_bolaklar(h):
    out = [k for w in D['devorlar'] for k in bu.devor_kesimlari(w, DERAZALAR, h)]
    for e in D['eshiklar']:
        if e.get('kabina'): continue
        t1, t2 = e['qalinlik']
        rect = (t1, t2, e['a'], e['b']) if e['devor'] == 'v' else (e['a'], e['b'], t1, t2)
        out.append((*rect, ESH_H, h))
    return out

for h, k in ((H, 'toliq'), (KESIM, 'kesim')):
    q = Q()
    for x1, x2, y1, y2, z1, z2 in devor_bolaklar(h):
        q.box(x1, x2, y1, y2, z1, z2, M['devor'], top=M['qopqoq'] if (k == 'kesim' and z2 == h) else None)
    q.obj(f'devorlar_{k}', k)

# ---------------- qoplamalar (kafel, bambuk) ----------------
def esh(kod): return next(e for e in D['eshiklar'] if e['kod'] == kod)

WC = next(x for x in D['xonalar'] if x['kod'] == '2')['bolaklar'][0]
SN = next(x for x in D['xonalar'] if x['kod'] == '5')['bolaklar'][0]
e2, e5 = esh('2'), esh('5')
wc_der = [d for d in DERAZALAR if d['y1'] < WC['y2'] and d['y2'] > WC['y1']]
for h, k in ((H, 'toliq'), (KESIM, 'kesim')):
    q = Q()
    bu.qoplama(q, 'h', WC['y1'], +1, WC['x1'], WC['x2'], 0, h, [], M['kafel_x'], 8)
    bu.qoplama(q, 'h', WC['y2'], -1, WC['x1'], WC['x2'], 0, h, [], M['kafel_x'], 8)
    bu.qoplama(q, 'v', WC['x1'], +1, WC['y1'], WC['y2'], 0, h, [(e2['a'], e2['b'], 0, ESH_H)], M['kafel_y'], 8)
    bu.qoplama(q, 'v', WC['x2'], -1, WC['y1'], WC['y2'], 0, h, [(d['y1'], d['y2'], SILL, HEAD) for d in wc_der], M['kafel_y'], 8)
    q.obj(f'kafel_{k}', k)
q = Q()
bu.qoplama(q, 'h', SN['y1'], +1, SN['x1'], SN['x2'], 0, BAMBUK_H, [], M['bambuk_x'], 12)
bu.qoplama(q, 'h', SN['y2'], -1, SN['x1'], SN['x2'], 0, BAMBUK_H, [], M['bambuk_x'], 12)
bu.qoplama(q, 'v', SN['x1'], +1, SN['y1'], SN['y2'], 0, BAMBUK_H, [(e5['a'], e5['b'], 0, ESH_H)], M['bambuk_y'], 12)
# bambuk panel yuqori qirrasi — alyuminiy profil
for oq, k_, ich, a1, a2 in (('h', SN['y1'], 1, SN['x1'], SN['x2']), ('h', SN['y2'], -1, SN['x1'], SN['x2']), ('v', SN['x1'], 1, SN['y1'], SN['y2'])):
    bu.qoplama(q, oq, k_, ich, a1, a2, BAMBUK_H, BAMBUK_H + 20, [], M['alyuminiy'], 16)
q.obj('bambuk_panel', 'asos')

# ---------------- derazalar ----------------
q = Q()
for d in DERAZALAR:
    bu.deraza(q, {**d, 'ichki': -1}, M['xira'] if d['y1'] < WC['y2'] else M['oyna'])
q.obj('derazalar', 'asos')

# ---------------- eshiklar ----------------
OCHIQ = {'K1': 92, 'K2': 92, 'K3': 40, 'K4': 0}
for e in D['eshiklar']:
    bu.eshik(e, OCHIQ.get(e['kod'], 0))

# ---------------- zinapoya ----------------
q = Q()
n, tq, rz = 11, 3050 / 11, 1750 / 11
for k in range(n):
    top = -(k + 1) * rz
    q.box(1650, 2900, 1400 + k * tq, 1400 + (k + 1) * tq, top - 300, top, M['zina'])
    top2 = -1750 - (k + 1) * rz
    q.box(300, 1550, 4450 - (k + 1) * tq, 4450 - k * tq, top2 - 300, top2, M['zina'])
q.box(300, 2900, 4450, 6050, -1950, -1750, M['zina'])
q.box(300, 2900, 300, 6050, -3700, -3500, M['beton'])
q.obj('zinapoya', 'asos')
q = Q()
bu.perila(q, (330, 1385, 0), (1690, 1385, 0))
bu.perila(q, (1690, 1385, 0), (1690, 4450, -1750))
q.obj('perila', 'asos')

# ---------------- 5-xona: jihozlar ----------------
pm, sm = bu.parta_mesh(), bu.stul_mesh()
markaz = lambda r: ((r['x1'] + r['x2']) / 2, (r['y1'] + r['y2']) / 2)
for i, p in enumerate(D['partalar']): bu.joyla(pm, f'parta_{i + 1}', 'asos', markaz(p))
for i, s in enumerate(D['stullar']): bu.joyla(sm, f'stul_{i + 1}', 'asos', markaz(s))

# interaktiv doska shimoliy devorda (xona janubda)
db = D['doska']
bu.interaktiv_doska((db['x1'] + db['x2']) / 2, SN['y1'] + 12, 0, db['x2'] - db['x1'], "Xadra filiali  ·  3-qavat, 5-xona")

# ustoz stoli va kreslo (ustoz shimolda, o'quvchilarga — janubga qaraydi)
us = D['ustozStoli']
q = Q(); bu.ustoz_stoli(q, us, 'y2'); bu.noutbuk(q, *markaz(us), 0); q.obj('ustoz_stoli', 'asos')
bu.joyla(bu.kreslo_mesh(), 'ustoz_kreslosi', 'asos', markaz(D['ustozStuli']), 0)

# konditsioner (orqa devorda) — umumiy ko'rinishda yashiriladi
q = Q(); bu.konditsioner(q, 0, 0); q.obj('konditsioner', 'tepa', (8825, SN['y2'] - 12), 180)

# ---------------- 2-xona: hojatxona ----------------
KB = D['kabina']
q = Q()
for d in D['kabinaDevor']:
    q.box(d['x1'], d['x2'], d['y1'], d['y2'], 150, 2000, M['hpl'])
    if d['y2'] - d['y1'] > 100:     # yon to'siq: oldingi uchida oyoqcha
        q.cyl(((d['x1'] + d['x2']) / 2, d['y2'] - 60, 0), ((d['x1'] + d['x2']) / 2, d['y2'] - 60, 150), 15, M['xrom'])
q.cyl((KB['x0'], 1380, 2000), (WC['x2'], 1380, 2000), 15, M['xrom'])
q.obj('kabinalar', 'asos')

# rakovinalar, oyna, aralashtirgich
yw = WC['y1'] + 8
for i, (x, y) in enumerate(WC_X['rakovina']):
    q = Q(); q.box(x - 260, x + 260, yw, yw + 440, 700, 850, M['keramika'], bevel=45, seg=5)
    ob = q.obj(f'rakovina_{i + 1}', 'asos')
    bu.ayir(ob, bu.kesuvchi_shar(x, yw + 240, 860, 215, 165, 120))
    q = Q()
    q.cyl((x, yw + 30, 850), (x, yw + 30, 1000), 22, M['xrom'])
    q.cyl((x, yw + 30, 985), (x, yw + 170, 985), 11, M['xrom'])
    q.cyl((x, yw + 170, 985), (x, yw + 170, 960), 11, M['xrom'])
    q.box(x - 8, x + 8, yw + 10, yw + 110, 1000, 1015, M['xrom'])
    q.cyl((x, yw + 220, 730), (x, yw + 220, 520), 18, M['xrom'])
    q.cyl((x, yw + 220, 520), (x, yw, 520), 18, M['xrom'])
    q.cyl((x, yw + 240, 740), (x, yw + 240, 748), 25, M['xrom'])
    q.obj(f'jomrak_{i + 1}', 'asos')
q = Q()
xs = [x for x, _ in WC_X['rakovina']]
q.box(min(xs) - 330, max(xs) + 330, yw, yw + 8, 1100, 1900, M['kozgu'])
q.box(min(xs) - 330, max(xs) + 330, yw + 8, yw + 120, 1080, 1092, M['keramika'])   # tokcha
q.box(WC['x1'] + 8, WC['x1'] + 118, 650, 830, 1050, 1350, M['kond'], bevel=15)   # qo'l quritgich (g'arbiy devorda)
q.obj('kozgu', 'asos')

# unitaz (1-kabina)
for x, y in WC_X['unitaz']:
    q = Q()
    q.box(x - 190, x + 190, yw, yw + 170, 420, 780, M['keramika'], bevel=25, seg=3)
    q.cyl((x, yw + 85, 780), (x, yw + 85, 795), 25, M['xrom'])
    q.cyl((x, yw + 330, 0), (x, yw + 330, 300), 130, M['keramika'], 32)
    q.shar(x, yw + 380, 330, 185, 245, 110, M['keramika'])
    q.shar(x, yw + 390, 425, 180, 235, 22, M['keramika'])
    q.box(x - 150, x + 150, yw + 150, yw + 230, 400, 445, M['keramika'], bevel=10)
    q.obj('unitaz', 'asos')

# chashagenlar (2–4-kabina): polga botirilgan
for i, (x, y) in enumerate(WC_X['chashagen']):
    q = Q(); q.box(x - 225, x + 225, y - 300, y + 300, -200, 15, M['keramika'], bevel=12, seg=3)
    ob = q.obj(f'chashagen_{i + 1}', 'asos')
    bu.ayir(ob, bu.kesuvchi_shar(x, y - 40, 20, 120, 230, 140))
    q = Q()
    q.box(x - 210, x - 128, y - 20, y + 270, 15, 24, M['keramika'], bevel=3)
    q.box(x + 128, x + 210, y - 20, y + 270, 15, 24, M['keramika'], bevel=3)
    q.cyl((x, y - 60, -124), (x, y - 60, -112), 45, M['teshik'])
    q.box(x - 110, x + 110, yw, yw + 10, 1050, 1200, M['keramika'], bevel=3)   # yuvish tugmasi paneli
    q.box(x - 40, x + 40, yw + 10, yw + 14, 1100, 1150, M['xrom'])
    q.obj(f'chashagen_jihoz_{i + 1}', 'asos')

# mustahab (har bir kabinada, sharqiy to'siqda)
for i, (x, y) in enumerate(WC_X['mustahab']):
    xf = KB['x0'] + (i + 1) * KB['en'] - 20 if i < KB['soni'] - 1 else WC['x2'] - 8
    q = Q()
    q.box(xf - 45, xf, y - 40, y + 40, 600, 720, M['xrom'], bevel=5)
    q.cyl((xf - 45, y, 650), (xf - 80, y, 650), 10, M['xrom'])
    q.cyl((xf - 60, y + 80, 520), (xf - 60, y + 80, 700), 15, M['xrom'])
    q.cyl((xf - 60, y + 80, 700), (xf - 110, y + 80, 760), 22, M['xrom'])
    q.cyl((xf - 15, y - 150, 750), (xf - 120, y - 150, 750), 12, M['xrom'])   # qog'oz ushlagich
    q.cyl((xf - 120, y - 210, 750), (xf - 120, y - 90, 750), 55, M['keramika'], 24)
    q.obj(f'mustahab_{i + 1}', 'asos')

# taxorat joyi: kafel qoplangan supa, zanglamas po'lat novi, 3 ta jo'mrak
tx = WC_X['taxorat']
q = Q(); q.box(tx['x1'], tx['x2'], tx['y1'], tx['y2'] - 8, 0, 330, M['kafel_x']); q.obj('taxorat_supa', 'asos')
q = Q(); q.box(tx['x1'] + 30, tx['x2'] - 30, tx['y1'] + 20, tx['y2'] - 30, 330, 430, M['polat'], bevel=10)
ob = q.obj('taxorat_novi', 'asos')
bu.ayir(ob, bu.kesuvchi_quti(tx['x1'] + 70, tx['x2'] - 70, tx['y1'] + 60, tx['y2'] - 70, 360, 500))
q = Q()
for x, y in WC_X['taxoratJomrak']:
    yf = WC['y2'] - 8
    q.cyl((x, yf, 850), (x, yf - 50, 850), 30, M['xrom'])
    q.cyl((x, yf - 40, 850), (x, yf - 180, 830), 13, M['xrom'])
    q.cyl((x, yf - 180, 830), (x, yf - 180, 800), 13, M['xrom'])
    q.cyl((x, yf - 60, 850), (x, yf - 60, 920), 9, M['xrom'])
    q.box(x - 70, x + 70, yf - 130, yf, 1050, 1062, M['keramika'], bevel=3)    # sovun tokchasi
q.cyl((tx['x1'] + 200, WC['y2'] - 160, 358), (tx['x1'] + 200, WC['y2'] - 160, 364), 30, M['teshik'])
tx_, ty_ = WC_X['trap']
q.box(tx_ - 75, tx_ + 75, ty_ - 75, ty_ + 75, 10, 13, M['polat'])
q.obj('taxorat_jomraklar', 'asos')

# ---------------- shift, chiroqlar ----------------
q = Q(); q.box(0, B['L'], 0, B['B'], H, H + 200, M['shift']); q.obj('shift', 'tepa')
LED = [(SN['x1'] + (SN['x2'] - SN['x1']) * i / 4, SN['y1'] + (SN['y2'] - SN['y1']) * j / 6, 600, 600) for i in (1, 3) for j in (1, 3, 5)]
LED += [(x, 2075, 600, 600) for x in (6900, 9300)]
LED += [(4375, 2500, 600, 600), (4375, 5500, 600, 600), (5000, 7600, 600, 600)]
LED += [(KB['x0'] + i * KB['en'] + 500, 800, 180, 180) for i in range(KB['soni'])]
bu.led_panellar(LED, 'led')
q = Q(); q.box(9000, 9250, 1100, 1350, H - 10, H, M['alyuminiy']); q.obj('sorgich', 'tepa')   # hojatxona so'rg'ich panjarasi

# ---------------- tashqi muhit ----------------
q = Q(); q.box(-60000, 70000, -60000, 70000, -9300, -9000, M['yer']); q.obj('yer', 'tashqi')
q = Q(); q.box(-2500, B['L'] + 2500, -2500, B['B'] + 2500, -320, -260, M['taglik']); q.obj('taglik', 'taglik')

# ---------------- kameralar va render ----------------
kam = bu.kamera
KOR = {
    'umumiy': dict(cam=kam('kamera_umumiy', (3200, 22000, 23500), (6250, 6500, -400), 40), res=(2400, 1700), ichki=False, quyosh=(130, 52, 3.2)),
    'sinf': dict(cam=kam('kamera_sinf', (7000, 11650, 1650), (9150, 3400, 1250), 20), res=(1920, 1080), ichki=True, quyosh=(10, 28, 3.5)),
    'wc1': dict(cam=kam('kamera_hojatxona_1', (7680, 2730, 1650), (7150, 650, 1000), 15), res=(1920, 1080), ichki=True, quyosh=(10, 28, 3.5)),
    'wc2': dict(cam=kam('kamera_hojatxona_2', (6250, 2950, 1650), (11300, 1750, 1000), 16), res=(1920, 1080), ichki=True, quyosh=(10, 28, 3.5)),
}
FAYL = {'umumiy': '1-umumiy', 'sinf': '2-sinf-doska', 'wc1': '3-hojatxona-rakovinalar', 'wc2': '4-hojatxona-taxorat'}
bu.render_sozla(A['tez'])
os.makedirs(A['chiq'], exist_ok=True)
# (x, y, z): hojatxona nomi shimoliy devor ortida (kabinalarni yopmasligi uchun)
bu.belgilar(KOR['umumiy']['cam'], KOR['umumiy']['res'],
            {'1': (4375, 3300, 0), '2': (8825, -700, KESIM), '3': (2350, 7700, 0), '4': (3025, 10700, 0), '5': (8825, 4700, 0), 'Z': (1600, 3100, 0)},
            os.path.join(A['chiq'], 'umumiy-belgilar.json'))
bu.renderla(KOR, A['chiq'], 'Xadra_3-qavat_3D', FAYL, A['tez'], A['faqat'])
bu.saqla(A['chiq'], 'Xadra_3-qavat.blend', KOR['sinf']['cam'], tez=A['tez'], blend=A['blend'])
