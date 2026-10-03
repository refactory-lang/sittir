import type {
	AnyUntypedNode,
	ApiSurface,
	Engine,
	EngineIdentity,
	EngineOptions,
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
import {
	isEmptyNode as isEmptyUntypedNode,
	isErrorNode,
	isFactoryNode,
	isNode,
	isParsedNode
} from './utils.ts';

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
	if ((options?.intercept?.length ?? 0) > 0) throw new Error('interceptors are not implemented');
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

function scopedBuild<B>(build: B, handle: EngineHandle): B {
	const proxies = new WeakMap<object, unknown>();
	const scope = (value: unknown): unknown => {
		if (value === null || (typeof value !== 'function' && typeof value !== 'object')) return value;
		const known = proxies.get(value);
		if (known !== undefined) return known;
		const shell = typeof value === 'function' ? () => undefined : {};
		const proxy = new Proxy(shell, {
			get: (_, key, receiver) => {
				const member: unknown = Reflect.get(value, key, receiver);
				return Object.hasOwn(value, key) ? scope(member) : member;
			},
			has: (_, key) => Reflect.has(value, key),
			ownKeys: () => Reflect.ownKeys(value),
			getOwnPropertyDescriptor: (_, key) => {
				const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
				if (descriptor === undefined) return undefined;
				return 'value' in descriptor
					? { ...descriptor, value: scope(descriptor.value), configurable: true }
					: { ...descriptor, configurable: true };
			},
			getPrototypeOf: () => Reflect.getPrototypeOf(value),
			apply: (_, self, args) => inEngine(handle, () => Reflect.apply(value as () => unknown, self, args)),
			set: refuseWrite,
			defineProperty: refuseWrite,
			deleteProperty: refuseWrite,
			setPrototypeOf: refuseWrite,
			preventExtensions: refuseWrite
		});
		proxies.set(value, proxy);
		return proxy;
	};
	return scope(build) as B;
}

function languageGuards<G extends object>(guards: G, inLanguage: (value: unknown) => boolean): Readonly<G> {
	const entries = Object.entries(guards).map(([name, guard]): [string, unknown] => [
		name,
		(value: unknown, ...rest: unknown[]) => inLanguage(value) && (guard as (...args: unknown[]) => boolean)(value, ...rest)
	]);
	return Object.freeze(Object.fromEntries(entries) as G);
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
	const handle: EngineHandle = { current: identity, lineGapsOf: (address) => native.lineGapsOf(address) };
	const build = scopedBuild(hooks.build, handle);
	const renderNative = (target: Parameters<typeof native.render>[0], renderOptions: object | undefined): Rendered => {
		const rendered = native.render(target, renderOptions);
		if (!metricsEnabled) return rendered;
		const kind =
			typeof target === 'number' ? String(target) : (hooks.trivia.kindName(target.$type) ?? String(target.$type));
		const before = performance.now();
		const text = rendered.toString();
		recordFfi(language.name, kind, JSON.stringify(target).length, performance.now() - before, text.length);
		return rendered;
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
	const engine: Engine<API> = {
		...identity,
		build,
		is: languageGuards(hooks.is, inLanguage),
		kinds: hooks.kinds,
		types: undefined as unknown as API['types'],
		diagnostics: { buildProfile: native.buildProfile, parseAndRead: readAndBind, lineGapsOf: (address) => native.lineGapsOf(address) },
		isNode: (value): value is API['node'] => isNode(value) && inLanguage(value),
		isParsedNode: (value): value is API['node'] => isParsedNode(value) && inLanguage(value),
		isFactoryNode: (value): value is API['node'] => isFactoryNode(value) && inLanguage(value),
		isErrorNode: (value): value is API['node'] => isErrorNode(value) && inLanguage(value),
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
			const { root, tree } = readAndBind(source, parseOptions);
			if (parseOptions?.errors === 'throw' && root.$errors.length > 0) throw new ParseErrors(root.$errors);
			return hooks.wrap(root, tree);
		},
		read() {
			return Promise.reject(unimplementedVerb('read'));
		},
		render(node: RenderArgument<API>, renderOptions?: API['options'] & RenderCallOptions) {
			const target = typeof node === 'function' ? node(build) : node;
			const stamp = engineOf(target);
			if (stamp !== undefined && !sameLanguage(stamp, identity)) {
				throw new Error(`cannot render a ${stamp.language.name} node through a ${language.name} engine`);
			}
			return renderNative(target, renderOptions);
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
