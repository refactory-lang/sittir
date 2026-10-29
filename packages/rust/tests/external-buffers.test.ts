import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEngine } from '@sittir/common';

const REFUSED = "arena node storage needs external array buffers, which this runtime does not allow; use nodeStorage: 'object'";

describe('a runtime that does not allow external array buffers', () => {
	afterEach(() => {
		vi.doUnmock('../src/backend.js');
		vi.resetModules();
	});

	it('refuses arena storage at engine creation, by name, and object storage still parses and renders', async () => {
		vi.doMock('../src/backend.js', async (importOriginal) => {
			const real = await importOriginal<typeof import('../src/backend.js')>();
			const status = real.getActiveBackend();
			if (status.name !== 'native') return real;
			const sandboxed = {
				...status,
				native: {
					...status.native,
					externalBuffers: () => {
						throw new Error(REFUSED);
					}
				}
			};
			return { ...real, getActiveBackend: () => sandboxed };
		});
		const rust = (await import('../src/index.ts')).default;
		await expect(createEngine(rust)).rejects.toThrow(REFUSED);
		await expect(createEngine(rust, { nodeStorage: 'arena' })).rejects.toThrow(REFUSED);
		const rs = await createEngine(rust, { nodeStorage: 'object' });
		expect(rs.render(rs.parse('fn f() {}\n')).toString()).toBe('fn f() {}\n');
		rs.dispose();
	});
});
