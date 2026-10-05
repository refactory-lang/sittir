import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';
import python from '../src/index.ts';
import { is } from '../src/is.ts';

const py = await createEngine(python);
const rs = await createEngine(rust);

const SOURCE = 'class C:\n    def f(self):\n        pass\n\nclass D: pass\n';

const bodies = () =>
	py
		.parse(SOURCE)
		.statements()
		.flatMap((statement) => (py.is.classDefinition(statement) ? [statement.body()] : []));

describe('variant guards', () => {
	it('sit on the variant parent guard and narrow to one form', () => {
		const [block, inline] = bodies();
		expect(py.is.suite(block!)).toBe(true);
		expect(py.is.suite.block(block!)).toBe(true);
		expect(py.is.suite.inline(block!)).toBe(false);
		expect(py.is.suite.inline(inline!)).toBe(true);
		if (py.is.suite.block(block!)) expect(block.block().statements()).toHaveLength(1);
	});

	it('are on the package table too, without the language check', () => {
		expect(Object.keys(is.suite)).toEqual(['inline', 'block', 'empty']);
		expect(is.suite.block(py.kinds.SuiteBlock)).toBe(false);
		expect(is.suite.block({ $type: py.kinds.SuiteBlock })).toBe(true);
	});

	it('carry the engine language check', () => {
		const rustNode = { ...rs.parse('fn main() {}\n'), $type: py.kinds.SuiteBlock };
		expect(is.suite.block(rustNode)).toBe(true);
		expect(py.is.suite.block(rustNode)).toBe(false);
	});

	it('reach a nested variant parent through its own guard', () => {
		expect(is.integer.decimal).toBe(is.integerDecimal);
		const literal = py
			.parse('x = 10\n')
			.$query()
			.$descendants.find((node) => py.is.integer(node as { readonly $type: number }));
		expect(literal).toBeDefined();
		expect(py.is.integer.decimal(literal as { readonly $type: number })).toBe(true);
		expect(py.is.integer.decimal.plain(literal as { readonly $type: number })).toBe(true);
		expect(py.is.integer.hex(literal as { readonly $type: number })).toBe(false);
	});

	it('are frozen with their parent guard', () => {
		expect(Object.isFrozen(is.suite)).toBe(true);
		expect(Object.isFrozen(py.is.suite)).toBe(true);
	});
});
