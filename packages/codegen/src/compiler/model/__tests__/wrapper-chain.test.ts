import { describe, expect, it } from 'vitest';
import { CHOICE, FIELD, OPTIONAL, PATTERN, REPEAT1, SEQ, STRING, SYMBOL } from '../../../types/rule-types.ts'; // @rule-type-consts
import type { RawGrammar } from '../../types.ts';
import type { Rule } from '../../../types/rule.ts';
import { assemblePredicted, rawIdTablesOf, withFixtureLexicalRanks } from '../../../__tests__/helpers/linked.ts';
import { wrapperChainsOf } from '../wrapper-chain.ts';

type Raw = Rule<'evaluate'>;

const sym = (name: string): Raw => ({ type: SYMBOL, name }) as Raw;
const str = (value: string): Raw => ({ type: STRING, value }) as Raw;
const field = (name: string, content: Raw): Raw => ({ type: FIELD, name, content }) as Raw;
const seq = (...members: Raw[]): Raw => ({ type: SEQ, members }) as Raw;
const choice = (...members: Raw[]): Raw => ({ type: CHOICE, members }) as Raw;
const optional = (content: Raw): Raw => ({ type: OPTIONAL, content }) as Raw;
const repeat1 = (content: Raw): Raw => ({ type: REPEAT1, content }) as Raw;

const LEAVES: Record<string, Raw> = {
	name: { type: PATTERN, value: '[a-z]+' } as Raw,
	number: { type: PATTERN, value: '[0-9]+' } as Raw,
	expr: choice(sym('name'), sym('number'))
};

function chainsOf(rules: Record<string, Raw>): string[] {
	const raw: RawGrammar = {
		name: 'synth',
		fileTypes: [],
		rules: { ...rules, ...LEAVES } as RawGrammar['rules'],
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		evaluateSynthesized: new Set<string>(),
		extras: [],
		externals: [],
		supertypes: ['expr'],
		factoryInline: [],
		inline: [],
		conflicts: [],
		precedences: [],
		word: null,
		references: []
	};
	const { nodeMap } = assemblePredicted(raw, withFixtureLexicalRanks(rawIdTablesOf(raw)));
	return wrapperChainsOf(nodeMap).map((chain) => `${chain.holder}.${chain.slot}: ${chain.wrappers.join(' > ')}`);
}

describe('a holder slot reads through a wrapper', () => {
	it('when the wrapper has one slot, spells only fixed tokens, and is the only kind the slot admits', () => {
		expect(
			chainsOf({
				holder: seq(str('let'), field('annotation', sym('annotation'))),
				annotation: seq(str(':'), field('type', sym('expr')))
			})
		).toEqual(['holder.annotation: annotation']);
	});

	it('through a wrapper whose slot holds a list', () => {
		expect(
			chainsOf({
				holder: seq(str('call'), field('arguments', sym('arguments'))),
				arguments: seq(str('('), field('items', repeat1(sym('expr'))), str(')'))
			})
		).toEqual(['holder.arguments: arguments']);
	});

	it('through every wrapper of a composed chain, and stops at a slot that admits more than one kind', () => {
		expect(
			chainsOf({
				holder: seq(str('def'), field('parameters', sym('outer'))),
				outer: seq(str('<'), field('inner', sym('inner')), str('>')),
				inner: seq(str('('), field('items', repeat1(sym('expr'))), str(')'))
			})
		).toEqual(['holder.parameters: outer > inner', 'outer.inner: inner']);
	});

	it('when the wrapper slot is optional and the holder slot is required', () => {
		expect(
			chainsOf({
				holder: seq(str('def'), field('parameters', sym('parens'))),
				parens: seq(str('('), optional(field('items', sym('expr'))), str(')'))
			})
		).toEqual(['holder.parameters: parens']);
	});
});

describe('a holder slot keeps the wrapper', () => {
	it('when the wrapper slot is optional and the holder slot is optional, because presence is a fact', () => {
		expect(
			chainsOf({
				holder: seq(str('new'), optional(field('arguments', sym('parens')))),
				parens: seq(str('('), optional(field('items', sym('expr'))), str(')'))
			})
		).toEqual([]);
	});

	it('when the wrapper spells a token only sometimes', () => {
		expect(
			chainsOf({
				holder: seq(str('def'), field('body', sym('body'))),
				body: seq(optional(str('async')), field('items', sym('expr')))
			})
		).toEqual([]);
	});

	it('when the wrapper has more than one slot', () => {
		expect(
			chainsOf({
				holder: seq(str('def'), field('pair', sym('pair'))),
				pair: seq(field('left', sym('expr')), str('='), field('right', sym('expr')))
			})
		).toEqual([]);
	});

	it('when the holder slot admits another kind beside the wrapper', () => {
		expect(
			chainsOf({
				holder: seq(str('let'), field('annotation', choice(sym('annotation'), sym('expr')))),
				annotation: seq(str(':'), field('type', sym('expr')))
			})
		).toEqual([]);
	});

	it('when the wrapper holds only a leaf', () => {
		expect(
			chainsOf({
				holder: seq(str('use'), field('label', sym('label'))),
				label: seq(str("'"), field('name', sym('name')))
			})
		).toEqual([]);
	});

	it('when the wrapper has a token choice instead of a fixed token', () => {
		expect(
			chainsOf({
				holder: seq(str('let'), field('annotation', sym('annotation'))),
				annotation: seq(choice(str(':'), str('::')), field('type', sym('expr')))
			})
		).toEqual([]);
	});
});
