# Handoff — strict rebuild from source (2026-09-08)

Branch `feat/strict-rebuild-from-source`, stacked on #272 (`feat/enrich-skip-list-retirement`).
Nothing pushed, no PR open. Sixteen commits from 6c6c3dd42 (4f4f5ef31 = inline-group emitter spelling, ceilings 19/31/10); `git log --oneline master..` lists them.

## What landed, in order

1. **Enum-of-literals leaves are kind-id-stored at the model** (6c6c3dd42 + 7d1584598).
   `AssembledEnum.storage` is `'kindId'`; an enum mints no factory, coercer or `ir`
   entry; its type is the member-id union (`BooleanLiteral = TSKindId.True | TSKindId.False`).
   `ValueStorage` has a member-set arm; `isFixedTextLeaf` is the single-text guard.
   Both transport enum builders order kind-id-stored variants first
   (`kindIdStoredFirst`) — rust aliases the primitive tokens onto `identifier` in
   expression position, so the alias wire-id map lists `u8`'s id under `identifier`
   grammar-wide and the `_type` transport decoded a bare 28 as an empty identifier.
   Spec: `docs/superpowers/specs/2026-09-07-enum-leaf-kind-id-storage-design.md`.
2. **`ir` exposes aliased pattern leaves by `userFacing`** (27f66acd8 + 41ce4d2d8):
   `ir.stringLiteralOpen`, the comment-content patterns, `templateChars`. Hidden
   keywords stay off (value is the id); a hidden pattern whose key keeps its
   underscore stays off. Ratchets: rust 274, typescript 253, python 201.
   The rust strict example spells token trees with `TSKindId.Comma`.
3. **Factory source emitter** (dbbf31ce0, 46916d1c8, 078a32c62, 2fafde12f):
   `sittir tool emit-factory-source --grammar <g> --file <path> [--export name] [--out path]`
   runs the validators' own dispatcher (`buildFactoryNodeFromReference`) with a
   printing factory map (`packages/tools/src/emit/factory-source.ts`).
   `pnpm run gen:examples` writes `examples/{17,18,19}-dogfood-*.generated.ts`;
   `examples/generated-typecheck-ceiling.json` counts their type errors; the
   package `examples-verify` tests hold each to its target's tree as `it.fails`
   naming the open rows; `packages/tools/tests/emit/generated-examples.test.ts`
   checks freshness and the ceiling.
4. **Slot wire keys** (dc4eca738 + 3bbb7b5af + d42e02209): the read stores an
   unnamed slot under the child's kind (`_parameter`); the factory map stamps
   `FactorySlotMeta.wireKeys` (the set the wrap accepts, `collectConcreteStorageKeys`
   moved to `shared.ts`) and each slot's storage class into `node-model.json5`;
   `nodeToConfig` resolves a read key to its slot through them.
5. **`$variant` inference retired** (c9a88bf8d): no generated code reads it;
   the inference, its promotion helpers, the `polymorphVariants` option and its
   chain through the from / factory-render-parse validators are gone.

## Gates at c9a88bf8d

- validate counts: rust 147/147 · 207/207 · 134/137 · 1517/1517; typescript
  143/143 · 193/193 · 112/114 · 1202/1202; python 126/126 · 142/142 · 115/116 · 1390/1390.
  The `from` totals dropped from 149/145 by the enum coercers removed by design.
- Parity fixtures identical to before (rust 1486, typescript 1500, python 1361).
- Six dogfood renders byte-identical (baseline in the session scratchpad; the
  `rust-strict` render changed once, deliberately, when the example was rewritten).
- cargo, scope boundaries, type-check clean. The only failing test anywhere is
  the user's uncommitted `examples/01-construct-nodes.ts` edit (`value: true`).
- Generated-rebuild type errors: rust 19, typescript 31, python 10 (after the emitter began spelling groups inline; the rise is S9's surface).

## The work list (`docs/factory-surface-issues.md`)

S4 and S5 resolved. Open, in order of leverage:

- **S9** — spec and plan written, not started:
  `docs/superpowers/specs/2026-09-08-group-seating-design.md`,
  `docs/superpowers/plans/2026-09-08-group-seating.md` (9 tasks; the first
  gate is the byte-identity of the stamp change). Groups never
  reach the flat `ir`; shape 1 (choice arms) = sub-factories as the parent's
  overload projected down (the existing `structItem$brace` seating, gate
  widened to any single slot); shape 2 (single group) = keys spliced onto the
  parent with both-or-neither overloads; shape 3 (repeated group) = array of
  the group's configs in the list slot. `hasAnyField` is retired; `hoisted`
  comes from `annotations.hoisted` stamped by each minting route, with
  `patches` entries (`variant()` / new `group()`) for the eight upstream
  hidden seqs. All seating logic is overlay-emitter code; base factories,
  `types.ts`, factory map and node model untouched. Census 2026-09-08:
  hoisted 33/40/8, mounted 30/29/6, unmounted 3/11/2 (rust/ts/py).
  The emitter already prints the shape 3 spelling; S2 folds into this.
- **S3** — statement slots take only the hidden statement wrappers.
- **S2** — a no-argument form call is rejected (`ir.parameters.strict()`).
- **S6** — verbatim text in expression/pattern positions with no leaf to wrap.
- **S7** — a layout keyword arrives as an id where a presence flag is expected.
- **S8** — form names the read reaches are not on `ir`.
- Inner comments: a comment rides the FOLLOWING node's `$triviaData`, which the
  dispatcher never hands to a factory; the emitter prints only root trivia.
  Carrying `$triviaData` through `nodeToConfig` would also make comments
  round-trip in the validators — a gate-moving change, do it on purpose.
- The override python parser rejects `name=True` keyword defaults
  (`packages/tools/scripts/probe-sweep.py` lines 129 and 133), so the python
  dogfood target is `tests/format-roundtrip/fixtures/python-4space.py`.
- `ir.synonym.*` is legacy (user ruling); rust lost `synonym.boolean`.
- `packages/tools/src/codegen-surface.ts::buildNodeMap` does not expose
  `terminalAliasWireIds` (the gen path does).

## Gotchas

- Text searches are hook-blocked unless `.infigraph/.search-fallback-allowed`
  holds a fresh timestamp; write it in its own Bash call, then search.
- After any `packages/codegen/src/**` edit, regenerate all three grammars or the
  tools/cli suites fail with "Generated manifest verification failed";
  `--tests-dir packages/<g>/tests` regenerates `nodes.test.ts`.
- The generated rebuilds are loaded by computed path in the verify tests so tsc
  does not follow them; their errors are the ceiling's business.
- The collect-baseline test fails if another type-check runs concurrently; it
  passes alone.
- Commits: `git commit --no-verify -m … -- <paths>`; new files need `git add`.

## Commands

```bash
pnpm exec tsx packages/cli/src/cli.ts gen -g rust -a -o packages/rust/src --tests-dir packages/rust/tests --skip-ts-chain --no-emit-diff
pnpm exec tsx packages/cli/src/cli.ts validate counts
pnpm run gen:examples && pnpm run type-check:generated-examples
pnpm exec tsx packages/cli/src/cli.ts tool emit-factory-source --grammar rust --file rust/crates/sittir-core/src/splice.rs | head -40
```
