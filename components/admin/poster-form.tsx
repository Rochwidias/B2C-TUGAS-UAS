"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  createPosterAction,
  updatePosterAction,
  type AdminState,
} from "@/actions/admin";
import { Alert, Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { CATEGORIES } from "@/lib/constants";

const initialState: AdminState = {};

const POSTER_IMAGES = [
  "/posters/analog-sunset.svg",
  "/posters/bentuk-tanpa-nama.svg",
  "/posters/cyberpunk-sunset.svg",
  "/posters/garis-pantai.svg",
  "/posters/jangan-terlalu-serius.svg",
  "/posters/kabut-dieng.svg",
  "/posters/kromatik-ii.svg",
  "/posters/neon-rain-district.svg",
  "/posters/quiet-geometry.svg",
  "/posters/ruang-sunyi.svg",
  "/posters/tinggal-sedikit-lagi.svg",
  "/posters/toko-kaset-1987.svg",
];

export type PosterFormValues = {
  id: string;
  title: string;
  description: string;
  aiPrompt: string | null;
  humanNote: string | null;
  category: string;
  imageUrl: string;
  basePrice: number;
  featured: boolean;
  active: boolean;
};

export function PosterForm({ poster }: { poster?: PosterFormValues }) {
  const editing = Boolean(poster);
  const [state, formAction, pending] = useActionState(
    editing ? updatePosterAction : createPosterAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {poster ? <input type="hidden" name="id" value={poster.id} /> : null}

      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Card variant="elevated" padding="lg">
        <h2 className="font-display text-heading-lg">Informasi poster</h2>
        <p className="mt-1 text-body-sm text-ink-muted">
          Data utama yang tampil di katalog dan halaman detail.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="title">Judul</Label>
            <Input
              id="title"
              name="title"
              required
              minLength={3}
              defaultValue={poster?.title}
              placeholder="Misal: Kabut Dieng"
            />
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              name="description"
              required
              minLength={20}
              defaultValue={poster?.description}
              placeholder="Ceritakan suasana dan detail poster."
              rows={4}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Kategori</Label>
              <Select
                id="category"
                name="category"
                required
                defaultValue={poster?.category ?? "minimalis"}
                options={CATEGORIES.map((category) => ({
                  value: category.id,
                  label: category.label,
                }))}
              />
            </div>
            <div>
              <Label htmlFor="basePrice">Harga dasar (Rp)</Label>
              <Input
                id="basePrice"
                name="basePrice"
                type="number"
                min={10000}
                step={1000}
                required
                defaultValue={poster?.basePrice ?? 120000}
              />
              <p className="mt-1 text-caption text-ink-soft">
                Harga A4 tanpa bingkai; ukuran dan bingkai lain dihitung otomatis.
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="imageUrl">Gambar poster</Label>
            <Select
              id="imageUrl"
              name="imageUrl"
              required
              defaultValue={poster?.imageUrl ?? POSTER_IMAGES[0]}
              options={[
                ...(poster && !POSTER_IMAGES.includes(poster.imageUrl)
                  ? [{ value: poster.imageUrl, label: poster.imageUrl }]
                  : []),
                ...POSTER_IMAGES.map((image) => ({ value: image, label: image })),
              ]}
            />
            <p className="mt-1 text-caption text-ink-soft">
              Semua gambar tersedia di <code className="font-mono">public/posters/</code>.
            </p>
          </div>
        </div>
      </Card>

      <Card variant="elevated" padding="lg">
        <h2 className="font-display text-heading-lg">Proses AI + manusia</h2>
        <p className="mt-1 text-body-sm text-ink-muted">
          Dua bagian ini adalah pembeda konsep PosterAI.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="aiPrompt">Prompt AI</Label>
            <Textarea
              id="aiPrompt"
              name="aiPrompt"
              defaultValue={poster?.aiPrompt ?? ""}
              placeholder="Prompt yang dipakai untuk kandidat awal"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="humanNote">Catatan sentuhan manusia</Label>
            <Textarea
              id="humanNote"
              name="humanNote"
              defaultValue={poster?.humanNote ?? ""}
              placeholder="Apa yang diubah manual sebelum dicetak"
              rows={3}
            />
          </div>
        </div>
      </Card>

      <Card variant="elevated" padding="lg">
        <h2 className="font-display text-heading-lg">Publikasi</h2>

        {!editing ? (
          <div className="mt-4 max-w-xs">
            <Label htmlFor="stock">Stok per varian</Label>
            <Input id="stock" name="stock" type="number" min={0} defaultValue={10} />
            <p className="mt-1 text-caption text-ink-soft">
              9 varian (3 ukuran × 3 bingkai) dibuat otomatis.
            </p>
          </div>
        ) : (
          <p className="mt-2 text-body-sm text-ink-muted">
            Stok tidak diubah dari form ini. Kelola stok lewat tabel varian di samping.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-6 text-body-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={poster?.featured ?? false}
              className="h-4 w-4 rounded border-line accent-accent"
            />
            Tampilkan di beranda
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="active"
              defaultChecked={poster?.active ?? true}
              className="h-4 w-4 rounded border-line accent-accent"
            />
            Dijual (aktif)
          </label>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : editing ? "Simpan perubahan" : "Buat poster"}
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/admin/products">Kembali</Link>
        </Button>
      </div>
    </form>
  );
}
