type ToolRunner = (argv: string[]) => Promise<number>;

/**
 * Registry of tool names → relative module specifiers.
 * Stored as strings (not literal import() calls) so TypeScript does not
 * attempt to statically resolve modules that do not exist yet in Task 1.
 * The paths are resolved at runtime by `runTool`.
 */
const TOOLS: Record<string, string> = {
	// Probing
	'probe-kind': './probe/kind.js',
	'probe-stages': './probe/stages.js',
	'probe-parity': './probe/parity.js',
	// Profiling
	profile: './profile/failures.js',
	bench: './profile/bench.js',
	// Validation
	counts: './validate/counts.js',
	'diff-failures': './validate/diff.js',
	'check-baseline': './validate/baseline.js',
	'check-perf': './validate/perf.js',
	// Discovery
	'list-kinds': './discover/list-kinds.js',
	classify: './discover/classify.js',
	'field-provenance': './discover/provenance.js',
	// Inspection
	'inspect-type': './inspect/type.js',
	'inspect-refs': './inspect/refs.js',
	'compare-overrides': './inspect/overrides.js',
	// Exercise
	walk: './exercise/walk.js',
	exercise: './exercise/roundtrip.js',
};

/** All registered tool names. */
export const TOOL_NAMES: ReadonlySet<string> = new Set(Object.keys(TOOLS));

/**
 * Load and invoke a tool module by its runtime specifier.
 * `import(specifier)` with a non-literal string returns `Promise<any>`;
 * the typed variable annotation is the cross-boundary type contract.
 */
async function runTool(specifier: string, argv: string[]): Promise<number> {
	// Non-literal string import: TypeScript resolves to Promise<any> at compile
	// time, so no cast is required — any is assignable to the annotated type.
	const mod: { run: ToolRunner } = await import(specifier);
	return mod.run(argv);
}

/** Dispatch a tool subcommand from CLI argv (excluding `node` and script path). */
export async function dispatch(argv: string[]): Promise<number> {
	const subcommand = argv[0];
	if (subcommand === undefined || subcommand === '--help') {
		printHelp();
		return 0;
	}
	const specifier = TOOLS[subcommand];
	if (specifier === undefined) {
		process.stderr.write(
			`Unknown tool: ${subcommand}\nRun with --help to see available tools.\n`,
		);
		return 1;
	}
	return runTool(specifier, argv.slice(1));
}

function printHelp(): void {
	const lines = [
		'sittir tools — developer diagnostics',
		'',
		'Usage: sittir <tool> [options]',
		'',
		'Probing:',
		'  probe-kind        parse → read → render → reparse diagnostics',
		'  probe-stages      dump rule shape at every compiler phase',
		'  probe-parity      template coverage for a target kind',
		'',
		'Profiling:',
		'  profile           unified validator failure aggregation',
		'  bench             native vs JS render benchmark',
		'',
		'Validation:',
		'  counts            per-grammar validator pass/total',
		'  diff-failures     per-kind validator failures',
		'  check-baseline    baseline regression gate',
		'  check-perf        native perf regression gate',
		'',
		'Discovery:',
		'  list-kinds        list groups, unaliased, phantom kinds',
		'  classify          kind classification through compiler phases',
		'  field-provenance  field source tracking (override/enriched/grammar)',
		'',
		'Inspection:',
		'  inspect-type      Loose type widening verification',
		'  inspect-refs      symbol reference dump',
		'  compare-overrides override key diffs',
		'',
		'Exercise:',
		'  walk              wrapped-node traversal + render',
		'  exercise          round-trip exercise harness',
	];
	process.stdout.write(lines.join('\n') + '\n');
}
