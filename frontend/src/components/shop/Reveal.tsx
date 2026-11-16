'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';

// Reveal saat masuk viewport (MOTION 2: satu gestur, naik 12px). Bukan animasi
// berulang, dan dimatikan penuh oleh prefers-reduced-motion di globals.css.
//
// Efek ini murni visual dan tidak mengubah markup apa pun, jadi atributnya
// dipasang langsung di DOM alih-alih lewat state React: menghindari render
// tambahan per section, dan tidak ada setState di dalam effect.
export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  id,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  id?: string;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Browser tanpa IntersectionObserver (atau saat elemen sudah di layar)
    // langsung ditandai tampil supaya konten tidak pernah tersembunyi.
    if (typeof IntersectionObserver === 'undefined') {
      node.setAttribute('data-shown', 'true');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-shown', 'true');
            observer.disconnect();
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      id={id}
      data-shown="false"
      style={{ ['--reveal-delay' as string]: `${delay}ms` }}
      className={`reveal ${className}`}
    >
      {children}
    </Tag>
  );
}