import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const engine = await createEngine(python);
const SOURCE = 'if a:\n  b\n    # four\n  c\n';

function blockOf(root: ReturnType<typeof engine.parse>) {
	const statement = root.statements()[0];
	if (statement === undefined || !engine.is.ifStatement(statement)) throw new Error('expected an if statement');
	const suite = statement.consequence();
	if (!engine.is.suiteBlock(suite)) throw new Error('expected an indented block');
	return suite.block();
}

describe("an outside write keeps the span's layout", () => {
	it('leading', () => {
		const block = blockOf(engine.parse(SOURCE));
		block.$trivia.leading('# lead');
		expect(block.$render()).toBe('# lead\nb\n  # four\nc');
	});

	it('trailing', () => {
		const block = blockOf(engine.parse(SOURCE));
		block.$trivia.trailing('# tail');
		expect(block.$render()).toBe('b\n  # four\nc\n# tail\n');
	});

	it("the whole tree renders the written entry and the reader's comment, and reparses clean", () => {
		const root = engine.parse(SOURCE);
		blockOf(root).$trivia.leading('# lead');
		const out = root.$render();
		expect(out).toBe('if a:\n    # lead\n    b\n      # four\n    c\n');
		expect(engine.parse(out).$errors).toEqual([]);
	});
});

describe("a folded slice keeps its inner layout at the column it lands on", () => {
	it('moved one level deeper', () => {
		const block = blockOf(engine.parse(SOURCE));
		const inner = engine.build.ifStatement({ condition: engine.build.identifier('y'), consequence: block });
		const outer = engine.build.ifStatement({ condition: engine.build.identifier('x'), consequence: engine.build.block(inner) });
		expect(outer.$render()).toBe('if x:\n    if y:\n        b\n          # four\n        c');
	});

	it('a line that starts inside a string keeps its bytes', () => {
		const root = engine.parse('if a:\n  s = """x\n  y"""\n  c\n');
		blockOf(root).$trivia.leading('# lead');
		const out = root.$render();
		expect(out).toBe('if a:\n    # lead\n    s = """x\n  y"""\n    c\n');
		expect(engine.parse(out).$errors).toEqual([]);
	});
});

describe("an unfolded node keeps its children's reader-placed outside trivia", () => {
	it('through the accessors: a comment between two root statements survives a write below the root', () => {
		const root = engine.parse('a = 1\n# mid\nb = 2\n');
		const first = root.statements()[0];
		if (first === undefined) throw new Error('expected a statement');
		first.$trivia.leading('# top');
		const out = root.$render();
		expect(out).toBe('# top\na = 1\n# mid\nb = 2\n');
		expect(engine.parse(out).$errors).toEqual([]);
	});
});
