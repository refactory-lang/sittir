import { describe, expect, it } from 'vitest';
import { formatConformance, portableConformance } from '../src/portable/conformance.ts';

const CEILING = { rust: 205, python: 190, typescript: 350 } as const;

describe('portable conformance ratchet', () => {
	for (const [grammar, ceiling] of Object.entries(CEILING)) {
		it(`${grammar}: ${ceiling} conformance errors, none unclassified and none outside the module`, async () => {
			const report = await portableConformance(grammar);
			if (report === undefined) throw new Error(`${grammar} emitted no typed module`);
			const shown = formatConformance(report);
			const count = (name: string): number | undefined => report.causes.find((cause) => cause.name === name)?.count;
			expect(count('unclassified'), shown).toBe(0);
			expect(count('outside'), shown).toBe(0);
			expect(report.total, report.total < ceiling ? `${grammar} fell to ${report.total}: lower its ceiling\n${shown}` : `${grammar} rose above its ceiling\n${shown}`).toBe(ceiling);
		}, 300_000);
	}
});
