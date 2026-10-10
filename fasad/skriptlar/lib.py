import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops
S='/tmp/claude-0/-home-user-pdp/7786bf71-49b1-5bc9-9b0f-cf179e84031b/scratchpad'

def coeffs(dst, src):
    # PIL perspective: maps output (dst) coords -> input (src) coords
    A=[];B=[]
    for (x,y),(u,v) in zip(dst,src):
        A.append([x,y,1,0,0,0,-u*x,-u*y]); B.append(u)
        A.append([0,0,0,x,y,1,-v*x,-v*y]); B.append(v)
    return np.linalg.solve(np.array(A,float),np.array(B,float)).tolist()

def warp(img, quad, size):
    """Warp RGBA img so its corners land on quad (TL,TR,BR,BL) in a canvas of size."""
    w,h=img.size
    src=[(0,0),(w,0),(w,h),(0,h)]
    return img.transform(size, Image.PERSPECTIVE, coeffs(quad,src), Image.BICUBIC)

def poly_mask(size, pts, blur=0):
    m=Image.new('L',size,0); ImageDraw.Draw(m).polygon(pts,fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m

def lum(img):
    return np.asarray(img.convert('L'),float)/255.

def shade_fill(base, region_mask, color, ref_lum=None, strength=1.0, lo=0.4, hi=1.8):
    """Paint color into region keeping the photo's light/shadow (luminance ratio)."""
    a=np.asarray(base,float)
    L=lum(base)
    m=np.asarray(region_mask,float)/255.
    if ref_lum is None:
        ref_lum=(L*m).sum()/max(m.sum(),1)
    k=np.clip((L/ref_lum-1)*strength+1,lo,hi)[...,None]
    c=np.array(color,float)[None,None,:]*k
    out=a*(1-m[...,None])+np.clip(c,0,255)*m[...,None]
    return Image.fromarray(out.astype(np.uint8))

def letters(logo, depth=6, light=(1,1)):
    """Fake 3D channel letters: dark returns under the face + soft shadow."""
    w,h=logo.size
    alpha=logo.split()[3]
    pad=depth*4
    out=Image.new('RGBA',(w+pad*2,h+pad*2),(0,0,0,0))
    sh=Image.new('RGBA',out.size,(0,0,0,0))
    shadow=Image.new('RGBA',logo.size,(0,0,0,150)); shadow.putalpha(alpha.point(lambda v:v*0.55))
    sh.paste(shadow,(pad+depth*2,pad+depth*3),shadow)
    sh=sh.filter(ImageFilter.GaussianBlur(depth*1.5))
    out=Image.alpha_composite(out,sh)
    side=Image.new('RGBA',logo.size,(40,40,40,255)); side.putalpha(alpha)
    for i in range(depth,0,-1):
        out.paste(side,(pad+int(i*light[0]*0.6),pad+int(i*light[1])),side)
    out.paste(logo,(pad,pad),logo)
    return out, pad

def fascia(im, bbox, shell, lip, face, blade_box, blade_ell, logo_h=0.47):
    W,H=im.size
    a=np.asarray(im,float)/255.
    r,g,b=a[...,0],a[...,1],a[...,2]
    mx=a.max(-1); mn=a.min(-1); sat=(mx-mn)/(mx+1e-6)
    teal=(g>r*1.15)&(b>r*1.05)&(sat>0.25)&(mx<0.75)
    box=np.zeros_like(teal); x0,y0,x1,y1=bbox; box[y0:y1,x0:x1]=True
    blade=np.asarray(poly_mask((W,H),blade_box))>0
    m=Image.fromarray(((teal&box&~blade)*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.5))
    sm=ImageChops.lighter(m, poly_mask((W,H),shell,1))
    out=shade_fill(im, sm, (30,31,33), ref_lum=0.30, strength=0.6, lo=0.7, hi=1.12)
    out.paste(Image.new('RGB',(W,H),(22,22,24)),(0,0),poly_mask((W,H),lip,1))
    pw,ph=2000,360
    grad=np.linspace(1.0,0.82,pw)[None,:]*np.linspace(1.06,0.94,ph)[:,None]
    panel=Image.fromarray(np.clip(np.array([24,24,26])[None,None,:]*grad[...,None],0,255).astype(np.uint8)).convert('RGBA')
    ImageDraw.Draw(panel).rectangle([0,ph-14,pw,ph-4],fill=(0,181,51,255))
    logo=Image.open(S+'/r/inline-on-dark.png').convert('RGBA')
    lh=int(ph*logo_h); lw=round(logo.width*lh/logo.height)
    logo=logo.resize((lw,lh),Image.LANCZOS)
    L3,pad=letters(logo,depth=5)
    panel.alpha_composite(L3,((pw-lw)//2-pad,(ph-14-lh)//2-pad-4))
    out.paste(warp(panel,face,(W,H)),(0,0),poly_mask((W,H),face,0.8))
    cx,cy,rx,ry=blade_ell
    disc=Image.new('RGBA',(1000,1000),(0,0,0,0)); dd=ImageDraw.Draw(disc)
    dd.ellipse([0,0,999,999],fill=(150,150,150,255)); dd.ellipse([40,40,959,959],fill=(246,246,244,255))
    mk=Image.open(S+'/r/mark.png').convert('RGBA').resize((560,560),Image.LANCZOS); disc.alpha_composite(mk,(220,220))
    dw=warp(disc,[(cx-rx,cy-ry),(cx+rx,cy-ry),(cx+rx,cy+ry),(cx-rx,cy+ry)],(W,H))
    out.paste(dw,(0,0),dw)
    return out

def band_sign(im, quad, pos=0.4, logo_h=0.56, canvas=(4400,400), protect=None):
    W,H=im.size; cw,ch=canvas
    can=Image.new('RGBA',(cw,ch),(0,0,0,0))
    ImageDraw.Draw(can).rectangle([0,ch-22,cw,ch-6],fill=(0,181,51,255))
    logo=Image.open(S+'/r/inline-on-light.png').convert('RGBA')
    lh=int(ch*logo_h); lw=round(logo.width*lh/logo.height)
    logo=logo.resize((lw,lh),Image.LANCZOS)
    L3,pad=letters(logo,depth=7)
    cx=int(cw*pos)
    can.alpha_composite(L3,(cx-lw//2-pad,(ch-22-lh)//2-pad-6))
    wp=warp(can,quad,(W,H))
    if protect is not None:  # keep foreground (tree leaves) in front
        al=np.asarray(wp.split()[3],float)*protect
        wp.putalpha(Image.fromarray(al.astype(np.uint8)))
    out=im.copy(); out.paste(wp,(0,0),wp)
    return out

from PIL import ImageFont
def font(size, weight=500):
    f=ImageFont.truetype(S+'/fonts/sg.woff2', size); f.set_variation_by_axes([weight]); return f

def panel_img(style, pw=2000, ph=360, logo_h=0.47):
    grad=np.linspace(1.0,0.86,pw)[None,:]*np.linspace(1.05,0.95,ph)[:,None]
    base={'black':(24,24,26),'white':(240,241,242),'green':(0,181,51),'silver':(184,192,204)}[style]
    if style=='white': grad=np.linspace(1.0,0.94,pw)[None,:]*np.linspace(1.01,0.97,ph)[:,None]
    if style=='silver':
        rng=np.random.default_rng(3)
        brush=1+rng.normal(0,0.012,(1,pw))          # brushed-aluminium streaks
        grad=np.linspace(1.04,0.9,pw)[None,:]*np.linspace(1.03,0.95,ph)[:,None]*brush
    panel=Image.fromarray(np.clip(np.array(base)[None,None,:]*grad[...,None],0,255).astype(np.uint8)).convert('RGBA')
    d=ImageDraw.Draw(panel)
    if style in ('black','white'): d.rectangle([0,ph-14,pw,ph-4],fill=(0,181,51,255))
    if style=='silver':
        d.rectangle([0,ph-38,pw,ph-28],fill=(176,134,38,255)); d.rectangle([0,ph-27,pw,ph-12],fill=(0,181,51,255)); d.rectangle([0,ph-11,pw,ph-1],fill=(176,134,38,255))
    src={'black':'inline-on-dark','white':'inline-on-light','green':'inline-on-dark','silver':'inline-on-light'}[style]
    logo=Image.open(S+f'/r/{src}.png').convert('RGBA')
    lh=int(ph*logo_h); lw=round(logo.width*lh/logo.height)
    logo=logo.resize((lw,lh),Image.LANCZOS)
    if style=='green':
        # mark sits on a white disc so the green ring stays visible on the green fascia
        split=int(lw*60/423.8)
        mark=logo.crop((0,0,split,lh)); word=logo.crop((split,0,lw,lh))
        disc_d=int(lh*1.32); pad_=(disc_d-lh)//2; gap=int(lh*0.18)
        lg=Image.new('RGBA',(disc_d+gap+word.width,disc_d),(0,0,0,0))
        ImageDraw.Draw(lg).ellipse([0,0,disc_d-1,disc_d-1],fill=(255,255,255,255))
        lg.alpha_composite(mark,(pad_,pad_)); lg.alpha_composite(word,(disc_d+gap-int(lh*0.25),pad_))
        logo=lg; lw,lh=logo.size
    L3,pad=letters(logo,depth=5)
    yo=(ph-{'green':0,'silver':38}.get(style,14)-lh)//2-pad-4
    panel.alpha_composite(L3,((pw-lw)//2-pad,yo))
    return panel

def led_panel(text, size=(1400,200), grid=(266,38), color=(40,255,110)):
    gw,gh=grid
    # rasterise text into the LED grid
    t=Image.new('L',(gw,gh),0); d=ImageDraw.Draw(t)
    fs=gh
    while True:
        f=ImageFont.truetype(S+'/fonts/sg.woff2', fs); f.set_variation_by_axes([600])
        bb=d.textbbox((0,0),text,font=f)
        if bb[2]-bb[0] <= gw-14 and bb[3]-bb[1] <= gh-8: break
        fs-=1
    x=(gw-(bb[2]-bb[0]))//2-bb[0]; y=(gh-(bb[3]-bb[1]))//2-bb[1]
    d.text((x,y),text,font=f,fill=255)
    on=np.asarray(t)>110
    W,H=size; px=W/gw; py=H/gh
    img=Image.new('RGB',size,(10,11,12)); dd=ImageDraw.Draw(img)
    rr=min(px,py)*0.36
    glow=Image.new('RGB',size,(0,0,0)); dg=ImageDraw.Draw(glow)
    for j in range(gh):
        for i in range(gw):
            cx=(i+.5)*px; cy=(j+.5)*py
            if on[j,i]:
                dd.ellipse([cx-rr,cy-rr,cx+rr,cy+rr],fill=color)
                dg.ellipse([cx-rr*1.6,cy-rr*1.6,cx+rr*1.6,cy+rr*1.6],fill=tuple(int(c*.7) for c in color))
            else:
                dd.ellipse([cx-rr*.8,cy-rr*.8,cx+rr*.8,cy+rr*.8],fill=(26,28,30))
    glow=glow.filter(ImageFilter.GaussianBlur(min(px,py)*1.2))
    return ImageChops.add(img,glow)

def flag_design(w=600,h=2400):
    g=Image.new('RGBA',(w,h),(0,181,51,255)); d=ImageDraw.Draw(g)
    dd=int(w*0.74); x0=(w-dd)//2; y0=int(w*0.16)
    d.ellipse([x0,y0,x0+dd,y0+dd],fill=(255,255,255,255))
    mk=Image.open(S+'/r/mark.png').convert('RGBA').resize((int(dd*0.7),int(dd*0.7)),Image.LANCZOS)
    g.alpha_composite(mk,(x0+(dd-mk.width)//2,y0+(dd-mk.height)//2))
    # vertical headline (poster style: uppercase), reads bottom-to-top
    txt='KURSGA YOZILISH'
    avail=h-(y0+dd)-int(w*0.55)
    fs=int(w*0.5)
    f=font(fs,500)
    tw=d.textlength(txt,font=f)
    if tw>avail: fs=int(fs*avail/tw); f=font(fs,500); tw=d.textlength(txt,font=f)
    tl=Image.new('RGBA',(int(tw)+10,int(fs*1.3)),(0,0,0,0))
    ImageDraw.Draw(tl).text((5,0),txt,font=f,fill=(255,255,255,255))
    tl=tl.rotate(90,expand=True)
    g.alpha_composite(tl,((w-tl.width)//2, y0+dd+int(w*0.18)))
    f2=font(int(w*0.085),500); s2='academy.pdp.uz'
    sw=d.textlength(s2,font=f2)
    d.text(((w-sw)/2,h-int(w*0.3)),s2,font=f2,fill=(255,255,255,255))
    return g

def paint_flag(im, poly, quad, design, protect=None, shade=0.5, blur=18, expo=1.0):
    W,H=im.size
    m=poly_mask((W,H),poly,1.2)
    base=Image.new('RGB',(W,H),(0,181,51))
    L=np.asarray(im.convert('L').filter(ImageFilter.GaussianBlur(blur)),float)/255.
    mm=np.asarray(m,float)/255.
    ref=(L*mm).sum()/max(mm.sum(),1)
    wp=warp(design,quad,(W,H))
    lay=Image.new('RGB',(W,H),(0,181,51)); lay.paste(wp,(0,0),wp)
    k=(np.clip((L/ref-1)*shade+1,0.7,1.25)*expo)[...,None]
    lay=Image.fromarray(np.clip(np.asarray(lay,float)*k,0,255).astype(np.uint8))
    if protect is not None:
        mm=mm*protect
    out=Image.fromarray((np.asarray(im,float)*(1-mm[...,None])+np.asarray(lay,float)*mm[...,None]).astype(np.uint8))
    return out


SHELL={'silver':((150,158,170),(128,136,148)),'black':((30,31,33),(22,22,24)),'white':((206,208,211),(188,190,193)),'green':((0,150,42),(0,118,33))}
def fascia2(im, style, bbox, shell, lip, face, blade_box, blade_ell, led_quad, logo_h=0.47):
    W,H=im.size
    a=np.asarray(im,float)/255.
    r,g,b=a[...,0],a[...,1],a[...,2]
    mx=a.max(-1); mn=a.min(-1); sat=(mx-mn)/(mx+1e-6)
    teal=(g>r*1.15)&(b>r*1.05)&(sat>0.25)&(mx<0.75)
    box=np.zeros_like(teal); x0,y0,x1,y1=bbox; box[y0:y1,x0:x1]=True
    blade=np.asarray(poly_mask((W,H),blade_box))>0
    m=Image.fromarray(((teal&box&~blade)*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.5))
    sm=ImageChops.lighter(m, poly_mask((W,H),shell,1))
    sc,lc=SHELL[style]
    out=shade_fill(im, sm, sc, ref_lum=0.30, strength=0.6, lo=0.7, hi=1.12)
    out.paste(Image.new('RGB',(W,H),lc),(0,0),poly_mask((W,H),lip,1))
    out.paste(warp(panel_img(style,logo_h=logo_h),face,(W,H)),(0,0),poly_mask((W,H),face,0.8))
    cx,cy,rx,ry=blade_ell
    disc=Image.new('RGBA',(1000,1000),(0,0,0,0)); dd=ImageDraw.Draw(disc)
    dd.ellipse([0,0,999,999],fill=(150,150,150,255)); dd.ellipse([40,40,959,959],fill=(246,246,244,255))
    mk=Image.open(S+'/r/mark.png').convert('RGBA').resize((560,560),Image.LANCZOS); disc.alpha_composite(mk,(220,220))
    dw=warp(disc,[(cx-rx,cy-ry),(cx+rx,cy-ry),(cx+rx,cy+ry),(cx-rx,cy+ry)],(W,H))
    out.paste(dw,(0,0),dw)
    if led_quad:
        xs=[p[0] for p in led_quad]; ys=[p[1] for p in led_quad]
        lw_=int(max(xs)-min(xs))*2; lh_=int(max(ys)-min(ys))*2
        led=led_panel('PDP Academy\u2019ga xush kelibsiz!',size=(lw_,lh_),grid=(int(38*lw_/lh_),38)).convert('RGBA')
        out.paste(warp(led,led_quad,(W,H)),(0,0),poly_mask((W,H),led_quad,0.6))
    return out
