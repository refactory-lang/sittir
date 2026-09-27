import {
	ALIAS,
	CHOICE,
	DEDENT,
	FIELD,
	IMMEDIATE_TOKEN,
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
import { collectOrphanedRules } from '../util/reachable-rules.ts';
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
	readonly roots?: readonly string[];
	readonly sourceKindOf?: ReadonlyMap<string, string>;
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
	const unreachable = new Set(
		Object.keys(rules).some((name) => !name.startsWith('_')) ? collectOrphanedRules(rules, new Set(ctx.roots)) : []
	);

	for (const ownerKind of Object.keys(rules)) {
		const rule = rules[ownerKind];
		if (!rule) continue;
		if (unreachable.has(ownerKind)) continue;
		const provenance = provenanceByKind.get(ownerKind) ?? 'grammar-authored';
		const result = identifyRule({
			rule,
			ownerKind,
			sourceKind: ctx.sourceKindOf?.get(ownerKind) ?? ownerKind,
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

export interface CollectReferencesCtx {
	readonly ruleCatalog: RuleCatalog;
}

interface ReferenceScope {
	readonly fieldName?: string;
	readonly optional: boolean;
	readonly repeated: boolean;
}

export function collectReferences(rules: Readonly<Record<string, Rule<'evaluate'>>>, ctx: CollectReferencesCtx): SymbolRef[] {
	const walker = new RuleWalker<Rule<'evaluate'>>();
	const references: SymbolRef[] = [];
	for (const [from, root] of Object.entries(rules)) {
		const fromRuleId = ctx.ruleCatalog.rootsByKind.get(from);
		const visit = (rule: Rule<'evaluate'>, scope: ReferenceScope): void => {
			if (rule.type === SYMBOL) {
				references.push({
					refType: 'symbol',
					from,
					to: rule.name,
					...(fromRuleId === undefined ? {} : { fromRuleId }),
					...(scope.fieldName === undefined ? {} : { fieldName: scope.fieldName }),
					...(scope.optional ? { optional: true } : {}),
					...(scope.repeated ? { repeated: true } : {})
				});
				return;
			}
			const inner: ReferenceScope = {
				fieldName: rule.type === FIELD ? rule.name : scope.fieldName,
				optional: scope.optional || rule.type === OPTIONAL,
				repeated: scope.repeated || rule.type === REPEAT || rule.type === REPEAT1
			};
			for (const child of walker.childrenOf(rule)) visit(child, inner);
		};
		visit(root, { optional: false, repeated: false });
	}
	return references;
}

interface IdentifyParams {
	readonly rule: Rule<'evaluate'>;
	readonly ownerKind: string;
	readonly sourceKind: string;
	readonly parentId: RuleId | undefined;
	readonly path: readonly RulePathSegment[];
	readonly provenance: RuleProvenance;
	readonly force: ClassificationForce;
	readonly byId: Map<RuleId, RuleCatalogEntry>;
	readonly classificationById: Map<RuleId, RuleClassification>;
}

function identifyRule(params: IdentifyParams): BuildResult {
	const id = createRuleId(params.sourceKind, { path: params.path });
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
			sourceKind: params.sourceKind,
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
		case TOKEN:
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
		case IMMEDIATE_TOKEN:
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
		case FIELD:
		case ALIAS:
		case TOKEN:
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
		case IMMEDIATE_TOKEN:
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

const RULE_ID_SCHEME = 'rule:';

export function createRuleId(ownerKind: string, ctx: { readonly path: readonly RulePathSegment[] }): RuleId {
	const owner = `${RULE_ID_SCHEME}${encodeURIComponent(ownerKind)}:`;
	return ctx.path.length === 0 ? `${owner}root` : `${owner}${ctx.path.map(formatPathSegment).join('/')}`;
}

export function ruleIdPath(id: RuleId): string {
	return id.slice(id.indexOf(':', RULE_ID_SCHEME.length) + 1);
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
