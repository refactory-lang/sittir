import { describe, expect, it } from 'vitest';
import type { BaselineRun, NativeEngineLike } from '@sittir/common/engine';
import { loadCorpusEntries } from '../src/validate/common.ts';
import { getActiveBackend as python } from '../../python/src/backend.ts';
import { getActiveBackend as regex } from '../../regex/src/backend.ts';
import { getActiveBackend as rust } from '../../rust/src/backend.ts';
import { getActiveBackend as scm } from '../../scm/src/backend.ts';
import { getActiveBackend as typescript } from '../../typescript/src/backend.ts';

type Backend = () => { readonly name: string; readonly native?: { readonly SittirEngine: new () => NativeEngineLike } };

function engineOf(backend: Backend): NativeEngineLike {
	const status = backend();
	if (status.name !== 'native' || status.native === undefined) throw new Error('the native backend is not active');
	return new status.native.SittirEngine();
}

const backends: Record<string, Backend> = { rust, typescript, python, regex, scm };

function runsOf(engine: NativeEngineLike, source: string, whole = false): BaselineRun[] {
	const { treeId } = JSON.parse(engine.parse(source)) as { treeId: number };
	return engine.layoutBaseline(treeId, whole);
}

/** The baseline's breaks at the run from the end of the first `before` to the start of the next `after` past it. */
function breaksBetween(runs: readonly BaselineRun[], source: string, before: string, after: string): number | undefined {
	const start = source.indexOf(before) + before.length;
	const end = source.indexOf(after, start);
	const run = runs.find((run) => run.start === start && run.end === end);
	if (run === undefined) throw new Error(`no run from ${start} to ${end}`);
	return run.breaks;
}

describe("a parsed tree's baseline is what its read-time options render at each gap", () => {
	const rs = engineOf(rust);

	it('breaks inside a rust block whose source breaks there', () => {
		const source = 'fn f() {\n    x;\n}\n';
		const runs = runsOf(rs, source);
		expect(breaksBetween(runs, source, '{', 'x')).toBe(1);
		expect(breaksBetween(runs, source, ';', '}')).toBe(1);
	});

	it('breaks inside a rust block whose source keeps it on one line: the options break, not the source', () => {
		const source = 'fn f() { x; }\n';
		const runs = runsOf(rs, source);
		expect(breaksBetween(runs, source, '{', 'x')).toBe(1);
		expect(breaksBetween(runs, source, ';', '}')).toBe(1);
	});

	it("keeps a trailing comment on its item's line, then ends the line and opens the blank line before the next item", () => {
		const source = 'fn f() {} // c\nfn g() {}\n';
		const runs = runsOf(rs, source);
		expect(breaksBetween(runs, source, '{}', '// c')).toBe(0);
		expect(breaksBetween(runs, source, '// c', 'fn g')).toBe(2);
	});

	it("reads an empty node's inner run between its own texts", () => {
		const source = 'fn f() {\n}\n';
		const runs = runsOf(rs, source);
		expect(breaksBetween(runs, source, '{', '}')).toBe(0);
	});
});

describe('every run a side takes has a baseline', () => {
	for (const [grammar, backend] of Object.entries(backends)) {
		it(`in every ${grammar} corpus entry, read from its region`, () => {
			const engine = engineOf(backend);
			const unkeyed = loadCorpusEntries(grammar).flatMap(({ name, source }) =>
				runsOf(engine, source)
					.filter((run) => run.breaks === undefined)
					.map((run) => `${name}: ${run.side} of ${run.index} at ${run.start}..${run.end} ${JSON.stringify(source.slice(Math.max(0, run.start - 12), run.end + 12))}`)
			);
			expect(unkeyed).toEqual([]);
		});
	}
});

describe("a region's record gives the breaks the whole tree's record gives", () => {
	for (const [grammar, backend] of Object.entries(backends)) {
		it(`in every ${grammar} corpus entry`, () => {
			const engine = engineOf(backend);
			const differ = loadCorpusEntries(grammar).flatMap(({ name, source }) => {
				const whole = runsOf(engine, source, true);
				return runsOf(engine, source)
					.map((run, at) => ({ run, whole: whole[at]?.breaks }))
					.filter(({ run, whole }) => run.breaks !== whole)
					.map(({ run, whole }) => `${name}: ${run.side} of ${run.index} at ${run.start}..${run.end} region ${run.breaks} whole ${whole} ${JSON.stringify(source.slice(Math.max(0, run.start - 12), run.end + 12))}`);
			});
			expect(differ).toEqual([]);
		});
	}
});
