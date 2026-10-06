import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const engine = await createEngine(rust);

export function summarizeTopLevelItems(source: string) {
	const file = engine.parse(source);
	const summaries: string[] = [];

	for (const stmt of file.statements()) {
		if (engine.is.functionItem(stmt)) {
			summaries.push(`Function: ${engine.render(stmt.name())}`);
		} else if (engine.is.structItem(stmt)) {
			summaries.push(`Struct: ${engine.render(stmt.name())}`);
		}
	}

	return summaries;
}
