# Data Model: Override-Compiled Parser

**Feature**: 007-override-compiled-parser
**Date**: 2026-04-15

## Entities

### ParserCache

Represents a compiled WASM parser artifact cached in `.sittir/`.

| Field | Type | Description |
|-------|------|-------------|
| grammarName | string | Grammar identifier (e.g., `python`, `rust`, `typescript`) |
| wasmPath | string | Absolute path to `.sittir/parser.wasm` |
| sourceGrammarPath | string | Path to `.sittir/grammar.js` (transpiled override grammar) |
| nodeTypesPath | string | Path to `.sittir/node-types.json` (override field labels) |
| sourceMtime | number | mtime of `overrides.ts` at compilation time |
| wasmMtime | number | mtime of `parser.wasm` |

**Validation Rules**:
- Cache is valid when `wasmMtime > sourceMtime`
- Cache miss triggers: `tree-sitter generate` → `tree-sitter build --wasm`
- WASM artifact is platform-independent (no OS/arch key needed)
- `.sittir/` directory and all generated artifacts are gitignored

**State Transitions**:
```
[No Cache] → tree-sitter generate + build --wasm → [Cached]
[Cached, valid] → codegen run → [Reused]
[Cached, stale] → overrides.ts touched → tree-sitter generate + build --wasm → [Cached]
[Cached] → manual delete → [No Cache]
```

### NestedAliasPolymorph

A polymorphic rule converted to nested-alias form in `overrides.ts`.

| Field | Type | Description |
|-------|------|-------------|
| parentKind | string | The original rule name (e.g., `assignment`) |
| variants | VariantAlias[] | List of alternative shapes, each with a variant name |

### VariantAlias

| Field | Type | Description |
|-------|------|-------------|
| variantName | string | Globally unique name for this variant (e.g., `simple_assignment`) |
| choiceIndex | number | Index in the parent rule's top-level choice |
| fields | string[] | Field names specific to this variant shape |

**Validation Rules**:
- `variantName` must be globally unique across the grammar (no collision with existing kind names)
- `parentKind` is preserved as the outer parse-tree node type
- `variantName` appears as the child node type for discrimination

### InferredFieldSuggestion

Output of the suggestion-only `inferFieldNames` analysis (post-cleanup).

| Field | Type | Description |
|-------|------|-------------|
| symbol | string | The symbol reference being analyzed |
| suggestedName | string | Consensus field name from parent rules |
| confidence | number | Agreement ratio (0.0–1.0, threshold: 0.8) |
| sampleSize | number | Number of parent rules referencing this symbol |
| parentRules | string[] | List of parent rule names where this symbol appears |

**Validation Rules**:
- Only symbols with `confidence >= 0.8` and `sampleSize >= 5` are surfaced
- This is read-only output — never mutates rules

## Relationships

```
ParserCache 1──1 Grammar (python|rust|typescript)
Grammar 1──* NestedAliasPolymorph
NestedAliasPolymorph 1──* VariantAlias
Grammar 1──* InferredFieldSuggestion (suggestion-only output)
```

## Key Design Constraints

1. **Single source of truth**: Override-compiled `node-types.json` is the authoritative field registry. Link's analysis becomes advisory.
2. **Backward compatibility**: Parse-tree node `type` at outer level matches pre-override kind names. ast-grep rules continue to match.
3. **No runtime promotion**: readNode reads fields directly from parse tree. No unnamed-child-to-field inference at wrap time.
