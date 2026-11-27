# 3-qavat hojatxonasi devor panellari (buyurtmachi rasmlari, 03.11) → Blender teksturalari (bitta panel 1220 × 2800 mm).
# Ishlatish: python teksturalar-panel.py <rasmlar papkasi: 1.webp, 2.webp, 3.webp, panel4.jpg> teksturalar
# 4 — oq yaltiroq panel, tik tola naqshli (buyurtmachi, 05.11); rang neytral oqqa keltiriladi.
# Rasmdagi panel qismi kesiladi, yorug'lik notekisligi tekislanadi, yaltirash dog'lari yumshatiladi. (Pillow, numpy)
import sys, numpy as np
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
CROP = {'1': (70, 120, 430, 912), '2': (55, 110, 440, 945), '3': (85, 25, 600, 950), '4': (300, 80, 1250, 1550)}  # chetdagi qora burchak / kulrang yo'l kesib tashlangan
for k, box in CROP.items():
    im = Image.open(f'{src}/' + ({'4': 'panel4.jpg'}.get(k) or f'{k}.webp')).convert('RGB').crop(box)
    a = np.asarray(im).astype(np.float32)
    lum = a.mean(axis=2)
    # yorug'lik notekisligini tekislash: katta xiralashtirilgan yorqinlikka bo'lish
    big = np.asarray(Image.fromarray(lum.astype(np.uint8)).filter(ImageFilter.GaussianBlur(60))).astype(np.float32) + 1
    tekis = a * (np.median(lum) / big)[..., None]
    # yaltirash dog'lari: o'rtachadan juda yorug' joylar xiralashtirilgan fon bilan almashtiriladi
    blur = np.asarray(Image.fromarray(np.clip(tekis, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(12))).astype(np.float32)
    l2 = tekis.mean(axis=2); thr = np.percentile(l2, 99.0)
    mask = (l2 > thr)[..., None]
    mask = np.asarray(Image.fromarray((mask[..., 0] * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))).astype(np.float32)[..., None] / 255
    res = tekis * (1 - mask) + blur * mask
    if k == '4':     # faqat mayda naqsh (tik tolalar) olinadi: yaltirash, aks va rang tusi tashlanadi → neytral och oq (#e6e6e2) ustiga
        L = a.mean(axis=2)
        past = np.asarray(Image.fromarray(np.clip(L, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10))).astype(np.float32)
        res = np.array([230, 230, 226], np.float32) + np.clip((L - past) * 1.8, -40, 25)[..., None]
    Image.fromarray(np.clip(res, 0, 255).astype(np.uint8)).resize((610, 1400), Image.LANCZOS).save(f'{out}/wc_panel_{k}.jpg', quality=92)
    print(k, 'ok')
