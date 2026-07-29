import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { relative } from 'node:path';

const REPO_ROOT = new URL('..', import.meta.url).pathname;
const PAIR_RULE = 'rules/override-pair.yml';
const COMMENT_RULE = 'rules/override-pair-comment.yml';

const GLOSSARY_BY_LANG: Record<string, string> = {
  'packages/rust/overrides.ts': 'docs/rust-overrides-glossary.md',
  'packages/typescript/overrides.ts': 'docs/typescript-overrides-glossary.md',
  'packages/python/overrides.ts': 'docs/python-overrides-glossary.md'
};

interface AstGrepMatch {
  file: string;
  text: string;
  range: { start: { line: number; column: number }; end: { line: number } };
}

// A comment that TRAILS code on the same line (e.g. `0: field('real'), //
// integer | float`) sits, structurally, immediately before the NEXT pair —
// so it satisfies the line-adjacency check just like a genuine standalone
// block comment above that pair. Splicing it out would delete the PREVIOUS
// pair's code sharing its line. Only treat a comment as a real preceding
// block comment when everything before it on its own start line is
// whitespace.
function isStandaloneComment(lines: string[], comment: AstGrepMatch): boolean {
  const before = lines[comment.range.start.line].slice(0, comment.range.start.column);
  return /^\s*$/.test(before);
}

function runRule(ruleFile: string, scope: string): AstGrepMatch[] {
  const out = execFileSync('ast-grep', ['scan', '--rule', ruleFile, '--json', scope], {
    cwd: REPO_ROOT,
    maxBuffer: 1024 * 1024 * 64
  });
  return JSON.parse(out.toString('utf8'));
}

function groupByFile(matches: AstGrepMatch[]): Map<string, AstGrepMatch[]> {
  const byFile = new Map<string, AstGrepMatch[]>();
  for (const m of matches) {
    const list = byFile.get(m.file) ?? [];
    list.push(m);
    byFile.set(m.file, list);
  }
  for (const list of byFile.values()) list.sort((a, b) => a.range.start.line - b.range.start.line);
  return byFile;
}

function extractKeyName(pairText: string): string {
  const trimmed = pairText.trimStart();
  const quote = trimmed[0];
  if (quote === "'" || quote === '"') {
    const end = trimmed.indexOf(quote, 1);
    return trimmed.slice(1, end);
  }
  const m = /^([A-Za-z_$][A-Za-z0-9_$]*|\d+)/.exec(trimmed);
  return m ? m[1] : '<unknown>';
}

// The declaration-side match is only the LAST comment immediately before the
// pair. `//` runs are N separate sibling nodes (unlike a `/** */` block,
// already one atomic node) — walk backward over raw lines while they're
// still `//` comments with no blank-line break, to recover the run's true
// start. Pure line-prefix scanning, no interpretation of content.
function fullCommentRange(
  lines: string[],
  lastCommentStartLine: number,
  lastCommentEndLine: number
): { start: number; end: number } {
  if (lines[lastCommentStartLine].trim().startsWith('/*'))
    return { start: lastCommentStartLine, end: lastCommentEndLine };
  let start = lastCommentStartLine;
  while (start > 0 && lines[start - 1].trim().startsWith('//')) start--;
  return { start, end: lastCommentEndLine };
}

interface Entry {
  file: string;
  line: number;
  name: string;
  commentText: string;
  pairStartLine: number;
  commentStartLine: number;
  commentEndLine: number;
}

function buildEntries(scope: string): Entry[] {
  const pairs = groupByFile(runRule(PAIR_RULE, scope));
  const comments = groupByFile(runRule(COMMENT_RULE, scope));
  const entries: Entry[] = [];

  const files = new Set([...pairs.keys(), ...comments.keys()]);
  for (const file of files) {
    const pairList = pairs.get(file) ?? [];
    const commentList = comments.get(file) ?? [];
    if (pairList.length !== commentList.length) {
      console.warn(`[skip] ${file}: pair matches (${pairList.length}) != comment matches (${commentList.length})`);
      continue;
    }
    const lines = readFileSync(REPO_ROOT + file, 'utf8').split('\n');
    for (let i = 0; i < pairList.length; i++) {
      const pair = pairList[i];
      const lastComment = commentList[i];
      if (lastComment.range.end.line + 1 !== pair.range.start.line) {
        console.warn(
          `[skip] ${file}: pair ${i} not adjacent (comment ends L${lastComment.range.end.line + 1}, pair starts L${pair.range.start.line + 1})`
        );
        continue;
      }
      if (!isStandaloneComment(lines, lastComment)) {
        console.warn(
          `[skip] ${file}: pair ${i} comment trails code on the same line (L${lastComment.range.start.line + 1}) — not a standalone block comment`
        );
        continue;
      }
      const full = fullCommentRange(lines, lastComment.range.start.line, lastComment.range.end.line);
      entries.push({
        file,
        line: full.start + 1,
        name: extractKeyName(pair.text),
        commentText: lines.slice(full.start, full.end + 1).join('\n'),
        pairStartLine: pair.range.start.line,
        commentStartLine: full.start,
        commentEndLine: full.end
      });
    }
  }
  return entries;
}

function applyEntries(entries: Entry[]): void {
  const byFile = new Map<string, Entry[]>();
  for (const e of entries) {
    const list = byFile.get(e.file) ?? [];
    list.push(e);
    byFile.set(e.file, list);
  }

  for (const [file, list] of byFile) {
    const absPath = REPO_ROOT + file;
    const lines = readFileSync(absPath, 'utf8').split('\n');
    const sorted = [...list].sort((a, b) => b.commentStartLine - a.commentStartLine);
    for (const e of sorted) {
      lines.splice(e.commentStartLine, e.commentEndLine - e.commentStartLine + 1);
    }
    writeFileSync(absPath, lines.join('\n'));

    const glossaryPath = REPO_ROOT + GLOSSARY_BY_LANG[file];
    const sorted2 = [...list].sort((a, b) => a.line - b.line);
    for (const e of sorted2) {
      appendFileSync(
        glossaryPath,
        `\n### \`${e.name}\` (\`${e.file}:${e.line}\`)\n\n\`\`\`text\n${e.commentText}\n\`\`\`\n`
      );
    }
  }
}

const scope =
  process.argv[2] ?? 'packages/rust/overrides.ts packages/typescript/overrides.ts packages/python/overrides.ts';
const apply = process.argv.includes('--apply');
const scopes = scope.split(/\s+/);

const entries = scopes.flatMap((s) => buildEntries(s));
console.log(`Found ${entries.length} mechanically-relocatable override comment blocks`);
for (const e of entries) {
  console.log(`  ${relative(REPO_ROOT, REPO_ROOT + e.file)}:${e.line} -> ${e.name}  (${GLOSSARY_BY_LANG[e.file]})`);
}

if (apply) {
  applyEntries(entries);
  console.log(
    `Applied: removed ${entries.length} comment blocks, appended entries to their per-grammar glossary doc(s).`
  );
} else {
  console.log('\nDry run only — pass --apply to write changes.');
}
