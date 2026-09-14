# Bindings, the vocabulary and the portability API

**Status:** Design spec. Supersedes the earlier "Role Interfaces & `roles.scm`" design; §12 states what changed and why.
**Realized so far:** `packages/<grammar>/bindings.scm` for python, typescript and rust; the hand-maintained base interface tree under `packages/types/src/vocabulary/`; the inventory `sittir tool bindings-inventory` (`packages/tools/src/inventory/`), which compiles the bindings, derives the vocabulary and drafts the tree through the typescript package's own factories; the convergence record `2026-09-13-base-vocabulary-draft.md`.
**Not yet realized:** the feature table and per-language compositions (§4), per-language contexts, term aliases, the structure builders, the retirement of the coercer.

---

## 1. Three APIs, one mapping

sittir has two construction surfaces, a composition and naming layer over the second, and one file that maps the two surfaces onto each other. The low-level surface is shaped by the grammar, the high-level surface by the vocabulary; the bindings map between those two shapes, and the portability layer never touches a grammar shape, so it has no mapping file of its own.

| layer | what it is | source of truth | typing |
| --- | --- | --- | --- |
| **low-level API** | the rule-IR-generated factories: one builder per grammar kind, exact kinds, kind ids, total | `grammar.sittir.ts` and the tree-sitter grammar | strict only |
| **high-level API** | the vocabulary builders and the structure API: semantic kinds shared across grammars, members by role. Aligns the **mechanics**: one structure shape, one builder per kind, one coercion table | `bindings.scm` | loose only; canonical output |
| **portability API** | not a construction surface: a layer over the high-level API that decides which vocabulary kinds and members a language has, and what it calls them. A language is a composition of features, and each feature's names are bound to the language's terms. Aligns the **terminology**, and is what makes a structure written against the high-level API portable | the feature table and each language's composition (§4) | the high-level interfaces, admitted per composition, under a language's names |
| **bindings** | the mapping: which grammar node is which vocabulary kind, which slot is which member, and in the write direction which factory a vocabulary kind builds through and where each member lands | `packages/<grammar>/bindings.scm` | — |

The low-level surface is strict: it takes exactly the node types it declares and coerces nothing. The high-level surface is loose: it takes the widest input a slot can disambiguate and produces canonical structures. The generated coercer module of the low-level surface (`coerce.ts`) is therefore retired once the high-level API covers what the corpus builds; the open loose-surface rows in `docs/factory-surface-issues.md` retire with it rather than being fixed. Coverage is measured by a validator lane that reads a corpus file, projects every node to a structure, builds it back through the high-level API, renders and re-parses; the low-level loose surface stays until that lane covers the corpus.

A binding is bidirectional. A constructive pattern, one that fixes every node it would emit, serves the reader, the derived types, `from()` and `$structure()`. Only a regex outside the invertible subset (§7) is read-only, and the inventory names it.

## 2. `bindings.scm`

One file per grammar package, `packages/<grammar>/bindings.scm`, executed by the reader as a tree-sitter query and read by the derivation. It states every role fact; nothing else does.

### 2.1 Form

- **Sixteen sections in a fixed order**, identical in every file, an empty section left visible where a grammar has nothing: `module`, `declaration`, `statement`, `clause`, `argument`, `element`, `expression`, `pattern`, `type`, `literal`, `identifier`, `modifier`, `attribute`, `comment`, `keyword / punctuation`, `unclaimed`.
- **One claim per line**, the parent before its refinements, refinements in the order of the base tree.
- **Kind claims** are dotted captures on nodes: `(binary_expression) @expression.binary`. A single-segment capture on a pattern's top node claims the namespace's root kind (`(identifier) @identifier`).
- **Member captures are constructive and exhaustive.** A claim's members are exactly its single-segment captures on nested nodes or tokens; a grammar slot no capture names is not a member. The slot model types a captured member (kinds, multiplicity, requiredness) and confirms the capture resolves; it never adds one. Nesting artefacts (`content`, body wrappers, hidden arms) exist only where a capture names them, and a deep capture reaches through a wrapper to the node that matters: `(class_declaration (class_heritage (extends_clause (_) @extends)))`. The capture name is the converged member name (§6), whether or not the upstream field already spells it.
- **Refinements** are the parent's pattern with a literal fixed: `(binary_expression operator: "+") @expression.binary.arithmetic.add`.
- **Content-derived kinds** are predicate claims: `((function_definition name: (identifier) @name) @declaration.constructor (#eq? @name "__init__"))`. A kind is claimed wherever content, position or finite text determines it, whether or not the grammar has a node for it; the grammar's kind list is the floor of coverage, never its ceiling.
- **Template regexes** name every hole: `(#match? @name "^__(?<stem>.*)__$")`. A bare hole is a lift error (§7).
- **A container that wraps one node** is never claimed; a pattern that captures the wrapped node as `@element` assigns its other captures to that element: `(decorated_definition (decorator)* @decorator definition: (_) @element)`, `(ambient_declaration "declare" @declare (_) @element)`, `(labeled_statement label: (_) @label body: (_) @element)`.
- **Unclaimed** kinds are stated in the file with a reason, never in a comment: `((line_continuation) @unclaimed (#set! reason "layout token"))`. The directive is for parser artefacts only, and the unclaimed count is a ratchet toward zero.

### 2.2 Seed and override

- **Two files per grammar.** `bindings.seed.scm` is generated (`sittir tool bindings-inventory --seed <grammar>`), committed, never hand-edited, and regenerated when the grammar package bumps. `bindings.scm` is authored and overrides it. The inventory composes the two with one rule: a kind claimed in the override drops every seed claim on that kind, so an override is either the whole story for a kind or silent about it.
- **The seed comes from the upstream queries and the slot model.** Each grammar package vendors tree-sitter's `queries/tags.scm` and `queries/highlights.scm`. Tags decide claims and the `@name` capture through one table shared by every grammar: `definition.class` → `declaration.class`, `definition.function` → `declaration.function`, `definition.method` → `declaration.method`, `definition.interface` → `declaration.interface`, `definition.module` → `declaration.module`, `definition.macro` → `declaration.macro`, `definition.constant` → `declaration.constant`, `reference.call` → `expression.call`. Highlights decide token captures: `@keyword`, `@operator`, `@property`, `@type`, `@constructor`, `@comment`, `@string`, `@number` name the token or leaf under the claim. The slot model expands every remaining slot of a claimed kind into a candidate capture under the names rules (§6), and lists every kind the tags never mention in the `unclaimed` section with the reason `unseeded`.
- **The seed is coarse by construction.** Tags file rust's struct, enum, union and type alias all as `definition.class`; the override splits them. Tags cover a tenth of a grammar's claims; the model expansion is the bulk, and the override is where the vocabulary's judgement lives. Locals and injections carry nothing the bindings need.
- **A seed is never the vocabulary's source.** The tree stays hand-maintained (§5); the seed lowers the cost of a new grammar and of a grammar bump, nothing else.

### 2.3 What is never claimed

- **Grammar supertypes.** Namespaces are the vocabulary's supertypes (§3.2); a grammar union maps to its members' claims.
- **Containers.** A list holder with no members of its own (`argument_list`, `parameters`, a class body, a use list) is bound through its elements: by the elements' own claims where they have them, and by a positional claim only where the role's kind has members the node supplies by being the node — a bare identifier in a python parameter list is a `declaration.parameter` whose `name` is that identifier; a bare name in a typescript enum body is an `enum_member`. A value in argument position supplies nothing but itself, so there is no `argument` role kind: a positional argument is the expression.
- **Text leaves.** A node that carries only text (string content and fragments, comment content, regex pattern and flags) is a `string`-typed member of its parent, not a kind.
- **Layout.** Terminators, automatic semicolons, quote tokens, separators, indentation. These are render options and never members.

Totality is measured on the meaningful kinds: every visible kind that is not a container, a grammar supertype or a text leaf is claimed or explicitly unclaimed. Today: python 119 of 119, typescript 176 of 176, rust 144 of 144.

## 3. The vocabulary

### 3.1 Namespaces

Fourteen top-level namespaces. Eleven are semantic: `module`, `declaration`, `statement`, `expression`, `pattern`, `type`, `literal`, `identifier`, `modifier`, `attribute`, `comment`. Three are role namespaces for pieces that belong to a construct without being one: `clause` (pieces of a statement or declaration: `else`, `catch`, `where`, a type annotation, a trait bound, a match arm, import and export specifiers), `argument` (pieces of a call that are not expressions: python's keyword argument), `element` (pieces of a composite expression that are not expressions: a pair, a splat, a struct field initializer, a JSX attribute, a token tree). `keyword` and `punctuation` are token classes for highlighting projections, not kinds of the tree. The root of a file is `module`, the namespace's root kind, claimed by python's `module`, typescript's `program` and rust's `source_file`; a module declared inside a file (`mod`, `namespace`) is `declaration.module`.

Placement is **semantic namespace first, language qualifier as the refinement**: a macro invocation is `expression.call.macro`, a JSX element `expression.jsx.element`, a `where` clause `clause.where`. A language-specific leaf is assignable to its shared parent, so cross-language reading sees rust's macro invocations as calls; only cross-language building fails, at the leaf the target's context lacks. A top-level extension namespace exists only for a thing with no semantic parent, and there are none.

### 3.2 Path and kind-set

Two relations, kept apart:

- **The path** is how a kind is addressed: `expression.binary.arithmetic.add`. A prefix is a kind-set, the union of every leaf beneath it, **strictly**: everything under `expression` is an expression. That rule is what put pairs, splats and keyword arguments in the role namespaces, and enum members beside enums (`declaration.enum_member`) rather than beneath them.
- **Kind-set membership** is what a member admits. A set can be addressed at the top level and also be a member of another set: `identifier` and `literal` are in `expression`'s set, `declaration` is in `statement`'s. Membership is **derived per language context** from the grammar's unions: a grammar union maps to the claims of its members, and a set is admitted as a whole only when every claimed kind of that set is admitted; otherwise the union lists the leaves. Rust's expression set therefore names `statement.block`, `statement.if`, `statement.match`, `statement.loop` and `statement.while` individually, never `statement`. Inclusion is a DAG; the derivation checks for cycles; and every emitted set type is a flattened union of leaf interfaces, so no type alias is self-referential. The base set is the union of the contexts' leaves.

A node carries one claim. Rust's `if` is claimed as `statement.if`; that it sits in rust's expression set is membership, not a second claim.

### 3.3 Refinements and decomposition

- **A refinement narrows, never widens.** A leaf's members are its parent's with a literal fixed; a leaf that admits a kind its parent does not is a bindings error, and because an ancestor carries only what is shared, the compiler reports a child that redeclares a shared member incompatibly.
- **Enumerations are const strings**: the token's text as the language spells it, `'const'`, `'&&'`, `'of'`, never a sittir kind name or a kind id, typed per language as a string-literal union through the context. A choice that is a refined leaf is carried by the kind and its string is derived from it per language, so `logical.and` builds as `&&` in typescript and `and` in python.
- **Keyword modifiers decompose into members**: `async`, `static`, `readonly`, `abstract`, `declare`, `override`, `const`, `unsafe`, `move`, `mutable`, `accessor`, `optional`, `definite`, `generator` are booleans; `visibility` and `accessorKind` (`get`/`set`) are text where the language spells them as keywords; typescript's accessibility keywords are its `visibility`, one member with one concept behind it, whose shape is the language's (§4.2). Rust's modifier set projects to the same booleans. A modifier with structure (`pub(in path)`, `extern "C"`) is a kind.
- **A grammar's shape kinds are refinements that pin what they add.** Injectivity (no two kinds of one grammar share a leaf) makes python's typed, default and typed-default parameters, typescript's optional parameter, abstract class, abstract method signature and generator function refinements of their parent, each pinning the member it is named for (`optional: true`, `abstract: true`, `generator: true`); hoisting (§8) keeps them as cheap to reach as the parent.
- **Placement is decided by one test**: does the construct build through the other language's builder for that kind? Yes with a different keyword is a term (`type_alias`, `module`, `constructor`, `throw`, `extension`); yes in one direction only is a refinement under the wider one (`interface.trait`, `field.signature`, `loop.for`, `loop.counted`, `enum_member.tuple`); no is a sibling kind (`class` and `struct`, `match` and `switch`, `with` and `scope`); and a wrapper or a keyword is a member or a transparent container (`declare`, `label`, `decorator`, a type annotation).
- **Refinement routes are sugar.** `d.method('__init__', …)` builds the same tree as `d.method.dunder('init', …)`, and both read back as `declaration.method.dunder`, because classification is by match, never by construction route. `$structure()` reports the most specific kind.

## 4. The portability API: features and terms

Nothing in the vocabulary is language-specific; it is feature-specific. A language that is not object-oriented has no classes, and that is a fact about a feature it does not compose, not a fact about the language. The high-level API aligns the mechanics; the portability API aligns the terminology, in two parts: **features** decide which kinds and members a language has, **terms** decide what the language calls them.

### 4.1 Features

- **A feature is a named slice of the vocabulary**: a set of kinds, by path, and a set of path-qualified members. The relation is many-to-many in both directions. `declaration.method` is in `classes` and in `interfaces`; the `async` member of a function is in `async-await`; a kind or member is present in a language when at least one of its features is composed, so composition is a plain union and no feature owns anything. The one invariant: a member's feature set is a subset of the union of its kind's feature sets, so a member is never present on an absent kind.
- **Features are atomic.** A feature is the smallest slice some real language composes or omits as a unit: no language takes half of `async-await`, but languages take type parameters without bounds, so `parametric-polymorphism` and `bounded-quantification` are two. A superset such as `oop` is a named composition of atoms, an `includes` edge in the table, never a second source of kinds or members.
- **Members are shared by feature, never by slot.** Two languages share a member only when the feature behind it is the same. Single inheritance gives `extends?: T`, interface conformance gives `implements: T[]`, multiple inheritance gives `bases: T[]` where a base may be a class or a protocol and the syntax cannot say which; collapsing them because the slots look alike loses a distinction a consumer would have to reconstruct.
- **Features are named by type-theory terms**, never by a language's keyword: `typeclasses`, not `traits`; `interface-conformance`, not `implements`.
- **Three relations, three homes.** Grammar to vocabulary lives in `packages/<grammar>/bindings.scm` and says nothing about features. Vocabulary to feature lives in one hand-maintained table beside the interfaces, `packages/types/src/vocabulary/features.ts`, and says nothing about grammars. Language to features lives with the language's context, one composition per language. A language's shape is the intersection of what its composed features admit and what its bindings claim; a claim outside the composition and a composed feature with no claim behind it are both diagnostics.
- **Grounding languages.** C#, Go, C++ and Swift have columns in the table and no grammar. They exist to test the cuts: C# grounds the mainstream object-oriented slice, Go supplies structural conformance with no inheritance at all, C++ is the second multiple-inheritance language, Swift the second typeclass and error-propagation language. A cut that only makes sense for one of the three built grammars is suspect; a cut two grounding languages share is not.

### 4.2 Terms

- **A feature declares its parameters; a language binds the terms.** Every kind and member a feature introduces is a parameter of that feature, defaulting to the canonical vocabulary name. A composition binds terms to parameters: Swift composes `type-aliases` with `typeAlias` bound to `typealias`, rust binds it to `type`, and typescript leaves the default; rust composes `modules` with `module` bound to `mod`.
- **A term reaches the high-level API everywhere a name shows**: the type alias (`Swift.Declaration.Typealias`), the builder (`typealias(...)`), the documentation, and the accepted spelling of `kind` when a structure is written in that language's context.
- **The canonical path stays the identity.** `$structure()` emits `declaration.type_alias` for a Swift `typealias`, and the structure builds through the rust builder as a `type` item, because the two languages share the feature. A term is an alias in both directions, never a second kind.
- **Terms and qualifiers are different tools.** A qualifier is a refinement, a different kind under the semantic one: `expression.call.macro`. A term is the same kind under a language's name. The rule for choosing: if two languages' constructs type-check against each other's builders, it is one kind with two terms; if not, it is a refinement. A rust trait and a typescript interface fail that test in both directions (default method bodies and associated items one way, index and call signatures the other), so `trait` is not a term: it is the refinement `declaration.interface.trait`, and a Swift protocol is `declaration.interface.protocol`. That keeps the distinction SCIP keeps between interface, trait and protocol, while cross-language reading still sees every one of them as an interface.
- **Consequence.** The base API and each language's API are the same interfaces under two naming layers, and the only thing maintained per language is its composition.

### 4.4 Presence and requiredness are projected per kind and member

The context `G` carries kind-sets by namespace, and that alone cannot make a member absent or required for one language: a member that references a specific interface (`whereClause: V.Clause.Where<G>`) is untouched by whatever `G['clause']` projects to, and a member's optionality is fixed in the base interface. The composition is therefore applied by a mapped projection over each interface, not through `G`: for every kind the language composes, a member none of the language's composed features contain is stated as `never` (the `Absent` utility of §8), a member the language's claims require is stated as non-optional (`Require`), and everything else keeps the base declaration. The projection is applied to direct interface references as well as to namespace lookups, which is what makes a rust `whereClause` a compile-time error in python and a missing body a compile-time error in rust. A namespace projected to `never` is never how a member disappears.

### 4.3 The feature table, first cut

The first version of the hand-maintained table. ✓ composed; † composed by content, the way `__init__` gives python a constructor (python and Go spell visibility by naming convention, python and rust overload operators through dunders and `impl` blocks); blank, absent. Columns: python, typescript, rust, then the grounding languages.

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
| structural-conformance | conformance with no declaration | | ✓ | | | ✓ | | |
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

Decisions the table records: `enumerations` and `algebraic-data-types` are separate features, since a C# enum and a rust enum share a keyword and nothing else; `decorators` and `attributes` are separate, since Swift's `@` forms are never evaluated applications; `exceptions` and `error-propagation` are separate, since Swift has both and rust has only the second. `oop` as a superset reads as `classes`, one of the inheritance features, `interface-conformance`, `accessors`, `visibility`; that composition names typescript, C# and Swift exactly, and python and C++ with the other inheritance feature. Two rows are held loosely: `interfaces` places rust's trait under typescript's interface as a refinement, with `typeclasses` carrying the conformance side, and `open-type-extension` is kept apart from `typeclasses` because C# and Go have the former without the latter. `comprehensions` and `jsx` are real features shaped by one language each and compose as leaves under `expression` without a row here.

## 5. The base type tree

`packages/types/src/vocabulary/` is **authored and hand-maintained**. The inventory (`sittir tool bindings-inventory --emit <dir>`) drafts what the bindings and each grammar's slot model imply into a directory of the caller's choosing so an editor can compare; it never overwrites the files. The draft is itself dogfood: the inventory builds every interface, namespace, union, lookup and template literal type through the typescript package's strict factories and renders it with the native engine, so a defect in that surface shows up in the draft rather than being worked around. The base vocabulary is a designed surface; convergence (§6) is an editorial act on these files, with the bindings edited to match.

- **One file per top-level namespace**, plus `context.ts` and `index.ts`.
- **Every level is an interface merged with a namespace**: the interface carries the level's members, the namespace its children. A leaf is an interface alone. A refinement is `extends Parent<G> { readonly operator: '+' }`.
- **Every interface is generic over the grammar context**: `Name<G extends GrammarContext>`, with `G` passed through every cross-reference. Cross-references go through one import alias (`V.Expression.Call<G>`) so a local interface never shadows a namespace.
- **Each namespace exports `Kinds<G>`**, the flattened union of every claimed kind beneath it, the prefix itself included when it is claimed.
- **`GrammarContext` is the typemap**: one key per top-level namespace, `unknown` in the constraint. **`BaseContext`** projects each key to `V.<Namespace>.Kinds<BaseContext>`, the permissive closure. A per-language context is the projection over that language's composed features (§4), narrowed by what its bindings claim and by its slot model; the derivation of those is the next step (§11).
- **Interfaces are narrow at the top and expand toward the leaves**, the opposite of the namespaces. A level no grammar claims carries exactly the members every claimed kind beneath it carries, required only when required in all of them; a claimed level carries its own claim's members; a leaf carries everything its claims give it; a refinement extends its parent and adds or pins. `Declaration<G>` therefore holds little beyond its discriminant, `Declaration.Function<G>` holds a function's full shape, and `Function.Generator<G>` adds `generator: true`. A shared member admits the union of what the kinds beneath admit, so a leaf narrows it. `T | T[]` where the kinds beneath disagree on multiplicity.
- **Every interface carries `kind`**, the dotted path as a string literal: a leaf's own path, a level's the union of every claimed path beneath it, a refinement's its own path. It is the discriminant that makes `Declaration.Kinds<G>` usable as the type for "any declaration": shared members read directly, the rest after narrowing on `kind`, and it is the same `kind` a structure carries (§8). A grammar field spelled `kind` (typescript's `let` / `const` keyword) takes a converged name in the bindings, never the discriminant's.
- **`Unmapped<'grammar:kind'>`** is a nominal placeholder for a grammar kind a member admits that no binding claims yet. It keeps the gap visible in the types and keeps the subtype relation honest; its count is the work list of the next bindings pass (319 at the time of writing).
- **A refinement only narrows.** It may add members, narrow a member's kind-set, and pin an enumeration; it never makes a parent's required member optional. The compiler reports the widening as an incorrect `extends`.
- **The derived union table** (grammar union → vocabulary kinds) is what the inventory computes from each grammar's supertypes with full-coverage admission; it is how the per-context kind-sets are read.

## 6. Convergence rules

Names converge before kinds. Both passes are recorded, member by member, in `2026-09-13-base-vocabulary-draft.md`; the rules are:

**Names.** Rules (1) and (2) are applied by the derivation to every slot, so the bindings never spell them; a capture renames a slot only for the kinds whose claims carry it, never grammar-wide. (0) Two languages share a member only when the feature behind it is the same, never because the slots look alike: typescript's `extends` (single inheritance), its `implements` (interface conformance) and python's bases (multiple inheritance) are three members of three features, and the earlier `heritage` that merged them is reversed. (1) A marker boolean takes the keyword it marks. (2) A modifier enum takes the noun. (3) Layout is not a member. (4) Containers keep the shared name (`parameters`, `arguments`, `body`, `statements`, `typeParameters`, `typeArguments`). (5) Otherwise the majority upstream name over the claiming grammars wins; a tie is a recorded choice.

**Kinds.** (1) Containers unwrap to their element kind-set as a list. (2) A wrapper clause that carries one member around punctuation is transparent: typescript's type annotation makes `returnType: type`; python's suite forms make a function body `statement.block`, the encoding chosen at build time. (3) A member's kind is the smallest kind-set covering every grammar's admitted set. (4) Text leaves are strings. (5) Exclusive markers decompose. (6) Inclusion is a DAG with full-coverage admission and flattened unions. (7) Refinements narrow, never widen.

Where a grammar's set is narrower than the base (rust's `body` required and a block only), the per-language context carries the narrowing; nothing is re-authored.

## 7. Template regexes

A `#match?` predicate whose regex is anchored at both ends and made of literal runs and holes is a template: the literals are injected on build, the holes are inputs on build and members on read. Every hole is a named group; the member takes its name; the leaf adds it beside the parent's members (`declaration.method.dunder` has `stem: 'init'` while `declaration.method` keeps `name: '__init__'`). The hole's type is the template literal type (`` `__${string}__` ``), and a hole with a character class is validated on construction. Outside the subset — unanchored, backreferences, lookaround, a quantified literal, alternation that is not itself a template with the choice as a member — a regex is read-only and the inventory says why.

## 8. The structure API

A **structure** is a plain object satisfying a vocabulary interface, discriminated by `kind`, the dotted path. It is `Base<G>` instantiated over a **structure context**, where each namespace's set is the union of structure types rather than node types and leaves are text; a per-language structure is the same over that language's context. Structures are serializable and carry no language.

- **`from(structure)`** builds through the binding's write direction: structure kind → factory, member → slot. It accepts the **loose** form: the strict shape with each member widened to what the slot can disambiguate, derived by one mapped utility, never authored.
- **`$structure()`** on a node returns the **canonical** form, every member spelled, every `kind` present, the most specific kind reported. Canonical is a subset of loose, so the public surface has one structure type per kind.
- **Deviation is a type error where it should be.** A structure handed to a language whose context lacks its kind fails on the kind; one that omits a member that language requires fails on `Require`; one that carries a member that language lacks fails because the language's structure states that member as `never` (the `Absent` utility), so an excess member is an error rather than a silent drop. What a language lacks is decided by its feature composition (§4): a kind or member none of the composed features contain is absent, which is what makes the lookup resolve to `never` rather than to an unconstrained `unknown`.
- **Coercion**, by the slot: a number is the shortest round-trip decimal, an integer in an integral slot and a float where the slot admits only floats (rust gets `0.0` from `0`), and anything that spelling cannot express is given as a string and kept verbatim; a boolean and `null` coerce to a kind (`literal.boolean.true`, `literal.null`) the language spells; a string is an identifier in an identifier-only or mixed slot and a string literal in a string-only slot; an array is a list with elements coerced; an object's `kind` may be omitted exactly when the slot admits one kind. Runtime validates what the types check, since a structure can arrive from JSON.
- **Positional builders** (`d.method(M.Pub | M.Async, 'deposit', …)`) remain the ergonomic authoring form and produce the same nodes; the structure form is the data interchange.
- **A refinement the target lacks degrades to its parent.** A refinement is assignable to its parent by construction, so a python `parameter.typed` structure builds through typescript's `parameter`, and a rust `interface.trait` through typescript's `interface`, as long as it carries no member the target lacks; an excess member (`unsafe`) still fails as `Absent`.
- **A leaf name unique within its top-level namespace is hoisted to that namespace's root.** `declaration.trait(...)` is `declaration.interface.trait(...)` and `expression.add(...)` is `expression.binary.arithmetic.add(...)`; the path form always exists and the hoisted form is an alias to it, never a second builder. A name that occurs under more than one parent (`signature` under `method`, `function` and `field`; `static` under `method` and `variable`) keeps its path, and the inventory reports the collision rather than guessing. Types follow the builders: `Declaration.Trait<G>` is an alias of `Declaration.Interface.Trait<G>` under the same rule, so a language's term-bound name is the hoisted refinement itself.

## 9. Runtime model

Unchanged in mechanism: one query pass over `shape.scm ++ bindings.scm ++ user.scm`, flat captures materialized to `NodeData`, a native layer that knows captures and nothing about roles, range-scoped and on demand, user-pluggable without regeneration. Totality of the reader is gated by a differential harness against the generated readers on corpora including malformed files before the executor replaces anything. The ast-grep seam shares the tree.

## 10. Verification

1. **Totality and injectivity**, computed from `grammar.json` and the bindings by the inventory: every meaningful visible kind claimed or unclaimed with a reason; no two kinds in one grammar share a leaf; the unclaimed count only falls.
1b. **The bindings compile**: `sittir tool bindings-inventory --check` builds each `bindings.scm` against its grammar's parser and reports tree-sitter's own error for a bad node name or field; the set of compiling grammars is a ratchet in `packages/tools/tests/inventory/bindings-inventory.ceiling.json`.
2. **Inclusion is a DAG**: the inventory reports cycles; there are none.
3. **The vocabulary type-checks**; a widening refinement fails there.
4. **`Unmapped` only falls.**
5. **Read-side differential** against the generated readers, unchanged.
6. **Structure round trip**: read, `$structure()`, `from()`, render, parse-equal, over the corpus, as the validator lane that measures coverage for the coercer's retirement.
7. **Template regexes**: a dunder built from a stem re-parses to the claim; a bare hole is rejected at lift.
8. **Cross-language errors**: `Python.Declaration.Interface` and a rust `whereClause` handed to python fail at compile time, because python composes neither `interfaces` nor `bounded-quantification`'s where clause; a `Base.Declaration.Function` consumer compiles unchanged against all three contexts.
9. **Feature closure**: a member's feature set is a subset of the union of its kind's feature sets; a claim outside the language's composition and a composed feature with no claim behind it are both inventory diagnostics.

10. **Terms are aliases**: a Swift `typealias` structure read as `declaration.type_alias` builds in rust as a `type` item and reads back with the same path; a term never changes what `$structure()` emits.
11. **Consumer-seat checks**, compile-time, in `packages/types/tests/vocabulary-consumers.test-d.ts`: an ordinary function, method, call and binary satisfy their base interfaces; a getter pins `'get'`, `Add` pins `'+'`, an increment cannot omit its operand; once the per-language projections exist, a rust `whereClause` on a python function and a rust function without a body are the negative cases.

## 11. Next

- The feature table as `packages/types/src/vocabulary/features.ts`, hand-maintained, from §4.3; one composition per language beside its context, with its term bindings.
- Per-language contexts from each language's composition narrowed by its claims, which is what makes cross-language errors fire.
- Applied: the reversals the feature lens forces, in the tree and the bindings: `accessibility` into `visibility`; `heritage` into `extends` / `implements` / `bases`; `declaration.trait` under `declaration.interface` as the refinement `declaration.interface.trait`; and the placement audit of every single-grammar kind (§12).
- The seed generator (§2.2): the tags table, highlights token captures, model expansion, the compose rule in the inventory, and the migration of the three authored files into overrides by diffing each against its seed; python first, as the proof.
- The exhaustive-capture pass that §2.1 now requires: every member the tree keeps is spelled by a capture, and the tool reports members the tree carries that no capture names.
- The next bindings pass, driven by the `Unmapped` counts.
- The inventory's totality and injectivity gates, and a diff mode reporting where the bindings and the authored tree disagree.
- The structure builders and `$structure()`, then the round-trip lane, then the coercer's retirement.

Open: trivia and provenance on a structure (a structure has no coordinates; `doc` survives as a member, free trivia needs a `trivia` member or is declared lost); the names of the read-side consumer surface (`roles.as/is/find`) now that the file is `bindings.scm`.

## 12. What changed from the earlier design

| earlier | now |
| --- | --- |
| `roles.scm` at the repo root | `packages/<grammar>/bindings.scm`; the file maps the high-level API onto the low-level one |
| the normalized surface is per grammar and cross-language construction is not a goal | the structure API is the cross-language path, typed by base against language contexts |
| builders coerce through the factory layer's `coerceTo*` | the high-level layer owns coercion; the low-level layer is strict only; the coercer retires |
| nested config objects are not part of the surface | structures are the object form, a separate entry point from the positional builders |
| grammar supertypes claimed where present | never claimed; namespaces are the supertypes; membership derived per context |
| containers claimed as kinds where visible | bound through their elements; positional claims only for degenerate structured kinds |
| an `argument` role kind considered | none; a positional argument is the expression |
| refinements under the nearest namespace regardless | prefix is a kind-set strictly; role namespaces `clause`, `argument`, `element`; `declaration.enum_member` |
| `modifiers` as a bag or bitflags on the read side | keyword modifiers decompose into members; bitflags remain a positional-builder convenience |
| enumerations as kind ids or per-label enums | const strings, the token's text |
| free-text predicates never liftable | template regexes with named holes invert; only the non-template residue is read-only |
| language-only kinds unclaimed or in extension namespaces | bound under their semantic namespace with a qualifier |
| authored `vocabulary.ts` type tree, one file | authored, one file per namespace, drafted once by the derivation: interface + namespace per level, `Kinds<G>`, `GrammarContext` typemap keyed by top-level namespace |
| context `G` keyed by vocabulary kind | keyed by top-level namespace, projecting kind-sets |
| `Base<G> & Delta` per grammar as the checker | subtyping by construction; an ancestor types a shared member as the union of what the kinds beneath admit, so a child that widens it fails its `extends` |
| a level's member optional where not every descendant carries it | interfaces narrow at the top, expanding toward the leaves: an unclaimed level carries only what every claimed kind beneath it shares, a claimed level its own claim, a leaf everything; every interface carries the `kind` discriminant |
| per-language contexts projected from each grammar's claims alone | a language is a composition of features, narrowed by its claims; features and terms are the portability API |
| `heritage` converged across `extends`, `implements` and python's bases | three members of three features; members are shared by feature, never by slot |
| `accessibility` beside `visibility` | one `visibility` member, its shape per language |
| member captures under the delta principle, the slot model supplying the rest | captures are constructive and exhaustive; the slot model only types what a capture names |
| one authored `bindings.scm` per grammar | a generated `bindings.seed.scm` from upstream tags and highlights plus the model, overridden per claimed kind by the authored `bindings.scm` |
| `declaration.trait` beside `declaration.interface` | a refinement, `declaration.interface.trait`: an interface with what only a trait has |
| `declaration.impl` | `declaration.extension`, rust's `impl` and Swift's `extension`; `impl Trait for T` is `extension.conformance` |
| `declaration.property` for a typescript property signature | `declaration.field.signature`, as `method.signature` is to `method` |
| `declaration.method.trait` | a trait's method is `method` with a default body or `method.signature` without |
| `declaration.parameter.type` | `declaration.type_parameter`, its own kind: it never carries a value |
| `declaration.decorated`, `declaration.ambient`, `statement.labeled`, `class.static_block`, `module.extern_crate` | containers assign `decorator`, `declare` and `label` to their element; a static block is `statement.block.static`; an extern crate is `statement.import.crate` |
| `statement.for` as the parent of `for.in` | the loop family: `loop` (body, label) refined by `loop.while`, `loop.do_while`, `loop.for` (a subject) and `loop.counted` (initializer, condition, update) |
| `statement.with` shared by python and typescript | python's is resource management; typescript's legacy scope injection is `statement.scope` |
| rust `expression.cast` beside typescript `cast.as` | both `expression.cast.as` |
| `collection.list` and `collection.array`; `expression.generic` and `instantiation` | one kind each: `collection.list`, `expression.instantiation` |
| `clause.annotation` and its variants | transparent wrappers: the annotated member takes the type |
| `type.member`, `type.scoped`, typescript's nested type identifier | one kind, `type.path` |
| `type.never` claimed by rust alone | `type.primitive.never`, claimed by typescript's `never` too |
| decorators claimed as `attribute` | `attribute.decorator`, a refinement whose content is an expression |
| rust enum variants as one `enum_member` | payload shapes are refinements of the member: `enum_member.tuple`, `enum_member.struct` |
| language-specific names erased into the canonical vocabulary | terms: a feature's names are parameters a language binds, aliases in both directions over one canonical path |
