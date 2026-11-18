import type { NodeMap } from '../types.ts';
import type { RenderRule } from '../../types/rule.ts';
import { CHOICE, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import {
	AbstractAssembledCompound,
	AssembledAlias,
	AssembledLeaf,
	AssembledLexedPattern,
	AssembledList,
	AssembledPolymorph,
	isMultiple,
	isNodeRef,
	isRequired,
	kindsOf,
	valueParseKindsOf,
	type AssembledNode,
	type AssembledNonterminal
} from './node-map.ts';

export interface WrapperChain {
	readonly holder: string;
	readonly slot: string;
	readonly accessor: string;
	readonly wrappers: readonly string[];
	readonly storage: readonly string[];
	readonly slots: readonly AssembledNonterminal[];
}

interface Walk {
	readonly nodeMap: NodeMap;
	readonly slot: AssembledNonterminal;
	readonly forms: boolean;
	slotSeen: boolean;
	failed: boolean;
}

function isTheSlot(rule: RenderRule, walk: Walk): boolean {
	if (rule.fieldName !== undefined) return rule.fieldName === walk.slot.fieldName;
	return walk.slot.fieldName === undefined && rule.type !== SEQ && rule.id !== undefined && walk.slot.sourceRuleIds.includes(rule.id);
}

function visit(rule: RenderRule, certain: boolean, walk: Walk): void {
	if (walk.failed) return;
	if (isTheSlot(rule, walk)) {
		walk.slotSeen = true;
		return;
	}
	const here = certain && rule.multiplicity !== 'optional' && rule.multiplicity !== 'array';
	const members = (rule as { readonly members?: readonly RenderRule[] }).members;
	const content = (rule as { readonly content?: RenderRule }).content;
	switch (rule.type) {
		case STRING:
			if (!here) walk.failed = true;
			return;
		case SEQ:
			for (const member of members ?? []) visit(member, here, walk);
			return;
		case CHOICE:
			if (walk.forms && (members ?? []).every((member) => member.type === SYMBOL || member.type === STRING)) {
				walk.slotSeen = true;
				return;
			}
			for (const member of members ?? []) visit(member, members?.length === 1 ? here : false, walk);
			return;
		case SYMBOL:
			if (!here || walk.nodeMap.nodes.get(rule.name)?.externalRole === undefined) walk.failed = true;
			return;
		case PATTERN:
			walk.failed = true;
			return;
		default:
			if (content !== undefined) {
				visit(content, here, walk);
				return;
			}
			for (const member of members ?? []) visit(member, here, walk);
	}
}

function realSlots(node: AssembledNode): readonly AssembledNonterminal[] {
	return node.slots.filter((slot) => slot.registeredOption === undefined);
}

function holdsOnlyNodes(slot: AssembledNonterminal): boolean {
	return slot.values.length > 0 && slot.values.every(isNodeRef);
}

function onlyNodeKind(slot: AssembledNonterminal): string | undefined {
	if (!holdsOnlyNodes(slot)) return undefined;
	const kinds = kindsOf(slot);
	return kinds.length === 1 ? kinds[0] : undefined;
}

function displayKindOf(slot: AssembledNonterminal, storage: string): string {
	if (!storage.startsWith('_')) return storage;
	const shown = valueParseKindsOf(slot);
	return shown.length === 1 && shown[0] !== undefined ? shown[0] : storage;
}

function wrapperSlotOf(nodeMap: NodeMap, kind: string): AssembledNonterminal | undefined {
	const node = nodeMap.nodes.get(kind);
	if (node === undefined || !(node instanceof AbstractAssembledCompound)) return undefined;
	if (node instanceof AssembledAlias || node instanceof AssembledLexedPattern) return undefined;
	const slots = realSlots(node);
	const slot = slots.length === 1 ? slots[0]! : undefined;
	if (slot === undefined || !holdsOnlyNodes(slot)) return undefined;
	if (node instanceof AssembledList) return slot;
	const walk: Walk = { nodeMap, slot, forms: node instanceof AssembledPolymorph, slotSeen: false, failed: false };
	visit(node.renderRule, true, walk);
	return walk.slotSeen && !walk.failed ? slot : undefined;
}

function holdsOnlyLeaf(nodeMap: NodeMap, slot: AssembledNonterminal): boolean {
	const kind = onlyNodeKind(slot);
	return kind !== undefined && nodeMap.nodes.get(kind) instanceof AssembledLeaf;
}

function holdsList(slot: AssembledNonterminal): boolean {
	return slot.values.some((value) => value.multiplicity === 'array' || value.multiplicity === 'nonEmptyArray');
}

function canBeEmpty(slot: AssembledNonterminal): boolean {
	const multiple = holdsList(slot);
	const nonEmpty = slot.values.every((value) => value.multiplicity === 'nonEmptyArray');
	return !isRequired(slot) || (multiple && !nonEmpty);
}

export function wrapperChainOf(nodeMap: NodeMap, holder: AbstractAssembledCompound, slot: AssembledNonterminal): WrapperChain | undefined {
	if (holder.kind.startsWith('_')) return undefined;
	const wrappers: string[] = [];
	const storage: string[] = [];
	const slots: AssembledNonterminal[] = [];
	let current = slot;
	let empty = false;
	for (;;) {
		const kind = onlyNodeKind(current);
		if (kind === undefined || wrappers.includes(kind)) break;
		const display = displayKindOf(current, kind);
		if (display.startsWith('_')) break;
		const inner = wrapperSlotOf(nodeMap, kind);
		if (inner === undefined || (holdsList(current) && holdsList(inner))) break;
		if (!(nodeMap.nodes.get(kind) instanceof AssembledList) && holdsOnlyLeaf(nodeMap, inner)) break;
		wrappers.push(display);
		storage.push(kind);
		slots.push(inner);
		empty = empty || canBeEmpty(inner);
		current = inner;
	}
	if (wrappers.length === 0) return undefined;
	if (empty && !isRequired(slot)) return undefined;
	return { holder: holder.kind, slot: slot.name, accessor: slot.propertyName, wrappers, storage, slots };
}

export function wrapperChainsOf(nodeMap: NodeMap): readonly WrapperChain[] {
	const out: WrapperChain[] = [];
	for (const node of nodeMap.nodes.values()) {
		if (!(node instanceof AbstractAssembledCompound)) continue;
		for (const slot of realSlots(node)) {
			const chain = wrapperChainOf(nodeMap, node, slot);
			if (chain !== undefined) out.push(chain);
		}
	}
	return out;
}

interface ChainTables {
	readonly byHolder: ReadonlyMap<string, WrapperChain>;
	readonly bySlot: ReadonlyMap<AssembledNonterminal, WrapperChain>;
}

const tables = new WeakMap<NodeMap, ChainTables>();

function chainTablesOf(nodeMap: NodeMap): ChainTables {
	let table = tables.get(nodeMap);
	if (table === undefined) {
		const byHolder = new Map<string, WrapperChain>();
		const bySlot = new Map<AssembledNonterminal, WrapperChain>();
		for (const node of nodeMap.nodes.values()) {
			if (!(node instanceof AbstractAssembledCompound)) continue;
			for (const slot of realSlots(node)) {
				const chain = wrapperChainOf(nodeMap, node, slot);
				if (chain === undefined) continue;
				byHolder.set(`${chain.holder}.${chain.slot}`, chain);
				bySlot.set(slot, chain);
			}
		}
		table = { byHolder, bySlot };
		tables.set(nodeMap, table);
	}
	return table;
}

export function wrapperChainFor(nodeMap: NodeMap, holder: string, slotName: string): WrapperChain | undefined {
	return chainTablesOf(nodeMap).byHolder.get(`${holder}.${slotName}`);
}

export function wrapperChainOfSlot(nodeMap: NodeMap, slot: AssembledNonterminal): WrapperChain | undefined {
	return chainTablesOf(nodeMap).bySlot.get(slot);
}

export function chainWrapExpr(chain: WrapperChain, nodeMap: NodeMap, factoryScope = '', holderOptional = false): string {
	const builder = (kind: string): string => `${factoryScope}${nodeMap.nodes.get(kind)!.rawFactoryName}`;
	const consumesList = (hop: number): boolean => nodeMap.nodes.get(chain.storage[hop]!) instanceof AssembledList || isMultiple(chain.slots[hop]!);
	const rest = chain.storage.some((_, hop) => consumesList(hop));
	const wrapped = (from: number, seed: string, listed: boolean): string => {
		let expr = seed;
		let list = listed;
		for (let hop = chain.storage.length - 1; hop >= from; hop--) {
			const make = builder(chain.storage[hop]!);
			if (consumesList(hop)) {
				expr = `(${make} as unknown as (...items: never[]) => never)(...${expr})`;
				list = false;
			} else {
				expr = list ? `${expr}.map((item) => ${make}(item as never))` : `${make}(${expr})`;
			}
		}
		return expr;
	};
	const filled = wrapped(0, 'v', rest);
	const arrow = (body: string): string => `(v: ${rest ? 'readonly never[]' : 'never'}) => ${body}`;
	if (!rest) return arrow(filled);
	if (holderOptional) return arrow(`v.length === 0 ? undefined : ${filled}`);
	const optional = chain.slots.findIndex((slot) => !isRequired(slot));
	if (optional < 0) return arrow(filled);
	const emptied = chain.storage.slice(0, optional).reduceRight((expr, kind) => `${builder(kind)}(${expr})`, `${builder(chain.storage[optional]!)}()`);
	return arrow(`v.length === 0 ? ${emptied} : ${filled}`);
}
