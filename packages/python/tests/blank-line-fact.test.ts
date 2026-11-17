import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const rebuilt = [
	['the blank-line entry alone writes one blank line, whatever the run', 'import a\n\n\n\nimport b\n', 'import a\n\nimport b\n'],
	['the arm alone writes its two blank lines where the source had none', 'class A:\n    pass\nx = 1\n', 'class A:\n    pass\n\n\nx = 1\n'],
	['the entry and the arm on one gap write the larger', 'class A:\n    pass\n\nx = 1\n', 'class A:\n    pass\n\n\nx = 1\n'],
	['a run of four after a class writes the arm’s two', 'class A:\n    pass\n\n\n\n\nx = 1\n', 'class A:\n    pass\n\n\nx = 1\n'],
	['a blank line above an item’s leading comment is kept above it', 'x = 1\n\n# c\ny = 2\n', 'x = 1\n\n# c\ny = 2\n'],
	['a run of blank lines above an item’s leading comment is one blank line', 'x = 1\n\n\n\n# c\ny = 2\n', 'x = 1\n\n# c\ny = 2\n'],
	['a blank line after an item’s trailing comment is kept', 'x = 1  # t\n\ny = 2\n', 'x = 1  # t\n\ny = 2\n'],
	['no blank line, none written', 'x = 1\ny = 2\n', 'x = 1\ny = 2\n']
] as const;

describe.each(['object', 'arena'] as const)('a rebuilt list writes one blank line before an item the source set apart (%s storage)', (nodeStorage) => {
	it.each(rebuilt)('%s', async (_, source, expected) => {
		using engine = await createEngine(python, { nodeStorage });
		const root = engine.parse(source);
		expect(root.$with.statements(...root.statements()).$render()).toBe(expected);
	});

	it('in a block a rebuilt function body holds', async () => {
		using engine = await createEngine(python, { nodeStorage });
		const root = engine.parse('def f():\n    a = 1\n\n\n    b = 2\n') as any;
		const [definition] = root.statements();
		const block = definition.body().block();
		const body = definition.body().$with.block(block.$with.statements(...block.statements()));
		expect(root.$with.statements(definition.$with.body(body)).$render()).toBe('def f():\n    a = 1\n\n    b = 2\n');
	});
});
