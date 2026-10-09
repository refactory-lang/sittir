import type { FormatRecord, TransportCoordinate } from '@sittir/types';
import type { TreeQuery } from './query.ts';

/** A parsed tree: the source it was read from, and the read of any node in it. */
export interface TreeHandle {
	/** Original source text. */
	source?: string;
	/** The node at descendant `index` read into its transport, `depth` levels down (one when absent, `Infinity` for all); index 0 is the root. */
	read?(index: number, depth?: number): object;
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

/** The node a coordinate names, read `depth` levels down (one when absent). */
export function readNode(tree: TreeHandle, coordinate: TransportCoordinate, depth?: number): object {
	if (tree.read === undefined) throw new Error('readNode: this tree has no native read');
	return tree.read(decodeIndex(coordinate.$treeHandle), depth);
}
