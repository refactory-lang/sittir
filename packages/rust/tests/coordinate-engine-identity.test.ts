// A coordinate names a tree by a tag minted from one counter per JavaScript
// thread, so no two engines ever mint the same tag, and the language's table
// holds every tree. A node read by one engine renders through any engine of
// the language from its own tree — never from whatever tree the calling
// engine parsed last.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe('coordinates name their tree', () => {
	it('renders a node read by another engine from the tree it was read from', async () => {
		const reader = await createEngine(rust);
		const other = await createEngine(rust);
		other.parse('fn decoy() {}');
		const item = reader.parse('fn real() {}').statements()[0];
		expect(other.render(item as never).toString()).toBe('fn real() {}');
	});

	it('renders the same node through its own engine', async () => {
		const reader = await createEngine(rust);
		const item = reader.parse('fn real() {}').statements()[0];
		expect(reader.render(item as never).toString()).toBe('fn real() {}');
	});
});
