import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CheckTable from '@/components/CheckTable';
import Em from '@/components/Em';
import Video from '@/components/Video';
import { FILM_INFO } from '@/data/films';
import { checkReport, films, REPO } from '@/lib/content';

export const dynamicParams = false;
export const generateStaticParams = () => films().map((f) => ({ name: f.name }));
type Props = { params: Promise<{ name: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const info = FILM_INFO[name];
  return { title: info ? `${info.title} ${info.em}` : 'Film' };
}

const mb = (b?: number) => (b ? `${(b / 1e6).toFixed(1)} MB` : '');
const when = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '');

export default async function FilmPage({ params }: Props) {
  const { name } = await params;
  const f = films().find((x) => x.name === name);
  if (!f) notFound();
  const info = FILM_INFO[f.name];
  const vids = f.outputs.filter((o) => o.video);
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="kicker"><Link href="/films/">Films</Link></p>
        <h1>{info.title} <Em>{info.em}</Em></h1>
        <p className="lede" style={{ maxWidth: '52ch' }}>{info.line}</p>
        <div className="facts">
          <span className="chip tnum">{f.duration} s</span>
          <span className="chip tnum">{f.fps} fps</span>
          {f.bpm && <span className="chip tnum">{f.bpm} BPM, {f.beatsPerBar}/4</span>}
          <span className="chip tnum">{f.cues} cues</span>
          {f.loop && <span className="chip">Loops</span>}
          <a className="chip" href={`${REPO}/tree/main/films/${f.name}`}>Source →</a>
        </div>
      </header>

      <section>
        <div className={`formats${vids.length === 3 ? ' three' : ''}`}>
          {vids.map((o) => (
            <figure key={o.name} style={{ margin: 0 }} className={o.height > o.width && vids.length === 1 ? 'vertical-video' : ''}>
              <Video src={o.video!} poster={o.poster} width={o.width} height={o.height} label={`${info.title} ${info.em}, ${o.format}`} />
              <figcaption className="caption tnum">{o.format} · {o.width}×{o.height} · {mb(o.videoBytes)} web version (H.264, CRF 23)</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {f.outputs.map((o) => (
        <section key={o.name}>
          <div className="section-head">
            <h2>{f.outputs.length > 1 ? <>Checks, <Em>{o.format}</Em>.</> : <>Checks.</>}</h2>
            {o.checkedAt && <span className="small muted">tools/check.py, run {when(o.checkedAt)}</span>}
          </div>
          {o.check ? <CheckTable rows={checkReport(o.check)} /> : <p className="muted">No check report yet.</p>}
          <div className="grid-2" style={{ marginTop: 32, alignItems: 'start' }}>
            {o.contact && (
              <figure style={{ margin: 0 }}>
                <p className="figure-title">Contact sheet: one frame per beat</p>
                <div className="contact-box sheet"><a href={o.contact}><img src={o.contact} alt={`Contact sheet for ${o.name}, one frame per beat`} loading="lazy" /></a></div>
              </figure>
            )}
            <div style={{ display: 'grid', gap: 24 }}>
              {o.spectrum && (
                <figure style={{ margin: 0 }}>
                  <p className="figure-title">Spectrum (log frequency)</p>
                  <div className="sheet"><a href={o.spectrum}><img src={o.spectrum} alt={`Spectrogram of ${o.name}'s audio`} loading="lazy" /></a></div>
                </figure>
              )}
              {o.wave && (
                <figure style={{ margin: 0 }}>
                  <p className="figure-title">Waveform</p>
                  <div className="sheet"><img src={o.wave} alt={`Waveform of ${o.name}'s audio`} loading="lazy" /></div>
                </figure>
              )}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
