import type { SourceMember } from '@sittir/types';
import { Source } from './source.ts';
import type { TreeHandle } from './read.ts';
import { isHandle } from './handle.ts';

const STAMP = Symbol('sittir.source-stamp') as typeof SourceMember;

type Stamped = { [STAMP]?: Source };

export function stampSource<T extends object>(node: T, source: Source): T {
	Object.defineProperty(node, STAMP, { value: source, enumerable: true, configurable: true });
	return node;
}

export function stampBuilt<T extends object>(node: T): T {
	return stampSource(node, Source.Factory);
}

/**
 * Where a node came from: `Source.Ts` for a node read from a tree-sitter parse,
 * `Source.Sg` for one read through ast-grep, `Source.Factory` for one a builder
 * made. A `$with` rebuild keeps its node's provenance, and so does a spread copy.
 *
 * @param node - Any object.
 * @returns The node's provenance, or `undefined` when `node` is no node (a config,
 *   or a JSON, `structuredClone` or string-key copy of a node).
 */
export function sourceOf(node: object): Source | undefined {
	const own = (node as Stamped)[STAMP];
	if (own !== undefined) return own;
	const tree = (node as { readonly $tree?: TreeHandle }).$tree;
	if (tree === undefined || !isHandle(node)) return undefined;
	const at = (node as { readonly $at?: unknown }).$at;
	if (tree.built === undefined) return typeof at === 'number' ? Source.Ts : undefined;
	return typeof at === 'number' && tree.built.rebuiltFromRead(at) ? Source.Ts : Source.Factory;
}

export function carrySourceStamp<T extends object>(from: object, to: T): T {
	const source = sourceOf(from);
	if (source !== undefined) stampSource(to, source);
	return to;
}
