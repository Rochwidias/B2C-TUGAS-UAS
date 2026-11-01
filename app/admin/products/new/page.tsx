import Link from "next/link";

import { PosterForm } from "@/components/admin/poster-form";

export default function NewPosterPage() {
  return (
    <div className="max-w-3xl animate-fade-in">
      <Link
        href="/admin/products"
        className="font-display text-body-sm font-medium text-ink-muted transition-colors hover:text-accent"
      >
        ← Semua produk
      </Link>
      <p className="eyebrow mt-5">Produk baru</p>
      <h1 className="mt-2 font-display text-display-sm">Tambah poster</h1>
      <p className="mt-2 text-body text-ink-muted">
        Harga varian A3/A2 dan bingkai dihitung otomatis dari harga dasar.
      </p>
      <div className="mt-6">
        <PosterForm />
      </div>
    </div>
  );
}
