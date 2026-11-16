import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

// Tipografi mengikuti design-system/craftai-studio/DESIGN.md:
// Archivo = grotesque industrial untuk UI & judul, Instrument Serif italic =
// aksen editorial, JetBrains Mono = data teknis (nomor order, harga, JSON).
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CraftAI Studio | Kustomisasi Template Website dengan AI",
    template: "%s | CraftAI Studio",
  },
  description:
    "Layanan kustomisasi template website berbantuan AI: pilih template, isi brief, AI menyusun draft konten, developer mengeksekusi sampai live beserta source code.",
  applicationName: "CraftAI Studio",
  keywords: [
    "kustomisasi template website",
    "AI website builder",
    "jasa pembuatan website UMKM",
    "template cafe",
    "template portofolio",
    "toko online",
  ],
  authors: [{ name: "CraftAI Studio" }],
  creator: "CraftAI Studio",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "CraftAI Studio",
    title: "CraftAI Studio | Kustomisasi Template Website dengan AI",
    description:
      "Pilih template, isi brief bisnis, AI menyusun draft kontennya, developer mengeksekusi sampai halaman bisa dibuka publik.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CraftAI Studio | Kustomisasi Template Website dengan AI",
    description:
      "Pilih template, isi brief bisnis, AI menyusun draft kontennya, developer mengeksekusi sampai halaman bisa dibuka publik.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F0E6" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
};

// Tema dipasang sebelum paint supaya halaman gelap tidak berkedip putih dulu.
// Class `js` menandai bahwa animasi reveal boleh menyembunyikan elemen; tanpa
// JavaScript, semua konten harus tetap terlihat.
const THEME_SCRIPT = `(function(){try{document.documentElement.classList.add('js');var t=localStorage.getItem('craftai-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${archivo.variable} ${instrument.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-paper"
        >
          Lompat ke konten
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}