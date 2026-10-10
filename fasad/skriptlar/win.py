import numpy as np
def line(p,q): # returns (a,b,c) for ax+by+c=0
    (x1,y1),(x2,y2)=p,q; return np.array([y2-y1, x1-x2, x2*y1-x1*y2],float)
def inter(l1,l2):
    p=np.cross(l1,l2); return p[:2]/p[2]
def H_from(src,dst):
    A=[]
    for (x,y),(u,v) in zip(src,dst):
        A.append([x,y,1,0,0,0,-u*x,-u*y,-u]); A.append([0,0,0,x,y,1,-v*x,-v*y,-v])
    _,_,Vt=np.linalg.svd(np.array(A)); return Vt[-1].reshape(3,3)/Vt[-1][-1]
def app(Hm,p):
    v=Hm@np.array([p[0],p[1],1.0]); return v[:2]/v[2]
# 8294
lean=lambda x: -0.194*(3330-x)/1890
def vline(x,y): return line((x,y),(x+lean(x)*600,y+600))
H1=line((1420,1360),(3540,1188)); H2=line((1410,1532),(3540,1447))
V={k:vline(*p) for k,p in {0:(1200,1450),1:(1440,1220),2:(1640,1205),3:(1850,1180),4:(2085,1155),5:(2350,1120),6:(2640,1090),7:(2960,1055),8:(3325,1005)}.items()}
P=[inter(V[1],H1),inter(V[8],H1),inter(V[8],H2),inter(V[1],H2)]
Hm=H_from([(1,0),(8,0),(8,.5),(1,.5)],P)
for k in V:
    pr=app(Hm,(k,0)); act=inter(V[k],H1); print(k,pr.round(),act.round())
