import sys,os; sys.path.insert(0,'.')
from lib import *
OUT='out3'
def save(o,name):
    o.save(f'{OUT}/{name}_full.jpg',quality=92)
    t=o.copy(); t.thumbnail((1800,1800)); t.save(f'{OUT}/{name}.jpg',quality=86)
base=Image.open(f'{OUT}/umumiy_kun_full.jpg').convert('RGB')
src=np.asarray(Image.open('img/IMG_8296_full.jpg').convert('RGB'),float)
r,g,b=src[...,0],src[...,1],src[...,2]
trim=((b-g)<(g-r)*0.9)&(g>r+6)&(g>45)&(g<235)&((src.max(-1)-src.min(-1))<70)
T=lambda pts:[(x*2.52,y*2.52) for x,y in pts]
W,H=base.size
outer=np.asarray(poly_mask((W,H),T([(305,392),(447,392),(545,286),(657,286),(767,402),(828,402),(828,520),(760,520),(760,560),(305,560)])))>0
glass=np.asarray(poly_mask((W,H),T([(436,528),(436,472),(560,378),(640,378),(748,474),(752,556),(436,556)])))>0
fasc=np.asarray(poly_mask((W,H),T([(372,530),(820,530),(822,700),(372,700)])))>0
m=Image.fromarray(((trim&outer)*255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5))
m=m.filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.MinFilter(21))   # close gaps from sunlit highlights
m=np.asarray(m)>0
band=np.asarray(poly_mask((W,H),T([(316,405),(445,405),(546,293),(655,291),(768,409),(828,410),(828,456),(752,456),(750,470),(645,349),(556,349),(437,472),(437,456),(316,456)])))>0
Ls=src.mean(-1)/255.
clad=((b-g)>(g-r)*0.9)&(b>g+12)&(Ls<0.86)
clad=np.asarray(Image.fromarray((clad*255).astype(np.uint8)).filter(ImageFilter.MedianFilter(7)))>0
diag=np.asarray(poly_mask((W,H),T([(650,314),(742,410),(744,458),(647,358)])))>0
diag|=np.asarray(poly_mask((W,H),T([(544,302),(454,405),(441,460),(554,354)])))>0
m=(m|(band&~clad)|diag)&outer&~glass&~fasc
m=np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.MedianFilter(7)))>0
tmi=Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
for col,nm in (((26,27,29),'qora'),((0,181,51),'yashil')):
    o=shade_fill(base,tmi,col,ref_lum=0.55,strength=0.55,lo=0.55,hi=1.2)
    save(o,f'devor_{nm}')
print('done4')
