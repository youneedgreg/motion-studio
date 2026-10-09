import type { Metadata } from 'next';
import Em from '@/components/Em';
import { REPO, story, type Milestone } from '@/lib/content';

export const metadata: Metadata = { title: 'Story' };

// Dates and times as they were committed (the author's own offset), so a milestone reads as it happened.
const day = (iso: string) => new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const time = (iso: string) => iso.slice(11, 16);

export default function Story() {
  const ms = story();
  const days = ms.reduce<Record<string, Milestone[]>>((a, m) => { (a[m.date.slice(0, 10)] ||= []).push(m); return a; }, {});
  const prs = ms.filter((m) => m.pr);
  const lines = prs.reduce((n, m) => n + m.insertions, 0);
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="kicker">From the git history</p>
        <h1>How the studio <Em>got built</Em>.</h1>
        <p className="lede">
          {prs.length} pull requests over {Object.keys(days).length} days. Each one is a milestone, with its date, its commits and what it touched.
          This page is generated from <code>git log</code> by the site’s sync script. Pull requests that only merged <code>main</code> back into a branch, and changed nothing on <code>main</code>, are left out.
        </p>
      </header>
      <ol className="timeline read" style={{ maxWidth: 860 }}>
        {Object.entries(days).map(([d, items]) => (
          <li key={d} className="day">
            <h2 className="day-head">{day(items[0].date)}</h2>
            <ol className="timeline">
              {items.map((m) => (
                <li key={m.pr ?? 'init'} className="ms">
                  <div className="card">
                    <div className="ms-top tnum">
                      {m.pr ? <a href={`${REPO}/pull/${m.pr}`}>PR #{m.pr}</a> : <span>First commit</span>}
                      <span>{time(m.date)}</span>
                      {m.pr && <span>{m.files} files · +{m.insertions.toLocaleString('en')} −{m.deletions.toLocaleString('en')}</span>}
                    </div>
                    <h3>{m.title}</h3>
                    {m.areas.length > 0 && (
                      <div className="chips" style={{ marginTop: 12 }}>
                        {m.areas.slice(0, 5).map((a) => <span key={a.path} className="chip">{a.path}</span>)}
                        {m.areas.length > 5 && <span className="chip">+{m.areas.length - 5} more</span>}
                      </div>
                    )}
                    {m.commits.length > 0 && (m.commits.length <= 3 ? (
                      <ul>{m.commits.map((c, i) => <li key={i}>{c}</li>)}</ul>
                    ) : (
                      <details>
                        <summary>{m.commits.length} commits</summary>
                        <ul>{m.commits.map((c, i) => <li key={i}>{c}</li>)}</ul>
                      </details>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
      <p className="read muted small">{lines.toLocaleString('en')} lines added across all pull requests, counted with <code>git diff --shortstat</code> per merge.</p>
    </div>
  );
}
