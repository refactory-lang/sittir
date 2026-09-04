import { describe, expect, it } from 'vitest';
import type { NodeMap } from '../../types.ts';
import type { RenderRule } from '../../../types/rule.ts';
import { spaceRenderRules, spacedSeparatorOf, spacingSitesOf } from '../render-rules.ts';
import { AssembledSupertype } from '../node-map.ts';

const sym = (name: string, extra: object = {}): RenderRule =>
	({ type: 'SYMBOL', name, nonterminal: true, ...extra }) as unknown as RenderRule;
const str = (value: string): RenderRule => ({ type: 'STRING', value, nonterminal: false }) as unknown as RenderRule;
const seq = (...members: RenderRule[]): RenderRule => ({ type: 'SEQ', members, nonterminal: true }) as unknown as RenderRule;

const kindEntries = [
	{ kind: 'comma', anon: true, symbolName: ',', member: 'Comma', id: 5 },
	{ kind: 'tight', member: 'Tight', id: 90 },
	{ kind: 'space', member: 'Space', id: 91 },
	{ kind: 'newline', member: 'Newline', id: 92 }
] as never;

function nodeMapOf(
	rules: Record<string, RenderRule>,
	slots: Record<string, string>,
	opts: { whitespace?: boolean; externals?: string[]; supertypes?: Record<string, string[]> } = {}
): NodeMap {
	const nodes = new Map<string, unknown>();
	for (const kind of Object.keys(rules)) nodes.set(kind, { kind });
	if (opts.whitespace !== false) for (const w of ['_tight', '_space', '_newline']) nodes.set(w, { kind: w });
	for (const [supertype, members] of Object.entries(opts.supertypes ?? {})) {
		nodes.set(
			supertype,
			new AssembledSupertype(
				supertype,
				{ type: 'SUPERTYPE', name: supertype, subtypes: members, nonterminal: true } as never,
				members.map((name) => ({ name }))
			)
		);
	}
	const slotByRuleId = new Map(Object.entries(slots).map(([id, name]) => [id, { name }]));
	return {
		name: 'test',
		nodes,
		normalizedRules: rules,
		slotByRuleId,
		externals: new Set(opts.externals ?? [])
	} as unknown as NodeMap;
}

const commaList = (extra: object = {}): RenderRule =>
	sym('item', { id: 'r1', multiplicity: 'array', fieldName: 'items', separator: { value: str(',') }, ...extra });

describe('spaceRenderRules', () => {
	it('rewrites a comma repeat into a three-part separator whose choices carry the label and the default', () => {
		const out = spaceRenderRules({ nodeMap: nodeMapOf({ list: commaList() }, { r1: 'items' }), kindEntries });
		const spaced = spacedSeparatorOf(out.rules.list!)!;
		expect(spaced.token).toEqual(str(','));
		expect(spaced.before).toEqual({
			fieldName: 'items_comma_separator_space_before',
			label: 'comma_separator_space_before',
			side: 'before',
			defaultArm: 'space'
		});
		expect(spaced.after?.label).toBe('comma_separator_space_after');
		const choice = (out.rules.list as unknown as { separator: { value: { members: unknown[] } } }).separator.value.members[0] as {
			members: { name: string; annotations: object }[];
		};
		expect(choice.members.map((m) => m.name)).toEqual(['_tight', '_space', '_newline']);
		expect(choice.members[1]!.annotations).toEqual({ preference: 'comma_separator_space_before', default: true });
	});

	it('gives an unseparated repeat the empty gap choice as its separator', () => {
		const block = sym('statement', { id: 'r2', multiplicity: 'array', fieldName: 'statements' });
		const out = spaceRenderRules({ nodeMap: nodeMapOf({ block }, { r2: 'statements' }), kindEntries });
		const spaced = spacedSeparatorOf(out.rules.block!)!;
		expect(spaced.before).toBeUndefined();
		expect(spaced.token).toBeUndefined();
		expect(spaced.after).toEqual({
			fieldName: 'statements_empty_separator_space',
			label: 'empty_separator_space',
			side: 'gap',
			defaultArm: 'space'
		});
	});

	it('leaves tokenized, immediate and external repeats alone', () => {
		const rules = {
			tokenized: commaList({ id: 'r1', tokenized: true }),
			immediate: seq(sym('frag', { id: 'r3', multiplicity: 'array', fieldName: 'frags', immediate: true })),
			external: sym('_newline', { id: 'r4', multiplicity: 'array', fieldName: 'lines' }),
			leaf: sym('piece', { id: 'r5', multiplicity: 'array', fieldName: 'pieces' }),
			piece: sym('x', { tokenized: true })
		};
		const nodeMap = nodeMapOf(rules, { r1: 'items', r3: 'frags', r4: 'lines', r5: 'pieces' }, { externals: ['_newline'] });
		const out = spaceRenderRules({ nodeMap, kindEntries });
		expect(out.rules).toEqual(rules);
		expect(spacingSitesOf(out, nodeMap)).toEqual([]);
	});

	it('spaces only rules the slot table knows', () => {
		const out = spaceRenderRules({ nodeMap: nodeMapOf({ list: commaList() }, {}), kindEntries });
		expect(spacedSeparatorOf(out.rules.list!)).toBeUndefined();
	});

	it('returns the rules untouched when the grammar registers no whitespace kinds', () => {
		const rules = { list: commaList() };
		const out = spaceRenderRules({ nodeMap: nodeMapOf(rules, { r1: 'items' }, { whitespace: false }), kindEntries });
		expect(out.rules).toBe(rules);
	});

	it('resolves a default by kind × slot, then supertype × slot, then label, then space', () => {
		const rules = {
			a: commaList({ id: 'ra' }),
			b: commaList({ id: 'rb' }),
			c: commaList({ id: 'rc' }),
			d: commaList({ id: 'rd' })
		};
		const nodeMap = nodeMapOf(rules, { ra: 'items', rb: 'items', rc: 'items', rd: 'items' }, { supertypes: { _expression: ['b'] } });
		const out = spaceRenderRules({
			nodeMap,
			kindEntries,
			defaults: {
				comma_separator_space_after: 'newline',
				a: { items_comma_separator_space_after: 'tight' },
				expression: { items_comma_separator_space_after: 'tight' }
			}
		});
		const after = (kind: string) => spacedSeparatorOf(out.rules[kind]!)!.after!.defaultArm;
		const before = (kind: string) => spacedSeparatorOf(out.rules[kind]!)!.before!.defaultArm;
		expect(after('a')).toBe('tight');
		expect(after('b')).toBe('tight');
		expect(after('c')).toBe('newline');
		expect(before('c')).toBe('space');
		expect(spacingSitesOf(out, nodeMap).map((s) => `${s.kind}.${s.slot} ${s.label}=${s.defaultArm}`)).toEqual([
			'a.items comma_separator_space_before=space',
			'a.items comma_separator_space_after=tight',
			'b.items comma_separator_space_before=space',
			'b.items comma_separator_space_after=tight',
			'c.items comma_separator_space_before=space',
			'c.items comma_separator_space_after=newline',
			'd.items comma_separator_space_before=space',
			'd.items comma_separator_space_after=newline'
		]);
	});

	it('fails on a default that names no preference, no site or no arm', () => {
		const nodeMap = nodeMapOf({ list: commaList() }, { r1: 'items' });
		expect(() => spaceRenderRules({ nodeMap, kindEntries, defaults: { semi_separator_space_before: 'tight' } })).toThrow(
			/'semi_separator_space_before' is not a separator spacing preference/
		);
		expect(() => spaceRenderRules({ nodeMap, kindEntries, defaults: { block: { items_comma_separator_space_before: 'tight' } } })).toThrow(
			/'block' names no kind or supertype with a separator/
		);
		expect(() => spaceRenderRules({ nodeMap, kindEntries, defaults: { list: { items_empty_separator_space: 'tight' } } })).toThrow(
			/list\.items_empty_separator_space names no separator site/
		);
		expect(() => spaceRenderRules({ nodeMap, kindEntries, defaults: { comma_separator_space_before: 'wide' } })).toThrow(
			/is 'wide', not one of tight, space, newline/
		);
	});
});
