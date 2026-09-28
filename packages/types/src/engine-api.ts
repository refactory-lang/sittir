import type { AnyNodeData, Edit, FormatRecord, RenderCallOptions } from './core-types.ts';
import type { IndentOption } from './options.ts';

export interface TriviaFacts {
	kindName(type: AnyNodeData['$type']): string | undefined;
	readonly kinds: ReadonlySet<string>;
	readonly innerGaps: { readonly [kind: string]: readonly string[] };
	readonly whitespace?: { readonly run: RegExp; readonly kindIdByText: { readonly [text: string]: number } };
	comment?: ((text: string) => AnyNodeData) | undefined;
}

export interface ParseOptions {
	readonly deep?: boolean;
}

export interface LanguageAPI {
	readonly name: string;
	readonly build: object;
	readonly is: object;
	readonly kinds: object;
	readonly types: object;
	readonly root: AnyNodeData;
	readonly node: AnyNodeData;
	readonly options: object;
	readonly indentChar: string;
}

export interface Language<API extends LanguageAPI> {
	readonly name: API['name'];
	load(): Promise<LanguageHooks<API>>;
	readonly __api?: API;
}

export interface NativeEngineOptions<O extends object = Readonly<Record<string, unknown>>> {
	readonly format?: FormatRecord;
	readonly options?: O;
}

export interface LanguageHooks<API extends LanguageAPI> {
	readonly name: API['name'];
	readonly build: API['build'];
	readonly is: API['is'];
	readonly kinds: API['kinds'];
	readonly trivia: TriviaFacts;
	createNative(options?: NativeEngineOptions<API['options']>): NativeLanguageEngine<API>;
	wrap(root: unknown, tree: unknown): API['root'];
}

export interface NativeLanguageEngine<API extends LanguageAPI> {
	render(node: AnyNodeData, options?: API['options'] & RenderCallOptions): Rendered;
	applyEdits(source: string, edits: readonly Edit[]): string;
	parseAndRead(source: string, options?: ParseOptions): { root: unknown; tree: unknown };
	holdsTree(tree: unknown): boolean;
	dispose(): void;
}

export interface Rendered extends Disposable {
	toString(): string;
	save(path: string): void;
	print(): string;
}

export interface Pending extends FileChange, PromiseLike<void>, AsyncDisposable {
	diff(): FileChange;
}

export interface FileChange {
	readonly path: string;
	readonly before: string | undefined;
	readonly after: string;
}

export type ApiSurface = 'default' | 'strict' | 'portable';

export type StrictMembers<T> = {
	[K in keyof T as K extends 'strict' | 'coerce' ? never : K]: StrictSurface<T[K]>;
};

export type StrictSurface<T> = T extends { strict: infer S }
	? S & StrictMembers<T>
	: T extends (...args: never) => unknown
		? T
		: T extends object
			? StrictMembers<T>
			: T;

export type BuildSurface<API extends LanguageAPI, M extends ApiSurface> = M extends 'strict'
	? StrictSurface<API['build']>
	: M extends 'portable'
		? never
		: API['build'];

export interface Engine<API extends LanguageAPI, M extends ApiSurface = 'default'> {
	readonly language: API['name'];
	readonly build: BuildSurface<API, M>;
	readonly is: API['is'];
	readonly kinds: API['kinds'];
	readonly types: API['types'];
	parse(source: string, options?: ParseOptions): API['root'];
	read(path: string, options?: ParseOptions): Promise<API['root']>;
	render<const R extends API['options'] = API['options']>(
		node: API['node'] | ((build: API['build']) => API['node']),
		options?: R & RenderOptionsCheck<API, R, keyof RenderCallOptions> & RenderCallOptions
	): Rendered;
	create(path: string, fn: (build: API['build']) => API['root']): Pending;
	edit(path: string, fn: (root: API['root']) => API['root']): Pending;
	write(path: string, node: API['root']): Pending;
	applyEdits(source: string, edits: readonly Edit[]): string;
	dispose(): void;
}

export type RenderOptionsCheck<API extends LanguageAPI, R, Extra extends PropertyKey = never> = IndentOption<
	R extends { readonly indent?: infer I extends string } ? I : string,
	API['indentChar']
> & { readonly [K in Exclude<keyof R, keyof API['options'] | Extra>]: never };

export interface EngineOptions<API extends LanguageAPI, M extends ApiSurface = 'default'> {
	readonly api?: M;
	readonly render?: API['options'];
	readonly format?: FormatRecord;
	readonly intercept?: readonly Interceptor<API>[];
}

export interface Interceptor<API extends LanguageAPI> {
	build?(call: { readonly path: readonly string[]; readonly args: readonly unknown[] }, next: () => API['node']): API['node'];
	render?(call: { readonly node: API['node']; readonly options: API['options'] }, next: () => string): string;
	parse?(call: { readonly source: string }, next: () => API['root']): API['root'];
	file?(
		change: FileChange & { readonly verb: 'create' | 'edit' | 'write' },
		next: () => Promise<void>
	): Promise<void>;
}

export interface Project extends AsyncDisposable {
	readonly directory: string | null;
	engine<API extends LanguageAPI>(language: Language<API>, options?: EngineOptions<API>): Promise<Engine<API>>;
	staged(): readonly string[];
	diff(): readonly FileChange[];
	files(): ReadonlyMap<string, string>;
	commit(): Promise<void>;
	discard(): void;
}

export type KindTypes<Keys extends object, NsMap extends object> = {
	readonly [Id in keyof Keys as Keys[Id] extends string ? Keys[Id] : never]: Id extends keyof NsMap
		? NsMap[Id] extends { readonly Node: infer N }
			? N
			: never
		: never;
};

export type Types<E> = E extends Engine<infer API, ApiSurface> ? API['types'] : never;
export type ApiOf<L> = L extends Language<infer API> ? API : never;
