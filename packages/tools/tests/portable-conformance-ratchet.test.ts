import { describe, expect, it } from 'vitest';
import { formatConformance, portableConformance } from '../src/portable/conformance.ts';

const CEILING = { rust: 14, python: 31, typescript: 45 } as const;

describe('portable conformance ratchet', () => {
	for (const [grammar, ceiling] of Object.entries(CEILING)) {
		it(`${grammar}: ${ceiling} conformance errors, none unclassified, none outside the module and none in its type tests, under tsrs and under TypeScript 6, whose checker rejects at the map's depth forms TypeScript 7's accepts`, async () => {
			const report = await portableConformance(grammar);
			if (report === undefined) throw new Error(`${grammar} emitted no typed module`);
			const shown = formatConformance(report);
			const count = (name: string): number | undefined => report.causes.find((cause) => cause.name === name)?.count;
			expect(count('unclassified'), shown).toBe(0);
			expect(count('outside'), shown).toBe(0);
			expect(report.typeTests.filter((test) => test.errors > 0), shown).toEqual([]);
			expect(report.total, report.total < ceiling ? `${grammar} fell to ${report.total}: lower its ceiling\n${shown}` : `${grammar} rose above its ceiling\n${shown}`).toBe(ceiling);
		}, 300_000);
	}
});
