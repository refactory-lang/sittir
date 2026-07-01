/**
 * compiler/rule-catalog.ts — Evaluate-owned rule occurrence identity.
 *
 * Evaluate is the first phase with a normalized rule tree, so it is the
 * only place that assigns foundational occurrence identity and rule
 * classification. Later phases may read these IDs and catalog entries,
 * but they should not reconstruct identity from local walks.
 */

import { ALIAS, CHOICE, DEDENT, FIELD, GROUP, INDENT, NEWLINE, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SUPERTYPE, SYMBOL, TOKEN, VARIANT } from '../types/rule-types.ts'; // @rule-type-consts
import { assertNever } from '../polymorph-variant.ts';
import type { Rule, RuleId, SymbolRef } from '../types/rule.ts';
import type { RuleCatalog, RuleCatalogEntry, RuleClassification, RulePathSegment, RuleProvenance } from './types.ts';

interface BuildResult {
	readonly rule: Rule<'evaluate'>;
	readonly id: RuleId;
	readonly classification: RuleClassification;
}

interface ClassificationForce {
	readonly forcedBy?: RuleClassification['forcedBy'];
	readonly edgeName?: string;
	readonly cstSurface?: RuleClassification['cstSurface'];
}

export interface RuleCatalogBuildResult {
	readonly rules: Record<string, Rule<'evaluate'>>;
	readonly ruleCatalog: RuleCatalog;
}

export function createEmptyRuleCatalog(): RuleCatalog {
	return {
		byId: new Map(),
		rootsByKind: new Map(),
		classificationById: new Map()
	};
}

export function buildRuleCatalog(
	rules: Record<string, Rule<'evaluate'>>,
	provenanceByKind: ReadonlyMap<string, RuleProvenance> = new Map()
): RuleCatalogBuildResult {
	const byId = new Map<RuleId, RuleCatalogEntry>();
	const rootsByKind = new Map<string, RuleId>();
	const classificationById = new Map<RuleId, RuleClassification>();
	const identifiedRules: Record<string, Rule<'evaluate'>> = {};

	for (const ownerKind of Object.keys(rules).sort()) {
		const rule = rules[ownerKind];
		if (!rule) continue;
		const provenance = provenanceByKind.get(ownerKind) ?? 'grammar-authored';
		const result = identifyRule({
			rule,
			ownerKind,
			parentId: undefined,
			path: [],
			provenance,
			force: {},
			byId,
			classificationById
		});
		identifiedRules[ownerKind] = result.rule;
		rootsByKind.set(ownerKind, result.id);
	}

	return {
		rules: identifiedRules,
		ruleCatalog: { byId, rootsByKind, classificationById }
	};
}

export function attachReferenceRuleIds(references: readonly SymbolRef[], ruleCatalog: RuleCatalog): SymbolRef[] {
	return references.map((ref) => {
		const fromRuleId = ruleCatalog.rootsByKind.get(ref.from);
		return fromRuleId ? { ...ref, fromRuleId } : { ...ref };
	});
}

interface IdentifyParams {
	readonly rule: Rule<'evaluate'>;
	readonly ownerKind: string;
	readonly parentId: RuleId | undefined;
	readonly path: readonly RulePathSegment[];
	readonly provenance: RuleProvenance;
	readonly force: ClassificationForce;
	readonly byId: Map<RuleId, RuleCatalogEntry>;
	readonly classificationById: Map<RuleId, RuleClassification>;
}

function identifyRule(params: IdentifyParams): BuildResult {
	const id = createRuleId(params.ownerKind, params.path);
	const children = identifyChildren(params, id);
	const childIds = children.map((child) => child.id);
	const rule = withIdentifiedChildren(params.rule, id, children);
	const classification = classifyRule(rule, id, children, params.force);

	params.byId.set(id, {
		id,
		ownerKind: params.ownerKind,
		ruleType: params.rule.type,
		parentId: params.parentId,
		path: params.path,
		childIds,
		provenance: params.provenance
	});
	params.classificationById.set(id, classification);

	return { rule, id, classification };
}

function identifyChildren(params: IdentifyParams, parentId: RuleId): BuildResult[] {
	const childParams = (rule: Rule<'evaluate'>, segment: RulePathSegment, force = {}) =>
		identifyRule({
			rule,
			ownerKind: params.ownerKind,
			parentId,
			path: [...params.path, segment],
			provenance: params.provenance,
			force,
			byId: params.byId,
			classificationById: params.classificationById
		});

	switch (params.rule.type) {
		case SEQ:
		case CHOICE:
			return params.rule.members.map((member, index) => childParams(member, { edge: 'members', index }));
		// PR-P: ENUM case removed — falls through to default (no children).
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case VARIANT:
		case GROUP:
		case TOKEN:
			return [childParams(params.rule.content, { edge: 'content' })];
		case FIELD:
			return [
				childParams(
					params.rule.content,
					{ edge: 'content' },
					{
						forcedBy: 'field',
						edgeName: params.rule.name
					}
				)
			];
		case ALIAS:
			return [
				childParams(
					params.rule.content,
					{ edge: 'content' },
					{
						forcedBy: params.rule.named ? 'named-alias' : undefined,
						cstSurface: params.rule.named ? 'named' : 'anonymous'
					}
				)
			];
		case SUPERTYPE:
		case STRING:
		case PATTERN:
		case INDENT:
		case DEDENT:
		case NEWLINE:
		case SYMBOL:
			return [];
		default:
			return assertNever(params.rule);
	}
}

function withIdentifiedChildren(rule: Rule<'evaluate'>, id: RuleId, children: readonly BuildResult[]): Rule<'evaluate'> {
	switch (rule.type) {
		case SEQ:
		case CHOICE:
			return { ...rule, id, members: children.map((child) => child.rule) };
		// PR-P: ENUM case removed — enum-shaped ChoiceRules handled by SEQ/CHOICE above.
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case VARIANT:
		case GROUP:
		case FIELD:
		case ALIAS:
		case TOKEN:
			return { ...rule, id, content: children[0]!.rule };
		case SUPERTYPE:
		case STRING:
		case PATTERN:
		case INDENT:
		case DEDENT:
		case NEWLINE:
		case SYMBOL:
			return { ...rule, id };
		default:
			return assertNever(rule);
	}
}

function classifyRule(
	rule: Rule<'evaluate'>,
	id: RuleId,
	children: readonly BuildResult[],
	force: ClassificationForce
): RuleClassification {
	const intrinsicKind = classifyIntrinsic(rule, children);
	const forcedKind = force.forcedBy === 'field' || force.forcedBy === 'named-alias' ? 'nonterminal' : intrinsicKind;
	return {
		ruleId: id,
		kind: forcedKind,
		...(force.forcedBy ? { forcedBy: force.forcedBy } : {}),
		...(force.edgeName ? { edgeName: force.edgeName } : {}),
		...(force.cstSurface ? { cstSurface: force.cstSurface } : {})
	};
}

/**
 * Single source of truth for the rule-type → terminality decision
 * (Table 1 in the nonterminal-driven-slot-derivation design).
 *
 * Both {@link classifyIntrinsic} (catalog build, classifies pre-built
 * `BuildResult` children) and {@link isNonterminalRuleType} (children-free
 * predicate over a bare `Rule<'evaluate'>`) call this with their own computation of
 * `anyChildNonterminal`, so the per-rule-type table lives in one place.
 */
function classifyByType(ruleType: Rule<'evaluate'>['type'], anyChildNonterminal: boolean): RuleClassification['kind'] {
	switch (ruleType) {
		case SYMBOL:
		case SUPERTYPE:
		case PATTERN:
		// PR-P: ENUM case removed — enum-shaped ChoiceRules use CHOICE arm.
			return 'nonterminal';
		case CHOICE:
		case REPEAT:
		case REPEAT1:
			// Unconditionally nonterminal: a choice is a single union slot
			// (literal-only = enum); a repeat captures a variable-length
			// sequence (array slot) even when its content is terminal.
			return 'nonterminal';
		case STRING:
		// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule<'evaluate'> union.
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return 'terminal';
		case TOKEN:
		case FIELD:
		case ALIAS:
		case SEQ:
		case OPTIONAL:
		case VARIANT:
		case GROUP:
			// Recursive: nonterminal iff any child is.
			return anyChildNonterminal ? 'nonterminal' : 'terminal';
		default:
			return assertNever(ruleType);
	}
}

function classifyIntrinsic(rule: Rule<'evaluate'>, children: readonly BuildResult[]): RuleClassification['kind'] {
	const anyChildNonterminal = children.some((child) => child.classification.kind === 'nonterminal');
	return classifyByType(rule.type, anyChildNonterminal);
}

/**
 * Pure, children-free terminality predicate over a {@link Rule<'evaluate'>}.
 *
 * Shares the per-rule-type decision table with {@link classifyIntrinsic} via
 * {@link classifyByType}, but recurses on the rule's own children instead of
 * pre-classified `BuildResult`s, so it can be called outside the catalog
 * build (e.g. wrapper-deletion push-down).
 *
 * Returns `true` when the rule is intrinsically a slot-bearing nonterminal.
 */
export function isNonterminalRuleType(rule: Rule<'evaluate'>): boolean {
	const anyChildNonterminal = ruleChildren(rule).some(isNonterminalRuleType);
	return classifyByType(rule.type, anyChildNonterminal) === 'nonterminal';
}

function ruleChildren(rule: Rule<'evaluate'>): readonly Rule<'evaluate'>[] {
	switch (rule.type) {
		case TOKEN:
		case FIELD:
		case ALIAS:
		case OPTIONAL:
		case VARIANT:
		case GROUP:
		// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule<'evaluate'> union.
			return [rule.content];
		case SEQ:
			return rule.members;
		default:
			return [];
	}
}

function createRuleId(ownerKind: string, path: readonly RulePathSegment[]): RuleId {
	if (path.length === 0) return `rule:${encodeURIComponent(ownerKind)}:root`;
	return `rule:${encodeURIComponent(ownerKind)}:${path.map(formatPathSegment).join('/')}`;
}

function formatPathSegment(segment: RulePathSegment): string {
	switch (segment.edge) {
		case 'content':
			return 'content';
		case 'members':
		case 'forms':
			return `${segment.edge}.${segment.index}`;
		default:
			return assertNever(segment);
	}
}
