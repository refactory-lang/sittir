// A coordinate names a tree by a tag minted from one process-wide counter,
// so no two engines ever hold the same tag. Rendering it through another
// engine is refused with the handle in the error — never answered from
// whatever tree happens to sit at that index over there.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe('coordinates name their engine', () => {
	it('refuses a node read by another engine', async () => {
		const reader = await createEngine(rust);
		const other = await createEngine(rust);
		other.parse('fn decoy() {}');
		const item = reader.parse('fn real() {}').statements()[0];
		expect(() => other.render(item as never).toString()).toThrow(/names tree \d+, which this engine does not hold/);
	});

	it('renders the same node through its own engine', async () => {
		const reader = await createEngine(rust);
		const item = reader.parse('fn real() {}').statements()[0];
		expect(reader.render(item as never).toString()).toBe('fn real() {}');
	});
});
