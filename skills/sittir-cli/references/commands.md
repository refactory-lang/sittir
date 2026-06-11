# Commands

## gen

Generate typed factories, templates, and native bindings from a grammar

```
[options]
```

### Options

#### --grammar

Grammar to operate on

**Type:** `string`

**Required:** yes

#### --output

Output directory

**Type:** `string`

**Required:** yes

#### --nodes

Comma-separated node kinds to generate

**Type:** `string`

**Required:** yes

#### --all

Generate TS + native render-module artifacts (full chain)

**Type:** `boolean`

#### --tests-dir

Output directory for test files

**Type:** `string`

**Required:** yes

#### --transpile

Transpile overrides.ts → .sittir/grammar.js

**Type:** `boolean`

#### --compile-parser

Compile override grammar to .sittir/parser.wasm

**Type:** `boolean`

#### --ts-generate

Run 'tree-sitter generate' in .sittir/

**Type:** `boolean`

#### --skip-ts-chain

Skip the auto transpile + tree-sitter generate chain

**Type:** `boolean`

#### --roundtrip

Run validator probes after generation

**Type:** `boolean`

#### --no-build-native

Skip the post-regen N-API rebuild

**Type:** `boolean`

#### --no-emit-diff

Suppress the post-regen emit diff

**Type:** `boolean`

#### --allow-diagnostic

Allow a blocking grammar diagnostic (repeatable)

**Type:** `string`

**Required:** yes

## validate

Validation utilities for sittir grammar packages

```
[options] [command]
```

## tool

Developer diagnostics

```
[options] [command]
```