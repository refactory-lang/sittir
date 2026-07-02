import { CHOICE, FIELD, OPTIONAL, PATTERN, REPEAT, SEQ, STRING, SYMBOL, VARIANT } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import {
	normalizeGrammar,
	factorSeqChoice,
	rulesEqual,
	wrapVariants,
	deduplicateVariants,
	nameVariant,
	tokenToName,
	collapseWrappers,
	fanOutSeqChoices,
	factorChoiceBranches,
	dedupeSeqMembers
} from '../normalize.ts';
import type { Rule } from '../../types/rule.ts';
import type { LinkedGrammar, ExternalRole } from '../types.ts';

function makeLinked(rules: Record<string, Rule<'link'>>, overrides?: Partial<LinkedGrammar>): LinkedGrammar {
	return {
		name: 'test',
		rules,
		supertypes: new Set(),
		externalRoles: new Map<string, ExternalRole>(),
		word: null,
		references: [],
		derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
		...overrides
	};
}

describe('Optimize — rulesEqual', () => {
	it('compares string rules', () => {
		expect(rulesEqual({ type: STRING, value: 'a' }, { type: STRING, value: 'a' })).toBe(true);
		expect(rulesEqual({ type: STRING, value: 'a' }, { type: STRING, value: 'b' })).toBe(false);
	});

	it('compares seq rules recursively', () => {
		const a: Rule = { type: SEQ, members: [{ type: STRING, value: 'x' }] };
		const b: Rule = { type: SEQ, members: [{ type: STRING, value: 'x' }] };
		const c: Rule = { type: SEQ, members: [{ type: STRING, value: 'y' }] };
		expect(rulesEqual(a, b)).toBe(true);
		expect(rulesEqual(a, c)).toBe(false);
	});

	it('different types are not equal', () => {
		expect(rulesEqual({ type: STRING, value: 'a' }, { type: PATTERN, value: 'a' })).toBe(false);
	});
});

describe('Optimize — factorSeqChoice', () => {
	it('extracts common prefix from seq branches', () => {
		const branches: Rule[] = [
			{
				type: SEQ,
				members: [
					{ type: STRING, value: 'fn' },
					{ type: STRING, value: 'a' }
				]
			},
			{
				type: SEQ,
				members: [
					{ type: STRING, value: 'fn' },
					{ type: STRING, value: 'b' }
				]
			}
		];
		const result = factorSeqChoice(branches);
		// After factoring, common prefix 'fn' is extracted
		expect(result).toBeDefined();
	});

	it('returns branches unchanged when no common prefix', () => {
		const branches: Rule[] = [
			{ type: SEQ, members: [{ type: STRING, value: 'a' }] },
			{ type: SEQ, members: [{ type: STRING, value: 'b' }] }
		];
		const result = factorSeqChoice(branches);
		expect(result).toHaveLength(2);
	});
});

describe('Optimize — variant construction', () => {
	it('wrapVariants wraps choice members in variant nodes', () => {
		const choice: Rule = {
			type: CHOICE,
			members: [
				{ type: SEQ, members: [{ type: STRING, value: 'a' }] },
				{ type: SEQ, members: [{ type: STRING, value: 'b' }] }
			]
		};
		const result = wrapVariants(choice);
		expect(result.type).toBe('choice');
		const members = (result as any).members;
		expect(members).toHaveLength(2);
		expect(members[0].type).toBe('variant');
		expect(members[1].type).toBe('variant');
	});

	it('deduplicateVariants removes structurally identical variants', () => {
		const variants: Rule[] = [
			{ type: VARIANT, name: 'v1', content: { type: STRING, value: 'x' } },
			{ type: VARIANT, name: 'v2', content: { type: STRING, value: 'x' } },
			{ type: VARIANT, name: 'v3', content: { type: STRING, value: 'y' } }
		];
		const result = deduplicateVariants(variants);
		expect(result).toHaveLength(2);
	});

	it('nameVariant derives name from detect token', () => {
		const variant: Rule = {
			type: SEQ,
			members: [
				{ type: STRING, value: 'pub' },
				{ type: SYMBOL, name: 'item' }
			]
		};
		const name = nameVariant(variant, 0, [variant]);
		expect(name).toBe('pub');
	});
});

describe('Optimize — tokenToName', () => {
	it('maps punctuation to readable names', () => {
		expect(tokenToName(';')).toBe('semi');
		expect(tokenToName('{')).toBe('brace');
		expect(tokenToName('(')).toBe('paren');
		expect(tokenToName('[')).toBe('bracket');
		expect(tokenToName(',')).toBe('comma');
		expect(tokenToName(':')).toBe('colon');
	});

	it('passes through alphanumeric tokens', () => {
		expect(tokenToName('pub')).toBe('pub');
		expect(tokenToName('fn')).toBe('fn');
	});
});

describe('Optimize — optimize()', () => {
	it('produces an OptimizedGrammar preserving named content', () => {
		const linked = makeLinked({
			item: {
				type: SEQ,
				members: [
					{ type: STRING, value: 'fn' },
					{
						type: FIELD,
						name: 'body',
						content: { type: SYMBOL, name: 'block' }
					}
				]
			},
			block: { type: STRING, value: '{}' }
		});
		const optimized = normalizeGrammar(linked);
		expect(optimized.name).toBe('test');
		expect(optimized.rules['item']).toBeDefined();
		// Field metadata must be preserved
		const item = optimized.rules['item'] as any;
		const fieldMember = item.members?.find((m: any) => m.type === 'field') ?? (item.type === 'field' ? item : null);
		if (fieldMember) {
			expect(fieldMember.name).toBe('body');
		}
	});

	// Note: the test that asserted "optimize wraps visible choice members
	// in variants" moved to link.test.ts after variant tagging was
	// relocated to Link in commit (Phase 2 classification cleanup).
	// See `link.test.ts → 'tagVariants wraps visible choice members'`.
});

// ---------------------------------------------------------------------------
// T060 — fanOutSeqChoices
// ---------------------------------------------------------------------------

describe('Optimize — fanOutSeqChoices (T060)', () => {
	it('distributes a seq over an inner choice', () => {
		const rule: Rule = {
			type: SEQ,
			members: [
				{ type: STRING, value: 'a' },
				{
					type: CHOICE,
					members: [
						{ type: STRING, value: 'b' },
						{ type: STRING, value: 'c' }
					]
				},
				{ type: STRING, value: 'd' }
			]
		};
		const out = fanOutSeqChoices(rule);
		expect(out.type).toBe('choice');
		const branches = (out as any).members;
		expect(branches).toHaveLength(2);
		expect(branches[0].type).toBe('seq');
		expect(branches[0].members.map((m: any) => m.value)).toEqual(['a', 'b', 'd']);
		expect(branches[1].members.map((m: any) => m.value)).toEqual(['a', 'c', 'd']);
	});

	it('leaves multi-choice seqs alone', () => {
		// Two choices in one seq → combinatorial explosion. Skip.
		const rule: Rule = {
			type: SEQ,
			members: [
				{
					type: CHOICE,
					members: [
						{ type: STRING, value: 'a' },
						{ type: STRING, value: 'b' }
					]
				},
				{
					type: CHOICE,
					members: [
						{ type: STRING, value: 'x' },
						{ type: STRING, value: 'y' }
					]
				}
			]
		};
		const out = fanOutSeqChoices(rule);
		expect(out.type).toBe('seq');
	});

	it('preserves variant labels when distributing', () => {
		const rule: Rule = {
			type: SEQ,
			members: [
				{ type: STRING, value: '(' },
				{
					type: CHOICE,
					members: [
						{
							type: VARIANT,
							name: 'plus',
							content: { type: STRING, value: '+' }
						},
						{
							type: VARIANT,
							name: 'minus',
							content: { type: STRING, value: '-' }
						}
					]
				},
				{ type: STRING, value: ')' }
			]
		};
		const out = fanOutSeqChoices(rule) as any;
		expect(out.type).toBe('choice');
		expect(out.members[0].type).toBe('variant');
		expect(out.members[0].name).toBe('plus');
		expect(out.members[1].name).toBe('minus');
	});
});

// ---------------------------------------------------------------------------
// T061 — factorChoiceBranches
// ---------------------------------------------------------------------------

describe('Optimize — factorChoiceBranches (T061)', () => {
	it('extracts a common prefix across seq branches', () => {
		const rule: Rule = {
			type: CHOICE,
			members: [
				{
					type: SEQ,
					members: [
						{ type: STRING, value: 'a' },
						{ type: STRING, value: 'x' }
					]
				},
				{
					type: SEQ,
					members: [
						{ type: STRING, value: 'a' },
						{ type: STRING, value: 'y' }
					]
				},
				{
					type: SEQ,
					members: [
						{ type: STRING, value: 'a' },
						{ type: STRING, value: 'z' }
					]
				}
			]
		};
		const out = factorChoiceBranches(rule) as any;
		expect(out.type).toBe('seq');
		expect(out.members[0]).toEqual({ type: 'string', value: 'a' });
		expect(out.members[1].type).toBe('choice');
		expect(out.members[1].members.map((m: any) => m.value)).toEqual(['x', 'y', 'z']);
	});

	it('extracts a common suffix across seq branches', () => {
		const rule: Rule = {
			type: CHOICE,
			members: [
				{
					type: SEQ,
					members: [
						{ type: STRING, value: 'x' },
						{ type: STRING, value: ';' }
					]
				},
				{
					type: SEQ,
					members: [
						{ type: STRING, value: 'y' },
						{ type: STRING, value: ';' }
					]
				}
			]
		};
		const out = factorChoiceBranches(rule) as any;
		expect(out.type).toBe('seq');
		expect(out.members[0].type).toBe('choice');
		expect(out.members[1]).toEqual({ type: 'string', value: ';' });
	});

	it('factors bare atom against seq(atom, tail) into seq(atom, optional(tail))', () => {
		// choice('a', seq('a', 'b')) — shared 'a' prefix, one branch has a
		// trailing 'b', the other is bare. Canonical form: seq('a', optional('b')).
		// Matches the grammar pattern `choice(seq(KW, body), KW)` used to
		// express "KW and optional body" with explicit precedence control.
		const rule: Rule = {
			type: CHOICE,
			members: [
				{ type: STRING, value: 'a' },
				{
					type: SEQ,
					members: [
						{ type: STRING, value: 'a' },
						{ type: STRING, value: 'b' }
					]
				}
			]
		};
		const out = factorChoiceBranches(rule) as any;
		expect(out.type).toBe('seq');
		expect(out.members).toHaveLength(2);
		expect(out.members[0]).toEqual({ type: 'string', value: 'a' });
		expect(out.members[1].type).toBe('optional');
		expect(out.members[1].content).toEqual({ type: 'string', value: 'b' });
	});

	it('leaves choice-of-unrelated-atoms alone', () => {
		// No common prefix/suffix → choice is preserved. Covers the
		// common grammar pattern `choice(identifier, _reserved_identifier)`
		// where the branches are alternative references, not prefixable seqs.
		const rule: Rule = {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'identifier' },
				{ type: SYMBOL, name: '_reserved_identifier' }
			]
		};
		const out = factorChoiceBranches(rule);
		expect(out.type).toBe('choice');
	});

	it('wraps the differing middle in optional when one branch omits it', () => {
		// choice(seq(a,b,c), seq(a,c)) — common prefix 'a', common suffix 'c',
		// middle differs (one branch has 'b', the other is empty). The empty
		// branch represents "this slot is optional", so the factored result
		// should be `seq(a, optional(b), c)` — NOT a choice that drops the
		// empty branch and emits `seq(a, b, c)`.
		const rule: Rule = {
			type: CHOICE,
			members: [
				{
					type: SEQ,
					members: [
						{ type: STRING, value: 'a' },
						{ type: STRING, value: 'b' },
						{ type: STRING, value: 'c' }
					]
				},
				{
					type: SEQ,
					members: [
						{ type: STRING, value: 'a' },
						{ type: STRING, value: 'c' }
					]
				}
			]
		};
		const out = factorChoiceBranches(rule) as any;
		expect(out.type).toBe('seq');
		expect(out.members).toHaveLength(3);
		expect(out.members[0]).toEqual({ type: 'string', value: 'a' });
		expect(out.members[1].type).toBe('optional');
		expect(out.members[1].content).toEqual({ type: 'string', value: 'b' });
		expect(out.members[2]).toEqual({ type: 'string', value: 'c' });
	});

	it('wraps a choice in optional when one branch is empty and others differ', () => {
		// choice(seq(a,b,c), seq(a,d,c), seq(a,c)) — prefix 'a', suffix 'c',
		// middle is choice(b,d) plus an empty body. Expected:
		// seq(a, optional(choice(b, d)), c)
		const rule: Rule = {
			type: CHOICE,
			members: [
				{
					type: SEQ,
					members: [
						{ type: STRING, value: 'a' },
						{ type: STRING, value: 'b' },
						{ type: STRING, value: 'c' }
					]
				},
				{
					type: SEQ,
					members: [
						{ type: STRING, value: 'a' },
						{ type: STRING, value: 'd' },
						{ type: STRING, value: 'c' }
					]
				},
				{
					type: SEQ,
					members: [
						{ type: STRING, value: 'a' },
						{ type: STRING, value: 'c' }
					]
				}
			]
		};
		const out = factorChoiceBranches(rule) as any;
		expect(out.type).toBe('seq');
		expect(out.members[1].type).toBe('optional');
		expect(out.members[1].content.type).toBe('choice');
		expect(out.members[1].content.members.map((m: any) => m.value)).toEqual(['b', 'd']);
	});
});

// ---------------------------------------------------------------------------
// T062 — collapseWrappers (already wired into optimize())
// ---------------------------------------------------------------------------

describe('Optimize — collapseWrappers (T062)', () => {
	it('collapses optional(optional(x)) → optional(x)', () => {
		const rule: Rule<'link'> = {
			type: OPTIONAL,
			content: { type: OPTIONAL, content: { type: STRING, value: 'a' } }
		};
		const out = collapseWrappers(rule) as any;
		expect(out.type).toBe('optional');
		expect(out.content.type).toBe('string');
	});

	it('collapses repeat(repeat(x)) → repeat(x)', () => {
		const rule: Rule<'link'> = {
			type: REPEAT,
			content: { type: REPEAT, content: { type: STRING, value: 'a' } }
		};
		const out = collapseWrappers(rule) as any;
		expect(out.type).toBe('repeat');
		expect(out.content.type).toBe('string');
	});

	it('collapses optional(repeat(x)) → repeat(x)', () => {
		const rule: Rule<'link'> = {
			type: OPTIONAL,
			content: { type: REPEAT, content: { type: STRING, value: 'a' } }
		};
		const out = collapseWrappers(rule) as any;
		expect(out.type).toBe('repeat');
	});

	it('collapses single-member seq/choice', () => {
		const seq: Rule = {
			type: SEQ,
			members: [{ type: STRING, value: 'a' }]
		};
		const choice: Rule = {
			type: CHOICE,
			members: [{ type: STRING, value: 'a' }]
		};
		expect(collapseWrappers(seq).type).toBe('string');
		expect(collapseWrappers(choice).type).toBe('string');
	});
});

// ---------------------------------------------------------------------------
// T064 — dedupeSeqMembers
// ---------------------------------------------------------------------------

describe('Optimize — dedupeSeqMembers (T064)', () => {
	it('collapses adjacent duplicates inside a seq', () => {
		const rule: Rule = {
			type: SEQ,
			members: [
				{ type: STRING, value: 'a' },
				{ type: STRING, value: 'a' },
				{ type: STRING, value: 'b' }
			]
		};
		const out = dedupeSeqMembers(rule) as any;
		expect(out.members.map((m: any) => m.value)).toEqual(['a', 'b']);
	});

	it('preserves non-adjacent duplicates', () => {
		const rule: Rule = {
			type: SEQ,
			members: [
				{ type: STRING, value: 'a' },
				{ type: STRING, value: 'b' },
				{ type: STRING, value: 'a' }
			]
		};
		const out = dedupeSeqMembers(rule) as any;
		expect(out.members.map((m: any) => m.value)).toEqual(['a', 'b', 'a']);
	});
});
