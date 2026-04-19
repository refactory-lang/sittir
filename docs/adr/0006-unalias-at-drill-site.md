# ADR 0006 — Unalias grammar-aliased kinds at drill site, keep alias source as canonical `$type`

**Status**: Proposed
**Date**: 2026-04-19
**Related**: `packages/core/src/readNode.ts`, `packages/*/src/wrap.ts`, memory note `project_alias_collapse_dead_kinds.md`, commit 8841e76

## Context

Tree-sitter grammars use `alias($.X, $.Y)` to erase rule `X`'s kind-name at specific call sites — the parse tree surfaces a node with `$type: 'Y'` whose body follows `X`'s rule definition. Example: rust's `alias($.generic_type_with_turbofish, $.generic_type)` appears at four call sites, producing a 3-child `generic_type` node `[type_identifier, '::', type_arguments]` even though the base `generic_type` rule is 2-child `[type_identifier, type_arguments]`.

Our codegen enumerates kinds from `grammar.js`'s top-level rules map, so it emits interfaces/factories/templates for both `generic_type` and `generic_type_with_turbofish`. Tree-sitter's `node-types.json` only lists `generic_type` — the source is never reachable via `readNode`. Worse, the `generic_type_with_turbofish` interface declares `$type: 'generic_type_with_turbofish'` which is a string tree-sitter never produces, so runtime data never satisfies the declared type.

Meanwhile, at alias call sites (e.g. `scoped_identifier.path`), field content-type resolution correctly narrows to the alias target: `path?: Path | BracketedType | GenericType`. So the codegen already knows about aliases at resolution time — it just drops the source name.

Working around this per-case via manual overrides (as in 8841e76) adds structural fields to the target rule (`optional(field('turbofish', '::'))`), letting the target's template cover both shapes. Tedious, site-specific, and doesn't fix the declared-type mismatch.

## Forcing Constraint

> "aliases only make sense in the context of a single field"

— the user, clarifying that an alias has no meaning outside the field/child position that invokes it. There is no "top-level aliased kind"; every alias exists at a specific parent-field declaration. Combined with an earlier observation:

> "we never validate kinds passed by tree-sitter"

— meaning `$type` string literals on interfaces are compile-time narrowing hints, not runtime assertions. A rewrite at the wrap boundary doesn't violate any runtime invariant.

## Alternatives Considered

- **Alias source becomes polymorph form of alias target (structural dispatch).** Treat every `alias($.X, $.Y)` pair as an implicit polymorph of `Y`, with `X` as a form discriminated by shape (e.g., `turbofish` field presence). Requires render dispatch to become form-aware for all alias pairs plus a discriminator derivation pass. Rejected as over-scoped: the alias pair is local to a field, not a global `Y`-is-a-polymorph claim.

- **Drop alias-source interfaces/factories entirely and filter emission via `node-types.json`.** Accurate on the readNode side but loses construction-site precision: hand-building a turbofish node would require populating `generic_type` with a generic `turbofish` field, no per-shape factory, no narrowed type. Rejected for factory ergonomics.

- **Extend override grammar-side (manual `optional(field(...))` injection).** Works per case (committed in 8841e76 for generic_type), but every new alias-pattern-A case requires duplicating the workaround; doesn't touch the declared-type mismatch; doesn't give consumers a source-typed view at the wrap layer.

- **Structural unalias at `wrapNode` dispatch (top-level plus drill-in).** Compute discriminators per alias target kind; rewrite `$type` before `_wrapTable` lookup. Rejected as unnecessary — there's no top-level entry point where knowing the alias source is possible without field context, and structural discriminators are extra machinery we can avoid when each drill site has the answer statically.

## Decision

Treat the alias **source** kind (`X`) as the canonical `$type` across codegen-emitted surfaces: interfaces declare `$type: 'X'`, factories emit `$type: 'X'`, templates for `X` are the live render target, `_wrapTable` dispatches by `X`. Tree-sitter's parse tree continues to emit `$type: 'Y'` (the alias target); the **only** place `Y` exists is the raw `readNode` output for the immediate handful of microseconds before drill-in.

At every per-field wrap getter, emit `drillAs(entry, tree, fromType, toType)` in place of `drillIn` for fields whose declared content came from `alias($.X, $.Y)`. `drillAs` reads the child, rewrites `$type` from `Y` to `X` when (and only when) the current `$type` matches `Y`, and hands off to `wrapNode` — which now dispatches to the source's `wrap*` and presents a source-typed view.

Aliases remain site-local: the rewrite happens at drill sites where the parent field declaration knows which alias applies. `readTreeNode` at the top level performs no rewriting — top-level reads give the target-named view, since no parent field context is available.

## Principles Applied

- **P-005 Single source of truth** — `X` becomes the single kind-name used across interfaces, factories, templates, and wrap. The `(X, Y)` mapping lives at one place per field (the drill site), not duplicated across declarations.
- **P-006 Consumer alignment** — the wrap-layer consumer gets precise source-typed narrowing at every drill. The producer (drill getter) pays the one-time unalias cost; ten callsites don't each need structural guards.
- **P-007 Cut speculative scope** — rejected the general "polymorph from aliases" machinery and the `_unaliasTable`/`readTreeNode`-level rewriting. Field-local drill-site unalias is the minimum change that fixes the observed problem.

## Consequences

- **Enables**: field getters deliver source-typed wrapped views (`scoped_identifier.path` as `GenericTypeWithTurbofish`, not `GenericType`). Eliminates "dead-but-shaped" alias-source interfaces — they're the canonical wrap destination. Replaces the per-case grammar-side override pattern from 8841e76 with a codegen-automatic fix.
- **Costs**: per-field codegen needs to preserve alias provenance on `AssembledField.contentTypes` — currently the evaluator drops `X` when resolving `alias($.X, $.Y)` to `Y` in field content-type unions. One extra helper (`drillAs`) per generated `wrap.ts`. Getter emission branches on "has alias provenance" → emit `drillAs` with positional `(from, to)` args.
- **Follow-ups**: (a) prototype for `generic_type` ↔ `generic_type_with_turbofish`, validate RT + factory tests don't regress; (b) generalize to rust's three other Pattern A alias cases (`scoped_type_identifier_in_expression_position`, `delim_token_tree`, `last_match_arm`); (c) remove the manual optional-field override in 8841e76 once the automatic path covers it.

## Verification

We'd revisit this if:

- A parse-shape appears where the alias source's declared shape disagrees with the actual aliased body tree-sitter emits — signals the source name doesn't uniquely determine shape and structural dispatch would be needed after all.
- A consumer pattern emerges that holds a bare `$nodeId` for an aliased node and needs source-typed access without a parent field getter in scope. Would motivate a structural-unalias fallback at `wrapNode`.
- Render or factory round-trip tests diverge between the source and target templates for the same parse text — source-as-canonical requires both templates produce identical output on equivalent input, and the source template should be the only one exercised post-decision.

## Implementation notes (retrospective)

Validator-side walker unalias (rendering via wrapped views so corpus
tests dispatch through the source template) was prototyped and reverted.
It renders correctly, but existing per-supertype reparse wrappers (e.g.
rust's `'_type': r => 'type _X = ${r};'`) can't accept turbofish in
bare type position — `C::<D>` requires being inside a `scoped_identifier`
to parse. The validator's reparse step failed on correctly-rendered
output that the wrapper couldn't reconstruct.

Prerequisite for retiring per-kind render-layer overrides (like rust's
`generic_type` pos-1 `optional(field('turbofish', '::'))` workaround)
is **per-source reparse wrappers**: a source kind whose parse tree
body is only valid inside a specific parent context needs a wrapper
that recreates that context (e.g. `'generic_type_with_turbofish': r =>
'type _X = ${r}::Item;'`). Until those land, both fixes coexist:
drillAs for consumer typing, template override for validator-path
rendering.

Also helpful: `loadReadTreeNode(grammar)` and `walkWrappedTree(root,
visit)` now live in `packages/codegen/src/validators/common.ts` —
ready for when the reparse wrappers catch up and validators switch to
walker-based iteration.
