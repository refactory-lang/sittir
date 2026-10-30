import type { AnyUntypedNode, EngineIdentity, ErrorNode, NodeTrivia, NodeCoordinate, TriviaEntry, TriviaFacts } from '@sittir/types';
import { mapTriviaEntries, TRIVIA_SIDES, type TriviaSides } from './trivia.ts';
import { asTextNode, carryRead, carryPlace, heldUnitSides, indexOf, isRead, isStorageKey, PLAIN_KINDS, realignedUnits, setTriviaOf, setUnitSides, sideOf, sideRead, sitedLeaf, slotSeparatorOf, sourceHandleOf, placeOf, tableAt, toNodeData, treeHandleOf, triviaOf, unitSidesOf, writtenSides, type UnitSidesData } from './node-data.ts';
import { Source } from './source.ts';
import { ERROR_KIND_ID } from './error-kind.ts';
import { currentHandle, engineOf, hydrateOn, hydrateStored, inEngine, isLive, treeBuiltArena, treeEngineHandle, type EngineHandle } from './engine-scope.ts';
import { Delimiter } from './delimiter.ts';
import { decodeIndex, decodeTree, isCoordinate, readNode, type TreeHandle, type TriviaSideName } from './read.ts';
import { registered, wrapRegistered, type Role } from './identity.ts';
import { treeOf, treeOfToken, treeTokenOf } from './tree-token.ts';
import { sourceOf } from './source-stamp.ts';
import { spelledForm } from './interior.ts';
import { snapshotOf } from './snapshot.ts';
import { chosenSeparatorOf, liveWords, recordOf, recordSlot, recordSlots, rowTrivia, storedSlotValues } from './record-view.ts';
import type { LeafHandle, RecordHandle, RecordPosition } from './handle.ts';
import { builtLeafOf, builtRefOf, handleArenaOf, siteOf } from './built-ref.ts';
import { holdSideEntries, isBuiltNode, refuseBuiltEntries, refuseForeignEntry, sideEntryOf, type BuiltArena } from './built-arena.ts';

export { Delimiter } from './delimiter.ts';
export { refuseJSON } from './json-refusal.ts';
export { Source };
export { ERROR_KIND_ID, ERROR_KIND_NAME } from './error-kind.ts';
export type { ErrorNode };

type Scoped = <R>(fn: () => R) => R;

const NO_ENGINE = 'node has no engine; render it with engine.render(node)';

/**
 * The items a list setter was called with.
 *
 * @param slot - The setter's name, for the message.
 * @param items - The setter's rest arguments.
 * @returns `items`, unchanged.
 * @throws When the setter was called with one array in place of its items.
 */
export function restItems<A extends readonly unknown[]>(slot: string, items: A): A {
	if (items.length === 1 && Array.isArray(items[0])) {
		throw new TypeError(`${slot} takes its items as arguments, not one array: call ${slot}(...items)`);
	}
	return items;
}

/** Whether `node` is typed: it carries the methods `withMethods` attaches, so a wrap or a builder produced it. */
export function isTypedNode(node: object): boolean {
	return typeof (node as { readonly $render?: unknown }).$render === 'function';
}

/** The text `node` renders to in the engine it was built or read in. */
export function renderText(handle: EngineHandle | undefined, node: object): string {
	if (handle === undefined) throw new Error(NO_ENGINE);
	if (!isLive(handle.current)) throw new Error('engine disposed; render it with engine.render(node)');
	return handle.current.render(node as AnyUntypedNode).toString();
}

export function queryOf(handle: EngineHandle, node: object): object {
	if (!isLive(handle.current)) throw new Error('query: engine disposed; parse the source again with a live engine');
	return handle.current.query(node);
}

type Positioned = { readonly $tree: TreeHandle };

export function handleOf(node: Positioned): EngineHandle | undefined {
	return treeEngineHandle(node.$tree);
}

export function handleQuery(node: Positioned, row: object): object {
	const handle = handleOf(node);
	if (handle === undefined) throw new Error(NO_ENGINE);
	return queryOf(handle, row);
}

export function handleRender(this: Positioned): string {
	return renderText(handleOf(this), this);
}

export function handleToString(this: { $render(): string }): string {
	return this.$render();
}

export function handleEngine(this: Positioned): EngineHandle['current'] | undefined {
	return handleOf(this)?.current;
}


export function leafText(this: LeafHandle): string {
	const arena = this.$tree.built;
	if (arena === undefined) throw new Error('a leaf handle names no built arena');
	return arena.entryText(this.$entry);
}

export function leafLeading(this: { readonly node: LeafHandle }, ...items: unknown[]): AnyUntypedNode | readonly TriviaEntry[] {
	return triviaSide(this.node, handleOf(this.node), 'leading', items);
}

export function leafTrailing(this: { readonly node: LeafHandle }, ...items: unknown[]): AnyUntypedNode | readonly TriviaEntry[] {
	return triviaSide(this.node, handleOf(this.node), 'trailing', items);
}

export function leafInner(this: { readonly node: LeafHandle }, ...items: unknown[]): AnyUntypedNode | readonly TriviaEntry[] {
	return triviaInner(this.node, handleOf(this.node), items);
}

export function rebuilt<R>(source: object, handle: EngineHandle | undefined, build: () => R): R {
	const node = source as AnyUntypedNode;
	const built = handle === undefined ? build() : inEngine(handle, build);
	if (!isNode(built)) return built;
	let result = built;
	try {
		result = sourcedRecord(node, built, true);
		carryRead(node, result);
		carryPlace(node, result);
		carryUnitSides(node, result);
		const facts = handle?.current.trivia;
		if (facts !== undefined) carryRebuiltSlots(node as unknown as Record<string, unknown>, result as unknown as Record<string, unknown>, standsIn(facts));
		const held = sideOf(node, 'inner');
		const inner = held.length === 0 || isEmptyNode(result) ? [] : held;
		if (inner.some((entry) => typeof entry !== 'number')) {
			const kind = facts?.kindName(node.$type) ?? String(node.$type);
			throw new Error(`trivia: ${kind} holds inner comments; move them to leading/trailing on the new child`);
		}
		const trivia = writtenSides(node);
		if (inner.length > 0) writeTrivia(result, { ...trivia, inner: [] });
		else if (trivia !== undefined) writeTrivia(result, trivia);
		return handle === undefined ? result : handle.settle(result);
	} catch (error) {
		releaseBuilt(result);
		throw error;
	} finally {
		if (result !== built) releaseBuilt(built);
	}
}

function releaseBuilt(node: object): void {
	handleArenaOf(node)?.releaseHandle(node);
}

export function isEmptyNode(node: AnyUntypedNode): boolean {
	const tree = treeOf(node);
	const handle = treeHandleOf(node);
	if (tree?.isEmpty !== undefined && handle !== undefined) return tree.isEmpty(decodeIndex(handle));
	const facts = engineOf(node)?.trivia;
	return storesNothingIn(node, typeof node.$type === 'number' ? facts?.innerRegions.get(node.$type) : undefined, facts?.namedUnits);
}

export function storesNothingIn(node: AnyUntypedNode, region: readonly string[] | undefined, namedUnits?: ReadonlySet<number>): boolean {
	const owns = (value: unknown): boolean => {
		if (typeof value === 'number') return namedUnits?.has(value) ?? true;
		if (value === null || value === undefined) return false;
		if (typeof value === 'object' && !isNode(value) && Symbol.iterator in value) return [...(value as Iterable<unknown>)].some(owns);
		return true;
	};
	const counted = (key: string): boolean => key.charCodeAt(0) === 95 && (region === undefined || region.includes(key));
	return !storedSlotValues(node).some(([key, value]) => counted(key) && owns(value));
}

const scopedBy = (handle: EngineHandle | undefined): Scoped => (handle === undefined ? (fn) => fn() : (fn) => inEngine(handle, fn));

export function writeTrivia(node: object, trivia: NodeTrivia): void {
	const leaf = builtLeafOf(node);
	if (leaf !== undefined) {
		const wired = wireSides(node, trivia);
		const sited = sitedLeaf(node);
		const sites = sited === undefined ? leaf.arena.leafSites(node) : siteOf(sited.$site);
		if (sited !== undefined) leaf.arena.refuseReleased(sites![0]!);
		if (sites !== undefined) writeSites(leaf.arena, sites, trivia, wired);
		if (sited !== undefined) return;
		const own = triviaOf(node);
		setTriviaOf(node, leaf.arena.repark(node, own, trivia, sites !== undefined));
		return;
	}
	const at = tableAt(node);
	if (at === undefined) {
		refuseBuiltEntries(trivia);
		const own = triviaOf(node);
		setTriviaOf(node as AnyUntypedNode, own === undefined ? trivia : { ...own, ...trivia });
		return;
	}
	const wired = wireSides(node, trivia);
	for (const side of TRIVIA_SIDES) {
		const entries = trivia[side];
		const wire = wired[side];
		if (entries === undefined || wire === undefined) continue;
		at.tree.writeTriviaSide(at.index, side, wire);
		holdSideEntries(at.tree, `${at.index}:${side}`, entries);
	}
}

export function writeLeafSites(leaf: object, sites: readonly number[]): void {
	const ref = builtLeafOf(leaf);
	const own = writtenSides(leaf);
	if (ref !== undefined && own !== undefined) writeSites(ref.arena, sites, own, wireSides(leaf, own));
}

export function leafWireSides(leaf: object): TriviaSides<unknown> | undefined {
	const own = triviaOf(leaf);
	return own === undefined ? undefined : wireSides(leaf, own);
}

function wireSides(node: object, trivia: NodeTrivia): TriviaSides<unknown> {
	const wire = entryWire(node);
	return mapTriviaEntries(trivia as TriviaSides<TriviaEntry>, (entries) => entries.map(wire));
}

function writeSites(arena: BuiltArena, sites: readonly number[], trivia: NodeTrivia, wired: TriviaSides<unknown>): void {
	for (const side of TRIVIA_SIDES) {
		const entries = trivia[side];
		const wire = wired[side];
		if (entries === undefined || wire === undefined) continue;
		arena.writeLeafSide(sites, side, wire);
		for (let n = 0; n < sites.length; n += 3) holdSideEntries(arena.tree, `${sites[n]}.${sites[n + 1]}.${sites[n + 2]}:${side}`, entries);
	}
}

export function writeUnitSides(node: object, units: readonly UnitSidesData[]): void {
	const built = builtRefOf(node);
	if (built?.at === undefined) {
		for (const unit of units) refuseBuiltEntries(unit);
		setUnitSides(node, units);
		return;
	}
	const wire = entryWire(node);
	built.arena.tree.writeUnitSides(built.at, units.map((unit) => ({ ...unit, ...mapTriviaEntries(unit as TriviaSides<TriviaEntry>, (entries) => entries.map(wire)) })));
	holdSideEntries(built.arena.tree, `${built.at}:units`, units.flatMap((unit) => TRIVIA_SIDES.flatMap((side) => unit[side] ?? [])));
}

function carryUnitSides(from: object, to: object): void {
	const units = (builtRefOf(to) === undefined ? heldUnitSides(from) : unitSidesOf(from)) as readonly UnitSidesData[] | undefined;
	if (units !== undefined && units.length > 0) writeUnitSides(to, realignedUnits(units, from, to));
}

function entryWire(node: object): (entry: TriviaEntry) => unknown {
	const tree = treeOf(node);
	const built = builtRefOf(node)?.arena;
	const arena = built ?? (tree === undefined ? undefined : treeBuiltArena(tree));
	const holder = built?.engine() ?? engineOf(node);
	return (entry) => (typeof entry === 'number' ? entry : (sideEntryOf(entry, arena, holder) ?? toNodeData(snapshotOf(entry) as AnyUntypedNode, PLAIN_KINDS)));
}

function triviaWriter(target: object, handle: EngineHandle | undefined) {
	const node = target as AnyUntypedNode;
	if (handle === undefined) throw new Error(NO_ENGINE);
	const facts: TriviaFacts = handle.current.trivia;
	const scoped = scopedBy(handle);
	const kind = (): string => facts.kindName(node.$type) ?? String(node.$type);
	const read = (side: TriviaSideName): readonly TriviaEntry[] => {
		const { entries, tree } = sideRead(node, side);
		return hydratedEntries(entries, tree);
	};
	const write = (side: TriviaSideName, items: readonly unknown[]): AnyUntypedNode => {
		writeTrivia(node, { [side]: scoped(() => items.map((item) => triviaEntryOf(item, handle.current))) });
		return node;
	};
	const inner = (items: readonly unknown[]): AnyUntypedNode | readonly TriviaEntry[] => {
		if (!facts.innerKinds.has(kind())) throw new Error(`trivia: ${kind()} has no inner site; attach to a child with leading/trailing`);
		if (items.length === 0) return read('inner');
		if (!isEmptyNode(node)) throw new Error(`trivia: ${kind()} is not empty; attach to a child with leading/trailing`);
		return write('inner', items);
	};
	return {
		side: (position: 'leading' | 'trailing', items: readonly unknown[]): AnyUntypedNode | readonly TriviaEntry[] =>
			items.length === 0 ? read(position) : write(position, items),
		inner
	};
}

function hydratedEntries(entries: readonly TriviaEntry[], tree: TreeHandle | undefined): readonly TriviaEntry[] {
	if (tree !== undefined || entries.some(isCoordinate)) return entries.map((entry) => hydrateTriviaEntry(entry, tree));
	entries.forEach(asTextNode);
	return entries;
}

export function hydrateTriviaEntry(entry: unknown, tree?: TreeHandle): TriviaEntry {
	if (isCoordinate(entry)) return hydrateStored(entry) as TriviaEntry;
	return asTextNode(tree === undefined ? entry : hydrateOn(tree, entry)) as TriviaEntry;
}

function sourcedRecord<R extends object>(source: object, built: R, own: boolean): R {
	const ref = builtRefOf(built);
	const from = placeOf(source);
	const tree = from === undefined ? undefined : treeOfToken(from.token);
	if (ref?.at === undefined || from === undefined || tree?.id === undefined) return built;
	return ref.arena.rebuiltFrom(built, tree as TreeHandle & { readonly id: number }, from.token, decodeIndex(from.treeHandle), from.end, from.span, own) as R;
}

/**
 * Hand an edited node's rebuilt wrapper slots what they keep of the wrappers they replace: that the
 * read produced them, and where they sit in the source.
 */
function carryRebuiltSlots(read: Record<string, unknown>, result: Record<string, unknown>, stands: (kindId: number) => boolean): void {
	for (const key of Object.keys(result)) {
		if (!isStorageKey(key)) continue;
		const fresh = result[key];
		const held = read[key];
		if (!carriesFrom(held, fresh, stands)) continue;
		if (placeOf(held as object) === undefined) {
			carrySides(held as object, fresh);
			continue;
		}
		carryRead(held as object, fresh);
		carryPlace(held as object, fresh);
	}
}

export function carriedSlot(source: object, accessor: string, value: unknown): unknown {
	const facts = currentHandle()?.current.trivia;
	if (facts === undefined || builtRefOf(value)?.at === undefined) return value;
	const read = (source as Record<string, unknown>)[accessor];
	if (typeof read !== 'function') throw new Error(`a $with of kind ${(source as AnyUntypedNode).$type} reads no slot ${accessor}`);
	const held = (read as () => unknown).call(source);
	if (!carriesFrom(held, value, standsIn(facts))) return value;
	if (placeOf(held as object) !== undefined) return sourcedRecord(held as object, value, false);
	carrySides(held as object, value);
	return value;
}

function standsIn(facts: TriviaFacts): (kindId: number) => boolean {
	return (kindId) => facts.rebuildWrappers.has(kindId) || facts.listKinds.has(kindId);
}

function carriesFrom(held: unknown, fresh: unknown, stands: (kindId: number) => boolean): fresh is AnyUntypedNode {
	if (fresh === null || typeof fresh !== 'object' || Array.isArray(fresh) || held === null || typeof held !== 'object' || Array.isArray(held) || fresh === held) return false;
	const kind = (fresh as { readonly $type?: unknown }).$type;
	return typeof kind === 'number' && kind === (held as { readonly $type?: unknown }).$type && stands(kind) && placeOf(fresh) === undefined;
}

function carrySides(held: object, fresh: object): void {
	const trivia = triviaOf(held);
	if (trivia !== undefined && triviaOf(fresh) === undefined) setTriviaOf(fresh as AnyUntypedNode, trivia);
	carryUnitSides(held, fresh);
}

/** How a query names a read node: the handle its coordinate names it by. */
export interface NodeAddress {
	readonly handle: number;
}

/** The address a query names `node` by; `undefined` for a node no read gave. */
export function nodeAddressOf(node: AnyUntypedNode): NodeAddress | undefined {
	const handle = sourceHandleOf(node);
	return handle === undefined ? undefined : { handle };
}

/** `node.$trivia.leading(...)` and `.trailing(...)`: set the position and return the node, or read it with no items. */
export function triviaSide(
	node: object,
	handle: EngineHandle | undefined,
	position: 'leading' | 'trailing',
	items: readonly unknown[]
): AnyUntypedNode | readonly TriviaEntry[] {
	return triviaWriter(node, handle).side(position, items);
}

/** `node.$trivia.inner(...)`: the inner side of a kind with an inner site. */
export function triviaInner(
	node: object,
	handle: EngineHandle | undefined,
	items: readonly unknown[]
): AnyUntypedNode | readonly TriviaEntry[] {
	return triviaWriter(node, handle).inner(items);
}

export function applySetter(args: readonly unknown[], set: (...args: never[]) => unknown): unknown {
	return (set as (...values: readonly unknown[]) => unknown)(...args);
}

export function handleTrivia(node: RecordPosition, wrap: (data: object, tree: TreeHandle) => unknown, side: string, items: readonly unknown[]): unknown {
	if (node.$tree.built === undefined) return rowTrivia(node, wrap, side, items);
	const handle = handleOf(node);
	return side === 'inner' ? triviaInner(node, handle, items) : triviaSide(node, handle, side as 'leading' | 'trailing', items);
}

/** One trivia item as its entry: a trivia node, a parsed ERROR node or a whitespace kind id as it is, a string by `textEntryOf`. */
function triviaEntryOf(item: unknown, holder: EngineIdentity): TriviaEntry {
	const facts: TriviaFacts = holder.trivia;
	if (typeof item === 'string') return textEntryOf(item, facts);
	if (typeof item !== 'number' && !isNode(item)) {
		throw new Error(`trivia: an entry is a node, a whitespace kind or a comment's text, not ${JSON.stringify(item)}`);
	}
	if (typeof item !== 'number') refuseForeignEntry(item, holder);
	if (isErrorNode(item)) return item;
	const type = typeof item === 'number' ? item : item.$type;
	const kind = facts.kindName(type);
	if (kind === undefined || !facts.kinds.has(kind)) throw new Error(`trivia: ${kind ?? String(type)} is not an extra`);
	return item;
}

/**
 * Loose text: whitespace text names the whitespace kind spelled exactly so; any other text is a comment's.
 * Where the grammar has several comment kinds told apart by how they open, text spelled in full is the
 * kind it opens as; any other text is the default comment kind's, as its content.
 */
function textEntryOf(text: string, facts: TriviaFacts): TriviaEntry {
	if (facts.whitespace?.run.test(text) === true) {
		const kindId = facts.whitespace.kindIdByText[text];
		if (kindId === undefined) throw new Error(`trivia: no whitespace kind is spelled ${JSON.stringify(text)}`);
		return kindId;
	}
	if (!('comment' in facts)) throw new Error(`trivia: ${JSON.stringify(text)} is text, and this grammar has no ir.comment`);
	if (facts.comment === undefined) throw new Error(`trivia: ${JSON.stringify(text)} is text, and ir.comment is bound when the factories load; import the factories`);
	const spelled = facts.spelled?.find((form) => spelledForm(text, [form.open], [form.close]) !== undefined);
	return spelled === undefined ? facts.comment(text) : spelled.build(text);
}

interface ListViewWrapper {
	readonly kind: number;
	readonly content: string;
	readonly decorations: readonly string[];
}

interface ElementConfig {
	readonly keys: readonly string[];
	readonly make: (config: never) => unknown;
}

interface ListSlotSpec {
	readonly slot: string;
	readonly kind: number;
	readonly optional: boolean;
	readonly make: (...args: never[]) => unknown;
	readonly element?: ElementConfig;
}

type Members = Record<string, (...args: unknown[]) => unknown>;

const READONLY_ARRAY_METHODS = [
	'at',
	'concat',
	'entries',
	'every',
	'filter',
	'find',
	'findIndex',
	'findLast',
	'findLastIndex',
	'flat',
	'flatMap',
	'forEach',
	'includes',
	'indexOf',
	'join',
	'keys',
	'lastIndexOf',
	'map',
	'reduce',
	'reduceRight',
	'slice',
	'some',
	'toReversed',
	'toSorted',
	'toLocaleString',
	'toSpliced',
	'toString',
	'values',
	'with'
] as const satisfies readonly (keyof ReadonlyArray<unknown>)[];

type ObjectMembers = 'length' | number | typeof Symbol.iterator | typeof Symbol.unscopables;
const readonlyArrayCovered: [Exclude<keyof ReadonlyArray<unknown>, (typeof READONLY_ARRAY_METHODS)[number] | ObjectMembers>] extends [never]
	? true
	: false = true;
void readonlyArrayCovered;

export const LIST_VIEW_MEMBERS: readonly string[] = [...READONLY_ARRAY_METHODS, 'length'];

const holdsDecoration = (value: unknown): boolean => value !== undefined && value !== false && !(Array.isArray(value) && value.length === 0);

const collapseWrapper = (item: unknown, wrapper: ListViewWrapper | undefined): unknown => {
	if (wrapper === undefined || item === null || typeof item !== 'object') return item;
	const node = item as Members & Record<string, unknown>;
	if ((node as { $type?: unknown }).$type !== wrapper.kind) return item;
	if (wrapper.decorations.some((accessor) => holdsDecoration(node[accessor]!.call(node)))) return item;
	return node[wrapper.content]!.call(node);
};

/** The items of a list view: its elements, each wrapper that carries only its content read as that content. */
export function listItems(elements: readonly unknown[], wrapper: ListViewWrapper | undefined): readonly unknown[] {
	return Object.freeze(elements.map((element) => collapseWrapper(element, wrapper)));
}

/** The `ReadonlyArray` methods of a list node but `toString`: `Array.prototype`'s own, which read the node's own elements. */
type ListMethod = (this: ArrayLike<unknown>, ...args: never[]) => unknown;

export const LIST_METHODS = Object.fromEntries(
	READONLY_ARRAY_METHODS.filter((name) => name !== 'toString').map((name) => [name, Array.prototype[name] as ListMethod] as const)
) as Readonly<Record<Exclude<(typeof READONLY_ARRAY_METHODS)[number], 'toString'>, ListMethod>>;

/** The iterator member of a list node. */
export const listIterator: (this: ArrayLike<unknown>) => ArrayIterator<unknown> = Array.prototype.values;

export function holdListItems(node: object, items: ArrayLike<unknown>): void {
	const held = node as Record<number, unknown>;
	for (let index = 0; index < items.length; index++) held[index] = items[index];
}

type ListRead = (this: object) => ArrayLike<unknown>;

const pendingReads: (object | ListRead)[] = [];
let pendingFrom = -1;

export function holdReadItems<N extends object>(node: N, read: (this: N) => ArrayLike<unknown>): void {
	pendingReads.push(node, read as ListRead);
	if (pendingFrom >= 0) return;
	pendingFrom = 0;
	try {
		while (pendingFrom < pendingReads.length) {
			const held = pendingReads[pendingFrom] as object;
			const items = (pendingReads[pendingFrom + 1] as ListRead).call(held);
			pendingFrom += 2;
			holdListItems(held, items);
		}
	} finally {
		pendingReads.length = 0;
		pendingFrom = -1;
	}
}

export function holdBuiltItems(node: object, items: readonly unknown[], wrapper?: ListViewWrapper): void {
	const held = node as Record<number, unknown>;
	for (let index = 0; index < items.length; index++) held[index] = collapseWrapper(hydrateStored(items[index]), wrapper);
}

const NO_ITEMS: readonly unknown[] = Object.freeze([]);

export function heldItems(list: object | undefined): ArrayLike<unknown> {
	return list === undefined ? NO_ITEMS : (list as ArrayLike<unknown>);
}

/** What an owner knows of the list it holds: the list itself, hydrated by `hydrate` when it is a read stub, and its stored elements (undefined while the stub cannot be read). */
export interface OwnerView {
	readonly list: Record<string, unknown> | undefined;
	readonly stored: readonly unknown[] | undefined;
	readonly length: number | undefined;
}

export function ownerView(stored: unknown, count: string, hydrate?: (list: object) => unknown): OwnerView {
	const list = stored as (object & Partial<AnyUntypedNode>) | null | undefined;
	if (list == null) return { list: undefined, stored: [], length: 0 };
	const source = count in list || isBuiltNode(list) || isParsedNode(list) || !(isCoordinate(list) || recordOf(list) !== undefined) ? list : hydrate?.(list);
	if (source === undefined) return { list: undefined, stored: undefined, length: undefined };
	if (recordOf(source) !== undefined) return { list: source as Record<string, unknown>, stored: undefined, length: (source as { readonly length: number }).length };
	const elements = (source as Record<string, unknown>)[count];
	const items = Array.isArray(elements) ? elements : elements == null ? [] : [elements];
	return { list: source as Record<string, unknown>, stored: items, length: items.length };
}

/** The elements a list stores: its array, or the one element it holds, or none. */
export function storedElements(stored: unknown): readonly unknown[] {
	return Array.isArray(stored) ? stored : stored == null ? [] : [stored];
}

/** The elements a list reads through its own reader, none for an absent list. */
export function ownerElements(list: unknown, reader: string): readonly unknown[] {
	if (list == null) return [];
	const read = (list as Record<string, unknown>)[reader] as ((this: object) => readonly unknown[] | undefined) | undefined;
	return read?.call(list) ?? [];
}

/** A list option the owner reads from its list, or the option's default. */
export function listOption(list: unknown, key: string, fallback: unknown): unknown {
	const held = list as Record<string, unknown> | null | undefined;
	return (recordOf(held) === undefined ? held?.[`_${key}`] : held?.[key]) ?? fallback;
}

export function listSeparatorOf(node: object): unknown {
	return chosenSeparatorOf(node) ?? slotSeparatorOf(node);
}

export function listSeparator(this: object): unknown {
	return listSeparatorOf(this);
}

/** The refusal of a list owner built over a read stub: a stub is a parsed list that cannot be counted without its tree, which a raw factory does not have, so the build names the stub as `engine.build` does. */
export function refuseReadStub(storage: string): never {
	throw new Error(`list view: ${storage} is a read stub, which a node built without its tree cannot hold; build it from its tree`);
}

export const isGroupConfig = (value: unknown, keys: readonly string[]): boolean =>
	typeof value === 'object' &&
	value !== null &&
	!('$type' in value) &&
	Object.keys(value).length > 0 &&
	Object.keys(value).every((key) => keys.includes(key));

const convertElements = (args: readonly unknown[], element: ElementConfig | undefined): readonly unknown[] => {
	if (element === undefined) return args;
	const make = element.make as (config: unknown) => unknown;
	const convert = (item: unknown): unknown => (isGroupConfig(item, element.keys) ? make(item) : item);
	return args.length === 1 && Array.isArray(args[0]) ? [args[0].map(convert)] : args.map(convert);
};

/**
 * A list slot's `$with` setter: no arguments clear an optional slot or build the empty list, one
 * argument that is the list itself (or `undefined`) sets it as it is, anything else is the list's
 * items and builds the list.
 */
export function listSlotWith(
	args: readonly unknown[],
	spec: Omit<ListSlotSpec, 'slot'>,
	set: (...args: never[]) => unknown
): unknown {
	const make = spec.make as (...args: unknown[]) => unknown;
	const run = set as (...args: unknown[]) => unknown;
	if (args.length === 0) return spec.optional ? run() : run(make());
	const whole = args.length === 1 && (args[0] === undefined || (args[0] as { $type?: unknown } | null)?.$type === spec.kind);
	return run(whole ? args[0] : make(...convertElements(args, spec.element)));
}

interface ElementsSeatSpec extends ElementConfig {
	readonly slot: string;
}

/** An elements slot's `$with` setter: its elements as rest arguments, each element group built into its element. */
export function elementsWith(
	args: readonly unknown[],
	spec: ElementsSeatSpec,
	set: (...args: never[]) => unknown
): unknown {
	if (args.some(Array.isArray)) {
		throw new TypeError(
			`$with.${spec.slot} takes its elements as rest arguments, $with.${spec.slot}(a, b), not an array; spread it: $with.${spec.slot}(...items)`
		);
	}
	return (set as (...args: unknown[]) => unknown)(...convertElements(args, spec));
}

interface GroupSeatKey {
	readonly name: string;
	readonly field?: string;
	readonly rest: boolean;
	readonly required?: boolean;
}

interface GroupSeatSpec {
	readonly slot: string;
	readonly stored: string;
	readonly make: (config: never) => unknown;
	readonly keys: readonly GroupSeatKey[];
}

export function groupField(group: object | undefined, field: string): unknown {
	return (group as Members | undefined)?.[field]?.call(group);
}

/**
 * A seated key's `$with` setter. Through a present group it writes the group's own field; with no
 * value it leaves the group absent; with a value it builds an absent group from that field alone
 * when no other field is required, and refuses otherwise.
 */
export function seatWith(
	spec: GroupSeatSpec,
	keyName: string,
	args: readonly unknown[],
	set: (...args: never[]) => unknown,
	readGroup: () => object | undefined
): unknown {
	const seat = set as (...args: unknown[]) => unknown;
	const key = spec.keys.find((candidate) => candidate.name === keyName)!;
	const make = spec.make as (config: unknown) => unknown;
	const fieldName = key.field ?? key.name;
	const group = readGroup() as { readonly $with: unknown } | undefined;
	if (group !== undefined) {
		return seat(((group.$with as unknown as Members)[fieldName] as (...values: unknown[]) => unknown)(...args));
	}
	const value = key.rest ? args : args[0];
	if (key.rest ? args.length === 0 : value === undefined) return seat();
	const missing = spec.keys.filter((other) => other !== key && other.required === true).map((other) => other.name);
	if (missing.length > 0) {
		throw new TypeError(
			`$with.${key.name} cannot build the absent '${spec.slot}' group without its required ${missing.join(', ')}; set ${missing.length === 1 ? 'it' : 'them'} first, or pass the whole group to $with.${spec.slot}`
		);
	}
	return seat(make({ [fieldName]: value }));
}

export function isNode(v: unknown): v is AnyUntypedNode {
	if (v === null || typeof v !== 'object') return false;
	if (typeof (v as { readonly $type?: unknown }).$type !== 'number') return false;
	return sourceOf(v) !== undefined || treeTokenOf(v) !== undefined;
}

export function describeValue(v: unknown): string {
	if (typeof v === 'string') return v;
	try {
		return JSON.stringify(describedData(v)) ?? String(v);
	} catch {
		try {
			return String(v);
		} catch {
			return Object.prototype.toString.call(v);
		}
	}
}

function describedData(v: unknown): unknown {
	if (typeof v === 'bigint') return `${v}n`;
	if (isNode(v)) return String(v);
	if (Array.isArray(v)) return v.map(describedData);
	if (v === null || typeof v !== 'object') return v;
	return Object.fromEntries(Object.entries(v).map(([key, member]) => [key, describedData(member)]));
}

/** Whether `v` is a node value a builder takes as one: a node, or a coordinate naming one past a read's depth. */
export function isNodeValue(v: unknown): v is AnyUntypedNode | NodeCoordinate {
	return isNode(v) || isCoordinate(v);
}

export function isNodeOfKind(v: unknown, kind: number): boolean {
	return isNodeValue(v) && v.$type === kind;
}

/** `node` with each defined option set through its `$with` setter; throws when the node has no setter for one. */
export function withOptions<N>(node: N, options: object): N {
	let out: unknown = node;
	for (const [key, value] of Object.entries(options)) {
		if (value === undefined) continue;
		const setters = (out as { readonly $with?: Readonly<Record<string, ((v: unknown) => unknown) | undefined>> }).$with;
		const set = setters?.[key];
		if (set === undefined) throw new Error(`cannot set the option '${key}': the node has no $with setter for it`);
		out = set.call(setters, value);
	}
	return out as N;
}

export function orDefault<V>(value: V | undefined, make: () => NoInfer<V>): V {
	return value ?? make();
}

export function configFieldOr(input: unknown, key: string, orElse: () => unknown, own: unknown): unknown {
	return input !== null &&
		typeof input === 'object' &&
		!Array.isArray(input) &&
		!isNodeValue(input) &&
		(!('$type' in input) || input.$type === own) &&
		(key in input || Object.keys(input).length === 0)
		? (input as Record<string, unknown>)[key]
		: orElse();
}

/** Whether a read produced `v`, or rebuilt it from a node a read produced. */
export function isParsedNode(v: unknown): v is AnyUntypedNode {
	return isNode(v) && isRead(v);
}

export function isFactoryNode(v: unknown): v is AnyUntypedNode {
	return isNode(v) && !isParsedNode(v);
}

export function isErrorNode(v: unknown): v is ErrorNode {
	return isParsedNode(v) && v.$type === ERROR_KIND_ID;
}

export function hasKind(v: object): v is { kind: string } & Record<string, unknown> {
	return 'kind' in v && typeof (v as Record<string, unknown>).kind === 'string';
}

/** How a hydrate turns a native node into its kind's node: the grammar's `wrapNode`. */
export type WrapNode = (data: object, tree: TreeHandle) => unknown;

/**
 * One stored value as an accessor returns it: the node the registry holds at its index and `role`, else a
 * coordinate read `depth` levels down (one when absent) and hydrated as the node it reads as, a
 * native node wrapped and registered (`wrapRegistered`), and anything else (a wrapped node, a kind id such as
 * a unit variant's, a boolean, text) as it is.
 */
export function hydrateWith(value: unknown, tree: TreeHandle, wrap: WrapNode, depth?: number, role: Role = 'node'): unknown {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
	if (isCoordinate(value)) {
		const known = decodeTree(value.$treeHandle) === tree.id ? registered(tree, decodeIndex(value.$treeHandle), role) : undefined;
		return known ?? hydrateWith(readNode(tree, value, depth), tree, wrap, undefined, role);
	}
	if (isTypedNode(value) || typeof (value as { readonly $type?: unknown }).$type !== 'number') return value;
	return wrapRegistered(value, tree, wrap, role);
}


/** The role an envelope's content is reached in: `aliasContent` when it shares the envelope's parser node (both stamp one index), else `node`. */
export function contentRole(envelope: object, content: () => unknown): Role {
	const own = indexOf(envelope);
	if (own === undefined) return 'node';
	const value = content();
	return value !== null && typeof value === 'object' && own === indexOf(value) ? 'aliasContent' : 'node';
}

/** How one stored value becomes what an accessor returns: `hydrateWith` bound to a parsed node's tree, or `hydrateStored` for a built node. */
type HydrateOne = (value: unknown) => unknown;

/** The list slots already hydrated: each holds the frozen items an accessor returns. */
const hydratedLists = new WeakSet<readonly unknown[]>();

/** The value of slot `key` of `node`, hydrated by `hydrateOne` and written back into the slot. */
function hydrateSlotBy(node: object, key: string, hydrateOne: HydrateOne): unknown {
	const slots = node as Record<string, unknown>;
	const child = hydrateOne(slots[key]);
	if (child !== slots[key]) slots[key] = child;
	return child;
}

/** `hydrateSlotBy` for a list slot: every item hydrated once, the slot then holding the frozen items. */
function hydrateSlotsBy(node: object, key: string, hydrateOne: HydrateOne): readonly unknown[] {
	const slots = node as Record<string, unknown>;
	const stored = slots[key];
	if (!Array.isArray(stored)) return [hydrateSlotBy(node, key, hydrateOne)];
	if (hydratedLists.has(stored)) return stored;
	const children = Object.freeze(stored.map((entry) => hydrateOne(entry)));
	hydratedLists.add(children);
	slots[key] = children;
	return children;
}

/** The value of slot `key` of a wrapped node, hydrated by `hydrateWith` in `role` and written back into the slot. */
export function hydrateSlotWith(node: object, key: string, tree: TreeHandle, wrap: WrapNode, role: Role = 'node'): unknown {
	return hydrateSlotBy(node, key, (value) => hydrateWith(value, tree, wrap, undefined, role));
}

function cacheOf(node: RecordHandle): Record<number, unknown> {
	liveWords(node);
	return (node.$cache ??= {});
}

export function childSlot(node: RecordHandle, word: number, width: number, forms: number, inline: number, built: number, wrap?: WrapNode, aliasContent = false): unknown {
	const cache = cacheOf(node);
	if (word in cache) return cache[word];
	const value = recordSlot(node, word, width, forms, inline, built);
	const role = aliasContent ? contentRole(node, () => value) : 'node';
	return (cache[word] = wrap === undefined ? value : hydrateWith(value, node.$tree, wrap, undefined, role));
}

export function childItems(node: RecordHandle, word: number, width: number, run: number | undefined, forms: number, inline: number, built: number, wrap?: WrapNode): readonly unknown[] {
	const cache = cacheOf(node);
	if (word in cache) return cache[word] as readonly unknown[];
	const items = recordSlots(node, word, width, run, forms, inline, built, wrap === undefined ? undefined : (item) => hydrateWith(item, node.$tree, wrap));
	return (cache[word] = Object.freeze(items)) as readonly unknown[];
}

/** `hydrateSlotWith` for a list slot. */
export function hydrateSlotsWith(node: object, key: string, tree: TreeHandle, wrap: WrapNode): readonly unknown[] {
	return hydrateSlotsBy(node, key, (value) => hydrateWith(value, tree, wrap));
}

/** The value of slot `key` of a built node, hydrated by `hydrateStored`: a coordinate it stores becomes the node every route returns, written back into the slot. */
export function hydrateStoredSlot(node: object, key: string): unknown {
	return hydrateSlotBy(node, key, hydrateStored);
}

/** `hydrateStoredSlot` for a list slot. */
export function hydrateStoredSlots(node: object, key: string): readonly unknown[] {
	return hydrateSlotsBy(node, key, hydrateStored);
}

export { numberText, type NumberBase } from './number.ts';
export {
	decodeIndex,
	decodeTree,
	encodeHandle,
	isCoordinate,
	readNode,
	type TreeHandle,
	type TriviaSideName
} from './read.ts';
export type { Role } from './identity.ts';
export { admitChildren, admitSlot, builtArenaOf, currentHandle, dispatched, inEngine, hydrateStored, recordBuilders, type EngineHandle } from './engine-scope.ts';
export { checkDelimited, type DelimitedSpec } from './delimited-check.ts';
export { inTreeEngine } from './engine-scope.ts';
export { metricsEnabled, recordFfi } from './metrics.ts';
export { toNodeData, toDetachedNodeData, PLAIN_KINDS, coordinateOf, spanOf, sourceTextOf, nodeText, hasNodeText, textOf, asTextNode, sideOf, sidesOf, writtenSides, carryPlace, type NodeDataLayout, type KindView, markEdited, treeHandleOf, isStorageKey, isDataKey, holdsSlots, holdTree, carryRead, carryReadTree, placeOf } from './node-data.ts';
export { TREE, treeOf, treeTokenOf, type TreeToken } from './tree-token.ts';
export { SOURCE, sourceOf } from './source-stamp.ts';
export { snapshotOf } from './snapshot.ts';
export {
	interiorPattern,
	projectInterior,
	lexedConfig,
	spelledForm,
	spelledInterior,
	unaffixed,
	refuseSiblingLead,
	type TokenInterior,
	type InteriorSlot,
	type ProjectedInterior
} from './interior.ts';
export { mapTriviaEntries, wrapRegistered };
export * from './runtime.ts';
export {
	positionWords,
	recordDelimiter,
	recordSeparator,
	recordFlag,
	recordLength,
	recordOf,
	recordPresent,
	recordSlot,
	recordSlots,
	rowData,
	rowOf,
	rowTrivia,
	rowWith,
	builtInputs,
	chosenSeparatorOf,
	slotValuesOf,
	storedSlotValues,
	type RefusedSlot
} from './record-view.ts';
export { handleDispose, isLeafHandle, isRecordPosition, type LeafHandle, type LeafMaker, type LeafSite, type RecordHandle, type RecordPosition } from './handle.ts';

export { BuiltArena, builtRecordOf, isBuiltNode, patchCell, patchFlag, patchList, patchListOptions, storeCell, storeFlag, storeList, storeListOptions, type BuiltDraft, type BuiltPlace, type BuiltText, type BuiltViews, type BuiltWith } from './built-arena.ts';
export { LEAF_SITES } from './built-ref.ts';
