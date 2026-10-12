import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enrich } from '../enrich.ts';
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
});
