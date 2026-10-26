import type { GeneratedKindEntry } from '../../dsl/symbol-table.ts';
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
import {kindIdTablesOf, makeNodeMapWith, withIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';
import { builtTypeSurfaceOf } from '../factories.ts';
import type { KindEnumEntry } from '../kind-discriminant.ts';

// A bare SYMBOL rule is structurally identical across compiler phases, but
// `simplifiedRule`/`renderRule` are nominally branded (SimplifiedRule/RenderRule
// each carry a distinct `__brand?: never` marker) — one single-typed constant
// can't satisfy both, so each gets its own phase-typed declaration.
const MEMBER_ELEMENT_SIMPLIFIED_RULE: SimplifiedRule = { type: SYMBOL, name: 'member' };
const MEMBER_ELEMENT_RENDER_RULE: RenderRule = { type: SYMBOL, name: 'member' };

function makeMemberNodeMap(rule: SeparatedListElementRule, opts: { separatorRule: RenderRule | undefined }, kindEntries: readonly GeneratedKindEntry[]) {
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'member_list',
		new AssembledList('member_list', rule, { kindEntries }, { kindEntries,
			separatorRule: opts.separatorRule,
			simplifiedRule: MEMBER_ELEMENT_SIMPLIFIED_RULE,
			renderRule: MEMBER_ELEMENT_RENDER_RULE
		})
	);
	nodes.set('member', new AssembledPattern('member', { type: PATTERN, value: '[a-z]+' }, { kindEntries }));
	return makeNodeMapWith(nodes);
}

const KIND_ENTRIES: KindEnumEntry[] = [
	{ id: 1, kind: 'member_list', member: 'MemberList' },
	{ id: 2, kind: 'member', member: 'Member' },
	{ id: 3, kind: 'comma', member: 'Comma', symbolName: ',', literalText: ',', anon: true },
	{ id: 4, kind: 'semi', member: 'Semi', symbolName: ';', literalText: ';', anon: true }
];
const ID_TABLES = kindIdTablesOf(KIND_ENTRIES);

function emit(nodeMap: ReturnType<typeof makeMemberNodeMap>): string {
	return emitFrom({ grammar: 'test', nodeMap, generatedIdTables: ID_TABLES });
}

function looseRow(nodeMap: ReturnType<typeof makeMemberNodeMap>): string {
	const surface = builtTypeSurfaceOf(nodeMap.nodes.get('member_list')!, nodeMap, KIND_ENTRIES);
	if (surface === undefined) throw new Error('member_list has no built type surface');
	return surface.looseArgs;
}

const TAKES_ITS_ROW = 'export function coerceToMemberList(...input: T.MemberList.LooseArgs)';

describe('from emitter — separatedList', () => {
	it('coerceToMemberList returns a sole node of its own kind, with its options set through $with, and otherwise spreads the resolved elements after the options', () => {
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		const emitted = emit(withIdTables((kindEntries) => makeMemberNodeMap(rule, { separatorRule: undefined }, kindEntries), ID_TABLES).nodeMap);

		expect(emitted).toContain('export function coerceToMemberList(...input');
		expect(emitted).toContain(
			'if (_rest.length === 1 && isNodeOfKind(_rest[0], TSKindId.MemberList)) return withOptions(_rest[0], options) as unknown as ReturnType<typeof F.buildMemberList>;'
		);
		expect(emitted).not.toContain('children[0] as Parameters<typeof F.buildMemberList>[0]');
		expect(emitted).toMatch(
			/\(options, \.\.\.\(_listElements\(_rest, undefined, \(els\) => .*\) as unknown as NonEmptyArray<Admit<T\.Member>>\)\)/
		);
	});

	it('never reads a list node\'s stored separator or delimiter', () => {
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
		const emitted = emit(withIdTables((kindEntries) => makeMemberNodeMap(rule, { separatorRule: sepChoice }, kindEntries), ID_TABLES).nodeMap);

		expect(emitted).toContain('withOptions(_rest[0], options)');
		expect(emitted).not.toMatch(/_separator|_delimiter/);
		expect(emitted).not.toContain('KIND_LITERAL_TEXT');
	});

	it('_wrapWithChildren dispatches separatedList kinds through their coercer, spreading the children, never indexing', () => {
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		const emitted = emit(withIdTables((kindEntries) => makeMemberNodeMap(rule, { separatorRule: undefined }, kindEntries), ID_TABLES).nodeMap);

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
		const nodeMap = withIdTables((kindEntries) => makeMemberNodeMap(rule, { separatorRule: undefined }, kindEntries), ID_TABLES).nodeMap;
		const row = looseRow(nodeMap);

		expect(emit(nodeMap)).toContain(TAKES_ITS_ROW);
		expect(row).toMatch(/^\[element: [^]*?\.\.\.elements: [^]*?\] \| \[options: ListOptions<\{ delimiter\?: [^}]*\}>, element: /);
		expect(row).not.toContain('element?:');
	});

	it('lets an empty-capable list with options take the options object as its only argument', () => {
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'array',
			separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
		};
		const nodeMap = withIdTables((kindEntries) => makeMemberNodeMap(rule, { separatorRule: undefined }, kindEntries), ID_TABLES).nodeMap;

		expect(emit(nodeMap)).toContain(TAKES_ITS_ROW);
		expect(looseRow(nodeMap)).toMatch(/^\[\.\.\.elements: [^]*?\] \| \[options: ListOptions<\{ delimiter\?: [^}]*\}>, \.\.\.elements: /);
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
		const nodeMap = withIdTables((kindEntries) => makeMemberNodeMap(rule, { separatorRule: sepChoice }, kindEntries), ID_TABLES).nodeMap;
		const row = looseRow(nodeMap);

		expect(emit(nodeMap)).toContain(TAKES_ITS_ROW);
		expect(row.startsWith('[options: ListOptions<{ separator: TSKindId.Comma | TSKindId.Semi; delimiter?: Delimiter.None | Delimiter.Trailing }>, element: ')).toBe(true);
		expect(row).not.toMatch(/(^|\| )\[element: /);
	});

	it('types a non-empty list with no options as at least one element, and an empty-capable one as any number', () => {
		const rule = (multiplicity: 'array' | 'nonEmptyArray'): SeparatedListElementRule => ({
			type: SYMBOL,
			name: 'member',
			multiplicity,
			separator: { value: { type: STRING, value: ',' } }
		});
		expect(looseRow(withIdTables((kindEntries) => makeMemberNodeMap(rule('nonEmptyArray'), { separatorRule: undefined }, kindEntries), ID_TABLES).nodeMap)).toMatch(/^\[element: /);
		expect(looseRow(withIdTables((kindEntries) => makeMemberNodeMap(rule('array'), { separatorRule: undefined }, kindEntries), ID_TABLES).nodeMap)).toMatch(/^\[\.\.\.elements: /);
	});
});
