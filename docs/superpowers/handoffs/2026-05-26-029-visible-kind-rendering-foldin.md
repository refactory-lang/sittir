# Handoff → `_new`-naming / PR-A: visible kinds must render as references, not inlined bodies

> **From:** branch `029-slot-grouping-diagnostic` (slot-grouping diagnostic + applied `type_arguments`/`type_parameters` visible groups).
> **To:** whoever implements the `_new`-naming reconciliation (PR-A of the compiler-simplification strangler — spec `docs/superpowers/specs/2026-05-22-compiler-simplification-design.md`; draft plan `docs/superpowers/plans/2026-05-25-pr-a-reconcile-new-naming.md`).
> **Why this exists:** applying the `type_arguments`/`type_parameters` visible groups on `029` needed **two narrow patches** to render a visible aliased kind correctly. Both are band-aids for the *same* missing invariant. Replace them with the proper, general fix as part of PR-A — do **not** carry them indefinitely.

## The invariant they encode

A symbol that resolves to a **visible kind** — one with its own `kindId`, its own node in the tree, rendered as its own template (incl. registered `groups:`, which are `_`-prefixed yet visible via `markUserFacing`) — must always stay a **slot reference** in any parent's render body. Its body is **never** inlined into the parent. Inlining is *only* for pure hidden helpers (the kinds `grammar.inline` lists / `inlineRefs` is allowed to expand).

The correct "visible" predicate is therefore **NOT** "lacks a leading `_`". It is "user-facing / has a real `kindId` / is **not** in `grammar.inline`" — the inverse of what `inlineRefs` may expand. Both band-aids below use a *strict subset* of this predicate (`patternReplacementKinds`, the registered-group set) and should be generalized to the real visibility test, ideally the one the `_new` naming derivation already needs.

## Band-aid 1 — `emitSymbol` string-munges `aliasedFrom` (the slot NAME)

**File:** `packages/codegen/src/emitters/templates.ts:1290-1318` (the "Named-alias push-down" block).

```ts
const aliasedFromPre = (rule as ...).aliasedFrom;
const aliasNamedPre  = (rule as ...).aliasNamed;
if (aliasNamedPre === true && aliasedFromPre !== undefined) {
    const slotName = (aliasedFromPre.replace(/^_+/, '') || 'children').toLowerCase();  // _type_argument → type_argument
    ... emit slot ref by slotName ...   // runs BEFORE lookupSlot
}
```

**Why it's a band-aid:** the slot model *already* has the right name — the parent `type_arguments` slot is `name: "type_argument"`, `propertyName: "typeArguments"` (verified in `node-model.json5`). The patch exists only because `lookupSlot` (the next block) returns the **group's own `content` slot** instead of the **parent's `type_argument` slot**, so without the pre-emit guard the template emits `{{ content }}`. The munge happens to reproduce the correct string, but it bypasses the slot model.

**Proper fix:** make `lookupSlot` resolve the parent's slot for an aliased-group symbol reference (so the normal path emits the right name with no special-case). This is squarely the `_new`-naming derivation producing the authoritative slot name; once it does, delete the `1290-1318` block.

## Band-aid 2 — `collectTopLevelAliasBodies` skips only `patternReplacementKinds`

**File:** `packages/codegen/src/compiler/link.ts:532-538` (inside `collectTopLevelAliasBodies`, threaded param `patternReplacementKinds` at `:517`; the inlining itself is `dereferenceTopLevelAliasBody` at `:562`).

```ts
if (patternReplacementKinds && content.type === 'symbol' && patternReplacementKinds.has(content.name)) {
    continue;   // don't inline this visible kind's body into the alias body
}
```

**Why it's a band-aid:** the real rule is "don't inline a symbol whose target is a **visible kind**." `patternReplacementKinds` (registered groups) is just the subset we hit. `dereferenceTopLevelAliasBody` will still wrongly inline *other* visible kinds if an alias body references them.

**Proper fix:** generalize — `dereferenceTopLevelAliasBody` must stop at (keep as a reference) **any** symbol whose target is visible (the predicate above), not expand it. Then the narrow `patternReplacementKinds` check at `:532-538` is subsumed and can be removed.

## Shared root

Both are the same gap: the render/slot path doesn't have a single authoritative "is this target a visible kind, and what is its slot name" answer, so each site improvises (one munges the name, one hard-skips a known set). PR-A's `_new`-naming derivation is meant to be exactly that authoritative source. Implementing it should let **both** band-aids delete, driven by one visibility predicate.

## Verification gate (mandatory)

These are behavior-preserving-or-improving. When you remove either band-aid, the **native** counts must **hold-or-improve** (do NOT trust renderable-only / vitest):

```
SITTIR_INTERNAL_CODEGEN_RUN=1 SITTIR_AUDIT_DERIVE=1 pnpm exec tsx packages/validator/src/cli.ts counts --backend native <grammar>
```
Baseline after `029` (real napi build per crate first — `pnpm -C rust/crates/sittir-<g> run build`, ~20s; reject 0.0s cached no-ops):
- **rust 182 / 134 / 126** (cov / read-render-parse / read-render-parseAstMatch)
- **python 107 / 96 / 74**
- **typescript 174 / 82 / 75**

A regression below these = the generalization inlined something it shouldn't, or vice-versa. The `slot-grouping` diagnostic (now in `simplify.ts`) is a useful cross-check: `type_arguments`/`type_parameters` should stay silent; nothing new should start firing.

## Pointers

- 029 commits: diagnostic `a679b489`→`b608a24b`; applied groups `fc7c77de` (+ `parser.wasm` fixup).
- Slot model truth: `packages/rust/src/node-model.json5` — `type_arguments` slot = `type_argument`; `_type_argument` group's own element slot = `content` (an honest fallback for the unnamed union `_Type|TypeBinding|Lifetime|Literal|Block` — intentionally left, not a target of this fold-in).
- Memory: `project_slot_grouping_diagnostic` (the diagnostic + these band-aids).
