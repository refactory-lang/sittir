import type { AnyUntypedNode } from '@sittir/types';
import { loadIsLeafKind, loadNativeEngine, loadSlotAccessorOf, readNodeOf, materializeDetached, readNativeTree, kindViewOf, nativeLanguageEngineOf } from '../../common.ts';
import { selfContainedRenderInput } from '../../read-render-parse.ts';

export async function detachedRenderer(grammar: string): Promise<(source: string) => string> {
	const engine = await loadNativeEngine(grammar);
	const readNode = await readNodeOf(grammar);
	const isLeafKind = await loadIsLeafKind(grammar);
	const accessorOf = await loadSlotAccessorOf(grammar);
	if (readNode === null) throw new Error(`no readNode for ${grammar}`);
	const native = await nativeLanguageEngineOf(grammar);
	return (source) => {
		const { tree } = readNativeTree(engine, source);
		const data = materializeDetached(readNode(tree), accessorOf);
		return native.render(selfContainedRenderInput(data, source, isLeafKind, kindViewOf(engine)) as AnyUntypedNode, tree.options).toString();
	};
}
