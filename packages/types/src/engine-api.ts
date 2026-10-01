import type { AnyUntypedNode, ByteRange, Edit, FormatRecord, GrammarTriviaEntry, RenderCallOptions, TriviaSetter } from './core-types.ts';
import type { IndentOption } from './options.ts';

export interface TriviaFacts {
	readonly kindName: (type: AnyUntypedNode['$type']) => string | undefined;
	readonly kinds: ReadonlySet<string>;
	readonly innerGaps: { readonly [kind: string]: readonly string[] };
	readonly whitespace?: { readonly run: RegExp; readonly kindIdByText: { readonly [text: string]: number } };
	readonly comment?: ((text: string) => AnyUntypedNode) | undefined;
}

export interface ParseOptions {
	readonly deep?: boolean;
}

export interface EngineIdentity<API extends LanguageAPI = LanguageAPI> {
	readonly language: Language<API>;
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
	$toEdit(startOrRange: number | ByteRange, endPos?: number): Edit;
	$replace(target: { range(): ByteRange }): Edit;
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

export interface Language<API extends LanguageAPI> {
	readonly name: API['name'];
	readonly fileTypes: readonly string[];
	load(): Promise<LanguageHooks<API>>;
	readonly __api?: API;
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
	applyEdits(source: string, edits: readonly Edit[]): string;
	parseAndRead: EngineDiagnostics['parseAndRead'];
	readonly buildProfile?: EngineDiagnostics['buildProfile'];
	dispose(): void;
}

export interface ParsedRead<TRoot = unknown, TTree extends object = object> {
	root: TRoot;
	tree: TTree;
}

export interface EngineDiagnostics<TRoot = unknown, TTree extends object = object> {
	readonly buildProfile: string | undefined;
	parseAndRead(source: string, options?: ParseOptions): ParsedRead<TRoot, TTree>;
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
	readonly applyEdits: (source: string, edits: readonly Edit[]) => string;
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
export type ApiOf<L> = L extends Language<infer API> ? API : never;
