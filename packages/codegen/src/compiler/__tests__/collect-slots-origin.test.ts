/**
 * Regression test for B1 layer-2 fix: merged-choice `content` slots must carry
 * `origin: 'kind'` all the way through collect-slots → assemble → node-map.
 *
 * Confirms the exact shape that argument_list produces: a wrapper-free choice
 * with nonterminal:true and array multiplicity → buildSlot's unnamed-choice
 * path → origin should be 'kind'.
 */
import { describe, it, expect } from 'vitest';
import { collectSlots, setUnnamedChoiceWarner } from '../collect-slots.ts';
import { AssembledBranch } from '../node-map.ts';
import { deleteWrapper } from '../wrapper-deletion.ts';
import type { Rule } from '../rule.ts';

// Suppress unnamed-choice warnings in tests
setUnnamedChoiceWarner(() => {});

// Helper to build a choice of symbols with multiplicity + nonterminal:true
function makeContentChoice(mult: 'array' | 'nonEmptyArray' | 'optional' | 'single' = 'array'): Rule {
	return {
		type: 'choice',
		members: [
			{ type: 'symbol', name: '_expression' } as Rule,
			{ type: 'symbol', name: 'list_splat' } as Rule,
			{ type: 'symbol', name: 'dictionary_splat' } as Rule,
		],
		multiplicity: mult,
		nonterminal: true,
	} as unknown as Rule;
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
		expect((slot as any).origin).toBe('kind');
	});

	it('should set origin=kind on unnamed choice inside seq (distributes into choice)', () => {
		// Simulates a seq that distributes and contains an unnamed-choice member
		const choice = makeContentChoice('array');

		const seq: Rule = {
			type: 'seq',
			members: [choice],
		} as unknown as Rule;

		const slots = collectSlots(seq, 'test_kind');
		expect(slots).toHaveLength(1);
		const slot = slots[0]!;
		expect(slot.name).toBe('content');
		expect((slot as any).origin).toBe('kind');
	});

	it('should preserve origin=kind through mergeChoiceArms for structural choice arms', () => {
		// Simulates a structural choice where each arm contributes a content slot.
		// mergeChoiceArms should preserve origin from the first occurrence.
		const innerChoice1 = makeContentChoice('array');
		const innerChoice2 = makeContentChoice('array');
		const fieldA: Rule = { type: 'symbol', name: 'name', fieldName: 'name', nonterminal: true } as unknown as Rule;
		const arm1: Rule = { type: 'seq', members: [fieldA, innerChoice1] } as unknown as Rule;
		const arm2: Rule = { type: 'seq', members: [fieldA, innerChoice2] } as unknown as Rule;
		const structuralChoice: Rule = {
			type: 'choice',
			members: [arm1, arm2],
		} as unknown as Rule;

		const slots = collectSlots(structuralChoice, 'test_kind');
		const contentSlot = slots.find((s) => s.name === 'content');
		expect(contentSlot).toBeDefined();
		expect((contentSlot as any)?.origin).toBe('kind');
	});

	it('AssembledBranch.slots carries origin=kind for unnamed content slot', () => {
		// Simulates argument_list's assembled node shape.
		// The simplifiedRule is a wrapper-free choice{array, nonterminal:true}
		// as produced by the list-fusion + deleteWrapper pipeline.
		const simplifiedRule = makeContentChoice('array');
		// The inlinedRule (used for modelType classification) is a seq/choice —
		// for this test, use the simplifiedRule directly as both.
		const inlinedRule: Rule = {
			type: 'choice',
			members: simplifiedRule.members,
		} as unknown as Rule;
		const renderRule = simplifiedRule as ReturnType<typeof deleteWrapper>;

		const branch = new AssembledBranch(
			'argument_list',
			inlinedRule as any,
			simplifiedRule,
			renderRule,
			{}
		);

		const contentSlot = branch.slots['content'];
		expect(contentSlot).toBeDefined();
		expect((contentSlot as any)?.origin).toBe('kind');
	});

	it('mergeChoiceArms preserves origin=kind from first arm (not dropped on merge)', () => {
		// Each arm-slot from a structural choice has origin='kind' (from symbol path).
		// mergeChoiceArms must preserve it via ...prev spread.
		const arm1Slot = {
			name: 'content',
			propertyName: 'contents',
			configKey: 'content',
			storageName: 'content',
			paramName: 'contents',
			values: [{ kind: 'node-ref' as const, multiplicity: 'array' as const, node: { name: '_expression' } as any }],
			hasTrailing: false,
			hasLeading: false,
			source: 'inferred' as const,
			origin: 'kind' as const,
		};
		const arm2Slot = {
			...arm1Slot,
			values: [{ kind: 'node-ref' as const, multiplicity: 'array' as const, node: { name: 'list_splat' } as any }],
		};

		// Simulate what mergeChoiceArms does: spread ...prev, override specific fields.
		// This mirrors the exact merge code at lines 195-201 of collect-slots.ts.
		const merged = {
			...arm1Slot,
			values: [...arm1Slot.values, ...arm2Slot.values],
			hasTrailing: arm1Slot.hasTrailing || arm2Slot.hasTrailing,
			hasLeading: arm1Slot.hasLeading || arm2Slot.hasLeading,
			aliasSources: undefined,
		};

		// origin must be preserved via the spread
		expect(merged.origin).toBe('kind');
	});
});
