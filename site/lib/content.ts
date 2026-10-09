// Build-time access to the synced content (site/content, written by scripts/sync.mjs).
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { Marked, type Tokens } from 'marked';

export const REPO = 'https://github.com/youneedgreg/motion-studio';
const CONTENT = path.join(process.cwd(), 'content');
const read = (...p: string[]) => readFileSync(path.join(CONTENT, ...p), 'utf8');

// ---------------------------------------------------------------- markdown
// Course files link to each other (`02-setup.md`), to the index, to REFERENCES.md and to repo files (`../../NOTICE.md`).
function rewriteHref(href: string): string {
  if (/^(https?:|mailto:|#)/.test(href)) return href;
  const [file, hash = ''] = href.split('#');
  const anchor = hash ? `#${hash}` : '';
  if (file === 'README.md') return `/lessons/${anchor}`;
  if (file === 'REFERENCES.md') return `/references/${anchor}`;
  if (/^0\d-[\w-]+\.md$/.test(file)) return `/lessons/${file.replace(/\.md$/, '')}/${anchor}`;
  const repoPath = path.posix.normalize(path.posix.join('docs/course', file));
  return `${REPO}/blob/main/${repoPath}${anchor}`;
}

const md = new Marked({
  gfm: true,
  walkTokens(token) {
    if (token.type === 'link') token.href = rewriteHref(token.href);
  },
  renderer: {
    // tables scroll inside their own box on a phone instead of widening the page
    table(token: Tokens.Table) {
      const cell = (c: Tokens.TableCell, tag: 'th' | 'td') =>
        `<${tag}${c.align ? ` style="text-align:${c.align}"` : ''}>${this.parser.parseInline(c.tokens)}</${tag}>`;
      const head = `<tr>${token.header.map((c) => cell(c, 'th')).join('')}</tr>`;
      const body = token.rows.map((r) => `<tr>${r.map((c) => cell(c, 'td')).join('')}</tr>`).join('');
      return `<div class="table-wrap"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
    },
  },
});

export const renderMarkdown = (src: string) => md.parse(src) as string;

// ---------------------------------------------------------------- lessons
export type Lesson = { slug: string; n: number; title: string; body: string };

export function lessons(): Lesson[] {
  return readdirSync(path.join(CONTENT, 'course'))
    .filter((f) => /^0\d-.*\.md$/.test(f))
    .sort()
    .map((f) => {
      const src = read('course', f);
      const h1 = src.match(/^# (.+)$/m)?.[1] ?? f;
      const m = h1.match(/^Lesson (\d+):\s*(.+)$/);
      return { slug: f.replace(/\.md$/, ''), n: m ? Number(m[1]) : 0, title: m ? m[2] : h1, body: src.replace(/^# .+\n+/, '') };
    });
}

export const courseIndex = () => read('course', 'README.md').replace(/^# .+\n+/, '');
export const references = () => read('course', 'REFERENCES.md').replace(/^# .+\n+/, '');

// ---------------------------------------------------------------- films
export type Output = {
  format: string; width: number; height: number; name: string;
  video?: string; poster?: string; videoBytes?: number;
  check?: string; checkedAt?: string; contact?: string; spectrum?: string; wave?: string;
};
export type Film = { name: string; fps: number; duration: number; bpm: number; beatsPerBar: number; loop: boolean; cues: number; outputs: Output[] };
export const films = (): Film[] => JSON.parse(read('films.json'));

// ---------------------------------------------------------------- check reports
// tools/check.py writes `label         value  STATUS`, labels padded to 14 columns; indented lines continue the row above.
export type CheckRow = { label: string; value: string; status: 'ok' | 'fail' | null; statusText: string; detail: string[] };

// The labels tools/check.py writes. Thirteen-letter ones ("contact sheet", "small speaker") are followed by a single space,
// so the label can't be found by splitting on double spaces alone.
const LABELS = ['sfx placement (internal consistency)', 'sfx ↔ cues', 'determinism', 'file', 'loop seam', 'contact sheet', 'loudness',
  'cue sync', 'text visible', 'text size', 'audio onsets', 'audio images', 'clipping', 'astats', 'small speaker', 'states', 'loop state'];

export function parseCheck(text: string): CheckRow[] {
  const rows: CheckRow[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    if (/^\s{6,}/.test(line) && rows.length) { rows[rows.length - 1].detail.push(line.trim()); continue; }
    const known = LABELS.find((l) => line.startsWith(`${l} `));
    const state = line.match(/^(state \S+)\s+(.*)$/);
    const [label, value] = known ? [known, line.slice(known.length).trim()] : state ? [state[1], state[2]] : [line.trim(), ''];
    const st = value.match(/\s{2}(OK|OFF TARGET|OFF|JUMP|FAIL(?::.*)?)$/);
    rows.push({
      label, value: st ? value.slice(0, st.index).trim() : value,
      status: st ? (st[1] === 'OK' ? 'ok' : 'fail') : null, statusText: st ? st[1] : '', detail: [],
    });
  }
  return rows;
}

export const checkReport = (file: string) => parseCheck(read('checks', file));
export const testMotion = () => read('test_motion.txt');

// ---------------------------------------------------------------- story
export type Milestone = {
  pr: number | null; branch: string | null; date: string; title: string; commits: string[];
  files: number; insertions: number; deletions: number; areas: { path: string; files: number }[];
};
export const story = (): Milestone[] => JSON.parse(read('story.json'));

// ---------------------------------------------------------------- spring tests
// tools/test_motion.mjs prints blocks separated by blank lines: a title, then either a header row and rows aligned with
// spaces, or rows of "name  label value  label value". Each block becomes a table, so nothing depends on a monospace face.
export type TestBlock = { title: string; head: string[]; rows: string[][] };

export function parseTestMotion(text: string): { blocks: TestBlock[]; summary: string; failures: string[] } {
  const lines = text.trimEnd().split('\n');
  const summary = lines[lines.length - 1].trim();
  const failures = lines.filter((l) => /^\s*FAIL\s/.test(l)).map((l) => l.trim());
  const blocks: TestBlock[] = [];
  for (const chunk of text.trimEnd().split(/\n\s*\n/)) {
    const ls = chunk.split('\n').filter((l) => l.trim() && !/^\s*FAIL\s/.test(l));
    if (ls.length < 2) continue;
    const [title, ...rest] = ls;
    const cells = (l: string) => l.trim().split(/\s{2,}/);
    if (/^\S/.test(rest[0])) {   // unindented: a header row, then aligned rows; indented rows are label-value pairs
      blocks.push({ title, head: cells(rest[0]), rows: rest.slice(1).map(cells) });
      continue;
    }
    // "name  label value  label value, label value": the labels become the header
    const split = (l: string) => {
      const [name, ...pairs] = cells(l);
      const kv = pairs.flatMap((p) => p.split(/,\s+/)).map((p) => { const m = p.match(/^(.*\S)\s+(\S+)$/); return m ? [m[1], m[2]] : ['', p]; });
      return { name, kv };
    };
    const parsed = rest.map(split);
    blocks.push({ title, head: ['case', ...parsed[0].kv.map(([k]) => k)], rows: parsed.map((r) => [r.name, ...r.kv.map(([, v]) => v)]) });
  }
  return { blocks, summary, failures };
}
