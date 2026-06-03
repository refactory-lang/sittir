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
const contentAlias = (content: Rule, name: string): Rule =>
	({ type: 'alias', content, named: true, value: name, metadata: { source: 'enrich' } }) as unknown as Rule;
const symbolAlias = (refName: string, name: string): Rule =>
	({ type: 'alias', content: sym(refName), named: true, value: name }) as unknown as Rule;

describe('mintContentAliasKinds — link pass', () => {
	it('registers <name> = <content> for an enrich content-alias (declared name)', () => {
		const parensBody = seq(str('('), choice(sym('self'), sym('super')), str(')'));
		const linked = link(
			rawWith({
				visibility_modifier: seq(str('pub'), contentAlias(parensBody, 'parens')),
				self: str('self'),
				super: str('super')
			})
		);
		// The minted kind exists.
		expect(linked.rules.parens).toBeDefined();
		// The parent reference resolved to a SYMBOL ref to the minted kind.
		const vm = linked.rules.visibility_modifier as { type: string; members: Rule[] };
		const ref = vm.members[1] as { type: string; name?: string };
		expect(ref.type).toBe('symbol');
		expect(ref.name).toBe('parens');
	});

	it('registers a default-named group kind from a content-alias', () => {
		const body = seq({ type: 'repeat1', content: choice(field('name', sym('id')), sym('enum_assignment')) } as Rule);
		const linked = link(
			rawWith({
				enum_body: seq(str('{'), contentAlias(body, '_enum_body_group1'), str('}')),
				id: { type: 'pattern', value: '[a-z]+' } as Rule,
				enum_assignment: seq(sym('id'), str('='), sym('id'))
			})
		);
		expect(linked.rules._enum_body_group1).toBeDefined();
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
