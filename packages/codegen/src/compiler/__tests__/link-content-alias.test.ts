import { describe, expect, it } from 'vitest';
import { link } from '../link.ts';
import type { RawGrammar } from '../types.ts';
import type { Rule } from '../../types/rule.ts';

/**
 * Chunk 2 — `mintContentAliasKinds` link pass.
 *
 * `applyClauseHoist`'s `peelOptionalSeq` surfaces an inline-unsafe
 * `optional(seq)` / bare `choice` as a visible CST node by wrapping a SYMBOL
 * ref to its hoisted hidden body in `alias(symbol(_<name>), $.<name>)` —
 * ALWAYS positioned directly inside the `optional(...)` (or a 2-member
 * `CHOICE[x, BLANK]`) that `peelOptionalSeq` recognized, never bare. The link
 * pass registers `<name> = <hidden body>` in the linked rules map so codegen
 * mints the visible kind (template / type / slots). The kindId is real
 * (tree-sitter emits the alias in parser.c).
 *
 * The population is identified STRUCTURALLY (debt PR-0c / doctrine decision
 * 4, `isClauseHoistVisibleGroupAlias`), not via a provenance tag — the
 * fixtures below wrap each candidate alias in `optional(...)` to match the
 * real shape `peelOptionalSeq` produces (verified against all 3 real
 * grammars; a bare, un-wrapped alias is never what enrich emits).
 *
 * Guards:
 *  - SYMBOL aliases (`alias($._hidden, $.relabeled)`) keep their existing
 *    `aliasedFrom` provenance handling — the new pass must NOT register a kind
 *    for them.
 *  - An existing rule with the same name is left byte-unchanged (no clobber).
 */

function rawWith(rules: Record<string, Rule<'evaluate'>>): RawGrammar {
	return {
		name: 'synth',
		rules,
		extras: [],
		externals: [],
		supertypes: [],
		inline: [],
		conflicts: [],
		word: null,
		references: []
	} as unknown as RawGrammar;
}

const sym = (n: string): Rule<'evaluate'> => ({ type: 'SYMBOL', name: n }) as Rule<'evaluate'>;
const str = (v: string): Rule<'evaluate'> => ({ type: 'STRING', value: v }) as Rule<'evaluate'>;
const field = (n: string, c: Rule<'evaluate'>): Rule<'evaluate'> =>
	({ type: 'FIELD', name: n, content: c }) as Rule<'evaluate'>;
const seq = (...m: Rule<'evaluate'>[]): Rule<'evaluate'> => ({ type: 'SEQ', members: m }) as Rule<'evaluate'>;
const choice = (...m: Rule<'evaluate'>[]): Rule<'evaluate'> => ({ type: 'CHOICE', members: m }) as Rule<'evaluate'>;
const optional = (c: Rule<'evaluate'>): Rule<'evaluate'> => ({ type: 'OPTIONAL', content: c }) as Rule<'evaluate'>;
// Clause-hoist visible-group alias: a SYMBOL ref to the hidden `_<name>` rule
// wrapped in `alias(symbol(_<name>), $.<name>)` — the exact shape
// `applyClauseHoist`'s `peelOptionalSeq` produces. The structural mint
// condition (`isClauseHoistVisibleGroupAlias`) additionally requires this
// alias's immediate parent to be `optional(...)` (or a 2-member
// `CHOICE[x, BLANK]`) — callers below wrap it accordingly.
const groupAlias = (hiddenName: string, name: string): Rule<'evaluate'> =>
	({ type: 'ALIAS', content: sym(hiddenName), named: true, value: name }) as unknown as Rule<'evaluate'>;
// Authored relabel alias (target is a pre-existing rule, or content is a
// visible symbol) — keeps aliasedFrom handling, NOT minted.
const symbolAlias = (refName: string, name: string): Rule<'evaluate'> =>
	({ type: 'ALIAS', content: sym(refName), named: true, value: name }) as unknown as Rule<'evaluate'>;

describe('mintContentAliasKinds — link pass', () => {
	it('registers <name> from the HIDDEN rule body for a symbol-form clause-hoist group alias', () => {
		// Real shape: `applyClauseHoist` emits `optional(alias($._parens, $.parens))`
		// + a hidden `_parens` rule. The mint pass resolves THROUGH the symbol →
		// registers `parens = <_parens body>`.
		const parensBody = seq(str('('), choice(sym('self'), sym('super')), str(')'));
		const linked = link(
			rawWith({
				visibility_modifier: seq(str('pub'), optional(groupAlias('_parens', 'parens'))),
				_parens: parensBody,
				self: str('self'),
				super: str('super')
			})
		);
		// The minted VISIBLE kind exists (body is a seq, not a bare symbol).
		expect(linked.rules.parens).toBeDefined();
		expect((linked.rules.parens as { type: string }).type).toBe('SEQ');
		// The parent reference resolved to a SYMBOL ref to the minted kind
		// (through the optional wrapper, pushed down to leaf attributes by
		// wrapper-deletion at the Normalize phase — at Link the optional wrapper
		// itself still holds the resolved alias content).
		const vm = linked.rules.visibility_modifier as { type: string; members: Rule[] };
		const opt = vm.members[1] as { type: string; content?: { type: string; name?: string } };
		expect(opt.type).toBe('OPTIONAL');
		expect(opt.content?.type).toBe('SYMBOL');
		expect(opt.content?.name).toBe('parens');
	});

	it('registers a default-named group kind from a symbol-form group alias inside a CHOICE[x, BLANK]', () => {
		// `peelOptionalSeq`'s other recognized shape: a 2-member CHOICE with a
		// BLANK sibling (the desugared `optional(x)` form).
		const body = seq({
			type: 'REPEAT1',
			content: choice(field('name', sym('id')), sym('enum_assignment'))
		} as Rule<'evaluate'>);
		const linked = link(
			rawWith({
				enum_body: seq(
					str('{'),
					choice(groupAlias('_enum_body_group1', 'enum_body_group1'), { type: 'BLANK' } as unknown as Rule<'evaluate'>),
					str('}')
				),
				_enum_body_group1: body,
				id: { type: 'PATTERN', value: '[a-z]+' } as Rule<'evaluate'>,
				enum_assignment: seq(sym('id'), str('='), sym('id'))
			})
		);
		expect(linked.rules.enum_body_group1).toBeDefined();
	});

	it('does NOT mint a kind for a SYMBOL alias whose target already has a rule body (authored relabel, aliasedFrom path untouched)', () => {
		const linked = link(
			rawWith({
				parentC: seq(optional(symbolAlias('_hidden', 'relabeled'))),
				_hidden: str('x'),
				// A real rule body under the alias TARGET name — the structural mint
				// condition's "target has no independent body" test excludes this.
				relabeled: str('y')
			})
		);
		// The pre-existing 'relabeled' body is untouched (not overwritten with
		// the alias's hidden content) — the content pass must not clobber it.
		expect((linked.rules.relabeled as { type: string; value?: string }).value).toBe('y');
	});

	it('does NOT mint a kind for an alias whose immediate parent is NOT optional/CHOICE[x,BLANK] (e.g. repeat1 — wire groups: shape)', () => {
		// Mirrors wire's `groups:` body-pattern replacement output
		// (`alias($._hidden, $.visible)` inside `repeat1(...)`, not `optional`) —
		// resolved via the ordinary `aliasedFrom` fallback instead of minting.
		const linked = link(
			rawWith({
				parentE: seq(
					field('items', { type: 'REPEAT1', content: groupAlias('_hidden2', 'visible2') } as Rule<'evaluate'>)
				),
				_hidden2: seq(str('a'), field('b', sym('id'))),
				id: { type: 'PATTERN', value: '[a-z]+' } as Rule<'evaluate'>
			})
		);
		expect(linked.rules.visible2).toBeUndefined();
	});

	it('does NOT clobber an existing rule of the same name', () => {
		// Existing 'taken' has a field + symbol so it stays a seq (not promoted
		// to terminal), making the no-clobber assertion meaningful.
		const existing = seq(str('existing'), field('marker', sym('b')));
		const linked = link(
			rawWith({
				parentD: seq(optional(groupAlias('_taken_hidden', 'taken'))),
				_taken_hidden: seq(str('a'), field('other', sym('b'))),
				taken: existing,
				b: str('b')
			})
		);
		// The pre-existing 'taken' body is preserved, not overwritten.
		const taken = linked.rules.taken as { type: string; members?: Rule[] };
		expect(taken.type).toBe('SEQ');
		expect((taken.members as { type: string; value?: string }[])[0]?.value).toBe('existing');
	});
});
