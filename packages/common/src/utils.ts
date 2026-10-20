import type { AnyUntypedNode, ErrorNode, NodeTrivia, NodeCoordinate, TriviaEntry, TriviaFacts } from '@sittir/types';
import { mapTriviaEntries } from './trivia.ts';
import { carryRead, carrySource, holdsSlots, indexOf, isRead, isStorageKey, markRebuilt, PLAIN_KINDS, sideOf, slotSeparatorOf, sourceHandleOf, sourceOf, tableAt, toNodeData, treeHandleOf, triviaOf } from './node-data.ts';
import { Source } from './source.ts';
import { ERROR_KIND_ID } from './error-kind.ts';
import { hydrateStored, inEngine, isLive, type EngineHandle } from './engine-scope.ts';
import { Delimiter } from './delimiter.ts';
import { decodeIndex, decodeTree, isCoordinate, readNode, type TreeHandle, type TriviaSideName } from './read.ts';
import { register, registered, type Role } from './identity.ts';
import { treeOf } from './tree-token.ts';
import { spelledForm } from './interior.ts';
import { snapshotOf } from './snapshot.ts';

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
 * node it returns: a built source's stored sides, and the source identity a parsed source's
 * sides are read through. Inner comments can only travel to a node that is still empty: once the
 * rebuild gives the node a child, a comment would sit beside it, so the rebuild refuses. Inner
 * layout (whitespace, depth members, which cross as bare kinds) spelled the inside of an empty
 * node, so a node that gains a child drops it.
 */
export function rebuilt<R>(source: object, handle: EngineHandle | undefined, build: () => R): R {
	const node = source as AnyUntypedNode;
	const result = handle === undefined ? build() : inEngine(handle, build);
	if (!isNode(result)) return result;
	markRebuilt(result);
	carryRead(node, result);
	carrySource(node, result);
	const facts = handle?.current.trivia;
	if (facts !== undefined) {
		const stands = (kindId: number): boolean => facts.rebuildWrappers.has(kindId) || facts.listKinds.has(kindId);
		carryRebuiltSlots(node as unknown as Record<string, unknown>, result as unknown as Record<string, unknown>, stands);
	}
	const inner = isEmptyNode(result) ? [] : sideOf(node, 'inner');
	if (inner.some((entry) => typeof entry !== 'number')) {
		const kind = facts?.kindName(node.$type) ?? String(node.$type);
		throw new Error(`trivia: ${kind} holds inner comments; move them to leading/trailing on the new child`);
	}
	const trivia = triviaOf(node);
	if (inner.length > 0) setTriviaData(result, { ...trivia, inner: [] });
	else if (trivia !== undefined) setTriviaData(result, trivia);
	return handle === undefined ? result : handle.settle(result);
}

/**
 * Whether the node has no child with width. Only such a node can hold inner trivia, since a
 * comment beside any child has that child to lead or trail.
 *
 * @param node - A built or parsed node.
 * @returns Whether no child holds sides: a child holds sides when it is named, not an extra or
 *   `ERROR`, and has width. A parsed node's width is read from its tree, so a zero-width child
 *   (typescript's automatic semicolon) holds none. A built node's child has the width of its
 *   rendered text, and every child a built node stores renders text (a stored automatic semicolon
 *   renders `"\n"`), so a built node is empty when every `_`-keyed storage entry is absent or an
 *   empty list.
 */
export function isEmptyNode(node: AnyUntypedNode): boolean {
	const tree = treeOf(node);
	const handle = treeHandleOf(node);
	if (tree?.isEmpty !== undefined && handle !== undefined) return tree.isEmpty(decodeIndex(handle));
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
 * (`' note'`). `inner` writes only to an empty node of a kind with an inner site. A parsed
 * node's side is written into its tree's trivia table, a built node's into its own data. The table
 * takes each entry as detached data (`snapshotOf`): it outlives any other tree an entry was read
 * from, and a snapshot of the tree returns its sides as they are.
 */
function triviaWriter(target: object, handle: EngineHandle | undefined) {
	const node = target as AnyUntypedNode;
	if (handle === undefined) throw new Error(NO_ENGINE);
	const facts: TriviaFacts = handle.current.trivia;
	const scoped = scopedBy(handle);
	const kind = (): string => facts.kindName(node.$type) ?? String(node.$type);
	const read = (side: TriviaSideName): readonly TriviaEntry[] => hydratedEntries(sideOf(node, side));
	const write = (side: TriviaSideName, items: readonly unknown[]): AnyUntypedNode => {
		const entries = scoped(() => items.map((item) => triviaEntryOf(item, facts)));
		const at = tableAt(node);
		if (at === undefined) setTriviaData(node, { ...triviaOf(node), [side]: entries });
		else at.tree.writeTriviaSide(at.index, side, entries.map((entry) => (typeof entry === 'number' ? entry : toNodeData(snapshotOf(entry) as AnyUntypedNode, PLAIN_KINDS))));
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

function hydratedEntries(entries: readonly TriviaEntry[]): readonly TriviaEntry[] {
	return entries.some(isCoordinate) ? entries.map(hydrateTriviaEntry) : entries;
}

export function hydrateTriviaEntry(entry: unknown): TriviaEntry {
	return (isCoordinate(entry) ? hydrateStored(entry) : entry) as TriviaEntry;
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
		if (fresh === null || typeof fresh !== 'object' || Array.isArray(fresh) || held === null || typeof held !== 'object' || Array.isArray(held) || fresh === held) continue;
		const freshNode = fresh as Record<string, unknown>;
		const heldNode = held as Record<string, unknown>;
		if (typeof freshNode.$type !== 'number' || freshNode.$type !== heldNode.$type || !stands(freshNode.$type)) continue;
		if (sourceOf(freshNode) !== undefined || sourceOf(heldNode) === undefined) continue;
		carryRead(heldNode, freshNode);
		carrySource(heldNode, freshNode);
	}
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

const SEPARATOR_GETTERS = new Map<string | undefined, () => unknown>();

/**
 * Defines the `separator` of a wrapped list or list owner: a shared getter that answers the list's
 * own `_separator` when its data stores one, else the one its tree answers (`slotSeparatorOf`).
 * An owner names the accessor that returns its list and answers that list's `separator`.
 */
export function defineListSeparator(node: object, accessor?: string): void {
	let getter = SEPARATOR_GETTERS.get(accessor);
	if (getter === undefined) {
		getter = function (this: Record<string, unknown>) {
			if (accessor !== undefined) return ((this[accessor] as () => { readonly separator?: unknown } | null | undefined).call(this))?.separator;
			return this._separator ?? slotSeparatorOf(this);
		};
		SEPARATOR_GETTERS.set(accessor, getter);
	}
	Object.defineProperty(node, 'separator', { get: getter, enumerable: false, configurable: true });
}

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
		try {
			return String(v);
		} catch {
			return Object.prototype.toString.call(v);
		}
	}
}

/** Whether `v` is a node value a builder takes as one: a node, or a coordinate naming one past a read's depth. */
export function isNodeValue(v: unknown): v is AnyUntypedNode | NodeCoordinate {
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

export function isErrorNode(v: unknown): v is ErrorNode {
	return isParsedNode(v) && v.$type === ERROR_KIND_ID;
}

export function hasKind(v: object): v is { kind: string } & Record<string, unknown> {
	return 'kind' in v && typeof (v as Record<string, unknown>).kind === 'string';
}

function setTriviaData(node: AnyUntypedNode, triviaData: NodeTrivia): void {
	node.$_layout = { ...node.$_layout, trivia: triviaData };
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

/**
 * The node `value` reads as on `tree`: the wrapper already registered at its index and role, or
 * `wrap(value, tree)`, registered there. A value that names no index of `tree` is wrapped and not
 * registered.
 */
export function wrapRegistered<T>(value: object, tree: TreeHandle, wrap: (value: object, tree: TreeHandle) => T, role: Role = 'node'): T {
	const handle = treeHandleOf(value);
	if (handle === undefined || decodeTree(handle) !== tree.id) return wrap(value, tree);
	const index = decodeIndex(handle);
	const known = registered(tree, index, role);
	if (known !== undefined) return known as T;
	const wrapper = wrap(value, tree);
	if (wrapper !== null && typeof wrapper === 'object') register(tree, index, role, wrapper);
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
export { decodeIndex, decodeTree, isCoordinate, readNode, type TreeHandle, type TriviaSideName } from './read.ts';
export type { Role } from './identity.ts';
export { admitChildren, admitSlot, currentHandle, inEngine, hydrateStored, type EngineHandle } from './engine-scope.ts';
export { checkDelimited, type DelimitedSpec } from './delimited-check.ts';
export { inTreeEngine } from './engine-scope.ts';
export { metricsEnabled, recordFfi } from './metrics.ts';
export { toNodeData, toDetachedNodeData, PLAIN_KINDS, spanOf, spannedTextOf, sideOf, sidesOf, carrySource, type NodeDataLayout, type KindView, markEdited, treeHandleOf, isStorageKey, isDataKey, holdsSlots, holdTree, carryRead, sourceOf } from './node-data.ts';
export { carryTree, treeOf, treeTokenOf, type TreeToken } from './tree-token.ts';
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
export { mapTriviaEntries };
export * from './runtime.ts';
