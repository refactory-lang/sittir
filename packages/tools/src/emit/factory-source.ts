import {
	buildFactoryNodeFromReference,
	type FactoryDispatchArtifacts,
	type FactoryDispatchOpts,
	type IrEntry,
	type IrSurface,
	type Seat,
	type SeatTable
} from '../validate/common.ts';
import type { FactoryShape, PolymorphVariantMap } from '../codegen-surface.ts';
import type { NodeTrivia as ReadTrivia } from '@sittir/types';
import { sliceSpan } from '@sittir/common';

export interface PrintContext {
	readonly grammar: string;
	readonly kindNameFromId: (id: number) => string | undefined;
	readonly memberNameOfId: (id: number) => string | undefined;
	readonly irPathOfKind: (kind: string) => string;
	readonly delimiterArmOfId: (id: number) => string | undefined;
	readonly seats?: SeatTable;
	readonly absorbedKinds?: ReadonlySet<string>;
	readonly slotKinds?: Record<string, Record<string, readonly string[]>>;
	readonly textLeafKinds?: ReadonlySet<string>;
	readonly leafPatterns?: Record<string, RegExp>;
	readonly leafFindings?: string[];
	readonly enumKinds?: ReadonlySet<string>;
	readonly keywordKinds?: ReadonlySet<string>;
	readonly slotStorage?: Record<string, Record<string, string>>;
	readonly memberIdOfText?: (text: string) => number | undefined;
	/** The source the read came from: the bytes a span addresses. */
	readonly source?: string;
	readonly loose?: LooseFacts;
}

export interface LooseFacts {
	readonly nested: 'calls' | 'configs';
	readonly modelTypes: Record<string, string>;
	readonly subtypes: Record<string, readonly string[]>;
	readonly slotRequired: Record<string, Record<string, boolean>>;
	readonly slotMultiple: Record<string, Record<string, boolean>>;
	readonly slotDefaults: Record<string, Record<string, string>>;
	readonly bareAccepts: Record<string, readonly string[]>;
	readonly forwardsTo: Record<string, string>;
	readonly listDefaults: Record<string, string>;
	readonly listElementKinds: Record<string, readonly string[]>;
	readonly hoistedKinds: ReadonlySet<string>;
	/** A kind's parser id; an alias shares its target's, and the runtime admits by id. */
	readonly kindIdOfName: (kind: string) => number | undefined;
}

export interface PrintedFacts {
	readonly text?: string;
	readonly inner?: unknown;
	readonly elements?: { readonly options?: Record<string, unknown>; readonly items: readonly unknown[] };
	readonly config?: string;
}

export interface NodeTrivia {
	readonly leading: readonly string[];
	readonly trailing: readonly string[];
}

export class Printed {
	readonly $named = true as const;
	/** Set by the construction funnel from the read node this was built from. */
	$_trivia?: ReadTrivia;
	constructor(
		readonly $type: number | string,
		readonly source: string,
		readonly kind?: string,
		readonly argsSource?: string,
		readonly facts?: PrintedFacts
	) {}
}

export interface ReadNodeLike {
	readonly $type?: string | number;
	readonly $text?: string;
	readonly $span?: { readonly start: number; readonly end: number };
	readonly $nodeHandle?: number;
	readonly $_trivia?: ReadTrivia;
}

const INDENT = '\t';

function pad(depth: number): string {
	return INDENT.repeat(depth);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Printed);
}

function triviaSuffix(trivia: NodeTrivia | undefined, ctx: PrintContext): string {
	if (trivia === undefined || (trivia.leading.length === 0 && trivia.trailing.length === 0)) return '';
	const parts: string[] = [];
	if (trivia.leading.length > 0) parts.push(`leading: ${printValue(trivia.leading, ctx, 0)}`);
	if (trivia.trailing.length > 0) parts.push(`trailing: ${printValue(trivia.trailing, ctx, 0)}`);
	return `.$trivia({ ${parts.join(', ')} })`;
}

function reindent(source: string, depth: number): string {
	return depth === 0 ? source : source.replace(/\n/g, `\n${pad(depth)}`);
}

function printRawNode(node: Record<string, unknown>, ctx: PrintContext, depth: number): string | undefined {
	const slotKeys = Object.keys(node).filter((k) => k.startsWith('_') && node[k] !== undefined);
	if (slotKeys.length === 1) {
		const kind = slotKeys[0]!.slice(1);
		const value = node[slotKeys[0]!];
		if (typeof value === 'string') {
			if (ctx.textLeafKinds?.has(kind)) return `${ctx.irPathOfKind(kind)}(${JSON.stringify(value)})`;
			const id = ctx.memberIdOfText?.(value);
			return id === undefined ? JSON.stringify(value) : printValue(id, ctx, depth);
		}
		return printValue(value, ctx, depth);
	}
	if (slotKeys.length === 0 && typeof node.$text === 'number') {
		// A fixed-text leaf stores its kind id in place of its text.
		return printValue(node.$text, ctx, depth);
	}
	if (slotKeys.length === 0 && typeof node.$text === 'string') {
		const id = ctx.memberIdOfText?.(node.$text);
		if (id !== undefined) return printValue(id, ctx, depth);
		if (typeof node.$type === 'number' && ctx.memberNameOfId(node.$type) !== undefined) {
			return printValue(node.$type, ctx, depth);
		}
		return JSON.stringify(node.$text);
	}
	return undefined;
}

export function printValue(value: unknown, ctx: PrintContext, depth: number): string {
	if (value instanceof Printed) {
		return reindent(value.source, depth) + triviaSuffix(triviaOf(value, ctx.source), ctx);
	}
	if (typeof value === 'string') return JSON.stringify(value);
	if (typeof value === 'boolean') return String(value);
	if (typeof value === 'number') {
		const member = ctx.memberNameOfId(value);
		if (member === undefined) throw new Error(`emit-factory-source: kind id ${value} has no TSKindId member`);
		return `TSKindId.${member}`;
	}
	if (Array.isArray(value)) {
		const [first, ...rest] = value;
		const parts = isListOptions(first)
			? [printListOptions(first, ctx), ...rest.map((v) => printValue(v, ctx, depth))]
			: value.map((v) => printValue(v, ctx, depth));
		return `[${parts.join(', ')}]`;
	}
	if (isPlainObject(value)) {
		if ('$type' in value) {
			const raw = printRawNode(value, ctx, depth);
			if (raw !== undefined) return raw;
		}
		const entries = Object.entries(value).filter(
			([k, v]) => v !== undefined && !k.startsWith('$') && !(Array.isArray(v) && v.length === 0)
		);
		if (entries.length === 0) return '{}';
		const body = entries.map(([k, v]) => `${pad(depth + 1)}${k}: ${printValue(v, ctx, depth + 1)},`).join('\n');
		return `{\n${body}\n${pad(depth)}}`;
	}
	return String(value);
}

/**
 * A separated list's options bag, which its factory takes ahead of the
 * elements. It reaches the generic printer too: a tuple seat hands the
 * parent's slot the child's WHOLE argument list, so the bag arrives as the
 * first entry of an array rather than as a positional argument.
 */
function isListOptions(value: unknown): value is Record<string, unknown> {
	return isPlainObject(value) && !('$type' in value) && ('delimiter' in value || 'separator' in value);
}

function printListOptions(options: Record<string, unknown>, ctx: PrintContext): string {
	const parts: string[] = [];
	if (typeof options.delimiter === 'number') {
		parts.push(`delimiter: ${ctx.delimiterArmOfId(options.delimiter) ?? options.delimiter}`);
	}
	if (typeof options.separator === 'number') parts.push(`separator: ${printValue(options.separator, ctx, 0)}`);
	return `{ ${parts.join(', ')} }`;
}

/**
 * A node's attached comments as text. A trivia entry carries its text when the
 * reader captured one; otherwise its span addresses the bytes in `source`.
 */
export function triviaOf(node: ReadNodeLike | undefined, source?: string): NodeTrivia | undefined {
	const trivia = node?.$_trivia;
	if (!trivia) return undefined;
	const textOf = (entry: ReadNodeLike): string | undefined => {
		if (typeof entry.$text === 'string') return entry.$text;
		return entry.$span !== undefined && source !== undefined ? sliceSpan(source, entry.$span) : undefined;
	};
	const texts = (list: readonly unknown[] | undefined): string[] =>
		(list ?? []).map((t) => textOf(t as ReadNodeLike)).filter((t): t is string => typeof t === 'string');
	const leading = texts(trivia.leading);
	const trailing = texts(trivia.trailing);
	return leading.length === 0 && trailing.length === 0 ? undefined : { leading, trailing };
}

function leafKindsForText(kinds: readonly string[], text: string, ctx: PrintContext): string[] {
	const candidates = kinds.filter((k) => ctx.textLeafKinds?.has(k));
	const patterned = candidates.filter((k) => ctx.leafPatterns?.[k] !== undefined);
	const matched = patterned.filter((k) => ctx.leafPatterns![k]!.test(text));
	return matched.length > 0 ? matched : candidates.filter((k) => ctx.leafPatterns?.[k] === undefined);
}

function textLeafOfSlot(kind: string, property: string, text: string, ctx: PrintContext): string | undefined {
	const kinds = ctx.slotKinds?.[kind]?.[property];
	if (kinds === undefined || ctx.textLeafKinds === undefined) return undefined;
	const matched = leafKindsForText(kinds, text, ctx);
	const admitted = kinds.filter((k) => ctx.textLeafKinds!.has(k));
	if (admitted.length > 0 && matched.length !== 1 && !(matched.length > 1 && matched.every((k) => k.startsWith('_')))) {
		ctx.leafFindings?.push(
			`${kind}.${property}: ${JSON.stringify(text)} matches ${matched.length === 0 ? 'no' : `${matched.length} (${matched.join(', ')})`} leaf kind of [${admitted.join(', ')}]`
		);
	}
	return matched[0] ?? admitted[0];
}

/**
 * A slot whose storage is `verbatim` holds text, never a kind id, so the
 * literal-text resolution chain does not apply to it: that chain answers
 * "which literal token spells this", and it falls back to the full name chain,
 * which matches any identifier that happens to share a rule's name (python's
 * `list` as a type annotation became `TSKindId.List`, rendering `[]`).
 */
function storesKindId(storage: string | undefined): boolean {
	return storage !== 'verbatim';
}

function printVerbatimText(
	text: string,
	leaf: string | undefined,
	ctx: PrintContext,
	slotKinds: readonly string[] = [],
	storage?: string
): unknown {
	if (leaf?.startsWith('_')) return text;
	if (leaf !== undefined) return new Printed(leaf, `${ctx.irPathOfKind(leaf)}(${JSON.stringify(text)})`, leaf);
	if (slotKinds.length === 1 && ctx.keywordKinds?.has(slotKinds[0]!)) return true;
	if (slotKinds.length === 0 && storage === 'verbatim') return text;
	const id = storesKindId(storage) ? ctx.memberIdOfText?.(text) : undefined;
	if (id !== undefined) return id;
	if (ctx.textLeafKinds?.has('identifier')) {
		return new Printed('identifier', `${ctx.irPathOfKind('identifier')}(${JSON.stringify(text)})`, 'identifier');
	}
	return text;
}

/**
 * The text a slot value stands for when it is text: a bare string, or a read
 * leaf — a node with `$text`, no storage and no attached trivia — which the
 * reader hands over as itself, coordinate included. A leaf carrying trivia
 * keeps its node form so the trivia prints with it.
 */
function textLeafValue(v: unknown): string | undefined {
	if (typeof v === 'string') return v;
	if (!isPlainObject(v) || typeof v.$text !== 'string' || v.$other != null || v.$_trivia != null) return undefined;
	return Object.keys(v).some((key) => key.startsWith('_')) ? undefined : v.$text;
}

function wrapTextLeaves(kind: string, config: unknown, ctx: PrintContext): unknown {
	if (!isPlainObject(config)) return config;
	const out: Record<string, unknown> = {};
	for (const [property, value] of Object.entries(config)) {
		if (ctx.slotStorage?.[kind]?.[property] === 'boolean') {
			out[property] = value === undefined || value === false || value === null ? undefined : true;
			continue;
		}
		const kinds = ctx.slotKinds?.[kind]?.[property] ?? [];
		const storage = ctx.slotStorage?.[kind]?.[property];
		const wrap = (v: unknown): unknown => {
			const text = textLeafValue(v);
			if (text === undefined) return v;
			if (bareTextAdmitted(kind, property, text, ctx)) return text;
			return printVerbatimText(text, textLeafOfSlot(kind, property, text, ctx), ctx, kinds, storage);
		};
		out[property] = loosenAt(kind, property, Array.isArray(value) ? value.map(wrap) : wrap(value), ctx);
	}
	return out;
}

const BRANCH_MODEL_TYPES: ReadonlySet<string> = new Set(['branch', 'envelope', 'polymorph', 'list']);

function expandSlotKinds(kinds: readonly string[], loose: LooseFacts): string[] {
	const out: string[] = [];
	const seen = new Set<string>();
	const visit = (kind: string): void => {
		if (seen.has(kind)) return;
		seen.add(kind);
		const subtypes = loose.subtypes[kind];
		if (subtypes !== undefined) {
			for (const subtype of subtypes) visit(subtype);
			return;
		}
		out.push(kind);
	};
	for (const kind of kinds) visit(kind);
	return out;
}

function slotKindsAt(kind: string, property: string, ctx: PrintContext): readonly string[] | undefined {
	const kinds = ctx.slotKinds?.[kind]?.[property];
	return kinds === undefined || ctx.loose === undefined ? undefined : expandSlotKinds(kinds, ctx.loose);
}

/**
 * The single leaf kind of a slot whose guard the text satisfies, if exactly
 * one does. A bare string resolves at runtime to the leaf kind whose pattern
 * it matches, so a leaf spells bare safely only when that kind is unique.
 */
function soleLeafKind(kinds: readonly string[], text: string, ctx: PrintContext): string | undefined {
	const matched = leafKindsForText(kinds, text, ctx);
	return matched.length === 1 ? matched[0] : undefined;
}

/**
 * Whether a read leaf's text prints bare at a slot: the slot admits exactly
 * one pattern kind, which is the kind the strict spelling would name too
 * (the first text leaf of the slot), so a bare string builds the same leaf.
 */
function bareTextAdmitted(kind: string, property: string, text: string, ctx: PrintContext): boolean {
	const kinds = slotKindsAt(kind, property, ctx);
	return ctx.loose !== undefined && kinds !== undefined && soleLeafKind(kinds, text, ctx) !== undefined;
}

function readLeafBare(kind: string, text: string, ctx: PrintContext): boolean {
	const properties = Object.keys(ctx.slotKinds?.[kind] ?? {});
	return properties.length === 1 && bareTextAdmitted(kind, properties[0]!, text, ctx);
}

function loosenAt(kind: string, property: string, value: unknown, ctx: PrintContext): unknown {
	const loose = ctx.loose;
	const kinds = slotKindsAt(kind, property, ctx);
	if (loose === undefined || kinds === undefined) return value;
	if (Array.isArray(value)) {
		// A repeated slot resolves each element on its own; a tuple seat's array
		// is one argument list the envelope builder takes as given.
		return loose.slotMultiple[kind]?.[property] === true ? value.map((v) => loosenAt(kind, property, v, ctx)) : value;
	}
	if (!(value instanceof Printed)) return value;
	return loosenValue(value, kinds, loose.slotDefaults[kind]?.[property], ctx);
}

/**
 * Whether a slot admits a printed node as it is. The runtime's resolver
 * tables are keyed by parser id, so an alias (`_shorthand_property_identifier`
 * over `identifier`) admits the node its target would.
 */
function admitsDirectly(kinds: readonly string[], node: Printed, loose: LooseFacts): boolean {
	if (node.kind !== undefined && kinds.includes(node.kind)) return true;
	return typeof node.$type === 'number' && kinds.some((k) => loose.kindIdOfName(k) === node.$type);
}

/**
 * Whether a kind's value is node data the coercer can route by its `$type`:
 * an enum or keyword leaf is stored as a bare kind id, which the runtime only
 * accepts where the slot itself admits the kind, never through a wrapper.
 */
function buildsNodeData(kind: string, loose: LooseFacts): boolean {
	const modelType = loose.modelTypes[kind];
	return modelType !== 'enum' && modelType !== 'keyword' && modelType !== 'punctuation';
}

function isFlatKind(kind: string, ctx: PrintContext): boolean {
	const hoisted = ctx.loose!.hoistedKinds;
	return !hoisted.has(kind) && !hoisted.has(`_${kind}`) && ctx.irPathOfKind(kind).split('.').length === 2;
}

function listOptionsAreDefault(
	listKind: string,
	options: Record<string, unknown> | undefined,
	ctx: PrintContext
): boolean {
	if (options === undefined) return true;
	if (options.separator !== undefined) return false;
	if (options.delimiter === undefined) return true;
	return (
		typeof options.delimiter === 'number' &&
		ctx.delimiterArmOfId(options.delimiter) === ctx.loose!.listDefaults[listKind]
	);
}

/**
 * A seated element whose config sets nothing but the seat's one required
 * slot is that slot's value: the list builder takes the value bare and seats
 * it itself, on the strict surface as on the loose one.
 */
function hoistSeatElement(listKind: string, item: unknown, ctx: PrintContext): unknown {
	const loose = ctx.loose;
	if (loose === undefined || !isPlainObject(item) || '$type' in item) return item;
	const keys = Object.keys(item).filter(
		(k) => item[k] !== undefined && !(Array.isArray(item[k]) && item[k].length === 0)
	);
	if (keys.length !== 1) return item;
	for (const seat of Object.values(ctx.seats?.[listKind]?.['*'] ?? {})) {
		if (seat.shape !== 'elements') continue;
		const required = Object.entries(loose.slotRequired[seat.kind] ?? {}).flatMap(([p, r]) => (r ? [p] : []));
		if (required.length === 1 && required[0] === keys[0]) return item[keys[0]!];
	}
	return item;
}

/**
 * A seated element that stayed a plain config after hoisting: its keys are
 * the seat's slots, so the seat's rules decide their spelling. The seat is
 * the one element seat whose slots hold every key the config sets.
 */
function wrapSeatElement(listKind: string, item: unknown, ctx: PrintContext): unknown {
	if (!isPlainObject(item) || '$type' in item) return item;
	const keys = Object.keys(item).filter((k) => item[k] !== undefined);
	const seats = Object.values(ctx.seats?.[listKind]?.['*'] ?? {}).filter(
		(seat) => seat.shape === 'elements' && keys.every((k) => k in (ctx.slotKinds?.[seat.kind] ?? {}))
	);
	return seats.length === 1 ? wrapTextLeaves(seats[0]!.kind, item, ctx) : item;
}

function soleSlotKind(kind: string, ctx: PrintContext): string | undefined {
	const forwarded = ctx.loose!.forwardsTo[kind];
	if (forwarded !== undefined) return forwarded;
	const slots = Object.values(ctx.slotKinds?.[kind] ?? {});
	return slots.length === 1 && slots[0]!.length === 1 ? slots[0]![0] : undefined;
}

/**
 * The items a printed value stands for when it is a list envelope with
 * default options, directly or through a single-slot wrapper whose sole slot
 * is that list — the array the runtime builds the envelope from.
 */
function bareArrayItems(
	value: Printed,
	ctx: PrintContext
): { readonly listKind: string; readonly items: readonly unknown[] } | undefined {
	const elements = value.facts?.elements;
	if (elements !== undefined && value.kind !== undefined) {
		return listOptionsAreDefault(value.kind, elements.options, ctx)
			? { listKind: value.kind, items: elements.items }
			: undefined;
	}
	const inner = value.facts?.inner;
	if (!(inner instanceof Printed) || value.kind === undefined || inner.kind === undefined) return undefined;
	if (inner.kind !== soleSlotKind(value.kind, ctx)) return undefined;
	const innerElements = inner.facts?.elements;
	if (innerElements === undefined || inner.$_trivia !== undefined) return undefined;
	return listOptionsAreDefault(inner.kind, innerElements.options, ctx)
		? { listKind: inner.kind, items: innerElements.items }
		: undefined;
}

/**
 * The loosest spelling of a printed node at a slot, by the loose contract's
 * slot-driven rules: a single-slot wrapper is dropped when exactly one arm
 * of the slot admits its inner value bare and that arm is the wrapper; a
 * list envelope is its bare array when the slot's one branch kind, or its
 * declared default, is the envelope; a text leaf is its bare string when the
 * slot admits one pattern kind; a config is its object when nested configs
 * are asked for. A node carrying trivia keeps its call, since only a call
 * can carry `$trivia`.
 */
function listElementKinds(listKind: string, ctx: PrintContext): readonly string[] | undefined {
	const loose = ctx.loose;
	if (loose === undefined) return undefined;
	const seated = Object.values(ctx.seats?.[listKind]?.['*'] ?? {})
		.filter((seat) => seat.shape === 'elements')
		.map((seat) => seat.kind);
	const kinds = seated.length > 0 ? seated : loose.listElementKinds[listKind];
	return kinds === undefined ? undefined : expandSlotKinds(kinds, loose);
}

function contentSlotKinds(kind: string, ctx: PrintContext): readonly string[] | undefined {
	const loose = ctx.loose!;
	const required = Object.entries(loose.slotRequired[kind] ?? {}).flatMap(([p, r]) => (r ? [p] : []));
	if (required.length !== 1 || loose.slotMultiple[kind]?.[required[0]!] === true) return undefined;
	const kinds = ctx.slotKinds?.[kind]?.[required[0]!];
	return kinds === undefined ? undefined : expandSlotKinds(kinds, loose);
}

function leafReachedThrough(target: string, text: string, ctx: PrintContext): string | undefined {
	const content = contentSlotKinds(target, ctx);
	return (
		(content === undefined ? undefined : soleLeafKind(content, text, ctx)) ??
		soleLeafKind(ctx.loose!.bareAccepts[target] ?? [], text, ctx)
	);
}

function looseListElement(listKind: string, item: unknown, ctx: PrintContext): unknown {
	const kinds = listElementKinds(listKind, ctx);
	if (kinds === undefined || !(item instanceof Printed)) return item;
	return loosenValue(item, kinds, ctx.loose!.slotDefaults[listKind]?.element, ctx);
}

function loosenValue(
	value: Printed,
	kinds: readonly string[],
	defaultArm: string | undefined,
	ctx: PrintContext
): unknown {
	const loose = ctx.loose!;
	if (value.$_trivia !== undefined || value.kind === undefined) return value;
	const branch = kinds.filter((k) => BRANCH_MODEL_TYPES.has(loose.modelTypes[k] ?? ''));
	const target =
		branch.length === 1 ? branch[0] : defaultArm !== undefined && branch.includes(defaultArm) ? defaultArm : undefined;
	const array = bareArrayItems(value, ctx);
	if (array !== undefined && target === value.kind) {
		const { listKind, items } = array;
		const printed = items.map((item) =>
			printValue(looseListElement(listKind, hoistSeatElement(listKind, item, ctx), ctx), ctx, 0)
		);
		const bare = printed.length === 1 && !/^[{[]/.test(printed[0]!) ? printed[0]! : undefined;
		return new Printed(value.$type, bare ?? `[${printed.join(', ')}]`, value.kind);
	}
	const inner = value.facts?.inner;
	if (
		inner instanceof Printed &&
		inner.kind !== undefined &&
		!admitsDirectly(kinds, inner, loose) &&
		(buildsNodeData(inner.kind, loose) || !kinds.some((k) => ctx.enumKinds?.has(k)))
	) {
		const arms = branch.filter((b) => loose.bareAccepts[b]?.includes(inner.kind!));
		if (arms.length === 1 && arms[0] === value.kind) return loosenValue(inner, kinds, defaultArm, ctx);
	}
	if (typeof inner === 'number' && !kinds.some((k) => ctx.enumKinds?.has(k))) {
		const innerKind = ctx.kindNameFromId(inner);
		if (innerKind !== undefined && !admitsDirectly(kinds, new Printed(inner, '', innerKind), loose)) {
			const arms = branch.filter((b) => loose.bareAccepts[b]?.includes(innerKind));
			if (arms.length === 1 && arms[0] === value.kind) return new Printed(inner, printValue(inner, ctx, 0), innerKind);
		}
	}
	const text = value.facts?.text;
	if (text !== undefined && loose.modelTypes[value.kind] === 'pattern') {
		const admits = kinds.includes(value.kind)
			? soleLeafKind(kinds, text, ctx) === value.kind
			: target !== undefined && leafReachedThrough(target, text, ctx) === value.kind;
		if (admits) return new Printed(value.$type, JSON.stringify(text), value.kind);
	}
	const config = value.facts?.config;
	if (config !== undefined && loose.nested === 'configs' && isFlatKind(value.kind, ctx)) {
		if (branch.length === 1 && branch[0] === value.kind) return new Printed(value.$type, config, value.kind);
		const member = typeof value.$type === 'number' ? ctx.memberNameOfId(value.$type) : undefined;
		if (member !== undefined) {
			const keyed =
				config === '{}' ? `{ kind: TSKindId.${member} }` : config.replace(/^\{\n/, `{\n\tkind: TSKindId.${member},\n`);
			return new Printed(value.$type, keyed, value.kind);
		}
	}
	return value;
}

/**
 * Text leaves inside a seated config belong to the group, not the parent: a
 * spliced or flattened-arm key and an element-seat object carry the child's
 * slot names. Wrap with the parent's slot map first so its own slots win,
 * then with each seat's kind for what the parent does not declare.
 */
function wrapSeatedConfig(kind: string, config: unknown, ctx: PrintContext): unknown {
	let out = wrapTextLeaves(kind, config, ctx);
	const slots = ctx.seats?.[kind];
	if (slots === undefined || !isPlainObject(out)) return out;
	for (const [slotName, table] of Object.entries(slots)) {
		for (const seat of Object.values(table)) {
			const key = camelCase(slotName);
			const value = (out as Record<string, unknown>)[key];
			if (seat.shape === 'elements') {
				if (!Array.isArray(value)) continue;
				out = {
					...(out as Record<string, unknown>),
					[key]: value.map((e) => (isPlainObject(e) ? wrapTextLeaves(seat.kind, e, ctx) : e))
				};
				continue;
			}
			if (ctx.loose !== undefined && seat.shape === 'tuple' && Array.isArray(value)) {
				// A tuple seat carries the child's options bag as its first entry; one
				// that restates the child's default says nothing the loose call needs.
				const [first, ...rest] = value;
				if (isListOptions(first) && listOptionsAreDefault(seat.kind, first, ctx)) {
					out = { ...(out as Record<string, unknown>), [key]: rest };
				}
				continue;
			}
			if (ctx.loose !== undefined && seat.seated === true && isPlainObject(value)) {
				// A seated arm's config is the child's own: its keys are the child's
				// slots, so the child's rules decide their loose spelling.
				out = { ...(out as Record<string, unknown>), [key]: wrapTextLeaves(seat.kind, value, ctx) };
				continue;
			}
			out = wrapTextLeaves(seat.kind, out, ctx);
		}
	}
	return out;
}

interface PlacedArg {
	/** The value as the strict surface spells it at the kind's sole slot. */
	readonly strict: unknown;
	/** The same value as the loose surface spells it there. */
	readonly loose: unknown;
}

/**
 * A single-slot kind's argument, spelled both ways: the strict form is what
 * the argument is when the wrapper is dropped and it lands on the PARENT's
 * slot, where the parent's rules decide its spelling afresh; the loose form
 * is its spelling inside the wrapper's own call.
 */
function placeDirectArg(kind: string, value: unknown, ctx: PrintContext): PlacedArg {
	const text = textLeafValue(value);
	const properties = Object.keys(ctx.slotKinds?.[kind] ?? {});
	const property = properties.length === 1 ? properties[0] : undefined;
	if (text === undefined) {
		return { strict: value, loose: property === undefined ? value : loosenAt(kind, property, value, ctx) };
	}
	const leaf = property === undefined ? undefined : textLeafOfSlot(kind, property, text, ctx);
	const kinds = property === undefined ? [] : (ctx.slotKinds?.[kind]?.[property] ?? []);
	const storage = property === undefined ? undefined : ctx.slotStorage?.[kind]?.[property];
	const strict = printVerbatimText(text, leaf, ctx, kinds, storage);
	return { strict, loose: readLeafBare(kind, text, ctx) ? text : strict };
}

function wrapDirectArg(kind: string, value: unknown, ctx: PrintContext): unknown {
	return placeDirectArg(kind, value, ctx).loose;
}

function camelCase(kind: string): string {
	return kind.replace(/^_+/, '').replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());
}

/** The strict flavor is named; the loose one is the bundle's own call. */
function callSpelling(path: string, ctx: PrintContext): string {
	return ctx.loose === undefined ? `${path}.strict` : path;
}

export function printingFactoryMap(
	realShapes: Record<string, FactoryShape>,
	kindIdOfName: (kind: string) => number | undefined,
	ctx: PrintContext
): Record<string, (...args: unknown[]) => Printed | string> {
	const map: Record<string, (...args: unknown[]) => Printed | string> = {};
	const kinds = Object.keys(realShapes);
	for (const kind of kinds) {
		const shape: FactoryShape = realShapes[kind]!;
		const path = ctx.irPathOfKind(kind);
		const id = kindIdOfName(kind) ?? kind;
		const publicName = kind.replace(/^_+/, '');
		const call = callSpelling(path, ctx);
		const entry = (...args: unknown[]): Printed | string => {
			switch (shape) {
				case 'text': {
					const text = String(args[0] ?? '');
					if (ctx.enumKinds?.has(kind)) {
						const member = ctx.memberIdOfText?.(text);
						return new Printed(id, member === undefined ? JSON.stringify(text) : printValue(member, ctx, 0), kind);
					}
					// A hidden text kind has no factory on `ir` (the model's key for it
					// names nothing emitted): it hands its text to the parent, whose
					// slot prints it through the public text kind it declares.
					if (kind.startsWith('_')) return text;
					return new Printed(id, `${path}(${JSON.stringify(text)})`, kind, undefined, { text });
				}
				case 'direct':
				case 'forwarded': {
					const placed = placeDirectArg(kind, args[0], ctx);
					const value = placed.loose;
					const absorbed =
						value instanceof Printed && value.kind !== undefined && ctx.absorbedKinds?.has(value.kind)
							? value.argsSource
							: undefined;
					// The strict wrapper re-exposes its child's rest parameters; the loose
					// one takes one input, so the spliced arguments ride as its array.
					const argSource =
						absorbed !== undefined
							? ctx.loose === undefined
								? absorbed
								: `[${absorbed}]`
							: value === undefined
								? ''
								: printValue(value, ctx, 0);
					return new Printed(id, `${call}(${argSource})`, kind, argSource, { inner: placed.strict });
				}
				case 'spread': {
					const items = args.map((a) => wrapDirectArg(kind, a, ctx));
					const argSource = items.map((a) => printValue(a, ctx, 0)).join(', ');
					return new Printed(id, `${call}(${argSource})`, kind, argSource, { elements: { items } });
				}
				case 'elements': {
					const [first, ...rest] = args;
					const hasOptions = isListOptions(first);
					const items = (hasOptions ? rest : args).map((a) =>
						wrapSeatElement(kind, hoistSeatElement(kind, wrapDirectArg(kind, a, ctx), ctx), ctx)
					);
					const elements = items.map((a) => printValue(looseListElement(kind, a, ctx), ctx, 0));
					const options = hasOptions ? first : undefined;
					const head =
						options !== undefined && !(ctx.loose !== undefined && listOptionsAreDefault(kind, options, ctx))
							? [printListOptions(options, ctx)]
							: [];
					const argSource = [...head, ...elements].join(', ');
					return new Printed(id, `${call}(${argSource})`, kind, argSource, { elements: { options, items } });
				}
				case 'config':
				default: {
					const wrapped = wrapSeatedConfig(kind, args[0] ?? {}, ctx);
					const argSource = printValue(wrapped, ctx, 0);
					const source = ctx.loose !== undefined && argSource === '{}' ? `${call}()` : `${call}(${argSource})`;
					return new Printed(id, source, kind, argSource, { config: argSource });
				}
			}
		};
		map[kind] = entry;
		if (!(publicName in map) && !kinds.includes(publicName)) map[publicName] = entry;
	}
	return map;
}

/**
 * The printing counterpart of a grammar's `ir` bindings: every kind's
 * `strict`, plus one entry per mount name its seats declare, printing
 * `ir.<parent>.<mount>.strict(…)`. Handing this to
 * `buildFactoryNodeFromReference` as the surface makes the printer take the
 * same seat projection the validators take, so the emitted spelling is the
 * one `ir-render-parse` builds rather than a second derivation of it.
 */
export function printingIrSurface(
	map: Record<string, (...args: unknown[]) => Printed | string>,
	kindIdOfName: (kind: string) => number | undefined,
	modelTypes: Record<string, string>,
	ctx: PrintContext
): IrSurface {
	const entries: Record<string, IrEntry> = {};
	for (const [kind, strict] of Object.entries(map)) {
		const entry: Record<string, unknown> = { strict };
		const path = ctx.irPathOfKind(kind);
		const id = kindIdOfName(kind) ?? kind;
		for (const table of Object.values(ctx.seats?.[kind] ?? {})) {
			for (const seat of Object.values(table)) {
				if (seat.shape !== 'arm' || seat.mount === undefined || seat.mount in entry) continue;
				entry[seat.mount] = { strict: mountPrinter(path, seat, kind, id, ctx) };
			}
		}
		entries[kind] = entry as IrEntry;
	}
	return { entries, seats: ctx.seats ?? {}, modelTypes };
}

function mountPrinter(
	path: string,
	seat: Seat,
	parentKind: string,
	id: number | string,
	ctx: PrintContext
): (...args: unknown[]) => Printed | string {
	return (...args: unknown[]): Printed => {
		const given = args.slice(0, args.findLastIndex((a) => a !== undefined) + 1);
		const printed = given.map((a) =>
			printValue(isPlainObject(a) ? wrapSeatedConfig(parentKind, a, ctx) : wrapDirectArg(seat.kind, a, ctx), ctx, 0)
		);
		const argSource = printed.join(', ');
		return new Printed(id, `${callSpelling(`${path}.${seat.mount!}`, ctx)}(${argSource})`, parentKind, argSource);
	};
}

export function printFactorySource(
	root: ReadNodeLike,
	rootKind: string,
	artifacts: FactoryDispatchArtifacts,
	opts: FactoryDispatchOpts,
	ctx: PrintContext
): string {
	const printed = buildFactoryNodeFromReference(root, rootKind, artifacts, opts);
	if (!(printed instanceof Printed)) {
		throw new Error(`emit-factory-source: no factory for root kind '${rootKind}'`);
	}
	return printed.source + triviaSuffix(triviaOf(printed, ctx.source), ctx);
}

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import {
	TYPES_MODULE_PATHS,
	buildReadHandle,
	loadKindIdFromName,
	loadKindNameFromId,
	loadLanguageForGrammar,
	loadNodeModel,
	loadReadTreeNode,
	materializeWrappedNodeData
} from '../validate/common.ts';
import { invoke, load } from '../codegen-surface.ts';
import type { GeneratedIdTables, GeneratedKindEntry } from '../codegen-surface.ts';

interface TypesModule {
	readonly KIND_NAMES: ReadonlyMap<number, string>;
	readonly TSKindId: Record<number, string | number>;
	readonly Delimiter: Record<number, string | number>;
}

function pascalCase(name: string): string {
	const c = camelCase(name.replace(/[^A-Za-z0-9_]+/g, '_'));
	return c.charAt(0).toUpperCase() + c.slice(1);
}

function withPublicNames<T>(record: Record<string, T>): Record<string, T> {
	const out: Record<string, T> = { ...record };
	for (const [kind, value] of Object.entries(record)) {
		const publicName = kind.replace(/^_+/, '');
		if (!(publicName in out)) out[publicName] = value;
	}
	return out;
}

/**
 * A hoisted child whose OWN surface is a rest-parameter one (`spread`, or a
 * separated list's `elements`) and that its parent takes POSITIONALLY is
 * absorbed: its arguments splice straight into the parent's call, because the
 * parent's own factory already offers those rest parameters. A parent with
 * named keys takes the same child as a tuple on its slot, which is the tuple
 * seat. Every other hoisted child prints its own call, and so does one that
 * seats children of its own: those arrive as the child's configs, which only
 * the child's own builder knows how to take.
 */
function absorbedKindsOf(model: {
	hoistedKinds: ReadonlySet<string>;
	factoryShapes: Record<string, FactoryShape>;
	seats: SeatTable;
}): ReadonlySet<string> {
	const out = new Set<string>();
	for (const kind of model.hoistedKinds) {
		const shape = model.factoryShapes[kind];
		if (shape !== 'spread' && shape !== 'elements') continue;
		if (model.seats[kind] !== undefined) continue;
		out.add(kind);
		out.add(kind.replace(/^_+/, ''));
	}
	return out;
}

interface VariantForm {
	readonly parent: string;
	readonly form: string;
}

/**
 * The variant form each child kind is declared under, keyed by node kind and
 * by its public name. `childKind` is keyed by parse kind, which drops a hidden
 * kind's leading underscore.
 */
function variantFormsOf(
	variants: PolymorphVariantMap,
	modelTypes: Record<string, string>
): ReadonlyMap<string, VariantForm> {
	const kindOf = (name: string): string | undefined =>
		name in modelTypes ? name : `_${name}` in modelTypes ? `_${name}` : undefined;
	const out = new Map<string, VariantForm>();
	for (const [parent, descriptor] of Object.entries(variants)) {
		if (descriptor.definedBy !== 'override') continue;
		const parentKind = kindOf(parent);
		if (parentKind === undefined) continue;
		for (const [child, form] of Object.entries(descriptor.childKind)) {
			const childKind = kindOf(child);
			if (childKind === undefined || childKind === parentKind || out.has(childKind)) continue;
			const entry: VariantForm = { parent: parentKind, form };
			out.set(childKind, entry);
			const publicName = childKind.replace(/^_+/, '');
			if (!out.has(publicName)) out.set(publicName, entry);
		}
	}
	return out;
}

/**
 * A variant of a flattened parent is spelled by codegen's published route
 * (`node-model.json5` `variantRoutes`, e.g. `ir.exportStatement.default.from`).
 * Any other hoisted compound has no flat `ir` binding — hoisting is what keeps
 * it out of the bundle — so its spelling is the variant form its parent
 * declares: `ir.<parent>.<form>`. The parent composes in turn while it is itself
 * hoisted, and the path stops at the first kind that owns a flat binding.
 * Being declared under a variant form does not settle this on its own: a kind
 * that is not hoisted carries both spellings, and its flat one is canonical.
 */
function irPathResolver(
	irKeys: Record<string, string>,
	variantForms: ReadonlyMap<string, VariantForm>,
	hoistedKinds: ReadonlySet<string>,
	variantRoutes: Readonly<Record<string, string>>
): (kind: string) => string {
	const isHoisted = (kind: string): boolean => hoistedKinds.has(kind) || hoistedKinds.has(`_${kind}`);
	const segments = (kind: string, seen: Set<string>): string[] => {
		const route = variantRoutes[kind] ?? variantRoutes[`_${kind}`];
		if (route !== undefined) return [route];
		const form = variantForms.get(kind);
		if (form === undefined || !isHoisted(kind) || seen.has(kind)) {
			return [irKeys[kind] ?? camelCase(kind)];
		}
		seen.add(kind);
		return [...segments(form.parent, seen), camelCase(form.form)];
	};
	return (kind: string): string => `ir.${segments(kind, new Set()).join('.')}`;
}

interface SeatWalkContext {
	readonly kindNameFromId: (id: number) => string | undefined;
	readonly seats: SeatTable;
}

/**
 * Apply the seat key-move to every node of an already-materialized tree,
 * bottom-up so a child is seated before its parent reads the slot.
 */
function seatFormTree(node: unknown, ctx: SeatWalkContext, depth = 0): void {
	if (depth > 256) return;
	if (Array.isArray(node)) {
		for (const entry of node) seatFormTree(entry, ctx, depth + 1);
		return;
	}
	if (!isPlainObject(node)) return;
	for (const [key, value] of Object.entries(node)) {
		if (key.startsWith('_')) seatFormTree(value, ctx, depth + 1);
	}
	seatFormChild(node, ctx);
}

/**
 * A read stores an arm's value under the child's own kind (`_delim_token_tree_paren`)
 * when the parent's slot carries no label. Move it to the slot the seat names
 * so `nodeToConfig` sees a declared slot and the seat projection applies.
 */
function seatFormChild(node: Record<string, unknown>, mctx: SeatWalkContext): void {
	const kind = typeof node.$type === 'number' ? mctx.kindNameFromId(node.$type) : undefined;
	if (kind === undefined) return;
	const slots = mctx.seats[kind];
	if (slots === undefined) return;
	for (const [key, value] of Object.entries(node)) {
		if (!key.startsWith('_')) continue;
		const childKind = key.slice(1);
		for (const [slotName, table] of Object.entries(slots)) {
			if (table[childKind] === undefined && table[`_${childKind}`] === undefined) continue;
			if (slotName === childKind || node[`_${slotName}`] !== undefined) continue;
			node[`_${slotName}`] = value;
			delete node[key];
			return;
		}
	}
}

function catalogEntriesOf(tables: GeneratedIdTables | undefined): GeneratedKindEntry[] {
	const kindIds = tables?.kindIds;
	if (kindIds === undefined) return [];
	const rows = kindIds instanceof Map ? [...kindIds.entries()] : Object.entries(kindIds);
	return rows.map(([kind, value]) =>
		typeof value === 'number'
			? { kind, id: value }
			: {
					kind,
					id: value.id ?? -1,
					symbolName: value.parser?.symbolName,
					literalText: value.parser?.literalText,
					literalRule: value.parser?.literalRule,
					anon: value.parser?.anon
				}
	);
}

export interface EmitSurfaceOptions {
	/** `strict` prints `.strict(...)` calls; `loose` prints the bundle calls with every coercion the loose contract admits. */
	readonly surface?: 'strict' | 'loose';
	/** On the loose surface, whether a nested compound prints as its builder call or as a config object. */
	readonly nested?: 'calls' | 'configs';
	/** The read backend; the native engine unless a caller has none to offer. */
	readonly backend?: 'native' | 'js';
}

export async function emitFactorySourceText(
	grammar: string,
	source: string,
	exportName: string,
	options: EmitSurfaceOptions = {}
): Promise<string> {
	const surface = options.surface ?? 'strict';
	const nested = options.nested ?? 'calls';
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	const tree = parser.parse(source);
	if (!tree || tree.rootNode.hasError) throw new Error(`emit-factory-source: the ${grammar} parse has errors`);
	const readTreeNode = await loadReadTreeNode(grammar);
	if (!readTreeNode) throw new Error(`emit-factory-source: no wrap module for ${grammar}`);
	const kindIdFromName = await loadKindIdFromName(grammar);
	const handle = await buildReadHandle(grammar, tree, source, options.backend ?? 'native', kindIdFromName);
	const model = await loadNodeModel(grammar);
	const typesPath = TYPES_MODULE_PATHS[grammar];
	if (!typesPath) throw new Error(`emit-factory-source: no types module for ${grammar}`);
	const types = (await import(new URL(`../validate/${typesPath}`, import.meta.url).pathname)) as TypesModule;
	const displayNameFromId = await loadKindNameFromId(grammar);
	const kindNameFromId = (id: number): string | undefined => types.KIND_NAMES.get(id) ?? displayNameFromId?.(id);
	const idOfName = new Map<string, number>();
	for (const [id, name] of types.KIND_NAMES) {
		if (!idOfName.has(name)) idOfName.set(name, id);
		const display = displayNameFromId?.(id);
		if (display !== undefined && !idOfName.has(display)) idOfName.set(display, id);
	}
	const memberOf = (table: Record<number, string | number>, id: number): string | undefined =>
		typeof table[id] === 'string' ? (table[id] as string) : undefined;
	const catalog = catalogEntriesOf(await invoke('generatedMetadata', 'loadGeneratedIdTables', grammar));
	const { findEntryForLiteralText } = await load('generatedMetadata');
	const root = materializeWrappedNodeData(readTreeNode(handle)) as ReadNodeLike;
	seatFormTree(root, { kindNameFromId, seats: model.seats });
	const leafFindings: string[] = [];
	const textLeafKinds = new Set(Object.keys(model.modelTypes).filter((k) => model.modelTypes[k] === 'pattern'));
	const ctx: PrintContext = {
		grammar,
		kindNameFromId,
		memberNameOfId: (id) => memberOf(types.TSKindId, id),
		irPathOfKind: irPathResolver(
			withPublicNames(model.irKeys),
			variantFormsOf(model.polymorphVariants, model.modelTypes),
			model.hoistedKinds,
			model.variantRoutes
		),
		seats: model.seats,
		slotKinds: withPublicNames(model.slotKinds),
		textLeafKinds,
		leafPatterns: model.leafPatterns,
		leafFindings,
		enumKinds: new Set(Object.keys(model.modelTypes).filter((k) => model.modelTypes[k] === 'enum')),
		absorbedKinds: absorbedKindsOf(model),
		slotStorage: withPublicNames(model.slotStorage),
		keywordKinds: new Set(
			Object.keys(model.modelTypes).filter(
				(k) => model.modelTypes[k] === 'keyword' || model.modelTypes[k] === 'punctuation'
			)
		),
		memberIdOfText: (text) => findEntryForLiteralText(catalog, text)?.id,
		source,
		delimiterArmOfId: (id) => {
			const member = memberOf(types.Delimiter, id);
			return member === undefined ? undefined : `Delimiter.${member}`;
		},
		loose:
			surface === 'loose'
				? {
						// Keyed by the model's own kind names: a slot names a hidden kind
						// with its underscore, and a public spelling would collide with a
						// visible kind of the same name (`_identifier` over `identifier`).
						nested,
						modelTypes: model.modelTypes,
						subtypes: model.subtypes,
						slotRequired: model.slotRequired,
						slotMultiple: model.slotMultiple,
						slotDefaults: model.slotDefaults,
						bareAccepts: model.bareAccepts,
						forwardsTo: model.forwardsTo,
						listDefaults: model.listDefaults,
						listElementKinds: model.listElementKinds,
						hoistedKinds: model.hoistedKinds,
						kindIdOfName: (kind) => idOfName.get(kind)
					}
				: undefined
	};
	const factoryShapes: Record<string, FactoryShape> = withPublicNames(model.factoryShapes);
	const factoryMap = printingFactoryMap(model.factoryShapes, (kind) => idOfName.get(kind), ctx);
	const artifacts: FactoryDispatchArtifacts = {
		factoryMap,
		surface: printingIrSurface(factoryMap, (kind) => idOfName.get(kind), model.modelTypes, ctx),
		factoryShapes,
		fieldAliasMap: withPublicNames(model.fieldAliasMap),
		factoryFields: withPublicNames(model.factoryFields),
		factorySlots: withPublicNames(model.factorySlots)
	};
	const rootKind = typeof root.$type === 'number' ? kindNameFromId(root.$type) : root.$type;
	if (!rootKind) throw new Error(`emit-factory-source: root kind id ${String(root.$type)} is not in the catalog`);
	const body = printFactorySource(root, rootKind, artifacts, { kindNameFromId, tree: handle }, ctx);
	for (const finding of new Set(leafFindings)) process.stderr.write(`[emit-factory-source] leaf finding: ${finding}\n`);
	const flags = surface === 'loose' ? ` --surface loose${nested === 'configs' ? ' --nested configs' : ''}` : '';
	return [
		`// @generated by \`sittir tool emit-factory-source${flags}\`; do not edit.`,
		`import { ${['ir', 'TSKindId', 'Delimiter'].filter((name) => new RegExp(`\\b${name}\\b`).test(body)).join(', ')} } from '@sittir/${grammar}';`,
		'',
		`export function ${exportName}() {`,
		`\treturn ${body.replace(/\n/g, '\n\t')};`,
		'}',
		''
	].join('\n');
}

export interface EmitFactorySourceOptions extends EmitSurfaceOptions {
	readonly grammar: string;
	readonly file: string;
	readonly exportName?: string;
	readonly out?: string;
}

export async function run(opts: EmitFactorySourceOptions): Promise<number> {
	const file = resolve(opts.file);
	const source = readFileSync(file, 'utf8');
	const exportName = opts.exportName ?? `rebuild${pascalCase(basename(file).replace(/\.[^.]+$/, ''))}`;
	const printed = await emitFactorySourceText(opts.grammar, source, exportName, opts);
	if (opts.out) writeFileSync(resolve(opts.out), printed);
	else process.stdout.write(printed);
	return 0;
}
