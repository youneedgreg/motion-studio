import { readFileSync, existsSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const file = input.tool_input?.file_path;
if (!file || !/\.(html|js|mjs|ts)$/.test(file) || !existsSync(file)) process.exit(0);

const BANNED = [
  [/Math\.random\s*\(/, 'Math.random() — use the seeded rng instead'],
  [/setTimeout\s*\(|setInterval\s*\(/, 'timers — derive values from t'],
  [/requestAnimationFrame\s*\(/, 'requestAnimationFrame — allowed only in the preview loop'],
  [/Date\.now\s*\(|performance\.now\s*\(/, 'wall-clock time — derive values from t'],
  [/transition\s*:/, 'CSS transition — compute the value in seek(t)'],
];

const problems = [];
readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
  if (line.includes('preview-only')) return;
  for (const [re, why] of BANNED) if (re.test(line)) problems.push(`${file}:${i + 1}  ${why}`);
});

if (problems.length) {
  console.error('Determinism rule violations:\n' + problems.join('\n'));
  process.exit(2);
}
