# 3-qavat — Blender sahnasi va renderlar (Cycles).
# Ishlatish:
#   node blender3-malumot.mjs > 3qavat.json
#   python blender3.py 3qavat.json ../chizma/3d [--tez] [--faqat umumiy,sinf,wc1,wc2]
# (bpy moduli kerak: pip install bpy==4.2.0 — Python 3.11; yoki: blender -b -P blender3.py -- 3qavat.json ../chizma/3d)
# Koordinatalar JSON'da rejadagidek: mm, x — o'ngga, y — pastga (janubga). Blenderda X = x, Y = −y, Z — yuqoriga.
import bpy, bmesh, json, math, os, sys
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
JSON, CHIQ = argv[0], argv[1]
TEZ = '--tez' in argv
FAQAT = argv[argv.index('--faqat') + 1].split(',') if '--faqat' in argv else None
D = json.load(open(JSON))

H = 3500          # poldan shiftgacha (buyurtmachi: bino balandligi 3.5 m)
KESIM = 2700      # umumiy ko'rinishda devorlar shu balandlikda kesiladi
SILL, HEAD = 900, 2600   # deraza: tokcha va tepa (taxmin)
ESH_H = 2100      # eshik balandligi
BAMBUK_H = 2500   # 5-xonada bambuk panel balandligi (buyurtmachi)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.unit_settings.system = 'METRIC'

def P(x, y, z=0):
    return Vector((x / 1000, -y / 1000, z / 1000))

# ---------------- materiallar ----------------
def lin(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c] + [1]

def yangi_mat(nom):
    m = bpy.data.materials.new(nom)
    m.use_nodes = True
    return m, m.node_tree.nodes, m.node_tree.links, m.node_tree.nodes['Principled BSDF']

def mat(nom, rang, rough=0.5, metal=0.0, coat=0.0, emit=0.0, emit_rang=None, spec=0.5):
    m, n, l, b = yangi_mat(nom)
    b.inputs['Base Color'].default_value = lin(rang)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    b.inputs['Specular IOR Level'].default_value = spec
    if coat:
        b.inputs['Coat Weight'].default_value = coat
        b.inputs['Coat Roughness'].default_value = 0.05
    if emit:
        b.inputs['Emission Color'].default_value = lin(emit_rang or rang)
        b.inputs['Emission Strength'].default_value = emit
    m.diffuse_color = lin(rang)
    return m

def shisha(nom, rough=0.0, rang='#eef6f8'):
    # soya va diffuz nurlar uchun shaffof: derazadan quyosh nuri shovqinsiz o'tadi
    m, n, l, b = yangi_mat(nom)
    b.inputs['Base Color'].default_value = lin(rang)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Transmission Weight'].default_value = 1.0
    b.inputs['IOR'].default_value = 1.45
    lp = n.new('ShaderNodeLightPath')
    mx = n.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'
    l.new(lp.outputs['Is Shadow Ray'], mx.inputs[0]); l.new(lp.outputs['Is Diffuse Ray'], mx.inputs[1])
    tr = n.new('ShaderNodeBsdfTransparent')
    tr.inputs['Color'].default_value = lin('#f2f7f8') if rough < 0.1 else lin('#d7dde0')
    mix = n.new('ShaderNodeMixShader')
    out = n['Material Output']
    l.new(mx.outputs[0], mix.inputs['Fac']); l.new(b.outputs['BSDF'], mix.inputs[1]); l.new(tr.outputs['BSDF'], mix.inputs[2])
    l.new(mix.outputs['Shader'], out.inputs['Surface'])
    m.diffuse_color = (0.8, 0.9, 0.95, 0.3)
    return m

def gisht(nom, oq, c1, c2, choc, en, boy, siljish, choc_en, rough=0.5, coat=0.0, shovqin=0.0, bump=0.3, tolqin=0.0):
    """Plitka / parket / bambuk: Brick Texture. oq — tekislik o'qlari: 'xy', 'xz', 'yz' (obyekt koordinatasi = dunyo)."""
    m, n, l, b = yangi_mat(nom)
    tc = n.new('ShaderNodeTexCoord'); sp = n.new('ShaderNodeSeparateXYZ'); cb = n.new('ShaderNodeCombineXYZ')
    l.new(tc.outputs['Object'], sp.inputs[0])
    o = {'x': 'X', 'y': 'Y', 'z': 'Z'}
    l.new(sp.outputs[o[oq[0]]], cb.inputs[0]); l.new(sp.outputs[o[oq[1]]], cb.inputs[1])
    br = n.new('ShaderNodeTexBrick')
    br.offset = siljish; br.offset_frequency = 2; br.squash = 1.0
    br.inputs['Color1'].default_value = lin(c1); br.inputs['Color2'].default_value = lin(c2)
    br.inputs['Mortar'].default_value = lin(choc)
    br.inputs['Scale'].default_value = 1.0
    br.inputs['Mortar Size'].default_value = choc_en
    br.inputs['Mortar Smooth'].default_value = 0.2
    br.inputs['Bias'].default_value = 0.0
    br.inputs['Brick Width'].default_value = en
    br.inputs['Row Height'].default_value = boy
    l.new(cb.outputs[0], br.inputs['Vector'])
    rang = br.outputs['Color']
    if shovqin or tolqin:
        ns = n.new('ShaderNodeTexNoise'); ns.inputs['Scale'].default_value = 3.0; ns.inputs['Detail'].default_value = 6
        l.new(cb.outputs[0], ns.inputs['Vector'])
        src = ns.outputs['Fac']
        if tolqin:
            # yog'och tolasi: plitka bo'ylab cho'zilgan shovqin
            mp = n.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (tolqin, 40.0, 1.0)
            l.new(cb.outputs[0], mp.inputs['Vector'])
            wv = n.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'Y'
            wv.inputs['Scale'].default_value = 1.0; wv.inputs['Distortion'].default_value = 8.0; wv.inputs['Detail'].default_value = 4
            l.new(mp.outputs[0], wv.inputs['Vector'])
            src = wv.outputs['Fac']
        mr = n.new('ShaderNodeMapRange')
        mr.inputs['To Min'].default_value = 1 - (shovqin or 0.12); mr.inputs['To Max'].default_value = 1.0
        l.new(src, mr.inputs['Value'])
        mul = n.new('ShaderNodeMixRGB'); mul.blend_type = 'MULTIPLY'
        mul.inputs['Fac'].default_value = 1.0
        l.new(rang, mul.inputs['Color1']); l.new(mr.outputs['Result'], mul.inputs['Color2'])
        rang = mul.outputs['Color']
    l.new(rang, b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    if coat:
        b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = 0.08
    if bump:
        bp = n.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump; bp.inputs['Distance'].default_value = 0.002
        inv = n.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0
        l.new(br.outputs['Fac'], inv.inputs[1]); l.new(inv.outputs[0], bp.inputs['Height'])
        l.new(bp.outputs['Normal'], b.inputs['Normal'])
    m.diffuse_color = lin(c1)
    return m

M = dict(
    devor=mat('devor', '#ebe8e3', 0.85),
    qopqoq=mat('devor_kesim', '#2f3236', 0.9),
    shift=mat('shift', '#f4f4f2', 0.9),
    beton=mat('beton', '#a7a49f', 0.9),
    yopiq_pol=mat('yopiq_pol', '#bdb9b2', 0.9),
    zina=mat('zina_tosh', '#d3d0cb', 0.45),
    oyna=shisha('oyna'),
    xira=shisha('xira_oyna', 0.35),
    ramka=mat('pvx_ramka', '#f6f6f4', 0.35),
    alyuminiy=mat('alyuminiy', '#4a4e54', 0.35, 0.8),
    xrom=mat('xrom', '#e6e8ea', 0.08, 1.0),
    polat=mat('zanglamas_polat', '#c9ccce', 0.28, 1.0),
    keramika=mat('keramika', '#fbfbfa', 0.06, coat=0.6),
    teshik=mat('teshik', '#2a2d30', 0.6),
    qora_metall=mat('qora_metall', '#25272a', 0.4, 0.6),
    parta=gisht('parta_yogoch', 'xy', '#d6b083', '#cfa877', '#cda673', 0.9, 0.5, 0.5, 0.0, 0.45, shovqin=0.1, bump=0, tolqin=0.6),
    stul=mat('stul_plastik', '#2e3a4b', 0.45),
    hpl=mat('kabina_hpl', '#6f7882', 0.4),
    eshik_yogoch=mat('eshik_yogoch', '#7a5636', 0.5),
    eshik_oq=mat('eshik_oq', '#eeeeec', 0.4),
    doska_oq=mat('doska_oq', '#fbfbfb', 0.12, coat=0.4),
    ramka_doska=mat('doska_ramka', '#b9bec4', 0.3, 0.9),
    ekran=mat('ekran', '#0f2a4a', 0.15, emit=0.9, emit_rang='#16406e'),
    ekran_matn=mat('ekran_matn', '#ffffff', 0.5, emit=6.0),
    ekran_aksent=mat('ekran_aksent', '#2fb36f', 0.5, emit=5.0),
    korpus=mat('korpus_qora', '#16181b', 0.3),
    kozgu=mat('kozgu', '#e9ecee', 0.02, 1.0),
    led=mat('led_panel', '#ffffff', 0.5, emit=6.0, emit_rang='#fff6ea'),
    kond=mat('konditsioner', '#f3f3f1', 0.3),
    mato=mat('mato_qora', '#202226', 0.8),
    noutbuk=mat('noutbuk', '#9aa0a6', 0.3, 0.8),
    yer=mat('yer', '#9aa58b', 0.9),
    taglik=mat('taglik', '#e3e1dc', 0.9),
    pol_parket=gisht('pol_parket', 'yx', '#c8a273', '#b98f5f', '#8a6a46', 1.2, 0.16, 0.5, 0.0012, 0.4, shovqin=0.15, bump=0.4, tolqin=0.8),
    pol_plitka=gisht('pol_plitka', 'xy', '#d9d5ce', '#d1ccc4', '#b0aba3', 0.6, 0.6, 0.0, 0.002, 0.35, shovqin=0.05),
    wc_pol=gisht('wc_pol', 'xy', '#9fa4a9', '#989da2', '#7d8287', 0.6, 0.6, 0.0, 0.002, 0.3, shovqin=0.06),
)
for o in ('x', 'y'):
    M['kafel_' + o] = gisht('wc_kafel_' + o, o + 'z', '#f2f2ef', '#ecece8', '#cfcfca', 0.6, 0.3, 0.0, 0.0015, 0.12, coat=0.5, bump=0.5)
    M['bambuk_' + o] = gisht('bambuk_' + o, o + 'z', '#c99b5c', '#b88a4b', '#6f5230', 0.045, 0.62, 0.5, 0.0018, 0.45, shovqin=0.12, bump=0.6)
    M['kafel_past_' + o] = gisht('kafel_past_' + o, o + 'z', '#f2f2ef', '#ecece8', '#cfcfca', 0.6, 0.3, 0.0, 0.0015, 0.12, coat=0.5, bump=0.5)

# ---------------- kolleksiyalar ----------------
def kol(nom):
    c = bpy.data.collections.new(nom); sc.collection.children.link(c); return c
K = dict(asos=kol('asos'), toliq=kol('devor_toliq'), kesim=kol('devor_kesim'), tepa=kol('tepa'),
         chiroq=kol('chiroqlar'), tashqi=kol('tashqi'), taglik=kol('taglik'), vaqtincha=kol('vaqtincha'))

# ---------------- mesh yig'uvchi ----------------
class Q:
    def __init__(s):
        s.bm = bmesh.new(); s.mats = []
    def mi(s, m):
        if m not in s.mats: s.mats.append(m)
        return s.mats.index(m)
    def box(s, x1, x2, y1, y2, z1, z2, m, bevel=0, seg=2, top=None):
        if x2 - x1 <= 0.01 or y2 - y1 <= 0.01 or z2 - z1 <= 0.01: return
        r = bmesh.ops.create_cube(s.bm, size=1)
        vs = r['verts']
        c = P((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2)
        for v in vs:
            v.co = Vector((c.x + v.co.x * (x2 - x1) / 1000, c.y + v.co.y * (y2 - y1) / 1000, c.z + v.co.z * (z2 - z1) / 1000))
        fs = {f for v in vs for f in v.link_faces}
        for f in fs:
            f.material_index = s.mi(top) if (top is not None and f.normal.z > 0.9) else s.mi(m)
        if bevel:
            es = list({e for v in vs for e in v.link_edges})
            bmesh.ops.bevel(s.bm, geom=vs + es, offset=bevel / 1000, segments=seg, affect='EDGES', profile=0.5, clamp_overlap=True)
    def cyl(s, a, b, r, m, seg=16, smooth=True):
        a, b = P(*a), P(*b)
        d = b - a
        mat_ = Matrix.Translation((a + b) / 2) @ d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        res = bmesh.ops.create_cone(s.bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r / 1000, radius2=r / 1000, depth=d.length, matrix=mat_)
        for f in {f for v in res['verts'] for f in v.link_faces}:
            f.material_index = s.mi(m); f.smooth = smooth and len(f.verts) == 4
    def shar(s, cx, cy, cz, rx, ry, rz, m, seg=32):
        res = bmesh.ops.create_uvsphere(s.bm, u_segments=seg, v_segments=seg // 2, radius=1.0)
        c = P(cx, cy, cz)
        for v in res['verts']:
            v.co = Vector((c.x + v.co.x * rx / 1000, c.y + v.co.y * ry / 1000, c.z + v.co.z * rz / 1000))
        for f in {f for v in res['verts'] for f in v.link_faces}:
            f.material_index = s.mi(m); f.smooth = True
    def obj(s, nom, k, loc=(0, 0, 0), rot=0.0):
        me = bpy.data.meshes.new(nom)
        s.bm.normal_update(); s.bm.to_mesh(me); s.bm.free()
        for m in s.mats: me.materials.append(m)
        return joyla(me, nom, k, loc, rot)

def joyla(me, nom, k, loc=(0, 0, 0), rot=0.0):
    """rot — rejadagi burchak (gradus, rejada soat strelkasi bo'yicha, chunki y pastga)."""
    ob = bpy.data.objects.new(nom, me); K[k].objects.link(ob)
    ob.location = P(*loc); ob.rotation_euler.z = -math.radians(rot)
    return ob

def ayir(ob, *kesuvchilar):
    """Boolean ayirish: ob dan kesuvchi(lar)ni ayiradi va natijani mesh sifatida saqlaydi."""
    for i, c in enumerate(kesuvchilar):
        md = ob.modifiers.new(f'ayir{i}', 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.solver = 'EXACT'; md.object = c
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    eski = ob.data
    ob.modifiers.clear(); ob.data = me
    bpy.data.meshes.remove(eski)
    for c in kesuvchilar:
        cm = c.data; bpy.data.objects.remove(c); bpy.data.meshes.remove(cm)
    for p in ob.data.polygons: p.use_smooth = True
    return ob

def kesuvchi_shar(cx, cy, cz, rx, ry, rz):
    q = Q(); q.shar(cx, cy, cz, rx, ry, rz, M['keramika'], 48); return q.obj('kesuvchi', 'vaqtincha')

def kesuvchi_quti(*a):
    q = Q(); q.box(*a, M['keramika']); return q.obj('kesuvchi', 'vaqtincha')

def tesik(r, teshiklar):
    """To'rtburchakdan teshiklarni ayirib, qolgan to'rtburchaklar ro'yxati (x1, x2, y1, y2)."""
    x1, x2, y1, y2 = r
    xs = sorted({x1, x2, *[min(max(t[0], x1), x2) for t in teshiklar], *[min(max(t[1], x1), x2) for t in teshiklar]})
    ys = sorted({y1, y2, *[min(max(t[2], y1), y2) for t in teshiklar], *[min(max(t[3], y1), y2) for t in teshiklar]})
    out = []
    for i in range(len(xs) - 1):
        for j in range(len(ys) - 1):
            a, b, c, d = xs[i], xs[i + 1], ys[j], ys[j + 1]
            if b - a < 1 or d - c < 1: continue
            mx, my = (a + b) / 2, (c + d) / 2
            if any(t[0] <= mx <= t[1] and t[2] <= my <= t[3] for t in teshiklar): continue
            out.append((a, b, c, d))
    return out

# ---------------- pollar ----------------
WC_X = D['wc']
CHASH = [(x - 225, x + 225, y - 300, y + 300) for x, y in WC_X['chashagen']]
QUDUQ = (300, 2900, 1400, 6050)      # zinapoya quduq'i (pastga ochiq)
B = D['bino']
q = Q()
for r in tesik((0, B['L'], 0, B['B']), [QUDUQ, *CHASH]):
    q.box(*r, -250, 0, M['beton'])
q.obj('plita', 'asos')
POL = {'sinf': M['pol_parket'], 'koridor': M['pol_plitka'], 'wc': M['wc_pol'], 'yopiq': M['yopiq_pol'], 'zina': M['zina']}
for x in D['xonalar']:
    q = Q()
    for b in x['bolaklar']:
        r = (b['x1'], b['x2'], b['y1'], b['y2'])
        tesh = CHASH if x['tur'] == 'wc' else [QUDUQ] if x['tur'] == 'zina' else []
        for rr in tesik(r, tesh):
            q.box(*rr, 0, 10, POL[x['tur']])
    q.obj(f"pol_{x['kod']}", 'asos')

# ---------------- devorlar ----------------
DERAZALAR = D['derazalar']
def devor_bolaklar(h):
    out = []
    for w in D['devorlar']:
        boyY = (w['y2'] - w['y1']) > (w['x2'] - w['x1'])
        a0, a1 = (w['y1'], w['y2']) if boyY else (w['x1'], w['x2'])
        ich = sorted((d['y1'], d['y2']) if boyY else (d['x1'], d['x2']) for d in DERAZALAR
                     if d['x1'] >= w['x1'] and d['x2'] <= w['x2'] and d['y1'] >= w['y1'] and d['y2'] <= w['y2'])
        seg, pos = [], a0
        for oa, ob in ich:
            seg += [(pos, oa, 0, h), (oa, ob, 0, SILL), (oa, ob, HEAD, h)]; pos = ob
        seg.append((pos, a1, 0, h))
        for sa, sb, z1, z2 in seg:
            rect = (w['x1'], w['x2'], sa, sb) if boyY else (sa, sb, w['y1'], w['y2'])
            out.append((*rect, z1, z2))
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
def qoplama(q, oq, koord, ichkari, a1, a2, z1, z2, teshik, m, t):
    """oq='h' — y=koord dagi yuz (x bo'ylab); 'v' — x=koord dagi yuz (y bo'ylab). ichkari: +1/−1 xona tomoni."""
    nuq = sorted({a1, a2, *[min(max(v, a1), a2) for o in teshik for v in o[:2]]})
    for p, r in zip(nuq, nuq[1:]):
        if r - p < 1: continue
        zl = [(z1, z2)]
        for oa, ob, oz1, oz2 in teshik:
            if oa <= p and ob >= r:
                yangi = []
                for za, zb in zl:
                    if oz2 <= za or oz1 >= zb: yangi.append((za, zb)); continue
                    if oz1 > za: yangi.append((za, oz1))
                    if oz2 < zb: yangi.append((oz2, zb))
                zl = yangi
        c1, c2 = sorted((koord, koord + ichkari * t))
        for za, zb in zl:
            if oq == 'h': q.box(p, r, c1, c2, za, zb, m)
            else: q.box(c1, c2, p, r, za, zb, m)

def esh(kod): return next(e for e in D['eshiklar'] if e['kod'] == kod)

WC = next(x for x in D['xonalar'] if x['kod'] == '2')['bolaklar'][0]
SN = next(x for x in D['xonalar'] if x['kod'] == '5')['bolaklar'][0]
e2, e5 = esh('2'), esh('5')
wc_der = [d for d in DERAZALAR if d['y1'] < WC['y2'] and d['y2'] > WC['y1']]
for h, k in ((H, 'toliq'), (KESIM, 'kesim')):
    q = Q()
    qoplama(q, 'h', WC['y1'], +1, WC['x1'], WC['x2'], 0, h, [], M['kafel_x'], 8)
    qoplama(q, 'h', WC['y2'], -1, WC['x1'], WC['x2'], 0, h, [], M['kafel_x'], 8)
    qoplama(q, 'v', WC['x1'], +1, WC['y1'], WC['y2'], 0, h, [(e2['a'], e2['b'], 0, ESH_H)], M['kafel_y'], 8)
    qoplama(q, 'v', WC['x2'], -1, WC['y1'], WC['y2'], 0, h, [(d['y1'], d['y2'], SILL, HEAD) for d in wc_der], M['kafel_y'], 8)
    q.obj(f'kafel_{k}', k)
q = Q()
qoplama(q, 'h', SN['y1'], +1, SN['x1'], SN['x2'], 0, BAMBUK_H, [], M['bambuk_x'], 12)
qoplama(q, 'h', SN['y2'], -1, SN['x1'], SN['x2'], 0, BAMBUK_H, [], M['bambuk_x'], 12)
qoplama(q, 'v', SN['x1'], +1, SN['y1'], SN['y2'], 0, BAMBUK_H, [(e5['a'], e5['b'], 0, ESH_H)], M['bambuk_y'], 12)
# bambuk panel yuqori qirrasi — alyuminiy profil
for oq, k_, ich, a1, a2 in (('h', SN['y1'], 1, SN['x1'], SN['x2']), ('h', SN['y2'], -1, SN['x1'], SN['x2']), ('v', SN['x1'], 1, SN['y1'], SN['y2'])):
    qoplama(q, oq, k_, ich, a1, a2, BAMBUK_H, BAMBUK_H + 20, [], M['alyuminiy'], 16)
q.obj('bambuk_panel', 'asos')

# ---------------- derazalar ----------------
q = Q()
for d in DERAZALAR:
    y1, y2 = d['y1'], d['y2']
    xc = (d['x1'] + d['x2']) / 2
    gl = M['xira'] if (y1 < WC['y2']) else M['oyna']
    f, t = 60, 35
    q.box(xc - t, xc + t, y1, y1 + f, SILL, HEAD, M['ramka']); q.box(xc - t, xc + t, y2 - f, y2, SILL, HEAD, M['ramka'])
    q.box(xc - t, xc + t, y1, y2, SILL, SILL + f, M['ramka']); q.box(xc - t, xc + t, y1, y2, HEAD - f, HEAD, M['ramka'])
    ym = (y1 + y2) / 2
    q.box(xc - t, xc + t, ym - 35, ym + 35, SILL, HEAD, M['ramka'])
    for a, b in ((y1 + f, ym - 35), (ym + 35, y2 - f)):
        q.box(xc - 6, xc + 6, a, b, SILL + f, HEAD - f, gl)
    q.box(d['x1'] - 45, xc - t, y1 - 30, y2 + 30, SILL - 20, SILL, M['ramka'])   # ichki tokcha
q.obj('derazalar', 'asos')

# ---------------- eshiklar ----------------
def barg_burchak(e, theta):
    phi0 = {('v', 'a'): 90, ('v', 'b'): -90, ('h', 'a'): 0, ('h', 'b'): 180}[(e['devor'], e['ilgak'])]
    target = (e['yon'], 0) if e['devor'] == 'v' else (0, e['yon'])
    for s in (1, -1):
        p = math.radians(phi0 + s * 90)
        if abs(math.cos(p) - target[0]) < 1e-6 and abs(math.sin(p) - target[1]) < 1e-6:
            return phi0 + s * theta

def eshik(e, theta=0.0):
    kab = e.get('kabina')
    rama = 0 if kab else 40
    en = e['en'] - 2 * rama
    tq = 30 if kab else 40
    z1, z2 = (150, 2000) if kab else (0, ESH_H - rama)
    hinge_a = e['a'] + rama if e['ilgak'] == 'a' else e['b'] - rama
    hx, hy = (e['yuz'] - e['yon'] * tq / 2, hinge_a) if e['devor'] == 'v' else (hinge_a, e['yuz'] - e['yon'] * tq / 2)
    q = Q()
    if kab:
        q.box(0, en, -tq / 2, tq / 2, z1, z2, M['hpl'])
        q.box(en - 60, en - 20, tq / 2, tq / 2 + 25, 950, 1000, M['xrom'])
        q.box(en - 60, en - 20, -tq / 2 - 25, -tq / 2, 950, 1000, M['xrom'])
        for z in (300, 1800):
            q.box(-10, 30, -tq / 2 - 3, tq / 2 + 3, z, z + 120, M['xrom'])
    elif e.get('shisha'):
        a = M['alyuminiy']
        q.box(0, 60, -20, 20, z1, z2, a); q.box(en - 60, en, -20, 20, z1, z2, a)
        q.box(0, en, -20, 20, z1, z1 + 110, a); q.box(0, en, -20, 20, z2 - 60, z2, a)
        for za, zb, gm in ((z1 + 110, 1000, M['oyna']), (1000, 1600, M['xira']), (1600, z2 - 60, M['oyna'])):
            q.box(60, en - 60, -5, 5, za, zb, gm)
        for s in (1, -1):
            q.cyl((en - 110, s * 60, 750), (en - 110, s * 60, 1450), 14, M['xrom'])
            for z in (800, 1400): q.cyl((en - 110, s * 20, z), (en - 110, s * 60, z), 8, M['xrom'])
    else:
        mm = M['eshik_yogoch']
        q.box(0, en, -tq / 2, tq / 2, z1, z2, mm, bevel=3)
        for s in (1, -1):
            q.box(en - 180, en - 60, s * tq / 2, s * (tq / 2 + 8), 1000, 1030, M['xrom'])
            q.box(en - 90, en - 60, s * tq / 2, s * (tq / 2 + 50), 1000, 1030, M['xrom'])
    ob = q.obj(f"eshik_{e['kod']}", 'asos', (hx, hy, 0), barg_burchak(e, theta))
    if not kab:   # eshik romi (devor qalinligi bo'ylab)
        t1, t2 = e['qalinlik']
        rm = M['alyuminiy'] if e.get('shisha') else M['eshik_yogoch']
        q = Q()
        if e['devor'] == 'v':
            q.box(t1, t2, e['a'], e['a'] + rama, 0, ESH_H, rm); q.box(t1, t2, e['b'] - rama, e['b'], 0, ESH_H, rm)
            q.box(t1, t2, e['a'], e['b'], ESH_H - rama, ESH_H, rm)
        else:
            q.box(e['a'], e['a'] + rama, t1, t2, 0, ESH_H, rm); q.box(e['b'] - rama, e['b'], t1, t2, 0, ESH_H, rm)
            q.box(e['a'], e['b'], t1, t2, ESH_H - rama, ESH_H, rm)
        q.obj(f"eshik_romi_{e['kod']}", 'asos')
    return ob

OCHIQ = {'K1': 92, 'K2': 92, 'K3': 40, 'K4': 0}
for e in D['eshiklar']:
    eshik(e, OCHIQ.get(e['kod'], 0))

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
def perila(a, b, qadam=120):
    """a, b — (x, y, z_pol) — perila ostidagi chiziq; 900 mm balandlik."""
    q.cyl((a[0], a[1], a[2] + 900), (b[0], b[1], b[2] + 900), 25, M['eshik_yogoch'])
    L = math.dist(a[:2], b[:2]); n = max(1, int(L // qadam))
    for i in range(n + 1):
        t = i / n
        x, y, z = (a[j] + (b[j] - a[j]) * t for j in range(3))
        q.cyl((x, y, z), (x, y, z + 900), 7 if i % 8 else 14, M['qora_metall'], 8)
perila((330, 1385, 0), (1690, 1385, 0))
perila((1690, 1385, 0), (1690, 4450, -1750))
q.obj('perila', 'asos')

# ---------------- 5-xona: jihozlar ----------------
def parta_mesh():
    q = Q(); w, d = 1400, 600
    q.box(-w / 2, w / 2, -d / 2, d / 2, 725, 750, M['parta'], bevel=3)
    for sx in (-1, 1):
        x = sx * (w / 2 - 50)
        for sy in (-1, 1):
            q.box(x - 20, x + 20, sy * (d / 2 - 60) - 20, sy * (d / 2 - 60) + 20, 0, 725, M['qora_metall'])
        q.box(x - 20, x + 20, -d / 2 + 40, d / 2 - 40, 680, 725, M['qora_metall'])
        q.box(x - 25, x + 25, -d / 2 + 30, d / 2 - 30, 0, 25, M['qora_metall'])
    q.box(-w / 2 + 70, w / 2 - 70, -d / 2 + 30, -d / 2 + 48, 380, 700, M['parta'])   # old panel (doska tomonda)
    me = bpy.data.meshes.new('parta'); q.bm.normal_update(); q.bm.to_mesh(me); q.bm.free()
    for m in q.mats: me.materials.append(m)
    return me

def stul_mesh():
    q = Q(); w, d = 380, 420
    q.box(-w / 2, w / 2, -d / 2, d / 2 - 20, 430, 455, M['stul'], bevel=8)
    q.box(-w / 2 + 5, w / 2 - 5, d / 2 - 30, d / 2 - 8, 560, 860, M['stul'], bevel=8)
    for sx in (-1, 1):
        for sy in (-1, 1):
            q.cyl((sx * (w / 2 - 30), sy * (d / 2 - 40), 0), (sx * (w / 2 - 30), sy * (d / 2 - 40), 435), 11, M['qora_metall'], 10)
        q.cyl((sx * (w / 2 - 30), d / 2 - 40, 430), (sx * (w / 2 - 30), d / 2 - 20, 700), 10, M['qora_metall'], 10)
    me = bpy.data.meshes.new('stul'); q.bm.normal_update(); q.bm.to_mesh(me); q.bm.free()
    for m in q.mats: me.materials.append(m)
    return me

pm, sm = parta_mesh(), stul_mesh()
markaz = lambda r: ((r['x1'] + r['x2']) / 2, (r['y1'] + r['y2']) / 2)
for i, p in enumerate(D['partalar']): joyla(pm, f'parta_{i + 1}', 'asos', markaz(p))
for i, s in enumerate(D['stullar']): joyla(sm, f'stul_{i + 1}', 'asos', markaz(s))

# interaktiv doska (markazda 86" panel) va ikki yonida oq doska
db = D['doska']; yd = SN['y1'] + 12
q = Q()
x1, x2 = db['x1'], db['x2']; xc = (x1 + x2) / 2
ek = 1960
q.box(x1, xc - ek / 2 - 10, yd, yd + 22, 950, 2100, M['ramka_doska'])
q.box(x1 + 15, xc - ek / 2 - 25, yd + 22, yd + 24, 965, 2085, M['doska_oq'])
q.box(xc + ek / 2 + 10, x2, yd, yd + 22, 950, 2100, M['ramka_doska'])
q.box(xc + ek / 2 + 25, x2 - 15, yd + 22, yd + 24, 965, 2085, M['doska_oq'])
q.box(xc - ek / 2, xc + ek / 2, yd, yd + 85, 940, 2110, M['korpus'], bevel=6)
q.box(xc - ek / 2 + 25, xc + ek / 2 - 25, yd + 85, yd + 87, 980, 2085, M['ekran'])
q.box(x1, x2, yd, yd + 70, 925, 945, M['ramka_doska'])     # marker tokchasi
q.obj('doska', 'asos')
def matn(body, x, y, z, olcham, m, nom):
    cu = bpy.data.curves.new(nom, 'FONT'); cu.body = body; cu.size = olcham / 1000; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    cu.extrude = 0.0005
    ob = bpy.data.objects.new(nom, cu); K['asos'].objects.link(ob)
    ob.location = P(x, y, z); ob.rotation_euler = (math.radians(90), 0, 0)
    ob.data.materials.append(m)
    return ob
ys = yd + 89
matn('PDP Academy', xc, ys, 1640, 190, M['ekran_matn'], 'ekran_sarlavha')
matn("Xadra filiali  ·  3-qavat, 5-xona", xc, ys, 1390, 70, M['ekran_matn'], 'ekran_izoh')
q = Q(); q.box(xc - 320, xc + 320, ys - 2, ys, 1270, 1282, M['ekran_aksent']); q.obj('ekran_chiziq', 'asos')

# ustoz stoli va kreslo
us = D['ustozStoli']
q = Q()
q.box(us['x1'], us['x2'], us['y1'], us['y2'], 725, 750, M['parta'], bevel=3)
for x in (us['x1'] + 20, us['x2'] - 45):
    q.box(x, x + 25, us['y1'] + 30, us['y2'] - 30, 0, 725, M['parta'])
q.box(us['x1'] + 45, us['x2'] - 45, us['y2'] - 45, us['y2'] - 25, 250, 725, M['parta'])   # old panel (o'quvchilar tomonda)
cx, cy = markaz(us)
q.box(cx - 170, cx + 170, cy - 120, cy + 110, 750, 765, M['noutbuk'], bevel=2)   # noutbuk: ekrani ustozga (shimolga) qaragan
q.box(cx - 170, cx + 170, cy + 110, cy + 122, 765, 990, M['noutbuk'])
q.box(cx - 155, cx + 155, cy + 108, cy + 110, 780, 975, M['ekran'])
q.obj('ustoz_stoli', 'asos')
uk = D['ustozStuli']; kx, ky = markaz(uk)
q = Q()
for i in range(5):
    a = math.radians(90 + i * 72)
    q.cyl((0, 0, 60), (300 * math.cos(a), 300 * math.sin(a), 40), 15, M['mato'], 8)
    q.shar(300 * math.cos(a), 300 * math.sin(a), 25, 25, 25, 25, M['mato'], 12)
q.cyl((0, 0, 50), (0, 0, 420), 25, M['xrom'])
q.box(-240, 240, -230, 240, 420, 490, M['mato'], bevel=25, seg=3)
q.box(-220, 220, -275, -235, 560, 1050, M['mato'], bevel=20, seg=3)   # suyanchiq ustoz stoli tomonga emas — doska tomonda
q.box(-25, 25, -260, -230, 470, 580, M['mato'])
q.obj('ustoz_kreslosi', 'asos', (kx, ky), 0)

# konditsioner (orqa devorda) — umumiy ko'rinishda yashiriladi
q = Q()
q.box(8825 - 480, 8825 + 480, SN['y2'] - 12 - 230, SN['y2'] - 12, 2850, 3160, M['kond'], bevel=25, seg=3)
q.box(8825 - 420, 8825 + 420, SN['y2'] - 12 - 236, SN['y2'] - 12 - 228, 2880, 2905, M['korpus'])
q.obj('konditsioner', 'tepa')

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
    ayir(ob, kesuvchi_shar(x, yw + 240, 860, 215, 165, 120))
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
    ayir(ob, kesuvchi_shar(x, y - 40, 20, 120, 230, 140))
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
q = Q()
for x1_, x2_, y1_, y2_ in ((tx['x1'], tx['x2'], tx['y1'], tx['y2']),):
    q.box(x1_, x2_, y1_, y2_ - 8, 0, 330, M['kafel_x'])
q.obj('taxorat_supa', 'asos')
q = Q(); q.box(tx['x1'] + 30, tx['x2'] - 30, tx['y1'] + 20, tx['y2'] - 30, 330, 430, M['polat'], bevel=10)
ob = q.obj('taxorat_novi', 'asos')
ayir(ob, kesuvchi_quti(tx['x1'] + 70, tx['x2'] - 70, tx['y1'] + 60, tx['y2'] - 70, 360, 500))
q = Q()
for x, y in WC_X['taxoratJomrak']:
    yf = WC['y2'] - 8
    q.cyl((x, yf, 850), (x, yf - 50, 850), 30, M['xrom'])
    q.cyl((x, yf - 40, 850), (x, yf - 180, 830), 13, M['xrom'])
    q.cyl((x, yf - 180, 830), (x, yf - 180, 800), 13, M['xrom'])
    q.cyl((x, yf - 60, 850), (x, yf - 60, 920), 9, M['xrom'])
    q.box(x - 70, x + 70, yf - 130, yf, 1050, 1062, M['keramika'], bevel=3)    # sovun tokchasi
q.cyl((WC_X['taxorat']['x1'] + 200, WC['y2'] - 160, 358), (WC_X['taxorat']['x1'] + 200, WC['y2'] - 160, 364), 30, M['teshik'])
tx_, ty_ = WC_X['trap']
q.box(tx_ - 75, tx_ + 75, ty_ - 75, ty_ + 75, 10, 13, M['polat'])
q.obj('taxorat_jomraklar', 'asos')

# ---------------- shift, chiroqlar ----------------
q = Q(); q.box(0, B['L'], 0, B['B'], H, H + 200, M['shift']); q.obj('shift', 'tepa')
LED = []
for i in (1, 3):
    for j in (1, 3, 5):
        LED.append((SN['x1'] + SN['x2'] * 0 + (SN['x2'] - SN['x1']) * i / 4, SN['y1'] + (SN['y2'] - SN['y1']) * j / 6, 600, 600))
for x in (6900, 9300):
    LED.append((x, 2075, 600, 600))
LED += [(4375, 2500, 600, 600), (4375, 5500, 600, 600), (5000, 7600, 600, 600)]
KAB_LED = [(KB['x0'] + i * KB['en'] + 500, 800, 180, 180) for i in range(KB['soni'])]
q = Q()
for x, y, a, b in LED + KAB_LED:
    q.box(x - a / 2, x + a / 2, y - b / 2, y + b / 2, H - 12, H, M['led'])
    q.box(x - a / 2 - 10, x + a / 2 + 10, y - b / 2 - 10, y + b / 2 + 10, H - 6, H - 0.5, M['ramka'])
q.box(9000, 9250, 1100, 1350, H - 10, H, M['alyuminiy'])    # hojatxona so'rg'ich panjarasi
q.obj('chiroqlar_paneli', 'tepa')
for i, (x, y, a, b) in enumerate(LED + KAB_LED):
    L = bpy.data.lights.new(f'led_{i}', 'AREA'); L.shape = 'RECTANGLE'; L.size = a / 1000; L.size_y = b / 1000
    L.energy = 55 if a > 300 else 9
    L.color = (1.0, 0.96, 0.9)
    ob = bpy.data.objects.new(f'led_{i}', L); K['chiroq'].objects.link(ob)
    ob.visible_camera = False; ob.visible_glossy = False
    ob.location = P(x, y, H - 15)

# ---------------- tashqi muhit ----------------
q = Q(); q.box(-60000, 70000, -60000, 70000, -9300, -9000, M['yer']); q.obj('yer', 'tashqi')
q = Q(); q.box(-2500, B['L'] + 2500, -2500, B['B'] + 2500, -320, -260, M['taglik']); q.obj('taglik', 'taglik')

w = bpy.data.worlds.new('osmon'); sc.world = w; w.use_nodes = True
bg = w.node_tree.nodes['Background']
bg.inputs['Color'].default_value = lin('#cfe0f2'); bg.inputs['Strength'].default_value = 1.0
QUYOSH = bpy.data.objects.new('quyosh', bpy.data.lights.new('quyosh', 'SUN')); sc.collection.objects.link(QUYOSH)
QUYOSH.data.angle = math.radians(1.5); QUYOSH.data.color = (1.0, 0.95, 0.86)

def quyosh(azimut, balandlik, kuch):
    """azimut — nur qaysi tomondan keladi (rejada: 0 = sharq, 90 = janub), balandlik — gradus."""
    a, b = math.radians(azimut), math.radians(balandlik)
    keladi = Vector((math.cos(a) * math.cos(b), -math.sin(a) * math.cos(b), math.sin(b)))  # quyoshga yo'nalish
    QUYOSH.rotation_euler = (-keladi).to_track_quat('-Z', 'Y').to_euler()
    QUYOSH.data.energy = kuch

# ---------------- kameralar ----------------
KAMERA_NUQTA = {}
def kamera(nom, joy, nishon, lens):
    KAMERA_NUQTA[nom] = [joy, nishon]
    c = bpy.data.cameras.new(nom); c.lens = lens; c.sensor_width = 36; c.clip_start = 0.05; c.clip_end = 300
    ob = bpy.data.objects.new(nom, c); sc.collection.objects.link(ob)
    ob.location = P(*joy)
    ob.rotation_euler = (P(*nishon) - P(*joy)).to_track_quat('-Z', 'Y').to_euler()
    return ob

KOR = {
    'umumiy': dict(cam=kamera('kamera_umumiy', (3200, 22000, 23500), (6250, 6500, -400), 40), res=(2400, 1700),
                   ichki=False, quyosh=(130, 52, 3.2), exp=0.0),
    'sinf': dict(cam=kamera('kamera_sinf', (7000, 11650, 1650), (9150, 3400, 1250), 20), res=(1920, 1080),
                 ichki=True, quyosh=(10, 28, 3.5), exp=0.0),
    'wc1': dict(cam=kamera('kamera_hojatxona_1', (7680, 2730, 1650), (7150, 650, 1000), 15), res=(1920, 1080),
                ichki=True, quyosh=(10, 28, 3.5), exp=0.0),
    'wc2': dict(cam=kamera('kamera_hojatxona_2', (6250, 2950, 1650), (11300, 1750, 1000), 16), res=(1920, 1080),
                ichki=True, quyosh=(10, 28, 3.5), exp=0.0),
}

# ---------------- render sozlamalari ----------------
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.use_adaptive_sampling = True
sc.cycles.adaptive_threshold = 0.03 if not TEZ else 0.1
sc.cycles.use_denoising = True
sc.cycles.denoiser = 'OPENIMAGEDENOISE'
sc.cycles.max_bounces = 8; sc.cycles.diffuse_bounces = 4; sc.cycles.glossy_bounces = 4
sc.cycles.transmission_bounces = 8; sc.cycles.transparent_max_bounces = 12
sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
sc.cycles.blur_glossy = 1.0
sc.view_settings.view_transform = 'AgX'
try: sc.view_settings.look = 'AgX - Medium High Contrast'
except Exception: pass
sc.render.image_settings.file_format = 'JPEG'
sc.render.image_settings.quality = 92
sc.render.image_settings.color_mode = 'RGB'
FAYL = {'umumiy': '1-umumiy', 'sinf': '2-sinf-doska', 'wc1': '3-hojatxona-rakovinalar', 'wc2': '4-hojatxona-taxorat'}

def kor_yashir(kol, yashir):
    K[kol].hide_render = yashir; K[kol].hide_viewport = yashir

K['vaqtincha'].hide_render = True
os.makedirs(CHIQ, exist_ok=True)
# umumiy ko'rinishdagi xona nomlari uchun nuqtalar (rasmdagi ulush: 0..1, chapdan va tepadan)
from bpy_extras.object_utils import world_to_camera_view
# (x, y, z): hojatxona nomi shimoliy devor ortida (kabinalarni yopmasligi uchun)
BELGI = {'1': (4375, 3300, 0), '2': (8825, -700, KESIM), '3': (2350, 7700, 0), '4': (3025, 10700, 0), '5': (8825, 4700, 0), 'Z': (1600, 3100, 0)}
sc.render.resolution_x, sc.render.resolution_y = KOR['umumiy']['res']
bpy.context.view_layer.update()
belgi = {}
for kod, (x, y, z) in BELGI.items():
    v = world_to_camera_view(sc, KOR['umumiy']['cam'], P(x, y, z))
    belgi[kod] = [round(v.x, 4), round(1 - v.y, 4)]
json.dump({'belgi': belgi, 'kamera': KAMERA_NUQTA}, open(os.path.join(CHIQ, 'umumiy-belgilar.json'), 'w'))
for nom, k in KOR.items():
    if FAQAT and nom not in FAQAT: continue
    ichki = k['ichki']
    kor_yashir('tepa', not ichki); kor_yashir('chiroq', not ichki); kor_yashir('toliq', not ichki)
    kor_yashir('kesim', ichki); kor_yashir('taglik', ichki); kor_yashir('tashqi', not ichki)
    quyosh(*k['quyosh'])
    sc.view_settings.exposure = k['exp']
    sc.camera = k['cam']
    rx, ry = k['res']
    sc.render.resolution_x, sc.render.resolution_y = (rx // 3, ry // 3) if TEZ else (rx, ry)
    sc.cycles.samples = 24 if TEZ else (72 if ichki else 48)
    sc.render.filepath = os.path.join(CHIQ, f'Xadra_3-qavat_3D_{FAYL[nom]}.jpg')
    bpy.ops.render.render(write_still=True)
    print('render:', nom, flush=True)

# .blend — barcha kameralar bilan (ichki ko'rinish holatida saqlanadi)
for kk in ('tepa', 'chiroq', 'toliq', 'tashqi'): kor_yashir(kk, False)
for kk in ('kesim', 'taglik'): kor_yashir(kk, True)
sc.camera = KOR['sinf']['cam']
sc.render.resolution_x, sc.render.resolution_y = KOR['sinf']['res']
sc.cycles.samples = 72
bpy.data.collections.remove(K['vaqtincha'])
if not TEZ or '--blend' in argv:
    bpy.context.preferences.filepaths.save_version = 0      # .blend1 zaxira fayli yaratilmasin
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(os.path.join(CHIQ, 'Xadra_3-qavat.blend')), compress=True)
print('tayyor')
