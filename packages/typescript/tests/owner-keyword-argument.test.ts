import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);

describe('a strict builder with render options given its target\'s argument', () => {
	it('builds the target from a lone keyword kind', () => {
		const node = ts.build.breakStatement.strict(ts.kinds.LetKeyword);
		expect(node.$render()).toBe('break let;');
		expect(typeof node.label()).toBe('object');
	});

	it('refuses a lone string, which the loose entry takes', () => {
		// @ts-expect-error text to a leaf is coercion: the loose entry takes it
		expect(() => ts.build.exportStatementNamespaceExport.strict('ns')).toThrow(/a strict factory takes a built node, not a string/);
		expect(ts.build.exportStatementNamespaceExport.strict(ts.build.identifier('ns')).$render()).toBe('export as namespace ns;');
		expect(ts.build.exportStatementNamespaceExport('ns').$render()).toBe('export as namespace ns;');
	});
});
