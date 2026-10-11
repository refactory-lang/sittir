import type { AnyUntypedNode, ByteSpan, ErrorNode, LineGap, LineGapAddress, LineGaps, NodeTrivia, TransportCoordinate, TriviaEntry, TriviaFacts } from '@sittir/types';
import { mapTriviaEntries } from './trivia.ts';
import { carryPlacement, carryRead, carrySource, coordinateOf, holdsSlots, indexOf, isRead, isStorageKey, sourceOf, treeHandleOf, triviaOf, type DerivedSides } from './transport-data.ts';
import { Source } from './source.ts';
import { ERROR_KIND_ID } from './error-kind.ts';
import { hydrateStored, inEngine, isLive, type EngineHandle } from './engine-scope.ts';
import { Delimiter } from './delimiter.ts';
import { decodeIndex, decodeTree, isCoordinate, readNode, type TreeHandle } from './read.ts';
import { markIndexEdited, register, registered, type EditSide, type Role } from './identity.ts';
import { treeOf } from './tree-token.ts';
import { spelledForm } from './interior.ts';

export { Delimiter } from './delimiter.ts';
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

/**
 * Runs a rebuild inside the node's own engine and hands the source node's trivia on to the
 * node it returns. Inner entries can only travel to a node that is still empty: once the
 * rebuild gives the node a child, the comment would sit beside it, so the rebuild refuses.
 */
export function rebuilt<R>(source: object, handle: EngineHandle | undefined, build: () => R): R {
	const node = source as AnyUntypedNode;
	const result = handle === undefined ? build() : inEngine(handle, build);
	if (isNode(result)) {
		carryEdit(node, result);
		const wrappers = handle?.current.trivia.rebuildWrappers;
		if (wrappers !== undefined) carryRebuiltSlots(node as unknown as Record<string, unknown>, result as unknown as Record<string, unknown>, wrappers);
	}
	const trivia = triviaOf(node);
	if (trivia === undefined || !isNode(result)) return result;
	if (Object.values(trivia.inner ?? {}).some((entries) => (entries?.length ?? 0) > 0) && !isEmptyNode(result)) {
		const kind = handle?.current.trivia.kindName(node.$type) ?? String(node.$type);
		throw new Error(`trivia: ${kind} holds inner comments; move them to leading/trailing on the new child`);
	}
	setTriviaData(result, trivia);
	return result;
}

/**
 * Whether no slot of the node holds a value: every `_`-keyed storage entry is
 * absent or an empty list. Only such a node can hold inner trivia, since a
 * comment beside any child has that child to lead or trail.
 */
export function isEmptyNode(node: AnyUntypedNode): boolean {
	const record = node as unknown as Record<string, unknown>;
	for (const key of Object.keys(record)) {
		if (key.charCodeAt(0) !== 95) continue;
		const value = record[key];
		if (value != null && !(Array.isArray(value) && value.length === 0)) return false;
	}
	return true;
}

const scopedBy = (handle: EngineHandle | undefined): Scoped => (handle === undefined ? (fn) => fn() : (fn) => inEngine(handle, fn));

/**
 * The writes of a node's trivia, bound to its engine. An item is an extra kind's node, or a
 * loose string built through `ir.comment`: its full spelling (`'// note'`) or its interior
 * (`' note'`). `inner` and `innerAt` write only to an empty node of a kind with inner gaps.
 * A write marks the node edited (`markEditedNode`): a leading or trailing write on the outside
 * of its span, an inner write inside it.
 */
function triviaWriter(target: object, handle: EngineHandle | undefined) {
	const node = target as AnyUntypedNode;
	if (handle === undefined) throw new Error(NO_ENGINE);
	const facts: TriviaFacts = handle.current.trivia;
	const scoped = scopedBy(handle);
	const kind = (): string => facts.kindName(node.$type) ?? String(node.$type);
	const refuseUnheld = (): void => {
		if (reachedByAccessors(node)) return;
		throw new Error(
			`trivia: this ${kind()} was reached outside its parent's accessors (through a query, or under a node a query reached), so no chain of accessors from the root holds it and a comment written on it would not render; reach it through the accessors from the root instead`
		);
	};
	const entriesOf = (items: readonly unknown[]): readonly TriviaEntry[] =>
		scoped(() => items.map((item) => triviaEntryOf(item, facts)));
	const gapsOf = (): readonly string[] => {
		const gaps = facts.innerGaps[kind()] ?? [];
		if (gaps.length === 0) throw new Error(`trivia: ${kind()} has no inner gap; attach to a child with leading/trailing`);
		return gaps;
	};
	const writeInner = (inner: NonNullable<NodeTrivia['inner']>): NodeTrivia['inner'] => {
		const gaps = gapsOf();
		for (const gap of Object.keys(inner)) {
			if (!gaps.includes(gap)) throw new Error(`trivia: ${kind()} has no gap '${gap}'`);
		}
		if (!isEmptyNode(node)) throw new Error(`trivia: ${kind()} is not empty; attach to a child with leading/trailing`);
		return inner;
	};
	const store = (trivia: NodeTrivia, side: TriviaSideName): AnyUntypedNode => {
		markWritten(node, side);
		setTriviaData(node, trivia);
		markEditedNode(node, side === 'inner' ? 'inside' : 'outside');
		return node;
	};
	const innerAt = (gap: string, items: readonly unknown[]): AnyUntypedNode | readonly TriviaEntry[] => {
		if (!gapsOf().includes(gap)) throw new Error(`trivia: ${kind()} has no gap '${gap}'`);
		if (items.length === 0) return hydratedEntries(triviaOf(node)?.inner?.[gap] ?? []);
		refuseUnheld();
		return store({ ...triviaOf(node), inner: writeInner({ ...triviaOf(node)?.inner, [gap]: entriesOf(items) }) }, 'inner');
	};
	return {
		side: (position: 'leading' | 'trailing', items: readonly unknown[]): AnyUntypedNode | readonly TriviaEntry[] =>
			items.length === 0
				? hydratedEntries(readTrivia(node, handle.lineGapsOf)?.[position] ?? [])
				: (refuseUnheld(), store({ ...triviaOf(node), [position]: entriesOf(items) }, position)),
		inner: (items: readonly unknown[]): AnyUntypedNode | readonly TriviaEntry[] => innerAt(gapsOf()[0]!, items),
		innerAt
	};
}

function hydratedEntries(entries: readonly TriviaEntry[]): readonly TriviaEntry[] {
	return entries.some(isCoordinate) ? entries.map(hydrateTriviaEntry) : entries;
}

export function hydrateTriviaEntry(entry: unknown): TriviaEntry {
	if (!isCoordinate(entry)) return entry as TriviaEntry;
	const node = hydrateStored(entry);
	return (node !== null && typeof node === 'object' ? carryPlacement(entry, node) : node) as TriviaEntry;
}

type TriviaSideName = 'leading' | 'trailing' | 'inner';

const writtenSides = new WeakMap<object, Set<TriviaSideName>>();
const readLineGaps = new WeakMap<object, LineGaps>();
const composedTrivia = new WeakMap<object, NodeTrivia | undefined>();

/**
 * Hand an edited node what it keeps of the node it was rebuilt from: that
 * the read produced it, where it sits in the source, and which trivia sides
 * were written. Its line gaps then derive from the same source position, and
 * a side the caller rewrote stays written.
 */
function carryRebuiltSlots(read: Record<string, unknown>, result: Record<string, unknown>, wrappers: ReadonlySet<number>): void {
	for (const key of Object.keys(result)) {
		if (!isStorageKey(key)) continue;
		const fresh = result[key];
		const held = read[key];
		if (fresh === null || typeof fresh !== 'object' || Array.isArray(fresh) || held === null || typeof held !== 'object' || Array.isArray(held) || fresh === held) continue;
		const freshNode = fresh as Record<string, unknown>;
		const heldNode = held as Record<string, unknown>;
		if (typeof freshNode.$type !== 'number' || freshNode.$type !== heldNode.$type || !wrappers.has(freshNode.$type)) continue;
		if (sourceOf(freshNode) !== undefined || sourceOf(heldNode) === undefined) continue;
		carryEdit(heldNode, freshNode);
	}
}

function carryEdit(from: object, to: object): void {
	carryRead(from, to);
	carrySource(from, to);
	const written = writtenSides.get(from);
	if (written !== undefined) writtenSides.set(to, new Set(written));
}

/**
 * The holder whose slot an accessor put each parsed node in (`hydrateSlotWith`, `hydrateSlotsWith`,
 * `hydrateStoredSlot(s)`): a guard only. A write on a parsed node is accepted while that chain of
 * holders reaches the root or a built node (`reachedByAccessors`), since only then does a node the
 * render walks carry it; it decides that refusal and never what renders.
 */
const heldBy = new WeakMap<object, object>();

function holdBySlot(holder: object, child: unknown): void {
	if (typeof child === 'object' && child !== null) heldBy.set(child, holder);
}

/** Whether a chain of holders from the root, or from a built node, reaches `node`: the root and a built node render their own data. */
function reachedByAccessors(node: object): boolean {
	for (let at: object | undefined = node; at !== undefined; at = heldBy.get(at)) {
		if ('$errors' in at || treeOf(at) === undefined || sourceOf(at) === undefined) return true;
	}
	return false;
}

/** The wrappers made in the `aliasContent` role (`wrapRegistered`): contents that share their envelope's parser node. */
const sharesEnvelopeNode = new WeakSet<object>();

/**
 * Record an in-place write on a parsed node, on `side` of its span: the one hook every
 * in-place write marks through, so a node folds to its bytes only while no write lies inside
 * its range. A content that shares its envelope's parser node (`sharesEnvelopeNode`) marks
 * `inside`: its outside lies inside the envelope's span. A built node holds no tree and
 * renders from its data already, so nothing is marked.
 */
export function markEditedNode(node: object, side: EditSide): void {
	const tree = treeOf(node);
	const index = indexOf(node);
	if (tree === undefined || index === undefined) return;
	markIndexEdited(tree, index, sharesEnvelopeNode.has(node) ? 'inside' : side);
}

function markWritten(node: object, side: TriviaSideName): void {
	const sides = writtenSides.get(node) ?? new Set<TriviaSideName>();
	sides.add(side);
	writtenSides.set(node, sides);
	composedTrivia.delete(node);
}

function isDerivedSide(node: object, side: 'leading' | 'trailing'): boolean {
	return writtenSides.get(node)?.has(side) !== true;
}

/**
 * A read node's trivia as its parse has it: the comment entries the reader
 * gave it, with the line-break whitespace it owns before it and in its
 * closing gap interleaved by position. The line gaps are asked for once, on
 * the first read; a side whose trivia was written holds what was written,
 * and the other side keeps what the read gives it.
 */
export function readTrivia(target: object, lineGapsOf: ((address: LineGapAddress) => LineGaps) | undefined): NodeTrivia | undefined {
	const node = target as AnyUntypedNode;
	const stored = triviaOf(node);
	const gaps = lineGapsRead(node, lineGapsOf);
	if (gaps === undefined || (gaps.leading.length === 0 && gaps.trailing.length === 0)) return stored;
	if (composedTrivia.has(node)) return composedTrivia.get(node);
	const leading = isDerivedSide(node, 'leading') ? interleaved(stored?.leading, gaps.leading) : stored?.leading;
	const trailing = isDerivedSide(node, 'trailing') ? interleaved(stored?.trailing, gaps.trailing) : stored?.trailing;
	const trivia = { ...stored, leading, trailing };
	composedTrivia.set(node, trivia);
	return trivia;
}

/**
 * Which sides of a read node's trivia are derived from its line gaps, and the
 * spans of the siblings beside it in the source (`previous` `null` for its
 * parent's first, `next` `null` for its last); `undefined` when `readTrivia`
 * derives nothing for it.
 */
export function readDerivedSides(
	target: object,
	lineGapsOf: ((address: LineGapAddress) => LineGaps) | undefined
): DerivedSides | undefined {
	const gaps = lineGapsRead(target, lineGapsOf);
	if (gaps === undefined) return undefined;
	return { previous: gaps.previous, next: gaps.next, leading: isDerivedSide(target, 'leading'), trailing: isDerivedSide(target, 'trailing') };
}

function lineGapsRead(target: object, lineGapsOf: ((address: LineGapAddress) => LineGaps) | undefined): LineGaps | undefined {
	const node = target as AnyUntypedNode;
	const address = lineGapAddressOf(node);
	if (!isRead(node) || address === undefined || lineGapsOf === undefined) return undefined;
	const cached = readLineGaps.get(node);
	if (cached !== undefined) return cached;
	const gaps = lineGapsOf(address);
	readLineGaps.set(node, gaps);
	return gaps;
}

/** How the line-gap query and a query name a read node: the handle its coordinate names it by; `undefined` for a node no read gave. */
function lineGapAddressOf(node: AnyUntypedNode): LineGapAddress | undefined {
	const handle = coordinateOf(node)?.$treeHandle ?? sourceOf(node)?.treeHandle;
	return handle === undefined ? undefined : { handle };
}

export type NodeAddress = LineGapAddress;

export function nodeAddressOf(node: AnyUntypedNode): NodeAddress | undefined {
	return lineGapAddressOf(node);
}

/** Comment entries and whitespace runs of one side merged in source order; `undefined` when both are empty. */
function interleaved(entries: readonly TriviaEntry[] | undefined, gaps: readonly LineGap[]): readonly TriviaEntry[] | undefined {
	const positioned: { readonly at: number; readonly entry: TriviaEntry }[] = [];
	let at = -1;
	for (const entry of entries ?? []) {
		const start = typeof entry === 'number' ? undefined : coordinateOf(entry as object)?.$span.start;
		at = start ?? at;
		positioned.push({ at, entry });
	}
	for (const gap of gaps) positioned.push({ at: gap.start, entry: gap.kind });
	positioned.sort((a, b) => a.at - b.at);
	return positioned.length === 0 ? undefined : positioned.map(({ entry }) => entry);
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

/** `node.$trivia.inner(...)`: the first inner gap of a kind that has one. */
export function triviaInner(
	node: object,
	handle: EngineHandle | undefined,
	items: readonly unknown[]
): AnyUntypedNode | readonly TriviaEntry[] {
	return triviaWriter(node, handle).inner(items);
}

/** `node.$trivia.innerAt(gap, ...)`: a named inner gap of a kind that keys its gaps. */
export function triviaInnerAt(
	node: object,
	handle: EngineHandle | undefined,
	gap: string,
	items: readonly unknown[]
): AnyUntypedNode | readonly TriviaEntry[] {
	return triviaWriter(node, handle).innerAt(gap, items);
}

/** One trivia item as its entry: a trivia node, a parsed ERROR node or a whitespace kind id as it is, a string by `textEntryOf`. */
function triviaEntryOf(item: unknown, facts: TriviaFacts): TriviaEntry {
	if (typeof item === 'string') return textEntryOf(item, facts);
	if (typeof item !== 'number' && !isNode(item)) {
		throw new Error(`trivia: an entry is a node, a whitespace kind or a comment's text, not ${JSON.stringify(item)}`);
	}
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

const collapseWrapper = (item: unknown, wrapper: ListViewWrapper | undefined): unknown => {
	if (wrapper === undefined || item === null || typeof item !== 'object') return item;
	const node = item as Members & Record<string, unknown>;
	if ((node as { $type?: unknown }).$type !== wrapper.kind) return item;
	if (wrapper.decorations.some((key) => node[key] !== undefined)) return item;
	return node[wrapper.content]!.call(node);
};

/** The items of a list view: its elements, each wrapper that carries only its content read as that content. */
export function listItems(elements: readonly unknown[], wrapper: ListViewWrapper | undefined): readonly unknown[] {
	return Object.freeze(elements.map((element) => collapseWrapper(element, wrapper)));
}

/** The key a wrapped list node keeps its reader of the items under: it hydrates them on the first read. */
export const LIST_READ: unique symbol = Symbol('sittir.listRead');

type ListItemsHolder = { [LIST_ITEMS]?: readonly unknown[]; readonly [LIST_READ]?: () => readonly unknown[] };

/** The items of a list node: the ones it holds, or, for a wrapped list, the ones its reader hydrates and keeps on the first read. */
export function listItemsOf(node: ListItemsHolder): readonly unknown[] {
	return (node[LIST_ITEMS] ??= node[LIST_READ]!());
}

/** The `ReadonlyArray` methods of a list node, written once; each reads the items the node holds under `LIST_ITEMS`. */
export const LIST_METHODS = Object.fromEntries(
	READONLY_ARRAY_METHODS.map((name) => [
		name,
		function (this: ListItemsHolder, ...args: unknown[]): unknown {
			return (listItemsOf(this) as unknown as Members)[name]!(...args);
		}
	])
) as Readonly<Record<(typeof READONLY_ARRAY_METHODS)[number], (this: ListItemsHolder, ...args: unknown[]) => unknown>>;

/** The iterator member of a list node. */
export function listIterator(this: ListItemsHolder): IterableIterator<unknown> {
	return listItemsOf(this)[Symbol.iterator]();
}

/** What an owner knows of the list it holds: the list itself, hydrated by `hydrate` when it is a read stub, and its stored elements (undefined while the stub cannot be read). */
export interface OwnerView {
	readonly list: Record<string, unknown> | undefined;
	readonly stored: readonly unknown[] | undefined;
}

export function ownerView(stored: unknown, count: string, hydrate?: (list: object) => unknown): OwnerView {
	const list = stored as (object & Partial<AnyUntypedNode>) | null | undefined;
	if (list == null) return { list: undefined, stored: [] };
	const source = count in list || !isCoordinate(list) ? list : hydrate?.(list);
	if (source === undefined) return { list: undefined, stored: undefined };
	const elements = (source as Record<string, unknown>)[count];
	return {
		list: source as Record<string, unknown>,
		stored: Array.isArray(elements) ? elements : elements == null ? [] : [elements]
	};
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
	return (list as Record<string, unknown> | null | undefined)?.[`_${key}`] ?? fallback;
}

const INDEX_GETTERS: ((this: ListItemsHolder) => unknown)[] = [];

/** One getter per index position, shared by every wrapped list: an index reads the item the list hydrates on first use. */
export function defineListIndices(node: object, count: number): void {
	for (let index = 0; index < count; index++) {
		INDEX_GETTERS[index] ??= function (this: ListItemsHolder) {
			return listItemsOf(this)[index];
		};
		Object.defineProperty(node, index, { get: INDEX_GETTERS[index], enumerable: false, configurable: true });
	}
}

/** The refusal of a list owner built over a read stub: a stub is a parsed list that cannot be counted without its tree, which a raw factory does not have, so the build names the stub as `engine.build` does. */
export function refuseReadStub(storage: string): never {
	throw new Error(`list view: ${storage} is a read stub, which a node built without its tree cannot hold; build it from its tree`);
}

/** The key a list node keeps its frozen items under. */
export const LIST_ITEMS: unique symbol = Symbol('sittir.listItems');

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

export const STORED_SLOT_READERS: unique symbol = Symbol('sittir.storedSlotReaders');

type StoredSlotReaders = Readonly<Record<string, (this: object) => unknown>>;

export function storedSlotReader(node: object, accessor: string): unknown {
	const readers = (node as { readonly [STORED_SLOT_READERS]?: StoredSlotReaders })[STORED_SLOT_READERS];
	return readers?.[accessor] ?? (node as Record<string, unknown>)[accessor];
}

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
	readonly kind: number;
	readonly make: (config: never) => unknown;
	readonly keys: readonly GroupSeatKey[];
}

export function groupField(group: object | undefined, field: string): unknown {
	return (group as Members | undefined)?.[field]?.call(group);
}

/**
 * A seated key's `$with` setter. Through a present group it writes the group's own field; with no
 * value it leaves the group absent; with a value it builds an absent group from that field alone
 * when no other field is required, and refuses otherwise. A key that spells the seat's slot also
 * takes the whole group.
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
	if (key.name === spec.slot && args.length === 1 && (args[0] as { $type?: unknown } | null)?.$type === spec.kind) {
		return seat(args[0]);
	}
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
	const o = v as Record<string, unknown>;
	if (typeof o.$type !== 'number') return false;
	return (
		holdsSlots(o) ||
		typeof o.$text === 'string' ||
		o.$_layout !== undefined ||
		o.$source === Source.Ts ||
		o.$source === Source.Sg ||
		o.$source === Source.Factory
	);
}

export function describeValue(v: unknown): string {
	if (typeof v === 'string') return v;
	try {
		return JSON.stringify(v, (_key, value) => (typeof value === 'bigint' ? `${value}n` : value)) ?? String(v);
	} catch {
		return String(v);
	}
}

/** Whether `v` is a node value a builder takes as one: a node, or a coordinate naming one past a read's depth. */
export function isNodeValue(v: unknown): v is AnyUntypedNode | TransportCoordinate {
	return isNode(v) || isCoordinate(v);
}

export function isNodeOfKind(v: unknown, kind: number): boolean {
	return isNodeValue(v) && v.$type === kind;
}

export function orDefault<V>(value: V | undefined, make: () => NoInfer<V>): V {
	return value ?? make();
}

export function configFieldOr(input: unknown, key: string, orElse: () => unknown): unknown {
	return input !== null && typeof input === 'object' && !isNodeValue(input) && key in input
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

/**
 * The byte range of a parsed node in the source its tree was read from, or `undefined` for a node that was built. Internal: a node's position is not part of the public node surface, and the range belongs to the version of the tree the node was read from, so it says nothing about the node after an edit.
 */
export function spanOf(node: object): ByteSpan | undefined {
	const span = coordinateOf(node)?.$span;
	return span === undefined ? undefined : { start: span.start, end: span.end };
}

export function isErrorNode(v: unknown): v is ErrorNode {
	return isParsedNode(v) && v.$type === ERROR_KIND_ID;
}

export function hasKind(v: object): v is { kind: string } & Record<string, unknown> {
	return 'kind' in v && typeof (v as Record<string, unknown>).kind === 'string';
}

function setTriviaData(node: AnyUntypedNode, triviaData: NodeTrivia): void {
	node.$_layout = { ...node.$_layout, trivia: triviaData };
}

/** How a hydrate turns a transport into its kind's node: the grammar's `wrapNode`. */
export type WrapTransport = (data: object, tree: TreeHandle) => unknown;

/**
 * One stored value as an accessor returns it: the node the registry holds at its index and `role`, else a
 * coordinate read `depth` levels down (one when absent) and hydrated as the transport it reads as, a
 * transport wrapped and registered (`wrapRegistered`), and anything else (a wrapped node, a kind id such as
 * a unit variant's, a boolean, text) as it is.
 */
export function hydrateWith(value: unknown, tree: TreeHandle, wrap: WrapTransport, depth?: number, role: Role = 'node'): unknown {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
	if (isCoordinate(value)) {
		const known = decodeTree(value.$treeHandle) === tree.id ? registered(tree, decodeIndex(value.$treeHandle), role) : undefined;
		return known ?? hydrateWith(readNode(tree, value, depth), tree, wrap, undefined, role);
	}
	if (isTypedNode(value) || typeof (value as { readonly $type?: unknown }).$type !== 'number') return value;
	return wrapRegistered(value, tree, wrap, role);
}

/**
 * The node `value` reads as on `tree`: the wrapper already registered at its index and role, or
 * `wrap(value, tree)`, registered there and, in the `aliasContent` role, stamped as sharing its
 * envelope's parser node. A value that names no index of `tree` is wrapped and not registered.
 */
export function wrapRegistered<T>(value: object, tree: TreeHandle, wrap: (value: object, tree: TreeHandle) => T, role: Role = 'node'): T {
	const handle = treeHandleOf(value);
	if (handle === undefined || decodeTree(handle) !== tree.id) return wrap(value, tree);
	const index = decodeIndex(handle);
	const known = registered(tree, index, role);
	if (known !== undefined) return known as T;
	const wrapper = wrap(value, tree);
	if (wrapper !== null && typeof wrapper === 'object') {
		register(tree, index, role, wrapper);
		if (role === 'aliasContent') sharesEnvelopeNode.add(wrapper);
	}
	return wrapper;
}

/** The role an envelope's content is reached in: `aliasContent` when it shares the envelope's parser node (both stamp one index), else `node`. */
export function contentRole(envelope: object, content: unknown): Role {
	if (content === null || typeof content !== 'object') return 'node';
	const own = indexOf(envelope);
	return own !== undefined && own === indexOf(content) ? 'aliasContent' : 'node';
}

/** How one stored value becomes what an accessor returns: `hydrateWith` bound to a parsed node's tree, or `hydrateStored` for a built node. */
type HydrateOne = (value: unknown) => unknown;

/** The list slots already hydrated: each holds the frozen items an accessor returns. */
const hydratedLists = new WeakSet<readonly unknown[]>();

/** The value of slot `key` of `node`, hydrated by `hydrateOne`, written back into the slot and held by `node` (`heldBy`). */
function hydrateSlotBy(node: object, key: string, hydrateOne: HydrateOne): unknown {
	const slots = node as Record<string, unknown>;
	const child = hydrateOne(slots[key]);
	if (child !== slots[key]) slots[key] = child;
	holdBySlot(node, child);
	return child;
}

/** `hydrateSlotBy` for a list slot: every item hydrated once, the slot then holding the frozen items. */
function hydrateSlotsBy(node: object, key: string, hydrateOne: HydrateOne): readonly unknown[] {
	const slots = node as Record<string, unknown>;
	const stored = slots[key];
	if (!Array.isArray(stored)) return [hydrateSlotBy(node, key, hydrateOne)];
	if (hydratedLists.has(stored)) return stored;
	const children = Object.freeze(stored.map((entry) => hydrateOne(entry)));
	for (const child of children) holdBySlot(node, child);
	hydratedLists.add(children);
	slots[key] = children;
	return children;
}

/** The value of slot `key` of a wrapped node, hydrated by `hydrateWith` in `role`, written back into the slot and held by it. */
export function hydrateSlotWith(node: object, key: string, tree: TreeHandle, wrap: WrapTransport, role: Role = 'node'): unknown {
	return hydrateSlotBy(node, key, (value) => hydrateWith(value, tree, wrap, undefined, role));
}

/** `hydrateSlotWith` for a list slot. */
export function hydrateSlotsWith(node: object, key: string, tree: TreeHandle, wrap: WrapTransport): readonly unknown[] {
	return hydrateSlotsBy(node, key, (value) => hydrateWith(value, tree, wrap));
}

/** The value of slot `key` of a built node, hydrated by `hydrateStored`: a coordinate it stores becomes the node every route returns, written back into the slot and held by it. */
export function hydrateStoredSlot(node: object, key: string): unknown {
	return hydrateSlotBy(node, key, hydrateStored);
}

/** `hydrateStoredSlot` for a list slot. */
export function hydrateStoredSlots(node: object, key: string): readonly unknown[] {
	return hydrateSlotsBy(node, key, hydrateStored);
}

export { numberText, type NumberBase } from './number.ts';
export { decodeIndex, decodeTree, isCoordinate, readNode, type TreeHandle } from './read.ts';
export type { Role } from './identity.ts';
export { currentHandle, inEngine, hydrateStored, type EngineHandle } from './engine-scope.ts';
export { checkDelimited, type DelimitedSpec } from './delimited-check.ts';
export { inTreeEngine } from './engine-scope.ts';
export { metricsEnabled, recordFfi } from './metrics.ts';
export { toTransportData, toDetachedTransportData, STORED_TRIVIA, carrySource, type SourceGapEvidence, type SourceFlankEvidence, type TransportLayout, type TriviaView, markEdited, treeHandleOf, isStorageKey, isDataKey, holdsSlots, holdTree, carryRead, sourceOf } from './transport-data.ts';
export { carryTree, treeTokenOf, type TreeToken } from './tree-token.ts';
export { snapshotOf } from './snapshot.ts';
export {
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
export { mapTriviaEntries };
export * from './runtime.ts';
