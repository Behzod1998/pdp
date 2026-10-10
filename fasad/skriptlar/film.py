import sys; sys.path.insert(0,'.')
from lib import *
from win import line, inter, H_from, app

PX=400; X0,X1,Y0,Y1=-0.6,8.6,-0.42,1.62
def mono(size,w=500):
    f=ImageFont.truetype(S+'/fonts/gsc.woff2',size); f.set_variation_by_axes([w]); return f

def film_design():
    """IT-themed one-way-vision film, drawn in window-grid units (1 bay wide, rows 0.5 tall)."""
    cw,ch=int((X1-X0)*PX),int((Y1-Y0)*PX)
    c=Image.new('RGBA',(cw,ch),(20,20,20,255)); d=ImageDraw.Draw(c)
    U=lambda x,y:((x-X0)*PX,(y-Y0)*PX)
    G=(0,181,51,255); WH=(255,255,255,255)
    # small grid of dots as texture
    for gx in np.arange(X0,X1,0.1):
        for gy in np.arange(0.0,1.6,0.1):
            px,py=U(gx,gy); d.ellipse([px-2,py-2,px+2,py+2],fill=(40,40,40,255))
    # transom row: running mono line
    f=mono(int(PX*0.11),500)
    s='</> frontend   {backend}   mobile.app()   ui/ux   data_science   devops   git commit -m "kelajak"   '
    x=U(-0.6,0)[0]; y=U(0,-0.27)[1]
    while x<cw:
        d.text((x,y),s,font=f,fill=G); x+=d.textlength(s,font=f)
    # row 2: course names, large display type
    f2=font(int(PX*0.22),500)
    d.text(U(0.6,0.09),'Frontend · Backend · Mobil · UI/UX · Data Science',font=f2,fill=WH)
    # row 3: code line
    f3=mono(int(PX*0.15),500); x0,y0=U(0.6,0.63)
    parts=[('while',G),(' (true) {',WH),(' o‘rgan',G),('();',WH),(' yarat',G),('();',WH),(' }',WH)]
    for t,col in parts:
        d.text((x0,y0),t,font=f3,fill=col); x0+=d.textlength(t,font=f3)
    cur=(x0+PX*0.04, y0+PX*0.02, x0+PX*0.12, y0+PX*0.17); d.rectangle(cur,fill=G)
    # row 4 (visible left of the Galeria fascia): site + CTA
    f4=font(int(PX*0.15),500)
    d.text(U(0.15,1.13),'Kursga yozilish: academy.pdp.uz',font=f4,fill=WH)
    # brand orbit: large ring + sun at the right end (the only yellow on the film)
    cx,cy=U(7.5,0.25); D=int(PX*0.44)
    mk=Image.open(S+'/r/mark.png').convert('RGBA').resize((D,D),Image.LANCZOS)
    c.alpha_composite(mk,(int(cx-D/2),int(cy-D/2)))
    return c

def film_alpha(cw,ch,xmax,frame_v=0.055,frame_h=0.04,rows=(-0.42,0,0.5,1.0,1.62)):
    a=Image.new('L',(cw,ch),255); d=ImageDraw.Draw(a)
    U=lambda x,y:((x-X0)*PX,(y-Y0)*PX)
    for k in range(0,9):
        x=U(k,0)[0]; d.rectangle([x-frame_v*PX/2,0,x+frame_v*PX/2,ch],fill=0)
    x=U(xmax,0)[0]; d.rectangle([x-frame_v*PX/2,0,cw,ch],fill=0)
    for r in rows[1:-1]:
        y=U(0,r)[1]; d.rectangle([0,y-frame_h*PX/2,cw,y+frame_h*PX/2],fill=0)
    return a

def apply_film(im, Hm, poly, protect=None, opacity=0.84, xmax=8.47):
    W,H=im.size
    Sm=np.array([[1/PX,0,X0],[0,1/PX,Y0],[0,0,1.0]])
    M=np.linalg.inv(Hm@Sm); M=M/M[2,2]
    co=M.flatten()[:8].tolist()
    des=film_design(); cw,ch=des.size
    al=film_alpha(cw,ch,xmax)
    des.putalpha(ImageChops.multiply(des.split()[3],al))
    wp=des.transform((W,H),Image.PERSPECTIVE,co,Image.BICUBIC)
    m=np.asarray(wp.split()[3],float)/255.*np.asarray(poly_mask((W,H),poly,1),float)/255.
    if protect is not None: m=m*protect
    m=m*opacity
    a=np.asarray(im,float); f=np.asarray(wp.convert('RGB'),float)
    out=Image.fromarray((a*(1-m[...,None])+f*m[...,None]).astype(np.uint8))
    # emissive at night: warm interior light through glass + brighter graphics
    glass=np.asarray(poly_mask((W,H),poly,1),float)/255.*(np.asarray(wp.split()[3],float)/255.)
    if protect is not None: glass=glass*protect
    return out, glass, f

def H_8294():
    lean=lambda x: -0.194*(3330-x)/1890
    vl=lambda x,y: line((x,y),(x+lean(x)*600,y+600))
    H1=line((1420,1360),(3540,1188)); H2=line((1410,1532),(3540,1447))
    V1=vl(1440,1220); V8=vl(3325,1005)
    P=[inter(V1,H1),inter(V8,H1),inter(V8,H2),inter(V1,H2)]
    return H_from([(1,0),(8,0),(8,.5),(1,.5)],P)
POLY_8294=[(1360,1245),(3500,1080),(3500,1567),(1740,1615),(1740,1945),(1100,1950),(1100,1640),(1215,1630),(1215,1420),(1360,1415)]

def H_8296():
    V1=line((2615,1288),(2697,1682)); V4=line((2931,1223),(3092,1677))
    H1=line((2633,1283),(3092,1326)); SL=line((2560,1682),(3092,1677))
    P=[inter(V1,H1),inter(V4,H1),inter(V4,SL),inter(V1,SL)]
    return H_from([(1,0),(4,0),(4,1.5),(1,1.5)],P)
POLY_8296=[(2697,1203),(3550,1290),(3550,1680),(2490,1690),(2492,1410),(2575,1395),(2600,1300),(2697,1290)]

if __name__=='__main__':
    film_design().convert('RGB').resize((1840,416)).save('t_film.jpg',quality=88)
    from win import app
    Hm=H_8294()
    for pt in [(1100,1745),(1700,1725),(1300,1945),(3515,990)]:
        print(pt, app(np.linalg.inv(Hm),pt).round(3))
