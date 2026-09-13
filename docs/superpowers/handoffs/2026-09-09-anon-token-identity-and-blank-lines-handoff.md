# Handoff — anon-token identity and blank lines (2026-09-09)

Branch `feat/strict-rebuild-from-source`, continuing from
[the seams and trivia handoff](2026-09-09-seams-and-trivia-handoff.md), which
made the rebuild render comments. Nothing pushed, no PR open. Six substantive
commits `45dd30757..9cb3d2742`; `git log --oneline 70f0375f5..` lists them
alongside the validator's own records.

**All three rebuilds are now equal to their source modulo whitespace.** That is
what this session bought. The remaining gap is layout, not content.

| | chars | equal mod ws | blank lines |
| --- | --- | --- | --- |
| rust | 4145 / 4374 | yes | 5 / 7 |
| typescript | 4008 / 3890 | yes | 8 / 9 |
| python | 415 / 421 | yes | 0 / 4 |

Typescript renders *longer* than its source because the source indents with
tabs and the render uses four spaces. Suite 3429 passed / 0 failed, `cargo test
-p sittir-core` 113, and validate is byte-identical to the session's start on
every metric: `ir-render-parse` 1259 / 1063 / 1286, coverage 207 / 193 / 142,
`from` 147 / 143 / 126.

## What landed

### The dropped `||` (`45dd30757`)

`a || b` rendered `a b`. The chain is worth keeping because every link looked
correct in isolation.

Typescript declares `||` as a **string external** (`externals: $ => [..., '||']`).
`createSyntheticExternalRules` mints an empty-pattern rule for any external with
no rule of that name, and the grammar's own anonymous token is keyed
`pipe_pipe`, not `||` — so the guard missed and the model gained a **second kind
for one parser symbol**, both claiming id 63. `nameNode` then invented an
identity for the duplicate (`||` → `Oror`, via `tokenToName`), and
`AnyTransport`'s napi decoder resolved 63 to `Oror`: a *named* transport with no
literal default, whose text fell through to `unwrap_or_default()` — the empty
string.

The fix is one guard clause. A literal-text external defers to the anonymous
token the grammar already lexes:

```ts
if (rules[ext]) continue;
if (findAnonEntryForLiteralText(kindEntries, ext)) continue;
```

`findAnonEntryForLiteralText` is new in `generated-metadata.ts` and
`findEntryForLiteralText` now consumes it, so the anon clause has one
derivation. **The anon-only resolver is required** — see Gotchas.

Removed four duplicate kinds (typescript `||`; python `)` `]` `}`), node counts
423 → 422 and 281 → 278, and four phantom `coerceTo*`. `ir.except` survives.

### The literal-text ratchet (`90ad60454`)

Closing the path that minted those kinds does not keep the property, because
nothing stated it. Linking with the catalog present must produce no rule keyed
by anything but an identifier, for all three grammars. Verified to bite:
removing the guard fails four of the five cases, and rust — which declares no
literal-text externals — still passes, so it tracks the defect and not the
grammar count.

### Union and intersection seams (`147a6a0a1`)

`A|B` and `A&B`. Both sites already existed on the model with no declared
default, the same shape as the keyword seams: the address was there, only the
value was missing. Each has exactly one owning kind, so the defaults are global.

This tightened a ratchet — the generated rebuild of `format.ts` now re-parses to
the same tree as the real file, so its `it.fails` marker went, and the row
labels in the test name went with it.

### The `var` keyword seam (`2ceb7a20d`)

`var{ z } = w`. A keyword left tight still gets the lexical space where a *word*
follows, which is why `var x = 1` was already right; a destructuring pattern
opens with punctuation, where the lexical rule has nothing to say.

### A keyword-armed enum slot gets a seam site (`307c7e46b`)

`const{ boundary } = opts`, and the finding that `var` and `const`/`let` fail
for **different structural reasons**. `var` is a single fixed literal — a token,
so it keeps its token seam and only needed a default. `const`/`let` is a
**kind-enum slot** (`KindEnum<"let"|"const", TSKindId.Let|TSKindId.Const>`,
stored as a kind id), so it reached neither the token path nor the literal-slot
path, and its neighbour is a kind-rendering slot, which takes no site by design.
Neither side had an address.

`seamNameOf` now also resolves a member pointing at an enum, named by its field
as a literal slot is. **Only enums whose every arm is word-shaped** take a site;
admitting the rest regressed `x++` to `x ++` (see Gotchas). Every new site
defaults to tight, so minting alone left the corpus byte-identical; the one
behavioural change is the declared `kind_after`, which both owning kinds want
(`lexical_declaration` and `for_header_let_const_kind`).

Sites: rust 1037 → 1041, typescript 968 → 993, python unchanged.

### A `blankline` arm (`9cb3d2742`)

Blank lines are **not captured as trivia** — a tree carries none despite them —
so they can only be imposed canonically, and the gap between sibling items is
already a site. What was missing was a rung on the ladder.

The writer ranked a seam payload by content, and `"\n\n"` **tied** with `"\n"`.
Coalescing keeps the wider and, on a tie, the one already held, so a separator
asking for a blank line lost to any kind edge asking only to break the line.
`SeamRank` gains `BlankLine` above `Newline`, ranked by newline count — which
keeps coalescing intact rather than disabling it. Disabling is global and would
leave a blank line wherever a kind edge abuts a separator newline.

`blankline` joins the arm ladder and each grammar declares
`_blankline: string('\n\n')` beside its other whitespace externals. Adding the
symbol renumbers kinds, so derived output moves everywhere; the rendered corpus
does not.

Rust's `source_file` and `block` are distinct sites, so top-level items are
separated by a blank line while statements inside a block stay at `newline`.

## Open, in order

1. **Token-tree commas** — `#[derive(Debug,Clone)]`. `_delim_token_tree_*`
   declares `empty_separator_space: 'tight'` deliberately, so this wants a
   per-kind override, not a changed default. The declaration form is
   `<kind>: { <slot>: preference('empty_separator_space', '<arm>') }` — see
   Gotchas for why the key is the slot.
2. **`a += 1` renders `a+=1`.** Pre-existing, verified against committed
   fixtures. `augmented_assignment_expression`'s operator is a
   *punctuation*-armed enum slot, so it reaches neither `literalSlotOf` (a
   SYMBOL carrying no literal) nor the narrowed `enumSlotOf`. The fix is to
   derive the seam default correctly for punctuation-armed enums, **not** to
   widen the admission test — widening is what regressed `x++`.
3. **Typescript blank lines are undeclared.** It recovers 8 of 9 without any
   `blankline` declaration, while python recovers 0 of 4. Worth understanding
   before declaring anything for either: whatever produces typescript's may be
   accidental, and python's `module` gap is the obvious place to impose them.
4. **The DRY debt**, filed and ratcheted but not unified:
   - `nameNode` re-derives anon-token identity via `tokenToName` (`||` → `oror`)
     rather than consulting the catalog, behind an inline `/^[\w_]+$/` test.
     Measured **dead in production** (0 hits across all three full codegen runs)
     but alive in tests, so it cannot simply be deleted — the ratchet above is
     what holds the property.
   - Slot-enum **definition** and **reference** are decided in two places: a
     single-arm slot emits no enum while the struct field still names one
     (surfaced as `E0425 TemplateLiteralTypeElementsTransportSlot`).
   - `sinks.externals` conflates symbol names with literal token texts, and
     **this is not fixable at that layer** — typescript's base-grammar externals
     arrive already flattened to bare strings.
5. **The `ArgsOf` overload class** and the `backend.ts` / `boundary.ts` comment
   residue, both carried from the previous handoff. The
   `@forFutureUse ADR-0018 (path)` convention still awaits a ruling.

## Gotchas

- **`findEntryForLiteralText` is the wrong resolver for an identity question.**
  Its `findEntryForKindName` fallback matches *named* symbols too, so it claimed
  the SYMBOL external `_template_chars`, stripped the rule it needs, deleted
  `template_chars` from the model, collapsed `template_literal_type` to one arm
  and broke the crate build. Use `findAnonEntryForLiteralText` when asking
  whether a text already has an anonymous identity.
- **Do not drop literal externals from `sinks.externals`.** They are parser
  declarations *and* extra roots in `pruneUnreachableRules`; removing them makes
  `except` unreachable and deletes `ir.except`. Every gate stayed green when this
  was tried — nothing caught it.
- **A per-kind separator default is keyed by the SLOT** with the
  `empty_separator_space` label:
  `source_file: { statements: preference('empty_separator_space', 'blankline') }`.
  Keying it by the address makes `siteKey` produce
  `statements_separator_space_statements_separator_space` and gen dies with
  "names no site".
- **Every whitespace arm needs a node *and* a kindEntry.** Unit fixtures that
  model the arm set produce **no separators at all** when one is missing; the
  failure reads as broken separator construction, not a missing fixture row.
- **Validate cannot see whitespace.** `x ++` parses to the same AST as `x++`.
  For any change that mints sites or arms, the gate is that every rendered
  string in the three `test-fixtures.json` is unchanged — extract and compare
  the strings, since adding a symbol renumbers kinds and makes line diffs
  meaningless.
- **Editing anything under the codegen source tree, `__tests__` included,**
  changes the manifest `source_hash`, and `assertGeneratedManifestsClean` then
  fails ~41 native and validator tests with "SOURCE INPUTS CHANGED". Re-run gen
  for all three; the manifests return to their committed values, which also
  proves the output byte-identical.
- **`collect-baseline`'s determinism test can fail running alone** — measured 2
  pass / 1 fail in isolation (web-tree-sitter "Incompatible language version 0"
  under concurrent wasm load). Worse than the previous handoff's "passes alone".
- **Collapsing `nameNode`'s `/^[\w_]+$/` onto `isIdentifierLike` is a false
  DRY.** `TOKEN_NAMES` holds `0b`/`0x`/`0o` — identifier-shaped *and*
  digit-leading — so swapping the predicate renames them. The two regexes answer
  different questions.

## Commands

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm run validate:native && pnpm run validate:history
cd rust/crates/sittir-rust && pnpm run build      # napi release, per crate
cd rust && cargo test -p sittir-core
pnpm exec tsx packages/cli/src/cli.ts tool probe-kind -g rust -s '<source>' -k source_file
```
