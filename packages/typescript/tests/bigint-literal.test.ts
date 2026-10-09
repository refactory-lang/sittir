// A bigint literal is one token per radix: `ir.number.bigint` is a nested
// supertype whose arms name the radix, with decimal the default. Its digits
// and its `n` render with no space between them, and each arm reparses as its
// own kind.
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);
const tsNative = (await typescript.load()).createNative();

function textsOf(kind: number, source: string, value: unknown, out: string[] = []): string[] {
	if (Array.isArray(value)) for (const item of value) textsOf(kind, source, item, out);
	else if (value !== null && typeof value === 'object') {
		const node = value as { $type?: unknown; $_layout?: { at?: { $span: { start: number; end: number } } } };
		const at = node.$_layout?.at;
		if (node.$type === kind && at !== undefined) out.push(source.slice(at.$span.start, at.$span.end));
		for (const child of Object.values(value)) textsOf(kind, source, child, out);
	}
	return out;
}

type Arm = (digits: string) => { $render(): string };

const RADIX_ARMS = [
	['decimal', ts.build.number.bigint.decimal as Arm, '42', '42n', ts.kinds.NumberBigintDecimal],
	['hex', ts.build.number.bigint.hex as Arm, '0x2A', '0x2An', ts.kinds.NumberBigintHex],
	['binary', ts.build.number.bigint.binary as Arm, '0b101010', '0b101010n', ts.kinds.NumberBigintBinary],
	['octal', ts.build.number.bigint.octal as Arm, '0o52', '0o52n', ts.kinds.NumberBigintOctal]
] as const;

describe('a bigint literal', () => {
	it.each(RADIX_ARMS)('the %s arm renders its text with the n suffix', (_, arm, digits, text) => {
		expect(arm(digits).$render()).toBe(text);
	});

	it('writes a bigint value in the radix its arm names', () => {
		expect(ts.build.number.bigint.decimal(42n).$render()).toBe('42n');
		expect(ts.build.number.bigint.hex(42n).$render()).toBe('0x2an');
		expect(ts.build.number.bigint.binary(42n).$render()).toBe('0b101010n');
		expect(ts.build.number.bigint.octal(42n).$render()).toBe('0o52n');
	});

	it('resolves an unnamed call through the decimal default, under every mount path', () => {
		expect(ts.build.number.bigint(42n).$render()).toBe('42n');
		expect(ts.build.number.bigint('42').$render()).toBe('42n');
		expect(ts.build.numberBigint(42n).$render()).toBe('42n');
		expect(ts.build.literalType.bigint(42n).$render()).toBe('42n');
		expect(ts.build.primaryType.literal.bigint(42n).$render()).toBe('42n');
		expect(ts.build.primaryExpression.number.bigint(42n).$render()).toBe('42n');
		expect(ts.build.literalType.bigint.hex(42n).$render()).toBe('0x2an');
	});

	it('refuses prefixed text through the decimal default: the radix is chosen by arm, not read from the text', () => {
		expect(() => ts.build.number.bigint('0x2A')).toThrow(/number_bigint_decimal\.content: text does not match pattern/);
	});

	it.each(RADIX_ARMS)('the %s arm reparses as its own kind', (_, arm, digits, text, kind) => {
		const source = `const x = ${arm(digits).$render()};`;
		const root = tsNative.parseAndRead(source, { depth: Infinity }).root;
		expect(textsOf(kind, source, root)).toEqual([text]);
	});
});
