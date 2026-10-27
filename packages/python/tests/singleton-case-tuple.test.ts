import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const py = await createEngine(python);

const caseClauseOf = (source: string) => {
	const statement = py.parse(`match x:\n    case ${source}:\n        pass\n`, { errors: 'throw' }).statements()[0]!;
	if (!py.is.matchStatement(statement)) throw new Error('expected a match statement');
	const body = statement.body();
	if (!py.is.matchBlockBlock(body)) throw new Error('expected a match block');
	return body.alternatives()[0]!;
};
const casePatternOf = (source: string) => caseClauseOf(source).pattern();

describe('a case tuple pattern with one pattern', () => {
	it('renders the comma that makes it a sequence match, when built', () => {
		const item = casePatternOf('a');
		if (!py.is.casePattern(item)) throw new Error('expected one case pattern');
		expect(py.build.casePatternList(item).$render()).toBe('a,');
	});

	it('keeps the comma when a parsed one-pattern tuple is rebuilt and placed in a new case', () => {
		const clause = caseClauseOf('a,');
		const tuple = clause.pattern();
		if (!py.is.casePatternList(tuple)) throw new Error('expected a case tuple pattern');
		const rebuilt = py.build.casePatternList(tuple.items()[0]!);
		const text = py.build.caseClause({ pattern: rebuilt, body: clause.body() }).$render();
		expect(text).toBe('case a,:\n    pass');
		const reparsed = py.parse(`match x:\n${text.replace(/^/gm, '    ')}\n`, { errors: 'throw' }).statements()[0]!;
		if (!py.is.matchStatement(reparsed)) throw new Error('expected a match statement');
		const block = reparsed.body();
		if (!py.is.matchBlockBlock(block)) throw new Error('expected a match block');
		expect(py.is.casePatternList(block.alternatives()[0]!.pattern())).toBe(true);
	});

	it('keeps the comma when a parsed tuple of two is cut down to one', () => {
		const tuple = casePatternOf('a, b');
		if (!py.is.casePatternList(tuple)) throw new Error('expected a case tuple pattern');
		expect(py.build.casePatternList(tuple.items()[0]!).$render()).toBe('a,');
	});
});

describe('the case forms beside it', () => {
	it('reads one pattern without a comma as that pattern, not a tuple', () => {
		expect(py.is.casePattern(casePatternOf('a'))).toBe(true);
		expect(py.is.casePattern(casePatternOf('a if a'))).toBe(true);
	});

	it.each(['a,', 'a, b', 'a, b,', 'a, if a', '*a, if a'])('reads %s as a tuple without parentheses', (source) => {
		expect(py.is.casePatternList(casePatternOf(source))).toBe(true);
	});

	it.each(['case a,:', 'case a, b:', 'case a:', 'case a, if a:'])('preserves the parsed form of %s', (head) => {
		const source = `match x:\n    ${head}\n        pass\n`;
		expect(py.parse(source, { errors: 'throw' }).$render().toString()).toBe(source);
	});
});
