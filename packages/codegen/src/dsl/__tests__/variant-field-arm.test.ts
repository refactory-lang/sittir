import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { transform } from '../transform/transform.ts';
import { variant } from '../primitives/variant.ts';
import { field } from '../primitives/field.ts';
import { enrich } from '../enrich.ts';
import { withWireContext } from '../wire/wire.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

describe('variant() on a field arm', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	it('keeps the field of a single-symbol field arm', () => {
		const { result } = withWireContext('suffix', () => {
			const original = {
				type: 'CHOICE',
				members: [
					{ type: 'SYMBOL', name: 'capture' },
					{ type: 'FIELD', name: 'quantifier', content: { type: 'SYMBOL', name: 'quantifier' } }
				]
			} as any;
			return transform(original, { 1: variant('quantifier') }) as any;
		});
		const arm = result.members[1];
		expect(arm.type).toBe('FIELD');
		expect(arm.name).toBe('quantifier');
		expect(arm.content).toMatchObject({ type: 'SYMBOL', name: 'quantifier' });
	});
});

describe('patches reaching an element supertype', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	const sym = (name: string) => ({ type: 'SYMBOL', name });
	const str = (value: string) => ({ type: 'STRING', value });
	const suffix = () => ({
		type: 'REPEAT',
		content: { type: 'CHOICE', members: [sym('capture'), { type: 'FIELD', name: 'quantifier', content: sym('quantifier') }] }
	});
	const enriched = () =>
		enrich({
			grammar: {
				name: 'test',
				rules: { capture: str('@c'), quantifier: str('*'), list: { type: 'SEQ', members: [str('('), str(')'), suffix()] } },
				supertypes: []
			}
		} as never) as any;

	function patchList(patches: Record<string, unknown>) {
		const base = enriched();
		return withWireContext('list', () => transform(base.grammar.rules.list, patches as never) as any, base);
	}

	it('names a variant after the supertype and labels it a variant of the supertype', () => {
		const { ctx } = patchList({ '2/0/0/1': variant('suffix') });
		expect(ctx.liftNames.get('list_element_quantifier')).toEqual({ name: 'list_element_suffix', hoisted: false });
		const arm = (ctx.liftBodies.get('_list_element') as any).members[1];
		expect(arm.annotations).toMatchObject({ variant: 'suffix', variantOf: '_list_element' });
	});

	it('rejects two names for one arm of the supertype', () => {
		const base = enriched();
		const twice = () =>
			withWireContext(
				'list',
				() => {
					transform(base.grammar.rules.list, { '2/0/0/1': variant('suffix') } as never);
					transform(base.grammar.rules.list, { '2/0/0/1': variant('other') } as never);
				},
				base
			);
		expect(twice).toThrow(/list_element_suffix.*list_element_other/);
	});

	it('rejects a field patch that names the slot differently from the supertype', () => {
		expect(() => patchList({ 2: field('items') })).toThrow(/'_list_element'.*'elements'/);
	});
});
