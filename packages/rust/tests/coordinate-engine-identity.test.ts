// A coordinate names a tree by a tag minted from one process-wide counter,
// so no two engines ever hold the same tag. A node read by one engine and
// rendered through another of the same language is handed to the engine that
// holds its tree — never answered from whatever tree happens to sit at that
// index in the calling engine.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe('coordinates name their engine', () => {
	it('renders a node read by another engine through the engine that read it', async () => {
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
