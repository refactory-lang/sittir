# Typed render sink — handoff

Plan: `docs/superpowers/plans/2026-09-11-typed-render-sink-plan.md`. Branch
`feat/strict-rebuild-from-source`. Spec rewritten to its end state:
`docs/superpowers/specs/2026-07-24-spacing-writer-design.md`.

## What changed, per task

- **Task 1** added `rust/crates/sittir-core/src/render.rs` (`RenderSink`,
  `Render`, `RenderError`, `WhitespaceTable`, `render_to_string`) beside the
  existing in-band-mark `SpacingWriter`, so the generated crates kept
  compiling against the old mark path while the new trait grew its own test
  module. No generated output moved in this task.
- **Task 2** switched the emitters (`render-body.ts`, `render-module.ts`,
  `templates.ts`) to print one `RenderSink` call per body node instead of
  mark characters, and deleted the mark path from `spacing.rs`: the five
  mark constants, the byte-stream scanner, `seamMarked` prefixing, and the
  `fmt::Write` impl for `SpacingWriter`. This was the first task that
  regenerated all three grammars and ran the byte-identity gates.
- **Task 3** moved render options across napi as a generated per-address
  Rust struct (`rust/crates/sittir-<g>/src/render/options.rs`) instead of a
  JSON string matched against a path table, with unknown keys refused at
  the deserializer.
- **Task 3b** (folded into the same stack) renamed keyword tokens to
  `<text>_keyword` by parser.c fact and re-spelled nested render-option keys
  by their token's kind name (see "Keyword and literal naming" below).
- **Task 4** (this task) is documentation only: rewrote the spec's "v1: the
  writer" and "Wiring" sections into "The writer" describing the sink's
  seven calls, the held seam and its rank, the token seam, depth and the
  cancel rule, and adjacency; deleted every mention of marks-as-bytes,
  `write_fmt`, `Formatter`, and jinja/askama; ran the before/after
  benchmark; swept two stale Askama mentions in
  `docs/glossary/emitters.md`; added a "carried in" note to
  `docs/superpowers/plans/2026-09-11-source-coordinates-plan.md`'s header.

## Byte-identity result

Tasks 1–3 gate on byte-identical `packages/{rust,typescript,python}/src`
output under regeneration and unchanged `validate:native` /
`validate:history` numbers versus the `e807479a0` baseline (rust
`147 / 207 / 134 of 137`, typescript `143 / 193 / 112 of 114`, python
`126 / 142 / 115 of 116`). Those gates are recorded in the individual task
commits on this branch; this task changes no codegen source and
regenerates nothing, so it carries no new byte-identity evidence of its
own — see "Rendered whitespace at head" below for the controller's direct
render measurement at HEAD.

## Benchmark

`BENCH_ITERATIONS=200 pnpm exec tsx packages/cli/src/cli.ts tool bench`,
three runs each, idle machine. "Before" = `2d8771e0b` (the last commit
before the sink emitters landed — Task 2's predecessor), built in a
temporary worktree (`git worktree add /tmp/sittir-bench-before 2d8771e0b`,
`pnpm install --frozen-lockfile`, `pnpm run build` in each of
`rust/crates/sittir-{rust,typescript,python}`, then
`git worktree remove --force`). "After" = HEAD (`bf6d1b0ba`), native
binaries already built in the shared tree.

Renders/sec per run:

| Grammar | Before run 1 | Before run 2 | Before run 3 | Before mean | After run 1 | After run 2 | After run 3 | After mean |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| rust | 162,361 | 174,986 | 175,334 | 170,894 | 156,500 | 154,526 | 155,871 | 155,632 |
| typescript | 163,025 | 176,794 | 174,731 | 171,517 | 158,073 | 155,901 | 156,862 | 156,945 |
| python | 182,305 | 190,485 | 186,394 | 186,395 | 162,130 | 165,082 | 158,237 | 161,816 |

Per-condition variance (max − min across the three runs) vs. the
before/after difference in means:

| Grammar | Before variance | After variance | Before − after (mean) |
| --- | --- | --- | --- |
| rust | 12,973 (7.6% of mean) | 1,974 (1.3%) | 15,262 (8.9%) |
| typescript | 13,769 (8.0%) | 2,172 (1.4%) | 14,572 (8.5%) |
| python | 8,180 (4.4%) | 6,845 (4.2%) | 24,579 (13.2%) |

The before/after difference exceeds each condition's own run-to-run
variance for all three grammars, so this is not noise. It is also the
**opposite of the expected direction**: the plan's goal predicted a
throughput gain from removing the per-chunk mark scan; measured, HEAD is
consistently 8–13% slower than the pre-sink commit. `before` run 1 for
rust/typescript is a low outlier relative to its own runs 2–3 (possibly a
cold-cache effect from the freshly-built worktree binary); using only runs
2–3 as `before`'s baseline widens the gap further, it does not close it.
Plausible cause, not diagnosed further here (out of this task's scope,
which is documentation): the mark path's per-chunk scan is gone, but the
sink path pays a dispatch through `dyn RenderSink` at every one of the
seven calls per body node where the old path wrote through a monomorphic
`fmt::Write`, and the per-address options struct (Task 3) adds a
deserialize/typed-field-access step the flat JSON-path table didn't have.
Reported as measured, not adapted to fit the hypothesis — the dispatcher
should decide whether this regression is worth a follow-up investigation.

## Keyword and literal naming (Task 3b, recorded here as the state Task 4 documents)

- A keyword token is named `<text>_keyword`. Predicate: the parser.c C name
  is `anon_sym_<...>` and the literal text has a non-underscore character.
  Underscore-only text is named `underscore`. Symbolic tokens keep their
  derived names (`comma`).
- Every kind entry carries `symbolName` (the parser's display name) and
  `literalText` (the token's text). An aliased anonymous token's text is
  its C suffix, verified against `grammar.json`. A named rule whose body is
  exactly a bare `STRING` or an unnamed `ALIAS` owns its literal
  (`literalRule`).
- `findEntryForLiteralText` matches `literalText` only. There is no
  kind-name coincidence path anywhere — the two that existed
  (`options.ts::nestedKey`'s identifier shortcut, `factory-source.ts::memberIdOfText`)
  are gone.
- Nested render-option keys spell a literal by its token's kind name
  (`separator: { comma: … }`, `class: { class_keyword: … }`). Canonical
  address paths and grammar `options:` keys keep quoted literals
  (`'"if"/after'`).
- python lost `ir.except`: a synthetic rule for the external string token
  merged by name with the keyword, and keywords have no factories.

## Open defect carried forward (not this task's to fix)

Wrap drops wire delimiters by separator id for every separated `many` slot
(`wrap.ts::resolveSlotDrillExprs`). The native reader delivers a
field-tagged separator into a mixedEnum array slot (python
`for_in_clause.right`) because the JS wrap pass that would normally strip
it never runs on the native read path, and the validator's read-render-
parse deep-read only walks a chosen kind set, so it never sees the drop
either. Witness: `packages/python/tests/for-in-clause-separator-witness.test.ts`
(`it.fails`). Sibling: typescript `for_statement.condition` silently drops
its `;` terminator, same class, singular form. Owned by
`docs/superpowers/plans/2026-09-11-source-coordinates-plan.md`, which now
carries a "Carried in" note in its header naming both the defect and the
validator blind spot — its coordinate/gap-classification work is the first
place a fix has the right shape to land.

## Grammar diagnostics

The empty literal `""` is now unstamped in rust and python — it was
spuriously stamped with the `_` token's id through a kind-name fallback
that has since been deleted. Three rust typename-collision diagnostic
entries were retired along with it.

## Documentation swept

- `docs/glossary/emitters.md`: the two stale Askama mentions (the
  `packages/{lang}/templates/` sentence in
  `templates.ts::module`'s doc comment, and the "Askama compile error"
  parenthetical in the `body` entry under the arm-gating comment) are
  rewritten as live constraints — the Rust render engine is generated
  separately from `render-body.ts`'s IR, not derived from the retired
  jinja templates, and a name absent from the transport struct means the
  generated Rust body references a field that does not exist.
- `docs/superpowers/plans/2026-09-11-source-coordinates-plan.md`: header
  gained a "Carried in" paragraph (see "Open defect carried forward"
  above).

## Rendered whitespace at head

Measured by rendering the three dogfood rebuilds and diffing byte-for-byte
against their sources: all three are identical modulo whitespace, none is
byte-identical.

1. **Blank lines between statements are dropped** in all three grammars —
   python module statements, rust items, typescript statements — even
   where a `(_)/after: blankline` declaration exists. This is trivia the
   source-coordinates plan's gap classification is meant to carry;
   `docs/superpowers/plans/2026-09-11-source-coordinates-plan.md`'s header
   note now lists it alongside the separator-drop defect.
2. **rust `struct_pattern`** has `lbrace`/`rbrace` option sites but no
   declared spacing default, so patterns render tight
   (`SpliceError::InvalidRange{start, end}`) while `field_declaration_list`
   renders `{ … }`. A grammar option-default gap, not a writer bug — fix in
   `packages/rust/grammar.sittir.ts`'s options, not this task.
3. **rust struct expressions** keep the trailing-comma delimiter read from
   multi-line source but render inline, giving
   `{ start: e.start_pos, end: e.end_pos, }`. Same class as (2).
4. **typescript renders the source's tab indentation as four spaces** —
   the `indent` option's default, not a defect — and long calls are not
   wrapped (no line-width notion; canonical form, not a bug).

Items 2 and 3 are grammar option-default gaps, not writer defects; they
are recorded here as next steps, not fixed in this task.

## Next

- Review-triage items deferred to the user, from
  `.superpowers/sdd/2026-09-11-typed-render-sink-plan/pr-comment-triage.md`:
  item 5 (sub-factories forwarded child), item 11 (rust `arguments` slot
  collision), item 18 (formatter-normalized example comparison).
- The benchmark regression above: worth a follow-up profile
  (`dyn RenderSink` dispatch cost per call vs. the removed per-chunk scan;
  the Task 3 options-struct deserialize path) before accepting 8–13%
  slower as the sink's permanent cost.
- `docs/superpowers/plans/2026-09-11-source-coordinates-plan.md` lands on
  this sink next: its `NodeCoordinate` needs no attached source, and
  `RenderSink::slice` reads the tree through the context — the render
  context (options table plus the engine's live trees) becomes an argument
  end to end rather than text crossing the boundary.
- Grammar option-default gaps for rust `struct_pattern` brace spacing and
  struct-expression trailing-comma rendering (items 2–3 above).
