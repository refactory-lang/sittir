import { beforeEach, describe, expect, it, vi } from 'vitest';
import { compileGrammar } from '../../compiler/compile.ts';
import { evaluate } from '../../dsl/evaluate.ts';
import { evaluatePackage } from '../../dsl/evaluate-package.ts';
import { grammarPackage } from '../../grammars.ts';
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

beforeEach(() => {
	vi.clearAllMocks();
});

describe('a package whose grammar bindings are stale', () => {
	it('is refused by the compile before it is evaluated', async () => {
		await expect(compileGrammar({ package: rust })).rejects.toThrow(StaleBindingsError);
		expect(evaluate).not.toHaveBeenCalled();
	});

	it('is evaluated by an unbound compile, which does not check', async () => {
		await expect(compileGrammar({ package: rust, evaluation: { unbound: true } })).rejects.toBe(reached);
		expect(assertBindingsFresh).not.toHaveBeenCalled();
	});

	it('is evaluated by a package evaluation, which the inventory and the stage tools read', async () => {
		await expect(evaluatePackage(rust)).rejects.toBe(reached);
		expect(assertBindingsFresh).not.toHaveBeenCalled();
	});
});
