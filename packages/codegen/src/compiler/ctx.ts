/**
 * compiler/ctx.ts — the per-phase pipeline context hierarchy.
 *
 * ONE ctx class per phase (EvaluateCtx, LinkCtx, NormalizeCtx, SimplifyCtx,
 * AssembleCtx), each extending `BaseCtx`. `BaseCtx` holds the read-only grammar
 * facts every phase derives once (rules, the grammar word-shape predicate,
 * diagnostics, the inline set, the rule-construction strategy). Subclasses add
 * phase-specific inputs and — only where a phase genuinely accumulates — a
 * mutation API as methods (never a bare mutable field handed to every caller).
 *
 * Discipline:
 *   - Immutable inputs are `readonly` (+ `ReadonlyMap`/`ReadonlySet`/`readonly[]`).
 *   - A function that must NOT mutate takes a `Readonly<XCtx>` / narrowed view;
 *     the caller still passes the one ctx object.
 *   - Pass-local state (seen sets, per-rule `name`) stays an explicit trailing
 *     parameter — NOT on the ctx (Principle #14 / CW6).
 *
 * Layering: this lives in `compiler/` (phase-pipeline concern). The `builder`
 * field is typed from `dsl/` (`RuleBuilder`) — `compiler → dsl`, the allowed
 * direction. The dsl transform helpers that need a builder take a structural
 * `{ builder?: RuleBuilder }` slice, NOT this class, so no `dsl → compiler` cycle.
 */

import type { AnyRule, Rule } from '../types/rule.ts';
import type { DiagnosticSink } from '../types/diagnostics.ts';
import type { RuleBuilder } from '../dsl/rule-transforms.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';

/**
 * Construction inputs shared by every phase ctx.
 *
 * `R` is the rule-view this phase operates on — `Rule<'evaluate'>` /
 * `Rule<'link'>` (pre-wrapper-deletion), `RenderRule` (wrapper-free /
 * "normalized"), or `SimplifiedRule`. The pipeline refines it in order:
 * `BaseCtx<Rule<'evaluate'>>` (link) → `BaseCtx<Rule<'link'>>` (normalize) →
 * `BaseCtx<RenderRule>` (simplify) → `BaseCtx<SimplifiedRule>` (assemble).
 * Constrained by `AnyRule` (the union over all phase views) so any phase's
 * view — including the wrapper-bearing ones — satisfies it.
 */
export interface BaseCtxInit<R extends AnyRule = Rule> {
	readonly rules: Record<string, R>;
	readonly diagnostics: DiagnosticSink;
	/**
	 * Grammar word-shape predicate — "does this string lex as a word under the
	 * grammar's `word` rule?". Curried `matchesWordShape` bound to the grammar's
	 * compiled matcher; `undefined` when the grammar declares no `word`.
	 */
	readonly wordMatcher?: (s: string) => boolean;
	/** Rule-construction strategy (structural vs attribute); falls back to structuralBuilder. */
	readonly builder?: RuleBuilder;
}

/**
 * Shared read-only phase context: the grammar facts every phase derives once,
 * parameterized by the rule-view `R` the phase operates on (see BaseCtxInit).
 *
 * Deliberately minimal — only what EVERY phase carries. The "inline kinds" set
 * is NOT here: phases represent it differently (link as a `readonly string[]`,
 * simplify as a `ReadonlySet`), so each subclass declares its own rather than
 * force a lossy reconciliation. Mutation surfaces (e.g. the node map built
 * during Assemble) live on the concrete subclass as methods, never on this base.
 */
export abstract class BaseCtx<R extends AnyRule = Rule> {
	readonly rules: Record<string, R>;
	readonly wordMatcher?: (s: string) => boolean;
	readonly diagnostics: DiagnosticSink;
	readonly builder?: RuleBuilder;
	/** Traversal engine bound to this phase's rules map + diagnostics (R12 PR-6).
	 *  Derived in the ctor — not a BaseCtxInit field; nothing to configure. */
	readonly walker: RuleWalker<R>;

	constructor(init: BaseCtxInit<R>) {
		this.rules = init.rules;
		this.diagnostics = init.diagnostics;
		this.wordMatcher = init.wordMatcher;
		this.builder = init.builder;
		this.walker = new RuleWalker(init.rules, init.diagnostics);
	}
}
