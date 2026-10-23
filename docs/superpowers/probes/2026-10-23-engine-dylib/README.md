# Shared engine library probe

Probe branch `probe/engine-dylib`. It does not merge. It builds the shape the
maintainer chose for native packaging: one Rust `dylib`, `sittir-engine`,
that every grammar addon links at run time, shipped as a copy inside each
grammar package beside its `.node`, with the OS loader reusing the first copy
it maps. Each section below states what was shown, on which platforms, and
where the evidence is.

## Summary

<!-- SUMMARY -->

## The shape question: what can live in the shared library

The maintainer's shape put sittir-core and the tree-sitter runtime in the
library. The probe built shape A instead, and the choice between A and B is
open:

- **A (built):** the library holds the tree-sitter runtime (the Rust crate and
  its C code), the statics a process must hold once (the tree-id counter, the
  build stamp, the runtime's allocator slots) and nothing else. sittir-core,
  napi and the generated code stay in each addon, as today.
- **B:** sittir-core goes in the library too, without its napi boundary, which
  moves into each addon.

### Why napi cannot be in the library

napi-rs keeps its export and class registries in process-global statics of
the `napi` crate (`MODULE_REGISTER_CALLBACK`, `MODULE_CLASS_PROPERTIES`, and a
per-thread constructor map keyed by JavaScript class name), and defines
`napi_register_module_v1` there. sittir-core's napi bindings call napi, so
sittir-core with its bindings in the library puts napi there, with one
registry for every grammar.

The toy `spikes/napi-shared` reproduces it: napi in a shared library, and two
addons that each export a class named `SittirEngine`, a function `make()` that
builds one on the Rust side, and a method that says which addon's code ran on
which addon's object. Loaded A then B:

<!-- NAPI-COLLISION -->

### What B would save on top of A

<!-- B-SAVING -->

### What B would cost

sittir-core's napi boundary is in 13 files, about 560 lines that name napi on
master and about 650 on `feat/records`. Most of it is trait impls on core
types:

- 16 generic impls of napi's `FromNapiValue`/`ToNapiValue` on core carriers:
  `SlotValue<T>`, `NodeLayout<T>` and `Box<NodeLayout<T>>`, `UnitSides<T>`,
  `TriviaEntry<T>`, `NodeTrivia<T>`, `Options<S>`, `NonEmptyVec<T>`;
- about 20 concrete impls: `Span`, `Source`, `Point`, `PointSpan`,
  `SlotLayout`, `LayoutWork`, `StoredLayout`, `ChangedEdges`, `TriviaText`,
  `VerbatimNode`, `ErrorRead` and the id newtypes;
- the `boundary.rs` property helpers and the non-generic helpers
  `napi_engine!` expands calls to.

With napi out of the library, these impls have to leave sittir-core, and the
orphan rule allows a foreign trait's impl only in the trait's crate or the
type's. So the generic impls cannot move to another crate as they are, nor
into generated grammar code (`SlotValue<AnyNode>` is not a local type). B
therefore needs one of: the carrier types move out of the shared core into a
per-addon crate (and the core logic that uses them with them), or a local
boundary newtype per carrier, threaded through the generated codecs and
`sittir-node-macros`. Either way it rewrites `slot.rs`, `layout.rs`,
`trivia.rs`, `options.rs`, `verbatim.rs`, `boundary.rs`, `napi_engine.rs` and
the node macros' codec expansion. `feat/records` changes every one of those
files (`git diff --stat origin/master...origin/feat/records`): napi_engine
335 lines, layout 363, slot 80, boundary 37, trivia 17, verbatim 12, options
11, and about 2,100 lines across `sittir-node-macros`. Its new `arena/`
modules name napi nowhere, so the arena itself could sit in a shared core.

## Proofs

<!-- PROOFS -->

## Measurements

<!-- MEASUREMENTS -->

## What the real migration has to carry

<!-- CARRY -->

## Reproducing

<!-- REPRO -->
