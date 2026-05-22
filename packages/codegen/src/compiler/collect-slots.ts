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

import type { Rule, Multiplicity, RuleSource } from './rule.ts';
import type { GeneratedKindEntry } from './generated-metadata.ts';
import { isNonterminalRuleType } from './rule-catalog.ts';
import {
	type AssembledNonterminal,
	type NodeOrTerminal,
	deriveValuesForRule,
	deriveAliasSources,
	dedupeValues,
	extractSeparatorString,
	stampSeparatorOnValues,
	snakeToCamel,
	pluralize,
	safeParamName,
} from './node-map.ts';
import { findRepeatFlag } from './template-walker.ts';

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
let unnamedChoiceWarner: (kind: string | undefined) => void = (kind) => {
	collectedUnnamedChoiceKinds.add(kind ?? '(unknown)');
};

export function setUnnamedChoiceWarner(fn: (kind: string | undefined) => void): void {
	unnamedChoiceWarner = fn;
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
 * the choice slot correctly named instead of defaulting to `content`.
 */
function sharedArmFieldName(rule: Rule): string | undefined {
	const arms: readonly Rule[] =
		rule.type === 'choice'
			? rule.members
			: rule.type === 'polymorph'
				? rule.forms.map((f) => f.content)
				: [];
	if (arms.length === 0) return undefined;
	let shared: string | undefined;
	for (const arm of arms) {
		const fn = (arm as { fieldName?: string }).fieldName;
		if (fn === undefined) return undefined;
		if (shared === undefined) shared = fn;
		else if (shared !== fn) return undefined;
	}
	return shared;
}

/**
 * The strongest multiplicity carried by any direct arm of a choice/polymorph,
 * or `undefined` if no arm carries one. "Strongest" = most-multi:
 * nonEmptyArray > array > optional. Used to lift an array multiplicity that
 * simplify left on an inner arm (e.g. `choice(choice(X){nonEmptyArray}, X)`)
 * up to the outer choice slot.
 */
function strongestArmMultiplicity(rule: Rule): Multiplicity | undefined {
	const arms: readonly Rule[] =
		rule.type === 'choice'
			? rule.members
			: rule.type === 'polymorph'
				? rule.forms.map((f) => f.content)
				: [];
	const rank: Record<Multiplicity, number> = {
		single: 0,
		optional: 1,
		array: 2,
		nonEmptyArray: 3,
	};
	let best: Multiplicity | undefined;
	for (const arm of arms) {
		const m = (arm as { multiplicity?: Multiplicity }).multiplicity;
		if (m === undefined || m === 'single') continue;
		if (best === undefined || rank[m] > rank[best]) best = m;
	}
	return best;
}

/**
 * True iff this rule (anywhere in its tree, not crossing into a nested
 * nonterminal slot boundary) carries a `fieldName`. Used to decide whether a
 * choice arm is "structural" (contributes named fields) vs a bare union member.
 */
function carriesNamedField(rule: Rule): boolean {
	if ((rule as { fieldName?: string }).fieldName !== undefined) return true;
	switch (rule.type) {
		case 'seq':
		case 'choice':
			return rule.members.some(carriesNamedField);
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'field':
		case 'variant':
		case 'clause':
		case 'group':
		case 'token':
		case 'alias':
			return carriesNamedField((rule as { content: Rule }).content);
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
function isStructuralChoice(rule: Extract<Rule, { type: 'choice' }>): boolean {
	// All arms field-named with the SAME name → operator-enum style; that is a
	// single slot recovered by `sharedArmFieldName`, NOT structural.
	if (sharedArmFieldName(rule) !== undefined) return false;
	return rule.members.some(
		(m) => (m.type === 'seq' && m.members.length > 1) || carriesNamedField(m)
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
		byName.set(s.name, {
			...prev,
			values: dedupeValues([...prev.values, ...s.values]),
			hasTrailing: prev.hasTrailing || s.hasTrailing,
			hasLeading: prev.hasLeading || s.hasLeading,
		});
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
			merged.set(slot.name, {
				...prev,
				values: dedupeValues([...prev.values, ...slot.values]),
				hasTrailing: prev.hasTrailing || slot.hasTrailing,
				hasLeading: prev.hasLeading || slot.hasLeading,
				aliasSources:
					prev.aliasSources || slot.aliasSources
						? { ...prev.aliasSources, ...slot.aliasSources }
						: undefined,
			});
		}
	}
	return [...merged.values()].map((slot) =>
		(presence.get(slot.name) ?? 0) < arms.length ? relaxToOptional(slot) : slot
	);
}

/** Relax a slot's singular/required values to optional (cross-arm absence). */
function relaxToOptional(slot: AssembledNonterminal): AssembledNonterminal {
	return {
		...slot,
		values: slot.values.map((v) =>
			v.multiplicity === 'single'
				? { ...v, multiplicity: 'optional' as const }
				: v.multiplicity === 'nonEmptyArray'
					? { ...v, multiplicity: 'array' as const }
					: v
		),
	};
}

/** True iff this node is a slot-bearing nonterminal (intrinsic or pushed-down). */
function isSlotNode(rule: Rule): boolean {
	if ((rule as { nonterminal?: boolean }).nonterminal === true) return true;
	return isNonterminalRuleType(rule);
}

/**
 * The slot's effective multiplicity. Prefer the leaf's OWN pushed-down
 * `multiplicity`; otherwise inherit the enclosing seq's multiplicity.
 *
 * Why inherit: `repeat(seq(X, Y))` / `optional(seq(...))` stamp the
 * array/optional multiplicity onto the SEQ node (wrapper-deletion recurses
 * into seq members with empty attrs), so a member symbol that has no
 * multiplicity of its own is implicitly array/optional via its enclosing
 * seq. Until autoApplyGroups (Chunk B) lifts such multi-slot seqs to a
 * synthesized group BEFORE derivation, `collectSlots` sees them inline and
 * must propagate the seq's multiplicity to its members — otherwise an array
 * slot is mis-typed as a required singular (e.g. `arguments._expression`,
 * `tuple_type._type`). This is a one-level inherit during seq distribution,
 * not the old recursive `effectiveMultiplicity` parameter.
 */
function slotMultiplicity(rule: Rule, inherited: Multiplicity): Multiplicity {
	if (rule.multiplicity !== undefined) return rule.multiplicity;
	// Relax an inherited nonEmptyArray to array: a member of a repeat1-wrapped
	// seq is not itself guaranteed ≥1 occurrences, so requiring at-least-one
	// value at read time is wrong (the parse may legitimately yield 0 for that
	// member). The repeat1's "at least one" applies to the seq as a whole.
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
	rule: Rule,
	kindForName: string | undefined,
	kindEntries: readonly GeneratedKindEntry[] | undefined,
	inherited: Multiplicity,
	inheritedSeparator: Rule['separator']
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
		(rule.type === 'choice' || rule.type === 'polymorph') && rule.multiplicity === undefined
			? strongestArmMultiplicity(rule)
			: undefined;
	const mult = armLifted ?? slotMultiplicity(rule, inherited);

	// --- Determine the slot name ---
	let baseName: string | undefined = rule.fieldName;
	let source: AssembledNonterminal['source'] = (rule as { source?: RuleSource }).source ?? 'grammar';
	let origin: AssembledNonterminal['origin'];

	if (baseName === undefined) {
		switch (rule.type) {
			case 'symbol': {
				// Drop the hidden-rule leading underscore (`_expression` → `expression`).
				baseName = rule.name.replace(/^_+/, '') || rule.name;
				// A positional (no-fieldName) symbol slot is ALWAYS `inferred` —
				// matching the old `deriveSlotsRaw` walker. Preserving the rule's
				// own `source` (e.g. `'group-lift'`) would break the emitter's
				// group-lift inline guard (`emitSymbol`: inferred + group-lift →
				// inline the helper body; non-inferred → emit an opaque
				// `{{ _<kind>_optionalN }}` slot ref, hiding the helper's real
				// inner fields like `let_declaration.alternative` from parent
				// coverage + render).
				source = 'inferred';
				origin = 'kind';
				break;
			}
			case 'supertype': {
				baseName = rule.name.replace(/^_+/, '') || rule.name;
				source = 'inferred';
				origin = 'kind';
				break;
			}
			case 'choice':
			case 'polymorph': {
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
					source = 'grammar';
					break;
				}
				// Unnamed choice → `content` (Task C2). Warn unless this is a
				// registered polymorph (polymorph metadata drives the TYPE
				// surface only; render just renders `content`).
				if (rule.type === 'choice') {
					// Collect by rule.id — it encodes provenance (owning kind +
					// rule-tree path), unlike `kindForName` which is undefined here.
					unnamedChoiceWarner(rule.id);
				}
				baseName = 'content';
				source = (rule as { source?: RuleSource }).source ?? 'inferred';
				origin = 'kind';
				break;
			}
			default:
				// pattern / enum / aliased leaf with no fieldName and no
				// nameable kind — should not occur as a bare positional slot
				// (they only reach collection via a fieldName or a repeat
				// ancestor that supplies one). Elide rather than synthesize a
				// phantom name.
				return null;
		}
	}

	// --- Build values for the slot from the node itself ---
	// A polymorph is a choice-of-forms: its `content` slot's values are the
	// union of each form's content. (`deriveValuesForRule` has no polymorph
	// case — derive from the forms here.)
	const rawValues =
		rule.type === 'polymorph'
			? rule.forms.flatMap((f) => deriveValuesForRule(f.content, mult, kindEntries))
			: deriveValuesForRule(rule, mult, kindEntries);
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
	const sep = rule.separator ?? inheritedSeparator;
	const sepIsObject = typeof sep === 'object' && !Array.isArray(sep) && sep !== null;
	const hasTrailing =
		isMultiSlot &&
		(sepIsObject
			? (sep as { trailing?: boolean }).trailing === true
			: findRepeatFlag(rule, 'trailing'));
	const hasLeading =
		isMultiSlot &&
		(sepIsObject
			? (sep as { leading?: boolean }).leading === true
			: findRepeatFlag(rule, 'leading'));

	const separatorStr = isMultiSlot ? extractSeparatorString(sep) : undefined;
	const values: readonly NodeOrTerminal[] = stampSeparatorOnValues([...dedupedValues], separatorStr);

	const basePropertyName = snakeToCamel(baseName);
	const propertyName = isMultiSlot ? pluralize(basePropertyName) : basePropertyName;

	const aliasSources = deriveAliasSources(rule);

	return {
		name: baseName,
		propertyName,
		configKey: basePropertyName,
		storageName: baseName,
		paramName: safeParamName(propertyName),
		values,
		hasTrailing,
		hasLeading,
		aliasSources: Object.keys(aliasSources).length > 0 ? aliasSources : undefined,
		source,
		...(origin ? { origin } : {}),
		sourceRuleId: rule.id,
	};
}

/**
 * Walk a wrapper-free RenderRule and collect one slot per nonterminal node.
 *
 * @param rule        wrapper-free rule (post `applyWrapperDeletion`)
 * @param kindForName owning branch kind name (for unnamed-choice warnings)
 * @param kindEntries generated kind table (for literal → kind resolution)
 */
export function collectSlots(
	rule: Rule,
	kindForName?: string,
	kindEntries?: readonly GeneratedKindEntry[],
	inherited: Multiplicity = 'single',
	inheritedSeparator: Rule['separator'] = undefined
): AssembledNonterminal[] {
	switch (rule.type) {
		case 'seq': {
			// Distribute: the seq is not a slot; its members are. A multi-slot
			// seq that survives to derivation (i.e. autoApplyGroups/Chunk B has
			// not lifted it to a group) may carry a `repeat`/`optional`
			// multiplicity + separator on the seq node itself — propagate them
			// to members that have none of their own (see `slotMultiplicity`).
			const seqMult = rule.multiplicity ?? inherited;
			const seqSep = rule.separator ?? inheritedSeparator;
			return rule.members.flatMap((m) => collectSlots(m, kindForName, kindEntries, seqMult, seqSep));
		}

		case 'clause':
			// A `clause` is a sittir DSL node representing an OPTIONAL clause
			// (e.g. impl_item's `optional(seq(negative, field('trait'), 'for'))`).
			// It survives the pipeline as a named transparent wrapper but the
			// original `optional` multiplicity is NOT stamped on the node — so
			// treat clause content as optional unconditionally (matching the old
			// `deriveSlotsRaw` walker: "clause acts like optional"). Without this
			// a field inside the clause (`impl_item.trait`) is mis-derived as
			// required `single`, and read fails on inherent impls (`impl Foo`)
			// that legitimately omit the trait.
			return collectSlots(
				rule.content,
				kindForName,
				kindEntries,
				'optional',
				rule.separator ?? inheritedSeparator
			);

		case 'variant':
		case 'group':
			// Transparent recursive wrappers — not slots themselves. Recurse
			// to surface their slot-bearing content.
			return collectSlots(
				rule.content,
				kindForName,
				kindEntries,
				rule.multiplicity ?? inherited,
				rule.separator ?? inheritedSeparator
			);

		case 'choice': {
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
			if (isStructuralChoice(rule)) {
				const armMult = rule.multiplicity ?? inherited;
				const armSlots = rule.members.map((m) =>
					mergeByName(collectSlots(m, kindForName, kindEntries, armMult, rule.separator ?? inheritedSeparator))
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
