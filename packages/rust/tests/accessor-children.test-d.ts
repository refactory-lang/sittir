/**
 * Type-level pins: the children accessors return are the same wrapped kind
 * types `parse()` returns for the root, so `$with` and the node methods
 * type-check on them.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import type * as T from '../src/types.ts';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

const engine = await createEngine(rust);

export function accessorChildrenHaveWith(): string {
	const root = engine.parse('fn process() {}\n');
	const item = root.statements()[0]!;
	if (!engine.is.functionItem(item)) return '';
	return item.$with.parameters(engine.build.parameters()).$render();
}

export function rootAndChildrenShareOneMapping(): void {
	const root = engine.parse('fn process() {}\n');
	expectTrue<Equals<ReturnType<typeof root.statements>, ReturnType<T.SourceFile.Parsed['statements']>>>();
	expectTrue<Equals<ReturnType<T.SourceFile.Parsed['statements']>[number], T.Statement.Parsed>>();
}
