# Shared-arena probes

The measurements and prototypes behind `docs/superpowers/specs/2026-10-01-shared-arena-design.md`,
kept with the design as a record. Nothing here is built, linted, tested or type-checked with the
repo: `oxlint.config.ts`, `.prettierignore` and `vitest.config.ts` exclude this folder, no tsconfig
includes it, and each Cargo crate in it is its own workspace, outside the repo's. `.gitignore` keeps
build output (`target/`), native binaries (`*.node`), lockfiles and generated sources out.

| folder | measured at | what it holds |
| --- | --- | --- |
| `2026-10-01/` | master `69b821c18` (2026-10-01) | The boundary baseline and feasibility probes behind the first draft (a tree image and a transport arena): boundary stages, rebuilt render, profiles, the `arena-proto` tree-image prototype with its view and encoder, and the construction and node-member probes that the draft's revisited rulings rest on. |
| `transport/` | master `106475358` (2026-10-04 and 2026-10-05); `measure-heap.mts` also at `69b821c18` | The refresh for typed transports: the baseline re-taken on the same inputs, the like-for-like heap probe, the transport-macro probe (`proto/`), the compile-cost probes and the `transport.rs` census. |
| `codec/` | master `40b211bce` and `992c9b4c6` (2026-10-06) | The codec census behind the typed reader's 1b: what each hand-printed napi decoder accepts against the read facts its declaration states. |
| `stack/` | master `40b211bce` and `992c9b4c6` (2026-10-06) | The size census behind the typed reader's stack gate: every transport type's size, and the choice payloads over each ceiling. |

Each folder's README lists its tools, the commands that reproduce its numbers, and the results.

## Running

- Run a script from the root of a checkout at the commit it was measured at, with that checkout's
  natives built. A script measures the checkout in `SITTIR_ROOT`, or else the current directory.
- The Cargo crates (`2026-10-01/arena-proto/`, `transport/proto/`) build on their own with
  `CARGO_TARGET_DIR=$PWD/target`. Copy the checkout's `Cargo.lock` into `transport/proto/` to build
  offline. `transport/proto/time-synthetic.sh` writes `transport/proto/synthetic/src/kinds.rs` for each
  expansion it times.
- `transport/inputs/` holds the files the 2026-10-01 numbers were taken on, copied so that only the
  code changes between runs.
