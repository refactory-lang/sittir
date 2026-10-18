# Clippy policy

The Rust CI job runs clippy over the whole workspace twice, once without
and once with the default (napi) features:

```sh
cargo clippy --workspace --all-targets --no-default-features -- -D warnings
cargo clippy --workspace --all-targets -- -D warnings
```

Every workspace package and target, including tests, must pass both.
Clippy is installed explicitly with the stable Rust toolchain.

## Lints

The root `Cargo.toml` sets the lints in `[workspace.lints.clippy]`, and
every crate, the generated grammar crates included, opts in with
`[lints] workspace = true`. CI's `-D warnings` makes every `warn` blocking.

- The `pedantic` group is on, minus five lints that don't fit, each with
  its reason beside it in `Cargo.toml`: `match_same_arms`,
  `too_many_lines`, `missing_errors_doc`, `struct_excessive_bools` and
  `similar_names`.
- Eight more: `undocumented_unsafe_blocks` (every `unsafe` block carries a
  `// SAFETY:` comment), `allow_attributes_without_reason` (every `allow`
  carries a `reason`), `redundant_clone`, `clone_on_ref_ptr`,
  `debug_assert_with_mut_call`, `dbg_macro`, `todo` and `unimplemented`.

Ordinary warnings are fixed in authored Rust or in the generator, then
regenerated. Generated output is never patched by hand. Numeric scalar
admission patterns use ranges only for exact consecutive ids. The options
emitter keeps a struct default update only when it leaves indentation
unspecified. List lengths use the value expression while list views borrow
that same value.

Generated `node.rs` allows, at module level with a reason, the lints its
uniform signatures trip: every render function takes its node by reference
and returns `RenderResult`, and every conversion into `AnyNode` takes its
node by value, whatever one body needs.

## Numeric crossings

A narrowing `as` cast appears in exactly two places, each with a reason:

- `types::narrow` turns a `usize` that tree-sitter produced (a byte
  offset, descendant index or count), or that lies within a source it
  parsed, into the `u32` sittir stores. tree-sitter keeps all of them as
  `uint32_t`, so nothing is lost.
- `types::exact_whole` reads a JavaScript number as the whole number it
  holds, refusing a non-finite, negative, fractional or inexact one. Every
  napi number that crosses in as an integer goes through it, then through
  `TryFrom` into its width.

Everything else converts with `From`/`TryFrom` or byte-level methods
(`to_le_bytes`).

Two narrow `large_enum_variant` exceptions preserve intentional allocation
decisions:

- Generated `node.rs` uses the canonical payload ceiling and pinned
  boxed types from `packages/codegen/src/emitters/boxed-payloads.ts`.
  Generated compile-time assertions require unboxed payloads to stay at or
  below that ceiling and pinned payloads to remain above it. The module
  allowance leaves those checks intact and adds no new boxing.
- Core's private `FieldValueItem` is a transient untagged serde decoding
  value. Its consumers move the node out immediately; boxing solely for
  this lint would add a temporary allocation. This exception stays on that
  enum alone. The outgoing untyped-reader representation remains governed
  by the reader migration, not by this lint cleanup.

The workspace minimum is Rust 1.90. Tree-id allocation uses a bounded
compare-and-swap loop because `fetch_update` is deprecated on newer Rust,
while its replacement `try_update` requires Rust 1.95. Exhaustion and
concurrent uniqueness tests guard the allocation contract.

## tree-sitter crossings

`clippy.toml` disallows the tree-sitter methods whose values cross into
sittir's types, and each has one sanctioned wrapper in `sittir_core`
carrying the only `#[allow(clippy::disallowed_methods)]` for it:

- kinds cross as `KindId`: `read::grammar_id`, `read::display_id`,
  `read::kind_name`, `read::kind_named`;
- fields cross as `FieldId`: `read::field_id`, `read::child_by_field`,
  `read::field_name`;
- nodes cross as `NodeIndex`: `read::index_of`, `read::offset_of`,
  `read::goto`;
- counts cross as `u32`: `read::descendant_count`;
- byte offsets cross as `u32`: `types::Span::of`, with `Span::range` to
  slice.

Every flag table, edge row, seat table and node is keyed by the grammar id
(`grammar_id()`); `kind_id()` is the parser's display symbol, which differs
for hidden and aliased nodes, so keying a table with it silently misses.
Call `display_id` only where an alias envelope is meant (a node's
`display` field, a search that accepts either spelling, the node
expansion's variant match); everything else uses `grammar_id()`. The node
macro expands to `display_id`, never to `kind_id`.
