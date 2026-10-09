import type { Metadata } from 'next';
import Link from 'next/link';
import Em from '@/components/Em';
import { FILM_INFO } from '@/data/films';
import { checkReport, films } from '@/lib/content';

export const metadata: Metadata = { title: 'Films' };

export default function Films() {
  const all = [...films()].sort((a, b) => FILM_INFO[a.name].order - FILM_INFO[b.name].order);
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="kicker">{all.length} films</p>
        <h1>The <Em>films</Em>.</h1>
        <p className="lede">Each one with its video, its latest check report, its contact sheet and its spectrum.</p>
      </header>
      <div className="grid-2">
        {all.map((f) => {
          const info = FILM_INFO[f.name];
          const rows = f.outputs.flatMap((o) => (o.check ? checkReport(o.check) : []));
          const gated = rows.filter((r) => r.status);
          const failed = gated.filter((r) => r.status === 'fail').length;
          return (
            <Link key={f.name} href={`/films/${f.name}/`} className="film-card">
              <div className="thumb">{f.outputs[0].poster && <img src={f.outputs[0].poster} alt="" loading="lazy" />}</div>
              <h3>{info.title} <Em>{info.em}</Em></h3>
              <p>{info.line}</p>
              <div className="facts">
                <span className="chip tnum">{f.duration} s · {f.fps} fps</span>
                {f.outputs.map((o) => <span key={o.name} className="chip tnum">{o.width}×{o.height}</span>)}
                <span className={`chip ${failed ? 'chip-bad' : 'chip-ok'}`}>{failed ? `${failed} failing` : `${gated.length}/${gated.length} checks pass`}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
