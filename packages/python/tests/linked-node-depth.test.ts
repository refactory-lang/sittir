import { createEngine } from '@sittir/common';
import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a parsed node placed in a rebuilt holder, in %s storage', (nodeStorage) => {
	it('closes the indent its holder opened, under a built holder and an edited parsed one in one render', async () => {
		using engine = await createEngine(python, { nodeStorage });
		const py = engine as any;
		const root = py.parse('if a:\n    b\n    c\nd\n');
		const parsed = root.statements()[0];
		const block = parsed.consequence();
		const built = py.build.ifStatement({ condition: py.build.identifier('x'), consequence: block });
		const edited = parsed.$with.condition(py.build.identifier('y'));
		const rebuilt = py.build.module({ statements: [built, edited, root.statements()[1]] });
		expect(String(py.render(rebuilt))).toBe('if x:\n    b\n    c\nif y:\n    b\n    c\nd\n');
	});

	it('closes the indent of a block linked from a nested holder', async () => {
		using engine = await createEngine(python, { nodeStorage });
		const py = engine as any;
		const root = py.parse('if a:\n    if b:\n        c\nd\n');
		const inner = root.statements()[0].consequence().block()[0];
		const built = py.build.ifStatement({ condition: py.build.identifier('x'), consequence: inner.consequence() });
		expect(String(py.render(py.build.module({ statements: [built, root.statements()[1]] })))).toBe('if x:\n    c\nd\n');
	});

	it('keeps a side entry whose neighbour changed', async () => {
		using engine = await createEngine(python, { nodeStorage });
		const py = engine as any;
		const root = py.parse('x\n# before y\ny  # after y\nz\n');
		const [x, y, z] = root.statements();
		expect(String(py.render(root.$with.statements(x, py.parse('new\n').statements()[0], y, z)))).toBe('x\nnew\n# before y\ny  # after y\nz\n');
	});

	it('keeps the side entries of the items at a list edge when they move', async () => {
		using engine = await createEngine(python, { nodeStorage });
		const py = engine as any;
		const root = py.parse('# first\nx\ny\n# last\nz  # tail\n');
		expect(String(py.render(root.$with.statements(...[...root.statements()].reverse())))).toBe('# last\nz  # tail\ny\n# first\nx\n');
	});
});
