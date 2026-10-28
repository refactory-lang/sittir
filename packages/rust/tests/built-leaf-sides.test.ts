// A built leaf holds no storage: its holder's cell holds it, and its sides are
// on its object and at every site that holds it. Each case renders as it does
// on object construction.
import { describe, expect, it } from 'vitest';
import { builtRefOf } from '../../common/src/built-ref.ts';
import rust from '../src/index.ts';
import { constructions, expectGiven, objects, records, type Engine } from './constructions.mts';

const comment = (rs: Engine, text: string) => rs.build.blockComment(rs.build.blockCommentRegular(` ${text} `));

const foreign = (await rust.createEngine()) as Engine;

function rejectedWrite(rs: Engine, placed: boolean): string[] {
	const x = rs.build.identifier('x');
	x.$trivia.leading(comment(rs, 'ok'));
	const holder = placed ? rs.build.expressionStatement(x) : undefined;
	expect(() => x.$trivia.leading(comment(foreign, 'foreign'))).toThrow();
	return [rs.render(x).toString(), ...(holder === undefined ? [] : [rs.render(holder).toString()])];
}

function siteRenders(rs: Engine): string[] {
	const b = rs.build;
	const x = b.identifier('x');
	x.$trivia.leading(comment(rs, 'before'));
	const first = b.expressionStatement(x);
	const out = [rs.render(first).toString(), rs.render(x).toString()];
	const second = b.expressionStatement(x);
	x.$trivia.trailing(comment(rs, 'after'));
	out.push(rs.render(first).toString(), rs.render(second).toString(), rs.render(x).toString());
	out.push(rs.render(b.block({ statements: [first, second] })).toString());
	return out;
}

function parsedLeafRender(rs: Engine): string {
	const parsed = rs.parse('fn f() { a; }\n');
	const fn = parsed.statements()[0];
	if (fn === undefined || !rs.is.functionItem(fn)) throw new Error('expected a function');
	const statement = fn.body().statements()[0];
	if (statement === undefined || !rs.is.expressionStatement(statement)) throw new Error('expected an expression statement');
	const a = statement.content() as unknown as { $trivia: { leading(...items: unknown[]): unknown } };
	a.$trivia.leading(comment(rs, 'row'));
	return rs.render(rs.build.expressionStatement(a as never)).toString();
}

function parkedRenders(rs: Engine): string[] {
	const b = rs.build;
	const shared = comment(rs, 'shared');
	const one = b.identifier('a');
	const two = b.identifier('b');
	one.$trivia.leading(shared);
	two.$trivia.leading(shared);
	rs.release(one);
	const own = comment(rs, 'own');
	const three = b.identifier('c');
	three.$trivia.leading(own);
	rs.release(own);
	return [rs.render(two).toString(), rs.render(b.expressionStatement(two)).toString(), rs.render(b.expressionStatement(three)).toString()];
}

function writtenAfterWith(rs: Engine): string {
	const fn = rs.parse('fn f() {}\n').statements()[0];
	if (fn === undefined || !rs.is.functionItem(fn)) throw new Error('expected a function');
	const name = rs.build.identifier('g');
	const edited = fn.$with.name(name);
	name.$trivia.leading(comment(rs, 'after'));
	return rs.render(edited).toString();
}

describe('a built leaf holds no storage', () => {
	it('is appended as no record, and its holder reads back the leaf its builder was given', () => {
		const b = records.build;
		const arena = builtRefOf(b.identifier('anchor'))!.arena;
		const written = () => arena.chunks().words.reduce((words, chunk) => words + chunk.length, 0);
		const before = written();
		const name = b.identifier('f');
		expect(written()).toBe(before);
		expect(builtRefOf(name)!.at).toBeUndefined();
		const fn = b.functionItem({ name, parameters: b.parameters(), body: b.block() });
		expectGiven(fn.name(), name);
	});

	it('renders a side written before it is placed, or after, at every site that holds it, and alone', () => {
		const expected = siteRenders(objects);
		expect(expected[0]).toBe('/* before */ x;');
		for (const [name, rs] of constructions) expect([name, siteRenders(rs)]).toEqual([name, expected]);
	});

	it('keeps a record it parks while unplaced through the release of another leaf parking it, and of its own handle', () => {
		const expected = parkedRenders(objects);
		expect(expected).toEqual(['/* shared */ b', '/* shared */ b;', '/* own */ c;']);
		for (const [name, rs] of constructions) expect([name, parkedRenders(rs)]).toEqual([name, expected]);
	});

	it("renders a side written after the leaf was given to a parsed node's $with", () => {
		expect(writtenAfterWith(objects)).toBe('fn /* after */ g() {}');
		for (const [name, rs] of constructions) expect([name, writtenAfterWith(rs)]).toEqual([name, writtenAfterWith(objects)]);
	});

	it('refuses a side naming another engine record, placed or not, and keeps the sides it had', () => {
		for (const placed of [true, false]) {
			const expected = rejectedWrite(objects, placed);
			expect(expected[0]).toBe('/* ok */ x');
			for (const [name, rs] of constructions) expect([name, placed, rejectedWrite(rs, placed)]).toEqual([name, placed, expected]);
		}
	});

	it("renders a parsed leaf a built record holds with its row's sides", () => {
		const expected = parsedLeafRender(objects);
		expect(expected).toContain('/* row */');
		for (const [name, rs] of constructions) expect([name, parsedLeafRender(rs)]).toEqual([name, expected]);
	});
});
