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
	it('registers variant when alias placeholder is resolved in transform', () => {
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

		const { ctx } = withWireContext('assignment', () => {
			transform(original, {
				'1/0': variant('eq'),
				'1/1': variant('type')
			});
		});

		expect(ctx.polymorphVariants.filter((v) => v.parent === 'assignment')).toEqual([
			{ parent: 'assignment', child: 'eq' },
			{ parent: 'assignment', child: 'type' }
		]);
		expect(ctx.deposits.size).toBe(2);
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

	it('accumulates variants from multiple rules', () => {
		const makeChoice = () =>
			({
				type: 'SEQ',
				members: [{ type: 'CHOICE', members: [sym('a'), sym('b')] }]
			}) as Rule;

		const { ctx: ctx1 } = withWireContext('rule_one', () => {
			transform(makeChoice(), { '0/0': variant('a'), '0/1': variant('b') });
		});
		const { ctx: ctx2 } = withWireContext('rule_two', () => {
			transform(makeChoice(), { '0/0': variant('x') });
		});

		expect(ctx1.polymorphVariants).toEqual([
			{ parent: 'rule_one', child: 'a' },
			{ parent: 'rule_one', child: 'b' }
		]);
		expect(ctx2.polymorphVariants).toEqual([{ parent: 'rule_two', child: 'x' }]);
	});
});
