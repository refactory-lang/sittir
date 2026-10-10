import type { FormatRecord, TransportCoordinate } from '@sittir/types';
import type { TreeQuery } from './query.ts';

/** A parsed tree: the source it was read from, and the read of any node in it. */
export interface TreeHandle {
	/** Original source text. */
	source?: string;
	/** The native tree `read` reads: the tree id every coordinate read from it packs. */
	id?: number;
	/** The node at descendant `index` read into its transport, `depth` levels down (one when absent, `Infinity` for all); index 0 is the root. A unit variant's transport is its kind id. */
	read?(index: number, depth?: number): unknown;
	/** Format record inferred from the source file by the native reader. */
	format?: FormatRecord;
	query?: TreeQuery;
}

const INDEX_RANGE = 2 ** 32;

/** The descendant index a handle packs: the inverse of the native `encode_handle`, which puts the tree id above 32 bits of index, inside a double's exact range. */
export function decodeIndex(handle: number): number {
	return handle % INDEX_RANGE;
}

/** The tree id a handle packs, as `decodeIndex` reads its index. */
export function decodeTree(handle: number): number {
	return Math.floor(handle / INDEX_RANGE);
}

/** Whether `value` is a coordinate: a node past the read's depth, named by its tree and index. A transport never carries `$treeHandle` itself; its own coordinate is nested in `$_layout.at`. */
export function isCoordinate(value: unknown): value is TransportCoordinate {
	return value !== null && typeof value === 'object' && '$treeHandle' in value && '$span' in value;
}

/**
 * The node a coordinate names, read into its transport `depth` levels down (one when absent): a unit
 * variant's transport is its kind id.
 *
 * @throws when the tree has no native read, or the coordinate names another tree.
 */
export function readNode(tree: TreeHandle, coordinate: TransportCoordinate, depth?: number): unknown {
	if (tree.read === undefined) throw new Error('readNode: this tree has no native read');
	const owner = decodeTree(coordinate.$treeHandle);
	if (owner !== tree.id) throw new Error(`readNode: the coordinate names another tree (${owner}), not this one (${String(tree.id)})`);
	return tree.read(decodeIndex(coordinate.$treeHandle), depth);
}

/**
 * A read that names a node with structure, such as a tree's root.
 *
 * @throws when the read is a unit variant's kind id.
 */
export function readObject(value: unknown, what: string): object {
	if (value === null || typeof value !== 'object') throw new Error(`read: ${what} read as kind id ${String(value)}, not a node`);
	return value;
}
