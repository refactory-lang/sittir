import { describe, expect, it } from 'vitest';
import type { BaselineRun } from '@sittir/common/engine';
import { loadCorpusEntries } from '../src/validate/common.ts';
import { layoutRunsOf, runLayoutRuns } from '../src/validate/layout-runs.ts';

const grammars = ['rust', 'typescript', 'python', 'regex', 'scm'] as const;

/** The baseline's breaks at the run from the end of the first `before` to the start of the next `after` past it. */
function breaksBetween(runs: readonly BaselineRun[], source: string, before: string, after: string): number | undefined {
	const start = source.indexOf(before) + before.length;
	const end = source.indexOf(after, start);
	const run = runs.find((run) => run.start === start && run.end === end);
	if (run === undefined) throw new Error(`no run from ${start} to ${end}`);
	return run.breaks;
}

describe("a parsed tree's baseline is what its read-time options render at each gap", async () => {
	const runsOf = await layoutRunsOf('rust');

	it('breaks inside a rust block whose source breaks there', () => {
		const source = 'fn f() {\n    x;\n}\n';
		const runs = runsOf(source);
		expect(breaksBetween(runs, source, '{', 'x')).toBe(1);
		expect(breaksBetween(runs, source, ';', '}')).toBe(1);
	});

	it('breaks inside a rust block whose source keeps it on one line: the options break, not the source', () => {
		const source = 'fn f() { x; }\n';
		const runs = runsOf(source);
		expect(breaksBetween(runs, source, '{', 'x')).toBe(1);
		expect(breaksBetween(runs, source, ';', '}')).toBe(1);
	});

	it("keeps a trailing comment on its item's line, then ends the line and opens the blank line before the next item", () => {
		const source = 'fn f() {} // c\nfn g() {}\n';
		const runs = runsOf(source);
		expect(breaksBetween(runs, source, '{}', '// c')).toBe(0);
		expect(breaksBetween(runs, source, '// c', 'fn g')).toBe(2);
	});

	it("reads an empty node's inner run between its own texts", () => {
		const source = 'fn f() {\n}\n';
		const runs = runsOf(source);
		expect(breaksBetween(runs, source, '{', '}')).toBe(0);
	});
});

describe('every run a side takes has a baseline, and every region renders', () => {
	for (const grammar of grammars) {
		it(`in every ${grammar} corpus entry, read from its region`, async () => {
			const { unreached, refused } = await runLayoutRuns(grammar);
			expect(refused).toEqual([]);
			expect(unreached).toEqual([]);
		});
	}
});

describe("a region's record gives the breaks the whole tree's record gives", () => {
	for (const grammar of grammars) {
		it(`in every ${grammar} corpus entry`, async () => {
			const runsOf = await layoutRunsOf(grammar);
			const differ = loadCorpusEntries(grammar).flatMap(({ name, source }) => {
				const whole = runsOf(source, true);
				return runsOf(source)
					.map((run, at) => ({ run, whole: whole[at]?.breaks }))
					.filter(({ run, whole }) => run.breaks !== whole)
					.map(({ run, whole }) => `${name}: ${run.side} of ${run.index} at ${run.start}..${run.end} region ${run.breaks} whole ${whole} ${JSON.stringify(source.slice(Math.max(0, run.start - 12), run.end + 12))}`);
			});
			expect(differ).toEqual([]);
		});
	}
});
