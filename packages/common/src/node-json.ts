import type { NodeJSON, NodeJSONFacts, NodeJSONValue } from '@sittir/types';
import { nodeText, setUnitSides, unitSidesOf, type UnitSidesData } from './node-data.ts';
import { ERROR_KIND_ID, ERROR_KIND_NAME } from './error-kind.ts';
import { hydrateTriviaEntry, isNode } from './utils.ts';

type Members = { readonly [member: string]: unknown };

const COMMENT_SIDES = [
	['leading', 'leadingComments'],
	['trailing', 'trailingComments'],
	['inner', 'innerComments']
] as const;

const UNIT_SIDES = COMMENT_SIDES.slice(0, 2);

type UnitSides = ReadonlyMap<number, UnitSidesData>;

/**
 * A node's JSON (`NodeMethods.toJSON`).
 *
 * @param node - A node of the language `facts` describe.
 * @param facts - The language's JSON facts.
 * @returns The node's kind name, a leaf's text, each slot under its accessor's name and its comments.
 * @throws When the node or a value it holds is of no kind the language names.
 */
export function nodeJSON(node: object, facts: NodeJSONFacts): NodeJSON {
	const members = node as Members & { readonly $type: number };
	const json: Record<string, NodeJSONValue> = { $type: kindName(members.$type, facts) };
	if (facts.leaves.has(members.$type) || members.$type === ERROR_KIND_ID) {
		const text = nodeText(node);
		if (text !== undefined) json.$text = text;
	}
	const units = unitSidesBySlot(node);
	for (const [accessor, , , storageKey] of facts.slots[members.$type] ?? []) {
		const read = members[accessor];
		const value = valueJSON(typeof read === 'function' ? (read as () => unknown).call(node) : undefined, facts, units.get(storageKey));
		if (value !== undefined) json[accessor] = value;
	}
	const trivia = members.$trivia as Readonly<Record<string, (() => readonly unknown[]) | undefined>> | undefined;
	for (const [side, key] of COMMENT_SIDES) {
		const comments = commentsJSON(trivia?.[side]?.() ?? [], facts);
		if (comments.length > 0) json[key] = comments;
	}
	return json as NodeJSON;
}

function unitSidesBySlot(node: object): ReadonlyMap<string, UnitSides> {
	const bySlot = new Map<string, Map<number, UnitSidesData>>();
	for (const unit of (unitSidesOf(node) ?? []) as readonly UnitSidesData[]) {
		let items = bySlot.get(unit.slot);
		if (items === undefined) bySlot.set(unit.slot, (items = new Map()));
		items.set(unit.item, unit);
	}
	return bySlot;
}

function commentsJSON(entries: readonly unknown[], facts: NodeJSONFacts): NodeJSON[] {
	return entries
		.filter((entry) => !facts.layout.has(typeof entry === 'number' ? entry : (entry as Members & { readonly $type: number }).$type))
		.map((entry) => valueJSON(hydrateTriviaEntry(entry), facts) as NodeJSON);
}

function unitJSON(kindId: number, sides: UnitSidesData | undefined, facts: NodeJSONFacts): NodeJSON {
	const json: Record<string, NodeJSONValue> = { $type: kindName(kindId, facts) };
	for (const [side, key] of UNIT_SIDES) {
		const comments = commentsJSON(sides?.[side] ?? [], facts);
		if (comments.length > 0) json[key] = comments;
	}
	return json as NodeJSON;
}

function valueJSON(value: unknown, facts: NodeJSONFacts, units?: UnitSides, item = 0): NodeJSONValue | undefined {
	if (value === undefined || value === false) return undefined;
	if (value === true || typeof value === 'string') return value;
	if (value === facts.blank) return null;
	if (typeof value === 'number') return unitJSON(value, units?.get(item), facts);
	if (isNode(value)) return nodeJSON(value, facts);
	if (typeof value === 'object' && value !== null && Symbol.iterator in value) {
		return [...(value as Iterable<unknown>)].map((entry, index) => (entry === null ? null : ((valueJSON(entry, facts, units, index) as NodeJSON | null | undefined) ?? null)));
	}
	throw new TypeError(`toJSON: a slot holds a node, a list, a kind id, a keyword's presence or a string, not ${String(value)}`);
}

function kindName(kindId: number, facts: NodeJSONFacts): string {
	const name = facts.names.get(kindId);
	if (name === undefined) throw new TypeError(`toJSON: kind id ${kindId} names no kind of this language`);
	return name;
}

type Revived = { readonly $trivia: Readonly<Record<string, (...items: unknown[]) => unknown>> };

/** How the reviver builds: the language's build-by-kind hook, and the engine's settle for each node it builds. */
export interface ReviveHooks {
	readonly facts: NodeJSONFacts;
	build(kind: string, ...input: unknown[]): unknown;
	settle(node: unknown): unknown;
}

const NODE_KEYS = new Set(['$type', '$text', ...COMMENT_SIDES.map(([, key]) => key)]);
const kindNames = new WeakMap<NodeJSONFacts, ReadonlySet<string>>();

/**
 * Builds a value `JSON.parse` read back into nodes (`engine.reviver`): each object with a `$type`, children first.
 *
 * @param value - The parsed JSON.
 * @param hooks - How to build and settle the language's nodes.
 * @returns `value` with every node's JSON built into a node.
 * @throws Naming the JSON path, for a kind the language lacks, an ERROR node, a slot the kind lacks or a leaf without its text.
 */
export function reviveNode(value: unknown, hooks: ReviveHooks): unknown {
	return revive(value, '$', hooks);
}

function revive(value: unknown, path: string, hooks: ReviveHooks): unknown {
	if (Array.isArray(value)) return value.map((item, index) => revive(item, `${path}[${index}]`, hooks));
	if (value === null || typeof value !== 'object') return value;
	const object = value as Record<string, unknown>;
	if (typeof object.$type !== 'string') {
		return Object.fromEntries(Object.entries(object).map(([key, member]) => [key, revive(member, `${path}.${key}`, hooks)]));
	}
	const { facts } = hooks;
	const name = object.$type;
	if (name === ERROR_KIND_NAME) throw new Error(`${path}: an ERROR node cannot be built`);
	const kindId = kindIdOf(name, facts);
	if (kindId === undefined) throw new Error(`${path}: unknown kind '${name}'`);
	const storageKeys = new Map((facts.slots[kindId] ?? []).map(([accessor, , , storageKey]) => [accessor, storageKey]));
	const accessors = new Set(storageKeys.keys());
	for (const key of Object.keys(object)) {
		if (!NODE_KEYS.has(key) && !accessors.has(key)) throw new Error(`${path}: ${name} has no slot '${key}'`);
	}
	if (facts.units.has(kindId)) return kindId;
	let node: unknown;
	const contentKind = facts.textEnvelopes.get(kindId);
	const envelopeText = contentKind === undefined ? undefined : contentText(object, accessors, contentKind, facts);
	if (envelopeText !== undefined) {
		node = buildAt(path, hooks, name, [{ text: envelopeText }]);
	} else if (facts.leaves.has(kindId)) {
		if (typeof object.$text !== 'string') throw new Error(`${path}: ${name} is a leaf and needs its $text`);
		node = buildAt(path, hooks, name, [{ text: object.$text }]);
	} else {
		const optionNames = new Set(facts.options[kindId] ?? []);
		const slots: Record<string, unknown> = {};
		const options: Record<string, unknown> = {};
		const units: UnitSidesData[] = [];
		for (const accessor of accessors) {
			if (!(accessor in object)) continue;
			const member = object[accessor];
			const at = `${path}.${accessor}`;
			const slot = storageKeys.get(accessor)!;
			const value = Array.isArray(member)
				? member.map((item, index) => (item === null ? undefined : reviveItem(item, `${at}[${index}]`, hooks, slot, index, units)))
				: reviveItem(member, at, hooks, slot, 0, units);
			if (optionNames.has(accessor)) options[accessor] = value;
			else slots[accessor] = value;
		}
		const hasOptions = Object.keys(options).length > 0;
		const items = (Object.values(slots)[0] ?? []) as unknown[];
		const args = facts.spread.has(kindId) ? (hasOptions ? [options, ...items] : items) : hasOptions ? [slots, options] : [slots];
		node = buildAt(path, hooks, name, args);
		if (units.length > 0) setUnitSides(node as object, units);
	}
	for (const [side, key] of COMMENT_SIDES) {
		const comments = object[key];
		if (!Array.isArray(comments) || comments.length === 0) continue;
		const entries = comments.map((entry, index) => revive(entry, `${path}.${key}[${index}]`, hooks));
		node = (node as Revived).$trivia[side]!(...entries);
	}
	return hooks.settle(node);
}

function reviveItem(value: unknown, path: string, hooks: ReviveHooks, slot: string, item: number, units: UnitSidesData[]): unknown {
	const revived = revive(value, path, hooks);
	if (typeof revived !== 'number' || value === null || typeof value !== 'object') return revived;
	const object = value as Record<string, unknown>;
	const sides: Record<string, unknown[]> = {};
	for (const [side, key] of UNIT_SIDES) {
		const comments = object[key];
		if (Array.isArray(comments) && comments.length > 0) sides[side] = comments.map((entry, index) => revive(entry, `${path}.${key}[${index}]`, hooks));
	}
	if (Object.keys(sides).length > 0) units.push({ slot, item, ...sides });
	return revived;
}

function contentText(envelope: Record<string, unknown>, accessors: ReadonlySet<string>, contentKind: number, facts: NodeJSONFacts): string | undefined {
	const [accessor] = accessors;
	const content = accessor === undefined ? undefined : envelope[accessor];
	if (accessors.size !== 1 || content === null || typeof content !== 'object' || Array.isArray(content)) return undefined;
	const members = content as Record<string, unknown>;
	if (Object.keys(members).some((key) => key !== '$type' && key !== '$text')) return undefined;
	if (typeof members.$type !== 'string' || kindIdOf(members.$type, facts) !== contentKind) return undefined;
	return typeof members.$text === 'string' ? members.$text : undefined;
}

function buildAt(path: string, hooks: ReviveHooks, kind: string, args: readonly unknown[]): unknown {
	try {
		return hooks.build(kind, ...args);
	} catch (error) {
		throw new Error(`${path}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
	}
}

function kindIdOf(name: string, facts: NodeJSONFacts): number | undefined {
	let names = kindNames.get(facts);
	if (names === undefined) {
		names = new Set(facts.names.values());
		kindNames.set(facts, names);
	}
	return names.has(name) ? facts.kindId(name) : undefined;
}
