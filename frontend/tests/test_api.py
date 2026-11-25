"""Uji API Aether Creative terhadap server yang sudah jalan di :3000.

    cd frontend && npm run build && npm start &
    python3 tests/test_api.py

Disesuaikan dengan kontrak redesign (docs/REDESIGN.md):
  §2  GET /api/packages -> 2 paket (satuan 50k/kuota 1, hemat 100k/kuota 3)
      masing-masing punya eta + guarantee.
  §3  GET /api/templates bertambah `recommendedPackage`.
  §4  skema draft poster: `poster` + `points` tepat 3; `faq`/`heroSection` dihapus.
  §5  POST /api/orders wajib `packageKey`; GET /api/orders/[id] ->
      {order, draft, drafts, logs, remaining}; endpoint baru
      POST .../briefs (kuota) dan POST .../revision; GET /api/admin/session.
  §12 draftId tidak boleh dipakai dua kali (400).
Ekspektasi berubah karena kontrak berubah — bukan karena assertion dilemahkan.
"""
import json
import sys
import urllib.request
import urllib.error

import os
BASE = os.environ.get("BASE_URL", "http://localhost:3000")
results = []
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor())


def call(method, path, body=None, expect=200):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json"},
        method=method,
    )
    try:
        with opener.open(req, timeout=60) as resp:
            status, raw = resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        status, raw = e.code, e.read().decode()
    ok = status == expect
    results.append((f"{method} {path} -> {status} (expect {expect})", ok))
    try:
        return status, json.loads(raw)
    except json.JSONDecodeError:
        return status, raw


def check(label, cond, detail=""):
    results.append((label, bool(cond)))
    if detail and not cond:
        print(f"      detail: {detail}")


# 1. katalog: 3 contoh poster + recommendedPackage (§3)
_, tpl = call("GET", "/api/templates")
templates = tpl.get("templates", [])
check("katalog berisi 3 template", len(templates) == 3)
check("tiap template punya recommendedPackage",
      all(t.get("recommendedPackage") in ("satuan", "hemat") for t in templates))
check("katalog baru: harga satuan 50000 semua (§2)",
      all(t.get("base_price") == 50000 for t in templates))
by_cat = {t.get("category"): t.get("recommendedPackage") for t in templates}
check("peta rekomendasi §3 (kuliner hemat / kreator satuan / toko hemat)",
      by_cat.get("kuliner") == "hemat" and by_cat.get("kreator") == "satuan"
      and by_cat.get("toko") == "hemat", str(by_cat))

# 2. paket: sumber kebenaran harga/ETA/garansi (§2)
_, pk = call("GET", "/api/packages")
packages = pk.get("packages", [])
check("GET /api/packages -> 2 paket", len(packages) == 2, str(len(packages)))
pkg_map = {p.get("key"): p for p in packages}
satuan, hemat = pkg_map.get("satuan", {}), pkg_map.get("hemat", {})
check("satuan: 50000 / kuota 1", satuan.get("price") == 50000 and satuan.get("quota") == 1,
      str(satuan))
check("hemat: 100000 / kuota 3", hemat.get("price") == 100000 and hemat.get("quota") == 3,
      str(hemat))
check("satuan punya eta + garansi (§2)",
      bool(satuan.get("eta")) and bool(satuan.get("guarantee"))
      and "jam" in satuan.get("eta", "") and "Revisi" in satuan.get("guarantee", ""),
      str(satuan))
check("hemat punya eta + garansi (§2)",
      bool(hemat.get("eta")) and bool(hemat.get("guarantee"))
      and "hari" in hemat.get("eta", "") and "Revisi" in hemat.get("guarantee", ""),
      str(hemat))
check("nama tampilan sesuai §2", satuan.get("name") == "Satuan"
      and hemat.get("name") == "Paket Hemat")

# 3. draft AI memakai skema poster §4 (bukan skema website lama)
brief = {
    "templateId": "artisan-cafe",
    "brandName": "Warung Bu Tini",
    "tagline": "Soto Ayam Kampung Asli Boyolali",
    "description": "Soto ayam kampung racikan turun-temurun, buka 06.00-14.00 dekat pasar.",
    "themeColor": "emerald",
    "ctaText": "Pesan Sekarang",
    "toneOfVoice": "santai",
}
st, draft = call("POST", "/api/drafts", brief)
content = draft.get("content", {})
check("draft punya draftId", bool(draft.get("draftId")))
check("engine jujur (gemini/local)", draft.get("engine") in ("gemini", "local"))
check("brand sesuai brief", content.get("brand", {}).get("name") == "Warung Bu Tini")
# Skema §4: headline pindah dari heroSection ke poster.
check("poster.headline memakai tagline",
      "Boyolali" in content.get("poster", {}).get("headline", ""),
      str(content.get("poster", {}).get("headline", ""))[:80])
check("poster punya badge/subheadline/ctaText",
      all(content.get("poster", {}).get(k) for k in ("badge", "subheadline", "ctaText")))
check("points tepat 3 (menggantikan features)", len(content.get("points", [])) == 3,
      str(len(content.get("points", []))))
check("tiap point punya icon/title/description",
      all(p.get("icon") and p.get("title") and p.get("description")
          for p in content.get("points", [])))
# §4: faq dihapus, heroSection digantikan poster — keduanya bukan bagian skema.
check("faq sudah tidak ada", "faq" not in content, str(list(content)))
check("heroSection sudah tidak ada", "heroSection" not in content, str(list(content)))
check("field lama features sudah tidak ada", "features" not in content, str(list(content)))
theme = content.get("theme", {})
check("theme primaryColor hex emerald", theme.get("primaryColor", "").lower().startswith("#10b981"),
      str(theme.get("primaryColor")))
draft_id = draft.get("draftId")

# 4. brief aneh -> tetap 400/200 jujur
st, _ = call("POST", "/api/drafts", {"templateId": "artisan-cafe"}, expect=400)
check("brief kosong ditolak 400", st == 400)

# 5. buat order pakai packageKey (§5): satuan 50000/kuota 1
contact = {
    "contactName": "Tini",
    "contactWhatsapp": "081234567890",
    "contactEmail": "tini@warung.id",
}
st, o = call("POST", "/api/orders", {
    "draftId": draft_id, "templateId": "artisan-cafe", "packageKey": "satuan", **contact,
}, expect=201)
order = o.get("order", o)
order_number = o.get("orderNumber") or order.get("order_number")
check("order number format UK-ORD-XXXX", bool(order_number) and order_number.startswith("UK-ORD-"))
check("order langsung paid (mock payment)", order.get("payment_status") == "paid")
check("order status paid", order.get("status") == "paid")
check("packageKey satuan -> total 50000 & quota 1",
      order.get("total_price") == 50000 and order.get("quota") == 1,
      f"total={order.get('total_price')} quota={order.get('quota')}")
check("package_name tampilan 'Satuan'", order.get("package_name") == "Satuan",
      str(order.get("package_name")))
satuan_order_id, satuan_order_number = order.get("id"), order_number

# 6. order kedua: Paket Hemat 100000/kuota 3 (draft baru — draftId tidak boleh dipakai ulang)
st, d2 = call("POST", "/api/drafts", dict(brief, brandName="Kedai Pak Hemat",
                                           tagline="Hematnya Ngepost Tiap Hari"))
draft_id_2 = d2.get("draftId")
check("draft kedua dibuat", bool(draft_id_2))
st, o2 = call("POST", "/api/orders", {
    "draftId": draft_id_2, "templateId": "artisan-cafe", "packageKey": "hemat", **contact,
}, expect=201)
order2 = o2.get("order", o2)
check("packageKey hemat -> total 100000 & quota 3",
      order2.get("total_price") == 100000 and order2.get("quota") == 3,
      f"total={order2.get('total_price')} quota={order2.get('quota')}")
check("package_name tampilan 'Paket Hemat'", order2.get("package_name") == "Paket Hemat",
      str(order2.get("package_name")))
hemat_order_id, hemat_order_number = order2.get("id"), o2.get("orderNumber")

# 7. packageKey tidak dikenal -> 400 (§5: wajib salah satu dari §2)
st, _ = call("POST", "/api/orders", {
    "draftId": draft_id_2, "templateId": "artisan-cafe", "packageKey": "gila", **contact,
}, expect=400)
check("packageKey tidak dikenal -> 400", st == 400)

# 8. draftId sudah terpasang -> 400 (audit §12: checkout kedua tidak boleh mencabut draft)
st, reuse = call("POST", "/api/orders", {
    "draftId": draft_id, "templateId": "artisan-cafe", "packageKey": "hemat", **contact,
}, expect=400)
check("draftId dipakai ulang -> 400", st == 400, str(reuse)[:100])

# 9. lacak nomor -> bentuk standar §5 {order, draft, drafts, logs, remaining}
st, t = call("GET", f"/api/orders?number={order_number}")
tracked = t.get("order", {})
check("lacak nomor menemukan order", tracked.get("order_number") == order_number)
check("lacak punya draft", bool(t.get("draft")))
check("lacak punya logs", len(t.get("logs", [])) >= 1)
check("lacak punya drafts (array)", isinstance(t.get("drafts"), list) and len(t["drafts"]) >= 1)
check("lacak: remaining kuota satuan = 0", t.get("remaining") == 0, str(t.get("remaining")))

# 10. lacak nomor salah -> 404
st, _ = call("GET", "/api/orders?number=UK-ORD-0000", expect=404)
check("nomor salah -> 404", st == 404)

# 11. detail order by id -> {order, draft, drafts, logs, remaining}
st, det = call("GET", f"/api/orders/{hemat_order_id}")
check("GET /api/orders/[id] -> 200", st == 200)
check("detail punya 5 field §5",
      all(k in det for k in ("order", "draft", "drafts", "logs", "remaining")),
      str(list(det)))
check("detail: remaining kuota hemat = 2 (kuota 3 - 1 draft)",
      det.get("remaining") == 2, str(det.get("remaining")))
check("detail: drafts semua milik order", len(det.get("drafts", [])) == 1)

# 12. tambah brief sampai kuota habis -> 400 (§5)
st, b1 = call("POST", f"/api/orders/{hemat_order_id}/briefs",
              {"orderNumber": hemat_order_number,
               "brief": dict(brief, brandName="Brief Tambahan Satu",
                             tagline="Promo Weekend Kedai")}, expect=201)
check("brief tambahan 1 -> 201", st == 201, str(b1)[:120])
check("brief tambahan 1: remaining 1", b1.get("remaining") == 1, str(b1.get("remaining")))
st, b2 = call("POST", f"/api/orders/{hemat_order_id}/briefs",
              {"orderNumber": hemat_order_number,
               "brief": dict(brief, brandName="Brief Tambahan Dua",
                             tagline="Diskon Akhir Bulan")}, expect=201)
check("brief tambahan 2 -> 201", st == 201, str(b2)[:120])
check("brief tambahan 2: remaining 0", b2.get("remaining") == 0, str(b2.get("remaining")))
st, b3 = call("POST", f"/api/orders/{hemat_order_id}/briefs",
              {"orderNumber": hemat_order_number,
               "brief": dict(brief, brandName="Brief Keempat",
                             tagline="Melebihi Kuota Paket")}, expect=400)
check("kuota habis -> 400 'Kuota paket sudah habis'",
      st == 400 and "Kuota paket sudah habis" in str(b3.get("error", "")), str(b3)[:140])
st, det2 = call("GET", f"/api/orders/{hemat_order_id}")
check("setelah 2 brief: drafts = 3 & remaining = 0",
      len(det2.get("drafts", [])) == 3 and det2.get("remaining") == 0,
      f"drafts={len(det2.get('drafts', []))} remaining={det2.get('remaining')}")
check("log [BRIEF TAMBAHAN] tercatat",
      any(str(l.get("developer_note", "")).startswith("[BRIEF TAMBAHAN]")
          for l in det2.get("logs", [])))

# 12b. order satuan (kuota 1, sudah terpakai) -> langsung 400
st, _ = call("POST", f"/api/orders/{satuan_order_id}/briefs",
             {"orderNumber": satuan_order_number,
              "brief": dict(brief, brandName="Melebihi Kuota",
                            tagline="Satuan Sudah Penuh")}, expect=400)
check("order satuan kuota habis -> 400", st == 400)

# 13. revisi -> log [REVISI], status tidak berubah (§5)
st, rev = call("POST", f"/api/orders/{hemat_order_id}/revision",
               {"orderNumber": hemat_order_number,
                "message": "Headline dibuat lebih pendek, logo diperbesar."}, expect=200)
check("POST revision -> 200", st == 200, str(rev)[:140])
check("respons revisi berisi log", bool(rev.get("log")))
check("log revisi berprefix [REVISI]",
      str(rev.get("log", {}).get("developer_note", "")).startswith("[REVISI]"),
      str(rev.get("log", {}).get("developer_note"))[:80])
st, det3 = call("GET", f"/api/orders/{hemat_order_id}")
check("timeline memuat entri [REVISI]",
      any(str(l.get("developer_note", "")).startswith("[REVISI]")
          for l in det3.get("logs", [])))
check("revisi tidak mengubah status", det3.get("order", {}).get("status") == "paid",
      str(det3.get("order", {}).get("status")))

# 14. revisi dengan nomor salah -> 404
st, _ = call("POST", f"/api/orders/{hemat_order_id}/revision",
             {"orderNumber": "UK-ORD-0000", "message": "Nomor salah sasaran."},
             expect=404)
check("revision nomor salah -> 404", st == 404)

# 15. export poster (HTML, bukan halaman website)
req = urllib.request.Request(f"{BASE}/api/export/{draft_id}")
try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        html, disp = resp.read().decode(), resp.headers.get("Content-Disposition", "")
except urllib.error.HTTPError as e:
    html, disp = e.read().decode(), ""
check("export berupa HTML", "<html" in html.lower())
check("export ada Content-Disposition attachment", "attachment" in disp)
check("export memuat brand", "Warung Bu Tini" in html)

# 16. sesi admin (endpoint baru audit §12)
st, sess = call("GET", "/api/admin/session", expect=401)
check("GET /api/admin/session tanpa cookie -> 401", st == 401 and "error" in sess)
st, _ = call("POST", "/api/admin/login", {"password": "salah"}, expect=401)
check("password salah -> 401", st == 401)
st, _ = call("POST", "/api/admin/login", {"password": "admin123"})
check("password benar -> 200", st == 200)
st, sess = call("GET", "/api/admin/session")
check("GET /api/admin/session dengan cookie -> 200 {ok:true}", st == 200 and sess.get("ok") is True,
      str(sess))

# 17. kanban
st, k = call("GET", "/api/admin/orders")
cols = k.get("columns", {})
check("kanban punya 4 kolom", set(cols) == {"backlog", "in_progress", "review", "completed"})
total = sum(len(v) for v in cols.values())
check("kanban berisi order (seed + baru)", total >= 2)
check("kartu kanban membawa paket + sisa kuota (§7)",
      all("quota" in card and "package_name" in card
          for cards in cols.values() for card in cards))

# 18. pindah status + delivery
order_id = order.get("id")
st, _ = call("PATCH", f"/api/orders/{order_id}", {"status": "in_progress", "devNote": "Mulai dikerjakan"})
check("PATCH status -> 200", st == 200)
st, _ = call(
    "PUT",
    f"/api/orders/{order_id}/delivery",
    {"liveWebsiteUrl": "https://warteg-tini.vercel.app", "downloadZipUrl": "https://files.example/tini.zip", "devNote": "Selesai deploy"},
)
check("PUT delivery -> 200", st == 200)
st, _ = call("PATCH", f"/api/orders/{order_id}", {"status": "completed"})
check("status completed -> 200", st == 200)

st, final = call("GET", f"/api/orders/{order_id}")
o2 = final.get("order", {})
check("setelah delivery: status completed", o2.get("status") == "completed")
check("setelah delivery: live URL tersimpan", o2.get("live_website_url") == "https://warteg-tini.vercel.app")

# laporan
print("\n=== HASIL UJI API ===")
failed = 0
for label, ok in results:
    print(f"{'PASS' if ok else 'FAIL'}  {label}")
    if not ok:
        failed += 1
print(f"\n{len(results) - failed}/{len(results)} lolos")
sys.exit(1 if failed else 0)