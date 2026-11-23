import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';

const BASE =
	"expr: ($) => choice(prec.left(1, seq(field('left', $.num), '+', field('right', $.num))), prec.left(2, seq(field('left', $.num), '*', field('right', $.num))), prec.left(3, seq(field('left', $.num), '<', field('right', $.num))), seq('#', field('left', $.num), 'in', field('right', $.num))), num: () => /[0-9]+/";

const run = (edits: string) => evaluateTempGrammar({ extras: '', rules: BASE }, '', { bindings: `edits: { expr: ${edits} }` });

describe("variant key '*' names every arm no other key names", () => {
	it('one rule holds the unnamed arms, and the parent is a supertype of the two', async () => {
		const raw = await run("{ 3: variant('in'), '*': variant('', { default: true }) }");
		expect(raw.layerDiagnostics ?? []).toEqual([]);
		expect(Object.keys(raw.rules)).toEqual(expect.arrayContaining(['expr_in', 'expr_default']));
		const body = JSON.stringify(raw.rules.expr_default);
		expect((raw.rules.expr_default as { type: string; members: unknown[] }).type).toBe('CHOICE');
		expect((raw.rules.expr_default as { members: unknown[] }).members).toHaveLength(3);
		expect(body).not.toContain('"#"');
		expect(JSON.stringify(raw.rules.expr)).toContain('"expr_default"');
	}, 60_000);

	it('refuses a blank name without default', async () => {
		const raw = await run("{ 3: variant('in'), '*': variant('') }");
		expect(raw.layerDiagnostics).toEqual([expect.objectContaining({ code: 'edit-entry-invalid', message: expect.stringMatching(/blank variant name takes/) })]);
	}, 60_000);

	it('refuses one variant name on two keys', async () => {
		const raw = await run("{ 3: variant('in'), '*': variant('in') }");
		expect(raw.layerDiagnostics).toEqual([expect.objectContaining({ code: 'edit-entry-invalid', message: expect.stringMatching(/already named at '3'/) })]);
	}, 60_000);

	it('refuses the key when every arm is named', async () => {
		const raw = await run("{ 0: variant('a'), 1: variant('b'), 2: variant('c'), 3: variant('d'), '*': variant('e') }");
		expect(raw.layerDiagnostics).toEqual([expect.objectContaining({ code: 'edit-entry-invalid', message: expect.stringMatching(/no such arm/) })]);
	}, 60_000);
});
