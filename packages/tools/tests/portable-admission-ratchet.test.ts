import { describe, expect, it } from 'vitest';
import { computePortableAdmission, formatAdmission } from '../src/index.ts';

const UNTYPED = 30;

const SLOTS: Readonly<Record<string, number>> = { python: 0, rust: 0, typescript: 0 };

const UNFORMED: Readonly<Record<string, number>> = { python: 0, rust: 0, typescript: 0 };

const RAW: Readonly<Record<string, { readonly kind: number; readonly value: number }>> = {
	python: { kind: 4, value: 51 },
	rust: { kind: 8, value: 98 },
	typescript: { kind: 7, value: 61 }
};

const pinned = (name: string, count: number, ceiling: number, shown: string): void => {
	expect(count, count < ceiling ? `${name} fell to ${count}: lower its ceiling\n${shown}` : `${name} rose above its ceiling\n${shown}`).toBe(ceiling);
};

describe('portable admission ratchet', () => {
	it(`${UNTYPED} slot defaults admit unknown; per grammar, map slots admitting a kind outside their exact set, claimed kinds a raw-node arm admits by group and build kind tests at a slot with no exact set`, async () => {
		const report = await computePortableAdmission();
		const shown = formatAdmission(report);
		pinned('untyped', report.untyped.length, UNTYPED, shown);
		for (const [grammar, ceiling] of Object.entries(SLOTS)) pinned(`${grammar} slots`, report.slots.filter((m) => m.grammar === grammar).length, ceiling, shown);
		for (const [grammar, ceiling] of Object.entries(UNFORMED)) pinned(`${grammar} unformed kind tests`, report.unformed.filter((u) => u.grammar === grammar).length, ceiling, shown);
		for (const [grammar, ceiling] of Object.entries(RAW)) {
			const at = report.raw.find((r) => r.grammar === grammar);
			pinned(`${grammar} claimed kinds with a per-kind raw arm`, at?.kind ?? 0, ceiling.kind, shown);
			pinned(`${grammar} claimed kinds with a per-value raw arm`, at?.value ?? 0, ceiling.value, shown);
		}
	}, 1_200_000);
});
