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

describe('a leaf kind whose read has a named child', () => {
	it('is spelled by the children that tile it', () => {
		const quantifier = quantifierOf('a*?');
		expect(quantifier.$text).toBe('*?');
		expect(Object.keys(quantifier).filter((key) => key.startsWith('_') || key === '$other')).toEqual([]);
	});
});
