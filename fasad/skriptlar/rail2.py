import sys,os,random; sys.path.insert(0,'.')
from railbase import *
GRAPH=(46,49,54); GREY=(96,102,110)
def mono(sz,w=500):
    f=ImageFont.truetype(S+'/fonts/gsc.woff2',sz); f.set_variation_by_axes([w]); return f

def stripe(d,w,h,y0=None,bh=None):
    bh=bh or int(h*0.07); y0=h-int(h*0.11) if y0 is None else y0
    d.rectangle([0,y0,w,y0+int(bh*.2)],fill=GOLD+(255,)); d.rectangle([0,y0+int(bh*.2),w,y0+int(bh*.8)],fill=GREEN+(255,)); d.rectangle([0,y0+int(bh*.8),w,y0+bh],fill=GOLD+(255,))

def v_minimal(w,h,seed):
    c=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(c); stripe(d,w,h)
    d.rectangle([0,int(h*0.06),w,int(h*0.06)+max(3,h//140)],fill=GOLD+(255,)); return c

CODE=['def kelajak(talaba):','    bilim = o‘rgan(har_kun)','    return yutuq','for kun in range(365):','    kod_yoz(); xato_qil()','    qayta_urin()','const orzu = await reja();','if (sabr && mehnat) {','  natija++;','}','while (true) { o‘rgan(); }','git commit -m "1-qadam"','SELECT * FROM imkoniyat;','print("Salom, dunyo!")','import kelajak as k','npm run start','// TODO: hech qachon to‘xtama','class Talaba extends Inson {}']
KW={'def','return','for','in','const','await','if','while','import','as','class','extends','true','SELECT','FROM'}
def v_code(w,h,seed):
    rnd=random.Random(seed); c=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(c)
    fs=int(h*0.085); f=mono(fs); lh=int(fs*1.45); y=int(h*0.08); i=rnd.randrange(len(CODE))
    while y<h*0.8:
        line=CODE[i%len(CODE)]; x=int(w*0.05)
        d.text((x-int(fs*2.2),y),f'{(i%40)+1:>2}',font=f,fill=(170,176,182,255))
        import re
        for tok in re.findall(r'//.*|"[^"]*"|\w+|\s+|.',line):
            col=GDONE if tok in KW else (GOLD if tok.startswith('"') or tok.startswith('//') else GREY)
            d.text((x,y),tok,font=f,fill=col+(255,)); x+=d.textlength(tok,font=f)
        y+=lh; i+=1
    stripe(d,w,h); return c

def v_circuit(w,h,seed):
    rnd=random.Random(seed); c=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(c)
    g=max(24,h//16); lw=max(3,h//170)
    for _ in range(int(w*h/(g*g)/9)):
        x=rnd.randrange(0,w//g)*g; y=rnd.randrange(1,int(h*0.82)//g)*g; pts=[(x,y)]
        for _ in range(rnd.randint(2,6)):
            dx,dy=rnd.choice([(1,0),(1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,0)]); n=rnd.randint(1,4)
            x=min(max(0,x+dx*g*n),w); y=min(max(g,y+dy*g*n),int(h*0.84)); pts.append((x,y))
        col=GOLD if rnd.random()<0.65 else (150,156,164)
        d.line(pts,fill=col+(255,),width=lw,joint='curve')
        for p in (pts[0],pts[-1]):
            r=lw*2.2; d.ellipse([p[0]-r,p[1]-r,p[0]+r,p[1]+r],fill=(GREEN if rnd.random()<0.5 else GOLD)+(255,))
            r2=lw*0.9; d.ellipse([p[0]-r2,p[1]-r2,p[0]+r2,p[1]+r2],fill=(240,242,240,255))
    stripe(d,w,h); return c

def v_perf(w,h,seed):
    """Opaque graphite laser-cut panel: binary-code perforation, denser at top."""
    rnd=random.Random(seed); c=Image.new('RGBA',(w,h),GRAPH+(255,)); d=ImageDraw.Draw(c)
    g=max(14,h//38); top=int(h*0.05); bot=int(h*0.84)
    for j,y in enumerate(range(top,bot,g)):
        dens=1-(y-top)/(bot-top)*0.85
        for x in range(g//2,w,g):
            if rnd.random()<dens:
                if rnd.random()<0.5: d.rectangle([x-g*0.18,y-g*0.32,x+g*0.18,y+g*0.32],fill=(0,0,0,0))   # "1"
                else: d.ellipse([x-g*0.3,y-g*0.32,x+g*0.3,y+g*0.32],outline=(0,0,0,0),width=max(2,g//7)) # "0"
    stripe(d,w,h); return c

VAR={'minimal':v_minimal,'kod':v_code,'sxema':v_circuit,'perfo':v_perf}

def qsize(q):
    import math
    wt=math.dist(q[0],q[1]); wb=math.dist(q[3],q[2]); hl=math.dist(q[0],q[3]); hr=math.dist(q[1],q[2])
    s=1800/max((wt+wb)/2,1); return int((wt+wb)/2*s), int((hl+hr)/2*s)

def glass2(im, panels, var):
    out=np.asarray(im,float).copy(); W,H=im.size
    for k,(poly,quad) in enumerate(panels):
        fr=frost(im,poly); m=np.asarray(poly_mask((W,H),poly,1.0),float)/255.
        out=out*(1-m[...,None]*0.93)+fr*(m[...,None]*0.93)
        w,h=qsize(quad); g=warp(VAR[var](w,h,k+7),quad,(W,H)); ga=np.asarray(g,float); al=ga[...,3:4]/255.*m[...,None]
        if var=='perfo':
            L=np.asarray(im.convert('L'),float)[...,None]/255.
            ga[...,:3]=ga[...,:3]*np.clip(0.75+L*0.5,0.7,1.25)
        out=out*(1-al)+ga[...,:3]*al
        e=Image.new('L',(W,H),0); ImageDraw.Draw(e).line(poly+[poly[0]],fill=255,width=4)
        ea=np.asarray(e.filter(ImageFilter.GaussianBlur(1)),float)/255.*(0.25 if var=='perfo' else 0.55)
        out=out*(1-ea[...,None])+np.array([250,252,252])*ea[...,None]
    return Image.fromarray(np.clip(out,0,255).astype(np.uint8))

# geometry (same as rail.py)
T0,T1=(725,590),(1250,752); B0,B1=(725,780),(1250,1025); tx=lambda x:(x-725)/525
Z5=[([(589,612),(711,582),(711,757),(589,765)],None),
    ([T0,lerp(T0,T1,tx(931)),lerp(B0,B1,tx(931)),B0],None),
    ([lerp(T0,T1,tx(945)),T1,B1,lerp(B0,B1,tx(945))],None),
    ([(1282,752),(1934,645),(1934,995),(1282,1018)],None),
    ([(1035,1160),(1078,1128),(1215,1203),(1035,1312)],[(1035,1128),(1215,1128),(1215,1312),(1035,1312)])]
Z5=[(p,q or p) for p,q in Z5]
Z5P=[R(572,590,592,792),R(708,534,731,764),R(928,624,947,817),R(1243,708,1284,1064),R(1930,580,1997,1082),R(1014,1124,1036,1338)]
Z3=[([(955,560),(2100,397),(2100,1430),(1032,1032)],)*2,([(640,605),(900,555),(966,1020),(640,930)],)*2]
def z3posts(o):
    o=posts(o,[[(898,505),(960,505),(1045,1085),(962,1092)],[(600,575),(640,575),(645,945),(605,945)]],
       full=[[(2112,255),(2240,255),(2240,1580),(2116,1580)],[(2043,240),(2110,216),(2232,206),(2272,213),(2272,242),(2112,264),(2043,280)],[(2045,1618),(2092,1570),(2240,1572),(2306,1630),(2210,1706),(2105,1680)]])
    bm=Image.new('L',o.size,0); ImageDraw.Draw(bm).ellipse([2104,104,2192,198],fill=255); ImageDraw.Draw(bm).rectangle([2125,185,2210,215],fill=255)
    return shade_fill(o,bm.filter(ImageFilter.GaussianBlur(1)),(46,49,54),ref_lum=None,strength=0.6,lo=0.6,hi=1.5)
D4=lambda pts:[(1100+x*1.288,y*1.288) for x,y in pts]
Z4=[(D4([(140,282),(448,962),(383,1872),(108,640)]),)*2]
Z4P=[D4([(472,826),(553,826),(592,912),(540,935),(442,2322),(350,2320),(445,930),(430,905)])]

if __name__=='__main__':
    vs=sys.argv[1].split(',') ; shots=sys.argv[2].split(',')
    for v in vs:
        if 'zal' in shots:
            o=posts(glass2(Image.open('zina/z5.jpg').convert('RGB'),Z5,v),Z5P); save(o,f'zal_{v}')
        if 'maydoncha' in shots:
            o=z3posts(glass2(Image.open('zina/z3.jpg').convert('RGB'),Z3,v)); save(o,f'maydoncha_{v}')
        if 'zina' in shots:
            o=posts(glass2(Image.open('zina/z4.jpg').convert('RGB'),Z4,v),Z4P); save(o,f'zina_{v}')
    print('ok')
