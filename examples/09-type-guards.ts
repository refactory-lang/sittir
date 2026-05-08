import { createEngine, is, wrap } from '@sittir/rust';

export function summarizeTopLevelItems(source: string) {
	const engine = createEngine();
	const tree = engine.parseAndRead(source);
	const summaries: string[] = [];

	for (const stmt of tree.$children) {
		if (is.functionItem(stmt)) {
			summaries.push(`Function: ${wrap(stmt, tree).name()}`);
		} else if (is.structItem(stmt)) {
			summaries.push(`Struct: ${wrap(stmt, tree).name()}`);
		}
	}

	return summaries;
}
