import type { AnyNodeData } from '@sittir/types';
import { loadIsLeafKind, loadNativeEngine, loadReadTreeNode, materializeDetached, readNativeTree } from '../../common.ts';
import { selfContainedRenderInput } from '../../read-render-parse.ts';

export async function detachedRenderer(grammar: string): Promise<(source: string) => string> {
	const engine = await loadNativeEngine(grammar);
	const read = await loadReadTreeNode(grammar);
	const isLeafKind = await loadIsLeafKind(grammar);
	if (read === null) throw new Error(`no readTreeNode for ${grammar}`);
	return (source) => {
		const data = materializeDetached(read(readNativeTree(engine, source).tree));
		return engine.render(selfContainedRenderInput(data, source, isLeafKind) as AnyNodeData).toString();
	};
}
