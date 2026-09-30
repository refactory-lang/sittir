import { describe, expect, it } from 'vitest';
import { loadKindNameFromId, loadNativeEngine, readNativeTree } from '../../src/validate/common.ts';
import { nativeShownKindId } from '../../src/validate/shown-kind.ts';

function lazyOf(value: unknown): { readonly $type: number } | undefined {
	if (value === null || typeof value !== 'object') return undefined;
	if (Array.isArray(value)) return value.map(lazyOf).find((found) => found !== undefined);
	const node = value as Record<string, unknown>;
	if (node._lazy !== undefined) return node._lazy as { readonly $type: number };
	return Object.values(node).map(lazyOf).find((found) => found !== undefined);
}

describe('nativeShownKindId', () => {
	it('names a leaf alias by the kind the parser shows, not the token it reads as', async () => {
		const engine = await loadNativeEngine('regex');
		const kindName = (await loadKindNameFromId('regex'))!;
		const lazy = lazyOf(readNativeTree(engine, 'a*?', { deep: true }).root)!;
		expect(kindName(lazy.$type)).toBe('?');
		expect(kindName(nativeShownKindId(lazy))).toBe('lazy');
	});

	it('is the node type when the parser shows the node as itself', () => {
		expect(nativeShownKindId({ $type: 7 })).toBe(7);
	});
});
