import { afterAll, describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../src/languages.ts';

const rust = await createEngine(await languageByName('rust'));

afterAll(() => rust.dispose());

/** The milliseconds one snapshot of a fresh parse of an array literal of `count` elements takes; `pass` makes each source distinct. */
function snapshotMs(count: number, pass: number): number {
	const source = `fn f${pass}() { let a = [${Array.from({ length: count }, (_, i) => String(i + pass)).join(', ')}]; }\n`;
	const root = rust.parse(source) as unknown as { $snapshot(): unknown };
	const start = performance.now();
	root.$snapshot();
	return performance.now() - start;
}

describe("a snapshot measures a long list's layout in time linear in its length", () => {
	it('grows well under quadratically: four times the elements take less than eight times as long', () => {
		snapshotMs(100, 0);
		let small = Number.POSITIVE_INFINITY;
		let large = Number.POSITIVE_INFINITY;
		for (let pass = 1; pass <= 5; pass++) {
			small = Math.min(small, snapshotMs(500, pass));
			large = Math.min(large, snapshotMs(2000, pass));
		}
		expect(large / small, `500 elements: ${small.toFixed(1)} ms, 2000 elements: ${large.toFixed(1)} ms`).toBeLessThan(8);
	}, 300_000);
});
