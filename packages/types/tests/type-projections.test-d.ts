/**
 * Type-level tests for the node-type projections in @sittir/types.
 *
 * These are compile-time tests: if any assertion fails, the file won't
 * compile.
 *
 * Run with: pnpm --filter @sittir/types type-check
 */

import type { KindOf, SlotKey, ConfigOf } from '../src/index.ts';

// ---------------------------------------------------------------------------
// Helper: assert types are equal
// ---------------------------------------------------------------------------
type Expect<T extends true> = T;
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// ---------------------------------------------------------------------------
// 1. KindOf — extract the kind id from a node
// ---------------------------------------------------------------------------

type _1a = Expect<Equal<KindOf<{ readonly $type: 42 }>, 42>>;
type _1c = Expect<Equal<KindOf<{ readonly $type: 7 }>, 7>>;

// Union distribution
type _1d = Expect<Equal<KindOf<{ readonly $type: 7 } | { readonly $type: 9 }>, 7 | 9>>;

// ---------------------------------------------------------------------------
// 2. SlotKey / ConfigOf — a slot is configured by the model's slot name, as
//     the generator writes it in `__slotNames__`: a repeated slot's plural,
//     and a name that would shadow an Object.prototype member escaped.
// ---------------------------------------------------------------------------

interface NewExpression {
	readonly $type: 1;
	readonly _constructor: { readonly $type: 2; readonly $text: string };
	readonly _argument: readonly { readonly $type: 3; readonly $text: string }[];
	readonly __slotNames__?: { readonly _constructor: 'constructor_'; readonly _argument: 'arguments' };
}
type NewExpressionConfig = ConfigOf<NewExpression>;

type _2a = Expect<Equal<SlotKey<NewExpression, 'argument'>, 'arguments'>>;
type _2b = Expect<Equal<keyof NewExpressionConfig, 'constructor_' | 'arguments'>>;
