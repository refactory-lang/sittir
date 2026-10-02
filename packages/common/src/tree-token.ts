import { randomUUID } from 'node:crypto';

/**
 * The identity of this JavaScript thread's tree tables. Each thread of each
 * process has its own addon tables and its own tree-id counter starting at 0,
 * so neither a tree id nor a thread number says which table a coordinate
 * belongs to: two processes both have a thread 0 that parsed a tree 0.
 */
const TABLE = randomUUID();

/**
 * What a parsed object holds to keep its tree live: one per tree, shared by
 * every object read from it. It names the table that holds the tree, as a
 * value, so a copy of the object still says where its coordinate is valid.
 */
export interface TreeToken {
	readonly treeId: number;
	readonly table: string;
}

/** Mint the token of a tree this thread parsed. */
export function mintTreeToken(treeId: number): TreeToken {
	return Object.freeze({ treeId, table: TABLE });
}

/**
 * Refuse a token of another table: one minted on another thread or in another
 * process. Its tree id can name a different tree here, and a lookup alone
 * would answer it from the wrong source. A copy made on this thread passes;
 * so does `undefined`: a coordinate with no token is data built by hand,
 * which the native table answers or refuses by its tree id alone.
 */
export function assertOwnTableToken(token: unknown): void {
	if (token === null || typeof token !== 'object') return;
	const { table } = token as Partial<TreeToken>;
	if (table === undefined || table === TABLE) return;
	throw new Error(
		'this node is a coordinate into another tree table (another thread or process parsed it) and names no tree in this one; parse the source on this thread, or send the rendered text instead of the node'
	);
}
