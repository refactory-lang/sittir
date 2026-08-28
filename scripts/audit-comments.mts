import { execFileSync } from 'node:child_process';

const REPO_ROOT = new URL('..', import.meta.url).pathname;
const RULE = 'rules/comment-audit.yml';

interface AstGrepMatch {
  file: string;
  range: { start: { line: number }; end: { line: number } };
}

function runRule(scope: string): AstGrepMatch[] {
  const out = execFileSync('ast-grep', ['scan', '--rule', RULE, '--json', scope], {
    cwd: REPO_ROOT,
    maxBuffer: 1024 * 1024 * 64
  });
  return JSON.parse(out.toString('utf8'));
}

// Every non-JSDoc comment matches individually (no length threshold) — a
// run of N consecutive `//` lines is N separate comment nodes. Merge
// adjacent/overlapping matches into one candidate block per run purely for
// a readable report; no filtering or interpretation of content.
function mergeRuns(matches: AstGrepMatch[]): { start: number; end: number }[] {
  const sorted = [...matches].sort((a, b) => a.range.start.line - b.range.start.line);
  const runs: { start: number; end: number }[] = [];
  for (const m of sorted) {
    const start = m.range.start.line;
    const end = m.range.end.line;
    const last = runs[runs.length - 1];
    if (last && start <= last.end + 1) {
      last.end = Math.max(last.end, end);
    } else {
      runs.push({ start, end });
    }
  }
  return runs;
}

const scope = process.argv[2] ?? 'packages/codegen/src';
const matches = runRule(scope);
const byFile = new Map<string, AstGrepMatch[]>();
for (const m of matches) {
  const list = byFile.get(m.file) ?? [];
  list.push(m);
  byFile.set(m.file, list);
}

let totalRuns = 0;
for (const [file, list] of byFile) {
  const runs = mergeRuns(list);
  totalRuns += runs.length;
  console.log(file);
  for (const run of runs) {
    console.log(`  L${run.start + 1}-L${run.end + 1} (${run.end - run.start + 1} lines)`);
  }
}
console.log(`\n${totalRuns} candidate non-JSDoc comment block(s) across ${byFile.size} file(s) in ${scope}`);
console.log(
  'Flag-only — pass 2 decides: in a function body -> hoist the chunk to a named helper or decompose the function; ' +
    'on a type/interface/class/const/other declaration -> candidate for the matching glossary doc.'
);
