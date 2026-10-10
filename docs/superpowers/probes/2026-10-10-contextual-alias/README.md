# Contextual alias against a split clone

**Question.** The bindings overlay's `split` gives a kind a name of its own where its context is
unique: rust's `function_item` inside an `impl` or a trait is a `method_declaration`. Today the
split clones the kind's rule. Does a parser `alias()` at the same sites do the same job for less,
with the ancestors toward the placement still cloned? And for python's method in a class body,
which needs five clones on the way to its site, and for its decorated method, which sits at
another site?

**Answer.** Yes, for rust's three splits. The alias adds 23 parse states where the clone adds 194.
Every validation row passes either way. Python's method alias adds 14 states (+0.60%), and every
row holds once the validator locates an alias kind by its grammar kind (gap 5). Aliasing the
decorated method too adds 3 states more (17, +0.73%, in all) and one clone, and every row still
holds. Under today's codegen the alias kinds have no builder of their own, which the maintainer
has ruled they get (below).

## Setup

- A worktree of `feat/bindings` at `68a5b8ba2`, with `prototype.patch` applied, `pnpm install`,
  and every grammar's native crate built once.
- `prototype.patch` holds five changes:
  - `split(…, { alias: true })` in `packages/codegen/src/dsl/bind.ts`. The target is not minted;
    each site holds `alias($.<kind>, $.<as>)`, and the ancestors toward the placement are cloned
    as before.
  - Two measurement hooks in `render-module.ts`: `SITTIR_SCRATCH_PAYLOADS` dumps the transport
    names and drops stale payload pins, and `SITTIR_SCRATCH_PINS` reads the generated grammar's
    pins from a file.
  - `SITTIR_SCRATCH_LENIENT_READ_TESTS` in the portable read tests: a claim the overlay leaves
    unaddressed is a warning, not a failure (gap 4).
  - The validator's same-span locator also matches a node's grammar kind (gap 5).
  - The overlay's attribute patch on `field_initializer`, moved from `"0/0"` to `"0"` (gap 1).
- `WT=<worktree> [GRAMMAR=python] run.sh <mode> [out]` configures the mode (`configure.py`),
  regenerates the grammar, and records the parser's defines (`stats.py`), the generated sizes
  (`sizes.py`) and the `validate counts` rows. `results/` holds each mode's output; python's files
  are prefixed `python-`, and python's runs make the read tests lenient.

Modes:
- `unbound`: the committed grammar without its overlay.
- `nosplit`: the overlay with no splits. This is the baseline the splits are measured against.
- `split`: the overlay's splits, each a clone.
- `alias`: the same splits as aliases.
- `alias-decorated` (python): the alias splits, and a second that reaches a decorated method.

Rust's splits are `splits-block.txt`, three of them. Python's is `splits-block-python.txt`:
`function_definition` within `block`, `suite_block` and `class_definition`, as
`method_declaration`, with its clones named by the split (`containers: []`), so no clone gains a
field. `splits-block-python-decorated.txt` adds the same split within `decorated_definition` first:
it reuses the first split's clones and clones `decorated_definition` as well. A mode with a pins
file of its own (`pins-bound-python-alias-decorated.json`) reads it in place of the grammar's.

## Results

Deltas are against `nosplit`.

### Rust

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

### Python

| | unbound | nosplit | alias | alias-decorated |
| --- | --- | --- | --- | --- |
| `STATE_COUNT` | 2319 | 2319 | +14 (+0.60%) | +17 (+0.73%) |
| `LARGE_STATE_COUNT` | 328 | 328 | +5 | +5 |
| `SYMBOL_COUNT` / `ALIAS_COUNT` | 335 / 5 | 335 / 5 | +4 / +1 | +5 / +1 |
| `PRODUCTION_ID_COUNT` | 177 | 181 | +1 | +2 |
| rules | 215 | 215 | +5 | +6 |
| `parser.c` bytes | 3,220,417 | 3,483,019 | +52,950 (+1.5%) | +57,759 (+1.7%) |
| generated sources, bytes | 4,371,361 | 4,616,126 | +72,617 | +108,048 |
| native `.node`, bytes | 5,217,488 | 5,233,856 | +49,472 | +82,432 |
| rows: from, cov, factory-storage, ir-storage | 180, 147, 1404, 1387 | 178, 145, 1404, 1387 | +2, +2, +6, +6 | +4, +4, +10, +7 |
| built-render-parse: pass / AST match | 1284 / 1284 | 1286 / 1284 | same | same |
| read-render-parse of 116: pass / AST match | 115 / 115 | 115 / 114 | same | same |

The alias changes no failing row. What `nosplit` loses against `unbound` is python's overlay, not
the split: its lambda alias reads as a second `lambda_expression`, which the validator reports as
`lambda_expression ≠ lambda_expression` in read-render-parse and built-render-parse, and two kinds
leave the from and cov rows. Python's `split` mode does not generate: the clone takes away the
conflicts that justify two of python's `rules:` entries (`primary_expression`, `string_content`),
and codegen refuses them as `rule-reauthored-without-cause`. It was not pursued, since the alias
is the mechanism ruled for rust.

`alias-decorated` parses a decorated method in a class body as `method_declaration`, under
`decorated_definition_class_declaration`, a visible clone whose `definition` admits
`class_declaration` and `method_declaration`. An undecorated method parses as before, and a
decorated function outside a class stays a `function_declaration` under `decorated_definition`.
With the alias in a visible kind's field, `method_declaration` gains types, a wrap function and a
transport. The transport is over the payload ceiling, so the mode pins it. Pinning it alone keeps
the two containers that hold it, the clone and `_compound_statement`'s class-body clone, within
the ceiling, and pinning them as well fails as within it. The alias kind still has no factory.
The read tests give the same twelve warnings as in `alias`.

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
   their render options (`options.rs`, +61,257 bytes). Python's alias clones five rules, from the
   class's `_suite` down to `_compound_statement`; two are visible, `suite_block_class_declaration`
   and `block_statement_class_declaration`, so a class body is a block kind of its own.
4. **A decorated method needs a second split.** The first split's site is `_compound_statement`
   in the class body. A decorated method sits in `decorated_definition`'s `definition`, another
   site, so the first split leaves it a `function_declaration`. A second split, within
   `decorated_definition` first, reaches it (`alias-decorated`). The decorated definition in a
   class body is then a kind of its own, as the class body's block is. So the bindings' container
   claim on `decorated_definition` must reach the clone, through its base or a claim of its own,
   to hand the method its decorators and set `static` from `@staticmethod`.
5. **Five tables do not follow the overlay.** Each is keyed by the base grammar's names or paths,
   and `run.sh` works around each:
   1. *The attribute patch* (rust). The inventory writes
      `field_initializer: { "0/0": field("attributes") }`, which puts the field inside the
      repeat. Tree-sitter then mints a repeat helper of its own beside the one
      `shorthand_field_initializer`'s `field('attributes', repeat(…))` shares. At `Foo { #[a] #`
      the parser cannot tell the two apart: a reduce/reduce conflict. Fielding the repeat (`"0"`)
      removes it. No other nested patch in the three overlays lands inside a repeat. The conflict
      driver derives resolutions on the base grammar and requires the bound one to generate with
      them, so it reports this as `conflict-resolutions-stale`, whose advice (find the input the
      hash does not cover) does not fit a conflict the overlay introduces.
   2. *An options label* (rust). `'field_initializer/attribute_item:/separator'` is renamed with
      its kinds but not re-addressed once the overlay fields the list. It fails with "names no
      site" until it reads `'field_initializer/attributes:/separator'` (`configure.py` swaps it).
   3. *Payload pins.* `BOXED_PAYLOADS` names the base grammar's transports. In rust, twenty go
      stale under the renames, and the bound grammar needs 22 pinned: the twenty renamed
      transports, and the two split clones. Two more transports (`ImplItemTransport` and
      `AttributedTypeParameterTransport`) exceed the ceiling only while their contents are
      unboxed. `pins-bound.json` is the list that compiles. In python, nine of the seventeen pins
      are renamed and the clones need none (`pins-bound-python.json`). The decorated method's
      alias needs one more, `MethodDeclarationTransport` (`pins-bound-python-alias-decorated.json`).
   4. *Read tests* (python). The portable emitter tests a claim's predicates along the base
      grammar's slots. The constant claims compare `left`, which the overlay renames `name`
      (`assignment_type`, `assignment_typed`, `variable_declaration`), and the static and class
      method claims reach the decorator by its base kind, `decorator`, which the overlay renames
      `decorator_attribute`. Codegen refuses all five claims; run leniently, they are the same twelve
      warnings in every mode.
   5. *The validator's locator.* `findNodeBySpanOfKind` finds a read node's CST node by its span
      and its display kind. An alias kind's display name is not the kind the read reports, its
      grammar kind, so the lookup falls back to the outermost node with that span. A python block
      has no delimiters, so that node is the class body's block, and three read-render-parse AST
      matches fail. Matching the grammar kind as well restores them. Rust never hit it: its bodies
      have braces, so the outermost node with the method's span is the method.

## Recommendation

Use the alias for rust's three splits and for python's method in a class body, decorated or not:
the maintainer ruled python's on these numbers holding, and they hold. Give each alias kind its low-level builder
beside its target's (`build.methodDeclaration` beside `build.functionDeclaration`,
`function_item`'s and `function_definition`'s bound name), as the maintainer ruled on 2026-10-09.
Today's codegen gives a `fieldAliasMap` kind no builder, so that is work for the overlay's wiring,
with gaps 1 to 5. With it, a built method and a parsed one agree on `$type`, and a role test reads
`$type` alone.
