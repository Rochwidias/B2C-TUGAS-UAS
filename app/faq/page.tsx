import type { Metadata } from "next";

import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "FAQ: PosterAI" };

export default function FaqPage() {
  return (
    <InfoPage
      eyebrow="Bantuan"
      title="Pertanyaan yang sering diajukan"
      intro="Hal-hal yang paling sering ditanyakan sebelum memesan poster AI dengan finishing manusia."
      sections={[
        {
          heading: "Apakah poster benar-benar dibuat AI?",
          paragraphs: [
            "Kami memakai model gambar generatif untuk membuat kandidat awal. Kandidat terbaik lalu dirapikan manual oleh desainer: komposisi, kontras, tipografi, dan koreksi warna cetak.",
            "Setiap halaman produk mencantumkan prompt AI dan catatan apa yang diubah manusia.",
          ],
        },
        {
          heading: "Berapa lama produksi dan pengiriman?",
          paragraphs: [
            "Produksi 3–5 hari kerja setelah pesanan masuk, belum termasuk waktu pengiriman. Pesanan custom bisa lebih lama karena ada tahap review desain.",
          ],
        },
        {
          heading: "Kenapa pembayaran disebut simulasi?",
          paragraphs: [
            "Proyek ini dibuat untuk keperluan akademik. Tidak ada payment gateway yang terhubung; pesanan langsung berstatus Dibayar dan stok berkurang.",
          ],
        },
        {
          heading: "Bisakah saya membatalkan pesanan?",
          paragraphs: [
            "Pembatalan dilakukan oleh admin dari panel. Stok setiap varian akan dikembalikan tepat satu kali dan pesanan yang sudah dibatalkan tidak bisa diaktifkan kembali.",
          ],
        },
        {
          heading: "Bagaimana cara memesan desain custom?",
          paragraphs: [
            "Kirim brief lewat halaman Custom Order. Tim akan mengirim penawaran harga dan catatan desain; Anda hanya membayar setelah menyetujui penawaran.",
          ],
        },
        {
          heading: "Apakah gambar bisa dicetak di ukuran besar?",
          paragraphs: [
            "Tersedia A4, A3, dan A2. Setiap ukuran punya harga berbeda dan stok varian sendiri. Pilih ukuran di halaman detail untuk melihat harga dan ketersediaan.",
          ],
        },
      ]}
      footnote="Jawaban di halaman ini adalah bagian dari skenario demo akademik dan bukan kebijakan bisnis resmi."
    />
  );
}
