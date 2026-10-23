# One QueryPlan evaluator: the candidates measured

Probe branch `probe/one-query-evaluator`, from master at `5bc3c68cf`. It does
not merge. It measures the candidates for one `QueryPlan` evaluator against
the approved design (`docs/superpowers/specs/2026-10-08-one-query-evaluator.md`)
and its two rulings: ECMAScript with the `u` flag is the one regex dialect,
and `match` refuses every flag but `u`. The design's choice of evaluator (its
§1) was open for evidence only.

## Summary

The evidence supports the approved design as it stands. One JavaScript
evaluator, fed byte spans by the native walk, ECMAScript `u` as the dialect,
and a value's text as `$text`, else its span's slice.

- **Which evaluator.** All candidates return native's result count on all 20
  corpus rows, and 0 of 3,292 nodes answer differently from native per node.
  - **Spans (the design):** 0.79–1.30× today's native walk on Linux, 0.83–1.52×
    on macOS, inside the design's stop rule (no row over 1 ms may pass 2×).
  - **Per node in hand (the `is` shape):** JavaScript `holds` costs
    0.21–1.18 µs, against 2.5–20.6 µs for native `planHolds` today and
    1.2–2.8 µs with the plan compiled once.
  - **scm (a plan compiled to a tree-sitter query):** cannot be the one
    evaluator. It reaches built nodes only by render and reparse, at
    63–67 µs per node against 0.6–0.7 µs for JavaScript, and a context-bound
    kind does not reparse alone. It cannot state "no value passes" or two
    tests on different values of a multi-valued slot, and it refuses 37 of
    272 python (kind, slot) pairs. It also runs 1.5–5.6× today's native
    walk.
- **One dialect.** Native code gets ECMAScript `u` from the `regress` crate.
  Compiled that way, native agrees with JavaScript on all seven patterns,
  including the unicode cases, at no measurable cost: native-es runs at
  0.74–0.97× native on Linux, the same as native-id. scm settles nothing on
  its own. The Rust binding's `#match?` is Rust `regex` (`^\w+$` matches 4
  names). web-tree-sitter's is ECMAScript **without** `u` (`\p{L}` matches 0).
- **One meaning of a slot's text.** `$text`, else the span's slice: the
  meaning of `sourceTextOf` on `feat/records` and of the portable
  classifier's `nodeText ?? sliceOf` on master. It agrees with native on
  every parsed row. A built compound has none, so a test on it holds on 0
  of 1,000 built calls. Rendering gives it a text that test holds on, but
  that is a different meaning, not a fallback.
- **The native plan cache.** Compiling the plan once and calling by id drops
  per-call `planHolds` from 2.5–20.6 µs to 1.2–2.8 µs on Linux, and walks by
  3–26%. Under the design, native stops evaluating plans, so the cache
  matters only for as long as `planHolds` lives.

Open points for the design (below): a `where` slot-flag test records a
`child` step, which the span walk does not yet serve; and whether an interim
native plan cache is worth landing.

## The candidates

| variant | where the plan is evaluated |
| --- | --- |
| native | today's public path: the walk evaluates the plan, whose JSON it parses and whose regexes it compiles on every batch and every `planHolds` call |
| native-id | the walk evaluates a plan compiled once and held by id (`probe_compile_plan`) |
| native-es | native-id with its patterns compiled by `regress` as ECMAScript `u` |
| spans | the design: the walk filters by kind and returns each match's subject values as byte spans (and kinds); JavaScript slices them and evaluates the plan compiled once, then hydrates only passing nodes |
| scm | the plan compiled to a tree-sitter query, run by the Rust binding; Rust `regex` in `#match?` |
| scm-es | scm with its patterns in `#es-match?`, evaluated by `regress` through the binding's general predicates |
| js | no pushdown: every kind match hydrated, `holds` through its accessors |

Every row variant ends with the passing nodes hydrated and wrapped. The
probe's native methods sit beside today's `descendants` and `planHolds`,
which are untouched, so one build runs every variant.

## 1. Which evaluator

Measured in CI by `.github/workflows/query-evaluator-probe.yml` (run
40029917524): release addons on a Linux runner (ubuntu-22.04, 4 EPYC cores)
and a macOS runner (macos-14, 3 virtual M1 cores), seven runs each. The corpus is the
issue's: python 3.14's `argparse.py` and `json/decoder.py`, typescript
`emitters/wrap.ts` and `common/src/engine.ts`, and rust `read.rs` and
`render.rs`, read at `5bc3c68cf`. `read.rs` takes the row of
`read_untyped_node.rs`, which no longer exists. The full tables are in
`evidence/run-40029917524/*/where-cost.md`.

Each variant against today's native walk, the median of seven runs per row,
the range over the 20 rows:

| variant | Linux | macOS |
| --- | --- | --- |
| native-id | 0.74–0.97× | 0.80–1.15× |
| native-es | 0.74–0.97× | 0.79–1.16× |
| spans | 0.79–1.30× | 0.83–1.52× |
| scm | 1.47–5.56× | 1.00–3.41× |
| scm-es | 1.47–5.53× | 1.01–3.50× |
| js | 0.82–1.52× | 0.88–1.64× |

Per node already in hand, a call per node (µs, range over the rows), and the
nodes that answer differently from native:

| evaluator | Linux | macOS | disagreeing nodes |
| --- | --- | --- | --- |
| native `planHolds` today | 2.49–20.61 | 2.94–27.13 | — |
| native, plan by id | 1.24–2.82 | 1.50–3.84 | 0 |
| scm, query by id | 1.31–12.76 | 1.43–12.38 | 0 |
| JavaScript `holds` today | 0.21–1.18 | 0.23–0.78 | 0 |
| JavaScript, plan compiled once | 0.22–0.91 | 0.23–0.71 | 0 |

Reading them:

- **Spans cost what the design said.** They pay over native for every kind
  match that crosses and fails: the slowest rows (typescript `member`, rust
  `field`, python `call`) pass 1–5 of 224, 3 of 358 and 9 of 657.
- **Native's per-call cost is the plan's compile, not the crossing.** With
  the plan held by id, a call costs 1.2–2.8 µs; the 2.5–20.6 µs today is
  parsing the plan and compiling its regexes again (20.6 µs for
  `name eq add_argument or returnType .`).
- **JavaScript is cheapest for a node in hand**: no crossing at all.
  Compiling its `RegExp` once saves little over V8's own regex cache
  (0.21–1.18 against 0.22–0.91 µs).
- **scm is slower than the native walk over a tree**, even as a bare query
  with no coordinates made: 2.66 ms against native's 1.49 ms on the argparse
  `def` rows, 2.81 against 0.46 on typescript `member.object`. The query
  names every kind a slot admits, and `member.object` admits most
  expressions.

## 2. One regex dialect

Python function names `café`, `x٣`, `plain`, `naïve_ünïcode`, the
same on both runners:

| pattern | native, Rust `regex` | native, `regress` (`u`) | JavaScript `holds` (`u`) | scm `#match?`, Rust binding | scm `#es-match?`, `regress` | scm `#match?`, web-tree-sitter |
| --- | --- | --- | --- | --- | --- | --- |
| `^\w+$` | 4 | 1 | 1 | 4 | 1 | 1 |
| `\d` | 1 | 0 | 0 | 1 | 0 | 0 |
| `\b\w` | 4 | 4 | 4 | 4 | 4 | 4 |
| `^[\p{L}\p{N}_]+$` | 4 | 4 | 4 | 4 | 4 | 0 |
| `\p{Nd}` | 1 | 1 | 1 | 1 | 1 | 0 |
| `^na` | 1 | 1 | 1 | 1 | 1 | 1 |
| `^[a-z]+$` | 1 | 1 | 1 | 1 | 1 | 1 |

- `regress` compiles ECMAScript with the `u` flag in Rust, and agrees with
  JavaScript on every pattern. So the ruled dialect is available natively
  wherever native code must match, at no measurable cost in these rows.
- A tree-sitter query has no dialect of its own; each binding brings one.
  The Rust binding compiles `#match?` with `regex::bytes::Regex`.
  web-tree-sitter compiles it with `new RegExp(pattern)`, with no flag, so
  `\p{…}` is not a property class there. An scm path that must agree with
  JavaScript needs its own predicate (`#es-match?` here) in either binding.
- The bindings also disagree on a predicate over a capture that holds no
  node: the Rust binding's `#match?` passes (`MatchString` loops over no
  nodes and returns true), web-tree-sitter's fails (`return !isPositive`).

## 3. One meaning of a slot's text

The meaning: a value's `$text`, else the slice of the source its span
covers; none for a built or edited compound, whose rendered text is not
source text. That is `sourceTextOf` on `feat/records`, and the portable
classifier's `nodeText(item) ?? sliceOf(item)` on master. The probe's
JavaScript provider reads it exactly that way.

- **Parsed nodes:** native, spans, scm and JavaScript agree on every row and
  every node. A span-based value's text is its span's slice by
  construction, an interior group's span is its sub-span of the token, and
  a scm capture's text is its node's byte range.
- **Built nodes:** 2,000 built python calls, half `self.gN()`, condition
  `function match ^self\.`:

  | evaluation | Linux µs per node | macOS | holds on |
  | --- | --- | --- | --- |
  | JavaScript `holds`, the one meaning | 0.61 | 0.72 | 0 |
  | JavaScript `holds`, text rendered | 4.92 | 5.39 | 1,000 |
  | render alone | 2.70 | 2.89 | — |
  | render and parse | 30.70 | 31.36 | — |
  | render, parse and scm | 62.72 | 67.05 | 1,000 |

  Under the one meaning the built `attribute` has no text, so nothing holds;
  the design has codegen refuse an `is` test whose subject can hold a built
  compound, and `where` refuses built nodes. A path that renders gives the
  compound a text and holds on 1,000 — a second meaning, which is what scm
  on built nodes would bring.
- **Reparse alone fails for a kind that needs its context**: corpus nodes
  whose source parses back alone to one node of the same kind with no error:

  | grammar | kind | nodes | reparsed |
  | --- | --- | --- | --- |
  | python | call | 657 | 657 |
  | python | function_definition | 144 | 144 |
  | python | keyword_argument | 126 | 0 |
  | typescript | member_expression | 224 | 224 |
  | rust | function_item | 48 | 48 |
  | rust | field_expression | 48 | 0 |

## 4. The native plan cache

`probe_compile_plan` compiles a plan once and returns an id;
`probe_plan_holds` and `probe_descendants` take the id. Before and after, on
the same build (Linux): a `planHolds` call per node drops from 2.49–20.61 µs
to 1.24–2.82 µs; a walk drops by 3–26% (native-id at 0.74–0.97× native). The
JavaScript side still serializes the addresses, so a call keeps a crossing's
fixed cost of about 1–2 µs.

Under the design, native stops evaluating: `planHolds` becomes
`subjectSpans` and the walk takes subjects. The cache is then moot. It is
worth landing only if `planHolds` will live long enough to matter.

## scm: a plan compiled to a tree-sitter query

`query_scm.rs` compiles a plan to scm. A slot's routes come from the kind's
own generated router, called over every (field, symbol) a child can carry,
so the query names exactly the children the read routes there. A field that
admits every symbol becomes `_` or `(_)`, all subtypes of a supertype become
the supertype, and tree-sitter's own analysis prunes the alternatives and
child orders it calls impossible. Each conjunct of the plan's disjunctive
normal form is one pattern, every literal on a slot sharing the slot's
capture, and the patterns' matches are unioned per node.

Coverage on python, native against scm (the counts and notes are the same
on both runners):

| construct | native | scm | what scm says differently |
| --- | --- | --- | --- |
| field `eq`, field `match` | 1, 2 | 1, 2 | |
| present, not present (field) | 1, 3 | 1, 3 | not present is `!field` |
| not `match`, a slot with one value | 2 | 2 | holds natively when no value passes, absent included; scm adds a `!field` pattern for absence |
| not `match`, an optional slot | 3 | 3 | as above |
| `and`, `or` across slots | 1, 2 | 1, 2 | children only in the grammar's order; one pattern per disjunct |
| `and` on one slot, one value | 1 | 1 | the literals share one capture |
| **not `match`, several values** | **1** | **2** | **a predicate tests each captured value on its own: "some value fails" for "no value passes"** |
| **`and` on one slot, several values** | **1** | **0** | **one capture cannot be both `os` and `sys`** |
| present (unfielded) | 1 | 1 | |
| not present (unfielded) | 0 | refused | scm negates only a field |
| `is` on a slot's values, `is` on the node | 1, 2 | 1, 2 | |
| child step | 1 | 1 | one pattern per child kind, the predicates lifted to the pattern |
| anchored child step (`first`, `last`, `only`) | 1 | refused | `.` anchors to the parent's named children, not to the slot's values |

The two bold rows are the semantic gaps: `from m import os, sys` holds
`not (names match ^os$)` under scm because `sys` fails, and fails
`names eq os and names eq sys` because one capture is either. A quantified
capture does not repair the first: tree-sitter also yields its partial
matches, the empty one among them, so every statement still holds (pinned by
a unit test in `query_scm.rs`).

Every (kind, slot) of each grammar's slot table, as a presence test:

| grammar | pairs | compiled | refused: an interior slot (a group of a token's text) | an envelope's slot | a hidden kind |
| --- | --- | --- | --- | --- | --- |
| python | 272 | 235 | 31 | 3 | 3 |
| typescript | 506 | 471 | 28 | 6 | 1 |
| rust | 439 | 409 | 24 | 4 | 2 |

Building it surfaced two traps for anyone writing scm by hand:

- A predicate belongs to a pattern only inside its parentheses. Written
  after the pattern at top level, it is a separate pattern that holds on
  every node.
- Predicates bind to the whole pattern wherever they sit, so an alternation
  whose branches need different predicates must become separate patterns.

What scm would mean as the one evaluator:

- **Built and edited nodes** have no tree. Render and reparse costs 63–67 µs
  per node against 0.6–0.7 µs. It gives a built compound a rendered text the
  one meaning refuses, and it fails outright for kinds that only parse in
  context. Keeping JavaScript `holds` for those nodes keeps two evaluators,
  the problem the issue names.
- **`is`'s context nodes**, which the caller passes parsed or built, would
  need a tree position: a built one has none, nor does a parsed one hydrated
  without a stored parent.
- **Semantics:** the multi-valued gaps above, anchored steps, unfielded
  absence, and the refused (kind, slot) pairs: 37 in python, 35 in
  typescript, 30 in rust.
- **Dialect:** a custom predicate in either binding, as above.
- **Cost:** slower than the native walk on these rows, per tree and per node.

## Open points for the design

- **A `where` slot-flag test records a `child` step.** `slotFlagRef` turns
  `r.slot.is(flag)` into `{ op: 'child', slots, of: … }` with an `is` leaf on
  the child (`carriedBy`): a self kind test and the flag's own plan, both
  evaluated on each child value. The design's walk returns, per stub, the
  spans (and kinds) of the values its routes admit and its own span (§1).
  The child's kind arrives with its span, but the flag's plan reads the
  child's own slots, which the stub's report does not hold. A child step
  needs a nested span report per child value, or hydration of the stubs
  whose plan has a child step. The probe's spans serve slot and self
  subjects only.
- **An interim native plan cache.** It cuts a `planHolds` call by 1.7–13.5×
  (Linux), most for plans with more tests and regexes. The
  design deletes the native evaluator, so this is worth landing only if
  that work is far off.

## Reproducing

From the repository root, with the three addons built (`pnpm --dir
rust/crates/sittir-<grammar> run build` for python, typescript and rust):

```sh
pnpm exec tsx docs/superpowers/probes/2026-10-23-one-query-evaluator/where-cost.mts --out /tmp/where-cost --runs 7
```

`--only rows,node,dialect,coverage,built` picks sections. The python corpus
is the standard library of `python3.14` (or `python3`, or `PY_STDLIB`); the
repository corpus is read at `5bc3c68cf` with `git show`.
