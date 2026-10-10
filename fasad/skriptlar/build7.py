import sys,os; sys.path.insert(0,'.')
from lib import *
from film import apply_film, H_8294, H_8296, POLY_8294, POLY_8296, REGION_8294, REGION_8296, LINES_8296
exec(open('build2.py').read().split("for st,nm in")[0].replace("OUT='out2'","OUT='out4'"))
os.makedirs('out4',exist_ok=True)
def save(o,name):
    o.save(f'{OUT}/{name}_full.jpg',quality=96,subsampling=0)
    t=o.copy(); t.thumbnail((2400,2400)); t.save(f'{OUT}/{name}.jpg',quality=90)

def band_layer(size, quad, pos=0.42, logo_h=0.56, canvas=(4400,400)):
    cw,ch=canvas
    can=Image.new('RGBA',(cw,ch),(0,0,0,0)); line_=Image.new('RGBA',(cw,ch),(0,0,0,0))
    ImageDraw.Draw(line_).rectangle([0,ch-22,cw,ch-6],fill=(0,181,51,255))
    logo=Image.open(S+'/r/inline-on-light.png').convert('RGBA')
    lh=int(ch*logo_h); lw=round(logo.width*lh/logo.height); logo=logo.resize((lw,lh),Image.LANCZOS)
    L3,pad=letters(logo,depth=7)
    xy=(int(cw*pos)-lw//2-pad,(ch-22-lh)//2-pad-6)
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
# ---------- wide view (8296) ----------
im=Image.open('img/IMG_8296_full.jpg').convert('RGB'); size=im.size
a=np.asarray(im,float)/255.; sat=(a.max(-1)-a.min(-1))/(a.max(-1)+1e-6)
leaves=(a[...,1]>a[...,0]*1.04)&(a[...,1]>a[...,2]*1.05)&(sat>0.25)
leafprot=1-np.asarray(Image.fromarray((leaves*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.5)),float)/255.
o=fascia2(im,'black',**U)
regU,rightU=REGION_8296(size)
o,glassU,filmU=apply_film(o,H_8296(),regU,protect=leafprot,lines=LINES_8296,nohole=rightU)
bl,blogo,bline=band_layer(size,BAND_U)
prot=band_protect(o)
for L_ in (bl,):
    al=np.asarray(L_.split()[3],float)*prot; L_.putalpha(Image.fromarray(al.astype(np.uint8)))
o.paste(bl,(0,0),bl)
o=flag_U(o)
gm=gable_mark_layer(size); o.paste(gm,(0,0),gm)
save(o,'umumiy_kun')
N=Night(o,im)
N.keep(galeria_mask(o))
N.keep(bright_in(o,T([(870,700),(1420,700),(1420,930),(870,930)]),0.5),0.6)
N.warm(T([(440,672),(805,668),(806,1040),(440,1044)]),0.32)
N.warm(GABLE_U,0.4)
N.add(filmU*1.1+np.array([14,11,8]),glassU*0.92)
N.layer(gm,1.0)
N.layer(fascia_em(size,U['face'],U['logo_h']))
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

for st,nm in (('white','oq'),('green','yashil')):
    im2=Image.open('img/IMG_8296_full.jpg').convert('RGB')
    o2=fascia2(im2,st,**U)
    o2,_,_=apply_film(o2,H_8296(),regU,protect=leafprot,lines=LINES_8296,nohole=rightU)
    bl2,_,_=band_layer(size,BAND_U); al=np.asarray(bl2.split()[3],float)*band_protect(o2); bl2.putalpha(Image.fromarray(al.astype(np.uint8)))
    o2.paste(bl2,(0,0),bl2); o2=flag_U(o2); o2.paste(gm,(0,0),gm)
    save(o2,f'umumiy_{nm}')
    del o2
print('done')
