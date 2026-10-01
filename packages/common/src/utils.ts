import type { AnyUntypedNode, StringIndexRange, Edit, NodeTrivia, TriviaEntry, TriviaFacts } from '@sittir/types';
import { mapTriviaEntries } from './trivia.ts';
import { detachCoordinate, holdsSlots } from './transport-data.ts';
import { Source } from './source.ts';
import { ERROR_KIND_ID } from './error-kind.ts';
import { currentHandle, inEngine, isLive, type EngineHandle } from './engine-scope.ts';
import { toEditAt } from './edit.ts';
import { Delimiter } from './delimiter.ts';
import { hydrateStub, isStub, readUntypedNode, type TreeHandle } from './readUntypedNode.ts';

export { Delimiter } from './delimiter.ts';
export { Source };
export { ERROR_KIND_ID, ERROR_KIND_NAME } from './error-kind.ts';

/**
 * @forFutureUse ADR-0018 (docs/adr/0018-dehoist-nodedata-surface.md) —
 * runtime shape backing the `$with` update namespace. Not yet wired into
 * generated output; scaffolding only.
 */
interface WithMethodsRuntime<T extends object = AnyUntypedNode> {
	$render(): string;
	$toEdit(startOrRange: number | StringIndexRange, endPos?: number): Edit;
	$replace(target: { range(): StringIndexRange }): Edit;
	$trivia: TriviaSetterRuntime<T & WithMethodsRuntime<T>>;
}

interface TriviaSetterRuntime<Self> {
	leading(): readonly TriviaEntry[];
	leading(...items: unknown[]): Self;
	trailing(): readonly TriviaEntry[];
	trailing(...items: unknown[]): Self;
	inner(): readonly TriviaEntry[];
	inner(...items: unknown[]): Self;
	innerAt(gap: string): readonly TriviaEntry[];
	innerAt(gap: string, ...items: unknown[]): Self;
}

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

export function withMethods<T extends AnyUntypedNode>(node: T): T & WithMethodsRuntime<T> {
	const handle = currentHandle();
	const scoped: Scoped = handle === undefined ? (fn) => fn() : (fn) => inEngine(handle, fn);
	const facts = (): TriviaFacts => {
		if (handle === undefined) throw new Error(NO_ENGINE);
		return handle.current.trivia;
	};
	const renderText = (self: AnyUntypedNode): string => {
		if (handle === undefined) throw new Error(NO_ENGINE);
		if (!isLive(handle.current)) throw new Error('engine disposed; render it with engine.render(node)');
		return handle.current.render(self).toString();
	};
	carryTriviaThroughWith(node, handle, scoped);
	Object.assign(node, {
		$render(this: AnyUntypedNode): string {
			return renderText(this);
		},
		$toEdit(this: AnyUntypedNode, startOrRange: number | StringIndexRange, endPos?: number): Edit {
			return toEditAt(renderText(this), startOrRange, endPos);
		},
		$replace(this: AnyUntypedNode, target: { range(): StringIndexRange }): Edit {
			return toEditAt(renderText(this), target.range());
		}
	});
	Object.defineProperty(node, '$trivia', {
		get(this: AnyUntypedNode) {
			return triviaSetterOf(this, facts(), scoped);
		},
		enumerable: false,
		configurable: true
	});
	if (handle !== undefined) bindEngine(node, handle);
	return node as T & WithMethodsRuntime<T>;
}

function bindEngine(node: object, handle: EngineHandle): void {
	Object.defineProperty(node, '$engine', {
		value: () => handle.current,
		enumerable: false,
		writable: false,
		configurable: true
	});
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

/**
 * `$trivia` as a callable that also carries each position, bound to its node.
 * Called with items, a position sets its entries and returns the node, so the
 * calls chain; called with none, it returns the entries it holds. Called
 * directly it replaces the node's trivia: rest args are leading, one
 * `{ leading, trailing, inner }` object is taken whole.
 *
 * An item is an extra kind's node, or a loose string built through
 * `ir.comment`: its full spelling (`'// note'`) or its interior (`' note'`).
 * `inner` and `innerAt` write only to an empty node of a kind with inner
 * gaps, and a write detaches the node's coordinate.
 */
function triviaSetterOf<Self extends AnyUntypedNode>(
	node: Self,
	facts: TriviaFacts,
	scoped: Scoped
): TriviaSetterRuntime<Self> {
	const kind = (): string => facts.kindName(node.$type) ?? String(node.$type);
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
		detachCoordinate(node);
		return inner;
	};
	const store = (trivia: NodeTrivia): Self => {
		setTriviaData(node, trivia);
		return node;
	};
	const side =
		(position: 'leading' | 'trailing') =>
		(...items: unknown[]): Self | readonly TriviaEntry[] =>
			items.length === 0 ? (node.$_trivia?.[position] ?? []) : store({ ...node.$_trivia, [position]: entriesOf(items) });
	const innerAt = (gap: string, ...items: unknown[]): Self | readonly TriviaEntry[] => {
		if (!gapsOf().includes(gap)) throw new Error(`trivia: ${kind()} has no gap '${gap}'`);
		if (items.length === 0) return node.$_trivia?.inner?.[gap] ?? [];
		return store({ ...node.$_trivia, inner: writeInner({ ...node.$_trivia?.inner, [gap]: entriesOf(items) }) });
	};
	return {
		leading: side('leading'),
		trailing: side('trailing'),
		inner: (...items: unknown[]) => innerAt(gapsOf()[0]!, ...items),
		innerAt
	} as TriviaSetterRuntime<Self>;
}

/** One trivia item as its entry: a trivia node or whitespace kind id as it is, a string by `textEntryOf`. */
function triviaEntryOf(item: unknown, facts: TriviaFacts): TriviaEntry {
	if (typeof item === 'string') return textEntryOf(item, facts);
	if (typeof item !== 'number' && !isNode(item)) {
		throw new Error(`trivia: an entry is a node, a whitespace kind or a comment's text, not ${JSON.stringify(item)}`);
	}
	const type = typeof item === 'number' ? item : item.$type;
	const kind = facts.kindName(type);
	if (kind === undefined || !facts.kinds.has(kind)) throw new Error(`trivia: ${kind ?? String(type)} is not an extra`);
	return item;
}

/** Loose text: whitespace text names the whitespace kind spelled exactly so; any other text is a comment's. */
function textEntryOf(text: string, facts: TriviaFacts): TriviaEntry {
	if (facts.whitespace?.run.test(text) === true) {
		const kindId = facts.whitespace.kindIdByText[text];
		if (kindId === undefined) throw new Error(`trivia: no whitespace kind is spelled ${JSON.stringify(text)}`);
		return kindId;
	}
	if (!('comment' in facts)) throw new Error(`trivia: ${JSON.stringify(text)} is text, and this grammar has no ir.comment`);
	if (facts.comment === undefined) throw new Error(`trivia: ${JSON.stringify(text)} is text, and ir.comment is bound when the factories load; import the factories`);
	return facts.comment(text);
}

/**
 * Attach `accessors` to `node` as non-enumerable own properties (ADR-0018
 * FR-002 / SC-004). Generated factories build the `$`-metadata + `_`-storage
 * object literal first, then route every accessor method through this helper
 * instead of inlining `<name>() { ... }` as an ordinary (enumerable) literal
 * property — `Object.keys(node)` must expose only `$`- and `_`-prefixed keys.
 */
export function withAccessors<T extends object, A extends Record<string, unknown>>(node: T, accessors: A): T & A {
	for (const key of Object.keys(accessors)) {
		Object.defineProperty(node, key, { value: accessors[key], enumerable: false, writable: true, configurable: true });
	}
	return node as T & A;
}

interface ListViewOption {
	readonly key: string;
	readonly default: unknown;
}

interface ListViewWrapper {
	readonly kind: number;
	readonly content: string;
	readonly decorations: readonly string[];
}

interface ListViewSpec {
	readonly list?: { readonly accessor: string; readonly storage: string };
	readonly elements: string;
	readonly count: string;
	readonly options?: readonly ListViewOption[];
	readonly wrapper?: ListViewWrapper;
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

const defineHidden = (node: object, key: PropertyKey, descriptor: PropertyDescriptor): void => {
	Object.defineProperty(node, key, { enumerable: false, configurable: true, ...descriptor });
};

const LIST_ITEMS = Symbol('sittir.listItems');

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

const STORED_SLOT_READERS = Symbol('sittir.storedSlotReaders');

type StoredSlotReaders = Readonly<Record<string, (this: object) => unknown>>;

export function storedSlotReader(node: object, accessor: string): unknown {
	const readers = (node as { readonly [STORED_SLOT_READERS]?: StoredSlotReaders })[STORED_SLOT_READERS];
	return readers?.[accessor] ?? (node as Record<string, unknown>)[accessor];
}

const storedElementsOf = (node: object, spec: ListViewSpec, tree: TreeHandle | undefined): readonly unknown[] | undefined => {
	const list = (spec.list === undefined ? node : (node as Record<string, unknown>)[spec.list.storage]) as
		| (object & Partial<AnyUntypedNode>)
		| undefined;
	if (list == null) return [];
	const elementsIn = (source: object): readonly unknown[] => {
		const elements = (source as Record<string, unknown>)[spec.count];
		return Array.isArray(elements) ? elements : elements == null ? [] : [elements];
	};
	if (spec.count in list || !isStub(list)) return elementsIn(list);
	return tree === undefined ? undefined : elementsIn(hydrateStub(list, tree));
};

export function withListView<T extends object>(node: T, spec: ListViewSpec, tree?: TreeHandle): T {
	const listOf = (self: object): Record<string, unknown> | undefined =>
		spec.list === undefined
			? (self as Record<string, unknown>)
			: ((self as Members)[spec.list.accessor]!.call(self) as Record<string, unknown> | undefined);
	const itemsOf = (self: object): readonly unknown[] => {
		const cached = (self as { [LIST_ITEMS]?: readonly unknown[] })[LIST_ITEMS];
		if (cached !== undefined) return cached;
		const list = listOf(self);
		const elements = list === undefined ? [] : (((list[spec.elements] as () => readonly unknown[]).call(list) ?? []) as readonly unknown[]);
		const items = Object.freeze(elements.map((element) => collapseWrapper(element, spec.wrapper)));
		defineHidden(self, LIST_ITEMS, { value: items });
		return items;
	};
	const stored = storedElementsOf(node, spec, tree);
	for (let index = 0; index < (stored?.length ?? 0); index++) {
		defineHidden(node, index, {
			get(this: object) {
				return itemsOf(this)[index];
			}
		});
	}
	defineHidden(
		node,
		'length',
		stored === undefined
			? {
					get(): never {
						throw new Error(`withListView: ${spec.list!.storage} is a read stub, which a node built without its tree cannot count`);
					}
				}
			: { value: stored.length }
	);
	defineHidden(node, Symbol.isConcatSpreadable, { value: true });
	defineHidden(node, Symbol.iterator, {
		value: function (this: object): IterableIterator<unknown> {
			return itemsOf(this)[Symbol.iterator]();
		}
	});
	defineHidden(node, Symbol.unscopables, { value: Array.prototype[Symbol.unscopables] });
	for (const method of READONLY_ARRAY_METHODS) {
		defineHidden(node, method, {
			value: function (this: object, ...args: unknown[]): unknown {
				return (itemsOf(this) as unknown as Members)[method]!(...args);
			}
		});
	}
	for (const option of spec.options ?? []) {
		defineHidden(node, option.key, {
			get(this: object) {
				return listOf(this)?.[`_${option.key}`] ?? option.default;
			}
		});
	}
	return node;
}

export function withListSlots<T extends object>(node: T, specs: readonly ListSlotSpec[]): T {
	const setters = Object.getOwnPropertyDescriptor(node, '$with')?.value as Members | undefined;
	if (setters === undefined) return node;
	for (const spec of specs) {
		const set = setters[spec.slot];
		if (set === undefined) continue;
		const make = spec.make as (...args: unknown[]) => unknown;
		setters[spec.slot] = (...args) => {
			if (args.length === 0) return spec.optional ? set() : set(make());
			const whole = args.length === 1 && (args[0] === undefined || (args[0] as { $type?: unknown } | null)?.$type === spec.kind);
			return set(whole ? args[0] : make(...convertElements(args, spec.element)));
		};
	}
	return node;
}

interface ElementsSeatSpec extends ElementConfig {
	readonly slot: string;
}

export function withElementsSeat<T extends object>(node: T, spec: ElementsSeatSpec): T {
	const setters = Object.getOwnPropertyDescriptor(node, '$with')?.value as Members | undefined;
	const set = setters?.[spec.slot];
	if (setters === undefined || set === undefined) return node;
	setters[spec.slot] = (...args) => {
		if (args.some(Array.isArray)) {
			throw new TypeError(
				`$with.${spec.slot} takes its elements as rest arguments, $with.${spec.slot}(a, b), not an array; spread it: $with.${spec.slot}(...items)`
			);
		}
		return set(...convertElements(args, spec));
	};
	return node;
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

function seatedReader(node: object, stored: string, read: (this: object) => unknown): (() => unknown) | undefined {
	return (node as Record<string, unknown>)[stored] === undefined ? undefined : () => read.call(node);
}

export function withGroupSeat<T extends object>(node: T, spec: GroupSeatSpec): T {
	const own = Object.getOwnPropertyDescriptor(node, spec.slot);
	const readGroup = (own?.value ?? (node as unknown as Members)[spec.slot]) as (this: object) => Members | undefined;
	const known = (node as { readonly [STORED_SLOT_READERS]?: StoredSlotReaders })[STORED_SLOT_READERS];
	defineHidden(node, STORED_SLOT_READERS, { value: { ...known, [spec.slot]: readGroup } });
	const fieldOf = (key: GroupSeatKey): string => key.field ?? key.name;
	for (const key of spec.keys) {
		const read = function (this: object): unknown {
			const group = readGroup.call(this);
			return group?.[fieldOf(key)]?.call(group);
		};
		defineHidden(node, key.name, {
			enumerable: key.name === spec.slot ? (own?.enumerable ?? false) : false,
			get(this: object) {
				return seatedReader(this, spec.stored, read);
			}
		});
	}
	const setters = Object.getOwnPropertyDescriptor(node, '$with')?.value as Members | undefined;
	const seat = setters?.[spec.slot];
	if (setters === undefined || seat === undefined) return node;
	const make = spec.make as (config: unknown) => unknown;
	for (const key of spec.keys) {
		setters[key.name] = (...args: unknown[]): unknown => {
			if (key.name === spec.slot && args.length === 1 && (args[0] as { $type?: unknown } | null)?.$type === spec.kind) {
				return seat(args[0]);
			}
			const group = readGroup.call(node);
			if (group !== undefined) {
				return seat(((group.$with as unknown as Members)[fieldOf(key)] as (...values: unknown[]) => unknown)(...args));
			}
			const value = key.rest ? args : args[0];
			if (key.rest ? args.length === 0 : value === undefined) return seat();
			const missing = spec.keys.filter((other) => other !== key && other.required === true).map((other) => other.name);
			if (missing.length > 0) {
				throw new TypeError(
					`$with.${key.name} cannot build the absent '${spec.slot}' group without its required ${missing.join(', ')}; set ${missing.length === 1 ? 'it' : 'them'} first, or pass the whole group to $with.${spec.slot}`
				);
			}
			return seat(make({ [fieldOf(key)]: value }));
		};
	}
	return node;
}

export function isNode(v: unknown): v is AnyUntypedNode {
	if (v === null || typeof v !== 'object') return false;
	const o = v as Record<string, unknown>;
	if (typeof o.$type !== 'number') return false;
	return (
		holdsSlots(o) ||
		typeof o.$text === 'string' ||
		o.$other !== undefined ||
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

export function isNodeOfKind(v: unknown, kind: number): boolean {
	return isNode(v) && v.$type === kind;
}

export function orDefault<V>(value: V | undefined, make: () => NoInfer<V>): V {
	return value ?? make();
}

export function configFieldOr(input: unknown, key: string, orElse: () => unknown): unknown {
	return input !== null && typeof input === 'object' && !isNode(input) && key in input
		? (input as Record<string, unknown>)[key]
		: orElse();
}

export function isParsedNode(v: unknown): v is AnyUntypedNode {
	return isNode(v) && (v.$source === Source.Ts || v.$source === Source.Sg);
}

export function isFactoryNode(v: unknown): v is AnyUntypedNode {
	return isNode(v) && !isParsedNode(v);
}

/**
 * A parsed ERROR node: the source it wraps, as text over its span. Only a
 * reader produces one; there is no factory for it.
 */
export interface ErrorNode extends AnyUntypedNode {
	readonly $type: typeof ERROR_KIND_ID;
	readonly $source: typeof Source.Ts | typeof Source.Sg;
	readonly $text: string;
	readonly $span: { start: number; end: number };
}

export function isErrorNode(v: unknown): v is ErrorNode {
	return isParsedNode(v) && v.$type === ERROR_KIND_ID;
}

export function hasKind(v: object): v is { kind: string } & Record<string, unknown> {
	return 'kind' in v && typeof (v as Record<string, unknown>).kind === 'string';
}

export function coerceBooleanKeywordStorage(value: unknown): true | undefined {
	if (value === undefined || value === null || value === false) return undefined;
	if (Array.isArray(value)) return value.length > 0 ? true : undefined;
	return true;
}

export function coerceBitflagStorage(value: unknown, texts: readonly string[]): number | undefined {
	if (value === undefined || value === null || value === false) return undefined;
	if (typeof value === 'number') return value === 0 ? undefined : value;
	if (Array.isArray(value)) {
		let acc = 0;
		for (const item of value) {
			const bits = coerceBitflagStorage(item, texts) ?? 0;
			acc |= bits;
		}
		return acc === 0 ? undefined : acc;
	}
	const text = extractNodeText(value);
	if (text === undefined) return undefined;
	const index = texts.indexOf(text);
	if (index < 0) return undefined;
	return 1 << index;
}

function extractNodeText(value: unknown): string | undefined {
	if (typeof value === 'string') return value;
	if (isNode(value)) {
		return typeof value.$text === 'string' ? value.$text : undefined;
	}
	if (isRecord(value) && typeof value.$text === 'string') return value.$text;
	return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function setTriviaData(node: AnyUntypedNode, triviaData: NodeTrivia): void {
	(node as unknown as Record<string, unknown>).$_trivia = triviaData;
}

/**
 * A `$with` setter rebuilds the node through its factory, which knows only
 * the config — the trivia attached to the node being edited is not config.
 * The comment a declaration carries belongs to the declaration, not to the
 * field that changed, so every setter hands the source node's trivia on to
 * the node it returns. Inner entries can only travel to a node that is still
 * empty: once the rebuild gives the node a child, the comment would sit beside
 * it, so the setter refuses.
 */
function carryTriviaThroughWith(node: AnyUntypedNode, handle: EngineHandle | undefined, scoped: Scoped): void {
	const setters = (node as { $with?: Record<string, unknown> }).$with;
	if (setters === undefined) return;
	for (const key of Object.keys(setters)) {
		const setter = setters[key];
		if (typeof setter !== 'function') continue;
		const rebuild = setter as (...args: unknown[]) => unknown;
		setters[key] = (...args: unknown[]): unknown => {
			const rebuilt = scoped(() => rebuild(...args));
			const trivia = node.$_trivia;
			if (trivia === undefined || !isNode(rebuilt)) return rebuilt;
			if (Object.values(trivia.inner ?? {}).some((entries) => (entries?.length ?? 0) > 0) && !isEmptyNode(rebuilt)) {
				const kind = handle?.current.trivia.kindName(node.$type) ?? String(node.$type);
				throw new Error(`trivia: ${kind} holds inner comments; move them to leading/trailing on the new child`);
			}
			setTriviaData(rebuilt, trivia);
			return rebuilt;
		};
	}
}

export { numberText, type NumberBase } from './number.ts';
export { hydrateStub, isStub, readUntypedNode, type Stub, type TreeHandle } from './readUntypedNode.ts';
export { toEditAt } from './edit.ts';
export { inTreeEngine } from './engine-scope.ts';
export { metricsEnabled, recordFfi } from './metrics.ts';
export { toTransportData, markEdited, treeHandleOf, isStorageKey, isDataKey, holdsSlots } from './transport-data.ts';
export {
	projectInterior,
	lexedConfig,
	spelledForm,
	spelledInterior,
	refuseSiblingLead,
	type TokenInterior,
	type InteriorSlot,
	type ProjectedInterior
} from './interior.ts';
export { mapTriviaEntries };
export * from './runtime.ts';
