import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

describe('a list-valued $with setter', () => {
	const source = 'x = 1\ny = 2\n';

	it('takes its items as arguments and keeps every one', async () => {
		const engine = await createEngine(python);
		const root = engine.parse(source);
		expect(String(engine.render(root.$with.statements(...root.statements())))).toBe(source);
	});

	it('rejects one array in place of its items, naming the slot', async () => {
		const engine = await createEngine(python);
		const root = engine.parse(source);
		// @ts-expect-error a list setter takes its items as arguments
		expect(() => root.$with.statements([...root.statements()])).toThrow(/statements\(\.\.\.items\)/);
	});
});
