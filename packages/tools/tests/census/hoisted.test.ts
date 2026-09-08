import { describe, it, expect } from 'vitest';
import { formatHoistedCensus, hoistedCensus } from '../../src/census/hoisted.ts';

describe('hoistedCensus', () => {
	it('splits hoisted kinds into seated and unseated', () => {
		const model = {
			nodes: [
				{
					kind: 'parent',
					hoisted: false,
					slots: [{ name: 'seat', values: [{ seat: { kind: '_parent_arm', shape: 'arm', mount: 'arm' } }] }]
				},
				{ kind: '_parent_arm', hoisted: true, slots: [] },
				{ kind: '_orphan', hoisted: true, slots: [] }
			]
		};
		expect(hoistedCensus(model)).toEqual({
			hoisted: ['_orphan', '_parent_arm'],
			seated: ['_parent_arm'],
			unseated: ['_orphan']
		});
	});

	it('accepts a keyed node map', () => {
		const model = { nodes: { a: { kind: 'a', hoisted: true }, b: { kind: 'b' } } };
		expect(hoistedCensus(model).hoisted).toEqual(['a']);
	});

	it('formats one head line and the unseated kinds', () => {
		expect(formatHoistedCensus('g', { hoisted: ['x', 'y'], seated: ['x'], unseated: ['y'] })).toBe(
			'g: hoisted=2 seated=1 unseated=1\n  y\n'
		);
	});
});
