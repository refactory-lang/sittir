# KindID Runtime Migration Design

## Problem

Sittir's runtime node and transport surfaces still use literal kind-name strings
as the discriminant:

- TS/runtime objects carry `$type: 'function_item'`
- the current JS↔Rust boundary ultimately serializes/decodes those names
- Rust-native transport and dispatch still consume kind-name strings

That leaves three costs in place:

1. runtime dispatch pays for string comparison where a generated numeric
   discriminant would suffice
2. the JS↔Rust/native boundary carries verbose names rather than compact IDs
3. TS and Rust runtime layers do not share one generated runtime identity model

At the same time, spec 021 already distinguishes between:

- **`RuleId`** — compiler ontology / rule-occurrence identity
- **KindID / FieldID** — late metadata attached after grammar generation

So the design question is not whether KindID replaces `RuleId`. It is whether
KindID should become the generated **runtime** identity for nodes and native
transport.

This design assumes the **native-views architecture has already landed**:

- ADR-0015: walker-owned render contract for slot truth
- ADR-0016: renderable-native view layer and typed transport direction

## Scope

This design covers:

- migrating from literal kind-name discriminants to generated numeric `KindId`
- doing so **over the wire** and in **runtime internals**
- keeping codegen/compiler reasoning name-first
- preserving human-readable names as metadata/debug/public labels

This design does **not** cover:

- replacing `RuleId` as compiler identity
- reworking the compiler pipeline to become ID-first
- a binary codec; transport medium remains plain JS objects over N-API

## Recommendation

Design the end state as **full runtime KindID**, even if implementation lands in
phases.

Concretely:

- **compiler/codegen stays name-first**
- **runtime objects become KindID-first**
- **wire/native transport becomes KindID-first**
- **Rust internals become KindID-first**
- **kind names become generated metadata / debug / public alias surface**

This is cleaner than stopping at "wire + native only" because it avoids a
lasting JS/native asymmetry and avoids paying for repeated name↔ID translation
on the TS side.

## Alternatives Considered

### A. Wire-only IDs

Use `KindId` only on the JS↔Rust/native transport, map back to names
immediately inside Rust.

**Rejected**: cheapest first step, but leaves almost all internal runtime
dispatch string-based and creates a narrow win at the least important layer.

### B. Wire + native internals IDs

Use `KindId` over the wire and throughout native transport/render/dispatch, but
leave TS runtime internals string-keyed.

**Rejected as end-state**: better than wire-only and viable as a phase, but it
creates a lasting TS/native split and keeps translation cost on the client side.

### C. Full runtime KindID with names as metadata/public labels

Use `KindId` as the generated runtime identity in both TS and Rust internals,
while compiler/codegen still reasons in names and public/debug surfaces can map
IDs back to names.

**Accepted**: one runtime identity model, clean cross-language symmetry, and no
need to preserve long-lived string dispatch internally.

## Architecture

### Three identities with different jobs

1. **`RuleId`** — compiler ontology / spec 021 identity  
   Remains the authoritative identity for rule occurrences and rule metadata.

2. **`KindId`** — generated runtime kind identity  
   Dense numeric ID per concrete kind, generated late from grammar artifacts and
   used for transport, dispatch, caches, and runtime discrimination.

3. **kind name string** — metadata/debug/public label  
   Human-readable label derived from `KindId` through generated tables. Useful
   for diagnostics, debugging, and compatibility shims.

### Core split

The design is:

- **compiler/model/template authoring** → name-first
- **runtime objects / transport / dispatch** → KindID-first

This preserves spec 021's separation: KindID becomes operationally important at
runtime without becoming the compiler's foundational ontology.

## Revised Runtime Shape

Keep the familiar runtime key:

```ts
$type
```

but replace the string literal value with the generated numeric enum member:

```ts
$type: TSKindId.FunctionItem
```

This keeps the object shape recognizable while changing the discriminant to a
generated numeric runtime identity.

### TypeScript side

Codegen still reasons in names, but emits:

```ts
export const enum TSKindId {
  FunctionItem = 42,
  CallExpression = 73,
}
```

and generated runtime/data-only transport interfaces become:

```ts
export namespace FunctionItem {
  export interface Transport {
    $type: TSKindId.FunctionItem;
    name: Identifier.Transport;
    parameters?: readonly Parameter.Transport[];
  }
}
```

So:

- specs/codegen/templates continue to use names
- generated runtime surfaces and dispatch paths use KindIDs

### Rust side

Rust gets the matching runtime identity:

```rust
#[repr(u16)]
pub enum KindId {
    FunctionItem = 42,
    CallExpression = 73,
}
```

and transport shapes mirror the same discriminant:

```rust
pub struct FunctionItemTransport {
    pub type_: KindId,
    pub name: IdentifierTransport,
    pub parameters: Option<Vec<ParameterTransport>>,
}
```

## Data Flow

1. **Codegen / compiler model**
   - reason in kind-name strings
   - emit `KindId`, `kindNameFromId`, `kindIdFromName`

2. **Generated TS runtime surface**
   - runtime objects carry numeric `$type`
   - generated guards still expose named APIs like:
     - `is.functionItem(node)`
     - `assert.functionItem(node)`
     - `kindName(node.$type)`

3. **JS → Rust**
   - plain object over N-API
   - no stringification
   - no literal kind-name discriminant over the native render boundary

4. **Rust transport / native views**
   - decode by `KindId`
   - dispatch by `KindId`
   - build `from_transport(...)`
   - render via native views / Askama

## Compatibility Policy

Legacy string `$type` should be treated as a **migration shim**, not a
permanent dual-runtime mode.

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

User-facing errors should resolve KindIDs back to human-readable names:

- `unknown kind id 42 (function_item)`
- `native transport expected call_expression, got 73 (binary_expression)`

Internal checks should fail on missing/unknown numeric cases, not on raw string
matching:

- missing `KindId` decode arm
- missing render-dispatch arm for a generated `KindId`

## Testing and Verification

The migration is correct if all of the following become true:

1. generated TS runtime/data-only transport types use numeric `$type`
2. JS↔Rust/native transport uses numeric discriminants only
3. Rust render/transport dispatch no longer matches on kind-name strings
4. codegen/template/compiler surfaces still reason in names
5. all user-facing diagnostics can still render human-readable names
6. any temporary string-keyed compatibility path is boundary-local and
   removable

## Recommended Migration Order

1. **Generate KindID metadata and lookup tables**
   - `KindId`
   - `kindNameFromId`
   - `kindIdFromName`

2. **Switch generated TS runtime/data-only transport interfaces**
   - `$type` becomes numeric `TSKindId`

3. **Add a boundary-local compatibility shim**
   - legacy string `$type` accepted only at package entrypoints
   - normalize immediately to `KindId`

4. **Switch JS↔Rust/native transport**
   - numeric discriminants only over N-API

5. **Switch native internals**
   - transport decode
   - render dispatch
   - caches/helpers

6. **Optionally switch more TS runtime internals**
   - remove remaining string-based dispatch
   - keep named public helpers as generated aliases

7. **Remove the legacy string normalization path**

## Why this works with the native-views assumption

Assuming ADR-0015/0016's native-views work has landed:

- slot truth is already model/walker-owned
- render transport is already typed
- native views already consume structured transport

That means the KindID migration does not need to invent a second structural
rewrite. It only changes the **runtime discriminant** and the transport/runtime
lookup path.

The resulting pipeline is:

1. generated TS runtime object with numeric `$type`
2. plain object over N-API
3. Rust typed transport with numeric discriminant
4. `from_transport(...)`
5. native views / Askama

## Open Questions Deliberately Left Out

These are implementation choices, not design blockers:

- exact numeric width (`u16` vs `u32`) for `KindId`
- whether `FieldId` should migrate in the same implementation wave or a later
  one
- whether TS runtime stores raw numbers or branded number aliases internally

Those belong in the implementation plan, not in the architecture decision.
