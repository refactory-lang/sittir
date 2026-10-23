# Measuring every list slot at parse: the cost

Probe branch `probe/parse-list-slots`, from master at `e20e09e32`. It does
not merge. The tree-inferred options plan
(`docs/superpowers/plans/2026-09-29-tree-inferred-options.md`) folds each
list's spacing into the tree's layer when the tree is parsed. To do that, the
parse has to measure every list slot of the tree. Today a slot is measured on
first use (`ParsedTree::node_slots`, cached in `slots`). This probe measures
that input on the validation corpora.

## Summary

- **(b) over (a): +230% to +275%.** Measuring every list slot at parse costs
  about 3.3–3.8× a parse alone: +7.5 ms per pass on rust, +6.1 on typescript
  and +8.0 on python. That is 50–69 µs per corpus tree, or about 0.9 µs per
  node.
- **(d) over (c): +76% to +81%.** The absolute cost is the same as on parse
  alone (+7.9, +6.7, +8.4 ms), because the public full read measures no list
  slot. `ParsedTree::read` builds its context without the side lookup
  (`read_ctx()`, no `with_sides`), so it reads no trivia and no slot layout.
  Today a list slot is measured only when a render prepares a parsed node's
  layout (`NodeLayout::prepare` → `slot_layouts`), or by the layout
  diagnostics. A fold at parse therefore adds its whole cost to every parse,
  read or not.
- **About a fifth of the cost is the trivia table.** `node_slots` builds the
  tree's trivia table on first use. Built alone, the table adds 51–57% to a
  parse (21–23% of (b)'s extra cost). Measuring the slots is the rest: 1.6–2.0
  µs per routed node.
- **Most of the walk finds no list.** Only 6.9–8.0% of the routed nodes hold
  a list slot (a slot with two or more items), so the walk routes 12–14
  nodes for each list it finds: 20–28 µs of slot measuring per list.
- **Retained memory: +1.9 to +2.4 MiB per 100 trees** (RSS, +122% to +160%
  over parse alone), all native. The JavaScript heap does not move. The
  trivia table is 0.6–0.7 MiB of it. The slot cache is 1.3–1.6 MiB, because
  `node_slots` keeps an entry for every routed node it measures, including
  the 92–93% that hold no list.
- **The stop rule was not met.** None of the three attempts kept every
  variant's spread within 4%: the worst was 9.3%, and 7.2% in the counted run.
  Every effect above is at least ten times the worst spread, and stays within
  a few points across all three attempts (table below).

## Variants

One build of master plus two probe methods, release profile.

| variant | what a pass does for each corpus entry |
| --- | --- |
| (a) | `parse` |
| t | `parse`, then the trivia table alone (`probe_trivia`): the part of (b) a first read of any side also does |
| (b) | `parse`, then `node_slots` for every node whose kind routes its children one at a time (`Router::Children`, the kinds `slot_routes` routes), in one pre-order walk (`probe_measure_list_slots`) |
| (c) | `parse`, then `read(treeId, 0, Infinity)`, the public read of the whole tree |
| (d) | `parse`, then (b)'s walk, then (c)'s read: the order a fold at parse would run in |

Each pass also turns the parse's JSON into the tree id and disposes the tree,
the same in every variant. Disposal is inside the timed pass, so (b) pays for
dropping its slot cache.

## Results

CI run 40033660426 on a Linux x64 runner (ubuntu-22.04, 4 vCPU AMD EPYC 9V45,
Node 24.21.0). There were five rounds in alternating variant order, with a
fresh Node process for each measurement. Each measurement is the median of
100 timed passes after 10 warm-up passes. The counted run is attempt 3 of 3.
Full output: `evidence/run-40033660426/parse-cost.{md,json}`.

ms per pass, the median of the rounds (spread over the rounds):

| grammar | (a) parse | t: trivia table | (b) slots at parse | (c) full read | (d) slots, then full read |
| --- | --- | --- | --- | --- | --- |
| rust | 2.95 (3.8%) | 4.58 (1.0%) | 10.40 (6.1%) | 10.13 (3.8%) | 18.03 (4.2%) |
| typescript | 2.65 (3.1%) | 4.04 (2.7%) | 8.76 (2.8%) | 8.76 (3.7%) | 15.42 (5.1%) |
| python | 2.91 (7.2%) | 4.57 (2.9%) | 10.91 (0.9%) | 10.39 (1.9%) | 18.79 (2.7%) |

Change in each attempt:

| attempt | grammar | (b) over (a) | (d) over (c) | t over (a) | worst spread |
| --- | --- | --- | --- | --- | --- |
| 1 | rust | +257.2% | +78.7% | +54.7% | 5.2% |
| 1 | typescript | +245.1% | +76.8% | +50.7% | 7.6% |
| 1 | python | +275.7% | +82.7% | +54.1% | 5.8% |
| 2 | rust | +265.2% | +79.4% | +57.4% | 5.8% |
| 2 | typescript | +252.8% | +77.2% | +55.7% | 9.3% |
| 2 | python | +280.1% | +78.5% | +53.1% | 6.5% |
| **3 (counted)** | rust | **+253.3%** | **+78.0%** | +55.3% | 6.1% |
| **3 (counted)** | typescript | **+229.9%** | **+76.1%** | +52.1% | 5.1% |
| **3 (counted)** | python | **+274.5%** | **+80.9%** | +56.8% | 7.2% |

What a pass covers:

| grammar | trees | nodes | routed nodes | nodes with a list slot | list slots | trivia runs | full reads refused |
| --- | --- | --- | --- | --- | --- | --- | --- |
| rust | 149 | 8,337 | 3,298 | 246 | 246 | 4,547 | 0 |
| typescript | 119 | 6,784 | 2,404 | 167 | 167 | 3,931 | 0 |
| python | 116 | 8,441 | 3,959 | 316 | 316 | 4,245 | 0 |

Retained memory per 100 trees (MiB): five copies of the corpus held after
the variant's stage, then GC, as the median of five rounds (each round within
0.06 MiB of it):

| grammar | trees held | (a) parse | t: trivia table | (b) slots at parse | (b) − (a) |
| --- | --- | --- | --- | --- | --- |
| rust | 745 | 1.53 | 2.14 | 3.39 | +1.87 (+122%) |
| typescript | 595 | 1.60 | 2.27 | 3.54 | +1.94 (+122%) |
| python | 580 | 1.49 | 2.23 | 3.86 | +2.37 (+160%) |

These are RSS figures. The JavaScript heap and external memory moved by less
than 0.01 MiB per 100 trees in every variant.

## Caveats

- **The corpus trees are small:** 56–73 nodes each. `node_slots` routes a
  node by positioning a fresh cursor from the root (`routes_at` → `goto`), so
  its cost per node on a large file may differ. These rows don't measure
  that.
- **Today's lazy path pays the same measurement,** but only for the nodes a
  render prepares. A parse that is never rendered pays nothing today.

## Reproducing

From the repository root, with the rust, typescript and python addons built
in release (`pnpm --dir rust/crates/sittir-<grammar> run build`):

```sh
pnpm exec tsx docs/superpowers/probes/2026-10-23-parse-list-slots/drive.mts --out /tmp/parse-cost
```

`bench.mjs` is one measurement in one process. `drive.mts` writes each
corpus's sources to `--out`, runs the rounds and the memory measurements, and
writes `parse-cost.json` and `parse-cost.md`. Its flags `--rounds`,
`--passes`, `--warmup`, `--copies`, `--max-spread`, `--attempts` and
`--grammars` override the defaults above.
