# Blender sahnalari uchun umumiy kutubxona (1, 2 va 3-qavat): materiallar, mesh yig'uvchi, devor, deraza, eshik,
# mebel, logotip va doskalar, chiroqlar, kamera va render.
# Koordinatalar rejadagidek: mm, x — o'ngga, y — pastga (janubga). Blenderda X = x, Y = −y, Z — yuqoriga.
# Burchak (rot) — rejadagi burilish, gradus (y pastga bo'lgani uchun rejada soat strelkasi bo'yicha).
# Devorga osiladigan buyumlar lokal koordinatada quriladi: devor yuzi — lokal y = 0, xona — lokal +y tomonda,
# buyum markazi — lokal x = 0. burchak_xona(d) — xona tomoni yo'nalishidan (rejada) burilish burchagi.
import bpy, bmesh, json, math, os, sys
from mathutils import Vector, Matrix

H = 3500          # poldan shiftgacha (buyurtmachi: bino balandligi 3.5 m)
KESIM = 2700      # umumiy ko'rinishda devorlar shu balandlikda kesiladi
SILL, HEAD = 900, 2600   # deraza: tokcha va tepa (taxmin)
ESH_H = 2100      # eshik balandligi
SHISHA_H = 2500   # shisha devor va shisha eshik ustidagi shisha — 2.5 m gacha (buyurtmachi)
LOGO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logo')

M, K = {}, {}
sc = None


def argv():
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    return dict(json=a[0], chiq=a[1], tez='--tez' in a, blend='--blend' in a,
                faqat=a[a.index('--faqat') + 1].split(',') if '--faqat' in a else None)


def P(x, y, z=0):
    return Vector((x / 1000, -y / 1000, z / 1000))


def lin(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c] + [1]


# ---------------- materiallar ----------------
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
    """Plitka / parket / bambuk: Brick Texture. oq — tekislik o'qlari: 'xy', 'xz', 'yz' (obyekt koordinatasi)."""
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


def rasm_mat(nom, fayl, kuch=0.0, rang_kuch=1.0):
    """PNG (alfa bilan) — plastinka materiali. kuch > 0 bo'lsa, rasm o'zi nur sochadi (yorituvchi logotip)."""
    m, n, l, b = yangi_mat(nom)
    im = bpy.data.images.load(os.path.join(LOGO_DIR, fayl), check_existing=True)
    tx = n.new('ShaderNodeTexImage'); tx.image = im; tx.interpolation = 'Cubic'
    l.new(tx.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.4
    if kuch:
        l.new(tx.outputs['Color'], b.inputs['Emission Color'])
        b.inputs['Emission Strength'].default_value = kuch
    tr = n.new('ShaderNodeBsdfTransparent')
    mix = n.new('ShaderNodeMixShader')
    out = n['Material Output']
    l.new(tx.outputs['Alpha'], mix.inputs['Fac']); l.new(tr.outputs['BSDF'], mix.inputs[1]); l.new(b.outputs['BSDF'], mix.inputs[2])
    l.new(mix.outputs['Shader'], out.inputs['Surface'])
    return m


def materiallar():
    M.update(
        devor=mat('devor', '#ebe8e3', 0.85),
        devor_oq=mat('devor_oq', '#f3f2ef', 0.8),
        qopqoq=mat('devor_kesim', '#2f3236', 0.9),
        shift=mat('shift', '#f4f4f2', 0.9),
        beton=mat('beton', '#a7a49f', 0.9),
        ustun=mat('ustun', '#e9e6e1', 0.85),
        yopiq_pol=mat('yopiq_pol', '#bdb9b2', 0.9),
        zina=mat('zina_tosh', '#d3d0cb', 0.45),
        oyna=shisha('oyna'),
        xira=shisha('xira_oyna', 0.35),
        ramka=mat('pvx_ramka', '#f6f6f4', 0.35),
        alyuminiy=mat('alyuminiy', '#4a4e54', 0.35, 0.8),
        alyuminiy_och=mat('alyuminiy_och', '#b9bec4', 0.3, 0.9),
        xrom=mat('xrom', '#e6e8ea', 0.08, 1.0),
        polat=mat('zanglamas_polat', '#c9ccce', 0.28, 1.0),
        keramika=mat('keramika', '#fbfbfa', 0.06, coat=0.6),
        teshik=mat('teshik', '#2a2d30', 0.6),
        qora_metall=mat('qora_metall', '#25272a', 0.4, 0.6),
        parta=gisht('parta_yogoch', 'xy', '#d6b083', '#cfa877', '#cda673', 0.9, 0.5, 0.5, 0.0, 0.45, shovqin=0.1, bump=0, tolqin=0.6),
        yogoch_toq=gisht('yogoch_toq', 'xy', '#8a6542', '#7f5c3b', '#7a583a', 0.9, 0.5, 0.5, 0.0, 0.4, shovqin=0.1, bump=0, tolqin=0.6),
        stul=mat('stul_plastik', '#2e3a4b', 0.45),
        hpl=mat('kabina_hpl', '#6f7882', 0.4),
        eshik_yogoch=mat('eshik_yogoch', '#7a5636', 0.5),
        eshik_oq=mat('eshik_oq', '#eeeeec', 0.4),
        doska_oq=mat('doska_oq', '#fbfbfb', 0.12, coat=0.4),
        ramka_doska=mat('doska_ramka', '#b9bec4', 0.3, 0.9),
        ekran=mat('ekran', '#0f2a4a', 0.15, emit=0.9, emit_rang='#16406e'),
        ekran_qora=mat('ekran_qora', '#0b0d10', 0.08),
        ekran_matn=mat('ekran_matn', '#ffffff', 0.5, emit=6.0),
        ekran_aksent=mat('ekran_aksent', '#2fb36f', 0.5, emit=5.0),
        korpus=mat('korpus_qora', '#16181b', 0.3),
        kozgu=mat('kozgu', '#e9ecee', 0.02, 1.0),
        led=mat('led_panel', '#ffffff', 0.5, emit=6.0, emit_rang='#fff6ea'),
        led_chiziq=mat('led_chiziq', '#ffffff', 0.5, emit=9.0, emit_rang='#fff4e6'),
        kond=mat('konditsioner', '#f3f3f1', 0.3),
        mato=mat('mato_qora', '#202226', 0.8),
        mato_kul=mat('mato_kul', '#7d858f', 0.85),
        mato_kul_toq=mat('mato_kul_toq', '#5e6670', 0.85),
        mato_yashil=mat('mato_yashil', '#2f6b4a', 0.85),
        noutbuk=mat('noutbuk', '#9aa0a6', 0.3, 0.8),
        yer=mat('yer', '#9aa58b', 0.9),
        taglik=mat('taglik', '#e3e1dc', 0.9),
        grafit=mat('grafit_panel', '#2a2e33', 0.55),
        brend_yashil=mat('brend_yashil', '#00B533', 0.45),
        brend_yashil_nur=mat('brend_yashil_nur', '#00B533', 0.4, emit=4.0),
        brend_sariq=mat('brend_sariq', '#FFCC19', 0.45),
        probka=gisht('probka', 'xz', '#b88e5e', '#ad8455', '#a07a4f', 0.03, 0.03, 0.5, 0.0, 0.9, shovqin=0.25, bump=0),
        qogoz=mat('qogoz', '#f7f6f2', 0.8),
        qogoz_sariq=mat('qogoz_sariq', '#f6e7a8', 0.8),
        qogoz_kok=mat('qogoz_kok', '#cfe3f5', 0.8),
        foto=mat('foto', '#c9cdd2', 0.5),
        foto_siluet=mat('foto_siluet', '#7c858f', 0.6),
        tuproq=mat('tuproq', '#3b2a1e', 0.9),
        tuvak=mat('tuvak', '#e7e3dc', 0.5),
        barg=mat('barg', '#3f7d34', 0.6),
        barg_och=mat('barg_och', '#5e9f45', 0.6),
        matn_toq=mat('matn_toq', '#22262b', 0.5),
        pol_parket=gisht('pol_parket', 'yx', '#c8a273', '#b98f5f', '#8a6a46', 1.2, 0.16, 0.5, 0.0012, 0.4, shovqin=0.15, bump=0.4, tolqin=0.8),
        pol_plitka=gisht('pol_plitka', 'xy', '#d9d5ce', '#d1ccc4', '#b0aba3', 0.6, 0.6, 0.0, 0.002, 0.35, shovqin=0.05),
        pol_keramogranit=gisht('pol_keramogranit', 'xy', '#e2dfda', '#dcd8d2', '#c2bdb5', 0.6, 0.6, 0.0, 0.0015, 0.22, coat=0.25, shovqin=0.04),
        wc_pol=gisht('wc_pol', 'xy', '#9fa4a9', '#989da2', '#7d8287', 0.6, 0.6, 0.0, 0.002, 0.3, shovqin=0.06),
    )
    for o in ('x', 'y'):
        M['kafel_' + o] = gisht('wc_kafel_' + o, o + 'z', '#f2f2ef', '#ecece8', '#cfcfca', 0.6, 0.3, 0.0, 0.0015, 0.12, coat=0.5, bump=0.5)
        M['bambuk_' + o] = gisht('bambuk_' + o, o + 'z', '#c99b5c', '#b88a4b', '#6f5230', 0.045, 0.62, 0.5, 0.0018, 0.45, shovqin=0.12, bump=0.6)


# ---------------- sahna ----------------
def kol(nom):
    c = bpy.data.collections.new(nom); sc.collection.children.link(c); return c


def boshla():
    global sc
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.unit_settings.system = 'METRIC'
    materiallar()
    K.update(asos=kol('asos'), toliq=kol('devor_toliq'), kesim=kol('devor_kesim'), tepa=kol('tepa'),
             chiroq=kol('chiroqlar'), tashqi=kol('tashqi'), taglik=kol('taglik'), vaqtincha=kol('vaqtincha'))
    w = bpy.data.worlds.new('osmon'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = lin('#cfe0f2'); bg.inputs['Strength'].default_value = 1.0
    q = bpy.data.objects.new('quyosh', bpy.data.lights.new('quyosh', 'SUN')); sc.collection.objects.link(q)
    q.data.angle = math.radians(1.5); q.data.color = (1.0, 0.95, 0.86)
    return sc


def quyosh(azimut, balandlik, kuch):
    """azimut — nur qaysi tomondan keladi (rejada: 0 = sharq, 90 = janub), balandlik — gradus."""
    Q_ = bpy.data.objects['quyosh']
    a, b = math.radians(azimut), math.radians(balandlik)
    keladi = Vector((math.cos(a) * math.cos(b), -math.sin(a) * math.cos(b), math.sin(b)))
    Q_.rotation_euler = (-keladi).to_track_quat('-Z', 'Y').to_euler()
    Q_.data.energy = kuch


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

    def cyl(s, a, b, r, m, seg=16, smooth=True, r2=None):
        a, b = P(*a), P(*b)
        d = b - a
        mat_ = Matrix.Translation((a + b) / 2) @ d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        res = bmesh.ops.create_cone(s.bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r / 1000,
                                    radius2=(r if r2 is None else r2) / 1000, depth=d.length, matrix=mat_)
        for f in {f for v in res['verts'] for f in v.link_faces}:
            f.material_index = s.mi(m); f.smooth = smooth and len(f.verts) == 4

    def shar(s, cx, cy, cz, rx, ry, rz, m, seg=32):
        res = bmesh.ops.create_uvsphere(s.bm, u_segments=seg, v_segments=seg // 2, radius=1.0)
        c = P(cx, cy, cz)
        for v in res['verts']:
            v.co = Vector((c.x + v.co.x * rx / 1000, c.y + v.co.y * ry / 1000, c.z + v.co.z * rz / 1000))
        for f in {f for v in res['verts'] for f in v.link_faces}:
            f.material_index = s.mi(m); f.smooth = True

    def tekis(s, x1, x2, z1, z2, y, m):
        """Vertikal plastinka (y = const, lokal yuz +y tomonga qaragan) — rasm teksturasi uchun UV bilan."""
        vs = [s.bm.verts.new(P(x, y, z)) for x, z in ((x1, z1), (x2, z1), (x2, z2), (x1, z2))]
        f = s.bm.faces.new(vs)
        f.normal_update()
        f.material_index = s.mi(m)
        uv = s.bm.loops.layers.uv.verify()
        for lp, (u, v) in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
            lp[uv].uv = (u, v)
        if f.normal.y > 0:     # Blender −Y = rejada +y (xona tomoni)
            f.normal_flip()

    def mesh(s, nom):
        me = bpy.data.meshes.new(nom)
        s.bm.normal_update(); s.bm.to_mesh(me); s.bm.free()
        for m in s.mats: me.materials.append(m)
        return me

    def obj(s, nom, k, loc=(0, 0, 0), rot=0.0):
        return joyla(s.mesh(nom), nom, k, loc, rot)


def joyla(me, nom, k, loc=(0, 0, 0), rot=0.0):
    ob = bpy.data.objects.new(nom, me); K[k].objects.link(ob)
    ob.location = P(*loc); ob.rotation_euler.z = -math.radians(rot)
    return ob


def lokal_nuqta(x, y, rot, u, v):
    """Lokal (u, v) → rejadagi nuqta (x, y — lokal boshi, rot — burilish)."""
    a = math.radians(rot)
    return x + u * math.cos(a) - v * math.sin(a), y + u * math.sin(a) + v * math.cos(a)


def burchak_xona(dx, dy):
    """Devor yuzidan xona tomonga yo'nalish (rejada) → devorga osiladigan buyumning burilishi."""
    return {(0, 1): 0, (-1, 0): 90, (0, -1): 180, (1, 0): -90}[(dx, dy)]


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


def qoplama(q, oq, koord, ichkari, a1, a2, z1, z2, teshik, m, t):
    """Devor qoplamasi (kafel, bambuk). oq='h' — y=koord dagi yuz (x bo'ylab); 'v' — x=koord dagi yuz (y bo'ylab).
    ichkari: +1/−1 — xona tomoni; teshik: [(a, b, z1, z2)] — eshik, deraza o'rni."""
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


# ---------------- devor, deraza, eshik ----------------
def devor_kesimlari(w, derazalar, h):
    """Devor to'rtburchagini derazalar bo'yicha bo'laklaydi: [(x1, x2, y1, y2, z1, z2)]."""
    boyY = (w['y2'] - w['y1']) > (w['x2'] - w['x1'])
    a0, a1 = (w['y1'], w['y2']) if boyY else (w['x1'], w['x2'])
    ich = sorted((d['y1'], d['y2']) if boyY else (d['x1'], d['x2']) for d in derazalar
                 if d['x1'] >= w['x1'] and d['x2'] <= w['x2'] and d['y1'] >= w['y1'] and d['y2'] <= w['y2'])
    seg, pos = [], a0
    for oa, ob in ich:
        seg += [(pos, oa, 0, h), (oa, ob, 0, SILL), (oa, ob, HEAD, h)]; pos = ob
    seg.append((pos, a1, 0, h))
    out = []
    for sa, sb, z1, z2 in seg:
        rect = (w['x1'], w['x2'], sa, sb) if boyY else (sa, sb, w['y1'], w['y2'])
        out.append((*rect, z1, z2))
    return out


def deraza(q, d, gl=None):
    """Deraza (PVX rom, o'rtada impost, ichki tokcha). d — devor qalinligidagi to'rtburchak; ichki tomon — d['ichki'] (+1/−1)."""
    gl = gl or M['oyna']
    boyY = (d['y2'] - d['y1']) > (d['x2'] - d['x1'])
    f, t = 60, 35
    ich = d.get('ichki', -1)
    if boyY:   # devor x bo'yicha qalin, deraza y bo'ylab
        xc = (d['x1'] + d['x2']) / 2; y1, y2 = d['y1'], d['y2']
        B = lambda a, b, z1, z2, m, tq=t: q.box(xc - tq, xc + tq, a, b, z1, z2, m)
        ym = (y1 + y2) / 2
        B(y1, y1 + f, SILL, HEAD, M['ramka']); B(y2 - f, y2, SILL, HEAD, M['ramka'])
        B(y1, y2, SILL, SILL + f, M['ramka']); B(y1, y2, HEAD - f, HEAD, M['ramka'])
        B(ym - 35, ym + 35, SILL, HEAD, M['ramka'])
        for a, b in ((y1 + f, ym - 35), (ym + 35, y2 - f)): B(a, b, SILL + f, HEAD - f, gl, 6)
        ichki_yuz = d['x1'] if ich < 0 else d['x2']
        xa, xb = sorted((ichki_yuz + ich * 45, xc + ich * t))
        q.box(xa, xb, y1 - 30, y2 + 30, SILL - 20, SILL, M['ramka'])
    else:
        yc = (d['y1'] + d['y2']) / 2; x1, x2 = d['x1'], d['x2']
        B = lambda a, b, z1, z2, m, tq=t: q.box(a, b, yc - tq, yc + tq, z1, z2, m)
        xm = (x1 + x2) / 2
        B(x1, x1 + f, SILL, HEAD, M['ramka']); B(x2 - f, x2, SILL, HEAD, M['ramka'])
        B(x1, x2, SILL, SILL + f, M['ramka']); B(x1, x2, HEAD - f, HEAD, M['ramka'])
        B(xm - 35, xm + 35, SILL, HEAD, M['ramka'])
        for a, b in ((x1 + f, xm - 35), (xm + 35, x2 - f)): B(a, b, SILL + f, HEAD - f, gl, 6)
        ichki_yuz = d['y1'] if ich < 0 else d['y2']
        ya, yb = sorted((ichki_yuz + ich * 45, yc + ich * t))
        q.box(x1 - 30, x2 + 30, ya, yb, SILL - 20, SILL, M['ramka'])


def barg_burchak(e, theta):
    phi0 = {('v', 'a'): 90, ('v', 'b'): -90, ('h', 'a'): 0, ('h', 'b'): 180}[(e['devor'], e['ilgak'])]
    target = (e['yon'], 0) if e['devor'] == 'v' else (0, e['yon'])
    for s in (1, -1):
        p = math.radians(phi0 + s * 90)
        if abs(math.cos(p) - target[0]) < 1e-6 and abs(math.sin(p) - target[1]) < 1e-6:
            return phi0 + s * theta


def eshik(e, theta=0.0, ustki_shisha=False, kab_z=(150, 2000)):
    """Eshik bargi va romi. e: kod, devor ('h'|'v'), a, b, yuz, yon, ilgak, en, shisha, kabina, qalinlik (t1, t2).
    ustki_shisha — eshik ustida 2.5 m gacha shisha (2-qavatdagi yangi eshiklar)."""
    kab = e.get('kabina')
    rama = 0 if kab else 40
    en = e['en'] - 2 * rama
    tq = 30 if kab else 40
    z1, z2 = kab_z if kab else (0, ESH_H - rama)
    hinge_a = e['a'] + rama if e['ilgak'] == 'a' else e['b'] - rama
    hx, hy = (e['yuz'] - e['yon'] * tq / 2, hinge_a) if e['devor'] == 'v' else (hinge_a, e['yuz'] - e['yon'] * tq / 2)
    q = Q()
    if kab:
        q.box(0, en, -tq / 2, tq / 2, z1, z2, M['hpl'])
        q.box(en - 60, en - 20, tq / 2, tq / 2 + 25, 950, 1000, M['xrom'])
        q.box(en - 60, en - 20, -tq / 2 - 25, -tq / 2, 950, 1000, M['xrom'])
        for z in (z1 + 150, z2 - 200):
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
    if not kab and e.get('qalinlik'):   # eshik romi (devor qalinligi bo'ylab) va ustidagi shisha
        t1, t2 = e['qalinlik']
        rm = M['alyuminiy'] if e.get('shisha') else M['eshik_yogoch']
        q = Q()
        tepa = SHISHA_H if ustki_shisha else ESH_H
        if e['devor'] == 'v':
            R = lambda a, b, za, zb, m: q.box(t1, t2, a, b, za, zb, m)
            G = lambda a, b, za, zb, m: q.box((t1 + t2) / 2 - 5, (t1 + t2) / 2 + 5, a, b, za, zb, m)
        else:
            R = lambda a, b, za, zb, m: q.box(a, b, t1, t2, za, zb, m)
            G = lambda a, b, za, zb, m: q.box(a, b, (t1 + t2) / 2 - 5, (t1 + t2) / 2 + 5, za, zb, m)
        R(e['a'], e['a'] + rama, 0, tepa, rm); R(e['b'] - rama, e['b'], 0, tepa, rm)
        R(e['a'], e['b'], ESH_H - rama, ESH_H, rm)
        if ustki_shisha:
            G(e['a'] + rama, e['b'] - rama, ESH_H, tepa - rama, M['oyna'])
            R(e['a'], e['b'], tepa - rama, tepa, rm)
        q.obj(f"eshik_romi_{e['kod']}", 'asos')
    return ob


def perila(q, a, b, qadam=120, bal=900):
    """a, b — (x, y, z_pol) — perila ostidagi chiziq."""
    q.cyl((a[0], a[1], a[2] + bal), (b[0], b[1], b[2] + bal), 25, M['eshik_yogoch'])
    L = math.dist(a[:2], b[:2]); n = max(1, int(L // qadam))
    for i in range(n + 1):
        t = i / n
        x, y, z = (a[j] + (b[j] - a[j]) * t for j in range(3))
        q.cyl((x, y, z), (x, y, z + bal), 7 if i % 8 else 14, M['qora_metall'], 8)


# ---------------- mebel (lokal koordinata, markaz — 0, 0) ----------------
def parta_mesh():
    """Ikki kishilik parta 140 × 60: o'quvchi +y tomonda o'tiradi, old panel −y (doska) tomonda."""
    q = Q(); w, d = 1400, 600
    q.box(-w / 2, w / 2, -d / 2, d / 2, 725, 750, M['parta'], bevel=3)
    for sx in (-1, 1):
        x = sx * (w / 2 - 50)
        for sy in (-1, 1):
            q.box(x - 20, x + 20, sy * (d / 2 - 60) - 20, sy * (d / 2 - 60) + 20, 0, 725, M['qora_metall'])
        q.box(x - 20, x + 20, -d / 2 + 40, d / 2 - 40, 680, 725, M['qora_metall'])
        q.box(x - 25, x + 25, -d / 2 + 30, d / 2 - 30, 0, 25, M['qora_metall'])
    q.box(-w / 2 + 70, w / 2 - 70, -d / 2 + 30, -d / 2 + 48, 380, 700, M['parta'])
    return q.mesh('parta')


def stul_mesh(rang=None):
    """Stul 380 × 420: suyanchiq +y tomonda (o'tirgan odam −y ga qaraydi)."""
    q = Q(); w, d = 380, 420
    m = rang or M['stul']
    q.box(-w / 2, w / 2, -d / 2, d / 2 - 20, 430, 455, m, bevel=8)
    q.box(-w / 2 + 5, w / 2 - 5, d / 2 - 30, d / 2 - 8, 560, 860, m, bevel=8)
    for sx in (-1, 1):
        for sy in (-1, 1):
            q.cyl((sx * (w / 2 - 30), sy * (d / 2 - 40), 0), (sx * (w / 2 - 30), sy * (d / 2 - 40), 435), 11, M['qora_metall'], 10)
        q.cyl((sx * (w / 2 - 30), d / 2 - 40, 430), (sx * (w / 2 - 30), d / 2 - 20, 700), 10, M['qora_metall'], 10)
    return q.mesh('stul')


def kreslo_mesh(m=None):
    """Ofis kreslosi: suyanchiq −y tomonda (o'tirgan odam +y ga qaraydi)."""
    m = m or M['mato']
    q = Q()
    for i in range(5):
        a = math.radians(90 + i * 72)
        q.cyl((0, 0, 60), (300 * math.cos(a), 300 * math.sin(a), 40), 15, m, 8)
        q.shar(300 * math.cos(a), 300 * math.sin(a), 25, 25, 25, 25, m, 12)
    q.cyl((0, 0, 50), (0, 0, 420), 25, M['xrom'])
    q.box(-240, 240, -230, 240, 420, 490, m, bevel=25, seg=3)
    q.box(-220, 220, -275, -235, 560, 1050, m, bevel=20, seg=3)
    q.box(-25, 25, -260, -230, 470, 580, m)
    return q.mesh('kreslo')


def ustoz_stoli(q, r, oldi):
    """O'qituvchi / xodim stoli (r — rejadagi to'rtburchak); oldi — old panel qaysi tomonda: 'x1'|'x2'|'y1'|'y2'."""
    q.box(r['x1'], r['x2'], r['y1'], r['y2'], 725, 750, M['parta'], bevel=3)
    gor = (r['x2'] - r['x1']) >= (r['y2'] - r['y1'])
    if gor:
        for x in (r['x1'] + 20, r['x2'] - 45): q.box(x, x + 25, r['y1'] + 30, r['y2'] - 30, 0, 725, M['parta'])
    else:
        for y in (r['y1'] + 20, r['y2'] - 45): q.box(r['x1'] + 30, r['x2'] - 30, y, y + 25, 0, 725, M['parta'])
    if oldi == 'y2': q.box(r['x1'] + 45, r['x2'] - 45, r['y2'] - 45, r['y2'] - 25, 250, 725, M['parta'])
    if oldi == 'y1': q.box(r['x1'] + 45, r['x2'] - 45, r['y1'] + 25, r['y1'] + 45, 250, 725, M['parta'])
    if oldi == 'x2': q.box(r['x2'] - 45, r['x2'] - 25, r['y1'] + 45, r['y2'] - 45, 250, 725, M['parta'])
    if oldi == 'x1': q.box(r['x1'] + 25, r['x1'] + 45, r['y1'] + 45, r['y2'] - 45, 250, 725, M['parta'])


def noutbuk(q, cx, cy, rot):
    """Noutbuk: ekran lokal +y tomonda, ekrani −y ga (o'tirgan odamga) qaragan."""
    def B(u1, u2, v1, v2, z1, z2, m, bev=0):
        pts = [lokal_nuqta(cx, cy, rot, u, v) for u, v in ((u1, v1), (u2, v2))]
        (x1, y1), (x2, y2) = pts
        q.box(min(x1, x2), max(x1, x2), min(y1, y2), max(y1, y2), z1, z2, m, bevel=bev)
    B(-170, 170, -120, 110, 750, 765, M['noutbuk'], 2)
    B(-170, 170, 110, 122, 765, 990, M['noutbuk'])
    B(-155, 155, 108, 110, 780, 975, M['ekran'])


def monitor(q, cx, cy, rot):
    """Monitor: ekrani lokal −y ga qaragan."""
    def B(u1, u2, v1, v2, z1, z2, m):
        (x1, y1), (x2, y2) = [lokal_nuqta(cx, cy, rot, u, v) for u, v in ((u1, v1), (u2, v2))]
        q.box(min(x1, x2), max(x1, x2), min(y1, y2), max(y1, y2), z1, z2, m)
    B(-280, 280, -15, 15, 900, 1230, M['korpus'])
    B(-265, 265, -17, -15, 915, 1215, M['ekran'])
    B(-30, 30, 5, 35, 750, 920, M['alyuminiy'])
    B(-110, 110, -60, 90, 750, 760, M['alyuminiy'])
    B(-200, 200, -260, -130, 750, 768, M['korpus'])     # klaviatura


def shkaf(q, r, m=None, bal=2000):
    m = m or M['parta']
    q.box(r['x1'], r['x2'], r['y1'], r['y2'], 0, bal, m, bevel=4)
    gor = (r['x2'] - r['x1']) >= (r['y2'] - r['y1'])
    L = (r['x2'] - r['x1']) if gor else (r['y2'] - r['y1'])
    n = max(1, round(L / 600))
    for i in range(1, n):
        t = (r['x1'] if gor else r['y1']) + L * i / n
        if gor: q.box(t - 3, t + 3, r['y1'] - 2, r['y2'] + 2, 20, bal - 20, M['qora_metall'])
        else: q.box(r['x1'] - 2, r['x2'] + 2, t - 3, t + 3, 20, bal - 20, M['qora_metall'])


def divan(q, r, orqa, m=None, m2=None):
    """Divan; orqa — suyanchiq qaysi tomonda: 'x1'|'x2'|'y1'|'y2'."""
    m = m or M['mato_kul']; m2 = m2 or M['mato_kul_toq']
    x1, x2, y1, y2 = r['x1'], r['x2'], r['y1'], r['y2']
    q.box(x1, x2, y1, y2, 80, 420, m, bevel=40, seg=3)
    if orqa == 'x1': q.box(x1, x1 + 220, y1, y2, 80, 820, m2, bevel=60, seg=3)
    if orqa == 'x2': q.box(x2 - 220, x2, y1, y2, 80, 820, m2, bevel=60, seg=3)
    if orqa == 'y1': q.box(x1, x2, y1, y1 + 220, 80, 820, m2, bevel=60, seg=3)
    if orqa == 'y2': q.box(x1, x2, y2 - 220, y2, 80, 820, m2, bevel=60, seg=3)
    gor = (x2 - x1) >= (y2 - y1)
    for s in (0, 1):   # yonbosh
        if gor: q.box(x1 if s == 0 else x2 - 150, x1 + 150 if s == 0 else x2, y1, y2, 80, 620, m2, bevel=50, seg=3)
        else: q.box(x1, x2, y1 if s == 0 else y2 - 150, y1 + 150 if s == 0 else y2, 80, 620, m2, bevel=50, seg=3)
    for (a, b) in ((x1, y1), (x2, y1), (x1, y2), (x2, y2)):
        q.cyl((a + (60 if a == x1 else -60), b + (60 if b == y1 else -60), 0), (a + (60 if a == x1 else -60), b + (60 if b == y1 else -60), 80), 18, M['qora_metall'], 8)


def dumaloq_stol(q, cx, cy, r, m=None):
    q.cyl((cx, cy, 725), (cx, cy, 750), r, m or M['parta'], 40)
    q.cyl((cx, cy, 0), (cx, cy, 725), 40, M['qora_metall'], 16)
    q.cyl((cx, cy, 0), (cx, cy, 20), 260, M['qora_metall'], 32)


def osimlik(q, cx, cy, bal=1300):
    """Tuvakdagi o'simlik (pol uchun)."""
    q.cyl((cx, cy, 0), (cx, cy, 420), 190, M['tuvak'], 28, r2=210)
    q.cyl((cx, cy, 405), (cx, cy, 412), 200, M['tuproq'], 28)
    import random
    rnd = random.Random(int(cx * 7 + cy * 13))
    for i in range(14):
        a = rnd.uniform(0, 2 * math.pi); r = rnd.uniform(40, 220); z = rnd.uniform(650, bal)
        q.shar(cx + r * math.cos(a), cy + r * math.sin(a), z, rnd.uniform(110, 190), rnd.uniform(110, 190), rnd.uniform(80, 150),
               M['barg'] if i % 2 else M['barg_och'], 12)
        q.cyl((cx, cy, 410), (cx + r * math.cos(a) * 0.8, cy + r * math.sin(a) * 0.8, z - 60), 8, M['barg'], 6)


def matn(body, x, y, z, olcham, m, nom, rot=0.0, k='asos', align='CENTER', shrift=None, qalin=False):
    """Devorga yopishgan yozuv: rejadagi (x, y) nuqtada, xona tomonga (lokal +y) qaragan."""
    cu = bpy.data.curves.new(nom, 'FONT'); cu.body = body; cu.size = olcham / 1000; cu.align_x = align; cu.align_y = 'CENTER'
    cu.extrude = 0.0005
    if shrift: cu.font = shrift
    ob = bpy.data.objects.new(nom, cu); K[k].objects.link(ob)
    ob.location = P(x, y, z); ob.rotation_euler = (math.radians(90), 0, -math.radians(rot))
    ob.data.materials.append(m)
    return ob


_SHRIFT = {}
def shrift(qalin=False):
    """Liberation Sans (tizimda bo'lsa) — aks holda Blender'ning standart shrifti."""
    kalit = 'B' if qalin else 'R'
    if kalit not in _SHRIFT:
        yol = f"/usr/share/fonts/truetype/liberation/LiberationSans-{'Bold' if qalin else 'Regular'}.ttf"
        _SHRIFT[kalit] = bpy.data.fonts.load(yol, check_existing=True) if os.path.exists(yol) else None
    return _SHRIFT[kalit]


# ---------------- devorga osiladigan buyumlar ----------------
def interaktiv_doska(x, y, rot, en=3000, matn2="Xadra filiali", nom='doska'):
    """Markazda 86" interaktiv panel, ikki yonida oq doska. (x, y) — devor yuzidagi markaz, rot — burchak_xona."""
    q = Q()
    ek = 1960
    x1, x2 = -en / 2, en / 2
    q.box(x1, -ek / 2 - 10, 0, 22, 950, 2100, M['ramka_doska'])
    q.box(x1 + 15, -ek / 2 - 25, 22, 24, 965, 2085, M['doska_oq'])
    q.box(ek / 2 + 10, x2, 0, 22, 950, 2100, M['ramka_doska'])
    q.box(ek / 2 + 25, x2 - 15, 22, 24, 965, 2085, M['doska_oq'])
    q.box(-ek / 2, ek / 2, 0, 85, 940, 2110, M['korpus'], bevel=6)
    q.box(-ek / 2 + 25, ek / 2 - 25, 85, 87, 980, 2085, M['ekran'])
    q.box(x1, x2, 0, 70, 925, 945, M['ramka_doska'])
    q.box(-320, 320, 87, 89, 1270, 1282, M['ekran_aksent'])
    q.obj(nom, 'asos', (x, y, 0), rot)
    px, py = lokal_nuqta(x, y, rot, 0, 90)
    matn('PDP Academy', px, py, 1640, 190, M['ekran_matn'], nom + '_sarlavha', rot, shrift=shrift(True))
    matn(matn2, px, py, 1390, 70, M['ekran_matn'], nom + '_izoh', rot, shrift=shrift())


def logo_panel(x, y, rot, en, zc, versiya='primary-on-dark', kuch=3.0, halqa=1.2, nom='logo', ofset=25, k='asos'):
    """Logotip (design.pdp.uz): en — logotip eni (mm), zc — markaz balandligi. kuch — ichki yoritish (0 — oddiy bosma),
    halqa — devorga tushadigan nur kuchi. Logotip devordan `ofset` mm oldinda (ichidan yoritilgan harflar)."""
    fayl = f'pdp-academy-{versiya}.png'
    im = bpy.data.images.load(os.path.join(LOGO_DIR, fayl), check_existing=True)
    W = en * im.size[0] / 3000      # PNG chetida bo'sh joy bor (logo-png.mjs: EN = 3000 px)
    Hh = W * im.size[1] / im.size[0]
    kalit = f'logo_{versiya}_{kuch}'
    if kalit not in M: M[kalit] = rasm_mat(kalit, fayl, kuch)
    q = Q(); q.tekis(-W / 2, W / 2, zc - Hh / 2, zc + Hh / 2, ofset, M[kalit]); q.obj(nom, k, (x, y, 0), rot)
    if halqa:
        kalit2 = f'halqa_{versiya}_{halqa}'
        if kalit2 not in M: M[kalit2] = rasm_mat(kalit2, f'pdp-academy-{versiya}-halqa.png', halqa)
        q = Q(); q.tekis(-W * 0.55, W * 0.55, zc - Hh * 0.55, zc + Hh * 0.55, 3, M[kalit2]); q.obj(nom + '_halqa', k, (x, y, 0), rot)
        # harflarni devordan ushlab turadigan akril qatlam (yon tomondan ko'rinadi)
    return W, Hh


def elon_doskasi(x, y, rot, en=1800, z1=950, z2=1950, nom='elon'):
    """E'lonlar doskasi: probka, alyuminiy rom, sarlavha va qadalgan varaqlar."""
    import random
    rnd = random.Random(int(x + y))
    q = Q()
    q.box(-en / 2, en / 2, 0, 30, z1, z2, M['alyuminiy_och'], bevel=4)
    q.box(-en / 2 + 30, en / 2 - 30, 30, 34, z1 + 30, z2 - 190, M['probka'])
    q.box(-en / 2 + 30, en / 2 - 30, 30, 36, z2 - 180, z2 - 30, M['qogoz'])
    q.box(-en / 2 + 30, -en / 2 + 230, 36, 38, z2 - 180, z2 - 30, M['brend_yashil'])
    # varaqlar 2 qatorda, bir-birini va sarlavhani yopmaydi (ustma-ust yuzalar render'da qora dog' beradi)
    ust = z2 - 200
    qator_h = (ust - z1 - 60) / 2
    katak = (en - 120) / 5
    for i in range(10):
        r_, c_ = divmod(i, 5)
        w_, h_ = rnd.choice([(210, 297), (297, 210), (148, 210)])
        h_ = min(h_, qator_h - 40); w_ = min(w_, katak - 40)
        u = -en / 2 + 60 + c_ * katak + rnd.uniform(10, katak - w_ - 10)
        zz = z1 + 40 + r_ * qator_h + rnd.uniform(10, qator_h - h_ - 10)
        m = [M['qogoz'], M['qogoz_sariq'], M['qogoz_kok']][i % 3]
        q.box(u, u + w_, 34, 35.5 + 0.2 * (i % 3), zz, zz + h_, m)
    q.obj(nom, 'asos', (x, y, 0), rot)
    px, py = lokal_nuqta(x, y, rot, -en / 2 + 260, 39)
    matn("E'LONLAR", px, py, z2 - 105, 85, M['matn_toq'], nom + '_sarlavha', rot, align='LEFT', shrift=shrift(True))


def etirof_doskasi(x, y, rot, en=1800, z1=950, z2=1950, nom='etirof'):
    """E'tirof doskasi: faxriylar va oy o'quvchisi nomzodlari — oq brend panel, rasm ramkalari."""
    q = Q()
    q.box(-en / 2, en / 2, 0, 25, z1, z2, M['devor_oq'], bevel=5)
    q.box(-en / 2, en / 2, 25, 27, z2 - 200, z2, M['brend_yashil'])
    q.box(-en / 2, en / 2, 25, 27, z1, z1 + 25, M['brend_sariq'])
    n = 5
    fw = (en - 160) / n
    for qator, (za, zb) in enumerate(((z1 + 420, z2 - 240), (z1 + 70, z1 + 380))):
        for i in range(n):
            u = -en / 2 + 80 + i * fw
            q.box(u + 20, u + fw - 20, 25, 33, za, zb, M['alyuminiy_och'])
            q.box(u + 35, u + fw - 35, 33, 35, za + 70, zb - 15, M['foto'])
            q.shar(u + fw / 2, 36, za + (zb - za) * 0.62, 45, 2, 55, M['foto_siluet'], 12)
            q.box(u + 35, u + fw - 35, 33, 35, za + 15, za + 60, M['qogoz'])
    q.obj(nom, 'asos', (x, y, 0), rot)
    px, py = lokal_nuqta(x, y, rot, -en / 2 + 60, 30)
    matn("E'TIROF DOSKASI", px, py, z2 - 85, 80, M['ekran_matn'], nom + '_sarlavha', rot, align='LEFT', shrift=shrift(True))
    matn("Faxriylar  ·  Oy o'quvchisi nomzodlari", px, py, z2 - 160, 45, M['ekran_matn'], nom + '_izoh', rot, align='LEFT', shrift=shrift())


def konditsioner(q, u0, v0, z=2850):
    q.box(u0 - 480, u0 + 480, v0, v0 + 230, z, z + 310, M['kond'], bevel=25, seg=3)
    q.box(u0 - 420, u0 + 420, v0 + 228, v0 + 236, z + 30, z + 55, M['korpus'])


# ---------------- chiroqlar ----------------
def led_panellar(LED, nom='chiroqlar', kuch_katta=55, kuch_kichik=9):
    """LED: [(x, y, a, b)] — shiftdagi panel (yorug'lik plastinkasi) va ostida maydon chirog'i."""
    q = Q()
    for x, y, a, b in LED:
        q.box(x - a / 2, x + a / 2, y - b / 2, y + b / 2, H - 12, H, M['led'] if min(a, b) > 80 else M['led_chiziq'])
        q.box(x - a / 2 - 10, x + a / 2 + 10, y - b / 2 - 10, y + b / 2 + 10, H - 6, H - 0.5, M['ramka'])
    q.obj(nom + '_paneli', 'tepa')
    for i, (x, y, a, b) in enumerate(LED):
        L = bpy.data.lights.new(f'{nom}_{i}', 'AREA'); L.shape = 'RECTANGLE'; L.size = a / 1000; L.size_y = b / 1000
        L.energy = (kuch_katta if max(a, b) > 300 else kuch_kichik) * (max(a, b) / 600 if min(a, b) <= 80 else 1)
        L.color = (1.0, 0.96, 0.9)
        ob = bpy.data.objects.new(f'{nom}_{i}', L); K['chiroq'].objects.link(ob)
        ob.visible_camera = False; ob.visible_glossy = False
        ob.location = P(x, y, H - 15)


def spot(x, y, z, kuch, nishon=None, burchak=50, nom='spot'):
    """Yo'naltirilgan chiroq (logotip, doskalar ustida)."""
    L = bpy.data.lights.new(nom, 'SPOT'); L.energy = kuch; L.spot_size = math.radians(burchak); L.spot_blend = 0.6
    L.shadow_soft_size = 0.03; L.color = (1.0, 0.95, 0.88)
    ob = bpy.data.objects.new(nom, L); K['chiroq'].objects.link(ob)
    ob.location = P(x, y, z)
    if nishon:
        ob.rotation_euler = (P(*nishon) - P(x, y, z)).to_track_quat('-Z', 'Y').to_euler()
    return ob


# ---------------- kamera va render ----------------
KAMERA_NUQTA = {}
def kamera(nom, joy, nishon, lens):
    KAMERA_NUQTA[nom] = [joy, nishon]
    c = bpy.data.cameras.new(nom); c.lens = lens; c.sensor_width = 36; c.clip_start = 0.05; c.clip_end = 400
    ob = bpy.data.objects.new(nom, c); sc.collection.objects.link(ob)
    ob.location = P(*joy)
    ob.rotation_euler = (P(*nishon) - P(*joy)).to_track_quat('-Z', 'Y').to_euler()
    return ob


def render_sozla(tez):
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.03 if not tez else 0.1
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    sc.cycles.max_bounces = 8; sc.cycles.diffuse_bounces = 4; sc.cycles.glossy_bounces = 4
    sc.cycles.transmission_bounces = 8; sc.cycles.transparent_max_bounces = 16
    sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
    sc.cycles.blur_glossy = 1.0
    sc.view_settings.view_transform = 'AgX'
    try: sc.view_settings.look = 'AgX - Medium High Contrast'
    except Exception: pass
    sc.render.image_settings.file_format = 'JPEG'
    sc.render.image_settings.quality = 92
    sc.render.image_settings.color_mode = 'RGB'


def kor_yashir(kol_, yashir):
    K[kol_].hide_render = yashir; K[kol_].hide_viewport = yashir


def belgilar(cam, res, BELGI, fayl):
    """Umumiy ko'rinishdagi xona nomlari uchun nuqtalar (rasmdagi ulush: 0..1, chapdan va tepadan)."""
    from bpy_extras.object_utils import world_to_camera_view
    sc.render.resolution_x, sc.render.resolution_y = res
    bpy.context.view_layer.update()
    belgi = {}
    for kod, (x, y, z) in BELGI.items():
        v = world_to_camera_view(sc, cam, P(x, y, z))
        belgi[kod] = [round(v.x, 4), round(1 - v.y, 4)]
    json.dump({'belgi': belgi, 'kamera': KAMERA_NUQTA}, open(fayl, 'w'))


def renderla(KOR, chiq, prefiks, FAYL, tez=False, faqat=None, namuna=(72, 48)):
    """KOR: {nom: dict(cam, res, ichki, quyosh, exp)}; FAYL: {nom: fayl qismi}."""
    K['vaqtincha'].hide_render = True
    os.makedirs(chiq, exist_ok=True)
    for nom, k in KOR.items():
        if faqat and nom not in faqat: continue
        ichki = k['ichki']
        kor_yashir('tepa', not ichki); kor_yashir('chiroq', not ichki); kor_yashir('toliq', not ichki)
        kor_yashir('kesim', ichki); kor_yashir('taglik', ichki); kor_yashir('tashqi', not ichki)
        quyosh(*k['quyosh'])
        sc.view_settings.exposure = k.get('exp', 0.0)
        sc.camera = k['cam']
        rx, ry = k['res']
        sc.render.resolution_x, sc.render.resolution_y = (rx // 3, ry // 3) if tez else (rx, ry)
        sc.cycles.samples = 24 if tez else (namuna[0] if ichki else namuna[1])
        sc.render.filepath = os.path.join(chiq, f'{prefiks}_{FAYL[nom]}.jpg')
        bpy.ops.render.render(write_still=True)
        print('render:', nom, flush=True)


def saqla(chiq, nom, asosiy_kamera, res=(1920, 1080), tez=False, blend=False):
    """.blend — barcha kameralar bilan (ichki ko'rinish holatida); logotip rasmlari faylga qadaladi."""
    for kk in ('tepa', 'chiroq', 'toliq', 'tashqi'): kor_yashir(kk, False)
    for kk in ('kesim', 'taglik'): kor_yashir(kk, True)
    sc.camera = asosiy_kamera
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.cycles.samples = 72
    if 'vaqtincha' in bpy.data.collections: bpy.data.collections.remove(K['vaqtincha'])
    if not tez or blend:
        try: bpy.ops.file.pack_all()
        except Exception as e: print('pack:', e)
        bpy.context.preferences.filepaths.save_version = 0      # .blend1 zaxira fayli yaratilmasin
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(os.path.join(chiq, nom)), compress=True)
    print('tayyor')
