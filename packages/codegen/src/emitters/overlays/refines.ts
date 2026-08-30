import type { NodeMap } from '../../compiler/types.ts';
import { AssembledList } from '../../compiler/model/node-map.ts';
import { isSlotBearingCompound } from '../shared.ts';
import { camelCase, collectRefineKindInfos, refineFormFactoryName } from '../refine-emit.ts';
import { emitOverlayModule, overlayImportPath, type Attachment, type AttachedProp } from './module.ts';

export function refineAttachments(nodeMap: NodeMap): Attachment[] {
	const out: Attachment[] = [];
	for (const info of collectRefineKindInfos(nodeMap) ?? []) {
		const node = info.node;
		if (!isSlotBearingCompound(node) || node instanceof AssembledList || !node.rawFactoryName) continue;
		const props: AttachedProp[] = [];
		for (const form of info.forms) {
			const fn = `F.${refineFormFactoryName(node.rawFactoryName, form.name)}`;
			const keys = [camelCase(form.name)];
			if (keys[0] !== form.name) keys.push(form.name);
			for (const key of keys) props.push({ key, typeExpr: `typeof ${fn}`, valueExpr: fn });
		}
		out.push({ builder: node.rawFactoryName, props });
	}
	return out;
}

export function emitRefinesOverlay(config: { nodeMap: NodeMap }): string {
	return emitOverlayModule({ importPath: overlayImportPath(0), attachments: refineAttachments(config.nodeMap) });
}
