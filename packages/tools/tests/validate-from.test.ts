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

describe('validateFrom — module load failure sentinel', () => {
	it(
		'surfaces a rejected from.ts import as a (from-module-load) sentinel error, not a false 0/0 pass',
		async () => {
			const fromTsUrl = new URL('../src/validate/from.ts', import.meta.url);
			const brokenFromModulePath = fileURLToPath(new URL('../../../rust/src/from.ts', fromTsUrl));

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
		},
		60000
	);
});
