import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';
import { is } from '../src/is.ts';
import python from '../src/index.ts';
import type { ExpressionList, PatternList } from '../src/types.ts';

const engine = await createEngine(python);
const { build } = engine;
const x = () => build.identifier('x');
const y = () => build.identifier('y');

type Parsed = { readonly $type: number };
const isParsed = (value: unknown): value is Parsed => typeof value === 'object' && value !== null && '$type' in value;

function memberNames(node: object): string[] {
	const names = new Set<string>();
	for (let o: object | null = node; o !== null && o !== Object.prototype && o !== Array.prototype; o = Object.getPrototypeOf(o)) {
		for (const name of Object.getOwnPropertyNames(o)) if (/^[a-z]/.test(name) && !(name in Array.prototype)) names.add(name);
	}
	return [...names];
}

function firstOf<T extends Parsed>(node: Parsed, guard: (candidate: Parsed) => boolean): T | undefined {
	if (guard(node)) return node as T;
	for (const name of memberNames(node)) {
		const member = (node as unknown as Record<string, unknown>)[name];
		if (typeof member !== 'function') continue;
		const held: unknown = member.call(node);
		for (const child of Array.isArray(held) ? held : [held]) {
			const found = isParsed(child) ? firstOf<T>(child, guard) : undefined;
			if (found !== undefined) return found;
		}
	}
	return undefined;
}

function parsedList<T extends Parsed>(source: string, guard: (candidate: Parsed) => boolean): T {
	const list = firstOf<T>(engine.parse(source), guard);
	if (list === undefined) throw new Error(`expected the list in: ${source}`);
	return list;
}

describe('an expression list', () => {
	it('renders the separator that makes one element a list', () => {
		const list = build.expressionList(x());
		expect(is.expressionList(list)).toBe(true);
		expect(list.$render()).toBe('x,');
	});

	it('renders one element with its separator whatever the delimiter option says', () => {
		expect(build.expressionList({ delimiter: Delimiter.None }, x()).$render()).toBe('x,');
	});

	it('renders no trailing separator after several elements unless asked', () => {
		expect(build.expressionList(x(), y()).$render()).toBe('x, y');
		expect(build.expressionList({ delimiter: Delimiter.Trailing }, x(), y()).$render()).toBe('x, y,');
	});

	it.each([
		['a = x,\n', ['x']],
		['a = x, y\n', ['x', 'y']],
		['a = x, y,\n', ['x', 'y']]
	])('reads %j as one flat list and renders it unchanged', (source, elements) => {
		const list = parsedList<ExpressionList.Parsed>(source, is.expressionList);
		expect(list.items().map((element) => String(engine.render(element)))).toEqual(elements);
		expect(engine.parse(source).$render()).toBe(source);
	});

	it('keeps the separator when a parsed list of two is cut down to one', () => {
		const [first] = parsedList<ExpressionList.Parsed>('a = x, y\n', is.expressionList).items();
		expect(build.expressionList(first).$render()).toBe('x,');
	});
});

describe('a pattern list', () => {
	it('renders the separator that makes one element a list', () => {
		const list = build.patternList(x());
		expect(is.patternList(list)).toBe(true);
		expect(list.$render()).toBe('x,');
	});

	it('renders no trailing separator after several elements unless asked', () => {
		expect(build.patternList(x(), y()).$render()).toBe('x, y');
		expect(build.patternList({ delimiter: Delimiter.Trailing }, x(), y()).$render()).toBe('x, y,');
	});

	it.each([
		['x, = a\n', ['x']],
		['x, y = a\n', ['x', 'y']],
		['x, y, = a\n', ['x', 'y']]
	])('reads %j as one flat list and renders it unchanged', (source, elements) => {
		const list = parsedList<PatternList.Parsed>(source, is.patternList);
		expect(list.items().map((element) => String(engine.render(element)))).toEqual(elements);
		expect(engine.parse(source).$render()).toBe(source);
	});
});

describe('the list kinds that held the further elements', () => {
	it('are no longer built', () => {
		expect(Object.keys(build).filter((name) => /^(expressionList|patternList)./.test(name))).toEqual([]);
	});
});
