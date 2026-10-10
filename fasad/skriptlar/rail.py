import sys,os; sys.path.insert(0,'.')
from lib import *
GOLD=(176,134,38); GREEN=(0,181,51); GDONE=(0,166,3)
os.makedirs('zina/out',exist_ok=True)

def panel_canvas(word, w=1600, h=1000, mark=True):
    c=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(c)
    bh=int(h*0.085); y0=h-int(h*0.13)
    d.rectangle([0,y0,w,y0+int(bh*0.18)],fill=GOLD+(255,))
    d.rectangle([0,y0+int(bh*0.18),w,y0+int(bh*0.82)],fill=GREEN+(255,))
    d.rectangle([0,y0+int(bh*0.82),w,y0+bh],fill=GOLD+(255,))
    if word:
        fs=int(h*0.2)
        while True:
            f=font(fs,500); bb=d.textbbox((0,0),word,font=f)
            if bb[2]-bb[0]<w*0.62 or fs<20: break
            fs-=4
        d.text((int(w*0.07)-bb[0], int(h*0.5)-(bb[3]-bb[1])//2-bb[1]),word,font=f,fill=GDONE+(255,))
    if mark:
        D=int(h*0.22); mk=Image.open(S+'/r/mark.png').convert('RGBA').resize((D,D),Image.LANCZOS)
        c.alpha_composite(mk,(w-D-int(w*0.06),int(h*0.5)-D//2))
    return c

def frost(im, region_poly, pad=60):
    W,H=im.size
    xs=[p[0] for p in region_poly]; ys=[p[1] for p in region_poly]
    box=(max(0,int(min(xs))-pad),max(0,int(min(ys))-pad),min(W,int(max(xs))+pad),min(H,int(max(ys))+pad))
    cr=im.crop(box).filter(ImageFilter.MedianFilter(21)).filter(ImageFilter.GaussianBlur(40))
    full=im.copy(); full.paste(cr,box[:2])
    a=np.asarray(full,float)
    return a*0.2+np.array([238,242,240])*0.8

def glass(im, panels):
    """panels: list of (poly, quad, word)."""
    out=np.asarray(im,float).copy(); W,H=im.size
    for poly,quad,word in panels:
        fr=frost(im,poly)
        m=np.asarray(poly_mask((W,H),poly,1.0),float)/255.
        out=out*(1-m[...,None]*0.93)+fr*(m[...,None]*0.93)
        g=warp(panel_canvas(word),quad,(W,H)); ga=np.asarray(g,float); al=ga[...,3:4]/255.*m[...,None]*0.95
        out=out*(1-al)+ga[...,:3]*al
        e=Image.new('L',(W,H),0); ImageDraw.Draw(e).line(poly+[poly[0]],fill=255,width=4)
        ea=np.asarray(e.filter(ImageFilter.GaussianBlur(1)),float)/255.*0.55
        out=out*(1-ea[...,None])+np.array([250,252,252])*ea[...,None]
    return Image.fromarray(np.clip(out,0,255).astype(np.uint8))

def posts(im, polys, color=(46,49,54), full=()):
    a=np.asarray(im,float)/255.; L=a.mean(-1); warm=(a[...,0]-a[...,2])
    for p in polys:
        r=np.asarray(poly_mask(im.size,p),float)/255.
        sat=(a.max(-1)-a.min(-1))/(a.max(-1)+1e-6)
        cream=((L>0.3)&(sat<0.35)).astype(float)
        cm=Image.fromarray((r*cream*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1))
        im=shade_fill(im,cm,color,ref_lum=None,strength=0.6,lo=0.6,hi=1.5)
    for p in full:
        im=shade_fill(im,poly_mask(im.size,p,1),color,ref_lum=None,strength=0.6,lo=0.6,hi=1.5)
    return im

def lerp(p,q,t): return (p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t)
def save(o,n):
    o.save(f'zina/out/{n}_full.jpg',quality=95,subsampling=0)
    t=o.copy(); t.thumbnail((1800,1800)); t.save(f'zina/out/{n}.jpg',quality=88)

R=lambda x0,y0,x1,y1:[(x0,y0),(x1,y0),(x1,y1),(x0,y1)]
# ---- z5 hall ----
im=Image.open('zina/z5.jpg').convert('RGB')
T0,T1=(725,590),(1250,752); B0,B1=(725,780),(1250,1025)
tx=lambda x:(x-725)/525
P2a=[T0,lerp(T0,T1,tx(931)),lerp(B0,B1,tx(931)),B0]
P2b=[lerp(T0,T1,tx(945)),T1,B1,lerp(B0,B1,tx(945))]
P1=[(589,612),(711,582),(711,757),(589,765)]
P3=[(1282,752),(1934,645),(1934,995),(1282,1018)]
P5=[(1035,1160),(1078,1128),(1215,1203),(1035,1312)]
o=glass(im,[(P1,P1,'</>'),(P2a,P2a,'O‘rgan'),(P2b,P2b,'Yarat'),(P3,P3,'Kelajak kodda'),(P5,[(1035,1128),(1215,1128),(1215,1312),(1035,1312)],None)])
o=posts(o,[R(572,590,592,792),R(708,534,731,764),R(928,624,947,817),R(1243,708,1284,1064),R(1930,580,1997,1082),R(1014,1124,1036,1338)])
save(o,'zal')
# ---- z3 landing ----
im=Image.open('zina/z3.jpg').convert('RGB')
Pb=[(955,560),(2100,397),(2100,1430),(1032,1032)]
Pl=[(640,605),(900,555),(966,1020),(640,930)]
o=glass(im,[(Pb,Pb,'Har kuni +1%'),(Pl,Pl,'Debug')])
o=posts(o,[[(898,505),(960,505),(1045,1085),(962,1092)],[(600,575),(640,575),(645,945),(605,945)]],
   full=[[(2112,255),(2240,255),(2240,1580),(2116,1580)],[(2043,240),(2110,216),(2232,206),(2272,213),(2272,242),(2112,264),(2043,280)],[(2045,1618),(2092,1570),(2240,1572),(2306,1630),(2210,1706),(2105,1680)]])
import math
bm=Image.new('L',o.size,0); ImageDraw.Draw(bm).ellipse([2104,104,2192,198],fill=255); ImageDraw.Draw(bm).rectangle([2125,185,2210,215],fill=255)
o=shade_fill(o,bm.filter(ImageFilter.GaussianBlur(1)),(46,49,54),ref_lum=None,strength=0.6,lo=0.6,hi=1.5)
save(o,'maydoncha')
# ---- z4 stairs ----
im=Image.open('zina/z4.jpg').convert('RGB')
D=lambda pts:[(1100+x*1.288,y*1.288) for x,y in pts]
Ps=D([(140,282),(448,962),(383,1872),(108,640)])
o=glass(im,[(Ps,Ps,'Bugun boshla')])
o=posts(o,[D([(472,826),(553,826),(592,912),(540,935),(442,2322),(350,2320),(445,930),(430,905)])])
save(o,'zina')
print('ok')
