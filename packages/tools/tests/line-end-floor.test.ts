import { describe, expect, it } from 'vitest';
import { loadNativeEngine } from '../src/validate/common.ts';

interface ModuleNode {
	statements(): Iterable<unknown>;
	readonly $with: { statements(...items: unknown[]): { $render(): string } };
}

async function rebuilt(source: string): Promise<string> {
	const engine = await loadNativeEngine('python');
	const module = engine.parse(source) as unknown as ModuleNode;
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
