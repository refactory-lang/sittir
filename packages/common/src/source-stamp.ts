import type { SourceMember } from '@sittir/types';
import { Source } from './source.ts';
import type { TreeHandle } from './read.ts';
import { isHandle } from './handle.ts';
import { isHeldRead } from './node-data.ts';

export const SOURCE = Symbol('sittir.source-stamp') as typeof SourceMember;

type Stamped = { [SOURCE]?: Source };

/**
 * Where a node came from: `Source.Ts` for a node read from a tree-sitter parse,
 * `Source.Factory` for one a builder made, a `$with` rebuild included. A spread
 * copy keeps its node's provenance.
 *
 * @param node - Any object.
 * @returns The node's provenance, or `undefined` when `node` is no node (a config,
 *   or a JSON, `structuredClone` or string-key copy of a node).
 */
export function sourceOf(node: object): Source | undefined {
	const own = (node as Stamped)[SOURCE];
	if (own !== undefined) return own;
	const tree = (node as { readonly $tree?: TreeHandle }).$tree;
	if (tree !== undefined && isHandle(node)) {
		if (tree.built !== undefined) return Source.Factory;
		return typeof (node as { readonly $at?: unknown }).$at === 'number' ? Source.Ts : undefined;
	}
	return isHeldRead(node) ? Source.Ts : undefined;
}
