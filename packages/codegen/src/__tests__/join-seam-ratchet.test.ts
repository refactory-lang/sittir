import { describe, expect, it } from 'vitest';
import { readJoinSeams, unprovenArms } from '../compiler/model/join-seams/file.ts';
import { grammarPackage, sittirDirOf } from '../grammars.ts';

const CEILINGS: Record<
	string,
	{ readonly previous: number; readonly next: number; readonly pairs: number; readonly blocked: number }
> = {
	rust: { previous: 1, next: 2, pairs: 1, blocked: 11 },
	python: { previous: 4, next: 2, pairs: 4, blocked: 0 },
	typescript: { previous: 2, next: 5, pairs: 2, blocked: 3 },
	regex: { previous: 0, next: 0, pairs: 0, blocked: 0 },
	scm: { previous: 0, next: 0, pairs: 0, blocked: 0 }
};

describe('join seam ratchet', () => {
	for (const [grammar, ceiling] of Object.entries(CEILINGS)) {
		it(`${grammar}: arms kept only by an unbuildable check, and the seams and pairs no buildable check decides, stay at or below their ceilings`, () => {
			const file = readJoinSeams(sittirDirOf(grammarPackage(grammar)));
			if (file === undefined) throw new Error(`${grammar} has no committed join seams; regenerate ${grammar}`);
			const unproven = unprovenArms(file);
			const reasons = [...new Set(file.blocked.flatMap((check) => check.reasons))].join('; ');
			expect(unproven.previous.length, `${grammar} previous: ${unproven.previous.join(', ')}`).toBeLessThanOrEqual(
				ceiling.previous
			);
			expect(unproven.next.length, `${grammar} next: ${unproven.next.join(', ')}`).toBeLessThanOrEqual(ceiling.next);
			expect(unproven.pairs.length, `${grammar} pairs: ${unproven.pairs.join(' ')}`).toBeLessThanOrEqual(ceiling.pairs);
			expect(file.blocked.length, `${grammar} blocked seams and pairs: ${reasons}`).toBeLessThanOrEqual(ceiling.blocked);
		});
	}
});
