import { CHOICE, PATTERN, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitWrap } from '../../__tests__/helpers/emit-wrap.ts';
import {
	AssembledPattern,
	AssembledList,
	type AssembledNode,
	type SeparatedListElementRule
} from '../../compiler/model/node-map.ts';
import type { RenderRule, SimplifiedRule } from '../../types/rule.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import type { KindEnumEntry } from '../kind-discriminant.ts';

// A bare SYMBOL rule is structurally identical across compiler phases, but
// `simplifiedRule`/`renderRule` are nominally branded (SimplifiedRule/RenderRule
// each carry a distinct `__brand?: never` marker) — one single-typed constant
// can't satisfy both, so each gets its own phase-typed declaration.
const MEMBER_ELEMENT_SIMPLIFIED_RULE: SimplifiedRule = { type: SYMBOL, name: 'member' };
const MEMBER_ELEMENT_RENDER_RULE: RenderRule = { type: SYMBOL, name: 'member' };

function makeMemberNodeMap(rule: SeparatedListElementRule, opts: { separatorRule: RenderRule | undefined }) {
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'member_list',
		new AssembledList('member_list', rule, undefined, {
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

describe('wrap emitter — separatedList', () => {
	it('emits _member/_separator/_delimiter for a nonterminal separator with both flanks optional', () => {
		// Storage/accessor key is the model's OWN derived slot name (`_member`,
		// from the element kind — see AssembledList.fields / Bug B fix),
		// NOT a hardcoded `_content`/`content()`. `_content` remains only as an
		// internal local var feeding `_hasSeparatorFlank`/`_separatorKindOf`.
		const sepChoice: RenderRule = {
			type: CHOICE,
			members: [
				{ type: STRING, value: ',' },
				{ type: STRING, value: ';' }
			]
		};
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: sepChoice, trailing: 'optional', leading: 'optional' }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: sepChoice });
		const emitted = emitWrap({ grammar: 'test', nodeMap, kindEntries: KIND_ENTRIES });

		expect(emitted).toContain('_member:');
		expect(emitted).toContain('member() {');
		expect(emitted).toContain('_separator:');
		expect(emitted).toContain('_delimiter:');
		expect(emitted).toContain('"leading"');
		expect(emitted).toContain('"trailing"');
		expect(emitted).toContain('_separatorKindOf(data, [TSKindId.Comma, TSKindId.Semi])');
	});

	it('omits _separator and the leading bit for a literal-separator node with only an optional trailing flank', () => {
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: undefined });
		const emitted = emitWrap({ grammar: 'test', nodeMap, kindEntries: KIND_ENTRIES });

		expect(emitted).toContain('_member:');
		expect(emitted).not.toContain('_separator:');
		expect(emitted).toContain('_delimiter:');
		// Only the trailing bit contributes — no leading term in the flag.
		expect(emitted).not.toContain('? Delimiter.Leading');
		expect(emitted).toContain('? Delimiter.Trailing : Delimiter.None');
	});
});
