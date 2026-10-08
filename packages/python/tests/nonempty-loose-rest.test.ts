import { afterAll, describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const py = await createEngine(python);
afterAll(() => py.dispose());

describe('nonempty loose rest arguments', () => {
	it('requires a dotted-name component for rest and array calls', () => {
		expect(() => Reflect.apply(py.build.dottedName, undefined, [])).toThrow(/at least one/);
		expect(() => Reflect.apply(py.build.dottedName, undefined, [[]])).toThrow(/at least one/);
	});

	it('accepts scalar and readonly array input with the same result', () => {
		const names = ['pkg', 'member'] as const;
		expect(py.build.dottedName(...names).$render()).toBe('pkg.member');
		expect(py.build.dottedName(names).$render()).toBe('pkg.member');
		expect(names).toEqual(['pkg', 'member']);
	});

	it('preserves valid empty roots and lists', () => {
		expect(py.build.module().$render()).toBe('\n');
		expect(py.build.list().$render()).toBe('[]');
	});
});
