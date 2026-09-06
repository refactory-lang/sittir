import { describe, expect, it } from 'vitest';
import type { NodeMap } from '../../types.ts';
import type { RenderRule } from '../../../types/rule.ts';
import { flanksOf, isSeamChoice, seamPartOf, seamRenderRules, spaceRenderRules, spacedSeparatorOf, spacingSitesOf } from '../render-rules.ts';
import { AssembledBranch, AssembledSupertype } from '../node-map.ts';

const sym = (name: string, extra: object = {}): RenderRule =>
	({ type: 'SYMBOL', name, nonterminal: true, ...extra }) as unknown as RenderRule;
const str = (value: string): RenderRule => ({ type: 'STRING', value, nonterminal: false }) as unknown as RenderRule;
const seq = (...members: RenderRule[]): RenderRule => ({ type: 'SEQ', members, nonterminal: true }) as unknown as RenderRule;

const kindEntries = [
	{ kind: 'comma', anon: true, symbolName: ',', member: 'Comma', id: 5 },
	{ kind: 'lparen', anon: true, symbolName: '(', member: 'Lparen', id: 7 },
	{ kind: 'rparen', anon: true, symbolName: ')', member: 'Rparen', id: 8 },
	{ kind: 'lbrace', anon: true, symbolName: '{', member: 'Lbrace', id: 9 },
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
	if (opts.whitespace !== false) for (const w of ['_tight', '_space', '_newline', '_indent', '_dedent']) nodes.set(w, { kind: w });
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
			fieldName: 'items_separator_space_before',
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
			fieldName: 'statements_separator_space',
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
				labels: { comma_separator_space_after: 'newline' },
				sites: {
					a: { items_separator_space_after: { label: 'comma_separator_space_after', arm: 'tight' } },
					_expression: { items_separator_space_after: { label: 'comma_separator_space_after', arm: 'tight' } }
				}
			}
		});
		const after = (kind: string) => spacedSeparatorOf(out.rules[kind]!)!.after!.defaultArm;
		const before = (kind: string) => spacedSeparatorOf(out.rules[kind]!)!.before!.defaultArm;
		expect(after('a')).toBe('tight');
		expect(after('b')).toBe('tight');
		expect(after('c')).toBe('newline');
		expect(before('c')).toBe('space');
		expect(spacingSitesOf(out, nodeMap).map((s) => `${s.kind}.${s.slot} ${s.label}=${s.defaultArm} @${s.address}`)).toEqual([
			'a.items comma_separator_space_before=space @items_separator_space_before',
			'a.items comma_separator_space_after=tight @items_separator_space_after',
			'b.items comma_separator_space_before=space @items_separator_space_before',
			'b.items comma_separator_space_after=tight @items_separator_space_after',
			'c.items comma_separator_space_before=space @items_separator_space_before',
			'c.items comma_separator_space_after=newline @items_separator_space_after',
			'd.items comma_separator_space_before=space @items_separator_space_before',
			'd.items comma_separator_space_after=newline @items_separator_space_after'
		]);
	});

	const flankText = new Map([
		['indent', { constant: 'INDENT_NEWLINE' as const }],
		['dedent', { constant: 'DEDENT_NEWLINE' as const }]
	]);

	it('wraps the single unseparated array of a kind in start and end choices when the grammar renders indentation', () => {
		const block = seq(str('{'), sym('statement', { id: 'r2', multiplicity: 'array', fieldName: 'statements' }), str('}'));
		const nodeMap = nodeMapOf({ block }, { r2: 'statements' });
		const out = spaceRenderRules({
			nodeMap,
			kindEntries,
			whitespaceText: flankText,
			defaults: { labels: {}, sites: { block: { start: { label: 'body_start', arm: 'indent' }, end: { arm: 'dedent' } } } }
		});
		const wrapper = (out.rules.block as unknown as { members: RenderRule[] }).members[1]!;
		const flanks = flanksOf(wrapper)!;
		expect(flanks.start).toEqual({ fieldName: 'statements_start', label: 'body_start', side: 'start', defaultArm: 'indent' });
		expect(flanks.end).toEqual({ fieldName: 'statements_end', label: 'block_end', side: 'end', defaultArm: 'dedent' });
		expect(spacedSeparatorOf(flanks.inner)?.after?.label).toBe('empty_separator_space');
		expect(spacingSitesOf(out, nodeMap).map((s) => `${s.address}=${s.defaultArm}`)).toEqual([
			'block_start=indent',
			'block_end=dedent',
			'statements_separator_space=space'
		]);
	});

	it('leaves arrays unflanked when the grammar renders no indentation, and refuses two arrays under one address', () => {
		const block = seq(sym('statement', { id: 'r2', multiplicity: 'array', fieldName: 'statements' }));
		expect(flanksOf((spaceRenderRules({ nodeMap: nodeMapOf({ block }, { r2: 'statements' }), kindEntries }).rules.block as unknown as { members: RenderRule[] }).members[0]!)).toBeUndefined();
		const two = seq(
			sym('a', { id: 'r3', multiplicity: 'array', fieldName: 'heads' }),
			sym('b', { id: 'r4', multiplicity: 'array', fieldName: 'tails' })
		);
		expect(() => spaceRenderRules({ nodeMap: nodeMapOf({ two }, { r3: 'heads', r4: 'tails' }), kindEntries, whitespaceText: flankText })).toThrow(
			/'two' holds 2 unseparated arrays \(heads, tails\)/
		);
	});

});

const seamed = (rules: Record<string, RenderRule>, slots: Record<string, string> = {}, extra: object = {}) => {
	const config = { nodeMap: nodeMapOf(rules, slots), kindEntries, ...extra };
	return { config, out: seamRenderRules(spaceRenderRules(config), config) };
};
const membersOf = (rule: RenderRule): RenderRule[] => (rule as unknown as { members: RenderRule[] }).members;
const memberNames = (rule: RenderRule): string[] =>
	membersOf(rule).map((m) => (isSeamChoice(m) ? `S(${seamPartOf(m).fieldName})` : ((m as { value?: string }).value ?? (m as { name?: string }).name!)));

describe('seamRenderRules', () => {
	it('injects a token seam choice on the token side of every seam, skipping keywords and seq edges', () => {
		const call = seq(str('fn'), sym('name'), str('('), sym('params'), str(')'));
		const { out, config } = seamed({ call });
		expect(memberNames(out.rules.call!)).toEqual(['fn', 'name', 'S(lparen_before)', '(', 'S(lparen_after)', 'params', 'S(rparen_before)', ')']);
		expect(seamPartOf(membersOf(out.rules.call!)[2]!)).toEqual({ fieldName: 'lparen_before', label: 'lparen_before', side: 'seam', defaultArm: 'tight' });
		expect(spacingSitesOf(out, config.nodeMap).map((s) => `${s.kind}.${s.slot} ${s.label}=${s.defaultArm} @${s.address} ${s.side}`)).toEqual([
			'call.lparen lparen_before=tight @lparen_before seam',
			'call.lparen lparen_after=tight @lparen_after seam',
			'call.rparen rparen_before=tight @rparen_before seam'
		]);
	});

	it('defaults to space where the seam-stamping dry run baked a space', () => {
		const spacedParen = { ...str(')'), staticSeamBefore: 'spaced' } as unknown as RenderRule;
		const { out } = seamed({ call: seq(sym('x'), spacedParen) });
		expect(seamPartOf(membersOf(out.rules.call!)[1]!).defaultArm).toBe('space');
	});

	it('gives two adjacent tokens both sites on the one seam, left after then right before', () => {
		const { out } = seamed({ body: seq(sym('x'), str(')'), str('{'), sym('y')) });
		expect(memberNames(out.rules.body!)).toEqual(['x', 'S(rparen_before)', ')', 'S(rparen_after)', 'S(lbrace_before)', '{', 'S(lbrace_after)', 'y']);
	});

	it('resolves a seam default by kind, then supertype, then label, then the stamp', () => {
		const rules = { a: seq(sym('x'), str('(')), b: seq(sym('x'), str('(')), c: seq(sym('x'), str('(')), d: seq(sym('x'), str('(')) };
		const config = {
			nodeMap: nodeMapOf(rules, {}, { supertypes: { _expression: ['b'] } }),
			kindEntries,
			defaults: {
				labels: { lparen_before: 'newline' },
				sites: { a: { lparen_before: { arm: 'space' } }, _expression: { lparen_before: { arm: 'tight' } } }
			}
		};
		const out = seamRenderRules(spaceRenderRules(config), config);
		const arm = (kind: string) => seamPartOf(membersOf(out.rules[kind]!)[1]!).defaultArm;
		expect([arm('a'), arm('b'), arm('c'), arm('d')]).toEqual(['space', 'tight', 'newline', 'newline']);
	});

	it('leaves separators, flanks, whitespace-only literals, optional literals and inlined helper rules alone', () => {
		const rules = {
			list: seq(str('('), commaList(), str(')')),
			owner: seq(sym('_helper', { inline: true })),
			_helper: seq(str('('), sym('x')),
			blank: seq(sym('x'), str(' '), sym('y')),
			opt: seq(sym('x'), { ...str(';'), multiplicity: 'optional' } as unknown as RenderRule)
		};
		const { out, config } = seamed(rules, { r1: 'items' });
		expect(spacedSeparatorOf(membersOf(out.rules.list!)[2]!)?.token).toEqual(str(','));
		expect(memberNames(out.rules.list!)).toEqual(['(', 'S(lparen_after)', 'item', 'S(rparen_before)', ')']);
		expect(out.rules._helper).toBe(rules._helper);
		expect(out.rules.blank).toBe(rules.blank);
		expect(out.rules.opt).toBe(rules.opt);
		expect(spacingSitesOf(out, config.nodeMap).filter((s) => s.side === 'seam').map((s) => s.kind)).toEqual(['list', 'list']);
	});

	it('gives every compound seq kind its own before and after edge seams as first and last members, named by the kind', () => {
		const rules = {
			call: seq(sym('x'), str('(')),
			_helper: seq(str('('), sym('y')),
			owner: seq(sym('_helper', { inline: true })),
			_call: seq(sym('z')),
			pick: { type: 'CHOICE', nonterminal: true, members: [sym('a'), sym('b')] } as unknown as RenderRule
		};
		const nodeMap = nodeMapOf(rules, {});
		for (const kind of ['call', '_helper', '_call', 'pick'] as const) nodeMap.nodes.set(kind, new AssembledBranch(kind, rules[kind] as never, rules[kind]));
		const config = { nodeMap, kindEntries, defaults: { labels: { call_after: 'newline' }, sites: {} } };
		const out = seamRenderRules(spaceRenderRules(config), config);
		expect(memberNames(out.rules.call!)).toEqual(['S(call_before)', 'x', 'S(lparen_before)', '(', 'S(call_after)']);
		const members = membersOf(out.rules.call!);
		expect(seamPartOf(members[0]!)).toEqual({ fieldName: 'call_before', label: 'call_before', side: 'seam', defaultArm: 'tight' });
		expect(seamPartOf(members[4]!)).toEqual({ fieldName: 'call_after', label: 'call_after', side: 'seam', defaultArm: 'newline' });
		expect(out.rules._helper).toBe(rules._helper);
		expect(out.rules._call).toBe(rules._call);
		expect(out.rules.pick).toBe(rules.pick);
		expect(spacingSitesOf(out, nodeMap).map((s) => s.address)).toEqual(['call_before', 'lparen_before', 'call_after']);
	});

	it('returns the rules untouched when the grammar registers no whitespace kinds', () => {
		const rules = { call: seq(sym('x'), str('(')) };
		const config = { nodeMap: nodeMapOf(rules, {}, { whitespace: false }), kindEntries };
		expect(seamRenderRules(spaceRenderRules(config), config).rules).toBe(rules);
	});

	it('fails on a default that names no preference, no site or no arm', () => {
		const rules = { list: commaList(), call: seq(sym('x'), str('(')) };
		const at = (defaults: object) => () => seamed(rules, { r1: 'items' }, { defaults });
		expect(at({ labels: { semi_separator_space_before: 'tight' }, sites: {} })).toThrow(/'semi_separator_space_before' is not a spacing preference/);
		expect(at({ labels: { rparen_before: 'tight' }, sites: {} })).toThrow(/'rparen_before' is not a spacing preference/);
		expect(at({ labels: {}, sites: { block: { items_separator_space_before: { arm: 'tight' } } } })).toThrow(/'block' names no kind or supertype with a spacing site/);
		expect(at({ labels: {}, sites: { list: { items_separator_space: { arm: 'tight' } } } })).toThrow(/list\.items_separator_space names no site/);
		expect(at({ labels: {}, sites: { call: { rparen_before: { arm: 'tight' } } } })).toThrow(/call\.rparen_before names no site/);
		expect(at({ labels: { comma_separator_space_before: 'wide' }, sites: {} })).toThrow(/is 'wide', not one of tight, space, newline/);
		expect(at({ labels: { lparen_before: 'indent' }, sites: {} })).toThrow(/is 'indent', not one of tight, space, newline/);
	});
});
