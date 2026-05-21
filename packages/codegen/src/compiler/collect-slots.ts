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
 * Sink for "unnamed choice slot found in branch '<kind>'" warnings (Task C2).
 * Tests install a spy via {@link setUnnamedChoiceWarner}; production uses the
 * default `console.warn`. Kept module-local so collection stays pure-ish.
 */
let unnamedChoiceWarner: (kind: string | undefined) => void = (kind) =>
	console.warn(`unnamed choice slot found in branch '${kind ?? '(unknown)'}'`);

export function setUnnamedChoiceWarner(fn: (kind: string | undefined) => void): void {
	unnamedChoiceWarner = fn;
}

/** True iff this node is a slot-bearing nonterminal (intrinsic or pushed-down). */
function isSlotNode(rule: Rule): boolean {
	if ((rule as { nonterminal?: boolean }).nonterminal === true) return true;
	return isNonterminalRuleType(rule);
}

/** The slot's own multiplicity, read from the pushed-down leaf attribute. */
function slotMultiplicity(rule: Rule): Multiplicity {
	return rule.multiplicity ?? 'single';
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
	kindEntries: readonly GeneratedKindEntry[] | undefined
): AssembledNonterminal | null {
	const mult = slotMultiplicity(rule);

	// --- Determine the slot name ---
	let baseName: string | undefined = rule.fieldName;
	let source: AssembledNonterminal['source'] = (rule as { source?: RuleSource }).source ?? 'grammar';
	let origin: AssembledNonterminal['origin'];

	if (baseName === undefined) {
		switch (rule.type) {
			case 'symbol': {
				// Drop the hidden-rule leading underscore (`_expression` → `expression`).
				baseName = rule.name.replace(/^_+/, '') || rule.name;
				source = (rule as { source?: RuleSource }).source ?? 'inferred';
				origin = 'kind';
				break;
			}
			case 'supertype': {
				baseName = rule.name.replace(/^_+/, '') || rule.name;
				source = (rule as { source?: RuleSource }).source ?? 'inferred';
				origin = 'kind';
				break;
			}
			case 'choice':
			case 'polymorph': {
				// Unnamed choice → `content` (Task C2). Warn unless this is a
				// registered polymorph (polymorph metadata drives the TYPE
				// surface only; render just renders `content`).
				if (rule.type === 'choice') {
					unnamedChoiceWarner(kindForName);
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
	const dedupedValues = dedupeValues(rawValues);
	if (dedupedValues.length === 0) return null;

	const isMultiSlot = dedupedValues.some(
		(v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray'
	);

	// --- Separator + trailing/leading flags (array slots only) ---
	const sep = rule.separator;
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
	kindEntries?: readonly GeneratedKindEntry[]
): AssembledNonterminal[] {
	switch (rule.type) {
		case 'seq':
			// Distribute: the seq is not a slot; its members are.
			return rule.members.flatMap((m) => collectSlots(m, kindForName, kindEntries));

		case 'variant':
		case 'clause':
		case 'group':
			// Transparent recursive wrappers — not slots themselves. Recurse
			// to surface their slot-bearing content.
			return collectSlots(rule.content, kindForName, kindEntries);

		default: {
			// A nonterminal node IS one slot — its arms / children are NOT
			// recursed. A non-nonterminal leaf contributes nothing.
			if (!isSlotNode(rule)) return [];
			const slot = buildSlot(rule, kindForName, kindEntries);
			return slot ? [slot] : [];
		}
	}
}
