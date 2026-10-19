import type {
	AnyUntypedNode,
	ApiSurface,
	Engine,
	EngineIdentity,
	EngineOptions,
	Interceptor,
	ErrorNode,
	Language,
	LanguageAPI,
	LanguageIdentity,
	LanguageHooks,
	NativeEngineOptions,
	ParseOptions,
	PortableEngine,
	PortableEngineOptions,
	PortableLanguageAPI,
	Pending,
	Rendered,
	RenderArgument,
	CreateEngineOptions,
	StructureTable
} from '@sittir/types';
import { bindTree, engineOf, inEngine, sameLanguage, type EngineHandle, type TreeEngineHandle } from './engine-scope.ts';
import { guardsOf, inLanguage as inLanguageOf } from './language.ts';
import { metricsEnabled, recordFfi } from './metrics.ts';
import { verifyStructure } from './verify-structure.ts';
import { ParseErrors } from './parse-errors.ts';
import { queryFacet, type QueryHooks } from './query.ts';
import { createRenderHandle } from './engine.ts';
import { portable } from './portable/index.ts';
import { isEmptyNode as isEmptyUntypedNode, isErrorNode, isFactoryNode, isNode, isParsedNode, wrapRegistered } from './utils.ts';

type Middleware<Call, Result> = (call: Call, next: () => Result) => Result;

function interceptorChain<Call, Result>(
	hooks: readonly (Middleware<Call, Result> | undefined)[]
): ((call: Call, run: () => Result) => Result) | undefined {
	const active = hooks.filter((hook) => hook !== undefined);
	if (active.length === 0) return undefined;
	return (call, run) => {
		const invoke = (index: number): Result => {
			const hook = active[index];
			return hook === undefined ? run() : hook(call, () => invoke(index + 1));
		};
		return invoke(0);
	};
}

const loaded = new WeakMap<LanguageIdentity<LanguageAPI>, Promise<LanguageHooks<LanguageAPI>>>();

function loadLanguage<API extends LanguageAPI>(language: LanguageIdentity<API>): Promise<LanguageHooks<API>> {
	const cached = loaded.get(language);
	if (cached !== undefined) return cached as Promise<LanguageHooks<API>>;
	const loading = language.load().catch((cause: unknown) => {
		loaded.delete(language);
		throw new Error(`failed to load language "${language.name}"`, { cause });
	});
	loaded.set(language, loading);
	return loading;
}

function refuseUnimplemented(options: EngineOptions<LanguageAPI, ApiSurface> | undefined): void {
	const api = options?.api ?? 'default';
	if (api !== 'default') throw new Error(`api "${api}" is not implemented`);
}

function nativeEngineOptions<API extends LanguageAPI>(
	options: EngineOptions<API, ApiSurface> | undefined
): NativeEngineOptions<API['options']> {
	return options?.render === undefined ? {} : { options: options.render };
}

function unimplementedVerb(verb: 'read' | 'create' | 'write'): Error {
	return new Error(`file verb "${verb}" is not implemented`);
}

function refuseWrite(): never {
	throw new Error('the build table of an engine is read-only');
}

type BuildCall = Parameters<NonNullable<Interceptor<LanguageAPI>['build']>>[0];

function scopedBuild<B, Node>(
	build: B,
	handle: EngineHandle,
	intercept: ((call: BuildCall, next: () => Node) => Node) | undefined
): B {
	const proxies = new WeakMap<object, Map<string, unknown>>();
	const scope = (value: unknown, path: readonly string[]): unknown => {
		if (value === null || (typeof value !== 'function' && typeof value !== 'object')) return value;
		const key = intercept === undefined ? '' : JSON.stringify(path);
		const paths = proxies.get(value) ?? new Map<string, unknown>();
		const known = paths.get(key);
		if (known !== undefined) return known;
		const shell = typeof value === 'function' ? () => undefined : {};
		const proxy = new Proxy(shell, {
			get: (_, key, receiver) => {
				const member: unknown = Reflect.get(value, key, receiver);
				return Object.hasOwn(value, key) ? scope(member, [...path, String(key)]) : member;
			},
			has: (_, key) => Reflect.has(value, key),
			ownKeys: () => Reflect.ownKeys(value),
			getOwnPropertyDescriptor: (_, key) => {
				const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
				if (descriptor === undefined) return undefined;
				return 'value' in descriptor
					? { ...descriptor, value: scope(descriptor.value, [...path, String(key)]), configurable: true }
					: { ...descriptor, configurable: true };
			},
			getPrototypeOf: () => Reflect.getPrototypeOf(value),
			apply: (_, self, args) =>
				inEngine(handle, () => {
					if (typeof value !== 'function') throw new TypeError('builder is not callable');
					const run = (): Node => Reflect.apply(value, self, args);
					return handle.settle(intercept === undefined ? run() : intercept({ path, args }, run));
				}),
			set: refuseWrite,
			defineProperty: refuseWrite,
			deleteProperty: refuseWrite,
			setPrototypeOf: refuseWrite,
			preventExtensions: refuseWrite
		});
		paths.set(key, proxy);
		proxies.set(value, paths);
		return proxy;
	};
	return scope(build, []) as B;
}

function interceptedRender<Call>(
	call: Call,
	chain: Middleware<Call, string>,
	rendered: Rendered,
	materialize: () => string
): Rendered {
	const output = createRenderHandle(() => chain(call, materialize));
	return {
		...output,
		[Symbol.dispose]() {
			output[Symbol.dispose]();
			rendered[Symbol.dispose]();
		}
	};
}

const builderScopes = new WeakMap<object, <T extends object>(table: T) => T>();

export function scopeBuilders<T extends object>(engine: object, table: T): T {
	const scope = builderScopes.get(engine);
	if (scope === undefined) throw new Error('scopeBuilders: the engine was not made by createEngine');
	return scope(table);
}

function settlerOf(mode: EngineOptions<LanguageAPI>['verifyStructure'], table: StructureTable): EngineHandle['settle'] {
	if (mode !== 'runtime') return (node) => node;
	const seen = new WeakSet<object>();
	return (node) => {
		verifyStructure(node, table, seen);
		return node;
	};
}

function assembleEngine<API extends LanguageAPI>(
	language: Language<API>,
	hooks: LanguageHooks<API>,
	options: EngineOptions<API> | undefined
): Engine<API> {
	const native = hooks.createNative(nativeEngineOptions(options));
	const identity: EngineIdentity<API> = Object.freeze({
		language,
		renderModuleHash: hooks.renderModuleHash,
		options: options?.render,
		trivia: hooks.trivia,
		portable: hooks.portable
	});
	const handle: TreeEngineHandle = {
		current: identity,
		hydrate: hooks.hydrate,
		settle: settlerOf(options?.verifyStructure, hooks.structure)
	};
	const interceptors = options?.intercept ?? [];
	const buildChain = interceptorChain(interceptors.map((hook) => hook.build?.bind(hook)));
	const parseChain = interceptorChain(interceptors.map((hook) => hook.parse?.bind(hook)));
	const renderChain = interceptorChain(interceptors.map((hook) => hook.render?.bind(hook)));
	const build = scopedBuild(hooks.build, handle, buildChain);
	const materializeNative = (target: Parameters<typeof native.render>[0], rendered: Rendered): string => {
		if (!metricsEnabled) return rendered.toString();
		const kind =
			typeof target === 'number' ? String(target) : (hooks.trivia.kindName(target.$type) ?? String(target.$type));
		const before = performance.now();
		const text = rendered.toString();
		recordFfi(language.name, kind, JSON.stringify(target).length, performance.now() - before, text.length);
		return text;
	};
	const readAndBind = (source: string, parseOptions?: ParseOptions) => {
		const read = native.parseAndRead(source, parseOptions);
		bindTree(read.tree, handle);
		return read;
	};
	const inLanguage = inLanguageOf(language);
	const queryHooks: QueryHooks = {
		querySlots: hooks.querySlots,
		queryFlags: hooks.queryFlags ?? {},
		querySlotFlags: hooks.querySlotFlags ?? {},
		membership: hooks.membership,
		kindName: (kind) => hooks.trivia.kindName(kind),
		wrap: hooks.wrap
	};
	const engine: Engine<API> = {
		...identity,
		build,
		is: guardsOf(language),
		kinds: language.kinds,
		types: undefined as unknown as API['types'],
		diagnostics: {
			buildProfile: native.buildProfile,
			parseAndRead: readAndBind
		},
		isNode: (value): value is API['node'] => isNode(value) && inLanguage(value),
		isParsedNode: (value): value is API['node'] => isParsedNode(value) && inLanguage(value),
		isFactoryNode: (value): value is API['node'] => isFactoryNode(value) && inLanguage(value),
		isErrorNode: (value): value is ErrorNode => isErrorNode(value) && inLanguage(value),
		isEmptyNode: ((node: AnyUntypedNode): boolean => {
			const kind = hooks.trivia.kindName(node.$type);
			return (
				engine.isNode(node) &&
				kind !== undefined &&
				hooks.trivia.innerKinds.has(kind) &&
				isEmptyUntypedNode(node)
			);
		}) as Engine<API>['isEmptyNode'],
		parse(source, parseOptions) {
			const run = (): API['root'] => {
				const { root, tree } = readAndBind(source, parseOptions);
				if (parseOptions?.errors === 'throw' && root.$errors.length > 0) throw new ParseErrors(root.$errors);
				return wrapRegistered(root, tree, hooks.wrap);
			};
			return parseChain === undefined ? run() : parseChain({ source }, run);
		},
		query: ((node: object) => {
			if (handle.current !== engine)
				throw new Error('query: engine disposed; parse the source again with a live engine');
			const stamp = engineOf(node);
			if (stamp !== undefined && !sameLanguage(stamp, identity)) {
				throw new Error(`cannot query a ${stamp.language.name} node through a ${language.name} engine`);
			}
			return queryFacet(node, queryHooks);
		}) as Engine<API>['query'],
		read() {
			return Promise.reject(unimplementedVerb('read'));
		},
		render(node: RenderArgument<API>, renderOptions?: API['options']) {
			const target = typeof node === 'function' ? node(build) : node;
			const stamp = engineOf(target);
			if (stamp !== undefined && !sameLanguage(stamp, identity)) {
				throw new Error(`cannot render a ${stamp.language.name} node through a ${language.name} engine`);
			}
			const rendered = native.render(target, renderOptions);
			if (renderChain === undefined) {
				if (metricsEnabled) materializeNative(target, rendered);
				return rendered;
			}
			const call: Parameters<NonNullable<Interceptor<API>['render']>>[0] = {
				node: target,
				options: mergeRenderOptions(options?.render, renderOptions)
			};
			return interceptedRender(call, renderChain, rendered, () => materializeNative(target, rendered));
		},
		create(): Pending {
			throw unimplementedVerb('create');
		},
		write(): Pending {
			throw unimplementedVerb('write');
		},
		dispose() {
			handle.current = identity;
			native.dispose();
		},
		[Symbol.dispose]() {
			engine.dispose();
		}
	};
	handle.current = engine;
	const frozen = Object.freeze(engine);
	builderScopes.set(frozen, (table) => scopedBuild(table, handle, buildChain));
	return frozen;
}

function assemblePortableEngine<API extends PortableLanguageAPI>(language: Language<API>, hooks: LanguageHooks<API>): PortableEngine<API> {
	const rows = hooks.portable;
	if (rows === undefined) throw new Error(`language "${language.name}" has no portable surface: its grammar has no bindings`);
	const identity: EngineIdentity<API> = { language, renderModuleHash: hooks.renderModuleHash, options: undefined, trivia: hooks.trivia, portable: rows };
	return Object.freeze({ ...identity, kinds: portable.kinds as API['portable']['kinds'], is: portable.is as API['portable']['is'] });
}

function mergeRenderOptions<O extends object>(engine: O | undefined, call: O | undefined): O {
	const merged: Record<string, unknown> = { ...engine, ...call };
	const layouts = [engine, call].flatMap((options) => {
		const layout = (options as { readonly layout?: unknown } | undefined)?.layout;
		return typeof layout === 'object' && layout !== null ? [layout] : [];
	});
	if (layouts.length > 0) merged['layout'] = Object.assign({}, ...layouts);
	return merged as O;
}

/**
 * Creates an engine for `language`.
 *
 * @param options - Engine options. `render` sets the engine's render options and is checked against the language's options.
 * @returns The engine, once the language has loaded.
 * @throws When an option the engine does not implement yet is set, or the language fails to load.
 */
export async function createEngine<API extends LanguageAPI, const R extends API['options'] = API['options']>(
	language: Language<API>,
	options?: CreateEngineOptions<API, R>
): Promise<Engine<API>>;
/**
 * Creates an engine for `language` over its portable vocabulary, the same as `createEngine(language, { api: 'portable' })`.
 *
 * @param options - `{ api: 'portable' }`.
 * @returns The portable engine, once the language has loaded.
 * @throws When the language's grammar has no bindings, or the language fails to load.
 */
export async function createEngine<API extends PortableLanguageAPI>(language: Language<API>, options: PortableEngineOptions): Promise<PortableEngine<API>>;
export async function createEngine<API extends LanguageAPI>(
	language: Language<API>,
	options?: CreateEngineOptions<API> | PortableEngineOptions
): Promise<Engine<API> | PortableEngine<API & PortableLanguageAPI>> {
	if (options?.api === 'portable') {
		const portableLanguage = language as unknown as Language<API & PortableLanguageAPI>;
		return assemblePortableEngine(portableLanguage, await loadLanguage(portableLanguage));
	}
	refuseUnimplemented(options);
	return assembleEngine(language, await loadLanguage(language), options);
}
