/**
 * Render template emitter.
 *
 * Walks grammar.json rules and produces S-expression render templates
 * + field metadata for the @sittir/core render engine.
 *
 * The template uses tree-sitter query syntax:
 *   (function_item "fn" name: (_) "(" parameters: (_)* ")" return_type: (_)? body: (_))
 */

import type { GrammarRule } from '../grammar-reader.ts';
import { readGrammarRule } from '../grammar-reader.ts';
import type { FieldModel } from '../grammar-model.ts';
import { type StructuralNode, fieldsOf } from './utils.ts';

export interface EmitRulesConfig {
	grammar: string;
	node: StructuralNode;
}

export interface EmittedRule {
	template: string;
	fields: Record<string, { required: boolean; multiple?: boolean; sep?: string }>;
}

/**
 * Emit a render rule (S-expression template + field metadata) for a single node kind.
 *
 * TODO: rewrite to consume NodeModel.elements instead of walking raw GrammarRule (axiom 2)
 */
export function emitRule(config: EmitRulesConfig): EmittedRule {
	const { grammar, node } = config;
	const nodeFields = fieldsOf(node);
	const rule = readGrammarRule(grammar, node.kind);

	const fieldMap = new Map(nodeFields.map(f => [f.name, f]));
	const fields: Record<string, { required: boolean; multiple?: boolean; sep?: string }> = {};
	for (const f of nodeFields) {
		fields[f.name] = {
			required: f.required,
			...(f.multiple ? { multiple: true } : {}),
		};
	}

	const hasChildren = node.children != null;

	if (!rule) {
		const fieldParts = nodeFields.map(f => {
			const q = !f.required ? '?' : f.multiple ? '*' : '';
			return `${f.name}: (_)${q}`;
		});
		const childPart = hasChildren ? ' (_)*' : '';
		return {
			template: `(${node.kind} ${fieldParts.join(' ')}${childPart})`,
			fields,
		};
	}

	const elements = walkRule(rule, fieldMap, grammar, false);

	// Deduplicate: keep first occurrence of each field, skip duplicate (_) children
	const seen = new Set<string>();
	const deduped = elements.filter(el => {
		if (el === '(_)*') return true; // children placeholder, keep one later
		const fieldMatch = el.match(/^(\w+): /);
		if (fieldMatch) {
			if (seen.has(fieldMatch[1]!)) return false;
			seen.add(fieldMatch[1]!);
		}
		return true;
	});

	// If node has children but none were captured, append at end
	if (hasChildren && !deduped.some(e => e === '(_)*')) {
		deduped.push('(_)*');
	}

	// Deduplicate consecutive (_)* entries
	const final = deduped.filter((el, i) => !(el === '(_)*' && deduped[i - 1] === '(_)*'));

	const template = `(${node.kind} ${final.join(' ')})`;

	detectSeparators(rule, fields, grammar);

	return { template: cleanTemplate(template), fields };
}

type SExprElement = string;

/**
 * Walk a grammar rule and produce S-expression elements.
 *
 * Key rules:
 * - FIELD nodes → named field: name: (_) with quantifier from metadata
 * - STRING nodes → quoted token: "fn"
 * - SYMBOL (hidden, _-prefix) → inline if it contains our fields
 * - SYMBOL (visible) → skip (children, handled separately)
 * - CHOICE(content, BLANK) → walk content, but only keep field references
 *   (tokens adjacent to optional fields are dropped — they're contextual)
 * - REPEAT/PREC/TOKEN → unwrap
 */
function walkRule(
	rule: GrammarRule,
	fieldMap: Map<string, FieldModel>,
	grammar: string,
	optional: boolean,
): SExprElement[] {
	switch (rule.type) {
		case 'SEQ':
			return rule.members.flatMap(m => walkRule(m, fieldMap, grammar, optional));

		case 'STRING':
			// Skip tokens inside optional branches — they're contextual to the field
			if (optional) return [];
			return [`"${escapeQuotes(rule.value)}"`];

		case 'FIELD': {
			const meta = fieldMap.get(rule.name);
			if (!meta) return []; // Field not in our metadata — skip
			const quantifier = !meta.required ? '?' : meta.multiple ? '*' : '';
			return [`${rule.name}: (_)${quantifier}`];
		}

		case 'BLANK':
			return [];

		case 'SYMBOL': {
			// Inline hidden rules that contain fields belonging to this node
			if (rule.name.startsWith('_')) {
				const subRule = readGrammarRule(grammar, rule.name);
				if (subRule) {
					const inlined = walkRule(subRule, fieldMap, grammar, optional);
					if (inlined.some(e => e.includes(': (_)'))) return inlined;
				}
			}
			// Visible symbol — children reference, emit in-place
			return ['(_)*'];
		}

		case 'CHOICE': {
			const hasBlank = rule.members.some(m => m.type === 'BLANK');
			const nonBlank = rule.members.filter(m => m.type !== 'BLANK');

			if (hasBlank && nonBlank.length >= 1) {
				// Optional content — walk but mark as optional
				// (tokens inside will be skipped, only fields kept)
				return walkRule(nonBlank[0]!, fieldMap, grammar, true);
			}

			if (nonBlank.length > 1) {
				return pickBestBranch(nonBlank, fieldMap, grammar, optional);
			}

			if (nonBlank.length === 1) {
				return walkRule(nonBlank[0]!, fieldMap, grammar, optional);
			}

			return [];
		}

		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'TOKEN':
		case 'IMMEDIATE_TOKEN':
		case 'ALIAS':
			return walkRule(rule.content, fieldMap, grammar, optional);

		case 'REPEAT':
		case 'REPEAT1':
			return walkRule(rule.content, fieldMap, grammar, optional);

		case 'PATTERN':
			return [];

		default:
			return [];
	}
}

function pickBestBranch(
	branches: GrammarRule[],
	fieldMap: Map<string, FieldModel>,
	grammar: string,
	optional: boolean,
): SExprElement[] {
	let best: SExprElement[] = [];
	let bestCount = -1;

	for (const branch of branches) {
		const elements = walkRule(branch, fieldMap, grammar, optional);
		const fieldCount = elements.filter(e => e.includes(': (_)')).length;
		if (fieldCount > bestCount) {
			bestCount = fieldCount;
			best = elements;
		}
	}

	return best;
}

function detectSeparators(
	rule: GrammarRule,
	fields: Record<string, { required: boolean; multiple?: boolean; sep?: string }>,
	grammar: string,
): void {
	walkForSeparators(rule, fields, grammar);
}

function walkForSeparators(
	rule: GrammarRule,
	fields: Record<string, { required: boolean; multiple?: boolean; sep?: string }>,
	grammar: string,
): void {
	switch (rule.type) {
		case 'SEQ':
			for (let i = 0; i < rule.members.length - 1; i++) {
				const current = rule.members[i]!;
				const next = rule.members[i + 1]!;
				if (current.type === 'FIELD' && (next.type === 'REPEAT' || next.type === 'REPEAT1')) {
					const sep = extractSeparator(next.content);
					if (sep && fields[current.name]?.multiple) {
						fields[current.name]!.sep = sep;
					}
				}
			}
			for (const m of rule.members) walkForSeparators(m, fields, grammar);
			break;

		case 'REPEAT':
		case 'REPEAT1':
			if (rule.content.type === 'SEQ') {
				const sep = extractSeparator(rule.content);
				if (sep) {
					for (const m of rule.content.members) {
						if (m.type === 'FIELD' && fields[m.name]?.multiple) {
							fields[m.name]!.sep = sep;
						}
					}
				}
			}
			walkForSeparators(rule.content, fields, grammar);
			break;

		case 'CHOICE':
			for (const m of rule.members) walkForSeparators(m, fields, grammar);
			break;

		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'TOKEN':
		case 'IMMEDIATE_TOKEN':
		case 'ALIAS':
			walkForSeparators(rule.content, fields, grammar);
			break;

		default:
			break;
	}
}

function extractSeparator(rule: GrammarRule): string | undefined {
	if (rule.type !== 'SEQ') return undefined;
	for (const m of rule.members) {
		if (m.type === 'STRING' && /^[,;|&]$/.test(m.value)) return m.value;
	}
	return undefined;
}

function cleanTemplate(template: string): string {
	return template.replace(/\s+/g, ' ').trim();
}

function escapeQuotes(s: string): string {
	return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Emit the full rules registry source for all node kinds.
 */
export function emitRules(config: {
	grammar: string;
	nodes: StructuralNode[];
}): string {
	const lines: string[] = [];
	lines.push('// Auto-generated by @sittir/codegen — do not edit');
	lines.push('');
	lines.push("import type { RulesRegistry } from '@sittir/types';");
	lines.push('');
	lines.push('export const rules: RulesRegistry = {');

	for (const node of config.nodes) {
		const rule = emitRule({ grammar: config.grammar, node });
		// Use single quotes and escape internal single quotes
		const escaped = rule.template.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
		lines.push(`  '${node.kind}': '${escaped}',`);
	}

	lines.push('};');
	return lines.join('\n');
}
