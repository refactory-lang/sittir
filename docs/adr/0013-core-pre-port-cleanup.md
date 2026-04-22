# ADR 0013 — `@sittir/core` pre-port cleanup: browser-safe loader, variant collapse, pre-partitioned render

**Status**: Proposed
**Date**: 2026-04-21
**Related**: ADR-0007 (declarative polymorphs), ADR-0010 (auto-stamp + refine), ADR-0011 (codegen DRY).
**Blocks**: Rust port v3; askama template-engine migration.

## Context

`@sittir/core` was grown during the TypeScript-first phase of the project.
Five structural concerns have accumulated that are tolerable for the TS
runtime but block two upcoming workstreams: (a) porting the render engine
to Rust with `tree-sitter-rust`, and (b) swapping the hand-rolled regex
template substitutor for a declarative engine (askama / Nunjucks).

The five concerns, symptoms first:

1. **`render.ts` cannot load in a browser.** `node:fs` + `yaml` imports are
   at module top, so any consumer pulling the renderer for type-checking
   or preview in a browser tool fails at import time — even if it never
   calls `loadTemplates`.

2. **Template variant dispatch is structurally broken but hidden.** Across
   all three grammars, most polymorph parent templates have *identical*
   entries across every form (`struct_item` renders `$VIS struct $NAME
   $TYPE_PARAMS $$$CHILDREN` for `brace`, `tuple`, and `unit` alike). In
   these cases `variants:` is dead weight — the variant child has its own
   kind and template, and `$$$CHILDREN` delegates to it. A `grep`
   inventory (11 variants blocks in rust, 8 in typescript, 2 in python)
   shows only **five** rules across the three grammars have templates
   that genuinely differ between forms (post-regeneration count; the
   initial pre-cleanup estimate of three undercounted `variable_declarator`
   and `_match_block`):

   | Rule                             | Why forms differ                                              |
   |----------------------------------|---------------------------------------------------------------|
   | `rust/visibility_modifier`       | `pub` (bare) vs `pub(crate)` (with parens + in-clause)        |
   | `typescript/export_statement`    | Star export, type export, export assignment, namespace export |
   | `typescript/call_expression`     | With/without type_arguments, optional chaining                |
   | `typescript/variable_declarator` | Forms differ on initializer presence / type annotation        |
   | `python/_match_block`            | Suite form vs single-statement form                           |

   Compounding this: factory output stamps `$variant: '_form_external'`
   (with `_form_` prefix) but template variant keys use `external` (no
   prefix). `resolveTemplate`'s primary dispatch
   (`obj.variants[node.$variant]`) never matches for factory-produced
   nodes — the `pickTemplate` field-presence fallback quietly picks a
   template for them. For identical-across-forms rules this hides the
   mismatch; for the three rules that genuinely differ, it works only by
   accident.

3. **Consumption tracking is interleaved with template resolution.** The
   render engine threads a mutable `Set<number>` of consumed child
   indices through `resolveSlot` / `renderClause` / `$$$CHILDREN` to
   ensure each child renders exactly once. A declarative template engine
   (askama) cannot express this — it expects a pre-computed context
   where each slot is a finished string. Migration to askama is blocked
   until consumption is extracted.

4. **`readNode` field-placement logic is tangled with tree-sitter API
   calls.** The Rust port needs to replicate this placement exactly
   against `tree-sitter-rust`'s API, but the algorithm (field lookup,
   multi-value accumulation, anonymous-keyword promotion, prototype-
   pollution guard) is currently interleaved with the TS tree-sitter
   surface, making straight-line translation error-prone.

5. **`promoteAnonymousKeyword` promotes any anonymous token blindly.**
   Most promoted fields are template-structural (`,`, `;`, `::`, `!`) and
   never consumed by templates or user code. Blanket promotion makes
   readNode output contain fields that are noise to consumers and
   template walkers.

Concerns (1), (2), (3) block the Rust port + askama migration. Concerns
(4), (5) improve portability and diagnosability but don't block.

## Forcing Constraint

> "The render engine has to run in a browser, and the template substitution
> has to be expressible in a declarative engine. Neither is possible with
> the current shape."
> — project direction, pre-port planning.

Both constraints are load-bearing: browser execution rules out `node:fs`
at module load; askama rules out threaded mutable consumption state. Both
are pre-existing architectural decisions surfacing as blockers now that
the port is on the horizon.

## Alternatives Considered

- **Ship the Rust port without touching `@sittir/core` first.** Rejected —
  porting a render engine that threads mutable consumption sets through
  recursive template resolution to Rust is a different task than porting
  the rule-based core we want. The TS cleanup is strictly cheaper.

- **Migrate to askama in one step (extract consumption + swap engine at
  once).** Rejected — the extraction (this ADR, Task 3) produces
  byte-identical output and is independently reviewable. Combining with
  engine swap makes regressions impossible to bisect.

- **Keep `variants:` blocks unchanged and fix the `_form_` name mismatch
  in place.** Rejected — 19 of 21 variant blocks across the three
  grammars are dead weight. Fixing names without collapsing the
  identicals leaves template surface bloated and hides the "which rules
  actually branch on variant" signal that matters for the port.

- **Stamp `$variant` on readNode output too (a prior draft of this
  spec).** Deferred — `$variant` only matters to the render engine for
  the three genuinely-variant rules, and for those rules the field-
  presence fallback already picks correctly from readNode's output.
  Separate from the render concern, `$variant` on readNode output is
  useful for type discrimination (`is.*` guards, `.from()` routing), but
  that's a type-system concern that can land independently without
  blocking the port.

## Decision

Land five tasks in `@sittir/core` (+ codegen template emitter for Task 2)
before the Rust port begins. Tasks 1–3 are must-do / blocking; Tasks 4–5
are nice-to-have. Each task lands as an independent commit with
byte-identical render output verified by the round-trip corpus.

### Task 1 — Split template loading from render engine (must-do)

Move `loadTemplates`, `node:fs`, and `yaml` into a new
`packages/core/src/loader.ts`. `render.ts` accepts pre-parsed
`RulesConfig` only. The `createRenderer(yamlPath: string)` string overload
moves to the loader module (callers that want the convenience import from
`@sittir/core/loader` instead of `@sittir/core`). The root re-export can
keep both forms if backward compat is load-bearing; the render engine
itself stays I/O-free.

**Files**: `packages/core/src/render.ts`, new `packages/core/src/loader.ts`,
`packages/core/src/index.ts`.

**Validation**: `grep -c 'node:' packages/core/src/render.ts` returns 0.
All tests pass. Browser import of `render.ts` succeeds (manual check in
a minimal harness).

### Task 2 — Collapse redundant variant template blocks; align `$variant` names (must-do)

Update the codegen template emitter (`packages/codegen/src/emitters/*` —
the template-emitting walker) to detect identical-across-forms and emit a
single template string instead of a `variants:` block:

```yaml
# Current
struct_item:
    variants:
        brace: $VISIBILITY_MODIFIER struct $NAME $TYPE_PARAMETERS $$$CHILDREN
        tuple: $VISIBILITY_MODIFIER struct $NAME $TYPE_PARAMETERS $$$CHILDREN
        unit:  $VISIBILITY_MODIFIER struct $NAME $TYPE_PARAMETERS $$$CHILDREN

# After
struct_item: $VISIBILITY_MODIFIER struct $NAME $TYPE_PARAMETERS $$$CHILDREN
```

Detection rule: all entries in `variants` map to the same string after
trailing-newline normalization → emit as `template:`. Otherwise: keep
`variants:` block.

For the three rules that retain variants, align factory and template on
the **template-side naming** (no `_form_` prefix): factory emits
`$variant: 'external'` matching template key `external`. The
`_form_` prefix in polymorph form names is a codegen-internal convention
and should not leak to the rendered surface. Concretely: at the boundary
where the factory stamps `$variant`, strip a leading `_form_` from the
form name if present.

Once aligned, `resolveTemplate`'s primary dispatch
(`obj.variants[node.$variant]`) succeeds for all variant-branching
factory-produced nodes, and `pickTemplate` becomes a last-resort for
readNode output (which still doesn't stamp `$variant`).

**Files**: template-emitting walker in `packages/codegen/src/`,
factory emitter's `$variant`-stamping call site, regenerated
`packages/{rust,typescript,python}/templates.yaml`.

**Validation**:
- Round-trip corpus ceilings unchanged across all three grammars.
- After regeneration, only the three genuine-variant rules
  (`rust/visibility_modifier`, `typescript/export_statement`,
  `typescript/call_expression`) contain `variants:` blocks in their YAML.
- Factory-produced nodes of those three rules render via primary
  `$variant` dispatch (verified by an assertion hook in the test
  harness — not left as runtime-silent).

### Task 3 — Pre-partition consumed vs. unconsumed children before template rendering (must-do)

Extract consumption logic into a `prepare(node, rule)` step that produces:

```ts
interface PreparedRender {
    readonly fields: Record<string, string>;    // pre-rendered field slots
    readonly children: readonly string[];       // pre-rendered unconsumed named children
    readonly variant: string;                   // node.$variant ?? ''
    readonly text: string;                      // node.$text ?? ''
    readonly trailingSep: boolean;              // flankSep trailing match
    readonly leadingSep: boolean;               // flankSep leading match
}
```

Ordering contract (must preserve current behavior):

1. Clauses resolve first (they may consume children by kind — see
   `renderClause`'s "consume first unconsumed named match").
2. Field slots resolve next (they reference `$fields` only, no
   consumption).
3. `$$$CHILDREN` consumes the remainder (named children not yet
   consumed, filtered to named).

Phase 1 (this task): `render(node, ctx)` becomes `render(prepare(node,
rule), ctx.config.rules[node.$type])`. The regex substitutor stays; its
input is now a pre-materialized bag. Output is byte-identical to the
current engine on every corpus node.

Phase 2 (future, separate ADR / spec): `PreparedRender` feeds an askama
/ Nunjucks template engine directly. Templates migrate from sittir's
`$VAR` syntax to the target engine's syntax. Out of scope here.

**Files**: `packages/core/src/render.ts`; new `packages/core/src/prepare.ts`
if the logic is large enough to warrant splitting.

**Validation**: byte-identical render output for every node in the
round-trip corpus across all three grammars. No test changes; snapshot
diffs of render output must be empty.

### Task 4 — Extract readNode field-placement algorithm (nice-to-have)

Pull the tree-sitter-independent placement logic out of
`readNode.ts`:

```ts
// Pure function: tree-sitter independent
interface ChildInfo {
    readonly kind: string;
    readonly fieldName: string | undefined;
    readonly text: string;
    readonly named: boolean;
    readonly node: AnyNodeData;   // already read recursively
}

function placeChildren(
    children: readonly ChildInfo[],
    parentKind: string,
): { fields: Record<string, AnyNodeData | AnyNodeData[]>; children: AnyNodeData[] };
```

`readNode` becomes: (a) walk tree-sitter, collecting `ChildInfo[]`, (b)
call `placeChildren`, (c) wrap result. The Rust port reimplements (a)
against `tree-sitter-rust`'s API and reuses (b) conceptually.

**Files**: `packages/core/src/readNode.ts`, new
`packages/core/src/placeChildren.ts`.

**Validation**: byte-identical readNode output for every corpus file.
Unit tests exercise `placeChildren` with mock `ChildInfo[]`.

### Task 5 — Keyword promotion scope investigation (nice-to-have)

Audit which promoted-keyword fields (output of `promoteAnonymousKeyword`)
are actually referenced by either (a) a template placeholder, or (b) a
user-code consumer. If the set is small and stable per grammar, codegen
can emit a per-grammar allowlist and readNode gates promotion on it;
otherwise keep blanket promotion and document the convention.

**Files**: audit lives in scratch / plan notes; if allowlist is the
outcome, changes touch the codegen keyword-classifier and
`packages/core/src/readNode.ts`.

**Validation**: audit report lists every promoted key per grammar and
its consumption status. Decision and rationale captured in a follow-up
ADR if allowlist-gating is adopted.

## Principles Applied

- **P-001 (Generated code is derived, not authored)** — Task 2's
  identical-variant collapse fixes the codegen emitter, not the generated
  YAML. The three genuinely-variant rules remain because the grammar
  *says* they branch; codegen reflects that faithfully.
- **P-005 (Single source of truth)** — `$variant` naming has one source
  (the form name stripped of codegen prefixes); factory output and
  template keys both derive from it.
- **P-007 (Cut speculative scope)** — 19 of 21 `variants:` blocks are
  dead weight. Remove them. The field-presence fallback in
  `pickTemplate` becomes a last-resort, not a hot-path crutch.
- **P-008 (Composition over configuration)** — `prepare()` materializes a
  finished bag; the renderer is a pure function over that bag.
  Declarative engines compose over it without reaching back into
  tree-sitter types or mutable state.

## Consequences

- **Enables**:
  - Browser preview tooling can import `render.ts` without a bundler
    shim for `node:fs`.
  - Rust port reads a stabilized algorithm for field placement (Task 4)
    and a pre-materialized render context (Task 3) — straight-line
    translation, no TS-specific mutable-state plumbing to replicate.
  - Askama / Nunjucks migration becomes a templates-only change (engine
    swap) — the algorithmic work is in `prepare()`, not the substitutor.
  - Template surface shrinks dramatically: 19 fewer `variants:` blocks
    across the three grammars. Reviewing a polymorph rule in YAML is
    now "is there a single template" in almost every case.

- **Costs**:
  - One churn-heavy commit regenerating all three `templates.yaml`
    files after Task 2. Diff is mechanical (variant-block → single
    template) but large.
  - `prepare()` extraction must replicate clause-consumption order
    exactly; bugs here produce subtly-wrong render output that passes
    the single-file case but breaks corpus round-trip. Snapshot-diff
    the whole corpus before landing.
  - `createRenderer(yamlPath)` string overload moves module. One-line
    import change for downstream consumers (acceptable; the project has
    no external consumers today).

- **Follow-ups**:
  - `$variant` on readNode output (type-discrimination win for
    `.from()` and `is.*`). Separate ADR; not a blocker.
  - Askama / Nunjucks engine migration spec. Separate ADR; depends on
    Task 3 landing first.
  - Keyword-promotion allowlist (Task 5 investigation outcome).
  - Consumption-order preservation in `prepare()` deserves a unit-test
    harness that exercises the three tricky cases identified during
    implementation: (a) clause consumes a child that `$$$CHILDREN`
    would otherwise emit, (b) flankSep probes adjacency after
    consumption, (c) field-to-child promotion (`resolveSlot` step 4a).

## Verification

1. **Task 1** — `packages/core/src/render.ts` contains zero `node:*`
   imports. Browser harness imports the module without a bundler shim.
2. **Task 2** — every `templates.yaml` contains `variants:` only for
   `rust/visibility_modifier`, `typescript/export_statement`,
   `typescript/call_expression`. Factory-produced nodes of those three
   rules dispatch via `obj.variants[node.$variant]` (primary path);
   verified by an assertion hook in the render test harness.
3. **Task 3** — `vitest --run` passes with byte-identical render output
   on every corpus node across all three grammars. `prepare()` has unit
   tests for the three consumption-order cases.
4. **Task 4** — `placeChildren` is a pure function with unit tests using
   mock `ChildInfo[]`. readNode output is byte-identical to pre-refactor.
5. **Task 5** — audit report committed to `docs/audits/` or equivalent;
   decision captured in a follow-up ADR if scope warrants.

## Implementation tracking

- [ ] Task 1 — split loader (`packages/core/src/loader.ts`)
- [ ] Task 2 — codegen emitter: identical-variant collapse + `$variant`
      name alignment; regenerate all three `templates.yaml`
- [ ] Task 3 — `prepare()` extraction; byte-identical round-trip
- [ ] Task 4 — `placeChildren` extraction (optional, pre-port)
- [ ] Task 5 — keyword-promotion audit (optional, pre-port)

## Ordering rationale

1 → 2 → 3 → 4 → 5.

- Task 1 is smallest and independently valuable; landing it first lets
  the rest of the work assume a browser-safe render module.
- Task 2 before Task 3 because it simplifies the template surface that
  `prepare()` operates on. After Task 2, `resolveTemplate`'s variant
  logic matters for only three rules; the field-presence fallback
  becomes a last-resort safety net. Extracting `prepare()` on top of
  that shape is much cleaner than on top of the current
  "identical-variants-with-broken-names" surface.
- Task 3 is the largest and gates askama migration; do it last among
  the blockers.
- Tasks 4 and 5 are independently-landable and can slot in anywhere
  after Task 1.
