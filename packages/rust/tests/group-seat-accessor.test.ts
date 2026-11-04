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
	const arms = expression.body().matchBlockArms();
	if (arms === undefined) throw new Error('no arms');
	return arms.arms();
};

const lastArmOf = (source: string) => {
	const arms = matchBlockOf(source);
	const last = arms[arms.length - 1]!;
	if (!rs.is.lastMatchArm(last)) throw new Error('the last arm is not a last match arm');
	return last;
};

describe('a group seat flattens its group fields onto the parent', () => {
	it('reads the arms of a match block as one list, its last element the last arm', () => {
		const arms = matchBlockOf('fn f() { match x { 1 => 1, _ => 2 } }\n');
		expect(arms).toHaveLength(2);
		expect(arms[1]!.$type).toBe(kinds.LastMatchArm);
		expect(arms[1]!.$render()).toBe('_ => 2');
	});

	it('reads the group keys as the inner pattern and the condition, and the seat as the whole match pattern', () => {
		const arm = lastArmOf('fn f() { match x { a if a > 1 => 1 } }\n');
		const inner = arm.pattern();
		expect(typeof inner === 'number' ? inner : inner.$type).not.toBe(kinds.MatchPattern);
		expect(String(rs.render(arm.pattern()))).toBe('a');
		expect(String(rs.render(arm.condition()!))).toBe('a > 1');
		expect(arm.match().$type).toBe(kinds.MatchPattern);
		expect(arm.match().$render()).toBe('a if a > 1');
	});

	it('takes the inner pattern through $with.pattern and the whole match pattern through $with.match', () => {
		const arm = lastArmOf('fn f() { match x { a if a > 1 => 1 } }\n');
		expect(arm.$with.pattern(rs.build.identifier('b')).$render()).toBe('b if a > 1 => 1');
		const whole = rs.build.matchPattern({ pattern: rs.build.identifier('c'), condition: rs.build.identifier('d') });
		expect(whole.$type).toBe(kinds.MatchPattern);
		expect(arm.$with.match(whole).$render()).toBe('c if d => 1');
	});

	it('clears the condition through $with.condition', () => {
		expect(lastArmOf('fn f() { match x { a if a > 1 => 1 } }\n').$with.condition(undefined).$render()).toBe('a => 1');
	});
});
