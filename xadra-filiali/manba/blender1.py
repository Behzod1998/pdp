# 1-qavat (kirish zali) — Blender sahnasi va renderlar (Cycles). Umumiy qismlar: blender_umumiy.py
# Joylashuv — buyurtmachi sxemasi bo'yicha (qavat1.mjs): zina mavjud, turniketlar zal bo'ylab, resepshn o'ng devorda.
# Pol, devorlar va zina — videodagi mavjud holat (oktagon plitka, bej devorlar, to'q granit zina, krem perila).
# Ishlatish:
#   node blender1-malumot.mjs > 1qavat.json
#   python blender1.py 1qavat.json ../chizma/3d [--tez] [--blend] [--faqat umumiy,kirish,resepshn]
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import blender_umumiy as bu
from blender_umumiy import Q, P, M, H, KESIM, ESH_H

A = bu.argv()
D = json.load(open(A['json']))
bu.boshla()
B = D['bino']; I = B['ichki']; T = D['tambur']; Z = D['zina']; R = D['resepshn']; TR = D['turniket']; MH = D['mehmon']
mk = lambda r: ((r['x1'] + r['x2']) / 2, (r['y1'] + r['y2']) / 2)
QAVAT2 = 3750                     # 2-qavat poli (shift + plita)
QUDUQ = (1600, I['x2'], I['y1'], 2400)    # zina ustidagi shift teshigi

# ---------------- pol va plita ----------------
q = Q()
q.box(0, B['L'], 0, B['B'], -250, 0, M['beton']); q.box(T['x1'], T['x2'], T['y1'], T['y2'], -250, 0, M['beton'])
q.obj('plita', 'asos')
q = Q()
q.box(I['x1'], I['x2'], I['y1'], I['y2'], 0, 8, M['oktagon_pol'])
q.box(3350, 4850, 6100, 6300, 0, 8, M['oktagon_pol'])
q.box(T['x1'] + 120, T['x2'] - 120, T['y1'], T['y2'] - 120, 0, 8, M['tambur_pol'])
q.box(2880, 4290, 7630, 7750, 0, 8, M['tambur_pol'])
q.obj('pol', 'asos')
q = Q(); q.box(2880, 4290, 6900, 7520, 8, 20, M['mato_kul_toq'], bevel=4); q.obj('gilamcha', 'asos')

# ---------------- devorlar, ustunlar, plintus ----------------
OCH = [(3350, 4850, 6100, 6300), (2880, 4290, 7630, 7750)]     # eshik teshiklari (ustida devor)
LD = R['logoDevor']
for h, k in ((H, 'toliq'), (KESIM, 'kesim')):
    q = Q()
    cap = M['qopqoq'] if k == 'kesim' else None
    for w in D['devorlar']:
        q.box(w['x1'], w['x2'], w['y1'], w['y2'], 0, h, M['devor_bej'], top=cap)
    for x1, x2, y1, y2 in OCH:
        q.box(x1, x2, y1, y2, ESH_H + 300, h, M['devor_bej'], top=cap)
    for u in D['ustunlar']:
        q.box(u['x1'], u['x2'], u['y1'], u['y2'], 0, h, M['devor_bej'], top=cap)
    q.box(6235, 6250, LD['y1'], LD['y2'], 0, h, M['grafit'])      # logotip orqasidagi to'q panel (o'ng devor)
    q.obj(f'devorlar_{k}', k)
q = Q()
for x1, x2, y1, y2 in ((I['x1'], I['x1'] + 12, I['y1'], I['y2']), (I['x2'] - 12, I['x2'], 2450, LD['y1']), (I['x2'] - 12, I['x2'], LD['y2'], I['y2']),
                       (I['x1'], 3350, I['y2'] - 12, I['y2']), (4850, I['x2'], I['y2'] - 12, I['y2'])):
    q.box(x1, x2, y1, y2, 0, 110, M['plintus'])
q.obj('plintus', 'asos')

# eshiklar: ikki tavaqali, shisha, alyuminiy rom; teshik ustida shisha
for e in D['eshiklar']:
    bu.eshik({**e, 'qalinlik': None}, 0)
q = Q()
for (x1, x2, y1, y2) in OCH:
    q.box(x1, x1 + 40, y1, y2, 0, ESH_H + 300, M['alyuminiy_och']); q.box(x2 - 40, x2, y1, y2, 0, ESH_H + 300, M['alyuminiy_och'])
    q.box(x1, x2, y1, y2, ESH_H - 40, ESH_H, M['alyuminiy_och']); q.box(x1, x2, y1, y2, ESH_H + 260, ESH_H + 300, M['alyuminiy_och'])
    q.box(x1 + 40, x2 - 40, (y1 + y2) / 2 - 5, (y1 + y2) / 2 + 5, ESH_H, ESH_H + 260, M['oyna'])
q.obj('eshik_romlari', 'asos')

# ---------------- zina (mavjud) ----------------
pk, md, yq = Z['pastki'], Z['maydoncha'], Z['yuqori']
q = Q()
n1 = pk['soni']; t1 = (pk['x2'] - pk['x1']) / n1; r1 = md['z'] / n1
for k in range(n1):          # pastki marsh: shimoliy devor bo'ylab sharqqa
    q.box(pk['x1'] + k * t1, pk['x1'] + (k + 1) * t1, pk['y1'], pk['y2'], 0, (k + 1) * r1, M['granit_toq'])
q.box(md['x1'], md['x2'], md['y1'], md['y2'], md['z'] - 220, md['z'], M['granit_toq'])          # sharqiy maydoncha
q.box(md['x1'], md['x2'], md['y1'], 1400, 0, md['z'] - 220, M['devor_bej'])                      # maydoncha osti (devor)
n2 = yq['soni']; t2 = (yq['x2'] - yq['x1']) / n2; r2 = (yq['z2'] - yq['z1']) / n2
for k in range(n2):          # yuqori marsh: maydonchadan g'arbga, 2-qavatga
    top = yq['z1'] + (k + 1) * r2
    q.box(yq['x2'] - (k + 1) * t2, yq['x2'] - k * t2, yq['y1'], yq['y2'], top - r2 - 40, top, M['granit_toq'])
bu.qiya_plita(q, yq['x1'], yq['x2'], yq['y1'], yq['y2'], yq['z2'] - r2 - 40, yq['z1'] - 40, 180, M['devor_oq'])
q.obj('zina', 'asos')
q = Q()
kr = dict(tutqich=M['eshik_yogoch'], ustun=M['perila_krem'])
bu.perila(q, (pk['x1'], pk['y2'] - 30, r1), (pk['x2'], pk['y2'] - 30, md['z']), **kr)
bu.perila(q, (yq['x2'], yq['y2'] - 30, yq['z1']), (yq['x1'], yq['y2'] - 30, yq['z2']), **kr)
bu.perila(q, (md['x1'], md['y2'] - 30, md['z']), (md['x2'] - 20, md['y2'] - 30, md['z']), **kr)
q.obj('zina_perila', 'asos')
q = Q(); bu.perila(q, (yq['x1'], QUDUQ[3] + 30, QAVAT2), (QUDUQ[1] - 20, QUDUQ[3] + 30, QAVAT2), **kr); q.obj('galereya_perila', 'tepa')   # 2-qavat galereyasi

# ---------------- resepshn ----------------
st, ps = R['stol'], R['peshtaxta']; x0 = R['chiziq']
q = Q()
q.box(x0, x0 + 150, st['y1'], st['y2'], 0, 1080, M['grafit'], bevel=6)                       # zal tomondagi baland qism
for y in (st['y1'], st['y2'] - 40): q.box(x0, st['x2'], y, y + 40, 0, 1080, M['grafit'])      # yon panellar
q.box(ps['x1'], ps['x2'], ps['y1'] - 20, ps['y2'] + 20, 1080, 1115, M['devor_oq'], bevel=8)   # peshtaxta
q.box(x0 + 150, st['x2'], st['y1'] + 40, st['y2'] - 40, 720, 750, M['parta'], bevel=3)       # ish yuzasi
q.box(st['x2'] - 520, st['x2'], st['y2'] - 560, st['y2'] - 40, 0, 720, M['parta'])           # tumba
q.box(ps['x1'] - 6, ps['x1'], ps['y1'], ps['y2'], 1060, 1076, M['led_chiziq'])                # peshtaxta ostida LED
bu.monitor(q, x0 + 420, (st['y1'] + st['y2']) / 2, 90)
for p in R['panellar']:                                                                      # past to'siq panellari
    q.box(p['x1'], p['x2'], p['y1'], p['y2'], 0, 1100, M['grafit'])
    q.box(p['x1'] - 10, p['x2'] + 10, p['y1'], p['y2'], 1100, 1120, M['devor_oq'])
xe = R['xodimEshik']                                                                         # xodim eshikchasi (yopiq)
q.box(xe['x1'] + 10, xe['x2'] - 10, xe['y1'] + 20, xe['y2'] - 20, 100, 1080, M['grafit'])
q.cyl((xe['x1'] - 20, xe['y2'] - 120, 900), (xe['x1'] - 20, xe['y2'] - 260, 900), 10, M['xrom'])
q.obj('resepshn', 'asos')
LS = R['logoStol']
bu.logo_panel(x0, (LS['y1'] + LS['y2']) / 2, 90, LS['en'], 600, 'inline-on-dark', kuch=2.0, halqa=0.3, nom='logo_stoyka', ofset=22)
bu.joyla(bu.kreslo_mesh(), 'resepshn_kreslo', 'asos', mk(R['kreslo']), 90)
bu.logo_panel(6235, (LD['y1'] + LD['y2']) / 2, 90, LD['en'], 1900, 'primary-on-dark', kuch=2.2, halqa=0.5, nom='logo_devor')

# ---------------- turniketlar, to'siq, evakuatsiya darvozasi ----------------
q = Q()
yc = TR['chiziq']
for t in TR['turniketlar']:
    kp = t['korpus']
    q.box(kp['x1'], kp['x2'], kp['y1'], kp['y2'], 0, 980, M['polat'], bevel=20, seg=3)
    q.box(kp['x1'] + 20, kp['x2'] - 20, kp['y1'] + 60, kp['y1'] + 240, 980, 990, M['ekran_qora'])   # kartochka o'quvchi
    q.box(kp['x1'] + 40, kp['x2'] - 40, kp['y1'] + 260, kp['y1'] + 300, 990, 994, M['brend_yashil_nur'] if t['yonalish'] == 'kirish' else M['ekran_aksent'])
    q.cyl((kp['x1'] + 10, yc, 900), (kp['x1'] - 60, yc, 900), 60, M['polat'], 24)
    for a in (0, 120, 240):     # tripod: biri gorizontal — o'tish yo'lagini yopadi
        r_ = math.radians(a)
        end = (kp['x1'] - 580, yc, 900) if a == 0 else (kp['x1'] - 440, yc + 380 * math.sin(r_), 900 + 380 * math.cos(r_) - 120)
        q.cyl((kp['x1'] - 60, yc, 900), end, 16, M['xrom'], 12)
def tosiq(x1, x2):       # to'siq: zanglamas ustunlar, shisha panel, tutqich
    for x in (x1 + 30, x2 - 30): q.cyl((x, yc, 0), (x, yc, 1000), 25, M['polat'], 16)
    if x2 - x1 > 200: q.box(x1 + 60, x2 - 60, yc - 6, yc + 6, 120, 950, M['oyna'])
    q.cyl((x1 + 30, yc, 1000), (x2 - 30, yc, 1000), 22, M['polat'], 16)
for t in TR['tosiq']: tosiq(t['x1'], t['x2'])
dv = TR['darvoza']           # evakuatsiya darvozasi: yopiq holda chiziqda
q.cyl((dv['x1'] + 30, yc, 0), (dv['x1'] + 30, yc, 1000), 28, M['polat'], 16)
q.box(dv['x1'] + 60, dv['x2'] - 40, yc - 15, yc + 15, 150, 180, M['polat']); q.box(dv['x1'] + 60, dv['x2'] - 40, yc - 15, yc + 15, 950, 980, M['polat'])
q.box(dv['x2'] - 70, dv['x2'] - 40, yc - 15, yc + 15, 150, 980, M['polat'])
q.box(dv['x1'] + 70, dv['x2'] - 80, yc - 6, yc + 6, 180, 950, M['oyna'])
q.box(dv['x1'] + 250, dv['x1'] + 650, yc + 6, yc + 9, 560, 640, M['brend_yashil'])
q.obj('turniketlar', 'asos')

# ---------------- mehmonlar joyi ----------------
q = Q()
bu.divan(q, MH['divan'], 'x1')
s_ = MH['stolcha']; q.box(s_['x1'], s_['x2'], s_['y1'], s_['y2'], 380, 420, M['parta'], bevel=8); q.box(s_['x1'] + 40, s_['x2'] - 40, s_['y1'] + 40, s_['y2'] - 40, 0, 380, M['qora_metall'])
for x, y in MH['osimlik']: bu.osimlik(q, x, y)
q.obj('mehmon_joyi', 'asos')

# ---------------- shift, zina qudug'i, chiroqlar ----------------
q = Q()
for r in bu.tesik((0, B['L'], 0, B['B']), [QUDUQ]):
    q.box(*r, H, QAVAT2, M['shift'])
q.box(T['x1'], T['x2'], T['y1'], T['y2'], H, QAVAT2, M['shift'])
# zina qudug'i ustidagi 2-qavat devorlari va shifti (yuqoriga qaraganda bo'shliq ko'rinmasin)
q.box(0, B['L'], -150, 100, QAVAT2, QAVAT2 + 3500, M['devor_bej']); q.box(I['x2'], B['L'], 0, 2600, QAVAT2, QAVAT2 + 3500, M['devor_bej'])
q.box(0, B['L'], -150, 2600, QAVAT2 + 3500, QAVAT2 + 3700, M['shift'])
q.obj('shift', 'tepa')
bu.doira_chiroqlar([(1100, 3200), (2900, 3200), (1100, 5100), (2900, 5100), (4100, 5300), (5560, 3000), (5560, 4400), (5560, 5650),
                    (1000, 1800), (2600, 2900)], 'downlight', 28)
bu.doira_chiroqlar([(3600, 7000)], 'tambur_chiroq', 25)
bu.doira_chiroqlar([(3000, 1200), (4600, 1250)], 'quduq_chiroq', 45, z=QAVAT2 + 3500)
bu.spot(5600, (LD['y1'] + LD['y2']) / 2, H - 40, 70, (6235, (LD['y1'] + LD['y2']) / 2, 1700), 70, 'logo_spot')

# ---------------- tashqi muhit ----------------
q = Q(); q.box(-60000, 70000, -60000, 70000, -260, -250, M['yer']); q.obj('yer', 'tashqi')
q = Q(); q.box(-2500, B['L'] + 2500, -2500, T['y2'] + 2500, -320, -260, M['taglik']); q.obj('taglik', 'taglik')

# ---------------- kameralar va render ----------------
kam = bu.kamera
KOR = {
    'umumiy': dict(cam=kam('kamera_umumiy', (-1800, 12500, 15500), (3300, 3600, -300), 32), res=(2400, 1700), ichki=False, quyosh=(120, 55, 3.2)),
    'kirish': dict(cam=kam('kamera_kirish', (3500, 6250, 1600), (4100, 1200, 1550), 18), res=(1920, 1080), ichki=True, quyosh=(100, 40, 3.0)),
    'resepshn': dict(cam=kam('kamera_resepshn', (2600, 5650, 1650), (5600, 3900, 1150), 20), res=(1920, 1080), ichki=True, quyosh=(100, 40, 3.0)),
}
FAYL = {'umumiy': '1-umumiy', 'kirish': '2-kirish', 'resepshn': '3-resepshn'}
bu.render_sozla(A['tez'])
os.makedirs(A['chiq'], exist_ok=True)
bu.belgilar(KOR['umumiy']['cam'], KOR['umumiy']['res'],
            {'resepshn': (5560, 4400, 1100), 'turniket': (3450, 4050, 1000), 'zina': (3300, 750, 1500), 'mehmon': (650, 5100, 500),
             'logo': (6250, (LD['y1'] + LD['y2']) / 2, 2700), 'tambur': (3600, 7000, 0)},
            os.path.join(A['chiq'], 'umumiy-belgilar-1.json'))
bu.renderla(KOR, A['chiq'], 'Xadra_1-qavat_3D', FAYL, A['tez'], A['faqat'], namuna=(64, 40))
bu.saqla(A['chiq'], 'Xadra_1-qavat.blend', KOR['kirish']['cam'], tez=A['tez'], blend=A['blend'])
