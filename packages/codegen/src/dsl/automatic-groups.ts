import type { Rule } from '../types/rule.ts';
import { isChoiceType, isPrecWrapper, isSymbolType, type RuntimeRule } from '../types/runtime-shapes.ts';
import type { EnrichCtx, EnrichRuleOrigin } from './enrich-ctx.ts';
import { ruleKey, rulesEqual, separatedListBodyInfo, unwrapPrec, type SeparatedListBodyInfo } from './rule-patterns.ts';

type AutomaticGroupContext = Pick<
	EnrichCtx,
	'rulesBag' | 'clauseGroupRules' | 'ruleOrigins' | 'groupDedupeMap' | 'authoredGroupBodies' | 'sourceSymbols' | 'hoist'
>;
type AutomaticGroupCounter = { grp: number; arm: number };

export function withContent(node: object, content: Rule): Rule {
	return { ...(node as { type: string }), content } as Rule;
}

export function pluralizeFieldName(name: string): string {
	if (name.endsWith('s')) return name;
	if (name.endsWith('y') && !/[aeiou]y$/.test(name)) return name.slice(0, -1) + 'ies';
	return name + 's';
}

export function peelTransparentElementWrappers(rule: Rule): Rule {
	if (isPrecWrapper(rule as { type: string })) {
		return peelTransparentElementWrappers((rule as unknown as { content: Rule }).content);
	}
	const members = (rule as unknown as { members?: Rule[] }).members;
	if (isChoiceType((rule as { type: string }).type) && members?.length === 1) {
		return peelTransparentElementWrappers(members[0]!);
	}
	return rule;
}

export function collapseSingletonMintOrdinals(
	mergedRules: Record<string, Rule>,
	mintedRules: Record<string, Rule>,
	ruleOrigins: Map<string, EnrichRuleOrigin>
): void {
	const byParentFlavor = new Map<string, string[]>();
	for (const hidden of Object.keys(mintedRules)) {
		const m = /^_?(.+)_(arm|group)(\d+)$/.exec(hidden);
		if (!m) continue;
		const key = `${m[1]}_${m[2]}`;
		const bucket = byParentFlavor.get(key);
		if (bucket) bucket.push(hidden);
		else byParentFlavor.set(key, [hidden]);
	}
	const renames = new Map<string, string>();
	for (const [bare, hiddens] of byParentFlavor) {
		if (hiddens.length !== 1) continue;
		const oldHidden = hiddens[0]!;
		const visible = !oldHidden.startsWith('_');
		const newHidden = visible ? bare : `_${bare}`;
		if (`_${bare}` in mergedRules || bare in mergedRules) continue;
		renames.set(oldHidden, newHidden);
		if (!visible) renames.set(oldHidden.replace(/^_/, ''), bare);
	}
	if (renames.size === 0) return;
	for (const [oldName, newName] of renames) {
		if (oldName in mergedRules && (oldName.startsWith('_') || oldName in mintedRules)) {
			mergedRules[newName] = mergedRules[oldName]!;
			delete mergedRules[oldName];
		}
		if (oldName in mintedRules) {
			mintedRules[newName] = mintedRules[oldName]!;
			delete mintedRules[oldName];
		}
		const origin = ruleOrigins.get(oldName);
		if (origin !== undefined) {
			ruleOrigins.delete(oldName);
			ruleOrigins.set(newName, origin);
		}
	}
	const rewrite = (node: unknown): void => {
		if (Array.isArray(node)) {
			for (const m of node) rewrite(m);
			return;
		}
		if (node === null || typeof node !== 'object') return;
		const r = node as { type?: string; name?: string; value?: unknown } & Record<string, unknown>;
		if (typeof r.name === 'string' && renames.has(r.name)) r.name = renames.get(r.name)!;
		if (r.type === 'ALIAS' && typeof r.value === 'string' && renames.has(r.value)) r.value = renames.get(r.value)!;
		for (const v of Object.values(r)) rewrite(v);
	};
	for (const name of Object.keys(mergedRules)) rewrite(mergedRules[name]);
}

export function visibleGroupSynthName(
	content: Rule,
	parentKind: string,
	ctx: AutomaticGroupContext,
	counter: AutomaticGroupCounter,
	ambientPrec?: Rule,
	enclosingFieldName?: string,
	flavor: 'group' | 'arm' = 'group'
): string | null {
	const { groupDedupeMap, rulesBag, clauseGroupRules, ruleOrigins } = ctx;
	const separatedListNameCounts = ctx.hoist?.separatedListNameCounts;
	if (process.env.SITTIR_DEBUG_LISTNAME) {
		const info = separatedListBodyInfo(content, ctx.sourceSymbols);
		process.stderr.write(
			`[listname] mint for parent='${parentKind}' list=${JSON.stringify(info)} counts=${
				info?.elementName ? separatedListNameCounts?.get(pluralizeFieldName(info.elementName)) : '-'
			}\n`
		);
	}
	const registeredBody = ambientPrec ? withContent(ambientPrec, content) : content;
	if (coveredByAuthoredGroup(registeredBody, ctx)) return null;
	const key = ruleKey(registeredBody as RuntimeRule);
	const existing = groupDedupeMap[key];
	if (existing !== undefined) {
		if (!(existing in clauseGroupRules)) {
			clauseGroupRules[existing] = registeredBody;
			ruleOrigins.set(existing, { kind: 'visible-subsequence' });
		}
		return existing;
	}
	const base = parentKind.replace(/^_+/, '');
	const register = (name: string, body: Rule = registeredBody): string => {
		groupDedupeMap[key] = name;
		clauseGroupRules[name] = body;
		ruleOrigins.set(name, { kind: 'visible-subsequence' });
		return name;
	};
	const listInfo = separatedListNameCounts !== undefined ? separatedListBodyInfo(content, ctx.sourceSymbols) : null;
	if (listInfo?.flankCarrying) {
		const nameFree = (n: string) =>
			!(n in rulesBag) && !(`_${n}` in rulesBag) && !(n in clauseGroupRules) && !(`_${n}` in clauseGroupRules);
		const bare = listKindElementPlural(listInfo, ctx.ruleOrigins);
		const candidates: { name: string; ownerSlot?: string }[] = [];
		if (bare !== null && separatedListNameCounts!.get(bare) === 1) candidates.push({ name: bare });
		if (bare !== null && base !== bare && !base.endsWith(`_${bare}`))
			candidates.push({ name: `${base}_${bare}`, ownerSlot: bare });
		if (bare !== `${base}_elements`) {
			candidates.push(
				base.endsWith('_elements') ? { name: base } : { name: `${base}_elements`, ownerSlot: 'elements' }
			);
		}
		const flatBody = { ...content, members: listInfo.flatMembers } as Rule;
		const registeredFlat = ambientPrec ? withContent(ambientPrec, flatBody) : flatBody;
		for (const { name, ownerSlot } of candidates) {
			if (!nameFree(name)) continue;
			if (ownerSlot !== undefined) ctx.hoist?.ownerPrefixedListSlots.set(name, ownerSlot);
			return register(name, registeredFlat);
		}
	}
	if (enclosingFieldName !== undefined) {
		const visibleName = `${base}_${enclosingFieldName}`;
		if (!(visibleName in rulesBag) && !(`_${visibleName}` in rulesBag) && !(visibleName in clauseGroupRules)) {
			return register(visibleName);
		}
	}
	const ordinal = flavor === 'arm' ? ++counter.arm : ++counter.grp;
	const visibleName = `${base}_${flavor}${ordinal}`;
	const hiddenName = `_${visibleName}`;
	if (visibleName in rulesBag || hiddenName in rulesBag || visibleName in clauseGroupRules) {
		process.stderr.write(
			`enrich: visible-group skipped for '${parentKind}' — rule '${visibleName}'/'${hiddenName}' already exists in base.grammar.rules\n`
		);
		return null;
	}
	return register(visibleName);
}

export function elementSupertypeOrigin(
	element: Rule,
	ruleOrigins: ReadonlyMap<string, EnrichRuleOrigin>
): Extract<EnrichRuleOrigin, { kind: 'element-supertype' }> | undefined {
	const core = peelTransparentElementWrappers(element);
	if (!isSymbolType((core as { type: string }).type)) return undefined;
	const origin = ruleOrigins.get((core as unknown as { name: string }).name);
	return origin?.kind === 'element-supertype' ? origin : undefined;
}

export function listKindElementPlural(
	info: SeparatedListBodyInfo,
	ruleOrigins: ReadonlyMap<string, EnrichRuleOrigin>
): string | null {
	if (info.elementName === null || elementSupertypeOrigin(info.element as Rule, ruleOrigins) !== undefined) return null;
	return pluralizeFieldName(info.elementName);
}

export function coveredByAuthoredGroup(body: Rule, ctx: Pick<AutomaticGroupContext, 'authoredGroupBodies'>): boolean {
	return ctx.authoredGroupBodies.some((pattern) => rulesEqual(unwrapPrec(body) as RuntimeRule, pattern));
}
