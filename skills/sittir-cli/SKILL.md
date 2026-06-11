---
description: "Unified sittir command-line surface — codegen, validation, and tooling commands Also: sittir, cli, codegen, validate, tools, commander."
name: sittir-cli
---

# sittir-cli

Unified sittir command-line surface — codegen, validation, and tooling commands

## Commands

### gen

Generate typed factories, templates, and native bindings from a grammar

**Usage:**
```
[options]
```

| Flag | Type | Required | Default | Env | Description |
| --- | --- | --- | --- | --- | --- |
| `--grammar` / `-g` | `string` | yes | — | — | Grammar to operate on |
| `--output` / `-o` | `string` | yes | — | — | Output directory |
| `--nodes` / `-n` | `string` | yes | — | — | Comma-separated node kinds to generate |
| `--all` / `-a` | `boolean` | no | — | — | Generate TS + native render-module artifacts (full chain) |
| `--tests-dir` | `string` | yes | — | — | Output directory for test files |
| `--transpile` | `boolean` | no | — | — | Transpile overrides.ts → .sittir/grammar.js |
| `--compile-parser` | `boolean` | no | — | — | Compile override grammar to .sittir/parser.wasm |
| `--ts-generate` | `boolean` | no | — | — | Run 'tree-sitter generate' in .sittir/ |
| `--skip-ts-chain` | `boolean` | no | — | — | Skip the auto transpile + tree-sitter generate chain |
| `--roundtrip` | `boolean` | no | — | — | Run validator probes after generation |
| `--no-build-native` | `boolean` | no | — | — | Skip the post-regen N-API rebuild |
| `--no-emit-diff` | `boolean` | no | — | — | Suppress the post-regen emit diff |
| `--allow-diagnostic` | `string` | yes | — | — | Allow a blocking grammar diagnostic (repeatable) |

### validate

Validation utilities for sittir grammar packages

**Usage:**
```
[options] [command]
```

### tool

Developer diagnostics

**Usage:**
```
[options] [command]
```

## References

Load these on demand — do NOT read all at once:

- When using CLI commands → read `references/commands.md` for flags, arguments, and defaults

## Links

- [Repository](https://github.com/refactory-lang/sittir)