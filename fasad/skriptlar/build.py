import sys; sys.path.insert(0,'.')
from lib import *
def save(out,name):
    out.save(f'out/{name}_full.jpg',quality=93)
    t=out.copy(); t.thumbnail((1800,1800)); t.save(f'out/{name}.jpg',quality=88)
# 1) entrance close-up
im=Image.open('img/IMG_8300_full.jpg').convert('RGB')
o=fascia(im,(315,1580,2385,2185),
  [(390,1590),(2353,1600),(2357,1666),(2337,1702),(2373,2060),(2352,2100),(487,2102),(457,2171),(328,2043),(400,1687),(378,1656)],
  [(378,1652),(2357,1662),(2340,1716),(398,1694)],
  [(400,1689),(2337,1712),(2373,2058),(328,2042)],
  [(2115,2064),(2395,2064),(2395,2300),(2115,2300)],(2254,2166,128,126))
save(o,'1_kirish')
# 2) second floor
im=Image.open('img/IMG_8294_full.jpg').convert('RGB')
o=band_sign(im,[(650,969),(3520,427),(3520,850),(650,1216)],pos=0.42)
save(o,'2_ikkinchi_qavat')
# 3) wide view: entrance + second floor
im=Image.open('img/IMG_8296_full.jpg').convert('RGB')
o=fascia(im,(930,1330,2085,1700),
  [(948,1346),(2058,1398),(2072,1648),(943,1650)],
  [(950,1352),(2056,1402),(2056,1412),(958,1404)],
  [(960,1405),(2055,1410),(2070,1645),(945,1645)],
  [(2000,1640),(2110,1640),(2110,1770),(2000,1770)],(2061,1705,46,52),logo_h=0.5)
a=np.asarray(o,float)/255.; L=a.mean(-1); sat=(a.max(-1)-a.min(-1))/(a.max(-1)+1e-6)
prot=np.clip((L-0.42)/0.1,0,1)*np.clip((0.3-sat)/0.1,0,1)
prot=np.asarray(Image.fromarray((prot*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)),float)/255.
o=band_sign(o,[(2085,806),(3800,1128),(3800,1304),(2085,1020)],pos=0.42,protect=prot)
save(o,'3_umumiy')
