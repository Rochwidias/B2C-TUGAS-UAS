'use client';

import {
  Folders,
  Handshake,
  Lock,
  MapPin,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
  Truck,
  Utensils,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Icon pada draft dulunya emoji; sekarang nama ikon agar konsisten dengan
// checklist ui-ux-pro-max (SVG, bukan emoji) dan tetap terwarnai currentColor.
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
  return (
    <span className={className} aria-hidden="true">
      {name || <Sparkles className={className} />}
    </span>
  );
}