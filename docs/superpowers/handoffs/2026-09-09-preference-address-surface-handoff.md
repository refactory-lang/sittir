# Handoff — arm seams, and one address for a preference (2026-09-09)

Branch `feat/strict-rebuild-from-source`, continuing from
[the anon-token identity handoff](2026-09-09-anon-token-identity-and-blank-lines-handoff.md).
Nothing pushed, no PR. Seventeen commits `3182c9aa0..c9c362dc1`; two of them
are the validator recording its own runs.

Two things happened. One bug fix landed, and diagnosing it turned into the
observation that a preference has seven spellings — which became a spec, a plan
and the first two tasks of that plan.

| | |
| --- | --- |
| shipped | per-arm punctuation seams (`3182c9aa0`) |
| spec | `docs/superpowers/specs/2026-09-09-preference-address-design.md` |
| plan | `docs/superpowers/plans/2026-09-09-preference-address-surface.md`, 11 tasks |
| executed | Tasks 1-2 (`e5c19825b`, `f15012ecb`), both byte-neutral |
| next | Task 3, `readOptionsBlock` |

Gates at every commit: validate byte-identical — rust `from 147 / cov 207 /
ir-render-parse 1259`, typescript `143 / 193 / 1063`, python `126 / 142 /
1286`, `AstMatch` equal to `Pass` on every row — suite 243 files / 3421 passed
/ 0 failed, `cargo test -p sittir-core` 113.

## What landed

### Each punctuation arm of an enum carries its own seam (`3182c9aa0`)

`#[derive(Debug,Clone)]`. The gap between token-tree elements was one
`empty_separator_space` arm and the elements were one
`_token_tree_punctuation` node, so no single value served the corpus:
`namespace = foo::bar` wants a space around `=` and none around `::`, in one
token tree. The punctuation had no address at all — `withTokenSeams` walks seq
members and these are repeat elements, `ownsKindEdges` wants a compound.

An enum's rule is a choice of literal arms, and each punctuation arm now takes
a seam pair named by its own anonymous token's catalog kind. A word-shaped arm
names nothing, since two words cannot abut and the lexical rule already
separates them; an arm that names nothing is left bare rather than vetoing its
siblings — the first cut vetoed the whole enum over `_`, the one unresolvable
arm out of 49.

The resolved whitespace needed somewhere to live and a unit enum has nowhere.
Rather than restructure the shared value type — 1029 references — the enum's
raw arms became `<X>Arm` and `<X>Enum` became an alias for `Seamed<<X>Arm>`.
Every position that already accepted the enum accepts it unchanged: slot enums,
napi decoders, Display delegations all untouched. `Seamed` is generated per
grammar because its Display writes the grammar's own `spacing_text`.

Sites rust 1039 → 1149. All 93 distinct fixture changes are inside `#[...]`,
`name!(...)` or `macro_rules!`; nothing in ordinary code moved.
`clippy::useless_transmute` stayed tight, which is what per-arm addressing
buys.

**Three gaps stayed open**, and the design below answers all three: an arm seam
at a list edge beats the delimiter's flank under width-coalescing
(`#[derive(Debug, Eq, )]`, `#[attr( => …)]`), and the global `colon_after`
reaches macro metavariable patterns where `$a:ident` wants none.

### One address for a preference (spec, `e65d172e7..4ce369cd8`)

A preference answers two questions — where it applies and what it means — and
the surface answered them together, six ways on the native side and a seventh
in the generated TypeScript. The design gives them one path grammar, shared
with `patches:`.

Settled, in the order it settled:

- **Addresses are paths**, extending `parsePath`'s vocabulary by one segment —
  a quoted literal — with `before`, `after`, `separator` as ordinary segments
  rather than sigils.
- **Model-addressed, not tree-addressed.** A literal names an arm of the
  model's enum, well defined where the tree shows only an aliased parent.
  Preference paths borrow scm's syntax, not its semantics.
- **Specificity is the site set**, not path length: a declaration matching a
  strict subset wins, and two whose sets overlap without nesting are a
  load-time conflict. Path length does not adjudicate, because two addresses
  can reach one site from different roots.
- **Flanks retire.** `start`/`end` were a second address for a gap the
  delimiter seams already reach — an empty body stays bare because the writer
  cancels an indent immediately followed by a dedent, not because a flank is
  conditional.
- **The empty separator retires** into the preceding child's `after` edge. A
  repeat with no separator token has nothing between its elements but that gap,
  and naming it as a property of the list is what made the attribute-item blank
  line undeclarable.
- **A label's first segment is a virtual kind.** `body/before` is `before`
  under `body`. So the top level is kind-keyed throughout, some real and some
  virtual, and the generated `Options` type is one map rather than two
  intersected halves.
- **`preference()` takes the arm only** — the key is the path, so the label
  argument only repeated it back.

```ts
options: {
  body:             { before: preference('indent') },      // virtual kind
  keyword_argument: { '"="/before': preference('tight') },  // real kind
  _bindings: { 'block/"{"/after': 'body/before' },          // address → label
}
```

Membership and default live in the two halves: `_bindings` says which label an
address belongs to, the declaration under its kind says what its arm is. Today
those are welded into one `preference(label, arm)` call repeated at every site —
`block_body_before` is written twenty times across rust and typescript.

### Tasks 1 and 2 (`e5c19825b`, `f15012ecb`)

A literal path segment, and a splitter that survives one. rust's
`_token_tree_punctuation` has `/` and `/=` among its arms, so
`pathStr.split('/')` would cut a literal in half and leave exactly the arms
this exists to reach unaddressable.

Then the address as a value: parse, format, and a canonical order. Site indices
are assigned in that order, which is what makes a prefix-scoped declaration a
contiguous range. Sorting compares parsed segments rather than the raw string,
since a literal may carry the separator.

## Open, in order

1. **Task 3**, `readOptionsBlock`. Written against the final shape with real
   test code; ready to execute cold.
2. **Tasks 4-11.** 6 and 7 are the risky pair — sorted-path site numbering
   churns every `SITE_*` constant, and any latent assumption that indices are
   stable surfaces there. 9 is the only task that moves fixtures. 11 mints
   sites and moves the ratchet deliberately.
3. **Plan 2** — the render context. `impl Display for XTransport` becomes
   `impl Render { fn render(&self, ctx, f) }`, which lets `FillOptions`, the
   fill walk and every per-node `Option<u16>` spacing field be deleted. Nothing
   on the TypeScript side ever writes a per-node spacing value, so that
   capability is unused and unreachable. This is the extension point the
   render-views-display plan left open, and it depends on nothing in plan 1.
4. **Blank lines, still 4 correct / 1 spurious / 3 missing** in the rust
   rebuild. Task 11 closes the spurious one. The three missing are inside a
   function body and after the module doc block, which no canonical rule
   imposes — the capture-versus-impose question is still open.
5. **Carried, untouched**: field lists diverge inline-vs-multiline in both
   directions, struct-pattern `lbrace_before`, closure `pipe_after`, no
   trailing newline at EOF, and the `ArgsOf` overload class.

## Gotchas

- **A command containing `rg` is blocked in its entirety** before anything in
  it runs. Putting `rg` after a `python3` heredoc means the script silently
  never executes while the output reads like a search failure. Cost three
  attempts before it was recognised. Prefer the `Edit` tool for file changes:
  it fails loudly on a no-match, where `str.replace` returns the string
  unchanged.
- **Editing `packages/codegen/src/` rebundles `packages/*/.sittir/grammar.js`**,
  and a pre-commit hook rejects the stale manifest if it is left unstaged.
  Stage `packages/*/.sittir` in every codegen commit, not just `hash.ts` and
  the manifest.
- **`git commit -F - <<'MSG' … -- paths` does not work** — git reads `-F` and
  `-` as pathspecs when they follow `--`. Write the message to a scratchpad
  file. A newly created file also needs `git add` before it can appear in a
  pathspec commit.
- **`pnpm run validate:native` creates its own commit** touching
  `packages/tools/validation-history.jsonl`.
- **Validate cannot see whitespace.** `#[derive(Debug, Eq, )]` and
  `#[derive(Debug,Eq,)]` parse to the same tree, so a green validator proves
  the change is safe, not that it is right. The rendered strings in the three
  `rust/crates/sittir-*/test-fixtures.json` are the instrument. Plan tasks 1-10
  must not move them; only 9 does.
- **`parsePreferencePath` does not delegate to `parsePath`.** They share the
  splitter and the segment forms but not the rules: `parsePath` rejects a bare
  identifier and demands `(name)`, while every side in a preference address is
  bare. `(_)` is a kind-match named `_` and must be tested before the general
  `(name)` case, since `_` is not an identifier.
- **Exhaustiveness over `PathSegment` has three sites**, one of them in
  `link.ts` — `refine()`'s `stepPath`, where a literal joins kind-match as a
  form refine paths do not accept.

## Commands

```bash
for g in rust typescript python; do
  pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src
done
pnpm run validate:native && pnpm exec vitest run
cd rust/crates/sittir-rust && pnpm run build      # napi release, per crate
cd rust && cargo test -p sittir-core
git diff --stat -- 'rust/crates/*/test-fixtures.json'   # the real whitespace gate
```
