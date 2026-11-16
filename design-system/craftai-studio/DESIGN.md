# DESIGN.md — CraftAI Studio

Dokumen ini adalah **arah desain** (identity, mood, dials) yang dipakai `antislop` sebagai filter.
Untuk token turunan hasil generate, lihat `MASTER.md`. Bila keduanya berbeda soal warna dan
tipografi, **dokumen ini yang menang**: MASTER.md digenerate otomatis dan carry-over palet ungu
+ pink generik yang tidak pernah cocok dengan produk ini.

## Design Read

> Reading this as: **productized web-customization service** untuk pelaku UMKM Indonesia,
> dengan bahasa visual **percetakan / print workshop** (kertas, tinta, garis registrasi),
> dial **ENERGY 3 / RHYTHM 3 / MOTION 2**.

## Alasan Arah (R-31, satu baris per keputusan)

| Keputusan | Alasan |
|---|---|
| Kanvas kertas hangat `#F5F0E6`, bukan putih | Produk ini menjual *hasil cetak*: kertas, tinta, dan mesin. Putih steril adalah bahasa SaaS, bukan workshop. |
| Tinta `#16130F` untuk teks | Mendekati tinta cetak di atas kertas, kontras 16.3:1 (jauh di atas AA). |
| Satu aksen vermilion `#C63C1C` | Dipakai hanya pada satu hal per layar: angka langkah aktif, CTA utama, dan cap status. Satu aksen = hierarki jelas. |
| Archivo (grotesque industrial) untuk judul & UI | Bentuk hurufnya seperti signage pabrik: cocok untuk " workshop", punya rentang bobot 100-900 untuk skala poster. |
| Instrument Serif italic hanya untuk 1 frasa per hero | Kontraposisi editorial: memisahkan kalimat "buatan mesin" dari "sentuhan manusia" tanpa perlu badge. |
| JetBrains Mono untuk angka order, harga, dan JSON | Data ini benar benar teknis. Mono membuat `UK-ORD-8812` dan payload JSON terbaca sebagai artefak sistem, bukan hiasan. |
| Garis registrasi + colom 12 yang terlihat di hero | Menampilkan struktur: customer melihat bahwa hasil akhirnya dibangun di atas grid, bukan kebetulan. |
| Bayangan keras `4px 4px 0` (bukan blur) | Bayangan cetak offset, bukan glow. Menandai elevasi tanpa membuat halaman terasa melayang. |
| Tanpa gradient ungu-pink, tanpa glassmorphism, tanpa grid dot | Semua teknik itu adalah penanda generik "AI landing page". Tidak ada hierarki yang mereka layani di sini. |
| Tema gelap = kertas hitam + tinta terang | Kebalikan dari terang, bukan mode "tech". Developer dan admin butuh layar redup saat kerja malam. |

## Dials

- **ENERGY 3** — headline poster, angka besar, band tinta penuh.
- **RHYTHM 3** — hero asimetris, band gelap penuh, katalog grid, harga berbentuk ledger. Tidak ada dua section dengan komposisi sama.
- **MOTION 2** — satu gestur: reveal naik 12px saat masuk viewport, plus offset bayangan saat hover. Tidak ada parallax, tidak ada animasi > 500ms.

## Token Warna

| Peran | Terang | Gelap | Catatan |
|---|---|---|---|
| `--paper` (kanvas) | `#F5F0E6` | `#141210` | |
| `--surface` (kartu) | `#FFFCF6` | `#1E1A16` | |
| `--ink` (teks utama) | `#16130F` | `#F5F0E6` | 16.3:1 di terang, 16.4:1 di gelap |
| `--ink-soft` (teks sekunder) | `#5C544B` | `#A79C8E` | 6.55:1 dan 6.93:1 |
| `--rule` (garis) | `#D8D0C2` | `#352F28` | non-teks, dekoratif |
| `--accent` | `#C63C1C` | `#FF6B3D` | 4.55:1 dan 6.61:1 |
| `--accent-ink` (teks di atas aksen) | `#FFFFFF` | `#141210` | 5.17:1 dan 6.61:1 |
| `--ok` | `#1F6F4A` | `#5FD3A0` | 5.39:1 dan 10.07:1 |
| `--warn` | `#8A5A00` | `#E8B54B` | 5.22:1 dan 9.92:1 |
| `--danger` | `#B3261E` | `#FF8A7A` | 5.75:1 dan 8.16:1 |

Palet aktif: 2 warna inti (kertas, tinta) + 1 aksen (vermilion). Hijau/amber/merah hanya
muncul sebagai status fungsional, bukan warna dekoratif.

## Tipografi

- Display & UI: **Archivo** 400-900, tracking rapat untuk judul besar.
- Aksen editorial: **Instrument Serif** italic, maksimal satu frasa per hero.
- Data teknis: **JetBrains Mono** 400-700.

## Motif Identitas

1. **Garis registrasi** (`+`) di sudut panel dan penanda kolom.
2. **Cap status** persegi dengan border 1.5px dan huruf mono, bukan pill glassy.
3. **Angka ledger** (01, 02, 03) di depan setiap langkah.

## Larangan (di samping aturan antislop)

- Tidak ada pill + border tipis + glow + uppercase sekaligus.
- Tidak ada emoji sebagai ikon (field `emoji` di database hanya dipakai sebagai teks isi, bukan ikon).
- Tidak ada `text-white` di atas kanvas terang. Semua warna lewat token semantik.
- Tidak ada `outline: none` tanpa pengganti yang terlihat.