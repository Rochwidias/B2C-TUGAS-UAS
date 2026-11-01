import type { Metadata } from "next";

import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "Syarat & Ketentuan: PosterAI" };

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Syarat & ketentuan"
      intro="Ketentuan penggunaan situs dan pemesanan poster di PosterAI."
      sections={[
        {
          heading: "Penggunaan situs",
          paragraphs: [
            "Situs ini disediakan untuk demonstrasi alur belanja B2C. Anda setuju untuk tidak menyalahgunakan formulir, akun, atau panel admin.",
          ],
        },
        {
          heading: "Harga & ketersediaan",
          paragraphs: [
            "Harga ditampilkan dalam rupiah dan dapat berubah. Stok bersifat per varian; pesanan ditolak bila jumlah melebihi stok yang tersedia.",
          ],
        },
        {
          heading: "Pembayaran simulasi",
          paragraphs: [
            "Tidak ada transaksi finansial nyata. Tombol pembayaran hanya membuat pesanan berstatus Dibayar di database demo.",
          ],
        },
        {
          heading: "Kekayaan intelektual",
          paragraphs: [
            "Gambar poster adalah aset SVG yang dibuat untuk proyek ini. Prompt dan catatan manusia ditampilkan sebagai bagian dari konsep karya.",
          ],
        },
        {
          heading: "Perubahan ketentuan",
          paragraphs: [
            "Ketentuan dapat diperbarui sewaktu-waktu untuk kebutuhan tugas. Versi terbaru selalu ditampilkan di halaman ini.",
          ],
        },
      ]}
      footnote="Dokumen ini bukan nasihat hukum dan dibuat hanya untuk kelengkapan proyek akademik."
    />
  );
}
