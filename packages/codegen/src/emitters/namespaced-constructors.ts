import type { NodeMap } from '../compiler/types.ts';
import {
	AbstractAssembledCompound,
	AssembledList,
	isNodeRef,
	isMultiple,
	isRequired,
	isTerminalValue,
	storageKindOfRef,
	type AssembledNode,
	type AssembledNonterminal
} from '../compiler/model/node-map.ts';
import {
	isSlotBearingCompound,
	isTextLeaf,
	isValidIdent,
	slotKindNames,
	slotLiteralValues,
	userSlotsOf
} from './shared.ts';
import { camelCase } from './refine-emit.ts';
import { prefixNamedSuffix } from '../compiler/variant-structural.ts';
import { hasCatalogEntry, type KindEnumEntry } from './kind-discriminant.ts';

export interface FormConstructor {
	readonly via: 'form';
	readonly name: string;
	readonly slot: AssembledNonterminal;
	readonly childKind: string;
	readonly childFactory: string;
	readonly path: readonly string[];
	readonly formKind: string;
}

export interface MemberConstructor {
	readonly via: 'member';
	readonly name: string;
	readonly slot: AssembledNonterminal;
	readonly literal: string;
	readonly params: readonly AssembledNonterminal[];
}

export type NamespacedConstructor = FormConstructor | MemberConstructor;

export interface NamespacedAmbiguity {
	readonly name: string;
	readonly claimants: readonly string[];
	readonly kept?: string;
}

export interface NamespacedConstructorSet {
	readonly entries: readonly NamespacedConstructor[];
	readonly ambiguous: readonly NamespacedAmbiguity[];
}

export interface NamespacedConstructorOptions {
	readonly isEmitted?: (kind: string) => boolean;
}

const EMPTY: NamespacedConstructorSet = { entries: [], ambiguous: [] };

function isArmOf(kind: string, parentKind: string, nodeMap: NodeMap): boolean {
	const n = nodeMap.nodes.get(kind);
	if (n instanceof AbstractAssembledCompound && n.hoisted && n.parentKind === parentKind) return true;
	return kind !== parentKind && prefixNamedSuffix(parentKind, kind) !== null;
}

export function isFormSlot(slot: AssembledNonterminal, parentKind: string, nodeMap: NodeMap): boolean {
	const refs = slot.values.filter(isNodeRef);
	return (
		refs.length > 0 &&
		refs.length === slot.values.length &&
		refs.every((v) => isArmOf(storageKindOfRef(v.node), parentKind, nodeMap))
	);
}

function isKindEnumSlot(slot: AssembledNonterminal): boolean {
	return (
		slot.values.length >= 2 &&
		slot.values.every(isTerminalValue) &&
		!isMultiple(slot) &&
		new Set(slotLiteralValues(slot)).size === slot.values.length
	);
}

function formName(parentKind: string, child: AssembledNode): string {
	if (child instanceof AbstractAssembledCompound && child.hoisted && child.parentKind === parentKind) return camelCase(child.name);
	return camelCase(prefixNamedSuffix(parentKind, child.kind) ?? child.kind.replace(/^_+/, ''));
}

function memberName(v: { value: string; resolvedKind?: string }): string | undefined {
	if (isValidIdent(v.value)) return v.value;
	return v.resolvedKind === undefined ? undefined : camelCase(v.resolvedKind);
}

const cache = new WeakMap<NodeMap, Map<string, NamespacedConstructorSet>>();

export function namespacedConstructors(
	node: AssembledNode,
	nodeMap: NodeMap,
	options: NamespacedConstructorOptions = {},
	visiting: ReadonlySet<string> = new Set()
): NamespacedConstructorSet {
	let perMap = cache.get(nodeMap);
	if (perMap === undefined) {
		perMap = new Map();
		cache.set(nodeMap, perMap);
	}
	const cached = perMap.get(node.kind);
	if (cached !== undefined) return cached;
	const result = derive(node, nodeMap, options, visiting);
	if (visiting.size === 0) perMap.set(node.kind, result);
	return result;
}

function derive(
	node: AssembledNode,
	nodeMap: NodeMap,
	options: NamespacedConstructorOptions,
	visiting: ReadonlySet<string>
): NamespacedConstructorSet {
	if (!isSlotBearingCompound(node) || node instanceof AssembledList) return EMPTY;
	if (!node.rawFactoryName || nodeMap.refineForms?.has(node.kind)) return EMPTY;
	const isEmitted = options.isEmitted ?? (() => true);
	const user = userSlotsOf(node, nodeMap);
	const candidates: { readonly entry: NamespacedConstructor; readonly claimant: string }[] = [];

	const formSlot =
		user.length === 1
			? user[0]!
			: user.find((f) => isFormSlot(f, node.kind, nodeMap) && user.every((g) => g === f || !isRequired(g)));
	if (formSlot !== undefined) {
		const slot = formSlot;
		const kinds = slotKindNames(slot);
		const formable: { readonly child: AssembledNode; readonly factory: string }[] = [];
		for (const kind of kinds) {
			const child = nodeMap.nodes.get(kind);
			if (child === undefined || child.rawFactoryName === undefined || !isEmitted(kind)) continue;
			if (!isSlotBearingCompound(child) && !isTextLeaf(child)) continue;
			formable.push({ child, factory: child.rawFactoryName });
		}
		const forwarded = user.length === 1 && kinds.length === 1;
		const concrete = !isMultiple(slot) && slotLiteralValues(slot).length === 0 && formable.length > 0;
		if (concrete) {
			const nextVisiting = new Set([...visiting, node.kind]);
			for (const { child, factory: childFactory } of formable) {
				if (!forwarded) {
					const name = formName(node.kind, child);
					candidates.push({
						entry: { via: 'form', name, slot, childKind: child.kind, childFactory, path: [], formKind: child.kind },
						claimant: child.kind
					});
				}
				if (nextVisiting.has(child.kind)) continue;
				for (const sub of namespacedConstructors(child, nodeMap, options, nextVisiting).entries) {
					const origin = sub.via === 'form' ? nodeMap.nodes.get(sub.formKind) : undefined;
					const name = origin === undefined ? sub.name : formName(node.kind, origin);
					candidates.push({
						entry: {
							via: 'form',
							name,
							slot,
							childKind: child.kind,
							childFactory,
							path: [sub.name],
							formKind: sub.via === 'form' ? sub.formKind : child.kind
						},
						claimant: `${child.kind}.${sub.name}`
					});
				}
			}
		}
	}

	const enumSlots = user.filter(isKindEnumSlot);
	if (enumSlots.length === 1) {
		const slot = enumSlots[0]!;
		const params = user.filter((f) => f !== slot && !isFormSlot(f, node.kind, nodeMap));
		for (const v of slot.values) {
			if (!isTerminalValue(v)) continue;
			const name = memberName(v);
			if (name === undefined) continue;
			candidates.push({ entry: { via: 'member', name, slot, literal: v.value, params }, claimant: `'${v.value}'` });
		}
	}

	const byName = new Map<string, typeof candidates>();
	for (const c of candidates) {
		const list = byName.get(c.entry.name);
		if (list === undefined) byName.set(c.entry.name, [c]);
		else list.push(c);
	}
	const entries: NamespacedConstructor[] = [];
	const ambiguous: NamespacedAmbiguity[] = [];
	for (const [name, list] of byName) {
		if (list.length === 1) {
			entries.push(list[0]!.entry);
			continue;
		}
		const direct = list.filter((c) => c.entry.via !== 'form' || c.entry.path.length === 0);
		const claimants = list.map((c) => c.claimant);
		if (direct.length === 1) {
			entries.push(direct[0]!.entry);
			ambiguous.push({ name, claimants, kept: direct[0]!.claimant });
		} else {
			ambiguous.push({ name, claimants });
		}
	}
	return { entries, ambiguous };
}

export function emittedByCatalog(kindEntries: readonly KindEnumEntry[] | undefined): (kind: string) => boolean {
	return (kind) => !kindEntries || hasCatalogEntry(kindEntries, kind);
}
