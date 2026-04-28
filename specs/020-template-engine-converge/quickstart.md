# Quickstart: Render Pipeline Optimization (020)

## Overview

Feature 020 has two jobs:

1. finish any remaining baseline convergence owned by 020 (single canonical template source, centralized native render crates, one regenerate workflow), and
2. optimize native rendering in two full-grammar stages:
   - **Level 1**: borrow from `TemplateContext` instead of cloning;
   - **Level 3**: render directly from `NodeData` and retire the preparation layer after parity proof.

The feature is complete only when `rust`, `typescript`, and `python` have all landed the relevant level.

## 1. Confirm baseline before optimization

From the repo root:

```bash
pnpm -r run type-check
pnpm test
```

Verify the retained baseline obligations are satisfied or plan to finish them inside 020 before Level 1:

- canonical `.jinja` templates live only under `packages/{lang}/templates/`
- native render crates live under `rust/crates/sittir-render-{lang}/`
- the standard `--all` workflow refreshes both TS and native artifacts

## 2. Regenerate all supported grammars from one workflow

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

Use these same commands after each major generator/runtime change so the three grammars move together.

## 3. Implement Level 1 across all grammars

Target areas:

- `packages/codegen/src/emitters/rust-render.ts`
- any shared emitter helpers that populate generated Askama structs
- centralized native render crates under `rust/crates/sittir-render-{lang}/`

Acceptance target:

- generated Askama structs/dispatchers borrow template-backed scalar/list/child/text/variant values from `TemplateContext`
- canonical `.jinja` files remain unchanged
- no grammar ships a cloned-value path once Level 1 is merged

Re-run:

```bash
pnpm -r run type-check
pnpm test
```

## 4. Implement Level 3 in staged steps, then switch all grammars together

Recommended implementation sequence:

1. add shared direct-render resolve helpers
2. emit per-kind direct-render functions beside the current path
3. switch dispatch to the direct path
4. prove parity on both backends
5. remove `TemplateContext` preparation/runtime-metadata bridge from the runtime path

Do **not** treat one grammar as "done early" in the merged branch. Temporary mixed-mode development is fine while proving parity locally, but the committed feature state must move all three grammars together.

## 5. Validate cleanup before merge

Before marking Level 3 complete, verify:

- the direct render path is active for all supported grammars
- the legacy `prepare.rs` bridge is gone and `sittir-core` no longer exports it
- parity remains byte-identical for representative formatted and unformatted fixtures
- docs/examples still point to canonical templates and centralized native render crates

Run the standard validation suite again:

```bash
pnpm -r run type-check
pnpm test
```

## 6. Update AI agent context

After the plan/design artifacts are in place, refresh agent context from the repo root:

```bash
.specify/scripts/bash/update-agent-context.sh codex
```

This keeps the active agent instructions aligned with the feature's current design artifacts.
