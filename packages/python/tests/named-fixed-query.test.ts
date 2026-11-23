import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const GRAMMAR = python;

const PAIRS = [
	{ name: '_simple_statements > newline', holder: python.kinds.SimpleStatements, token: python.kinds.Newline, source: 'x = 1\n' },
	{ name: 'block > newline', holder: python.kinds.Block, token: python.kinds.Newline, source: 'if a:\n    b\n' },
	{ name: 'decorator > newline', holder: python.kinds.Decorator, token: python.kinds.Newline, source: '@a\ndef f(): pass\n' }
];

describe.each(['object', 'arena'] as const)('a named fixed token leaves a query for its holder (%s storage)', (nodeStorage) => {
	it.each(PAIRS)('$name', async ({ holder, token, source }) => {
		using engine = await createEngine(GRAMMAR, { nodeStorage });
		const root = engine.parse(source);
		const descendants = root.$query().$descendants as unknown as { ofType(kind: number): Iterable<unknown> };
		expect([...descendants.ofType(token)]).toHaveLength(0);
		expect([...descendants.ofType(holder)]).toHaveLength(1);
	});
});
