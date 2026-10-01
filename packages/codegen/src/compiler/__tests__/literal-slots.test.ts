import { CHOICE, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { attributeBuilder, isSlotPromotedLiteral } from '../../dsl/builders.ts';
import { flattenRules } from '../flatten.ts';
import type { Rule } from '../../types/rule.ts';

const str = (value: string) => ({ type: STRING, value }) as unknown as Rule;
const sym = (name: string) => ({ type: SYMBOL, name }) as unknown as Rule;
const seq = (...members: Rule[]) => ({ type: SEQ, members }) as unknown as Rule;
const choice = (...members: Rule[]) => ({ type: CHOICE, members }) as unknown as Rule;

describe('attributeBuilder.alias of a literal', () => {
	it('promotes a literal aliased to a named symbol to a slot', () => {
		const aliased = attributeBuilder.alias(attributeBuilder.string('?'), { type: SYMBOL, name: 'lazy', nonterminal: true, kindId: 7 });
		expect(isSlotPromotedLiteral(aliased)).toBe(true);
		expect(aliased).toMatchObject({ aliasedTo: 'lazy', aliasedToId: 7 });
	});

	it('keeps a literal aliased to an anonymous string render-only', () => {
		const aliased = attributeBuilder.alias(attributeBuilder.string('?'), 'lazy');
		expect(isSlotPromotedLiteral(aliased)).toBe(false);
	});
});

describe('flattenRules — literals shared by every arm of a distributed choice', () => {
	const flattened = (rule: Rule) => flattenRules({ owner: rule } as never).owner as unknown as { type: string; members: { type: string; value?: string; members?: unknown[] }[] };

	it('factors the shared prefix and suffix around a choice of the differing middles', () => {
		const out = flattened(choice(seq(str('{'), sym('arm'), str('}')), seq(str('{'), str(','), sym('digits'), str('}'))));
		expect(out.type).toBe(SEQ);
		expect(out.members.map((m) => m.value ?? m.type)).toEqual(['{', CHOICE, '}']);
		expect(out.members[1]!.members).toHaveLength(2);
	});

	it('leaves arms that share no literal at either end as they are', () => {
		const out = flattened(choice(seq(str('('), sym('a')), seq(str('['), sym('b'))));
		expect(out.type).toBe(CHOICE);
	});

	it('does not factor a literal that only some arms carry', () => {
		const out = flattened(choice(seq(str('{'), sym('a')), seq(sym('b'), sym('c'))));
		expect(out.type).toBe(CHOICE);
	});
});
