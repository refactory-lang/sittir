import { expectTypeOf } from 'vitest';
import type { DottedName } from '../../packages/python/src/types.ts';
import type { TraitBounds } from '../../packages/rust/src/types.ts';
import type { ImplementsClause } from '../../packages/typescript/src/types.ts';
import type { Parameters } from '../../packages/scm/src/types.ts';
import type { Term } from '../../packages/regex/src/types.ts';

expectTypeOf<[] extends DottedName.LooseArgs ? true : false>().toEqualTypeOf<false>();
expectTypeOf<[] extends TraitBounds.LooseArgs ? true : false>().toEqualTypeOf<false>();
expectTypeOf<[] extends ImplementsClause.LooseArgs ? true : false>().toEqualTypeOf<false>();
expectTypeOf<[] extends Parameters.LooseArgs ? true : false>().toEqualTypeOf<false>();
expectTypeOf<[] extends Term.LooseArgs ? true : false>().toEqualTypeOf<false>();

expectTypeOf<[readonly []] extends DottedName.LooseArgs ? true : false>().toEqualTypeOf<false>();
expectTypeOf<[readonly []] extends TraitBounds.LooseArgs ? true : false>().toEqualTypeOf<false>();
expectTypeOf<[readonly []] extends ImplementsClause.LooseArgs ? true : false>().toEqualTypeOf<false>();
expectTypeOf<[readonly []] extends Parameters.LooseArgs ? true : false>().toEqualTypeOf<false>();
expectTypeOf<[readonly []] extends Term.LooseArgs ? true : false>().toEqualTypeOf<false>();

expectTypeOf<[string] extends DottedName.LooseArgs ? true : false>().toEqualTypeOf<true>();
expectTypeOf<[string] extends TraitBounds.LooseArgs ? true : false>().toEqualTypeOf<true>();
expectTypeOf<[string] extends ImplementsClause.LooseArgs ? true : false>().toEqualTypeOf<true>();
expectTypeOf<[readonly [string]] extends DottedName.LooseArgs ? true : false>().toEqualTypeOf<true>();
expectTypeOf<[readonly [string]] extends TraitBounds.LooseArgs ? true : false>().toEqualTypeOf<true>();
expectTypeOf<[readonly [string]] extends ImplementsClause.LooseArgs ? true : false>().toEqualTypeOf<true>();
