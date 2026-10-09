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
	Pending,
	Rendered,
	RenderArgument,
	RenderCallOptions,
	CreateEngineOptions
} from '@sittir/types';
import { bindTree, engineOf, inEngine, sameLanguage, type EngineHandle } from './engine-scope.ts';
import { metricsEnabled, recordFfi } from './metrics.ts';
import { ParseErrors } from './parse-errors.ts';
import { queryFacet, type QueryHooks } from './query.ts';
import { createRenderHandle } from './engine.ts';
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
	return {
		...(options?.format !== undefined ? { format: options.format } : {}),
		...(options?.render !== undefined ? { options: options.render } : {})
	};
}

function unimplementedVerb(verb: 'read' | 'create' | 'edit' | 'write'): Error {
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
					return intercept === undefined ? run() : intercept({ path, args }, run);
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

function languageGuards<G extends object>(guards: G, inLanguage: (value: unknown) => boolean): Readonly<G> {
	const entries = Object.entries(guards).map(([name, guard]): [string, unknown] => [
		name,
		languageGuard(guard as (...args: unknown[]) => boolean, inLanguage)
	]);
	return Object.freeze(Object.fromEntries(entries) as G);
}

function languageGuard(
	guard: (...args: unknown[]) => boolean,
	inLanguage: (value: unknown) => boolean
): (...args: unknown[]) => boolean {
	const checked = (value: unknown, ...rest: unknown[]): boolean => inLanguage(value) && guard(value, ...rest);
	if (Object.keys(guard).length === 0) return checked;
	return Object.freeze(
		Object.defineProperties(checked, Object.getOwnPropertyDescriptors(languageGuards(guard, inLanguage)))
	);
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
		trivia: hooks.trivia
	});
	const handle: EngineHandle = {
		current: identity,
		lineGapsOf: (address) => native.lineGapsOf(address),
		hydrate: hooks.hydrate
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
	const inLanguage = (value: unknown): boolean => {
		const stamp = engineOf(value);
		return stamp !== undefined && sameLanguage(stamp, identity);
	};
	const queryHooks: QueryHooks = {
		querySlots: hooks.querySlots,
		membership: hooks.membership,
		kindName: (kind) => hooks.trivia.kindName(kind),
		wrap: hooks.wrap
	};
	const engine: Engine<API> = {
		...identity,
		build,
		is: languageGuards(hooks.is, inLanguage),
		kinds: hooks.kinds,
		types: undefined as unknown as API['types'],
		diagnostics: {
			buildProfile: native.buildProfile,
			parseAndRead: readAndBind,
			lineGapsOf: (address) => native.lineGapsOf(address)
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
				hooks.trivia.innerGaps[kind] !== undefined &&
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
		render(node: RenderArgument<API>, renderOptions?: API['options'] & RenderCallOptions) {
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
				options: { ...options?.render, ...renderOptions }
			};
			return interceptedRender(call, renderChain, rendered, () => materializeNative(target, rendered));
		},
		create(): Pending {
			throw unimplementedVerb('create');
		},
		edit(): Pending {
			throw unimplementedVerb('edit');
		},
		write(): Pending {
			throw unimplementedVerb('write');
		},
		dispose() {
			handle.current = identity;
			delete handle.lineGapsOf;
			native.dispose();
		}
	};
	handle.current = engine;
	return Object.freeze(engine);
}

export async function createEngine<API extends LanguageAPI, const R extends API['options'] = API['options']>(
	language: Language<API>,
	options?: CreateEngineOptions<API, R>
): Promise<Engine<API>> {
	refuseUnimplemented(options);
	return assembleEngine(language, await loadLanguage(language), options);
}
