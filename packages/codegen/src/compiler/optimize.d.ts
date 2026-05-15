/**
 * compiler/optimize.ts — Optimize phase.
 *
 * Restructures seq/choice/optional/repeat for SIMPLIFICATION (fan-out,
 * factoring, prefix/suffix extraction, wrapper collapsing, dedupe,
 * single-use hidden-rule inlining). Does NOT change named content.
 * Non-lossy.
 *
 * Variant tagging and polymorph promotion live in Link — those are
 * classification, not simplification. Pipeline order is fixed in
 * `optimize()` below: collapse → fan-out → factor → dedupe → inline →
 * re-collapse.
 */
import type { Rule } from './rule.ts';
import type { LinkedGrammar, OptimizedGrammar } from './types.ts';
export declare function optimize(linked: LinkedGrammar): OptimizedGrammar;
/**
 * Distribute a `seq` over an inner `choice` so downstream passes see
 * top-level choices:
 *
 *   seq(a, choice(b, c), d) → choice(seq(a, b, d), seq(a, c, d))
 *
 * Only applies when the seq contains EXACTLY ONE choice member —
 * distributing over multiple choices multiplies branches
 * combinatorially and rarely produces useful shapes. Recurses
 * through `optional`, `repeat`, `field`, `variant`, `clause`,
 * `group`, `token` wrappers. Non-lossy.
 */
export declare function fanOutSeqChoices(rule: Rule): Rule;
/**
 * Pull common prefixes / suffixes out of a choice of seqs:
 *
 *   choice(seq(a, b, x), seq(a, b, y), seq(a, b, z))
 *      → seq(a, b, choice(x, y, z))
 *
 * Uses `findCommonPrefix` / `findCommonSuffix` (structural equality
 * via `rulesEqual`). Only applies at the top level of a `choice`;
 * recurses through wrappers for nested choices. Non-lossy.
 */
export declare function factorChoiceBranches(rule: Rule): Rule;
/**
 * Collapse adjacent duplicates inside a `seq`:
 *
 *   seq(x, x, y) → seq(x, y)
 *
 * Uses `rulesEqual` for structural equality. Only collapses
 * adjacent duplicates; non-adjacent duplicates are almost always
 * intentional repetition in the grammar.
 */
export declare function dedupeSeqMembers(rule: Rule): Rule;
/**
 * Recursive wrapper-collapse pass. Traverses the rule tree
 * bottom-up and rewrites degenerate wrappers into their simpler
 * equivalents. Non-lossy — every collapse preserves the set of
 * strings the rule matches.
 */
export declare function collapseWrappers(rule: Rule): Rule;
export declare function rulesEqual(a: Rule, b: Rule): boolean;
export declare function factorSeqChoice(branches: Rule[]): Rule[];
export { wrapVariants, deduplicateVariants, nameVariant, tokenToName } from './link.ts';
export declare function needsSpace(prev: string, next: string): boolean;
//# sourceMappingURL=optimize.d.ts.map