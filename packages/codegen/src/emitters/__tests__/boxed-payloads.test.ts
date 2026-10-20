import { describe, expect, it } from 'vitest';
import { boxedPayloadsOf } from '../boxed-payloads.ts';

const struct = (name: string, fields: readonly string[]): string => `pub struct ${name} {\n${fields.map((type, i) => `    pub f${i}: ${type},\n`).join('')}}\n`;
const choice = (name: string, variants: readonly string[]): string => `pub enum ${name} {\n${variants.map((variant) => `    ${variant},\n`).join('')}}\n`;
const strings = (n: number): string[] => Array.from({ length: n }, () => 'String');

describe('the payload byte rule', () => {
	it('boxes a payload over the ceiling and holds one at it unboxed', () => {
		const nodeRs = [struct('Over', strings(11)), struct('At', [...strings(10), 'Option<KindId>', 'bool']), choice('Choice', ['Over(Over)', 'At(At)'])].join('\n');
		expect(boxedPayloadsOf(nodeRs, new Set(['Over', 'At']))).toEqual(['Over']);
	});

	it('sizes a payload with the choices it holds already settled', () => {
		const nodeRs = [
			struct('Big', strings(11)),
			choice('Inner', ['Big(Big)', 'Blank']),
			struct('Outer', ['Inner', ...strings(9)]),
			choice('Choice', ['Outer(Outer)', 'Big(Big)'])
		].join('\n');
		expect(boxedPayloadsOf(nodeRs, new Set(['Big', 'Outer']))).toEqual(['Big']);
	});

	it('lays a slot value out around its coordinate', () => {
		const nodeRs = [struct('Held', strings(10)), struct('Holder', ['::sittir_core::SlotValue<Held>', 'Option<Box<NodeLayout>>']), choice('Choice', ['Holder(Holder)'])].join('\n');
		expect(boxedPayloadsOf(nodeRs, new Set(['Holder']))).toEqual([]);
		const wider = [struct('Held', strings(10)), struct('Holder', ['::sittir_core::SlotValue<Held>', ...strings(1), 'bool']), choice('Choice', ['Holder(Holder)'])].join('\n');
		expect(boxedPayloadsOf(wider, new Set(['Holder']))).toEqual(['Holder']);
	});

	it('refuses a type it has no layout for', () => {
		expect(() => boxedPayloadsOf(struct('Holder', ['Mystery']), new Set(['Holder']))).toThrow('Mystery is no type the payload byte rule knows');
	});
});
