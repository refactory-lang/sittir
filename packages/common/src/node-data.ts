import type { AnyUntypedNode, NodeLayout, NodeTrivia, NodeCoordinate, TriviaEntry } from '@sittir/types';
import { decodeIndex, isCoordinate, type Siblings, type TreeHandle, type TriviaSideName } from './read.ts';
import { assertHoldsTree, holdTreeOn, releaseTreeOn, treeOf, treeOfToken, treeTokenOf, type TreeToken } from './tree-token.ts';
import { forEachTriviaList, type TriviaSides } from './trivia.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** The coordinate a read node came from (`$_layout.at`), or the node itself when it is a coordinate. */
export function coordinateOf(node: object): NodeCoordinate | undefined {
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

const rebuiltObjects = new WeakSet<object>();

/** Record that a `$with` rebuild returned `node`: a builder wrote its slots, whether or not it counts as read. */
export function markRebuilt(node: object): void {
	rebuiltObjects.add(node);
}

/** Whether a `$with` rebuild returned `node` (`markRebuilt`). */
export function isRebuilt(node: object): boolean {
	return rebuiltObjects.has(node);
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

/** A coordinate as node data: its four fields, holding no tree. */
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
 * The sides of a node's unit children, by slot and item (`NodeLayout.units`): the ones it
 * holds, else its tree's for a parsed node, else those of the node it was rebuilt from
 * (`sourceOf`); `undefined` when none answers.
 */
export function unitSidesOf(node: object): readonly unknown[] | undefined {
	const held = (node as { readonly $_layout?: NodeDataLayout }).$_layout?.units;
	if (held !== undefined) return held;
	const tree = treeOf(node);
	const index = indexOf(node);
	if (tree?.unitSides !== undefined && index !== undefined) return tree.unitSides(index);
	const source = sourceOf(node);
	const from = source === undefined ? undefined : sourceTree(source);
	return source === undefined || from === undefined ? undefined : carriedUnitSides(node as Record<string, unknown>, decodeIndex(source.treeHandle), from);
}

/**
 * The stored layout of a node's list slots (`NodeLayout.slots`): the ones it holds, else its
 * tree's for a parsed node, else those of the node it was rebuilt from (`sourceOf`), which apply to
 * every gap of the slot, kept or inserted; `undefined` when none answers.
 */
export function slotsOf(node: object): readonly unknown[] | undefined {
	const held = (node as { readonly $_layout?: NodeDataLayout }).$_layout?.slots;
	if (held !== undefined) return held;
	const tree = treeOf(node);
	const index = indexOf(node);
	if (tree?.slotLayouts !== undefined && index !== undefined) return tree.slotLayouts(index);
	const source = sourceOf(node);
	const from = source === undefined ? undefined : sourceTree(source);
	return source === undefined ? undefined : from?.slotLayouts?.(decodeIndex(source.treeHandle));
}

/**
 * The separator a node's source spells before it as a list item where it is not its slot's
 * (`NodeLayout.separator`): the one it holds, else its tree's for a parsed node, else that of
 * the node it was rebuilt from (`sourceOf`); `undefined` when none answers.
 */
export function separatorOf(node: object): number | undefined {
	const held = (node as { readonly $_layout?: NodeDataLayout }).$_layout?.separator;
	if (held !== undefined) return held;
	const tree = treeOf(node);
	const index = indexOf(node);
	if (tree?.separatorBefore !== undefined && index !== undefined) return tree.separatorBefore(index);
	const source = sourceOf(node);
	const from = source === undefined ? undefined : sourceTree(source);
	return source === undefined ? undefined : from?.separatorBefore?.(decodeIndex(source.treeHandle));
}

/**
 * The separator a list writes between its items, as a grammar id: its tree's for a parsed list
 * (its slot's stored one, else the one the read-time options render), else that of the list it
 * was rebuilt from (`sourceOf`); `undefined` when none answers.
 */
export function slotSeparatorOf(node: object): number | undefined {
	const tree = treeOf(node);
	const index = indexOf(node);
	if (tree?.slotSeparator !== undefined && index !== undefined) return tree.slotSeparator(index);
	const source = sourceOf(node);
	const from = source === undefined ? undefined : sourceTree(source);
	return source === undefined ? undefined : from?.slotSeparator?.(decodeIndex(source.treeHandle));
}

/** One unit child's sides as a tree gives them (`NodeLayout.units`): its slot's wire key and its item there. */
interface UnitSidesData {
	readonly slot: string;
	readonly item: number;
}

/**
 * The sides of a rebuilt node's unit children, carried from the node at `index` of `tree` it was
 * rebuilt from. Each slot's items are aligned with the source node's (`alignedItems`): a unit's
 * sides follow it to its new item, and a unit the rebuild removed takes its sides with it.
 */
function carriedUnitSides(node: Record<string, unknown>, index: number, tree: TreeHandle): readonly unknown[] | undefined {
	const units = tree.unitSides?.(index) as readonly UnitSidesData[] | undefined;
	if (units === undefined || units.length === 0) return units;
	const read = tree.read?.(index, 1);
	if (!isRecord(read)) return undefined;
	const moved = new Map<string, ReadonlyMap<number, number>>();
	const itemsAt = (holder: Record<string, unknown>, slot: string): readonly unknown[] => {
		const value = holder[slot];
		return value === undefined ? [] : Array.isArray(value) ? value : [value];
	};
	const carried: unknown[] = [];
	for (const unit of units) {
		let aligned = moved.get(unit.slot);
		if (aligned === undefined) {
			aligned = alignedItems(itemsAt(read, unit.slot), itemsAt(node, unit.slot));
			moved.set(unit.slot, aligned);
		}
		const item = aligned.get(unit.item);
		if (item !== undefined && typeof itemsAt(node, unit.slot)[item] === 'number') carried.push({ ...unit, item });
	}
	return carried;
}

/** What an item of a slot is the same item by: a unit by its kind, a read node by the handle it names; a built node is no item of the source. */
function itemIdentity(item: unknown): string | undefined {
	if (typeof item === 'number') return `kind:${item}`;
	const handle = isRecord(item) ? sourceHandleOf(item) : undefined;
	return handle === undefined ? undefined : `node:${handle}`;
}

/**
 * The new position of each unit of `before` that `after` keeps. The read nodes both keep anchor
 * the alignment, each by the handle it names: a unit is the unit of its kind at the same count in
 * the run of units that follows its anchor, the last kept node before it, at that node's new
 * place (the slot's start for a unit before every kept node). A unit no run places pairs, in order,
 * with a unit of its kind that nothing placed, so two units that crossed keep their place. Linear
 * in both slots. A node needs no alignment: its sides are its own.
 */
function alignedItems(before: readonly unknown[], after: readonly unknown[]): ReadonlyMap<number, number> {
	const nodeAt = new Map<string, number>();
	const runs = new Map<number, Map<string, number[]>>();
	let run = -1;
	after.forEach((item, j) => {
		const identity = itemIdentity(item);
		if (typeof item !== 'number') {
			if (identity !== undefined) nodeAt.set(identity, j);
			run = j;
			return;
		}
		if (identity === undefined) return;
		const kinds = runs.get(run) ?? new Map<string, number[]>();
		runs.set(run, kinds);
		const units = kinds.get(identity);
		if (units === undefined) kinds.set(identity, [j]);
		else units.push(j);
	});
	const aligned = new Map<number, number>();
	const placed = new Set<number>();
	let anchor = -1;
	let counts = new Map<string, number>();
	before.forEach((item, i) => {
		const identity = itemIdentity(item);
		if (typeof item !== 'number') {
			const kept = identity === undefined ? undefined : nodeAt.get(identity);
			if (kept !== undefined) {
				anchor = kept;
				counts = new Map();
			}
			return;
		}
		if (identity === undefined) return;
		const count = counts.get(identity) ?? 0;
		counts.set(identity, count + 1);
		const j = runs.get(anchor)?.get(identity)?.[count];
		if (j === undefined || placed.has(j)) return;
		aligned.set(i, j);
		placed.add(j);
	});
	const free = new Map<string, { readonly items: number[]; next: number }>();
	after.forEach((item, j) => {
		const identity = itemIdentity(item);
		if (identity === undefined || typeof item !== 'number' || placed.has(j)) return;
		const open = free.get(identity);
		if (open === undefined) free.set(identity, { items: [j], next: 0 });
		else open.items.push(j);
	});
	before.forEach((item, i) => {
		const identity = itemIdentity(item);
		const open = identity === undefined || typeof item !== 'number' || aligned.has(i) ? undefined : free.get(identity);
		const j = open?.items[open.next];
		if (open === undefined || j === undefined) return;
		aligned.set(i, j);
		open.next += 1;
	});
	return aligned;
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
export function toNodeData(node: AnyUntypedNode, view: KindView): AnyUntypedNode {
	return toNodeValue(node, view, rootEdges(node), true, rootBearer(node, view)) as AnyUntypedNode;
}

/**
 * `toNodeData` for data that will leave the tree it was read from: no
 * node crosses as its coordinate, so every node crosses as its own storage
 * with its sides as data (`sidesOf`), and nothing but the layout evidence
 * still names the tree. An alias envelope and its content are one parser
 * node, whose sides the envelope holds. The caller turns that evidence into
 * the text it names.
 */
export function toDetachedNodeData(node: AnyUntypedNode, view: KindView): AnyUntypedNode {
	return toNodeValue(node, view, rootEdges(node), false, rootBearer(node, view)) as AnyUntypedNode;
}

/** How the crossing tells kinds apart: a kind a rebuild constructs around an existing node. */
export interface KindView {
	readonly isWrapper: (kindId: number) => boolean;
}

/** The view of data with no wrapper kinds. */
export const PLAIN_KINDS: KindView = { isWrapper: () => false };

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

/** A row and a byte column, as tree-sitter counts them. */
export interface PointData {
	readonly row: number;
	readonly column: number;
}

/** A snapshot node's span (`$_layout.span`), measured from the start of the native node that holds it. */
export interface PointSpanData {
	readonly start: PointData;
	readonly end: PointData;
}

/**
 * A node's layout as the native node sends it (`$_layout`): the trivia that
 * crosses with it, its list slots' stored layout (`slots`, as a read gives
 * it), the separator its source spells before it as a list item where it is
 * not its slot's (`separator`), a snapshot node's span, the node a built node takes its missing sides
 * and slots from (`sides`, a coordinate), and the edges whose neighbour
 * changed (`changed`), where its sides drop their layout runs. Absent when
 * the node has none of these.
 */
export interface NodeDataLayout {
	trivia?: unknown;
	units?: readonly unknown[];
	slots?: readonly unknown[];
	separator?: number;
	span?: PointSpanData;
	sides?: Record<string, unknown>;
	changed?: ChangedEdges;
}

function setLayout<K extends keyof NodeDataLayout>(out: Record<string, unknown>, key: K, value: NodeDataLayout[K]): void {
	const layout = (out.$_layout ??= {}) as NodeDataLayout;
	layout[key] = value;
}

/** A coordinate crossing, with the edges whose neighbour changed. */
function coordinateCrossing(coordinate: Parameters<typeof plainCoordinate>[0], changed: ChangedEdges): Record<string, unknown> {
	const out = plainCoordinate(coordinate);
	if (changed.leading || changed.trailing) setLayout(out, 'changed', changed);
	return out;
}

function assertTriviaHoldsTree(entries: readonly unknown[]): void {
	for (const entry of entries) if (isRecord(entry) && treeHandleOf(entry) !== undefined) assertHoldsTree(entry);
}

function toNodeValue(value: unknown, view: KindView, changed: ChangedEdges, fold: boolean, bearer?: Record<string, unknown>, sided = true): unknown {
	if (Array.isArray(value)) {
		return value.map((entry, index) => {
			if (!isRecord(entry)) return toNodeValue(entry, view, NO_EDGES, fold);
			return toNodeValue(entry, view, changedEdges(value, index, view), fold, evidenceOf(entry, view));
		});
	}
	if (!isRecord(value)) return value;
	const bears = bearer === undefined || bearer === value;
	const edges = bears ? changed : NO_EDGES;
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
		out[key] = isStorageKey(key) ? toNodeValue(raw, view, bears ? NO_EDGES : changed, fold, bears ? undefined : bearer, fold || !isAliasContent(value, raw)) : raw;
	}
	const given = (value as { readonly $_layout?: NodeDataLayout }).$_layout;
	const slots = fold ? given?.slots : slotsOf(value);
	if (slots !== undefined && slots.length > 0) setLayout(out, 'slots', slots);
	const separator = edges.leading ? undefined : fold ? given?.separator : separatorOf(value);
	if (separator !== undefined) setLayout(out, 'separator', separator);
	if (given?.span !== undefined) setLayout(out, 'span', given.span);
	const content = fold ? undefined : Object.keys(value).flatMap((key) => (isStorageKey(key) && isAliasContent(value, value[key]) ? [value[key] as object] : []))[0];
	const trivia = fold ? triviaOf(value) : sided ? (sidesOf(value) ?? (content === undefined ? undefined : sidesOf(content))) : undefined;
	if (trivia != null) {
		if (fold) forEachTriviaList(trivia as TriviaSides<unknown>, assertTriviaHoldsTree);
		setLayout(out, 'trivia', trivia);
	}
	const units = fold || sided ? unitSidesOf(value) : undefined;
	if (units !== undefined && units.length > 0) setLayout(out, 'units', units);
	const source = fold ? sourceOf(value) : undefined;
	if (source !== undefined && sourceTree(source) !== undefined) {
		setLayout(out, 'sides', plainCoordinate({ $treeHandle: source.treeHandle, $end: source.end, $span: source.span, $type: source.kind }));
	}
	const layout = out.$_layout as NodeDataLayout | undefined;
	if ((edges.leading || edges.trailing) && (layout?.trivia !== undefined || layout?.sides !== undefined)) setLayout(out, 'changed', edges);
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

/** Remove the tree token from everything under `value`, through slots and trivia: node data holds no tree. */
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
 * node that carries storage, in place, and return `root`. For native node data
 * that came through a path other than {@link toNodeData}. A coordinate
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
