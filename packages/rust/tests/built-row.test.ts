import { describe, expect, it } from 'vitest';
import { Delimiter } from '@sittir/common/utils';
import { constructions } from './side-nesting.mts';

type Lifetimes = { readonly $with: { items(...items: unknown[]): unknown } };

describe.each(constructions)("a built list's row (%s)", (_, rs) => {
	it('keeps the delimiter its record holds through a $with of its items', () => {
		const b = rs.build;
		const lifetime = (name: string) => b.lifetime(b.identifier(name));
		const list = b.lifetimes({ delimiter: Delimiter.Trailing }, lifetime('a'), lifetime('b')) as unknown as Lifetimes;
		expect(rs.render(list.$with.items(lifetime('c')) as never).toString()).toBe("'c,");
	});
});
