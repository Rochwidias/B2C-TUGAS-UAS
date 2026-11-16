"""Uji API CraftAI Studio terhadap server yang sudah jalan di :3000.

    cd frontend && npm run build && npm start &
    python3 tests/test_api.py
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


def check(label, cond):
    results.append((label, bool(cond)))


# 1. katalog
_, tpl = call("GET", "/api/templates")
templates = tpl.get("templates", [])
check("katalog berisi 3 template", len(templates) == 3)

# 2. draft AI
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
check("headline memakai tagline", "Boyolali" in content.get("heroSection", {}).get("headline", ""))
check("features tepat 3", len(content.get("features", [])) == 3)
check("faq tepat 2", len(content.get("faq", [])) == 2)
theme = content.get("theme", {})
check("theme primaryColor hex emerald", theme.get("primaryColor", "").lower().startswith("#10b981"))
draft_id = draft.get("draftId")

# 3. brief aneh -> tetap 400/200 jujur
st, _ = call("POST", "/api/drafts", {"templateId": "artisan-cafe"}, expect=400)
check("brief kosong ditolak 400", st == 400)

# 4. buat order
order_body = {
    "draftId": draft_id,
    "templateId": "artisan-cafe",
    "packageName": "Pro",
    "contactName": "Tini",
    "contactWhatsapp": "081234567890",
    "contactEmail": "tini@warung.id",
}
st, o = call("POST", "/api/orders", order_body, expect=201)
order = o.get("order", o)
order_number = o.get("orderNumber") or order.get("order_number")
check("order number format UK-ORD-XXXX", bool(order_number) and order_number.startswith("UK-ORD-"))
check("order langsung paid (mock payment)", order.get("payment_status") == "paid")
check("order status paid", order.get("status") == "paid")

# 5. lacak nomor
st, t = call("GET", f"/api/orders?number={order_number}")
tracked = t.get("order", {})
check("lacak nomor menemukan order", tracked.get("order_number") == order_number)
check("lacak punya draft", bool(t.get("draft")))
check("lacak punya logs", len(t.get("logs", [])) >= 1)

# 6. lacak nomor salah -> 404
st, _ = call("GET", "/api/orders?number=UK-ORD-0000", expect=404)
check("nomor salah -> 404", st == 404)

# 7. export source code
req = urllib.request.Request(f"{BASE}/api/export/{draft_id}")
try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        html, disp = resp.read().decode(), resp.headers.get("Content-Disposition", "")
except urllib.error.HTTPError as e:
    html, disp = e.read().decode(), ""
check("export berupa HTML", "<html" in html.lower())
check("export ada Content-Disposition attachment", "attachment" in disp)
check("export memuat brand", "Warung Bu Tini" in html)

# 8. login admin
st, _ = call("POST", "/api/admin/login", {"password": "salah"}, expect=401)
check("password salah -> 401", st == 401)
st, _ = call("POST", "/api/admin/login", {"password": "admin123"})
check("password benar -> 200", st == 200)

# 9. kanban
st, k = call("GET", "/api/admin/orders")
cols = k.get("columns", {})
check("kanban punya 4 kolom", set(cols) == {"backlog", "in_progress", "review", "completed"})
total = sum(len(v) for v in cols.values())
check("kanban berisi order (seed + baru)", total >= 2)

# 10. pindah status + delivery
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