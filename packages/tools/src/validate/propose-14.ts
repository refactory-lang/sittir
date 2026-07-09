/**
 * propose-14 — Principle #14 signature-conformance ratchet (R0).
 *
 * Walks the compiler pipeline modules and classifies every function:
 *   conforming        — `(target, ctx: *Ctx)` or `(target, ctx, <recursion-local>…)` per §7.7 CW6
 *   getter-candidate  — single param (R1's getter-vs-method table refines purity by review)
 *   zero-param        — no params; outside the ratchet (not loose-arg debt)
 *   dead              — no in-repo references outside its own tests (FLAGS only; R8 confirms
 *                       via `lsproxy textDocument references` before any deletion)
 *   non-conforming    — anything else (the ratcheted number)
 *
 * REPORTING tool: findings convert to hard failures ONLY via the committed
 * baseline ratchet (fail when a module's non-conforming count EXCEEDS its
 * baseline). It never drives compiler behavior (feedback_metadata_not_behavior).
 * The `<operation><ObjectType>` NAME half is out of scope — review covers naming.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

/** The pipeline modules under the ratchet (proposal §1 gap table). */
export const PIPELINE_MODULES: readonly string[] = [
	'compiler/normalize.ts',
	'compiler/simplify.ts',
	'compiler/evaluate.ts',
	'compiler/link.ts',
	'compiler/assemble.ts',
	'compiler/model/node-map.ts',
	'dsl/rule-transforms.ts'
];

export type Principle14Bucket = 'conforming' | 'getter-candidate' | 'zero-param' | 'non-conforming' | 'dead';

export interface FnRecord {
	/** module-relative path, e.g. `compiler/link.ts` */
	file: string;
	/** fn name; class members as `Class.member` */
	name: string;
	kind: 'function' | 'method' | 'getter' | 'arrow-const';
	exported: boolean;
	params: { name: string; type: string }[];
	bucket: Principle14Bucket;
}

export interface ModuleCounts {
	total: number;
	conforming: number;
	getterCandidate: number;
	zeroParam: number;
	nonConforming: number;
	dead: number;
}

export interface BaselineFile {
	/** module → non-conforming count ceiling */
	modules: Record<string, number>;
}

const stripOptionalUndefined = (type: string): string =>
	type
		.replace(/\s*\|\s*undefined\s*$/, '')
		.replace(/^\s*undefined\s*\|\s*/, '')
		.trim();

function bucketOf(params: FnRecord['params']): Exclude<Principle14Bucket, 'dead'> {
	if (params.length === 0) return 'zero-param';
	if (params.length === 1) return 'getter-candidate';
	// A conforming pipeline fn is `(target, ctx: *Ctx, <recursion-local>...)` —
	// the ctx param isn't always SECOND: entry points like `assemble(normalized,
	// generatedIdTables?, ctx?: AssembleCtx)` carry extra optional args before
	// it. Scan every param after the first (the target) for either a type
	// ending in `Ctx`, or the param literally named `ctx` (the convention every
	// pipeline fn already follows — `ctx: SimplifyCtx`, `ctx: AssembleCtx`, … —
	// a more direct signal than the type-name suffix when both are available).
	const hasCtxParam = params.slice(1).some((p) => p.name === 'ctx' || stripOptionalUndefined(p.type).endsWith('Ctx'));
	return hasCtxParam ? 'conforming' : 'non-conforming';
}

/** Classify every function/method/getter/arrow-const in one module's source. */
export function classifySource(file: string, source: string): FnRecord[] {
	const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
	const records: FnRecord[] = [];

	const hasExport = (node: ts.Node): boolean =>
		!!(ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export);

	const record = (name: string, kind: FnRecord['kind'], sig: ts.SignatureDeclaration, exported: boolean) => {
		const params = sig.parameters.map((p) => ({
			name: p.name.getText(sf),
			type: p.type ? (p.type.getText(sf).split('<')[0] ?? '').trim() : ''
		}));
		records.push({
			file,
			name,
			kind,
			exported,
			params,
			bucket: kind === 'getter' ? 'getter-candidate' : bucketOf(params)
		});
	};

	const visit = (node: ts.Node) => {
		if (ts.isFunctionDeclaration(node) && node.name && node.body) {
			record(node.name.text, 'function', node, hasExport(node));
		} else if (ts.isVariableStatement(node)) {
			const exported = hasExport(node);
			for (const d of node.declarationList.declarations) {
				if (
					d.initializer &&
					(ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer)) &&
					ts.isIdentifier(d.name)
				) {
					record(d.name.text, 'arrow-const', d.initializer, exported);
				}
			}
		} else if (ts.isClassDeclaration(node) && node.name) {
			const cls = node.name.text;
			for (const m of node.members) {
				if (ts.isMethodDeclaration(m) && m.body && ts.isIdentifier(m.name)) {
					record(`${cls}.${m.name.text}`, 'method', m, false);
				} else if (ts.isGetAccessorDeclaration(m) && ts.isIdentifier(m.name)) {
					record(`${cls}.${m.name.text}`, 'getter', m, false);
				}
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(sf);
	return records;
}

const IDENT = /[A-Za-z_$][\w$]*/g;

function isTestPath(path: string): boolean {
	return path.includes('__tests__') || path.endsWith('.test.ts');
}

/**
 * Flag dead functions: zero references outside the declaration, ignoring
 * test files. Tokenization-based (catches dynamic/string-adjacent uses;
 * same-name collisions make it conservative). Class members are skipped —
 * member-name tokens are too collision-prone; R8's lsproxy pass covers them.
 */
export function markDead(records: FnRecord[], corpus: Map<string, string>): FnRecord[] {
	const tokenCounts = new Map<string, Map<string, number>>();
	for (const [path, source] of corpus) {
		const counts = new Map<string, number>();
		for (const m of source.match(IDENT) ?? []) counts.set(m, (counts.get(m) ?? 0) + 1);
		tokenCounts.set(path, counts);
	}
	return records.map((rec) => {
		if (rec.kind === 'method' || rec.kind === 'getter') return rec;
		let inFile = 0;
		let external = 0;
		for (const [path, counts] of tokenCounts) {
			const n = counts.get(rec.name) ?? 0;
			if (n === 0 || isTestPath(path)) continue;
			if (path.endsWith(`/${rec.file}`) || path === rec.file) inFile += n;
			else external += n;
		}
		// one in-file occurrence is the declaration itself
		return inFile - 1 <= 0 && external === 0 ? { ...rec, bucket: 'dead' as const } : rec;
	});
}

/** Aggregate exclusive-bucket counts per module. */
export function countByModule(records: FnRecord[]): Record<string, ModuleCounts> {
	const out: Record<string, ModuleCounts> = {};
	for (const r of records) {
		const c = (out[r.file] ??= {
			total: 0,
			conforming: 0,
			getterCandidate: 0,
			zeroParam: 0,
			nonConforming: 0,
			dead: 0
		});
		c.total++;
		if (r.bucket === 'conforming') c.conforming++;
		else if (r.bucket === 'getter-candidate') c.getterCandidate++;
		else if (r.bucket === 'zero-param') c.zeroParam++;
		else if (r.bucket === 'dead') c.dead++;
		else c.nonConforming++;
	}
	return out;
}

export interface RatchetResult {
	ok: boolean;
	regressions: { module: string; current: number; baseline: number }[];
}

/** The ratchet: fail when any module's non-conforming count EXCEEDS its baseline. */
export function compareWithBaseline(counts: Record<string, ModuleCounts>, baseline: BaselineFile): RatchetResult {
	const regressions: RatchetResult['regressions'] = [];
	for (const [module, c] of Object.entries(counts)) {
		const ceiling = baseline.modules[module] ?? 0;
		if (c.nonConforming > ceiling) {
			regressions.push({ module, current: c.nonConforming, baseline: ceiling });
		}
	}
	return { ok: regressions.length === 0, regressions };
}

// ---------------------------------------------------------------------------
// runner

export interface Propose14Options {
	/** rewrite the committed baseline to the current counts */
	update?: boolean;
	/** print the full per-function classification table (drives R1–R4 + R8) */
	table?: boolean;
	/** machine-readable JSON to stdout */
	json?: boolean;
	/** baseline path override (default: packages/codegen/.principle14-baseline.json) */
	baseline?: string;
	/** repo root override (default: cwd) */
	root?: string;
}

function listTsFiles(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir)) {
		const p = join(dir, entry);
		if (statSync(p).isDirectory()) {
			if (entry === 'node_modules' || entry === 'dist') continue;
			out.push(...listTsFiles(p));
		} else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
			out.push(p);
		}
	}
	return out;
}

function loadRepoCorpus(root: string): Map<string, string> {
	const corpus = new Map<string, string>();
	const pkgs = join(root, 'packages');
	for (const file of listTsFiles(pkgs)) {
		corpus.set(relative(root, file), readFileSync(file, 'utf8'));
	}
	return corpus;
}

export function classifyPipeline(root: string): {
	records: FnRecord[];
	counts: Record<string, ModuleCounts>;
} {
	const corpus = loadRepoCorpus(root);
	const records: FnRecord[] = [];
	for (const module of PIPELINE_MODULES) {
		const path = join(root, 'packages/codegen/src', module);
		if (!existsSync(path)) continue;
		records.push(...classifySource(module, readFileSync(path, 'utf8')));
	}
	const marked = markDead(records, corpus);
	return { records: marked, counts: countByModule(marked) };
}

function formatTable(records: FnRecord[]): string {
	const lines = ['file\tname\tkind\tbucket\tparams'];
	for (const r of records) {
		lines.push(
			`${r.file}\t${r.name}\t${r.kind}\t${r.bucket}\t(${r.params.map((p) => `${p.name}: ${p.type || '?'}`).join(', ')})`
		);
	}
	return lines.join('\n');
}

export async function run(opts: Propose14Options = {}): Promise<number> {
	const root = resolve(opts.root ?? process.cwd());
	const baselinePath = resolve(root, opts.baseline ?? 'packages/codegen/.principle14-baseline.json');
	const { records, counts } = classifyPipeline(root);

	if (opts.update) {
		const modules: Record<string, number> = {};
		for (const [module, c] of Object.entries(counts)) modules[module] = c.nonConforming;
		writeFileSync(baselinePath, `${JSON.stringify({ modules }, null, '\t')}\n`, 'utf8');
		console.log(`propose-14: baseline written to ${relative(root, baselinePath)}`);
		return 0;
	}

	// The ratchet gate runs in EVERY output mode — --json/--table change the
	// format, never the gate behavior.
	if (!existsSync(baselinePath)) {
		console.error(`propose-14: no baseline at ${relative(root, baselinePath)} — run with --update to create it`);
		return 1;
	}
	const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')) as BaselineFile;
	const result = compareWithBaseline(counts, baseline);

	if (opts.json) {
		console.log(JSON.stringify({ counts, records, ratchet: result }, null, 1));
	} else {
		console.log('propose-14 — Principle #14 signature conformance (ratchet on non-conforming)');
		console.log('module\ttotal\tconforming\tgetter-cand\tzero-param\tdead\tNON-CONFORMING');
		for (const [module, c] of Object.entries(counts)) {
			console.log(
				`${module}\t${c.total}\t${c.conforming}\t${c.getterCandidate}\t${c.zeroParam}\t${c.dead}\t${c.nonConforming}`
			);
		}
		if (opts.table) {
			console.log('');
			console.log(formatTable(records));
		}
	}

	if (!result.ok) {
		console.error('');
		for (const r of result.regressions) {
			console.error(
				`RATCHET-REGRESSION: ${r.module} non-conforming ${r.current} > baseline ${r.baseline} — new code must use (target, ctx: *Ctx) per Principle #14 (§7.7); sweep rows lower the baseline, never raise it`
			);
		}
		return 1;
	}
	if (!opts.json) console.log('propose-14: ratchet OK (no module exceeds its baseline)');
	return 0;
}
