import type { AnyUntypedNode, NodeLayout, NodeTrivia, TransportCoordinate, TriviaEntry } from '@sittir/types';
import { decodeIndex, isCoordinate, type Siblings, type TreeHandle, type TriviaSideName } from './read.ts';
import { assertHoldsTree, holdTreeOn, releaseTreeOn, treeOf, treeOfToken, treeTokenOf, type TreeToken } from './tree-token.ts';
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

/** The handle a node names its tree by: its own coordinate's, or, for a node rebuilt from a read one, its source's. */
export function sourceHandleOf(node: object): number | undefined {
	return coordinateOf(node)?.$treeHandle ?? sourceOf(node)?.treeHandle;
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

/** A coordinate as transport data: its four fields, holding no tree. */
function plainCoordinate(coordinate: { readonly $treeHandle: number; readonly $end: number; readonly $span: { readonly start: number; readonly end: number }; readonly $type?: number }): Record<string, unknown> {
	return { $treeHandle: coordinate.$treeHandle, $end: coordinate.$end, $span: { start: coordinate.$span.start, end: coordinate.$span.end }, $type: coordinate.$type };
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
 * and the node's coordinate there.
 */
export interface SourceIdentity {
	readonly token: TreeToken;
	readonly treeHandle: number;
	readonly end: number;
	readonly span: { readonly start: number; readonly end: number };
	readonly kind: number;
}

const SOURCE = Symbol('sittir.source');

/**
 * The source identity of a node: a read node's own coordinate and tree, or
 * the identity an edit carried forward from the node it rebuilt
 * (`carrySource`). Evidence of layout only; nothing slices it.
 */
export function sourceOf(node: object): SourceIdentity | undefined {
	const carried = (node as { [SOURCE]?: SourceIdentity })[SOURCE];
	if (carried !== undefined) return carried;
	const token = treeTokenOf(node);
	const at = coordinateOf(node);
	if (token === undefined || at === undefined) return undefined;
	return { token, treeHandle: at.$treeHandle, end: at.$end, span: at.$span, kind: at.$type };
}

/** Make `to` keep the source identity `from` has: the node an edit rebuilt from it. */
export function carrySource(from: object, to: object): void {
	const source = sourceOf(from);
	if (source !== undefined) Object.defineProperty(to, SOURCE, { value: source, enumerable: false, configurable: true });
}

/** A tree whose trivia table answers for a node: the tree and the node's index in it. */
interface TableAt {
	readonly tree: Required<Pick<TreeHandle, 'triviaSide' | 'writeTriviaSide'>>;
	readonly index: number;
}

function tableOf(tree: TreeHandle | undefined, index: number | undefined): TableAt | undefined {
	return tree?.triviaSide === undefined || tree.writeTriviaSide === undefined || index === undefined
		? undefined
		: { tree: { triviaSide: tree.triviaSide, writeTriviaSide: tree.writeTriviaSide }, index };
}

/** The table that holds a parsed node's sides: its live tree's, at its own index; `undefined` for a built node. */
export function tableAt(node: object): TableAt | undefined {
	return tableOf(treeOf(node), indexOf(node));
}

/** The tree of the node a source identity names, while it lives. */
function sourceTree(source: SourceIdentity): TreeHandle | undefined {
	return treeOfToken(source.token);
}

/**
 * The sides of a node's unit children, by slot and item (`TransportLayout.units`): the ones it
 * holds, else its tree's for a parsed node, else those of the node it was rebuilt from
 * (`sourceOf`); `undefined` when none answers.
 */
export function unitSidesOf(node: object): readonly unknown[] | undefined {
	const held = (node as { readonly $_layout?: TransportLayout }).$_layout?.units;
	if (held !== undefined) return held;
	const tree = treeOf(node);
	const index = indexOf(node);
	if (tree?.unitSides !== undefined && index !== undefined) return tree.unitSides(index);
	const source = sourceOf(node);
	if (source === undefined) return undefined;
	return sourceTree(source)?.unitSides?.(decodeIndex(source.treeHandle));
}

/**
 * The entries of `side` of `node`: a parsed node's from its tree's trivia table, the written ones
 * or else the ones the table assigns it; a built node's stored side, else the side of the node it
 * was rebuilt from (`sourceOf`).
 */
export function sideOf(node: object, side: TriviaSideName): readonly TriviaEntry[] {
	const at = tableAt(node);
	if (at !== undefined) return at.tree.triviaSide(at.index, side) as TriviaEntry[];
	const stored = triviaOf(node)?.[side];
	if (stored !== undefined) return stored;
	const source = sourceOf(node);
	const table = source === undefined ? undefined : tableOf(sourceTree(source), decodeIndex(source.treeHandle));
	return table === undefined ? [] : (table.tree.triviaSide(table.index, side) as TriviaEntry[]);
}

/** Every non-empty side of `node` (`sideOf`); `undefined` when it has none. */
export function sidesOf(node: object): NodeTrivia | undefined {
	const sides: { -readonly [S in TriviaSideName]?: readonly TriviaEntry[] } = {};
	for (const side of ['leading', 'trailing', 'inner'] as const) {
		const entries = sideOf(node, side);
		if (entries.length > 0) sides[side] = entries;
	}
	return Object.keys(sides).length === 0 ? undefined : sides;
}

/**
 * Turn a node into the plain data the native boundary accepts.
 *
 * The wrap surface carries accessor methods and `$with`; only data crosses
 * to napi. This copies the storage (`_`-keys) through and drops everything
 * callable. The render root's edges change (`rootEdges`), on the node that
 * holds its sides (`rootBearer`). A parsed node of
 * a live tree crosses as its coordinate alone,
 * which the render slices from the source the engine still holds and frames
 * with the sides its tree's trivia table gives it; one whose range holds a
 * write is read there instead. A built node crosses as its storage and the
 * sides it holds, and names the node it was rebuilt from (`$_layout.sides`)
 * for the sides it does not hold.
 */
export function toTransportData(node: AnyUntypedNode, view: KindView): AnyUntypedNode {
	return toTransportValue(node, view, rootEdges(node), true, undefined, rootBearer(node, view)) as AnyUntypedNode;
}

/**
 * `toTransportData` for data that will leave the tree it was read from: no
 * node crosses as its coordinate, so every node crosses as its own storage
 * with its sides as data (`sidesOf`), and nothing but the layout evidence
 * still names the tree. An alias envelope and its content are one parser
 * node, whose sides the envelope holds. The caller turns that evidence into
 * the text it names.
 */
export function toDetachedTransportData(node: AnyUntypedNode, view: KindView): AnyUntypedNode {
	return toTransportValue(node, view, rootEdges(node), false, undefined, rootBearer(node, view)) as AnyUntypedNode;
}

/** How the crossing tells kinds apart: a kind a rebuild constructs around an existing node, and a list kind. */
export interface KindView {
	readonly isWrapper: (kindId: number) => boolean;
	readonly isList: (kindId: number) => boolean;
}

/** The view of data with no wrapper or list kinds. */
export const PLAIN_KINDS: KindView = { isWrapper: () => false, isList: () => false };

/** The edges of a node whose neighbour is not the one its source had there. */
export interface ChangedEdges {
	readonly leading: boolean;
	readonly trailing: boolean;
}

const NO_EDGES: ChangedEdges = { leading: false, trailing: false };
const BOTH_EDGES: ChangedEdges = { leading: true, trailing: true };

/**
 * The edges of a render root: it renders with no neighbour, so both changed,
 * unless it is its tree's root, whose edges are the document's.
 */
function rootEdges(node: object): ChangedEdges {
	const source = sourceOf(node);
	return source !== undefined && decodeIndex(source.treeHandle) === 0 ? NO_EDGES : BOTH_EDGES;
}

/**
 * The node that takes a render root's edges: the root, unless it is an alias
 * envelope whose content is the same parser node (the content's coordinate
 * carries the envelope's display id, which the reader stamps only there), in
 * which case the content holds that node's sides and takes the edges.
 */
function rootBearer(node: AnyUntypedNode, view: KindView): Record<string, unknown> | undefined {
	if (!isRecord(node)) return undefined;
	const evidence = evidenceOf(node, view);
	return evidence !== node && isAliasContent(node, evidence) ? evidence : node;
}

/** Whether `child` is the content of the alias envelope `holder`, the same parser node: its coordinate carries the envelope's display id. */
function isAliasContent(holder: Record<string, unknown>, child: unknown): boolean {
	return isRecord(child) && child.$type !== holder.$type && coordinateOf(child)?.$type === holder.$type;
}

/** The siblings beside the node a source identity names, while its tree lives. */
function siblingsOf(source: SourceIdentity): Siblings | undefined {
	return sourceTree(source)?.siblings?.(decodeIndex(source.treeHandle));
}

/** Whether `neighbour`, beside a node in its holder, is the sibling its source had there (`span`, `null` for none). */
function keepsNeighbour(span: Siblings['previous'], neighbour: unknown, token: TreeToken, view: KindView): boolean {
	if (span === null) return neighbour === undefined;
	if (typeof neighbour === 'number') return neighbour === span.kind;
	if (!isRecord(neighbour)) return false;
	const other = sourceOf(evidenceOf(neighbour, view));
	return other !== undefined && other.token === token && other.span.start === span.start && other.span.end === span.end;
}

function changedEdges(list: readonly unknown[], index: number, view: KindView): ChangedEdges {
	const entry = list[index];
	const source = isRecord(entry) ? sourceOf(evidenceOf(entry, view)) : undefined;
	const siblings = source === undefined ? undefined : siblingsOf(source);
	if (source === undefined || siblings === undefined) return NO_EDGES;
	return {
		leading: !keepsNeighbour(siblings.previous, list[index - 1], source.token, view),
		trailing: !keepsNeighbour(siblings.next, list[index + 1], source.token, view)
	};
}

function isPresent(value: unknown): boolean {
	return value != null && !(Array.isArray(value) && value.length === 0);
}

/**
 * The node whose source identity stands for a list entry: the entry itself,
 * or, for an entry of a kind a rebuild constructs around an existing node
 * (`KindView.isWrapper`) that holds exactly one present node, that node.
 */
function evidenceOf(entry: Record<string, unknown>, view: KindView): Record<string, unknown> {
	if (sourceOf(entry) !== undefined || typeof entry.$type !== 'number' || !view.isWrapper(entry.$type)) return entry;
	const held = Object.keys(entry).flatMap((key) => (isSlotKey(key) && isPresent(entry[key]) ? [entry[key]] : []));
	const [only] = held;
	return held.length === 1 && isRecord(only) ? evidenceOf(only, view) : entry;
}

/**
 * The source bytes between a list item and the item before it, when the two
 * are still adjacent there and no layout run on the item's leading side
 * already spells that gap: the range from the predecessor's end to the item's
 * start in the tree both were read from. Sent only while `owner`, the node
 * holding the items, carries source identity, as the list's flanks are
 * (`sourceFlankOf`): a list with no source keeps none of its source layout.
 */
export function sourceGapOf(owner: Record<string, unknown>, list: readonly unknown[], index: number, view: KindView): SourceGapEvidence | undefined {
	const entry = list[index];
	if (index === 0 || !isRecord(entry) || sourceOf(owner) === undefined) return undefined;
	const evidence = evidenceOf(entry, view);
	const source = sourceOf(evidence);
	const previous = source === undefined ? undefined : siblingsOf(source)?.previous;
	if (source === undefined || previous == null || !keepsNeighbour(previous, list[index - 1], source.token, view)) return undefined;
	if (typeof sideOf(evidence, 'leading')[0] === 'number') return undefined;
	return { $treeHandle: source.treeHandle, $span: { start: previous.end, end: source.span.start } };
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

/** A row and a byte column, as tree-sitter counts them. */
export interface PointData {
	readonly row: number;
	readonly column: number;
}

/** A snapshot node's span (`$_layout.span`), measured from the start of the transport that holds it. */
export interface PointSpanData {
	readonly start: PointData;
	readonly end: PointData;
}

/**
 * A node's layout as the transport sends it (`$_layout`): the trivia that
 * crosses with it, the source evidence a rebuilt node keeps (its gap toward
 * the list item before it and, for a list, its flanks), a snapshot node's
 * span, the node a built node takes its missing sides from (`sides`, a
 * coordinate), and the edges whose neighbour changed (`changed`), where its
 * sides drop their layout runs. Absent when the node has none of these.
 */
export interface TransportLayout {
	trivia?: unknown;
	units?: readonly unknown[];
	gap?: SourceGapEvidence;
	flank?: SourceFlankEvidence;
	span?: PointSpanData;
	sides?: Record<string, unknown>;
	changed?: ChangedEdges;
}

function setLayout<K extends keyof TransportLayout>(out: Record<string, unknown>, key: K, value: TransportLayout[K]): void {
	const layout = (out.$_layout ??= {}) as TransportLayout;
	layout[key] = value;
}

/** A coordinate crossing, with the edges whose neighbour changed. */
function coordinateCrossing(coordinate: Parameters<typeof plainCoordinate>[0], changed: ChangedEdges): Record<string, unknown> {
	const out = plainCoordinate(coordinate);
	if (changed.leading || changed.trailing) setLayout(out, 'changed', changed);
	return out;
}

/**
 * The items of a list node: the one array a list kind (`KindView.isList`)
 * holds in its slots.
 */
function listItemsOf(record: Record<string, unknown>, view: KindView): readonly Record<string, unknown>[] | undefined {
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
export function sourceFlankOf(record: Record<string, unknown>, view: KindView): SourceFlankEvidence | undefined {
	const items = listItemsOf(record, view);
	const source = sourceOf(record);
	if (items === undefined || items.length === 0 || source === undefined) return undefined;
	const inList = (item: Record<string, unknown>): Siblings | undefined => {
		const own = sourceOf(item);
		return own !== undefined && own.token === source.token && own.span.start >= source.span.start && own.span.end <= source.span.end ? siblingsOf(own) : undefined;
	};
	return {
		$treeHandle: source.treeHandle,
		$span: source.span,
		$before: inList(evidenceOf(items[0]!, view))?.previous === null,
		$after: inList(evidenceOf(items[items.length - 1]!, view))?.next === null
	};
}

/**
 * The sides a list node crosses with: without the layout runs at its flanks,
 * which its source flanks spell instead (`sourceFlankOf`), so each flank has
 * one source.
 */
function edgesOf(record: Record<string, unknown>, view: KindView, changed: ChangedEdges): ChangedEdges {
	return listItemsOf(record, view) === undefined ? changed : BOTH_EDGES;
}

function assertTriviaHoldsTree(entries: readonly unknown[]): void {
	for (const entry of entries) if (isRecord(entry) && treeHandleOf(entry) !== undefined) assertHoldsTree(entry);
}

function toTransportValue(value: unknown, view: KindView, changed: ChangedEdges, fold: boolean, owner?: Record<string, unknown>, bearer?: Record<string, unknown>, sided = true): unknown {
	if (Array.isArray(value)) {
		return value.map((entry, index) => {
			if (!isRecord(entry)) return toTransportValue(entry, view, NO_EDGES, fold);
			const out = toTransportValue(entry, view, changedEdges(value, index, view), fold, undefined, evidenceOf(entry, view));
			const gap = owner !== undefined ? sourceGapOf(owner, value, index, view) : undefined;
			if (gap !== undefined && isRecord(out)) setLayout(out, 'gap', gap);
			return out;
		});
	}
	if (!isRecord(value)) return value;
	const bears = bearer === undefined || bearer === value;
	const edges = edgesOf(value, view, bears ? changed : NO_EDGES);
	const at = coordinateOf(value);
	if (at !== undefined && (isCoordinate(value) || (fold && treeOf(value) !== undefined))) {
		if (fold) assertHoldsTree(value);
		const out = fold ? coordinateCrossing(at, edges) : plainCoordinate(at);
		return out;
	}
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(value)) {
		if (!isDataKey(key) || key === '$_layout') continue;
		const raw = value[key];
		if (typeof raw === 'function') continue;
		out[key] = isStorageKey(key) ? toTransportValue(raw, view, bears ? NO_EDGES : changed, fold, value, bears ? undefined : bearer, fold || !isAliasContent(value, raw)) : raw;
	}
	const given = (value as { readonly $_layout?: TransportLayout }).$_layout;
	if (given?.gap !== undefined) setLayout(out, 'gap', given.gap);
	if (given?.flank !== undefined) setLayout(out, 'flank', given.flank);
	if (given?.span !== undefined) setLayout(out, 'span', given.span);
	const content = fold ? undefined : Object.keys(value).flatMap((key) => (isStorageKey(key) && isAliasContent(value, value[key]) ? [value[key] as object] : []))[0];
	const trivia = fold ? triviaOf(value) : sided ? (sidesOf(value) ?? (content === undefined ? undefined : sidesOf(content))) : undefined;
	if (trivia != null) {
		if (fold) forEachTriviaList(trivia as TriviaSides<unknown>, assertTriviaHoldsTree);
		setLayout(out, 'trivia', trivia);
	}
	const units = fold ? given?.units : sided ? unitSidesOf(value) : undefined;
	if (units !== undefined && units.length > 0) setLayout(out, 'units', units);
	const source = fold ? sourceOf(value) : undefined;
	if (source !== undefined && sourceTree(source) !== undefined) {
		setLayout(out, 'sides', plainCoordinate({ $treeHandle: source.treeHandle, $end: source.end, $span: source.span, $type: source.kind }));
	}
	const layout = out.$_layout as TransportLayout | undefined;
	if ((edges.leading || edges.trailing) && (layout?.trivia !== undefined || layout?.sides !== undefined)) setLayout(out, 'changed', edges);
	const flank = sourceFlankOf(value, view);
	if (flank !== undefined) setLayout(out, 'flank', flank);
	// A storage-bearing node rebuilds from its slots.
	if (holdsSlots(out)) delete out.$text;
	return out;
}

/**
 * `markEdited` for a node edited in place: the node keeps its identity and
 * methods, and loses the coordinate that would fold it back to its pre-edit
 * bytes.
 */
export function detachCoordinate(data: object): void {
	const record = data as { $_layout?: NodeLayout };
	const layout = withoutAt(record.$_layout);
	if (layout === undefined) delete record.$_layout;
	else record.$_layout = layout;
	releaseTreeOn(data);
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
