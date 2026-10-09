import type {
	AnyUntypedNode,
	EngineIdentity,
	LanguageAPI,
	LanguageHooks,
	LineGapAddress,
	LineGaps,
	Rendered
} from '@sittir/types';
import { treeOf } from './tree-token.ts';
import { isCoordinate } from './read.ts';

export interface LiveEngine extends EngineIdentity {
	render(node: AnyUntypedNode | number, options?: object): Rendered;
	query(node: object): object;
}

export interface EngineHandle {
	current: LiveEngine | EngineIdentity;
	lineGapsOf?: (address: LineGapAddress) => LineGaps;
	hydrate?: LanguageHooks<LanguageAPI>['hydrate'];
}

export function sameLanguage(a: EngineIdentity, b: EngineIdentity): boolean {
	return a.language === b.language;
}

export function engineOf(value: unknown): EngineHandle['current'] | undefined {
	if (typeof value !== 'object' || value === null) return undefined;
	const bound = (value as { readonly $engine?: unknown }).$engine;
	if (typeof bound === 'function') return bound();
	const tree = treeOf(value);
	return tree === undefined ? undefined : treeHandles.get(tree)?.current;
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

export function hydrateListStorage(value: unknown): unknown {
	if (!isCoordinate(value)) return value;
	const tree = treeOf(value);
	if (tree === undefined) return value;
	const handle = treeHandles.get(tree);
	if (handle === undefined || !isLive(handle.current)) return value;
	const caller = currentHandle();
	if (caller !== undefined && !sameLanguage(caller.current, handle.current)) return value;
	return handle.hydrate?.(value, tree) ?? value;
}

export function inTreeEngine<T>(tree: object, fn: () => T): T {
	const handle = treeHandles.get(tree);
	return handle === undefined ? fn() : inEngine(handle, fn);
}
