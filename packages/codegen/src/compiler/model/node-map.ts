/**
 * compiler/model/node-map.ts — the AssembledNode model: the assembled-node
 * class hierarchy plus the slot derivation and naming projection that build it.
 *
 * Split from the Rule<'link'> IR file (now `types/rule.ts`, R11). The classes here
 * represent what an assembled grammar node looks like after the full pipeline
 * has classified and enriched the Rule<'link'> — each subclass corresponds to one
 * ModelType (`branch`, `polymorph`, `leaf`, `keyword`, `token`, `enum`,
 * `supertype`, `group`, `multi`). `container` was merged into `branch`
 * (slot-surface distinctions derived from `slotClass`).
 *
 * Organized in place (R6 follow-up — reorg decision 1: a large module is
 * structured with internal sections, not split into a second file). The
 * `AssembledNonterminal` slot class and the derivation/naming it computes
 * (`projectSlotNaming`, `nameNode`) are mutually coupled, so they stay
 * co-located rather than forming a cyclic two-file pair. Major sections are
 * delimited by `// ===` banners:
 *
 *   1. Diagnostics & module state — parse-kind / derive-shape / assemble-warning
 *      accumulators + the optional-body and audit-context module pointers.
 *   2. Slot model & derivation — `NodeRef`/`NodeOrTerminal`/`FieldStorageInfo`
 *      content types, cardinality (`deriveSlotCardinality`…), value guards,
 *      naming utilities (`snakeToCamel`/`pluralize`), the Rule<'link'> walkers
 *      (`hasAnyField`/`hasAnyChild`), and the Rule<'link'> → slots/values derivation
 *      (`deriveSlots`, `deriveValuesForRule`, `dedupeValues`, separators, `nameNode`).
 *   3. AssembledNonterminal & naming projection — the slot class + `kindsOf`/
 *      `valueParseKindsOf` + the `projectSlotNaming` projection.
 *   4. AssembledNode class hierarchy — `AssembledBranch`/`Polymorph`/`Pattern`/
 *      `Keyword`/`Token`/`Enum`/`Supertype`/`Multi`/`Group` + the `AssembledNode` union.
 *   5. Canonical structural-view helpers — `structuralFieldsOf`/`allSlotsOf`/….
 *
 * `isSyntheticFieldWrapper` is a classification hint used by template-walker.ts.
 * Backward compatibility: `rule.ts` re-exports everything from this file.
 */

import { ALIAS, CHOICE, DEDENT, FIELD, GROUP, INDENT, NEWLINE, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SUPERTYPE, SYMBOL, TOKEN, VARIANT } from '../../types/rule-types.ts'; // @rule-type-consts
import type {
	AnyRule,
	Rule,
	RuleBase,
	RenderRule,
	SimplifiedRule,
	SeqRule,
	ChoiceRule,
	RepeatRule,
	Repeat1Rule,
	StringRule,
	PatternRule,
	TokenRule,
	EnumRule,
	SupertypeRule,
	Multiplicity,
	RuleId
} from '../../types/rule.ts';
import { isSeq, isField, literalTextOf, isEnumChoiceRule, isLinkSymbol } from '../../types/rule.ts';
import { isStringType } from '../../types/runtime-shapes.ts';
import type { RuleMetadata } from '../../types/rule-metadata-brand.ts';
import type { GeneratedKindEntry } from '../generated-metadata.ts';
import { findGeneratedKindEntry } from '../generated-metadata.ts';
import { tokenToName } from '../normalize.ts';
import { collectSlots } from '../collect-slots.ts';
import { assertNever } from '../../polymorph-variant.ts';
import { opaqueFacts, type OpaqueFacts } from '../opaque-facts.ts';
import { deleteWrapper } from '../wrapper-deletion.ts';
import {
	diagnoseParseKindCollisions,
	type ParseKindCollisionDiagnostic,
	type ParseKindCollisionValue
} from '../diagnostics/parsekind-collisions.ts';
import {
	describeDeriveShape,
	type DeriveShapeDiagnostic
} from '../diagnostics/derive-shapes.ts';

// ============================================================================
// 1. Diagnostics & module state
// ============================================================================

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
 * True when a field's content would have tree-sitter emit multiple children under
 * the same field name at parse time. Uses `unwrapStructuralPassthroughs` defined
 * below (moved from field-shape.ts in R7 de-scatter; uses the node-map version).
 */

export function fieldContentIsMultiSibling(content: Rule<'link'>): boolean {
    const core = unwrapStructuralPassthroughs(content);
    if (core.type === CHOICE) {
        return core.members.some((member) => fieldContentIsMultiSibling(member));
    }
    if (core.type !== SEQ) return false;
    let count = 0;
    for (const member of core.members) {
        let unwrapped: Rule<'link'> = member;
        while (unwrapped.type === OPTIONAL ||
            unwrapped.type === VARIANT ||
            unwrapped.type === GROUP ||
            unwrapped.type === TOKEN
            // PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule<'link'> union.
        ) {
            unwrapped = (unwrapped as { content: Rule<'link'>; }).content;
        }
        switch (unwrapped.type) {
            case SYMBOL:
                if (isLinkSymbol(unwrapped)) break;
                count++;
                if (count >= 2) return true;
                break;
            case SUPERTYPE:
            case ALIAS:
            case FIELD:
            case REPEAT:
            case REPEAT1:
                count++;
                if (count >= 2) return true;
                break;
            default:
                break;
        }
    }
    return false;
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
export { type Multiplicity } from '../../types/rule.ts';

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

// ============================================================================
// 2. Slot model & derivation
// ============================================================================

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

/**
 * A single entry inside a slot's `values` array. It is EITHER a node
 * reference (`node` set, `value` absent) OR an inline string literal (`value`
 * set, `node` absent) — discriminated structurally by presence, via
 * {@link isNodeRef} / {@link isTerminalValue}, NOT by a `kind` tag.
 *
 * PR-P Task 3 folded the former two interfaces (`NodeRef` + `TerminalValue`)
 * into this one: a literal is now a `NodeRef` carrying `value` (and the
 * literal-only `immediate` / `tokenized` token-wrapper flags) instead of a
 * `node`. The value union is `NodeRef[]`.
 *
 * `immediate` is set when the literal's rule was wrapped in a `TokenRule` with
 * `immediate: true` (`token.immediate(...)` / tree-sitter `IMMEDIATE_TOKEN`);
 * render emits the literal adjacent to the preceding token (no leading
 * whitespace). `tokenized` is set when wrapped in any `TokenRule`. Absent /
 * false → default field-spacing rules.
 */
export interface NodeRef<T extends AssembledNode = AssembledNode> {
	// Node-reference target. Present for true references; absent for inline
	// literals (which carry `value` instead). Mutually exclusive with `value`.
	readonly node?: T | UnresolvedRef;
	// Inline string literal text (e.g. `'const'`, `'pub'`, an enum member /
	// pattern-matched anonymous token). Mutually exclusive with `node`.
	readonly value?: string;
	// For a literal: the resolved CST kind name the literal text maps to (a
	// catalog anon/hidden kind), when one exists. Absent for genuinely-kindless
	// literals (regex patterns / residual). Carried for transport/typing;
	// render still emits from `value`.
	readonly resolvedKind?: string;
	// Parse-as kind ref (§7.3 / §4g, PR-A front-load): the CST kind this value
	// surfaces under — the alias TARGET when aliased (`rule.name`), else the
	// own kind. Differs from `node` (render/source = `aliasedFrom ?? rule.name`)
	// only for aliased/variant values. `storageName`/`parseNames` project this.
	readonly parseKind?: UnresolvedRef;
	readonly multiplicity: Multiplicity;
	readonly separator?: string;
	readonly trailing?: boolean;
	readonly leading?: boolean;
	// Literal-only token-wrapper flags (see interface doc).
	readonly immediate?: boolean;
	readonly tokenized?: boolean;
}

/**
 * The slot-value type. Formerly a `NodeRef | TerminalValue` union; now a
 * single `NodeRef` (literals fold in as `value`-bearing refs). Alias retained
 * so the many `NodeOrTerminal[]` annotations need not all change at once.
 */
export type NodeOrTerminal = NodeRef;

/** True when this entry is a node reference (carries a `node`). */
export function isNodeRef(v: NodeOrTerminal): v is NodeRef & { node: AssembledNode | UnresolvedRef } {
	return v.node !== undefined;
}

/** True when this entry is an inline string literal (carries a `value`). */
export function isTerminalValue(v: NodeOrTerminal): v is NodeRef & { value: string } {
	return v.value !== undefined;
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
// Derivation helpers — walk a Rule<'link'> to produce fields, children, content types
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
 * Used by pre-assembly phases (classifier, normalizer) that only need to
 * know IF fields exist — not the full list. Shorter-circuits than
 * deriveFields.
 */
export function hasAnyField(rule: Rule<'link'>): boolean {
	switch (rule.type) {
		case FIELD:
			return true;
		case SEQ:
		case CHOICE:
			return rule.members.some(hasAnyField);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case VARIANT:
		case GROUP:
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
export function hasAnyChild(rule: Rule<'link'>): boolean {
	switch (rule.type) {
		case SYMBOL:
		case SUPERTYPE:
			return true;
		case SEQ:
		case CHOICE:
			return rule.members.some(hasAnyChild);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case VARIANT:
		case GROUP:
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
function auditDerivationShape(rule: Rule<'link'>, context: 'fields' | 'children'): void {
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
function classifyTopLevelShape(rule: Rule<'link'>): string {
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
	//  - `polymorph` anywhere: the PolymorphRule IR type (and its
	//     AssembledPolymorph node class) are retired. Reaching derivation
	//     with one means a legacy/synthetic rule object leaked in.
	switch (rule.type) {
		case SEQ: {
			for (const m of rule.members) {
				if (m.type === SEQ) {
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
		case FIELD:
		case SYMBOL:
		case STRING:
		case PATTERN:
		// PR-P: ENUM case removed — enum-shaped ChoiceRules handled in CHOICE above.
		// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule<'link'> union.
		case SUPERTYPE:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return 'canonical';
		case VARIANT: {
			// `variant` wrappers below the top level — usually a
			// polymorph discriminator that simplify couldn't hoist
			// (e.g. buried under an optional). The walker unwraps
			// them without structural consequence; treat inner as
			// the canonicality check.
			const inner = classifyTopLevelShape(rule.content);
			return inner === 'canonical' ? 'canonical' : `variant-wrapping-${inner}`;
		}
		case TOKEN: {
			const inner = classifyTopLevelShape(rule.content);
			return inner === 'canonical' ? 'canonical' : `token-wrapping-${inner}`;
		}
		case REPEAT:
		case REPEAT1: {
			const inner = classifyTopLevelShape(rule.content);
			return inner === 'canonical' ? 'canonical' : `${rule.type}-wrapping-${inner}`;
		}
		case CHOICE: {
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
			const allFieldOrToken = rule.members.every((m) => m.type === FIELD || isTokenLikeChoiceMember(m));
			if (allFieldOrToken) return 'canonical';
			// Polymorph surface: every branch wraps its content in a
			// `variant()` tag (from override-declared variant() adoption).
			// Variant-wrapped branches are never merged or hoisted —
			// they preserve polymorph identity — so the walker descends
			// into each independently and dispatches via `$variant`.
			// Canonical even when the inner content is a structural seq
			// with fields.
			if (rule.members.every((m) => m.type === VARIANT)) return 'canonical';
			return 'choice-needs-variant-or-merge';
		}
		case OPTIONAL: {
			const innerShape = classifyTopLevelShape(rule.content);
			return innerShape === 'canonical' ? 'canonical' : `optional-wrapping-${innerShape}`;
		}
		case GROUP:
		case ALIAS:
			return `wrapper-${rule.type}`;
		default:
			return `other-${(rule as Rule<'link'>).type}`;
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
function isTokenLikeChoiceMember(m: Rule<'link'>): boolean {
	const peel = (r: Rule<'link'>): Rule<'link'> =>
		r.type === ALIAS
			? peel(r.content)
			: r.type === TOKEN
				? peel(r.content)
				: r.type === VARIANT
					? peel(r.content)
					: r;
	const core = peel(m);
	if (core.type === SYMBOL || core.type === SUPERTYPE || isEnumChoiceRule(core)) return true;
	// Bare `string` / `pattern` members — token-literal alternatives.
	// `_non_special_token` has a choice containing dozens of bare
	// keyword strings alongside symbol refs; each contributes a
	// single-token alternative to the union, not a structural branch.
	if (core.type === STRING || core.type === PATTERN) return true;
	// Structural-whitespace tokens (python-style indent/dedent/newline).
	// These behave as anonymous token separators — they don't surface
	// as addressable children, so they never contribute structural
	// branching to a choice arm.
	if (core.type === INDENT || core.type === DEDENT || core.type === NEWLINE) return true;
	// PR-P Task 2: TERMINAL case removed — terminal-shaped rules now arrive as their original
	// unwrapped type (SEQ/STRING/etc.) and are already covered above or by TOKEN wrapper.
	// `optional(token-like)` preserves the union shape — the branch
	// contributes either the wrapped token or nothing. Rust's
	// `reference_expression` has `choice(choice-of-syms, optional(sym))`
	// for the raw-pointer-modifier spot; both arms are union-safe even
	// though one is an optional. Recurse to classify the inner.
	if (core.type === OPTIONAL) return isTokenLikeChoiceMember(core.content);
	// Nested choice of token-like members — simplify should have
	// flattened this, but when flattening is blocked (e.g. by a
	// variant wrapper on the inner choice), the nested shape is still
	// structurally a union of tokens. `_lhs_expression` hits this
	// with a nested `choice(choice(sym, sym, ...), sym, ...)`.
	if (core.type === CHOICE && core.members.every(isTokenLikeChoiceMember)) return true;
	if (core.type === REPEAT1 || core.type === REPEAT) {
		const inner = peel(core.content);
		if (isEnumChoiceRule(inner)) return true;
		if (inner.type === STRING || inner.type === PATTERN) return true;
		if (inner.type === SYMBOL || inner.type === SUPERTYPE) return true;
		if (inner.type === CHOICE && inner.members.every(isTokenLikeChoiceMember)) return true;
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
function isFlatSymbolSeqOrTokenLike(m: Rule<'link'>): boolean {
	if (m.type === SEQ) {
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
function _deriveSlotsInternal(rule: Rule<'link'>, ctx?: DeriveCtx): AssembledNonterminal[] {
	const canonical = deleteWrapper(rule) as Rule<'link'>;
	// Set the audit kind context for the duration of this derivation so
	// auditDerivationShape() can attribute shapes to their originating kind.
	// Save/restore guards against cross-kind bleed if derivations nest.
	const prevAuditKind = currentAuditKind;
	if (ctx?.kindName !== undefined) setAuditKindContext(ctx.kindName);
	try {
		auditDerivationShape(canonical, 'fields');
		// Nonterminal-driven collection (2026-05-21 design): one slot per
		// `nonterminal` node, choice = one union slot, seq distributes. Replaces
		// the `deriveSlotsRaw` fold/merge/effectiveMultiplicity walker. Same-name
		// slots that appear in multiple positions (e.g. python `if_statement`'s
		// `alternative` in both a repeat and an optional) are still folded into one
		// AssembledNonterminal by `mergeSlotsByName`.
		return mergeSlotsByName(collectSlots(canonical, ctx?.kindName ?? currentAuditKind, ctx?.kindEntries));
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

/**
 * Grammar-wide inputs threaded through node-map's slot derivation
 * (Principle #14 / §7.7 — R1). Every field is optional because the
 * derivation entry points accept partial context (test fixtures pass
 * none); per-kind record builders narrow with {@link KindedDeriveCtx}.
 * Recursion-LOCAL traversal state (e.g. `multiplicity` in
 * `deriveValuesForRule`) stays an explicit parameter per CW6 — never ctx.
 */
export interface DeriveCtx {
	/** Generated kind-id table — resolves anonymous-token kinds. */
	readonly kindEntries?: readonly GeneratedKindEntry[];
	/** Owning kind under derivation — audit + diagnostics attribution. */
	readonly kindName?: string;
	/** Canonical rule signatures for parse-kind collision resolution. */
	readonly collision?: ParseKindCollisionContext;
	/** Visible alias target → source kinds (alias-source slot expansion). */
	readonly visibleAliasTargets?: ReadonlyMap<string, readonly string[]>;
	/** Post-simplify rules, for alias-source value derivation. */
	readonly simplifiedRules?: Record<string, SimplifiedRule>;
	/** Assembled node table — resolves UnresolvedRef in the parameterless cascade. */
	readonly nodes?: ReadonlyMap<string, AssembledNodeBase<Rule<'link'>>>;
}

/** {@link DeriveCtx} with the owning kind bound — per-kind record builders. */
export interface KindedDeriveCtx extends DeriveCtx {
	readonly kindName: string;
}

export function buildParseKindRuleSignatures<T extends Rule<'link'>>(
	rules: Readonly<Record<string, T>>
): Readonly<Record<string, string>> {
	return Object.fromEntries(
		Object.entries(rules).map(([kind, rule]) => [kind, canonicalRuleSignature(rule)])
	);
}

export function storageKindOfValue(value: NodeOrTerminal): string | undefined {
	if (isNodeRef(value)) {
		return isUnresolvedRef(value.node) ? value.node.name : value.node.kind;
	}
	return value.resolvedKind ?? value.value;
}

function resolveParseKindCollisions(
	slots: readonly AssembledNonterminal[],
	ctx: KindedDeriveCtx
): AssembledNonterminal[] {
	if (slots.length === 0) return [...slots];
	return mergeSlotsByName(slots.map((slot) => resolveParseKindCollisionsInSlot(slot, ctx)));
}

function resolveParseKindCollisionsInSlot(
	slot: AssembledNonterminal,
	ctx: KindedDeriveCtx
): AssembledNonterminal {
	const describedValues: ParseKindCollisionValue<NodeOrTerminal>[] = slot.values.map((value) => {
		const storageKind = storageKindOfValue(value);
		return {
			original: value,
			parseKind: value.parseKind?.name,
			storageKind,
			structuralSignature: structuralSignatureOfValue(value, ctx, storageKind),
			preferRepresentative: storageKind !== undefined && storageKind === value.parseKind?.name
		};
	});
	const resolution = diagnoseParseKindCollisions({
		ownerKind: ctx.kindName,
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
	ctx: DeriveCtx,
	storageKind: string | undefined
): string {
	const surface = [
		value.multiplicity,
		value.separator ?? '',
		value.trailing ? 't' : '',
		value.leading ? 'l' : '',
		isTerminalValue(value) && value.immediate ? 'i' : '',
		isTerminalValue(value) && value.tokenized ? 'tok' : ''
	].join('|');
	if (isTerminalValue(value)) {
		return `terminal:${value.value}:${value.resolvedKind ?? ''}:${surface}`;
	}
	return `node:${structuralSignatureOfStorageKind(storageKind, ctx)}:${surface}`;
}

function structuralSignatureOfStorageKind(
	storageKind: string | undefined,
	ctx: DeriveCtx
): string {
	if (storageKind === undefined) return 'missing';
	return ctx.collision?.ruleSignatures[storageKind] ?? `missing:${storageKind}`;
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
 * Extract a separator string from a `RuleBase<'normalize'>['separator']`
 * value (the stamped leaf form `applyWrapperDeletion` produces — this
 * function only ever sees post-Normalize separators, never the `link`-phase
 * `RepeatRule.separator` — which, post-PR-S, shares this same nested shape).
 * Returns undefined when the separator is absent, non-literal, or empty.
 */
export function extractSeparatorString(sep: RuleBase<'normalize'>['separator']): string | undefined {
	if (sep === undefined) return undefined;
	if (isStringType(sep.value.type)) {
		const v = (sep.value as { value: string }).value;
		return v || undefined;
	}
	return undefined;
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
 *   - `alias` / `group` / `polymorph` — simplify strips the first two;
 *     the third is a retired IR type that no longer exists at runtime.
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
export function deriveSlots(rule: Rule<'link'>, ctx?: DeriveCtx): readonly AssembledNonterminal[] {
	// The field walker handles positional symbol/supertype/choice content
	// too, so it produces every slot — no separate children walker needed.
	return _deriveSlotsInternal(rule, ctx);
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
export function isSyntheticFieldWrapper(content: Rule<'link'>): boolean {
	if (content.type === REPEAT || content.type === REPEAT1) {
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
	rule: Rule<'link'>,
	ctx: DeriveCtx | undefined,
	multiplicity: Multiplicity
): NodeOrTerminal[] {
	switch (rule.type) {
		case SYMBOL: {
			// Link-synthesized operator literal (Chunk D1): `canonicalizeRuleLiterals`
			// rewrites a field-wrapped operator literal (`'<'`) into
			// `symbol{ name: 'lt', literal: '<', metadata: {symbolSource: 'link'} }`.
			// The `name` is the alias-target kind (the runtime `$type`) and
			// `literal` is the original source string. Emit a TERMINAL of the
			// source string — `value` is what the renderer emits (`<`),
			// `resolvedKind` is the alias-target kindId read-time matching keys
			// on (`lt`). Dropping `literal` (the old behavior) leaked a PHANTOM
			// kind ref (`Lt`/`LtEq`) into the operator enum and left render
			// emitting the bare literal while read could not populate the slot.
			//
			// (debt PR-P1) Was `rule.source === 'link' && rule.literal !==
			// undefined`; `literal` is set ONLY by `canonicalizeRuleLiterals`
			// alongside the (now-deleted) `source: 'link'` stamp — its one and
			// only writer — so `literal !== undefined` alone is the exact same
			// condition, structurally, not an inference.
			if (rule.literal !== undefined) {
				return [
					{
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
					node: { kind: 'unresolved-ref', name: refName },
					// parse-as kind = the alias TARGET (`rule.name`); `node` is the
					// render/source (`refName`). For `_suite`: node=_simple_statements,
					// parseKind=block (the CST kind). §7.3 / §4g.
					parseKind: { kind: 'unresolved-ref', name: rule.name },
					multiplicity: relaxForOptionalBody(refName, multiplicity)
				}
			];
		}
		case SUPERTYPE:
			// Supertype refs expand to their subtype list — each subtype is a
			// valid concrete kind the slot can hold.
			return rule.subtypes.map((name) => ({
				node: { kind: 'unresolved-ref' as const, name },
				parseKind: { kind: 'unresolved-ref' as const, name },
				multiplicity: relaxForOptionalBody(name, multiplicity)
			}));
		case STRING:
		// A `pattern` is a NONTERMINAL slot (classifyByType), but its VALUE is the
		// anonymous-token text it matches — a terminal value, like a `string` or an
		// `enum` member. Without this case it fell to `default: return []`, so a
		// pattern slot had no values and was elided (e.g. token_repetition's
		// separator pattern never became a slot).
		case PATTERN: {
			const rk = findGeneratedKindEntry(ctx?.kindEntries ?? [], rule.value)?.kind;
			return [
				{
					value: rule.value,
					resolvedKind: rk,
					parseKind: rk !== undefined ? { kind: 'unresolved-ref', name: rk } : undefined,
					multiplicity
				}
			];
		}
		// PR-P: ENUM case removed — enum-shaped ChoiceRules handled in CHOICE below.
		case CHOICE: {
			// PR-P: handle enum-shaped ChoiceRules (all-STRING members) as enum terminal values.
			if (isEnumChoiceRule(rule)) {
				return rule.members.map((m) => {
					const text = literalTextOf(m) ?? '';
					const rk = text ? findGeneratedKindEntry(ctx?.kindEntries ?? [], text)?.kind : undefined;
					return {
						value: text,
						resolvedKind: rk,
						parseKind: rk !== undefined ? { kind: 'unresolved-ref' as const, name: rk } : undefined,
						multiplicity
					};
				});
			}
			// `choice(X, blank)` is functionally `optional(X)` — the blank arm
			// makes the entire choice optional. Downgrade nonEmptyArray → array
			// and single → optional when recursing into the non-blank arms.
			// Mirrors the fieldContentMultiplicity choice handling and the
			// rule-body lookthrough in assemble.ts.
			const isBlank = (r: Rule<'link'>): boolean =>
				(r.type === CHOICE && r.members.length === 0) ||
				(r.type === SEQ && r.members.length === 0);
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
			return nonBlank.flatMap((m) => deriveValuesForRule(m, ctx, armMult));
		}
		case OPTIONAL: {
			// `optional(repeat1(X, sep))` survives evaluate when the
			// optional wraps the canonical commaSep1 lift (e.g. python's
			// `parameters: seq('(', optional(_parameters), ')')`).
			// Recursing with multiplicity 'optional' lets the inner
			// 'repeat1' case clobber it back to 'nonEmptyArray', which
			// mis-marks the slot as never-empty even though `()` is
			// valid. Downgrade to 'array' when the inner is repeat1, so
			// the outer-optional semantics survive. Mirrors the
			// `collectChildFromMember` rule for child slots.
			if (rule.content.type === REPEAT1) {
				return deriveValuesForRule(rule.content.content, ctx, 'array');
			}
			// For `optional(seq(..., repeat1(...), ...))` and similar nested
			// shapes (which is the form `choice(seq(...), blank)` folds to
			// during simplify), the outer optional makes the entire content
			// empty-allowed. Any `nonEmptyArray` produced by an inner repeat1
			// is therefore relaxed to `array` at the outer slot — empty inputs
			// like `{}` (object_type with zero members) are valid.
			const inner = deriveValuesForRule(rule.content, ctx, 'optional');
			return inner.map((v) =>
				v.multiplicity === 'nonEmptyArray' ? { ...v, multiplicity: 'array' as const } : v
			);
		}
		case REPEAT:
			return deriveValuesForRule(rule.content, ctx, 'array');
		case REPEAT1:
			return deriveValuesForRule(rule.content, ctx, 'nonEmptyArray');
		case FIELD:
			// Nested field inside a choice — recurse into its content
			return deriveValuesForRule(rule.content, ctx, multiplicity);
		case VARIANT:
		case GROUP:
			return deriveValuesForRule(rule.content, ctx, multiplicity);
		case TOKEN:
			// `token(...)` / `token.immediate(...)` wrappers carry adjacency
			// metadata the inner rule alone doesn't express. Recurse, then
			// tag each produced terminal so render templates can decide
			// whether to emit adjacent or spaced.
			return deriveValuesForRule(rule.content, ctx, multiplicity).map((v) =>
				isTerminalValue(v) ? { ...v, immediate: rule.immediate, tokenized: true } : v
			);
		case SEQ:
			// Seq inside a choice arm — flatten all members (rare, but
			// handles seq-of-symbols within choice arms).
			return rule.members.flatMap((m) => deriveValuesForRule(m, ctx, multiplicity));
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
		const nodeName = isNodeRef(v) ? (isUnresolvedRef(v.node) ? v.node.name : v.node.kind) : undefined;
		const key = isNodeRef(v)
			? `node-ref:${nodeName ?? '?'}:${parseKind}:${v.multiplicity}`
			: `terminal:${v.value ?? ''}:${parseKind}:${v.multiplicity}`;
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

export abstract class AssembledNodeBase<R extends AnyRule = Rule<'link'>> {
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
	 * this to the exact Rule<'link'> subset each subclass accepts — the narrowing
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
	 * (debt: source-homonym resolution, decision 6) Blind opaque passthrough
	 * of the owning rule's `RuleMetadata` bag — mirrors
	 * `AssembledNonterminal.ruleMetadata` (PR-P1's established carry
	 * pattern). Never read/branched on here or by any compiler consumer;
	 * only a dsl-sanctioned reader (`dsl/rule-metadata.ts`'s
	 * `readRuleMetadata`, from enrich/wire/diagnostics code) may open it —
	 * e.g. node-model serialization or validator diagnostics surfacing a
	 * link-classified ('promoted') kind as an override candidate.
	 */
	get ruleMetadata(): RuleMetadata | undefined {
		return this.rule.metadata;
	}

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
// ============================================================================
// 3. AssembledNonterminal & naming projection
// ============================================================================

/**
 * A non-literal (rule-shaped) separator captured on a repeated slot — e.g.
 * `choice(',', ';')` or `optional(',')` as a list separator, as opposed to a
 * plain string. Post-PR-S, `liftSeparators` already isolates the full
 * separator `Rule` at the `RuleBase.separator` level, so there is nothing
 * left to bucket by role at this compiler layer, only to capture: this type
 * just carries that already-computed rule (and its trailing/leading grammar
 * permissions) onto the content slot for later per-instance runtime
 * derivation (native reader / wrap.ts / render).
 */
export interface SeparatorSource {
	/** The non-literal separator rule itself (post-PR-S, already the FULL rule — e.g. a ChoiceRule — not narrowed to one arm). */
	readonly rule: Rule<'normalize'>;
	/** Grammar-level permission (generalizes hasTrailing/hasLeading for the non-literal case; the boolean flags stay for compatibility but this is the derivation source going forward for non-literal separators). */
	readonly trailingPermitted: boolean;
	readonly leadingPermitted: boolean;
}

/** Stored (non-computed) constructor inputs for {@link AssembledNonterminal}. */
export interface AssembledNonterminalInit {
	readonly values: readonly NodeOrTerminal[];
	readonly fieldName?: string;
	readonly hasTrailing: boolean;
	readonly hasLeading: boolean;
	/** Non-literal separator rule captured for a repeated slot — see {@link SeparatorSource}. */
	readonly separatorSource?: SeparatorSource;
	/**
	 * Rule<'link'>-ids of every simplified/render-rule position that produced this slot —
	 * see `AssembledNonterminal.sourceRuleIds`.
	 */
	readonly sourceRuleIds: readonly RuleId[];
	/** Validator-only facts. OPAQUE to the compiler (see {@link OpaqueFacts}) —
	 *  never read here to drive logic or emission; defaults to empty. */
	readonly metadata?: OpaqueFacts;
	/**
	 * (debt PR-P1, item 4) Blind passthrough of the owning rule's opaque
	 * `RuleMetadata` bag (`types/rule.ts`'s `RuleBase.metadata`). Collect-slots
	 * copies this WITHOUT reading it — never branch on it here. Only a
	 * dsl-sanctioned reader (`dsl/rule-metadata.ts`'s `readRuleMetadata`, from
	 * enrich/wire/diagnostics code) may open it, e.g. for node-model
	 * serialization or validator diagnostics.
	 */
	readonly ruleMetadata?: RuleMetadata;
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
	/** Non-literal separator rule captured for a repeated slot — see {@link SeparatorSource}. */
	readonly separatorSource?: SeparatorSource;
	/**
	 * Rule<'link'>-ids of every simplified/render-rule position that produced this slot.
	 * Used by `NodeMap.slotByRuleId` to back-pointer from whichever rule-tree
	 * view a consumer walks to the owning slot without owner traversal. Empty
	 * when the source rules carry no ids (hand-constructed test fixtures that
	 * bypass `buildRuleCatalog`). See feedback_ruleid_backpointer / FOLD-1.
	 */
	readonly sourceRuleIds: readonly RuleId[];
	/** Validator-only facts. OPAQUE to the compiler (see {@link OpaqueFacts}) —
	 *  never read here to drive logic or emission. */
	readonly metadata: OpaqueFacts;
	/** (debt PR-P1) Blind passthrough of the owning rule's opaque
	 *  `RuleMetadata` — see {@link AssembledNonterminalInit.ruleMetadata}. */
	readonly ruleMetadata?: RuleMetadata;
	storageInfo?: FieldStorageInfo;

	get storageName(): string { return projectSlotNaming(this).storageName; }
	get name(): string { return projectSlotNaming(this).name; }
	/** Config key — matches ConfigOf projection (camelCase of storageName). Always singular. */
	get configKey(): string { return projectSlotNaming(this).configKey; }
	get propertyName(): string { return projectSlotNaming(this).propertyName; }
	get paramName(): string { return projectSlotNaming(this).paramName; }
	get parseNames(): readonly string[] { return projectSlotNaming(this).parseNames; }
	/**
	 * True when the slot has no declared grammar `fieldName` (a positional
	 * slot named from structure — e.g. a bare symbol ref or an unnamed
	 * choice's `content` catch-all). This is the ONLY source of the former
	 * `source: 'grammar' | 'inferred'` distinction (debt: source-homonym
	 * resolution, decision 6) — `source` was a stored copy of exactly this
	 * derivation and has been deleted. Named vs positional: derive from
	 * `fieldName` presence directly, here or via this getter.
	 */
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
		this.separatorSource = init.separatorSource;
		this.sourceRuleIds = init.sourceRuleIds;
		this.metadata = init.metadata ?? opaqueFacts({});
		this.ruleMetadata = init.ruleMetadata;
		this.storageInfo = init.storageInfo;
	}

	/** Return a new instance with the given fields overridden; naming recomputed. */
	with(overrides: Partial<AssembledNonterminalInit>): AssembledNonterminal {
		return new AssembledNonterminal({
			values: this.values,
			fieldName: this.fieldName,
			hasTrailing: this.hasTrailing,
			hasLeading: this.hasLeading,
			separatorSource: this.separatorSource,
			sourceRuleIds: this.sourceRuleIds,
			metadata: this.metadata,
			ruleMetadata: this.ruleMetadata,
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
		if (!isNodeRef(v)) continue;
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
	// Storage kinds from node-ref values (the render-source kind via `value.node`).
	const nodeRefStorageKinds = [
		...new Set(
			slot.values.filter(isNodeRef).map((v) => {
				const node = v.node;
				return isUnresolvedRef(node) ? node.name : node.kind;
			})
		)
	];
	// PR-P Task 3 step 3: when a slot is PURELY inline literals (no node-refs),
	// its storage kind is the literal's resolved catalog kind — so a slot holding
	// a single resolved literal is named after that kind instead of the generic
	// `content` (§4c — `content` is for genuinely-anonymous multi-kind unions).
	// A MIXED ref+literal slot keeps its ref-based naming (the literal is
	// incidental punctuation, not the storage identity) — e.g. `splat_pattern`'s
	// `{identifier, _}` stays `identifier`, not `content`. Unresolved literals
	// (regex / residual, no resolvedKind) contribute nothing AND trip
	// `hasUnnamedValue` → `content`.
	const literalStorageKinds = [
		...new Set(
			slot.values
				.filter(isTerminalValue)
				.map((v) => v.resolvedKind)
				.filter((k): k is string => k !== undefined)
		)
	];
	const distinctStorageKinds = nodeRefStorageKinds.length > 0 ? nodeRefStorageKinds : literalStorageKinds;
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
	ctx: KindedDeriveCtx
): AssembledNonterminal {
	// Only expand unnamed (kind-routed) slots.
	if (slot.fieldName !== undefined) return slot;

	// Look up the owning kind as a VISIBLE ALIAS TARGET.
	// `token_tree → [delim_token_tree]` means `delim_token_tree` is aliased TO `token_tree`.
	// We need to derive the concrete children of each source kind and add them as extra values.
	const sources = ctx.visibleAliasTargets?.get(ctx.kindName);
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
		const sourceRule = ctx.simplifiedRules?.[sourceKind];
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
		if (unwrappedSource.type !== CHOICE) continue;
		// Derive values from the source kind's simplified rule.
		const derived = deriveValuesForRule(sourceRule, ctx, dominantMult);
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
 * @param rule - Simplified rule to walk for slots.
 * @param ctx - Kinded derive context: owning kind + the grammar-wide
 *   inputs (kind entries, collision signatures, alias targets, rules).
 */
function buildSlotsRecord(
	rule: Rule<'link'>,
	ctx: KindedDeriveCtx,
	renderRule?: RenderRule
): Readonly<Record<string, AssembledNonterminal>> {
	const kind = ctx.kindName;
	const slots = [...deriveSlots(rule, ctx)];
	if (renderRule) {
		for (const renderSlot of deriveSlots(renderRule, ctx)) {
			const existing = slots.find((slot) => slot.name === renderSlot.name);
			if (!existing) continue;
			const next = existing.with({
				sourceRuleIds: mergeSourceRuleIds(existing.sourceRuleIds, renderSlot.sourceRuleIds),
			});
			slots.splice(slots.indexOf(existing), 1, next);
		}
	}
	let resolvedSlots = resolveParseKindCollisions(slots, ctx);

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
	if (ctx.visibleAliasTargets && ctx.simplifiedRules) {
		resolvedSlots = resolvedSlots.map((slot) => expandSlotWithVisibleAliasSources(slot, ctx));
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
					isTerminalValue(v)
						? `"${v.value}"`
						: isNodeRef(v) && isUnresolvedRef(v.node)
							? v.node.name
							: isNodeRef(v)
								? (v.node as AssembledNode).kind
								: '?'
				);
				const mult = s.values.length > 0 ? s.values[0]!.multiplicity : 'single';
				const named = s.isUnnamed ? 'positional' : 'named';
				return `    ${s.name} (${named}, multiplicity: ${mult}, values: [${kinds.join(', ')}])`;
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
 * @param ctx - Derive context; `ctx.nodes` is the assembled node map, used to
 *   resolve UnresolvedRef by name before hydration. When provided, an
 *   unresolved ref is looked up by name and its `.parameterless` getter
 *   consulted (replicating the old fixpoint's name lookup). When absent (test
 *   fixtures), unresolved refs conservatively return false. No `_<name>`
 *   hidden-source fallback — the old fixpoint had none.
 */
function _isAutoStampSlotForParameterless(
	slot: AssembledNonterminal,
	ctx?: DeriveCtx
): boolean {
	const nodes = ctx?.nodes;
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

// ============================================================================
// 4. AssembledNode class hierarchy
// ============================================================================

export class AssembledBranch<
	R extends SeqRule<'link'> | ChoiceRule<'link'> | RepeatRule | Repeat1Rule =
		| SeqRule<'link'>
		| ChoiceRule<'link'>
		| RepeatRule
		| Repeat1Rule
> extends AssembledNodeBase<R> {
	readonly modelType = 'branch' as const;
	// rule narrowed to SeqRule<'link'> | ChoiceRule<'link'> | RepeatRule | Repeat1Rule —
	// branches classify from compositional rules that carry fields and/or
	// ordered children. The prior `AssembledContainer` class was absorbed —
	// repeat / repeat1 shapes (no `field()` on the rule) now route here too.
	// Emitter behavior should key off `slotClass` / slot facts rather than a
	// separate branch-global shape discriminator.
	/**
	 * SimplifiedRule with anonymous tokens / structural wrappers stripped
	 * (`normalized.rules[kind]` — SimplifiedGrammar's phase product, sourced
	 * from `computeSimplifiedRules`). Stored here so derivation walks
	 * (`deriveFields`, `deriveChildren`, separator discovery) don't have to
	 * re-navigate past delimiter literals on every call. Template emission
	 * still reads the raw `rule` because templates need the literals to
	 * surface as template text. Stage 1: populated but not yet read.
	 */
	readonly simplifiedRule: SimplifiedRule;
	/**
	 * Wrapper-deleted view of the rule, sourced from
	 * `normalized.normalizedRules[kind]` at assemble time. Optional / field /
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
	 *   - Key remap to `'child'` / `'children'` for unnamed (`isUnnamed`)
	 *     slots is deferred until grammar overrides explicitly name every
	 *     unnamed positional position (Owner A migration). Today, unnamed
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
		simplifiedRule: SimplifiedRule,
		renderRule: RenderRule,
		opts?: {
			factoryName?: string;
			irKey?: string;
			variantChildKinds?: readonly string[];
			kindEntries?: readonly GeneratedKindEntry[];
			parseKindCollisionContext?: ParseKindCollisionContext;
			slotRecord?: Readonly<Record<string, AssembledNonterminal>>;
			visibleAliasTargets?: ReadonlyMap<string, readonly string[]>;
			simplifiedRules?: Record<string, SimplifiedRule>;
		}
	) {
		super(kind, rule, opts);
		this.simplifiedRule = simplifiedRule;
		this.renderRule = renderRule;
		this.variantChildKinds = opts?.variantChildKinds ?? [];
		this._slots =
			opts?.slotRecord ??
			buildSlotsRecord(simplifiedRule, {
				kindName: kind,
				kindEntries: opts?.kindEntries,
				collision: opts?.parseKindCollisionContext,
				visibleAliasTargets: opts?.visibleAliasTargets,
				simplifiedRules: opts?.simplifiedRules,
			}, renderRule);
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
	get members(): readonly Rule<'link'>[] {
		const r = this.rule;
		return r.type === SEQ || r.type === CHOICE ? r.members : [];
	}

	/**
	 * Repeat-list separator fallback for `render-module.ts`'s `collectMetaData`.
	 * Historically read `this.simplifiedRule.type === REPEAT/REPEAT1` (the
	 * former `AssembledContainer.separator` getter), but `simplifiedRule` is
	 * the post-`applyWrapperDeletion` view (see `SimplifiedRule`) where
	 * REPEAT/REPEAT1 wrapper nodes never survive — they're converted to a
	 * `multiplicity`/`separator` leaf attribute before storage. Verified
	 * empirically (phase-visibility-tightening investigation): 0 of 468
	 * AssembledBranch nodes across rust/typescript/python ever had a
	 * REPEAT-shaped `simplifiedRule`, confirming the branch was always dead.
	 * Always returns `undefined` now; kept as a documented no-op rather than
	 * deleted outright so `render-module.ts`'s fallback-chain comment (and its
	 * call site) don't need to change in this pass.
	 */
	get separator(): string | undefined {
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
	#nodes: ReadonlyMap<string, AssembledNodeBase<Rule<'link'>>> | undefined = undefined;

	/**
	 * Attach the assembled node map so the `parameterless` getter can resolve
	 * UnresolvedRef slots by name before `hydrateSlotRefs` runs. Called by
	 * assemble() after all nodes are populated. Safe to call multiple times
	 * (idempotent for the same map reference).
	 */
	attachNodeMap(nodes: ReadonlyMap<string, AssembledNodeBase<Rule<'link'>>>): void {
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
		return allSlots.every((s) => _isAutoStampSlotForParameterless(s, { nodes: this.#nodes }));
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
 * `$TEXT` kinds already use.
 *
 * Shape criteria: rule is a `choice` (possibly wrapped in `variant`
 * markers from tagVariants). Every member has exactly three elements:
 * string-literal, repeat/repeat1 of a hidden symbol, string-literal.
 */
function isVerbatimTokenStream(rule: Rule<'link'>): boolean {
	if (rule.type !== CHOICE) return false;
	if (rule.members.length === 0) return false;
	return rule.members.every((m) => {
		const core = m.type === VARIANT ? m.content : m;
		if (core.type !== SEQ || core.members.length !== 3) return false;
		const [start, mid, end] = core.members;
		if (!start || !mid || !end) return false;
		if (start.type !== STRING || end.type !== STRING) return false;
		if (mid.type !== REPEAT && mid.type !== REPEAT1) return false;
		const inner = mid.content;
		return inner.type === SYMBOL && inner.hidden === true;
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
function hasOptionalPunctPrefix(rule: Rule<'link'>): boolean {
	if (rule.type !== SEQ || rule.members.length < 2) return false;
	const first = rule.members[0]!;
	if (first.type !== OPTIONAL) return false;
	// The optional's content must be purely punctuation (no symbols/fields).
	return isAllPunct(first.content);
}

/** Return true when a rule contains only string/pattern literals with no
 *  symbol references or field wrappers. Mirrors `containsOnlyPunctuation`
 *  in `template-walker.ts` (kept local to avoid a cross-file import). */
function isAllPunct(rule: Rule<'link'>): boolean {
	switch (rule.type) {
		case STRING:
		case PATTERN:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return true;
		case FIELD:
		case SYMBOL:
		case SUPERTYPE:
		// PR-P: ENUM case removed — enum-shaped ChoiceRules handled by CHOICE.
			return false;
		case SEQ:
		case CHOICE:
			return (rule as { members: Rule<'link'>[] }).members.every(isAllPunct);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case VARIANT:
		case GROUP:
			return isAllPunct((rule as { content: Rule<'link'> }).content);
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
 * @remarks Exhaustive `switch` on `Rule<'link'>.type`; non-passthrough rules
 * (seq/choice/repeat/repeat1/field/symbol/string/pattern/etc.) are
 * returned as-is. `assertNever` locks the switch shut so adding a new
 * Rule<'link'> variant becomes a compile error here instead of silently
 * skipping the unwrap step.
 *
 * @see template-walker.ts `fieldContentIsMultiSibling`.
 */
export function unwrapStructuralPassthroughs(rule: Rule<'link'>): Rule<'link'> {
	let r: Rule<'link'> = rule;
	for (;;) {
		switch (r.type) {
			case OPTIONAL:
			case VARIANT:
			case GROUP:
			case ALIAS:
			case TOKEN:
			// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule<'link'> union.
				r = r.content;
				continue;
			case SEQ:
			case CHOICE:
			case REPEAT:
			case REPEAT1:
			case FIELD:
			// PR-P: ENUM case removed — enum-shaped ChoiceRules are CHOICE now.
			case SUPERTYPE:
			case STRING:
			case PATTERN:
			case INDENT:
			case DEDENT:
			case NEWLINE:
			case SYMBOL:
				return r;
			default:
				return assertNever(r);
		}
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
export abstract class AssembledLeaf<R extends AnyRule = Rule<'link'>> extends AssembledNodeBase<R> {}

/**
 * Open-text non-branch kind whose surface form is matched by a regex
 * (PatternRule<'link'>) or is a pure-text structural rule (terminal-shape, no
 * fields, no symbol refs). Examples: `identifier`, `integer_literal`,
 * `string_content`.
 *
 * PR-P Task 2: widened from `PatternRule<'link'> | TerminalRule` to `Rule<'link'>` because
 * TerminalRule was deleted — terminal-shape kinds now arrive with their
 * original unwrapped rule (may be SeqRule<'link'>, ChoiceRule<'link'>, etc.).
 *
 * Renamed from the original `AssembledLeaf` class. The `modelType`
 * discriminant is `'pattern'` (renamed from `'leaf'` during the
 * taxonomy-driven emitter dispatch refactor). The new `AssembledLeaf`
 * is now an abstract base (above); `AssembledPattern` is one of its
 * four concrete subclasses.
 */
export class AssembledPattern extends AssembledLeaf<Rule<'link'>> {
	readonly modelType = 'pattern' as const;

	constructor(kind: string, rule: Rule<'link'>, opts?: { factoryName?: string; irKey?: string }) {
		super(kind, rule, opts);
	}

	/** The leaf's regex pattern value when the rule is a PatternRule<'link'>; undefined otherwise. */
	get pattern(): string | undefined {
		return this.rule.type === PATTERN ? this.rule.value || undefined : undefined;
	}

	/**
	 * When this pattern's sole realisation is a single fixed anonymous literal
	 * (e.g. `_semicolon` = `choice(_automatic_semicolon, ";")` where every
	 * non-blank, non-symbol leaf collapses to the same string), returns that
	 * string so callers can treat this like a keyword/token for transport
	 * deserialisation. Returns `undefined` for content-bearing patterns
	 * (`identifier`, `number`, external scanner symbols, etc.).
	 *
	 * Used by the node-model emitter to attach a `text` field to the
	 * serialized pattern entry, which `leafDefaultTextLiteral` (render-module)
	 * then picks up to enable the existing u16 acceptance branch in the
	 * generated `FromNapiValue` impls.
	 */
	get fixedLiteralText(): string | undefined {
		if (this.rule.type === PATTERN) return undefined; // regex — always content-bearing
		// Terminal-shape rule: walk the content tree collecting all non-blank string leaves.
		return collectFixedLiteral(this.rule);
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
function collectFixedLiteral(rule: Rule<'link'>): string | undefined {
	switch (rule.type) {
		case STRING:
			return rule.value || undefined;
		case OPTIONAL:
			// optional(X): the blank arm contributes nothing; X may yield a fixed literal
			return collectFixedLiteral(rule.content);
		case CHOICE: {
			if (rule.members.length === 0) return undefined; // blank sentinel
			let found: string | undefined;
			for (const m of rule.members) {
				const isBlank =
					(m.type === CHOICE && m.members.length === 0) ||
					(m.type === SEQ && m.members.length === 0);
				if (isBlank) continue; // blank arm — ignore
				const v = collectFixedLiteral(m);
				if (v === undefined) return undefined; // non-literal or divergent branch
				if (found === undefined) found = v;
				else if (found !== v) return undefined; // two different literals
			}
			return found;
		}
		case SEQ: {
			if (rule.members.length === 0) return undefined; // blank sentinel
			// A seq of a single non-blank member is safe; multi-member seqs are not
			// fixed single literals (they'd produce concatenated output).
			const nonBlanks = rule.members.filter(
				m =>
					!((m.type === CHOICE && m.members.length === 0) ||
					  (m.type === SEQ && m.members.length === 0))
			);
			if (nonBlanks.length !== 1) return undefined;
			const [only] = nonBlanks;
			if (!only) return undefined;
			return collectFixedLiteral(only);
		}
		case TOKEN:
			// token(X) wrapper — recurse into content
			return collectFixedLiteral((rule as { content: Rule<'link'> }).content);
		// PR-P Task 2: TERMINAL case removed — TerminalRule deleted; collectFixedLiteral
		// called on the unwrapped rule directly now (see AssembledPattern.fixedLiteralText).
		default:
			// symbol, alias, pattern, field, repeat, etc. — content-bearing or structural
			return undefined;
	}
}

export class AssembledKeyword extends AssembledLeaf<StringRule<'link'>> {
	readonly modelType = 'keyword' as const;
	readonly resolvedKind?: string;

	constructor(
		kind: string,
		rule: StringRule<'link'>,
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

	/** The literal text this keyword produces (read from the StringRule<'link'>). */
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

export class AssembledToken extends AssembledLeaf<StringRule<'link'> | TokenRule> {
	readonly modelType = 'token' as const;
	readonly resolvedKind?: string;

	constructor(kind: string, rule: StringRule<'link'> | TokenRule, opts?: { kindEntries?: readonly GeneratedKindEntry[] }) {
		super(kind, rule, { hidden: true });
		this.resolvedKind =
			rule.type === STRING ? findGeneratedKindEntry(opts?.kindEntries ?? [], rule.value)?.kind : undefined;
	}
	// No emitFactory — tokens are always hidden, no factoryName.

	/**
	 * Single-literal tokens (StringRule<'link'>) are parameterless — they stamp to
	 * the literal (as const) the same way keywords do. Pattern-based tokens
	 * (TokenRule) carry no single user-visible string and stay
	 * non-parameterless.
	 */
	override get parameterless(): boolean {
		return this.rule.type === STRING;
	}

	/**
	 * Field-context stamp: JSON literal with `as const`.
	 * Only defined when the rule is a string (parameterless case).
	 */
	override get stampExpression(): string | undefined {
		if (this.rule.type !== STRING) return undefined;
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
	 * single string (post-normalize inline of `token(string)` or
	 * `prec(n, string)` wrappers around a bare literal). Returns
	 * `undefined` when the body is a `TokenRule` wrapping pattern-based
	 * content — those don't have a single user-visible string.
	 */
	get text(): string | undefined {
		if (this.rule.type === STRING) return this.rule.value;
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
		return this.rule.type === TOKEN && this.rule.immediate;
	}

	/**
	 * True when the underlying rule is wrapped in a `TokenRule` (either
	 * `token(...)` or `token.immediate(...)`). Used to distinguish bare
	 * string tokens from lexer-hint tokens (e.g. rust's `TOKEN(prec(1,
	 * '<'))` in `type_arguments`). See {@link immediate} for the
	 * adjacency-specific flag.
	 */
	get tokenized(): boolean {
		return this.rule.type === TOKEN;
	}

	/**
	 * Child-context stamp: wrap the single-literal text in a NodeData
	 * object. `$named: false` — tokens are anonymous in tree-sitter's
	 * output (non-word literals like `..` / `=>` never have a named
	 * entry in `node-types.json`).
	 */
	override get stampChildExpression(): string | undefined {
		if (this.rule.type !== STRING) return undefined;
		const kind = JSON.stringify(this.kind);
		const text = JSON.stringify(this.rule.value);
		return `{ $type: ${kind} as const, $text: ${text} as const, $source: 2 as const, $named: false as const }`;
	}
}

export class AssembledEnum extends AssembledLeaf<ChoiceRule<'link'>> {
	readonly modelType = 'enum' as const;
	readonly resolvedKinds: readonly string[];

	constructor(
		kind: string,
		rule: ChoiceRule<'link'>,
		opts?: {
			factoryName?: string;
			irKey?: string;
			kindEntries?: readonly GeneratedKindEntry[];
		}
	) {
		super(kind, rule, opts);
		// PR-P: members are StringRule<'link'> (pre-link) or LINK-SYMBOL (post-link);
		// use literalTextOf for both forms.
		this.resolvedKinds = rule.members
			.map((member) => {
				const text = literalTextOf(member);
				return text !== undefined ? findGeneratedKindEntry(opts?.kindEntries ?? [], text)?.kind : undefined;
			})
			.filter((member): member is string => member !== undefined);
		if (this.values.length < 2) {
			throw new Error(
				`AssembledEnum '${kind}' must have at least two members; normalize single-literal sets upstream to StringRule<'link'>`
			);
		}
	}

	/** The enum member strings (e.g. `['u8', 'u16', 'usize']`). */
	get values(): string[] {
		return [...new Set(this.rule.members.map((m) => literalTextOf(m) ?? '').filter(Boolean))];
	}
}

export class AssembledSupertype extends AssembledNodeBase<SupertypeRule<'link'> | ChoiceRule<'link'>> {
	readonly modelType = 'supertype' as const;
	// #subtypes stores the RESOLVED subtype list (hidden names expanded to
	// their concrete kinds) — this differs from rule.subtypes which carries
	// the raw names as declared in the grammar. Do NOT replace with rule.subtypes.
	readonly #subtypes: string[];

	constructor(kind: string, rule: SupertypeRule<'link'> | ChoiceRule<'link'>, subtypes: string[]) {
		// Supertypes are always hidden — they're dispatch points, not user-constructable nodes.
		super(kind, rule as SupertypeRule<'link'>, { hidden: true });
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

	/** The repeat's inner content type — raw Rule<'link'>, for downstream
	 * consumers that need the element union (types emitter maps this
	 * to a union of TypeNames, inlineRefs hands the whole repeat
	 * back to referrers). */
	get elementRule(): Rule<'link'> {
		return this.rule.content;
	}

	/** `true` when the source rule is `repeat1` (at least one element);
	 * `false` for plain `repeat` (zero-or-more). Referrers thread this
	 * into AssembledNonterminal.nonEmpty. */
	get nonEmpty(): boolean {
		return this.rule.type === REPEAT1;
	}

	/** Separator string from the repeat rule, if any. */
	get separator(): string | undefined {
		// this.rule.separator is Rule<'link'>-phase-parameterized;
		// extractSeparatorString reads the structurally identical normalize-phase
		// shape (RepeatRule<'link'> shares RuleBase<'normalize'>.separator's shape
		// post-PR-S) — cast the phase view.
		return extractSeparatorString(this.rule.separator as RuleBase<'normalize'>['separator']);
	}

	/** Whether a trailing separator is permitted. */
	get trailing(): boolean | undefined {
		return this.rule.separator?.trailing;
	}

	/** Whether a leading separator is permitted. */
	get leading(): boolean | undefined {
		return this.rule.separator?.leading;
	}
}

export class AssembledGroup extends AssembledNodeBase<Rule<'link'>> {
	readonly modelType = 'group' as const;
	// rule typed as Rule<'link'> — groups can carry GroupRule<'link'> (pre-unwrap),
	// SeqRule<'link'>/ChoiceRule<'link'> after unwrapGroupRuleAndSimplified(), or any
	// Rule<'link'> when constructed as polymorph forms (form.content can be
	// any Rule<'link'> type).
	/** See `AssembledBranch.simplifiedRule`. */
	readonly simplifiedRule: SimplifiedRule;
	/** See `AssembledBranch.renderRule`. Sourced from `normalized.normalizedRules[kind]` at assemble time. */
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
	 * of `.fields` directly.
	 */
	readonly slots: Readonly<Record<string, AssembledNonterminal>>;

	constructor(
		kind: string,
		rule: Rule<'link'>,
		simplifiedRule: SimplifiedRule,
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
			simplifiedRule,
			{ kindName: kind, kindEntries: opts?.kindEntries, collision: opts?.parseKindCollisionContext },
			renderRule
		);
	}

	// Cycle guard for the parameterless getter. Same rationale as AssembledBranch.
	// No memoization — see AssembledBranch comment.
	#computing = false;

	// Node map back-reference for pre-hydration UnresolvedRef resolution.
	// See AssembledBranch.#nodes for full rationale.
	#nodes: ReadonlyMap<string, AssembledNodeBase<Rule<'link'>>> | undefined = undefined;

	/**
	 * Attach the assembled node map so the `parameterless` getter can resolve
	 * UnresolvedRef slots by name before `hydrateSlotRefs` runs. See
	 * {@link AssembledBranch.attachNodeMap} for full documentation.
	 */
	attachNodeMap(nodes: ReadonlyMap<string, AssembledNodeBase<Rule<'link'>>>): void {
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
		return allSlots.every((s) => _isAutoStampSlotForParameterless(s, { nodes: this.#nodes }));
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
}

export type AssembledNode =
	| AssembledBranch
	| AssembledPattern
	| AssembledKeyword
	| AssembledToken
	| AssembledEnum
	| AssembledSupertype
	| AssembledGroup
	| AssembledMulti;

// ============================================================================
// 5. Canonical structural-view helpers
// ============================================================================
//
// Branch and Group expose `.fields` directly; non-structural kinds
// (leaf/keyword/token/enum/supertype/multi) have no structural surface.
// These helpers narrow over `AssembledNode` and give consumers one
// canonical entry point per fact.

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
