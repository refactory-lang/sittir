import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { enrich, type AuthoredFieldSite } from '../enrich.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

beforeAll(() => installFakeDsl());
afterAll(() => restoreFakeDsl());

const sym = (name: string) => ({ type: 'SYMBOL', name });
const str = (value: string) => ({ type: 'STRING', value });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
const repeat = (content: unknown) => ({ type: 'REPEAT', content });

const body = () =>
	seq(
		choice(seq(sym('identifier'), sym('text')), seq(sym('text'), sym('text')), seq(sym('text'), sym('identifier'))),
		repeat(choice(sym('text'), sym('identifier')))
	);
const leaves = { identifier: { type: 'PATTERN', value: '[a-z]+' }, text: seq(str('"'), str('"')) };

const armPaths = [[0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1], [0, 2, 0], [0, 2, 1]];
const sites = (nameAt: (path: readonly number[]) => string): AuthoredFieldSite[] => [
	...armPaths.map((path) => ({ path, name: nameAt(path) })),
	{ path: [1], name: 'strings' }
];

function ruleNames(fieldSites?: readonly AuthoredFieldSite[]): string[] {
	const out = enrich({ grammar: { name: 'test', rules: { ...leaves, joined: body() }, supertypes: [] } } as never, fieldSites === undefined ? {} : { fieldSites: new Map([['joined', fieldSites]]) }) as unknown as {
		grammar: { rules: Record<string, unknown> };
	};
	return Object.keys(out.grammar.rules);
}

describe('a choice arm whose positions are all authored into one field', () => {
	it('mints an arm kind when no field is authored', () => {
		expect(ruleNames().filter((name) => name.startsWith('joined_'))).toEqual(['joined_arm']);
	});

	it('is not minted: it adds items to one list slot', () => {
		expect(ruleNames(sites(() => 'strings')).filter((name) => name.startsWith('joined_'))).toEqual([]);
	});

	const f = (name: string, content: unknown) => ({ type: 'FIELD', name, content });
	const minted = (rule: unknown): string[] => {
		const out = enrich({ grammar: { name: 'test', rules: { ...leaves, joined: rule }, supertypes: [] } } as never, {}) as unknown as { grammar: { rules: Record<string, unknown> } };
		return Object.keys(out.grammar.rules).filter((name) => name.startsWith('joined_'));
	};

	it('is not minted when the one field is already on the rule', () => {
		expect(minted(seq(choice(seq(f('parts', sym('text')), f('parts', sym('identifier'))), seq(f('parts', sym('identifier')), f('parts', sym('text')))), sym('text')))).toEqual([]);
	});

	it('is not minted when an arm holds its field through a repeat', () => {
		expect(minted(choice(seq(f('parts', sym('text')), repeat(f('parts', sym('identifier')))), seq(f('parts', sym('identifier')), f('parts', sym('text')))))).toEqual([]);
	});

	it('mints when fixed text sits between an arm\'s fields, since a list would lose it', () => {
		expect(minted(choice(seq(f('parts', sym('text')), str(','), f('parts', sym('identifier'))), seq(f('parts', sym('identifier')), f('parts', sym('text')))))).toEqual(['joined_arm1', 'joined_arm2']);
	});

	it('is not minted as an arm beside a blank', () => {
		expect(minted(seq(sym('text'), choice(seq(f('parts', sym('text')), f('parts', sym('identifier'))), { type: 'BLANK' }))).filter((name) => name.includes('_arm'))).toEqual([]);
	});

	it('mints when each arm holds one field but the fields differ', () => {
		expect(minted(seq(choice(seq(f('a', sym('text')), f('a', sym('identifier'))), seq(f('b', sym('identifier')), f('b', sym('text')))), sym('text'))).length).toBeGreaterThan(0);
	});

	it('mints when an unfielded arm sits beside the fielded one', () => {
		expect(minted(seq(choice(seq(f('a', sym('text')), f('a', sym('identifier'))), sym('identifier')), sym('text'))).length).toBeGreaterThan(0);
	});

	it('mints both arms when one holds a second field, as an array creation does', () => {
		expect(minted(seq(sym('text'), choice(seq(f('dimensions', sym('text')), f('dimensions', sym('identifier'))), seq(f('dimensions', sym('identifier')), f('value', sym('text')))))).length).toBe(2);
	});

	it('is still minted when its positions carry two fields', () => {
		const named = ruleNames(sites((path) => (path[1] === 0 && path[2] === 0 ? 'left' : 'strings')));
		expect(named.filter((name) => name.startsWith('joined_'))).toEqual(['joined_arm']);
	});
});
