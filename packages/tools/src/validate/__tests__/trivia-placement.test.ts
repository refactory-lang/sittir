import { describe, expect, it } from 'vitest';
import { computeTriviaPlacementCensus, runTriviaPlacement } from '../trivia-placement.ts';
import { ORPHANS, PROBES } from './helpers/trivia-sources.ts';

const GRAMMARS = ['rust', 'typescript', 'python'] as const;

describe('trivia placement census reads placement from the reader', () => {
	for (const grammar of GRAMMARS) {
		it(`${grammar}: every corpus extra lands in a trivia entry`, async () => {
			const { summary, rows } = await computeTriviaPlacementCensus(grammar);
			expect(rows.filter((row) => row.position === 'lost')).toEqual([]);
			expect(summary.lost).toBe(0);
		});

		const sources = [...(PROBES[grammar] ?? []).map((probe) => probe.source), ...(ORPHANS[grammar] ?? []).map(([source]) => source)];
		it(`${grammar}: every probe extra lands in a trivia entry`, async () => {
			for (const source of sources) {
				const lost = (await runTriviaPlacement({ grammar, source })).filter((row) => row.position === 'lost');
				expect(lost, source).toEqual([]);
			}
		});
	}
});
