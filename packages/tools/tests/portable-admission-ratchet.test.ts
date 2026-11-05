import { describe, expect, it } from 'vitest';
import { computePortableAdmission, formatAdmission } from '../src/index.ts';

const CEILING = { overAdmitting: 3, untyped: 45 } as const;

describe('portable admission ratchet', () => {
	it(`${CEILING.overAdmitting} vocabulary sites admit a kind no read gives, and ${CEILING.untyped} read sites admit unknown`, async () => {
		const report = await computePortableAdmission();
		const shown = formatAdmission(report);
		for (const [name, ceiling] of Object.entries(CEILING)) {
			const count = report[name as keyof typeof CEILING].length;
			expect(
				count,
				count < ceiling
					? `${name} fell to ${count}: lower its ceiling\n${shown}`
					: `${name} rose above its ceiling\n${shown}`
			).toBe(ceiling);
		}
	}, 600_000);
});
