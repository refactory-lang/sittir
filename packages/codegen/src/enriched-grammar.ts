/**
 * Layer 2: Enriched Grammar — grammar.json introspection only
 *
 * Classifies grammar rules into a 6-variant discriminated union.
 * Does not touch node-types.json. Classification and extraction
 * happen together — the extraction result determines the modelType.
 */

import type { Grammar, GrammarRule } from './grammar.ts';
import { simplifyRule } from './classify.ts';

// ---------------------------------------------------------------------------
// EnrichedRule — 6-variant discriminated union
// ---------------------------------------------------------------------------

export interface SupertypeRule {
	modelType: 'supertype';
	subtypes: Set<string>;
	rule: GrammarRule;
}

export interface EnrichedFieldInfo {
	name: string;
	kinds: Set<string>;
	required: boolean;
	multiple: boolean;
	/** Positional index in the grammar rule (0-based, shared namespace with children). */
	position: number;
}

export interface EnrichedChildInfo {
	/** Positional index in the simplified rule (0-based). */
	position: number;
	/** Field name — auto-assigned from kind (unique) or NEEDS_NAME placeholder. */
	name: string | null;
	kinds: Set<string>;
	required: boolean;
	multiple: boolean;
}

export interface BranchRule {
	modelType: 'branch';
	fields: EnrichedFieldInfo[];
	children?: EnrichedChildInfo[];
	separators: Map<string, string>;
	rule: GrammarRule;
	simplifiedRule: GrammarRule;
}

export interface ContainerRule {
	modelType: 'container';
	children: EnrichedChildInfo[];
	separators: Map<string, string>;
	rule: GrammarRule;
	simplifiedRule: GrammarRule;
}

export interface KeywordRule {
	modelType: 'keyword';
	text: string;
	rule: GrammarRule;
}

export interface EnumRule {
	modelType: 'enum';
	values: string[];
	rule: GrammarRule;
}

export interface LeafRule {
	modelType: 'leaf';
	pattern: string | null;
	rule: GrammarRule;
}

export type EnrichedRule =
	| SupertypeRule
	| BranchRule
	| ContainerRule
	| KeywordRule
	| EnumRule
	| LeafRule;

// ---------------------------------------------------------------------------
// Helpers: hasFields, hasChildren
// ---------------------------------------------------------------------------

/** Check if a rule contains FIELD nodes anywhere in its tree. */
export function hasFields(rule: GrammarRule): boolean {
	switch (rule.type) {
		case 'FIELD': return true;
		case 'SEQ': case 'CHOICE': return rule.members.some(hasFields);
		case 'REPEAT': case 'REPEAT1': case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT': case 'PREC_DYNAMIC':
		case 'TOKEN': case 'IMMEDIATE_TOKEN': case 'ALIAS':
			return hasFields(rule.content);
		default: return false;
	}
}

/**
 * Check if a rule contains non-FIELD SYMBOL references that produce named children.
 * Uses the supertype set from node-types.json to correctly identify supertypes
 * (which start with `_` but still produce named children).
 */
export function hasChildren(rule: GrammarRule, supertypeSet: ReadonlySet<string>): boolean {
	return walkHasChildren(rule, false, supertypeSet);
}

function walkHasChildren(rule: GrammarRule, insideField: boolean, supertypeSet: ReadonlySet<string>): boolean {
	switch (rule.type) {
		case 'SYMBOL':
			// Named symbols (no `_` prefix) and supertypes produce children.
			// Hidden non-supertype symbols are inlined by tree-sitter.
			return !insideField && (!rule.name.startsWith('_') || supertypeSet.has(rule.name));
		case 'FIELD': return walkHasChildren(rule.content, true, supertypeSet);
		case 'SEQ': case 'CHOICE': return rule.members.some(m => walkHasChildren(m, insideField, supertypeSet));
		case 'REPEAT': case 'REPEAT1': case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT': case 'PREC_DYNAMIC':
		case 'TOKEN': case 'IMMEDIATE_TOKEN':
			return walkHasChildren(rule.content, insideField, supertypeSet);
		case 'ALIAS': return !insideField && rule.named;
		default: return false;
	}
}

// ---------------------------------------------------------------------------
// extractSubtypes
// ---------------------------------------------------------------------------

function extractSubtypes(rule: GrammarRule, grammar: Grammar): SupertypeRule {
	const subtypes: string[] = [];
	collectConcreteTypes(rule, grammar, subtypes, new Set());
	return { modelType: 'supertype', subtypes: new Set(subtypes), rule };
}

export function collectConcreteTypes(rule: GrammarRule, grammar: Grammar, types: string[], visited: Set<string>): void {
	switch (rule.type) {
		case 'SYMBOL': {
			if (visited.has(rule.name)) return;
			visited.add(rule.name);
			if (rule.name.startsWith('_')) {
				const sub = grammar.rules[rule.name];
				if (sub) collectConcreteTypes(sub, grammar, types, visited);
			} else {
				types.push(rule.name);
			}
			break;
		}
		case 'ALIAS':
			if (rule.named) types.push(rule.value);
			break;
		case 'CHOICE':
			for (const m of rule.members) {
				if (m.type !== 'BLANK') collectConcreteTypes(m, grammar, types, visited);
			}
			break;
		case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT': case 'PREC_DYNAMIC':
			collectConcreteTypes(rule.content, grammar, types, visited);
			break;
		case 'SEQ':
			for (const m of rule.members) collectConcreteTypes(m, grammar, types, visited);
			break;
		default:
			break;
	}
}

// ---------------------------------------------------------------------------
// extractFields
// ---------------------------------------------------------------------------

interface FieldAccum {
	kinds: Set<string>;
	optional: boolean;
	repeated: boolean;
}

function extractFields(rule: GrammarRule, grammar: Grammar, supertypeSet: ReadonlySet<string>): BranchRule {
	const fieldAccums = new Map<string, FieldAccum>();
	walkForFields(rule, false, false, fieldAccums, grammar);

	// Assign positions by walking rule structure in order
	const fieldPositions = assignFieldPositions(rule, grammar);

	const fields: EnrichedFieldInfo[] = [];
	for (const [name, accum] of fieldAccums) {
		fields.push({
			name,
			kinds: accum.kinds,
			required: !accum.optional,
			multiple: accum.repeated,
			position: fieldPositions.get(name) ?? -1,
		});
	}

	const simplified = simplifyRule(rule);
	const childSlots = collectChildSlots(simplified, false, false);
	const children: EnrichedChildInfo[] | undefined = childSlots.length > 0
		? slotsToChildren(childSlots)
		: undefined;
	if (children) nameChildSlots(children);

	const separators = extractSeparators(rule);

	return { modelType: 'branch', fields, children, separators, rule, simplifiedRule: simplified };
}

/**
 * Walk the rule structure to assign positional indices to FIELD nodes.
 * Position counts all top-level slots (fields and children) in SEQ order.
 * Returns a map from field name to its first (earliest) position.
 */
function assignFieldPositions(rule: GrammarRule, grammar: Grammar): Map<string, number> {
	const positions = new Map<string, number>();
	let counter = { value: 0 };
	walkForPositions(rule, positions, counter, grammar);
	return positions;
}

function walkForPositions(
	rule: GrammarRule,
	positions: Map<string, number>,
	counter: { value: number },
	grammar: Grammar,
	visited?: Set<string>,
): void {
	switch (rule.type) {
		case 'SEQ':
			for (const m of rule.members) walkForPositions(m, positions, counter, grammar, visited);
			break;
		case 'FIELD':
			if (!positions.has(rule.name)) {
				positions.set(rule.name, counter.value);
			}
			counter.value++;
			break;
		case 'SYMBOL':
			// Non-field symbols also occupy a position (they become children)
			if (rule.name.startsWith('_') && grammar) {
				const v = visited ?? new Set<string>();
				if (!v.has(rule.name)) {
					v.add(rule.name);
					const subRule = grammar.rules[rule.name];
					if (subRule) walkForPositions(subRule, positions, counter, grammar, v);
				}
			} else {
				counter.value++;
			}
			break;
		case 'STRING':
			counter.value++;
			break;
		case 'CHOICE': {
			// Use the longest branch's positions
			const nonBlank = rule.members.filter(m => m.type !== 'BLANK');
			if (nonBlank.length === 0) break;
			// Walk each branch with a snapshot of the counter, take max
			const branchPositions: Map<string, number>[] = [];
			const branchCounters: number[] = [];
			for (const m of nonBlank) {
				const bp = new Map<string, number>();
				const bc = { value: counter.value };
				walkForPositions(m, bp, bc, grammar, visited ? new Set(visited) : undefined);
				branchPositions.push(bp);
				branchCounters.push(bc.value);
			}
			// Merge: use minimum position for each field name
			for (const bp of branchPositions) {
				for (const [name, pos] of bp) {
					const existing = positions.get(name);
					if (existing === undefined || pos < existing) {
						positions.set(name, pos);
					}
				}
			}
			counter.value = Math.max(...branchCounters);
			break;
		}
		case 'REPEAT': case 'REPEAT1':
			walkForPositions(rule.content, positions, counter, grammar, visited);
			break;
		case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT': case 'PREC_DYNAMIC':
			walkForPositions(rule.content, positions, counter, grammar, visited);
			break;
		case 'ALIAS':
			walkForPositions(rule.content, positions, counter, grammar, visited);
			break;
		case 'TOKEN': case 'IMMEDIATE_TOKEN':
			// Tokens are a single position
			counter.value++;
			break;
		default:
			break;
	}
}

function walkForFields(
	rule: GrammarRule,
	optional: boolean,
	repeated: boolean,
	fields: Map<string, FieldAccum>,
	grammar: Grammar,
	visited?: Set<string>,
): void {
	switch (rule.type) {
		case 'SEQ':
			for (const m of rule.members) walkForFields(m, optional, repeated, fields, grammar);
			break;
		case 'FIELD': {
			let accum = fields.get(rule.name);
			if (!accum) {
				accum = { kinds: new Set(), optional: false, repeated: false };
				fields.set(rule.name, accum);
			}
			extractFieldKinds(rule.content, accum.kinds);
			if (optional || hasBlankChoice(rule.content)) accum.optional = true;
			if (repeated) accum.repeated = true;
			break;
		}
		case 'SYMBOL': {
			if (rule.name.startsWith('_') && grammar) {
				const v = visited ?? new Set<string>();
				if (!v.has(rule.name)) {
					v.add(rule.name);
					const subRule = grammar.rules[rule.name];
					if (subRule) walkForFields(subRule, optional, repeated, fields, grammar, v);
				}
			}
			break;
		}
		case 'CHOICE': {
			const hasBlank = rule.members.some(m => m.type === 'BLANK');
			const nonBlank = rule.members.filter(m => m.type !== 'BLANK');

			if (nonBlank.length <= 1) {
				if (nonBlank.length === 1) {
					walkForFields(nonBlank[0]!, optional || hasBlank, repeated, fields, grammar);
				}
			} else {
				const branchFieldMaps: Map<string, FieldAccum>[] = [];
				for (const m of nonBlank) {
					const branchFields = new Map<string, FieldAccum>();
					walkForFields(m, false, repeated, branchFields, grammar, visited ? new Set(visited) : undefined);
					branchFieldMaps.push(branchFields);
				}

				const allBranchFieldNames = branchFieldMaps.map(m => new Set(m.keys()));
				const allFieldNames = new Set<string>();
				for (const s of allBranchFieldNames) for (const n of s) allFieldNames.add(n);

				for (const name of allFieldNames) {
					const inAllBranches = !hasBlank && allBranchFieldNames.every(s => s.has(name));

					let existing = fields.get(name);
					if (!existing) {
						existing = { kinds: new Set(), optional: false, repeated: false };
						fields.set(name, existing);
					}

					for (const branchFields of branchFieldMaps) {
						const accum = branchFields.get(name);
						if (accum) {
							for (const t of accum.kinds) existing.kinds.add(t);
							if (accum.optional) existing.optional = true;
							if (accum.repeated) existing.repeated = true;
						}
					}

					if (!inAllBranches || optional) existing.optional = true;
				}
			}
			break;
		}
		case 'REPEAT':
			walkForFields(rule.content, true, true, fields, grammar);
			break;
		case 'REPEAT1':
			walkForFields(rule.content, optional, true, fields, grammar);
			break;
		case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT': case 'PREC_DYNAMIC':
			walkForFields(rule.content, optional, repeated, fields, grammar);
			break;
		case 'ALIAS':
			walkForFields(rule.content, optional, repeated, fields, grammar);
			break;
		case 'TOKEN': case 'IMMEDIATE_TOKEN':
			walkForFields(rule.content, optional, repeated, fields, grammar);
			break;
		default:
			break;
	}
}

function extractFieldKinds(rule: GrammarRule, kinds: Set<string>): void {
	switch (rule.type) {
		case 'SYMBOL':
			kinds.add(rule.name);
			break;
		case 'STRING':
			kinds.add(rule.value);
			break;
		case 'ALIAS':
			if (rule.named) {
				kinds.add(rule.value);
			} else {
				extractFieldKinds(rule.content, kinds);
			}
			break;
		case 'CHOICE':
			for (const m of rule.members) {
				if (m.type !== 'BLANK') extractFieldKinds(m, kinds);
			}
			break;
		case 'SEQ':
			for (const m of rule.members) extractFieldKinds(m, kinds);
			break;
		case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT': case 'PREC_DYNAMIC':
			extractFieldKinds(rule.content, kinds);
			break;
		case 'REPEAT': case 'REPEAT1':
			extractFieldKinds(rule.content, kinds);
			break;
		default:
			break;
	}
}

function hasBlankChoice(rule: GrammarRule): boolean {
	if (rule.type === 'CHOICE') return rule.members.some(m => m.type === 'BLANK');
	if (rule.type === 'PREC' || rule.type === 'PREC_LEFT' || rule.type === 'PREC_RIGHT' || rule.type === 'PREC_DYNAMIC') {
		return hasBlankChoice(rule.content);
	}
	return false;
}

// ---------------------------------------------------------------------------
// collectChildSlots — position-aware child collection
// ---------------------------------------------------------------------------

interface ChildSlot {
	kinds: Set<string>;
	optional: boolean;
	repeated: boolean;
}

/**
 * Position-aware child slot collection from a simplified rule.
 *
 * Walks the output of simplifyRule() — only SYMBOL, SEQ, CHOICE, REPEAT,
 * REPEAT1, and BLANK nodes remain. FIELD/PREC/STRING/TOKEN/ALIAS have
 * already been stripped or transformed by simplifyRule().
 *
 * Hidden non-supertype symbols (e.g. _call_signature) are recursed into
 * after simplification — tree-sitter inlines them into the parent node.
 */
function collectChildSlots(
	rule: GrammarRule,
	optional: boolean,
	repeated: boolean,
): ChildSlot[] {
	switch (rule.type) {
		case 'SYMBOL': {
			// All symbols (named, supertypes, and hidden) are kept as single-kind slots.
			// Hidden rules like _statement are meaningful groupings — don't expand them.
			return [{ kinds: new Set([rule.name]), optional, repeated }];
		}

		case 'SEQ': {
			const slots: ChildSlot[] = [];
			for (const m of rule.members) {
				slots.push(...collectChildSlots(m, optional, repeated));
			}
			return slots;
		}

		case 'CHOICE': {
			const hasBlank = rule.members.some(m => m.type === 'BLANK');
			const nonBlank = rule.members.filter(m => m.type !== 'BLANK');
			if (nonBlank.length === 0) return [];

			const branchSlots = nonBlank.map(m =>
				collectChildSlots(m, false, repeated),
			);

			// Find max slot count across branches
			const maxLen = Math.max(...branchSlots.map(b => b.length));
			if (maxLen === 0) return [];

			// Merge per-position, padding shorter branches with optional gaps
			const merged: ChildSlot[] = [];
			for (let i = 0; i < maxLen; i++) {
				const kinds = new Set<string>();
				let slotOptional = optional || hasBlank;
				let slotRepeated = repeated;

				for (const branch of branchSlots) {
					if (i < branch.length) {
						const slot = branch[i]!;
						for (const k of slot.kinds) kinds.add(k);
						if (slot.optional) slotOptional = true;
						if (slot.repeated) slotRepeated = true;
					} else {
						slotOptional = true;
					}
				}

				if (kinds.size > 0) {
					merged.push({ kinds, optional: slotOptional, repeated: slotRepeated });
				}
			}
			return merged;
		}

		case 'REPEAT': {
			const inner = collectChildSlots(rule.content, true, true);
			return collapseSlots(inner, true, true);
		}

		case 'REPEAT1': {
			const inner = collectChildSlots(rule.content, optional, true);
			return collapseSlots(inner, optional, true);
		}

		case 'FIELD':
			// Field-owned children are not positional — skip them
			return [];

		case 'BLANK':
			return [];

		default:
			return [];
	}
}

/** Collapse multiple slots into one merged slot. */
function collapseSlots(slots: ChildSlot[], optional: boolean, repeated: boolean): ChildSlot[] {
	if (slots.length === 0) return [];
	if (slots.length === 1) {
		return [{ kinds: slots[0]!.kinds, optional: optional || slots[0]!.optional, repeated: repeated || slots[0]!.repeated }];
	}
	const allKinds = new Set<string>();
	for (const s of slots) for (const k of s.kinds) allKinds.add(k);
	return [{ kinds: allKinds, optional, repeated }];
}

function slotsToChildren(slots: ChildSlot[]): EnrichedChildInfo[] {
	return slots.map((s, i) => ({ position: i, name: null, kinds: s.kinds, required: !s.optional, multiple: s.repeated }));
}

function extractChildren(rule: GrammarRule, grammar: Grammar, supertypeSet: ReadonlySet<string>): ContainerRule {
	const simplified = simplifyRule(rule);
	const children = slotsToChildren(collectChildSlots(simplified, false, false));
	nameChildSlots(children);
	const separators = extractSeparators(rule);
	return { modelType: 'container', children, separators, rule, simplifiedRule: simplified };
}

/**
 * Assign names to child slots based on kind uniqueness:
 * - Single-kind, unique across all slots → kind-as-name (Tier 1)
 * - Single-kind supertype → skip (supertypes are fields, not children)
 * - Same kind in multiple slots or multi-kind slot → NEEDS_NAME_N placeholder (Tier 2)
 * - Single pure REPEAT slot → null (uses $$CHILDREN)
 *
 * TODO: Hidden rule names (e.g. _call_signature, _from_clause, _parameter_name,
 * _destructuring_pattern, _string_content, _comprehension_clauses) are useful
 * candidates for auto-inferring field names — strip `_` prefix and use as name
 * when the hidden rule is unique across slots. Currently these produce NEEDS_NAME
 * placeholders because the kinds don't resolve to named types.
 */
function nameChildSlots(children: EnrichedChildInfo[]): void {
	// Pure REPEAT (single slot, multiple) → no name needed, uses $$CHILDREN
	if (children.length === 1 && children[0]!.multiple) return;

	// Count how many slots each kind appears in
	const kindSlotCount = new Map<string, number>();
	for (const child of children) {
		for (const kind of child.kinds) {
			kindSlotCount.set(kind, (kindSlotCount.get(kind) ?? 0) + 1);
		}
	}

	for (const child of children) {
		if (child.kinds.size === 1) {
			const kind = child.kinds.values().next().value!;
			if ((kindSlotCount.get(kind) ?? 0) > 1) {
				// Same kind in multiple positions → needs human naming
				child.name = `NEEDS_NAME_${child.position}`;
			} else {
				// Unique kind → kind-as-name (strip _ prefix from hidden rules)
				child.name = kind.startsWith('_') ? kind.slice(1) : kind;
			}
		} else {
			// Multiple kinds → needs human naming
			child.name = `NEEDS_NAME_${child.position}`;
		}
	}
}

// ---------------------------------------------------------------------------
// extractKeywordText
// ---------------------------------------------------------------------------

function extractKeywordText(rule: GrammarRule): string | null {
	switch (rule.type) {
		case 'STRING':
			return rule.value;
		case 'SEQ': {
			const parts = rule.members.map(m => extractKeywordText(m));
			if (parts.every((p): p is string => p !== null)) return parts.join('');
			return null;
		}
		case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT': case 'PREC_DYNAMIC':
		case 'TOKEN': case 'IMMEDIATE_TOKEN':
			return extractKeywordText(rule.content);
		default:
			return null;
	}
}

// ---------------------------------------------------------------------------
// extractEnumValues
// ---------------------------------------------------------------------------

function extractEnumValues(rule: GrammarRule, grammar: Grammar): string[] {
	// Try direct rule first
	const values = extractChoiceStrings(rule);
	if (values.length > 0) return values.sort();

	// No direct enum — don't fall through to ALIAS search if rule exists
	// (ALIAS search is only for kinds with no direct rule, handled in classifyRules)
	return [];
}

function extractChoiceStrings(rule: GrammarRule): string[] {
	if (rule.type === 'PREC' || rule.type === 'PREC_LEFT' || rule.type === 'PREC_RIGHT' || rule.type === 'PREC_DYNAMIC'
		|| rule.type === 'TOKEN' || rule.type === 'IMMEDIATE_TOKEN') {
		return extractChoiceStrings(rule.content);
	}
	if (rule.type !== 'CHOICE') return [];

	const values: string[] = [];
	for (const member of rule.members) {
		if (member.type === 'STRING') {
			values.push(member.value);
		} else if (member.type === 'ALIAS' && member.content.type === 'STRING') {
			values.push(member.value);
		} else if (member.type === 'CHOICE') {
			values.push(...extractChoiceStrings(member));
		}
		// Skip BLANK, SYMBOL, etc.
	}
	return values;
}

/** Search all grammar rules for ALIAS nodes producing the given kind. */
function findAliasValues(grammar: Grammar, kind: string): string[] {
	for (const ruleName of Object.keys(grammar.rules)) {
		const aliasContent = findAliasContent(grammar.rules[ruleName]!, kind);
		if (aliasContent) {
			const values = extractChoiceStrings(aliasContent);
			if (values.length > 0) return values.sort();
		}
	}
	return [];
}

function findAliasContent(rule: GrammarRule, aliasValue: string): GrammarRule | null {
	if (rule.type === 'ALIAS' && rule.named && rule.value === aliasValue) {
		return rule.content;
	}
	if ('members' in rule) {
		for (const member of rule.members) {
			const found = findAliasContent(member, aliasValue);
			if (found) return found;
		}
	}
	if ('content' in rule) {
		return findAliasContent(rule.content, aliasValue);
	}
	return null;
}

// ---------------------------------------------------------------------------
// extractPattern
// ---------------------------------------------------------------------------

function extractPattern(rule: GrammarRule): string | null {
	switch (rule.type) {
		case 'PATTERN':
			return rule.value;
		case 'TOKEN': case 'IMMEDIATE_TOKEN':
			return extractPattern(rule.content);
		case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT': case 'PREC_DYNAMIC':
			return extractPattern(rule.content);
		case 'SEQ': {
			const parts = rule.members.map(m => extractPattern(m));
			if (parts.every((p): p is string => p !== null)) return parts.join('');
			return null;
		}
		case 'CHOICE': {
			const hasBlank = rule.members.some(m => m.type === 'BLANK');
			const nonBlank = rule.members.filter(m => m.type !== 'BLANK');
			const patterns = nonBlank.map(m => extractPattern(m));
			if (patterns.every((p): p is string => p !== null)) {
				const group = patterns.length === 1 ? patterns[0]! : `(?:${patterns.join('|')})`;
				return hasBlank ? `${group}?` : group;
			}
			return null;
		}
		case 'REPEAT': {
			const inner = extractPattern(rule.content);
			return inner ? `(?:${inner})*` : null;
		}
		case 'REPEAT1': {
			const inner = extractPattern(rule.content);
			return inner ? `(?:${inner})+` : null;
		}
		case 'STRING':
			return rule.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		default:
			return null;
	}
}

// ---------------------------------------------------------------------------
// extractSeparators — shared by extractFields and extractChildren
// ---------------------------------------------------------------------------

function extractSeparators(rule: GrammarRule): Map<string, string> {
	const out = new Map<string, string>();

	function seqToSeparator(r: GrammarRule): string | undefined {
		if (r.type !== 'SEQ') return undefined;
		for (const m of r.members) {
			if (m.type === 'STRING' && /^[,;|&]$/.test(m.value)) return m.value;
		}
		return undefined;
	}

	function walk(r: GrammarRule): void {
		if (r.type === 'SEQ') {
			for (let i = 0; i < r.members.length - 1; i++) {
				const current = r.members[i]!;
				const next = r.members[i + 1]!;
				if (current.type === 'FIELD' && (next.type === 'REPEAT' || next.type === 'REPEAT1')) {
					const sep = seqToSeparator(next.content);
					if (sep) out.set(current.name, sep);
				}
			}
			for (const m of r.members) walk(m);
		} else if (r.type === 'REPEAT' || r.type === 'REPEAT1') {
			if (r.content.type === 'SEQ') {
				const sep = seqToSeparator(r.content);
				if (sep) {
					let hasField = false;
					for (const m of r.content.members) {
						if (m.type === 'FIELD') { out.set(m.name, sep); hasField = true; }
					}
					// Children separator: REPEAT(SEQ(STRING, non-FIELD)) → unnamed children
					if (!hasField && !out.has('__children__')) {
						out.set('__children__', sep);
					}
				}
			}
			walk(r.content);
		} else if (r.type === 'CHOICE') {
			for (const m of r.members) walk(m);
		} else if (r.type === 'PREC' || r.type === 'PREC_LEFT' || r.type === 'PREC_RIGHT' || r.type === 'PREC_DYNAMIC' ||
			r.type === 'TOKEN' || r.type === 'IMMEDIATE_TOKEN' || r.type === 'ALIAS') {
			walk(r.content);
		}
	}

	walk(rule);
	return out;
}

// ---------------------------------------------------------------------------
// classifyRules — orchestrator
// ---------------------------------------------------------------------------

/**
 * Classify every grammar rule, producing a Map<string, EnrichedRule>.
 * Grammar-only introspection — does not touch node-types.json.
 */
export function classifyRules(grammar: Grammar): Map<string, EnrichedRule> {
	const result = new Map<string, EnrichedRule>();
	const supertypeSet = new Set(grammar.supertypes);

	for (const [kind, rule] of Object.entries(grammar.rules)) {
		// 1. Supertype?
		if (supertypeSet.has(kind)) {
			result.set(kind, extractSubtypes(rule, grammar));
			continue;
		}

		// 2. Has fields?
		if (hasFields(rule)) {
			result.set(kind, extractFields(rule, grammar, supertypeSet));
			continue;
		}

		// 3. Has children?
		if (hasChildren(rule, supertypeSet)) {
			result.set(kind, extractChildren(rule, grammar, supertypeSet));
			continue;
		}

		// 4. Keyword (constant text)?
		const text = extractKeywordText(rule);
		if (text !== null) {
			result.set(kind, { modelType: 'keyword', text, rule });
			continue;
		}

		// 5. Enum (CHOICE of STRINGs)?
		const values = extractEnumValues(rule, grammar);
		if (values.length > 0) {
			result.set(kind, { modelType: 'enum', values, rule });
			continue;
		}

		// 6. Leaf (with optional pattern)
		const pattern = extractPattern(rule);
		result.set(kind, { modelType: 'leaf', pattern, rule });
	}

	return result;
}

// ---------------------------------------------------------------------------
// Hidden rule inlining — replace _-prefixed SYMBOLs with their rule body
// ---------------------------------------------------------------------------
//
// Runs before override enrichment. When a hidden rule (e.g. _call_signature)
// appears as an unnamed child and its rule body is a SEQ of FIELDs that all
// exist on the parent, replace the SYMBOL reference with the rule body.
//
//   SYMBOL("_call_signature")  →  SEQ(FIELD("type_parameters"), FIELD("parameters"), FIELD("return_type"))
//
// This prevents override enrichment from wrapping the hidden rule as a
// pseudo-field (e.g. FIELD("call_signature", SYMBOL("_call_signature")))
// which would produce redundant $CALL_SIGNATURE + appended individual fields.
// ---------------------------------------------------------------------------

/**
 * Inline hidden rules whose body consists entirely of FIELDs present on the parent.
 * Returns the modified rule and the set of hidden rule names that were inlined.
 */
export function inlineHiddenRules(
	rule: GrammarRule,
	parentFieldNames: Set<string>,
	grammarRules: Record<string, GrammarRule>,
): { rule: GrammarRule; inlinedNames: Set<string> } {
	const inlinedNames = new Set<string>();
	const result = walkInline(rule, parentFieldNames, grammarRules, inlinedNames);
	return { rule: result, inlinedNames };
}

function walkInline(
	rule: GrammarRule,
	parentFieldNames: Set<string>,
	grammarRules: Record<string, GrammarRule>,
	inlinedNames: Set<string>,
): GrammarRule {
	switch (rule.type) {
		case 'SYMBOL': {
			if (!rule.name.startsWith('_')) return rule;
			const hiddenRule = grammarRules[rule.name];
			if (!hiddenRule) return rule;
			// Check if the rule body (after unwrapping PREC) is a SEQ of FIELDs on the parent
			const unwrapped = unwrapPrecForOverride(hiddenRule);
			if (unwrapped.type !== 'SEQ') return rule;
			const allParentFields = unwrapped.members.every(m => {
				const u = unwrapPrecForOverride(m);
				return u.type === 'FIELD' && parentFieldNames.has(u.name);
			});
			if (!allParentFields) return rule;
			// Inline: replace SYMBOL with the hidden rule's body
			const stripped = rule.name.replace(/^_/, '');
			inlinedNames.add(stripped);
			return hiddenRule;
		}
		case 'SEQ':
			return { ...rule, members: rule.members.map(m => walkInline(m, parentFieldNames, grammarRules, inlinedNames)) };
		case 'CHOICE':
			return { ...rule, members: rule.members.map(m => walkInline(m, parentFieldNames, grammarRules, inlinedNames)) };
		case 'REPEAT':
		case 'REPEAT1':
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
		case 'TOKEN':
		case 'IMMEDIATE_TOKEN':
		case 'ALIAS':
			return { ...rule, content: walkInline(rule.content, parentFieldNames, grammarRules, inlinedNames) };
		case 'FIELD':
			return { ...rule, content: walkInline(rule.content, parentFieldNames, grammarRules, inlinedNames) };
		default:
			return rule;
	}
}

// ---------------------------------------------------------------------------
// Override enrichment — inject synthetic FIELD nodes into grammar rules
// ---------------------------------------------------------------------------
//
// Runs before template emission. Walks the raw grammar rule tree and wraps
// positions that match override fields with synthetic FIELD nodes:
//
//   SYMBOL("_expression")  →  FIELD("start", SYMBOL("_expression"))
//   CHOICE("..", "..=")    →  FIELD("operator", CHOICE("..", "..="))
//   STRING("-")            →  FIELD("operator", STRING("-"))
//
// After enrichment, the template walker sees only FIELDs and emits $VARIABLE
// without any override-specific logic.
// ---------------------------------------------------------------------------

export interface OverrideFieldInfo {
	name: string;
	/** Named type references (e.g. "_expression", "block"). */
	namedKinds: Set<string>;
	/** Anonymous token values (e.g. "-", "..", "!"). */
	anonymousKinds: Set<string>;
}

/**
 * Enrich a grammar rule by wrapping override-matched positions with synthetic FIELDs.
 * Returns a new rule tree (original is not mutated).
 */
export function applyOverrides(
	rule: GrammarRule,
	overrides: OverrideFieldInfo[],
): GrammarRule {
	if (overrides.length === 0) return rule;
	const consumed = new Set<string>();
	return walkAndWrap(rule, overrides, consumed);
}

function walkAndWrap(
	rule: GrammarRule,
	entries: OverrideFieldInfo[],
	consumed: Set<string>,
): GrammarRule {
	switch (rule.type) {
		case 'SYMBOL': {
			const match = findNamedOverride(rule.name, entries, consumed);
			if (match) {
				consumed.add(match.name);
				return { type: 'FIELD', name: match.name, content: rule };
			}
			return rule;
		}

		case 'STRING': {
			const match = findAnonymousOverride(rule.value, entries, consumed);
			if (match) {
				consumed.add(match.name);
				return { type: 'FIELD', name: match.name, content: rule };
			}
			return rule;
		}

		case 'CHOICE': {
			// Check if the whole CHOICE matches an override.
			// Case 1: CHOICE of STRINGs → anonymous override (e.g. CHOICE("..", "..=", "..."))
			const stringMembers = rule.members.filter(m => unwrapPrecForOverride(m).type === 'STRING');
			if (stringMembers.length >= 2) {
				const stringValues = new Set(stringMembers.map(m => (unwrapPrecForOverride(m) as Extract<GrammarRule, { type: 'STRING' }>).value));
				const match = findChoiceOverride(stringValues, entries, consumed, /* anonymous */ true);
				if (match) {
					consumed.add(match.name);
					return { type: 'FIELD', name: match.name, content: rule };
				}
			}

			// Case 2: CHOICE of SYMBOLs → named override (e.g. CHOICE(integer_literal, float_literal))
			const symbolMembers = rule.members.filter(m => unwrapPrecForOverride(m).type === 'SYMBOL');
			if (symbolMembers.length >= 2) {
				const symbolNames = new Set(symbolMembers.map(m => (unwrapPrecForOverride(m) as Extract<GrammarRule, { type: 'SYMBOL' }>).name));
				const match = findChoiceOverride(symbolNames, entries, consumed, /* anonymous */ false);
				if (match) {
					consumed.add(match.name);
					return { type: 'FIELD', name: match.name, content: rule };
				}
			}

			// No whole-CHOICE match — recurse into each branch independently.
			// Each branch gets its own consumed clone so all branches are wrapped symmetrically.
			const parentConsumed = new Set(consumed);
			const wrappedMembers: GrammarRule[] = [];
			for (const m of rule.members) {
				const branchConsumed = new Set(parentConsumed);
				wrappedMembers.push(walkAndWrap(m, entries, branchConsumed));
				for (const c of branchConsumed) consumed.add(c);
			}
			return { type: 'CHOICE', members: wrappedMembers };
		}

		case 'SEQ':
			return { type: 'SEQ', members: rule.members.map(m => walkAndWrap(m, entries, consumed)) };

		case 'REPEAT':
			return { type: 'REPEAT', content: walkAndWrap(rule.content, entries, consumed) };
		case 'REPEAT1':
			return { type: 'REPEAT1', content: walkAndWrap(rule.content, entries, consumed) };

		case 'FIELD':
			return { type: 'FIELD', name: rule.name, content: walkAndWrap(rule.content, entries, consumed) };

		case 'PREC':
			return { type: 'PREC', value: rule.value, content: walkAndWrap(rule.content, entries, consumed) };
		case 'PREC_LEFT':
			return { type: 'PREC_LEFT', value: rule.value, content: walkAndWrap(rule.content, entries, consumed) };
		case 'PREC_RIGHT':
			return { type: 'PREC_RIGHT', value: rule.value, content: walkAndWrap(rule.content, entries, consumed) };
		case 'PREC_DYNAMIC':
			return { type: 'PREC_DYNAMIC', value: rule.value, content: walkAndWrap(rule.content, entries, consumed) };

		case 'ALIAS':
			if (rule.named) {
				const match = findNamedOverride(rule.value, entries, consumed);
				if (match) {
					consumed.add(match.name);
					return { type: 'FIELD', name: match.name, content: rule };
				}
			}
			return { type: 'ALIAS', content: walkAndWrap(rule.content, entries, consumed), named: rule.named, value: rule.value };

		case 'TOKEN':
			return { type: 'TOKEN', content: walkAndWrap(rule.content, entries, consumed) };
		case 'IMMEDIATE_TOKEN':
			return { type: 'IMMEDIATE_TOKEN', content: walkAndWrap(rule.content, entries, consumed) };

		case 'BLANK':
		case 'PATTERN':
			return rule;
	}
}

/** Match a SYMBOL name against named override kinds (strips _ prefix for hidden rules). */
function findNamedOverride(
	symbolName: string,
	entries: OverrideFieldInfo[],
	consumed: Set<string>,
): OverrideFieldInfo | undefined {
	const lookupName = symbolName.startsWith('_') ? symbolName.slice(1) : symbolName;
	return entries.find(e =>
		!consumed.has(e.name) && (
			e.namedKinds.has(symbolName) ||
			e.namedKinds.has(lookupName) ||
			// Name-based fallback for empty-kinds override fields (hidden grammar rules)
			(e.namedKinds.size === 0 && e.anonymousKinds.size === 0 && e.name === lookupName)
		),
	);
}

/** Match a STRING token value against anonymous override kinds. */
function findAnonymousOverride(
	tokenValue: string,
	entries: OverrideFieldInfo[],
	consumed: Set<string>,
): OverrideFieldInfo | undefined {
	return entries.find(e =>
		!consumed.has(e.name) &&
		e.anonymousKinds.has(tokenValue),
	);
}

/** Match a set of CHOICE values against an override (any overlap → match). */
function findChoiceOverride(
	values: Set<string>,
	entries: OverrideFieldInfo[],
	consumed: Set<string>,
	anonymous: boolean,
): OverrideFieldInfo | undefined {
	return entries.find(e => {
		if (consumed.has(e.name)) return false;
		const kinds = anonymous ? e.anonymousKinds : e.namedKinds;
		for (const v of values) {
			if (kinds.has(v)) return true;
			if (!anonymous && v.startsWith('_') && kinds.has(v.slice(1))) return true;
		}
		return false;
	});
}

/** Unwrap PREC wrappers to get the core rule type (for override matching). */
function unwrapPrecForOverride(rule: GrammarRule): GrammarRule {
	while (rule.type === 'PREC' || rule.type === 'PREC_LEFT' || rule.type === 'PREC_RIGHT' || rule.type === 'PREC_DYNAMIC') {
		rule = rule.content;
	}
	return rule;
}
