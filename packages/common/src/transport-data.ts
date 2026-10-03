import type { AnyUntypedNode } from '@sittir/types';
import { assertHoldsTree, holdTreeOn, releaseTreeOn, treeTokenOf, type TreeToken } from './tree-token.ts';
import { forEachTriviaList, type TriviaSides } from './trivia.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export const HANDLE_KEYS = ['$handle', '$parentHandle', '$treeHandle'] as const;

const COORDINATE_KEYS = [...HANDLE_KEYS, '$span', '$childIndex', '$textOnly'] as const;

/**
 * Give every parsed object under `value` the tree's token, through slots and
 * trivia. A coordinate is a number, which keeps nothing alive: a leaf is
 * plain data, and once a built node is all that holds it, nothing else of
 * its tree is reachable. Every object needs the token because any of them
 * can cross as a coordinate on its own.
 */
export function holdTree(value: unknown, token: TreeToken): void {
	forEachParsedObject(value, (node) => holdTreeOn(node, token));
}

/** `holdTree` for what a read returned: each object also records that a read produced it (`isRead`). */
export function holdReadTree(value: unknown, token: TreeToken): void {
	forEachParsedObject(value, (node) => {
		holdTreeOn(node, token);
		readObjects.add(node);
	});
}

const readObjects = new WeakSet<object>();

/** Whether a read produced `node`, or rebuilt it from one that did (`carryRead`). A copy made any other way is not. */
export function isRead(node: object): boolean {
	return readObjects.has(node);
}

/** Make `to` count as read when `from` does, and return `to`: for a read node a wrap or a materialization rebuilds. */
export function carryRead<T>(from: object, to: T): T {
	if (readObjects.has(from) && to !== null && typeof to === 'object') readObjects.add(to);
	return to;
}

function forEachParsedObject(value: unknown, visit: (node: Record<string, unknown>) => void): void {
	if (Array.isArray(value)) {
		for (const entry of value) forEachParsedObject(entry, visit);
		return;
	}
	if (!isRecord(value)) return;
	if (typeof value.$type === 'number') visit(value);
	for (const key in value) {
		if (isStorageKey(key)) forEachParsedObject(value[key], visit);
	}
	if (value.$_trivia != null) forEachTriviaList(value.$_trivia as TriviaSides<unknown>, (entries) => forEachParsedObject(entries, visit));
}

/**
 * The tree a node's handle names, whichever handle it carries: every handle is
 * tagged with its tree, so each one identifies it.
 */
export function treeHandleOf(node: object): number | undefined {
	const record = node as Partial<Record<(typeof HANDLE_KEYS)[number], unknown>>;
	const handle = record.$handle ?? record.$parentHandle ?? record.$treeHandle;
	return typeof handle === 'number' ? handle : undefined;
}

/** Whether `key` names storage on a node: a slot (`_<name>`) or its unslotted children (`$other`). */
export function isStorageKey(key: string): boolean {
	return key.charCodeAt(0) === 95 || key === '$other';
}

const MEMBER_KEYS: ReadonlySet<string> = new Set(['$with', '$trivia', '$engine', '$render']);

/**
 * Whether `key` carries node data across the boundary: a storage key, or a `$` metadata key that
 * is not one of the node's members. A reader, a list index, `length` and a list option are
 * members, so none of them is data.
 */
export function isDataKey(key: string): boolean {
	return isStorageKey(key) || (key.charCodeAt(0) === 36 && !MEMBER_KEYS.has(key));
}

/** Whether `node` holds storage: a slot, or unslotted children. A text leaf and a token hold none. */
export function holdsSlots(node: object): boolean {
	for (const key in node) if (key.charCodeAt(0) === 95) return true;
	return (node as { readonly $other?: unknown }).$other != null;
}

function isInert(value: unknown): boolean {
	if (Array.isArray(value)) return value.every(isInert);
	return value === null || typeof value !== 'object';
}

/**
 * A node read as text whose slots are only kind ids, booleans and bare text
 * projected from that text (a lexed token's interior) and that still spans
 * the bytes it was read from: nothing was rebuilt, so it stays the
 * coordinate its text names. An edit detaches the span, which ends this.
 */
function isDerivedFromText(record: Record<string, unknown>): boolean {
	if (typeof record.$text !== 'string' || !isRecord(record.$span) || record.$other != null) return false;
	for (const key of Object.keys(record)) if (key.charCodeAt(0) === 95 && !isInert(record[key])) return false;
	return true;
}

/**
 * Whether nothing under `value` was rebuilt: it still spans the bytes it was
 * read from, and the same holds all the way down. A kind id, a boolean or a
 * bare string in a slot is inert — the parent's own coordinate is what
 * places it, and an edit that put it there detached that coordinate at the
 * setter.
 *
 * A span is the whole requirement below the node that folds: that node names
 * the tree, and what lies below it is carried by its bytes, whatever handles
 * it holds. A descendant's attached comments do not keep an ancestor
 * from folding: they lie inside the ancestor's span, so its bytes carry
 * them — only a node's OWN trivia sits outside its span, which is why
 * `canFold` refuses that node and no other.
 */
function isUntouchedBelow(value: unknown): boolean {
	if (Array.isArray(value)) return value.every(isUntouchedBelow);
	if (value === undefined || value === null || typeof value !== 'object') return true;
	const record = value as Record<string, unknown>;
	if (!isRecord(record.$span)) return false;
	for (const key of Object.keys(record)) {
		if (isStorageKey(key) && !isUntouchedBelow(record[key])) return false;
	}
	return true;
}

/**
 * Whether this node can cross as a coordinate: it still names its tree and
 * its span, carries no trivia outside that span, and nothing below it was
 * rebuilt. The handle says which tree the span indexes into. Every node a
 * read hands back names its tree (its own handle, its parent's, or the
 * tree's tag on a child the read expanded), because an edit detaches the
 * coordinate of the node it rebuilds and each untouched child below then
 * folds on its own.
 */
function canFold(record: Record<string, unknown>, trivia: unknown): boolean {
	if (treeHandleOf(record) === undefined || !isRecord(record.$span)) return false;
	if (hasOutsideTrivia(trivia)) return false;
	return isUntouchedBelow(record);
}

/**
 * Whether trivia lies outside the node's span: leading or trailing entries. A
 * read's inner entries sit inside the span, so the coordinate already covers
 * them.
 */
function hasOutsideTrivia(trivia: unknown): boolean {
	if (!isRecord(trivia)) return false;
	return trivia.leading != null || trivia.trailing != null;
}

/**
 * The coordinate a folded node crosses as: identity, its span and the tree
 * that span slices, no storage.
 */
function foldToCoordinate(record: Record<string, unknown>): Record<string, unknown> {
	const out: Record<string, unknown> = { $type: record.$type };
	for (const key of ['$source', '$named', '$span']) {
		if (record[key] !== undefined) out[key] = record[key];
	}
	out.$treeHandle = treeHandleOf(record);
	for (const key of ['$textOnly', '$format']) {
		if (record[key] !== undefined) out[key] = record[key];
	}
	return out;
}

/**
 * Detach the fact an edit invalidates: the coordinate into the source this
 * node was read from. A `$with` setter spreads the node it edits, so without
 * this the new node would still fold to the pre-edit bytes. Recorded here,
 * at the edit, because an emptied node and a node that parsed childless have
 * the same shape afterwards and only the first is dirty.
 *
 * The rest-spread copies the tree token with the other members, so the token
 * is removed from the copy: a rebuilt node names no tree.
 */
export function markEdited<T extends object>(data: T): Omit<T, (typeof COORDINATE_KEYS)[number]> {
	const {
		$handle: _handle,
		$parentHandle: _parentHandle,
		$treeHandle: _treeHandle,
		$span: _span,
		$childIndex: _index,
		$textOnly: _textOnly,
		...rest
	} = data as T & Record<(typeof COORDINATE_KEYS)[number], unknown>;
	releaseTreeOn(rest);
	return rest;
}

/**
 * `markEdited` for a node edited in place: the node keeps its identity and
 * methods, and loses the coordinate that would fold it back to its pre-edit
 * bytes. A write of inner trivia is such an edit, since the coordinate's span
 * already covers the gap the new entries sit in.
 */
export function detachCoordinate(data: object): void {
	for (const key of COORDINATE_KEYS) delete (data as Record<string, unknown>)[key];
	releaseTreeOn(data);
}

/**
 * Turn a node into the plain data the native boundary accepts.
 *
 * The wrap surface carries accessor methods and `$with`; only data crosses
 * to napi. This copies the storage (`_`-keys and `$other`) through, drops
 * everything callable, and strips `$text` and the coordinate keys
 * (the handles, `$span`, `$childIndex`) from every node that carries
 * storage — that node rebuilds from its slots, so neither its pre-edit
 * text nor the coordinate that would slice that text may cross.
 *
 * A node that still names its tree and was not rebuilt below crosses as its
 * coordinate alone (`canFold`), its `$span` and the `$treeHandle`
 * that span slices, which the transport's slot carrier
 * slices from the source the engine still holds. That is what keeps an
 * untouched subtree's original bytes while its rebuilt siblings render
 * canonically.
 */
export function toTransportData(node: AnyUntypedNode, view: TriviaView = storedView): AnyUntypedNode {
	return toTransportValue(node, view, BOTH_EDGES) as AnyUntypedNode;
}

/** How a node's trivia crosses: the entries it carries, and the sibling its leading line gaps separate it from in its source. */
export interface TriviaView {
	readonly trivia: (node: Record<string, unknown>) => unknown;
	readonly previous: (node: Record<string, unknown>) => { readonly start: number; readonly end: number } | null | undefined;
}

const storedView: TriviaView = { trivia: (node) => node.$_trivia, previous: () => undefined };

/** The edges of a node whose neighbour is not the one its source had there. */
interface ChangedEdges {
	readonly leading: boolean;
	readonly trailing: boolean;
}

const NO_EDGES: ChangedEdges = { leading: false, trailing: false };
const BOTH_EDGES: ChangedEdges = { leading: true, trailing: true };

function changedEdges(list: readonly unknown[], index: number, view: TriviaView): ChangedEdges {
	const entry = list[index];
	if (!isRecord(entry)) return NO_EDGES;
	const previous = view.previous(entry);
	if (previous === undefined) return NO_EDGES;
	const before = list[index - 1];
	return {
		leading: index === 0 ? previous !== null : previous === null || !(isRecord(before) && isSourceSibling(before, entry, previous)),
		trailing: index < list.length - 1
	};
}

function isSourceSibling(candidate: Record<string, unknown>, node: Record<string, unknown>, span: { readonly start: number; readonly end: number }): boolean {
	const own = candidate.$span as { readonly start?: unknown; readonly end?: unknown } | undefined;
	return treeTokenOf(candidate) === treeTokenOf(node) && own?.start === span.start && own?.end === span.end;
}

function withoutChangedEdges(trivia: unknown, changed: ChangedEdges): unknown {
	if (!isRecord(trivia) || (!changed.leading && !changed.trailing)) return trivia;
	const leading = trivia.leading as readonly unknown[] | undefined;
	const trailing = trivia.trailing as readonly unknown[] | undefined;
	const first = leading?.findIndex((entry) => typeof entry !== 'number') ?? -1;
	const last = trailing?.findLastIndex((entry) => typeof entry !== 'number') ?? -1;
	const kept: Record<string, unknown> = { ...trivia };
	if (changed.leading) kept.leading = first < 0 ? undefined : leading!.slice(first);
	if (changed.trailing) kept.trailing = last < 0 ? undefined : trailing!.slice(0, last + 1);
	for (const side of ['leading', 'trailing'] as const) if (kept[side] === undefined) delete kept[side];
	return Object.keys(kept).length === 0 ? undefined : kept;
}

function assertTriviaHoldsTree(entries: readonly unknown[]): void {
	for (const entry of entries) if (isRecord(entry) && treeHandleOf(entry) !== undefined) assertHoldsTree(entry);
}

function toTransportValue(value: unknown, view: TriviaView, changed: ChangedEdges): unknown {
	if (Array.isArray(value)) return value.map((entry, index) => toTransportValue(entry, view, changedEdges(value, index, view)));
	if (!isRecord(value)) return value;
	const trivia = withoutChangedEdges(view.trivia(value), changed);
	const held = !changed.leading && view.previous(value) !== undefined;
	if (canFold(value, trivia)) {
		assertHoldsTree(value);
		return foldToCoordinate(value);
	}
	// Trivia entries cross as they are, coordinates included.
	if (trivia != null) forEachTriviaList(trivia as TriviaSides<unknown>, assertTriviaHoldsTree);
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(value)) {
		if (!isDataKey(key) || key === '$_trivia') continue;
		const raw = value[key];
		if (typeof raw === 'function') continue;
		out[key] = isStorageKey(key) ? toTransportValue(raw, view, NO_EDGES) : raw;
	}
	if (trivia != null) out.$_trivia = held ? { ...trivia, held } : trivia;
	// Past the fold, nothing is a coordinate: a leaf that kept its trivia
	// crosses as itself, and a storage-bearing node rebuilds from its slots
	// with neither its pre-edit text nor the span that would slice it.
	for (const key of HANDLE_KEYS) delete out[key];
	delete out.$childIndex;
	delete out.$textOnly;
	if (holdsSlots(out)) {
		delete out.$text;
		delete out.$span;
	}
	return out;
}

/** Remove the tree token from everything under `value`, through slots and trivia: transport data holds no tree. */
function dropTreeTokens(value: unknown): void {
	if (Array.isArray(value)) {
		for (const entry of value) dropTreeTokens(entry);
		return;
	}
	if (!isRecord(value)) return;
	releaseTreeOn(value);
	for (const key in value) if (isStorageKey(key)) dropTreeTokens(value[key]);
	dropTriviaTreeTokens(value);
}

function dropTriviaTreeTokens(node: Record<string, unknown>): void {
	if (node.$_trivia != null) forEachTriviaList(node.$_trivia as TriviaSides<unknown>, dropTreeTokens);
}

/**
 * Drop the pre-edit spelling and the coordinate that would slice it from
 * every node that carries storage, in place, and return `root`. For
 * transport data that came through a path other than
 * {@link toTransportData}. A coordinate that survives addresses its node's
 * text only: it crosses as the `$treeHandle` its span slices, stamped
 * `$textOnly` so no edge or gap reader takes layout evidence from it.
 *
 * The result holds no tree: a surviving coordinate is valid only while the
 * caller keeps its tree live by other means.
 */
export function detachCoordinates<T>(root: T): T {
	const seen = new WeakSet<object>();
	const recurse = (value: unknown): void => {
		if (!isRecord(value) || typeof value.$type !== 'number') return;
		if (seen.has(value)) return;
		seen.add(value);
		if (holdsSlots(value) && !isDerivedFromText(value)) {
			delete value.$text;
			for (const key of COORDINATE_KEYS) delete value[key];
		}
		releaseTreeOn(value);
		dropTriviaTreeTokens(value);
		const tree = treeHandleOf(value);
		if (tree !== undefined) {
			delete value.$handle;
			delete value.$parentHandle;
			value.$treeHandle = tree;
			value.$textOnly = true;
		}
		for (const key of Object.keys(value)) {
			if (!isStorageKey(key)) continue;
			const child = value[key];
			if (Array.isArray(child)) for (const entry of child) recurse(entry);
			else recurse(child);
		}
	};
	recurse(root);
	return root;
}
