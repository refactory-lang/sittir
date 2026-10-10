import type {
	AnyUntypedNode,
	EngineIdentity,
	LanguageAPI,
	LanguageHooks,
	LineGapAddress,
	LineGaps,
	Rendered
} from '@sittir/types';
import { assertHoldsTree, treeOf } from './tree-token.ts';
import { decodeTree, isCoordinate } from './read.ts';

export interface LiveEngine extends EngineIdentity {
	render(node: AnyUntypedNode | number, options?: object): Rendered;
	query(node: object): object;
}

export interface EngineHandle {
	current: LiveEngine | EngineIdentity;
	lineGapsOf?: (address: LineGapAddress) => LineGaps;
}

/** The handle a parsed tree is bound to (`bindTree`): the engine that read it, which hydrates the coordinates it names. */
export interface TreeEngineHandle extends EngineHandle {
	hydrate: LanguageHooks<LanguageAPI>['hydrate'];
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

const treeHandles = new WeakMap<object, TreeEngineHandle>();

export function bindTree(tree: object, handle: TreeEngineHandle): void {
	treeHandles.set(tree, handle);
}

export function hydrateStored(value: unknown): unknown {
	if (!isCoordinate(value)) return value;
	assertHoldsTree(value);
	const tree = treeOf(value);
	const handle = tree === undefined ? undefined : treeHandles.get(tree);
	if (tree === undefined || handle === undefined || !isLive(handle.current)) {
		throw new Error(
			`this coordinate names tree ${decodeTree(value.$treeHandle)}, which is no longer live: its engine was disposed or its tree released`
		);
	}
	const caller = currentHandle();
	if (caller !== undefined && !sameLanguage(caller.current, handle.current)) {
		throw new Error(`a ${handle.current.language.name} node read through a ${caller.current.language.name} engine`);
	}
	return handle.hydrate(value, tree);
}

export function inTreeEngine<T>(tree: object, fn: () => T): T {
	const handle = treeHandles.get(tree);
	return handle === undefined ? fn() : inEngine(handle, fn);
}
