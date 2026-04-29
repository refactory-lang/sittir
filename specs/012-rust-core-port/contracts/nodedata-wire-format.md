# Contract — Primitive NodeData wire format

**Version**: 1 (MVP)
**Governed by**: Spec FR-005a, FR-010, clarification Q1 (2026-04-22)

The JSON shape that crosses the JS↔Rust boundary for read operations. Exactly 8 `$`-prefixed top-level fields.

---

## Fields

| Field       | Type                                | Required?    | Elision rule                                             | Source                                                        |
| ----------- | ----------------------------------- | ------------ | -------------------------------------------------------- | ------------------------------------------------------------- |
| `$type`     | `string`                            | **required** | never elided                                             | tree-sitter node kind                                         |
| `$source`   | `"ts" \| "sg" \| "factory"`         | **required** | never elided                                             | `"ts"` from `readNode`; others on Rust input side             |
| `$named`    | `boolean`                           | **required** | never elided                                             | tree-sitter `node.is_named()`                                 |
| `$fields`   | `{ [rawName: string]: FieldValue }` | optional     | elided when map is empty or absent                       | tree-sitter `field_name_for_child()` lookup                   |
| `$children` | `NodeData[]`                        | optional     | elided when list is empty or absent                      | tree-sitter child traversal                                   |
| `$text`     | `string`                            | optional     | elided unless node is a leaf (or literal-only)           | `node.utf8_text(source)`                                      |
| `$span`     | `{ start: u32, end: u32 }`          | optional     | elided when absent (always present from Rust `readNode`) | tree-sitter `node.byte_range()`                               |
| `$nodeId`   | `u32`                               | optional     | elided when not applicable                               | Rust-side tree identity (for drill-in via `readNode(nodeId)`) |

### `FieldValue` union

```ts
type FieldValue =
	| NodeData // single field
	| NodeData[] // repeat field
	| string; // inline literal positions (anonymous tokens)
```

Resolved by serde's `#[serde(untagged)]` — the deserializer tries each variant in order and picks the first that matches.

### `$span`

```json
{ "start": 42, "end": 57 }
```

Both values are UTF-8 byte offsets into the source string. Consistent with tree-sitter and ast-grep conventions.

---

## Forbidden on the wire

The following fields MUST NOT appear on the Rust-emitted wire shape. They are enrichment-layer concerns added by the TypeScript `readTreeNode` / `_wrapTable` / factory pipeline.

| Field                           | Why not on the wire                            |
| ------------------------------- | ---------------------------------------------- |
| `$variant`                      | Derived by TS enrichment from child structure  |
| `$raw`                          | Redundant (`source.slice(span)`)               |
| `$startByte` / `$endByte`       | Combined into `$span`                          |
| `$kindId`                       | Integer variant of `$type`; not needed for MVP |
| Any promoted-keyword flags      | Computed by TS enrichment                      |
| Any supertype-membership labels | Computed by TS enrichment                      |

This is enforced by the serde struct definition (no extra fields) and tested via SC-007 (spec success criterion: zero derived fields on Rust output).

---

## Invariants

1. **`$type` uniqueness**: within a single grammar, each `$type` value corresponds to exactly one template in the render crate. `$variant` (enrichment-added) disambiguates forms on the TS consumer side but is not used for template dispatch — see FR-011.
2. **Field-name casing**: keys in `$fields` are raw (snake_case) names as they appear in `grammar.json` / `node-types.json`. Templates reference them as-is. **Do not** camelCase them.
3. **Leaf definition**: a node is a "leaf" for `$text` purposes when it has no `$fields` and no `$children`. Such nodes carry `$text` set to `node.utf8_text(source)`.
4. **Optional elision**: omitted optionals are recoverable as absent — they do NOT round-trip as empty containers. `$fields: {}` is equivalent on the wire to `$fields` elided; implementations SHOULD elide.
5. **Stable serialization order**: `$type`, `$source`, `$named` come first; remaining optionals follow in a deterministic order (alphabetical by field name) — assists CI diffs on fixture files.

---

## Size expectations

- Typical per-match primitive NodeData: 200–500 bytes serialized.
- Deeply nested matches (e.g. returning a whole function body as the match root): up to low tens of KB.
- Outliers (a match that is the whole file): bounded by source file size; expected rarely and acceptable.

V8's `JSON.parse` on a single string of these sizes is faster than per-field N-API crossings per research R3.

---

## Example — a named function with parameters

```json
{
	"$type": "function_item",
	"$source": "ts",
	"$named": true,
	"$fields": {
		"name": {
			"$type": "identifier",
			"$source": "ts",
			"$named": true,
			"$text": "greet",
			"$span": { "start": 3, "end": 8 }
		},
		"parameters": {
			"$type": "parameters",
			"$source": "ts",
			"$named": true,
			"$children": [
				{
					"$type": "parameter",
					"$source": "ts",
					"$named": true,
					"$fields": {
						"pattern": {
							"$type": "identifier",
							"$source": "ts",
							"$named": true,
							"$text": "name",
							"$span": { "start": 9, "end": 13 }
						},
						"type": {
							"$type": "primitive_type",
							"$source": "ts",
							"$named": true,
							"$text": "str",
							"$span": { "start": 15, "end": 18 }
						}
					},
					"$span": { "start": 9, "end": 18 }
				}
			],
			"$span": { "start": 8, "end": 19 }
		},
		"body": {
			"$type": "block",
			"$source": "ts",
			"$named": true,
			"$children": [],
			"$span": { "start": 20, "end": 22 }
		}
	},
	"$span": { "start": 0, "end": 22 },
	"$nodeId": 5
}
```

The TS enrichment layer wraps this into a typed `FunctionItem` value with fluent getters, `$variant` (if applicable), and factory-bound methods — none of which appear on the wire.
