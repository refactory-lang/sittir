# `packages/tools/src/inventory` — Function Glossary

The bindings inventory: `sittir tool bindings-inventory`. It reads each grammar's `packages/<grammar>/bindings.scm` and slot model, checks that the bindings compile against the grammar's parser, derives the vocabulary the bindings imply, and drafts the base interface tree by building TypeScript through the typescript package's strict factories and rendering it with the native engine. The draft goes into a directory the caller names and is compared with the authored tree under `packages/types/src/vocabulary/`; the tool never writes over the authored tree.

---

### `packages/tools/src/inventory/query.ts::parseQuery`

```text
A tree-sitter query pattern reader for the shape the bindings use: nodes with
fields, string tokens, quantifiers, captures, `#` predicates and `[...]`
alternations. A capture binds to the node or token written just before it; a
capture written after a pattern's closing paren binds to the pattern's top
node. Quantifiers are kept on the node they follow; anchors (`.`) and negated
fields (`!`) are dropped. Comments (`;`) are stripped first.
```

### `packages/tools/src/inventory/query.ts::compileQuery`

```text
The compile gate: builds the query with web-tree-sitter against the grammar's
compiled parser, so a bad node name, an unknown field or a malformed pattern
fails here with tree-sitter's own message. Returns the pattern and capture
counts and frees the query.
```

### `packages/tools/src/inventory/model.ts::loadSlotModel`

```text
The grammar's slot model from `packages/<grammar>/src/node-model.json5`, the
one source for slots (name, property name, required, multiple, storage,
admitted kinds, terminal texts), supertypes (`subtypes`), enum texts and token
texts. The derivation reads nothing from the generated `types.ts`.
```

### `packages/tools/src/inventory/derive.ts::derive`

```text
The derivation over every grammar's patterns and model. In order: collect
claims (a dotted capture, or a bare capture on a pattern's top node), member
renames (a capture on a child of the claimed node, keyed by its field or
kind), deep members (a capture nested inside a container child of the claimed
node, such as the class heritage clauses, which replaces the container slot),
token captures (boolean members) and container patterns (`@element`);
resolve each grammar kind to its claim, or through its supertype's subtypes
with full-coverage admission, or to an `<grammar:kind>` placeholder; build the
members of every claimed kind from its slots, renamed by the captures and
otherwise by the marker and modifier names rules; fold field-literal claims
into refinements; assign container captures to every kind the element admits;
collapse a namespace's leaves when the namespace itself is admitted; and
report inclusion cycles and the unmapped placeholders.
```

### `packages/tools/src/inventory/derive.ts::levelMembers`

```text
A level's members: the union over every kind beneath it by path and every
refinement that names it as parent, `T | T[]` where multiplicity disagrees. A
member is required only when the level's own claim carries it in every
claiming grammar and every claimed child by path carries it required; a
literal refinement declares only its pin and so inherits the rest. A level no
grammar claims takes a member as required when every claimed child does.
```

### `packages/tools/src/inventory/emit.ts::vocabularyFiles`

```text
The draft tree as data: one file per top-level namespace, an interface merged
with a namespace at every level, an interface alone at a leaf, a refinement
extending its path parent with its literal pinned, every namespace exporting
`Kinds<G>`, plus `context.ts` with the `GrammarContext` typemap, `Unmapped`
and `BaseContext`. Member types collapse to the smallest covering kind-set:
the namespace lookup when the admitted leaves' common prefix is the namespace
root, a sub-namespace's `Kinds` when it is a claimed prefix, the leaf
interfaces otherwise. Container kinds unwrap to their element type through
`CONTAINER_ELEMENTS`; layout slots are never members.
```

### `packages/tools/src/inventory/emit.ts::renderVocabularyFile`

```text
The dogfood step: builds the file's statements through the typescript
package's strict factories (`ir.interfaceDeclaration`, `ir.internalModule`,
`ir.unionType`, `ir.lookupType`, `ir.templateLiteralType`, ...) and renders
the program with the native engine. Comments ride as trivia. The caller
formats the result; a render defect that survives formatting is a finding
about the typescript package, never something the emitter works around.
```

### `packages/tools/src/inventory/index.ts::run`

```text
`--check` compiles every bindings file and reports each grammar; the
derivation summary always prints (kinds, prefixes, members, refinements,
unmapped references, cycles); `--members` prints member names and kinds per
shared kind; `--emit <dir>` drafts the tree into the directory and formats it
with oxfmt. A cycle or a failed compile is a non-zero exit.
```
