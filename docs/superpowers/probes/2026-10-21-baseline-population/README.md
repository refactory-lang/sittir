# Baseline population and wrapper departure

Measured on 2026-10-21 with the existing native builds, without regenerating or changing either checkout. Base is `a8b11f84d` and the form-guard/flattening head is `7d393d097`.

## Fresh collection

`pnpm exec tsx packages/tools/src/scripts/collect-baseline.ts` was run independently in each checkout.

| Collection | pass | total | total minus pass |
| --- | ---: | ---: | ---: |
| Committed native baseline, last refreshed at `bb990eee6` | 26635 | 26638 | 3 |
| Fresh base | 26695 | 26699 | 4 |
| Fresh head | 26617 | 26621 | 4 |

All base-to-head differences are in Python. Every other grammar's validator and replay counters are identical.

| Python lane | base pass/total | head pass/total |
| --- | --- | --- |
| coverage | 149/149 | 148/148 |
| from | 180/180 | 179/179 |
| factory storage | 1404/1404 | 1385/1385 |
| built render/parse | 2685/2685 | 2647/2647 |
| fixture replay | 3840/3840 | 3821/3821 |
| read/render/parse | 115/116 | 115/116 |

The generated Python fixture inventories differ only in the departure of 19 `render` and 19 `roundtrip` fixtures whose pattern is `match_block`. Fixture replay counts the render fixtures. The two construction surfaces account for the 38 built-render cases. The serialized validation reports have 72 rows on each side, with zero added or removed rows when compared as multisets of canonical JSON records.

## The apparent additional failure predates this head

TypeScript's fresh read/render/parse result is `pass=116, total=119, fail=0, skip=3`, with no errors or AST mismatches. The skipped entries are:

- Object types with automatic semicolon insertion
- Interface declarations
- Literal types

The collector's aggregate subtracts pass from total, so it includes those skips. The stale baseline records TypeScript as 116/118 instead of 116/119. All other base-to-current-master validator pass counts stay level or rise.

The original committed parser WASM binaries were replayed against the same `Literal types` input. On master's first-parent history, `c0dbac263^` accepts it and `c0dbac263` rejects it. Both later parser-changing merges, `6bf9fcc6b` and `12f517270`, retain the rejection. The entry contains `let x: 2 | -3 | +4`; the narrowing rejects the plus sign in a type position. The local compensation was already added at `b03fad976`: the same shapes with `-4`, with its own validation evidence in that commit. No corpus row or baseline was changed during this investigation.

## One population for validation and the baseline

`deriveRuleKinds` is the render-body catalog used by read/render/parse, factory storage, and the corpus-coverage census. Its base/head populations are:

| grammar | base | head |
| --- | ---: | ---: |
| Python | 163 | 162 |
| regex | 31 | 31 |
| Rust | 227 | 227 |
| scm | 23 | 23 |
| TypeScript | 223 | 223 |

The node model instead counts Python as 306 on both sides: `match_block` becomes `_match_block`, a supertype row. The collector now consumes the existing catalog rather than counting node-model rows. A `kindCountBasis` stamp prevents subtraction across the two populations during migration. Recollection with the catalog changed only the five kind counts; every validator and replay metric remained identical.

## Remaining ratchet work

This population correction does not make the baseline check pass. Against a fresh base, one departed Python kind explains the one-per-kind coverage and from losses, but the existing average-case allowance is too small for this wrapper's actual 19 construction cases and 38 built-render cases. Fixture replay has no departure allowance. Against the committed baseline, the stale aggregate also fails first.

The next tooling change needs exact per-kind case inventories and a same-population comparison, including replay fixtures. Raising the average allowance or refreshing the head baseline would hide these limitations. No allowance, ceiling, committed baseline, generated parser, or validator was changed here.
