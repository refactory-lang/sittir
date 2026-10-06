import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const engine = await createEngine(rust);

/**
 * Renames the function `process` to `handle` with `$with`, which replaces one
 * slot. The edited node writes its own separators; every child the edit did
 * not touch renders the bytes it was read from.
 */
export function renameProcess(source: string) {
	const processFn = engine
		.parse(source)
		.statements()
		.find((statement) => engine.is.functionItem(statement) && engine.render(statement.name()).toString() === 'process');
	if (processFn === undefined || !engine.is.functionItem(processFn)) return undefined;

	return processFn.$with.name(engine.build.identifier('handle'));
}
