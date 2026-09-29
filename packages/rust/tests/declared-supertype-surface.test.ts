import { describe, expect, it } from 'vitest';
import { is } from '../src/is.ts';
import * as pub from '../src/index.ts';

describe('the public surface follows the declared-supertype rule', () => {
	it('gives a declared supertype a guard and an undeclared hidden choice none', () => {
		expect('expression' in is).toBe(true);
		expect('statement' in is).toBe(true);
		for (const undeclared of ['path', 'condition', 'tokens', 'useClause', 'expressionExceptRange']) {
			expect(undeclared in is).toBe(false);
		}
	});

	it('exports no runtime alias for a hidden choice', () => {
		expect(Object.keys(pub)).not.toContain('Path');
	});
});
