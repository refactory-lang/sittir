import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { grammarPackage, type GrammarPackage } from '@sittir/codegen/grammars';
import { transpileOverrides } from '../../codegen/src/transpile/transpile-overrides.ts';
import { runTreeSitterGenerate } from '../../codegen/src/run-codegen.ts';
import { conflictResolutionsPath, ensureConflictResolutions } from '../../codegen/src/transpile/conflict-resolutions-file.ts';
import type { ConflictResolutionsFile } from '../../codegen/src/dsl/conflict-resolutions.ts';
import { loadPackageIdTables } from '../../codegen/src/compiler/generated-metadata.ts';
import { compileGrammar } from '../../codegen/src/compiler/compile.ts';
import { evaluatePackage } from '../../codegen/src/compiler/evaluate-package.ts';
import { packageEntryPath } from '../../codegen/src/compiler/resolve-grammar.ts';
import { GrammarDiagnosticError } from '../../codegen/src/compiler/diagnostics/grammar-diagnostics.ts';
import { generate } from '../../codegen/src/compiler/generate.ts';
import type { GeneratedIdTables } from '../../codegen/src/dsl/symbol-table.ts';
import type { GrammarDiagnostic } from '../../codegen/src/types/diagnostics.ts';
import { grammarPackageFiles, type GrammarTemplateVars } from '../src/bootstrap/templates.ts';

const codegenRequire = createRequire(resolve(__dirname, '../../codegen/package.json'));

const templateVars = (name: string): GrammarTemplateVars => ({
	name,
	Name: name.toUpperCase(),
	upstreamDependency: `tree-sitter-${name}`,
	upstreamRange: '*'
});

function entrySource(name: string, floors: Readonly<Record<string, readonly string[]>>): string {
	const template = grammarPackageFiles(templateVars(name)).find((file) => file.path === 'grammar.sittir.ts')!.contents;
	return template
		.replace(`'tree-sitter-${name}/grammar.js'`, JSON.stringify(codegenRequire.resolve(`tree-sitter-${name}/grammar.js`)))
		.replace("'../codegen/src/dsl/index.ts'", JSON.stringify(resolve(__dirname, '../../codegen/src/dsl/index.ts')))
		.replace(`name: '${name}'`, `name: '${name}',\n\texpectDiagnostics: ${JSON.stringify(floors)}`);
}

function writePackage(dir: string, name: string): GrammarPackage {
	mkdirSync(join(dir, 'node_modules'), { recursive: true });
	for (const file of grammarPackageFiles(templateVars(name))) {
		if (file.path !== 'grammar.sittir.ts') writeFileSync(join(dir, file.path), file.contents);
	}
	symlinkSync(dirname(codegenRequire.resolve(`tree-sitter-${name}/package.json`)), join(dir, 'node_modules', `tree-sitter-${name}`), 'dir');
	const pkg = grammarPackage(name, dir);
	writeFileSync(packageEntryPath(pkg), entrySource(name, {}));
	ensureConflictResolutions(pkg);
	return pkg;
}

function floorsOf(blocked: readonly GrammarDiagnostic[]): Record<string, string[]> {
	const floors: Record<string, string[]> = {};
	for (const record of blocked) {
		expect(record.ownerKind, `${record.code} has no owner to floor`).toBeDefined();
		floors[record.code] = [...new Set([...(floors[record.code] ?? []), record.ownerKind!])].sort();
	}
	return floors;
}

async function blockedRecords(pkg: GrammarPackage, generatedIdTables: GeneratedIdTables | undefined): Promise<readonly GrammarDiagnostic[]> {
	return compileGrammar({ package: pkg, generatedIdTables }).then(
		() => [],
		(error: unknown) => {
			if (!(error instanceof GrammarDiagnosticError)) throw error;
			return error.diagnostics;
		}
	);
}

async function bootstrapEndToEnd(name: string): Promise<{ floors: Record<string, string[]>; typesSource: string }> {
	const root = mkdtempSync(join(tmpdir(), `sittir-bootstrap-${name}-`));
	try {
		writeFileSync(join(root, 'tsconfig.json'), JSON.stringify({ extends: resolve(__dirname, '../../../tsconfig.json') }));
		const pkg = writePackage(join(root, 'packages', name), name);
		transpileOverrides({ package: pkg });
		await runTreeSitterGenerate(pkg);
		const generatedIdTables = await loadPackageIdTables(pkg);
		expect(generatedIdTables).toBeDefined();

		const probe = writePackage(join(root, 'packages', 'probe'), name);
		const floors = floorsOf(await blockedRecords(probe, generatedIdTables));
		writeFileSync(packageEntryPath(pkg), entrySource(name, floors));

		const compilation = await compileGrammar({ package: pkg, generatedIdTables });
		const derived = JSON.parse(readFileSync(conflictResolutionsPath(pkg), 'utf8')) as ConflictResolutionsFile;
		expect(derived.resolutions.length).toBeGreaterThan(0);
		expect((await evaluatePackage(pkg)).conflicts).toEqual(derived.resolutions.map((entry) => entry.resolution.symbols));
		const files = await generate({ grammar: name, outputDir: join(root, 'out'), compilation });
		return { floors, typesSource: files.types };
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

describe('bootstrapping an upstream grammar runs the whole pipeline once every blocking record is floored', () => {
	it('tree-sitter-c emits with no throw after the gate', async () => {
		const { typesSource } = await bootstrapEndToEnd('c');
		expect(typesSource).toContain('export');
	}, 600_000);

	it('tree-sitter-go emits with no throw after the gate, its list separator shapes floored and no flank floored for a headless repeat', async () => {
		const { floors, typesSource } = await bootstrapEndToEnd('go');
		expect(floors['separator-pattern']).toBeUndefined();
		expect(floors['separator-default-undeclared']).toHaveLength(7);
		expect(
			floors['field-optional-delimiter'],
			"special_argument_list's repeat has no uniform head and is a plain repeat: not a separated list, so no list flank to floor"
		).toBeUndefined();
		expect(typesSource).toContain('export');
	}, 600_000);
});
