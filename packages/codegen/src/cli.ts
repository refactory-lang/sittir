#!/usr/bin/env node
/**
 * CLI entry point for sittir codegen.
 *
 * Usage:
 *   sittir --grammar rust --all --output src/
 *   sittir --grammar rust --nodes struct_item,function_item --output src/
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { generate } from './index.ts';
import { resolveFileNames } from './naming.ts';
import type { CodegenConfig } from './index.ts';

interface CliArgs {
	grammar?: string;
	nodes?: string[];
	outputDir?: string;
	all?: boolean;
}

function parseArgs(args: string[]): CliArgs {
	const config: CliArgs = {};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		const next = args[i + 1];

		switch (arg) {
			case '--grammar':
				config.grammar = next;
				i++;
				break;
			case '--nodes':
				config.nodes = next?.split(',') ?? [];
				i++;
				break;
			case '--output':
				config.outputDir = next;
				i++;
				break;
			case '--all':
				config.all = true;
				break;
			case '--help':
				console.log(`
sittir — Generate typed IR builders from tree-sitter grammars

Usage:
  sittir --grammar <lang> --all --output <dir>
  sittir --grammar <lang> --nodes <kind1,kind2,...> --output <dir>

Options:
  --grammar    Grammar language (e.g., rust, typescript, python)
  --nodes      Comma-separated list of node kinds to generate builders for
  --all        Auto-discover all node kinds from the grammar
  --output     Output directory for generated files (e.g., src/)
  --help       Show this help message
`);
				process.exit(0);
				break;
			default:
				console.error(`Unknown argument: ${arg}`);
				process.exit(1);
		}
	}

	return config;
}

function writeFile(path: string, content: string): void {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, content, 'utf-8');
	console.log(`  wrote ${path}`);
}

const cliArgs = parseArgs(process.argv.slice(2));

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
const result = generate(config);

const outDir = cliArgs.outputDir;
const nodesDir = join(outDir, 'nodes');

// Write source files
writeFile(join(outDir, 'grammar.ts'), result.grammar);
writeFile(join(outDir, 'types.ts'), result.types);
writeFile(join(outDir, 'builder.ts'), result.builder);
writeFile(join(outDir, 'consts.ts'), result.consts);
writeFile(join(outDir, 'index.ts'), result.index);

// Write node builders
const nodeKinds = [...result.builders.keys()];
const fileNames = resolveFileNames(nodeKinds);
for (const [kind, source] of result.builders) {
	const fileName = fileNames.get(kind)!;
	writeFile(join(nodesDir, `${fileName}.ts`), source);
}

// Write test files
const testsDir = join(dirname(outDir), 'tests');
for (const [kind, source] of result.tests) {
	const fileName = fileNames.get(kind)!;
	writeFile(join(testsDir, `${fileName}.test.ts`), source);
}

// Write vitest config
writeFile(join(dirname(outDir), 'vitest.config.ts'), result.config);

console.log(`
Done! Generated:
  ${result.builders.size} node builders (self-contained with render logic)
  ${result.tests.size} test scaffolds
  grammar.ts, types.ts, builder.ts, consts.ts, index.ts
  vitest.config.ts
`);
