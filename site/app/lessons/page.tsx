import type { Metadata } from 'next';
import Link from 'next/link';
import Em from '@/components/Em';
import { lessons } from '@/lib/content';

export const metadata: Metadata = { title: 'Lessons' };

// One line per lesson: what got built (from the course index table).
const BUILT: Record<number, string> = {
  1: 'seek(t), seeded RNG', 2: 'CLAUDE.md and the determinism hook', 3: 'Reference analysis tools, SafariOS v1',
  4: 'Florios morph loop, state checks', 5: 'A hardened render.mjs', 6: 'Exact springs and ODE tests',
  7: 'Audio health checks, a phone-proof mix', 8: 'The /motion-film skill',
};

export default function Lessons() {
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="kicker">The course</p>
        <h1>Eight <Em>lessons</Em>.</h1>
        <p className="lede">
          I learned from one X article and checked every claim against primary sources, running code where I could.
          Each lesson ends with what got built here, and a quiz and flashcards.
        </p>
      </header>
      <ol className="lesson-list read" style={{ maxWidth: 820 }}>
        {lessons().map((l) => (
          <li key={l.slug}>
            <Link className="lesson-link" href={`/lessons/${l.slug}/`}>
              <span className="n">{l.n}</span>
              <span className="t">{l.title}</span>
              <span className="d">Built: {BUILT[l.n]}</span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="read" style={{ marginTop: 40 }}>
        The recurring lesson: <strong>a check only proves what it measures.</strong> Several bugs passed every automated check
        until a person looked, or until a new check was written. Every source is listed in the <Link href="/references/">references</Link>.
      </p>
    </div>
  );
}
