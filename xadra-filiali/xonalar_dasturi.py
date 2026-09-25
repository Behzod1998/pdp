#!/usr/bin/env python3
"""PDP Academy Xadra filiali: xonalar dasturi (space program) hisob-kitobi.

Talabalar soni, guruh hajmi va dars jadvalidan kelib chiqib kerakli xonalar
soni va maydonini hisoblaydi. Parametr o'zgarganda faylni qayta yarating:

    python3 xonalar_dasturi.py > 02-xonalar-dasturi.md
    python3 xonalar_dasturi.py --talabalar 1600 --qavatlar 5   # boshqa stsenariy
"""
import argparse
import math
from dataclasses import dataclass

# Barcha asosiy taxminlar shu yerda: (qiymat, izoh).
# Ochiq savollarga javob olingach shu qiymatlar yangilanadi.
PARAMETRLAR = {
    "talabalar": (1200, "oylik faol talabalar soni"),
    "guruh": (16, "bitta guruhdagi talabalar"),
    "kun_turlari": (2, "toq kunlar (Du-Chor-Ju) va juft kunlar (Se-Pay-Sha)"),
    "smenalar": (5, "kuniga dars vaqtlari: 09, 11, 14, 16, 18"),
    "band": (0.80, "o'quv xonalaridan foydalanish koeffitsienti"),
    "kovorking_ulushi": (0.25, "darsdagi talabalarga nisbatan kovorking o'rinlari"),
    "zal_orinlari": (120, "tadbirlar zalidagi o'rinlar"),
    "qavatlar": (4, "yer usti qavatlari soni"),
    "brutto": (1.40, "netto -> brutto: koridor, zinapoya, lift, devorlar"),
}

# Maydon me'yorlari (m²). Dastlabki qiymatlar, loyihachi tomonidan tekshirilsin.
M2_KOMPYUTER_ORNI = 4.5   # bitta kompyuterli ish o'rni (sanitariya me'yori)
M2_KOVORKING_ORNI = 3.0
M2_ZAL_ORNI = 0.9
M2_SAHNA = 30
M2_OFIS_ORNI = 6.0
M2_USTOZ_ORNI = 4.0
M2_UNITAZ = 3.5           # bitta unitaz + qo'l yuvgich + o'tish joyi
M2_MAXSUS_HOJATXONA = 5.0  # imkoniyati cheklanganlar uchun
KISHI_BIR_UNITAZGA = 25

MENTOR_XONA_SIGIMI = 4
SOTUV_ORINLARI = 6
MAMURIYAT_ORINLARI = 6
RESEPSHN_XODIMLARI = 2


@dataclass
class Xona:
    zona: str
    nomi: str
    soni: int
    maydon: float  # bitta xona maydoni, m²
    izoh: str = ""

    @property
    def jami(self):
        return self.soni * self.maydon


def hisobla(p):
    guruhlar = math.ceil(p["talabalar"] / p["guruh"])
    xona_sigimi = p["kun_turlari"] * p["smenalar"] * p["band"]
    oquv_xonalari = math.ceil(guruhlar / xona_sigimi)
    mentor_xonalari = math.ceil(oquv_xonalari / 3)
    darsdagi_talabalar = oquv_xonalari * p["guruh"]
    kovorking_orinlari = math.ceil(darsdagi_talabalar * p["kovorking_ulushi"])
    ustozlar = oquv_xonalari + mentor_xonalari
    xodimlar = ustozlar + SOTUV_ORINLARI + MAMURIYAT_ORINLARI + 1 + RESEPSHN_XODIMLARI
    # Tadbirlar zali odatda darsdan tashqari vaqtda ishlaydi, shuning uchun
    # eng yuqori bir vaqtdagi bandlikka qo'shilmaydi.
    bandlik = (darsdagi_talabalar + kovorking_orinlari
               + mentor_xonalari * MENTOR_XONA_SIGIMI + xodimlar)
    qavatlar = p["qavatlar"]
    unitaz_qavatiga = math.ceil(math.ceil(bandlik / KISHI_BIR_UNITAZGA) / qavatlar)

    o, j, m, x = "O'quv", "Jamoat", "Ma'muriy", "Xizmat va texnik"
    xonalar = [
        Xona(o, "Kompyuterli o'quv xonasi", oquv_xonalari,
             (p["guruh"] + 1) * M2_KOMPYUTER_ORNI,
             f"{p['guruh']} talaba + ustoz, {son(M2_KOMPYUTER_ORNI)} m²/o'rin"),
        Xona(o, "Mentor / qo'shimcha dars xonasi", mentor_xonalari, 20,
             f"{MENTOR_XONA_SIGIMI}–6 kishi, har 3 o'quv xonasiga 1 ta"),
        Xona(j, "Qabulxona va kutish zali", 1, 60, "resepshn, ota-onalar uchun kutish joyi"),
        Xona(j, "Kovorking (mustaqil ishlash)", 1, kovorking_orinlari * M2_KOVORKING_ORNI,
             f"{kovorking_orinlari} o'rin"),
        Xona(j, "Tadbirlar zali", 1, p["zal_orinlari"] * M2_ZAL_ORNI + M2_SAHNA,
             f"{p['zal_orinlari']} o'rin + sahna; meetup, demo day, ochiq darslar"),
        Xona(j, "Kafe / dam olish zonasi", 1, 60, "choy-qahva, mikroto'lqinli pech"),
        Xona(j, "Namozxona", 2, 18, "erkaklar va ayollar uchun alohida (ixtiyoriy)"),
        Xona(m, "Sotuv va qabul bo'limi", 1, SOTUV_ORINLARI * M2_OFIS_ORNI,
             f"{SOTUV_ORINLARI} ta konsultant"),
        Xona(m, "Filial rahbari kabineti", 1, 18),
        Xona(m, "Ma'muriyat ofisi", 1, MAMURIYAT_ORINLARI * M2_OFIS_ORNI,
             "o'quv bo'limi, buxgalteriya, kadrlar"),
        Xona(m, "Ustozlar xonasi", 1, ustozlar * M2_USTOZ_ORNI, f"{ustozlar} o'rin"),
        Xona(m, "Uchrashuv xonasi", 2, 15, "6 kishilik"),
        Xona(x, "Server xonasi", 1, 12, "alohida konditsioner, UPS"),
        Xona(x, "Sanitariya uzeli (unitazlar)", unitaz_qavatiga * qavatlar, M2_UNITAZ,
             f"har qavatda {unitaz_qavatiga} ta, 1 unitaz / {KISHI_BIR_UNITAZGA} kishi"),
        Xona(x, "Imkoniyati cheklanganlar hojatxonasi", qavatlar, M2_MAXSUS_HOJATXONA,
             "har qavatda 1 ta"),
        Xona(x, "Farrosh inventari xonasi", qavatlar, 4, "har qavatda 1 ta"),
        Xona(x, "Omborxona", 2, 10),
        Xona(x, "Elektr shchitovaya", 1, 12),
        Xona(x, "Issiqlik punkti", 1, 20),
        Xona(x, "Ventilyatsiya kamerasi", 1, 30),
    ]
    netto = sum(r.jami for r in xonalar)
    brutto = netto * p["brutto"]
    xulosa = {
        "guruhlar": guruhlar,
        "oquv_xonalari": oquv_xonalari,
        "bandlik": bandlik,
        "netto": netto,
        "brutto": brutto,
        "qavat": brutto / qavatlar,
    }
    return xonalar, xulosa


def son(x, kasr=None):
    """O'zbekcha format: minglar probel bilan, kasr vergul bilan."""
    if kasr is None:
        kasr = 0 if float(x).is_integer() else 1
    return f"{x:,.{kasr}f}".replace(",", " ").replace(".", ",")


def markdown(p):
    xonalar, xl = hisobla(p)
    q = []
    q.append("# 02. Xonalar dasturi (dastlabki hisob)\n")
    q.append("> Bu fayl `xonalar_dasturi.py` orqali yaratilgan — qo'lda tahrirlamang.")
    q.append("> Raqamlar taxminlarga asoslangan va ochiq savollarga javob olingach")
    q.append("> qayta hisoblanadi (qarang: `01-loyiha-topshirigi.md`).\n")

    q.append("## Parametrlar\n")
    q.append("| Parametr | Qiymat | Izoh |")
    q.append("|---|---:|---|")
    for k, (_, izoh) in PARAMETRLAR.items():
        kasr = 2 if isinstance(p[k], float) else None
        q.append(f"| `{k}` | {son(p[k], kasr)} | {izoh} |")
    q.append("")

    q.append("## Xonalar ro'yxati\n")
    q.append("| Zona | Xona | Soni | 1 ta, m² | Jami, m² | Izoh |")
    q.append("|---|---|---:|---:|---:|---|")
    zonalar = {}
    for r in xonalar:
        zonalar[r.zona] = zonalar.get(r.zona, 0) + r.jami
        q.append(f"| {r.zona} | {r.nomi} | {r.soni} | {son(r.maydon)} "
                 f"| {son(r.jami, 0)} | {r.izoh} |")
    q.append(f"| | **Foydali (netto) maydon** | | | **{son(xl['netto'], 0)}** | |")
    q.append("")

    q.append("## Zonalar bo'yicha\n")
    q.append("| Zona | Netto, m² | Ulushi |")
    q.append("|---|---:|---:|")
    for zona, maydon in zonalar.items():
        q.append(f"| {zona} | {son(maydon, 0)} | {maydon / xl['netto']:.0%} |")
    q.append("")

    q.append("## Xulosa\n")
    q.append(f"- Guruhlar soni: **{xl['guruhlar']}**, o'quv xonalari: **{xl['oquv_xonalari']}**")
    q.append(f"- Eng yuqori bir vaqtdagi bandlik (tadbirlar zalisiz): **~{xl['bandlik']} kishi**")
    q.append(f"- Foydali (netto) maydon: **{son(xl['netto'], 0)} m²**")
    q.append(f"- Umumiy (brutto) maydon: **~{son(round(xl['brutto'], -1), 0)} m²** "
             f"(koeffitsient {son(p['brutto'], 2)})")
    q.append(f"- Bir qavat maydoni ({p['qavatlar']} qavat): "
             f"**~{son(round(xl['qavat'], -1), 0)} m²**")
    q.append("")

    q.append("## Stsenariylar\n")
    q.append("Faqat talabalar soni o'zgaradi, qolgan parametrlar yuqoridagidek.\n")
    q.append(f"| Talabalar | O'quv xonalari | Netto, m² | Brutto, m² | 1 qavat ({p['qavatlar']} qavat), m² |")
    q.append("|---:|---:|---:|---:|---:|")
    for n in (800, 1200, 1600, 2000):
        _, s = hisobla({**p, "talabalar": n})
        q.append(f"| {son(n)} | {s['oquv_xonalari']} | {son(s['netto'], 0)} "
                 f"| ~{son(round(s['brutto'], -1), 0)} | ~{son(round(s['qavat'], -1), 0)} |")
    q.append("")
    return "\n".join(q)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    for k, (qiymat, izoh) in PARAMETRLAR.items():
        ap.add_argument(f"--{k}", type=type(qiymat), default=qiymat, help=izoh)
    print(markdown(vars(ap.parse_args())), end="")


if __name__ == "__main__":
    main()
