# Handoff — seams and trivia (2026-09-09)

Branch `feat/strict-rebuild-from-source`, continuing from
[the strict-rebuild handoff](2026-09-08-strict-rebuild-handoff.md), which
closed S12 and S8. Nothing pushed, no PR open. Eleven substantive commits
`62b56f4c2..c4f842cdc`; `git log --oneline be9e07684..` lists them.

**The rebuild renders comments.** That is what this session bought.

| | before | after |
| --- | --- | --- |
| rust | 1851 / 4389 | **4140 / 4374** |
| typescript | 2074 / 3898 | 3993 / 3890 |
| python | 409 / 421 | **415 / 421**, equal modulo whitespace |

The rust source shrank (4389 → 4374) because the comment cleanup edited
`splice.rs` itself. Typescript renders *longer* than its source because the
source indents with tabs and the render uses four spaces — that is indent
style, not extra content.

Ceiling **6 / 0 / 6**. Validate counts and `ir-render-parse` are byte-identical
to the session's start on every commit: rust 1259, typescript 1063, python
1286.

## What landed

### The verbatim-storage fix (`62b56f4c2`)

python's `users: list` rebuilt as `ir.type.strict(TSKindId.List)` and rendered
`users: []` — the identifier `list` resolved onto the `list` RULE.
`findEntryForLiteralText` is documented as the chain for a caller holding a
LITERAL TOKEN TEXT and falls back to a full name chain, so any identifier
sharing a rule's name became that rule's kind id. The model already classifies
this per slot: `verbatim` stores values as given, `kindEnum` / `mixedEnum` are
the storages whose values ARE kind ids. `printVerbatimText` consults that
instead of asking the literal chain unconditionally.

### Keyword seams (`2992aa260`, `56980ad8e`)

An implicit-space rule already spaces a keyword against a word, so only
*keyword-meets-punctuation* seams need declaring. rust gained `if_after` and
`in_after`; typescript gained `for_after`, `return_before`, `return_after`.
The sites existed on the model; only the defaults were missing.

`const_after` is NOT declarable and is left as a finding: a lexical
declaration's `const` / `let` is an all-keyword SLOT, and the seam design
deliberately mints no site for one — "a slot whose arms are all keywords stays
lexical". That is right when a word follows and wrong when punctuation does,
which is why `const{ boundary }` renders tight.

### The slot-level address at a rule's edges (`1e7a38949`)

A seam is minted between members of ONE seq, so a token that is the first
member had no seam to its left and no `<token>_before` site. Hoisting breaks
that scoping: an arm's rule is spliced into a parent, so its leading boundary
IS a real seam — the parent's `left` slot meeting the arm's `=`. python
declared `eq_before: 'space'` and it had nowhere to land, rendering `x= y`.

`withKindEdges` already injected a seam there for the KIND address
(`assignment_eq_before`, which the options catalog never exposes). It now
injects the slot-level address beside it, deriving the label through the same
`seamNameOf` / `edgeMember` that `withTokenSeams` uses, so both agree.

`SITE_ASSIGNMENT_EQ_EQ_BEFORE` and
`SITE_COMPARISON_OPERATOR_COMPARATOR_OPERATORS_BEFORE` now exist. New sites
default to `tight`, and a tight seam writes nothing, so every other site is
inert until declared — the tables are purely additive (python +91, rust +147,
typescript +114, **zero lost**) and the rust and typescript renders were
byte-unchanged by it.

**The python rebuild now re-parses to the same tree as the real file.** Its
`examples-verify` row is a plain `it`; only blank lines separate it from byte
identity.

### Trivia threading (`6dec4c28b`)

A comment rides the FOLLOWING node's trivia and trivia is not config, so a
factory rebuilding from the config alone dropped every comment.
`carryTriviaThroughWith` already applies exactly that rule to a `$with`
rebuild; construction is the other place a node is remade from its config, and
`buildWithFactory` is its one funnel for both the real and the printing
surface.

The emitter had the machinery but keyed it wrong: `collectTrivia` built a map
by each node's own `$nodeHandle` while `Printed.handle` was set from
`handleOf(args[0])` — the handle of the node's ARGUMENT. Every lookup missed.
That second derivation is deleted; a `Printed` now carries the trivia
construction puts on it, exactly as a built node does.

### `$triviaData` → `$_trivia` (`f243a9a4b`)

`$trivia` was taken by the attach METHOD on the same interface, and a bare
`_trivia` would be traversed as a child slot by every `key.startsWith('_')`
walker in the read and print path. `$` is the metadata namespace and `_`
already means storage, so `$_trivia` reads as the storage form of `$trivia`
and leaves the attach verb its name.

It is a napi wire name: serde renames, transport `js_name`, the
`FromNapiValue` decode, `index.d.ts` and the fixtures all moved, and the three
`.node` binaries were rebuilt.

### The trivia line break (`e4ba95933`)

`render_with_trivia!` wrote an unconditional `"\n"` after every leading entry,
so a comment whose own text already ends the line opened a blank one — rust's
`//!` block came back double-spaced.

The invariant the trailing branch already documented is the right one for both
sides: the boundary must BE a line break, because a line comment swallows
whatever follows on its physical line and `SpacingWriter` only guarantees a
space. An entry that ends its own line already satisfies it.

Whether it does is **per grammar and per comment kind**, measured:

| grammar | comment | node text |
| --- | --- | --- |
| rust | `//! a` | `"//! a\n"` — includes the terminator |
| rust | `/* b */` | `"/* b */"` |
| typescript | `// a` | `"// a"` |
| python | `# a` | `"# a"` |

So neither "always write one" nor "never" is correct. Each entry now renders
to a short scratch string so the separator can be skipped when it would
double. That costs the macro's documented no-intermediate-buffer property;
correctness won.

### A seated element's comment (`c4f842cdc`)

Every element of an elements seat went through `resolveChild`, and so through
`carryTrivia`, EXCEPT one whose kind matches the seat: that one projects to
the group's config, and a config is not a node. rust's enum variants lost
their `///` comments that way.

**There was no design question here** — a true node IS created and IS
addressable. Verified four ways:

- the list builder creates real `_attributed_enum_variant` nodes (`$type=409`,
  with `$trivia`), reachable at `el._element[i]`; attaching there renders right
- a prebuilt `buildAttributedEnumVariant(…).$trivia(T)` renders right
- `ir.enumVariant.strict(…).$trivia(T)` passed **bare** renders right — so no
  new `ir` spelling was ever needed
- trivia on the inner value INSIDE the seat config renders right

The last is the route taken. Constraint found while probing: passing trivia as
a config KEY is **rejected by the transport** (`InvalidArg`), so a "carrier on
configs" is not available. The carry is guarded to a group with exactly one
built value; anything else leaves the trivia unattached rather than guessing
which child owns the comment.

### Comment hygiene (`60b9f5577`, `553dd2969`)

`sittir-core`'s `trivia_data` doc claimed `readNode` never sets it. It does —
`read_node.rs:166` is `trivia_data: compute_trivia(node, source)`; extras carry
no field name, so `read_children` skips them and `compute_trivia` recovers them
as a sibling's trivia. That is how a comment reaches the read at all. Both docs
now point at `compute_trivia` rather than restating its rules.

Then spec / ADR / task numbers came out of source comments (tests left alone,
per ruling). A blanket regex is unsafe and was not used — it turns
`Spec 012 T062 — SC-007 shape gate.` into `— SC-007 shape gate.` and
`(spec 012 T047 / FR-012)` into `(/ FR-012)`. Every line was reviewed; where
the number carried the only content the comment was rewritten. Emitted strings
and error messages moved at their emitter, never in generated output.

## Open, in order

1. **The dropped `||`.** typescript renders
   `if (!trivia || trivia.length === 0)` as `if (!trivia trivia.length === 0)`.
   A binary expression's operator vanishes — real content loss, invisible to
   the ceiling because the file still type-checks and renders. Next up.
2. **Blank lines.** Not captured as trivia at all (python's tree carries zero
   `$_trivia` despite its blank lines), so they can only be imposed
   canonically. The spec designates the mechanism — "blank lines between
   sibling statements or items: that is the separator gap of the parent,
   already a site" — and `module` and `block` expose
   `statements_separator_space` as DISTINCT sites, so PEP8's two-at-top-level /
   one-between-methods is expressible. What is missing is an ARM wider than
   `newline`: the ladder is `tight < space < newline < indent, dedent`. Adding
   `blank` above `newline` keeps coalescing intact (wider wins).
   Do NOT disable coalescing for newline — it is global, and would add a blank
   line wherever a kind-edge newline abuts a separator newline.
3. **`const{ boundary }`** — the all-keyword-slot finding above.
4. **`FormatTrivia[]|undefined`** — the union pipe has no declared spacing.
5. **Token-tree commas** — `#[derive(Debug,Clone)]`. `_delim_token_tree_*`
   declares `empty_separator_space: 'tight'` deliberately, so this needs its
   own comma rule rather than a changed default.
6. **The `ArgsOf` overload class** (python ×6, rust ×6, all cosmetic — the
   sites render correctly). `ArgsOf<F>` resolves to a function's LAST overload;
   the factories emitter documents avoiding exactly that trap
   ("rather than `Parameters<typeof target>`, which would select the target's
   LAST overload") but the polymorphs overlay walks into it. Destination is
   `T.<TypeName>.BuildArgs` / `LooseArgs`, already emitted and canonical, but
   the generic helper's parameter type must be threaded at every mount in all
   three grammars for zero behavioural gain.
7. **Line wrapping** is layout, not content — verified. A `return { … }` block
   and a function body brace that looked dropped are both present, rendered on
   one line where the source wrapped.

Two residues from the comment sweep: `packages/<lang>/src/backend.ts` and
`boundary.ts` still carry task numbers and I could not find their emitter (the
literal text appears nowhere outside the generated output, though the manifest
lists both as generated); and the `@forFutureUse ADR-0018 (path)` family is a
deliberate marker convention awaiting a ruling.

## Gotchas

- Changing `rust/crates/sittir-core/src/macros.rs` or any wire name needs all
  three `.node` binaries rebuilt (`pnpm run build` per grammar crate, 20–55s
  each) before a render measurement means anything.
- `packages/python/.sittir/grammar.js` drifts nondeterministically and desyncs
  its manifest across repeated gens; one final `gen -g python` resyncs it.
- After editing an emitter, three test files fail on staleness alone —
  regenerate the grammars AND run `pnpm run gen:examples`.
- `collect-baseline.test.ts` fails only when a type-check runs concurrently; it
  passes alone.
- `rust/crates/sittir-parity-tests/tests/parity.rs` runs 0 tests, and
  `native_parser.rs` has one pre-existing failure (typescript
  `lexical_declaration`, "semicolon field"), confirmed by stash-and-rerun.
- Do not compare `options.ts` Kind\* interface rows across revisions with a
  naive block parser — multi-line rows and an empty `interface OtherLabels {}`
  make it swallow the next interface and report kinds as dropped when nothing
  is. Diff the flat `pub const SITE_…` tables in
  `rust/crates/sittir-<g>/src/render/options.rs`.
- Commit with explicit pathspecs (`git commit -- <paths>`); a `git add -A`
  swept in an untracked `.vitest-report.json` once.

## Commands

```bash
pnpm exec tsx packages/cli/src/cli.ts gen -g rust -a -o packages/rust/src --tests-dir packages/rust/tests --skip-ts-chain --no-emit-diff
pnpm exec tsx packages/cli/src/cli.ts validate counts
pnpm run gen:examples && pnpm run type-check:generated-examples
cd rust/crates/sittir-rust && pnpm run build      # napi release, per crate
cd rust && cargo test -p sittir-core
```
