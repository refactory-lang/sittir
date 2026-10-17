import rust from '@sittir/rust';

const rs = await rust.createEngine();

export function summarizeTopLevelItems(source: string) {
	const file = rs.parse(source);
	const summaries: string[] = [];

	for (const stmt of file.statements()) {
		if (rs.is.functionItem(stmt)) {
			summaries.push(`Function: ${rs.render(stmt.name())}`);
		} else if (rs.is.structItem(stmt)) {
			summaries.push(`Struct: ${rs.render(stmt.name())}`);
		}
	}

	return summaries;
}
