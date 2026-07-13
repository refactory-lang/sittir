/**
 * from.ts — 'separatedList' construct/reconstruction emission (separator-as-slot
 * Task 6 follow-up: fix real from() dispatch bug found in spec-compliance review).
 *
 * Before this fix, from.ts's separatedList handling (both the dedicated
 * `xxxFrom` rest-param resolver AND `_wrapWithChildren`'s generic dispatch
 * table) spread/indexed the resolved children array into the factory's
 * positional argument list — correct when the factory took `(...children: T[])`
 * (pre-Task-6), but WRONG now that the factory takes
 * `(elements: T[] | NonEmptyArray<T>, options?: {...})`: spreading bound
 * `children[0]` to `elements` (a single node instead of the array) and
 * `children[1]` to `options` (an unrelated node). Covered here via a
 * synthetic multi-element nonEmpty fixture so the array-vs-spread shape is
 * unambiguous in the assertion.
 */

import { CHOICE, PATTERN, REPEAT1, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';
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
	return emitFrom({ grammar: 'test', nodeMap, kindEntries: KIND_ENTRIES });
}

describe('from emitter — separatedList', () => {
	it('memberListFrom passes children as the elements ARRAY, never spread or indexed', () => {
		const rule: Repeat1Rule = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: { value: { type: STRING, value: ',' }, trailing: true }
		};
		const emitted = emit(makeMemberNodeMap(rule, { separatorRule: undefined }));

		expect(emitted).toContain('export function memberListFrom(...input');
		// Never spread the resolved elements into the factory call.
		expect(emitted).not.toContain('...(children as');
		expect(emitted).not.toContain('...(input as');
		// Never bind a single indexed element either (that's the 'direct'/
		// singular container shape, wrong for a genuinely multi-element list).
		expect(emitted).not.toContain('children[0] as Parameters<typeof F.memberList>[0]');
		// The array itself (not spread) must be the sole positional argument.
		expect(emitted).toMatch(/F\.memberList\(children as unknown as Parameters<typeof F\.memberList>\[0\]\)/);
		expect(emitted).toMatch(/F\.memberList\(input as unknown as Parameters<typeof F\.memberList>\[0\]\)/);
	});

	it('_wrapWithChildren dispatches separatedList kinds with the array form, never spread or indexed', () => {
		const rule: Repeat1Rule = {
			type: REPEAT1,
			content: { type: SYMBOL, name: 'member' },
			separator: { value: { type: STRING, value: ',' }, trailing: true }
		};
		const emitted = emit(makeMemberNodeMap(rule, { separatorRule: undefined }));

		expect(emitted).toContain('function _wrapWithChildren(');
		expect(emitted).toMatch(
			/case "member_list": return F\.memberList\(children as unknown as Parameters<typeof F\.memberList>\[0\]\);/
		);
	});
});
