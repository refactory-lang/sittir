import { afterAll, describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const py = await createEngine(python);
const verifying = await createEngine(python, { verifyStructure: 'runtime' });
afterAll(() => py.dispose());

describe('nonempty loose rest arguments', () => {
	it('requires a global name for rest and array calls', () => {
		expect(() => Reflect.apply(verifying.build.globalStatement, undefined, [])).toThrow(/at least one/);
		expect(() => Reflect.apply(verifying.build.globalStatement, undefined, [[]])).toThrow(/at least one/);
	});

	it('accepts scalar and readonly array input with the same result', () => {
		const names = ['pkg', 'member'] as const;
		expect(py.build.globalStatement(...names).$render()).toBe('global pkg, member');
		expect(py.build.globalStatement(names).$render()).toBe('global pkg, member');
		expect(names).toEqual(['pkg', 'member']);
	});

	it('preserves valid empty roots and lists', () => {
		expect(py.build.module().$render()).toBe('\n');
		expect(py.build.list().$render()).toBe('[]');
	});
});
