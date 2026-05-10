import { createEngine, ir, is, isNode, wrapNode } from '@sittir/rust';
import { isTypedNodeData, nodeText, parseSource, renderText } from './helpers.ts';

export function summarizeTopLevelItems(source: string) {
	const engine = createEngine();
	const { root, tree } = parseSource(engine, source);
	const summaries: string[] = [];

	for (const stmt of root.$children ?? []) {
		if (isTypedNodeData(stmt) && is.functionItem(stmt) && isNode(stmt)) {
			const fn = wrapNode(stmt, tree) as ReturnType<typeof ir.functionItem>;
			summaries.push(`Function: ${nodeText(fn.name())}`);
		} else if (isTypedNodeData(stmt) && is.structItem(stmt) && isNode(stmt)) {
			const item = wrapNode(stmt, tree) as ReturnType<typeof ir.structItem>;
			summaries.push(`Struct: ${renderText(item.name())}`);
		}
	}

	return summaries;
}
