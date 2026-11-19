import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const source = 'def a():\n    if b:\n        b # comment\n    b # comment\n';

describe.each(['object', 'arena'] as const)('a comment added after an untouched node whose bytes end in a line comment goes on its own line (%s storage)', (nodeStorage) => {
	it('on the untouched node’s own trailing side', async () => {
		using engine = await createEngine(python, { nodeStorage });
		const root = engine.parse(source);
		const [definition] = root.statements();
		if (definition === undefined || typeof definition === 'number') throw new Error('expected a definition');
		definition.$trivia.trailing('# five');
		expect(root.$render()).toBe('def a():\n    if b:\n        b # comment\n    b # comment\n# five\n');
	});

	it('after the statement it ends in, under a rebuilt root', async () => {
		using engine = await createEngine(python, { nodeStorage });
		const root = engine.parse(source) as any;
		const last = root.statements()[0].body().block().at(-1);
		last.$trivia.trailing(...last.$trivia.trailing(), '# five');
		expect(root.$with.statements(...root.statements()).$render()).toBe('def a():\n    if b:\n        b # comment\n    b # comment\n    # five\n');
	});
});
