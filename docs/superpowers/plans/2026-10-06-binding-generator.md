# Binding generator: implementation plan

**Spec:** `docs/superpowers/specs/2026-10-06-binding-generator-design.md`, over the bindings spec (`2026-09-13-bindings-and-vocabulary-design.md`). **Probe:** `docs/superpowers/probes/2026-10-06-binding-generator/`.

Each stage is one PR off the previous one, with its own gate. Every stage also passes the standing gates:
- `validate:native` rows equal to the baseline on all five grammars;
- the full unit suite;
- the cargo workspace;
- type-check of the workspace and `examples/`;
- lint on touched files;
- every Copilot comment answered.

No stage touches `packages/common/src/transport-data.ts` or the native reader; the typed reader owns them.

## Where things are today

- `ApiSurface` is reserved (`'default' | 'strict' | 'portable'`, `packages/types/src/engine-api.ts`); `createEngine` refuses `api: 'portable'` (`refuseUnimplemented`), and `BuildSurface<…, 'portable'>` is `never`.
- The vocabulary under `packages/types/src/vocabulary/` is still generated: each file opens with "Generated from the grammars' bindings.scm and slot models", written by the inventory (`packages/tools/src/inventory/emit.ts`).
- The bindings reader (`readBindings`, `inventory/bindings.ts`) and the derivation (`derive`, `inventory/derive.ts`) live in `packages/tools`, and read `bindings.scm` through the workspace `@sittir/scm`. `packages/codegen` cannot import `packages/tools`.
- `bindings.scm` exists for rust, typescript and python.
- The query facet's plan form is `QueryPlan` (`@sittir/types`), evaluated by `holds` in `packages/common/src/query.ts`.
- The form and subtype routing for kinds with no bare factory lives in `packages/tools/src/validate/common.ts` (`buildFactoryNodeFromReference` over the `ir` surface).
- Probe, rust at `f4a78b7fb`: 190 read entries, 173 build entries, 142 of 374 members rejected by the vocabulary.

## Decision needed before stage 2

**How codegen gets the bindings facts.** The generator runs inside the codegen pass that writes `types.ts`, and reading `bindings.scm` needs the scm parser. The bindings spec's §5.3 requires a pinned `@sittir/scm` build, so that regenerating `@sittir/scm` never depends on the workspace copy. Options:

- **(a) A committed facts artifact.** The inventory writes `packages/<grammar>/.sittir/bindings.json` (the resolved facts, with a hash of `bindings.scm`), and codegen reads only that file. Codegen never runs scm; a stale artifact (hash mismatch) is a codegen diagnostic. Regenerating `@sittir/scm` reads its own committed artifact, so there is no bootstrap cycle.
- **(b) A pinned reader in codegen:** codegen loads a pinned build of `@sittir/scm` and reads `bindings.scm` itself. This needs the pinned bootstrap first.

Recommended: (a). It meets §5.3's intent (no generation depends on the workspace `@sittir/scm`) with no new build machinery, and the artifact is the same kind of stamped input as `.sittir/src/grammar.json`.

## The rejected members: the rule

**A grammar's portable module ships only at zero rejected members.** The generated module is type-checked with its package, so a rejected member is a compile error in the package. Until a grammar reaches zero:
- its portable module is not emitted into the package;
- its rejection count, sorted by cause (the probe's `conformance.py`, promoted to `sittir tool portable-conformance`), is a ratchet that only falls.

Stage 3 drives the count to zero for each cause on the side that owns it. Rust is first, then typescript and python.

## Stage 0: lock the vocabulary

- The vocabulary files lose their "Generated" banner and become authored.
- The inventory's `--emit` stops writing them. `--check` reports where the bindings and the vocabulary disagree (bindings spec §10), as it does for every other diagnostic.
- Gate: the inventory's check passes with the same report as before; no generated-output drift.

## Stage 1: bindings facts reach codegen

- `readBindings` and the derivation move into `packages/codegen/src/bindings/` as pure functions of the facts and the slot model; the inventory imports them.
- The facts keep two things they drop today (spec §3):
  - a predicate claim's predicate (operator, capture, argument);
  - a presence member's token text.
- The facts artifact or pinned reader follows the decision above.
- Gate: the inventory's report is byte-identical; unit tests pin the two new facts (`#eq? @name "__init__"`, `"async" @isAsync`).

## Stage 2: one route resolution

- `derive` produces routes: read entries most specific first, member routes, container unwraps, and their build inverses. The inventory folds routes into member types; the generator prints them.
- The form and subtype routing for kinds with no bare factory moves from `packages/tools/src/validate/common.ts` into codegen as a fact both read. The `ir-render-parse` lane then builds through the moved rule.
- Gate: the inventory's report is byte-identical, and the `ir-render-parse` rows are equal.

## Stage 3: conformance to zero (rust first)

The causes the probe reports, each on the side that owns it:

| cause | count | stage-3 change |
| --- | --- | --- |
| token text | 74 | The generator reads a fixed literal as its const string (stage 4's reading). Re-measured once the probe follows it; what remains is the low-level types narrowing aliased keyword tokens, or the member admitting them. |
| text leaf | 33 | A varying leaf is a node carrying `$value`; members admit it (vocabulary). |
| predicate | 13 | A member that admits a kind admits all its claims (vocabulary). |
| unmapped | 10 | Claims complete onto existing kinds or a feature's (bindings, vocabulary). |
| untyped reader | 6 | The readers typed `unknown` get types (codegen typed surface). |
| refinement | 3 | The bindings spec's §3.4 kind rule in the authored vocabulary. |
| extra member | 2 | A feature adds the member, or the binding drops it. |
| absent | 1 | Requiredness carries through containers (vocabulary projection). |

- `sittir tool portable-conformance <grammar>` (the probe's tools, promoted) reports the count and causes.
- Gate: rust's count is 0. Typescript's and python's are recorded as their ratchet baselines.

## Stage 4: type maps beside the low-level ones

- `ViewForm` lives in `@sittir/types`.
- The types emitter writes `Ctx`, `VocabViews`, `ViewByKind`, `ViewOf`, `EnumViewByKind`, `ViewEnumOf` and `Backward` into a zero-conformance grammar's `types.ts`, beside `ParsedByKindId`.
- Gate: the workspace type-check, before and after with the same command, does not regress beyond noise (bindings spec §10.13); generated-output drift is clean.

## Stage 5: read (the portable `parse` and `render`)

- A generated `portable.ts` per zero-conformance grammar:
  - node literal factories, with `$type` as the only data member and every member a closure;
  - the dispatch: placed claims through the enclosing kinds a parent passes down, predicate claims on the captured node's text, the slot deciding an enum value;
  - a varying leaf's `$value`, and a fixed literal as its const string.
- `createEngine(lang, { api: 'portable' })` is accepted. `parse` reads portable nodes, and `render` renders one by dispatching on `$type`. The engine reaches a portable node's low-level node through a module-private symbol, never a public member.
- Gate:
  - a read lane: every node of the corpus reads through the portable engine with no throw, and every member call returns;
  - rendering a parsed portable root equals the low-level render.

## Stage 6: build

- Build entries per vocabulary kind, through `call(factory, input)` and the stage-2 routing for kinds with no bare factory.
- The portable `build` is typed per kind from the vocabulary; the low-level generic build is keyed by `$type`.
- A portable round-trip lane joins `validate:native` (bindings spec §10.7): parse portable, build every node from its members, render, parse-equal.
- Gate: the existing rows are equal; the new lane's row is recorded as its baseline.

## Stage 7: crossing

- `attach` on both engines, overload-typed from `Backward`, `ViewByKind` and the build map.
- A parsed node is re-wrapped from its row with no reparse; a built node is rebuilt.
- A node bound to the engine is returned as is; one bound to another engine of the same surface is re-wrapped or rebuilt.
- Gate: the crossing checks of bindings spec §10.14, as tests.

## Stage 8: role tests

- `is.<role path>`, compiled from the read entries under the path into a kind set plus a `QueryPlan`, evaluated with `holds`.
- Overloads narrow a grammar node to the row's grammar types and a portable node to the vocabulary interface.
- Gate: the checks of bindings spec §10.15, including `identifier` against `type_identifier`, at runtime and at compile time.
