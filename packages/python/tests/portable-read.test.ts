import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import python from '../src/index.ts';

type Read = { readonly $path: string; readonly [member: string]: unknown };

const runtime = await portableRuntime(await createEngine(python, { api: 'strict' }));
const read = (source: string): Read => runtime.read(runtime.engine.parse(source)) as Read;
const roundTrip = (source: string): string => String(runtime.engine.render(runtime.build(read(source)) as never));
const firstOf = (source: string): unknown => (read(source).statements as readonly Read[])[0];

describe('the portable read', () => {
	it('reads a member through its deepest route that seats a value, as the build places it', () => {
		const items = { $path: 'clause.resource.item', value: 'a', name: 'b' };
		expect(firstOf('with a as b: pass')).toMatchObject({ withClause: { items: [items] } });
		expect(roundTrip('with a as b: pass')).toBe('with a as b: pass\n');
		expect(roundTrip('with a: pass')).toBe('with a: pass\n');
	});

	it('reads one comparison operand as one value, though its route walks a list, and builds it back', () => {
		expect(firstOf('a not in b')).toMatchObject({ content: { $path: 'expression.binary.membership.not_in', left: 'a', right: 'b' } });
		expect(roundTrip('a not in b')).toBe('a not in b\n');
		expect(roundTrip('a < b <= c')).toBe('a < b <= c\n');
	});

	it('carries a literal its seat would not build back from text, and reads digit separators and exponent spellings by value', () => {
		expect(firstOf('x = 1j')).toMatchObject({ content: { value: { $type: python.kinds.IntegerDecimalImaginary } } });
		expect(roundTrip('x = 1j')).toBe('x = 1j\n');
		expect(roundTrip('x = 0B1_1')).toBe('x = 0b11\n');
		expect(roundTrip('x = 1e-3')).toBe('x = 1e-3\n');
	});

	it('reads a slice step whose group holds no expression as absent', () => {
		expect(roundTrip('c[::]')).toBe('c[:]\n');
	});
});
