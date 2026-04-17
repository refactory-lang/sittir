/**
 * isNodeData — shared runtime predicate distinguishing a resolved
 * NodeData value (factory output, wrap output, or bare readNode output)
 * from a loose camelCase configuration bag.
 *
 * Used by generated `.from()` resolvers: when input is already a NodeData,
 * resolution is identity (return the input unchanged). When input is a
 * loose bag, resolvers translate it into a fluent node by constructing
 * through the factory. This predicate is the single source of truth for
 * "already resolved vs needs translation" — one import, used by every
 * grammar package's from.ts.
 *
 * Structural detection: a value is NodeData when it has a string `type`
 * discriminant AND carries at least one of the three NodeData payload
 * slots (`fields`, `children`, or `text`). Loose bags don't carry
 * `type` at all — they're plain camelCase objects.
 */

import type { AnyNodeData } from '@sittir/types';

export function isNodeData(v: unknown): v is AnyNodeData {
	if (typeof v !== 'object' || v === null) return false;
	const o = v as { type?: unknown; fields?: unknown; children?: unknown; text?: unknown };
	if (typeof o.type !== 'string') return false;
	return (
		o.fields !== undefined
		|| o.children !== undefined
		|| typeof o.text === 'string'
	);
}
