import type { AnyUntypedNode, ErrorNode, ErrorRegion, GrammarTriviaEntry, TriviaItem, TriviaSetter } from './core-types.ts';
import type { IndentOption } from './options.ts';
import type { Admit, Snapshot } from './node-surface.ts';
import type { KindMembership, QueryFacet, QueryFlags, QuerySlotFlags, QuerySlots } from './query.ts';
import type { PortableRows, PortableSurface } from './portable.ts';

export interface TriviaFacts<Kind extends number = number> {
	kindName(type: Kind): string | undefined;
	readonly kinds: ReadonlySet<string>;
	/** The kinds whose template renders an inner side, where an empty node of the kind holds its trivia. */
	readonly innerKinds: ReadonlySet<string>;
	/**
	 * Engine plumbing, not for callers: the kind ids of what a rebuild
	 * constructs around an existing node, the kinds enrich mints (hoisted) and
	 * the alias envelopes. Such a wrapper has no source of its own, so the node
	 * it holds stands for it where source adjacency is judged.
	 */
	readonly rebuildWrappers: ReadonlySet<number>;
	/**
	 * Engine plumbing, not for callers: the kind ids of the grammar's list
	 * kinds, the nodes whose one array slot holds a list's items. A rebuilt
	 * list of one of these stands for the list it replaces; a construct that
	 * holds an array between its own delimiters, such as a string, is not one.
	 */
	readonly listKinds: ReadonlySet<number>;
	/**
	 * The kind ids of the trivia members that spell layout rather than
	 * content: the whitespace members, the depth members and the line
	 * continuations. Comments are content and are not among them.
	 */
	readonly layout: ReadonlySet<number>;
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
	 * How many levels the parse reads: one by default, `Infinity` for the whole
	 * tree. A node past the depth is read when an accessor first reaches it.
	 *
	 * The choice changes when the work is done, never the result: an untouched
	 * node renders its source bytes whatever depth it was read at.
	 */
	readonly depth?: number;
	/**
	 * `'throw'` makes a parse whose source did not parse cleanly throw a
	 * `ParseErrors` carrying the root's `$errors`, in place of returning the
	 * root. Without it a parse always returns the root, and `$errors` lists
	 * the regions.
	 */
	readonly errors?: 'throw';
}

export interface EngineIdentity<API extends LanguageAPI = LanguageAPI> {
	readonly language: LanguageIdentity<API>;
	readonly renderModuleHash: string;
	readonly options: API['options'] | undefined;
	readonly trivia: TriviaFacts<API['kindId']>;
	/** The rows the language's portable classifications are read from, when its grammar has bindings. */
	readonly portable?: PortableRows;
}

export interface GrammarTypeMap {
	readonly namespaces: object;
	readonly empty: { readonly node: unknown; readonly empty: unknown };
	readonly trivia: unknown;
}

export interface NodeMethods<Trivia = any> {
	$render(): string;
	/**
	 * The node's rendered text, the same as `$render()`, so a node interpolated into a template string or
	 * concatenated with a string gives its text. A parsed leaf, a built leaf and a structural node alike.
	 *
	 * @returns The text the engine renders for the node.
	 * @throws As `$render()` does, when the node cannot render.
	 */
	toString(): string;
	$trivia: TriviaSetter<this, Trivia>;
}

export interface GrammarInnerTrivia<N, Trivia> {
	inner(): readonly TriviaItem<Trivia>[];
	inner(...items: GrammarTriviaEntry<Trivia>[]): N;
}

/**
 * The render options every language shares, under the `layout` group: what a caller holding an
 * `Engine<LanguageAPI>` can pass to `render`. A language's own options add its kinds' option sites
 * and narrow `layout` to the units it admits.
 */
export interface CommonRenderOptions {
	readonly layout?: { readonly indent?: string; readonly newline?: string };
}

export interface LanguageAPI {
	readonly name: string;
	readonly build: object;
	readonly is: object;
	readonly kinds: object;
	readonly types: object;
	readonly root: AnyUntypedNode & ParsedRoot;
	readonly node: AnyUntypedNode;
	readonly fixedTextKindId: number;
	readonly kindId: number;
	readonly options: object & CommonRenderOptions;
	readonly indentChar: string;
	readonly empty: GrammarTypeMap['empty'];
	readonly portable?: PortableSurface;
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
	/**
	 * The language's guards, the same object as every engine's `is` (an engine of a descriptor copied from another binds the guards
	 * to the copy instead). Each narrows a node of this language by its kind, and refuses
	 * a node of another language or a value no engine stamped. A supertype or member guard also takes a bare kind id, and passes
	 * it when it is one of its kinds. Importing the descriptor gives them without loading the engine. On a grammar with bindings,
	 * `is.portable` holds the language's portable guards: a view over the shared portable tree, with the same paths, whose guards
	 * read a node of this language or a kind id of it (a keyword leaf such as `u8` classifies). A kind id is read through the rows an
	 * engine of the language loaded, so a guard given one before any engine of the language exists throws.
	 */
	readonly is: API['is'];
	/** The language's kind ids by name, the same object as every engine's `kinds`. On a grammar with bindings, `kinds.portable` holds the shared portable kinds. */
	readonly kinds: API['kinds'];
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

/** How a parsed tree's nodes cross from the native engine: as objects, or as records read in place (`EngineOptions.nodeStorage`). */
export type NodeStorage = 'object' | 'arena';

export interface NativeEngineOptions<O extends object = Readonly<Record<string, unknown>>> {
	readonly options?: O;
	readonly nodeStorage?: NodeStorage;
}

/** The structure facts the generated types prove for one kind's built nodes, by slot storage key. An engine constructed with `verifyStructure: 'runtime'` checks them when a node is built or rebuilt. */
export interface StructureRow {
	readonly kind: string;
	/** `[storageKey, slot]`: the slot holds a value. */
	readonly required?: readonly (readonly [storageKey: string, slot: string])[];
	/** `[storageKey, label]`: the list holds at least one item. */
	readonly nonEmpty?: readonly (readonly [storageKey: string, label: string])[];
	/** `[storageKey, label, expected]`: the slot holds a built node, never bare text. */
	readonly nodeOnly?: readonly (readonly [storageKey: string, label: string, expected: string])[];
}

/** Each kind's {@link StructureRow} by kind id; a kind with nothing to check has no row. */
export type StructureTable = Readonly<Record<number, StructureRow>>;

export interface LanguageHooks<API extends LanguageAPI> {
	readonly name: API['name'];
	readonly renderModuleHash: string;
	readonly build: API['build'];
	readonly trivia: TriviaFacts<API['kindId']>;
	readonly querySlots: QuerySlots;
	readonly queryFlags?: QueryFlags;
	readonly querySlotFlags?: QuerySlotFlags;
	readonly structure: StructureTable;
	readonly membership: KindMembership;
	createNative(options?: NativeEngineOptions<API['options']>): NativeLanguageEngine<API>;
	wrap(root: unknown, tree: unknown): API['root'];
	hydrate(node: unknown, tree: unknown): unknown;
	readonly portable?: PortableRows;
}

export interface NativeLanguageEngine<API extends LanguageAPI> {
	render(node: AnyUntypedNode | number, options?: API['options']): Rendered;
	parseAndRead: EngineDiagnostics<AnyUntypedNode>['parseAndRead'];
	readonly buildProfile?: EngineDiagnostics['buildProfile'];
	dispose(): void;
}

export interface ParsedRead<TRoot = unknown, TTree extends object = object> {
	root: TRoot;
	tree: TTree;
}

/** What a whole-source parse always stamps on its root: the regions of the source that did not parse. */
export interface ParsedRoot {
	/** Every ERROR and MISSING region of the source, in source order; empty when the source parsed cleanly. */
	readonly $errors: readonly ErrorRegion[];
}

export interface EngineDiagnostics<TRoot = unknown, TTree extends object = object> {
	readonly buildProfile: string | undefined;
	parseAndRead(source: string, options?: ParseOptions): ParsedRead<TRoot & ParsedRoot, TTree>;
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

/** The facet `engine.query` returns: the node's own `$query` result, or a leaf's empty facet. */
export type FacetOf<N> = N extends { readonly $query: () => infer F } ? F : QueryFacet<N, {}>;

export interface Engine<API extends LanguageAPI, M extends ApiSurface = 'default'>
	extends EngineIdentity<API>, Disposable {
	readonly build: BuildSurface<API, M>;
	readonly is: API['is'];
	readonly kinds: API['kinds'];
	readonly types: API['types'];
	readonly diagnostics: EngineDiagnostics<AnyUntypedNode>;
	readonly isNode: (value: unknown) => value is API['node'];
	readonly isParsedNode: (value: unknown) => value is API['node'];
	readonly isFactoryNode: (value: unknown) => value is API['node'];
	/** Whether `value` is a parsed ERROR node of this engine's language, read in a slot or as a trivia item. */
	readonly isErrorNode: (value: unknown) => value is ErrorNode;
	/**
	 * Whether `node` is this engine's node of a kind with inner gaps and no child of it holds
	 * sides, so it takes `$trivia.inner`. A child holds sides when it is named, not an extra or
	 * `ERROR`, and has width: read from the tree for a parsed node, so its zero-width automatic
	 * semicolon holds none, and from the rendered text for a built one. A child with text (a real
	 * `;`) holds sides.
	 */
	readonly isEmptyNode: <N extends API['empty']['node']>(
		node: N
	) => node is N & Extract<API['empty'], { readonly node: N }>['empty'];
	/**
	 * Parses `source` and returns its root. The root's `$errors` lists every
	 * region of the source that did not parse, and is empty for a clean parse.
	 *
	 * @throws `ParseErrors` when `options.errors` is `'throw'` and the source
	 * did not parse cleanly.
	 */
	readonly parse: (source: string, options?: ParseOptions) => API['root'];
	/**
	 * The query facet of a node this engine parsed: what `node.$query()` returns for a node with
	 * structure, a view per slot over the slot's items, and `$children` and `$descendants`. A parsed
	 * leaf has no `$query` member; its facet has no slots and nothing below it.
	 *
	 * @throws When `node` holds no parsed tree (a built node, a draft, or a copy that lost its tree):
	 * `$commit()` it first. Also when its tree's engine is disposed.
	 */
	readonly query: <N extends API['node']>(node: N) => FacetOf<N>;
	readonly read: (path: string, options?: ParseOptions) => Promise<API['root']>;
	readonly render: RenderCall<API, Draft<API>> & RenderCall<API, StoredInput<API> | RenderBuilder<API> | SnapshotInput<API>>;
	readonly create: (path: string, fn: (build: API['build']) => API['root']) => Pending;
	readonly write: (path: string, node: API['root']) => Pending;
	/** Releases the native engine; `using` invokes the same cleanup at scope exit. */
	readonly dispose: () => void;
}

export type RenderCall<API extends LanguageAPI, Input> = <const R extends API['options'] = API['options']>(
	node: Input,
	options?: R & RenderOptionsCheck<API, R>
) => Rendered;

/**
 * A node of one of the kinds `Kind`, built, parsed or edited: what `engine.render` takes and what a
 * builder parameter, config field or `$with` setter admits where a slot names a node. It is checked by
 * kind (`$type`) and by either `$render` or the tree it was parsed from (`HoldsTree`), never by the
 * node's other members.
 */
export type Renderable<Kind extends number> = Admit<{ readonly $type: Kind }>;

type Draft<API extends LanguageAPI> = Renderable<Extract<API['node']['$type'], number>>;

type StoredInput<API extends LanguageAPI> = API['node'] | API['fixedTextKindId'];

type RenderBuilder<API extends LanguageAPI> = (build: API['build']) => API['node'];

type SnapshotInput<API extends LanguageAPI> = Snapshot<Extract<API['node']['$type'], number>>;

type RenderInput<API extends LanguageAPI> = StoredInput<API> | Draft<API> | SnapshotInput<API>;

export type RenderArgument<API extends LanguageAPI> = RenderInput<API> | RenderBuilder<API>;

export type RenderOptionsCheck<API extends LanguageAPI, R, Extra extends PropertyKey = never> =
	IsExactly<R, API['options']> extends true
		? unknown
		: IndentOption<R extends { readonly layout?: { readonly indent?: infer I extends string } } ? I : string, API['indentChar']> & {
				readonly [K in Exclude<keyof R, keyof API['options'] | Extra>]: never;
			} & LayoutKeysCheck<API, R>;

type DeclaredLayout<API extends LanguageAPI> = API['options'] extends { readonly layout?: infer G } ? NonNullable<G> : object;

type LayoutKeysCheck<API extends LanguageAPI, R> = R extends { readonly layout?: infer L extends object }
	? { readonly layout?: { readonly [K in Exclude<keyof L, keyof DeclaredLayout<API>>]: never } }
	: unknown;

type IsExactly<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** A language whose grammar has bindings, so it has a portable surface. */
export type PortableLanguageAPI = LanguageAPI & { readonly portable: PortableSurface };

/** The options of a portable engine. */
export interface PortableEngineOptions {
	readonly api: 'portable';
}

/**
 * An engine over a language's portable vocabulary: what a node of the language reads as, by vocabulary path.
 * Parsing, rendering and building are not part of it yet; a node to classify comes from the language's default engine.
 */
export interface PortableEngine<API extends PortableLanguageAPI> extends EngineIdentity<API> {
	/** Per vocabulary path, the grammar kind ids that read as it or a path under it (`$ids`), and the paths under it. */
	readonly kinds: API['portable']['kinds'];
	/**
	 * Per vocabulary path, a guard that holds for a node of this language reading as it or a path under it, and the guards of
	 * the paths under it. A path segment can shadow a function property (`call`, `name`), so the guards are called directly,
	 * never through `call`, `apply` or `bind`.
	 */
	readonly is: API['portable']['is'];
}

export interface EngineOptions<API extends LanguageAPI, M extends ApiSurface = 'default'> {
	readonly api?: M;
	readonly render?: API['options'];
	readonly intercept?: readonly Interceptor<API>[];
	/**
	 * Whether a built node's structure is checked at run time. `'compileTimeOnly'` (the default) trusts the generated types for
	 * required slots, non-empty lists and slots that take a built node. `'runtime'` also checks them when a node is built or
	 * rebuilt, and throws naming the kind and the slot. Text checks (leaf patterns, reserved and keyword words), coordinate
	 * checks and read checks run in both modes.
	 */
	readonly verifyStructure?: 'compileTimeOnly' | 'runtime';
	/**
	 * How a parsed tree's nodes cross from the native engine. `'object'` (the default) reads each node as an object.
	 * `'arena'` reads each node as a view over its record in the tree's native arena: its accessors read the record's
	 * cells, and a node's text is one native call when read. Both give the same nodes, kinds and text.
	 *
	 * @throws When `'arena'` is asked of an addon built without the `arena` feature.
	 */
	readonly nodeStorage?: NodeStorage;
}

export interface Interceptor<API extends LanguageAPI> {
	build?(call: { readonly path: readonly string[]; readonly args: readonly unknown[] }, next: () => API['node']): API['node'];
	render?(call: { readonly node: RenderInput<API>; readonly options: API['options'] }, next: () => string): string;
	parse?(call: { readonly source: string }, next: () => API['root']): API['root'];
	file?(
		change: FileChange & { readonly verb: 'create' | 'write' },
		next: () => Promise<void>
	): Promise<void>;
}

export interface Project extends AsyncDisposable {
	readonly directory: string | null;
	engine<API extends LanguageAPI>(language: Language<API>, options?: EngineOptions<API>): Promise<Engine<API>>;
	staged(): readonly string[];
	diff(): readonly FileChange[];
	files(): ReadonlyMap<string, string>;
	save(): Promise<void>;
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
			? NsMap[Id] extends { readonly Parsed: infer P } ? ([P] extends [never] ? N | B : B | P) : N | B
			: never;
	}[keyof NsMap],
	object
>;

export type Types<E> = E extends Engine<infer API, ApiSurface> ? API['types'] : never;
export type ApiOf<L> = L extends LanguageIdentity<infer API> ? API : never;
