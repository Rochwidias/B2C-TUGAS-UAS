# -*- coding: utf-8 -*-
"""Figure generation for Makalah CraftAI Studio (Kelompok 10, UTS SI134)."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Polygon
import numpy as np, os

# Palette v2 — align with Canva Blue & Purple deck (deck_core_v2.py)
TEAL = "#8B5CF6"      # primary purple (was teal #0D9488)
BLUE = "#3B82F6"      # blue secondary
DARK = "#0F172A"      # deep navy base (was #0C1B2A)
MUTED = "#475569"     # slate muted text
LIGHT = "#EDE9FE"     # very light lavender (was teal-tint #E6F4F2)
GRAY = "#94A3B8"      # gray secondary
AMBER = "#F59E0B"     # gold accent (unchanged)

plt.rcParams.update({
    "font.family": ["Calibri", "Segoe UI", "DejaVu Sans"],
    "axes.edgecolor": "#CBD5E1",
    "axes.labelcolor": MUTED,
    "text.color": DARK,
    "xtick.color": MUTED,
    "ytick.color": MUTED,
    "figure.facecolor": "white",
    "axes.facecolor": "white",
})

OUT = "D:/Project/B2C-TUGAS-UAS/tugas-uts/_build/figs"
os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------- Fig 1: latar belakang
fig, axes = plt.subplots(1, 2, figsize=(10.2, 3.9), gridspec_kw={"width_ratios": [1.15, 1]})
ax = axes[0]
labels = ["Media sosial\n(Instagram, TikTok, WA)", "E-commerce\n(Shopee, Tokopedia, dll.)"]
vals = [56.3, 47.64]
bars = ax.barh(labels, vals, color=[TEAL, "BLUE"], height=0.5)
ax.set_xlim(0, 70)
ax.invert_yaxis()
for b, v in zip(bars, vals):
    ax.text(v + 1.5, b.get_y() + b.get_height() / 2, f"{v:g}%".replace(".", ","),
            va="center", fontsize=13, fontweight="bold", color=DARK)
ax.set_title("Kanal jualan UMKM Indonesia (INDEF, 2024)", fontsize=12, fontweight="bold", color=DARK, loc="left", pad=10)
ax.set_xlabel("persen UMKM yang memakainya", fontsize=10)
ax.spines[["top", "right"]].set_visible(False)
ax.tick_params(labelsize=10)

ax = axes[1]
stats = [("Pengguna internet\nIndonesia (APJII, 2025)", 229.43, "juta"),
         ("UMKM non-pertanian\n(31 Des 2025)", 30.21, "juta")]
x = np.arange(len(stats))
bars = ax.bar(x, [s[1] for s in stats], color=[DARK, TEAL], width=0.55)
ax.set_xticks(x)
ax.set_xticklabels([s[0] for s in stats], fontsize=10)
ax.set_ylim(0, 270)
for xi, s in zip(x, stats):
    ax.text(xi, s[1] + 8, f"{s[1]:.2f}".replace(".", ",") + f" {s[2]}", ha="center",
            fontsize=13, fontweight="bold", color=DARK)
ax.set_ylabel("juta", fontsize=10)
ax.set_title("Skala pasar digital Indonesia", fontsize=12, fontweight="bold", color=DARK, loc="left", pad=10)
ax.spines[["top", "right"]].set_visible(False)
ax.tick_params(labelsize=10)
fig.tight_layout()
fig.savefig(f"{OUT}/fig1_latar_belakang.png", dpi=200, bbox_inches="tight")
plt.close(fig)

# ---------------------------------------------------------------- Fig 2: data aplikasi
fig, axes = plt.subplots(1, 3, figsize=(12.6, 3.8))
ax = axes[0]
pk = ["Pro", "Basic"]
pv = [43, 13]
bars = ax.bar(pk, pv, color=[TEAL, "BLUE"], width=0.5)
for b, v in zip(bars, pv):
    ax.text(b.get_x() + b.get_width() / 2, v + 1.2, f"{v} order\n({v/56*100:.1f}%)".replace(".", ","),
            ha="center", fontsize=10.5, fontweight="bold", color=DARK)
ax.set_ylim(0, 55)
ax.set_title("Order per paket (n = 56)", fontsize=12, fontweight="bold", color=DARK, loc="left")
ax.set_ylabel("jumlah order", fontsize=10)
ax.spines[["top", "right"]].set_visible(False)
ax.tick_params(labelsize=10)

ax = axes[1]
statuses = ["paid", "review", "in_progress", "completed"]
sv = [33, 7, 1, 15]
colors = [DARK, AMBER, "BLUE", TEAL]
def _pct(p):
    return f"{p:.1f}%".replace(".", ",") if p >= 5 else ""

w, _, at = ax.pie(sv, colors=colors, startangle=90, wedgeprops=dict(width=0.42, edgecolor="white"),
                   autopct=_pct, pctdistance=0.78,
                   textprops=dict(fontsize=9.5, color="white", fontweight="bold"))
ax.legend([f"{s} ({v})" for s, v in zip(statuses, sv)], loc="center", fontsize=9,
          frameon=False, bbox_to_anchor=(0.5, -0.05))
ax.set_title("Distribusi status order", fontsize=12, fontweight="bold", color=DARK, loc="left")

ax = axes[2]
names = ["Nasi Goreng\nPak Kumis", "Warung\nBu Tini", "Persona lainnya\n(63 draf lain)"]
nv = [28, 16, 63]
bars = ax.barh(names, nv, color=[TEAL, AMBER, "#CBD5E1"], height=0.55)
ax.invert_yaxis()
for b, v in zip(bars, nv):
    ax.text(v + 1.5, b.get_y() + b.get_height() / 2, f"{v} ({v/107*100:.0f}%)", va="center",
            fontsize=10.5, fontweight="bold", color=DARK)
ax.set_xlim(0, 78)
ax.set_title("Persona dominan pada 107 draft AI", fontsize=12, fontweight="bold", color=DARK, loc="left")
ax.set_xlabel("jumlah draft", fontsize=10)
ax.spines[["top", "right"]].set_visible(False)
ax.tick_params(labelsize=9.5)
fig.tight_layout()
fig.savefig(f"{OUT}/fig2_data_aplikasi.png", dpi=200, bbox_inches="tight")
plt.close(fig)

# ---------------------------------------------------------------- Fig 3: segmentasi
segs = ["Kafe & resto kecil\n(paket Pro)", "Warung & kuliner mikro\n(paket Basic)",
        "Brand portfolio / kreator\n(template portfolio)", "Toko online D2C\n(template shop)"]
share = [45, 30, 15, 10]
fig, ax = plt.subplots(figsize=(10.2, 4.0))
bars = ax.barh(segs, share, color=[TEAL, "BLUE", AMBER, "#CBD5E1"], height=0.55)
ax.invert_yaxis()
ax.set_xlim(0, 55)
for b, v in zip(bars, share):
    ax.text(v + 1, b.get_y() + b.get_height() / 2, f"{v}%", va="center", fontsize=14,
            fontweight="bold", color=DARK)
ax.set_xlabel("estimasi porsi kebutuhan pasar (%)", fontsize=10)
ax.set_title("Empat segmen sasaran CraftAI Studio", fontsize=13, fontweight="bold", color=DARK, loc="left", pad=12)
ax.spines[["top", "right"]].set_visible(False)
ax.tick_params(labelsize=10.5)
fig.tight_layout()
fig.savefig(f"{OUT}/fig3_segmentasi.png", dpi=200, bbox_inches="tight")
plt.close(fig)

# ---------------------------------------------------------------- Fig 4: emotion curve
stages = ["Aware", "Consider", "Purchase", "Use", "Loyal"]
emo = [1.0, -1.0, -0.5, 2.0, 3.0]
fig, ax = plt.subplots(figsize=(10.2, 4.2))
ax.axhline(0, color="#CBD5E1", lw=1.2, zorder=1)
ax.plot(stages, emo, color=TEAL, lw=3, marker="o", ms=13, zorder=3,
        markerfacecolor="white", markeredgecolor=TEAL, markeredgewidth=3)
ax.fill_between(range(len(stages)), emo, 0, where=[e >= 0 for e in emo], color=LIGHT, zorder=0)
ax.fill_between(range(len(stages)), emo, 0, where=[e < 0 for e in emo], color="#FDE9D9", zorder=0)
notes = ["Penasaran &\nskeptis terhadap AI", "Bingung pilih\npaket & template", "Cemas uang\ntanpa hasil",
         "Antusias draft keluar,\nlalu menunggu review", "Puas & siap\nmerekomendasikan"]
for i, (s, e, n) in enumerate(zip(stages, emo, notes)):
    off = 0.55 if e >= 0 else -0.75
    va = "bottom" if e >= 0 else "top"
    ax.annotate(f"{n}\n({e:+.1f})".replace(".", ","), (i, e), xytext=(i, e + off), ha="center",
                va=va, fontsize=9.5, color=MUTED, linespacing=1.3)
ax.set_ylim(-2.4, 4.6)
ax.set_ylabel("skala emosi pelanggan  (  -  )".replace("  -  ", "-3 s.d. +4"), fontsize=10)
ax.set_xticks(range(len(stages)))
ax.set_xticklabels(stages, fontsize=12, fontweight="bold", color=DARK)
ax.set_title("Kurva emosi pelanggan CraftAI Studio, lima tahap perjalanan",
             fontsize=13, fontweight="bold", color=DARK, loc="left", pad=12)
ax.spines[["top", "right"]].set_visible(False)
ax.tick_params(labelsize=10)
fig.tight_layout()
fig.savefig(f"{OUT}/fig4_emotion_curve.png", dpi=200, bbox_inches="tight")
plt.close(fig)

# ---------------------------------------------------------------- Fig 5: journey flow
fig, ax = plt.subplots(figsize=(11.6, 3.1))
ax.set_xlim(0, 100)
ax.set_ylim(0, 30)
ax.axis("off")
ax.plot([4, 96], [15, 15], color="#CBD5E1", lw=2, zorder=1)
subs = ["Kenal dari\nsosial media &\nrekomendasi", "Bandingkan\npaket & lihat\ncontoh draft",
        "Checkout\npaket lalu\nbayar", "Isi brief,\nAI draft lalu\nvalidasi manusia", "Repeat\norder &\nrekomendasi"]
for i, (s, sub) in enumerate(zip(stages, subs)):
    cx = 8 + i * 21
    halo = FancyBboxPatch((cx - 8.5, 6.5), 17, 17, boxstyle="round,pad=0.6,rounding_size=1.5",
                          fc=LIGHT if i in (0, 3, 4) else "white", ec=TEAL, lw=2, zorder=2)
    ax.add_patch(halo)
    ax.text(cx, 20.5, s, ha="center", va="center", fontsize=13.5, fontweight="bold", color=DARK, zorder=3)
    ax.text(cx, 14.6, f"skala {emo[i]:+.0f}", ha="center", va="center",
            fontsize=10.5, color=TEAL, fontweight="bold", zorder=3)
    ax.text(cx, 10.0, sub, ha="center", va="center", fontsize=9.5, color=MUTED, linespacing=1.35, zorder=3)
    ax.text(cx, 4.0, f"tahap {i+1}", ha="center", va="center", fontsize=9, color=GRAY, zorder=3)
fig.tight_layout()
fig.savefig(f"{OUT}/fig5_journey_flow.png", dpi=200, bbox_inches="tight")
plt.close(fig)

# ---------------------------------------------------------------- Fig 6: business model canvas
blocks = [
    # (col_start, row_start, width, height, title, body)
    (0, 0, 2, 2, "Key Partners", "Pengembang template, gateway pembayaran (midtrans/Xendit), komunitas UMKM & asosiasi kuliner"),
    (2, 0, 2, 1, "Key Activities", "Kurasi template, evaluasi draft AI, riset persona UMKM"),
    (2, 1, 2, 1, "Key Resources", "Katalog template, aturan prompt terstruktur, tim editor manusia"),
    (4, 0, 2, 2, "Value Propositions", "Halaman jualan siap pakai dalam hitungan menit; hasil divalidasi manusia (human-in-the-loop); harga transparan per paket"),
    (6, 0, 2, 1, "Customer Relationships", "Self-service + review manusia; dukungan via WhatsApp; program repeat order"),
    (6, 1, 2, 1, "Channels", "Web craftaistudio, Instagram/TikTok, WhatsApp, marketplace template"),
    (8, 0, 2, 2, "Customer Segments", "Kafe & resto kecil, warung & kuliner mikro, kreator/portfolio, toko online D2C"),
    (0, 2, 5, 1, "Cost Structure", "Biaya hosting & API model AI, honor kurator/editor, produksi template baru, promosi digital, biaya lisensi font & aset"),
    (5, 2, 5, 1, "Revenue Streams", "Penjualan paket Basic Rp150.000 dan Pro Rp250.000 per order (43 dari 56 order memakai Pro); lisensi template lanjutan; add-on revisi tambahan"),
]
fig, ax = plt.subplots(figsize=(11.6, 4.6))
ax.set_xlim(0, 10)
ax.set_ylim(0, 5)
ax.axis("off")
for (c, r, w, h, title, body) in blocks:
    x, y = c * 1.0, 5 - (r + h) * (5 / 3)
    rect = FancyBboxPatch((x + 0.04, y + 0.05), w - 0.08, h * (5 / 3) - 0.1,
                          boxstyle="round,pad=0.02,rounding_size=0.06",
                          fc="white" if r == 0 else LIGHT, ec="#CBD5E1", lw=1.2)
    ax.add_patch(rect)
    ax.add_patch(Polygon([[x + 0.04, y + h * (5 / 3) - 0.05], [x + 0.04 + min(w - 0.08, 1.4), y + h * (5 / 3) - 0.05]],
                         closed=False))
    import textwrap
    avail_chars = max(10, int((w - 0.34) / 0.0655))  # chars fitting at fontsize 9 in box width
    wrapped = textwrap.fill(body, width=avail_chars)
    ax.text(x + 0.16, y + h * (5 / 3) - 0.28, title, fontsize=10.5, fontweight="bold", color=TEAL, va="top")
    ax.text(x + 0.16, y + h * (5 / 3) - 0.62, wrapped, fontsize=9, color=MUTED, va="top",
            linespacing=1.45)
ax.text(0, 5.05, "Business Model Canvas — CraftAI Studio", fontsize=13, fontweight="bold",
        color=DARK, va="bottom")
fig.tight_layout()
fig.savefig(f"{OUT}/fig6_bmc.png", dpi=200, bbox_inches="tight")
plt.close(fig)

print("figures written:", sorted(os.listdir(OUT)))