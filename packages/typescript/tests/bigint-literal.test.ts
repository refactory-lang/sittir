// A bigint literal is one token per radix: `ir.number.bigint` is a nested
// supertype whose arms name the radix, with decimal the default. Its digits
// and its `n` render with no space between them, and each arm reparses as its
// own kind.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';
import { ir } from '../src/ir.js';
import { TSKindId } from '../src/types.js';

function textsOf(kind: number, value: unknown, out: string[] = []): string[] {
	if (Array.isArray(value)) for (const item of value) textsOf(kind, item, out);
	else if (value !== null && typeof value === 'object') {
		const node = value as { $type?: unknown; $text?: unknown };
		if (node.$type === kind && typeof node.$text === 'string') out.push(node.$text);
		for (const child of Object.values(value)) textsOf(kind, child, out);
	}
	return out;
}

const RADIX_ARMS = [
	['decimal', ir.number.bigint.decimal, '42', '42n', TSKindId.NumberBigintDecimal],
	['hex', ir.number.bigint.hex, '0x2A', '0x2An', TSKindId.NumberBigintHex],
	['binary', ir.number.bigint.binary, '0b101010', '0b101010n', TSKindId.NumberBigintBinary],
	['octal', ir.number.bigint.octal, '0o52', '0o52n', TSKindId.NumberBigintOctal]
] as const;

describe('a bigint literal', () => {
	it.each(RADIX_ARMS)('the %s arm renders its text with the n suffix', (_, arm, digits, text) => {
		expect(arm(digits).$render()).toBe(text);
	});

	it('writes a bigint value in the radix its arm names', () => {
		expect(ir.number.bigint.decimal(42n).$render()).toBe('42n');
		expect(ir.number.bigint.hex(42n).$render()).toBe('0x2an');
		expect(ir.number.bigint.binary(42n).$render()).toBe('0b101010n');
		expect(ir.number.bigint.octal(42n).$render()).toBe('0o52n');
	});

	it('resolves an unnamed call through the decimal default, under every mount path', () => {
		expect(ir.number.bigint(42n).$render()).toBe('42n');
		expect(ir.number.bigint('42').$render()).toBe('42n');
		expect(ir.numberBigint(42n).$render()).toBe('42n');
		expect(ir.literalType.bigint(42n).$render()).toBe('42n');
		expect(ir.primaryType.literal.bigint(42n).$render()).toBe('42n');
		expect(ir.primaryExpression.number.bigint(42n).$render()).toBe('42n');
		expect(ir.propertyName.number.bigint(42n).$render()).toBe('42n');
		expect(ir.literalType.bigint.hex(42n).$render()).toBe('0x2an');
	});

	it('refuses prefixed text through the decimal default: the radix is chosen by arm, not read from the text', () => {
		expect(() => ir.number.bigint('0x2A')).toThrow(/number_bigint_decimal\.content: text does not match pattern/);
	});

	it.each(RADIX_ARMS)('the %s arm reparses as its own kind', (_, arm, digits, text, kind) => {
		const engine = createEngine();
		const root = engine.diagnostics.parseAndRead(`const x = ${arm(digits).$render()};`, { deep: true }).root;
		expect(textsOf(kind, root)).toEqual([text]);
	});
});
