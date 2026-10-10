import sys; sys.path.insert(0,'.')
from lib import *
GOLD=(176,134,38)      # tillarang, slightly deep
GREEN=(0,181,51)

def _band_poly(p,q,n,o0,o1):
    (x1,y1),(x2,y2)=p,q; nx,ny=n
    return [(x1+nx*o0,y1+ny*o0),(x2+nx*o0,y2+ny*o0),(x2+nx*o1,y2+ny*o1),(x1+nx*o1,y1+ny*o1)]

def strip(im, p, q, n, layers, start=4, strength=0.55):
    """Vinyl strip along edge p-q, layers stacked inward along unit normal n: [(color,width),...]."""
    o=start; out=im
    for col,w in layers:
        poly=_band_poly(p,q,n,o,o+w)
        m=poly_mask(im.size,poly,0.7)
        out=shade_fill(out,m,col,ref_lum=None,strength=strength,lo=0.75,hi=1.25)
        o+=w
    return out

def polystrip(im, pts, w, color=GOLD, strength=0.5):
    m=Image.new('L',im.size,0); ImageDraw.Draw(m).line(pts,fill=255,width=w,joint='curve')
    m=m.filter(ImageFilter.GaussianBlur(0.7))
    return shade_fill(im,m,color,ref_lum=None,strength=strength,lo=0.75,hi=1.25)

def ggg(g,G):  # gold-green-gold
    return [(GOLD,g),(GREEN,G),(GOLD,g)]
