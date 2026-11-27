# Koworking sahnasi: taroq (qovurg'ali yog'och panel) namunasi (buyurtmachi rasmi, 27.11) → tekstura (yog'och tolasi, tik).
# Ishlatish: python teksturalar-taroq.py <rasm: taroq-namuna.jpg> teksturalar
# Namunadagi keng (baland) qovurg'a kesiladi, yorug'lik notekisligi tekislanadi; Blender'da ko'zgu-takrorlash bilan qo'yiladi.
# Profil (rasmdagi ustunlar yorqinligidan, planka eni ~120 mm): baland/past qovurg'alar navbatma-navbat — blender-sahna.py da.
import sys, numpy as np
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB').crop((395, 150, 540, 1850))
a = np.asarray(im).astype(np.float32)
L = a.mean(axis=2)
past = np.asarray(Image.fromarray(np.clip(L, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(30))).astype(np.float32) + 1
res = a * (np.median(L) / past)[..., None]
# qator bo'ylab rang tekislanadi (ko'zgu-takrorlashda yotiq yo'llar ko'rinmasin)
qator = res.mean(axis=1, keepdims=True)
qator = np.asarray([np.convolve(qator[:, 0, c], np.ones(60) / 60, mode='same') for c in range(3)]).T[:, None, :]
res = (res * (np.median(res.reshape(-1, 3), axis=0) / np.maximum(qator, 1)))[40:-40]     # chetlar (o'rtacha buzilgan) kesiladi
Image.fromarray(np.clip(res, 0, 255).astype(np.uint8)).resize((145, 1620), Image.LANCZOS).save(f'{out}/taroq.jpg', quality=93)
print('ok', np.median(res.reshape(-1, 3), axis=0).round())
