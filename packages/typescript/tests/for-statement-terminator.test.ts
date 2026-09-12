// The reader must not seat a slot's separator: typescript's
// `for_statement.condition` is field-tagged together with the `;` that
// terminates it, the same shape as python's `for_in_clause.right`.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';

const SOURCE = 'for (let i = 0; i < 3; i++) {}\n';

describe('for_statement.condition', () => {
	it('does not seat its terminator in the slot', () => {
		const engine = createEngine();
		const { root } = engine.diagnostics.parseAndRead(SOURCE, { deep: true });
		const json = JSON.stringify(root);
		expect(json).toContain('_condition');
		const statement = (root as unknown as { _statements: unknown })._statements;
		expect(statement).toBeDefined();
		expect(engine.parse(SOURCE).$render()).toBe(SOURCE);
	});
});
