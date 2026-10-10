import sys,os; sys.path.insert(0,'.')
from lib import *
from deco import strip, polystrip, ggg, GOLD, GREEN
from film import apply_film, H_8294, H_8296, POLY_8294, POLY_8296, REGION_8294, REGION_8296, LINES_8296
exec(open('build2.py').read().split("for st,nm in")[0].replace("OUT='out2'","OUT='out5'"))
os.makedirs('out5',exist_ok=True)
def save(o,name):
    o.save(f'{OUT}/{name}_full.jpg',quality=96,subsampling=0)
    t=o.copy(); t.thumbnail((2400,2400)); t.save(f'{OUT}/{name}.jpg',quality=90)

def band_layer(size, quad, pos=0.42, logo_h=0.56, canvas=(4400,400)):
    cw,ch=canvas
    can=Image.new('RGBA',(cw,ch),(0,0,0,0)); line_=Image.new('RGBA',(cw,ch),(0,0,0,0))
    dl=ImageDraw.Draw(line_)
    dl.rectangle([0,ch-46,cw,ch-35],fill=GOLD+(255,)); dl.rectangle([0,ch-34,cw,ch-13],fill=(0,181,51,255)); dl.rectangle([0,ch-12,cw,ch-1],fill=GOLD+(255,))
    logo=Image.open(S+'/r/inline-on-light.png').convert('RGBA')
    lh=int(ch*logo_h); lw=round(logo.width*lh/logo.height); logo=logo.resize((lw,lh),Image.LANCZOS)
    L3,pad=letters(logo,depth=7)
    xy=(int(cw*pos)-lw//2-pad,(ch-46-lh)//2-pad-6)
    can.alpha_composite(line_); can.alpha_composite(L3,xy)
    lo=Image.new('RGBA',(cw,ch),(0,0,0,0)); lo.alpha_composite(logo,(xy[0]+pad,xy[1]+pad))
    return warp(can,quad,size), warp(lo,quad,size), warp(line_,quad,size)

def fascia_em(size, face, logo_h=0.47, pw=2000, ph=360):
    c=Image.new('RGBA',(pw,ph),(0,0,0,0))
    ImageDraw.Draw(c).rectangle([0,ph-14,pw,ph-4],fill=(0,181,51,255))
    logo=Image.open(S+'/r/inline-on-dark.png').convert('RGBA')
    lh=int(ph*logo_h); lw=round(logo.width*lh/logo.height); logo=logo.resize((lw,lh),Image.LANCZOS)
    c.alpha_composite(logo,((pw-lw)//2,(ph-14-lh)//2-4))
    return warp(c,face,size)

def fascia_em_silver(N, face, logo_h=0.47, pw=2000, ph=360):
    size=N.size
    logo=Image.open(S+'/r/inline-on-light.png').convert('RGBA')
    lh=int(ph*logo_h); lw=round(logo.width*lh/logo.height); logo=logo.resize((lw,lh),Image.LANCZOS)
    xy=((pw-lw)//2,(ph-38-lh)//2-4)
    c=Image.new('RGBA',(pw,ph),(0,0,0,0)); c.alpha_composite(logo,xy)
    mk=Image.new('RGBA',(pw,ph),(0,0,0,0)); split=int(lw*60/423.8); mk.alpha_composite(logo.crop((0,0,split,lh)),xy)
    ln=Image.new('RGBA',(pw,ph),(0,0,0,0)); ImageDraw.Draw(ln).rectangle([0,ph-27,pw,ph-12],fill=(0,181,51,255))
    lo=warp(c,face,size); mw=warp(mk,face,size); lw_=warp(ln,face,size)
    a=np.asarray(lo.split()[3],float)/255.
    halo=np.asarray(lo.split()[3].filter(ImageFilter.GaussianBlur(14)),float)/255.
    N.light(np.ones_like(a)*np.asarray(poly_mask(size,face,1),float)/255.*0.55,(235,240,250),1.2)   # box face lit from inside edges
    N.add(np.ones_like(N.E)*np.array([240,246,255]),np.clip(halo*2.2,0,1)*0.9)
    N.add(np.ones_like(N.E)*np.array([18,18,18]),a)
    N.layer(mw,1.0); N.layer(lw_,1.0)

def disc_em(size, ell):
    cx,cy,rx,ry=ell
    disc=Image.new('RGBA',(1000,1000),(0,0,0,0)); dd=ImageDraw.Draw(disc)
    dd.ellipse([40,40,959,959],fill=(250,250,248,255))
    mk=Image.open(S+'/r/mark.png').convert('RGBA').resize((560,560),Image.LANCZOS); disc.alpha_composite(mk,(220,220))
    return warp(disc,[(cx-rx,cy-ry),(cx+rx,cy-ry),(cx+rx,cy+ry),(cx-rx,cy+ry)],size)

def led_em(size, q):
    xs=[p[0] for p in q]; ys=[p[1] for p in q]
    lw_=int(max(xs)-min(xs))*2; lh_=int(max(ys)-min(ys))*2
    led=led_panel('PDP Academy’ga xush kelibsiz!',size=(lw_,lh_),grid=(int(38*lw_/lh_),38)).convert('RGBA')
    led.putalpha(255); return warp(led,q,size)

class Night:
    def __init__(s,day,orig):
        s.day=np.asarray(day,float); s.orig=np.asarray(orig,float)/255.
        H,W=s.day.shape[:2]; s.E=np.zeros((H,W,3)); s.A=np.zeros((H,W)); s.size=(W,H)
    def add(s,rgb,alpha,gain=1.0):
        a=np.clip(alpha,0,1); s.E=s.E*(1-a[...,None])+np.asarray(rgb,float)*gain*a[...,None]; s.A=np.maximum(s.A,a)
    def layer(s,rgba,gain=1.0):
        a=np.asarray(rgba,float); s.add(a[...,:3],a[...,3]/255.,gain)
    def warm(s,poly,strength=0.55,color=(255,196,130)):
        m=np.asarray(poly_mask(s.size,poly,14),float)/255.
        L=s.orig.mean(-1); w=m*strength
        s.add((0.25+0.85*L)[...,None]*np.array(color),w)
    def light(s,alpha,color=(255,236,205),gain=1.0):
        # facade lit by a fixture: keeps the material texture of the day image
        s.add(s.day*np.array(color)/255.*gain,np.clip(alpha,0,1))
    def line(s,pts,color=(40,255,120),width=6,glow=True):
        m=Image.new('L',s.size,0); ImageDraw.Draw(m).line(pts,fill=255,width=width,joint='curve')
        m=np.asarray(m.filter(ImageFilter.GaussianBlur(1)),float)/255.
        s.add(np.ones_like(s.E)*np.array(color),m)
    def cone(s,x,yb,yt,w0,w1,amax=0.75,color=(255,232,195),gain=1.25):
        m=Image.new('L',s.size,0)
        ImageDraw.Draw(m).polygon([(x-w0,yb),(x+w0,yb),(x+w1,yt),(x-w1,yt)],fill=255)
        m=np.asarray(m.filter(ImageFilter.GaussianBlur((w1-w0)*0.25)),float)/255.
        H=s.size[1]; yy=np.arange(H)[:,None]
        grad=np.clip((yy-yt)/max(yb-yt,1),0,1)**1.3
        s.light(m*grad*amax,color,gain)
    def keep(s,mask,gain=0.95):
        s.add(s.day,mask,gain)
    def render(s):
        o=s.orig; H,W=o.shape[:2]
        base=s.day*0.13*np.array([0.78,0.88,1.25])
        L=o.mean(-1); sat=(o.max(-1)-o.min(-1))/(o.max(-1)+1e-6)
        sky=((o[...,2]-o[...,0])>0.22)&(sat>0.28)&(L>0.5)
        sky=np.cumprod(sky,axis=0).astype(bool)   # only sky that is connected to the top edge
        sky=np.asarray(Image.fromarray((sky*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)),float)/255.
        yy=np.linspace(0,1,H)[:,None]
        skyc=np.stack([10+22*yy,16+26*yy,38+40*yy],-1)*np.ones((1,W,1))
        base=base*(1-sky[...,None])+skyc*sky[...,None]
        em=s.E*s.A[...,None]
        out=base*(1-s.A[...,None])+em
        e=Image.fromarray(np.clip(em,0,255).astype(np.uint8))
        g1=np.asarray(e.filter(ImageFilter.GaussianBlur(40)),float); g2=np.asarray(e.filter(ImageFilter.GaussianBlur(9)),float)
        out=out+g1*0.9+g2*0.45
        return Image.fromarray(np.clip(out,0,255).astype(np.uint8))

def galeria_mask(day):
    a=np.asarray(day,float)/255.; r,g,b=a[...,0],a[...,1],a[...,2]
    sat=(a.max(-1)-a.min(-1))/(a.max(-1)+1e-6)
    blue=(b>r*1.7)&(b>g*1.35)&(b>0.35)&(sat>0.5)
    bm=Image.fromarray((blue*255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5))
    near=np.asarray(bm.filter(ImageFilter.MaxFilter(9)),float)/255.
    white=(a.mean(-1)>0.8)&(near>0)
    return np.clip(np.asarray(bm,float)/255.+white,0,1)

def bright_in(day,poly,thr=0.55):
    a=np.asarray(day,float)/255.; m=np.asarray(poly_mask(day.size,poly,2),float)/255.
    return m*np.clip((a.mean(-1)-thr)/0.2,0,1)

T=lambda pts:[(x*2.52,y*2.52) for x,y in pts]
GABLE_U=T([(436,528),(436,472),(560,378),(640,378),(748,474),(752,556)])
def gable_mark_layer(size):
    cx,cy,d=598*2.52,468*2.52,100*2.52
    c=Image.new('RGBA',size,(0,0,0,0))
    mk=Image.open('r/mark.png').convert('RGBA').resize((int(d),int(d)),Image.LANCZOS)
    c.paste(mk,(int(cx-d/2),int(cy-d/2)),mk); return c


def band_wash_x(N,quad):
    cw,ch=1000,100
    g=np.zeros((ch,cw)); g[:]=np.clip(1-np.arange(ch)[:,None]/(ch*0.75),0,1)**1.5
    c=Image.fromarray((g*255).astype(np.uint8)).convert('L')
    rgba=Image.merge('RGBA',[c,c,c,c])
    w=np.asarray(warp(rgba,quad,N.size).split()[3],float)/255.
    N.light(w*0.55,(255,240,215),1.3)
    q=quad; N.line([q[0],q[1]],(255,246,228),7)

LED=(40,255,120)
def chevron(N,pts_outer,pts_inner,sc=2.52):
    N.line([(x*sc,y*sc) for x,y in pts_outer],LED,8)
    N.line([(x*sc,y*sc) for x,y in pts_inner],LED,6)

def deco_8300(o):
    o=strip(o,(552,146),(345,1170),(1,0),ggg(12,30))          # left corner of the portal block
    o=strip(o,(2363,146),(2495,1162),(-1,0),ggg(12,30))       # right corner
    o=strip(o,(567,163),(2359,151),(0,1),ggg(12,30))          # under the coping
    return o
def deco_8296(o):
    o=strip(o,(878,210),(800,1008),(1,0),ggg(9,22))
    o=strip(o,(2000,547),(2030,1153),(-1,0),ggg(9,22))
    o=strip(o,(900,302),(1435,417),(0,1),ggg(9,22)); o=strip(o,(1595,467),(1995,582),(0,1),ggg(9,22))
    # gold frame around the window opening, following the steps
    o=polystrip(o,[(2702,1196),(3402,1268),(3825,1328)],9)
    o=polystrip(o,[(2706,1196),(2706,1290),(2603,1300),(2580,1396),(2492,1408),(2488,1694),(3400,1684)],9)
    o=polystrip(o,[(3825,1328),(3828,1497)],9)
    return o
def deco_8294(o):
    o=polystrip(o,[(1345,1236),(1430,1232),(3300,1091),(3503,1073)],12)
    o=polystrip(o,[(1347,1236),(1344,1442),(1132,1444),(1130,1601),(987,1606),(905,1932),(1742,1928)],12)
    o=polystrip(o,[(3505,1073),(3508,1565)],12)
    return o
# ---------- wide view (8296) ----------
im=Image.open('img/IMG_8296_full.jpg').convert('RGB'); size=im.size
a=np.asarray(im,float)/255.; sat=(a.max(-1)-a.min(-1))/(a.max(-1)+1e-6)
leaves=(a[...,1]>a[...,0]*1.04)&(a[...,1]>a[...,2]*1.05)&(sat>0.25)
leafprot=1-np.asarray(Image.fromarray((leaves*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.5)),float)/255.
o=fascia2(im,'silver',**U)
regU,rightU=REGION_8296(size)
o,glassU,filmU=apply_film(o,H_8296(),regU,protect=leafprot,lines=LINES_8296,nohole=rightU)
bl,blogo,bline=band_layer(size,BAND_U)
prot=band_protect(o)
for L_ in (bl,):
    al=np.asarray(L_.split()[3],float)*prot; L_.putalpha(Image.fromarray(al.astype(np.uint8)))
o.paste(bl,(0,0),bl)
o=flag_U(o)
gm=gable_mark_layer(size); o.paste(gm,(0,0),gm)
o=deco_8296(o)
save(o,'umumiy_kun')
N=Night(o,im)
N.keep(galeria_mask(o))
N.keep(bright_in(o,T([(870,700),(1420,700),(1420,930),(870,930)]),0.5),0.6)
N.warm(T([(440,672),(805,668),(806,1040),(440,1044)]),0.32)
N.warm(GABLE_U,0.4)
N.add(filmU*1.1+np.array([14,11,8]),glassU*0.92)
N.layer(gm,1.0)
fascia_em_silver(N,U['face'],U['logo_h'])
N.layer(led_em(size,U['led_quad']))
N.layer(disc_em(size,U['blade_ell']))
halo=np.asarray(blogo.split()[3].filter(ImageFilter.GaussianBlur(22)),float)/255.*prot
N.add(np.ones_like(N.E)*np.array([235,245,255]),np.clip(halo*2.2,0,1)*0.9)
lo_a=np.asarray(blogo.split()[3],float)/255.*prot
N.add(np.ones_like(N.E)*np.array([18,18,18]),lo_a)       # letters stay dark in front of the halo
ln=np.asarray(bline,float); N.add(ln[...,:3],ln[...,3]/255.*prot)
band_wash_x(N,BAND_U)
chevron(N,[(316,405),(445,405),(546,293),(655,291),(768,409),(828,410)],[(437,472),(556,349),(645,349),(750,470)])
N.cone(1005,1345,640,25,250); N.cone(2010,1395,700,25,250)
N.line([POLY_8296[0],POLY_8296[1]],(225,240,255),6)
save(N.render(),'umumiy_kech')

# ---------- second floor (8294) ----------
im=Image.open('img/IMG_8294_full.jpg').convert('RGB'); size=im.size
o,glassQ,filmQ=apply_film(im,H_8294(),REGION_8294(size))
bq=[(650,969),(3520,427),(3520,850),(650,1216)]
bl,blogo,bline=band_layer(size,bq)
o.paste(bl,(0,0),bl)
o=flag_Q(o)
o=deco_8294(o)
save(o,'qavat_kun')
N=Night(o,im)
N.keep(galeria_mask(o))
N.keep(bright_in(o,[(0,2000),(3600,1980),(3600,2750),(0,2750)],0.5),0.6)
N.add(filmQ*1.1+np.array([14,11,8]),glassQ*0.92)
halo=np.asarray(blogo.split()[3].filter(ImageFilter.GaussianBlur(26)),float)/255.
N.add(np.ones_like(N.E)*np.array([235,245,255]),np.clip(halo*2.2,0,1)*0.9)
N.add(np.ones_like(N.E)*np.array([18,18,18]),np.asarray(blogo.split()[3],float)/255.)
ln=np.asarray(bline,float); N.add(ln[...,:3],ln[...,3]/255.)
band_wash_x(N,bq)
N.line([POLY_8294[0],POLY_8294[1]],(225,240,255),6)
save(N.render(),'qavat_kech')

# ---------- entrance (8300) ----------
im=Image.open('img/IMG_8300_full.jpg').convert('RGB'); size=im.size
o=fascia2(im,'silver',**K)
o=deco_8300(o)
save(o,'kirish_kun')
N=Night(o,im)
N.keep(galeria_mask(o))
N.warm([(990,1050),(1830,1050),(1830,1585),(990,1585)],0.38)
N.warm([(560,2290),(2120,2290),(2120,3700),(560,3700)],0.42)
fascia_em_silver(N,K['face'])
N.layer(led_em(size,K['led_quad']))
N.layer(disc_em(size,K['blade_ell']))
chevron(N,[(135,463),(290,463),(472,254),(642,254),(860,462),(990,462)],[(292,585),(500,330),(636,330),(836,585)])
N.cone(470,1595,560,30,330); N.cone(2290,1610,560,30,330)
save(N.render(),'kirish_kech')
print('done')
