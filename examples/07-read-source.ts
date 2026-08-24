import { createEngine, is, wrapNode } from '@sittir/rust';
import { nodeText, parseSource } from './helpers.ts';

export function readSource(source: string) {
	const engine = createEngine();
	return parseSource(engine, source).root;
}

export function readFirstFunction(source: string) {
	const engine = createEngine();
	const { root, tree } = parseSource(engine, source);
	const file = wrapNode(root, tree);
	const first = file.statements()[0];
	if (first === undefined || !is.functionItem(first)) return undefined;
	const fn = wrapNode(first, tree);

	return {
		name: nodeText(fn.name()),
		body: fn.body(),
	};
}

export function wrappedLazyAccess(source: string) {
	const engine = createEngine();
	const { root, tree } = parseSource(engine, source);
	const file = wrapNode(root, tree);
	const first = file.statements()[0];
	if (first === undefined || !is.functionItem(first)) return undefined;
	const fn = wrapNode(first, tree);

	return {
		name: nodeText(fn.name()),
		body: fn.body(),
		statements: fn.body().statements(),
	};
}
