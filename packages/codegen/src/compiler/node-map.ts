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

import type {
	Rule,
	RenderRule,
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
	TerminalRule,
	Multiplicity,
	RuleId
} from './rule.ts';
import { isSeq, isField } from './rule.ts';
import type { GeneratedKindEntry } from './generated-metadata.ts';
import { findGeneratedKindEntry } from './generated-metadata.ts';
import { tokenToName } from './normalize.ts';
import { collectSlots } from './collect-slots.ts';
import { assertNever } from '../polymorph-variant.ts';
import { fieldContentIsMultiSibling } from './field-shape.ts';
import { opaqueFacts, type OpaqueFacts } from './opaque-facts.ts';
import { deleteWrapper } from './wrapper-deletion.ts';
import {
	diagnoseParseKindCollisions,
	type ParseKindCollisionDiagnostic,
	type ParseKindCollisionValue
} from './diagnose-parsekind-collisions.ts';
import {
	describeDeriveShape,
	type DeriveShapeDiagnostic
} from './diagnose-derive-shapes.ts';

// ---------------------------------------------------------------------------
// NodeOrTerminal — unified slot-content type
// ---------------------------------------------------------------------------

const _parseKindCollisionDiagnostics: ParseKindCollisionDiagnostic[] = [];
const _parseKindCollisionSeen = new Set<string>();

function parseKindCollisionKey(diagnostic: ParseKindCollisionDiagnostic): string {
	return [
		diagnostic.code,
		diagnostic.ownerKind,
		diagnostic.slotName,
		diagnostic.parseKind,
		diagnostic.storageKinds.join(',')
	].join(' ');
}

function recordParseKindCollisionDiagnostic(diagnostic: ParseKindCollisionDiagnostic): void {
	const key = parseKindCollisionKey(diagnostic);
	if (_parseKindCollisionSeen.has(key)) return;
	_parseKindCollisionSeen.add(key);
	_parseKindCollisionDiagnostics.push(diagnostic);
}

export function resetParseKindCollisionDiagnostics(): void {
	_parseKindCollisionDiagnostics.length = 0;
	_parseKindCollisionSeen.clear();
}

export function drainParseKindCollisionDiagnostics(): ParseKindCollisionDiagnostic[] {
	const out = [..._parseKindCollisionDiagnostics];
	resetParseKindCollisionDiagnostics();
	return out;
}

// ---------------------------------------------------------------------------
// Derive-shape diagnostic accumulator (mirrors parseKindCollisions pattern)
// ---------------------------------------------------------------------------

const _deriveShapeDiagnostics: DeriveShapeDiagnostic[] = [];
const _deriveShapeSeen = new Set<string>();

function recordDeriveShapeDiagnostic(d: DeriveShapeDiagnostic): void {
	const key = `${d.code}|${d.ownerKind ?? ''}|${d.details.rawShape}|${d.details.context}`;
	if (_deriveShapeSeen.has(key)) return;
	_deriveShapeSeen.add(key);
	_deriveShapeDiagnostics.push(d);
}

export function resetDeriveShapeDiagnostics(): void {
	_deriveShapeDiagnostics.length = 0;
	_deriveShapeSeen.clear();
}

export function drainDeriveShapeDiagnostics(): DeriveShapeDiagnostic[] {
	const out = [..._deriveShapeDiagnostics];
	resetDeriveShapeDiagnostics();
	return out;
}

// ---------------------------------------------------------------------------
// Assemble warning accumulator — mirrors parseKindCollisions pattern.
// Records compiler-phase conditions discovered during the assemble pass
// (typeName collisions, storageName collisions, unresolved slot refs) as
// structured diagnostic payloads so they surface through the grammar-diagnostics
// preflight rather than being silently swallowed when SITTIR_QUIET is set.
// ---------------------------------------------------------------------------

export interface AssembleWarning {
	readonly code: string;
	readonly message: string;
	readonly ownerKind?: string;
	readonly details?: Record<string, unknown>;
}

const _assembleWarnings: AssembleWarning[] = [];
const _assembleWarningSeen = new Set<string>();

function assembleWarningKey(w: AssembleWarning): string {
	return `${w.code}|${w.ownerKind ?? ''}|${w.message}`;
}

export function recordAssembleWarning(w: AssembleWarning): void {
	const key = assembleWarningKey(w);
	if (_assembleWarningSeen.has(key)) return;
	_assembleWarningSeen.add(key);
	_assembleWarnings.push(w);
}

export function resetAssembleWarnings(): void {
	_assembleWarnings.length = 0;
	_assembleWarningSeen.clear();
}

export function drainAssembleWarnings(): AssembleWarning[] {
	const out = [..._assembleWarnings];
	resetAssembleWarnings();
	return out;
}

/**
 * Per-value multiplicity tag. Each entry in a slot's `values` array carries
 * its own multiplicity derived from the grammar rule that produced it.
 *
 * - `optional`      → `T | undefined`        (field: `readonly x?: T`)
 * - `single`        → `T`                    (field: `readonly x: T`)
 * - `array`         → `readonly T[]`          (field: `readonly x: readonly T[]`)
 * - `nonEmptyArray` → `NonEmptyArray<T>`      (field: `readonly x: NonEmptyArray<T>`)
 *
 * Defined in `./rule.ts` so RuleBase can reference it without circularity
 * (rule.ts → node-map.ts is the layering direction). Re-exported here for
 * existing consumers; new code may import from either location.
 */
export { type Multiplicity } from './rule.ts';

// ---------------------------------------------------------------------------
// Optional-body lookthrough (module-level current pointer)
// ---------------------------------------------------------------------------
//
// Some rule kinds, after Link-phase stamping (see
// `stampStaticRenderAs` for blank-bodied renderAs entries),
// resolve to a body that's wholly optional — `optional(X)` or a choice
// containing the blank sentinel. References to such a kind are
// effectively optional even when the SYMBOL ref itself sits at a
// non-optional position in the parent rule (e.g. tree-sitter externals
// like `_automatic_semicolon` that fire invisibly at runtime — the
// grammar requires them syntactically but the parser can match them
// without producing a CST token).
//
// `currentOptionalBodyKinds` is set by `assemble.ts` for the duration of
// the rule walk and consulted by the slot-value constructors to downgrade
// the multiplicity of single-position refs to such kinds from `'single'`
// to `'optional'`. Without this look-through, wrap-side reads would
// assert required-singular and reject ASI-terminated corpus entries.
let currentOptionalBodyKinds: ReadonlySet<string> | null = null;

/** Set by `assemble.ts` before running the rule walk; cleared after. */
export function setOptionalBodyKinds(kinds: ReadonlySet<string> | null): void {
	currentOptionalBodyKinds = kinds;
}

/** True iff `kindName` resolves to a wholly-optional rule body. */
function isOptionalBodyKind(kindName: string): boolean {
	return currentOptionalBodyKinds !== null && currentOptionalBodyKinds.has(kindName);
}

/**
 * Downgrade `'single'` → `'optional'` when the referenced kind has a
 * wholly-optional resolved body. Pass-through otherwise.
 */
function relaxForOptionalBody(refName: string, multiplicity: Multiplicity): Multiplicity {
	if (multiplicity !== 'single') return multiplicity;
	const cleanName = refName.replace(/^_+/, '') || refName;
	if (isOptionalBodyKind(refName) || isOptionalBodyKind(cleanName)) return 'optional';
	return multiplicity;
}

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
	// Parse-as kind ref (§7.3 / §4g, PR-A front-load): the CST kind this value
	// surfaces under — the alias TARGET when aliased (`rule.name`), else the
	// own kind. Differs from `node` (render/source = `aliasedFrom ?? rule.name`)
	// only for aliased/variant values. `storageName`/`parseNames` project this.
	readonly parseKind?: UnresolvedRef;
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
 *
 * `immediate` is set when the rule that produced this value was wrapped in
 * a `TokenRule` with `immediate: true` (i.e. `token.immediate(...)` in the
 * authored grammar, or tree-sitter `IMMEDIATE_TOKEN`). Render templates
 * use this to emit the literal adjacent to the preceding token (no leading
 * whitespace separator). Absent / false → default field-spacing rules.
 *
 * `tokenized` is set when the rule was wrapped in a `TokenRule` (whether
 * or not it was the `immediate` variant). Preserved for cases where the
 * lexer-hint nature of `TOKEN(...)` matters separately from adjacency
 * (e.g. disambiguation between `<` operator and generic-open).
 */
export interface TerminalValue {
	readonly kind: 'terminal';
	readonly value: string;
	readonly resolvedKind?: string;
	// Parse-as kind ref (§7.3 / §4g, PR-A front-load): the CST kind this literal
	// surfaces under (= `resolvedKind` as a ref). `parseNames` projects this;
	// PR-B renames `resolvedKind`→`parseKind` outright.
	readonly parseKind?: UnresolvedRef;
	readonly multiplicity: Multiplicity;
	readonly separator?: string;
	readonly trailing?: boolean;
	readonly leading?: boolean;
	readonly immediate?: boolean;
	readonly tokenized?: boolean;
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
	return typeof v === 'object' && (v as { kind?: unknown }).kind === 'unresolved-ref';
}

// ---------------------------------------------------------------------------
// Derived slot-level helpers (DRY: one derivation, not stored flags)
// ---------------------------------------------------------------------------

/**
 * True when EVERY value in the slot is guaranteed to be present:
 * `single` or `nonEmptyArray`.
 *
 * Plain `array` slots are optional at the transport/render surface: a
 * repeated field with zero occurrences is emitted as a missing slot, not
 * a present-empty collection.
 */
export function isRequired(slot: { values: readonly NodeOrTerminal[] }): boolean {
	return (
		slot.values.length > 0 &&
		slot.values.every((v) => v.multiplicity === 'single' || v.multiplicity === 'nonEmptyArray')
	);
}

/**
 * True when ANY value has multiplicity `array` or `nonEmptyArray`.
 */
export function isMultiple(slot: { values: readonly NodeOrTerminal[] }): boolean {
	return slot.values.some((v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray');
}

/**
 * True when EVERY multi-valued value is `nonEmptyArray` (and there is at
 * least one multi-valued value). A mixed `array` + `nonEmptyArray` slot
 * returns `false` — the `array` form allows empty.
 */
export function isNonEmpty(slot: { values: readonly NodeOrTerminal[] }): boolean {
	const multis = slot.values.filter((v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray');
	return multis.length > 0 && multis.every((v) => v.multiplicity === 'nonEmptyArray');
}

export interface SlotCardinality {
	readonly required: boolean;
	readonly multiple: boolean;
	readonly nonEmpty: boolean;
}

export function deriveSlotCardinality(slot: { values: readonly NodeOrTerminal[] }): SlotCardinality {
	return {
		required: isRequired(slot),
		multiple: isMultiple(slot),
		nonEmpty: isNonEmpty(slot)
	};
}

export function mergeSlotValues(
	slots: readonly {
		values: readonly NodeOrTerminal[];
	}[]
): { readonly values: readonly NodeOrTerminal[] } | undefined {
	if (slots.length === 0) return undefined;
	return {
		values: dedupeValues(slots.flatMap((slot) => [...slot.values]))
	};
}

export function deriveMergedSlotCardinality(
	slots: readonly {
		values: readonly NodeOrTerminal[];
	}[]
): SlotCardinality {
	const merged = mergeSlotValues(slots);
	return merged ? deriveSlotCardinality(merged) : { required: false, multiple: false, nonEmpty: false };
}

export function deriveUnnamedChildrenCardinality(
	children: readonly {
		values: readonly NodeOrTerminal[];
	}[]
): SlotCardinality {
	if (children.length === 0) {
		return { required: false, multiple: false, nonEmpty: false };
	}
	return children.length === 1 ? deriveSlotCardinality(children[0]!) : deriveChildrenCardinality(children);
}

export function deriveChildrenCardinality(
	children: readonly {
		values: readonly NodeOrTerminal[];
	}[]
): SlotCardinality {
	if (children.length === 0) {
		return { required: false, multiple: false, nonEmpty: false };
	}
	return {
		required: children.some((child) => isRequired(child)),
		multiple: children.some((child) => isMultiple(child)),
		nonEmpty: children.some((child) => isNonEmpty(child))
	};
}

export interface RenderTemplateSurface {
	readonly slots: readonly RenderTemplateSlot[];
	readonly usesChildren: boolean;
	readonly usesVariant: boolean;
	readonly usesText: boolean;
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
	if (name.endsWith('s') || name.endsWith('List') || name.endsWith('children') || name.endsWith('Children'))
		return name;
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

export function safeParamName(name: string): string {
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
function auditDerivationShape(rule: Rule, context: 'fields' | 'children'): void {
	const mode = deriveAuditMode();
	if (mode === 'off') return;
	const shape = classifyTopLevelShape(rule);
	if (shape === 'canonical') return;
	// Record a structured diagnostic and continue — the old strict-mode throw
	// is replaced by accumulation so codegen completes and the preflight can
	// surface all derive-shape issues in a single pass. drainDeriveShapeDiagnostics()
	// is called by assemble() to attach them to AssembledNodeMap.
	recordDeriveShapeDiagnostic(
		describeDeriveShape({
			rawShape: shape,
			ruleType: rule.type,
			context,
			ownerKind: currentAuditKind,
			ruleId: rule.id,
		})
	);
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
			for (const m of rule.members) {
				if (m.type === 'seq') {
					// A nested seq that carries its OWN cardinality
					// (multiplicity / separator) is a canonical repeated /
					// optional GROUP, not a flattening gap. simplify deliberately
					// does NOT splice such a seq (splicing would lose the shared
					// cardinality and hoist any inner choice to this seq's
					// position). `deriveSlotsRaw` threads the group's multiplicity
					// into its members and handles an inner choice via its own
					// choice case, so we accept it here WITHOUT recursing.
					const sm = m as { multiplicity?: unknown; separator?: unknown };
					if (sm.multiplicity !== undefined || sm.separator !== undefined) continue;
					return 'seq-with-nested-seq';
				}
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
			return inner === 'canonical' ? 'canonical' : `${rule.type}-wrapping-${inner}`;
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
			const allFieldOrToken = rule.members.every((m) => m.type === 'field' || isTokenLikeChoiceMember(m));
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
			return innerShape === 'canonical' ? 'canonical' : `optional-wrapping-${innerShape}`;
		}
		case 'group':
		case 'alias':
			return `wrapper-${rule.type}`;
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
	if (core.type === 'symbol' || core.type === 'supertype' || core.type === 'enum') return true;
	// Bare `string` / `pattern` members — token-literal alternatives.
	// `_non_special_token` has a choice containing dozens of bare
	// keyword strings alongside symbol refs; each contributes a
	// single-token alternative to the union, not a structural branch.
	if (core.type === 'string' || core.type === 'pattern') return true;
	// Structural-whitespace tokens (python-style indent/dedent/newline).
	// These behave as anonymous token separators — they don't surface
	// as addressable children, so they never contribute structural
	// branching to a choice arm.
	if (core.type === 'indent' || core.type === 'dedent' || core.type === 'newline') return true;
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
	if (core.type === 'choice' && core.members.every(isTokenLikeChoiceMember)) return true;
	if (core.type === 'repeat1' || core.type === 'repeat') {
		const inner = peel(core.content);
		if (inner.type === 'enum') return true;
		if (inner.type === 'string' || inner.type === 'pattern') return true;
		if (inner.type === 'symbol' || inner.type === 'supertype') return true;
		if (inner.type === 'choice' && inner.members.every(isTokenLikeChoiceMember)) return true;
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
		console.error(`  ${n.toString().padStart(5)} ${key}  [${kinds.join(', ')}]`);
	}
	auditCounts.clear();
	auditKindsByShape.clear();
}

/**
 * Internal — fields-side walk. The exported derivation surface is
 * `deriveSlots`; this helper is its fields-portion.
 *
 * Applies `deleteWrapper` before dispatching so test fixtures that pass raw
 * rule trees (with `field` / `optional` / `repeat` / `repeat1` wrappers) get
 * canonical input automatically. In production the rule arrives already
 * wrapper-free from `computeSimplifiedRules` — `deleteWrapper` is idempotent
 * on wrapper-free input, so this is a no-op on the hot path.
 */
function _deriveSlotsInternal(rule: Rule, kindEntries?: readonly GeneratedKindEntry[], kindName?: string): AssembledNonterminal[] {
	const canonical = deleteWrapper(rule) as Rule;
	// Set the audit kind context for the duration of this derivation so
	// auditDerivationShape() can attribute shapes to their originating kind.
	// Save/restore guards against cross-kind bleed if derivations nest.
	const prevAuditKind = currentAuditKind;
	if (kindName !== undefined) setAuditKindContext(kindName);
	try {
		auditDerivationShape(canonical, 'fields');
		// Nonterminal-driven collection (2026-05-21 design): one slot per
		// `nonterminal` node, choice = one union slot, seq distributes. Replaces
		// the `deriveSlotsRaw` fold/merge/effectiveMultiplicity walker. Same-name
		// slots that appear in multiple positions (e.g. python `if_statement`'s
		// `alternative` in both a repeat and an optional) are still folded into one
		// AssembledNonterminal by `mergeSlotsByName`.
		return mergeSlotsByName(collectSlots(canonical, kindName ?? currentAuditKind, kindEntries));
	} finally {
		setAuditKindContext(prevAuditKind);
	}
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
 * name determines them). The referenced kind set is no longer cached on
 * the slot — consumers derive it via `kindsOf(slot)` from the merged
 * `values`.
 */
function mergeSlotsByName(fields: AssembledNonterminal[]): AssembledNonterminal[] {
	if (fields.length <= 1) return fields;
	const byName = new Map<string, AssembledNonterminal>();
	for (const f of fields) {
		const existing = byName.get(f.name);
		if (!existing) {
			byName.set(f.name, f);
			continue;
		}
		byName.set(f.name, existing.with({
			values: dedupeValues([...existing.values, ...f.values]),
			hasTrailing: existing.hasTrailing || f.hasTrailing,
			hasLeading: existing.hasLeading || f.hasLeading,
			sourceRuleIds: mergeSourceRuleIds(existing.sourceRuleIds, f.sourceRuleIds),
		}));
	}
	return Array.from(byName.values());
}

export interface ParseKindCollisionContext {
	readonly ruleSignatures: Readonly<Record<string, string>>;
}

export function buildParseKindRuleSignatures<T extends Rule>(
	rules: Readonly<Record<string, T>>
): Readonly<Record<string, string>> {
	return Object.fromEntries(
		Object.entries(rules).map(([kind, rule]) => [kind, canonicalRuleSignature(rule)])
	);
}

export function storageKindOfValue(value: NodeOrTerminal): string | undefined {
	if (value.kind === 'node-ref') {
		return isUnresolvedRef(value.node) ? value.node.name : value.node.kind;
	}
	return value.resolvedKind ?? value.value;
}

function resolveParseKindCollisions(
	ownerKind: string,
	slots: readonly AssembledNonterminal[],
	context?: ParseKindCollisionContext
): AssembledNonterminal[] {
	if (slots.length === 0) return [...slots];
	return mergeSlotsByName(slots.map((slot) => resolveParseKindCollisionsInSlot(ownerKind, slot, context)));
}

function resolveParseKindCollisionsInSlot(
	ownerKind: string,
	slot: AssembledNonterminal,
	context?: ParseKindCollisionContext
): AssembledNonterminal {
	const describedValues: ParseKindCollisionValue<NodeOrTerminal>[] = slot.values.map((value) => {
		const storageKind = storageKindOfValue(value);
		return {
			original: value,
			parseKind: value.parseKind?.name,
			storageKind,
			structuralSignature: structuralSignatureOfValue(value, storageKind, context),
			preferRepresentative: storageKind !== undefined && storageKind === value.parseKind?.name
		};
	});
	const resolution = diagnoseParseKindCollisions({
		ownerKind,
		slotName: slot.name,
		values: describedValues
	});
	for (const diagnostic of resolution.diagnostics) {
		recordParseKindCollisionDiagnostic(diagnostic);
	}
	const nextValues = [...resolution.values];
	const unchanged =
		nextValues.length === slot.values.length &&
		nextValues.every((value, index) => value === slot.values[index]);
	return unchanged ? slot : slot.with({ values: dedupeValues(nextValues) });
}

function structuralSignatureOfValue(
	value: NodeOrTerminal,
	storageKind: string | undefined,
	context?: ParseKindCollisionContext
): string {
	const surface = [
		value.multiplicity,
		value.separator ?? '',
		value.trailing ? 't' : '',
		value.leading ? 'l' : '',
		value.kind === 'terminal' && value.immediate ? 'i' : '',
		value.kind === 'terminal' && value.tokenized ? 'tok' : ''
	].join('|');
	if (value.kind === 'terminal') {
		return `terminal:${value.value}:${value.resolvedKind ?? ''}:${surface}`;
	}
	return `node:${structuralSignatureOfStorageKind(storageKind, context)}:${surface}`;
}

function structuralSignatureOfStorageKind(
	storageKind: string | undefined,
	context?: ParseKindCollisionContext
): string {
	if (storageKind === undefined) return 'missing';
	return context?.ruleSignatures[storageKind] ?? `missing:${storageKind}`;
}

function canonicalRuleSignature(value: unknown): string {
	return JSON.stringify(normalizeRuleForSignature(value));
}

function normalizeRuleForSignature(value: unknown): unknown {
	if (Array.isArray(value)) return value.map((member) => normalizeRuleForSignature(member));
	if (value === null || typeof value !== 'object') return value;
	const obj = value as Record<string, unknown>;
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(obj).sort()) {
		if (key === 'id' || key === 'source') continue;
		const normalized = normalizeRuleForSignature(obj[key]);
		if (normalized !== undefined) out[key] = normalized;
	}
	return out;
}

/**
 * Extract a separator string from a Rule['separator'] value.
 * Returns undefined when the separator is absent or empty.
 * Handles string, Rule[], and the object form { rules, trailing?, leading? }.
 */
export function extractSeparatorString(sep: Rule['separator']): string | undefined {
	if (sep === undefined) return undefined;
	if (typeof sep === 'string') return sep || undefined;
	if (Array.isArray(sep)) {
		const str = sep.map((r) => ('value' in r ? (r as { value: string }).value : '')).join('');
		return str || undefined;
	}
	// Object form { rules: Rule[], trailing?, leading? }
	const rules = (sep as { rules: readonly { value?: string }[] }).rules;
	const str = rules.map((r) => r.value ?? '').join('');
	return str || undefined;
}

/**
 * Stamp separator onto array/nonEmptyArray multiplicity values.
 * Single-value slots are left unchanged — separator is meaningless for them.
 */
export function stampSeparatorOnValues(values: NodeOrTerminal[], separatorStr: string | undefined): NodeOrTerminal[] {
	if (!separatorStr) return values;
	return values.map((v) =>
		v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray' ? { ...v, separator: separatorStr } : v
	);
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
export function deriveSlots(rule: Rule, kindEntries?: readonly GeneratedKindEntry[], kindName?: string): readonly AssembledNonterminal[] {
	// The field walker handles positional symbol/supertype/choice content
	// too, so it produces every slot — no separate children walker needed.
	return _deriveSlotsInternal(rule, kindEntries, kindName);
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
export function deriveValuesForRule(
	rule: Rule,
	multiplicity: Multiplicity,
	kindEntries?: readonly GeneratedKindEntry[]
): NodeOrTerminal[] {
	switch (rule.type) {
		case 'symbol': {
			// Link-synthesized operator literal (Chunk D1): `canonicalizeRuleLiterals`
			// rewrites a field-wrapped operator literal (`'<'`) into
			// `symbol{ name: 'lt', source: 'link', literal: '<' }`. The `name` is
			// the alias-target kind (the runtime `$type`) and `literal` is the
			// original source string. Emit a TERMINAL of the source string —
			// `value` is what the renderer emits (`<`), `resolvedKind` is the
			// alias-target kindId read-time matching keys on (`lt`). Dropping
			// `literal` (the old behavior) leaked a PHANTOM kind ref (`Lt`/`LtEq`)
			// into the operator enum and left render emitting the bare literal
			// while read could not populate the slot.
			if (rule.source === 'link' && rule.literal !== undefined) {
				return [
					{
						kind: 'terminal',
						value: rule.literal,
						resolvedKind: rule.name,
						parseKind: { kind: 'unresolved-ref', name: rule.name },
						multiplicity
					}
				];
			}
			// Ref kind: resolve to SOURCE kind (`aliasedFrom`, when the
			// symbol came from an alias). Only source kinds exist in
			// rules post-synthesis-removal.
			const refName = rule.aliasedFrom ?? rule.name;
			return [
				{
					kind: 'node-ref',
					node: { kind: 'unresolved-ref', name: refName },
					// parse-as kind = the alias TARGET (`rule.name`); `node` is the
					// render/source (`refName`). For `_suite`: node=_simple_statements,
					// parseKind=block (the CST kind). §7.3 / §4g.
					parseKind: { kind: 'unresolved-ref', name: rule.name },
					multiplicity: relaxForOptionalBody(refName, multiplicity)
				}
			];
		}
		case 'supertype':
			// Supertype refs expand to their subtype list — each subtype is a
			// valid concrete kind the slot can hold.
			return rule.subtypes.map((name) => ({
				kind: 'node-ref' as const,
				node: { kind: 'unresolved-ref' as const, name },
				parseKind: { kind: 'unresolved-ref' as const, name },
				multiplicity: relaxForOptionalBody(name, multiplicity)
			}));
		case 'string':
		// A `pattern` is a NONTERMINAL slot (classifyByType), but its VALUE is the
		// anonymous-token text it matches — a terminal value, like a `string` or an
		// `enum` member. Without this case it fell to `default: return []`, so a
		// pattern slot had no values and was elided (e.g. token_repetition's
		// separator pattern never became a slot).
		case 'pattern': {
			const rk = findGeneratedKindEntry(kindEntries ?? [], rule.value)?.kind;
			return [
				{
					kind: 'terminal',
					value: rule.value,
					resolvedKind: rk,
					parseKind: rk !== undefined ? { kind: 'unresolved-ref', name: rk } : undefined,
					multiplicity
				}
			];
		}
		case 'enum':
			// Enum: each enum member is a TerminalValue
			return rule.members.map((m) => {
				const rk = findGeneratedKindEntry(kindEntries ?? [], m.value)?.kind;
				return {
					kind: 'terminal' as const,
					value: m.value,
					resolvedKind: rk,
					parseKind: rk !== undefined ? { kind: 'unresolved-ref' as const, name: rk } : undefined,
					multiplicity
				};
			});
		case 'choice': {
			// `choice(X, blank)` is functionally `optional(X)` — the blank arm
			// makes the entire choice optional. Downgrade nonEmptyArray → array
			// and single → optional when recursing into the non-blank arms.
			// Mirrors the fieldContentMultiplicity choice handling and the
			// rule-body lookthrough in assemble.ts.
			const isBlank = (r: Rule): boolean =>
				(r.type === 'choice' && r.members.length === 0) ||
				(r.type === 'seq' && r.members.length === 0);
			const nonBlank = rule.members.filter((m) => !isBlank(m));
			const hasBlank = nonBlank.length < rule.members.length;
			const armMult: Multiplicity =
				hasBlank && nonBlank.length >= 1
					? multiplicity === 'nonEmptyArray'
						? 'array'
						: multiplicity === 'single'
							? 'optional'
							: multiplicity
					: multiplicity;
			// Each arm is independent — union all entries. Arms may differ in
			// their own multiplicity if they wrap repeat/optional differently.
			return nonBlank.flatMap((m) => deriveValuesForRule(m, armMult, kindEntries));
		}
		case 'optional': {
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
				return deriveValuesForRule(rule.content.content, 'array', kindEntries);
			}
			// For `optional(seq(..., repeat1(...), ...))` and similar nested
			// shapes (which is the form `choice(seq(...), blank)` folds to
			// during simplify), the outer optional makes the entire content
			// empty-allowed. Any `nonEmptyArray` produced by an inner repeat1
			// is therefore relaxed to `array` at the outer slot — empty inputs
			// like `{}` (object_type with zero members) are valid.
			const inner = deriveValuesForRule(rule.content, 'optional', kindEntries);
			return inner.map((v) =>
				v.multiplicity === 'nonEmptyArray' ? { ...v, multiplicity: 'array' as const } : v
			);
		}
		case 'repeat':
			return deriveValuesForRule(rule.content, 'array', kindEntries);
		case 'repeat1':
			return deriveValuesForRule(rule.content, 'nonEmptyArray', kindEntries);
		case 'field':
			// Nested field inside a choice — recurse into its content
			return deriveValuesForRule(rule.content, multiplicity, kindEntries);
		case 'variant':
		case 'group':
			return deriveValuesForRule(rule.content, multiplicity, kindEntries);
		case 'token':
			// `token(...)` / `token.immediate(...)` wrappers carry adjacency
			// metadata the inner rule alone doesn't express. Recurse, then
			// tag each produced terminal so render templates can decide
			// whether to emit adjacent or spaced.
			return deriveValuesForRule(rule.content, multiplicity, kindEntries).map((v) =>
				v.kind === 'terminal' ? { ...v, immediate: rule.immediate, tokenized: true } : v
			);
		case 'seq':
			// Seq inside a choice arm — flatten all members (rare, but
			// handles seq-of-symbols within choice arms).
			return rule.members.flatMap((m) => deriveValuesForRule(m, multiplicity, kindEntries));
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
export function dedupeValues(values: NodeOrTerminal[]): NodeOrTerminal[] {
	const seen = new Set<string>();
	const result: NodeOrTerminal[] = [];
	for (const v of values) {
		const parseKind = v.parseKind?.name ?? '';
		const nodeName = v.kind === 'node-ref' ? (isUnresolvedRef(v.node) ? v.node.name : v.node.kind) : undefined;
		const key =
			v.kind === 'node-ref'
				? `node-ref:${nodeName ?? '?'}:${parseKind}:${v.multiplicity}`
				: `terminal:${v.value}:${parseKind}:${v.multiplicity}`;
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
	 * Structural getter — replaces the former `markParameterlessKinds`
	 * fixpoint pass. Two classes of parameterless kinds:
	 *
	 * - **Single-literal terminals** (`AssembledKeyword`, `AssembledToken`):
	 *   overridden to return `true` unconditionally (or conditionally for
	 *   tokens — only `string`-rule tokens are parameterless).
	 * - **Parameterless compounds** (`AssembledBranch`, `AssembledGroup`):
	 *   computed recursively — a compound is parameterless iff it has at
	 *   least one required slot AND every slot passes `_isAutoStampSlot`
	 *   (which recurses into child nodes via their own `parameterless`
	 *   getter). A cycle guard (`#computing` flag) breaks re-entrant
	 *   calls conservatively (returns `false`), replicating the
	 *   least-fixed-point-from-false semantics of the old iterative pass.
	 *
	 * Emitters use this to decide whether a slot pointing at this kind
	 * can be auto-stamped in parent factories and omitted from parent
	 * Config types. The result is memoized after the first evaluation.
	 */
	get parameterless(): boolean {
		return false;
	}

	/** @deprecated Use `parameterless` getter instead. Kept for emitter back-compat. */
	get isParameterless(): boolean {
		return this.parameterless;
	}

	/**
	 * Code-gen stamp expression for this parameterless kind — **field
	 * context**. Used when a parent stamps this kind into its
	 * `$fields` slot. Defined iff `parameterless` is true. Two shapes:
	 *
	 * - **Keyword / terminal**: JSON-encoded literal with `as const`
	 *   (e.g. `'"break" as const'`). Matches the interface's field type
	 *   (`readonly op: "break"`) and the render pipeline's acceptance
	 *   of plain string values in `$fields`.
	 * - **Parameterless compound**: factory-call string
	 *   (e.g. `"breakExpression()"`). Returns the full NodeData.
	 *
	 * Overridden by `AssembledKeyword`, `AssembledToken` (constructors set
	 * a backing field); compounds derive from `rawFactoryName`.
	 */
	get stampExpression(): string | undefined {
		return undefined;
	}

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
		this.factoryName = opts?.hidden === true ? undefined : (opts?.factoryName ?? derived.factoryName);
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
	/**
	 * Factory function name to emit in factories.ts — factoryName with a
	 * trailing `_` when the bare name collides with a JS reserved word.
	 * Returns `undefined` for hidden nodes.
	 */
	get rawFactoryName(): string | undefined {
		if (this.factoryName === undefined) return undefined;
		return JS_RESERVED_FACTORY_NAMES.has(this.factoryName) ? `${this.factoryName}_` : this.factoryName;
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
/** Stored (non-computed) constructor inputs for {@link AssembledNonterminal}. */
export interface AssembledNonterminalInit {
	readonly values: readonly NodeOrTerminal[];
	readonly fieldName?: string;
	readonly hasTrailing: boolean;
	readonly hasLeading: boolean;
	readonly source: 'grammar' | 'override' | 'promoted' | 'enriched' | 'inferred';
	/**
	 * Rule-ids of every simplified/render-rule position that produced this slot —
	 * see `AssembledNonterminal.sourceRuleIds`.
	 */
	readonly sourceRuleIds: readonly RuleId[];
	/** Validator-only facts. OPAQUE to the compiler (see {@link OpaqueFacts}) —
	 *  never read here to drive logic or emission; defaults to empty. */
	readonly metadata?: OpaqueFacts;
	storageInfo?: FieldStorageInfo;
}

export function mergeSourceRuleIds(
	...groups: readonly (readonly RuleId[] | undefined)[]
): readonly RuleId[] {
	const seen = new Set<RuleId>();
	const out: RuleId[] = [];
	for (const group of groups) {
		for (const id of group ?? []) {
			if (seen.has(id)) continue;
			seen.add(id);
			out.push(id);
		}
	}
	return out;
}

/**
 * A fully-resolved slot produced by the collect-slots / assemble pipeline.
 *
 * Naming properties (`storageName`, `name`, `configKey`, `propertyName`,
 * `paramName`, `parseNames`) are computed getters derived from `values` +
 * `fieldName` via {@link projectSlotNaming}. They are never stored or spread
 * — use `.with(overrides)` to create a modified copy.
 */
export class AssembledNonterminal {
	readonly values: readonly NodeOrTerminal[];
	readonly fieldName?: string;
	readonly hasTrailing: boolean;
	readonly hasLeading: boolean;
	readonly source: 'grammar' | 'override' | 'promoted' | 'enriched' | 'inferred';
	/**
	 * Rule-ids of every simplified/render-rule position that produced this slot.
	 * Used by `NodeMap.slotByRuleId` to back-pointer from whichever rule-tree
	 * view a consumer walks to the owning slot without owner traversal. Empty
	 * when the source rules carry no ids (hand-constructed test fixtures that
	 * bypass `buildRuleCatalog`). See feedback_ruleid_backpointer / FOLD-1.
	 */
	readonly sourceRuleIds: readonly RuleId[];
	/** Validator-only facts. OPAQUE to the compiler (see {@link OpaqueFacts}) —
	 *  never read here to drive logic or emission. */
	readonly metadata: OpaqueFacts;
	storageInfo?: FieldStorageInfo;

	get storageName(): string { return projectSlotNaming(this).storageName; }
	get name(): string { return projectSlotNaming(this).name; }
	/** Config key — matches ConfigOf projection (camelCase of storageName). Always singular. */
	get configKey(): string { return projectSlotNaming(this).configKey; }
	get propertyName(): string { return projectSlotNaming(this).propertyName; }
	get paramName(): string { return projectSlotNaming(this).paramName; }
	get parseNames(): readonly string[] { return projectSlotNaming(this).parseNames; }
	get isUnnamed(): boolean { return this.fieldName === undefined; }
	/** Multiplicity: 'many' when any value has array/nonEmptyArray multiplicity, 'one' otherwise. */
	get arity(): 'one' | 'many' { return isMultiple(this) ? 'many' : 'one'; }
	/** Canonical `_<storageName>` storage key (single source of truth for the `_` prefix convention). */
	get storageKey(): string { return `_${this.storageName}`; }

	constructor(init: AssembledNonterminalInit) {
		this.values = init.values;
		this.fieldName = init.fieldName;
		this.hasTrailing = init.hasTrailing;
		this.hasLeading = init.hasLeading;
		this.source = init.source;
		this.sourceRuleIds = init.sourceRuleIds;
		this.metadata = init.metadata ?? opaqueFacts({});
		this.storageInfo = init.storageInfo;
	}

	/** Return a new instance with the given fields overridden; naming recomputed. */
	with(overrides: Partial<AssembledNonterminalInit>): AssembledNonterminal {
		return new AssembledNonterminal({
			values: this.values,
			fieldName: this.fieldName,
			hasTrailing: this.hasTrailing,
			hasLeading: this.hasLeading,
			source: this.source,
			sourceRuleIds: this.sourceRuleIds,
			metadata: this.metadata,
			storageInfo: this.storageInfo,
			...overrides,
		});
	}
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
		const name = isUnresolvedRef(v.node) ? (v.node as UnresolvedRef).name : (v.node as AssembledNode).kind;
		if (!seen.has(name)) {
			seen.add(name);
			out.push(name);
		}
	}
	return out;
}

/**
 * Distinct per-value parse-kind names from a slot's `values[]`.
 *
 * Unlike {@link projectSlotNaming}.parseNames, this excludes the field-name
 * projection used for fielded slots and returns only the underlying
 * value-carried CST / alias-target kinds.
 */
export function valueParseKindsOf(slot: { values: readonly NodeOrTerminal[] }): readonly string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const value of slot.values) {
		const parseKind = value.parseKind?.name;
		if (parseKind === undefined || seen.has(parseKind)) continue;
		seen.add(parseKind);
		out.push(parseKind);
	}
	return out;
}

/**
 * Derive the alias-target -> canonical-source map for a slot from per-value
 * `parseKind` metadata.
 */
export function aliasTargetToSourceMapOf(
	slot: { values: readonly NodeOrTerminal[] }
): Readonly<Record<string, string>> {
	const out: Record<string, string> = {};
	for (const value of slot.values) {
		if (!isNodeRef(value)) continue;
		const parseKind = value.parseKind?.name;
		const sourceKind = isUnresolvedRef(value.node) ? value.node.name : value.node.kind;
		if (parseKind === undefined || parseKind === sourceKind) continue;
		out[parseKind] = sourceKind;
	}
	return out;
}

/** The slot-naming inputs a projection needs (the only stored facts). */
export interface SlotNamingInputs {
	readonly fieldName?: string;
	readonly values: readonly NodeOrTerminal[];
}

/**
 * Project a slot's names from its `values` + `fieldName` — the §2 getter logic
 * as a pure function (PR-A; PR-B promotes these to `AssembledNonterminal` class
 * getters). PROJECTIONS, not stored fields: `parseNames` is the live set of CST
 * kinds tree-sitter emits (per-value `parseKind.name`, underscore RETAINED), so
 * it can't go stale across `mergeSlotsByName`'s value-union. The leading `_` is
 * trimmed ONLY in `storageName` (the TS-facing identity). camelCase projections
 * derive from `storageName` (#3 — never the identity).
 */
export function projectSlotNaming(slot: SlotNamingInputs): {
	storageName: string;
	name: string;
	configKey: string;
	propertyName: string;
	paramName: string;
	parseNames: readonly string[];
} {
	// parseNames = the names tree-sitter routes this slot's children by. A FIELDED
	// slot routes by its field name (`childByFieldName('body')`) — so the field
	// name IS the parse name. An UNNAMED slot routes by child kind — so the parse
	// names are the distinct value parse-as (CST / alias-target) kinds.
	const parseNames =
		slot.fieldName !== undefined
			? [slot.fieldName]
			: valueParseKindsOf(slot);
	// storageName derives from the STORAGE / render-source kind (`value.node` —
	// how the value is stored and keyed via `drillAs`), NOT `parseKind`. The two
	// projections are parallel and must NOT cross: storageKind→storageName,
	// parseKind→parseNames. `distinctStorageKinds` mirrors `kindsOf` (node-ref
	// values' source kind). A slot whose values share ONE storage kind is named
	// after it; a multi-storage-kind slot — e.g. `_suite`'s
	// `{_simple_statements, block, _newline}` (all `parseKind=block`) — falls back
	// to the generic `content` (the parseName `block` is NOT its storage name).
	const distinctStorageKinds = [
		...new Set(
			slot.values
				.filter((v) => v.kind === 'node-ref')
				.map((v) => {
					const node = (v as NodeRef).node;
					return isUnresolvedRef(node) ? node.name : node.kind;
				})
		)
	];
	// A value with no parseKind is a literal / anonymous token (e.g.
	// splat_pattern's `_`). Its presence means the slot is NOT a single named
	// kind, so storageName falls back to the generic `content` — even when
	// exactly one NAMED storage kind is present. Without this guard a 2-value
	// slot (named ref + literal) is mis-read as single-kind and named after the
	// lone ref (`splat_pattern.content` → `identifier`).
	const hasUnnamedValue =
		slot.fieldName === undefined && slot.values.some((v) => v.parseKind?.name === undefined);
	const storageName =
		slot.fieldName ??
		(distinctStorageKinds.length === 1 && !hasUnnamedValue
			? distinctStorageKinds[0]!.replace(/^_+/, '') || distinctStorageKinds[0]!
			: 'content');
	const configKey = snakeToCamel(storageName);
	const isMulti = slot.values.some((v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray');
	const propertyName = isMulti ? pluralize(configKey) : configKey;
	return { storageName, name: storageName, configKey, propertyName, paramName: safeParamName(propertyName), parseNames };
}

// --- Concrete classes per model type ---

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
		case 'alias':
		case 'indent':
		case 'dedent':
		case 'newline':
			return false;
		case 'field':
		case 'variant':
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
export function translateToJinja(tmpl: string, meta: JinjaTranslateMeta): string {
	const guarded = wrapOptionalFieldPlaceholders(tmpl, meta.optionalFields);
	const varPattern = /(\$\$\$|\$\$|\$_|\$)([A-Z][A-Z0-9_]*)/g;
	const defaultSep = meta.joinBy ?? ' ';
	const translated = guarded.replace(varPattern, (_full, pfx: string, name: string) => {
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
	});
	const postProcessed = meta.optionalChildren ? absorbFlankingChildrenSpaces(translated) : translated;
	const headSpacingNormalized = absorbHeadConditionalLeadingSpace(absorbHeadConditionalTrailingSpace(postProcessed));
	return escapeJinjaBraceCollisions(headSpacingNormalized);
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
		work = work.slice(0, runStart) + replacement + work.slice(runStart + m[0].length);
		runStart += replacement.length;
	}
	return work;
}

function absorbHeadConditionalLeadingSpace(tmpl: string): string {
	let work = tmpl;
	let runStart = 0;
	const commentMatch = work.match(/^\{#-?[^#]*-?#\}/);
	if (commentMatch) runStart = commentMatch[0].length;
	const condFull = /^(\{%-? if [^%]+-?%\})(.*?)(\{%-? endif -?%\})/s;
	const parts: Array<{ ifTag: string; body: string; endTag: string }> = [];
	let cursor = runStart;
	while (true) {
		const head = work.slice(cursor);
		const m = head.match(condFull);
		if (!m) break;
		const ifTag = m[1]!;
		const body = m[2]!;
		const endTag = m[3]!;
		if (body.includes('{% if') || body.includes('{%- if')) break;
		parts.push({ ifTag, body, endTag });
		cursor += m[0].length;
	}
	if (parts.length === 0) return work;
	for (let index = 0; index < parts.length; index++) {
		const part = parts[index]!;
		const leading = part.body.match(/^ +/)?.[0];
		if (!leading) continue;
		part.body = part.body.slice(leading.length);
		if (index === 0) continue;
		const previous = parts[index - 1]!;
		if (!/\s$/.test(previous.body)) previous.body += leading;
	}
	const replacement = parts.map(({ ifTag, body, endTag }) => `${ifTag}${body}${endTag}`).join('');
	return work.slice(0, runStart) + replacement + work.slice(cursor);
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
function wrapOptionalFieldPlaceholders(tmpl: string, optionalFields: ReadonlySet<string> | undefined): string {
	if (!optionalFields || optionalFields.size === 0) return tmpl;
	// Match either `$NAME` (single dollar) or `$$$NAME` (list dollar).
	// The capture distinguishes the two so the replacement preserves
	// the dollar count.
	const placeholder = /(?<lead> *)(\$\$\$|\$)([A-Z][A-Z0-9_]*)/g;
	const guardedRanges = computeGuardedRanges(tmpl);
	return tmpl.replace(placeholder, (full: string, lead: string, dollars: string, name: string, offset: number) => {
		const key = name.toLowerCase();
		if (!optionalFields.has(key)) return full;
		// Special walker placeholders (`$NEWLINE`, `$INDENT`, `$DEDENT`,
		// `$TEXT`) aren't real fields — `translateToJinja` converts them
		// to literal characters or list joins. Even if a `newline` /
		// `indent` / etc. field exists in the AssembledNonterminal list
		// (e.g. python's decorator carries an empty-values `newline`
		// slot from the walker's NEWLINE token wrapping), the placeholder
		// is already structural and must not be gated.
		//
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
	});
}

const SPECIAL_PLACEHOLDERS: ReadonlySet<string> = new Set(['children', 'newline', 'indent', 'dedent', 'text']);

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

function isWithinGuardedRange(offset: number, ranges: ReadonlyArray<readonly [number, number]>): boolean {
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
function deriveOptionalSlotNames(slots: readonly { name: string; values: readonly NodeOrTerminal[] }[]): Set<string> {
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

function deriveOptionalFieldNames(fields: readonly AssembledNonterminal[]): Set<string> {
	return deriveOptionalSlotNames(fields);
}

/** @internal — repeated slots that already carry literal members must concatenate directly. */
export function applySelfDelimitedJoinOverrides(
	joinByField: Record<string, string>,
	slots: readonly AssembledNonterminal[]
): void {
	for (const slot of slots) {
		if (!isMultiple(slot)) continue;
		if (!slot.values.some((value) => value.kind === 'terminal')) continue;
		joinByField[slot.name] = '';
	}
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
 * Fold singular slots whose every parseKind is already covered by a sibling
 * ARRAY slot into that array slot, then drop the singular slot.
 *
 * Background: `alias($.last_match_arm, $.match_arm)` causes `deriveValuesForRule`
 * to produce a `symbol{name:'match_arm', aliasedFrom:'last_match_arm'}` value.
 * `projectSlotNaming` derives `storageName='last_match_arm'` (from the aliasedFrom
 * side), creating a SEPARATE singular slot with `parseKind='match_arm'` — colliding
 * with the existing array `match_arm` slot. At parse time every node appears as
 * `match_arm`; there is no `last_match_arm` kind in the CST. The array slot already
 * covers all of them. The singular slot is spurious and causes the native reader to
 * route ALL match_arm nodes into the singular slot ("received N values; got array").
 *
 * The fix: if a singular (arity='one') unnamed slot's EVERY value has a `parseKind`
 * that is ALSO present in a sibling array (arity='many') unnamed slot, merge the
 * singular slot's values into the array slot and drop the singular slot. Uses
 * `parseKind` as the routing key — the single source of truth for CST dispatch.
 */
function foldParseKindDuplicateSingularSlots(slots: readonly AssembledNonterminal[]): AssembledNonterminal[] {
	// Build a map from parseKind → array slot(s) that already cover it.
	const arrayParseKinds = new Set<string>();
	for (const slot of slots) {
		if (slot.arity !== 'many' || slot.fieldName !== undefined) continue;
		for (const v of slot.values) {
			const pk = v.parseKind?.name;
			if (pk !== undefined) arrayParseKinds.add(pk);
		}
	}
	if (arrayParseKinds.size === 0) return [...slots];

	const out: AssembledNonterminal[] = [];
	const toMergeIntoArraySlot = new Map<string, NodeOrTerminal[]>(); // arraySlotName → values

	for (const slot of slots) {
		// Only consider unnamed singular slots as candidates for folding.
		if (slot.arity !== 'one' || slot.fieldName !== undefined || slot.values.length === 0) {
			out.push(slot);
			continue;
		}
		// A singular slot is foldable when ALL its parseKinds are covered by an array slot.
		const allCovered = slot.values.every((v) => {
			const pk = v.parseKind?.name;
			return pk !== undefined && arrayParseKinds.has(pk);
		});
		if (!allCovered) {
			out.push(slot);
			continue;
		}
		// Find the array slot that covers this slot's first parseKind.
		const pk0 = slot.values[0]?.parseKind?.name;
		if (pk0 === undefined) { out.push(slot); continue; }
		// Drop this slot — values are already covered by the array slot.
		// Nothing to merge since the parseKinds are identical and the array
		// slot already accepts them at the native reader level.
		void pk0;
		// Intentionally not pushing to out — this slot is folded away.
		void toMergeIntoArraySlot; // suppress unused-var lint: map is populated below if needed
	}
	return out;
}

/**
 * Augment an unnamed slot's values with the concrete parse-surface children
 * of any visible rules aliased TO the owning kind via a visible→visible alias.
 *
 * Example: `token_tree.content` slot has parseKinds `{token_tree_paren, ...}`.
 * `visibleAliasTargets` contains `token_tree → [delim_token_tree]`. The
 * `delim_token_tree` rule's simplified form has children `delim_token_tree_paren/
 * bracket/brace`. This function adds those as additional values so the wrap
 * accept-set covers macro invocations where the `token_tree` field holds a
 * `delim_token_tree_*` node.
 *
 * The lookup key is the OWNING KIND name (e.g. `token_tree`), not a slot value's
 * parseKind. When `owningKind` appears as a target in `visibleAliasTargets`, each
 * listed source kind's simplified rule is expanded into values and added to the
 * slot's value set (deduped by parseKind).
 *
 * Only runs for UNNAMED slots (kind-named routing, not field-name routing).
 * Named (field-named) slots route by field name at the CST level; the native reader
 * uses field names, not kind IDs, for those — no expansion needed.
 */
function expandSlotWithVisibleAliasSources(
	slot: AssembledNonterminal,
	owningKind: string,
	visibleAliasTargets: ReadonlyMap<string, readonly string[]>,
	simplifiedRules: Record<string, Rule>,
	kindEntries?: readonly GeneratedKindEntry[]
): AssembledNonterminal {
	// Only expand unnamed (kind-routed) slots.
	if (slot.fieldName !== undefined) return slot;

	// Look up the owning kind as a VISIBLE ALIAS TARGET.
	// `token_tree → [delim_token_tree]` means `delim_token_tree` is aliased TO `token_tree`.
	// We need to derive the concrete children of each source kind and add them as extra values.
	const sources = visibleAliasTargets.get(owningKind);
	if (!sources || sources.length === 0) return slot;

	// Use the dominant multiplicity of this slot's values for the expansion.
	const dominantMult = slot.values.reduce<Multiplicity>(
		(acc, v) => {
			if (v.multiplicity === 'nonEmptyArray' || v.multiplicity === 'array') return v.multiplicity;
			if (acc === 'single' && v.multiplicity === 'optional') return 'optional';
			return acc;
		},
		'single'
	);

	const extraValues: NodeOrTerminal[] = [];
	for (const sourceKind of sources) {
		const sourceRule = simplifiedRules[sourceKind];
		if (!sourceRule) continue;
		// Only expand when the source kind's rule is a top-level CHOICE or
		// a sequence of wrappers around a choice — i.e., the source kind IS
		// itself a choice of sub-kinds (like `delim_token_tree` which is a
		// choice of `delim_token_tree_paren/bracket/brace`). SEQ-bodied kinds
		// (like `last_match_arm`) are NOT expanded here — their alias relationship
		// is handled by the `foldParseKindDuplicateSingularSlots` pass instead.
		// This prevents spuriously injecting all of `last_match_arm`'s fields
		// (attributes, pattern, body) into `match_arm.content`.
		const unwrappedSource = unwrapStructuralPassthroughs(sourceRule);
		if (unwrappedSource.type !== 'choice') continue;
		// Derive values from the source kind's simplified rule.
		const derived = deriveValuesForRule(sourceRule, dominantMult, kindEntries);
		for (const d of derived) {
			const dpk = d.parseKind?.name;
			if (dpk === undefined) continue;
			// Only add if this parseKind is not already present.
			const alreadyPresent =
				slot.values.some((existing) => existing.parseKind?.name === dpk) ||
				extraValues.some((existing) => existing.parseKind?.name === dpk);
			if (!alreadyPresent) extraValues.push(d);
		}
	}
	if (extraValues.length === 0) return slot;

	return slot.with({ values: dedupeValues([...slot.values, ...extraValues]) });
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
	rule: Rule,
	renderRule?: RenderRule,
	kindEntries?: readonly GeneratedKindEntry[],
	parseKindCollisionContext?: ParseKindCollisionContext,
	visibleAliasTargets?: ReadonlyMap<string, readonly string[]>,
	simplifiedRules?: Record<string, Rule>
): Readonly<Record<string, AssembledNonterminal>> {
	const slots = [...deriveSlots(rule, kindEntries, kind)];
	if (renderRule) {
		for (const renderSlot of deriveSlots(renderRule, kindEntries, kind)) {
			const existing = slots.find((slot) => slot.name === renderSlot.name);
			if (!existing) continue;
			const next = existing.with({
				sourceRuleIds: mergeSourceRuleIds(existing.sourceRuleIds, renderSlot.sourceRuleIds),
			});
			slots.splice(slots.indexOf(existing), 1, next);
		}
	}
	let resolvedSlots = resolveParseKindCollisions(kind, slots, parseKindCollisionContext);

	// Fold singular slots whose every parseKind is already covered by a sibling
	// array slot into that array slot. This handles the visible→visible alias case
	// where `alias($.last_match_arm, $.match_arm)` mints a separate `last_match_arm`
	// singular slot with parseKind `match_arm` — identical to the existing array slot.
	// At parse time there IS no `last_match_arm` kind; all nodes appear as `match_arm`.
	// Keeping a separate singular slot causes the native reader to route ALL match_arm
	// nodes (including the repeated ones) into it → "received N values; got array".
	resolvedSlots = foldParseKindDuplicateSingularSlots(resolvedSlots);

	// Augment slot values with the concrete parse-surface children of any visible
	// rule aliased TO the owning kind. Example: `alias($.delim_token_tree, $.token_tree)`
	// means the `token_tree.content` slot must also accept `delim_token_tree_paren/
	// bracket/brace` parseKinds, which are the concrete children that the native reader
	// delivers when a macro_invocation's `token_tree` field holds a delim_token_tree.
	if (visibleAliasTargets && simplifiedRules) {
		resolvedSlots = resolvedSlots.map((slot) =>
			expandSlotWithVisibleAliasSources(slot, kind, visibleAliasTargets, simplifiedRules, kindEntries)
		);
	}

	const out: Record<string, AssembledNonterminal> = {};
	for (const slot of resolvedSlots) {
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
				const mult = s.values.length > 0 ? s.values[0]!.multiplicity : 'single';
				return `    ${s.name} (source: ${s.source}, multiplicity: ${mult}, values: [${kinds.join(', ')}])`;
			});
			recordAssembleWarning({
				code: 'storagename-collision',
				message:
					`[assemble] storageName collision: kind '${kind}' has ${slots.length} slots ` +
					`with storageName '${storageName}':\n${details.join('\n')}`,
				ownerKind: kind,
				details: { storageName, slotCount: slots.length }
			});
		}
	}

	return Object.freeze(out);
}

function freezeSlotRecord(slots: readonly AssembledNonterminal[]): Readonly<Record<string, AssembledNonterminal>> {
	const out: Record<string, AssembledNonterminal> = {};
	for (const slot of slots) {
		out[slot.name] = slot;
	}
	return Object.freeze(out);
}

/**
 * Relax a multiplicity so a slot that is ABSENT in some polymorph forms is
 * not over-asserted as always-present: `single` → `optional`, `nonEmptyArray`
 * → `array`. Used by polymorph cross-form slot merging
 * (`structuralSlotRecordFromForms`).
 */
function relaxMultiplicityForCrossFormAbsence(multiplicity: Multiplicity): Multiplicity {
	switch (multiplicity) {
		case 'single':
			return 'optional';
		case 'nonEmptyArray':
			return 'array';
		case 'optional':
		case 'array':
			return multiplicity;
		default:
			return assertNever(multiplicity);
	}
}

function relaxSlotForCrossFormAbsence(slot: AssembledNonterminal): AssembledNonterminal {
	return slot.with({
		values: dedupeValues(
			slot.values.map((value) => ({
				...value,
				multiplicity: relaxMultiplicityForCrossFormAbsence(value.multiplicity)
			}))
		)
	});
}

function structuralSlotRecordFromForms(
	forms: readonly AssembledGroup[],
	ownerKind?: string,
	parseKindCollisionContext?: ParseKindCollisionContext
): Readonly<Record<string, AssembledNonterminal>> {
	const slots = new Map<string, AssembledNonterminal>();
	const slotPresence = new Map<string, number>();
	for (const form of forms) {
		for (const slot of Object.values(form.slots)) {
			slotPresence.set(slot.name, (slotPresence.get(slot.name) ?? 0) + 1);
			const existing = slots.get(slot.name);
			if (!existing) {
				slots.set(slot.name, slot);
				continue;
			}
			slots.set(slot.name, existing.with({
				values: dedupeValues([...existing.values, ...slot.values]),
				hasTrailing: existing.hasTrailing || slot.hasTrailing,
				hasLeading: existing.hasLeading || slot.hasLeading,
				sourceRuleIds: mergeSourceRuleIds(existing.sourceRuleIds, slot.sourceRuleIds),
			}));
		}
	}
	const relaxedSlots = [...slots.values()].map((slot) =>
		(slotPresence.get(slot.name) ?? 0) < forms.length ? relaxSlotForCrossFormAbsence(slot) : slot
	);
	const resolvedSlots =
		ownerKind === undefined
			? relaxedSlots
			: resolveParseKindCollisions(ownerKind, relaxedSlots, parseKindCollisionContext);
	return freezeSlotRecord(resolvedSlots);
}

/**
 * Determine whether a single slot is auto-stamp-eligible for the purposes
 * of the `parameterless` getter on compounds (AssembledBranch / AssembledGroup).
 *
 * This replicates the `isAutoStampSlot` predicate from the former
 * `markParameterlessKinds` fixpoint pass, but reads `node.parameterless`
 * recursively instead of consulting a pre-computed stored field.
 *
 * Eligibility rules (all must hold for required slots; optional is always OK):
 * - Optional slots never block parameterless.
 * - Required repeated (multiple) slots are never auto-stamp-eligible.
 * - Must have exactly one value.
 * - That value is either a TerminalValue OR a NodeRef pointing to a
 *   node whose own `parameterless` getter returns true (the cascade).
 *
 * @param nodes - The assembled node map, used to resolve UnresolvedRef by name
 *   before hydration. When provided, an unresolved ref is looked up by name and
 *   its `.parameterless` getter consulted (replicating the old fixpoint's name
 *   lookup). When absent (test fixtures), unresolved refs conservatively return
 *   false. No `_<name>` hidden-source fallback — the old fixpoint had none.
 */
function _isAutoStampSlotForParameterless(
	slot: AssembledNonterminal,
	nodes?: ReadonlyMap<string, AssembledNodeBase<Rule>>
): boolean {
	if (!isRequired(slot)) return true; // optional — does not block
	if (isMultiple(slot)) return false; // required repeated — user must supply

	if (slot.values.length !== 1) return false;
	const v = slot.values[0]!;

	if (isTerminalValue(v)) return true;

	if (isNodeRef(v)) {
		if (isUnresolvedRef(v.node)) {
			// Pre-hydration path: resolve by name via the node map, exactly
			// as the former markParameterlessKinds fixpoint did.
			if (!nodes) return false; // no map available (test fixture) — conservative false
			const target = nodes.get(v.node.name);
			if (!target) return false; // unknown kind — conservative false
			return target.parameterless; // cascade: recurse into child node
		}
		return v.node.parameterless; // cascade: recurse into child node
	}

	return false;
}

export class AssembledBranch<
	R extends SeqRule | ChoiceRule | RepeatRule | Repeat1Rule =
		| SeqRule
		| ChoiceRule
		| RepeatRule
		| Repeat1Rule
> extends AssembledNodeBase<R> {
	readonly modelType = 'branch' as const;
	// rule narrowed to SeqRule | ChoiceRule | RepeatRule | Repeat1Rule —
	// branches classify from compositional rules that carry fields and/or
	// ordered children. The prior `AssembledContainer` class was absorbed —
	// repeat / repeat1 shapes (no `field()` on the rule) now route here too.
	// Emitter behavior should key off `slotClass` / slot facts rather than a
	// separate branch-global shape discriminator.
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
	 * Wrapper-deleted view of the rule, sourced from
	 * `optimized.renderRules[kind]` at assemble time. Optional / field /
	 * repeat / repeat1 wrappers are pushed down to leaf attributes;
	 * structural rules (seq / choice / variant / group / polymorph) are
	 * preserved. Populated alongside `simplifiedRule`; consumed by PR1
	 * Task 2.A5 and later passes that operate on the wrapper-less shape.
	 */
	readonly renderRule: RenderRule;
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

	constructor(
		kind: string,
		rule: R,
		simplifiedRule: Rule,
		renderRule: RenderRule,
		opts?: {
			factoryName?: string;
			irKey?: string;
			source?: RuleSource;
			variantChildKinds?: readonly string[];
			kindEntries?: readonly GeneratedKindEntry[];
			parseKindCollisionContext?: ParseKindCollisionContext;
			slotRecord?: Readonly<Record<string, AssembledNonterminal>>;
			visibleAliasTargets?: ReadonlyMap<string, readonly string[]>;
			simplifiedRules?: Record<string, Rule>;
		}
	) {
		super(kind, rule, opts);
		this.simplifiedRule = simplifiedRule;
		this.renderRule = renderRule;
		this.variantChildKinds = opts?.variantChildKinds ?? [];
		this._slots =
			opts?.slotRecord ??
			buildSlotsRecord(kind, simplifiedRule, renderRule, opts?.kindEntries, opts?.parseKindCollisionContext, opts?.visibleAliasTargets, opts?.simplifiedRules);
	}

	get slots(): Readonly<Record<string, AssembledNonterminal>> {
		return this._slots;
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

	// Cycle guard for the parameterless getter. Breaks re-entrant calls
	// (cyclic slot graphs) conservatively, replicating LFP-from-false semantics.
	// No memoization — results must not be cached pre-hydration (before
	// hydrateSlotRefs runs, slot values are UnresolvedRef and would produce a
	// false-negative that would be incorrectly cached for the post-hydration call).
	#computing = false;

	// Node map back-reference for pre-hydration UnresolvedRef resolution in the
	// parameterless getter. Attached by assemble() after all nodes are constructed
	// (via attachNodeMap). Not set in test fixtures — those resolve false.
	// Private to prevent serialization walks from descending into the whole map.
	#nodes: ReadonlyMap<string, AssembledNodeBase<Rule>> | undefined = undefined;

	/**
	 * Attach the assembled node map so the `parameterless` getter can resolve
	 * UnresolvedRef slots by name before `hydrateSlotRefs` runs. Called by
	 * assemble() after all nodes are populated. Safe to call multiple times
	 * (idempotent for the same map reference).
	 */
	attachNodeMap(nodes: ReadonlyMap<string, AssembledNodeBase<Rule>>): void {
		this.#nodes = nodes;
	}

	/**
	 * Recursive, cascade-preserving parameterless check. Replicates the
	 * former `markParameterlessKinds` fixpoint semantics as a structural
	 * getter:
	 *
	 * - At least one required slot must exist (no "vacuous" parameterless).
	 * - Every slot must be auto-stamp-eligible (optional, or single-value
	 *   terminal, or single-value ref to a parameterless child).
	 * - The node must have a `rawFactoryName` (hidden nodes can't be stamped).
	 * - Cycle guard: re-entrant calls return `false` (LFP-from-false semantics).
	 *
	 * Not memoized: slot refs are UnresolvedRef until `hydrateSlotRefs` runs;
	 * caching before hydration would lock in a spurious `false`.
	 */
	override get parameterless(): boolean {
		if (this.#computing) return false; // cycle — conservative false
		this.#computing = true;
		try {
			return this.#computeParameterless();
		} finally {
			this.#computing = false;
		}
	}

	#computeParameterless(): boolean {
		if (!this.rawFactoryName) return false; // hidden nodes have no factory
		const allSlots = Object.values(this._slots);
		const requiredSlots = allSlots.filter((s) => isRequired(s));
		if (requiredSlots.length === 0) return false; // no determined content — not parameterless
		return allSlots.every((s) => _isAutoStampSlotForParameterless(s, this.#nodes));
	}

	/**
	 * Compound stamp: factory call with no arguments, e.g. `"breakExpression()"`.
	 * Only defined when `parameterless` is true.
	 */
	override get stampExpression(): string | undefined {
		const fn = this.rawFactoryName;
		return this.parameterless && fn ? `${fn}()` : undefined;
	}

	/**
	 * All slots — both field-named (origin='field') and kind-named (origin='kind').
	 * After unified-slot refactor (spec 2026-05-17): every slot has a name and
	 * `_<name>` storage key regardless of whether the name came from a `field()`
	 * wrapper or the content kind. Consumers should NOT branch on origin — they
	 * are all just slots.
	 */
	get fields(): readonly AssembledNonterminal[] {
		return Object.values(this.slots);
	}

	/**
	 * Retired post-unification — no longer a separate slot category.
	 * Kept as empty-returning getter for back-compat with un-migrated callers.
	 */
	get children(): readonly AssembledNonterminal[] {
		return [];
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
function isExternalTerminalMember(rule: Rule, externals: ReadonlySet<string>): boolean {
	const core = unwrapStructuralPassthroughs(rule);
	if (core.type === 'field') {
		const inner = unwrapStructuralPassthroughs(core.content);
		if (inner.type === 'pattern' && inner.value === '' && (externals.has(core.name) || externals.has('_' + core.name)))
			return true;
		return isExternalTerminalMember(core.content, externals);
	}
	return core.type === 'symbol' && externals.has(core.name);
}

function hasHiddenExternalRef(rule: Rule, externals: ReadonlySet<string>): boolean {
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
		return inner.type === 'symbol' && externals.has((inner as { name: string }).name);
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
	// All non-ignorable members are external terminals.
	// If every one is a named field-wrapper (not a bare symbol), they can be
	// rendered structurally by field name (e.g. raw_string_literal:
	// field(start) + field(content) + field(end)).  Bare-symbol externals
	// have no slot name and must fall back to $TEXT — these are excluded here
	// so that python's `string` (boundary-only externals) is unaffected.
	const nonIgnorable = core.members.filter((m) => !isIgnorableBoundaryExternal(m));
	if (
		nonIgnorable.length > 0 &&
		nonIgnorable.every((m) => {
			const fw = unwrapStructuralPassthroughs(m);
			if (fw.type !== 'field') return false;
			const inner = unwrapStructuralPassthroughs(fw.content);
			// After assembly, external scanner tokens are replaced with
			// pattern("") stubs. Every member that reaches this point has
			// already passed isExternalTerminalMember (the main loop above),
			// so a pattern("") stub here is confirmed to be from the external
			// scanner. The field wrapper provides a slot name that the walker
			// can bind — accept it regardless of whether the external symbol
			// name is underscore-prefixed. This is the case the relaxation
			// block was designed for (e.g. raw_string_literal: all three
			// fields wrap external stubs and CAN be rendered by field name).
			if (inner.type === 'pattern' && inner.value === '') {
				return true;
			}
			// Pre-assembly path: symbol reference with underscore prefix.
			// Reject only when the symbol is NOT in externals — those are
			// hidden helper rules with real bodies that don't have a slot name
			// to bind. Underscore-prefixed externals (the raw_string_literal
			// pattern) ARE accepted because the field provides a slot name
			// even though the inner external is anonymous in tree-sitter's
			// output.
			if (inner.type !== 'symbol') return true;
			if (!inner.name.startsWith('_')) return true;
			return externals.has(inner.name);
		})
	) {
		return false;
	}
	return hasContent;
}

/**
 * Rule-level boundary check — first and last non-ignorable seq members
 * are external-scanner symbols. Fires for rules like python's `string`
 * where scanner tokens delimit but the interior is author-content.
 */
function hasExternalBoundaries(seqRule: Rule, externals: ReadonlySet<string>): boolean {
	if (seqRule.type !== 'seq') return false;
	if (seqRule.members.length < 2) return false;
	const first = seqRule.members[0];
	const last = seqRule.members[seqRule.members.length - 1];
	if (!first || !last) return false;
	return isExternalTerminalMember(first, externals) && isExternalTerminalMember(last, externals);
}

/**
 * AssembledPolymorph — dead-class shell retained for import-compat after PR-M-φ2.
 *
 * No grammar rule ever produces `modelType:'polymorph'` at runtime — the
 * PolymorphRule IR type was removed. Every `instanceof AssembledPolymorph` or
 * `node.modelType === 'polymorph'` branch in emitter code is unreachable dead
 * code. This class exists only so those import sites compile without changes;
 * they will be purged in PR-I.
 *
 * The `@ts-expect-error TS2416` suppression that previously appeared on the
 * `modelType` override (the Codex P1) is resolved here: the override is gone
 * entirely — `modelType` is inherited as `'branch'` from `AssembledBranch`.
 * Callers comparing `node.modelType === 'polymorph'` will simply never match.
 */
export class AssembledPolymorph extends AssembledBranch<ChoiceRule> {
	// No modelType override — inherits 'branch' from AssembledBranch.
	// Resolves the P1 @ts-expect-error TS2416 that existed in the old class.
	override readonly source: 'promoted' | 'override';
	readonly #forms: AssembledGroup[];

	constructor(
		kind: string,
		rule: ChoiceRule,
		forms: AssembledGroup[],
		opts?: {
			source?: 'promoted' | 'override';
			variantChildKinds?: readonly string[];
			factoryName?: string;
			irKey?: string;
			parseKindCollisionContext?: ParseKindCollisionContext;
		}
	) {
		const slotRecord = structuralSlotRecordFromForms(forms, kind, opts?.parseKindCollisionContext);
		super(kind, rule, rule as Rule, rule as RenderRule, {
			factoryName: opts?.factoryName,
			irKey: opts?.irKey,
			variantChildKinds: opts?.variantChildKinds,
			slotRecord
		});
		this.#forms = forms;
		this.source = opts?.source ?? 'promoted';
	}

	get forms(): AssembledGroup[] { return this.#forms; }
	/** Always empty — no PolymorphForm IR type exists anymore. */
	get formRules(): readonly never[] { return []; }
	get allFormFields(): readonly AssembledNonterminal[] { return this.#forms.flatMap((f) => f.fields); }
	get structuralFields(): readonly AssembledNonterminal[] { return this.fields; }
	get structuralSlots(): readonly AssembledNonterminal[] { return Object.values(this.slots); }
	override get fields(): readonly AssembledNonterminal[] { return Object.values(this.slots); }
	override get children(): readonly AssembledNonterminal[] { return []; }
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
export class AssembledPattern extends AssembledLeaf<PatternRule | TerminalRule> {
	readonly modelType = 'pattern' as const;

	constructor(kind: string, rule: PatternRule | TerminalRule, opts?: { factoryName?: string; irKey?: string }) {
		super(kind, rule, opts);
	}

	/** The leaf's regex pattern value when the rule is a PatternRule; undefined for TerminalRule. */
	get pattern(): string | undefined {
		return this.rule.type === 'pattern' ? this.rule.value || undefined : undefined;
	}

	/**
	 * When this pattern's sole realisation is a single fixed anonymous literal
	 * (e.g. `_semicolon` = `terminal(choice(_automatic_semicolon, ";"))` where
	 * every non-blank, non-symbol leaf collapses to the same string), returns
	 * that string so callers can treat this like a keyword/token for transport
	 * deserialisation. Returns `undefined` for content-bearing patterns
	 * (`identifier`, `number`, external scanner symbols, etc.).
	 *
	 * Used by the node-model emitter to attach a `text` field to the
	 * serialized pattern entry, which `leafDefaultTextLiteral` (render-module)
	 * then picks up to enable the existing u16 acceptance branch in the
	 * generated `FromNapiValue` impls.
	 */
	get fixedLiteralText(): string | undefined {
		if (this.rule.type === 'pattern') return undefined; // regex — always content-bearing
		// TerminalRule: walk the content tree collecting all non-blank string leaves.
		return collectFixedLiteral(this.rule.content);
	}
}

/**
 * Walk a rule subtree collecting leaf `string` values.
 * Returns the single distinct string if every non-blank reachable leaf is
 * the same fixed literal, or `undefined` the moment any content-bearing
 * external (symbol) or multi-value divergence is encountered.
 *
 * Blanks (empty `choice` / `seq`) are skipped — they contribute no text and
 * represent the "omit" arm of an `optional`.
 */
function collectFixedLiteral(rule: Rule): string | undefined {
	switch (rule.type) {
		case 'string':
			return rule.value || undefined;
		case 'optional':
			// optional(X): the blank arm contributes nothing; X may yield a fixed literal
			return collectFixedLiteral(rule.content);
		case 'choice': {
			if (rule.members.length === 0) return undefined; // blank sentinel
			let found: string | undefined;
			for (const m of rule.members) {
				const isBlank =
					(m.type === 'choice' && m.members.length === 0) ||
					(m.type === 'seq' && m.members.length === 0);
				if (isBlank) continue; // blank arm — ignore
				const v = collectFixedLiteral(m);
				if (v === undefined) return undefined; // non-literal or divergent branch
				if (found === undefined) found = v;
				else if (found !== v) return undefined; // two different literals
			}
			return found;
		}
		case 'seq': {
			if (rule.members.length === 0) return undefined; // blank sentinel
			// A seq of a single non-blank member is safe; multi-member seqs are not
			// fixed single literals (they'd produce concatenated output).
			const nonBlanks = rule.members.filter(
				m =>
					!((m.type === 'choice' && m.members.length === 0) ||
					  (m.type === 'seq' && m.members.length === 0))
			);
			if (nonBlanks.length !== 1) return undefined;
			const [only] = nonBlanks;
			if (!only) return undefined;
			return collectFixedLiteral(only);
		}
		case 'token':
			// token(X) wrapper — recurse into content
			return collectFixedLiteral((rule as { content: Rule }).content);
		case 'terminal':
			// nested terminal — recurse
			return collectFixedLiteral((rule as TerminalRule).content);
		default:
			// symbol, alias, pattern, field, repeat, etc. — content-bearing or structural
			return undefined;
	}
}

export class AssembledKeyword extends AssembledLeaf<StringRule> {
	readonly modelType = 'keyword' as const;
	readonly resolvedKind?: string;

	constructor(
		kind: string,
		rule: StringRule,
		opts?: {
			factoryName?: string;
			irKey?: string;
			hidden?: boolean;
			kindEntries?: readonly GeneratedKindEntry[];
		}
	) {
		super(kind, rule, opts);
		this.resolvedKind = findGeneratedKindEntry(opts?.kindEntries ?? [], rule.value)?.kind;
	}

	/** The literal text this keyword produces (read from the StringRule). */
	get text(): string {
		return this.rule.value;
	}

	/** Keywords are always parameterless — they produce a fixed single text value. */
	override get parameterless(): boolean {
		return true;
	}

	/** Field-context stamp: JSON literal with `as const`. */
	override get stampExpression(): string {
		return `${JSON.stringify(this.rule.value)} as const`;
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
	readonly resolvedKind?: string;

	constructor(kind: string, rule: StringRule | TokenRule, opts?: { kindEntries?: readonly GeneratedKindEntry[] }) {
		super(kind, rule, { hidden: true });
		this.resolvedKind =
			rule.type === 'string' ? findGeneratedKindEntry(opts?.kindEntries ?? [], rule.value)?.kind : undefined;
	}
	// No emitFactory — tokens are always hidden, no factoryName.

	/**
	 * Single-literal tokens (StringRule) are parameterless — they stamp to
	 * the literal (as const) the same way keywords do. Pattern-based tokens
	 * (TokenRule) carry no single user-visible string and stay
	 * non-parameterless.
	 */
	override get parameterless(): boolean {
		return this.rule.type === 'string';
	}

	/**
	 * Field-context stamp: JSON literal with `as const`.
	 * Only defined when the rule is a string (parameterless case).
	 */
	override get stampExpression(): string | undefined {
		if (this.rule.type !== 'string') return undefined;
		return `${JSON.stringify(this.rule.value)} as const`;
	}

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
	 * True when the underlying rule is a `token.immediate(...)` wrapper
	 * (tree-sitter `IMMEDIATE_TOKEN`). Render contexts use this to emit
	 * the literal adjacent to the preceding token. Plain string-rule
	 * tokens and non-immediate `token(...)` wrappers return false.
	 *
	 * NOTE: distinct from the `modelType === 'token'` classification —
	 * an `AssembledToken` exists for every classified token kind whether
	 * or not its rule was wrapped in a `TokenRule`. This getter reports
	 * the wrapper status, not the model classification.
	 */
	get immediate(): boolean {
		return this.rule.type === 'token' && this.rule.immediate;
	}

	/**
	 * True when the underlying rule is wrapped in a `TokenRule` (either
	 * `token(...)` or `token.immediate(...)`). Used to distinguish bare
	 * string tokens from lexer-hint tokens (e.g. rust's `TOKEN(prec(1,
	 * '<'))` in `type_arguments`). See {@link immediate} for the
	 * adjacency-specific flag.
	 */
	get tokenized(): boolean {
		return this.rule.type === 'token';
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
	readonly resolvedKinds: readonly string[];

	constructor(
		kind: string,
		rule: EnumRule,
		opts?: {
			factoryName?: string;
			irKey?: string;
			kindEntries?: readonly GeneratedKindEntry[];
		}
	) {
		super(kind, rule, opts);
		this.resolvedKinds = rule.members
			.map((member) => findGeneratedKindEntry(opts?.kindEntries ?? [], member.value)?.kind)
			.filter((member): member is string => member !== undefined);
		if (this.values.length < 2) {
			throw new Error(
				`AssembledEnum '${kind}' must have at least two members; normalize single-literal sets upstream to StringRule`
			);
		}
	}

	/** The enum member strings (e.g. `['u8', 'u16', 'usize']`). */
	get values(): string[] {
		return this.rule.members.map((m) => m.value);
	}
}

export class AssembledSupertype extends AssembledNodeBase<SupertypeRule | ChoiceRule> {
	readonly modelType = 'supertype' as const;
	// #subtypes stores the RESOLVED subtype list (hidden names expanded to
	// their concrete kinds) — this differs from rule.subtypes which carries
	// the raw names as declared in the grammar. Do NOT replace with rule.subtypes.
	readonly #subtypes: string[];

	constructor(kind: string, rule: SupertypeRule | ChoiceRule, subtypes: string[]) {
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
 *   - Inlines the repeat at every referrer (`inlineRefs` extends
 *     to cover `multi` alongside `group`), so the referrer's walker
 *     sees `repeat1(...)` directly and sets `multiple: true` on the
 *     child slot → rest-params factory.
 *
 * Mirrors the existing "hidden helper" story:
 *   group    — hidden seq with fields  (inline fields)
 *   supertype — hidden choice of symbols (dispatch to one subtype)
 *   multi    — hidden repeat of union    (inline as multi child slot)
 */
export class AssembledMulti extends AssembledNodeBase<RepeatRule | Repeat1Rule> {
	readonly modelType = 'multi' as const;
	// rule narrowed — multis are hidden repeat helpers. Classifier
	// routes repeat / repeat1 shapes here when the hidden rule's
	// top-level content is a repeat.

	constructor(kind: string, rule: RepeatRule | Repeat1Rule, opts?: { irKey?: string }) {
		// Multi nodes are always hidden (no factoryName)
		super(kind, rule, { hidden: true, irKey: opts?.irKey });
	}

	/** The repeat's inner content type — raw Rule, for downstream
	 * consumers that need the element union (types emitter maps this
	 * to a union of TypeNames, inlineRefs hands the whole repeat
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
	/** See `AssembledBranch.renderRule`. Sourced from `optimized.renderRules[kind]` at assemble time. */
	readonly renderRule: RenderRule;
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

	constructor(
		kind: string,
		rule: Rule,
		simplifiedRule: Rule,
		renderRule: RenderRule,
		opts?: {
			factoryName?: string;
			irKey?: string;
			detectToken?: string;
			name?: string;
			parentKind?: string;
			overridePassthrough?: boolean;
			kindEntries?: readonly GeneratedKindEntry[];
			parseKindCollisionContext?: ParseKindCollisionContext;
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
		const factoryName = opts?.factoryName ?? (kind.startsWith('_') ? `_${nameNode(kind).factoryName}` : undefined);
		super(kind, rule, { factoryName, irKey: opts?.irKey });
		this.simplifiedRule = simplifiedRule;
		this.renderRule = renderRule;
		this.detectToken = opts?.detectToken;
		this.name = opts?.name ?? kind;
		this.parentKind = opts?.parentKind;
		this.overridePassthrough = opts?.overridePassthrough;
		this.slots = buildSlotsRecord(
			kind,
			simplifiedRule,
			renderRule,
			opts?.kindEntries,
			opts?.parseKindCollisionContext
		);
	}

	// Cycle guard for the parameterless getter. Same rationale as AssembledBranch.
	// No memoization — see AssembledBranch comment.
	#computing = false;

	// Node map back-reference for pre-hydration UnresolvedRef resolution.
	// See AssembledBranch.#nodes for full rationale.
	#nodes: ReadonlyMap<string, AssembledNodeBase<Rule>> | undefined = undefined;

	/**
	 * Attach the assembled node map so the `parameterless` getter can resolve
	 * UnresolvedRef slots by name before `hydrateSlotRefs` runs. See
	 * {@link AssembledBranch.attachNodeMap} for full documentation.
	 */
	attachNodeMap(nodes: ReadonlyMap<string, AssembledNodeBase<Rule>>): void {
		this.#nodes = nodes;
	}

	/**
	 * Recursive, cascade-preserving parameterless check. Same semantics as
	 * `AssembledBranch.parameterless` — see that getter for full documentation.
	 */
	override get parameterless(): boolean {
		if (this.#computing) return false; // cycle — conservative false
		this.#computing = true;
		try {
			return this.#computeParameterless();
		} finally {
			this.#computing = false;
		}
	}

	#computeParameterless(): boolean {
		if (!this.rawFactoryName) return false; // hidden nodes have no factory
		const allSlots = Object.values(this.slots);
		const requiredSlots = allSlots.filter((s) => isRequired(s));
		if (requiredSlots.length === 0) return false; // no determined content — not parameterless
		return allSlots.every((s) => _isAutoStampSlotForParameterless(s, this.#nodes));
	}

	/**
	 * Compound stamp: factory call with no arguments, e.g. `"breakExpression()"`.
	 * Only defined when `parameterless` is true.
	 */
	override get stampExpression(): string | undefined {
		const fn = this.rawFactoryName;
		return this.parameterless && fn ? `${fn}()` : undefined;
	}

	/**
	 * All slots — both field-named (origin='field') and kind-named (origin='kind').
	 * After unified-slot refactor (spec 2026-05-17): all slots have a name and
	 * `_<name>` storage key regardless of slot origin. Consumers should NOT
	 * branch on origin — they are all just slots.
	 */
	get fields(): readonly AssembledNonterminal[] {
		return Object.values(this.slots);
	}

	/**
	 * Retired post-unification — no longer a separate slot category.
	 * Kept as empty-returning getter for back-compat with un-migrated callers.
	 */
	get children(): readonly AssembledNonterminal[] {
		return [];
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
// Branch and Group expose `.fields` / `.children` directly; non-
// structural kinds (leaf/keyword/token/enum/supertype/multi) have no
// structural surface. These helpers narrow over `AssembledNode` and
// give consumers one canonical entry point per fact.

/**
 * Dedup'd structural fields for a node — Branch/Group return their `.fields`;
 * non-structural kinds return `[]`.
 *
 * Use this when emitting types, factories, or anything that asks
 * "what fields does this kind have."
 */
export function structuralFieldsOf(node: AssembledNode): readonly AssembledNonterminal[] {
	if (node.modelType === 'branch' || node.modelType === 'group') return node.fields;
	return [];
}

/**
 * Structural children for a node — Branch/Group return their `.children`;
 * non-structural kinds return `[]`.
 */
export function structuralChildrenOf(node: AssembledNode): readonly AssembledNonterminal[] {
	if (node.modelType === 'branch' || node.modelType === 'group') return node.children;
	return [];
}

/**
 * Raw cross-form flatten of fields — Branch/Group return their `.fields`;
 * non-structural kinds return `[]`.
 *
 * (Previously Polymorph returned per-form fields; no polymorphs exist at runtime.)
 */
export function allFormFieldsOf(node: AssembledNode): readonly AssembledNonterminal[] {
	if (node.modelType === 'branch' || node.modelType === 'group') return node.fields;
	return [];
}

/**
 * Raw cross-form flatten of children — Branch/Group return their `.children`;
 * non-structural kinds return `[]`.
 */
export function allFormChildrenOf(node: AssembledNode): readonly AssembledNonterminal[] {
	if (node.modelType === 'branch' || node.modelType === 'group') return node.children;
	return [];
}

/**
 * Every slot reachable from a node — Branch/Group return all entries of their
 * `.slots`; non-structural kinds return `[]`.
 *
 * Use this when the consumer doesn't care about the field/child distinction
 * (graph traversal, kind reachability, alias-source collection, etc.).
 */
export function allSlotsOf(node: AssembledNode): readonly AssembledNonterminal[] {
	if (node.modelType === 'branch' || node.modelType === 'group') return Object.values(node.slots);
	return [];
}

/**
 * Dedup'd union of every slot — Branch/Group return all entries of their
 * `.slots`; non-structural kinds return `[]`.
 */
export function allStructuralSlotsOf(node: AssembledNode): readonly AssembledNonterminal[] {
	if (node.modelType === 'branch' || node.modelType === 'group')
		return Object.values(node.slots);
	return [];
}
