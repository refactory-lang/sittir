import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';
import python from '../src/index.ts';
import { coerceToArgumentListElements } from '../src/factories/coerce.ts';

for (const nodeStorage of ['object', 'arena'] as const) {
	const py = await createEngine(python, { nodeStorage });
	const argumentsOf = (source: string) => {
		const statement = py.parse(source).statements()[0]!;
		if (!py.is.SimpleStatements(statement)) throw new Error('not a simple statement');
		const element = statement.elements()[0]!;
		if (!py.is.expressionStatement(element)) throw new Error('not an expression statement');
		const call = element.content();
		if (!py.is.call(call)) throw new Error('not a call');
		const list = call.arguments();
		if (!py.is.argumentList(list)) throw new Error('not an argument list');
		const elements = list.arguments();
		if (elements === undefined) throw new Error('no arguments');
		return elements;
	};

	describe(`a list's from() given a node of its own kind (${nodeStorage})`, () => {
		it('returns that node when no options come with it', () => {
			const elements = argumentsOf('f(a, b,)\n');
			expect(coerceToArgumentListElements(elements)).toBe(elements);
		});

		it("sets the options over the node's own, leaving the node it was given as it was", () => {
			const elements = argumentsOf('f(a, b,)\n');
			const edited = coerceToArgumentListElements({ delimiter: Delimiter.None }, elements);
			expect(String(py.render(edited))).toBe('a, b');
			expect(String(py.render(elements))).toBe('a, b,');
		});
	});
}
