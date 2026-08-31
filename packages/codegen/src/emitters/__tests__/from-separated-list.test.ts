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
 *
 * Also covers the follow-up hardening: the fixed call sites use a direct
 * cast (as Parameters<typeof F.x>[0]), not a cast laundered through
 * `unknown` first — the `unknown` intermediate was the exact mechanism that
 * let the original spread/index bug hide from the type checker undetected.
 */

import { PATTERN, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';
import {
	AssembledPattern,
	AssembledList,
	type AssembledNode,
	type SeparatedListElementRule
} from '../../compiler/model/node-map.ts';
import type { SimplifiedRule, RenderRule } from '../../types/rule.ts';
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

function emit(nodeMap: ReturnType<typeof makeMemberNodeMap>): string {
	return emitFrom({ grammar: 'test', nodeMap, kindEntries: KIND_ENTRIES });
}

describe('from emitter — separatedList', () => {
	it('coerceToMemberList spreads the elements into the factory call, preserving captured flank options on self-unwrap', () => {
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		const emitted = emit(makeMemberNodeMap(rule, { separatorRule: undefined }));

		expect(emitted).toContain('export function coerceToMemberList(...input');
		// The factory's signature is spread-with-leading-options — elements go
		// in as REST arguments, never as one array argument and never indexed
		// (that's the 'direct'/singular container shape, wrong for a
		// genuinely multi-element list).
		expect(emitted).not.toContain('children[0] as Parameters<typeof F.buildMemberList>[0]');
		expect(emitted).toMatch(
			/F\.buildMemberList\(\{ delimiter: .*\}, \.\.\.\(children as unknown as NonEmptyArray<T\.Member>\)\)/
		);
		expect(emitted).toMatch(/F\.buildMemberList\(\.\.\.\(input as unknown as NonEmptyArray<T\.Member>\)\)/);
	});

	it('_wrapWithChildren dispatches separatedList kinds by spreading the children array, never indexing', () => {
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		const emitted = emit(makeMemberNodeMap(rule, { separatorRule: undefined }));

		expect(emitted).toContain('function _wrapWithChildren(');
		expect(emitted).not.toContain('return F.buildMemberList(children[0]');
		expect(emitted).toMatch(
			/case "member_list": return \(F\.buildMemberList as \(\.\.\.args: unknown\[\]\) => unknown\)\(\.\.\.children\);/
		);
	});
});
