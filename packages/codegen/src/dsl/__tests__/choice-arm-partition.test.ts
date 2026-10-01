import { describe, expect, it } from 'vitest';
import type { AnyRule, ChoiceRule } from '../../types/rule.ts';
import { dslArmStage, isTopologyMixed, partitionChoiceArms, simplifyArmStage } from '../choice-arm-partition.ts';

const sym = (name: string): AnyRule => ({ type: 'SYMBOL', name }) as AnyRule;
const str = (value: string): AnyRule => ({ type: 'STRING', value }) as AnyRule;
const field = (name: string, content: AnyRule): AnyRule => ({ type: 'FIELD', name, content }) as AnyRule;
const choice = (...members: AnyRule[]): ChoiceRule<'simplify'> =>
	({ type: 'CHOICE', members }) as unknown as ChoiceRule<'simplify'>;

describe('partitionChoiceArms', () => {
	it('classifies a FIELD wrapper arm as degenerate named at the DSL stage', () => {
		const p = partitionChoiceArms(choice(field('name', sym('_property_name')), sym('enum_assignment')), dslArmStage);
		expect(p.degenerateNamedArms).toHaveLength(1);
		expect(p.unionArms).toHaveLength(1);
		expect(isTopologyMixed(p)).toBe(true);
	});

	it('looks through precedence wrappers at the DSL stage', () => {
		const prec = { type: 'PREC', value: 1, content: field('quantifier', sym('quantifier')) } as AnyRule;
		const p = partitionChoiceArms(choice(prec, sym('capture')), dslArmStage);
		expect(p.degenerateNamedArms).toHaveLength(1);
		expect(p.unionArms).toHaveLength(1);
	});

	it('classifies a fieldName-stamped arm as degenerate named at the simplify stage', () => {
		const stamped = { ...sym('quantifier'), fieldName: 'quantifier' } as AnyRule;
		const p = partitionChoiceArms(choice(stamped, sym('capture')), simplifyArmStage);
		expect(p.degenerateNamedArms).toHaveLength(1);
		expect(p.unionArms).toHaveLength(1);
		expect(isTopologyMixed(p)).toBe(true);
	});

	it('reads a tree-sitter optional, CHOICE(x, BLANK), the same as OPTIONAL(x) at the DSL stage', () => {
		const blank = { type: 'BLANK' } as unknown as AnyRule;
		const tsOptional = choice({ type: 'CHOICE', members: [field('name', sym('n')), blank] } as AnyRule, {
			type: 'CHOICE',
			members: [{ type: 'REPEAT', content: { type: 'CHOICE', members: [sym('a'), blank] } } as AnyRule, blank]
		} as AnyRule);
		const sittirOptional = choice({ type: 'OPTIONAL', content: field('name', sym('n')) } as AnyRule, {
			type: 'OPTIONAL',
			content: { type: 'REPEAT', content: { type: 'OPTIONAL', content: sym('a') } }
		} as AnyRule);
		const shape = (p: ReturnType<typeof partitionChoiceArms>) => Object.values(p).map((arms) => arms.length);
		expect(shape(partitionChoiceArms(tsOptional, dslArmStage))).toEqual(shape(partitionChoiceArms(sittirOptional, dslArmStage)));
		expect(shape(partitionChoiceArms(tsOptional, dslArmStage))).toEqual([1, 0, 1, 0, 0]);
	});

	it('is not topology-mixed for a union of kinds, nor for fields with different names', () => {
		expect(isTopologyMixed(partitionChoiceArms(choice(sym('a'), sym('b'), str('x')), dslArmStage))).toBe(false);
		const fields = choice(field('a', sym('a')), field('b', sym('b')));
		expect(isTopologyMixed(partitionChoiceArms(fields, dslArmStage))).toBe(false);
	});

	it('is topology-mixed for a union arm beside a structured arm', () => {
		const seq = { type: 'SEQ', members: [str('('), sym('b'), str(')')] } as AnyRule;
		expect(isTopologyMixed(partitionChoiceArms(choice(sym('a'), seq), dslArmStage))).toBe(true);
	});
});
