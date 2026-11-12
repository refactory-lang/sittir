import type {
	AnyUntypedNode,
	BuildSurface,
	BuilderMode,
	CommitScope,
	Engine,
	EngineIdentity,
	EngineOptions,
	Interceptor,
	ErrorNode,
	FileChange,
	Language,
	LanguageAPI,
	LanguageIdentity,
	LanguageHooks,
	NativeEngineOptions,
	NodeStorage,
	ParseOptions,
	PortableEngine,
	PortableEngineOptions,
	PortableLanguageAPI,
	Pending,
	Rendered,
	RenderArgument,
	CreateEngineOptions,
	KindMembership,
	StructureTable
} from '@sittir/types';
import { engineClosed, engineOpened } from './engine-census.ts';
import { bindTree, engineOf, foreignEngine, inEngine, nodeStorageOf, stampEngineStorage, type EngineHandle, type TreeEngineHandle } from './engine-scope.ts';
import { keepLayout } from './exemplars.ts';
import { guardsOf, inLanguage as inLanguageOf, kindTestOf } from './language.ts';
import { dataBytes, metricsEnabled, recordFfi } from './metrics.ts';
import { checkInput, checkRow, verifyStructure } from './verify-structure.ts';
import { BuiltArena, type BuiltViews } from './built-arena.ts';
import type { TreeHandle } from './read.ts';
import { ParseErrors } from './parse-errors.ts';
import { queryFacet, type QueryHooks } from './query.ts';
import { refuseReviver } from './json-refusal.ts';
import { ARENA_FEATURE_REFUSED, createRenderHandle, nativeBuiltRecords, saverOf, type TextWriter } from './engine.ts';
import { currentText, pendingFile, type FileVerb } from './pending.ts';
import { portable, portableGuardsOf, registerPortableRows } from './portable/index.ts';
import { isEmptyNode as isEmptyUntypedNode, isErrorNode, isFactoryNode, isNode, isParsedNode, wrapRegistered, writeLeafSites } from './utils.ts';

type Middleware<Call, Result> = (call: Call, next: () => Result) => Result;

type RenderCall<API extends LanguageAPI> = Parameters<NonNullable<Interceptor<API>['render']>>[0];

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
	const loading = language.load().then(
		(hooks) => {
			if (hooks.portable !== undefined) registerPortableRows(language.load, hooks.portable);
			return hooks;
		},
		(cause: unknown) => {
			loaded.delete(language);
			throw new Error(`failed to load language "${language.name}"`, { cause });
		}
	);
	loaded.set(language, loading);
	return loading;
}

async function loadTable<API extends LanguageAPI, M extends BuilderMode>(
	language: LanguageIdentity<API>,
	hooks: LanguageHooks<API>,
	mode: M
): Promise<API['build'][M]> {
	try {
		return await hooks.tables[mode]();
	} catch (cause) {
		throw new Error(`failed to load the ${mode} builder table of language "${language.name}"`, { cause });
	}
}

async function loadRecords<API extends LanguageAPI>(language: LanguageIdentity<API>, hooks: LanguageHooks<API>): Promise<object> {
	try {
		return await hooks.records();
	} catch (cause) {
		throw new Error(`failed to load the record builders of language "${language.name}"`, { cause });
	}
}

function nativeEngineOptions<API extends LanguageAPI>(
	options: EngineOptions<API, BuilderMode> | undefined,
	nodeStorage: NodeStorage
): NativeEngineOptions<API['options']> {
	return { ...(options?.render === undefined ? {} : { options: options.render }), nodeStorage };
}

function unimplementedVerb(verb: 'read'): Error {
	return new Error(`file verb "${verb}" is not implemented`);
}

function refuseWrite(): never {
	throw new Error('the build table of an engine is read-only');
}

function attempting<T>(handle: EngineHandle, run: () => T): T {
	return handle.builtArena === undefined ? run() : handle.builtArena.attempt(run);
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
				return 'value' in descriptor ? { ...descriptor, value: scope(descriptor.value), configurable: true } : { ...descriptor, configurable: true };
			},
			getPrototypeOf: () => Reflect.getPrototypeOf(value),
			apply: (_, self, args) =>
				inEngine(handle, () => {
					if (typeof value !== 'function') throw new TypeError('builder is not callable');
					const built = (): unknown => handle.settle(Reflect.apply(value, self, args));
					return handle.builtArena === undefined ? built() : handle.builtArena.scope(built);
				}),
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

function releasing(rendered: Rendered, release: () => void, writeText: TextWriter): Rendered {
	return createRenderHandle(() => rendered.toString(), saverOf(rendered), writeText, () => {
		rendered[Symbol.dispose]();
		release();
	});
}

function interceptedRender<Call>(
	call: Call,
	chain: Middleware<Call, string>,
	rendered: Rendered,
	materialize: () => string,
	writeText: TextWriter
): Rendered {
	const output: Rendered = createRenderHandle(
		() => chain(call, materialize),
		(path, create) => writeText(path, output.toString(), create),
		writeText,
		() => rendered[Symbol.dispose]()
	);
	return output;
}

const builderScopes = new WeakMap<object, <T extends object>(table: T) => T>();

export function scopeBuilders<T extends object>(engine: object, table: T): T {
	const scope = builderScopes.get(engine);
	if (scope === undefined) throw new Error('scopeBuilders: the engine was not made by createEngine');
	return scope(table);
}

function storedVerifierOf(mode: EngineOptions<LanguageAPI>['verifyStructure'], table: StructureTable, membership: KindMembership): EngineHandle['verifyStored'] {
	if (mode !== 'runtime') return undefined;
	return (kind, stored) => {
		const row = table[kind];
		if (row !== undefined) checkRow(stored, row, membership);
	};
}

function settlerOf(
	mode: EngineOptions<LanguageAPI>['verifyStructure'],
	table: StructureTable,
	membership: KindMembership
): EngineHandle['settle'] {
	if (mode !== 'runtime') return (node) => node;
	const seen = new WeakSet<object>();
	return (node) => {
		verifyStructure(node, table, membership, seen);
		return node;
	};
}

function keepingBuilt(settle: EngineHandle['settle'], keeps: boolean): EngineHandle['settle'] {
	if (!keeps) return settle;
	const layouts: object[] = [];
	return (node) => settle(typeof node === 'object' && node !== null ? keepLayout(layouts, node) : node);
}

function admitterOf(mode: EngineOptions<LanguageAPI>['verifyStructure'], table: StructureTable): EngineHandle['admit'] {
	if (mode !== 'runtime') return () => undefined;
	return (kindId, args, declared) => {
		const row = typeof kindId === 'number' ? table[kindId] : undefined;
		if (row !== undefined) checkInput(row, args, declared);
	};
}

const OBJECT_SCOPE: CommitScope = Object.freeze({
	keep: <N extends object>(node: N): N => node,
	[Symbol.dispose]: () => undefined
});

function assembleEngine<API extends LanguageAPI, M extends BuilderMode>(
	language: Language<API>,
	hooks: LanguageHooks<API>,
	table: API['build'][M],
	options: EngineOptions<API, M> | undefined,
	storage: NodeStorage,
	records: object | undefined
): Engine<API, M> {
	const native = hooks.createNative(nativeEngineOptions(options, storage));
	let open = true;
	const identity: EngineIdentity<API> = Object.freeze({
		language,
		renderModuleHash: hooks.renderModuleHash,
		options: options?.render,
		trivia: hooks.trivia,
		rootKinds: hooks.rootKinds,
		portable: hooks.portable
	});
	stampEngineStorage(identity, storage);
	const handle: TreeEngineHandle = {
		current: identity,
		hydrate: hooks.hydrate,
		querySlots: hooks.querySlots,
		structure: hooks.structure,
		settle: keepingBuilt(settlerOf(options?.verifyStructure, hooks.structure, hooks.membership), records === undefined),
		verifyStored: storedVerifierOf(options?.verifyStructure, hooks.structure, hooks.membership),
		admit: admitterOf(options?.verifyStructure, hooks.structure)
	};
	const interceptors = options?.intercept ?? [];
	const parseChain = interceptorChain(interceptors.map((hook) => hook.parse?.bind(hook)));
	const renderChain = interceptorChain(interceptors.map((hook) => hook.render?.bind(hook)));
	const fileHooks = interceptors.flatMap((hook) => (hook.file === undefined ? [] : [hook.file.bind(hook)]));
	const build = scopedBuild(table, handle) as BuildSurface<API, M>;
	const materializeNative = (target: Parameters<typeof native.render>[0], rendered: Rendered): string => {
		if (!metricsEnabled) return rendered.toString();
		const kind =
			typeof target === 'number' ? String(target) : (hooks.trivia.kindName(target.$type) ?? String(target.$type));
		const before = performance.now();
		const text = rendered.toString();
		recordFfi(language.name, kind, dataBytes(target), performance.now() - before, text.length);
		return text;
	};
	const measured = (target: Parameters<typeof native.render>[0], rendered: Rendered): Rendered => {
		if (metricsEnabled) materializeNative(target, rendered);
		return rendered;
	};
	const renderCall = (target: RenderCall<API>['node'], renderOptions: API['options'] | undefined): RenderCall<API> => ({
		node: target,
		options: mergeRenderOptions(options?.render, renderOptions)
	});
	const renderInput = (target: RenderCall<API>['node'], renderOptions: API['options'] | undefined): Rendered => {
		const foreign = foreignEngine(target, identity);
		if (foreign !== undefined) {
			throw new Error(`cannot render a ${foreign.language.name} node through a ${language.name} engine`);
		}
		const rendered = native.render(target, renderOptions);
		return renderChain === undefined ? measured(target, rendered) : interceptedRender(renderCall(target, renderOptions), renderChain, rendered, () => materializeNative(target, rendered), writeText);
	};
	const parseAndBind = (source: string) => {
		const tree = native.parseTree(source);
		bindTree(tree, handle);
		return tree;
	};
	const writeText: TextWriter = (path, text, create) => native.writeText(path, text, create);
	const readAndBind = (source: string, parseOptions?: ParseOptions) => {
		const read = native.parseAndRead(source, parseOptions);
		bindTree(read.tree, handle);
		return read;
	};
	const inLanguage = inLanguageOf(language);
	const kindNameOf = (kind: number): string => hooks.trivia.kindName(kind as API['kindId']) ?? String(kind);
	type RootInput = Parameters<Engine<API, M>['write']>[1];
	const writable = (root: RootInput): RootInput => {
		const owner = engineOf(root);
		if (owner !== undefined && owner !== engine && owner !== identity) throw new Error(`cannot write a root another engine parsed or built; write it through that engine`);
		const kind = (root as AnyUntypedNode).$type as number;
		if (!hooks.rootKinds.includes(kind)) throw new Error(`cannot write ${kindNameOf(kind)} as a file: write and create take a ${hooks.rootKinds.map(kindNameOf).join(' or ')} root`);
		return root;
	};
	const fileChangeOf = (path: string, rendered: Rendered): FileChange => Object.freeze({ path, before: currentText(path), after: rendered.toString() });
	const pendingWrite = (path: string, verb: FileVerb, root: RootInput, release?: () => void): Pending =>
		pendingFile(
			path,
			verb,
			() => {
				let rendered: Rendered | undefined;
				const renderedNow = (): Rendered => (rendered ??= engine.render(writable(root)));
				return {
					diff: () => fileChangeOf(path, renderedNow()),
					commit: () => {
						saverOf(renderedNow())(path, verb === 'create');
					},
					[Symbol.dispose]: () => {
						rendered?.[Symbol.dispose]();
						release?.();
					}
				};
			},
			() => {
				using rendered = engine.render(writable(root));
				return fileChangeOf(path, rendered);
			},
			fileHooks
		);
	const queryHooks: QueryHooks = {
		querySlots: hooks.querySlots,
		queryFlags: hooks.queryFlags ?? {},
		querySlotFlags: hooks.querySlotFlags ?? {},
		membership: hooks.membership,
		kindTest: kindTestOf(language),
		portable: hooks.portable,
		kindName: (kind) => hooks.trivia.kindName(kind),
		wrap: hooks.wrap
	};
	const engine: Engine<API, M> = {
		...identity,
		build,
		is: guardsOf(language),
		kinds: language.kinds,
		types: undefined as unknown as API['types'],
		diagnostics: {
			buildProfile: native.buildProfile,
			builtMemory: native.builtMemory,
			renderTemplates: (node) => native.renderTemplates(node),
			parseTree: parseAndBind,
			parseAndRead: readAndBind
		},
		isNode: (value): value is API['node'] => isNode(value) && inLanguage(value),
		isParsedNode: (value): value is API['node'] => isParsedNode(value) && inLanguage(value),
		isFactoryNode: (value): value is API['node'] => isFactoryNode(value) && inLanguage(value),
		isErrorNode: (value): value is ErrorNode => isErrorNode(value) && inLanguage(value),
		reviver: refuseReviver,
		isEmptyNode: ((node: AnyUntypedNode): boolean => {
			const kind = hooks.trivia.kindName(node.$type);
			return (
				engine.isNode(node) &&
				kind !== undefined &&
				hooks.trivia.innerKinds.has(kind) &&
				isEmptyUntypedNode(node)
			);
		}) as Engine<API, M>['isEmptyNode'],
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
			const foreign = foreignEngine(node, identity);
			if (foreign !== undefined) {
				throw new Error(`cannot query a ${foreign.language.name} node through a ${language.name} engine`);
			}
			return queryFacet(node, queryHooks);
		}) as Engine<API, M>['query'],
		read() {
			return Promise.reject(unimplementedVerb('read'));
		},
		render(node: RenderArgument<API, M>, renderOptions?: API['options']) {
			if (typeof node !== 'function') return renderInput(node, renderOptions);
			const built = attempting(handle, () => node(build));
			return releasing(renderInput(built, renderOptions), () => engine.release(built), writeText);
		},
		create(path, fn) {
			const root = attempting(handle, () => fn(build));
			return pendingWrite(path, 'create', root, () => engine.release(root));
		},
		write(path, root) {
			return pendingWrite(path, 'write', root);
		},
		release(node) {
			native.release(node);
		},
		scope() {
			if (handle.current !== engine) throw new Error('scope: engine disposed; open a scope on a live engine');
			return handle.builtArena?.commit() ?? OBJECT_SCOPE;
		},
		dispose() {
			handle.current = identity;
			if (open) {
				open = false;
				engineClosed();
			}
			native.dispose();
		},
		[Symbol.dispose]() {
			engine.dispose();
		}
	};
	handle.current = engine;
	const frozen = Object.freeze(engine);
	stampEngineStorage(frozen, storage);
	builderScopes.set(frozen, (table) => scopedBuild(table, handle));
	if (records !== undefined) {
		const built = nativeBuiltRecords(native);
		if (built === undefined) throw new Error(ARENA_FEATURE_REFUSED);
		const views = (records as { readonly builtViews?: BuiltViews }).builtViews;
		if (views === undefined) throw new Error(`the record builders of language "${language.name}" export no builtViews`);
		handle.builtArena = new BuiltArena(built, hooks.wrap as (data: object, tree: TreeHandle) => unknown, handle, views, writeLeafSites);
		handle.records = records;
	}
	engineOpened();
	return frozen;
}

function assemblePortableEngine<API extends PortableLanguageAPI>(language: Language<API>, hooks: LanguageHooks<API>): PortableEngine<API> {
	const rows = hooks.portable;
	if (rows === undefined) throw new Error(`language "${language.name}" has no portable surface: its grammar has no bindings`);
	const identity: EngineIdentity<API> = { language, renderModuleHash: hooks.renderModuleHash, options: undefined, trivia: hooks.trivia, rootKinds: hooks.rootKinds, portable: rows };
	return Object.freeze({ ...identity, kinds: portable.kinds as API['portable']['kinds'], is: portableGuardsOf(language) as API['portable']['is'] });
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
 * Creates an engine for `language`, which builds with the builder table its `api` names: the loose builders of the
 * default engine, or the strict builders of `api: 'strict'`.
 *
 * @param options - Engine options. `api` picks the builder table, and only that table loads. `render` sets the engine's
 * render options and is checked against the language's options.
 * @returns The engine, once the language and its builder table have loaded.
 * @throws When the language or its builder table fails to load.
 */
export async function createEngine<
	API extends LanguageAPI,
	const R extends API['options'] = API['options'],
	const M extends BuilderMode = 'default'
>(language: Language<API>, options?: CreateEngineOptions<API, R, M>): Promise<Engine<API, M>>;
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
	options?: CreateEngineOptions<API, API['options'], BuilderMode> | PortableEngineOptions
): Promise<Engine<API, BuilderMode> | PortableEngine<API & PortableLanguageAPI>> {
	if (options?.api === 'portable') {
		const portableLanguage = language as unknown as Language<API & PortableLanguageAPI>;
		return assemblePortableEngine(portableLanguage, await loadLanguage(portableLanguage));
	}
	const hooks = await loadLanguage(language);
	const mode = options?.api ?? 'default';
	const storage = nodeStorageOf(options);
	const [table, records] = await Promise.all([
		loadTable(language, hooks, mode),
		storage === 'arena' ? loadRecords(language, hooks) : undefined
	]);
	return assembleEngine(language, hooks, table, options, storage, records);
}
