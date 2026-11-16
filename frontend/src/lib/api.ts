// Base URL backend Express (port 4000 di dev). Semua fetch ke API memakai
// konstanta ini, bukan path relatif '/api/...' yang dulu ditangani route
// handler Next.js di proses yang sama.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';