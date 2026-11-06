import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);
const pyStrict = await createEngine(python, { api: 'strict' });
const strict = pyStrict.build;
const call = (name: string) => strict.call({ function: strict.identifier(name), arguments: strict.argumentList() });
const statement = (expression: object) => strict.module(strict.simpleStatements(strict.expressionStatement(expression as never)));

describe('a line continuation trailing an expression', () => {
	it('is the seam before the next token, with no line break ahead of its backslash', () => {
		const joined = strict.booleanOperator({
			left: call('f').$trivia.trailing(strict.lineContinuation.newline('\\\n')),
			operator: py.kinds.OrKeyword,
			right: call('g')
		});
		const rendered = pyStrict.render(statement(joined)).toString();
		expect(rendered).toBe('f()\\\nor g()\n');
		expect(py.parse(rendered).$errors).toHaveLength(0);
	});

	it('reads back as one statement', () => {
		const text = 'len("a") \\\nor len("aa")\n';
		expect(py.parse(text).$errors).toHaveLength(0);
		expect(py.render(py.parse(text)).toString()).toBe(text);
	});
});
