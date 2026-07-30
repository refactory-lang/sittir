# KindId invariant restoration — pre-generate synthesis routing + link-time stamping

## Invariant

Every kind name in the compiled model has a parser-issued kindId, and every
rule-tree leaf that carries a value carries its kindId as a stamped fact.
Emitters and model constructors consume stamps; they never re-derive ids from
text or name matching. Any leaf that cannot be stamped is flagged at compile
time by a link diagnostic — never discovered at runtime as an
"unknown kind id" render error.

## Why this doesn't hold today

The grammar executes twice:

1. `grammar.sittir.ts` → esbuild transpile (sittir DSL bundled inline) →
   `.sittir/grammar.js` → tree-sitter CLI executes it → `grammar.json`,
   `parser.c` (the symbol table — the only kindId mint that exists).
2. sittir compile: `evaluate(grammar.sittir.ts)` re-executes the same DSL,
   then runs post-passes → link → normalize → simplify → assemble → emit.

Code that runs **inside the DSL execution** (enrich, transform, overrides)
reaches both sides: its rules land in `grammar.json` and get parser symbols.
Code that runs **in evaluate's post-passes** (`synthesizeFieldEnumRules`,
`synthesizeInlineAliasSources`) reaches only the sittir side: its names exist
in the compiled model but tree-sitter never saw them, so no symbol, no
kindId — a *phantom kind*. Example: `_member_expression_separator`
(typescript) exists only in the generated `KEYWORDS` string list; the ids
that actually flow for its slot are the anon tokens it collapses to
(`.` = 44, `qmark_dot` = 49).

Ground truth for "did tree-sitter see it": `.sittir/src/grammar.json` (the
normalized grammar tree-sitter compiled), not `grammar.js`.

Separately, id **consumption** is scattered: `deriveValuesForRule`
(collect-slots time), `AssembledKeyword`/`AssembledToken` constructors
(assemble time), and emit-time fallback chains each do their own catalog
lookups. The lookups agree today only by discipline, not by construction.

## Source inventory (audited)

153 kind names across the three grammars have no kind-id row
(rust 53, typescript 69, python 31), from five sources:

| # | Source (mint site) | Count | Nature |
|---|---|---|---|
| a | `synthesizeFieldEnumRules` (evaluate.ts) — field-enums and the `_<kw>_marker` kinds enrich's field names induce | 39 | post-generate synthesis; the `_member_expression_separator` class |
| b | `synthesizeInlineAliasSources` (evaluate.ts) | 0 today | guards suppress every live site; any future fire is phantom by construction |
| c | grammar `inline:` array | 5 | tree-sitter deliberately issues no symbol — principled exclusion |
| d | VAPORIZED (in grammar.json, no parser symbol; mostly unreachable jsx in the non-tsx dialect) | 15 | dead surface — wants pruning/flagging, not id routing |
| e | `collectAnonymousNodes` (assemble.ts) keying anonymous nodes by RAW literal text while the catalog names the same tokens sanitized (`comma`, `lparen`, ...) | 94 | naming-domain mismatch — the tokens HAVE ids under other names |

Two further mint-site families are zero-phantom today but are the
invariant's live risk surface, and the feasibility proof for §1 lives in
enrich: `applyClauseHoist` mints synthesized rule names directly into
`base.grammar.rules` pre-generate — DSL-native minting that reaches both
executions, working in production. Group/renderAs/visibleExternals
injection is dual-registered the same way. Any IR-vs-grammar.js desugar
divergence at these sites mints a phantom silently — the link diagnostic is
their regression gate.

Load-bearing: (a) and (c) are live on the TS construction surface
(`from.ts` leaf-registry string dispatch; `kindIdFromName` throws
`unknown kind name` if handed one). (d) is dead surface (templates and
kind-list entries for kinds that can never parse). (e) is bookkeeping
duplication only. Native dispatch is numeric-only end to end — no phantom
name crosses napi.

## End state

### 1. Synthesis routed pre-generate (ids exist)

Every compile-side synthesis whose output is a real grammar shape moves into
the DSL layer that runs in both executions — the same placement enrich
already has, operating on `base.grammar.rules` before `grammar()` returns.
Concretely for the field-enum class: the canonical-name computation and rule
registration currently in evaluate's `synthesizeFieldEnumRules` run as a
DSL finalization pass, so `_<parent>_<field>` / `_<field>` rules are present
in the grammar tree-sitter compiles and receive real symbols
(`sym__member_expression_separator`). This placement is proven in-repo:
enrich's clause-hoist (`applyClauseHoist`) already mints synthesized rule
names directly into `base.grammar.rules` pre-generate — zero phantoms from
that class today.

Parse behavior is unchanged by construction: hidden-symbol nodes are elided
from the CST (children promoted to the parent), and tree-sitter propagates an
outer `field()` through a hidden rule to its children — so the wire shape and
field labels are identical to today's inline form. What changes is that the
name now has a catalog row, so every name-keyed lookup (`findEntryForKindName`,
alias chains, transport routing) resolves.

Evaluate's post-pass synthesis functions become verification-only: they
assert the rules already exist (minted by the DSL pass in both executions)
and mint nothing. A synthesis that fires only in evaluate is a bug this
assertion catches.

Constraints:
- The canonical-name computation must be deterministic across both
  executions — no dependence on host iteration-order quirks beyond the rules
  map's insertion order (the known grammar.js reorder nondeterminism is a
  live caution here; the pass must sort where ordering is not semantic).
- A new non-inlined hidden rule can shift LR states (the known
  field-promotion LR-divergence failure mode), and `inline:`-listing it
  defeats the purpose (no symbol). Every migrated synthesis source therefore
  gates on parse-fixture byte-identity (node-types.json diff +
  `validate:native`), one source at a time.
- Classes this does NOT cover, by design: rules in the grammar's `inline:`
  array and VAPORIZED rules (tree-sitter deliberately issues no symbol).
  Those are principled exclusions the link diagnostic (below) knows about,
  not phantoms.

### 1b. Catalog-first naming for anonymous nodes (largest class, no parser change)

`collectAnonymousNodes` resolves each literal through the catalog
(`findGeneratedKindEntry`) and keys the node by the catalog row's kind name,
falling back to raw text only with a diagnostic. Kills the 94-name class (e)
outright — these tokens already have ids; only the naming domain diverged.

### 2. Link is the single stamping point (ids are consumed uniformly)

`link()` already receives `generatedIdTables` (parsed from `parser.c`). A
link pass stamps every value-bearing rule-tree leaf:

- `SYMBOL` → `storageKindId` (by `aliasedFrom ?? name`) and `parseKindId`
  (by `name` / alias-occurrence row) — the same pair `deriveValuesForRule`
  computes today, moved to the tree.
- `STRING` / fixed-literal `PATTERN` → `resolvedKindId` (by literal text,
  anon-token-first).

Downstream consumers read stamps instead of looking up:
- `deriveValuesForRule` drops its `DeriveCtx.kindEntries` lookups and copies
  stamps off the leaves.
- `AssembledKeyword` / `AssembledToken` constructors read the stamped id off
  their `StringRule` (subsuming the constructor-time `findEntryForLiteralText`
  lookup that currently computes `resolvedKind`/`resolvedKindId`).
- Emit-time resolution chains (`resolveLiteralKindId`,
  `resolveAcceptedTransportIds`'s name-derived fallbacks) shrink to
  stamp-reads plus a hard assertion.

The same pass emits a diagnostic listing every leaf it could NOT stamp,
classified against the known-exclusion list (inline:/VAPORIZED). That
diagnostic is the permanent, always-on phantom-kind detector — the compile
fails loudly (or warns, during migration) instead of deferring the gap to a
native "unknown kind id" at render time.

## Relationship and sequencing

The two directions are complementary: (1) makes ids *exist* for synthesized
kinds; (2) makes id *consumption* uniform and makes missing ids a
compile-time signal. Recommended order:

1. **Link stamping + diagnostic first.** Mechanical, no parser change, and
   its unstampable-leaf report is the live, always-current phantom inventory
   (regenerated per build into grammar-diagnostics.json) that scopes the
   later steps precisely — superseding one-off audits. Ratchet: the
   diagnostic count starts at the audited 153 and may only shrink.
2. **Catalog-first anonymous-node naming (1b)** — pure naming, no parser
   change, removes 94 of 153.
3. **Pre-generate synthesis routing**, driven by the diagnostic, one
   synthesis source at a time (field-enums first — the
   `_member_expression_separator` class, 39 names), each behind the
   parse-fixture byte-identity gate.
4. **Prune the dead surface** (VAPORIZED class, 15) and **tighten**:
   evaluate post-pass synthesis reduced to assertions; the diagnostic's warn
   level promoted to a hard gate once the expected-miss list is down to the
   principled `inline:` exclusions.

Step 1's first PR: the stamp pass + diagnostic with consumers unchanged
(stamps verified equal to the lookups they will replace — byte-identical
regen as the gate), then a second PR flips consumers to stamp-reads and
deletes the per-site lookups.
