# Typed Transport Fields — ADR-0016 Deviation Resolution

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every `Box<AnyTransport>` field and children slot in generated per-kind transport structs with the concrete or supertype-typed equivalent, making `AnyTransport` a napi entry-point dispatch artifact only — no internal callers, no slot-level usage anywhere in the system.

**Architecture:** The codegen emitter (`render-module.ts`) currently emits `Box<AnyTransport>` for every field/children slot regardless of whether the slot's kind set is fully known at codegen time. `AssembledField.projection.kinds` already carries the concrete kind list for field slots; `AssembledChild.values` carries the parallel `NodeRef` entries for children slots — from these, the same classification logic applies uniformly to both. Phase 1 targets single-kind slots (both fields and children): when the kind set has exactly one member the slot type is `<ConcreteKind>Transport` (no `Box`, no enum). Phase 2 targets supertype-bound slots: when the kind set is a subset of an `AssembledSupertype.subtypes`, emit a per-supertype enum `<Supertype>Transport` with a custom `FromNapiValue` impl. Because sittir's grammar pipeline never produces unbounded slots (every `AssembledChild.values` has concrete alternatives), every field and children slot in the system is classifiable as concrete or supertype. `AnyTransport` therefore becomes the napi boundary dispatch enum only — one call at the entry point to enter the per-kind typed world; after that, `render_transport_dispatch` has zero internal callers. The `Renderable::Node(&AnyTransport)` escape hatch in the grammar-local `Renderable` enum goes away; per-template render functions call typed helpers directly and accumulate `Renderable::Text` values from the returned `String`.

**Tech Stack:** TypeScript 6.0.2 (ESM, `.ts` import extensions) for `packages/codegen/src/emitters/render-module.ts`; Rust 1.88+ with napi-rs 3 and Askama 0.15 for generated `rust/crates/sittir-{rust,typescript,python}/src/render/templates.rs`; Vitest for TS emitter tests; `cargo test` + `cargo build` for Rust verification.

---

## File Structure

**Codegen — render-module emitter (primary change site)**

- Modify: `packages/codegen/src/emitters/render-module.ts`
  - `rustTransportFieldType` — emit concrete or supertype-enum type instead of `Box<AnyTransport>`.
  - `rustTransportChildrenType` — parallel update for children slots.
  - New export `classifySlot` — single source for slot class (concrete / supertype / none).
  - New export `buildSupertypeTransportSet` — build the supertype registry from `nodeMap`.
  - New export `deriveChildrenKinds` — extract kind set from `AssembledChild.values` (parallel to `projection.kinds` for fields).
  - New helper `emitSupertypeTransportEnum` — emit per-supertype enum + `FromNapiValue`.
  - New helper `emitSupertypeRenderHelper` — emit `render_<supertype>_transport` match fn.
  - `buildSlotRenderCall` — single source for render call per slot class; replaces inline `render_transport_dispatch` at every field and children call site.
  - `buildTypedTemplateBody` and `emitListSlotBuffer` — use `buildSlotRenderCall`; remove all internal calls to `render_transport_dispatch`.

**Emitter test**

- Modify: `packages/codegen/src/__tests__/render-module-emit.test.ts` — failing tests for each task.

**Per-grammar generated artifacts (regenerated, never hand-edited)**

- Generated: `rust/crates/sittir-rust/src/render/templates.rs`
- Generated: `rust/crates/sittir-typescript/src/render/templates.rs`
- Generated: `rust/crates/sittir-python/src/render/templates.rs`

---

## Key architectural invariant: `AnyTransport` is napi-boundary-only

`AnyTransport` is a **dispatch enum at the napi boundary** — not a data model concept. After this plan:

- No per-kind `*Transport` struct has a field of type `Box<AnyTransport>`, `Option<Box<AnyTransport>>`, `Vec<Box<AnyTransport>>`, or `Option<Vec<Box<AnyTransport>>>`.
- No children slot is typed `Vec<Box<AnyTransport>>`.
- No `render_<kind>_transport` function body calls `render_transport_dispatch`.
- `render_transport_dispatch` is called only by the top-level napi entry point `render_transport` — one call per render request from JS, dispatching once into the per-kind typed world.
- The grammar-local `Renderable<'a>` enum's `Node(&'a AnyTransport)` variant (if present) is removed. Per-template render functions call typed helpers directly and produce `Renderable::Text` values from the returned `String`. The `Renderable` family (`Text | Joined`) remains for the Askama template-context surface (`NonterminalView`, `ListNonterminalView`).

---

## Invariants enforced throughout

1. Every switch on a discriminated union ends with `assertNever(x)` — no silent `default:` fallbacks.
2. No `as any` / `@ts-ignore` / `@ts-nocheck` outside the `overrides.ts` exception documented in CLAUDE.md.
3. `kindEntries` is the single source for ID→variant dispatch. No duplicated kind lists.
4. Generated files are never hand-edited. If a generated file is wrong, fix the emitter.
5. DRY: slot classification lives in `classifySlot`; child kind extraction lives in `deriveChildrenKinds`; render call selection lives in `buildSlotRenderCall`. Emitters read from those helpers; no inline re-derivations.

---

## Task 1 — Add `classifySlot`, `buildSupertypeTransportSet`, and `deriveChildrenKinds` helpers

**Why this first:** Every later task depends on knowing, per slot, whether it is concrete-kind, supertype-bound, or (theoretically) unbounded. Putting classification in one helper prevents three separate walkers disagreeing (DRY §1 anti-pattern). `deriveChildrenKinds` is the parallel extraction for children slots (`AssembledChild.values`) that `projection.kinds` already provides for field slots.

**Files:**

- Modify: `packages/codegen/src/emitters/render-module.ts`
- Modify: `packages/codegen/src/__tests__/render-module-emit.test.ts`

### Step 1 — Write the failing tests.

Add to `packages/codegen/src/__tests__/render-module-emit.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  classifySlot,
  buildSupertypeTransportSet,
  deriveChildrenKinds,
  type SlotClass,
} from '../emitters/render-module.ts';

describe('classifySlot', () => {
  it('returns concrete for a single-kind projection', () => {
    expect(classifySlot(['identifier'], new Map())).toEqual<SlotClass>({
      tag: 'concrete',
      kind: 'identifier',
    });
  });

  it('returns supertype when kinds are a subset of an assembled supertype', () => {
    const supertypeMap = new Map([
      ['Expression', new Set(['identifier', 'call_expression', 'binary_expression'])],
    ]);
    const kinds = ['identifier', 'call_expression', 'binary_expression'];
    expect(classifySlot(kinds, supertypeMap)).toEqual<SlotClass>({
      tag: 'supertype',
      supertypeName: 'Expression',
    });
  });

  it('prefers narrower supertype when multiple supertypes cover the kinds', () => {
    // If 'Pattern' is a subset of 'Expression', and kinds match Pattern exactly,
    // the narrower type wins (first match in iteration order is fine — document this).
    const supertypeMap = new Map([
      ['Pattern', new Set(['identifier', 'tuple_pattern'])],
      ['Expression', new Set(['identifier', 'call_expression', 'tuple_pattern'])],
    ]);
    const result = classifySlot(['identifier', 'tuple_pattern'], supertypeMap);
    expect(result.tag).toBe('supertype');
    // Both Pattern and Expression contain the kinds; Pattern is narrower.
    // The exact choice depends on iteration order — document the chosen tiebreak.
  });

  it('returns heterogeneous when kinds span no known supertype', () => {
    const supertypeMap = new Map([
      ['Expression', new Set(['identifier', 'call_expression'])],
    ]);
    const kinds = ['identifier', 'call_expression', 'statement']; // 'statement' not in supertype
    expect(classifySlot(kinds, supertypeMap).tag).toBe('heterogeneous');
  });

  it('returns heterogeneous for empty kinds (degenerate case)', () => {
    expect(classifySlot([], new Map()).tag).toBe('heterogeneous');
  });
});

describe('deriveChildrenKinds', () => {
  it('extracts resolved node-ref kinds from AssembledChild.values', () => {
    // Construct a minimal AssembledChild-shaped object for testing.
    const mockChild = {
      values: [
        { kind: 'node-ref', node: { kind: 'identifier' }, multiplicity: 'array' },
        { kind: 'node-ref', node: { kind: 'call_expression' }, multiplicity: 'array' },
        { kind: 'terminal', value: ',', multiplicity: 'array' },   // terminals ignored
      ],
    };
    expect(deriveChildrenKinds(mockChild as never)).toEqual(['identifier', 'call_expression']);
  });
});
```

### Step 2 — Run and verify failure.

```bash
pnpm test --filter @sittir/codegen render-module-emit
```

Expected: FAIL — `classifySlot`, `buildSupertypeTransportSet`, `deriveChildrenKinds`, `SlotClass` not exported.

### Step 3 — Add the helpers to `render-module.ts`.

In `packages/codegen/src/emitters/render-module.ts`, near the top of the typed-dispatch section (around line 1056):

```ts
/**
 * Classification of a transport slot by its type width.
 *
 * - `concrete`      — exactly one known kind; emit `<Kind>Transport` directly.
 * - `supertype`     — kind set is a subset of a known assembled supertype's
 *                     resolved subtypes; emit `<Supertype>Transport` enum.
 * - `heterogeneous` — no grammar-bound type (theoretically unreachable in
 *                     sittir's pipeline; retained as a compile-safety escape).
 */
export type SlotClass =
  | { readonly tag: 'concrete'; readonly kind: string }
  | { readonly tag: 'supertype'; readonly supertypeName: string }
  | { readonly tag: 'heterogeneous' };

/**
 * Classify a slot's kind set against the supertype registry.
 *
 * Single source of derivation for slot class — all emitters (field type,
 * children type, render call, list buffer) MUST call this. DRY constraint.
 *
 * Tiebreak when multiple supertypes cover the kinds: the narrower supertype
 * (smallest `subtypes.size`) wins. If tied, iteration order is deterministic
 * (Map preserves insertion order, which mirrors grammar order).
 *
 * @param kinds - the kind set for this slot (projection.kinds for fields;
 *   deriveChildrenKinds result for children)
 * @param supertypeMap - result of `buildSupertypeTransportSet(nodeMap)`
 */
export function classifySlot(
  kinds: readonly string[],
  supertypeMap: ReadonlyMap<string, ReadonlySet<string>>
): SlotClass {
  if (kinds.length === 1) {
    return { tag: 'concrete', kind: kinds[0]! };
  }
  if (kinds.length === 0) {
    return { tag: 'heterogeneous' };
  }
  const kindSet = new Set(kinds);
  let bestMatch: { supertypeName: string; size: number } | undefined;
  for (const [supertypeName, subtypes] of supertypeMap) {
    if ([...kindSet].every((k) => subtypes.has(k))) {
      if (bestMatch === undefined || subtypes.size < bestMatch.size) {
        bestMatch = { supertypeName, size: subtypes.size };
      }
    }
  }
  if (bestMatch !== undefined) {
    return { tag: 'supertype', supertypeName: bestMatch.supertypeName };
  }
  return { tag: 'heterogeneous' };
}

/**
 * Build the registry of supertype typeName → resolved concrete subtype set.
 * Reads directly from `nodeMap.nodes`; no secondary walker.
 *
 * @param nodeMap - the assembled node map for the grammar
 * @returns Map from supertype `typeName` (e.g. `'Expression'`) to the set
 *   of resolved concrete subtype kind names.
 */
export function buildSupertypeTransportSet(
  nodeMap: NodeMap
): Map<string, ReadonlySet<string>> {
  const result = new Map<string, ReadonlySet<string>>();
  for (const [, node] of nodeMap.nodes) {
    if (node.modelType !== 'supertype') continue;
    result.set(node.typeName, new Set(node.subtypes));
  }
  return result;
}

/**
 * Extract the kind set from an `AssembledChild.values` array.
 * Parallel to `AssembledField.projection.kinds` for field slots.
 * Terminal values (inline string literals) are skipped — they do not
 * contribute to the transport type.
 *
 * Unresolved refs (pre-`resolveSlotRefs` dangling references) are also
 * skipped; they will not appear in post-link node maps.
 *
 * @param child - any AssembledChild (field or children slot)
 * @returns deduplicated list of resolved kind names
 */
export function deriveChildrenKinds(child: AssembledChild): string[] {
  const kinds = new Set<string>();
  for (const v of child.values) {
    if (!isNodeRef(v)) continue;
    if (isUnresolvedRef(v.node)) continue;
    kinds.add((v.node as AssembledNode).kind);
  }
  return [...kinds];
}
```

`isUnresolvedRef` must be imported from `'../compiler/node-map.ts'` (add to the existing import); `AssembledChild`, `AssembledNode`, `isNodeRef` are already imported.

### Step 4 — Run the test.

```bash
pnpm test --filter @sittir/codegen render-module-emit
```

Expected: PASS on the new tests. All existing emitter tests remain green.

### Step 5 — Type-check.

```bash
pnpm -r run type-check 2>&1 | rg -c "error TS"
```

Expected: 0.

### Step 6 — Commit.

```bash
git add packages/codegen/src/emitters/render-module.ts \
        packages/codegen/src/__tests__/render-module-emit.test.ts
git commit -m "codegen: add classifySlot + buildSupertypeTransportSet + deriveChildrenKinds helpers"
```

---

## Task 2 — Phase 1: single-concrete-kind slots (fields and children) emit typed fields and direct render calls

**Why:** When the kind set has exactly one member, the slot type is fully known at codegen time. No new enum types, no new `FromNapiValue` impls — the existing `#[napi(object)]` on each per-kind struct already handles decoding. This covers both field slots (`projection.kinds.length === 1`) and children slots where `deriveChildrenKinds(child).length === 1`.

**Files:**

- Modify: `packages/codegen/src/emitters/render-module.ts`
- Modify: `packages/codegen/src/__tests__/render-module-emit.test.ts`
- Regenerated: `rust/crates/sittir-{rust,typescript,python}/src/render/templates.rs`

### Step 1 — Write the failing test.

Add to `packages/codegen/src/__tests__/render-module-emit.test.ts`:

```ts
describe('Phase 1 — single-concrete-kind slots', () => {
  it('rust: function_item.name field is IdentifierTransport, not Box<AnyTransport>', async () => {
    const { templatesRs } = await emitRustGrammar('rust');
    const structBody = extractStructBody(templatesRs, 'FunctionItemTransport');
    expect(structBody).toMatch(/pub name: IdentifierTransport,/);
    expect(structBody).not.toContain('Box<AnyTransport>');
  });

  it('rust: render_function_item_transport calls render_identifier_transport, not render_transport_dispatch', async () => {
    const { templatesRs } = await emitRustGrammar('rust');
    const fnBody = extractFnBody(templatesRs, 'render_function_item_transport');
    expect(fnBody).not.toContain('render_transport_dispatch');
    expect(fnBody).toContain('render_identifier_transport');
  });
});

// Test helpers — add once, reuse across all describe blocks.
function extractStructBody(src: string, structName: string): string {
  const start = src.indexOf(`pub struct ${structName}`);
  if (start === -1) return '';
  const open = src.indexOf('{', start);
  let depth = 0, i = open;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(open, i + 1);
}

function extractFnBody(src: string, fnName: string): string {
  const start = src.indexOf(`fn ${fnName}(`);
  if (start === -1) return '';
  const open = src.indexOf('{', start);
  let depth = 0, i = open;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(open, i + 1);
}
```

### Step 2 — Run and verify failure.

```bash
pnpm test --filter @sittir/codegen render-module-emit
```

Expected: FAIL — `FunctionItemTransport.name` is currently `Box<AnyTransport>`.

### Step 3 — Add `buildSlotRenderCall` and update `rustTransportFieldType` / `rustTransportChildrenType`.

In `packages/codegen/src/emitters/render-module.ts`:

```ts
/**
 * Build a Rust expression that renders a single transport value to `String`.
 * Single source for all render call sites — field scalar, field list item,
 * children item.
 *
 * @param cls  - slot classification from `classifySlot`
 * @param expr - Rust expression yielding the typed reference to render.
 *               For concrete: `&node.field` or `item` (no deref needed).
 *               For supertype: `&node.field` or `item`.
 *               For heterogeneous: `t.as_ref()` (Box deref).
 */
function buildSlotRenderCall(cls: SlotClass, expr: string): string {
  switch (cls.tag) {
    case 'concrete':
      return `render_${rustSnakeIdent(cls.kind)}_transport(${expr})`;
    case 'supertype':
      return `render_${rustSnakeIdent(cls.supertypeName)}_transport(${expr})`;
    case 'heterogeneous':
      return `render_transport_dispatch(${expr})`;
    default:
      return assertNever(cls);
  }
}

/** Rust type name for a concrete transport struct. */
function rustConcreteTransportTypeName(kind: string): string {
  return `${rustTypeIdent(kind)}Transport`;
}

/** Rust enum name for a per-supertype transport enum. */
function rustSupertypeTransportEnumName(supertypeName: string): string {
  return `${rustTypeIdent(supertypeName)}Transport`;
}
```

Replace `rustTransportFieldType` (lines ~2576–2583):

```ts
// supertypeMap parameter threaded from emitRustTransportStruct caller.
function rustTransportFieldType(
  field: AssembledField,
  supertypeMap: ReadonlyMap<string, ReadonlySet<string>>
): string {
  const cls = classifySlot(field.projection.kinds, supertypeMap);
  switch (cls.tag) {
    case 'concrete': {
      const base = rustConcreteTransportTypeName(cls.kind);
      const inner = isMultiple(field) ? `Vec<${base}>` : base;
      return isRequired(field) ? inner : `Option<${inner}>`;
    }
    case 'supertype': {
      const base = rustSupertypeTransportEnumName(cls.supertypeName);
      const inner = isMultiple(field) ? `Vec<${base}>` : base;
      return isRequired(field) ? inner : `Option<${inner}>`;
    }
    case 'heterogeneous': {
      const inner = isMultiple(field) ? 'Vec<Box<AnyTransport>>' : 'Box<AnyTransport>';
      return isRequired(field) ? inner : `Option<${inner}>`;
    }
    default:
      return assertNever(cls);
  }
}
```

Replace `rustTransportChildrenType` (lines ~2585–2590):

```ts
function rustTransportChildrenType(
  children: readonly AssembledChild[],
  supertypeMap: ReadonlyMap<string, ReadonlySet<string>>
): string {
  // Merge kind sets across all children entries (a node can have multiple
  // child slots whose kinds are unioned for transport-type classification).
  const allKinds = [...new Set(
    children.flatMap((c) => deriveChildrenKinds(c))
  )];
  const cls = classifySlot(allKinds, supertypeMap);
  const required = hasRequiredChild(children);
  switch (cls.tag) {
    case 'concrete': {
      const inner = `Vec<${rustConcreteTransportTypeName(cls.kind)}>`;
      return required ? inner : `Option<${inner}>`;
    }
    case 'supertype': {
      const inner = `Vec<${rustSupertypeTransportEnumName(cls.supertypeName)}>`;
      return required ? inner : `Option<${inner}>`;
    }
    case 'heterogeneous': {
      // Theoretically unreachable — sittir never produces unbounded children
      // slots. Keep as a compile-safety escape; emit AnyTransport and log.
      const inner = 'Vec<Box<AnyTransport>>';
      return required ? inner : `Option<${inner}>`;
    }
    default:
      return assertNever(cls);
  }
}
```

Thread `supertypeMap` through the callers of both functions.

### Step 4 — Update `emitListSlotBuffer` to be classify-aware.

```ts
/**
 * Emit the boilerplate that converts a list-shaped transport slot into a
 * `*_buf: Vec<Renderable>` ready for `ListNonterminalView`.
 *
 * For concrete and supertype slots the element is already a typed struct/enum
 * reference — no `as_ref()` Box deref needed. For heterogeneous (fallback)
 * slots the existing Box deref applies.
 */
function emitListSlotBuffer(
  ident: string,
  required: boolean,
  cls: SlotClass
): string[] {
  const lines: string[] = [];
  // Build the Rust expression for a single element.
  const itemExpr = cls.tag === 'heterogeneous' ? 't.as_ref()' : 't';
  const renderItem = buildSlotRenderCall(cls, itemExpr);

  if (required) {
    lines.push(`    let ${ident}_strings: Vec<String> = node.${ident}.iter()`);
    lines.push(`        .map(|t| ${renderItem})`);
    lines.push(`        .collect::<Result<Vec<_>, _>>()?;`);
  } else {
    if (cls.tag === 'heterogeneous') {
      lines.push(`    let ${ident}_owned: &[Box<AnyTransport>] = node.${ident}.as_deref().unwrap_or(&[]);`);
      lines.push(`    let ${ident}_strings: Vec<String> = ${ident}_owned.iter()`);
    } else {
      lines.push(`    let ${ident}_owned = node.${ident}.as_deref().unwrap_or(&[]);`);
      lines.push(`    let ${ident}_strings: Vec<String> = ${ident}_owned.iter()`);
    }
    lines.push(`        .map(|t| ${renderItem})`);
    lines.push(`        .collect::<Result<Vec<_>, _>>()?;`);
  }
  lines.push(`    let ${ident}_buf: Vec<::sittir_core::filters::Renderable<'_>> = ${ident}_strings.iter()`);
  lines.push(`        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))`);
  lines.push(`        .collect();`);
  return lines;
}
```

Pass `cls` at every `emitListSlotBuffer` call site inside `buildTypedTemplateBody`. Derive `cls` from `classifySlot(field.projection.kinds, supertypeMap)` for field slots and `classifySlot(deriveChildrenKinds(child), supertypeMap)` for children slots.

### Step 5 — Update scalar and single-field render sites in `buildTypedTemplateBody`.

Replace every inline `render_transport_dispatch(node.${rIdent}.as_ref())` with `buildSlotRenderCall(cls, exprForSlot)`, where:

- For required scalar concrete slot: `buildSlotRenderCall(cls, `&node.${rIdent}`)` — no `Box::as_ref()`.
- For optional scalar concrete slot: `buildSlotRenderCall(cls, `v`)` inside the `if let Some(v) = &node.${rIdent}` branch.
- For heterogeneous slots: `buildSlotRenderCall(cls, `v.as_ref()`)` — unchanged from current.

```ts
// Sketch for buildTypedTemplateBody scalar field section (replacing lines ~1447–1459):
for (const f of struct.fields) {
  if (f.view !== 'scalar') continue;
  if (!f.hasTransportField) continue;
  const rIdent = rustFieldIdent(f.name);
  const cls = classifySlot(f.projection.kinds, supertypeMap);
  const needsDeref = cls.tag === 'heterogeneous';
  if (f.required) {
    const expr = needsDeref ? `node.${rIdent}.as_ref()` : `&node.${rIdent}`;
    lines.push(`    let ${rIdent}_text = ${buildSlotRenderCall(cls, expr)}?;`);
  } else {
    lines.push(`    let ${rIdent}_text = if let Some(v) = &node.${rIdent} {`);
    const expr = needsDeref ? `v.as_ref()` : `v`;
    lines.push(`        ${buildSlotRenderCall(cls, expr)}?`);
    lines.push(`    } else {`);
    lines.push(`        String::new()`);
    lines.push(`    };`);
  }
}
```

Apply the same pattern for `view === 'field'` single-valued slots (replacing lines ~1467–1478).

### Step 6 — Regenerate all three grammars.

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

Expected: all succeed without errors.

### Step 7 — Build the Rust crates.

```bash
cargo build -p sittir-rust -p sittir-typescript -p sittir-python 2>&1 | tail -5
```

Expected: clean. If a concrete type is missing a `FromNapiValue` impl, the culprit is a kind whose `#[napi(object)]` is absent — fix by ensuring the struct has the napi attribute, not by reverting to `Box<AnyTransport>`.

### Step 8 — Run the emitter tests.

```bash
pnpm test --filter @sittir/codegen render-module-emit
```

Expected: PASS including Phase 1 tests.

### Step 9 — Measure dispatch reduction.

```bash
rg "render_transport_dispatch" \
  rust/crates/sittir-rust/src/render/templates.rs \
  | rg -v "^.*fn render_transport_dispatch\|^.*fn render_transport\b" \
  | wc -l
```

Record the count before and after. Phase 1 alone should reduce this substantially (all single-kind field and children call sites are gone).

### Step 10 — Parity corpus.

```bash
pnpm test specs/016-parity-regressions
```

Expected: no new RT failures. Wire shape is unchanged.

### Step 11 — Type-check.

```bash
pnpm -r run type-check 2>&1 | rg -c "error TS"
```

Expected: 0.

### Step 12 — Commit.

```bash
git add packages/codegen/src/emitters/render-module.ts \
        packages/codegen/src/__tests__/render-module-emit.test.ts \
        rust/crates/sittir-rust/src/render/templates.rs \
        rust/crates/sittir-typescript/src/render/templates.rs \
        rust/crates/sittir-python/src/render/templates.rs
git commit -m "codegen: Phase 1 — single-kind field+children slots use typed transport, direct render calls"
```

---

## Task 3 — Phase 2: emit per-supertype transport enums (field and children slots)

**Why:** Slots whose kind set covers a grammar-defined supertype currently dispatch through the 1040-arm `render_transport_dispatch`. A per-supertype enum `ExpressionTransport { … }` with a custom `FromNapiValue` reduces the dispatch arm count to the supertype's subtype count (typically 5–50). The pattern mirrors the existing `AnyTransport` custom `FromNapiValue` impl and the polymorph enum impls already in production. This covers both field slots (`binary_expression.left: ExpressionTransport`) and children slots (`block.children: Vec<StatementTransport>`).

**Files:**

- Modify: `packages/codegen/src/emitters/render-module.ts`
- Modify: `packages/codegen/src/__tests__/render-module-emit.test.ts`
- Regenerated: `rust/crates/sittir-{rust,typescript,python}/src/render/templates.rs`

### Step 1 — Write the failing tests.

Add to `packages/codegen/src/__tests__/render-module-emit.test.ts`:

```ts
describe('Phase 2 — per-supertype transport enums', () => {
  it('rust: ExpressionTransport enum is emitted', async () => {
    const { templatesRs } = await emitRustGrammar('rust');
    expect(templatesRs).toMatch(/pub enum ExpressionTransport\s*\{/);
  });

  it('rust: ExpressionTransport has a custom FromNapiValue impl that reads $type as u16', async () => {
    const { templatesRs } = await emitRustGrammar('rust');
    const implBody = extractImplBody(templatesRs, 'FromNapiValue for ExpressionTransport');
    expect(implBody).toContain('"$type"');
    expect(implBody).not.toContain('render_transport_dispatch');
  });

  it('rust: binary_expression.left field uses ExpressionTransport, not Box<AnyTransport>', async () => {
    const { templatesRs } = await emitRustGrammar('rust');
    const structBody = extractStructBody(templatesRs, 'BinaryExpressionTransport');
    expect(structBody).toContain('ExpressionTransport');
    expect(structBody).not.toContain('Box<AnyTransport>');
  });

  it('rust: block children slot uses a typed supertype, not Vec<Box<AnyTransport>>', async () => {
    const { templatesRs } = await emitRustGrammar('rust');
    const structBody = extractStructBody(templatesRs, 'BlockTransport');
    // Children must be typed (concrete or supertype), not erased.
    expect(structBody).not.toContain('Box<AnyTransport>');
  });
});

function extractImplBody(src: string, implFor: string): string {
  const marker = `impl ::napi::bindgen_prelude::FromNapiValue for ${implFor}`;
  const start = src.indexOf(marker);
  if (start === -1) return '';
  const open = src.indexOf('{', start);
  let depth = 0, i = open;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(open, i + 1);
}
```

### Step 2 — Run and verify failure.

```bash
pnpm test --filter @sittir/codegen render-module-emit
```

Expected: FAIL — `ExpressionTransport` not emitted.

### Step 3 — Add `emitSupertypeTransportEnum` helper.

In `packages/codegen/src/emitters/render-module.ts`, after `renderPolymorphTransportFromNapiValue`:

```ts
/**
 * Emit a per-supertype transport enum, its `Debug + Clone` body,
 * and a custom `FromNapiValue` impl that reads `$type` as `u16` and
 * dispatches to the appropriate concrete variant.
 *
 * Pattern: identical to `renderPolymorphTransportFromNapiValue` for polymorph
 * enums and to `renderAnyTransportWithNapiFromValue` for `AnyTransport`.
 * DRY: variant arms come from `supertypeNode.subtypes` resolved through
 * `kindIdByKind` — the same source both other impls use.
 *
 * `Box<T>` is used for non-leaf subtypes to break size-cycle recursion
 * (e.g. `ExpressionTransport::BinaryExpression(Box<BinaryExpressionTransport>)`
 * since `BinaryExpressionTransport` has `ExpressionTransport` fields).
 * Leaf/keyword/token/enum subtypes are small (text only) and are inlined.
 *
 * @param supertypeNode - the assembled supertype node
 * @param kindIdByKind  - Map<kind, u16 id> from `buildKindIdByKind(kindEntries)`
 * @param nodeMap       - for typeName + modelType lookups
 */
function emitSupertypeTransportEnum(
  supertypeNode: AssembledSupertype,
  kindIdByKind: ReadonlyMap<string, number>,
  nodeMap: NodeMap
): string[] {
  const enumName = rustSupertypeTransportEnumName(supertypeNode.typeName);
  const lines: string[] = [];

  // Enum declaration — Debug + Clone only; no serde, no napi object derive.
  lines.push(`#[derive(Debug, Clone)]`);
  lines.push(`pub enum ${enumName} {`);
  for (const subKind of supertypeNode.subtypes) {
    const subNode = nodeMap.nodes.get(subKind);
    if (subNode === undefined) continue; // phantom kind — skip
    const variant = rustTypeIdent(subNode.typeName);
    const structName = rustConcreteTransportTypeName(subNode.typeName);
    const isLeaf =
      subNode.modelType === 'leaf' ||
      subNode.modelType === 'keyword' ||
      subNode.modelType === 'token' ||
      subNode.modelType === 'enum';
    const variantType = isLeaf ? structName : `Box<${structName}>`;
    lines.push(`    ${variant}(${variantType}),`);
  }
  lines.push(`}`);
  lines.push(``);

  // Custom FromNapiValue — reads $type as u16 and dispatches per known ID.
  lines.push(`#[cfg(feature = "napi-bindings")]`);
  lines.push(`impl ::napi::bindgen_prelude::FromNapiValue for ${enumName} {`);
  lines.push(`    unsafe fn from_napi_value(`);
  lines.push(`        env: ::napi::sys::napi_env,`);
  lines.push(`        napi_val: ::napi::sys::napi_value,`);
  lines.push(`    ) -> ::napi::Result<Self> {`);
  lines.push(`        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;`);
  lines.push(`        let kind_id: u16 = obj.get("$type")?`);
  lines.push(`            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in ${enumName}"))?;`);
  lines.push(`        match kind_id {`);
  for (const subKind of supertypeNode.subtypes) {
    const subNode = nodeMap.nodes.get(subKind);
    if (subNode === undefined) continue;
    const id = kindIdByKind.get(subKind);
    if (id === undefined) continue; // no catalog entry — skip
    const variant = rustTypeIdent(subNode.typeName);
    const structName = rustConcreteTransportTypeName(subNode.typeName);
    const isLeaf =
      subNode.modelType === 'leaf' ||
      subNode.modelType === 'keyword' ||
      subNode.modelType === 'token' ||
      subNode.modelType === 'enum';
    if (isLeaf) {
      lines.push(`            ${id} => Ok(Self::${variant}(`);
      lines.push(`                ${structName}::from_napi_value(env, napi_val)?`);
      lines.push(`            )),`);
    } else {
      lines.push(`            ${id} => Ok(Self::${variant}(Box::new(`);
      lines.push(`                ${structName}::from_napi_value(env, napi_val)?`);
      lines.push(`            ))),`);
    }
  }
  lines.push(`            other => Err(::napi::Error::from_reason(format!(`);
  lines.push(`                "unknown kind id {{other}} in ${enumName}",`);
  lines.push(`            ))),`);
  lines.push(`        }`);
  lines.push(`    }`);
  lines.push(`}`);
  lines.push(``);

  // Stub ToNapiValue — supertype transport is receive-only (JS → Rust).
  lines.push(`#[cfg(feature = "napi-bindings")]`);
  lines.push(`impl ::napi::bindgen_prelude::ToNapiValue for ${enumName} {`);
  lines.push(`    unsafe fn to_napi_value(`);
  lines.push(`        _env: ::napi::sys::napi_env,`);
  lines.push(`        _val: Self,`);
  lines.push(`    ) -> ::napi::Result<::napi::sys::napi_value> {`);
  lines.push(`        Err(::napi::Error::from_reason(${JSON.stringify(`${enumName} is receive-only`)}))`);
  lines.push(`    }`);
  lines.push(`}`);
  lines.push(``);

  return lines;
}
```

Wire the call in `emitTemplatesRs`: after all per-kind transport structs are emitted, before `renderTypedDispatch`, iterate supertypes and call `emitSupertypeTransportEnum`. This requires `kindEntries` and `buildKindIdByKind(kindEntries)` — gate on `kindEntries !== undefined` (same guard as `AnyTransport`'s typed impl):

```ts
// In emitTemplatesRs, gated on kindEntries being available:
if (kindEntries !== undefined) {
  const kidByKind = buildKindIdByKind(kindEntries);
  for (const [, node] of nodeMap.nodes) {
    if (node.modelType !== 'supertype') continue;
    lines.push(...emitSupertypeTransportEnum(node as AssembledSupertype, kidByKind, nodeMap));
  }
}
```

Add `AssembledSupertype` to the import from `'../compiler/node-map.ts'`.

### Step 4 — Regenerate all three grammars.

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

Expected: all succeed.

### Step 5 — Build the Rust crates.

```bash
cargo build -p sittir-rust -p sittir-typescript -p sittir-python 2>&1 | tail -5
```

Expected: clean. Phantom-kind gaps (subkind in `subtypes` but not in `nodeMap.nodes`) are guarded by `continue` — they produce no compile error.

### Step 6 — Run the emitter tests.

```bash
pnpm test --filter @sittir/codegen render-module-emit
```

Expected: PASS including Phase 2 enum tests.

### Step 7 — Type-check.

```bash
pnpm -r run type-check 2>&1 | rg -c "error TS"
```

Expected: 0.

### Step 8 — Commit.

```bash
git add packages/codegen/src/emitters/render-module.ts \
        packages/codegen/src/__tests__/render-module-emit.test.ts \
        rust/crates/sittir-rust/src/render/templates.rs \
        rust/crates/sittir-typescript/src/render/templates.rs \
        rust/crates/sittir-python/src/render/templates.rs
git commit -m "codegen: Phase 2 — per-supertype transport enums for field+children slots"
```

---

## Task 4 — Phase 2: emit per-supertype render helpers; eliminate all internal `render_transport_dispatch` callers

**Why:** After Task 3 the supertype enum types exist and slots are typed accordingly. The render call sites in `buildTypedTemplateBody` and `emitListSlotBuffer` (`buildSlotRenderCall` already classify-aware from Task 2) reference `render_<supertype>_transport` functions that do not yet exist. This task emits them. After this task, `render_transport_dispatch` has zero callers inside any per-template render function — its only caller is the napi entry point `render_transport`. The grammar-local `Renderable::Node(&AnyTransport)` variant (if still present) is also removed in this task.

**Files:**

- Modify: `packages/codegen/src/emitters/render-module.ts`
- Modify: `packages/codegen/src/__tests__/render-module-emit.test.ts`
- Regenerated: `rust/crates/sittir-{rust,typescript,python}/src/render/templates.rs`

### Step 1 — Write the failing tests.

Add to `packages/codegen/src/__tests__/render-module-emit.test.ts`:

```ts
describe('Phase 2 — per-supertype render helpers', () => {
  it('rust: render_expression_transport is emitted', async () => {
    const { templatesRs } = await emitRustGrammar('rust');
    expect(templatesRs).toContain('fn render_expression_transport(');
  });

  it('rust: render_expression_transport is a bounded match, not a 1040-arm dispatch', async () => {
    const { templatesRs } = await emitRustGrammar('rust');
    const fnBody = extractFnBody(templatesRs, 'render_expression_transport');
    expect(fnBody).toContain('match t {');
    expect(fnBody).not.toContain('render_transport_dispatch');
  });

  it('rust: binary_expression render fn calls render_expression_transport', async () => {
    const { templatesRs } = await emitRustGrammar('rust');
    const fnBody = extractFnBody(templatesRs, 'render_binary_expression_transport');
    expect(fnBody).toContain('render_expression_transport');
    expect(fnBody).not.toContain('render_transport_dispatch');
  });

  it('rust: no per-template render fn contains Renderable::Node', async () => {
    const { templatesRs } = await emitRustGrammar('rust');
    // Renderable::Node(&AnyTransport) is removed — templates use Text only.
    expect(templatesRs).not.toContain('Renderable::Node');
  });
});
```

### Step 2 — Run and verify failure.

```bash
pnpm test --filter @sittir/codegen render-module-emit
```

Expected: FAIL — `render_expression_transport` not emitted.

### Step 3 — Add `emitSupertypeRenderHelper`.

In `packages/codegen/src/emitters/render-module.ts`, after `emitSupertypeTransportEnum`:

```ts
/**
 * Emit `render_<supertype>_transport(t: &<Supertype>Transport) -> Result<String, askama::Error>`
 * as a bounded match over the enum variants.
 *
 * Each arm delegates to the concrete kind's render fn — same pattern as
 * `renderTypedPolymorphFn`. Arm count is bounded by the supertype's subtype
 * count, not the full grammar (1040 for rust).
 *
 * @param supertypeNode - the assembled supertype node
 * @param nodeMap       - for typeName + modelType lookups
 */
function emitSupertypeRenderHelper(
  supertypeNode: AssembledSupertype,
  nodeMap: NodeMap
): string[] {
  const enumName = rustSupertypeTransportEnumName(supertypeNode.typeName);
  const fnName = `render_${rustSnakeIdent(supertypeNode.typeName)}_transport`;
  const lines: string[] = [];

  lines.push(`fn ${fnName}(t: &${enumName}) -> Result<String, ::askama::Error> {`);
  lines.push(`    match t {`);
  for (const subKind of supertypeNode.subtypes) {
    const subNode = nodeMap.nodes.get(subKind);
    if (subNode === undefined) continue;
    const variant = rustTypeIdent(subNode.typeName);
    const concreteFn = rustTypedRenderFnName(subNode.typeName);
    const isLeaf =
      subNode.modelType === 'leaf' ||
      subNode.modelType === 'keyword' ||
      subNode.modelType === 'token' ||
      subNode.modelType === 'enum';
    // Non-leaf variants are boxed in the enum; deref with .as_ref().
    const innerExpr = isLeaf ? `inner` : `inner.as_ref()`;
    lines.push(`        ${enumName}::${variant}(inner) => ${concreteFn}(${innerExpr}),`);
  }
  lines.push(`    }`);
  lines.push(`}`);
  lines.push(``);

  return lines;
}
```

Wire into `renderTypedDispatch`: after the per-kind fns loop, before the `render_transport_dispatch` emission, emit supertype helpers:

```ts
// In renderTypedDispatch, after the per-kind fns loop:
for (const [, node] of nodeMap.nodes) {
  if (node.modelType !== 'supertype') continue;
  lines.push(...emitSupertypeRenderHelper(node as AssembledSupertype, nodeMap));
}
```

Because `buildSlotRenderCall` (Task 2) already emits `render_<supertype>_transport(…)` for `'supertype'` slots, all call sites in `buildTypedTemplateBody` and `emitListSlotBuffer` are already wired — they reference functions that now exist.

Remove `Renderable::Node` variant from the grammar-local `Renderable<'a>` enum emission (if present). After this task, per-template render functions never wrap a transport in a Renderable — they call typed helpers directly, get a `String`, and wrap it in `Renderable::Text`. The Askama-surface `Renderable<'a>` (`Text | Joined`) is unaffected.

### Step 4 — Regenerate all three grammars.

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

Expected: all succeed.

### Step 5 — Build the Rust crates.

```bash
cargo build -p sittir-rust -p sittir-typescript -p sittir-python 2>&1 | tail -5
```

Expected: clean. If a supertype helper references a concrete fn not yet defined (ordering issue), move supertype helper emission to after all concrete per-kind fns — `renderTypedDispatch` ordering already ensures this.

### Step 6 — Run the emitter tests.

```bash
pnpm test --filter @sittir/codegen render-module-emit
```

Expected: PASS including Phase 2 render-helper tests and the `Renderable::Node` absence test.

### Step 7 — Type-check.

```bash
pnpm -r run type-check 2>&1 | rg -c "error TS"
```

Expected: 0.

### Step 8 — Commit.

```bash
git add packages/codegen/src/emitters/render-module.ts \
        packages/codegen/src/__tests__/render-module-emit.test.ts \
        rust/crates/sittir-rust/src/render/templates.rs \
        rust/crates/sittir-typescript/src/render/templates.rs \
        rust/crates/sittir-python/src/render/templates.rs
git commit -m "codegen: Phase 2 — per-supertype render helpers; render_transport_dispatch has zero internal callers"
```

---

## Task 5 — Corpus parity verification: render output must be byte-identical

**Why:** The wire shape is unchanged (`$type` is still numeric `u16`). Typed struct decoding and direct render calls must produce the same rendered text as the previous `render_transport_dispatch` path.

**Files:**

- Modify: `rust/crates/sittir-core/tests/wire_shape.rs`
- No changes to generated files.

### Step 1 — Run the parity corpus.

```bash
pnpm test specs/016-parity-regressions
```

Expected: empty diff against the JS engine. **Do not refresh the baseline if the diff is non-empty — investigate and fix the emitter.** The only acceptable cause of a diff is a bug in `buildSlotRenderCall` or `emitListSlotBuffer`.

### Step 2 — Run the full Rust test suite.

```bash
cargo test -p sittir-core 2>&1 | rg "test result"
cargo test -p sittir-rust 2>&1 | rg "test result"
```

Expected: all pass.

### Step 3 — Add a hard structural regression test.

Add to `rust/crates/sittir-core/tests/wire_shape.rs`:

```rust
/// `render_transport_dispatch` must have ZERO callers inside any per-template
/// render function. The only permitted callers are:
///   - the function definition itself (`fn render_transport_dispatch`)
///   - the napi entry-point `render_transport` wrapper (one arm)
///
/// There are no "genuinely heterogeneous" escape hatches — sittir's codegen
/// pipeline never produces unbounded slot kinds. If this test fails, the
/// failing lines identify slots that `classifySlot` failed to classify as
/// concrete or supertype.
#[test]
fn render_transport_dispatch_has_no_internal_callers_rust() {
    assert_no_internal_dispatch(include_str!(
        "../../sittir-rust/src/render/templates.rs"
    ));
}

#[test]
fn render_transport_dispatch_has_no_internal_callers_typescript() {
    assert_no_internal_dispatch(include_str!(
        "../../sittir-typescript/src/render/templates.rs"
    ));
}

#[test]
fn render_transport_dispatch_has_no_internal_callers_python() {
    assert_no_internal_dispatch(include_str!(
        "../../sittir-python/src/render/templates.rs"
    ));
}

fn assert_no_internal_dispatch(templates: &str) {
    let fn_starts: Vec<usize> = templates
        .match_indices("fn ")
        .map(|(i, _)| i)
        .collect();

    let mut violations: Vec<String> = Vec::new();

    for (idx, &start) in fn_starts.iter().enumerate() {
        let fn_slice = if idx + 1 < fn_starts.len() {
            &templates[start..fn_starts[idx + 1]]
        } else {
            &templates[start..]
        };

        // Skip: (a) the dispatch fn definition, (b) render_transport (napi entry).
        if fn_slice.starts_with("fn render_transport_dispatch")
            || fn_slice.starts_with("fn render_transport(")
            || fn_slice.starts_with("fn render_transport_parts")
        {
            continue;
        }

        // Any other fn that calls render_transport_dispatch is a violation.
        for line in fn_slice.lines() {
            if line.contains("render_transport_dispatch") {
                let fn_name = fn_slice
                    .splitn(2, '(')
                    .next()
                    .unwrap_or("?")
                    .trim_start_matches("fn ");
                violations.push(format!("{fn_name}: {}", line.trim()));
            }
        }
    }

    assert!(
        violations.is_empty(),
        "render_transport_dispatch must have zero internal callers.\n\
         These per-template fns still call it (fix classifySlot):\n{}",
        violations.join("\n")
    );
}
```

### Step 4 — Run the new test.

```bash
cargo test -p sittir-core --test wire_shape
```

Expected: PASS. If it fails, each violation line identifies which per-kind render fn still uses the erased path — fix by adding the missing supertype to `buildSupertypeTransportSet` or by extending `classifySlot` to handle the edge case.

### Step 5 — Commit.

```bash
git add rust/crates/sittir-core/tests/wire_shape.rs
git commit -m "rust: hard regression — render_transport_dispatch must have zero internal callers"
```

---

## Task 6 — Final confirmation: `AnyTransport` is napi-boundary-only

**Why:** A final sweep confirms the architectural invariant end-to-end. `AnyTransport` references should appear in exactly three categories: (a) the `AnyTransport` enum declaration, (b) the `render_transport_dispatch` fn signature and body, (c) the `render_transport` napi entry-point fn. No per-kind struct field, no children slot, no `render_<kind>_transport` body.

**Files:**

- Read-only verification — no file changes unless a violation is found.

### Step 1 — Count `AnyTransport` field references (must be zero).

```bash
rg "Box<AnyTransport>|Vec<Box<AnyTransport>>" \
  rust/crates/sittir-rust/src/render/templates.rs \
  | rg -v "fn render_transport_dispatch\|fn render_transport\b\|AnyTransport {" \
  | wc -l
```

Expected: 0. Repeat for typescript and python.

```bash
rg "Box<AnyTransport>|Vec<Box<AnyTransport>>" \
  rust/crates/sittir-typescript/src/render/templates.rs \
  | rg -v "fn render_transport_dispatch\|fn render_transport\b\|AnyTransport {" \
  | wc -l

rg "Box<AnyTransport>|Vec<Box<AnyTransport>>" \
  rust/crates/sittir-python/src/render/templates.rs \
  | rg -v "fn render_transport_dispatch\|fn render_transport\b\|AnyTransport {" \
  | wc -l
```

### Step 2 — Count internal `render_transport_dispatch` callers (must be zero, already asserted by Task 5).

```bash
rg "render_transport_dispatch" \
  rust/crates/sittir-rust/src/render/templates.rs \
  | rg -v "^.*fn render_transport_dispatch\|^.*fn render_transport\b" \
  | wc -l
```

Expected: 0 for all three grammars.

### Step 3 — Full workspace build and test.

```bash
cargo test --workspace 2>&1 | rg "test result"
pnpm -r run type-check 2>&1 | rg -c "error TS"
pnpm test
```

Expected: all pass; 0 type errors.

### Step 4 — Confirm ADR-0016 checklist.

| ADR-0016 clause | Verified by |
|---|---|
| §1 typed transport: Rust struct fields mirror TS-side `*Transport` interfaces | Task 2 (single-kind) + Task 3 (supertype enum) cover all field and children slots |
| §3 `from_transport` typed access: slots accessed by typed field | Task 2 + Task 4 render helpers; no opaque `AnyTransport` at per-slot level |
| Invariant 1 typed projection before JS↔Rust | `FromNapiValue` for supertype enums reads `$type` u16 and decodes into typed variants; no erasure at the boundary |
| Invariant 3 slot truth (ADR-0015) | `classifySlot` reads `AssembledField.projection.kinds` (fields) and `deriveChildrenKinds` (children) — both walker-owned; no secondary walkers |
| Verification §2 no NodeData/HashMap layer | `buildSlotRenderCall` emits direct fn calls; `Renderable::Node` is gone; `transport_to_node` retained only as the inverse bridge for explicit NodeData callers |

---

## Constraints (verbatim from CLAUDE.md)

- **No `as any` / `@ts-ignore` / `@ts-nocheck` / `eslint-disable`** to silence type errors. All slot-type expansions thread through the typed `SlotClass` discriminated union. If the types disagree, fix the type first.
- **No hand-edits to generated files.** `rust/crates/sittir-{rust,typescript,python}/src/render/templates.rs` are regenerated. If the generated output is wrong, fix `render-module.ts`.
- **Use `rg`** for all verification searches.
- **DRY** — `classifySlot`, `deriveChildrenKinds`, `buildSupertypeTransportSet`, and `buildSlotRenderCall` are the single derivation points for slot class, kind extraction, supertype registry, and render dispatch selection respectively. No inline re-derivations anywhere.
- **`assertNever` on every discriminated-union switch.** `SlotClass` is a three-variant union; `buildSlotRenderCall`, `rustTransportFieldType`, and `rustTransportChildrenType` all end with `default: assertNever(cls)`.

---

## Self-review checklist

- [x] **ADR-0016 §1 (typed transport)** — Phase 1 + 2 cover both fields and children. `Box<AnyTransport>` is gone from all per-kind struct definitions.
- [x] **ADR-0016 §3 (`from_transport` typed access)** — Phase 1 + 2 align: every render site calls a typed helper; the `AnyTransport` opaque box does not appear inside any per-kind render function.
- [x] **ADR-0016 Invariant 1 (typed projection before JS↔Rust)** — `FromNapiValue` for supertype enums reads `$type` u16 into typed variants. Concrete slots use existing `#[napi(object)]`. Decoding is typed from the napi boundary inward.
- [x] **ADR-0016 Invariant 3 (slot truth, ADR-0015)** — `classifySlot` reads `projection.kinds` for fields and `deriveChildrenKinds` for children — both come from the walker-owned assembled representation. No duplicate derivations.
- [x] **ADR-0016 Verification §2 (no NodeData/HashMap layer)** — `render_transport_dispatch` has zero internal callers after Task 4. `transport_to_node` / `render_dispatch` are retained as the inverse bridge for callers that explicitly need `NodeData` — not called from any per-template render path.
- [x] **`Renderable::Node` removal** — the grammar-local `Renderable` variant that wrapped `&AnyTransport` is gone. Per-template render functions produce `Renderable::Text` values only.
- [x] **Wire shape unchanged** — `$type` u16 on the JS wire is unaffected; only the Rust decode path narrows.
- [x] **Phantom-kind isolation** — `emitSupertypeTransportEnum` and `emitSupertypeRenderHelper` both guard against missing `nodeMap.nodes.get(subKind)` returns. Phantom-kind resolution is a separate work item and does not block this plan.
- [x] **Children slots fully typed** — `rustTransportChildrenType` uses `classifySlot(deriveChildrenKinds(children), supertypeMap)`. Sittir's pipeline never produces unbounded children slots; `'heterogeneous'` is a compile-safety escape, not an expected case.

---

## Open questions (deliberately left for execution)

1. **Supertype enum naming edge cases.** `rustSupertypeTransportEnumName(supertypeNode.typeName)` runs the same `rustTypeIdent` transformation as other transport names. If any grammar has a supertype whose `typeName` clashes with an existing concrete transport struct name (rare but possible in python with heavily overloaded kinds), execution should detect and resolve the collision — either by suffixing `Supertype` or by choosing the narrower classification first. Check all three grammars' supertype type names before landing.

2. **`Box<T>` cycle-breaking exact scope.** The plan conservatively boxes all non-leaf subtype variants inside supertype enums. Execution should verify which subtype kinds are actually cyclic (their transport struct transitively contains the supertype enum) versus merely non-leaf. Over-boxing is harmless for correctness but costs an allocation per recursive reference. Post-landing follow-up can unbox non-cyclic branches.

3. **`kindEntries === undefined` fallback path.** When `kindEntries` is unavailable (parser.c not present), supertype enum emission is gated off. In this fallback path `rustTransportFieldType` and `rustTransportChildrenType` must still compile — the `'supertype'` arm of `rustTransportFieldType` would be reached before `emitSupertypeTransportEnum` has emitted the enum, producing a dangling type reference. Execution should confirm the gating strategy: either (a) when `kindEntries` is undefined, downgrade `'supertype'` slots back to `Box<AnyTransport>` in `rustTransportFieldType`, or (b) emit supertype enum stubs without `FromNapiValue` even in the fallback path. Document the choice.

4. **Children slot kind merging.** `rustTransportChildrenType` merges all `AssembledChild.values` kind sets into one flattened list and classifies the union. If a node has multiple disjoint children slots (unlikely but possible), the merged classification may be broader than any individual slot requires, forcing a fallback to a wider supertype or `heterogeneous`. Execution should check whether any node in the three grammars triggers this and, if so, whether per-slot children typing (one `Vec<T>` per distinct children slot name) is needed.

5. **Phase 1 vs Phase 2 PR split.** Tasks 1–2 form a self-contained unit (no new napi impls). Tasks 3–5 add custom `FromNapiValue` impls. The plan is structured so either split can be made at the Task 2/3 boundary.

---

## Out of scope

- **Phantom-kind resolution** — separate bug class (`a8bf482c9f081b79a`, `a85ce5435d1ae4f22` reports). Guards in `emitSupertypeTransportEnum` skip missing kinds silently; phantom resolution does not block this plan.
- **Wire-format changes** — `$type` stays numeric `u16`; JS-side `*Transport` interfaces are unchanged.
- **TS-side `*Transport` interface changes** — already typed per ADR-0016; this plan brings Rust to parity.
- **`children` slot restructure beyond typing** — the transport `children` field continues to exist; only its element type changes from `Box<AnyTransport>` to a concrete or supertype-typed alternative.
- **Inverse bridge** — `transport_to_node`, `node_data_from_transport`, `render_dispatch` are unchanged. They remain for callers that explicitly need `NodeData` from typed transport (the reverse direction from Rust back to JS `NodeData` shape).
