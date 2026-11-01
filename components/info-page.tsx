import Link from "next/link";

type Section = {
  heading: string;
  paragraphs: string[];
};

type InfoPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Section[];
  footnote?: string;
};

export function InfoPage({ eyebrow, title, intro, sections, footnote }: InfoPageProps) {
  return (
    <div className="container-page py-14 sm:py-20">
      <div className="max-w-3xl animate-slide-up">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 font-display text-display-md">{title}</h1>
        <p className="mt-4 text-body-lg leading-relaxed text-ink-muted">{intro}</p>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {sections.map((section, index) => (
          <section
            key={section.heading}
            className="rounded-2xl border border-line bg-surface p-6 shadow-card animate-enter"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <h2 className="font-display text-heading-md">{section.heading}</h2>
            <div className="mt-3 space-y-3 text-body leading-relaxed text-ink-muted">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {footnote && (
        <p className="mt-8 max-w-3xl text-caption leading-relaxed text-ink-soft">{footnote}</p>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/products"
          className="rounded-full bg-gradient-to-r from-accent to-cyan px-6 py-2.5 font-display text-body-sm font-semibold text-bg"
        >
          Jelajahi katalog
        </Link>
        <Link
          href="/contact"
          className="rounded-full border-2 border-accent px-6 py-2.5 font-display text-body-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
        >
          Hubungi tim
        </Link>
      </div>
    </div>
  );
}
