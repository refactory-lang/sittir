import type { AnyUntypedNode } from '@sittir/types';
import { loadIsLeafKind, loadSlotAccessorOf, loadNativeEngine, readNodeOf, materializeDetached, parseNativeTree, kindViewOf, fixtureReplayOf } from '../../common.ts';
import { selfContainedRenderInput } from '../../read-render-parse.ts';

export async function detachedRenderer(grammar: string): Promise<(source: string) => string> {
	const engine = await loadNativeEngine(grammar);
	const readNode = await readNodeOf(grammar);
	const isLeafKind = await loadIsLeafKind(grammar);
	const accessorOf = await loadSlotAccessorOf(grammar);
	const replay = await fixtureReplayOf(grammar);
	return (source) => {
		const tree = parseNativeTree(engine, source);
		const data = materializeDetached(readNode(tree), accessorOf);
		return replay(selfContainedRenderInput(data, source, isLeafKind, kindViewOf(engine)) as AnyUntypedNode, source);
	};
}
