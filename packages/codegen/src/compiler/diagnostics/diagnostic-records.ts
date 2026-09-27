import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import type { RuleId } from '../../types/rule.ts';
import type { PatchSite } from '../../dsl/wire/wire.ts';
import type { RuleCatalog } from '../types.ts';
import type { StageDiagnoses } from '../stage.ts';
import { createRuleId, ruleIdOwner } from '../rule-catalog.ts';

export type RuleProvenanceStage = 'upstream' | 'enrich' | 'wire';

export type ResolvedBy = { readonly rule: string } | { readonly patch: Pick<PatchSite, 'ownerKind' | 'path' | 'form'> };

export interface DiagnosticRecord {
	readonly code: string;
	readonly ruleId: RuleId;
	readonly ownerKind: string;
	readonly slotName?: string;
	readonly ruleProvenance: RuleProvenanceStage;
	readonly resolved: boolean;
	readonly resolvedBy?: { readonly stage: 'enrich' | 'wire'; readonly by: readonly ResolvedBy[] };
}

export interface FinalStageDiagnosis {
	readonly diagnostics: readonly GrammarDiagnostic[];
	readonly ruleCatalog: RuleCatalog;
}

export interface DeriveDiagnosticRecordsInput {
	readonly stages: StageDiagnoses;
	readonly final: FinalStageDiagnosis;
	readonly authoredRules: readonly string[];
	readonly patchSites: readonly PatchSite[];
}

interface KeyedDiagnostic {
	readonly key: string;
	readonly ruleId: RuleId;
	readonly diagnostic: GrammarDiagnostic;
}

export function deriveDiagnosticRecords(input: DeriveDiagnosticRecordsInput): DiagnosticRecord[] {
	const { stages, final } = input;
	const raw = keyedDiagnostics(stages.raw.diagnostics, stages.raw.ruleCatalog);
	const enriched = keyedDiagnostics(stages.enriched.diagnostics, stages.enriched.ruleCatalog);
	const finalKeys = keyedDiagnostics(final.diagnostics, final.ruleCatalog);
	const latest = new Map<string, KeyedDiagnostic>([...raw, ...enriched, ...finalKeys]);
	return [...latest.values()].map(({ key, ruleId, diagnostic }) => {
		const owner = ruleIdOwner(ruleId);
		const resolved = !finalKeys.has(key);
		return {
			code: diagnostic.code,
			ruleId,
			ownerKind: diagnostic.ownerKind ?? owner,
			...(diagnostic.slotName === undefined ? {} : { slotName: diagnostic.slotName }),
			ruleProvenance: stages.raw.ruleNames.has(owner) ? 'upstream' : stages.enriched.ruleNames.has(owner) ? 'enrich' : 'wire',
			resolved,
			...(resolved
				? {
						resolvedBy: enriched.has(key)
							? { stage: 'wire' as const, by: claimantsOf(owner, input) }
							: { stage: 'enrich' as const, by: [] }
					}
				: {})
		};
	});
}

function keyedDiagnostics(diagnostics: readonly GrammarDiagnostic[], ruleCatalog: RuleCatalog | undefined): Map<string, KeyedDiagnostic> {
	const keyed = new Map<string, KeyedDiagnostic>();
	for (const diagnostic of diagnostics) {
		const ruleId = ownerRootId(diagnostic, ruleCatalog);
		if (ruleId === undefined) continue;
		const key = [diagnostic.code, ruleId, diagnostic.slotName ?? ''].join('\u0000');
		keyed.set(key, { key, ruleId, diagnostic });
	}
	return keyed;
}

function ownerRootId(diagnostic: GrammarDiagnostic, ruleCatalog: RuleCatalog | undefined): RuleId | undefined {
	if (diagnostic.ruleId !== undefined) return createRuleId(ruleIdOwner(diagnostic.ruleId), { path: [] });
	if (diagnostic.ownerKind === undefined) return undefined;
	return ruleCatalog?.rootsByKind.get(diagnostic.ownerKind) ?? createRuleId(diagnostic.ownerKind, { path: [] });
}

function claimantsOf(owner: string, input: DeriveDiagnosticRecordsInput): ResolvedBy[] {
	return [
		...input.authoredRules.filter((name) => name === owner).map((rule) => ({ rule })),
		...input.patchSites
			.filter((site) => site.ownerKind === owner || (site.lifts ?? []).includes(owner))
			.map(({ ownerKind, path, form }) => ({ patch: { ownerKind, path, form } }))
	];
}
