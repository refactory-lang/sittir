import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';
import python from '../src/index.ts';

type Read = { readonly $path: string; readonly [member: string]: unknown };

const py = await sharedEngine(() => createEngine(python));
const runtime = await portableRuntime(await sharedEngine(() => createEngine(python, { api: 'strict' })));
const read = (source: string): Read => runtime.read(runtime.engine.parse(source)) as Read;
const value = (source: string): unknown => (((read(source).statements as readonly Read[])[0] as Read).content as Read).value;
const roundTrip = (source: string): string => String(runtime.engine.render(runtime.build(read(source)) as never));

describe('long and plain hex, octal and binary integers', () => {
	it('are kinds the parser has, one token each, under the radix kind', () => {
		const grammar = JSON.parse(readFileSync(new URL('../.sittir/src/grammar.json', import.meta.url), 'utf8')) as {
			readonly rules: Record<string, { readonly type: string; readonly members?: readonly { readonly name?: string }[] }>;
		};
		for (const radix of ['hex', 'octal', 'binary']) {
			expect(grammar.rules[`integer_${radix}`]!.members!.map((arm) => arm.name)).toEqual([`integer_${radix}_long`, `integer_${radix}_plain`]);
			expect(grammar.rules[`integer_${radix}_long`]!.type).toBe('TOKEN');
			expect(grammar.rules[`integer_${radix}_plain`]!.type).toBe('TOKEN');
		}
	});

	it('build the plain form when the radix builder is called, and the long form through .long, in the default spellings', () => {
		expect(py.build.integer.hex('FF').$render()).toBe('0xFF');
		expect(py.build.integer.hex.plain('FF').$render()).toBe('0xFF');
		expect(py.build.integer.hex.long('FF').$render()).toBe('0xFFL');
		expect(py.build.integer.octal.long('17').$render()).toBe('0o17L');
		expect(py.build.integer.binary.long('101').$render()).toBe('0b101L');
	});

	it('take the marker spelling from the text, or from an option', () => {
		expect(py.build.integer.hex.long('0XFFl').$render()).toBe('0XFFl');
		expect(py.build.integer.hex.long('FF', { marker: 'l' }).$render()).toBe('0xFFl');
	});

	it('read the plain form as its value and carry the long form as its own kind, and render each back as written', () => {
		const kindOf = (source: string): unknown => (value(source) as { readonly $type: unknown }).$type;
		expect(kindOf('x = 0xFFL')).toBe(python.kinds.IntegerHexLong);
		expect(kindOf('x = 0o17l')).toBe(python.kinds.IntegerOctalLong);
		expect(kindOf('x = 0B101L')).toBe(python.kinds.IntegerBinaryLong);
		expect(value('x = 0xff')).toEqual({ $path: 'literal.number.integer.hex', $value: 255 });
		for (const source of ['x = 0xFFL', 'x = 0o17l', 'x = 0B101L', 'x = 0xff']) expect(roundTrip(source)).toBe(`${source}\n`);
	});
});
