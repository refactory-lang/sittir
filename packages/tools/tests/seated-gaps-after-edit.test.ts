import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../src/languages.ts';

const rust = await createEngine(await languageByName('rust'));
const typescript = await createEngine(await languageByName('typescript'));
const python = await createEngine(await languageByName('python'));

interface Case {
	readonly grammar: string;
	readonly edit: (order: 'reversed' | 'parsed-built' | 'built-parsed') => string;
	readonly expected: Readonly<Record<'reversed' | 'parsed-built' | 'built-parsed', string>>;
}

const cases: readonly Case[] = [
	{
		grammar: 'rust',
		edit: (order) => {
			const root = rust.parse('use x;\n\nfn f() {}\n');
			const [use, fn] = root.statements();
			const built = rust.build.functionItem({ name: 'g', parameters: rust.build.parameters(), body: rust.build.block() });
			let items: (typeof built | NonNullable<typeof fn>)[];
			if (order === 'reversed') items = [fn!, use!];
			else if (order === 'parsed-built') items = [use!, built];
			else items = [built, use!];
			return root.$with.statements(...items).$render();
		},
		expected: { reversed: 'fn f() {}\n\nuse x;\n', 'parsed-built': 'use x;\n\nfn g() {}\n', 'built-parsed': 'fn g() {}\n\nuse x;\n' }
	},
	{
		grammar: 'typescript',
		edit: (order) => {
			const root = typescript.parse('import x from "x";\n\nfunction f() {}\n');
			const [imp, fn] = root.statements();
			const built = typescript.build.functionDeclaration({
				name: 'g',
				parameters: typescript.build.formalParameters(),
				body: typescript.build.statementBlock()
			});
			let items: (typeof built | NonNullable<typeof fn>)[];
			if (order === 'reversed') items = [fn!, imp!];
			else if (order === 'parsed-built') items = [imp!, built];
			else items = [built, imp!];
			return root.$with.statements(...items).$render();
		},
		expected: {
			reversed: 'function f() {}\n\nimport x from "x";\n',
			'parsed-built': 'import x from "x";\n\nfunction g() {}\n',
			'built-parsed': 'function g() {}\n\nimport x from "x";\n'
		}
	},
	{
		grammar: 'python',
		edit: (order) => {
			const root = python.parse('import x\n\n\ndef f():\n    pass\n');
			const [imp, fn] = root.statements();
			const built = python.build.functionDefinition({
				name: 'g',
				parameters: python.build.parameters(),
				body: python.build.block(python.build.passStatement)
			});
			let items: Parameters<typeof root.$with.statements>;
			if (order === 'reversed') items = [fn!, imp!];
			else if (order === 'parsed-built') items = [imp!, built];
			else items = [built, imp!];
			return root.$with.statements(...items).$render();
		},
		expected: {
			reversed: 'def f():\n    pass\n\n\nimport x\n',
			'parsed-built': 'import x\ndef g():\n    pass\n',
			'built-parsed': 'def g():\n    pass\n\n\nimport x\n'
		}
	}
];

describe('a rebuilt list gives each parsed item the gap its seat declares', () => {
	for (const { grammar, edit, expected } of cases) {
		it(`${grammar}: reversed items`, () => {
			expect(edit('reversed')).toBe(expected.reversed);
		});
		it(`${grammar}: a built item after a parsed one`, () => {
			expect(edit('built-parsed')).toBe(expected['built-parsed']);
		});
		it(`${grammar}: a parsed item before a built one`, () => {
			expect(edit('parsed-built')).toBe(expected['parsed-built']);
		});
	}

	it('python: reversed simple statements', () => {
		const root = python.parse('a = 1\nb = 2\n');
		const [a, b] = root.statements();
		expect(root.$with.statements(b!, a!).$render()).toBe('b = 2\na = 1\n');
	});

	it('python: a held line end keeps the wider source gap after it', () => {
		const root = python.parse('a = 1\n\n\nb = 2\n');
		expect(root.$with.statements(...root.statements()).$render()).toBe('a = 1\n\n\nb = 2\n');
	});

	it('keeps the source gap when the items keep their source order', () => {
		const root = rust.parse('use x;\nuse y;\n');
		expect(root.$with.statements(...root.statements()).$render()).toBe('use x;\nuse y;\n');
	});

	it('takes the seat when a removed item sat between two kept ones', () => {
		const root = rust.parse('use x;\nfn f() {}\nuse y;\n');
		const [x, , y] = root.statements();
		expect(root.$with.statements(x!, y!).$render()).toBe('use x;\n\nuse y;\n');
	});

	it('takes the seat before an item whose trailing trivia was written when the item before it was removed', () => {
		const root = rust.parse('use x;\nfn f() {}\nuse y;\n');
		const [x, , y] = root.statements();
		if (y === undefined || typeof y === 'number') throw new Error('expected a parsed statement');
		expect(root.$with.statements(x!, y.$trivia.trailing('// t')).$render()).toBe('use x;\n\nuse y;\n// t\n');
	});

	it('takes the seat after an item whose leading trivia was written when it is no longer last', () => {
		const root = rust.parse('use x;\nuse y;\n\n\n\n');
		const [x, y] = root.statements();
		if (y === undefined || typeof y === 'number') throw new Error('expected a parsed statement');
		expect(root.$with.statements(y.$trivia.leading('// c'), x!).$render()).toBe('// c\nuse y;\n\nuse x;\n');
	});

	it('takes the seat before a kept comment when the item before it was removed', () => {
		const root = rust.parse('use x;\nfn f() {}\n\n// c\nuse y;\n');
		const [x, , y] = root.statements();
		expect(root.$with.statements(x!, y!).$render()).toBe('use x;\n\n// c\nuse y;\n');
	});

	it('gives an inserted attribute its own seat before the item it now leads', () => {
		const root = rust.parse('use x;\n\nfn f() {}\n\nfn g() {}\n');
		const [x, f, g] = root.statements();
		const inline = rust.parse('#[inline]\nfn h() {}\n').statements()[0];
		expect(root.$with.statements(x!, inline!, f!, g!).$render()).toBe('use x;\n\n#[inline]\nfn f() {}\n\nfn g() {}\n');
	});

	it('keeps the source gap before an edited item whose neighbour is unchanged', () => {
		const root = python.parse('import x\ndef f():\n    pass\n');
		const [x, f] = root.statements();
		if (f === undefined || typeof f === 'number' || !python.is.functionDefinition(f)) throw new Error('expected a function definition');
		expect(root.$with.statements(x!, f.$with.name(python.build.identifier('g'))).$render()).toBe('import x\ndef g():\n    pass\n');
	});

	it('keeps a tight same-line gap beside an edited item', () => {
		const item = rust.parse('fn f(a: u8,b: i8) {}\n').statements()[0];
		if (item === undefined || typeof item === 'number' || !rust.is.functionItem(item)) throw new Error('expected a function item');
		const parameters = item.parameters();
		const list = parameters.elements();
		if (list === undefined) throw new Error('expected parameters');
		const [first, second] = list.items();
		const a = first?.content();
		const b = second?.content();
		if (a === undefined || typeof a === 'number' || !rust.is.parameter(a)) throw new Error('expected a parameter');
		if (b === undefined || typeof b === 'number' || !rust.is.parameter(b)) throw new Error('expected a parameter');
		const edited = b.$with.type(a.type()) as typeof b;
		expect(parameters.$with.elements(a, edited).$render()).toBe('(a: u8,b: u8)');
	});

	it('python: takes the seat when a removed statement sat between two kept ones', () => {
		const root = python.parse('a = 1\nb = 2\nc = 3\n');
		const [a, , c] = root.statements();
		expect(root.$with.statements(a!, c!).$render()).toBe('a = 1\nc = 3\n');
	});
});

/** The first node in `root` a guard accepts, reached through each slot's reader. */
function firstWhere<T>(root: unknown, accepts: (value: unknown) => value is T): T {
	const seen = new Set<object>();
	const camel = (slot: string) => slot.replace(/^_/, '').replace(/_([a-z0-9])/g, (_, letter: string) => letter.toUpperCase());
	const queue: unknown[] = [root];
	while (queue.length > 0) {
		const node = queue.shift();
		if (node === null || typeof node !== 'object' || seen.has(node)) continue;
		seen.add(node);
		if (accepts(node)) return node;
		if (Array.isArray(node)) {
			queue.push(...node);
			continue;
		}
		const record = node as Record<string, unknown>;
		for (const key of Object.keys(record)) {
			if (!key.startsWith('_') || record[key] == null) continue;
			const reader = record[camel(key)];
			queue.push(typeof reader === 'function' ? (reader as () => unknown).call(node) : record[key]);
		}
	}
	throw new Error('no node the guard accepts');
}

// A rebuilt list's trailing delimiter is canonical: the list builder writes its
// default delimiter into every list it mints, and that value wins over the source.
describe('a rebuilt list keeps the flanks its source edge items still stand beside', () => {
	const broken = 'add(\n    1i32,\n    2i32,\n);\n';

	it('rebuilds a call\'s arguments with their source items in their source layout, but a canonical trailing delimiter', () => {
		const args = firstWhere(rust.parse(broken), (value): value is ReturnType<typeof rust.build.arguments> => rust.is.arguments(value as never));
		const items = args.elements()?.items().map((item) => item.expression());
		if (items === undefined) throw new Error('expected arguments');
		expect(args.$with.elements(...items).$render()).toBe('(\n    1i32,\n    2i32\n)');
	});

	it('keeps the leading flank and the source gaps when an item is appended; the new gap and the closing flank are canonical', () => {
		const args = firstWhere(rust.parse(broken), (value): value is ReturnType<typeof rust.build.arguments> => rust.is.arguments(value as never));
		const items = args.elements()?.items().map((item) => item.expression());
		if (items === undefined) throw new Error('expected arguments');
		const appended = firstWhere(rust.parse('add(3i32);\n'), (value): value is ReturnType<typeof rust.build.arguments> => rust.is.arguments(value as never))
			.elements()
			?.items()[0]
			?.expression();
		if (appended === undefined) throw new Error('expected an argument');
		expect(args.$with.elements(...items, appended).$render()).toBe('(\n    1i32,\n    2i32, 3i32\n)');
	});

	it('drops the source blank line before a wrapped item once another item is inserted before it', () => {
		const item = rust.parse('fn f(\n    a: u8,\n\n    b: i8,\n) {}\n').statements()[0];
		if (item === undefined || typeof item === 'number' || !rust.is.functionItem(item)) throw new Error('expected a function item');
		const parameters = item.parameters();
		const [first, second] = parameters.elements()?.items() ?? [];
		const a = first?.content();
		const b = second?.content();
		if (a === undefined || typeof a === 'number' || !rust.is.parameter(a)) throw new Error('expected a parameter');
		if (b === undefined || typeof b === 'number' || !rust.is.parameter(b)) throw new Error('expected a parameter');
		const other = rust.parse('fn g(c: u16) {}\n').statements()[0];
		if (other === undefined || typeof other === 'number' || !rust.is.functionItem(other)) throw new Error('expected a function item');
		const c = other.parameters().elements()?.items()[0]?.content();
		if (c === undefined || typeof c === 'number' || !rust.is.parameter(c)) throw new Error('expected a parameter');
		expect(parameters.$with.elements(a, c, b).$render()).toBe('(\n    a: u8, c: u16, b: i8\n)');
	});

	it('keeps both flanks beside an edited last parameter', () => {
		const item = rust.parse('fn f(\n    a: u8,\n    b: i8,\n) {}\n').statements()[0];
		if (item === undefined || typeof item === 'number' || !rust.is.functionItem(item)) throw new Error('expected a function item');
		const parameters = item.parameters();
		const [first, second] = parameters.elements()?.items() ?? [];
		const a = first?.content();
		const b = second?.content();
		if (a === undefined || typeof a === 'number' || !rust.is.parameter(a)) throw new Error('expected a parameter');
		if (b === undefined || typeof b === 'number' || !rust.is.parameter(b)) throw new Error('expected a parameter');
		const edited = b.$with.type(a.type()) as typeof b;
		expect(parameters.$with.elements(a, edited).$render()).toBe('(\n    a: u8,\n    b: u8\n)');
	});
});
