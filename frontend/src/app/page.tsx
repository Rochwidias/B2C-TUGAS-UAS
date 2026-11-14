import { TemplateCatalog } from "@/components/shop/TemplateCatalog";
import { Header } from "@/components/shop/Header";
import { Footer } from "@/components/shop/Footer";

const STEPS = [
  { n: 1, title: "Pilih Template", desc: "Pilih fondasi desain website yang paling dekat dengan kategori bisnis Anda.", tone: "text-indigo-400 bg-indigo-500/20" },
  { n: 2, title: "Brief & Generate AI", desc: "Isi nama brand, slogan, dan warna aksen. AI menyusun konten draft dalam hitungan detik.", tone: "text-purple-400 bg-purple-500/20" },
  { n: 3, title: "Checkout Paket", desc: "Pilih paket Basic, Pro, atau Premium lalu kirim draft beserta kontak Anda.", tone: "text-pink-400 bg-pink-500/20" },
  { n: 4, title: "Human Polish & Live", desc: "Developer kami merapikan kode, deploy, lalu menyerahkan URL live dan source code.", tone: "text-emerald-400 bg-emerald-500/20" },
];

export default function Home() {
  return (
    <>
    <Header />
    <div className="bg-slate-950 text-slate-100 flex-1">
      <section className="relative overflow-hidden pt-14 pb-16 lg:pt-20 lg:pb-24">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-[550px] h-[350px] bg-gradient-to-tr from-indigo-600/30 via-violet-600/20 to-pink-500/20 blur-[120px] rounded-full pointer-events-none"
          aria-hidden="true"
        />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-6">
            <span aria-hidden="true">&#10022;</span>
            Kombinasi otomatisasi AI &amp; sentuhan human developer
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Pilih Template.{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              AI Modifikasi
            </span>
            . Kami yang Eksekusi.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Tak perlu pusing coding atau desain dari nol. Pilih template, ketik instruksi bisnis Anda,
            saksikan AI menyusun kontennya secara instan, lalu tim kami menyempurnakannya sampai live online.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="#katalog" className="px-6 py-3.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
              Jelajahi Template
            </a>
            <a href="#cara-kerja" className="px-6 py-3.5 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
              Lihat Alur Kerja
            </a>
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="py-16 bg-slate-900/50 border-y border-slate-800/80 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Alur Pengerjaan Kami</h2>
            <p className="mt-2 text-slate-400">Transparan, cepat, dan berstandar profesional.</p>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {STEPS.map((step) => (
              <li key={step.n} className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <span className={`w-10 h-10 rounded-xl ${step.tone} flex items-center justify-center font-bold text-lg mb-4`} aria-hidden="true">
                  {step.n}
                </span>
                <h3 className="font-bold text-lg text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <TemplateCatalog />

      <section className="py-16 border-t border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Paket Eksekusi</h2>
            <p className="mt-2 text-slate-400">Harga tetap, tanpa biaya tersembunyi. Pembayaran mock untuk keperluan demo.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { name: "Basic", price: "Rp 150.000", desc: "Template + draft AI, 1x revisi minor, deploy standar.", tone: "border-slate-700" },
              { name: "Pro", price: "Rp 250.000", desc: "Basic + penulisan ulang konten + integrasi tombol WhatsApp.", tone: "border-indigo-500/50", badge: "Paling dipilih" },
              { name: "Premium", price: "Rp 350.000", desc: "Pro + kustom domain, optimasi kecepatan, prioritas antrean.", tone: "border-slate-700" },
            ].map((p) => (
              <div key={p.name} className={`rounded-2xl bg-slate-950 border ${p.tone} p-6 relative`}>
                {p.badge && (
                  <span className="absolute -top-3 right-5 text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-600 text-white">{p.badge}</span>
                )}
                <h3 className="font-bold text-lg text-white">{p.name}</h3>
                <p className="mt-1 text-2xl font-extrabold text-emerald-400 font-mono">{p.price}</p>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
    <Footer />
    </>
  );
}


