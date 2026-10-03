import type { AnyUntypedNode } from '@sittir/types';
import { readDerivedSides, readTrivia } from '@sittir/common/utils';
import { loadIsLeafKind, loadNativeEngine, readNodeOf, materializeDetached, readNativeTree } from '../../common.ts';
import { selfContainedRenderInput } from '../../read-render-parse.ts';

export async function detachedRenderer(grammar: string): Promise<(source: string) => string> {
	const engine = await loadNativeEngine(grammar);
	const readNode = await readNodeOf(grammar);
	const isLeafKind = await loadIsLeafKind(grammar);
	if (readNode === null) throw new Error(`no readNode for ${grammar}`);
	return (source) => {
		const data = materializeDetached(readNode(readNativeTree(engine, source).tree));
		return engine.render(selfContainedRenderInput(data, source, isLeafKind, {
			trivia: (node) => readTrivia(node, engine.diagnostics.lineGapsOf),
			derived: (node) => readDerivedSides(node, engine.diagnostics.lineGapsOf)
		}) as AnyUntypedNode).toString();
	};
}
