import { describe, expect, it } from 'vitest';

describe('@sittir/core JS backend surface', () => {
	it('exports JS-engine creation helpers from the engine subpath', async () => {
		const mod = await import('../src/engine-boundary.ts');
		expect(typeof mod.createJsEngine).toBe('function');
		expect('createGrammarEngine' in mod).toBe(false);
	});

	it('does not re-export shared runtime primitives from the root entrypoint', async () => {
		const mod = await import('../src/index.ts');
		expect('readNode' in mod).toBe(false);
		expect('applyEdits' in mod).toBe(false);
		expect('assertRenderableNodeData' in mod).toBe(false);
		expect(typeof mod.createRenderer).toBe('function');
	});
});
