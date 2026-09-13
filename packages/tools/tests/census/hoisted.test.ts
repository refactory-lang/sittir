import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { type CensusModel, formatHoistedCensus, hoistedCensus } from '../../src/census/hoisted.ts';
import { readNodeModelFile } from '../../src/validate/common.ts';

describe('hoistedCensus', () => {
	it('splits hoisted kinds into seated and unseated', () => {
		const model = {
			nodes: [
				{
					kind: 'parent',
					annotations: {},
					slots: [{ name: 'seat', values: [{ seat: { kind: '_parent_arm', shape: 'arm', mount: 'arm' } }] }]
				},
				{ kind: '_parent_arm', annotations: { hoisted: true }, slots: [] },
				{ kind: '_orphan', annotations: { hoisted: true }, slots: [] },
				{ kind: '_items', modelType: 'list', annotations: { hoisted: true } }
			]
		};
		expect(hoistedCensus(model)).toEqual({
			hoisted: ['_orphan', '_parent_arm'],
			seated: ['_parent_arm'],
			unseated: ['_orphan']
		});
	});

	it('accepts a keyed node map', () => {
		const model = { nodes: { a: { kind: 'a', annotations: { hoisted: true } }, b: { kind: 'b' } } };
		expect(hoistedCensus(model).hoisted).toEqual(['a']);
	});

	it('formats one head line and the unseated kinds', () => {
		expect(formatHoistedCensus('g', { hoisted: ['x', 'y'], seated: ['x'], unseated: ['y'] })).toBe(
			'g: hoisted=2 seated=1 unseated=1\n  y\n'
		);
	});
});

describe('hoisted census ratchet', () => {
	const baseline = readFileSync(new URL('../../hoisted-census-baseline.txt', import.meta.url), 'utf8')
		.trim()
		.split('\n')
		.filter((l) => !l.startsWith(' '));
	for (const line of baseline) {
		const m = /^(\w+): hoisted=(\d+) seated=(\d+) unseated=(\d+)$/.exec(line);
		if (m === null) throw new Error(`hoisted-census-baseline.txt: unreadable line ${JSON.stringify(line)}`);
		const [, grammar, , seated, unseated] = m;
		it(`${grammar}: no more unseated hoisted kinds than the baseline records`, () => {
			const raw = readNodeModelFile(grammar!);
			if (raw === undefined) throw new Error(`no node-model.json5 for ${grammar}`);
			const census = hoistedCensus(JSON.parse(raw) as CensusModel);
			expect(census.unseated.length).toBeLessThanOrEqual(Number(unseated));
		});
		it(`${grammar}: no fewer seated hoisted kinds than the baseline records`, () => {
			const raw = readNodeModelFile(grammar!);
			if (raw === undefined) throw new Error(`no node-model.json5 for ${grammar}`);
			const census = hoistedCensus(JSON.parse(raw) as CensusModel);
			expect(census.seated.length).toBeGreaterThanOrEqual(Number(seated));
		});
	}
});
