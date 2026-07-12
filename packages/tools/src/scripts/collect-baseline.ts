/**
 * collect-baseline.ts — feature 016, US1.
 *
 * Produces the per-backend `BackendBaseline` JSON committed under
 * `specs/016-parity-regressions/baselines/{ts,native}.json`. Reads
 * `SITTIR_BACKEND` from the environment to select between TS-mode (the
 * default Nunjucks pipeline) and native-mode (the napi engine). Inside
 * the corpus validators, `buildReadHandle()` already does the dispatch
 * — this script just wires up the validators + parity-fixture render
 * comparison and shapes the output to the contract in
 * `specs/016-parity-regressions/contracts/baseline-json.md`.
 *
 * Determinism contract:
 *   - 4-space indent, `\n` line endings, trailing newline.
 *   - Sorted keys at every level (writer rebuilds the object with
 *     sorted keys before JSON.stringify).
 *   - Sorted `failingKinds` arrays, sorted `failingByKind` keys
 *     (failure-id values stay in fixture-file declaration order).
 *   - Empty collections explicit: `[]` / `{}` not omitted.
 *   - No timestamps. The only mutable header field is `commit`
 *     (content-derived from `git rev-parse --short=7 HEAD`).
 *
 * Used as both an importable module (the test in
 * `__tests__/collect-baseline.test.ts` calls `collectBaseline` /
 * `serialiseBaseline` directly) and a CLI entry — the bottom of this
 * file detects whether it was invoked as a script and prints to stdout
 * if so.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { validateFactoryRenderParse } from '../validate/factory-render-parse.ts';
import { validateFrom } from '../validate/from.ts';
import { validateReadRenderParse } from '../validate/read-render-parse.ts';
import { validateTemplateCoverage } from '../validate/template-coverage.ts';
import { load } from '../codegen-surface.ts';
import { loadKindNames } from '../validate/common.ts';

const { renderModuleFixturesPath } = await load('renderModulePaths');

// ---------------------------------------------------------------------------
// Schema types — see contracts/baseline-json.md
// ---------------------------------------------------------------------------

export type Backend = 'js' | 'native';
export type Grammar = 'python' | 'rust' | 'typescript';

const GRAMMARS: readonly Grammar[] = ['python', 'rust', 'typescript'];

export interface ValidatorResult {
	pass: number;
	total: number;
	/** Template-shape failures: AST diverges between source and rendered output. */
	failingKinds: string[];
	/**
	 * Format-only failures: AST shapes match but bytes differ (whitespace,
	 * quote style, numeric literal style, optional tokens, comment placement,
	 * or any other variation the grammar treats as semantically equivalent).
	 * Deferred to feature 017-format-inference. See contracts/baseline-json.md
	 * for the triage rules.
	 */
	formatDeferredKinds: string[];
}

export interface RoundtripResult extends ValidatorResult {
	astMatchPass: number;
}

export interface ParityFixtures {
	pass: number;
	total: number;
	/** Template-shape failures by kind → fixture id list. */
	failingByKind: { readonly [kind: string]: readonly string[] };
	/** Format-only failures by kind → fixture id list. Deferred to 017. */
	formatDeferredByKind: { readonly [kind: string]: readonly string[] };
}

export interface GrammarEntry {
	validators: {
		from: ValidatorResult;
		coverage: ValidatorResult;
		roundtrip: RoundtripResult;
		factoryRoundtrip: RoundtripResult;
	};
	parityFixtures: ParityFixtures;
}

export interface BackendBaseline {
	backend: Backend;
	commit: string;
	grammars: { readonly [grammar in Grammar]: GrammarEntry };
	totals: {
		pass: number;
		fail: number;
		total: number;
	};
}

// ---------------------------------------------------------------------------
// Repo-relative path helpers
// ---------------------------------------------------------------------------

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url)).replace(/\/$/, '');

function templatesPathFor(grammar: Grammar): string {
	return resolve(repoRoot, `packages/${grammar}/templates`);
}

function fixturesPathFor(grammar: Grammar): string {
	return resolve(repoRoot, renderModuleFixturesPath(grammar));
}

// ---------------------------------------------------------------------------
// Failing-kind extraction
// ---------------------------------------------------------------------------

/**
 * Extract the kind from a roundtrip-style error name. The validators
 * format roundtrip error names as `${entry.name} [${renderedKind}]`,
 * so the bracketed suffix carries the kind. Returns null when the name
 * doesn't carry a kind tag.
 */
function kindFromRoundtripName(name: string): string | null {
	const m = /\[([^\]]+)\]$/.exec(name);
	return m ? (m[1] ?? null) : null;
}

function uniqSorted(values: Iterable<string>): string[] {
	return [...new Set(values)].sort();
}

// ---------------------------------------------------------------------------
// Parity-fixture collection
// ---------------------------------------------------------------------------

interface RenderFixture {
	readonly kind: 'render';
	readonly grammar: string;
	readonly input: { readonly $type: number; readonly [k: string]: unknown };
	readonly expectedOutput: string;
}

interface ParityFixtureLike {
	readonly kind: string;
	readonly input?: { readonly $type?: number };
}

function loadRenderFixtures(grammar: Grammar): RenderFixture[] {
	const raw = readFileSync(fixturesPathFor(grammar), 'utf-8');
	const all = JSON.parse(raw) as ParityFixtureLike[];
	return all.filter((f): f is RenderFixture => f.kind === 'render' && typeof f.input?.$type === 'number');
}

interface ParityRenderer {
	render: (node: unknown) => string;
}

/** Resolved per-grammar boundary path used for native parity render. */
function boundaryPathFor(grammar: Grammar): string {
	return pathToFileURL(resolve(repoRoot, `packages/${grammar}/src/boundary.ts`)).href;
}

/**
 * Type of the dynamic-import function injected by tests. Kept narrow on
 * purpose — tests pass in a stub that resolves or rejects to exercise
 * the error branch deterministically.
 */
export type BoundaryImporter = (path: string) => Promise<unknown>;

/**
 * Load the per-grammar `boundary.ts` and return its `render` function.
 * Throws `Error` (with grammar name + the import path it tried) when
 * the import fails or the module doesn't expose a `render` function.
 *
 * Caller decides whether to recover (TS mode = optional, swallow the
 * error and use the createRenderer fallback) or escalate (native mode =
 * the failure means our "native" baseline would lie about which engine
 * produced its numbers — surface it).
 *
 * Exported for tests so the failure mode can be exercised without
 * patching the filesystem. `importFn` defaults to a real dynamic
 * import; tests inject a stub.
 */
export async function loadBoundaryRender(
	grammar: Grammar,
	importFn: BoundaryImporter = (p) => import(p)
): Promise<(node: unknown) => string> {
	const boundaryPath = boundaryPathFor(grammar);
	let mod: unknown;
	try {
		mod = await importFn(boundaryPath);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		throw new Error(`failed to import native boundary for grammar '${grammar}' from ${boundaryPath}: ${msg}`);
	}
	const render = (mod as { render?: unknown }).render;
	if (typeof render !== 'function') {
		throw new Error(`native boundary for grammar '${grammar}' at ${boundaryPath} does not export a 'render' function`);
	}
	return render as (node: unknown) => string;
}

/**
 * Resolve the render function used for parity fixtures. In TS mode we
 * use `createRenderer` over the per-grammar templates directory. In
 * native mode we route through the per-grammar boundary shim, which
 * dispatches to the napi engine via getActiveBackend (the same path the
 * validators use through `buildReadHandle` — keeping parity-fixture
 * render with the validators' read path).
 *
 * Failure policy: in `native` mode we surface the import error so a
 * silent TS fallback can't poison the dual-baseline regression check
 * with TS numbers labelled `"backend": "native"`. TS mode is the only
 * path that may legitimately reach the createRenderer fallback.
 */
async function buildParityRenderer(
	grammar: Grammar,
	backend: Backend,
	importFn?: BoundaryImporter
): Promise<ParityRenderer> {
	if (backend === 'native') {
		const render = await loadBoundaryRender(grammar, importFn);
		return { render };
	}
	// Lazy import of @sittir/legacy-core's createRenderer — keeps the module
	// import-cheap when the test target only exercises the type shape.
	const core = (await import('@sittir/legacy-core')) as {
		createRenderer: (
			templatesPath: string,
			options?: { kindNames?: ReadonlyMap<number, string> }
		) => {
			render: (node: unknown) => string;
		};
	};
	const kindNames = await loadKindNames(grammar);
	const r = core.createRenderer(templatesPathFor(grammar), { kindNames });
	return { render: r.render.bind(r) };
}

export async function collectParityFixtures(
	grammar: Grammar,
	backend: Backend,
	importFn?: BoundaryImporter
): Promise<ParityFixtures> {
	const fixtures = loadRenderFixtures(grammar);
	const renderer = await buildParityRenderer(grammar, backend, importFn);

	let pass = 0;
	// Map insertion order matches fixture-file declaration order — keep
	// the failure-id values in that order, then re-key with sorted keys
	// when serialising. Phase D: $type is numeric; map on numeric keys.
	const failingByKind = new Map<number, string[]>();

	fixtures.forEach((fx, idx) => {
		let actual: string;
		try {
			actual = renderer.render(fx.input);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`[${grammar}][${backend}][render #${idx}] ${fx.input.$type}: ${message}`);
		}
		if (actual === fx.expectedOutput) {
			pass++;
			return;
		}
		const kind = fx.input.$type;
		const id = `render #${idx}`;
		const existing = failingByKind.get(kind) ?? [];
		existing.push(id);
		failingByKind.set(kind, existing);
	});

	// Re-key the map with sorted numeric kind IDs converted to strings.
	// Value arrays stay in insertion order (fixture-file declaration order).
	// Determinism rule: sorted numeric keys, fixture-order values.
	const sortedFailingByKind: Record<string, string[]> = {};
	for (const k of [...failingByKind.keys()].sort((a, b) => a - b)) {
		sortedFailingByKind[String(k)] = failingByKind.get(k)!;
	}

	return {
		pass,
		total: fixtures.length,
		failingByKind: sortedFailingByKind,
		// 016 captures every failure as template-shape by default.
		// Format-vs-template triage runs during cluster commits — when
		// a fixture is reclassified, it's MOVED from `failingByKind` to
		// `formatDeferredByKind`. At baseline (commit 6e06f93f / no
		// triage performed), this is always empty.
		formatDeferredByKind: {}
	};
}

// ---------------------------------------------------------------------------
// Validator collection
// ---------------------------------------------------------------------------

async function collectValidatorsForGrammar(grammar: Grammar, backend: Backend): Promise<GrammarEntry['validators']> {
	const tp = templatesPathFor(grammar);

	// Pass backend explicitly so each validator uses the correct engine
	// without touching process.env — avoids cross-contamination when
	// collectBaseline() is called concurrently.
	const backendArg: 'native' | 'js' = backend;
	const [from, cov, rt, fac] = await Promise.all([
		validateFrom(grammar, backendArg),
		Promise.resolve(validateTemplateCoverage(grammar, tp)),
		validateReadRenderParse(grammar, tp, { backend: backendArg }),
		validateFactoryRenderParse(grammar, tp, backendArg)
	]);

	// Format-deferred kinds default to []. Triage runs during cluster
	// commits — see contracts/baseline-json.md verdict rules. When a
	// template-shape fix surfaces an underlying format-only failure,
	// the cluster commit MOVES the kind from `failingKinds` into
	// `formatDeferredKinds` (preserving the regression-checker's
	// `failingKinds + formatDeferredKinds` non-growth invariant within
	// 016). At baseline, no triage has happened — every entry is [].
	const empty: string[] = [];
	return {
		from: {
			pass: from.pass,
			total: from.total,
			failingKinds: uniqSorted(from.errors.map((e) => e.kind)),
			formatDeferredKinds: empty
		},
		coverage: {
			pass: cov.pass,
			total: cov.total,
			failingKinds: uniqSorted(cov.issues.map((i) => i.kind)),
			formatDeferredKinds: empty
		},
		roundtrip: {
			pass: rt.pass,
			total: rt.total,
			astMatchPass: rt.astMatchPass,
			failingKinds: uniqSorted(
				[...rt.errors, ...rt.astMismatches]
					.map((e) => kindFromRoundtripName(e.name))
					.filter((k): k is string => k !== null)
			),
			formatDeferredKinds: empty
		},
		factoryRoundtrip: {
			pass: fac.pass,
			total: fac.total,
			astMatchPass: fac.astMatchPass,
			failingKinds: uniqSorted([...fac.errors, ...fac.astMismatches].map((e) => e.kind)),
			formatDeferredKinds: empty
		}
	};
}

// ---------------------------------------------------------------------------
// Top-level assembly
// ---------------------------------------------------------------------------

function shortSha(): string {
	try {
		const out = execSync('git rev-parse --short=7 HEAD', {
			cwd: repoRoot,
			encoding: 'utf-8',
			stdio: ['ignore', 'pipe', 'ignore']
		}).trim();
		if (/^[a-f0-9]{7}$/.test(out)) return out;
	} catch {
		// git missing or not a repo — fall through to placeholder
	}
	return '0000000';
}

function resolveBackend(input: string | undefined): Backend {
	if (input === 'native') return 'native';
	return 'js';
}

function computeTotals(grammars: BackendBaseline['grammars']): BackendBaseline['totals'] {
	let pass = 0;
	let total = 0;
	for (const g of GRAMMARS) {
		const entry = grammars[g];
		// RoundtripResult extends ValidatorResult, so this iteration is
		// type-correct over the union of validator shapes.
		const validators: readonly ValidatorResult[] = [
			entry.validators.from,
			entry.validators.coverage,
			entry.validators.roundtrip,
			entry.validators.factoryRoundtrip
		];
		for (const v of validators) {
			pass += v.pass;
			total += v.total;
		}
		pass += entry.parityFixtures.pass;
		total += entry.parityFixtures.total;
	}
	return { pass, fail: total - pass, total };
}

async function collectGrammarEntry(grammar: Grammar, backend: Backend): Promise<GrammarEntry> {
	const [validators, parityFixtures] = await Promise.all([
		collectValidatorsForGrammar(grammar, backend),
		collectParityFixtures(grammar, backend)
	]);
	return { validators, parityFixtures };
}

export async function collectBaseline(backendInput?: string): Promise<BackendBaseline> {
	const backend = resolveBackend(backendInput);
	const commit = shortSha();

	// Per-grammar sequential execution: each grammar pulls its own
	// tree-sitter language + corpus into memory, and the native-engine
	// module is cached per-grammar in `validate/common.ts`. Running
	// them sequentially keeps memory bounded and the order of
	// diagnostic logs (warnings from inferPolymorphVariant et al.)
	// stable across runs — material for the determinism guarantee.
	const tuples: [Grammar, GrammarEntry][] = [];
	for (const g of GRAMMARS) {
		tuples.push([g, await collectGrammarEntry(g, backend)]);
	}
	// The cast remains because TS can't narrow Object.fromEntries over a
	// tuple union to the exact `Record<Grammar, GrammarEntry>` shape, but
	// it's now over a proven-complete object — every Grammar key is
	// present by construction (loop iterates the full GRAMMARS list).
	const grammars = Object.fromEntries(tuples) as BackendBaseline['grammars'];

	return {
		backend,
		commit,
		grammars,
		totals: computeTotals(grammars)
	};
}

// ---------------------------------------------------------------------------
// Deterministic serialisation
// ---------------------------------------------------------------------------

/**
 * Recursively rebuild an object with keys in sorted order. Arrays
 * stay in their existing order — order in arrays is meaningful (e.g.
 * `failingByKind`'s value arrays are fixture-file declaration order).
 *
 * Objects identified as plain objects (Object.getPrototypeOf === null
 * or Object.prototype) get their keys sorted. Anything else (Date,
 * regexp, etc.) returns as-is. We don't expect non-plain objects in
 * the BackendBaseline tree.
 */
function sortKeysDeep(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sortKeysDeep);
	if (value !== null && typeof value === 'object') {
		const proto = Object.getPrototypeOf(value);
		if (proto === Object.prototype || proto === null) {
			const out: Record<string, unknown> = {};
			for (const k of Object.keys(value as object).sort()) {
				out[k] = sortKeysDeep((value as Record<string, unknown>)[k]);
			}
			return out;
		}
	}
	return value;
}

export function serialiseBaseline(baseline: BackendBaseline): string {
	const sorted = sortKeysDeep(baseline);
	return `${JSON.stringify(sorted, null, 4)}\n`;
}

// ---------------------------------------------------------------------------
// CLI entry
// ---------------------------------------------------------------------------

const isCli = (() => {
	if (process.argv[1] == null) return false;
	try {
		const argvUrl = pathToFileURL(process.argv[1]).href;
		return argvUrl === import.meta.url;
	} catch {
		return false;
	}
})();

export async function run(_argv: string[]): Promise<number> {
	const metricsBackend: 'ts' | 'native' = process.env.SITTIR_BACKEND === 'native' ? 'native' : 'ts';
	const baseline = await collectBaseline(process.env.SITTIR_BACKEND);
	process.stdout.write(serialiseBaseline(baseline));

	// Emit metrics file when SITTIR_METRICS=1 is set. The import is
	// deferred so the hot path stays free of the `os` module load.
	if (process.env['SITTIR_METRICS'] === '1') {
		const { dumpMetrics } = await import('@sittir/common');
		dumpMetrics(metricsBackend);
	}
	return 0;
}

if (isCli) {
	process.exit(await run(process.argv.slice(2)));
}
