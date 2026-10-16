import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { BINDINGS_FILE } from '../../bindings/facts.ts';
import { REGENERATE_BINDINGS_COMMAND, StaleBindingsError } from '../../bindings/hash.ts';
import { BINDINGS_MODULE, GRAMMAR_ENTRY, grammarPackage, layerPath, topLayerPath } from '../../grammars.ts';
import { compileGrammar } from '../compile.ts';
import { evaluate } from '../evaluate.ts';
import { NO_FILE_TYPES } from '../upstream-file-types.ts';
import { writeSittirGrammarPackage } from './_sittir-grammar.ts';

const evaluations = vi.hoisted(() => ({ count: 0 }));

vi.mock('../evaluate-package.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../evaluate-package.ts')>();
	return {
		...actual,
		evaluatePackage: (...args: Parameters<typeof actual.evaluatePackage>) => {
			evaluations.count++;
			return actual.evaluatePackage(...args);
		}
	};
});

let dir: string;
let baseModule: string;

beforeAll(() => {
	dir = mkdtempSync(join(tmpdir(), 'layer-selection-'));
	baseModule = join(dir, 'base.mjs');
	writeFileSync(baseModule, "export default grammar({ name: 'layered', rules: { source_file: $ => repeat($.item), item: _ => /[a-z]+/ } });\n");
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

function fixturePackage(): string {
	const pkg = mkdtempSync(join(dir, 'pkg-'));
	writeSittirGrammarPackage(pkg, baseModule, 'layered');
	return pkg;
}

describe('the layer files', () => {
	it('name the generated layer as the top where a package has one, and layer 1 otherwise', () => {
		const rust = grammarPackage('rust');
		const scm = grammarPackage('scm');
		expect(topLayerPath(rust)).toBe(join(rust.dir, BINDINGS_MODULE));
		expect(topLayerPath(scm)).toBe(join(scm.dir, GRAMMAR_ENTRY));
		expect(layerPath(rust, 'sittir')).toBe(join(rust.dir, GRAMMAR_ENTRY));
		expect(layerPath(rust, 'top')).toBe(topLayerPath(rust));
		expect(layerPath(scm, 'top')).toBe(layerPath(scm, 'sittir'));
	});

	it('evaluate layer 1 without importing the generated layer beside it', async () => {
		const pkg = fixturePackage();
		writeFileSync(join(pkg, BINDINGS_MODULE), "throw new Error('the generated layer was imported');\n");
		await expect(evaluate(layerPath({ dir: pkg }, 'sittir'), NO_FILE_TYPES)).resolves.toMatchObject({ name: 'layered' });
		await expect(evaluate(layerPath({ dir: pkg }, 'top'), NO_FILE_TYPES)).rejects.toThrow('the generated layer was imported');
	}, 60_000);
});

describe('compile', () => {
	const compileFixture = (pkg: string) => compileGrammar({ package: { name: 'layered', dir: pkg, stable: false, displayName: undefined } });

	function layeredPackage(module: string): string {
		const pkg = fixturePackage();
		writeFileSync(join(pkg, BINDINGS_FILE), '(item) @expression\n');
		writeFileSync(join(pkg, BINDINGS_MODULE), module);
		return pkg;
	}

	it('reports a stale generated layer with the regenerate command, before it evaluates either layer', async () => {
		evaluations.count = 0;
		const pkg = layeredPackage(`export const hash = "stale";\nthrow new Error('the stale layer was evaluated');\n`);
		await expect(compileFixture(pkg)).rejects.toThrow(StaleBindingsError);
		await expect(compileFixture(pkg)).rejects.toThrow(REGENERATE_BINDINGS_COMMAND);
		expect(evaluations.count).toBe(0);
	}, 60_000);

	it('reports a generated layer that exports no hash as stale', async () => {
		evaluations.count = 0;
		const pkg = layeredPackage('export const renames = {};\n');
		await expect(compileFixture(pkg)).rejects.toThrow(/bindings\.scm exists but no grammar\.bindings\.ts carries its grammar bindings/);
		expect(evaluations.count).toBe(0);
	}, 60_000);
});
