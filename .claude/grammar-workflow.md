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

## Template rules

Shared templates must stay in the Nunjucks ∩ Askama intersection.

Canonical conditional:

```jinja
{% if field | isPresent %}...{% endif %}
```

Avoid:

- `{% if foo is defined %}`
- truthy `{% if foo %}`
- `{% if foo != "" %}`
- `{% else if %}` (use `{% elif %}`)

Keep separators inside the guarded conditional.

## Override patterns

- Use `variant()` for choice arms with different literals, delimiters, or separators.
- Extend conflicts with `...(previous ?? [])` or `previous.concat(...)`; do not replace the base grammar conflicts.
- Use `field('semicolon', $._semicolon)` for hidden-semicolon drops.
- If variant/conflict work changes parser shape, rerun the full transpile/generate/compile-parser/emit chain so `.sittir` artifacts and emitted TS stay aligned.
- `enrich()` runs before tree-sitter's `grammar()` and DOES change the parser surface: its promoted fields and synthesized hidden rules (`_kw_*`, clause-hoist `_<parent>_optional<N>` / `_<parent>_group<N>`) are injected into the base rules, so the parser and the downstream codegen see the same enriched grammar. Clause hoisting (`applyClauseHoist` in `dsl/enrich.ts`) is the pre-generate minting path: inline-safe `optional(seq(...))` content hoists into a hidden helper; inline-unsafe (multi-slot) content becomes a visible kind via a hidden rule + `alias($._hidden, $.visible)`.
- When a promoted keyword/token field causes LR conflicts, add a synthesized `_kw_<name>` rule to `inline:` instead of compensating with precedence/conflict noise.
- Content-alias minting in link (`mintContentAliasKinds`) is retired: an alias's hidden source rule stays the single source of truth, referenced via `aliasedFrom` provenance in `resolveRule`, and is promoted to user-facing visibility by assemble's alias-source mechanism once its slot reference hydrates. Do not author overrides that depend on link duplicating alias bodies into new top-level rules.

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
