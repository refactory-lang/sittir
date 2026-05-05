# ADR 0018 — De-hoisted NodeData Surface Design

**Status**: Accepted
**Date**: 2026-05-03
**Related**: specs/022-binding-simplify-assemble/

## Context

The current NodeData surface has accumulated complexity:
- `$fields` wrapper adds indirection for named member access
- Per-field fluent getter/setter methods duplicate ~1500 lines per grammar
- Factory and wrap output have different APIs (fluent vs raw)
- `readNode` serializes through JSON (`serde_json::to_string` → `JSON.parse`)
- 10 assembled model types where fewer would suffice

A brainstorming session (2026-05-03) established the target surface
through iterative design decisions.

## Forcing Constraint

"Slots are nonterminal by definition. The function reference IS the
cursor. Calling it resolves to the value."

## Decision

### Runtime surface

```ts
const fn = {
    // Metadata ($-prefixed, plain properties, enumerable)
    $type: 42,
    $source: 2,
    $named: true,

    // Storage (_prefixed, enumerable — serializable data)
    _name: "main",
    _body: { ... },

    // Accessors (unprefixed functions, NON-enumerable)
    // fn.name = cursor/handle. fn.name() = resolved value.
    name() { return this._name; },
    body() { return this._body; },

    // Unnamed slot (at most one per kind)
    $child: ...,        // single unnamed (singular arity)
    $children: [...],   // repeated unnamed (array arity)

    // Update namespace (non-enumerable)
    $with: { name(v), body(v), ... },

    // Methods ($-prefixed, non-enumerable)
    $render() { ... },
    $toEdit(range) { ... },
    $replace(target) { ... },
    $trivia(...) { ... },
};
```

### Three namespaces

| Prefix | Purpose | Enumerable | Collisions |
|--------|---------|-----------|------------|
| `$` | Sittir metadata + methods | Yes (metadata), No (methods) | Never — grammar fields can't start with `$` |
| `_` | Stored field values | Yes | Never — tree-sitter field names are never `_`-prefixed |
| unprefixed | Accessor functions (cursor/value) | No | — |

### Key properties

1. **Frozen** — NodeData is immutable. `$with` returns a new frozen node.
2. **Non-enumerable accessors** — `Object.keys`/`JSON.stringify` see only `$`-metadata + `_`-storage.
3. **Cursor/value duality** — `fn.name` is the function reference (traversal handle). `fn.name()` resolves to the value. The cursor can grow methods (parent, next, children, kind) in future specs.
4. **Unified factory/wrap surface** — both produce the same API. Factory stores resolved values in `_fields`. Wrap stores stubs in `_fields` and intercepts via accessor functions (drillIn on call).
5. **napi direct** — Rust crosses the boundary via `FromNapiValue`/`ToNapiValue` reading/writing JS object properties directly. No serde JSON round-trip.
6. **`$child` XOR `$children`** — at most one unnamed slot per kind. `$child` for singular arity, `$children` for array arity. Determined by the slot's values' multiplicity.

### Assembled model (taxonomy — finalized 2026-05-03)

- `AssembledBranch` absorbs Container + Multi (one structural type)
- `AssembledNonterminal` replaces Field + Child (one slot type, `edgeName?`
  distinguishes named vs unnamed; `values[]` carries multiplicity)
- `AssembledLeaf` base for non-branch kinds with subtypes:
  - `AssembledPattern` (open text, optional regex)
  - `AssembledKeyword` (single fixed named string)
  - `AssembledToken` (single fixed anonymous string)
  - `AssembledEnum` (closed set of literals)
- `AssembledPolymorph` (absorbs `AssembledGroup` as inline form property)
- `AssembledSupertype` stays

### Migration strategy

- **Incremental** — each commit passes native RT (≥114/124/108) + type-check (0 errors)
- **Taxonomy-first** (revised 2026-05-03) — the assembled model collapse lands BEFORE the surface change so emitters consume the final model from day one (no transient adapter layer). Phase order: (1) Taxonomy rename, (2) Surface, (3) Transport, (4) Internal pipeline rewrite (Binding/Simplify produce the new taxonomy from scratch).
- **Greppable transforms** for consumers: `.$fields.<name>` → `.<name>()`, `.name(v)` setter → `.$with.name(v)`, `.render()` → `.$render()`

## Alternatives Considered

- **Native JS getters (`get name()`)** — rejected: triggers on Object.keys/JSON.stringify, can't evolve to cursor pattern.
- **Plain property access (`fn.name`)** — rejected: can't intercept for lazy drill-in or future cursor methods.
- **Shape A/B/C separate types** — rejected: redundant with existing modelType, adds complexity.
- **HashMap + serde(flatten)** — rejected: unnecessary when napi reads/writes properties directly.

## Consequences

- **Enables**: cursor/traversal API, lazy drill-in, memoization, frozen immutable nodes, unified factory/wrap surface
- **Costs**: `fn.name()` instead of `fn.name` (one extra pair of parens per access)
- **Follow-ups**: Rewrite spec 022 from scratch with this surface as the starting point. Finalize assembled model taxonomy.

## Verification

If the function-call accessor pattern proves too verbose for consumers,
or if the cursor API never materializes (making the duality pointless),
revisit. Signal: widespread `fn.name()` → `fn.name` complaints in
consumer code reviews.
