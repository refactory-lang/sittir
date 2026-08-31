/**
 * Regression test for `validateFrom`'s module-load-failure sentinel
 * (TODO.md item 7): a rejected dynamic import of the generated
 * `from.ts`/`factories.ts` module must surface as a
 * `(from-module-load)`/`(factory-module-load)` sentinel error with
 * total/pass/fail/skip all 0 — not a silently-passing false "0/0" result,
 * which is what `corpus-validation.test.ts` alone can't catch since it only
 * exercises successful generated-module loads.
 */
import { describe, it, expect, vi } from 'vitest';
import { fileURLToPath } from 'node:url';
import { validateFrom } from '../src/validate/from.ts';

describe('validateFrom — module load failure sentinel', () => {
	it('surfaces a rejected from.ts import as a (from-module-load) sentinel error, not a false 0/0 pass', async () => {
		const fromTsUrl = new URL('../src/validate/from.ts', import.meta.url);
		const brokenFromModulePath = fileURLToPath(new URL('../../../rust/src/factories/coerce.ts', fromTsUrl));

		vi.doMock(brokenFromModulePath, () => {
			throw new Error('synthetic from-module load failure (test)');
		});
		vi.resetModules();

		const { validateFrom } = await import('../src/validate/from.ts');
		const result = await validateFrom('rust');

		expect(result.total).toBe(0);
		expect(result.pass).toBe(0);
		expect(result.fail).toBe(0);
		expect(result.skip).toBe(0);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({ kind: '(from-module-load)', severity: 'error' });
		// The exact message text is Vitest's own module-mocking error
		// wrapper, not the thrown error verbatim — assert only that a
		// non-empty diagnostic made it through, not its literal content.
		expect(result.errors[0]!.message.length).toBeGreaterThan(0);
	}, 60000);
});

describe('validateFrom — unresolved native coords diagnostic', () => {
	it('python: scalar-materialized text leaves compare via the string route — no unresolved rows remain', async () => {
		// The native read stores python's leaf kinds (identifier, literals,
		// keywords) scalarized, so there is no native node to locate; the
		// validator now routes text-shaped kinds through from(text) vs
		// factory(text) instead of refusing to compare. python's corpus has
		// no other from() failure mode, so the run passes fully.
		const result = await validateFrom('python', 'native');

		expect(result.fail).toBe(0);
		expect(result.pass).toBe(result.total);
		expect(result.errors.some((e) => e.message.includes('native coords unresolved for alias target'))).toBe(false);
	}, 60000);

	it('rust: the unresolved-coords refusal never fires for a text-shaped kind', async () => {
		// The string route covers every text-shaped kind, so any surviving
		// unresolved-coords row must belong to a NON-text kind (e.g.
		// branch-shaped block_comment) — for those the guard is correct and
		// must keep refusing the unsound comparison. Which rows survive
		// depends on corpus content, so pin the contract, not the roster.
		const result = await validateFrom('rust', 'native');
		const { loadNodeModel } = await import('../src/validate/common.ts');
		const model = await loadNodeModel('rust');

		const unresolved = result.errors.filter((e) => e.message.includes('native coords unresolved for alias target'));
		for (const e of unresolved) {
			expect(model.factoryShapes[e.kind]).not.toBe('text');
		}
	}, 60000);
});
