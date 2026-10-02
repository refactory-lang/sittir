import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);
const pyNative = (await python.load()).createNative();

function readName(text: string): { $type: number; $text?: string } {
	const { root } = pyNative.parseAndRead(text, { deep: true });
	const statement = (
		root as unknown as {
			_statements: {
				_elements: { _item: { _content: { _expression: { _name: unknown } } } };
			};
		}
	)._statements._elements._item;
	return statement._content._expression._name as { $type: number; $text?: string };
}

describe('the grammar reserved wordset', () => {
	it.each(['class', 'async', 'await'])('the identifier builder rejects %j', (word) => {
		expect(() => py.build.identifier(word)).toThrow(`identifier: '${word}' is a reserved word`);
	});

	it('the identifier builder admits a contextual keyword the grammar does not reserve', () => {
		expect(py.build.identifier('print').$text).toBe('print');
	});

	it('refuses a reserved literal at compile time, and a wide string at run time', () => {
		// @ts-expect-error 'class' is in the grammar's reserved wordset
		expect(() => py.build.identifier('class')).toThrow("identifier: 'class' is a reserved word");
		// @ts-expect-error so is 'await'
		expect(() => py.build.identifier('await')).toThrow("identifier: 'await' is a reserved word");
		const wide: string = 'async';
		expect(() => py.build.identifier(wide)).toThrow("identifier: 'async' is a reserved word");
	});
});

describe('keyword extraction at a slot that declares keyword arms', () => {
	it.each([
		['print', py.kinds.PrintKeyword],
		['async', py.kinds.AsyncKeyword]
	])('loose %j builds the keyword arm the parser reads', (word, kindId) => {
		const built = py.build.namedExpression({ name: word, value: py.build.integer('1') });
		const text = `(${built.$render().toString()})`;
		expect(text).toBe(`(${word} := 1)`);
		expect(built._name).toBe(kindId);
		expect(readName(text).$type).toBe(kindId);
	});

	it('rejects an identifier spelled as the keyword arm', () => {
		expect(() => py.build.namedExpression({ name: py.build.identifier('print'), value: py.build.integer('1') })).toThrow(
			"NamedExpression.name: 'print' is this slot's keyword"
		);
	});
});
