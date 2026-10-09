import type { Metadata } from 'next';
import Link from 'next/link';
import Em from '@/components/Em';
import { CHECKS } from '@/data/checks';
import { FILM_INFO } from '@/data/films';
import { checkReport, films, parseTestMotion, REPO, testMotion } from '@/lib/content';

export const metadata: Metadata = { title: 'Tests' };

export default function Tests() {
  const outs = films().sort((a, b) => FILM_INFO[a.name].order - FILM_INFO[b.name].order)
    .flatMap((f) => f.outputs.filter((o) => o.check).map((o) => ({ film: f, o, rows: checkReport(o.check!) })));
  const tm = parseTestMotion(testMotion());
  const tmPass = tm.summary === 'all spring tests passed' && !tm.failures.length;
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="kicker">tools/check.py and tools/test_motion.mjs</p>
        <h1>What the tests <Em>prove</Em>.</h1>
        <p className="lede">
          And what they don’t. Each check below shows its latest real output for every film, copied from the reports by the sync script.
          A check only proves what it measures.
        </p>
        <nav className="toc" style={{ marginTop: 28 }} aria-label="Checks">
          {CHECKS.map((c) => <a key={c.id} className="chip" href={`#${c.id}`}>{c.name}</a>)}
          <a className="chip" href="#springs">Spring tests</a>
          <a className="chip" href="#hook">Determinism hook</a>
        </nav>
      </header>

      {CHECKS.map((c) => {
        const hits = outs.flatMap(({ film, o, rows }) => rows.filter((r) => c.labels.includes(r.label)).map((r) => ({ film, o, r })));
        return (
          <section key={c.id} id={c.id} className="check">
            <div className="section-head">
              <h2>{c.name}</h2>
              <span className={`chip ${c.gated ? 'chip-gold' : ''}`}>{c.gated ? 'Pass or fail' : 'Report only'}</span>
            </div>
            <div className="check-grid">
              <div className="pane pane-yes"><h4>Proves</h4><p>{c.proves}</p></div>
              <div className="pane pane-no"><h4>Doesn’t prove</h4><p>{c.not}</p></div>
            </div>
            {hits.length ? (
              <div className="table-wrap">
                <table className="data report">
                  <thead><tr><th>Film</th><th>Latest output</th><th>Status</th></tr></thead>
                  <tbody>
                    {hits.map(({ film, o, r }, i) => (
                      <tr key={i}>
                        <td><Link href={`/films/${film.name}/`}>{FILM_INFO[film.name].title} {FILM_INFO[film.name].em}</Link>{film.outputs.length > 1 ? ` · ${o.format}` : ''}</td>
                        <td>{c.labels.length > 1 && <strong>{r.label}: </strong>}{r.value}</td>
                        <td className="st">{r.status === 'ok' ? <span className="chip chip-ok">OK</span> : r.status === 'fail' ? <span className="chip chip-bad">{r.statusText}</span> : <span className="chip">Report</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="muted">No film’s latest report includes this check (it only runs where it applies).</p>}
          </section>
        );
      })}

      <section id="springs" className="check">
        <div className="section-head">
          <h2>Spring tests</h2>
          <span className={`chip ${tmPass ? 'chip-ok' : 'chip-bad'}`}>{tmPass ? 'All pass' : 'Failing'}</span>
        </div>
        <div className="check-grid">
          <div className="pane pane-yes"><h4>Proves</h4><p>Every closed-form spring in <code>lib/motion.js</code> matches the spring ODE, integrated at dt = 1e-5, to within 1e-3: value, velocity, retargeting with <code>springTrack</code>, and loop seams.</p></div>
          <div className="pane pane-no"><h4>Doesn’t prove</h4><p>That a spring looks right in a film, or that a film uses the right preset. It tests the maths, not the taste.</p></div>
        </div>
        <p className="figure-title">Latest output of <code>node tools/test_motion.mjs</code>: “{tm.summary}”</p>
        {tm.failures.length > 0 && <ul>{tm.failures.map((f, i) => <li key={i}>{f}</li>)}</ul>}
        {tm.blocks.map((b, i) => (
          <div key={i} style={{ marginTop: 22 }}>
            <p className="small muted" style={{ margin: '0 0 8px' }}>{b.title}</p>
            <div className="table-wrap">
              <table className="data">
                <thead><tr>{b.head.map((h, k) => <th key={k}>{h}</th>)}</tr></thead>
                <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k} style={{ whiteSpace: 'nowrap' }}>{c}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      <section id="hook" className="check">
        <div className="section-head"><h2>The determinism hook</h2><span className="chip chip-gold">Blocks the edit</span></div>
        <div className="check-grid">
          <div className="pane pane-yes"><h4>Proves</h4><p>No line Claude writes in render code calls <code>Math.random</code>, a timer, <code>requestAnimationFrame</code>, the wall clock, or a CSS transition. Exit code 2 sends the violation back to Claude. CI runs the same script over every film.</p></div>
          <div className="pane pane-no"><h4>Doesn’t prove</h4><p>Anything a line-by-line pattern can’t see: state carried between frames, or values read back from layout. The <code>// preview-only</code> exemption works on trust. The determinism check above is the backstop.</p></div>
        </div>
        <p className="small muted">Source: <a href={`${REPO}/blob/main/.claude/hooks/check-determinism.mjs`}>.claude/hooks/check-determinism.mjs</a> · CI: <a href={`${REPO}/blob/main/.github/workflows/films.yml`}>.github/workflows/films.yml</a></p>
      </section>
    </div>
  );
}
