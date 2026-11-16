'use client';

import {
  Folders,
  Handshake,
  Lock,
  MapPin,
  MessageCircle,
  ShoppingBag,
  Star,
  TrendingUp,
  Truck,
  Utensils,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Nama ikon pada draft (mis. "utensils", "map-pin") dipetakan ke SVG garis.
// Emoji tidak dipakai sebagai ikon di UI mana pun (larangan DESIGN.md).
// Nilai tak dikenal dirender apa adanya sebagai teks, bukan ikon rusak.
const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  'map-pin': MapPin,
  'message-circle': MessageCircle,
  'shopping-bag': ShoppingBag,
  truck: Truck,
  lock: Lock,
  folders: Folders,
  handshake: Handshake,
  'trending-up': TrendingUp,
  star: Star,
  zap: Zap,
};

// Nilai apa pun yang tidak dikenal (mis. hasil Gemini memakai emoji) tetap
// dirender apa adanya sebagai teks, bukan ikon yang rusak.
export function DraftIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name];
  if (Icon) return <Icon className={className} aria-hidden="true" />;
  // Nilai kosong tidak menghasilkan glyph apa pun; label fitur tetap membawa arti.
  if (!name) return null;
  return (
    <span className={className} aria-hidden="true">
      {name}
    </span>
  );
}