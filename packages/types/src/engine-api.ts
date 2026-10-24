import type { AnyUntypedNode, ErrorNode, ErrorRegion, GrammarTriviaEntry, TriviaItem, TriviaSetter } from './core-types.ts';
import type { IndentOption } from './options.ts';
import type { Admit, HoldsSource, HoldsTree, Snapshot } from './node-surface.ts';
import type { IsExactly } from './type-utils.ts';
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
	/**
	 * Engine plumbing, not for callers: for each kind with an inner side, the
	 * storage keys of the slots inside its inner gap, between the tokens that
	 * flank it. A built node of the kind is empty when none of them holds a
	 * child that owns sides; a slot outside the gap (a terminator after the
	 * closing brace) does not count.
	 */
	readonly innerRegions: ReadonlyMap<number, readonly string[]>;
	/**
	 * Engine plumbing, not for callers: the kind ids a node stores as a bare
	 * kind id whose kind the parser names, such as an empty statement's `;`.
	 * Inside an inner gap such a unit owns sides; an anonymous token does not.
	 */
	readonly namedUnits: ReadonlySet<number>;
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
	/**
	 * The node's structure as JSON, which `JSON.stringify` writes: its kind name as `$type`, a leaf's text as
	 * `$text`, each slot under its accessor's name, and its comments as `leadingComments`, `trailingComments`
	 * and `innerComments`. An absent slot, an absent keyword and an empty comment side are left out; an empty
	 * list is `[]`. Layout, provenance and the tree a parsed node reads are not written, so the engine's
	 * `reviver` builds the JSON back into a node that renders with the engine's formatting.
	 *
	 * @returns The node's JSON.
	 */
	toJSON(): NodeJSON;
	$trivia: TriviaSetter<this, Trivia>;
}

/**
 * A node as JSON (`NodeMethods.toJSON`): its kind name, a leaf's text, its slots by accessor name, and the
 * comments on each side of it.
 */
export interface NodeJSON {
	readonly $type: string;
	readonly $text?: string;
	readonly leadingComments?: readonly NodeJSON[];
	readonly trailingComments?: readonly NodeJSON[];
	readonly innerComments?: readonly NodeJSON[];
	readonly [slot: string]: NodeJSONValue | undefined;
}

/**
 * What a slot holds in a node's JSON: a node (a kind id is written as a node of that kind), a list, whose
 * empty element is `null`, a keyword's presence as `true`, a string, or `null` for an optional slot that
 * chose none, as a builder takes it.
 */
export type NodeJSONValue = NodeJSON | readonly (NodeJSON | null)[] | true | string | null;

/** Engine plumbing, not for callers: what a language's nodes are written to JSON and revived by. */
export interface NodeJSONFacts {
	/** Each kind's name, by kind id. */
	readonly names: ReadonlyMap<number, string>;
	/** The kind id of the model kind a name names; an alias's display id never answers. Throws for a name no kind has. */
	kindId(name: string): number;
	/** Each kind's slots, by kind id. */
	readonly slots: QuerySlots;
	/** The trivia kinds that spell layout; every other trivia entry is a comment. */
	readonly layout: ReadonlySet<number>;
	/** The kinds whose nodes hold their text. */
	readonly leaves: ReadonlySet<number>;
	/** The alias envelopes built from their content's text, which their builder checks by the envelope's own rule rather than the content kind's: each envelope's kind id to the kind id of the content it holds. */
	readonly textEnvelopes: ReadonlyMap<number, number>;
	/** The kinds a slot holds as a kind id. */
	readonly units: ReadonlySet<number>;
	/** The kind id an optional slot holds when it chose none. */
	readonly blank: number;
	/** The kinds whose builder takes their one repeated slot's items as its rest arguments, after its options: lists, and compounds with a sole repeated slot. */
	readonly spread: ReadonlySet<number>;
	/** Each kind's registered slots, by kind id: the slot names its builder takes in its options argument. */
	readonly options: Readonly<Record<number, readonly string[]>>;
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

export interface NativeEngineOptions<O extends object = Readonly<Record<string, unknown>>> {
	readonly options?: O;
}

/** The structure facts the generated types prove for one kind's built nodes, by slot storage key. An engine constructed with `verifyStructure: 'runtime'` checks them when a node is built or rebuilt. */
export interface StructureRow {
	readonly kind: string;
	/** `[storageKey, slot]`: the slot holds a value. */
	readonly required?: readonly (readonly [storageKey: string, slot: string])[];
	/** `[storageKey, label]`: the list holds at least one item. */
	readonly nonEmpty?: readonly (readonly [storageKey: string, label: string])[];
	/** `[storageKey, label, expected, kinds]`: the slot holds a built node, never bare text; when `kinds` is given, a built node of one of those kinds (membership, so a supertype admits its members). */
	readonly nodeOnly?: readonly (readonly [storageKey: string, label: string, expected: string, kinds?: readonly number[]])[];
	/** The config keys the kind declares; only a kind whose builder takes a config first has it. */
	readonly config?: readonly string[];
	/** `[propertyName, holes, arrival]`: a list the builder takes as input. `holes` lists admit absent items; `arrival` is `'key'` for a config key, or the index the items start at in the builder's arguments (1 after a leading options argument). */
	readonly lists?: readonly (readonly [propertyName: string, holes: boolean, arrival: 'key' | number])[];
}

/** Each kind's {@link StructureRow} by kind id; a kind with nothing to check has no row. */
export type StructureTable = Readonly<Record<number, StructureRow>>;

export interface LanguageHooks<API extends LanguageAPI> {
	readonly name: API['name'];
	readonly renderModuleHash: string;
	readonly build: API['build'];
	readonly trivia: TriviaFacts<API['kindId']>;
	readonly querySlots: QuerySlots;
	/** What the language's nodes are written to JSON by and revived by. */
	readonly json: NodeJSONFacts;
	/**
	 * Builds a node of the kind named `kind`: from one input as a kind tag does (its text as `{ text }`, or its
	 * config), or from the builder's own arguments (a config and its options, or a list's options and items).
	 */
	buildByKind(kind: string, ...input: unknown[]): unknown;
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

type ExactEmptyForm<Entries, N> = Entries extends { readonly node: infer Node; readonly empty: infer Empty }
	? IsExactly<N, Node> extends true
		? Empty
		: never
	: never;

type Representation<N> = N extends HoldsTree ? 'parsed' : N extends HoldsSource ? 'bound' : 'plain';

type NarrowedEmptyForm<Entries, N> = Entries extends { readonly node: infer Node; readonly empty: infer Empty }
	? [Representation<Node>] extends [Representation<N>]
		? [N] extends [Node]
			? Empty
			: never
		: never
	: never;

/**
 * The empty form a language's `empty` map pairs with exactly `N`; for an `N` the map does not name, such as a form
 * intersected with a narrowing or with a caller's own members, the empty form of the entry of the same representation
 * (plain, built or parsed) whose node `N` is assignable to. Each member of a union `N` is looked up on its own.
 */
export type EmptyFormOf<Entries, N> = N extends unknown
	? [ExactEmptyForm<Entries, N>] extends [never]
		? NarrowedEmptyForm<Entries, N>
		: ExactEmptyForm<Entries, N>
	: never;

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
	 * A `JSON.parse` reviver that builds a node's JSON (`NodeMethods.toJSON`) back into this engine's nodes:
	 * `JSON.parse(text, engine.reviver)`. It is bound to the engine, so it can be passed on its own. Every
	 * object with a `$type` is built as a node of that kind, children first, its comments put back on their
	 * sides; other values, and a document's fields around a node, are left as they are. A revived node is
	 * a built node: it renders with the engine's formatting, not the source's.
	 *
	 * @throws When the JSON names a kind this language lacks, a slot its kind lacks, an ERROR node or a leaf
	 * without its text, naming where in the JSON (`$.body.statements[2]: unknown kind 'foo'`); and, when the
	 * engine verifies structure, when a node misses a slot its kind requires.
	 */
	readonly reviver: (key: string, value: unknown) => unknown;
	/**
	 * Whether `node` is this engine's node of a kind with an inner gap and nothing in it holds
	 * sides, so it takes `$trivia.inner`. A parsed node answers from its tree: no child is named,
	 * not an extra or `ERROR`, and with width. A built node answers from what it stores inside the
	 * gap: a stored node, text, or token of a named kind (a real `;`) holds sides; an anonymous
	 * token does not, nor does a slot outside the gap, such as typescript's automatic-semicolon
	 * terminator after `}`, which still renders. A `true` answer narrows `node` to the empty
	 * form of its own type: a plain, built or parsed node to that form's empty counterpart only.
	 */
	readonly isEmptyNode: <N extends API['empty']['node']>(node: N) => node is N & EmptyFormOf<API['empty'], N>;
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
