import type { NodeMap } from '../../compiler/types.ts';
import {
	AssembledList,
	isNodeRef,
	isTerminalValue,
	isMultiple,
	storageKindOfRef,
	type AssembledNode,
	type AssembledNonterminal,
	type NodeOrTerminal,
	type TextValueStorage
} from '../../compiler/model/node-map.ts';
import {
	forwardedTargetKind,
	isSlotBearingCompound,
	isTextLeaf,
	isValidIdent,
	classifyFactoryShape,
	valueStorageOf
} from '../shared.ts';
import { camelCase } from '../refine-emit.ts';
import { prefixNamedSuffix } from '../../compiler/variant-structural.ts';

export interface ValueArm {
	readonly via: 'value';
	readonly storage: TextValueStorage;
}

export interface NodeArm {
	readonly via: 'node';
	readonly child: AssembledNode;
	readonly path: readonly string[];
	readonly leaf?: AssembledNode;
}

export interface SubFactory {
	readonly name: string;
	readonly slot: AssembledNonterminal;
	readonly residual: readonly AssembledNonterminal[];
	readonly arm: ValueArm | NodeArm;
}

export interface SubFactoryDiagnostic {
	readonly parent: string;
	readonly name: string;
	readonly reason: 'ambiguous' | 'slot-collision';
	readonly claimants: readonly string[];
}

export interface SubFactorySet {
	readonly entries: readonly SubFactory[];
	readonly diagnostics: readonly SubFactoryDiagnostic[];
}

type IsEmittedPredicate = (kind: string) => boolean;

interface SubFactoryOptions {
	readonly isEmitted?: IsEmittedPredicate;
}

const DEFAULT_IS_EMITTED: IsEmittedPredicate = () => true;

const EMPTY: SubFactorySet = { entries: [], diagnostics: [] };

export function choiceSlotOf(node: AssembledNode): AssembledNonterminal | undefined {
	if (!isSlotBearingCompound(node) || node instanceof AssembledList) return undefined;
	const choices = node.slots.filter((f) => f.values.length >= 2 && !isMultiple(f));
	return choices.length === 1 ? choices[0] : undefined;
}

function loneEnumChoiceSlot(node: AssembledNode): AssembledNonterminal | undefined {
	if (!isSlotBearingCompound(node) || node instanceof AssembledList) return undefined;
	const enums = node.slots.filter(
		(f) =>
			f.values.length >= 2 &&
			!isMultiple(f) &&
			f.storageInfo?.kind === 'kindEnum'
	);
	return enums.length === 1 ? enums[0] : undefined;
}

function textStorageOf(value: NodeOrTerminal, nodeMap: NodeMap): TextValueStorage | undefined {
	const storage = valueStorageOf(value, nodeMap);
	return storage !== undefined && storage.via !== 'node' ? storage : undefined;
}

function kindArmName(parentKind: string, child: AssembledNode): string {
	return camelCase(prefixNamedSuffix(parentKind, child.kind) ?? child.kind.replace(/^_+/, ''));
}

export function armName(parent: AssembledNode, value: NodeOrTerminal, nodeMap: NodeMap): string | undefined {
	if (isNodeRef(value)) {
		const child = nodeMap.nodes.get(storageKindOfRef(value.node));
		return child === undefined ? undefined : kindArmName(parent.kind, child);
	}
	if (isTerminalValue(value)) {
		if (isValidIdent(value.value)) return value.value;
		return value.resolvedKind === undefined ? undefined : camelCase(value.resolvedKind);
	}
	return undefined;
}

interface Candidate {
	readonly name: string;
	readonly entry: SubFactory;
	readonly claimant: string;
	readonly fallback?: string;
	readonly declaring?: boolean;
}

function armNaming(
	parent: AssembledNode,
	value: NodeOrTerminal,
	nodeMap: NodeMap
): { name: string; fallback: string; declaring: boolean } | undefined {
	const fallback = armName(parent, value, nodeMap);
	if (fallback === undefined) return undefined;
	const declared = value.variant === undefined ? undefined : camelCase(value.variant);
	return { name: declared ?? fallback, fallback, declaring: value.variantOf === parent.kind };
}

function isDirect(entry: SubFactory): boolean {
	return entry.arm.via !== 'node' || entry.arm.path.length === 0;
}

function claimantOf(entry: SubFactory): string {
	if (entry.arm.via === 'value') return `'${entry.arm.storage.text}'`;
	return [entry.arm.child.kind, ...entry.arm.path].join('.');
}

function derive(
	node: AssembledNode,
	nodeMap: NodeMap,
	isEmitted: IsEmittedPredicate,
	visiting: ReadonlySet<string>
): SubFactorySet {
	if (!isSlotBearingCompound(node) || node instanceof AssembledList) return EMPTY;
	if (node.rawFactoryName === undefined || nodeMap.refineForms?.has(node.kind)) return EMPTY;
	const nextVisiting = new Set([...visiting, node.kind]);
	const candidates: Candidate[] = [];
	let slot = choiceSlotOf(node);
	if (slot === undefined) {
		const targetKind = forwardedTargetKind(node, nodeMap);
		const forwardChild = targetKind === null ? undefined : nodeMap.nodes.get(targetKind);
		if (forwardChild === undefined || !isEmitted(forwardChild.kind) || visiting.has(forwardChild.kind)) {
			const enumSlot = loneEnumChoiceSlot(node);
			if (enumSlot === undefined) return EMPTY;
			slot = enumSlot;
		} else {
			slot = node.soleSlot!;
			const residual = node.slots.filter((f) => f !== slot);
			const inner = subFactoriesInternal(forwardChild, nodeMap, isEmitted, nextVisiting);
			for (const s of inner.entries) {
				const leaf = s.arm.via === 'node' ? (s.arm.leaf ?? s.arm.child) : undefined;
				const name = leaf === undefined ? s.name : kindArmName(node.kind, leaf);
				const arm: NodeArm = { via: 'node', child: forwardChild, path: [s.name], leaf };
				const entry: SubFactory = { name, slot, residual, arm };
				candidates.push({ name, entry, claimant: claimantOf(entry) });
			}
			return resolveCandidates(node, candidates, residual, nodeMap, isEmitted, nextVisiting);
		}
	}

	const residual = node.slots.filter((f) => f !== slot);

	for (const value of slot.values) {
		if (isTerminalValue(value)) {
			const name = armName(node, value, nodeMap);
			const storage = textStorageOf(value, nodeMap);
			if (name === undefined || storage === undefined) continue;
			const arm: ValueArm = { via: 'value', storage };
			const entry: SubFactory = { name, slot, residual, arm };
			candidates.push({ name, entry, claimant: claimantOf(entry) });
			continue;
		}
		if (!isNodeRef(value)) continue;
		const child = nodeMap.nodes.get(storageKindOfRef(value.node));
		if (child === undefined) continue;
		if (child.rawFactoryName === undefined) {
			const storage = textStorageOf(value, nodeMap);
			const naming = storage === undefined ? undefined : armNaming(node, value, nodeMap);
			if (storage === undefined || naming === undefined) continue;
			const arm: ValueArm = { via: 'value', storage };
			const entry: SubFactory = { name: naming.name, slot, residual, arm };
			candidates.push({ ...naming, entry, claimant: claimantOf(entry) });
			continue;
		}
		if (!isEmitted(child.kind)) continue;
		if (!isSlotBearingCompound(child) && !isTextLeaf(child)) continue;

		const naming = armNaming(node, value, nodeMap);
		if (naming !== undefined) {
			const arm: NodeArm = { via: 'node', child, path: [] };
			const entry: SubFactory = { name: naming.name, slot, residual, arm };
			candidates.push({ ...naming, entry, claimant: claimantOf(entry) });
		}

		if (nextVisiting.has(child.kind)) continue;
		const childSet = subFactoriesInternal(child, nodeMap, isEmitted, nextVisiting);
		for (const s of childSet.entries) {
			const leaf = s.arm.via === 'node' ? (s.arm.leaf ?? s.arm.child) : undefined;
			const flatName = leaf === undefined ? s.name : kindArmName(node.kind, leaf);
			const arm: NodeArm = { via: 'node', child, path: [s.name], leaf };
			const entry: SubFactory = { name: flatName, slot, residual, arm };
			candidates.push({ name: flatName, entry, claimant: claimantOf(entry) });
		}
	}

	return resolveCandidates(node, candidates, residual, nodeMap, isEmitted, nextVisiting);
}

function resolveCandidates(
	node: AssembledNode,
	candidates: Candidate[],
	residual: readonly AssembledNonterminal[],
	nodeMap: NodeMap,
	isEmitted: IsEmittedPredicate,
	nextVisiting: ReadonlySet<string>
): SubFactorySet {
	const claimCounts = new Map<string, number>();
	for (const c of candidates) claimCounts.set(c.name, (claimCounts.get(c.name) ?? 0) + 1);
	const deconflicted = candidates.map((c) =>
		(claimCounts.get(c.name) ?? 0) > 1 && c.declaring !== true && c.fallback !== undefined && c.fallback !== c.name
			? { ...c, name: c.fallback, entry: { ...c.entry, name: c.fallback } }
			: c
	);

	const byName = new Map<string, Candidate[]>();
	for (const c of deconflicted) {
		const list = byName.get(c.name);
		if (list === undefined) byName.set(c.name, [c]);
		else list.push(c);
	}

	const resolved: SubFactory[] = [];
	const diagnostics: SubFactoryDiagnostic[] = [];
	for (const [name, list] of byName) {
		if (list.length === 1) {
			resolved.push(list[0]!.entry);
			continue;
		}
		const direct = list.filter((c) => isDirect(c.entry));
		if (direct.length === 1) {
			resolved.push(direct[0]!.entry);
			continue;
		}
		diagnostics.push({
			parent: node.kind,
			name,
			reason: 'ambiguous',
			claimants: list.map((c) => c.claimant)
		});
	}

	const residualKeys = new Set(residual.map((f) => f.configKey));
	const entries: SubFactory[] = [];
	for (const entry of resolved) {
		const keys = armConfigKeys(entry, nodeMap, { isEmitted }, nextVisiting);
		const collides = keys.some((k) => residualKeys.has(k));
		if (collides) {
			diagnostics.push({
				parent: node.kind,
				name: entry.name,
				reason: 'slot-collision',
				claimants: [claimantOf(entry)]
			});
			continue;
		}
		entries.push(entry);
	}

	return { entries, diagnostics };
}

const cache = new WeakMap<NodeMap, WeakMap<IsEmittedPredicate, Map<string, SubFactorySet>>>();

const inProgress = new WeakMap<NodeMap, WeakMap<IsEmittedPredicate, Set<string>>>();

function subFactoriesInternal(
	node: AssembledNode,
	nodeMap: NodeMap,
	isEmitted: IsEmittedPredicate,
	visiting: ReadonlySet<string>
): SubFactorySet {
	let perMap = cache.get(nodeMap);
	if (perMap === undefined) {
		perMap = new WeakMap();
		cache.set(nodeMap, perMap);
	}
	let perPredicate = perMap.get(isEmitted);
	if (perPredicate === undefined) {
		perPredicate = new Map();
		perMap.set(isEmitted, perPredicate);
	}
	if (visiting.size === 0) {
		const cached = perPredicate.get(node.kind);
		if (cached !== undefined) return cached;
	}

	let inProgressPerMap = inProgress.get(nodeMap);
	if (inProgressPerMap === undefined) {
		inProgressPerMap = new WeakMap();
		inProgress.set(nodeMap, inProgressPerMap);
	}
	let inProgressKinds = inProgressPerMap.get(isEmitted);
	if (inProgressKinds === undefined) {
		inProgressKinds = new Set();
		inProgressPerMap.set(isEmitted, inProgressKinds);
	}
	if (inProgressKinds.has(node.kind)) return EMPTY;

	inProgressKinds.add(node.kind);
	const result = derive(node, nodeMap, isEmitted, visiting);
	inProgressKinds.delete(node.kind);

	if (visiting.size === 0) perPredicate.set(node.kind, result);
	return result;
}

export function subFactoriesOf(node: AssembledNode, nodeMap: NodeMap, opts: SubFactoryOptions = {}): SubFactorySet {
	return subFactoriesInternal(node, nodeMap, opts.isEmitted ?? DEFAULT_IS_EMITTED, new Set());
}

export function armIsConfigShaped(sub: SubFactory, nodeMap: NodeMap, opts: SubFactoryOptions = {}): boolean {
	const arm = sub.arm;
	if (arm.via === 'value') return false;
	if (arm.path.length === 0) return classifyFactoryShape(arm.child, nodeMap) === 'config';
	const nested = subFactoriesOf(arm.child, nodeMap, opts).entries.find((e) => e.name === arm.path[0]);
	if (nested === undefined || nested.arm.via === 'value') return false;
	return classifyFactoryShape(nested.arm.child, nodeMap) === 'config';
}

export function armConfigKeys(
	sub: SubFactory,
	nodeMap: NodeMap,
	opts: SubFactoryOptions = {},
	visiting: ReadonlySet<string> = new Set()
): readonly string[] {
	const arm = sub.arm;
	if (arm.via === 'value') return [];
	if (arm.path.length === 0) {
		if (!armIsConfigShaped(sub, nodeMap, opts)) return [];
		return isSlotBearingCompound(arm.child) ? arm.child.slots.map((f) => f.configKey) : [];
	}
	if (visiting.has(arm.child.kind)) return [];
	const nested = subFactoriesOf(arm.child, nodeMap, opts).entries.find((e) => e.name === arm.path[0]);
	if (nested === undefined) return [];
	const residualKeys = nested.residual.map((f) => f.configKey);
	const nextVisiting = new Set([...visiting, arm.child.kind]);
	if (nested.arm.via === 'value') return residualKeys;
	if (armIsConfigShaped(sub, nodeMap, opts)) {
		return [...residualKeys, ...armConfigKeys(nested, nodeMap, opts, nextVisiting)];
	}
	return [...residualKeys, nested.slot.configKey];
}
