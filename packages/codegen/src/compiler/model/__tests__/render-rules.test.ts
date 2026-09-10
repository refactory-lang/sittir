import { describe, expect, it } from 'vitest';
import type { NodeMap } from '../../types.ts';
import type { RenderRule } from '../../../types/rule.ts';
import { flanksOf, isSeamChoice, resolveRenderRules, seamPartOf, seamRenderRules, spaceRenderRules, spacedSeparatorOf, spacingSitesOf } from '../render-rules.ts';
import { AssembledBranch, AssembledSupertype } from '../node-map.ts';
import type { RenderDefaults } from '../../../dsl/primitives/spacing.ts';
import { preference } from '../../../dsl/primitives/preference.ts';
import { formatPreferencePath } from '../../../dsl/primitives/preference-path.ts';

const sym = (name: string, extra: object = {}): RenderRule =>
	({ type: 'SYMBOL', name, nonterminal: true, ...extra }) as unknown as RenderRule;
const str = (value: string): RenderRule => ({ type: 'STRING', value, nonterminal: false }) as unknown as RenderRule;
const seq = (...members: RenderRule[]): RenderRule => ({ type: 'SEQ', members, nonterminal: true }) as unknown as RenderRule;

const kindEntries = [
	{ kind: 'comma', anon: true, symbolName: ',', member: 'Comma', id: 5 },
	{ kind: 'lparen', anon: true, symbolName: '(', member: 'Lparen', id: 7 },
	{ kind: 'rparen', anon: true, symbolName: ')', member: 'Rparen', id: 8 },
	{ kind: 'lbrace', anon: true, symbolName: '{', member: 'Lbrace', id: 9 },
	{ kind: 'fn', anon: true, symbolName: 'fn', member: 'Fn', id: 10 },
	{ kind: 'tight', member: 'Tight', id: 90 },
	{ kind: 'space', member: 'Space', id: 91 },
	{ kind: 'newline', member: 'Newline', id: 92 },
	{ kind: 'blankline', member: 'Blankline', id: 93 }
] as never;

function nodeMapOf(
	rules: Record<string, RenderRule>,
	slots: Record<string, string>,
	opts: { whitespace?: boolean; externals?: string[]; supertypes?: Record<string, string[]>; slotKinds?: Record<string, string[]> } = {}
): NodeMap {
	const nodes = new Map<string, unknown>();
	for (const kind of Object.keys(rules)) nodes.set(kind, { kind });
	if (opts.whitespace !== false) for (const w of ['_tight', '_space', '_newline', '_blankline', '_indent', '_dedent']) nodes.set(w, { kind: w });
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
	const slotByRuleId = new Map(
		Object.entries(slots).map(([id, name]) => [
			id,
			{ name, values: (opts.slotKinds?.[id] ?? []).map((kind) => ({ node: { kind }, multiplicity: 'array' })) }
		])
	);
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
			defaultArm: 'space',
			arms: ['tight', 'space', 'newline', 'blankline']
		});
		expect(spaced.after?.label).toBe('comma_separator_space_after');
		const choice = (out.rules.list as unknown as { separator: { value: { members: unknown[] } } }).separator.value.members[0] as {
			members: { name: string; annotations: object }[];
		};
		expect(choice.members.map((m) => m.name)).toEqual(['_tight', '_space', '_newline', '_blankline']);
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
			defaultArm: 'space',
			arms: ['tight', 'space', 'newline', 'blankline']
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

	it('spaces a separated list whose element may be a token, but not a glued repeat', () => {
		const choice = (members: RenderRule[], extra: object): RenderRule =>
			({ type: 'CHOICE', members, nonterminal: true, ...extra }) as unknown as RenderRule;
		const rules = {
			enums: choice([sym('word'), sym('number')], { id: 'r6', multiplicity: 'nonEmptyArray', fieldName: 'content', separator: { value: str(',') } }),
			glued: choice([sym('chars'), sym('number')], { id: 'r7', multiplicity: 'array', fieldName: 'pieces' }),
			word: sym('x'),
			number: sym('n', { tokenized: true }),
			chars: sym('c', { tokenized: true })
		};
		const nodeMap = nodeMapOf(rules, { r6: 'content', r7: 'pieces' });
		const out = spaceRenderRules({ nodeMap, kindEntries });
		expect(spacingSitesOf(out, nodeMap).map((s) => `${s.kind}.${s.address}`)).toEqual([
			'enums.content_separator_space_before',
			'enums.content_separator_space_after'
		]);
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
		const arms = ['tight', 'space', 'newline', 'blankline', 'indent', 'dedent'];
		expect(flanks.start).toEqual({ fieldName: 'statements_start', label: 'body_start', side: 'start', defaultArm: 'indent', arms });
		expect(flanks.end).toEqual({ fieldName: 'statements_end', label: 'block_end', side: 'end', defaultArm: 'dedent', arms });
		expect(spacedSeparatorOf(flanks.inner)?.after?.label).toBe('empty_separator_space');
		expect(spacingSitesOf(out, nodeMap).map((s) => `${s.address}=${s.defaultArm}`)).toEqual([
			'block_start=indent',
			'statements_separator_space=space',
			'block_end=dedent'
		]);
	});

	it('flanks a separated list too, leaves arrays unflanked without indentation, and gives none to a kind holding two arrays', () => {
		const list = commaList();
		const flanked = spaceRenderRules({ nodeMap: nodeMapOf({ list }, { r1: 'items' }), kindEntries, whitespaceText: flankText });
		expect(flanksOf(flanked.rules.list!)?.start.fieldName).toBe('items_start');
		expect(spacedSeparatorOf(flanksOf(flanked.rules.list!)!.inner)?.token).toEqual(str(','));
		const block = seq(sym('statement', { id: 'r2', multiplicity: 'array', fieldName: 'statements' }));
		expect(flanksOf((spaceRenderRules({ nodeMap: nodeMapOf({ block }, { r2: 'statements' }), kindEntries }).rules.block as unknown as { members: RenderRule[] }).members[0]!)).toBeUndefined();
		const two = seq(
			sym('a', { id: 'r3', multiplicity: 'array', fieldName: 'heads' }),
			sym('b', { id: 'r4', multiplicity: 'array', fieldName: 'tails' })
		);
		const out = spaceRenderRules({ nodeMap: nodeMapOf({ two }, { r3: 'heads', r4: 'tails' }), kindEntries, whitespaceText: flankText });
		expect(membersOf(out.rules.two!).map((m) => flanksOf(m))).toEqual([undefined, undefined]);
	});

	it('spaces a choice-of-literals separator like a literal one, naming the gap by the list kind', () => {
		const sep = { type: 'CHOICE', members: [str(','), str(';')] } as unknown as RenderRule;
		const list = sym('member', { id: 'r9', multiplicity: 'nonEmptyArray', fieldName: 'content', separator: { value: sep } });
		const defaults: RenderDefaults = { labels: {}, sites: { object_type_content: { content_separator: { label: 'separator', arm: 'semi' } } } };
		const config = { nodeMap: nodeMapOf({ object_type_content: list }, { r9: 'content' }), kindEntries, defaults };
		const out = spaceRenderRules(config);
		expect(spacingSitesOf(out, config.nodeMap).map((s) => `${s.address}:${s.label}`)).toEqual([
			'content_separator_space_before:object_type_content_separator_space_before',
			'content_separator_space_after:object_type_content_separator_space_after'
		]);
		expect(spacedSeparatorOf(out.rules.object_type_content!)?.token).toBe(sep);
	});
});

const seamed = (rules: Record<string, RenderRule>, slots: Record<string, string> = {}, extra: object = {}) => {
	const config = { nodeMap: nodeMapOf(rules, slots), kindEntries, ...extra };
	return { config, out: seamRenderRules(spaceRenderRules(config), config) };
};
const membersOf = (rule: RenderRule): RenderRule[] => (rule as unknown as { members: RenderRule[] }).members;
const memberNames = (rule: RenderRule): string[] =>
	membersOf(rule).map((m) => (isSeamChoice(m) ? `S(${seamPartOf(m).fieldName})` : ((m as { value?: string }).value ?? (m as { name?: string }).name ?? (m as { type: string }).type)));

describe('seamRenderRules', () => {
	it('injects a token seam choice on the token side of every seam, keywords included, skipping seq edges', () => {
		const call = seq(str('fn'), sym('name'), str('('), sym('params'), str(')'));
		const { out, config } = seamed({ call });
		expect(memberNames(out.rules.call!)).toEqual(['fn', 'S(fn_after)', 'name', 'S(lparen_before)', '(', 'S(lparen_after)', 'params', 'S(rparen_before)', ')']);
		expect(seamPartOf(membersOf(out.rules.call!)[3]!)).toEqual({ fieldName: 'lparen_before', label: 'lparen_before', side: 'seam', defaultArm: 'tight', arms: ['tight', 'space', 'newline', 'blankline'] });
		expect(spacingSitesOf(out, config.nodeMap).map((s) => `${s.kind}.${s.slot} ${s.label}=${s.defaultArm} @${s.address} ${s.side}`)).toEqual([
			'call.fn fn_after=tight @fn_after seam',
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

	it('treats a slot that is a choice of literals, or a fielded literal, as a seam named by the slot', () => {
		const op = (value: string): RenderRule => ({ type: 'STRING', value, nonterminal: false, fieldName: 'operator' }) as unknown as RenderRule;
		const rules = {
			binary: seq(
				sym('left'),
				{ type: 'CHOICE', nonterminal: true, members: [op('+'), { type: 'CHOICE', nonterminal: true, fieldName: 'operator', members: [str('=='), str('and')] }] } as unknown as RenderRule,
				sym('right')
			),
			unary: seq({ type: 'STRING', value: '-', nonterminal: true, fieldName: 'Sign' } as unknown as RenderRule, sym('x')),
			linked: seq(sym('a'), { type: 'CHOICE', nonterminal: true, members: [sym('plus', { literal: '+', fieldName: 'operator' }), { type: 'CHOICE', nonterminal: true, fieldName: 'operator', members: [sym('minus', { literal: '-' })] }] } as unknown as RenderRule, sym('b')),
			mixed: seq(sym('a'), { type: 'CHOICE', nonterminal: true, members: [op('+'), sym('kw')] } as unknown as RenderRule, sym('b')),
			words: seq(sym('a'), { type: 'CHOICE', nonterminal: true, members: [op('and'), op('or')] } as unknown as RenderRule, sym('b')),
			marker: seq(sym('readonly', { literal: 'readonly', fieldName: 'readonly_marker' }), sym('x'))
		};
		const { out, config } = seamed(rules);
		expect(memberNames(out.rules.binary!).filter((m) => m.startsWith('S('))).toEqual(['S(operator_before)', 'S(operator_after)']);
		expect(memberNames(out.rules.unary!).filter((m) => m.startsWith('S('))).toEqual(['S(sign_after)']);
		expect(memberNames(out.rules.linked!).filter((m) => m.startsWith('S('))).toEqual(['S(operator_before)', 'S(operator_after)']);
		expect(out.rules.mixed).toBe(rules.mixed);
		expect(out.rules.words).toBe(rules.words);
		expect(out.rules.marker).toBe(rules.marker);
		expect(spacingSitesOf(out, config.nodeMap).map((s) => `${s.kind}.${s.slot} @${s.address}`)).toEqual([
			'binary.operator @operator_before',
			'binary.operator @operator_after',
			'unary.sign @sign_after',
			'linked.operator @operator_before',
			'linked.operator @operator_after'
		]);
	});

	it('puts a seam inside a nested group whose edge member is a token, so an optional clause carries its opener seam', () => {
		const clause = { ...seq(str('='), sym('value')), multiplicity: 'optional' } as unknown as RenderRule;
		const ret = { ...seq(str('->'), sym('type')), staticSeamBefore: 'spaced' } as unknown as RenderRule;
		const tokens = [{ kind: 'dash_gt', anon: true, symbolName: '->', member: 'DashGt', id: 11 }, { kind: 'eq', anon: true, symbolName: '=', member: 'Eq', id: 12 }];
		const config = { nodeMap: nodeMapOf({ decl: seq(sym('pattern'), clause, ret, sym('body')) }, {}), kindEntries: [...(kindEntries as never[]), ...tokens] as never };
		const out = seamRenderRules(spaceRenderRules(config), config);
		const [pattern, clauseOut, retOut, body] = membersOf(out.rules.decl!);
		expect([pattern, body].map((m) => (m as { name: string }).name)).toEqual(['pattern', 'body']);
		expect(memberNames(clauseOut!)).toEqual(['S(eq_before)', '=', 'S(eq_after)', 'value']);
		expect((clauseOut as { multiplicity?: string }).multiplicity).toBe('optional');
		expect(seamPartOf(membersOf(clauseOut!)[0]!).defaultArm).toBe('tight');
		expect(memberNames(retOut!)).toEqual(['S(dash_gt_before)', '->', 'S(dash_gt_after)', 'type']);
		expect(seamPartOf(membersOf(retOut!)[0]!).defaultArm).toBe('space');
		expect(spacingSitesOf(out, config.nodeMap).map((s) => s.address)).toEqual(['eq_before', 'eq_after', 'dash_gt_before', 'dash_gt_after']);
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
		expect(memberNames(out.rules.call!)).toEqual([
			'S(call_before)',
			'x',
			'S(lparen_before)',
			'(',
			'S(lparen_after)',
			'S(call_after)'
		]);
		const members = membersOf(out.rules.call!);
		expect(seamPartOf(members[0]!)).toEqual({ fieldName: 'call_before', label: 'call_before', side: 'seam', defaultArm: 'tight', arms: ['tight', 'space', 'newline', 'blankline'] });
		expect(seamPartOf(members[4]!)).toEqual({ fieldName: 'lparen_after', label: 'lparen_after', side: 'seam', defaultArm: 'tight', arms: ['tight', 'space', 'newline', 'blankline'] });
		expect(seamPartOf(members[5]!)).toEqual({ fieldName: 'call_after', label: 'call_after', side: 'seam', defaultArm: 'newline', arms: ['tight', 'space', 'newline', 'blankline'] });
		expect(out.rules._helper).toBe(rules._helper);
		expect(out.rules._call).toBe(rules._call);
		expect(out.rules.pick).toBe(rules.pick);
		expect(spacingSitesOf(out, nodeMap).map((s) => s.address)).toEqual([
			'call_before',
			'lparen_before',
			'lparen_after',
			'call_after'
		]);
	});

	it('puts a list kind\'s edge seams around its flank wrapper, which stays a three-member seq', () => {
		const rules = { list: commaList() };
		const nodeMap = nodeMapOf(rules, { r1: 'items' });
		nodeMap.nodes.set('list', new AssembledBranch('list', rules.list as never, rules.list));
		const whitespaceText = new Map([['indent', { constant: 'INDENT_NEWLINE' as const }], ['dedent', { constant: 'DEDENT_NEWLINE' as const }]]);
		const config = { nodeMap, kindEntries, whitespaceText };
		const out = seamRenderRules(spaceRenderRules(config), config);
		const members = membersOf(out.rules.list!);
		expect(memberNames(out.rules.list!)).toEqual(['S(list_before)', 'SEQ', 'S(list_after)']);
		expect(flanksOf(members[1]!)?.start.fieldName).toBe('items_start');
		expect(spacingSitesOf(out, nodeMap).map((s) => s.address)).toEqual(['list_before', 'list_start', 'items_separator_space_before', 'items_separator_space_after', 'list_end', 'list_after']);
	});

	it('gives every seam the indentation arms when the grammar renders indentation, and walks each kind\'s depth in rule order', () => {
		const whitespaceText = new Map([['indent', { constant: 'INDENT_NEWLINE' as const }], ['dedent', { constant: 'DEDENT_NEWLINE' as const }]]);
		const arms = ['tight', 'space', 'newline', 'blankline', 'indent', 'dedent'];
		const rules = { arms: seq(sym('a'), sym('b')) };
		const nodeMap = nodeMapOf(rules, {});
		nodeMap.nodes.set('arms', new AssembledBranch('arms', rules.arms as never, rules.arms));
		const paired = { nodeMap, kindEntries, whitespaceText, defaults: { labels: { arms_before: 'indent', arms_after: 'dedent' }, sites: {} } };
		const out = seamRenderRules(spaceRenderRules(paired), paired);
		const [before, , , after] = membersOf(out.rules.arms!);
		expect(seamPartOf(before!)).toEqual({ fieldName: 'arms_before', label: 'arms_before', side: 'seam', defaultArm: 'indent', arms });
		expect(seamPartOf(after!).defaultArm).toBe('dedent');
		const unpaired = { nodeMap, kindEntries, whitespaceText, defaults: { labels: { arms_before: 'indent' }, sites: {} } };
		expect(() => seamRenderRules(spaceRenderRules(unpaired), unpaired)).toThrow(/arms opens an indent it never dedents/);
		const call = seq(sym('x'), str('('), sym('y'), str(')'));
		const braces = (sites: RenderDefaults['sites']) => ({ nodeMap: nodeMapOf({ call }, {}), kindEntries, whitespaceText, defaults: { labels: {}, sites } });
		const tokens = braces({ call: { lparen_after: { label: 'body_before', arm: 'indent' }, rparen_before: { label: 'body_after', arm: 'dedent' } } });
		const sites = spacingSitesOf(seamRenderRules(spaceRenderRules(tokens), tokens), tokens.nodeMap);
		expect(sites.map((s) => `${s.address}:${s.label}=${s.defaultArm}`)).toEqual(['lparen_before:lparen_before=tight', 'lparen_after:body_before=indent', 'rparen_before:body_after=dedent']);
		expect(sites.every((s) => s.arms.length === arms.length)).toBe(true);
		const closesFirst = braces({ call: { lparen_before: { arm: 'dedent' }, rparen_before: { arm: 'indent' } } });
		expect(() => seamRenderRules(spaceRenderRules(closesFirst), closesFirst)).toThrow(/call\.lparen_before dedents an indent it never opened/);
		const token = { nodeMap: nodeMapOf({ call: seq(sym('x'), str('(')) }, {}), kindEntries, defaults: { labels: { lparen_before: 'indent' }, sites: {} } };
		expect(() => seamRenderRules(spaceRenderRules(token), token)).toThrow(/'lparen_before' on call is 'indent', not one of tight, space, newline/);
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

describe('a seated child edge', () => {
	const seat = (defaults?: RenderDefaults) => {
		const rules = {
			file: sym('stmt', { id: 'r9', multiplicity: 'array', fieldName: 'statements' }),
			solo: sym('attr', { id: 'r8', multiplicity: 'array', fieldName: 'only' }),
			attr: seq(str('#'), sym('a')),
			item: seq(str('fn'), sym('b'))
		};
		const nodeMap = nodeMapOf(rules, { r9: 'statements', r8: 'only' }, { slotKinds: { r9: ['attr', 'item'], r8: ['attr'] } });
		for (const kind of ['file', 'solo', 'attr', 'item'] as const) {
			nodeMap.nodes.set(kind, new AssembledBranch(kind, rules[kind] as never, rules[kind]));
		}
		const config = { nodeMap, kindEntries, defaults };
		return spacingSitesOf(seamRenderRules(spaceRenderRules(config), config), nodeMap);
	};

	it('seats one per (slot, child kind) where a slot admits several', () => {
		const paths = seat()
			.filter((s) => s.seat !== undefined)
			.map((s) => formatPreferencePath(s.path!));
		expect(paths).toContain('(file)/statements:/(attr)/after');
		expect(paths).toContain('(file)/statements:/(item)/after');
	});

	it('seats the one child of a slot that admits a single kind', () => {
		const only = seat().filter((s) => s.seat !== undefined && s.slot === 'only');
		expect(only.map((s) => formatPreferencePath(s.path!))).toEqual(['(solo)/only:/(attr)/after']);
	});

	it('takes the arm the child edge already resolves to, so minting moves nothing', () => {
		const sites = seat({ labels: { attr_after: 'newline' }, sites: {} });
		const global = sites.find((s) => s.kind === 'attr' && s.address === 'attr_after')!;
		const seated = sites.find((s) => s.kind === 'file' && s.seat?.kind === 'attr')!;
		expect(global.defaultArm).toBe('newline');
		expect(seated.defaultArm).toBe('newline');
		expect(seated.seat?.field).toBe('attr_after');
	});
});

describe('the options block reaches a site', () => {
	const braced = { block: seq(str('{'), sym('body')), body: seq(sym('x')) };
	const armOf = (out: { rules: Record<string, RenderRule> }, address: string): string | undefined =>
		spacingSitesOf(out as never, nodeMapOf(braced, {})).find((s) => s.address === address)?.defaultArm;
	const resolved = (extra: object = {}) => {
		const config = { nodeMap: nodeMapOf(braced, {}), kindEntries, ...extra } as never;
		return resolveRenderRules(config, () => {}).seamed;
	};

	it('leaves a site on its fallback when nothing declares it', () => {
		const out = resolved();
		expect(armOf(out, 'lbrace_after')).toBe('tight');
	});

	it('a declaration under a kind sets that site', () => {
		const out = resolved({ options: { block: { '"{"/after': preference('newline') } } });
		expect(armOf(out, 'lbrace_after')).toBe('newline');
	});

	it('a binding to a virtual label sets every address bound to it', () => {
		const out = resolved({
			options: {
				indented: { before: preference('newline') },
				_bindings: { 'block/"{"/after': 'indented/before' }
			}
		});
		expect(armOf(out, 'lbrace_after')).toBe('newline');
	});

	it('rejects a virtual label that shadows a kind the grammar has', () => {
		expect(() =>
			resolved({
				options: {
					body: { before: preference('newline') },
					_bindings: { 'block/"{"/after': 'body/before' }
				}
			})
		).toThrow(/names the kind 'body'/);
	});

	it('agrees with the patches spelling it replaces', () => {
		const viaPatches = resolved({
			defaults: { labels: {}, sites: { block: { lbrace_after: { label: 'lbrace_after', arm: 'newline' } } } } as RenderDefaults
		});
		const viaOptions = resolved({ options: { block: { '"{"/after': preference('newline') } } });
		expect(armOf(viaOptions, 'lbrace_after')).toBe(armOf(viaPatches, 'lbrace_after'));
	});

	it('rejects an address that names no site', () => {
		expect(() => resolved({ options: { block: { '"("/after': preference('newline') } } })).toThrow(/names no site/);
	});
});
