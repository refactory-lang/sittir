import type { AnyNodeData, ByteRange, Edit, NodeTrivia, TriviaEntry, TriviaFacts } from '@sittir/types';
import { mapTriviaEntries, type TriviaSides } from './trivia.ts';
import { detachCoordinate } from './transport-data.ts';
import { Source } from './source.ts';
import { ERROR_KIND_ID } from './error-kind.ts';
import { currentHandle, inEngine, isLive, type EngineHandle } from './engine-scope.ts';
import { toEditAt } from './edit.ts';
import { Delimiter } from './delimiter.ts';

export { Delimiter } from './delimiter.ts';
export { Source };
export { ERROR_KIND_ID, ERROR_KIND_NAME } from './error-kind.ts';

/**
 * @forFutureUse ADR-0018 (docs/adr/0018-dehoist-nodedata-surface.md) —
 * runtime shape backing the `$with` update namespace. Not yet wired into
 * generated output; scaffolding only.
 */
interface WithMethodsRuntime<T extends object = AnyNodeData> {
	$render(): string;
	$toEdit(startOrRange: number | ByteRange, endPos?: number): Edit;
	$replace(target: { range(): ByteRange }): Edit;
	$trivia: TriviaSetterRuntime<T & WithMethodsRuntime<T>>;
}

interface TriviaSetterRuntime<Self> {
	(...args: unknown[]): Self;
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

export function withMethods<T extends AnyNodeData>(node: T): T & WithMethodsRuntime<T> {
	const handle = currentHandle();
	const scoped: Scoped = handle === undefined ? (fn) => fn() : (fn) => inEngine(handle, fn);
	const facts = (): TriviaFacts => {
		if (handle === undefined) throw new Error(NO_ENGINE);
		return handle.current.trivia;
	};
	const renderText = (self: AnyNodeData): string => {
		if (handle === undefined) throw new Error(NO_ENGINE);
		if (!isLive(handle.current)) throw new Error('engine disposed; render it with engine.render(node)');
		return handle.current.render(self).toString();
	};
	carryTriviaThroughWith(node, handle, scoped);
	Object.assign(node, {
		$render(this: AnyNodeData): string {
			return renderText(this);
		},
		$toEdit(this: AnyNodeData, startOrRange: number | ByteRange, endPos?: number): Edit {
			return toEditAt(renderText(this), startOrRange, endPos);
		},
		$replace(this: AnyNodeData, target: { range(): ByteRange }): Edit {
			return toEditAt(renderText(this), target.range());
		}
	});
	Object.defineProperty(node, '$trivia', {
		get(this: AnyNodeData) {
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
export function isEmptyNode(node: AnyNodeData): boolean {
	return Object.entries(node).every(
		([key, value]) => !key.startsWith('_') || value == null || (Array.isArray(value) && value.length === 0)
	);
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
function triviaSetterOf<Self extends AnyNodeData>(
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
	return Object.assign(
		(...args: unknown[]): Self => {
			const given = args.length === 1 && isTriviaObject(args[0]) ? args[0] : { leading: args };
			const trivia = mapTriviaEntries(given as TriviaSides<unknown>, entriesOf);
			return store(trivia.inner === undefined ? trivia : { ...trivia, inner: writeInner(trivia.inner) });
		},
		{
			leading: side('leading'),
			trailing: side('trailing'),
			inner: (...items: unknown[]) => innerAt(gapsOf()[0]!, ...items),
			innerAt
		}
	) as TriviaSetterRuntime<Self>;
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

interface ListOwnerOption {
	readonly key: string;
	readonly default: unknown;
}

interface ListOwnerWrapper {
	readonly kind: number;
	readonly content: string;
	readonly decorations: readonly string[];
}

interface ListOwnerSpec {
	readonly list: string;
	readonly elements: string;
	readonly kind: number;
	readonly options: readonly ListOwnerOption[];
	readonly make: (...args: never[]) => unknown;
	readonly wrapper?: ListOwnerWrapper;
}

type Members = Record<string, (...args: unknown[]) => unknown>;

const isWholeList = (args: readonly unknown[], kind: number): boolean =>
	args.length === 0 ||
	(args.length === 1 &&
		(typeof args[0] !== 'object' || (args[0] !== null && (args[0] as { $type?: unknown }).$type === kind)));

const collapseWrapper = (item: unknown, wrapper: ListOwnerWrapper | undefined): unknown => {
	if (wrapper === undefined || item === null || typeof item !== 'object') return item;
	const node = item as Members & Record<string, unknown>;
	if ((node as { $type?: unknown }).$type !== wrapper.kind) return item;
	if (wrapper.decorations.some((key) => node[key] !== undefined)) return item;
	return node[wrapper.content]!.call(node);
};

const STORED_SLOT_READERS = Symbol('sittir.storedSlotReaders');

type StoredSlotReaders = Readonly<Record<string, (this: object) => unknown>>;

export function storedSlotReader(node: object, accessor: string): unknown {
	const readers = (node as { readonly [STORED_SLOT_READERS]?: StoredSlotReaders })[STORED_SLOT_READERS];
	return readers?.[accessor] ?? (node as Record<string, unknown>)[accessor];
}

export function withListOwner<T extends object>(node: T, spec: ListOwnerSpec): T {
	const own = Object.getOwnPropertyDescriptor(node, spec.list);
	const readList = (own?.value ?? (node as unknown as Members)[spec.list]) as (
		this: object
	) => Record<string, unknown> | undefined;
	const listOf = (self: object): Record<string, unknown> | undefined => readList.call(self);
	const itemsOf = (self: object): readonly unknown[] | undefined => {
		const list = listOf(self);
		if (list === undefined) return undefined;
		const elements = ((list[spec.elements] as () => readonly unknown[]).call(list) ?? []) as readonly unknown[];
		return elements.map((element) => collapseWrapper(element, spec.wrapper));
	};
	const define = (key: PropertyKey, descriptor: PropertyDescriptor): void => {
		Object.defineProperty(node, key, { enumerable: false, configurable: true, ...descriptor });
	};
	define(STORED_SLOT_READERS, { value: { [spec.list]: readList } });
	define(spec.list, {
		enumerable: own?.enumerable ?? false,
		value: function (this: object): readonly unknown[] | undefined {
			return itemsOf(this);
		}
	});
	define(Symbol.iterator, {
		value: function (this: object): IterableIterator<unknown> {
			return (itemsOf(this) ?? [])[Symbol.iterator]();
		}
	});
	define('length', {
		get(this: object) {
			return itemsOf(this)?.length ?? 0;
		}
	});
	define('at', {
		value: function (this: object, index: number): unknown {
			return itemsOf(this)?.at(index);
		}
	});
	for (const option of spec.options) {
		define(option.key, {
			get(this: object) {
				return listOf(this)?.[`_${option.key}`] ?? option.default;
			}
		});
	}
	makeWithCallable(node, spec);
	return node;
}

function makeWithCallable(node: object, spec: ListOwnerSpec): void {
	const own = Object.getOwnPropertyDescriptor(node, '$with');
	const setters = own?.value as Members | undefined;
	const setList = setters?.[spec.list];
	if (own === undefined || setters === undefined || setList === undefined) return;
	const make = spec.make as (...args: unknown[]) => unknown;
	setters[spec.list] = (...args) => setList(isWholeList(args, spec.kind) ? args[0] : make(...args));
	const call = (...args: unknown[]): unknown => (call as unknown as Members)[spec.list]!(...args);
	for (const key of Object.keys(setters)) {
		Object.defineProperty(call, key, { value: setters[key], enumerable: true, writable: true, configurable: true });
	}
	Object.defineProperty(node, '$with', { ...own, value: call });
}

export function isNode(v: unknown): v is AnyNodeData {
	if (v === null || typeof v !== 'object') return false;
	const o = v as Record<string, unknown>;
	if (typeof o.$type !== 'number') return false;
	const hasStoredFields = Object.keys(o).some((k) => k.startsWith('_'));
	return (
		hasStoredFields ||
		typeof o.$text === 'string' ||
		o.$other !== undefined ||
		o.$source === Source.Ts ||
		o.$source === Source.Sg ||
		o.$source === Source.Factory
	);
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

export function isParsedNode(v: unknown): v is AnyNodeData {
	return isNode(v) && (v.$source === Source.Ts || v.$source === Source.Sg);
}

export function isFactoryNode(v: unknown): v is AnyNodeData {
	return isNode(v) && !isParsedNode(v);
}

/**
 * A parsed ERROR node: the source it wraps, as text over its span. Only a
 * reader produces one; there is no factory for it.
 */
export interface ErrorNode extends AnyNodeData {
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

function isTriviaObject(value: unknown): value is TriviaSides<unknown> {
	return isRecord(value) && !isNode(value) && ('leading' in value || 'trailing' in value || 'inner' in value);
}

function setTriviaData(node: AnyNodeData, triviaData: NodeTrivia): void {
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
function carryTriviaThroughWith(node: AnyNodeData, handle: EngineHandle | undefined, scoped: Scoped): void {
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
export { readNode, type TreeHandle } from './readNode.ts';
export { toEditAt } from './edit.ts';
export { inTreeEngine } from './engine-scope.ts';
export { metricsEnabled, recordFfi } from './metrics.ts';
export { toTransportData, markEdited } from './transport-data.ts';
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
