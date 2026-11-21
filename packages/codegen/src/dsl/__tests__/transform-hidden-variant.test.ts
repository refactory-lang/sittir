import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { transform } from '../transform/transform.ts';
import { variant } from '../primitives/variant.ts';
import { withWireContext } from '../wire/wire.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';

type Node = { type: string; name?: string; value?: string; content?: Node; members?: Node[]; annotations?: { variant?: string; default?: boolean } };

const sym = (name: string) => ({ type: 'SYMBOL', name }) as never;

describe('variant() on an arm that is a bare hidden symbol', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	it('mints a kind for each arm that holds the hidden rule, as an alias of a hidden symbol does', () => {
		const { result, ctx } = withWireContext('quoted', () => {
			const g = globalThis as any;
			return transform(g.choice(sym('_line'), sym('_block')), { 0: variant('line', { default: true }), 1: variant('text_block') }) as unknown as Node;
		});
		expect(result.members!.map((arm) => [arm.type, arm.name, arm.annotations?.variant, arm.annotations?.default === true])).toEqual([
			['SYMBOL', 'quoted_line', 'line', true],
			['SYMBOL', 'quoted_text_block', 'text_block', false]
		]);
		expect([...ctx.deposits.keys()].sort()).toEqual(['quoted_line', 'quoted_text_block']);
		expect((ctx.deposits.get('quoted_line') as unknown as Node).name).toBe('_line');
		expect((ctx.deposits.get('quoted_text_block') as unknown as Node).name).toBe('_block');
	});

	it('mints nothing for an arm whose hidden rule is a supertype, beside an arm that mints', () => {
		const str = (value: string) => ({ type: 'STRING', value });
		const base = {
			grammar: {
				supertypes: [sym('_declared')],
				rules: {
					_line: { type: 'SEQ', members: [str('"'), str('"')] },
					_union: { type: 'CHOICE', members: [sym('a'), { type: 'PREC', value: 1, content: sym('b') }] },
					_declared: { type: 'CHOICE', members: [sym('a'), { type: 'SEQ', members: [sym('b'), str(';')] }] }
				}
			}
		};
		const { result, ctx } = withWireContext(
			'quoted',
			() => {
				const g = globalThis as any;
				return transform(g.choice(sym('_line'), sym('_union'), sym('_declared')), {
					0: variant('line', { default: true }),
					1: variant('union'),
					2: variant('declared')
				}) as unknown as Node;
			},
			base
		);
		expect(result.members!.map((arm) => [arm.type, arm.name])).toEqual([
			['SYMBOL', 'quoted_line'],
			['SYMBOL', '_union'],
			['SYMBOL', '_declared']
		]);
		expect([...ctx.deposits.keys()]).toEqual(['quoted_line']);
	});
});

describe('variant() on an arm that names no kind', () => {
	it('warns for a dispatch union arm and a bare kind arm, each with its reason, beside an arm that mints', async () => {
		const raw = await evaluateTempGrammar(
			{ extras: '', rules: "owner: ($) => choice($._line, $._union, $.leaf), _line: () => seq('\"', '\"'), _union: ($) => choice($.leaf, $.other), leaf: () => 'x', other: () => 'y'" },
			'',
			{ bindings: "edits: { owner: { 0: variant('line'), 1: variant('union'), 2: variant('leaf') } }" }
		);
		expect(raw.rules).toHaveProperty('owner_line');
		expect(raw.rules).not.toHaveProperty('owner_union');
		expect(raw.rules).not.toHaveProperty('owner_leaf');
		expect(raw.layerDiagnostics).toEqual([
			expect.objectContaining({ code: 'variant-names-no-kind', severity: 'warning', ownerKind: 'owner', details: expect.objectContaining({ variant: 'union', path: '1' }), message: expect.stringMatching(/node level/) }),
			expect.objectContaining({ code: 'variant-names-no-kind', severity: 'info', ownerKind: 'owner', details: expect.objectContaining({ variant: 'leaf', path: '2' }), message: expect.stringMatching(/no token of its own/) })
		]);
	}, 60_000);
});
