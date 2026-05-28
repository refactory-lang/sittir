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
import { type Grammar } from './run.ts';
import {
	runCountsCli,
	runProbeFactoryCli,
	runHistoryCli,
	runTraceRtCli,
	resolveBackends,
	ALL_CLI_BACKENDS,
	type CliBackend,
} from './commands.ts';

function makeBackendOption(): Option {
	return new Option(
		'-b, --backend <backend>',
		'Validation backend: native, js, or all',
	).choices([...ALL_CLI_BACKENDS]).default('native');
}

function makeRecursiveOption(): Option {
	return new Option('-r, --recursive', 'Use recursive deep-read RT instead of shallow RT').default(false);
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
		.argument('[grammars...]', 'Grammars to validate (rust, typescript, python); defaults to all')
		.action(async (grammars: string[], options: { backend: CliBackend }) =>
			runCountsCli(grammars, options.backend));

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
