// 3D ko'rinishlar (three.js). Reja koordinatasi (x, y) → sahna (x, z), balandlik — y. Birlik: metr.
import * as THREE from 'three';
import { H, ICHKI, DEVORLAR, DERAZALAR, USTUNLAR, ESHIKLAR, ZINALAR, XONALAR, XIZMAT_JIHOZ, KW_KUNDALIK, sinflar } from './model.mjs';

const m = v => v / 1000;
const HM = m(H);
const W = 1200, HT = 760;

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, HT);
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const sahna = new THREE.Scene();
sahna.background = new THREE.Color('#d6d6d6');
sahna.add(new THREE.HemisphereLight('#ffffff', '#b8b0a2', 2.2));
const quyosh = new THREE.DirectionalLight('#ffffff', 1.3);
quyosh.position.set(-10, 25, -6);
sahna.add(quyosh);
const quyosh2 = new THREE.DirectionalLight('#ffffff', 0.5);
quyosh2.position.set(20, 12, 30);
sahna.add(quyosh2);

const mat = c => new THREE.MeshLambertMaterial({ color: c });
const M = {
  devor: mat('#f1efea'), tashqi: mat('#e7e4de'), yangi: mat('#cf8450'), ustun: mat('#d9d5cc'), pol: mat('#d8d2c6'),
  koridor: mat('#cdc8bd'), shift: new THREE.MeshBasicMaterial({ color: '#e4e3df', side: THREE.FrontSide }),
  shisha: new THREE.MeshLambertMaterial({ color: '#bcd6ea', transparent: true, opacity: 0.45 }),
  parta: mat('#d8b98a'), stul: mat('#7f9cd6'), oyoq: mat('#8a8f99'), doska: mat('#2f5d46'), ramka: mat('#9aa0a8'),
  ustoz: mat('#a97b45'), zina: mat('#c9c4ba'),
};

const quti = (x1, x2, y1, y2, z1, z2, material) => {
  const g = new THREE.BoxGeometry(x2 - x1, y2 - y1, z2 - z1);
  const b = new THREE.Mesh(g, material);
  b.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
  sahna.add(b);
  return b;
};
const rQuti = (r, y1, y2, material) => quti(m(r.x1), m(r.x2), y1, y2, m(r.y1), m(r.y2), material);

// pol va shift
rQuti({ x1: -400, x2: ICHKI.x + 400, y1: -300, y2: ICHKI.y + 300 }, -0.05, 0, M.pol);
XONALAR.filter(x => x.tur === 'koridor').forEach(x => rQuti(x, 0, 0.002, M.koridor));
const shift = new THREE.Mesh(new THREE.PlaneGeometry(m(ICHKI.x), m(ICHKI.y)), M.shift);
shift.rotation.x = Math.PI / 2;           // normal pastga — tepadan ko'rinmaydi
shift.position.set(m(ICHKI.x) / 2, HM, m(ICHKI.y) / 2);
sahna.add(shift);

// devorlar (tashqi devorlarda deraza teshiklari)
const SEP = 0.9, LINT = 2.4;
DEVORLAR.filter(w => w.holat !== 'buziladi').forEach(w => {
  if (w.shisha) { rQuti(w, 0, 2.7, M.shisha); rQuti(w, 2.7, HM, M.devor); rQuti({ ...w, y1: w.y1 + 30, y2: w.y2 - 30 }, 0, 0.1, M.ramka); return; }
  const material = w.holat === 'tashqi' ? M.tashqi : w.holat === 'yangi' ? M.yangi : M.devor;
  if (w.holat !== 'tashqi') return rQuti(w, 0, HM, material);
  const gorizontal = w.x2 - w.x1 > w.y2 - w.y1;
  const oraliqlar = DERAZALAR.filter(d => gorizontal ? (d.y1 >= w.y1 - 1 && d.y2 <= w.y2 + 1 && d.devor !== 'chap') : (d.devor === 'chap' && w.x2 <= 1))
    .map(d => gorizontal ? [d.x1, d.x2] : [d.y1, d.y2]).sort((a, b) => a[0] - b[0]);
  let bosh = gorizontal ? w.x1 : w.y1;
  const oxir = gorizontal ? w.x2 : w.y2;
  const bolak = (a, b, y1, y2, mt) => rQuti(gorizontal ? { x1: a, x2: b, y1: w.y1, y2: w.y2 } : { x1: w.x1, x2: w.x2, y1: a, y2: b }, y1, y2, mt);
  oraliqlar.forEach(([a, b]) => {
    if (a > bosh) bolak(bosh, a, 0, HM, material);
    bolak(a, b, 0, SEP, material);
    bolak(a, b, LINT, HM, material);
    const oyna = gorizontal ? { x1: a, x2: b, y1: (w.y1 + w.y2) / 2 - 10, y2: (w.y1 + w.y2) / 2 + 10 } : { x1: (w.x1 + w.x2) / 2 - 10, x2: (w.x1 + w.x2) / 2 + 10, y1: a, y2: b };
    rQuti(oyna, SEP, LINT, M.shisha);
    bosh = b;
  });
  if (oxir > bosh) bolak(bosh, oxir, 0, HM, material);
});
USTUNLAR.forEach(u => rQuti(u, 0, HM, M.ustun));

// eshik teshiklari ustidagi peremichka
ESHIKLAR.forEach(e => {
  const t = e.holat === 'mavjud' ? 200 : 100;
  const r = e.devor === 'h'
    ? { x1: e.a, x2: e.b, y1: e.yon < 0 ? e.yuz : e.yuz - t, y2: e.yon < 0 ? e.yuz + t : e.yuz }
    : { x1: e.yon < 0 ? e.yuz : e.yuz - t, x2: e.yon < 0 ? e.yuz + t : e.yuz, y1: e.a, y2: e.b };
  rQuti(r, 2.1, HM, M.devor);
});

// zinalar — marsh zinapoyalari
ZINALAR.forEach(z => z.marshlar.forEach((mr, i) => {
  const n = 9;
  for (let s = 0; s < n; s++) {
    const h = (s + 1) * 0.15 + (i === 0 ? 0 : 0);
    if (mr.yo === 'y') {
      const d = (mr.y2 - mr.y1) / n;
      rQuti({ x1: mr.x1, x2: mr.x2, y1: mr.y1 + s * d, y2: mr.y1 + (s + 1) * d }, 0, h, M.zina);
    } else {
      const d = (mr.x2 - mr.x1) / n;
      rQuti({ x1: mr.x2 - (s + 1) * d, x2: mr.x2 - s * d, y1: mr.y1, y2: mr.y2 }, 0, h, M.zina);
    }
  }
}));

// jihozlar
function parta(r, rang = M.parta, bal = 0.75) {
  rQuti(r, bal - 0.03, bal, rang);
  const o = 30;
  [[r.x1 + o, r.y1 + o], [r.x2 - o - 30, r.y1 + o], [r.x1 + o, r.y2 - o - 30], [r.x2 - o - 30, r.y2 - o - 30]]
    .forEach(([x, y]) => rQuti({ x1: x, x2: x + 30, y1: y, y2: y + 30 }, 0, bal - 0.03, M.oyoq));
}
function stul(r, orqa) {
  rQuti(r, 0.43, 0.47, M.stul);
  const t = 30;
  const b = { top: { ...r, y2: r.y1 + t }, bottom: { ...r, y1: r.y2 - t }, left: { ...r, x2: r.x1 + t }, right: { ...r, x1: r.x2 - t } }[orqa];
  rQuti(b, 0.47, 0.85, M.stul);
  [[r.x1 + 20, r.y1 + 20], [r.x2 - 45, r.y1 + 20], [r.x1 + 20, r.y2 - 45], [r.x2 - 45, r.y2 - 45]]
    .forEach(([x, y]) => rQuti({ x1: x, x2: x + 25, y1: y, y2: y + 25 }, 0, 0.43, M.oyoq));
}
sinflar().forEach(x => {
  const j = x.j;
  const orqa = x.doska === 'past' ? 'top' : 'bottom';   // stul suyanchig'i doskaga teskari tomonda
  j.partalar.forEach(p => parta(p));
  j.stullar.forEach(p => stul(p, orqa));
  parta(j.ustozStoli, M.ustoz);
  stul(j.ustozStuli, x.doska === 'past' ? 'bottom' : 'top');
  const d = j.doska;
  rQuti({ ...d, y1: x.doska === 'yuqori' ? d.y1 : d.y2 - 40, y2: x.doska === 'yuqori' ? d.y1 + 40 : d.y2 }, 0.88, 2.12, M.ramka);
  rQuti({ ...d, x1: d.x1 + 30, x2: d.x2 - 30, y1: x.doska === 'yuqori' ? d.y1 : d.y2 - 50, y2: x.doska === 'yuqori' ? d.y1 + 50 : d.y2 }, 0.91, 2.09, M.doska);
});
XIZMAT_JIHOZ.forEach(z => {
  const pastga = z.xodimYuz === 'past';
  z.stollar.forEach(st => parta(st, M.ustoz));
  z.xodim.forEach(p => stul(p, pastga ? 'top' : 'bottom'));
  z.mehmon.forEach(p => stul(p, pastga ? 'bottom' : 'top'));
  z.shkaflar.forEach(r => rQuti(r, 0, 1.9, M.parta));
  z.divanlar.forEach(r => { rQuti(r, 0, 0.45, mat('#8a919b')); rQuti({ ...r, x1: r.x2 - 160 }, 0.45, 0.85, mat('#8a919b')); });
});
const kw = KW_KUNDALIK;
const YON = { n: 'top', s: 'bottom', w: 'left', e: 'right' };
kw.stollar.forEach(r => parta(r, M.ustoz));
kw.dumaloq.forEach(d => {
  const g = new THREE.Mesh(new THREE.CylinderGeometry(m(d.r), m(d.r), 0.04, 32), M.parta);
  g.position.set(m(d.cx), 0.73, m(d.cy)); sahna.add(g);
  const o = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 12), M.oyoq);
  o.position.set(m(d.cx), 0.36, m(d.cy)); sahna.add(o);
});
kw.stullar.forEach(p => stul(p, YON[p.yon]));
const yumshoq = mat('#8a919b');
kw.divan.forEach(r => { rQuti(r, 0, 0.45, yumshoq); rQuti({ ...r, x1: r.x2 - 220 }, 0.45, 0.85, yumshoq); });
kw.kreslo.forEach(r => { rQuti(r, 0, 0.45, yumshoq); });
kw.jurnal.forEach(r => rQuti(r, 0, 0.42, M.parta));
kw.shkaf.forEach(r => rQuti(r, 0, 0.9, M.parta));

// ko'rinishlar
const KORINISHLAR = {
  sr1: { pos: [9.1, 1.3, 0.25], nishon: [9.1, 1.2, 7.7], fov: 78 },
  sr4: { pos: [21.4, 1.3, 15.9], nishon: [21.0, 1.2, 7.8], fov: 74 },
  sotuv: { pos: [4.3, 1.6, 16.3], nishon: [12.0, 1.1, 14.6], fov: 72 },
  k1: { pos: [6.6, 1.6, 8.55], nishon: [19.3, 1.2, 8.55], fov: 70 },
  kw: { pos: [5.3, 1.65, 18.1], nishon: [1.6, 0.9, 8.5], fov: 74 },
  tepa: { pos: [-9, 29, 38], nishon: [12.2, -1.5, 11.5], fov: 34, shiftYoq: true },
};
window.KORINISHLAR = KORINISHLAR;
window.chiz = nom => {
  const k = KORINISHLAR[nom];
  const kamera = new THREE.PerspectiveCamera(k.fov, W / HT, 0.05, 200);
  kamera.position.set(...k.pos);
  kamera.lookAt(new THREE.Vector3(...k.nishon));
  shift.visible = !k.shiftYoq;
  renderer.render(sahna, kamera);
  return renderer.domElement.toDataURL('image/jpeg', 0.9);
};
window.tayyor = true;
