import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

function memberNames(node: object): string[] {
	const names = new Set<string>();
	for (let o: object | null = node; o !== null && o !== Object.prototype && o !== Array.prototype; o = Object.getPrototypeOf(o)) {
		for (const name of Object.getOwnPropertyNames(o)) if (/^[a-z]/.test(name) && !(name in Array.prototype)) names.add(name);
	}
	return [...names];
}

function findParsed(node: unknown, kind: number): Record<string, unknown> | undefined {
	if (node === null || typeof node !== 'object') return undefined;
	if ((node as { $type?: unknown }).$type === kind) return node as Record<string, unknown>;
	for (const name of memberNames(node)) {
		const member = (node as Record<string, unknown>)[name];
		if (typeof member !== 'function' || member.length !== 0) continue;
		const held: unknown = member.call(node);
		for (const child of Array.isArray(held) ? held : [held]) {
			const found = findParsed(child, kind);
			if (found !== undefined) return found;
		}
	}
	return undefined;
}

function readName(text: string): { $type: number; $text?: string } {
	const named = findParsed(py.parse(text), py.kinds.NamedExpression) as { name(): unknown } | undefined;
	const name = named?.name();
	return typeof name === 'number' ? { $type: name } : (name as { $type: number; $text?: string });
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
