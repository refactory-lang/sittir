import { mkdtempSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { compileGrammar } from '../../compiler/compile.ts';
import { evaluate } from '../../dsl/evaluate.ts';
import { evaluatePackage } from '../../dsl/evaluate-package.ts';
import { grammarPackage, type GrammarPackage } from '../../grammars.ts';
import { StaleBindingsError, assertBindingsFresh } from '../hash.ts';

const reached = vi.hoisted(() => new Error('reached the evaluation'));

vi.mock('../hash.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../hash.ts')>();
	return {
		...actual,
		assertBindingsFresh: vi.fn((grammar: string) => {
			throw new actual.StaleBindingsError(`${grammar}: grammar.bindings.ts is stale`);
		})
	};
});
vi.mock('../../dsl/evaluate.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../../dsl/evaluate.ts')>();
	return {
		...actual,
		evaluate: vi.fn(async () => {
			throw reached;
		})
	};
});

const rust = grammarPackage('rust');

function packageWithoutGrammarEntry(): GrammarPackage {
	const dir = mkdtempSync(join(tmpdir(), 'package-without-grammar-entry-'));
	symlinkSync(join(rust.dir, 'node_modules'), join(dir, 'node_modules'));
	return { ...rust, dir };
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('a package whose grammar bindings are stale', () => {
	it('is refused by the compile before it is evaluated', async () => {
		await expect(compileGrammar({ package: rust })).rejects.toThrow(StaleBindingsError);
		expect(evaluate).not.toHaveBeenCalled();
	});

	it.each([{ unbound: true }, { base: true }])('is evaluated by a compile that reads no grammar bindings (%o)', async (evaluation) => {
		await expect(compileGrammar({ package: rust, evaluation })).rejects.toBe(reached);
		expect(assertBindingsFresh).not.toHaveBeenCalled();
	});

	it('is evaluated by the compile of a package with no grammar.sittir.ts, which evaluates the upstream grammar alone', async () => {
		await expect(compileGrammar({ package: packageWithoutGrammarEntry() })).rejects.toBe(reached);
		expect(assertBindingsFresh).not.toHaveBeenCalled();
	});

	it('is evaluated by a package evaluation, which the inventory and the stage tools read', async () => {
		await expect(evaluatePackage(rust)).rejects.toBe(reached);
		expect(assertBindingsFresh).not.toHaveBeenCalled();
	});
});
