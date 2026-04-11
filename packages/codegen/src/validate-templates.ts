/**
 * Template validation — post-generation consistency checks.
 *
 * Verifies that generated templates.yaml is consistent with:
 * - node-types.json (tree-sitter grammar node types)
 * - overrides.json (override field definitions)
 * - grammar.json (grammar rules, for variant detection)
 *
 * Checks 1–4 are blocking (codegen fails). Check 8 is variant-specific.
 */

import { loadRawEntries, type RawNodeEntry } from './grammar-reader.ts';
import { loadOverrides, type OverridesConfig } from './overrides.ts';
import { loadGrammar } from './grammar.ts';
import { parse as parseYaml } from 'yaml';
import type { RulesConfig, TemplateRule, TemplateRuleObject } from '@sittir/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationResult {
	grammar: string;
	errors: ValidationError[];
	warnings: ValidationWarning[];
	stats: {
		totalKinds: number;
		variableResolution: { pass: number; fail: number };
		fieldCoverage: { pass: number; fail: number };
		overrideConsistency: { pass: number; fail: number; total: number };
		templateStructure: { pass: number; fail: number };
		variantSubtypes: { pass: number; fail: number; total: number };
	};
}

export interface ValidationError {
	check: string;
	kind: string;
	message: string;
}

export interface ValidationWarning {
	check: string;
	kind: string;
	message: string;
}

// ---------------------------------------------------------------------------
// Variable extraction
// ---------------------------------------------------------------------------

const VAR_RE = /(\$\$\$|\$\$|\$_|\$)([A-Z][A-Z0-9_]*)/g;

/** Extract variable names from a template string (lowercased). */
function extractVars(template: string): Set<string> {
	const vars = new Set<string>();
	let m: RegExpExecArray | null;
	VAR_RE.lastIndex = 0;
	while ((m = VAR_RE.exec(template)) !== null) {
		const prefix = m[1]!;
		if (prefix === '$_') continue; // non-capturing wildcard
		vars.add(m[2]!.toLowerCase());
	}
	return vars;
}

/** Extract all variable names from a rule (template + all clauses). */
function extractAllVars(rule: TemplateRule): Set<string> {
	const vars = new Set<string>();

	function addFrom(s: string) {
		for (const v of extractVars(s)) vars.add(v);
	}

	if (typeof rule === 'string') {
		addFrom(rule);
	} else if (Array.isArray(rule)) {
		for (const t of rule) addFrom(t);
	} else {
		const obj = rule as TemplateRuleObject;
		if (obj.template) {
			const templates = Array.isArray(obj.template) ? obj.template : [obj.template];
			for (const t of templates) addFrom(t);
		}
		if (obj.variants) {
			for (const t of Object.values(obj.variants)) addFrom(t);
		}
		// Clauses
		for (const [key, val] of Object.entries(obj)) {
			if (key.endsWith('_clause') && typeof val === 'string') {
				addFrom(val);
			}
		}
	}

	return vars;
}

/** Get all template strings from a rule (including variant templates and clause templates). */
function getTemplateStrings(rule: TemplateRule): string[] {
	if (typeof rule === 'string') return [rule];
	if (Array.isArray(rule)) return rule;
	const obj = rule as TemplateRuleObject;
	const result: string[] = [];
	if (obj.template) {
		if (Array.isArray(obj.template)) result.push(...obj.template);
		else result.push(obj.template);
	}
	if (obj.variants) result.push(...Object.values(obj.variants));
	for (const [key, val] of Object.entries(obj)) {
		if (key.endsWith('_clause') && typeof val === 'string') result.push(val);
	}
	return result;
}

/** Check if a grammar rule tree contains a STRING node with the given value. */
function ruleContainsString(rule: import('./grammar.ts').GrammarRule, value: string): boolean {
	if (rule.type === 'STRING') return rule.value === value;
	if (rule.type === 'SEQ' || rule.type === 'CHOICE') return rule.members.some(m => ruleContainsString(m, value));
	if (rule.type === 'REPEAT' || rule.type === 'REPEAT1') return ruleContainsString(rule.content, value);
	if (rule.type === 'FIELD') return ruleContainsString(rule.content, value);
	if (rule.type === 'PREC' || rule.type === 'PREC_LEFT' || rule.type === 'PREC_RIGHT' || rule.type === 'PREC_DYNAMIC') return ruleContainsString(rule.content, value);
	if (rule.type === 'TOKEN' || rule.type === 'IMMEDIATE_TOKEN') return ruleContainsString(rule.content, value);
	if (rule.type === 'ALIAS') return ruleContainsString(rule.content, value);
	return false;
}

/** Extract clause keys from a rule object. */
function getClauses(rule: TemplateRule): Map<string, string> {
	const clauses = new Map<string, string>();
	if (typeof rule !== 'string' && !Array.isArray(rule)) {
		const obj = rule as Record<string, unknown>;
		for (const [key, val] of Object.entries(obj)) {
			if (key.endsWith('_clause') && typeof val === 'string') {
				clauses.set(key, val);
			}
		}
	}
	return clauses;
}

// ---------------------------------------------------------------------------
// Main validation
// ---------------------------------------------------------------------------

export function validateTemplates(grammar: string, templatesYaml: string): ValidationResult {
	const config = parseYaml(templatesYaml) as RulesConfig;
	const rawEntries = loadRawEntries(grammar);
	const overrides = loadOverrides(grammar);
	const grammarRules = loadGrammar(grammar);

	// Build lookup maps
	const nodeTypeMap = new Map<string, RawNodeEntry>();
	for (const entry of rawEntries) {
		if (entry.named) nodeTypeMap.set(entry.type, entry);
	}
	// Grammar rule names (includes hidden rules not in node-types.json)
	const grammarRuleNames = new Set(Object.keys(grammarRules.rules));

	const errors: ValidationError[] = [];
	const warnings: ValidationWarning[] = [];
	const stats = {
		totalKinds: 0,
		variableResolution: { pass: 0, fail: 0 },
		fieldCoverage: { pass: 0, fail: 0 },
		overrideConsistency: { pass: 0, fail: 0, total: 0 },
		templateStructure: { pass: 0, fail: 0 },
		variantSubtypes: { pass: 0, fail: 0, total: 0 },
	};

	// Iterate over all rules in templates
	for (const [kind, rule] of Object.entries(config.rules)) {
		stats.totalKinds++;
		const nodeType = nodeTypeMap.get(kind);
		const tsFields = nodeType?.fields ? Object.keys(nodeType.fields) : [];
		const overrideFields = overrides[kind]?.fields ? Object.keys(overrides[kind]!.fields) : [];
		const allVars = extractAllVars(rule);
		const clauses = getClauses(rule);

		// --- Check 1: Variable resolution ---
		let varResOk = true;
		for (const v of allVars) {
			if (v === 'children') continue;
			const clauseRef = `${v}_clause`;
			if (
				!tsFields.includes(v) &&
				!overrideFields.includes(v) &&
				!clauses.has(clauseRef) &&
				!clauses.has(v)  // clause key itself might match
			) {
				errors.push({
					check: 'variable-resolution',
					kind,
					message: `$${v.toUpperCase()} resolves to nothing (not a field, override, or clause)`,
				});
				varResOk = false;
			}
		}
		if (varResOk) stats.variableResolution.pass++;
		else stats.variableResolution.fail++;

		// --- Check 2: Field coverage ---
		let fieldCovOk = true;
		const hasChildrenVar = allVars.has('children');
		for (const fieldName of tsFields) {
			if (!allVars.has(fieldName)) {
				if (hasChildrenVar) {
					// Fields implicitly covered by $$$CHILDREN rendering — warn only
					warnings.push({
						check: 'field-coverage',
						kind,
						message: `tree-sitter FIELD '${fieldName}' not explicitly in template (covered by $$$CHILDREN)`,
					});
				} else {
					errors.push({
						check: 'field-coverage',
						kind,
						message: `tree-sitter FIELD '${fieldName}' not referenced in template`,
					});
					fieldCovOk = false;
				}
			}
		}
		if (fieldCovOk) stats.fieldCoverage.pass++;
		else stats.fieldCoverage.fail++;

		// --- Check 4: Template structure ---
		let structOk = true;

		// Clause validation
		for (const [clauseKey, clauseTemplate] of clauses) {
			const clauseVars = extractVars(clauseTemplate);
			for (const v of clauseVars) {
				if (v === 'children') continue;
				if (!tsFields.includes(v) && !overrideFields.includes(v)) {
					errors.push({
						check: 'template-structure',
						kind,
						message: `clause '${clauseKey}' references unknown variable '${v}'`,
					});
					structOk = false;
				}
			}
		}

		// joinBy validation
		if (typeof rule === 'object' && !Array.isArray(rule)) {
			const obj = rule as TemplateRuleObject;
			if (obj.joinBy && typeof obj.joinBy === 'string') {
				// joinBy applies to $$$ variables — check at least one exists
				const hasMulti = [...allVars].some(v => {
					// Check if any template string has $$$ prefix for this var
					const templates = getTemplateStrings(rule);
					return templates.some(t => t.includes(`$$$${v.toUpperCase()}`));
				});
				if (!hasMulti) {
					errors.push({ check: 'template-structure', kind, message: `joinBy defined but no $$$ variable in template` });
					structOk = false;
				}
			}
		}

		// Duplicate single variable check
		const templateStrings = getTemplateStrings(rule);
		for (const tmpl of templateStrings) {
			const singles: string[] = [];
			let m: RegExpExecArray | null;
			const re = /(\$\$\$|\$\$|\$_|\$)([A-Z][A-Z0-9_]*)/g;
			while ((m = re.exec(tmpl)) !== null) {
				const prefix = m[1]!;
				if (prefix === '$' && prefix.length === 1) { // single $ only
					singles.push(m[2]!.toLowerCase());
				}
			}
			const seen = new Set<string>();
			for (const s of singles) {
				if (seen.has(s)) {
					errors.push({ check: 'template-structure', kind, message: `duplicate single variable $${s.toUpperCase()} in template` });
					structOk = false;
					break;
				}
				seen.add(s);
			}
		}

		// Variant subtypes (check 8)
		if (typeof rule === 'object' && !Array.isArray(rule)) {
			const obj = rule as TemplateRuleObject;
			if (obj.variants) {
				stats.variantSubtypes.total++;
				let variantOk = true;

				// detect/variants alignment
				if (obj.detect) {
					for (const name of Object.keys(obj.detect)) {
						if (!(name in obj.variants)) {
							errors.push({ check: 'variant-subtypes', kind, message: `detect subtype '${name}' not in variants` });
							variantOk = false;
						}
					}
					for (const name of Object.keys(obj.variants)) {
						if (!(name in obj.detect)) {
							errors.push({ check: 'variant-subtypes', kind, message: `variant '${name}' has no detect entry` });
							variantOk = false;
						}
					}

					// Detect token exists in grammar
					const grammarRule = grammarRules.rules[kind];
					if (grammarRule) {
						for (const [subtype, token] of Object.entries(obj.detect)) {
							if (!ruleContainsString(grammarRule, token)) {
								errors.push({ check: 'variant-subtypes', kind, message: `detect token '${token}' for subtype '${subtype}' not found in grammar rule` });
								variantOk = false;
							}
						}
					}
				} else {
					errors.push({ check: 'variant-subtypes', kind, message: 'variants defined but no detect block' });
					variantOk = false;
				}

				if (variantOk) stats.variantSubtypes.pass++;
				else stats.variantSubtypes.fail++;
			}
		}

		if (structOk) stats.templateStructure.pass++;
		else stats.templateStructure.fail++;
	}

	// --- Check 3: Override consistency ---
	for (const [kind, entry] of Object.entries(overrides)) {
		stats.overrideConsistency.total++;
		let overrideOk = true;

		if (!nodeTypeMap.has(kind)) {
			errors.push({ check: 'override-consistency', kind, message: `override for unknown kind '${kind}'` });
			overrideOk = false;
			if (overrideOk) stats.overrideConsistency.pass++;
			else stats.overrideConsistency.fail++;
			continue;
		}

		const rule = config.rules[kind];
		const templateVars = rule ? extractAllVars(rule) : new Set<string>();
		const tsFields = Object.keys(nodeTypeMap.get(kind)!.fields ?? {});
		const nodeChildren = nodeTypeMap.get(kind)!.children;

		for (const [fieldName, spec] of Object.entries(entry.fields)) {
			// Template reference
			if (rule && !templateVars.has(fieldName)) {
				warnings.push({ check: 'override-consistency', kind, message: `override '${fieldName}' not referenced in template` });
			}

			// FIELD collision — warn only (overrides may intentionally extend tree-sitter FIELDs)
			if (tsFields.includes(fieldName)) {
				warnings.push({ check: 'override-consistency', kind, message: `override '${fieldName}' collides with tree-sitter FIELD` });
			}

			// Type existence (named types only)
			// Accept if type is: (1) in children directly, (2) a named entry in node-types.json,
			// or (3) a grammar rule name (covers hidden rules like _statement not in node-types.json)
			for (const t of spec.types) {
				if (t.named && nodeChildren) {
					const childTypes = nodeChildren.types ?? [];
					const inChildren = childTypes.some((c: { type: string }) => c.type === t.type);
					const inNodeTypes = nodeTypeMap.has(t.type);
					const inGrammar = grammarRuleNames.has(t.type);
					if (!inChildren && !inNodeTypes && !inGrammar) {
						warnings.push({ check: 'override-consistency', kind, message: `override type '${t.type}' not found in grammar` });
					}
				}
			}
		}

		// Position contiguity — only check non-negative positions (position -1 = anonymous token)
		const positions = Object.values(entry.fields)
			.map(f => f.position)
			.filter(p => p >= 0)
			.sort((a, b) => a - b);
		for (let i = 0; i < positions.length; i++) {
			if (positions[i] !== i) {
				errors.push({ check: 'override-consistency', kind, message: `position gap at index ${i} (got ${positions[i]})` });
				overrideOk = false;
				break;
			}
		}

		if (overrideOk) stats.overrideConsistency.pass++;
		else stats.overrideConsistency.fail++;
	}

	return { grammar, errors, warnings, stats };
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

export function formatValidationReport(result: ValidationResult): string {
	const { grammar, stats, errors, warnings } = result;
	const lines: string[] = [];

	lines.push(`@sittir/${grammar}: ${stats.totalKinds} kinds`);
	lines.push(`  ${icon(stats.variableResolution)} ${stats.variableResolution.pass}/${stats.variableResolution.pass + stats.variableResolution.fail} variable resolution`);
	lines.push(`  ${icon(stats.fieldCoverage)} ${stats.fieldCoverage.pass}/${stats.fieldCoverage.pass + stats.fieldCoverage.fail} field coverage`);
	lines.push(`  ${icon(stats.overrideConsistency)} ${stats.overrideConsistency.pass}/${stats.overrideConsistency.total} override consistency (${stats.overrideConsistency.total} nodes with overrides)`);
	lines.push(`  ${icon(stats.templateStructure)} ${stats.templateStructure.pass}/${stats.templateStructure.pass + stats.templateStructure.fail} template structure`);
	if (stats.variantSubtypes.total > 0) {
		lines.push(`  ${icon(stats.variantSubtypes)} ${stats.variantSubtypes.pass}/${stats.variantSubtypes.total} variant subtypes`);
	}

	if (errors.length > 0) {
		lines.push('');
		lines.push(`  Errors (${errors.length}):`);
		for (const e of errors) {
			lines.push(`    ${e.kind}: [${e.check}] ${e.message}`);
		}
	}

	if (warnings.length > 0) {
		lines.push('');
		lines.push(`  Warnings (${warnings.length}):`);
		for (const w of warnings) {
			lines.push(`    ${w.kind}: [${w.check}] ${w.message}`);
		}
	}

	return lines.join('\n');
}

function icon(stat: { pass: number; fail: number } | { pass: number; fail: number; total: number }): string {
	return ('fail' in stat && stat.fail > 0) ? 'x' : 'v';
}
