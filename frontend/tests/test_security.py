"""Verifikasi keamanan & fitur CraftAI Studio terhadap server yang sudah jalan.

    cd frontend && BASE_URL=http://localhost:3500 python3 tests/test_security.py

Urutan sengaja: uji fungsional dan validasi dulu, lalu uji yang MENINGKATKAN
penghitung rate limit paling akhir. Kalau ditukar, limit menolak uji berikutnya
dan kegagalannya menyesatkan (429 bukan bug).
"""
import http.cookiejar
import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("BASE_URL", "http://localhost:3500")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
PASS, FAIL = [], []


def check(label, cond, detail=""):
    (PASS if cond else FAIL).append(label)
    print(f"{'PASS' if cond else 'FAIL'}  {label}" + (f"  [{detail}]" if detail and not cond else ""))


def call(method, path, body=None, opener=None):
    op = opener or urllib.request.build_opener()
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        BASE + path, data=data,
        headers={"Content-Type": "application/json"},
        method=method,
    )
    try:
        with op.open(req, timeout=60) as r:
            return r.status, dict(r.headers), r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read().decode()


def jget(raw):
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


# ============ 1. header keamanan ============
st, hdrs, _ = call("GET", "/")
h = {k.lower(): v for k, v in hdrs.items()}
check("X-Content-Type-Options: nosniff", h.get("x-content-type-options") == "nosniff", str(h.get("x-content-type-options")))
check("Referrer-Policy terpasang", "referrer-policy" in h)
check("X-Frame-Options terpasang", "x-frame-options" in h)
check("Permissions-Policy terpasang", "permissions-policy" in h)
check("X-Powered-By dihapus", "x-powered-by" not in h)

# ============ 2. file SEO ============
for path, needle in [("/robots.txt", "Sitemap"), ("/sitemap.xml", "loc"), ("/manifest.webmanifest", "CraftAI")]:
    st, _, body = call("GET", path)
    check(f"{path} -> 200 & berisi '{needle}'", st == 200 and needle in body, f"dapat {st}")

st, _, body = call("GET", "/tidak-ada-halaman-ini")
check("404 custom render", st == 404 and "tidak ditemukan" in body.lower(), f"dapat {st}")

# ============ 3. endpoint tulis tanpa sesi ============
anon = urllib.request.build_opener()
st, _, _ = call("GET", "/api/admin/stats", opener=anon)
check("GET /api/admin/stats tanpa sesi -> 401", st == 401, f"dapat {st}")

st, _, _ = call("GET", "/api/admin/orders", opener=anon)
check("GET /api/admin/orders tanpa sesi -> 401", st == 401, f"dapat {st}")

st, _, raw = call("GET", "/api/templates")
templates = jget(raw).get("templates", [])
check("GET /api/templates publik -> 200", st == 200 and len(templates) == 3, f"dapat {st}")
tid = templates[0]["id"] if templates else "artisan-cafe"

st, _, raw = call("GET", "/api/orders?number=UK-ORD-8812")
check("lacak order demo -> 200", st == 200, f"dapat {st}")
oid = jget(raw).get("order", {}).get("id", "")

if oid:
    st, _, _ = call("PATCH", f"/api/orders/{oid}", {"status": "completed"}, opener=anon)
    check("PATCH status tanpa sesi -> 401", st == 401, f"dapat {st}")

    st, _, _ = call("PUT", f"/api/orders/{oid}/delivery",
                    {"liveWebsiteUrl": "https://contoh.com",
                     "downloadZipUrl": "https://contoh.com/a.zip", "devNote": "x"},
                    opener=anon)
    check("PUT delivery tanpa sesi -> 401", st == 401, f"dapat {st}")


# ============ 4. cookie palsu ============
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


opnr = urllib.request.build_opener(NoRedirect)
req = urllib.request.Request(BASE + "/admin", headers={"Cookie": "admin_session=palsu-bukan-token"})
try:
    with opnr.open(req, timeout=30) as r:
        st = r.status
except urllib.error.HTTPError as e:
    st = e.code
check("cookie palsu /admin -> redirect (bukan 200)", st in (302, 303, 307, 401), f"dapat {st}")

# ============ 5. login & sesi ============
jar = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
st, _, _ = call("POST", "/api/admin/login", {"password": "salah"}, opener=op)
check("password salah -> 401", st == 401, f"dapat {st}")

st, _, _ = call("POST", "/api/admin/login", {"password": ADMIN_PASSWORD}, opener=op)
check("login benar -> 200", st == 200, f"dapat {st}")

st, _, raw = call("GET", "/api/admin/stats", opener=op)
d = jget(raw) if st == 200 else {}
check("stats dengan sesi -> 200", st == 200, f"dapat {st}")
if st == 200:
    check("stats.counts.total berupa angka", isinstance(d.get("counts", {}).get("total"), int), str(d.get("counts")))
    check("stats.revenue berupa angka", isinstance(d.get("revenue"), int), str(d.get("revenue")))
    check("stats.averageCompletionHours ada", "averageCompletionHours" in d)
    check("stats.recentOrders berupa array", isinstance(d.get("recentOrders"), list))

# ============ 6. buat order baru (validasi) ============
brief = {
    "templateId": tid, "brandName": "Uji Keamanan",
    "tagline": "Verifikasi gate admin",
    "description": "Order untuk menguji apakah endpoint tulis benar-benar terlindungi.",
    "themeColor": "emerald", "ctaText": "Pesan", "toneOfVoice": "formal",
}
st, _, raw = call("POST", "/api/drafts", brief)
check("POST draft -> 200", st == 200, f"dapat {st}")
draft_id = jget(raw).get("draftId", "")
check("draft punya id", bool(draft_id))

st, _, _ = call("POST", "/api/orders", {
    "draftId": draft_id, "templateId": tid, "packageName": "Basic",
    "contactName": "Uji", "contactWhatsapp": "12345", "contactEmail": "bukan-email",
})
check("WA + email tidak valid -> 400", st == 400, f"dapat {st}")

st, _, _ = call("POST", "/api/orders", {
    "draftId": draft_id, "templateId": tid, "packageName": "Basic",
    "contactName": "A" * 5000, "contactWhatsapp": "081234500111", "contactEmail": "uji@contoh.com",
})
check("nama 5000 karakter -> 400", st == 400, f"dapat {st}")

st, _, _ = call("POST", "/api/orders", {
    "draftId": draft_id, "templateId": tid, "packageName": "Gila",
    "contactName": "Uji", "contactWhatsapp": "081234500111", "contactEmail": "uji@contoh.com",
})
check("paket tidak dikenal -> 400", st == 400, f"dapat {st}")

st, _, raw = call("POST", "/api/orders", {
    "draftId": draft_id, "templateId": tid, "packageName": "Basic",
    "contactName": "Normalisasi", "contactWhatsapp": "+62 811-2233-4455", "contactEmail": "n@contoh.com",
})
check("order valid -> 201", st == 201, f"dapat {st} {raw[:120]}")
new_order = jget(raw).get("order", {})
check("WA +62 dinormalkan ke 08", new_order.get("contact_whatsapp") == "081122334455",
      str(new_order.get("contact_whatsapp")))
noid = new_order.get("id", "")
nono = new_order.get("order_number", "")
check("nomor order format UK-ORD-xxxx", nono.startswith("UK-ORD-") and len(nono) == 11, nono)

st, _, _ = call("GET", "/api/orders?number=" + "X" * 500)
check("nomor order raksasa -> 400", st == 400, f"dapat {st}")

# ============ 7. dengan sesi: PATCH & delivery ============
if noid:
    st, _, raw = call("PATCH", f"/api/orders/{noid}", {"status": "review", "devNote": "Cek mutu"}, opener=op)
    check("PATCH dengan sesi -> 200", st == 200, f"dapat {st}")
    if st == 200:
        check("status benar-benar berubah", jget(raw).get("order", {}).get("status") == "review",
              str(jget(raw).get("order", {}).get("status")))

    st, _, _ = call("PATCH", f"/api/orders/{noid}", {"status": "ngawur"}, opener=op)
    check("status tidak dikenal -> 400", st == 400, f"dapat {st}")

    st, _, _ = call("PUT", f"/api/orders/{noid}/delivery",
                    {"liveWebsiteUrl": "bukan-url",
                     "downloadZipUrl": "https://contoh.com/a.zip", "devNote": "x"}, opener=op)
    check("delivery URL tidak valid -> 400", st == 400, f"dapat {st}")

    st, _, _ = call("PUT", f"/api/orders/{noid}/delivery",
                    {"liveWebsiteUrl": "https://contoh.com",
                     "downloadZipUrl": "https://contoh.com/a.zip", "devNote": "P" * 5000}, opener=op)
    check("delivery devNote 5000 karakter -> 400", st == 400, f"dapat {st}")

    st, _, _ = call("PUT", f"/api/orders/{noid}/delivery",
                    {"liveWebsiteUrl": "https://contoh.com",
                     "downloadZipUrl": "https://contoh.com/a.zip", "devNote": "Siap kirim"}, opener=op)
    check("PUT delivery dengan sesi -> 200", st == 200, f"dapat {st}")

    st, hdrs, _ = call("GET", "/admin", opener=op)
    hh = {k.lower(): v for k, v in hdrs.items()}
    check("/admin Cache-Control no-store", "no-store" in hh.get("cache-control", ""), str(hh.get("cache-control")))

# ============ 8. uji yang menaikkan counter rate limit (paling akhir) ============
print("\n--- uji rate limit (menaikkan penghitung, jadi paling akhir) ---")

st, _, _ = call("POST", "/api/drafts", dict(brief, brandName="B" * 5000))
check("brandName 5000 karakter -> 400", st == 400, f"dapat {st}")

codes = [call("POST", "/api/admin/login", {"password": "salah-terus"})[0] for _ in range(9)]
check("login brute force kena rate limit (429)", 429 in codes, f"kode={codes}")

codes = []
for i in range(11):
    codes.append(call("POST", "/api/drafts", dict(brief, brandName=f"Spam {i}"))[0])
check("draft spam kena rate limit (429)", 429 in codes, f"kode={codes}")

codes = []
for i in range(8):
    codes.append(call("POST", "/api/orders", {
        "draftId": draft_id, "templateId": tid, "packageName": "Basic",
        "contactName": f"Spam {i}", "contactWhatsapp": "081234500111", "contactEmail": "s@contoh.com",
    })[0])
check("checkout spam kena rate limit (429)", 429 in codes, f"kode={codes}")

print()
print(f"{len(PASS)}/{len(PASS) + len(FAIL)} lolos")
if FAIL:
    print("GAGAL:", *FAIL, sep="\n  - ")
sys.exit(1 if FAIL else 0)