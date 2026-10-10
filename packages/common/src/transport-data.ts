import type { AnyUntypedNode, NodeLayout, TransportCoordinate } from '@sittir/types';
import { decodeIndex, decodeTree, isCoordinate } from './read.ts';
import { assertHoldsTree, holdTreeOn, releaseTreeOn, treeOf, treeTokenOf, type TreeToken } from './tree-token.ts';
import { editedWithin } from './identity.ts';
import { forEachTriviaList, type TriviaSides } from './trivia.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** The coordinate a read node came from (`$_layout.at`), or the node itself when it is a coordinate. */
export function coordinateOf(node: object): TransportCoordinate | undefined {
	if (isCoordinate(node)) return node;
	const at = (node as { readonly $_layout?: NodeLayout }).$_layout?.at;
	return at !== undefined && isCoordinate(at) ? at : undefined;
}

/** The trivia a node owns: its layout's, read or written. */
export function triviaOf(node: object): NodeLayout['trivia'] {
	return (node as { readonly $_layout?: NodeLayout }).$_layout?.trivia;
}

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
	const trivia = triviaOf(value);
	if (trivia != null) forEachTriviaList(trivia as TriviaSides<unknown>, (entries) => forEachParsedObject(entries, visit));
}

/** The handle a read node or a coordinate names itself by: its tree and its descendant index. */
export function treeHandleOf(node: object): number | undefined {
	return coordinateOf(node)?.$treeHandle;
}

/** The descendant index a read node or a coordinate names itself by, in its tree. */
export function indexOf(node: object): number | undefined {
	const handle = treeHandleOf(node);
	return handle === undefined ? undefined : decodeIndex(handle);
}

/** Whether `key` names one of a node's slots (`_<name>`). */
export function isSlotKey(key: string): boolean {
	return key.charCodeAt(0) === 95;
}

/** Whether `key` names storage on a node: a slot (`_<name>`). */
export function isStorageKey(key: string): boolean {
	return isSlotKey(key);
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

/** Whether `node` holds storage: a slot. A text leaf and a token hold none. */
export function holdsSlots(node: object): boolean {
	for (const key in node) if (isSlotKey(key)) return true;
	return false;
}

/**
 * The coordinate a node crosses to the render as (`$_layout.at`) in place of
 * its storage: a node of a live tree whose range holds no edit inside it.
 * Outside trivia does not stop it: it renders around the folded bytes.
 */
function foldedCoordinate(record: Record<string, unknown>): TransportCoordinate | undefined {
	const coordinate = coordinateOf(record);
	if (coordinate === undefined) return undefined;
	const tree = treeOf(record);
	if (tree === undefined) return undefined;
	return editedWithin(tree, decodeIndex(coordinate.$treeHandle), coordinate.$end) ? undefined : coordinate;
}

/**
 * A coordinate a holder stores without having read it, as it crosses: its
 * bytes, unless a write landed inside its range. That write lives on the node
 * another route read, which this holder does not hold, so its bytes would
 * silently drop the write; the crossing refuses instead, naming the range.
 */
function unreadCoordinate(coordinate: TransportCoordinate): TransportCoordinate {
	const tree = treeOf(coordinate);
	const index = decodeIndex(coordinate.$treeHandle);
	if (tree === undefined || !editedWithin(tree, index, coordinate.$end)) return coordinate;
	throw new Error(
		`render: nodes ${index}..${coordinate.$end} of tree ${decodeTree(coordinate.$treeHandle)} are held here as a coordinate this holder never read, and a write landed inside that range on a node read through another route. The write lives on that node, not on this holder, so it cannot render here. Read the slot through this holder's accessor before rendering, or render the node the write was made on`
	);
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

/** The placement facts a trivia entry carries beside its coordinate: whether it sits on its owner's line, and the tokens between them. */
const ENTRY_PLACEMENT_KEYS = ['$sameLine', '$tokensBetween'] as const;

/** Copy `from`'s placement facts onto `to`, and return `to`. */
export function carryPlacement<T extends object>(from: object, to: T): T {
	for (const key of ENTRY_PLACEMENT_KEYS) if (key in from) (to as Record<string, unknown>)[key] = (from as Record<string, unknown>)[key];
	return to;
}

/** A coordinate as transport data: its four fields and its placement facts, holding no tree. */
function plainCoordinate(coordinate: TransportCoordinate): Record<string, unknown> {
	return carryPlacement(coordinate, {
		$treeHandle: coordinate.$treeHandle,
		$end: coordinate.$end,
		$span: { start: coordinate.$span.start, end: coordinate.$span.end },
		$type: coordinate.$type
	});
}

/**
 * The coordinate a folded node crosses as: its `$_layout.at`, with the format
 * stamp it carries and its outside trivia (`$_layout.trivia`, leading and
 * trailing only: inner entries lie inside the span, so its bytes carry them).
 */
function foldToCoordinate(record: Record<string, unknown>, coordinate: TransportCoordinate, trivia: unknown): Record<string, unknown> {
	const out = carryPlacement(record, plainCoordinate(coordinate));
	if (record.$format !== undefined) out.$format = record.$format;
	if (isRecord(trivia) && hasOutsideTrivia(trivia)) {
		setLayout(out, 'trivia', { ...(trivia.leading != null ? { leading: trivia.leading } : {}), ...(trivia.trailing != null ? { trailing: trivia.trailing } : {}) });
	}
	return out;
}

/** `layout` without its coordinate; `undefined` when nothing else is left. */
function withoutAt(layout: NodeLayout | undefined): NodeLayout | undefined {
	if (layout === undefined) return undefined;
	const { at: _at, ...rest } = layout;
	return Object.keys(rest).length === 0 ? undefined : rest;
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
export function markEdited<T extends object>(data: T): T {
	const { $_layout, ...rest } = data as T & { readonly $_layout?: NodeLayout };
	const layout = withoutAt($_layout);
	const out = (layout === undefined ? rest : { ...rest, $_layout: layout }) as T;
	releaseTreeOn(out);
	return out;
}

/**
 * Where a node sits in the source it came from: the tree, held by its token,
 * and the node's span and stamped kind there, and its own handle when the
 * reader addressed it by one, which names it where its span alone may not.
 */
export interface SourceIdentity {
	readonly token: TreeToken;
	readonly treeHandle: number;
	readonly span: { readonly start: number; readonly end: number };
	readonly kind: number;
}

const SOURCE = Symbol('sittir.source');

/**
 * The source identity of a node: a read node's own coordinate and tree, or
 * the identity an edit carried forward from the node it rebuilt
 * (`markEdited`). Evidence of layout only; nothing slices it.
 */
export function sourceOf(node: object): SourceIdentity | undefined {
	const carried = (node as { [SOURCE]?: SourceIdentity })[SOURCE];
	if (carried !== undefined) return carried;
	const token = treeTokenOf(node);
	const at = coordinateOf(node);
	if (token === undefined || at === undefined) return undefined;
	return { token, treeHandle: at.$treeHandle, span: at.$span, kind: at.$type };
}

/** Make `to` keep the source identity `from` has: the node an edit rebuilt from it. */
export function carrySource(from: object, to: object): void {
	const source = sourceOf(from);
	if (source !== undefined) Object.defineProperty(to, SOURCE, { value: source, enumerable: false, configurable: true });
}


/**
 * `markEdited` for a node edited in place: the node keeps its identity and
 * methods, and loses the coordinate that would fold it back to its pre-edit
 * bytes. A write of inner trivia is such an edit, since the coordinate's span
 * already covers the gap the new entries sit in.
 */
export function detachCoordinate(data: object): void {
	const record = data as { $_layout?: NodeLayout };
	const layout = withoutAt(record.$_layout);
	if (layout === undefined) delete record.$_layout;
	else record.$_layout = layout;
	releaseTreeOn(data);
}

/**
 * Turn a node into the plain data the native boundary accepts.
 *
 * The wrap surface carries accessor methods and `$with`; only data crosses
 * to napi. This copies the storage (`_`-keys) through, drops everything
 * callable, and drops the node's own coordinate (`$_layout.at`) from every
 * node that does not fold: that node rebuilds from its slots, so the
 * coordinate that would slice its pre-edit text may not cross.
 *
 * A node that still names itself and was not rebuilt below crosses as its
 * coordinate alone (`foldedCoordinate`): its `$_layout.at`, which the transport's slot
 * carrier slices from the source the engine still holds. That is what keeps
 * an untouched subtree's original bytes while its rebuilt siblings render
 * canonically.
 */
export function toTransportData(node: AnyUntypedNode, view: TriviaView): AnyUntypedNode {
	return toTransportValue(node, view, BOTH_EDGES, true) as AnyUntypedNode;
}

/**
 * `toTransportData` for data that will leave the tree it was read from: the
 * same trivia, gaps and flanks, judged the same way, but no node is folded to
 * a coordinate, so every node crosses as its own storage and nothing but the
 * layout evidence still names the tree. The caller turns that evidence into
 * the text it names.
 */
export function toDetachedTransportData(node: AnyUntypedNode, view: TriviaView): AnyUntypedNode {
	return toTransportValue(node, view, BOTH_EDGES, false) as AnyUntypedNode;
}

/** The sides of a read node's trivia derived from its line gaps, and the sibling its leading runs separate it from in its source. */
export interface DerivedSides {
	readonly previous: { readonly start: number; readonly end: number } | null;
	readonly next: { readonly start: number; readonly end: number } | null;
	readonly leading: boolean;
	readonly trailing: boolean;
}

/** How a node's trivia crosses: the entries it carries, and which of them its read derived. */
export interface TriviaView {
	readonly trivia: (node: Record<string, unknown>) => unknown;
	readonly derived: (node: Record<string, unknown>) => DerivedSides | undefined;
	readonly isWrapper: (kindId: number) => boolean;
	readonly isList: (kindId: number) => boolean;
}

/** The view of data whose trivia is all stored: nothing is derived. */
export const STORED_TRIVIA: TriviaView = { trivia: (node) => triviaOf(node), derived: () => undefined, isWrapper: () => false, isList: () => false };

/** The edges of a node whose neighbour is not the one its source had there. */
export interface ChangedEdges {
	readonly leading: boolean;
	readonly trailing: boolean;
}

const NO_EDGES: ChangedEdges = { leading: false, trailing: false };
const BOTH_EDGES: ChangedEdges = { leading: true, trailing: true };

function changedEdges(list: readonly unknown[], index: number, view: TriviaView): ChangedEdges {
	const entry = list[index];
	if (!isRecord(entry)) return NO_EDGES;
	const derived = view.derived(evidenceOf(entry, view));
	if (derived === undefined) return NO_EDGES;
	const kept = index === 0 ? derived.previous === null : sourceAdjacent(list, index, derived, view);
	return { leading: derived.leading && !kept, trailing: derived.trailing && index < list.length - 1 };
}

function sourceAdjacent(list: readonly unknown[], index: number, derived: DerivedSides, view: TriviaView): boolean {
	const before = list[index - 1];
	const entry = list[index];
	return (
		derived.previous !== null &&
		isRecord(before) &&
		isRecord(entry) &&
		isSourceSibling(evidenceOf(before, view), evidenceOf(entry, view), derived.previous)
	);
}

function isPresent(value: unknown): boolean {
	return value != null && !(Array.isArray(value) && value.length === 0);
}

/**
 * The node whose source identity stands for a list entry: the entry itself,
 * or, for an entry of a kind a rebuild constructs around an existing node
 * (`TriviaView.isWrapper`) that holds exactly one present node, that node.
 */
function evidenceOf(entry: Record<string, unknown>, view: TriviaView): Record<string, unknown> {
	if (sourceOf(entry) !== undefined || typeof entry.$type !== 'number' || !view.isWrapper(entry.$type)) return entry;
	const held = Object.keys(entry).flatMap((key) => (isSlotKey(key) && isPresent(entry[key]) ? [entry[key]] : []));
	const [only] = held;
	return held.length === 1 && isRecord(only) ? evidenceOf(only, view) : entry;
}

/**
 * The source bytes between a list item and the item before it, when the two
 * are still adjacent there and no derived line-gap run already spells that
 * gap: the range from the predecessor's end to the item's start in the tree
 * both were read from. Sent only while `owner`, the node holding the items,
 * carries source identity, as the list's flanks are (`sourceFlankOf`): a list
 * with no source keeps none of its source layout.
 */
export function sourceGapOf(
	owner: Record<string, unknown>,
	list: readonly unknown[],
	index: number,
	view: TriviaView,
	trivia: unknown
): SourceGapEvidence | undefined {
	const entry = list[index];
	if (index === 0 || !isRecord(entry) || sourceOf(owner) === undefined) return undefined;
	const evidence = evidenceOf(entry, view);
	const derived = view.derived(evidence);
	if (derived === undefined || derived.previous === null || !sourceAdjacent(list, index, derived, view)) return undefined;
	if (isRecord(trivia) && typeof (trivia.leading as readonly unknown[] | undefined)?.[0] === 'number') return undefined;
	const source = sourceOf(evidence);
	if (source === undefined) return undefined;
	return { $treeHandle: source.treeHandle, $span: { start: derived.previous.end, end: source.span.start } };
}

/**
 * Whether `node` names the parser node `owner` names: an alias envelope's
 * content does. The trivia derived from that node's line gaps is the
 * owner's, so the node crosses with its stored trivia only.
 */
function namesSameNode(owner: Record<string, unknown>, node: Record<string, unknown>): boolean {
	const own = sourceOf(owner);
	const other = sourceOf(node);
	return own !== undefined && other !== undefined && own.token === other.token && own.treeHandle === other.treeHandle;
}

function isSourceSibling(candidate: Record<string, unknown>, node: Record<string, unknown>, span: { readonly start: number; readonly end: number }): boolean {
	const own = sourceOf(candidate);
	const other = sourceOf(node);
	return own !== undefined && other !== undefined && own.token === other.token && own.span.start === span.start && own.span.end === span.end;
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

/** A list item's gap toward the item before it as the transport sends it: the gap's range in its tree. */
export interface SourceGapEvidence {
	readonly $treeHandle: number;
	readonly $span: { readonly start: number; readonly end: number };
}

/** A list node's flanks as the transport sends them: its source span in its tree, and which flanks it keeps. */
export interface SourceFlankEvidence {
	readonly $treeHandle: number;
	readonly $span: { readonly start: number; readonly end: number };
	readonly $before: boolean;
	readonly $after: boolean;
}

/**
 * A node's layout as the transport sends it (`$_layout`): the trivia that
 * crosses with it, and the source evidence a rebuilt node keeps, its gap
 * toward the list item before it and, for a list, its flanks. Absent when
 * the node has none of these. A node's own coordinate (`at`) never crosses
 * here: a node that keeps it crosses as it (`foldedCoordinate`).
 */
export interface TransportLayout {
	trivia?: unknown;
	gap?: SourceGapEvidence;
	flank?: SourceFlankEvidence;
}

function setLayout<K extends keyof TransportLayout>(out: Record<string, unknown>, key: K, value: TransportLayout[K]): void {
	const layout = (out.$_layout ??= {}) as TransportLayout;
	layout[key] = value;
}

/**
 * The items of a list node: the one array a list kind (`TriviaView.isList`)
 * holds in its slots.
 */
function listItemsOf(record: Record<string, unknown>, view: TriviaView): readonly Record<string, unknown>[] | undefined {
	if (typeof record.$type !== 'number' || !view.isList(record.$type)) return undefined;
	const held = Object.keys(record).flatMap((key) => {
		const value = record[key];
		return isSlotKey(key) && isPresent(value) && (isRecord(value) || Array.isArray(value)) ? [value] : [];
	});
	const [only] = held;
	return held.length === 1 && Array.isArray(only) ? only.filter(isRecord) : undefined;
}

/**
 * A list node's flanks in the source it was read from, when it carries source
 * identity: the flank before is kept while its first item is still the
 * source's first item of this list, the flank after while its last item is
 * still the source's last. `undefined` for anything that is not a list node
 * with source identity.
 */
export function sourceFlankOf(record: Record<string, unknown>, view: TriviaView): SourceFlankEvidence | undefined {
	const items = listItemsOf(record, view);
	const source = sourceOf(record);
	if (items === undefined || items.length === 0 || source === undefined) return undefined;
	const inList = (item: Record<string, unknown>): SourceIdentity | undefined => {
		const own = sourceOf(item);
		return own !== undefined && own.token === source.token && own.span.start >= source.span.start && own.span.end <= source.span.end ? own : undefined;
	};
	const first = evidenceOf(items[0]!, view);
	const last = evidenceOf(items[items.length - 1]!, view);
	return {
		$treeHandle: source.treeHandle,
		$span: source.span,
		$before: inList(first) !== undefined && view.derived(first)?.previous === null,
		$after: inList(last) !== undefined && view.derived(last)?.next === null
	};
}

/**
 * A node's trivia as it crosses: without the runs whose neighbour changed,
 * and, for a list node, without the derived runs at its flanks, which its
 * source flanks spell instead (`sourceFlankOf`), so each flank has one source.
 */
export function crossingTrivia(record: Record<string, unknown>, view: TriviaView, changed: ChangedEdges = NO_EDGES): unknown {
	const trivia = withoutChangedEdges(view.trivia(record), changed);
	return listItemsOf(record, view) === undefined ? trivia : withoutChangedEdges(trivia, BOTH_EDGES);
}

function assertTriviaHoldsTree(entries: readonly unknown[]): void {
	for (const entry of entries) if (isRecord(entry) && treeHandleOf(entry) !== undefined) assertHoldsTree(entry);
}

function toTransportValue(
	value: unknown,
	view: TriviaView,
	changed: ChangedEdges,
	fold: boolean,
	owner?: Record<string, unknown>,
	bearer?: Record<string, unknown>
): unknown {
	if (Array.isArray(value)) {
		return value.map((entry, index) => {
			if (!isRecord(entry)) return toTransportValue(entry, view, NO_EDGES, fold);
			const evidence = evidenceOf(entry, view);
			const changed = changedEdges(value, index, view);
			const out = toTransportValue(entry, view, changed, fold, undefined, evidence);
			const gap = owner !== undefined ? sourceGapOf(owner, value, index, view, withoutChangedEdges(view.trivia(evidence), changed)) : undefined;
			if (gap !== undefined && isRecord(out)) setLayout(out, 'gap', gap);
			return out;
		});
	}
	if (!isRecord(value)) return value;
	if (isCoordinate(value) && !fold) return plainCoordinate(value);
	const bears = bearer === undefined || bearer === value;
	const trivia = owner !== undefined && namesSameNode(owner, value) ? triviaOf(value) : crossingTrivia(value, view, bears ? changed : NO_EDGES);
	// Trivia entries cross as they are, coordinates included.
	if (fold && trivia != null) forEachTriviaList(trivia as TriviaSides<unknown>, assertTriviaHoldsTree);
	const folded = !fold ? undefined : isCoordinate(value) ? unreadCoordinate(value) : foldedCoordinate(value);
	if (folded !== undefined) {
		assertHoldsTree(value);
		return foldToCoordinate(value, folded, trivia);
	}
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(value)) {
		if (!isDataKey(key) || key === '$_layout') continue;
		const raw = value[key];
		if (typeof raw === 'function') continue;
		out[key] = isStorageKey(key) ? toTransportValue(raw, view, bears ? NO_EDGES : changed, fold, value, bears ? undefined : bearer) : raw;
	}
	const given = (value as { readonly $_layout?: TransportLayout }).$_layout;
	if (given?.gap !== undefined) setLayout(out, 'gap', given.gap);
	if (given?.flank !== undefined) setLayout(out, 'flank', given.flank);
	if (trivia != null) setLayout(out, 'trivia', trivia);
	const flank = sourceFlankOf(value, view);
	if (flank !== undefined) setLayout(out, 'flank', flank);
	// Past the fold, nothing is a coordinate: a leaf that kept its trivia
	// crosses as itself, and a storage-bearing node rebuilds from its slots.
	if (holdsSlots(out)) delete out.$text;
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
	const trivia = triviaOf(node);
	if (trivia != null) forEachTriviaList(trivia as TriviaSides<unknown>, dropTreeTokens);
}

/**
 * Drop the coordinate that would slice a node's pre-edit bytes from every
 * node that carries storage, in place, and return `root`. For transport data
 * that came through a path other than {@link toTransportData}. A coordinate
 * that survives, on a text leaf or a node past the read's depth, addresses
 * that node's bytes only.
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
		if (holdsSlots(value)) detachCoordinate(value);
		releaseTreeOn(value);
		dropTriviaTreeTokens(value);
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
