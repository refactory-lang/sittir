import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';

const RULES = "source: ($) => repeat($.k), k: ($) => seq(repeat($.item), $.x), item: () => 'i', x: () => 'x'";
const OPTIONS = "options: { 'k/item:/separator': preference(',') }";

const evaluate = (edits: string) => evaluateTempGrammar({ extras: '', rules: RULES }, OPTIONS, { bindings: `edits: { k: { ${edits} } }` });

describe('a field over a repeat records the segment rename of its content (items 1, 2)', () => {
	it('field(items) over repeat(item) renames item: to items:, and the option resolves', async () => {
		const raw = await evaluate("0: field('items')");
		expect(raw.bindingEffects).toContainEqual(expect.objectContaining({ kind: 'segment', owner: 'k', from: 'item:', to: 'items:' }));
		expect((raw.layerDiagnostics ?? []).map((d) => d.message).filter((m) => /names no site/.test(m))).toEqual([]);
	}, 60_000);

	it('field(items) over repeat1(item) renames item: to items:, and the option resolves', async () => {
		const raw = await evaluateTempGrammar(
			{ extras: '', rules: "source: ($) => repeat($.k), k: ($) => seq(repeat1($.item), $.x), item: () => 'i', x: () => 'x'" },
			"options: { 'k/item:/separator': preference(',') }",
			{ bindings: "edits: { k: { 0: field('items') } }" }
		);
		expect(raw.bindingEffects).toContainEqual(expect.objectContaining({ kind: 'segment', owner: 'k', from: 'item:', to: 'items:' }));
		expect((raw.layerDiagnostics ?? []).map((d) => d.message).filter((m) => /names no site/.test(m))).toEqual([]);
	}, 60_000);
});

describe('a field on the repeated item still renames the segment (item 3, control)', () => {
	it("'0/0': field(items) records the same segment rename", async () => {
		const raw = await evaluate("'0/0': field('items')");
		expect(raw.bindingEffects).toContainEqual(expect.objectContaining({ kind: 'segment', owner: 'k', from: 'item:', to: 'items:' }));
	}, 60_000);
});
