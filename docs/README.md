# Documentation

The README and usage guide describe the API on `master`. Design documents describe intent and may include work that is not implemented. An accepted design is not evidence that its entire API is available.

## Using Sittir

- [Project overview](../README.md)
- [Usage guide](use-cases-and-examples.md)
- [Runnable examples](../examples/README.md)
- [Rust](../packages/rust/README.md), [TypeScript](../packages/typescript/README.md), [Python](../packages/python/README.md), [regex](../packages/regex/README.md), and [SCM](../packages/scm/README.md)
- [Shared types](../packages/types/README.md)

## Contributing

- [Development](../DEVELOPMENT.md): setup, test commands, native builds, and regeneration
- [Architecture](architecture.md): compiler and runtime boundaries
- [Project instructions](../CLAUDE.md): shared rules for contributors and agents
- [Design principles](design-principles.md)
- [Clippy policy](clippy-policy.md)

## Reference

- [Compiler overview](compiler-phase-glossary.md)
- [Function glossaries](glossary/README.md)
- [CLI command reference](cli-command-glossary.md)
- Grammar authoring glossaries: [Rust](rust-grammar-sittir-glossary.md), [TypeScript](typescript-grammar-sittir-glossary.md), [Python](python-grammar-sittir-glossary.md), [regex](regex-grammar-sittir-glossary.md), [SCM](scm-grammar-sittir-glossary.md)

Generated references should be refreshed through their generator. They are not alternate places to author API behavior.

## Portable preview

The [portable preview](use-cases-and-examples.md#portable-preview) is available behind `api: 'portable'` for languages with bindings. It currently exposes vocabulary kinds and guards over grammar-specific nodes.

## Planned work

Portable node projections, readers, builders, and construction-template APIs remain planned; an internal type declaration alone does not establish runtime availability. The executable examples pin the implemented surface.

For open defects and their disposition, use [GitHub issues](https://github.com/refactory-lang/sittir/issues). For measured coverage and exclusions, use the committed native baseline and the validator reports described in [Development](../DEVELOPMENT.md#validation).
