# Sittir Codegen Rewrite — Summary of Enhancements

## Architecture

| Aspect | Before | After |
|--------|--------|-------|
| **Node representation** | ES classes extending `Builder<N>` | `NodeData<T>` plain objects (readonly) |
| **Rendering** | Per-node `renderImpl()` methods (200+ files) | Single render engine + S-expression templates |
| **Render templates** | Imperative code in each class | `.scm` files — tree-sitter query syntax, syntax-highlighted |
| **Package structure** | `@sittir/types` (runtime + types) | `@sittir/core` (runtime) + `@sittir/types` (pure types, zero runtime) |
| **Generated code size** | ~200 files per grammar (one per node) | ~7 files per grammar (rules, factories, ir, types, consts, joinby, index) |
| **Generated code nature** | Executable classes with render logic | Data (templates) + thin factories (no render logic) |

## API Surface

| Feature | Before | After |
|---------|--------|-------|
| **Declarative** | `function_.from({ name: ..., body: ... })` | `ir.function.from({ name: 'main', type: 'i32', value: 100 })` — POJO-like sugar |
| **Fluent** | `function_(name).body(block)` | `ir.function(name).body(block)` — same pattern, no classes |
| **Mixed** | Not supported | `ir.function(name, { body: block })` — positional + config |
| **String shorthand** | Required `LeafBuilder` / `LeafOptions` | Plain strings: `'main'` → inferred `identifier` |
| **Number shorthand** | Not supported | `100` → inferred `integer_literal` |
| **Single-field compression** | Not supported | `ir.stringLiteral('hello')` instead of `ir.stringLiteral({ content: 'hello' })` |
| **Keyword factories** | `new LeafBuilder('self', 'self')` | `ir.self()` → `NodeData` with fixed text |
| **Operator aliases** | `ir.add()` returning `LeafBuilder` | `ir.add()` → `NodeData` with `text: '+'` |
| **Short names** | `ir.function` (stripped `_item` suffix) | Same — `toShortName` convention retained |
| **Nested namespaces** | Supported | Retained |

## Edit / Codemod API

| Function | Description |
|----------|-------------|
| `node.render()` | Get source text — for `sgNode.replace()` |
| `node.toEdit(start, end)` | Raw byte offsets |
| `node.toEdit(range)` | ast-grep `ByteRange` object |
| `node.replace(target)` | Replace a matched node |
| `replace(target, replacement)` | Standalone replacement |
| `replaceField(parent, n => n.field, replacement)` | **Type-safe** field replacement — `KindOf<TField>` constrains valid kinds |
| `ir.*.assign(target)` | **In-place editing** — hydrate factory from parsed tree, override fields, `.toEdit()` with no args |
| `edit(target)` | Sugar for `ir[kind].assign(target)` |

### Zero Reparsing

The codemod pipeline requires zero reparsing by either sittir or ast-grep:

```
source → parse (once) → match → build replacement (sittir) → Edit → commitEdits → new source string → write file
```

- `commitEdits` is pure string manipulation — no automatic reparse
- Sittir validation at factory creation guarantees syntactically valid output
- tree-sitter's `Tree.edit()` only updates byte offsets — doesn't reparse until explicitly requested

## Type System

| Feature | Before | After |
|---------|--------|-------|
| **Node type** | `Builder<N>` class generic | `NodeData<T>` — `T` carries kind string |
| **Discriminant** | `kind: string` | `type: T` — aligns with tree-sitter `Node.type` |
| **Properties** | Mutable | `readonly` on all `NodeData` and `Edit` properties |
| **`const enum SyntaxKind`** | Not generated | All named kinds — zero-runtime-cost discrimination |
| **Scoped enums** | Not generated | Per supertype: `ExpressionKind`, `StatementKind`, etc. |
| **Construction types** | `NodeType<G, K>` projections | Same — retained and enhanced |
| **Navigation types** | Not generated | `*Node` suffix interfaces with nested `fields` — for parse-tree access |
| **`KindOf<T>`** | Not available | Extracts kind string(s) from navigation types — powers `replaceField` |
| **`ReplaceTarget<T>`** | Not available | Structural type matching `SgNode` — `type` + `range()` |
| **`AssignableNode<T>`** | Not available | Extends `ReplaceTarget` with `field()`, `text()`, `children()` |

## Eliminated Abstractions

| Removed | Rationale |
|---------|-----------|
| `Builder<N>` base class | Replaced by `NodeData<T>` plain objects + core render engine |
| `LeafBuilder<K>` | Terminal factories return same `NodeData` shape — no separate class |
| `LeafOptions<K>` | String shorthand + typed factories provide discrimination |
| `TextBrand<K>` | No longer needed without LeafBuilder |
| `ValidationResult` | Unused — `validateFull` throws, runtime validation at factory creation |
| `renderImpl()` per node | Single render engine walks S-expression templates |
| `build()` method | Factory output IS the data — no separate build step |
| `toCSTChildren()` per node | CST construction in core, template-driven |
| Per-node `.ts` files (200+) | One `factories.ts` + one `rules.ts` per grammar |

## Validation

| Layer | What | When | Cost |
|-------|------|------|------|
| TypeScript types | Correct kinds, fields, multiplicity | Compile time | Zero |
| Template literal types | `escape_sequence`, `boolean_literal`, enum kinds | Compile time | Zero |
| Reserved keywords | `identifier('fn')` → throws | Factory creation | O(1) Set.has() |
| Grammar patterns | `identifier('123')` → fails regex from grammar.json | Factory creation / setter | O(1) regex.test() |
| NodeData.text validation | Any NodeData passed to setter validated against `LEAF_PATTERNS[type]` | Setter time | O(1) |
| **No render-time validation** | Output correct by construction | — | Zero |

## Render Engine

| Aspect | Detail |
|--------|--------|
| **Template format** | S-expression — tree-sitter query syntax |
| **Template parsing** | Parsed once, cached per template string |
| **Rendering** | `regex.replace` on format string, recursive for children |
| **Separators** | `JoinByMap` — `kind → separator` (ast-grep `joinBy` convention) |
| **Conditional groups** | Optional fields from template quantifiers (`?`, `*`, `+`) |
| **Deterministic** | Byte-identical output across runs — verified |

## Terminology Alignment (Constitution I)

| Before | After | Tree-sitter term |
|--------|-------|-----------------|
| `NodeMeta` | `KindMeta` | kind |
| `readGrammarNode()` | `readGrammarKind()` | kind |
| `listNodeKinds()` | `listBranchKinds()` | — |
| `listNamedKeywords()` | `listKeywordKinds()` | — |
| `listKeywords()` | `listKeywordTokens()` | token |
| `listEnumValues()` | `listLeafValues()` | leaf |
| `node.kind` | `node.type` | `SyntaxNode.type` |

## Test Coverage

| Package | Tests |
|---------|-------|
| `@sittir/core` | 24 (render, sexpr parser, edit, CST) |
| `@sittir/codegen` | 58 (grammar reader, rules emitter, factories emitter, types emitter, integration) |
| Integration | 53 (composition 3 modes, keywords, leaves, operators, template literals, input validation, string shorthand, edit/replace/replaceField/assign/edit, multi-grammar) |
| Generated (Rust) | 522/545 (95.8%) |
| **Total** | **135+ hand-written, 522+ generated** |

## Future (Phase B — optional, demand-driven)

- Port `@sittir/core` to Rust/WASM via `@refactory/typescript-to-rust` pipeline
- Native Rust `ir` module for ast-grep codemod authors
- Performance: irrelevant for correctness (validation at creation time eliminates the batch parse bottleneck)
