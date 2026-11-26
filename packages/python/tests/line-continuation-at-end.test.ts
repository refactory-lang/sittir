import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

interface StatementsRoot {
	statements(): readonly unknown[];
	$with: { statements(...items: readonly unknown[]): { $render(): unknown } };
}

const storages = ['arena', 'object'] as const;
const opened = (nodeStorage: (typeof storages)[number]) => createEngine(python, { nodeStorage });

describe.each(storages)('a line continuation that ends the source (%s storage)', (storage) => {
	it.each(['\\', 'x\\', 'x = 1\ny\\', 'def f():\n  a\\'])('%j renders untouched as its source and releases', async (source) => {
		using engine = await opened(storage);
		const root = engine.parse(source);
		expect(engine.render(root).toString()).toBe(source);
		engine.release(root);
		if (storage === 'arena') expect(engine.diagnostics.builtMemory?.()).toEqual({ chunks: 0, counts: 0, live: 0 });
	});

	it.each([
		['\\', '\\'],
		['x\\', 'x \\'],
		['x = 1\ny\\', 'x = 1\ny \\']
	])('%j rebuilt keeps the continuation as its source bytes', async (source, rebuilt) => {
		using engine = await opened(storage);
		const root = engine.parse(source) as unknown as StatementsRoot;
		expect(String(root.$with.statements(...root.statements()).$render())).toBe(rebuilt);
	});
});
