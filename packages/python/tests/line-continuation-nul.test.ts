import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';

const py = await sharedEngine(() => createEngine(python));
const pyStrict = await sharedEngine(() => createEngine(python, { api: 'strict' }));

const SOURCE = 'f() \\\0';

type Walked = { readonly $type: number; $trivia: { trailing(): readonly unknown[]; leading(): readonly unknown[] } };

const triviaOf = (node: unknown): readonly number[] => {
	const found: number[] = [];
	const walk = (at: unknown): void => {
		if (at === null || typeof at !== 'object') return;
		const walked = at as Walked;
		for (const entry of [...walked.$trivia.trailing(), ...walked.$trivia.leading()]) found.push(typeof entry === 'number' ? entry : (entry as { $type: number }).$type);
		for (const child of (py.query as unknown as (n: unknown) => { $children: Iterable<unknown> })(at).$children) walk(child);
	};
	walk(node);
	return found;
};

describe('a line continuation that ends the source has no builder', () => {
	it('is not on the loose, the strict or the ir builders; the newline form is', () => {
		for (const engine of [py, pyStrict]) {
			const routes = engine.build.lineContinuation as unknown as Record<string, unknown>;
			expect(typeof routes.newline).toBe('function');
			expect(routes.nul).toBeUndefined();
			expect(Object.keys(engine.build)).not.toContain('lineContinuationNul');
		}
	});

	it('still reads from a parse, is guarded by is, and renders its source bytes', () => {
		const tree = py.parse(SOURCE);
		expect(tree.$errors).toHaveLength(0);
		expect(triviaOf(tree)).toContain(py.kinds.LineContinuationNul);
		expect(py.is.lineContinuationNul(py.kinds.LineContinuationNul)).toBe(true);
		expect(py.is.lineContinuation.nul(py.kinds.LineContinuationNul)).toBe(true);
		expect(py.is.lineContinuation(py.kinds.LineContinuationNul)).toBe(true);
		expect(py.render(tree).toString()).toBe(SOURCE);
	});

	it('renders its source bytes under a parent rebuilt around it', () => {
		const module = py.parse(SOURCE) as unknown as { $with: { statements(...items: unknown[]): unknown }; statements(): readonly unknown[] };
		const rebuilt = module.$with.statements(...module.statements());
		expect(py.render(rebuilt as never).toString()).toBe(SOURCE);
	});
});
