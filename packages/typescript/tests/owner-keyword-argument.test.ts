import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

describe('a forwarding factory with render options given its target’s argument', () => {
	it('builds the target from a lone keyword kind', async () => {
		const ts = await createEngine(typescript);
		const node = ts.build.breakStatement.strict(ts.kinds.LetKeyword);
		expect(node.$render()).toBe('break let;');
		expect(typeof node.label()).toBe('object');
	});

	it('builds the target from a lone string', async () => {
		const ts = await createEngine(typescript);
		expect(ts.build.exportStatementNamespaceExport.strict('ns').$render()).toContain('ns');
	});
});
