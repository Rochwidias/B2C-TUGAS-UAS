# Playful & Organic Redesign Spec — PosterAI

**Date:** 2026-10-31
**Scope:** Full rewrite — design system + 8 halaman user-facing
**Direction:** Colorful (curated, not AI slop), Bold typography, Organic shapes, Friendly personality

---

## 1. Design Tokens

### Color Palette — Curated Colorful (12 colors, no random gradients)

| Role | Hex | Usage |
|------|-----|-------|
| **Background** | `#FFFDF8` (cream paper) | Base bg |
| **Surface** | `#FFFFFF` | Cards, modals |
| **Surface Alt** | `#F5F0E8` | Alternating sections |
| **Ink** | `#1A1612` | Primary text (near-black warm) |
| **Ink Muted** | `#6B5D4E` | Secondary text |
| **Accent Primary** | `#E85D04` (bold terracotta) | Primary CTA, key highlights |
| **Accent Secondary** | `#0096C7` (vivid cyan) | Links, info, secondary actions |
| **Accent Tertiary** | `#9B2226` (deep crimson) | Destructive, sale badge |
| **Playful Mint** | `#2EC4B6` | Success, mint category |
| **Playful Peach** | `#FF9F1C` | Warning, retro category |
| **Playful Lavender** | `#A663CC` | Custom order, tipografi category |
| **Playful Sage** | `#52B788` | Nature, alam category |
| **Playful Coral** | `#F72585` | Cyberpunk, accent highlights |
| **Playful Butter** | `#FFD60A` | Highlights, stars, energy |

**Category Mapping (intentional, not random):**
- Cyberpunk → Coral `#F72585` + Cyan `#0096C7` (dual-tone)
- Minimalis → Ink `#1A1612` + Butter `#FFD60A`
- Retro → Peach `#FF9F1C` + Terracotta `#E85D04`
- Alam → Sage `#52B788` + Mint `#2EC4B6`
- Abstrak → Lavender `#A663CC` + Coral `#F72585`
- Tipografi → Lavender `#A663CC` + Cyan `#0096C7`

**No random gradients.** Every gradient is predefined: `gradient-hero`, `gradient-card`, `gradient-accent`, `gradient-category-{name}`.

### Typography — Bold & Legible

| Scale | Font | Weight | Size (clamp) | Usage |
|-------|------|--------|--------------|-------|
| Display XL | **Plus Jakarta Sans** | 800 | `clamp(3rem, 8vw, 6rem)` | Hero headlines |
| Display LG | Plus Jakarta Sans | 700 | `clamp(2.5rem, 6vw, 4.5rem)` | Section heroes |
| Display MD | Plus Jakarta Sans | 700 | `clamp(2rem, 4vw, 3rem)` | Card titles large |
| Display SM | Plus Jakarta Sans | 600 | `clamp(1.5rem, 3vw, 2.25rem)` | Section titles |
| Heading XL | Plus Jakarta Sans | 700 | `clamp(1.75rem, 2.5vw, 2.25rem)` | Page titles |
| Heading LG | Plus Jakarta Sans | 600 | `clamp(1.375rem, 2vw, 1.75rem)` | Card headlines |
| Heading MD | Plus Jakarta Sans | 600 | `1.25rem` | Sub-headlines |
| Body LG | **DM Sans** | 500 | `1.125rem` | Important body |
| Body | DM Sans | 400 | `1rem` | Default body |
| Body SM | DM Sans | 400 | `0.875rem` | Captions, meta |
| Caption | DM Sans | 500 | `0.75rem` | Labels, badges |
| Micro | DM Sans | 600 | `0.625rem` | Eyebrows, uppercase |

**Key principle:** Display font (Plus Jakarta Sans) for all headlines — geometric, friendly, bold. Body font (DM Sans) for readability. Weight 600+ for anything that needs to pop.

### Border Radius — Organic Scale

| Token | Value | Usage |
|-------|-------|-------|
| `radius-xs` | `0.375rem` (6px) | Badges, pills |
| `radius-sm` | `0.5rem` (8px) | Buttons, inputs |
| `radius-md` | `0.75rem` (12px) | Small cards |
| `radius-lg` | `1rem` (16px) | Default cards |
| `radius-xl` | `1.5rem` (24px) | Large cards, modals |
| `radius-2xl` | `2rem` (32px) | Hero sections, featured cards |
| `radius-full` | `9999px` | Pills, avatars, bubbles |
| `radius-blob` | `60% 40% 30% 70% / 60% 30% 70% 40%` | Organic blob shapes |

### Shadows — Soft & Layered

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgb(26 22 18 / 0.06)` | Subtle depth |
| `shadow-card` | `0 4px 24px -8px rgb(26 22 18 / 0.12), 0 1px 3px rgb(26 22 18 / 0.06)` | Default cards |
| `shadow-card-hover` | `0 20px 48px -16px rgb(26 22 18 / 0.18), 0 8px 20px -8px rgb(26 22 18 / 0.1)` | Hover lift |
| `shadow-float` | `0 24px 64px -24px rgb(26 22 18 / 0.2)` | Floating elements |
| `shadow-glow-{color}` | `0 0 32px -8px {color}40` | Category glows (predefined only) |
| `shadow-inner` | `inset 0 2px 4px rgb(26 22 18 / 0.05)` | Pressed states |

### Spacing — 4px Base Scale (consistent)

`0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`

---

## 2. Layout Primitives

### Container
```css
.container-page {
  width: 100%;
  max-width: 80rem;        /* 1280px — slightly wider for breathing room */
  margin-inline: auto;
  padding-inline: 1.5rem;  /* 24px mobile */
}
@media (min-width: 768px) { padding-inline: 2rem; }   /* 32px tablet */
@media (min-width: 1280px) { padding-inline: 3rem; }  /* 48px desktop */
```

### Section
```css
.section { padding-block: 4rem; }           /* 64px default */
.section-lg { padding-block: 6rem; }        /* 96px hero */
.section-sm { padding-block: 2.5rem; }      /* 40px compact */
```

### Organic Dividers
- `divider-wavy` — SVG wave line (cream → accent → cream)
- `divider-blob` — Organic blob separator
- `divider-dots` — Animated dot pattern

### Blob Backgrounds (CSS-only, no images)
```css
.blob-1 { background: radial-gradient(ellipse at 20% 20%, var(--color-coral-soft) 0%, transparent 50%); }
.blob-2 { background: radial-gradient(ellipse at 80% 80%, var(--color-mint-soft) 0%, transparent 50%); }
.blob-3 { background: radial-gradient(ellipse at 50% 10%, var(--color-lavender-soft) 0%, transparent 40%); }
```
Animated with slow `float` + `morph` keyframes.

---

## 3. Core Components (New — Replace ui.tsx)

### Button — Pill-shaped, Bold, Expressive
```tsx
// Variants: primary, secondary, outline, ghost, danger, soft-{color}
// Sizes: sm, md, lg, xl (all pill: radius-full)
// States: loading (spinner), disabled, pressed (scale 0.97)
// Icons: leftIcon, rightIcon (auto-spacing)
// asChild for Link integration
```
**Visual:** Primary = gradient `accent-primary → accent-secondary`, bold text, shadow-glow. Hover = lift + glow intensify. Pressed = scale down.

### Input — Floating Label, Organic Focus
```tsx
// Label floats up on focus/filled
// Border: 2px solid transparent → accent on focus
// Background: surface → surface-alt on focus
// Error: border accent-tertiary, shake animation
// Helper text below
// Left/right icon slots
```

### Card — 3 Variants
| Variant | Visual |
|---------|--------|
| `elevated` | White, shadow-card, radius-xl, hover: shadow-card-hover + translateY(-4px) |
| `glass` | Backdrop-blur, border: 1px solid accent/10, radius-xl |
| `organic` | Blob border (animated), gradient background, radius-2xl |

### Badge — Pill, Emoji-Ready
```tsx
// Variants: default, category, status, price, new, sale, playful
// Size: sm, md, lg
// Supports emoji prefix: <span role="img" aria-label="sparkles">✨</span>
// Category badges use predefined category colors (not dynamic)
```

### PosterCard — Organic Frame
- Aspect ratio 3:4
- Organic mask (blob clip-path) on image
- Colored accent bar top (category color)
- Hover: image scale 1.03, card lift, accent bar expands
- Category pill + price badge bottom
- Wishlist/share buttons fade in on hover (organic bubble animation)

### VariantPicker — Visual Cards (Not Dropdown)
- Grid of visual cards: size × frame
- Each card: icon + label + price + stock indicator
- Selected: 2px accent border + checkmark + scale 1.02
- Out of stock: opacity 0.4, strikethrough, not clickable

### CartItem — Swipe Actions (Mobile)
- Image (organic mask) + details + qty stepper (pill buttons)
- Swipe left → delete (red bg, trash icon)
- Desktop: hover reveal delete button

### CheckoutForm — Stepped Progress
- Step indicator: 1. Alamat → 2. Bayar → 3. Selesai
- Each step in organic card
- Progress bar: animated blob fill
- Validation: inline, shake on error, success checkmark

### Admin Components
- StatCard: organic blob accent left, large bold number, icon in circle
- DataTable: sticky header, hover row highlight, organic pagination
- ActionCard: gradient border on hover, icon bubble

---

## 4. Page Designs

### 4.1 Home (`/`)
```
[Hero]                    ── Organic blob bg, animated
  - Eyebrow: "Marketplace Poster AI + Finishing Manusia"
  - H1: "Dibuat AI,<br/>Diselesaikan Manusia" (Display XL, gradient-text)
  - Subhead: 2 lines, body-lg, ink-muted
  - CTA Group: Primary "Jelajahi Katalog" + Secondary "Pesan Custom"
  - Stats Bar: 4 items (icon + bold number + label) — animated count-up

[Process]                 ── 3 columns, organic cards
  - Step cards with number blob, icon bubble, hover lift + glow

[Featured Posters]        ── Masonry grid (CSS grid auto-flow dense)
  - 4 posters: 1 featured (2x2), 3 regular
  - Stagger entrance animation

[Custom CTA]              ── Full-width organic section
  - Gradient blob bg, illustrated elements
  - "Punya ide?" headline, 3 trust badges with emoji

[Newsletter]              ── Centered, playful
  - Email input with floating label, submit button with arrow
```

### 4.2 Products (`/products`)
```
[Header]                  ── Title + count + description
[Filters]                 ── Sticky top on scroll
  - Search: floating label, icon left
  - Category pills: horizontal scroll, organic shape, active = filled + icon
  - Sort: select with custom arrow
  - Clear filters: pill button (appears when active)

[Grid]                    ── Responsive: 1col <640, 2col <1024, 3col <1440, 4col ≥1440
  - PosterCard with stagger
  - Skeleton loaders (organic blob shapes)

[Pagination]              ── Centered, pill buttons, active = primary
```

### 4.3 Product Detail (`/products/[slug]`)
```
[Breadcrumb]              ── Organic dots separator, category dot colored

[Gallery + Info]          ── 2-col lg, stacked mobile
  LEFT: Gallery
    - Hero image: organic mask, zoom on hover
    - Thumbnail strip: horizontal scroll, active = accent border + scale
    - Share/wishlist: floating bubbles top-right

  RIGHT: Sticky Info Panel
    - Category pill + title (Display SM)
    - Description (body-lg)
    - VariantPicker: visual card grid (size × frame)
    - Specs: icon + label + value (dl)
    - Add to cart: full-width primary button, animated cart icon

[Behind the Poster]       ── 2-col cards side by side
  - Left: "Prompt AI" — code block style, mono font, cyan accent bar
  - Right: "Sentuhan Manusia" — prose, lavender accent bar

[Related]                 ── 4-col carousel (scroll snap)
```

### 4.4 Cart (`/cart`)
```
[Header]                  ── Title + item count badge

[Items]                   ── List (not grid)
  - Each: Card organic, image left, details right
  - Qty stepper: pill buttons, input center
  - Line price: bold, accent
  - Swipe/delete: organic animation

[Summary Sidebar]         ── Sticky, elevated card
  - Subtotal, shipping (progress bar to free), total (Display MD)
  - Free shipping progress: animated blob fill
  - Trust badges: emoji + text
  - CTA: "Lanjut Checkout" — primary, full-width, pulse subtle
```

### 4.5 Checkout (`/checkout`)
```
[Progress Steps]          ── 3 steps, organic connectors, current = pulsing blob

[Step 1: Alamat]          ── Organic card, floating label inputs
  - Prefill from account if logged in
  - Validation inline + shake
  - "Simpan alamat" checkbox (if logged in)

[Step 2: Bayar]           ── Payment method cards (simulasi)
  - Radio cards: "Bayar Sekarang (Simulasi)", "Transfer Manual"
  - Selected: accent border + checkmark animation
  - Idempotency key notice (micro text)

[Step 3: Selesai]         ── Success animation (checkmark morph)
  - Order number (copyable)
  - Summary
  - "Kembali ke Beranda" + "Lihat Pesanan"
```

### 4.6 Custom Order (`/custom-order`)
```
[Hero]                    ── Illustrated, "Kreasikan Poster Impianmu"

[Brief Form]              ── Stepped or single long form
  - Tema/Gaya: visual picker (category cards with illustrations)
  - Ukuran: visual cards (A4/A3/A2 with size comparison)
  - Bingkai: visual cards
  - Deskripsi: textarea floating label
  - Referensi: file upload (drag-drop zone, organic border)
  - Budget: range slider (playful)

[Status Tracker]          ── If existing: timeline with organic connectors
  - Steps: Requested → Quoted → In Progress → Review → Completed
  - Current step: pulsing blob
```

### 4.7 Account Orders (`/account/orders`)
```
[Header]                  ── "Pesanan Saya" + badge count

[Empty State]             ── Illustrated empty, CTA to katalog

[Orders List]             ── Card per order
  - Header: order number, date, status badge (organic pill)
  - Items: horizontal scroll thumbnails
  - Total: bold, accent
  - Actions: "Detail" (link), "Beli Lagi" (re-add to cart)
```

### 4.8 Auth (`/login`, `/register`)
```
[Split Layout]            ── Left: brand illustration + tagline (desktop)
                           Right: form card (organic, glass variant)
[Form]                    ── Floating labels, bold submit
  - Social login buttons: outline variant, icon + text
  - Link to other auth page: bold, accent
```

---

## 5. Motion System

### Entrance Animations (Staggered)
```css
.animate-enter { animation: enter 0.6s ease-out both; }
@keyframes enter { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: none; } }
.stagger-1 { animation-delay: 60ms; } ... .stagger-12 { animation-delay: 720ms; }
```

### Micro-Interactions
| Trigger | Animation | Duration |
|---------|-----------|----------|
| Button hover | `translateY(-2px) + glow expand` | 150ms |
| Button press | `scale(0.97)` | 80ms |
| Card hover | `translateY(-4px) + shadow expand` | 200ms |
| Input focus | `border expand + label float` | 150ms |
| Badge hover | `scale(1.05) + rotate(-2deg)` | 150ms |
| Blob morph | `border-radius morph + position drift` | 8s infinite |
| Page transition | View Transitions API (cross-fade + scale) | 300ms |

### Reduced Motion
`@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`

---

## 6. Accessibility (Non-Negotiable)

- **Contrast:** All text ≥ 4.5:1 (AA), large text ≥ 3:1. Tested with tools.
- **Focus Visible:** 3px solid accent + 2px offset, organic shape (not square)
- **Skip Links:** "Skip to main content" (visible on focus)
- **ARIA:** All interactive components labeled, live regions for cart updates
- **Color Independence:** No info conveyed by color alone (icons + text)
- **Motion:** Respects `prefers-reduced-motion`

---

## 7. Implementation Order

| Phase | Files | Description |
|-------|-------|-------------|
| 1 | `app/globals.css` | Design tokens, utilities, animations |
| 2 | `components/ui.tsx` | All core components (Button, Input, Card, Badge, etc.) |
| 3 | `components/poster-card.tsx` | New organic PosterCard |
| 4 | `components/product-filters.tsx` | New filter bar |
| 5 | `components/variant-picker.tsx` | Visual card picker |
| 6 | `components/cart-provider.tsx` + `cart-badge.tsx` | Update for new UI |
| 7 | `components/checkout-form.tsx` | Stepped form |
| 8 | `components/site-header.tsx` + `site-footer.tsx` | New header/footer |
| 9 | `app/page.tsx` | Home redesign |
| 10 | `app/products/page.tsx` | Catalog redesign |
| 11 | `app/products/[slug]/page.tsx` | Detail redesign |
| 12 | `app/cart/page.tsx` | Cart redesign |
| 13 | `app/checkout/page.tsx` | Checkout redesign |
| 14 | `app/custom-order/page.tsx` | Custom order redesign |
| 15 | `app/account/orders/page.tsx` | Account orders |
| 16 | `app/login/page.tsx` + `app/register/page.tsx` | Auth pages |
| 17 | `app/admin/*` | Admin panel (optional, lower priority) |

---

## 8. Verification Checklist

- [ ] `npm run dev` — no console errors, all pages render
- [ ] `npm run build` — typecheck passes, production build succeeds
- [ ] `npm test` — all Vitest tests pass (logic unchanged, only UI)
- [ ] Visual regression: compare key pages before/after
- [ ] A11y audit: axe-core, keyboard nav, screen reader
- [ ] Performance: LCP < 2.5s, CLS < 0.1, TBT < 200ms
- [ ] Mobile: 375px, 414px — no horizontal scroll, touch targets ≥ 44px
- [ ] Dark mode: not required but tokens support future addition

---

## 9. Out of Scope (Explicit)

- Admin panel redesign (can follow later)
- Image optimization (already SVG)
- Backend/API changes (none needed)
- Database schema changes
- New dependencies beyond: `plus-jakarta-sans` (font), maybe `clsx` (already have `cn`)

---

**Approval Gate:** Review this spec. If approved, I'll invoke `writing-plans` to create the implementation plan.