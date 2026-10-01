import { threadId } from 'node:worker_threads';

/**
 * What a parsed object holds to keep its tree live: one per tree, shared by
 * every object read from it. It records the JavaScript thread that parsed
 * the tree, as a value, so a copy of the object still says where its
 * coordinate is valid.
 */
export interface TreeToken {
	readonly treeId: number;
	readonly thread: number;
}

/** Mint the token of a tree this thread parsed. */
export function mintTreeToken(treeId: number): TreeToken {
	return Object.freeze({ treeId, thread: threadId });
}

/**
 * Refuse a token minted on another thread. Tree ids count from 0 on each
 * thread and each thread's addon has its own table, so an id from another
 * thread can name a different tree here, and a lookup alone would answer it
 * from the wrong source. A copy made on this thread passes; so does
 * `undefined`: a coordinate with no token is data built by hand, which the
 * native table answers or refuses by its tree id alone.
 */
export function assertOwnThreadToken(token: unknown): void {
	if (token === null || typeof token !== 'object') return;
	const { thread } = token as Partial<TreeToken>;
	if (thread === undefined || thread === threadId) return;
	throw new Error(
		`this node is a coordinate from another thread's tree table (thread ${thread}) and names no tree on this one (thread ${threadId}); parse the source on this thread, or send the rendered text instead of the node`
	);
}
