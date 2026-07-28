import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { relative } from 'node:path';

const REPO_ROOT = new URL('..', import.meta.url).pathname;
const DECL_RULE = 'rules/function-level-jsdoc.yml';
const COMMENT_RULE = 'rules/function-level-jsdoc-comment.yml';
const SRC_PREFIX = 'packages/codegen/src/';
const GLOSSARY_DIR = 'docs/glossary';

function glossaryPathFor(file: string): string {
  const rel = file.startsWith(SRC_PREFIX) ? file.slice(SRC_PREFIX.length) : file;
  const lastSlash = rel.lastIndexOf('/');
  const dir = lastSlash === -1 ? '.' : rel.slice(0, lastSlash);
  const slug = dir === '.' ? 'root' : dir.replace(/\//g, '-');
  return `${GLOSSARY_DIR}/${slug}.md`;
}

function glossaryHeaderFor(file: string): string {
  const rel = file.startsWith(SRC_PREFIX) ? file.slice(SRC_PREFIX.length) : file;
  const lastSlash = rel.lastIndexOf('/');
  const dir = lastSlash === -1 ? SRC_PREFIX.slice(0, -1) : SRC_PREFIX + rel.slice(0, lastSlash);
  return (
    `# \`${dir}\` — Function Glossary\n\n` +
    `Per-function reference for \`${dir}/\`, mechanically relocated from source\n` +
    `JSDoc by \`scripts/wave5-relocate-jsdoc.mts\` (wave 5 comment-cleanup, pass 1 —\n` +
    `unedited, unverified). Pass 2 reformats/verifies these entries and decides\n` +
    `what merges into docs/compiler-phase-glossary.md's phase narrative.\n\n` +
    `See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).\n\n---\n`
  );
}

interface AstGrepMatch {
  file: string;
  text: string;
  range: { start: { line: number }; end: { line: number } };
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

function extractSymbolName(declText: string): string {
  const modifiers = new Set([
    'export',
    'default',
    'public',
    'private',
    'protected',
    'static',
    'async',
    'override',
    'readonly',
    'function',
    'function*',
    'get',
    'set',
    'interface',
    'class',
    'type',
    'abstract',
    'declare'
  ]);
  const tokens = declText.split(/\s+/);
  for (const tok of tokens) {
    if (modifiers.has(tok)) continue;
    const m = /^([A-Za-z_$][A-Za-z0-9_$]*)/.exec(tok);
    if (m) return m[1];
    break;
  }
  return '<unknown>';
}

interface Entry {
  file: string;
  line: number;
  name: string;
  commentText: string;
  declStartLine: number;
  declEndLine: number;
  commentStartLine: number;
  commentEndLine: number;
}

function buildEntries(scope: string): Entry[] {
  const decls = groupByFile(runRule(DECL_RULE, scope));
  const comments = groupByFile(runRule(COMMENT_RULE, scope));
  const entries: Entry[] = [];

  const files = new Set([...decls.keys(), ...comments.keys()]);
  for (const file of files) {
    const declList = decls.get(file) ?? [];
    const commentList = comments.get(file) ?? [];
    if (declList.length !== commentList.length) {
      console.warn(`[skip] ${file}: decl matches (${declList.length}) != comment matches (${commentList.length})`);
      continue;
    }
    for (let i = 0; i < declList.length; i++) {
      const decl = declList[i];
      const comment = commentList[i];
      if (comment.range.end.line + 1 !== decl.range.start.line) {
        console.warn(
          `[skip] ${file}: pair ${i} not adjacent (comment ends L${comment.range.end.line + 1}, decl starts L${decl.range.start.line + 1})`
        );
        continue;
      }
      entries.push({
        file,
        line: comment.range.start.line + 1,
        name: extractSymbolName(decl.text),
        commentText: comment.text,
        declStartLine: decl.range.start.line,
        declEndLine: decl.range.end.line,
        commentStartLine: comment.range.start.line,
        commentEndLine: comment.range.end.line
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
  }

  mkdirSync(REPO_ROOT + GLOSSARY_DIR, { recursive: true });
  const byGlossary = new Map<string, Entry[]>();
  for (const e of entries) {
    const path = glossaryPathFor(e.file);
    const list = byGlossary.get(path) ?? [];
    list.push(e);
    byGlossary.set(path, list);
  }
  for (const [glossaryRelPath, list] of byGlossary) {
    const glossaryPath = REPO_ROOT + glossaryRelPath;
    if (!existsSync(glossaryPath)) writeFileSync(glossaryPath, glossaryHeaderFor(list[0].file));
    const sorted = [...list].sort((a, b) => (a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file)));
    for (const e of sorted) {
      appendFileSync(
        glossaryPath,
        `\n### \`${e.name}\` (\`${e.file}:${e.line}\`)\n\n\`\`\`text\n${e.commentText}\n\`\`\`\n`
      );
    }
  }
}

const scope = process.argv[2] ?? 'packages/codegen/src';
const apply = process.argv.includes('--apply');

const entries = buildEntries(scope);
console.log(`Found ${entries.length} mechanically-relocatable JSDoc blocks in ${scope}`);
const glossaryTargets = new Set<string>();
for (const e of entries) {
  const target = glossaryPathFor(e.file);
  glossaryTargets.add(target);
  console.log(`  ${relative(REPO_ROOT, REPO_ROOT + e.file)}:${e.line} -> ${e.name}  (${target})`);
}

if (apply) {
  applyEntries(entries);
  console.log(
    `Applied: removed ${entries.length} comment blocks, wrote entries across ${glossaryTargets.size} per-directory glossary doc(s) under ${GLOSSARY_DIR}/`
  );
} else {
  console.log(
    `\nDry run only — pass --apply to write changes. Would touch ${glossaryTargets.size} glossary doc(s) under ${GLOSSARY_DIR}/.`
  );
}
