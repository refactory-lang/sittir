import { describe, expect, it } from 'vitest';
import { portableBuildTypeErrors } from '../src/portable/conformance.ts';

describe('generated portable build modules', () => {
	for (const grammar of ['python', 'rust', 'typescript']) {
		it(`${grammar}: the generated build module and what it imports type-check with no error under tsrs`, () => {
			expect(portableBuildTypeErrors(grammar)).toEqual([]);
		}, 60_000);
	}
});
