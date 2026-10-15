# Grammar bindings wiring and the runtime bindings generator: implementation plan

**Specs:** the bindings spec (`2026-09-13-bindings-and-vocabulary-design.md`, §2.1 and §9) and the binding generator spec (`2026-10-06-binding-generator-design.md`). **Probes:** `docs/superpowers/probes/2026-10-10-contextual-alias/` and `docs/superpowers/probes/2026-10-10-placed-claims/`. **Earlier stages:** `2026-10-06-binding-generator.md`.

Three stages, in order. Each is one PR into `feat/bindings`, stacked on the one before. Every stage passes the standing gates:
- `validate:native` rows equal to the baseline on all five grammars, compared with `validate history`;
- the full unit suite, run as its own call;
- the cargo workspace (`cargo test --workspace --no-default-features`);
- workspace type-check and lint;
- `bindings-inventory --check`: bindings and vocabulary agree, and the unmapped count is at or below its ceiling (tightened when it falls);
- the Codex adversarial review, run before the PR opens, with each finding fixed or declined in the PR body.

Each stage starts with a census, sent to brainstorm before any code: the sites the stage changes, per grammar, and the inventory and validation numbers it is expected to move. A row that moves outside the census stops the stage for review.

## Where things are today

- `grammar.bindings.ts`, the grammar bindings, is generated and hash-checked for rust, typescript and python, but no `grammar.sittir.ts` passes it to `sittirGrammar` (`bindings:` is unset). The parser and the node model are upstream's plus the authored overrides: no renamed or split kind exists in any node model, and `renamedFrom` and `splitFrom` are never written.
- Route derivation runs against the unbound model. Claims resolve through kind renames (`bindFacts` maps base names to bound names) but not yet through field renames.
- `fieldAliasMap` (node model) holds a parser alias of a visible kind, the same table as `type_identifier` over `identifier`. Such an alias kind has no builder, wrap or transport.
- `formsOf` reaches a supertype's owned variants (`variantOf`). A split clone (`splitFrom`) is not yet a form.
- `modelNode` falls back from `kind` to `_${kind}`, and `routes.ts` strips `Modifier$` from member names. Both are name heuristics.
- The python docstring's `doc` path is unresolved: `simple_statements` is a site alias of `_simple_statements`, which only the `_${kind}` fallback finds.
- The inventory's unmapped ceiling is 56.
- The variant-claims change (a supertype claim reaches its owned variants) lands before stage 1, after the vocabulary branch (`feat/vocabulary-facts`) merges. Stage 1 needs that branch's `Flag`-typed members.

## Stage 1: a claim's path segment as a flag

§2.1: a path segment resolves to a kind or to one of its flags. Three facts are stated only by the claimed node's own kind, with no token to capture: python `@staticmethod` (an envelope) and rust's method with no receiver (a predicate), both `declaration.method.static`, plus `literal.number.integer.big` and `.imaginary` (atomic tokens; typescript's `big.hex`, `big.binary` and `big.octal` ride with `big`).

- **Census:** every claim whose last segment the vocabulary declares as a `Flag` on the parent path, per grammar, with the inventory rows it removes.
- **Change:** route derivation resolves such a segment to the parent path plus the flag. The read entry carries the flag, and the inventory stops requiring an interface for that segment. `codegen/src/bindings` (`derive`, `routes`) and the inventory.
- **Needs:** the vocabulary's `Flag`-typed members from `feat/vocabulary-facts`.
- **Gate:** the census's rows leave the inventory and no others move; validation identical.

## Stage 2: the grammar bindings reach the parser

Ruled: everything in the grammar bindings except kind renames reaches the parser (field renames, wraps, splits, merges and aliases, patches). Kind renames stay out, so low-level kind names stay upstream's and the portable layer maps them. Claims resolve through field renames as they do through kind renames.

**Census first:** per grammar, the grammar bindings' entries by type (field rename, wrap, split, alias, patch), the parse-state and `parser.c` deltas against the unbound build, and every validation row and generated file the bound build moves. The contextual-alias probe has the alias numbers (rust's splits: +0.65% STATE; python's class-body method: +0.60%; decorated: +0.73%).

### 2a. Translation gaps the bound build hits

Each gets its own red test before its fix:
- an inventory patch that fields a member inside a repeat (`field_initializer`'s `"0"`);
- the stale-resolutions message, which must name the bound grammar's conflicts;
- an options label re-addressed after a field rename, so the options block names the bound field;
- `BOXED_PAYLOADS` pins: 20 go stale and 22 are new under the bound build; regenerate the pin set from the bound model rather than editing it;
- `MethodDeclarationTransport`'s payload pin;
- portable read tests that name base fields and kinds (`left`, `decorator`), which must name the bound ones;
- the validators' same-span locator, which must also match a node's grammar kind.

### 2b. Wire the grammar bindings, minus kind renames

- `grammar.sittir.ts` passes the generated grammar bindings to `sittirGrammar` for each bound grammar; `bindGrammar` applies everything but `renames`.
- `bindFacts` maps field names through the grammar bindings' field renames, so claims and member routes resolve against the bound fields.
- **The receiver split** (bindings spec §9, "A receiver is no parameter"). The edit, its shape and every ruling on it are in the receiver-split probe, `docs/superpowers/probes/2026-10-12-receiver-split/README.md` ("The edit", "Proposal", "Questions"). In short:
  - A claim that anchors a parameter list's first element as `@receiver` derives a `lead` (the derivation is on `feat/bindings`); every owner captures the rest as `@parameters` against the grammar's own list.
  - `bindGrammar` applies the lead after the patches (`leadGrammar`). The lead mints its variants and the receiver form there, never in enrich.
  - The shape is the plain one: the plain list narrowed to the rest, and a receiver form holding the receiver and then the plain list, whose `,` and list enrich's group synthesis lifts into `<list>_<field>_group`.
  - Rust's typed `self` is a second claim beside `self_parameter`'s; the derivation unions the two claims' admits. A variant takes its name from the claim that classifies it, otherwise the variant convention's.
  - Rust's receiver and TypeScript's explicit `this` parameter are `declaration.parameter.receiver`; narrowed forms use the existing vocabulary's derived `receiver_parameter` name. The claims replace stage 1's interim `@_receiver`; every owner of a split list without a receiver claim needs one, or a `@dropped` line with its reason.
  - **Q-S15 supersedes receiver-probe Q22:** complete the authored enrich→wire layer first; the configured bindings layer computes a strict no-op enrich once and reuses the checked result, then wire applies binding edits. Do not enrich again after those edits. Receiver groups reuse the canonical wire/group primitive at minting, with no separate naming derivation. Automatic variant stamping runs in the shared DSL on the final grammar result.
  - The conflict driver derives the bound grammar's sets.
- **Gate:** validation rows equal to the unbound baseline, or each moved row named in the census and ruled.

### 2c. Contextual aliases

Ruled to be parser aliases at a context-unique site, with the ancestor clones kept and no target clone:
- rust's three context splits: `function_signature_item` → `signature_method_declaration` in a trait, and `function_item` → `method_declaration` in a trait and in an impl body. Today's grammar bindings derive only the two trait splits: the impl-body one went when rust's impl methods became claimed by a read test (receiver or not), an interim. Ruled: all three are aliases, so the impl-body alias comes back; the census confirms its cost. With the alias, `$type` says method, and the no-receiver read test only sets the `static` flag (stage 1);
- rust `crate` in `visibility_modifier` (`internal_public_visibility_modifier`), with no clones;
- python's method in a class body (five clones, `_suite` down to `_compound_statement`);
- python's decorated method in a class body (a second split within `decorated_definition`, reusing the first split's clones).

The aliases retire the interim placed claim that reads any decorated function in a python class body as `declaration.method`.

Each alias kind gets its own low-level builder beside the aliased kind's (`build.methodDeclaration` beside `build.functionItem`). Today `fieldAliasMap` emits none, so the node-model and factory emit change: an alias of a visible kind at a context-unique site is a kind with a builder, a wrap and a transport (`MethodDeclarationTransport`), not a field-alias row.
- **Census:** each alias site, its clones, and the per-grammar STATE and `parser.c` deltas, compared with the probe.
- **Gate:** every row passes; the deltas within the probe's numbers.

### 2d. Name heuristics resolved through the model

- `modelNode`'s `_${kind}` fallback resolves through the alias map instead: a site alias names its hidden rule by stamp, not by prefix.
- `routes.ts`'s `Modifier$` strip goes; the member name comes from the claim or the slot.
- **Census:** every lookup the fallback or the strip serves today, per grammar; each must resolve the same through the stamp or be named.

### 2e. Clones are forms

`formsOf` adds the kind's split clones (stamped `splitFrom`) to its supertype forms, so a base kind's claims reach its visible clones (bindings §9). Python's `decorated_definition` container claim (decorators to the element, `static` from `@staticmethod`) then reaches `decorated_definition_class_declaration`.
- **Census:** each clone, its base, and the members it gains.

### 2f. The docstring path

The python docstring's `doc` member resolves through the `_simple_statements` site alias (2d) instead of stopping at `simple_statements`.
- **Gate:** the `doc` path resolves for `function_definition` and `class_definition`, and the unbuildable-routes list loses `class_definition.doc` and `function_definition.doc`.

## Stage 3: the runtime bindings generator

The runtime bindings are what the portable engine runs, generated per grammar from the routes. The vocabulary's mapped types (owner × value crossings, per-kind flag unions) are authored in the vocabulary, not generated here.

- Honor the authored numeric and boolean scalar value contracts in high-to-low runtime builds and built-node crossings, through the [scalar-contract follow-up](2026-10-06-binding-generator.md#follow-up-high-to-low-runtime-scalar-bindings-october-15) in the generator plan.
- `build`, `is` and `kinds` per vocabulary path, keyed by `$type`;
- the builder-chain steps and their guards: an `is` guard per segment carries the segment's read test and its flag bits;
- each language's `$exclusions`: per kind, the flag pairs the grammar never spells together, derived from the rule by the generator, not declared by the vocabulary. The vocabulary's mapped types read them for the typed chains, so after a step the incompatible steps are gone, and the runtime check refuses a structure whose `$flags` break them;
- the flags runtime object imported from the vocabulary (`packages/types/src/vocabulary/flags.ts`, written by `bindings-inventory --write`), never emitted here; its member names are spelled through `tsname`, so the two agree by construction.

- **Census:** per grammar, the build, `is` and `kinds` entries and the flags each guard tests, compared with the routes.
- **Gate:** the portable type-check ratchet (per-grammar error count) only falls, and every generated guard agrees with the routes' read tests on the existing `is` tests.
