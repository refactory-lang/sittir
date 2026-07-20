/**
 * factories.ts — 'separatedList' construct/factory emission (separator-as-slot
 * Task 6).
 *
 * Covers the dedicated `emitSeparatedList` factory shape: positional
 * `elements` argument, plus a trailing options object (only emitted when at
 * least one of separatorKind/leading/trailing genuinely varies per-instance)
 * for `separatorKind`/`leading`/`trailing` overrides — mirroring wrap.ts's
 * `_separator_kind`/`_leading_sep`/`_trailing_sep` wire-key naming (Task 4)
 * so the same three concepts share one naming scheme across
 * capture/render/construct. The elements' own storage key is NOT a fixed
 * `_content` bucket — it's the fixture's real single-field canonical slot
 * name (`_member`, via `canonicalSeparatedListField`, shared.ts).
 */

import { CHOICE, PATTERN, REPEAT, REPEAT1, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';
import { AssembledPattern, AssembledSeparatedList, type AssembledNode } from '../../compiler/model/node-map.ts';
import type { Repeat1Rule, RepeatRule, Rule, SimplifiedRule, RenderRule } from '../../types/rule.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import type { KindEnumEntry } from '../kind-discriminant.ts';

// A bare SYMBOL rule is structurally identical across compiler phases, but
// `simplifiedRule`/`renderRule` are nominally branded (SimplifiedRule/RenderRule
// each carry a distinct `__brand?: never` marker) — one Rule<'link'>-typed
// constant can't satisfy both, so each gets its own phase-typed declaration.
const MEMBER_ELEMENT_SIMPLIFIED_RULE: SimplifiedRule = { type: SYMBOL, name: 'member' };
const MEMBER_ELEMENT_RENDER_RULE: RenderRule = { type: SYMBOL, name: 'member' };

function makeMemberNodeMap(rule: Repeat1Rule, opts: { separatorRule: Rule<'link'> | undefined }) {
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'member_list',
		new AssembledSeparatedList('member_list', rule, undefined, {
			separatorRule: opts.separatorRule,
			simplifiedRule: MEMBER_ELEMENT_SIMPLIFIED_RULE,
			renderRule: MEMBER_ELEMENT_RENDER_RULE
		})
	);
	nodes.set('member', new AssembledPattern('member', { type: PATTERN, value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

const KIND_ENTRIES: KindEnumEntry[] = [
	{ id: 1, kind: 'member_list', member: 'MemberList' },
	{ id: 2, kind: 'member', member: 'Member' },
	{ id: 3, kind: 'comma', member: 'Comma', symbolName: ',', anon: true },
	{ id: 4, kind: 'semi', member: 'Semi', symbolName: ';', anon: true }
];

function emit(nodeMap: ReturnType<typeof makeMemberNodeMap>): string {
	return emitFactories({ grammar: 'test', nodeMap, kindEntries: KIND_ENTRIES });
}

function makeMultiKindMemberNodeMap(): ReturnType<typeof makeNodeMapWith> {
	// Plain REPEAT (not REPEAT1) deliberately — the elements type takes the
	// bare-array form ("(A | B)[]") rather than NonEmptyArray<A | B>, which is
	// the actual shape the union-parenthesization guard protects (a
	// NonEmptyArray<...> wrapper never needs the extra parens; only a bare
	// `[]` suffix appended directly to a multi-member union does).
	const contentMembers = [
		{ type: SYMBOL, name: 'memberA' },
		{ type: SYMBOL, name: 'memberB' }
	] as const;
	const rule: RepeatRule = {
		type: REPEAT,
		content: { type: CHOICE, members: [...contentMembers] },
		separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
	};
	// Same phase-branding constraint as MEMBER_ELEMENT_SIMPLIFIED_RULE/
	// MEMBER_ELEMENT_RENDER_RULE above — `rule.content` is structurally
	// identical to both, but nominally satisfies only one at a time.
	const contentSimplifiedRule: SimplifiedRule = { type: CHOICE, members: [...contentMembers] };
	const contentRenderRule: RenderRule = { type: CHOICE, members: [...contentMembers] };
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'member_list',
		new AssembledSeparatedList('member_list', rule, undefined, {
			separatorRule: undefined,
			simplifiedRule: contentSimplifiedRule,
			renderRule: contentRenderRule
		})
	);
	nodes.set('memberA', new AssembledPattern('memberA', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('memberB', new AssembledPattern('memberB', { type: PATTERN, value: '[0-9]+' }));
	return makeNodeMapWith(nodes);
}

describe('factories emitter — separatedList', () => {
	it('nonterminal separator with both flanks optional: elements + options{separatorKind,leading,trailing}', () => {
		const sepChoice: Rule<'link'> = {
			type: CHOICE,
			members: [
				{ type: STRING, value: ',' },
				{ type: STRING, value: ';' }
			]
		};
		const rule: Repeat1Rule = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: { value: sepChoice, trailing: 'optional', leading: 'optional' }
		};
		const emitted = emit(makeMemberNodeMap(rule, { separatorRule: sepChoice }));

		expect(emitted).toContain('export function buildMemberList(elements: NonEmptyArray<T.Member>, options');
		expect(emitted).toContain('separatorKind?: "," | ";"');
		expect(emitted).toContain('leading?: boolean');
		expect(emitted).toContain('trailing?: boolean');
		expect(emitted).toContain('_member');
		expect(emitted).toContain('_separator_kind');
		expect(emitted).toContain('_leading_sep');
		expect(emitted).toContain('_trailing_sep');
		// Selection maps the caller's literal choice to its KindId, defaulting
		// to the first candidate arm when omitted.
		expect(emitted).toContain('TSKindId.Comma');
		expect(emitted).toContain('TSKindId.Semi');
	});

	it('literal separator with only an optional trailing flank (mirrors with_clause_bare/expression_statement_tuple/lambda_parameters): no separatorKind, no leading', () => {
		const rule: Repeat1Rule = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		const emitted = emit(makeMemberNodeMap(rule, { separatorRule: undefined }));

		expect(emitted).toContain('export function buildMemberList(elements: NonEmptyArray<T.Member>, options');
		expect(emitted).not.toContain('separatorKind?:');
		expect(emitted).not.toContain('leading?: boolean');
		expect(emitted).toContain('trailing?: boolean');
		expect(emitted).not.toContain('_separator_kind');
		expect(emitted).not.toContain('_leading_sep');
		expect(emitted).toContain('_trailing_sep');
	});

	it('literal separator with both flanks optional (mirrors object_type_content_comma/_semi): leading + trailing, no separatorKind', () => {
		const rule: Repeat1Rule = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional', leading: 'optional' }
		};
		const emitted = emit(makeMemberNodeMap(rule, { separatorRule: undefined }));

		expect(emitted).not.toContain('separatorKind?:');
		expect(emitted).toContain('leading?: boolean');
		expect(emitted).toContain('trailing?: boolean');
		expect(emitted).not.toContain('_separator_kind');
		expect(emitted).toContain('_leading_sep');
		expect(emitted).toContain('_trailing_sep');
	});

	it('literal separator with mandatory-only (no optional flanks): no options object at all — bare elements signature', () => {
		const rule: Repeat1Rule = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: { value: { type: STRING, value: ',' } }
		};
		const emitted = emit(makeMemberNodeMap(rule, { separatorRule: undefined }));

		expect(emitted).toContain('export function buildMemberList(elements: NonEmptyArray<T.Member>) {');
		expect(emitted).not.toContain('options');
		expect(emitted).not.toContain('_separator_kind');
		expect(emitted).not.toContain('_leading_sep');
		expect(emitted).not.toContain('_trailing_sep');
	});

	it('multi-kind element choice on a plain (non-nonEmpty) repeat: parenthesizes the union before appending []', () => {
		const emitted = emit(makeMultiKindMemberNodeMap());

		// Correct: the union is parenthesized before the array suffix.
		expect(emitted).toContain('export function buildMemberList(elements: (T.MemberA | T.MemberB)[], options');
		// The precedence bug this guards against: `[]` binding to the LAST
		// union member alone instead of the whole union.
		expect(emitted).not.toContain('T.MemberA | T.MemberB[]');
		// Same guard applies to the $children setter's rest-param type.
		expect(emitted).toContain('$children: (...vs: (T.MemberA | T.MemberB)[])');
	});
});
