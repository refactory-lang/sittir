/**
 * Reusable command implementations for @sittir/validator.
 *
 * Extracted from cli.ts so that @sittir/cli (and other consumers) can import
 * the run*Cli entry points without pulling in the commander-entry side-effect block.
 */

import {
	runFrom,
	runRt,
	runCoverage,
	runFactory,
	defaultTemplatesPath,
	type Grammar,
	type Backend,
} from './run.ts';
import { appendHistory, commitHistory, readHistory, type ValidationRun } from './history.ts';
import { warnIfNativeBinaryStale } from './native-staleness.ts';
import type { ReadRenderParseFailure } from '@sittir/codegen/validate/read-render-parse';

export const ALL_GRAMMARS: Grammar[] = ['rust', 'typescript', 'python'];
export const ALL_CLI_BACKENDS = ['native', 'js', 'all'] as const;
export type CliBackend = (typeof ALL_CLI_BACKENDS)[number];
type ProbeTraceFn = (
	grammar: string,
	source: string,
	opts?: { range?: { start: number; end: number } }
) => Promise<unknown>;
type ValidateReadRenderParseFn = (
	grammar: string,
	templatesPath: string,
	options: {
		backend?: 'native' | 'js';
		recursive?: boolean;
		stopOnFirstFailure?: boolean;
		onFailure?: (failure: ReadRenderParseFailure) => void;
	}
) => Promise<unknown>;

/** Parse grammar args; unknown names are silently dropped. Defaults to all three grammars. */
export function resolveGrammars(args: string[]): Grammar[] {
	const valid = args.filter((a): a is Grammar => ALL_GRAMMARS.includes(a as Grammar));
	return valid.length ? valid : ALL_GRAMMARS;
}

export function resolveBackends(mode: CliBackend): Backend[] {
	switch (mode) {
		case 'native':
			return ['native'];
		case 'js':
			return ['js'];
		case 'all':
			return ['native', 'js'];
	}
}

export function formatBackendLabel(backend: Backend): 'native' | 'js' {
	return backend;
}

export interface GrammarCounts {
	readonly grammar: Grammar;
	readonly backend: Backend;
	readonly from: Awaited<ReturnType<typeof runFrom>>;
	readonly coverage: ReturnType<typeof runCoverage>;
	readonly readRenderParse: Awaited<ReturnType<typeof runRt>>;
	readonly readRenderParseShallow: Awaited<ReturnType<typeof runRt>>;
	readonly factoryRenderParse: Awaited<ReturnType<typeof runFactory>>;
}

export async function collectGrammarCounts(
	grammar: Grammar,
	backend: Backend,
): Promise<GrammarCounts> {
	const tp = defaultTemplatesPath(grammar);
	// Guard: a `.node` older than its templates means the binary wasn't rebuilt
	// after the last regen — native render will silently fall back to JS (FR-020),
	// so these counts would not be true native. Warn loudly rather than mislead.
	if (backend === 'native') warnIfNativeBinaryStale(grammar, tp);
	const [from, coverage, factoryRenderParse] = await Promise.all([
		runFrom(grammar, backend),
		runCoverage(grammar, tp),
		runFactory(grammar, tp, backend),
	]);
	// Native RT validation reuses a cached grammar engine per process, so run the
	// recursive and shallow passes sequentially to avoid cross-run interference.
	const readRenderParse = await runRt(grammar, tp, backend, { recursive: true });
	const readRenderParseShallow = await runRt(grammar, tp, backend, { recursive: false });
	return {
		grammar,
		backend,
		from,
		coverage,
		readRenderParse,
		readRenderParseShallow,
		factoryRenderParse,
	};
}

export function formatGrammarCounts(counts: GrammarCounts): string {
	const { grammar, backend, from, coverage, readRenderParse, readRenderParseShallow, factoryRenderParse } = counts;
	const lines = [
		`${grammar}/${formatBackendLabel(backend)}:`,
		`  fromPass=${from.pass}    fromTotal=${from.total}`,
		`  covPass=${coverage.pass}    covTotal=${coverage.total}`,
		`  read-render-parsePass=${readRenderParse.pass}    read-render-parseTotal=${readRenderParse.total}    read-render-parseAstMatchPass=${readRenderParse.astMatchPass}`,
		`  read-render-parse-shallowPass=${readRenderParseShallow.pass}    read-render-parse-shallowTotal=${readRenderParseShallow.total}    read-render-parse-shallowAstMatchPass=${readRenderParseShallow.astMatchPass}`,
		`  factory-render-parsePass=${factoryRenderParse.pass}    factory-render-parseTotal=${factoryRenderParse.total}    factory-render-parseAstMatchPass=${factoryRenderParse.astMatchPass}`,
	];
	const rtFails = formatFirstFailures(
		'read-render-parse',
		readRenderParse.errors.map((e) => ({ label: e.name, message: e.message })),
	);
	if (rtFails) lines.push(rtFails);
	const rtAstFails = formatFirstFailures(
		'read-render-parse-ast-mismatch',
		readRenderParse.astMismatches.map((m) => ({
			label: m.entry ? `${m.entry} (${m.kind})` : m.kind,
			message: m.message,
		})),
	);
	if (rtAstFails) lines.push(rtAstFails);
	const rtShallowFails = formatFirstFailures(
		'read-render-parse-shallow',
		readRenderParseShallow.errors.map((e) => ({ label: e.name, message: e.message })),
	);
	if (rtShallowFails) lines.push(rtShallowFails);
	const factoryFails = formatFirstFailures(
		'factory-render-parse',
		factoryRenderParse.errors.map((e) => ({ label: e.entry ? `${e.entry} (${e.kind})` : e.kind, message: e.message })),
	);
	if (factoryFails) lines.push(factoryFails);
	const fromFails = formatFirstFailures(
		'from',
		from.errors.map((e) => ({ label: e.kind, message: e.message })),
	);
	if (fromFails) lines.push(fromFails);
	return lines.join('\n');
}

export function formatFirstFailures(
	stage: string,
	failures: ReadonlyArray<{ label: string; message: string }>,
	max = process.env.SITTIR_VALIDATOR_MAX_FAILURES
		? Number(process.env.SITTIR_VALIDATOR_MAX_FAILURES)
		: 5,
): string | null {
	if (failures.length === 0) return null;
	const shown = failures.slice(0, max);
	const header = failures.length > max
		? `  ${stage} first failures (${max} of ${failures.length}):`
		: `  ${stage} failures (${failures.length}):`;
	const items = shown.map(({ label, message }) => {
		const oneLine = message.replace(/\s+/g, ' ').slice(0, 100);
		return `    ${JSON.stringify(label)} — ${oneLine}`;
	});
	return [header, ...items].join('\n');
}

export function toValidationRun(counts: GrammarCounts): ValidationRun {
	const { grammar, backend, from, coverage, readRenderParse, readRenderParseShallow, factoryRenderParse } = counts;
	return {
		ts: new Date().toISOString(),
		grammar,
		backend,
		fromPass: from.pass,
		fromTotal: from.total,
		covPass: coverage.pass,
		covTotal: coverage.total,
		readRenderParsePass: readRenderParse.pass,
		readRenderParseTotal: readRenderParse.total,
		readRenderParseAstMatchPass: readRenderParse.astMatchPass,
		readRenderParseShallowPass: readRenderParseShallow.pass,
		readRenderParseShallowTotal: readRenderParseShallow.total,
		readRenderParseShallowAstMatchPass: readRenderParseShallow.astMatchPass,
		factoryRenderParsePass: factoryRenderParse.pass,
		factoryRenderParseTotal: factoryRenderParse.total,
		factoryRenderParseAstMatchPass: factoryRenderParse.astMatchPass,
	};
}

/** Print top-8 error buckets from factory-render-parse for one grammar. */
export async function grammarProbeFactory(grammar: Grammar, backend: Backend): Promise<void> {
	const tp = defaultTemplatesPath(grammar);
	const r = await runFactory(grammar, tp, backend);
	console.log(
		`\n=== ${grammar}/${formatBackendLabel(backend)} === total=${r.total} pass=${r.pass} fail=${r.fail} skip=${r.skip} astMatch=${r.astMatchPass}`,
	);
	const buckets = new Map<string, Array<{ kind: string; msg: string }>>();
	for (const err of r.errors) {
		const key = (err.message.split(':')[0] ?? '').slice(0, 60);
		if (!buckets.has(key)) buckets.set(key, []);
		buckets.get(key)!.push({ kind: err.kind, msg: err.message.slice(0, 140) });
	}
	for (const [key, items] of [...buckets.entries()]
		.sort((a, b) => b[1].length - a[1].length)
		.slice(0, 8)) {
		const byKind = new Map<string, number>();
		for (const it of items) byKind.set(it.kind, (byKind.get(it.kind) ?? 0) + 1);
		console.log(`  [${items.length}] ${key}`);
		for (const [k, n] of [...byKind.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8))
			console.log(`     ${k}: ${n}`);
		console.log(`     sample: ${items[0]?.msg}`);
	}
}

/** Exported entry: counts subcommand — prints raw pass/total for all four validators. */
export async function runCountsCli(
	args: string[],
	backendMode: CliBackend = 'native',
	_options: { recursive?: boolean } = {},
): Promise<void> {
	const grammars = resolveGrammars(args);
	const recorded: string[] = [];
	for (const backend of resolveBackends(backendMode)) {
		for (const grammar of grammars) {
			try {
				const counts = await collectGrammarCounts(grammar, backend);
				appendHistory(toValidationRun(counts));
				recorded.push(`${grammar}/${formatBackendLabel(backend)}`);
				console.log(formatGrammarCounts(counts));
			} catch (e) {
				console.log(`${grammar}/${formatBackendLabel(backend)}: ERROR ${(e as Error).message}`);
			}
		}
	}
	// One commit per validation invocation covering every row just appended —
	// keeps history reliably captured without a commit per grammar. Best-effort
	// and self-guarding (see commitHistory).
	if (recorded.length > 0) {
		commitHistory(`chore(validator): record validation run (${recorded.join(', ')})`);
	}
}

/** Exported entry: probe-factory subcommand — error-bucket diagnostics for factory-render-parse. */
export async function runProbeFactoryCli(args: string[], backendMode: CliBackend = 'native'): Promise<void> {
	const grammars = resolveGrammars(args);
	for (const backend of resolveBackends(backendMode)) {
		for (const grammar of grammars) {
			try {
				await grammarProbeFactory(grammar, backend);
			} catch (e) {
				console.log(`${grammar}/${formatBackendLabel(backend)}: ERROR ${(e as Error).message}`);
			}
		}
	}
}

/** Exported entry: history subcommand — prints last N validation runs. */
export function runHistoryCli(args: string[]): void {
	const n = parseInt(args.find((a) => /^\d+$/.test(a)) ?? '10', 10);
	const runs = readHistory().slice(-n);
	if (runs.length === 0) {
		console.log('No validation history found.');
		return;
	}
	console.log(`Last ${runs.length} validation run(s):\n`);
	for (const r of runs) {
		console.log(
			`${r.ts}  ${r.grammar}/${r.backend}` +
				`  from=${r.fromPass}/${r.fromTotal}` +
				`  cov=${r.covPass}/${r.covTotal}` +
				`  read-render-parse=${r.readRenderParsePass}/${r.readRenderParseTotal}` +
				`  read-render-parse-shallow=${r.readRenderParseShallowPass}/${r.readRenderParseShallowTotal}` +
				`  factory-render-parse=${r.factoryRenderParsePass}/${r.factoryRenderParseTotal}`,
		);
	}
}

export async function runTraceRtCli(
	grammar: Grammar,
	backend: Backend,
	options: { recursive?: boolean } = {},
): Promise<void> {
	const templatesPath = defaultTemplatesPath(grammar);
	let failure: ReadRenderParseFailure | undefined;
	await loadValidateReadRenderParse()(grammar, templatesPath, {
		backend,
		recursive: options.recursive,
		stopOnFirstFailure: true,
		onFailure: (next) => {
			if (!failure) failure = next;
		},
	});
	if (!failure) {
		console.log(`${grammar}/${formatBackendLabel(backend)}: no RT failure found`);
		return;
	}
	const trace = await loadProbeTrace()(grammar, failure.entrySource, {
		range: failure.range,
	});
	console.log(JSON.stringify({
		failure,
		trace,
	}, null, 2));
}

export function loadProbeTrace(): ProbeTraceFn {
	const specifier = new URL('../../tools/src/probe/kind.ts', import.meta.url).href;
	let cached: ProbeTraceFn | undefined;
	return ((grammar, source, opts) => {
		if (cached) return cached(grammar, source, opts);
		return import(specifier).then((mod) => {
			cached = (mod as { probeTrace: ProbeTraceFn }).probeTrace;
			return cached(grammar, source, opts);
		});
	}) satisfies ProbeTraceFn;
}

export function loadValidateReadRenderParse(): ValidateReadRenderParseFn {
	const specifier = new URL('../../codegen/src/validate/read-render-parse.ts', import.meta.url).href;
	let cached: ValidateReadRenderParseFn | undefined;
	return ((grammar, templatesPath, options) => {
		if (cached) return cached(grammar, templatesPath, options);
		return import(specifier).then((mod) => {
			cached = (mod as { validateReadRenderParse: ValidateReadRenderParseFn }).validateReadRenderParse;
			return cached(grammar, templatesPath, options);
		});
	}) satisfies ValidateReadRenderParseFn;
}
