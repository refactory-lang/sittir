# Taxonomy-Driven Emitter Dispatch — Design

## Problem

Each emitter (`factories.ts`, `from.ts`, `wrap.ts`, `types.ts`) independently
re-derives the same node taxonomy through ad-hoc `switch(modelType)` +
`isContainerShape` / `isSingleFieldDirect` / `isTextTemplate` checks. The
detection predicates are duplicated across files, can disagree (PR #23 review
found three such mismatches), and make it hard to see the full dispatch tree.

## Design

### Taxonomy

`modelType` is the first-level dispatch key, 1:1 with the assembled class
hierarchy. No cross-over exceptions.

```
modelType
├── pattern            (AssembledPattern extends AssembledLeaf, was modelType: 'leaf')
├── keyword            (AssembledKeyword extends AssembledLeaf)
├── enum               (AssembledEnum extends AssembledLeaf)
├── token              (AssembledToken extends AssembledLeaf)
├── branch
│   ├── singleSlot     (exactly one slot — named OR unnamed, no other slots)
│   │   ├── singular
│   │   │   ├── optional
│   │   │   └── required
│   │   └── multiple
│   │       ├── array        (0..N)
│   │       └── nonEmptyArray (1..N)
│   └── multiSlot      (2+ slots, or fields + children)
├── polymorph          (dispatcher + variant forms)
├── group              (standalone or polymorph form)
├── supertype          (union declaration — types-only)
└── multi              (synthetic — skip)
```

**singleSlot** unifies the former `singleField` (one named field, no children)
and `container with one child` (one unnamed child). The distinction is a
property on the slot (`slot.name` vs `'children'`), not a taxonomy branch.

### Prerequisite: modelType alignment

**`AssembledPattern`**: `modelType: 'leaf'` → `'pattern'`. Every other
concrete class already has a unique modelType; Pattern was the odd one
sharing `'leaf'` as a legacy holdover from when `AssembledLeaf` was
concrete.

**textTemplate elimination via external-scanner simplification**:

Three kinds currently trigger `isTextTemplate`:

| Grammar | Kind | Rule shape |
|---------|------|-----------|
| rust | `raw_string_literal` | `seq(field(external_start), field(content), field(external_end))` |
| python | `string` | `seq(field(external_start), field(content), field(external_end))` |
| python | `_simple_pattern_negative` | `seq(optional('-'), choice(integer, float))` |

All three have the same structure as `string_literal` (which already
simplifies correctly): delimiter bookends around content. The difference
is that `string_literal`'s bookends are inline `STRING`/`IMMEDIATE_TOKEN`
(dropped by simplify), while the textTemplate kinds use external scanner
symbols (not dropped).

**Fix**: external scanner tokens should get their own rule type so the
simplifier can treat them as literals — structurally invisible, like
anonymous `STRING` tokens. After simplification:

- `raw_string_literal` → single-slot branch (`string_content` field)
- `string` → single-slot branch (`content` field)
- `_simple_pattern_negative` → single-slot branch (`choice(integer, float)`)

`isTextTemplate` is retired. No `AssembledTextTemplate` class needed.
The taxonomy handles them as regular single-slot branches.

### Architecture

**emit.ts** — single file containing the nested switch taxonomy. Navigates
the tree and calls per-emitter functions at each emitter's natural
granularity depth.

```ts
// emit.ts — the taxonomy IS the switch cascade
for (const [kind, node] of nodeMap.nodes) {
  switch (node.modelType) {
    case 'pattern':
    case 'keyword':
    case 'enum':
    case 'token':
      factory.leaf(node, ctx);
      from.leaf(node, ctx);
      types.leaf(node, ctx);
      break;

    case 'branch': {
      types.branch(node, ctx);
      wrap.branch(node, ctx);

      const slot = classifyBranchSlots(node, nodeMap);
      switch (slot.tag) {
        case 'multiSlot':
          factory.branch.multiSlot(node, ctx);
          from.branch.multiSlot(node, ctx);
          break;
        case 'singleSlot':
          switch (slot.arity) {
            case 'singular':
              factory.branch.singleSlot.singular(node, slot, ctx);
              if (slot.optional) {
                from.branch.singleSlot.singularOptional(node, slot, ctx);
              } else {
                from.branch.singleSlot.singularRequired(node, slot, ctx);
              }
              break;
            case 'multiple':
              factory.branch.singleSlot.multiple(node, slot, ctx);
              from.branch.singleSlot.multiple(node, slot, ctx);
              break;
          }
          break;
      }
      break;
    }

    case 'polymorph':
      factory.polymorph(node, ctx);
      from.polymorph(node, ctx);
      wrap.polymorph(node, ctx);
      types.polymorph(node, ctx);
      break;

    case 'group':
      factory.group(node, ctx);
      from.group(node, ctx);
      wrap.group(node, ctx);
      types.group(node, ctx);
      break;

    case 'supertype':
      types.supertype(node, ctx);
      break;

    case 'multi':
      break;
  }
}
```

### Per-emitter API surface

Each emitter exports a namespace (or object with dotted names) keyed by the
taxonomy. Emitters plug in at their natural granularity — coarse emitters
have fewer functions, fine emitters have deeper paths.

**factory.ts exports:**
```ts
export namespace factory {
  function leaf(node, ctx): string;
  namespace branch {
    function multiSlot(node, ctx): string;
    namespace singleSlot {
      function singular(node, slot, ctx): string;
      function multiple(node, slot, ctx): string;
    }
  }
  function polymorph(node, ctx): string;
  function group(node, ctx): string;
}
```

**from.ts exports:**
```ts
export namespace from {
  function leaf(node, ctx): string;
  namespace branch {
    function multiSlot(node, ctx): string;
    namespace singleSlot {
      function singularOptional(node, slot, ctx): string;
      function singularRequired(node, slot, ctx): string;
      function multiple(node, slot, ctx): string;
    }
  }
  function polymorph(node, ctx): string;
  function group(node, ctx): string;
}
```

**wrap.ts exports:**
```ts
export namespace wrap {
  function branch(node, ctx): string;
  function polymorph(node, ctx): string;
  function group(node, ctx): string;
  // no leaf — wrap doesn't handle leaves
}
```

**types.ts exports:**
```ts
export namespace types {
  function leaf(node, ctx): string;
  function branch(node, ctx): string;
  function polymorph(node, ctx): string;
  function group(node, ctx): string;
  function supertype(node, ctx): string;
}
```

### Classification helper

A single `classifyBranchSlots` function (in `shared.ts` or `emit.ts`)
returns a discriminated descriptor:

```ts
type BranchSlotClass =
  | { tag: 'multiSlot' }
  | { tag: 'singleSlot'; arity: 'singular' | 'multiple';
      optional: boolean; nonEmpty: boolean;
      slot: AssembledNonterminal };

function classifyBranchSlots(
  node: AssembledBranch | AssembledGroup,
  nodeMap: NodeMap
): BranchSlotClass;
```

Detection: filter auto-stamp fields/children → count remaining slots.
If exactly 1 and no other slots → `singleSlot` with the slot's arity
and optionality. Otherwise → `multiSlot`.

This is the ONE source of truth for the single-slot vs multi-slot
distinction, called from emit.ts. No emitter re-derives it.

### What does NOT change

- **Generated output shape** — factories, from, wrap, types produce the
  same TypeScript. This is a refactor of the emitter internals, not the
  generated API.
- **Validator dispatch** — factory-roundtrip.ts and from.ts validators
  use `factoryShapes` from factory-map.json5, which is derived from the
  same classification. factory-map.ts should call `classifyBranchSlots`
  too.
- **Node assembly** — the assembled model, nodeMap, and modelType values
  are unchanged (except `AssembledPattern.modelType` → `'pattern'`).

### Migration path

1. **modelType alignment** — `AssembledPattern.modelType` → `'pattern'`.
   External scanner tokens get their own rule type so simplify treats
   them as literals. Current textTemplate kinds collapse to single-slot
   branches; `isTextTemplate()` retired.
2. **`classifyBranchSlots`** — single shared helper, replaces
   `isSingleFieldDirect` in factories.ts, factory-map.ts, and from.ts.
3. **Per-emitter API extraction** — each emitter's internal functions
   become named exports under the namespace. Internal helpers stay private.
4. **emit.ts switch cascade** — replaces per-emitter `renderForNode` /
   `emitFromNode` dispatch with the centralized taxonomy tree.
5. **Cleanup** — remove `isContainerShape` checks from emitters (the
   taxonomy tree in emit.ts handles the routing), remove duplicated
   detection predicates.

### Success criteria

- `modelType` switch in emit.ts is the ONLY place taxonomy dispatch happens
- Each emitter exports a namespace with dotted functions — no internal
  `switch(modelType)` or `if (isContainerShape)` branching
- `classifyBranchSlots` is the ONE source for single-slot vs multi-slot
- Generated output is byte-identical before/after (no behavioral change)
- All counts hold across all three grammars
- Type-check clean
