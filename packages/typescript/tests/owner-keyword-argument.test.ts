import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);
const verifying = await createEngine(typescript, { verifyStructure: 'runtime' });

describe('a strict builder with render options given its target\'s argument', () => {
	it('builds a relaxed name from its text, not from a keyword kind', () => {
		const node = ts.build.breakStatement.coerce('let');
		expect(node.$render()).toBe('break let;');
		expect(typeof node.label()).toBe('object');
		// @ts-expect-error a relaxed keyword is read as the word rule, so no keyword kind id names it
		expect(() => ts.build.breakStatement.strict(ts.kinds.LetKeyword).$render()).toThrow();
	});

	it('refuses a lone string, which the loose entry takes', () => {
		// @ts-expect-error text to a leaf is coercion: the loose entry takes it
		expect(() => verifying.build.exportStatement.namespaceExport.strict('ns')).toThrow(/a strict factory takes a built node, not a string/);
		expect(ts.build.exportStatement.namespaceExport.strict(ts.build.identifier('ns')).$render()).toBe('export as namespace ns;');
		expect(ts.build.exportStatement.namespaceExport.coerce('ns').$render()).toBe('export as namespace ns;');
	});
});
