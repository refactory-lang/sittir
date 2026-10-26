import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEngine } from '@sittir/common';

const descriptor = async () => (await import('../src/index.ts')).default;

describe('engine', () => {
	afterEach(() => {
		vi.doUnmock('../src/backend.js');
		vi.restoreAllMocks();
		vi.resetModules();
	});

	it('createEngine throws when no native backend is available (no JS-engine fallback)', async () => {
		// Mock backend to report no native backend available
		vi.doMock('../src/backend.js', () => ({
			getActiveBackend: () => ({ name: 'js-fallback' })
		}));

		// createEngine is native-only: it throws instead of silently
		// falling back to a JS renderer-only engine.
		await expect(createEngine(await descriptor())).rejects.toThrow('native engine unavailable');
	});

	it('native engine exposes parse plus the diagnostics surface', async () => {
		// Mock a native backend with read support
		vi.doMock('../src/backend.js', () => ({
			getActiveBackend: () => ({
				name: 'native',
				hashMatch: true,
				native: {
					SittirEngine: class {
						render(_node: Record<string, unknown>): string {
							return 'ok';
						}
						dispose(): void {}
					}
				}
			})
		}));

		const engine = await createEngine(await descriptor());

		// The engine exposes parse, render, edit and dispose; the native engine exposes the read path
		expect(typeof engine.parse).toBe('function');
		expect(typeof engine.render).toBe('function');
		expect(typeof engine.dispose).toBe('function');
		const native = (await (await descriptor()).load()).createNative();
		expect(typeof native.parseAndRead).toBe('function');
	});

});
