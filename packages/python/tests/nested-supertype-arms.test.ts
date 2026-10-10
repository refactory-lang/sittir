// A supertype nested under another supertype's arm surfaces the way a nested
// polymorph does: calling the parent resolves through each level's default
// arm, and every nested arm is reachable by name under each mount path.
import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);
const pyNative = (await python.load()).createNative();

function kindsOf(kind: number, value: unknown, out: string[] = []): string[] {
	if (Array.isArray(value)) for (const item of value) kindsOf(kind, item, out);
	else if (value !== null && typeof value === 'object') {
		const node = value as { $type?: unknown; $text?: unknown };
		if (node.$type === kind && typeof node.$text === 'string') out.push(node.$text);
		for (const child of Object.values(value)) kindsOf(kind, child, out);
	}
	return out;
}

describe('the nested integer decimal supertype', () => {
	it('resolves an unnamed call through integer, then integer.decimal, to the plain arm', () => {
		expect(py.build.integer('3').$render()).toBe('3');
		expect(py.build.integer(3).$render()).toBe('3');
		expect(py.build.integer.decimal('3').$render()).toBe('3');
		expect(py.build.integer.decimal.plain('3').$render()).toBe('3');
		expect(py.build.integerDecimal('3').$render()).toBe('3');
	});

	it('reaches each nested arm by name, under every mount path', () => {
		expect(py.build.integer.decimal.long('3L').$render()).toBe('3L');
		expect(py.build.integer.decimal.imaginary('3j').$render()).toBe('3j');
		expect(py.build.primaryExpression.integer.decimal.long('3L').$render()).toBe('3L');
		expect(py.build.primaryExpression.integer('3').$render()).toBe('3');
	});

	it('requires each suffixed arm to carry its suffix', () => {
		expect(() => py.build.integer.decimal.long('3')).toThrow(/integer_decimal_long: text does not match pattern/);
		expect(() => py.build.integer.decimal.imaginary('3')).toThrow(/integer_decimal_imaginary: text does not match pattern/);
	});

	it('reads each arm back as its own kind', () => {
		const root = pyNative.parseAndRead('x = 3\ny = 3L\nz = 3j\n', { depth: Infinity }).root;
		expect(kindsOf(py.kinds.IntegerDecimalPlain, root)).toEqual(['3']);
		expect(kindsOf(py.kinds.IntegerDecimalLong, root)).toEqual(['3L']);
		expect(kindsOf(py.kinds.IntegerDecimalImaginary, root)).toEqual(['3j']);
	});
});
