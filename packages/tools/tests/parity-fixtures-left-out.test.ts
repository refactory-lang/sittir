import { describe, expect, it } from 'vitest';
import { extractParityFixtures } from '../src/validate/parity-fixtures.ts';

describe('a render fixture reproduces its expected output', () => {
	it('python: no fixture is left out', async () => {
		const { leftOutByKind } = await extractParityFixtures('python');
		expect(leftOutByKind).toEqual({});
	}, 600_000);
});
