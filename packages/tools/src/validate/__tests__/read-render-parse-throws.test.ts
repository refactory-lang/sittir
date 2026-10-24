import { describe, expect, it, vi } from 'vitest';

const INJECTED = 'injected detached-data failure';

vi.mock('@sittir/common/utils', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@sittir/common/utils')>();
	return {
		...actual,
		toDetachedNodeData: () => {
			throw new Error(INJECTED);
		}
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
	}, 120_000);
});
