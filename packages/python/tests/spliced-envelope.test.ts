import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

const two = () => py.build.integerDecimal.plain('2');
const negativeOne = () => py.build.simplePattern.negative.strict(py.build.integerDecimal.plain('1'));

function firstCasePattern(pattern: string) {
	const statement = py.parse(`match x:\n    case ${pattern}:\n        pass\n`).statements()[0]!;
	if (!py.is.matchStatement(statement)) throw new Error('expected a match statement');
	const body = statement.body();
	if (!py.is.matchBlockBlock(body)) throw new Error('expected a match block');
	return body.alternatives()[0]!.casePatterns().items()[0]!;
}

describe('a slot that splices a hidden rule admits that rule\'s envelope and stores its content', () => {
	it('builds -1 | 2 and 2 | -1 from the seated negative form, and reads the negative back', () => {
		const negative = negativeOne();
		expect(negative.$type).toBe(py.kinds.SimplePattern);
		const left = py.build.unionPattern.strict({ left: negative, right: two() });
		expect(left.$render()).toBe('-1 | 2');
		expect(py.is.simplePatternNegative(left.left())).toBe(true);
		expect(left.left()).toBe(negative.content());
		const right = py.build.unionPattern.strict({ left: two(), right: negativeOne() });
		expect(right.$render()).toBe('2 | -1');
		expect(py.is.simplePatternNegative(right.right())).toBe(true);
	});

	it('places a parsed simple_pattern envelope into a built union and through a parsed union\'s setter', () => {
		const envelope = firstCasePattern('-1').content();
		if (!py.is.simplePattern(envelope)) throw new Error('expected a simple pattern');
		const built = py.build.unionPattern.strict({ left: envelope, right: two() });
		expect(built.$render()).toBe('-1 | 2');
		expect(py.is.simplePatternNegative(built.left())).toBe(true);
		const parsed = firstCasePattern('1 | 2').content();
		if (!py.is.simplePattern(parsed)) throw new Error('expected a simple pattern');
		const union = parsed.content();
		if (!py.is.unionPattern(union)) throw new Error('expected a union pattern');
		const edited = union.$with.left(envelope);
		expect(edited.$render()).toBe('-1 | 2');
		expect(py.is.simplePatternNegative(edited.left())).toBe(true);
	});

	it('places a built or parsed simple_statements envelope into an inline suite, strict, loose and by config', () => {
		const statement = () => py.build.expressionStatement(py.build.identifier('a'));
		const built = py.build.simpleStatements(statement(), statement());
		const parsed = py.parse('a; b\n').statements()[0]!;
		if (!py.is.simpleStatements(parsed)) throw new Error('expected simple statements');
		for (const envelope of [built, parsed]) {
			for (const suite of [py.build.suiteInline.strict(envelope), py.build.suiteInline(envelope), py.build.suiteInline({ elements: envelope })]) {
				expect(py.is.simpleStatementsElements(suite.elements())).toBe(true);
			}
		}
		expect(py.build.ifStatement({ condition: py.build.identifier('x'), consequence: py.build.suiteInline(built) }).$render()).toBe('if x: a; a\n');
		expect(py.build.ifStatement({ condition: py.build.identifier('x'), consequence: py.build.suiteInline(parsed) }).$render()).toBe('if x: a; b\n');
	});

	it('admits the envelope at a mapping key and a keyword argument value, strict and loose', () => {
		const y = () => py.build.casePattern.strict(py.build.simplePattern.strict(py.build.dottedName.strict(py.build.identifier('y'))));
		for (const pair of [py.build.keyValuePattern.strict({ key: negativeOne(), value: y() }), py.build.keyValuePattern({ key: negativeOne(), value: y() })]) {
			expect(pair.$render()).toBe('-1: y');
			expect(py.is.simplePatternNegative(pair.key())).toBe(true);
		}
		const k = () => py.build.identifier('k');
		for (const keyword of [py.build.keywordPattern.strict({ name: k(), value: negativeOne() }), py.build.keywordPattern({ name: k(), value: negativeOne() })]) {
			expect(py.is.simplePatternNegative(keyword.value())).toBe(true);
		}
	});

	it('refuses an envelope that holds trivia of its own, naming the envelope', () => {
		const commented = negativeOne().$trivia.leading(py.build.comment('# c'));
		expect(() => py.build.unionPattern.strict({ left: commented, right: two() })).toThrow(
			/UnionPattern\.left: takes a simple_pattern's content, and this simple_pattern holds leading trivia of its own/
		);
	});
});
