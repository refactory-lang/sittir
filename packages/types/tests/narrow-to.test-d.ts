import { describe, expectTypeOf, it } from 'vitest';
import type { NarrowTo } from '../src/index.ts';

enum K {
	A = 1,
	B = 2,
	C = 3
}
interface NodeA {
	readonly $type: K.A;
	readonly a: string;
}
interface NodeB {
	readonly $type: K.B;
}
interface NodeC {
	readonly $type: K.C;
}
type Members = K.A | K.B;

describe('NarrowTo', () => {
	it('a numeric member narrows to its own id', () => {
		expectTypeOf<NarrowTo<K.A | K.C, Members>>().toEqualTypeOf<K.A>();
		expectTypeOf<NarrowTo<K.C, Members>>().toEqualTypeOf<never>();
	});
	it('a broad node narrows to the intersection with the member ids', () => {
		expectTypeOf<NarrowTo<{ readonly $type: number }, Members>>().toEqualTypeOf<
			{ readonly $type: number } & { readonly $type: Members }
		>();
		expectTypeOf<NarrowTo<{ readonly $type: number }, Members>['$type']>().toEqualTypeOf<Members>();
	});
	it('a storage union narrows by its discriminant', () => {
		expectTypeOf<NarrowTo<NodeA | NodeB | NodeC, Members>>().toEqualTypeOf<NodeA | NodeB>();
	});
	it('a node whose discriminant is a union of a member and a stranger narrows to the member', () => {
		type Wide = { readonly $type: K.A | K.C };
		expectTypeOf<NarrowTo<Wide, Members>>().toEqualTypeOf<Wide & { readonly $type: K.A }>();
	});
});
