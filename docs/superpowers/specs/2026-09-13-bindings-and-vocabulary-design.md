# Bindings, the vocabulary and the portability API

**Status:** Design spec. Supersedes the earlier "Role Interfaces & `roles.scm`" design.

## 1. Two APIs, and the map between them

sittir has two construction surfaces. The low-level surface is shaped by each grammar. The portable surface is shaped by the vocabulary, which is the same for every language. The bindings say how one grammar realizes the vocabulary, and the generator turns them into **the map**: the only artifact the bindings produce.

| layer | what it is | source of truth | made by |
| --- | --- | --- | --- |
| **low-level API** | one builder per grammar kind, with exact kinds and kind ids; a strict form that coerces nothing and a loose form that coerces each slot's input by the slot | `grammar.sittir.ts` and the tree-sitter grammar | generated |
| **vocabulary** | the portable API: semantic kinds shared across languages, members by role, the structures that satisfy them (§8) and the nodes a portable read returns (§9) | `packages/types/src/vocabulary/` | authored |
| **features and terms** | which vocabulary kinds and members a language has, and what it calls them (§4) | `packages/types/src/vocabulary/features.ts` and one composition per language | authored |
| **bindings** | which grammar node is which vocabulary kind, which slot is which member | `packages/<grammar>/bindings.scm` | authored |
| **the map** | the bindings resolved against the grammar's slot model: for each vocabulary kind the factories that build it, and for each member the slot it lands in; for each grammar kind the vocabulary kind it is | generated with the grammar package (§5) | generated |

- **Each surface is an engine.** `createEngine(lang)` gives the low-level surface and `createEngine(lang, { api: 'portable' })` the portable one, through the reserved `ApiSurface` option. The portable engine's `build` builds structures (§8), its `parse` reads portable nodes (§9), and its `render` renders them directly. A node moves to another engine only through one verb on the target engine (§9).
- **The vocabulary is a designed API, not a derived one.** Its interfaces are written by hand, under the rules of §3. The bindings never generate them. The inventory checks the map against them (§10), so a binding that names a member the vocabulary lacks, or a vocabulary member no binding of a composed language reaches, is a diagnostic.
- **The portable surface builds through the low-level loose surface.** A structure's member is routed by the map to a slot, and the value is handed to that slot's loose coercer. Coercion therefore has one table: the loose contract (`docs/factory-surface-issues.md`, "The contract: loose = strict + six coercions"). The portable layer adds no coercion of its own beyond what §8 lists.
- **A binding is bidirectional.** A constructive pattern, one that fixes every node it would emit, serves reading (§9) and building (§8). Only a predicate outside the invertible subset (§7) is read-only, and the inventory names it.
- **Coverage of the portable surface** is measured by a validator lane that parses a corpus file with the portable engine, builds every node again from its members, renders and re-parses (§10).

## 2. `bindings.scm`

One file per grammar package, `packages/<grammar>/bindings.scm`, written in tree-sitter's query language. It states every role fact for its grammar; nothing else does.

### 2.1 Form

- **Sixteen sections in a fixed order,** identical in every file, an empty section left visible where a grammar has nothing: `module`, `declaration`, `statement`, `clause`, `argument`, `element`, `expression`, `pattern`, `type`, `literal`, `identifier`, `modifier`, `attribute`, `comment`, `keyword / punctuation`, `unclaimed`.
- **One claim per line,** the parent before its refinements, refinements in the order of the vocabulary.
- **Kind claims** are dotted captures on nodes: `(binary_expression) @expression.binary`. A single-segment capture on a pattern's top node claims the namespace's root kind: `(identifier) @identifier`.
- **Member captures are constructive and exhaustive.** A claim's members are exactly its single-segment captures on nested nodes or tokens; a grammar slot no capture names is not a member and has no route in the map.
  - The capture's name is the converged member name (§6), whether or not the upstream field already spells it: `(class_definition superclasses: (_)? @bases)`.
  - A deep capture reaches through a wrapper to the node that matters, so nesting artefacts (`content`, body wrappers, hidden arms) exist only where a capture names them: `(class_declaration (class_heritage (extends_clause (_) @extends)))`.
  - A capture on a token is the token's presence: `"async" @async`.
  - A captured node finds its slot by its field, else by its kind, else by position: an unfielded wildcard names the first node slot after the slot of the node pattern before it, so `(index_expression (_) @object (_) @index)` names both slots in order and a token before a wildcard does not count.
  - The slot model types a captured member (kinds, multiplicity, requiredness) and confirms that the capture resolves to a slot; it never adds a member.
  A claim is unconditional, so an optional member named in a claim carries a quantifier (`?`, `*`, `+`) and the claim matches whether or not the member is present.
- **Refinements** are the parent's pattern with a literal fixed: `(binary_expression operator: "+") @expression.binary.arithmetic.add`.
- **Content-derived kinds** are predicate claims: `((function_definition name: (identifier) @name) @declaration.constructor (#eq? @name "__init__"))`. A kind is claimed wherever content, position or finite text determines it, whether or not the grammar has a node for it; the grammar's kind list is the floor of coverage, never its ceiling.
- **Template regexes** name every hole: `(#match? @name "^__(?<stem>.*)__$")`. A bare hole is an error (§7).
- **A container that wraps one node** is never claimed. A pattern that captures the wrapped node as `@element` assigns its other captures to the kinds its element slot names directly, never to a kind behind a supertype or a further container: `(decorated_definition (decorator)* @decorators definition: (_) @element)` gives `declaration.class` and `declaration.function` their decorators, and `(attributed_field_declaration (attribute_item)* @attributes (_) @element)` gives `declaration.field` its attributes. A wrapper that carries information of its own is claimed as a kind, not declared a container: one whose element slot names no directly claimed kind (`declare global {}` is a `declaration.ambient`, not a declarable block, and a labeled statement is a `statement.labeled`), and one with a slot beside its element (`Iterator<Item: Copy>`'s argument is an `element.type_argument` that keeps its `constraint`). A container drops nothing silently: every slot besides its element is captured, or marked `@dropped` with its reason where a ruling keeps it out (`((attributed_argument (attribute_item)* @dropped (_) @element) (#set! reason "…"))`). The inventory reports a container capture with no direct target, and a container slot left uncaptured, and fails.
- **Token classes** are captures in the `keyword / punctuation` section: `["if" "else"] @keyword.conditional`, `["(" ")"] @punctuation.bracket`. They are classes for highlighting, not vocabulary kinds, and the map carries them in a table of their own (§5).
- **Unclaimed** kinds are stated in the file with a reason, never in a comment: `((line_continuation) @unclaimed (#set! reason "layout token"))`. The directive is for parser artefacts. Any other unclaimed kind is debt, and its count is a ratchet that only falls.

### 2.2 Seed and override

- **Two files per grammar.** `bindings.seed.scm` is generated (`sittir tool bindings-inventory --seed <grammar>`), committed, never hand-edited, and regenerated when the grammar package bumps. `bindings.scm` is authored and overrides it. The two compose by one rule: a kind claimed in the override drops every seed claim on that kind, so the override is either the whole story for a kind or silent about it.
- **The seed comes from the upstream queries and the slot model.** Each grammar package vendors tree-sitter's `queries/tags.scm` and `queries/highlights.scm`.
  - Tags decide claims and the `@name` capture, through one table shared by every grammar: `definition.class` → `declaration.class`, `definition.function` → `declaration.function`, `definition.method` → `declaration.method`, `definition.interface` → `declaration.interface`, `definition.module` → `declaration.module`, `definition.macro` → `declaration.macro`, `definition.constant` → `declaration.constant`, `reference.call` → `expression.call`.
  - Highlights decide the token classes (`@keyword`, `@operator`, `@punctuation`), and `@property`, `@type`, `@constructor`, `@comment`, `@string` and `@number` name the token or leaf under a claim.
  - The slot model expands every remaining slot of a claimed kind into a candidate capture, named under the name rules (§6). This is what makes exhaustive member captures cheap to write: the seed spells them, and an override restates only the kinds whose members it changes.
  - Every kind the tags never mention is listed in the seed's `unclaimed` section with the reason `unseeded`. That reason exists only in a seed: an authored file states a parser artefact or claims the kind.
- **The seed is coarse by construction.** Tags file rust's struct, enum, union and type alias all as `definition.class`; the override splits them. Tags cover a tenth of a grammar's claims and the model expansion is the bulk; the override is where the vocabulary's judgement lives. Locals and injections carry nothing the bindings need.
- **A seed is never the vocabulary's source.** It lowers the cost of a new grammar and of a grammar bump, nothing else.

### 2.3 What is never claimed

- **Grammar supertypes.** Namespaces are the vocabulary's supertypes (§3.2); a grammar union maps to its members' claims.
- **Containers.** A list holder with no members of its own (`argument_list`, `parameters`, a class body, a use list) is bound through its elements: by the elements' own claims where they have them, and by a positional claim only where the role's kind has members the node supplies by being the node. A bare identifier in a python parameter list is a `declaration.parameter` whose `name` is that identifier; a bare name in a typescript enum body is an `enum_member`. A value in argument position supplies nothing but itself, so there is no `argument` role kind for it: a positional argument is the expression.
- **Text leaves.** A node that carries only text (string content and fragments, comment content, regex pattern and flags) is a `string`-typed member of its parent, not a kind.
- **Layout.** Terminators, automatic semicolons, quote tokens, separators, indentation. These are render options and never members. The grammar's options block names the terminator and semicolon slots, every separated list's separator slot carries the compiler's separator name, and a delimiter token the options do not reach is unclaimed with its reason, so a slot holding only unclaimed kinds is layout too.

**Totality** is measured on the meaningful kinds: every visible kind that is not a container, a grammar supertype or a text leaf is claimed or explicitly unclaimed.

## 3. The vocabulary

### 3.1 Namespaces

Fourteen top-level namespaces. Eleven are semantic: `module`, `declaration`, `statement`, `expression`, `pattern`, `type`, `literal`, `identifier`, `modifier`, `attribute`, `comment`. Three are role namespaces, for pieces that belong to a construct without being one:

- `clause`: pieces of a statement or declaration: `else`, `catch`, `where`, a type annotation, a trait bound, a match arm, import and export specifiers;
- `argument`: pieces of a call that are not expressions, such as python's keyword argument;
- `element`: pieces of a composite expression that are not expressions: a pair, a splat, a struct field initializer, a JSX attribute, a token tree.

Keyword and punctuation classes are not namespaces (§2.1). The root of a file is `module`, the namespace's root kind, claimed by python's `module`, typescript's `program` and rust's `source_file`; a module declared inside a file (`mod`, `namespace`) is `declaration.module`.

Placement is **semantic namespace first, language qualifier as the refinement**: a macro invocation is `expression.call.macro`, a JSX element `expression.jsx.element`, a `where` clause `clause.where`. A language-specific leaf is assignable to its shared parent, so cross-language reading sees rust's macro invocations as calls; only cross-language building fails, at the leaf the target lacks.

### 3.2 Path and kind-set

Two relations, kept apart:

- **The path** is how a kind is addressed: `expression.binary.arithmetic.add`. A prefix is a kind-set, the union of every leaf beneath it, **strictly**: everything under `expression` is an expression. That rule is what put pairs, splats and keyword arguments in the role namespaces, and enum members beside enums (`declaration.enum_member`) rather than beneath them.
- **Kind-set membership** is what a member admits. A set can be addressed at the top level and also be a member of another set: `identifier` and `literal` are in `expression`'s set, `declaration` is in `statement`'s.
  - Membership is derived per language from the grammar's unions: a grammar union maps to the claims of its members.
  - A set is admitted as a whole only when every claimed kind of that set is admitted; otherwise the union lists the leaves. Rust's expression set therefore names `statement.block`, `statement.if`, `statement.match`, `statement.loop` and `statement.while` individually, never `statement`.
  - A grammar union whose members are not all claimed admits its claimed members and records the rest as unmapped (§5).
  - Inclusion is a DAG, and the generator checks it for cycles.

A node carries one claim. Rust's `if` is claimed as `statement.if`; that it sits in rust's expression set is membership, not a second claim.

### 3.3 Refinements, decomposition and placement

- **A refinement narrows, never widens.** It may add members, narrow a member's kind-set and pin a literal; it never makes a parent's required member optional, and it never admits a kind its parent does not.
- **Enumerations are const strings:** the token's text as the language spells it, `'const'`, `'&&'`, `'of'`, never a sittir kind name or a kind id, typed per language as a string-literal union. A choice that is a refined leaf is carried by the kind, and its string is derived from it per language, so `logical.and` builds as `&&` in typescript and `and` in python.
- **Keyword modifiers decompose into members.** `async`, `static`, `readonly`, `abstract`, `declare`, `override`, `const`, `unsafe`, `move`, `mutable`, `accessor`, `optional`, `definite` and `generator` are booleans. `visibility` and `accessorKind` (`get`/`set`) are text where the language spells them as keywords; typescript's accessibility keywords are its `visibility`. Rust's modifier set projects to the same booleans. A modifier with structure (`pub(in path)`, `extern "C"`) is a kind.
- **A grammar's shape kinds are refinements that pin what they add.** Injectivity (no two kinds of one grammar share a leaf) makes python's typed, default and typed-default parameters, and typescript's optional parameter, abstract class, abstract method signature and generator function, refinements of their parent, each pinning the member it is named for (`optional: true`, `abstract: true`, `generator: true`).
- **Placement: one test.** Compare two languages' constructs member by member, leaving out members a feature the other language does not compose would make absent (§4.4):
  - the same members under a different keyword: one kind, two terms (`type_alias`, `module`, `constructor`, `throw`, `extension`);
  - everything the other construct has, plus members of its own: a refinement under it (`interface.trait`, `field.signature`, `loop.for`, `loop.counted`, `enum_member.tuple`);
  - neither: sibling kinds (`class` and `struct`, `match` and `switch`, `with` and `scope`);
  - a wrapper or a keyword: a member or a transparent container (`decorator`, `attributes`, a type annotation), or a kind of its own where the wrapper's element is only a supertype (`declaration.ambient`, `statement.labeled`).
  A rust trait has everything a typescript interface has, once typescript's index and call signatures are left out as members of `structural-conformance`, which rust does not compose; it adds default method bodies and associated items. So it is `declaration.interface.trait`, and a Swift protocol is `declaration.interface.protocol`. That keeps the distinction SCIP keeps between interface, trait and protocol, while cross-language reading sees each of them as an interface.
- **Refinement routes are sugar.** `d.method('__init__', …)` builds the same tree as `d.method.dunder('init', …)`, and both read back as `declaration.method.dunder`, because classification is by match, never by construction route. A read reports the most specific kind.

### 3.4 How the interfaces are written

- **One file per top-level namespace,** plus `context.ts`, `features.ts` and `index.ts`.
- **Every level is an interface merged with a namespace:** the interface carries the level's members, the namespace its children. A leaf is an interface alone.
- **Every interface is generic over the language context:** `Name<G extends GrammarContext>`, with `G` passed through every cross-reference. Cross-references go through one import alias (`V.Expression.Call<G>`), so a local interface never shadows a namespace.
- **Each namespace exports `Any<G>`,** the union of every kind beneath it, the prefix itself included when it is a kind.
- **`GrammarContext` is the typemap:** one key per top-level namespace, `unknown` in the constraint. `BaseContext` projects each key to `V.<Namespace>.Any<BaseContext>`, the permissive closure. A language's context is generated with its map (§5).
- **Interfaces are narrow at the top and expand toward the leaves.** A level carries the members every kind beneath it carries, required only where required in all of them; a leaf carries its full shape; a refinement extends its parent and adds or pins. `Declaration<G>` holds little beyond its discriminant, `Declaration.Function<G>` holds a function's full shape, `Function.Generator<G>` adds `generator: true`. A shared member admits the union of what the kinds beneath admit, so a leaf narrows it; `T | T[]` where the kinds beneath disagree on multiplicity.
- **Every interface carries `kind`,** the dotted path as a string literal: a leaf's own path, a level's the union of every path beneath it. It is the discriminant that makes `Declaration.Any<G>` usable as "any declaration", and it is the same `kind` a structure and a portable node carry (§8, §9). A grammar field spelled `kind` (typescript's `let` / `const` keyword) takes a converged name, never the discriminant's.
- **A refinement extends its parent with `kind` narrowed to its own path:** `extends SubKindOf<Parent<G>>`, where `SubKindOf` (in `context.ts`) replaces the parent's `kind` with the template `` `${parent}.${string}` `` and the refinement declares its literal. The checker then reports a refinement that widens a shared member as an incorrect `extends`. `SubKindOf` is applied to interfaces only, never to a union, so its `Omit` cannot collapse one.
- **Hoisted names are declared.** A leaf may be given an alias at its namespace's root (`Declaration.Trait<G>` for `Declaration.Interface.Trait<G>`, and the builder `declaration.trait(...)`), written as an alias in the vocabulary. The path form always exists. An alias that would collide with another kind's name is an authoring error the checker reports, so adding a kind never removes an alias.

## 4. Features and terms

Nothing in the vocabulary is language-specific; it is feature-specific. A language that is not object-oriented has no classes, and that is a fact about a feature it does not compose, not a fact about the language. The portable API aligns the mechanics; features and terms align the terminology: **features** decide which kinds and members a language has, **terms** decide what the language calls them.

### 4.1 Features

- **A feature is a named slice of the vocabulary:** a set of kinds, by path, and a set of path-qualified members. The relation is many-to-many. `declaration.method` is in `classes` and in `interfaces`; the `async` member of a function is in `async-await`; a kind or member is present in a language when at least one of its features is composed, so composition is a plain union and no feature owns anything. The one invariant: a member's feature set is a subset of the union of its kind's feature sets, so a member is never present on an absent kind.
- **Features are atomic.** A feature is the smallest slice some real language composes or omits as a unit: no language takes half of `async-await`, but languages take type parameters without bounds, so `parametric-polymorphism` and `bounded-quantification` are two. A superset such as `oop` is a named composition of atoms, an `includes` edge in the table, never a second source of kinds or members.
- **Members are shared by feature, never by slot.** Two languages share a member only when the feature behind it is the same. Single inheritance gives `extends?: T`, interface conformance gives `implements: T[]`, multiple inheritance gives `bases: T[]` where a base may be a class or a protocol and the syntax cannot say which; collapsing them because the slots look alike loses a distinction a consumer would have to reconstruct.
- **Features are named by type-theory terms,** never by a language's keyword: `typeclasses`, not `traits`; `interface-conformance`, not `implements`.
- **Three relations, three homes.** Grammar to vocabulary lives in `bindings.scm` and says nothing about features. Vocabulary to feature lives in `features.ts` and says nothing about grammars. Language to features lives in the language's composition. A language's shape is the intersection of what its composed features admit and what its bindings claim; a claim outside the composition, and a composed feature with no claim behind it, are both diagnostics.
- **The vocabulary grows by features.** A construct a grammar has and the vocabulary lacks, whether an unclaimed kind, an unmapped kind or a member no interface declares, is covered by extending the vocabulary with a feature: the feature adds the kinds and members, the languages that have the construct compose it, and their bindings claim it. The unclaimed and unmapped ratchets (§2.1, §5.1) fall this way as well as by claims onto existing kinds.
- **`features.ts` has a column for each language with a grammar.** The table below also has columns for C#, Go, C++ and Swift. They exist to test the cuts: C# grounds the mainstream object-oriented slice, Go supplies structural conformance with no inheritance at all, C++ is the second multiple-inheritance language, Swift the second typeclass and error-propagation language. A cut that only makes sense for one of the three built grammars is suspect; a cut two grounding languages share is not. Nothing can check a column without a grammar, so those columns stay in this document.

### 4.2 Terms

- **A feature declares its parameters; a language binds the terms.** Every kind and member a feature introduces is a parameter of that feature, defaulting to the canonical vocabulary name. A composition binds terms to parameters: Swift composes `type-aliases` with `type_alias` bound to `typealias`, rust binds it to `type`, and typescript leaves the default; rust composes `modules` with `module` bound to `mod`.
- **A term reaches the portable API everywhere a name shows:** the type alias (`Swift.Declaration.Typealias`), the builder (`typealias(...)`), the documentation, and the accepted spelling of `kind` when a structure is written in that language's context.
- **The canonical path stays the identity.** A Swift `typealias` read by the portable engine has the `kind` `declaration.type_alias`, and rust's portable engine builds it as a `type` item, because the two languages share the feature. A term is an alias in both directions, never a second kind.
- **Terms and qualifiers are different tools.** A qualifier is a refinement, a different kind under the semantic one: `expression.call.macro`. A term is the same kind under a language's name. Which one applies is §3.3's placement test.
- **Consequence.** The base API and each language's API are the same interfaces under two naming layers, and the only thing maintained per language is its composition.

### 4.3 The feature table

✓ composed; † composed by content, the way `__init__` gives python a constructor (python and Go spell visibility by naming convention; python and rust overload operators through dunders and `impl` blocks); blank, absent. Columns: python, typescript, rust, then the grounding languages.

| feature | adds | py | ts | rs | C# | Go | C++ | Swift |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| classes | class declaration, methods, fields, `this` | ✓ | ✓ | | ✓ | | ✓ | ✓ |
| structs | value-type declaration | | | ✓ | ✓ | ✓ | ✓ | ✓ |
| interfaces | abstract type declaration; `trait` and `protocol` are refinements under it | | ✓ | ✓ | ✓ | ✓ | | ✓ |
| type-aliases | `type X = …`, `typealias`, `using X =` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| enumerations | named constants | | ✓ | ✓ | ✓ | | ✓ | ✓ |
| algebraic-data-types | sum types with payloads | | | ✓ | | | | ✓ |
| single-inheritance | `extends?: T` | | ✓ | | ✓ | | | ✓ |
| multiple-inheritance | `bases: T[]` | ✓ | | | | | ✓ | |
| interface-conformance | `implements: T[]` at the type | | ✓ | | ✓ | | | ✓ |
| structural-conformance | conformance with no declaration; index and call signatures | | ✓ | | | ✓ | | |
| typeclasses | conformance declared away from the type (`impl`, `extension`) | | | ✓ | | | | ✓ |
| open-type-extension | methods added away from the type | | | ✓ | ✓ | ✓ | | ✓ |
| overloading | several signatures, one name | | ✓ | | ✓ | | ✓ | ✓ |
| operator-overloading | user-defined operators | † | | † | ✓ | | ✓ | ✓ |
| parametric-polymorphism | type parameters, type arguments | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| bounded-quantification | bounds, constraints, concepts, where | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| accessors | getter, setter | † | ✓ | | ✓ | | | ✓ |
| visibility | `visibility`, per-language shape | † | ✓ | ✓ | ✓ | † | ✓ | ✓ |
| async-await | async functions, await | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| generators | yield | ✓ | ✓ | | ✓ | | ✓ | |
| concurrency-syntax | `go`, channels, actors | | | | | ✓ | | ✓ |
| exceptions | try, catch, finally, throw | ✓ | ✓ | | ✓ | | ✓ | ✓ |
| error-propagation | `?`, `try?`, `throws` | | | ✓ | | | | ✓ |
| deferred-execution | `defer` | | | | | ✓ | | ✓ |
| resource-management | `with`, `using` | ✓ | ✓ | | ✓ | | | |
| match-expressions | match, switch with patterns, guards | ✓ | | ✓ | ✓ | | | ✓ |
| destructuring | patterns in bindings and parameters | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| references | reference and pointer types, `&`, `inout`, `ref` | | | ✓ | ✓ | ✓ | ✓ | ✓ |
| lifetimes | lifetime parameters and bounds | | | ✓ | | | | |
| nullable-types | `T?`, `T \| None` | ✓ | ✓ | | ✓ | | | ✓ |
| gradual-typing | annotations optional | ✓ | ✓ | | | | | |
| syntactic-metaprogramming | macros | | | ✓ | | | ✓ | ✓ |
| decorators | higher-order application at a declaration | ✓ | ✓ | | | | | |
| attributes | annotations, not evaluated | | | ✓ | ✓ | | ✓ | ✓ |
| labeled-control-flow | labels on loops and blocks | | ✓ | ✓ | | ✓ | ✓ | ✓ |
| modules | import, export, re-export, namespace | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Decisions the table records: `enumerations` and `algebraic-data-types` are separate features, since a C# enum and a rust enum share a keyword and nothing else; `decorators` and `attributes` are separate, since Swift's `@` forms are never evaluated applications; `exceptions` and `error-propagation` are separate, since Swift has both and rust has only the second. `oop` as a superset reads as `classes`, one of the inheritance features, `interface-conformance`, `accessors` and `visibility`; that composition names typescript, C# and Swift exactly, and python and C++ with the other inheritance feature. `open-type-extension` is kept apart from `typeclasses` because C# and Go have the former without the latter. `comprehensions` and `jsx` are real features shaped by one language each and compose as leaves under `expression` without a row here.

### 4.4 Presence and requiredness are projected per kind and member

The context `G` carries kind-sets by namespace, and that alone cannot make a member absent or required for one language: a member that references a specific interface (`whereClause: V.Clause.Where<G>`) is untouched by whatever `G['clause']` projects to, and a member's optionality is fixed in its interface.

- The composition is applied by a mapped projection over each interface, not through `G`. For every kind the language composes, a member is stated as `never` (`Absent`) when none of the language's composed features contain it or when the language's bindings give it no route; a member the language's claims require is stated as non-optional (`Require`); everything else keeps its declaration.
- The projection applies to direct interface references as well as to namespace lookups. That is what makes a rust `whereClause` a compile-time error in python and a missing body a compile-time error in rust. A namespace projected to `never` is never how a member disappears.
- The projections run in the checker for every language context, so they are held to a type-check gate (§10): their cost is measured against the whole workspace's type-check time, as the node types' surface is.

## 5. The map

The map is what the generator makes of a grammar's bindings and its slot model. It is generated with the grammar package, like its factories, and never hand-edited.

### 5.1 What it holds

For one grammar:

- **Read entries,** per grammar kind: the vocabulary kinds it can be, most specific first, each with what selects it: field literals the node must have (`operator: "+"`), predicates on captured nodes (`#eq?`, `#match?`), the template's holes.
- **Build entries,** per vocabulary kind: the factories that build it, each with the literals it pins.
- **Member routes,** per entry: for each member capture, the slot it lands in, as a path from the claimed node through any transparent wrapper to the slot (`class_heritage` → `extends_clause` → value), and whether the member is a slot's value or a token's presence.
- **Container assignments:** for a container pattern, which captures it assigns to the element it wraps, and the route to each.
- **The language's context:** per namespace, the vocabulary kinds the grammar claims, with the sets admitted whole under §3.2. This is the `G` the language's interfaces are instantiated with.
- **Token classes:** the keyword and punctuation classes of §2.1, for highlighting.
- **Unmapped kinds:** each grammar kind a routed slot admits that no claim covers. Its count is a ratchet that only falls.

### 5.2 How it is typed

- **Against the low-level API.** Each route names the grammar's own slots, so the map type-checks against the grammar's generated types: a route to a slot that does not exist is a compile error in the grammar package, not a runtime surprise.
- **Against the vocabulary.** The inventory checks that every claimed path is a kind of the vocabulary, that every route's member is a member of that kind's interface, that a refinement's pinned literals are the refinement's pinned members, and that every required member of a claimed kind has a route, or is absent under the language's composition.

### 5.3 Where it is made

- **By the generator,** as part of the grammar package's generated output, regenerated when the grammar or its `bindings.scm` changes and covered by the generated-output check.
- **`bindings.scm` is read with `@sittir/scm`,** into its typed tree, by the generator's query module: the same module that reads the upstream `tags.scm` and `highlights.scm` for the seed (§2.2) and the grammar's roles. The generator also generates `@sittir/scm`, so it reads through a build of `@sittir/scm` pinned to a known commit, never through the workspace copy: a change that breaks `@sittir/scm` cannot break the generator's ability to regenerate the fix.
- **A file that does not parse is refused.** The reader names the lines that failed; the compile of each `bindings.scm` against its grammar's parser (§10) is the gate that catches what the parse absorbs.
- **The inventory** (`sittir tool bindings-inventory`) reads the bindings through the same module and reports what the generator would refuse, plus the diagnostics of §10.

### 5.4 Who reads it

- **The portable engine's `build`** finds the build entries for a structure's `kind`, routes each member to its slot and calls the low-level loose builder (§8).
- **A portable node** takes its low-level node's read entries in order, tests each entry's literals and predicates on that node, and reads each member along its route when the member is called (§9).
- **The attach verb** reads a node coming to the portable surface through its read entries, and rebuilds a built node through the build entries of the surface it goes to (§9).
- **The highlighting projection** reads the token classes.

## 6. Convergence rules

Names converge before kinds. The rules govern the names the vocabulary uses and the names captures give. The convergence record for the first vocabulary is `2026-09-13-base-vocabulary-draft.md`.

**Names.** The seed's model expansion applies rules (1) and (2) to every slot it turns into a capture, and an authored capture follows them too. A capture names a slot only in the claims it sits in, never grammar-wide.

0. Two languages share a member only when the feature behind it is the same, never because the slots look alike (§4.1).
1. A marker boolean takes the keyword it marks.
2. A modifier enum takes the noun.
3. Layout is not a member.
4. Containers keep the shared name (`parameters`, `arguments`, `body`, `statements`, `typeParameters`, `typeArguments`).
5. Otherwise the majority upstream name over the claiming grammars wins; a tie is a recorded choice.

**Kinds.**

1. Containers unwrap to their element kind-set as a list.
2. A wrapper clause that carries one member around punctuation is transparent: typescript's type annotation makes `returnType: type`; python's suite forms make a function body `statement.block`, the encoding chosen at build time. The slot model decides it: an envelope, an alias or a polymorph whose one non-layout slot holds nodes is transparent. A wrapper with structure of its own (rust's `attributed_parameter`, typescript's class body members) is transparent only through a container pattern, because reading a kind as its content drops whatever its own text says (`impl !Trait`).
3. A member's kind is the smallest kind-set covering every grammar's admitted set.
4. Text leaves are strings.
5. Exclusive markers decompose.
6. Inclusion is a DAG with full-coverage admission and flattened unions.
7. Refinements narrow, never widen.

Where a grammar's set is narrower than the vocabulary's (rust's `body` required and a block only), the language's context and its projection carry the narrowing; the vocabulary is not re-authored.

## 7. Template regexes

A `#match?` predicate whose regex is anchored at both ends and made of literal runs and holes is a template: the literals are injected on build, the holes are inputs on build and members on read.

- Every hole is a named group, and the member takes its name. The leaf adds it beside the parent's members: `declaration.method.dunder` has `stem: 'init'` while `declaration.method` keeps `name: '__init__'`.
- A hole's type is the template literal type (`` `__${string}__` ``), and a hole with a character class is validated on construction.
- Outside the subset (unanchored, backreferences, lookaround, a quantified literal, alternation that is not itself a template with the choice as a member) a predicate is read-only, and the inventory says why.
- The regex is in the syntax tree-sitter's query engine and JavaScript share; named groups are written `(?<name>…)`.

## 8. The structure API

A **structure** is a plain object satisfying a vocabulary interface, discriminated by `kind`. It is the vocabulary instantiated over a **structure context**, where each namespace's set is the union of structure types rather than node types and leaves are text; a language's structure is the same over that language's context. Structures are serializable and carry no language. A structure is only build input: a read returns a portable node (§9), never a structure.

- **The portable engine's `build` builds structures,** typed per kind from the vocabulary: a structure's `kind` selects its interface and its build entry, each member is routed to its slot, and the low-level loose builder coerces the value as its slot's contract says. It accepts the loose form: the canonical shape with each member widened to what its slot's loose coercion accepts, derived by one mapped utility, never authored. A node already on another engine comes over through the attach verb (§9), not through `build`.
- **What the portable layer adds to coercion** is only what the low-level contract cannot know:
  - an object's `kind` may be omitted exactly where the slot admits one vocabulary kind;
  - `kind` may be spelled with the language's term (§4.2);
  - a boolean and `null` in a slot that admits a literal kind become that kind as the language spells it (`literal.boolean.true`, `literal.null`).
  Everything else, a bare string or number included, is the slot's loose coercion as the loose contract states it. Runtime validates what the types check, since a structure can arrive from JSON.
- **Deviation is a type error where it should be.** A structure handed to a language whose context lacks its kind fails on the kind; one that omits a member that language requires fails on `Require`; one that carries a member that language lacks fails because the language's structure states that member as `never` (`Absent`), so an excess member is an error rather than a silent drop.
- **A refinement the target lacks degrades to its parent.** A refinement is assignable to its parent by construction, so a python `parameter.typed` structure builds through typescript's `parameter`, and a rust `interface.trait` through typescript's `interface`, as long as it carries no member the target lacks; an excess member (`unsafe`) still fails as `Absent`.
- **Positional builders** (`d.method(M.Pub | M.Async, 'deposit', …)`) remain the ergonomic authoring form and produce the same nodes; the structure form is the data interchange.

## 9. Reading

A portable engine's `parse` reads **portable nodes**: each node is read as its vocabulary kind through the map. Nothing reads a node out as a plain structure; a structure is only build input (§8).

- **A portable node is an object literal,** made the way the low-level builders make nodes. `kind` is its data. Every member of its kind's interface, inherited members included, is a closure that is always present, so a member is a call (`fn.name()`), as a low-level reader is. Optionality is the member's return type (`body(): … | undefined`), and a member the grammar gives no route returns `undefined`, as a low-level reader does for an absent slot. A data member would be evaluated when the node is made, so everything that reads the tree is a closure.
- **The interfaces stay property-shaped;** they are what `build` takes (§8). A kind's portable node type is derived from its interface the way a grammar kind's `X.Parsed` is derived from its data interface: one mapped type turns each member into a closure and resolves member types through a flat per-grammar table keyed by `kind`.
- **A portable node has no way down.** It exposes no low-level node, and nothing crosses implicitly. A node moves to another engine through one verb on the target engine, the attach verb (its name is open, §11). A parsed node is re-wrapped from its tree row, since trees are one table per language, with no reparse. A built node is rebuilt with the target surface's builders through the map.
- **Low→high crossing runs only where the node decides it.** A low-level node crosses to the portable surface on its own only when every claim of its kind is decided by the node itself: its kind, its field literals, its own text. The generator emits those kinds as a type map, and the attach verb accepts only them. A kind with a claim that depends on where it sits is reached through its parent's portable node, whose member passes the enclosing kinds down. Rust's `function_item` is a method inside an `impl` (`declaration.method`, or `declaration.method.static` without a receiver) and a `declaration.function` elsewhere, so it is reached through its parent.
- **No identity is promised.** A portable node follows the rule every node follows: two reads give two objects, and equality is a comparison.
- **The type maps from low-level kinds to portable nodes live with the low-level definitions:** the language's context, each kind's portable node type and the kinds that cross on their own are emitted into the grammar package's types module, beside `ParsedByKindId` and `BoundByKindId`.

A portable node reads through the grammar's typed surface: its low-level node's kind selects its read entries, an entry's literals and predicates are tested on that node and its captured children, the first entry that holds gives the portable node its `kind`, and a member reads along its route when it is called. No query runs over the tree at read time, and the native layer knows nothing about roles. A malformed file reads as far as its nodes do: an error node has no read entry, and its parent's members that route through it are absent.

## 10. Verification

1. **Totality and injectivity,** computed from `grammar.json` and the bindings by the inventory: every meaningful visible kind claimed or unclaimed with a reason; no two kinds of one grammar share a leaf; the unclaimed count only falls.
2. **The bindings compile:** each `bindings.scm` compiles as a query against its grammar's parser, and a bad node or field name is reported with tree-sitter's own error and the line; the set of compiling grammars is a ratchet.
3. **The bindings read:** each `bindings.scm` reads through `@sittir/scm` with no error node and renders back byte-identical.
4. **The map type-checks** against the low-level API (§5.2), and the inventory's checks of the map against the vocabulary pass.
5. **Inclusion is a DAG:** there are no cycles.
6. **Unmapped only falls.**
7. **Portable round trip:** parse with the portable engine, build every node again from its members, render, parse-equal, over the corpus, as the validator lane that measures the portable surface's coverage.
8. **Template regexes:** a dunder built from a stem re-parses to the claim; a bare hole is rejected.
9. **Cross-language errors:** `Python.Declaration.Interface` handed to python fails at compile time because python composes no `interfaces` feature, and a rust `whereClause` handed to python fails because python's bindings claim no where-clause kind (python does compose `bounded-quantification`; a composed feature reaches a member only through a claim behind it); a `Base.Declaration.Function` consumer compiles unchanged against every language's context.
10. **Feature closure:** a member's feature set is a subset of the union of its kind's feature sets; a claim outside the language's composition and a composed feature with no claim behind it are both inventory diagnostics.
11. **Terms are aliases:** a Swift `typealias` read as `declaration.type_alias` builds in rust as a `type` item and reads back with the same path; a term never changes a node's `kind`.
12. **Consumer-seat checks,** compile-time, in `packages/types/tests/vocabulary-consumers.test-d.ts`: an ordinary function, method, call and binary satisfy their interfaces; a getter pins `'get'`, `Add` pins `'+'`, an increment cannot omit its operand; a rust `whereClause` on a python function and a rust function without a body are the negative cases.
13. **Type-check time:** the whole workspace's type-check, before and after a change to the vocabulary, the projections or the map's types, with the same command, does not regress beyond noise.
14. **Crossing:** a parsed node attached to its language's other engine is re-wrapped from its tree row with no reparse and renders the same text; a built node attached to the other surface is rebuilt through the map and renders the same text; attaching a low-level node of a kind that does not cross on its own is a type error.

## 11. Open questions

- **One word, two mechanisms.** "Bindings" names `bindings.scm` and also the `_bindings` key of each grammar's `options` block, which groups option addresses under a user-facing key. One of them should be renamed before the portable API ships; the read-side consumer surface (`roles.as/is/find`) is named by the same decision.
- **The attach verb's name.** One verb on the target engine moves a node from another engine (§9); `adopt` is a placeholder.
- **Trivia and provenance through `build`.** A parsed node that crosses keeps its tree row, and with it its coordinates, but `build` builds from members alone, and a structure has no coordinates. `doc` survives as a member; free trivia needs a `trivia` member or is declared lost.
- **A user's own bindings.** Whether a user's bindings file compiles to a map composed after the package's, by the seed's per-kind override rule, and whether that happens at generation or at load.
