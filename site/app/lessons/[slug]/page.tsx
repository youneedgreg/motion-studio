import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Em from '@/components/Em';
import Flashcards from '@/components/Flashcards';
import Prose from '@/components/Prose';
import Quiz from '@/components/Quiz';
import { PRACTICE } from '@/data/quizzes';
import { lessons, renderMarkdown, REPO } from '@/lib/content';

export const dynamicParams = false;
export const generateStaticParams = () => lessons().map((l) => ({ slug: l.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const l = lessons().find((x) => x.slug === slug);
  return { title: l ? `Lesson ${l.n}: ${l.title}` : 'Lesson' };
}

export default async function LessonPage({ params }: Props) {
  const { slug } = await params;
  const all = lessons();
  const i = all.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const l = all[i], prev = all[i - 1], next = all[i + 1];
  const practice = PRACTICE[l.slug];
  return (
    <div className="wrap">
      <header className="page-head read">
        <p className="kicker">Lesson {l.n} of {all.length}</p>
        <h1 style={{ fontSize: 'clamp(40px, 6.4vw, 80px)' }}>{l.title}</h1>
      </header>
      <article>
        <Prose html={renderMarkdown(l.body)} />
        <p className="small muted read" style={{ marginTop: 32 }}>
          Sources for this lesson are in the <Link href="/references/">references</Link>. The lesson’s source file is{' '}
          <a href={`${REPO}/blob/main/docs/course/${l.slug}.md`}>docs/course/{l.slug}.md</a>.
        </p>
      </article>

      {practice && (
        <section className="practice read" aria-label="Practice">
          <h2>Check your <Em>understanding</Em>.</h2>
          <Quiz questions={practice.quiz} />
          <Flashcards cards={practice.cards} />
        </section>
      )}

      <nav className="pager read" aria-label="Lessons">
        {prev ? (
          <Link href={`/lessons/${prev.slug}/`}><span className="dir">← Lesson {prev.n}</span><span className="t">{prev.title}</span></Link>
        ) : (
          <Link href="/lessons/"><span className="dir">← All lessons</span><span className="t">The course</span></Link>
        )}
        {next ? (
          <Link href={`/lessons/${next.slug}/`} className="next"><span className="dir">Lesson {next.n} →</span><span className="t">{next.title}</span></Link>
        ) : (
          <Link href="/references/" className="next"><span className="dir">Finished →</span><span className="t">References</span></Link>
        )}
      </nav>
    </div>
  );
}
