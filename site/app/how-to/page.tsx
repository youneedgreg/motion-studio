import type { Metadata } from 'next';
import Link from 'next/link';
import Em from '@/components/Em';
import { REPO } from '@/lib/content';

export const metadata: Metadata = { title: 'How-to' };

const Cmd = ({ children }: { children: string }) => <pre className="cmd"><code>{children}</code></pre>;

const SPEC_ROWS = [
  ['0.00', 'role', '900 × 200', '100', '#0f172a', 'Click "Switch role"'],
  ['1.50', 'kpi', '880 × 600', '48', '#0f172a', 'Click the role pill'],
  ['3.00', 'packhouse', '960 × 260', '32', '#10b981', 'Click the KPI card'],
  ['…', '', '', '', '', ''],
  ['12.00', '= row 1', 'same', 'same', 'same', '(not rendered)'],
];

export default function HowTo() {
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="kicker">Five steps</p>
        <h1>Make your first <Em>film</Em>.</h1>
        <nav className="toc" style={{ marginTop: 28 }} aria-label="Steps">
          <a className="chip" href="#install">1 · Install</a>
          <a className="chip" href="#render">2 · Render a film</a>
          <a className="chip" href="#skill">3 · Use /motion-film</a>
          <a className="chip" href="#spec">4 · Write a spec</a>
          <a className="chip" href="#unattended">5 · Run unattended</a>
        </nav>
      </header>

      <div className="read">
        <section id="install" className="check">
          <p className="kicker">Step 1</p>
          <h2>Install.</h2>
          <p>You need macOS or Linux, Node 22 or later, ffmpeg with libx264 on your PATH, Python 3.14 and git. Playwright installs its own Chromium.</p>
          <Cmd>{`git clone ${REPO}.git
cd motion-studio
npm ci
npx playwright install chromium
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt`}</Cmd>
          <p className="muted small">Python packages go into <code>./.venv</code> and are always run as <code>.venv/bin/python</code>, so it works even when the venv isn’t activated. Homebrew Python refuses a global <code>pip install</code>.</p>
        </section>

        <section id="render" className="check">
          <p className="kicker">Step 2</p>
          <h2>Render your first film.</h2>
          <p>Florios is a 12 s morph loop. Build its score, render it, then run every check on it:</p>
          <Cmd>{`.venv/bin/python films/florios-morph/score.py
node render.mjs films/florios-morph
.venv/bin/python tools/check.py films/florios-morph`}</Cmd>
          <p>You get <code>out/florios-morph.mp4</code>, a report at <code>out/florios-morph-check.txt</code> and a contact sheet. The score isn’t committed, so run a film’s <code>score.py</code> before its first render. <code>check.py</code> re-renders the film itself.</p>
          <p>Other formats, a live preview and the spring tests:</p>
          <Cmd>{`node render.mjs films/safarios-v2 --format 9x16
node render.mjs films/florios-morph --serve
node tools/test_motion.mjs`}</Cmd>
          <p className="muted small"><code>--serve</code> prints a local address. The preview plays in real time, so it isn’t frame-exact; the render is. What each check proves is on the <Link href="/tests/">Tests</Link> page.</p>
        </section>

        <section id="skill" className="check">
          <p className="kicker">Step 3</p>
          <h2>Use /motion-film.</h2>
          <p>Open the repo in Claude Code and describe the film:</p>
          <Cmd>{`/motion-film a 15 s launch reel for <your product>, 9:16, for an X feed`}</Cmd>
          <ol>
            <li><strong>Brief.</strong> It asks for everything missing in one round: goal, audience, brand source, fictional data, references.</li>
            <li><strong>Plan.</strong> It writes a shot list and waits for your OK.</li>
            <li><strong>Build.</strong> The score (<code>score.py</code>) and the film (<code>index.html</code>, <code>timeline.json</code>).</li>
            <li><strong>Verify.</strong> <code>check.py</code> must pass, and it looks at the stills.</li>
            <li><strong>Critique.</strong> A fresh reviewer subagent scores it, for at most 3 rounds, until every score is 8 or more.</li>
            <li><strong>Deliver,</strong> with a list of what’s still weak.</li>
          </ol>
          <p className="muted small">The skill lives in <a href={`${REPO}/tree/main/.claude/skills/motion-film`}>.claude/skills/motion-film</a>. Its rule that matters most: never edit a check to make it pass.</p>
        </section>

        <section id="spec" className="check">
          <p className="kicker">Step 4</p>
          <h2>Write a spec.</h2>
          <p>For a morph or a UI loop, describe the film as states with numbers, not adjectives. “Grows into a card” can mean anything; “880 × 600, radius 48, at 1.5 s” can’t, and <code>check.py</code> measures it to within ±2 px. Copy the template from <a href={`${REPO}/blob/main/.claude/skills/motion-film/spec.md`}>spec.md</a>. Florios starts like this:</p>
          <div className="table-wrap">
            <table className="data nowrap">
              <thead><tr><th>t (s)</th><th>State</th><th>w × h</th><th>Radius</th><th>Fill</th><th>Cursor action</th></tr></thead>
              <tbody>{SPEC_ROWS.map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <ul>
            <li><strong>The last row is the first state, at t = D.</strong> It is never rendered: frames run 0 … N−1, so the loop has no duplicate frame. Value and velocity must match at the seam.</li>
            <li>Put states on bar lines, and space them far enough apart for the spring to settle (DEFAULT settles in 0.27 s).</li>
            <li>Every cursor action is a cue with a sound, and the container responds on the same frame.</li>
            <li>Radius is at most half the shorter side. Fills are interpolated in OKLab.</li>
          </ul>
        </section>

        <section id="unattended" className="check">
          <p className="kicker">Step 5</p>
          <h2>Run unattended.</h2>
          <p>Claude can’t wait on a clock, so “carry on if I don’t answer in 10 minutes” doesn’t work. Put this line at the top of the film’s brief instead:</p>
          <Cmd>{`Run mode: unattended`}</Cmd>
          <p>Claude then runs the whole pipeline (plan, build, verify, critique, deliver) without stopping for an OK, and follows two rules:</p>
          <div className="check-grid">
            <div className="pane pane-yes"><h4>films/&lt;film&gt;/decisions.md</h4><p>Ambiguous choices: it makes the choice and writes it down, with when, what it chose, the alternative it rejected and why, and what undoing it would cost.</p></div>
            <div className="pane pane-no"><h4>films/&lt;film&gt;/BLOCKED.md</h4><p>Run-stoppers it must not guess at: an unclear licence, a need for real customer data, or a check that fails three times. It stops that line of work.</p></div>
          </div>
          <p className="muted small">The brief template, with the full unattended rules, is <a href={`${REPO}/blob/main/.claude/skills/motion-film/brief.md`}>brief.md</a>. Read both files when the run ends.</p>
        </section>
      </div>
    </div>
  );
}
