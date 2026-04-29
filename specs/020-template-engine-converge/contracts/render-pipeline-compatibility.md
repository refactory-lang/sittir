# Contract: Render Pipeline Compatibility (020)

## Purpose

Define the observable compatibility boundaries that 020 must preserve while finishing baseline convergence and implementing Level 1 + Level 3 native render optimizations.

## Stable External/Observable Surfaces

| Surface | Contract |
| --- | --- |
| Canonical templates | `packages/{lang}/templates/` remains the only authored `.jinja` source for each grammar. |
| Native crate location | Generated Askama render modules live under `rust/crates/sittir-{lang}/src/render`; grammar-owned N-API entrypoints, tree-sitter bindings, template hashes, and backend adapters live under `rust/crates/sittir-{lang}` and own the native package boundary. |
| Regenerate workflow | `npx tsx packages/codegen/src/cli.ts --grammar X --all --output packages/X/src` remains the standard artifact refresh path. |
| Public native render boundary | The native render entry remains `render(node_json) -> String`; no public N-API signature change is introduced by this feature. |
| Template engine choice | Askama remains the native template engine and canonical `.jinja` files remain the authored template format. |
| Output correctness | Rendered output must remain byte-identical to pre-change behavior for accepted parity fixtures on both backends. |

## Level 1 Compatibility Requirements

1. Generated Askama structs may change field ownership (`owned` -> `borrowed`) internally, but template field names and template usage remain unchanged.
2. Native dispatch construction must stop copying template-backed scalar/list values out of the existing render-time context.
3. Existing canonical templates and current native filters must keep working without authored template edits.
4. All three grammars must complete the Level 1 generated-surface change before Level 1 is considered complete.

## Level 3 Compatibility Requirements

1. Template-backed kinds render through generated per-kind direct render functions that consume `NodeData` directly.
2. Direct-render helpers must preserve:
   - leaf short-circuiting,
   - structured field recursion,
   - repeated-field join semantics,
   - children separator/flank behavior,
   - variant routing,
   - current format-aware render output.
3. Non-template or leaf-only kinds must preserve existing text/fallback semantics.
4. `TemplateContext` and related preparation/filter infrastructure may only be removed after parity proves the direct path equivalent across all supported grammars.
5. All three grammars must complete the Level 3 direct-render path before Level 3 is considered complete.

## Evidence Required Before Cleanup

| Stage | Required Evidence |
| --- | --- |
| Baseline convergence complete | Canonical template directory, grammar-owned native crate paths, and standard regenerate workflow are all in place. |
| Level 1 complete | Regenerated native render modules show borrowed Askama views; parity remains byte-identical on both backends. |
| Level 3 dispatch switch | Generated direct-render functions are active and parity remains byte-identical for representative proof cases. |
| Level 3 cleanup | Full supported-grammar parity re-proof plus removal of obsolete preparation/filter path from the runtime flow. |

## Explicit Non-Contracts

- This feature does **not** promise a new benchmark harness or public performance API.
- This feature does **not** eliminate Askama.
- This feature does **not** change canonical `.jinja` authoring to a backend-specific template dialect.
- This feature does **not** introduce grammar-by-grammar merged end states for Level 1 or Level 3.
