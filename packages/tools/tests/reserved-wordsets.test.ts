import { describe, expect, it } from 'vitest';
import { compileNodeMap } from '../src/codegen-surface.ts';

const nodeMap = await compileNodeMap('typescript');
const slotOf = (kind: string, name: string) => nodeMap.nodes.get(kind)!.slots.find((slot) => slot.name === name)!;

describe('the wordsets a slot is stamped with', () => {
	it('stamps an envelope content slot with the union of the wordsets of the slots that place it', () => {
		expect(nodeMap.nodes.get('property_identifier')!.slots.map((slot) => slot.effectiveWordsets)).toEqual([['global', 'properties']]);
	});

	it('stamps a slot that no envelope places with its own set', () => {
		expect(slotOf('member_expression', 'property').effectiveWordsets).toEqual(['properties']);
		expect(slotOf('nested_identifier', 'property').effectiveWordsets).toEqual(['global']);
	});

	it('stamps the leaf with the words reserved under every set a holder stamps', () => {
		expect(nodeMap.wordLeafReserved).toEqual([]);
	});

	it('checks reserved text at a slot whose set differs from the leaf set, and only there', () => {
		expect(slotOf('nested_identifier', 'property').checksReserved).toBe(true);
		expect(slotOf('member_expression', 'property').checksReserved).toBe(true);
		expect(slotOf('program', 'statements').checksReserved).toBe(false);
	});
});
