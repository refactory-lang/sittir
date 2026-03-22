# @sittir/types

Language-agnostic type projection from tree-sitter grammars to typed IR builders.

## Installation

```bash
pnpm add @sittir/types
```

## What It Does

Given any tree-sitter grammar type `G`, this package derives fully typed IR node shapes, builder inputs, and builder configs — zero hand-rolled field definitions.

The core types work via TypeScript's structural type system: any object matching the tree-sitter `node-types.json` shape can be plugged in as `G`.

## Key Types

| Type | Description |
|------|-------------|
| `NodeType<G, K>` | Primary projection — grammar `G`, node kind `K` to fully expanded IR node |
| `BuilderConfig<G, T>` | Builder input shape with grammar-derived optional fields |
| `BuilderTerminal<N>` | Terminal operations (`build()`, `render()`, `renderSilent()`) |
| `NodeKind<G>` | All node kind string literals for grammar `G` |
| `NamedKind<G>` | Subtype-resolved named node kinds |
| `RenderPipeline<N>` | Render + validate pipeline interface |
| `ValidationResult` | Validation outcome (`{ ok: true }` or `{ ok: false; errors }`) |

## Usage

```ts
import type { NodeType, BuilderConfig, BuilderTerminal } from '@sittir/types';
import type { RustGrammar } from '@sittir/rust';

// Derive the full IR node type for a Rust struct
type StructItem = NodeType<RustGrammar, 'struct_item'>;

// Derive the builder input (loosened for ergonomics)
type StructConfig = BuilderConfig<RustGrammar, StructItem>;
```

## Structural Compatibility

`@sittir/types` is structurally compatible with `@codemod.com/jssg-types` grammar types. If you have existing codemod code that uses jssg-types grammars, they work as `G` without any changes — TypeScript's structural typing handles the mapping.

## License

MIT
