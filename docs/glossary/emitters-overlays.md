# `packages/codegen/src/emitters/overlays` — Function Glossary

Per-function reference for `packages/codegen/src/emitters/overlays/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `packages/codegen/src/emitters/overlays/polymorphs.ts::PolymorphWires.bundledKinds`

```text
/** Kinds the bundle exports, so their overlay entry carries a `strict` of its own. */
```

### `packages/codegen/src/emitters/overlays/polymorphs.ts::seatBearing`

```text
/**
 * A child whose own overlay entry carries seats must be reached through that
 * entry, not its raw builder: the raw builder takes the unseated shape, so a
 * mount or seat wired to it would hand a seated argument (a group's config, a
 * tuple) straight to a slot that cannot take it. A seat is also what puts a
 * `strict` on the entry: a wire set of arms alone is a bare mount namespace
 * with none, and a leaf has no `strict` at all because its strict and loose
 * forms are one.
 *
 * A child in a cycle with its parent cannot be declared first, so it keeps
 * its raw builder: the seated form has no spelling that would resolve there.
 */
```

### `packages/codegen/src/emitters/overlays/polymorphs.ts::walkArms`

```text
/** Every arm entry a kind emits, nested ones included, with the key path each sits at. */
```

### `packages/codegen/src/emitters/overlays/polymorphs.ts::composeAcrossSlots`

```text
/**
 * Arms of one slot chain onto arms of another. A kind with two arm-seated
 * slots has to name both in one call — python `except a, b:` needs the
 * exception's `list` and the suite's `block` — and each arm on its own is a
 * whole route wrapping the parent, so a caller could otherwise pick only one.
 * A later slot's arms are emitted again under each earlier arm, applied to it:
 * `ir.exceptClause.exception.list.block.strict(…)`. The applied route needs a
 * name, since a call expression has no `typeof` for the parameter types.
 */
```

### `packages/codegen/src/emitters/overlays/polymorphs.ts::composeSeats`

```text
/**
 * Fold a kind's seats onto its own factory and give the result a name. Every
 * mount route then builds on that name instead of the raw factory, so a mount
 * carries the parent's seats rather than dropping them: `case_clause` seats
 * its patterns as a tuple AND mounts its suite, and both spellings must work
 * in one call.
 */
```

### `packages/codegen/src/emitters/overlays/polymorphs.ts::shape`

#### body

```text
// The parent collapsed to a direct/value factory around some OTHER
// slot (a registered slot never counts toward that classification),
// so `ArgsOf<PF>[0]` is that slot's own value — not a config object
// this arm's key could ever have lived in. This arm's own key must
// itself be a registered slot, set only through the trailing
// options argument the parent factory now takes.
```

#### body

```text
// No key routes to the child, so the partition below would send
// every key to `rest` and hand the child an empty object. Say
// that directly instead of emitting a loop guarded by `false`.
```

### `packages/codegen/src/emitters/overlays/polymorphs.ts::tupleShape`

```text
/**
 * The method behind a tuple seat. The child's whole argument list rides the
 * parent's slot as an array, so a separated list keeps both its options bag
 * and its elements. An already-built child still passes through: an array in
 * that slot is the seated form, anything else is the parent's own input.
 */
```
