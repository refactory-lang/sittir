import type { NodeJSON, NodeJSONFacts, NodeJSONValue } from '@sittir/types';
import { nodeText } from './node-data.ts';
import { ERROR_KIND_ID, ERROR_KIND_NAME } from './error-kind.ts';
import { isNode } from './utils.ts';

type Members = { readonly [member: string]: unknown };

const COMMENT_SIDES = [
	['leading', 'leadingComments'],
	['trailing', 'trailingComments'],
	['inner', 'innerComments']
] as const;

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
	for (const [accessor] of facts.slots[members.$type] ?? []) {
		const read = members[accessor];
		const value = valueJSON(typeof read === 'function' ? (read as () => unknown).call(node) : undefined, facts);
		if (value !== undefined) json[accessor] = value;
	}
	const trivia = members.$trivia as Readonly<Record<string, (() => readonly unknown[]) | undefined>> | undefined;
	for (const [side, key] of COMMENT_SIDES) {
		const comments = (trivia?.[side]?.() ?? []).filter((entry) => !facts.layout.has(typeof entry === 'number' ? entry : (entry as Members & { readonly $type: number }).$type));
		if (comments.length > 0) json[key] = comments.map((entry) => valueJSON(entry, facts) as NodeJSON);
	}
	return json as NodeJSON;
}

function valueJSON(value: unknown, facts: NodeJSONFacts): NodeJSONValue | undefined {
	if (value === undefined || value === false) return undefined;
	if (value === true || typeof value === 'string') return value;
	if (value === facts.blank) return null;
	if (typeof value === 'number') return { $type: kindName(value, facts) };
	if (isNode(value)) return nodeJSON(value, facts);
	if (typeof value === 'object' && value !== null && Symbol.iterator in value) {
		return [...(value as Iterable<unknown>)].map((item) => (item === null ? null : ((valueJSON(item, facts) as NodeJSON | null | undefined) ?? null)));
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
	const accessors = new Set((facts.slots[kindId] ?? []).map(([accessor]) => accessor));
	for (const key of Object.keys(object)) {
		if (!NODE_KEYS.has(key) && !accessors.has(key)) throw new Error(`${path}: ${name} has no slot '${key}'`);
	}
	if (facts.units.has(kindId)) return kindId;
	let node: unknown;
	if (facts.leaves.has(kindId)) {
		if (typeof object.$text !== 'string') throw new Error(`${path}: ${name} is a leaf and needs its $text`);
		node = buildAt(path, hooks, name, [{ text: object.$text }]);
	} else {
		const optionNames = new Set(facts.options[kindId] ?? []);
		const slots: Record<string, unknown> = {};
		const options: Record<string, unknown> = {};
		for (const accessor of accessors) {
			if (!(accessor in object)) continue;
			const member = object[accessor];
			const at = `${path}.${accessor}`;
			const value = Array.isArray(member)
				? member.map((item, index) => (item === null ? undefined : revive(item, `${at}[${index}]`, hooks)))
				: revive(member, at, hooks);
			if (optionNames.has(accessor)) options[accessor] = value;
			else slots[accessor] = value;
		}
		const hasOptions = Object.keys(options).length > 0;
		const items = (Object.values(slots)[0] ?? []) as unknown[];
		const args = facts.spread.has(kindId) ? (hasOptions ? [options, ...items] : items) : hasOptions ? [slots, options] : [slots];
		node = buildAt(path, hooks, name, args);
	}
	for (const [side, key] of COMMENT_SIDES) {
		const comments = object[key];
		if (!Array.isArray(comments) || comments.length === 0) continue;
		const entries = comments.map((entry, index) => revive(entry, `${path}.${key}[${index}]`, hooks));
		node = (node as Revived).$trivia[side]!(...entries);
	}
	return hooks.settle(node);
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
