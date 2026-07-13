import { CHOICE, PATTERN, REPEAT1, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitWrap } from '../../__tests__/helpers/emit-wrap.ts';
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

describe('wrap emitter — separatedList', () => {
	it('emits _content/_separator_kind/_leading_sep/_trailing_sep for a nonterminal separator with both flanks optional', () => {
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
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: sepChoice });
		const emitted = emitWrap({ grammar: 'test', nodeMap, kindEntries: KIND_ENTRIES });

		expect(emitted).toContain('_content:');
		expect(emitted).toContain('_separator_kind:');
		expect(emitted).toContain('_leading_sep:');
		expect(emitted).toContain('_trailing_sep:');
		expect(emitted).toContain('_separatorKindOf(data, [TSKindId.Comma, TSKindId.Semi])');
	});

	it('omits _separator_kind and _leading_sep for a literal-separator node with only an optional trailing flank', () => {
		const rule: Repeat1Rule = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: undefined });
		const emitted = emitWrap({ grammar: 'test', nodeMap, kindEntries: KIND_ENTRIES });

		expect(emitted).toContain('_content:');
		expect(emitted).not.toContain('_separator_kind:');
		expect(emitted).not.toContain('_leading_sep:');
		expect(emitted).toContain('_trailing_sep:');
	});
});
