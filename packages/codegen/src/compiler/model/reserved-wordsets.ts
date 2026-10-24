import type { NodeMap } from '../types.ts';
import { reservedWordsAdmittedIn } from '../../dsl/symbol-table.ts';
import type { KindEnumEntry } from '../../emitters/kind-discriminant.ts';
import { aliasPatternLeaf, expandAndDedupeContentTypes, slotAliases, slotKindNames, slotUnreservedAliases } from '../../emitters/shared.ts';
import { AssembledAlias, type AssembledNonterminal } from './node-map.ts';

export function holdsWord(slot: AssembledNonterminal, nodeMap: NodeMap): boolean {
	const word = nodeMap.word;
	if (!word) return false;
	return (
		expandAndDedupeContentTypes(slotKindNames(slot), nodeMap).includes(word) ||
		slotAliases(slot, nodeMap).some((alias) => aliasPatternLeaf(alias, nodeMap)?.kind === word)
	);
}

export function stampReservedWordsets(nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined): void {
	const placedUnder = new Map<string, Set<string>>();
	for (const node of nodeMap.nodes.values()) {
		if (node instanceof AssembledAlias) continue;
		for (const slot of node.slots) {
			for (const alias of slotAliases(slot, nodeMap)) {
				const ids = placedUnder.get(alias.kind) ?? new Set<string>();
				for (const id of slot.reservedWordsets) ids.add(id);
				placedUnder.set(alias.kind, ids);
			}
		}
	}
	const holderIds = new Set<string>();
	for (const node of nodeMap.nodes.values()) {
		const placed = node instanceof AssembledAlias ? placedUnder.get(node.kind) : undefined;
		for (const slot of node.slots) {
			slot.effectiveWordsets = placed === undefined ? slot.reservedWordsets : [...placed].sort();
			if (holdsWord(slot, nodeMap)) for (const id of slot.effectiveWordsets) holderIds.add(id);
		}
	}
	const leafIds = [...holderIds].sort();
	const relaxed = new Set(nodeMap.relaxedLiterals ?? []);
	nodeMap.wordLeafReserved = reservedWordsAdmittedIn(nodeMap.reserved, leafIds, kindEntries ?? []).filter((text) => !relaxed.has(text));
	for (const node of nodeMap.nodes.values()) {
		for (const slot of node.slots) {
			slot.checksReserved =
				slotUnreservedAliases(slot, nodeMap).length > 0 ||
				(holdsWord(slot, nodeMap) && [...slot.effectiveWordsets!].sort().join('\0') !== leafIds.join('\0'));
		}
	}
}
