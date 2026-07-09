/**
 * Regression test for B1 layer-2 fix: merged-choice `content` slots must be
 * identified as unnamed all the way through collect-slots → assemble → node-map.
 *
 * Confirms the exact shape that argument_list produces: a wrapper-free choice
 * with nonterminal:true and array multiplicity → buildSlot's unnamed-choice
 * path → an unnamed `content` slot (`slot.isUnnamed === true`). (Pre-PR-C this
 * was asserted via the now-deleted `origin === 'kind'` shim; `isUnnamed` is the
 * structural signal that replaced it.)
 */
import { describe, it, expect } from 'vitest';
import { collectSlots, setUnnamedChoiceWarner } from '../collect-slots.ts';
import { AssembledBranch } from '../model/node-map.ts';
import { deleteWrapper } from '../wrapper-deletion.ts';
import type { Rule } from '../../types/rule.ts';

// Suppress unnamed-choice warnings in tests
setUnnamedChoiceWarner(() => {});

type ChoiceRule = Extract<Rule, { type: 'CHOICE' }>;

// Helper to build a choice of symbols with multiplicity + nonterminal:true
function makeContentChoice(mult: 'array' | 'nonEmptyArray' | 'optional' | 'single' = 'array'): ChoiceRule {
	return {
		type: 'CHOICE',
		members: [
			{ type: 'SYMBOL', name: '_expression' } as Rule,
			{ type: 'SYMBOL', name: 'list_splat' } as Rule,
			{ type: 'SYMBOL', name: 'dictionary_splat' } as Rule
		],
		multiplicity: mult,
		nonterminal: true
	} as ChoiceRule;
}

describe('collectSlots: origin on unnamed content slot', () => {
	it('should set origin=kind on unnamed choice (non-structural)', () => {
		// Simulates argument_list's wrapper-free simplified rule:
		// a choice of symbol refs with multiplicity:array, nonterminal:true
		const rule = makeContentChoice('array');

		const slots = collectSlots(rule, 'argument_list');
		expect(slots).toHaveLength(1);
		const slot = slots[0]!;
		expect(slot.name).toBe('content');
		expect(slot.isUnnamed).toBe(true);
	});

	it('marks unnamed choice inside seq as unnamed (distributes into choice)', () => {
		// Simulates a seq that distributes and contains an unnamed-choice member
		const choice = makeContentChoice('array');

		const seq: Rule = {
			type: 'SEQ',
			members: [choice]
		} as unknown as Rule;

		const slots = collectSlots(seq, 'test_kind');
		expect(slots).toHaveLength(1);
		const slot = slots[0]!;
		expect(slot.name).toBe('content');
		expect(slot.isUnnamed).toBe(true);
	});

	it('keeps the merged content slot unnamed through mergeChoiceArms for structural choice arms', () => {
		// Simulates a structural choice where each arm contributes a content slot.
		// mergeChoiceArms should preserve origin from the first occurrence.
		const innerChoice1 = makeContentChoice('array');
		const innerChoice2 = makeContentChoice('array');
		const fieldA: Rule = { type: 'SYMBOL', name: 'name', fieldName: 'name', nonterminal: true } as unknown as Rule;
		const arm1: Rule = { type: 'SEQ', members: [fieldA, innerChoice1] } as unknown as Rule;
		const arm2: Rule = { type: 'SEQ', members: [fieldA, innerChoice2] } as unknown as Rule;
		const structuralChoice: Rule = {
			type: 'CHOICE',
			members: [arm1, arm2]
		} as unknown as Rule;

		const slots = collectSlots(structuralChoice, 'test_kind');
		const contentSlot = slots.find((s) => s.name === 'content');
		expect(contentSlot).toBeDefined();
		expect(contentSlot?.isUnnamed).toBe(true);
	});

	it('AssembledBranch.slots exposes the unnamed content slot as unnamed', () => {
		// Simulates argument_list's assembled node shape.
		// The simplifiedRule is a wrapper-free choice{array, nonterminal:true}
		// as produced by the list-fusion + deleteWrapper pipeline.
		const simplifiedRule = makeContentChoice('array');
		// The inlinedRule (used for modelType classification) is a seq/choice —
		// for this test, use the simplifiedRule directly as both.
		const inlinedRule: Rule = {
			type: 'CHOICE',
			members: simplifiedRule.members
		} as unknown as Rule;
		const renderRule = simplifiedRule as ReturnType<typeof deleteWrapper>;

		const branch = new AssembledBranch('argument_list', inlinedRule as any, simplifiedRule, renderRule, {});

		const contentSlot = branch.slots['content'];
		expect(contentSlot).toBeDefined();
		expect(contentSlot?.isUnnamed).toBe(true);
	});
});
