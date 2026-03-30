/**
 * Render template emitter.
 *
 * Walks the raw grammar rule tree directly to produce S-expression templates.
 * No intermediary — the grammar rule IS the template schema.
 *
 * The template uses tree-sitter query syntax:
 *   (function_item "fn" name: (_) "(" parameters: (_)* ")" return_type: (_)? body: (_))
 */

import type { GrammarRule, Grammar } from '../grammar.ts';
import { loadGrammar } from '../grammar.ts';
import type { HydratedNodeModel } from '../node-model.ts';
import { type StructuralNode, structuralNodes, fieldsOf } from './utils.ts';

export interface EmitRulesConfig {
	grammar: string;
	node: StructuralNode;
	grammarRules?: Record<string, GrammarRule>;
}

export interface EmittedRule {
	template: string;
	fields: Record<string, { required: boolean; multiple?: boolean; sep?: string }>;
}

/**
 * Emit a render rule (S-expression template + field metadata) for a single node kind.
 * Walks the raw grammar rule tree directly.
 */
export function emitRule(config: EmitRulesConfig): EmittedRule {
	const { node } = config;
	const nodeFields = fieldsOf(node);

	const fields: Record<string, { required: boolean; multiple?: boolean; sep?: string }> = {};
	for (const f of nodeFields) {
		fields[f.name] = {
			required: f.required,
			...(f.multiple ? { multiple: true } : {}),
			...(f.multiple && (f as { separator?: string | null }).separator ? { sep: (f as { separator: string }).separator } : {}),
		};
	}

	// Build field quantifier map from the enriched model (source of truth)
	const fieldQuantifiers = new Map<string, string>();
	for (const f of nodeFields) {
		fieldQuantifiers.set(f.name, f.multiple ? '*' : !f.required ? '?' : '');
	}

	const rawRule = node.rule?.rule;
	const seen = new Set<string>();
	const gr = config.grammarRules ?? {};
	const parts = rawRule ? ruleToSExpr(rawRule, false, seen, fieldQuantifiers, gr) : [];

	// Validate: every field in the template must exist in the node model
	for (const fieldName of seen) {
		if (!fieldQuantifiers.has(fieldName)) {
			throw new Error(`Template for '${node.kind}' references field '${fieldName}' not found in node model`);
		}
	}

	// Warn about model fields the template walker failed to reach
	// (typically due to CHOICE branch selection heuristics)
	for (const [fieldName] of fieldQuantifiers) {
		if (!seen.has(fieldName)) {
			console.warn(`Template for '${node.kind}': model field '${fieldName}' not reached by rule walker`);
			// Append the missing field so render can still handle it
			const q = fieldQuantifiers.get(fieldName) ?? '?';
			parts.push(`${fieldName}: (_)${q}`);
			seen.add(fieldName);
		}
	}

	// If node has children but template doesn't have (_)*, append it
	const hasChildren = node.children != null && (Array.isArray(node.children) ? node.children.length > 0 : true);
	if (hasChildren && !parts.includes('(_)*')) {
		parts.push('(_)*');
	}

	// Collapse consecutive (_)* entries
	const final = parts.filter((el, i) => !(el === '(_)*' && parts[i - 1] === '(_)*'));

	const template = `(${node.kind} ${final.join(' ')})`.replace(/\s+/g, ' ').trim();
	return { template, fields };
}

/**
 * Walk a grammar rule tree and emit S-expression parts.
 *
 * The grammar rule tree directly encodes the structure:
 * - STRING → quoted token
 * - FIELD → named field reference with quantifier
 * - SYMBOL (unnamed) → (_)* child
 * - CHOICE with BLANK → marks contents as optional
 * - SEQ → sequential parts
 * - PREC/TOKEN/ALIAS → unwrap transparently
 */
function ruleToSExpr(rule: GrammarRule, optional: boolean, seen: Set<string>, fq: Map<string, string>, gr: Record<string, GrammarRule>): string[] {
	switch (rule.type) {
		case 'SEQ': {
			const parts: string[] = [];
			for (const m of rule.members) parts.push(...ruleToSExpr(m, optional, seen, fq, gr));
			return parts;
		}

		case 'STRING':
			if (optional) return [];
			return [`"${escapeQuotes(rule.value)}"`];

		case 'FIELD': {
			if (seen.has(rule.name)) return [];
			seen.add(rule.name);
			// Use enriched model quantifier (source of truth for required/multiple)
			const q = fq.get(rule.name) ?? '';
			return [`${rule.name}: (_)${q}`];
		}

		case 'SYMBOL': {
			// Inline _-prefixed (hidden/abstract) rules that contain fields the model expects
			if (rule.name.startsWith('_') && gr[rule.name]) {
				const inlineSeen = new Set(seen);
				const inlined = ruleToSExpr(gr[rule.name]!, optional, inlineSeen, fq, gr);
				// Filter to only fields that belong to this node's model
				const filtered = inlined.filter(p => {
					const m = p.match(/^(\w+): \(_\)/);
					return !m || fq.has(m[1]!);
				});
				if (filtered.some(p => p.includes(': (_)'))) {
					// Merge accepted fields back into seen
					for (const f of inlineSeen) if (fq.has(f)) seen.add(f);
					return filtered;
				}
			}
			return ['(_)*'];
		}

		case 'CHOICE': {
			const hasBlank = rule.members.some(m => m.type === 'BLANK');
			if (hasBlank) {
				const parts: string[] = [];
				for (const m of rule.members) {
					if (m.type === 'BLANK') continue;
					parts.push(...ruleToSExpr(m, true, seen, fq, gr));
				}
				return parts;
			}
			let best: string[] = [];
			let bestCount = -1;
			let bestSeen = new Set<string>();
			for (const m of rule.members) {
				const branchSeen = new Set(seen);
				const branchParts = ruleToSExpr(m, optional, branchSeen, fq, gr);
				const fieldCount = branchParts.filter(e => e.includes(': (_)')).length;
				if (fieldCount > bestCount) {
					bestCount = fieldCount;
					best = branchParts;
					bestSeen = branchSeen;
				}
			}
			// Merge winning branch's seen fields back
			for (const f of bestSeen) seen.add(f);
			return best;
		}

		case 'REPEAT':
		case 'REPEAT1':
			return ruleToSExpr(rule.content, optional, seen, fq, gr);

		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
			return ruleToSExpr(rule.content, optional, seen, fq, gr);

		case 'TOKEN':
		case 'IMMEDIATE_TOKEN': {
			let inner: GrammarRule = rule.content;
			while (inner.type === 'PREC' || inner.type === 'PREC_LEFT' || inner.type === 'PREC_RIGHT' || inner.type === 'PREC_DYNAMIC') {
				inner = inner.content;
			}
			if (inner.type === 'STRING') {
				if (optional) return [];
				return [`"${escapeQuotes(inner.value)}"`];
			}
			return [];
		}

		case 'ALIAS':
			if (rule.named) return ['(_)*'];
			if (rule.value) {
				if (optional) return [];
				return [`"${escapeQuotes(rule.value)}"`];
			}
			return ruleToSExpr(rule.content, optional, seen, fq, gr);

		case 'BLANK':
		case 'PATTERN':
			return [];
	}
}

function escapeQuotes(s: string): string {
	return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Emit the full rules registry source for all node kinds.
 */
export function emitRules(config: {
	grammar: string;
	nodes: HydratedNodeModel[];
}): string {
	const lines: string[] = [];
	lines.push('// Auto-generated by @sittir/codegen — do not edit');
	lines.push('');
	lines.push("import type { RulesRegistry } from '@sittir/types';");
	lines.push('');
	lines.push('export const rules: RulesRegistry = {');

	const grammarRules = loadGrammar(config.grammar).rules;
	for (const node of structuralNodes(config.nodes)) {
		const rule = emitRule({ grammar: config.grammar, node, grammarRules });
		// Use single quotes and escape internal single quotes
		const escaped = rule.template.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
		lines.push(`  '${node.kind}': '${escaped}',`);
	}

	lines.push('};');
	return lines.join('\n');
}
