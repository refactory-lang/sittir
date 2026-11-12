// A supertype nested under another supertype's arm surfaces the way a nested
// polymorph does: calling the parent resolves through each level's default
// arm, and every nested arm is reachable by name under each mount path.
import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);
const pyNative = (await python.load()).createNative({ nodeStorage: 'object' });

type Read = { $type?: unknown; $_layout?: { at?: { $span?: { start: number; end: number } } } };

function kindsOf(source: string, kind: number, value: unknown, out: string[] = []): string[] {
	if (Array.isArray(value)) for (const item of value) kindsOf(source, kind, item, out);
	else if (value !== null && typeof value === 'object') {
		const span = (value as Read).$_layout?.at?.$span;
		if ((value as Read).$type === kind && span !== undefined) out.push(source.slice(span.start, span.end));
		for (const [key, child] of Object.entries(value)) if (key !== '$_layout') kindsOf(source, kind, child, out);
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

	it('spells the long arm\'s marker by its preference when the text leaves it out, and requires the imaginary arm\'s j', () => {
		expect(py.build.integer.decimal.long('3').$render()).toBe('3L');
		expect(py.build.integer.decimal.long('3l').$render()).toBe('3l');
		expect(() => py.build.integer.decimal.imaginary('3')).toThrow(/integer_decimal_imaginary: text does not match pattern/);
	});

	it('reads each arm back as its own kind', () => {
		const source = 'x = 3\ny = 3L\nz = 3j\n';
		const root = pyNative.parseAndRead(source, { depth: Infinity }).root;
		expect(kindsOf(source, py.kinds.IntegerDecimalPlain, root)).toEqual(['3']);
		expect(kindsOf(source, py.kinds.IntegerDecimalLong, root)).toEqual(['3L']);
		expect(kindsOf(source, py.kinds.IntegerDecimalImaginary, root)).toEqual(['3j']);
	});
});
