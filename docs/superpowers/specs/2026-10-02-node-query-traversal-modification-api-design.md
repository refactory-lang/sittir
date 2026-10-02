# Node Access, Query, Traversal, and Modification API

**Status:** Proposed  
**Date:** 2026-10-02  
**Scope:** wrapped-node API, generated field facets, shared structural query/traversal runtime

## 1. Summary

Sittir exposes one coherent protocol for observing and transforming node relationships:

```ts
node.field()                       // read/materialize
node.field.filter(...)             // lazy field query
node.field.find(...)

node.$with.field(value)            // replace complete field value

node.$edit.field.add(value)        // transform relative to current value
node.$edit.field.remove(...)
node.$edit.field.insert(...)
node.$edit.field.move(...)

node.children.filter(...)          // lazy traversal
node.descendants.filter(...)
node.ancestors.find(...)
```

The central rule is:

> **Accessors observe. Queries describe lazy selection. `$with` replaces a complete field value. `$edit` performs a structural transformation relative to the existing relationship.**

All modification remains immutable. No operation mutates its receiver.

## 2. Goals

- Preserve existing callable accessors such as `fn.name()` and `block.statements()`.
- Add lazy typed queries without materializing repeated fields first.
- Reuse one query protocol for field queries and traversal.
- Preserve `$with` as immutable whole-field replacement.
- Add `$edit` for relative structural operations.
- Derive editing capabilities from finalized field cardinality and contract restrictions.
- Preserve type narrowing across query composition.
- Make structural edits occurrence-aware and grammar-valid.
- Leave semantic/project-wide queries and refactoring as a later layer.

## 3. Non-goals

This proposal does not initially define mutable nodes, edit transactions, `using`/disposal commits, automatic rebasing of aliased editors or queries, semantic symbol resolution, cross-file refactoring, type-dependent lookup, or arbitrary deep mutation of query results.

## 4. Field facets

### 4.1 Read/materialize

Existing calls retain their meaning:

```ts
fn.name();          // Identifier
fn.returnType();    // Type | undefined
fn.parameters();    // readonly Parameter[]
block.statements(); // readonly Statement[]
```

Calling a repeated field accessor materializes that field's current values.

### 4.2 Lazy query

Repeated field accessors also expose query operators:

```ts
const q = block.statements
  .filter(is.statement.return)
  .filter(hasExpression);

const first = q.first(); // execution
const all = q.all();     // execution + materialization
```

`block.statements.filter(...)` searches only that direct field. It is not recursive.

### 4.3 `$with`: complete replacement

```ts
fn.$with.name(newName);
fn.$with.parameters([p1, p2]);
```

`$with.field(value)` constructs a new parent whose complete field value is `value`.

### 4.4 `$edit`: relative structural transformation

```ts
fn.$edit.parameters.add(p);
fn.$edit.parameters.insert(1, p);
fn.$edit.parameters.remove(p);
fn.$edit.parameters.move(2, 0);
```

Each operation returns a new parent. `$edit` is not a mutable editor.

Aliasing is allowed but does not rebase:

```ts
const e = fn.$edit;
const fn2 = e.parameters.add(p); // based on fn
const fn3 = e.parameters.add(q); // also based on fn
```

## 5. Cardinality-derived edit surface

### Required singleton

```ts
fn.name();
fn.$with.name(name);
```

No `$edit.name` is generated merely to duplicate replacement.

### Optional singleton

```ts
fn.returnType();
fn.$with.returnType(type);
fn.$edit.returnType.remove();
```

Removal is structural and belongs to `$edit`.

### Repeated field

```ts
fn.parameters();
fn.parameters.filter(...);

fn.$with.parameters(parameters);

fn.$edit.parameters.add(parameter);
fn.$edit.parameters.insert(index, parameter);
fn.$edit.parameters.remove(parameter);
fn.$edit.parameters.removeAt(index);
fn.$edit.parameters.replace(parameter, replacement);
fn.$edit.parameters.replaceAt(index, replacement);
fn.$edit.parameters.move(from, to);
```

Operations are generated only where their semantics are valid for the finalized field contract. Edits must preserve admitted element kinds, cardinality constraints, target restrictions, and project ownership.

## 6. Query protocol

Conceptually:

```ts
interface Query<T> {
  filter<S extends T>(guard: (v: T) => v is S): Query<S>;
  filter(predicate: (v: T) => boolean): Query<T>;
  ofKind<S extends T>(kind: KindGuard<S>): Query<S>;
  map<U>(project: (v: T) => U): Query<U>;

  first(): T | undefined;
  all(): readonly T[];
  count(): number;
  some(predicate?: (v: T) => boolean): boolean;
  every(predicate: (v: T) => boolean): boolean;
}

interface RepeatedField<T> extends Query<T> {
  (): readonly T[];
}
```

Exact names are implementation-level; the operator/terminal distinction is normative.

### Laziness

Non-terminal operators build a plan. They must not require complete source materialization.

```ts
block.statements
  .filter(is.statement.return)
  .first();
```

may stop after the first matching statement. The same applies to traversal.

### Explicit terminals

`Query<T>` is initially **not implicitly iterable**. These are intentionally unsupported:

```ts
for (const x of query) {}
[...query]
```

Execution is visible through `all()`, `first()`, `count()`, `some()`, etc. This preserves observable laziness and leaves room for native/tree-sitter-backed execution.

### Narrowing

Type guards and `ofKind` narrow the query result and narrowing composes:

```ts
const returns = block.statements
  .filter(is.statement.return);
// Query<ReturnStatement>
```

Terminals return ordinary node values, not mutable handles.

## 7. Traversal

Traversal sources implement the same query protocol:

```ts
node.children.filter(...)
node.descendants.ofKind(Expression.Call)
node.ancestors.find(...)
```

Initial sources:

- `children`: all direct structural children;
- `descendants`: recursive descendants excluding the receiver;
- `ancestors`: structural ancestors, nearest first.

A field query is narrower than generic traversal:

```ts
block.statements.filter(...) // statements field only
block.children.filter(...)   // every direct structural child
```

Ordering is deterministic:

- children: structural/source order;
- descendants: depth-first pre-order;
- ancestors: nearest parent to root.

Queries operate over structural **occurrences**, not merely object identity. A reusable node value may occur in multiple relationships.

## 8. Edit semantics

### Immutability

For `const b = a.$edit.items.add(x)`:

- `a` is unchanged;
- `b` represents the changed parent;
- unchanged substructure may be shared;
- project/engine ownership is retained.

### Relationship locality

Removal is expressed against the relationship:

```ts
fn.$edit.parameters.remove(parameter);
```

not:

```ts
parameter.remove();
```

A reusable node value does not intrinsically identify which occurrence should be removed.

### Targeting

`remove(value)` succeeds only when the supplied occurrence/value identifies one member of that field unambiguously. Zero or ambiguous matches produce a diagnostic/error rather than silently choosing.

`removeAt(index)` targets the indexed occurrence.

A future stable occurrence handle may be accepted directly.

### Grammar-owned syntax

Edits modify structure, not byte ranges. Removing `b` from `call(a, b, c)` must produce a valid structure equivalent to `call(a, c)`, including separator/wrapper ownership.

The canonical grammar/render model determines punctuation and wrapper behavior; `$edit` does not create a second text-editing engine.

### Provenance/trivia

Untouched siblings/subtrees retain provenance to the same extent as existing immutable updates. Inserted constructed nodes render newly. Removal also removes syntax structurally owned by that occurrence. Free-comment/trivia ownership requires one deterministic documented policy.

## 9. Query/edit composition

Direct-field query results may feed direct-field edits:

```ts
const returns = block.statements
  .filter(is.statement.return)
  .all();

const changed = block.$edit.statements.removeAll(returns);
```

`removeAll` is optional for the first implementation, but if present it validates that supplied occurrences belong to the field snapshot.

Deep editing such as:

```ts
node.$edit.remove(node.descendants.filter(...))
```

is explicitly deferred. It introduces overlapping matches, multiple parents, ordering, stale occurrences, and root-replacement semantics.

Queries are snapshot-bound. A query created from `block` continues to describe `block` after a new edited block is returned; it does not automatically rebase.

## 10. Construction/project interaction

Strict, hoisted, and vocabulary authoring surfaces converge on compatible canonical node representations. Structural query/traversal belongs to the node/runtime layer, not separate implementations per authoring mode.

Initial manipulation inputs should be **canonical node inputs**. A shared node's `$with`/`$edit` meaning must not vary according to whichever project view last accessed it. View-bound shorthand adapters can be added later if justified.

A transformed project-owned node retains its owner/context. Adding an incompatible foreign-owned node fails unless an explicit import/rehome mechanism exists.

## 11. Semantic queries are a later layer

The core API is structural:

```ts
fn.descendants.ofKind(Expression.Identifier)
block.statements.filter(is.statement.return)
```

It does not claim that an identifier is a resolved reference.

A later project layer may expose:

```ts
project.referencesOf(declaration)
project.declarations(...)
project.usages(...)
```

using scope/name analysis while reusing this traversal and occurrence infrastructure.

## 12. Compatibility

Existing accessors and `$with` remain source-compatible.

A repeated accessor evolves conceptually from:

```ts
() => readonly T[]
```

to a callable `RepeatedField<T>` with lazy query methods. Calling it still returns the same materialized value.

`$edit` uses the reserved `$` namespace to avoid collision with grammar/vocabulary fields.

No `$edit.field(value)` synonym for `$with.field(value)` is introduced: the distinction is semantic, not cosmetic.

## 13. Laws

Implementations and generated tests must establish:

### Read law
```text
field() = field.all()
```
modulo readonly representation.

### Replacement law
```text
node.$with.field(v).field() = canonicalize(v)
```

### Add law
```text
node.$edit.items.add(x).items()
= node.items() with x inserted at the operation-defined position
```

### Query narrowing law
A type-guard query terminal cannot return a value outside the narrowed type.

### Snapshot law
Queries/edit aliases created from node A continue to operate against A after another operation returns node B.

### Validity law
Every successful `$with` or `$edit` result satisfies the same finalized structural contract as direct construction.

### Locality law
A direct-field edit changes that relationship and structurally owned syntax, not unrelated occurrences of the same reusable node value.

## 14. Acceptance tests

The first implementation is complete when tests demonstrate:

1. Existing `field()` calls are unchanged.
2. `field.filter(...).first()` can terminate without materializing all elements.
3. Guard filtering narrows TypeScript types.
4. Field and traversal queries share the same compositional operators.
5. `$with` replaces whole singleton and repeated fields immutably.
6. Optional singleton `$edit.field.remove()` is generated; required singleton removal is absent.
7. Repeated fields expose only valid structural operations.
8. Add/insert/remove/move preserve grammar validity and separator rendering.
9. Original nodes remain unchanged after edits.
10. Query and `$edit` aliases remain bound to their original snapshot.
11. Reused node values can occur in multiple parents without `node.remove()` ambiguity.
12. Project ownership survives transformation and incompatible ownership is rejected.
13. Queries are not implicitly iterable.
14. Deep semantic/project queries are not accidentally exposed as structural guarantees.

## 15. Implementation direction

Generation should derive field facets from the same finalized field model used for accessors and `$with`, rather than maintaining a separate handwritten edit/query registry.

Runtime implementation should separate:

- **source**: field or traversal producer;
- **plan**: lazy composable operators;
- **terminal**: execution/materialization;
- **edit primitive**: immutable relationship transformation.

The backend may initially execute plans in TypeScript and later lower eligible plans to native/tree-sitter traversal without changing the public API.

## 16. Deferred questions

These are intentionally deferred rather than required for v1:

- lazy `flatMap`/cross-field query operators;
- siblings and typed parent traversal;
- stable public occurrence handles;
- `removeAll` and bulk replacement;
- deep transformation/rewrite API;
- semantic query integration;
- view-bound ergonomic edit inputs;
- explicit edit transactions;
- async/native query terminals;
- implicit iteration.

The v1 boundary is deliberately smaller: **typed lazy structural observation plus immutable field-local replacement and modification.**
