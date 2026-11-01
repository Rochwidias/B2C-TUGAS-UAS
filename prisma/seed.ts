import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SIZES = [
  { id: "A4", multiplier: 1 },
  { id: "A3", multiplier: 1.6 },
  { id: "A2", multiplier: 2.4 },
];

const FRAMES = [
  { id: "none", extra: 0 },
  { id: "black", extra: 45000 },
  { id: "white", extra: 45000 },
];

const posters = [
  {
    slug: "cyberpunk-sunset",
    title: "Cyberpunk Sunset",
    category: "cyberpunk",
    basePrice: 135000,
    featured: true,
    description:
      "Cakrawala kota neon yang tenggelam dalam gradasi jingga. Kontras tinggi, atmosfer sinematik, cocok untuk ruang kerja atau kamar dengan pencahayaan redup.",
    aiPrompt:
      "cyberpunk skyline at golden hour, volumetric haze, neon signage reflecting on wet asphalt, ultra wide, cinematic color grading, 4k",
    humanNote:
      "AI menghasilkan langit terlalu ramai. Manusia memangkas 60% detail neon di area tengah, menaikkan kontras lokal, dan menambahkan satu titik fokus lampu agar mata punya tempat berhenti.",
  },
  {
    slug: "neon-rain-district",
    title: "Neon Rain District",
    category: "cyberpunk",
    basePrice: 129000,
    featured: false,
    description:
      "Gang sempit pasca hujan dengan pantulan papan reklame. Palet cyan dan teal yang dingin, dengan tekstur aspal basah yang tajam.",
    aiPrompt:
      "rainy alley in a dense asian megacity, vertical neon signs, puddle reflections, teal and cyan palette, shallow depth of field",
    humanNote:
      "Perspektif dari AI sedikit miring. Manusia meluruskan garis vertikal bangunan, memperbaiki refleksi yang patah di genangan, dan menurunkan saturasi hijau agar kulit tidak terlihat sakit.",
  },
  {
    slug: "quiet-geometry",
    title: "Quiet Geometry",
    category: "minimalis",
    basePrice: 95000,
    featured: true,
    description:
      "Bentuk-bentuk dasar dengan palet pasir. Ruang negatif yang lega untuk ruang tamu bergaya skandinavia atau kamar tidur.",
    aiPrompt:
      "minimalist bauhaus composition, soft sand and clay tones, single circle and two rectangles, generous negative space, flat lighting",
    humanNote:
      "Detail tepi dari AI berbulu saat dicetak besar. Manusia menajamkan seluruh tepi vektor, menyamakan ketebalan garis, dan menggeser komposisi 3% ke kanan agar terasa seimbang.",
  },
  {
    slug: "ruang-sunyi",
    title: "Ruang Sunyi",
    category: "minimalis",
    basePrice: 99000,
    featured: false,
    description:
      "Dua bentuk tenang di atas kertas gading. Pilihan aman untuk hadiah dan ruang yang butuh ketenangan visual.",
    aiPrompt:
      "quiet minimal abstract, warm ivory background, two overlapping muted shapes, archival print aesthetic",
    humanNote:
      "Warna dari AI terlalu kuning saat dicetak. Manusia menurunkan suhu warna 200K, menambahkan margin putih 2 cm, dan mengunci rasio agar tidak terpotong di bingkai A3.",
  },
  {
    slug: "analog-sunset",
    title: "Analog Sunset",
    category: "retro",
    basePrice: 119000,
    featured: true,
    description:
      "Matahari besar bergaya poster film 70-an dengan grain halus. Hangat, sedikit pudar, sengaja tidak sempurna.",
    aiPrompt:
      "1970s travel poster, giant sun over flat horizon, halftone grain, warm burnt orange and cream, screen print texture",
    humanNote:
      "AI menghasilkan grain digital yang terlalu rapi. Manusia menggantinya dengan tekstur halftone manual, menambahkan misregistration tipis pada dua warna, dan menahan saturasi agar tetap terasa analog.",
  },
  {
    slug: "toko-kaset-1987",
    title: "Toko Kaset 1987",
    category: "retro",
    basePrice: 125000,
    featured: false,
    description:
      "Rak kaset padat dengan label tangan. Nostalgia tanpa terlalu manis, cocok untuk ruang musik.",
    aiPrompt:
      "1980s cassette store interior, hand written labels, warm tungsten light, film grain, kodak portra 400",
    humanNote:
      "Tulisan pada label kaset dari AI berupa huruf acak. Manusia menulis ulang 14 label dengan nama artis fiktif, dan menambahkan satu rak yang sedikit blur untuk memberi kedalaman.",
  },
  {
    slug: "kabut-dieng",
    title: "Kabut Dieng",
    category: "alam",
    basePrice: 145000,
    featured: true,
    description:
      "Lereng perbukitan bertumpuk dalam kabut pagi. Palet hijau kelabu yang lembut, memberi kesan luas pada ruangan sempit.",
    aiPrompt:
      "layered volcanic hills in morning mist, central java highlands, muted sage green, aerial view, soft diffused light",
    humanNote:
      "AI menambahkan pepohonan yang tidak konsisten skalanya. Manusia memperbaiki tiga lapisan perbukitan, menghapus pohon di lapisan terjauh, dan menyeimbangkan kabut agar horizon tetap terbaca.",
  },
  {
    slug: "garis-pantai",
    title: "Garis Pantai",
    category: "alam",
    basePrice: 139000,
    featured: false,
    description:
      "Garis ombak berulang dengan langit biru pucat. Ritme tenang untuk kamar mandi atau area basah.",
    aiPrompt:
      "overhead aerial shoreline, repeating wave lines, pale blue and white sand, fine art photography, high key",
    humanNote:
      "Ombak dari AI terlalu simetris sehingga terlihat palsu. Manusia memecah pola di dua titik, menambahkan buih yang tidak merata, dan menurunkan brightness 5% agar tidak menyilaukan.",
  },
  {
    slug: "bentuk-tanpa-nama",
    title: "Bentuk Tanpa Nama",
    category: "abstrak",
    basePrice: 155000,
    featured: false,
    description:
      "Bentuk organik ungu yang saling tumpang tindih. Statement piece untuk dinding kosong yang besar.",
    aiPrompt:
      "abstract organic shapes, deep violet and plum, soft gradients, risograph texture, large scale composition",
    humanNote:
      "Gradasi dari AI mengalami banding saat dicetak A2. Manusia menambahkan noise halus untuk memecah banding, dan menggambar ulang satu bentuk agar tidak menabrak area bingkai.",
  },
  {
    slug: "kromatik-ii",
    title: "Kromatik II",
    category: "abstrak",
    basePrice: 149000,
    featured: false,
    description:
      "Bagian kedua dari seri eksperimen warna hangat. Tekstur cat tebal dengan tepi kasar yang disengaja.",
    aiPrompt:
      "thick impasto brush strokes, burnt sienna and rust, macro texture, canvas grain, expressive abstraction",
    humanNote:
      "AI menghasilkan tekstur cat yang mengarah ke fotorealistik. Manusia menyederhanakannya menjadi tiga lapis warna, menambahkan goresan pisau palet, dan mempertahankan tepi kasar agar terasa manual.",
  },
  {
    slug: "tinggal-sedikit-lagi",
    title: "Tinggal Sedikit Lagi",
    category: "tipografi",
    basePrice: 89000,
    featured: false,
    description:
      "Poster tipografi kalem untuk pengingat harian. Huruf serif tebal di atas hitam pekat.",
    aiPrompt:
      "bold serif typographic poster, off white text on near black, editorial layout, small caps subtitle",
    humanNote:
      "AI salah mengatur jarak antar huruf pada kata panjang. Manusia mengunci kerning manual, menyamakan baseline, dan menambahkan aksen emas tipis pada satu kata.",
  },
  {
    slug: "jangan-terlalu-serius",
    title: "Jangan Terlalu Serius",
    category: "tipografi",
    basePrice: 92000,
    featured: false,
    description:
      "Poster jenaka dengan tipografi besar. Pilihan hadiah untuk teman kantor yang butuh pengingat.",
    aiPrompt:
      "playful oversized typography poster, cream paper, deep red accent word, swiss layout grid",
    humanNote:
      "Komposisi AI terlalu penuh di bagian bawah. Manusia memberi ruang napas 4 cm, mengubah satu kata menjadi warna aksen, dan merapikan margin kiri-kanan agar presisi.",
  },
];

function priceFor(basePrice: number, sizeMultiplier: number, frameExtra: number) {
  return Math.round((basePrice * sizeMultiplier + frameExtra) / 1000) * 1000;
}

function stockFor(index: number, size: string, frame: string) {
  const seed = index * 7 + size.charCodeAt(1) + frame.length * 3;
  return 4 + (seed % 22);
}

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customOrder.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.poster.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await bcrypt.hash("admin12345", 10);
  const demoHash = await bcrypt.hash("demo12345", 10);

  await prisma.user.create({
    data: {
      name: "Admin PosterAI",
      email: "admin@posterai.id",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      name: "Raka Demo",
      email: "demo@posterai.id",
      passwordHash: demoHash,
      role: "USER",
    },
  });

  for (const [index, poster] of posters.entries()) {
    const imageUrl = `/posters/${poster.slug}.svg`;
    await prisma.poster.create({
      data: {
        slug: poster.slug,
        title: poster.title,
        description: poster.description,
        aiPrompt: poster.aiPrompt,
        humanNote: poster.humanNote,
        category: poster.category,
        imageUrl,
        gallery: JSON.stringify([
          imageUrl,
          `/posters/${poster.slug}-detail-1.svg`,
          `/posters/${poster.slug}-detail-2.svg`,
        ]),
        basePrice: poster.basePrice,
        featured: poster.featured,
        variants: {
          create: SIZES.flatMap((size) =>
            FRAMES.map((frame) => ({
              size: size.id,
              frame: frame.id,
              price: priceFor(poster.basePrice, size.multiplier, frame.extra),
              stock: stockFor(index, size.id, frame.id),
            })),
          ),
        },
      },
    });
  }

  console.log("Seed selesai: 2 user, 12 poster, 108 varian.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
