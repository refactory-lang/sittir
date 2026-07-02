/**
 * enrich-clause-hoist.test.ts — unit tests for the enrich clause-hoist pass.
 *
 * The pass lives in `dsl/enrich.ts` and hoists `optional(seq(…))` patterns
 * into a hidden `_<parent>_optional<N>` group injected into
 * `base.grammar.rules`, so tree-sitter (kindId) AND the IR see it from one source.
 *
 * Predicate (generalized from old clause-only check):
 *   • `ruleMatchesEmpty(seqBody)` → leave un-hoisted (tree-sitter rejects empty named rules)
 *   • `isInlineSafe(seqBody)` → hoist (exactly ONE field/symbol slot after dropping literals)
 *   • else (inline-unsafe: bare-choice slot OR ≥2 slots) → leave inline for applyAutoGroups
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enrich } from '../enrich.ts';
import type { Rule } from '../../types/rule.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';
import { readRuleMetadata } from '../rule-metadata.ts';

// enrich's builders call the runtime-injected DSL constructors
// (globalThis.field/symbol/alias); install the fakes for these raw enrich()
// calls so construction resolves to the sittir-lowercase shapes.
beforeAll(() => installFakeDsl());
afterAll(() => restoreFakeDsl());

function mkGrammar(rules: Record<string, unknown>) {
	return { grammar: { name: 'test', rules } };
}

function runEnrich(input: ReturnType<typeof mkGrammar>) {
	return enrich(input as unknown as Parameters<typeof enrich>[0]) as unknown as {
		grammar: { name: string; rules: Record<string, unknown> };
	};
}

// ---------------------------------------------------------------------------
// (a) optional(seq(STRING, field(x, SYMBOL))) → optional(SYMBOL(_parent_optional1))
//     AND base.grammar.rules['_parent_optional1'] == the original seq,
//     with source:'group-lift' on the rewritten member.
// ---------------------------------------------------------------------------

describe('enrich clause-hoist pass — basic optional(seq(STRING, FIELD))', () => {
	it('hoists optional(seq(string, field)) into _parent_optional1', () => {
		const input = mkGrammar({
			parent: {
				type: 'SEQ',
				members: [
					{ type: 'FIELD', name: 'name', content: { type: 'SYMBOL', name: 'identifier' } },
					{
						type: 'OPTIONAL',
						content: {
							type: 'SEQ',
							members: [
								{ type: 'STRING', value: 'for' },
								{ type: 'FIELD', name: 'x', content: { type: 'SYMBOL', name: 'expr' } }
							]
						}
					}
				]
			}
		});
		const result = runEnrich(input);
		const rules = result.grammar.rules;

		// The hidden group must have been injected
		expect(rules['_parent_optional1']).toBeDefined();
		const hoisted = rules['_parent_optional1'] as { type: string; members?: unknown[] };
		expect(hoisted.type).toBe('SEQ');
		expect(hoisted.members!.length).toBe(2);

		// The parent's optional member must now reference the symbol
		const parent = rules.parent as { type: string; members: Array<unknown> };
		const optMember = parent.members[1] as {
			type: string;
			content: { type: string; name: string; metadata?: unknown };
		};
		expect(optMember.type).toBe('OPTIONAL');
		expect(optMember.content.type).toBe('SYMBOL');
		expect(optMember.content.name).toBe('_parent_optional1');
		// (debt PR-P1) `SymbolRule.source` is deleted; the fact relocated into
		// the opaque `metadata` bag as `symbolSource`.
		expect(readRuleMetadata(optMember.content.metadata)?.symbolSource).toBe('group-lift');
	});

	it('slot-count preservation: parent top-level member count unchanged', () => {
		const input = mkGrammar({
			parent: {
				type: 'SEQ',
				members: [
					{ type: 'FIELD', name: 'a', content: { type: 'SYMBOL', name: 'A' } },
					{
						type: 'OPTIONAL',
						content: {
							type: 'SEQ',
							members: [
								{ type: 'STRING', value: '=' },
								{ type: 'FIELD', name: 'b', content: { type: 'SYMBOL', name: 'B' } }
							]
						}
					},
					{ type: 'STRING', value: ';' }
				]
			}
		});
		const result = runEnrich(input);
		const parent = result.grammar.rules.parent as { type: string; members: unknown[] };
		// 3 members: field(a), optional(SYMBOL(...)), string(;)
		expect(parent.members.length).toBe(3);
	});
});

// ---------------------------------------------------------------------------
// (b) The tree-sitter-normalized CHOICE[seq, BLANK] form descends identically
// ---------------------------------------------------------------------------

describe('enrich clause-hoist pass — CHOICE[seq, BLANK] form', () => {
	it('hoists CHOICE[seq(string, field), BLANK] into _parent_optional1', () => {
		const seqBody = {
			type: 'SEQ',
			members: [
				{ type: 'STRING', value: 'impl' },
				{ type: 'FIELD', name: 'trait', content: { type: 'SYMBOL', name: 'trait_type' } }
			]
		};
		const input = mkGrammar({
			parent: {
				type: 'SEQ',
				members: [
					{ type: 'STRING', value: 'abstract' },
					{
						type: 'CHOICE',
						members: [
							seqBody,
							{ type: 'BLANK' }
						]
					}
				]
			}
		});
		const result = runEnrich(input);
		const rules = result.grammar.rules;

		// The hidden group must have been injected
		expect(rules['_parent_optional1']).toBeDefined();

		// The CHOICE[seq, BLANK] must be rewritten to CHOICE[SYMBOL(...), BLANK]
		const parent = rules.parent as { type: string; members: unknown[] };
		const choiceMember = parent.members[1] as {
			type: string;
			members: Array<{ type: string; name?: string; metadata?: unknown }>;
		};
		expect(choiceMember.type).toBe('CHOICE');
		const nonBlank = choiceMember.members.find((m) => m.type !== 'BLANK');
		expect(nonBlank).toBeDefined();
		expect(nonBlank!.type).toBe('SYMBOL');
		expect(nonBlank!.name).toBe('_parent_optional1');
		// (debt PR-P1) `SymbolRule.source` is deleted; relocated to
		// `metadata.symbolSource`.
		expect(readRuleMetadata(nonBlank!.metadata)?.symbolSource).toBe('group-lift');
	});

	it('lowercase choice[seq, blank] form also descends', () => {
		const input = mkGrammar({
			parent: {
				type: 'SEQ',
				members: [
					{
						type: 'CHOICE',
						members: [
							{
								type: 'SEQ',
								members: [
									{ type: 'STRING', value: 'for' },
									{ type: 'FIELD', name: 'iter', content: { type: 'SYMBOL', name: 'expr' } }
								]
							},
							{ type: 'BLANK' }
						]
					}
				]
			}
		});
		const result = runEnrich(input);
		const rules = result.grammar.rules;
		expect(rules['_parent_optional1']).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// (c) Predicate: fires on seq with ≥1 string + ≥1 field (multi-member);
//     does NOT fire on optional(field(X)) or optional(seq(field, field))
// ---------------------------------------------------------------------------

describe('enrich clause-hoist pass — predicate exactness', () => {
	it('does NOT fire on multi-slot seq (string + 2 fields) — inline-unsafe, left for applyAutoGroups', () => {
		// seq('trait', field('name', …), field('bounds', …)) — 3 members, 2 field slots
		// isInlineSafe requires exactly 1 slot; 2 slots → inline-unsafe → not hoisted by enrich.
		const input = mkGrammar({
			parent: {
				type: 'SEQ',
				members: [
					{
						type: 'OPTIONAL',
						content: {
							type: 'SEQ',
							members: [
								{ type: 'STRING', value: 'trait' },
								{ type: 'FIELD', name: 'trait_name', content: { type: 'SYMBOL', name: 'trait_type' } },
								{ type: 'FIELD', name: 'bounds', content: { type: 'SYMBOL', name: 'type_bounds' } }
							]
						}
					}
				]
			}
		});
		const result = runEnrich(input);
		// 2 slots → inline-unsafe → applyAutoGroups handles this, enrich leaves it inline
		const synthKinds = Object.keys(result.grammar.rules).filter((k) => /^_parent_optional\d+$/.test(k));
		expect(synthKinds).toEqual([]);
	});

	it('does NOT fire on optional(field(X)) — no seq inside', () => {
		const input = mkGrammar({
			parent: {
				type: 'SEQ',
				members: [
					{
						type: 'OPTIONAL',
						content: {
							type: 'FIELD',
							name: 'x',
							content: { type: 'SYMBOL', name: 'expr' }
						}
					}
				]
			}
		});
		const result = runEnrich(input);
		const synthKinds = Object.keys(result.grammar.rules).filter((k) => /^_parent_optional\d+$/.test(k));
		expect(synthKinds).toEqual([]);
	});

	it('does NOT fire on optional(seq(field, field)) — 2 slots, inline-unsafe', () => {
		// seq(field('a', A), field('b', B)) — 2 slots after dropping literals.
		// isInlineSafe requires exactly 1 slot; 2 slots → inline-unsafe → not hoisted by enrich.
		const input = mkGrammar({
			parent: {
				type: 'SEQ',
				members: [
					{
						type: 'OPTIONAL',
						content: {
							type: 'SEQ',
							members: [
								{ type: 'FIELD', name: 'a', content: { type: 'SYMBOL', name: 'A' } },
								{ type: 'FIELD', name: 'b', content: { type: 'SYMBOL', name: 'B' } }
							]
						}
					}
				]
			}
		});
		const result = runEnrich(input);
		const synthKinds = Object.keys(result.grammar.rules).filter((k) => /^_parent_optional\d+$/.test(k));
		expect(synthKinds).toEqual([]);
	});

	it('does NOT fire on optional(seq(symbol, symbol)) — 2 slots, inline-unsafe', () => {
		// seq(sym('A'), sym('B')) — 2 symbol slots.
		// isInlineSafe requires exactly 1 slot; 2 slots → inline-unsafe → not hoisted by enrich.
		const input = mkGrammar({
			parent: {
				type: 'SEQ',
				members: [
					{
						type: 'OPTIONAL',
						content: {
							type: 'SEQ',
							members: [
								{ type: 'SYMBOL', name: 'A' },
								{ type: 'SYMBOL', name: 'B' }
							]
						}
					}
				]
			}
		});
		const result = runEnrich(input);
		const synthKinds = Object.keys(result.grammar.rules).filter((k) => /^_parent_optional\d+$/.test(k));
		expect(synthKinds).toEqual([]);
	});

	it('fires when string comes after field in the seq (any order)', () => {
		const input = mkGrammar({
			parent: {
				type: 'SEQ',
				members: [
					{
						type: 'OPTIONAL',
						content: {
							type: 'SEQ',
							members: [
								{ type: 'FIELD', name: 'value', content: { type: 'SYMBOL', name: 'expr' } },
								{ type: 'STRING', value: ';' }
							]
						}
					}
				]
			}
		});
		const result = runEnrich(input);
		// has string + field → should fire
		expect(result.grammar.rules['_parent_optional1']).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// (d) Per-parent 1-indexed counter + cross-parent dedupe
// ---------------------------------------------------------------------------

describe('enrich clause-hoist pass — naming and dedupe', () => {
	it('per-parent counter increments for distinct clause seqs within the same parent', () => {
		const input = mkGrammar({
			parent: {
				type: 'SEQ',
				members: [
					{
						type: 'OPTIONAL',
						content: {
							type: 'SEQ',
							members: [
								{ type: 'STRING', value: 'for' },
								{ type: 'FIELD', name: 'a', content: { type: 'SYMBOL', name: 'A' } }
							]
						}
					},
					{
						type: 'OPTIONAL',
						content: {
							type: 'SEQ',
							members: [
								{ type: 'STRING', value: 'where' },
								{ type: 'FIELD', name: 'b', content: { type: 'SYMBOL', name: 'B' } }
							]
						}
					}
				]
			}
		});
		const result = runEnrich(input);
		const rules = result.grammar.rules;
		expect(rules['_parent_optional1']).toBeDefined();
		expect(rules['_parent_optional2']).toBeDefined();
	});

	it('collision: does not overwrite an existing rule with the synthesized name', () => {
		const input = mkGrammar({
			parent: {
				type: 'SEQ',
				members: [
					{
						type: 'OPTIONAL',
						content: {
							type: 'SEQ',
							members: [
								{ type: 'STRING', value: 'for' },
								{ type: 'FIELD', name: 'x', content: { type: 'SYMBOL', name: 'A' } }
							]
						}
					}
				]
			},
			_parent_optional1: { type: 'STRING', value: 'PRESERVED' }
		});
		const result = runEnrich(input);
		// The pre-existing rule must not be overwritten
		const preserved = result.grammar.rules['_parent_optional1'] as { type: string; value?: string };
		expect(preserved.type).toBe('STRING');
		expect(preserved.value).toBe('PRESERVED');
	});
});
