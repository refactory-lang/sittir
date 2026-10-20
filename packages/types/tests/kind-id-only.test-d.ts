/**
 * A node's `$type` is its language's kind id, never a kind name.
 *
 * Compile-time tests: a failing assertion fails the type-check.
 */

import type { AnyUntypedNode, KindOf, Terminal } from '../src/index.ts';

type Expect<T extends true> = T;
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

export const numbered: AnyUntypedNode = { $type: 42 };
// @ts-expect-error a kind name is no kind id
export const named: AnyUntypedNode = { $type: 'function_item' };

// @ts-expect-error a terminal's id is a kind id
export type NamedTerminal = Terminal<'identifier'>;

export type KindOfId = Expect<Equal<KindOf<{ readonly $type: 42 }>, 42>>;
export type KindOfName = Expect<Equal<KindOf<{ readonly $type: 'function_item' }>, never>>;
