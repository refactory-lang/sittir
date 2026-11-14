import { describe, expect, it } from 'vitest';
import type { GrammarRule } from '../../../grammar-shapes/grammar-json.ts';
import type { Rule } from '../../../types/rule.ts';
import { alignRuleIds } from '../join-seams/rule-ids.ts';
import { canonicalRuleTree } from '../../canonical-rules.ts';
import { buildRuleCatalog } from '../../rule-catalog.ts';

const id = (path: string): string => `rule:r:${path}`;

describe('alignRuleIds', () => {
	it('gives each parser grammar node the evaluated rule ids it stands for', () => {
		const minus: GrammarRule = { type: 'STRING', value: '-' };
		const operand: GrammarRule = { type: 'SYMBOL', name: 'x' };
		const optional: GrammarRule = { type: 'CHOICE', members: [operand, { type: 'BLANK' }] };
		const seq: GrammarRule = { type: 'SEQ', members: [{ type: 'BLANK' }, minus, optional] };
		const root: GrammarRule = { type: 'PREC', value: 1, content: seq };
		const evaluated: Rule<'evaluate'> = {
			type: 'SEQ',
			id: id('root'),
			members: [
				{ type: 'STRING', value: '-', id: id('members.0') },
				{ type: 'OPTIONAL', id: id('members.1'), content: { type: 'SYMBOL', name: 'x', id: id('members.1/content') } }
			]
		};
		const { idsOf, unaligned } = alignRuleIds({ r: root }, { r: evaluated });
		expect(unaligned).toEqual([]);
		expect(idsOf.get(root)).toEqual([id('root')]);
		expect(idsOf.get(seq)).toEqual([id('root')]);
		expect(idsOf.get(minus)).toEqual([id('members.0')]);
		expect(idsOf.get(optional)).toEqual([id('members.1')]);
		expect(idsOf.get(operand)).toEqual([id('members.1/content')]);
	});

	it('reads an optional repeat as the evaluated repeat and stops at a token', () => {
		const item: GrammarRule = { type: 'SYMBOL', name: 'x' };
		const many: GrammarRule = { type: 'CHOICE', members: [{ type: 'REPEAT1', content: item }, { type: 'BLANK' }] };
		const word: GrammarRule = {
			type: 'IMMEDIATE_TOKEN',
			content: { type: 'PREC', value: 2, content: { type: 'STRING', value: 'w' } }
		};
		const root: GrammarRule = { type: 'SEQ', members: [many, word] };
		const evaluated: Rule<'evaluate'> = {
			type: 'SEQ',
			id: id('root'),
			members: [
				{ type: 'REPEAT', id: id('members.0'), content: { type: 'SYMBOL', name: 'x', id: id('members.0/content') } },
				{ type: 'TOKEN', id: id('members.1'), content: { type: 'STRING', value: 'w', id: id('members.1/content') } }
			]
		} as Rule<'evaluate'>;
		const { idsOf, unaligned } = alignRuleIds({ r: root }, { r: evaluated });
		expect(unaligned).toEqual([]);
		expect(idsOf.get(many)).toEqual([id('members.0')]);
		expect(idsOf.get(item)).toEqual([id('members.0/content')]);
		expect(idsOf.get(word)).toEqual([id('members.1')]);
	});

	describe('reads each collapse the compile boundary makes', () => {
		const x: GrammarRule = { type: 'SYMBOL', name: 'x' };
		const y: GrammarRule = { type: 'SYMBOL', name: 'y' };
		const blank: GrammarRule = { type: 'BLANK' };
		const optionalOf = (content: GrammarRule): GrammarRule => ({ type: 'CHOICE', members: [content, blank] });
		const field = (content: GrammarRule): GrammarRule => ({ type: 'FIELD', name: 'f', content });
		const aligned = (
			root: GrammarRule
		): { readonly idsOf: ReadonlyMap<GrammarRule, readonly string[]>; readonly unaligned: readonly string[] } => {
			const evaluated = buildRuleCatalog({ r: canonicalRuleTree(root as Rule<'evaluate'>) }, { roots: ['r'] }).rules;
			return alignRuleIds({ r: root }, evaluated);
		};

		it('an optional around an optional', () => {
			const inner = field(x);
			const root: GrammarRule = {
				type: 'SEQ',
				members: [
					{ type: 'STRING', value: '(' },
					optionalOf({ type: 'SEQ', members: [optionalOf(inner)] }),
					{ type: 'STRING', value: ')' }
				]
			};
			const { idsOf, unaligned } = aligned(root);
			expect(unaligned).toEqual([]);
			expect(idsOf.get(inner)).toEqual([id('members.1/content')]);
			expect(idsOf.get(x)).toEqual([id('members.1/content/content')]);
		});

		it('an optional around a repeat, and a repeat around an optional', () => {
			const repeat: GrammarRule = { type: 'REPEAT', content: x };
			const repeated: GrammarRule = { type: 'REPEAT', content: optionalOf(y) };
			const { idsOf, unaligned } = aligned({ type: 'SEQ', members: [optionalOf(repeat), repeated] });
			expect(unaligned).toEqual([]);
			expect(idsOf.get(repeat)).toEqual([id('members.0')]);
			expect(idsOf.get(x)).toEqual([id('members.0/content')]);
			expect(idsOf.get(repeated)).toEqual([id('members.1')]);
			expect(idsOf.get(y)).toEqual([id('members.1/content')]);
		});

		it('a choice of fields with one name, and an optional choice of three arms', () => {
			const left = field(x);
			const right = field(y);
			const w: GrammarRule = { type: 'SYMBOL', name: 'w' };
			const z: GrammarRule = { type: 'STRING', value: 'z' };
			const { idsOf, unaligned } = aligned({
				type: 'SEQ',
				members: [
					{ type: 'CHOICE', members: [left, right] },
					{ type: 'CHOICE', members: [w, z, blank] }
				]
			});
			expect(unaligned).toEqual([]);
			expect(idsOf.get(left)).toEqual([id('members.0')]);
			expect(idsOf.get(right)).toEqual([id('members.0')]);
			expect(idsOf.get(z)).toEqual([id('members.1/content/members.1')]);
		});

		it('a choice of fields with one name whose other arm holds a field of the same shape', () => {
			const left = field(x);
			const inner: GrammarRule = { type: 'FIELD', name: 'g', content: y };
			const right = field({ type: 'SEQ', members: [{ type: 'STRING', value: '=' }, inner] });
			const { idsOf, unaligned } = aligned({ type: 'CHOICE', members: [left, right] });
			expect(unaligned).toEqual([]);
			expect(idsOf.get(left)).toEqual([id('root')]);
			expect(idsOf.get(x)).toEqual([id('content/members.0')]);
			expect(idsOf.get(inner)).toEqual([id('content/members.1/members.1')]);
			expect(idsOf.get(y)).toEqual([id('content/members.1/members.1/content')]);
		});

		it('a choice of fields with one name whose other arm holds the same field', () => {
			const again: GrammarRule = { type: 'SYMBOL', name: 'x' };
			const inner = field(again);
			const { idsOf, unaligned } = aligned({
				type: 'CHOICE',
				members: [
					field(x),
					field({
						type: 'SEQ',
						members: [{ type: 'STRING', value: '(' }, inner, { type: 'STRING', value: ')' }]
					})
				]
			});
			expect(unaligned).toEqual([]);
			expect(idsOf.get(x)).toEqual([id('content/members.0')]);
			expect(idsOf.get(inner)).toEqual([id('content/members.1/members.1')]);
			expect(idsOf.get(again)).toEqual([id('content/members.1/members.1/content')]);
		});
	});

	it('reads an optional in the encoding the evaluated rules were built from, an optional of nothing included', () => {
		const nothing: GrammarRule = { type: 'CHOICE', members: [{ type: 'BLANK' }, { type: 'BLANK' }] };
		const a: GrammarRule = { type: 'STRING', value: 'a' };
		const built = {
			type: 'SEQ',
			members: [
				{ type: 'OPTIONAL', content: { type: 'BLANK' } },
				{ type: 'STRING', value: 'a' }
			]
		} as Rule<'evaluate'>;
		const evaluated = buildRuleCatalog({ r: canonicalRuleTree(built) }, { roots: ['r'] }).rules;
		const { idsOf, unaligned } = alignRuleIds({ r: { type: 'SEQ', members: [nothing, a] } }, evaluated);
		expect(unaligned).toEqual([]);
		expect(idsOf.get(nothing)).toEqual([id('members.0')]);
		expect(idsOf.get(a)).toEqual([id('members.1')]);
	});

	it('names a node whose shapes disagree', () => {
		const root: GrammarRule = {
			type: 'SEQ',
			members: [
				{ type: 'STRING', value: 'a' },
				{ type: 'STRING', value: 'b' }
			]
		};
		const evaluated: Rule<'evaluate'> = { type: 'STRING', value: 'ab', id: id('root') };
		expect(alignRuleIds({ r: root }, { r: evaluated }).unaligned).toEqual(['r: SEQ is STRING (rule:r:root)']);
	});
});
