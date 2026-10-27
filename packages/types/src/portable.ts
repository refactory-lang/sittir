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

/** A bound grammar's portable classification: each path's kind ids, each kind's read entries in the order they are tried, and the text of each fixed-literal kind id. */
export interface PortableTable {
	readonly paths: Readonly<Record<string, PortablePath>>;
	readonly entries: Readonly<Record<number, readonly PortableReadEntry[]>>;
	readonly fixedText: Readonly<Record<number, string>>;
}

/** What a bound grammar's engine reads portable classifications from: its {@link PortableTable}, the slots its conditions name, and each kind's flag plans. */
export interface PortableRows {
	readonly table: PortableTable;
	readonly querySlots: QuerySlots;
	readonly flags: QueryFlags;
}

/** How a strict builder takes its input: a config object (`config`), one value (`direct`, `forwarded`), its elements as arguments (`spread`, `elements`), its text (`text`, `placed`), or nothing (`constant`). */
export type PortableCallShape = 'config' | 'spread' | 'text' | 'constant' | 'direct' | 'elements' | 'forwarded' | 'placed';

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
 * A mount's call. Where the mount's holder is itself seated at a key of its own holder, `outer` says how the mount's builder takes the holder's
 * input there, nearest holder first.
 */
export type PortableMount = PortableKeyedMount | { readonly call: Exclude<PortableMountCall, 'keyed' | 'keyedArgs'>; readonly outer?: PortableKeyedMount };

/**
 * One step from a holder toward a member's slot: the config key it fills, the builder of the kind the next step sits in (absent when that kind
 * has no builder and its config fills the key as is), and `optional` where the slot at the key may be left out. An empty list leaves out the
 * first optional slot on its way, through the steps and then the containers. A `mounted` step's builder is a mount: it builds the holder itself
 * with the kind at the key seated in it, taking its input as the mount says, and a deeper mount on the same holder replaces it.
 */
export interface PortableSlotStep {
	readonly key: string;
	readonly builder?: string;
	readonly optional?: true;
	readonly mounted?: PortableMount;
}

/**
 * A container a member's value sits in: its builder, absent when its holder builds it, the key of its element slot, and `optional` where that
 * slot may be left out. A `mounted` container's builder is a mount on the holder of the member's slot, so that holder is built through it.
 */
export interface PortableContainer {
	readonly builder?: string;
	readonly key: string;
	readonly optional?: true;
	readonly mounted?: PortableMount;
}

/**
 * A place a member's value sits: the holder kind and key it is picked at (an arm's `holders` names them), the kinds a value there has where the
 * member has more than one seat, the builder text given for the seat builds through (`leaf`), and the containers the build puts around it,
 * outermost first. A seat that holds many (`many`) takes a list.
 */
export interface PortableSeat {
	readonly at: readonly [holder: number, key: string];
	readonly kinds?: readonly number[];
	readonly leaf?: string;
	readonly within?: readonly PortableContainer[];
	readonly many?: true;
}

/** A member of a build arm: the steps to its slot, whether the slot holds a list, and the seats a value finds in the slot, the slot's own first. */
export interface PortableMemberStep {
	readonly name: string;
	readonly steps: readonly PortableSlotStep[];
	readonly multiple: boolean;
	readonly seats: readonly PortableSeat[];
}

/** A value an arm or a flag sets at the end of its steps: a fixed literal's kind id, a token's text, or the builder that builds the value there; a preset whose last step is mounted sets only that mount. A preset builder takes the member routed to those steps, or the members routed beneath them, as its input, and no input when no member reaches them. */
export interface PortablePreset {
	readonly steps: readonly PortableSlotStep[];
	readonly kind?: number;
	readonly text?: string;
	readonly builder?: string;
}

/** What setting a flag adds to a build. */
export interface PortableFlagStep {
	readonly presets: readonly PortablePreset[];
}

/** A test a build arm passes for its input: a structure that states every `required` member and none of the `absent` ones, the members the path's other arms have and this one lacks (arms with fewer members come first); a flag stated or not; a member's value of one of `kinds`; a fixed literal's text; or the form chosen at a supertype's variant site: the render options' choice at `<variant>/variant`, the `default` form when they make none. */
export type PortablePickTest =
	| { readonly absent: readonly string[]; readonly required: readonly string[] }
	| { readonly flag: string; readonly set: boolean }
	| { readonly member: string; readonly kinds: readonly number[] }
	| { readonly text: string }
	| { readonly variant: string; readonly value: number; readonly default?: true };

/**
 * One way a vocabulary path builds: the kind and its builder, the tests that pick it, the holder slots it is picked in, and what it builds from the
 * structure. A fixed literal has no builder and builds as its kind id; a kind its holder's builder builds has none either, and says by `seated`
 * whether the holder takes its config or its sole value. `scalar` marks the one arm at the path that builds a number of that type. A `template`
 * spells its member from the named holes. A `mounted` arm's builder is a mount that builds its holder with the
 * arm's kind seated in it. A text its claim fixes is a preset; its claim's other tests (a pattern its text matches, a kind it
 * holds) are the path's read tests, which a built node must pass.
 */
export interface PortableBuildArm {
	readonly kind: number;
	readonly builder?: string;
	readonly mounted?: PortableMount;
	readonly seated?: PortableCallShape;
	readonly scalar?: 'integer' | 'float';
	readonly when: readonly PortablePickTest[];
	readonly holders?: readonly (readonly [holder: number, key: string])[];
	readonly members: readonly PortableMemberStep[];
	readonly presets: readonly PortablePreset[];
	readonly flags: Readonly<Record<string, PortableFlagStep>>;
	readonly template?: { readonly member: string; readonly pattern: string; readonly holes: readonly string[] };
}

/** A vocabulary path's build arms, tried in order; a path with `root` false builds only inside a holder slot its arms name. */
export interface PortableBuildPath {
	readonly root: boolean;
	readonly arms: readonly PortableBuildArm[];
}

/**
 * A structure the portable build builds: its vocabulary path, the flags it sets, the value of a scalar or a fixed literal, and its members by
 * name. A member is a structure, a list of them, text (built through its slot's default leaf), a kind id, a scalar, or a node, which is placed
 * as it is.
 */
export interface PortableStructure {
	readonly $path: string;
	readonly $flags?: readonly string[];
	readonly $value?: string | number | bigint | boolean;
	readonly [member: string]: unknown;
}

/** A bound grammar's portable build table: each strict builder's call shape by its key in the strict table, and each vocabulary path's arms. */
export interface PortableBuildTable {
	readonly builders: Readonly<Record<string, PortableCallShape>>;
	readonly paths: Readonly<Record<string, PortableBuildPath>>;
}

/**
 * Whether `value` reads as a vocabulary path or one under it, narrowing it to the grammar kinds read there.
 *
 * @typeParam Ids - The grammar kinds read at or under the path.
 * @typeParam Node - The grammar's node union; a node of another language, or one whose language is unknown, is refused.
 * @typeParam Kind - The grammar's kind-id enum: a bare kind id of the language is read by its kind and fixed text. A value typed as
 * a plain `number` is still admitted by the type, since a numeric enum accepts one.
 * @param value - A node of the language, parsed or built, read by the rows of the engine that stamped it, or a kind id of the
 * language, read by the rows its engine loaded.
 * @throws When given a kind id before an engine of the language has loaded.
 */
export type PortableGuard<Ids extends number, Node extends { readonly $type: number } = { readonly $type: number }, Kind extends number = never> = <
	T extends Node | Kind
>(
	value: T
) => value is T extends number ? T & Ids : T & { readonly $type: Ids };

/** What a bound grammar adds for the portable engine: its vocabulary namespaces of kind ids and of guards. */
export interface PortableSurface {
	readonly kinds: object;
	readonly is: object;
}
