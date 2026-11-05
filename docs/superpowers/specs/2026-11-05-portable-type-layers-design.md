# Portable types: the vocabulary over a grammar map of features and slot overrides

Status: design, approved by the maintainer (2026-11-05).

## Why

The portable API's types pass through six layers before a slot gets a type:
1. the authored vocabulary interfaces;
2. a separately authored shared slot table (`GrammarContext.slots`);
3. roles resolved through the grammar parameter (`G['expression']`);
4. `Seated` and an unmapped table keyed by namespace and member;
5. build forms (`gate.RequiredBy`);
6. a per-grammar `OwnSlots` table checked against the shared table by `Fit`.

These layers are hard to follow and to change. They also give the wrong answer at the point users see:
- **Role-armed members admit too much.** 352 role-armed members admit more than their slot can hold, so a value type-checks and is then refused when built.
- **Grammars never narrow the shared table.** A grammar's context narrows its roles, texts and unmapped arms, but never the shared slot table.
- **Some checks never bind.** For 51 members typed directly by a role, the `Fit` check passes vacuously.
- **Nothing reaches the user.** The runtime surface uses none of these types: `build` takes `{ $path: string; [member: string]: unknown }` and `read` returns `unknown`.

## Decided by the maintainer (2026-11-05)

- **Two audiences.**
  - Language-agnostic code is written once against the vocabulary and runs on any grammar that has what it targets. That includes building portable structures without knowing the grammar.
  - Single-grammar code works in one language.
- **Hover shows the exact set** of kinds a slot holds in that grammar, not a role name.
- **The authored vocabulary stays the contract.** A grammar's types fit it.
- **Single-grammar code gets its exact types through the engine.** The engine's portable read and build are typed by them.
- **Read and input follow the low-level API's model.** A kind has a read type (what a read returns) and an input type (what a builder takes). The input admits every read value and may admit more forms, such as bare text where the slot's leaf builds from text.
- **The vocabulary keeps its grammar parameter G,** and G becomes small. A grammar types only the slots where it deviates from the vocabulary. Every other member takes the vocabulary's own type.
- **Features keep gating through G.** A grammar's feature set is part of its map, so a member a grammar lacks is explained by the missing feature.
- **Content is only added, never subtracted.** A feature is the unit of addition: a grammar that has a feature holds every path and member in it. Where a grammar would hold only part of a feature, the feature is decomposed into sub-features along that line, and the grammar has the ones it fully holds. The core counts the same way: core content a grammar lacks moves into a feature. So G carries no list of paths and no removed members.
- **No generic language holds every feature.** Agnostic code targets the core or a standard composition: authored feature packages, such as object-oriented or c-like, that combine standard feature sets. A grammar's feature set is made of packages, single features and its own language features.
- **A language ships its own features.** What only one language has, its conventions and edge cases, forms language features. They're generated and shipped with the grammar package, and they work like vocabulary features: the grammar's feature set includes them, and they're additions only. Content already in the shared vocabulary stays there, including content only one grammar claims today. Language features cover only what the vocabulary doesn't have.
- **A grammar's composition states what the language has.** It stays authored, and a guard holds the grammar's claims equal to it. Each gap is closed before the work lands: by writing the missing claim where the language has the construct, or by splitting the feature where it doesn't.
- **Read types are honest.** Where the portable reader returns a raw low-level node for a claimed kind, the read type says so.
- **The motive is fewer layers.** Type-check time is not a constraint, but it is measured.

## Goals

- **One family of interfaces:** the authored vocabulary, instantiated per grammar by a small grammar map.
- **Exact slot types:** every member of a grammar's instantiation is exactly what that slot can hold (read) or take (input) in that grammar, from the same facts the runtime admission uses.
- **A typed runtime surface:** a grammar engine's portable `read` returns its grammar's read types and its `build` takes its input types. The language-agnostic engine type takes the contract's types.
- **Agnostic code is written against the core or a composition** and compiles against every grammar that has it. Where a grammar can't hold a value, the build is refused by name.

## Non-goals

- **The low-level API's types,** and its read and input model, don't change.
- **Vocabulary paths and member names don't change.** Feature folders change in one way only: features are decomposed into sub-features wherever some grammar holds only part of one, and core content a grammar lacks moves into a feature.
- **Runtime admission and refusal stay.** The runtime refusal stays the backstop.

## Anti-goals

- A per-grammar type written by hand. The grammar map is generated, and the vocabulary is authored.
- A second derivation of a slot's set. An override and the runtime admission read one fact.
- An override that doesn't fit its default, or a fit check that can pass vacuously.
- A path or member missing for a grammar that fails without naming the feature.
- A generic language that holds every feature.
- A path or member removed per grammar. Absence is always a feature the grammar lacks, and an override only narrows a type.

## The end state

### The vocabulary (authored)

- **Each path has a read interface and an input interface,** generic over `G`. Only the read interface is authored. The input interface comes from it by one type-level mapping, so "input admits every read value" holds by construction.
- **Each member has a default type,** written on the member itself, for example `function` on `expression.call`. The default is the broad vocabulary type that may stand there in any grammar.
  - Roles survive as names for whole namespaces, such as every expression path. They're no longer entries a grammar fills. Under a contract, a role also admits the opaque member that stands for content in its namespace outside the composition.
  - Defaults admit an unclaimed grammar kind (`V.Unmapped`), because a grammar's exact set may include one.
- **Overrides:** a member's type is `G`'s override for that path and member when `G` has one, and its default otherwise.
- **The input interface's default** admits everything the read default does, plus input-only forms. Under a contract those forms are:
  - values read from the same engine, opaque ones included, so agnostic code can pass them through;
  - bare text where the default is a leaf path built from text;
  - scalars where the default is a scalar.

  Kind ids aren't portable input.
- **Feature members** are gated by `G`'s feature set, as feature gating works today: present when `G` has the feature, and explained by it when absent.
- **Text-valued paths** default to `string`.

### The grammar map G (generated per grammar)

`G` holds two things and nothing else.
1. **Its feature set:** the standard packages and vocabulary features the grammar has, plus its own language features. That's the one source for gating, of paths and of members.
   - A grammar's paths and members are exactly those of the core and its features. Naming a path or member from a feature the grammar lacks is a type error that names the feature.
   - The authored per-grammar composition names the packages and vocabulary features, and generation adds the language features. A guard holds the grammar's claims equal to its composition: the grammar claims every path and member its features hold, and nothing in a feature it lacks.
   - Where a grammar's claims and its features disagree today, the gap closes before the work lands. If the language has the construct, the claim is written. If it doesn't, the content moves into a feature or sub-feature the grammar doesn't have.
2. **Its slot overrides,** read and input. There's an entry only where the grammar's exact set differs from the member's default:
   - role arms expanded to the paths the slot actually yields;
   - unclaimed kinds as `V.Unmapped<'<grammar>:<kind>'>`;
   - raw-node arms where the reader returns the low-level node;
   - exact text literal unions;
   - and on the input side, the grammar's input-only forms and requiredness.

   Where a path's build forms can't be expressed member by member (one of two members required, say), the path's input is overridden as a whole.

**Every override fits its default, checked at compile time against the vocabulary's own defaults.** A grammar map with an override wider than its default doesn't type-check. No check passes because a lookup fell through. An override narrows a member's type and never removes the member.

**There's no neutral map with every feature.** A contract is the vocabulary instantiated with a composition's feature set and no overrides: the core alone, or a standard package. Agnostic code picks the one it needs.

### Standard compositions (authored)

- **Packages:** a standard composition is an authored package of vocabulary features, and it may include other packages. Examples are object-oriented and c-like.
- **Where they live:** packages are part of the shared vocabulary, beside the features they combine.
- **Membership:** a grammar has a package when it has every feature in it. A grammar's feature set names the packages it has, plus single features and its language features.
- **Content outside a composition:** under a composition, a value whose path lies outside it reads as its nearest ancestor inside the composition, as `SubKindOf` makes a refinement assignable to its parent today. Content with no ancestor there reads as an opaque member of its namespace. That covers paths in language features and paths in vocabulary features the composition doesn't include.

### Language features (generated, shipped with the grammar)

- **What they hold:** paths and members only one language has, for its conventions and edge cases. Like a vocabulary feature, a language feature can add paths and add members to vocabulary paths.
- **Where they come from:** the grammar's claims name each path and member, and the read and input types come from the same model facts as overrides. A language feature has no defaults to fit, because its exact types are its interface.
- **Additions only:** a language feature never shadows, renames or replaces vocabulary content.
- **The boundary:** a construct that agnostic code would want in a second language belongs in the vocabulary as an authored feature. When a second language needs a language feature's construct, the construct moves into the vocabulary and both grammars claim it.
- **Paths:** a language feature's paths are vocabulary-derived: they sit in a vocabulary namespace, with kind and subkind beneath it, so a python-only statement is still a `statement`. The feature itself belongs to its grammar. If two grammars' language features add the same path, the path belongs in the vocabulary.
- **Under a contract:** a value at a language feature's path reads like any content outside the composition, as an opaque member of its namespace or as its nearest ancestor inside the composition. Agnostic code knows it's a statement, say, and can keep it, pass it through and place it wherever a statement goes. It can't look inside the grammar-only part or build one.

### Unmapped

- **Unmapped** means a grammar kind with no vocabulary-derived namespace, kind or subkind: no path at all. That's what `V.Unmapped<'<grammar>:<kind>'>` names, and it's the kind's real low-level node type, not a phantom shape.
- It isn't a language feature, because giving a kind a path is a claim. A kind leaves Unmapped when a claim maps it, into the vocabulary or into a language feature.
- Under a contract an unmapped value is fully opaque, and it fits only where a default admits `V.Unmapped`.

### Raw reads

- **What they are:** for some claimed kinds the portable reader returns the low-level node itself, because a portable read would lose something (reasons such as opaque, preset, flags or text).
- **Typed honestly:** each slot that can hold such a kind gets a raw-node arm. For single-grammar code it's the grammar's exact low-level node type; under a contract it's opaque.
- **Shrinking:** a ratchet counts raw-node arms, and the count only goes down.
- **Tokens:** a token reads as its text, per the standing ruling that portable tokens are text. Where the reader returns a kind id for a token today, it returns the text instead.

### Engine surface

- **A grammar engine's portable runtime** is typed by its grammar's map:
  - `read` returns the read type of the node's path, from the vocabulary or a language feature;
  - `build` takes the input type of the structure's `$path`, from either.
- **The language-agnostic engine type** (`PortableEngine<C>`) is the same shape over a composition `C`, the core when none is named. A grammar engine is assignable to `PortableEngine<C>` when its feature set includes `C`.
  - Agnostic code takes a `PortableEngine<C>` and builds structures typed by that contract.
  - A grammar refuses what it can't hold by name at build time.
  - A refusal for a path or member missing for lack of a feature names the feature.

### What no longer exists

- **The separately authored shared slot table.** Defaults live on the members.
- **Roles as entries of a grammar context.**
- **`Seated` and the unmapped table.** Unclaimed kinds sit in overrides.
- **`gate.RequiredBy`.** Requiredness is part of the input overrides.
- **The `OwnSlots` table and the `Fit` checks.** The override constraint replaces them.
- **The phantom `V.Unmapped` shape.** It becomes the real low-level node type.

### Measured outcome

The census that counts members admitting more than their slot holds reads 0 in every grammar, for vocabulary and language features alike. A ratchet holds it there. A second ratchet counts raw-node arms, and that count only shrinks.

## Constraints

- **The shared vocabulary stays authored.** No emitter writes vocabulary interfaces. The feature-merge generator may change, to gate paths by feature, to derive input interfaces and to let language-feature paths join their namespace, but it still only merges authored interfaces. The grammar map and the language features are generated, and language features ship in the grammar package, outside the shared vocabulary.
- **One source for overrides:** they come from the model's slot facts and the build table, the facts the runtime admission and the reader already use.
- **Generated outputs** are not hand-edited.
- **Type-check time** is measured against the baseline below and reported. It doesn't gate the work.
- **Read types are checked against the runtime.** A test ties each grammar's read types to what `read` actually returns, not only to the lazy view mirrors.
- **The conformance evidence carries over.** Today, per-claim reader mirrors in the typed module type-check each low-level read against its portable view, and the conformance lane counts their diagnostics. In the end state the same evidence exists against each grammar's instantiation.

## Baseline (master 5ed03a7d3, tsrs, one warm run each)

| | python | rust | typescript |
|---|---|---|---|
| typed module lines | 8,316 | 19,932 | 14,057 |
| typed module type-check wall | 1.6 s | 1.4 s | 0.6 s |
| conformance diagnostics | 87 | 82 | 133 |
| package type-check wall | 3.0 s | 2.8 s | 1.2 s |

Workspace type-check is 25.9 s wall, and type tests are 2.8 s. The workspace type-check doesn't include the typed modules.

## Left to the builder

- **The override lookup:** its spelling, and how the vocabulary writes "override, else default" on a member.
- **The fit constraint:** how every override is checked against its default. It has to be real and non-vacuous.
- **Path gating:** how a path from a feature the grammar lacks fails to resolve, with an error that names the feature.
- **Language feature names:** how language features are named and split, and how the opaque namespace member is spelled.
- **Sub-features:** the inventory of gaps between each grammar's claims and its features, whether the language has each construct, and the name and folder of each feature or sub-feature that content moves into.
- **Read results:** how a read result is discriminated by `$path`, and how `read` maps a node kind to its read type.
- **Where things live:** where the grammar map is emitted, and how it reaches the engine's typing. Today the typed module is internal and no package exports it.
- **Migration:** the order of the work. That's the plan's job, and the spec is the end state only.

## Calls made in this design, not by the maintainer

- Each path has read and input interfaces. Only the read interface is authored, and one mapping derives the input interface.
- Under a contract, input admits values read from the same engine, text for text-built leaves and scalars for scalars, but not kind ids.
- The feature-merge generator may change, as long as it only merges authored interfaces.
- A runtime test ties read types to what `read` returns.
- The runtime path set becomes per grammar, so language-feature paths read and build. This work doesn't have to convert today's unclaimed kinds; each stays Unmapped until a claim maps it.
- A token reads as its text, never as a kind id, which applies the standing ruling to the reader.
- Defaults admit `V.Unmapped`, so overrides that include unclaimed kinds fit them.
- A path's input may be overridden as a whole where its build forms don't decompose per member.
- The census ratchet at 0 is the success measure for exactness.
- The line between a vocabulary feature and a language feature: whether agnostic code would want the construct in a second language. When one does, the construct moves into the vocabulary.
- A language feature can add members to vocabulary paths, as vocabulary features can.
- The same path in two grammars' language features means it belongs in the vocabulary.
- The grammar's claims name language feature paths and members, so no new kind of authored source appears.
- `PortableEngine` with no composition named means the core.
- The plan proposes the first standard packages from today's features and grammar compositions, for the maintainer to review.
- Outside a composition, a subkind reads as its nearest ancestor inside it, and only content with no ancestor there reads as an opaque namespace member.
