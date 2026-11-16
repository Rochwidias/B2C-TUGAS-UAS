// Base URL backend Express. Default string kosong = path relatif, yang
// diteruskan lewat rewrite Next.js (`/api/*` -> BACKEND_ORIGIN) di dev maupun
// produksi. Dengan begitu produksi berjalan satu origin (Vercel) tanpa CORS,
// sedangkan NEXT_PUBLIC_API_URL tetap bisa dipakai sebagai override absolut.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';