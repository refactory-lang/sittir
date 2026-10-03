# Node Access, Query, Traversal and Modification API

**Status:** Proposed
**Date:** 2026-10-02
**Scope:** the wrapped-node surface (slot views, traversal sources, `where`, `$edit`), the native walk behind it, and the edit results that feed the edit lifecycle (#437)

## 1. Summary

```ts
fn.parameters()                                   // the items, materialized: today's accessor
fn.parameters                                     // a lazy view of the same slot
fn.parameters.filter(isTyped).find(hasDefault)    // operators build a plan; a terminal runs it

node.$children                                    // every direct structural child, as a view
node.$descendants.ofType(kinds.Call)              // a kind filter the native walk applies
node.$descendants
	.ofType(kinds.FunctionDefinition)
	.where((c) => c.name.match(/^test_/).and(c.returnType.eq('None').not()))
                                                  // a condition the native walk applies

fn.$with.parameters(p1, p2)                       // replace the slot's whole value
fn.$edit.parameters.insert(1, p)                  // transform relative to the current value
```

> **Accessors observe. Views describe a lazy selection. `$with` replaces a slot's whole value. `$edit` transforms a slot relative to its current value.**

No operation mutates its receiver. On a parsed node, a `$with` or `$edit` result is a draft that `$commit()` commits (§8).

## 2. Goals and non-goals

Goals:
- Keep every existing call: `fn.name()`, `block.statements()` and `$with` mean what they mean today.
- Read a slot or a subtree lazily, with typed narrowing, without materializing it first.
- One set of verbs for slot views and traversal views.
- Push kind filters and slot conditions into the native walk, so a selection pays for the nodes it keeps, not for the nodes it visits.
- Structural edits derived from each slot's finalized cardinality, valid against the grammar, with gaps rendered by one rule (§9).

Not in this design: mutable nodes, edit transactions, `using`/disposal commits, automatic rebasing of a held view or editor, semantic or cross-file queries, deep rewrite (`node.$edit.remove(node.$descendants…)`), `$ancestors` (§6) and removal by value (§8).

## 3. Slot facets

### 3.1 `x.slot()` materializes

`fn.parameters()` returns the slot's items as an array; `fn.name()` returns the node or `undefined`. Nothing changes here.

### 3.2 `x.slot` is a lazy view

`fn.parameters` is a callable view: calling it materializes (`fn.parameters()` above), and its verbs (§4) build and run a plan over the slot's items. A singular slot's view has the same verbs over zero or one item.

Nodes are instances of a class per kind (#610). `x.slot` is a getter on the class prototype. On the slot's first read it makes the view as one closure over the node and the slot, and keeps it in a private field the class declares. The table below measures that against today's method in the literal and the alternatives (`cached-view`: 200,000 nodes with three repeated slots, one shape per process; Node 26, Apple silicon):

| Shape | Build | Heap per node | First `x.slot` | Held per viewed slot | `x.slot()` | Allocated per `x.slot()` |
|---|---|---|---|---|---|---|
| today: a method per slot in the literal | 17–36 ns | 464 B | — | — | 8 ns | 0 B |
| `__proto__` in the literal, a new view per read: closures for the items and the plan, an own property, `setPrototypeOf` | 74–77 ns | 272 B | — | — | 229–250 ns | 616 B |
| `__proto__` in the literal, a new view per read, one closure | 74–77 ns | 272 B | — | — | 55 ns | 96 B |
| `__proto__` in the literal, the view kept in a declared field | 73–79 ns | 296 B | 64–74 ns | 104 B | 8–9 ns | 0 B |
| **a class per kind, the view kept in a private field** | **13–15 ns** | **296 B** | **66 ns** | **104 B** | **9–10 ns** | **0 B** |
| a class per kind, a bound view kept | 14 ns | 296 B | 66 ns | 48 B | 22 ns | 32 B |

Every shape keeps 1,000 of 1,000 nodes in fast mode. A node whose views were made shares its map with a node never read.

- **A getter in the node's literal puts every node in dictionary mode** (`slot-accessor`). V8 gives each literal evaluation its own accessor pair, so no two nodes share a shape: 0 of 1,000 nodes stay fast, and a node takes 936 B. #534 removed exactly this (the `$trivia` getter) from every node, so a getter in the literal is excluded, for the views and for `$edit` alike.
- **Filling a declared field keeps the shape.** That is why a kept view costs nothing after the first read. A private field costs the same as a symbol-keyed one, and no key listing, spread or `Object.assign` sees it.
- **A class constructor builds a node in 13–15 ns.** `__proto__` in a literal costs 73–79 ns, and 76–233 ns at a polymorphic site with computed symbol keys. The class also drops today's per-node member closures: 296 B per node against 464 B.
- **One closure is the cheapest callable to call.** A bound function inherits its target's prototype, so it needs no `setPrototypeOf`, and it holds 48 B instead of 104 B. But V8 does not inline a call through it, so `x.slot()` costs 22 ns and allocates 32 B per call.

**Decision:** the views and `$edit` (§8) are getters on the prototype of the node's class (#610). Each view is one closure, made on the slot's first read and kept in a private field the class declares. After that first read (66 ns, 104 B held), `x.slot()` costs 9–10 ns, where today's method costs 8 ns. A kind declares one field per slot, at 8 B per slot per node. A kind with many slots may instead declare one field holding a record of its views: 8 B per node, but 26 ns per `x.slot()`.

The prototype's methods reach the node's tree through the tree token the node already holds (the private symbol `holdReadTree` stamps), not through a closure.

### 3.3 `$with` replaces a slot's whole value

`fn.$with.name(newName)` and `fn.$with.parameters(p1, p2)` build a new parent with that value, as today. Like the readers, `$with` is a member on the prototype of the node's class (#610).

### 3.4 `$edit` transforms a slot

`fn.$edit.parameters.insert(1, p)` returns a new parent with the slot's items transformed (§8). There is no `$edit.slot(value)` synonym for `$with`.

## 4. The view verbs

A view has the read-only verbs of an array, lazily:

- **Operators** return a view and run nothing: `filter`, `map`, `flatMap`, `slice`, plus `ofType(kind)` (§5.3) and `where(condition)` (§7).
- **Terminals** run the plan: `find`, `findIndex`, `some`, `every`, `includes`, `reduce`, `forEach`, `at`. A view is also iterable: `for … of` and spread run the plan and pull results as they are needed.

There is no `toArray`, `length`, `first`, `all` or `count`: `x.slot()` and `[...view]` materialize, and `.length` is the array's. No `Query` type is exported. Each view is typed by its element: `filter` with a type guard narrows, `ofType` narrows to the kind, `where` keeps the type, `map` changes it.

`includes(node)` compares occurrences, not values. A parsed node is the occurrence its coordinate names (tree, span and kind, as `node_at_span` resolves them), and a built node is compared by identity. Value equality is deferred with `remove(value)` (§8).

## 5. Traversal and execution

### 5.1 What a read costs

Every item a view yields is a node read. Today a child is read one native call at a time: the stub's coordinate goes to `readUntypedNode`, the JSON comes back, `holdReadTree` stamps it and `wrapNode` wraps it (`read-cost`, release natives, median of 5 runs, µs per named node):

| File | Named nodes | Native | `JSON.parse` | `holdReadTree` | `wrapNode` | Total | JavaScript share |
|---|---|---|---|---|---|---|---|
| python `json/decoder.py` | 2,481 | 4.59 | 1.03 | 0.49 | 2.71 | 8.82 | 48% |
| python `argparse.py` | 17,509 | 5.41 | 1.02 | 0.50 | 3.37 | 10.30 | 47% |
| typescript `common/src/engine.ts` | 1,873 | 5.37 | 1.26 | 0.35 | 2.69 | 9.67 | 44% |
| typescript `emitters/wrap.ts` | 9,761 | 6.44 | 1.23 | 0.38 | 1.80 | 9.85 | 35% |
| rust `sittir-core/src/render.rs` | 1,382 | 5.36 | 1.29 | 0.44 | 3.27 | 10.36 | 48% |
| rust `read_untyped_node.rs` | 4,566 | 10.06 | 1.23 | 0.36 | 3.23 | 14.88 | 32% |

One deep read of the same trees costs 3.5–8.7 µs per node natively, so a call's fixed cost beyond the node it carries is 1.0–1.3 µs. A node read is about half native and half JavaScript, and the native half is the read itself (slots, trivia, serialization), not the call. A traversal that hydrates every node pays the whole row per node; one that hydrates only what it keeps pays it per result.

### 5.2 Sources

- `x.slot`: the slot's items, already read with their parent. A stored stub carries its kind, so `ofType` on a slot view filters without hydrating.
- `$children`: every direct structural child in source order: the named children, merged across slots, without anonymous tokens or trivia.
- `$descendants`: every structural descendant in depth-first pre-order, the receiver excluded. Comments and other extras are trivia, never descendants.

The names carry `$` because grammars use them as slot names: typescript's `jsx_element` has a `children` slot.

`$ancestors` is deferred. The native table records each node's parent coordinate only for nodes a read has reached, so walking up from an arbitrary node needs native parent links, which are not designed here. `within` and `containing` (filters on an ancestor or a descendant) are deferred with it.

### 5.3 The plan

A view's plan is its source and a list of steps. `ofType` and `where` are declarative, and so is `slice` while nothing opaque precedes it. `filter`, `map` and `flatMap` take JavaScript callbacks and are opaque.

- **The declarative prefix runs natively.** On `$descendants`, the native walk applies the kind filter, the `where` condition and the slice before any node crosses. On `$children` and slot views the coordinates are already in JavaScript, and a `where` condition is evaluated natively over them in one call.
- **The first opaque step splits the plan.** Everything from it on runs in JavaScript over hydrated nodes.
- **`ofType` and `where` may move ahead of an opaque `filter`, never ahead of `map` or `flatMap`.** A filter keeps elements and does not change them, so a kind test or a slot condition gives the same result before or after it. A map changes the element the next step sees. A callback must not depend on how many times it runs.

The native walk returns batches of stubs, each with the coordinate it hydrates at. A batch resumes where the previous one stopped, by the path of child indices to the last node visited, so no batch walks again what an earlier one walked. An item is hydrated (§5.1) when a JavaScript step or a terminal needs the node.

### 5.4 Batch size

`batch-walk` runs the native walk prototype on python `argparse.py` (17,509 named nodes). The sparse kind has 112 nodes; the early kind first matches at node 25 and the late one at node 14,960:

| Limit | Calls, all nodes | Native µs per stub | Parse µs per stub | Native µs per match, sparse kind | First batch, early kind | First batch, late kind |
|---|---|---|---|---|---|---|
| 1 | 17,510 | 5.22 | 0.73 | 15.68 | 2.7 µs | 916 µs |
| 4 | 4,378 | 1.50 | 0.38 | 11.43 | 27 µs | 926 µs |
| 16 | 1,095 | 0.55 | 0.31 | 10.48 | 147 µs | 1,100 µs |
| 64 | 274 | 0.31 | 0.29 | 10.06 | 995 µs | 1,106 µs |
| 256 | 69 | 0.23 | 0.28 | 10.00 | 1,126 µs | 1,108 µs |
| unbounded | 1 | 0.21 | 0.27 | 9.80 | 1,108 µs | 1,089 µs |

Two more inputs give the same curve. python `json/decoder.py` (2,481 nodes): 3.18 µs per stub at a limit of 1, 0.28 at 64 and 0.22 at 256. typescript `emitters/wrap.ts` (9,761 nodes): 7.41, 0.40 and 0.30. A call costs more in the deeper typescript tree because each batch re-seeks its resume path from the walk's root.

- **A stub costs about 0.5–0.6 µs in a large batch** (0.2–0.3 native, 0.3 parse), against 9–15 µs for a node read. The native walk costs 0.06–0.09 µs per node visited: a kind filter over all of `argparse.py` costs 1.1 ms natively, while hydrating every node to filter in JavaScript costs about 180 ms.
- **A fixed large batch hurts the first result.** With the limit at 64 or more, a `find` for an early match walks the rest of the tree to fill the batch (1.0–1.1 ms). A limit of 1 returns it in 2.7 µs.
- **Decision: batch limits grow geometrically: 1, 4, 16, 64, then 256 per batch.** The first result arrives after one minimal call. A full walk reaches 256-stub batches after four calls and pays within 10% of an unbounded walk per stub. A terminal that stops early leaves at most one batch's worth of stubs unused, and stubs are never hydrated in advance.

A late first match costs the walk to reach it, whatever the limit (0.9–1.1 ms here). That is the walk, not batching.

## 6. Deferred traversal

`$ancestors`, `within`, `containing`, siblings and a typed parent are deferred until native parent links are designed (§5.2).

## 7. `where`

### 7.1 Surface

```ts
node.$descendants
	.ofType(kinds.FunctionDefinition)
	.where((c) => c.name.match(/^_/).and(c.name.match(/^__/).not()));
```

The callback receives a recorder, not a node. The recorder's members are the kind's slots (`c.name`, `c.returnType`), each with `eq(text)` and `match(regExp)`. A comparison returns a condition, and conditions combine with `and`, `or` and `not`. A comparison holds when some value in the slot has the text or matches.

The recorder is a mapped type over the node type's slot accessors. After `ofType` it has exactly that kind's slots. Over a union it has only the slots every member has, so `$descendants.where((c) => c.name…)` without `ofType` is a type error in python, where no slot is shared by every kind. Verbs added later (a kind test on a slot, a count) extend the recorder without changing v1.

### 7.2 Compile target: the native plan

`where` compiles to a plan that names model slots (`{ op: 'eq', slot: 'return_type', text: 'int' }`). The native walk evaluates the plan. It finds a slot's values with the function the reader stores children by: one `child_slot` serves both, so the plan names model slots and nothing maps a slot to a parser field a second time. A tree-sitter query string was the alternative. It would need that mapping inverted and shipped to TypeScript, and sittir has no native query runner (`find_and_read` is a stub), so it is not used.

### 7.3 It is sound, so it is in v1

The prototype (`where.ts`, `where-cost.mts`, `where-types.ts`, and the native plan in `prototype-descendants.patch`) meets the four conditions:

1. **The recording covers slot access and eq / match / not / and / or.** It refuses everything else at run time: an unknown slot, a call, an assignment, and a regular expression with flags (they are not carried across, so `/x/i` is refused rather than matched case-sensitively).
2. **The plan uses the reader's routing.** The recorder maps the accessor name to the model slot name (`returnType` → `return_type`), and the native evaluator keys children by the reader's `child_slot`. On each of the six plans in §7.4, the nodes the native plan selects are exactly the nodes a JavaScript reference over each candidate's slot texts selects.
3. **The mapped types narrow.** `tsc` passes with each misuse marked `@ts-expect-error`, and each mark fails for its stated reason: a slot the kind lacks, a slot not shared over a union, a slot called as a function, a predicate returning a boolean, a condition handed to `filter`, and the kind kept after `where`.
4. **An ordinary predicate is never taken for a condition.** The callback must return a recorded condition, which the types and a run-time brand both check. A recorder slot is not callable. `eq` and `match` exist only on the recorder, never on a node's slot view, so a condition passed to `filter` fails to type and throws at run time.

A regular expression crosses as its source and runs under Rust's `regex` crate. A pattern that crate cannot compile (a back-reference, a look-around) is refused at the call, never matched differently.

### 7.4 What it saves

`where-cost`, python `argparse.py`: the native walk with the plan, hydrating the matches, against what a `filter` does today (kind filter natively, every candidate hydrated and its slot read through the accessor, the condition tested in JavaScript). Median of 5 runs:

| Kind and condition | Candidates | Matches | Native plan | JavaScript filter |
|---|---|---|---|---|
| definition: `name eq format_help` | 144 | 3 | 1.3 ms | 3.8 ms |
| definition: `name match ^_` | 144 | 107 | 2.5 ms | 3.8 ms |
| definition: `name match ^_ and not ^__` | 144 | 68 | 2.2 ms | 4.0 ms |
| definition: `name eq add_argument or returnType .` | 144 | 2 | 1.2 ms | 3.7 ms |
| call: `function eq isinstance` | 657 | 9 | 1.3 ms | 12.8 ms |
| call: `function match ^self\.` | 657 | 155 | 2.6 ms | 12.7 ms |

Both columns include the same 1.1 ms walk. The JavaScript filter adds about 18 µs per candidate (the candidate read and the slot read). The native plan adds a read only per match, so the saving grows with the candidates a condition rejects: a factor of 10 on calls.

## 8. `$edit`

### 8.1 Surface, by cardinality

- **Required singleton:** `$with` only. No `$edit` member duplicates replacement.
- **Optional singleton:** `$edit.slot.remove()`.
- **Repeated:** `add(...items)` (append), `insert(index, ...items)`, `removeAt(index)`, `replaceAt(index, item)` and `move(from, to)`.

Operations are generated from the same finalized slot model as the accessors and `$with`, never from a second registry. An index refers to the slot's items as `x.slot()` returns them.

- **`$edit.slot` reaches through a hoisted list kind.** Where the slot holds a list node, the operations edit the list's items, and the list node and its owner are both rebuilt.
- **Below a list's minimum, an edit is refused at run time.** It throws from the one edit function in common every facade calls: `removeAt` on the only item of a non-empty list, for instance. The static types do not carry list lengths.
- **Removal by value is deferred.** `remove(value)` and `replace(value, …)` need value equality, which is not settled; `removeAt` and `replaceAt` target the occurrence by position.

### 8.2 Where `$edit` lives

`$edit` is a getter on the prototype of the node's class (§3.2, #610) and builds the editing facade when it is read. The logic of every operation is one function in common, and each facade only names the slot.

### 8.3 Results are drafts

On a parsed node, a `$with` or `$edit` result is a draft in the sense of the edit lifecycle (#437). It keeps its tree association, sends no stale span, and leaves its unchanged children as coordinates.

- `$commit()` commits one draft through tree-sitter and returns it as a coordinate of the new tree version.
- `engine.commit(...drafts)` commits several drafts of one tree in one version. It takes over the name `engine.edit` had in the lifecycle design.
- `engine.edit(path, fn)` keeps its name as the file verb.
- `Project.commit()` is renamed `Project.save()`.

Every result is immutable: `a.$edit.items.add(x)` leaves `a` unchanged and shares `a`'s unchanged substructure.

### 8.4 Aliasing

A held `$edit` facade or view is bound to the node it was read from and never rebases:

```ts
const e = fn.$edit;
const fn2 = e.parameters.add(p); // from fn
const fn3 = e.parameters.add(q); // also from fn
```

## 9. Gaps and trivia after an edit

An edit changes structure, never byte ranges, and rendering lays out every gap by one rule (#589):

1. **A gap between two items that were adjacent in the source keeps its source bytes.** That covers a line-break run or same-line spacing, and an edited item as well as an untouched one. Adjacency is the neighbour rule's test: the same tree token, and the rebuilt predecessor is the source sibling, by span.
2. **Every other gap is canonical.** It takes the seat of the kind before it, or a render option when the caller sets one. Nothing is inferred for a gap the source never had.

So `insert` gives the inserted item canonical gaps on both sides. `removeAt(i)` leaves a canonical gap between the new neighbours, since they were not adjacent. `move` makes the gaps around the moved item canonical, and `replaceAt` with a built item does the same. A removed item takes the syntax it owns with it: its separator and the trivia #371's derivation gives it, since every extra has exactly one owner. The line-break whitespace a read records comes from the same derivation (#371). There is no majority vote over a list's gaps.

## 10. Ownership

There is no engine or project ownership check. A node renders by its tree handle: live trees are held per language, and a tree lives while a node names it (#540). A slot may hold a node parsed by another engine of the same language.

## 11. Beside the shared-arena draft

The arena draft makes a parsed node a view: an object holding its tree and its row, with its kind's accessors and methods on a per-kind prototype (its first open ruling, recommended there). That is the prototype of the class #610 makes every node an instance of, where §3.2 puts the slot getters and `$edit`. Both designs ask for the same change to how a node is built.

Under the arena, a stub becomes a row and a batch becomes a range of rows, so the native walk returns rows rather than JSON stubs. The JavaScript half of a node read (§5.1: `JSON.parse`, `holdReadTree` and most of the wrap) is the cost the arena removes. The arena replaces `wire_slot` with routes stamped at generation. The `where` evaluator then reads those routes, so it still shares one routing with the accessors. The plan, the batch limits and the `where` surface do not change.

## 12. Rulings

1. **Where the getters live (§3.2, §8.2): #610.** Every node is an instance of a class per kind. The slot views and `$edit` are getters on its prototype, and each view is kept per node in a private field the class declares. A getter in the literal is excluded.
2. **What `x.slot()` costs (§3.2): #610.** It costs 9–10 ns after the slot's first read (66 ns), against 8 ns for today's method.
3. **`includes` compares occurrences (§4).** A parsed node is its coordinate and a built node its identity, until value equality is settled with `remove(value)` (§8).
4. **`where` moves ahead of an opaque `filter` (§5.3), as `ofType` does.** Both are declarative and pure. Neither moves ahead of a `map`.

## 13. Laws

- **Read:** `x.slot()` and `[...x.slot]` have the same items.
- **Replacement:** `node.$with.slot(v).slot()` is `v`, canonicalized.
- **Add:** `node.$edit.items.add(x).items()` is `node.items()` with `x` appended.
- **Narrowing:** a terminal of a narrowed view never returns a value outside the narrowed type.
- **Batching:** a view yields the same items, in the same order, at every batch limit.
- **Reordering:** moving `ofType` or `where` ahead of an opaque `filter` never changes the items.
- **Pushdown:** a native `where` selects exactly the nodes the same condition selects in JavaScript.
- **Snapshot:** a view or facade read from `A` keeps working against `A` after an operation returns `B`.
- **Validity:** every successful `$with` or `$edit` result satisfies the finalized structural contract of direct construction.
- **Locality:** a slot edit changes that relationship and the syntax it owns, not other occurrences of the same node value.
- **Gaps:** after an edit, a gap between items adjacent in the source renders its source bytes, and every other gap renders its seat or the caller's option.

## 14. Acceptance tests

1. Existing `x.slot()` calls and `$with` are unchanged.
2. `x.slot.filter(p).find(q)` and `x.$descendants.find(q)` return before hydrating the rest of the source.
3. Type-guard `filter` and `ofType` narrow; `where` keeps the narrowed type.
4. Slot views and traversal views share every verb.
5. `$descendants.ofType(k)` hydrates only nodes of kind `k`; the batch limits follow 1, 4, 16, 64, 256.
6. Every stub a batch returns hydrates to the kind and span it reported.
7. `where`'s recorder refuses an unknown slot, a call, a plain predicate and a flagged pattern; `filter` refuses a condition.
8. A native `where` and its JavaScript reference select the same nodes across the three grammars.
9. Optional singletons have `$edit.slot.remove()`; required singletons have no `$edit` member.
10. Repeated slots expose `add`, `insert`, `removeAt`, `replaceAt` and `move`, and the shared edit function refuses an edit below a list's minimum.
11. `$edit` on a slot holding a hoisted list kind edits the list's items.
12. Add, insert, remove and move render each gap by §9: source bytes between items adjacent in the source, the seat everywhere else.
13. Original nodes are unchanged after any edit; views and facades stay bound to the node they were read from.
14. Every node a read returns is a fast-mode object (`%HasFastProperties`), and making its views keeps its map.
15. A slot may hold a node another engine of the same language parsed, and the result renders.

## 15. Implementation direction

- **Generation:** every node is an instance of a class per kind (#610). Its prototype carries the readers, `$with`, `$trivia`, `$render`, `$engine`, the slot views and `$edit`. The class declares the node's data fields and one private field per slot view. The views, the `$edit` facades and the recorder's slot map come from the finalized slot model that already drives the accessors and `$with`.
- **Native:** one walk (`descendants`, in the prototype patch): a pre-order cursor walk from a handle with a kind filter, an optional `where` plan, a batch limit and a resume path, minting a handle only for the parents of the stubs it returns. The reader and the plan evaluator share `child_slot`.
- **JavaScript runtime:** source, plan, terminal and edit primitive are separate pieces in common. The plan splitter moves `ofType` and `where` ahead of opaque filters, sends the declarative prefix to the walk, and pulls geometric batches.

## 16. Deferred

- `$ancestors`, siblings, a typed parent, `within` and `containing`.
- `remove(value)`, `replace(value, …)`, `removeAll` and value equality.
- Deep transformation (`node.$edit.remove(node.$descendants…)`).
- Semantic and project-wide queries (references, declarations, usages), which will reuse this traversal.
- View-bound ergonomic edit inputs and explicit edit transactions.

## 17. Tools

The probes live in `scratchpad/node-query/` in the main checkout. Its README says how to run each and which inputs and commits produced the numbers above.

| Probe | Measures |
|---|---|
| `read-cost.mts` | where a node read's time goes: native call, `JSON.parse`, `holdReadTree`, `wrapNode` (§5.1) |
| `batch-walk.mts` | the native walk's cost per stub and first-batch latency for each batch limit, and that stubs hydrate correctly (§5.4) |
| `slot-accessor.mts` | build, read, call, heap, allocation and V8 fast mode of a getter in the literal and of views made per read (§3.2) |
| `cached-view.mts` | a view kept per node in a declared field against one made per read, by callable (closure, bound function) and by how the prototype is given (`__proto__` in the literal, a class per kind): build, reads, calls, heap, allocation, fast mode and map sharing (§3.2, #610) |
| `list-owner-shape.mts` | whether list owners stay in fast mode by how `length` and their indices are defined, and the cost of a parsed list's first read (#611, #612) |
| `list-index.mts` | a list index's cost by where it lives: an own accessor, own data, data a class writes, an accessor on a shared prototype (#611) |
| `where.ts`, `where-cost.mts`, `where-types.ts` | the `where` prototype, its run-time and compile-time soundness checks, and its cost against a JavaScript filter (§7) |
| `prototype-descendants.patch` | the native walk, the `where` plan evaluator and the shared `child_slot` the batch and `where` probes run against |
