# 1-qavat resepshn: PRAZA № 677 devor paneli namunasi (buyurtmachi rasmi, 20.11) → tekstura (yog'och tolasi, tik).
# Ishlatish: python teksturalar-praza.py <rasm: praza677.jpg> teksturalar
# Namunaning yorliqsiz qismi kesiladi, yorug'lik notekisligi tekislanadi; Blender'da ko'zgu-takrorlash bilan ~0.30 × 0.24 m qilib qo'yiladi.
import sys, numpy as np
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB').crop((75, 445, 415, 725))
a = np.asarray(im).astype(np.float32)
L = a.mean(axis=2)
past = np.asarray(Image.fromarray(np.clip(L, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(40))).astype(np.float32) + 1
res = a * (np.median(L) / past)[..., None]
Image.fromarray(np.clip(res, 0, 255).astype(np.uint8)).resize((680, 560), Image.LANCZOS).save(f'{out}/praza_677.jpg', quality=93)
print('ok', np.median(res.reshape(-1, 3), axis=0).round())
