import { afterAll, describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../src/languages.ts';

const rust = await createEngine(await languageByName('rust'));

afterAll(() => rust.dispose());

/** The fastest of three snapshots, each of a fresh parse of its own array literal of `count` elements, in milliseconds. */
function snapshotMs(count: number): number {
	let best = Number.POSITIVE_INFINITY;
	for (let pass = 0; pass < 3; pass++) {
		const source = `fn f${pass}() { let a = [${Array.from({ length: count }, (_, i) => String(i + pass)).join(', ')}]; }\n`;
		const root = rust.parse(source) as unknown as { $snapshot(): unknown };
		const start = performance.now();
		root.$snapshot();
		best = Math.min(best, performance.now() - start);
	}
	return best;
}

describe("a snapshot measures a long list's layout in time linear in its length", () => {
	it('grows well under quadratically: four times the elements take less than eight times as long', () => {
		snapshotMs(100);
		const small = snapshotMs(500);
		const large = snapshotMs(2000);
		expect(large / small, `500 elements: ${small.toFixed(1)} ms, 2000 elements: ${large.toFixed(1)} ms`).toBeLessThan(8);
	}, 300_000);
});
