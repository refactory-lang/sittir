# Handoff — CI type-check: hand-written and generated tests are green; the example files are the remaining red

Paste from the `---` line down.

---

Follow-on to the leaf/keyword namespace surface (PR #263, `feat/leaf-namespaces`)
and the enum-leaf discriminant fix (PR #264, `fix/enum-leaf-discriminant`,
stacked on #263). Read [docs/compiler-phase-glossary.md](../../compiler-phase-glossary.md)
first. Session memory: `get_latest_session`.

## Where the stack stands

| PR | branch | contents |
| --- | --- | --- |
| #263 | `feat/leaf-namespaces` | leaf namespaces (`LeafNs`), keyword namespaces (`KeywordNs`), guards accept ids, `Fluent`→`Built`, Built ownership inverted into `types.ts` (`X.Built` interface, `X.BuildArgs`, `X.LooseArgs`) |
| #264 | `fix/enum-leaf-discriminant` | a leaf with its own parser symbol keeps its own id as `$type` (member union only for synthesized enums); plus this session's type-check work |

Merge order: #263 then #264. The CI "Type check" step is baseline-red on
master; after #264 the only red is the example files (below).

## What this session landed on #264

The CI type-check census (rust 31 / typescript 8 / python 5 errors) split
into four classes. All four are fixed at their root:

1. **Parsed root's static type lacked `$span`/`$text`.** The reader always
   stamps both on a whole-source parse's root (optional on every other read
   node). Typed at the source: `@sittir/common`'s `ParseAndReadResult.root` is
   `TRoot & ParsedRoot`; `wrapNode`'s typed overload keeps whichever of those
   members its input declares (the wrap spreads its data); the root alias
   (`SourceFileTree`/`ProgramTree`/`ModuleTree`) is the wrap row `& ParsedRoot`.
   `engine.parse()` reaches the alias with no cast.
2. **Accessor results on id-bearing unions.** `file.statements()` yields
   nodes *and* ids (user ruling: keyword kinds are ids everywhere). The rust
   `tree-identity-and-verbatim` test narrows through a `render()` helper.
3. **Convergence tests' obsolete case.** "A kind the parser issues no id for
   takes no namespace entry" pinned string-`$type` synthesized kinds that no
   longer exist. Removed in all three packages.
4. **Generated `nodes.test.ts` (python ×3).** The test emitter's list-child
   argument prepended `{}` (the options bag) for the hoisted call position,
   whose parameter surface is the coercer's single input. `childBareCallArgs`
   now emits the element alone; the options overload was never part of that
   surface.

One more, found while classifying the example errors: `emitKindIdFactory`
now writes the return type out (`export function buildPassStatement(): TSKindId.PassStatement`).
An inferred enum-member return widens to the whole enum, which is why
`ir.passStatement()` was not assignable to a statement slot.

Gate results at commit time: all three package builds clean; codegen vitest
fails the same 15 tests as HEAD (roundtrip/baseline-diff/strict-terminal/
generate/render-module-emit — pre-existing fixture drift); package tests for
the touched files pass; `built-delta-probe` 0 mismatches ×3; validate history
unchanged (numbers in the commit message).

## The remaining red: example files (product gaps, not test debt)

These are the exhibits the dogfood examples deliberately document. Each is a
surface gap; fix the generator, then delete the GAP comment in the example.

**rust `examples/17-dogfood-rust.ts` (18)**

| gap | sites | shape |
| --- | --- | --- |
| tagged config rejected | 40, 155, 165, 183, 200, 211, 287 | `{ kind: 'x', … }` object literal on a polymorph slot: the loose config union has no `kind`-discriminated member |
| string shorthand rejected | 158, 249, 255×2 (`TypeArgument`), 288, 292 (`AttributedArgument`), 140, 229 (impl trait clause) | a plain string does not widen into these single-content wrapper kinds |
| `Built` rejected where a node is expected | 142, 231 (`ImplItemBody`), 271 (`() => Expression \| undefined`) | a built node is not assignable to the slot's `Loose` union / an accessor thunk type leaks into the config surface |

**typescript `examples/18-dogfood-typescript*.ts` (5)**

- 57, 76: config key is `expressions` (pluralized array slot) where the
  example writes `expression` on `ReturnStatement`/`ExpressionStatement` —
  decide whether the singular is a product promise or the example is wrong.
- 86 ×2: `Built` nodes not assignable to the `program.statements` element
  union (same class as rust 142/231).
- strict 25: `.identifier.identifier` on the strict surface is not callable.

**python `examples/19-dogfood-python*.ts` (2)**

- 47: `ir.passStatement()` in `module({ statements })` — the id is typed
  correctly (`TSKindId.PassStatement`, verified through `@sittir/python`); the
  slot is `SimpleStatements | CompoundStatement`, and a bare `pass` is not a
  member of either. The example's premise ("`pass` is one of the few
  statements the list does admit") is stale: it must be wrapped in
  `ir.simpleStatements(...)`, or the surface must admit it — decide which.
- strict 21: `ir.module.strict({})` rejects `{}` (GAP D: strict rejects the
  statement values the coercer accepts).

Suggested order: the `Built`-vs-slot-union class first (it recurs across
rust and typescript and is likely one `LooseValue`/`WidenValue` rule), then
string shorthand, then tagged config, then the typescript key question.

## Gotchas (all bitten this session)

- `@sittir/common/engine` resolves to `engine-boundary.ts`, not `engine.ts`.
  A type added to `engine.ts` but not re-exported there imports as `any`
  silently — the symptom was four fresh errors in `examples/09-type-guards.ts`
  because `SourceFileTree & any` collapsed to `any`.
- Rebuild `packages/common` / `packages/types` dist (`pnpm -C packages/<p> run build`)
  after editing them; per-package `tsc -p tsconfig.build.json` resolves dist.
- Regenerate with `--tests-dir packages/<g>/tests` or `nodes.test.ts` goes stale.
- vitest in `packages/python` rewrites `.sittir/grammar.js`; regenerate python
  before committing or the manifest ratchet rejects the commit.
- Commit by pathspec only. Never `TODO.md`, `packages/tools/validation-report.json`,
  `examples/01-construct-nodes.ts` (pre-existing dirty), the untracked `*-roles.scm`
  and the older handoffs in the tree.
- Principle #14 ratchet: model helpers take `(target, ctx: *Ctx)`.
- Hook: `mcp__infigraph__generate_test_context` before editing a test with Edit;
  Bash-driven edits (python heredoc) do not trigger it.

## Prompt for the next session

> Read `docs/superpowers/handoffs/2026-09-02-type-check-tests-green-example-gaps-handoff.md`
> and `get_latest_session`. PR #263 and #264 are open and stacked; check
> whether either merged. Then take the example-file gaps in the suggested
> order, one class per commit on a branch stacked on #264: fix the generator
> at the root (types emitter / `@sittir/types` `WidenValue`), regenerate all
> three grammars with `--tests-dir`, run the three-way gate (per-package
> build, `validate history`, codegen vitest names vs HEAD), delete the GAP
> comment in the example, commit by pathspec.
