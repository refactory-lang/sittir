import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';
import { nodeText, renderText } from './helpers.ts';

const engine = await createEngine(rust);

export function summarizeTopLevelItems(source: string) {
	const file = engine.parse(source);
	const summaries: string[] = [];

	for (const stmt of file.statements()) {
		if (engine.is.functionItem(stmt)) {
			summaries.push(`Function: ${nodeText(stmt.name())}`);
		} else if (engine.is.structItem(stmt)) {
			summaries.push(`Struct: ${renderText(stmt.name())}`);
		}
	}

	return summaries;
}
