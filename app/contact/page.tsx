import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "Kontak: PosterAI" };

export default function ContactPage() {
  return (
    <div>
      <InfoPage
        eyebrow="Bantuan"
        title="Hubungi tim PosterAI"
        intro="Punya pertanyaan tentang pesanan, custom order, atau kerja sama? Tim kami siap membantu."
        sections={[
          {
            heading: "Email",
            paragraphs: [
              "hello@posterai.id: untuk pertanyaan umum dan kerja sama.",
              "order@posterai.id: untuk pesanan, pembatalan, dan klaim pengembalian.",
            ],
          },
          {
            heading: "Jam respons",
            paragraphs: [
              "Senin–Jumat, 09.00–17.00 WIB. Pesan di luar jam kerja akan dibalas pada hari kerja berikutnya.",
            ],
          },
          {
            heading: "Custom order",
            paragraphs: [
              "Untuk brief desain baru, gunakan formulir Custom Order agar tema, ukuran, dan anggaran tercatat rapi.",
            ],
          },
          {
            heading: "Media sosial",
            paragraphs: [
              "Ikuti Instagram, X, dan TikTok PosterAI untuk melihat proses AI + finishing manusia di balik setiap koleksi.",
            ],
          },
        ]}
        footnote="Halaman ini adalah bagian dari demo akademik; alamat email dan jam respons hanya ilustrasi."
      />

      <div className="container-page -mt-4 pb-16">
        <Link
          href="/custom-order"
          className="inline-flex rounded-full bg-ink px-6 py-2.5 font-display text-body-sm font-semibold text-bg transition-colors hover:bg-accent"
        >
          Kirim brief custom
        </Link>
      </div>
    </div>
  );
}
