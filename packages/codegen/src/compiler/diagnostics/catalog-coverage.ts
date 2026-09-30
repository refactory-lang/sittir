import type { NodeMap } from '../types.ts';
import { isTerminalRootRule, tokenBodyKey } from '../../dsl/rule-transforms.ts';
import type { GeneratedKindEntry } from '../../dsl/symbol-table.ts';
import type { AnyRule } from '../../types/rule.ts';
import { AbstractAssembledCompound, AssembledSupertype, isNodeRef, isUnresolvedRef } from '../model/node-map.ts';

export interface CatalogCoverageSite {
	readonly ownerKind: string;
	readonly slot: string;
	readonly arm: string;
}

export interface CatalogCoverage {
	readonly unresolvedArms: readonly CatalogCoverageSite[];
	readonly hiddenPublicArms: readonly CatalogCoverageSite[];
}

export function catalogCoverage(nodeMap: NodeMap): CatalogCoverage {
	const unresolved = new Map<string, CatalogCoverageSite>();
	const hiddenPublic = new Map<string, CatalogCoverageSite>();
	const record = (into: Map<string, CatalogCoverageSite>, site: CatalogCoverageSite): void => {
		into.set(`${site.ownerKind}\0${site.slot}\0${site.arm}`, site);
	};
	for (const [ownerKind, node] of nodeMap.nodes) {
		if (node instanceof AbstractAssembledCompound && node.lexedInterior) continue;
		for (const slot of node.slots) {
			for (const value of slot.values) {
				if (!isNodeRef(value)) {
					if (value.resolvedKindId === undefined) {
						record(unresolved, { ownerKind, slot: slot.name, arm: JSON.stringify(value.value ?? value.pattern) });
					}
					continue;
				}
				const target = value.node;
				if (isUnresolvedRef(target)) {
					record(unresolved, { ownerKind, slot: slot.name, arm: target.name });
					continue;
				}
				if (target instanceof AssembledSupertype) continue;
				if (value.storageKindId === undefined || !nodeMap.nodeByKindId.has(value.storageKindId)) {
					record(unresolved, { ownerKind, slot: slot.name, arm: target.kind });
				}
				if (target.kindEntry?.hidden === true && !target.surfaceHidden) {
					record(hiddenPublic, { ownerKind, slot: slot.name, arm: `${target.kind} as ${target.typeName}` });
				}
			}
		}
	}
	return { unresolvedArms: [...unresolved.values()], hiddenPublicArms: [...hiddenPublic.values()] };
}

export function auxTokenKinds(kindEntries: readonly GeneratedKindEntry[], rules: Readonly<Record<string, AnyRule>>): string[] {
	const owners = new Map<string, string[]>();
	for (const [name, rule] of Object.entries(rules)) {
		if (!isTerminalRootRule(rule)) continue;
		const key = tokenBodyKey(rule);
		owners.set(key, [...(owners.get(key) ?? []), name]);
	}
	const shared = new Set([...owners.values()].filter((names) => names.length > 1).map(([first]) => `${first}_token1`));
	return kindEntries
		.filter((entry) => entry.aux === true && entry.terminal === true && !shared.has(entry.kind))
		.map((entry) => entry.kind)
		.sort();
}
