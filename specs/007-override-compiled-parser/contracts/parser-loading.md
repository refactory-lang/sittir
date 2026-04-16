# Contract: Parser Loading & Compilation

**Feature**: 007-override-compiled-parser
**Date**: 2026-04-15

## compile-parser.ts — Public API

### `compileParser(grammarDir: string, options?: CompileOptions): Promise<string>`

Compiles the override grammar in `grammarDir/.sittir/` to a WASM parser, returning the path to the `.wasm` file.

**Input**:
- `grammarDir`: Absolute path to the grammar package (e.g., `packages/python`)
- `options.force`: Skip mtime check and always recompile (default: false)

**Output**: Absolute path to the compiled `.wasm` file

**Behavior**:
1. Check `grammarDir/.sittir/grammar.js` exists (error if not — overrides not transpiled)
2. Check `grammarDir/.sittir/parser.wasm` exists and has `mtime > grammar.js mtime`
3. If cache valid and `force` is false: return wasm path immediately
4. Otherwise: run `tree-sitter generate` in `.sittir/` to produce `src/parser.c` + `node-types.json`
5. Then run `tree-sitter build --wasm` to produce `parser.wasm`
6. Return wasm path

**Error Cases**:
- Missing `.sittir/grammar.js` → throw with message directing user to run transpile first
- `tree-sitter generate` failure → throw with full stderr attached
- `tree-sitter build --wasm` failure → throw with full stderr (likely Emscripten not installed)
- Missing `tree-sitter` CLI → throw with install instructions

### `loadOverrideParser(grammarDir: string): Promise<{ Parser: TSParserCtor; Language: TSLanguageCtor; lang: TSLanguage }>`

Compiles (if needed) and loads the override parser for use in validators.

**Input**: `grammarDir` — same as above

**Output**: Initialized parser ready for `parser.setLanguage(lang); parser.parse(source)`

**Behavior**:
1. Call `compileParser(grammarDir)`
2. Call `loadWebTreeSitter()` from `validators/common.ts`
3. Call `Language.load(wasmPath)` with the compiled WASM
4. Return `{ Parser, Language, lang }`

## Override node-types.json — Data Contract

After `tree-sitter generate`, `.sittir/node-types.json` contains the field registry for the override grammar. This replaces the base grammar's `node-types.json` as the source of truth for field coverage.

**Structure**: Same as standard tree-sitter `node-types.json` — array of node type objects with `type`, `named`, `fields`, `children` properties.

**Key Difference**: Override fields (from `transform()` patches) appear as first-class entries in `fields`. Example:

```json
{
  "type": "conditional_expression",
  "named": true,
  "fields": {
    "body": { "multiple": false, "required": true, "types": [...] },
    "condition": { "multiple": false, "required": true, "types": [...] },
    "alternative": { "multiple": false, "required": true, "types": [...] }
  }
}
```

These fields exist because `overrides.ts` declares `transform(original, { 0: field('body'), 2: field('condition'), 4: field('alternative') })`.

## Nested-Alias Parse Tree Contract

For a polymorphic rule converted to nested-alias form:

**Parse tree structure**:
```
(parent_kind        ← outer node, type = original kind name
  (variant_name     ← inner node, type = variant alias name
    (field_a: ...)  ← variant-specific fields
    (field_b: ...)))
```

**ast-grep compatibility**: Rules matching `parent_kind` by type continue to match. The outer node's type is unchanged.

**Factory discrimination**: Factories check `node.children[0].type` to determine which variant, replacing `_inferBranch` field-set heuristics.
