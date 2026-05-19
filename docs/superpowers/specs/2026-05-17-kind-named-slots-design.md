# Kind-Named Slots: Unified Slot Model Across Sittir

**Status**: Design (approved 2026-05-17)
**Branch**: 024-rust-slot-surface-contract

## Summary

Unify sittir's slot model so every slot — whether declared via a tree-sitter `field()` wrapper or inferred from a positional symbol reference — has a name and an `_<name>` storage key. The named-vs-unnamed distinction collapses to an `origin` metadata field; downstream consumers iterate slots uniformly.

This closes the `storageName: 'children'` collision class (the bug behind the `_attributed_parameter` failure at baseline 134/107 rust AST) and removes the `$children` magic key from the public NodeData shape. The `$children` key survives only as the anonymous-token bucket (preserving today's behavior for literal-token children).

## Background

### The bug

At baseline (rust HEAD 9ef89df5, AST = 107 / 134 rrp), sittir's `deriveSlots` assigned `storageName: 'children'` to every unnamed positional slot regardless of content. Rules with two or more unnamed positional slots collided: `_attributed_parameter` declared `seq(optional(attribute_item), choice(parameter, self_parameter, variadic_parameter, '_', _type))` — two unnamed slots, both stored at the same `$children` key. Tree-sitter inlines hidden `_`-prefixed rules at parse time, so the parent CST (`parameters`) sees flat children; sittir's wrap layer then can't reconstruct which attribute belongs to which parameter. AST mismatch.

Three composed bugs were diagnosed during the 2026-05-17 session:

1. Per-slot enum dispatch sort missing (`render-module.ts:3223`) — ~60 events.
2. Template walker's SEQ-sibling seen-state masking emits literal `'_'` as always-on text — ~50 events.
3. `storageName: 'children'` collision on multi-unnamed-slot rules — root cause; masked by (1) and (2).

Solo fixes for (1) and (2) each produced a net AST regression vs baseline because they unmasked the underlying (3). The proper fix addresses (3) directly.

### Prior work

- Spec [2026-05-15-024-assembled-group-synthesis-design.md] — `groups:` override block (path-based group lifting). This design extends `groups:` to also handle body-pattern-based pattern-replacement rules.
- Memory `project_ast_gap_diagnostic_sittir11.md` — full diagnostic of the 3-bug stack.

## Goals

- Unified slot model: every slot has a name + `_<name>` storage key.
- No special-case branches in consumers for named vs unnamed slots.
- `_attributed_*` pattern rules become visible CST kinds (via `alias()`), preserving grouping.
- `$children` survives strictly as the anonymous-token bucket; not used for named-kind children.

## Non-goals

- **TS-side `readNode` is explicitly out of scope.** Native `read_node` (Rust) is the only read path that matters for the AST measurement and for production data flow. The TS `readNode` may be left untouched / inconsistent during this refactor; updating it can be a separate later effort.
- No changes to the public factory API surface beyond what falls out of regen.
- No relocation of the test-fixture infrastructure.

## Architecture

### 1. Data shape (native NodeData)

Verified via `probe-kind --engine native --trace` on `fn foo(#[a] x: u8) {}` against current baseline. The native NodeData uses two namespaces:

```
{
  // metadata (the $-prefix namespace)
  $type, $source, $text?, $span, $named, $nodeHandle, $childIndex, $triviaData?,
  
  // slot storage (the _-prefix namespace)
  _<slot1_name>: ...,           // named slot — name = field name
  _<slot2_kind>: ...,           // unnamed slot — name = content kind  (NEW)
  
  // anonymous-token bucket — survives, carries numeric kind IDs
  $children?: number[],
}
```

For field-wrapped slots: `<name>` = the field name (existing — already works on native, e.g., `_attribute`, `_pattern`, `_type`).
For unnamed slots (origin=kind): `<name>` = the content kind name (the rule symbol the slot references). **NEW** routing — today named children without field tags go into `$children` as object entries.

**Important native-vs-TS divergence** (informational only — TS path is out of scope):
- Native's current `$children` is heterogeneous: contains named-child object entries AND numeric kind IDs for anonymous tokens. After the refactor, named-child objects move to `_<kind>` keys; numeric anon-token kind IDs stay in `$children`.
- TS readNode promotes anonymous tokens to `_<text>` keys via `promoteAnonymousKeyword` (e.g., `_(`, `_)`). Different shape but out of scope.

For `attributed_parameter` (the visible-alias name after Section 4):
```ts
{ 
  $type: 'attributed_parameter',
  _attribute_item: AttributeItem | undefined,    // unnamed slot, content kind = attribute_item
  _parameter: Parameter | SelfParameter | VariadicParameter | _Type,  // unnamed slot, primary node-ref's kind = parameter
  $children: [<kind_id_of_'_'_token_if_wildcard_parsed>],  // numeric anon-token kind IDs only
}
```

### 2. Slot model & deriveSlots

`packages/codegen/src/compiler/slot-model.ts` unifies on a single factory:

```ts
export interface SlotModel {
  readonly name: string;
  readonly storageKey: string;       // always `_<name>`
  readonly arity: 'one' | 'many';
  readonly origin: 'field' | 'kind'; // name source — metadata only
}

export function createSlotModel(name: string, arity: SlotArity, origin: 'field' | 'kind'): SlotModel {
  return { name, storageKey: `_${name}`, arity, origin };
}
```

`createNamedSlotModel` and `createUnnamedChildrenSlotModel`/`createUnnamedKindSlotModel` collapse into this one factory. Callers pass the slot's `origin` for diagnostic purposes; the `storageKey` derivation does not branch on it.

`deriveSlots` (`compiler/node-map.ts`) — the 3 sites that produce unnamed slots:

- baseName / cleanName logic stays (already content-kind-derived).
- Set `storageName = name` for all unnamed slot creation sites (3 sites at lines 884/895, 924/927, 952/955 today; today they hardcode `'children'`).
- Drop the `'children' / 'child'` fallback in the no-node-ref case — such slots should never be produced (no content to name → no slot).
- Slot record's `source: 'inferred'` field renames to `origin: 'kind'`. Field-origin slots get `origin: 'field'`.

### 3. Read contract (native — grammar-agnostic)

This section describes the change to the **native** Rust `read_node` (`rust/crates/sittir-core/src/read_node.rs::read_children`). The TS-side `readNode` is explicitly out of scope (see Non-goals).

For each child of a CST node:

1. **Has tree-sitter field tag** (`field_name_for_child(i)` returns `Some(name)`):
   - Assign to `fields_acc[name]`.
   - Multi-value accumulation: existing same-key entry → array; first time → singleton.
   - (Existing behavior — unchanged.)

2. **No field tag, `child.is_named() = true`** (the child's kind is a named grammar rule, including aliased patterns):
   - Assign to `fields_acc[child.kind()]` (same map; the kind name acts as the slot key).
   - Same multi-value accumulation rule.
   - **NEW behavior** — today these children push as full `NodeData` objects into `children_acc`. After the refactor they live as their own `_<kind>` storage entries.

3. **No field tag, `child.is_named() = false`** (anonymous literal token):
   - Push the kind ID to `children_acc` (today native pushes the kind ID as a number; verified via probe-kind trace).
   - **Unchanged** from today.

Final serialized `NodeData`:
- Stamp `_<name>: ...` for every entry in `fields_acc` (already the standard serialization path — works the same for field-tagged and kind-routed entries).
- Set `$children: children_acc` only when `children_acc` is non-empty. After the refactor, `$children` contains anon-token kind IDs only (numeric), no named-child objects.

### 4. Pattern rules in `groups:` block

The existing `groups:` block (declared in `packages/<grammar>/overrides.ts`) extends to handle body-pattern-based pattern-replacement rules in addition to its existing path-based group lifting. Discriminated by value shape:

```ts
groups: {
  // Existing: path-based group lift (object value = { path: discriminator })
  visibility_modifier: { '1/1': 'parens' },
  
  // New: body-pattern (function value = pattern body to detect + substitute)
  attributed_parameter: ($) => seq(
    optional($.attribute_item),
    choice($.parameter, $.self_parameter, $.variadic_parameter, '_', $._type)
  ),
  attributed_field_declaration: ($) => seq(repeat($.attribute_item), $.field_declaration),
  attributed_enum_variant: ($) => seq(repeat($.attribute_item), $.enum_variant),
  attributed_type_parameter: ($) => seq(
    repeat($.attribute_item),
    choice($.metavariable, $.type_parameter, $.lifetime_parameter, $.const_parameter)
  ),
}
```

Codegen handling for body-pattern entries:

1. **Wire phase**: detect each pattern body. Walk every other rule's body in the `rules:` block. Find sub-trees that structurally match the pattern body (using existing `patternBodyEqual` predicate). Replace matches with `alias($._<key>, $.<key>)` — so tree-sitter emits the visible kind name at parse time.
2. **Internal naming**: the hidden helper rule is emitted as `_<key>` in `grammar.json`'s rule map (e.g., `_attributed_parameter`). Author uses the visible name `<key>` in the `groups:` block; codegen handles the `_` prefix for internal storage.
3. **Sittir IR**: the kind name in the IR is the visible name (e.g., `attributed_parameter`). Slot derivation operates on the visible kind. Read produces NodeData with `$type = 'attributed_parameter'`.
4. **Wire's old auto-detection retires**: `applyWirePatternReplacement` (`packages/codegen/src/dsl/wire/wire.ts:1096`) previously iterated `_`-prefixed rules with complex bodies in `rules:`. It now iterates `groups:` body-pattern entries instead. The implicit "leading-underscore-means-pattern" convention goes away — patterns are declared explicitly.
5. **Sittir IR mirror**: `applyPatternReplacement` in `packages/codegen/src/compiler/evaluate.ts` mirrors the wire-phase substitution at the IR level (handling base grammar rules wire can't reach). This mirror also migrates from `_`-prefix detection to `groups:` body-pattern iteration as part of the same change.

**Migration** (rust): the 4 existing `_attributed_*` entries in `packages/rust/overrides.ts` `rules:` block move to `groups:` block with their key renamed (drop leading `_`). Existing entries currently look like:
```ts
rules: { _attributed_parameter: ($) => seq(...) }
```
become:
```ts
groups: { attributed_parameter: ($) => seq(...) }
```

### 5. Emitter changes

The principle: once `deriveSlots` produces a unified slot list (each slot already named, each with `_<name>` storage), the emitters that iterate slots via `AssembledBranch.fields` pick up everything naturally. No new dispatch logic.

**Two-line redirect in `compiler/node-map.ts`**:
```ts
// `fields` now returns all slots.
get fields(): readonly AssembledNonterminal[] {
  return Object.values(this.slots);
}
// `children` getter retires (or returns empty array for back-compat lint).
```

After this redirect, every emitter (`wrap.ts`, `types.ts`, `factories.ts`, `from.ts`, `render-module.ts`) that loops over `.fields` automatically emits per-slot for everything. The `if (children.length > 0) { ... }` branches that hardcoded `$children` become dead code on empty input; cleanup pass removes them but functional correctness holds from the redirect.

**One walker adjustment** in `compiler/template-walker.ts`:

The walker operates on the raw rule tree, not the slot model, so it doesn't auto-adapt. The SYMBOL handler:
```ts
// Before
if (seen.has('children')) return [];
seen.add('children');
return [emitChildren()];

// After
if (seen.has(symName)) return [];
seen.add(symName);
return [emitChildren(symName)];  // emits `$$$<SYMNAME>` (uppercase content kind)
```

Then `translateToJinja` lowercases → `{{ <kind> | join(...) }}`. This naturally:
- Eliminates the SEQ-sibling-masking bug (each symbol has its own `seen` key).
- Generates templates that reference the new `_<kind>` storage keys.
- Composes with `normalizeChildrenPlaceholderArity` which already handles `$$$NAME` → `$NAME` arity collapse.

### 6. Native read implementation

`rust/crates/sittir-core/src/read_node.rs::read_children` implements the Section 3 predicate split. This is the ONLY read-side change in scope.

```rust
// Before:
match node.field_name_for_child(i) {
    Some(name) => assign_named_slot(&mut fields_acc, name, data),
    None => children_acc.push(data),
}

// After:
match node.field_name_for_child(i) {
    Some(name) => assign_named_slot(&mut fields_acc, name, data),
    None => {
        if child.is_named() {
            assign_named_slot(&mut fields_acc, child.kind(), data);
        } else {
            children_acc.push(data);  // anonymous-token bucket (unchanged)
        }
    }
}
```

- `fields_acc` becomes the universal named-slots accumulator (field-tagged AND kind-routed).
- `children_acc` shrinks to the anonymous-token bucket (numeric kind IDs only — verified via probe-kind trace at baseline).
- `child.kind()` returns the visible kind name (alias for aliased rules — see Section 4) — exactly what we want for routing.
- Downstream `NodeData → JSON` serialization (`fields` HashMap → `_<key>` top-level keys) is already in place. Kind-routed entries flow through the same path.

### 7. Validate + tests migration

**`packages/codegen/src/validate/common.ts`** — 6 sites that branch on `$children` literal (lines 723, 758, 792, 811, 828, 931). Replace `key === '$children'` with `key.startsWith('_')` to identify storage keys uniformly. The `$children` literal check stays only where the validator distinguishes the anonymous-token bucket from named slots.

**`packages/codegen/src/validate/read-render-parse.ts:97`** — one site that drills into `data.$children`. Same fix: iterate keys with `_` prefix instead.

**`packages/common/src/native-boundary.ts:93`** — comment reference; update wording.

**Tests** — mechanical updates to test files that assert on emitted code shape:
- `packages/codegen/src/__tests__/wrap-variant-emit.test.ts`
- `packages/codegen/src/__tests__/native-transport-emit.test.ts` (6 sites)
- `packages/codegen/src/__tests__/slot-model.test.ts` (2 sites)
- `packages/codegen/src/__tests__/polymorph-hoist-scalar.test.ts`
- `packages/codegen/src/__tests__/factory-roundtrip-harness.test.ts` (3 sites)

Each expects the new `pub <kind>: ...` / `_<kind>` shape instead of `pub children: ...` / `$children`.

**Hand-written data fixtures** — none. The 3 grammars (rust/python/typescript) generate everything; the rust crate's `test-fixtures.json` regenerates.

## Implementation order

The implementation plan (forthcoming via writing-plans) sequences:

1. slot-model.ts unification (one factory, drop the named-vs-unnamed split).
2. deriveSlots: `origin` rename, drop `'children'/'child'` fallback.
3. AssembledBranch.fields redirect (all slots).
4. Template-walker: kind-keyed `$$$<KIND>` + per-symbol `seen` tracking.
5. Native `read_children` predicate split (the only read-side change in scope).
6. `groups:` block body-pattern support (codegen wiring).
7. Migrate the 4 rust `_attributed_*` rules from `rules:` to `groups:`.
8. Validate / read-render-parse.ts `$children` literal cleanup.
9. Test files mechanical updates.
10. Regen all 3 grammars; cargo build; measure AST.

## Future work (out of scope)

- **Template walker reads grammar rules directly, not legacy YAML**: the walker takes legacy YAML format as input for no compelling reason. Should read grammar rules / nodes directly.
- **TS `readNode` migration**: `packages/common/src/readNode.ts` is intentionally out of scope for this refactor. After native lands, the TS reader can be migrated to symmetry, or replaced entirely by routing TS validation through the native `parse_and_read` (which it already does for `--backend native`).
- **Cleanup pass removing dead `children`-branches in emitters**: after redirect lands, the `if (children.length > 0) { ... }` blocks in `wrap.ts`, `types.ts`, etc. become unreachable. Mechanical removal pass.

## Success criteria

1. Codegen runs without errors on all 3 grammars (rust, python, typescript).
2. Rust crate builds via `cargo build` after regen.
3. Validator runs end-to-end: `pnpm exec tsx packages/validator/src/cli.ts counts --backend native <grammar>`.
4. Rust AST count holds or improves vs baseline (134/107). Target: close the `_attributed_*`-related class of failures; specifically the ~41 events identified in the `parameters[1].parameter: type parameter ≠ variadic_parameter` cluster.
5. No regressions in `pnpm exec tsc -p packages/codegen` (TS compile of codegen sources).

## Risk register

- **Test breakage scope**: the test file updates are mechanical but extensive. A test missed during migration produces noise in the validator. Mitigation: grep `$children` exhaustively before final regen.
- **wrap.ts dead-branch removal vs cleanup deferred**: if the dead-branch cleanup is deferred, generated wrap.ts may include unreachable `if` blocks. Cosmetic but should be addressed in the cleanup pass.
- **Pattern-detection regression**: switching from `_`-prefix auto-detection to `groups:` block explicit listing means any unmigrated pattern rule silently stops being substituted. Mitigation: audit `packages/<grammar>/overrides.ts` `rules:` block for `_`-prefixed rules with complex bodies before migration; the existing 4 rust rules are the known set.
- **Aliased CST node kind name mismatch**: tree-sitter exposes the alias name via `child.kind()`, but the parser's kind-id table maps both `_x` and `x` to distinct symbols. Need to verify sittir's kind-id resolution handles the visible alias name correctly across read + render.
