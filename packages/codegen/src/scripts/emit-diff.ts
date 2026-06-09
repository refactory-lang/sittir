/**
 * emit-diff — post-regen report of what the current codegen run changed in the
 * generated output, grouped by emitter.
 *
 * Called by `packages/codegen/src/cli.ts` at the end of a `--all` run (unless
 * `--no-emit-diff`). It diffs the **working tree vs HEAD** over the same roots
 * the manifest tracks (`generatedRootsFor`), so the report and the manifest
 * never disagree about what counts as generated.
 *
 * Baseline rationale: working-tree-vs-HEAD answers "what did THIS regen
 * produce relative to the last commit" — the question you actually have while
 * iterating on codegen. It is intentionally not a commit-range diff; for
 * historical drift across commits, the committed manifest is the mechanism.
 *
 * Grouping is by emitter, derived purely from the output file path (each
 * emitter owns one file, per the emitter-pattern-consistency convention), so
 * no provenance instrumentation is needed inside the emitters themselves.
 */

import { execFileSync } from 'node:child_process';
import { REPO_ROOT, generatedRootsFor, type Grammar } from './generated-manifest.ts';

/** Emitter buckets, in display order. */
const EMITTER_ORDER = [
	'factory',
	'from',
	'wrap',
	'types',
	'consts',
	'grammar',
	'render',
	'native',
	'templates',
	'runtime',
	'metadata'
] as const;
type Emitter = (typeof EMITTER_ORDER)[number];

interface FileChange {
	path: string; // repo-relative
	emitter: Emitter;
	added: number;
	removed: number;
	/** New-file line ranges, e.g. "L120-207", "L410". Empty for collapsed/binary. */
	ranges: string[];
	/** parser/binary artifact — counts only, no line ranges (kept terse). */
	collapsed: boolean;
	binary: boolean;
}

/**
 * Map an output path to the emitter that produced it. File-level granularity:
 * one file == one emitter (render-module.ts and the rust render crate are the
 * two halves of the render emitter; lib.rs/index.* are the native bindings).
 */
function emitterFor(rel: string): Emitter {
	const base = rel.split('/').pop() ?? rel;
	if (rel.startsWith('rust/crates/')) {
		if (rel.includes('/render/')) return 'render';
		if (rel.includes('/templates/')) return 'templates';
		if (base === 'test-fixtures.json') return 'metadata';
		return 'native'; // lib.rs, index.{js,d.ts}, *.node
	}
	if (rel.includes('/templates/')) return 'templates';
	if (rel.includes('/.sittir/')) return 'metadata';
	if (base === 'node-model.json5') return 'metadata';
	switch (base) {
		case 'factories.ts':
			return 'factory';
		case 'from.ts':
			return 'from';
		case 'wrap.ts':
			return 'wrap';
		case 'types.ts':
		case 'type-test.ts':
			return 'types';
		case 'consts.ts':
			return 'consts';
		case 'grammar.ts':
			return 'grammar';
		case 'render-module.ts':
			return 'render';
		default:
			// backend / boundary / engine / hash / ir / is / index / utils, etc.
			return 'runtime';
	}
}

/** parser/binary artifacts: counts only, line ranges suppressed (they churn). */
function isCollapsed(rel: string): boolean {
	const base = rel.split('/').pop() ?? rel;
	return base === 'parser.c' || base === 'parser.wasm' || base.endsWith('.node');
}

/** Compress a new-file hunk header `@@ -_ +start,count @@` into "L120-131". */
function formatRange(start: number, count: number): string {
	if (count <= 0) return `L${start}`; // pure deletion: anchor at the deletion point
	if (count === 1) return `L${start}`;
	return `L${start}-${start + count - 1}`;
}

const HUNK_RE = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/;
const NEW_PATH_RE = /^\+\+\+ b\/(.+)$/;
const OLD_PATH_RE = /^--- a\/(.+)$/;

/** Parse `git diff --unified=0` output into per-file change records. */
function parseDiff(diff: string): FileChange[] {
	const files: FileChange[] = [];
	let cur: FileChange | null = null;

	const begin = (rel: string): void => {
		cur = {
			path: rel,
			emitter: emitterFor(rel),
			added: 0,
			removed: 0,
			ranges: [],
			collapsed: isCollapsed(rel),
			binary: false
		};
		files.push(cur);
	};

	for (const line of diff.split('\n')) {
		if (line.startsWith('diff --git ')) {
			// New file section. The authoritative path comes from the +++/---
			// lines below; seed from `b/<path>` here so deletions (which have
			// `+++ /dev/null`) still attribute to the removed file.
			const m = line.match(/ b\/(.+)$/);
			begin(m ? m[1]! : line.slice('diff --git '.length));
			continue;
		}
		if (!cur) continue;
		if (line.startsWith('Binary files ')) {
			cur.binary = true;
			cur.collapsed = true;
			continue;
		}
		const newPath = line.match(NEW_PATH_RE);
		if (newPath) {
			cur.path = newPath[1]!;
			cur.emitter = emitterFor(cur.path);
			cur.collapsed = isCollapsed(cur.path);
			continue;
		}
		const oldPath = line.match(OLD_PATH_RE);
		if (oldPath) {
			// Deletion: +++ is /dev/null, so keep the old path as the identity.
			if (cur.path.endsWith('/dev/null') || cur.path === '/dev/null') {
				cur.path = oldPath[1]!;
				cur.emitter = emitterFor(cur.path);
				cur.collapsed = isCollapsed(cur.path);
			}
			continue;
		}
		const hunk = line.match(HUNK_RE);
		if (hunk) {
			const start = Number(hunk[1]);
			const count = hunk[2] === undefined ? 1 : Number(hunk[2]);
			if (!cur.collapsed) cur.ranges.push(formatRange(start, count));
			continue;
		}
		// Content lines (no context, since --unified=0).
		if (line.startsWith('+') && !line.startsWith('+++')) cur.added++;
		else if (line.startsWith('-') && !line.startsWith('---')) cur.removed++;
	}
	return files;
}

/** At most `max` ranges, then a `+N more` tail, to keep one line per file. */
function joinRanges(ranges: string[], max = 6): string {
	if (ranges.length === 0) return '';
	if (ranges.length <= max) return ranges.join(', ');
	return `${ranges.slice(0, max).join(', ')}, +${ranges.length - max} more`;
}

/**
 * Run the regen diff for a grammar and format it. Returns `null` when git is
 * unavailable or this is not a working tree (the report is a convenience, never
 * a hard dependency — a missing git must not fail codegen).
 */
export function formatEmitDiff(grammar: Grammar): string | null {
	let raw: string;
	try {
		raw = execFileSync(
			'git',
			['diff', '--unified=0', '--no-color', 'HEAD', '--', ...generatedRootsFor(grammar)],
			{ cwd: REPO_ROOT, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 }
		);
	} catch {
		return null; // not a git repo / git absent / no HEAD — skip silently
	}

	const changes = parseDiff(raw).filter((c) => c.path && !c.path.endsWith('/dev/null'));
	const header = `Regen diff vs HEAD — ${grammar}`;
	if (changes.length === 0) {
		return `${header}\n  (no generated changes vs HEAD)`;
	}

	const totalAdded = changes.reduce((n, c) => n + c.added, 0);
	const totalRemoved = changes.reduce((n, c) => n + c.removed, 0);
	const touched = new Set(changes.map((c) => c.emitter));
	const lines: string[] = [
		`${header}   (${changes.length} file${changes.length === 1 ? '' : 's'}, ` +
			`${touched.size} emitter${touched.size === 1 ? '' : 's'}, +${totalAdded} -${totalRemoved})`
	];

	// Align the file column across all rows for scannability.
	const pathWidth = Math.min(48, Math.max(...changes.map((c) => c.path.length)));
	const fmtCounts = (c: FileChange): string =>
		c.binary ? 'binary' : `+${c.added} -${c.removed}`;

	for (const emitter of EMITTER_ORDER) {
		const group = changes.filter((c) => c.emitter === emitter).sort((a, b) => a.path.localeCompare(b.path));
		if (group.length === 0) continue;
		for (const c of group) {
			const counts = fmtCounts(c).padStart(9);
			const ranges = c.collapsed
				? c.binary
					? ''
					: '(parser artifact)'
				: joinRanges(c.ranges);
			const label = emitter.padEnd(9);
			lines.push(`  ${label} ${c.path.padEnd(pathWidth)} ${counts}${ranges ? `  ${ranges}` : ''}`);
		}
	}

	const unchanged = EMITTER_ORDER.filter((e) => !touched.has(e));
	if (unchanged.length > 0) lines.push(`  (no change: ${unchanged.join(', ')})`);

	return lines.join('\n');
}
