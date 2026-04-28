# Data Model: Format Inference (017)

## `$format` Record — `FormatRecord`

Defined in `@sittir/types/src/core-types.ts`. Added as an optional field on `AnyNodeData`.

All subfields are optional. A node with no format delta has `$format` omitted entirely (`undefined` on `AnyNodeData`). An absent `$format` means "this node's source is byte-equal to its template-canonical render plus its existing `$text`/`$fields`/`$children` values".

```ts
/** Leading/trailing bytes around the canonical body of a node's span. */
export interface FormatBoundary {
  /** Bytes before the canonical body — indent, preceding blank lines. */
  leading?: string;
  /** Bytes after the canonical body — trailing newline, blank lines. */
  trailing?: string;
}

/**
 * Per-position separator/optional-token override.
 * Key: field name (raw snake_case) or child-array index as string.
 */
export interface FormatSlot {
  /** Separator override (e.g. ",\n  " vs ", "). */
  sep?: string;
  /** Trailing comma/separator present (true) or absent (false/undefined). */
  trailingPresent?: boolean;
  /** Optional token omitted in source (e.g. semicolon absent). */
  absent?: boolean;
}

/**
 * Literal-spelling override for a leaf node.
 * Key: field name or "$text" for the node's own text.
 */
export interface FormatLiteral {
  /** Exact source spelling — overrides `$text` at render time. */
  raw: string;
}

/** A single trivia item (comment or blank line) with position in the span. */
export interface FormatTrivia {
  /** Byte offset within the enclosing node's span (relative to span start). */
  offset: number;
  /** Verbatim text of the comment or blank-line sequence. */
  text: string;
}

/** Residual format metadata for a tree or a specific node kind. */
export interface FormatRecord {
  boundary?: FormatBoundary;
  slots?: Record<string, FormatSlot>;
  literals?: Record<string, FormatLiteral>;
  trivia?: FormatTrivia[];
  /**
   * Per-kind format overrides. Key is the raw node kind (e.g. "function_item").
   * Render lookup: node.$format ?? kinds[node.$type] ?? parent FormatRecord.
   * Entries here share the same FormatRecord shape; nesting beyond one level
   * is valid but the render path resolves only one level deep.
   */
  kinds?: Record<string, FormatRecord>;
}
```

### Addition to `AnyNodeData` (user-supplied inline override only)

```ts
export interface AnyNodeData {
  // ... existing fields ...
  /** Per-node format override. Set by callers to override the tree-level format
   *  (ctx.format) for this specific node. Never set by inference — inferred format
   *  lives on TreeHandle.format. Absent on all factory and readNode output. */
  $format?: FormatRecord;
}
```

---

## Format Extractor — `extract_format` (Rust-only)

**Location**: `rust/sittir-core/src/format.rs`

**Signature** (Rust):
```rust
pub fn extract_format(source: &str, tree: &Tree) -> Option<FormatRecord>
```

**Algorithm**:
1. Walk the tree once, collecting style samples: indent widths, separator spellings, optional-token presence/absence, quote characters, trivia patterns.
2. Compute consensus values for each `FormatRecord` subfield from the collected samples.
3. If all subfields are `None` / empty (source is already template-canonical), return `None` (no allocation).
4. Return the consensus `FormatRecord`.

The result is stored on `TreeHandle.format`. It is **not** stored per-node.

**Determinism**: same `source` + same grammar version → same result.

---

## Format Applier — `applyFormat`

**Location**: `packages/core/src/format.ts`

**Signature**:
```ts
export function applyFormat(
  canonicalRender: string,
  format: FormatRecord,
): string
```

**Algorithm**:
1. Apply `boundary.leading` (prepend) and `boundary.trailing` (append).
2. For each entry in `slots`: adjust separator at the appropriate position in the canonical string; insert or remove optional tokens.
3. For each entry in `literals`: substitute the `raw` spelling at the appropriate position.
4. Insert `trivia` items at their recorded byte offsets.
5. Return the reconstructed string.

---

### `TreeHandle` extension — `format`

**Location**: `packages/core/src/readNode.ts`

The inferred format record is stored on the tree handle itself — one record per parsed file.

```ts
export interface TreeHandle {
  // ... existing fields ...
  /**
   * Format record inferred from the source file by the native Rust reader.
   * Absent on trees produced by the JS reader (readNode never sets this).
   * Callers can also set this manually to apply a house-style config.
   */
  format?: FormatRecord;
}
```

---

## `RenderContext` extension

**Location**: `packages/core/src/render.ts` (or `@sittir/types`)

```ts
export interface RenderContext {
  // ... existing fields ...
  /** Tree-level format record. The render path resolves format for each node as:
   *    node.$format                      // per-node inline override (highest priority)
   *    ?? ctx.format?.kinds?.[node.$type] // per-kind entry on the tree-level record
   *    ?? ctx.format                      // tree-level default
   *    ?? undefined                       // template-canonical fallback
   *  Per-node `node.$format` overrides this when both are present.
   *  When absent (and node.$format absent), template-canonical output is used. */
  format?: FormatRecord;
  /** When true, ignore all format records and render template-canonical.
   *  Default: false (apply format when present). Satisfies FR-010. */
  ignoreFormat?: boolean;
}
```

Callers populate `ctx.format` from `treeHandle.format` when they want format-preserving rendering.

---

## Format Corpus Manifest — `format-corpus.json`

**Location**: `specs/017-format-inference/format-corpus.json`

**JSON Schema** defined in `specs/017-format-inference/contracts/format-corpus.schema.json`.

```jsonc
{
  "fixtures": [
    {
      "id": "rust-tab-indent-trailing-comma",
      "grammar": "rust",
      "category": "whitespace",        // whitespace | separators | optional-tokens | literals | trivia
      "seedSource": "017-measured",    // "016-deferred" | "017-measured"
      "expectedBackendCoverage": "typescript", // "typescript" | "both"
      "fixturePath": "tests/format-roundtrip/fixtures/rust-tab-indent.rs"
    }
  ]
}
```

Fields:
- `id`: unique kebab-case identifier
- `grammar`: `"rust"` | `"typescript"` | `"python"`
- `category`: format dimension under test
- `seedSource`: origin — `"016-deferred"` (carried over from 016's deferred set) or `"017-measured"` (new)
- `expectedBackendCoverage`: `"typescript"` (P1) or `"both"` (P2 — requires native backend)
- `fixturePath`: path to the source file used as the roundtrip fixture
