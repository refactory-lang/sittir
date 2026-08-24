import { createEngine, is, isNode, wrapNode } from '@sittir/rust';
import { nodeText, parseSource, renderText } from './helpers.ts';

export function summarizeTopLevelItems(source: string) {
	const engine = createEngine();
	const { root, tree } = parseSource(engine, source);
	const file = wrapNode(root, tree);
	const summaries: string[] = [];

	for (const stmt of file.statements()) {
		if (isNode(stmt) && is.functionItem(stmt)) {
			const fn = wrapNode(stmt, tree);
			summaries.push(`Function: ${nodeText(fn.name())}`);
		} else if (isNode(stmt) && is.structItem(stmt)) {
			const item = wrapNode(stmt, tree);
			summaries.push(`Struct: ${renderText(item.name())}`);
		}
	}

	return summaries;
}
