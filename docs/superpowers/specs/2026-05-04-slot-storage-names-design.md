# Slot Storage Names — Design

## Problem

Today, `AssembledNonterminal` uses `name` (the grammar field name or kind-derived positional name) for both:
- The key in `AssembledBranch.slots` (the external surface)
- The `_<name>` storage key on NodeData

This conflates two concerns:
1. **External identity** — how consumers address the slot (`node.body()`, `$with.body(v)`)
2. **Storage identity** — how the slot is stored on the NodeData object (`_body`, `$children`)

For grammar-`field()` slots, these naturally coincide. For inferred (positional) slots, the name is kind-derived (`expression`, `statement`) but the storage key should be `children` (or `$children`) since that's the conventional unnamed-slot storage.

## Design

Add a `storageName` property to `AssembledNonterminal`:

```ts
export interface AssembledNonterminal {
    readonly name: string;           // external key (in slots Record, drives getter/setter names)
    readonly propertyName: string;   // camelCase public surface
    readonly storageName: string;    // NodeData storage key (without _ prefix)
    // ... rest unchanged
}
```

### Rules

1. **Named slots** (`source !== 'inferred'`): `storageName = name`. The grammar author's field name IS the storage key.

2. **Unnamed slots** (`source === 'inferred'`): `storageName = 'children'`. All positional children share the `$children` storage on NodeData.

3. **Collision warning**: At `buildSlotsRecord` time, if two or more slots share the same `storageName`, emit a warning:
   ```
   [assemble] storageName collision: kind 'block' has 2 slots with storageName 'children'
     slot 'statement' (source: inferred)
     slot 'expression' (source: inferred)
   ```

4. **Override resolution**: The curator addresses collisions via `overrides.ts`:
   - Promote the inferred slot to a named field: `field('body', $.expression)` → `storageName = 'body'`
   - Or assign a unique storageName directly (future DSL extension)

### Consumer impact

**Factory emitter**: Currently emits `_<name>` for field storage and `$children` separately for children. With `storageName`:
- Named fields: `_<storageName>` (same as today — `storageName === name`)
- Unnamed children: `$children` (same as today — `storageName === 'children'`, prefixed with `$` not `_`)

**Wrap emitter**: Same mapping — `_<storageName>` for named, `$children` for `storageName === 'children'`.

**Types emitter**: Per-kind interfaces use `_<storageName>` for storage declarations. Unchanged for fields; `$children` already exists for unnamed.

### Migration path

1. Add `storageName` to `AssembledNonterminal` interface.
2. Populate it in `deriveFieldsRaw` / `deriveSlots`:
   - `source !== 'inferred'` → `storageName = name`
   - `source === 'inferred'` → `storageName = 'children'`
3. Add collision warning in `buildSlotsRecord`.
4. Inventory collisions across all 3 grammars.
5. Address each collision via overrides (case-by-case).
6. Once zero collisions remain, enforce (throw instead of warn).
7. Migrate emitters to use `storageName` for storage emission.

### Agent/skill for override curation

A dedicated agent skill to handle the collision resolution workflow:

**Input**: Grammar name + the collision warnings from codegen.
**Process**:
1. For each collision, inspect the kind's rule tree (via `probe-stages.ts`).
2. Determine the most natural field name for each positional slot based on:
   - The referenced kind name (e.g., `_expression` → `body` or `value`)
   - The parent kind's semantics (e.g., `if_expression`'s condition vs consequence)
   - Cross-grammar consistency (how other grammars name equivalent slots)
3. Generate an `overrides.ts` patch: `field('<name>', $.<symbol>)` for each slot.
4. Run regen + type-check to verify.
5. Run RT counts to verify no regression.

**Output**: Updated `overrides.ts` + regen + verification report.

## Open questions

1. Should `storageName` for unnamed slots be `'children'` or should we derive a more specific name (e.g., `'body'` for a single-child container) and only fall back to `'children'` when the name is ambiguous?

2. When an unnamed slot is promoted to a named field via override, should `source` stay `'inferred'` (with `storageName` overridden) or change to `'override'`? The source already changes to `'override'` when the override adds a `field()` wrapper — so this is consistent.

3. Should the collision warning fire at `buildSlotsRecord` time (in assemble) or at emit time (in the emitters)? Assemble is earlier and catches issues before any emit; but the warning is only actionable by someone running codegen, not by the core pipeline.
