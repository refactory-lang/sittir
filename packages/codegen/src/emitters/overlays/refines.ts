import type { NodeMap } from '../../compiler/types.ts';
import { AssembledList, type AssembledNode } from '../../compiler/model/node-map.ts';
import { bundleKeyedNodes } from '../../compiler/model/ir-surface.ts';
import { isSlotBearingCompound } from '../shared.ts';
import { collectRefineKindInfos, refineFormFactoryName } from '../refine-emit.ts';
import { lowerCamelCase } from '../../compiler/model/casing.ts';
import { moduleRef, type Member } from './module.ts';

export interface RefinedEntry {
	readonly node: AssembledNode;
	readonly members: readonly Member[];
}

export function refinedEntries(nodeMap: NodeMap): ReadonlyMap<string, RefinedEntry> {
	const keyByKind = new Map(bundleKeyedNodes(nodeMap).map((e) => [e.node.kind, e.exportName]));
	const out = new Map<string, RefinedEntry>();
	for (const info of collectRefineKindInfos(nodeMap) ?? []) {
		const node = info.node;
		if (!isSlotBearingCompound(node) || node instanceof AssembledList || !node.rawFactoryName) continue;
		const key = keyByKind.get(node.kind);
		if (key === undefined) continue;
		const members: Member[] = [];
		for (const form of info.forms) {
			const ref = moduleRef('F', refineFormFactoryName(node.rawFactoryName, form.name));
			const keys = [lowerCamelCase(form.name)];
			if (keys[0] !== form.name) keys.push(form.name);
			for (const formKey of keys) members.push({ key: formKey, ref });
		}
		out.set(key, { node, members });
	}
	return out;
}
