export const SIZES = [
  { id: "A4", label: "A4 — 21 × 30 cm", multiplier: 1 },
  { id: "A3", label: "A3 — 30 × 42 cm", multiplier: 1.6 },
  { id: "A2", label: "A2 — 42 × 59 cm", multiplier: 2.4 },
] as const;

export const FRAMES = [
  { id: "none", label: "Tanpa bingkai", extra: 0 },
  { id: "black", label: "Bingkai hitam", extra: 45000 },
  { id: "white", label: "Bingkai putih", extra: 45000 },
] as const;

export const CATEGORIES = [
  { id: "cyberpunk", label: "Cyberpunk" },
  { id: "minimalis", label: "Minimalis" },
  { id: "retro", label: "Retro" },
  { id: "alam", label: "Alam" },
  { id: "abstrak", label: "Abstrak" },
  { id: "tipografi", label: "Tipografi" },
] as const;

export const ORDER_STATUSES = [
  { id: "PAID", label: "Dibayar", tone: "bg-amber-soft text-amber" },
  { id: "PROCESSING", label: "Diproses", tone: "bg-cyan-soft text-cyan" },
  { id: "SHIPPED", label: "Dikirim", tone: "bg-violet-soft text-violet" },
  { id: "COMPLETED", label: "Selesai", tone: "bg-emerald-soft text-emerald" },
  { id: "CANCELLED", label: "Dibatalkan", tone: "bg-error-soft text-error" },
] as const;

export const CUSTOM_STATUSES = [
  { id: "REQUESTED", label: "Menunggu review", tone: "bg-amber-soft text-amber" },
  { id: "QUOTED", label: "Penawaran dikirim", tone: "bg-cyan-soft text-cyan" },
  { id: "IN_PROGRESS", label: "Dikerjakan", tone: "bg-violet-soft text-violet" },
  { id: "REVIEW", label: "Review desain", tone: "bg-magenta-soft text-magenta" },
  { id: "COMPLETED", label: "Selesai", tone: "bg-emerald-soft text-emerald" },
  { id: "REJECTED", label: "Ditolak", tone: "bg-error-soft text-error" },
] as const;

export const FREE_SHIPPING_MIN = 250_000;
export const SHIPPING_COST = 20_000;

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function sizeLabel(id: string): string {
  return SIZES.find((s) => s.id === id)?.label.split(" — ")[0] ?? id;
}

export function frameLabel(id: string): string {
  return FRAMES.find((f) => f.id === id)?.label ?? id;
}

export function orderStatusMeta(id: string) {
  return ORDER_STATUSES.find((s) => s.id === id) ?? ORDER_STATUSES[0];
}

export function customStatusMeta(id: string) {
  return CUSTOM_STATUSES.find((s) => s.id === id) ?? CUSTOM_STATUSES[0];
}

export function categoryColor(id: string): string {
  const map: Record<string, string> = {
    cyberpunk: "var(--color-cat-cyberpunk)",
    minimalis: "var(--color-cat-minimalis)",
    retro: "var(--color-cat-retro)",
    alam: "var(--color-cat-alam)",
    abstrak: "var(--color-cat-abstrak)",
    tipografi: "var(--color-cat-tipografi)",
  };
  return map[id] ?? "var(--color-cat-minimalis)";
}

export function categoryGradient(id: string): string {
  const map: Record<string, string> = {
    cyberpunk: "var(--gradient-cyberpunk)",
    minimalis: "var(--gradient-minimalis)",
    retro: "var(--gradient-retro)",
    alam: "var(--gradient-alam)",
    abstrak: "var(--gradient-abstrak)",
    tipografi: "var(--gradient-tipografi)",
  };
  return map[id] ?? "var(--gradient-minimalis)";
}

export function categoryGlow(id: string): string {
  const map: Record<string, string> = {
    cyberpunk: "var(--color-coral-glow)",
    minimalis: "rgba(26, 22, 18, 0.35)",
    retro: "var(--color-amber-glow)",
    alam: "var(--color-emerald-glow)",
    abstrak: "var(--color-violet-glow)",
    tipografi: "var(--color-magenta-glow)",
  };
  return map[id] ?? "rgba(26, 22, 18, 0.3)";
}

export function categorySoftBg(id: string): string {
  const map: Record<string, string> = {
    cyberpunk: "var(--color-coral-soft)",
    minimalis: "var(--color-bg-dim)",
    retro: "var(--color-peach-soft)",
    alam: "var(--color-sage-soft)",
    abstrak: "var(--color-lavender-soft)",
    tipografi: "var(--color-lavender-soft)",
  };
  return map[id] ?? "var(--color-bg-dim)";
}
