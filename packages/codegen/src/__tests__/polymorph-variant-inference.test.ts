/**
 * polymorph-variant-inference.test.ts — targeted unit tests for polymorph
 * `$variant` stamping inside `nodeToConfig`.
 *
 * Exercises both the 'override' (first-named-child $type lookup) and
 * 'promoted' (field-presence on derived config) paths. The helper's
 * exported name may shift under the in-flight `PolymorphVariantDescriptor`
 * refactor — tests assert PUBLIC BEHAVIOR by calling `nodeToConfig` and
 * reading `config.$variant`.
 */

import { describe, it, expect } from "vitest";
import { nodeToConfig, type NodeToConfigOpts } from "../validate/common.ts";

// ---------------------------------------------------------------------------
// Override path — $variant derives from the kind of the first NAMED child.
// ---------------------------------------------------------------------------

describe("nodeToConfig — polymorph $variant (override source)", () => {
	const makeOpts = (childKind: Record<string, string>): NodeToConfigOpts => ({
		polymorphVariants: {
			assignment: { source: "override", childKind },
		},
	});

	it("stamps $variant when the first named child kind is registered", () => {
		const data = {
			$type: "assignment",
			$children: [{ $type: "assignment_eq", $named: true }],
		};
		const cfg = nodeToConfig(data, makeOpts({ assignment_eq: "eq", assignment_type: "type" }));
		expect(cfg.$variant).toBe("eq");
	});

	it("does NOT stamp $variant when the first child kind is absent from the map", () => {
		const data = {
			$type: "assignment",
			$children: [{ $type: "some_unregistered", $named: true }],
		};
		const cfg = nodeToConfig(data, makeOpts({ assignment_eq: "eq" }));
		expect("$variant" in cfg).toBe(false);
	});

	it("skips anonymous tokens — uses the first NAMED child", () => {
		const data = {
			$type: "assignment",
			$children: [
				{ $type: "=", $named: false },
				{ $type: "assignment_eq", $named: true },
			],
		};
		const cfg = nodeToConfig(data, makeOpts({ assignment_eq: "eq" }));
		expect(cfg.$variant).toBe("eq");
	});

	it("does NOT stamp $variant when the node has no children at all", () => {
		const data = { $type: "assignment" };
		const cfg = nodeToConfig(data, makeOpts({ assignment_eq: "eq" }));
		expect("$variant" in cfg).toBe(false);
	});

	it("does NOT stamp $variant when $children is empty", () => {
		const data = { $type: "assignment", $children: [] };
		const cfg = nodeToConfig(data, makeOpts({ assignment_eq: "eq" }));
		expect("$variant" in cfg).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Promoted path — $variant derives from field-presence on the derived config.
// ---------------------------------------------------------------------------

describe("nodeToConfig — polymorph $variant (promoted source)", () => {
	const makeOpts = (fields: Record<string, readonly string[]>): NodeToConfigOpts => ({
		polymorphVariants: {
			range_expression: { source: "promoted", fields },
		},
	});

	it("stamps the form whose every listed field appears on the derived config", () => {
		const data = {
			$type: "range_expression",
			$fields: {
				start: { $type: "integer_literal", $text: "0", $named: true },
				end: { $type: "integer_literal", $text: "10", $named: true },
			},
		};
		const cfg = nodeToConfig(
			data,
			makeOpts({
				binary: ["start", "end"],
				prefix: ["end"],
			}),
		);
		expect(cfg.$variant).toBe("binary");
	});

	it("picks the MOST-SPECIFIC form when one fields set is a superset of another", () => {
		const data = {
			$type: "range_expression",
			$fields: {
				start: { $type: "integer_literal", $text: "0", $named: true },
				end: { $type: "integer_literal", $text: "10", $named: true },
				operator: { $type: "..", $named: false },
			},
		};
		// Both `binary` (2 fields) and `ternary` (3 fields) match; ternary wins.
		const cfg = nodeToConfig(
			data,
			makeOpts({
				binary: ["start", "end"],
				ternary: ["start", "end", "operator"],
			}),
		);
		expect(cfg.$variant).toBe("ternary");
	});

	it("falls back to the zero-field form when no other form matches", () => {
		const data = {
			$type: "range_expression",
			$fields: {
				nomatch: { $type: "integer_literal", $text: "1", $named: true },
			},
		};
		const cfg = nodeToConfig(
			data,
			makeOpts({
				binary: ["start", "end"],
				bare: [],
			}),
		);
		expect(cfg.$variant).toBe("bare");
	});

	it("does NOT stamp $variant when no form matches and no zero-field fallback exists", () => {
		const data = {
			$type: "range_expression",
			$fields: {
				nomatch: { $type: "integer_literal", $text: "1", $named: true },
			},
		};
		const cfg = nodeToConfig(
			data,
			makeOpts({
				binary: ["start", "end"],
				prefix: ["end"],
			}),
		);
		expect("$variant" in cfg).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Descriptor absence / non-polymorph kinds — never stamp.
// ---------------------------------------------------------------------------

describe("nodeToConfig — polymorph $variant (no descriptor)", () => {
	it("does NOT stamp $variant when polymorphVariants is absent", () => {
		const data = {
			$type: "assignment",
			$children: [{ $type: "assignment_eq", $named: true }],
		};
		const cfg = nodeToConfig(data);
		expect("$variant" in cfg).toBe(false);
	});

	it("does NOT stamp $variant when the parent kind has no descriptor entry", () => {
		const data = {
			$type: "plain_kind",
			$fields: { x: { $type: "x", $text: "x", $named: true } },
		};
		const cfg = nodeToConfig(data, {
			polymorphVariants: {
				// different kind — should not fire
				assignment: { source: "override", childKind: { assignment_eq: "eq" } },
			},
		});
		expect("$variant" in cfg).toBe(false);
	});
});
