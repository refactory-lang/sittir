import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { ERROR_KIND_ID } from '@sittir/common/error-kind';
import { isErrorNode } from '@sittir/common/utils';
import python from '../../python/src/index.ts';
import rust from '../../rust/src/index.ts';
import typescript from '../../typescript/src/index.ts';

const py = await createEngine(python);
const ts = await createEngine(typescript);
const rs = await createEngine(rust);
const storages = { arena: await createEngine(rust, { nodeStorage: 'arena' }), object: await createEngine(rust, { nodeStorage: 'object' }) };

describe('an ERROR region keeps the source bytes beside it wherever its owner renders from its template', () => {
	it.each(['x = a ?b\n', 'x = a?b\n', 'x = a ? b\n', 'x = 1abc\n'])('python %j snapshots to its source', (source) => {
		const root = py.parse(source);
		expect(root.$errors.length).toBeGreaterThan(0);
		expect(py.render(root.$snapshot()).toString()).toBe(source);
	});

	it.each(['let x = 1 + ;\n', 'let x = 1 +;\n', 'let x = a @@ b;\n', 'let x = 1abc;\n'])('typescript %j snapshots to its source', (source) => {
		const root = ts.parse(source);
		expect(root.$errors.length).toBeGreaterThan(0);
		expect(ts.render(root.$snapshot()).toString()).toBe(source);
	});

	it.each(['fn f() {} @@ fn g() {}\n', 'fn f() { a b c; }\n'])('rust %j writes no in-line run where the render breaks the line beside the region', (source) => {
		const out = rs.render(rs.parse(source).$snapshot()).toString();
		expect(out).not.toMatch(/[ \t]\n/);
		for (const line of out.split('\n')) expect((line.length - line.trimStart().length) % 4).toBe(0);
	});

	it('reads an ERROR entry as its own text, with the runs beside it on its line as $before and $after', () => {
		const [first] = rs.parse('fn f() {} @@ fn g() {}').statements();
		if (first === undefined || !rs.is.functionItem(first)) throw new Error('expected a function item');
		const [entry] = first.$trivia.trailing();
		if (!isErrorNode(entry)) throw new Error('expected an ERROR entry');
		expect([entry.$text(), entry.$before, entry.$after]).toEqual(['@@', ' ', ' ']);
		expect(rs.render(entry as never).toString()).toBe('@@');
	});

	it('gives a snapshot ERROR entry an empty $after where it touches the token after it', () => {
		const errors: Record<string, unknown>[] = [];
		const collect = (value: unknown): void => {
			if (Array.isArray(value)) value.forEach(collect);
			else if (value !== null && typeof value === 'object') {
				const entry = value as { $type?: unknown; $text?: unknown; $before?: unknown; $after?: unknown };
				if (entry.$type === ERROR_KIND_ID) errors.push({ $text: entry.$text, $before: entry.$before, $after: entry.$after });
				Object.values(value).forEach(collect);
			}
		};
		collect(py.parse('x = a ?b\n').$snapshot());
		expect(errors).toEqual([{ $text: 'a ?', $before: ' ', $after: '' }]);
	});

	it('renders an edited typescript declaration with the space before its ERROR region', () => {
		const [declaration] = ts.parse('let x = 1 + ;\n').statements();
		if (declaration === undefined || typeof declaration === 'number' || !ts.is.lexicalDeclaration(declaration)) throw new Error('expected a lexical declaration');
		expect(declaration.$with.declarators(...declaration.declarators()).$render()).toBe('let x = 1 + ;');
	});
});

describe.each(['arena', 'object'] as const)('a whitespace entry written beside an ERROR renders, in %s storage', (storage) => {
	const engine = storages[storage];
	const { Newline: newline, Space: space } = engine.kinds;
	const statements = (root: ReturnType<typeof engine.parse>) => {
		const item = root.statements()[0];
		if (item === undefined || !engine.is.functionItem(item)) throw new Error('expected a function item');
		return [...item.body().statements()];
	};
	const items = (root: ReturnType<typeof engine.parse>) => {
		const [declaration] = statements(root);
		if (declaration === undefined || !engine.is.letDeclaration(declaration)) throw new Error('expected a let declaration');
		const array = declaration.value();
		if (array === undefined || !engine.is.arrayExpressionList(array)) throw new Error('expected an array of items');
		return array.elements()?.items() ?? [];
	};

	it.each([
		['a line break where the source keeps the line', 'fn f() {\n    let a = 1; $ let b = 2;\n}\n', 'fn f() {\n    let a = 1; $\n    let b = 2;\n}\n', newline],
		['a space where the source breaks the line', 'fn f() {\n    let a = 1; $\n    let b = 2;\n}\n', 'fn f() {\n    let a = 1; $ let b = 2;\n}\n', space]
	] as const)('renders %s after it, written on the next statement', (_, source, expected, entry) => {
		const root = engine.parse(source);
		const [, next] = statements(root);
		if (next === undefined || typeof next === 'number') throw new Error('expected a second statement');
		next.$trivia.leading(entry);
		expect(engine.render(root).toString()).toBe(expected);
	});

	it.each([
		['a line break where the source keeps the line', 'fn f() {\n    let x = [\n        1,\n        2, $ 3,\n        4,\n    ];\n}\n', 'fn f() {\n    let x = [\n        1,\n        2, $\n        3,\n        4,\n    ];\n}\n', newline],
		['a space where the source breaks the line', 'fn f() {\n    let x = [\n        1,\n        2, $\n        3,\n        4,\n    ];\n}\n', 'fn f() {\n    let x = [\n        1,\n        2, $ 3,\n        4,\n    ];\n}\n', space]
	] as const)('renders %s after it in a list separator gap, written beside the ERROR on the next item', (_, source, expected, entry) => {
		const root = engine.parse(source);
		const next = items(root)[2];
		if (next === undefined || typeof next === 'number') throw new Error('expected a third item');
		const [error] = next.$trivia.leading();
		if (!isErrorNode(error)) throw new Error('expected the ERROR on the item');
		next.$trivia.leading(error, entry);
		expect(engine.render(root).toString()).toBe(expected);
	});
});
