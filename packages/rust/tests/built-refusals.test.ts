import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe('a build refused after its record is written, in arena storage', () => {
	it('releases that record, so refused builds hold no built memory', async () => {
		const rs = await createEngine(rust, { nodeStorage: 'arena' });
		const live = (): number => rs.diagnostics.builtMemory!()!.live;
		const before = live();
		for (let round = 0; round < 3; round++) expect(() => rs.build.blockComment(' a */ b ')).toThrow(/cannot sit between/);
		expect(live()).toBe(before);
		const kept = rs.build.blockComment(' a b ');
		expect(rs.render(kept).toString()).toBe('/* a b */');
		expect(live()).toBeGreaterThan(before);
	});
});
