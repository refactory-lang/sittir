import { describe, expect, it } from 'vitest';

import { tryLoadNativeEngine } from './helpers.ts';

/**
 * ADR-0017: readNode now takes (handle, childIndex) — two args.
 * Invalid input (NaN, negative, fractional) on EITHER arg should
 * throw. The Rust side casts f64→u32/u16 so non-finite or out-of-range
 * values produce napi type conversion errors.
 */
const invalidInputs = [
	{
		label: 'NaN handle',
		handle: Number.NaN,
		childIndex: 0,
		expected: /no tree cached|no tree parsed|convert/
	},
	{
		label: 'negative handle',
		handle: -1,
		childIndex: 0,
		expected: /no tree cached|no tree parsed|out of bounds|convert/
	},
	{
		label: 'fractional handle',
		handle: 1.5,
		childIndex: 0,
		expected: /no tree cached|no tree parsed|out of bounds|convert/
	}
] as const;

for (const grammar of ['rust', 'typescript', 'python'] as const) {
	describe(`${grammar} native readNode validation`, () => {
		for (const testCase of invalidInputs) {
			it(`rejects ${testCase.label} before tree lookup`, () => {
				const engine = tryLoadNativeEngine(grammar);
				if (!engine) return;

				// ADR-0017: readNode requires (handle, childIndex). Without a
				// prior parseAndRead, any call throws "no tree cached".
				expect(() => engine.readNode(testCase.handle as number, testCase.childIndex as number)).toThrow(
					testCase.expected
				);
			});
		}
	});
}
