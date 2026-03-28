/**
 * Layer 2: Enriched Grammar — grammar.json introspection only
 *
 * Classifies grammar rules into a 6-variant discriminated union.
 * Does not touch node-types.json. Classification and extraction
 * happen together — the extraction result determines the modelType.
 */

import type { Grammar, GrammarRule } from './grammar.ts';

// ---------------------------------------------------------------------------
// EnrichedRule — 6-variant discriminated union
// ---------------------------------------------------------------------------

export interface SupertypeRule {
	modelType: 'supertype';
	subtypes: string[];
	rule: GrammarRule;
}

export interface EnrichedFieldInfo {
	name: string;
	kinds: string[];
	required: boolean;
	multiple: boolean;
}

export interface EnrichedChildInfo {
	kinds: string[];
	required: boolean;
	multiple: boolean;
}

export interface BranchRule {
	modelType: 'branch';
	fields: EnrichedFieldInfo[];
	children?: EnrichedChildInfo[];
	separators: Map<string, string>;
	rule: GrammarRule;
}

export interface ContainerRule {
	modelType: 'container';
	children: EnrichedChildInfo[];
	separators: Map<string, string>;
	rule: GrammarRule;
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

/** Check if a rule contains non-FIELD SYMBOL references. */
export function hasChildren(rule: GrammarRule): boolean {
	return walkHasChildren(rule, false);
}

function walkHasChildren(rule: GrammarRule, insideField: boolean): boolean {
	switch (rule.type) {
		case 'SYMBOL': return !insideField && !rule.name.startsWith('_');
		case 'FIELD': return walkHasChildren(rule.content, true);
		case 'SEQ': case 'CHOICE': return rule.members.some(m => walkHasChildren(m, insideField));
		case 'REPEAT': case 'REPEAT1': case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT': case 'PREC_DYNAMIC':
		case 'TOKEN': case 'IMMEDIATE_TOKEN':
			return walkHasChildren(rule.content, insideField);
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
	return { modelType: 'supertype', subtypes, rule };
}

function collectConcreteTypes(rule: GrammarRule, grammar: Grammar, types: string[], visited: Set<string>): void {
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

function extractFields(rule: GrammarRule, grammar: Grammar): BranchRule {
	const fieldAccums = new Map<string, FieldAccum>();
	walkForFields(rule, false, false, fieldAccums, grammar);

	const fields: EnrichedFieldInfo[] = [];
	for (const [name, accum] of fieldAccums) {
		fields.push({
			name,
			kinds: [...accum.kinds],
			required: !accum.optional,
			multiple: accum.repeated,
		});
	}

	const childAccums: ChildAccum[] = [];
	walkForChildren(rule, false, false, childAccums, false, grammar);

	const children: EnrichedChildInfo[] | undefined = childAccums.length > 0
		? mergeChildAccums(childAccums)
		: undefined;

	const separators = extractSeparators(rule);

	return { modelType: 'branch', fields, children, separators, rule };
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
			for (const m of rule.members) walkForFields(m, optional, repeated, fields, grammar, visited);
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
					walkForFields(nonBlank[0]!, optional || hasBlank, repeated, fields, grammar, visited);
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
			walkForFields(rule.content, true, true, fields, grammar, visited);
			break;
		case 'REPEAT1':
			walkForFields(rule.content, optional, true, fields, grammar, visited);
			break;
		case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT': case 'PREC_DYNAMIC':
			walkForFields(rule.content, optional, repeated, fields, grammar, visited);
			break;
		case 'ALIAS':
			walkForFields(rule.content, optional, repeated, fields, grammar, visited);
			break;
		case 'TOKEN': case 'IMMEDIATE_TOKEN':
			walkForFields(rule.content, optional, repeated, fields, grammar, visited);
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
// extractChildren
// ---------------------------------------------------------------------------

interface ChildAccum {
	kinds: Set<string>;
	optional: boolean;
	repeated: boolean;
}

function extractChildren(rule: GrammarRule, grammar: Grammar): ContainerRule {
	const childAccums: ChildAccum[] = [];
	walkForChildren(rule, false, false, childAccums, false, grammar);

	const children = mergeChildAccums(childAccums);
	const separators = extractSeparators(rule);

	return { modelType: 'container', children, separators, rule };
}

function mergeChildAccums(accums: ChildAccum[]): EnrichedChildInfo[] {
	if (accums.length === 0) return [];

	const allKinds = new Set<string>();
	let anyRequired = false;
	let anyMultiple = false;

	for (const child of accums) {
		for (const k of child.kinds) allKinds.add(k);
		if (!child.optional) anyRequired = true;
		if (child.repeated || accums.length > 1) anyMultiple = true;
	}

	return [{
		kinds: [...allKinds],
		required: anyRequired,
		multiple: anyMultiple,
	}];
}

function walkForChildren(
	rule: GrammarRule,
	optional: boolean,
	repeated: boolean,
	children: ChildAccum[],
	insideField: boolean,
	grammar: Grammar,
	visited?: Set<string>,
): void {
	switch (rule.type) {
		case 'SEQ':
			for (const m of rule.members) walkForChildren(m, optional, repeated, children, insideField, grammar, visited);
			break;
		case 'FIELD':
			walkForChildren(rule.content, optional, repeated, children, true, grammar, visited);
			break;
		case 'SYMBOL':
			if (!insideField) {
				if (rule.name.startsWith('_')) {
					if (grammar) {
						const v = visited ?? new Set<string>();
						if (!v.has(rule.name)) {
							v.add(rule.name);
							const subRule = grammar.rules[rule.name];
							if (subRule) walkForChildren(subRule, optional, repeated, children, false, grammar, v);
						}
					}
				} else {
					children.push({ kinds: new Set([rule.name]), optional, repeated });
				}
			}
			break;
		case 'ALIAS':
			if (!insideField && rule.named) {
				children.push({ kinds: new Set([rule.value]), optional, repeated });
			} else if (!insideField) {
				walkForChildren(rule.content, optional, repeated, children, false, grammar, visited);
			}
			break;
		case 'CHOICE': {
			const hasBlank = rule.members.some(m => m.type === 'BLANK');
			for (const m of rule.members) {
				if (m.type !== 'BLANK') walkForChildren(m, optional || hasBlank, repeated, children, insideField, grammar, visited);
			}
			break;
		}
		case 'REPEAT':
			walkForChildren(rule.content, true, true, children, insideField, grammar, visited);
			break;
		case 'REPEAT1':
			walkForChildren(rule.content, optional, true, children, insideField, grammar, visited);
			break;
		case 'PREC': case 'PREC_LEFT': case 'PREC_RIGHT': case 'PREC_DYNAMIC':
			walkForChildren(rule.content, optional, repeated, children, insideField, grammar, visited);
			break;
		case 'TOKEN': case 'IMMEDIATE_TOKEN':
			walkForChildren(rule.content, optional, repeated, children, insideField, grammar, visited);
			break;
		default:
			break;
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
					for (const m of r.content.members) {
						if (m.type === 'FIELD') out.set(m.name, sep);
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
			result.set(kind, extractFields(rule, grammar));
			continue;
		}

		// 3. Has children?
		if (hasChildren(rule)) {
			result.set(kind, extractChildren(rule, grammar));
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
