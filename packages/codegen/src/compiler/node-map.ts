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
 * `branch` (discriminated by `isContainerShape`).
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

import type {
	Rule,
	RuleSource,
	SeqRule,
	ChoiceRule,
	RepeatRule,
	Repeat1Rule,
	StringRule,
	PatternRule,
	TokenRule,
	EnumRule,
	SupertypeRule,
	PolymorphRule,
	TerminalRule
} from './rule.ts';
import { isSeq, isField } from './rule.ts';
import {
	renderRuleTemplate,
	deriveWalkSlots,
	findRepeatSeparator,
	findRepeatFlag
} from './template-walker.ts';
import type { WalkSlotUse } from './template-walker.ts';
import { tokenToName } from './optimize.ts';
import { assertNever } from '../polymorph-variant.ts';

// ---------------------------------------------------------------------------
// NodeOrTerminal — unified slot-content type
// ---------------------------------------------------------------------------

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
export type BranchSlotClass =
	| { tag: 'multiSlot' }
	| {
			tag: 'singleSlot';
			arity: 'singular' | 'multiple';
			optional: boolean;
			nonEmpty: boolean;
			slot: AssembledNonterminal;
	  };

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
	readonly multiplicity: Multiplicity;
	readonly separator?: string;
	readonly trailing?: boolean;
	readonly leading?: boolean;
}

/**
 * Discriminated union of the two entry types inside a slot's `values` array.
 */
export type NodeOrTerminal = NodeRef | TerminalValue;

export function isNodeRef(v: NodeOrTerminal): v is NodeRef {
	return v.kind === 'node-ref';
}

export function isTerminalValue(v: NodeOrTerminal): v is TerminalValue {
	return v.kind === 'terminal';
}

export function isUnresolvedRef(v: NodeRef['node']): v is UnresolvedRef {
	return (
		typeof v === 'object' && (v as { kind?: unknown }).kind === 'unresolved-ref'
	);
}

// ---------------------------------------------------------------------------
// Derived slot-level helpers (DRY: one derivation, not stored flags)
// ---------------------------------------------------------------------------

/**
 * True when EVERY value in the slot is `single`, `array`, or `nonEmptyArray`
 * (none are `optional`). A slot with ANY optional value is itself optional
 * at the slot level.
 */
export function isRequired(slot: {
	values: readonly NodeOrTerminal[];
}): boolean {
	return (
		slot.values.length > 0 &&
		slot.values.every((v) => v.multiplicity !== 'optional')
	);
}

/**
 * True when ANY value has multiplicity `array` or `nonEmptyArray`.
 */
export function isMultiple(slot: {
	values: readonly NodeOrTerminal[];
}): boolean {
	return slot.values.some(
		(v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray'
	);
}

/**
 * True when EVERY multi-valued value is `nonEmptyArray` (and there is at
 * least one multi-valued value). A mixed `array` + `nonEmptyArray` slot
 * returns `false` — the `array` form allows empty.
 */
export function isNonEmpty(slot: {
	values: readonly NodeOrTerminal[];
}): boolean {
	const multis = slot.values.filter(
		(v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray'
	);
	return (
		multis.length > 0 && multis.every((v) => v.multiplicity === 'nonEmptyArray')
	);
}

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

// ---------------------------------------------------------------------------
// Derivation helpers — walk a Rule to produce fields, children, content types
// ---------------------------------------------------------------------------

/**
 * Convert a snake_case name to camelCase — the single source of truth for
 * this transformation in the codegen pipeline. Used by field/child
 * `propertyName` derivation here, and re-exported for emitters and
 * validators that need the same canonical form.
 */
export function snakeToCamel(name: string): string {
	return name.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Pluralize a camelCase property name for array/nonEmptyArray slots.
 * Only `propertyName` and `paramName` get pluralized — `storageName`
 * stays singular (tree-sitter facing).
 */
export function pluralize(name: string): string {
	if (name.endsWith('s') || name.endsWith('List') || name.endsWith('children') || name.endsWith('Children')) return name;
	if (/[Cc]hild$/.test(name)) return name.slice(0, -5) + (name.endsWith('Child') ? 'Children' : 'children');
	if (name.endsWith('y') && !/[aeiou]y$/.test(name)) return name.slice(0, -1) + 'ies';
	return name + 's';
}

// TypeScript reserved words that must be avoided as parameter names.
const TS_RESERVED = new Set([
	'arguments',
	'await',
	'break',
	'case',
	'catch',
	'class',
	'const',
	'continue',
	'debugger',
	'default',
	'delete',
	'do',
	'else',
	'enum',
	'export',
	'extends',
	'false',
	'finally',
	'for',
	'function',
	'if',
	'import',
	'in',
	'instanceof',
	'new',
	'null',
	'return',
	'super',
	'switch',
	'this',
	'throw',
	'true',
	'try',
	'typeof',
	'var',
	'void',
	'while',
	'with',
	'yield',
	'let',
	'static',
	'implements',
	'interface',
	'package',
	'private',
	'protected',
	'public'
]);

function safeParamName(name: string): string {
	return TS_RESERVED.has(name) ? `${name}_` : name;
}

/**
 * Cheap existence predicate: does this rule's tree contain any field()?
 * Used by pre-assembly phases (classifier, optimizer) that only need to
 * know IF fields exist — not the full list. Shorter-circuits than
 * deriveFields.
 */
export function hasAnyField(rule: Rule): boolean {
	switch (rule.type) {
		case 'field':
			return true;
		case 'seq':
		case 'choice':
			return rule.members.some(hasAnyField);
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'variant':
		case 'clause':
		case 'group':
			return hasAnyField(rule.content);
		default:
			return false;
	}
}

/**
 * Cheap existence predicate: does this rule's tree contain any symbol
 * reference (visible OR hidden)? Hidden symbols dispatch to concrete
 * subtypes at parse time, so they DO contribute children.
 */
export function hasAnyChild(rule: Rule): boolean {
	switch (rule.type) {
		case 'symbol':
		case 'supertype':
			return true;
		case 'seq':
		case 'choice':
			return rule.members.some(hasAnyChild);
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'variant':
		case 'clause':
		case 'group':
			return hasAnyChild(rule.content);
		default:
			return false;
	}
}

/**
 * Dev audit — log shapes that reach derivation in a non-canonical form.
 * Simplify's canonicalization should produce a top-level `seq` (or a
 * single atomic member) with members that are
 * fields / literals / repeats / symbols. Anything else means simplify
 * didn't finish normalizing, and the trivialized `projectFields` /
 * `projectChildren` walks won't see the content.
 *
 * Opt in via `SITTIR_AUDIT_DERIVE=1`; otherwise silent (zero overhead in
 * normal codegen runs). Captures per-kind shape signatures so we can
 * count distinct non-canonical patterns across the corpus and decide
 * which simplify passes still need work.
 */
const DERIVE_AUDIT = process.env.SITTIR_AUDIT_DERIVE === '1';
// Audit default is now 'strict' — every non-canonical shape across the
// curated grammars has been drained via variant adoption + inline
// (`rust`, `python`, `typescript` all audit clean). Any non-canonical
// rule reaching derivation throws with a diagnostic so the walker can
// safely assume canonical input.
//
// Opt-outs:
//   SITTIR_AUDIT_DERIVE=1        → 'report' mode (log + accumulate,
//                                   don't throw). Used by tests that
//                                   consume raw base grammars without
//                                   override() / variant() applied.
//   SITTIR_AUDIT_DERIVE=off      → 'off' mode (no audit at all).
function deriveAuditMode(): 'strict' | 'report' | 'off' {
	const v = process.env.SITTIR_AUDIT_DERIVE;
	if (v === '1') return 'report';
	if (v === 'off') return 'off';
	return 'strict';
}
const auditCounts = new Map<string, number>();
const auditKindsByShape = new Map<string, string[]>();
/** Transient — each AssembledNode's constructor sets this before the lazy
 * `fields` / `children` getters fire, so the audit can attribute shapes
 * to their originating kind. */
let currentAuditKind: string | undefined;
export function setAuditKindContext(kind: string | undefined): void {
	currentAuditKind = kind;
}
function auditDerivationShape(
	rule: Rule,
	context: 'fields' | 'children'
): void {
	const mode = deriveAuditMode();
	if (mode === 'off') return;
	const shape = classifyTopLevelShape(rule);
	if (shape === 'canonical') return;
	if (mode === 'strict') {
		const kindLabel = currentAuditKind ?? '(no-kind-context)';
		throw new Error(
			`derive: non-canonical shape '${shape}' reached ${context} derivation for '${kindLabel}'. ` +
				`The Phase-2 walker assumes canonical input; fix the shape upstream (simplify pass, ` +
				`variant() adoption in overrides.ts, or audit classifier) before regenerating. ` +
				`Set SITTIR_AUDIT_DERIVE=1 to downgrade this to the accumulator/report mode.`
		);
	}
	const key = `${context}:${shape}`;
	auditCounts.set(key, (auditCounts.get(key) ?? 0) + 1);
	if (currentAuditKind !== undefined) {
		const kinds = auditKindsByShape.get(key) ?? [];
		if (!kinds.includes(currentAuditKind)) kinds.push(currentAuditKind);
		auditKindsByShape.set(key, kinds);
		// SITTIR_AUDIT_DUMP=<kind> dumps the rule tree for that kind.
		if (process.env.SITTIR_AUDIT_DUMP === currentAuditKind) {
			console.error(`[audit-dump] ${currentAuditKind} (${key}):`);
			console.error(JSON.stringify(rule, null, 2));
		}
	}
}
function classifyTopLevelShape(rule: Rule): string {
	// Canonical for the trivial walk: the tree rooted at `rule`
	// — traversed through the structural wrappers the walker descends
	// (seq, optional, repeat, repeat1, choice, clause, variant) — must
	// satisfy:
	//
	//  - Every choice encountered during the traversal is "union-shaped"
	//    (token-like or flat-symbol-seq). No choice anywhere in the
	//    field/child-finding path has heterogeneous structural branches.
	//    A heterogeneous choice is a polymorph by any other name; the
	//    walker would have to case-analyze it, so flag it for variant()
	//    adoption (or hoisting into a proper polymorph parent).
	//  - Field contents are opaque to this classifier — `deriveValuesForRule`
	//    owns that subtree and its own simplification.
	//
	// Non-canonical shapes:
	//
	//  - `seq-with-nested-seq`: flattening gap (should be caught by the
	//     simplify fixpoint + flatten).
	//  - `*-with-heterogeneous-choice`: an inner choice with field-bearing
	//     branches. Needs variant() adoption at the parent kind or the
	//     branches hoisted / merged.
	//  - `group` / `alias` / `token` wrappers mid-tree: simplify should
	//     peel them.
	//  - `polymorph` anywhere: polymorphs have their own assemble path
	//     (AssembledPolymorph). Reaching derivation means classification
	//     missed it.
	switch (rule.type) {
		case 'seq': {
			if (rule.members.some((m) => m.type === 'seq'))
				return 'seq-with-nested-seq';
			for (const m of rule.members) {
				const inner = classifyTopLevelShape(m);
				if (inner !== 'canonical') return `seq-member-${inner}`;
			}
			return 'canonical';
		}
		case 'field':
		case 'symbol':
		case 'string':
		case 'pattern':
		case 'terminal':
		case 'enum':
		case 'supertype':
		case 'indent':
		case 'dedent':
		case 'newline':
			return 'canonical';
		case 'clause': {
			// A `clause` wrapper is sittir's "this seq position owns
			// a structural token" marker (e.g. field-semicolon, body-
			// brace). The walker descends through it the same as any
			// other single-content wrapper; treat its content the
			// same way the top-level classifier does.
			const inner = classifyTopLevelShape(rule.content);
			return inner === 'canonical' ? 'canonical' : `clause-wrapping-${inner}`;
		}
		case 'variant': {
			// `variant` wrappers below the top level — usually a
			// polymorph discriminator that simplify couldn't hoist
			// (e.g. buried under an optional). The walker unwraps
			// them without structural consequence; treat inner as
			// the canonicality check.
			const inner = classifyTopLevelShape(rule.content);
			return inner === 'canonical' ? 'canonical' : `variant-wrapping-${inner}`;
		}
		case 'token': {
			const inner = classifyTopLevelShape(rule.content);
			return inner === 'canonical' ? 'canonical' : `token-wrapping-${inner}`;
		}
		case 'repeat':
		case 'repeat1': {
			const inner = classifyTopLevelShape(rule.content);
			return inner === 'canonical'
				? 'canonical'
				: `${rule.type}-wrapping-${inner}`;
		}
		case 'choice': {
			// Every choice in the traversal must be a simple union — no
			// structural branches with fields. Flag heterogeneous
			// choices here instead of leaving the walker to merge them:
			// they are polymorphs in all but declaration.
			const allTokenLike = rule.members.every(isTokenLikeChoiceMember);
			if (allTokenLike) return 'canonical';
			const allFlatSymbolSeq = rule.members.every(isFlatSymbolSeqOrTokenLike);
			if (allFlatSymbolSeq) return 'canonical';
			// Distinct-named-fields choice: every branch is either a
			// `field(A, ...)` with its own name or a token-like atom.
			// Rust's `function_modifiers` (`choice(field('async', …),
			// field('const', …), field('unsafe', …), extern_modifier)`)
			// is the canonical example — the branches contribute
			// different fields to the enclosing kind rather than
			// different kinds themselves, so this is a legitimate
			// "one-of-these-fields" shape, NOT a polymorph. The walker's
			// choice case enumerates each branch and downgrades every
			// field to `optional` multiplicity; that's correct behavior.
			const allFieldOrToken = rule.members.every(
				(m) => m.type === 'field' || isTokenLikeChoiceMember(m)
			);
			if (allFieldOrToken) return 'canonical';
			// Polymorph surface: every branch wraps its content in a
			// `variant()` tag (from override-declared variant() adoption).
			// Variant-wrapped branches are never merged or hoisted —
			// they preserve polymorph identity — so the walker descends
			// into each independently and dispatches via `$variant`.
			// Canonical even when the inner content is a structural seq
			// with fields.
			if (rule.members.every((m) => m.type === 'variant')) return 'canonical';
			return 'choice-needs-variant-or-merge';
		}
		case 'optional': {
			const innerShape = classifyTopLevelShape(rule.content);
			return innerShape === 'canonical'
				? 'canonical'
				: `optional-wrapping-${innerShape}`;
		}
		case 'group':
		case 'alias':
			return `wrapper-${rule.type}`;
		case 'polymorph':
			return 'top-level-polymorph';
		default:
			return `other-${(rule as Rule).type}`;
	}
}
/**
 * Test a single `choice` member for being structurally "token-like" — a
 * bare kind reference (symbol / supertype / enum) or a repeat1 of
 * strings / enums. Both forms surface at parse time as a SINGLE child
 * with one typed union, not as a heterogeneous structure the trivial
 * derive walk would need to branch on.
 *
 * @remarks
 * Peels transparent wrappers (`alias`, `token`) before classifying — an
 * alias's surface kind lives in its target, and a `token` wrapper marks
 * a lexeme-level production that behaves like a terminal for derivation
 * purposes. `repeat1(enum(...))` / `repeat1(choice(string, string,
 * ...))` captures the `_non_special_token` pattern in tree-sitter
 * grammars — a run of operator punctuation tokens that tree-sitter
 * lexes as a single token stream; the derive walker treats this as a
 * single-value child slot just like a symbol member.
 */
function isTokenLikeChoiceMember(m: Rule): boolean {
	const peel = (r: Rule): Rule =>
		r.type === 'alias'
			? peel(r.content)
			: r.type === 'token'
				? peel(r.content)
				: r.type === 'variant'
					? peel(r.content)
					: r;
	const core = peel(m);
	if (
		core.type === 'symbol' ||
		core.type === 'supertype' ||
		core.type === 'enum'
	)
		return true;
	// Bare `string` / `pattern` members — token-literal alternatives.
	// `_non_special_token` has a choice containing dozens of bare
	// keyword strings alongside symbol refs; each contributes a
	// single-token alternative to the union, not a structural branch.
	if (core.type === 'string' || core.type === 'pattern') return true;
	// Structural-whitespace tokens (python-style indent/dedent/newline).
	// These behave as anonymous token separators — they don't surface
	// as addressable children, so they never contribute structural
	// branching to a choice arm.
	if (
		core.type === 'indent' ||
		core.type === 'dedent' ||
		core.type === 'newline'
	)
		return true;
	if (core.type === 'terminal') return true;
	// `optional(token-like)` preserves the union shape — the branch
	// contributes either the wrapped token or nothing. Rust's
	// `reference_expression` has `choice(choice-of-syms, optional(sym))`
	// for the raw-pointer-modifier spot; both arms are union-safe even
	// though one is an optional. Recurse to classify the inner.
	if (core.type === 'optional') return isTokenLikeChoiceMember(core.content);
	// Nested choice of token-like members — simplify should have
	// flattened this, but when flattening is blocked (e.g. by a
	// variant wrapper on the inner choice), the nested shape is still
	// structurally a union of tokens. `_lhs_expression` hits this
	// with a nested `choice(choice(sym, sym, ...), sym, ...)`.
	if (core.type === 'choice' && core.members.every(isTokenLikeChoiceMember))
		return true;
	if (core.type === 'repeat1' || core.type === 'repeat') {
		const inner = peel(core.content);
		if (inner.type === 'enum') return true;
		if (inner.type === 'string' || inner.type === 'pattern') return true;
		if (inner.type === 'symbol' || inner.type === 'supertype') return true;
		if (inner.type === 'choice' && inner.members.every(isTokenLikeChoiceMember))
			return true;
	}
	return false;
}

/**
 * Test a choice member for being a flat seq of token-like atoms — the
 * canonical shape for left-recursive operator chains and similar
 * "scalar list" productions.
 *
 * @remarks
 * `_let_chain` expands to `choice(seq(_let_chain, '&&', let_condition),
 * ...)` — every branch is a fixed-length seq of symbol/literal
 * references with no fields and no nested structure. Each branch
 * contributes a flat alternative to the union; the walker enumerates
 * each alternative's symbols as child values, which is a canonical
 * shape even though the raw rule.type is `seq`, not `symbol`. Falls
 * through to `isTokenLikeChoiceMember` for non-seq members so a mixed
 * choice `(seq(X, '&&', Y), bareY)` still qualifies.
 */
function isFlatSymbolSeqOrTokenLike(m: Rule): boolean {
	if (m.type === 'seq') {
		return m.members.every(isTokenLikeChoiceMember);
	}
	return isTokenLikeChoiceMember(m);
}

/** Log accumulated audit counts. Called by codegen entry points. */
export function dumpDerivationAudit(label: string = 'derivation-audit'): void {
	if (!DERIVE_AUDIT || auditCounts.size === 0) return;
	const sorted = [...auditCounts.entries()].sort((a, b) => b[1] - a[1]);
	console.error(`[${label}] non-canonical shapes reaching derivation:`);
	for (const [key, n] of sorted) {
		const kinds = auditKindsByShape.get(key) ?? [];
		console.error(
			`  ${n.toString().padStart(5)} ${key}  [${kinds.join(', ')}]`
		);
	}
	auditCounts.clear();
	auditKindsByShape.clear();
}

/**
 * Internal — fields-side walk. The exported derivation surface is
 * `deriveSlots`; this helper is its fields-portion.
 */
function _deriveFieldsInternal(rule: Rule): AssembledNonterminal[] {
	auditDerivationShape(rule, 'fields');
	return mergeFieldsByName(deriveFieldsRaw(rule, 'single'));
}

/**
 * Fold fields with the same grammar name into a single AssembledNonterminal whose
 * `values` is the union of the contributing fields' values. Tree-sitter allows
 * the same field name to appear multiple times in a rule (e.g. Python's
 * `if_statement` has `field('alternative', $.elif_clause)` inside a repeat AND
 * `field('alternative', $.else_clause)` inside an optional, producing a single
 * `alternative` slot at runtime whose values span both kinds). Emitters that
 * iterate `node.structuralFields` — the types emitter, the factory emitter,
 * the from-emitter — must see ONE slot per name, not the raw unmerged list.
 *
 * @remarks
 * We keep the first occurrence's `propertyName` / `paramName` / `source`
 * (none of them vary per-occurrence for the same name in practice — the
 * name determines them). Values and `aliasSources` are merged. The
 * referenced kind set is no longer cached on the slot — consumers
 * derive it via `kindsOf(slot)` from the merged `values`.
 */
function mergeFieldsByName(fields: AssembledNonterminal[]): AssembledNonterminal[] {
	if (fields.length <= 1) return fields;
	const byName = new Map<string, AssembledNonterminal>();
	for (const f of fields) {
		const existing = byName.get(f.name);
		if (!existing) {
			byName.set(f.name, f);
			continue;
		}
		const mergedValues = dedupeValues([...existing.values, ...f.values]);
		const mergedAliases =
			existing.aliasSources || f.aliasSources
				? { ...existing.aliasSources, ...f.aliasSources }
				: undefined;
		byName.set(f.name, {
			...existing,
			values: mergedValues,
			hasTrailing: existing.hasTrailing || f.hasTrailing,
			hasLeading: existing.hasLeading || f.hasLeading,
			aliasSources:
				mergedAliases && Object.keys(mergedAliases).length > 0
					? mergedAliases
					: undefined
		});
	}
	return Array.from(byName.values());
}

/**
 * Raw field derivation — produces one AssembledNonterminal per `field()` encounter.
 * Duplicates are merged by `deriveFields`. The `outerMultiplicity` threads
 * down from repeat/optional wrappers above the field.
 */
function deriveFieldsRaw(
	rule: Rule,
	outerMultiplicity: Multiplicity
): AssembledNonterminal[] {
	switch (rule.type) {
		case 'field': {
			// Synthetic outer-field wrapper: the autogen wraps a multi-
			// member seq containing inner fields in `field('x', seq(...))`.
			// Tree-sitter doesn't produce a single runtime value for such
			// wrappers — the inner fields are the real data. The template
			// walker already descends into these; field derivation has to
			// match so factories don't emit phantom parameters that the
			// template can't reference.
			if (isSyntheticFieldWrapper(rule.content)) {
				return deriveFieldsRaw(rule.content, outerMultiplicity);
			}

			const aliasSources = deriveAliasSources(rule.content);
			const basePropertyName = snakeToCamel(rule.name);

			// Determine the multiplicity for this field's content. The
			// field's own content rule (repeat/optional wrapper) takes
			// precedence over any outer multiplicity from a surrounding
			// repeat(field('x', ...)).
			const innerMult = fieldContentMultiplicity(
				rule.content,
				outerMultiplicity
			);

			// Derive values — each NodeOrTerminal entry carries its own multiplicity.
			const rawValues = deriveValuesForRule(rule.content, innerMult);
			const values = dedupeValues(rawValues);

			// Derive trailing/leading flags — only meaningful for array/nonEmptyArray
			// slots (i.e. the field backs a repeat that carries the flag). Gate on
			// multiplicity first so optional(repeat(...)) shapes don't pollute the flag.
			const isMultiSlot = values.some(
				(v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray'
			);
			const hasTrailing =
				isMultiSlot && findRepeatFlag(rule.content, 'trailing');
			const hasLeading = isMultiSlot && findRepeatFlag(rule.content, 'leading');

			const propertyName = isMultiSlot ? pluralize(basePropertyName) : basePropertyName;

			const outerField: AssembledNonterminal = {
				name: rule.name,
				propertyName,
				configKey: basePropertyName,
				storageName: rule.name,
				paramName: safeParamName(propertyName),
				values,
				hasTrailing,
				hasLeading,
				aliasSources:
					Object.keys(aliasSources).length > 0 ? aliasSources : undefined,
				source: rule.source ?? 'grammar'
				// projection field eliminated — consumers use kindsOf(slot)
			};

			return [outerField];
		}
		case 'seq':
			return rule.members.flatMap((m) => deriveFieldsRaw(m, outerMultiplicity));
		case 'optional':
			// `optional(repeat1(X, sep))` is the canonical lift of
			// `optional(commaSep1(X))` — e.g. python `parameters: seq('(',
			// optional(_parameters), ')')` where `_parameters` inlines to
			// `repeat1($.parameter, ',')`. Empty `()` is valid input, so
			// the slot is array-multiplicity (zero-or-more), NOT
			// nonEmptyArray. Recursing through repeat1 with the default
			// rule would clobber it back to nonEmptyArray, producing a
			// slot the factory refuses to construct empty. Mirrors
			// `collectChildFromMember` and `deriveValuesForRule`.
			if (rule.content.type === 'repeat1') {
				return deriveFieldsRaw(rule.content.content, 'array');
			}
			return deriveFieldsRaw(rule.content, 'optional');
		case 'repeat':
			return deriveFieldsRaw(rule.content, 'array');
		case 'repeat1':
			return deriveFieldsRaw(rule.content, 'nonEmptyArray');
		case 'choice': {
			// Choice at a position contributes ONE slot whose `values`
			// array is the union of all arms (the field walker handles
			// every position, so a positional choice no longer explodes
			// into N separate slots like the old children walker did).
			// Slot name takes the
			// first node-ref arm's kind name for naming-continuity with
			// the historical first-arm-named child entry; final remap to
			// 'children' / 'child' keys lives in `buildSlotsRecord`
			// per FR-T05 once the override migration enables strict
			// enforcement.
			const values = dedupeValues(
				deriveValuesForRule(rule, outerMultiplicity)
			);
			if (values.length === 0) return [];
			const firstRef = values.find((v) => v.kind === 'node-ref') as
				| NodeRef
				| undefined;
			const isMultiSlot = values.some(
				(v) =>
					v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray'
			);
			const baseName = firstRef
				? ((firstRef.node as UnresolvedRef).name ?? '').replace(
						/^_+/,
						''
				  ) || (isMultiSlot ? 'children' : 'child')
				: isMultiSlot
					? 'children'
					: 'child';
			const basePropertyName = snakeToCamel(baseName);
			const propertyName = isMultiSlot ? pluralize(basePropertyName) : basePropertyName;
			return [
				{
					name: baseName,
					propertyName,
					configKey: basePropertyName,
					storageName: 'children',
					paramName: safeParamName(propertyName),
					values,
					hasTrailing: false,
					hasLeading: false,
					source: 'inferred'
				}
			];
		}
		case 'clause':
			return deriveFieldsRaw(rule.content, 'optional');
		case 'variant':
			// Rare — post-simplify most variant wrappers are either
			// promoted to polymorph forms (variant() adoption) or
			// stripped. A handful survive in rust's nested-variant
			// choice arms; unwrap and continue so their inner fields
			// still surface.
			return deriveFieldsRaw(rule.content, outerMultiplicity);
		case 'symbol': {
			// Top-level positional symbol — drops the hidden-rule leading
			// underscore (`_expression` → `expression`); resolves
			// `aliasedFrom` so only source kinds appear in the values list.
			const refName = rule.aliasedFrom ?? rule.name;
			const cleanName = rule.name.replace(/^_+/, '') || rule.name;
			const isMulti = outerMultiplicity === 'array' || outerMultiplicity === 'nonEmptyArray';
			const basePropertyName = snakeToCamel(cleanName);
			const propertyName = isMulti ? pluralize(basePropertyName) : basePropertyName;
			return [
				{
					name: cleanName,
					propertyName,
					configKey: basePropertyName,
					storageName: 'children',
					paramName: safeParamName(propertyName),
					values: [
						{
							kind: 'node-ref',
							node: { kind: 'unresolved-ref', name: refName },
							multiplicity: outerMultiplicity
						}
					],
					hasTrailing: false,
					hasLeading: false,
					source: 'inferred'
				}
			];
		}
		case 'supertype': {
			// Top-level positional supertype reference — each subtype is
			// a valid concrete kind the slot can hold;
			// they share the slot, named after the supertype.
			const cleanName = rule.name.replace(/^_+/, '') || rule.name;
			const isMulti = outerMultiplicity === 'array' || outerMultiplicity === 'nonEmptyArray';
			const basePropertyName = snakeToCamel(cleanName);
			const propertyName = isMulti ? pluralize(basePropertyName) : basePropertyName;
			return [
				{
					name: cleanName,
					propertyName,
					configKey: basePropertyName,
					storageName: 'children',
					paramName: safeParamName(propertyName),
					values: rule.subtypes.map((name) => ({
						kind: 'node-ref' as const,
						node: { kind: 'unresolved-ref' as const, name },
						multiplicity: outerMultiplicity
					})),
					hasTrailing: false,
					hasLeading: false,
					source: 'inferred'
				}
			];
		}
		case 'string':
		case 'pattern':
		case 'terminal':
		case 'token':
		case 'enum':
		case 'indent':
		case 'dedent':
		case 'newline':
			// Leaves / token-literals at the top level — render as text,
			// contribute no addressable slots. Explicit cases keep the
			// switch exhaustive (Constitution XI corollary: every
			// discriminated-union switch ends in either a complete
			// per-variant arm or assertNever).
			return [];
		case 'alias':
		case 'group':
		case 'polymorph':
			// `group` / `alias` are simplify-stripped by the time
			// derivation sees the rule; `polymorph` has its own
			// assemble path (classifyNode returns 'polymorph' and
			// routes into AssembledPolymorph instead of Branch/
			// Container getters). Reaching any of them here means a
			// canonicalization gap — throw so the next audit-clean
			// session investigates.
			throw new Error(
				`deriveFieldsRaw: unexpected '${rule.type}' in canonical input — ` +
					`simplify should have stripped / classified it before derivation. ` +
					`currentAuditKind=${currentAuditKind ?? '(none)'}`
			);
	}
}

/**
 * Determine the effective multiplicity for a field's content rule, threading
 * any outer multiplicity through field-level wrappers (repeat/optional directly
 * inside the field).
 *
 * `field('items', repeat($._item))` → content is `repeat` → `'array'`
 * `field('items', repeat1($._item))` → content is `repeat1` → `'nonEmptyArray'`
 * `field('x', optional($.foo))` → content is `optional` → `'optional'`
 * `field('x', $.foo)` → content is `symbol`, outerMultiplicity is `single` → `'single'`
 */
function fieldContentMultiplicity(
	content: Rule,
	outerMultiplicity: Multiplicity
): Multiplicity {
	switch (content.type) {
		case 'repeat':
			return 'array';
		case 'repeat1':
			return 'nonEmptyArray';
		case 'optional': {
			const inner = fieldContentMultiplicity(
				content.content,
				outerMultiplicity
			);
			// optional(repeat1(...)) → repeat (the optional makes nonEmpty drop)
			if (inner === 'nonEmptyArray') return 'array';
			return 'optional';
		}
		default:
			return outerMultiplicity;
	}
}

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
export function deriveSlots(rule: Rule): readonly AssembledNonterminal[] {
	// The field walker handles positional symbol/supertype/choice content
	// too, so it produces every slot — no separate children walker needed.
	return _deriveFieldsInternal(rule);
}

/**
 * Walk a field's content and collect alias-source provenance: for each
 * symbol reference that was resolved from `alias($.source, $.target)`
 * (i.e. its `aliasedFrom` is set), record `{ [target]: source }`. The
 * wrap emitter consumes this to emit `drillAs(entry, tree, target, source)`
 * rewriting `$type` at drill-in for alias-target rewrites.
 */
function deriveAliasSources(rule: Rule): Record<string, string> {
	const out: Record<string, string> = {};
	const walk = (r: Rule): void => {
		switch (r.type) {
			case 'symbol':
				if ((r as { aliasedFrom?: string }).aliasedFrom) {
					out[r.name] = (r as { aliasedFrom: string }).aliasedFrom;
				}
				return;
			case 'choice':
			case 'seq':
				r.members.forEach(walk);
				return;
			case 'field':
			case 'variant':
			case 'optional':
			case 'repeat':
			case 'repeat1':
			case 'clause':
			case 'group':
				walk(r.content);
				return;
			default:
				return;
		}
	};
	walk(rule);
	return out;
}

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
export function isSyntheticFieldWrapper(content: Rule): boolean {
	if (content.type === 'repeat' || content.type === 'repeat1') {
		return isSyntheticFieldWrapper(content.content);
	}
	if (!isSeq(content)) return false;
	return content.members.some(isField);
}

/**
 * Unified walker that produces `NodeOrTerminal[]` directly from a field's
 * content rule. Each entry carries its own per-value `multiplicity` — this
 * preserves information that the old parallel `deriveContentTypes` +
 * `deriveLiteralValues` pair silently dropped (e.g. `choice('const',
 * $.mutable_specifier)` previously produced `contentTypes=['mutable_specifier']`
 * and `literalValues=[]` because the old bail-on-mixed logic gave up;
 * now it produces `[TerminalValue('const','single'), NodeRef('mutable_specifier','single')]`).
 *
 * Multiplicity is threaded through the walker:
 *   - outer `optional(...)` → entries from content get `optional` multiplicity
 *   - outer `repeat(...)` → entries from content get `array` multiplicity
 *   - outer `repeat1(...)` → entries from content get `nonEmptyArray` multiplicity
 *   - no wrapper → entries get `single` multiplicity
 *
 * A `choice` produces MULTIPLE entries — one per arm (with deduplication).
 */
function deriveValuesForRule(
	rule: Rule,
	multiplicity: Multiplicity
): NodeOrTerminal[] {
	switch (rule.type) {
		case 'symbol':
			// Ref kind: resolve to SOURCE kind (`aliasedFrom`, when the
			// symbol came from an alias). Only source kinds exist in
			// rules post-synthesis-removal.
			return [
				{
					kind: 'node-ref',
					node: { kind: 'unresolved-ref', name: rule.aliasedFrom ?? rule.name },
					multiplicity
				}
			];
		case 'supertype':
			// Supertype refs expand to their subtype list — each subtype is a
			// valid concrete kind the slot can hold.
			return rule.subtypes.map((name) => ({
				kind: 'node-ref' as const,
				node: { kind: 'unresolved-ref' as const, name },
				multiplicity
			}));
		case 'string':
			return [{ kind: 'terminal', value: rule.value, multiplicity }];
		case 'enum':
			// Enum: each enum member is a TerminalValue
			return rule.members.map((m) => ({
				kind: 'terminal' as const,
				value: m.value,
				multiplicity
			}));
		case 'choice':
			// Each arm is independent — union all entries. Arms may differ in
			// their own multiplicity if they wrap repeat/optional differently.
			return rule.members.flatMap((m) => deriveValuesForRule(m, multiplicity));
		case 'optional':
			// `optional(repeat1(X, sep))` survives evaluate when the
			// optional wraps the canonical commaSep1 lift (e.g. python's
			// `parameters: seq('(', optional(_parameters), ')')`).
			// Recursing with multiplicity 'optional' lets the inner
			// 'repeat1' case clobber it back to 'nonEmptyArray', which
			// mis-marks the slot as never-empty even though `()` is
			// valid. Downgrade to 'array' when the inner is repeat1, so
			// the outer-optional semantics survive. Mirrors the
			// `collectChildFromMember` rule for child slots.
			if (rule.content.type === 'repeat1') {
				return deriveValuesForRule(rule.content.content, 'array');
			}
			return deriveValuesForRule(rule.content, 'optional');
		case 'repeat':
			return deriveValuesForRule(rule.content, 'array');
		case 'repeat1':
			return deriveValuesForRule(rule.content, 'nonEmptyArray');
		case 'field':
			// Nested field inside a choice — recurse into its content
			return deriveValuesForRule(rule.content, multiplicity);
		case 'variant':
		case 'clause':
		case 'group':
			return deriveValuesForRule(rule.content, multiplicity);
		case 'seq':
			// Seq inside a choice arm — flatten all members (rare, but
			// handles seq-of-symbols within choice arms).
			return rule.members.flatMap((m) => deriveValuesForRule(m, multiplicity));
		default:
			return [];
	}
}

/**
 * Compute the merged `values: NodeOrTerminal[]` for an AssembledNonterminal or
 * AssembledNonterminal. Deduplicates by (kind+name/value, multiplicity) pair so
 * that two choice arms referencing the same kind with the same multiplicity
 * produce a single entry.
 *
 * The merge strategy for name-conflicts: if the same node name appears with
 * different multiplicities in different choice arms, keep BOTH entries — the
 * per-value shape is the point.
 */
function dedupeValues(values: NodeOrTerminal[]): NodeOrTerminal[] {
	const seen = new Set<string>();
	const result: NodeOrTerminal[] = [];
	for (const v of values) {
		const key =
			v.kind === 'node-ref'
				? `node-ref:${(v.node as UnresolvedRef).name ?? '?'}:${v.multiplicity}`
				: `terminal:${v.value}:${v.multiplicity}`;
		if (!seen.has(key)) {
			seen.add(key);
			result.push(v);
		}
	}
	return result;
}

// ---------------------------------------------------------------------------
// Assembled node types — class hierarchy
//
// Abstract base + concrete subclasses per model type.
// Shape matches the previous interfaces exactly; methods/getters will be added
// as we collapse logic into the classes.
// ---------------------------------------------------------------------------

/**
 * JS reserved words that a raw factory function name collides with —
 * those get a trailing underscore so the emitted code parses.
 */
const JS_RESERVED_FACTORY_NAMES = new Set([
	'break',
	'case',
	'catch',
	'class',
	'const',
	'continue',
	'debugger',
	'default',
	'delete',
	'do',
	'else',
	'enum',
	'export',
	'extends',
	'false',
	'finally',
	'for',
	'function',
	'if',
	'import',
	'in',
	'instanceof',
	'let',
	'new',
	'null',
	'return',
	'static',
	'super',
	'switch',
	'this',
	'throw',
	'true',
	'try',
	'typeof',
	'var',
	'void',
	'while',
	'with',
	'yield',
	'async',
	'await',
	'arguments'
]);

// Reserved or restricted identifiers that cannot be top-level function names
// in strict-mode TypeScript (or would shadow globals in problematic ways).
const FACTORY_NAME_RESERVED = new Set([
	'arguments',
	'eval',
	'yield',
	'await',
	'async',
	'function',
	'class',
	'import',
	'export',
	'default',
	'return',
	'throw',
	'new',
	'delete',
	'typeof',
	'instanceof',
	'in',
	'of',
	'let',
	'const',
	'var',
	'null',
	'true',
	'false',
	'undefined',
	'NaN',
	'Infinity',
	'static',
	'public',
	'private',
	'protected',
	'interface',
	'package',
	'implements'
]);

/**
 * Strip the leading underscore (hidden-rule marker) from a normalized kind string
 * and collapse internal double-underscores into `_U_` so they survive PascalCase
 * flattening.
 */
function prepareKindForPascalCase(normalized: string): string {
	return normalized.replace(/^_+/, '').replace(/__+/g, '_U_');
}

/**
 * Derive `typeName`, `factoryName`, and `irKey` from a raw grammar kind string.
 *
 * Moved here from assemble.ts so the `AssembledNodeBase` constructor can call
 * it directly, eliminating the need for callers to pre-compute and pass these
 * derived fields.
 */
export function nameNode(kind: string): {
	typeName: string;
	factoryName: string;
	irKey: string;
} {
	const normalized = /^[\w_]+$/.test(kind) ? kind : tokenToName(kind);
	const marked = prepareKindForPascalCase(normalized);
	let typeName =
		marked
			.split('_')
			.filter(Boolean)
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join('') || 'Anonymous';
	if (/^\d/.test(typeName)) typeName = `Tok_${typeName}`;
	let factoryName = typeName.charAt(0).toLowerCase() + typeName.slice(1);
	const irKey = factoryName;
	if (FACTORY_NAME_RESERVED.has(factoryName)) factoryName = `${factoryName}_`;
	return { typeName, factoryName, irKey };
}

export abstract class AssembledNodeBase<R extends Rule = Rule> {
	readonly kind: string;
	// typeName / factoryName are writable so assemble()'s post-pass
	// (resolveCollidingNames) can rename hidden kinds that clashed with
	// a visible sibling — same pattern as `irKey`.
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
	get stampChildExpression(): string | undefined {
		return this.stampExpression;
	}
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
	userFacing: boolean = true;

	constructor(
		kind: string,
		rule: R,
		opts?: {
			factoryName?: string;
			irKey?: string;
			source?: RuleSource;
			hidden?: boolean;
		}
	) {
		this.kind = kind;
		this.rule = rule;
		const derived = nameNode(kind);
		this.typeName = derived.typeName;
		// `hidden: true` suppresses factoryName derivation (node has no factory).
		// `factoryName: string` overrides the derived name.
		// Default: use the derived factoryName.
		this.factoryName =
			opts?.hidden === true
				? undefined
				: (opts?.factoryName ?? derived.factoryName);
		this.irKey = opts?.irKey ?? derived.irKey;
		this.source = opts?.source;
	}

	/** A node is hidden when it has no factory (supertype, group, token). */
	get hidden(): boolean {
		return this.factoryName === undefined;
	}

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
	isTextTemplate(externals: ReadonlySet<string> | undefined): boolean {
		if (
			externals !== undefined &&
			externals.size > 0 &&
			hasHiddenExternalRef(this.rule, externals)
		) {
			return true;
		}
		if (isVerbatimTokenStream(this.rule)) return true;
		// Container with optional-punct prefix: the template walker emits
		// nothing for `optional(punct)` (see `containsOnlyPunctuation`
		// path in `template-walker.ts` optional case). A seq whose FIRST
		// member is an optional-punctuation wrapper — e.g.
		// `seq(optional('-'), choice(integer, float))` for
		// `_simple_pattern_negative` — would silently drop the prefix.
		// Fall back to `{{ text }}` so the anonymous prefix is preserved.
		return hasOptionalPunctPrefix(this.rule);
	}

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
	protected textTemplate(
		externals: ReadonlySet<string> | undefined
	): RenderTemplateEntry | undefined {
		if (this.isTextTemplate(externals)) {
			return {
				template: '{{ text }}',
				surface: {
					slots: [],
					usesChildren: false,
					usesVariant: false,
					usesText: true
				}
			};
		}
		return undefined;
	}

	/**
	 * Factory function name to emit in factories.ts — factoryName with a
	 * trailing `_` when the bare name collides with a JS reserved word.
	 * Returns `undefined` for hidden nodes.
	 */
	get rawFactoryName(): string | undefined {
		if (this.factoryName === undefined) return undefined;
		return JS_RESERVED_FACTORY_NAMES.has(this.factoryName)
			? `${this.factoryName}_`
			: this.factoryName;
	}

	/** Tree interface name: `${typeName}Tree`. */
	get treeTypeName(): string {
		return `${this.typeName}Tree`;
	}

	/** Config type alias: `${typeName}Config`. */
	get configTypeName(): string {
		return `${this.typeName}Config`;
	}

	/** Loose-input type alias: `Loose${typeName}` — the camelCase
	 *  bag shape accepted by `from()` for programmatic construction. */
	get fromInputTypeName(): string {
		return `Loose${this.typeName}`;
	}

	/** `from()` resolver function name: `${factoryName}From` for non-hidden nodes. */
	get fromFunctionName(): string | undefined {
		if (this.factoryName === undefined) return undefined;
		return `${this.factoryName}From`;
	}

	/**
	 * Emit the templates directory entry for this node. Returns `undefined`
	 * for nodes that don't need a template (leaves/keywords/enums/tokens
	 * render via `.text` directly; supertypes dispatch through their
	 * concrete subtype). Structural subclasses (AssembledBranch,
	 * AssembledGroup, AssembledPolymorph) override this to walk their
	 * rule tree and produce the right shape.
	 */
	renderTemplate(
		_rules?: Record<string, Rule>,
		_wordMatcher?: RegExp,
		_externals?: ReadonlySet<string>
	): RenderTemplateEntry | undefined {
		return undefined;
	}
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
export function kindsOf(slot: AssembledNonterminal): readonly string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const v of slot.values) {
		if (v.kind !== 'node-ref') continue;
		const name = isUnresolvedRef(v.node)
			? (v.node as UnresolvedRef).name
			: (v.node as AssembledNode).kind;
		if (!seen.has(name)) {
			seen.add(name);
			out.push(name);
		}
	}
	return out;
}

// --- Concrete classes per model type ---

/**
 * Inline `$X_CLAUSE` references into the template as Jinja
 * `{% if x %}<body>{% endif %}` blocks. The body's `$VAR`
 * placeholders stay in `$`-dialect; the final emitter pass converts
 * them to `{{ var }}` in one go.
 *
 * This is the single chokepoint where the walker-era `clauses` record
 * collapses into the template string. After this helper runs, the
 * returned template is Jinja-shaped (save for `$VAR`) — no separate
 * metadata record needs to travel downstream.
 */
function inlineJinjaClauses(
	template: string,
	clauses: Record<string, string>
): string {
	if (Object.keys(clauses).length === 0) return template;
	// Whether a lowercased `$NAME` placeholder refers to a walker-
	// emitted clause. Membership in the `clauses` dict is the ONLY
	// correct signal — name-suffix heuristics are wrong because some
	// grammars have real rule kinds named `for_in_clause` /
	// `except_clause` / `case_clause` / etc. that would false-
	// positive a `.endsWith('_clause')` check.
	const isClauseName = (lowerName: string): boolean =>
		clauses[lowerName] !== undefined;
	// Fixpoint loop so a clause body that itself references another
	// `$FOO_CLAUSE` resolves after the outer clause it sits inside.
	// Bounded — N clauses finish in ≤ N passes.
	let current = template;
	for (let pass = 0; pass < 16; pass++) {
		// Also consume whitespace adjacent to the placeholder so we
		// can pull it INTO the body — this makes the ambient spacing
		// emit only when the clause fires (no trailing-space leak
		// when the field is absent). Jinja's `{%-` / `-%}` markers
		// strip that same whitespace from the outer template so the
		// only place it appears is inside the conditional body.
		const next = current.replace(
			/\$([A-Z][A-Z0-9_]*_CLAUSE)/g,
			(full, marker: string) => {
				// Historically this regex captured `( *)\$CLAUSE( *)` and
				// pulled outer whitespace INTO the clause body (with
				// `{%- -%}` trim markers). That worked for clauses with
				// flanking literals (`:type`, `=value` — the literal and
				// space co-render), but silently broke for clauses whose
				// only content is a placeholder: when absent, the body
				// rendered empty, and the absorbed outer whitespace was
				// gone — gluing the clause's outer neighbors. Example:
				// `{{ vis }} $UNSAFE_CLAUSE trait` → absorbed both spaces
				// → `{{ vis }}{% if unsafe %}...{% endif %}trait` →
				// `pubtrait` on unsafe-absent. Leave outer whitespace
				// in the outer template — when absent, the neighbors
				// keep their ambient separator.
				const leading = '';
				const trailing = '';
				const key = marker.toLowerCase();
				const body = clauses[key];
				if (body === undefined) return full; // not a clause we emitted — leave as-is
				const stem = key.slice(0, -'_clause'.length);
				// A `$NAME` inside the body that is NOT itself a clause
				// reference names the optional field the clause gates on
				// (clauses exist precisely because their field is
				// optional). On the askama side optional fields are typed
				// `Option<String>` — the `| value` filter unwraps to `""`
				// when None, inner String when Some. The nunjucks
				// `value` filter tolerates undefined/null and coerces
				// NodeData/strings, so emission is cross-renderer
				// identical.
				//
				// Pre-substitute here (rather than in `translateToJinja`)
				// because translateToJinja doesn't know which
				// placeholders sit inside a clause body. Multi-valued
				// `$$$NAME` and specials (`$TEXT`, `$NEWLINE`, `$INDENT`,
				// `$DEDENT`) stay raw and get handled by the later pass.
				const convertedBody = body.replace(
					/(?<!\$)\$([A-Z][A-Z0-9_]*)/g,
					(m, name: string) => {
						const lower = name.toLowerCase();
						// Nested clause reference — leave raw, next
						// fixpoint pass substitutes it.
						if (isClauseName(lower)) return m;
						// Specials handled by translateToJinja stay raw.
						if (
							lower === 'newline' ||
							lower === 'indent' ||
							lower === 'dedent' ||
							lower === 'text'
						) {
							return m;
						}
						// `| value` was a cross-engine safety wrapper for
						// `Option<String>`-typed fields (askama side) /
						// undefined-tolerant nunjucks (TS side). Our struct
						// fields are `String` (empty when absent) on both
						// engines, so the wrap is a no-op — drop it to
						// avoid the askama built-in `value::<T>` collision.
						return `{{ ${lower} }}`;
					}
				);
				// `isPresent` instead of `{% if stem %}`: nunjucks's
				// truthy-check works fine, but askama rejects `{% if x %}`
				// on `Option<String>`. The sittir-core filter returns
				// bool in both engines.
				//
				// `{%- if ... -%}` / `{%- endif -%}` whitespace markers —
				// used ONLY when there was ambient whitespace around the
				// placeholder in the outer template. The `-` markers
				// strip the adjacent whitespace the regex captured; the
				// whitespace is re-emitted INSIDE the body so it only
				// appears when the clause is present. This is the
				// difference between `(parameter )` (trailing space leak)
				// and `(parameter)` when an optional type is absent.
				const leftTrim = leading.length > 0 ? '-' : '';
				const rightTrim = trailing.length > 0 ? '-' : '';
				return `{%${leftTrim} if ${stem} | isPresent %}${leading}${convertedBody}${trailing}{% endif ${rightTrim}%}`;
			}
		);
		if (next === current) return next;
		current = next;
	}
	return current;
}

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

/**
 * Detect whether a container's children slot may be empty.
 *
 * Returns `true` when the rule is a `repeat()` (zero-or-more) at any
 * level reachable without crossing a `repeat1()` boundary, or when a
 * `choice` includes a `blank`-equivalent arm, or when the whole subtree
 * is `optional`. `repeat1()` means at least one child is required —
 * children are never empty in that case.
 *
 * This is deliberately conservative: false positives (reporting
 * "may be empty" when children are actually always present) only produce
 * unnecessary `{% if %}` guards — wrong output is never emitted.
 */
function childrenMayBeEmpty(rule: Rule): boolean {
	switch (rule.type) {
		case 'repeat':
		case 'optional':
			return true;
		case 'repeat1':
			return false;
		case 'choice':
			// `blank()` is encoded as `choice([])` (empty members). An
			// empty-members choice means "blank" — definitely zero children.
			if (rule.members.length === 0) return true;
			// Any member that may-be-empty makes the whole choice potentially empty.
			return rule.members.some((m) => childrenMayBeEmpty(m));
		case 'seq':
			// A seq is empty only if every member may be empty.
			return rule.members.every((m) => childrenMayBeEmpty(m));
		// Terminal / leaf cases — always contribute at least one token.
		case 'symbol':
		case 'string':
		case 'pattern':
		case 'token':
		case 'supertype':
		case 'enum':
		case 'terminal':
		case 'polymorph':
		case 'alias':
		case 'indent':
		case 'dedent':
		case 'newline':
			return false;
		case 'field':
		case 'variant':
		case 'clause':
		case 'group':
			return childrenMayBeEmpty(rule.content);
		default:
			return assertNever(rule);
	}
}

/**
 * When `optionalChildren` is set, absorb the flanking spaces
 * around `{{ children | ... }}` into a whitespace-controlled
 * `{%- if children | isPresent %} ... {% endif -%}` conditional so an
 * empty-children render emits no stray whitespace between surrounding
 * delimiters.
 *
 * Transforms the pattern `<delim> {{ children | filter(...) }} <delim>`
 * by replacing the middle ` {{ children | ... }} ` with
 * `{%- if children | isPresent %} {{ children | ... }} {% endif -%}`.
 * The `escapeJinjaBraceCollisions` step that follows in `translateToJinja`
 * then inserts a space inside the `{` / `}` delimiter adjacency (producing
 * `{ {%- if ... %} ... {% endif -%} }`), which renders as:
 *   - empty children → `{}` (no spaces — both `{%-` and `-%}` suppress the
 *     adjacent spaces in the output stream when the block is absent)
 *   - non-empty children → `{ 1,2 }` (spaces preserved — the body fires
 *     and emits the leading/trailing spaces from inside the conditional)
 *
 * Cross-renderer safe: `{%-` / `-%}` whitespace-control markers work
 * identically in Nunjucks (TS) and Askama (Rust) — see memory note
 * `project_jinja_intersection_safe_primitives`. `is_present` is the
 * canonical cross-engine presence filter.
 *
 * @remarks
 * Only fires when the children expression is surrounded by literal
 * spaces on both sides (`<space>{{ children | ... }}<space>`). Templates
 * that have no surrounding spaces are left untouched.
 */
function absorbFlankingChildrenSpaces(tmpl: string): string {
	// The children block is `{{ children | <filter>("<sep>") }}`.
	// Absorb the adjacent whitespace (or inject it when absent) around the
	// block into a whitespace-controlled `{%- if children | isPresent %} …
	// {% endif -%}` conditional, so an empty-children render produces `{}`
	// instead of `{  }`.
	//
	// Two source forms (from the grammar walker):
	//   Space-padded : walker emitted `{ $$$CHILDREN }` → translated to
	//                  `{ {{ children | ... }} }` (spaces inside the braces).
	//   No-space     : walker emitted `{$$$CHILDREN}` → translated to
	//                  `{{{ children | ... }}}` (no spaces).
	//
	// Target form for both (before `escapeJinjaBraceCollisions`):
	//   `{<SP>{%- if children | isPresent %} {{ children | ... }} {% endif -%}<SP>}`
	//   → `escapeJinjaBraceCollisions` splits `{<SP>{%-` correctly and
	//     yields `{ {%- if ... %} {{ children | ... }} {% endif -%} }`.
	//   Empty render: `{}` (whitespace-control markers suppress the spaces).
	//   Non-empty:    `{ item1,item2 }`.
	//
	// `[^)]*` captures the separator argument (e.g. `","`, `" "`) — it never
	// contains `)`.

	// Case 1: space-padded — replace ` {{ children | ... }} ` (note leading
	// and trailing literal spaces) with the conditional form. The surrounding
	// `{` / `}` delimiters are NOT captured; they remain in place. The
	// `escapeJinjaBraceCollisions` step later inserts a separating space
	// between the dict-brace `{` and the leading `{%-` tag.
	let result = tmpl.replace(
		/ (\{\{ children \| \w+\([^)]*\) \}\}) /g,
		'{%- if children | isPresent %} $1 {% endif -%}'
	);
	// Case 2: no-space form — `{{{ children | ... }}}` — the outer `{` and `}`
	// are the Python dict braces that immediately flank the Jinja block. Replace
	// just the Jinja block and inject spaces so the result has the same shape as
	// case 1 after the space-absorb step. The replacement injects ` ` before and
	// after so the surrounding `{` / `}` produce `{ {%- if ... -%} }`.
	result = result.replace(
		/\{(\{\{ children \| \w+\([^)]*\) \}\})\}/g,
		'{ {%- if children | isPresent %} $1 {% endif -%} }'
	);
	return result;
}

/** @internal — exported for direct unit testing. */
export function translateToJinja(
	tmpl: string,
	meta: JinjaTranslateMeta
): string {
	const guarded = wrapOptionalFieldPlaceholders(tmpl, meta.optionalFields);
	const varPattern = /(\$\$\$|\$\$|\$_|\$)([A-Z][A-Z0-9_]*)/g;
	const defaultSep = meta.joinBy ?? ' ';
	const translated = guarded.replace(
		varPattern,
		(_full, pfx: string, name: string) => {
			const key = name.toLowerCase();
			if (key === 'newline') return '\n';
			if (key === 'indent') return '';
			if (key === 'dedent') return '';
			if (pfx === '$$$') {
				// `joinByField['children']` IS honoured — the walker pins it
				// to `""` for separator-less repeats over visible
				// children (template_literal_type, template_string) so adjacent
				// substitutions concatenate without a stray space.
				const sep = meta.joinByField?.[key] ?? defaultSep;
				const filter = filterForFlanks(key, meta);
				return `{{ ${key} | ${filter}(${JSON.stringify(sep)}) }}`;
			}
			return `{{ ${key} }}`;
		}
	);
	const postProcessed = meta.optionalChildren
		? absorbFlankingChildrenSpaces(translated)
		: translated;
	return escapeJinjaBraceCollisions(
		absorbHeadConditionalTrailingSpace(postProcessed)
	);
}

/**
 * Leading-list-conditional space absorption.
 *
 * After `wrapOptionalFieldPlaceholders` wraps a `$$$NAME` placeholder
 * sitting at the template head with `{% if name | isPresent %}…{% endif %}`,
 * the unconditional space between the conditional and the next required
 * token is still emitted when the list is empty. Pull that trailing
 * space INSIDE the conditional body so it disappears with the absent
 * list. Mirrors `absorbHeadLeadingSeparatorIntoConditionals`'s behaviour
 * for walker-emitted single-field conditionals — but operates on the
 * post-translation string so it can reach the conditionals that were
 * synthesized by `wrapOptionalFieldPlaceholders` (which runs on the
 * raw `$$$NAME` form before translation).
 *
 * Runs greedily: a chain of consecutive head conditionals each absorb
 * the trailing space, so all-absent renders cleanly with no leading
 * whitespace and a single conditional firing places its content
 * followed by the absorbed separator before the required-content head.
 */

function absorbHeadConditionalTrailingSpace(tmpl: string): string {
	let work = tmpl;
	let runStart = 0;
	// Walk past walker-injected `{#- @generated -#}` headers if present.
	const commentMatch = work.match(/^\{#-?[^#]*-?#\}/);
	if (commentMatch) runStart = commentMatch[0].length;
	const condFull = /^(\{%-? if [^%]+-?%\})(.*?)(\{%-? endif -?%\}) /s;
	while (true) {
		const head = work.slice(runStart);
		const m = head.match(condFull);
		if (!m) break;
		const ifTag = m[1]!;
		let body = m[2]!;
		const endTag = m[3]!;
		if (body.includes('{% if') || body.includes('{%- if')) break;
		if (!body.endsWith(' ')) body = `${body} `;
		const replacement = `${ifTag}${body}${endTag}`;
		work =
			work.slice(0, runStart) +
			replacement +
			work.slice(runStart + m[0].length);
		runStart += replacement.length;
	}
	return work;
}

/**
 * Wrap each unguarded `$NAME` placeholder whose lower-cased name is in
 * `optionalFields` with `{% if name | isPresent %}…{% endif %}`. The
 * leading whitespace adjacent to the placeholder is absorbed INTO the
 * conditional body so an absent optional contributes zero output —
 * preventing the `fn f  ()` double-space gap when `type_parameters`
 * renders empty. Trailing whitespace is left outside so the next
 * required slot still has its own separator.
 *
 * Also wraps `$$$NAME` list placeholders for optional
 * list-shaped fields. The list-shape filter `isPresent` returns false
 * for empty arrays, so wrapping `$$$DECORATOR` etc. gates surrounding
 * separators on whether the list actually has elements.
 *
 * @remarks
 * Placeholders enclosed in a `{% if … %}…{% endif %}` block emitted by
 * the walker (e.g. for fields with flanking literals like `:type` or
 * `=value`) are skipped — those already carry their own conditional
 * gating, and double-wrapping would produce nested-conditional noise.
 *
 * Detection of "inside a guard" walks the template scanning for
 * `{% if %}` / `{% endif %}` markers and tracks nesting depth. Only
 * matches at depth 0 are wrapped.
 */
function wrapOptionalFieldPlaceholders(
	tmpl: string,
	optionalFields: ReadonlySet<string> | undefined
): string {
	if (!optionalFields || optionalFields.size === 0) return tmpl;
	// Match either `$NAME` (single dollar) or `$$$NAME` (list dollar).
	// The capture distinguishes the two so the replacement preserves
	// the dollar count.
	const placeholder = /(?<lead> *)(\$\$\$|\$)([A-Z][A-Z0-9_]*)/g;
	const guardedRanges = computeGuardedRanges(tmpl);
	return tmpl.replace(
		placeholder,
		(
			full: string,
			lead: string,
			dollars: string,
			name: string,
			offset: number
		) => {
			const key = name.toLowerCase();
			if (!optionalFields.has(key)) return full;
			// Special walker placeholders (`$NEWLINE`, `$INDENT`, `$DEDENT`,
			// `$TEXT`, `$CHILDREN`) aren't real fields — `translateToJinja`
			// converts them to literal characters or list joins. Even if a
			// `newline`/`indent`/etc. field exists in the AssembledNonterminal
			// list (e.g. python's decorator carries an empty-values
			// `newline` slot from the walker's NEWLINE token wrapping), the
			// placeholder is already structural and must not be gated.
			if (SPECIAL_PLACEHOLDERS.has(key)) return full;
			const dollarStart = offset + lead.length;
			// Defensive: ensure no straggling `$` before the matched dollar
			// run (i.e. the regex didn't truncate a `$$NAME` mid-dollars).
			if (dollarStart > 0 && tmpl[dollarStart - 1] === '$') return full;
			if (offset >= tmpl.length) return full;
			// Skip placeholders enclosed in a walker-emitted Jinja
			// conditional — the placeholder is already guarded.
			if (isWithinGuardedRange(dollarStart, guardedRanges)) return full;
			return `{% if ${key} | isPresent %}${lead}${dollars}${name}{% endif %}`;
		}
	);
}

const SPECIAL_PLACEHOLDERS: ReadonlySet<string> = new Set([
	'newline',
	'indent',
	'dedent',
	'text',
	'children'
]);

/**
 * Compute the half-open `[start, end)` byte ranges in `tmpl` that lie
 * INSIDE a top-level `{% if … %}…{% endif %}` block. Nested `{% if %}`
 * tags increment a depth counter; only the OUTER pair contributes a
 * range, so inner `$NAME` placeholders are still considered "guarded"
 * for the purposes of the optional-field wrapper.
 *
 * Tracks `{%-` / `-%}` whitespace-control variants and tolerates
 * unrelated tags (`{% for %}`, `{% set %}`) by counting only `if` /
 * `endif` markers.
 */
function computeGuardedRanges(tmpl: string): Array<readonly [number, number]> {
	const ranges: Array<readonly [number, number]> = [];
	const tagPattern = /\{%-?\s*(if|endif)\b[^%]*-?%\}/g;
	let depth = 0;
	let openOffset = -1;
	for (let m = tagPattern.exec(tmpl); m !== null; m = tagPattern.exec(tmpl)) {
		const tag = m[1]!;
		if (tag === 'if') {
			if (depth === 0) openOffset = m.index;
			depth++;
		} else if (tag === 'endif') {
			depth--;
			if (depth === 0 && openOffset !== -1) {
				ranges.push([openOffset, m.index + m[0].length]);
				openOffset = -1;
			}
		}
	}
	return ranges;
}

function isWithinGuardedRange(
	offset: number,
	ranges: ReadonlyArray<readonly [number, number]>
): boolean {
	for (const [s, e] of ranges) {
		if (offset >= s && offset < e) return true;
	}
	return false;
}

/** `$$$CHILDREN` is the only slot that carries flank permission. */
/** @internal — exported for direct unit testing. */
export function filterForFlanks(key: string, meta: JinjaTranslateMeta): string {
	// Bug 2 fix (016): named-field slots also carry flank permission when
	// the repeat for THIS SPECIFIC FIELD has `trailing: true` (tracked in
	// `meta.trailingFields`). Previously only `children` used the trailing
	// filter; named list fields (e.g. `elements` in `tuple_expression`) now
	// also honour `joinWithTrailing` so trailing commas render correctly.
	//
	// The per-field `trailingFields` set is preferred over the global
	// `joinByTrailing` flag to avoid promoting ALL fields on a rule where
	// only ONE field's repeat is trailing (e.g. `tuple_expression` where
	// `elements` has trailing but `attributes` does not).
	if (key === 'children') {
		if (meta.joinByLeading && meta.joinByTrailing) return 'joinWithFlanks';
		if (meta.joinByTrailing) return 'joinWithTrailing';
		if (meta.joinByLeading) return 'joinWithLeading';
		return 'join';
	}
	// Named fields: use per-field trailing/leading sets when available.
	// Do NOT fall back to the global `joinByTrailing` / `joinByLeading` flags
	// here — those are whole-rule flags and would incorrectly promote fields
	// that don't have their own trailing repeat (e.g. `attributes` on
	// `tuple_expression` where only `elements` has `trailing: true`).
	const hasTrailing = meta.trailingFields?.has(key) ?? false;
	const hasLeading = meta.leadingFields?.has(key) ?? false;
	if (hasLeading && hasTrailing) return 'joinWithFlanks';
	if (hasTrailing) return 'joinWithTrailing';
	if (hasLeading) return 'joinWithLeading';
	return 'join';
}

/**
 * Collect raw field names whose `isRequired` derivation is false,
 * for the walker's optional-field detection.
 *
 * `AssembledNonterminal.isRequired` is computed across the WHOLE rule tree
 * — it correctly catches fields that are required at their declaration
 * site but enclosed in an `optional(seq(...))` (rust `impl_item`'s
 * `trait` is the canonical case). The walker uses this set as a
 * fallback when local member inspection can't see the enclosing
 * structural wrapper.
 */
function deriveOptionalSlotNames(
	slots: readonly { name: string; values: readonly NodeOrTerminal[] }[]
): Set<string> {
	const out = new Set<string>();
	for (const slot of slots) {
		if (!isRequired(slot)) {
			out.add(slot.name);
			continue;
		}
		// Required-at-slot-level but list-shaped + may-be-empty
		// (a bare `repeat()` whose values are all `array`, none `nonEmptyArray`).
		// Wrapping the `$$$NAME` placeholder gates the surrounding separators
		// on whether the list actually has elements — ts class_declaration's
		// empty `decorator` no longer leaves a leading space.
		if (isMultiple(slot) && !isNonEmpty(slot)) out.add(slot.name);
	}
	return out;
}

function deriveOptionalFieldNames(
	fields: readonly AssembledNonterminal[]
): Set<string> {
	return deriveOptionalSlotNames(fields);
}

function buildRenderSurface(opts?: {
	fields?: readonly AssembledNonterminal[];
	slots?: readonly WalkSlotUse[];
	optionalFields?: ReadonlySet<string>;
	usesChildren?: boolean;
	usesVariant?: boolean;
	usesText?: boolean;
}): RenderTemplateSurface {
	const fieldsByName = new Map(
		(opts?.fields ?? []).map((field) => [field.name, field] as const)
	);
	const slots = (opts?.slots ?? []).map((slot) => {
		const field = fieldsByName.get(slot.name);
		const view =
			field != null && slot.view === 'list' ? ('field' as const) : slot.view;
		const required =
			field != null ? !(opts?.optionalFields?.has(slot.name) ?? false) : false;
		return {
			name: slot.name,
			view,
			required,
			hasLeading: field?.hasLeading ?? false,
			hasTrailing: field?.hasTrailing ?? false
		};
	});
	return {
		slots,
		usesChildren: opts?.usesChildren ?? false,
		usesVariant: opts?.usesVariant ?? false,
		usesText: opts?.usesText ?? false
	};
}

/**
 * Compute the set of field names that appear in SOME polymorph forms but
 * not all. These are "cross-form optional" — from the parent polymorph's
 * perspective the field is absent in at least one form, so any form that
 * DOES have it should render it under an `{% if field | isPresent %}`
 * guard. This lets forms that differ only by leading optional fields
 * collapse to a single template (the guard produces `""` when the field
 * is absent, same output as the form that never had the field).
 *
 * Canonical case: `range_pattern` has `left` in `left_with_right` and
 * `left_bare` forms but NOT in `prefix`. All three forms collapse to
 * `{% if left | isPresent %}{{ left }}{% endif %}{{ children | join("") }}`.
 */
function deriveCrossFormOptionalFields(
	forms: readonly AssembledGroup[]
): Set<string> {
	if (forms.length <= 1) return new Set();
	const perForm = forms.map((f) => new Set(f.fields.map((ff: AssembledNonterminal) => ff.name)));
	const allNames = new Set(perForm.flatMap((s) => [...s]));
	const out = new Set<string>();
	for (const name of allNames) {
		if (!perForm.every((s) => s.has(name))) out.add(name);
	}
	return out;
}

/**
 * Attempt to collapse polymorph form templates that differ only because some
 * forms have extra "cross-form optional" field prefixes absent from others.
 *
 * Canonical case: `range_pattern` forms `left_with_right` and `left_bare`
 * produce `$LEFT $$$CHILDREN` (they have a `left` field in their rule),
 * while `prefix` produces `$$$CHILDREN` (no `left`). Stripping `$LEFT ` from
 * the first two normalizes all forms to `$$$CHILDREN`, and then prepending
 * `{% if left | isPresent %}$LEFT{% endif %}` (no separator — the range
 * operator is part of the child's template) to all forms produces the single
 * unified template `{% if left | isPresent %}$LEFT{% endif %}$$$CHILDREN`.
 *
 * This avoids a `{% if variant == "X" %}` chain that fails for parsed nodes
 * (where `node.$variant` is always null).
 *
 * Returns `null` when the forms cannot be collapsed via this mechanism.
 *
 * @param forms - The polymorph's `AssembledGroup` forms (used for field set).
 * @param rawTemplates - Per-form raw `$VAR`-placeholder templates (before any
 *   wrapping or translation).
 * @param formNames - Ordered form names (matches `rawTemplates` keys).
 */
function tryCrossFormOptionalCollapse(
	forms: readonly AssembledGroup[],
	rawTemplates: Record<string, string>,
	formNames: string[]
): string | null {
	const crossFormOptional = deriveCrossFormOptionalFields(forms);
	if (crossFormOptional.size === 0) return null;

	// For each cross-form optional field, build a stripping regex that
	// matches `$FIELD ` or `$FIELD` at the start or anywhere — but we
	// want to strip it from the BEGINNING of forms that have it so the
	// remaining suffix is the common part. Strip leading occurrence only.
	const fieldNames = [...crossFormOptional];
	const stripPatterns = fieldNames.map(
		(f) => new RegExp(`^\\$${f.toUpperCase()} ?`, 'i')
	);

	// Strip cross-form optional field placeholders from the beginning of
	// each form's raw template.
	const suffixes: string[] = formNames.map((name) => {
		let tmpl = rawTemplates[name]!;
		for (const pat of stripPatterns) tmpl = tmpl.replace(pat, '');
		return tmpl;
	});

	// All suffixes must be equal for collapse to work.
	if (!suffixes.every((s) => s === suffixes[0])) return null;

	// Build the cross-form optional prefix: `{% if field | isPresent %}$FIELD{% endif %}`
	// for each cross-form optional field. No separator between the prefix
	// and the suffix — the separator (range operator, etc.) is part of
	// the variant child's own template.
	const prefix = fieldNames
		.map((f) => `{% if ${f} | isPresent %}$${f.toUpperCase()}{% endif %}`)
		.join('');

	return prefix + suffixes[0]!;
}

function inlineSingleParameterlessChildTemplate(
	form: AssembledGroup,
	rawTemplate: string,
	rules?: Record<string, Rule>,
	wordMatcher?: RegExp,
	externals?: ReadonlySet<string>
): string {
	if (!rawTemplate.includes('$$$CHILDREN')) return rawTemplate;
	if (form.children.length !== 1) return rawTemplate;
	const slot = form.children[0]!;
	if (slot.values.length !== 1) return rawTemplate;
	const value = slot.values[0]!;
	if (!isNodeRef(value) || isUnresolvedRef(value.node) || !value.node.isParameterless) return rawTemplate;
	const stampedLiteral =
		value.node.modelType === 'keyword' || value.node.modelType === 'token'
			? resolveStampedLiteral(value.node.stampExpression)
			: undefined;
	if (stampedLiteral !== undefined) return rawTemplate.replace('$$$CHILDREN', stampedLiteral);
	const renderedEntry = value.node.renderTemplate(rules, wordMatcher, externals);
	return renderedEntry ? rawTemplate.replace('$$$CHILDREN', renderedEntry.template) : rawTemplate;
}

function inlineFixedParameterlessSlotPlaceholders(
	form: AssembledGroup,
	rawTemplate: string,
	rules?: Record<string, Rule>,
	wordMatcher?: RegExp,
	externals?: ReadonlySet<string>
): string {
	let template = rawTemplate;
	for (const slot of [...form.fields, ...form.children]) {
		if (slot.values.length !== 1) continue;
		const value = slot.values[0]!;
		if (!isNodeRef(value) || isUnresolvedRef(value.node) || !value.node.isParameterless) continue;
		const stampedLiteral =
			value.node.modelType === 'keyword' || value.node.modelType === 'token' || value.node.modelType === 'enum'
				? resolveStampedLiteral(value.node.stampExpression)
				: undefined;
		const renderedEntry =
			stampedLiteral === undefined
				? value.node.renderTemplate(rules, wordMatcher, externals)
				: undefined;
		const replacement = stampedLiteral ?? renderedEntry?.template;
		if (replacement === undefined) continue;
		const slotName = slot.name.toUpperCase();
		template = template.replaceAll(`$$$${slotName}`, replacement);
		template = template.replaceAll(`$${slotName}`, replacement);
	}
	return template;
}

function resolveStampedLiteral(stampExpression: string | undefined): string | undefined {
	if (!stampExpression?.endsWith(' as const')) return undefined;
	try {
		return JSON.parse(stampExpression.slice(0, -' as const'.length)) as string;
	} catch {
		return undefined;
	}
}

function longestCommonPrefix(values: readonly string[]): string {
	if (values.length === 0) return '';
	let prefix = values[0]!;
	for (let i = 1; i < values.length && prefix.length > 0; i++) {
		const value = values[i]!;
		let common = 0;
		while (common < prefix.length && common < value.length && prefix[common] === value[common]) common++;
		prefix = prefix.slice(0, common);
	}
	return prefix;
}

function tryChildrenPresenceCollapse(
	rawTemplates: Record<string, string>,
	formNames: readonly string[]
): string | null {
	if (formNames.length < 2) return null;
	const templates = formNames.map((name) => rawTemplates[name]!).filter((value): value is string => value != null);
	if (templates.length !== formNames.length) return null;
	const prefix = longestCommonPrefix(templates);
	if (!prefix) return null;
	const suffixes = templates.map((template) => template.slice(prefix.length));
	const childSuffixes = [...new Set(suffixes.filter((suffix) => suffix.includes('$$$CHILDREN')))];
	const literalSuffixes = [...new Set(suffixes.filter((suffix) => !suffix.includes('$')))];
	if (childSuffixes.length !== 1 || literalSuffixes.length !== 1) return null;
	const childSuffix = childSuffixes[0]!;
	const literalSuffix = literalSuffixes[0]!;
	if (
		suffixes.some((suffix) => suffix !== childSuffix && suffix !== literalSuffix) ||
		childSuffix === literalSuffix
	) {
		return null;
	}
	return `${prefix}{% if children | isPresent %}${childSuffix}{% else %}${literalSuffix}{% endif %}`;
}

/**
 * Prevent `{$$$CHILDREN}` → `{{{ children }}}` parse failure by
 * inserting a space between a literal brace and an adjacent Jinja
 * interpolation. Iterative to cover stacked cases.
 */
function escapeJinjaBraceCollisions(s: string): string {
	let prev = s;
	for (let i = 0; i < 4; i++) {
		const next = prev
			.replace(/\{(\{\{[^}]+\}\})/g, '{ $1')
			.replace(/(\{\{[^}]+\}\})\}/g, '$1 }')
			// Also handle `{` literal adjacent to `{% … %}` block tag
			// (`{{% if … %}`) — introduced when an optional list-shaped
			// field gets wrapped at the head of a brace-flanked rule like
			// typescript `statement_block`.
			.replace(/\{(\{%-? [^%]+-?%\})/g, '{ $1')
			.replace(/(\{%-? [^%]+-?%\})\}/g, '$1 }');
		if (next === prev) return next;
		prev = next;
	}
	return prev;
}

/**
 * Build the frozen slot Record for an AssembledBranch (or any kind that
 * uses the slot-Record surface). Walks `deriveSlots(rule)` once and
 * keys each slot by its name. Insertion order = declared rule order.
 *
 * Constructor-time helper for every class that exposes the unified
 * `slots` surface. The locked design's
 * eager validation (collision throw, >1 unnamed slot throw, mixed-arity
 * warn, key remap to 'child'/'children' for inferred slots) is NOT
 * enforced here yet — see the JSDoc on `AssembledBranch.slots` for the
 * rationale. When the grammar-override migration lands ("Owner A"), this
 * helper picks up the strict checks and the remap.
 *
 * @param kind - Owning kind name. Reserved for future error/warn messages.
 * @param rule - Simplified rule to walk for slots.
 */
function buildSlotsRecord(
	kind: string,
	rule: Rule
): Readonly<Record<string, AssembledNonterminal>> {
	const out: Record<string, AssembledNonterminal> = {};
	for (const slot of deriveSlots(rule)) {
		// Strict design (FR-T05): inferred slots remap to 'child'/'children'
		// keys and at most one unnamed slot per branch is permitted. Empirical
		// check confirms 14 kinds across 3 grammars currently have >1 unnamed
		// positional slot. Enforcement requires either (a) collapse of choice-
		// of-distinct-kinds into one slot with multi-value `values[]`, or (b)
		// grammar overrides to explicitly name the positions ("Owner A"
		// migration). Until then: keep the kind-derived name as the Record
		// key, no collision throw, no >1-unnamed throw.
		out[slot.name] = slot;
	}

	// storageName collision check. Multiple slots sharing the same NodeData
	// storage key means the emitters can't distinguish them — the override
	// layer must name N-1 children to eliminate the collision.
	// Warn (not throw) because assemble runs on base grammars in tests
	// before overrides apply. The generate() pipeline enforces zero
	// collisions via the override layer; this warning surfaces any that
	// slip through during development.
	if (!process.env.SITTIR_QUIET) {
		const byStorageName = new Map<string, AssembledNonterminal[]>();
		for (const slot of Object.values(out)) {
			const list = byStorageName.get(slot.storageName) ?? [];
			list.push(slot);
			byStorageName.set(slot.storageName, list);
		}
		for (const [storageName, slots] of byStorageName) {
			if (slots.length > 1) {
				const details = slots.map((s) => {
					const kinds = s.values.map((v) =>
						v.kind === 'terminal'
							? `"${v.value}"`
							: isUnresolvedRef(v.node)
								? v.node.name
								: (v.node as AssembledNode).kind
					);
					const mult = s.values.length > 0
						? s.values[0]!.multiplicity
						: 'single';
					return `    ${s.name} (source: ${s.source}, multiplicity: ${mult}, values: [${kinds.join(', ')}])`;
				});
				process.stderr.write(
					`[assemble] storageName collision: kind '${kind}' has ${slots.length} slots ` +
						`with storageName '${storageName}':\n${details.join('\n')}\n`
				);
			}
		}
	}

	return Object.freeze(out);
}

export class AssembledBranch extends AssembledNodeBase<
	SeqRule | ChoiceRule | RepeatRule | Repeat1Rule
> {
	readonly modelType = 'branch' as const;
	// rule narrowed to SeqRule | ChoiceRule | RepeatRule | Repeat1Rule —
	// branches classify from compositional rules that carry fields and/or
	// ordered children. The prior `AssembledContainer` class was absorbed —
	// repeat / repeat1 shapes (no `field()` on the rule) now route here
	// too. Use the `isContainerShape` getter
	// below to discriminate when emitter behavior must differ between
	// the two shapes.
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
	readonly slots: Readonly<Record<string, AssembledNonterminal>>;

	constructor(
		kind: string,
		rule: SeqRule | ChoiceRule | RepeatRule | Repeat1Rule,
		simplifiedRule: Rule,
		opts?: {
			factoryName?: string;
			irKey?: string;
			variantChildKinds?: readonly string[];
		}
	) {
		super(kind, rule, opts);
		this.simplifiedRule = simplifiedRule;
		this.variantChildKinds = opts?.variantChildKinds ?? [];
		this.slots = buildSlotsRecord(kind, simplifiedRule);
	}

	/**
	 * Direct access to the rule's ordered members (seq or choice).
	 * Returns an empty array for repeat / repeat1 — those shapes don't
	 * carry an ordered member tuple (the `content` is a single repeated
	 * rule, surfaced via `children`).
	 */
	get members(): readonly Rule[] {
		const r = this.rule;
		return r.type === 'seq' || r.type === 'choice' ? r.members : [];
	}

	/**
	 * Repeat-list separator (when the simplified rule is a `repeat` or
	 * `repeat1` carrying a separator captured by Evaluate). Branches
	 * derived from non-repeat shapes return `undefined`. Absorbed from
	 * the former `AssembledContainer.separator` getter.
	 */
	get separator(): string | undefined {
		const r = this.simplifiedRule;
		if (r.type === 'repeat' || r.type === 'repeat1') {
			return r.separator;
		}
		return undefined;
	}

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
	get isContainerShape(): boolean {
		return !hasAnyField(this.rule);
	}

	/**
	 * Field-shaped slots only (source !== 'inferred'). Convenience view
	 * over `slots` for callers that need only named-grammar-field slots.
	 */
	get fields(): readonly AssembledNonterminal[] {
		return Object.values(this.slots).filter((s) => s.source !== 'inferred');
	}

	/**
	 * Inferred positional slots only (source === 'inferred'). Convenience
	 * view over `slots` for callers that need only unnamed positional slots.
	 * Returns empty array when no inferred slots exist.
	 */
	get children(): readonly AssembledNonterminal[] {
		return Object.values(this.slots).filter((s) => s.source === 'inferred');
	}

	renderTemplate(
		rules?: Record<string, Rule>,
		wordMatcher?: RegExp,
		externals?: ReadonlySet<string>
	): RenderTemplateEntry {
		// Rules whose structure depends on hidden external-scanner
		// tokens (e.g. rust's raw_string_literal, whose `r#"` and `"#`
		// are produced by `_raw_string_literal_start` and
		// `_raw_string_literal_end`) can't be rendered slot-by-slot
		// because the delimiters never appear as children. Same for
		// verbatim token-stream rules (rust's token_tree /
		// delim_token_tree). Both render as `{{ text }}` — emits the
		// node's raw source span verbatim.
		const textShape = this.textTemplate(externals);
		if (textShape) return textShape;
		// Template walking stays on the RAW rule — templates need the
		// anonymous delimiters ('(', '{', ';', etc.) to surface as
		// template text. Only derivations use simplifiedRule.
		//
		// Branches that absorbed the former
		// `AssembledContainer` shape (children-only, no fields) skip the
		// optional-field plumbing — `optionalFields` is empty by
		// construction so the meta + walker call collapses cleanly. The
		// `optionalChildren` flag (former-container path) flips on when
		// `childrenMayBeEmpty` so flanking-space absorption fires for
		// empty-body factory inputs.
		const fields = this.fields;
		const hasFields = fields.length > 0;
		const optionalFields = hasFields
			? deriveOptionalFieldNames(fields)
			: undefined;
		const { template, clauses, joinByField, usesChildren, slots } = renderRuleTemplate(
			this.rule,
			false,
			rules,
			wordMatcher,
			optionalFields
		);
		if (!template) {
			throw new Error(
				`AssembledBranch.renderTemplate: '${this.kind}' produced an empty template. ` +
					`Rule has no visible content — should have been classified as leaf/token.`
			);
		}
		// Clauses inline at the reference site; meta drives separator
		// filter selection; `$VAR` → `{{ var }}` final pass. All
		// previously-separate translator responsibilities collapse
		// into this one chokepoint.
		const withClauses = inlineJinjaClauses(template, clauses);
		const meta: JinjaTranslateMeta = {};
		// Container-shape branches surface a separator on `repeat` /
		// `repeat1` directly; field-carrying branches discover one via
		// the simplified-rule walk. Prefer the direct getter when
		// non-empty.
		const sep = this.separator ?? findRepeatSeparator(this.simplifiedRule);
		if (sep) meta.joinBy = sep;
		if (findRepeatFlag(this.simplifiedRule, 'trailing'))
			meta.joinByTrailing = true;
		if (findRepeatFlag(this.simplifiedRule, 'leading'))
			meta.joinByLeading = true;
		if (hasFields) {
			const trailingFields = new Set(
				fields.filter((f) => f.hasTrailing).map((f) => f.name)
			);
			const leadingFields = new Set(
				fields.filter((f) => f.hasLeading).map((f) => f.name)
			);
			if (trailingFields.size > 0) meta.trailingFields = trailingFields;
			if (leadingFields.size > 0) meta.leadingFields = leadingFields;
		}
		if (Object.keys(joinByField).length > 0) meta.joinByField = joinByField;
		if (optionalFields && optionalFields.size > 0)
			meta.optionalFields = optionalFields;
		// Container-shape branches: empty children may collapse a flanking
		// space pair into stray whitespace at render time. Set the meta
		// flag so `translateToJinja` absorbs the spaces into an isPresent
		// conditional (moved verbatim from the former
		// `AssembledContainer.renderTemplate`).
		if (!hasFields && childrenMayBeEmpty(this.simplifiedRule))
			meta.optionalChildren = true;
		return {
			template: translateToJinja(withClauses, meta),
			surface: buildRenderSurface({
				fields,
				slots,
				optionalFields,
				usesChildren
			})
		};
	}
}

/**
 * Detect "verbatim token stream" shape — a rule whose body is a choice
 * of `seq(delim, repeat(hidden_symbol), delim)` variants. Canonical
 * case: rust's `token_tree` / `delim_token_tree`, whose children are
 * any mix of named and anonymous tokens (including punctuation like
 * `=`, `=>`, `,` that readNode promotes into $fields rather than
 * $children). Field-by-field rendering can't reassemble these losslessly
 * — the anonymous tokens would drop out of `$$$CHILDREN`.
 *
 * Emitting `$TEXT` for these rules preserves the source span verbatim
 * on readNode-derived data. Factory construction requires the kind to
 * use the text-shape factory (receives a `text: string`), same path
 * we already use for `$TEXT` kinds via `hasHiddenExternalRef`.
 *
 * Shape criteria: rule is a `choice` (possibly wrapped in `variant`
 * markers from tagVariants). Every member has exactly three elements:
 * string-literal, repeat/repeat1 of a hidden symbol, string-literal.
 */
function isVerbatimTokenStream(rule: Rule): boolean {
	if (rule.type !== 'choice') return false;
	if (rule.members.length === 0) return false;
	return rule.members.every((m) => {
		const core = m.type === 'variant' ? m.content : m;
		if (core.type !== 'seq' || core.members.length !== 3) return false;
		const [start, mid, end] = core.members;
		if (!start || !mid || !end) return false;
		if (start.type !== 'string' || end.type !== 'string') return false;
		if (mid.type !== 'repeat' && mid.type !== 'repeat1') return false;
		const inner = mid.content;
		return inner.type === 'symbol' && inner.hidden === true;
	});
}

/**
 * Return `true` when a rule is a `seq` whose first member is
 * `optional(<punct>)` — a purely-punctuation optional the template
 * walker unconditionally drops.
 *
 * The canonical example is python's `_simple_pattern_negative`:
 *   `seq(optional('-'), choice(integer, float))`
 * whose optional `-` prefix is silently lost by
 * `template-walker.ts`'s `containsOnlyPunctuation` branch. Falling
 * back to `{{ text }}` preserves the prefix for roundtrip fidelity.
 *
 * Only fires for containers — branch nodes with named fields are handled
 * by the field-conditional path and don't reach `isTextTemplate`.
 */
function hasOptionalPunctPrefix(rule: Rule): boolean {
	if (rule.type !== 'seq' || rule.members.length < 2) return false;
	const first = rule.members[0]!;
	if (first.type !== 'optional') return false;
	// The optional's content must be purely punctuation (no symbols/fields).
	return isAllPunct(first.content);
}

/** Return true when a rule contains only string/pattern literals with no
 *  symbol references or field wrappers. Mirrors `containsOnlyPunctuation`
 *  in `template-walker.ts` (kept local to avoid a cross-file import). */
function isAllPunct(rule: Rule): boolean {
	switch (rule.type) {
		case 'string':
		case 'pattern':
		case 'indent':
		case 'dedent':
		case 'newline':
			return true;
		case 'field':
		case 'symbol':
		case 'supertype':
		case 'enum':
			return false;
		case 'seq':
		case 'choice':
			return (rule as { members: Rule[] }).members.every(isAllPunct);
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'variant':
		case 'clause':
		case 'group':
			return isAllPunct((rule as { content: Rule }).content);
		default:
			return false;
	}
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
export function unwrapStructuralPassthroughs(rule: Rule): Rule {
	let r: Rule = rule;
	for (;;) {
		switch (r.type) {
			case 'optional':
			case 'variant':
			case 'clause':
			case 'group':
			case 'alias':
			case 'token':
			case 'terminal':
				r = r.content;
				continue;
			case 'seq':
			case 'choice':
			case 'repeat':
			case 'repeat1':
			case 'field':
			case 'enum':
			case 'supertype':
			case 'polymorph':
			case 'string':
			case 'pattern':
			case 'indent':
			case 'dedent':
			case 'newline':
			case 'symbol':
				return r;
			default:
				return assertNever(r);
		}
	}
}

/**
 * Shared predicate — does `rule` reduce to an external-scanner terminal?
 * Single source of truth for the symbol-in-externals + field/pattern('')
 * stub recognition used by both `hasHiddenExternalRef` (every member
 * must match for $TEXT promotion) and `hasExternalBoundaries` (only
 * first and last seq members must match).
 *
 * Two acceptance shapes:
 *
 * 1. After peeling structural passthroughs, the result is a `symbol`
 *    whose name is in `externals`.
 *
 * 2. After peeling, the result is a `field` whose unwrapped content
 *    is the link-stub `pattern('')` AND whose name (or `_`-prefixed
 *    form) is in `externals`. Link inlines external-token rule bodies
 *    as empty-pattern stubs; enrich then wraps them in
 *    `field('<stripped_name>', pattern(''))`. Both conditions must
 *    hold — a non-external rule could coincidentally have an empty-
 *    pattern child, and a field named after an external might
 *    legitimately carry real content.
 *
 * For non-stub field content, recurses into the content so wrapper-
 * of-symbol shapes still match (the `hasHiddenExternalRef` use-case).
 *
 * Anything else returns false. String literals like `{` / `}` / `;`
 * make the rule walkable via template text and disqualify the $TEXT
 * fallback.
 */
function isExternalTerminalMember(
	rule: Rule,
	externals: ReadonlySet<string>
): boolean {
	const core = unwrapStructuralPassthroughs(rule);
	if (core.type === 'field') {
		const inner = unwrapStructuralPassthroughs(core.content);
		if (
			inner.type === 'pattern' &&
			inner.value === '' &&
			(externals.has(core.name) || externals.has('_' + core.name))
		)
			return true;
		return isExternalTerminalMember(core.content, externals);
	}
	return core.type === 'symbol' && externals.has(core.name);
}

function hasHiddenExternalRef(
	rule: Rule,
	externals: ReadonlySet<string>
): boolean {
	// Unwrap transparent wrappers to find the structural core.
	const core = unwrapStructuralPassthroughs(rule);
	if (core.type !== 'seq') return false;
	// Also ignore pure-boundary optionals (e.g. the trailing
	// `optional($._automatic_semicolon)` in javascript's
	// `statement_block`) so they don't disqualify the rule from
	// slot-by-slot rendering but also don't count toward the
	// "all external" tally.
	const isIgnorableBoundaryExternal = (r: Rule): boolean => {
		if (r.type !== 'optional') return false;
		const inner = r.content;
		return (
			inner.type === 'symbol' && externals.has((inner as { name: string }).name)
		);
	};
	let hasContent = false;
	for (const m of core.members) {
		if (isIgnorableBoundaryExternal(m)) continue;
		hasContent = true;
		if (!isExternalTerminalMember(m, externals)) {
			// Relaxed path: rule has external-scanner BOUNDARIES (first
			// and last non-ignorable members are external) — treat as
			// $TEXT. Python's `string` kind has this shape:
			// `seq(field('string_start', external), REPEAT(content),
			// field('string_end', external))`. Start and end are
			// external-only tokens; the REPEAT between them holds the
			// text + interpolations. Slot-by-slot rendering can't
			// reconstruct the start/end delimiters and breaks f-strings
			// / template strings. $TEXT preserves the source span
			// verbatim on readNode-derived data.
			return hasExternalBoundaries(core, externals);
		}
	}
	return hasContent;
}

/**
 * Rule-level boundary check — first and last non-ignorable seq members
 * are external-scanner symbols. Fires for rules like python's `string`
 * where scanner tokens delimit but the interior is author-content.
 */
function hasExternalBoundaries(
	seqRule: Rule,
	externals: ReadonlySet<string>
): boolean {
	if (seqRule.type !== 'seq') return false;
	if (seqRule.members.length < 2) return false;
	const first = seqRule.members[0];
	const last = seqRule.members[seqRule.members.length - 1];
	if (!first || !last) return false;
	return (
		isExternalTerminalMember(first, externals) &&
		isExternalTerminalMember(last, externals)
	);
}

export class AssembledPolymorph extends AssembledNodeBase<PolymorphRule> {
	readonly modelType = 'polymorph' as const;
	// #forms is stored separately because AssembledGroup instances are
	// constructed by assemble.ts and passed in — they don't live on the rule.
	readonly #forms: AssembledGroup[];
	readonly source: 'promoted' | 'override';
	/**
	 * For source='override' polymorphs: the visible variant child kinds
	 * (e.g., ['assignment_eq', 'assignment_type', 'assignment_typed']).
	 * These are real kinds in the parse tree (created by the alias() in
	 * transform patches) and need to appear as the children union on
	 * the parent polymorph's interface. Empty for source='promoted'.
	 */
	readonly variantChildKinds: readonly string[];

	constructor(
		kind: string,
		rule: PolymorphRule | ChoiceRule,
		forms: AssembledGroup[],
		opts?: {
			source?: 'promoted' | 'override';
			variantChildKinds?: readonly string[];
			factoryName?: string;
			irKey?: string;
		}
	) {
		const ruleSource = rule.type === 'polymorph' ? rule.source : undefined;
		super(kind, rule as PolymorphRule, {
			factoryName: opts?.factoryName,
			irKey: opts?.irKey,
			source: ruleSource
		});
		this.#forms = forms;
		this.source = opts?.source ?? 'promoted';
		this.variantChildKinds = opts?.variantChildKinds ?? [];
	}

	/** A polymorph's forms are hidden groups synthesized from the choice branches. */
	get forms(): AssembledGroup[] {
		return this.#forms;
	}

	/**
	 * Flattened field list across all forms — the union of every form's
	 * named slots (source !== 'inferred'). Used by emitters that need
	 * "all fields this polymorph may carry" without caring which form owns
	 * each one.
	 *
	 * Single derivation point for the `forms.flatMap(f => f.fields)` pattern
	 * that multiple emitters previously duplicated.
	 */
	get allFormFields(): readonly AssembledNonterminal[] {
		return this.#forms.flatMap((f) => f.fields);
	}

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
	get structuralFields(): readonly AssembledNonterminal[] {
		const seen = new Set<string>();
		const out: AssembledNonterminal[] = [];
		for (const form of this.#forms) {
			for (const f of form.fields) {
				if (!seen.has(f.name)) {
					seen.add(f.name);
					out.push(f);
				}
			}
		}
		return out;
	}

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
	get structuralSlots(): readonly AssembledNonterminal[] {
		const seen = new Set<string>();
		const out: AssembledNonterminal[] = [];
		for (const form of this.#forms) {
			for (const s of Object.values(form.slots)) {
				if (!seen.has(s.name)) {
					seen.add(s.name);
					out.push(s);
				}
			}
		}
		return out;
	}

	renderTemplate(
		rules?: Record<string, Rule>,
		wordMatcher?: RegExp,
		externals?: ReadonlySet<string>
	): RenderTemplateEntry {
		if (this.#forms.length === 0) {
			throw new Error(
				`AssembledPolymorph.renderTemplate: '${this.kind}' has zero synthesised forms. ` +
					`Classifier bug — rule should have been classified as branch/container/leaf.`
			);
		}
		// Variants as a record, detect as a sibling record, per-form
		// clauses merged into the outer rule object (the renderer looks
		// them up there regardless of which variant is active).
		const variants: Record<string, string> = {};
		const detect: Record<string, string> = {};
		const mergedClauses: Record<string, string> = {};
		const mergedJoinByField: Record<string, string> = {};
		const mergedOptionalFields = new Set<string>();
		for (const name of deriveCrossFormOptionalFields(this.#forms)) {
			mergedOptionalFields.add(name);
		}
		let usesChildren = false;
		const mergedSlots = new Map<string, WalkSlotUse>();
		// Collect optional fields per form so the
		// polymorph's eventual `translateToJinja` can wrap each form's
		// unguarded `$NAME` placeholder. Wrapping per-form (instead of
		// once on the merged template) keeps each `{% if variant == X %}`
		// body honest about which fields are optional in THAT form.
		const rawTemplates: Record<string, string> = {};
		for (const form of this.#forms) {
			const {
				template,
				clauses,
				joinByField,
				usesChildren: formUsesChildren
			} = form.renderParts(
				rules,
				wordMatcher
			);
			if (!template) {
				throw new Error(
					`AssembledPolymorph.renderTemplate: '${this.kind}' form '${form.name}' ` +
						`produced an empty template.`
				);
			}
			const normalizedTemplate = inlineSingleParameterlessChildTemplate(
				form,
				template,
				rules,
				wordMatcher,
				externals
			);
			const normalizedWithFixedSlots = inlineFixedParameterlessSlotPlaceholders(
				form,
				normalizedTemplate,
				rules,
				wordMatcher,
				externals
			);
			rawTemplates[form.name] = normalizedWithFixedSlots;
			const localOptional = deriveOptionalFieldNames(form.fields);
			for (const name of localOptional) mergedOptionalFields.add(name);
			const wrapped =
				localOptional.size > 0
					? wrapOptionalFieldPlaceholders(normalizedWithFixedSlots, localOptional)
					: normalizedWithFixedSlots;
			variants[form.name] = wrapped;
			usesChildren ||= formUsesChildren;
			for (const slot of deriveWalkSlots(normalizedWithFixedSlots)) {
				const guarded =
					slot.guarded ||
					localOptional.has(slot.name) ||
					mergedOptionalFields.has(slot.name);
				const prev = mergedSlots.get(slot.name);
				const view =
					prev == null || prev.view === slot.view ? slot.view : 'field';
				mergedSlots.set(slot.name, {
					name: slot.name,
					view,
					guarded
				});
			}
			if (form.detectToken) detect[form.name] = form.detectToken;
			Object.assign(mergedClauses, clauses);
			Object.assign(mergedJoinByField, joinByField);
		}
		// Collapse identical-across-forms variants to a single template
		// string. Post-collapse the handful of rules
		// that genuinely branch on form emit a Jinja
		// `{% if variant == "X" %}` chain inline (populated from the
		// per-form templates), so the emitter never sees a `variants:`
		// map — `translateToJinja` below just converts `$VAR` →
		// `{{ var }}` without knowing about variants at all.
		const formNames = Object.keys(variants);
		const normalizeTrailingNewline = (s: string): string =>
			s.endsWith('\n') ? s.slice(0, -1) : s;
		const allEqual =
			formNames.length > 1 &&
			formNames.every(
				(n) =>
					normalizeTrailingNewline(variants[n]!) ===
					normalizeTrailingNewline(variants[formNames[0]!]!)
			);
		let templateStr: string;
		let usesVariant = false;
		if (allEqual) {
			templateStr = variants[formNames[0]!]!;
		} else {
			// Bug 1 fix (016): cross-form-optional collapse. When forms differ
			// ONLY because some have extra cross-form-optional field prefixes
			// (e.g. `range_pattern`: `left_with_right` and `left_bare` start
			// with `$LEFT` but `prefix` doesn't), normalize by:
			//   1. Stripping `$FIELD ` from forms that have it.
			//   2. Prepending `{% if field | isPresent %}$FIELD{% endif %}`
			//      (no sep — range operator is part of the child's template).
			//   3. Checking all normalized forms are equal.
			// If so, collapse to that single prefix+suffix template. This avoids
			// a `{% if variant == "X" %}` chain that fails for parsed nodes
			// (where `$variant` is always null).
			const crossFormCollapsed = tryCrossFormOptionalCollapse(
				this.#forms,
				rawTemplates,
				formNames
			);
			if (crossFormCollapsed) {
				templateStr = crossFormCollapsed;
			} else {
				const childrenPresenceCollapsed = tryChildrenPresenceCollapse(
					rawTemplates,
					formNames
				);
				if (childrenPresenceCollapsed) {
					templateStr = childrenPresenceCollapsed;
				} else {
					// Build the `{%- if variant == "a" -%}A:$NAME{%- elif … -%}…{%- endif -%}`
					// chain. Whitespace-controls suppress the newlines between
					// the template fragments so the output joins cleanly.
					const parts: string[] = [];
					for (let i = 0; i < formNames.length; i++) {
						const formName = formNames[i]!;
						const keyword = i === 0 ? 'if' : 'elif';
						parts.push(
							`{%- ${keyword} variant == ${JSON.stringify(formName)} -%}`
						);
						parts.push(variants[formName]!);
					}
					parts.push('{%- endif -%}');
					templateStr = parts.join('\n');
					usesVariant = true;
				}
			}
		}
		// Inline the merged per-form clauses as `{% if x %}body{% endif %}`,
		// then apply the final `$VAR` → `{{ var }}` Jinja translation
		// using the polymorph's aggregated field-separator overrides.
		const withClauses = inlineJinjaClauses(templateStr, mergedClauses);
		const meta: JinjaTranslateMeta = {};
		// Aggregate per-field trailing/leading flags across all forms so
		// `filterForFlanks` can apply `joinWithTrailing` only to the specific
		// named fields whose repeats carry the flag.
		const mergedTrailingFields = new Set<string>();
		const mergedLeadingFields = new Set<string>();
		for (const form of this.#forms) {
			for (const f of form.fields.filter((field) => field.hasTrailing))
				mergedTrailingFields.add(f.name);
			for (const f of form.fields.filter((field) => field.hasLeading))
				mergedLeadingFields.add(f.name);
		}
		if (mergedTrailingFields.size > 0)
			meta.trailingFields = mergedTrailingFields;
		if (mergedLeadingFields.size > 0) meta.leadingFields = mergedLeadingFields;
		if (Object.keys(mergedJoinByField).length > 0)
			meta.joinByField = mergedJoinByField;
		if (mergedOptionalFields.size > 0) meta.optionalFields = mergedOptionalFields;
		return {
			template: translateToJinja(withClauses, meta),
			surface: buildRenderSurface({
				// Dedup'd union of form fields (matches the order emitters
				// see when iterating `this.#forms`). The polymorph-specific
				// `structuralFields` getter does the dedup; lives only on
				// AssembledPolymorph to avoid restoring the family of
				// abstract-base getters that were Path-A deleted.
				fields: this.structuralFields,
				slots: [...mergedSlots.values()],
				optionalFields: mergedOptionalFields,
				usesChildren,
				usesVariant
			})
		};
	}
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
export abstract class AssembledLeaf<R extends Rule = Rule> extends AssembledNodeBase<R> {}

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
export class AssembledPattern extends AssembledLeaf<
	PatternRule | TerminalRule
> {
	readonly modelType = 'pattern' as const;

	constructor(
		kind: string,
		rule: PatternRule | TerminalRule,
		opts?: { factoryName?: string; irKey?: string }
	) {
		super(kind, rule, opts);
	}

	/** The leaf's regex pattern value when the rule is a PatternRule; undefined for TerminalRule. */
	get pattern(): string | undefined {
		return this.rule.type === 'pattern'
			? this.rule.value || undefined
			: undefined;
	}
}

export class AssembledKeyword extends AssembledLeaf<StringRule> {
	readonly modelType = 'keyword' as const;

	constructor(
		kind: string,
		rule: StringRule,
		opts?: { factoryName?: string; irKey?: string; hidden?: boolean }
	) {
		super(kind, rule, opts);
		// Keywords are always parameterless — they produce a fixed
		// single text value. The field stamp is the literal (as const)
		// so parent factories can inline it directly into `$fields`.
		// The `markParameterlessKinds` fixpoint pass propagates this
		// status upward to compounds that reference the keyword.
		this.isParameterless = true;
		this.stampExpression = `${JSON.stringify(this.rule.value)} as const`;
	}

	/** The literal text this keyword produces (read from the StringRule). */
	get text(): string {
		return this.rule.value;
	}

	/**
	 * Child-context stamp: wrap the literal in a NodeData object so
	 * the parent's `$children` slot matches the `Terminal<kind, text>`
	 * interface shape. `$named: true` because keywords are named
	 * (`_kw_async` / `async` etc. surface as named nodes in tree-
	 * sitter's output).
	 */
	override get stampChildExpression(): string {
		const kind = JSON.stringify(this.kind);
		const text = JSON.stringify(this.rule.value);
		return `{ $type: ${kind} as const, $text: ${text} as const, $source: 2 as const, $named: true as const }`;
	}
}

export class AssembledToken extends AssembledLeaf<StringRule | TokenRule> {
	readonly modelType = 'token' as const;

	constructor(kind: string, rule: StringRule | TokenRule) {
		super(kind, rule, { hidden: true });
		// Single-literal tokens are parameterless — they stamp to the
		// literal (as const) the same way keywords do. Pattern-based
		// tokens (TokenRule) carry no single user-visible string and
		// stay non-parameterless. The classifier splits keyword vs
		// token on word-shape — non-word single-strings like `..` /
		// `=>` land here but should still auto-stamp from parent
		// required-single-literal fields.
		if (rule.type === 'string') {
			this.isParameterless = true;
			this.stampExpression = `${JSON.stringify(rule.value)} as const`;
		}
	}
	// No emitFactory — tokens are always hidden, no factoryName.

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
	get text(): string | undefined {
		if (this.rule.type === 'string') return this.rule.value;
		return undefined;
	}

	/**
	 * Child-context stamp: wrap the single-literal text in a NodeData
	 * object. `$named: false` — tokens are anonymous in tree-sitter's
	 * output (non-word literals like `..` / `=>` never have a named
	 * entry in `node-types.json`).
	 */
	override get stampChildExpression(): string | undefined {
		if (this.rule.type !== 'string') return undefined;
		const kind = JSON.stringify(this.kind);
		const text = JSON.stringify(this.rule.value);
		return `{ $type: ${kind} as const, $text: ${text} as const, $source: 2 as const, $named: false as const }`;
	}
}

export class AssembledEnum extends AssembledLeaf<EnumRule> {
	readonly modelType = 'enum' as const;

	constructor(
		kind: string,
		rule: EnumRule,
		opts?: { factoryName?: string; irKey?: string }
	) {
		super(kind, rule, opts);
		// Single-value enums are parameterless — they produce a fixed constant.
		// Both keyword-style hidden rules (_kw_*) and synthesised EnumRule kinds
		// with exactly one member qualify. Field stamp is the plain literal;
		// child stamp wraps it in a NodeData object (Terminal-compatible shape).
		if (this.values.length === 1) {
			this.isParameterless = true;
			this.stampExpression = `${JSON.stringify(this.values[0])} as const`;
		}
	}

	/** The enum member strings (e.g. `['u8', 'u16', 'usize']`). */
	get values(): string[] {
		return this.rule.members.map((m) => m.value);
	}

	/**
	 * Child-context stamp for single-value enums: wrap the literal in a
	 * Terminal-compatible NodeData object so the parent's `$children` slot
	 * type-checks against `Terminal<kind, text>`.
	 *
	 * @remarks
	 * Only meaningful when `isParameterless` is true (single-member enum).
	 */
	override get stampChildExpression(): string {
		const kind = JSON.stringify(this.kind);
		const text = JSON.stringify(this.values[0] ?? '');
		return `{ $type: ${kind} as const, $text: ${text} as const, $source: 2 as const, $named: false as const }`;
	}
}

export class AssembledSupertype extends AssembledNodeBase<
	SupertypeRule | ChoiceRule
> {
	readonly modelType = 'supertype' as const;
	// #subtypes stores the RESOLVED subtype list (hidden names expanded to
	// their concrete kinds) — this differs from rule.subtypes which carries
	// the raw names as declared in the grammar. Do NOT replace with rule.subtypes.
	readonly #subtypes: string[];

	constructor(
		kind: string,
		rule: SupertypeRule | ChoiceRule,
		subtypes: string[]
	) {
		// Supertypes are always hidden — they're dispatch points, not user-constructable nodes.
		super(kind, rule as SupertypeRule, { hidden: true });
		this.#subtypes = subtypes;
	}

	/** Resolved concrete kind names in this supertype union. */
	get subtypes(): string[] {
		return this.#subtypes;
	}
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
export class AssembledMulti extends AssembledNodeBase<
	RepeatRule | Repeat1Rule
> {
	readonly modelType = 'multi' as const;
	// rule narrowed — multis are hidden repeat helpers. Classifier
	// routes repeat / repeat1 shapes here when the hidden rule's
	// top-level content is a repeat.

	constructor(
		kind: string,
		rule: RepeatRule | Repeat1Rule,
		opts?: { irKey?: string }
	) {
		// Multi nodes are always hidden (no factoryName)
		super(kind, rule, { hidden: true, irKey: opts?.irKey });
	}

	/** The repeat's inner content type — raw Rule, for downstream
	 * consumers that need the element union (types emitter maps this
	 * to a union of TypeNames, inlineGroupRefs hands the whole repeat
	 * back to referrers). */
	get elementRule(): Rule {
		return this.rule.content;
	}

	/** `true` when the source rule is `repeat1` (at least one element);
	 * `false` for plain `repeat` (zero-or-more). Referrers thread this
	 * into AssembledNonterminal.nonEmpty. */
	get nonEmpty(): boolean {
		return this.rule.type === 'repeat1';
	}

	/** Separator string from the repeat rule, if any. */
	get separator(): string | undefined {
		return this.rule.separator;
	}

	/** Whether a trailing separator is permitted. */
	get trailing(): boolean | undefined {
		return this.rule.trailing;
	}

	/** Whether a leading separator is permitted. */
	get leading(): boolean | undefined {
		return this.rule.leading;
	}
}

export class AssembledGroup extends AssembledNodeBase<Rule> {
	readonly modelType = 'group' as const;
	// rule typed as Rule — groups can carry GroupRule (pre-unwrap),
	// SeqRule/ChoiceRule after unwrapGroupRuleAndSimplified(), or any
	// Rule when constructed as polymorph forms (form.content can be
	// any Rule type).
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

	constructor(
		kind: string,
		rule: Rule,
		simplifiedRule: Rule,
		opts?: {
			factoryName?: string;
			irKey?: string;
			detectToken?: string;
			name?: string;
			parentKind?: string;
		}
	) {
		// Groups always derive a factoryName — hidden groups emit fragment factories
		// for composition (hidden-group-factories). Polymorph form groups
		// still use the explicitly provided factoryName so their emitted name matches
		// the form name (e.g. `rangePatternUFormLeftWithRight`), not the raw kind.
		//
		// Hidden groups (kind starts with `_`) need the leading `_` preserved in
		// the factory name so the emitted function is `_fooBar`, not `fooBar`.
		// `nameNode` strips leading underscores via `prepareKindForPascalCase`; we
		// re-derive and prefix here when no explicit factoryName was provided.
		const factoryName =
			opts?.factoryName ??
			(kind.startsWith('_') ? `_${nameNode(kind).factoryName}` : undefined);
		super(kind, rule, { factoryName, irKey: opts?.irKey });
		this.simplifiedRule = simplifiedRule;
		this.detectToken = opts?.detectToken;
		this.name = opts?.name ?? kind;
		this.parentKind = opts?.parentKind;
		this.slots = buildSlotsRecord(kind, simplifiedRule);
	}

	/**
	 * Field-shaped slots only (source !== 'inferred'). Convenience view
	 * over `slots` for callers that need only named-grammar-field slots.
	 */
	get fields(): readonly AssembledNonterminal[] {
		return Object.values(this.slots).filter((s) => s.source !== 'inferred');
	}

	/**
	 * Inferred positional slots only (source === 'inferred'). Convenience
	 * view over `slots` for callers that need only unnamed positional slots.
	 */
	get children(): readonly AssembledNonterminal[] {
		return Object.values(this.slots).filter((s) => s.source === 'inferred');
	}

	renderTemplate(
		rules?: Record<string, Rule>,
		wordMatcher?: RegExp,
		externals?: ReadonlySet<string>
	): RenderTemplateEntry {
		const textShape = this.textTemplate(externals);
		if (textShape) return textShape;
		// Template walking stays on RAW rule (needs literals); derivations
		// and separator discovery use simplifiedRule.
		const optionalFields = deriveOptionalFieldNames(this.fields);
		const { template, clauses, joinByField, usesChildren, slots } = renderRuleTemplate(
			this.rule,
			false,
			rules,
			wordMatcher,
			optionalFields
		);
		if (!template) {
			throw new Error(
				`AssembledGroup.renderTemplate: '${this.kind}' produced an empty template. ` +
					`Rule has no visible content — should have been classified as leaf/token.`
			);
		}
		const withClauses = inlineJinjaClauses(template, clauses);
		const meta: JinjaTranslateMeta = {};
		const sep = findRepeatSeparator(this.simplifiedRule);
		if (sep) meta.joinBy = sep;
		if (findRepeatFlag(this.simplifiedRule, 'trailing'))
			meta.joinByTrailing = true;
		if (findRepeatFlag(this.simplifiedRule, 'leading'))
			meta.joinByLeading = true;
		const trailingFields = new Set(
			this.fields.filter((f) => f.hasTrailing).map((f) => f.name)
		);
		const leadingFields = new Set(
			this.fields.filter((f) => f.hasLeading).map((f) => f.name)
		);
		if (trailingFields.size > 0) meta.trailingFields = trailingFields;
		if (leadingFields.size > 0) meta.leadingFields = leadingFields;
		if (Object.keys(joinByField).length > 0) meta.joinByField = joinByField;
		if (optionalFields.size > 0) meta.optionalFields = optionalFields;
		return {
			template: translateToJinja(withClauses, meta),
			surface: buildRenderSurface({
				fields: this.fields,
				slots,
				optionalFields,
				usesChildren
			})
		};
	}

	/**
	 * Raw template walk — used by `AssembledPolymorph.renderTemplate` to
	 * collect per-form template/clauses/joinByField parts without the
	 * outer entry-packaging that `renderTemplate` adds.
	 *
	 * Returns the walker's raw output so the polymorph can merge multiple
	 * forms' clauses into a single parent entry. Keeps `this.rule`
	 * encapsulated — the sibling class doesn't reach in.
	 */
	renderParts(
		rules?: Record<string, Rule>,
		wordMatcher?: RegExp
	): {
		template: string;
		clauses: Record<string, string>;
		joinByField: Record<string, string>;
		usesChildren: boolean;
		slots: readonly WalkSlotUse[];
	} {
		const optionalFields = deriveOptionalFieldNames(this.fields);
		return renderRuleTemplate(
			this.rule,
			false,
			rules,
			wordMatcher,
			optionalFields
		);
	}
}

export type AssembledNode =
	| AssembledBranch
	| AssembledPolymorph
	| AssembledPattern
	| AssembledKeyword
	| AssembledToken
	| AssembledEnum
	| AssembledSupertype
	| AssembledGroup
	| AssembledMulti;

// ============================================================================
// Canonical structural-view helpers
// ============================================================================
//
// Two distinct facts about a polymorph's slot inventory:
//
//   1. Dedup'd structural view — one entry per name across forms. The
//      "what slots does this kind expose" view used by emitters that
//      build types, factories, and renderers.
//
//   2. Raw cross-form flatten — every form's fields/children
//      concatenated. The "what literals can ever appear at this kind"
//      view used by transport projection for literal collection.
//
// Branch and Group expose `.fields` / `.children` directly; non-
// structural kinds (leaf/keyword/token/enum/supertype/multi) have no
// structural surface. These helpers narrow over `AssembledNode` and
// give consumers one canonical entry point per fact.

/**
 * Dedup'd structural fields for a node — Branch/Group return their
 * own `.fields`; Polymorph returns the dedup'd union across forms;
 * non-structural kinds return `[]`.
 *
 * Use this when emitting types, factories, or anything that asks
 * "what fields does this kind have." For literal collection across
 * polymorph variants, see {@link allFormFieldsOf}.
 */
export function structuralFieldsOf(
	node: AssembledNode
): readonly AssembledNonterminal[] {
	if (node.modelType === 'polymorph') return node.structuralFields;
	if (node.modelType === 'branch' || node.modelType === 'group')
		return node.fields;
	return [];
}

/**
 * Structural children for a node — Branch/Group return their own
 * `.children`; non-structural kinds (including Polymorph, which
 * routes through forms) return `[]`.
 *
 * Use this for emitters that read child slots on the kind itself.
 */
export function structuralChildrenOf(
	node: AssembledNode
): readonly AssembledNonterminal[] {
	if (node.modelType === 'branch' || node.modelType === 'group')
		return node.children;
	return [];
}

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
export function allFormFieldsOf(
	node: AssembledNode
): readonly AssembledNonterminal[] {
	if (node.modelType === 'polymorph')
		return node.forms.flatMap((form) => form.fields);
	if (node.modelType === 'branch' || node.modelType === 'group')
		return node.fields;
	return [];
}

/**
 * Raw cross-form flatten of children — Polymorph yields every form's
 * children concatenated; Branch/Group return their own `.children`;
 * non-structural kinds return `[]`.
 *
 * Use this for transport projection. For structural-view children,
 * see {@link structuralChildrenOf}.
 */
export function allFormChildrenOf(
	node: AssembledNode
): readonly AssembledNonterminal[] {
	if (node.modelType === 'polymorph')
		return node.forms.flatMap((form) => form.children);
	if (node.modelType === 'branch' || node.modelType === 'group')
		return node.children;
	return [];
}

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
export function allSlotsOf(
	node: AssembledNode
): readonly AssembledNonterminal[] {
	if (node.modelType === 'polymorph')
		return node.forms.flatMap((form) => Object.values(form.slots));
	if (node.modelType === 'branch' || node.modelType === 'group')
		return Object.values(node.slots);
	return [];
}

/**
 * Dedup'd union of every slot across forms — the "all slots" sibling
 * of {@link structuralFieldsOf}. Polymorph returns
 * `node.structuralSlots` (first-occurrence per name across forms,
 * fields and children both); Branch/Group return all entries of their
 * own `.slots`; non-structural kinds return `[]`.
 *
 * Use this when consumers want the dedup'd view regardless of slot
 * kind. For most polymorph-aware walks the raw {@link allSlotsOf}
 * suffices; pick the structural variant only when name-uniqueness
 * matters to the consumer (e.g. set-collecting where dupes inflate
 * count without changing meaning).
 */
export function allStructuralSlotsOf(
	node: AssembledNode
): readonly AssembledNonterminal[] {
	if (node.modelType === 'polymorph') return node.structuralSlots;
	if (node.modelType === 'branch' || node.modelType === 'group')
		return Object.values(node.slots);
	return [];
}
