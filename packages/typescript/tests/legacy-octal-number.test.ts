import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';
import typescript from '../src/index.ts';

type Read = { readonly $path: string; readonly [member: string]: unknown };
type Spanned = { readonly $type?: unknown; readonly $_layout?: { readonly at?: { readonly $span?: { readonly start: number; readonly end: number } } } };

const ts = await sharedEngine(() => createEngine(typescript));
const native = (await typescript.load()).createNative({ nodeStorage: 'object' });
const runtime = await portableRuntime(await sharedEngine(() => createEngine(typescript, { api: 'strict' })));
const read = (source: string): Read => runtime.read(runtime.engine.parse(source)) as Read;
const value = (source: string): unknown => ((((read(source).statements as readonly Read[])[0] as Read).declarators as readonly Read[])[0] as Read).value;
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

describe('legacy octal numbers', () => {
	it('are a number arm the parser lexes ahead of decimal', () => {
		const grammar = JSON.parse(readFileSync(new URL('../.sittir/src/grammar.json', import.meta.url), 'utf8')) as { readonly rules: Record<string, unknown> };
		const order = Object.keys(grammar.rules);
		expect(order.indexOf('number_legacy_octal')).toBeGreaterThan(-1);
		expect(order.indexOf('number_legacy_octal')).toBeLessThan(order.indexOf('number_decimal'));
	});

	it('take a leading zero followed by octal digits with a nonzero one; a form holding an 8 or a 9, and zero, stay decimal', () => {
		const source = 'let a = 0377;\nlet b = 007;\nlet c = 08;\nlet d = 0389;\nlet e = 00;\nlet f = 0;\n';
		const root = native.parseAndRead(source, { depth: Infinity }).root;
		expect(kindsOf(source, ts.kinds.NumberLegacyOctal, root)).toEqual(['0377', '007']);
		expect(kindsOf(source, ts.kinds.NumberDecimal, root)).toEqual(['08', '0389', '00', '0']);
	});

	it('read as the octal value, and rebuild in the standard spelling', () => {
		expect(value('let x = 0377;')).toEqual({ $path: 'literal.number.integer.octal', $value: 255 });
		expect(value('let x = 0o17;')).toEqual({ $path: 'literal.number.integer.octal', $value: 15 });
		expect(rendered(read('let x = 0377;\n'))).toBe('let x = 0o377;\n');
	});

	it('build an octal value through the prefixed form, which spells every value', () => {
		expect(rendered({ $path: 'literal.number.integer.octal', $value: 255 })).toBe('0o377');
		expect(rendered({ $path: 'literal.number.integer.octal', $value: 0 })).toBe('0o0');
	});

	it('build from their digits after the zero, a number or their whole text, and refuse zero, which they cannot spell', () => {
		expect(ts.build.number.legacyOctal('377').$render()).toBe('0377');
		expect(ts.build.number.legacyOctal(255).$render()).toBe('0377');
		expect(ts.build.number.legacyOctal('0377', false).$render()).toBe('0377');
		expect(() => ts.build.number.legacyOctal(0)).toThrow(/does not match pattern/);
	});
});
