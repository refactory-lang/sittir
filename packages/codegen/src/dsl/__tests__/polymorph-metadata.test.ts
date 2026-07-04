import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { transform } from '../transform/transform.ts';
import { variant } from '../primitives/variant.ts';
import { withWireContext } from '../wire/wire.ts';
import type { Rule } from '../../types/rule.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

const sym = (name: string): Rule => ({ type: 'SYMBOL', name }) as Rule;
const str = (value: string): Rule => ({ type: 'STRING', value }) as Rule;

beforeAll(() => {
	installFakeDsl();
});
afterAll(() => {
	restoreFakeDsl();
});

describe('polymorph metadata registration', () => {
	// R12/decision-7 V2 Task 2: `WireContext.polymorphVariants` (the
	// wire-registered `{parent, child}` pair channel) is deleted —
	// variant-adoption pairs are now discovered STRUCTURALLY downstream
	// (`deriveStructuralVariantChildren`, compiler/variant-structural.ts)
	// from the alias-mint shape `transform()` still resolves here. This
	// suite now asserts the SURVIVING resolution behavior directly:
	// each variant() placeholder deposits its hidden-rule body and the
	// choice arm resolves to a named `alias($._hidden, $.visible)` —
	// exactly the structural fact the downstream derivation keys on.
	it('resolves variant placeholders into deposited hidden rules + named alias arms', () => {
		const original = {
			type: 'SEQ',
			members: [
				sym('left'),
				{
					type: 'CHOICE',
					members: [
						{ type: 'SEQ', members: [str('='), sym('right')] },
						{ type: 'SEQ', members: [str(':'), sym('type')] }
					]
				}
			]
		} as Rule;

		const { ctx, result } = withWireContext('assignment', () => {
			return transform(original, {
				'1/0': variant('eq'),
				'1/1': variant('type')
			});
		});

		expect([...ctx.deposits.keys()].sort()).toEqual(['_assignment_eq', '_assignment_type']);
		const choice = (result as unknown as { members: unknown[] }).members[1] as { members: unknown[] };
		expect(choice.members).toEqual([
			{ type: 'ALIAS', content: { type: 'SYMBOL', name: '_assignment_eq' }, named: true, value: 'assignment_eq' },
			{ type: 'ALIAS', content: { type: 'SYMBOL', name: '_assignment_type' }, named: true, value: 'assignment_type' }
		]);
	});

	it('throws when variant() is used without a current rule kind', () => {
		const original = {
			type: 'SEQ',
			members: [sym('a'), { type: 'CHOICE', members: [sym('b'), sym('c')] }]
		} as Rule;

		expect(() => {
			withWireContext(null, () => {
				transform(original, {
					'1/0': variant('b')
				});
			});
		}).toThrow(/no current rule kind/);
	});

	it('accumulates deposited hidden rules independently across separate wire contexts', () => {
		// A bare `sym()` arm (no anonymous token) is unmaterializable
		// (`variantBranchIsUnmaterializable`) and deposits nothing; use a
		// SEQ-with-literal arm shape so the mint actually fires.
		const makeChoice = (aVal: string, bVal: string) =>
			({
				type: 'SEQ',
				members: [
					{
						type: 'CHOICE',
						members: [
							{ type: 'SEQ', members: [str(aVal), sym('x')] },
							{ type: 'SEQ', members: [str(bVal), sym('y')] }
						]
					}
				]
			}) as Rule;

		const { ctx: ctx1 } = withWireContext('rule_one', () => {
			transform(makeChoice('=', ':'), { '0/0': variant('a'), '0/1': variant('b') });
		});
		const { ctx: ctx2 } = withWireContext('rule_two', () => {
			transform(makeChoice('+', '-'), { '0/0': variant('x') });
		});

		expect([...ctx1.deposits.keys()].sort()).toEqual(['_rule_one_a', '_rule_one_b']);
		expect([...ctx2.deposits.keys()].sort()).toEqual(['_rule_two_x']);
	});
});
