# Boundary baseline and feasibility probes (2026-10-01)

Measurements behind `docs/superpowers/specs/2026-10-01-shared-arena-design.md`, taken at master
`69b821c18`; release native build, Apple M4 Pro, Node 26.10. Run from the root of a checkout at
`69b821c18` whose natives are built: each script measures the checkout in `SITTIR_ROOT`, or else the
current directory. Commands that load a checkout name this folder by its path in the repo; the
plain-node probes (`*.mjs`) run from this folder.

**Refreshed 2026-10-04 at master `106475358`:** see `../transport/README.md` — this baseline re-taken
on the same input bytes, plus the transport-macro probe and build-cost probes. The scripts here are
kept as they were run, for the `69b821c18` numbers; only their checkout paths now come from
`SITTIR_ROOT` or the current directory. The timings below did not reproduce at `69b821c18` on
2026-10-05 (the deep read of `engine.rs`: 42.9 ms here, 18.2 ms then); for comparisons across
commits use the pairs in `../transport/README.md`, measured back to back.

## Baseline (current master)

```bash
pnpm exec tsx --expose-gc docs/superpowers/probes/2026-10-01-shared-arena/2026-10-01/measure-boundary.mts rust rust/crates/sittir-core/src/engine.rs
pnpm exec tsx --expose-gc docs/superpowers/probes/2026-10-01-shared-arena/2026-10-01/measure-boundary.mts rust rust/crates/sittir-core/src/spacing.rs
pnpm exec tsx --expose-gc docs/superpowers/probes/2026-10-01-shared-arena/2026-10-01/measure-boundary.mts typescript packages/common/src/create-engine.ts
pnpm exec tsx docs/superpowers/probes/2026-10-01-shared-arena/2026-10-01/measure-rebuilt.mts rust        # also typescript, python
pnpm exec tsx docs/superpowers/probes/2026-10-01-shared-arena/2026-10-01/measure-build.mts               # factory construction cost
pnpm exec tsx docs/superpowers/probes/2026-10-01-shared-arena/2026-10-01/measure-build2.mts
```

The scripts import by absolute repo path, so they also run from outside the checkout;
keep the `.mts` extension (tsx treats a `.ts` file outside a package as CommonJS).

Profiles (`profile-*.top.txt`) are the "top of stack" section of macOS `sample`,
6 s at 1 ms, taken while `loop-deep-read.mts` loops one native call:

```bash
pnpm exec tsx docs/superpowers/probes/2026-10-01-shared-arena/2026-10-01/loop-deep-read.mts rust rust/crates/sittir-core/src/engine.rs deep-read 14 &
sample <pid> 6 1 -file out.txt
pnpm exec tsx docs/superpowers/probes/2026-10-01-shared-arena/2026-10-01/loop-deep-read.mts rust rust/crates/sittir-core/src/engine.rs render-fixtures 16 &
```

| | rust engine.rs 24.8 KB | rust spacing.rs 48.9 KB | ts create-engine.ts 8.9 KB |
|---|---|---|---|
| nodes in the deep read | 5 961 | 16 436 | 3 455 |
| tree-sitter parse | 1.10 ms | 3.21 ms | 0.69 ms |
| deep read, native | 42.9 ms | 74.5 ms | 8.44 ms |
| deep wire | 780 431 chars | 2 108 179 chars | 450 997 chars |
| JSON.parse of it | 2.43 ms | 5.96 ms | 1.24 ms |
| shallow re-read of a live tree | 58.7 µs | 36.7 µs | 9.0 µs |
| engine.parse shallow / deep | 1.19 / 41.2 ms | 3.18 / 83.3 ms | 0.71 / 10.7 ms |
| parse + touch every accessor, shallow | 55.0 ms (1 772 visited) | 101.0 ms (6 866) | 18.5 ms (1 713) |
| parse + touch every accessor, deep | 52.5 ms (3 191 visited) | 114.7 ms (9 594) | 17.9 ms (2 088) |
| heap held by the walked deep tree | 979 KB | 2 767 KB | 533 KB |
| untouched render, shallow (projection) | 30.7 µs (3.1 µs) | 45.8 µs (2.2 µs) | 13.5 µs (2.1 µs) |
| untouched render, deep (projection) | 375 µs (361 µs) | 1.15 ms (1.09 ms) | 318 µs (307 µs) |

The accessor walk in `measure-boundary.mts` guesses accessor names from storage keys and
misses some, so "visited" is a lower bound; the per-visited-node costs stand.

Deep-read profile (rust): tree-sitter navigation 85.0 %, sittir reader 4.5 %, malloc/free 3.3 %,
V8 2.8 %, serde_json 2.7 %.

Rebuilt render over the parity render fixtures (per slot value): rust 276 ns projection +
371 ns native; typescript 276 + 434; python 273 + 393. Profile of the native call (rust):
V8 and napi 71.0 %, napi-rs glue 6.4 %, sittir prepare and render 10.6 %, memmove 7.1 %,
malloc/free 4.1 %.

Factory construction (rust): `identifier('x')` 0.9–1.4 µs; `binaryExpression` from built
children 2.8 µs strict, 3.4 µs loose; loose input from strings 6–12 µs per node;
`$with.name` on a built node 5.8 µs.

`transport.rs` lines, and the share that is `FromNapiValue` + `ToNapiValue` impls: rust
82 790 (51.5 %), typescript 104 500 (53.7 %), python 53 717 (50.9 %), scm 10 426 (52.3 %),
regex 11 096 (56.3 %).

## Probes (not the implementation)

```bash
cd docs/superpowers/probes/2026-10-01-shared-arena/2026-10-01/arena-proto
CARGO_TARGET_DIR=$PWD/target ${CARGO:-cargo} build --release
./target/release/arena-proto ../../../../../../rust/crates/sittir-core/src/engine.rs /tmp/engine.rs.image
node ../view-proto.mjs /tmp/engine.rs.image
SITTIR_ROOT=$(git rev-parse --show-toplevel) pnpm exec tsx ../encode-proto.mts rust
```

`arena-proto` uses the upstream tree-sitter grammars, not the generated parsers.

| | rust engine.rs | rust spacing.rs | ts create-engine.ts |
|---|---|---|---|
| rows | 5 083 | 13 459 | 3 267 |
| image, 6 words a row | 121 992 B | 323 016 B | 78 408 B |
| image write, one pass, with trivia ownership | 290 µs (57 ns/row) | 862 µs (64 ns/row) | 197 µs (60 ns/row) |
| against the parse | 0.31× | 0.31× | 0.32× |
| `goto_descendant` seek | 96 ns | 106 ns | 96 ns |
| view traversal, every row | 50 µs (10 ns/node) | 155 µs (12 ns/node) | 30 µs (9 ns/node) |
| child by field id | 7 ns | 6 ns | 6 ns |

Generic arena encoder over the parity fixtures: 51 / 45 / 56 ns per slot value
(rust / typescript / python) against 229 / 213 / 208 ns for `toTransportData` in the same
run; 21 / 20 / 22 bytes per slot value.

## Construction: where it goes, and what a view costs (added later the same day)

`profile-build.mts` under `tsx --cpu-prof` (run from a tree at `69b821c18`; master has since moved to
the transport ABI 7 and needs a native rebuild), summarized by `top-self.mjs`: garbage collector 20.7 %,
a property-definition builtin 18.6 %, `withMethods` 13.4 %, the transpiler's per-closure name helper
18.7 %, `withAccessors` 6.6 %, `bindEngine` 3.3 %, `buildBinaryExpression` 1.8 %, `buildIdentifier` 0.3 %.
Attaching per-node methods, with its garbage, is about four fifths; building storage is about 2 %.

`node node-shape-proto.mjs` (plain node, one three-slot node): storage object + per-node closures
1 153 ns; object fields + per-kind prototype 4 ns; record in a shared-memory chunk + view 11 ns;
reading a child through a view 4 ns.

## Members in the builder's literal, and dictionary mode (added later the same day)

Machine under load (load average 14–44) for this section; figures are minima over 9 rounds and were
stable across four runs. `literal-members.mjs` runs one form per process.

```bash
for f in $(node --expose-gc --allow-natives-syntax literal-members.mjs); do node --expose-gc --allow-natives-syntax literal-members.mjs $f; done
node --allow-natives-syntax which-step.mjs
pnpm exec tsx docs/superpowers/probes/2026-10-01-shared-arena/2026-10-01/real-node-mode.mts && pnpm exec tsx docs/superpowers/probes/2026-10-01-shared-arena/2026-10-01/parsed-node-mode.mts
```

| form (one three-slot node) | build | retained | fast properties | read 3 fields | `Object.keys` |
|---|---|---|---|---|---|
| today: literal, `withAccessors`, `withMethods` | 846 ns | 2 232 B | 0 / 1 024 | 17.5 ns | 98 ns |
| all in the literal, a closure per member, `get $trivia()` | 436 ns | 1 680 B | 0 / 1 024 | 15.8 ns | 135 ns |
| all in the literal, a closure per member, no `$trivia` | 34 ns | 888 B | all | 1.6 ns | 9 ns |
| literal names functions written once, no `$trivia` | 28 ns | 656 B | all | 1.6 ns | 9 ns |
| the same, `$trivia` a plain called function | 28 ns | 664 B | all | 1.3 ns | 9 ns |
| the same, then one getter shared by all nodes defined | 82 ns | 656 B | all | 1.4 ns | 8 ns |
| literal spreads one members object | 58 ns | 672 B | all | 1.2 ns | 8 ns |
| members inherited from one object | 64 ns | 632 B | all | 1.5 ns | 7 ns |

`which-step.mjs`: 1 000 / 1 000 fast after `withAccessors`, 1 000 / 1 000 after the `Object.assign`
of the three methods, 1 / 1 000 after `$trivia` is defined with a new getter per node.

Real nodes at `69b821c18` (rust): 5 of 22 800 factory-built nodes have fast properties; 58 of the
1 120 wrapped nodes that carry `$trivia` in a parse of `engine.rs` do. The same built trees as
same-shape ordinary objects (own enumerable keys copied in order; projection output and rendered
text identical): `toTransportData` 0.33 µs per node against 1.55 µs; `engine.render` 0.96 µs
against 3.5 µs.

Two traps: the first node built after a forced collection always reads as fast (map transitions
are weak), so count over many nodes; and one read loop shared by several forms in one process
measures the order, not the form.

## `$trivia` as a nested literal, group seats and list views (added later the same day)

Quiet machine (load 6–8). `literal-members.mjs` and `list-and-seat.mjs` run one form per process and
assert each form's surface before timing; `enum-cost.mjs` and `real-list-cost.mts` as named.

```bash
for f in $(node --expose-gc --allow-natives-syntax list-and-seat.mjs); do node --expose-gc --allow-natives-syntax list-and-seat.mjs $f; done
for f in n13 n13idx n45 n45idx; do node --allow-natives-syntax enum-cost.mjs $f; done
pnpm exec tsx docs/superpowers/probes/2026-10-01-shared-arena/2026-10-01/real-list-cost.mts
```

| three-slot node | build | retained |
|---|---|---|
| today | 795 ns | 2 232 B |
| all in the literal, no `$trivia` | 33 ns | 888 B |
| `$trivia: { leading, trailing }` | 40 ns | 1 048 B |
| `$trivia: { leading, trailing, inner, innerAt }` | 44 ns | 1 176 B |
| one getter shared by all nodes, defined after the literal | 81 ns | 656 B |

| list owner, three items | build | retained | fast properties | own keys | length, `[1]`, `map` | `Object.entries` walk |
|---|---|---|---|---|---|---|
| today | 6 081 ns | 8 520 B | no | 8 | 124 ns | 2 313 ns |
| literal, a closure per array method | 310 ns | 2 928 B | yes | 45 | 17 ns | 847 ns |
| literal, naming array methods written once over its items | 123 ns | 1 200 B | yes | 45 | 14 ns | 838 ns |
| literal, naming the built-in array methods | 121 ns | 1 120 B | yes | 45 | 140 ns | 842 ns |
| literal, array members spread from one object | 633 ns | 1 152 B | yes | 45 | 134 ns | 855 ns |
| array members inherited from one object | 212 ns | 976 B | yes | 16 | 12 ns | 338 ns |

| group seat | build | retained | fast properties | read both fields |
|---|---|---|---|---|
| today | 1 443 ns | 3 008 B | no | 72 ns |
| all in the literal | 36 ns | 952 B | yes | 6 ns |

Key enumeration, literal-built objects: 13 named keys `Object.entries` 58 ns, `Object.keys` with a
prefix test 26 ns; 45 named keys 165 / 70 ns; 45 named keys and 3 index properties 1 006 ns
(`for…in` 683 ns) / 124 ns. Index properties take `Object.entries` and `for…in` off their fast path.

Real rust builders at `69b821c18`, run from source: `arguments(x, y, z)` 33.6 µs, the owner alone
12.2 µs, the empty owner 10.4 µs, `binaryExpression` from built children 3.05 µs. A built
`arguments` has 48 own properties and is in dictionary mode.

`$trivia(…)` called directly: 24 call sites in tests, one line in each of the rust, typescript and
python READMEs. Kinds with an inner gap (`INNER_GAPS` rows): rust 25, typescript 14, python 12.

## What the engine API wraps (added later the same day)

```bash
for c in $(node engine-wrap.mjs); do node engine-wrap.mjs $c; done                     # plain node, scopedBuild copied
pnpm exec tsx docs/superpowers/probes/2026-10-01-shared-arena/2026-10-01/engine-wrap-real.mts     # real rust engine
```

Per builder call, plain node, a three-slot builder with its members in the literal:

| | ns |
|---|---|
| the builder alone | 34 |
| inside `inEngine`, called directly | 36 |
| through the scoped table (a Proxy): `build.node(config)` | 78 |
| the same, builder held in a variable | 54 |
| `build.statement.node.strict(config)` | 131 |
| table scoped with plain functions, one or three hops | 46–48 |
| builders made with the handle | 36 |

Real rust engine at `69b821c18`, run from source: the Proxy adds 40–110 ns to a builder call of
0.8–2.9 µs; an `is` guard and `isNode` add 0–2 ns.

Render of built trees, per node: today 3.4 µs to text = `collectReaders` 1.54 + `toTransportData`
1.49 + the native call 0.56. The same data as same-shape objects: 0.90 µs = 0.10 + 0.24 + 0.54.
`engine.render` projects eagerly and returns a lazy handle; the native call happens on `toString`.
