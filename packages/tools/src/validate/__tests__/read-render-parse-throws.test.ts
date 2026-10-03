import { describe, expect, it, vi } from 'vitest';

const INJECTED = 'injected trivia view failure';

vi.mock('../common.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../common.ts')>();
	return {
		...actual,
		triviaViewOf: (engine: Parameters<typeof actual.triviaViewOf>[0]) => ({
			...actual.triviaViewOf(engine),
			trivia: () => {
				throw new Error(INJECTED);
			}
		})
	};
});

const { validateReadRenderParse } = await import('../read-render-parse.ts');

describe('read-render-parse: a candidate whose input preparation throws', () => {
	it('is reported as a failure with its error, even where another candidate of its kind round-trips', async () => {
		const fixtures: unknown[] = [];
		const result = await validateReadRenderParse('scm', {
			backend: 'native',
			recursive: true,
			onFixture: (fixture) => fixtures.push(fixture)
		});
		const injected = result.errors.filter((error) => error.message.includes(INJECTED));
		expect(injected.length).toBeGreaterThan(0);
		expect(result.pass).toBe(0);
		expect(fixtures).toEqual([]);
	});
});
