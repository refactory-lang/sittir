# Contextual alias against a split clone

**Question.** The bindings overlay's `split` gives a kind a name of its own where its context is
unique: rust's `function_item` inside an `impl` or a trait is a `method_declaration`. Today the
split clones the kind's rule. Does a parser `alias()` at the same sites do the same job for less,
with the ancestors toward the placement still cloned?

**Answer.** Yes, for rust's three splits. The alias adds 23 parse states where the clone adds 194.
Every validation row passes either way. Under today's codegen the alias kinds have no builder of
their own, which the maintainer has ruled they get (below).

## Setup

- A worktree of `feat/bindings` at `68a5b8ba2`, with `prototype.patch` applied, `pnpm install`,
  and every grammar's native crate built once.
- `prototype.patch` holds three changes:
  - `split(…, { alias: true })` in `packages/codegen/src/dsl/bind.ts`. The target is not minted;
    each site holds `alias($.<kind>, $.<as>)`, and the ancestors toward the placement are cloned
    as before.
  - Two measurement hooks in `render-module.ts`: `SITTIR_SCRATCH_PAYLOADS` dumps the transport
    names and drops stale payload pins, and `SITTIR_SCRATCH_PINS` reads rust's pins from a file.
  - The overlay's attribute patch on `field_initializer`, moved from `"0/0"` to `"0"` (gap 1).
- `WT=<worktree> run.sh <mode> [out]` configures the mode (`configure.py`), regenerates rust,
  and records the parser's defines (`stats.py`), the generated sizes (`sizes.py`) and the
  `validate counts rust` rows. `results/` holds each mode's output.

Modes:
- `unbound`: the committed grammar without its overlay.
- `nosplit`: the overlay with no splits. This is the baseline the splits are measured against.
- `split`: the overlay's three splits, each a clone.
- `alias`: the same three splits as aliases.

## Results

Deltas are against `nosplit`.

| | nosplit | split | alias |
| --- | --- | --- | --- |
| `STATE_COUNT` | 3531 | +194 (+5.5%) | +23 (+0.65%) |
| `LARGE_STATE_COUNT` | 1040 | +30 | +14 |
| `SYMBOL_COUNT` / `ALIAS_COUNT` | 465 / 4 | +6 / 0 | +4 / +2 |
| `PRODUCTION_ID_COUNT` | 410 | +16 | +18 |
| `parser.c` bytes | 7,202,693 | +276,449 (+3.8%) | +82,731 (+1.1%) |
| generated sources, bytes | 6,901,403 | +219,143 | +151,087 |
| native `.node`, bytes | 7,490,336 | +181,456 | +99,232 |
| rows: from, cov, factory-storage, ir-storage, built-render-parse | 244, 207, 1670, 1375, 1878 | +4, +4, +3, +3, +42 | +2, +2, +3, +3, +28 |

Every row passes in every mode (`Pass` equals `Total`); `read-render-parse` is 148 throughout.
`unbound` has `nosplit`'s states, symbols and rows. The overlay's other parts add fields (80 to
90) and production ids (401 to 410), not states.

## Findings

1. **The alias reads the same.** `method_declaration` (471) and `signature_method_declaration`
   (473) are parser kinds at their sites, so a read's `$type` says method with no placement test,
   and both render through `function_declaration`'s template.
2. **The alias has no builder of its own.** The node model records each in its `fieldAliasMap`,
   `extension_declaration_body.declarations: { method_declaration: function_declaration }`, as it
   records every parser alias of a visible kind: rust's `type_identifier` over `identifier` is
   there too, and has no builder of its own either. The alias kind has no factory, wrap class or
   transport, and a method is built with `ir.functionDeclaration` in that slot. The split's clone
   is a full kind, which is where its extra fixtures and rows come from.
3. **What the alias still costs is the containers.** `extension_declaration_body`,
   `trait_interface_declaration_body` and the two `_declaration_statement` clones must differ from
   `declaration_list` for the alias to sit inside them. Most of the alias's generated growth is
   their render options (`options.rs`, +61,257 bytes).
4. **Three tables do not follow the overlay.** Each is keyed by the base grammar's names or paths,
   and `run.sh` works around each:
   1. *The attribute patch.* The inventory writes `field_initializer: { "0/0": field("attributes") }`,
      which puts the field inside the repeat. Tree-sitter then mints a repeat helper of its own
      beside the one `shorthand_field_initializer`'s `field('attributes', repeat(…))` shares. At
      `Foo { #[a] #` the parser cannot tell the two apart: a reduce/reduce conflict. Fielding the
      repeat (`"0"`) removes it. No other nested patch in the three overlays lands inside a
      repeat. The conflict driver derives resolutions on the base grammar and requires the bound
      one to generate with them, so it reports this as `conflict-resolutions-stale`, whose advice
      (find the input the hash does not cover) does not fit a conflict the overlay introduces.
   2. *An options label.* `'field_initializer/attribute_item:/separator'` is renamed with its kinds
      but not re-addressed once the overlay fields the list. It fails with "names no site" until
      it reads `'field_initializer/attributes:/separator'` (`configure.py` swaps it).
   3. *Payload pins.* `BOXED_PAYLOADS` names the base grammar's transports. Twenty go stale under
      the renames, and the bound grammar needs 22 pinned: the twenty renamed transports, and the two
      split clones. Two more transports (`ImplItemTransport` and
      `AttributedTypeParameterTransport`) exceed the ceiling only while their contents are unboxed.
      `pins-bound.json` is the list that compiles.

## Recommendation

Use the alias for rust's three splits, and give each alias kind its low-level builder beside its
target's (`build.methodDeclaration` beside `build.functionItem`), as the maintainer ruled on
2026-10-09. Today's codegen gives a `fieldAliasMap` kind no builder, so that is work for the
overlay's wiring. With it, a built method and a parsed one agree on `$type`, and a role test reads
`$type` alone.
