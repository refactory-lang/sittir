import type { AnyUntypedNode, FormatRecord, GrammarTriviaEntry, RenderCallOptions, TriviaSetter } from './core-types.ts';
import type { IndentOption } from './options.ts';

/** One line-break run a read node owns as trivia: the whitespace member it reads as and the byte its run starts at. */
export interface LineGap {
	readonly kind: number;
	readonly start: number;
}

/** A read node as the line-gap query names it: its own handle, or as a deep read leaves it, its tree's tag, its span and its stamped kind. */
export type LineGapAddress =
	| { readonly handle: number }
	| { readonly treeHandle: number; readonly span: { readonly start: number; readonly end: number }; readonly kind: number };

/**
 * The line-break runs a read node owns, before it and in its closing gap, each in source order, and the span of the
 * sibling its leading runs separate it from (`null` when it is its parent's first). A run holds only while that sibling
 * is still the node's neighbour.
 */
export interface LineGaps {
	readonly leading: readonly LineGap[];
	readonly trailing: readonly LineGap[];
	readonly previous: { readonly start: number; readonly end: number } | null;
}

export interface TriviaFacts {
	readonly kindName: (type: AnyUntypedNode['$type']) => string | undefined;
	readonly kinds: ReadonlySet<string>;
	readonly innerGaps: { readonly [kind: string]: readonly string[] };
	readonly whitespace?: { readonly run: RegExp; readonly kindIdByText: { readonly [text: string]: number } };
	readonly comment?: ((text: string) => AnyUntypedNode) | undefined;
	readonly spelled?: readonly SpelledTrivia[];
}

/**
 * One way a comment kind is spelled in full: the fixed text it opens and
 * closes with, and the builder of that kind from text spelled so.
 */
export interface SpelledTrivia {
	readonly open: string;
	readonly close: string;
	readonly build: (text: string) => AnyUntypedNode;
}

/** Options of one parse. */
export interface ParseOptions {
	/**
	 * Read the whole tree in the parse, in place of one level at a time.
	 *
	 * A deep parse reads every node up front and types each node that holds
	 * slots; text leaves and tokens are stored as read. It is for a caller that
	 * will read the whole tree. The default (`false`) reads one level and
	 * hydrates each child when an accessor first reaches it.
	 *
	 * The choice changes when the work is done, never the result: an untouched
	 * node renders its source bytes whichever way it was read.
	 */
	readonly deep?: boolean;
}

export interface EngineIdentity<API extends LanguageAPI = LanguageAPI> {
	readonly language: LanguageIdentity<API>;
	readonly renderModuleHash: string;
	readonly options: API['options'] | undefined;
	readonly trivia: TriviaFacts;
}

export interface GrammarTypeMap {
	readonly namespaces: object;
	readonly empty: { readonly node: unknown; readonly empty: unknown };
	readonly trivia: unknown;
}

export interface NodeMethods<Trivia = any> {
	$render(): string;
	$trivia: TriviaSetter<this, Trivia>;
}

export interface GrammarInnerTrivia<N, Trivia> {
	inner(): readonly Trivia[];
	inner(...items: GrammarTriviaEntry<Trivia>[]): N;
}

export interface GrammarInnerTriviaAt<N, Trivia, Gap extends string> extends GrammarInnerTrivia<N, Trivia> {
	innerAt(gap: Gap): readonly Trivia[];
	innerAt(gap: Gap, ...items: GrammarTriviaEntry<Trivia>[]): N;
}

export interface LanguageAPI {
	readonly name: string;
	readonly build: object;
	readonly is: object;
	readonly kinds: object;
	readonly types: object;
	readonly root: AnyUntypedNode;
	readonly node: AnyUntypedNode;
	readonly fixedTextKindId: number;
	readonly options: object;
	readonly indentChar: string;
	readonly empty: GrammarTypeMap['empty'];
}

/** What names a language and what an engine records of it: a `Language` without its engine constructor. Unlike `Language`, it is assignable across `LanguageAPI`s. */
export type LanguageIdentity<API extends LanguageAPI> = Omit<Language<API>, 'createEngine'>;

/** The options `createEngine` takes: the engine options, with the `render` block checked against the language's render options. */
export type CreateEngineOptions<API extends LanguageAPI, R = API['options']> = EngineOptions<API> & {
	readonly render?: R & RenderOptionsCheck<API, R>;
};

export interface Language<API extends LanguageAPI> {
	readonly name: API['name'];
	readonly fileTypes: readonly string[];
	load(): Promise<LanguageHooks<API>>;
	readonly __api?: API;
	/**
	 * Creates an engine for this language, the same as `createEngine(language, options)` from
	 * `@sittir/common`. The implementation loads on the first call; importing the descriptor does not.
	 *
	 * @param options - Engine options. `render` sets the engine's render options and is checked
	 * against this language's options: an unknown key or a mistyped value is a type error.
	 * @returns The engine, once the language has loaded.
	 * @throws When an option the engine does not implement yet is set, or the language fails to load.
	 */
	createEngine<const R extends API['options'] = API['options']>(options?: CreateEngineOptions<API, R>): Promise<Engine<API>>;
}

export interface NativeEngineOptions<O extends object = Readonly<Record<string, unknown>>> {
	readonly format?: FormatRecord;
	readonly options?: O;
}

export interface LanguageHooks<API extends LanguageAPI> {
	readonly name: API['name'];
	readonly renderModuleHash: string;
	readonly build: API['build'];
	readonly is: API['is'];
	readonly kinds: API['kinds'];
	readonly trivia: TriviaFacts;
	createNative(options?: NativeEngineOptions<API['options']>): NativeLanguageEngine<API>;
	wrap(root: unknown, tree: unknown): API['root'];
}

export interface NativeLanguageEngine<API extends LanguageAPI> {
	render(node: AnyUntypedNode | number, options?: API['options'] & RenderCallOptions): Rendered;
	parseAndRead: EngineDiagnostics['parseAndRead'];
	readonly buildProfile?: EngineDiagnostics['buildProfile'];
	lineGapsOf: EngineDiagnostics['lineGapsOf'];
	dispose(): void;
}

export interface ParsedRead<TRoot = unknown, TTree extends object = object> {
	root: TRoot;
	tree: TTree;
}

export interface EngineDiagnostics<TRoot = unknown, TTree extends object = object> {
	readonly buildProfile: string | undefined;
	parseAndRead(source: string, options?: ParseOptions): ParsedRead<TRoot, TTree>;
	/**
	 * The line-break whitespace a read node owns as trivia, on each side in
	 * source order: the whitespace member each run reads as and the byte its
	 * run starts at. Asked of the parse that read the node.
	 */
	lineGapsOf(address: LineGapAddress): LineGaps;
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

export interface Engine<API extends LanguageAPI, M extends ApiSurface = 'default'> extends EngineIdentity<API> {
	readonly build: BuildSurface<API, M>;
	readonly is: API['is'];
	readonly kinds: API['kinds'];
	readonly types: API['types'];
	readonly diagnostics: EngineDiagnostics;
	readonly isNode: (value: unknown) => value is API['node'];
	readonly isParsedNode: (value: unknown) => value is API['node'];
	readonly isFactoryNode: (value: unknown) => value is API['node'];
	readonly isErrorNode: (value: unknown) => value is API['node'];
	readonly isEmptyNode: <N extends API['empty']['node']>(
		node: N
	) => node is N & Extract<API['empty'], { readonly node: N }>['empty'];
	readonly parse: (source: string, options?: ParseOptions) => API['root'];
	readonly read: (path: string, options?: ParseOptions) => Promise<API['root']>;
	readonly render: RenderCall<API, Draft<API>> & RenderCall<API, StoredInput<API> | RenderBuilder<API>>;
	readonly create: (path: string, fn: (build: API['build']) => API['root']) => Pending;
	readonly edit: (path: string, fn: (root: API['root']) => API['root']) => Pending;
	readonly write: (path: string, node: API['root']) => Pending;
	readonly dispose: () => void;
}

export type RenderCall<API extends LanguageAPI, Input> = <const R extends API['options'] = API['options']>(
	node: Input,
	options?: R & RenderOptionsCheck<API, R, keyof RenderCallOptions> & RenderCallOptions
) => Rendered;

export interface Renderable<Kind extends number> extends Pick<NodeMethods, '$render'> {
	readonly $type: Kind;
}

type Draft<API extends LanguageAPI> = Renderable<Extract<API['node']['$type'], number>>;

type StoredInput<API extends LanguageAPI> = API['node'] | API['fixedTextKindId'];

type RenderBuilder<API extends LanguageAPI> = (build: API['build']) => API['node'];

type RenderInput<API extends LanguageAPI> = StoredInput<API> | Draft<API>;

export type RenderArgument<API extends LanguageAPI> = RenderInput<API> | RenderBuilder<API>;

export type RenderOptionsCheck<API extends LanguageAPI, R, Extra extends PropertyKey = never> =
	IsExactly<R, API['options']> extends true
		? unknown
		: IndentOption<R extends { readonly indent?: infer I extends string } ? I : string, API['indentChar']> & {
				readonly [K in Exclude<keyof R, keyof API['options'] | Extra>]: never;
			};

type IsExactly<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export interface EngineOptions<API extends LanguageAPI, M extends ApiSurface = 'default'> {
	readonly api?: M;
	readonly render?: API['options'];
	readonly format?: FormatRecord;
	readonly intercept?: readonly Interceptor<API>[];
}

export interface Interceptor<API extends LanguageAPI> {
	build?(call: { readonly path: readonly string[]; readonly args: readonly unknown[] }, next: () => API['node']): API['node'];
	render?(call: { readonly node: RenderInput<API>; readonly options: API['options'] }, next: () => string): string;
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

export type NodeOfNamespaces<NsMap extends object> = Extract<
	{
		[Id in keyof NsMap]: NsMap[Id] extends { readonly Node: infer N; readonly Bound: infer B }
			? N | B | (NsMap[Id] extends { readonly Parsed: infer P } ? P : never)
			: never;
	}[keyof NsMap],
	object
>;

export type Types<E> = E extends Engine<infer API, ApiSurface> ? API['types'] : never;
export type ApiOf<L> = L extends LanguageIdentity<infer API> ? API : never;
