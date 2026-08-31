import { describe, expect, it } from 'vitest';

import { tryLoadNativeEngine } from './helpers.ts';

/**
 * `readNode` takes (handle, childIndex), both arriving as JavaScript numbers.
 * Neither may be quietly rounded into something valid: Rust's `as` cast
 * saturates, so `NaN` and every negative become 0 — and handle 0 is a real
 * handle naming the first tree's root. A nonsense argument that reached the
 * cast would therefore be answered rather than refused, which is why the
 * boundary checks the value itself instead of relying on a later lookup to
 * fail.
 */
const invalidInputs = [
	{ label: 'NaN handle', handle: Number.NaN, childIndex: 0, expected: /handle must be a finite number/ },
	{
		label: 'infinite handle',
		handle: Number.POSITIVE_INFINITY,
		childIndex: 0,
		expected: /handle must be a finite number/
	},
	{ label: 'negative handle', handle: -1, childIndex: 0, expected: /handle must not be negative/ },
	{ label: 'fractional handle', handle: 1.5, childIndex: 0, expected: /handle must be a whole number/ },
	{
		label: 'handle past exact-integer range',
		handle: 2 ** 53,
		childIndex: 0,
		expected: /beyond the exact-integer range/
	},
	{ label: 'NaN childIndex', handle: 0, childIndex: Number.NaN, expected: /childIndex must be a finite number/ },
	{ label: 'negative childIndex', handle: 0, childIndex: -1, expected: /childIndex must not be negative/ },
	{ label: 'fractional childIndex', handle: 0, childIndex: 2.5, expected: /childIndex must be a whole number/ }
] as const;

for (const grammar of ['rust', 'typescript', 'python'] as const) {
	describe(`${grammar} native readNode validation`, () => {
		for (const testCase of invalidInputs) {
			it(`rejects ${testCase.label}`, () => {
				const engine = tryLoadNativeEngine(grammar);
				if (!engine) return;

				// Parse first, so the rejection cannot come from "no tree here"
				// — the argument itself has to be what is refused.
				engine.parseAndRead('');

				expect(() => engine.readNode(testCase.handle as number, testCase.childIndex as number)).toThrow(
					testCase.expected
				);
			});
		}

		it('refuses a handle naming a tree that is not live', () => {
			const engine = tryLoadNativeEngine(grammar);
			if (!engine) return;

			// Well-formed, but names tree 1 — nothing has been parsed, so no
			// tree by that name exists. Distinct from a malformed argument.
			const handleIntoTreeOne = 2 ** 32;
			expect(() => engine.readNode(handleIntoTreeOne, 0)).toThrow(/names tree 1, which is not live/);
		});
	});
}
