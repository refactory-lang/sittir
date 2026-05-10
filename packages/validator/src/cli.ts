/**
 * Single canonical CLI entry point for @sittir/validator.
 *
 * Subcommands:
 *   counts [grammar...]         — per-grammar raw pass/total counts for all four validators
 *   probe-factory [grammar...]  — factory-render-parse error bucketing (top-8 buckets)
 *   history [n]                 — print the last N validation history entries (default 10)
 *
 * Usage:
 *   npx tsx packages/validator/src/cli.ts counts --backend native
 *   npx tsx packages/validator/src/cli.ts counts --backend native --recursive
 *   npx tsx packages/validator/src/cli.ts counts --backend js rust typescript
 *   npx tsx packages/validator/src/cli.ts probe-factory --backend all
 *   npx tsx packages/validator/src/cli.ts history
 *   npx tsx packages/validator/src/cli.ts history 20
 */

import { fileURLToPath } from 'node:url';
import { Command, Option } from 'commander';
import {
	runFrom,
	runRt,
	runCoverage,
	runFactory,
	defaultTemplatesPath,
	type Grammar,
	type Backend,
} from './run.ts';
import { readHistory } from './history.ts';
import type { ReadRenderParseFailure } from '@sittir/codegen/validate/read-render-parse';

const ALL_GRAMMARS: Grammar[] = ['rust', 'typescript', 'python'];
const ALL_CLI_BACKENDS = ['native', 'js', 'all'] as const;
type CliBackend = (typeof ALL_CLI_BACKENDS)[number];
type ProbeTraceFn = (
	grammar: string,
	source: string,
	opts?: { range?: { start: number; end: number } }
) => Promise<unknown>;
type ValidateReadRenderParseFn = (
	grammar: string,
	templatesPath: string,
	options: {
		backend?: 'native' | 'typescript';
		recursive?: boolean;
		stopOnFirstFailure?: boolean;
		onFailure?: (failure: ReadRenderParseFailure) => void;
	}
) => Promise<unknown>;

/** Parse grammar args; unknown names are silently dropped. Defaults to all three grammars. */
function resolveGrammars(args: string[]): Grammar[] {
	const valid = args.filter((a): a is Grammar => ALL_GRAMMARS.includes(a as Grammar));
	return valid.length ? valid : ALL_GRAMMARS;
}

function resolveBackends(mode: CliBackend): Backend[] {
	switch (mode) {
		case 'native':
			return ['native'];
		case 'js':
			return ['typescript'];
		case 'all':
			return ['native', 'typescript'];
	}
}

function formatBackendLabel(backend: Backend): 'native' | 'js' {
	return backend === 'typescript' ? 'js' : 'native';
}

function makeBackendOption(): Option {
	return new Option(
		'-b, --backend <backend>',
		'Validation backend: native, js, or all',
	).choices([...ALL_CLI_BACKENDS]).default('native');
}

function makeRecursiveOption(): Option {
	return new Option('-r, --recursive', 'Use recursive deep-read RT instead of shallow RT').default(false);
}

/** Run all four validators for one grammar/backend and return a formatted counts string. */
async function grammarCounts(
	grammar: Grammar,
	backend: Backend,
	options: { recursive?: boolean } = {},
): Promise<string> {
	const tp = defaultTemplatesPath(grammar);
	const [from, rt, cov, fac] = await Promise.all([
		runFrom(grammar, backend),
		runRt(grammar, tp, backend, { recursive: options.recursive }),
		Promise.resolve(runCoverage(grammar, tp)),
		runFactory(grammar, tp, backend),
	]);
	return [
		`${grammar}/${formatBackendLabel(backend)}:`,
		`  fromPass=${from.pass}    fromTotal=${from.total}`,
		`  covPass=${cov.pass}    covTotal=${cov.total}`,
		`  rtPass=${rt.pass}    rtTotal=${rt.total}    rtAstMatchPass=${rt.astMatchPass}`,
		`  factoryPass=${fac.pass}    factoryTotal=${fac.total}    factoryAstMatchPass=${fac.astMatchPass}`,
	].join('\n');
}

/** Print top-8 error buckets from factory-render-parse for one grammar. */
async function grammarProbeFactory(grammar: Grammar, backend: Backend): Promise<void> {
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
	options: { recursive?: boolean } = {},
): Promise<void> {
	const grammars = resolveGrammars(args);
	for (const backend of resolveBackends(backendMode)) {
		for (const grammar of grammars) {
			try {
				console.log(await grammarCounts(grammar, backend, options));
			} catch (e) {
				console.log(`${grammar}/${formatBackendLabel(backend)}: ERROR ${(e as Error).message}`);
			}
		}
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
				`  rt=${r.rtPass}/${r.rtTotal}` +
				`  fac=${r.factoryPass}/${r.factoryTotal}`,
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

function loadProbeTrace(): ProbeTraceFn {
	const specifier = new URL('../../codegen/src/scripts/probe-kind.ts', import.meta.url).href;
	let cached: ProbeTraceFn | undefined;
	return ((grammar, source, opts) => {
		if (cached) return cached(grammar, source, opts);
		return import(specifier).then((mod) => {
			cached = (mod as { probeTrace: ProbeTraceFn }).probeTrace;
			return cached(grammar, source, opts);
		});
	}) satisfies ProbeTraceFn;
}

function loadValidateReadRenderParse(): ValidateReadRenderParseFn {
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

// Main dispatch — only executed when this file is the direct entrypoint.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const program = new Command()
		.name('sittir-validator')
		.description('Validation utilities for sittir grammar packages')
		.addHelpCommand(true);

	program
		.command('counts')
		.description('Per-grammar raw pass/total counts for all four validators')
		.addOption(makeBackendOption())
		.addOption(makeRecursiveOption())
		.argument('[grammars...]', 'Grammars to validate (rust, typescript, python); defaults to all')
		.action(async (grammars: string[], options: { backend: CliBackend; recursive?: boolean }) =>
			runCountsCli(grammars, options.backend, { recursive: options.recursive }));

	program
		.command('probe-factory')
		.description('Factory-render-parse error bucketing (top-8 buckets)')
		.addOption(makeBackendOption())
		.argument('[grammars...]', 'Grammars to validate (rust, typescript, python); defaults to all')
		.action(async (grammars: string[], options: { backend: CliBackend }) =>
			runProbeFactoryCli(grammars, options.backend));

	program
		.command('history')
		.description('Print last N validation history entries')
		.argument('[n]', 'Number of entries to show', '10')
		.action((n: string) => runHistoryCli([n]));

	program
		.command('trace-rt')
		.description('Replay the first failing read-render-parse case as a rich trace')
		.addOption(makeBackendOption())
		.addOption(makeRecursiveOption())
		.argument('<grammar>', 'Grammar to trace (rust, typescript, python)')
		.action(async (grammar: Grammar, options: { backend: CliBackend; recursive?: boolean }) => {
			for (const backend of resolveBackends(options.backend)) {
				await runTraceRtCli(grammar, backend, { recursive: options.recursive });
			}
		});

	await program.parseAsync(process.argv);
}
