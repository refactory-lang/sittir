# KindID Runtime Migration Design

## Problem

Sittir's runtime node and transport surfaces still use literal kind-name strings
as the discriminant:

- TS/runtime objects carry `$type: 'function_item'`
- the JS↔Rust boundary ultimately keys on those names
- Rust-native transport and dispatch still consume kind-name strings

The original migration idea was to replace those strings with numeric `KindId`
values sourced from late-generated tree-sitter metadata. The first design pass
treated the tree-sitter name table (`ts_symbol_names[]`) as the source of the
runtime kind name. That turned out to be too lossy.

`ts_symbol_names[]` is a display/public-name table, not a uniqueness-preserving
identity table. It:

- strips parser scaffolding (`sym_`, `anon_sym_`, `aux_sym_`, `alias_sym_`)
- renders anonymous tokens as visible text (`anon_sym_PLUS -> "+"`)
- can collapse distinct parser symbols to the same visible name
  (`sym__as_pattern -> "as_pattern"` and `sym_as_pattern -> "as_pattern"`)
- sometimes preserves hidden-rule underscores and sometimes canonicalizes them
  away

So the design question is not only whether KindID should replace runtime
strings. It is also:

1. **what is the authoritative source of KindID identity?**
2. **how do we preserve parser-side uniqueness without forcing that shape onto
   the rest of codegen?**

This design assumes the **native-views architecture has already landed**:

- ADR-0015: walker-owned render contract for slot truth
- ADR-0016: renderable-native view layer and typed transport direction

## Scope

This design covers:

- migrating from literal kind-name discriminants to generated numeric `KindId`
- using `parser.c` as the authoritative KindID source
- defining a full symbol metadata catalog for runtime/codegen/native consumers
- keeping compiler/codegen reasoning `key`-first rather than `KindId`-first
- preserving human-readable names for diagnostics and debugging

This design does **not** cover:

- replacing `RuleId` as compiler identity
- making the compiler pipeline ID-first
- changing transport medium; JS↔Rust stays plain JS objects over N-API
- migrating `FieldId` in the same design wave

## Recommendation

Design the end state as **full runtime KindID backed by a parser.c symbol
catalog**.

Concretely:

- **compiler/codegen stays `key`-first**
- **runtime objects become KindID-first**
- **wire/native transport becomes KindID-first**
- **Rust internals become KindID-first**
- **`parser.c` becomes the authoritative KindID identity source**
- **`ts_symbol_names[]` becomes display/debug metadata only**

The key move is to separate these concepts instead of overloading one string:

- **`id`** — numeric ID from `enum ts_symbol_identifiers`
- **`key`** — Sittir's canonical cross-pipeline value (the current join term)
- **`cSymbol`** — raw parser.c enum symbol (`sym__as_pattern`)
- **`parserName`** — minimally cleaned parser-derived name (`_as_pattern`)
- **`displayName`** — optional label from `ts_symbol_names[]`

This preserves parser-side uniqueness without forcing tree-sitter's display-name
canonicalization onto the rest of the pipeline.

## Alternatives Considered

### A. Use `ts_symbol_names[]` as the KindID key source

Use tree-sitter's exported symbol-name table as the canonical runtime name, then
join KindIDs by that value.

**Rejected**: `ts_symbol_names[]` is lossy. It intentionally collapses distinct
parser symbols onto one visible name and cannot serve as the primary identity
source for KindID.

### B. Use minimally cleaned parser names as the canonical cross-pipeline key

Take the parser.c symbol, strip only the prefix family, and make that value the
canonical name used everywhere in codegen.

**Rejected**: this works well for named rules, but it breaks alignment with
existing grammar-facing/key-facing surfaces for anonymous tokens and other
already-established joins. For example, parser-derived `PLUS` is not the same
thing as Sittir's existing `"+"`-style key.

### C. Use `parser.c` for identity and keep `key` as a separate canonical field

Build a full symbol catalog from `parser.c`, preserve parser uniqueness there,
and carry Sittir's canonical `key` as separate metadata when a symbol maps to an
existing generated/runtime surface.

**Accepted**: this keeps parser identity unambiguous, avoids forcing parser-side
naming onto the whole compiler, and gives emitters one authoritative ledger for
JS/native/runtime naming.

## Architecture

### Three identities with different jobs

1. **`RuleId`** — compiler ontology / spec 021 identity  
   Remains the authoritative identity for rule occurrences and rule metadata.

2. **`KindId`** — generated runtime kind identity  
   Numeric ID from `parser.c` `enum ts_symbol_identifiers`, used for runtime
   discrimination, transport, and dispatch.

3. **`key`** — canonical cross-pipeline join term  
   Sittir's current canonical value, used where codegen, grammar-facing surfaces,
   node-types joins, and runtime-facing names already reason in terms of the
   existing model.

This preserves spec 021's separation: KindID becomes operationally important at
runtime without becoming the compiler's foundational ontology.

### Authoritative source: parser.c only

KindID metadata is derived from:

- `enum ts_symbol_identifiers`
- `enum ts_field_identifiers` (for the corresponding field design later)
- `ts_symbol_names[]` / `ts_field_names[]` for labels only

There is **no `parser.wasm` fallback** for KindID identity. The WASM path does
not preserve the same symbol scaffolding and therefore cannot provide the
unambiguous parser-side identity this design needs.

### Parser-side derivation rule

For kind symbols, derive parser identity from the raw C enum symbol:

- `sym_foo -> foo`
- `anon_sym_PLUS -> PLUS`
- `aux_sym_bar_repeat1 -> bar_repeat1`
- `alias_sym_baz -> baz`

Only the prefix family is stripped. The rest of the symbol is kept verbatim.

Parser-origin flags are retained as metadata:

- `anon`
- `aux`
- `alias`
- `hidden` (derived from `parserName.startsWith('_')`)

### Symbol catalog shape

The system owns **one grammar-wide symbol catalog** covering every symbol in
`enum ts_symbol_identifiers`. A symbol does not need to map to the existing
generated runtime model in order to appear in the catalog.

Conceptually:

```ts
const enum KindPresenceFlag {
  TSGrammar = 1 << 0,
  TSNodeTypes = 1 << 1,
  TSRuntime = 1 << 2
}

const enum KindUseFlag {
  Readable = 1 << 0,
  Buildable = 1 << 1,
  Renderable = 1 << 2
}

type KindSymbolMetadata = {
  id: number;
  key?: string;

  presence: KindPresenceFlag;
  uses: KindUseFlag;

  parser: {
    cSymbol: string;
    parserName: string;
    displayName?: string;
    anon: boolean;
    aux: boolean;
    alias: boolean;
    hidden: boolean;
  };

  js: {
    enumName: string;
    methodName: string;
  };

  native: {
    enumName: string;
    methodName: string;
  };
};
```

### Meaning of the flags

`presence` describes **where the symbol/key exists**:

- `TSGrammar` — corresponds to a rule name in `grammar.js`
- `TSNodeTypes` — appears in `node-types.json`
- `TSRuntime` — can appear on a parsed tree-sitter node

`uses` describes **what Sittir can do with it**:

- `Readable` — Sittir can ingest/hydrate it from parsed runtime nodes
- `Buildable` — Sittir can produce/build it from factories or `.from()`
- `Renderable` — Sittir can render/dispatch it

This separates ontology/existence from operations/consumers and avoids mixing
file-based flags with behavior-based flags in one enum.

### JS and native generated names

The symbol catalog also owns emitter-facing names so each generator stops
re-deriving them independently.

For a symbol with `key: 'as_pattern'`, the generated names are:

```ts
js: {
  enumName: 'AsPattern',
  methodName: 'asPattern'
},
native: {
  enumName: 'as_pattern',
  methodName: 'as_pattern'
}
```

So:

- **JS/TS** gets ergonomic generated names
- **native** stays grammar-shaped

Even when some of these are algorithmically derivable today, the catalog is the
single ledger that records them.

### Join policy

The catalog always contains the full parser-symbol universe.

`key` is the bridge back to Sittir's existing canonical model:

- if a parser symbol maps to an existing canonical Sittir value, `key` is set
- if it does not, the symbol remains catalog-only and unmapped

This means:

- parser identity is always complete
- codegen joins still happen on `key`
- emitters can filter by `presence` and `uses` rather than repeating ad hoc
  inclusion logic

`ts_symbol_names[]` does **not** participate in identity or joins. It exists
only for diagnostics/debugging labels.

## Revised Runtime Shape

Keep the familiar runtime key:

```ts
$type
```

but replace the string literal value with the generated numeric enum member:

```ts
$type: TSKindId.FunctionItem
```

`TSKindId` is emitted from catalog entries whose:

- `key` is present
- `presence` includes `TSRuntime`

The generated numeric runtime identity is therefore catalog-backed, not inferred
from ad hoc emitter heuristics.

## Data Flow

1. **Extract full symbol catalog from parser.c**
   - one row per parser symbol
   - derive parser metadata, JS/native names, and optional display labels

2. **Match parser symbols to canonical `key`s**
   - set `key` where the symbol maps to Sittir's existing canonical value
   - compute `presence` / `uses`

3. **Emit generated runtime helpers from the catalog**
   - `TSKindId`
   - `kindNameFromId`/`kindKeyFromId`-style lookups
   - JS/native enum/method names

4. **Switch runtime objects / transport / dispatch to numeric `$type`**
   - TS runtime objects carry numeric `$type`
   - JS→Rust transport carries numeric `$type`
   - Rust-native transport/render dispatch keys on KindID

5. **Keep compiler/codegen reasoning `key`-first**
   - templates, grammar-facing joins, and node-model logic continue to reason in
     canonical `key` values rather than parser symbol names

## Compatibility Policy

Legacy string `$type` should be treated as a **migration shim**, not a permanent
dual-runtime mode.

### Short-term

- package entrypoints may accept both string and numeric `$type`
- normalize immediately to `KindId`

### End state

- generated/runtime objects are numeric-only
- native transport is numeric-only
- compatibility normalization is removable

Avoid a durable dual-discriminant shape like:

```ts
{ $type: 'function_item', $kindId: 42 }
```

That duplicates identity instead of migrating it.

## Error Handling

User-facing errors should resolve KindIDs back to useful human-readable labels.
Preferred order:

1. canonical `key` when present
2. `parser.displayName` when `key` is absent
3. raw `parser.cSymbol` as the final unambiguous fallback

Examples:

- `unknown kind id 42 (function_item)`
- `missing render-dispatch arm for kind id 165 (_as_pattern / as_pattern)`

Internal checks should fail on missing/unknown numeric cases, not on raw string
matching.

## Testing and Verification

The migration is correct if all of the following become true:

1. KindID identity is sourced from `parser.c`, not `ts_symbol_names[]`
2. parser-symbol collisions like `_as_pattern` / `as_pattern` remain distinct in
   the catalog
3. generated TS runtime/data-only transport types use numeric `$type` where
   `presence` includes `TSRuntime`
4. JS↔Rust/native transport uses numeric discriminants only
5. Rust render/transport dispatch no longer matches on kind-name strings
6. codegen/template/compiler surfaces still reason in canonical `key` values
7. all user-facing diagnostics can still render understandable names
8. any temporary string-keyed compatibility path is boundary-local and removable

## Recommended Migration Order

1. **Replace the current generated-metadata join**
   - stop using `ts_symbol_names[]` as the KindID key source
   - extract parser-side identity from `parser.c` symbols directly
   - remove the `parser.wasm` fallback for KindID identity

2. **Introduce the full symbol catalog**
   - parser metadata
   - canonical `key`
   - presence flags
   - use flags
   - JS/native emitted names

3. **Emit KindID runtime helpers from catalog entries**
   - `TSKindId`
   - runtime name/key lookup helpers
   - native matching enum/name helpers

4. **Switch generated TS runtime/data-only transport interfaces**
   - `$type` becomes numeric `TSKindId`

5. **Add a boundary-local compatibility shim**
   - legacy string `$type` accepted only at package entrypoints
   - normalize immediately to `KindId`

6. **Switch JS↔Rust/native transport**
   - numeric discriminants only over N-API

7. **Switch native internals**
   - transport decode
   - render dispatch
   - caches/helpers

8. **Remove the legacy string normalization path**

## Why this works with the native-views assumption

Assuming ADR-0015/0016's native-views work has landed:

- slot truth is already model/walker-owned
- render transport is already typed
- native views already consume structured transport

That means the KindID migration does not need a second structural rewrite. It
changes the **runtime discriminant source of truth** and the generated
lookup/catalog path, while leaving the typed transport shape and native-view
design intact.

## Open Questions Deliberately Left Out

These are implementation choices, not design blockers:

- exact numeric width (`u16` vs `u32`) for `KindId`
- whether `FieldId` follows the same catalog model immediately or in a later
  wave
- exact API naming of helper lookups (`kindNameFromId` vs `kindKeyFromId`, etc.)
- whether the catalog is emitted as one file or split into kind/field ledgers

Those belong in the implementation plan, not in the architecture decision.
