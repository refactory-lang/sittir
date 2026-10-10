# Bindings, the vocabulary and the portability API

**Status:** Design spec. Supersedes the earlier "Role Interfaces & `roles.scm`" design.

## 1. Two APIs, and the map between them

sittir has two construction surfaces. The low-level surface is shaped by each grammar. The portable surface is shaped by the vocabulary, which is the same for every language. The bindings say how one grammar realizes the vocabulary, and the generator turns them into **the map**: the only artifact the bindings produce.

| layer | what it is | source of truth | made by |
| --- | --- | --- | --- |
| **low-level API** | one builder per grammar kind, with exact kinds and kind ids; a strict form that coerces nothing and a loose form that coerces each slot's input by the slot | `grammar.sittir.ts` and the tree-sitter grammar | generated |
| **vocabulary** | the portable API: semantic kinds shared across languages, their refinements and flags, members by role, the structures that satisfy them (§8) and the nodes a portable read returns (§9) | `packages/types/src/vocabulary/` | authored |
| **features and terms** | which vocabulary kinds, members and flags a language has, and what it calls them (§4) | `packages/types/src/vocabulary/features/`, a folder per feature, and one composition per language | authored |
| **bindings** | which grammar node is which vocabulary kind, which slot is which member, which token or node states which fact | `packages/<grammar>/bindings.scm` | authored |
| **the map** | the bindings resolved against the grammar's slot model and the vocabulary's declarations: for each vocabulary kind the factories that build it, for each member the slot it lands in, and for each flag the token or kind whose presence it is; for each grammar kind the vocabulary kind it is | generated with the grammar package (§5) | generated |

- **Each surface is an engine.** `createEngine(lang)` gives the low-level surface and `createEngine(lang, { api: 'portable' })` the portable one, through the reserved `ApiSurface` option. The portable engine's `build` builds structures (§8), its `parse` reads portable nodes (§9), and its `render` renders them directly, dispatching on `$type` (§9). A node moves to another engine only through the target engine's `attach` (§9).
- **The vocabulary is a designed API, not a derived one.** Its interfaces are written by hand, under the rules of §3. The bindings never generate them. The inventory checks the map against them (§10), so a binding that names a member the vocabulary lacks, or a vocabulary member no binding of a composed language reaches, is a diagnostic.
- **The portable surface builds through the low-level loose surface.** A structure's member is routed by the map to a slot, and the value is handed to that slot's loose coercer. Coercion therefore has one table: the loose contract (`docs/factory-surface-issues.md`, "The contract: loose = strict + six coercions"). The portable layer adds no coercion of its own beyond what §8 lists.
- **A binding is bidirectional.** A constructive pattern, one that fixes every node it would emit, serves reading (§9) and building (§8). Only a predicate outside the invertible subset (§7) is read-only, and the inventory names it.
- **Coverage of the portable surface** is measured by a validator lane that parses a corpus file with the portable engine, builds every node again from its members, renders and re-parses (§10).

## 2. `bindings.scm`

One file per grammar package, `packages/<grammar>/bindings.scm`, written in tree-sitter's query language. It states every role fact for its grammar; nothing else does.

### 2.1 Form

- **Sixteen sections in a fixed order,** identical in every file, an empty section left visible where a grammar has nothing: `module`, `declaration`, `statement`, `clause`, `argument`, `element`, `expression`, `pattern`, `type`, `literal`, `identifier`, `modifier`, `attribute`, `comment`, `keyword / punctuation`, `unclaimed`.
- **One claim per line,** the parent before its refinements, refinements in the order of the vocabulary.
- **Kind claims** are dotted captures on nodes: `(binary_expression) @expression.binary`. A single-segment capture alone on a pattern's top node claims the namespace's root kind: `(identifier) @identifier`.
- **Member captures are constructive and exhaustive.** A claim's members and the facts it routes are exactly its single-segment captures on nested nodes and on tokens. Every non-layout slot of a claimed kind is captured, as a member, as a fact or as `@dropped`, and the inventory fails on a slot that is none of them; a dropped slot is not a member and has no route in the map.
  - The capture's name is the converged member name (§6), whether or not the upstream field already spells it: `(class_definition superclasses: (_)? @bases)`.
  - A deep capture reaches through a wrapper to the node that matters, so nesting artefacts (`content`, body wrappers, hidden arms) exist only where a capture names them: `(class_declaration (class_heritage (extends_clause (_) @extends)))`.
  - A capture on a token names the fact its presence states: `"async" @async`. A second single-segment capture on a node names the fact that the node's kind states in the slot the first capture names: `name: (private_property_identifier) @name @privateName` states `privateName` where the name is a private name, and a build that states `privateName` builds a private name.
  - **An identifier is a slotless leaf.** No claim puts a member on an identifier node. An identifier kind has no `content` member either, the root's or an alias's (`identifier.field`, `.label`, `.property`, `.property.shorthand`, `.type`): its text is the node's `$value` (§9). A bare identifier in a role slot stays an identifier; the slot names its role. Its kind does not change, so neither a claim nor an overlay pretends it does: a python or lambda parameter list, a rust closure's parameters and a typescript arrow's parameter hold it as an item typed by a union, `Parameter | Identifier`. Where the grammar gives the leaf a kind of its own, an alias, the vocabulary has one too and the alias claims it: typescript's shorthand property, `shorthand_property_identifier` in an object and `shorthand_property_identifier_pattern` in a pattern, claims `identifier.property.shorthand`, a memberless identifier kind. The two grammar kinds have one shape, and expression or pattern is their context, so they claim one kind. Rust's `shorthand_field_identifier` claims it too, since it is a name that is both key and binding: in `let Foo { a } = x` it is the name of a `field_pattern` with no `pattern` (§6, rule 8). A bare identifier has no kind of its own in the grammar, so it stays `identifier`.
  - A capture on a nested node is a member of the top claim, reached along the pattern, anchors (`.`) included: python's docstring is `(function_definition body: (… (block . (… . item: (expression_statement (string) @doc)))))`, the function's `doc`, the string that opens its body. The string stays a `literal.string`. A claim sits on a nested node only under an envelope, which sets the fact it names on the element it unwraps (§9).
  - A captured node finds its slot by its field, else by its kind, else by position: an unfielded wildcard names the first node slot after the slot of the node pattern before it, so `(index_expression (_) @object (_) @index)` names both slots in order and a token before a wildcard does not count.
  - The slot model types a captured member (kinds, multiplicity, requiredness) and confirms that the capture resolves to a slot; it never adds a member.
  A claim is unconditional, so an optional member named in a claim carries a quantifier (`?`, `*`, `+`) and the claim matches whether or not the member is present.
- **Refinements** are the parent's pattern with a literal fixed: `(binary_expression operator: "+") @expression.binary.arithmetic.add`.
- **A claim names a fact, never its form.** A fact with no data is a refinement or a flag, and which one is the vocabulary's declaration (§3.3), never the bindings'. A claim names the fact by its path, the owner's path and then the fact: `(method_definition accessor_kind: "get") @declaration.method.getter` names `getter`, and `(abstract_class_declaration) @declaration.class.abstract` names `abstract`. A single-segment capture names a member or a fact of its claim's kind, as `"async" @async` does. The generator resolves each name against the vocabulary's declarations: a path segment to a kind, to a value of one of the kind's axes or to one of its flags, and a single-segment capture to a member, a flag or an axis (§5.2). The bindings never say which form a fact takes, so a fact the vocabulary reclassifies changes no line of `bindings.scm`. A name that resolves to nothing the vocabulary declares is a diagnostic.
- **A value spelled by a node of its own is claimed on that node,** by its path beneath its axis's root, and each owner's capture of the node names the axis: `(accessibility_modifier "private") @modifier.visibility.private` with `(method_definition (accessibility_modifier) @visibility)` reads a private method as `declaration.method.private`. So the bindings claim no owner × value. A member the value adds is routed on the value's claim (§3.3).
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
- **Containers.** A list holder with no members of its own (`argument_list`, `parameters`, a class body, a use list) is bound through its elements: by the elements' own claims where they have them. A bare identifier in a role slot stays an identifier, and the slot names its role (§2.1): a bare identifier in a python parameter list is an item of the parameters, typed `Parameter | Identifier`. A name alone in a typescript enum body is not bare: the grammar gives it a node, `enum_body_element_name`, the body's name arm lifted with a `name` slot, so it is claimed as a kind, `declaration.enum_member`, beside `enum_assignment`. The parser's kinds decide, here as for a bare identifier. A value in argument position supplies nothing but itself, so there is no `argument` role kind for it: a positional argument is the expression.
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

### 3.3 Refinements, flags and members

A fact the vocabulary states about a kind takes one of three forms: a refinement, a flag or a member. Which one is the vocabulary's declaration: its authors decide it, informed by the grammars, and declare it on the fact (§3.4). The bindings name a fact the same way whatever its form (§2.1). The generator maps each claim onto the fact the vocabulary declares, and never infers a fact's form from a grammar's shape: a choice, a keyword or a slot's arity decides nothing (§5.2).

- **A refinement narrows, never widens.** It may add members and narrow a member's kind-set; it never makes a parent's required member optional, and it never admits a kind its parent does not.
- **A fact that picks one of several values is a refinement axis.** Its values are kinds in the namespace path, and a node's path names the value it has. A method's visibility is `declaration.method.public`, `.public.internal`, `.public.restricted`, `.protected` or `.private`; its accessor kind is `declaration.method.getter` or `.setter`; a rust receiver is `declaration.parameter.self.owned` (`self`, `mut self`), `.reference` (`&self`) or `.reference.exclusive` (`&mut self`); a binary's operator is `expression.binary.arithmetic.add` and its siblings. No member holds an axis's value, so the portable surface has no enumeration type. A node whose source states no value of an axis is its unrefined kind: a method that spells no level is `declaration.method` (§4.3).
  - **An axis many owners share is declared once.** Its values are kinds beneath the axis's root, nested where one value includes another: the access levels are `modifier.visibility.public`, `.public.internal`, `.public.restricted`, `.protected` and `.private`. A value's kind declares its `$kind` and the members its value adds, and nothing else. The bindings claim a value on the node that spells it (§2.1).
  - **Every owner × value is a refinement kind.** `<owner>.<value>` extends its owner and is named by the value's path beneath the axis's root, one namespace per segment and never flattened: `declaration.function.public.internal` extends `declaration.function.public`, which extends `declaration.function`.
  - **A value may add members, each owned by a feature.** `public.restricted` adds `scope`, the ancestor module that `pub(super)` and `pub(in path)` name. `scope` is owned by `scoped-visibility`, which extends `visibility`. The feature writes the member on the value's kind, as it writes a member any kind gains (§4.1): `Modifier.Visibility.Public.Restricted<G> { readonly scope: G['identifier'] }`, in `scoped-visibility`'s folder. The generator gives the member to each owner's `public.restricted` refinement, gated, and the bindings route it on the value's claim, `(visibility_modifier_pub (visibility_modifier_pub_scope […]) @scope) @modifier.visibility.public.restricted`, so the inventory finds the route where the vocabulary declares the member.
  - **Owner × value refinements are generated.** The vocabulary states each value once, as its kind. `sittir tool vocabulary-features` writes every owner × value into `augment.ts` as a named interface extending its owner, in the same pass that writes the feature kinds and the levels (§4.4). `--check` fails when the committed output drifts from what the folders generate.
  - **Axes are ordered, structural first.** A kind's axes have one order, the vocabulary's: what the construct's shape decides (the signature, the accessor kind) comes before a modifier's value (the visibility). A public getter's signature is `declaration.method.signature.getter.public`, and every node has one deepest kind. Flags have no order (below).
  - **A node's refinement changes with `$as`.** `node.$as(<refinement>)` swaps one axis value and keeps everything else. Its details belong to the edit model.
  - **An operator is always an axis value.** No member holds one, wherever it appears: rust's macro repetition is `element.macro.token_repetition.zero_or_more` (`*`), `.one_or_more` (`+`) or `.zero_or_one` (`?`), python's complex-number pattern is `pattern.case.complex.add` or `.subtract`, and its splat pattern is `pattern.case.splat`, or `.dictionary` for `**`.
- **A yes/no fact is a flag unless it changes eligibility.** It is a flag only if it changes neither what the node admits, its slots and children, nor the slots that admit the node. A fact that changes either is a refinement kind. A flag reads as freely toggleable, and a consumer must never take a `try` block for a block with a bit it may clear.
  - **What the flags are.** They include `static`, `async`, `abstract`, `readonly`, `declare`, `override`, `const`, `unsafe`, `default`, `move`, `accessor`, `optional`, `definite`, `generator`, `big`, `imaginary`, `privateName` and `computed`, and a binding's facts (below).
    - A method's `static` is one flag in every language: python's `@staticmethod`, typescript's `static` and rust's associated function without a receiver set it. A python `@classmethod` is a plain `declaration.method`, and no fact holds a method's binding to its class.
    - `async` names every async form: a function, a closure, typescript's `for await`, and python's `async for` and `async with`.
    - Rust's function modifiers decompose alike on a function and on a signature: the flags `async`, `const`, `unsafe` and `default`, and `extern`, a member holding the `modifier.extern` that names the ABI.
  - **A binding's facts are flags** of variables, parameters and patterns: `mutable` (typescript's `let` and `var`, rust's `mut`), `functionScoped` (typescript's `var`), `byReference` (rust's `ref`), and `disposable` (typescript's `using`), with `await` beside it for `await using`. A typescript `const` is a variable without `mutable`. A compile-time constant is a kind of its own, `declaration.constant`: rust's `const` and `static` items, and python's upper-case names by convention.
    - `mutable` is the binding's mutability, everywhere. A reference's is `exclusive`: `&mut T`, `&mut x` and `&mut pat` set it, and the receiver's `.reference.exclusive` names it. `ref mut x` sets `byReference` and `exclusive`, though its grammar nests the `mut` in a mutable pattern.
  - **What changes eligibility is a refinement kind.**
    - A rust block's `try`, `async`, `gen`, `const` and `unsafe` are refinements of `expression.block`: each wraps a body block, fifteen slots admit only a plain block, and a const block is a pattern as well. `move` is a flag of the async and gen blocks, so `async move { }` is `expression.block.async` with `move` set.
    - Typescript's class `static` block is `statement.block.static`, which only a class body admits.
    - Typescript's abstract method signature is `declaration.method.signature.abstract`: only a class body admits it, and it admits no `async`, `readonly` or `static`.
    - Typescript's definite variable (`let x!: T`) is `declaration.variable.definite`: its name is an identifier, its type is required, and it has no initializer. A field's `definite` is a flag, so one fact can be a flag on one kind and a refinement on another.
    - Typescript's optional tuple member is `element.tuple.member.optional`, whose name admits no rest pattern.
    - Rust's const generic parameter is a refinement of `declaration.type_parameter`, whose name is open (§11): it admits a type and a value, where a type parameter admits bounds and a default type.
    - A raw string, `literal.string.raw`, admits no escape sequence, and rust's extern ABI admits only a plain string.
    - `yield*` and `yield from`, `expression.yield.delegate`, require their operand.
    - `asserts x is T`, `type.predicate.asserts`, holds a predicate where a type predicate holds a name and a type.
  - **A node's flags are one bitflag.** A flag is declared on the kind that has it and holds for every kind beneath, and it has one owner, as a member does (§4.1). It is not a member: on the surface it is an is-guard and a builder step (below), and its guard passes alongside every refinement of its kind, so `is.declaration.method.static(x)` holds for a static getter.
- **Members carry data:** a name, parameters, a body, the module `pub(in path)` names. A fact with no data is a refinement or a flag, never a member, and no member restates one: nothing holds an operator, an access level or a getter's `get` beside the kind that says it. A sign is data, since it changes the value: a float exponent's `sign`, and the sign of a python complex pattern's real part.
- **A spelling is a render option's or a kind's.** A distinction that says only how a construct is spelled belongs to the render option that the grammar's options block lists for it, and is no fact of the node: an integer's radix prefix (`0x` or `0X`) is an option in typescript and python, and a float's exponent marker (`e` or `E`) in typescript. A spelling no option lists stays a refinement kind: a float's `leading_point` (`.5`) and `scientific` (`1e5`), python's `literal.string.triple`, a bare tuple (`expression.collection.tuple.bare`, `pattern.tuple.bare`) and rust's `type.generic.turbofish`. No member holds a spelling.
- **Builders and guards follow the path.** A refinement's builder is its path: `build.declaration.function.public.internal(…)`. A flag is a step after it, the steps in any order, each setting its bit: `build.declaration.method.public.static.async(…)`. Refinement builders and flag steps are the only form a refinement or a flag takes in a build (§8), and `is` follows the same paths (§9).
  - **A guard tests each fact its path names,** not the path as a prefix: `is.declaration.method.public(x)` holds for a public getter, `declaration.method.getter.public`, as `is.declaration.method.static(x)` holds for a static one. The kind-set (§3.2) still decides what a member admits.
  - **A flag's guard and step are spelled as a refinement's are,** so `is.declaration.method.static(x)` and `build.declaration.method.static(…)` would read the same if the vocabulary declared `static` a refinement. Only the types differ: a refinement has an interface of its own, and a flag has none.
  - The generator takes each kind's axes, values and flags from the vocabulary's declarations, through the vocabulary reader it plans with; no file lists them.
- **A language's text is a const string.** A token the language spells that a member holds is held as the language spells it, never as a sittir kind name or a grammar's kind id, typed per language as a string-literal union: rust's `i32` in an expression slot is `'i32'`. The const string is the literal's identity on the portable surface, as the kind id is on a grammar's (§9). A refinement that a token spells derives the token from the kind per language, so `expression.binary.logical.and` builds as `&&` in typescript and `and` in python. A fixed literal's meaning lives on its parent's refinement (`expression.assignment.compound.add`), never on the leaf.
- **A fact about a property is the property's.** What a property's name says of the property sits on the node that declares or reads the property, never on a kind of the name:
  - a private member (`#x`) is named by an `identifier.property`, and the field, method or member access that holds the name has the `privateName` flag, owned by `encapsulation` (§4.3) and named apart from the `private` level. In a brand check (`#x in obj`) the private name is the left operand of a binary `in`, which admits it in a language that composes `encapsulation`, with no kind of its own;
  - a computed key is its expression, and the property has the `computed` flag, owned by `computed-keys`;
  - a shorthand property follows its grammar's kinds (§6). Typescript spells it as a leaf, the property and its name at once, so the fact is that node's kind: `{ a }` holds an `identifier.property.shorthand` (§2.1). Rust's struct pattern `Foo { a }` holds one as its field's name, which is key and binding at once.

  The rule also covers a language that declares access on the member rather than in the name: a C++ member's access is its visibility refinement.
- **A grammar's shape kinds are told apart by the facts they state.** Injectivity (no two kinds of one grammar share a leaf) counts a node's refinements and flags. A fact a flag states is never a refinement kind as well: typescript's `abstract_class_declaration` claims `declaration.class` with `abstract` set, its `generator_function_declaration` `declaration.function` with `generator` set, and its `optional_parameter` `declaration.parameter` with `optional` set, so the flag tells each from its plain kind. A refinement may also name a shape of the node's own data that is a category of its own, as `dunder` names a method's: `.signature`, a declaration with no implementation; `clause.case.default`, a case with no value; and `declaration.module.external`, rust's `mod a;`. A member's presence alone is no refinement: python's typed and default parameters are `declaration.parameter`, with `type` and `default` present.
- **Placement: one test.** Compare two languages' constructs member by member, leaving out members a feature the other language does not compose would make absent (§4.4):
  - the same members under a different keyword: one kind, two terms (`type_alias`, `module`, `constructor`, `throw`, `extension`);
  - everything the other construct has, plus members of its own: a refinement under it (`interface.trait`, `field.signature`, `loop.for`, `loop.counted`, `enum_member.tuple`);
  - neither: sibling kinds (`class` and `struct`, `match` and `switch`, `with` and `scope`);
  - a wrapper or a keyword: a flag, a member or a transparent container (`async`, `decorator`, `attributes`, a type annotation), or a kind of its own where the wrapper's element is only a supertype (`declaration.ambient`, `statement.labeled`).
  A rust trait has everything a typescript interface has, once typescript's index and call signatures are left out as members of `structural-conformance`, which rust does not compose; it adds default method bodies and associated items. So it is `declaration.interface.trait`, and a Swift protocol is `declaration.interface.protocol`. That keeps the distinction SCIP keeps between interface, trait and protocol, while cross-language reading sees each of them as an interface.
- **A read classifies to the deepest kind.** Classification is by match, never by construction route. `build.declaration.method({ name: '__init__', … })` builds the same tree as `build.declaration.method.dunder({ stem: 'init', … })`, both read back as `declaration.method.dunder`, and `is.declaration.method.dunder(x)` holds for both. An axis takes the value its route reaches, and a flag is set by the token or kind its route reaches: a rust method declared `pub(crate)` reads as `declaration.method.public.internal`.

### 3.4 How the interfaces are written

- **One file per top-level namespace,** plus `context.ts`, `index.ts`, the feature folders under `features/` (§4.1), the languages' compositions in `compositions.ts` (§4.1), and the generated `augment.ts` and `features/index.ts` (§4.4).
- **Every level is an interface merged with a namespace:** the interface carries the level's members, the namespace its children. A leaf is an interface alone.
- **Every interface is generic over the language context:** `Name<G extends GrammarContext<G>>`, with `G` passed through every cross-reference. Cross-references go through one import alias (`V.Expression.Call<G>`), so a local interface never shadows a namespace.
- **Each namespace exports `Any<G>`,** the union of every kind beneath it, the prefix itself included when it is a kind. A level is the vocabulary's: it holds every kind beneath it, whichever feature adds it, and a language's own level is its context's key. Features add kinds beneath a level, so the unions are generated, into `augment.ts` (§4.4).
- **`GrammarContext<G>` is the namespace map.** It has one key per top-level namespace, typed by that namespace's level over `G` (`V.Expression.Any<G>`), and the slot table, each slot typed by its permissive fill over `G`: roles and refs where its arms are kinds, and `string` where they are text.
  - Every context parameter is bounded by the map over itself, `G extends GrammarContext<G>`. A consumer generic over the context therefore reads a role or a slot through the constraint, as its permissive fill types it: over the binding prototype's vocabulary, `fn.name.$kind` type-checks for every `G`. How the map types a role some context fills with text is open (§11).
  - A language's context is generated with its map (§5). It extends the map over itself, `GrammarContext<PythonContext>`, and narrows each key to what its grammar realizes.
  - There is no permissive context: portable code is generic over the context (§4.4).
- **Interfaces are narrow at the top and expand toward the leaves.** A level carries the members every kind beneath it carries, required only where required in all of them; a leaf carries its full shape; a refinement extends its parent and adds or narrows. `Declaration<G>` holds little beyond its discriminant, `Declaration.Method<G>` holds a method's full shape, `Method.Dunder<G>` narrows `name` to `` `__${string}__` `` and adds `stem`. A shared member admits the union of what the kinds beneath admit, so a leaf narrows it; `T | T[]` where the kinds beneath disagree on multiplicity.
- **Every interface carries `$kind`,** the dotted path as a string literal type: a leaf's own path, a level's the union of every path beneath it. It is the discriminant that makes `Declaration.Any<G>` usable as "any declaration" in the types. The `$` marks it as sittir's own member, as on `$type` and `$value`, so it never collides with a grammar slot named `kind` (typescript's `let` / `const` keyword). A flag is no part of `$kind`, since a flag is not a kind (§3.3); a structure states its flags in `$flags` (§8). On a structure (§8) `$kind` is optional data, required only where the context does not decide the kind:
  - a builder call names its kind, so the object passed to it needs no `$kind`;
  - a nested plain structure needs `$kind` only when its slot admits more than one kind; a slot with one admitted kind decides, as it does for a bare string;
  - the root of a generic build entry needs `$kind`.

  On a node `$kind` is type-only: a portable node's type carries it to select the node's interface, and no value exists at run time. The runtime tag is `$type`, and `is` decides a node's kind from `$type`, the node's own predicates and its flags (§9). Low-level configs name their kind the same way with `$type`, through a generic `build` keyed by it; a portable structure uses `$kind` because `$type` is per grammar.
- **A refinement extends its parent with `$kind` narrowed to its own path:** `extends SubKindOf<Parent<G>>`, where `SubKindOf` (in `utils.ts`) maps the parent's members over unchanged except `$kind`, which becomes the template `` `${parent}.${string}` ``, and the refinement declares its literal. The checker then reports a refinement that widens a shared member as an incorrect `extends`. Because the namespace map types every slot, that check reaches slot-typed members too: a refinement's fill must fit within its parent's. `SubKindOf` is applied to interfaces only, never to a union.
- **Each fact is declared with its form.** An axis is declared on the kind whose refinements it names, with its values as kinds and its place in that kind's axis order; a shared axis has its values beneath a root of its own (§3.3). A flag is declared on the kind that has it, and holds for every kind beneath. Each has one owner, the base or a feature, as a member does (§4.1). How a flag is written in TypeScript is chosen by measurement, as the levels were (§4.4): the features probe writes the candidate forms, a numeric `enum` of bits first among them, and measures them like for like.
- **Hoisted names are declared.** A leaf may be given an alias at its namespace's root (`Declaration.Trait<G>` for `Declaration.Interface.Trait<G>`, and the builder `declaration.trait(...)`), written as an alias in the vocabulary. The path form always exists. An alias that would collide with another kind's name is an authoring error the checker reports, so adding a kind never removes an alias.

## 4. Features and terms

Nothing in the vocabulary is language-specific; it is feature-specific. A language that is not object-oriented has no classes, and that is a fact about a feature it does not compose, not a fact about the language. The portable API aligns the mechanics; features and terms align the terminology: **features** decide which kinds, members and flags a language has, **terms** decide what the language calls them.

### 4.1 Features

- **A feature is a marker and the kinds, members and flags it adds.** The marker is an interface with one key, the feature's name: `interface AsyncAwait { readonly 'async-await': true }`. What the feature adds is written in its folder, `features/<feature>/`, the way the base is written: an `index.ts` holding the marker, and one stub file per vocabulary namespace the feature touches. A stub interface with a `$kind` is a kind the feature adds (`Statement.Labeled<G> extends SubKindOf<V.Statement<G>>`). One without a `$kind` adds members to the kind of that name (`Statement.Loop<G> { readonly label?: V.Identifier.Label<G> }`), and a flag the feature adds is declared on the kind of that name in the same stub (§3.4). Nothing else marks which is which, so writing a feature is writing vocabulary.
- **Every kind, member and flag has one owner:** the base, or the most general feature that introduces it. The `async` flag of a function belongs to `async-await`, and `declaration.method` to `methods`. Two features that share something both extend the feature that owns it: `classes` extends `methods`, and so would `interfaces`. A second declaration of one member on one kind fails to compile (TS2717). So a member or a flag cannot belong to two features until the shared part is factored into a feature both extend.
- **Features extend features, and their folders nest the same way.** `async-blocks` extends `async-await` and sits in `features/async-await/async-blocks/`. A feature with two parents sits under one of them and extends both.
- **Features are atomic.** A feature is the smallest slice some real language composes or omits as a unit: no language takes half of `async-await`, but languages take type parameters without bounds, so `parametric-polymorphism` and `bounded-quantification` are two.
- **Only an atom has a marker.** A superset such as `oop` is a composition: an interface with no marker that extends its atoms, never a second source of kinds or members. An interface with no key of its own is satisfied by every context, which is why every atom keeps its marker.
- **A language composes features by extending them.** Its composition is an interface named for it: `PythonFeatures extends AsyncAwait, Generators, MultipleInheritance, …`. A composition may extend another: `TypeScriptFeatures extends JavaScriptFeatures, TypeAnnotations, ParametricPolymorphism, InterfaceConformance`. The type system computes the closure, so rust names `AsyncBlocks` and has `async-await` through it.
- **Members are shared by feature, never by slot.** Two languages share a member only when the feature behind it is the same. Single inheritance gives `extends?: T`, interface conformance gives `implements: T[]`, multiple inheritance gives `bases: T[]` where a base may be a class or a protocol and the syntax cannot say which; collapsing them because the slots look alike loses a distinction a consumer would have to reconstruct.
- **Features are named by type-theory terms,** never by a language's keyword: `typeclasses`, not `traits`; `interface-conformance`, not `implements`. A primitive type and its literals are a feature named for the type: `complex-numbers`, `arbitrary-precision-integers`, `characters`, `byte-strings`. So is a literal form some languages lack: `regular-expressions`, `string-interpolation`.
- **Three relations, three homes.** Grammar to vocabulary lives in `bindings.scm` and says nothing about features. Vocabulary to feature lives in the feature folders and says nothing about grammars. Language to features lives in the language's composition. A language's shape is the intersection of what its composed features admit and what its bindings claim. A claim outside the composition is a diagnostic, and so is a composed feature that no claim or route reaches.
- **The vocabulary grows by features.** A construct a grammar has and the vocabulary lacks, whether an unclaimed kind, an unmapped kind, or a member or fact no interface declares, is covered by extending the vocabulary with a feature: the feature adds the kinds, members and flags, the languages that have the construct compose it, and their bindings claim it. The unclaimed and unmapped ratchets (§2.1, §5.1) fall this way as well as by claims onto existing kinds.
- **The feature table (§4.3) has a column for each language with a grammar,** which is that language's composition, and columns for C#, Go, C++ and Swift. Those four exist to test the cuts: C# grounds the mainstream object-oriented slice, Go supplies structural conformance with no inheritance at all, C++ is the second multiple-inheritance language, and Swift the second typeclass and error-propagation language. A cut that only makes sense for one of the three built grammars is suspect; a cut two grounding languages share is not. Nothing can check a column without a grammar, so those columns stay in this document.

### 4.2 Terms

- **A feature declares its parameters; a language binds the terms.** Every kind and member a feature introduces is a parameter of that feature, defaulting to the canonical vocabulary name. A composition binds terms to parameters: Swift composes `type-aliases` with `type_alias` bound to `typealias`, rust binds it to `type`, and typescript leaves the default; rust composes `modules` with `module` bound to `mod`.
- **Terms ride beside the composition.** A language's terms are data next to its composition, and its generated type aliases carry each term as an alias of the canonical name: `Rust.Declaration.Mod` beside `Rust.Declaration.Module`. A term adds no kind and no interface, so it never touches the gating (§4.4).
- **A term reaches the portable API everywhere a name shows:** the type alias (`Swift.Declaration.Typealias`), the builder (`typealias(...)`), the documentation, and the accepted spelling of `$kind` when a structure is written in that language's context.
- **The canonical path stays the identity.** A Swift `typealias` read by the portable engine is a `declaration.type_alias`, and rust's portable engine builds it as a `type` item, because the two languages share the feature. A term is an alias in both directions, never a second kind.
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
| visibility | an access level, refining each kind that has one (values below) | † | ✓ | ✓ | ✓ | † | ✓ | ✓ |
| scoped-visibility | a level restricted to a module the declaration names, `pub(in path)`; extends `visibility` | | | ✓ | | | | |
| encapsulation | the `privateName` flag: a member hidden from code outside its class, enforced at run time (`#x`) | | ✓ | | | | | |
| computed-keys | the `computed` flag: a property whose key is evaluated (`[k]: v`) | | ✓ | | | | | |
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

Decisions the table records: `enumerations` and `algebraic-data-types` are separate features, since a C# enum and a rust enum share a keyword and nothing else; `decorators` and `attributes` are separate, since Swift's `@` forms are never evaluated applications; `exceptions` and `error-propagation` are separate, since Swift has both and rust has only the second. `oop` as a superset reads as `classes`, one of the inheritance features, `interface-conformance`, `accessors` and `visibility`; that composition names typescript, C# and Swift exactly, and python and C++ with the other inheritance feature. `open-type-extension` is kept apart from `typeclasses` because C# and Go have the former without the latter. `visibility` and `encapsulation` are separate: typescript's `private` is a level the compiler checks, `#x` a name the runtime hides, and the two never mark the same member, so the flag is `privateName`, apart from the level `private`. A key that is always an expression, as in python's, Go's and Swift's dictionary literals, has nothing for `computed-keys` to flag. `comprehensions` and `jsx` are real features shaped by one language each and compose as leaves under `expression` without a row here.

**Visibility's values.** A kind's visibility is one of these levels, from the widest to the narrowest. A level is a value of the visibility axis, a kind beneath `modifier.visibility`, named here by its path beneath it, which also names each owner's refinement for it (§3.3). The three grammars claim `public`, `public.internal`, `public.restricted`, `protected` and `private`; where the other levels nest is open (§11). A cell is the language's spelling of the level; † marks a level spelled by content rather than a keyword, by a naming convention or by C++'s unnamed namespace; blank, the language has no such level.

| value | visible to | py | ts | rs | C# | Go | C++ | Swift |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `open` | everything, and subclassed or overridden outside its module | | | | | | | `open` |
| `public` | everything | † `name` | `public` | `pub` | `public` | † `Name` | `public` | `public` |
| `package` | the modules of its package | | | | | | | `package` |
| `public.internal` | its compilation unit: crate, assembly, package or module | | | `pub(crate)`, `crate` | `internal` | † `name` | | `internal` |
| `public.restricted` | the ancestor module its `scope` names | | | `pub(super)`, `pub(in path)` | | | | |
| `protected internal` | the types derived from its type, and its compilation unit | | | | `protected internal` | | | |
| `protected` | its type and the types derived from it | † `_name` | `protected` | | `protected` | | `protected` | |
| `private protected` | the types derived from its type within its compilation unit | | | | `private protected` | | | |
| `file` | its file | | | | `file` | | † unnamed namespace | `fileprivate` |
| `private` | its declaring scope: its type, or its module in rust | † `__name` | `private` | `pub(self)` | `private` | | `private` | `private` |

- **The level is the source's.** A node has a level where its source spells one, in a keyword or, at a †, in its name, and it reads as its kind's refinement for that level. A level the language assumes when nothing is spelled (rust's private, Swift's `internal`, typescript's `public`) is a fact about the language, not about the node, which reads as its unrefined kind.
- **Rust's paths reduce to the levels they mean.** `pub(crate)`, `pub(in crate)` and `crate` are `public.internal`; `pub(self)` and `pub(in self)` are `private`; `pub(super)` is `public.restricted`, with `super` as its `scope`. Only `public.restricted` carries a scope the level lacks, so only its refinements have `scope` (§3.3).
- **A level is not a seal.** Swift orders `open` above `public` because it lets other modules subclass; elsewhere that permission is the absence of a seal (C#'s `sealed`), which is not an access level.

### 4.4 Presence is gated, requiredness is restated

The context `G` carries kind-sets by namespace, and that alone cannot make a member absent for one language: a member that references a specific interface (`whereClause: V.Clause.Where<G>`) is untouched by whatever `G['clause']` projects to. So the vocabulary carries every feature's kinds, members and flags for every language and gates each member and flag on the context, while a language's context lists only the kinds its composition has. A kind keeps one name, `V.Statement.Labeled<G>`, and code written over the vocabulary does not change with the language.

- **The augmentation is generated from the base and the feature folders.** `augment.ts` holds one `declare module` block per namespace file, which adds back everything the features own:
  - a kind a feature adds, as an interface extending its stub: `interface Labeled<G> extends labeledControlFlow.Statement.Labeled<G> {}`;
  - each gated member, declared on its own, its type indexed from the stub that owns it: `readonly label?: In<G, LabeledControlFlow, labeledControlFlow.Statement.Loop<G>['label']>`;
  - each gated flag, declared on its kind as the base declares a flag (§3.4);
  - each owner × value refinement (§3.3): an interface extending its owner that adds, gated, the members its value's features own;
  - each level's `Any`: the base's kinds beneath the level and every feature's.

  `features/index.ts`, which exports every feature's marker, is generated with it.

  The base files hold everything no feature owns, and nothing else. Each member is declared on its own rather than through a mapped `extends`. Otherwise a refinement that restates a gated member would inherit two disagreeing declarations of it (TS2320). The generated code reaches its own helpers through lowercase namespaces (`gate.In`, `features.Generators`). Inside a `declare module` block the vocabulary's names are in scope, and kinds named `In` and `F` exist to shadow them.
- **Levels are whole.** The namespace map types each slot by levels over any context (§3.4), so every refinement is checked against its parent for every `G`. A level arm gated on a feature cannot be shown to hold the feature's kind for an arbitrary `G`. With gated arms, a refinement that narrows a slot to a kind a feature adds fails to compile: `expression.call.template` narrows `arguments` to the template string `string-interpolation` adds. A language's own level is its context's key: `PythonContext['expression']` lists only what Python's composition has, and has no range expression.
- **The gate is a conditional on the context:** `In<G, F, T, Otherwise = Absent<F>> = G extends F ? T : Otherwise`. A language's context extends its composition, so `G extends F` holds exactly for the features in the composition's closure. Where it fails, the member is `Absent<F>`, which names the missing feature: a Rust function's `decorators` is `Absent<Decorators>`, so setting it is a type error that names `Decorators`. A flag is gated the same way: where the composition lacks the flag's feature, its step and its guard are `Absent<F>`, so `build.declaration.method.generator` is a type error for rust that names `Generators`. Over a union of contexts the gate distributes, so the union is a supertype of each context, member by member.
- **Portable code is generic over the context.**
  - **Bounded by the features it reads.** `<G extends GrammarContext<G> & Decorators>(fn: V.Declaration.Function<G>)` reads `fn.decorators` as `V.Attribute.Decorator<G>[] | undefined`. A language without the feature fails at the call, which names it: "Property 'decorators' is missing in type 'RustContext' but required in type 'Decorators'".
  - **Unbounded, it takes every language.** A gated member may be `Absent<F>` there, so the code tests the member (`Array.isArray(fn.decorators)`) rather than returning it.
  - **It reads roles and slots through the namespace map's fills.** A slot that admits text is narrowed before its kind is read.
  - **Code over several languages names the union of their contexts:** `asyncOf<PythonContext | RustContext>(fn)`. Inferred from a mixed value, the type argument is one language's context, and the other's value fails.
  - **There is no permissive context.** A context with every feature would be a supertype of each language only through the compiler, which compares `X<Lang>` with `X<Base>` by their contexts. Member by member, a language's `Absent<F>` is not assignable to the present member's type.
- **A gated member is gated along its inheritance line.** `type-annotations`, which owns `returnType` on `declaration.function`, also declares it on `.signature`, which restates it. An ungated declaration cannot override a gated one, nor a gated one an ungated one. For the same reason, a kind that inherits from a feature's kind belongs to a feature too. And a feature gates a member or adds the refinements that restate it, never both: a refinement is written as the base is, ungated, so it stays with its parent's owner or another feature, and the gating feature owns the member there as well. So `.signature` stays in the base, and `type-annotations` owns its `returnType`.
- **Requiredness is restated, and the context applies it.** An augmentation cannot change a member's optionality: a second declaration of a member must agree with the first. A member is required in a language in two cases:
  - a feature the language composes restates the member without `?` (`manifest-typing` writes `Declaration.Field.type`);
  - every claim of the kind in the language's bindings requires it, as rust requires a function's body.

  The generated context applies both wherever it names the kind: in its namespace sets, its slot fills and its type aliases (`V.Declaration.Field<RustContext> & manifestTyping.Declaration.Field<RustContext>`). A feature restates only what the base declares, or what a feature it extends declares.
- **Route gaps stay out of the types.** A member or flag a composed feature gives a kind is present even where the language's bindings give it no route. Python composes `generators` and marks a generator by its body, so a Python method still has the `generator` guard and step. Building one through the step is refused at run time, and the inventory reports the gap.
- **A portable node drops what its language lacks.** A kind's portable node type (§9) leaves out the members that are `Absent` in its context. A JavaScript function's `returnType()` therefore does not exist, rather than returning `Absent`.
- **One copy serves polyglot programs.** An augmentation applies to the whole program, so the feature folders and `augment.ts` live once, in the vocabulary package, which loads them through its index. A program that imports several languages sees every feature, each gated per context, and no feature comes from outside the package.
- **Cost, measured and reported.** The binding prototype's vocabulary was folded, gated and measured like for like (`docs/superpowers/probes/2026-10-09-vocabulary-features/`). Type-check time informs; it does not decide a type design.
  - The namespace map costs 41% more instantiations and 52% more memory than today's contexts, since every instantiation checks its context against the map.
  - Over the folded vocabulary, every row of §4.3 and of the rows §11 proposes, 75 features with the probe's three proposals, costs 16.1% more instantiations and 19.2% more memory. Gating every member and kind particular to some grammars by grammar costs about the same, 15.0% and 15.6%.
  - Reading each level off an augmentable kind registry costs 1.8 times the generated unions' instantiations. Cost is the only measured difference between them. The registry's one other merit is that a package outside the vocabulary could add kinds to a level by augmentation, which a type alias cannot take. That merit does not arise while every feature lives in the vocabulary package; a user's own features would reopen the choice (§11).

## 5. The map

The map is what the generator makes of a grammar's bindings and its slot model. It is generated with the grammar package, like its factories, and never hand-edited.

### 5.1 What it holds

For one grammar:

- **Read entries,** per grammar kind: the vocabulary kinds it can be, most specific first, each with what selects it: field literals the node must have (`operator: "+"`), predicates on captured nodes (`#eq?`, `#match?`), the template's holes.
- **Build entries,** per vocabulary kind: the factories that build it, each with the literals that spell it, and a step per flag of the kind.
- **Member routes,** per entry: for each member capture, the slot it lands in, as a path from the claimed node through any transparent wrapper to the slot (`class_heritage` → `extends_clause` → value).
- **Fact routes,** per entry: for each flag, the token or the kind in a slot whose presence sets it; for each axis whose value a node of its own spells, the route to that node, whose claim gives the value (§2.1); and for an envelope, the facts it sets on the element it unwraps (§9).
- **Container assignments:** for a container pattern, which captures it assigns to the element it wraps, and the route to each.
- **The language's context:** it extends the namespace map over itself (§3.4) and the language's composition (§4.1), and holds per namespace the vocabulary kinds the grammar claims that the composition has, with the sets admitted whole under §3.2 and the restatements of §4.4 applied. This is the `G` the language's interfaces are instantiated with.
- **Token classes:** the keyword and punctuation classes of §2.1, for highlighting.
- **Unmapped kinds:** each grammar kind a routed slot admits that no claim covers. Its count is a ratchet that only falls.

### 5.2 How it is typed

- **Against the low-level API.** Each route names the grammar's own slots, so the map type-checks against the grammar's generated types: a route to a slot that does not exist is a compile error in the grammar package, not a runtime surprise.
- **Against the vocabulary.** The inventory checks that every name a claim gives resolves against the vocabulary's declarations (§2.1): a claimed path to a kind and the values of its axes and its flags, a single-segment capture to a member, a flag or an axis of its kind. It checks that every required member of a claimed kind has a route, or is absent under the language's composition. A claim that maps onto no declared fact is a diagnostic, and the generator emits nothing for it. Neither the inventory nor the generator infers a fact's form from the grammar's shape: a choice, a keyword or a slot's arity decides nothing (§3.3).

### 5.3 Where it is made

- **By the generator,** as part of the grammar package's generated output, regenerated when the grammar or its `bindings.scm` changes and covered by the generated-output check.
- **`bindings.scm` is read with `@sittir/scm`,** into its typed tree, by the generator's query module: the same module that reads the upstream `tags.scm` and `highlights.scm` for the seed (§2.2) and the grammar's roles. The generator also generates `@sittir/scm`, so it reads through a build of `@sittir/scm` pinned to a known commit, never through the workspace copy: a change that breaks `@sittir/scm` cannot break the generator's ability to regenerate the fix.
- **A file that does not parse is refused.** The reader names the lines that failed; the compile of each `bindings.scm` against its grammar's parser (§10) is the gate that catches what the parse absorbs.
- **The inventory** (`sittir tool bindings-inventory`) reads the bindings through the same module and reports what the generator would refuse, plus the diagnostics of §10.

### 5.4 Who reads it

- **The portable engine's `build`** finds the build entries for a structure's `$kind`, routes each member to its slot and calls the low-level loose builder (§8).
- **A portable node** takes its low-level node's read entries in order, tests each entry's literals and predicates on that node, reads each member along its route when the member is called, and reads its flags along their routes (§9).
- **`is.<role path>`** compiles the read entries under the path into the query facet's plan form, and tests the path's flags against the node's bitflag (§9).
- **`attach`** reads a node coming to the portable surface through its read entries, and rebuilds a built node through the build entries of the surface it goes to (§9).
- **The highlighting projection** reads the token classes.

## 6. Convergence rules

Names converge before kinds. The rules govern the names the vocabulary uses and the names captures give. The convergence record for the first vocabulary is `2026-09-13-base-vocabulary-draft.md`.

**Names.** The seed's model expansion applies rules (1) and (2) to every slot it turns into a capture, and an authored capture follows them too. A capture names a slot only in the claims it sits in, never grammar-wide.

0. Two languages share a member only when the feature behind it is the same, never because the slots look alike (§4.1).
1. A flag takes the keyword that marks it where the keyword says the fact (`async`, `static`), and otherwise names what it means: `mutable` for `let`, `var` and `mut`, `functionScoped` for `var`, `byReference` for `ref`, `disposable` for `using`, `exclusive` for a reference's `mut`, `privateName` for `#`.
2. An axis takes the noun (`visibility`), and its values say what they mean, not how a language spells it (`public.internal` for `pub(crate)`).
3. Layout is not a member.
4. Containers keep the shared name (`parameters`, `arguments`, `body`, `statements`, `typeParameters`, `typeArguments`).
5. Otherwise the majority upstream name over the claiming grammars wins; a tie is a recorded choice.

**Kinds.**

1. Containers unwrap to their element kind-set as a list.
2. A wrapper clause that carries one member around punctuation is transparent: typescript's type annotation makes `returnType: type`; python's suite forms make a function body `statement.block`, the encoding chosen at build time. The slot model decides it: an envelope, an alias or a polymorph whose one non-layout slot holds nodes is transparent. A wrapper with structure of its own (rust's `attributed_parameter`, typescript's class body members) is transparent only through a container pattern, because reading a kind as its content drops whatever its own text says (`impl !Trait`).
3. A member's kind is the smallest kind-set covering every grammar's admitted set.
4. Text leaves are strings.
5. Markers decompose: one that picks one of several values is an axis, and a yes/no one a flag, unless it changes what the node admits or where it is admitted, when it is a refinement kind (§3.3).
6. Inclusion is a DAG with full-coverage admission and flattened unions.
7. Refinements narrow, never widen.
8. A shorthand follows its grammar's kinds. One the grammar spells as a node is its longhand with the omitted member absent, never a kind of its own: rust's `Foo { a }` is an `element.struct.field` with no value. One the grammar spells as a leaf has no member to omit, and its kind is the vocabulary's (§2.1): typescript's `{ a }` holds an `identifier.property.shorthand`.

Where a grammar's set is narrower than the vocabulary's (rust's `body` required and a block only), the language's context carries the narrowing, through its sets and its restatements (§4.4); the vocabulary is not re-authored.

## 7. Template regexes

A `#match?` predicate whose regex is anchored at both ends and made of literal runs and holes is a template: the literals are injected on build, the holes are inputs on build and members on read.

- Every hole is a named group, and the member takes its name. The leaf adds it beside the parent's members: `declaration.method.dunder` has `stem: 'init'` while `declaration.method` keeps `name: '__init__'`.
- A hole's type is the template literal type (`` `__${string}__` ``), and a hole with a character class is validated on construction.
- Outside the subset (unanchored, backreferences, lookaround, a quantified literal, alternation that is not itself a template with the choice as a member) a predicate is read-only, and the inventory says why.
- The regex is in the syntax tree-sitter's query engine and JavaScript share; named groups are written `(?<name>…)`.

## 8. The structure API

A **structure** is a plain object satisfying a vocabulary interface, its kind named by `$kind` where the context does not decide it (§3.4). It is the vocabulary instantiated over a **structure context**, where each namespace's set is the union of structure types rather than node types and leaves are text; a language's structure is the same over that language's context. Structures are serializable and carry no language. A structure is only build input: a read returns a portable node (§9), never a structure.

- **The portable engine's `build` builds structures,** typed per kind from the vocabulary: a structure's kind, named or decided by its context, selects its interface and its build entry, each member is routed to its slot, and the low-level loose builder coerces the value as its slot's contract says. It accepts the loose form: the canonical shape with each member widened to what its slot's loose coercion accepts, derived by one mapped utility, never authored. A node already on another engine comes over through `attach` (§9), not through `build`.
- **What the portable layer adds to coercion** is only what the low-level contract cannot know:
  - an object's `$kind` is omitted wherever its context decides it (§3.4);
  - `$kind` may be spelled with the language's term (§4.2);
  - a boolean and `null` in a slot that admits a literal kind become that kind as the language spells it (`literal.boolean.true`, `literal.null`).
  Everything else, a bare string or number included, is the slot's loose coercion as the loose contract states it. Runtime validates what the types check, since a structure can arrive from JSON.
- **A structure states its refinement by its `$kind`,** which names its path, refinements included, **and its flags by `$flags`,** typed per kind from the flags its kind declares: `{ $kind: 'declaration.method.public', $flags: ['static', 'async'], … }`. `$kind` may be omitted where a slot decides the kind, while no slot decides a node's flags, and a set of flags has no order.
- **Deviation is a type error where it should be.** A structure handed to a language whose context lacks its kind fails on the kind; one that omits a member that language requires fails on the restatement its context applies (§4.4); one that carries a member or states a flag that language lacks fails because the member or flag is `Absent<F>` there, so an excess member is an error that names the missing feature rather than a silent drop.
- **A refinement the target lacks degrades to its parent.** A refinement is assignable to its parent by construction, so a python `declaration.method.dunder` structure builds through typescript's `declaration.method`, and a rust `interface.trait` through typescript's `interface`, as long as it states no member or flag the target lacks: an `unsafe` trait still fails, as `Absent<UnsafeCode>`.
- **Refinement builders and flag steps** (`build.declaration.method.public.async({ name: 'deposit', … })`) are the authoring form, and the structure form is the data interchange; both produce the same nodes (§3.3).

## 9. Reading

A portable engine's `parse` reads **portable nodes**: each node is read as its vocabulary kind through the map. Nothing reads a node out as a plain structure; a structure is only build input (§8).

- **A portable node is an object literal,** made the way the low-level builders make nodes. Its runtime tag is `$type`, the bound engine's grammar kind id, as on every node. Its `$kind` is type-only: the node's type carries it, and no value exists at run time. Where `$type` alone does not decide the vocabulary kind (a refinement, or one grammar kind read as several kinds, such as python's `function_definition` as `declaration.function` or, named `__init__`, `declaration.constructor`), the node's own literals and text decide it. Its flags are one bitflag: its read sets them along the flags' routes, the envelope that unwraps it sets those it decides (below), and a build sets them by its steps. The bitflag is client-side only, never crosses to native, and is read only by `is`. A role is tested at run time with `is` (below), which decides from `$type`, the node's own predicates and its flags. Every member of its kind's interface that its language has (§4.4), inherited members included, is a closure that is always present, so a member is a call (`fn.name()`), as a low-level reader is. Optionality is the member's return type (`body(): … | undefined`), and a member the grammar gives no route returns `undefined`, as a low-level reader does for an absent slot. A data member would be evaluated when the node is made, so everything that reads the tree is a closure.
- **The interfaces stay property-shaped;** they are what `build` takes (§8). A kind's portable node type is derived from its interface the way a grammar kind's `X.Parsed` is derived from its data interface: one mapped type turns each member into a closure and resolves member types through a flat per-grammar table keyed by `$kind`.
- **A portable node has no way down.** It exposes no low-level node, and nothing crosses implicitly. A node moves to another engine through the target engine's `attach(node)`: one verb, the same on every engine whatever surface the node comes from, typed per input by overloads. A portable engine's `attach` takes a grammar's node and returns its portable node; a grammar engine's `attach` takes a portable node and returns the grammar's node. A parsed node is re-wrapped from its tree row, since trees are one table per language, with no reparse. A built node is rebuilt with the target surface's builders through the map. A node already bound to the engine is returned as is; one bound to another engine of the same surface is re-wrapped from its row (parsed) or rebuilt (built), exactly as a crossing is.
- **Low→high crossing runs only where the node decides it.** A low-level node crosses to the portable surface on its own only when every fact of its kind is decided by the node itself: its kind, its field literals, its own text and tokens. The generator emits those kinds as a type map, and `attach` accepts only them. A kind with a fact its envelope may set (below) is reached through the envelope; nothing queries a node's ancestors.
- **A claim a grammar site decides is a kind of its own.** Where the context a claim depends on is a site in the grammar, the overlay puts a parser alias there: the node is parsed with a kind of its own, and `$type` decides the claim. In rust, `function_item` in an `impl` or trait body is parsed as `method_declaration` (`declaration.method`, with `static` set where it has no receiver), `function_signature_item` in a trait body as `signature_method_declaration`, and `crate` as a visibility, `visibility_modifier`'s own `crate` arm, as `internal_public_visibility_modifier` (the value `modifier.visibility.public.internal`). In python, `function_definition` in a class body is parsed as `method_declaration`, both as a statement of the body and as the `definition` of a decorated definition there. A site must be context-unique, so the overlay clones the shared rules on the way to it and keeps one body for the aliased rule: rust's methods clone `declaration_list` and `_declaration_statement`, the `crate` arm needs no clone, and python's method clones the rules from the class's `_suite` down to `_compound_statement`, and the decorated definition that statement holds. An alias kind has its own kind id and its own low-level builder, which builds the aliased rule's node under the alias's kind id, so a built method's `$type` is a parsed one's.
- **No claim is placed.** A claim that would depend on where its node sits takes one of three forms, and none reads a parent chain:
  - a grammar site decides it: it is an alias there (above);
  - the node's position decides it: it is its parent's member, not a kind. Python's docstring is the `doc` member of the function or class whose body it opens (§2.1), and the string is a `literal.string`;
  - its envelope's own text decides it: the envelope sets the fact on the element it unwraps, one level down, as it hands the element its captures, and the element keeps it with its flags. Python's `decorated_definition` sets `static` on the method it unwraps from its own `@staticmethod`. The method's kind is its alias's, `declaration.method`, decorated or not (above), and a `@classmethod` sets nothing.

  So a node's facts come from its `$type`, its own literals, text and tokens, its envelope or its build, and never from a parent chain.
- **A leaf is its kind or its text.** A leaf whose text varies exposes it as `$value`. A fixed literal is its kind id, which is its identity, so it compares directly and has no `$value`: on a grammar's surface the grammar's id (`x === kinds.Plus`), on the portable surface the vocabulary's const string for it (§3.3), so rust's `i32` in an expression slot reads as `'i32'`. A fixed literal's meaning lives on its parent's refinement (`is.expression.assignment.compound.add(x)`), never on the leaf, and no member restates it.
- **A role test reads the node.** `is.<role path>(x)`, such as `is.expression.assignment.compound.add(x)`, decides from `$type`, the node's own predicates and its flags. It tests each fact its path names, not the path as a prefix: it checks `$type` against the kind set of the path's kind, tests on the node the field literals and predicates that decide each refinement the path names, and tests the path's flags against the node's bitflag. So a guard holds alongside every refinement its path does not name: `is.declaration.method.public(x)` holds for a public getter, and `is.declaration.method.static(x)` for a static one (§3.3). It runs no query over the tree: the bindings rows' kind set, slot constraints such as `operator: "+="`, text predicates and kind tests compile client-side into the same plan form as the query facet, one derivation and no separate kind table, and the plan tests only the node and its captured children. A kind test is the plan's `is` op, which holds where a slot holds a node of one of its kinds, and a step toward a captured child may take the slot's `first` or `last` value: rust's method sets `static` where no parameter is a receiver. It takes portable and grammar nodes alike and is typed by overloads, as `attach` is: a grammar node narrows to the grammar type or types the row maps to, a portable node to the vocabulary interface. A fact an envelope sets holds on the portable node read through the envelope, not on the grammar node alone. It is not purely structural: roles that differ only by grammar kind (`identifier` and `type_identifier`) are told apart by the kind set.
- **Render dispatches on `$type`.** `$render` runs only at the root, never on the nodes within, so rendering needs no vocabulary kind.
- **No identity is promised.** A portable node follows the rule every node follows: two reads give two objects, and equality is a comparison.
- **The type maps from low-level kinds to portable nodes live with the low-level definitions:** the language's context, each kind's portable node type and the kinds that cross on their own are emitted into the grammar package's types module, beside `ParsedByKindId` and `BoundByKindId`.

A portable node reads through the grammar's typed surface: its low-level node's kind selects its read entries, an entry's literals and predicates are tested on that node and its captured children, the first entry that holds selects the node's member routes, a member reads along its route when it is called, and its flags read along theirs. No query runs over the tree at read time, and the native layer knows nothing about roles. A malformed file reads as far as its nodes do: an error node has no read entry, and its parent's members that route through it are absent.

## 10. Verification

1. **Totality and injectivity,** computed from `grammar.json` and the bindings by the inventory: every meaningful visible kind claimed or unclaimed with a reason; no two kinds of one grammar share a leaf unless, in every slot that admits both, a holder's flag or a member's absence tells them apart (a private name and a public one; a shorthand struct field and a struct field); the unclaimed count only falls.
2. **The bindings compile:** each `bindings.scm` compiles as a query against its grammar's parser, and a bad node or field name is reported with tree-sitter's own error and the line; the set of compiling grammars is a ratchet.
3. **The bindings read:** each `bindings.scm` reads through `@sittir/scm` with no error node and renders back byte-identical.
4. **The map type-checks** against the low-level API (§5.2), and the inventory's checks of the map against the vocabulary pass.
5. **Inclusion is a DAG:** there are no cycles.
6. **Unmapped only falls.**
7. **Portable round trip:** parse with the portable engine, build every node again from its members, render, parse-equal, over the corpus, as the validator lane that measures the portable surface's coverage.
8. **Template regexes:** a dunder built from a stem re-parses to the claim; a bare hole is rejected.
9. **Cross-language errors:** `Python.Declaration.Interface` handed to python fails at compile time because python composes no `interfaces` feature, and rust's `generator` step on a method fails because rust composes no `generators` (§4.4). A rust `whereClause` handed to python is refused at build and reported as a route gap: python composes `bounded-quantification` but claims no where-clause kind. A consumer generic over the context and bounded by `async-await` takes python's and rust's functions. Bounded by `generators`, it rejects rust's method at the call, naming the feature. Unbounded, it reads a function's name through the namespace map.
10. **Feature ownership:** every kind and member has one owner; a gated member is gated along its inheritance line; a feature restates only what the base or a feature it extends declares; no base kind inherits from a feature's kind; no marker key is a context's key (a namespace or `slots`). A claim outside the language's composition, and a composed feature no claim or route reaches, are inventory diagnostics.
11. **Terms are aliases:** a Swift `typealias` read as `declaration.type_alias` builds in rust as a `type` item and reads back with the same path; a term never changes a node's vocabulary kind.
12. **Consumer-seat checks,** compile-time, in `packages/types/tests/vocabulary-consumers.test-d.ts`: an ordinary function, method, call and binary satisfy their interfaces; a getter and `Add` are refinements, and no member restates them; an increment cannot omit its operand; a Rust method's `generator` step, a JavaScript function's `returnType` and a rust function without a body are the negative cases.
13. **Type-check time is measured and reported:** the whole workspace's type-check, before and after a change to the vocabulary, its features or the map's types, with the same command. The namespace map's and the gating's own costs are measured against the same vocabulary without them, like for like, the way the features probe measures them (§4.4). The figures inform; they do not gate the change.
14. **Crossing:** a parsed node attached to its language's other engine is re-wrapped from its tree row with no reparse and renders the same text; a built node attached to the other surface is rebuilt through the map and renders the same text; attaching a low-level node of a kind that does not cross on its own is a type error; attaching a node to the engine it is bound to returns it.
15. **Role tests:** `is.<role path>` holds for exactly the nodes whose read entries classify them under the path, on both surfaces, and tells `identifier` from `type_identifier` where their roles differ; a guard holds alongside every refinement its path does not name, a public getter passing `is.declaration.method.public` and a static one `is.declaration.method.static`, and a fact an envelope sets holds on the portable node read through it; a grammar node narrows to the row's grammar types and a portable node to the vocabulary interface, checked at compile time.
16. **Refinements fit their parents:** the vocabulary type-checks under the namespace map, which types every slot, so a refinement whose fill falls outside its parent's fails to compile; so does a language's context that does not fit the map over itself.
17. **Facts resolve against the vocabulary:** every name a claim gives resolves to a declared kind, axis value, flag or member, and a claim that maps onto no declared fact is reported. A fixture vocabulary that declares one fact as a flag, and then as a refinement, gives the same bindings the same guards and steps, and only their types differ.
18. **The generated vocabulary is current:** `sittir tool vocabulary-features --check` reports no planning issue and no drift. The planning issues are item 10's ownership rules plus feature folders nested by inheritance. No drift means `augment.ts` and `features/index.ts` are what the base and the folders generate. The tool's test holds the check at a ceiling of none.

## 11. Open questions

- **One word, two mechanisms.** "Bindings" names `bindings.scm` and also the `_bindings` key of each grammar's `options` block, which groups option addresses under a user-facing key. One of them should be renamed before the portable API ships; the read-side consumer surface (`roles.as/is/find`) is named by the same decision.
- **Trivia and provenance through `build`.** A parsed node that crosses keeps its tree row, and with it its coordinates, but `build` builds from members alone, and a structure has no coordinates. `doc` survives as a member; free trivia needs a `trivia` member or is declared lost.
- **A user's own bindings.** Whether a user's bindings file compiles to a map composed after the package's, by the seed's per-kind override rule, and whether that happens at generation or at load. Also whether a user's own features can add kinds to the vocabulary's levels: generated unions take kinds only from features inside the vocabulary package (§4.4).
- **Features (§4).** What the features probe (`docs/superpowers/probes/2026-10-09-vocabulary-features/`) and the refinement axes (§3.3) leave for a ruling, each with a recommendation:
  1. **What a missing member is.**
     - `Absent<F>` names the missing feature in every error, and lets a portable node drop exactly the members its language lacks. But a consumer generic over the context sees every gated member as possibly `Absent<F>` and must narrow it.
     - `never` leaves generic consumers unchanged. It costs both: errors that do not name the feature, and portable nodes that cannot tell a missing member from a member whose type is `never`.
     - TypeScript reduces a branded `undefined` to plain `undefined`, so no type gives both.

     Recommendation: `Absent<F>`. Portable code is generic over the context (§4.4). Bounded by a feature, it reads the member's type unchanged; unbounded, the `Absent<F>` it meets names the bound it needs.
  2. **Route gaps in the types.** §4.4 keeps a member a composed feature gives a kind in the types even where the language routes it nowhere. A rust `whereClause` handed to python is then a build refusal and an inventory diagnostic, not a compile error (§10.9). Typing route gaps would make a member's presence depend on the map as well as the composition: one absence per member per language, beside the gates. Recommendation: keep route gaps out of the types.
  3. **Restatements behind direct references.** The context applies a restatement where it names a kind: in its namespace sets, its slot fills and its type aliases. A member typed by a direct reference to an interface (`declaration.union`'s `body: V.Declaration.Field<G>[]`) does not see the restatement, so a rust union's fields keep an optional `type` there. Recommendation: a member whose kind a feature restates is typed through the slot table, which the context fills, and the inventory reports a direct reference to a restated kind.
  4. **Equality as levels.** `equal` and `not_equal` become levels. Each sits over a `.strict` leaf in the base (python's and rust's `==`, typescript's `===`) and a `.loose` leaf that `coercive-equality` adds (typescript's `==`). Typescript's `strict_equal` and `strict_not_equal` claims move to the `.strict` leaves. Recommendation: adopt, so a portable `equal.strict` means the same in every language.
  5. **`gradual-typing`.** The table's row becomes two features. `type-annotations` owns the annotation members and the `type` namespace. `manifest-typing` extends it and makes an annotation required where the language requires one (a rust field's `type`). Gradual typing is then `type-annotations` without `manifest-typing`. Recommendation: adopt.
  6. **New rows for the table.** The features probe realizes every row of §4.3 and needs these besides. Each is a slice some grounding language composes or omits as a unit, and its first three columns are the probe's compositions. Recommendation: adopt them.

     | feature | adds | py | ts | rs | C# | Go | C++ | Swift |
     | --- | --- | --- | --- | --- | --- | --- | --- | --- |
     | methods | a function declared as a member of a type; `classes` extends it | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
     | coroutines | `yield`; `generators` extends it | ✓ | ✓ | ✓ | ✓ |  | ✓ |  |
     | higher-rank-polymorphism | a bound quantified over parameters of its own, `for<'a>` |  |  | ✓ |  |  |  |  |
     | coercive-equality | a loose `==` beside the strict one |  | ✓ |  |  |  |  |  |
     | complex-numbers | imaginary literals and their patterns | ✓ |  |  |  | ✓ | † |  |
     | arbitrary-precision-integers | an integer of no fixed width, `10n` | ✓ | ✓ |  |  |  |  |  |
     | characters | a character type and its literals |  |  | ✓ | ✓ | ✓ | ✓ | † |
     | byte-strings | byte string literals, `b"…"` | ✓ |  | ✓ | ✓ |  |  |  |
     | regular-expressions | regex literals |  | ✓ |  |  |  |  | ✓ |
     | string-interpolation | expressions embedded in a string literal | ✓ | ✓ |  | ✓ |  |  | ✓ |
     | raw-strings | string literals whose escapes are not processed | ✓ |  | ✓ | ✓ | ✓ | ✓ | ✓ |
     | untagged-unions | `union`: fields sharing one storage |  |  | ✓ |  |  | ✓ |  |
     | associated-types | a type an interface declares and each implementation binds |  |  | ✓ |  |  |  | ✓ |
     | abstract-classes | an abstract class and the members its subclasses must implement | † | ✓ |  | ✓ |  | † |  |
     | explicit-overrides | `override` | † | ✓ |  | ✓ |  | ✓ | ✓ |
     | readonly-members | `readonly` |  | ✓ |  | ✓ |  |  |  |
     | optional-members | a property, method or parameter that may be omitted, `x?: T` |  | ✓ |  |  |  |  | ✓ |
     | ambient-declarations | `declare` |  | ✓ |  |  |  |  |  |
     | non-null-assertions | `x!`, `x!: T`; extends `nullable-types` |  | ✓ |  | ✓ |  |  | ✓ |
     | const-generics | a type parameter that is a value |  |  | ✓ |  |  | ✓ |  |
     | module-declarations | a module declared in a file, `mod`, `namespace`; extends `modules` |  | ✓ | ✓ | ✓ |  | ✓ |  |
     | foreign-function-interface | functions another language defines, `extern` |  |  | ✓ | ✓ | † | ✓ |  |
     | unsafe-code | `unsafe` blocks and declarations |  |  | ✓ | ✓ |  |  |  |
     | compile-time-evaluation | functions and blocks the compiler evaluates, `const fn`, `constexpr` |  |  | ✓ |  |  | ✓ |  |
     | named-arguments | an argument passed by its parameter's name | ✓ |  |  | ✓ |  |  | ✓ |
     | default-arguments | a parameter's value when a call omits it | ✓ | ✓ |  | ✓ |  | ✓ | ✓ |
     | multiway-branch | a `switch` on a value to the case it equals |  | ✓ |  | ✓ | ✓ | ✓ |  |
     | counted-loops | `for (init; cond; update)` |  | ✓ |  | ✓ | ✓ | ✓ |  |
     | post-test-loops | `do … while`, `repeat … while` |  | ✓ |  | ✓ |  | ✓ | ✓ |
     | conditional-expressions | `c ? a : b`, `a if c else b` | ✓ | ✓ |  | ✓ |  | ✓ | ✓ |
     | optional-chaining | `a?.b` |  | ✓ |  | ✓ |  |  | ✓ |
     | tuples | tuple values and the unit value | ✓ |  | ✓ | ✓ |  |  | ✓ |
     | range-expressions | `a..b` |  |  | ✓ | ✓ |  |  | ✓ |
     | slice-expressions | `a[i:j]` | ✓ |  |  |  | ✓ |  |  |

     `modules` then adds import, export and re-export, and `module-declarations` the namespace. `comprehensions` and `async-blocks` (rust's `async { }`, under `async-await`) are features without rows, like `jsx`. Five features own nothing in the three grammars and are markers a composition names: `overloading`, `operator-overloading` (by content in python and rust), `nullable-types` (a union type in python and typescript), `concurrency-syntax` and `deferred-execution`.
  7. **Python's generators.** Python composes `generators`, but its bindings claim no generator kind and route no `generator` member, so the inventory reports the feature unreached. Python does delegate: `yield from` is tree-sitter's `yield` with a `from` token. Recommendation: python's bindings claim it as a refinement, `((yield "from") @expression.yield.delegate)`, which reaches `generators`; the composition stays.
  8. **TypeScript's other typing kinds.** The features probe moves every typing kind and member into the feature that owns its concept: interfaces and their property signatures to `interfaces`, type aliases to `type-aliases`, enums to `enumerations`, call, construct and index signatures to `structural-conformance`, abstract classes and methods to `abstract-classes`, the casts to `type-annotations`, namespaces to `module-declarations`, and four modifiers to features of their own (question 6): `optional-members` (`x?: T`, the optional parameter), `readonly-members`, `ambient-declarations` (`declare`) and `non-null-assertions` (`x!`, `x!: T`). Under `type-annotations` the modifiers would have reached rust's and python's fields, which compose annotations and none of them. A JavaScript context, over TypeScript's claims, then has none of the typing kinds. Recommendation: adopt.
  9. **Refinements outside their parent, and visibility's values.** The namespace map checks every refinement's fill against its parent's (§10.16). Of the three refinements in the binding prototype's vocabulary that fail, the property rule (§3.3) removes `identifier.property.private`.

     Visibility's values are ruled:
     - visibility is a refinement axis: a kind that has a visibility has a refinement per level, and no member holds the level (§3.3);
     - the levels the three grammars claim nest under `public` (`public.internal`, `public.restricted`);
     - rust's `pub(super)` and `pub(in path)` are the one level `public.restricted`, and the module they name is `scope` on each owner's `public.restricted` refinement, owned by `scoped-visibility`;
     - `expression.binary.identity` and `.membership` hold no `operator`, since no member restates a refinement (§3.3): their leaves (`.is`, `.is_not`, `.not_in`) say which operator it is.

     Open:
     - **The levels no grammar claims** (§4.3): `open`, `package`, `protected internal`, `private protected` and `file`, and where each nests. `open` is a level because Swift orders it above `public`, while elsewhere the same permission is the absence of a seal. Recommendation: add each as a kind when a grammar claims it, nested by what it admits.
     - **A level spelled by naming convention** (†) is read from the name, and a build of a level's refinement that the name contradicts is refused rather than renaming the declaration. Recommendation: adopt.
  10. **Text in a role.** Every context must fit the namespace map over itself, and the map types each role by kinds: `identifier` is `V.Identifier.Any<G>`. Two contexts put text in a role:
      - The binding generator's contexts admit a grammar's keyword text where its grammar aliases a keyword to a role (`identifier: … | 'bool' | 'gen' | 'union'`).
      - §8's structure context types leaves as text.

      Neither fits the map as written. The options:
      - The map fills a role as it fills a slot: kinds, and `string` where some context puts text in the role. A generic consumer then narrows text away before reading a kind, as it does for a slot.
      - Keyword text and leaf text become kinds carrying their text as a member, as a node carries `$value` (§9), and the map stays kinds.

      Recommendation: the first. One rule then fills keys and slots alike, the binding generator's contexts keep their keyword text, and a structure's leaf stays a bare string.
  11. **What the full feature set leaves in the base.** With every row realized, 92 kinds some grammars claim stay in the base, each claimed only where a grammar has it. Recommendations:
      - **Operators and keyword leaves stay in the base.** A language never claims an operator it lacks, so its context already leaves the leaf out, and a feature per token would add a marker and no member. `coercive-equality` is the exception, because its leaf is a different comparison.
      - **One grammar's statements stay too:** python's `print`, `exec`, `global`, `nonlocal`, `assert`, `del` and `pass`, typescript's `debugger` and `with`. Each is a leaf only its grammar claims, with nothing for a feature to gate.
      - **A kind two features share is split where their members differ.** `clause.case` holds python's match case and typescript's switch case; `match-expressions` and `multiway-branch` gate their members on it. Splitting it into two kinds lets each feature own its case.
      - **One fact in two shapes is unified before a feature owns it, and two facts in one shape are kept apart.** typescript's `let` and `var` and rust's `mut` say one thing, that the binding is `mutable` (§3.3), while a compile-time constant (rust's `const` and `static` items) is `declaration.constant`, a kind apart from typescript's `const` binding.
      - **A feature composed by content reaches nothing until a reader derives it.** Python composes `visibility`, `accessors`, `abstract-classes`, `explicit-overrides` and `operator-overloading` by naming conventions, decorators and dunders, and its bindings route none of their members. They stay composed, as the table says, and the inventory reports them.
- **Refinements and flags (§3.3).** The eligibility census (`docs/superpowers/probes/2026-10-10-flag-eligibility/`) leaves these, each with a recommendation. Removing a fact or renaming one changes lines of `bindings.scm`; moving a fact between a refinement and a flag changes none (§2.1).
  - **V19. Two `const` type parameters.** Rust's const generic parameter changes eligibility, so it is a refinement kind, today `declaration.type_parameter.const`. Typescript's `const T` is a token on a type parameter and changes nothing else, so it is a flag, and §6's first rule names it `const`: the same path. (a) Rust's kind becomes `declaration.type_parameter.value`, a parameter that is a value, as `const-generics` describes it, and the flag keeps its keyword. (b) The flag takes another name. Recommendation: (a).
  - **V20. Flags one node never spells together.** The census compares slots, so it does not see two facts of one node that its grammar refuses together. Typescript has three groups, and rust's and python's flag-holding kinds have none:
    - a field's `?` and `!` (`optional` and `definite`);
    - a field's `abstract` with `static`, `override` or `accessor`, and its `accessor` with `static`, `override` or `readonly`, where tree-sitter-typescript is stricter than TypeScript, which accepts `static accessor`;
    - a method's generator `*` with `get` or `set`.

    A build that sets both renders text that does not parse. (a) The generator derives each kind's excluded pairs from its grammar, a build that sets both is refused with the pair named, and the inventory lists the pairs. (b) As (a), and the types also drop a step once a flag it excludes is set, costed with the flag encoding (§3.4). (c) Nothing: the built-render-parse lane finds the text. Recommendation: (a). The exclusions are a grammar's, not the facts': tree-sitter-typescript refuses `static accessor`, which TypeScript accepts. Recasting them as axes would put one grammar's limits into the portable surface.
  - **V21. Rust's `mut` where it does not mean exclusive.** `&mut T`, `&mut x` and `&mut pat` set `exclusive` (§3.3). A raw pointer's and a raw borrow's `mut` (`*mut T`, `&raw mut x`) say the pointer may write, and raw pointers alias, so `exclusive` would misstate them. Recommendation: a flag of their own, `writable`, on `type.pointer` and on the raw borrow.
  - **V22. Rust's static items.** A static item is `declaration.constant` (§3.3), so `static mut X` is a constant with `mutable` set, lazy_static's `static ref X` is one with `byReference` set, and `declaration.variable.static` goes. Recommendation: accept, since `mutable` is the binding's mutability here as everywhere.
  - **V23. A typed receiver.** `fn f(self: Box<Self>)` has no `self_parameter`: its receiver is a `parameter` whose pattern is `self`. A claim that sets `static` where it finds no `self_parameter` sets it on this method too. Recommendation: the claim tests for both, and a typed receiver is `declaration.parameter.self`, unrefined, with its `type`.
  - **V24. `pattern.reference`.** It names `ref x` today, whose `ref` is now the `byReference` flag, while `&pat` is `pattern.reference.value`. Recommendation: `&pat` takes `pattern.reference`, as `&T` is `type.reference` and `&x` `expression.reference`, and `ref_pattern` and `mut_pattern` become envelopes that set `byReference` and `mutable` on the pattern they wrap (§9).
  - **V25. `await using` beside `async with`.** Typescript's `await using` sets `disposable` and `await`, while python's `async with`, the same async use of a resource, sets `async`, as typescript's `for await` does. Recommendation: `await using` sets `disposable` and `async`, so one flag names every async form.
  - **V26. Spellings no option lists yet.** A float's exponent marker is an option in typescript and has none in python, and the trailing comma after rust's last match arm or after python's comprehension `for` clause has none in either. Under §3.3 each stays a refinement kind. Recommendation: python's options gain the marker, and a trailing-delimiter option covers the two commas, as `Delimiter.Trailing` covers rust's field lists, so options own them and no kind is added.
