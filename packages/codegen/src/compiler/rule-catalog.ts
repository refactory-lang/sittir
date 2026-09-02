import {
	ALIAS,
	CHOICE,
	DEDENT,
	FIELD,
	GROUP,
	INDENT,
	NEWLINE,
	OPTIONAL,
	PATTERN,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SUPERTYPE,
	SYMBOL,
	TOKEN,
} from '../types/rule-types.ts'; // @rule-type-consts
import type { Rule, RuleId, SymbolRef } from '../types/rule.ts';
import { classifyByType } from '../dsl/rule-patterns.ts';
import { assertNever } from '../polymorph-variant.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';
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

export interface BuildRuleCatalogCtx {
	readonly provenanceByKind?: ReadonlyMap<string, RuleProvenance>;
}

function computeReachableRuleNames(rules: Record<string, Rule<'evaluate'>>): Set<string> {
	const walker = new RuleWalker<Rule<'evaluate'>>(rules);
	const reachable = new Set<string>();
	for (const name of Object.keys(rules)) {
		if (!name.startsWith('_')) reachable.add(name);
	}
	if (reachable.size === 0) return new Set(Object.keys(rules));
	for (const name of Object.keys(rules)) {
		if (name.startsWith('_')) continue;
		const rule = rules[name];
		if (!rule) continue;
		walker.foldDeep<null>(rule, null, (acc, r) => {
			if (r.type === SYMBOL) reachable.add(r.name);
			return acc;
		});
	}
	return reachable;
}

export function buildRuleCatalog(
	rules: Record<string, Rule<'evaluate'>>,
	ctx: BuildRuleCatalogCtx = {}
): RuleCatalogBuildResult {
	const provenanceByKind = ctx.provenanceByKind ?? new Map<string, RuleProvenance>();
	const byId = new Map<RuleId, RuleCatalogEntry>();
	const rootsByKind = new Map<string, RuleId>();
	const classificationById = new Map<RuleId, RuleClassification>();
	const identifiedRules: Record<string, Rule<'evaluate'>> = {};
	const reachable = computeReachableRuleNames(rules);

	for (const ownerKind of Object.keys(rules)) {
		const rule = rules[ownerKind];
		if (!rule) continue;
		if (ownerKind.startsWith('_') && !reachable.has(ownerKind)) continue;
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

export interface AttachReferenceRuleIdsCtx {
	readonly ruleCatalog: RuleCatalog;
}

export function attachReferenceRuleIds(references: readonly SymbolRef[], ctx: AttachReferenceRuleIdsCtx): SymbolRef[] {
	return references.map((ref) => {
		const fromRuleId = ctx.ruleCatalog.rootsByKind.get(ref.from);
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
	const id = createRuleId(params.ownerKind, { path: params.path });
	const children = identifyChildren({ ...params, selfId: id });
	const childIds = children.map((child) => child.id);
	const rule = withIdentifiedChildren({ rule: params.rule, id, children });
	const classification = classifyRule(rule, { id, children, force: params.force });

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

function identifyChildren(args: IdentifyParams & { readonly selfId: RuleId }): BuildResult[] {
	const { selfId, ...params } = args;

	const childParams = (childArgs: { rule: Rule<'evaluate'>; segment: RulePathSegment; force?: ClassificationForce }) =>
		identifyRule({
			rule: childArgs.rule,
			ownerKind: params.ownerKind,
			parentId: selfId,
			path: [...params.path, childArgs.segment],
			provenance: params.provenance,
			force: childArgs.force ?? {},
			byId: params.byId,
			classificationById: params.classificationById
		});

	switch (params.rule.type) {
		case SEQ:
		case CHOICE:
			return params.rule.members.map((member, index) =>
				childParams({ rule: member, segment: { edge: 'members', index } })
			);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case GROUP:
		case TOKEN:
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
		case 'IMMEDIATE_TOKEN':
			return [childParams({ rule: params.rule.content, segment: { edge: 'content' } })];
		case FIELD:
			return [
				childParams({
					rule: params.rule.content,
					segment: { edge: 'content' },
					force: {
						forcedBy: 'field',
						edgeName: params.rule.name
					}
				})
			];
		case ALIAS:
			return [
				childParams({
					rule: params.rule.content,
					segment: { edge: 'content' },
					force: {
						forcedBy: params.rule.named ? 'named-alias' : undefined,
						cstSurface: params.rule.named ? 'named' : 'anonymous'
					}
				})
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

function withIdentifiedChildren(args: {
	rule: Rule<'evaluate'>;
	id: RuleId;
	children: readonly BuildResult[];
}): Rule<'evaluate'> {
	const { rule, id, children } = args;
	switch (rule.type) {
		case SEQ:
		case CHOICE:
			return { ...rule, id, members: children.map((child) => child.rule) };
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case GROUP:
		case FIELD:
		case ALIAS:
		case TOKEN:
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
		case 'IMMEDIATE_TOKEN':
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
	ctx: {
		readonly id: RuleId;
		readonly children: readonly BuildResult[];
		readonly force: ClassificationForce;
	}
): RuleClassification {
	return {
		ruleId: ctx.id,
		kind: classifyIntrinsic(rule, { children: ctx.children }),
		...(ctx.force.forcedBy ? { forcedBy: ctx.force.forcedBy } : {}),
		...(ctx.force.edgeName ? { edgeName: ctx.force.edgeName } : {}),
		...(ctx.force.cstSurface ? { cstSurface: ctx.force.cstSurface } : {})
	};
}

function classifyIntrinsic(
	rule: Rule<'evaluate'>,
	ctx: { readonly children: readonly BuildResult[] }
): RuleClassification['kind'] {
	const anyChildNonterminal = ctx.children.some((child) => child.classification.kind === 'nonterminal');
	return classifyByType(rule.type, anyChildNonterminal);
}

function createRuleId(ownerKind: string, ctx: { readonly path: readonly RulePathSegment[] }): RuleId {
	if (ctx.path.length === 0) return `rule:${encodeURIComponent(ownerKind)}:root`;
	return `rule:${encodeURIComponent(ownerKind)}:${ctx.path.map(formatPathSegment).join('/')}`;
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
