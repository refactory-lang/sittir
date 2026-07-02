/**
 * grammar-twin.ts — recursive, schema-threaded twins of tree-sitter's
 * `RuleBuilder` / `Grammar`, plus a depth-bounded symbol `Resolve`.
 *
 * tree-sitter's `RuleBuilder<RuleName>` types the callback as
 * `($: GrammarSymbols<RuleName>, previous?: Rule) => RuleOrLiteral` — the
 * `previous`/`original` arg is loose `Rule` (no per-rule shape). The twin
 * narrows it to the rule's EXACT post-Enrich recursive shape, so a transform
 * callback's `original` is navigable and its path keys are checkable.
 *
 *   RecursiveRuleBuilder<S, K> = ($: GrammarSymbols<…>, p: EnrichRule<S['rules'][K]>) => RuleOrLiteral
 *
 * `$` is tree-sitter's own `GrammarSymbols<keyof S['rules'] & string>` — i.e.
 * `$.r` returns `SymbolRule<r>` (a leaf that composes in seq()/choice()), with
 * rule-name autocomplete + typo protection. We do NOT make `$.r` return the
 * recursive shape: a readonly recursive node is not `RuleOrLiteral` (wouldn't
 * compose), and `$.foo` IS a symbol reference at tree-sitter runtime anyway.
 *
 * SYMBOL RESOLUTION is a SEPARATE, OPT-IN, DEPTH-BOUNDED op (`Resolve`), never
 * baked into `Sym` or `$` — grammars are mutually recursive
 * (expression→binary_expression→expression…), so eager resolution is infinite
 * ("excessively deep"). `Resolve` expands one symbol to its rule body with a
 * tuple-length depth counter, capped small.
 */

import type { GrammarJson, GrammarNode, Sym } from './grammar-json.ts';
import type { EnrichRule } from './enrich-type.ts';

// ---------------------------------------------------------------------------
// Depth-bounded symbol resolution. `Resolve<S, Node, Depth>`:
//   - Node is `Sym<Name>` and Depth > 0 → `S['rules'][Name]` (one expansion),
//     decrementing Depth.
//   - Depth exhausted, or Node not a symbol, or Name not in rules → Node
//     unchanged (the symbol stays a finite leaf).
// Depth is a tuple-length counter (type-fest style); cap small (default 1).
// ---------------------------------------------------------------------------

type _Decr<N extends readonly unknown[]> = N extends readonly [unknown, ...infer Rest] ? Rest : [];

/**
 * Expand a SYMBOL node to its rule body, bounded by `DepthTuple` length.
 * Default depth 1 (single hop). Pass `[]` to disable (leaf-only).
 */
export type Resolve<
	S extends GrammarJson,
	Node extends GrammarNode,
	DepthTuple extends readonly unknown[] = [unknown]
> = DepthTuple extends readonly [unknown, ...unknown[]]
	? Node extends Sym<infer Name>
		? Name extends keyof S['rules']
			? S['rules'][Name] extends GrammarNode
				? S['rules'][Name]
				: Node
			: Node
		: Node
	: Node;

// ---------------------------------------------------------------------------
// Recursive RuleBuilder twin — narrows `previous` to the rule's post-Enrich
// shape for base rules; falls back to tree-sitter's loose `RuleBuilder` for
// NEW rule names (no base body → `previous?: Rule`).
// ---------------------------------------------------------------------------

/** Rule-name union of the base schema. */
export type SchemaRuleName<S extends GrammarJson> = keyof S['rules'] & string;

/**
 * Callback for a BASE rule `K`: `$` is tree-sitter's GrammarSymbols (composes,
 * autocompletes); `original`/`previous` is the rule's EXACT post-Enrich shape
 * (navigable + path-checkable). Return stays `RuleOrLiteral` (tree-sitter
 * native), so authored bodies compose normally.
 */
export type RecursiveRuleBuilder<S extends GrammarJson, K extends SchemaRuleName<S>> = (
	$: GrammarSymbols<SchemaRuleName<S>>,
	previous: EnrichRule<S['rules'][K]>
) => RuleOrLiteral;
