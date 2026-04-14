#!/usr/bin/env node
/**
 * CLI entry point for sittir codegen.
 *
 * Usage:
 *   sittir --grammar rust --all --output src/
 *   sittir --grammar rust --nodes struct_item,function_item --output src/
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { validateRoundTrip, formatRoundTripReport } from './validate-roundtrip.ts';
import { validateFactoryRoundTrip, formatFactoryRoundTripReport } from './validate-factory-roundtrip.ts';
import { validateFrom, formatFromReport } from './validate-from.ts';
import { validateRenderableFromNodeMap, formatRenderableReport } from './validate-renderable.ts';
import { validateReadNodeRoundTrip, formatReadNodeRoundTripReport } from './validate-readnode-roundtrip.ts';
import { join, dirname } from 'node:path';
import { generateV2 } from './compiler/generate.ts';

interface CodegenConfig {
	grammar: string;
	nodes?: string[];
	outputDir: string;
}

interface CliArgs {
	grammar?: string;
	nodes?: string[];
	outputDir?: string;
	all?: boolean;
	testsDir?: string;
	roundtrip?: boolean;
	help?: boolean;
	v2?: boolean;
}

function parseArgs(argv: string[]): CliArgs {
	const args: CliArgs = {};
	for (let i = 2; i < argv.length; i++) {
		const arg = argv[i];
		switch (arg) {
			case '--grammar':
			case '-g':
				args.grammar = argv[++i];
				break;
			case '--nodes':
			case '-n':
				args.nodes = argv[++i]?.split(',');
				break;
			case '--output':
			case '-o':
				args.outputDir = argv[++i];
				break;
			case '--all':
			case '-a':
				args.all = true;
				break;
			case '--tests-dir':
				args.testsDir = argv[++i];
				break;
			case '--roundtrip':
				args.roundtrip = true;
				break;
			case '--v2':
				args.v2 = true;
				break;
			case '--help':
			case '-h':
				args.help = true;
				break;
		}
	}
	return args;
}

function writeFile(path: string, content: string): void {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, content, 'utf8');
}

const cliArgs = parseArgs(process.argv);

if (cliArgs.help) {
	console.log(`
Usage: sittir --grammar <name> [--all | --nodes <kinds>] --output <dir>

Options:
  --grammar, -g    Grammar name (rust, typescript, python)
  --nodes, -n      Comma-separated node kinds to generate
  --all, -a        Generate for all branch node kinds
  --output, -o     Output directory for generated files
  --tests-dir      Output directory for test files (default: ../tests)
  --help, -h       Show this help
`);
	process.exit(0);
}

if (!cliArgs.grammar || !cliArgs.outputDir) {
	console.error('Missing required arguments: --grammar and --output. Use --help for usage.');
	process.exit(1);
}

if (!cliArgs.all && (!cliArgs.nodes || cliArgs.nodes.length === 0)) {
	console.error('Must provide --nodes or --all. Use --help for usage.');
	process.exit(1);
}

const config: CodegenConfig = {
	grammar: cliArgs.grammar!,
	nodes: cliArgs.all ? undefined : cliArgs.nodes,
	outputDir: cliArgs.outputDir!,
};

console.log(`Generating ${config.grammar} IR...`);
const result = await generateV2({ grammar: config.grammar, nodes: config.nodes, outputDir: config.outputDir });

const outDir = cliArgs.outputDir;

// Write source files
writeFile(join(outDir, 'grammar.ts'), result.grammar);
writeFile(join(outDir, 'types.ts'), result.types);
writeFile(join(outDir, 'factories.ts'), result.factories);
writeFile(join(outDir, 'wrap.ts'), result.wrap);
writeFile(join(outDir, 'utils.ts'), result.utils);
writeFile(join(outDir, 'from.ts'), result.from);
writeFile(join(outDir, 'ir.ts'), result.irNamespace);
writeFile(join(outDir, 'consts.ts'), result.consts);
writeFile(join(outDir, 'index.ts'), result.index);

// Write YAML templates to package root (one level up from src/)
writeFile(join(dirname(outDir), 'templates.yaml'), result.templatesYaml);

// Write node model
writeFile(join(outDir, 'node-model.json5'), result.nodeModel);

// Write suggested overrides log (T042f) next to overrides.ts at the
// package root. This is a documentation file — not runnable.
writeFile(join(dirname(outDir), 'overrides.suggested.ts'), result.suggested);

// Write tests
const testsDir = cliArgs.testsDir ?? join(dirname(outDir), 'tests');
writeFile(join(testsDir, 'nodes.test.ts'), result.tests);

// Write type-level tests
writeFile(join(outDir, 'type-test.ts'), result.typeTests);

// Write vitest config
writeFile(join(dirname(outDir), 'vitest.config.ts'), result.config);

// --- Renderability check: every named kind in node-types.json must be
// reachable by @sittir/core's render() function (supertype, leaf, or rule).
// Uses the NodeMap directly for a structural truth check.
const renderable = validateRenderableFromNodeMap(config.grammar, result.nodeMap);
console.log('');
console.log(formatRenderableReport(renderable));
if (renderable.missing.length > 0) {
	// Warning-only: these are typically anonymous / alias-target kinds that
	// never get rendered as top-level nodes (e.g. `empty_statement`,
	// `doc_comment`). If user code DOES call render() on them, it will
	// throw — but that's a real consumer bug, not a codegen failure.
	console.warn(
		`\n${renderable.missing.length} un-renderable kind(s) — render() will throw if called on these instances.`,
	);
}

// --- Round-trip validation (optional, requires web-tree-sitter) ---
if (cliArgs.roundtrip) {
	console.log('\nRunning round-trip validation...');

	// readNode round-trip (structural) — upstream of render/factory.
	// A regression here means readNode is losing content between
	// tree-sitter's parse tree and the NodeData shape, so every
	// downstream validator will mis-report.
	const rnResult = await validateReadNodeRoundTrip(config.grammar);
	console.log(formatReadNodeRoundTripReport(rnResult));

	const rtResult = await validateRoundTrip(config.grammar, result.templatesYaml);
	console.log(formatRoundTripReport(rtResult));

	// Factory round-trip (corpus → readNode → factory() → render → re-parse)
	const frtResult = await validateFactoryRoundTrip(config.grammar, result.templatesYaml);
	console.log(formatFactoryRoundTripReport(frtResult));

	// from() correctness (structural comparison: from() vs factory())
	const fromResult = await validateFrom(config.grammar, result.templatesYaml);
	console.log(formatFromReport(fromResult));

	const totalFail = rtResult.fail + frtResult.fail;
	if (totalFail > 0) {
		console.error(`\n${totalFail} round-trip failure(s) — see above.`);
		process.exitCode = 1;
	}
}

if (process.exitCode) {
	console.error(`\nFailed. Generated files were written, but validation reported errors.`);
} else {
	console.log(`
Done! Generated:
  templates.yaml, grammar.ts, types.ts, factories.ts, utils.ts, from.ts, consts.ts, index.ts
  vitest.config.ts
`);
}
