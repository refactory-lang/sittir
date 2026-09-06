# Grammar, Templates, and Overrides Workflow

Use this file for grammar generation, parser/debugging work, template fixes, or override design.

## Generation commands

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
```

## Debugging and triage

- Use `pnpm exec tsx packages/cli/src/cli.ts tool probe-kind` before writing one-off probe scripts.
- Prefer explicit `packages/<lang>/grammar.sittir.ts` structure over heuristics that infer grammar intent from parse output.
- For template/from/round-trip failures, check in this order:
  1. existing override correctness
  2. earliest codegen phase that still has the needed information (`Evaluate → Link → Assemble`)
  3. missing type/model facts
  4. `transform(original, { ... })` as a last resort

## Render bodies

Render bodies are generated from the render rules — there is no template to
author. A slot renders where its rule sits; an optional slot is gated on its
presence; separators and their spacing come from the list view. Fix the rule
(an override, an `enrich` promotion, a `variant()`), never the emitted body.

## Override patterns

- Use `variant()` for choice arms with different literals, delimiters, or separators.
- Extend conflicts with `...(previous ?? [])` or `previous.concat(...)`; do not replace the base grammar conflicts.
- Use `field('semicolon', $._semicolon)` for hidden-semicolon drops.
- If variant/conflict work changes parser shape, rerun the full transpile/generate/compile-parser/emit chain so `.sittir` artifacts and emitted TS stay aligned.
- `enrich()` runs before tree-sitter's `grammar()` and DOES change the parser surface: its promoted fields and synthesized hidden rules (`_kw_*`, clause-hoist `_<parent>_optional<N>` / `_<parent>_group<N>`) are injected into the base rules, so the parser and the downstream codegen see the same enriched grammar. Clause hoisting (`applyClauseHoist` in `dsl/enrich.ts`) is the pre-generate minting path: inline-safe `optional(seq(...))` content hoists into a hidden helper; inline-unsafe (multi-slot) content becomes a visible kind via a hidden rule + `alias($._hidden, $.visible)`.
- When a promoted keyword/token field causes LR conflicts, add a synthesized `_kw_<name>` rule to `inline:` instead of compensating with precedence/conflict noise.
- Content-alias minting in link (`mintContentAliasKinds`) is retired: an alias's hidden source rule stays the single source of truth, referenced via `aliasedFrom` provenance in `resolveRule`, and is promoted to user-facing visibility by assemble's alias-source mechanism once its slot reference hydrates. Do not author overrides that depend on link duplicating alias bodies into new top-level rules.
- `enrich`'s optional-keyword-prefix promotion (pass 3, `tryPromoteInnerKeyword` in `dsl/enrich.ts`) only fires for WORD-shaped (identifier-like) keywords, gated by `matchesWordShape`/the grammar's `wordMatcher`. Punctuation/single-char optional markers (`*`, `=`, etc.) are never auto-promoted this way — write an explicit `field('<name>_marker')` transform override at the right position instead (see "Positional path addressing" below).
- Required (non-optional) literals never need a `field()` wrap for rendering: they bake straight into the auto-generated template as literal text (e.g. `interpolation`'s `{`/`}`, `yield`'s own leading `'yield'`). Only reach for `field()` on a marker that's actually optional in the grammar, where the template needs an `{% if ... | isPresent %}` to decide whether to print it at all.
- `inline:` + alias-target + multi-step `seq(...)` body is a trap: tree-sitter's `process_inlines` splices a multi-step seq body into SIBLING nodes at parse time, distributing the alias per step, not onto one surviving grouped node. Never assume `alias(seq(a, b, ...), $.visible)` "survives inlining" just because it's a single alias in the DSL source — for a multi-step body it does not. Confirm the real compiled shape via `node-types.json`/a CST probe, not the DSL source, before trusting an `inline:` entry that's also an alias target. Fix by removing the ref from `inline:` and resolving the resulting LR conflict with `conflicts:` entries (see below) instead of leaving the flattening in place.
- When un-inlining a rule, or promoting a previously-anonymous shape to a new named kind (via `groups:`, see below), introduces a fresh "Unresolved conflict" error at generate time: resolve it by iterating — run `gen`, read tree-sitter's own `Add a conflict for these rules: X, Y, Z` suggestion verbatim, append `[$.X, $.Y, $.Z]` to `conflicts:`, regen, repeat until clean. This usually converges in single-digit rounds. Reach for `prec`/associativity only if `conflicts:` alone doesn't resolve it — GLR forking is almost always the right tool when two genuinely different named rules share a prefix.

### Positional path addressing (`transform(original, { '<path>': ... })`)

Path segments (`packages/codegen/src/dsl/transform/transform-path.ts`) are numeric indices, `_` wildcards, `(kind)` matches, or `name:` field-traversal — see the file's own header comment for the full grammar. The part that isn't written down anywhere else: **numeric-index segments transparently descend through single-content wrapper types** (`OPTIONAL`, `TOKEN`, `PREC`/`PREC_LEFT`/`PREC_RIGHT`/`PREC_DYNAMIC`, `FIELD`) without those wrappers consuming their own path segment. So `'1/0'` can reach straight through `optional(token(prec(1, '*')))` at seq position 1 to the bare `STRING '*'` inside it — the `OPTIONAL` and `TOKEN`/`PREC` layers are transparent, only the `CHOICE`/`SEQ` container at that position counts as a level. Verify the exact path with `sittir tool probe-stages --grammar <g> --kind <k> --no-overrides` (the pre-override evaluate-phase view) rather than guessing from a superficially similar existing override — a wrong index does not error, it silently wraps the wrong content (root cause of a real bug, `985933068`).

### Promoting a collapsed choice arm to a real kind (`groups:`)

When a choice arm mixes a bare literal with an unlabeled polymorphic symbol (the "choice-branches-with-literals" cluster — e.g. `choice(seq('from', $.expression), optional($._expressions))`), sittir's union-content-naming collapses same-shape no-field arms into one shared slot. Symptoms: field-wrapping just the literal (e.g. `field('from_marker')` on the `'from'`) un-collapses the naming but does NOT fix the ambiguity — both arms' remaining content still resolve through the same underlying raw-key fallback (e.g. an `expression` polymorph), so both slots populate from the one physical parsed node and the render duplicates it. Re-merging the two auto-named slots under one shared `storageName` is correctly rejected by codegen's `storagename-collision` diagnostic gate (`canProceed: false`) — do not try to work around that gate.

The real fix: promote the WHOLE arm to a genuine, distinguishable CST node via a `groups:` entry (`wire({ groups: { <visibleName>: ($) => <bodyExpr> } })`, same DSL surface as e.g. `comparison_operator_comparator`). The body must structurally match the arm's CURRENT shape exactly — the matcher (`patternBodyEqual` in `dsl/wire/wire.ts`) walks the tree comparing `type`, `value`/`name` for `STRING`/`SYMBOL`, and (critically) **field names** for `FIELD` nodes, so a group whose body includes `field('value', ...)` will only match sites that already have that exact field, and a superficially-similar arm elsewhere with a differently-named field (e.g. `raise ... from cause`) will not collide. Once the pattern matches, the wire pass auto-replaces every occurrence with `alias($._<hidden>, $.<visible>)`, so the arm becomes its own named kind and the union becomes a dispatch between two structurally distinct kinds instead of one ambiguous collapsed slot — no separate `patches:` field-wrap is usually needed afterward (see the "required literals" bullet above: a bare required literal inside the new group's body bakes into its own auto-generated template for free).

## Reporting expectations

For corpus-affecting iterations, report raw per-grammar counts, not just aggregates:

- `fromPass/fromTotal`
- `covPass/covTotal`
- `rtPass/rtTotal/rtAstMatchPass`
- `factoryPass/factoryTotal`

## KindID / parser-symbol rules

- Invariant: every kind name the generated model exposes should carry a parser-issued kindId. Link stamps ids while canonicalizing catalog refs; names it cannot stamp are reported per build as `kindid-unstamped-*` entries in `packages/<lang>/.sittir/grammar-diagnostics.json` (the phantom-kind inventory), and `packages/codegen/src/__tests__/phantom-kind-ratchet.test.ts` enforces shrink-only per-grammar ceilings — fix the minting site, never raise a ceiling.
- For KindID work, `packages/<lang>/.sittir/src/parser.c` `enum ts_symbol_identifiers` is the authoritative parser identity source.
- Do not derive identity from `ts_symbol_names[]` or `parser.wasm`.
- Preserve parser-origin facts as metadata flags (`anon`, `aux`, `alias`, `hidden`) instead of baking them into cleanup heuristics.
- `key` is the canonical cross-pipeline join term; do not replace it with minimally cleaned parser names just because they came from `parser.c`.
- Keep parser identity, canonical key, emitted JS/native names, presence flags, and use flags as separate facts.
- Use:
  - `KindPresenceFlag`: `TSGrammar`, `TSNodeTypes`, `TSRuntime`
  - `KindUseFlag`: `Readable`, `Buildable`, `Renderable`
