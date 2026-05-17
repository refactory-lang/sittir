# Kind-Named Slots Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify sittir's slot model so every slot has a content-derived name + `_<name>` storage key, closing the `$children` collision class. Native read path becomes grammar-agnostic kind-routing.

**Architecture:** The change lands in five layers. (1) `slot-model.ts` collapses to a single factory. (2) `deriveSlots` already names slots by content kind — clean up legacy fallbacks. (3) `AssembledBranch.fields` returns all slots; downstream emitters iterate uniformly with no special-case branches. (4) Template walker uses per-symbol `seen` keys, emitting `$$$<KIND>` placeholders. (5) Native `read_children` adds a `is_named()`-based predicate to route named-no-field-tag children to `_<kind>` instead of bucketing into `$children`. The 4 rust `_attributed_*` pattern-replacement rules migrate to a body-pattern variant of the existing `groups:` overrides block, gaining `alias()`-driven visibility so their grouping survives the parse.

**Tech Stack:** TypeScript codegen (`packages/codegen/src/**`), Rust native crate (`rust/crates/sittir-core/**`), tree-sitter, napi-rs, vitest, cargo.

**Source spec:** `docs/superpowers/specs/2026-05-17-kind-named-slots-design.md`

**Baseline at start:** rust 134/136 rrp, 107 ast. Validator command: `pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust`.

---

## Chunk 1: Foundation — slot model + deriveSlots cleanup

This chunk lands the slot-model unification without changing observable behavior. All changes are inert at this point — the new factory produces the same shape because no consumer yet branches on the new `origin` field. Validates that the system tolerates the structural rename.

### Task 1.1: Unify slot-model.ts factories

**Files:**
- Modify: `packages/codegen/src/compiler/slot-model.ts`
- Modify: `packages/codegen/src/__tests__/slot-model.test.ts`

**Goal:** Single `createSlotModel(name, arity, origin)` factory producing `_<name>` storage for both named (field) and unnamed (kind) slots.

- [ ] **Step 1: Update slot-model.ts to add `origin` and unified factory**

Replace contents of `packages/codegen/src/compiler/slot-model.ts`:

```ts
export type SlotArity = 'one' | 'many';
export type SlotOrigin = 'field' | 'kind';

export interface SlotModel {
	readonly name: string;
	readonly storageKey: string;     // always `_<name>`
	readonly arity: SlotArity;
	readonly origin: SlotOrigin;     // name source — metadata only; consumers should not branch on this
}

export function createSlotModel(name: string, arity: SlotArity, origin: SlotOrigin): SlotModel {
	return { name, storageKey: `_${name}`, arity, origin };
}

// Compatibility shims for migration. Callers updated to createSlotModel in later tasks.
export function createNamedSlotModel(name: string, arity: SlotArity): SlotModel {
	return createSlotModel(name, arity, 'field');
}

export function createUnnamedKindSlotModel(kindName: string, arity: SlotArity): SlotModel {
	return createSlotModel(kindName, arity, 'kind');
}

/**
 * @deprecated TEMPORARY — kept while existing callers still pass the merged-children
 * semantics. Returns the legacy `$children` storage key. Once all callers migrate
 * to per-slot `createUnnamedKindSlotModel(actualKindName, ...)`, this disappears.
 */
export function createUnnamedChildrenSlotModel(arity: SlotArity): SlotModel {
	return { name: 'children', storageKey: '$children', arity, origin: 'kind' };
}

export function slotStorageKey(slot: SlotModel): string {
	return slot.storageKey;
}
```

- [ ] **Step 2: Update slot-model test expectations**

Edit `packages/codegen/src/__tests__/slot-model.test.ts`:

Replace the existing test body's expectations:
```ts
expect(slotStorageKey(named)).toBe('_body');
expect(slotStorageKey(children)).toBe('$children');
```

With:
```ts
import { createNamedSlotModel, createUnnamedKindSlotModel, createUnnamedChildrenSlotModel, slotStorageKey } from '../compiler/slot-model.ts';

// Named slot — origin='field', storage `_<name>`
const named = createNamedSlotModel('body', 'one');
expect(slotStorageKey(named)).toBe('_body');
expect(named.origin).toBe('field');

// Kind-named slot — origin='kind', storage `_<kind>`
const kind = createUnnamedKindSlotModel('attribute_item', 'many');
expect(slotStorageKey(kind)).toBe('_attribute_item');
expect(kind.origin).toBe('kind');

// Legacy children slot — kept for migration
const children = createUnnamedChildrenSlotModel('many');
expect(slotStorageKey(children)).toBe('$children');
```

- [ ] **Step 3: Verify TS compile**

Run: `pnpm exec tsc -p packages/codegen --noEmit`
Expected: no errors.

- [ ] **Step 4: Run slot-model unit test**

Run: `pnpm exec vitest run packages/codegen/src/__tests__/slot-model.test.ts`
Expected: pass. If vitest fails to load due to broader test suite issues (per §H3), run via direct tsx instead: `pnpm exec tsx packages/codegen/src/__tests__/slot-model.test.ts` and verify no throw.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/compiler/slot-model.ts packages/codegen/src/__tests__/slot-model.test.ts
git commit -m "slot-model: unified factory with origin metadata"
```

---

### Task 1.2: deriveSlots — rename `source` to `origin`, drop literal-children fallback

**Files:**
- Modify: `packages/codegen/src/compiler/node-map.ts` (lines ~880-967 — the 3 inferred-slot creation sites)

**Goal:** Inferred slots are kind-named at creation. The `'children'/'child'` fallback when no node-ref exists goes away (it shouldn't produce a slot at all).

- [ ] **Step 1: Locate the seq positional slot creation site**

Run: `rg -n "storageName: baseName" packages/codegen/src/compiler/node-map.ts`
Expected: 1 line around 895.

- [ ] **Step 2: Update the seq positional slot — drop literal fallback, rename source→origin**

In `packages/codegen/src/compiler/node-map.ts`, find the seq positional slot block (around line 879-902). Replace:

```ts
const baseName = firstRef
    ? ((firstRef.node as UnresolvedRef).name ?? '').replace(/^_+/, '') || (isMultiSlot ? 'children' : 'child')
    : isMultiSlot
        ? 'children'
        : 'child';
```

With:

```ts
const refName = firstRef
    ? ((firstRef.node as UnresolvedRef).name ?? '').replace(/^_+/, '')
    : '';
if (!refName) {
    // No content kind to name the slot — should not produce a slot at all.
    // Previously fell back to 'children'/'child' which caused storage-name collisions.
    throw new Error(
        `deriveSlots: seq positional has no node-ref to derive slot name from. ` +
        `Values: ${JSON.stringify(values.map((v) => v.kind))}`
    );
}
const baseName = refName;
```

And update the returned record's `source: 'inferred'` to `origin: 'kind' as const,` (keep `source: 'inferred'` AS WELL if other code still reads it — verify in step 4).

- [ ] **Step 3: Update the top-level SYMBOL slot creation (line ~913-941)**

Same idea: ensure `cleanName` is used as the slot name, change `source: 'inferred'` to also include `origin: 'kind' as const`. The existing `cleanName` logic is correct — no fallback to drop here.

- [ ] **Step 4: Update the top-level supertype slot creation (line ~942-967)**

Same: include `origin: 'kind' as const`.

- [ ] **Step 5: Check if `source` is still referenced elsewhere**

Run: `rg -n "slot\.source|\.source === 'inferred'|\.source !== 'inferred'" packages/codegen/src/`
Expected: references in `node-map.ts` (AssembledBranch.fields/children getters) and possibly emitters. If references exist, KEEP `source: 'inferred' as const` on the slot records alongside the new `origin: 'kind' as const`. The `source` field is the migration bridge; remove later.

- [ ] **Step 6: Update AssembledNonterminal interface**

Find the `AssembledNonterminal` interface (around line 1660). Add an optional `origin?: SlotOrigin` field alongside `source`. Import `SlotOrigin` from `slot-model.ts`.

- [ ] **Step 7: TS compile**

Run: `pnpm exec tsc -p packages/codegen --noEmit`
Expected: no errors.

- [ ] **Step 8: Run codegen on rust to verify no behavior change**

Run: `pnpm exec tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src 2>&1 | tail -3`
Expected: completes without throwing. `vitest.config.ts` line in output.

- [ ] **Step 9: Verify slot-collision warning is gone for `_attributed_parameter`**

Run: `pnpm exec tsx packages/codegen/src/scripts/probe-stages.ts --grammar rust --kind _attributed_parameter --brief 2>&1 | rg "storageName collision" | head`
Expected: no `_attributed_parameter` collision line (it had two `children`-keyed slots before; now they're `attribute_item` + `parameter`).

- [ ] **Step 10: Measure AST — should be unchanged from baseline 134/107**

Run: `pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust 2>&1 | rg "read-render-parse"`
Expected: `read-render-parsePass=134 ... read-render-parseAstMatchPass=107`. Change is inert (only slot.storageName, not the slot-model SlotModel.storageKey).

- [ ] **Step 11: Commit**

```bash
git add packages/codegen/src/compiler/node-map.ts
git commit -m "deriveSlots: kind-name unnamed slots, drop children/child fallback"
```

---

### Task 1.3: AssembledBranch.fields redirect to all slots

**Files:**
- Modify: `packages/codegen/src/compiler/node-map.ts` (`fields` and `children` getters around line 2819-2830)

**Goal:** `fields` returns ALL slots (origin='field' AND origin='kind'). Existing emitter loops that iterate `fields` now pick up kind-named slots without special-case branches. `children` getter retires (returns empty array for back-compat).

- [ ] **Step 1: Update the getters**

Find the getters in `node-map.ts:2819-2830`. Replace:

```ts
get fields(): readonly AssembledNonterminal[] {
    return Object.values(this.slots).filter((s) => s.source !== 'inferred');
}

get children(): readonly AssembledNonterminal[] {
    return Object.values(this.slots).filter((s) => s.source === 'inferred');
}
```

With:

```ts
get fields(): readonly AssembledNonterminal[] {
    // After unified-slot refactor (spec 2026-05-17): all slots have a name and `_<name>` storage.
    // The `origin` field on each slot indicates whether the name came from a `field()` wrapper
    // ('field') or from the content kind ('kind'). Consumers should NOT branch on origin —
    // they're all just slots.
    return Object.values(this.slots);
}

get children(): readonly AssembledNonterminal[] {
    // Retired post-unification — no longer a separate slot category.
    // Kept as empty-returning getter for back-compat with un-migrated callers.
    return [];
}
```

Also update AssembledGroup and AssembledPolymorph if they have analogous getters (search via `rg "get children\(\)" packages/codegen/src/compiler/node-map.ts`).

- [ ] **Step 2: TS compile**

Run: `pnpm exec tsc -p packages/codegen --noEmit`
Expected: no errors.

- [ ] **Step 3: Regen rust**

Run: `pnpm exec tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src 2>&1 | tail -3`

This will likely produce changes in generated files because emitters that iterated `fields` and `children` separately now see all slots in `fields` (and empty `children`). The `if (children.length > 0) { ... }` branches in emitters become dead code; their output disappears from generated files.

- [ ] **Step 4: Inspect generated diff for surprises**

Run: `git diff --stat packages/rust/src/types.ts packages/rust/src/wrap.ts packages/rust/src/factories.ts | head`

Expected: changes scoped to type / wrap / factory shape transitions. If diff is empty, the `fields`/`children` getters weren't being used the way we expected — investigate before continuing.

- [ ] **Step 5: cargo build the rust crate**

Run: `cd rust/crates/sittir-rust && cargo build 2>&1 | tail -20 ; cd -`
Expected: build succeeds. If errors, transport.rs likely needs the same fix in `render-module.ts` emitter — defer that to Chunk 5 cleanup if errors are limited to dead-code unused warnings; otherwise pause and investigate.

- [ ] **Step 6: Measure AST**

Run: `pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust 2>&1 | rg "read-render-parse"`
Expected: AST may move (probably down momentarily) because the emitters now emit `_<kind>` storage keys but the native read still bucketed into `$children`. The native read change in Chunk 3 closes this gap. **DO NOT REVERT** — this is the expected midway state.

If rrp count itself drops significantly (>10), that's a real problem — investigate before continuing.

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/compiler/node-map.ts packages/rust/
git commit -m "AssembledBranch.fields: return all slots (origin field or kind)"
```

---

## Chunk 2: Template walker kind-routing

This chunk fixes the template emission to use kind-keyed placeholders. Templates emitted before this chunk reference `_<kind>` storage keys via `slot.storageKey` (already correct from Chunk 1), but the walker's `$$$CHILDREN` literal needs replacement with `$$$<KIND>` so the placeholder names align with the storage names.

### Task 2.1: Walker emits kind-keyed placeholders

**Files:**
- Modify: `packages/codegen/src/compiler/template-walker.ts` (SYMBOL handler around line 968-1011)

**Goal:** Walker uses the actual symbol's kind name for `seen` tracking and `$$$<KIND>` placeholder emission, matching the slot model's storage key.

- [ ] **Step 1: Find current emitChildren helper**

Run: `rg -n "emitChildren|seen\.has\('children'\)|\\\$\\\$\\\$CHILDREN" packages/codegen/src/compiler/template-walker.ts | head -10`

Expected lines: ~308 (emitChildren definition), ~984, ~1009, ~1011 (SYMBOL handler `seen.has('children')` + `emitChildren()` calls).

- [ ] **Step 2: Update emitChildren to take a name parameter**

Around line 308:

```ts
const emitChildren = (slotName: string): string => {
    const placeholder = `$$$${slotName.toUpperCase()}`;
    return optionalFields?.has(slotName)
        ? emitJinjaConditional(slotName, placeholder)
        : placeholder;
};
```

- [ ] **Step 3: Update group-lift SYMBOL handler (line ~984)**

Replace:
```ts
if ((rule as { source?: string }).source === 'group-lift') {
    if (seen.has('children')) return [];
    seen.add('children');
    return [emitChildren()];
}
```

With:
```ts
if ((rule as { source?: string }).source === 'group-lift') {
    const slotName = (rule as { name: string }).name.replace(/^_+/, '') || 'children';
    if (seen.has(slotName)) return [];
    seen.add(slotName);
    return [emitChildren(slotName)];
}
```

- [ ] **Step 4: Update the main SYMBOL handler (line ~1007-1011)**

Replace:
```ts
// Visible symbols (and hidden ones we can't expand) render
// as unconsumed named children.
if (seen.has('children')) return [];
seen.add('children');
return [emitChildren()];
```

With:
```ts
// Visible symbols (and hidden ones we can't expand) render
// as their own kind-named slot.
const slotName = symName.replace(/^_+/, '');
if (seen.has(slotName)) return [];
seen.add(slotName);
return [emitChildren(slotName)];
```

- [ ] **Step 5: TS compile**

Run: `pnpm exec tsc -p packages/codegen --noEmit`
Expected: no errors.

- [ ] **Step 6: Regen rust + inspect a sample template**

Run: `pnpm exec tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src 2>&1 | tail -3 ; cat packages/rust/templates/_attributed_parameter.jinja`

Expected template (no trailing `_`, kind-named slot placeholder — the exact name depends on slot derivation):
```
{#- @generated by @sittir/codegen — do not edit. Source: packages/codegen/src/emitters/templates.ts -#}
{{ attribute_item | join(" ") }} {{ parameter | join(" ") }}
```
or similar — the exact placeholders should match the slot names from probe-stages.

If trailing `_` is still there, the SEQ-sibling-masking bug from sittir-11 may need walker-side fix too (look at choice handler). Document if needed.

- [ ] **Step 7: Measure AST**

Run: `pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust 2>&1 | rg "read-render-parse"`
Expected: AST count may shift (likely down further, since templates now reference `_<kind>` but native read hasn't been updated). Continue — Chunk 3 closes this.

- [ ] **Step 8: Commit**

```bash
git add packages/codegen/src/compiler/template-walker.ts packages/rust/
git commit -m "walker: emit kind-keyed placeholders + per-symbol seen tracking"
```

---

### Task 2.2: Regen other grammars

**Files:**
- Regen: `packages/python/`, `packages/typescript/`

Per cleanup-rules §B3: any change to a shared compiler/emitter requires regen of ALL three grammars.

- [ ] **Step 1: Regen python**

Run: `pnpm exec tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src 2>&1 | tail -3`

- [ ] **Step 2: Regen typescript**

Run: `pnpm exec tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src 2>&1 | tail -3`

- [ ] **Step 3: Measure all 3 grammars**

Run: `pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust 2>&1 | rg "read-render-parse" | head -2 ; pnpm exec tsx packages/validator/src/cli.ts counts --backend native python 2>&1 | rg "read-render-parse" | head -2 ; pnpm exec tsx packages/validator/src/cli.ts counts --backend native typescript 2>&1 | rg "read-render-parse" | head -2`

Expected: numbers shifted (likely lower across all 3) due to template/read mismatch. The native read change in Chunk 3 corrects this.

- [ ] **Step 4: Commit**

```bash
git add packages/python/ packages/typescript/
git commit -m "regen: python + typescript after walker kind-routing"
```

---

## Chunk 3: Native read predicate split

This is the only read-side change. After this lands, the templates' `_<kind>` placeholders find their data because the read produces matching keys.

### Task 3.1: Native read_children — add is_named()-based routing

**Files:**
- Modify: `rust/crates/sittir-core/src/read_node.rs` (lines 118-172)

**Goal:** Named children without field tag route to `fields_acc[child.kind()]` (becomes `_<kind>` after serialization), same accumulator as field-tagged. Anonymous tokens continue to `children_acc`.

- [ ] **Step 1: Inspect current `read_children` impl**

Run: `awk 'NR>=118 && NR<=170' rust/crates/sittir-core/src/read_node.rs`

Verify the structure matches the spec's "Before" snippet (Section 6).

- [ ] **Step 2: Modify the None branch to split on `is_named()`**

Replace the `None` arm of the match:

```rust
None => {
    let data = if child.child_count() == 0 {
        read_materialized_leaf(child, source)
    } else {
        read_child_stub(child, source, node_handle, i as u16)
    };
    children_acc.push(data);
}
```

With:

```rust
None => {
    let data = if child.child_count() == 0 {
        read_materialized_leaf(child, source)
    } else {
        read_child_stub(child, source, node_handle, i as u16)
    };
    if child.is_named() {
        // Named child without a field tag — route by kind to a `_<kind>` slot.
        // This produces a kind-named storage entry in the serialized NodeData,
        // uniform with field-tagged slots (spec 2026-05-17).
        assign_named_slot(&mut fields_acc, child.kind(), data);
    } else {
        // Anonymous literal token — stays in the legacy children bucket
        // (numeric kind IDs only after the slot model unification).
        children_acc.push(data);
    }
}
```

- [ ] **Step 3: cargo build**

Run: `cd rust/crates/sittir-core && cargo build 2>&1 | tail -10 ; cd -`
Expected: succeeds.

- [ ] **Step 4: Rebuild the sittir-rust napi binary**

Run: `cd rust/crates/sittir-rust && pnpm run build 2>&1 | tail -5 ; cd -`
Expected: succeeds. (napi rebuild is required for the validator's native backend to pick up the new read behavior.)

- [ ] **Step 5: Verify with probe-kind --engine native --trace**

Run: `pnpm exec tsx packages/codegen/src/scripts/probe-kind.ts --grammar rust --kind parameters --source 'fn foo(#[a] x: u8) {}' --trace --pretty 2>&1 | rg -A 30 "native\":" | rg -A 20 "rawNodeData" | head -30`

Expected: `parameters`'s NodeData now contains `_attribute_item` and `_parameter` (named slots from kind routing) instead of `$children` array of objects. `$children` may contain numeric anon-token IDs only.

- [ ] **Step 6: Measure rust AST**

Run: `pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust 2>&1 | rg "read-render-parse"`

**This is the moment of truth.** Expected: AST count should now move UP from baseline 107 — the storage collision bug for `_attributed_parameter` and related multi-unnamed-slot rules is closed. Target: >107.

If number is the same as baseline or lower, the kind-routing isn't being picked up by the slot model or templates. Trace via probe-kind to identify the gap.

- [ ] **Step 7: Measure python + typescript**

Run: `pnpm exec tsx packages/validator/src/cli.ts counts --backend native python 2>&1 | rg "read-render-parse" | head -2 ; pnpm exec tsx packages/validator/src/cli.ts counts --backend native typescript 2>&1 | rg "read-render-parse" | head -2`

Expected: should also recover (likely back to or above baseline). Document the deltas.

- [ ] **Step 8: Commit**

```bash
git add rust/crates/sittir-core/src/read_node.rs rust/crates/sittir-rust/
git commit -m "native read: kind-route named-no-field-tag children to _<kind>"
```

---

## Chunk 4: groups: body-pattern support + rust attribute migration

This chunk extends the existing `groups:` override block to handle body-pattern entries (function values) in addition to its current path-based entries (object values). The 4 rust `_attributed_*` rules then migrate, gaining `alias()` visibility so their grouping survives the parse.

### Task 4.1: Extend groups: block typings

**Files:**
- Modify: `packages/codegen/src/dsl/wire/wire.ts` (GroupsConfig type around the existing `groups:` declaration)

**Goal:** Type `GroupsConfig` to accept either a path-discriminator object OR a function (body pattern).

- [ ] **Step 1: Find GroupsConfig type definition**

Run: `rg -n "type GroupsConfig|GroupsConfig<" packages/codegen/src/dsl/wire/wire.ts | head -5`

- [ ] **Step 2: Widen the value type**

Update GroupsConfig so values can be:
- `Record<string, string>` (existing: path → discriminator)
- `RuleFn` (new: pattern body function `($) => Rule`)

A union type works:
```ts
type GroupsConfigValue = Record<string, string> | RuleFn;
type GroupsConfig<Base> = Partial<Record<keyof Base | string, GroupsConfigValue>>;
```

- [ ] **Step 3: TS compile**

Run: `pnpm exec tsc -p packages/codegen --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/codegen/src/dsl/wire/wire.ts
git commit -m "wire: GroupsConfig accepts body-pattern function values"
```

---

### Task 4.2: Wire phase — detect groups body-pattern entries

**Files:**
- Modify: `packages/codegen/src/dsl/wire/wire.ts` (extend `applyWirePatternReplacement` around line 1096)
- Modify: `packages/codegen/src/compiler/evaluate.ts` (mirror `applyPatternReplacement`)

**Goal:** Wire iterates `groups:` entries with function values and uses them as pattern candidates. Substitutes matches with `alias($._<key>, $.<key>)` so the visible kind name appears in the CST.

- [ ] **Step 1: Find `applyWirePatternReplacement`**

Run: `rg -n "applyWirePatternReplacement" packages/codegen/src/dsl/wire/wire.ts`

- [ ] **Step 2: Source candidate list from `groups:` body-pattern entries instead of `_`-prefixed rules**

Modify `applyWirePatternReplacement` to take the groups: config:

```ts
function applyWirePatternReplacement(
    rules: Record<string, RuleFn>,
    groupsConfig: Record<string, GroupsConfigValue> | undefined
): void {
    const candidates: WirePatternCandidate[] = [];
    const $ = makeSimpleDollarProxy();

    if (groupsConfig) {
        for (const [visibleName, value] of Object.entries(groupsConfig)) {
            if (typeof value !== 'function') continue; // skip path-based groups entries
            let body: RuntimeRule;
            try {
                const result = (value as RuleFn).call(undefined, $, undefined);
                if (!result || typeof result !== 'object' || typeof (result as { type?: unknown }).type !== 'string') continue;
                body = result as RuntimeRule;
            } catch {
                continue;
            }
            const uppercase = body.type === body.type.toUpperCase();
            candidates.push({ name: `_${visibleName}`, body, uppercase, aliasAs: visibleName });
        }
    }

    if (candidates.length === 0) return;
    const candidateNames = new Set(candidates.map((c) => c.name));
    for (const [name, fn] of Object.entries(rules)) {
        if (candidateNames.has(name)) continue;
        rules[name] = buildPatternReplacingFn(fn, candidates);
    }
    // Emit the hidden rule itself into `rules` if not present (so tree-sitter has a definition to alias)
    for (const c of candidates) {
        if (!(c.name in rules)) {
            const body = c.body;
            rules[c.name] = () => body;
        }
    }
}
```

Also add `aliasAs?: string` field to `WirePatternCandidate` interface.

- [ ] **Step 3: Update `replaceInBodyRt` to emit alias() instead of bare SymbolRef**

Find `replaceInBodyRt`:

```ts
return c.uppercase ? { type: 'SYMBOL', name: c.name } : { type: 'symbol', name: c.name, hidden: true };
```

Replace with:

```ts
if (c.aliasAs !== undefined) {
    // Emit `alias($._<key>, $.<key>)` so tree-sitter exposes the visible CST kind name.
    return c.uppercase
        ? { type: 'ALIAS', content: { type: 'SYMBOL', name: c.name }, named: true, value: c.aliasAs }
        : { type: 'alias', content: { type: 'symbol', name: c.name, hidden: true }, named: true, value: c.aliasAs };
}
return c.uppercase ? { type: 'SYMBOL', name: c.name } : { type: 'symbol', name: c.name, hidden: true };
```

- [ ] **Step 4: Update the caller of `applyWirePatternReplacement`**

Around line 492:
```ts
applyWirePatternReplacement(outRules, context.authoredRuleNames);
```

Becomes:
```ts
applyWirePatternReplacement(outRules, context.groupsConfig);
```

(Verify `context.groupsConfig` is accessible; if not, thread it through.)

- [ ] **Step 5: Mirror the change in evaluate.ts**

Run: `rg -n "applyPatternReplacement|patternReplacementKinds" packages/codegen/src/compiler/evaluate.ts | head -10`

Update the evaluate-side pattern replacement to ALSO source candidates from `groupsConfig` body-pattern entries. The `patternReplacementKinds` set should include the new candidate names.

- [ ] **Step 6: TS compile**

Run: `pnpm exec tsc -p packages/codegen --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/dsl/wire/wire.ts packages/codegen/src/compiler/evaluate.ts
git commit -m "wire+evaluate: groups: body-pattern detection with alias() substitution"
```

---

### Task 4.3: Migrate the 4 rust _attributed_* rules

**Files:**
- Modify: `packages/rust/overrides.ts` (move 4 entries from `rules:` to `groups:` with renamed keys)

**Goal:** Existing `_attributed_*` rules in `rules:` block move to `groups:` block with key `attributed_*` (no leading underscore — that's the visible alias name).

- [ ] **Step 1: Locate the rules in current overrides.ts**

Run: `rg -n "_attributed_" packages/rust/overrides.ts`

Expected: 4 entries (`_attributed_field_declaration`, `_attributed_enum_variant`, `_attributed_parameter`, `_attributed_type_parameter`) currently in `rules:` block (around line 654-686).

- [ ] **Step 2: Find the groups: block**

Run: `rg -n "groups:" packages/rust/overrides.ts | head -3`

- [ ] **Step 3: Remove the 4 entries from rules:**

Cut the 4 `_attributed_*: ($) => seq(...)` entries from the `rules:` block.

- [ ] **Step 4: Add them to groups: with renamed keys**

Add to the `groups:` block:

```ts
attributed_field_declaration: ($) => seq(repeat($.attribute_item), $.field_declaration),
attributed_enum_variant: ($) => seq(repeat($.attribute_item), $.enum_variant),
attributed_parameter: ($) =>
    seq(
        optional($.attribute_item),
        choice($.parameter, $.self_parameter, $.variadic_parameter, '_', $._type)
    ),
attributed_type_parameter: ($) =>
    seq(
        repeat($.attribute_item),
        choice($.metavariable, $.type_parameter, $.lifetime_parameter, $.const_parameter)
    ),
```

- [ ] **Step 5: Regen rust**

Run: `pnpm exec tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src 2>&1 | tail -3`
Expected: succeeds.

- [ ] **Step 6: Verify the visible kinds appear in grammar.json**

Run: `rg '"attributed_parameter"|"_attributed_parameter"' packages/rust/.sittir/src/grammar.json | head`
Expected: both `_attributed_parameter` (the hidden rule) AND `attributed_parameter` (the alias appearance at reference sites) — or just the alias appearance. The hidden rule is in the rules object; the alias appearance is in seq member arrays.

- [ ] **Step 7: Verify CST shows the visible kind**

Run: `pnpm exec tsx packages/codegen/src/scripts/probe-kind.ts --grammar rust --kind attributed_parameter --source 'fn foo(#[a] x: u8) {}' --no-render --pretty 2>&1 | head -30`

Expected: probe-kind finds an `attributed_parameter` CST node (it didn't before — was inlined). The node has `attribute_item` + `parameter` children grouped under it.

- [ ] **Step 8: cargo build**

Run: `cd rust/crates/sittir-rust && pnpm run build 2>&1 | tail -5 ; cd -`
Expected: succeeds.

- [ ] **Step 9: Measure rust AST — should improve further**

Run: `pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust 2>&1 | rg "read-render-parse"`
Expected: AST higher than Chunk 3 result. The `_attributed_parameter` group is now reconstructed at parse time.

- [ ] **Step 10: Commit**

```bash
git add packages/rust/overrides.ts packages/rust/
git commit -m "rust: migrate _attributed_* rules to groups: body-pattern with alias"
```

---

## Chunk 5: Validate cleanup + test migration + final regen + measure

### Task 5.1: validate/common.ts $children literal cleanup

**Files:**
- Modify: `packages/codegen/src/validate/common.ts` (6 sites: lines 723, 758, 792, 811, 828, 931)

**Goal:** Replace `key === '$children'` checks with `key.startsWith('_')` to identify storage keys uniformly. `$children` literal check stays only where anonymous-token bucket distinction matters.

- [ ] **Step 1: List current `$children` sites**

Run: `rg -n "\\\$children" packages/codegen/src/validate/common.ts | head -10`

- [ ] **Step 2: For each site, assess whether the check is "is this any storage key" (use `_` prefix) or "is this the anon-bucket specifically" (keep `$children`)**

Most are the former — they treat `$children` as the catch-all for named-slot data, which after refactor should match any `_*` key.

- [ ] **Step 3: Update each site**

Sample transformation:
```ts
// Before
if (k !== '$children' && !k.startsWith('_')) continue;
// After (semantically equivalent if $children no longer holds named slots)
if (!k.startsWith('_')) continue;
```

Be careful to preserve sites that genuinely check for anonymous-token bucket (very few — verify by inspecting the context). The exception is sites referenced in cleanup-rules §H1 which may treat `$children` as a bucket of arbitrary AnyNodeData entries; for those, drop the literal entirely since the refactor moves the contents elsewhere.

- [ ] **Step 4: Same for read-render-parse.ts:97**

Run: `awk 'NR>=90 && NR<=110' packages/codegen/src/validate/read-render-parse.ts`

Update to iterate `_`-prefixed keys instead of hardcoding `$children`.

- [ ] **Step 5: TS compile**

Run: `pnpm exec tsc -p packages/codegen --noEmit`
Expected: no errors.

- [ ] **Step 6: Measure rust AST — should hold or improve**

Run: `pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust 2>&1 | rg "read-render-parse"`

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/validate/common.ts packages/codegen/src/validate/read-render-parse.ts
git commit -m "validate: $children literal → _<key> prefix check"
```

---

### Task 5.2: Test file mechanical updates

**Files:**
- Modify: `packages/codegen/src/__tests__/native-transport-emit.test.ts` (6 sites)
- Modify: `packages/codegen/src/__tests__/wrap-variant-emit.test.ts`
- Modify: `packages/codegen/src/__tests__/polymorph-hoist-scalar.test.ts`
- Modify: `packages/codegen/src/__tests__/factory-roundtrip-harness.test.ts` (3 sites)

**Goal:** Update assertions to expect the new `_<kind>` shape instead of `$children`.

- [ ] **Step 1: List all test files with `$children` literals**

Run: `rg -l "\\\$children" packages/codegen/src/__tests__/`

- [ ] **Step 2: For each file, inspect the expected shape and rewrite the assertion**

This is mechanical — the old assertion expected `$children` storage; the new expectation is `_<kind>` (the kind depends on the test fixture).

Example transformation in `native-transport-emit.test.ts`:
```ts
// Before
expect(result).toContain('#[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]\n    pub children: Vec<IdentifierTransport>,');
// After (depends on the fixture's actual kind name — e.g., 'identifier')
expect(result).toContain('#[cfg_attr(feature = "napi-bindings", napi(js_name = "_identifier"))]\n    pub identifier: Vec<IdentifierTransport>,');
```

If a test fixture has multiple kinds, the assertion may need updating per-slot.

- [ ] **Step 3: Run the test files**

Run: `pnpm exec vitest run packages/codegen/src/__tests__/ 2>&1 | tail -15` (or if vitest is broken per §H3, run via direct tsx imports of each test).

Expected: tests that were updated pass; tests that were not touched still pass if they don't reference `$children`.

- [ ] **Step 4: Commit**

```bash
git add packages/codegen/src/__tests__/
git commit -m "tests: update $children assertions to _<kind> shape"
```

---

### Task 5.3: Final regen + cross-grammar measure

- [ ] **Step 1: Regen all 3 grammars**

Run:
```bash
pnpm exec tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src 2>&1 | tail -1
pnpm exec tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src 2>&1 | tail -1
pnpm exec tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src 2>&1 | tail -1
```

- [ ] **Step 2: Rebuild rust napi binary**

Run: `cd rust/crates/sittir-rust && pnpm run build 2>&1 | tail -5 ; cd -`

- [ ] **Step 3: Measure all 3 grammars**

Run:
```bash
echo "--- rust ---"
pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust 2>&1 | rg "Pass=|read-render-parse" | head -5
echo "--- python ---"
pnpm exec tsx packages/validator/src/cli.ts counts --backend native python 2>&1 | rg "Pass=|read-render-parse" | head -5
echo "--- typescript ---"
pnpm exec tsx packages/validator/src/cli.ts counts --backend native typescript 2>&1 | rg "Pass=|read-render-parse" | head -5
```

- [ ] **Step 4: Document final numbers in commit message**

Compare against baseline:
- rust: 134/107 (rrp/ast) at baseline → ?
- python: 95/83 → ?
- typescript: 42/36 → ?

Target: AST counts should improve. Specifically, the `parameters[1].parameter` and similar collision-class diffs should drop out.

- [ ] **Step 5: Commit final state**

```bash
git add packages/{rust,python,typescript}/ rust/crates/
git commit -m "regen all: AST measurements after kind-named slots refactor

rust: <baseline-ast> → <new-ast>
python: <baseline-ast> → <new-ast>
typescript: <baseline-ast> → <new-ast>"
```

- [ ] **Step 6: If AST didn't improve as expected, diagnose with SITTIR_DUMP_AST_DIFF=1**

Add the dump from sittir-11 (see `project_ast_gap_diagnostic_sittir11.md`). Inspect remaining diff classes. May identify follow-up work outside this refactor's scope.

---

## Success criteria

1. ✅ Codegen runs without errors on all 3 grammars
2. ✅ Rust crate builds via `cargo build`
3. ✅ Validator runs end-to-end: `pnpm exec tsx packages/validator/src/cli.ts counts --backend native <grammar>`
4. ✅ Rust AST count holds or improves vs baseline 107
5. ✅ No regressions in `pnpm exec tsc -p packages/codegen`
6. ✅ The 4 `_attributed_*` patterns are visible in `probe-kind` output as their alias name

## Risk mitigations from the spec

- **Test breakage scope**: Step 5.2 is mechanical but extensive. Grep `$children` exhaustively before declaring done.
- **wrap.ts dead-branch removal deferred**: Sections 5 of spec calls out that the `if (children.length > 0) { ... }` branches in wrap.ts/types.ts become unreachable — they remain in the source but emit nothing. Functional from day 1; cleanup pass later.
- **Pattern-detection regression**: The migration from `_`-prefix auto-detection to `groups:` explicit listing is one-shot in Step 4.3. The audit step in Step 4.3.1 verifies no other `_`-prefixed rules in rust's `rules:` block need migration.
- **Aliased CST node kind name mismatch**: Step 4.3.7 (probe-kind verification) catches this — if the alias isn't resolving as expected, the probe won't find `attributed_parameter`.
