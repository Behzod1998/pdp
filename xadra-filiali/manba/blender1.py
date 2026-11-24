# 1-qavat (kirish zali) — Blender sahnasi va renderlar (Cycles). Umumiy qismlar: blender_umumiy.py
# Joylashuv — buyurtmachi sxemasi bo'yicha (qavat1.mjs): zina mavjud, turniketlar zal bo'ylab, resepshn o'ng devorda.
# Pol va zina — mavjud holat (oktagon plitka, to'q granit zina). 20.11 (buyurtmachi): devorlar — PRAZA № 677 yog'och panel,
# shift — qora, perila — zanglamas po'lat va shisha (foto); resepshn — PDP Junior filiali namunasi bo'yicha, PDP Academy'ga moslab.
# Ishlatish:
#   node blender1-malumot.mjs > 1qavat.json
#   python blender1.py 1qavat.json ../chizma/3d [--tez] [--blend] [--faqat umumiy,kirish,resepshn]
import json, math, os, random, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import blender_umumiy as bu
from blender_umumiy import Q, P, M, H, KESIM, ESH_H
import bmesh

A = bu.argv()
LOGO_LED = '--led' in sys.argv          # 24.11: logotip orqasidan LED yoritish (alohida renderlar)
D = json.load(open(A['json']))
bu.boshla()
B = D['bino']; I = B['ichki']; T = D['tambur']; Z = D['zina']; R = D['resepshn']; TR = D['turniket']; MH = D['mehmon']
mk = lambda r: ((r['x1'] + r['x2']) / 2, (r['y1'] + r['y2']) / 2)
H1 = B['H']                       # 1-qavat shifti (24.11: 4.0 m, buyurtmachi)
QAVAT2 = H1 + 250                 # 2-qavat poli (shift + plita)
QUDUQ = (1600, I['x2'], I['y1'], 2400)    # zina ustidagi shift teshigi
PZX, PZY = bu.yogoch_panel('praza677_x', 'praza_677.jpg', 'x'), bu.yogoch_panel('praza677_y', 'praza_677.jpg', 'y')     # devor paneli
PZX0, PZY0 = (bu.yogoch_panel(f'praza677_{o}_choksiz', 'praza_677.jpg', o, chok_yoq=True) for o in 'xy')                 # mebel uchun (choksiz)
YONGOQ = bu.mat('yongoq_reyka', '#5b3d29', 0.5)          # to'q yog'och reyka
SHIFT_Q = bu.mat('shift_qora', '#1a1b1d', 0.85)          # qora shift
OQ_STOL = bu.mat('oq_stol', '#f4f4f2', 0.3)

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
for h, k in ((H1, 'toliq'), (KESIM, 'kesim')):
    q = Q()
    cap = M['qopqoq'] if k == 'kesim' else None
    for w in D['devorlar']:
        q.box(w['x1'], w['x2'], w['y1'], w['y2'], 0, h, M['devor_bej'], top=cap)
    for x1, x2, y1, y2 in OCH:
        q.box(x1, x2, y1, y2, ESH_H + 300, h, M['devor_bej'], top=cap)
    for u in D['ustunlar']:
        q.box(u['x1'], u['x2'], u['y1'], u['y2'], 0, h, M['devor_bej'], top=cap)
    q.obj(f'devorlar_{k}', k)
# devor paneli (PRAZA 677) — zal devorlari va ustunlarining ichki yuzlari, eshik teshigi ustida ham
for h, k in ((H1, 'toliq'), (KESIM, 'kesim')):
    q = Q()
    bu.qoplama(q, 'h', I['y1'], +1, 600, 5900, 0, h, [], PZX, 8)                               # shimoliy (zina ortida)
    bu.qoplama(q, 'h', I['y2'], -1, 600, 5900, 0, h, [(3350, 4850, 0, ESH_H + 300)], PZX, 8)     # janubiy (kirish)
    bu.qoplama(q, 'v', I['x1'], +1, 450, 5750, 0, h, [], PZY, 8)                                # g'arbiy
    bu.qoplama(q, 'v', I['x2'], -1, 450, 5750, 0, h, [], PZY, 8)                                # sharqiy (resepshn orqasi)
    bu.qoplama(q, 'h', 450, +1, 250, 600, 0, h, [], PZX, 8); bu.qoplama(q, 'v', 600, +1, 100, 450, 0, h, [], PZY, 8)        # ustunlar
    bu.qoplama(q, 'h', 5750, -1, 250, 600, 0, h, [], PZX, 8); bu.qoplama(q, 'v', 600, +1, 5750, 6100, 0, h, [], PZY, 8)
    bu.qoplama(q, 'v', 5900, -1, 5750, 6100, 0, h, [], PZY, 8)
    q.obj(f'devor_panel_{k}', k)
q = Q()
for x1, x2, y1, y2 in ((I['x1'] + 8, I['x1'] + 20, I['y1'], I['y2']),
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
# perila (foto, 20.11): zanglamas po'lat ustunlar va tutqich, orasida shisha (qisqichlar bilan)
def qiya_quti(q, a, b, z1a, z2a, z1b, z2b, t, m):
    """a, b — (x, y) reja nuqtalari; a da z1a..z2a, b da z1b..z2b balandlikdagi qalinligi t yupqa plastinka (qiya shisha)."""
    dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy); nx, ny = -dy / L * t / 2, dx / L * t / 2
    pts = [(a[0] - nx, a[1] - ny, z1a), (b[0] - nx, b[1] - ny, z1b), (b[0] + nx, b[1] + ny, z1b), (a[0] + nx, a[1] + ny, z1a),
           (a[0] - nx, a[1] - ny, z2a), (b[0] - nx, b[1] - ny, z2b), (b[0] + nx, b[1] + ny, z2b), (a[0] + nx, a[1] + ny, z2a)]
    vs = [q.bm.verts.new(P(*p_)) for p_ in pts]
    for idx in ((0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)):
        f = q.bm.faces.new([vs[i] for i in idx]); f.material_index = q.mi(m)
    bmesh.ops.recalc_face_normals(q.bm, faces=list({f for v in vs for f in v.link_faces}))
def shisha_perila(q, a, b, bal=1000, qadam=1000):
    """a, b — (x, y, z_pol). Ustunlar ~1 m da, orasida shisha, tepada Ø50 tutqich."""
    L = math.dist(a[:2], b[:2]); n = max(1, math.ceil(L / qadam))
    nuq = [tuple(a[j] + (b[j] - a[j]) * i / n for j in range(3)) for i in range(n + 1)]
    for x, y, z in nuq: q.cyl((x, y, z), (x, y, z + bal), 21, M['polat'], 20)
    q.cyl((a[0], a[1], a[2] + bal + 25), (b[0], b[1], b[2] + bal + 25), 25, M['polat'], 20)
    for p1, p2 in zip(nuq, nuq[1:]):
        u = 45 / max(1, math.dist(p1[:2], p2[:2]))
        s1 = tuple(p1[j] + (p2[j] - p1[j]) * u for j in range(3)); s2 = tuple(p2[j] + (p1[j] - p2[j]) * u for j in range(3))
        qiya_quti(q, s1[:2], s2[:2], s1[2] + 120, s1[2] + bal - 80, s2[2] + 120, s2[2] + bal - 80, 10, M['oyna'])
        for pp, sg in ((p1, 1), (p2, -1)):
            for zz in (250, bal - 220):
                c_ = tuple(pp[j] + (p2[j] - p1[j]) * sg * 30 / max(1, math.dist(p1[:2], p2[:2])) for j in range(3))
                q.cyl((c_[0], c_[1], c_[2] + zz - 30), (c_[0], c_[1], c_[2] + zz + 30), 18, M['polat'], 12)
q = Q()
shisha_perila(q, (pk['x1'], pk['y2'] - 40, r1), (pk['x2'], pk['y2'] - 40, md['z']))
shisha_perila(q, (yq['x2'], yq['y2'] - 40, yq['z1']), (yq['x1'], yq['y2'] - 40, yq['z2']))
shisha_perila(q, (md['x1'], md['y2'] - 40, md['z']), (md['x2'] - 20, md['y2'] - 40, md['z']))
q.obj('zina_perila', 'asos')
q = Q(); shisha_perila(q, (yq['x1'], QUDUQ[3] + 40, QAVAT2), (QUDUQ[1] - 20, QUDUQ[3] + 40, QAVAT2)); q.obj('galereya_perila', 'tepa')   # 2-qavat galereyasi

# ---------------- resepshn (20.11 — PDP Junior namunasi bo'yicha) ----------------
st, ps = R['stol'], R['peshtaxta']; x0 = R['chiziq']; O = R['orqa']; XW = I['x2']
rnd = random.Random(20)          # XW — sharqiy devor ichki yuzi
q = Q()
# stoyka: old tomoni (zalga) — 677 panel, qora tik chiziqlar; ikki yoni — to'q yog'och reyka; oq peshtaxta, qora kant
q.box(x0, x0 + 40, st['y1'], st['y2'], 0, 1080, PZY0)
for a_, b_ in D['orqaBolak']['panel']:              # orqa devordagi bo'laklar bilan bir chiziqda qora chiziqlar
    for yy in (a_, b_):
        if st['y1'] + 30 < yy < st['y2'] - 30: q.box(x0 - 3, x0, yy - 6, yy + 6, 0, 1080, M['qora_metall'])
q.box(x0 - 40, st['x2'], st['y1'] - 20, st['y2'] + 20, 1080, 1110, OQ_STOL, bevel=4)              # peshtaxta (oq)
for (a1, a2, b1, b2) in ((x0 - 46, x0 - 40, st['y1'] - 20, st['y2'] + 20), (x0 - 46, st['x2'], st['y1'] - 26, st['y1'] - 20),
                         (x0 - 46, st['x2'], st['y2'] + 20, st['y2'] + 26)):
    q.box(a1, a2, b1, b2, 1076, 1114, M['qora_metall'])                                      # qora kant
for y_, sg in ((st['y1'], -1), (st['y2'], +1)):                                            # yon panellar va reykalar
    q.box(x0, st['x2'], min(y_, y_ - sg * 40), max(y_, y_ - sg * 40), 0, 1080, M['qora_metall'])
    xx = x0 + 15
    while xx + 30 <= st['x2']:
        q.box(xx, xx + 30, min(y_, y_ + sg * 18), max(y_, y_ + sg * 18), 0, 1075, YONGOQ); xx += 48
    q.box(x0 - 6, x0 + 4, min(y_, y_ + sg * 22), max(y_, y_ + sg * 22), 0, 1080, M['qora_metall'])
q.box(x0 + 40, st['x2'], st['y1'] + 40, st['y2'] - 40, 730, 750, OQ_STOL, bevel=3)                # ish yuzasi
q.box(st['x2'] - 450, st['x2'], st['y2'] - 260, st['y2'] - 40, 0, 730, OQ_STOL)                   # tumba (janubiy chetda)
for kk in ('kreslo', 'kreslo2'):                                                              # 2 ish o'rni: admin va sotuvchi
    bu.monitor(q, x0 + 330, mk(R[kk])[1], 90)
for p_ in R['panellar']:                                                                      # past to'siq panellari (677)
    alongY = (p_['y2'] - p_['y1']) > (p_['x2'] - p_['x1'])
    ztop = 1280 if not alongY else 1100                                                       # zina maydonchasi ostidagisi — plitagacha
    q.box(p_['x1'], p_['x2'], p_['y1'], p_['y2'], 0, ztop, PZY0 if alongY else PZX0)
    if alongY: q.box(p_['x1'] - 8, p_['x2'] + 8, p_['y1'], p_['y2'], 1100, 1118, M['qora_metall'])
xe = R['xodimEshik']                                                                          # xodim eshikchasi (yopiq)
q.box(xe['x1'] + 10, xe['x2'] - 10, xe['y1'] + 20, xe['y2'] - 20, 100, 1080, PZY0)
q.cyl((xe['x1'] - 20, xe['y2'] - 120, 900), (xe['x1'] - 20, xe['y2'] - 260, 900), 10, M['qora_metall'])
q.obj('resepshn', 'asos')
bu.joyla(bu.kreslo_mesh(), 'resepshn_kreslo', 'asos', mk(R['kreslo']), 90)
bu.joyla(bu.kreslo_mesh(), 'resepshn_kreslo_2', 'asos', mk(R['kreslo2']), 90)

# orqa devor (24.11, buyurtmachi): simmetrik, o'simliksiz — markazda bitta to'liq 677 panel 1.20 m (logotip), ikki yonida
# 10 sm li 2 tadan bo'lak, ular orasidagi choklar qora; eng chetlarda taroq — qora asos ustida to'q yog'och reyka; shiftgacha.
OB = D['orqaBolak']
q = Q()
xp = XW - 8 - 30
q.box(XW - 26, XW - 8, O['y1'], O['y2'], 0, H1, M['qora_metall'])                          # qora asos (choklar shu rangda)
for a_, b_ in OB['panel']:
    q.box(xp, XW - 26, a_, b_, 0, H1, PZY0)
for a_, b_ in OB['taroq']:
    yy = a_ + 10
    while yy + 30 <= b_ - 5:
        q.box(XW - 50, XW - 26, yy, yy + 30, 0, H1, YONGOQ); yy += 46
q.obj('orqa_devor', 'asos')
# resepshn devorining o'ng chetida — qora oynali tambur yoni (videodan): alyumin rom, tik impostlar, tepada ko'ndalang
tb = R['tamburYon']; RAM = bu.mat('tambur_rom', '#7f857c', 0.4, 0.6); TOQ = bu.mat('oyna_toq', '#1d2227', 0.04, 0.0, coat=0.6)
q = Q(); yc_ = (tb['y1'] + tb['y2']) / 2
q.box(tb['x1'], tb['x2'], yc_ - 6, yc_ + 6, 0, H1, TOQ)
n_ = max(1, round((tb['x2'] - tb['x1']) / 1100))
for i in range(n_ + 1):
    xx = tb['x1'] + (tb['x2'] - tb['x1']) * i / n_
    q.box(xx - 25, xx + 25, tb['y1'], tb['y2'], 0, H1, RAM)
for zz in (0, 2400, H1 - 50):
    q.box(tb['x1'], tb['x2'], tb['y1'], tb['y2'], zz, zz + 50, RAM)
q.obj('tambur_yon', 'asos')
LD = R['logoDevor']; p1, p2 = O['panel']
# logotip (24.11, buyurtmachi namunasi): bir qatorda PDP · belgi · Academy, ikkala so'z bir xil qora; hajmli harflar SVG'dan (tiniq),
# devordan 25 mm tayanchlarda; --led bo'lsa harflar ortidan devorga oq LED nur
bu.logo_3d('pdp-academy-inline-markaz-on-light.svg', xp, (p1 + p2) / 2, 90, 1050, 1900, chuq=18, ofset=25, nom='logo_devor',
           led=3.0 if LOGO_LED else 0.0, halqa_png='pdp-academy-inline-markaz-on-light-halqa-oq.png')
# stoyka ustida osma kvadrat LED chiroq (o'simliksiz)
q = Q(); cx, cy, zr, a_ = 5180, (st['y1'] + st['y2']) / 2, 2950, 450
for (u1, u2, v1, v2) in ((-a_, a_, -a_, -a_ + 45), (-a_, a_, a_ - 45, a_), (-a_, -a_ + 45, -a_, a_), (a_ - 45, a_, -a_, a_)):
    q.box(cx + u1, cx + u2, cy + v1, cy + v2, zr, zr + 50, M['qora_metall'])
    q.box(cx + u1 + 8, cx + u2 - 8, cy + v1 + 8, cy + v2 - 8, zr - 4, zr, M['led_chiziq'])
for u, v in ((-a_, -a_), (a_, -a_), (-a_, a_), (a_, a_)):
    q.cyl((cx + u * .9, cy + v * .9, zr + 50), (cx + u * .9, cy + v * .9, H1), 2, M['qora_metall'], 6)
q.obj('osma_chiroq', 'asos')
L_ = bpy.data.lights.new('osma_chiroq_nur', 'AREA'); L_.shape = 'SQUARE'; L_.size = 0.9; L_.energy = 120; L_.color = (1.0, 0.95, 0.88)
ob_ = bpy.data.objects.new('osma_chiroq_nur', L_); bu.K['chiroq'].objects.link(ob_); ob_.visible_camera = False; ob_.location = P(cx, cy, zr - 10)

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
    q.box(*r, H1, QAVAT2, SHIFT_Q)
q.box(T['x1'], T['x2'], T['y1'], T['y2'], H1, QAVAT2, SHIFT_Q)
# zina qudug'i ustidagi 2-qavat devorlari va shifti (yuqoriga qaraganda bo'shliq ko'rinmasin)
q.box(0, B['L'], -150, 100, QAVAT2, QAVAT2 + 3500, M['devor_bej']); q.box(I['x2'], B['L'], 0, 2600, QAVAT2, QAVAT2 + 3500, M['devor_bej'])
q.box(0, B['L'], -150, 2600, QAVAT2 + 3500, QAVAT2 + 3700, M['shift'])
q.obj('shift', 'tepa')
bu.doira_chiroqlar([(1100, 3200), (2900, 3200), (1100, 5100), (2900, 5100), (4100, 5300), (5560, 3000), (5560, 5650),
                    (1000, 1800), (2600, 2900)], 'downlight', 40, z=H1)
bu.doira_chiroqlar([(3600, 7000)], 'tambur_chiroq', 25, z=H1)
bu.doira_chiroqlar([(3000, 1200), (4600, 1250)], 'quduq_chiroq', 45, z=QAVAT2 + 3500)
bu.spot(5500, (LD['y1'] + LD['y2']) / 2, H1 - 40, 60, (XW, (LD['y1'] + LD['y2']) / 2, 1900), 45, 'logo_spot')
for a_, b_ in OB['taroq']: bu.spot(5650, (a_ + b_) / 2, H1 - 40, 35, (XW, (a_ + b_) / 2, 1200), 55, 'taroq_spot')

# ---------------- tashqi muhit ----------------
q = Q(); q.box(-60000, 70000, -60000, 70000, -260, -250, M['yer']); q.obj('yer', 'tashqi')
q = Q(); q.box(-2500, B['L'] + 2500, -2500, T['y2'] + 2500, -320, -260, M['taglik']); q.obj('taglik', 'taglik')

# ---------------- kameralar va render ----------------
kam = bu.kamera
KOR = {
    'umumiy': dict(cam=kam('kamera_umumiy', (-1800, 12500, 15500), (3300, 3600, -300), 32), res=(2400, 1700), ichki=False, quyosh=(120, 55, 3.2)),
    'kirish': dict(cam=kam('kamera_kirish', (3500, 6250, 1600), (4100, 1200, 1550), 18), res=(1920, 1080), ichki=True, quyosh=(100, 40, 3.0)),
    'resepshn': dict(cam=kam('kamera_resepshn', (3300, 5050, 1600), (6250, 3850, 1500), 18), res=(1920, 1080), ichki=True, quyosh=(100, 40, 3.0)),
    'resepshn2': dict(cam=kam('kamera_resepshn_2', (1900, 4100, 1650), (6250, 4100, 1700), 20), res=(1920, 1080), ichki=True, quyosh=(100, 40, 3.0)),
}
FAYL = {'umumiy': '1-umumiy', 'kirish': '2-kirish', 'resepshn': '3-resepshn', 'resepshn2': '4-resepshn-togridan'}
bu.render_sozla(A['tez'])
os.makedirs(A['chiq'], exist_ok=True)
bu.belgilar(KOR['umumiy']['cam'], KOR['umumiy']['res'],
            {'resepshn': (5560, 4400, 1100), 'turniket': (3450, 4050, 1000), 'zina': (3300, 750, 1500), 'mehmon': (650, 5100, 500),
             'logo': (6250, (LD['y1'] + LD['y2']) / 2, 2700), 'tambur': (3600, 7000, 0)},
            os.path.join(A['chiq'], 'umumiy-belgilar-1.json'))
bu.renderla(KOR, A['chiq'], 'Xadra_1-qavat_3D' + ('_logo-LED' if LOGO_LED else ''), FAYL, A['tez'], A['faqat'], namuna=(64, 40))
if LOGO_LED: sys.exit(0)
bu.saqla(A['chiq'], 'Xadra_1-qavat.blend', KOR['kirish']['cam'], tez=A['tez'], blend=A['blend'])
