import { describe, expect, it } from 'vitest';
import { combineBuiltRender, emptyBuiltRender, emptyBuiltRenderRun, finishBuiltRender } from '../built-render.ts';
import { KindCases } from '../kind-cases.ts';

describe('KindCases', () => {
	it('counts cases per kind, totals them, and lists them by kind in sorted order', () => {
		const cases = new KindCases();
		cases.add('match_block');
		cases.add('block');
		cases.add('match_block');
		cases.add('arguments', 3);
		expect(cases.total).toBe(6);
		expect(cases.has('block')).toBe(true);
		expect(cases.byKind()).toEqual({ arguments: 3, block: 1, match_block: 2 });
		expect(Object.keys(cases.byKind())).toEqual(['arguments', 'block', 'match_block']);
	});

	it('a removed last case leaves its kind out', () => {
		const cases = new KindCases();
		cases.add('block');
		cases.add('block');
		cases.remove('block');
		expect(cases.byKind()).toEqual({ block: 1 });
		cases.remove('block');
		expect(cases.has('block')).toBe(false);
		expect(cases.byKind()).toEqual({});
		expect(cases.total).toBe(0);
	});

	it('removing a case that was never counted throws', () => {
		expect(() => new KindCases().remove('block')).toThrow("KindCases.remove: no case of 'block' is counted");
	});
});

describe('built render cases by kind', () => {
	it('a run reports its total as the sum of its cases', () => {
		const run = emptyBuiltRenderRun();
		run.cases.add('block');
		run.cases.add('match_block');
		run.cases.add('match_block');
		run.cases.remove('block');
		expect(finishBuiltRender(run)).toMatchObject({ total: 2, casesByKind: { match_block: 2 } });
		expect(emptyBuiltRender()).toMatchObject({ total: 0, casesByKind: {} });
	});

	it("combining surfaces adds each kind's cases", () => {
		const surface = (kinds: readonly string[]) => {
			const run = emptyBuiltRenderRun();
			for (const kind of kinds) run.cases.add(kind);
			return finishBuiltRender(run);
		};
		const combined = combineBuiltRender({
			factory: surface(['block', 'match_block']),
			ir: surface(['match_block', 'match_block'])
		});
		expect(combined.total).toBe(4);
		expect(combined.casesByKind).toEqual({ block: 1, match_block: 3 });
	});
});
