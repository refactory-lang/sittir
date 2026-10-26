import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);

function assignedTo(source: string) {
	const statement = ts.parse(source).statements()[0]!;
	if (!ts.is.expressionStatement(statement)) throw new Error('expected an expression statement');
	const assignment = statement.expression();
	if (!ts.is.assignmentExpression(assignment)) throw new Error('expected an assignment');
	return assignment.left();
}

describe('a rest pattern admits an lhs_expression envelope and stores its content', () => {
	it('builds ...a.b from a parsed envelope and through a parsed rest pattern\'s setter', () => {
		const envelope = assignedTo('a.b = 1;\n');
		if (!ts.is.lhsExpression(envelope)) throw new Error('expected an lhs expression');
		const built = ts.build.restPattern(envelope);
		expect(built.$render()).toBe('...a.b');
		expect(ts.is.memberExpression(built.lhsExpression())).toBe(true);
		const array = assignedTo('[...q] = c;\n');
		if (!ts.is.lhsExpression(array)) throw new Error('expected an lhs expression');
		const pattern = array.content();
		if (!ts.is.arrayPattern(pattern)) throw new Error('expected an array pattern');
		const rest = pattern.elements()[0]!;
		if (!ts.is.restPattern(rest)) throw new Error('expected a rest pattern');
		const edited = rest.$with.lhsExpression(envelope);
		expect(edited.$render()).toBe('...a.b');
		expect(ts.is.memberExpression(edited.lhsExpression())).toBe(true);
	});
});
