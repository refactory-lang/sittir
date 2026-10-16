import { describe, expect, it } from 'vitest';
import { match } from '../primitives/narrow.ts';
import { refusalOf, verbCtxOf, type VerbCtx } from '../verbs/copy.ts';
import type { CopyOrigin, LeadMatch } from '../verbs/effects.ts';
import { applyNarrow, NO_POSITIONS, type NarrowDirection } from '../verbs/narrow.ts';

const sym = (name: string) => ({ type: 'SYMBOL', name });
const str = (value: string) => ({ type: 'STRING', value });
const field = (name: string, content: unknown) => ({ type: 'FIELD', name, content });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
const repeat = (content: unknown) => ({ type: 'REPEAT', content });
const alias = (content: unknown, value: string) => ({ type: 'ALIAS', content, named: true, value });

const origin: CopyOrigin = { kind: 'narrow', owner: 'owner', path: 'x:' };

const grammar = (rules: Record<string, unknown> = {}) =>
	verbCtxOf({
		name: 'g',
		rules: {
			owner: field('x', sym('_choice')),
			_choice: choice(sym('a'), sym('b'), sym('c')),
			pair: seq(field('left', sym('_choice')), str(':'), field('right', sym('_choice'))),
			a: str('a'),
			b: str('b'),
			c: str('c'),
			...rules
		},
		supertypes: [],
		inline: []
	});

function narrowAt(ctx: VerbCtx, ref: unknown, admits: readonly LeadMatch[], direction: NarrowDirection, sites: ReadonlyMap<string, number> = new Map()): unknown {
	return applyNarrow({ ref, context: 'owner', origin, reach: new Set(), sites, positions: NO_POSITIONS }, admits, direction, ctx);
}

const refusal = (ctx: VerbCtx, apply: () => unknown) => {
	const refused = refusalOf(ctx, () => void apply());
	return refused === undefined ? undefined : [refused.code, refused.reason];
};

describe('narrow', () => {
	it('keeps only the admits at the site, copying the hidden rule it changes rather than changing it', () => {
		const ctx = grammar();
		expect(narrowAt(ctx, sym('_choice'), [match('a'), match('b')], 'keep')).toEqual(sym('_choice_owner'));
		expect(ctx.rules._choice_owner).toEqual(choice(sym('a'), sym('b')));
		expect(ctx.rules._choice).toEqual(choice(sym('a'), sym('b'), sym('c')));
		expect(ctx.effects).toEqual([expect.objectContaining({ kind: 'copy', copy: '_choice_owner', source: '_choice', context: 'owner', origin })]);
	});

	it('gives the one admitted arm itself, with no copy', () => {
		const ctx = grammar();
		expect(narrowAt(ctx, sym('_choice'), [match('a')], 'keep')).toEqual(sym('a'));
		expect(ctx.created).toEqual([]);
	});

	it('copies a visible kind narrowed within an admit, shown as the admit\'s as or as <kind>_<context>', () => {
		const ctx = grammar({ owner: field('x', choice(sym('pair'), sym('a'))) });
		expect(narrowAt(ctx, choice(sym('pair'), sym('a')), [match('pair', { left: [match('b')] })], 'keep')).toEqual(alias(sym('_pair_owner'), 'pair_owner'));
		expect(ctx.rules._pair_owner).toEqual(seq(field('left', sym('b')), str(':'), field('right', sym('_choice'))));
		expect(ctx.effects).toEqual([expect.objectContaining({ copy: '_pair_owner', source: 'pair', display: 'pair_owner', admitted: 'pair' })]);
		expect(narrowAt(grammar(), sym('pair'), [match('pair', { left: [match('b')] }, 'left_b')], 'keep')).toEqual(alias(sym('_pair_owner'), 'left_b'));
	});

	it('leaves the site no arm as no result, which the entry refuses in its own words', () => {
		expect(narrowAt(grammar(), sym('_choice'), [match('pair')], 'keep')).toBeUndefined();
		expect(narrowAt(grammar(), sym('a'), [match('a')], 'except')).toBeUndefined();
	});
});

describe('narrow.except', () => {
	it('narrows a hidden rule only this site reaches in place', () => {
		const ctx = grammar();
		expect(narrowAt(ctx, sym('_choice'), [match('a')], 'except', new Map([['_choice', 1]]))).toEqual(sym('_choice'));
		expect(ctx.rules._choice).toEqual(choice(sym('b'), sym('c')));
		expect(ctx.created).toEqual([]);
	});

	it('copies a hidden rule other rules also reach', () => {
		const ctx = grammar();
		expect(narrowAt(ctx, sym('_choice'), [match('a')], 'except', new Map([['_choice', 3]]))).toEqual(sym('_choice_owner'));
		expect(ctx.rules._choice_owner).toEqual(choice(sym('b'), sym('c')));
		expect(ctx.rules._choice).toEqual(choice(sym('a'), sym('b'), sym('c')));
	});

	it('narrows a visible kind within an admit in place, everywhere the kind appears', () => {
		const ctx = grammar({ _choice: choice(sym('a'), sym('b')), owner: field('x', sym('pair')) });
		expect(narrowAt(ctx, sym('pair'), [match('pair', { right: [match('a')] })], 'except', new Map([['_choice', 1]]))).toEqual(sym('pair'));
		expect(ctx.rules.pair).toEqual(seq(field('left', sym('_choice')), str(':'), field('right', sym('b'))));
	});
});

describe("narrow's refusals", () => {
	it('an admit naming a kind twice', () => {
		const ctx = grammar();
		expect(refusal(ctx, () => narrowAt(ctx, sym('_choice'), [match('a'), match('a')], 'keep'))).toEqual(['narrow-invalid', "it admits 'a' twice"]);
	});

	it('a field it reaches into left with no arm', () => {
		const ctx = grammar();
		expect(refusal(ctx, () => narrowAt(ctx, sym('pair'), [match('pair', { left: [match('missing')] })], 'keep'))).toEqual([
			'narrow-invalid',
			"it leaves field 'left' of 'pair' empty"
		]);
	});

	it('a within naming no position, several, or one under a repeat', () => {
		const ctx = grammar({ listed: repeat(field('item', sym('_choice'))), twice: seq(sym('_choice'), str(':'), sym('_choice')) });
		expect(refusal(ctx, () => narrowAt(ctx, sym('pair'), [match('pair', { middle: [match('a')] })], 'keep'))).toEqual([
			'narrow-invalid',
			"the restriction of field 'middle' names no position in 'pair'"
		]);
		expect(refusal(ctx, () => narrowAt(ctx, sym('twice'), [match('twice', [match('a')])], 'keep'))).toEqual([
			'narrow-invalid',
			"the restriction of an unfielded child names 2 positions in 'twice'"
		]);
		expect(refusal(ctx, () => narrowAt(ctx, sym('listed'), [match('listed', { item: [match('a')] })], 'keep'))).toEqual([
			'narrow-invalid',
			"the restriction of field 'item' sits under a repeat in 'listed'"
		]);
	});

	it('an admitted kind where the narrowing cannot divide it', () => {
		const ctx = grammar({ _wrapped: seq(str('('), sym('a'), str(')')) });
		expect(refusal(ctx, () => narrowAt(ctx, choice(sym('_wrapped'), sym('b')), [match('a')], 'keep'))).toEqual(['narrow-invalid', "'a' sits where the split cannot divide it"]);
	});

	it('a kind admitted within that has no rule', () => {
		const ctx = grammar();
		expect(refusal(ctx, () => narrowAt(ctx, alias(str('&'), 'amp'), [match('amp', [match('a')])], 'keep'))).toEqual(['narrow-invalid', "'amp' has no rule to narrow"]);
	});

	it('a rule an earlier narrowing reached, changed in place, is edit-site-conflict', () => {
		const ctx = grammar();
		ctx.reached.set('_choice', 'rows');
		expect(refusal(ctx, () => narrowAt(ctx, sym('_choice'), [match('a')], 'except', new Map([['_choice', 1]])))).toEqual([
			'edit-site-conflict',
			"'_choice' narrows in place, but the lead on 'rows' holds it in its item"
		]);
		expect(ctx.rules._choice).toEqual(choice(sym('a'), sym('b'), sym('c')));
	});
});
