# Bound and Parsed node types

## Problem

A node's declared type and its runtime surface come from different places.

- **Wrap returns are inferred.** Every `wrapX` returns an object literal
  whose type TypeScript infers. The per-kind tree types are defined
  backwards from `ReturnType<typeof wrapX>`. Accessors call
  `drillIn<T.Child>(…)`, so a child types as its storage interface, not as
  a node with `$with` and methods. After `root.statements()[0]` and
  `is.functionItem(item)`, `item.$with` is a type error.
- **Typing children through the inferred map doesn't finish.** Typing
  `drillIn` as the wrapped type of its child, through that inferred map,
  never finishes type-checking. Inference recurses
  `wrapSourceFile → Statement → wrapExpressionStatement → …` with nothing
  to bound it.
- **Read and build disagree on hoisted slots.** The strict factory of a
  list owner takes the list's options and items directly:
  `build.parameters({ delimiter }, p1, p2)`. The read side stops one
  level short: `fn.parameters().parametersElements()!.elements()` in rust,
  `.elements()!.parameters()` in python.
- **`Built` names a node's origin, not what it can do.** Every node
  `build.*` returns is bound to its engine, the same as a parsed one.

## Design

Every kind's namespace carries two computed node types. Both derive from
the kind's main (storage) interface and a slot marker the emitter stamps
on it.

```ts
export interface FunctionItem {
	readonly $type: TSKindId.FunctionItem;
	readonly _parameters: Parameters;
	// … storage and accessors, as today …
	readonly __slotHints__?: { /* emitter-stamped slot facts */ };
}

export namespace FunctionItem {
	export interface Bound extends BoundOf<FunctionItem> {}
	export interface Parsed extends ParsedOf<FunctionItem> {}
}
```

### `__slotHints__`: the stamped facts

The emitter already decides each slot's surface when it prints the
factory overloads and the wrap accessors. It stamps those decisions on the
main interface as a type-only member. `BoundOf` and `ParsedOf` read the
marker and never re-derive anything from storage keys:

- **Accessor to storage:** which accessor reads which storage key. The
  accessor names stay the main interface's own.
- **List owner:** when the owner's sole content is a separated list. This
  is the same fact that gives the strict factory its
  `(options?, ...items)` overloads. The marker records the element type
  (the stored element) and the options type (the keys the factory's
  `options` argument takes).

### `X.Bound`: every engine-bound node

`X.Bound` replaces `X.Built`. It is the type of every node an engine
produces, whether built by a factory or read from a tree.

- **Accessors:** each returns the child's `.Bound`. A supertype-typed
  child distributes member by member: `Statement` becomes the union of its
  members' `.Bound`.
- **`$with`:** each setter returns `X.Bound`.
- **Node methods:** `$render`, `$trivia` and the rest, as the node
  methods type declares them.
- **List owners** (per `__slotHints__`):
  - `Iterable<E>`, passing through to the stored list's elements, where
    `E` is the stored element type. In rust that is
    `AttributedParameter`, not the bare arm, so no content is lost on
    read.
  - `length` and `at(i)`, forwarding to the same stored array.
  - The build `options` keys, flattened onto the node (`delimiter`
    today). On a parsed node they report what the source had, such as a
    trailing comma.
  - `$with(options?, ...items)` with the same overloads as the strict
    factory.
  - An owner with no list present (`fn f()`) iterates nothing. It is
    still the owner node, which holds the parentheses.
- **Not flattened:** separator spacing stays a render-options site
  (render options and `styleFrom`), not a node field.

### `X.Parsed`: tree-bound nodes

`X.Parsed` extends `X.Bound` for a node that belongs to a tree: a parsed
node, or a `$with` draft of one, which keeps `$nodeHandle`.

- **Children:** each accessor returns the child's `.Parsed`.
- **`$with`:** a draft stays tree-bound, so `$with.<slot>(v)` returns the
  parent's `.Parsed` with that one slot's accessor retyped to the slot's
  input type:
  `$with.parameters(v: Parameters.Bound): WithSlot<FunctionItem.Parsed, 'parameters', Parameters.Bound>`.
  - The replaced slot reads as `.Bound`, since it holds a factory node
    until commit. The untouched slots stay `.Parsed`.
  - The type is fixed per slot from its declared input type. It never
    depends on `typeof v`: per-call inference is what made
    type-checking unbounded.
  - `WithSlot` key-remaps the slot's accessor out and adds the retyped
    one. A plain intersection would make the accessor an overload pair
    in which the `.Parsed` signature wins.
  - Chaining keeps the last narrowing only: `WithSlot`'s own `$with` is
    the parent's, so after `$with.a(x).$with.b(y)` slot `a` reads as
    `.Parsed` again.
- **Tree members:** `$commit()`, plus the tree association and span
  members.
- **Run-time backstop:** `$commit` on a node that is not in the tree, or
  is detached, throws. So any remaining overclaim (the chained case)
  fails loudly.
- **Fallback:** if the timing gate shows `WithSlot` costs type-check time
  beyond noise, drop it and have `$with.<slot>` return plain `X.Parsed`.
  The run-time backstop covers the overclaim that leaves.

### Resolution stays lazy

- **Children:** `BoundOf` and `ParsedOf` resolve a child through emitted
  per-kind maps whose entries are the named `.Bound` and `.Parsed`
  interfaces. Named interfaces resolve lazily, so type-checking never
  infers through the tree's recursion.
- **Key-remapping, not `Omit`:** they drop the main interface's own
  accessor signatures by key-remapping
  (`{ [P in keyof D as P extends K ? never : P]: D[P] }`, distributed
  over unions). The storage interfaces carry an index signature, so
  `keyof` is `string` and `Omit` drops every declared key.
- **Supertype dispatch** needs no declared type of its own, since the
  union distributes. The existing `is.*` guards narrow within the
  wrapped union unchanged.

### Where each type is used

- **Factories:** each factory returns `X.Bound`.
- **Wraps:** each `wrapX` is annotated `: X.Parsed`. The wrap-return map
  and `drillIn`/`drillInAll` type through the `.Parsed` map.
- **`X.Built` is removed:**
  - every reference moves to `X.Bound`: generated types, `@sittir/types`,
    tools, examples and the READMEs;
  - the `Built` family aliases go with it.

## Out of scope

The hoisted slot's name still differs by grammar: python's list-owner slot
is `elements` (from enrichment's field), rust and ts use the list kind.
Python's inner item field also leaks as `parameter(s)`. One naming rule
for group-lift slots is a separate change.

## Verification

- **Type-level probe per grammar** (rust, ts, python):
  `root.statements()[0]` narrowed by `is.<kind>` has `$with`, its
  accessors return `.Parsed` children, and `$commit` type-checks.
  After `item.$with.parameters(build.parameters(p))`, `parameters()` is
  `Parameters.Bound` and the other accessors are still `.Parsed`.
- **List-owner probe per grammar:**
  - `for (const p of fn.parameters())` yields the stored element type;
  - `fn.parameters().delimiter` and `.length`/`.at(0)` type-check;
  - `fn.parameters().$with({ delimiter }, p)` matches
    `build.parameters`' overloads.
- **Run-time pins:**
  - iteration passes through to the stored list;
  - an absent list iterates nothing;
  - a parsed trailing comma reads back as `delimiter`.
- **Type-check time:** measure the whole-repo type-check before and after
  with the same commands. It must not regress beyond noise; a throwaway
  rust-only measurement of declared wrap returns was flat.
- **Validate rows:** identical across the three grammars, since the
  change is type-level plus pure pass-throughs.
