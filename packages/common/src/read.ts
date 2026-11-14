import type { BuiltArena } from './built-arena.ts';
import type { CellFormat, CellSite } from './record-cell.ts';
import type { ByteSpan, ErrorRegion, NodeCoordinate, SlotLayoutWire, UnitSidesWire, WireNode } from '@sittir/types';
import type { TreeQuery } from './query.ts';
import type { TreeToken } from './tree-token.ts';

/** A side of a node that holds trivia: before its first token, after its last, or, for a node with no named child, between its own tokens. */
export type TriviaSideName = 'leading' | 'trailing' | 'inner';

/** A parsed tree: the read of any node in it, and the text of any span of the source it was read from, which stays native. */
export interface TreeHandle {
	/** The text `span` covers in the source: one string of that span's characters, never the source. */
	text?(span: ByteSpan): string;
	/** The native tree `read` reads: the tree id every coordinate read from it packs. */
	id?: number;
	/** The node at descendant `index` read into its native node, `depth` levels down (one when absent, `Infinity` for all); index 0 is the root. A unit variant's native node is its kind id. */
	read?(index: number, depth?: number): unknown;
	/** The tree's layer of the render options (`NativeParseResult.options`). */
	options?: Readonly<Record<string, unknown>>;
	/** The parse's ERROR and MISSING regions (`NativeParseResult.errors`); absent for a tree no parse produced. */
	errors?: readonly ErrorRegion[];
	query?: TreeQuery;
	/** A snapshot's layout of the node at descendant `index` and of each node under it a read gives a layout, as `[row, layout]` pairs, measured from the byte `holderByte`, or from where it or its leading side begins (`snapshotOf`). */
	snapshotLayouts?(index: number, holderByte?: number): readonly (readonly [number, object])[];
	/** The entries of `side` of the node at descendant `index`: the ones a write gave it, else the ones the tree's trivia table assigns it. */
	triviaSide?(index: number, side: TriviaSideName): WireNode[] | undefined;
	/** Replaces `side` of the node at descendant `index` with `entries`. */
	writeTriviaSide?(index: number, side: TriviaSideName, entries: readonly WireNode[]): void;
	/** The sides of the unit children of the node at descendant `index`, by slot and item (`NodeLayout.units`). */
	unitSides?(index: number): UnitSidesWire[];
	/** Replaces every side of the unit children of the node at descendant `index` with `units`, by slot and item (`NodeLayout.units`). */
	writeUnitSides?(index: number, units: readonly UnitSidesWire[]): void;
	/** The stored layout of each list slot of the node at descendant `index` that stores any (`NodeLayout.slots`). */
	slotLayouts?(index: number): SlotLayoutWire[];
	/** The separator the list at descendant `index` writes between its items: its slot's stored one, else the read-time options'. */
	slotSeparator?(index: number): number | undefined;
	/** The separator before the node at descendant `index` as a list item, where it is not its slot's (`NodeLayout.separator`). */
	separatorBefore?(index: number): number | undefined;
	/** Whether a write replaced a side of a node under the node at descendant `index`, its own `inner` included, and its own leading and trailing too when `ownSides` is set. */
	editedWithin?(index: number, ownSides: boolean): boolean;
	/** Whether the node at descendant `index` is empty: no child of it has width. */
	isEmpty?(index: number): boolean;
	siblings?(indexes: readonly number[]): readonly number[];
	/** The source each node at `indexes` was read from, for a handle whose nodes come from more than one parse (`BuiltArena.tree`): two nodes are of one parse when theirs are equal. Absent for a tree, whose nodes are all its own parse's. */
	sources?(indexes: readonly number[]): readonly number[];
	/** The built arena whose records this handle's views read, for the handle a built arena reads through (`BuiltArena.tree`). */
	built?: BuiltArena;
	token?: TreeToken;
}

export interface ChunkWords {
	readonly length: number;
	readonly [index: number]: number;
	subarray(begin?: number, end?: number): ChunkWords;
}

/** What any record view reads its records' words through. */
export interface RecordWords {
	readonly format: CellFormat;
	/** The words of the chunk `address` lies in, holding at least `length` words from it. */
	words(address: number, length: number): ChunkWords;
}

const INDEX_RANGE = 2 ** 32;

/** The descendant index a handle packs: the inverse of the native `encode_handle`, which puts the tree id above 32 bits of index, inside a double's exact range. */
export function decodeIndex(handle: number): number {
	return handle % INDEX_RANGE;
}

/** The handle of descendant `index` of tree `tree`, as the native `encode_handle` packs it. */
export function encodeHandle(tree: number, index: number): number {
	return tree * INDEX_RANGE + index;
}

/** The tree id a handle packs, as `decodeIndex` reads its index. */
export function decodeTree(handle: number): number {
	return Math.floor(handle / INDEX_RANGE);
}

/** Whether `value` is a coordinate: a node past the read's depth, named by its tree and index. A native node never carries `$treeHandle` itself; its own coordinate is nested in `$_layout.at`. */
export function isCoordinate(value: unknown): value is NodeCoordinate {
	return value !== null && typeof value === 'object' && ('$treeHandle' in value || '$node' in value) && '$span' in value;
}

/**
 * The node a coordinate names, read into its native node `depth` levels down (one when absent): a unit
 * variant's node is its kind id.
 *
 * @throws when the tree has no native read, or the coordinate names another tree.
 */
export function readNode(tree: TreeHandle, coordinate: NodeCoordinate, depth?: number): unknown {
	const named = coordinate as unknown as { readonly $node?: number; readonly $site?: CellSite; readonly $span: NodeCoordinate['$span']; readonly $type: number };
	if (named.$node !== undefined && tree.built !== undefined) return tree.built.named({ ...named, $node: named.$node });
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
