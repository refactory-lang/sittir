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

// tokenToName is defined locally below to avoid a circular import with
// compiler/link.ts (which imports helpers from this file). A small map
// covering the common non-word optionals (`!`, `?`) is enough; bail to
// null for anything else and the caller falls back to existing behavior.

// ---------------------------------------------------------------------------
// Rule — the shared intermediate representation
// ---------------------------------------------------------------------------

export type RuleId = string;

export interface RuleIdentity {
	readonly id?: RuleId;
}

export type Rule = RuleIdentity &
	// Structural grouping — Optimize restructures these
	(
		| SeqRule
		| OptionalRule
		| ChoiceRule
		| RepeatRule
		| Repeat1Rule

		// Named patterns — clean wrappers, no derived metadata
		| FieldRule
		| VariantRule
		| ClauseRule
		| EnumRule
		| SupertypeRule
		| GroupRule
		| TerminalRule
		| PolymorphRule

		// Terminals
		| StringRule
		| PatternRule

		// Structural whitespace
		| IndentRule
		| DedentRule
		| NewlineRule

		// References — Link resolves these; absent after Link
		| SymbolRule
		| AliasRule
		| TokenRule
	);

// ---------------------------------------------------------------------------
// Structural grouping
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Named patterns
// ---------------------------------------------------------------------------

export interface FieldRule {
	readonly type: 'field';
	readonly name: string;
	readonly content: Rule;
	readonly source?:
		| 'grammar'
		| 'override'
		| 'inlined'
		| 'enriched'
		| 'inferred';
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
 * Assemble routes this to `modelType: 'leaf'` without inspecting content.
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
export interface PolymorphRule {
	readonly type: 'polymorph';
	/** Ordered list of forms (one per variant, in declaration order). */
	readonly forms: Array<{ readonly name: string; readonly content: Rule }>;
	/** Always 'promoted' today — Link synthesises polymorphs from shape. */
	readonly source?: RuleSource;
}

// ---------------------------------------------------------------------------
// Terminals
// ---------------------------------------------------------------------------

export interface StringRule {
	readonly type: 'string';
	readonly value: string;
}

export interface PatternRule {
	readonly type: 'pattern';
	readonly value: string;
}

// ---------------------------------------------------------------------------
// Structural whitespace
// ---------------------------------------------------------------------------

export interface IndentRule {
	readonly type: 'indent';
}

export interface DedentRule {
	readonly type: 'dedent';
}

export interface NewlineRule {
	readonly type: 'newline';
}

// ---------------------------------------------------------------------------
// References — resolved by Link; absent after Link
// ---------------------------------------------------------------------------

export interface SymbolRule {
	readonly type: 'symbol';
	readonly name: string;
	readonly hidden?: boolean;
	readonly supertype?: boolean;
	/**
	 * Alias provenance: when this symbol was produced by resolving
	 * `alias($.aliasedFrom, $.name)`, `aliasedFrom` is the source kind
	 * whose shape the parse tree body follows (while tree-sitter emits
	 * the node with `$type === name`, the alias target). Preserved so
	 * the wrap emitter can rewrite \$type at drill-in via drillAs().
	 * See ADR-0006.
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

// ---------------------------------------------------------------------------
// Per-variant type guards
//
// Prefer these over inline `r.type === 'seq'` checks in `.filter()`,
// `.find()`, `.some()`, `.every()`, and standalone predicates — they
// narrow the rule type through the callback (no `as SeqRule` casts
// downstream). Inside a `switch (rule.type)` stay with literal case
// arms so TS exhaustiveness checking catches missing variants when
// new Rule types are added.
// ---------------------------------------------------------------------------

export const isSeq = (r: Rule): r is SeqRule => r.type === 'seq';
export const isChoice = (r: Rule): r is ChoiceRule => r.type === 'choice';
export const isOptional = (r: Rule): r is OptionalRule => r.type === 'optional';
export const isRepeat = (r: Rule): r is RepeatRule => r.type === 'repeat';
export const isRepeat1 = (r: Rule): r is Repeat1Rule => r.type === 'repeat1';
export const isField = (r: Rule): r is FieldRule => r.type === 'field';
export const isVariant = (r: Rule): r is VariantRule => r.type === 'variant';
export const isClause = (r: Rule): r is ClauseRule => r.type === 'clause';
export const isEnum = (r: Rule): r is EnumRule => r.type === 'enum';
export const isSupertype = (r: Rule): r is SupertypeRule =>
	r.type === 'supertype';
export const isGroup = (r: Rule): r is GroupRule => r.type === 'group';
export const isTerminal = (r: Rule): r is TerminalRule => r.type === 'terminal';
export const isPolymorph = (r: Rule): r is PolymorphRule =>
	r.type === 'polymorph';
export const isString = (r: Rule): r is StringRule => r.type === 'string';
export const isPattern = (r: Rule): r is PatternRule => r.type === 'pattern';
export const isIndent = (r: Rule): r is IndentRule => r.type === 'indent';
export const isDedent = (r: Rule): r is DedentRule => r.type === 'dedent';
export const isNewline = (r: Rule): r is NewlineRule => r.type === 'newline';
export const isSymbol = (r: Rule): r is SymbolRule => r.type === 'symbol';
export const isAlias = (r: Rule): r is AliasRule => r.type === 'alias';
export const isToken = (r: Rule): r is TokenRule => r.type === 'token';

// ---------------------------------------------------------------------------
// Tree walkers — pure Rule-tree projections, no AssembledNode concepts
// ---------------------------------------------------------------------------

/**
 * Collect the set of field names referenced anywhere in a rule tree.
 * Returns names only — cheap one-pass walker with no AssembledField
 * allocation. Pre-assembly phases (classifier, link's polymorph-
 * promotion heuristics) that only need field-set equality call this
 * instead of constructing full AssembledField objects just to extract
 * names.
 */
export function collectFieldNames(rule: Rule): Set<string> {
	const names = new Set<string>();
	walkFieldNames(rule, names);
	return names;
}

function walkFieldNames(rule: Rule, out: Set<string>): void {
	switch (rule.type) {
		case 'field':
			out.add(rule.name);
			walkFieldNames(rule.content, out);
			return;
		case 'seq':
		case 'choice':
			for (const m of rule.members) walkFieldNames(m, out);
			return;
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'variant':
		case 'clause':
		case 'group':
			walkFieldNames(rule.content, out);
			return;
		default:
			return;
	}
}

// ---------------------------------------------------------------------------
// Reference graph
// ---------------------------------------------------------------------------

export interface SymbolRef {
	refType: 'symbol' | 'alias' | 'token';
	from: string;
	to: string;
	fromRuleId?: RuleId;
	fieldName?: string;
	optional?: boolean;
	repeated?: boolean;
	position?: number; // Link adds: index within parent's SEQ
}
