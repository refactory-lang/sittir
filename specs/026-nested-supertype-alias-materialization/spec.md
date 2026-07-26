# Feature Specification: Nested-Supertype Alias Materialization

**Feature Branch**: `026-nested-supertype-alias-materialization`
**Created**: 2026-07-26
**Status**: Partially Implemented (2026-07-26) — see Progress below
**Input**: Follow-up from `variantrule-retype-cut` / PR #179 — landed alongside commit `ca27502a6` ("fix(evaluate): stop alphabetizing buildRuleCatalog's rule order"), which fixed the *naming* half of this bug. This spec covers the remaining *node-registration* half.

## Progress (2026-07-26)

Implemented and verified zero-regression:

- `assemble()`'s main loop (assemble.ts) gained a post-pass that walks every `SUPERTYPE` rule's `subtypeParseNames`, and for each entry whose target (`subName`) is *itself* classified `SUPERTYPE`, registers a real `AssembledSupertype` node under the alias name (`token_pattern_group1`), reusing the nested rule's own resolved subtypes. Guarded to skip non-SUPERTYPE targets (the `_primitive_type → primitive_type` ENUM case stays on the old flatten-through path, per the Non-Goals below).
- `resolveHiddenSubtypes` now walks a SUPERTYPE rule's own `subtypes` list directly (not `resolveHiddenRuleContent`'s fully-flattened output) and substitutes the alias name for nested-SUPERTYPE members, so parents correctly reference `token_pattern_group1` instead of flattening through it.
- Result: rust `read-render-parse` Pass 107→108 (`AstMatchPass` steady at 100), zero regressions across `validate:native` (ts/py byte-identical) and `pnpm vitest run` (37 pre-existing failures, byte-identical FAIL-line set before/after).
- **"Macro invocation - arbitrary tokens" now passes fully** (was previously `unknown kind id` crash).
- **"Attribute macros" still fails** — but this is NOT a regression: it was already failing on the ordering-fix-only baseline (with a different error, `unknown kind id 170`); post-this-fix it fails with a different error instead (`Missing field _content` on `DelimTokenTreeTransport._content`), same FAIL status throughout.

**Newly discovered, separate, deeper bug** (not fixed by this pass): a repeated supertype-typed slot (`_delim_tokens` on `_delim_token_tree_paren`) whose array contains a *materialized alias node* (`token_pattern_group1`, e.g. wrapping a bare `'`) *immediately followed by* a nested `token_tree`/`delim_token_tree` element in the same array does not recursively wrap that following element — it's left as a shallow stub (kind-id/text/span only, no `_content`), causing the render-side `FromNapiValue` conversion to fail. Minimal repro: `foo(#[bar('())] x);` (rust). Confirmed this combination works fine when neither element is `token_pattern_group1` (e.g. two adjacent nested `()` groups render fine), so the bug is specifically about what happens to READ-recursion depth for the sibling immediately after a materialized-alias array element — likely in wrap.ts's generated array-construction logic for repeated supertype slots, not in `assemble.ts`. **This needs its own, separate investigation** — out of scope for a quick follow-up to this spec; treat as a new bug to research (start from the minimal repro above via `probe-kind --full` and compare the `nativeTransport` trace's array-element shape for the failing vs. passing cases).

## Summary

When a hidden rule is itself a nested `SUPERTYPE` (a supertype whose own subtype is *another* supertype — e.g. rust's `_non_delim_token`, whose subtype `_non_special_token` is a further supertype), and that nested rule materializes as a real, aliased node in tree-sitter's compiled parser (confirmed via `grammar.json`), sittir's own pipeline has no mechanism to register a corresponding node for it. `resolveHiddenSubtypes` (assemble.ts) currently flattens straight through the nested supertype to its eventual leaf kinds instead — which is *usually* harmless (tree-sitter also flattens in the common case) but is silently wrong for the subset of nested supertypes tree-sitter aliases into their own intermediate node. The result: content at that tree position is duplicated/corrupted at render time (confirmed for rust macro-invocation arguments — `foo!(a, b)` rendering as `foo!()`, and worse).

Landing the naming fix alone (commit `ca27502a6`) already resolves the *majority* of this bug's damage: 15+ rust test cases move from silently-duplicated content to byte-exact AST match. Two cases (`Attribute macros`, `Macro invocation - arbitrary tokens`) instead move from silently-wrong to a loud render crash (`unknown kind id N in DelimTokensTransport`), because attempting the correct fix — substituting the real alias name instead of flattening — hits a wall: **nothing in sittir's pipeline ever synthesizes an actual node for the alias**, so downstream emitters (`emitSupertypeUnionDeclarations` in types.ts, and presumably the Rust-side kindId catalog / wrap dispatch table) have nothing to reference.

## Problem Statement

### The concrete case (rust)

- `_non_special_token` is a hidden `SUPERTYPE` rule, referenced as a subtype from three different parents: `_tokens`, `_non_delim_token`, `_token_pattern`.
- Tree-sitter's real compile aliases this occurrence to a genuine, named CST node: `token_pattern_group1` — confirmed via `grammar.json`, which shows the alias at three positions: `_token_pattern/members[4]`, `_tokens/members[3]`, `_non_delim_token/members[0]`.
- As of commit `ca27502a6`, sittir's own `link()` phase correctly computes this SAME name (`_non_delim_token.subtypeParseNames = { "_non_special_token": "token_pattern_group1" }`, verified via the `classify` CLI tool) — the naming divergence that caused this to previously read `non_delim_token_group1` (wrong) is fixed.
- But `resolveHiddenSubtypes` (assemble.ts:823-905) still flattens `_non_delim_token`'s reference to `_non_special_token` straight through to leaf kinds (`string_literal`, `identifier`, `mutable_specifier`, `self`, `super`, `crate`, ...) via `resolveHiddenRuleContent`, discarding the alias entirely. This happens to produce a passable (if occasionally lossy) result for the *common* case, but is flatly wrong when tree-sitter's real compile inserts a genuine intermediate node — which the flattened view has no way to represent.

### What was tried and why it's incomplete

During investigation (this session), the following fix was drafted and reverted:

1. In `resolveHiddenSubtypes`'s `visit()`, when `rule.type === SUPERTYPE`, walk `rule.subtypes` directly (its own un-flattened list) instead of `resolveHiddenRuleContent`'s fully-flattened output.
2. For each direct subtype with an entry in `rule.subtypeParseNames`, substitute the alias name instead of recursing/flattening — but **only** when the referenced member is *itself* classified `SUPERTYPE` (an ENUM-shaped hidden rule with its own parse-name alias, e.g. `_primitive_type → primitive_type`, needed to keep flattening — see Non-Goals).

This correctly identifies *when* substitution should happen. But regenerating rust with this change throws:

```
Error: types: supertype '_delim_tokens' references subtype 'token_pattern_group1' which is not in NodeMap.
    at emitSupertypeUnionDeclarations (packages/codegen/src/emitters/types.ts:871)
```

Confirmed via the `classify` CLI tool: `token_pattern_group1` has no entry in `nodeMap.nodes` anywhere in sittir's own model. Enrich's clause-hoist promotion (`promoteExistingHiddenRuleName`, `dsl/enrich.ts`) computes the *name* tree-sitter will use, but nothing downstream of `link()`/`assemble()` ever mints an actual node, kindId, or Rust-side transport/dispatch-enum variant for it.

## Goals

- Given a nested-supertype rule (`_non_special_token`) that tree-sitter's real compile aliases into a distinct intermediate CST node (`token_pattern_group1`) at one or more parent occurrences, sittir's pipeline should:
  1. Register a real node for the alias in `nodeMap.nodes` (assemble phase).
  2. Give that node a `subtypes` union equal to the nested rule's own subtypes (recursively resolved the same way any other supertype's subtypes are — i.e. this node behaves exactly like any other supertype node, just reached via an alias rather than a bare hidden name).
  3. Emit the appropriate Rust-side kindId entry and dispatch-enum variant (transport.rs / kind_ids.rs) so a CST node arriving under that real compiled kind-id round-trips correctly instead of throwing "unknown kind id".
  4. Parents that reference the nested supertype (`_delim_tokens` via `_non_delim_token`, `_tokens`, `_token_pattern`) should list the alias (`token_pattern_group1`) as their resolved subtype, not the flattened leaf set.
- Fix should generalize: any nested-supertype-with-a-real-compiled-alias case, not just rust's `_non_special_token` — this pattern is plausible (if not yet observed) in typescript/python too.
- Zero regressions across the `validate:native` gate and the unit test suite for all three grammars, matching the discipline already established (this repo's baseline is VALIDATOR-RELATIVE — net win with zero *true* regressions, not raw-count chasing).

## Non-Goals

- **ENUM-shaped hidden rules with their own parse-name alias** (e.g. `_primitive_type`, an all-STRING `CHOICE` classified `modelType=enum`, aliased to `primitive_type` at its `_non_special_token` occurrence) are explicitly out of scope for this materialization. These do not get a separately-registered node in the same way — `primitive_type` is not currently registered as a standalone node either, and (unlike the nested-SUPERTYPE case) the existing flatten-through behavior for ENUMs has not been shown to cause the same class of content-loss bug. Confirm this assumption during implementation (open question below) rather than assuming it's identical to the SUPERTYPE case.
- **Auditing/fixing every other possible nested-supertype occurrence** across all three grammars is out of scope for the initial landing — ship the mechanism generally, but the validation gate (not an exhaustive manual audit) is the acceptance signal for "did this regress or improve anything else."
- **Re-litigating the ordering fix** (commit `ca27502a6`) — that fix is landed and stable; this spec is purely about the residual node-registration gap it exposed.
- **The already-landed `loadGrammarJsonAliasMap` infrastructure** (`inline-sets.ts`, `AssembleCtx.grammarJsonAliasMap`) is inert as of `ca27502a6` (the ordering fix made sittir's own `subtypeParseNames` agree with grammar.json's real names, so the read-back is no longer strictly necessary for the naming half of this bug). Whether it's still useful as a *validation cross-check* (assert sittir's computed name matches grammar.json's, and diagnose loudly if they ever diverge again) or should be removed as now-dead weight is an implementation-time call, not pre-decided here.

## Investigation Trail (for the implementer)

- `packages/codegen/src/compiler/assemble.ts` — `resolveHiddenSubtypes` (~line 823) is the exact site; its current comment block ("KNOWN GAP (not yet fixed)") documents this precise investigation and the drafted-then-reverted fix shape.
- `packages/codegen/src/types/rule.ts:525-546` — `SupertypeRule.subtypeParseNames` doc comment; confirms the field is stamped per-rule by `classifyHiddenChoiceRule` (link.ts) and is correctly populated post-`ca27502a6`.
- `packages/codegen/src/emitters/types.ts:848-880` (approx) — `emitSupertypeUnionDeclarations`, the function that throws "not in NodeMap" — the acceptance test for "is the node registered."
- Rust-side: `rust/crates/sittir-rust/src/render/transport.rs`'s `DelimTokensTransport` enum (and its `FromNapiValue`/kind-id match arms) is the concrete downstream artifact that needs a new variant + kind-id mapping once a node exists.
- `packages/tools/src/probe/` (`probe-kind` CLI tool) and `classify` CLI tool (`pnpm exec tsx packages/cli/src/cli.ts tool classify -g rust --kind <name>`) are the fastest empirical verification loop — used throughout this investigation to confirm rule shapes/subtypeParseNames/nodeMap membership without needing a full native rebuild.
- Reproduction: `pnpm exec tsx packages/cli/src/cli.ts tool probe-kind -g rust --kind macro_invocation --source 'foo!(a, b);'` (post-`ca27502a6`, pre-this-spec's-fix) should show the render succeeding structurally but the two named test cases in `packages/tools/src/__tests__/corpus-validation.test.ts`'s rust corpus ("Attribute macros", "Macro invocation - arbitrary tokens") will fail with `unknown kind id N in DelimTokensTransport`.

## Open Questions

1. Does `_primitive_type`'s alias (`primitive_type`) need the *same* treatment eventually (i.e. is there a latent, not-yet-observed content-loss bug there too), or is the ENUM case genuinely safe to keep flattening? The corpus doesn't currently exercise this path in a way that surfaces a failure, but that may just mean the test corpus doesn't cover it — not that it's safe.
2. Is `token_pattern_group1` (and any sibling cases discovered while implementing this) a **single node reused across all three referencing parents** (`_tokens`, `_non_delim_token`, `_token_pattern`), or could tree-sitter theoretically alias the same hidden rule to *different* names at different occurrences? (Not observed in practice — tree-sitter dedupes identical anonymous content to one shared alias, per the existing `loadGrammarJsonAliasMap` doc comment — but worth a defensive check.)
3. Where's the right place to synthesize the node — a new pass alongside `synthesizeInlineAliasSources`/`synthesizeFieldEnumRules` (evaluate.ts), or inside `assemble()` itself alongside the existing supertype-resolution logic? The former runs earlier and might let `token_pattern_group1` flow through the pipeline exactly like any other rule; the latter is more localized but may need to hand-roll what the earlier passes get for free.
4. Should this synthesis be conditioned on `AssembleCtx.grammarJsonAliasMap` (confirming the alias is real per the compiled grammar) as a safety gate, given that map is already threaded through and inert? Using it as a *gate* (only materialize when grammar.json confirms it) rather than a name *source* (now unnecessary post-`ca27502a6`) may be its best remaining use.

## Acceptance Criteria

- `pnpm run validate:native` shows rust `read-render-parse` Pass ≥ 109/136 (recovering the 2 cases this spec addresses on top of the 107/136 baseline `ca27502a6` leaves behind) with AstMatchPass ≥ 100, and zero new failures relative to that baseline for typescript/python.
- The two named rust corpus cases (`Attribute macros`, `Macro invocation - arbitrary tokens`) pass with byte-exact AST match, not just "no crash."
- `pnpm vitest run` shows no new failures beyond the existing 22-failed-files/29-failed-tests pre-existing baseline.
- `foo!(a, b)` (and other macro-invocation-with-arguments source) round-trips through render without content loss or duplication.
