import { describe, expect, it } from 'vitest';
import { applyCopy, copyNameOf, refusalOf, verbCtxOf, VerbRefusal } from '../verbs/copy.ts';
import type { CopyOrigin } from '../verbs/effects.ts';

const sym = (name: string) => ({ type: 'SYMBOL', name });
const str = (value: string) => ({ type: 'STRING', value });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });

const origin: CopyOrigin = { kind: 'copy', owner: 'owner' };

const grammar = () => ({
	name: 'g',
	rules: { owner: sym('_expression'), _expression: choice(sym('a'), sym('b')), a: str('a'), b: str('b') },
	supertypes: ['_expression'],
	inline: [sym('_expression')]
});

describe('copyNameOf', () => {
	it("names a whole copy _<source>_<context>, dropping the source's own underscore", () => {
		expect(copyNameOf('_declaration_statement', '.', 'impl_item_body')).toBe('_declaration_statement_impl_item_body');
		expect(copyNameOf('function_item', '.', 'impl_item_body')).toBe('_function_item_impl_item_body');
	});

	it("puts a part's segments between the source and the context", () => {
		expect(copyNameOf('_declaration', '2', 'impl_item_body')).toBe('_declaration_2_impl_item_body');
		expect(copyNameOf('_declaration', 'body:/1', 'owner')).toBe('_declaration_body_1_owner');
	});
});

describe('applyCopy', () => {
	it('mints the copy, records its effect, and enlists it in every supertype and inline list its source is in', () => {
		const source = grammar();
		const ctx = verbCtxOf(source);
		expect(applyCopy({ source: '_expression', part: '.', context: 'owner', body: sym('a'), origin }, ctx)).toBe('_expression_owner');
		expect(ctx.rules._expression_owner).toEqual(sym('a'));
		expect(ctx.created).toEqual(['_expression_owner']);
		expect(ctx.effects).toEqual([
			{ kind: 'copy', copy: '_expression_owner', source: '_expression', part: '.', context: 'owner', display: undefined, admitted: undefined, origin }
		]);
		expect(ctx.lists.supertypes).toEqual(['_expression', '_expression_owner']);
		expect(ctx.lists.inline).toEqual([sym('_expression'), sym('_expression_owner')]);
		expect(source.supertypes).toEqual(['_expression']);
		expect(source.rules).not.toHaveProperty('_expression_owner');
	});

	it('returns the same reference for a second copy in one context, minting once', () => {
		const ctx = verbCtxOf(grammar());
		const request = { source: '_expression', part: '.', context: 'owner', body: sym('a'), origin };
		expect(applyCopy(request, ctx)).toBe(applyCopy({ ...request, body: sym('a') }, ctx));
		expect(ctx.created).toEqual(['_expression_owner']);
		expect(ctx.effects).toHaveLength(1);
		expect(ctx.lists.supertypes).toEqual(['_expression', '_expression_owner']);
	});

	it('refuses a second copy in one context with another body as edit-site-conflict', () => {
		const ctx = verbCtxOf(grammar());
		applyCopy({ source: '_expression', part: '.', context: 'owner', body: sym('a'), origin }, ctx);
		const refusal = refusalOf(ctx, () => applyCopy({ source: '_expression', part: '.', context: 'owner', body: sym('b'), origin }, ctx));
		expect(refusal).toBeInstanceOf(VerbRefusal);
		expect([refusal?.code, refusal?.reason]).toEqual(['edit-site-conflict', "'_expression' narrows two ways to '_expression_owner'"]);
	});

	it('refuses a name the grammar already has as rule-name-taken', () => {
		const ctx = verbCtxOf({ ...grammar(), rules: { ...grammar().rules, _expression_owner: str('x') } });
		const refusal = refusalOf(ctx, () => applyCopy({ source: '_expression', part: '.', context: 'owner', body: sym('a'), origin }, ctx));
		expect([refusal?.code, refusal?.reason]).toEqual(['rule-name-taken', "'_expression' mints '_expression_owner', which the grammar already names"]);
	});
});

describe('refusalOf', () => {
	it('leaves no trace of a refused application: its rules, effects, created names and list entries go', () => {
		const ctx = verbCtxOf(grammar());
		const before = { rules: { ...ctx.rules }, keys: Object.keys(ctx.rules) };
		const refusal = refusalOf(ctx, () => {
			applyCopy({ source: '_expression', part: '.', context: 'owner', body: sym('a'), origin }, ctx);
			ctx.rules.owner = sym('_expression_owner');
			ctx.reached.set('_expression', { kind: 'narrow', owner: 'owner', path: '.' });
			throw new VerbRefusal('narrow-invalid', 'refused');
		});
		expect(refusal?.reason).toBe('refused');
		expect(Object.keys(ctx.rules)).toEqual(before.keys);
		expect(ctx.rules).toEqual(before.rules);
		expect([ctx.effects, ctx.created, ctx.lists.supertypes, [...ctx.reached]]).toEqual([[], [], ['_expression'], []]);
	});

	it('passes every other error through', () => {
		const ctx = verbCtxOf(grammar());
		expect(() => refusalOf(ctx, () => {
			throw new Error('not a refusal');
		})).toThrow('not a refusal');
	});
});
