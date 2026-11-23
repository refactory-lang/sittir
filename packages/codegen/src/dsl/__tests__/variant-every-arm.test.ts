import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { assemblePredicted } from '../../__tests__/helpers/linked.ts';
import { buildRuleCatalog } from '../../compiler/rule-catalog.ts';
import { emitTables } from '../../__tests__/helpers/emit-tables.ts';
import { isBlankVariantName } from '../primitives/variant.ts';
import { subFactoriesOf } from '../../compiler/model/sub-factories.ts';
import { flattenedVariantParents } from '../../compiler/model/ir-surface.ts';

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

const CHOICE_OF_SYMBOLS =
	"source: ($) => repeat($.holder), holder: ($) => seq('(', field('e', $.expr), ')'), expr: ($) => choice($.a, $.b, $.c), a: () => /a+/, b: () => /b+/, c: () => /c+/";

const HIDDEN_CHOICE = CHOICE_OF_SYMBOLS.replaceAll('$.expr', '$._expr').replace('expr: ($)', '_expr: ($)');

const runSymbols = (edits: string, rules = CHOICE_OF_SYMBOLS, owner = 'expr') => evaluateTempGrammar({ extras: '', rules }, '', { bindings: `edits: { ${owner}: ${edits} }` });

describe("variant key '*' beside selector keys and direct arms", () => {
	it('leaves an arm a selector key names out of the collected rule', async () => {
		const raw = await runSymbols("{ '(a)': variant('a'), '*': variant('rest', { default: true }) }");
		const parent = raw.rules.expr as { members: { name: string; annotations?: { variant?: string } }[] };
		expect(parent.members.map((member) => [member.name, member.annotations?.variant])).toEqual([['a', 'a'], ['expr_rest', 'rest']]);
		expect((raw.rules.expr_rest as { members: unknown[] }).members).toHaveLength(2);
	}, 60_000);

	it('gives a blank default over direct arms no route of its own under the holder', async () => {
		for (const [rules, owner] of [[CHOICE_OF_SYMBOLS, 'expr'], [HIDDEN_CHOICE, '_expr']] as const) {
			const raw = await runSymbols("{ 0: variant('a'), '*': variant('', { default: true }) }", rules, owner);
			const { rules: catalogRules, ruleCatalog } = buildRuleCatalog(raw.rules as never);
			const nodeMap = assemblePredicted({ name: 'synth', fileTypes: [], rules: catalogRules, ruleCatalog, evaluateSynthesized: new Set<string>(), extras: [], externals: [], supertypes: [], factoryInline: [], inline: [], conflicts: [], precedences: [], word: null, references: [] } as never).nodeMap;
			expect(subFactoriesOf(nodeMap.nodes.get('holder')!, nodeMap).entries.map((entry) => entry.name)).not.toContain('');
			expect(emitTables(nodeMap).wiring).not.toMatch(/readonly "":|\{ ?"": |\$\$|\.\s*[,;)]/);
			for (const parent of flattenedVariantParents(nodeMap)) expect(parent.variants.filter((route) => isBlankVariantName(route.name)).length).toBeLessThanOrEqual(1);
		}
	}, 60_000);

	it('gives a blank default that holds another variant parent no member of its own', async () => {
		const rules =
			"source: ($) => repeat($.holder), holder: ($) => seq('(', field('e', $.outer), ')'), outer: ($) => choice($.inner, $.c), inner: ($) => choice($.a, $.b), a: () => /a+/, b: () => /b+/, c: () => /c+/";
		const raw = await evaluateTempGrammar({ extras: '', rules }, '', {
			bindings: "edits: { inner: { 0: variant('x'), '*': variant('y', { default: true }) }, outer: { 1: variant('c'), '*': variant('', { default: true }) } }"
		});
		const { rules: catalogRules, ruleCatalog } = buildRuleCatalog(raw.rules as never);
		const nodeMap = assemblePredicted({ name: 'synth', fileTypes: [], rules: catalogRules, ruleCatalog, evaluateSynthesized: new Set<string>(), extras: [], externals: [], supertypes: [], factoryInline: [], inline: [], conflicts: [], precedences: [], word: null, references: [] } as never).nodeMap;
		expect(emitTables(nodeMap).wiring).not.toMatch(/readonly "":|\{ ?"": |\$\$|\.\s*[,;)]/);
	}, 60_000);

	it('keeps the arm two keys of one path name, whatever else the rule holds', async () => {
		const rules =
			"source: ($) => repeat($.holder), holder: ($) => seq('(', field('e', $.expr), ')'), expr: ($) => choice($.a, seq($.a, $.b), $.c), a: () => /a+/, b: () => /b+/, c: () => /c+/";
		const raw = await evaluateTempGrammar({ extras: '', rules }, '', { bindings: "edits: { expr: { '1/0': variant('first'), '1/1': variant('second'), '*': variant('', { default: true }) } }" });
		const parent = raw.rules.expr as { members: { name?: string; type: string; annotations?: { variant?: string } }[] };
		expect(parent.members).toHaveLength(2);
		expect(parent.members.map((member) => member.annotations?.variant)).toEqual(['', undefined]);
		expect(JSON.stringify(raw.rules.expr_default)).not.toContain('"b"');
	}, 60_000);

	it('refuses the key on a rule whose body is a sequence, where the keyed variants hoist', async () => {
		const rules = "source: ($) => repeat($.holder), holder: ($) => seq('(', choice($.a, $.b), ')'), a: () => /a+/, b: () => /b+/";
		const raw = await evaluateTempGrammar({ extras: '', rules }, '', { bindings: "edits: { holder: { '1/0': variant('x'), '*': variant('', { default: true }) } }" });
		expect(raw.layerDiagnostics).toEqual([expect.objectContaining({ code: 'edit-entry-invalid', message: expect.stringMatching(/no such arm/) })]);
	}, 60_000);
});
