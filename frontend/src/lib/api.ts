// Base URL backend Express. Default string kosong = path relatif, yang
// diteruskan lewat rewrite Next.js (`/api/*` -> BACKEND_ORIGIN) di dev maupun
// produksi. Dengan begitu produksi berjalan satu origin (Vercel) tanpa CORS,
// sedangkan NEXT_PUBLIC_API_URL tetap bisa dipakai sebagai override absolut.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

// Varian absolut untuk fetch di server (SSR / generateMetadata / sitemap):
// path relatif tidak berlaku di luar browser. Satu sumber angka untuk
// NEXT_PUBLIC_API_URL -> BACKEND_ORIGIN -> localhost, dipakai sitemap.ts dan
// app/customizer/[templateId]/page.tsx (docs/REDESIGN.md §12).
export const API_BASE_SERVER =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.BACKEND_ORIGIN ?? 'http://localhost:4000';