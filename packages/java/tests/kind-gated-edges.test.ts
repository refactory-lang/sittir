import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import language from '../src/index.ts';

const engines = {
	arena: await sharedEngine(() => createEngine(language, { nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(language, { nodeStorage: 'object' }))
};

const cases: readonly (readonly [string, number, string])[] = [
	['AssertStatement', 2, 'class A { void m() { int y = 0; assert y > 0; assert y > 0 : "m"; y = 1; } }'],
	['Wildcard', 5, 'class A { List<? extends T> a; List<? super T> b; List<?> c; Map<?, ? super T> d; }']
];

describe('a Java kind whose edge token is picked by its content slot’s kind', () => {
	it.each(cases)('%s renders alike on both storages and parses back', (kind, count, source) => {
		const renders = Object.values(engines).map((engine) => {
			const kinds = engine.kinds as unknown as Record<string, number>;
			const parsed = engine.parse(source);
			expect(parsed.$errors).toHaveLength(0);
			expect([...parsed.$query().$descendants.ofType(kinds[kind] as never)]).toHaveLength(count);
			const rendered = String(engine.render(parsed as never));
			expect(engine.parse(rendered).$errors).toHaveLength(0);
			return rendered;
		});
		expect(renders[0]).toBe(renders[1]);
	});
});
