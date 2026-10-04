import type { AnyUntypedNode, EngineIdentity, LineGapAddress, LineGaps, Rendered } from '@sittir/types';

export interface LiveEngine extends EngineIdentity {
	render(node: AnyUntypedNode | number, options?: object): Rendered;
	query(node: object): object;
}

export interface EngineHandle {
	current: LiveEngine | EngineIdentity;
	lineGapsOf?: (address: LineGapAddress) => LineGaps;
}

export function sameLanguage(a: EngineIdentity, b: EngineIdentity): boolean {
	return a.language === b.language;
}

export function engineOf(value: unknown): EngineHandle['current'] | undefined {
	if (typeof value !== 'object' || value === null) return undefined;
	const bound = (value as { readonly $engine?: unknown }).$engine;
	return typeof bound === 'function' ? bound() : undefined;
}

let active: EngineHandle | undefined;

export function inEngine<T>(handle: EngineHandle, fn: () => T): T {
	const previous = active;
	active = handle;
	try {
		return fn();
	} finally {
		active = previous;
	}
}

export function currentHandle(): EngineHandle | undefined {
	return active;
}

export function isLive(current: EngineHandle['current']): current is LiveEngine {
	return 'render' in current;
}

const treeHandles = new WeakMap<object, EngineHandle>();

export function bindTree(tree: object, handle: EngineHandle): void {
	treeHandles.set(tree, handle);
}

export function inTreeEngine<T>(tree: object, fn: () => T): T {
	const handle = treeHandles.get(tree);
	return handle === undefined ? fn() : inEngine(handle, fn);
}
