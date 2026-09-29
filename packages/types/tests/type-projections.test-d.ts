/**
 * Type-level tests for the node-type projections in @sittir/types.
 *
 * These are compile-time tests: if any assertion fails, the file won't
 * compile.
 *
 * Run with: pnpm --filter @sittir/types type-check
 */

import type { KindOf, SetterKey, ConfigOf } from '../src/index.ts';

// ---------------------------------------------------------------------------
// Helper: assert types are equal
// ---------------------------------------------------------------------------
type Expect<T extends true> = T;
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Extends<A, B> = A extends B ? true : false;

// ---------------------------------------------------------------------------
// 1. KindOf — extract type from a node
// ---------------------------------------------------------------------------

type _1a = Expect<Equal<KindOf<{ readonly $type: 'function_item' }>, 'function_item'>>;
type _1c = Expect<Equal<KindOf<{ readonly $type: 'identifier' }>, 'identifier'>>;

// Union distribution
type _1d = Expect<
	Equal<KindOf<{ readonly $type: 'identifier' } | { readonly $type: 'metavariable' }>, 'identifier' | 'metavariable'>
>;

// ---------------------------------------------------------------------------
// 2. SetterKey / ConfigOf — Object.prototype-colliding field names escape
//     to a trailing underscore, matching the runtime's snakeToCamel(). A
//     grammar field named `constructor` (e.g. TypeScript's new_expression)
//     must project to a `constructor_` key, not `constructor` — the
//     latter would shadow Object.prototype.constructor.
// ---------------------------------------------------------------------------

type _2a = Expect<Equal<SetterKey<'constructor'>, 'constructor_'>>;
type _2b = Expect<Equal<SetterKey<'name'>, 'name'>>;

interface NewExpression {
	readonly $type: 1;
	readonly _constructor: { readonly $type: 2; readonly $text: string };
	readonly _typeArguments?: { readonly $type: 3; readonly $text: string };
}
type NewExpressionConfig = ConfigOf<NewExpression>;

type _2c = Expect<Extends<'constructor_', keyof NewExpressionConfig>>;
type _2d = Expect<Equal<Extends<'constructor', keyof NewExpressionConfig>, false>>;
