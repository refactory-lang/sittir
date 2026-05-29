---
name: block-edit-generated-artifacts
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: 'packages/(rust|python|typescript)/(src/|templates/.*\.jinja$|\.sittir/|factory-map\.json5$|overrides\.suggested\.ts$)|rust/crates/sittir-[^/]+/src/'
action: block
---

🚫 **Refusing to edit a generated artifact** — this file is derived output, not a source.

Hand-editing it will be overwritten on the next regen and diverges from the source of truth. Instead:

1. Fix the codegen — `packages/codegen/src/**` — or the grammar overrides — `packages/<lang>/overrides.ts` (note: `overrides.ts` is editable; `overrides.suggested.ts` is generated).
2. Regenerate: `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <rust|python|typescript> --all --output packages/<lang>/src`

(Editable by design: `packages/codegen/src/**`, `packages/<lang>/overrides.ts`. Blocked: `packages/{rust,python,typescript}/{src,templates/*.jinja,.sittir}`, `factory-map.json5`, `overrides.suggested.ts`, `rust/crates/sittir-*/src/**` — including inside `.claude/worktrees/`.)
