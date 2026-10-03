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

import { CHOICE, PATTERN, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
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
import { builtTypeSurfaceOf } from '../factories.ts';
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
	{ id: 3, kind: 'comma', member: 'Comma', symbolName: ',', literalText: ',', anon: true },
	{ id: 4, kind: 'semi', member: 'Semi', symbolName: ';', literalText: ';', anon: true }
];

function emit(nodeMap: ReturnType<typeof makeMemberNodeMap>): string {
	return emitFrom({ grammar: 'test', nodeMap, kindEntries: KIND_ENTRIES });
}

function looseRow(nodeMap: ReturnType<typeof makeMemberNodeMap>): string {
	const surface = builtTypeSurfaceOf(nodeMap.nodes.get('member_list')!, nodeMap, KIND_ENTRIES);
	if (surface === undefined) throw new Error('member_list has no built type surface');
	return surface.looseArgs;
}

const TAKES_ITS_ROW = 'export function coerceToMemberList(...input: T.MemberList.LooseArgs)';

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
			/F\.buildMemberList\(\{ delimiter: .*\}, \.\.\.\(children as unknown as NonEmptyArray<Admit<T\.Member>>\)\)/
		);
		// The fresh path resolves each element through the content slot before
		// spreading, with a leading options object passed through untouched.
		expect(emitted).toMatch(
			/F\.buildMemberList\(\.\.\.\(_listElements\(input, \["delimiter"\], undefined, \(els\) => .*\) as unknown as NonEmptyArray<Admit<T\.Member>>\)\)/
		);
	});

	it('passes a captured separator kind id straight through on self-unwrap', () => {
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
			separator: { value: sepChoice, trailing: 'optional' }
		};
		const emitted = emit(makeMemberNodeMap(rule, { separatorRule: sepChoice }));

		expect(emitted).toContain(
			'separator: (data as unknown as { _separator?: number; _delimiter?: Delimiter })._separator'
		);
		expect(emitted).not.toContain('KIND_LITERAL_TEXT');
	});

	it('_wrapWithChildren dispatches separatedList kinds through their coercer, spreading the children, never indexing', () => {
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		const emitted = emit(makeMemberNodeMap(rule, { separatorRule: undefined }));

		expect(emitted).toContain('function _wrapWithChildren(');
		expect(emitted).not.toContain('return F.buildMemberList(children[0]');
		// A list kind is built through its own coercer, so the children resolve
		// through the content slot exactly as a direct call would.
		expect(emitted).toContain(
			'case "member_list": return (coerceToMemberList as (...args: unknown[]) => unknown)(...children);'
		);
	});

	it('requires an element from a non-empty list, with the options object first when it has one', () => {
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: undefined });
		const row = looseRow(nodeMap);

		expect(emit(nodeMap)).toContain(TAKES_ITS_ROW);
		expect(row).toMatch(/^\[element: [^]*?\.\.\.elements: [^]*?\] \| \[options: \{ delimiter\?: [^}]*\}, element: /);
		expect(row).not.toContain('element?:');
	});

	it('lets an empty-capable list with options take the options object as its only argument', () => {
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'array',
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: undefined });

		expect(emit(nodeMap)).toContain(TAKES_ITS_ROW);
		expect(looseRow(nodeMap)).toMatch(/^\[\.\.\.elements: [^]*?\] \| \[options: \{ delimiter\?: [^}]*\}, \.\.\.elements: /);
	});

	it('takes the options object first, with no elements-only form, when the separator has no declared default', () => {
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
			separator: { value: sepChoice, trailing: 'optional' }
		};
		const nodeMap = makeMemberNodeMap(rule, { separatorRule: sepChoice });
		const row = looseRow(nodeMap);

		expect(emit(nodeMap)).toContain(TAKES_ITS_ROW);
		expect(row.startsWith('[options: { separator: TSKindId.Comma | TSKindId.Semi; delimiter?: Delimiter.None | Delimiter.Trailing }, element: ')).toBe(true);
		expect(row).not.toMatch(/(^|\| )\[element: /);
	});

	it('types a non-empty list with no options as at least one element, and an empty-capable one as any number', () => {
		const rule = (multiplicity: 'array' | 'nonEmptyArray'): SeparatedListElementRule => ({
			type: SYMBOL,
			name: 'member',
			multiplicity,
			separator: { value: { type: STRING, value: ',' } }
		});
		expect(looseRow(makeMemberNodeMap(rule('nonEmptyArray'), { separatorRule: undefined }))).toMatch(/^\[element: /);
		expect(looseRow(makeMemberNodeMap(rule('array'), { separatorRule: undefined }))).toMatch(/^\[\.\.\.elements: /);
	});
});
