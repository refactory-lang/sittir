import type { VariantChild } from './variant-structural.ts';
import {
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
	SymbolRule,
	ChoiceRule,
	StringRule,
	SupertypeRule
} from '../types/rule.ts';
import { subtypeParseNamesOf } from '../types/rule.ts';
import { isEnumChoiceRule, isHiddenRule } from '../dsl/rule-patterns.ts';
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
	AbstractAssembledCompound,
	AssembledPattern,
	AssembledKeyword,
	AssembledToken,
	AssembledEnum,
	AssembledSupertype,
	AssembledList,
	drainParseKindCollisionDiagnostics,
	drainDeriveShapeDiagnostics,
	drainAssembleWarnings,
	recordAssembleWarning,
	resetAssembleWarnings,
	nameNode,
	isNodeRef,
	storageKindOfRef,
	isUnresolvedRef,
	resetParseKindCollisionDiagnostics,
	resetDeriveShapeDiagnostics,
	buildParseKindRuleSignatures,
	type AssembleWarning,
	branchClassFor,
	compoundModelTypeFor
} from './model/node-map.ts';
import { simplifyRule } from './simplify.ts';
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
	const variantChildrenByParent = normalized.variantChildren ?? new Map<string, readonly VariantChild[]>();
	const variantParents = new Set(variantChildrenByParent.keys());

	const parseKindCollisionContext = {
		ruleSignatures: buildParseKindRuleSignatures(normalized.normalizedRules)
	} as const;

	try {
		for (const [kind, renderRule] of Object.entries(normalized.normalizedRules)) {
			const simplifiedRule = normalized.rules[kind]!;
			const modelType = classifyNode(kind, simplifiedRule, {
				renderRule,
				variantParents,
				parentAliasedKinds: normalized.parentAliasedKinds,
				wordMatcher: wordMatcherRegex
			});
			const variantChildKinds = variantChildrenByParent.get(kind);

			switch (modelType) {
				case 'supertype': {
					if (renderRule.type !== SUPERTYPE && renderRule.type !== CHOICE) {
						throw new Error(
							`[assemble] supertype kind '${kind}' must be a supertype or choice; found ${renderRule.type}`
						);
					}
					const subtypes = resolveSupertypeSubtypes(renderRule, ctx, kindEntries);
					nodes.set(kind, new AssembledSupertype(kind, renderRule, subtypes));
					break;
				}
				case 'branch':
				case 'envelope':
				case 'polymorph': {
					const { groupSimplified, groupRenderRule } = unwrapGroupViews(simplifiedRule, renderRule);
					const CompoundClass = branchClassFor(groupSimplified);
					nodes.set(
						kind,
						new CompoundClass(kind, groupSimplified, groupRenderRule, {
							variantChildKinds,
							kindEntries,
							parseKindCollisionContext,
							visibleAliasTargets: normalized.visibleAliasTargets,
							simplifiedRules: normalized.rules,
							...(simplifiedRule.type === GROUP ? { hoisted: {} } : {})
						})
					);
					break;
				}
				case 'pattern': {
					nodes.set(kind, new AssembledPattern(kind, simplifiedRule));
					break;
				}
				case 'token': {
					if (simplifiedRule.type !== STRING) {
						throw new Error(`[assemble] token kind '${kind}' must be a single literal; found ${simplifiedRule.type}`);
					}
					const word = matchesWordShape(simplifiedRule.value, wordMatcherRegex);
					const named = !kind.startsWith('_') && findEntryForKindName(kindEntries, kind)?.anon !== true;
					nodes.set(
						kind,
						word || named
							? new AssembledKeyword(kind, simplifiedRule, { kindEntries, word })
							: new AssembledToken(kind, simplifiedRule, { kindEntries })
					);
					break;
				}
				case 'enum': {
					if (renderRule.type !== CHOICE) {
						throw new Error(`[assemble] enum kind '${kind}' must be a choice of literals; found ${renderRule.type}`);
					}
					nodes.set(kind, new AssembledEnum(kind, renderRule, { kindEntries }));
					break;
				}
				case 'list': {
					const { groupSimplified, groupRenderRule } = unwrapGroupViews(simplifiedRule, renderRule);
					const listRule = peelSeparatedListCore(groupSimplified);
					if (listRule.type !== SYMBOL && listRule.type !== CHOICE) {
						throw new Error(
							`[assemble] list kind '${kind}' must repeat a symbol or a choice of symbols; found ${listRule.type}`
						);
					}
					const sep = listRule.separator;
					const separatorRule = sep && isNonterminalRuleType(sep.value) ? sep.value : undefined;
					nodes.set(
						kind,
						new AssembledList(
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

		for (const rule of Object.values(normalized.normalizedRules)) {
			if (rule.type !== SUPERTYPE) continue;
			for (const [subName, aliasName] of Object.entries(subtypeParseNamesOf(rule))) {
				if (nodes.has(aliasName)) continue;
				const subRule = normalized.normalizedRules[subName];
				if (!subRule || subRule.type !== SUPERTYPE) continue;
				const subtypes = resolveSupertypeSubtypes(subRule, ctx, kindEntries);
				nodes.set(aliasName, new AssembledSupertype(aliasName, subRule, subtypes));
			}
		}

		collectAnonymousNodes(normalized.normalizedRules, nodes, wordMatcherRegex, kindEntries);
		resolveCollidingNames(nodes);
		resolveIrKeys(nodes);
		stampFactoryInline(nodes, ctx, stampSupertypeClosures(nodes));
		const aliasSourceKinds = new Set<string>();
		for (const n of nodes.values()) {
			for (const slot of n.slots) {
				for (const v of slot.values) {
					if (!isNodeRef(v)) continue;
					const name = storageKindOfRef(v.node);
					if (name.startsWith('_')) aliasSourceKinds.add(name);
				}
			}
		}
		const variantChildKindsSet = new Set<string>([...variantChildrenByParent.values()].flat().map((c) => c.kind));
		for (const rule of Object.values(normalized.normalizedRules)) {
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
			if (node instanceof AbstractAssembledCompound) {
				node.attachNodeMap(nodes);
			}
		}

		const nodeByRuleId = new Map<RuleId, AssembledNode>();
		const slotByRuleId = new Map<RuleId, AssembledNonterminal>();
		for (const [kind, rule] of Object.entries(normalized.normalizedRules)) {
			const node = nodes.get(kind);
			if (!node) continue;
			if (rule.id) nodeByRuleId.set(rule.id, node);
		}
		for (const node of nodes.values()) {
			for (const slot of node.slots) {
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
			normalizedRules: normalized.normalizedRules,
			word: normalized.word,
			wordMatcher: normalized.wordMatcher,
			externals: normalized.externals ? new Set(normalized.externals) : undefined,
			extras: normalized.extras ? new Set(normalized.extras) : undefined,
			refineForms: normalized.refineForms,
			parseKindCollisions: drainParseKindCollisionDiagnostics(),
			deriveShapeDiagnostics: drainDeriveShapeDiagnostics(),
			assembleWarnings: drainAssembleWarnings()
		};
	} finally {
		resetParseKindCollisionDiagnostics();
		resetDeriveShapeDiagnostics();
		resetAssembleWarnings();
	}
}

function resolveSupertypeSubtypes(
	rule: SupertypeRule | ChoiceRule,
	ctx: AssembleCtx,
	kindEntries: readonly GeneratedKindEntry[]
): SubtypeRef[] {
	const subtypes: SubtypeRef[] =
		rule.type === SUPERTYPE
			? rule.subtypes.map((s) => ({
					name: s.name,
					storageKindId: s.kindId
				}))
			: rule.members
					.map((m) => (m.type === VARIANT ? m.content : m))
					.filter((m): m is SymbolRule => m.type === SYMBOL)
					.map((m) => ({ name: m.name, storageKindId: m.kindId }));
	return resolveHiddenSubtypes(
		subtypes,
		ctx,
		kindEntries,
		rule.type === SUPERTYPE ? rule.name : undefined,
		rule.type === SUPERTYPE ? subtypeParseNamesOf(rule) : undefined
	);
}

function unwrapGroupViews(
	simplifiedRule: SimplifiedRule,
	renderRule: RenderRule
): { groupSimplified: SimplifiedRule; groupRenderRule: RenderRule } {
	return {
		groupSimplified: simplifiedRule.type === GROUP ? simplifiedRule.content : simplifiedRule,
		groupRenderRule: renderRule.type === GROUP ? renderRule.content : renderRule
	};
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
		for (const slot of node.slots) {
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
		if (!isHiddenRule(name, rules)) {
			out.push(ref);
			return;
		}
		const rule = rules[name]!;
		if (rule.type !== SUPERTYPE && subtypeParseNames && Object.prototype.hasOwnProperty.call(subtypeParseNames, name)) {
			out.push(ref);
			return;
		}
		if (rule.type === SUPERTYPE) {
			out.push(ref);
			const nestedParseNames = subtypeParseNamesOf(rule);
			for (const subRef of rule.subtypes) {
				const sub = subRef.name;
				const subStamp = subRef.kindId;
				const parseName = nestedParseNames[sub];
				const subRule = isHiddenRule(sub, rules) ? rules[sub] : undefined;
				if (parseName !== undefined && subRule?.type === SUPERTYPE) {
					if (!seen.has(parseName)) {
						seen.add(parseName);
						out.push({ name: parseName });
					}
					continue;
				}
				if (isHiddenRule(sub, rules)) {
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
			if (isHiddenRule(r.name, rules)) {
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
			if (!isHiddenRule(name, rules)) continue;
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
	if (!isHiddenRule(name, rules)) return false;
	if (seen.has(name)) return false;
	const rule = rules[name]!;
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
			const refName = rule.name;
			const refStamp = rule.kindId;
			if (rule.literal !== undefined || !isHiddenRule(refName, rules)) {
				return [{ name: refName, storageKindId: refStamp }];
			}
			if (seen.has(refName)) return [];
			seen.add(refName);
			return resolveHiddenRuleContent(rules[refName]!, seen, ctx, kindEntries);
		}
		case SUPERTYPE:
			return rule.subtypes.flatMap((symbolRef) => {
				const s = symbolRef.name;
				const sStamp = symbolRef.kindId;
				if (seen.has(s)) return [];
				seen.add(s);
				if (!isHiddenRule(s, rules)) return [{ name: s, storageKindId: sStamp }];
				return resolveHiddenRuleContent(rules[s]!, seen, ctx, kindEntries);
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
		if (node instanceof AbstractAssembledCompound) {
			hydrateSlots(kind, node.slots, nodeMap.nodes, externals);
		}
		if (node instanceof AssembledSupertype) {
			hydrateValues(node.subtypes, { parentKind: kind, siteLabel: 'subtypes', nodes: nodeMap.nodes, externals });
		}
	}
}

function hydrateSlots(
	parentKind: string,
	slots: readonly AssembledNonterminal[],
	nodes: Map<string, AssembledNode>,
	externals: ReadonlySet<string>
): void {
	for (const slot of slots) {
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
	if (node instanceof AssembledToken) {
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
	const hasNonTokenVisible = visible.some((n) => !(n instanceof AssembledToken));
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
	const ownedByKind = new Set<string>();
	for (const node of nodes.values()) {
		if (node instanceof AssembledSupertype || !node.factoryName) continue;
		if (node instanceof AbstractAssembledCompound && node.hoisted) continue;
		const short = shortenIrKey(node.kind);
		if (short === node.factoryName) ownedByKind.add(short);
	}
	for (const node of nodes.values()) {
		if (!(node instanceof AssembledSupertype)) continue;
		const short = shortenIrKey(node.kind);
		if (!ownedByKind.has(short)) claimed.add(short);
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
		if (node instanceof AbstractAssembledCompound && node.hoisted) continue;
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
	rules: Record<string, RenderRule>,
	nodes: Map<string, AssembledNode>,
	wordMatcher: RegExp | undefined,
	kindEntries: readonly GeneratedKindEntry[]
): void {
	const seen = new Set<string>();
	for (const rule of Object.values(rules)) {
		if (rule.tokenized === true && rule.type !== STRING && rule.type !== PATTERN) continue;
		walkForStrings(rule, seen);
	}

	for (const literalText of seen) {
		if (literalText === '' || /^\s+$/.test(literalText)) continue;
		const catalogEntry = findEntryForLiteralText(kindEntries, literalText);
		if (catalogEntry === undefined || catalogEntry.anon !== true) {
			if (catalogEntry === undefined) {
				recordAssembleWarning({
					code: 'kindid-unstamped-anon-literal',
					message: `[assemble] literal ${JSON.stringify(literalText)} has no anonymous parser symbol — not minted`,
					ownerKind: literalText,
					details: { literalText }
				});
			}
			continue;
		}
		if (nodes.has(catalogEntry.kind)) continue;

		const syntheticStringRule: StringRule = { type: STRING, value: literalText };
		if (matchesWordShape(literalText, wordMatcher)) {
			nodes.set(
				catalogEntry.kind,
				new AssembledKeyword(catalogEntry.kind, syntheticStringRule, { hidden: true, kindEntries })
			);
		} else {
			nodes.set(catalogEntry.kind, new AssembledToken(catalogEntry.kind, syntheticStringRule, { kindEntries }));
		}
	}
}

function walkForStrings(rule: RenderRule, out: Set<string>): void {
	switch (rule.type) {
		case STRING:
			out.add(rule.value);
			break;
		case SYMBOL:
			if (rule.literal !== undefined) out.add(rule.literal);
			break;
		case SEQ:
			for (const m of rule.members) walkForStrings(m, out);
			break;
		case CHOICE:
			for (const m of rule.members) walkForStrings(m, out);
			break;
		case VARIANT:
		case GROUP:
			walkForStrings(rule.content, out);
			break;
	}
}

type ModelType = AssembledNode['modelType'];

export function classifyNode(
	kind: string,
	rule: SimplifiedRule,
	opts?: {
		variantParents?: ReadonlySet<string>;
		parentAliasedKinds?: ReadonlySet<string>;
		wordMatcher?: RegExp;
		renderRule?: RenderRule;
	}
): ModelType {
	if (rule.fieldName === undefined && rule.multiplicity === undefined) {
		if (isEnumChoiceRule(rule)) return 'enum';
		switch (rule.type) {
			case SUPERTYPE:
				return 'supertype';
			case GROUP:
				if (isSeparatedListShape(peelSeparatedListCore(rule))) return 'list';
				return compoundModelType(rule);
			case PATTERN:
				return 'pattern';
			case STRING:
				return 'token';
		}
	}

	if (isSeparatedListShape(rule)) return 'list';
	if (hasSlotBearingContent(rule)) return compoundModelType(rule);
	if (opts?.renderRule !== undefined && referencesKind(opts.renderRule)) return compoundModelType(rule);
	return classifyTerminalFallback(kind, rule);
}

function referencesKind(rule: RenderRule): boolean {
	switch (rule.type) {
		case SYMBOL:
		case SUPERTYPE:
			return true;
		case SEQ:
		case CHOICE:
			return rule.members.some(referencesKind);
		case VARIANT:
		case GROUP:
			return referencesKind(rule.content);
		default:
			return false;
	}
}

function compoundModelType(rule: SimplifiedRule): 'envelope' | 'branch' | 'polymorph' {
	return compoundModelTypeFor(rule);
}

function peelSeparatedListCore(rule: SimplifiedRule): SimplifiedRule {
	let r: SimplifiedRule = rule.type === GROUP ? rule.content : rule;
	if (r.type === SEQ && r.members.length === 1) r = r.members[0]!;
	return r;
}

function isSeparatedListShape(rule: SimplifiedRule): boolean {
	if (rule.multiplicity !== 'array' && rule.multiplicity !== 'nonEmptyArray') return false;
	const sep = rule.separator;
	if (sep === undefined) return false;
	if (isNonterminalRuleType(sep.value)) return true;
	return sep.trailing === 'optional' || sep.leading === 'optional';
}

function hasSlotBearingContent(rule: SimplifiedRule): boolean {
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
		`classifyNode: '${kind}' has no slots and no rule-type ` +
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
