import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enrich } from '../enrich.ts';
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
});
