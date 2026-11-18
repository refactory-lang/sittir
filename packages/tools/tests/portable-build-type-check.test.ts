import { describe, expect, it } from 'vitest';
import { portableBuildTypeErrors } from '../src/portable/conformance.ts';

const OUT_OF_HEAP: Readonly<Record<string, string>> = {
	python: 'TypeScript 6.0.2 runs out of its default heap on the module (4398 MB peak, killed at 115 s); with a 10 GB heap it finishes in 121 s at 6545 MB with the four vocabulary TS2859 errors',
	rust: 'TypeScript 6.0.2 runs out of its default heap on the module (4392 MB peak, killed at 120 s)',
	typescript: 'TypeScript 6.0.2 runs out of its default heap on the module (4180 MB peak, killed at 84 s)'
};

describe('generated portable build modules', () => {
	for (const [grammar, outOfHeap] of Object.entries(OUT_OF_HEAP)) {
		it(`${grammar}: the generated build module and what it imports type-check with no error under tsrs, the TypeScript 7 lane`, () => {
			expect(portableBuildTypeErrors(grammar, 'tsrs')).toEqual([]);
		}, 300_000);
		it.skip(`${grammar}: the same under TypeScript 6, skipped while ${outOfHeap}`, () => {
			expect(portableBuildTypeErrors(grammar, 'TypeScript 6')).toEqual([]);
		}, 300_000);
	}
});
