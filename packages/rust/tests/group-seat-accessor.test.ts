import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);
const { kinds } = rs;

const matchBlockOf = (source: string) => {
	const item = rs.parse(source).statements()[0]!;
	if (!rs.is.functionItem(item)) throw new Error('not a function');
	const statement = item.body().statements()[0]!;
	if (!rs.is.expressionStatement(statement)) throw new Error('not an expression statement');
	const expression = statement.content();
	if (!rs.is.matchExpression(expression)) throw new Error('not a match');
	return expression.body();
};

describe('a group seat flattens its group fields onto the parent', () => {
	it('reads the arms of a match block through the flattened list accessor', () => {
		const block = matchBlockOf('fn f() { match x { 1 => 1, _ => 2 } }\n');
		expect(block.matchArms()).toHaveLength(1);
		expect(block.lastArm()?.$render()).toBe('_ => 2');
	});

	it('reads the same-name key as the inner pattern and the new key as the condition', () => {
		const block = matchBlockOf('fn f() { match x { a if a > 1 => 1 } }\n');
		const arm = block.lastArm()!;
		const inner = arm.pattern();
		expect(typeof inner === 'number' ? inner : inner.$type).not.toBe(kinds.MatchPattern);
		expect(String(rs.render(arm.pattern()))).toBe('a');
		expect(String(rs.render(arm.condition()!))).toBe('a > 1');
	});

	it('takes the inner pattern or the whole match pattern through $with.pattern', () => {
		const block = matchBlockOf('fn f() { match x { a if a > 1 => 1 } }\n');
		const arm = block.lastArm()!;
		expect(arm.$with.pattern(rs.build.identifier('b')).$render()).toBe('b if a > 1 => 1');
		const whole = rs.build.matchPattern({ pattern: rs.build.identifier('c'), condition: rs.build.identifier('d') });
		expect(whole.$type).toBe(kinds.MatchPattern);
		expect(arm.$with.pattern(whole).$render()).toBe('c if d => 1');
	});

	it('clears the condition through $with.condition', () => {
		const block = matchBlockOf('fn f() { match x { a if a > 1 => 1 } }\n');
		expect(block.lastArm()!.$with.condition(undefined).$render()).toBe('a => 1');
	});
});
