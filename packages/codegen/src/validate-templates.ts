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

	// Build lookup maps
	const nodeTypeMap = new Map<string, RawNodeEntry>();
	for (const entry of rawEntries) {
		if (entry.named) nodeTypeMap.set(entry.type, entry);
	}

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
		for (const fieldName of tsFields) {
			if (!allVars.has(fieldName)) {
				errors.push({
					check: 'field-coverage',
					kind,
					message: `tree-sitter FIELD '${fieldName}' not referenced in template`,
				});
				fieldCovOk = false;
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

		// Variant completeness (check 8 — variant subtypes)
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

			// FIELD collision
			if (tsFields.includes(fieldName)) {
				errors.push({ check: 'override-consistency', kind, message: `override '${fieldName}' collides with tree-sitter FIELD` });
				overrideOk = false;
			}

			// Type existence (named types only)
			for (const t of spec.types) {
				if (t.named && nodeChildren) {
					const childTypes = nodeChildren.types ?? [];
					if (!childTypes.some((c: { type: string }) => c.type === t.type)) {
						warnings.push({ check: 'override-consistency', kind, message: `override type '${t.type}' not in node-types.json children` });
					}
				}
			}
		}

		// Position contiguity
		const positions = Object.values(entry.fields).map(f => f.position).sort((a, b) => a - b);
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
		for (const e of errors.slice(0, 20)) {
			lines.push(`    ${e.kind}: [${e.check}] ${e.message}`);
		}
		if (errors.length > 20) lines.push(`    ... and ${errors.length - 20} more`);
	}

	if (warnings.length > 0) {
		lines.push('');
		lines.push(`  Warnings (${warnings.length}):`);
		for (const w of warnings.slice(0, 10)) {
			lines.push(`    ${w.kind}: [${w.check}] ${w.message}`);
		}
		if (warnings.length > 10) lines.push(`    ... and ${warnings.length - 10} more`);
	}

	return lines.join('\n');
}

function icon(stat: { pass: number; fail: number } | { pass: number; fail: number; total: number }): string {
	return ('fail' in stat && stat.fail > 0) ? 'x' : 'v';
}
