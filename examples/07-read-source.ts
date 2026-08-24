import { createEngine, is } from '@sittir/rust';
import { nodeText } from './helpers.ts';

export function readSource(source: string) {
	const engine = createEngine();
	return engine.parse(source);
}

export function readFirstFunction(source: string) {
	const engine = createEngine();
	const file = engine.parse(source);
	const first = file.statements()[0];
	if (first === undefined || !is.functionItem(first)) return undefined;

	return {
		name: nodeText(first.name()),
		body: first.body(),
	};
}

export function wrappedLazyAccess(source: string) {
	const engine = createEngine();
	const file = engine.parse(source);
	const first = file.statements()[0];
	if (first === undefined || !is.functionItem(first)) return undefined;

	return {
		name: nodeText(first.name()),
		body: first.body(),
		statements: first.body().statements(),
	};
}
