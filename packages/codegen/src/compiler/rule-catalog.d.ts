/**
 * compiler/rule-catalog.ts — Evaluate-owned rule occurrence identity.
 *
 * Evaluate is the first phase with a normalized rule tree, so it is the
 * only place that assigns foundational occurrence identity and rule
 * classification. Later phases may read these IDs and catalog entries,
 * but they should not reconstruct identity from local walks.
 */
import type { Rule, SymbolRef } from './rule.ts';
import type { RuleCatalog, RuleProvenance } from './types.ts';
export interface RuleCatalogBuildResult {
    readonly rules: Record<string, Rule>;
    readonly ruleCatalog: RuleCatalog;
}
export declare function createEmptyRuleCatalog(): RuleCatalog;
export declare function buildRuleCatalog(rules: Record<string, Rule>, provenanceByKind?: ReadonlyMap<string, RuleProvenance>): RuleCatalogBuildResult;
export declare function attachReferenceRuleIds(references: readonly SymbolRef[], ruleCatalog: RuleCatalog): SymbolRef[];
//# sourceMappingURL=rule-catalog.d.ts.map