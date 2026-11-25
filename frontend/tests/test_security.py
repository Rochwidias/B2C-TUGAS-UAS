"""Verifikasi keamanan & fitur Aether Creative terhadap server yang sudah jalan.

    cd frontend && BASE_URL=http://localhost:3500 python3 tests/test_security.py

Urutan sengaja: uji fungsional dan validasi dulu, lalu uji yang MENINGKATKAN
penghitung rate limit paling akhir. Kalau ditukar, limit menolak uji berikutnya
dan kegagalannya menyesatkan (429 bukan bug).

Penyesuaian kontrak redesign (docs/REDESIGN.md) — ekspektasi berubah karena
kontrak berubah, bukan karena assertion dilemahkan:
  §2/§5  checkout memakai `packageKey` (packageName tidak lagi diproses).
  §5     endpoint tulis pelanggan baru .../briefs & .../revision dengan bucket
         rate limit sendiri (10/menit) — diuji di bagian rate limit.
  §5     429 wajib membawa `retryAfterSeconds` + header `Retry-After` (audit §12).
  §12    bypass rate limit lewat X-Forwarded-For sudah mati — diuji dengan 10
         login salah ber-XFF unik: 429 muncul tepat di percobaan ke-7.
  §9     SEO/metadata/manifest kini memakai brand "Aether Creative".
"""
import http.cookiejar
import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("BASE_URL", "http://localhost:3500").rstrip("/")
# Uji XFF dijalankan langsung ke backend: lewat rewrite Next, semua request
# berbagi satu req.ip (proses proxy), jadi penghitung percobaan ke-7 tidak bisa
# diamati di sana. Origin ini punya bucket sendiri yang belum tersentuh.
BACKEND = os.environ.get("BACKEND_URL", "http://localhost:4000").rstrip("/")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
PASS, FAIL = [], []


def check(label, cond, detail=""):
    (PASS if cond else FAIL).append(label)
    print(f"{'PASS' if cond else 'FAIL'}  {label}" + (f"  [{detail}]" if detail and not cond else ""))


def call(method, path, body=None, opener=None, base=BASE, extra_headers=None):
    op = opener or urllib.request.build_opener()
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"}
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(base + path, data=data, headers=headers, method=method)
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

# ============ 2. file SEO: brand baru "Aether Creative" (§9) ============
for path, needle in [("/robots.txt", "Sitemap"), ("/sitemap.xml", "loc"),
                     ("/manifest.webmanifest", "Aether Creative")]:
    st, _, body = call("GET", path)
    check(f"{path} -> 200 & berisi '{needle}'", st == 200 and needle in body, f"dapat {st}")

st, _, body = call("GET", "/")
check("judul halaman memakai 'Aether Creative'", "Aether Creative" in body and "<title>" in body,
      body[body.find("<title>"):body.find("</title>") + 8][:120])
check("halaman depan menyebut tagline poster UMKM", "poster" in body.lower() and "UMKM" in body)

st, _, body = call("GET", "/tidak-ada-halaman-ini")
check("404 custom render", st == 404 and "tidak ditemukan" in body.lower(), f"dapat {st}")

# ============ 3. endpoint tulis tanpa sesi ============
anon = urllib.request.build_opener()
st, _, _ = call("GET", "/api/admin/stats", opener=anon)
check("GET /api/admin/stats tanpa sesi -> 401", st == 401, f"dapat {st}")

st, _, _ = call("GET", "/api/admin/orders", opener=anon)
check("GET /api/admin/orders tanpa sesi -> 401", st == 401, f"dapat {st}")

# Endpoint baru audit §12: verifikasi token di satu tempat.
st, _, raw = call("GET", "/api/admin/session", opener=anon)
check("GET /api/admin/session tanpa sesi -> 401 {error}",
      st == 401 and "error" in jget(raw), f"dapat {st} {raw[:80]}")

st, _, raw = call("GET", "/api/templates")
templates = jget(raw).get("templates", [])
check("GET /api/templates publik -> 200", st == 200 and len(templates) == 3, f"dapat {st}")
check("templates membawa recommendedPackage (§3)",
      all(t.get("recommendedPackage") in ("satuan", "hemat") for t in templates))
tid = templates[0]["id"] if templates else "artisan-cafe"

st, _, pkraw = call("GET", "/api/packages")
packages = jget(pkraw).get("packages", [])
check("GET /api/packages publik -> 2 paket (§2)",
      st == 200 and len(packages) == 2 and {p.get("key") for p in packages} == {"satuan", "hemat"},
      f"dapat {st}")

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

# Endpoint baru §5/§12: 200 {ok:true} bila cookie valid.
st, _, raw = call("GET", "/api/admin/session", opener=op)
check("session dengan cookie -> 200 {ok:true}", st == 200 and jget(raw).get("ok") is True,
      f"dapat {st} {raw[:80]}")

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

# Enum themeColor berubah di §4 (indigo digantikan violet) — nilai lama ditolak.
st, _, raw = call("POST", "/api/drafts", dict(brief, themeColor="indigo"))
check("themeColor lama 'indigo' -> 400 (enum §4 violet|navy|amber|emerald)",
      st == 400 and "violet" in raw, f"dapat {st} {raw[:100]}")

st, _, _ = call("POST", "/api/orders", {
    "draftId": draft_id, "templateId": tid, "packageKey": "satuan",
    "contactName": "Uji", "contactWhatsapp": "12345", "contactEmail": "bukan-email",
})
check("WA + email tidak valid -> 400", st == 400, f"dapat {st}")

st, _, _ = call("POST", "/api/orders", {
    "draftId": draft_id, "templateId": tid, "packageKey": "satuan",
    "contactName": "A" * 5000, "contactWhatsapp": "081234500111", "contactEmail": "uji@contoh.com",
})
check("nama 5000 karakter -> 400", st == 400, f"dapat {st}")

# Kontrak §5: harga & kuota hanya datang dari packageKey yang valid.
st, _, raw = call("POST", "/api/orders", {
    "draftId": draft_id, "templateId": tid, "packageKey": "gila",
    "contactName": "Uji", "contactWhatsapp": "081234500111", "contactEmail": "uji@contoh.com",
})
check("packageKey tidak dikenal -> 400", st == 400 and "satuan" in raw, f"dapat {st} {raw[:100]}")

st, _, raw = call("POST", "/api/orders", {
    "draftId": draft_id, "templateId": tid, "packageKey": "satuan",
    "contactName": "Normalisasi", "contactWhatsapp": "+62 811-2233-4455", "contactEmail": "n@contoh.com",
})
check("order valid -> 201", st == 201, f"dapat {st} {raw[:120]}")
new_order = jget(raw).get("order", {})
check("WA +62 dinormalkan ke 08", new_order.get("contact_whatsapp") == "081122334455",
      str(new_order.get("contact_whatsapp")))
check("packageKey satuan -> 50000 / kuota 1 (§2)",
      new_order.get("total_price") == 50000 and new_order.get("quota") == 1
      and new_order.get("package_name") == "Satuan",
      str({k: new_order.get(k) for k in ("total_price", "quota", "package_name")}))
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

    # Validasi panjang endpoint baru .../revision (LIMITS.revision = 1000, §5).
    st, _, raw = call("POST", f"/api/orders/{noid}/revision",
                      {"orderNumber": nono, "message": "R" * 1500})
    check("revision message 1500 karakter -> 400", st == 400, f"dapat {st} {raw[:80]}")

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
        "draftId": draft_id, "templateId": tid, "packageKey": "satuan",
        "contactName": f"Spam {i}", "contactWhatsapp": "081234500111", "contactEmail": "s@contoh.com",
    })[0])
check("checkout spam kena rate limit (429)", 429 in codes, f"kode={codes}")

# Bucket tulis pelanggan (§5: briefs & revision, 10/menit per IP).
# Panggilan pertama sudah terpakai oleh uji revision 1500 karakter di atas, jadi
# batas 10 tercapai pada panggilan customer-write ke-11 = percobaan brief ke-10.
codes = []
for i in range(11):
    codes.append(call("POST", f"/api/orders/{noid}/briefs" if noid else "/api/orders/x/briefs", {
        "orderNumber": nono,
        "brief": dict(brief, brandName=f"Spam Kuota {i}", tagline="Melewati batas kuota"),
    })[0])
check("brief spam kena rate limit bucket pelanggan (429)", 429 in codes, f"kode={codes}")
check("9 panggilan pertama lolos limit lalu 400 (kuota habis), ke-10 -> 429",
      codes[:9] == [400] * 9 and codes[9] == 429 and codes[10] == 429, f"kode={codes}")

# 429 wajib jujur: retryAfterSeconds di JSON + header Retry-After (audit §12).
st, hdrs, raw = call("POST", "/api/admin/login", {"password": "lagi"})
hh = {k.lower(): v for k, v in hdrs.items()}
body = jget(raw)
check("429 login membawa retryAfterSeconds", st == 429 and isinstance(body.get("retryAfterSeconds"), int)
      and body.get("retryAfterSeconds") > 0, f"dapat {st} {raw[:120]}")
check("429 login membawa header Retry-After", st == 429 and str(hh.get("retry-after", "")).isdigit()
      and int(hh["retry-after"]) > 0, f"header={hh.get('retry-after')}")

# Audit §12: X-Forwarded-For tidak lagi menentukan kunci rate limit.
# 10 percobaan login salah dengan XFF unik tiap request: bila limit masih
# membaca XFF, tiap request mendapat kunci baru dan tidak pernah 429.
xff_codes = []
for i in range(10):
    st_i, _, _ = call("POST", "/api/admin/login", {"password": f"salah-xff-{i}"},
                      base=BACKEND, extra_headers={"X-Forwarded-For": f"203.0.113.{i + 1}"})
    xff_codes.append(st_i)
check("XFF unik tiap percobaan: 6 pertama tetap 401 (bucket bersih)",
      xff_codes[:6] == [401] * 6, f"kode={xff_codes}")
check("bypass XFF sudah mati: percobaan ke-7 tetap 429",
      xff_codes[6] == 429, f"kode={xff_codes}")
check("percobaan ke-8..10 tetap 429", xff_codes[7:] == [429] * 3, f"kode={xff_codes}")

print()
print(f"{len(PASS)}/{len(PASS) + len(FAIL)} lolos")
if FAIL:
    print("GAGAL:", *FAIL, sep="\n  - ")
sys.exit(1 if FAIL else 0)