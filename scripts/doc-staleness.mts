/**
 * doc-staleness.mts — rank documentation sections by how likely they are
 * stale relative to the code they reference.
 *
 * For every scanned markdown doc, split into heading-delimited sections and
 * compute each section's last-edit timestamp via `git blame --line-porcelain`
 * (newest commit touching any line in the section). Extract repo-path-like
 * code references (packages/..., rust/..., scripts/..., docs/..., .claude/...)
 * from each section and compare against each referenced path's last-commit
 * timestamp (`git log -1 --format=%ct -- <path>`).
 *
 * Reports, sorted by staleness gap (days the code moved after the doc last
 * did):
 *   - dangling references — the path no longer exists (strongest signal);
 *   - stale-prior references — code committed AFTER the section's last edit.
 *
 * The output is a PRIOR, not proof: a file can change without invalidating a
 * claim about it. Verify claims against the code (infigraph) before editing.
 * Dangling paths, though, are mechanical failures worth fixing outright.
 *
 * Usage:
 *   pnpm exec tsx scripts/doc-staleness.mts [--json] [--min-gap-days N] [file.md ...]
 *
 * With no file arguments, scans README.md, CLAUDE.md, .claude/*.md and
 * docs plus subdirectories, excluding generated docs
 * (docs/cli-command-glossary.md, docs/glossary/*.md) and archived
 * planning artifacts (docs/superpowers/**).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

const EXCLUDED = [/^docs\/cli-command-glossary\.md$/, /^docs\/glossary\//, /^docs\/superpowers\//];

interface SectionRef {
  doc: string;
  heading: string;
  lineStart: number;
  lineEnd: number;
  sectionEditedAt: number; // unix seconds; 0 = uncommitted/unknown
  ref: string;
  refCommittedAt: number | null; // null = path does not exist
  gapDays: number | null;
}

function git(args: string[]): string {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function defaultDocs(): string[] {
  const docs: string[] = [];
  for (const f of ['README.md', 'CLAUDE.md']) if (existsSync(join(REPO_ROOT, f))) docs.push(f);
  if (existsSync(join(REPO_ROOT, '.claude'))) {
    for (const f of readdirSync(join(REPO_ROOT, '.claude'))) {
      if (f.endsWith('.md')) docs.push(`.claude/${f}`);
    }
  }
  const walk = (rel: string) => {
    for (const entry of readdirSync(join(REPO_ROOT, rel))) {
      const child = `${rel}/${entry}`;
      if (EXCLUDED.some((re) => re.test(child) || re.test(`${child}/`))) continue;
      const st = statSync(join(REPO_ROOT, child));
      if (st.isDirectory()) walk(child);
      else if (entry.endsWith('.md')) docs.push(child);
    }
  };
  if (existsSync(join(REPO_ROOT, 'docs'))) walk('docs');
  return docs.filter((d) => !EXCLUDED.some((re) => re.test(d)));
}

/** Newest author timestamp per line of a file, via one blame pass. */
function blameLineTimes(doc: string): number[] {
  let out: string;
  try {
    out = git(['blame', '--line-porcelain', '--', doc]);
  } catch {
    return [];
  }
  const times: number[] = [];
  let current = 0;
  for (const line of out.split('\n')) {
    if (line.startsWith('committer-time ')) current = Number(line.slice('committer-time '.length));
    else if (line.startsWith('\t')) times.push(current);
  }
  return times;
}

const PATH_RE = /(?:packages|rust|scripts|docs|examples|tests|utils|\.claude)\/[A-Za-z0-9._/<>{},*-]*[A-Za-z0-9_)]/g;

/** Expand `packages/{a,b}/x` / `packages/<lang>/x` shorthands into concrete candidates. */
function expandRef(raw: string): string[] {
  let refs = [raw];
  const brace = raw.match(/\{([^}]+)\}/);
  if (brace) refs = brace[1]!.split(',').map((alt) => raw.replace(brace[0]!, alt.trim()));
  const langs = ['rust', 'typescript', 'python'];
  refs = refs.flatMap((r) =>
    r.includes('<lang>') || r.includes('<grammar>') ? langs.map((l) => r.replace(/<lang>|<grammar>/g, l)) : [r]
  );
  // Globs and placeholders: keep the concrete parent directory instead.
  return refs.map((r) => {
    const cut = r.search(/[*<>]/);
    if (cut === -1) return r;
    const parent = r.slice(0, cut).replace(/\/[^/]*$/, '');
    return parent;
  });
}

function lastCommitTime(path: string): number | null {
  if (!existsSync(join(REPO_ROOT, path))) return null;
  const out = git(['log', '-1', '--format=%ct', '--', path]).trim();
  return out ? Number(out) : 0;
}

function analyzeDoc(doc: string, refTimeCache: Map<string, number | null>): SectionRef[] {
  const text = readFileSync(join(REPO_ROOT, doc), 'utf8');
  const lines = text.split('\n');
  const lineTimes = blameLineTimes(doc);

  // Heading-delimited sections.
  const sections: { heading: string; start: number; end: number }[] = [];
  let heading = '(preamble)';
  let start = 0;
  lines.forEach((line, i) => {
    if (/^#{1,6}\s/.test(line)) {
      if (i > start) sections.push({ heading, start, end: i - 1 });
      heading = line.replace(/^#+\s*/, '').trim();
      start = i;
    }
  });
  sections.push({ heading, start, end: lines.length - 1 });

  const rows: SectionRef[] = [];
  for (const s of sections) {
    const sectionEditedAt = Math.max(0, ...lineTimes.slice(s.start, s.end + 1));
    const seen = new Set<string>();
    for (let i = s.start; i <= s.end; i++) {
      for (const m of lines[i]!.matchAll(PATH_RE)) {
        for (const ref of expandRef(m[0])) {
          const cleaned = ref.replace(/[.,)]+$/, '');
          if (!cleaned.includes('/') || seen.has(cleaned)) continue;
          seen.add(cleaned);
          if (!refTimeCache.has(cleaned)) refTimeCache.set(cleaned, lastCommitTime(cleaned));
          const refCommittedAt = refTimeCache.get(cleaned)!;
          const gapDays =
            refCommittedAt === null || sectionEditedAt === 0
              ? null
              : Math.round((refCommittedAt - sectionEditedAt) / 86_400);
          rows.push({
            doc,
            heading: s.heading,
            lineStart: s.start + 1,
            lineEnd: s.end + 1,
            sectionEditedAt,
            ref: cleaned,
            refCommittedAt,
            gapDays
          });
        }
      }
    }
  }
  return rows;
}

function main(): void {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const minGapIdx = args.indexOf('--min-gap-days');
  const minGap = minGapIdx !== -1 ? Number(args[minGapIdx + 1]) : 1;
  const files = args.filter((a, i) => !a.startsWith('--') && (minGapIdx === -1 || i !== minGapIdx + 1));
  const docs = files.length > 0 ? files : defaultDocs();

  const cache = new Map<string, number | null>();
  const rows = docs.flatMap((d) => analyzeDoc(d, cache));
  const dangling = rows.filter((r) => r.refCommittedAt === null);
  const stale = rows.filter((r) => r.gapDays !== null && r.gapDays >= minGap).sort((a, b) => b.gapDays! - a.gapDays!);

  if (json) {
    console.log(JSON.stringify({ dangling, stale }, null, 2));
    return;
  }
  const day = (t: number) => new Date(t * 1000).toISOString().slice(0, 10);
  console.log(`# Dangling references (${dangling.length}) — path no longer exists\n`);
  for (const r of dangling) console.log(`  ${r.doc}:${r.lineStart} [${r.heading}] -> ${r.ref}`);
  console.log(`\n# Stale-prior references (${stale.length}) — code moved after the section's last edit\n`);
  console.log('  gap(d)  doc-section [last edit] -> ref [last code commit]');
  for (const r of stale) {
    console.log(
      `  ${String(r.gapDays).padStart(5)}  ${r.doc}:${r.lineStart} [${r.heading}] (${day(r.sectionEditedAt)}) -> ${r.ref} (${day(r.refCommittedAt!)})`
    );
  }
  console.log('\nPrior, not proof: verify each claim against the code before editing; fix dangling paths outright.');
}

main();
