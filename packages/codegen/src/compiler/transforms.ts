/**
 * compiler/transforms.ts — shared, idempotent rule transforms (#13a) +
 * the phase-context base type (#14 / §7.7). The transform BODIES move in via
 * the copilot LSP pass (PR-H Task 5); this file is born holding only the ctx
 * contract so signatures across normalize/simplify can thread it.
 */
import type { Rule } from './rule.ts';
import type { DiagnosticSink } from './diagnostics.ts';

/** The shared base ctx, declared ONCE (spec §7.7 / CW5). */
export interface TransformCtx {
  readonly rules: Record<string, Rule>;
  readonly inlineKinds: ReadonlySet<string>;
  readonly wordMatcher?: (s: string) => boolean;
  readonly diagnostics: DiagnosticSink;
}

/**
 * Normalize adds one optional extra: the polymorph skip-set for the
 * slot-grouping diagnostic. Kept optional (not on TransformCtx base) so the
 * Task-1 test's bare TransformCtx literal still satisfies NormalizeCtx.
 */
export interface NormalizeCtx extends TransformCtx {
  /** Kinds to exclude from the slot-grouping "propose-promotion" diagnostic. */
  readonly polymorphSkip?: ReadonlySet<string>;
}

/**
 * Simplify carries the same phase-shared state. `inField` is NOT here — it is
 * recursion-LOCAL traversal state, kept an explicit recursion param (CW6).
 * `compiledWord` carries the pre-compiled RegExp from the grammar's `word` rule
 * (produced by `compileWordMatcher`) used by `isKeywordShape` checks inside
 * simplifyRule / collapseSeq.  It is distinct from TransformCtx.wordMatcher
 * (which is a `(s: string) => boolean` function used by other callers).
 */
export interface SimplifyCtx extends TransformCtx {
  /** Pre-compiled word-pattern RegExp (from compileWordMatcher). Optional. */
  readonly compiledWord?: RegExp;
}
