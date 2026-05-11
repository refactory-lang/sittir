# ADR 0024 — Codegen Dogfooding via Construction Templates

**Status**: Proposed
**Date**: 2026-05-10
**Related**: ADR-0022 (construction templates), ADR-0018 (de-hoisted NodeData surface — establishes the generated-output hygiene rules)

## Context

sittir's emitters produce ~14K lines of generated TypeScript and ~1.5K
lines of generated Rust per regeneration via manual string
concatenation. This was acceptable when no alternative existed. ADR-0022
introduces construction templates — typed, structurally-validated
source-with-slots → `NodeData` / source — as the recommended pattern
for user-authored codemods. The argument generalizes: **sittir's emitters
are codemods** (input: `NodeMap`; output: TypeScript or Rust source). If
string concatenation is the wrong tool for users it's the wrong tool for
the emitters.

Five reasons make dogfooding load-bearing rather than cosmetic:

1. **Validation from the inside.** Construction templates are a wide
   surface — slot type derivation, alias propagation, supertype
   injection, fill-time validation, render-pipeline integration.
   Running our own emitters through them surfaces edge cases that
   external codemods would otherwise hit one at a time.
2. **Forcing function for template-mode parser quality.** Any
   deficiency in the template-mode parser breaks codegen, which breaks
   build, which is impossible to ship past. Stronger CI signal than a
   library of unit cases.
3. **TS-fallback fill becomes a first-class deliverable.** Codegen
   runs as `npx tsx` — no native backend. ADR-0022's runtime fill path
   lives in Rust. Codegen needs a TypeScript-side equivalent that
   produces *identical* NodeData to the native path. Without
   dogfooding, the TS fallback is an optimization concern; with
   dogfooding, it's a correctness concern with a clear contract:
   byte-identical regenerated output.
4. **Hygiene rules favor template expansion.** The generated-output
   hygiene rules established under ADR-0018 — no
   `Object.defineProperty`, no `Record<string, unknown>` casts, inline
   method-shorthand, no spread of `_sharedMethods` into factory
   literals, concrete per-kind types in factory signatures — all
   prefer inline expansion over runtime composition. That is exactly
   what templates do well: write the four `$`-prefixed methods once
   in a per-factory template, expand inline once per kind. Dogfooding
   makes the emitters the enforcement layer for these rules — a
   template that violates a rule is a single fix that propagates.
5. **The previous blockers are gone.** The `from()` / factory RT
   failures that previously made dogfooding impractical
   (`import_clause`, `shorthand_property_identifier`, `struct_item`,
   `generic_type`, `visibility_modifier`) are resolved by the recent
   `from`-API rewrite. Construction templates compile their slot
   resolution through the same path.

## Forcing Constraint

_TBD_

## Decision

Migrate the emitters to construction templates in tiers, validating each
tier with byte-identical regeneration before committing to the next.
Tiers are ordered to surface design pressure progressively — trivial
shape first, fill-in-a-loop next, varying-structure last. Tier 4 is
evaluated, not pre-committed.

### TS-fallback fill (prerequisite)

ADR-0022's runtime fill is Rust (sittir-core). Codegen needs an
equivalent in TypeScript: parse template source via tree-sitter's JS
binding, walk for `_sittir_metavar`, splice slot `NodeData` into the
parsed tree, return the assembled `NodeData`. ~80 lines in
`@sittir/core`. The TS path must produce identical `NodeData` to the
native path; the byte-identical contract depends on it. Behavioral
parity is the ongoing maintenance cost.

### Tier 1 — structural boilerplate

| Emitter            | Lines | Pattern                |
| ------------------ | ----: | ---------------------- |
| `config.ts`        |    22 | One template, one fill |
| `index-file.ts`    |    59 | One template, one fill |
| `grammar.ts`       |    62 | One template, one fill |
| `template-hash.ts` |    80 | One template, one fill |

~220 emitter lines. Trivially mappable. Migrating Tier 1 first proves
the round-trip (template authoring → TS-fallback fill → byte-identical
output) without forcing decisions about per-kind iteration patterns.

### Tier 2 — repetitive per-kind

| Emitter     | Lines | Pattern                                  |
| ----------- | ----: | ---------------------------------------- |
| `is.ts`     |   364 | One pattern, filled per kind             |
| `ir.ts`     |   325 | One pattern, filled per kind             |
| `consts.ts` |   709 | A small set of patterns, filled per kind |

~1.4K emitter lines. Validates the "fill in a loop" shape that ADR-0022
motivates — each output file is a concatenation of N filled templates
where N is the grammar's kind count. This is the shape most user
codemods will take.

### Tier 3 — per-kind with varying structure

| Emitter           | Lines | Pattern                                       |
| ----------------- | ----: | --------------------------------------------- |
| `wrap.ts`         |   503 | Per-kind interface + accessor block           |
| `types.ts`        | 1,912 | Multiple template fragments, conditional fill |
| `factories.ts`    | 2,099 | Template + per-slot inline expansion          |
| `client-utils.ts` |   942 | Mixed structural + per-kind                   |

~5.4K emitter lines. The substantial test: variable structure within
per-kind iteration, nested fills, conditional emission. If templates
can express these cleanly, the design is validated. If they require a
sub-DSL beyond what construction templates expose, that's a finding
worth surfacing **before** user-facing codemods hit the same wall.

### Tier 4 — evaluate, do not pre-commit

| Emitter   | Lines | Pattern                             |
| --------- | ----: | ----------------------------------- |
| `from.ts` | 1,861 | Closed-form resolver with branching |

~1.9K emitter lines. The `from()` resolver is data-driven branching,
not structural emission. Templates may not be the right tool.
Evaluated after Tiers 1–3 with explicit permission to leave `from.ts`
on the legacy path if migration adds complexity rather than removing
it. The decision and its rationale documented either way.

### Separate track — Rust render module

`render-module.ts` (~1,558 emitter lines) generates Rust source. It
would use **`@sittir/rust`'s** construction templates from a
TypeScript caller — cross-target dogfooding: `@sittir/codegen`
constructs Rust source via the Rust grammar's template surface,
validating that construction templates work end-to-end across grammar
boundaries. Independent of the TS-emitter tiers; ~2 days.

### Validation contract

Per emitter migration: `diff -r packages/<lang>/src/` against the
pre-migration baseline produces zero changes. Generated output is the
canonical test surface — a single byte difference is a regression.

For positions where strict byte-identity is impossible (object-literal
member ordering where the language spec is order-insensitive, etc.),
fall back to the validator's `counts` and `probe-factory` tools — output
that round-trips equivalently, even if not byte-identically.

### Effort

| Tier        | Emitter lines | Days              |
| ----------- | ------------: | ----------------- |
| TS fallback |  ~80 (new)    | 0.5               |
| Tier 1      |          ~220 | 1                 |
| Tier 2      |        ~1,400 | 2                 |
| Tier 3      |        ~5,400 | 5                 |
| Tier 4      |        ~1,860 | 3 (if worthwhile) |
| Rust track  |        ~1,560 | 2                 |

~13.5 days total. Tiers 1–2 (~3.5 days) validate the approach before
committing to Tier 3.

## Alternatives Considered

- **Don't dogfood.** Validate construction templates only via external
  user code. *Rejected:* no internal forcing function for
  template-mode parser quality; TS-fallback fill stays an optimization
  rather than a maintained deliverable; the strongest critique of
  construction templates — *"we wouldn't use it for our own codegen"* —
  becomes self-applying.
- **Tier 1 only.** Prove the concept on the smallest emitters, then
  stop. *Rejected:* the hardest cases (Tier 3) are where templates
  either succeed or reveal limitations. Tier 1 alone doesn't exercise
  fill-in-a-loop or conditional emission, so it doesn't tell us
  whether the user-facing surface is adequate for non-trivial work.
- **Native-only fill (no TS fallback).** Run codegen via an external
  Rust process. *Rejected:* slows iteration to a Rust rebuild per
  change; complicates the dev loop for everyone touching emitters;
  introduces a per-platform binary requirement on a codepath that's
  currently `npx tsx`-pure.
- **Sittir-internal template DSL.** Invent a separate codegen-only
  template format optimized for emitter ergonomics. *Rejected:* second
  source of truth for "construction templates"; defeats the dogfooding
  purpose; either drifts from the user-facing format or duplicates
  its implementation.

## Principles Applied

- **P-001 (External contract first).** Construction templates are
  sittir's contract for source-with-slot construction. Emitters *are*
  construction. Use the contract.
- **P-003 (Reuse existing structure).** TS-fallback fill exists for
  non-native codegen environments anyway; dogfooding makes it a
  first-class deliverable rather than an internal aside.
- **P-005 (Single source of truth).** One template format, one fill
  semantics, two implementations (Rust native, TS fallback). No
  internal DSL beside the user-facing one.
- **P-007 (Cut speculative scope).** Tier 4 (`from.ts`) is evaluated
  after Tiers 1–3 with explicit permission to leave it on the legacy
  path if migration adds complexity rather than removing it.

## Consequences

- **Enables**:
  - Construction templates validated by sittir's own use, not just
    external test cases.
  - TS-fallback fill becomes a maintained deliverable with a
    byte-identical regression test (the entire generated output of
    every grammar package).
  - Hygiene rules enforced at the template level — a single fix to a
    template propagates to every kind it generates.
  - Cross-target dogfooding (TS-side caller, Rust-target output) via
    the render-module track.
- **Costs**:
  - **Bootstrap fragility.** sittir regenerates its own packages,
    including the snippets emitter that uses templates, which uses
    `@sittir/core`'s fill, which is itself partly generated. Changes
    to construction-template internals must be staged so a
    regeneration cycle isn't broken mid-flight. Mitigation: keep
    prior-generation packages pinned until the new generation passes
    byte-identical regen.
  - **Duplicate fill implementation.** TS-side and Rust-side fill must
    stay behaviorally identical. Every change to the
    construction-template feature now requires both implementations
    to update — the byte-identical regen test is the canary.
  - **Migration cost.** ~13.5 days, with Tier 3 (~5 days) being the
    substantial portion. Realistic given Tier 3 is where templates
    either work or don't.
- **Follow-ups**:
  - After Tier 2 lands, decide whether Tier 3's "varying structure"
    cases need helper combinators on top of construction templates
    (e.g., conditional fill, optional-slot rendering) or whether the
    existing user-facing surface is sufficient.
  - Decide whether Tier 4 (`from.ts`) migrates, partial-migrates (only
    the structural skeleton), or stays on the legacy path. Document
    the decision regardless of outcome.
  - Capture each hygiene-rule violation found during migration as a
    template-level fix; the per-template fix replaces the per-kind
    hand-edits the legacy emitters required.

## Verification

If Tier 1 doesn't produce byte-identical output, the TS-fallback fill
is not behaviorally equivalent to the native path and the
construction-template feature has divergent backends. Signal: a single
byte difference in `diff -r` after migrating any Tier 1 emitter.

If Tier 3 forces inventing template-side conditional logic that
doesn't exist in user-facing templates, the dogfooding has stopped
validating the user-facing feature and has become its own thing.
Signal: emitter templates that use constructs (loops, conditionals,
helper escapes) which the public construction-template surface
doesn't expose.

If Tier 4 migration adds complexity to the from-resolver without
removing equivalent complexity, templates aren't the right tool for
data-driven branching. The decision tree explicitly accepts this
outcome — leave `from.ts` on the legacy path. Signal: the
post-migration `from.ts` emitter is longer or harder to read than the
pre-migration version.

If the bootstrap-staging plan fails — a regeneration cycle ends with
a package that won't compile because its own templates were
mid-changed — we either commit to a stronger pinning discipline or
accept that template-mode-parser changes require a two-phase rollout
(land in Rust + TS fallback first, regenerate consumers second).
