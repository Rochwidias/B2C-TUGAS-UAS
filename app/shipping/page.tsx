import type { Metadata } from "next";

import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "Pengiriman: PosterAI" };

export default function ShippingPage() {
  return (
    <InfoPage
      eyebrow="Bantuan"
      title="Pengiriman & kemasan"
      intro="Poster dikemas agar sampai dalam kondisi rata, tanpa lipatan, dan siap dipasang."
      sections={[
        {
          heading: "Ongkos kirim",
          paragraphs: [
            "Ongkir Rp 20.000 untuk pesanan di bawah Rp 250.000. Pesanan mulai Rp 250.000 gratis ongkir.",
            "Nominal ongkir dihitung ulang di server saat checkout, bukan dari data keranjang di browser.",
          ],
        },
        {
          heading: "Estimasi produksi",
          paragraphs: [
            "Pesanan reguler diproduksi 3–5 hari kerja. Pesanan custom menunggu persetujuan desain terlebih dahulu.",
          ],
        },
        {
          heading: "Kemasan",
          paragraphs: [
            "Poster tanpa bingkai dikirim dalam tabung keras. Poster dengan bingkai dikemas dengan pelindung sudut dan lapisan pelindung permukaan.",
          ],
        },
        {
          heading: "Pelacakan",
          paragraphs: [
            "Nomor resi pada demo ini masih simulasi. Status pesanan dapat dilihat di halaman Pesanan Saya dan diperbarui oleh admin.",
          ],
        },
      ]}
      footnote="Pengiriman nyata belum terhubung ke kurir mana pun; seluruh alur ini adalah simulasi untuk tugas B2C."
    />
  );
}
