import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../compiler/__tests__/_temp-grammar.ts';
import { getCurrentWireContext, withWireContext, wireCopy } from '../wire/wire.ts';

// outer reaches list through a field; list holds fn and konst through the hidden _stmt.
const S3_RULES = "outer: ($) => seq('impl', field('body', $.list)), list: ($) => seq('{', repeat($._stmt), '}'), _stmt: ($) => choice($.fn, $.konst), fn: ($) => seq('fn', $.word), konst: ($) => seq('const', $.word)";

const codes = (raw: { layerDiagnostics?: readonly { code: string }[] }): string[] => (raw.layerDiagnostics ?? []).map((d) => d.code);
const text = (value: unknown): string => JSON.stringify(value);

describe('a part copy is not matched by its source kind', () => {
	it('Z1: a path that matches zero occurrences resolves and records one edit-site-missing naming the kind and path', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: "owner: ($) => $._decl, _decl: ($) => choice(seq('a', $.word), seq('b', $.word))" }, '', {
			bindings: "rules: { owner: ($) => seq('(', copy('_decl', '1'), ')') }, edits: { owner: { '(_decl)': ($) => $.word } }"
		});
		expect(raw.layerDiagnostics).toEqual([
			expect.objectContaining({ code: 'edit-site-missing', details: expect.objectContaining({ kind: 'owner', path: '(_decl)' }), message: expect.stringMatching(/matched zero occurrences/) })
		]);
	}, 60_000);

	it('T1b: a path walking through a part copy edits it under its own name', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: "owner: ($) => $._decl, _decl: ($) => choice(seq('a', $.word), seq('b', $.word))" }, '', {
			bindings: "rules: { owner: ($) => seq('(', copy('_decl', '1'), ')') }, edits: { owner: { '(word)': alias('w') } }"
		});
		expect(text(raw.rules._decl_1_owner)).toContain('"w"');
		expect(raw.rules).not.toHaveProperty('_decl_owner');
		expect(codes(raw)).toEqual([]);
	}, 60_000);
});

describe('a copy reached through a path is named by its owner', () => {
	it('T4a: an own copy takes the new name given by as', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: S3_RULES }, '', {
			bindings: "edits: { outer: { 'body:/(list)/(fn)/1': alias('a'), 'body:/(list as outer_list)/(fn)/1': alias('b') } }"
		});
		expect(text(raw.rules.outer)).toContain('outer_list');
		expect(text(raw.rules._fn_outer)).toContain('"b"');
		expect(codes(raw)).toEqual([]);
	}, 60_000);

	it('T4b: a copy minted under as is shown as the given name', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: S3_RULES }, '', {
			bindings: "edits: { outer: { 'body:/(list as outer_list)/(fn)': ($) => alias(copy('fn'), $.method) } }"
		});
		expect(text(raw.rules.outer)).toContain('outer_list');
		expect(codes(raw)).toEqual([]);
	}, 60_000);

	it('T4c: an as on the reached copy reference shows that reference as the given name', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: S3_RULES }, '', {
			bindings: "edits: { outer: { 'body:/(list)/(fn)/1': alias('a'), 'body:/(list)/(fn as method2)/1': alias('b') } }"
		});
		expect(raw.rules._stmt_outer).toMatchObject({
			type: 'CHOICE',
			members: [{ type: 'ALIAS', value: 'method2', content: { type: 'SYMBOL', name: '_fn_outer' } }, { type: 'SYMBOL', name: 'konst' }]
		});
		expect(codes(raw)).toEqual([]);
	}, 60_000);

	it('T4d: two different display names on one reference are edit-site-conflict, and the entry undoes', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: S3_RULES }, '', {
			bindings: "edits: { outer: { 'body:/(list as outer_list)/(fn)/1': alias('a'), 'body:/(list as other_list)/(fn)/1': alias('b') } }"
		});
		expect(raw.layerDiagnostics).toContainEqual(
			expect.objectContaining({ code: 'edit-site-conflict', details: expect.objectContaining({ path: 'body:/(list as other_list)/(fn)/1', copy: '_list_outer', displays: ['outer_list', 'other_list'] }) })
		);
		expect(raw.rules._fn_outer).toMatchObject({ type: 'SEQ', members: [{ type: 'STRING', value: 'fn' }, { type: 'ALIAS', value: 'a' }] });
	}, 60_000);

	it('T4e: repeating the same display name changes nothing', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: S3_RULES }, '', {
			bindings: "edits: { outer: { 'body:/(list as outer_list)/(fn)/1': alias('a'), 'body:/(list as outer_list)/(konst)/1': alias('c') } }"
		});
		expect(codes(raw)).toEqual([]);
	}, 60_000);
});

describe('a copy made by another kind is refused, not reused', () => {
	it('W1: a path reaching a copy another kind made is an edit-entry-invalid refusal of the reaching kind', () => {
		const base = { rules: { fn: { type: 'SEQ', members: [{ type: 'STRING', value: 'fn' }] } } };
		const { ctx } = withWireContext(
			'a',
			() => {
				const context = getCurrentWireContext()!;
				Object.assign(context, { layer: { name: 'top', depth: 1, diagnostics: [] } });
				context.currentRuleKind = 'a';
				wireCopy({ source: 'fn', part: '.', via: 'path' }, (body) => body);
				context.currentRuleKind = 'b';
				expect(wireCopy({ source: 'fn', part: '.', via: 'path', from: '_fn_a' }, (body) => body)).toBeUndefined();
			},
			base
		);
		const diagnostics = (ctx.layer as unknown as { diagnostics: { code: string; ownerKind: string; details: { copy: string } }[] }).diagnostics;
		expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'edit-entry-invalid', ownerKind: 'b', details: expect.objectContaining({ copy: '_fn_a' }) }));
	});
});
