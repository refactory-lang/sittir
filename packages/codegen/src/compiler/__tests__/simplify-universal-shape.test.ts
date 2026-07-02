/**
 * Tests for Task 1.9 (PR0 rule-attributes refactor):
 * universal-shape canonicalization + post-condition check in simplify.ts.
 *
 * Per the spec's "Universal canonical shape" decision: every
 * AssembledBranch / AssembledGroup body, after simplification, should be a
 * SeqRule whose members are leaves (literals + slot-refs). No nested
 * structural rules with slot content.
 *
 * Task 1.9 adds:
 *   - canonicalizeSeqOfLeaves(rule): structural cleanup — flatten degenerate
 *     single-member seqs. Recurses through children. Does NOT push down
 *     attributes (enrich did that) or synthesize groups (decomposeOptional/
 *     Repeat did that).
 *   - assertUniversalShape(node): post-condition check that throws when the
 *     body is not a seq-of-leaves (or single leaf). Exposed for test use
 *     only — not yet wired into the production pipeline (deferred until PR1
 *     burn-in confirms the invariant holds across real grammars).
 */

import { CHOICE, FIELD, OPTIONAL, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { canonicalizeSeqOfLeaves, assertUniversalShape } from '../simplify.ts';
import {
	AssembledBranch,
	AssembledGroup,
	AssembledPattern,
} from '../model/node-map.ts';
import type { RenderRule, Rule, SeqRule } from '../../types/rule.ts';

// ---------------------------------------------------------------------------
// canonicalizeSeqOfLeaves
// ---------------------------------------------------------------------------

describe('canonicalizeSeqOfLeaves', () => {
	it('top-level seq of leaves stays unchanged', () => {
		const rule: SeqRule<'link'> = {
			type: SEQ,
			members: [
				{ type: STRING, value: 'fn' },
				{ type: SYMBOL, name: 'name' },
				{ type: STRING, value: '(' },
				{ type: STRING, value: ')' },
			],
		};
		expect(canonicalizeSeqOfLeaves(rule)).toEqual(rule);
	});

	it('degenerate single-member seq gets flattened', () => {
		const inner: Rule<'link'> = { type: SYMBOL, name: 'X' };
		const rule: SeqRule<'link'> = { type: SEQ, members: [inner] };
		expect(canonicalizeSeqOfLeaves(rule)).toEqual(inner);
	});

	it('nested single-member seq gets recursively flattened', () => {
		// seq([seq([X])]) -> X
		const inner: Rule<'link'> = { type: SYMBOL, name: 'X' };
		const rule: SeqRule<'link'> = {
			type: SEQ,
			members: [{ type: SEQ, members: [inner] }],
		};
		expect(canonicalizeSeqOfLeaves(rule)).toEqual(inner);
	});

	it('is idempotent (running twice produces same result)', () => {
		const rule: SeqRule<'link'> = {
			type: SEQ,
			members: [
				{ type: STRING, value: '{' },
				{ type: SEQ, members: [{ type: SYMBOL, name: 'body' }] },
				{ type: STRING, value: '}' },
			],
		};
		const once = canonicalizeSeqOfLeaves(rule);
		const twice = canonicalizeSeqOfLeaves(once);
		expect(twice).toEqual(once);
	});

	it('preserves leaf content inside wrappers (does not push down attributes)', () => {
		// canonicalizeSeqOfLeaves does NOT push down attributes — it only
		// flattens degenerate single-member seqs. A field-wrapped leaf with
		// a degenerate seq inside should collapse the seq but keep the field.
		const rule: Rule<'link'> = {
			type: FIELD,
			name: 'op',
			content: { type: SEQ, members: [{ type: STRING, value: '+' }] },
		};
		expect(canonicalizeSeqOfLeaves(rule)).toEqual({
			type: 'field',
			name: 'op',
			content: { type: 'string', value: '+' },
		});
	});
});

// ---------------------------------------------------------------------------
// assertUniversalShape
// ---------------------------------------------------------------------------

describe('assertUniversalShape', () => {
	it('passes for well-shaped AssembledBranch (seq of leaves)', () => {
		const body: SeqRule<'link'> = {
			type: SEQ,
			members: [
				{ type: STRING, value: 'fn' },
				{ type: SYMBOL, name: 'name' },
			],
		};
		const node = new AssembledBranch('function_decl', body, body, body as unknown as RenderRule);
		expect(() => assertUniversalShape(node)).not.toThrow();
	});

	it('passes for well-shaped AssembledGroup (seq of leaves)', () => {
		const body: SeqRule<'link'> = {
			type: SEQ,
			members: [
				{ type: SYMBOL, name: 'modifier' },
				{ type: STRING, value: 'static' },
			],
		};
		const node = new AssembledGroup('_modifiers', body, body, body as unknown as RenderRule);
		expect(() => assertUniversalShape(node)).not.toThrow();
	});

	it('passes for single-leaf body (non-seq)', () => {
		// A branch body that is just a single leaf is valid — it would have
		// been flattened by canonicalizeSeqOfLeaves from seq([X]) -> X.
		// However AssembledBranch's R generic doesn't permit a bare symbol,
		// so we test the case via AssembledGroup which accepts any Rule.
		const body: Rule<'link'> = { type: SYMBOL, name: 'X' };
		const node = new AssembledGroup('_passthrough', body, body, body as unknown as RenderRule);
		expect(() => assertUniversalShape(node)).not.toThrow();
	});

	it('throws for branch with nested optional containing slot content', () => {
		// optional(symbol) is a structural wrapper around a slot-ref — this
		// is the kind of shape decomposeOptional should have lifted into a
		// hidden group. assertUniversalShape catches the violation.
		const body: SeqRule<'link'> = {
			type: SEQ,
			members: [
				{ type: STRING, value: 'fn' },
				{
					type: OPTIONAL,
					content: { type: SYMBOL, name: 'type_params' },
				},
			],
		};
		const node = new AssembledGroup('function_decl', body, body, body as unknown as RenderRule);
		expect(() => assertUniversalShape(node)).toThrow(
			/Universal-shape violation in kind 'function_decl'/
		);
	});

	it('throws with offending sub-rule type in error message', () => {
		const body: SeqRule<'link'> = {
			type: SEQ,
			members: [
				{
					type: CHOICE,
					members: [
						{ type: SYMBOL, name: 'a' },
						{ type: SYMBOL, name: 'b' },
					],
				},
			],
		};
		const node = new AssembledGroup('_choice_wrap', body, body, body as unknown as RenderRule);
		expect(() => assertUniversalShape(node)).toThrow(/choice/);
	});

	it('throws for non-seq, non-leaf body (e.g. bare choice)', () => {
		const body: Rule<'link'> = {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'a' },
				{ type: SYMBOL, name: 'b' },
			],
		};
		const node = new AssembledGroup('_choice_kind', body, body, body as unknown as RenderRule);
		expect(() => assertUniversalShape(node)).toThrow(
			/Universal-shape violation/
		);
	});

	it('no-ops for non-branch / non-group nodes (e.g. pattern leaves)', () => {
		const leaf = new AssembledPattern('identifier', {
			type: PATTERN,
			value: '[a-z]+',
		});
		expect(() => assertUniversalShape(leaf)).not.toThrow();
	});
});
