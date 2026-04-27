/**
 * polymorph-dispatcher-throw.test.ts — asserts the generated polymorph
 * dispatcher's error behavior.
 *
 * The generated factory for a polymorph parent (e.g. python `assignment`)
 * dispatches to a per-form factory via `switch (config.$variant)` and
 * throws on unknown / missing tags. Covers:
 *   - Unknown $variant value → throws with a helpful message.
 *   - Malformed (null) input → throws (TypeError on property access).
 *
 * Uses the generated python package directly so the test pins the
 * GENERATED code's behavior, not an abstract contract.
 */

import { describe, it, expect, beforeAll } from "vitest";

// Dynamic import: the generated python package is a separate TS project
// (its own tsconfig). Importing by relative path would pull python/src
// into the codegen type-check graph. Use dynamic import so runtime
// resolution handles it and tsc stays happy.
type Dispatcher = (config: unknown) => unknown;
let assignment: Dispatcher;

beforeAll(async () => {
	const mod = (await import("../../../python/src/ir.ts" as string)) as {
		ir: { assignment: Dispatcher };
	};
	assignment = mod.ir.assignment;
});

describe("generated polymorph dispatcher — throw behavior", () => {
	it('throws with "unknown $variant" message on bogus $variant', () => {
		expect(() => assignment({ $variant: "bogus" })).toThrow(/unknown \$variant/);
	});

	it("names the parent kind in the error message", () => {
		expect(() => assignment({ $variant: "bogus" })).toThrow(/assignment/);
	});

	it("lists the known variants in the error message", () => {
		// Message format: "expected one of 'eq' | 'type' | 'typed'."
		expect(() => assignment({ $variant: "bogus" })).toThrow(/'eq'/);
		expect(() => assignment({ $variant: "bogus" })).toThrow(/'type'/);
		expect(() => assignment({ $variant: "bogus" })).toThrow(/'typed'/);
	});

	it("throws on null input (malformed)", () => {
		expect(() => assignment(null)).toThrow();
	});

	it("throws on undefined input (malformed)", () => {
		expect(() => assignment(undefined)).toThrow();
	});
});
