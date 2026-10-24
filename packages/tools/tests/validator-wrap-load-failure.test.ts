import { afterEach, describe, expect, it, vi } from 'vitest';
import { grammarModulePath } from '../src/grammar-internals.ts';

const mocked: string[] = [];

afterEach(() => {
	for (const path of mocked.splice(0)) vi.doUnmock(path);
	vi.resetModules();
});

async function withoutWrapNode(): Promise<void> {
	const path = grammarModulePath('regex', 'wrap.ts');
	if (path === undefined) throw new Error('regex has no wrap.ts');
	mocked.push(path);
	vi.doMock(path, async (importOriginal) => ({ ...(await importOriginal<Record<string, unknown>>()), wrapNode: undefined }));
	vi.resetModules();
}

describe('a validator whose wrap module cannot load reports the run failed', () => {
	it('read-render-parse', async () => {
		await withoutWrapNode();
		const { validateReadRenderParse } = await import('../src/validate/read-render-parse.ts');
		const result = await validateReadRenderParse('regex', { backend: 'native' });
		expect(result.fail).toBeGreaterThan(0);
		expect(result.errors.some((error) => error.message.includes("no export 'wrapNode'"))).toBe(true);
	}, 60000);

	it('factory storage', async () => {
		await withoutWrapNode();
		const { validateFactoryStorage } = await import('../src/validate/factory-storage.ts');
		const result = await validateFactoryStorage('regex');
		expect(result.fail).toBeGreaterThan(0);
		expect(result.errors.some((error) => error.message.includes("no export 'wrapNode'"))).toBe(true);
	}, 60000);

	it('from', async () => {
		await withoutWrapNode();
		const { validateFrom } = await import('../src/validate/from.ts');
		const result = await validateFrom('regex');
		expect(result.fail).toBeGreaterThan(0);
		expect(result.errors.some((error) => error.message.includes("no export 'wrapNode'"))).toBe(true);
	}, 60000);
});
