import type { QueryFlags, QueryPlan, QuerySlots, QuerySubject, SlotSubject, StepAnchor } from './query.ts';

/** A portable kind: one vocabulary path, the same object for every language. */
export type PortableKind<Path extends string = string> = { readonly $path: Path };

/** One step of a condition: a slot by its numbers, narrowed to its first or last node when `anchor` is set, or reaching its node only when it holds exactly one (`only`). */
export interface PortableStep extends SlotSubject {
	readonly anchor?: StepAnchor;
}

/** One condition of a read entry's test: `plan` holds over the nodes the `via` steps reach, together, from the tested node (`up` 0) or its `up`-th enclosing context node. */
export interface PortableCondition {
	readonly up: number;
	readonly via: readonly PortableStep[];
	readonly plan: QueryPlan<QuerySubject>;
}

/** A way a kind reads as a vocabulary path: its placement, nearest enclosing kind first (`null` admits any kind), and the conditions that must all hold. */
export interface PortableReadEntry {
	readonly path: string;
	readonly within: readonly (number | null)[];
	readonly test: readonly PortableCondition[];
}

/** A vocabulary path's kind ids, and whether they decide it: every way those kinds read lands at or under the path, one of them unconditionally. */
export interface PortablePath {
	readonly ids: readonly number[];
	readonly exact: boolean;
}

/**
 * A bound grammar's portable classification: each path's kind ids, each kind's read entries in the order they are tried, the text of each
 * fixed-literal kind id, and the fixed-literal kinds whose meaning is a value, which read as their path and not as their text.
 */
export interface PortableTable {
	readonly paths: Readonly<Record<string, PortablePath>>;
	readonly entries: Readonly<Record<number, readonly PortableReadEntry[]>>;
	readonly facts?: Readonly<Record<number, readonly PortableFact[]>>;
	readonly fixedText: Readonly<Record<number, string>>;
	readonly literals: readonly number[];
}

/**
 * A fact a node's container spells beside it, with one item of its `items` slot (a decorator beside the definition it decorates). It holds
 * on the first item `test` holds on where, when `same` is set, the item's text at `same.item` equals the node's text at `same.node`. A
 * holding fact reads the node as `path`, or sets `flag`; the read leaves its item out of the container's `member` and records where it sat
 * under `name` in `$at`, with the text of the item's `spelled` slot as its spelling.
 */
export interface PortableFact {
	readonly name: string;
	readonly path?: string;
	readonly flag?: string;
	readonly container: number;
	readonly member: string;
	readonly items: SlotSubject;
	readonly test: QueryPlan<QuerySubject>;
	readonly spelled?: SlotSubject;
	readonly same?: { readonly item: readonly PortableStep[]; readonly node: readonly PortableStep[] };
}

/** Where a read found a fact its container spells: the index of its item among the container's items, and the item's spelling as read. */
export interface PortablePlace {
	readonly index: number;
	readonly spelling?: string;
}

/** What a bound grammar's engine reads portable classifications from: its {@link PortableTable}, the slots its conditions name, and each kind's flag plans. */
export interface PortableRows {
	readonly table: PortableTable;
	readonly querySlots: QuerySlots;
	readonly flags: QueryFlags;
}

/** How a strict builder takes its input: a config object (`config`), one value (`direct`, `forwarded`), its elements as arguments (`spread`, `elements`), its text (`text`, `placed`), or nothing (`constant`). */
export type PortableCallShape = 'config' | 'spread' | 'text' | 'constant' | 'nullary' | 'direct' | 'elements' | 'forwarded' | 'placed';

/**
 * How a mount's builder takes its input: nothing (`none`), the holder's own input (`holder`), the seated kind's input (`child`), the holder's
 * config merged with the seated kind's (`merge`), or the holder's config with the seated kind's input (`keyed`) or arguments (`keyedArgs`) at the
 * mounted key.
 */
export type PortableMountCall = 'none' | 'holder' | 'child' | 'merge' | 'keyed' | 'keyedArgs';

/** A `keyed` or `keyedArgs` mount: the key that takes the seated kind's input, and the call shape that input takes. */
export interface PortableKeyedMount {
	readonly call: 'keyed' | 'keyedArgs';
	readonly key: string;
	readonly seats: PortableCallShape;
	readonly outer?: PortableKeyedMount;
}

/**
 * A mount's call and the key it seats its kind at. Where the mount's holder is itself seated at a key of its own holder, `outer` says how the
 * mount's builder takes the holder's input there, nearest holder first.
 */
export type PortableMount =
	| PortableKeyedMount
	| { readonly call: Exclude<PortableMountCall, 'keyed' | 'keyedArgs'>; readonly key: string; readonly outer?: PortableKeyedMount };

/**
 * One step from a holder toward a member's slot: the config key it fills, the builder of the kind the next step sits in (absent when that kind
 * has no builder and its config fills the key as is), and `optional` where the slot at the key may be left out. An empty list leaves out the
 * first optional slot on its way, through the steps and then the containers. A `mounted` step's builder is a mount: it builds the holder itself
 * with the kind at the key seated in it, taking its input as the mount says, and a deeper mount on the same holder replaces it. A `flatten`
 * step's kind has no builder: its holder takes the next step's key in its own input, in place of this one. A `seated` step's kind has no
 * builder either: its holder takes, at the key, the arguments that kind's call shape gives its input. A `many` step's slot holds a list, so
 * the kind built for the next step is the one element of it.
 */
export interface PortableSlotStep {
	readonly key: string;
	readonly builder?: string;
	readonly optional?: true;
	readonly flatten?: true;
	readonly seated?: PortableCallShape;
	readonly many?: true;
	readonly mounted?: PortableMount;
}

/**
 * A container a member's value sits in: its builder, absent when its holder builds it, the key of its element slot, and `optional` where that
 * slot may be left out. A `mounted` container's builder is a mount on the holder of the member's slot, so that holder is built through it. A
 * `flatten` container's holder takes the container's element key in its own input, in place of the slot that holds the container. `through`
 * lists the element keys of the containers a mounted container stands in for, outermost first: a parsed tree passes through them, while the
 * build reaches the container through its mount. `members` are the element's members whose slots are the container's own: the build fills them
 * when it wraps the element, and the read takes them when it unwraps the container to the element.
 */
export interface PortableContainer {
	readonly builder?: string;
	readonly key: string;
	readonly optional?: true;
	readonly mounted?: PortableMount;
	readonly flatten?: true;
	readonly through?: readonly string[];
	readonly members?: readonly PortableMemberStep[];
}

/**
 * A place a member's value sits: the holder kind and key it is picked at (an arm's `holders` names them), the kinds a value there has and,
 * of those, the kinds it holds only when one of their claims reads them (`refined`; any other value of such a kind sits through its container), the
 * builder text given for the seat builds through (`leaf`) and the kinds whose text that builder builds back (`texts`), whether the holder
 * spells free text given there itself (`text`), the kind each
 * fixed-text token the seat admits has, keyed by its text (`tokens`), and the containers the build puts around it, outermost first. A seat that holds many (`many`) takes a list; of a list's seats, the `final` ones
 * hold its last element and only it. `contents` keys, by kind, the content slot of each lexed kind only a flag builds: such a value reads
 * there as the text of that slot, and the flag writes its affix.
 */
export interface PortableSeat {
	readonly at: readonly [holder: number, key: string];
	readonly kinds: readonly number[];
	readonly refined?: readonly number[];
	readonly leaf?: string;
	readonly texts?: readonly number[];
	readonly text?: true;
	readonly tokens?: Readonly<Record<string, number>>;
	readonly pattern?: { readonly source: string; readonly flags: string };
	readonly within?: readonly PortableContainer[];
	readonly many?: true;
	readonly final?: true;
	readonly contents?: Readonly<Record<number, string>>;
}

/**
 * A member of a build arm: the steps to its slot, whether the slot holds a list, and the seats a value finds in the slot, the slot's own first.
 * `list` is the member's arity as the vocabulary declares it: a list member reads and builds as a list whatever its slot holds, and a member
 * of one value reads one value from a slot that holds many. It is absent for a member the vocabulary does not declare.
 * A route that enters a kind the arm does not make `requires` other members to fill that kind's required slots: each group names the members
 * any one of which fills one slot, so the route is taken only when every group has a member present. `reads` lists the kinds the member
 * reads from its slot where its binding captures only some of what the slot holds; a read keeps only values of those kinds.
 */
export interface PortableMemberStep {
	readonly name: string;
	readonly steps: readonly PortableSlotStep[];
	readonly multiple: boolean;
	readonly list?: boolean;
	readonly seats: readonly PortableSeat[];
	readonly requires?: readonly (readonly string[])[];
	readonly reads?: readonly number[];
}

/** A value an arm or a flag sets at the end of its steps: a fixed literal's kind id, a token's text (with `builder`, the leaf builder that builds that text where the slot holds a leaf node; with `among`, the canonical members a read may hold there without contradicting it, of which `text` is the one built), or the builder that builds the value there; a preset whose last step is mounted sets only that mount. A preset builder takes the member routed to those steps, or the members routed beneath them, as its input, and no input when no member reaches them. */
export interface PortablePreset {
	readonly steps: readonly PortableSlotStep[];
	readonly kind?: number;
	readonly text?: string;
	readonly among?: readonly string[];
	readonly builder?: string;
}

/**
 * A member spelled from named holes: `pattern` is the member's text with each hole written `${string}`, filled in order from the members
 * `holes` names. A spelled text must match `match`, the claim's anchored regex, whose named groups read the holes back out of the text.
 */
export interface PortableTemplate {
	readonly member: string;
	readonly pattern: string;
	readonly holes: readonly string[];
	readonly match: string;
}

/**
 * A fact a container spells beside the node the build builds: the name `$at` records it under, the flag it sets (a fact with none is its
 * arm's path), the container member its item goes in, and the item each of its spellings builds, in the order the grammar's bindings declare
 * them, the first being the one a structure that names no spelling builds. A spelling's `holes` name the structure's members it spells from,
 * each by the keys that reach its place in the item.
 */
export interface PortableSpelledFact {
	readonly name: string;
	readonly flag?: string;
	readonly member: string;
	readonly spellings: readonly PortableSpelling[];
}

/** One spelling of a fact a container spells: the item it builds, and the members of the built structure it fills in. */
export interface PortableSpelling {
	readonly item: PortableStructure;
	readonly holes?: Readonly<Record<string, readonly string[]>>;
}

/**
 * What setting a flag adds to a build, and what leaving it unset writes: where the flag's slot must hold one of two tokens, the other one.
 * A flag that reads a list's delimiter sets those delimiter flags (`delimiter`) on the arm's list builder, or, where the list sits at the
 * steps `list` from the arm's kind, on that list's builder; a build whose list there holds nothing refuses the flag. A flag spelled inside a
 * member's text (`template`) spells that member from its holes when set, and reads them from it where it holds; a build that leaves the flag
 * unset refuses a member text the flag's regex matches.
 */
export interface PortableFlagStep {
	readonly presets: readonly PortablePreset[];
	readonly unset?: readonly PortablePreset[];
	readonly delimiter?: number;
	readonly list?: readonly PortableSlotStep[];
	readonly template?: PortableTemplate;
}

/** A test a build arm passes for its input: a structure that states every `required` member and none of the `absent` ones, the members the path's other arms have and this one lacks (arms with fewer members come first); a structure whose `empty` list members are each left out or empty, for an arm whose kind holds only layout and reads with those lists empty; a flag stated or not; a member's value of one of `kinds`; a fixed literal's text; the boolean a binding declares its kind's value; or the form chosen at a supertype's variant site: the render options' choice at `<variant>/variant`, the `default` form when they make none. */
export type PortablePickTest =
	| { readonly absent: readonly string[]; readonly required: readonly string[] }
	| { readonly empty: readonly string[] }
	| { readonly flag: string; readonly set: boolean }
	| { readonly member: string; readonly kinds: readonly number[] }
	| { readonly text: string }
	| { readonly boolean: boolean }
	| { readonly variant: string; readonly value: number; readonly default?: true };

/** The slot a config builder takes each part of a number's decimal spelling through: its digits before and after the point, its exponent's digits, the exponent marker and the exponent's sign. */
export interface PortableDecimalParts {
	readonly integer?: string;
	readonly fraction?: string;
	readonly exponent?: string;
	readonly marker?: string;
	readonly exponentSign?: string;
}

/**
 * One way a vocabulary path builds: the kind and its builder, the tests that pick it, the holder slots it is picked in, and what it builds from the
 * structure. A fixed literal has no builder and builds as its kind id; a kind its holder's builder builds has none either, and says by `seated`
 * whether the holder takes its config or its sole value. `scalar` is the type of the number a number arm reads (`bigint` where the path's `$value` is
 * a bigint, read and built as one); its path's `builds` names the arm that builds a `$value` of each type. `numeric` says what spells the number: the
 * slots of its kind whose texts, in order, spell it (one slot, or a radix prefix and its digits), or the slot of each part of its decimal spelling, of
 * which `numericRequired` names the ones the kind always spells; an arm with no `numeric` spells it in its kind's whole text. An arm builds the number
 * as its builder's input, or, where its builder takes a config, through its last `numeric` slot or its decimal parts. An integer arm reads its number
 * in the `digits` base after the `digits` affix. Its other members read and build beside the `$value`. A `template`
 * spells its member from the named holes. A `mounted` arm's builder is a mount that builds its holder, the kind
 * `mounted.holder`, with the arm's kind seated at `mounted.key`. A text its claim fixes is a preset; its claim's other tests (a pattern its text matches, a kind it
 * holds) are the path's read tests, which a built node must pass. Where the arm's routes run through different forms of one slot, `owners`
 * lists each set of routes (by index into `members`) that build together; a structure builds through the one owner whose routes take every
 * member it states, by the member's kinds and whether it is a list. `empty` names the list members a structure that leaves them out builds
 * as `[]`: each route of such a member reaches its slot through steps the arm always holds. A `literal` arm's kind is a token whose meaning is a value: it reads as its
 * path, with the `$value` its claim declares, never as its text. A `sole` arm builds a list its claim reads by its own separator: where the
 * `member` holds one item, the list is built with `delimiter`, the separator that makes one item that list. A `content` arm builds a lexed
 * identifier: it reads as its path with the text of its `content` slot as the `$value`, and builds by passing that text to its builder, which
 * writes the affix its path stands for. The `facts` an arm's container spells, in the order the bindings declare them, are its path or flags it reads only through that container; a build puts each one's item in it.
 */
export interface PortableBuildArm {
	readonly kind: number;
	readonly builder?: string;
	readonly mounted?: PortableMount & { readonly holder: number };
	readonly seated?: PortableCallShape;
	readonly scalar?: 'integer' | 'float' | 'bigint';
	readonly numeric?: readonly string[] | PortableDecimalParts;
	readonly numericRequired?: readonly string[];
	readonly digits?: { readonly base: 2 | 8 | 10 | 16; readonly affix: string };
	readonly literal?: { readonly value?: boolean };
	readonly when: readonly PortablePickTest[];
	readonly holders?: readonly (readonly [holder: number, key: string])[];
	readonly members: readonly PortableMemberStep[];
	readonly empty?: readonly string[];
	readonly owners?: readonly (readonly number[])[];
	readonly presets: readonly PortablePreset[];
	readonly flags: Readonly<Record<string, PortableFlagStep>>;
	readonly template?: PortableTemplate;
	readonly facts?: readonly PortableSpelledFact[];
	readonly sole?: { readonly member: string; readonly delimiter: number };
	readonly content?: string;
}

/**
 * A vocabulary path's build arms, tried in order; a path with `root` false builds only inside a holder slot its arms name. Every number arm
 * reads its own `scalar`; `builds` names, for each scalar type, the kind of the one arm that builds a `$value` of that type.
 */
export interface PortableBuildPath {
	readonly root: boolean;
	readonly arms: readonly PortableBuildArm[];
	readonly builds?: Readonly<Partial<Record<NonNullable<PortableBuildArm['scalar']>, number>>>;
}

/**
 * A structure the portable build builds: its vocabulary path, the flags it sets, where the facts its container spells sat (`$at`, by fact
 * name), the value of a scalar or a fixed literal, and its members by name. A member is a structure, a list of them, text (built through its slot's default leaf), a kind id, a scalar, or a node, which is placed
 * as it is.
 */
export interface PortableStructure {
	readonly $path: string;
	readonly $flags?: readonly string[];
	readonly $at?: Readonly<Record<string, PortablePlace>>;
	readonly $value?: string | number | bigint | boolean;
	readonly [member: string]: unknown;
}

/** Where a `$value` builds at a path with no arms of its own: for an integer, a float, `true` or `false`, the nearest descendant path whose arms take it. */
export interface PortableValueBuild {
	readonly integer?: string;
	readonly float?: string;
	readonly true?: string;
	readonly false?: string;
}

/**
 * A delimiter token's facets that carry meaning (`meaning`); its content facet with the kind of the content leaf that reads its text
 * (`content`), since a closer can hold the end of its composite's content; by spelled facet, each spelling that is not its own canonical
 * member mapped to that member (`spellings`); and by spelled facet, the canonical members that are read and never built (`readOnly`).
 */
export interface PortableDelimiterToken {
	readonly meaning: readonly string[];
	readonly content?: { readonly facet: string; readonly reads: number };
	readonly spellings?: Readonly<Record<string, Readonly<Record<string, string>>>>;
	readonly readOnly?: Readonly<Record<string, readonly string[]>>;
}

/**
 * A bound grammar's portable build table: each strict builder's call shape by its key in the strict table, each vocabulary path's arms, at
 * a path with no arms of its own, the paths a `$value` builds through (`values`), and, by kind id, the accessors of the slots that can hold a
 * token read by its interior (`tokens`), and, by delimiter token kind id, its facets that carry meaning (`delimiters`): a delimiter's other
 * facets are spelled from its content, so reading none of them loses nothing. `features` names the vocabulary features the grammar composes,
 * so a build naming a path of a feature it lacks refuses by that feature.
 */
export interface PortableBuildTable {
	readonly builders: Readonly<Record<string, PortableCallShape>>;
	readonly options?: Readonly<Record<string, readonly string[]>>;
	readonly paths: Readonly<Record<string, PortableBuildPath>>;
	readonly values?: Readonly<Record<string, PortableValueBuild>>;
	readonly tokens?: Readonly<Record<number, readonly string[]>>;
	readonly delimiters?: Readonly<Record<number, PortableDelimiterToken>>;
	readonly features?: readonly string[];
}

/**
 * Whether `value` reads as a vocabulary path or one under it, narrowing it to the grammar kinds read there, or to their texts.
 *
 * @typeParam Ids - The grammar kinds read at or under the path.
 * @typeParam Node - The grammar's node union; a node of another language, or one whose language is unknown, is refused.
 * @typeParam Kind - The grammar's kind-id enum: a bare kind id of the language is read by its kind and fixed text. A value typed as
 * a plain `number` is still admitted by the type, since a numeric enum accepts one.
 * @typeParam Text - The fixed texts of the tokens read at or under the path. Where there are any, a string is admitted and holds when
 * it is the text of one of those tokens.
 * @param value - A node of the language, parsed or built, read by the rows of the engine that stamped it, a kind id of the
 * language, or a token's text, each read by the rows its engine loaded.
 * @throws When given a kind id or a text before an engine of the language has loaded.
 */
export type PortableGuard<
	Ids extends number,
	Node extends { readonly $type: number } = { readonly $type: number },
	Kind extends number = never,
	Text extends string = never
> = <T extends Node | Kind | ([Text] extends [never] ? never : string)>(
	value: T
) => value is T extends string ? T & Text : T extends number ? T & Ids : T & { readonly $type: Ids };

/** What a bound grammar adds for the portable engine: its vocabulary namespaces of kind ids and of guards. */
export interface PortableSurface {
	readonly kinds: object;
	readonly is: object;
}
