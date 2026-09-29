import type { AnyNodeData, ByteRange, Edit, GrammarFacts, NodeTrivia, TriviaEntry, TriviaFacts } from '@sittir/types';
import { mapTriviaEntries, type TriviaSides } from './trivia.ts';
import { detachCoordinate } from './transport-data.ts';
import { Source } from './source.ts';
import { ERROR_KIND_ID } from './error-kind.ts';

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

export function withMethods<T extends AnyNodeData>(node: T, engine: GrammarFacts): T & WithMethodsRuntime<T> {
	carryTriviaThroughWith(node, engine.trivia);
	Object.assign(node, {
		$render(this: AnyNodeData): string {
			return engine.render(this);
		},
		$toEdit(this: AnyNodeData, startOrRange: number | ByteRange, endPos?: number): Edit {
			return engine.toEdit(this, startOrRange, endPos);
		},
		$replace(this: AnyNodeData, target: { range(): ByteRange }): Edit {
			return engine.toEdit(this, target.range());
		},
	});
	Object.defineProperty(node, '$trivia', {
		get(this: AnyNodeData) {
			return triviaSetterOf(this, engine.trivia);
		},
		enumerable: false,
		configurable: true
	});
	return node as T & WithMethodsRuntime<T>;
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
function triviaSetterOf<Self extends AnyNodeData>(node: Self, facts: TriviaFacts): TriviaSetterRuntime<Self> {
	const kind = (): string => facts.kindName(node.$type) ?? String(node.$type);
	const entriesOf = (items: readonly unknown[]): readonly TriviaEntry[] => items.map((item) => triviaEntryOf(item, facts));
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
function carryTriviaThroughWith(node: AnyNodeData, facts: TriviaFacts): void {
	const setters = (node as { $with?: Record<string, unknown> }).$with;
	if (setters === undefined) return;
	for (const key of Object.keys(setters)) {
		const setter = setters[key];
		if (typeof setter !== 'function') continue;
		const rebuild = setter as (...args: unknown[]) => unknown;
		setters[key] = (...args: unknown[]): unknown => {
			const rebuilt = rebuild(...args);
			const trivia = node.$_trivia;
			if (trivia === undefined || !isNode(rebuilt)) return rebuilt;
			if (Object.values(trivia.inner ?? {}).some((entries) => (entries?.length ?? 0) > 0) && !isEmptyNode(rebuilt)) {
				const kind = facts.kindName(node.$type) ?? String(node.$type);
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
