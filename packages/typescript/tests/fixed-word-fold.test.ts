import { describe, expectTypeOf, it } from 'vitest';
import type { Admit } from '@sittir/types';
import type { Arguments, TypeQuery, TypeQueryCallExpression, TypeQueryMemberExpression } from '../src/types.ts';

describe('a kind whose fold carries a fixed word is taken bare only as itself', () => {
	it('keeps its own builder taking its content bare', () => {
		expectTypeOf<Admit<Arguments>>().toMatchTypeOf<TypeQueryCallExpression.Loose>();
	});

	it('types a holder as taking that kind only as itself', () => {
		expectTypeOf<Admit<TypeQueryCallExpression>>().toMatchTypeOf<TypeQuery.Loose>();
		expectTypeOf<Admit<Arguments>>().not.toMatchTypeOf<TypeQuery.Loose>();
		expectTypeOf<Admit<Arguments>>().not.toMatchTypeOf<TypeQueryMemberExpression.Loose>();
	});
});
