# Clippy policy

The Rust CI job runs:

```sh
cargo clippy --workspace --all-targets --no-default-features -- -D warnings
```

Every selected workspace package and target, including tests, must pass.
This command does not claim all-features coverage.
Clippy is installed explicitly with the stable Rust toolchain.

Ordinary warnings are fixed in authored Rust or in the generator, then
regenerated. Generated output is never patched by hand. Numeric scalar
admission patterns use ranges only for exact consecutive ids. The options
emitter keeps a struct default update only when it leaves indentation
unspecified. List lengths use the value expression while list views borrow
that same value.

Two narrow `large_enum_variant` exceptions preserve intentional allocation
decisions:

- Generated `transport.rs` uses the canonical payload ceiling and pinned
  boxed types from `packages/codegen/src/emitters/boxed-payloads.ts`.
  Generated compile-time assertions require unboxed payloads to stay at or
  below that ceiling and pinned payloads to remain above it. The module
  allowance leaves those checks intact and adds no new boxing.
- Core's private `FieldValueItem` is a transient untagged serde decoding
  value. Its consumers move the node out immediately; boxing solely for
  this lint would add a temporary allocation. This exception stays on that
  enum alone. The outgoing untyped-reader representation remains governed
  by the reader migration, not by this lint cleanup.

The workspace minimum remains Rust 1.88. Tree-id allocation uses a bounded
compare-and-swap loop because `fetch_update` is deprecated on newer Rust,
while its replacement `try_update` requires Rust 1.95. Exhaustion and
concurrent uniqueness tests guard the allocation contract.
