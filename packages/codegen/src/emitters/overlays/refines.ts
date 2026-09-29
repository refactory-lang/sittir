import type { NodeMap } from '../../compiler/types.ts';
import type { GeneratedIdTables } from '../../dsl/symbol-table.ts';
import { AssembledList } from '../../compiler/model/node-map.ts';
import { isSlotBearingCompound } from '../shared.ts';
import { collectRefineKindInfos, refineFormFactoryName } from '../refine-emit.ts';
import { refineFormBuiltTypeSurfaceOf } from '../factories.ts';
import { collectCatalogKinds, collectKindEntries } from '../kind-discriminant.ts';
import { lowerCamelCase } from '../../compiler/model/casing.ts';
import { bundleEntries, bundleExpr, overlayFrame, overlayImportPath } from './module.ts';

export function emitRefinesOverlay(config: { nodeMap: NodeMap; generatedIdTables?: GeneratedIdTables }): string {
	const kindEntries = config.generatedIdTables
		? collectKindEntries(collectCatalogKinds(config.generatedIdTables), config.nodeMap, config.generatedIdTables)
		: undefined;
	const keyByKind = new Map(bundleEntries(config.nodeMap).map((e) => [e.node.kind, e.exportName]));
	const lines: string[] = [];
	for (const info of collectRefineKindInfos(config.nodeMap) ?? []) {
		const node = info.node;
		if (!isSlotBearingCompound(node) || node instanceof AssembledList || !node.rawFactoryName) continue;
		const key = keyByKind.get(node.kind);
		if (key === undefined) continue;
		lines.push(`export const ${key} = Object.freeze({`);
		lines.push(`	...B.${key},`);
		for (const form of info.forms) {
			const fn = `F.${refineFormFactoryName(node.rawFactoryName, form.name)}`;
			const max = refineFormBuiltTypeSurfaceOf(node, form, info, config.nodeMap, kindEntries)?.maxArgs;
			const keys = [lowerCamelCase(form.name)];
			if (keys[0] !== form.name) keys.push(form.name);
			for (const formKey of keys) {
				lines.push(
					`	${JSON.stringify(formKey) === `"${formKey}"` ? formKey : JSON.stringify(formKey)}: ${bundleExpr(fn, undefined, `${key}.${formKey}`, max)},`
				);
			}
		}
		lines.push('});', '');
	}
	return [...overlayFrame(overlayImportPath(0), lines, ["import * as F from '../raw.js';", "import { bundle } from '@sittir/common/utils';"]), ...lines].join('\n');
}
