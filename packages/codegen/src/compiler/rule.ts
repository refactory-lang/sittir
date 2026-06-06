import {
	SEQ,
	OPTIONAL,
	CHOICE,
	REPEAT,
	REPEAT1,
	FIELD,
	VARIANT,
	ENUM,
	SUPERTYPE,
	GROUP,
	TERMINAL,
	STRING,
	PATTERN,
	INDENT,
	DEDENT,
	NEWLINE,
	SYMBOL,
	ALIAS,
	TOKEN,
} from './rule-types.ts';
/**
 * compiler/rule.ts — Shared IR
 *
 * One type throughout the pipeline. Defined once, never extended.
 * Rule type presence varies by phase:
 *   - After Evaluate: symbol, alias, token, repeat1 present
 *   - After Link: symbol, alias, token gone; group, indent/dedent/newline added.
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

/**
 * Per-rule cardinality + optionality tag. Mirrors NodeOrTerminal.multiplicity
 * (see compiler/node-map.ts) — same values, same semantic. When a rule is
 * pushed-down from a wrapper, this attribute records what the wrapper meant.
 *
 * - `'optional'`      → T | undefined            (from `optional(X)`)
 * - `'single'`        → T                        (default — no wrapper)
 * - `'array'`         → readonly T[]              (from `repeat(X)`)
 * - `'nonEmptyArray'` → NonEmptyArray<T>          (from `repeat1(X)`)
 */
export type Multiplicity = 'optional' | 'single' | 'array' | 'nonEmptyArray';

/**
 * Shared base every Rule type extends via the intersection on `Rule` below.
 *
 * - `id` is the existing identity tag (see RuleIdentity history).
 * - `fieldName` / `multiplicity` / `nonterminal` / `separator` are modifier
 *   attributes populated by enrich passes when a rule was originally wrapped
 *   by `field` / `optional` / `repeat` / `repeat1`. The wrapper continues
 *   to exist until PR3; these attributes are additive and let downstream
 *   consumers (the new template emitter, future consumers) read modifier
 *   facts directly from the inner rule.
 *
 * Vocabulary matches NodeOrTerminal (node-map.ts:117, 144) so values that
 * flow from rules to slots use identical field names. See
 * feedback_rule_slot_vocabulary_alignment.
 *
 * Per spec's universal-shape decision: NO `leading`/`trailing` `Rule[]` at
 * rule level. Flanking literals live as adjacent seq members. Separator
 * placement (`trailing`/`leading` booleans) lives ON the structured
 * `separator` object below.
 */
export interface RuleBase {
	readonly id?: RuleId;

	readonly fieldName?: string;
	readonly multiplicity?: Multiplicity;
	readonly nonterminal?: boolean;

	/**
	 * Alias provenance pushed down from an `alias()` wrapper by
	 * `applyWrapperDeletion`, exactly as `fieldName` / `multiplicity` /
	 * `separator` are pushed down from `field` / `optional` / `repeat`.
	 * `aliasedFrom` is the alias TARGET (`AliasRule.value` — the name
	 * tree-sitter emits for the node), `aliasNamed` mirrors
	 * `AliasRule.named`. Consumers of the wrapper-free RenderRule /
	 * SimplifiedRule read these off the leaf instead of matching a mid-tree
	 * `alias` node. (`SymbolRule.aliasedFrom` predates this and carries the
	 * same target name for Link-resolved symbol aliases.)
	 */
	readonly aliasedFrom?: string;
	readonly aliasNamed?: boolean;

	/**
	 * Inert provenance bag. NEVER drives compiler behavior beyond path-descent
	 * lookup keying (`feedback_metadata_not_behavior`): structural facts decide
	 * folding/slotting. `source` marks how the rule entered the tree
	 * (`'enrich'` for the enrich-lifted SYMBOL ref; `'group-lift'` legacy);
	 * `inlinedFrom` records the hidden kind whose body was spliced in by the
	 * normalize inline hoist (§D-2a), for diagnostics only.
	 */
	readonly metadata?: { source?: RuleSource | 'enrich' | 'group-lift'; inlinedFrom?: string };

	readonly separator?:
		| string
		| readonly Rule[]
		| {
				readonly rules: readonly Rule[];
				readonly trailing?: boolean;
				readonly leading?: boolean;
		  };
}

/**
 * @deprecated Renamed to {@link RuleBase} now that this interface carries
 * modifier attributes in addition to identity. Retained as an alias so any
 * external consumer keeps working through PR0; remove when callers migrate.
 */
export type RuleIdentity = RuleBase;

/**
 * Discriminated union of every Rule shape. Each member interface extends
 * {@link RuleBase}, so the modifier attributes are reachable on every
 * variant without an intersection here.
 */
export type Rule =
	// Structural grouping — Optimize restructures these
	| SeqRule
	| OptionalRule
	| ChoiceRule
	| RepeatRule
	| Repeat1Rule

	// Named patterns — clean wrappers, no derived metadata
	| FieldRule
	| VariantRule
	// EnumRule is now ChoiceRule (PR-P): removed from union to avoid duplicate
	| SupertypeRule
	| GroupRule
	| TerminalRule

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
	| TokenRule;

/**
 * A Rule shape produced by `applyWrapperDeletion` in optimize.ts. Modifier
 * wrappers (`optional` / `field` / `repeat` / `repeat1`) have been pushed
 * down to leaf attributes; structural rules (`seq` / `choice` / `variant` /
 * `group`) are preserved.
 *
 * Structurally a `Rule` minus the wrapper variants — typed as a brand so
 * mismatches between RawRule and RenderRule consumption surface at compile
 * time.
 */
export type RenderRule = Exclude<Rule, OptionalRule | FieldRule | RepeatRule | Repeat1Rule> & {
	readonly __renderRule?: never;
};

/**
 * A Rule shape produced by `computeSimplifiedRules` after PR2 wires
 * `canonicalizeSeqOfLeaves` and `assertUniversalShape` into the pipeline.
 *
 * Structurally a `RenderRule` (wrappers already pushed-down to leaf
 * attributes), additionally satisfying the universal seq-of-leaves
 * invariant: every branch/group/multi body is a `seq` /
 * `choice` / `repeat` / leaf-terminal (`enum` / `string` / `pattern`).
 *
 * Branded so SimplifiedRule consumers can't be silently called with a
 * pre-canonicalize RenderRule.
 */
export type SimplifiedRule = RenderRule & {
	readonly __simplifiedRule?: never;
};

// ---------------------------------------------------------------------------
// Structural grouping
// ---------------------------------------------------------------------------

export interface SeqRule extends RuleBase {
	readonly type: typeof SEQ;
	readonly members: Rule[];
}

export interface OptionalRule extends RuleBase {
	readonly type: typeof OPTIONAL;
	readonly content: Rule;
}

export interface ChoiceRule extends RuleBase {
	readonly type: typeof CHOICE;
	readonly members: Rule[];
}

export interface RepeatRule extends RuleBase {
	readonly type: typeof REPEAT;
	readonly content: Rule;
	readonly separator?: string;
	readonly trailing?: boolean;
	readonly leading?: boolean;
}

export interface Repeat1Rule extends RuleBase {
	readonly type: typeof REPEAT1;
	readonly content: Rule;
	readonly separator?: string;
	readonly trailing?: boolean;
	readonly leading?: boolean;
}

// ---------------------------------------------------------------------------
// Named patterns
// ---------------------------------------------------------------------------

export interface FieldRule extends RuleBase {
	readonly type: typeof FIELD;
	readonly name: string;
	readonly content: Rule;
	readonly source?: 'grammar' | 'override' | 'enriched' | 'inferred';
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

export interface VariantRule extends RuleBase {
	readonly type: typeof VARIANT;
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
 *                supertype, field-free symbol-free subtree → terminal).
 *
 * Suggestion check is uniform across all rule-level sources:
 *    isSuggestion = source !== 'grammar' && source !== 'override'
 */
export type RuleSource = 'grammar' | 'promoted' | 'override';

/**
 * EnumRule — a normalized choice-of-strings.
 *
 * PR-P: EnumRule is now a type alias for ChoiceRule. The ENUM discriminant
 * is retired; enum-ness is detected structurally via isEnumChoiceRule().
 * Shape-compatible with ChoiceRule (both expose `members`); every member
 * is a StringRule. The `source` provenance moves to `metadata.source`.
 */
export type EnumRule = ChoiceRule;

/**
 * Predicate: rule is an enum-shaped ChoiceRule (flat, all-STRING members,
 * at least 2 members). Matches the pre-link form; post-link use literalTextOf.
 *
 * This is the canonical replacement for `rule.type === ENUM`.
 */
export function isEnumChoiceRule(rule: Rule): rule is ChoiceRule {
	return rule.type === CHOICE && rule.members.length >= 2 && rule.members.every((m) => m.type === STRING);
}

/**
 * Normalize a closed literal set to the canonical rule shape.
 *
 * @remarks
 * Multi-member sets remain a ChoiceRule (enum-shaped). A single literal
 * collapses to that StringRule so downstream phases classify it as the
 * corresponding keyword/token instead of carrying a degenerate enum shape.
 * The `source` provenance is carried in `metadata.source` (not top-level).
 */
export function normalizeEnumMembers(
	members: readonly StringRule[],
	source?: RuleSource
): StringRule | ChoiceRule {
	if (members.length === 1) return members[0]!;
	return {
		type: CHOICE,
		members: members as StringRule[],
		...(source !== undefined ? { metadata: { source } } : {})
	} satisfies ChoiceRule;
}

export interface SupertypeRule extends RuleBase {
	readonly type: typeof SUPERTYPE;
	readonly name: string;
	readonly subtypes: string[];
	readonly source?: RuleSource;
}

export interface GroupRule extends RuleBase {
	readonly type: typeof GROUP;
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
export interface TerminalRule extends RuleBase {
	readonly type: typeof TERMINAL;
	readonly content: Rule;
	/** Always 'promoted' today — Link synthesises terminals from shape. */
	readonly source?: RuleSource;
}

// ---------------------------------------------------------------------------
// Terminals
// ---------------------------------------------------------------------------

export interface StringRule extends RuleBase {
	readonly type: typeof STRING;
	readonly value: string;
}

export interface PatternRule extends RuleBase {
	readonly type: typeof PATTERN;
	readonly value: string;
}

// ---------------------------------------------------------------------------
// Structural whitespace
// ---------------------------------------------------------------------------

export interface IndentRule extends RuleBase {
	readonly type: typeof INDENT;
}

export interface DedentRule extends RuleBase {
	readonly type: typeof DEDENT;
}

export interface NewlineRule extends RuleBase {
	readonly type: typeof NEWLINE;
}

// ---------------------------------------------------------------------------
// References — resolved by Link; absent after Link
// ---------------------------------------------------------------------------

export interface SymbolRule extends RuleBase {
	readonly type: typeof SYMBOL;
	readonly name: string;
	readonly source?: 'grammar' | 'link' | 'group-lift';
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

export interface AliasRule extends RuleBase {
	readonly type: typeof ALIAS;
	readonly content: Rule;
	readonly named: boolean;
	readonly value: string;
}

export interface TokenRule extends RuleBase {
	readonly type: typeof TOKEN;
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

export const isSeq = (r: Rule): r is SeqRule => r.type === SEQ;
export const isChoice = (r: Rule): r is ChoiceRule => r.type === CHOICE;
export const isOptional = (r: Rule): r is OptionalRule => r.type === OPTIONAL;
export const isRepeat = (r: Rule): r is RepeatRule => r.type === REPEAT;
export const isRepeat1 = (r: Rule): r is Repeat1Rule => r.type === REPEAT1;
export const isField = (r: Rule): r is FieldRule => r.type === FIELD;

export const isEnum = (r: Rule): r is EnumRule => isEnumChoiceRule(r);
export const isSupertype = (r: Rule): r is SupertypeRule => r.type === SUPERTYPE;
export const isGroup = (r: Rule): r is GroupRule => r.type === GROUP;
export const isTerminal = (r: Rule): r is TerminalRule => r.type === TERMINAL;
export const isString = (r: Rule): r is StringRule => r.type === STRING;
export const isPattern = (r: Rule): r is PatternRule => r.type === PATTERN;
export const isIndent = (r: Rule): r is IndentRule => r.type === INDENT;
export const isDedent = (r: Rule): r is DedentRule => r.type === DEDENT;
export const isNewline = (r: Rule): r is NewlineRule => r.type === NEWLINE;
export const isSymbol = (r: Rule): r is SymbolRule => r.type === SYMBOL;
export const isAlias = (r: Rule): r is AliasRule => r.type === ALIAS;
export const isToken = (r: Rule): r is TokenRule => r.type === TOKEN;
export const isLinkSymbol = (r: Rule): r is SymbolRule => r.type === SYMBOL && r.source === 'link';
export const literalTextOf = (r: Rule): string | undefined =>
	r.type === STRING ? r.value : isLinkSymbol(r) ? r.literal : undefined;

// ---------------------------------------------------------------------------
// Tree walkers — pure Rule-tree projections, no AssembledNode concepts
// ---------------------------------------------------------------------------

/**
 * Collect the set of field names referenced anywhere in a rule tree.
 * Returns names only — cheap one-pass walker with no AssembledField
 * allocation. Pre-assembly phases (classifier) that only need field-set equality call this
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
		case FIELD:
			out.add(rule.name);
			walkFieldNames(rule.content, out);
			return;
		case SEQ:
		case CHOICE:
			for (const m of rule.members) walkFieldNames(m, out);
			return;
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case VARIANT:
		case GROUP:
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

// ---------------------------------------------------------------
// Path-addressed rule rewriting
//
// Slash-separated positional paths (e.g. '1/1/0/1/3') used by
// `polymorphs:` / `transforms:` / `groups:` in overrides.ts. See
// docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md
// for the path semantics.
// ---------------------------------------------------------------

/**
 * Return a new rule tree with the sub-rule at `path` replaced by
 * `replacement`. Pure — no mutation of input. Path segments index into:
 *   - seq.members[i] / choice.members[i]
 *   - wrapper.content (path '0' for optional/repeat/repeat1/field/
 *     token/alias/variant/clause/group)
 *
 * Throws if any segment fails to address.
 */
export function replaceAtPath(rule: Rule, path: string, replacement: Rule): Rule {
	const segments = path.split('/').filter((s) => s.length > 0);
	return replaceAtPathRec(rule, segments, 0, replacement);
}

function replaceAtPathRec(rule: Rule, segments: readonly string[], depth: number, replacement: Rule): Rule {
	if (depth === segments.length) return replacement;
	const idx = parseInt(segments[depth]!, 10);
	switch (rule.type) {
		case SEQ:
		case CHOICE: {
			const members = rule.members.slice();
			members[idx] = replaceAtPathRec(members[idx]!, segments, depth + 1, replacement);
			return { ...rule, members };
		}
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case TOKEN:
		case ALIAS:
		case VARIANT:
		case GROUP:
			return { ...rule, content: replaceAtPathRec((rule as { content: Rule }).content, segments, depth + 1, replacement) } as Rule;
		default:
			throw new Error(`replaceAtPath: cannot descend into '${rule.type}' at segment ${depth}`);
	}
}
