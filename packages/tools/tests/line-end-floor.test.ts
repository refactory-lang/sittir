import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../src/languages.ts';

async function rebuilt(source: string): Promise<string> {
	const engine = await createEngine(await languageByName('python'));
	const module = engine.parse(source);
	return module.$with.statements(...module.statements()).$render();
}

const HEADS = ['def a(b):', 'class A:', 'def a(b):\n    pass', 'class A:\n    y = 1', 'if d:', 'y = 1'];
const GAPS = ['\n', '\n\n', '\n\n\n'];

describe('a module rebuilt from its parsed statements keeps each source gap', () => {
	for (const head of HEADS) {
		for (const gap of GAPS) {
			it(`${JSON.stringify(head)} then ${JSON.stringify(gap)}`, async () => {
				const source = `${head}${gap}x = 1\n`;
				expect(await rebuilt(source)).toBe(source);
			}, 120_000);
		}
	}
});
