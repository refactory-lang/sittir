import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);
const adopting = await createEngine(typescript);

function leadLastStatementOfFirstBody(root: ReturnType<typeof ts.parse>): void {
	const [loop] = root.statements();
	if (loop === undefined || typeof loop === 'number' || !('body' in loop)) throw new Error('expected a loop');
	const body = (loop as { body(): { statements(): readonly unknown[] } }).body();
	const last = body.statements().at(-1);
	if (last === undefined || typeof last === 'number') throw new Error('expected a statement');
	(last as { $trivia: { leading(text: string): unknown } }).$trivia.leading('// lead');
}

describe('a comment between two of its owner tokens, with no named child beside it, goes to the nearest child', () => {
	it.each(['object', 'arena'] as const)('keeps it through an edit inside its owner and through a snapshot, joined to the child it leads as a built side joins (%s storage)', async (nodeStorage) => {
		using engine = await createEngine(typescript, { nodeStorage });
		const root = engine.parse('for /* keep */ (;;) { x(); }\n');
		expect(engine.render(root.$snapshot()).toString()).toBe('for ( /* keep */ ;;) {\n  x();\n}\n');
		leadLastStatementOfFirstBody(root);
		expect(root.$render()).toBe('for /* keep */ (;;) { // lead\n  x(); }\n');
	});

	it.each(['object', 'arena'] as const)("drops the source line break beside it once it sits between other tokens, as the options write it there (%s storage)", async (nodeStorage) => {
		using engine = await createEngine(typescript, { nodeStorage });
		expect(engine.render(engine.parse('for /* keep */\n(;;) {}\n').$snapshot()).toString()).toBe('for ( /* keep */;;) {}\n');
	});

	it.each(['object', 'arena'] as const)('keeps the source gap beside it while it sits between the same two tokens (%s storage)', async (nodeStorage) => {
		using engine = await createEngine(typescript, { nodeStorage });
		const root = engine.parse('for (/* keep */ ;;) { x(); }\n');
		expect(engine.render(root.$snapshot()).toString()).toBe('for (/* keep */ ;;) {\n  x();\n}\n');
	});

	it('trails the last item of a list when it sits after the trailing separator', () => {
		const root = ts.parse('const a = [1, 2, /* tail */];\n');
		expect(ts.render(root.$snapshot()).toString()).toBe('const a = [1, 2 /* tail */,];\n');
	});
});

describe("a unit child's comment renders once and follows the unit through a list edit", () => {
	it('frames a unit once when a side is written beside it', () => {
		const root = ts.parse('while (a) { /* c */ ; x(); }\n');
		leadLastStatementOfFirstBody(root);
		expect(root.$render()).toBe('while (a) { /* c */ ; // lead\n  x(); }\n');
	});

	const source = '// A\n;\n// B\ndebugger;\n';
	const parsed = () => {
		const root = ts.parse(source);
		return { root, statements: root.statements() };
	};

	it('keeps it on the unit when an item is inserted before it', () => {
		const { root, statements } = parsed();
		expect(root.$with.statements(ts.build.expressionStatement(ts.build.identifier('z')), ...statements).$render()).toBe('z;\n// A\n;\n// B\ndebugger;\n');
	});

	it('drops it with the unit when the unit is removed', () => {
		const { root, statements } = parsed();
		expect(root.$with.statements(...statements.slice(1)).$render()).toBe('// B\ndebugger;\n');
	});

	it('moves it with the unit when the items are reordered', () => {
		const { root, statements } = parsed();
		expect(root.$with.statements(...[...statements].reverse()).$render()).toBe('// B\ndebugger;\n// A\n;\n');
	});

	it('keeps the comments of identical units by position', () => {
		const root = ts.parse('// A\n;\n// B\n;\n');
		expect(root.$with.statements(...root.statements().slice(1)).$render()).toBe('// A\n;\n');
	});
});

describe('unit items keep their own comments in an array', () => {
	function arrayOf(source: string) {
		const root = ts.parse(source);
		const [statement] = root.statements();
		if (statement === undefined || typeof statement === 'number' || !ts.is.expressionStatement(statement)) throw new Error('expected an expression statement');
		const array = statement.expression();
		if (!ts.is.array(array)) throw new Error('expected an array');
		return { root, array };
	}

	it('swaps two different units with their comments', () => {
		const { array } = arrayOf('[/* A */ true, /* B */ false];\n');
		const elements = array.elements().filter((element) => element !== undefined);
		expect(array.$with.elements(...elements.reverse()).$render()).toBe('[ /* B */ false, /* A */ true]');
	});

	it('counts the holes of a sparse array, at its start and between items', () => {
		for (const [source, rebuilt] of [
			['[, /* A */ null, /* B */ true];\n', '[, /* A */ null, /* B */ true]'],
			['[/* A */ null, , /* B */ true];\n', '[/* A */ null,, /* B */ true]']
		] as const) {
			const { root, array } = arrayOf(source);
			expect(array.$with.elements(...array.elements()).$render()).toBe(rebuilt);
			expect(ts.render(root.$snapshot()).toString()).toBe(`${rebuilt};\n`);
		}
	});
});

describe('a list edit carries its units through a reversal', () => {
	it('carries a unit comment through the reversal of a list', () => {
		const count = 200;
		const root = ts.parse(`// A\n;\n${Array.from({ length: count }, (_, i) => `x${i}();`).join('\n')}\n`);
		const reversed = root.$with.statements(...[...root.statements()].reverse()).$render();
		expect(reversed.startsWith(`x${count - 1}();\n`)).toBe(true);
		expect(reversed.endsWith('x0();\n// A\n;\n')).toBe(true);
	});
});

describe('an empty container whose inside is only layout takes its first child', () => {
	function bodyOf(source: string) {
		const [fn] = ts.parse(source).statements();
		if (fn === undefined || typeof fn === 'number' || !ts.is.functionDeclaration(fn)) throw new Error('expected a function');
		return { fn, body: fn.body() };
	}
	const x = () => ts.build.expressionStatement(ts.build.identifier('x'));

	it('drops the layout of an empty block written across lines', () => {
		for (const source of ['function f() {\n}\n', 'function f() {\n\n}\n']) {
			const { fn, body } = bodyOf(source);
			expect(fn.$with.body(body.$with.statements(x())).$render()).toBe('function f() {\n  x;\n}\n');
		}
	});

	it('still refuses a block whose inside holds a comment', () => {
		const { body } = bodyOf('function f() {\n  // c\n}\n');
		expect(() => body.$with.statements(x())).toThrow(/holds inner comments/);
	});

	it('gives a program of blank lines its first statement, in the adopted style', () => {
		const statement = adopting.build.expressionStatement(adopting.build.identifier('x'));
		expect(adopting.parse('\n', { adoptStyle: true }).$with.statements(statement).$render()).toBe('\nx;\n');
	});
});

describe("a snapshot of a rebuilt node names no tree, its units' sides included", () => {
	it('renders after the tree it was read from is released', () => {
		// A collection can only be forced under `--expose-gc`, so the case runs
		// in a child process that reports the snapshot and its render.
		const fixture = fileURLToPath(new URL('../../common/tests/fixtures/unit-snapshot-release.mts', import.meta.url));
		const out = execFileSync(process.execPath, ['--expose-gc', '--import', 'tsx', fixture], {
			cwd: fileURLToPath(new URL('..', import.meta.url)),
			encoding: 'utf8',
			env: { ...process.env, SITTIR_BACKEND: 'native' }
		});
		expect(JSON.parse(out.trim().split('\n').at(-1) ?? '')).toEqual({ coordinate: false, comment: true, same: true });
	}, 60_000);
});

