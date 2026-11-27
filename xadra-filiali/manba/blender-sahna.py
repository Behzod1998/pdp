# 2-qavat koworking sahnasi — interaktiv logotipli devor (fotozona), alohida sahna (Cycles). Umumiy qismlar: blender_umumiy.py
# Buyurtmachi (27.11): devor 5.90 × 3.50 m, poldagi sahnasiz — faqat devor. Qo'lda chizilgan sxema (chapdan o'ngga, simmetrik):
#   Bambuk | Taroq | B B B | markaz B (logotip) | B B B | Taroq | Bambuk
#   B / bambuk — PRAZA № 677 panel (1-qavat resepshndagi), bo'laklar orasidagi choklar qora;
#   T — taroq: qovurg'ali jigarrang yog'och panel (buyurtmachi namunasi, planka ~120 mm, baland/past qovurg'alar navbatma-navbat).
# Logotip — buyurtmachi fotosidagidek: belgi + ikki qator, PDP qora, Academy yashil; hajmli harflar, --led: orqadan oq LED.
# Shift qora, osma dumaloq chiroqlar (foto); pol — mavjud kulrang plitka (tozalangan, musorsiz).
# Ishlatish:
#   python blender-sahna.py - ../chizma/3d [--tez] [--faqat old,qiya,yaqin,old_led,yaqin_led]
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import blender_umumiy as bu
from blender_umumiy import Q, P, M

A = bu.argv()
bu.boshla()
bu.K['led'] = bu.kol('led')

EN, BAL = 5900, 3500            # devor eni va balandligi (shiftgacha)
PLINTUS = 80                    # plintus balandligi
CHOK = 8                        # bo'laklar orasidagi qora chok
CHUQ_ROOM = 8000                # xona chuqurligi (kamera uchun)
# devor kompozitsiyasi (x, mm): b — 677 panel, t — taroq
SEG = [('b', 0, 850), ('t', 850, 1450), ('b', 1450, 1750), ('b', 1750, 2050), ('b', 2050, 2350), ('b', 2350, 3550),
       ('b', 3550, 3850), ('b', 3850, 4150), ('b', 4150, 4450), ('t', 4450, 5050), ('b', 5050, 5900)]
XC = EN / 2
LOGO_EN, LOGO_Z = 1600, 2250    # logotip eni va markaz balandligi
# taroq plankasi profili (mm, chapdan): H — baland (och), L — past (to'q) qovurg'a; namunadagi rasm ustunlaridan o'lchangan
PLANKA = 120
PROFIL = [(0, 31.6, 'H'), (31.6, 44, 'L'), (44, 60, 'H'), (60, 72, 'L'), (72, 87, 'H'), (87, 100, 'L'), (100, 120, 'H')]

PZ = bu.yogoch_panel('praza677_x', 'praza_677.jpg', 'x', chok_yoq=True)


def taroq_mat(nom, kopayt):
    m = bu.yogoch_panel(nom, 'taroq.jpg', 'x', tile=(0.024, 0.262), chok_yoq=True, rough=0.5)
    n, l = m.node_tree.nodes, m.node_tree.links
    b = n['Principled BSDF']; tx = [x for x in n if x.type == 'TEX_IMAGE'][0]
    mx = n.new('ShaderNodeMixRGB'); mx.blend_type = 'MULTIPLY'; mx.inputs['Fac'].default_value = 1.0
    mx.inputs['Color2'].default_value = bu.lin(kopayt)
    l.new(tx.outputs['Color'], mx.inputs['Color1']); l.new(mx.outputs['Color'], b.inputs['Base Color'])
    return m


TAROQ_H, TAROQ_L = taroq_mat('taroq_och', '#ffffff'), taroq_mat('taroq_toq', '#9a8a80')
TAROQ_ASOS = bu.mat('taroq_ariqcha', '#2a1c14', 0.7)
SHIFT_Q = bu.mat('shift_qora', '#1a1b1d', 0.85)
QORA_CHOK = bu.mat('chok_qora', '#111214', 0.6)
PL = bu.mat('plintus_och', '#d8d6d1', 0.4)
POL = bu.gisht('pol_kul', 'xy', '#9a9893', '#918f8a', '#77756f', 0.6, 0.6, 0.0, 0.0018, 0.3, coat=0.15, shovqin=0.06)
DEVOR = bu.mat('devor_oq_sahna', '#ecebe8', 0.85)

# ---------------- xona: pol, shift, yon devorlar ----------------
q = Q()
q.box(-1500, EN + 1500, -200, CHUQ_ROOM, -10, 0, POL)
q.obj('pol', 'asos')
q = Q()
q.box(-1500, EN + 1500, -200, CHUQ_ROOM, BAL, BAL + 100, SHIFT_Q)
q.obj('shift', 'tepa')
q = Q()
q.box(-150, 0, -200, CHUQ_ROOM, 0, BAL, DEVOR); q.box(EN, EN + 150, -200, CHUQ_ROOM, 0, BAL, DEVOR)          # yon devorlar
q.box(-150, EN + 150, CHUQ_ROOM, CHUQ_ROOM + 150, 0, BAL, DEVOR)                                              # orqa (kamera ortida)
q.box(0, EN, -200, -30, 0, BAL, DEVOR)                                                                        # GKL devor
q.obj('devorlar', 'asos')

# ---------------- sahna devori ----------------
q = Q()
q.box(0, EN, -30, -18, PLINTUS, BAL, QORA_CHOK)                                    # qora asos — choklar shu rangda
q.box(0, EN, -30, 10, 0, PLINTUS, PL)                                              # plintus
for tur, a, b in SEG:
    a1 = a + (CHOK / 2 if a > 0 else 0); b1 = b - (CHOK / 2 if b < EN else 0)
    if tur == 'b':
        q.box(a1, b1, -18, 0, PLINTUS, BAL, PZ)
    else:
        n_ = round((b1 - a1) / PLANKA); w = (b1 - a1) / n_
        for i in range(n_):
            x0 = a1 + i * w
            q.box(x0, x0 + w, -18, -10, PLINTUS, BAL, TAROQ_ASOS)
            for u1, u2, t in PROFIL:
                k = w / PLANKA
                q.box(x0 + u1 * k + 0.6, x0 + u2 * k - 0.6, -10, 4 if t == 'H' else -4, PLINTUS, BAL, TAROQ_H if t == 'H' else TAROQ_L)
q.obj('sahna_devor', 'asos')
# rozetkalar (fotodagi teshiklar o'rnida) — qora ikkitalik
q = Q()
for x in (425, 2150, 3750, 5475):
    q.box(x - 75, x + 75, 0, 10, 330, 410, bu.M['korpus'], bevel=3)
    for dx in (-35, 35):
        q.cyl((x + dx, 10, 370), (x + dx, 11, 370), 20, bu.M['teshik'], 16)
q.obj('rozetkalar', 'asos')

# ---------------- logotip ----------------
bu.logo_3d('pdp-academy-primary-yashil-academy.svg', XC, 0, 0, LOGO_EN, LOGO_Z, chuq=20, ofset=30, nom='logo_sahna',
           led=3.0, halqa_png='pdp-academy-primary-yashil-academy-halqa-oq.png')
led_ob = bpy.data.objects['logo_sahna_led']
for c in list(led_ob.users_collection): c.objects.unlink(led_ob)
bu.K['led'].objects.link(led_ob)
bu.kor_yashir('led', True)

# ---------------- chiroqlar ----------------
# osma dumaloq chiroqlar (foto): devordan ~1 m, uchta
q = Q()
OSMA = [(1100, 1000), (XC, 1000), (EN - 1100, 1000)]
ZO = 2850
for x, y in OSMA:
    q.cyl((x, y, ZO), (x, y, ZO + 45), 230, M['qora_metall'], 48)
    q.cyl((x, y, ZO - 3), (x, y, ZO), 215, M['led'], 48)
    q.cyl((x, y, ZO + 45), (x, y, BAL), 2, M['qora_metall'], 6)
    q.cyl((x, y, BAL - 15), (x, y, BAL), 40, M['qora_metall'], 16)
q.obj('osma_chiroqlar', 'tepa')
for i, (x, y) in enumerate(OSMA):
    L_ = bpy.data.lights.new(f'osma_{i}', 'AREA'); L_.shape = 'DISK'; L_.size = 0.42; L_.energy = 45; L_.color = (1.0, 0.95, 0.88)
    ob_ = bpy.data.objects.new(f'osma_{i}', L_); bu.K['chiroq'].objects.link(ob_); ob_.visible_camera = False; ob_.location = P(x, y, ZO - 10)
# shiftda qora spotlar — devorni yoritadi (logotip, taroq, chetlar)
q = Q()
for x, nish_z, kuch, nom in ((425, 1600, 35, 'chet'), (1150, 1600, 40, 'taroq'), (XC - 450, LOGO_Z, 45, 'logo'), (XC + 450, LOGO_Z, 45, 'logo'),
                             (EN - 1150, 1600, 40, 'taroq'), (EN - 425, 1600, 35, 'chet')):
    q.cyl((x, 700, BAL - 120), (x, 700, BAL), 45, M['qora_metall'], 20)
    bu.spot(x, 700, BAL - 125, kuch, (x, 0, nish_z), 42, f'spot_{nom}')
q.obj('spotlar', 'tepa')
bu.doira_chiroqlar([(1200, 4000), (EN - 1200, 4000), (1200, 6500), (EN - 1200, 6500)], 'downlight', 14)

# ---------------- kameralar va render ----------------
kam = bu.kamera
Q_ = (90, 40, 0.0)
KOR = {
    'old': dict(cam=kam('kamera_old', (XC, 6800, 1550), (XC, 0, 1800), 28), res=(1920, 1280), ichki=True, quyosh=Q_),
    'qiya': dict(cam=kam('kamera_qiya', (700, 4600, 1600), (3900, 0, 1700), 22), res=(1920, 1280), ichki=True, quyosh=Q_),
    'yaqin': dict(cam=kam('kamera_yaqin', (XC + 400, 3300, 1650), (XC, 0, 2050), 30), res=(1920, 1280), ichki=True, quyosh=Q_),
}
KOR['old_led'] = dict(KOR['old'], korsat=['led'], exp=-0.3)
KOR['yaqin_led'] = dict(KOR['yaqin'], korsat=['led'], exp=-0.3)
FAYL = {'old': '1-togridan', 'qiya': '2-qiya', 'yaqin': '3-logotip-yaqin', 'old_led': '4-togridan-LED', 'yaqin_led': '5-logotip-yaqin-LED'}
bu.render_sozla(A['tez'])
bu.renderla(KOR, A['chiq'], 'Xadra_2-qavat_koworking-sahna', FAYL, A['tez'], A['faqat'], namuna=(96, 48))
print('tayyor')
