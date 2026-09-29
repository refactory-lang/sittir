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
			const items = order === 'reversed' ? [fn!, use!] : order === 'parsed-built' ? [use!, built] : [built, use!];
			return root.$with.statements(...items).$render();
		},
		expected: { reversed: 'fn f() {}\n\nuse x;', 'parsed-built': 'use x;\n\nfn g() {}', 'built-parsed': 'fn g() {}\n\nuse x;' }
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
			const items = order === 'reversed' ? [fn!, imp!] : order === 'parsed-built' ? [imp!, built] : [built, imp!];
			return root.$with.statements(...items).$render();
		},
		expected: {
			reversed: 'function f() {}\n\nimport x from "x";',
			'parsed-built': 'import x from "x";\n\nfunction g() {}',
			'built-parsed': 'function g() {}\n\nimport x from "x";'
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
				body: python.build.block(python.build.passStatement())
			});
			const items = order === 'reversed' ? [fn!, imp!] : order === 'parsed-built' ? [imp!, built] : [built, imp!];
			return root.$with.statements(...items).$render();
		},
		expected: {
			reversed: 'def f():\n    pass\n\n\nimport x',
			'parsed-built': 'import x\ndef g():\n    pass\n',
			'built-parsed': 'def g():\n    pass\n\n\nimport x'
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
		expect(root.$with.statements(b!, a!).$render()).toBe('b = 2\na = 1');
	});

	it('python: a held line end keeps the wider source gap after it', () => {
		const root = python.parse('a = 1\n\n\nb = 2\n');
		expect(root.$with.statements(...root.statements()).$render()).toBe('a = 1\n\n\nb = 2');
	});

	it('keeps the source gap when the items keep their source order', () => {
		const root = rust.parse('use x;\nuse y;\n');
		expect(root.$with.statements(...root.statements()).$render()).toBe('use x;\nuse y;');
	});

	it('takes the seat when a removed item sat between two kept ones', () => {
		const root = rust.parse('use x;\nfn f() {}\nuse y;\n');
		const [x, , y] = root.statements();
		expect(root.$with.statements(x!, y!).$render()).toBe('use x;\n\nuse y;');
	});

	it('python: takes the seat when a removed statement sat between two kept ones', () => {
		const root = python.parse('a = 1\nb = 2\nc = 3\n');
		const [a, , c] = root.statements();
		expect(root.$with.statements(a!, c!).$render()).toBe('a = 1\nc = 3');
	});
});
