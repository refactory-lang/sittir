# Separated-List Options Struct — Implementation Plan

Executes `docs/superpowers/specs/2026-08-21-separated-list-options-struct.md`.
Every slice lands with the standard battery (targeted probes, `validate
history` numbers, full suite, baseline compare); floors are byte-identical
unless a corpus row pins an intentional fidelity change.

Inventory (slice 0, done): flat keys (`_trailing_sep` / `_leading_sep` /
`_separator_kind` / `*_anon` flank matching) live in 10 files (~54 sites) —
wrap/render-module/factories/from/templates emitters, validate/common +
exercise/roundtrip consumers, sittir-core `filters.rs` (flank filters +
`FlankValues`) and `types.rs`. Flank vocabulary (`trailingMode` /
`leadingMode` / `hasTrailing` / `hasLeading` / `SeparatorFlankMode`) spans 14
files (~121 sites) from `types/rule.ts` through link/collect-slots/assemble
to every emitter.

## Slice 1 — model: the delimiter fact

- `DelimiterFlags` bitflag (`none = 0`, `leading = 1`, `trailing = 2`,
  `both = 3`) in the model layer.
- Per-slot PERMISSION stays per-side tri-state (mandatory flanks are
  template text; only `optional` sides contribute permitted bits) but
  renames to the delimiter vocabulary: `SeparatorFlankMode` →
  `DelimiterMode`, `trailingMode`/`leadingMode` →
  `trailingDelimiter`/`leadingDelimiter`, `hasTrailing`/`hasLeading` fold
  into a derived `permittedDelimiters` mask. Renames go through the
  lsp-refactor tooling (project-wide, catches re-exports and type-only
  imports).
- No wire or generated-output change: byte-identical gate.

## Slice 2a — wire: `_delimiter` replaces the flank-key pairs

- Wrap emits one `_delimiter` bitflag (omitted when `none`) per
  separated-list kind and per merged-union list slot, replacing kind-level
  `_trailing_sep`/`_leading_sep` AND field-prefixed `_<field>_*_sep` in the
  same regen (atomic flip — all consumers are in-repo; parity fixtures
  regenerate).
- Transports + `FromNapiValue` decode the flag; `ListNonterminalView`'s
  `leading`/`trailing` are populated from it; the render-side flank filters
  (`joinWithTrailing`/`joinWithLeading`/`joinWithFlanks` + `FlankValues`
  anon matching) consume the flag instead of re-matching captured anon
  text.
- rrp/frp floors byte-identical; corpus rows that pin flank fidelity
  (enum trailing comma) must stay green.

## Slice 2b — wire: `separator` stored only when dynamic

- `_separator_kind` survives only for grammar-dynamic separators, renamed
  `_separator`; fixed-separator lists stop carrying it (statically known —
  template text owns it). Transport `.separator` runtime field keeps
  serving the dynamic case.

## Slice 3 — factories: spread + leading options

- Separated-list factories and `from` become `(options?, ...elements)`;
  leading argument recognized as options by shape (plain object, no
  `$type`, keys ⊆ permitted option keys). Single-slot hoisting: the
  surface hoists to the parent factory through chains of single-slot
  wrappers.
- `$with` setters accept the same options value.
- frp probes gate; factory-map metadata updated.

## Slice 4 — cleanup + ratchets

- Delete `separatedListFactoryOptions` (validator suffix discovery), the
  per-field flank-capture machinery (`emitFieldFlankCaptureLines` reduces
  to the delimiter write), and the `*_anon` matching path.
- `ki-perfield-flank-residual` entry deleted (its five kinds store the
  same struct); S-class ceilings lowered where rows close; audit
  `rg '_\w+_(trailing|leading)_sep' packages/*/src/wrap.ts` must return
  zero.
