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

import {
	ALIAS,
	CHOICE,
	DEDENT,
	FIELD,
	GROUP,
	INDENT,
	NEWLINE,
	OPTIONAL,
	PATTERN,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SUPERTYPE,
	SYMBOL,
	TOKEN,
	VARIANT
} from '../../types/rule-types.ts'; // @rule-type-consts
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
	TokenRule,
	SupertypeRule,
	Multiplicity,
	RuleId,
	SeparatorFlankMode
} from '../../types/rule.ts';
import { isSeq, isField, literalTextOf, isEnumChoiceRule, isLinkSymbol } from '../../types/rule.ts';
import { isStringType } from '../../types/runtime-shapes.ts';
import type { RuleMetadata } from '../../types/rule-metadata-brand.ts';
import type { GeneratedKindEntry } from '../generated-metadata.ts';
import { findEntryForKindName, findEntryForLiteralText } from '../generated-metadata.ts';
import { tokenToName } from '../normalize.ts';
import { collectSlots, drainSynthesizedUnionChoiceIds, setUnionSlotRouting } from '../collect-slots.ts';
import { assertNever } from '../../polymorph-variant.ts';
import { opaqueFacts, type OpaqueFacts } from '../opaque-facts.ts';
import { deleteWrapper } from '../wrapper-deletion.ts';
import {
	diagnoseParseKindCollisions,
	type ParseKindCollisionDiagnostic,
	type ParseKindCollisionValue
} from '../../types/parsekind-collisions.ts';
import { describeDeriveShape, type DeriveShapeDiagnostic } from '../diagnostics/derive-shapes.ts';

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
		while (
			unwrapped.type === OPTIONAL ||
			unwrapped.type === VARIANT ||
			unwrapped.type === GROUP ||
			unwrapped.type === TOKEN
			// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule<'link'> union.
		) {
			unwrapped = (unwrapped as { content: Rule<'link'> }).content;
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

export function setOptionalBodyKinds(kinds: ReadonlySet<string> | null): void {
	currentOptionalBodyKinds = kinds;
}

function isOptionalBodyKind(kindName: string): boolean {
	return currentOptionalBodyKinds !== null && currentOptionalBodyKinds.has(kindName);
}

function relaxForOptionalBody(refName: string, multiplicity: Multiplicity): Multiplicity {
	if (multiplicity !== 'single') return multiplicity;
	const cleanName = refName.replace(/^_+/, '') || refName;
	if (isOptionalBodyKind(refName) || isOptionalBodyKind(cleanName)) return 'optional';
	return multiplicity;
}

// ============================================================================
// 2. Slot model & derivation
// ============================================================================

export interface UnresolvedRef {
	readonly kind: 'unresolved-ref';
	readonly name: string;
}

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
	// Node-reference target. Present for true references; absent for inline
	// literals (which carry `value` instead). Mutually exclusive with `value`.
	readonly node?: T | UnresolvedRef;
	// Parser kind id of the storage/render kind (`node`'s name), stamped at
	// mint through the shared name chain (KindId-NodeRefs design §2.1/PR-K2).
	// Absent for id-less targets by design: enrich-synthesized markers,
	// IR-only enum kinds, tree-sitter-erased hidden supertypes. Ids are
	// stamped FACTS, never identity — node identity stays the name, and
	// serialization (node-model.json5) never carries ids.
	readonly storageKindId?: number;
	// Inline string literal text (e.g. `'const'`, `'pub'`, an enum member /
	// pattern-matched anonymous token). Mutually exclusive with `node`.
	readonly value?: string;
	// For a literal: the resolved CST kind name the literal text maps to (a
	// catalog anon/hidden kind), when one exists. Absent for genuinely-kindless
	// literals (regex patterns / residual). Carried for transport/typing;
	// render still emits from `value`.
	readonly resolvedKind?: string;
	// Parser kind id alongside `resolvedKind`, resolved through the LITERAL
	// (anon-scoped) chain at mint — the anon token wins over a same-spelled
	// NAMED rule (#129 class). Same stamped-fact semantics as
	// `storageKindId`.
	readonly resolvedKindId?: number;
	// Parse-as kind ref (§7.3 / §4g, PR-A front-load): the CST kind this value
	// surfaces under — the alias TARGET when aliased (`rule.name`), else the
	// own kind. Differs from `node` (render/source = `aliasedFrom ?? rule.name`)
	// only for aliased/variant values. `storageName`/`parseNames` project this.
	readonly parseKind?: UnresolvedRef;
	// Parser kind id of the wire `$type` (`parseKind`'s name). Same stamped-
	// fact semantics as `storageKindId`.
	readonly parseKindId?: number;
	// Field-label routing key (union-slot design §5, PR 1.5): set when this
	// value came from a DEGENERATE fielded arm of a union-routed choice
	// (`partitionChoiceArms`'s `degenerateNamedArms`) — tree-sitter labels
	// this child by FIELD NAME, not by kind, so `parseKind` alone would route
	// it wrong. Absent for plain union-member (by-kind) values. `parseNames`
	// projects `parseName ?? parseKind?.name` per value, so the union slot's
	// routing keys become `fieldLabels ∪ kinds`.
	readonly parseName?: string;
	readonly multiplicity: Multiplicity;
	readonly separator?: string;
	readonly trailing?: boolean;
	readonly leading?: boolean;
	// Literal-only token-wrapper flags (see interface doc).
	readonly immediate?: boolean;
	readonly tokenized?: boolean;
}

export type NodeOrTerminal = NodeRef;

export function isNodeRef(v: NodeOrTerminal): v is NodeRef & { node: AssembledNode | UnresolvedRef } {
	return v.node !== undefined;
}

export function isTerminalValue(v: NodeOrTerminal): v is NodeRef & { value: string } {
	return v.value !== undefined;
}

export function isUnresolvedRef(v: NodeRef['node']): v is UnresolvedRef {
	return typeof v === 'object' && (v as { kind?: unknown }).kind === 'unresolved-ref';
}

// ---------------------------------------------------------------------------
// Derived slot-level helpers (DRY: one derivation, not stored flags)
// ---------------------------------------------------------------------------

export function isRequired(slot: { values: readonly NodeOrTerminal[] }): boolean {
	return (
		slot.values.length > 0 &&
		slot.values.every((v) => v.multiplicity === 'single' || v.multiplicity === 'nonEmptyArray')
	);
}

export function isMultiple(slot: { values: readonly NodeOrTerminal[] }): boolean {
	return slot.values.some((v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray');
}

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

const RESERVED_ACCESSOR_NAMES: ReadonlySet<string> = new Set([
	'constructor',
	'toString',
	'valueOf',
	'hasOwnProperty',
	'isPrototypeOf',
	'propertyIsEnumerable',
	'toLocaleString',
	'__proto__'
]);

export function snakeToCamel(name: string): string {
	const camel = name.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
	return RESERVED_ACCESSOR_NAMES.has(camel) ? `${camel}_` : camel;
}

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
			ruleId: rule.id
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
function isTokenLikeChoiceMember(m: Rule<'link'>): boolean {
	const peel = (r: Rule<'link'>): Rule<'link'> =>
		r.type === ALIAS ? peel(r.content) : r.type === TOKEN ? peel(r.content) : r.type === VARIANT ? peel(r.content) : r;
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

function isFlatSymbolSeqOrTokenLike(m: Rule<'link'>): boolean {
	if (m.type === SEQ) {
		return m.members.every(isTokenLikeChoiceMember);
	}
	return isTokenLikeChoiceMember(m);
}

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
		const kindName = ctx?.kindName ?? currentAuditKind;
		let slots = mergeSlotsByName(collectSlots(canonical, kindName, ctx?.kindEntries));
		// Gate (a) of the union-slot design (2026-07-21): a synthesized union
		// slot's projected storageName (usually 'content', or the single member
		// kind) must be unclaimed by every sibling slot of the rule. This is the
		// only place with whole-rule visibility, so the check runs here: an
		// optimistic collection above, then — on collision — one pessimistic
		// rerun with routing disabled (status quo distribution) + a diagnostic.
		// Two qualifying choices in one rule collide with each other and both
		// fall back, which subsumes the "only one choice per rule" discipline.
		const unionChoiceIds = drainSynthesizedUnionChoiceIds();
		if (unionChoiceIds.size > 0) {
			const isUnionSlot = (s: AssembledNonterminal): boolean => s.sourceRuleIds.some((id) => unionChoiceIds.has(id));
			const colliding = slots.filter(
				(s) => isUnionSlot(s) && slots.some((other) => other !== s && other.storageName === s.storageName)
			);
			if (colliding.length > 0) {
				recordAssembleWarning({
					code: 'union-slot-content-collision',
					ownerKind: kindName,
					message:
						`[derive-slots] kind '${kindName ?? '(unknown)'}': union slot name(s) ` +
						`[${[...new Set(colliding.map((s) => s.storageName))].join(', ')}] already claimed by a sibling ` +
						`slot — union routing disabled for this rule (status-quo distribution). Free the name via ` +
						`field() naming in overrides (named slots bypass the claim).`
				});
				const prev = setUnionSlotRouting(false);
				try {
					slots = mergeSlotsByName(collectSlots(canonical, kindName, ctx?.kindEntries));
				} finally {
					setUnionSlotRouting(prev);
					drainSynthesizedUnionChoiceIds();
				}
			}
		}
		return slots;
	} finally {
		setAuditKindContext(prevAuditKind);
	}
}

function mergeSlotsByName(fields: AssembledNonterminal[]): AssembledNonterminal[] {
	if (fields.length <= 1) return fields;
	const out: AssembledNonterminal[] = [];
	const namedIndexByName = new Map<string, number>();
	for (const f of fields) {
		if (f.isUnnamed) {
			// Positional/kind-derived name: never silently merge with anything else
			// sharing that name — mirrors collect-slots.ts's mergeByName (same bug
			// class, a different location in the pipeline). Two unnamed slots
			// sharing a kind-derived name are genuinely distinct positions, not
			// "the same field appearing twice" (this function's actual documented
			// purpose — see the if_statement.alternative example above).
			out.push(f);
			continue;
		}
		const idx = namedIndexByName.get(f.name);
		if (idx === undefined) {
			namedIndexByName.set(f.name, out.length);
			out.push(f);
			continue;
		}
		const existing = out[idx]!;
		out[idx] = existing.with({
			values: dedupeValues([...existing.values, ...f.values]),
			hasTrailing: existing.hasTrailing || f.hasTrailing,
			hasLeading: existing.hasLeading || f.hasLeading,
			sourceRuleIds: mergeSourceRuleIds(existing.sourceRuleIds, f.sourceRuleIds)
		});
	}
	return out;
}

export interface ParseKindCollisionContext {
	readonly ruleSignatures: Readonly<Record<string, string>>;
}

export interface DeriveCtx {
	readonly kindEntries?: readonly GeneratedKindEntry[];
	readonly kindName?: string;
	readonly collision?: ParseKindCollisionContext;
	readonly visibleAliasTargets?: ReadonlyMap<string, readonly string[]>;
	readonly simplifiedRules?: Record<string, SimplifiedRule>;
	readonly nodes?: ReadonlyMap<string, AssembledNodeBase<Rule<'link'>>>;
	readonly stampArmFieldNamesAsParseName?: boolean;
}

export interface KindedDeriveCtx extends DeriveCtx {
	readonly kindName: string;
}

export function buildParseKindRuleSignatures<T extends Rule<'link'>>(
	rules: Readonly<Record<string, T>>
): Readonly<Record<string, string>> {
	return Object.fromEntries(Object.entries(rules).map(([kind, rule]) => [kind, canonicalRuleSignature(rule)]));
}

export function storageKindOfRef(node: AssembledNode | UnresolvedRef): string {
	return isUnresolvedRef(node) ? node.name : node.kind;
}

export function storageKindOfValue(value: NodeOrTerminal): string | undefined {
	if (isNodeRef(value)) {
		return storageKindOfRef(value.node);
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

function resolveParseKindCollisionsInSlot(slot: AssembledNonterminal, ctx: KindedDeriveCtx): AssembledNonterminal {
	const describedValues: ParseKindCollisionValue<NodeOrTerminal>[] = slot.values.map((value) => {
		const storageKind = storageKindOfValue(value);
		return {
			original: value,
			parseKind: value.parseKind?.name,
			storageKind,
			// PR-K3e: mint stamps as collision-free identities — terminals carry
			// theirs on resolvedKindId (the literal-chain stamp), node refs on
			// storageKindId. Absent stamps fall back to name keying in the core.
			parseKindId: value.parseKindId,
			storageKindId: isNodeRef(value) ? value.storageKindId : value.resolvedKindId,
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
		nextValues.length === slot.values.length && nextValues.every((value, index) => value === slot.values[index]);
	return unchanged ? slot : slot.with({ values: dedupeValues(nextValues) });
}

function structuralSignatureOfValue(value: NodeOrTerminal, ctx: DeriveCtx, storageKind: string | undefined): string {
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

function structuralSignatureOfStorageKind(storageKind: string | undefined, ctx: DeriveCtx): string {
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

export function extractSeparatorString(sep: RuleBase<'normalize'>['separator']): string | undefined {
	if (sep === undefined) return undefined;
	if (isStringType(sep.value.type)) {
		const v = (sep.value as { value: string }).value;
		return v || undefined;
	}
	return undefined;
}

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

export function deriveSlots(rule: Rule<'link'>, ctx?: DeriveCtx): readonly AssembledNonterminal[] {
	// The field walker handles positional symbol/supertype/choice content
	// too, so it produces every slot — no separate children walker needed.
	return _deriveSlotsInternal(rule, ctx);
}

export function isSyntheticFieldWrapper(content: Rule<'link'>): boolean {
	if (content.type === REPEAT || content.type === REPEAT1) {
		return isSyntheticFieldWrapper(content.content);
	}
	if (!isSeq(content)) return false;
	return content.members.some(isField);
}

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
				// The value is the literal text, so its id resolves through the
				// LITERAL chain (anon token wins a same-spelled NAMED rule);
				// `resolvedKind`/`parseKind` keep the link-minted alias-target
				// NAME (`rule.name`) as before — ids are stamped facts, not a
				// re-derivation of the name (KindId-NodeRefs §2.1).
				const entry = findEntryForLiteralText(ctx?.kindEntries ?? [], rule.literal);
				return [
					{
						value: rule.literal,
						resolvedKind: rule.name,
						resolvedKindId: entry?.id,
						parseKind: { kind: 'unresolved-ref', name: rule.name },
						parseKindId: entry?.parseId ?? entry?.id,
						multiplicity
					}
				];
			}
			// Ref kind: resolve to SOURCE kind (`aliasedFrom`, when the
			// symbol came from an alias). Only source kinds exist in
			// rules post-synthesis-removal.
			const refName = rule.aliasedFrom ?? rule.name;
			const storageEntry = findEntryForKindName(ctx?.kindEntries ?? [], refName);
			const parseEntry = refName === rule.name ? storageEntry : findEntryForKindName(ctx?.kindEntries ?? [], rule.name);
			return [
				{
					node: { kind: 'unresolved-ref', name: refName },
					storageKindId: storageEntry?.id,
					// parse-as kind = the alias TARGET (`rule.name`); `node` is the
					// render/source (`refName`). For `_suite`: node=_simple_statements,
					// parseKind=block (the CST kind). §7.3 / §4g.
					// `parseEntry.parseId` (falling back to `.id`) — an alias
					// occurrence carries its OWN distinct runtime symbol id,
					// separate from the source rule's storage id; dispatch must
					// key on that, not the storage identity.
					parseKind: { kind: 'unresolved-ref', name: rule.name },
					parseKindId: parseEntry?.parseId ?? parseEntry?.id,
					multiplicity: relaxForOptionalBody(refName, multiplicity)
				}
			];
		}
		case SUPERTYPE:
			// Supertype refs expand to their subtype list — each subtype is a
			// valid concrete kind the slot can hold.
			return rule.subtypes.map((name) => {
				const entry = findEntryForKindName(ctx?.kindEntries ?? [], name);
				// Aliased arm: the flatten stamped the parse name the arm
				// displays under (`subtypeParseNames`); its catalog row carries
				// the alias occurrence's own runtime id, which is what dispatch
				// must key on — mirrors the SYMBOL case's aliasedFrom/name pair
				// above.
				const parseName = rule.subtypeParseNames?.[name];
				const parseEntry = parseName === undefined ? entry : findEntryForKindName(ctx?.kindEntries ?? [], parseName);
				return {
					node: { kind: 'unresolved-ref' as const, name },
					storageKindId: entry?.id,
					parseKind: { kind: 'unresolved-ref' as const, name: parseName ?? name },
					parseKindId: parseEntry?.parseId ?? parseEntry?.id ?? entry?.parseId ?? entry?.id,
					multiplicity: relaxForOptionalBody(name, multiplicity)
				};
			});
		case STRING:
		// A `pattern` is a NONTERMINAL slot (classifyByType), but its VALUE is the
		// anonymous-token text it matches — a terminal value, like a `string` or an
		// `enum` member. Without this case it fell to `default: return []`, so a
		// pattern slot had no values and was elided (e.g. token_repetition's
		// separator pattern never became a slot).
		case PATTERN: {
			const entry = findEntryForLiteralText(ctx?.kindEntries ?? [], rule.value);
			const rk = entry?.kind;
			return [
				{
					value: rule.value,
					resolvedKind: rk,
					resolvedKindId: entry?.id,
					parseKind: rk !== undefined ? { kind: 'unresolved-ref', name: rk } : undefined,
					parseKindId: entry?.parseId ?? entry?.id,
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
					// Literal-first chain (#129); for literal-carrying SYMBOL
					// members whose text has no anon-token catalog row (an
					// aliased fixed-text external — `automatic_semicolon`'s
					// '\n' render text is not a parse literal), fall back to
					// the member's own KIND entry: the parser emits the kind,
					// so its id is the wire tag the enum must accept.
					const symName = isLinkSymbol(m) ? m.name : undefined;
					const entry =
						(text ? findEntryForLiteralText(ctx?.kindEntries ?? [], text) : undefined) ??
						(symName !== undefined ? findEntryForKindName(ctx?.kindEntries ?? [], symName) : undefined);
					const rk = entry?.kind ?? symName;
					return {
						value: text,
						resolvedKind: rk,
						resolvedKindId: entry?.id,
						parseKind: rk !== undefined ? { kind: 'unresolved-ref' as const, name: rk } : undefined,
						parseKindId: entry?.parseId ?? entry?.id,
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
				(r.type === CHOICE && r.members.length === 0) || (r.type === SEQ && r.members.length === 0);
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
			if (!ctx?.stampArmFieldNamesAsParseName) {
				return nonBlank.flatMap((m) => deriveValuesForRule(m, ctx, armMult));
			}
			// Union-slot design §5 (PR 1.5): this CHOICE is the SANCTIONED
			// union-routing restriction (collect-slots.ts builds it from
			// `unionArms ∪ degenerateNamedArms` only) — a member carrying its
			// OWN `fieldName` directly (post-wrapper-deletion push-down; a
			// degenerate fielded arm, not a genuine FIELD wrapper) is routed by
			// FIELD LABEL at read time, not by kind. Stamp `parseName` so
			// `projectSlotNaming`'s parseNames union in the label alongside the
			// plain union arms' kinds.
			return nonBlank.flatMap((m) => {
				const values = deriveValuesForRule(m, ctx, armMult);
				const fieldName = (m as { fieldName?: string }).fieldName;
				return fieldName === undefined ? values : values.map((v) => ({ ...v, parseName: fieldName }));
			});
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
			return inner.map((v) => (v.multiplicity === 'nonEmptyArray' ? { ...v, multiplicity: 'array' as const } : v));
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

export function dedupeValues(values: NodeOrTerminal[]): NodeOrTerminal[] {
	const seen = new Set<string>();
	const result: NodeOrTerminal[] = [];
	for (const v of values) {
		const parseKind = v.parseKind?.name ?? '';
		const nodeName = isNodeRef(v) ? storageKindOfRef(v.node) : undefined;
		// `parseName` (union-slot design §5, PR 1.5) is a SEPARATE routing key
		// from `parseKind` — two degenerate arms of the same kind but different
		// field labels are distinct entries (tree-sitter routes them by field,
		// not by kind), so it must ride in the dedup key too. Always `''` for
		// every pre-PR-1.5 value, so existing dedup behavior is unchanged.
		const key = isNodeRef(v)
			? `node-ref:${nodeName ?? '?'}:${parseKind}:${v.multiplicity}:${v.parseName ?? ''}`
			: `terminal:${v.value ?? ''}:${parseKind}:${v.multiplicity}:${v.parseName ?? ''}`;
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

function prepareKindForPascalCase(normalized: string): string {
	return normalized.replace(/^_+/, '').replace(/__+/g, '_U_');
}

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

	get parameterless(): boolean {
		return false;
	}

	get stampExpression(): string | undefined {
		return undefined;
	}

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

	get hidden(): boolean {
		return this.factoryName === undefined;
	}

	get rawFactoryName(): string | undefined {
		if (this.factoryName === undefined) return undefined;
		return `build${this.typeName}`;
	}

	get treeTypeName(): string {
		return `${this.typeName}Tree`;
	}

	get configTypeName(): string {
		return `${this.typeName}Config`;
	}

	get fromInputTypeName(): string {
		return `Loose${this.typeName}`;
	}

	get fromFunctionName(): string | undefined {
		if (this.factoryName === undefined) return undefined;
		return `coerceTo${this.typeName}`;
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

export interface AssembledNonterminalInit {
	readonly values: readonly NodeOrTerminal[];
	readonly fieldName?: string;
	readonly hasTrailing: boolean;
	readonly hasLeading: boolean;
	readonly sourceRuleIds: readonly RuleId[];
	readonly metadata?: OpaqueFacts;
	readonly ruleMetadata?: RuleMetadata;
	storageInfo?: FieldStorageInfo;
}

export function mergeSourceRuleIds(...groups: readonly (readonly RuleId[] | undefined)[]): readonly RuleId[] {
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

export class AssembledNonterminal {
	readonly values: readonly NodeOrTerminal[];
	readonly fieldName?: string;
	readonly hasTrailing: boolean;
	readonly hasLeading: boolean;
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

	get storageName(): string {
		return projectSlotNaming(this).storageName;
	}
	get name(): string {
		return projectSlotNaming(this).name;
	}
	get configKey(): string {
		return projectSlotNaming(this).configKey;
	}
	get propertyName(): string {
		return projectSlotNaming(this).propertyName;
	}
	get paramName(): string {
		return projectSlotNaming(this).paramName;
	}
	get parseNames(): readonly string[] {
		return projectSlotNaming(this).parseNames;
	}
	get isUnnamed(): boolean {
		return this.fieldName === undefined;
	}
	get arity(): 'one' | 'many' {
		return isMultiple(this) ? 'many' : 'one';
	}
	get storageKey(): string {
		return `_${this.storageName}`;
	}

	constructor(init: AssembledNonterminalInit) {
		this.values = init.values;
		this.fieldName = init.fieldName;
		this.hasTrailing = init.hasTrailing;
		this.hasLeading = init.hasLeading;
		this.sourceRuleIds = init.sourceRuleIds;
		this.metadata = init.metadata ?? opaqueFacts({});
		this.ruleMetadata = init.ruleMetadata;
		this.storageInfo = init.storageInfo;
	}

	with(overrides: Partial<AssembledNonterminalInit>): AssembledNonterminal {
		return new AssembledNonterminal({
			values: this.values,
			fieldName: this.fieldName,
			hasTrailing: this.hasTrailing,
			hasLeading: this.hasLeading,
			sourceRuleIds: this.sourceRuleIds,
			metadata: this.metadata,
			ruleMetadata: this.ruleMetadata,
			storageInfo: this.storageInfo,
			...overrides
		});
	}
}

export function kindsOf(slot: AssembledNonterminal): readonly string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const v of slot.values) {
		if (!isNodeRef(v)) continue;
		const name = storageKindOfRef(v.node);
		if (!seen.has(name)) {
			seen.add(name);
			out.push(name);
		}
	}
	return out;
}

export function storageKindIdByNameOf(slot: { values: readonly NodeOrTerminal[] }): ReadonlyMap<string, number> {
	const out = new Map<string, number>();
	for (const v of slot.values) {
		if (!isNodeRef(v) || v.storageKindId === undefined) continue;
		const name = storageKindOfRef(v.node);
		if (!out.has(name)) out.set(name, v.storageKindId);
	}
	return out;
}

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

function valueParseNamesOf(slot: { values: readonly NodeOrTerminal[] }): readonly string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const value of slot.values) {
		const name = value.parseName ?? value.parseKind?.name;
		if (name === undefined || seen.has(name)) continue;
		seen.add(name);
		out.push(name);
	}
	return out;
}

export function valueParseLabelsOf(slot: { values: readonly NodeOrTerminal[] }): readonly string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const value of slot.values) {
		const name = value.parseName;
		if (name === undefined || seen.has(name)) continue;
		seen.add(name);
		out.push(name);
	}
	return out;
}

export function aliasTargetToSourceMapOf(slot: {
	values: readonly NodeOrTerminal[];
}): Readonly<Record<string, string>> {
	const out: Record<string, string> = {};
	for (const value of slot.values) {
		if (!isNodeRef(value)) continue;
		const parseKind = value.parseKind?.name;
		const sourceKind = storageKindOfRef(value.node);
		if (parseKind === undefined || parseKind === sourceKind) continue;
		out[parseKind] = sourceKind;
	}
	return out;
}

export function acceptedIdPairsByKindOf(slot: {
	values: readonly NodeOrTerminal[];
}): ReadonlyMap<string, readonly number[]> {
	const out = new Map<string, number[]>();
	for (const value of slot.values) {
		if (!isNodeRef(value)) continue;
		const kind = storageKindOfRef(value.node);
		for (const id of [value.storageKindId, value.parseKindId]) {
			if (id === undefined) continue;
			const ids = out.get(kind);
			if (ids === undefined) {
				out.set(kind, [id]);
			} else if (!ids.includes(id)) {
				ids.push(id);
			}
		}
	}
	return out;
}

export interface SlotNamingInputs {
	readonly fieldName?: string;
	readonly values: readonly NodeOrTerminal[];
}

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
	const parseNames = slot.fieldName !== undefined ? [slot.fieldName] : valueParseNamesOf(slot);
	// storageName derives from the STORAGE / render-source kind (`value.node` —
	// how the value is stored and keyed via `drillAs`), NOT `parseKind`. The two
	// projections are parallel and must NOT cross: storageKind→storageName,
	// parseKind→parseNames. `distinctStorageKinds` mirrors `kindsOf` (node-ref
	// values' source kind). A slot whose values share ONE storage kind is named
	// after it; a multi-storage-kind slot — e.g. `_suite`'s
	// `{_simple_statements, block, _newline}` (all `parseKind=block`) — falls back
	// to the generic `content` (the parseName `block` is NOT its storage name).
	// Storage kinds from node-ref values (the render-source kind via `value.node`).
	const nodeRefStorageKinds = [...new Set(slot.values.filter(isNodeRef).map((v) => storageKindOfRef(v.node)))];
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
	const hasUnnamedValue = slot.fieldName === undefined && slot.values.some((v) => v.parseKind?.name === undefined);
	const storageName =
		slot.fieldName ??
		(distinctStorageKinds.length === 1 && !hasUnnamedValue
			? distinctStorageKinds[0]!.replace(/^_+/, '') || distinctStorageKinds[0]!
			: 'content');
	const configKey = snakeToCamel(storageName);
	const isMulti = slot.values.some((v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray');
	const propertyName = isMulti ? pluralize(configKey) : configKey;
	return {
		storageName,
		name: storageName,
		configKey,
		propertyName,
		paramName: safeParamName(propertyName),
		parseNames
	};
}

// --- Concrete classes per model type ---

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
		if (pk0 === undefined) {
			out.push(slot);
			continue;
		}
		// Drop this slot — values are already covered by the array slot.
		// Nothing to merge since the parseKinds are identical and the array
		// slot already accepts them at the native reader level.
		void pk0;
		// Intentionally not pushing to out — this slot is folded away.
		void toMergeIntoArraySlot; // suppress unused-var lint: map is populated below if needed
	}
	return out;
}

function expandSlotWithVisibleAliasSources(slot: AssembledNonterminal, ctx: KindedDeriveCtx): AssembledNonterminal {
	// Only expand unnamed (kind-routed) slots.
	if (slot.fieldName !== undefined) return slot;

	// Look up the owning kind as a VISIBLE ALIAS TARGET.
	// `token_tree → [delim_token_tree]` means `delim_token_tree` is aliased TO `token_tree`.
	// We need to derive the concrete children of each source kind and add them as extra values.
	const sources = ctx.visibleAliasTargets?.get(ctx.kindName);
	if (!sources || sources.length === 0) return slot;

	// Use the dominant multiplicity of this slot's values for the expansion.
	const dominantMult = slot.values.reduce<Multiplicity>((acc, v) => {
		if (v.multiplicity === 'nonEmptyArray' || v.multiplicity === 'array') return v.multiplicity;
		if (acc === 'single' && v.multiplicity === 'optional') return 'optional';
		return acc;
	}, 'single');

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
				sourceRuleIds: mergeSourceRuleIds(existing.sourceRuleIds, renderSlot.sourceRuleIds)
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
	for (const slot of resolvedSlots) {
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

function _isAutoStampSlotForParameterless(slot: AssembledNonterminal, ctx?: DeriveCtx): boolean {
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
			buildSlotsRecord(
				simplifiedRule,
				{
					kindName: kind,
					kindEntries: opts?.kindEntries,
					collision: opts?.parseKindCollisionContext,
					visibleAliasTargets: opts?.visibleAliasTargets,
					simplifiedRules: opts?.simplifiedRules
				},
				renderRule
			);
	}

	get slots(): Readonly<Record<string, AssembledNonterminal>> {
		return this._slots;
	}

	get members(): readonly Rule<'link'>[] {
		const r = this.rule;
		return r.type === SEQ || r.type === CHOICE ? r.members : [];
	}

	get separator(): string | undefined {
		return undefined;
	}

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

	attachNodeMap(nodes: ReadonlyMap<string, AssembledNodeBase<Rule<'link'>>>): void {
		this.#nodes = nodes;
	}

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

	override get stampExpression(): string | undefined {
		const fn = this.rawFactoryName;
		return this.parameterless && fn ? `${fn}()` : undefined;
	}

	get fields(): readonly AssembledNonterminal[] {
		return Object.values(this.slots);
	}
}

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

export class AssembledPattern extends AssembledLeaf<Rule<'link'>> {
	readonly modelType = 'pattern' as const;

	constructor(kind: string, rule: Rule<'link'>, opts?: { factoryName?: string; irKey?: string }) {
		super(kind, rule, opts);
	}

	get pattern(): string | undefined {
		return this.rule.type === PATTERN ? this.rule.value || undefined : undefined;
	}

	get fixedLiteralText(): string | undefined {
		if (this.rule.type === PATTERN) return undefined; // regex — always content-bearing
		// Terminal-shape rule: walk the content tree collecting all non-blank string leaves.
		return collectFixedLiteral(this.rule);
	}
}

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
				const isBlank = (m.type === CHOICE && m.members.length === 0) || (m.type === SEQ && m.members.length === 0);
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
				(m) => !((m.type === CHOICE && m.members.length === 0) || (m.type === SEQ && m.members.length === 0))
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
		this.resolvedKind = findEntryForLiteralText(opts?.kindEntries ?? [], rule.value)?.kind;
	}

	get text(): string {
		return this.rule.value;
	}

	override get parameterless(): boolean {
		return true;
	}

	override get stampExpression(): string {
		return `${JSON.stringify(this.rule.value)} as const`;
	}

	override get stampChildExpression(): string {
		const kind = JSON.stringify(this.kind);
		const text = JSON.stringify(this.rule.value);
		return `{ $type: ${kind} as const, $text: ${text} as const, $source: 2 as const, $named: true as const }`;
	}
}

export class AssembledToken extends AssembledLeaf<StringRule<'link'> | TokenRule> {
	readonly modelType = 'token' as const;
	readonly resolvedKind?: string;

	constructor(
		kind: string,
		rule: StringRule<'link'> | TokenRule,
		opts?: { kindEntries?: readonly GeneratedKindEntry[] }
	) {
		super(kind, rule, { hidden: true });
		this.resolvedKind =
			rule.type === STRING ? findEntryForLiteralText(opts?.kindEntries ?? [], rule.value)?.kind : undefined;
	}
	// No emitFactory — tokens are always hidden, no factoryName.

	override get parameterless(): boolean {
		return this.rule.type === STRING;
	}

	override get stampExpression(): string | undefined {
		if (this.rule.type !== STRING) return undefined;
		return `${JSON.stringify(this.rule.value)} as const`;
	}

	get text(): string | undefined {
		if (this.rule.type === STRING) return this.rule.value;
		return undefined;
	}

	get immediate(): boolean {
		return this.rule.type === TOKEN && this.rule.immediate;
	}

	get tokenized(): boolean {
		return this.rule.type === TOKEN;
	}

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
	/**
	 * Per-member-TEXT catalog resolution, derived ONCE at construction
	 * through the literal chain (PR-K3a). Key = member text; value = the
	 * resolved catalog kind + parser id. First-wins on duplicate texts
	 * (mirrors the `values` getter's Set dedupe). Emitters read this
	 * instead of re-running `findKindEntryForLiteral` per site — the same
	 * stamped-fact discipline as `NodeRef.resolvedKindId` (spec §2.3),
	 * carried node-level because enum members are not NodeRefs.
	 */
	readonly resolvedByText: ReadonlyMap<string, { readonly kind: string; readonly id: number }>;

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
		// use literalTextOf for both forms. ONE literal-chain pass feeds both
		// the legacy resolvedKinds list (duplicates preserved) and the
		// per-text map.
		const resolved: string[] = [];
		const byText = new Map<string, { kind: string; id: number }>();
		for (const member of rule.members) {
			const text = literalTextOf(member);
			if (text === undefined) continue;
			// Literal-first chain (#129); literal-carrying SYMBOL members whose
			// text is a RENDER literal with no anon-token row (aliased fixed-
			// text externals — `automatic_semicolon`'s '\n') resolve through
			// their own KIND entry instead: the parser emits the kind, so its
			// id is the wire tag the enum dispatches on.
			const entry =
				findEntryForLiteralText(opts?.kindEntries ?? [], text) ??
				(isLinkSymbol(member) ? findEntryForKindName(opts?.kindEntries ?? [], member.name) : undefined);
			if (entry === undefined) continue;
			resolved.push(entry.kind);
			if (!byText.has(text)) byText.set(text, { kind: entry.kind, id: entry.id });
		}
		this.resolvedKinds = resolved;
		this.resolvedByText = byText;
		if (this.values.length < 2) {
			throw new Error(
				`AssembledEnum '${kind}' must have at least two members; normalize single-literal sets upstream to StringRule<'link'>`
			);
		}
	}

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

	get subtypes(): string[] {
		return this.#subtypes;
	}

	get subtypeParseNames(): Readonly<Record<string, string>> | undefined {
		return this.rule.type === SUPERTYPE ? this.rule.subtypeParseNames : undefined;
	}
}

export class AssembledMulti extends AssembledNodeBase<RepeatRule | Repeat1Rule> {
	readonly modelType = 'multi' as const;
	// rule narrowed — multis are hidden repeat helpers. Classifier
	// routes repeat / repeat1 shapes here when the hidden rule's
	// top-level content is a repeat.

	constructor(kind: string, rule: RepeatRule | Repeat1Rule, opts?: { irKey?: string }) {
		// Multi nodes are always hidden (no factoryName)
		super(kind, rule, { hidden: true, irKey: opts?.irKey });
	}

	get elementRule(): Rule<'link'> {
		return this.rule.content;
	}

	get nonEmpty(): boolean {
		return this.rule.type === REPEAT1;
	}

	get separator(): string | undefined {
		// this.rule.separator is Rule<'link'>-phase-parameterized;
		// extractSeparatorString reads the structurally identical normalize-phase
		// shape (RepeatRule<'link'> shares RuleBase<'normalize'>.separator's shape
		// post-PR-S) — cast the phase view.
		return extractSeparatorString(this.rule.separator as RuleBase<'normalize'>['separator']);
	}

	get trailing(): SeparatorFlankMode | undefined {
		return this.rule.separator?.trailing;
	}

	get leading(): SeparatorFlankMode | undefined {
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

	attachNodeMap(nodes: ReadonlyMap<string, AssembledNodeBase<Rule<'link'>>>): void {
		this.#nodes = nodes;
	}

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

	override get stampExpression(): string | undefined {
		const fn = this.rawFactoryName;
		return this.parameterless && fn ? `${fn}()` : undefined;
	}

	get fields(): readonly AssembledNonterminal[] {
		return Object.values(this.slots);
	}
}

export class AssembledSeparatedList extends AssembledNodeBase<RepeatRule | Repeat1Rule> {
	readonly modelType = 'separatedList' as const;
	readonly elements: readonly NodeOrTerminal[];
	/**
	 * Set only when the separator is nonterminal (multiple possible literal
	 * kinds) — the rule later tasks project onto a slot. A literal
	 * separator has fixed, compile-time-known text and needs no rule
	 * reference here (mirrors `separatorToString`'s same distinction,
	 * emitters/templates.ts). Resolved by the caller (`assemble.ts`'s
	 * `isNonterminalRuleType` check, already needed there for
	 * `isSeparatedListShape`) rather than here — this file intentionally
	 * does NOT import `rule-catalog.ts` for this: doing so closes an
	 * existing cross-module cycle (node-map.ts → rule-catalog.ts →
	 * compiler/types.ts → node-map.ts, the last leg via `AssembledNode`)
	 * into a shorter path that broke `tsgo`'s type inference in unrelated
	 * files (`simplify.ts`, `refine-emit.test.ts`) — confirmed by bisection.
	 */
	readonly separatorRule: Rule<'link'> | undefined;
	/**
	 * Leading/trailing flank state — a direct passthrough of
	 * `RuleBase.separator`'s own `leading`/`trailing` (`SeparatorFlankMode`,
	 * types/rule.ts): `'mandatory'`/`'optional'` when link.ts's
	 * `liftCommaSep`/`absorbTrailingSeparator` absorbed a bare vs.
	 * `optional(sepLit)`-wrapped flank member into the repeat, `'none'` when
	 * the field is absent (no flank at all). `'mandatory'` and `'none'` are
	 * identical from wrap/factory/from's point of view (neither needs
	 * runtime capture or a factory option — both are compile-time known);
	 * they differ only at render time, where `'mandatory'` must always emit
	 * the separator and `'none'` must never emit it — see
	 * `render-module.ts`'s `leadingExpr`/`trailingExpr` construction.
	 * `isSeparatedListShape` (assemble.ts) only routes a rule here for a
	 * literal separator when at least one flank is genuinely `'optional'`
	 * (a nonterminal separator routes here regardless of flank state) — a
	 * literal separator with ONLY `'mandatory'`/`'none'` flanks stays
	 * classified as `'branch'`, rendered by the pre-existing
	 * `hasTrailing`/`hasLeading` boolean mechanism instead. So a
	 * literal-separator kind reaching this class always has at least one
	 * `'optional'` flank; `'mandatory'` is only reachable here in
	 * combination with a nonterminal separator or the OTHER flank being
	 * `'optional'`.
	 */
	readonly leadingMode: 'mandatory' | 'optional' | 'none';
	readonly trailingMode: 'mandatory' | 'optional' | 'none';

	/**
	 * TEMPORARY behavior-preserving stub (separator-as-slot Task 2 follow-up,
	 * see docs/superpowers/specs/2026-07-12-separator-as-slot-design.md).
	 * `simplifiedRule`/`renderRule`/`slots`/`fields`/`slotClass` exist ONLY so
	 * the wrap/render/factory emitters can route a `'separatedList'` node
	 * through the EXACT SAME code paths they already use for `'branch'`/
	 * `'group'` — `_slots` is built via the identical
	 * `buildSlotsRecord(simplifiedRule, ctx, renderRule)` call
	 * `AssembledBranch`/`AssembledGroup` make, with the SAME `simplifiedRule`/
	 * `renderRule` `assemble()` would have passed had this kind stayed
	 * classified as `'branch'`. This guarantees real grammar kinds that now
	 * classify as `'separatedList'` (e.g. python's `_with_clause_bare`,
	 * `_expression_statement_tuple`, `lambda_parameters`) keep rendering
	 * byte-identically to their pre-Task-2 `'branch'` output, so `cargo
	 * build` stays green and existing corpus round-trips don't regress.
	 * Tasks 4-6 replace this with real per-instance separator capture
	 * (`_separator_kind`/`_leading_sep`/`_trailing_sep`); at that point this
	 * slot-bearing surface goes away — do NOT build new capture logic on
	 * top of it.
	 */
	readonly simplifiedRule: SimplifiedRule;
	/** See `simplifiedRule`'s doc comment — same TEMPORARY-stub rationale. */
	readonly renderRule: RenderRule;
	/** See `simplifiedRule`'s doc comment — same TEMPORARY-stub rationale. */
	protected readonly _slots: Readonly<Record<string, AssembledNonterminal>>;
	/** See `AssembledBranch.slotClass` — set post-assembly by `computeSlotClasses()`. */
	slotClass?: BranchSlotClass;

	constructor(
		kind: string,
		rule: RepeatRule | Repeat1Rule,
		ctx: DeriveCtx | undefined,
		opts: {
			separatorRule: Rule<'link'> | undefined;
			simplifiedRule: SimplifiedRule;
			renderRule: RenderRule;
			kindEntries?: readonly GeneratedKindEntry[];
			parseKindCollisionContext?: ParseKindCollisionContext;
		}
	) {
		super(kind, rule, {});
		const sep = rule.separator;
		this.elements = deriveValuesForRule(rule.content, ctx, rule.type === REPEAT1 ? 'nonEmptyArray' : 'array');
		this.separatorRule = opts.separatorRule;
		this.leadingMode = sep?.leading ?? 'none';
		this.trailingMode = sep?.trailing ?? 'none';
		this.simplifiedRule = opts.simplifiedRule;
		this.renderRule = opts.renderRule;
		this._slots = buildSlotsRecord(
			opts.simplifiedRule,
			{ kindName: kind, kindEntries: opts.kindEntries, collision: opts.parseKindCollisionContext },
			opts.renderRule
		);
	}

	get nonEmpty(): boolean {
		return this.rule.type === REPEAT1;
	}

	get separator(): string | undefined {
		return extractSeparatorString(this.rule.separator as RuleBase<'normalize'>['separator']);
	}

	get slots(): Readonly<Record<string, AssembledNonterminal>> {
		return this._slots;
	}

	get fields(): readonly AssembledNonterminal[] {
		return Object.values(this._slots);
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
	| AssembledMulti
	| AssembledSeparatedList;

// ============================================================================
// 5. Canonical structural-view helpers
// ============================================================================
//
// Branch and Group expose `.fields` directly; non-structural kinds
// (leaf/keyword/token/enum/supertype/multi) have no structural surface.
// These helpers narrow over `AssembledNode` and give consumers one
// canonical entry point per fact.

export function structuralFieldsOf(node: AssembledNode): readonly AssembledNonterminal[] {
	// TEMPORARY: 'separatedList' widened in alongside 'branch'/'group' — see
	// isSlotBearingCompound's doc comment (emitters/shared.ts).
	if (node.modelType === 'branch' || node.modelType === 'group' || node.modelType === 'separatedList')
		return node.fields;
	return [];
}

export function allFormFieldsOf(node: AssembledNode): readonly AssembledNonterminal[] {
	// TEMPORARY: 'separatedList' widened in alongside 'branch'/'group' — see
	// isSlotBearingCompound's doc comment (emitters/shared.ts).
	if (node.modelType === 'branch' || node.modelType === 'group' || node.modelType === 'separatedList')
		return node.fields;
	return [];
}

export function allSlotsOf(node: AssembledNode): readonly AssembledNonterminal[] {
	// TEMPORARY: 'separatedList' widened in alongside 'branch'/'group' — see
	// isSlotBearingCompound's doc comment (emitters/shared.ts).
	if (node.modelType === 'branch' || node.modelType === 'group' || node.modelType === 'separatedList')
		return Object.values(node.slots);
	return [];
}

export function allStructuralSlotsOf(node: AssembledNode): readonly AssembledNonterminal[] {
	// TEMPORARY: 'separatedList' widened in alongside 'branch'/'group' — see
	// isSlotBearingCompound's doc comment (emitters/shared.ts).
	if (node.modelType === 'branch' || node.modelType === 'group' || node.modelType === 'separatedList')
		return Object.values(node.slots);
	return [];
}
