'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  ['/story/', 'Story'],
  ['/lessons/', 'Lessons'],
  ['/films/', 'Films'],
  ['/tests/', 'Tests'],
  ['/how-to/', 'How-to'],
] as const;

export default function Nav() {
  const path = usePathname() || '/';
  return (
    <nav className="nav" aria-label="Main">
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} aria-current={path.startsWith(href) ? 'page' : undefined}>{label}</Link>
      ))}
      <a href="https://github.com/youneedgreg/motion-studio">GitHub</a>
    </nav>
  );
}
