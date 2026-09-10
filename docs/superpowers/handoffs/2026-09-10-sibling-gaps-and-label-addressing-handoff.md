# Handoff — a gap belongs to the child before it (2026-09-10)

Branch `feat/strict-rebuild-from-source`, continuing from
[the preference address migration handoff](2026-09-09-preference-address-migration-handoff.md).
Nothing pushed, no PR.

Plan: `docs/superpowers/plans/2026-09-09-preference-address-surface.md`.
Spec: `docs/superpowers/specs/2026-09-09-preference-address-design.md`.

| | |
| --- | --- |
| done | **Task 11 complete.** Task 10 substantially done |
| next | four steps, in the order below — the third and fourth are blocked by the second |
| open | `renderDefaultsOf` keeps one branch; the flat surface is untouched |

Gates at every commit: all three `test-fixtures.json` byte-identical unless a
movement is the point, native rebuilt, validate at baseline — rust
`147 / 207 / 1259`, typescript `143 / 193 / 1063`, python `126 / 142 / 1286`,
`AstMatch` equal to `Pass` on every row — suite 246 files / 3473 passed / 0
failed, `cargo test -p sittir-core` 113.

## What landed

| commit | |
| --- | --- |
| `093e05e57` | seated sites, and `slotElementKinds` as the one derivation of a slot's element kinds |
| `735818e06` | rust declares the seated gaps; `splice.rs` loses its spurious blank line |
| `8d186de9f` | seating moves to the parent's per-element walk and skips the last element |
| `2d21d4781` | a gap with no token gets an address; `patches:` migrated; three `renderDefaultsOf` branches deleted |
| `abade98f2` | every declared preference addressed by its label |
| `9c9459583` | one key moves all twenty-one statement terminators |

Site ceiling moved to **1423 rust, 1240 typescript, 846 python** (from
1149 / 1032 / 611). Recorded in the plan's Global Constraints with its reason.

## The design, as it settled

**A sibling gap belongs to the child before it.** A kind's trailing edge was
global to the kind, so an attribute took the same gap after it among statements
as among parameters. A seated site narrows that edge to one
(parent kind, slot, child kind), addressed `(<parent>)/<slot>:/(<child>)/after`.

**The seat is the parent's; the field is the child's.** A kind sits in many
slots, so the narrow arm cannot live in the child's own rule, which renders
once per seating. `FillOptions` is a pre-order walk and every child fill is
`get_or_insert`, so a parent writing the seated arm into an element's own
`<child>_after` field before descending has already decided it. No writer, no
`ListView`, no body IR, no new transport field.

**The walk skips the last element.** A child's edge is written at the end of
its own body and cannot know whether a sibling follows, so seating the final
element leaks the gap past the end of the list — `extern"C"fn foo` became
`extern"C"\nfn foo` when it did. Skipping it leaves that element on the kind's
global arm, which is what a trailing edge should be. Only the parent's walk
knows an element's position, which is why the seating cannot ride the element
enum's own `fill_options`.

**A seated site is born with its child's arm**, so the whole space is minted
without moving a rendered byte; only a declaration moves anything.

**Every declared preference is addressed by its label.** A delimiter, a quote
style, a statement terminator and a separator's token are declared options with
defaults, not injected into a render rule. Each addresses as `<slot>:/<label>`.
The separator is the one with children — its spacing nests as
`<slot>:/separator/before` and `/after` — so the token it chooses takes the
terminal `kind`.

**The options block is resolved twice**, against different site sets. The
render-rule pass sees only what the rules hold, so an address naming a
delimiter is passed over (`requireHit: false`); the pass that sees every site
(`withDeclaredArms`) is the one that refuses an address naming nothing. A site
whose arms do not admit a value is skipped, so one broad address may span arm
spaces; an address that names sites and is admitted by none is refused.

**A binding names an address, never a label.** The site path's terminal *is*
the label, so binding `_/_/statement_terminator` binds the label to itself.
Name the slot instead and let prefix matching do the rest, one binding per slot
name:

```ts
statements: { terminator: preference(';') },
_bindings: {
  '_/terminator:':          'statements/terminator',
  '_/automatic_semicolon:': 'statements/terminator'
}
```

That is safe because a slot address reaches whatever else sits in that slot and
the arm-space skip passes over what does not fit.

## Three claims the plan makes that are false

- **"The writer drops a seam payload with nothing following it."** True only at
  end of render. `source_file/statements` looked fine because the render ends
  there; inside a nested list something always follows.
- **"The existing global `(<child>)/after` is the broad address those narrow
  ones override — subset specificity."** They differ at segment 0, so
  `matchAddress` sees two disjoint addresses. Precedence comes from
  `fill_options` walk order, not from Task 5's rule.
- **Task 11 Step 3** mints the pair in `withKindEdges`, which attaches edges to
  the kind's own rule. A kind has several seatings; one body cannot carry two.

## Why the empty separator could not retire

Task 11's address cannot carry every sibling gap, and this is measured rather
than argued. A leaf renders as `f.write_str(&t.text)` and an envelope renders
its `content`; neither owns a trailing edge, so `ownsKindEdges` excludes both
and there is nothing to seat.

```
block/statements          20 of 22   unseated: ExpressionStatement, EmptyStatement
token_repetition/tokens    3 of 17   unseated: Identifier, Metavariable, the literals, TokenTreePunctuation
```

Fourteen of rust's twenty-eight token-less repeats and four of typescript's
fourteen are only partly covered, and `block/statements` inherits `newline`, so
retiring the separator there would drop the newline after every expression
statement in every block. The child address is an **exception layered on a slot
gap**, not a replacement for one — which is how `source_file/statements` uses
it: separator `tight`, children carrying the gap.

So `empty_separator_space` stays, and instead got an address:
`(kind)/<slot>:/separator`. All fifty-one across the three grammars are
declarable now, and the fifteen `patches:` entries moved to `options:` behind
one `gap` label per grammar.

## Next, in this order

1. **Let `preference(label)` attach without a default.** Today
   `preference(label, default)` does two jobs — it attaches the label to the
   rule's values *and* declares the default — and `declaredPreference` throws
   without one. So a label declaration in `options:` can only *override* a
   default `patches:` must still carry. The one-arg `preference(arm)` overload
   already exists.

2. **Teach `matchAddress` supertype membership.** `segmentMatches` compares a
   kind-match by exact name or `_`, so `(statement)/…` matches nothing. The
   flat runtime surface *does* have a supertype tier (`SUPERTYPE_MEMBERS`,
   `flank_supertype`, `resolve()`'s ordering). **This must land before step 4**,
   or deleting those tables loses a capability rather than relocating it.

3. **Feed the factory from the resolved sites.** `declaredSeparatorDefault` and
   `declaredDelimiterDefault` read `renderDefaults.sites` directly, and the
   delimiter one falls back to `'Delimiter.None'` **silently**. Moving those
   declarations to `options:` without this would quietly change what the
   factories stamp. That is why delimiter (rust 2, typescript 2) and separator
   (typescript 1) are still in `patches:`, and why `renderDefaultsOf` keeps its
   fourth branch.

4. **Retire the flat surface.** `KindOther`, `KindSpacing` and `KindWhitespace`
   duplicate the nested one exactly — `break_statement: { terminator_statement_terminator }`
   beside `'break_statement/terminator/statement_terminator'`. The generated
   `resolve()`'s `LABELS` / `FLANK_SITES` / `SUPERTYPE_MEMBERS` /
   `flank_supertype` back the same shape, and `packages/*/tests/options.test.ts`
   still writes flat keys, so those consumers migrate with it.

## Gotchas

- **Gate a regen on its exit code, never on grepping its output.** This cost
  the most time today by a wide margin. `awk '/^error|Internal Error/'` matches
  neither a thrown `Error` nor a `ReferenceError`, so crashed regens printed
  "regen done" and the corpus gates after them compared **stale files**. Use
  `… >/dev/null 2>&1 && echo OK || echo FAILED`.
- **`pnpm -C packages/codegen run build` starts with `rm -rf dist`.** A type
  error you read past leaves no dist at all. Build and regen in separate calls;
  a regen in the same call as a build can race it.
- **Three type errors are not cosmetic here.** They broke the build, which
  broke every regen after it. Fix them before regenerating.
- **The manifest guard fires as a spread of unrelated tools failures** whose
  set shifts between runs. It means `packages/codegen/src` was edited after the
  last regen. Regenerate; do not debug the tests.
- **Update snapshots one file at a time** and confirm `Snapshots N updated`.
- **`collect-baseline` determinism fails after a regen** and passes in
  isolation. Known flake.
- **Compare the `SPACING_SITES` default column by parsing it**, not by eye. It
  is what proves a migration moved no arm; the label column moves by design.

## Carried, untouched

`SPACING_DEFAULT` is `'space'`, wrong for a separator's leading gap; aligning
it moves exactly one construct, rust's `_let_chain` `&&`. Blank lines in the
rust rebuild are 4 correct / 0 spurious / 3 missing plus no trailing newline at
EOF. Field lists diverge inline-vs-multiline; struct-pattern `lbrace_before`
and closure `pipe_after` are still open.

## Commands

```bash
pnpm -C packages/codegen run build                      # separate call — it rm -rf's dist
for g in rust typescript python; do
  pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src \
    >/dev/null 2>&1 && echo "$g OK" || echo "$g FAILED"
done
git diff --stat -- 'rust/crates/*/test-fixtures.json'   # the whitespace gate
for c in rust typescript python; do (cd rust/crates/sittir-$c && pnpm run build); done
pnpm run validate:native
pnpm exec vitest run                                    # its own call
cd rust && cargo test -p sittir-core
```
