# Feature 011 Follow-up Plan

**Created**: 2026-04-22
**Branch**: `011-jinja-template-migration`
**Status**: Work in progress (some review fixes already applied in uncommitted working tree)

Combines:

1. **Walker refactor** — eliminate the sittir-internal `$VAR` placeholder
   dialect now that Jinja is the authoritative template language.
2. **Review fixes** — 8 critical, 10 important, 11 suggestion items from
   the `/speckit.review.run` pass on this branch.

Items are grouped by task. Items the walker refactor obsoletes are
marked **[OBSOLETED BY T1]** and skipped.

---

## T1: Walker refactor — emit Jinja directly

**Why first**: Obsoletes ~40% of the review findings. Doing review
fixes on the translator layer first wastes effort on code about to be
deleted.

**Architecture change**:

Current flow (two template dialects):

```
AssembledNode walker → sittir "$VAR" template string
  → jinja-translator (6 mapping rules, brace escape, clause inlining)
    → .jinja file body
```

Target flow (one template language):

```
AssembledNode walker → .jinja file body
```

### T1.1: Walker emits Jinja syntax in the template string

**File**: `packages/codegen/src/compiler/template-walker.ts`

- [ ] Change `$NAME` emission (line 608 slot formatter) from
      `` `$${varName}` `` to `` `{{ ${varName.toLowerCase()} }}` ``; same for
      `$$$NAME` → `{{ name }}` (pre-joined in TemplateContext).
- [ ] `$$$CHILDREN` (lines 709, 751) → `{{ children }}`.
- [ ] `$TEXT` sites → `{{ text }}`.
- [ ] `$NEWLINE` → literal `\n`.
- [ ] `$INDENT` / `$DEDENT` → empty string.
- [ ] Delete `TEMPLATE_WORD.test(next) || next === '$'` heuristics in
      `needsSpace` (line 1029, 1034) — the Jinja emission is no longer
      `$`-prefixed.
- [ ] Update `repeatedFields` tracker comments / variable names to
      reference Jinja placeholders.

### T1.2: Clauses inline at reference site

**File**: `packages/codegen/src/compiler/template-walker.ts` (and
`AssembledNode.renderTemplate` callers).

Currently: walker emits `$X_CLAUSE` in template + captures body
separately in a `clauses: Record<string, string>` map; the translator
stitches them back together.

Target: walker emits `{% if x %}body{% endif %}` directly at the
reference site. Drop the `clauses` record from `WalkResult`.

- [ ] `liftChoiceBranchesToClauses` and `extractClauseBranch`
      (lines 814, 858) — change them to produce `{% if x %}<translated body>{% endif %}`
      strings instead of `$X_CLAUSE` markers + body entries.
- [ ] `WalkResult.clauses` field removed.
- [ ] `AssembledBranch.renderTemplate` / `AssembledContainer.renderTemplate`
      / `AssembledGroup.renderTemplate` no longer merge clauses into the
      entry object.

### T1.3: Polymorph variant branching inline

**File**: `packages/codegen/src/compiler/node-map.ts`

Currently: `AssembledPolymorph.renderTemplate` returns
`{ variants: { alpha: "...", beta: "..." } }`; translator builds the
`{% if variant == "alpha" %}...{% endif %}` chain.

Target: `AssembledPolymorph.renderTemplate` returns
`{ template: "{% if variant == \"alpha\" %}...{% endif %}" }` directly
when forms differ; keeps the existing collapsed-single-template path
as-is (it was already one string).

- [ ] Update `AssembledPolymorph.renderTemplate` to emit the variant
      chain in the template string.
- [ ] `{% if variant == "form" %}` uses no whitespace-control markers
      (match current translator output; FR-017 space absorption handles
      empty cases).

### T1.4: Emitter consumes walker output directly

**File**: `packages/codegen/src/emitters/templates.ts`

- [ ] `emitJinjaTemplates` reads `node.renderTemplate()` → `entry.template`
      and prepends the `@generated` header. No translator call.
- [ ] Drop the `translateToJinja` import.
- [ ] Update the no-file-case logic (leaf / keyword / token / supertype /
      enum / multi / non-polymorph-form group return early with `continue`;
      polymorph-form groups are handled by existing `node.parentKind` check).

### T1.5: Delete the translator module + its tests

- [ ] Delete `packages/codegen/src/emitters/jinja-translator.ts`.
- [ ] Delete `packages/codegen/src/__tests__/jinja-translator.test.ts`.
- [ ] This obsoletes review items: #4 (exhaustive switch), #8
      (brace-escape multi-pass), #11 (as-unknown-as cast), #15 (unused
      clauses), #25 (`$$` / `$_` prefix collapse).

### T1.6: Template coverage adapter simplified

**File**: `packages/codegen/src/validate/template-coverage.ts`

Currently: `jinjaBodyToLegacyRule` reverse-translates Jinja back to
`$VAR` syntax so the existing substring-based checker works.

Target: the checker operates directly on Jinja syntax.
`jinjaBodyToLegacyRule` / `jinjaInterpolationsToLegacy` deleted.

- [ ] Update `checkRule` / supporting helpers to search for
      `{{ name }}`, `{{ name | ...` and `{% if name %}` patterns instead of
      `$NAME`, `$$$NAME`, `$NAME_CLAUSE`.
- [ ] This obsoletes review item #10 (reverse adapter is a second
      source) and fixes #13 (variant-branching regex bug) by removing the
      code entirely.

### T1.7: Corpus byte-identical verification

- [ ] Regenerate all three grammars.
- [ ] Full test suite green at baseline (1415 passing + 1 pre-existing
      `raw_string_literal` failure — or better if T2 fixes it).
- [ ] Spot-check a few `.jinja` files — they should be byte-identical
      or close to byte-identical vs. pre-refactor.

**Commit**: one commit for T1 (walker + emitter) + one for test/file
deletion.

---

## T2: Rendering correctness fixes (review criticals 2, 3, 6, 7)

These are NOT obsoleted by T1 — they're bugs in the render path
(`buildNunjucksTemplateContext`), not the emit path.

### T2.1: Plumb per-rule `joinBy` metadata to the Nunjucks path (#2)

**File**: `packages/core/src/render.ts`,
`packages/codegen/src/emitters/templates.ts`

The issue: `createRenderer(templatesDir)` passes an empty `RulesConfig`,
so `resolveJoinBy` returns `' '` for every multi-valued slot. If the
walker emitted per-rule `{% for x in elements %}{{ x }}{% if not loop.last %},{% endif %}{% endfor %}`
instead, we wouldn't need this at all.

**Option A** (simple): bake joinBy into the template via `{% for %}`
loops when separator != `' '`.

**Option B** (quicker patch): emit a `<grammar>/templates/meta.json`
sidecar with per-kind `{ joinBy, joinByField, joinByLeading, joinByTrailing }`;
load in `createRenderer(templatesDir)`.

**Decision**: Option A. Aligns with T1's "Jinja is self-contained"
direction. After T1 lands, the walker has the full separator info
and can emit the loop directly.

- [ ] `walkRuleForTemplate` — when emitting a multi-valued slot with
      non-default joinBy, emit a `{% for %}` loop with literal separator
      instead of `{{ field }}` pre-joined.
- [ ] TemplateContext still exposes both `children` (pre-joined) and
      `children_list` for the loop path.
- [ ] Per-rule joinByField handled the same way — the `$$$FIELD` slot
      becomes a loop when the field's separator differs from the rule's
      joinBy.

### T2.2: `$TEXT` best-effort fallback restored (#3)

**File**: `packages/core/src/render.ts` (`buildNunjucksTemplateContext`)

Legacy behavior: factory-built nodes with no `$text` concat fields +
children into the `text` slot as a best-effort.

- [ ] When `node.$text` is empty, synthesize `text` from the rendered
      children + fields (skip undefined/null entries). Match the legacy
      `resolveSlot` lines 172-188 logic.
- [ ] This probably fixes the `raw_string_literal` pre-existing test
      failure.

### T2.3: Empty-array guard (#6)

**File**: `packages/core/src/render.ts` (`buildNunjucksTemplateContext`)

Legacy throws when a single-slot field receives `[]`; Jinja path joins
to `''` silently.

- [ ] Before the `.join(fieldJoinBy)` call, if the field is declared
      single-valued (or the emitted template uses `{{ field }}` not a
      `{% for %}` loop), empty-array → throw with rule kind + field name.
- [ ] Mirrors legacy `resolveSlot` lines 242-249.

### T2.4: Anonymous-entry filter divergence (#7)

**File**: `packages/core/src/render.ts` (`buildNunjucksTemplateContext`)

Current code does NOT filter anonymous entries, which preserves
promoted keywords (async/move/unsafe) but incorrectly inlines promoted
separator tokens into multi-valued field join output (`a,,b,,c`).

- [ ] Filter semantics per field-name: if the field name matches a
      single-token-like keyword (identifier-shaped), keep the anon entry.
      If it looks like a separator (punctuation), filter it.
- [ ] Alternative: check against the grammar's declared field set —
      fields declared in the grammar keep anon entries; promoted
      anon-text-as-field-name keys (commas, etc.) get filtered from
      multi-valued joins.
- [ ] Add a unit test with a synthetic node exercising both cases.

---

## T3: Type-design fixes (review important 16, 17, 18, 26)

### T3.1: Export `NunjucksEnvLike`, drop `unknown` from `RendererOptions` (#16)

**File**: `packages/core/src/render.ts`

- [ ] `export interface NunjucksEnvLike`.
- [ ] `RendererOptions.nunjucksEnv?: NunjucksEnvLike` (not `unknown`).
- [ ] Remove the `as NunjucksEnvLike | undefined` cast at use sites.

### T3.2: `PreparedRender` as discriminated union (#17)

**File**: `packages/core/src/render.ts`

- [ ] Change `PreparedRender` from optional-fields shape to:
  ```ts
  type PreparedRender =
  	| { kind: 'text'; text: string }
  	| {
  			kind: 'template';
  			template: string;
  			substitutions: readonly Substitution[];
  	  };
  ```
- [ ] `applyTemplate` switches on `kind` with exhaustive `assertNever`.
- [ ] Remove the silent `return ''` fallback.
- [ ] `prepare()` constructors return the tagged shape.

### T3.3: `buildNunjucksTemplateContext` returns `TemplateContext` (#18)

**File**: `packages/core/src/render.ts`

- [ ] Change return type from `Record<string, unknown>` to
      `TemplateContext`. Compiler catches misconstruction.
- [ ] Possibly relax the `TemplateContext` index signature to
      `string | readonly string[] | boolean | undefined` so the builder
      typechecks without casts.

### T3.4: Preserve error stack in `renderNunjucks` (#26)

**File**: `packages/core/src/render.ts`

- [ ] Replace `new Error(msg)` with `new Error(msg, { cause: err })`
      at the render wrapper.

---

## T4: DRY / validator hygiene (review important 9, 12; suggestion 28)

### T4.1: Extract shared `deriveRuleKinds` helper (#9)

Four copies exist: `validate/roundtrip.ts`, `validate/factory-roundtrip.ts`,
`validate/renderable.ts`, `validate/template-coverage.ts`.

- [ ] Create `packages/codegen/src/validate/templates-path.ts` exporting
      `deriveRuleKinds(templatesPath: string): Set<string>` and
      `loadRulesFromPath(templatesPath: string): Record<string, TemplateRule>`.
- [ ] Delete the per-validator copies.

### T4.2: Specific `catch` on ENOENT only (#12)

Bare `catch {}` in the four validators swallows EACCES/EMFILE/etc.
After T4.1 this lives in one place.

- [ ] `catch (err: unknown) { if (isNodeError(err) && err.code === 'ENOENT') { return yamlFallback(path) } throw err }`.
- [ ] Add a small `isNodeError` type-guard in the shared module.

### T4.3: Drop `validateFrom`'s unused `templatesPath` param (#28)

**File**: `packages/codegen/src/validate/from.ts`

- [ ] Remove the parameter. Update call sites in
      `corpus-validation.test.ts`, `cli.ts`, `validate-all.test.ts`.

---

## T5: Test hardening (review suggestions 19-24)

After T1 + T2 land, the tests should still pass. These tests lock
invariants that aren't currently asserted directly.

### T5.1: Variant-branching structural fixtures (#19)

**File**: new `packages/codegen/src/__tests__/variant-branching.test.ts`

- [ ] Load each of the 5 genuinely-branching rules' emitted
      `.jinja` files. Assert they contain
      `{% if variant == "<expected_form>" %}` entries for every form the
      grammar declares.

### T5.2: Brace-collision regression test (#20)

**File**: Once T1 lands, this specific case may or may not arise.
Add a fixture test for rust's `block` rule (which triggered the
original brace-collision fix) asserting the emitted `.jinja` renders
via Nunjucks without error.

### T5.3: Space-absorption regex test (#21)

**File**: new `packages/core/tests/space-absorption.test.ts`

- [ ] Template: `"fn $A $B trait"` with `A` and `B` empty → expect
      `"fn trait"` after FR-017 post-pass.

### T5.4: Promoted-keyword preservation (#22)

**File**: `packages/core/tests/nunjucks-render.test.ts` (add case)

- [ ] Synthetic node with `$fields.async: { $named: false, $text: 'async' }`
      plus other named fields → template references `{{ async }}` → output
      contains "async".

### T5.5: Filter inventory check (#23)

**File**: `packages/tools/src/validate/jinja.ts` (extend)

- [ ] Add a scan for filter tokens `| filter`. Reject anything outside
      the approved list (`join`, `length`, `default`, `trim`, `upper`,
      `lower`).

### T5.6: Deprecate the T038 dual-outcome test (#24)

Already done in the uncommitted tree — T038 split into two tests
asserting concrete contracts.

---

## T6: Already-applied quick wins (in uncommitted tree)

These are fixed in the current working tree and just need to commit:

- [x] #1 / #24: `throwOnUndefined` docstring reconciled with behavior;
      T038 split into two targeted tests.
- [x] #5: CI regex per-file `lastIndex` state fix.
- [x] #27: CLI "Done!" log updated (`templates.yaml` → `templates/*.jinja`).

---

## T7: Obsolete after T1 (just listed for traceability)

These review findings evaporate once the walker refactor lands:

- #4 Translator switch not exhaustive (translator deleted)
- #8 `escapeJinjaBraceCollisions` single-pass (function deleted)
- #10 Reverse Jinja→legacy adapter is a second source (deleted)
- #11 `as unknown as` cast on `AssembledGroup` (deleted)
- #13 `tokenShapedFallback` hiding bugs — partial; fallback stays but
  its bug-hiding risk is acceptable given T2.2's restored `$TEXT`
  best-effort synthesis (nodes with real templates won't reach it).
- #14 `escapeJinjaBraceCollisions` test coverage (function deleted)
- #15 Unused clauses silent-drop (clause emission folds into walker)
- #25 `$$` / `$_` prefix collapse (prefixes no longer emitted)

---

## T8: Defer / skip

- #7 Anonymous-entry filter divergence — addressed in T2.4; NOT
  obsoleted by T1 (render-path concern, not emit-path).
- #23 Filter inventory check — in T5.5; nice-to-have lint.
- Suggestion #28 empty directory produces empty set — acceptable
  signal at current state; if it becomes noisy, add in a follow-up.

---

## Sequence

1. **Commit current quick wins** (T6 items in working tree).
2. **T1**: walker refactor (one or two focused commits).
3. **T2**: rendering correctness fixes.
4. **T3**: type-design fixes.
5. **T4**: DRY / validator cleanup.
6. **T5**: test hardening.
7. **Re-run `/speckit.review.run`** to confirm fixes land and no new
   regressions introduced.
8. **Tag** `011-jinja-migration-complete` after re-review passes.

---

## Risk assessment

- **T1 (walker refactor)**: medium-high risk. Byte-identical output is
  the gate. If the walker's emission doesn't exactly replicate what
  `translateToJinja` produces today, corpus tests fail. Mitigation:
  diff the emitted `.jinja` files before/after, spot-check visually,
  rely on corpus-validation ceilings.
- **T2 (render correctness)**: medium risk. The `$TEXT` synthesis and
  joinBy plumbing change real render output. Mitigation: the pre-
  existing `raw_string_literal` failure gives us a regression target.
- **T3 (type design)**: low risk. Compiler-guided refactors.
- **T4 (DRY)**: low risk. Mechanical consolidation.
- **T5 (test hardening)**: low risk. New tests only lock existing
  behavior.
