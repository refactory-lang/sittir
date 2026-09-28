import type {
	ApiSurface,
	Engine,
	EngineOptions,
	Language,
	LanguageAPI,
	LanguageHooks,
	NativeEngineOptions,
	Pending
} from '@sittir/types';

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

function assembleEngine<API extends LanguageAPI>(
	hooks: LanguageHooks<API>,
	options: EngineOptions<API> | undefined
): Engine<API> {
	const native = hooks.createNative(nativeEngineOptions(options));
	return {
		language: hooks.name,
		build: hooks.build,
		is: hooks.is,
		kinds: hooks.kinds,
		types: undefined as unknown as API['types'],
		parse(source, parseOptions) {
			const { root, tree } = native.parseAndRead(source, parseOptions);
			return hooks.wrap(root, tree);
		},
		read() {
			return Promise.reject(unimplementedVerb('read'));
		},
		render(node, renderOptions) {
			return native.render(typeof node === 'function' ? node(hooks.build) : node, renderOptions);
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
			native.dispose();
		}
	};
}

export async function createEngine<API extends LanguageAPI>(
	language: Language<API>,
	options?: EngineOptions<API>
): Promise<Engine<API>> {
	refuseUnimplemented(options);
	return assembleEngine(await loadLanguage(language), options);
}
