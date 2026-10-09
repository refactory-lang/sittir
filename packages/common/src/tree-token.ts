import type { TreeMember, TreeToken } from '@sittir/types';
import type { TreeHandle } from './read.ts';

export type { TreeToken };

/**
 * The member a parsed object holds its token under. A symbol that never
 * leaves this module: nothing outside can read, write or forge the member
 * except through the functions here, and it is no data key of the node. It
 * is an ordinary enumerable member, so a spread copy made on this thread
 * carries it and keeps the tree; a structured clone, a JSON round trip and a
 * copy by string keys do not, so data that left this thread arrives holding
 * no tree.
 */
const TREE = Symbol('sittir.tree') as typeof TreeMember;

type Holder = { [TREE]?: TreeToken };

/** Mint the token of a tree this thread parsed. */
export function mintTreeToken(treeId: number): TreeToken {
	return Object.freeze({ treeId });
}

/** Make `node` hold `token`, and with it the tree the token names. */
export function holdTreeOn(node: object, token: TreeToken): void {
	(node as Holder)[TREE] = token;
}

/** The token `node` holds, or `undefined` when it holds no tree. */
export function treeTokenOf(node: object): TreeToken | undefined {
	return (node as Holder)[TREE];
}

/**
 * Make `to` hold the tree `from` holds, when it holds one, and return `to`.
 * For an object assembled member by member from a parsed one, which a spread
 * would have carried the token into.
 */
export function carryTree<T extends object>(from: object, to: T): T {
	const token = treeTokenOf(from);
	if (token !== undefined) holdTreeOn(to, token);
	return to;
}

const trees = new WeakMap<TreeToken, TreeHandle>();
export function holdsParse(node: object): boolean {
	const token = treeTokenOf(node);
	return token !== undefined && trees.has(token);
}

export function registerTree(token: TreeToken, tree: TreeHandle): void {
	trees.set(token, tree);
}

export function treeOf(node: object): TreeHandle | undefined {
	const token = treeTokenOf(node);
	return token === undefined ? undefined : trees.get(token);
}

/** Make `node` stop holding its tree. */
export function releaseTreeOn(node: object): void {
	delete (node as Holder)[TREE];
}

/**
 * Refuse a coordinate that holds no tree. Its handle and span are numbers
 * into a tree table, and only the token says the tree they name is the one
 * the node was read from and is still live: without it a lookup would answer
 * from whatever tree has that id here.
 *
 * @throws When `node` holds no token.
 */
export function assertHoldsTree(node: object): void {
	if (treeTokenOf(node) !== undefined) return;
	throw new Error(
		'this node is a coordinate into a parsed tree but does not hold that tree: it is a copy that lost it (a structured clone, a JSON round trip, a copy across threads or processes) or was written by hand. Use the node the parse or read returned, parse the source here, or send the rendered text instead of the node'
	);
}
