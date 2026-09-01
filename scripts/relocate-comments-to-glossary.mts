/**
 * relocate-comments-to-glossary.mts — move every comment out of hand-written
 * source into the per-directory glossary under docs/glossary/.
 *
 * Each comment is filed under the declaration it belongs to, decided from
 * position alone:
 *   - a comment (or a stack of them) directly above a declaration — only
 *     blank lines or other comments between — documents that declaration
 *     (a `###` section, one per declaration);
 *   - a comment trailing code on a declaration's own line documents that
 *     declaration;
 *   - a comment inside a declaration's range documents that declaration's
 *     body: a `####` sub-section inside the declaration's section;
 *   - anything else is file-level: the file's `module` section.
 * Names are qualified by their enclosing class / interface / enum / object
 * (`Outer.inner`). Directive comments (`@ts-*`, `eslint`, `prettier-ignore`,
 * `biome-ignore`, `@rule-type-consts`, `/// <reference>`) are tooling, not
 * documentation, and stay in source.
 *
 * Sections are keyed `### \`<file>::<qualified name>\`` — the symbol id, no
 * line number — so a heading never goes stale and joins to the code graph
 * by identity.
 *
 * Re-running is idempotent: a comment whose text is already in the target
 * glossary is neither duplicated nor removed twice.
 *
 * Usage:
 *   pnpm exec tsx scripts/relocate-comments-to-glossary.mts [--apply] [--declarations-only] [path ...]
 *     paths default to packages/codegen/src; tests are always excluded.
 *     --apply             write: strip the comments from source, append to the glossary
 *     --declarations-only leave body and file-level comments in place
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const REPO_ROOT = new URL('..', import.meta.url).pathname;
const SRC_PREFIX = 'packages/codegen/src/';
const GLOSSARY_DIR = 'docs/glossary';

const DECL_KINDS = [
  'function_declaration',
  'generator_function_declaration',
  'method_definition',
  'abstract_method_signature',
  'class_declaration',
  'abstract_class_declaration',
  'interface_declaration',
  'type_alias_declaration',
  'enum_declaration',
  'lexical_declaration',
  'property_signature',
  'method_signature',
  'public_field_definition',
  'pair'
];
/** Function bodies: a declaration inside one is a local, not a glossary entry. */
const BODY_KINDS = [
  'function_declaration',
  'generator_function_declaration',
  'method_definition',
  'arrow_function',
  'function_expression'
];

const IGNORES = "ignores: ['**/__tests__/**', '**/*.test.ts', '**/*.test-d.ts']";
const INLINE_RULES = [
  `id: comment\nlanguage: TypeScript\n${IGNORES}\nrule: { kind: comment }`,
  ...[...new Set([...DECL_KINDS, ...BODY_KINDS])].map(
    (k) => `id: ${k}\nlanguage: TypeScript\n${IGNORES}\nrule: { kind: ${k} }`
  )
].join('\n---\n');

const DIRECTIVE =
  /^(\/\/\/\s*<reference|\/\/\s*(@|eslint|prettier-ignore|biome-ignore)|\/\*\s*(eslint|@ts-|@__PURE__))/;

interface Pos {
  line: number;
  column: number;
}
interface Match {
  /** `comment`, or the declaration node's kind (one inline rule per kind). */
  ruleId: string;
  file: string;
  text: string;
  range: { start: Pos; end: Pos };
}
interface Decl {
  kind: string;
  start: Pos;
  end: Pos;
  name: string;
}
interface Entry {
  file: string;
  /** Section key: the qualified declaration name, or the file itself for file-level comments. */
  section: string;
  /** Set for a comment inside the declaration's body — filed as a sub-section. */
  body: boolean;
  text: string;
  start: Pos;
  end: Pos;
}

function scan(paths: string[]): Match[] {
  const out = execFileSync('ast-grep', ['scan', '--inline-rules', INLINE_RULES, '--json', ...paths], {
    cwd: REPO_ROOT,
    maxBuffer: 1024 * 1024 * 256
  });
  return JSON.parse(out.toString('utf8')) as Match[];
}

function srcRelative(file: string): string {
  return file.startsWith(SRC_PREFIX) ? file.slice(SRC_PREFIX.length) : file;
}

function glossaryPathFor(file: string): string {
  const rel = srcRelative(file);
  const lastSlash = rel.lastIndexOf('/');
  const dir = lastSlash === -1 ? '.' : rel.slice(0, lastSlash);
  const slug = dir === '.' ? 'root' : dir.replace(/\//g, '-');
  return `${GLOSSARY_DIR}/${slug}.md`;
}

function glossaryHeaderFor(file: string): string {
  const rel = srcRelative(file);
  const lastSlash = rel.lastIndexOf('/');
  const dir = lastSlash === -1 ? SRC_PREFIX.slice(0, -1) : SRC_PREFIX + rel.slice(0, lastSlash);
  return (
    `# \`${dir}\` — Function Glossary\n\n` +
    `Per-function reference for \`${dir}/\`, mechanically relocated from source\n` +
    `comments by \`scripts/relocate-comments-to-glossary.mts\` (mechanical pass —\n` +
    `unedited, unverified). A later pass reformats/verifies these entries and decides\n` +
    `what merges into docs/compiler-phase-glossary.md's phase narrative.\n\n` +
    `See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).\n\n---\n`
  );
}

const MODIFIERS = new Set([
  'export',
  'default',
  'public',
  'private',
  'protected',
  'static',
  'async',
  'override',
  'readonly',
  'abstract',
  'declare',
  'function',
  'function*',
  'get',
  'set',
  'interface',
  'class',
  'type',
  'enum',
  'const',
  'let',
  'var'
]);

function declName(text: string): string {
  for (const tok of text.split(/\s+/)) {
    if (MODIFIERS.has(tok)) continue;
    const m = /^([A-Za-z_$][A-Za-z0-9_$]*)/.exec(tok);
    if (m) return m[1]!;
    break;
  }
  return '<unknown>';
}

function before(a: Pos, b: Pos): boolean {
  return a.line < b.line || (a.line === b.line && a.column <= b.column);
}
function contains(d: Decl, s: Pos, e: Pos): boolean {
  return before(d.start, s) && before(e, d.end);
}

function qualify(targets: Decl[], d: Decl): string {
  const outer = targets
    .filter((o) => o !== d && contains(o, d.start, d.end))
    .sort((a, b) => a.start.line - b.start.line);
  return [...outer.map((o) => o.name), d.name].join('.');
}

/** The declarations of one file that get glossary entries: not nested inside any function body. */
function targetsOf(list: Match[]): Decl[] {
  const all: Decl[] = list
    .filter((m) => m.ruleId !== 'comment')
    .map((m) => ({ kind: m.ruleId, start: m.range.start, end: m.range.end, name: declName(m.text) }))
    .sort((a, b) => a.start.line - b.start.line || a.start.column - b.start.column);
  const bodies = all.filter((d) => BODY_KINDS.includes(d.kind));
  return all.filter((d) => DECL_KINDS.includes(d.kind) && !bodies.some((b) => b !== d && contains(b, d.start, d.end)));
}

/**
 * Consecutive whole-line `//` comments at one indentation are one comment.
 * A trailing comment after code never merges: the strip would take the
 * code between two of them.
 */
function mergeLineComments(comments: Match[], lines: string[]): Match[] {
  const wholeLine = (c: Match): boolean => lines[c.range.start.line]!.slice(0, c.range.start.column).trim() === '';
  const out: Match[] = [];
  for (const c of comments) {
    const prev = out[out.length - 1];
    if (
      prev &&
      prev.text.startsWith('//') &&
      c.text.startsWith('//') &&
      c.range.start.line === prev.range.end.line + 1 &&
      c.range.start.column === prev.range.start.column &&
      wholeLine(prev) &&
      wholeLine(c)
    ) {
      prev.text += '\n' + c.text;
      prev.range = { start: prev.range.start, end: c.range.end };
      continue;
    }
    out.push({ ...c, range: { start: c.range.start, end: c.range.end } });
  }
  return out;
}

function groupByFile(matches: Match[]): Map<string, Match[]> {
  const byFile = new Map<string, Match[]>();
  for (const m of matches) byFile.set(m.file, [...(byFile.get(m.file) ?? []), m]);
  return byFile;
}

function buildEntries(matches: Match[], declarationsOnly: boolean): Entry[] {
  const entries: Entry[] = [];
  for (const [file, list] of groupByFile(matches)) {
    const decls = targetsOf(list);
    const lines = readFileSync(REPO_ROOT + file, 'utf8').split('\n');
    const comments = mergeLineComments(
      list
        .filter((m) => m.ruleId === 'comment' && !DIRECTIVE.test(m.text))
        .sort((a, b) => a.range.start.line - b.range.start.line || a.range.start.column - b.range.start.column),
      lines
    );
    const commentLines = new Set<number>();
    for (const c of comments) for (let l = c.range.start.line; l <= c.range.end.line; l++) commentLines.add(l);
    const innermostAt = (p: Pos): Decl | undefined =>
      decls.filter((d) => contains(d, p, p)).sort((a, b) => b.start.line - a.start.line)[0];
    // The declaration whose span covers a line — the narrowest one when
    // several do (a property inside its interface).
    const innermostOnLine = (line: number): Decl | undefined =>
      decls
        .filter((d) => d.start.line <= line && d.end.line >= line)
        .sort((a, b) => b.start.line - a.start.line || a.end.line - b.end.line)[0];

    for (const c of comments) {
      const trailing = lines[c.range.start.line]!.slice(0, c.range.start.column).trim() !== '';
      let section: string | undefined;
      let body = false;
      if (trailing) {
        // Trailing code on its own line: the declaration on that line.
        const own = innermostOnLine(c.range.start.line);
        if (own) section = qualify(decls, own);
      } else {
        // Directly above a declaration: every line between is blank or comment.
        const following = decls.find((d) => d.start.line > c.range.end.line);
        let adjacent = following !== undefined;
        if (following) {
          for (let l = c.range.end.line + 1; l < following.start.line; l++) {
            if (!commentLines.has(l) && lines[l]!.trim() !== '') {
              adjacent = false;
              break;
            }
          }
        }
        if (adjacent && following) section = qualify(decls, following);
      }
      if (section === undefined) {
        if (declarationsOnly) continue;
        const enclosing = innermostAt(c.range.start);
        section = enclosing ? qualify(decls, enclosing) : srcRelative(file);
        body = enclosing !== undefined;
      }
      entries.push({ file, section, body, text: c.text, start: c.range.start, end: c.range.end });
    }
  }
  return entries;
}

function stripFromSource(file: string, entries: Entry[]): void {
  const abs = REPO_ROOT + file;
  const lines = readFileSync(abs, 'utf8').split('\n');
  for (const e of [...entries].sort((a, b) => b.start.line - a.start.line || b.start.column - a.start.column)) {
    const head = lines[e.start.line]!.slice(0, e.start.column);
    const tail = lines[e.end.line]!.slice(e.end.column);
    const joined = head + tail;
    const at = e.start.line;
    lines.splice(at, e.end.line - at + 1, ...(joined.trim() === '' ? [] : [joined.replace(/\s+$/, '')]));
    // A removed whole-line comment must not leave a blank line where it
    // stood next to another blank (or at the top of the file) — only
    // around this edit, nothing elsewhere in the file is touched.
    if (joined.trim() === '' && lines[at] === '' && (at === 0 || lines[at - 1] === '')) lines.splice(at, 1);
  }
  writeFileSync(abs, lines.join('\n'));
}

/**
 * A glossary doc is a header followed by `### <name> (...)` sections; body
 * comments nest as `#### body` sub-sections inside their declaration's
 * section, so the doc is rewritten section-wise rather than appended to.
 */
function writeGlossary(entries: Entry[]): Set<string> {
  mkdirSync(REPO_ROOT + GLOSSARY_DIR, { recursive: true });
  const targets = new Set<string>();
  const byGlossary = new Map<string, Entry[]>();
  for (const e of entries) {
    const p = glossaryPathFor(e.file);
    byGlossary.set(p, [...(byGlossary.get(p) ?? []), e]);
  }
  for (const [rel, list] of byGlossary) {
    const abs = REPO_ROOT + rel;
    const doc = existsSync(abs) ? readFileSync(abs, 'utf8') : glossaryHeaderFor(list[0]!.file);
    const [header, ...rest] = doc.split(/^(?=### )/m);
    const sections = rest.map((s) => ({ key: sectionKey(s), text: s }));
    let changed = false;
    for (const e of list) {
      const isModule = e.section === srcRelative(e.file);
      const key = `${e.file}::${isModule ? 'module' : e.section}`;
      const block = `\`\`\`text\n${e.text}\n\`\`\``;
      let section = sections.find((s) => s.key === key);
      if (!section) {
        section = { key, text: `### \`${key}\`\n` };
        sections.push(section);
        changed = true;
      }
      if (section.text.includes(block)) continue;
      section.text = section.text.replace(/\s*$/, '\n');
      section.text += e.body ? `\n#### body\n\n${block}\n` : `\n${block}\n`;
      changed = true;
    }
    if (!changed) continue;
    writeFileSync(abs, [header!, ...sections.map((s) => s.text.replace(/\s*$/, '\n'))].join('\n'));
    targets.add(rel);
  }
  return targets;
}

function sectionKey(sectionText: string): string {
  const m = /^### `([^`]+)`/.exec(sectionText);
  return m ? m[1]! : sectionText.split('\n')[0]!;
}

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const declarationsOnly = args.includes('--declarations-only');
const paths = args.filter((a) => !a.startsWith('--'));
if (paths.length === 0) paths.push('packages/codegen/src');

const entries = buildEntries(scan(paths), declarationsOnly);
console.log(`Found ${entries.length} relocatable comment(s) under ${paths.join(', ')}`);
for (const e of entries)
  console.log(
    `  ${e.file}:${e.start.line + 1} -> ${e.section}${e.body ? ' › body' : ''}  (${glossaryPathFor(e.file)})`
  );

if (!apply) {
  console.log(`\nDry run only — pass --apply to write changes.`);
} else {
  const byFile = new Map<string, Entry[]>();
  for (const e of entries) byFile.set(e.file, [...(byFile.get(e.file) ?? []), e]);
  for (const [file, list] of byFile) stripFromSource(file, list);
  const targets = writeGlossary(entries);
  console.log(
    `Applied: removed ${entries.length} comment(s) from ${byFile.size} file(s); wrote ${targets.size} glossary doc(s) under ${GLOSSARY_DIR}/`
  );
}
