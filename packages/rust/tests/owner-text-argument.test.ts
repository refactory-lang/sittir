import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe('a forwarding factory given its target’s text', () => {
	it('builds the target from a lone string', async () => {
		const rs = await createEngine(rust);
		const built = rs.build.lifetime.strict(rs.build.identifier('a'));
		expect(rs.build.lifetime.strict('a').$render()).toBe(built.$render());
		expect(built.$render()).toBe("'a");
	});

	it('builds through two forwarding factories', async () => {
		const rs = await createEngine(rust);
		expect(rs.build.continueExpression.strict('outer').$render()).toBe("continue 'outer");
	});
});
