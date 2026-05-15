/**
 * compiler/rule.ts — Shared IR
 *
 * One type throughout the pipeline. Defined once, never extended.
 * Rule type presence varies by phase:
 *   - After Evaluate: symbol, alias, token, repeat1 present
 *   - After Link: symbol, alias, token gone; clause, group, indent/dedent/newline added.
 *     `repeat1` is preserved so downstream field/child derivation can stamp the
 *     `nonEmpty` flag on the resulting slot for emitter tuple-type rendering.
 *   - After Optimize: variant added; structural grouping may be restructured
 *
 * @generated — do not add derived metadata (required, multiple, contentTypes, etc.)
 *              Those are derived from tree context at Assemble time.
 */
export type RuleId = string;
export interface RuleIdentity {
    readonly id?: RuleId;
}
export type Rule = RuleIdentity & (SeqRule | OptionalRule | ChoiceRule | RepeatRule | Repeat1Rule | FieldRule | VariantRule | ClauseRule | EnumRule | SupertypeRule | GroupRule | TerminalRule | PolymorphRule | StringRule | PatternRule | IndentRule | DedentRule | NewlineRule | SymbolRule | AliasRule | TokenRule);
export interface SeqRule {
    readonly type: 'seq';
    readonly members: Rule[];
}
export interface OptionalRule {
    readonly type: 'optional';
    readonly content: Rule;
}
export interface ChoiceRule {
    readonly type: 'choice';
    readonly members: Rule[];
}
export interface RepeatRule {
    readonly type: 'repeat';
    readonly content: Rule;
    readonly separator?: string;
    readonly trailing?: boolean;
    readonly leading?: boolean;
}
export interface Repeat1Rule {
    readonly type: 'repeat1';
    readonly content: Rule;
    readonly separator?: string;
    readonly trailing?: boolean;
    readonly leading?: boolean;
}
export interface FieldRule {
    readonly type: 'field';
    readonly name: string;
    readonly content: Rule;
    readonly source?: 'grammar' | 'override' | 'inlined' | 'enriched' | 'inferred';
    readonly nameFrom?: 'grammar' | 'kind' | 'override' | 'usage';
    /**
     * True if the field's value is rendered as an indented block — its
     * content resolves (through symbol refs) to a subtree containing an
     * `indent` Rule node. The template walker prefixes `\n  ` to the
     * field slot so `class X:$BODY` renders as `class X:\n  $BODY`.
     * Set by Link's `annotateBlockBearerFields` pass.
     */
    readonly blockBearer?: boolean;
    /**
     * Internal marker used by Evaluate's `transform()` DSL: a `field()`
     * call with no content is a placeholder patch that takes its content
     * from the original rule at patch-resolve time. Never survives past
     * `resolvePatch` — if this shows up anywhere else, it's a bug.
     */
    readonly _needsContent?: boolean;
}
export interface VariantRule {
    readonly type: 'variant';
    readonly name: string;
    readonly content: Rule;
}
export interface ClauseRule {
    readonly type: 'clause';
    readonly name: string;
    readonly content: Rule;
}
/**
 * Rule-level provenance vocabulary.
 *
 *   'grammar'  — the user wrote this classification explicitly in grammar.js
 *                (e.g. `supertypes: [$._expression]` or a literal enum rule).
 *   'override' — an overrides.ts patch produced this rule.
 *   'promoted' — Link derived this classification from rule shape (hidden
 *                choice-of-strings → enum, hidden choice-of-symbols →
 *                supertype, field-free symbol-free subtree → terminal,
 *                heterogeneous-field choice → polymorph).
 *
 * Suggestion check is uniform across all rule-level sources:
 *    isSuggestion = source !== 'grammar' && source !== 'override'
 */
export type RuleSource = 'grammar' | 'promoted' | 'override';
/**
 * EnumRule — a normalized choice-of-strings.
 *
 * Shape-compatible with `ChoiceRule` (both expose `members`) but narrower:
 * every member is a `StringRule`. Downstream code that walks `.members`
 * uniformly across choice/enum works for free; code that wants the raw
 * string list reads `.members.map(m => m.value)`.
 */
export interface EnumRule {
    readonly type: 'enum';
    readonly members: readonly StringRule[];
    readonly source?: RuleSource;
}
/**
 * Normalize a closed literal set to the canonical rule shape.
 *
 * @remarks
 * Multi-member sets remain `EnumRule`. A single literal collapses to that
 * `StringRule` so downstream phases classify it as the corresponding
 * keyword/token instead of carrying a degenerate enum shape.
 */
export declare function normalizeEnumMembers(members: readonly StringRule[], source?: RuleSource): StringRule | EnumRule;
export interface SupertypeRule {
    readonly type: 'supertype';
    readonly name: string;
    readonly subtypes: string[];
    readonly source?: RuleSource;
}
export interface GroupRule {
    readonly type: 'group';
    readonly name: string;
    readonly content: Rule;
}
/**
 * TerminalRule — composed text-only terminal.
 *
 * A rule whose subtree contains no fields and no symbol references
 * (neither visible nor hidden). Examples: `integer`, `escape_sequence`,
 * `line_comment`, `regex_pattern`, `import_prefix`. Tree-sitter exposes
 * instances of these kinds as text-only nodes, so `render()` can return
 * `node.text` directly without ever consulting templates.
 *
 * Added by Link (see `promoteTerminals`). Not present after Evaluate.
 * Assemble routes this to `modelType: 'pattern'` without inspecting content.
 */
export interface TerminalRule {
    readonly type: 'terminal';
    readonly content: Rule;
    /** Always 'promoted' today — Link synthesises terminals from shape. */
    readonly source?: RuleSource;
}
/**
 * PolymorphRule — choice-of-variants with heterogeneous field sets.
 *
 * A structural dispatch: multiple named variants, each with its own
 * field shape. Added by Optimize when it detects that a variant-bearing
 * choice has variants with different field sets (the homogeneous case
 * is a branch, not a polymorph). Assemble routes this directly to
 * `modelType: 'polymorph'` and builds one form per variant — no
 * simplifyRule or content guessing.
 */
export interface PolymorphForm {
    readonly name: string;
    readonly content: Rule;
    /**
     * For override polymorphs, the real visible parse-tree child kind used by
     * variant() adoption (e.g. `with_clause_paren`). Absent on passthrough
     * forms that keep their original bare symbol arm.
     */
    readonly visibleChildKind?: string;
    /**
     * Runtime child kinds that select this form in readNode→factory/.from()
     * resolution. May name a concrete kind (`assignment`) or a supertype
     * (`expression`) that later expands to concrete child kinds in the
     * validator metadata emitter.
     */
    readonly discriminatorKinds?: readonly string[];
}
export interface PolymorphRule {
    readonly type: 'polymorph';
    /** Ordered list of forms (one per variant, in declaration order). */
    readonly forms: Array<PolymorphForm>;
    /** Always 'promoted' today — Link synthesises polymorphs from shape. */
    readonly source?: RuleSource;
}
export interface StringRule {
    readonly type: 'string';
    readonly value: string;
}
export interface PatternRule {
    readonly type: 'pattern';
    readonly value: string;
}
export interface IndentRule {
    readonly type: 'indent';
}
export interface DedentRule {
    readonly type: 'dedent';
}
export interface NewlineRule {
    readonly type: 'newline';
}
export interface SymbolRule {
    readonly type: 'symbol';
    readonly name: string;
    readonly source?: 'grammar' | 'link';
    /** Original literal text when Link synthesized this ref from a string token. */
    readonly literal?: string;
    readonly hidden?: boolean;
    readonly supertype?: boolean;
    /**
     * Alias provenance: when this symbol was produced by resolving
     * `alias($.aliasedFrom, $.name)`, `aliasedFrom` is the source kind
     * whose shape the parse tree body follows (while tree-sitter emits
     * the node with `$type === name`, the alias target). Preserved so
     * the wrap emitter can rewrite \$type at drill-in via drillAs().
     * Used by the wrap emitter for alias-target rewrites.
     */
    readonly aliasedFrom?: string;
}
export interface AliasRule {
    readonly type: 'alias';
    readonly content: Rule;
    readonly named: boolean;
    readonly value: string;
}
export interface TokenRule {
    readonly type: 'token';
    readonly content: Rule;
    readonly immediate: boolean;
}
export declare const isSeq: (r: Rule) => r is SeqRule;
export declare const isChoice: (r: Rule) => r is ChoiceRule;
export declare const isOptional: (r: Rule) => r is OptionalRule;
export declare const isRepeat: (r: Rule) => r is RepeatRule;
export declare const isRepeat1: (r: Rule) => r is Repeat1Rule;
export declare const isField: (r: Rule) => r is FieldRule;
export declare const isVariant: (r: Rule) => r is VariantRule;
export declare const isClause: (r: Rule) => r is ClauseRule;
export declare const isEnum: (r: Rule) => r is EnumRule;
export declare const isSupertype: (r: Rule) => r is SupertypeRule;
export declare const isGroup: (r: Rule) => r is GroupRule;
export declare const isTerminal: (r: Rule) => r is TerminalRule;
export declare const isPolymorph: (r: Rule) => r is PolymorphRule;
export declare const isString: (r: Rule) => r is StringRule;
export declare const isPattern: (r: Rule) => r is PatternRule;
export declare const isIndent: (r: Rule) => r is IndentRule;
export declare const isDedent: (r: Rule) => r is DedentRule;
export declare const isNewline: (r: Rule) => r is NewlineRule;
export declare const isSymbol: (r: Rule) => r is SymbolRule;
export declare const isAlias: (r: Rule) => r is AliasRule;
export declare const isToken: (r: Rule) => r is TokenRule;
export declare const isLinkSymbol: (r: Rule) => r is SymbolRule;
export declare const literalTextOf: (r: Rule) => string | undefined;
/**
 * Collect the set of field names referenced anywhere in a rule tree.
 * Returns names only — cheap one-pass walker with no AssembledField
 * allocation. Pre-assembly phases (classifier, link's polymorph-
 * promotion heuristics) that only need field-set equality call this
 * instead of constructing full AssembledField objects just to extract
 * names.
 */
export declare function collectFieldNames(rule: Rule): Set<string>;
export interface SymbolRef {
    refType: 'symbol' | 'alias' | 'token';
    from: string;
    to: string;
    fromRuleId?: RuleId;
    fieldName?: string;
    optional?: boolean;
    repeated?: boolean;
    position?: number;
}
//# sourceMappingURL=rule.d.ts.map