import { describe, expect, it } from 'vitest';
import { link } from '../link.ts';
import type { RawGrammar } from '../types.ts';
import type { Rule } from '../rule.ts';

/**
 * Chunk 2 — `mintContentAliasKinds` link pass.
 *
 * enrich wraps an inline-unsafe `optional(seq)` / bare `choice` in
 * `alias(<non-symbol content>, $.<name>)` tagged `metadata.source === 'enrich'`.
 * The new link pass registers `<name> = <content>` in the linked rules map so
 * codegen mints the visible kind (template / type / slots). The kindId is real
 * (tree-sitter emits the alias in parser.c).
 *
 * Guards:
 *  - SYMBOL aliases (`alias($._hidden, $.relabeled)`) keep their existing
 *    `aliasedFrom` provenance handling — the new pass must NOT register a kind
 *    for them.
 *  - An existing rule with the same name is left byte-unchanged (no clobber).
 */

function rawWith(rules: Record<string, Rule>): RawGrammar {
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

const sym = (n: string): Rule => ({ type: 'symbol', name: n }) as Rule;
const str = (v: string): Rule => ({ type: 'string', value: v }) as Rule;
const field = (n: string, c: Rule): Rule => ({ type: 'field', name: n, content: c }) as Rule;
const seq = (...m: Rule[]): Rule => ({ type: 'seq', members: m }) as Rule;
const choice = (...m: Rule[]): Rule => ({ type: 'choice', members: m }) as Rule;
// enrich visible-group alias: a SYMBOL ref to the hidden `_<name>` rule wrapped
// in a metadata.source='enrich' alias (`alias($._<name>, $.<name>)`).
const groupAlias = (hiddenName: string, name: string): Rule =>
	({ type: 'alias', content: sym(hiddenName), named: true, value: name, metadata: { source: 'enrich' } }) as unknown as Rule;
// Legacy direct content-alias (non-symbol content) — still registered.
const contentAlias = (content: Rule, name: string): Rule =>
	({ type: 'alias', content, named: true, value: name, metadata: { source: 'enrich' } }) as unknown as Rule;
// Authored relabel alias (NO enrich tag) — keeps aliasedFrom handling, NOT minted.
const symbolAlias = (refName: string, name: string): Rule =>
	({ type: 'alias', content: sym(refName), named: true, value: name }) as unknown as Rule;

describe('mintContentAliasKinds — link pass', () => {
	it('registers <name> from the HIDDEN rule body for a symbol-form enrich group alias', () => {
		// New shape: enrich emits `alias($._parens, $.parens)` + a hidden `_parens`
		// rule. The mint pass resolves THROUGH the symbol → registers
		// `parens = <_parens body>`.
		const parensBody = seq(str('('), choice(sym('self'), sym('super')), str(')'));
		const linked = link(
			rawWith({
				visibility_modifier: seq(str('pub'), groupAlias('_parens', 'parens')),
				_parens: parensBody,
				self: str('self'),
				super: str('super')
			})
		);
		// The minted VISIBLE kind exists (body is a seq, not a bare symbol).
		expect(linked.rules.parens).toBeDefined();
		expect((linked.rules.parens as { type: string }).type).toBe('seq');
		// The parent reference resolved to a SYMBOL ref to the minted kind.
		const vm = linked.rules.visibility_modifier as { type: string; members: Rule[] };
		const ref = vm.members[1] as { type: string; name?: string };
		expect(ref.type).toBe('symbol');
		expect(ref.name).toBe('parens');
	});

	it('registers <name> = <content> for a legacy (non-symbol) enrich content-alias', () => {
		const parensBody = seq(str('('), choice(sym('self'), sym('super')), str(')'));
		const linked = link(
			rawWith({
				visibility_modifier: seq(str('pub'), contentAlias(parensBody, 'parens')),
				self: str('self'),
				super: str('super')
			})
		);
		expect(linked.rules.parens).toBeDefined();
		const vm = linked.rules.visibility_modifier as { type: string; members: Rule[] };
		const ref = vm.members[1] as { type: string; name?: string };
		expect(ref.type).toBe('symbol');
		expect(ref.name).toBe('parens');
	});

	it('registers a default-named group kind from a symbol-form group alias', () => {
		const body = seq({ type: 'repeat1', content: choice(field('name', sym('id')), sym('enum_assignment')) } as Rule);
		const linked = link(
			rawWith({
				enum_body: seq(str('{'), groupAlias('_enum_body_group1', 'enum_body_group1'), str('}')),
				_enum_body_group1: body,
				id: { type: 'pattern', value: '[a-z]+' } as Rule,
				enum_assignment: seq(sym('id'), str('='), sym('id'))
			})
		);
		expect(linked.rules.enum_body_group1).toBeDefined();
	});

	it('does NOT mint a kind for a SYMBOL alias (aliasedFrom path untouched)', () => {
		const linked = link(
			rawWith({
				parentC: seq(symbolAlias('_hidden', 'relabeled')),
				_hidden: str('x')
			})
		);
		// No spurious top-level 'relabeled' rule registered by the content pass.
		// (resolveNamedAliasWithProvenance turns the ref into symbol('relabeled',
		// aliasedFrom:'_hidden') — but the content pass must not ADD a rule body.)
		expect(linked.rules.relabeled).toBeUndefined();
	});

	it('does NOT clobber an existing rule of the same name', () => {
		// Existing 'taken' has a field + symbol so it stays a seq (not promoted
		// to terminal), making the no-clobber assertion meaningful.
		const existing = seq(str('existing'), field('marker', sym('b')));
		const linked = link(
			rawWith({
				parentD: seq(contentAlias(seq(str('a'), field('other', sym('b'))), 'taken')),
				taken: existing,
				b: str('b')
			})
		);
		// The pre-existing 'taken' body is preserved, not overwritten.
		const taken = linked.rules.taken as { type: string; members?: Rule[] };
		expect(taken.type).toBe('seq');
		expect((taken.members as { type: string; value?: string }[])[0]?.value).toBe('existing');
	});
});
