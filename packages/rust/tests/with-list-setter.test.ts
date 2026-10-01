import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe('a list-valued $with setter on a list that mixes nodes and tokens', () => {
	const source = 'use x;\nfn f() {}\n';

	it('takes its items as arguments and keeps every one', async () => {
		const engine = await createEngine(rust);
		const root = engine.parse(source);
		expect(String(engine.render(root.$with.statements(...root.statements())))).toBe(source);
	});

	it('rejects one array in place of its items, naming the slot', async () => {
		const engine = await createEngine(rust);
		const root = engine.parse(source);
		// @ts-expect-error a list setter takes its items as arguments
		expect(() => root.$with.statements([...root.statements()])).toThrow(/statements\(\.\.\.items\)/);
	});

	it('rejects one array on a built node too', async () => {
		const engine = await createEngine(rust);
		const block = engine.build.block();
		const statement = engine.build.expressionStatement(engine.build.identifier('a'));
		// @ts-expect-error a list setter takes its items as arguments
		expect(() => block.$with.statements([statement])).toThrow(/statements\(\.\.\.items\)/);
	});
});
