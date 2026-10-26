// A node's source text is its `$text`, else the text its coordinate spans,
// read through the tree's native text call. A built or edited compound has
// neither and has no source text: its rendered text is not source text.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sourceTextOf } from '@sittir/common/utils';
import { languageByName } from '../src/languages.ts';

interface FunctionItem {
	name(): object;
	$with: { name(name: string): object };
}

const SOURCE = '// é\r\nfn first() {}\r\n';

for (const nodeStorage of ['object', 'arena'] as const) {
	describe(`a node's source text, ${nodeStorage} wire`, async () => {
		const engine = await createEngine(await languageByName('rust'), { nodeStorage });
		const root = engine.parse(SOURCE) as unknown as { statements(): FunctionItem[] };
		const fn = root.statements()[0]!;

		it('is a leaf\'s $text', () => {
			expect(sourceTextOf(fn.name())).toBe('first');
		});

		it("is the text a parsed compound's span covers", () => {
			expect(sourceTextOf(fn as unknown as object)).toBe('fn first() {}');
		});

		it('is undefined for a built compound', () => {
			expect(sourceTextOf((engine.build as unknown as { block(config: object): object }).block({}))).toBeUndefined();
		});

		it('is undefined for an edited compound', () => {
			expect(sourceTextOf(fn.$with.name('renamed'))).toBeUndefined();
		});
	});
}
