import Link from 'next/link';
import Em from '@/components/Em';
import Video from '@/components/Video';
import { FILM_INFO } from '@/data/films';
import { films, lessons, REPO, story } from '@/lib/content';

export default function Home() {
  const all = films();
  const v2 = all.find((f) => f.name === 'safarios-v2')!.outputs[0];
  const ls = lessons();
  const prs = story().filter((m) => m.pr).length;
  return (
    <>
      <div className="wrap">
        <section className="hero">
          <div>
            <h1>Motion graphics, <Em>made as programs</Em>.</h1>
            <p className="lede">
              Claude motion videos were everywhere on my X feed, so I learned to make them properly. I fact-checked the
              article I learned from and built this studio over eight lessons.
            </p>
            <div className="actions">
              <Link className="btn btn-primary" href="/lessons/">Start the lessons</Link>
              <Link className="btn" href="/films/">See the films</Link>
              <a className="btn" href={REPO}>Repository</a>
            </div>
          </div>
          <div>
            <Video src={v2.video!} poster={v2.poster} width={v2.width} height={v2.height} label="Safari OS v2 film, 32 seconds, with sound" />
            <p className="caption">Safari OS v2, 32 s, sound on. One honeymoon booking goes from a website request to fully paid.</p>
          </div>
        </section>
      </div>

      <div className="wrap">
        <section>
          <div className="section-head"><h2>How it <Em>works</Em>.</h2></div>
          <div className="grid-3">
            <div className="card">
              <h3>A frame is a function.</h3>
              <p className="muted">A film is a web page with one function, <code>seek(t)</code>. Playwright’s Chromium paints every frame, and ffmpeg encodes them. Same <code>t</code>, same pixels.</p>
            </div>
            <div className="card">
              <h3>Sound is written too.</h3>
              <p className="muted">Scores are synthesised in Python on the film’s own beat grid, mastered to −14 LUFS, and every cue is checked against the picture.</p>
            </div>
            <div className="card">
              <h3>Numbers, then eyes.</h3>
              <p className="muted">Claude can’t watch or hear a film. <code>check.py</code> measures what it can, and the <Link href="/tests/">Tests</Link> page says what each check leaves out.</p>
            </div>
          </div>
        </section>

        <section>
          <div className="section-head">
            <h2>The <Em>films</Em>.</h2>
            <Link href="/films/" className="small">Every film, its checks and its contact sheet →</Link>
          </div>
          <div className="grid-4">
            {[...all].sort((a, b) => FILM_INFO[a.name].order - FILM_INFO[b.name].order).map((f) => {
              const o = f.outputs[0];
              const info = FILM_INFO[f.name];
              return (
                <Link key={f.name} href={`/films/${f.name}/`} className="film-card">
                  <div className="thumb">{o.poster && <img src={o.poster} alt="" loading="lazy" />}</div>
                  <h3>{info.title} <Em>{info.em}</Em></h3>
                  <p>{f.duration} s · {f.outputs.map((x) => x.format).join(', ')}{f.loop ? ' · loops' : ''}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="grid-2">
            <Link href="/lessons/" className="card" style={{ textDecoration: 'none' }}>
              <p className="kicker">{ls.length} lessons</p>
              <h3>From <code>seek(t)</code> to a skill that ships films, with every claim fact-checked.</h3>
            </Link>
            <Link href="/story/" className="card" style={{ textDecoration: 'none' }}>
              <p className="kicker">{prs} pull requests</p>
              <h3>The studio’s history, one merged PR at a time, straight from git.</h3>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
