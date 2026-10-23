import { afterEach, describe, expect, it, vi } from 'vitest';
import { grammarModulePath } from '../src/grammar-internals.ts';

afterEach(() => {
	vi.doUnmock(grammarModulePath('regex', 'factories/raw.ts')!);
	vi.resetModules();
});

describe('validateFactoryStorage: a child factory that throws', () => {
	it('fails the candidates that build it, rather than skipping them', async () => {
		const rawPath = grammarModulePath('regex', 'factories/raw.ts');
		if (rawPath === undefined) throw new Error('regex has no raw factories module');
		vi.doMock(rawPath, async (importOriginal) => {
			const actual = await importOriginal<{ _factoryMap: Record<string, unknown> }>();
			const broken = () => {
				throw new Error('pattern_character: broken for the test');
			};
			return { ...actual, _factoryMap: { ...actual._factoryMap, pattern_character: broken } };
		});
		vi.resetModules();
		const { validateFactoryStorage } = await import('../src/validate/factory-storage.ts');
		const result = await validateFactoryStorage('regex');

		expect(result.skips.filter((skip) => skip.reason === 'no-factory-data')).toEqual([]);
		expect(result.fail).toBeGreaterThan(0);
		expect(result.errors.some((error) => error.message.includes('pattern_character: broken for the test'))).toBe(true);
		expect(result.render.errors.length).toBeGreaterThan(0);
	});
});
