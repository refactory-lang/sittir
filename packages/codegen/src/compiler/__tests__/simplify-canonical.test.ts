/**
 * Tests for the spec-013 `simplifyRule` transformation pipeline.
 *
 * Each test freezes the canonical shape produced for a minimal input
 * fragment. The simplifyRule function is idempotent — running it
 * twice produces the same output — and shape-preserving for rules
 * that are already canonical or don't match the merge-compatible
 * pattern.
 *
 * Note: `simplifyRule`'s input must be field-node-free (see simplify.ts
 * JSDoc). Field-containing inputs are now passed directly to
 * `mergeBranchesForChoice` (which still handles them) rather than going
 * through `simplifyRule`, matching the actual production call graph
 * (simplifyChoiceRule calls mergeBranchesForChoice with already-simplified
 * field-free members).
 */

import { CHOICE, FIELD, OPTIONAL, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import type { AnyRule, Rule, RenderRule } from '../../types/rule.ts';
import type { ChoiceRule } from '../../types/rule.ts';
import { simplifyRule } from '../simplify.ts';
import { mergeBranchesForChoice } from '../simplify.ts';
import { attributeBuilder } from '../../dsl/builders.ts';
import { flattenRules } from '../flatten.ts';

const str = (value: string): Rule<'link'> => ({ type: STRING, value });
const sym = (name: string): Rule<'link'> => ({ type: SYMBOL, name });
const field = (name: string, content: Rule<'link'>): Rule<'link'> => ({
	type: FIELD,
	name,
	content
});
const seq = (...members: Rule<'link'>[]): Rule<'link'> => ({ type: SEQ, members });
const choice = (...members: Rule<'link'>[]): Rule<'link'> => ({ type: CHOICE, members });
const optional = (content: Rule<'link'>): Rule<'link'> => ({ type: OPTIONAL, content });
/**
 * Helper: result of pushing a field wrapper down to its content as leaf attrs,
 * exactly as `flattenRules(field(name, content))` produces.
 */
const fieldAttrs = (name: string, content: AnyRule): Rule =>
	({
		...content,
		fieldName: name,
		nonterminal: true
	}) as Rule;

describe('mergeBranchesForChoice — same-shape branches (wrapper-free input)', () => {
	// simplify only ever sees wrapper-free rules: a field arrives as
	// `fieldName`+`nonterminal` on its content, never as a FieldRule.

	it('merges branches whose positions are pairwise identical', () => {
		const input = choice(
			seq(sym('expr'), fieldAttrs('op', str('+')), sym('expr')),
			seq(sym('expr'), fieldAttrs('op', str('+')), sym('expr'))
		) as ChoiceRule;
		const result = mergeBranchesForChoice(input);
		expect(result.type).toBe('SEQ');
		const members = (result as { members: Rule[] }).members;
		expect(members).toHaveLength(3);
		expect(members[0]).toEqual(sym('expr'));
		expect(members[1]).toEqual(fieldAttrs('op', str('+')));
		expect(members[2]).toEqual(sym('expr'));
	});

	it('does NOT merge when a slot-promoted literal differs at a position', () => {
		const input = choice(
			seq(sym('expr'), fieldAttrs('op', str('+')), sym('expr')),
			seq(sym('expr'), fieldAttrs('op', str('-')), sym('expr'))
		) as ChoiceRule;
		const result = mergeBranchesForChoice(input);
		expect(result.type).toBe('CHOICE');
		expect((result as { members: Rule[] }).members).toHaveLength(2);
	});

	it('does NOT merge when branches differ in MEMBER KIND at a position', () => {
		const input = choice(seq(fieldAttrs('op', str('='))), seq(sym('assignment_expression'))) as ChoiceRule;
		const result = mergeBranchesForChoice(input);
		expect(result.type).toBe('CHOICE');
	});

	it('leaves homogeneous-collapsed choices alone (choice of bare symbols)', () => {
		const input = choice(sym('a'), sym('b'), sym('c')) as ChoiceRule;
		// No seq structure to merge — stays as a choice. Supertype /
		// enum classification handles this kind downstream.
		const result = mergeBranchesForChoice(input);
		expect(result.type).toBe('CHOICE');
		expect((result as { members: Rule[] }).members).toHaveLength(3);
	});
});

describe('simplifyRule — field-free input (wrapper-deleted)', () => {
	// simplifyRule's input must be field-node-free. These tests use
	// flattenRules to convert field wrappers to attributes first,
	// then call simplifyRule.

	it('is idempotent on field-free choice-of-seqs', () => {
		const raw = choice(
			seq(field('op', str('+')), field('r', sym('expr'))),
			seq(field('op', str('-')), field('r', sym('expr')))
		);
		const fieldFree = flattenRules({ x: raw }).x!;
		const once = simplifyRule(fieldFree as Rule);
		const twice = simplifyRule(once);
		expect(twice).toEqual(once);
	});

	it('collapses a single-member choice to its member', () => {
		const raw = choice(sym('a'));
		const fieldFree = flattenRules({ x: raw }).x!;
		const result = simplifyRule(fieldFree as Rule);
		expect(result.type).toBe('SYMBOL');
	});

	it('simplifyRule throws on a raw OPTIONAL node (deleted handler — use attributeBuilder instead)', () => {
		// simplifyOptionalRule was deleted: OPTIONAL nodes must be converted to
		// multiplicity attrs by flattenRules before reaching simplify, or
		// built via ctx.builder (attributeBuilder) at construction sites within
		// simplify (e.g. the empty-match fold in simplifyChoiceRule). A raw OPTIONAL
		// hitting simplifyRule is a bug and now throws immediately.
		const raw = optional(str(','));
		expect(() => simplifyRule(raw as Rule)).toThrow(/unexpected rule type 'OPTIONAL'/);
	});

	it('attributeBuilder.optional strips bare anonymous string delimiters (replaces simplifyOptionalRule)', () => {
		// The behavior previously in simplifyOptionalRule is now in attributeBuilder.optional.
		// optional(',') without nonterminal → bare delimiter → collapses to empty-seq attrs.
		const result = attributeBuilder.optional({ type: STRING, value: ',' });
		// flatten({type:OPTIONAL, content: str(',')}) on a non-slot-promoted string
		// produces empty-seq (no leaves carry multiplicity when the content is stripped).
		// The STRING is bare (no nonterminal), so the content is treated as a delimiter.
		// Result: {type:SEQ, members:[]} sentinel.
		expect(result.type).toBe('SEQ');
		expect((result as { members: Rule[] }).members).toHaveLength(0);
	});

	it('preserves slot-promoted literals (nonterminal=true) inside optional', () => {
		// A string with nonterminal:true (from a field wrapper) is
		// slot-data and must survive simplify. Simulate slot-promotion by using
		// a field wrapper: field('kw', str('static')) → wrapper-deleted →
		// str('static', {fieldName:'kw', nonterminal:true}).
		const wrapped = { x: optional(field('kw', str('static'))) };
		const fieldFree = flattenRules(wrapped).x!;
		const result = simplifyRule(fieldFree as Rule);
		// The optional wraps a nonterminal string → stays as optional (not stripped)
		expect(result.type).not.toBe('SEQ');
	});
});

// ---------------------------------------------------------------------------
// separator sub-rule recursion (PR-S task 4)
// ---------------------------------------------------------------------------

describe('separator sub-rules go through the same simplification as ordinary content', () => {
	it('collapses a single-member choice inside a separator down to that member', () => {
		const rule = {
			type: SYMBOL,
			name: 'item',
			separator: {
				value: { type: CHOICE, members: [{ type: STRING, value: ',' }] }
			}
		} as unknown as RenderRule;
		const out = simplifyRule(rule) as unknown as { separator: { value: { type: string; value?: string } } };
		expect(out.separator.value).toEqual({ type: STRING, value: ',' });
	});
});

// ---------------------------------------------------------------------------
// simplifyRule recursion complexity (PR-S task 4 follow-up)
// ---------------------------------------------------------------------------

describe('simplifyRule recursion is linear, not exponential, in tree depth', () => {
	it('completes quickly on a ~250-deep right-nested seq chain', () => {
		// Regression test for a bug where an earlier revision passed
		// `simplifyRule` itself as the `visit` callback to `ctx.walker.map` —
		// since `simplifyRule` ALSO calls `ctx.walker.map` internally, every
		// node's subtree was walked twice: once by `map`'s own internal
		// recursion, once more when `visit` re-invoked `map` on the same
		// already-recursed node. That compounds at every level of nesting
		// (T(n) = 2*T(n-1)) — a depth-250 chain would never finish. The fix
		// (`simplifyRule` calls `ctx.walker.map` exactly once with a
		// non-recursive `simplifyDispatch` visitor, then dispatches the root
		// once more) makes this O(n). A depth of 250 is chosen to be deep
		// enough that O(2^n) would hang/time out while O(n) finishes
		// effectively instantly — the wall-clock bound below is generous
		// (well under the exponential case's cost at even depth ~30).
		const DEPTH = 250;
		let rule: Rule<'link'> = { type: SYMBOL, name: 'leaf' };
		for (let i = 0; i < DEPTH; i++) {
			rule = { type: SEQ, members: [{ type: SYMBOL, name: `s${i}` }, rule] };
		}

		const start = performance.now();
		const out = simplifyRule(rule as unknown as RenderRule);
		const elapsedMs = performance.now() - start;

		// Sanity: recursion actually reached every leaf.
		const countSymbols = (r: unknown): number => {
			if (!r || typeof r !== 'object') return 0;
			const node = r as { type: string; members?: unknown[]; content?: unknown };
			if (node.type === SYMBOL) return 1;
			return (node.members ?? [node.content]).reduce<number>((sum, m) => sum + countSymbols(m), 0);
		};
		expect(countSymbols(out)).toBe(DEPTH + 1);

		// Linear recursion completes near-instantly; exponential would blow
		// well past this even at a fraction of DEPTH's nesting.
		expect(elapsedMs).toBeLessThan(2000);
	});
});
