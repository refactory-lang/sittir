# Handoff — the last example gap: coercers for polymorph forms, then a declared default arm

Paste from the `---` line down.

---

Follow-on to `2026-09-02-example-gaps-bare-input-handoff.md` (classes 1–7,
all landed on PR #265 `fix/example-surface-gaps`, stacked on #264 → #263).
Read [docs/compiler-phase-glossary.md](../../compiler-phase-glossary.md)
first. Session memory: `get_latest_session`.

## Where the stack stands

| PR | branch | head | contents |
| --- | --- | --- | --- |
| #263 | `feat/leaf-namespaces` | — | leaf/keyword namespaces, `Built` inverted into `types.ts` |
| #264 | `fix/enum-leaf-discriminant` | `950230ca9` | enum-leaf discriminant; CI type-check test fixes |
| #265 | `fix/example-surface-gaps` | `4f56416b3` | eight commits: bare input on the row, kind-name tags + leaf maps, comments as trivia, two example fixes, typescript `expression` slot, callable `ir.identifier`, bare-kind routing |

Dogfood example type errors: rust 2 · typescript 0 · python 0. The two rust
sites are `examples/17-dogfood-rust.ts` 140 and 229:

```ts
traitClause: 'std::fmt::Display',
```

Every gate is green at `4f56416b3`: builds 0/0/0; `validate counts`
identical for all three grammars (rust 149/149 · 208/208 · 134/137 · 1519;
typescript 145/145 · 193/193 · 112/114 · 1202; python 126/126 · 142/142 ·
115/116 · 1390); codegen vitest fails the same 15 pre-existing tests
(baseline-diff, generate, strict-terminal, render-module-emit, roundtrip);
rust package suite has its 6 known failures (examples-verify 01/17,
read-depth, trivia ×3 exact-whitespace); typescript and python suites fully
green; all three generated `nodes.test.ts` suites pass.

## The ruling (user, 2026-09-02): step 1, then option A

**Step 1 — polymorph forms get a from() coercer.** `_impl_item_positive_clause`
and `_impl_item_negative_clause` are polymorph forms of `impl_item`
(`rules:` override in `packages/rust/grammar.sittir.ts` ~L571–591: each is
`seq([...'!',] field('trait', choice($._type_identifier,
$.scoped_type_identifier, $.generic_type)), 'for')`, aliased into the
`trait_clause` choice as `impl_item_positive_clause` /
`impl_item_negative_clause`). Forms surface only as strict sub-factories on
the parent bundle — `ir.statement.impl.positiveClause.strict(traitNode)` — and
`classifyFromEmission` (`emitters/shared.ts`) answers `'skip-polymorph-form'`
for them, so they have no `.coerce`, no `_fromMap` entry, and nothing can
route a tag or a bare value to them. The same gap is why every form bundle's
coercing half has a STRICT child today (rust `overlays/polymorphs.ts`:
`expressionStatement$withSemi(C.coerceToExpressionStatement,
F.buildExpressionStatementWithSemi)` — the child should be the form's
coercer once it exists). Emit a from() for every polymorph form with a raw
factory; the overlay emitter (`emitters/overlays/*`) then wires
`{ strict, coerce }` for forms the way it does for kinds.

**Option A — a declared default arm.** For a choice whose arms admit the same
bare value (the two clause arms differ only by the leading `!`), the grammar
config names the arm a bare value means. The resolver routes an ambiguous
bare value there; the type admits that arm's bare form, so
`traitClause: 'std::fmt::Display'` type-checks and builds the positive
clause. The negative arm stays reachable by tag
(`{ kind: 'impl_item_negative_clause', trait: … }`) or by
`.negativeClause`. This is a declaration, not an inference: "prefer
overrides over inference" is a standing rule.

## How the pieces fit what already landed (read these before designing)

- `_resolveOne` (emitted by `from.ts::emitResolveOneHelper`) now routes a
  foreign kind — a node, or a number whose kind is stored as its id
  (`_KIND_ID_STORED`) — to the single arm whose bare input admits it
  (`_BARE_ACCEPTS`, emitted by `emitBareRoutingTables`, transitive through
  wrappers and lists) and THROWS when several arms admit it. A bare string
  takes a different route today: `_STRING_CAPABLE_BRANCHES` requires exactly
  one branch kind (`fwd = branchKinds.length === 1 ? … : undefined`). The
  default arm is the tie-break for both routes: when the candidates are
  several and a default is declared among them, take it.
- `_fromMap` is keyed by exactly what `classifyFromEmission` emits
  (`emitFromMapDeclaration`); giving forms a from() puts them in the map
  automatically, and `NodeNs`'s `Kind` row argument (`coercerRowArgs` in
  `emitters/types.ts`) then stamps their grammar name so `TagEachArm` offers
  `{ kind: '_impl_item_positive_clause', … }` bags.
- At the type level a multi-kind slot already offers every member's bare
  slot (`BareArms` in `@sittir/types`), so once the arms are coercer-bearing
  kinds the string is admitted by BOTH arms' bare forms — the type side needs
  nothing for A beyond that; the default only decides the runtime tie.
- `fromBareInput` (`shared.ts`) classifies the arms as `'value'` (single
  `trait` slot, direct/forwarded shape) — check `resolveSingleFieldFactorySlot`
  still returns the slot for a HOISTED form (`classifyFactoryShape` says
  direct/forwarded for hoisted compounds; the from side currently excludes
  polymorph forms before it gets there).

## Where the default is declared — to decide

Nothing in the grammar config carries this yet. Existing config surfaces in
`grammar.sittir.ts`: `transforms` (per-rule path patches, e.g. `field(…)`),
`polymorphs` (arm naming), `rules` (whole-rule overrides), `conflicts`,
`expectTestFailures`. The config types live under `packages/codegen/src/dsl/`
(look for the grammar config interface the evaluate phase reads;
`GrammarRoles` come from the `.scm` roles). Candidates: a per-choice entry
keyed the way `polymorphs` keys arms (`'impl_item': { 'trait_clause':
'impl_item_positive_clause' }`), stamped on the slot in link/assemble as a
`defaultArm` fact, read by `emitBareRoutingTables` (emit a
`_DEFAULT_ARM: Record<slotKey, kind>` or fold it into the per-slot resolver
call's kind lists) and by nothing else — "metadata never drives behavior"
means the stamp is THE fact, consumed once at emit.

## Gates recipe (unchanged)

1. `pnpm -C packages/codegen run type-check`; `pnpm -C packages/types run
   build` if `@sittir/types` changed (and `packages/common` if it changed).
2. Regenerate: `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all
   --output packages/<g>/src --tests-dir packages/<g>/tests --no-workspace-check`
   for all three (the manifest hashes codegen SOURCE inputs — any later edit
   to `packages/codegen/src/**`, including a formatter pass, needs another
   regen or the pre-commit manifest gate refuses).
3. A grammar change (`rules`, `transforms`) also changes the parser and the
   Rust render module: `cd rust/crates/sittir-<g> && pnpm run build` before
   validate or any runtime test.
4. Per package: `tsc -p tsconfig.build.json --noEmit`, `run type-check`
   (examples), `vitest run`. Codegen `vitest run` (15 known). `validate counts`
   then `validate history` — numbers compared, not eyeballed.
5. Codegen vitest and the python suite rewrite `packages/python/.sittir/grammar.js`;
   regenerate python afterwards or the manifest gate fails.
6. Commit by pathspec. Never `TODO.md`, `packages/tools/validation-report.json`,
   `examples/01-construct-nodes.ts`, the untracked `*-roles.scm` /
   `sittir-role-interfaces-scm-spec.md` / older handoffs.

## Gotchas met on this branch

- `git checkout -b … | tail -1` hid a failed branch creation; the validator
  hook auto-commits `chore(validator): record validation run` onto whatever
  branch is current. Verify `git branch --show-current`.
- vitest touches the TRACKED `packages/*/node_modules/.vite/vitest/**/results.json`;
  `git checkout --` them before a `git stash pop`.
- Per-package `run type-check` is incremental and takes seconds; a fast run
  is not a skipped one.
- `oxlint` on `from.ts` has two pre-existing unused-parameter errors (part of
  the 6-error baseline across the touched sources).

## Follow-ups recorded, not done

- `wrapChildrenListHint` (`emitters/types.ts`) duplicates the bare-arm
  admission for direct/forwarded/list kinds; still the only admission for
  spread compounds, whose `emitChildrenFrom` coercer passes input to the
  strict factory unresolved.
- `Visited` guards in `LooseConfigOf` / `LooseOrConfigBag` match
  `$type: infer K extends string` and never fire for numeric ids; `Depth`
  alone bounds that recursion. Reviving them would tighten same-kind nesting.
- `KindOf<T>` is unused inside `@sittir/types` (public export).
- rust `trivia.test.ts` has three pre-existing exact-whitespace expectations
  (`fn main(){  }`) against a renderer that now emits `fn main(){}`.
