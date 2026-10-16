/**
 * Type-level pin: a node's members cannot be reassigned. A slot getter is a
 * readonly member like the storage it reads, so swapping it needs a cast.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import type * as T from '../src/types.ts';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

type Built = ReturnType<typeof py.build.decoratedDefinition>;

export function gettersAreReadonly(built: Built, other: Built, node: T.DecoratedDefinition, twin: T.DecoratedDefinition): void {
	// @ts-expect-error a slot getter is readonly
	built.decorators = other.decorators;
	// @ts-expect-error a slot getter is readonly on the node type too
	node.definition = twin.definition;
	// @ts-expect-error stored slots stay readonly
	built._decorator = other._decorator;
}
