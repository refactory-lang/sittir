/**
 * compiler/node-map.ts — AssembledNode class hierarchy and derivation
 * helpers.
 *
 * Split from `compiler/rule.ts` so the Rule IR file stays focused on
 * the Rule union itself. The classes here represent what an assembled
 * grammar node looks like after the full pipeline has classified and
 * enriched the Rule — each subclass corresponds to one ModelType
 * (`branch`, `polymorph`, `leaf`, `keyword`, `token`, `enum`,
 * `supertype`, `group`, `multi`). `container` was merged into
 * `branch` (with slot-surface distinctions derived from `slotClass`).
 *
 * Exports:
 *
 * - **Class hierarchy:** {@link AssembledNodeBase} (abstract) +
 *   concrete subclasses + the {@link AssembledNode} discriminated
 *   union.
 * - **Derivation helpers:** {@link deriveFields}, {@link deriveChildren},
 *   {@link hasAnyField}, {@link hasAnyChild} — walk a Rule tree to
 *   produce the field / child metadata the emitters consume.
 * - **Structural predicates:** {@link isSyntheticFieldWrapper} —
 *   classification hint used by template-walker.ts. `isVerbatimTokenStream`
 *   and `hasHiddenExternalRef` are file-private helpers used only by
 *   `AssembledNodeBase.isTextTemplate()` and the renderTemplate() methods.
 *
 * Backward compatibility: `rule.ts` re-exports everything from this
 * file. New code should import from `./node-map.ts` directly.
 */
import type { Rule, RuleSource, SeqRule, ChoiceRule, RepeatRule, Repeat1Rule, StringRule, PatternRule, TokenRule, EnumRule, SupertypeRule, PolymorphRule, PolymorphForm, TerminalRule } from './rule.ts';
import type { WalkSlotUse } from './template-walker.ts';
import type { GeneratedKindEntry } from './generated-metadata.ts';
/**
 * Per-value multiplicity tag. Each entry in a slot's `values` array carries
 * its own multiplicity derived from the grammar rule that produced it.
 *
 * - `optional`      → `T | undefined`        (field: `readonly x?: T`)
 * - `single`        → `T`                    (field: `readonly x: T`)
 * - `array`         → `readonly T[]`          (field: `readonly x: readonly T[]`)
 * - `nonEmptyArray` → `NonEmptyArray<T>`      (field: `readonly x: NonEmptyArray<T>`)
 */
export type Multiplicity = 'optional' | 'single' | 'array' | 'nonEmptyArray';
/**
 * Unresolved kind reference — used during derivation, before the
 * `resolveSlotRefs` pass replaces it with the actual AssembledNode.
 * Kept in the `NodeRef.node` union so diagnostic / serialization paths
 * can surface dangling references as typed values.
 */
export interface UnresolvedRef {
    readonly kind: 'unresolved-ref';
    readonly name: string;
}
/**
 * A slot-content entry that references a grammar node kind. After
 * `resolveSlotRefs` the `.node` field holds the resolved `AssembledNode`;
 * before that pass (or for unresolvable dead-kind references) it holds
 * an `UnresolvedRef`.
 *
 * Per-value `separator` / `trailing` / `leading` replace the prior per-slot
 * `AssembledNonterminal.hasTrailing` / `hasLeading` flags. Only meaningful
 * when this value's `multiplicity` is `'array'` or `'nonEmptyArray'`.
 * Populated by the unified `deriveSlots` walk — undefined on values from
 * non-repeat positions.
 */
/**
 * Slot taxonomy classification for branch/group nodes.
 * Computed post-assembly by `computeSlotClasses()`.
 */
export type BranchSlotClass = {
    tag: 'multiSlot';
} | {
    tag: 'singleSlot';
    arity: 'singular' | 'multiple';
    optional: boolean;
    nonEmpty: boolean;
    slot: AssembledNonterminal;
};
export type FieldStorageKind = 'verbatim' | 'boolean' | 'bitflag' | 'kindEnum';
export interface FieldStorageInfo {
    readonly kind: FieldStorageKind;
    readonly texts: readonly string[];
    readonly enumKinds: readonly string[];
    readonly collapsesMultiplicity: boolean;
}
export interface NodeRef<T extends AssembledNode = AssembledNode> {
    readonly kind: 'node-ref';
    readonly node: T | UnresolvedRef;
    readonly multiplicity: Multiplicity;
    readonly separator?: string;
    readonly trailing?: boolean;
    readonly leading?: boolean;
}
/**
 * A slot-content entry that is an inline string literal (e.g. `'const'`,
 * `'pub'`, an enum member). The `value` is the exact grammar string.
 *
 * See {@link NodeRef} for the per-value `separator` / `trailing` / `leading`
 * semantics.
 */
export interface TerminalValue {
    readonly kind: 'terminal';
    readonly value: string;
    readonly resolvedKind?: string;
    readonly multiplicity: Multiplicity;
    readonly separator?: string;
    readonly trailing?: boolean;
    readonly leading?: boolean;
}
/**
 * Discriminated union of the two entry types inside a slot's `values` array.
 */
export type NodeOrTerminal = NodeRef | TerminalValue;
export declare function isNodeRef(v: NodeOrTerminal): v is NodeRef;
export declare function isTerminalValue(v: NodeOrTerminal): v is TerminalValue;
export declare function isUnresolvedRef(v: NodeRef['node']): v is UnresolvedRef;
/**
 * True when EVERY value in the slot is guaranteed to be present:
 * `single` or `nonEmptyArray`.
 *
 * Plain `array` slots are optional at the transport/render surface: a
 * repeated field with zero occurrences is emitted as a missing slot, not
 * a present-empty collection.
 */
export declare function isRequired(slot: {
    values: readonly NodeOrTerminal[];
}): boolean;
/**
 * True when ANY value has multiplicity `array` or `nonEmptyArray`.
 */
export declare function isMultiple(slot: {
    values: readonly NodeOrTerminal[];
}): boolean;
/**
 * True when EVERY multi-valued value is `nonEmptyArray` (and there is at
 * least one multi-valued value). A mixed `array` + `nonEmptyArray` slot
 * returns `false` — the `array` form allows empty.
 */
export declare function isNonEmpty(slot: {
    values: readonly NodeOrTerminal[];
}): boolean;
export interface SlotCardinality {
    readonly required: boolean;
    readonly multiple: boolean;
    readonly nonEmpty: boolean;
}
export declare function deriveSlotCardinality(slot: {
    values: readonly NodeOrTerminal[];
}): SlotCardinality;
export declare function mergeSlotValues(slots: readonly {
    values: readonly NodeOrTerminal[];
}[]): {
    readonly values: readonly NodeOrTerminal[];
} | undefined;
export declare function deriveMergedSlotCardinality(slots: readonly {
    values: readonly NodeOrTerminal[];
}[]): SlotCardinality;
export declare function deriveChildrenCardinality(children: readonly {
    values: readonly NodeOrTerminal[];
}[]): SlotCardinality;
export interface RenderTemplateSurface {
    readonly slots: readonly RenderTemplateSlot[];
    readonly usesChildren: boolean;
    readonly usesVariant: boolean;
    readonly usesText: boolean;
}
export interface RenderTemplateEntry {
    readonly template: string;
    readonly surface: RenderTemplateSurface;
}
export interface RenderTemplateSlot {
    readonly name: string;
    readonly view: 'scalar' | 'list' | 'field';
    readonly required: boolean;
    readonly hasLeading: boolean;
    readonly hasTrailing: boolean;
}
/**
 * Convert a snake_case name to camelCase — the single source of truth for
 * this transformation in the codegen pipeline. Used by field/child
 * `propertyName` derivation here, and re-exported for emitters and
 * validators that need the same canonical form.
 */
export declare function snakeToCamel(name: string): string;
/**
 * Pluralize a camelCase property name for array/nonEmptyArray slots.
 * Only `propertyName` and `paramName` get pluralized — `storageName`
 * stays singular (tree-sitter facing).
 */
export declare function pluralize(name: string): string;
/**
 * Cheap existence predicate: does this rule's tree contain any field()?
 * Used by pre-assembly phases (classifier, optimizer) that only need to
 * know IF fields exist — not the full list. Shorter-circuits than
 * deriveFields.
 */
export declare function hasAnyField(rule: Rule): boolean;
/**
 * Cheap existence predicate: does this rule's tree contain any symbol
 * reference (visible OR hidden)? Hidden symbols dispatch to concrete
 * subtypes at parse time, so they DO contribute children.
 */
export declare function hasAnyChild(rule: Rule): boolean;
export declare function setAuditKindContext(kind: string | undefined): void;
/** Log accumulated audit counts. Called by codegen entry points. */
export declare function dumpDerivationAudit(label?: string): void;
/**
 * Derive child slots from a canonical rule tree.
 *
 * Two axes of "canonical" apply to deriveChildren:
 *
 * 1. **Branch kinds** — top-level `seq` of field/symbol/wrapper members.
 *    Children are the non-field members (symbol refs, optional /
 *    repeat / repeat1 around refs, choice of refs).
 *
 * 2. **Container kinds** — top-level is a `repeat` / `repeat1` whose
 *    content may be a `seq` of refs (tree-sitter flattens the seq's
 *    elements into sibling children at parse time). `enum_variant_list`
 *    has shape `repeat(seq(repeat(attribute_item), enum_variant),
 *    separator=',', trailing=true)` — the inner seq is load-bearing
 *    template structure AND yields two array children (attribute_item,
 *    enum_variant) flattened together.
 *
 * The walker handles both by treating top-level `seq` members as the
 * canonical unit and recursing through wrappers/choices/nested-seqs
 * when the structure demands it. What it rejects:
 *
 *   - `alias` / `group` / `polymorph` — simplify strips the first two,
 *     assemble classifies the third into its own AssembledPolymorph.
 *     Reaching them here is a real canonicalization gap.
 *
 *   - `variant` / `clause` — post-variant-adoption these should be
 *     either resolved to aliased symbols or promoted to polymorph
 *     forms. Retained as canonicalization-gap signals.
 */
/**
 * Single-walk slot derivation — returns every slot on a kind in declared
 * rule order. Replaces the prior `deriveFields` + `deriveChildren` split
 * (DRY: one source, one derivation). Internally it still delegates to
 * those walkers for the actual rule traversal — they're factored to walk
 * identical input — but produces a single unified `AssembledNonterminal[]`
 * view for consumers that need declared order with full per-slot metadata.
 *
 * @remarks
 * Today the slot ordering is fields-first / children-second because
 * downstream consumers (factory emitter, types emitter) rely on that
 * ordering. A future cleanup could rewrite the walk to preserve true
 * declared-order with one unified pass over the rule tree.
 */
export declare function deriveSlots(rule: Rule, kindEntries?: readonly GeneratedKindEntry[]): readonly AssembledNonterminal[];
/**
 * Detect an override-synthesized "outer field wrapper" that has no
 * corresponding runtime data. The autogen produced by v1's extractor
 * sometimes wraps a multi-member seq directly in an outer
 * `field('name', seq(...))` where the seq's TOP level contains another
 * named field. Tree-sitter doesn't produce a single node value for
 * such wrappers — the inner fields are the real runtime data.
 *
 * The check is deliberately narrow: only direct `field('x', seq(...))`
 * where the top-level seq contains an inner `field('y', ...)`. Deeper
 * nestings (`field('body', symbol(block))` where block's rule definition
 * contains fields) are NOT synthetic — those have real field values
 * that tree-sitter populates at parse time.
 */
export declare function isSyntheticFieldWrapper(content: Rule): boolean;
/**
 * Derive `typeName`, `factoryName`, and `irKey` from a raw grammar kind string.
 *
 * Moved here from assemble.ts so the `AssembledNodeBase` constructor can call
 * it directly, eliminating the need for callers to pre-compute and pass these
 * derived fields.
 */
export declare function nameNode(kind: string): {
    typeName: string;
    factoryName: string;
    irKey: string;
};
export declare abstract class AssembledNodeBase<R extends Rule = Rule> {
    readonly kind: string;
    typeName: string;
    factoryName?: string;
    /**
     * Short key for the ir namespace (`ir.x`). Populated by assemble()
     * via resolveIrKeys() AFTER every node is constructed so that the
     * collision-resolution pass sees the whole NodeMap at once. Emitters
     * should read this rather than recomputing their own shortening.
     *
     * Writable (not readonly) so assemble's post-pass can install the
     * resolved key — the rest of the pipeline should treat it as
     * effectively immutable.
     */
    irKey?: string;
    /**
     * Rule-level provenance. Mirrors the `source` field on the
     * underlying Rule (EnumRule, SupertypeRule, TerminalRule,
     * PolymorphRule). Undefined for branches/containers/groups, which
     * don't have a rule-level classification. The suggested.ts emitter
     * surfaces nodes whose source is `'promoted'` as rule-level
     * override candidates.
     */
    readonly source?: RuleSource;
    abstract readonly modelType: string;
    /**
     * True when this kind requires NO user-supplied arguments to construct.
     *
     * Populated by the `markParameterlessKinds` fixpoint pass in
     * `assemble.ts`. Two classes of parameterless kinds:
     *
     * - **Single-literal terminals** (`AssembledKeyword`): factory takes
     *   `()` and emits a fixed `$text` value. Stamp via `stampExpression`.
     * - **Parameterless compounds**: every required field/child slot
     *   either auto-stamps (literal or referenced keyword) OR references
     *   another parameterless kind. The whole compound can be constructed
     *   by calling its factory with no arguments: `stampExpression` holds
     *   the call expression string (e.g. `"breakExpression()"`).
     *
     * Emitters use this to decide whether a slot pointing at this kind
     * can be auto-stamped in parent factories and omitted from parent
     * Config types.
     */
    isParameterless?: boolean;
    /**
     * Code-gen stamp expression for this parameterless kind — **field
     * context**. Used when a parent stamps this kind into its
     * `$fields` slot. Defined iff `isParameterless` is true. Two shapes:
     *
     * - **Keyword / terminal**: JSON-encoded literal with `as const`
     *   (e.g. `'"break" as const'`). Matches the interface's field type
     *   (`readonly op: "break"`) and the render pipeline's acceptance
     *   of plain string values in `$fields`.
     * - **Parameterless compound**: factory-call string
     *   (e.g. `"breakExpression()"`). Returns the full NodeData.
     *
     * Self-set by `AssembledKeyword` / `AssembledToken` constructors;
     * set for compounds by `markParameterlessKinds` fixpoint pass.
     */
    stampExpression?: string;
    /**
     * Stamp expression for this kind in **child context** — used when a
     * parent stamps this kind into its `$children` slot. Defaults to
     * `stampExpression`, but terminal classes override to return the
     * full NodeData literal (`{ $type, $text, $source, $named }`)
     * because child interfaces expose the NodeData shape
     * (`$children: readonly [Crate]` where `Crate` is
     * `Terminal<"crate", "crate">`), not the plain string.
     *
     * Compounds' `stampExpression` is already a factory call that
     * returns NodeData, so they share the default.
     */
    get stampChildExpression(): string | undefined;
    /**
     * The grammar rule that produced this assembled node. All 10 concrete
     * subclasses store their rule here. The generic parameter `R` narrows
     * this to the exact Rule subset each subclass accepts — the narrowing
     * is truthful at runtime (not just documentation) because every
     * subclass constructor stores its rule argument here.
     *
     * **Protected — no external consumer reaches in.** The project
     * convention: only `renderTemplate()` methods (and other in-class
     * behaviors) read `this.rule` directly. Outside consumers (emitters,
     * assemble/link phases, tests) must go through the class's public
     * getters (`members`, `content`, `separator`, `text`, `values`,
     * `subtypes`, `forms`, `pattern`, `elementRule`, `isTextTemplate`,
     * ...) — if a new use case needs raw rule access, add the
     * corresponding getter here instead of widening this field.
     */
    protected readonly rule: R;
    /**
     * User-facing eligibility: set at assemble time after alias-source
     * analysis completes. Determines whether template, factory, type,
     * and IR emitters should produce output for this node.
     *
     * Rules:
     * - Visible kinds (not `_`-prefixed) — always user-facing UNLESS
     *   modelType is `token` or `multi` (structural helpers with no
     *   API surface).
     * - Hidden kinds (`_`-prefixed) — user-facing ONLY when the kind
     *   is an alias source (some symbol ref elsewhere points at it
     *   via `aliasedFrom`, meaning factories stamp this kind as
     *   `$type` per the source-kind identity model). Otherwise hidden
     *   kinds are inlined / never surface at runtime.
     *
     * Populated by `assemble()`'s `markUserFacing` pass. Defaults to
     * `true` so hand-constructed test fixtures that bypass assemble
     * still have their nodes appear in emitter output.
     */
    userFacing: boolean;
    constructor(kind: string, rule: R, opts?: {
        factoryName?: string;
        irKey?: string;
        source?: RuleSource;
        hidden?: boolean;
    });
    /** A node is hidden when it has no factory (supertype, group, token). */
    get hidden(): boolean;
    /**
     * True when this node's rule shape is a text template — a rule whose
     * parse result is emitted as a single string of text rather than a
     * structured config/children value. Two sources: verbatim-token-stream
     * rules (bare-literal sequences with no fields / symbols), and rules
     * that reach an external hidden token.
     *
     * Consumers (emitters) use this instead of reading `node.rule` directly —
     * per the project convention that only renderTemplate() methods on
     * AssembledNode subclasses reach into the raw rule.
     */
    isTextTemplate(externals: ReadonlySet<string> | undefined): boolean;
    /**
     * Render-template short-circuit for text-shape kinds. Branch /
     * Container / Group all start their `renderTemplate()` with the
     * same two checks — hidden-external-ref and verbatim-token-stream —
     * and return `{{ text }}` when either fires. That preamble is one
     * fact (isTextTemplate) materialised three times; consolidate it
     * here so each subclass's renderTemplate() can short-circuit via
     * a single call.
     *
     * Returns the `{{ text }}` template when the rule is a text
     * template, otherwise `undefined` so the caller proceeds to its
     * structured walk.
     *
     * @see isTextTemplate — the underlying classification.
     */
    protected textTemplate(externals: ReadonlySet<string> | undefined): RenderTemplateEntry | undefined;
    /**
     * Factory function name to emit in factories.ts — factoryName with a
     * trailing `_` when the bare name collides with a JS reserved word.
     * Returns `undefined` for hidden nodes.
     */
    get rawFactoryName(): string | undefined;
    /** Tree interface name: `${typeName}Tree`. */
    get treeTypeName(): string;
    /** Config type alias: `${typeName}Config`. */
    get configTypeName(): string;
    /** Loose-input type alias: `Loose${typeName}` — the camelCase
     *  bag shape accepted by `from()` for programmatic construction. */
    get fromInputTypeName(): string;
    /** `from()` resolver function name: `${factoryName}From` for non-hidden nodes. */
    get fromFunctionName(): string | undefined;
    /**
     * Emit the templates directory entry for this node. Returns `undefined`
     * for nodes that don't need a template (leaves/keywords/enums/tokens
     * render via `.text` directly; supertypes dispatch through their
     * concrete subtype). Structural subclasses (AssembledBranch,
     * AssembledGroup, AssembledPolymorph) override this to walk their
     * rule tree and produce the right shape.
     */
    renderTemplate(_rules?: Record<string, Rule>, _wordMatcher?: RegExp, _externals?: ReadonlySet<string>): RenderTemplateEntry | undefined;
}
/**
 * Unified slot descriptor — covers both named grammar-field slots
 * (source != 'inferred') and inferred positional slots (source == 'inferred').
 * Produced by `deriveSlots` and stored in `AssembledBranch.slots` /
 * `AssembledGroup.slots`. The `source` discriminant replaces the old
 * `AssembledField` / `AssembledChild` split.
 *
 * `AssembledField` and `AssembledChild` have been removed; all consumers
 * use `AssembledNonterminal` directly.
 */
export interface AssembledNonterminal {
    readonly name: string;
    readonly propertyName: string;
    /** Config key — matches ConfigOf projection (CamelCase of name). Always singular. */
    readonly configKey: string;
    readonly storageName: string;
    readonly values: readonly NodeOrTerminal[];
    readonly paramName: string;
    readonly hasTrailing: boolean;
    readonly hasLeading: boolean;
    readonly aliasSources?: Readonly<Record<string, string>>;
    readonly source: 'grammar' | 'override' | 'inlined' | 'enriched' | 'inferred';
    storageInfo?: FieldStorageInfo;
}
/**
 * Derive the slot's referenced kind names from its `values[]`.
 *
 * Replaces the prior `slot.projection.kinds` parallel cache (the kinds
 * were a cache of a derivation from `values`, redundant by construction
 * per DRY — one source, one derivation). The
 * comment at the prior construction site (`Compute projection.kinds
 * from node-ref values only (for backwards-compat with emitters that
 * call projection.kinds)`) was the smoking gun: emitters were already
 * computing this on demand because the cache was a post-hoc convenience.
 *
 * Walks node-ref entries only (terminals contribute no kinds); resolves
 * each `node` field as either an `UnresolvedRef` (use its `name`) or an
 * `AssembledNode` (use its `kind`). Deduplicates while preserving
 * declaration order.
 */
export declare function kindsOf(slot: AssembledNonterminal): readonly string[];
/**
 * Final `$VAR` → `{{ var }}` translation for a template body. Consumes
 * the rule's separator metadata (`joinBy`, `joinByField`, leading /
 * trailing flank permissions) directly — output is a Jinja string the
 * emitter writes verbatim.
 *
 *   `$NAME`       → `{{ name }}`
 *   `$$$NAME`     → `{{ name | join("<sep>") }}` with walker-time sep
 *   `$$$CHILDREN` → one of `join` / `joinWithTrailing` / `joinWithLeading`
 *                   / `joinWithFlanks` based on the rule's repeat flags
 *   `$TEXT`       → `{{ text }}`
 *   `$NEWLINE`    → `\n`
 *   `$INDENT`/`$DEDENT` → empty
 *
 * Brace-escape pass prevents `{$$$CHILDREN}` becoming `{{{ children }}}`
 * (which Nunjucks misreads as a dict literal).
 */
/** @internal — exported for direct unit testing. */
export interface JinjaTranslateMeta {
    joinBy?: string;
    joinByField?: Record<string, string>;
    joinByLeading?: boolean;
    joinByTrailing?: boolean;
    /**
     * Per-field trailing-separator set: names of named fields whose repeat
     * content carries `trailing: true`. Populated from `findFieldsWithRepeatFlag`.
     * Used by `filterForFlanks` to restrict `joinWithTrailing` to the specific
     * fields whose repeats carry the flag — rather than applying it globally
     * whenever the whole rule has any trailing repeat (`joinByTrailing` is
     * global and would incorrectly promote all named fields).
     */
    trailingFields?: ReadonlySet<string>;
    /** Mirror of `trailingFields` for leading-separator fields. */
    leadingFields?: ReadonlySet<string>;
    /**
     * Set of raw field names whose `isRequired` derivation is false.
     * Used by `translateToJinja` to wrap unguarded
     * `$NAME` placeholders with `{% if name | isPresent %}` conditionals
     * so empty optional fields contribute no whitespace to the rendered
     * output. Placeholders already enclosed in a walker-emitted
     * `{% if %}…{% endif %}` block are left untouched.
     */
    optionalFields?: ReadonlySet<string>;
    /**
     * True when the container's children may be empty (the rule is a
     * `repeat()` — zero-or-more — rather than `repeat1()`). When
     * set, `translateToJinja` wraps the flanking spaces around
     * `{{ children | ... }}` inside `{% if children | isPresent %}`
     * conditionals so an empty-children render produces no stray space
     * between the surrounding delimiters (e.g. `{}` instead of `{  }`).
     */
    optionalChildren?: boolean;
}
/** @internal — exported for direct unit testing. */
export declare function translateToJinja(tmpl: string, meta: JinjaTranslateMeta): string;
/** `$$$CHILDREN` is the only slot that carries flank permission. */
/** @internal — exported for direct unit testing. */
export declare function filterForFlanks(key: string, meta: JinjaTranslateMeta): string;
export declare class AssembledBranch<R extends SeqRule | ChoiceRule | RepeatRule | Repeat1Rule | PolymorphRule = SeqRule | ChoiceRule | RepeatRule | Repeat1Rule> extends AssembledNodeBase<R> {
    readonly modelType: 'branch';
    /**
     * Rule with anonymous tokens / structural wrappers stripped.
     * Computed once by assemble() via `simplifyRule(init.rule)` and
     * stored here so derivation walks (`deriveFields`, `deriveChildren`,
     * separator discovery) don't have to re-navigate past delimiter
     * literals on every call. Template emission still reads the raw
     * `rule` because templates need the literals to surface as
     * template text. Stage 1: populated but not yet read.
     */
    readonly simplifiedRule: Rule;
    /**
     * Visible variant-child kinds registered via `variant()` adoption in
     * overrides.ts (empty on non-override-polymorph parents). Populated
     * for parents whose variant children live deep in the rule and were
     * handled by Link's push-down path — they classify as branches
     * rather than polymorphs but still need the metadata for `.from()`
     * dispatch and from.ts generation. Pure metadata; template emission
     * doesn't consult it.
     */
    readonly variantChildKinds: readonly string[];
    /**
     * Slot taxonomy — `singleSlot` when exactly one user-facing slot
     * survives after filtering auto-stamp, hidden-infra, and keyword-
     * presence fields; `multiSlot` otherwise. Set post-assembly by
     * `computeSlotClasses()`.
     */
    slotClass?: BranchSlotClass;
    /**
     * The unified slot Record — every constituent of this branch keyed
     * by its grammar field name (for `field()`-derived slots) or its
     * kind-derived positional name (for inferred slots). Insertion order
     * matches the order produced by `deriveSlots`. Frozen at construction.
     *
     * Canonical slot surface; the per-class `fields` / `children` getters
     * below are convenience views.
     *
     * Two pieces of the locked design are NOT yet enforced here:
     *   - Key remap to `'child'` / `'children'` for `source === 'inferred'`
     *     slots is deferred until grammar overrides explicitly name every
     *     unnamed positional position (Owner A migration). Today, inferred
     *     slots keep their kind-derived name to preserve byte-identity.
     *   - Eager validation (collision throw, >1 unnamed throw, mixed-arity
     *     warn) is deferred to the same future sub-phase. With kind-derived
     *     keys retained, collisions don't naturally occur in the current
     *     grammars.
     */
    protected readonly _slots: Readonly<Record<string, AssembledNonterminal>>;
    constructor(kind: string, rule: R, simplifiedRule: Rule, opts?: {
        factoryName?: string;
        irKey?: string;
        source?: RuleSource;
        variantChildKinds?: readonly string[];
        kindEntries?: readonly GeneratedKindEntry[];
        slotRecord?: Readonly<Record<string, AssembledNonterminal>>;
    });
    get slots(): Readonly<Record<string, AssembledNonterminal>>;
    /**
     * Direct access to the rule's ordered members (seq or choice).
     * Returns an empty array for repeat / repeat1 — those shapes don't
     * carry an ordered member tuple (the `content` is a single repeated
     * rule, surfaced via `children`).
     */
    get members(): readonly Rule[];
    /**
     * Repeat-list separator (when the simplified rule is a `repeat` or
     * `repeat1` carrying a separator captured by Evaluate). Branches
     * derived from non-repeat shapes return `undefined`. Absorbed from
     * the former `AssembledContainer.separator` getter.
     */
    get separator(): string | undefined;
    /**
     * `true` when this branch was the former `AssembledContainer` shape
     * — i.e., its raw rule contained no `field()` declaration. The
     * derivation matches the pre-merge `classifyBranchOrContainer`
     * predicate exactly so emitters that previously branched on
     * `modelType === 'container'` keep byte-identical output. Note that
     * this is *not* the same as `fields.length === 0`: a branch can
     * declare `field()` slots that the simplified rule strips out (e.g.
     * field references whose visible target was inlined away),
     * leaving `fields` empty while the rule still carries field markers.
     * Those kinds were `'branch'` originally and stay on the
     * field-carrying factory path; only kinds with zero `field()` in the
     * raw rule trigger the rest-param container factory shape.
     */
    get isContainerShape(): boolean;
    /**
     * Field-shaped slots only (source !== 'inferred'). Convenience view
     * over `slots` for callers that need only named-grammar-field slots.
     */
    get fields(): readonly AssembledNonterminal[];
    /**
     * Inferred positional slots only (source === 'inferred'). Convenience
     * view over `slots` for callers that need only unnamed positional slots.
     * Returns empty array when no inferred slots exist.
     */
    get children(): readonly AssembledNonterminal[];
    renderTemplate(rules?: Record<string, Rule>, wordMatcher?: RegExp, externals?: ReadonlySet<string>): RenderTemplateEntry;
}
/**
 * Peel structural passthrough wrappers off a rule until reaching a
 * non-passthrough core. Single source of truth for the "find the
 * meaningful inner rule" walk that otherwise gets re-inlined every
 * time a caller wants to ignore decorative wrappers.
 *
 * Passthroughs:
 * - `optional`, `variant`, `clause`, `group` — pure structural
 *   markers (presence/absence, polymorph variant, override clause,
 *   anonymous group). None contribute their own runtime position.
 * - `alias` — renames the kind without changing the rule's structural
 *   role.
 * - `token`, `terminal` — terminalisation wrappers; the inner rule
 *   carries the actual content shape.
 *
 * @remarks Exhaustive `switch` on `Rule.type`; non-passthrough rules
 * (seq/choice/repeat/repeat1/field/symbol/string/pattern/etc.) are
 * returned as-is. `assertNever` locks the switch shut so adding a new
 * Rule variant becomes a compile error here instead of silently
 * skipping the unwrap step.
 *
 * @see hasHiddenExternalRef, hasExternalBoundaries (this file) and
 *      template-walker.ts `fieldContentIsMultiSibling` — the three
 *      original call sites this helper consolidates.
 */
export declare function unwrapStructuralPassthroughs(rule: Rule): Rule;
export declare class AssembledPolymorph extends AssembledNodeBase<PolymorphRule> {
    #private;
    readonly modelType: 'polymorph';
    readonly source: 'promoted' | 'override';
    /**
     * For source='override' polymorphs: the visible variant child kinds
     * (e.g., ['assignment_eq', 'assignment_type', 'assignment_typed']).
     * These are real kinds in the parse tree (created by the alias() in
     * transform patches) and need to appear as the children union on
     * the parent polymorph's interface. Empty for source='promoted'.
     */
    readonly variantChildKinds: readonly string[];
    slotClass?: BranchSlotClass;
    readonly slots: Readonly<Record<string, AssembledNonterminal>>;
    constructor(kind: string, rule: PolymorphRule | ChoiceRule, forms: AssembledGroup[], opts?: {
        source?: 'promoted' | 'override';
        variantChildKinds?: readonly string[];
        factoryName?: string;
        irKey?: string;
    });
    /** A polymorph's forms are hidden groups synthesized from the choice branches. */
    get forms(): AssembledGroup[];
    get formRules(): readonly PolymorphForm[];
    /**
     * Flattened field list across all forms — the union of every form's
     * named slots (source !== 'inferred'). Used by emitters that need
     * "all fields this polymorph may carry" without caring which form owns
     * each one.
     *
     * Single derivation point for the `forms.flatMap(f => f.fields)` pattern
     * that multiple emitters previously duplicated.
     */
    get allFormFields(): readonly AssembledNonterminal[];
    /**
     * Dedup'd union of form fields — keeps first-occurrence per name so the
     * order matches what emitters see when iterating `this.forms`. Distinct
     * from `allFormFields` (raw flatten with name duplicates) and from
     * `forms[i].fields` (per-form view).
     *
     * Lives only on `AssembledPolymorph` because the dedup semantics are
     * polymorph-specific. Branch/Group consumers should use `.fields`
     * directly; AssembledNode-iterating consumers should narrow on
     * `modelType === 'polymorph'` before calling this.
     */
    get structuralFields(): readonly AssembledNonterminal[];
    /**
     * Dedup'd union of every slot across forms — the "all slots" sibling
     * to {@link structuralFields}. Includes both named-grammar-field
     * slots (`source !== 'inferred'`) and inferred positional slots
     * (`source === 'inferred'`). First-occurrence wins per slot name.
     *
     * Used by graph-traversal walks that don't care about the
     * field/child distinction — kind reachability, alias-source
     * collection, userFacing classification, etc. The fields-only and
     * children-only views remain available via {@link structuralFields}
     * + filtering when the TS-emission shape differs by slot kind.
     */
    get structuralSlots(): readonly AssembledNonterminal[];
    get fields(): readonly AssembledNonterminal[];
    get children(): readonly AssembledNonterminal[];
    renderTemplate(rules?: Record<string, Rule>, wordMatcher?: RegExp, externals?: ReadonlySet<string>): RenderTemplateEntry;
}
/**
 * Abstract base for non-branch ("leaf") kinds — those that have no
 * constituent slots and render as `$text`. Concrete subtypes:
 *
 *   - `AssembledPattern` — open text, optionally regex-validated
 *     (e.g. `identifier`, `integer_literal`)
 *   - `AssembledKeyword` — single fixed named string (e.g. `"fn"`)
 *   - `AssembledToken` — single fixed anonymous delimiter (e.g. `"{"`)
 *   - `AssembledEnum` — closed set of literals (e.g. `"u8" | "u16"`)
 *
 * The base intentionally has no `modelType` — each concrete subclass
 * keeps its own discriminant string (`'pattern'` for Pattern, `'keyword'`,
 * `'token'`, `'enum'`) so byte-identity of generated output is preserved
 * during the taxonomy refactor.
 *
 * Introduced alongside the rename of the previous
 * open-text `AssembledLeaf` class to `AssembledPattern`.
 */
export declare abstract class AssembledLeaf<R extends Rule = Rule> extends AssembledNodeBase<R> {
}
/**
 * Open-text non-branch kind whose surface form is matched by a regex
 * (PatternRule) or produced by an external scanner (TerminalRule).
 * Examples: `identifier`, `integer_literal`, `string_content`.
 *
 * Renamed from the original `AssembledLeaf` class. The `modelType`
 * discriminant is `'pattern'` (renamed from `'leaf'` during the
 * taxonomy-driven emitter dispatch refactor). The new `AssembledLeaf`
 * is now an abstract base (above); `AssembledPattern` is one of its
 * four concrete subclasses.
 */
export declare class AssembledPattern extends AssembledLeaf<PatternRule | TerminalRule> {
    readonly modelType: 'pattern';
    constructor(kind: string, rule: PatternRule | TerminalRule, opts?: {
        factoryName?: string;
        irKey?: string;
    });
    /** The leaf's regex pattern value when the rule is a PatternRule; undefined for TerminalRule. */
    get pattern(): string | undefined;
}
export declare class AssembledKeyword extends AssembledLeaf<StringRule> {
    readonly modelType: 'keyword';
    readonly resolvedKind?: string;
    constructor(kind: string, rule: StringRule, opts?: {
        factoryName?: string;
        irKey?: string;
        hidden?: boolean;
        kindEntries?: readonly GeneratedKindEntry[];
    });
    /** The literal text this keyword produces (read from the StringRule). */
    get text(): string;
    /**
     * Child-context stamp: wrap the literal in a NodeData object so
     * the parent's `$children` slot matches the `Terminal<kind, text>`
     * interface shape. `$named: true` because keywords are named
     * (`_kw_async` / `async` etc. surface as named nodes in tree-
     * sitter's output).
     */
    get stampChildExpression(): string;
}
export declare class AssembledToken extends AssembledLeaf<StringRule | TokenRule> {
    readonly modelType: 'token';
    readonly resolvedKind?: string;
    constructor(kind: string, rule: StringRule | TokenRule, opts?: {
        kindEntries?: readonly GeneratedKindEntry[];
    });
    /**
     * Child-context stamp: wrap the single-literal text in a NodeData
     * object. `$named: false` — tokens are anonymous in tree-sitter's
     * output (non-word literals like `..` / `=>` never have a named
     * entry in `node-types.json`).
     */
    /**
     * The literal text this token produces when its rule body is a
     * single string (post-optimize inline of `token(string)` or
     * `prec(n, string)` wrappers around a bare literal). Returns
     * `undefined` when the body is a `TokenRule` wrapping pattern-based
     * content — those don't have a single user-visible string.
     */
    get text(): string | undefined;
    /**
     * Child-context stamp: wrap the single-literal text in a NodeData
     * object. `$named: false` — tokens are anonymous in tree-sitter's
     * output (non-word literals like `..` / `=>` never have a named
     * entry in `node-types.json`).
     */
    get stampChildExpression(): string | undefined;
}
export declare class AssembledEnum extends AssembledLeaf<EnumRule> {
    readonly modelType: 'enum';
    readonly resolvedKinds: readonly string[];
    constructor(kind: string, rule: EnumRule, opts?: {
        factoryName?: string;
        irKey?: string;
        kindEntries?: readonly GeneratedKindEntry[];
    });
    /** The enum member strings (e.g. `['u8', 'u16', 'usize']`). */
    get values(): string[];
}
export declare class AssembledSupertype extends AssembledNodeBase<SupertypeRule | ChoiceRule> {
    #private;
    readonly modelType: 'supertype';
    constructor(kind: string, rule: SupertypeRule | ChoiceRule, subtypes: string[]);
    /** Resolved concrete kind names in this supertype union. */
    get subtypes(): string[];
}
/**
 * AssembledMulti — hidden repeat helpers that tree-sitter inlines at
 * parse time.
 *
 * Shape: a hidden rule whose top-level content is `repeat` or `repeat1`
 * (possibly wrapped in `optional` / `variant`). Canonical case: python
 *   `_collection_elements: repeat1(choice(expression, yield, list_splat, ...))`
 * used inside `tuple`, `list`, `set`, etc.
 *
 * These never surface as parse-tree nodes — tree-sitter expands the
 * repeat in-place at every referrer. Our codegen therefore:
 *   - Emits NO interface / factory / from-resolver / wrap function /
 *     render template for the helper itself.
 *   - Emits a TYPE ALIAS naming the element union:
 *       `export type CollectionElements = Expression | Yield | ListSplat | …`
 *   - Inlines the repeat at every referrer (`inlineGroupRefs` extends
 *     to cover `multi` alongside `group`), so the referrer's walker
 *     sees `repeat1(...)` directly and sets `multiple: true` on the
 *     child slot → rest-params factory.
 *
 * Mirrors the existing "hidden helper" story:
 *   group    — hidden seq with fields  (inline fields)
 *   supertype — hidden choice of symbols (dispatch to one subtype)
 *   multi    — hidden repeat of union    (inline as multi child slot)
 */
export declare class AssembledMulti extends AssembledNodeBase<RepeatRule | Repeat1Rule> {
    readonly modelType: 'multi';
    constructor(kind: string, rule: RepeatRule | Repeat1Rule, opts?: {
        irKey?: string;
    });
    /** The repeat's inner content type — raw Rule, for downstream
     * consumers that need the element union (types emitter maps this
     * to a union of TypeNames, inlineGroupRefs hands the whole repeat
     * back to referrers). */
    get elementRule(): Rule;
    /** `true` when the source rule is `repeat1` (at least one element);
     * `false` for plain `repeat` (zero-or-more). Referrers thread this
     * into AssembledNonterminal.nonEmpty. */
    get nonEmpty(): boolean;
    /** Separator string from the repeat rule, if any. */
    get separator(): string | undefined;
    /** Whether a trailing separator is permitted. */
    get trailing(): boolean | undefined;
    /** Whether a leading separator is permitted. */
    get leading(): boolean | undefined;
}
export declare class AssembledGroup extends AssembledNodeBase<Rule> {
    readonly modelType: 'group';
    /** See `AssembledBranch.simplifiedRule`. */
    readonly simplifiedRule: Rule;
    readonly detectToken?: string;
    /** Short label (e.g., variant name like 'pub' or 'tuple'). Defaults to kind. */
    readonly name: string;
    /**
     * When this group is a polymorph form, the parent polymorph's kind —
     * what tree-sitter actually produces for this node. Form factories
     * must emit `type: parentKind` so the runtime NodeData matches the
     * tree-sitter kind, not the synthesized form kind. Undefined for
     * standalone groups (inlined hidden seqs).
     */
    readonly parentKind?: string;
    readonly overridePassthrough?: boolean;
    /** See {@link AssembledBranch.slotClass}. */
    slotClass?: BranchSlotClass;
    /**
     * The unified slot Record — every constituent of this group keyed by
     * its grammar field name (for `field()`-derived slots) or its
     * kind-derived positional name (for inferred slots). Insertion order
     * matches the order produced by `deriveSlots`. Frozen at construction.
     *
     * Mirrors `AssembledBranch.slots` — group consumers use this instead
     * of `.fields`/`.children` directly.
     */
    readonly slots: Readonly<Record<string, AssembledNonterminal>>;
    constructor(kind: string, rule: Rule, simplifiedRule: Rule, opts?: {
        factoryName?: string;
        irKey?: string;
        detectToken?: string;
        name?: string;
        parentKind?: string;
        overridePassthrough?: boolean;
        kindEntries?: readonly GeneratedKindEntry[];
    });
    /**
     * Field-shaped slots only (source !== 'inferred'). Convenience view
     * over `slots` for callers that need only named-grammar-field slots.
     */
    get fields(): readonly AssembledNonterminal[];
    /**
     * Inferred positional slots only (source === 'inferred'). Convenience
     * view over `slots` for callers that need only unnamed positional slots.
     */
    get children(): readonly AssembledNonterminal[];
    renderTemplate(rules?: Record<string, Rule>, wordMatcher?: RegExp, externals?: ReadonlySet<string>): RenderTemplateEntry;
    /**
     * Raw template walk — used by `AssembledPolymorph.renderTemplate` to
     * collect per-form template/clauses/joinByField parts without the
     * outer entry-packaging that `renderTemplate` adds.
     *
     * Returns the walker's raw output so the polymorph can merge multiple
     * forms' clauses into a single parent entry. Keeps `this.rule`
     * encapsulated — the sibling class doesn't reach in.
     */
    renderParts(rules?: Record<string, Rule>, wordMatcher?: RegExp): {
        template: string;
        clauses: Record<string, string>;
        joinByField: Record<string, string>;
        usesChildren: boolean;
        slots: readonly WalkSlotUse[];
    };
}
export type AssembledNode = AssembledBranch | AssembledPolymorph | AssembledPattern | AssembledKeyword | AssembledToken | AssembledEnum | AssembledSupertype | AssembledGroup | AssembledMulti;
/**
 * Dedup'd structural fields for a node — Branch/Group/Polymorph return
 * their own `.fields`;
 * non-structural kinds return `[]`.
 *
 * Use this when emitting types, factories, or anything that asks
 * "what fields does this kind have." For literal collection across
 * polymorph variants, see {@link allFormFieldsOf}.
 */
export declare function structuralFieldsOf(node: AssembledNode): readonly AssembledNonterminal[];
/**
 * Structural children for a node — Branch/Group/Polymorph return their
 * own `.children`; non-structural kinds return `[]`.
 *
 * Use this for emitters that read child slots on the kind itself.
 */
export declare function structuralChildrenOf(node: AssembledNode): readonly AssembledNonterminal[];
/**
 * Raw cross-form flatten of fields — Polymorph yields every form's
 * fields concatenated (duplicates preserved); Branch/Group return
 * their own `.fields`; non-structural kinds return `[]`.
 *
 * Use this for transport projection / literal collection where each
 * variant's literal contributions must be visible. For the dedup'd
 * structural view used by type and factory emitters, see
 * {@link structuralFieldsOf}.
 */
export declare function allFormFieldsOf(node: AssembledNode): readonly AssembledNonterminal[];
/**
 * Raw cross-form flatten of children — Polymorph yields every form's
 * children concatenated; Branch/Group return their own `.children`;
 * non-structural kinds return `[]`.
 *
 * Use this for transport projection. For structural-view children,
 * see {@link structuralChildrenOf}.
 */
export declare function allFormChildrenOf(node: AssembledNode): readonly AssembledNonterminal[];
/**
 * Every slot reachable from a node — Branch/Group return all entries
 * of their own `.slots`; Polymorph returns every form's slots
 * concatenated (raw cross-form flatten, duplicates preserved); non-
 * structural kinds return `[]`.
 *
 * The "all slots" sibling of {@link allFormFieldsOf} — covers both
 * field-shaped slots (`source !== 'inferred'`) and inferred positional
 * children. Use this when the consumer doesn't care about the
 * field/child distinction (graph traversal, kind reachability,
 * alias-source collection, userFacing classification). When TS-
 * emission shape differs by slot kind (factories, types, render
 * templates), keep {@link structuralFieldsOf} / {@link structuralChildrenOf}
 * for the typed-emission split.
 */
export declare function allSlotsOf(node: AssembledNode): readonly AssembledNonterminal[];
/**
 * Dedup'd union of every slot across forms — the "all slots" sibling
 * of {@link structuralFieldsOf}. Polymorph/Branch/Group return all entries of their
 * own `.slots`; non-structural kinds return `[]`.
 *
 * Use this when consumers want the dedup'd view regardless of slot
 * kind. For most polymorph-aware walks the raw {@link allSlotsOf}
 * suffices; pick the structural variant only when name-uniqueness
 * matters to the consumer (e.g. set-collecting where dupes inflate
 * count without changing meaning).
 */
export declare function allStructuralSlotsOf(node: AssembledNode): readonly AssembledNonterminal[];
//# sourceMappingURL=node-map.d.ts.map