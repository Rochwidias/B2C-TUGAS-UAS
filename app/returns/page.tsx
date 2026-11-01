import type { Metadata } from "next";

import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "Pengembalian: PosterAI" };

export default function ReturnsPage() {
  return (
    <InfoPage
      eyebrow="Bantuan"
      title="Pengembalian & garansi"
      intro="Kami ingin poster sampai dalam kondisi yang bisa langsung dipasang."
      sections={[
        {
          heading: "Klaim 7 hari",
          paragraphs: [
            "Ajukan klaim maksimal 7 hari setelah pesanan diterima bila ada kerusakan cetak, lipatan, atau kesalahan varian.",
            "Sertakan nomor pesanan dan foto kondisi kemasan serta poster.",
          ],
        },
        {
          heading: "Kerusakan saat pengiriman",
          paragraphs: [
            "Simpan kemasan dan tabung/bingkai asli sampai klaim selesai. Tim akan menilai apakah poster perlu dicetak ulang.",
          ],
        },
        {
          heading: "Produk custom",
          paragraphs: [
            "Produk custom yang sudah disetujui desainnya tidak dapat dikembalikan kecuali terdapat cacat produksi.",
          ],
        },
        {
          heading: "Proses klaim",
          paragraphs: [
            "Hubungi tim lewat halaman Kontak dengan nomor pesanan. Karena pembayaran masih simulasi, pengembalian dana juga disimulasikan di dalam demo.",
          ],
        },
      ]}
      footnote="Kebijakan ini disusun untuk kelengkapan skenario demo, bukan untuk transaksi komersial nyata."
    />
  );
}
