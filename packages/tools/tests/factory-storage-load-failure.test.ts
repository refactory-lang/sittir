import { afterEach, describe, expect, it, vi } from 'vitest';
import { grammarModulePath } from '../src/grammar-internals.ts';

const mocked: string[] = [];

afterEach(() => {
	for (const path of mocked.splice(0)) vi.doUnmock(path);
	vi.resetModules();
});

describe('factory storage that cannot load what it validates reports the run failed', () => {
	it('factory storage: a factory module that fails to load', async () => {
		const path = grammarModulePath('regex', 'factories/raw.ts');
		if (path === undefined) throw new Error('regex has no factories/raw.ts');
		mocked.push(path);
		vi.doMock(path, async (importOriginal) => {
			const actual = await importOriginal<Record<string, unknown>>();
			return Object.defineProperty({ ...actual }, '_factoryMap', {
				get() {
					throw new Error('factories/raw.ts: broken for the test');
				}
			});
		});
		vi.resetModules();
		const { validateFactoryStorage, formatFactoryStorageReport } = await import('../src/validate/factory-storage.ts');
		const result = await validateFactoryStorage('regex');
		expect(result.errors.some((error) => error.message.includes('factories/raw.ts: broken for the test'))).toBe(true);
		expect(result.fail).toBeGreaterThan(0);
		expect(formatFactoryStorageReport(result)).toMatch(/^ {2}x /);
	});
});
