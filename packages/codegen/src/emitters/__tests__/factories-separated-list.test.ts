/**
 * factories.ts — 'separatedList' construct/factory emission (separator-as-slot
 * Task 6).
 *
 * Covers the dedicated `emitSeparatedList` factory shape: positional
 * `elements` argument, plus a trailing options object (only emitted when at
 * least one of separatorKind/leading/trailing genuinely varies per-instance)
 * for `separatorKind`/`leading`/`trailing` overrides — mirroring wrap.ts's
 * `_content`/`_separator_kind`/`_leading_sep`/`_trailing_sep` wire-key
 * naming (Task 4) so the same three concepts share one naming scheme across
 * capture/render/construct.
 */

import { CHOICE, PATTERN, REPEAT1, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitFactories } from '../factories.ts';
import { AssembledPattern, AssembledSeparatedList, type AssembledNode } from '../../compiler/model/node-map.ts';
import type { Repeat1Rule, Rule } from '../../types/rule.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import type { KindEnumEntry } from '../kind-discriminant.ts';

const MEMBER_ELEMENT_RULE: Rule<'link'> = { type: SYMBOL, name: 'member' };

function makeMemberNodeMap(rule: Repeat1Rule, opts: { separatorRule: Rule<'link'> | undefined }) {
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'member_list',
		new AssembledSeparatedList('member_list', rule, undefined, {
			separatorRule: opts.separatorRule,
			simplifiedRule: MEMBER_ELEMENT_RULE,
			renderRule: MEMBER_ELEMENT_RULE
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
			separator: { value: sepChoice, trailing: true, leading: true }
		};
		const emitted = emit(makeMemberNodeMap(rule, { separatorRule: sepChoice }));

		expect(emitted).toContain('export function memberList(elements: NonEmptyArray<T.Member>, options');
		expect(emitted).toContain('separatorKind?: "," | ";"');
		expect(emitted).toContain('leading?: boolean');
		expect(emitted).toContain('trailing?: boolean');
		expect(emitted).toContain('_content');
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
			separator: { value: { type: STRING, value: ',' }, trailing: true }
		};
		const emitted = emit(makeMemberNodeMap(rule, { separatorRule: undefined }));

		expect(emitted).toContain('export function memberList(elements: NonEmptyArray<T.Member>, options');
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
			separator: { value: { type: STRING, value: ',' }, trailing: true, leading: true }
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

		expect(emitted).toContain('export function memberList(elements: NonEmptyArray<T.Member>) {');
		expect(emitted).not.toContain('options');
		expect(emitted).not.toContain('_separator_kind');
		expect(emitted).not.toContain('_leading_sep');
		expect(emitted).not.toContain('_trailing_sep');
	});
});
