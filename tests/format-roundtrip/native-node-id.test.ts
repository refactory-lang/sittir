import { describe, expect, it } from 'vitest';

import { parseNativeFixture, tryLoadNativeEngine } from './helpers.ts';

/**
 * A handle, a tree id and a node index all arrive as JavaScript numbers.
 * None may be quietly rounded into something valid: Rust's `as` cast
 * saturates, so `NaN` and every negative become 0 — and 0 names a real tree
 * and its root. A nonsense argument that reached the cast would therefore be
 * answered rather than refused, which is why the boundary checks the value
 * itself instead of relying on a later lookup to fail.
 */
const invalidHandles = [
	{ label: 'NaN handle', handle: Number.NaN, expected: /handle must be a finite number/ },
	{ label: 'infinite handle', handle: Number.POSITIVE_INFINITY, expected: /handle must be a finite number/ },
	{ label: 'negative handle', handle: -1, expected: /handle must not be negative/ },
	{ label: 'fractional handle', handle: 1.5, expected: /handle must be a whole number/ },
	{ label: 'handle past exact-integer range', handle: 2 ** 53, expected: /beyond the exact-integer range/ }
] as const;

const invalidIndexes = [
	{ label: 'NaN index', index: Number.NaN, expected: /index must be a finite number/ },
	{ label: 'negative index', index: -1, expected: /index must not be negative/ },
	{ label: 'fractional index', index: 2.5, expected: /index must be a whole number/ }
] as const;

for (const grammar of ['rust', 'typescript', 'python'] as const) {
	describe(`${grammar} native argument validation`, () => {
		for (const testCase of invalidHandles) {
			it(`lineGapsOf rejects a ${testCase.label}`, () => {
				const engine = tryLoadNativeEngine(grammar);
				if (!engine) return;

				// Parse first, so the rejection cannot come from "no tree here"
				// — the argument itself has to be what is refused.
				engine.parse('');

				expect(() => engine.lineGapsOf(testCase.handle)).toThrow(testCase.expected);
			});
		}

		for (const testCase of invalidIndexes) {
			it(`read rejects a ${testCase.label}`, () => {
				const engine = tryLoadNativeEngine(grammar);
				if (!engine) return;

				const { treeId } = parseNativeFixture(engine, '');
				expect(() => engine.read(treeId, testCase.index)).toThrow(testCase.expected);
			});
		}

		it('refuses a handle naming a tree that is not live', () => {
			const engine = tryLoadNativeEngine(grammar);
			if (!engine) return;

			// Well-formed, but names a tree id this thread has not minted. The
			// table is the language's, not this engine's, so a low id may name
			// a tree another engine parsed. Distinct from a malformed argument.
			const unmintedTreeId = 2 ** 20;
			expect(() => engine.lineGapsOf(unmintedTreeId * 2 ** 32)).toThrow(/names tree 1048576, which is not live/);
		});
	});
}
