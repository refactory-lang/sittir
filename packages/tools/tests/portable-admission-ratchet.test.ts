import { describe, expect, it } from 'vitest';
import { computePortableAdmission, formatAdmission } from '../src/index.ts';

const UNTYPED = 51;

const MEMBERS: Readonly<Record<string, number>> = { python: 0, rust: 0, typescript: 0 };

const UNFORMED: Readonly<Record<string, number>> = { python: 0, rust: 0, typescript: 0 };

const RAW: Readonly<Record<string, { readonly kind: number; readonly value: number }>> = {
	python: { kind: 144, value: 2889 },
	rust: { kind: 1545, value: 5895 },
	typescript: { kind: 31, value: 5231 }
};

const pinned = (name: string, count: number, ceiling: number, shown: string): void => {
	expect(count, count < ceiling ? `${name} fell to ${count}: lower its ceiling\n${shown}` : `${name} rose above its ceiling\n${shown}`).toBe(ceiling);
};

describe('portable admission ratchet', () => {
	it(`${UNTYPED} member defaults admit unknown; per grammar, map members admitting a kind outside their exact set, raw-node arms by group and build kind tests at a member with no exact set`, async () => {
		const report = await computePortableAdmission();
		const shown = formatAdmission(report);
		pinned('untyped', report.untyped.length, UNTYPED, shown);
		for (const [grammar, ceiling] of Object.entries(MEMBERS)) pinned(`${grammar} members`, report.members.filter((m) => m.grammar === grammar).length, ceiling, shown);
		for (const [grammar, ceiling] of Object.entries(UNFORMED)) pinned(`${grammar} unformed kind tests`, report.unformed.filter((u) => u.grammar === grammar).length, ceiling, shown);
		for (const [grammar, ceiling] of Object.entries(RAW)) {
			const at = report.raw.find((r) => r.grammar === grammar);
			pinned(`${grammar} per-kind raw arms`, at?.kind ?? 0, ceiling.kind, shown);
			pinned(`${grammar} per-value raw arms`, at?.value ?? 0, ceiling.value, shown);
		}
	}, 1_200_000);
});
