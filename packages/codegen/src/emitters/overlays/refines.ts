import type { NodeMap } from '../../compiler/types.ts';
import { AssembledList } from '../../compiler/model/node-map.ts';
import { isSlotBearingCompound } from '../shared.ts';
import { camelCase, collectRefineKindInfos, refineFormFactoryName } from '../refine-emit.ts';
import { bundleEntries, overlayFrame, overlayImportPath } from './module.ts';

export function emitRefinesOverlay(config: { nodeMap: NodeMap }): string {
	const keyByKind = new Map(bundleEntries(config.nodeMap).map((e) => [e.node.kind, e.exportName]));
	const lines = overlayFrame(overlayImportPath(0), ["import * as F from '../raw.js';"]);
	for (const info of collectRefineKindInfos(config.nodeMap) ?? []) {
		const node = info.node;
		if (!isSlotBearingCompound(node) || node instanceof AssembledList || !node.rawFactoryName) continue;
		const key = keyByKind.get(node.kind);
		if (key === undefined) continue;
		lines.push(`export const ${key} = {`);
		lines.push(`	...B.${key},`);
		for (const form of info.forms) {
			const fn = `F.${refineFormFactoryName(node.rawFactoryName, form.name)}`;
			const keys = [camelCase(form.name)];
			if (keys[0] !== form.name) keys.push(form.name);
			for (const formKey of keys) {
				lines.push(
					`	${JSON.stringify(formKey) === `"${formKey}"` ? formKey : JSON.stringify(formKey)}: { strict: ${fn} },`
				);
			}
		}
		lines.push('};', '');
	}
	return lines.join('\n');
}
