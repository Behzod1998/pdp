import sys; sys.path.insert(0,'.')
from lib import *
OUT='out2'
import os; os.makedirs(OUT,exist_ok=True)
def save(o,name):
    o.save(f'{OUT}/{name}_full.jpg',quality=92)
    t=o.copy(); t.thumbnail((1800,1800)); t.save(f'{OUT}/{name}.jpg',quality=86)
FLAG=flag_design()
K=dict(bbox=(315,1580,2385,2185),
  shell=[(390,1590),(2353,1600),(2357,1666),(2337,1702),(2373,2060),(2352,2100),(487,2102),(457,2171),(328,2043),(400,1687),(378,1656)],
  lip=[(378,1652),(2357,1662),(2340,1716),(398,1694)],
  face=[(400,1689),(2337,1712),(2373,2058),(328,2042)],
  blade_box=[(2115,2064),(2395,2064),(2395,2300),(2115,2300)],blade_ell=(2254,2166,128,126),
  led_quad=[(887,2130),(1813,2130),(1813,2263),(873,2263)])
U=dict(bbox=(930,1330,2085,1700),
  shell=[(948,1346),(2058,1398),(2072,1648),(943,1650)],
  lip=[(950,1352),(2056,1402),(2056,1412),(958,1404)],
  face=[(960,1405),(2055,1410),(2070,1645),(945,1645)],
  blade_box=[(2000,1640),(2110,1640),(2110,1770),(2000,1770)],blade_ell=(2061,1705,46,52),
  led_quad=[(1310,1687),(1823,1679),(1827,1748),(1311,1772)],logo_h=0.5)
BAND_U=[(2085,806),(3800,1128),(3800,1304),(2085,1020)]

def band_protect(o):
    a=np.asarray(o,float)/255.; L=a.mean(-1); sat=(a.max(-1)-a.min(-1))/(a.max(-1)+1e-6)
    p=np.clip((L-0.42)/0.1,0,1)*np.clip((0.3-sat)/0.1,0,1)
    return np.asarray(Image.fromarray((p*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)),float)/255.

def flag_U(o):
    a=np.asarray(o,float)/255.; L=a.mean(-1); sat=(a.max(-1)-a.min(-1))/(a.max(-1)+1e-6)
    H,W=L.shape; yy=np.arange(H)[:,None]*np.ones((1,W))
    leaves=(a[...,1]>a[...,2]*1.1)&(a[...,1]>a[...,0]*1.04)&(sat>0.3)&(L>0.33)
    fence=(L<0.11)&(yy>2560)
    occ=Image.fromarray(((leaves|fence)*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1))
    prot=1-np.asarray(occ,float)/255.
    quad=[(2932,1309),(3394,1293),(3734,2744),(3360,2760)]
    poly=[(2934,1322),(3392,1306),(3734,2744),(3360,2760)]
    return paint_flag(o,poly,quad,FLAG,protect=prot,shade=0.35,blur=30,expo=0.7)

def flag_Q(o):
    d=lambda X,Y:(300+X/2,1900+Y/2)
    poly=[d(*p) for p in [(835,180),(724,500),(556,1000),(355,1600),(130,1600),(230,1100),(330,700),(400,490),(480,400),(560,330),(700,250)]]
    quad=[d(430,330),d(835,150),d(355,1600),d(130,1600)]
    return paint_flag(o,poly,quad,FLAG,shade=0.55,blur=10,expo=0.92)

for st,nm in (('black','qora'),('white','oq'),('green','yashil')):
    im=Image.open('img/IMG_8300_full.jpg').convert('RGB')
    save(fascia2(im,st,**K),f'kirish_{nm}')
    im=Image.open('img/IMG_8296_full.jpg').convert('RGB')
    o=fascia2(im,st,**U)
    o=band_sign(o,BAND_U,pos=0.42,protect=band_protect(o))
    o=flag_U(o)
    save(o,f'umumiy_{nm}')
im=Image.open('img/IMG_8294_full.jpg').convert('RGB')
o=band_sign(im,[(650,969),(3520,427),(3520,850),(650,1216)],pos=0.42)
save(flag_Q(o),'qavat')

# --- wall variants on the wide view (black fascia) ---
base=Image.open(f'{OUT}/umumiy_qora_full.jpg').convert('RGB')
src=np.asarray(Image.open('img/IMG_8296_full.jpg').convert('RGB'),float)
r,g,b=src[...,0],src[...,1],src[...,2]
trim=((b-g)<(g-r)*0.9)&(g>r+6)&(g>45)&(g<235)&((src.max(-1)-src.min(-1))<70)
T=lambda pts:[(x*2.52,y*2.52) for x,y in pts]
W,H=base.size
outer=np.asarray(poly_mask((W,H),T([(305,392),(447,392),(545,286),(657,286),(767,402),(828,402),(828,520),(760,520),(760,560),(305,560)])))>0
glass=np.asarray(poly_mask((W,H),T([(436,528),(436,472),(560,378),(640,378),(748,474),(752,556),(436,556)])))>0
fasc=np.asarray(poly_mask((W,H),T([(372,530),(820,530),(822,700),(372,700)])))>0
tm=trim&outer&~glass&~fasc
tmi=Image.fromarray((tm*255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
def gable_mark(o):
    cx,cy,d=598*2.52,468*2.52,100*2.52
    mk=Image.open('r/mark.png').convert('RGBA').resize((int(d),int(d)),Image.LANCZOS)
    a_=np.asarray(mk,float); a_[...,3]*=0.9
    mk=Image.fromarray(a_.astype(np.uint8))
    o=o.copy(); o.paste(mk,(int(cx-d/2),int(cy-d/2)),mk); return o
for col,nm in (((26,27,29),'qora'),((0,181,51),'yashil')):
    o=shade_fill(base,tmi,col,ref_lum=0.55,strength=0.7,lo=0.45,hi=1.3)
    save(gable_mark(o),f'devor_{nm}')
