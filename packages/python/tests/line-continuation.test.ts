import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);
const b = py.build;
const call = (name: string) => b.call.strict({ function: b.identifier(name), arguments: b.argumentList.strict() });
const statement = (expression: object) => b.module.strict(b.simpleStatements.strict(b.expressionStatement.strict(expression as never)));

describe('a line continuation trailing an expression', () => {
	it('is the seam before the next token, with no line break ahead of its backslash', () => {
		const joined = b.booleanOperator.strict({
			left: call('f').$trivia.trailing(b.lineContinuation.newline('\\\n')),
			operator: py.kinds.OrKeyword,
			right: call('g')
		});
		const rendered = py.render(statement(joined)).toString();
		expect(rendered).toBe('f()\\\nor g()\n');
		expect(py.parse(rendered).$errors).toHaveLength(0);
	});

	it('reads back as one statement', () => {
		const text = 'len("a") \\\nor len("aa")\n';
		expect(py.parse(text).$errors).toHaveLength(0);
		expect(py.render(py.parse(text)).toString()).toBe(text);
	});
});
