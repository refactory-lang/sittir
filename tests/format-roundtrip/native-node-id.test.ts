import { describe, expect, it } from 'vitest';

import { tryLoadNativeEngine } from './helpers.ts';

const invalidNodeIds = [
	{
		label: 'NaN',
		value: Number.NaN,
		expected: /finite non-negative safe integer/
	},
	{ label: 'negative', value: -1, expected: /non-negative safe integer/ },
	{ label: 'fractional', value: 1.5, expected: /expected an integer/ }
] as const;

for (const grammar of ['rust', 'typescript', 'python'] as const) {
	describe(`${grammar} native readNode validation`, () => {
		for (const testCase of invalidNodeIds) {
			it(`rejects ${testCase.label} node ids before tree lookup`, () => {
				const engine = tryLoadNativeEngine(grammar);
				if (!engine) return;

				expect(() => engine.readNode(testCase.value)).toThrow(
					testCase.expected
				);
			});
		}
	});
}
