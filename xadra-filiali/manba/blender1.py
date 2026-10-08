# 1-qavat (kirish zali) — Blender sahnasi va renderlar (Cycles). Umumiy qismlar: blender_umumiy.py
# Ishlatish:
#   node blender1-malumot.mjs > 1qavat.json
#   python blender1.py 1qavat.json ../chizma/3d [--tez] [--blend] [--faqat umumiy,resepshn]
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import blender_umumiy as bu
from blender_umumiy import Q, P, M, H, KESIM, ESH_H

A = bu.argv()
D = json.load(open(A['json']))
bu.boshla()
B = D['bino']; I = B['ichki']; T = D['tambur']; Z = D['zina']; R = D['resepshn']; TR = D['turniket']; MH = D['mehmon']
mk = lambda r: ((r['x1'] + r['x2']) / 2, (r['y1'] + r['y2']) / 2)
ZONA = Z['zona']

# ---------------- pol va plita ----------------
q = Q()
q.box(0, B['L'], 0, B['B'], -250, 0, M['beton']); q.box(T['x1'], T['x2'], T['y1'], T['y2'], -250, 0, M['beton'])
q.obj('plita', 'asos')
q = Q()
q.box(I['x1'], I['x2'], I['y1'], I['y2'], 0, 8, M['pol_keramogranit'])
q.box(3350, 4850, 6100, 6300, 0, 8, M['pol_keramogranit'])
q.box(T['x1'] + 120, T['x2'] - 120, T['y1'], T['y2'] - 120, 0, 8, M['wc_pol'])
q.box(2880, 4290, 7630, 7750, 0, 8, M['wc_pol'])
q.obj('pol', 'asos')
q = Q(); q.box(2880, 4290, 6900, 7520, 8, 20, M['mato_kul_toq'], bevel=4); q.obj('gilamcha', 'asos')

# ---------------- devorlar va ustunlar ----------------
ESH = D['eshiklar']
OCH = [(3350, 4850, 6100, 6300), (2880, 4290, 7630, 7750)]     # eshik teshiklari (ustida devor)
for h, k in ((H, 'toliq'), (KESIM, 'kesim')):
    q = Q()
    for w in D['devorlar']:
        q.box(w['x1'], w['x2'], w['y1'], w['y2'], 0, h, M['devor'], top=M['qopqoq'] if k == 'kesim' else None)
    for x1, x2, y1, y2 in OCH:
        q.box(x1, x2, y1, y2, ESH_H + 300, h, M['devor'], top=M['qopqoq'] if k == 'kesim' else None)
    for u in D['ustunlar']:
        q.box(u['x1'], u['x2'], u['y1'], u['y2'], 0, h, M['ustun'], top=M['qopqoq'] if k == 'kesim' else None)
    # resepshn orqasidagi devor — to'q grafit panel (logotip foni)
    ld = R['logoDevor']
    q.box(ld['x1'], ld['x2'], 100, 115, 0, h, M['grafit'])
    q.obj(f'devorlar_{k}', k)

# eshiklar: ikki tavaqali, shisha, alyuminiy rom; teshik ustida shisha (2.4 m gacha)
for e in ESH:
    bu.eshik({**e, 'qalinlik': None}, 0)
q = Q()
for (x1, x2, y1, y2) in OCH:
    q.box(x1, x1 + 40, y1, y2, 0, ESH_H + 300, M['alyuminiy']); q.box(x2 - 40, x2, y1, y2, 0, ESH_H + 300, M['alyuminiy'])
    q.box(x1, x2, y1, y2, ESH_H - 40, ESH_H, M['alyuminiy']); q.box(x1, x2, y1, y2, ESH_H + 260, ESH_H + 300, M['alyuminiy'])
    q.box(x1 + 40, x2 - 40, (y1 + y2) / 2 - 5, (y1 + y2) / 2 + 5, ESH_H, ESH_H + 260, M['oyna'])
q.obj('eshik_romlari', 'asos')

# ---------------- zina (2-qavatga) ----------------
rz = 175
q = Q()
m1, m2 = Z['marshlar']
n1 = 3; t1 = (m1['y2'] - m1['y1']) / n1
for k in range(n1):     # pastki marsh: shimolga ko'tariladi
    q.box(m1['x1'], m1['x2'], m1['y2'] - (k + 1) * t1, m1['y2'] - k * t1, 0, (k + 1) * rz, M['zina'])
md = Z['maydoncha']; zm = (n1 + 1) * rz
q.box(md['x1'], md['x2'], md['y1'], md['y2'], 0, zm, M['zina'])
n2 = 8; t2 = (m2['x2'] - m2['x1']) / n2
for k in range(n2):     # yuqori marsh: sharqqa ko'tariladi (chizmadagi kesimgacha)
    q.box(m2['x1'] + k * t2, m2['x1'] + (k + 1) * t2, m2['y1'], m2['y2'], 0, zm + (k + 1) * rz, M['zina'])
q.obj('zina', 'asos')
q = Q()
bu.perila(q, (m1['x2'] - 30, m1['y2'], rz), (m1['x2'] - 30, m2['y2'] - 30, zm))
bu.perila(q, (m2['x1'], m2['y2'] - 30, zm), (m2['x2'], m2['y2'] - 30, zm + n2 * rz))
q.obj('zina_perila', 'asos')

# ---------------- resepshn ----------------
st, ps = R['stol'], R['peshtaxta']
q = Q()
q.box(st['x1'], st['x2'], 2550, 2700, 0, 1080, M['grafit'], bevel=6)                          # old baland qism
q.box(st['x1'], st['x1'] + 40, st['y1'], 2700, 0, 1080, M['grafit'])                             # turniket tomondagi yon panel
q.box(ps['x1'] - 20, ps['x2'], 2500, 2770, 1080, 1115, M['devor_oq'], bevel=8)                   # peshtaxta
q.box(st['x1'] + 40, st['x2'], st['y1'], 2550, 720, 750, M['parta'], bevel=3)                    # ish yuzasi
q.box(st['x1'] + 40, st['x2'], st['y1'] + 20, st['y1'] + 40, 0, 720, M['parta'])                 # orqa (xodim tomoni emas) — tumba
q.box(st['x2'] - 500, st['x2'], st['y1'] + 40, 2540, 0, 720, M['parta'])                        # tumba
q.box(ps['x1'], ps['x2'], 2768, 2774, 1060, 1076, M['led_chiziq'])                               # peshtaxta ostida LED chiziq
bu.monitor(q, 5150, 2300, 0)
q.obj('resepshn_stoyka', 'asos')
LS = R['logoStol']
bu.logo_panel((LS['x1'] + LS['x2']) / 2, 2700, 0, LS['en'], 560, 'inline-on-dark', kuch=3.5, halqa=0.8, nom='logo_stoyka', ofset=20)
bu.joyla(bu.kreslo_mesh(), 'resepshn_kreslo', 'asos', mk(R['kreslo']), 0)
LD = R['logoDevor']
bu.logo_panel((LD['x1'] + LD['x2']) / 2, 115, 0, LD['en'], (LD['z1'] + LD['z2']) / 2 + 150, 'primary-on-dark', kuch=4.0, halqa=1.6, nom='logo_devor')

# ---------------- turniket, to'siq, evakuatsiya darvozasi ----------------
q = Q()
kp = TR['korpus']; yc = TR['chiziq']
q.box(kp['x1'], kp['x2'], kp['y1'], kp['y2'], 0, 980, M['polat'], bevel=20, seg=3)
q.box(kp['x1'] + 20, kp['x2'] - 20, kp['y1'] + 80, kp['y1'] + 260, 980, 990, M['ekran_qora'])        # kartochka o'quvchi
q.cyl((kp['x1'] + 10, yc, 900), (kp['x1'] - 60, yc, 900), 60, M['polat'], 24)
for a in (0, 120, 240):     # tripod: biri gorizontal — o'tish yo'lagini yopadi, qolgan ikkitasi pastga
    r_ = math.radians(a)
    end = (kp['x1'] - 580, yc, 900) if a == 0 else (kp['x1'] - 440, yc + 380 * math.sin(r_), 900 + 380 * math.cos(r_) - 120)
    q.cyl((kp['x1'] - 60, yc, 900), end, 16, M['xrom'], 12)
def tosiq(x1, x2):       # to'siq: zanglamas ustunlar, shisha panel, tutqich
    for x in (x1 + 30, x2 - 30): q.cyl((x, yc, 0), (x, yc, 1000), 25, M['polat'], 16)
    q.box(x1 + 60, x2 - 60, yc - 6, yc + 6, 120, 950, M['oyna'])
    q.cyl((x1 + 30, yc, 1000), (x2 - 30, yc, 1000), 22, M['polat'], 16)
for t in TR['tosiq']: tosiq(t['x1'], t['x2'])
dv = TR['darvoza']           # evakuatsiya darvozasi: yopiq holda chiziqda
q.cyl((dv['x1'] + 30, yc, 0), (dv['x1'] + 30, yc, 1000), 28, M['polat'], 16)
q.box(dv['x1'] + 60, dv['x2'] - 40, yc - 15, yc + 15, 150, 180, M['polat']); q.box(dv['x1'] + 60, dv['x2'] - 40, yc - 15, yc + 15, 950, 980, M['polat'])
q.box(dv['x2'] - 70, dv['x2'] - 40, yc - 15, yc + 15, 150, 980, M['polat'])
q.box(dv['x1'] + 70, dv['x2'] - 80, yc - 6, yc + 6, 180, 950, M['oyna'])
q.box(dv['x1'] + 300, dv['x1'] + 700, yc - 8, yc + 8, 560, 640, M['brend_yashil'])        # yashil belgi (chiqish)
q.obj('turniket', 'asos')

# ---------------- mehmonlar joyi ----------------
q = Q()
bu.divan(q, MH['divan'], 'x1')
s_ = MH['stolcha']; q.box(s_['x1'], s_['x2'], s_['y1'], s_['y2'], 380, 420, M['parta'], bevel=8); q.box(s_['x1'] + 40, s_['x2'] - 40, s_['y1'] + 40, s_['y2'] - 40, 0, 380, M['qora_metall'])
for x, y in MH['osimlik']: bu.osimlik(q, x, y)
q.obj('mehmon_joyi', 'asos')

# ---------------- shift va chiroqlar ----------------
q = Q()
for r in bu.tesik((0, B['L'], 0, B['B']), [(md['x1'], m2['x2'], md['y1'], m2['y2'])]):
    q.box(*r, H, H + 250, M['shift'])
q.box(T['x1'], T['x2'], T['y1'], T['y2'], H, H + 250, M['shift'])
q.obj('shift', 'tepa')
LED = [(1700, 3700, 600, 600), (4700, 3700, 600, 600), (1700, 5300, 600, 600), (4700, 5300, 600, 600), (3600, 7000, 400, 400)]
LED += [(x + 300, 1900, 600, 50) for x in (4100, 4750, 5400)]
bu.led_panellar(LED, 'led')
bu.spot((LD['x1'] + LD['x2']) / 2, 900, H - 40, 70, ((LD['x1'] + LD['x2']) / 2, 115, 1600), 70, 'logo_spot')

# ---------------- tashqi muhit ----------------
q = Q(); q.box(-60000, 70000, -60000, 70000, -260, -250, M['yer']); q.obj('yer', 'tashqi')
q = Q(); q.box(-2500, B['L'] + 2500, -2500, T['y2'] + 2500, -320, -260, M['taglik']); q.obj('taglik', 'taglik')

# ---------------- kameralar va render ----------------
kam = bu.kamera
KOR = {
    'umumiy': dict(cam=kam('kamera_umumiy', (-1800, 12500, 15500), (3300, 3600, -300), 32), res=(2400, 1700), ichki=False, quyosh=(120, 55, 3.2)),
    'resepshn': dict(cam=kam('kamera_resepshn', (3900, 5950, 1650), (4500, 1200, 1350), 19), res=(1920, 1080), ichki=True, quyosh=(100, 40, 3.0)),
}
FAYL = {'umumiy': '1-umumiy', 'resepshn': '2-resepshn'}
bu.render_sozla(A['tez'])
os.makedirs(A['chiq'], exist_ok=True)
bu.belgilar(KOR['umumiy']['cam'], KOR['umumiy']['res'],
            {'resepshn': (5150, 2350, 1100), 'turniket': (2600, 2700, 1000), 'zina': (1100, 800, 600), 'mehmon': (650, 4550, 500),
             'logo': ((LD['x1'] + LD['x2']) / 2, 100, 2700), 'tambur': (3600, 7000, 0)},
            os.path.join(A['chiq'], 'umumiy-belgilar-1.json'))
bu.renderla(KOR, A['chiq'], 'Xadra_1-qavat_3D', FAYL, A['tez'], A['faqat'])
bu.saqla(A['chiq'], 'Xadra_1-qavat.blend', KOR['resepshn']['cam'], tez=A['tez'], blend=A['blend'])
