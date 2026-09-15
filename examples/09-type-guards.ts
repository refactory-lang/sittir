import { createEngine, is, isNode } from '@sittir/rust';
import { nodeText, renderText } from './helpers.ts';

export function summarizeTopLevelItems(source: string) {
	const engine = createEngine();
	const file = engine.parse(source);
	const summaries: string[] = [];

	for (const stmt of file.statements()) {
		if (isNode(stmt) && is.functionItem(stmt)) {
			summaries.push(`Function: ${nodeText(stmt.name())}`);
		} else if (isNode(stmt) && is.structItem(stmt)) {
			summaries.push(`Struct: ${renderText(stmt.name())}`);
		}
	}

	return summaries;
}
