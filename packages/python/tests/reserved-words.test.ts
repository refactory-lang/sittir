import { describe, expect, it } from 'vitest';
import { createEngine, ir, TSKindId } from '../src/index.ts';

function readName(text: string): { $type: number; $text?: string } {
	const { root } = createEngine().diagnostics.parseAndRead(text, { deep: true });
	const statement = (
		root as unknown as {
			_statements: {
				_simple_statements_elements: { _simple_statement: { _content: { _expression: { _name: unknown } } } };
			};
		}
	)._statements._simple_statements_elements._simple_statement;
	return statement._content._expression._name as { $type: number; $text?: string };
}

describe('the grammar reserved wordset', () => {
	it.each(['class', 'async', 'await'])('the identifier builder rejects %j', (word) => {
		expect(() => ir.identifier(word)).toThrow(`identifier: '${word}' is a reserved word`);
	});

	it('the identifier builder admits a contextual keyword the grammar does not reserve', () => {
		expect(ir.identifier('print').$text).toBe('print');
	});
});

describe('keyword extraction at a slot that declares keyword arms', () => {
	it.each([
		['print', TSKindId.PrintKeyword],
		['async', TSKindId.AsyncKeyword]
	])('loose %j builds the keyword arm the parser reads', (word, kindId) => {
		const built = ir.namedExpression({ name: word, value: ir.integer('1') });
		const text = `(${built.$render().toString()})`;
		expect(text).toBe(`(${word} := 1)`);
		expect(built._name).toBe(kindId);
		expect(readName(text).$type).toBe(kindId);
	});

	it('rejects an identifier spelled as the keyword arm', () => {
		expect(() => ir.namedExpression({ name: ir.identifier('print'), value: ir.integer('1') })).toThrow(
			"NamedExpression.name: 'print' is this slot's keyword"
		);
	});
});
