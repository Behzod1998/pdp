# 2-qavat — Blender sahnasi va renderlar (Cycles). Umumiy qismlar: blender_umumiy.py
# Ishlatish:
#   node blender2-malumot.mjs > 2qavat.json
#   python blender2.py 2qavat.json ../chizma/3d [--tez] [--blend] [--faqat umumiy,k1,k2,logo,sotuv,admin,sinf,kw]
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import blender_umumiy as bu
from blender_umumiy import Q, P, M, H, KESIM, ESH_H, SHISHA_H

A = bu.argv()
D = json.load(open(A['json']))
bu.boshla()
I = D['ichki']; DV = D['devor']
X = {x['kod']: x for x in D['xonalar']}
mk = lambda r: ((r['x1'] + r['x2']) / 2, (r['y1'] + r['y2']) / 2)

# ---------------- pol va plita ----------------
ZN1 = next(z for z in D['zinalar'] if z['kod'] == 'ZN1'); ZN2 = next(z for z in D['zinalar'] if z['kod'] == 'ZN2')
QUDUQ1 = (150, 2850, 1300, 6300)
QUDUQ2 = (150, 3650, 18550, 19950)          # ZN2: marsh (x bo'ylab) va burchakdagi maydoncha
QUDUQ3 = (150, 1400, 19950, 21150)          # ZN2: pastga marsh (y bo'ylab)
q = Q()
for r in bu.tesik((-DV['chap'], I['x'] + DV['ong'], -DV['yuqori'], I['y'] + DV['past']), [QUDUQ1, QUDUQ2, QUDUQ3]):
    q.box(*r, -250, 0, M['beton'])
q.obj('plita', 'asos')
q = Q()
for r in bu.tesik((0, I['x'], 0, I['y']), [QUDUQ1, QUDUQ2, QUDUQ3, *[(x['x1'], x['x2'], x['y1'], x['y2']) for x in D['xonalar'] if x['tur'] == 'sanuzel']]):
    q.box(*r, 0, 8, M['pol_keramogranit'])
q.obj('pol', 'asos')
q = Q()
for x in D['xonalar']:
    if x['tur'] == 'sanuzel': q.box(x['x1'], x['x2'], x['y1'], x['y2'], 0, 8, M['wc_pol'])
q.obj('pol_sanuzel', 'asos')

# ---------------- devorlar ----------------
DER = D['derazalar']
ESH = D['eshiklar']
def devor_bolaklar(h):
    out, shisha = [], []
    for w in D['devorlar']:
        if w.get('shisha'):
            shisha.append(w)
            out.append((w['x1'], w['x2'], w['y1'], w['y2'], SHISHA_H, h))     # shisha ustida GKL
            continue
        out += bu.devor_kesimlari(w, DER, h)
    for e in ESH:     # eshik ustidagi devor (yangi eshik ustida 2.5 m gacha shisha)
        t1, t2 = e['qalinlik']
        rect = (t1, t2, e['a'], e['b']) if e['devor'] == 'v' else (e['a'], e['b'], t1, t2)
        out.append((*rect, SHISHA_H if e['holat'] == 'yangi' else ESH_H, h))
    return out, shisha

for h, k in ((H, 'toliq'), (KESIM, 'kesim')):
    q = Q()
    bol, _ = devor_bolaklar(h)
    for x1, x2, y1, y2, z1, z2 in bol:
        q.box(x1, x2, y1, y2, z1, z2, M['devor'], top=M['qopqoq'] if (k == 'kesim' and z2 == h) else None)
    for u in D['ustunlar']:
        if u['ichki']: q.box(u['x1'], u['x2'], u['y1'], u['y2'], 0, h, M['ustun'], top=M['qopqoq'] if k == 'kesim' else None)
    q.obj(f'devorlar_{k}', k)

# shisha devorlar: 2.5 m gacha laminatlangan shisha, 1.0–1.6 m da matli polosa, alyuminiy profillar
q = Q()
_, SHISHA = devor_bolaklar(H)
for w in SHISHA:
    gor = (w['x2'] - w['x1']) > (w['y2'] - w['y1'])
    a1, a2 = (w['x1'], w['x2']) if gor else (w['y1'], w['y2'])
    c = ((w['y1'] + w['y2']) / 2) if gor else ((w['x1'] + w['x2']) / 2)
    def B(a, b, z1, z2, m, t):
        if gor: q.box(a, b, c - t, c + t, z1, z2, m)
        else: q.box(c - t, c + t, a, b, z1, z2, m)
    B(a1, a2, 0, 50, M['alyuminiy'], 30); B(a1, a2, SHISHA_H - 50, SHISHA_H, M['alyuminiy'], 30)
    n = max(1, round((a2 - a1) / 1500))
    for i in range(n + 1):
        t = a1 + (a2 - a1) * i / n
        B(max(a1, t - 25), min(a2, t + 25), 0, SHISHA_H, M['alyuminiy'], 30)
    for za, zb, gm in ((50, 1000, M['oyna']), (1000, 1600, M['xira']), (1600, SHISHA_H - 50, M['oyna'])):
        B(a1, a2, za, zb, gm, 5)
q.obj('shisha_devorlar', 'asos')

# derazalar
ICH = {'yuqori': +1, 'past': -1, 'chap': +1}
q = Q()
for d in DER: bu.deraza(q, {**d, 'ichki': ICH[d['devor']]})
q.obj('derazalar', 'asos')

# eshiklar (yangilari shisha, ustida 2.5 m gacha shisha)
for e in ESH:
    bu.eshik(e, 0, ustki_shisha=e['holat'] == 'yangi')

# ---------------- bambuk panel (poldan shiftgacha) ----------------
def qoplama_xona(q, x, tomon, m_x, m_y, h, teshik=()):
    """Xonaning bir devoriga qoplama: tomon — 'x1'|'x2'|'y1'|'y2' (xona to'rtburchagi bo'yicha)."""
    if tomon in ('x1', 'x2'):
        bu.qoplama(q, 'v', x[tomon], +1 if tomon == 'x1' else -1, x['y1'], x['y2'], 0, h, list(teshik), m_y, 12)
    else:
        bu.qoplama(q, 'h', x[tomon], +1 if tomon == 'y1' else -1, x['x1'], x['x2'], 0, h, list(teshik), m_x, 12)

QARSHI = {'x1': 'x2', 'x2': 'x1', 'y1': 'y2', 'y2': 'y1'}
DOSKA_TOMON = {'ong': 'x2', 'chap': 'x1', 'yuqori': 'y1', 'past': 'y2'}
for h, k in ((H, 'toliq'), (KESIM, 'kesim')):
    q = Q()
    for s in D['sinflar']:
        t = DOSKA_TOMON[s['doska']]
        if s['kod'] == 'SR4':     # L shakli: doska — o'ng tashqi devor, orqa — keng qismning chap devori
            qoplama_xona(q, {'x1': 18150, 'x2': I['x'], 'y1': 7800, 'y2': 16600}, 'x2', M['bambuk_x'], M['bambuk_y'], h)
            qoplama_xona(q, {'x1': 18150, 'x2': I['x'], 'y1': 9400, 'y2': 15000}, 'x1', M['bambuk_x'], M['bambuk_y'], h)
            continue
        qoplama_xona(q, s, t, M['bambuk_x'], M['bambuk_y'], h)
        qoplama_xona(q, s, QARSHI[t], M['bambuk_x'], M['bambuk_y'], h)
    for kod in ('XZ1', 'XZ2', 'XZ3', 'XZ4'):
        for t in ('x1', 'x2'): qoplama_xona(q, X[kod], t, M['bambuk_x'], M['bambuk_y'], h)
    x12 = X['X12']
    e12 = next(e for e in ESH if e['kod'] == 'X12')
    qoplama_xona(q, x12, 'y1', M['bambuk_x'], M['bambuk_y'], h, [(e12['a'], e12['b'], 0, ESH_H)])
    qoplama_xona(q, x12, 'x2', M['bambuk_x'], M['bambuk_y'], h)
    # koridor oxiridagi logotip devori — to'q grafit panel
    for l in D['logo']:
        bu.qoplama(q, 'v', l['x'], -1, l['y1'], l['y2'], 0, h, [], M['grafit'], 15)
    q.obj(f'qoplama_{k}', k)

# ---------------- koridor: logotip, doskalar ----------------
for i, l in enumerate(D['logo']):
    ym = (l['y1'] + l['y2']) / 2
    bu.logo_panel(l['x'] - 15, ym, 90, l['en'], l['z'], 'primary-on-dark', kuch=4.0, halqa=1.5, nom=f"logo_{l['koridor']}")
    bu.spot(l['x'] - 700, ym, H - 40, 60, (l['x'] - 15, ym, 1300), 70, f"logo_spot_{l['koridor']}")
for b in D['doskalar']:
    rot = 180 if b['yon'] < 0 else 0
    xc = (b['x1'] + b['x2']) / 2
    (bu.elon_doskasi if b['tur'] == 'elon' else bu.etirof_doskasi)(xc, b['y'], rot, b['x2'] - b['x1'], b['z1'], b['z2'], nom=f"doska_{b['kod']}")
    bu.spot(xc, b['y'] + b['yon'] * 700, H - 40, 70, (xc, b['y'], 1450), 75, f"doska_spot_{b['kod']}")

# ---------------- sinflar ----------------
pm, sm, km = bu.parta_mesh(), bu.stul_mesh(), bu.kreslo_mesh()
BURISH = {'yuqori': 0, 'past': 180, 'ong': 90, 'chap': -90}           # o'quvchi doskaga qaraydi
YUZ = {'ong': (-1, 0), 'chap': (1, 0), 'yuqori': (0, 1), 'past': (0, -1)}   # doska devoridan xona tomonga
OLDI = {'ong': 'x1', 'chap': 'x2', 'yuqori': 'y2', 'past': 'y1'}       # ustoz stolining old paneli
for s in D['sinflar']:
    rot = BURISH[s['doska']]
    for i, p in enumerate(s['partalar']): bu.joyla(pm, f"{s['kod']}_parta_{i + 1}", 'asos', mk(p), rot)
    for i, c in enumerate(s['stullar']): bu.joyla(sm, f"{s['kod']}_stul_{i + 1}", 'asos', mk(c), rot)
    t = YUZ[s['doska']]
    trot = bu.burchak_xona(*t)
    q = Q(); bu.ustoz_stoli(q, s['ustozStoli'], OLDI[s['doska']]); bu.noutbuk(q, *mk(s['ustozStoli']), trot); q.obj(f"{s['kod']}_ustoz_stoli", 'asos')
    bu.joyla(km, f"{s['kod']}_kreslo", 'asos', mk(s['ustozStuli']), trot)
    d = s['doskaR']; cx, cy = mk(d)
    yuz = {'ong': (d['x2'] - 12, cy), 'chap': (d['x1'] + 12, cy), 'yuqori': (cx, d['y1'] + 12), 'past': (cx, d['y2'] - 12)}[s['doska']]
    bu.interaktiv_doska(*yuz, trot, d['y2'] - d['y1'] if s['doska'] in ('ong', 'chap') else d['x2'] - d['x1'],
                        f"Xadra filiali  ·  {s['kod'][2:]}-xona", nom=f"{s['kod']}_doska")

# ---------------- xizmat xonalari, CEO ----------------
YON = {'n': (0, 1), 's': (0, -1), 'w': (1, 0), 'e': (-1, 0)}           # stul turgan tomondan stolga qarash
OLDI_M = {'past': 'y2', 'yuqori': 'y1', 'chap': 'x1', 'ong': 'x2'}
MON_ROT = {'past': 0, 'yuqori': 180, 'chap': 90, 'ong': -90}
stul_xodim = bu.stul_mesh(M['mato_kul_toq'])
for z in D['xizmat']:
    q = Q()
    for st in z['stollar']:
        bu.ustoz_stoli(q, st, OLDI_M.get(st.get('monitor'), 'y2') if st.get('monitor') else None)
        if st.get('monitor'):
            cx, cy = mk(st)
            mx, my = {'past': (cx, st['y2'] - 170), 'yuqori': (cx, st['y1'] + 170), 'chap': (st['x1'] + 170, cy), 'ong': (st['x2'] - 170, cy)}[st['monitor']]
            bu.monitor(q, mx, my, MON_ROT[st['monitor']])
    for sh in z['shkaflar']: bu.shkaf(q, sh, M['parta'], 2000)
    for dv in z['divanlar']: bu.divan(q, dv, 'x2')
    for dm in z['dumaloq']: bu.dumaloq_stol(q, dm['cx'], dm['cy'], dm['r'])
    q.obj(f"{z['kod']}_mebel", 'asos')
    for i, st in enumerate(z['stullar']):
        f = YON[st['yon']]
        if st['ofis']: bu.joyla(km, f"{z['kod']}_kreslo_{i}", 'asos', mk(st), bu.burchak_xona(*f))
        else: bu.joyla(stul_xodim, f"{z['kod']}_stul_{i}", 'asos', mk(st), {'n': 180, 's': 0, 'w': 90, 'e': -90}[st['yon']])
# sotuv va admin xonalari: shimoliy (orqa) devorda brend devor — logotip; sotuvda ostida yashil chiziq
x1 = X['XZ1']; x2 = X['XZ2']
bu.logo_panel((x1['x1'] + x1['x2']) / 2, x1['y1'] + 12, 0, 1500, 1900, 'primary-on-light', kuch=0.0, halqa=0, nom='logo_sotuv')
q = Q(); q.box(x1['x1'] + 150, x1['x2'] - 150, x1['y1'], x1['y1'] + 14, 1450, 1475, M['brend_yashil']); q.obj('sotuv_chiziq', 'asos')
bu.logo_panel((x2['x1'] + x2['x2']) / 2, x2['y1'] + 12, 0, 1100, 1900, 'primary-on-light', kuch=0.0, halqa=0, nom='logo_admin')

# ---------------- koworking ----------------
kw = D['kw']
q = Q()
for r in kw['stollar']:
    q.box(r['x1'], r['x2'], r['y1'], r['y2'], 725, 755, M['yogoch_toq'], bevel=6)
    gor = (r['x2'] - r['x1']) > (r['y2'] - r['y1'])
    for a in (0, 1):
        if gor:
            x = r['x1'] + 150 if a == 0 else r['x2'] - 150
            q.box(x - 25, x + 25, r['y1'] + 80, r['y2'] - 80, 0, 725, M['qora_metall'])
        else:
            y = r['y1'] + 150 if a == 0 else r['y2'] - 150
            q.box(r['x1'] + 80, r['x2'] - 80, y - 25, y + 25, 0, 725, M['qora_metall'])
for d in kw['dumaloq']: bu.dumaloq_stol(q, d['cx'], d['cy'], d['r'])
for d in kw['divan']: bu.divan(q, d, 'x2')
for r in kw['kreslo']:
    q.box(r['x1'] + 60, r['x2'] - 60, r['y1'] + 60, r['y2'] - 60, 0, 420, M['mato_yashil'], bevel=60, seg=3)
for i, r in enumerate(kw['kreslo']):
    orqa = 'y1' if i == 0 else 'y2'
    yb = (r['y1'] + 40, r['y1'] + 200) if orqa == 'y1' else (r['y2'] - 200, r['y2'] - 40)
    q.box(r['x1'] + 40, r['x2'] - 40, *yb, 0, 780, M['mato_yashil'], bevel=60, seg=3)
for r in kw['jurnal']:
    q.box(r['x1'], r['x2'], r['y1'], r['y2'], 380, 420, M['parta'], bevel=8)
    q.box(r['x1'] + 40, r['x2'] - 40, r['y1'] + 40, r['y2'] - 40, 0, 380, M['qora_metall'])
for r in kw['shkaf']: bu.shkaf(q, r, M['parta'], 1100)
q.obj('koworking_mebel', 'asos')
for i, s in enumerate(kw['stullar']):
    bu.joyla(sm, f'kw_stul_{i}', 'asos', mk(s), {'n': 180, 's': 0, 'w': 90, 'e': -90}[s['yon']])
# koworking ekrani (shimoliy devorda)
q = Q(); q.box(-900, 900, 0, 60, 1250, 2280, M['korpus'], bevel=8); q.box(-880, 880, 60, 62, 1270, 2260, M['ekran']); q.obj('kw_ekran', 'asos', (2100, 6500), 0)
bu.matn('PDP Academy', 2100, 6564, 1830, 170, M['ekran_matn'], 'kw_ekran_matn', 0, shrift=bu.shrift(True))

# ---------------- o'simliklar ----------------
q = Q()
for x, y in D['osimlik']: bu.osimlik(q, x, y)
q.obj('osimliklar', 'asos')

# ---------------- sanuzel (mavjud) ----------------
q = Q()
for x, y in D['sanuzel']['unitaz']:
    q.box(x - 190, x + 190, y - 270, y - 100, 420, 780, M['keramika'], bevel=25, seg=3)
    q.cyl((x, y + 20, 0), (x, y + 20, 300), 130, M['keramika'], 32)
    q.shar(x, y + 60, 330, 180, 240, 110, M['keramika'])
    q.shar(x, y + 70, 425, 175, 230, 22, M['keramika'])
for x, y in D['sanuzel']['rakovina']:
    q.box(5900 - 440, 5900, y - 260, y + 260, 700, 850, M['keramika'], bevel=45, seg=4)
q.obj('sanuzel_jihoz', 'asos')

# ---------------- zinalar ----------------
q = Q()
n, rz = 11, 1750 / 11
tq = (4400 - 1300) / n
for k in range(n):     # ZN1: o'ng marsh pastga (janubga), chap marsh yanada pastga (shimolga)
    top = -(k + 1) * rz
    q.box(1550, 2850, 1300 + k * tq, 1300 + (k + 1) * tq, top - 300, top, M['zina'])
    top2 = -1750 - (k + 1) * rz
    q.box(150, 1450, 4400 - (k + 1) * tq, 4400 - k * tq, top2 - 300, top2, M['zina'])
q.box(150, 2850, 4400, 6300, -1950, -1750, M['zina'])
n2 = 9; tx = (3650 - 1500) / n2; rz2 = 1750 / n2
for k in range(n2):    # ZN2: kirish zalidan g'arbga pastga, burchakda maydoncha, keyin janubga — 1-qavatga
    top = -(k + 1) * rz2
    q.box(3650 - (k + 1) * tx, 3650 - k * tx, 18550, 19850, top - 300, top, M['zina'])
q.box(150, 1500, 18550, 19950, -1950, -1750, M['zina'])
ty = (21150 - 19950) / 6; rz3 = 1750 / 12
for k in range(6):
    top = -1750 - (k + 1) * rz3
    q.box(150, 1400, 19950 + k * ty, 19950 + (k + 1) * ty, top - 300, top, M['zina'])
q.box(0, 3700, 0, 6300, -3800, -3700, M['beton']); q.box(0, 3700, 18450, 21250, -3800, -3700, M['beton'])
q.obj('zinalar', 'asos')
q = Q()
bu.perila(q, (180, 1270, 0), (1500, 1270, 0)); bu.perila(q, (1500, 1270, 0), (1500, 4400, -1750))
bu.perila(q, (1450, 19900, 0), (3650, 19900, 0)); bu.perila(q, (1450, 19950, 0), (1450, 21150, 0))
q.obj('perila', 'asos')

# ---------------- shift, chiroqlar, diffuzorlar ----------------
q = Q(); q.box(-DV['chap'], I['x'] + DV['ong'], -DV['yuqori'], I['y'] + DV['past'], H, H + 200, M['shift']); q.obj('shift', 'tepa')
LED, DIF = [], []
for s in D['sinflar']:
    for b in s['bolaklar']:
        if (b['x2'] - b['x1']) < 3000 or (b['y2'] - b['y1']) < 3000:     # 4-xonaning tor uchlari
            LED += [(b['x1'] + (b['x2'] - b['x1']) * f, (b['y1'] + b['y2']) / 2, 600, 600) for f in (0.3, 0.75)]
            continue
        gor = (b['x2'] - b['x1']) >= (b['y2'] - b['y1'])
        na, nb = (3, 2) if gor else (2, 3)
        for i in range(na):
            for j in range(nb):
                LED.append((b['x1'] + (b['x2'] - b['x1']) * (2 * i + 1) / (2 * na), b['y1'] + (b['y2'] - b['y1']) * (2 * j + 1) / (2 * nb), 600, 600))
        DIF += [(b['x1'] + (b['x2'] - b['x1']) * 0.5, b['y1'] + (b['y2'] - b['y1']) * f) for f in (0.25, 0.75)] if not gor else \
               [(b['x1'] + (b['x2'] - b['x1']) * f, b['y1'] + (b['y2'] - b['y1']) * 0.5) for f in (0.25, 0.75)]
for kod in ('XZ1', 'XZ2', 'XZ3', 'XZ4'):
    x = X[kod]; LED += [((x['x1'] + x['x2']) / 2, x['y1'] + (x['y2'] - x['y1']) * f, 600, 600) for f in (0.3, 0.72)]
    DIF.append(((x['x1'] + x['x2']) / 2, (x['y1'] + x['y2']) / 2))
x12 = X['X12']; LED += [(1500, 22900, 600, 600), (4400, 22900, 600, 600)]
LED += [(x, y, 600, 600) for x in (1150, 3000, 4800) for y in (8000, 11500, 15000)] + [(1500, 17200, 600, 600), (3300, 17200, 600, 600)]
LED += [(4800, 19800, 600, 600), (4500, 2800, 400, 400), (4500, 5100, 400, 400)]
for kod in ('K1', 'K2'):   # koridor: markazida uzluksiz chiziqli chiroq
    kr = X[kod]; yc = (kr['y1'] + kr['y2']) / 2
    LED += [(x + 600, yc, 1200, 50) for x in range(6200, 18800, 1300)]
bu.led_panellar(LED, 'led')
q = Q()
for x, y in DIF:
    q.box(x - 300, x + 300, y - 300, y + 300, H - 10, H, M['alyuminiy_och'])
    for k in range(1, 6): q.box(x - 270, x + 270, y - 300 + k * 100 - 8, y - 300 + k * 100 + 8, H - 12, H - 10, M['korpus'])
q.obj('diffuzorlar', 'tepa')

# ---------------- tashqi muhit ----------------
q = Q(); q.box(-80000, 100000, -80000, 100000, -6300, -6000, M['yer']); q.obj('yer', 'tashqi')
q = Q(); q.box(-3500, I['x'] + 3500, -3500, I['y'] + 3500, -320, -260, M['taglik']); q.obj('taglik', 'taglik')

# ---------------- kameralar va render ----------------
kam = bu.kamera
K1y = (X['K1']['y1'] + X['K1']['y2']) / 2; K2y = (X['K2']['y1'] + X['K2']['y2']) / 2
KOR = {
    'umumiy': dict(cam=kam('kamera_umumiy', (-6500, 41000, 36000), (12300, 11800, -500), 35), res=(2400, 1700), ichki=False, quyosh=(125, 55, 3.2)),
    'k1': dict(cam=kam('kamera_K1', (6150, K1y + 150, 1600), (19300, K1y - 60, 1450), 24), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'k2': dict(cam=kam('kamera_K2', (6150, K2y - 150, 1600), (19300, K2y + 60, 1450), 24), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'logo': dict(cam=kam('kamera_logo', (14800, K2y + 450, 1650), (19300, K2y - 250, 1500), 22), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'doskalar': dict(cam=kam('kamera_doskalar', (6500, 7950, 1600), (9800, 9300, 1350), 24), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'sotuv': dict(cam=kam('kamera_sotuv', (8850, 14850, 1750), (7000, 10200, 1250), 16), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'admin': dict(cam=kam('kamera_admin', (10950, 14700, 1650), (9800, 9800, 1100), 17), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'sinf': dict(cam=kam('kamera_sinf', (12450, 5600, 1650), (17950, 3700, 1300), 19), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'kw': dict(cam=kam('kamera_koworking', (5350, 17500, 1700), (1300, 8800, 1000), 18), res=(1920, 1080), ichki=True, quyosh=(165, 30, 3.0)),
}
FAYL = {'umumiy': '1-umumiy', 'k1': '2-koridor-K1', 'k2': '3-koridor-K2', 'logo': '4-koridor-logotip', 'doskalar': '5-koridor-doskalar',
        'sotuv': '6-sotuv-xonasi', 'admin': '7-admin-xonasi', 'sinf': '8-sinf-doska', 'kw': '9-koworking'}
bu.render_sozla(A['tez'])
os.makedirs(A['chiq'], exist_ok=True)
BELGI = {k: (*mk(X[k]), 0) for k in ('SR1', 'SR2', 'SR3', 'SR5', 'SR6', 'SR7', 'XZ1', 'XZ2', 'XZ3', 'XZ4', 'KW', 'X12')}
BELGI['SR4'] = (21600, 12200, 0); BELGI['K1'] = (9000, 8550, 0); BELGI['K2'] = (14000, 15850, 0)
BELGI['ZN1'] = (1500, 3000, 0); BELGI['ZL'] = (4800, 19800, 0)
bu.belgilar(KOR['umumiy']['cam'], KOR['umumiy']['res'], BELGI, os.path.join(A['chiq'], 'umumiy-belgilar-2.json'))
bu.renderla(KOR, A['chiq'], 'Xadra_2-qavat_3D', FAYL, A['tez'], A['faqat'])
bu.saqla(A['chiq'], 'Xadra_2-qavat.blend', KOR['k1']['cam'], tez=A['tez'], blend=A['blend'])
