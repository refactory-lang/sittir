/**
 * Namespaced constructors — the derivation behind `buildX.form(...)` /
 * `buildX.member(...)` on a factory.
 *
 * A parent whose sole user slot is a choice of concrete kinds carries one
 * constructor per choice member (a FORM constructor: the parent built with
 * its slot holding the form, named by the form's own name). A parent whose
 * single kind-enum slot discriminates it carries one constructor per enum
 * member (a MEMBER constructor: the slot fixed to that literal, the other
 * user slots as parameters in slot order). A form's own constructors hoist
 * into the parent's namespace (`forHeader.let` from the let/const form's
 * enum), recursively, so a caller never names an intermediate kind. Two
 * claimants of one name cancel each other out (`ambiguous`) — never
 * first-wins.
 *
 * Pure derivation over the assembled model: the factory, ir, node-model and
 * test emitters all consume it, so the surface has one source.
 */

import type { NodeMap } from '../compiler/types.ts';
import {
	AssembledGroup,
	isNodeRef,
	isMultiple,
	isRequired,
	isTerminalValue,
	storageKindOfRef,
	type AssembledNode,
	type AssembledNonterminal
} from '../compiler/model/node-map.ts';
import { isSlotBearingCompound, isValidIdent, slotKindNames, slotLiteralValues, userSlotsOf } from './shared.ts';
import { camelCase } from './refine-emit.ts';
import { prefixNamedSuffix } from '../compiler/variant-structural.ts';
import { hasCatalogEntry, type KindEnumEntry } from './kind-discriminant.ts';

export interface FormConstructor {
	readonly via: 'form';
	readonly name: string;
	/** The parent slot the built form fills. */
	readonly slot: AssembledNonterminal;
	readonly childKind: string;
	readonly childFactory: string;
	/** Empty: call the child's factory. One name: call that namespaced
	 *  constructor on the child's factory (a hoisted sub-constructor). */
	readonly path: readonly string[];
}

export interface MemberConstructor {
	readonly via: 'member';
	readonly name: string;
	/** The kind-enum slot this constructor fixes. */
	readonly slot: AssembledNonterminal;
	readonly literal: string;
	/** Remaining user slots, in slot order — the constructor's parameters. */
	readonly params: readonly AssembledNonterminal[];
}

export type NamespacedConstructor = FormConstructor | MemberConstructor;

export interface NamespacedConstructorSet {
	readonly entries: readonly NamespacedConstructor[];
	/** Names claimed by more than one candidate — none of them is emitted. */
	readonly ambiguous: readonly { readonly name: string; readonly claimants: readonly string[] }[];
}

export interface NamespacedConstructorOptions {
	/** Whether a kind's factory is actually emitted (catalog-backed). A
	 *  child without an emitted factory cannot be constructed through the
	 *  parent. Defaults to every kind. */
	readonly isEmitted?: (kind: string) => boolean;
}

const EMPTY: NamespacedConstructorSet = { entries: [], ambiguous: [] };

/** Whether `kind` is one of `parentKind`'s own arms: a registered polymorph
 *  form, or a kind minted under the parent's name (`_<parent>_<arm>`). */
function isArmOf(kind: string, parentKind: string, nodeMap: NodeMap): boolean {
	const n = nodeMap.nodes.get(kind);
	if (n instanceof AssembledGroup && n.parentKind === parentKind) return true;
	return kind !== parentKind && prefixNamedSuffix(parentKind, kind) !== null;
}

/** A slot holding only the parent's own arms — an alternative to the
 *  parent's other slots, never a parameter beside them. */
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
	if (child instanceof AssembledGroup && child.parentKind === parentKind) return camelCase(child.name);
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
	// A cycle-cut result (some form skipped because it was being visited)
	// is not the node's full namespace — only top-level derivations cache.
	if (visiting.size === 0) perMap.set(node.kind, result);
	return result;
}

function derive(
	node: AssembledNode,
	nodeMap: NodeMap,
	options: NamespacedConstructorOptions,
	visiting: ReadonlySet<string>
): NamespacedConstructorSet {
	if (!isSlotBearingCompound(node) || node.modelType === 'separatedList') return EMPTY;
	if (!node.rawFactoryName || nodeMap.refineForms?.has(node.kind)) return EMPTY;
	const isEmitted = options.isEmitted ?? (() => true);
	const user = userSlotsOf(node, nodeMap);
	const candidates: { readonly entry: NamespacedConstructor; readonly claimant: string }[] = [];

	// Form constructors: a singular choice of ≥2 concrete kinds, each with
	// its own factory — either the sole user slot, or a slot of the parent's
	// own polymorph arms beside siblings that are all optional (the arm is a
	// complete alternative: the parent builds from it alone).
	const formSlot =
		user.length === 1
			? user[0]!
			: user.find((f) => isFormSlot(f, node.kind, nodeMap) && user.every((g) => g === f || !isRequired(g)));
	if (formSlot !== undefined) {
		const slot = formSlot;
		const kinds = slotKindNames(slot);
		const children = kinds.map((k) => nodeMap.nodes.get(k));
		// A sole slot with one kind is the forwarded shape (the parent already
		// IS that kind's surface); a lone arm beside optional siblings is a
		// genuine alternative and gets its constructor.
		const minKinds = user.length === 1 ? 2 : 1;
		// An arm is form-capable when its factory exists: a slot-bearing
		// compound (its own config surface) or a keyword leaf (a
		// parameterless fixed-text factory, e.g. visibility_modifier's
		// `crate` arm beside its `pub` branch arm).
		const concrete =
			!isMultiple(slot) &&
			slotLiteralValues(slot).length === 0 &&
			kinds.length >= minKinds &&
			children.every(
				(c) =>
					c !== undefined &&
					(isSlotBearingCompound(c) || c.modelType === 'keyword') &&
					c.rawFactoryName !== undefined &&
					isEmitted(c.kind)
			);
		if (concrete) {
			const nextVisiting = new Set([...visiting, node.kind]);
			for (const child of children as AssembledNode[]) {
				const name = formName(node.kind, child);
				const childFactory = child.rawFactoryName!;
				candidates.push({
					entry: { via: 'form', name, slot, childKind: child.kind, childFactory, path: [] },
					claimant: child.kind
				});
				if (nextVisiting.has(child.kind)) continue;
				// Sub-constructors flatten upward, recursively: the child's
				// namespace is already flat, so one level suffices.
				for (const sub of namespacedConstructors(child, nodeMap, options, nextVisiting).entries) {
					candidates.push({
						entry: { via: 'form', name: sub.name, slot, childKind: child.kind, childFactory, path: [sub.name] },
						claimant: `${child.kind}.${sub.name}`
					});
				}
			}
		}
	}

	// Member constructors: exactly one kind-enum slot discriminates the
	// kind; form slots (alternative arms with their own constructors above)
	// are not parameters.
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
	const ambiguous: { name: string; claimants: string[] }[] = [];
	for (const [name, list] of byName) {
		if (list.length === 1) entries.push(list[0]!.entry);
		else ambiguous.push({ name, claimants: list.map((c) => c.claimant) });
	}
	return { entries, ambiguous };
}

/** The factory-emission predicate every consumer shares: a kind's factory
 *  exists iff the kind is catalog-backed (or no catalog is in play). */
export function emittedByCatalog(kindEntries: readonly KindEnumEntry[] | undefined): (kind: string) => boolean {
	return (kind) => !kindEntries || hasCatalogEntry(kindEntries, kind);
}
