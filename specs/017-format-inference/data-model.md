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

/** Residual format metadata on a NodeData node produced from source text. */
export interface FormatRecord {
  boundary?: FormatBoundary;
  slots?: Record<string, FormatSlot>;
  literals?: Record<string, FormatLiteral>;
  trivia?: FormatTrivia[];
}
```

### Addition to `AnyNodeData`

```ts
export interface AnyNodeData {
  // ... existing fields ...
  /** Residual source-format metadata. Present only when source span cannot be
   *  reproduced from template-canonical render + existing $text/$fields/$children.
   *  Populated by readNode when sourceText is provided; absent on factory output. */
  $format?: FormatRecord;
}
```

---

## Format Extractor — `extractFormat`

**Location**: `packages/core/src/format.ts` (new file)

**Signature**:
```ts
export function extractFormat(
  sourceSpan: string,
  canonicalRender: string,
  node: AnyNodeData,
): FormatRecord | undefined
```

**Algorithm**:
1. If `sourceSpan === canonicalRender`, return `undefined` immediately (hot path — no allocation).
2. Compute `boundary`: leading/trailing bytes in `sourceSpan` that do not appear at the same position in `canonicalRender`.
3. Compute `slots`: walk `node.$fields` and `node.$children`; for each position, detect separator deviations and optional-token presence/absence.
4. Compute `literals`: for leaf children where `$text` differs from what `canonicalRender` places at that position.
5. Compute `trivia`: scan `sourceSpan` for comment-syntax bytes; record offset + text.
6. If all four subfields are `undefined`, return `undefined` (no record allocated).

**Determinism**: same `sourceSpan` + same `canonicalRender` + same `node` → same result.

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

## `RenderContext` extension — `ignoreFormat`

**Location**: `@sittir/types/src/core-types.ts` (or the existing `RenderContext` declaration)

```ts
export interface RenderContext {
  // ... existing fields ...
  /** When true, ignore $format on all nodes and render template-canonical.
   *  Default: false (apply $format when present). Satisfies FR-010. */
  ignoreFormat?: boolean;
}
```

---

## `readNode` signature extension

**Location**: `packages/core/src/readNode.ts`

```ts
export function readNode(
  tree: TreeHandle,
  nodeId?: number,
  sourceText?: string,   // NEW — pass full source for format extraction
): AnyNodeData
```

When `sourceText` is `undefined`, `$format` is never populated (backward-compatible).

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
