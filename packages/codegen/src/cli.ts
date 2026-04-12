#!/usr/bin/env node
/**
 * CLI entry point for sittir codegen.
 *
 * Usage:
 *   sittir --grammar rust --all --output src/
 *   sittir --grammar rust --nodes struct_item,function_item --output src/
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { validateTemplates, formatValidationReport } from './validate-templates.ts';
import { validateRoundTrip, formatRoundTripReport } from './validate-roundtrip.ts';
import { validateFactoryRoundTrip, formatFactoryRoundTripReport } from './validate-factory-roundtrip.ts';
import { validateFrom, formatFromReport } from './validate-from.ts';
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

// Write tests
const testsDir = cliArgs.testsDir ?? join(dirname(outDir), 'tests');
writeFile(join(testsDir, 'nodes.test.ts'), result.tests);

// Write type-level tests
writeFile(join(outDir, 'type-test.ts'), result.typeTests);

// Write vitest config
writeFile(join(dirname(outDir), 'vitest.config.ts'), result.config);

// --- Post-generation validation ---
const validation = validateTemplates(config.grammar, result.templatesYaml);
console.log('');
console.log(formatValidationReport(validation));

if (validation.errors.length > 0) {
	console.error(`\n${validation.errors.length} validation error(s) — see above.`);
}

// --- Round-trip validation (optional, requires web-tree-sitter) ---
if (cliArgs.roundtrip) {
	console.log('\nRunning round-trip validation...');
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
	}
}

console.log(`
Done! Generated:
  templates.yaml, grammar.ts, types.ts, factories.ts, utils.ts, from.ts, consts.ts, index.ts
  vitest.config.ts
`);
