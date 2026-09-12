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

**This 8–13% gap is a measurement artifact, not the sink** — see
`.superpowers/sdd/2026-09-11-typed-render-sink-plan/research-render-perf.md`
for the full investigation. `Cargo.lock` is gitignored (`.gitignore:56`),
so the "before" build's fresh `git worktree` resolved napi-rs 3.12.4 while
the "after" `.node` in the shared tree was already built against napi-rs
3.8.5. napi 3.12.4 reads a JS object field via `napi_get_named_property`
(V8's inline-name cache) instead of 3.8.5's `Object::get(&str)`, which
builds a JS string per key then calls `napi_get_property` — with ~4,201
generated transport fields read one property at a time per render, that
version difference alone is worth +16–19% on unrelated, byte-identical
output.

Rebuilt at a matched napi version the sink is a small **win**, not a
regression:

| source revision | napi-rs | renders/sec (rust) | vs pre-sink at same napi |
| --- | --- | --- | --- |
| `2d8771e0b` pre-sink | 3.8.5 | 150,483 | — |
| `5b634c3e2` HEAD | 3.8.5 | 151,177 | +0.5% |
| `2d8771e0b` pre-sink | 3.12.4 | 174,406 | — |
| `5b634c3e2` HEAD | 3.12.4 | 179,399 | +2.9% |

Both deltas sit inside the ±3–5% run-to-run spread measured on this
workload, so the honest reading is "no measurable regression, and likely a
small win" rather than "8–13% slower." A sampled profile (`sample`, 8 s at
1 ms) is the sharper instrument here: it shows `SlotValue<AnyTransport>::from_napi_value`
at 98.7% of a native render call, the whole render half at 2.65%, and the
typed sink itself at 0.71% of runtime at HEAD, down from 1.81% pre-sink
(sink self-time fell ~61% per render; `render_transport_parts` as a whole
fell ~35%). Every mechanism this section originally suspected — `dyn
RenderSink` dispatch, per-call seam bookkeeping, the per-address options
struct — is bounded by that 2.65% and is not where render time goes.

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
- `findEntryForLiteralText` matches `literalText` only. The two ad hoc
  kind-name coincidence paths this sink work removed
  (`options.ts::nestedKey`'s identifier shortcut, `factory-source.ts::memberIdOfText`)
  are gone; one remains by design, not by oversight —
  `generated-metadata.ts::findEntryForPatternValue` falls back to a
  kind-name match for a PATTERN rule's regex source, since a PATTERN's
  value may name a kind directly rather than always being literal text
  the way a STRING's is (see its glossary entry in
  `docs/glossary/compiler.md`, and `link.ts:~469`, its one call site).
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
- Two glossary mentions were rewritten above, not "every mention of
  jinja/askama": roughly thirty jinja/askama mentions remain across
  `docs/glossary/{emitters,root,scripts,compiler}.md` (17/7/2/4
  respectively) — filed as a follow-up under "Next", not swept here. None
  of the declarations they attach to are still named `jinjaTemplates` or
  `JINJA_COND_FULL_RE`; those names are already gone from source, so the
  remaining mentions describe retired behavior under a current name and
  need per-entry review rather than a mechanical rename.
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

### The read path is unchanged, and was already wrong

Rendering a deep `parseAndRead` node straight back through `engine.render` gives the same bytes at head as at the last pre-sink commit (measured in a temporary worktree with the same probe), so byte identity holds on that path too. Those bytes are wrong on both sides: python indentation escalates and never returns after a function body (the reader delivers `_indent`/`_dedent` as tokens the transport renders as text, so depth never moves), and typescript decorator seams and the class-body brace seam do not apply (the reader stamps no sites). The validator's counts compare no bytes on the read path, which is why neither shows up. Both belong to the source-coordinates plan's prepare walk, and a byte-level read-render check belongs beside the validator's counts.

### Depth tokens still carry the sentinel text on the wire

The generated `FromNapiValue` for the `_indent`/`_dedent` token transports defaults `$text` to the depth text (`"\u{FDD0}\n"` / `"\u{FDD1}\n"`, six sites in `rust/crates/sittir-rust/src/render/transport.rs`, mirrored in the other grammars), and the render body reads the depth fact off that string rather than off the kind. It is the last place the retired mark encoding survives, and why the mark-absence test strips those lines. The source-coordinates plan's depth-from-coordinates work removes it; until then a depth token is a text-carrying transport whose text is never written.

## Next

- Small: a test for `render-options-rs.ts::fieldsOf`'s new diagnostic (a leaf whose sites mix spacing and delimiter throws naming the address); a glossary entry for `packages/tools/tests/emit/dogfood-render-bytes.test.ts`; the dangling `jinjaTemplates` / `JINJA_COND_FULL_RE` glossary headings go with the Askama sweep.

- The remaining ~30 jinja/askama mentions across
  `docs/glossary/{emitters,root,scripts,compiler}.md` (see "Documentation
  swept" above) — per-entry review, since none attach to a source
  declaration still named `jinjaTemplates`/`JINJA_COND_FULL_RE`.
- Review-triage items deferred to the user, from
  `.superpowers/sdd/2026-09-11-typed-render-sink-plan/pr-comment-triage.md`:
  item 5 (sub-factories forwarded child), item 11 (rust `arguments` slot
  collision), item 18 (formatter-normalized example comparison).
- Track `Cargo.lock` and bump napi-rs to ≥3.12.4 — measured +16–19%
  throughput on unchanged, byte-identical output, and the only way a
  native before/after benchmark in this repo is reproducible (a fresh
  `git worktree` silently resolves a different napi than the shared
  tree's already-built `.node`, which is exactly what produced the
  apparent 8–13% regression above). A repo-policy decision for the user,
  not made here.
- A transport-text fast-path bug, pre-existing and not introduced by this
  branch: `render-module.ts:~820-825` emits an unconditional early
  `return w.text(text)` for a leaf transport's own text, which skips the
  body's `w.dedent()` — for python `render_block`
  (`transport.rs:~45500`), `render_suite_block` already opened the indent
  before that fast path returns, so a verbatim/empty block leaks depth +1
  for the rest of the render. This is a read-path indentation escalation;
  the writer's `debug_assert_eq!(depth, 0)` in `SpacingWriter::finish`
  never runs in a release addon, so it does not fail loudly today. Fix
  direction: refuse the fast path when the body holds depth nodes, plus a
  debug-build render smoke test that would catch the assertion.
- A byte-comparing read→render axis beside the validator's AST-match,
  whitespace-blind counts: `packages/tools/tests/emit/dogfood-render-bytes.test.ts`
  (added this round) is a first instance: it renders a `.$render()` of a
  factory rebuild and compares against a committed fixture byte-for-byte.
  Extending the same shape to a read→rebuild→render round trip would catch
  a whitespace regression the validator's node-shape counts cannot see.
- The dedent-route unification for the source-coordinates plan's
  coordinates work: `SpacingWriter::site(DEDENT)`
  (`rust/crates/sittir-core/src/spacing.rs::site`) always merges a break
  seam after dedenting, while the generated literal `w.dedent()` route
  (`render-module.ts::literalWrite`) only follows with a seam when a body
  payload is present at that edge. No grammar exercises both routes on the
  same edge today, so this is currently inert; folding the two into one
  derivation is worth doing before a coordinate-carrying render makes the
  difference observable.
- Any further render-throughput work belongs in the transport crossing,
  not the writer: `SlotValue<AnyTransport>::from_napi_value` is 98.7% of a
  native render call (~4,201 generated fields read one
  `napi_get_named_property` at a time), against the sink's 0.71%. Render
  by tree handle against a resident native tree instead of
  re-materialising the JS object graph per call — the direction
  `docs/superpowers/plans/2026-09-11-source-coordinates-plan.md` already
  points at — is the real lever; do not micro-optimise the sink itself
  (`#[inline]` measured ~0.2% of runtime, and a generic `Render::render<W>`
  is blocked by the `&dyn Render` uses in `sittir-core/src/render.rs` and
  every generated `render_transport_dispatch`).
- `docs/superpowers/plans/2026-09-11-source-coordinates-plan.md` lands on
  this sink next: its `NodeCoordinate` needs no attached source, and
  `RenderSink::slice` reads the tree through the context — the render
  context (options table plus the engine's live trees) becomes an argument
  end to end rather than text crossing the boundary.
- Grammar option-default gaps for rust `struct_pattern` brace spacing and
  struct-expression trailing-comma rendering (items 2–3 above).
