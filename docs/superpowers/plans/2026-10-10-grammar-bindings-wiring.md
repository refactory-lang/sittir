# Grammar bindings wiring and the runtime bindings generator: implementation plan

**Specs:** the bindings spec (`2026-09-13-bindings-and-vocabulary-design.md`, §2.1 and §9) and the binding generator spec (`2026-10-06-binding-generator-design.md`). **Probes:** `docs/superpowers/probes/2026-10-10-contextual-alias/` and `docs/superpowers/probes/2026-10-10-placed-claims/`. **Earlier stages:** `2026-10-06-binding-generator.md`.

Four stages, in order. Each is one PR into `feat/bindings`, stacked on the one before, except stage 4: its two PRs land where it places them. Every stage passes the standing gates:
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

A derived kind rename whose target is an existing kind or display name is a merge, not a rename: typescript's `private_property_identifier` → `property_identifier` targets the display kind an alias already names, and applying it would fold privateness (a flag fact) into the plain kind. Whatever applies kind renames refuses or reports such an entry under the merge rules and the shape guard (`sameShapeAs`), and never applies it as a plain rename.

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

- `grammar.sittir.ts` passes the generated grammar bindings to `sittirGrammar` for each bound grammar; `bindGrammar` applies everything but `renames` and `splits`. Rust passes its bindings with `splits: []`: a split turns on only together with the claim-following that keeps its base kind's claims reading on the split kind (2c with 2e).
- `bindFacts` maps field names through the grammar bindings' field renames, so claims and member routes resolve against the bound fields.
- **The receiver split** (bindings spec §9, "A receiver is no parameter"). The edit, its shape and every ruling on it are in the receiver-split probe, `docs/superpowers/probes/2026-10-12-receiver-split/README.md` ("The edit", "Proposal", "Questions"). In short:
  - A claim that anchors a parameter list's first element as `@receiver` derives a `lead` (the derivation is on `feat/bindings`); every owner captures the rest as `@parameters` against the grammar's own list.
  - `bindGrammar` applies the lead after the patches (`leadGrammar`). The lead mints its variants and the receiver form there, never in enrich.
  - The shape is the plain one: the plain list narrowed to the rest, and a receiver form holding the receiver and then the plain list, whose `,` and list enrich's group synthesis lifts into `<list>_<field>_group`.
  - Rust's typed `self` is a second claim beside `self_parameter`'s; the derivation unions the two claims' admits. A variant takes its name from the claim that classifies it, otherwise the variant convention's.
  - Rust's receiver and typescript's `this_parameter` are `declaration.parameter.receiver`. The claims replace stage 1's interim `@_receiver`; every owner of a split list without a receiver claim needs one, or a `@dropped` line with its reason.
  - The lead is applied only once enrich is a fixpoint: enrich then runs again over every rule a bindings edit creates, as their stamps name them.
  - The conflict driver derives the bound grammar's sets.
- **Gate:** validation rows equal to the unbound baseline, or each moved row named in the census and ruled.

### 2c. Contextual aliases

**2c and 2e land as one change.** A split turns on only with the claim-following that keeps its base kind's claims reading on the split kind: once the parser emits `method_declaration` where it emitted `function_item`, every `declaration.method` read keyed on `function_item` reads false until claims follow the split (2e). The `static` claims below also read the split kinds and, for python, the class-body clone. So the aliases, the clone projection (2e), the `variantOf` repair and one split per site ship together, behind one census and one gate.

Ruled to be parser aliases at a context-unique site, with the ancestor clones kept and no target clone:
- rust's three context splits: `function_signature_item` → `signature_method_declaration` in a trait, and `function_item` → `method_declaration` in a trait and in an impl body. Today's grammar bindings derive only the two trait splits: the impl-body one went when rust's impl methods became claimed by a read test (receiver or not), an interim. Ruled: all three are aliases, so the impl-body alias comes back; the census confirms its cost. With the alias, `$type` says method, and the no-receiver read test only sets the `static` flag (stage 1);
- rust `crate` in `visibility_modifier` (`internal_public_visibility_modifier`), with no clones;
- python's method in a class body (five clones, `_suite` down to `_compound_statement`);
- python's decorated method in a class body (a second split within `decorated_definition`, reusing the first split's clones).

The aliases retire the interim placed claim that reads any decorated function in a python class body as `declaration.method`.

**Planned with the aliases: typescript's constructor as a kind.**
- typescript's `bindings.scm` claims the constructor by a predicate today: `((method_definition name: (property_identifier) @name) @declaration.constructor (#eq? @name "constructor"))`. It becomes a kind of its own.
- In a class body, a member whose name is the token `constructor` is its own rule, authored in typescript's `grammar.sittir.ts` at the class-body site. Object-literal methods keep `method_definition`, since a method named `constructor` there is an ordinary method. The claim then names the kind, and `$type` decides it.
- It lands with the aliases because the claim and the read test change together.
- The builder contexts depend on it. A member modifier is permitted in the constructor's parameters and in no other function's, and until this kind exists the `Visibility` table has to provide at every method's parameters (builder contexts spec, §11).
- **Census:** the STATE and `parser.c` deltas, and every read of `declaration.constructor` and `declaration.method`.
- **Gate:** reads classify the same.

**`static` reads from the method's own node.** Today both `static` facts come from context: rust's from a placed claim in an impl body with a per-parameter `#not-kind-eq?`, and python's from the parent `decorated_definition`'s decorator. With the aliases, each is read from the method's own node, or, for python, from the envelope the portable method is read through. The aliases' claims replace the placed ones:
- **rust** (also needs 2b's receiver form): a method or method signature whose parameter list is not the receiver form is static. The per-parameter test misses a typed `self` (`self: Box<Self>`), which 2b moves into the receiver form.
  ```
  ((method_declaration (parameters (_)? @_list)) @declaration.method.static (#not-kind-eq? @_list "parameters_elements_receiver"))
  ((signature_method_declaration (parameters (_)? @_list)) @declaration.method.signature.static (#not-kind-eq? @_list "parameters_elements_receiver"))
  ```
- **python**: the flag is captured on the class-body clone, the envelope of the decorated method:
  ```
  ((decorated_definition_class_declaration (decorator (identifier) @static) definition: (method_declaration) @element) (#eq? @static "staticmethod"))
  ```
  A container's captures go to every kind its element slot names, and the clone's `definition` admits `class_declaration` too, which has no `static`. So derivation must give a capture only to the kind the claim's element pattern names. That is the one new mechanism, and it lands with this stage.
- **Claim-level flags reach the read model.** Today `resolveFlags` resolves a claim whose last segment is a flag, but nothing downstream reads `claim.flag`. Such a flag reaches neither the read entries nor the members, so the portable surface and `c.is` cannot answer it. This stage carries a claim's flag into its read entry and the kind's flag table, as a member capture's flag already is, so both `static` claims above are answered node-locally.
- **Gate:** every read the placed claims gave classifies the same, except that a typed-`self` method is no longer static. The `is` tests cover both grammars' static and non-static methods, and rust's static trait signature.

Each alias kind gets its own low-level builder beside the aliased kind's (`build.methodDeclaration` beside `build.functionItem`). Today `fieldAliasMap` emits none, so the node-model and factory emit change: an alias of a visible kind at a context-unique site is a kind with a builder, a wrap and a transport (`MethodDeclarationTransport`), not a field-alias row.
- **Census:** each alias site, its clones, and the per-grammar STATE and `parser.c` deltas, compared with the probe.
- **Gate:** every row passes; the deltas within the probe's numbers.

### 2d. Name heuristics resolved through the model

- `modelNode`'s `_${kind}` fallback resolves through the alias map instead: a site alias names its hidden rule by stamp, not by prefix.
- `routes.ts`'s `Modifier$` strip goes; the member name comes from the claim or the slot.
- **Census:** every lookup the fallback or the strip serves today, per grammar; each must resolve the same through the stamp or be named.

### 2e. Clones are forms

Lands with 2c (see there). `formsOf` adds the kind's split clones (stamped `splitFrom`) to its supertype forms, so a base kind's claims reach its visible clones (bindings §9). `splitFrom` reaches `ModelNode` (the node model serializes it; `slotModelOf` drops it today), and the one `formsOf` expansion covers the physical clones and the ancestor contexts a read entry's `within` names. Python's `decorated_definition` container claim (decorators to the element, `static` from `@staticmethod`) then reaches `decorated_definition_class_declaration`.
- **`variantOf` survives the split.** Splitting clones a supertype the split kind's base belongs to: rust's `_declaration_statement` becomes `_declaration_statement_impl_item_body` and `_declaration_statement_trait_item`, and 17 of the 18 kinds stamped `variantOf: _declaration_statement` lose the stamp. A clone of a supertype keeps its members' `variantOf`; the stamp is never narrowed.
- **One split per site.** The derived rust grammar bindings list the impl-body split twice, one per receiver claim (`self_parameter` and typed `self`). The derivation emits one split per (kind, context).
- **Tests:** rust's `is` method tests find `method_declaration`; the receiver-routes inventory test checks that `method_declaration`'s read entries include `declaration.method`; the inline codemod acceptance test accepts `method_declaration` beside `function_item`.
- **Census:** each clone, its base, and the members it gains; rust's callable builders gain `methodDeclaration`, `signatureMethodDeclaration`, `traitInterfaceDeclarationBody` and `extensionDeclarationBody`, and its list setters the two cloned body lists.

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

## Stage 4: vocabulary synonyms

`bindings.scm` claims are written in the languages' own words, and the portable side keeps only the canonical names. This stage implements the bindings spec's §4.2 as ruled, so a language's word for a segment or a flag reads as the canonical name everywhere. The table's entries are the synonyms probe's rulings (`docs/superpowers/probes/2026-10-12-vocabulary-synonyms/`, §1's "languages' words" and rulings NT1–NT9, NT11, ID2, ID5 and ID6), and the words NT10 excludes are in no table.

Two PRs:
- **4a** needs only stage 1's flag resolution (`bindings/vocabulary.ts::flagSegment` and `resolveFlags`). It lands after 2b merges, since 2b reworks the receiver claims that 4a rewrites.
- **4b** stacks on stage 3, whose generated `is`, `kinds` and `build` it extends.

**Census first:**
- the synonyms per level and the flags' table (NT11: empty);
- every synonym position the collision rule checks, against the probe's 120 positions with no collision and one note: `try` is a synonym of `propagate` and the canonical segment of `expression.block.try`;
- per grammar, the claims 4a rewrites into their language's word.

### 4a. The tables, the reader and the collision rule

- **The tables.** Each top-level namespace's file declares its level's table, from a canonical segment to its synonyms (`declaration.ts`: `receiver` to `self` and `this`). The flags' table sits beside the `Flag` marker. A synonym is not gated: it holds where its canonical segment does.
- **The vocabulary reader** (`bindings/vocabulary.ts`) reads the tables with the kinds, members and flags, so `Vocabulary` answers a segment's synonyms per level.
- **Canonicalized where a claim is read.** A pass before `resolveFlags` resolves each path segment and each flag capture against the vocabulary:
  - the canonical names at that position first;
  - then the level's synonyms of the segments the position has.

  It hands on canonical paths and flags only. Every later step sees canonical names only: `resolveFlags`, the routes, derivation, the inventory, `grammar.bindings.ts`, the node models and `portable.ts`. A segment that is neither a name nor a synonym at its position stays the diagnostic it is today.
- **The collision rule** joins `vocabulary-features --check`'s planning issues (`tools/src/vocabulary/plan.ts`), as the spec words it:
  - for a segment's synonym, a sibling segment or a sibling's synonym, or a flag the parent kind or a kind above it declares, or that flag's synonym;
  - for a flag's synonym, another flag or flag synonym, a member of a kind that has the flag, or a segment or synonym beneath such a kind;
  - a synonym not spelled as a segment.
- **The claims use their words.** The bindings are written against the languages' idioms: the three `bindings.scm` files rewrite each claim segment the census attributes to that grammar into its language's word, e.g. rust's and typescript's receiver claims as `self` and `this`, and python's catch as `except`. Words of languages without a grammar (`rescue`, `using`, `unpack`) stay table entries only.
- **Gate:**
  - after the rewrite, every generated file is byte-identical to before it: `grammar.bindings.ts`, `augment.ts`, `flags.ts`, the node models and `portable.ts`, with the inventory's output unchanged;
  - `vocabulary-features --check` passes on the real tables, and a fixture vocabulary trips each clause of the collision rule once;
  - a scan of the generated files finds no synonym in a path or flag position.

### 4b. Typed synonym keys on the portable surface

- **Types.** A mapped type in the vocabulary adds a key per synonym to each portable namespace, typed as the canonical key, so an editor offers `is.declaration.parameter.this`. A synonym has no interface and no `$kind`.
- **A spelling, not a shortcut.** A synonym key spells one canonical segment at its own level. It never drops, adds or reorders a segment, so the portable surface still names every path in full and has no aliases.
- **Runtime.** The generator emits each synonym key as the canonical key's own entry, the same function and the same object, so nothing canonicalizes at run time.
- **Canonical wherever kept.** `$kind`, `$type` and `$flags` never hold a synonym. A build through a synonym's path gives the canonical `$kind`; a structure whose `$kind` or `$flags` holds a synonym is refused as an unknown name, since a synonym is a builder's path, never data.
- **Gate:**
  - acceptance item 11: for a synonym path, `is`, `kinds` and `build` are the canonical entries (identity) and give equal results on the existing `is` tests;
  - a type test that the synonym key's type equals the canonical key's;
  - the portable type-check ratchet only falls.
