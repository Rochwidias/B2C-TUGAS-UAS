import type { Metadata } from "next";

import { CartProvider } from "@/components/cart-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "PosterAI: Poster AI dengan finishing manusia",
  description:
    "Marketplace poster B2C: gambar dibuat model AI, dirapikan dan dicetak oleh manusia.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getSession();

  return (
    <html lang="id" className="h-full">
      <body className="flex min-h-full flex-col">
        <a href="#main" className="skip-link">
          Lewati ke konten utama
        </a>
        <CartProvider>
          <SiteHeader user={user ? { name: user.name, role: user.role } : null} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
