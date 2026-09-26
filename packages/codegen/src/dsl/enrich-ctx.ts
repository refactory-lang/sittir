import type { Rule } from '../types/rule.ts';
import { predictedSymbolSource, type SymbolSource } from './rule-patterns.ts';

export interface EnrichCtxInit {
	readonly rulesBag: Record<string, Rule>;
	readonly supertypeNames: ReadonlySet<string>;
	readonly externals: ReadonlySet<string>;
	readonly inline: ReadonlySet<string>;
	readonly wordMatcher: RegExp | undefined;
}

export interface ClauseHoistState {
	readonly separatedListNameCounts: ReadonlyMap<string, number>;
	readonly hiddenListPromotionNames: Map<string, string>;
}

interface EnrichCtxFields extends EnrichCtxInit {
	readonly sourceSymbols: SymbolSource;
	readonly kwRules: Record<string, Rule>;
	readonly clauseGroupRules: Record<string, Rule>;
	readonly clauseDedupeMap: Record<string, string>;
	readonly groupDedupeMap: Record<string, string>;
	readonly visibleGroupSources: Set<string>;
	readonly clauseGroupOwners: Map<string, string>;
	readonly hoist: ClauseHoistState | undefined;
}

export class EnrichCtx implements EnrichCtxFields {
	readonly rulesBag: Record<string, Rule>;
	readonly supertypeNames: ReadonlySet<string>;
	readonly externals: ReadonlySet<string>;
	readonly inline: ReadonlySet<string>;
	readonly wordMatcher: RegExp | undefined;
	readonly sourceSymbols: SymbolSource;
	readonly kwRules: Record<string, Rule>;
	readonly clauseGroupRules: Record<string, Rule>;
	readonly clauseDedupeMap: Record<string, string>;
	readonly groupDedupeMap: Record<string, string>;
	readonly visibleGroupSources: Set<string>;
	readonly clauseGroupOwners: Map<string, string>;
	readonly hoist: ClauseHoistState | undefined;

	private constructor(fields: EnrichCtxFields) {
		this.rulesBag = fields.rulesBag;
		this.supertypeNames = fields.supertypeNames;
		this.externals = fields.externals;
		this.inline = fields.inline;
		this.wordMatcher = fields.wordMatcher;
		this.sourceSymbols = fields.sourceSymbols;
		this.kwRules = fields.kwRules;
		this.clauseGroupRules = fields.clauseGroupRules;
		this.clauseDedupeMap = fields.clauseDedupeMap;
		this.groupDedupeMap = fields.groupDedupeMap;
		this.visibleGroupSources = fields.visibleGroupSources;
		this.clauseGroupOwners = fields.clauseGroupOwners;
		this.hoist = fields.hoist;
	}

	static create(init: EnrichCtxInit): EnrichCtx {
		return new EnrichCtx({
			...init,
			sourceSymbols: predictedSymbolSource(init.rulesBag, init.externals, init.inline),
			kwRules: {},
			clauseGroupRules: {},
			clauseDedupeMap: {},
			groupDedupeMap: {},
			visibleGroupSources: new Set(),
			clauseGroupOwners: new Map(),
			hoist: undefined
		});
	}

	withHoist(hoist: ClauseHoistState): EnrichCtx {
		return new EnrichCtx({ ...this, hoist });
	}
}
