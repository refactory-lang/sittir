import {
	ALIAS,
	CHOICE,
	FIELD,
	GROUP,
	OPTIONAL,
	PATTERN,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SUPERTYPE,
	SYMBOL,
	TOKEN,
	VARIANT
} from '../types/rule-types.ts'; // @rule-type-consts
import type {
	Rule,
	AnyRule,
	RenderRule,
	SimplifiedRule,
	GroupRule,
	SymbolRule,
	SeqRule,
	ChoiceRule,
	RepeatRule,
	Repeat1Rule,
	StringRule,
	EnumRule,
	SupertypeRule
} from '../types/rule.ts';
import { isLinkSymbol, subtypeParseNamesOf } from '../types/rule.ts';
import { isEnumChoiceRule } from '../dsl/rule-patterns.ts';
import { isNonterminalRuleType } from '../dsl/rule-patterns.ts';
import type { SimplifiedGrammar, NodeMap, SignaturePool } from './types.ts';
import type { RuleId } from '../types/rule.ts';
import {
	collectGeneratedKindEntries,
	findEntryForKindName,
	findEntryForLiteralText,
	type GeneratedIdTables,
	type GeneratedKindEntry
} from './generated-metadata.ts';
import type {
	AssembledNode,
	AssembledNonterminal,
	NodeOrTerminal,
	SubtypeRef,
	UnresolvedRef
} from './model/node-map.ts';
import {
	AssembledBranch,
	AssembledPattern,
	AssembledKeyword,
	AssembledToken,
	AssembledEnum,
	AssembledSupertype,
	AssembledGroup,
	AssembledMulti,
	AssembledSeparatedList,
	drainParseKindCollisionDiagnostics,
	drainDeriveShapeDiagnostics,
	drainAssembleWarnings,
	recordAssembleWarning,
	resetAssembleWarnings,
	nameNode,
	isNodeRef,
	storageKindOfRef,
	isUnresolvedRef,
	allSlotsOf,
	resetParseKindCollisionDiagnostics,
	resetDeriveShapeDiagnostics,
	setOptionalBodyKinds,
	buildParseKindRuleSignatures,
	type AssembleWarning
} from './model/node-map.ts';
import { simplifyRule, hoistInnerFieldsForTemplate } from './simplify.ts';
import { deriveStructuralVariantChildren } from './variant-structural.ts';
import { inlineRefs } from '../dsl/rule-transforms.ts';
import { matchesWordShape } from '../util/word-matcher.ts';
import type { ParseKindCollisionDiagnostic } from '../types/parsekind-collisions.ts';
import type { DeriveShapeDiagnostic } from './diagnostics/derive-shapes.ts';
import { DiagnosticSink } from '../types/diagnostics.ts';
import { rootRuleName } from '../util/reachable-rules.ts';
import { stampSupertypeClosures } from './supertype-closure.ts';
import { BaseCtx, type BaseCtxInit } from './ctx.ts';

export class AssembleCtx extends BaseCtx<'simplify'> {
	readonly kindEntries?: readonly GeneratedKindEntry[];
	readonly generatedIdTables?: GeneratedIdTables;
	readonly topLevelAliasBodies: ReadonlyMap<string, Rule<'link'>>;
	readonly grammarJsonAliasMap: ReadonlyMap<string, string>;
	private readonly _nodes: Map<string, AssembledNode>;

	constructor(
		init: BaseCtxInit<'simplify'> & {
			generatedIdTables?: GeneratedIdTables;
			kindEntries?: readonly GeneratedKindEntry[];
			topLevelAliasBodies?: ReadonlyMap<string, Rule<'link'>>;
			grammarJsonAliasMap?: ReadonlyMap<string, string>;
			nodes?: Map<string, AssembledNode>;
		}
	) {
		super(init);
		this.kindEntries = init.kindEntries;
		this.generatedIdTables = init.generatedIdTables;
		this.topLevelAliasBodies = init.topLevelAliasBodies ?? new Map();
		this.grammarJsonAliasMap = init.grammarJsonAliasMap ?? new Map();
		this._nodes = init.nodes ?? new Map();
	}

	get rules(): Record<string, SimplifiedRule> {
		return this.grammar.rules;
	}

	get normalizedRules(): Record<string, RenderRule> {
		return this.grammar.normalizedRules;
	}

	get nodes(): Map<string, AssembledNode> {
		return this._nodes;
	}

	static from(
		normalized: SimplifiedGrammar,
		generatedIdTables?: GeneratedIdTables,
		diagnostics: DiagnosticSink = new DiagnosticSink(),
		grammarJsonAliasMap?: ReadonlyMap<string, string>
	): AssembleCtx {
		return new AssembleCtx({
			grammar: normalized,
			diagnostics,
			wordMatcher: (s) => matchesWordShape(s, normalized.wordMatcher),
			generatedIdTables,
			topLevelAliasBodies: normalized.topLevelAliasBodies ?? new Map(),
			grammarJsonAliasMap
		});
	}
}

export interface AssembledNodeMap extends NodeMap {
	readonly parseKindCollisions: readonly ParseKindCollisionDiagnostic[];
	readonly deriveShapeDiagnostics: readonly DeriveShapeDiagnostic[];
	readonly assembleWarnings: readonly AssembleWarning[];
}

export function assemble(ctx: AssembleCtx): AssembledNodeMap {
	const normalized = ctx.grammar;
	const wordMatcherRegex = normalized.wordMatcher;
	const nodes = ctx.nodes;
	const kindEntries = ctx.kindEntries ?? collectGeneratedKindEntries(ctx.generatedIdTables);
	resetParseKindCollisionDiagnostics();
	resetDeriveShapeDiagnostics();
	const variantChildrenByParent = deriveStructuralVariantChildren(normalized.linkRules);
	const variantParents = new Set(variantChildrenByParent.keys());

	const optionalBodyKinds = collectOptionalBodyKinds(normalized.linkRules);
	setOptionalBodyKinds(optionalBodyKinds);
	const parseKindCollisionContext = {
		ruleSignatures: buildParseKindRuleSignatures(normalized.normalizedRules!)
	} as const;

	try {
		for (const [kind, rule] of Object.entries(normalized.linkRules)) {
			const assemblyRule = normalized.topLevelAliasBodies?.get(kind) ?? rule;
			const inlinedRule = hoistInnerFieldsForTemplate(inlineRefs(assemblyRule, { rules: normalized.linkRules }));
			const simplifiedRule = normalized.rules[kind]!;
			const renderRule: RenderRule = normalized.normalizedRules![kind]!;
			const modelType = classifyNode(kind, renderRule, {
				variantParents,
				parentAliasedKinds: normalized.parentAliasedKinds,
				wordMatcher: wordMatcherRegex
			});
			const variantChildKinds = variantChildrenByParent.get(kind);

			switch (modelType) {
				case 'branch': {
					nodes.set(
						kind,
						new AssembledBranch(
							kind,
							inlinedRule as SeqRule<'link'> | ChoiceRule<'link'> | RepeatRule | Repeat1Rule,
							simplifiedRule,
							renderRule,
							{
								variantChildKinds,
								kindEntries,
								parseKindCollisionContext,
								visibleAliasTargets: normalized.visibleAliasTargets,
								simplifiedRules: normalized.rules
							}
						)
					);
					break;
				}
				case 'pattern': {
					nodes.set(kind, new AssembledPattern(kind, renderRule));
					break;
				}
				case 'keyword':
				case 'token': {
					if (renderRule.type !== STRING) {
						throw new Error(
							`[assemble] ${modelType} kind '${kind}' must be a single literal; found ${renderRule.type}`
						);
					}
					nodes.set(
						kind,
						modelType === 'keyword'
							? new AssembledKeyword(kind, renderRule, { kindEntries })
							: new AssembledToken(kind, renderRule, { kindEntries })
					);
					break;
				}
				case 'enum': {
					nodes.set(kind, new AssembledEnum(kind, assemblyRule as EnumRule<'link'>, { kindEntries }));
					break;
				}
				case 'supertype': {
					const subtypes = resolveSupertypeSubtypes(assemblyRule, ctx, kindEntries);
					nodes.set(
						kind,
						new AssembledSupertype(kind, assemblyRule as SupertypeRule<'link'> | ChoiceRule<'link'>, subtypes)
					);
					break;
				}
				case 'group': {
					const { groupRule, groupSimplified, groupRenderRule } = unwrapGroupRuleAndSimplified(
						assemblyRule,
						simplifiedRule,
						renderRule
					);
					nodes.set(
						kind,
						new AssembledGroup(kind, groupRule, groupSimplified, groupRenderRule, {
							kindEntries,
							parseKindCollisionContext
						})
					);
					break;
				}
				case 'multi': {
					nodes.set(kind, new AssembledMulti(kind, renderRule));
					break;
				}
				case 'separatedList': {
					const { groupRule, groupSimplified, groupRenderRule } = unwrapGroupRuleAndSimplified(
						inlinedRule,
						simplifiedRule,
						renderRule
					);
					const listRule = peelSeparatedListCore(groupRule) as RepeatRule | Repeat1Rule;
					const sep = listRule.separator;
					const separatorRule = sep && isNonterminalRuleType(sep.value as Rule<'evaluate'>) ? sep.value : undefined;
					nodes.set(
						kind,
						new AssembledSeparatedList(
							kind,
							listRule,
							{ kindEntries },
							{
								separatorRule,
								simplifiedRule: groupSimplified,
								renderRule: groupRenderRule,
								parseKindCollisionContext
							}
						)
					);
					break;
				}
			}
		}

		for (const rule of Object.values(normalized.linkRules)) {
			if (rule.type !== SUPERTYPE) continue;
			for (const [subName, aliasName] of Object.entries(subtypeParseNamesOf(rule))) {
				if (nodes.has(aliasName)) continue;
				const subRule = normalized.linkRules[subName];
				if (!subRule || subRule.type !== SUPERTYPE) continue;
				const subtypes = resolveSupertypeSubtypes(subRule, ctx, kindEntries);
				nodes.set(aliasName, new AssembledSupertype(aliasName, subRule, subtypes));
			}
		}

		collectAnonymousNodes(normalized.linkRules, nodes, wordMatcherRegex, kindEntries);
		resolveCollidingNames(nodes);
		resolveIrKeys(nodes);
		stampFactoryInline(nodes, ctx, stampSupertypeClosures(nodes));
		const aliasSourceKinds = new Set<string>();
		for (const n of nodes.values()) {
			for (const slot of allSlotsOf(n)) {
				for (const v of slot.values) {
					if (!isNodeRef(v)) continue;
					const name = storageKindOfRef(v.node);
					if (name.startsWith('_')) aliasSourceKinds.add(name);
				}
			}
		}
		const variantChildKindsSet = new Set<string>([...variantChildrenByParent.values()].flat());
		for (const rule of Object.values(normalized.linkRules)) {
			if (rule.type !== SUPERTYPE || !rule.variantArms) continue;
			for (const arm of rule.variantArms) variantChildKindsSet.add(arm);
		}
		const userFacingCtx: _UserFacingCtx = {
			aliasSourceKinds,
			variantChildKinds: variantChildKindsSet
		};
		for (const node of nodes.values()) {
			markUserFacing(node, userFacingCtx);
		}

		for (const node of nodes.values()) {
			if (node.modelType === 'branch' || node.modelType === 'group') {
				node.attachNodeMap(nodes);
			}
		}

		const nodeByRuleId = new Map<RuleId, AssembledNode>();
		const slotByRuleId = new Map<RuleId, AssembledNonterminal>();
		for (const [kind, rule] of Object.entries(normalized.linkRules)) {
			const node = nodes.get(kind);
			if (!node) continue;
			if (rule.id) nodeByRuleId.set(rule.id, node);
		}
		for (const node of nodes.values()) {
			for (const slot of allSlotsOf(node)) {
				for (const id of slot.sourceRuleIds) slotByRuleId.set(id, slot);
			}
		}

		return {
			name: normalized.name,
			nodes,
			nodeByRuleId,
			slotByRuleId,
			aliasedHiddenKinds: normalized.aliasedHiddenKinds,
			terminalAliasWireIds: normalized.terminalAliasWireIds,
			signatures: computeSignatures(nodes),
			derivations: normalized.derivations,
			linkRules: normalized.linkRules,
			normalizedRules: normalized.normalizedRules,
			word: normalized.word,
			wordMatcher: normalized.wordMatcher,
			externals: normalized.externals ? new Set(normalized.externals) : undefined,
			extras: normalized.extras ? new Set(normalized.extras) : undefined,
			polymorphFormKinds: computePolymorphFormKinds(nodes),
			refineForms: normalized.refineForms,
			parseKindCollisions: drainParseKindCollisionDiagnostics(),
			deriveShapeDiagnostics: drainDeriveShapeDiagnostics(),
			assembleWarnings: drainAssembleWarnings()
		};
	} finally {
		resetParseKindCollisionDiagnostics();
		resetDeriveShapeDiagnostics();
		resetAssembleWarnings();
		setOptionalBodyKinds(null);
	}
}

function computePolymorphFormKinds(_nodes: Map<string, AssembledNode>): Set<string> {
	return new Set<string>();
}

function collectOptionalBodyKinds(rules: Record<string, Rule<'link'>>): ReadonlySet<string> {
	const out = new Set<string>();
	const isBlank = (r: Rule<'link'>): boolean =>
		(r.type === CHOICE && r.members.length === 0) || (r.type === SEQ && r.members.length === 0);
	const unwrap = (r: Rule<'link'>): Rule<'link'> => {
		if (r.type === ALIAS || r.type === TOKEN) {
			return unwrap((r as { content: Rule<'link'> }).content);
		}
		return r;
	};
	for (const [kind, rule] of Object.entries(rules)) {
		const body = unwrap(rule);
		if (body.type === OPTIONAL) {
			out.add(kind);
			continue;
		}
		if (body.type === CHOICE && body.members.some(isBlank)) {
			out.add(kind);
		}
	}
	return out;
}

function resolveSupertypeSubtypes(
	rule: Rule<'link'>,
	ctx: AssembleCtx,
	kindEntries: readonly GeneratedKindEntry[]
): SubtypeRef[] {
	let subtypes: SubtypeRef[];
	if (rule.type === SUPERTYPE) {
		subtypes = rule.subtypes.map((s) => ({
			name: s.aliasedFrom ?? s.name,
			storageKindId: s.aliasedFromId ?? s.kindId
		}));
	} else if (rule.type === CHOICE) {
		subtypes = rule.members
			.map((m) => (m.type === VARIANT ? m.content : m))
			.filter((m): m is SymbolRule<'link'> => m.type === SYMBOL)
			.map((m) => ({ name: m.name, storageKindId: m.aliasedFromId ?? m.kindId }));
	} else {
		subtypes = [];
	}
	return resolveHiddenSubtypes(
		subtypes,
		ctx,
		kindEntries,
		rule.type === SUPERTYPE ? rule.name : undefined,
		rule.type === SUPERTYPE ? subtypeParseNamesOf(rule) : undefined
	);
}

function unwrapGroupRuleAndSimplified(
	rule: Rule<'link'>,
	simplifiedRule: SimplifiedRule,
	renderRule: RenderRule
): { groupRule: Rule<'link'>; groupSimplified: SimplifiedRule; groupRenderRule: RenderRule } {
	const groupRule = rule.type === GROUP ? rule.content : rule;
	const groupSimplified = rule.type === GROUP ? (simplifiedRule as GroupRule<'simplify'>).content : simplifiedRule;
	const groupRenderRule: RenderRule =
		rule.type === GROUP ? ((renderRule as GroupRule<'normalize'>).content as RenderRule) : renderRule;
	return { groupRule, groupSimplified, groupRenderRule };
}

function stampFactoryInline(
	nodes: Map<string, AssembledNode>,
	ctx: AssembleCtx,
	supertypeClosures: ReadonlyMap<string, ReadonlySet<string>>
): void {
	const declared = ctx.grammar.factoryInline;
	if (declared.size === 0) return;

	const parentsByKind = new Map<string, Set<string>>();
	const supertypesByMember = new Map<string, string[]>();
	for (const node of nodes.values()) {
		for (const slot of allSlotsOf(node)) {
			for (const value of slot.values) {
				if (!isNodeRef(value)) continue;
				const referenced = storageKindOfRef(value.node);
				const referrers = parentsByKind.get(referenced);
				if (referrers) referrers.add(node.kind);
				else parentsByKind.set(referenced, new Set([node.kind]));
			}
		}
	}
	for (const [supertype, members] of supertypeClosures) {
		for (const member of members) {
			const carriers = supertypesByMember.get(member);
			if (carriers) carriers.push(supertype);
			else supertypesByMember.set(member, [supertype]);
		}
	}

	const rootKind = rootRuleName(ctx.grammar.rules);
	for (const kind of declared) {
		const node = nodes.get(kind);
		if (!node) {
			emitUnnestable(kind, ctx, 'no kind by that name exists in the grammar');
			continue;
		}
		node.factoryInline = true;
		if (kind === rootKind) {
			emitUnnestable(kind, ctx, 'it is the grammar root, so no slot can carry its config');
			continue;
		}
		const parents = parentsByKind.get(kind);
		if (parents === undefined || parents.size === 0) {
			emitUnnestable(kind, ctx, 'no slot references it');
			continue;
		}
		const escaped = (supertypesByMember.get(kind) ?? []).filter((supertype) =>
			[...(parentsByKind.get(supertype) ?? [])].some((referrer) => !parents.has(referrer))
		);
		if (escaped.length > 0) {
			emitUnnestable(
				kind,
				ctx,
				`it is a member of supertype ${escaped.join(', ')}, referenced from a slot outside its own parents (${[...parents].sort().join(', ')})`
			);
		}
	}
}

function emitUnnestable(kind: string, ctx: AssembleCtx, reason: string): void {
	ctx.diagnostics.fail({
		code: 'factory-inline-unnestable',
		scope: 'compiler',
		phase: 'assemble',
		message: `factoryInline kind '${kind}' has nowhere to nest: ${reason}.`
	});
}

function resolveIrKeys(nodes: Map<string, AssembledNode>): void {
	const claimed = new Set<string>();
	preclaimSupertypeIrKeys(nodes, claimed);
	const { phase1, phase2 } = partitionNodesIntoIrKeyPhases(nodes);
	for (const node of phase1) assignIrKeyWithFallback(node, claimed);
	for (const node of phase2) assignIrKeyWithFallback(node, claimed);
}

function resolveHiddenSubtypes(
	names: readonly SubtypeRef[],
	ctx: AssembleCtx,
	kindEntries: readonly GeneratedKindEntry[],
	ownerName?: string,
	subtypeParseNames?: Readonly<Record<string, string>>
): SubtypeRef[] {
	const { normalizedRules: rules, topLevelAliasBodies } = ctx;
	const out: SubtypeRef[] = [];
	const seen = new Set<string>();
	const visit = (ref: SubtypeRef): void => {
		const name = ref.name;
		if (seen.has(name)) return;
		seen.add(name);
		if (!name.startsWith('_')) {
			out.push(ref);
			return;
		}
		const rule = rules[name];
		if (!rule) {
			out.push(ref);
			return;
		}
		if (rule.type !== SUPERTYPE && subtypeParseNames && Object.prototype.hasOwnProperty.call(subtypeParseNames, name)) {
			out.push(ref);
			return;
		}
		if (rule.type === SUPERTYPE) {
			out.push(ref);
			const nestedParseNames = subtypeParseNamesOf(rule);
			for (const subRef of rule.subtypes) {
				const sub = subRef.aliasedFrom ?? subRef.name;
				const subStamp = subRef.aliasedFromId ?? subRef.kindId;
				const parseName = nestedParseNames[sub];
				const subRule = sub.startsWith('_') ? rules[sub] : undefined;
				if (parseName !== undefined && subRule?.type === SUPERTYPE) {
					if (!seen.has(parseName)) {
						seen.add(parseName);
						out.push({ name: parseName });
					}
					continue;
				}
				if (sub.startsWith('_')) {
					visit({ name: sub, storageKindId: subStamp });
					continue;
				}
				if (!seen.has(sub)) {
					seen.add(sub);
					out.push({ name: sub, storageKindId: subStamp });
				}
			}
			return;
		}
		if (topLevelAliasBodies.has(name)) out.push(ref);
		const resolved = resolveHiddenRuleContent(rule, new Set([name]), ctx, kindEntries);
		if (resolved.length === 0) {
			if (!out.some((o) => o.name === name)) out.push(ref);
			return;
		}
		for (const r of resolved) {
			if (r.name.startsWith('_')) {
				visit(r);
				continue;
			}
			if (!seen.has(r.name)) {
				seen.add(r.name);
				out.push(r);
			}
		}
	};
	for (const n of names) visit(n);
	return includeAliasMemberKinds(out, ctx, kindEntries, ownerName);
}

function includeAliasMemberKinds(
	subtypes: readonly SubtypeRef[],
	ctx: AssembleCtx,
	kindEntries: readonly GeneratedKindEntry[],
	ownerName?: string
): SubtypeRef[] {
	const { normalizedRules: rules } = ctx;
	const out = [...subtypes];
	const subtypeSet = new Set(subtypes.map((s) => s.name));
	let changed = true;
	while (changed) {
		changed = false;
		for (const name of Object.keys(rules)) {
			if (!name.startsWith('_')) continue;
			if (name === ownerName) continue;
			if (subtypeSet.has(name)) continue;
			if (!isAliasMemberKind(name, ctx, subtypeSet, kindEntries)) continue;
			out.push({ name, storageKindId: findEntryForKindName(kindEntries, name)?.id });
			subtypeSet.add(name);
			changed = true;
		}
	}
	return out;
}

function isAliasMemberKind(
	name: string,
	ctx: AssembleCtx,
	subtypeSet: ReadonlySet<string>,
	kindEntries: readonly GeneratedKindEntry[]
): boolean {
	const { normalizedRules: rules, topLevelAliasBodies } = ctx;
	if (!topLevelAliasBodies.has(name)) return false;
	const body = rules[name];
	if (!body) return false;
	const resolved = resolveHiddenRuleContent(body, new Set([name]), ctx, kindEntries);
	if (resolved.length === 0) return false;
	return resolved.every((member) => isCompatibleSubtypeMember(member.name, ctx, subtypeSet, new Set(), kindEntries));
}

function isCompatibleSubtypeMember(
	name: string,
	ctx: AssembleCtx,
	subtypeSet: ReadonlySet<string>,
	seen: Set<string>,
	kindEntries: readonly GeneratedKindEntry[]
): boolean {
	const { normalizedRules: rules } = ctx;
	if (subtypeSet.has(name)) return true;
	if (!name.startsWith('_')) return false;
	if (seen.has(name)) return false;
	const rule = rules[name];
	if (!rule) return false;
	seen.add(name);
	const resolved = resolveHiddenRuleContent(rule, new Set([name]), ctx, kindEntries);
	if (resolved.length === 0) return false;
	return resolved.every((member) => isCompatibleSubtypeMember(member.name, ctx, subtypeSet, seen, kindEntries));
}

function resolveHiddenRuleContent(
	rule: RenderRule,
	seen: Set<string>,
	ctx: AssembleCtx,
	kindEntries: readonly GeneratedKindEntry[]
): SubtypeRef[] {
	const rules = ctx.normalizedRules;
	if (rule.multiplicity === 'array' || rule.multiplicity === 'nonEmptyArray' || rule.multiplicity === 'optional') {
		return [];
	}
	if (rule.fieldName !== undefined) {
		return [];
	}
	if (isEnumChoiceRule(rule)) {
		return [];
	}
	switch (rule.type) {
		case SYMBOL: {
			const refName = rule.aliasedFrom ?? rule.name;
			const refStamp = rule.aliasedFromId ?? rule.kindId;
			if (!refName.startsWith('_')) return [{ name: refName, storageKindId: refStamp }];
			if (seen.has(refName)) return [];
			seen.add(refName);
			const target = rules[refName];
			return target
				? resolveHiddenRuleContent(target, seen, ctx, kindEntries)
				: [{ name: refName, storageKindId: refStamp }];
		}
		case SUPERTYPE:
			return rule.subtypes.flatMap((symbolRef) => {
				const s = symbolRef.aliasedFrom ?? symbolRef.name;
				const sStamp = symbolRef.aliasedFromId ?? symbolRef.kindId;
				if (seen.has(s)) return [];
				seen.add(s);
				if (!s.startsWith('_')) return [{ name: s, storageKindId: sStamp }];
				const target = rules[s];
				return target ? resolveHiddenRuleContent(target, seen, ctx, kindEntries) : [{ name: s, storageKindId: sStamp }];
			});
		case CHOICE:
			return rule.members.flatMap((m) => resolveHiddenRuleContent(m, seen, ctx, kindEntries));
		case STRING: {
			const isWordShape = ctx.wordMatcher ? ctx.wordMatcher(rule.value) : matchesWordShape(rule.value, undefined);
			if (isWordShape) return [];
			const entry = findEntryForLiteralText(kindEntries, rule.value);
			return [{ name: entry?.kind ?? rule.value, storageKindId: rule.resolvedKindId ?? entry?.id }];
		}
		case VARIANT:
		case GROUP:
			return resolveHiddenRuleContent(rule.content, seen, ctx, kindEntries);
		case SEQ:
			return [];
		default:
			return [];
	}
}

export function hydrateSlotRefs(nodeMap: NodeMap): void {
	const externals = nodeMap.externals ?? new Set<string>();
	for (const [kind, node] of nodeMap.nodes) {
		if (node.modelType === 'branch' || node.modelType === 'group') {
			hydrateSlots(kind, node.slots, nodeMap.nodes, externals);
		}
		if (node.modelType === 'supertype') {
			hydrateValues(node.subtypes, { parentKind: kind, siteLabel: 'subtypes', nodes: nodeMap.nodes, externals });
		}
	}
}

function hydrateSlots(
	parentKind: string,
	slots: Readonly<Record<string, AssembledNonterminal>>,
	nodes: Map<string, AssembledNode>,
	externals: ReadonlySet<string>
): void {
	for (const slot of Object.values(slots)) {
		hydrateValues(slot.values, { parentKind, siteLabel: `slot '${slot.name}'`, nodes, externals });
	}
}

interface HydrateValuesCtx {
	readonly parentKind: string;
	readonly siteLabel: string;
	readonly nodes: Map<string, AssembledNode>;
	readonly externals: ReadonlySet<string>;
}

function hydrateValues(values: readonly NodeOrTerminal[], ctx: HydrateValuesCtx): void {
	const { parentKind, siteLabel, nodes, externals } = ctx;
	for (const v of values) {
		if (!isNodeRef(v)) continue;
		if (!isUnresolvedRef(v.node)) continue;
		const targetName = v.node.name;
		const target = nodes.get(targetName);
		if (target) {
			(v as { node: AssembledNode | UnresolvedRef }).node = target;
			continue;
		}
		if (externals.has(targetName)) continue;
		if (!process.env.SITTIR_QUIET) {
			process.stderr.write(
				`hydrateSlotRefs: unresolved slot reference — kind ` +
					`'${parentKind}' ${siteLabel} references kind ` +
					`'${targetName}' which is absent from the assembled ` +
					`node map (likely parser-only leaf kind, alias collapse, ` +
					`or override referencing an inlined kind). Leaving as ` +
					`UnresolvedRef.\n`
			);
		}
	}
}

interface _UserFacingCtx {
	readonly aliasSourceKinds: ReadonlySet<string>;
	readonly variantChildKinds: ReadonlySet<string>;
}

function markUserFacing(node: AssembledNode, ctx: _UserFacingCtx): void {
	const { kind } = node;
	if (node.modelType === 'token' || node.modelType === 'multi') {
		node.userFacing = ctx.variantChildKinds.has(kind);
		return;
	}
	if (!kind.startsWith('_')) {
		node.userFacing = true;
		return;
	}
	node.userFacing = ctx.aliasSourceKinds.has(kind) || ctx.variantChildKinds.has(kind);
}

function resolveCollidingNames(nodes: Map<string, AssembledNode>): void {
	const byType = new Map<string, AssembledNode[]>();
	for (const node of nodes.values()) {
		const bucket = byType.get(node.typeName) ?? [];
		bucket.push(node);
		byType.set(node.typeName, bucket);
	}
	for (const [typeName, group] of byType) {
		if (group.length < 2) continue;
		const visible = group.filter((n) => !n.kind.startsWith('_'));
		const hidden = group.filter((n) => n.kind.startsWith('_'));
		if (visible.length >= 1 && hidden.length >= 1) {
			renameCollidingHiddenKinds(visible, hidden, typeName);
		} else if (visible.length >= 2) {
			renameCollidingVisibleKinds(visible, typeName);
		} else if (hidden.length >= 2) {
			renameCollidingHiddenOnlyKinds(hidden, typeName);
		}
	}
}

function renameCollidingHiddenKinds(visible: AssembledNode[], hidden: AssembledNode[], typeName: string): void {
	const hasNonTokenVisible = visible.some((n) => n.modelType !== 'token');
	if (!hasNonTokenVisible) return;
	for (const h of hidden) {
		const newType = `_${typeName}`;
		recordAssembleWarning({
			code: 'typename-collision',
			message:
				`[assemble] typeName collision: kind '${h.kind}' renamed ` +
				`'${typeName}' → '${newType}' (visible sibling(s): ${visible.map((v) => `'${v.kind}'`).join(', ')})`,
			ownerKind: h.kind,
			details: { typeName, newType, visibleKinds: visible.map((v) => v.kind) }
		});
		h.typeName = newType;
		if (h.factoryName !== undefined) {
			h.factoryName = `_${typeName.charAt(0).toLowerCase()}${typeName.slice(1)}`;
		}
	}
}

function renameCollidingVisibleKinds(visible: AssembledNode[], typeName: string): void {
	const sorted = [...visible].sort((a, b) => a.kind.localeCompare(b.kind));
	for (let i = 1; i < sorted.length; i++) {
		const n = sorted[i]!;
		const newType = `${typeName}${i + 1}`;
		recordAssembleWarning({
			code: 'typename-collision',
			message:
				`[assemble] typeName collision between visible kinds: '${n.kind}' renamed ` +
				`'${typeName}' → '${newType}' (siblings: ${sorted
					.slice(0, i)
					.map((s) => `'${s.kind}'`)
					.join(', ')})`,
			ownerKind: n.kind,
			details: { typeName, newType, siblingKinds: sorted.slice(0, i).map((s) => s.kind) }
		});
		n.typeName = newType;
		if (n.factoryName !== undefined) {
			n.factoryName = newType.charAt(0).toLowerCase() + newType.slice(1);
		}
	}
}

function renameCollidingHiddenOnlyKinds(hidden: AssembledNode[], typeName: string): void {
	for (let i = 1; i < hidden.length; i++) {
		const h = hidden[i]!;
		const newType = `${typeName}${i + 1}`;
		recordAssembleWarning({
			code: 'typename-collision',
			message: `[assemble] typeName collision among hidden kinds: '${h.kind}' renamed '${typeName}' → '${newType}'`,
			ownerKind: h.kind,
			details: { typeName, newType }
		});
		h.typeName = newType;
		if (h.factoryName !== undefined) {
			h.factoryName = newType.charAt(0).toLowerCase() + newType.slice(1);
		}
	}
}

function preclaimSupertypeIrKeys(nodes: Map<string, AssembledNode>, claimed: Set<string>): void {
	for (const node of nodes.values()) {
		if (node.modelType !== 'supertype') continue;
		claimed.add(shortenIrKey(node.kind));
	}
}

function partitionNodesIntoIrKeyPhases(nodes: Map<string, AssembledNode>): {
	phase1: AssembledNode[];
	phase2: AssembledNode[];
} {
	const phase1: AssembledNode[] = [];
	const phase2: AssembledNode[] = [];
	for (const node of nodes.values()) {
		if (!node.factoryName) continue;
		if (node.modelType === 'group') continue;
		const short = shortenIrKey(node.kind);
		if (short === node.factoryName) phase1.push(node);
		else phase2.push(node);
	}
	const hiddenSort = (a: AssembledNode, b: AssembledNode) => {
		const aHidden = a.kind.startsWith('_') ? 1 : 0;
		const bHidden = b.kind.startsWith('_') ? 1 : 0;
		return aHidden - bHidden;
	};
	phase1.sort(hiddenSort);
	phase2.sort(hiddenSort);
	return { phase1, phase2 };
}

function assignIrKeyWithFallback(node: AssembledNode, claimed: Set<string>): void {
	const short = shortenIrKey(node.kind);
	if (!claimed.has(short)) {
		claimed.add(short);
		node.irKey = short;
		return;
	}
	let full = node.factoryName!;
	let candidate = full;
	let n = 2;
	while (claimed.has(candidate)) {
		candidate = `${full}${n++}`;
	}
	claimed.add(candidate);
	node.irKey = candidate;
}

function shortenIrKey(kind: string): string {
	const stripped = kind;
	const parts = stripped.split('_').filter(Boolean);
	if (parts.length === 0) return nameNode(kind).irKey;
	const camel = parts.map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))).join('');
	return camel;
}

function collectAnonymousNodes(
	rules: Record<string, Rule<'link'>>,
	nodes: Map<string, AssembledNode>,
	wordMatcher: RegExp | undefined,
	kindEntries: readonly GeneratedKindEntry[]
): void {
	const seen = new Map<string, string>();

	for (const rule of Object.values(rules)) {
		const body =
			rule.type === TOKEN && (rule.content.type === STRING || rule.content.type === PATTERN) ? rule.content : rule;
		if (body.type !== STRING && body.type !== PATTERN && isAllTextShape(body)) continue;
		walkForStrings(body, seen);
	}

	for (const [kindName, literalText] of seen) {
		if (literalText === '' || /^\s+$/.test(literalText)) continue;

		const catalogEntry = findEntryForLiteralText(kindEntries, literalText);
		const resolvedKind = catalogEntry?.kind ?? kindName;
		if (nodes.has(resolvedKind)) continue;

		if (catalogEntry === undefined) {
			recordAssembleWarning({
				code: 'kindid-unstamped-anon-literal',
				message: `[assemble] anonymous literal ${JSON.stringify(literalText)} resolved no parser kindId — keyed by raw text '${kindName}'`,
				ownerKind: kindName,
				details: { literalText }
			});
		}

		const isWordShape = matchesWordShape(literalText, wordMatcher);
		const syntheticStringRule: StringRule = { type: STRING, value: literalText };

		if (isWordShape) {
			nodes.set(resolvedKind, new AssembledKeyword(resolvedKind, syntheticStringRule, { hidden: true, kindEntries }));
		} else {
			nodes.set(resolvedKind, new AssembledToken(resolvedKind, syntheticStringRule, { kindEntries }));
		}
	}
}

function walkForStrings(rule: Rule<'link'>, out: Map<string, string>): void {
	switch (rule.type) {
		case STRING:
			out.set(rule.value, rule.value);
			break;
		case SYMBOL:
			if (isLinkSymbol(rule) && rule.literal !== undefined) {
				out.set(rule.name, rule.literal);
			}
			break;
		case SEQ:
			for (const m of rule.members) walkForStrings(m, out);
			break;
		case CHOICE:
			if (isEnumChoiceRule(rule)) break;
			if (rule.members.length >= 2 && rule.members.every((m) => isLinkSymbol(m) && m.literal !== undefined)) break;
			for (const m of rule.members) walkForStrings(m, out);
			break;
		case OPTIONAL:
			walkForStrings(rule.content, out);
			break;
		case REPEAT:
			walkForStrings(rule.content, out);
			break;
		case FIELD:
		case TOKEN:
		case VARIANT:
		case GROUP:
			walkForStrings(rule.content, out);
			break;
	}
}

type ModelType = AssembledNode['modelType'];

export function isNonInlinableLeafShape(rule: AnyRule): boolean {
	if (isEnumChoiceRule(rule)) return true;
	return rule.type === SUPERTYPE || rule.type === PATTERN || rule.type === STRING;
}

export function classifyNode(
	kind: string,
	rule: RenderRule,
	opts?: { variantParents?: ReadonlySet<string>; parentAliasedKinds?: ReadonlySet<string>; wordMatcher?: RegExp }
): ModelType {
	if (rule.fieldName === undefined && rule.multiplicity === undefined) {
		if (isEnumChoiceRule(rule)) return 'enum';
		switch (rule.type) {
			case SUPERTYPE:
				return 'supertype';
			case GROUP:
				if (isSeparatedListShape(peelSeparatedListCore(rule) as RenderRule)) return 'separatedList';
				return 'group';
			case PATTERN:
				return 'pattern';
			case STRING:
				return matchesWordShape(rule.value, opts?.wordMatcher) ? 'keyword' : 'token';
		}
	}

	if (isHiddenRepeatHelper(kind, rule, opts?.parentAliasedKinds)) return 'multi';
	if (isSeparatedListShape(rule)) return 'separatedList';
	const branchOrContainer = classifyBranchOrContainer(rule);
	if (branchOrContainer !== null) return branchOrContainer;
	return classifyTerminalFallback(kind, rule);
}

function peelSeparatedListCore(rule: AnyRule): AnyRule {
	let r: AnyRule = rule.type === GROUP ? (rule.content as AnyRule) : rule;
	if (r.type === SEQ && r.members.length === 1) r = r.members[0] as AnyRule;
	return r;
}

function isSeparatedListShape(rule: RenderRule): boolean {
	if (rule.multiplicity !== 'array' && rule.multiplicity !== 'nonEmptyArray') return false;
	const sep = rule.separator;
	if (sep === undefined) return false;
	if (isNonterminalRuleType(sep.value)) return true;
	return sep.trailing === 'optional' || sep.leading === 'optional';
}

function isHiddenRepeatHelper(kind: string, rule: RenderRule, parentAliasedKinds?: ReadonlySet<string>): boolean {
	if (!kind.startsWith('_')) return false;
	if (rule.multiplicity !== 'array' && rule.multiplicity !== 'nonEmptyArray') return false;
	if (parentAliasedKinds?.has(kind)) return false;
	return true;
}

function classifyBranchOrContainer(rule: RenderRule): ModelType | null {
	if (hasSlotBearingContent(rule)) return 'branch';
	return null;
}

function hasSlotBearingContent(rule: RenderRule): boolean {
	if (rule.fieldName !== undefined) return true;
	switch (rule.type) {
		case SYMBOL:
		case SUPERTYPE:
			return true;
		case SEQ:
		case CHOICE:
			return rule.members.some(hasSlotBearingContent);
		case VARIANT:
		case GROUP:
			return hasSlotBearingContent(rule.content);
		default:
			return false;
	}
}

function classifyTerminalFallback(kind: string, rule: RenderRule): ModelType {
	if (isEnumChoiceRule(rule)) return 'enum';
	if (isAllTextShape(rule)) return 'pattern';
	throw new Error(
		`classifyNode: '${kind}' has no fields, no children, and no rule-type ` +
			`classification. Link should have wrapped it as TerminalRule. rule.type=${rule.type}`
	);
}

export function isAllTextShape(rule: AnyRule): boolean {
	switch (rule.type) {
		case STRING:
		case PATTERN:
			return true;
		case SYMBOL:
		case FIELD:
			return false;
		case SEQ:
		case CHOICE:
			return rule.members.length > 0 && rule.members.every(isAllTextShape);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case TOKEN:
		case VARIANT:
		case GROUP:
			return isAllTextShape(rule.content);
		default:
			return false;
	}
}

export { simplifyRule };

export { nameNode } from './model/node-map.ts';

function computeSignatures(_nodes: Map<string, AssembledNode>): SignaturePool {
	return { signatures: new Map() };
}
