import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import regex from '../src/index.ts';

const rx = await createEngine(regex);

type Quantified = { quantifier(): Record<string, unknown> };

function quantifierOf(source: string): Record<string, unknown> {
	const find = (value: unknown, seen: Set<unknown>): Quantified | undefined => {
		if (value === null || typeof value !== 'object' || seen.has(value)) return undefined;
		seen.add(value);
		if (typeof (value as Partial<Quantified>).quantifier === 'function') return value as Quantified;
		for (const [key, child] of Object.entries(value)) {
			const next = typeof child === 'function' && /^[a-z]/.test(key) ? (child as () => unknown).call(value) : child;
			const found = find(next, seen);
			if (found !== undefined) return found;
		}
		return undefined;
	};
	return find(rx.parse(source), new Set())!.quantifier();
}

const LAZINESS = [
	['a*?', 'zeroOrMore', true],
	['a*', 'zeroOrMore', false],
	['a+?', 'oneOrMore', true],
	['a+', 'oneOrMore', false],
	['a??', 'optional', true],
	['a?', 'optional', false]
] as const;

describe('a quantifier kind with an optional lazy marker', () => {
	it.each(LAZINESS)('%s reads lazy as a slot and renders back unchanged', (source, _kind, lazy) => {
		const parsed = rx.parse(source);
		const quantifier = quantifierOf(source) as { lazy(): unknown };
		expect(quantifier.lazy() === true).toBe(lazy);
		expect(rx.render(parsed).toString()).toBe(source);
	});

	it.each([
		['zeroOrMore({ lazy: true })', () => rx.build.zeroOrMore({ lazy: true }), '*?'],
		['zeroOrMore({ lazy: false })', () => rx.build.zeroOrMore({ lazy: false }), '*'],
		['zeroOrMore()', () => rx.build.zeroOrMore(), '*'],
		['oneOrMore({ lazy: true })', () => rx.build.oneOrMore({ lazy: true }), '+?'],
		['oneOrMore()', () => rx.build.oneOrMore(), '+'],
		['optional({ lazy: true })', () => rx.build.optional({ lazy: true }), '??'],
		['optional()', () => rx.build.optional(), '?']
	])('builds %s as %s', (_, build, text) => {
		expect(build().$render().toString()).toBe(text);
	});
});
