// A supertype nested under another supertype's arm surfaces the way a nested
// polymorph does: calling the parent resolves through each level's default
// arm, and every nested arm is reachable by name under each mount path.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';
import { ir } from '../src/ir.js';
import { TSKindId } from '../src/types.js';

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
		expect(ir.integer('3').$render()).toBe('3');
		expect(ir.integer(3).$render()).toBe('3');
		expect(ir.integer.decimal('3').$render()).toBe('3');
		expect(ir.integer.decimal.plain('3').$render()).toBe('3');
		expect(ir.integerDecimal('3').$render()).toBe('3');
	});

	it('reaches each nested arm by name, under every mount path', () => {
		expect(ir.integer.decimal.long('3L').$render()).toBe('3L');
		expect(ir.integer.decimal.imaginary('3j').$render()).toBe('3j');
		expect(ir.primaryExpression.integer.decimal.long('3L').$render()).toBe('3L');
		expect(ir.primaryExpression.integer('3').$render()).toBe('3');
	});

	it('requires each suffixed arm to carry its suffix', () => {
		expect(() => ir.integer.decimal.long('3')).toThrow(/integer_decimal_long: text does not match pattern/);
		expect(() => ir.integer.decimal.imaginary('3')).toThrow(/integer_decimal_imaginary: text does not match pattern/);
	});

	it('reads each arm back as its own kind', () => {
		const engine = createEngine();
		const root = engine.diagnostics.parseAndRead('x = 3\ny = 3L\nz = 3j\n', { deep: true }).root;
		expect(kindsOf(TSKindId.IntegerDecimalPlain, root)).toEqual(['3']);
		expect(kindsOf(TSKindId.IntegerDecimalLong, root)).toEqual(['3L']);
		expect(kindsOf(TSKindId.IntegerDecimalImaginary, root)).toEqual(['3j']);
	});
});
