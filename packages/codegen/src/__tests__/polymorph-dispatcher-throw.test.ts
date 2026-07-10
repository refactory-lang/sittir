/**
 * polymorph-dispatcher-throw.test.ts — asserts generated from() resolver
 * error behavior for a polymorph parent (python `assignment`).
 *
 * Covers the two silent-failure gaps fixed in the `_resolveOne` family and
 * the `from()` call-emission site (packages/codegen/src/emitters/from.ts):
 *   - Gap B: an unresolvable object/array slot value throws a clear error
 *     naming the parent kind / expected kind(s), instead of being embedded
 *     raw into the tree.
 *   - Gap A: a REQUIRED slot that resolves to undefined/null throws a
 *     purpose-built "Missing required slot" error, instead of silently
 *     constructing a node with a missing field.
 *
 * Uses the generated python package directly so the test pins the
 * GENERATED code's behavior, not an abstract contract.
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Dynamic import: the generated python package is a separate TS project
// (its own tsconfig). Importing by relative path would pull python/src
// into the codegen type-check graph. Use dynamic import so runtime
// resolution handles it and tsc stays happy.
type Dispatcher = (config: unknown) => unknown;
let assignment: Dispatcher;

beforeAll(async () => {
	const mod = (await import('../../../python/src/ir.ts' as string)) as {
		ir: { assignment: Dispatcher };
	};
	assignment = mod.ir.assignment;
});

describe('generated from() resolver — silent-failure gaps', () => {
	it('throws a clear error when a slot receives an unresolvable object (Gap B)', () => {
		expect(() =>
			assignment({ left: { totally: 'garbage' }, content: { also: 'garbage' } })
		).toThrow(/cannot resolve value/);
	});

	it('names the expected kind(s) tried in the Gap B error message', () => {
		// `left` resolves through _K3/_K4 — "identifier" is always one of the
		// tried leaf candidates for python's LeftHandSide.
		expect(() => assignment({ left: { totally: 'garbage' } })).toThrow(/identifier/);
	});

	it('embeds the offending value in the Gap B error message', () => {
		expect(() => assignment({ left: { totally: 'garbage' } })).toThrow(/totally/);
	});

	it('throws a purpose-built "Missing required slot" error when a required slot resolves to undefined (Gap A)', () => {
		expect(() => assignment({})).toThrow(/Missing required slot 'left' on assignment\.from\(\)/);
	});

	it('throws on null input (malformed)', () => {
		expect(() => assignment(null)).toThrow();
	});

	it('throws on undefined input (malformed)', () => {
		expect(() => assignment(undefined)).toThrow();
	});
});
