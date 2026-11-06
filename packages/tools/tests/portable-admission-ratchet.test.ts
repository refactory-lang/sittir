import { describe, expect, it } from 'vitest';
import { computePortableAdmission, formatAdmission } from '../src/index.ts';

const CEILING = { overAdmitting: 353, untyped: 45, ownSlots: 44 } as const;

const MEMBERS: Readonly<Record<string, number>> = { python: 225, rust: 439, typescript: 388 };

const RAW: Readonly<Record<string, { readonly kind: number; readonly value: number }>> = {
	python: { kind: 145, value: 3056 },
	rust: { kind: 1689, value: 5886 },
	typescript: { kind: 138, value: 5315 }
};

const pinned = (name: string, count: number, ceiling: number, shown: string): void => {
	expect(count, count < ceiling ? `${name} fell to ${count}: lower its ceiling\n${shown}` : `${name} rose above its ceiling\n${shown}`).toBe(ceiling);
};

describe('portable admission ratchet', () => {
	it(`${CEILING.overAdmitting} read sites admit a kind no read gives (role-armed sites included), ${CEILING.untyped} admit unknown, ${CEILING.ownSlots} own slots hold a kind their reads never give; per grammar, members admitting a kind outside their exact set and raw-node arms by group`, async () => {
		const report = await computePortableAdmission();
		const shown = formatAdmission(report);
		for (const [name, ceiling] of Object.entries(CEILING)) pinned(name, report[name as keyof typeof CEILING].length, ceiling, shown);
		expect(report.members.filter((m) => m.grammar === 'python').length).toBeGreaterThan(0);
		for (const [grammar, ceiling] of Object.entries(MEMBERS)) pinned(`${grammar} members`, report.members.filter((m) => m.grammar === grammar).length, ceiling, shown);
		for (const [grammar, ceiling] of Object.entries(RAW)) {
			const at = report.raw.find((r) => r.grammar === grammar);
			pinned(`${grammar} per-kind raw arms`, at?.kind ?? 0, ceiling.kind, shown);
			pinned(`${grammar} per-value raw arms`, at?.value ?? 0, ceiling.value, shown);
		}
	}, 1_200_000);
});
