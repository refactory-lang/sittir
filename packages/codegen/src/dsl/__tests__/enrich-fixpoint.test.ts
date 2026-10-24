import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enrich } from '../enrich.ts';
import { getEnrichAutomaticVariants, withoutAutomaticVariants } from '../automatic-variants.ts';
import { isSupertypeLike } from '../rule-patterns.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

const S = (value: string) => ({ type: 'STRING', value });
const P = (value: string) => ({ type: 'PATTERN', value });
const sym = (name: string, inline = false) => ({ type: 'SYMBOL', name, inline });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
const optional = (content: unknown) => ({ type: 'OPTIONAL', content });
const repeat = (content: unknown) => ({ type: 'REPEAT', content });
const repeat1 = (content: unknown) => ({ type: 'REPEAT1', content });
const field = (name: string, content: unknown) => ({ type: 'FIELD', name, content });
const alias = (content: unknown, value: string) => ({ type: 'ALIAS', content, named: true, value });
const token = (content: unknown) => ({ type: 'TOKEN', content });
const grammarWith = (rules: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({ name: 'demo', rules, supertypes: [], extras: [], externals: [], ...extra });
const rulesOf = (g: unknown) => (g as { rules: Record<string, unknown> }).rules;

function again(grammar: unknown, authored = {}): { names: string[]; minted: string[] } {
	const first = enrich(structuredClone(grammar) as never, authored);
	const second = enrich(first as never, authored);
	const a = rulesOf(first);
	const b = rulesOf(second);
	return {
		names: Object.keys(b).filter((name) => name in a && JSON.stringify(a[name]) !== JSON.stringify(b[name])),
		minted: Object.keys(b).filter((name) => !(name in a))
	};
}

describe('enrich is a fixpoint of its own output', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	it('wraps no group-lift reference in a field', () => {
		const out = again(grammarWith({ use_wildcard: seq(optional(seq(optional(sym('path')), S('::'))), S('*')), path: P('[a-z]+') }));
		expect(out).toEqual({ names: [], minted: [] });
	});

	it('leaves a visible-group alias undistributed', () => {
		const pair = choice(seq(field('left', sym('left')), S(','), field('right', sym('right'))), seq(field('left', sym('right')), S(';'), field('right', sym('left'))));
		const rules = { parent: seq(S('x'), choice(sym('_pair'), sym('other'))), _pair: pair, left: P('l'), right: P('r'), other: P('o') };
		const out = again(grammarWith(rules, { inline: ['_pair'] }));
		expect(out).toEqual({ names: [], minted: [] });
	});

	it('does not field-wrap the symbol of a minted text token', () => {
		const rep = seq(S('$'), S('('), repeat(sym('item')), S(')'), optional(P('[^+*?]+')), choice(S('+'), S('*'), S('?')));
		const out = again(grammarWith({ rep, item: P('x') }));
		expect(out).toEqual({ names: [], minted: [] });
	});

	it('does not list-wrap a repeat over a minted text token', () => {
		const out = again(grammarWith({ string_content: repeat1(choice(P('[^"\\\\]+'), sym('escape'))), escape: P('\\\\.') }));
		expect(out).toEqual({ names: [], minted: [] });
	});

	it('does not promote a minted keyword rule to a visible group', () => {
		const out = again(grammarWith({ modifiers: repeat1(choice(S('async'), S('const'), sym('extern_modifier'))), extern_modifier: seq(S('extern'), P('"[a-z]+"')) }));
		expect(out).toEqual({ names: [], minted: [] });
	});

	it('keeps the authored slot of an element supertype it minted', () => {
		const body = seq(S('{'), repeat(choice(sym('method'), sym('prop'), seq(sym('decorator'), sym('method')))), S('}'));
		const rules = { class_body: body, method: P('m'), prop: P('p'), decorator: P('d') };
		const authored = { fieldSites: new Map([['class_body', [{ path: [1], name: 'members' }]]]) };
		expect(again(grammarWith(rules), authored)).toEqual({ names: [], minted: [] });
	});

	it('keeps the authored sites of a token-form arm it minted', () => {
		const digits = P('[0-9]+');
		const form = (separator: string) => seq(choice(S('0'), seq(optional(S('0')), P('[1-9]'))), S(separator), optional(digits));
		const rules = { number: token(choice(form('.'), form(','))), };
		const authored = { fieldSites: new Map([['number', [{ path: [1, 0, 0], name: 'integer' }]]]) };
		expect(again(grammarWith(rules), authored)).toEqual({ names: [], minted: [] });
	});

	it('names a hidden list from its element, not from the item field it added', () => {
		const item = choice(sym('expression'), sym('splat'));
		const elems = seq(item, repeat(seq(S(','), item)), optional(S(',')));
		const rules = { set: seq(S('{'), sym('_collection_elements'), S('}')), list: seq(S('['), optional(sym('_collection_elements')), S(']')), _collection_elements: elems, expression: P('e'), splat: P('s') };
		expect(again(grammarWith(rules, { inline: ['_collection_elements'] }))).toEqual({ names: [], minted: [] });
	});

	it('reads a choice as a supertype whether or not its alias over a choice was distributed', () => {
		const names = choice(S('default'), S('union'));
		const prec = (content: unknown) => ({ type: 'PREC_LEFT', value: 0, content });
		const authored = choice(sym('unary'), prec(alias(names, 'identifier')));
		const distributed = choice(sym('unary'), prec(choice(alias(S('default'), 'identifier'), alias(S('union'), 'identifier'))));
		expect(isSupertypeLike(distributed)).toBe(isSupertypeLike(authored));
	});

	it('reads the whitespace externals it added as its own, not upstream', () => {
		const out = again(grammarWith({ file: repeat(sym('word')), word: P('[a-z]+') }, { extras: [P('\\s')] }));
		expect(out).toEqual({ names: [], minted: [] });
	});

	it('keeps the layout supertype body a later stage decorated', () => {
		const first = enrich(structuredClone(grammarWith({ file: repeat(sym('word')), word: P('[a-z]+') }, { extras: [P('\\s')] })) as never, {});
		const rules = rulesOf(first);
		const members = (rules._layout as { members: { name: string }[] }).members;
		const decorated = { type: 'CHOICE', members: members.map((m) => alias(m, m.name.slice(1))) };
		rules._layout = decorated;
		expect(rulesOf(enrich(first as never, {}))._layout).toEqual(decorated);
	});

	it('leaves the content of an override field alone', () => {
		const first = enrich(structuredClone(grammarWith({ param: seq(S('x'), sym('self')), self: P('s'), lifetime: P("'[a-z]+") })) as never, {});
		const rules = rulesOf(first);
		rules._kw_reference = seq(S('&'), S('!'));
		const reference = { ...field('reference', optional(sym('_kw_reference'))), metadata: { fieldSource: 'override' } };
		rules.param = seq(reference, S('x'), { ...field('self', sym('self')), metadata: { fieldSource: 'enriched' } });
		const before = JSON.stringify(rules.param);
		expect(JSON.stringify(rulesOf(enrich(first as never, {})).param)).toBe(before);
	});

	it('does not extract an enum from an override field', () => {
		const first = enrich(structuredClone(grammarWith({ spec: seq(S('x'), sym('name')), name: P('[a-z]+') })) as never, {});
		const rules = rulesOf(first);
		const kind = { ...field('kind', choice(S('type'), S('typeof'))), metadata: { fieldSource: 'override' } };
		rules.spec = seq(kind, S('x'), { ...field('name', sym('name')), metadata: { fieldSource: 'enriched' } });
		const before = JSON.stringify(rules.spec);
		const second = rulesOf(enrich(first as never, {}));
		expect(JSON.stringify(second.spec)).toBe(before);
		expect(Object.keys(second).filter((name) => !(name in rules))).toEqual([]);
	});

	it('wraps a symbol the unalias stage left bare in the first pass', () => {
		const tree = choice(seq(S('('), repeat(sym('item')), S(')')), seq(S('['), repeat(sym('item')), S(']')));
		const rules = {
			invocation: seq(field('macro', sym('name')), S('!'), alias(sym('delim_token_tree'), 'token_tree')),
			delim_token_tree: tree,
			token_tree: seq(S('<'), repeat(sym('item')), S('>')),
			name: P('[a-z]+'),
			item: P('[0-9]+')
		};
		expect(again(grammarWith(rules))).toEqual({ names: [], minted: [] });
	});

	it('keeps a bare separated-list item unfielded in the first pass, and mints nothing on a second', () => {
		const generic = seq(
			S('_Generic'),
			S('('),
			sym('expression'),
			S(','),
			seq(seq(sym('type_descriptor'), S(':'), sym('expression')), repeat(seq(S(','), seq(sym('type_descriptor'), S(':'), sym('expression'))))),
			S(')')
		);
		const grammar = grammarWith({ generic_expression: generic, expression: P('[a-z]+'), type_descriptor: P('[a-z]+') });
		const first = rulesOf(enrich(structuredClone(grammar) as never, {}));
		expect((first.generic_expression as { members: unknown[] }).members[2]).toMatchObject({ type: 'SYMBOL', name: 'expression' });
		expect(again(grammar)).toEqual({ names: [], minted: [] });
	});

	it('mints no arm for keyword repeats in a choice arm, and mints nothing on a second', () => {
		const kw = choice(S('signed'), S('unsigned'), S('long'), S('short'));
		const type = optional(choice(sym('type_identifier'), sym('primitive_type')));
		const sized = choice(
			seq(repeat(kw), field('type', type), repeat1(kw)),
			seq(repeat1(kw), repeat(sym('type_qualifier')), field('type', type), repeat(kw))
		);
		const grammar = grammarWith({
			sized_type_specifier: sized,
			type_identifier: P('[A-Za-z_]+'),
			primitive_type: P('int|char'),
			type_qualifier: P('const')
		});
		const first = rulesOf(enrich(structuredClone(grammar) as never, {}));
		expect(Object.keys(first)).not.toContain('sized_type_specifier_arm');
		expect(again(grammar)).toEqual({ names: [], minted: [] });
	});

	it('carries the automatic-label provenance through a second pass', () => {
		const grammar = grammarWith({ source: choice(sym('word'), sym('num')), word: P('[a-z]+'), num: P('[0-9]+') });
		const first = enrich(structuredClone(grammar) as never, {});
		const second = enrich(first as never, {});
		const firstKeys = getEnrichAutomaticVariants(first)!;
		const secondKeys = getEnrichAutomaticVariants(second)!;
		expect(firstKeys.keys.size).toBeGreaterThan(0);
		expect([...secondKeys.keys].sort()).toEqual([...firstKeys.keys].sort());
		expect(JSON.stringify(withoutAutomaticVariants(rulesOf(second).source, secondKeys))).toBe(
			JSON.stringify(withoutAutomaticVariants(rulesOf(first).source, firstKeys))
		);
	});
});
