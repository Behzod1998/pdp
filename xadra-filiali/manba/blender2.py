# 2-qavat — Blender sahnasi va renderlar (Cycles). Umumiy qismlar: blender_umumiy.py
# Ishlatish:
#   node blender2-malumot.mjs > 2qavat.json
#   python blender2.py 2qavat.json ../chizma/3d [--tez] [--blend] [--faqat umumiy,k1,k2,logo,sotuv,admin,sinf,kw] [--variant B]
#   --variant B — koridor shisha devorlari tik profilsiz (faqat atrofida profil, oynalar yonma-yon tutashadi); fayllar «_B» bilan
#   --logosiz — koridor oxiri (kladovka devori) oddiy: oq devor, oddiy eshik, reykasiz; fayllar «_logosiz» bilan.
#     Standart — logoli: marmar panel, mox, reykali kanopi; kladovka eshigi yashirin (barg marmar bilan qoplangan).
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import blender_umumiy as bu
from blender_umumiy import Q, P, M, H, KESIM, ESH_H, SHISHA_H

A = bu.argv()
LOGOLI = '--logosiz' not in sys.argv      # koridor oxiri varianti (16.10: buyurtmachi — ikki variant)
D = json.load(open(A['json']))
bu.boshla()
I = D['ichki']; DV = D['devor']
KX = D['logo'][0]['x']            # koridor oxiri — kladovkaning ko'ndalang devori (16.10)
X = {x['kod']: x for x in D['xonalar']}
mk = lambda r: ((r['x1'] + r['x2']) / 2, (r['y1'] + r['y2']) / 2)
# koridor oxiri: mox polosasi eni, reykalar (shiftda uzunligi, egilish radiusi, devorda pastki chegarasi), mm
KOR_OXIR = {'mox': 250, 'kanopi': 2400, 'R': 450, 'reykaPast': 2850, 'reyka': (40, 80, 80)}   # reyka: eni, qalinligi, qadami

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
    for e in ESH:     # eshik ustidagi devor (yangi shisha eshik ustida 2.5 m gacha shisha; kladovka eshigi — oddiy)
        t1, t2 = e['qalinlik']
        rect = (t1, t2, e['a'], e['b']) if e['devor'] == 'v' else (e['a'], e['b'], t1, t2)
        out.append((*rect, SHISHA_H if e['holat'] == 'yangi' and e.get('shisha') else ESH_H, h))
    return out, shisha

for h, k in ((H, 'toliq'), (KESIM, 'kesim')):
    q = Q()
    bol, _ = devor_bolaklar(h)
    for x1, x2, y1, y2, z1, z2 in bol:
        q.box(x1, x2, y1, y2, z1, z2, M['devor'], top=M['qopqoq'] if (k == 'kesim' and z2 == h) else None)
    for u in D['ustunlar']:
        if u['ichki']: q.box(u['x1'], u['x2'], u['y1'], u['y2'], 0, h, M['ustun'], top=M['qopqoq'] if k == 'kesim' else None)
    q.obj(f'devorlar_{k}', k)

# shisha devorlar: 2.5 m gacha laminatlangan shisha, 1.0–1.6 m da matli polosa, alyuminiy profillar.
# A — har ~1.5 m da tik profil; B (buyurtmachi, 15.10) — tik profil yo'q: profil faqat atrofida (pastda, tepada, chetlarda),
# oynalar bir-biriga yonma-yon tutashadi (shaffof silikon chok, ~2 mm).
VARIANT = A['variant']
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
        if VARIANT == 'B' and 0 < i < n: continue          # B: oraliq tik profillar yo'q
        t = a1 + (a2 - a1) * i / n
        B(max(a1, t - 25), min(a2, t + 25), 0, SHISHA_H, M['alyuminiy'], 30)
    if VARIANT == 'B':      # alohida oynalar, orasida ~2 mm shaffof chok
        for i in range(n):
            p1, p2 = a1 + (a2 - a1) * i / n + (1 if i else 0), a1 + (a2 - a1) * (i + 1) / n - (1 if i < n - 1 else 0)
            for za, zb, gm in ((50, 1000, M['oyna']), (1000, 1600, M['xira']), (1600, SHISHA_H - 50, M['oyna'])):
                B(p1, p2, za, zb, gm, 5)
    else:
        for za, zb, gm in ((50, 1000, M['oyna']), (1000, 1600, M['xira']), (1600, SHISHA_H - 50, M['oyna'])):
            B(a1, a2, za, zb, gm, 5)
q.obj('shisha_devorlar', 'asos')

# mat plyonkadagi logo (buyurtmachi, 15.10): yangi PDP Academy logosi, bir rangli to'q — koridor tomonda, 1.0–1.6 m polosa
# o'rtasida; shisha devorning har paneliga bittadan, har eshikka bittadan (namunadagidek). Xona ichidan ko'zgu aksida ko'rinadi.
PLY = {'z': 1300, 'devor': 700, 'eshik': 520, 'versiya': 'primary-mono-dark'}
KOR_Y = [(X[k]['y1'], X[k]['y2']) for k in ('K1', 'K2')]
def koridor_tomon(c):
    # shisha o'qi c koridorning qaysi tomonida: +1 — koridor +y da (devor koridorning yuqorisida), −1 — pastida, 0 — koridorga tegmaydi
    for y1, y2 in KOR_Y:
        if y1 - 200 <= c <= y1: return +1
        if y2 <= c <= y2 + 200: return -1
    return 0
n_ply = 0
for w in SHISHA:
    if (w['x2'] - w['x1']) <= (w['y2'] - w['y1']): continue
    c = (w['y1'] + w['y2']) / 2; t = koridor_tomon(c)
    if not t: continue
    a1, a2 = w['x1'], w['x2']; n = max(1, round((a2 - a1) / 1500))
    for i in range(n):
        p1, p2 = a1 + (a2 - a1) * i / n, a1 + (a2 - a1) * (i + 1) / n
        if p2 - p1 < PLY['devor'] + 200: continue
        bu.logo_panel((p1 + p2) / 2, c, 0 if t > 0 else 180, PLY['devor'], PLY['z'], PLY['versiya'], kuch=0.0, halqa=0, nom=f'plyonka_logo_{n_ply}', ofset=8)
        n_ply += 1
# suriladigan eshiklar (founder, 16.10 — Damas eshigi kabi): 1 m, barg xona tomonida devor bo'ylab suriladi (rejadagi
# surmaBarg bilan bir xil: devordan 15 mm oraliq, barg 40 mm, ochiq o'rin chetlariga 30 mm kiradi). OCHIQ — ko'rinishlarda
# suriladigan mexanizm ko'rinishi uchun yarim ochiq qoldirilgan eshiklar (ulush).
SURMA = {'barg': 40, 'oraliq': 15, 'ustma': 30}
OCHIQ = {'SR6': 0.5}
def surma_barg(e):
    s_ = -1 if e['park'] == 'a' else 1
    d = s_ * e['en'] * OCHIQ.get(e['kod'], 0)
    ya, yb = sorted((e['yuz'] + e['yon'] * SURMA['oraliq'], e['yuz'] + e['yon'] * (SURMA['oraliq'] + SURMA['barg'])))
    return e['a'] - SURMA['ustma'] + d, e['b'] + SURMA['ustma'] + d, ya, yb, s_
for e in ESH:
    if e['holat'] != 'yangi' or not e.get('surma'): continue
    x1, x2, ya, yb, _ = surma_barg(e); t = -e['yon']          # koridor — barg turgan tomonga qarshi
    bu.logo_panel((x1 + x2) / 2, (ya + yb) / 2, 0 if t > 0 else 180, PLY['eshik'], PLY['z'], PLY['versiya'], kuch=0.0, halqa=0, nom=f"plyonka_logo_{e['kod']}", ofset=8)
    n_ply += 1
print('plyonka logolari:', n_ply)

# derazalar
ICH = {'yuqori': +1, 'past': -1, 'chap': +1}
q = Q()
for d in DER: bu.deraza(q, {**d, 'ichki': ICH[d['devor']]})
q.obj('derazalar', 'asos')

# eshiklar: koridordagi 11 ta — suriladigan shisha (ustida 2.5 m gacha shisha); kladovka eshigi — logoli variantda yashirin
# (koridor oxiri qoplamasida chizilgan), logosizda oddiy eshik; qolganlari mavjud eshiklar
def surma_eshik(e):
    x1, x2, ya, yb, s_ = surma_barg(e)
    yc, yn, al = (ya + yb) / 2, e['yon'], M['alyuminiy']
    yo = yb if yn > 0 else ya                      # bargning xona tomonidagi yuzi
    yk = ya if yn > 0 else yb                      # koridor tomonidagi yuzi
    q = Q()
    z1, z2 = 10, ESH_H + 40                         # barg o'rin tepasini 40 mm yopadi
    q.box(x1, x1 + 50, ya, yb, z1, z2, al); q.box(x2 - 50, x2, ya, yb, z1, z2, al)
    q.box(x1, x2, ya, yb, z1, z1 + 100, al); q.box(x1, x2, ya, yb, z2 - 50, z2, al)
    for za, zb, gm in ((z1 + 100, 1000, M['oyna']), (1000, 1600, M['xira']), (1600, z2 - 50, M['oyna'])):
        q.box(x1 + 50, x2 - 50, yc - 5, yc + 5, za, zb, gm)
    xh = x2 - 110 if s_ < 0 else x1 + 110          # dasta — bargning ochiq o'ringa kiradigan chetida
    q.cyl((xh, yo + yn * 55, 750), (xh, yo + yn * 55, 1450), 14, M['xrom'])
    for z in (800, 1400): q.cyl((xh, yo, z), (xh, yo + yn * 55, z), 8, M['xrom'])
    q.box(xh - 15, xh + 15, *sorted((yk, yk - yn * 4)), 900, 1300, M['xrom'])      # koridor tomonda — botiq tutqich
    # yuqori relsi va qopqog'i (yopiq va ochiq holatni qamraydi)
    ra = min(e['a'] - 30, e['a'] - 30 + s_ * e['en']); rb = max(e['b'] + 30, e['b'] + 30 + s_ * e['en'])
    q.box(ra, rb, *sorted((e['yuz'], e['yuz'] + yn * (SURMA['oraliq'] + SURMA['barg'] + 25))), z2, z2 + 100, al)
    q.obj(f"eshik_{e['kod']}", 'asos')
    # o'rin romi (devor qalinligi bo'ylab) va ustidagi shisha — 2.5 m gacha
    t1, t2 = e['qalinlik']; q = Q()
    Rr = lambda a, b, za, zb, m: q.box(a, b, t1, t2, za, zb, m)
    Rr(e['a'], e['a'] + 40, 0, SHISHA_H, al); Rr(e['b'] - 40, e['b'], 0, SHISHA_H, al)
    Rr(e['a'], e['b'], ESH_H - 40, ESH_H, al); Rr(e['a'], e['b'], SHISHA_H - 40, SHISHA_H, al)
    q.box(e['a'] + 40, e['b'] - 40, (t1 + t2) / 2 - 5, (t1 + t2) / 2 + 5, ESH_H, SHISHA_H - 40, M['oyna'])
    q.obj(f"eshik_romi_{e['kod']}", 'asos')

for e in ESH:
    if e.get('surma'): surma_eshik(e)
    elif e.get('kladovka'):
        if not LOGOLI: bu.eshik(e, 0)
    else: bu.eshik(e, 0, ustki_shisha=e['holat'] == 'yangi')

# ---------------- bambuk panel (poldan shiftgacha) ----------------
def qoplama_xona(q, x, tomon, m_x, m_y, h, teshik=()):
    """Xonaning bir devoriga qoplama: tomon — 'x1'|'x2'|'y1'|'y2' (xona to'rtburchagi bo'yicha)."""
    if tomon in ('x1', 'x2'):
        bu.qoplama(q, 'v', x[tomon], +1 if tomon == 'x1' else -1, x['y1'], x['y2'], 0, h, list(teshik), m_y, 12)
    else:
        bu.qoplama(q, 'h', x[tomon], +1 if tomon == 'y1' else -1, x['x1'], x['x2'], 0, h, list(teshik), m_x, 12)

QARSHI = {'x1': 'x2', 'x2': 'x1', 'y1': 'y2', 'y2': 'y1'}
SAHNA = D['sahna']
DOSKA_TOMON = {'ong': 'x2', 'chap': 'x1', 'yuqori': 'y1', 'past': 'y2'}
for h, k in ((H, 'toliq'), (KESIM, 'kesim')):
    q = Q()
    for s in D['sinflar']:
        t = DOSKA_TOMON[s['doska']]
        o = s['doskaOfset']        # 4-xona: doska devori GKL qoplama bilan U6 ustuniga tekislangan
        sd = {**s, t: s[t] + (o if t in ('x1', 'y1') else -o)}
        qoplama_xona(q, sd, t, M['bambuk_x'], M['bambuk_y'], h)
        qoplama_xona(q, s, QARSHI[t], M['bambuk_x'], M['bambuk_y'], h)
    # 14.10: XZ xonalari 2 × 2 — sotuv va admin: ikkala kalta devor (o'rta devor — brend devor); ustozlar va call-markaz: o'rta va g'arbiy devor
    for kod, tt in (('XZ1', ('x1', 'x2')), ('XZ2', ('x1', 'x2')), ('XZ3', ('y2', 'x1')), ('XZ4', ('y2', 'x1'))):
        for t in tt: qoplama_xona(q, X[kod], t, M['bambuk_x'], M['bambuk_y'], h)
    x12 = X['X12']
    e12 = next(e for e in ESH if e['kod'] == 'X12')
    qoplama_xona(q, x12, 'y1', M['bambuk_x'], M['bambuk_y'], h, [(e12['a'], e12['b'], 0, ESH_H)])
    qoplama_xona(q, x12, 'x2', M['bambuk_x'], M['bambuk_y'], h)
    # koridor oxiri (buyurtmachi, 15.10 — Jahon School namunasi uslubida): markazda marmar ko'rinishli panel (logotip ostida),
    # ikki yonida yashil o'simlik (mox) polosalari va ular orasida yashil LED; tepasida shiftdan egilib tushadigan reykalar.
    # 16.10: bu kladovkaning ko'ndalang devori — kladovka eshigi (800) yashirin: bargi marmar bilan qoplangan, atrofida 3 mm tirqish.
    # Logosiz variantda devor oddiy (oq bo'yoq), eshik oddiy.
    for l in (D['logo'] if LOGOLI else []):
        fx, y1, y2 = l['x'], l['y1'], l['y2']
        zt = min(h, KOR_OXIR['reykaPast'])
        q.box(fx - 25, fx, y1 + KOR_OXIR['mox'], y2 - KOR_OXIR['mox'], 0, zt, M['marmar'])
        for a, b in ((y1, y1 + KOR_OXIR['mox']), (y2 - KOR_OXIR['mox'], y2)):
            q.box(fx - 45, fx, a, b, 0, zt, M['mox'])
        for ya in (y1 + KOR_OXIR['mox'], y2 - KOR_OXIR['mox'] - 14):
            q.box(fx - 50, fx - 20, ya, ya + 14, 60, zt - 40, M['led_yashil'])
        if h > zt: q.box(fx - 12, fx, y1, y2, zt, h, M['grafit'])
        ke = next(e for e in ESH if e.get('kladovka') and y1 <= e['a'] <= y2)     # yashirin eshik tirqishlari
        for ya in (ke['a'], ke['b'] - 3): q.box(fx - 26, fx - 24, ya, ya + 3, 0, ESH_H, M['korpus'])
        q.box(fx - 26, fx - 24, ke['a'], ke['b'], ESH_H - 3, ESH_H, M['korpus'])
    # koworking sahnasi (XZ1 devori): GKL karkas, markazda grafit panel, yonlarida qora asos ustida yog'och reykalar
    sd = SAHNA['devor']; fx = sd['x1']
    q.box(fx, sd['x2'], sd['y1'], sd['y2'], 0, h, M['devor'], top=M['qopqoq'] if k == 'kesim' else None)
    q.box(fx - 15, fx, SAHNA['panel']['y1'], SAHNA['panel']['y2'], 0, h, M['grafit'], top=M['qopqoq'] if k == 'kesim' else None)
    for r in SAHNA['reyka']:
        q.box(fx - 12, fx, r['y1'], r['y2'], 0, h, M['korpus'])
        a1, a2 = r['y1'] + 60, r['y2'] - 60          # chetlarida yashil LED chiziq uchun joy
        n = int((a2 - a1 + 45) // 85)
        y0 = a1 + (a2 - a1 - (n * 85 - 45)) / 2
        for i in range(n): q.box(fx - 50, fx - 12, y0 + i * 85, y0 + i * 85 + 40, 0, h, M['bambuk_y'])
        for ya in (r['y1'] + 15, r['y2'] - 35):   # tik yashil LED chiziqlar (reyka panelining ikki chetida)
            q.box(fx - 40, fx - 12, ya, ya + 20, 0, h, M['brend_yashil_nur'])
    q.obj(f'qoplama_{k}', k)

# ---------------- koridor: logotip, doskalar ----------------
for i, l in enumerate(D['logo'] if LOGOLI else []):
    ym = (l['y1'] + l['y2']) / 2       # logotip yashirin eshik bargida (eni barg chegarasidan chiqmaydi)
    bu.logo_panel(l['x'] - 25, ym, 90, l['en'], l['z'], 'primary-on-light', kuch=0.6, halqa=0.35, nom=f"logo_{l['koridor']}", ofset=30)
    bu.spot(l['x'] - 900, ym, H - 120, 45, (l['x'] - 25, ym, 1500), 60, f"logo_spot_{l['koridor']}")
# koridor oxiri: shiftdan devorga egilib tushadigan yog'och reykalar (kanopi) — profil yo'l bo'ylab cho'ziladi
def lenta(q, yol, yc, w, d, m):
    from mathutils import Vector
    pts = [P(x, yc, z) for x, z in yol]
    halq = []
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        yv = Vector((0, 1, 0)); nv = t.cross(yv).normalized()
        halq.append([q.bm.verts.new(p + nv * sx * d / 2000 + yv * sy * w / 2000) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    mi = q.mi(m)
    for a, b in zip(halq, halq[1:]):
        for j in range(4):
            f = q.bm.faces.new((a[j], a[(j + 1) % 4], b[(j + 1) % 4], b[j])); f.material_index = mi
    for r in (halq[0], halq[-1]):
        f = q.bm.faces.new(r); f.material_index = mi
q = Q()
for l in (D['logo'] if LOGOLI else []):
    fx, y1, y2 = l['x'], l['y1'], l['y2']
    w, d, qd = KOR_OXIR['reyka']; R = KOR_OXIR['R']; zc = H - 10 - d / 2; xa = fx - 12 - d / 2 - R
    yol = [(fx - KOR_OXIR['kanopi'], zc), (xa, zc)]
    yol += [(xa + R * math.sin(math.radians(a)), zc - R + R * math.cos(math.radians(a))) for a in range(10, 91, 10)]
    yol += [(fx - 12 - d / 2, KOR_OXIR['reykaPast'])]
    n = int((y2 - y1 - 60) // qd); y0 = (y1 + y2) / 2 - (n - 1) * qd / 2
    for i in range(n): lenta(q, yol, y0 + i * qd, w, d, M['yogoch_reyka'])
q.obj('koridor_kanopi', 'toliq')
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
    for sh in z.get('tarmoqShkaf', []): bu.shkaf(q, sh, M['qora_metall'], sh['bal'])   # NVR / router / switch shkafi
    for dv in z['divanlar']: bu.divan(q, dv, 'x2')
    for dm in z['dumaloq']: bu.dumaloq_stol(q, dm['cx'], dm['cy'], dm['r'])
    q.obj(f"{z['kod']}_mebel", 'asos')
    for i, st in enumerate(z['stullar']):
        f = YON[st['yon']]
        if st['ofis']: bu.joyla(km, f"{z['kod']}_kreslo_{i}", 'asos', mk(st), bu.burchak_xona(*f))
        else: bu.joyla(stul_xodim, f"{z['kod']}_stul_{i}", 'asos', mk(st), {'n': 180, 's': 0, 'w': 90, 'e': -90}[st['yon']])
# sotuv va admin xonalari (K2 tomonda, yonma-yon): eski o'rta devorda brend devor — logotip; sotuvda ostida yashil chiziq
x1 = X['XZ1']; x2 = X['XZ2']
bu.logo_panel((x1['x1'] + x1['x2']) / 2, x1['y1'] + 12, 0, 1500, 1950, 'primary-on-light', kuch=0.0, halqa=0, nom='logo_sotuv')
q = Q(); q.box(x1['x1'] + 150, x1['x2'] - 150, x1['y1'], x1['y1'] + 14, 1500, 1525, M['brend_yashil']); q.obj('sotuv_chiziq', 'asos')
bu.logo_panel((x2['x1'] + x2['x2']) / 2, x2['y1'] + 12, 0, 1100, 1950, 'primary-on-light', kuch=0.0, halqa=0, nom='logo_admin')

# ---------------- koworking ----------------
# kundalik va tadbir rejimlari alohida to'plamlarda: tadbir rejimi faqat «tomoshabin» ko'rinishida yoqiladi
bu.K['kw_kundalik'] = bu.kol('kw_kundalik'); bu.K['kw_tadbir'] = bu.kol('kw_tadbir'); bu.kor_yashir('kw_tadbir', True)
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
q.obj('koworking_mebel', 'kw_kundalik')
q = Q()
for r in kw['shkaf']: bu.shkaf(q, r, M['parta'], 1100)
q.obj('koworking_shkaf', 'asos')
for i, s in enumerate(kw['stullar']):
    bu.joyla(sm, f'kw_stul_{i}', 'kw_kundalik', mk(s), {'n': 180, 's': 0, 'w': 90, 'e': -90}[s['yon']])
for i, s in enumerate(D['kw_tadbir']):     # tadbir: stullar sahnaga (sharqqa) qaragan
    bu.joyla(sm, f'kw_tadbir_stul_{i}', 'kw_tadbir', mk(s), {'n': 180, 's': 0, 'w': 90, 'e': -90}[s['yon']])
# ---------------- koworking sahnasi (XZ1 devori) ----------------
# Namuna (buyurtmachi): Najot Ta'lim sahnasi va AI varianti. Grafit panel: tepada ichidan yoritilgan logotip, ostida 86" ekran;
# reykalar chetida tik yashil LED; devor tepasida yashil chiziq; shiftda qora trek shina va spotlar; devorga osilgan kolonkalar.
fx = SAHNA['devor']['x1'] - 15
lg, ek = SAHNA['logo'], SAHNA['ekran']
bu.logo_panel(fx, lg['y'], 90, lg['en'], lg['z'], 'primary-on-dark', kuch=2.4, halqa=0.6, nom='logo_sahna')
M['ekran_yashil'] = bu.mat('ekran_yashil', '#0a2a1a', 0.2, emit=1.0, emit_rang='#0b4426')
M['ekran_yashil2'] = bu.mat('ekran_yashil2', '#33c46b', 0.4, emit=2.2, emit_rang='#2fbf66')
w2 = ek['en'] / 2
q = Q(); q.box(-w2, w2, 0, 55, ek['z1'], ek['z2'], M['korpus'], bevel=8); q.box(-w2 + 15, w2 - 15, 55, 57, ek['z1'] + 15, ek['z2'] - 15, M['ekran_yashil'])
# ekrandagi to'lqin (PDP doirasi motivi): ekran chegarasida kesilgan ikki yoy
for (cu, cz, R, t, m) in ((520, ek['z1'] - 250, 1050, 26, M['ekran_yashil2']), (700, ek['z1'] - 420, 1050, 14, M['brend_yashil_nur'])):
    for j in range(0, 181, 1):
        a = math.radians(j)
        u, z = cu + R * math.cos(a), cz + R * math.sin(a)
        if -w2 + 30 < u < w2 - 30 and ek['z1'] + 30 < z < ek['z2'] - 30:
            q.box(u - 12, u + 12, 57, 58, z - t / 2, z + t / 2, m)
q.obj('sahna_ekran', 'asos', (fx, ek['y']), 90)
bu.matn('PDP Academy', fx - 60, ek['y'] - 330, ek['z1'] + 620, 120, M['ekran_matn'], 'sahna_ekran_matn', 90, shrift=bu.shrift(True))
bu.matn("Xadra filiali", fx - 60, ek['y'] - 330, ek['z1'] + 470, 60, M['ekran_matn'], 'sahna_ekran_izoh', 90, shrift=bu.shrift())
# devor tepasidagi yashil chiziq (to'liq balandlikdagi ko'rinishlar uchun)
q = Q(); q.box(fx - 40, fx, SAHNA['devor']['y1'], SAHNA['devor']['y2'], H - 45, H - 25, M['brend_yashil_nur']); q.obj('sahna_chiziq', 'toliq')
# sahna maydoni: pol bilan bir sathda yog'och ko'rinishli vinil
sp = SAHNA['pol']
q = Q(); q.box(sp['x1'], sp['x2'], sp['y1'], sp['y2'], 8, 11, M['pol_parket']); q.obj('sahna_pol', 'asos')
# trek shina va spotlar (shiftga osilgan), spot nurlari devorga
tr = SAHNA['trek']
q = Q()
q.box(tr['x'] - 20, tr['x'] + 20, tr['y1'], tr['y2'], tr['z'] - 40, tr['z'], M['qora_metall'])
for yy in (tr['y1'] + 300, (tr['y1'] + tr['y2']) / 2, tr['y2'] - 300):
    q.cyl((tr['x'], yy, tr['z']), (tr['x'], yy, H), 5, M['qora_metall'], 8)
for i in range(tr['spot']):
    yy = tr['y1'] + 300 + i * (tr['y2'] - tr['y1'] - 600) / (tr['spot'] - 1)
    nz = 2300 if i % 2 == 0 else 1500                     # navbat bilan: logotip zonasi va ekran zonasi
    a, nish = (tr['x'], yy, tr['z'] - 40), (fx, yy, nz)
    d = [nish[c] - a[c] for c in range(3)]; L = math.sqrt(sum(v * v for v in d)); d = [v / L for v in d]
    b0 = (a[0], a[1], a[2] - 60)
    q.cyl(a, b0, 10, M['qora_metall'], 8)
    uch = (b0[0] + d[0] * 170, b0[1] + d[1] * 170, b0[2] + d[2] * 170)
    q.cyl(b0, uch, 42, M['qora_metall'], 20)
    bu.spot(*uch, 38, nish, 38, f'sahna_spot_{i}')
q.obj('sahna_trek', 'tepa')
# kolonkalar — reyka panellarida, devorga osilgan (o'tish yo'lagi bo'sh qoladi)
q = Q()
for yy in SAHNA['kolonka']:
    q.box(fx - 50 - 240, fx - 50 - 20, yy - 130, yy + 130, 2050, 2500, M['korpus'], bevel=12)
    q.box(fx - 50 - 242, fx - 50 - 238, yy - 115, yy + 115, 2070, 2480, M['mato'])
    q.box(fx - 50 - 20, fx - 12, yy - 40, yy + 40, 2240, 2310, M['qora_metall'])
q.obj('sahna_kolonkalar', 'asos')
# ko'chma minbar: grafit korpus, yog'och qopqoq, oldida kichik logotip (zalga qaragan)
mb = SAHNA['minbar']; mcx, mcy = mk(mb)
q = Q()
q.box(mb['x1'] + 40, mb['x2'] - 40, mb['y1'] + 40, mb['y2'] - 40, 0, 1060, M['grafit'], bevel=10)
q.box(mb['x1'] + 10, mb['x2'] - 10, mb['y1'] + 10, mb['y2'] - 10, 1060, 1110, M['yogoch_toq'], bevel=6)
q.box(mb['x1'] + 36, mb['x1'] + 40, mb['y1'] + 70, mb['y2'] - 70, 120, 135, M['brend_yashil_nur'])
q.obj('sahna_minbar', 'asos')
bu.logo_panel(mb['x1'] + 40, mcy, 90, 280, 820, 'inline-on-dark', kuch=1.2, halqa=0, nom='logo_minbar', ofset=3)
q = Q(); bu.osimlik(q, *SAHNA['osimlik'], bal=1750); q.obj('sahna_osimlik', 'asos')

# ---------------- o'simliklar ----------------
q = Q(); q2 = Q()
for x, y in D['osimlik']: bu.osimlik(q2 if (x, y) == (3900, 13950) else q, x, y)
q.obj('osimliklar', 'asos'); q2.obj('osimlik_kw', 'kw_kundalik')

# ---------------- ayollar hojatxonasi: kabinalarda unitaz, tamburlarda rakovina ----------------
q = Q()
for x, y in D['sanuzel']['unitaz']:
    q.box(x - 190, x + 190, y - 270, y - 100, 420, 780, M['keramika'], bevel=25, seg=3)
    q.cyl((x, y + 20, 0), (x, y + 20, 300), 130, M['keramika'], 32)
    q.shar(x, y + 60, 330, 180, 240, 110, M['keramika'])
    q.shar(x, y + 70, 425, 175, 230, 22, M['keramika'])
for x, y, b in D['sanuzel']['rakovina']:     # b: 90 — devor sharqda, −90 — g'arbda
    w = x + (210 if b > 0 else -210)
    q.box(*((w - 440, w) if b > 0 else (w, w + 440)), y - 260, y + 260, 700, 850, M['keramika'], bevel=45, seg=4)
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
for p in D.get('panjara', []):     # ZN2 — koworking tomonidagi devor o'rniga zina panjarasi (14.10)
    bu.perila(q, (p['x1'] + 150, p['y'] + 50, 0), (p['x2'], p['y'] + 50, 0), bal=p['bal'] - 40, tutqich=M['qora_metall'], ustun=M['qora_metall'])
q.obj('perila', 'asos')

# ---------------- shift, chiroqlar, diffuzorlar ----------------
q = Q(); q.box(-DV['chap'], I['x'] + DV['ong'], -DV['yuqori'], I['y'] + DV['past'], H, H + 200, M['shift']); q.obj('shift', 'tepa')
LED = []
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
for kod in ('XZ1', 'XZ2', 'XZ3', 'XZ4'):     # 5.7–5.8 × 2.6–2.8 m: chiroqlar xona bo'ylab
    x = X[kod]; LED += [(x['x1'] + (x['x2'] - x['x1']) * f, (x['y1'] + x['y2']) / 2, 600, 600) for f in (0.22, 0.5, 0.78)]
x12 = X['X12']; LED += [(1500, 22900, 600, 600), (4400, 22900, 600, 600)]
LED += [(x, y, 600, 600) for x in (1150, 3000, 4800) for y in (8000, 11500, 15000)] + [(1500, 17200, 600, 600), (3300, 17200, 600, 600)]
LED += [(4800, 19800, 600, 600), (4500, 2800, 400, 400), (4500, 5100, 400, 400)]
# kanalli konditsioner diffuzorlari (berish, kvadrat panel) va vitechka so'rish panjaralari (dumaloq) — vent-chizma.mjs joylari.
# Chiroq paneli diffuzor yoki panjaraga tegsa, eng yaqin bo'sh joyga suriladi (xona bo'lagi ichida qoladi).
DIF = [(*d['p'], d['panel']) for d in D['vent_dif']]
SOR = [(*v['p'], v['d']) for v in D['vent_sor']]
TOSIQ = [(x - p / 2 - 100, x + p / 2 + 100, y - p / 2 - 100, y + p / 2 + 100) for x, y, p in DIF] + \
        [(x - d / 2 - 150, x + d / 2 + 150, y - d / 2 - 150, y + d / 2 + 150) for x, y, d in SOR]
XB = [b for x in D['xonalar'] for b in x['bolaklar']]
def bosh_joy(x, y, w, d):
    tegadi = lambda cx, cy: any(cx - w / 2 < r[1] and r[0] < cx + w / 2 and cy - d / 2 < r[3] and r[2] < cy + d / 2 for r in TOSIQ)
    if not tegadi(x, y): return x, y
    bol = next((b for b in XB if b['x1'] <= x <= b['x2'] and b['y1'] <= y <= b['y2']), None)
    for k in range(1, 16):
        for dx, dy in ((k * 100, 0), (-k * 100, 0), (0, k * 100), (0, -k * 100)):
            cx, cy = x + dx, y + dy
            if bol and not (bol['x1'] + w / 2 + 150 <= cx <= bol['x2'] - w / 2 - 150 and bol['y1'] + d / 2 + 150 <= cy <= bol['y2'] - d / 2 - 150): continue
            if not tegadi(cx, cy): return cx, cy
    return x, y
LED = [(*bosh_joy(x, y, w, d), w, d) for x, y, w, d in LED]
YASHIL = []
for kod in ('K1', 'K2'):   # koridor (15.10): ko'ndalang chiziqli chiroqlar har 1.2 m da, ikki chetida yashil LED; oxirida reykali kanopi
    kr = X[kod]; yc = (kr['y1'] + kr['y2']) / 2
    xk = kr['x2'] - KOR_OXIR['kanopi'] if LOGOLI else kr['x2'] - 300     # logosiz: kanopi yo'q, chiroqlar oxirigacha
    LED += [(x, yc, 50, 1150) for x in range(6700, int(xk) - 300, 1200)]
    if LOGOLI: LED += [(xk + 1000, yc + dy, 1900, 26) for dy in (-160, 0, 160)]      # kanopi: reykalar orasidagi chiziqli LED
    YASHIL += [(6000, xk, kr['y1'] + 15, kr['y1'] + 40), (6000, xk, kr['y2'] - 40, kr['y2'] - 15)]
bu.led_panellar(LED, 'led')
q = Q()
for x1_, x2_, ya, yb in YASHIL: q.box(x1_, x2_, ya, yb, H - 40, H - 10, M['led_yashil'])
q.obj('koridor_yashil_led', 'tepa')
q = Q()
for x, y, p in DIF:      # 4 tomonga taqsimlovchi shift diffuzori: konsentrik kvadratlar
    r = p / 2
    q.box(x - r, x + r, y - r, y + r, H - 10, H, M['alyuminiy_och'])
    for k in range(1, 4):
        a = r - k * r / 4
        for x1_, x2_, y1_, y2_ in ((x - a, x + a, y - a, y - a + 10), (x - a, x + a, y + a - 10, y + a), (x - a, x - a + 10, y - a, y + a), (x + a - 10, x + a, y - a, y + a)):
            q.box(x1_, x2_, y1_, y2_, H - 13, H - 10, M['korpus'])
    q.box(x - r / 5, x + r / 5, y - r / 5, y + r / 5, H - 14, H - 10, M['alyuminiy_och'])
for x, y, d in SOR:      # dumaloq so'rish panjarasi (klapanli), Ø200
    q.cyl((x, y, H - 10), (x, y, H), d / 2 + 30, M['alyuminiy_och'], 32)
    q.cyl((x, y, H - 13), (x, y, H - 10), d / 2 - 10, M['korpus'], 32)
    q.cyl((x, y, H - 16), (x, y, H - 13), d / 5, M['alyuminiy_och'], 24)
for kod in ('K1', 'K2'):   # qaytish havosi: koridor oxirida shiftdagi panjara 600 × 300 (logoli variantda reykalar ortida)
    kr = X[kod]; yc = (kr['y1'] + kr['y2']) / 2; xg = kr['x2'] - 450
    q.box(xg - 150, xg + 150, yc - 300, yc + 300, H - 10, H, M['alyuminiy_och'])
    for k in range(1, 12): q.box(xg - 130, xg + 130, yc - 300 + k * 50 - 6, yc - 300 + k * 50 + 6, H - 12, H - 10, M['korpus'])
q.obj('diffuzorlar', 'tepa')

# ---------------- tashqi muhit ----------------
q = Q(); q.box(-80000, 100000, -80000, 100000, -6300, -6000, M['yer']); q.obj('yer', 'tashqi')
q = Q(); q.box(-3500, I['x'] + 3500, -3500, I['y'] + 3500, -320, -260, M['taglik']); q.obj('taglik', 'taglik')

# ---------------- kameralar va render ----------------
kam = bu.kamera
K1y = (X['K1']['y1'] + X['K1']['y2']) / 2; K2y = (X['K2']['y1'] + X['K2']['y2']) / 2
KOR = {
    'umumiy': dict(cam=kam('kamera_umumiy', (-6500, 41000, 36000), (12300, 11800, -500), 35), res=(2400, 1700), ichki=False, quyosh=(125, 55, 3.2)),
    'k1': dict(cam=kam('kamera_K1', (6150, K1y + 150, 1600), (KX, K1y - 60, 1450), 24), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'k2': dict(cam=kam('kamera_K2', (6150, K2y - 150, 1600), (KX, K2y + 60, 1450), 24), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'logo': dict(cam=kam('kamera_logo', (KX - 3900, K2y + 420, 1600), (KX, K2y - 100, 1650), 22), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'doskalar': dict(cam=kam('kamera_doskalar', (5300, 10600, 1600), (2100, 6500, 1350), 22), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'sotuv': dict(cam=kam('kamera_sotuv', (11250, 14850, 1650), (7300, 12500, 1250), 17), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'admin': dict(cam=kam('kamera_admin', (12650, 14850, 1650), (16900, 12450, 1250), 17), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'sinf': dict(cam=kam('kamera_sinf', (12450, 5600, 1650), (17950, 3700, 1300), 19), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'kw': dict(cam=kam('kamera_koworking', (5350, 17500, 1700), (1300, 8800, 1000), 18), res=(1920, 1080), ichki=True, quyosh=(165, 30, 3.0)),
    'sahna': dict(cam=kam('kamera_sahna', (300, 14300, 1650), (5850, 12100, 1550), 19), res=(1920, 1080), ichki=True, quyosh=(165, 30, 3.0)),
    'tomoshabin': dict(cam=kam('kamera_tomoshabin', (250, 12200, 1650), (5850, 12200, 1650), 24), res=(1920, 1080), ichki=True, quyosh=(165, 30, 3.0),
                       korsat=('kw_tadbir',), yashir=('kw_kundalik',)),
    # 17.10: 4-xona (doska eshik tomonida, g'arbiy devorda) va suriladigan eshik xona ichidan (6-xona, yarim ochiq)
    'sr4': dict(cam=kam('kamera_SR4', (23700, 13950, 1650), (18250, 11700, 1250), 17), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'eshik_ichki': dict(cam=kam('kamera_eshik_ichki', (15900, 20300, 1600), (12900, 16700, 1150), 20), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'kirish': dict(cam=kam('kamera_kirish', (5300, 15900, 1650), (1700, 19700, 450), 19), res=(1920, 1080), ichki=True, quyosh=(165, 30, 3.0)),
    # koridor shisha devorlari — founder tasdig'i uchun (15.10): qiya ko'rinishlar, eshik yaqindan, tepadan
    'k1_chap': dict(cam=kam('kamera_K1_chap', (7300, 9100, 1600), (12600, 7750, 1300), 20), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'k1_ong': dict(cam=kam('kamera_K1_ong', (7300, 8000, 1600), (12600, 9350, 1300), 20), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'k1_eshik': dict(cam=kam('kamera_K1_eshik', (16550, 9250, 1500), (17300, 7750, 1150), 20), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'k2_chap': dict(cam=kam('kamera_K2_chap', (7300, 16450, 1600), (12600, 15050, 1300), 20), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'k2_ong': dict(cam=kam('kamera_K2_ong', (7300, 15250, 1600), (12600, 16650, 1300), 20), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'k2_eshik': dict(cam=kam('kamera_K2_eshik', (12050, 15150, 1500), (12800, 16650, 1150), 20), res=(1920, 1080), ichki=True, quyosh=(80, 35, 3.0)),
    'tepa1': dict(cam=kam('kamera_tepa1', (800, 12200, 9500), (13500, 12200, 0), 26), res=(1920, 1200), ichki=False, quyosh=(125, 55, 3.2)),
    'tepa2': dict(cam=kam('kamera_tepa2', (25200, 12200, 9500), (11500, 12200, 0), 26), res=(1920, 1200), ichki=False, quyosh=(125, 55, 3.2)),
}
FAYL = {'umumiy': '1-umumiy', 'k1': '2-koridor-K1', 'k2': '3-koridor-K2', 'logo': '4-koridor-logotip', 'doskalar': '5-koridor-doskalar',
        'sotuv': '6-sotuv-xonasi', 'admin': '7-admin-xonasi', 'sinf': '8-sinf-doska', 'kw': '9-koworking', 'sahna': '10-koworking-sahna',
        'tomoshabin': '11-sahna-tomoshabin', 'sr4': '12-4-xona-doska', 'eshik_ichki': '13-suriladigan-eshik-ichkaridan', 'kirish': '14-kirish-zina',
        'k1_chap': '15-K1-chap-devor', 'k1_ong': '16-K1-ong-devor', 'k1_eshik': '17-K1-eshik', 'k2_chap': '18-K2-chap-devor',
        'k2_ong': '19-K2-ong-devor', 'k2_eshik': '20-K2-eshik', 'tepa1': '21-koridorlar-tepadan-1', 'tepa2': '22-koridorlar-tepadan-2'}
bu.render_sozla(A['tez'])
os.makedirs(A['chiq'], exist_ok=True)
BELGI = {k: (*mk(X[k]), 0) for k in ('SR1', 'SR2', 'SR3', 'SR4', 'SR5', 'SR6', 'SR7', 'XZ1', 'XZ2', 'XZ3', 'XZ4', 'KW', 'X12')}
BELGI['K1'] = (9000, 8550, 0); BELGI['K2'] = (14000, 15850, 0)
BELGI['ZN1'] = (1500, 3000, 0); BELGI['ZL'] = (4800, 19800, 0)
bu.belgilar(KOR['umumiy']['cam'], KOR['umumiy']['res'], BELGI, os.path.join(A['chiq'], 'umumiy-belgilar-2.json'))
bu.renderla(KOR, A['chiq'], 'Xadra_2-qavat_3D' + ('_B' if VARIANT == 'B' else '') + ('' if LOGOLI else '_logosiz'), FAYL, A['tez'], A['faqat'], namuna=(48, 40))
if VARIANT == 'B' or not LOGOLI: sys.exit(0)      # B va logosiz — faqat renderlar; asosiy .blend A, logoli variant bilan qoladi
bu.saqla(A['chiq'], 'Xadra_2-qavat.blend', KOR['k1']['cam'], tez=A['tez'], blend=A['blend'])
