import { describe, expect, it } from 'vitest';

describe('@sittir/common public API', () => {
	it('exports backend-neutral runtime primitives', async () => {
		const mod = await import('../src/index.ts');

		expect(typeof mod.readNode).toBe('function');
		expect(typeof mod.applyEdits).toBe('function');
		expect(typeof mod.applyFormat).toBe('function');
		expect(typeof mod.assertRenderableNodeData).toBe('function');
	});

	it('exports engine-boundary types/helpers from the engine subpath', async () => {
		const mod = await import('../src/engine-boundary.ts');
		expect(mod).toBeDefined();
	});
});
