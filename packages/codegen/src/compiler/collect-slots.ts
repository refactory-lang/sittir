/**
 * compiler/collect-slots.ts — nonterminal-driven slot enumeration.
 *
 * Replaces the `deriveSlotsRaw` fold/merge/effectiveMultiplicity walker
 * (node-map.ts) with the simple model from the
 * 2026-05-21-nonterminal-driven-slot-derivation design:
 *
 *   **A slot IS a `nonterminal`-flagged node.**
 *
 * Walk a wrapper-free RenderRule; emit one `AssembledNonterminal` per
 * `nonterminal` node:
 *  - `symbol` / `supertype` / `choice` / `pattern` / `enum` (intrinsic
 *    nonterminals, Table 1) or any node carrying a pushed-down
 *    `nonterminal: true` (Table 2) → ONE slot. A choice is a single UNION
 *    slot — its arms are NOT recursed into separate slots.
 *  - `seq` → distribute: flat-collect the slots of its members. The seq
 *    itself emits no slot.
 *  - `variant` / `clause` / `group` → transparent: recurse into content.
 *  - non-nonterminal leaf (terminal `string` / `token('lit')` / indent / …) → [].
 *
 * Removed vs the old walker: `effectiveMultiplicity` threading,
 * `deriveSlotsRawFromLeafAttr` folding, `armSlots` / `mergeChoiceArmSlots`,
 * first-arm naming. All slot facts (`fieldName` / `multiplicity` /
 * `separator` / `aliasedFrom` / `nonterminal`) already live ON the leaf
 * after `applyWrapperDeletion`, so collection just reads them.
 *
 * The produced `AssembledNonterminal` shape is identical to the old walker's
 * (four emitters depend on `storageName` / `propertyName` / `paramName` /
 * `values`). storageName-from-kind is synthesized in assemble; this collector
 * sets `name` / `storageName` from `fieldName` ?? the kind, and lets assemble
 * own final naming.
 */

import { ALIAS, CHOICE, FIELD, GROUP, OPTIONAL, REPEAT, REPEAT1, SEQ, SUPERTYPE, SYMBOL, TOKEN, VARIANT } from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, Rule, RuleBase, Multiplicity } from '../types/rule.ts';
import type { GeneratedKindEntry } from './generated-metadata.ts';
import { isNonterminalRuleType } from './rule-catalog.ts';
import { sharedArmAttrs } from '../dsl/rule-attrs.ts';
import {
	AssembledNonterminal,
	type NodeOrTerminal,
	deriveValuesForRule,
	dedupeValues,
	extractSeparatorString,
	mergeSourceRuleIds,
	stampSeparatorOnValues,
} from './model/node-map.ts';
import { findRepeatFlag } from '../dsl/rule-transforms.ts';



/**
 * Walk a rule tree to find the first separator string nested inside it.
 * Mirrors `findRepeatFlag`'s descent through seq/choice members, but looks
 * for a separator string rather than a boolean flag. Used when the enclosing
 * slot-rule itself has no separator (e.g. an outer choice rebuilt by
 * `fanOutSeqChoices`/`factorChoiceBranches` carries only the rule id, not the
 * separator), but an inner arm carries the structured separator object set by
 * `applyWrapperDeletion`.
 */
function findNestedSeparator(rule: AnyRule): RuleBase<'normalize'>['separator'] {
	const sep = (rule as { separator?: RuleBase<'normalize'>['separator'] }).separator;
	if (sep !== undefined) return sep;
	switch (rule.type) {
		case SEQ:
		case CHOICE:
			for (const m of rule.members) {
				const found = findNestedSeparator(m);
				if (found !== undefined) return found;
			}
			return undefined;
		case OPTIONAL:
		case VARIANT:
		case GROUP:
		case FIELD:
			return findNestedSeparator(rule.content);
		default:
			return undefined;
	}
}

/**
 * Sink for unnamed-choice-slot occurrences (Task C2). A naked choice (no
 * `fieldName`, not a polymorph) has no grammar-given name, so it falls back to
 * an unresolvable `content` slot — the grammar author must field-name it in
 * `packages/<lang>/overrides.ts`. Rather than emit a scattered per-occurrence
 * warning, the default sink ACCUMULATES the owning kinds so the codegen run can
 * report them as one collected diagnostic (drain via {@link drainUnnamedChoiceSlots}).
 * Tests install a spy via {@link setUnnamedChoiceWarner}.
 */
const collectedUnnamedChoiceKinds = new Set<string>();
// Extra listeners registered via addUnnamedChoiceListener (e.g. the DiagnosticSink
// forwarder in generate.ts). These run IN ADDITION to the primary warner, so
// drainUnnamedChoiceSlots() still returns the accumulated kinds correctly.
const _extraUnnamedChoiceListeners: Array<(kind: string | undefined) => void> = [];
let unnamedChoiceWarner: (kind: string | undefined) => void = (kind) => {
	collectedUnnamedChoiceKinds.add(kind ?? '(unknown)');
	for (const l of _extraUnnamedChoiceListeners) l(kind);
};

export function setUnnamedChoiceWarner(fn: (kind: string | undefined) => void): void {
	unnamedChoiceWarner = fn;
}

/**
 * Register an ADDITIONAL listener that fires alongside the default accumulator
 * (not instead of it). Used by `generate.ts` to forward unnamed-choice events
 * to the `DiagnosticSink` without breaking `drainUnnamedChoiceSlots`.
 * Returns a cleanup function to remove the listener.
 */
export function addUnnamedChoiceListener(fn: (kind: string | undefined) => void): () => void {
	_extraUnnamedChoiceListeners.push(fn);
	return () => {
		const idx = _extraUnnamedChoiceListeners.indexOf(fn);
		if (idx >= 0) _extraUnnamedChoiceListeners.splice(idx, 1);
	};
}

/**
 * Return + clear the kinds that produced an unnamed choice slot during
 * collection. The codegen CLI calls this after a run to emit one diagnostic
 * listing the kinds whose choice needs an explicit grammar field name.
 */
export function drainUnnamedChoiceSlots(): string[] {
	const out = [...collectedUnnamedChoiceKinds].sort();
	collectedUnnamedChoiceKinds.clear();
	return out;
}

/**
 * If every arm of a choice/polymorph carries the SAME `fieldName`, return it.
 * simplify strips a wrapping `field()`'s name off the choice node itself but
 * leaves it stamped on each arm (e.g. `field('operator', choice(<,>,...))` →
 * arms each `{ ..., fieldName: 'operator' }`). Recovering the shared name keeps
 * the choice slot correctly named instead of defaulting to `content`. Thin
 * adapter over the shared {@link sharedArmAttrs} arm-walk.
 */
function sharedArmFieldName(rule: AnyRule): string | undefined {
	return sharedArmAttrs(rule).fieldName;
}

/**
 * The strongest multiplicity carried by any direct arm of a choice/polymorph,
 * or `undefined` if no arm carries one. "Strongest" = most-multi:
 * nonEmptyArray > array > optional. Used to lift an array multiplicity that
 * simplify left on an inner arm (e.g. `choice(choice(X){nonEmptyArray}, X)`)
 * up to the outer choice slot. Thin adapter over {@link sharedArmAttrs}.
 */
function strongestArmMultiplicity(rule: AnyRule): Multiplicity | undefined {
	return sharedArmAttrs(rule).strongestMultiplicity;
}

/**
 * True iff this rule (anywhere in its tree, not crossing into a nested
 * nonterminal slot boundary) carries a `fieldName`. Used to decide whether a
 * choice arm is "structural" (contributes named fields) vs a bare union member.
 */
function carriesNamedField(rule: AnyRule): boolean {
	if ((rule as { fieldName?: string }).fieldName !== undefined) return true;
	switch (rule.type) {
		case SEQ:
		case CHOICE:
			return rule.members.some(carriesNamedField);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case VARIANT:
		case GROUP:
		case TOKEN:
		case ALIAS:
			return carriesNamedField((rule as { content: AnyRule }).content);
		default:
			return false;
	}
}

/**
 * A "structural" choice has at least one arm that is a multi-member seq OR
 * carries distinct named fields — meaning the arms contribute their own field
 * slots rather than forming a single value union. Such a choice must be
 * distributed into its arms (and merged by name), not collapsed to one slot.
 */
function isStructuralChoice(rule: Extract<AnyRule, { type: 'CHOICE' }>): boolean {
	// All arms field-named with the SAME name → operator-enum style; that is a
	// single slot recovered by `sharedArmFieldName`, NOT structural.
	if (sharedArmFieldName(rule) !== undefined) return false;
	return rule.members.some(
		(m) => (m.type === SEQ && m.members.length > 1) || carriesNamedField(m)
	);
}

/** Merge same-named slots within one arm (collapse duplicate field positions). */
function mergeByName(slots: AssembledNonterminal[]): AssembledNonterminal[] {
	if (slots.length <= 1) return slots;
	const byName = new Map<string, AssembledNonterminal>();
	for (const s of slots) {
		const prev = byName.get(s.name);
		if (!prev) {
			byName.set(s.name, s);
			continue;
		}
		byName.set(s.name, prev.with({
			values: dedupeValues([...prev.values, ...s.values]),
			hasTrailing: prev.hasTrailing || s.hasTrailing,
			hasLeading: prev.hasLeading || s.hasLeading,
			sourceRuleIds: mergeSourceRuleIds(prev.sourceRuleIds, s.sourceRuleIds),
		}));
	}
	return [...byName.values()];
}

/**
 * Merge per-arm slot lists from a structural choice. A field present in every
 * arm keeps its multiplicity; a field MISSING from some arm is relaxed to
 * optional (it may be absent depending on which arm the parse took). Values and
 * flank flags union across arms.
 */
function mergeChoiceArms(arms: AssembledNonterminal[][]): AssembledNonterminal[] {
	const merged = new Map<string, AssembledNonterminal>();
	const presence = new Map<string, number>();
	for (const arm of arms) {
		for (const slot of arm) {
			presence.set(slot.name, (presence.get(slot.name) ?? 0) + 1);
			const prev = merged.get(slot.name);
			if (!prev) {
				merged.set(slot.name, slot);
				continue;
			}
			merged.set(slot.name, prev.with({
				values: dedupeValues([...prev.values, ...slot.values]),
				hasTrailing: prev.hasTrailing || slot.hasTrailing,
				hasLeading: prev.hasLeading || slot.hasLeading,
				sourceRuleIds: mergeSourceRuleIds(prev.sourceRuleIds, slot.sourceRuleIds),
			}));
		}
	}
	return [...merged.values()].map((slot) =>
		(presence.get(slot.name) ?? 0) < arms.length ? relaxToOptional(slot) : slot
	);
}

/** Relax a slot's singular/required values to optional (cross-arm absence). */
function relaxToOptional(slot: AssembledNonterminal): AssembledNonterminal {
	return slot.with({
		values: slot.values.map((v) =>
			v.multiplicity === 'single'
				? { ...v, multiplicity: 'optional' as const }
				: v.multiplicity === 'nonEmptyArray'
					? { ...v, multiplicity: 'array' as const }
					: v
		),
	});
}

/** True iff this node is a slot-bearing nonterminal (intrinsic or pushed-down). */
function isSlotNode(rule: AnyRule): boolean {
	if ((rule as { nonterminal?: boolean }).nonterminal === true) return true;
	// isNonterminalRuleType classifies purely by `.type` + child shape — phase-
	// agnostic in practice (evaluate/link/normalize rules share the type tags
	// it switches on); widen structurally rather than narrow the caller's
	// AnyRule param. (Post-PR-S, RepeatRule<'evaluate'>/<'link'> genuinely
	// diverge in shape, so this cast is no longer a structural coincidence —
	// it's an explicit phase-widening read, same pattern as `findRepeatFlag`.)
	return isNonterminalRuleType(rule as Rule<'evaluate'>);
}

/**
 * The slot's effective multiplicity. Prefer the leaf's OWN pushed-down
 * `multiplicity`; fall back to the `inherited` value from the closest
 * structural ancestor that supplies one.
 *
 * The seq-inheritance band-aid is deleted: the seq case of `collectSlots`
 * no longer propagates `rule.multiplicity ?? inherited` — it just passes
 * `inherited` unchanged (always `'single'` in practice because seqs carry
 * no multiplicity after wrapper-deletion push-down). The `inherited` param
 * remains for the `clause` case, which unconditionally passes `'optional'`
 * so that fields inside a DSL clause node stay optional-typed.
 *
 * The nonEmptyArray → array relaxation is preserved: the at-least-one
 * guarantee of a repeat1 applies to the seq group as a whole, not to each
 * individual member slot. This covers inherited 'nonEmptyArray' from a
 * group/variant ancestor (push-down handles the seq-member case separately
 * by relaxing in the seq push-down itself).
 */
function slotMultiplicity(rule: AnyRule, inherited: Multiplicity): Multiplicity {
	const own = (rule as { multiplicity?: Multiplicity }).multiplicity;
	if (own !== undefined) return own;
	// Relax an inherited nonEmptyArray: a member of a repeat1-wrapped group is
	// not itself guaranteed ≥1 occurrences at the individual-field level.
	if (inherited === 'nonEmptyArray') return 'array';
	return inherited;
}

/**
 * Build ONE AssembledNonterminal for a single nonterminal node.
 *
 * `kindForName` is the synthesized branch kind (the rule's owning kind),
 * used only to label the unnamed-choice warning.
 */
function buildSlot(
	rule: AnyRule,
	kindForName: string | undefined,
	kindEntries: readonly GeneratedKindEntry[] | undefined,
	inherited: Multiplicity,
	inheritedSeparator: RuleBase<'normalize'>['separator']
): AssembledNonterminal | null {
	// A choice that carries no multiplicity of its own may still be an array
	// slot: simplify folds `choice(commaSep1(X), X)` into a nested
	// `choice(choice(X..){nonEmptyArray}, choice(X..))` where the array
	// multiplicity lives on an ARM, not the outer choice. `deriveValuesForRule`
	// clobbers each arm with the multiplicity it is passed, so if we passed the
	// outer choice's `single` the array would be lost (e.g. python
	// `future_import_statement.name` mis-typed singular → render struct
	// `SingleNonterminalView` while the template joins → build error). Lift the
	// strongest arm multiplicity onto the choice before deriving values.
	const armLifted =
		rule.type === CHOICE && (rule as { multiplicity?: Multiplicity }).multiplicity === undefined
			? strongestArmMultiplicity(rule)
			: undefined;
	const mult = armLifted ?? slotMultiplicity(rule, inherited);

	// --- Determine the slot name ---
	// Named-vs-positional is derived directly from `fieldName` presence at read
	// time (`AssembledNonterminal.isUnnamed`) — no stored classification here.
	let baseName: string | undefined = (rule as { fieldName?: string }).fieldName;

	if (baseName === undefined) {
		switch (rule.type) {
			case SYMBOL: {
				// Drop the hidden-rule leading underscore (`_expression` → `expression`).
				baseName = rule.name.replace(/^_+/, '') || rule.name;
				break;
			}
			case SUPERTYPE: {
				baseName = rule.name.replace(/^_+/, '') || rule.name;
				break;
			}
			case CHOICE: {
				// A field-wrapped choice loses its OWN `fieldName` to simplify
				// (which strips it from operator choices) while the field is
				// preserved on the choice's ARMS (the renderRule emits e.g.
				// `{{ operator }}`). Recover the slot name from a fieldName
				// shared by all arms before falling back to `content` — this
				// keeps `binary_expression.operator` / `comparison_operator`
				// named correctly under the Chunk D operator-enum (link-symbol
				// arms each carry `fieldName: 'operator'`). Without this the
				// choice mis-names to `content`, the template's `{{ operator }}`
				// is unresolvable, and read cannot populate the slot.
				const sharedArm = sharedArmFieldName(rule);
				if (sharedArm !== undefined) {
					baseName = sharedArm;
					break;
				}
				// Unnamed choice → `content` (Task C2). Warn unless this is a
				// registered polymorph (polymorph metadata drives the TYPE
				// surface only; render just renders `content`).
				if (rule.type === CHOICE) {
					// Prefer rule.id (encodes owning-kind + rule-tree path provenance)
					// as the warning key; fall back to kindForName for callers (e.g.
					// unit tests) that create bare rules without an id.
					unnamedChoiceWarner(rule.id ?? kindForName);
				}
				baseName = 'content';
				break;
			}
			default:
				// Any OTHER nonterminal slot (per `classifyByType`) with no
				// fieldName and no nameable kind — `pattern` / `enum` / aliased
				// leaf → `content`, like an unnamed choice. `buildSlot` is only
				// reached for nonterminal positions, so we must NOT elide based on
				// rule.type: patterns and enums are structural slots (the catalog
				// classifies them nonterminal). Eliding here dropped real slots
				// (e.g. token_repetition's operator enum + separator pattern).
				baseName = 'content';
				break;
		}
	}

	// --- Build values for the slot from the node itself ---
	// buildSlot's `rule` param is AnyRule but is, at runtime, always the
	// post-wrapper-deletion (link-derived) shape deriveValuesForRule expects —
	// same phase-widening read as isSlotNode above (post-PR-S, RepeatRule's
	// per-phase shapes genuinely diverge, so this is now an explicit cast
	// rather than a structural coincidence).
	const rawValues = deriveValuesForRule(rule as Rule<'link'>, { kindEntries }, mult);
	let dedupedValues = dedupeValues(rawValues);
	if (dedupedValues.length === 0) return null;

	// An unnamed-choice `content` catch-all slot (e.g. `object_type`'s body, a
	// mapped/parenthesized type's inner) is a structural container that may be
	// EMPTY (`{}`, `()`), so a `nonEmptyArray` requirement is wrong — the native
	// reader rejects a legitimately-empty parse ("repeated slot content requires
	// at least one value"). Relax content arrays to plain `array`. Named slots
	// keep their derived cardinality.
	if (baseName === 'content') {
		dedupedValues = dedupedValues.map((v) =>
			v.multiplicity === 'nonEmptyArray' ? { ...v, multiplicity: 'array' as const } : v
		);
	}

	const isMultiSlot = dedupedValues.some(
		(v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray'
	);

	// --- Separator + trailing/leading flags (array slots only) ---
	// A member that inherits its array multiplicity from an enclosing seq also
	// inherits that seq's separator (the member itself carries none).
	// When sep is still undefined, fall back to a nested-arm scan so that outer
	// choices rebuilt by `fanOutSeqChoices`/`factorChoiceBranches` (which carry
	// only the rule id, not the separator) still inherit the separator from the
	// arm that has it (e.g. the inlined `_import_list` arm with `sep=",trailing"`).
	const sep =
		(rule as { separator?: RuleBase<'normalize'>['separator'] }).separator ??
		inheritedSeparator ??
		(isMultiSlot ? findNestedSeparator(rule) : undefined);
	// `sep` is always the nested {value, trailing?, leading?} object (or
	// undefined) post-PR-S — no more string/array shapes to type-dispatch on.
	// OR with `findRepeatFlag`'s full-tree walk as a fallback for shapes `sep`
	// (own separator ?? inheritedSeparator ?? nested-arm scan) didn't reach.
	const hasTrailing = isMultiSlot && (sep?.trailing === true || findRepeatFlag(rule, 'trailing'));
	const hasLeading = isMultiSlot && (sep?.leading === true || findRepeatFlag(rule, 'leading'));

	const separatorStr = isMultiSlot ? extractSeparatorString(sep) : undefined;
	const values: readonly NodeOrTerminal[] = stampSeparatorOnValues([...dedupedValues], separatorStr);

	return new AssembledNonterminal({
		values,
		fieldName: (rule as { fieldName?: string }).fieldName,
		hasTrailing,
		hasLeading,
		sourceRuleIds: rule.id ? [rule.id] : [],
		// (debt PR-P1, item 4) Blind opaque passthrough — never read/branched
		// on here or by any compiler consumer. Only a dsl-sanctioned reader
		// (diagnostics / node-model serialization) may open this bag.
		ruleMetadata: rule.metadata,
	});
}

/**
 * Walk a wrapper-free RenderRule and collect one slot per nonterminal node.
 *
 * @param rule        wrapper-free rule (post `applyWrapperDeletion`)
 * @param kindForName owning branch kind name (for unnamed-choice warnings)
 * @param kindEntries generated kind table (for literal → kind resolution)
 */
export function collectSlots(
	rule: AnyRule,
	kindForName?: string,
	kindEntries?: readonly GeneratedKindEntry[],
	inherited: Multiplicity = 'single',
	inheritedSeparator: RuleBase<'normalize'>['separator'] = undefined
): AssembledNonterminal[] {
	switch (rule.type) {
		case SEQ: {
			// Distribute: the seq is not a slot; its members are.
			// Each member now carries its own multiplicity intrinsically (pushed
			// down by wrapper-deletion's seq case via combineMultiplicity), so
			// no inheritance from the seq node is needed — the seq carries no
			// multiplicity after deleteWrapper. Pass `inherited` unchanged.
			const seqSep = (rule as { separator?: RuleBase<'normalize'>['separator'] }).separator ?? inheritedSeparator;
			return rule.members.flatMap((m) => collectSlots(m, kindForName, kindEntries, inherited, seqSep));
		}

		case VARIANT:
		case GROUP:
			// Transparent recursive wrappers — not slots themselves. Recurse
			// to surface their slot-bearing content.
			return collectSlots(
				rule.content,
				kindForName,
				kindEntries,
				(rule as { multiplicity?: Multiplicity }).multiplicity ?? inherited,
				(rule as { separator?: RuleBase<'normalize'>['separator'] }).separator ?? inheritedSeparator
			);

		case CHOICE: {
			// A choice whose arms are STRUCTURAL (multi-member seqs and/or carry
			// distinct named fields) is NOT a single union slot — each arm
			// contributes its own named fields, and the same field name across
			// arms folds into one slot (e.g. ts `variable_declarator` =
			// `choice(seq(field('name'), type?, field('value')?), seq(...))` →
			// `name` / `type` / `value`, not one opaque `content`). Distribute
			// into the arms and merge by name; relax a field absent from some arm
			// to optional. A choice whose arms are all bare kinds / literals
			// (`choice(<,>,...)`, `choice(symA, symB)`) is a true union → ONE slot
			// (handled by `buildSlot` in the default case below).
			// A FIELD-named choice (`field('body', choice(...))`, e.g. python
			// `function_definition.body` over the inlined `_suite` choice) is ONE
			// slot named by the field — do NOT distribute its arms. Distribution
			// drops the field name and splits the choice into per-arm slots (the
			// arms all alias to `block`, so the body slot mis-derives to `block`).
			if ((rule as { fieldName?: string }).fieldName === undefined && isStructuralChoice(rule)) {
				const armMult = (rule as { multiplicity?: Multiplicity }).multiplicity ?? inherited;
				const armSlots = rule.members.map((m) =>
					mergeByName(
						collectSlots(
							m,
							kindForName,
							kindEntries,
							armMult,
							(rule as { separator?: RuleBase<'normalize'>['separator'] }).separator ?? inheritedSeparator
						)
					)
				);
				return mergeChoiceArms(armSlots);
			}
			if (!isSlotNode(rule)) return [];
			const slot = buildSlot(rule, kindForName, kindEntries, inherited, inheritedSeparator);
			return slot ? [slot] : [];
		}

		default: {
			// A nonterminal node IS one slot — its arms / children are NOT
			// recursed. A non-nonterminal leaf contributes nothing.
			if (!isSlotNode(rule)) return [];
			const slot = buildSlot(rule, kindForName, kindEntries, inherited, inheritedSeparator);
			return slot ? [slot] : [];
		}
	}
}
/**
 * Collect the names of named fields whose content contains a `repeat` /
 * `repeat1` with the given flag (`trailing` or `leading`). Returns a
 * `Set<string>` of field names — empty when no such field is found.
 *
 * Used by the template emitter to build a per-field trailing-separator
 * set so `selectJoinFilter` (emitters/templates.ts) can restrict
 * `joinWithTrailing` to the specific fields whose repeats carry the
 * flag, rather than applying it globally whenever the whole rule has
 * any trailing repeat.
 */

export function findFieldsWithRepeatFlag(rule: AnyRule, flag: 'trailing' | 'leading'): Set<string> {
    const out = new Set<string>();
    collectFieldsWithRepeatFlag(rule, flag, out);
    return out;
}
function collectFieldsWithRepeatFlag(rule: AnyRule, flag: 'trailing' | 'leading', acc: Set<string>): void {
    switch (rule.type) {
        case FIELD:
            if (findRepeatFlag(rule.content, flag)) acc.add(rule.name);
            return;
        case SEQ:
        case CHOICE:
            for (const m of rule.members) collectFieldsWithRepeatFlag(m, flag, acc);
            return;
        case REPEAT:
        case REPEAT1:
        case OPTIONAL:
        case VARIANT:
        case GROUP:
            collectFieldsWithRepeatFlag(rule.content, flag, acc);
            return;
        default:
            return;
    }
}
