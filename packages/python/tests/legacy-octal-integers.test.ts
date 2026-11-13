import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';
import python from '../src/index.ts';

type Read = { readonly $path: string; readonly [member: string]: unknown };
type Spanned = { readonly $type?: unknown; readonly $_layout?: { readonly at?: { readonly $span?: { readonly start: number; readonly end: number } } } };

const py = await sharedEngine(() => createEngine(python));
const native = (await python.load()).createNative({ nodeStorage: 'object' });
const runtime = await portableRuntime(await sharedEngine(() => createEngine(python, { api: 'strict' })));
const read = (source: string): Read => runtime.read(runtime.engine.parse(source)) as Read;
const value = (source: string): unknown => (((read(source).statements as readonly Read[])[0] as Read).content as Read).value;
const rendered = (structure: unknown): string => String(runtime.engine.render(runtime.build(structure as never) as never));

function kindsOf(source: string, kind: number, node: unknown, out: string[] = []): string[] {
	if (Array.isArray(node)) for (const item of node) kindsOf(source, kind, item, out);
	else if (node !== null && typeof node === 'object') {
		const span = (node as Spanned).$_layout?.at?.$span;
		if ((node as Spanned).$type === kind && span !== undefined) out.push(source.slice(span.start, span.end));
		for (const [key, child] of Object.entries(node)) if (key !== '$_layout') kindsOf(source, kind, child, out);
	}
	return out;
}

describe('legacy octal integers', () => {
	it('are an integer arm the parser lexes ahead of decimal, split into long and plain', () => {
		const grammar = JSON.parse(readFileSync(new URL('../.sittir/src/grammar.json', import.meta.url), 'utf8')) as {
			readonly rules: Record<string, { readonly members?: readonly { readonly name?: string }[] }>;
		};
		expect(grammar.rules.integer!.members!.map((arm) => arm.name)).toEqual(['integer_hex', 'integer_octal', 'integer_binary', 'integer_legacy_octal', 'integer_decimal']);
		expect(grammar.rules.integer_legacy_octal!.members!.map((arm) => arm.name)).toEqual(['integer_legacy_octal_long', 'integer_legacy_octal_plain']);
		const order = Object.keys(grammar.rules);
		expect(order.indexOf('integer_legacy_octal_plain')).toBeLessThan(order.indexOf('integer_decimal_plain'));
		expect(order.indexOf('integer_legacy_octal_long')).toBeLessThan(order.indexOf('integer_decimal_long'));
	});

	it('take a leading zero followed by octal digits with a nonzero one; every other leading zero stays decimal', () => {
		const source = 'a = 0377\nb = 0377L\nc = 007\nd = 0\ne = 00\nf = 0L\ng = 0389\nh = 08\ni = 0377j\n';
		const root = native.parseAndRead(source, { depth: Infinity }).root;
		expect(kindsOf(source, py.kinds.IntegerLegacyOctalPlain, root)).toEqual(['0377', '007']);
		expect(kindsOf(source, py.kinds.IntegerLegacyOctalLong, root)).toEqual(['0377L']);
		expect(kindsOf(source, py.kinds.IntegerDecimalPlain, root)).toEqual(['0', '00', '0389', '08']);
		expect(kindsOf(source, py.kinds.IntegerDecimalLong, root)).toEqual(['0L']);
		expect(kindsOf(source, py.kinds.IntegerDecimalImaginary, root)).toEqual(['0377j']);
	});

	it('read as the octal value, and rebuild in the standard spelling', () => {
		expect(value('x = 0377')).toEqual({ $path: 'literal.number.integer.octal', $value: 255 });
		expect(value('x = 0377L')).toEqual({ $path: 'literal.number.integer.big.octal', $value: 255n, marker: 'L' });
		expect(value('x = 0o17')).toEqual({ $path: 'literal.number.integer.octal', $value: 15 });
		expect(rendered(read('x = 0377\n'))).toBe('x = 0o377\n');
		expect(rendered(read('x = 0377L\n'))).toBe('x = 0o377L\n');
		expect(rendered(read('x = 0377l\n'))).toBe('x = 0o377l\n');
	});

	it('build a value at either octal path through the prefixed form, which spells every value', () => {
		expect(rendered({ $path: 'literal.number.integer.octal', $value: 255 })).toBe('0o377');
		expect(rendered({ $path: 'literal.number.integer.octal', $value: 0 })).toBe('0o0');
		expect(rendered({ $path: 'literal.number.integer.big.octal', $value: 255n })).toBe('0o377L');
	});

	it('build from their digits after the zero, a number or their whole text, and refuse zero, which they cannot spell', () => {
		expect(py.build.integer.legacyOctal('377').$render()).toBe('0377');
		expect(py.build.integer.legacyOctal(255).$render()).toBe('0377');
		expect(py.build.integer.legacyOctal('0377', false).$render()).toBe('0377');
		expect(() => py.build.integer.legacyOctal(0)).toThrow(/does not match pattern/);
		expect(py.build.integer.legacyOctal.long('377').$render()).toBe('0377L');
		expect(py.build.integer.legacyOctal.long(255n).$render()).toBe('0377L');
		expect(py.build.integer.legacyOctal.long('377', { marker: 'l' }).$render()).toBe('0377l');
	});
});
