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
