import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const engine = await createEngine(rust);

export function readSource(source: string) {
	return engine.parse(source);
}

export function readFirstFunction(source: string) {
	const file = engine.parse(source);
	const first = file.statements()[0];
	if (first === undefined || !engine.is.functionItem(first)) return undefined;

	return {
		name: engine.render(first.name()).toString(),
		body: first.body(),
		statements: first.body().statements(),
	};
}
