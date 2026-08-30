import type { NodeMap } from '../../compiler/types.ts';
import {
	AbstractAssembledCompound,
	AssembledList,
	isNodeRef,
	isTerminalValue,
	isMultiple,
	storageKindOfRef,
	type AssembledNode,
	type AssembledNonterminal,
	type NodeOrTerminal
} from '../../compiler/model/node-map.ts';
import { isSlotBearingCompound, isTextLeaf, isValidIdent, classifyFactoryShape } from '../shared.ts';
import { camelCase } from '../refine-emit.ts';
import { prefixNamedSuffix } from '../../compiler/variant-structural.ts';

export interface LiteralArm {
	readonly via: 'literal';
	readonly literal: string;
}

export interface KindArm {
	readonly via: 'kind';
	readonly child: AssembledNode;
	readonly path: readonly string[];
}

export interface SubFactory {
	readonly name: string;
	readonly slot: AssembledNonterminal;
	readonly residual: readonly AssembledNonterminal[];
	readonly arm: LiteralArm | KindArm;
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

interface SubFactoryOptions {
	readonly isEmitted?: (kind: string) => boolean;
}

const EMPTY: SubFactorySet = { entries: [], diagnostics: [] };

export function choiceSlotOf(node: AssembledNode): AssembledNonterminal | undefined {
	if (!isSlotBearingCompound(node) || node instanceof AssembledList) return undefined;
	const choices = node.fields.filter((f) => f.values.length >= 2 && !isMultiple(f));
	return choices.length === 1 ? choices[0] : undefined;
}

function kindArmName(parentKind: string, child: AssembledNode): string {
	if (child instanceof AbstractAssembledCompound && child.hoisted && child.parentKind === parentKind) {
		return camelCase(child.name);
	}
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
}

function isDirect(entry: SubFactory): boolean {
	return entry.arm.via !== 'kind' || entry.arm.path.length === 0;
}

function claimantOf(entry: SubFactory): string {
	return entry.arm.via === 'literal' ? `'${entry.arm.literal}'` : entry.arm.child.kind;
}

function derive(
	node: AssembledNode,
	nodeMap: NodeMap,
	opts: SubFactoryOptions,
	visiting: ReadonlySet<string>
): SubFactorySet {
	if (!isSlotBearingCompound(node) || node instanceof AssembledList) return EMPTY;
	if (node.rawFactoryName === undefined || nodeMap.refineForms?.has(node.kind)) return EMPTY;
	const slot = choiceSlotOf(node);
	if (slot === undefined) return EMPTY;

	const isEmitted = opts.isEmitted ?? (() => true);
	const residual = node.fields.filter((f) => f !== slot);
	const nextVisiting = new Set([...visiting, node.kind]);
	const candidates: Candidate[] = [];

	for (const value of slot.values) {
		if (isTerminalValue(value)) {
			const name = armName(node, value, nodeMap);
			if (name === undefined) continue;
			const arm: LiteralArm = { via: 'literal', literal: value.value };
			const entry: SubFactory = { name, slot, residual, arm };
			candidates.push({ name, entry, claimant: `'${value.value}'` });
			continue;
		}
		if (!isNodeRef(value)) continue;
		const child = nodeMap.nodes.get(storageKindOfRef(value.node));
		if (child === undefined || child.rawFactoryName === undefined || !isEmitted(child.kind)) continue;
		if (!isSlotBearingCompound(child) && !isTextLeaf(child)) continue;

		const name = armName(node, value, nodeMap);
		if (name !== undefined) {
			const arm: KindArm = { via: 'kind', child, path: [] };
			const entry: SubFactory = { name, slot, residual, arm };
			candidates.push({ name, entry, claimant: child.kind });
		}

		if (nextVisiting.has(child.kind)) continue;
		const childSet = subFactoriesInternal(child, nodeMap, opts, nextVisiting);
		for (const s of childSet.entries) {
			const flatName = s.arm.via === 'kind' ? kindArmName(node.kind, s.arm.child) : s.name;
			const path = s.arm.via === 'kind' ? [s.name, ...s.arm.path] : [s.name];
			const arm: KindArm = { via: 'kind', child, path };
			const entry: SubFactory = { name: flatName, slot, residual, arm };
			candidates.push({ name: flatName, entry, claimant: `${child.kind}.${s.name}` });
		}
	}

	const byName = new Map<string, Candidate[]>();
	for (const c of candidates) {
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
		const keys = armConfigKeys(entry, nodeMap);
		const collides = keys !== 'positional' && keys.some((k) => residualKeys.has(k));
		if (collides) {
			diagnostics.push({ parent: node.kind, name: entry.name, reason: 'slot-collision', claimants: [claimantOf(entry)] });
			continue;
		}
		entries.push(entry);
	}

	return { entries, diagnostics };
}

const cache = new WeakMap<NodeMap, Map<string, SubFactorySet>>();

function subFactoriesInternal(
	node: AssembledNode,
	nodeMap: NodeMap,
	opts: SubFactoryOptions,
	visiting: ReadonlySet<string>
): SubFactorySet {
	let perMap = cache.get(nodeMap);
	if (perMap === undefined) {
		perMap = new Map();
		cache.set(nodeMap, perMap);
	}
	const cached = perMap.get(node.kind);
	if (cached !== undefined) return cached;
	const result = derive(node, nodeMap, opts, visiting);
	if (visiting.size === 0) perMap.set(node.kind, result);
	return result;
}

export function subFactoriesOf(node: AssembledNode, nodeMap: NodeMap, opts: SubFactoryOptions = {}): SubFactorySet {
	return subFactoriesInternal(node, nodeMap, opts, new Set());
}

export function armConfigKeys(sub: SubFactory, nodeMap: NodeMap): readonly string[] | 'positional' {
	const arm = sub.arm;
	if (arm.via === 'literal') return 'positional';
	const shape = classifyFactoryShape(arm.child, nodeMap);
	if (shape === 'text' || shape === 'direct' || shape === 'forwarded' || shape === 'spread' || shape === 'elements') {
		return 'positional';
	}
	const childFields = isSlotBearingCompound(arm.child) ? arm.child.fields : [];
	if (arm.path.length === 0) {
		return childFields.map((f) => f.configKey);
	}
	const nested = subFactoriesOf(arm.child, nodeMap).entries.find((e) => e.name === arm.path[0]);
	if (nested === undefined) return [];
	const residualKeys = nested.residual.map((f) => f.configKey);
	const grandKeys = armConfigKeys(nested, nodeMap);
	return grandKeys === 'positional' ? residualKeys : [...residualKeys, ...grandKeys];
}
