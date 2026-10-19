import type { Rule } from '../types/rule.ts';
import type { GrammarDiagnostic } from '../types/diagnostics.ts';

export interface EnrichShapeInfo {
	readonly pass: string;
	readonly shape: string;
}

export const ENRICH_SHAPES = {
	'unfielded-symbol-slot': { pass: 'symbol-to-field', shape: 'a node kind in a sequence with no field name' },
	'unfielded-choice-arm': { pass: 'choice-arm field wrap', shape: 'a choice arm holding a terminal with no field name' },
	'unfielded-repeat-union': { pass: 'repeat-union field promotion', shape: 'a repeat of a hidden union with no field name' },
	'unfielded-elided-list': { pass: 'elided-list field', shape: 'an elided separated list outside one field' },
	'unfielded-optional-keyword': { pass: 'optional-keyword promotion', shape: 'an optional keyword that names no slot' },
	'unfielded-node-choice': { pass: 'node-choice field wrap', shape: 'a choice of node kinds with no field name' },
	'nested-list-head': { pass: 'list-body flattening', shape: 'a separated list whose head element and repeat are nested instead of one sequence' },
	'aliased-literal-choice': { pass: 'literal-alias storage', shape: 'an alias over a choice of literals with no storage rule' },
	'aliased-hidden-body': { pass: 'hidden alias lift', shape: 'a hidden rule whose whole body is an alias over non-symbol content' },
	'alias-over-choice': { pass: 'alias distribution', shape: 'an alias over a choice, which tree-sitter applies to every arm' },
	'overloaded-display': { pass: 'display unaliasing', shape: 'one display name over storages of different parser classes' },
	'exclusive-field-choice': { pass: 'exclusive field-choice distribution', shape: 'a choice of differently fielded alternatives inside a sequence' },
	'shared-optional-choice': { pass: 'shared-optional factoring', shape: 'a choice whose every member is optional' },
	'leaf-enum-token': { pass: 'leaf-enum distribution', shape: 'a token over a choice of plain strings' },
	'token-form-choice': { pass: 'token-form hoist', shape: 'a token body with a form alternation inside it' },
	'lone-optional-token': { pass: 'clause hoist', shape: 'an optional sequence of one token and an optional field, whose token no slot records' },
	'optional-sequence-inline': { pass: 'clause hoist', shape: 'an optional sequence with one slot' },
	'optional-sequence-visible': { pass: 'clause hoist', shape: 'an optional sequence with several slots' },
	'structured-choice-arm': { pass: 'clause hoist', shape: 'a choice arm with structure of its own' },
	'field-routed-choice-arm': { pass: 'clause hoist', shape: 'a choice arm routed to a field of the enclosing list' },
	'permutation-arm-keyword': { pass: 'clause hoist', shape: 'a permutation arm led by a bare keyword' },
	'hidden-list-reference': { pass: 'clause hoist', shape: 'a reference to a hidden separated-list rule' },
	'trailing-list-separator': { pass: 'clause hoist', shape: 'a separated list followed by its own separator in the enclosing sequence' },
	'inline-list-run': { pass: 'clause hoist', shape: 'a separated list written inline in a sequence' },
	'multi-slot-repeat-element': { pass: 'clause hoist', shape: 'a repeat whose element has several slots' },
	'element-choice-supertype': { pass: 'clause hoist', shape: 'a repeated choice whose arms fill one slot' },
	'owner-prefixed-list-slot': { pass: 'owner-prefixed list field', shape: 'a hoisted list kind named after its owner, outside a field' },
	'inline-field-enum': { pass: 'field-enum synthesis', shape: 'a field holding a choice of literals' },
	'unlabeled-choice-arm': { pass: 'automatic variants', shape: 'a choice arm that is not labeled as a variant' },
	'inline-text-token': { pass: 'text-token mint', shape: 'an inline pattern or token with no rule of its own' },
	'missing-layout-supertype': { pass: 'whitespace', shape: 'a grammar with no layout supertype' }
} as const satisfies Record<string, EnrichShapeInfo>;

export type EnrichShapeCode = keyof typeof ENRICH_SHAPES;

export interface EnrichShape {
	readonly code: EnrichShapeCode;
	readonly ruleName: string;
}

export const ENRICH_SHAPES_KEY = '__enrichedShapes__' as const;

export function isEnrichShapeCode(code: string): code is EnrichShapeCode {
	return Object.hasOwn(ENRICH_SHAPES, code);
}

function sameRule(before: Rule, after: Rule): boolean {
	return before === after || JSON.stringify(before) === JSON.stringify(after);
}

export class EnrichShapeLog {
	private readonly keys = new Set<string>();
	private readonly found: EnrichShape[] = [];

	record(code: EnrichShapeCode, ruleName: string): void {
		const key = `${code}\u0000${ruleName}`;
		if (this.keys.has(key)) return;
		this.keys.add(key);
		this.found.push({ code, ruleName });
	}

	noted(code: EnrichShapeCode, ruleName: string, before: Rule, after: Rule): Rule {
		if (!sameRule(before, after)) this.record(code, ruleName);
		return after;
	}

	get shapes(): readonly EnrichShape[] {
		return this.found;
	}
}

export function enrichShapesOf(grammar: unknown): readonly EnrichShape[] {
	if (!grammar || typeof grammar !== 'object') return [];
	const shapes = (grammar as Record<string, unknown>)[ENRICH_SHAPES_KEY];
	return Array.isArray(shapes) ? (shapes as readonly EnrichShape[]) : [];
}

export function enrichShapeDiagnostics(grammar: string, shapes: readonly EnrichShape[]): GrammarDiagnostic[] {
	return shapes.map(({ code, ruleName }) => {
		const { pass, shape } = ENRICH_SHAPES[code];
		return {
			scope: 'grammar' as const,
			code,
			severity: 'error' as const,
			grammar,
			ownerKind: ruleName,
			message: `kind '${ruleName}' holds ${shape}; the ${pass} pass of enrich rewrites it, and this one reached the model as written.`,
			proposal: `Give the rule to enrich, or write the form enrich produces.`,
			canProceed: false,
			details: { pass }
		};
	});
}
