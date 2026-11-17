import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../src/languages.ts';

async function rebuilt(source: string): Promise<string> {
	using engine = await createEngine(await languageByName('python'));
	const module = engine.parse(source);
	return module.$with.statements(...module.statements()).$render();
}

const HEADS: readonly (readonly [string, string | undefined])[] = [
	['def a(b):', '\n\n\n'],
	['class A:', '\n\n\n'],
	['def a(b):\n    pass', '\n\n\n'],
	['class A:\n    y = 1', '\n\n\n'],
	['if d:', undefined],
	['y = 1', undefined]
];
const GAPS = ['\n', '\n\n', '\n\n\n'];
const SET_APART = '\n\n';

describe('a module rebuilt from its parsed statements writes after each head the options\' gap, or one blank line where the source set the next statement apart, whichever is larger', () => {
	for (const [head, written] of HEADS) {
		for (const gap of GAPS) {
			it(`${JSON.stringify(head)} then ${JSON.stringify(gap)}`, async () => {
				expect(await rebuilt(`${head}${gap}x = 1\n`)).toBe(`${head}${written ?? (gap === '\n' ? gap : SET_APART)}x = 1\n`);
			}, 120_000);
		}
	}
});
