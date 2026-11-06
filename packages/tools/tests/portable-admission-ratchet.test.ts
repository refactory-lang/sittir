import { describe, expect, it } from 'vitest';
import { computePortableAdmission, formatAdmission } from '../src/index.ts';

const UNTYPED = 52;

const MEMBERS: Readonly<Record<string, number>> = { python: 22, rust: 27, typescript: 1 };

const RAW: Readonly<Record<string, { readonly kind: number; readonly value: number }>> = {
	python: { kind: 145, value: 3056 },
	rust: { kind: 1689, value: 5886 },
	typescript: { kind: 138, value: 5315 }
};

const pinned = (name: string, count: number, ceiling: number, shown: string): void => {
	expect(count, count < ceiling ? `${name} fell to ${count}: lower its ceiling\n${shown}` : `${name} rose above its ceiling\n${shown}`).toBe(ceiling);
};

describe('portable admission ratchet', () => {
	it(`${UNTYPED} member defaults admit unknown; per grammar, map members admitting a kind outside their exact set and raw-node arms by group`, async () => {
		const report = await computePortableAdmission();
		const shown = formatAdmission(report);
		pinned('untyped', report.untyped.length, UNTYPED, shown);
		for (const [grammar, ceiling] of Object.entries(MEMBERS)) pinned(`${grammar} members`, report.members.filter((m) => m.grammar === grammar).length, ceiling, shown);
		for (const [grammar, ceiling] of Object.entries(RAW)) {
			const at = report.raw.find((r) => r.grammar === grammar);
			pinned(`${grammar} per-kind raw arms`, at?.kind ?? 0, ceiling.kind, shown);
			pinned(`${grammar} per-value raw arms`, at?.value ?? 0, ceiling.value, shown);
		}
	}, 1_200_000);
});
