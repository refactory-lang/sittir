import type { Rule } from '../types/rule.ts';
import type { RuntimeRule } from '../types/runtime-shapes.ts';
import { isParserHiddenName, ruleListParts, type RuleListEntry, type SymbolSource } from './rule-patterns.ts';
import { predictedSymbolSourceOf } from './symbol-table.ts';

export interface EnrichCtxInit {
	readonly rulesBag: Record<string, Rule>;
	readonly supertypeNames: ReadonlySet<string>;
	readonly externals: readonly RuleListEntry[];
	readonly inline: ReadonlySet<string>;
	readonly extras: readonly RuleListEntry[];
	readonly word: string | null;
	readonly wordMatcher: RegExp | undefined;
	readonly authoredGroupBodies: readonly RuntimeRule[];
}

export function enrichSymbolSource(init: EnrichCtxInit, rules: Readonly<Record<string, Rule>>): SymbolSource {
	const bodilessVisibleExternals = ruleListParts(init.externals).names.filter(
		(name) => !isParserHiddenName(name) && !(name in rules)
	);
	return predictedSymbolSourceOf({
		rules,
		externals: init.externals,
		extras: init.extras,
		supertypes: [...init.supertypeNames],
		inline: [...init.inline],
		word: init.word,
		visibleExternals: Object.fromEntries(bodilessVisibleExternals.map((name) => [name, true]))
	});
}

export type EnrichMintKind = 'keyword' | 'hidden-subsequence' | 'visible-subsequence' | 'literal-alias-storage' | 'field-enum' | 'whitespace';

export type EnrichRuleOrigin =
	| { readonly kind: EnrichMintKind }
	| { readonly kind: 'promoted-group'; readonly visibleName: string }
	| { readonly kind: 'element-supertype'; readonly slot: string; readonly authoredSlot: boolean }
	| { readonly kind: 'text'; readonly owners: readonly string[] };

export interface ClauseHoistState {
	readonly separatedListNameCounts: ReadonlyMap<string, number>;
	readonly hiddenListPromotionNames: Map<string, string>;
	readonly ownerPrefixedListSlots: Map<string, string>;
}

interface EnrichCtxFields extends EnrichCtxInit {
	readonly sourceSymbols: SymbolSource;
	readonly kwRules: Record<string, Rule>;
	readonly clauseGroupRules: Record<string, Rule>;
	readonly clauseDedupeMap: Record<string, string>;
	readonly groupDedupeMap: Record<string, string>;
	readonly ruleOrigins: Map<string, EnrichRuleOrigin>;
	readonly hoist: ClauseHoistState | undefined;
}

export class EnrichCtx implements EnrichCtxFields {
	readonly rulesBag: Record<string, Rule>;
	readonly supertypeNames: ReadonlySet<string>;
	readonly externals: readonly RuleListEntry[];
	readonly inline: ReadonlySet<string>;
	readonly extras: readonly RuleListEntry[];
	readonly word: string | null;
	readonly wordMatcher: RegExp | undefined;
	readonly authoredGroupBodies: readonly RuntimeRule[];
	readonly sourceSymbols: SymbolSource;
	readonly kwRules: Record<string, Rule>;
	readonly clauseGroupRules: Record<string, Rule>;
	readonly clauseDedupeMap: Record<string, string>;
	readonly groupDedupeMap: Record<string, string>;
	readonly ruleOrigins: Map<string, EnrichRuleOrigin>;
	readonly hoist: ClauseHoistState | undefined;

	private constructor(fields: EnrichCtxFields) {
		this.rulesBag = fields.rulesBag;
		this.supertypeNames = fields.supertypeNames;
		this.externals = fields.externals;
		this.inline = fields.inline;
		this.extras = fields.extras;
		this.word = fields.word;
		this.wordMatcher = fields.wordMatcher;
		this.authoredGroupBodies = fields.authoredGroupBodies;
		this.sourceSymbols = fields.sourceSymbols;
		this.kwRules = fields.kwRules;
		this.clauseGroupRules = fields.clauseGroupRules;
		this.clauseDedupeMap = fields.clauseDedupeMap;
		this.groupDedupeMap = fields.groupDedupeMap;
		this.ruleOrigins = fields.ruleOrigins;
		this.hoist = fields.hoist;
	}

	static create(init: EnrichCtxInit): EnrichCtx {
		return new EnrichCtx({
			...init,
			sourceSymbols: enrichSymbolSource(init, init.rulesBag),
			kwRules: {},
			clauseGroupRules: {},
			clauseDedupeMap: {},
			groupDedupeMap: {},
			ruleOrigins: new Map(),
			hoist: undefined
		});
	}

	withHoist(hoist: ClauseHoistState): EnrichCtx {
		return new EnrichCtx({ ...this, hoist });
	}
}
