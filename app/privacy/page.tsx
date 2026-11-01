import type { Metadata } from "next";

import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "Kebijakan Privasi: PosterAI" };

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Kebijakan privasi"
      intro="Ringkasan data apa yang disimpan aplikasi demo ini dan bagaimana data tersebut digunakan."
      sections={[
        {
          heading: "Data akun",
          paragraphs: [
            "Nama, email, dan password disimpan untuk keperluan login. Password di-hash dengan bcrypt dan tidak pernah ditampilkan kembali.",
          ],
        },
        {
          heading: "Data pesanan",
          paragraphs: [
            "Alamat pengiriman, nomor telepon, item pesanan, dan total disimpan agar riwayat pesanan dan status dapat ditampilkan.",
          ],
        },
        {
          heading: "Keranjang",
          paragraphs: [
            "Isi keranjang disimpan di localStorage browser Anda. Harga dan stok tetap dihitung ulang di server saat checkout.",
          ],
        },
        {
          heading: "Cookie sesi",
          paragraphs: [
            "Cookie JWT httpOnly dipakai untuk menjaga sesi login. Cookie ini tidak dapat dibaca oleh JavaScript di browser.",
          ],
        },
      ]}
      footnote="Proyek ini tidak mengirim data ke layanan analitik atau pihak ketiga. Seluruh data berada di database SQLite lokal."
    />
  );
}
