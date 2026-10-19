import { describe, expect, it } from 'vitest';
import { grammarBindingsPatches } from '../grammar-bindings.ts';

const SYM = (name: string, extra: Record<string, unknown> = {}) => ({ type: 'SYMBOL', name, ...extra });
const LIFT = (name: string) => SYM(name, { metadata: { symbolSource: 'group-lift' } });
const REPEAT = (content: unknown) => ({ type: 'REPEAT', content });
const REPEAT1 = (content: unknown) => ({ type: 'REPEAT1', content });
const SEQ = (...members: unknown[]) => ({ type: 'SEQ', members });
const CHOICE = (...members: unknown[]) => ({ type: 'CHOICE', members });
const STRING = (value: string) => ({ type: 'STRING', value });
const BLANK = { type: 'BLANK' };
const OPTIONAL = (content: unknown) => CHOICE(content, BLANK);
const FIELD = (name: string, content: unknown) => ({ type: 'FIELD', name, content });
const ALIAS = (content: unknown, value: string, extra: Record<string, unknown> = {}) => ({ type: 'ALIAS', content, value, named: true, ...extra });
const PREC = (content: unknown) => ({ type: 'PREC', value: 1, content });
const TOKEN = (content: unknown) => ({ type: 'TOKEN', content });

const wrapA = [{ owner: 'owner', field: 'x', target: { symbol: 'a' } }];

function patchesOf(
	rules: Record<string, unknown>,
	options: {
		readonly renames?: readonly { readonly owner: string; readonly from: string; readonly to: string }[];
		readonly wraps?: readonly unknown[];
		readonly aliases?: Readonly<Record<string, string>>;
	} = {}
) {
	return [...grammarBindingsPatches({ name: 'demo', rules } as never, options.renames ?? [], (options.wraps ?? []) as never, options.aliases ?? {})];
}

describe('repeat wraps: a REPEAT whose whole content is the target is fielded at the repeat', () => {
	it('fields REPEAT(a) at the repeat itself', () => {
		expect(patchesOf({ owner: REPEAT(SYM('a')) }, { wraps: wrapA })).toEqual([
			[
				'owner',
				[
					[
						{
							path: '.',
							edit: { field: 'x' }
						}
					]
				]
			]
		]);
	});

	it('fields REPEAT1(a) at the repeat itself', () => {
		expect(patchesOf({ owner: REPEAT1(SYM('a')) }, { wraps: wrapA })).toEqual([
			[
				'owner',
				[
					[
						{
							path: '.',
							edit: { field: 'x' }
						}
					]
				]
			]
		]);
	});

	it('fields the repeat under an optional as well', () => {
		expect(patchesOf({ owner: OPTIONAL(REPEAT(SYM('a'))) }, { wraps: wrapA })).toEqual([
			[
				'owner',
				[
					[
						{
							path: '-2',
							edit: { field: 'x' }
						}
					]
				]
			]
		]);
	});

	it('fields a target inside a repeated SEQ at the symbol, not the repeat', () => {
		expect(patchesOf({ owner: REPEAT(SEQ(SYM('a'), STRING(','))) }, { wraps: wrapA })).toEqual([
			[
				'owner',
				[
					[
						{
							path: '0/0',
							edit: { field: 'x' }
						}
					]
				]
			]
		]);
	});
});

describe('alias geometry', () => {
	it('fields and aliases a wrapped symbol that is also aliased', () => {
		expect(patchesOf({ owner: SEQ(SYM('a'), SYM('b')) }, { wraps: wrapA, aliases: { a: 'a2', b: 'b2' } })).toEqual([
			[
				'owner',
				[
					[
						{
							path: '0',
							edit: { field: 'x' }
						}
					],
					[
						{
							path: '0/0',
							edit: { alias: 'a2' }
						},
						{
							path: '1',
							edit: { alias: 'b2' }
						}
					]
				]
			]
		]);
	});

	it('fields the root and aliases it when a wrap sits at the root', () => {
		expect(patchesOf({ owner: SYM('a') }, { wraps: wrapA, aliases: { a: 'a2' } })).toEqual([
			[
				'owner',
				[
					[
						{
							path: '.',
							edit: { field: 'x' }
						}
					],
					[
						{
							path: '-1',
							edit: { alias: 'a2' }
						}
					]
				]
			]
		]);
	});

	it('reaches a wrap under a precedence', () => {
		expect(patchesOf({ owner: PREC(SEQ(PREC(SYM('a')), STRING(';'))) }, { wraps: wrapA, aliases: { a: 'a2' } })).toEqual([
			[
				'owner',
				[
					[
						{
							path: '0',
							edit: { field: 'x' }
						}
					],
					[
						{
							path: '0/0',
							edit: { alias: 'a2' }
						}
					]
				]
			]
		]);
	});

	it('fields a choice root by the arm the wrap targets', () => {
		expect(patchesOf({ owner: CHOICE(SYM('a'), SYM('b'), STRING('c')) }, { wraps: wrapA, aliases: { b: 'b2' } })).toEqual([
			[
				'owner',
				[
					[
						{
							path: '-3',
							edit: { field: 'x' }
						}
					],
					[
						{
							path: '-2',
							edit: { alias: 'b2' }
						}
					]
				]
			]
		]);
	});

	it('keeps an alias nested inside an alias', () => {
		expect(patchesOf({ owner: SEQ(ALIAS(SYM('a'), 'shown'), SYM('a')) }, { aliases: { a: 'a2' } })).toEqual([
			[
				'owner',
				[
					[
						{
							path: '1',
							edit: { alias: 'a2' }
						}
					]
				]
			]
		]);
	});
});

describe('renames', () => {
	it('renames a field in place', () => {
		expect(patchesOf({ owner: SEQ(FIELD('f', SYM('a')), STRING(';')) }, { renames: [{ owner: 'owner', from: 'f', to: 'g' }] })).toEqual([
			[
				'owner',
				[
					[
						{
							path: '0',
							edit: { field: 'g' }
						}
					]
				]
			]
		]);
	});

	it('renames a field through a hidden host, keyed by the host', () => {
		expect(
			patchesOf(
				{ owner: SEQ(SYM('_h'), STRING(';')), _h: SEQ(FIELD('f', SYM('a')), SYM('b')) },
				{ renames: [{ owner: 'owner', from: 'f', to: 'g' }], aliases: { b: 'b2' } }
			)
		).toEqual([
			[
				'_h',
				[
					[
						{
							path: '0',
							edit: { field: 'g' }
						}
					],
					[
						{
							path: '1',
							edit: { alias: 'b2' }
						}
					]
				]
			]
		]);
	});

	it('applies a wrap and a rename on one rule together', () => {
		expect(
			patchesOf(
				{ owner: SEQ(FIELD('f', SYM('c')), SYM('a'), REPEAT(SYM('a'))) },
				{ wraps: wrapA, renames: [{ owner: 'owner', from: 'f', to: 'g' }], aliases: { c: 'c2' } }
			)
		).toEqual([
			[
				'owner',
				[
					[
						{
							path: '0',
							edit: { field: 'g' }
						},
						{
							path: '1',
							edit: { field: 'x' }
						},
						{
							path: '2',
							edit: { field: 'x' }
						}
					],
					[
						{
							path: '0/0',
							edit: { alias: 'c2' }
						}
					]
				]
			]
		]);
	});
});

describe('where wraps do not reach', () => {
	it('leaves a target inside a token or a field alone', () => {
		expect(patchesOf({ owner: SEQ(TOKEN(SEQ(SYM('a'))), FIELD('f', SYM('a')), SYM('a')) }, { wraps: wrapA })).toEqual([
			[
				'owner',
				[
					[
						{
							path: '2',
							edit: { field: 'x' }
						}
					]
				]
			]
		]);
	});
});

describe('wraps in a sequence and on a token', () => {
	it('fields the symbol inside a plain sequence', () => {
		expect(patchesOf({ owner: SEQ(SYM('a'), STRING(',')) }, { wraps: wrapA })).toEqual([
			[
				'owner',
				[
					[
						{
							path: '0',
							edit: { field: 'x' }
						}
					]
				]
			]
		]);
	});

	it('fields a token wrap at the token', () => {
		expect(patchesOf({ owner: SEQ(STRING('pub'), SYM('a')) }, { wraps: [{ owner: 'owner', field: 'vis', target: { token: 'pub' } }] })).toEqual([
			[
				'owner',
				[
					[
						{
							path: '0',
							edit: { field: 'vis' }
						}
					]
				]
			]
		]);
	});
});

describe('lifts', () => {
	it('enters a lifted group once, fielding it and aliasing inside it', () => {
		expect(
			patchesOf(
				{ owner: SEQ(LIFT('_g'), LIFT('_g')), _g: SEQ(SYM('a'), STRING(',')) },
				{ wraps: wrapA, aliases: { a: 'a2' } }
			)
		).toEqual([
			[
				'owner',
				[
					[
						{
							path: '0/0',
							edit: { field: 'x' }
						}
					],
					[
						{
							path: '0/0/0',
							edit: { alias: 'a2' }
						}
					]
				]
			]
		]);
	});
});
