# One QueryPlan evaluator

**Status:** Proposed, for review
**Date:** 2026-10-08
**Scope:** where a `QueryPlan` is evaluated. Two consumers compile plans: the query facet's `where` and the portable `is` guards.
**Supersedes:** in the node query design (`2026-10-02-node-query-traversal-modification-api-design.md`), the §7.2 sentence "There is one native evaluator, and the JavaScript evaluator is kept only as the test oracle", and the §7.3 paragraph on Rust's `regex` crate.
**Measurements:** `docs/superpowers/probes/2026-10-08-one-query-evaluator/` (`where-cost.mts`, and `prototype-spans.patch` for the proposal's walk). The `is` numbers come from the binding-generator prototype's `is-cost` probe.

## What is there today

| | native `Plan::holds` (`sittir-core/src/query.rs`) | JavaScript `holds` (`common/src/query.ts`) |
| --- | --- | --- |
| Caller | the descendant walk, and `planHolds` over addresses: the facet's `where` | the portable `is` guards |
| Nodes it reaches | parsed nodes in a live tree, by handle or address | any node: parsed or built, and context nodes the caller passes |
| A slot's values | the node's non-extra children whose field is in `fields`, or that have no field and whose kind is in `kinds` | the slot's accessor, found by scanning the kind's `querySlots` row for equal routes |
| A value's text | the child's source slice | `$text`, or `fixedText[id]` for a kind-id item |
| Subjects | a slot | a slot or the node's own text (`SelfText`) |
| Regex dialect | Rust `regex` | ECMAScript with the `u` flag |

The two sides already give different answers on the same plan:

- **Dialect.** Python function names `café`, `x٣`, `plain` and `naïve_ünïcode`:
  - `^\w+$` matches 4 names natively and 1 in JavaScript;
  - `\d` matches 1 and 0;
  - `^na` and `^[a-z]+$` agree.
- **Text.** A `$text`-only provider has no text for a structured value or an alias envelope:
  - python `call.function match ^self\.` finds 0 nodes against native's 155;
  - typescript `member.property eq length` finds 0 against 34, and `member.object match ^this\.` 0 against 14;
  - rust `field.field eq kind` finds 0 against 2.

  `is` avoids this only because its compiler steps through alias content to a leaf. A provider that uses a leaf's `$text` and otherwise the value's byte-span slice matches native on all 20 measured rows.

## 1. The JavaScript evaluator survives

`holds(plan, texts)` in `common/src/query.ts` is the only evaluator. The native side stops evaluating and becomes a source of spans:

- **Built nodes** reach the evaluator through their accessors, as `is` does today. Nothing crosses.
  - To evaluate natively instead, a built node would have to be encoded as a transport and sent across on every call.
  - `is` over 2,000 built rust `binary_expression`s costs 564 ns per node in JavaScript.
  - A native call has a fixed cost of 1.0–1.3 µs (query design §5.1) before any encoding.
- **Parsed nodes, one at a time** (`is`, a `where` after an opaque step) also go through their accessors, without crossing.
- **The descendant walk keeps its pushdown, without evaluating.**
  - `descendants` takes the plan's subjects (the distinct routes it reads, plus self) in place of the plan.
  - With each kind-matching stub it returns the byte spans of the values each subject admits: the children its routes admit, or the stub's own span for self.
  - JavaScript slices the spans with the existing `spanSlicer`, evaluates `holds`, and hydrates only the stubs that pass.
  - A `where` over stored items (slot views, `$children`) makes one `subjectSpans(addresses, subjects)` call per batch, in place of today's `planHolds`.
  - Spans cost the same per value whatever the value's size, so a condition on a large slot (`body`) never copies text it does not compare.
- **What a value's text is.** One definition, with one provider per place a node lives:
  - a parsed value's source text: a leaf's `$text` (the read stamps it from the same slice), otherwise its span's slice;
  - a built leaf's `$text`, or `fixedText[id]` for a kind-id item.

  A built structured value has no text. Codegen refuses an `is` test whose subject can hold one (`readTestOf` already refuses the other shapes it cannot test), and `where` already refuses built nodes.
- **The accessor is stamped, not searched.** A slot subject becomes `SlotSubject = { accessor } & SlotRoutes`:
  - codegen stamps the accessor in `readTestOf` (for the subject and every `via` step);
  - the `where` recorder stamps it from the key it was read under;
  - JavaScript reads `subject.accessor`, and the walk reads `fields` and `kinds`.

  The scan over `querySlots` with `sameRoutes`, the cost driver in the refined `is` rows, goes away: the scan re-derived a compile-time fact on every call.
- **Patterns compile once.** `holds` evaluates a compiled plan whose `match` leaves hold `RegExp` objects:
  - built once per plan object and cached in a `WeakMap`;
  - for the generated `is` tables, built when `portableSurface` builds the guards.

  Today every evaluation constructs a `RegExp`, and every native `planHolds` call parses its plan and compiles its regexes again.

The dialect becomes ECMAScript with the `u` flag everywhere. Rust `regex` remains in `sittir-core` for token interiors (`read.rs`) and leaves the query path.

## 2. Self text and context nodes

- **`SelfText`** stays as `is` defines it, with the same meaning in both providers: the node's own text.
  - The walk returns the stub's own span.
  - A hydrated or built node uses its `$text`, or its span's slice when it is parsed and structured.
  - `where` gains no surface for it. The subject type admits it, and nothing records it there.
- **`is`'s context nodes** are unchanged: the caller passes them, parsed or built, and conditions run through their accessors.
  - Under a native evaluator they would need handles. A built context node has none, and a parsed one hydrated without a stored parent has none either, because `$ancestors` is deferred.
  - The single JavaScript evaluator is what makes context nodes possible at all.

## 3. Cost against today

`where-cost` runs on master's release addons, rebuilt with `prototype-spans.patch`. The patch only adds the walk's `subjects` argument; every other variant runs today's code. Every variant ends with the passing nodes hydrated and wrapped, and the times are medians of 7.

**Caveat on load.** The load average was about 50 during the run. Compare columns within a row, not absolute times. Implementation reruns the probe as its gate.

The variants:

| variant | what it measures |
| --- | --- |
| native | today: the walk evaluates the plan, and only passing stubs cross |
| spans | the proposal: the walk filters by kind and returns each stub's subject spans in the same call; JavaScript slices them, evaluates the plan compiled once, and hydrates only passing stubs |
| batch | the walk filters by kind, then one more native call per batch answers each stub (the earlier stand-in for the proposal) |
| span | no pushdown: every kind match is hydrated, and `holds` runs through accessors with `$text`, else the span slice |

python `argparse.py` (the query design's §7.4 conditions):

| condition | kind matches | results | native ms | spans ms | spans / native | batch ms | span ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| def: name eq format_help | 144 | 3 | 1.53 | 1.47 | 0.96× | 1.53 | 4.51 |
| def: name match ^_ | 144 | 107 | 3.15 | 2.93 | 0.93× | 3.05 | 4.17 |
| def: name match ^_ and not ^__ | 144 | 68 | 2.38 | 2.43 | 1.02× | 2.47 | 4.32 |
| def: name eq add_argument or returnType . | 144 | 2 | 1.35 | 1.42 | 1.05× | 1.52 | 4.48 |
| call: function eq isinstance | 657 | 9 | 1.36 | 1.88 | 1.38× | 2.34 | 14.93 |
| call: function match ^self\. | 657 | 155 | 2.94 | 3.34 | 1.14× | 4.33 | 14.80 |

The other files:

| file | condition | kind matches | results | native ms | spans ms | spans / native | batch ms | span ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| python `json/decoder.py` | call: function eq isinstance | 75 | 0 | 0.18 | 0.25 | 1.33× | 0.28 | 1.56 |
| typescript `emitters/wrap.ts` | member: property eq length | 687 | 34 | 1.55 | 1.92 | 1.24× | 2.36 | 15.70 |
| typescript `emitters/wrap.ts` | member: object match ^this\. | 687 | 14 | 1.21 | 1.70 | 1.41× | 2.05 | 14.93 |
| rust `read_untyped_node.rs` | fn: name match ^read | 33 | 4 | 1.73 | 1.56 | 0.90× | 1.68 | 6.37 |
| rust `read_untyped_node.rs` | field: field eq kind | 251 | 2 | 0.49 | 0.66 | 1.36× | 0.94 | 7.72 |

The full table, with every python `json/decoder.py` row, typescript `engine.ts` and rust `render.rs`, is in the probe's `outputs/where-cost.txt`. Spans, batch and span return native's result count on all 20 rows.

- **Spans run at 0.87× to 1.41× native.** The three rows the stop rule would have tripped under batch come in at:
  - `isinstance`: 1.38×;
  - typescript `object match ^this\.`: 1.41×;
  - `add_argument or returnType .`: 1.05×.
- **Why spans beat batch (0.97× to 1.92× in this run).** The spans ride on the walk's own call, so a batch makes one crossing, not two.
- **What spans still pay over native.** Every kind match crosses as a stub with its spans, not only the passing ones, and JavaScript slices and evaluates each. So the gap grows with kind matches that fail: the 1.3–1.4× rows pass 9 of 657, 14 of 687 and 2 of 251.
- **Hydrating every match** (span) costs 1.3× to 16× native, the same gap the query design measured. Dropping pushdown is not an option.
- **Per node already in hand** (the shape of an `is` call), the same plans cost:
  - one native `planHolds` call: 1.3–19 µs, because it parses the plan and compiles its regexes on each call;
  - JavaScript `holds`: 0.4–1.2 µs, through a linear accessor scan.
- **`is` itself** (coordinate's first run, at high load):
  - 35–80 ns per admitted node on an exact path;
  - 0.5–3.5 µs on a refined one (operator pins, placed and hidden captures);
  - 564 ns per built node.

  Stamping the accessor removes the refined rows' scan. Coordinate is rerunning these at normal load.

## 4. What changes in meaning

These follow from the choice. Q1 and Q2 change behaviour or surface that users see.

- **`where` patterns run as ECMAScript `u`.**
  - `\w`, `\d` and `\b` become ASCII-only.
  - `\s` stays Unicode in both dialects. JavaScript also counts U+FEFF as space, and Rust does not.
  - Patterns that Rust refused (look-around, back-references) are accepted.
  - A user who wants today's Unicode meaning writes it out under `u`:

    | Rust today | ECMAScript `u` |
    | --- | --- |
    | `\w` | `[\p{L}\p{N}_]` (letters, digits and underscore; Rust also counts combining marks and connector punctuation) |
    | `\d` | `\p{Nd}` |
    | `\b` before or after a word | `(?<![\p{L}\p{N}_])` / `(?![\p{L}\p{N}_])`, a look-around Rust would have refused |

    On the probe's names (`café`, `x٣`, `plain`, `naïve_ünïcode`), `^[\p{L}\p{N}_]+$` matches all 4 and `\p{Nd}` matches 1, as Rust's `^\w+$` and `\d` do today.
  - All 12 `#match?` patterns in the three grammars' `bindings.scm` are in the subset where the two dialects agree. The 7 `#eq?` predicates have no dialect. The only `.` (python's `^__(?<stem>.*)__$`) differs only on `\r`, U+2028 and U+2029, which no identifier contains.
  - **Q1 (user):** accept ECMAScript `u` as the one dialect? Recommended: yes.
    - The trade: a `where` written with `\w` or `\d` over non-ASCII names finds fewer nodes than today, and the fix is the spelled-out class above.
    - The alternative is refusing `\w`, `\d` and `\b` so that no pattern changes meaning silently. That keeps the second dialect alive as a rule users must learn.
- **`match` flags.** `slotRef.match` refuses every flag but `u`, because the native side had no equivalent. With one JavaScript evaluator, `i`, `s` and `m` could cross.
  - **Q2 (user):** admit them? Recommended: not in this change. Keep the refusal, and decide it as a surface question of its own.
- **The walk's limit counts kind matches, not passing stubs.** A selective `where` takes more batches. The first-result latency the geometric batch limits protect is unchanged for `ofType` alone.

## 5. Migration

One branch, five tasks.

**Depends on:** the typed reader's 1c-i and the binding generator's Stage 3, both merged.
- 1c-i turns the walk's stubs into coordinates.
- Stage 3 adds `SelfText`, `PortableCondition` and the `is` tables. It is not on master yet: it is gated in the prototype, waiting on a type-checker stack-depth fix. The branch starts after Stage 3 lands.

**Gates:**
- The full unit suite and the cargo workspace pass after every task.
- `validate history` is identical across all grammars. The query path is not on validation rows; a moved row stops the work.
- After Task 4, rerun `where-cost` on the branch and on master in the same session: same files, conditions and runs.

**Stop rule:**
- A row whose master native time is over 1 ms and whose new time exceeds 2× it, or any result count that differs from master's native count, stops the work and is reported.
- Exception: the dialect rows Q1 accepts.

**Tasks:**

1. **Stamp the accessor.**
   - `@sittir/types`: `SlotSubject = { readonly accessor: string } & SlotRoutes`, `QuerySubject = SlotSubject | SelfText`, and `PortableCondition.via: SlotSubject[]`.
   - `readTestOf` stamps the accessor of each step and each subject.
   - `slotRef` stamps its recorder key.
   - `portableSurface` reads `slotItems(node, subject.accessor)`, and `sameRoutes` is deleted.
   - Regenerate the portable tables.
   - Gate: coordinate's `is-cost` before and after, with the refined rows reported.
2. **Compile the plan once.**
   - `compilePlan(plan) → CompiledPlan` in `common/src/query.ts` (a `match` leaf holds its `RegExp`), cached per plan object.
   - `holds` takes a `CompiledPlan`.
   - A unit test pins the dialect on Q1's answer, for example `^\w+$` against `café`.
3. **Native: spans, not answers.**
   - `ParsedTree::descendants` takes `subjects` in place of a plan, and each returned stub carries `spans[subject][value]`.
   - `subject_spans(addresses, subjects)` replaces `plan_holds`, and the napi bindings follow.
   - `Routes::admits` and the child loop of `any_value` become the span gatherer.
   - Rust tests:
     - a field route and an unfielded kind route;
     - self;
     - an extra child is never admitted;
     - an address naming no node is refused.
4. **JavaScript pushdown over spans.**
   - `pushdown` sends subjects.
   - The walk's batches filter through `holds` with texts from `spanSlicer` before hydration.
   - `whereHolds` uses `subjectSpans`.
   - The existing query tests pass unchanged.
   - A parity test runs `where-cost`'s conditions on its corpus files and asserts master's native result counts.
5. **Delete the native evaluator.**
   - Remove `Plan`, `PlanSpec`, `Plan::holds`, `compile_plan` and the napi `plan_holds` with its typing.
   - Update the glossary entries for the query module.
   - Amend the node query design §7.2/§7.3 to point here.
