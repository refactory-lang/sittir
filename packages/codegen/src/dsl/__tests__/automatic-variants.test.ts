import { CHOICE, FIELD, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enrich } from '../enrich.ts';
import { transform } from '../transform/transform.ts';
import { field } from '../primitives/field.ts';
import { withWireContext } from '../wire/wire.ts';
import type { Rule, RuleAnnotations } from '../../types/rule.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

type Members = { readonly members: readonly { readonly annotations?: RuleAnnotations; readonly content?: { readonly annotations?: RuleAnnotations } }[] };

function enriched(rules: Record<string, Rule<'evaluate'>>) {
	return enrich({ grammar: { name: 'test', rules } }) as unknown as { grammar: { rules: Record<string, Rule<'evaluate'>> } };
}

const choiceOf = (rule: unknown): Members => (rule as { members: unknown[] }).members[1] as Members;
const labelOf = (arm: Members['members'][number]): RuleAnnotations | undefined => arm.annotations ?? arm.content?.annotations;

beforeAll(() => {
	installFakeDsl();
});
afterAll(() => {
	restoreFakeDsl();
});

describe('automatic variants', () => {
	const pick: Rule<'evaluate'> = {
		type: SEQ,
		members: [
			{ type: STRING, value: 'pick' },
			{ type: CHOICE, members: [{ type: SYMBOL, name: 'apple' }, { type: SYMBOL, name: 'banana' }] },
			{ type: STRING, value: 'done' }
		]
	};
	const leaves = { apple: { type: STRING, value: 'a' }, banana: { type: STRING, value: 'b' } } as Record<string, Rule<'evaluate'>>;

	it('stamps each arm of an unfielded choice with its display', () => {
		const base = enriched({ pick, ...leaves });
		expect(choiceOf(base.grammar.rules.pick).members.map(labelOf)).toEqual([
			{ variant: 'apple', variantOf: 'pick' },
			{ variant: 'banana', variantOf: 'pick' }
		]);
	});

	it('gives an upstream-fielded choice no automatic stamp', () => {
		const fielded: Rule<'evaluate'> = { type: SEQ, members: [{ type: STRING, value: 'pick' }, { type: FIELD, name: 'fruit', content: choiceOf(pick) as unknown as Rule<'evaluate'> }] };
		const base = enriched({ pick: fielded, ...leaves });
		const field = (base.grammar.rules.pick as unknown as { members: { content: Members }[] }).members[1]!.content;
		expect(field.members.map(labelOf)).toEqual([undefined, undefined]);
	});

	it("strips enrich's automatic variants when a patch fields the slot, keeping an authored variant()", () => {
		const base = enriched({ pick, ...leaves });
		const stamped = base.grammar.rules.pick as unknown as { members: [unknown, Members, unknown] };
		const [apple] = stamped.members[1].members;
		const authored = { type: SYMBOL, name: 'pick_yellow', annotations: { variant: 'yellow', variantOf: 'pick' } };
		const rule = { ...stamped, members: [stamped.members[0], { ...stamped.members[1], members: [apple, authored] }, stamped.members[2]] };
		const { result } = withWireContext('pick', () => transform(rule as unknown as RuntimeRule, { 1: field('fruit') }), base);
		const choice = (result as unknown as { members: { content: Members }[] }).members[1]!.content;
		expect(choice.members.map((arm) => labelOf(arm)?.variant)).toEqual([undefined, 'yellow']);
	});
});
