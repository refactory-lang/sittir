# Vocabulary synonyms: neutral terms, name-only kinds and identifiers

**Question.** The vocabulary takes idiomatic synonyms. A kind's segment, a refinement's segment and a flag take the neutral term where one exists, and each language's own word becomes a synonym. A synonym is accepted wherever a path or a flag is written, and only the canonical name is ever stored. This probe takes three censuses:

- which segments rename to a neutral term, which synonyms each takes, and whether the resulting table passes the collision rule;
- which features and kinds add a fact, and which add only a name;
- which identifier kinds are identifiers, qualified identifiers, reserved-word relaxations, or facts of their own.

**Measured** at `feat/bindings` 8a80d34a3. The probe reads its vocabulary (`packages/types/src/vocabulary/`), the three `bindings.scm` files, and each grammar's `node-types.json` and `grammar.json`. The maintainer ruled every question on 2026-10-12, and the tables and `proposal.json` give the rulings (Rulings, below).

Some rulings are not on that commit yet. Where one touches a row, the row says so. They are:
- the `static` flag, which drops `declaration.method.static`;
- python's typed and default parameters become `declaration.parameter`;
- the binding flags, which drop `declaration.variable.constant` and `.reassignable`;
- rust's static items become `declaration.constant`;
- rust's `ref` and `mut` patterns become envelopes.

## Run

```sh
docs/superpowers/probes/2026-10-12-vocabulary-synonyms/run.sh [commit]   # default origin/feat/bindings
```

- **`census.py`** reads every vocabulary source and the bindings files. For each kind it records the owner, members and flags, crediting each member or flag to the feature that declares it. For each claim line it records the paths the line names.
- **`report.py`** writes the four results:
  - `results/features.txt`: each feature, the languages that compose it, and the kinds, members and flags it owns.
  - `results/kinds.txt`: every kind except the owner × level refinements, with its owner, its claims per grammar, its members and its flags.
  - `results/identifiers.txt`: each grammar's identifier-like kinds, the paths that claim them, and the words the grammar aliases to an identifier kind.
  - `results/collisions.txt`: applies the proposal's renames to the 587 kinds, then checks every synonym against the collision rule at every position its canonical segment has.
- **`proposal.json`** holds the ruled proposal. It has 73 renames: 24 to neutral terms, 27 that collapse name-only kinds, 13 that collapse identifiers, one that removes `statement.import.type`, since a type-only import or export is the `typeOnly` flag, and eight from the SCIP census (`../2026-10-12-scip-kinds/`): the root level `module` becomes `file`, rust's static item is a `declaration.variable`, and the six getter and setter kinds move from `declaration.method` to `declaration.property`. It adds 22 kinds: the primitive types' 16 refinements, the rest type's `**` form, typescript's import-equals statement, and `declaration.property` with its three visibility refinements, which typescript's auto-accessor takes. It gives 61 canonical segments 87 synonyms. Its flag table is empty, and it excludes ten words. Each rename carries the question that decides it. The members merged kinds take are in §2, not in the file.

## Answer

1. **Neutral terms.**
   - Eighteen facts rename to a neutral term (§1).
   - The table passes the collision rule: 120 synonym positions were checked, with no collision (§4).
   - No flag needs a synonym. Every flag name is either neutral or the only language's word for the flag. Flags can still take synonyms; that needs three more checks (§4).
2. **Name-only.**
   - No feature is a name and nothing else.
   - Five features own no kind, member or flag: the markers that the bindings spec's feature table already records. `manifest-typing` owns a restatement and nothing more (§2).
   - Inside features, there are twelve groups where one fact has two kinds, or one kind holds two facts.
   - A merged kind has one set of members, and each grammar's captures fill them from its own fields (§2).
3. **Identifiers.** There are fourteen identifier kinds, plus five type-level name kinds.
   - The role kinds and the qualified names collapse to two kinds, `identifier` and `identifier.qualified`.
   - The reserved-word relaxations already parse as identifiers and need no change.
   - Five kinds hold facts of their own:
     - the receiver (typescript's `this`, rust's `self`);
     - typescript's `super`;
     - rust's labels;
     - rust's lifetimes;
     - rust's macro metavariables (§3).
   - The primitive types are a supertype, with a refinement for each primitive (§3).

## 1. Neutral terms

A segment takes the term no language owns when such a term exists. Each language's own word becomes a synonym. Some segments are one language's word for a fact that no other language has, such as `comprehension`, `macro`, `lifetime` and `turbofish`. Those keep their word, since no other language needs a synonym for them.

**Renames.** In the table, p, r and t mark the claiming grammar: python, rust and typescript.

| today | proposed | the languages' words | question |
| --- | --- | --- | --- |
| `declaration.parameter.self` (r, t) | `declaration.parameter.receiver` | rust `self`, typescript `this`; Go and Kotlin say receiver | NT1 |
| `clause.except` (p) | `clause.catch`, as typescript's | `catch` (typescript, Java, C#, C++), `except` (python), `rescue` (Ruby). A handler would not say that it handles errors | NT2 |
| `expression.collection.dictionary` (p); with it `expression.comprehension.dictionary`, `element.splat.dictionary`, `pattern.splat.dictionary` and `pattern.case.dictionary` | `…map` | `dict` (python); dictionary (C#, Swift); map (Java, C++, Go, rust, Kotlin) | NT3 |
| `argument.keyword` (p) | `argument.named` | keyword argument (python); named argument (C#, Kotlin); the feature is `named-arguments` | NT4 |
| `clause.elif` (p) | `clause.else_if` | `elif` (python), `elsif` (Ruby, Perl), `elseif` (PHP) | NT4 |
| `expression.binary.nullish`, `expression.assignment.compound.nullish` (t) | `…coalesce` | nullish coalescing (typescript), null-coalescing (C#), nil-coalescing (Swift) | NT4 |
| `expression.block.gen` (r) | `expression.block.generator` | `gen` (rust); the `generator` flag and the `coroutines` feature already say generator | NT4 |
| `literal.char` (r) | `literal.character` | `char` (rust, C, Java), `rune` (Go) | NT4 |
| `literal.string.triple` (p) | `literal.string.multiline` | triple-quoted (python), multiline string literal (Swift) | NT4 |
| `declaration.method.dunder` (p) | `declaration.method.special` | python's reference calls them special methods; dunder and magic are its slang | NT4 |
| `statement.import.crate` (r) | `statement.import.package` | crate is rust's word for a package | NT4 |
| `expression.binary.matmul`, `expression.assignment.compound.matmul` (p) | `…matrix_multiply` | `__matmul__` (python); every other operator segment is a word | NT4 |
| `expression.call.path` (r) | `expression.call.qualified` | a rust path is a qualified name (ID2) | NT4 |
| `expression.call.new` (t) | `expression.call.construct` | `new` (typescript, Java, C#, C++); python, rust, Kotlin and Swift call the type | NT5 |
| `statement.with`, `clause.with`, `clause.with.item` (p) | `statement.resource`, `clause.resource`, `clause.resource.item` | `with` (python), `using` (typescript, C#), try-with-resources (Java); the feature is `resource-management` | NT6 |
| `expression.try` (r) | `expression.propagate` | the question mark operator (rust); `try` (Swift, Zig); the feature is `error-propagation` | NT7 |
| `element.splat` (p `*x`, t `...x`), `element.splat.parenthesized` (p) | `element.spread`, `element.spread.parenthesized` | splat or unpacking (python); spread (typescript, Kotlin, C#) | NT8 |
| `statement.loop.for` (p, r, t `for…of`) | `statement.loop.for_each` | `for` (python, rust, typescript), `foreach` (C#, PHP). `for` stays excluded (NT10), since typescript's three-part loop says it too | NT13 |

**Synonyms on names that stay** (NT9). The collapses below add more (§2, §3).

| level | canonical: synonyms |
| --- | --- |
| `argument` | `named`: keyword |
| `clause` | `catch`: except, rescue · `else_if`: elif, elsif, elseif · `finally`: ensure · `resource`: using · `wildcard`: glob · `bounds`: constraint · `case`: arm |
| `declaration` | `receiver`: self, this · `module`: mod · `struct`: record · `type_alias`: typedef, typealias · `enum_member`: variant, enumerator · `constructor`: initializer, init · `extension`: impl · `special`: dunder, magic · `foreign`: extern · `internal`: crate · `index`: indexer |
| `element` | `spread`: splat, unpack · `map`: dictionary, dict |
| `expression` | `coalesce`: nullish · `generator`: gen · `construct`: new · `propagate`: try · `lambda`: closure, arrow · `member`: attribute, field, property · `subscript`: index · `conditional`: ternary · `reference`: borrow · `list`: array · `compound`: augmented · `map`: dictionary, dict · `matrix_multiply`: matmul · `qualified`: path, scoped |
| `identifier` | `qualified`: dotted, nested, scoped, path · `receiver`: self, this · `super`: base |
| `literal` | `character`: char, rune · `null`: none, nil · `interpolated`: f, template · `multiline`: triple |
| `modifier` | `internal`: crate |
| `pattern` | `list`: array, slice · `rest`: splat, unpack · `map`: dictionary, dict · `struct`: record |
| `statement` | `resource`: using · `empty`: pass · `throw`: raise · `import`: use · `package`: crate |
| `type` | `rest`: splat, unpack · `nullable`: maybe · `reference`: borrow · `boolean`: bool · `character`: char · `string`: str · `int8`: byte · `int16`: short · `float64`: double |

**Excluded words** (NT10). A word that two languages use for two different facts is a synonym of neither.

| word | the two facts |
| --- | --- |
| `with` | python's resource statement; typescript's dynamic scope, `statement.scope` |
| `super` | typescript's base-class reference; rust's parent module at a path's root |
| `as` | rust's numeric conversion; typescript's type assertion |
| `is` | python's identity test; the type test of C#, Kotlin and Swift |
| `mut` | rust's binding mutability (`mutable`); a reference's exclusivity (`exclusive`) |
| `for` | typescript's three-part loop (`statement.loop.counted`); every language's for-each (`statement.loop.for_each`, NT13) |
| `static` | a member with no receiver (the `static` flag); rust's static item, a `declaration.constant` |
| `int` | 32 bits in C, Java and C#; pointer-sized in Go and Swift |
| `long` | 64 bits in Java and C#; platform-sized in C |
| `float` | 32 bits in C, Java, C# and Swift; a double in python |

`self` is not excluded, although rust spells its receiver and its current module at a path's root with it. ID4 makes the path-root `self` an alias kind that claims `identifier`, so the word names only the receiver, whose synonym it is (NT1, ID5).

## 2. Name-only features and kinds

**Features that own no kind, member or flag.**

| feature | composed by | what it names |
| --- | --- | --- |
| `concurrency-syntax` | none | Go's `go` and channels, Swift's actors. No grammar has them |
| `deferred-execution` | none | `defer` (Go, Swift). No grammar has it |
| `operator-overloading` | python, rust | Python's special methods belong to `methods` (`declaration.method.special`). Rust's operator trait impls have no syntax of their own |
| `overloading` | typescript | Typescript's overload signatures are `declaration.function.signature`, a base kind that rust's bodiless signatures claim too |
| `nullable-types` | python, typescript | The type it names, typescript's grammar's `?T`, is `type.maybe`, which `type-annotations` owns. Python writes a nullable type as a union or a generic |
| `manifest-typing` | rust | Nothing but a restatement: rust's field `type` is required. It is a fact, but not a member |

The bindings spec's feature table records the first five as markers that a composition names. NO12 gives `nullable-types` its type, `type.nullable`, so four stay markers.

**Kinds that name one fact twice, or one kind that holds two facts.**

| group | today | collapse | question |
| --- | --- | --- | --- |
| interface | `declaration.interface` (t), `declaration.interface.trait` (r) | Kept: trait stays a refinement, and `trait` and `protocol` are no synonyms of `interface`. A collapse would have needed where clauses split out of `bounded-quantification`, which typescript composes without having any where clause, and `unsafe` declared on the interface | NO1, ruled (b) |
| catch | `clause.catch` (t: `body`, `catchClauseGroup`), `clause.except` (p: `exception`, `alias`, `suite`) | One kind, `clause.catch`, with members `name`, `type` and `body`. Typescript's catch group is hoisted, as its low-level `catchClause` hoists it: the group's `parameter` and `type` are the clause's `name` and `type`. Python's `group` flag stays | NO2 |
| interpolated string | `literal.string.f` (p), `literal.template` (t) | `literal.string.interpolated` | NO3 |
| list pattern | `pattern.array` (t), `pattern.list` (p), `pattern.slice` (r: `patterns`) | `pattern.list`, with its items in `elements` | NO4 |
| rest | `pattern.rest` (t: `lhsExpression`), `pattern.splat` (p: `target`); `type.rest` (t), `type.splat` (p) | One pattern kind and one type kind. The pattern's operand is `pattern`, as `pattern.mutable`'s, `.reference`'s and `.captured`'s are, and the type's is `type`. Python's `operator` member goes: `**` is the `.map` refinement, `pattern.rest.map` (as `**kwargs` is) and `type.rest.map` (`**P`) | NO5 |
| bounds | `clause.bounds` (r), `clause.constraint` (t) | One kind, `clause.bounds`. The members that hold it, `constraint` on type parameters and type arguments and `bounds` on where predicates, associated types and lifetime parameters, become `bounds`, and the clause is hoisted into them, as NO2's group is: an owner's `bounds` is the list of bounds itself. Read directly, the clause keeps its `bounds` | NO6 |
| match case | `clause.match.arm`, `.arm.last` (r), the unclaimed `clause.match`; `clause.case.match` (p) | `clause.case.match`, with `pattern`, `guard`, `body` and rust's `attributes`. Rust's match pattern is hoisted into its arm, so `pattern.match` goes, and python's `if` guard into its case. Python's `case a, b:` is one tuple pattern without parentheses, read through a grammar-bindings split of python's case into one pattern or a list. The last arm differs only in that its comma is optional, which is a position, not a fact | NO7 |
| as-pattern | `pattern.case.as` (p), `pattern.captured` (r, `x @ p`); `pattern.as` (p, `with` items) | The first two become `pattern.as`, with `pattern` and `name`. Python's `as_pattern` is no pattern: its grammar admits `x as y` as an expression so that with items can hold it, so it becomes a container. The with item captures its `expression` as `value` and its `alias` as `name`, as the catch clause names its binding | NO8 |
| case patterns | `pattern.case.*` (p) | Drop the `case` segment. list → `pattern.list`, tuple → `pattern.tuple`, or → `pattern.or`, splat → `pattern.rest`, dictionary → `pattern.map`, class → `pattern.struct`, keyword → `pattern.struct.field`, complex → `pattern.complex`. `case_pattern` becomes a container. `pattern.or` keeps rust's pairs, `left` and `right`, and python's grammar bindings nest its list as pairs, as ID2 nests its dotted names. Rust's tuple-struct pattern joins `pattern.struct` too: its `fields` hold a bare pattern for each positional sub-pattern and a `pattern.struct.field` for each named one, and rust's portable build picks the struct or tuple-struct form by input shape | NO9 |
| cast | `expression.cast.as` (r conversion, t `x as T`), `expression.cast.assertion` (t `<T>x`) | Rust's conversion becomes `expression.cast.conversion`. Typescript's two assertions become `expression.cast.assertion`, with the `<T>x` spelling a refinement of it. Every cast holds `expression` and `type` | NO10 |
| renamed import | `clause.import.as` (r `use a as b`), `clause.import.alias` (p `import a as b`, t `import A = N.B`) | Rust's and python's become `clause.import.alias`, with `name` and `alias`, as typescript's import and export specifiers have. Typescript's import-equals declaration becomes `statement.import.alias`, with `name` and `value` | NO11 |
| nullable | `type.maybe` (t), owned by `type-annotations`; `nullable-types` owns nothing | `type.nullable` (synonym `maybe`), owned by `nullable-types` | NO12 |

**A merged kind's members.** Merging two kinds merges their slots. The kind's interface names each member once, and each grammar's `bindings.scm` captures its own fields onto those names, as python's except clause already captures `exception` and `alias` through its exception group. A hoisted node (typescript's catch group, rust's match pattern, python's `if` guard, the bounds clause in its owners) is captured through, so it is no member of its own.

| merged kind | member | python | rust | typescript |
| --- | --- | --- | --- | --- |
| `clause.catch` | `name` | `alias` | | the catch group's `parameter` |
| | `type` | `exception` | | the catch group's `type` |
| | `body` | `suite` | | `body` |
| `literal.string.interpolated` | `elements` | the string's pieces | | `elements` |
| `pattern.list` | `elements` | `elements`; the case list's `listPatternCasePatterns` | the slice's `patterns` | `elements` |
| `pattern.tuple` | `elements` | the case tuple's `listPatternCasePatterns` | `elements` | |
| `pattern.map` | `elements` | the dict pattern's `elements` | | |
| `pattern.rest` | `pattern` | `target`; the case splat's `name` | | `lhsExpression` |
| `type.rest` | `type` | `name` | | `type` |
| `clause.case.match` | `pattern` | the case's patterns: one, or a tuple of several | the match pattern's `pattern` | |
| | `guard` | the `if` clause's `condition` | the match pattern's `condition` | |
| | `body` | `consequence` | `value` | |
| | `attributes` | | `attributes` | |
| `pattern.as` | `pattern` | the case pattern | `pattern` | |
| | `name` | the identifier | `name` | |
| `clause.resource.item` | `value` | `value`, or the as-pattern's `expression` | | |
| | `name` | the as-pattern's `alias` | | |
| `pattern.struct` | `type` | the class pattern's `name` | the struct's and the tuple struct's `type` | |
| | `fields` | the class pattern's `arguments` | the struct's `fields`; the tuple struct's `patterns` | |
| `pattern.struct.field` | `name` | the keyword pattern's `name` | `name` | |
| | `pattern` | the keyword pattern's `value` | `pattern` | |
| `pattern.or` | `left`, `right` | the union pattern's `patterns`, nested as pairs | `left`, `right` | |
| `expression.cast.*` | `expression` | | `value` | `expression` |
| | `type` | | `type` | `type_annotation`; the type argument of `<T>x` |
| `clause.import.alias` | `name` | `name` | `path` | |
| | `alias` | `alias` | `alias` | |
| `statement.import.alias` | `name`, `value` | | | `name`, `value` |
| owners of `clause.bounds` | `bounds` | | the type parameter's and the type argument's `constraint`; `bounds` elsewhere | the type parameter's `constraint` |

## 3. Identifiers

| grammar kind | grammar | today | class | proposed |
| --- | --- | --- | --- | --- |
| `identifier` | p r t | `identifier` | identifier | `identifier` |
| `type (identifier)`, a placed claim | p | `identifier.type` | role: a type's position | `identifier` |
| `type_identifier` | r t | `identifier.type`; rust's prelude names `type.named.prelude` | role | `identifier` |
| `field_identifier` | r | `identifier.field` | role | `identifier` |
| `property_identifier`, `private_property_identifier` | t | `identifier.property` | role. A private name's fact is its holder's `privateName` flag | `identifier` |
| `shorthand_property_identifier`, `…_pattern` | t | `identifier.property.shorthand` | role: a property whose key is its value | `identifier` |
| `shorthand_field_identifier` | r | `identifier.property.shorthand` | role | `identifier` |
| `statement_identifier` | t | `identifier.label` | role: a label's position | `identifier` |
| `dotted_name` (`names`) | p | `identifier.dotted` | qualified | `identifier.qualified` |
| `nested_identifier` (`object`, `property`) | t | `identifier.nested` | qualified | `identifier.qualified` |
| `scoped_identifier` (`path`, `name`) | r | `identifier.scoped` | qualified | `identifier.qualified` |
| `scoped_type_identifier`, `…_in_expression_position` | r | `type.path`, `type.path.expression` | qualified, in a type's position | `identifier.qualified` |
| `nested_type_identifier` (`module`, `name`), `member_type` | t, p | `type.path` | qualified, in a type's position | `identifier.qualified` |
| `print`, `exec`, `async`, `await`, `match` and `type`, aliased to `identifier` | p | `identifier` | relaxation | no change |
| 22 reserved words aliased to `identifier` and the property, shorthand and label kinds | t | the kind they stand in | relaxation | no change |
| `default`, `gen`, `union` and 17 primitive type names, aliased to `identifier` | r | `identifier` | relaxation | no change |
| `crate` | r | `identifier.crate` | relaxation: a path's root. `pub(crate)` is already a kind of its own | `identifier` |
| `super` | r | `identifier.super` | relaxation: the parent module at a path's root | `identifier` |
| `self` | r | `identifier.self` | the receiver in expressions and typed `self` parameters; the current module at a path's root and in `pub(self)` | at a path's root, an alias kind that claims `identifier`; elsewhere the receiver (ID4) |
| `this` | t | `identifier.self` | fact: the receiver | `identifier.receiver` |
| `super` | t | `identifier.super` | fact: the base-class reference | `identifier.super` |
| `label` (`name`) | r | `identifier.label` | fact: a sigiled name in the label namespace | `identifier.label` |
| `lifetime` (`name`) | r | `identifier.lifetime` | fact: a sigiled name in the lifetime namespace | `identifier.lifetime` |
| `metavariable` | r | `identifier.metavariable` | fact: `$x`, a name in the macro's namespace | `identifier.metavariable` |
| `primitive_type`, `predefined_type` | r t | `type.primitive`, `.never` | fact: a keyword type | `type.primitive`, a supertype with a refinement for each primitive (below) |
| none | | `type.named` | unclaimed | removed |

**Primitive types.** Each grammar's primitive kind is a choice of keywords: rust's `primitive_type` has 17 and typescript's `predefined_type` 10, and sittir's model already makes each of typescript's keywords a variant. So `type.primitive` is a supertype, and each primitive is a refinement of it, claimed by its text as `type.primitive.never` already is (`#eq? "never"`). The numeric ones sit under two levels, so that one test covers every integer type. Widths take the numeric names that Go, Swift, .NET's types and C's `stdint` share. A word takes a synonym only where every language gives it one width: `int` is 32 bits in C, Java and C# but pointer-sized in Go and Swift, `long` is 64 bits in Java and C# but platform-sized in C, and `float` is a double in python, so the three are excluded (§1).

| refinement | rust | typescript | synonyms |
| --- | --- | --- | --- |
| `integral.int8`, `.int16`, `.int32`, `.int64`, `.int128` | `i8` and `u8` … `i128` and `u128` | | `int8`: byte · `int16`: short |
| `integral.size` | `isize`, `usize` (C's `size_t`, C#'s `nint`, Go's and Swift's `int`) | | |
| `floating.float32`, `.float64` | `f32`, `f64` | `number` is `float64` | `float64`: double |
| `boolean` | `bool` | `boolean` | bool |
| `character` | `char` | | char |
| `string` | `str` | `string` | str |
| `never` | `!` (`never_type`) | `never` | |
| `void`, `any`, `unknown`, `object` | | each keyword | |
| `symbol` | | `symbol`, `unique symbol` | |

Two yes/no facts are flags, as a yes/no fact always is: `unsigned` on the integral kinds, which rust's `u8` … `usize` set, and `unique` on `symbol`.

## 4. The collision rule, as checked

`report.py` first applies the renames. Then, at every position a canonical segment has in its level, it rejects a synonym that:
- is equal to a sibling segment or to a sibling's synonym;
- is equal to a flag that the parent kind or a kind above it declares, or to that flag's synonym;
- is not spelled as a segment.

A flag's synonym is rejected when it is equal to any of these:
- another flag, or another flag's synonym;
- a member of a kind that has the flag;
- a segment or synonym beneath such a kind.

These three checks are the ones flags need beyond the segment checks.

**Result.** 120 synonym positions were checked, with no collision. There is one note: `try` is a synonym of `propagate` at the `expression` level, and also the canonical segment of `expression.block.try`. That is legal, because canonical names resolve first at each position.

## Findings

1. **Typescript's optional chaining sets no flag.**
   - The `optionalChain` flag is declared on `expression.subscript` alone.
   - Typescript's bindings capture `@optional_chain` on member and subscript expressions. That is snake case, which names no flag.
   - `expression.member` declares no such flag, and nothing reaches `a?.()`.
2. **`clause.import.alias` holds two facts.** Python's renamed import, and typescript's import-equals declaration. Rust's renamed import, the first fact, has a kind of its own.
3. **`expression.cast.as` holds two facts, and typescript's assertion has two kinds.** Rust's numeric conversion and typescript's type assertion share the keyword `as`.
4. **Two features are cut too coarsely for trait to collapse into interface** (NO1, which keeps the refinement). Where clauses are bundled into `bounded-quantification`. Default method bodies have no feature at all. They are typed through the body's slot, so they need no member.
5. **`clause.bounds.higher_ranked`, `.removed` and `.use` are single bounds, not clauses.** They sit beneath the clause that holds a list of them.
6. **`type.named` has no claim. `type.named.prelude` decides by text** whether rust's `type_identifier` is one of five prelude names. That is a name's resolution, not syntax, and it gives that grammar kind a second line, beneath `type`, beside `identifier.type`.
7. **One fact has several member names.**
   - A bound: `constraint` and `bounds`.
   - A qualified name's left part: `baseType`, `module`, `object` or `path`.
   - A rest pattern's operand: `lhsExpression` and `target`.
   - A catch clause's parts: `catchClauseGroup`, against `exception` and `alias`.
   - Grammar names still leak into members: `casePatterns`, `listPatternCasePatterns`, `catchClauseGroup`.

   The rulings give each of these facts one member name (§2's second table, ID2's `qualifier` and `name`).
8. **A segment's synonyms reach every position it has in its level.**
   - `rest` reaches rust's `..` in struct patterns.
   - `struct` reaches the tuple-struct pattern.
   - `generator` reaches python's generator expression.

   Each reads correctly, because a segment keeps one meaning within its level.
9. **A segment that several levels share repeats its synonyms in each.** `internal` repeats in `declaration` and `modifier`; `map` in `expression`, `element` and `pattern`.
10. **Rust's `self` is one grammar kind with two meanings.** In expressions and typed `self` parameters it is the receiver. At a path's root and in `pub(self)` it is the current module (ID4).
11. **Python's case patterns still hold operators as members.** `pattern.case.splat` and `pattern.case.complex` each have an `operator` member, although the bindings spec has every operator be an axis value.

## Rulings

The maintainer ruled each question on 2026-10-12. Where a ruling went beyond the options, it says how.

**Neutral terms**

- **NT1.** `declaration.parameter.self` → `declaration.parameter.receiver`, with synonyms `self` and `this`. *Ruled: agree.* `self` is no excluded word (NT10).
- **NT2.** The catch clause. *Ruled (b):* `clause.catch`, with synonyms `except` and `rescue`. A handler would not say that it handles errors.
- **NT3.** Python's dictionaries, in five places. *Ruled (a):* `map`, with synonyms `dictionary` and `dict`.
- **NT4.** The ten renames the table marks NT4. *Ruled (a):* all of them.
- **NT5.** `expression.call.new`. *Ruled (a):* `construct`, with synonym `new`.
- **NT6.** Python's `with`. *Ruled (a):* `statement.resource`, `clause.resource` and `clause.resource.item`, with synonym `using`.
- **NT7.** Rust's `?`. *Ruled (a):* `expression.propagate`, with synonym `try`.
- **NT8.** Spreading and gathering, `*x` and `...x`. *Ruled (a):* `spread` where a value is built (`element.spread`) and `rest` in patterns and types (`pattern.rest`, `type.rest`), each with synonyms `splat` and `unpack`. These are typescript's two words by position; rust's `..` rest pattern and Kotlin's and C#'s spread share them.
- **NT9.** The synonym rows on names that stay (§1). *Ruled (a):* as a block.
- **NT10.** The excluded words (§1). *Ruled:* as listed, without `self` (NT1), and with `int`, `long` and `float` (§3).
- **NT11.** Flags can take synonyms, with the three checks of §4, and the flags' table starts empty, since no flag in the three grammars needs one. *Ruled: agree.*
- **NT12.** The mechanism's readings, which the bindings spec says. *Ruled: all six.*
  1. A level is a top-level namespace. A segment's synonyms hold at every position it has in its level. A segment that levels share takes its synonyms in each.
  2. The flags' synonyms are one table, since a flag name is one bit everywhere.
  3. A level's own name takes no synonym.
  4. A synonym is not gated. It follows its canonical segment.
  5. At each position, canonical names resolve first, then synonyms.
  6. A structure's `$kind` is canonical.
- **NT13.** `statement.loop.for`. *Ruled (b):* `statement.loop.for_each`. Typescript's three-part loop stays `statement.loop.counted`, and `for` stays excluded (NT10).

**Name-only**

- **NO1.** Collapse trait into interface. *Ruled (b):* keep the refinement. The bindings spec's placement paragraph, which keeps trait and protocol as refinements for SCIP's distinction, stands.
- **NO2 – NO11.** The collapses in §2's table. *Ruled:* each as the table gives it, with the members of §2's second table. Beyond the options:
  - NO2: typescript's catch group is hoisted, as its low-level `catchClause` hoists it.
  - NO5: the rest pattern's operand is `pattern`, and `**` is the `.map` refinement, which adds `type.rest.map`.
  - NO6: the bounds clause is hoisted into its owners, whose `bounds` is the list of bounds itself.
  - NO7: an arm holds one `pattern`, and python's several patterns are one tuple pattern without parentheses. Rust's match pattern and python's `if` guard are hoisted.
  - NO8: the with item names its binding `name`, as the catch clause does.
  - NO9 (a): python's class and keyword patterns become `pattern.struct` and `pattern.struct.field`. `pattern.or` takes pairs, and rust's tuple-struct pattern joins `pattern.struct`.
- **NO12.** The marker features. *Ruled (a):* keep them, as the feature table records, and give `nullable-types` its type, `type.nullable`.

**Identifiers**

- **ID1.** The role kinds: `identifier.type`, `.field`, `.property`, `.property.shorthand`, and typescript's label. *Ruled (a):* they collapse into `identifier`. The parent's slot names the role, and in a build a bare string fills the slot's own leaf kind. `privateName` picks the private name. Nothing but the slot tells a type name from a value name.
- **ID2.** Qualified names become `identifier.qualified`, with synonyms `dotted`, `nested`, `scoped` and `path`, and the pair forms take `qualifier` and `name`. *Ruled (b):* python's grammar bindings nest its flat `dotted_name` as pairs.
- **ID3.** The relaxations need nothing: python's 6 words, typescript's 22 and rust's 20 already parse as the identifier kind they stand in. *Ruled: agree.*
- **ID4.** Rust's path roots. *Ruled (a):* `super` and `crate` claim `identifier`, and `self` at the path sites is aliased into a kind that claims `identifier`, so that `self` everywhere else is the receiver. Like the `crate` alias, it needs no clones.
- **ID5.** The receiver: typescript's `this` and rust's `self` become `identifier.receiver`, with synonyms `self` and `this`. *Ruled: agree.*
- **ID6.** Typescript's `super` keeps `identifier.super`, the base-class reference, with synonym `base`. *Ruled: agree.*
- **ID7.** Rust's `label`, `lifetime` and `metavariable` stay, and so does `type.primitive`. *Ruled: agree,* with `type.primitive` a supertype that has a refinement for each primitive, the numeric ones under two levels with numeric names (§3).
- **ID8.** `type.named` and `type.named.prelude` go (finding 6). *Ruled: agree.*
