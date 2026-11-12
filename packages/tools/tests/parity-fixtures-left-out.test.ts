import { afterAll, describe, expect, it } from 'vitest';
import { extractParityFixtures } from '../src/validate/parity-fixtures.ts';
import { disposeNativeEngines } from '../src/validate/common.ts';

afterAll(disposeNativeEngines);

describe('a render fixture reproduces its expected output', () => {
	it('python: no fixture is left out', async () => {
		const { leftOutByKind } = await extractParityFixtures('python');
		expect(leftOutByKind).toEqual({});
	}, 600_000);
});
