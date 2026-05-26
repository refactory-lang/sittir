# PR-A review fixes — Codex formal review (verdict: fix-then-ship)

> **From:** Codex formal review of PR-A (commits `7a579f4d` + `1e43e87e`) on branch `pr-a-reconcile-new-naming`, 2026-05-26.
> **To:** the PR-A implementer (sittir-codegen / whoever lands the fixes).
> **Verdict:** fix-then-ship. The foundation is sound; three gaps in PR-A's *acceptance contract* must close before merge. Probe output at review time: **rust 0/0, typescript 0/0, python 0 unexpected / 5 allowlisted.**

## Already good — do NOT touch
- `projectSlotNaming`'s `parseNames` derivation (`values.map(v => v.parseKind.name)`) is correct — `parseKind`→`parseNames`. *(Its `storageName` formula is NOT correct — see Fix 4; Codex marked it "matches spec," but the spec it matched was wrong and is now fixed.)*
- The **shared-arm lift** is structurally sound — no dropped `rule.id` / slot-identity on lifted entries.
- `parseKind` derivation in `deriveValuesForRule` draws from the alias target / generated terminal kind — the right source.
- Regen commit `1e43e87e` only mutates the three `generated.manifest.json` hashes — machine-generated, not hand-edited.
- Principles **#1 / #3 / #9** are respected in the touched slot model + emitter code (no second stored identity, no new heuristics/hardcoded maps, emitter access via model getters).

---

## Fix 1 — BLOCKER: the probe omits `parseNames` (the wide-divergence gate is incomplete)

**Where:** `packages/codegen/src/scripts/reconcile-naming.ts:35` — `Divergence['projection']` enumerates `storageName`/`name`/`configKey`/`propertyName`/`paramName` but **not** `parseNames`. `__tests__/reconcile-naming.test.ts:7` explicitly excludes `parseNames` as "not a divergence axis."

**Why it's a blocker (not just a missing axis):** PR-A's entire reason for **front-loading the value→`parseKind` decomposition** (spec §5 PR-A row + §4d.1) was to make `parseNames` reconcilable. Excluding it means the `parseNames` reconciliation was *punted* — `parseNamesNew` is still stored (`node-map.ts:1538`) and unverified, so "0 unexpected divergences" is hollow on the **parse-routing axis** (the load-bearing one for read dispatch). The test-level exclusion converts a spec requirement into dead letter.

**Fix (two parts, in order):**
1. **Do the `parseNames` reconciliation.** `parseNames = values.map(v => v.parseKind.name)`, handling the known over-inclusions that make it diverge today: `semicolon`/`newline` terminals, un-collapsed `public_field_definition_*` variant-forms, `last_match_arm` (see spec §5 PR-A row + §4d.1; the `expandRuntimeDiscriminatorKinds` equivalence does NOT hold).
2. **Add `parseNames` to the probe.** Extend `Divergence['projection']`; compare the arrays with a stable sort; add a failing unit case where legacy and projected `parseNames` diverge, so the axis is provably live (not silently passing).

**Gate restored:** the WIDE probe covers *every* projected name per the PR-A acceptance criteria.

---

## Fix 2 — important: the allowlist is not count-gated

**Where:** `reconcile-naming.ts:56` — `ALLOWLISTED_RENAMES` is keyed on `kind.slot` only (`format_specifier.content`); the `unexpected` filter drops *any* divergence on an allowed `kind.slot`.

**Why:** python's "5 allowlisted" pass without asserting *which* projections diverge, in *which* direction, or *how many*. The plan says "each count-gated." As written, a future regression on an allowlisted `kind/slot` is silently swallowed.

**Fix:** store allowlist entries as **exact expected divergences** (`projection` + `legacy` value + `recomputed` value); assert the divergence set equals the expected set — **count AND values**; fail if either drifts.

---

## Fix 3 — important: `content-collision` (2+ `content` slots on one node → fail) is unimplemented

**Where:** `node-map.ts:807` (`mergeSlotsByName`) + `collect-slots.ts:385` (`baseName = 'content'`).

**Why:** spec §4c (the design call): a *single* `content` slot per node is a sanctioned `warn`; **2+ `content` slots on one node → `fail{content-collision}`** (they'd share the `_content` storage key). The current merge path folds duplicate `content` slots by unioning their values — silently hiding the collision. No `fail{content-collision}` emission exists anywhere in the diff.

**Fix:** in `mergeSlotsByName`, *before* folding a duplicate name: if the incoming name is `'content'` AND an existing `'content'` slot is already present on the node → emit `fail{content-collision}` (and skip the silent merge).

---

## Fix 4 — important (spec-originated): `storageName` derives from the wrong kind

**Where:** `projectSlotNaming` (`node-map.ts`) — `storageName = fieldName ?? parseKind.name ?? 'content'`.

**Why:** the two name-projections are parallel and must NOT cross — **`storageKind` → `storageName`, `parseKind` → `parseNames`**. `storageName` must derive from the **render/source kind** (`value.kind.name` = the `storageKind` — what the value is stored as, keyed via `drillAs`), NOT `parseKind`. This was a **spec error** (the PR-A row + §2 told you `parseKind`); the spec is now corrected. For `_suite`, the storage-kind union `{_simple_statements, block, _newline}` is multi → `storageName` should be `content`, not `block` (`block` is the *parseName*).

**Fix:** `storageName = fieldName ?? (single render/source kind, `value.kind.name`) ?? 'content'`. Leave `parseNames` (`parseKind`) as-is.

---

## Verification (after the fixes)
- The probe **covers `parseNames`** and reaches **0 unexpected divergences** (+ the now-count-gated allowlist) across rust / python / typescript.
- A node with 2+ `content` slots emits `fail{content-collision}` (add/confirm a test).
- **`pnpm validate:native`** holds-or-improves the baseline for all 3 grammars (NOT raw `counts` — stale `.node` masks regressions).
- Then: `sittir-review` runs the DRY / design-conformance pass on the updated PR-A (the dimension Codex was lighter on — esp. whether `projectSlotNaming` / `liftSharedArmAttrs` duplicate existing helpers).

## Provenance
Codex formal review, 2026-05-26 (read-only, scoped to `git diff origin/master..HEAD -- packages/`). This handoff packages its three actionable findings; the full review also confirmed the items in "Already good" above.
