# 013 — Next Session Prompt

**Goal:** complete Phase 2 walker shrink. Audit is now fully clean across all three grammars; the walker can safely assume canonical input.

## Context

Spec 013 Phase 1 done + Phase 2 pipeline + cascaded variant adoption + inline fix for `public_field_definition` all landed this session. Audit fully drained (7 → 0 flags). Corpus floors: 6 failures (1 less than baseline — ts factory round-trip test now passes).

## Session Log

**Landed this session**:
- Infra (A) — compose polymorphs onto hidden-rule parents (commit `be602c05`).
- Infra (B) — `applyPath` descends through `alias` (commit `c5d121c2`).
- `_export_statement_default` multi-level cascade (commit `23ce9640`).
- `class_body` + `_for_header` multi-level cascade (commit `3d2ba8aa`).
- `public_field_definition` resolved via `inline:` (commit `df8a8fa3`).
- Spread-syntax cleanup in all three grammars' `conflicts:` callbacks (commit `3840e9f1`).

**Key discovery**: tree-sitter's `inline:` is the right tool when a variant's body reduces to "just a shared prefix" and conflicts unrecoverably with sibling rules that share that prefix. Inlining folds the body back into the parent's LR state machine (pre-split states restored), while the alias wrapper survives so the parse tree still emits the named variant kind. `public_field_definition`'s `access_first` arm was the test case — tree-sitter's suggested per-rule-precedence fix would have bled into unrelated rules.

**Experiments NOT adopted** (kept the "tried and reverted" info for future reference):
- Auto-inlining every polymorph-synthesized variant wire-side — some transform-based variants wrap token rules that tree-sitter refuses to inline (rust's `line_comment` variants).
- Moving ALL typescript variant conflicts (`_for_header_*`, `_export_statement_default_*`, `_class_body_*`) from `conflicts:` to `inline:` — tree-sitter accepts the build but 1 corpus round-trip drops and the typescript factory round-trip starts failing. The cascaded variants have tree-output sensitivity to alias-boundary handling that inline subtly changes. Only `public_field_definition` adopted inline.

## Remaining Work — Phase 2 Walker Shrink

Audit is clean. Phase 2 is ready to land:

1. **Flip `DERIVE_AUDIT_MODE` default to `strict`** in `packages/codegen/src/compiler/node-map.ts:230`. This changes the `"off"` default to `"strict"` — any non-canonical shape reaching the walker will throw at codegen time (currently only logs in `"report"` mode).

2. **Shrink `deriveFields` / `deriveChildren`** to the 4-line target from `plan.md` lines 135-149. Specifically:
   - Delete `deriveFieldsRaw`'s `case 'choice'` per-branch+downgrade logic.
   - Delete `walkForChildren`'s same.
   - Delete `toOptionalMultiplicity`.
   - Delete `deriveFields`'s merge loop.
   - Verify python `commaSep` still works (the lift path produces a repeat1 that should pass canonical classification).

3. **Add a `## Delivered` section to `plan.md`** summarizing the work.

## Starting Command

```bash
cd /Users/pmouli/GitHub.nosync/refactory-lang/sittir
git log --oneline -20 | grep "013:"
SITTIR_AUDIT_DERIVE=1 npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src 2>&1 | tail -3
SITTIR_AUDIT_DERIVE=1 npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src 2>&1 | tail -3
SITTIR_AUDIT_DERIVE=1 npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src 2>&1 | tail -3
# All three should show no `non-canonical shapes reaching derivation` output.
```

## Probe Tool

If needed — trivial to recreate, don't commit:

```ts
// packages/codegen/src/scripts/probe-rule.ts
import { evaluate } from '../compiler/evaluate.ts'
import { resolveOverridesPath } from '../compiler/resolve-grammar.ts'
const raw = await evaluate(resolveOverridesPath(process.argv[2]))
console.log(JSON.stringify(raw.rules[process.argv[3]], (k, v) => k === '_ref' ? undefined : v, 2))
```
