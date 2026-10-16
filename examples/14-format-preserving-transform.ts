import rust from '@sittir/rust';

const rs = await rust.createEngine();

/**
 * Renames the function `process` to `handle` with `$with`, which replaces one
 * slot. The edited node writes its own separators; every child the edit did
 * not touch renders the bytes it was read from.
 */
export function renameProcess(source: string) {
	const processFn = rs
		.parse(source)
		.statements()
		.find((statement) => rs.is.functionItem(statement) && rs.render(statement.name()).toString() === 'process');
	if (processFn === undefined || !rs.is.functionItem(processFn)) return undefined;

	return processFn.$with.name(rs.build.identifier('handle'));
}
