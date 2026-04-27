/**
 * polymorph-collision-guard.test.ts — negative + positive tests for
 * `resolveHoistedForm`'s form/inner field-name collision guard.
 *
 * When a polymorph form has `fields: [{ propertyName: 'left' }]` and the
 * single required child slot resolves to an inner kind whose innerFields
 * also include `propertyName: 'left'`, the hoisted Config surface would
 * be ambiguous. The helper bails out (returns `undefined`) and now also
 * warns via console.warn.
 */

import { describe, it, expect, vi } from "vitest";
import type { Rule, SeqRule } from "../compiler/rule.ts";
import type { NodeMap } from "../compiler/types.ts";
import {
	AssembledGroup,
	AssembledBranch,
	type AssembledField,
	type AssembledNode,
} from "../compiler/node-map.ts";
import { resolveHoistedForm } from "../emitters/shared.ts";

// ---------------------------------------------------------------------------
// Synthetic rule + NodeMap builders.
//
// Inner kind 'inner_binary':
//     seq(field('left', symbol('expr')), field('right', symbol('expr')))
//
// Form 'outer__form_binary' wraps a single required child referencing the
// inner kind via `symbol('inner_binary')`.
// ---------------------------------------------------------------------------

function mkSymbol(name: string): Rule {
	return { type: "symbol", name } as Rule;
}

function mkField(name: string, content: Rule): Rule {
	return { type: "field", name, content, source: "grammar" } as Rule;
}

function mkSeq(members: Rule[]): SeqRule {
	return { type: "seq", members };
}

/** Inner rule: two fields `left` + `right`. */
function makeInnerRule(): SeqRule {
	return mkSeq([mkField("left", mkSymbol("expr")), mkField("right", mkSymbol("expr"))]);
}

/** Form rule: one child slot pointing at `inner_binary`. */
function makeFormRule(): SeqRule {
	return mkSeq([mkSymbol("inner_binary")]);
}

function makeInner(): AssembledBranch {
	const rule = makeInnerRule();
	return new AssembledBranch("inner_binary", rule, rule, { factoryName: "innerBinary" });
}

function makeForm(): AssembledGroup {
	const rule = makeFormRule();
	return new AssembledGroup("outer__form_binary", rule, rule, {
		factoryName: "outerFormBinary",
		name: "binary",
		parentKind: "outer",
	});
}

function makeNodeMap(entries: Record<string, AssembledNode>): NodeMap {
	return {
		name: "synth",
		nodes: new Map(Object.entries(entries)),
	} as unknown as NodeMap;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("resolveHoistedForm — collision guard", () => {
	it("returns undefined when form-level and inner fields share a propertyName", () => {
		const inner = makeInner();
		// Sanity check — inner must expose `left` + `right` fields.
		expect(inner.fields.map((f) => f.propertyName)).toEqual(["left", "right"]);

		const form = makeForm();
		// Install a form-level field that collides with the inner `left`.
		const collidingField: AssembledField = {
			name: "left",
			propertyName: "left",
			paramName: "left",
			values: [],
			source: "grammar",
			projection: { typeName: "", kinds: [] },
			hasTrailing: false,
			hasLeading: false,
		};
		// form.fields is a getter backed by #fields cache; we override for
		// the test via Object.defineProperty to avoid reaching into the
		// caching internals. Using a read-only descriptor preserves the
		// AssembledGroup instanceof identity.
		Object.defineProperty(form, "fields", { value: [collidingField], configurable: true });

		const nodeMap = makeNodeMap({ inner_binary: inner });

		const warn = vi.spyOn(console, "warn").mockImplementation(() => {
			/* swallow */
		});
		try {
			const result = resolveHoistedForm(form, nodeMap);
			expect(result).toBeUndefined();
			// Warning text should mention the form kind + the colliding field name.
			expect(warn).toHaveBeenCalled();
			const msg = warn.mock.calls.map((c) => String(c[0])).join("\n");
			expect(msg).toMatch(/outer__form_binary/);
			expect(msg).toMatch(/'left'/);
		} finally {
			warn.mockRestore();
		}
	});

	it("returns a HoistedForm descriptor when there is NO collision", () => {
		const inner = makeInner();
		const form = makeForm();

		// Form-level field name that does NOT collide with inner fields.
		const nonCollidingField: AssembledField = {
			name: "operator",
			propertyName: "operator",
			paramName: "operator",
			values: [],
			source: "grammar",
			projection: { typeName: "", kinds: [] },
			hasTrailing: false,
			hasLeading: false,
		};
		Object.defineProperty(form, "fields", { value: [nonCollidingField], configurable: true });

		const nodeMap = makeNodeMap({ inner_binary: inner });

		const warn = vi.spyOn(console, "warn").mockImplementation(() => {
			/* swallow */
		});
		try {
			const result = resolveHoistedForm(form, nodeMap);
			expect(result).toBeDefined();
			expect(result!.innerKind).toBe("inner_binary");
			expect(result!.innerFactoryName).toBe("innerBinary");
			expect(result!.innerFields.map((f) => f.propertyName)).toEqual(["left", "right"]);
			expect(warn).not.toHaveBeenCalled();
		} finally {
			warn.mockRestore();
		}
	});

	it("returns a HoistedForm descriptor when the form has no fields at all", () => {
		const inner = makeInner();
		const form = makeForm();
		// form.fields is empty by default (form rule has no field() nodes) —
		// no defineProperty needed; verify sanity.
		expect(form.fields).toEqual([]);

		const nodeMap = makeNodeMap({ inner_binary: inner });
		const result = resolveHoistedForm(form, nodeMap);
		expect(result).toBeDefined();
		expect(result!.innerFields.map((f) => f.propertyName)).toEqual(["left", "right"]);
	});
});
