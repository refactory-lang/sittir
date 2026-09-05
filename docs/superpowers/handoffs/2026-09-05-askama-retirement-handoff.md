# Handoff — askama retirement (start of work)

Branch `spec/render-options` (PR #269), HEAD `d74768f02`. Working tree clean apart from pre-existing untracked files (handoffs, `*-roles.scm`, `sittir-role-interfaces-scm-spec.md`, `packages/types/.vitest-report.json`, `examples/01-construct-nodes.ts`) — never stage those.

## Where the render options work stands

- `17482e755` plan 3 (transport fields, native fill, three-part `Joined`), `9d96cbfe4` separator spacing written into the render rule, `0e152a6a7` defaults declared in `patches:` via `preference()` + slot keys `<slot>_separator_space[_before|_after]`, `d74768f02` array flanks `<kind>_start|_end` with `indent`/`dedent` arms and the depth-tracking `SpacingWriter`.
- Design: `docs/superpowers/specs/2026-09-04-render-options-design.md`. Plans: `docs/superpowers/plans/2026-09-04-render-options-separator-rules.md`, `2026-09-05-render-flanks-indentation.md`, and this one's `2026-09-05-askama-retirement.md`.
- Memory: `project_render_options_design_state.md` in the auto-memory directory has every ruling.

## Rulings that govern the next steps

1. Askama goes next (user, 2026-09-05). Byte-identical renders are the only gate for each task.
2. After that: kind/supertype-level `<kind>_before` / `<kind>_after` seams for any kind including token kinds (`lbrace_before`, `declaration_after`), with a coalescing writer (one pending whitespace per seam, strongest wins: tight < space < newline; indent/dedent always applied; a `blank` arm = two newlines). Literal tokens need the template emitter to read the spaced render rules — Task 2 of the askama plan provides that.
3. Then plan 4 (`engine.ir`, `tree.options()`, `reformat`).

## Facts you would otherwise have to rediscover

- Jinja constructs actually emitted: `{{ x }}`, `{{- x }}`, `{% if x | isPresent %}`, `{% else %}`, `{% endif %}` — nothing else (census over `packages/typescript/templates`).
- `templates.ts::emitRule` is the walk (SEQ / CHOICE / OPTIONAL / literals / static seams / `emitListSlot` → `{{ slot }}`); `emitChoice` produces the if/else chains; `hasFlankSignal` replaced the old join filter selection.
- `render-module.ts`: `templatesRs` emits the askama `#[derive(Template)]` view structs; `render_typed_<kind>` builds the view (`SingleNonterminalView`, `OptionalNonterminalView`, `ListNonterminalView { items, before, token, after, leading, trailing, head, tail }`) from the transport and calls askama's render; `render_transport_dispatch(transport, indent)` wraps the output `String` in `SpacingWriter::new(..).with_indent(indent)`; `renderTransportEntry` is `render_transport_parts(mut transport, table)`.
- Core: `filters.rs` (`Renderable`, `Joined`, views, `PresenceCheck`, `FastWritable` impls — askama-specific), `macros.rs::render_with_trivia` (returns `Result<(), askama::Error>`), `spacing.rs::SpacingWriter` (marks: `ADJACENT` U+FFFE, `INDENT` U+FDD0, `DEDENT` U+FDD1; deferred indentation), `options.rs` (`ResolvedOptions { spacing, delimiter, indent }`, `FillOptions`).
- Python's block indentation is askama's `indent` filter via `templates.ts` (`indentMemberIdx` in the SEQ case, `INDENT` → `{{ "\n" }}`); when askama goes it must move onto the writer marks — python declares no `_indent`/`_dedent` in `visibleExternals` today, so flanks are not injected for python yet.
- Gates and how to run them: `pnpm run validate:native` (regen ×3 + counts; ~10 min) then `tsx packages/cli/src/cli.ts validate history` (rows must equal 01:51 rows of 2026-09-05); `pnpm exec vitest run --root packages/codegen` (124 files green); per-package `pnpm exec vitest run`; `pnpm run type-check`; `rtk cargo test --workspace --exclude sittir-parity-tests` (105 passed). Dogfood: a scratch script imports `examples/17|18|19-dogfood-*.ts` builders and `$render()`s them — current sizes rust 745/2222, ts 569/473, py 203/196 chars; keep the six texts as the byte baseline.
- Manifest gate: generated files must be git-tracked before the manifest is written (`writeManifestForGrammar` filters by `git ls-files`); stage new generated files, then rewrite manifests, then commit. Comment-slop gate rejects docs lines citing task/plan numbers.
- Infigraph's local DB is corrupted (kuzu WAL); shell search needs the sentinel `.infigraph/.search-fallback-allowed` refreshed with the current unix timestamp before each `find`/`grep`.
