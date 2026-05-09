import { createEngine, ir, is, wrapNode } from '@sittir/rust';
import { isTypedNodeData, nodeText, parseSource } from './helpers.ts';

export function readSource(source: string) {
	const engine = createEngine();
	return parseSource(engine, source).root;
}

export function readFirstFunction(source: string) {
	const engine = createEngine();
	const { root, tree } = parseSource(engine, source);
	const first = (root.$children ?? [])[0];
	if (!isTypedNodeData(first) || !is.functionItem(first)) return undefined;
	const fn = wrapNode(first, tree) as ReturnType<typeof ir.functionItem>;

	return {
		name: nodeText(fn.name()),
		body: fn.body(),
	};
}

export function wrappedLazyAccess(source: string) {
	const engine = createEngine();
	const { root, tree } = parseSource(engine, source);
	const first = (root.$children ?? [])[0];
	if (!isTypedNodeData(first) || !is.functionItem(first)) return undefined;
	const fn = wrapNode(first, tree) as ReturnType<typeof ir.functionItem>;

	return {
		name: nodeText(fn.name()),
		body: fn.body(),
		statements: fn.body().$children,
	};
}
