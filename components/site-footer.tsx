import Link from "next/link";

import { NewsletterForm } from "@/components/newsletter-form";

const footerLinks = {
  jelajahi: [
    { href: "/products", label: "Katalog poster" },
    { href: "/custom-order", label: "Custom order" },
    { href: "/account/orders", label: "Pesanan saya" },
  ],
  bantuan: [
    { href: "/faq", label: "FAQ" },
    { href: "/shipping", label: "Pengiriman" },
    { href: "/returns", label: "Pengembalian" },
    { href: "/contact", label: "Kontak" },
  ],
  legal: [
    { href: "/privacy", label: "Kebijakan privasi" },
    { href: "/terms", label: "Syarat & ketentuan" },
  ],
};

function SocialIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    instagram: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    twitter: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    tiktok: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.545 2.163c3.162 0 5.104 2.075 5.73 4.878.092.405.088.823-.014 1.226-.18.698-.64 1.176-1.21 1.359-2.74.877-5.077 2.645-5.63 5.343-.096.473-.538.82-1.01.797-.503-.023-.895-.413-.97-.905-.497-3.248 1.155-6.023 4.09-7.694.5-.287 1.03-.057 1.265.505.196.469-.07.95-.54 1.127C6.874 8.53 4.243 10.86 3.54 14.123c-.12.567.27 1.09.762 1.123.49.03.96-.332 1.08-.845.49-2.07 1.936-3.823 4.15-4.58.616-.21 1.12-.675 1.2-.1.062.43-.303.82-.706.875-.57.078-1.085-.31-1.18-.86C6.77 9.63 5.75 7.34 7.11 5.257c.19-.294.53-.44.827-.37.52.12 2.505.64 5.43.517.533-.022.96-.455.97-.987C13.52 3.85 13.06 2.163 12.545 2.163z" />
      </svg>
    ),
  };
  return icons[name] || null;
}

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-bg-alt">
      <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr] lg:py-20">
        <div className="space-y-6">
          <Link href="/" className="inline-flex items-baseline gap-2" aria-label="PosterAI - Beranda">
            <span className="font-display text-heading-lg font-extrabold tracking-tight text-ink">
              PosterAI
            </span>
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          </Link>
          <p className="max-w-xs text-body leading-relaxed text-ink-muted">
            Poster yang dimulai oleh model AI, lalu dirapikan tangan manusia sebelum dicetak.
          </p>
          <div className="flex items-center gap-3">
            {[
              { href: "https://instagram.com", label: "Instagram", icon: "instagram" },
              { href: "https://twitter.com", label: "X (Twitter)", icon: "twitter" },
              { href: "https://tiktok.com", label: "TikTok", icon: "tiktok" },
            ].map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-ink-muted transition-all hover:border-accent hover:text-accent"
                aria-label={social.label}
              >
                <SocialIcon name={social.icon} />
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Jelajahi">
          <p className="eyebrow mb-4">Jelajahi</p>
          <ul className="space-y-3">
            {footerLinks.jelajahi.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-body text-ink-muted transition-colors hover:text-accent">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Bantuan">
          <p className="eyebrow mb-4">Bantuan</p>
          <ul className="space-y-3">
            {footerLinks.bantuan.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-body text-ink-muted transition-colors hover:text-accent">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Legal">
          <p className="eyebrow mb-4">Legal</p>
          <ul className="space-y-3">
            {footerLinks.legal.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-body text-ink-muted transition-colors hover:text-accent">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="mb-4 font-display text-heading-md">Berlangganan</p>
          <NewsletterForm compact />
        </div>
      </div>

      <div className="border-t border-line py-6">
        <div className="container-page flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-caption text-ink-muted">
            © {currentYear} PosterAI. Dibuat untuk keperluan akademik.
          </p>
          <p className="text-micro text-ink-soft">
            Next.js 16 · Prisma · Tailwind v4 · TypeScript
          </p>
        </div>
      </div>
    </footer>
  );
}
