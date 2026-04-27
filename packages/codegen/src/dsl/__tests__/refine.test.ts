/**
 * refine.test.ts — unit coverage for the refine() DSL primitive.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { refine } from "../primitives/refine.ts";
import { withWireContext } from "../wire/wire.ts";
import { installFakeDsl, restoreFakeDsl } from "./_test-helpers.ts";
import type { Rule } from "../../compiler/rule.ts";

beforeAll(() => installFakeDsl());
afterAll(() => restoreFakeDsl());

describe("refine()", () => {
	const rule: Rule = { type: "seq", members: [] };

	it("registers form metadata on the active wire context", () => {
		const { ctx, result } = withWireContext("interface_body", () => {
			return refine(rule, {
				curly: { "opening:": "{", "closing:": "}" },
				flow: { "opening:": "{|", "closing:": "|}" },
			});
		});
		expect(result).toBe(rule); // structurally unchanged
		const forms = ctx.refineForms.get("interface_body");
		expect(forms).toBeDefined();
		expect(forms).toHaveLength(2);
		expect(forms![0]!.name).toBe("curly");
		expect(forms![0]!.selections["opening:"]).toBe("{");
		expect(forms![0]!.selections["closing:"]).toBe("}");
		expect(forms![1]!.name).toBe("flow");
		expect(forms![1]!.selections["opening:"]).toBe("{|");
	});

	it("preserves form declaration order (first is the default)", () => {
		const { ctx } = withWireContext("x", () => {
			refine(rule, {
				second: { "p:": 2 },
				first: { "p:": 1 },
				third: { "p:": 3 },
			});
		});
		const forms = ctx.refineForms.get("x")!;
		expect(forms.map((f) => f.name)).toEqual(["second", "first", "third"]);
	});

	it("throws without an active wire context", () => {
		expect(() => {
			refine(rule, { curly: { "opening:": "{" } });
		}).toThrow(/no active wire context/);
	});

	it("accepts numeric branch-index selections alongside string literals", () => {
		const { ctx } = withWireContext("y", () => {
			refine(rule, {
				branchZero: { "0/_:": 0 },
				literal: { "0/_:": "semi" },
			});
		});
		const forms = ctx.refineForms.get("y")!;
		expect(forms[0]!.selections["0/_:"]).toBe(0);
		expect(forms[1]!.selections["0/_:"]).toBe("semi");
	});

	it("defensive-copies the selections map", () => {
		const selections = { "a:": 1 };
		const { ctx } = withWireContext("z", () => {
			refine(rule, { form: selections });
		});
		selections["a:"] = 99;
		const forms = ctx.refineForms.get("z")!;
		expect(forms[0]!.selections["a:"]).toBe(1); // not 99
	});
});
