"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ items }: { items: { href: string; label: string; count?: number }[] }) {
  const pathname = usePathname();
  // The most specific matching item is current, so /evaluator/pending doesn't also light up /evaluator.
  const matches = items.filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  const currentHref = matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className="flex flex-wrap items-center gap-1">
      {items.map((item) => {
        const current = item.href === currentHref;
        return (
          <Link key={item.href} href={item.href} className="nav-item" aria-current={current ? "page" : undefined}>
            {item.label}
            {item.count ? <span className="ml-1.5 opacity-70">{item.count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
