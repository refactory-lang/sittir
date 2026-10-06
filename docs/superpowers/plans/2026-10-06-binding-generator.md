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
- The vocabulary under `packages/types/src/vocabulary/` is authored. A member is typed by its sole role, its vocabulary refs or its scalar, and otherwise by its entry in the context slot table, `G['slots']['<kind path>']['<member>']`. `BaseContext` fills each entry with roles, refs or `string`. The inventory's `--check` reports where the vocabulary and the bindings disagree, and they agree everywhere.
- The bindings reader (`readBindings`, `inventory/bindings.ts`) and the derivation (`derive`, and the member classification `slotEntries` and `soleRole`, `inventory/derive.ts`) live in `packages/tools`, and read `bindings.scm` through the workspace `@sittir/scm`. `packages/codegen` cannot import `packages/tools`.
- `bindings.scm` exists for rust, typescript and python.
- The query facet's plan form is `QueryPlan` (`@sittir/types`), evaluated by `holds` in `packages/common/src/query.ts`.
- The form and subtype routing for kinds with no bare factory lives in `packages/tools/src/validate/common.ts` (`buildFactoryNodeFromReference` over the `ir` surface).
- Probe, rust: 191 read entries, 174 build entries, 133 of 374 members rejected by the vocabulary, with the probe filling rust's context (each role's keyword text and the slot table) from rust's own derivation.

## How codegen gets the bindings facts (decided)

The generator runs inside the codegen pass that writes `types.ts`, and reading `bindings.scm` needs the scm parser. No generation may depend on the workspace `@sittir/scm`, so that a change which breaks `@sittir/scm` can never break regenerating the fix.

- **A committed facts artifact,** `packages/<grammar>/.sittir/bindings.json`: the facts read from `bindings.scm`, keyed by a hash of its text together with the facts and derivation version.
- The inventory reads `bindings.scm` through `@sittir/scm` and writes the artifact.
- Codegen reads only the artifact. It refuses a stale one (a key that does not match `bindings.scm` and the current version) with a diagnostic naming the command that regenerates it.
- The facts schema and the derivation live in codegen, and the inventory calls them, so there is one derivation.
- Codegen stays out of the scm engine's bootstrap: regenerating `@sittir/scm` reads its own committed artifact.
- Not a pinned scm reader in codegen: that would be a second reader and a second derivation.

## The rejected members: the rule

**A grammar's portable module ships only at zero rejected members.** The generated module is type-checked with its package, so a rejected member is a compile error in the package. Until a grammar reaches zero:
- its portable module is not emitted into the package;
- its rejection count, sorted by cause (the probe's `conformance.py`, promoted to `sittir tool portable-conformance`), is a ratchet that only falls.

Stage 3 drives the count to zero for each cause on the side that owns it. Rust is first, then typescript and python.

## Stage 0: lock the vocabulary (landed)

- The emitter was cleaned up first and the vocabulary regenerated:
  - `$kind` on every interface, holes included;
  - a flat `SubKindOf` with no `Simplify`;
  - grammar-neutral member types through the context slot table.
- Then the vocabulary files lost their "Generated" banner and became authored, and the inventory's emitter and `--emit` were removed.
- `--check` reads the vocabulary structurally and reports where it and the bindings disagree: a claimed path no interface has as its `$kind`, a routed member, pinned field or template hole its interface does not declare. They agree everywhere; the ceiling records none.
- A grammar's context is filled by the type maps (stage 4); until then the probe fills rust's from its own derivation.

## Stage 1: bindings facts reach codegen

- The facts schema and the derivation move into `packages/codegen/src/bindings/`, as pure functions of the facts and the slot model. `readBindings` stays in the inventory, since it parses `bindings.scm` through `@sittir/scm`, and the inventory writes the artifact. Codegen reads only the artifact, and refuses one whose hash does not match `bindings.scm`, naming the command that regenerates it.
- The facts keep two things they drop today:
  - a predicate claim's predicate (operator, capture, argument), so a read entry can test it and a build entry can pin it;
  - a presence member's token text, so a capture named otherwise than its token (`"async" @isAsync`) still has a route.
- Gate: the inventory's report is byte-identical; the artifacts are committed for rust, typescript and python; unit tests pin the two new facts (`#eq? @name "__init__"`, `"async" @isAsync`) and the stale-artifact refusal.

## Stage 2: one route resolution

- `derive` produces routes: read entries most specific first, member routes, container unwraps, and their build inverses. The inventory folds routes into member types; the generator prints them.
- The form and subtype routing for kinds with no bare factory moves from `packages/tools/src/validate/common.ts` into codegen as a fact both read. The `ir-render-parse` lane then builds through the moved rule.
- Gate: the inventory's report is byte-identical, and the `ir-render-parse` rows are equal.

## Stage 3: conformance to zero (rust first)

The causes the probe reports, each on the side that owns it:

| cause | count | stage-3 change |
| --- | --- | --- |
| kind | 97 | A primitive type token read as `type.primitive` where the slot admits its const string. The enum-read rule is a routing fact, defined once in the shared route resolution: a token that is a value of a claimed enum reads as the enum's kind where the slot admits that enum, and as its const string otherwise. The conformance count reads through it. |
| predicate | 13 | A member that admits a kind admits all its claims (vocabulary). |
| unmapped | 12 | Each unmapped grammar kind gets a claim (bindings): onto an existing vocabulary kind, or onto a kind a feature adds to the vocabulary when none fits. |
| untyped reader | 6 | The readers typed `unknown` get types (codegen typed surface). |
| refinement | 3 | In the authored vocabulary, a level's `$kind` admits every path beneath it. |
| token text | 1 | `parameter.name` reads keyword text (`'default'`) where rust's fill holds only its unmapped `rust:pattern` marker; it is cleared by the unmapped row's claim for `rust:pattern`. |
| absent | 1 | Requiredness carries through containers (vocabulary projection). |

- `sittir tool portable-conformance <grammar>` (the probe's tools, promoted) reports the count and causes.
- The enum-read rule has unit tests: `i32` in an expression slot reads as `'i32'`, and in a type slot as `type.primitive`; `bool` in a slot that admits both reads as the enum.
- Gate: rust's count is 0. Typescript's and python's are recorded as their ratchet baselines.

## Stage 4: type maps beside the low-level ones

- `ViewForm` lives in `@sittir/types`.
- The types emitter writes `Ctx`, `VocabViews`, `ViewByKind`, `ViewOf`, `EnumViewByKind`, `ViewEnumOf` and `Backward` into a zero-conformance grammar's `types.ts`, beside `ParsedByKindId`.
- Gate: the workspace type-check, timed before and after with the same command, does not regress beyond noise; generated-output drift is clean.

## Stage 5: read (the portable `parse` and `render`)

- A generated `portable.ts` per zero-conformance grammar:
  - node literal factories, with `$type` as the only data member and every member a closure;
  - the dispatch: placed claims through the enclosing kinds a parent passes down, predicate claims on the captured node's text, an enum value read by stage 3's enum-read rule;
  - a varying leaf's `$value`, and a fixed literal as its const string.
- `createEngine(lang, { api: 'portable' })` is accepted. `parse` reads portable nodes, and `render` renders one by dispatching on `$type`. The engine reaches a portable node's low-level node through a module-private symbol, never a public member.
- Gate:
  - the dispatch reads an enum token by calling stage 3's enum-read rule, the same function the conformance count uses; no second rule;
  - a read lane: every node of the corpus reads through the portable engine with no throw, and every member call returns;
  - rendering a parsed portable root equals the low-level render.

## Stage 6: build

- Build entries per vocabulary kind, through `call(factory, input)` and the stage-2 routing for kinds with no bare factory.
- The portable `build` is typed per kind from the vocabulary; the low-level generic build is keyed by `$type`.
- A portable round-trip lane joins `validate:native`: parse with the portable engine, build every node again from its members, render, and parse-equal over the corpus.
- Gate: the existing rows are equal; the new lane's row is recorded as its baseline.

## Stage 7: crossing

- `attach` on both engines, overload-typed from `Backward`, `ViewByKind` and the build map.
- A parsed node is re-wrapped from its row with no reparse; a built node is rebuilt.
- A node bound to the engine is returned as is; one bound to another engine of the same surface is re-wrapped or rebuilt.
- Gate, as tests: a parsed node attached to the other engine is re-wrapped with no reparse and renders the same text; a built node attached is rebuilt and renders the same text; attaching a low-level node of a kind that does not cross on its own is a type error; attaching a node to its own engine returns it.

## Stage 8: role tests

- `is.<role path>`, compiled from the read entries under the path into a kind set plus a `QueryPlan`, evaluated with `holds`.
- Overloads narrow a grammar node to the row's grammar types and a portable node to the vocabulary interface.
- Gate: `is.<role path>` holds for exactly the nodes whose read entries classify them under the path, on both surfaces, and tells `identifier` from `type_identifier` where their roles differ; the narrowing is checked at compile time.
