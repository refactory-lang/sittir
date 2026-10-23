import type { BuiltArena } from './built-arena.ts';
import type {
	AnyUntypedNode,
	EngineIdentity,
	LanguageAPI,
	LanguageHooks,
	NodeStorage,
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
	/** The arena an engine's record builders write into. */
	builtArena?: BuiltArena;
	/** The record builder module the engine's builders dispatch to; without one they build objects. */
	records?: object;
	readonly settle: <T>(node: T) => T;
	/** Checks the values a builder of `kind` stores before it writes them as a record, for an engine verifying structure at run time. */
	readonly verifyStored?: (kind: number, stored: Readonly<Record<string, unknown>>) => void;
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

export function foreignEngine(value: unknown, identity: EngineIdentity): EngineHandle['current'] | undefined {
	const stamp = engineOf(value);
	return stamp !== undefined && !sameLanguage(stamp, identity) ? stamp : undefined;
}

const engineStorages = new WeakMap<object, NodeStorage>();

/** Records how `engine`, a live engine or its identity, stores its nodes, which admission compares. */
export function stampEngineStorage(engine: object, storage: NodeStorage): void {
	engineStorages.set(engine, storage);
}

export function admitChildren(handle: EngineHandle, kind: string, slots: Readonly<Record<string, unknown>>): void {
	const ours = engineStorages.get(handle.current);
	for (const [slot, value] of Object.entries(slots)) {
		for (const child of Array.isArray(value) ? value : [value]) {
			const engine = engineOf(child);
			if (engine === undefined) continue;
			if (!sameLanguage(engine, handle.current)) {
				throw new Error(`cannot build a ${handle.current.language.name} ${kind} with a ${engine.language.name} node in its ${slot}`);
			}
			const theirs = engineStorages.get(engine);
			if (ours !== undefined && theirs !== undefined && theirs !== ours) {
				throw new Error(`cannot build a ${kind} with a node of an engine storing nodes as ${theirs} in its ${slot}; this engine stores them as ${ours}`);
			}
		}
	}
}

export function admitSlot<T>(handle: EngineHandle | undefined, kind: string, slot: string, value: T): T {
	if (handle !== undefined) admitChildren(handle, kind, { [slot]: value });
	return value;
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

/** A builder that calls the builder `pick` returns on each call: what a language's `raw.ts` exports, so the engine in scope decides which backend builds. */
export function dispatched<F extends (...args: never[]) => unknown>(pick: () => F): F {
	return function (this: unknown, ...args: unknown[]): unknown {
		return Reflect.apply(pick(), this, args);
	} as unknown as F;
}

/** The record builder module of the engine in scope, `undefined` when it builds objects. */
export function recordBuilders<T extends object>(): T | undefined {
	return currentHandle()?.records as T | undefined;
}

/**
 * The built arena of `handle`, the one a record builder writes into.
 *
 * @throws When no engine with record construction is in scope.
 */
export function builtArenaOf(handle: EngineHandle | undefined): BuiltArena {
	const arena = handle?.builtArena;
	if (arena === undefined) throw new Error('a record builder runs only in an engine that builds records');
	return arena;
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
