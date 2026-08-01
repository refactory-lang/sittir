/**
 * dsl/rule-transforms.ts — shared, idempotent rule transforms and the
 * `RuleBuilder` construction strategy used across normalize/simplify.
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
} from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, Rule, RuleBase, RepeatRule, Repeat1Rule, SeqRule, SeparatorFlankMode } from '../types/rule.ts';
import { assertNever } from '../polymorph-variant.ts';
import { RuleWalker } from './rule-walker.ts';

// `'single'` is the canonical required-one value (rule.ts `Multiplicity`); a
// missing multiplicity defaults to it (`combineMultiplicity` null-coalesces).
export type LeafMultiplicity = 'optional' | 'single' | 'array' | 'nonEmptyArray' | undefined;

// ---------------------------------------------------------------------------
// RuleBuilder — context-injected rule construction strategy
// ---------------------------------------------------------------------------

export interface RuleBuilder {
	seq(members: AnyRule[]): AnyRule;
	choice(members: AnyRule[]): AnyRule;
	optional(content: AnyRule): AnyRule;
	repeat(content: AnyRule): AnyRule;
	repeat1(content: AnyRule): AnyRule;
	field(name: string, content: AnyRule): AnyRule;
}

export const structuralBuilder: RuleBuilder = {
	seq: (members) => ({ type: SEQ, members }),
	choice: (members) => ({ type: CHOICE, members }),
	// Cast, not narrow: `AnyRule = Rule<PhaseName>` distributes across every
	// phase, while a single-content wrapper's own `content` field wants one
	// specific phase — same "narrow via AnyRule, cast back" convention as
	// rule-catalog.ts's `ruleChildren`.
	optional: (content) => ({ type: OPTIONAL, content }) as AnyRule,
	repeat: (content) => ({ type: REPEAT, content }) as AnyRule,
	repeat1: (content) => ({ type: REPEAT1, content }) as AnyRule,
	field: (name, content) => ({ type: FIELD, name, content }) as AnyRule
};

/* Phase contexts live in the compiler layer: compiler/ctx.ts holds
   `BaseCtx<R>`; per-phase classes (NormalizeCtx / SimplifyCtx / …) extend it
   in their phase files. This dsl module keeps only the `RuleBuilder` strategy
   + the shared transform utilities below. Helpers that need a builder take a
   structural `{ builder?: RuleBuilder }` slice — never the compiler ctx — so
   there is no dsl -> compiler cycle. */

// ---------------------------------------------------------------------------
// Shared, idempotent rule transforms.
// ---------------------------------------------------------------------------

export function combineMultiplicity(outerIn: LeafMultiplicity, innerIn: LeafMultiplicity): LeafMultiplicity {
	// `'single'` is the canonical required-one value (rule.ts `Multiplicity`);
	// a missing multiplicity defaults to it (null-coalesce). The lattice then
	// operates in `'single'` terms: `optional` trumps single
	// (`combine(optional, single) → optional`), and `guaranteesOne('single')`
	// is true (`combine(nonEmptyArray, single) → nonEmptyArray`, not `array`).
	const outer = outerIn ?? 'single';
	const inner = innerIn ?? 'single';
	const isCollection = (m: LeafMultiplicity): boolean => m === 'array' || m === 'nonEmptyArray';
	const guaranteesOne = (m: LeafMultiplicity): boolean => m === 'single' || m === 'nonEmptyArray';
	if (isCollection(outer) || isCollection(inner)) {
		return guaranteesOne(outer) && guaranteesOne(inner) ? 'nonEmptyArray' : 'array';
	}
	if (outer === 'optional' || inner === 'optional') return 'optional';
	/* Both are 'single' → required-one / default. Return `undefined` rather
	   than the explicit string so callers that only stamp non-default values
	   don't write a spurious `multiplicity: 'single'` onto clean nodes. */
	return undefined;
}

const flagWalker = new RuleWalker();

export function findRepeatFlag(rule: AnyRule, flag: 'trailing' | 'leading'): boolean {
	return (
		flagWalker.find(rule, (r) => {
			const sep = (r as { separator?: RuleBase<'normalize'>['separator'] }).separator;
			if (typeof sep === 'object' && !Array.isArray(sep) && sep !== null) {
				if ((sep as { trailing?: SeparatorFlankMode; leading?: SeparatorFlankMode })[flag] !== undefined) return true;
			}
			return (
				(r.type === REPEAT || r.type === REPEAT1) &&
				(r as { trailing?: SeparatorFlankMode; leading?: SeparatorFlankMode })[flag] !== undefined
			);
		}) !== undefined
	);
}

export function extractRepeatShape(rule: AnyRule): { repeat: RepeatRule | Repeat1Rule; nonEmpty: boolean } | null {
	switch (rule.type) {
		// Cast, not narrow: `AnyRule = Rule<PhaseName>` distributes REPEAT
		// across every phase, while `RepeatRule`/`Repeat1Rule` (bare) default
		// to the single 'link' phase — same "narrow via AnyRule, cast back"
		// convention as rule-catalog.ts's `ruleChildren`.
		case REPEAT:
			return { repeat: rule as RepeatRule, nonEmpty: false };
		case REPEAT1:
			return { repeat: rule as Repeat1Rule, nonEmpty: true };
		case OPTIONAL:
		case VARIANT:
		case GROUP:
		case TOKEN:
			return extractRepeatShape((rule as { content: AnyRule }).content);
		default:
			return null;
	}
}

// Genuinely link-phase only — see "Rule IR and snapshots" in
// docs/compiler-phase-glossary.md for the phase-scoping rationale.
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
		case ALIAS:
		case TOKEN:
			return hasAnyField(rule.content);
		case SYMBOL:
		case SUPERTYPE:
		case STRING:
		case PATTERN:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return false;
		default:
			return assertNever(rule);
	}
}

export function pushAttrsToLeaves(
	rule: AnyRule,
	multiplicity: 'optional' | 'array' | 'nonEmptyArray' | undefined,
	separator: unknown,
	fieldName: string | undefined
): AnyRule {
	const recurse = (r: AnyRule): AnyRule => pushAttrsToLeaves(r, multiplicity, separator, fieldName);
	switch (rule.type) {
		case SEQ:
			/* A seq is flattened into its parent by `canonicalizeSeqOfLeaves`, so
			   a seq-level multiplicity would be lost. Push into members instead. */
			return { ...rule, members: (rule as { members: AnyRule[] }).members.map(recurse) } as AnyRule;
		case CHOICE: {
			/* A choice at a seq position is a SINGLE slot boundary (the field
			   walker unions its arms into one slot). `deriveSlotsRaw`'s choice
			   case reads multiplicity from the choice NODE (effectiveMultiplicity),
			   then overrides each arm value with it — so stamp the node itself.
			   The node survives flattening (only seqs flatten), so leaf-level
			   stamping of the arms is unnecessary here. */
			const cur = (rule as { multiplicity?: 'optional' | 'array' | 'nonEmptyArray' }).multiplicity;
			const nextMult = combineMultiplicity(multiplicity, cur);
			const patch: Record<string, unknown> = {};
			if (nextMult !== undefined) patch['multiplicity'] = nextMult;
			if (separator !== undefined) patch['separator'] = separator;
			/* Propagate the pushed-down fieldName onto the choice NODE too (the
			   leaf case does this; the choice case forgot). A choice is the slot
			   boundary, so without this an inlined `field('body', _suite)` whose
			   `_suite` is a choice loses the `body` name → buildSlot falls back to
			   an arbitrary arm kind (`block`). See python `function_definition.body`. */
			if (fieldName !== undefined && (rule as { fieldName?: string }).fieldName === undefined) {
				patch['fieldName'] = fieldName;
			}
			return { ...rule, ...patch } as AnyRule;
		}
		case GROUP:
		case VARIANT:
		case TOKEN:
		case ALIAS:
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
			return { ...rule, content: recurse((rule as { content: AnyRule }).content) } as AnyRule;
		default: {
			// Leaf: symbol / string / pattern / terminal / enum / supertype / etc.
			const cur = (rule as { multiplicity?: 'optional' | 'array' | 'nonEmptyArray' }).multiplicity;
			const nextMult = combineMultiplicity(multiplicity, cur);
			const patch: Record<string, unknown> = {};
			if (nextMult !== undefined) patch['multiplicity'] = nextMult;
			if (separator !== undefined) patch['separator'] = separator;
			if (fieldName !== undefined && (rule as { fieldName?: string }).fieldName === undefined) {
				patch['fieldName'] = fieldName;
			}
			return { ...rule, ...patch } as AnyRule;
		}
	}
}

export interface InlineRefsCtx {
	readonly rules: Readonly<Record<string, AnyRule>>;
	readonly inlineKinds?: ReadonlySet<string>;
}

const EMPTY_INLINE_KINDS: ReadonlySet<string> = new Set();

export function inlineRefs<R extends AnyRule>(
	rule: R,
	ctx: InlineRefsCtx,
	visited: ReadonlySet<string> = new Set()
): R {
	const rules = ctx.rules;
	const inlineKinds = ctx.inlineKinds ?? EMPTY_INLINE_KINDS;
	const recurse = (r: AnyRule, v: ReadonlySet<string>): AnyRule => inlineRefs(r, ctx, v);
	switch (rule.type) {
		case SYMBOL: {
			/* grammar.inline is the single source of truth for inlining. Any
			   symbol ref whose target is listed in `grammar.inline` is inlined
			   here — REGARDLESS of `source` (group-lift or not) or `hidden` —
			   because tree-sitter inlines exactly those kinds at parse time. If
			   sittir's derivation view doesn't match (i.e. it keeps a ref to a
			   kind the parser expands away), `deriveSlots` mints a slot for a
			   node that never materialises at runtime → singular-vs-multi and
			   non-canonical-shape mismatches. Matching the parser's inlining is
			   a correctness invariant.

			   Resolution: group/multi targets inline their CONTENT (the seq /
			   repeat wrapper) so the referrer's walker sees the fields / multi
			   slot directly and no bare `group` rule leaks into simplified
			   output; every other target inlines its body verbatim.
			   `inlineKinds` here is the pre-filtered inline-DECISION set (built in
			   generate.ts): grammar.inline membership minus supertype / keyword /
			   token / pattern / enum modelTypes. So a plain membership test is the
			   gate — supertypes and lexeme leaves were already excluded upstream. */
			if (inlineKinds.has(rule.name)) {
				if (visited.has(rule.name)) return rule;
				const target = rules[rule.name];
				if (!target) return rule;
				const next = new Set(visited);
				next.add(rule.name);
				const inlineTarget = resolveGroupOrMultiInlineTarget(target);
				const inlined = inlineRefs(inlineTarget ?? target, ctx, next);
				/* Preserve the referring symbol's pushed-down leaf attributes
				   (multiplicity / separator / fieldName) onto the inlined body.
				   wrapper-deletion stamped e.g. `repeat1(SYMBOL(_x_repeat1))` down
				   to `SYMBOL{multiplicity:nonEmptyArray, separator}`; replacing the
				   symbol with the target body would otherwise DROP that
				   multiplicity, collapsing a multi slot to singular. Re-wrap the
				   inlined body in the equivalent modifier and re-run the
				   (idempotent) deleteWrapper to re-push the attributes onto the
				   inlined leaves.

				   `inlined` comes back typed `AnyRule` (via the internal `recurse`
				   closure, which type-erases to keep the recursive call generic),
				   but is structurally the same phase-view shape as `rule: R` —
				   `inlineRefs` never changes which phase's rule shape it operates
				   over, only rewrites refs within it. */
				return reapplyInlinedLeafAttrs(rule, inlined) as unknown as R;
			}

			/* Not inline-listed. Inline EVERY hidden helper ref, mirroring what
			   tree-sitter does at parse time: a `_`-prefixed rule produces no CST
			   node — its children flatten into the parent. So the derivation view
			   must inline hidden refs regardless of multiplicity or provenance.

			   Hiddenness is AUTHORITATIVE via isHiddenKind (the `_`-convention
			   oracle in evaluate.ts), NOT the non-authoritative stamped `hidden`
			   flag nor the `source:'group-lift'` provenance tag. The inner seq of
			   a `repeat(seq(...))` still becomes a group for slot pairing, but an
			   INLINE group with no named CST kind — matching the flattened CST.

			   Read the authoritative per-ref `inline` flag (hidden && !aliased &&
			   !supertype && !self-recursive) rather than re-deriving hiddenness —
			   the same oracle the templates emit path uses. The GROUP/MULTI shape
			   gate below still excludes non-foldable shapes. */
			if (rule.inline !== true) return rule;
			if (visited.has(rule.name)) return rule;
			const target = rules[rule.name];
			if (!target) return rule;

			const inlineTarget = resolveGroupOrMultiInlineTarget(target);
			if (!inlineTarget) return rule;
			const next = new Set(visited);
			next.add(rule.name);
			/* Combine the referring symbol's pushed-down attributes (multiplicity /
			   separator / fieldName) with the inlined target — same as the
			   inline-listed path above. wrapper-deletion stamps e.g.
			   `optional(SYMBOL(_initializer))` to `SYMBOL{multiplicity:'optional'}`;
			   without this the optional is dropped on inline and the spliced leaf
			   (e.g. required_parameter's `value`) collapses to a required single.
			   See the same-shape rationale on the inline-listed path's cast above. */
			return reapplyInlinedLeafAttrs(rule, inlineRefs(inlineTarget, ctx, next)) as unknown as R;
		}
		case SEQ:
			return { ...rule, members: rule.members.map((m) => recurse(m, visited)) } as unknown as R;
		case CHOICE:
			return { ...rule, members: rule.members.map((m) => recurse(m, visited)) } as unknown as R;
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case VARIANT:
		case GROUP:
		case TOKEN:
			return {
				...rule,
				content: recurse((rule as { content: AnyRule }).content, visited)
			} as unknown as R;
		default:
			return rule;
	}
}

export function resolveGroupOrMultiInlineTarget(target: AnyRule): AnyRule | null {
	const isGroup = target.type === GROUP;
	// `extractRepeatShape` finds a REPEAT/REPEAT1 wrapper node — the link-phase
	// shape. Called post-wrapper-deletion (normalize's own `inlineHiddenSeqRefs`
	// fixpoint, which only ever sees the wrapper-deleted `normalizedRules` view),
	// that node is already gone: the SAME fact survives as a bare
	// `multiplicity: 'array' | 'nonEmptyArray'` attribute on the target's own
	// rule. Checking both keeps this function correct for its wrapper-bearing
	// caller (`inlineRefs`, from assemble's link-phase `inlinedRule`) and its
	// wrapper-deleted caller alike.
	const targetMultiplicity = (target as { multiplicity?: 'optional' | 'array' | 'nonEmptyArray' }).multiplicity;
	const isMulti =
		extractRepeatShape(target) !== null || targetMultiplicity === 'array' || targetMultiplicity === 'nonEmptyArray';
	if (!isGroup && !isMulti) return null;
	return isGroup ? (target as { content: AnyRule }).content : target;
}

function reapplyInlinedLeafAttrs(ref: AnyRule, inlined: AnyRule): AnyRule {
	const r = ref as {
		multiplicity?: 'optional' | 'array' | 'nonEmptyArray';
		separator?: unknown;
		fieldName?: string;
	};
	if (r.multiplicity === undefined && r.separator === undefined && r.fieldName === undefined) {
		return inlined;
	}
	return pushAttrsToLeaves(inlined, r.multiplicity, r.separator, r.fieldName);
}

// ---------------------------------------------------------------------------
// List-fusion pass — fuse a separated-list's head + repeat occurrences into
// a single multi-valued slot.
//
// tree-sitter grammars author `sepBy1`/`commaSep1` lists in shapes that
// `liftCommaSep` (evaluate) does not always collapse — notably when a choice
// arm is an alias (`argument_list`) or the trailing separator lives in a
// choice (`pattern_list`). After wrapper-deletion those survive as a HEAD
// element (single) plus a REPEAT of the same element (array). Two idioms
// are recognized inside a `seq` (after recursing children):
//
//   A. adjacent `[E, E{array|nonEmptyArray, sep?}]` where the two elements are
//      structurally identical ignoring leaf attributes → fuse to the array E.
//   B. `[E, choice(sepString, E{array|nonEmptyArray, sep?})]` → fuse to the
//      array E, taking the choice's separator string as the trailing separator.
// ---------------------------------------------------------------------------
type Mult = 'optional' | 'array' | 'nonEmptyArray' | undefined;
const isArrayMult = (m: Mult): boolean => m === 'array' || m === 'nonEmptyArray';
function sameSlotShape(a: AnyRule, b: AnyRule): boolean {
	if (a.type !== b.type) return false;
	switch (a.type) {
		case SYMBOL:
			return a.name === (b as typeof a).name && a.aliasedFrom === (b as typeof a).aliasedFrom;
		case STRING:
		case PATTERN:
			return a.value === (b as typeof a).value;
		case CHOICE: {
			const bm = (b as typeof a).members;
			return a.members.length === bm.length && a.members.every((m, i) => sameSlotShape(m, bm[i]!));
		}
		case SEQ: {
			const bm = (b as typeof a).members;
			return a.members.length === bm.length && a.members.every((m, i) => sameSlotShape(m, bm[i]!));
		}
		// enum-shaped ChoiceRules fall through to default.
		default:
			return false;
	}
}
function tryFusePair(head: AnyRule, next: AnyRule | undefined): AnyRule | null {
	if (!next) return null;
	const headMult = (head as { multiplicity?: Mult }).multiplicity;
	if (isArrayMult(headMult)) return null; // head is already multi — not a head+repeat pair

	// Idiom A: [E, E{array}]
	const nextMult = (next as { multiplicity?: Mult }).multiplicity;
	if (isArrayMult(nextMult) && sameSlotShape(head, next)) {
		return next; // the array element absorbs the single head occurrence
	}

	// Idiom B: [E, choice(sepString, E{array})]
	if (next.type === CHOICE && next.members.length === 2) {
		const sepArm = next.members.find((m) => m.type === STRING);
		const repArm = next.members.find(
			(m) => isArrayMult((m as { multiplicity?: Mult }).multiplicity) && sameSlotShape(head, m)
		);
		if (sepArm && repArm) {
			const repSep = (repArm as { separator?: RuleBase<'normalize'>['separator'] }).separator;
			if (repSep !== undefined) return repArm;
			/* Fall back to the choice's separator-string arm, marking a
			   mandatory trailing separator. `repArm`'s static type is the full
			   AnyRule union (the `.find()` predicate above doesn't narrow it),
			   so spread through `object` first to sidestep the excess-property
			   check on the added `separator` key. */
			const sepStr = (sepArm as { value: string }).value;
			return {
				...(repArm as object),
				separator: { value: { type: STRING, value: sepStr } as Rule, trailing: 'mandatory' as const }
			} as AnyRule;
		}
	}

	// Idiom B: [E, choice(sepString, E{array})]
	if (next.type === CHOICE && next.members.length === 2) {
		const sepArm = next.members.find((m) => m.type === STRING);
		const repArm = next.members.find(
			(m) => isArrayMult((m as { multiplicity?: Mult }).multiplicity) && sameSlotShape(head, m)
		);
		if (sepArm && repArm) {
			const repSep = (repArm as { separator?: RuleBase<'normalize'>['separator'] }).separator;
			if (repSep !== undefined) return repArm;
			/* Fall back to the choice's separator-string arm, marking it a
			   genuinely OPTIONAL trailing separator — this codebase's
			   convention (see `findRepeatFlag`'s doc comment) is that a bare
			   `trailing` flag always meant "optional" (there's no
			   mandatory-trailing shape anywhere in this compiler); confirmed
			   via a full regen of all 3 grammars (with a temporary diagnostic)
			   that this fallback never fires today — `repArm` already carries
			   its own separator for every current grammar rule. */
			const sepStr = (sepArm as { value: string }).value;
			return {
				...repArm,
				separator: { value: { type: STRING, value: sepStr } as Rule, trailing: 'optional' }
			} as AnyRule;
		}
	}

	return null;
}

const fuseHeadRepeatListsWalker = new RuleWalker<AnyRule>();

function fuseAtNode(recursed: AnyRule): AnyRule {
	if (recursed.type !== SEQ) return recursed;
	const members = (recursed as SeqRule).members;
	const out: AnyRule[] = [];
	let changed = false;
	for (let i = 0; i < members.length; i++) {
		const fused = tryFusePair(members[i]!, members[i + 1]);
		if (fused) {
			out.push(fused);
			i++; // consume the repeat member too
			changed = true;
			continue;
		}
		out.push(members[i]!);
	}
	if (!changed) return recursed;
	return { ...recursed, members: out };
}

export function fuseHeadRepeatLists<R extends AnyRule>(rule: R): R {
	return fuseAtNode(fuseHeadRepeatListsWalker.map(rule, fuseAtNode)) as R;
}
