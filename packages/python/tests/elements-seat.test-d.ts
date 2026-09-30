/**
 * Type-level pins: an elements seat's `$with` setter takes the group config
 * objects its config surface takes, while the accessor keeps reading nodes.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import type * as T from '../src/types.ts';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

const engine = await createEngine(python);

export function comparatorsTakeConfigObjects(comparison: T.ComparisonOperator.Parsed): string {
	const rebuilt = comparison.$with.comparators({ operators: '>', primaryExpression: engine.build.identifier('z') });
	return rebuilt.$render();
}

export function comparatorsStillTakeBuiltNodes(comparison: T.ComparisonOperator.Parsed): string {
	return comparison.$with.comparators(...comparison.comparators()).$render();
}

export function comparatorsReadNodesOnly(comparison: T.ComparisonOperator.Parsed): void {
	type Read = ReturnType<typeof comparison.comparators>[number];
	expectTrue<Equals<T.ComparisonOperatorComparator.Config extends Read ? true : false, false>>();
}

export function rejectsUnknownConfigKeys(comparison: T.ComparisonOperator.Parsed): void {
	// @ts-expect-error a config object names the group's keys only
	comparison.$with.comparators({ operator: '>' });
}
