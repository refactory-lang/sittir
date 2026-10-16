# @sittir/codegen

The grammar DSL, compiler model, and emitters that derive Sittir's language APIs and native render modules.

The compiler consumes the grammar entry plus tree-sitter's generated metadata, then evaluates, links, normalizes, simplifies, and assembles a canonical model. Emitters derive the TypeScript and Rust artifacts from that model. The active renderer is generated Rust, not a template engine.

Run generation through the workspace CLI:

```sh
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
```

For implementation work, read the [architecture](../../docs/architecture.md), [compiler glossary](../../docs/compiler-phase-glossary.md), [codegen conventions](../../.claude/codegen-conventions.md), and [grammar workflow](../../.claude/grammar-workflow.md). [Development](../../DEVELOPMENT.md#regeneration) owns setup and verification commands.

Generated output is never patched by hand. A missing model fact belongs at its owning phase; a second emitter-specific derivation is a correctness defect.
