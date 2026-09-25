import { ALIAS, CHOICE, FIELD, PATTERN, SEQ, STRING, SUPERTYPE, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enrich } from '../enrich.ts';
import { transform } from '../transform/transform.ts';
import { field } from '../primitives/field.ts';
import { variant } from '../primitives/variant.ts';
import { withWireContext } from '../wire/wire.ts';
import { getEnrichAutomaticVariants, isSupertypeOwner, relabelledArm } from '../automatic-variants.ts';
import { link } from '../../compiler/link.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import { variantChildrenOf } from '../../compiler/variant-structural.ts';
import { armFactsOf } from '../../compiler/model/node-map.ts';
import type { Rule, RuleAnnotations } from '../../types/rule.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

type Arm = { readonly type?: string; readonly annotations?: RuleAnnotations; readonly content?: Arm; readonly members?: readonly Arm[] };
type Members = { readonly members: readonly Arm[] };

function enriched(rules: Record<string, Rule<'evaluate'>>) {
	return enrich({ grammar: { name: 'test', rules } }) as unknown as { grammar: { rules: Record<string, Rule<'evaluate'>> } };
}

const choiceOf = (rule: unknown): Members => (rule as { members: unknown[] }).members[1] as Members;
const labelOf = (arm: Arm): RuleAnnotations | undefined => arm.annotations ?? arm.content?.annotations;
const variantLabel = (annotations: RuleAnnotations | undefined): Pick<RuleAnnotations, 'variant' | 'variantOf'> | undefined =>
	annotations?.variantOf === undefined
		? undefined
		: { ...(annotations.variant === undefined ? {} : { variant: annotations.variant }), variantOf: annotations.variantOf };

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
		const { result } = withWireContext(
			'pick',
			() => {
				const authored = transform(base.grammar.rules.pick as unknown as RuntimeRule, { '1/1': variant('yellow') });
				return transform(authored, { 1: field('fruit') });
			},
			base
		);
		const choice = (result as unknown as { members: { content: Members }[] }).members[1]!.content;
		expect(choice.members.map((arm) => variantLabel(labelOf(arm)))).toEqual([undefined, { variant: 'yellow', variantOf: 'pick' }]);
	});

	it('strips the automatic variant of an arm a patch fields directly', () => {
		const base = enriched({ pick, ...leaves });
		const { result } = withWireContext('pick', () => transform(base.grammar.rules.pick as unknown as RuntimeRule, { '1/0': field('fruit') }), base);
		const fielded = choiceOf(result).members[0]!;
		expect(fielded.type).toBe(FIELD);
		expect(variantLabel(labelOf(fielded.content!))).toBeUndefined();
		expect(variantLabel(labelOf(choiceOf(result).members[1]!))).toEqual({ variant: 'banana', variantOf: 'pick' });
	});

	it('strips the automatic variant of a labelled group reference a patch fields', () => {
		const rules = {
			basket: { type: SEQ, members: [{ type: STRING, value: 'basket' }, { type: SYMBOL, name: '_basket_fruit' }] },
			_basket_fruit: { ...choiceOf(pick), type: CHOICE, annotations: { hoisted: true } },
			...leaves
		} as unknown as Record<string, Rule<'evaluate'>>;
		const base = enriched(rules);
		const reference = (base.grammar.rules.basket as unknown as Members).members[1]!;
		expect(variantLabel(labelOf(reference))).toEqual({ variant: 'fruit', variantOf: 'basket' });
		const { result } = withWireContext('basket', () => transform(base.grammar.rules.basket as unknown as RuntimeRule, { 1: field('fruit') }), base);
		expect(variantLabel(labelOf((result as unknown as Members).members[1]!.content!))).toBeUndefined();
	});

	it('labels arms through prec, including the arms of a prec-wrapped choice', () => {
		const ranked = {
			type: SEQ,
			members: [
				{ type: STRING, value: 'ranked' },
				{
					type: CHOICE,
					members: [
						{ type: 'PREC', value: 1, content: { type: SYMBOL, name: 'a' } },
						{ type: 'PREC', value: 2, content: { type: CHOICE, members: [{ type: SYMBOL, name: 'b' }, { type: SYMBOL, name: 'c' }] } },
						{ type: SYMBOL, name: 'd' }
					]
				}
			]
		} as unknown as Rule<'evaluate'>;
		const letters = Object.fromEntries(['a', 'b', 'c', 'd'].map((n) => [n, { type: STRING, value: n }])) as Record<string, Rule<'evaluate'>>;
		const [a, bc, d] = choiceOf(enriched({ ranked, ...letters }).grammar.rules.ranked).members;
		const labels = [a!.content!, ...bc!.content!.members!, d!].map((arm) => variantLabel(labelOf(arm)));
		expect(labels).toEqual(['a', 'b', 'c', 'd'].map((name) => ({ variant: name, variantOf: 'ranked' })));
	});

	it('names the members of a hidden supertype by the supertype member rule', () => {
		const rules = {
			_expression: { type: CHOICE, members: [{ type: SYMBOL, name: 'binary_expression' }, { type: SYMBOL, name: 'unary_expression' }] },
			binary_expression: { type: STRING, value: '+' },
			unary_expression: { type: STRING, value: '-' }
		} as Record<string, Rule<'evaluate'>>;
		const members = (enriched(rules).grammar.rules._expression as unknown as Members).members;
		expect(members.map((arm) => labelOf(arm)?.variant)).toEqual(['binary', 'unary']);
	});

	it('reads definedBy enrich from an automatic label and override from an authored one', () => {
		const base = enriched({ pick, ...leaves });
		const { result, ctx } = withWireContext('pick', () => transform(base.grammar.rules.pick as unknown as RuntimeRule, { '1/1': variant('yellow') }), base);
		expect(variantChildrenOf('pick', result as never, ctx.automaticVariants).map((child) => [child.name, child.definedBy])).toEqual([
			['apple', 'enrich'],
			['yellow', 'override']
		]);
	});

	it('names a literal arm from its resolved token kind, by the supertype member rule under a supertype owner', () => {
		expect(armFactsOf({ annotations: { variantOf: 'logic' }, resolvedKind: 'logic_and' }, undefined)).toEqual({ variant: 'and', variantOf: 'logic' });
		const tokens = {
			kindEntries: [
				{ kind: 'or_keyword', id: 1, literalText: 'or', anon: true, keyword: true },
				{ kind: 'pipe_pipe', id: 2, literalText: '||', anon: true }
			]
		} as never;
		expect(armFactsOf({ annotations: { variantOf: 'logic' }, resolvedKind: 'or_keyword' }, tokens)).toEqual({ variant: 'or', variantOf: 'logic' });
		expect(armFactsOf({ annotations: { variantOf: 'logic' }, resolvedKind: 'pipe_pipe' }, tokens)).toEqual({ variant: 'pipe_pipe', variantOf: 'logic' });
		const supertypeOwner = { simplifiedRules: { _literal: { type: SUPERTYPE } } } as never;
		expect(armFactsOf({ annotations: { variantOf: '_literal' }, resolvedKind: 'true_literal' }, supertypeOwner)).toEqual({ variant: 'true', variantOf: '_literal' });
	});

	it('keeps an authored variant() that spells the automatic name when a patch fields the slot', () => {
		const base = enriched({ pick, ...leaves });
		const { result } = withWireContext(
			'pick',
			() => {
				const authored = transform(base.grammar.rules.pick as unknown as RuntimeRule, { '1/0': variant('apple', { default: true }) });
				return transform(authored, { 1: field('fruit') });
			},
			base
		);
		const choice = (result as unknown as { members: { content: Members }[] }).members[1]!.content;
		expect(choice.members.map(labelOf)).toEqual([{ variant: 'apple', variantOf: 'pick', default: true }, undefined]);
	});
});

describe('the supertype recognizer', () => {
	const sym = (name: string) => ({ type: SYMBOL, name });
	const shapes = {
		'a prec-wrapped choice': { type: 'PREC', value: 1, content: { type: CHOICE, members: [sym('a_thing'), sym('b_thing')] } },
		'a choice holding a choice': { type: CHOICE, members: [sym('a_thing'), { type: CHOICE, members: [sym('b_thing'), sym('c_thing')] }] }
	};
	for (const [label, body] of Object.entries(shapes)) {
		it(`classifies ${label} the same in link and in the stamp`, () => {
			const rules = {
				root: { type: SEQ, members: [{ type: STRING, value: 'r' }, sym('_thing')] },
				_thing: body,
				a_thing: { type: PATTERN, value: 'a' },
				b_thing: { type: PATTERN, value: 'b' },
				c_thing: { type: PATTERN, value: 'c' }
			} as unknown as Record<string, Rule<'evaluate'>>;
			const raw = {
				name: 'probe',
				rules: structuredClone(rules),
				ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
				extras: [],
				externals: [],
				supertypes: [],
				factoryInline: [],
				inline: [],
				conflicts: [],
				precedences: [],
				word: null,
				references: []
			} as unknown as RawGrammar;
			const linked = link(raw).rules._thing?.type === SUPERTYPE;
			expect(isSupertypeOwner('_thing', rules, new Set(), new Set())).toBe(linked);
		});
	}
});

describe('relabelling an arm', () => {
	const site = { type: ALIAS, content: { type: SYMBOL, name: 'shown_source' }, named: true, value: 'shown' };

	it('keeps an authored label whole', () => {
		const original = { type: SYMBOL, name: 'x', annotations: { variant: 'mine', variantOf: 'p', default: true } };
		const out = relabelledArm(site, original, { keys: new Set(), supertypeOwners: new Set() }) as Arm;
		expect(labelOf(out)).toEqual({ variant: 'mine', variantOf: 'p', default: true });
	});

	it('restamps an automatic label from the new site and records it as automatic', () => {
		const stamped = enriched({
			p: { type: SEQ, members: [{ type: STRING, value: 'p' }, { type: CHOICE, members: [{ type: SYMBOL, name: 'x' }, { type: SYMBOL, name: 'y' }] }] },
			x: { type: STRING, value: 'x' },
			y: { type: STRING, value: 'y' }
		} as Record<string, Rule<'evaluate'>>);
		const record = getEnrichAutomaticVariants(stamped)!;
		const before = record.keys.size;
		const out = relabelledArm(site, choiceOf(stamped.grammar.rules.p).members[0]!, record) as Arm;
		expect(labelOf(out)).toEqual({ variant: 'shown', variantOf: 'p' });
		expect(record.keys.size).toBe(before + 1);
	});
});
