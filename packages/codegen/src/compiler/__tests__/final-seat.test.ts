import { beforeAll, describe, expect, it } from 'vitest';
import { assemblePredicted } from '../../__tests__/helpers/linked.ts';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { compoundStructureRow } from '../../emitters/factories.ts';
import { collectKindEntries, type KindEnumEntry } from '../../emitters/kind-discriminant.ts';
import { finalSeatOf, slotListTypeOf } from '../../emitters/shared.ts';
import { isNodeRef, storageKindOfRef, type AssembledNonterminal } from '../model/node-map.ts';
import type { NodeMap } from '../types.ts';

const upstream = {
	extras: '/\\s/',
	rules: [
		"source: ($) => repeat(choice($.block, $.plain, $.three))",
		"block: ($) => seq('{', field('arms', repeat($.arm)), field('arms', $.last), '}')",
		"plain: ($) => seq('[', field('items', repeat($.word)), field('items', $.word), ']')",
		"three: ($) => seq('(', field('xs', repeat($.arm)), field('xs', $.last), field('xs', $.word), ')')",
		"arm: ($) => seq($.word, '=>', $.word, ',')",
		"last: ($) => seq($.word, '=>', $.word, optional(';'))",
		'word: ($) => /[a-z]+/'
	].join(', ')
};

const kindsOf = (slot: AssembledNonterminal): string => slot.values.flatMap((v) => (isNodeRef(v) ? [storageKindOfRef(v.node) ?? '?'] : [])).join(' | ');

describe('a list slot whose last position takes a kind of its own', () => {
	let nodeMap: NodeMap;
	let kindEntries: readonly KindEnumEntry[];
	const slotOf = (kind: string, name: string): AssembledNonterminal => nodeMap.nodes.get(kind)!.slots.find((slot) => slot.name === name)!;

	beforeAll(async () => {
		const assembled = assemblePredicted(await evaluateTempGrammar(upstream, ''));
		nodeMap = assembled.nodeMap;
		kindEntries = collectKindEntries(nodeMap, assembled.generatedIdTables);
	});

	it('stamps the last position its final seat, after the repeated one', () => {
		const arms = slotOf('block', 'arms');
		expect(arms.values.map((v) => [isNodeRef(v) ? storageKindOfRef(v.node) : undefined, v.multiplicity, v.final === true])).toEqual([
			['arm', 'array', false],
			['last', 'single', true]
		]);
		const seat = finalSeatOf(arms)!;
		expect([kindsOf(seat.rest), kindsOf(seat.last)]).toEqual(['arm', 'last']);
	});

	it('stamps no final seat where the last position adds no kind, or a later position follows it', () => {
		expect(finalSeatOf(slotOf('plain', 'items'))).toBeUndefined();
		expect(finalSeatOf(slotOf('three', 'xs'))).toBeUndefined();
	});

	it('types the slot as its repeated elements, then its last', () => {
		expect(slotListTypeOf(slotOf('block', 'arms'), kindsOf, 'readonly')).toBe('readonly [...arm[], last]');
		expect(slotListTypeOf(slotOf('block', 'arms'), kindsOf, 'mutable')).toBe('[...arm[], last]');
	});

	it('rows the slot for the structure check: every element but the last of the repeated kinds, the last of its own', () => {
		const id = (kind: string): number => nodeMap.nodes.get(kind)!.kindId!;
		expect(compoundStructureRow(nodeMap.nodes.get('block') as never, nodeMap, kindEntries)?.final).toEqual([[slotOf('block', 'arms').storageKey, 'block.children', [id('arm')], [id('last')]]]);
		expect(compoundStructureRow(nodeMap.nodes.get('plain') as never, nodeMap, kindEntries)?.final).toBeUndefined();
	});
});
