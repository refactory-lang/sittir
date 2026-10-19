import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);

const membersOf = (source: string) => (ts.parse(source).statements()[0] as any).value().members();

describe('a read list answers the separator its source used', () => {
	it.each([
		['type T = { a: string, b: number, c: boolean };', ts.kinds.Comma],
		['type T = { a: string; b: number; c: boolean };', ts.kinds.Semi]
	])('%s', (source, expected) => {
		expect(membersOf(source).separator).toBe(expected);
	});

	it('answers the majority of a mixed list', () => {
		expect(membersOf('type T = { a: string, b: number, c: boolean; d: string };').separator).toBe(ts.kinds.Comma);
		expect(membersOf('type T = { a: string; b: number; c: boolean, d: string };').separator).toBe(ts.kinds.Semi);
	});

	it('answers the separator the engine renders for a list with no gap to measure', () => {
		expect(membersOf('type T = { a: string };').separator).toBe(ts.kinds.Semi);
	});

	it('rebuilding with the answered separator keeps the separator the source used', () => {
		for (const [source, expected] of [
			['type T = { a: string, b: number, c: boolean };', 'a: string,\nb: number,\nc: boolean,'],
			['type T = { a: string; b: number; c: boolean };', 'a: string;\nb: number;\nc: boolean;']
		] as const) {
			const list = membersOf(source);
			const rebuilt = ts.build.objectTypeContent({ separator: list.separator } as never, ...list.items()) as { $render(): string };
			expect(rebuilt.$render()).toBe(expected);
		}
	});
});
