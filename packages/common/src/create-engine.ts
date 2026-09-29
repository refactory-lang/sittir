import type {
	AnyNodeData,
	ApiSurface,
	Engine,
	EngineIdentity,
	EngineOptions,
	Language,
	LanguageAPI,
	LanguageHooks,
	NativeEngineOptions,
	ParseOptions,
	Pending,
	Rendered,
	RenderOptionsCheck
} from '@sittir/types';
import { bindTree, engineOf, inEngine, isLive, sameLanguage, type EngineHandle } from './engine-scope.ts';
import { metricsEnabled, recordFfi } from './metrics.ts';
import {
	isEmptyNode as isEmptyNodeData,
	isErrorNode,
	isFactoryNode,
	isNode,
	isParsedNode
} from './utils.ts';

const loaded = new WeakMap<Language<LanguageAPI>, Promise<LanguageHooks<LanguageAPI>>>();

function loadLanguage<API extends LanguageAPI>(language: Language<API>): Promise<LanguageHooks<API>> {
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

function scopedBuild<B>(build: B, handle: EngineHandle): B {
	const proxies = new WeakMap<object, unknown>();
	const scope = (value: unknown): unknown => {
		if (value === null || (typeof value !== 'function' && typeof value !== 'object')) return value;
		const known = proxies.get(value);
		if (known !== undefined) return known;
		const proxy = new Proxy(value, {
			get: (target, key, receiver) => {
				const member: unknown = Reflect.get(target, key, receiver);
				return Object.hasOwn(target, key) ? scope(member) : member;
			},
			apply: (target, self, args) => inEngine(handle, () => Reflect.apply(target as () => unknown, self, args))
		});
		proxies.set(value, proxy);
		return proxy;
	};
	return scope(build) as B;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function collectReaders(value: unknown, readers: Set<EngineHandle['current']>): void {
	if (Array.isArray(value)) {
		for (const item of value) collectReaders(item, readers);
	} else if (isRecord(value) && !isNode(value)) {
		for (const item of Object.values(value)) collectReaders(item, readers);
	} else if (isRecord(value)) {
		if (isParsedNode(value)) {
			const reader = engineOf(value);
			if (reader !== undefined) readers.add(reader);
			return;
		}
		for (const [key, item] of Object.entries(value)) {
			if (key.startsWith('_') || key === '$other' || key === '$_trivia') collectReaders(item, readers);
		}
	}
}

let engineCount = 0;
const serials = new WeakMap<object, number>();
const labelOf = (engine: EngineHandle['current']): string => `${engine.language.name}#${serials.get(engine) ?? '?'}`;

function assembleEngine<API extends LanguageAPI>(
	language: Language<API>,
	hooks: LanguageHooks<API>,
	options: EngineOptions<API> | undefined
): Engine<API> {
	const native = hooks.createNative(nativeEngineOptions(options));
	const identity: EngineIdentity<API> = {
		language,
		renderModuleHash: hooks.renderModuleHash,
		options: options?.render,
		trivia: hooks.trivia
	};
	const handle: EngineHandle = { current: identity };
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
		is: hooks.is,
		kinds: hooks.kinds,
		types: undefined as unknown as API['types'],
		diagnostics: { buildProfile: native.buildProfile, parseAndRead: readAndBind },
		isNode: (value): value is API['node'] => isNode(value) && inLanguage(value),
		isParsedNode: (value): value is API['node'] => isParsedNode(value) && inLanguage(value),
		isFactoryNode: (value): value is API['node'] => isFactoryNode(value) && inLanguage(value),
		isErrorNode: (value): value is API['node'] => isErrorNode(value) && inLanguage(value),
		isEmptyNode: ((node: AnyNodeData): boolean => {
			const kind = hooks.trivia.kindName(node.$type);
			return (
				engine.isNode(node) &&
				kind !== undefined &&
				hooks.trivia.innerGaps[kind] !== undefined &&
				isEmptyNodeData(node)
			);
		}) as Engine<API>['isEmptyNode'],
		parse(source, parseOptions) {
			const { root, tree } = readAndBind(source, parseOptions);
			return hooks.wrap(root, tree);
		},
		read() {
			return Promise.reject(unimplementedVerb('read'));
		},
		render(node, renderOptions) {
			const target = typeof node === 'function' ? node(build) : node;
			const stamp = engineOf(target);
			if (stamp !== undefined && !sameLanguage(stamp, identity)) {
				throw new Error(`cannot render a ${stamp.language.name} node through a ${language.name} engine`);
			}
			const readers = new Set<EngineHandle['current']>();
			collectReaders(target, readers);
			if (readers.size > 1) {
				throw new Error(
					`the node holds parsed children of several engines (${[...readers].map(labelOf).join(', ')}); render each part through the engine that parsed it`
				);
			}
			const [reader] = readers;
			if (reader === undefined || reader === engine) return renderNative(target, renderOptions);
			if (!isLive(reader)) throw new Error('engine disposed; render it with engine.render(node)');
			return reader.render(target, { ...options?.render, ...renderOptions });
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
		applyEdits(source, edits) {
			return native.applyEdits(source, edits);
		},
		dispose() {
			handle.current = identity;
			native.dispose();
		}
	};
	handle.current = engine;
	serials.set(engine, ++engineCount);
	return engine;
}

export async function createEngine<API extends LanguageAPI, const R extends API['options'] = API['options']>(
	language: Language<API>,
	options?: EngineOptions<API> & { readonly render?: R & RenderOptionsCheck<API, R> }
): Promise<Engine<API>> {
	refuseUnimplemented(options);
	return assembleEngine(language, await loadLanguage(language), options);
}
