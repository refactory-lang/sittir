/**
 * compiler/ctx.ts — the per-phase pipeline context hierarchy.
 *
 * ONE ctx class per phase (EvaluateCtx, LinkCtx, NormalizeCtx, SimplifyCtx,
 * AssembleCtx), each extending `BaseCtx`. `BaseCtx<P>` holds the read-only
 * grammar container every phase derives once (the `Grammar<P>` input, a
 * derived `rules` accessor, the grammar word-shape predicate, diagnostics,
 * the inline set, the rule-construction strategy). Subclasses add
 * phase-specific inputs and — only where a phase genuinely accumulates — a
 * mutation API as methods (never a bare mutable field handed to every caller).
 *
 * Per docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md §2: `P`
 * is the ONE phase parameter driving grammar/rules/walker/builder together —
 * replacing the former `BaseCtx<R extends AnyRule>` which let the stored
 * `rules` map and its declared rule-view type disagree (the exact
 * disagreement PR #136 found in LinkCtx: `BaseCtx<Rule<'link'>>` holding
 * `raw.rules`, which is actually `Rule<'evaluate'>`-shaped).
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

import type { PhaseName } from '../types/rule.ts';
import type { Grammar, PhaseRuleOf } from './types.ts';
import type { DiagnosticSink } from '../types/diagnostics.ts';
import type { RuleBuilder } from '../dsl/rule-transforms.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';

/**
 * Construction inputs shared by every phase ctx.
 *
 * `P` is the phase whose `Grammar<P>` container this ctx reads — `'evaluate'`
 * (link reads `RawGrammar`), `'link'` (normalize reads `LinkedGrammar`),
 * `'normalize'` (simplify reads `NormalizedGrammar`), or `'simplify'`
 * (assemble reads `SimplifiedGrammar`). The pipeline refines it in order:
 * `BaseCtx<'evaluate'>` (link) → `BaseCtx<'link'>` (normalize) →
 * `BaseCtx<'normalize'>` (simplify) → `BaseCtx<'simplify'>` (assemble).
 */
export interface BaseCtxInit<P extends PhaseName> {
	readonly grammar: Grammar<P>;
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
 * Shared read-only phase context: the grammar container every phase derives
 * once, parameterized by the phase `P` whose `Grammar<P>` it reads (see
 * BaseCtxInit). `rules` is a DERIVED accessor over `grammar` — never a
 * separately-stored field the container and the phase view could disagree on.
 * Declared `abstract` here (rather than given one generic body) because
 * `Grammar<P>` is a conditional alias: TypeScript can't project `.rules` off
 * an unresolved `Grammar<P>` inside the base class body without an unsafe
 * cast. Each concrete subclass implements the one-liner at its OWN concrete
 * `P`, where the projection type-checks honestly — `LinkCtx`/`NormalizeCtx`/
 * `SimplifyCtx`/`AssembleCtx` all return `this.grammar.rules` (every
 * `Grammar<P>`, including `SimplifiedGrammar` since the 2026-07-05 rename of
 * its phase-product field from `simplifiedRules` to `rules`, declares a
 * `rules` field matching `PhaseRuleOf<P>`) — the uniform one-liner every
 * subclass implements.
 *
 * Deliberately minimal — only what EVERY phase carries. The "inline kinds" set
 * is NOT here: phases represent it differently (link as a `readonly string[]`,
 * simplify as a `ReadonlySet`), so each subclass declares its own rather than
 * force a lossy reconciliation. Mutation surfaces (e.g. the node map built
 * during Assemble) live on the concrete subclass as methods, never on this base.
 */
export abstract class BaseCtx<P extends PhaseName> {
	readonly grammar: Grammar<P>;
	readonly wordMatcher?: (s: string) => boolean;
	readonly diagnostics: DiagnosticSink;
	readonly builder?: RuleBuilder;
	#walker?: RuleWalker<PhaseRuleOf<P>>;

	/** Derived accessor over `grammar` — see class doc comment for why this is
	 *  abstract rather than one generic implementation. */
	abstract get rules(): Record<string, PhaseRuleOf<P>>;

	constructor(init: BaseCtxInit<P>) {
		this.grammar = init.grammar;
		this.diagnostics = init.diagnostics;
		this.wordMatcher = init.wordMatcher;
		this.builder = init.builder;
	}

	/**
	 * Traversal engine bound to this phase's rules map + diagnostics (R12
	 * PR-6). Lazily constructed (rather than eagerly in the ctor) because it
	 * reads the `rules` accessor, which subclasses implement as `abstract` —
	 * TypeScript forbids calling an abstract member from the base
	 * constructor (the override isn't installed on `this` until the subclass
	 * constructor body finishes). Memoized so repeated access returns the
	 * same instance.
	 */
	get walker(): RuleWalker<PhaseRuleOf<P>> {
		if (!this.#walker) this.#walker = new RuleWalker(this.rules, this.diagnostics);
		return this.#walker;
	}
}
