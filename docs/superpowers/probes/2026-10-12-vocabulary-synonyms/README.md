# Vocabulary synonyms: neutral terms, name-only kinds and identifiers

**Question.** The vocabulary takes idiomatic synonyms. A kind's segment, a refinement's segment and a flag take the neutral term where one exists, and each language's own word becomes a synonym. A synonym is accepted wherever a path or a flag is written, and only the canonical name is ever stored. This probe takes three censuses:

- which segments rename to a neutral term, which synonyms each takes, and whether the resulting table passes the collision rule;
- which features and kinds add a fact, and which add only a name;
- which identifier kinds are identifiers, qualified identifiers, reserved-word relaxations, or facts of their own.

**Measured** at `feat/bindings` 8a80d34a3. The probe reads its vocabulary (`packages/types/src/vocabulary/`), the three `bindings.scm` files, and each grammar's `node-types.json` and `grammar.json`.

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
- **`proposal.json`** holds the proposal. It has 63 renames: 24 to neutral terms, 26 that collapse name-only kinds, and 13 that collapse identifiers. It adds one kind. It gives 56 canonical segments 85 synonyms. Its flag table is empty, and it excludes eight words. Each rename carries the question below that decides it.

## Answer

1. **Neutral terms.**
   - Seventeen facts rename to a neutral term (§1).
   - The table passes the collision rule: 119 synonym positions were checked, with no collision (§4).
   - No flag needs a synonym. Every flag name is either neutral or the only language's word for the flag. Flags can still take synonyms; that needs three more checks (§4).
2. **Name-only.**
   - No feature is a name and nothing else.
   - Five features own no kind, member or flag: the markers that the bindings spec's feature table already records. `manifest-typing` owns a restatement and nothing more (§2).
   - Inside features, there are twelve groups where one fact has two kinds, or one kind holds two facts.
3. **Identifiers.** There are fourteen identifier kinds, plus five type-level name kinds.
   - The role kinds and the qualified names collapse to two kinds, `identifier` and `identifier.qualified`.
   - The reserved-word relaxations already parse as identifiers and need no change.
   - Five kinds hold facts of their own:
     - the receiver (typescript's `this`, rust's `self`);
     - typescript's `super`;
     - rust's labels;
     - rust's lifetimes;
     - rust's macro metavariables (§3).

## 1. Neutral terms

A segment takes the term no language owns when such a term exists. Each language's own word becomes a synonym. Some segments are one language's word for a fact that no other language has, such as `comprehension`, `macro`, `lifetime` and `turbofish`. Those keep their word, since no other language needs a synonym for them.

**Renames.** In the table, p, r and t mark the claiming grammar: python, rust and typescript.

| today | proposed | the languages' words | question |
| --- | --- | --- | --- |
| `declaration.parameter.self` (r, t) | `declaration.parameter.receiver` | rust `self`, typescript `this`; Go and Kotlin say receiver | NT1 |
| `clause.catch` (t), `clause.except` (p) | `clause.handler` | `catch` (typescript, Java, C#), `except` (python), `rescue` (Ruby). C++ names the clause a handler, and `statement.try` already holds `handlers` | NT2 |
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

**Synonyms on names that stay** (NT9). The collapses below add more (§2, §3).

| level | canonical: synonyms |
| --- | --- |
| `argument` | `named`: keyword |
| `clause` | `handler`: catch, except, rescue · `else_if`: elif, elsif, elseif · `finally`: ensure · `resource`: using · `wildcard`: glob · `bounds`: constraint · `case`: arm |
| `declaration` | `receiver`: self, this · `interface`: trait, protocol · `module`: namespace, mod · `struct`: record · `type_alias`: typedef, typealias · `enum_member`: variant, enumerator · `field`: property · `constructor`: initializer, init · `extension`: impl · `special`: dunder, magic · `foreign`: extern · `internal`: crate |
| `element` | `spread`: splat, unpack · `map`: dictionary, dict |
| `expression` | `coalesce`: nullish · `generator`: gen · `construct`: new · `propagate`: try · `lambda`: closure, arrow · `member`: attribute, field, property · `subscript`: index · `conditional`: ternary · `reference`: borrow · `list`: array · `compound`: augmented · `map`: dictionary, dict · `matrix_multiply`: matmul · `qualified`: path, scoped |
| `identifier` | `qualified`: dotted, nested, scoped, path · `receiver`: self, this · `super`: base |
| `literal` | `character`: char, rune · `null`: none, nil · `interpolated`: f, template · `multiline`: triple |
| `modifier` | `internal`: crate |
| `pattern` | `list`: array, slice · `rest`: splat, unpack · `map`: dictionary, dict · `struct`: record |
| `statement` | `resource`: using · `empty`: pass · `throw`: raise · `import`: use · `package`: crate |
| `type` | `rest`: splat, unpack · `nullable`: maybe · `reference`: borrow |

**Excluded words** (NT10). A word that two languages use for two different facts is a synonym of neither.

| word | the two facts |
| --- | --- |
| `with` | python's resource statement; typescript's dynamic scope, `statement.scope` |
| `super` | typescript's base-class reference; rust's parent module at a path's root |
| `self` | rust's receiver; rust's current module at a path's root |
| `as` | rust's numeric conversion; typescript's type assertion |
| `is` | python's identity test; the type test of C#, Kotlin and Swift |
| `mut` | rust's binding mutability (`mutable`); a reference's exclusivity (`exclusive`) |
| `for` | typescript's three-part loop (`statement.loop.counted`); every language's for-each (`statement.loop.for`, which keeps the word, NT13) |
| `static` | a member with no receiver (the `static` flag); rust's static item, a `declaration.constant` |

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

The bindings spec's feature table records the first five as markers that a composition names.

**Kinds that name one fact twice, or one kind that holds two facts.**

| group | today | collapse | question |
| --- | --- | --- | --- |
| interface | `declaration.interface` (t), `declaration.interface.trait` (r) | Trait's own facts are `whereClause` and `unsafe`. `whereClause` belongs to `bounded-quantification`, which typescript composes without having any where clause; `unsafe` belongs to `unsafe-code`. So the collapse needs where clauses split out of that feature, and `unsafe` declared on the interface. Then `trait` and `protocol` become synonyms | NO1 |
| handler | `clause.catch` (t: `body`, `catchClauseGroup`), `clause.except` (p: `exception`, `alias`, `suite`) | One kind, with members `type`, `name` and `body`. Python's `group` flag stays | NO2 |
| interpolated string | `literal.string.f` (p), `literal.template` (t) | `literal.string.interpolated` | NO3 |
| list pattern | `pattern.array` (t), `pattern.list` (p), `pattern.slice` (r: `patterns`) | `pattern.list`, with its items in `elements` | NO4 |
| rest | `pattern.rest` (t: `lhsExpression`), `pattern.splat` (p: `target`); `type.rest` (t), `type.splat` (p) | One pattern kind and one type kind, each with one operand member | NO5 |
| bounds | `clause.bounds` (r), `clause.constraint` (t) | One kind. Today the members that hold it are `constraint` on type parameters and type arguments, and `bounds` on where predicates, associated types and lifetime parameters. They take its name | NO6 |
| match case | `clause.match.arm`, `.arm.last` (r), the unclaimed `clause.match`; `clause.case.match` (p) | `clause.case.match`. The last arm differs only in that its comma is optional, which is a position, not a fact | NO7 |
| as-pattern | `pattern.case.as` (p), `pattern.captured` (r, `x @ p`); `pattern.as` (p, `with` items) | The first two become `pattern.as`. Python's `as_pattern` is no pattern: its grammar admits `x as y` as an expression so that with items can hold it, so it becomes a container whose `alias` the with item captures | NO8 |
| case patterns | `pattern.case.*` (p) | Drop the `case` segment. list → `pattern.list`, tuple → `pattern.tuple`, or → `pattern.or`, splat → `pattern.rest`, dictionary → `pattern.map`, class → `pattern.struct`, keyword → `pattern.struct.field`, complex → `pattern.complex`. `case_pattern` becomes a container | NO9 |
| cast | `expression.cast.as` (r conversion, t `x as T`), `expression.cast.assertion` (t `<T>x`) | Rust's conversion becomes `expression.cast.conversion`. Typescript's two assertions become `expression.cast.assertion`, with the `<T>x` spelling a refinement of it | NO10 |
| renamed import | `clause.import.as` (r `use a as b`), `clause.import.alias` (p `import a as b`, t `import A = N.B`) | Rust's and python's become `clause.import.alias`. Typescript's import-equals declaration becomes `statement.import.alias` | NO11 |
| nullable | `type.maybe` (t), owned by `type-annotations`; `nullable-types` owns nothing | `type.nullable` (synonym `maybe`), owned by `nullable-types` | NO12 |

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
| `self` | r | `identifier.self` | the receiver in expressions and typed `self` parameters; the current module at a path's root and in `pub(self)` | ID4 |
| `this` | t | `identifier.self` | fact: the receiver | `identifier.receiver` |
| `super` | t | `identifier.super` | fact: the base-class reference | `identifier.super` |
| `label` (`name`) | r | `identifier.label` | fact: a sigiled name in the label namespace | `identifier.label` |
| `lifetime` (`name`) | r | `identifier.lifetime` | fact: a sigiled name in the lifetime namespace | `identifier.lifetime` |
| `metavariable` | r | `identifier.metavariable` | fact: `$x`, a name in the macro's namespace | `identifier.metavariable` |
| `primitive_type`, `predefined_type` | r t | `type.primitive`, `.never` | fact: a keyword type | `type.primitive` |
| none | | `type.named` | unclaimed | removed |

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

**Result.** 119 synonym positions were checked, with no collision. There is one note: `try` is a synonym of `propagate` at the `expression` level, and also the canonical segment of `expression.block.try`. That is legal, because canonical names resolve first at each position.

## Findings

1. **Typescript's optional chaining sets no flag.**
   - The `optionalChain` flag is declared on `expression.subscript` alone.
   - Typescript's bindings capture `@optional_chain` on member and subscript expressions. That is snake case, which names no flag.
   - `expression.member` declares no such flag, and nothing reaches `a?.()`.
2. **`clause.import.alias` holds two facts.** Python's renamed import, and typescript's import-equals declaration. Rust's renamed import, the first fact, has a kind of its own.
3. **`expression.cast.as` holds two facts, and typescript's assertion has two kinds.** Rust's numeric conversion and typescript's type assertion share the keyword `as`.
4. **Trait is a refinement because two features are cut too coarsely** (NO1). Where clauses are bundled into `bounded-quantification`. Default method bodies have no feature at all. They are typed through the body's slot, so they need no member.
5. **`clause.bounds.higher_ranked`, `.removed` and `.use` are single bounds, not clauses.** They sit beneath the clause that holds a list of them.
6. **`type.named` has no claim. `type.named.prelude` decides by text** whether rust's `type_identifier` is one of five prelude names. That is a name's resolution, not syntax, and it gives that grammar kind a second line, beneath `type`, beside `identifier.type`.
7. **One fact has several member names.**
   - A bound: `constraint` and `bounds`.
   - A qualified name's left part: `baseType`, `module`, `object` or `path`.
   - A rest pattern's operand: `lhsExpression` and `target`.
   - A handler's parts: `catchClauseGroup`, against `exception` and `alias`.
   - Grammar names still leak into members: `casePatterns`, `listPatternCasePatterns`, `catchClauseGroup`.
8. **A segment's synonyms reach every position it has in its level.**
   - `rest` reaches rust's `..` in struct patterns.
   - `struct` reaches the tuple-struct pattern.
   - `generator` reaches python's generator expression.

   Each reads correctly, because a segment keeps one meaning within its level.
9. **A segment that several levels share repeats its synonyms in each.** `internal` repeats in `declaration` and `modifier`; `map` in `expression`, `element` and `pattern`.
10. **Rust's `self` is one grammar kind with two meanings.** In expressions and typed `self` parameters it is the receiver. At a path's root and in `pub(self)` it is the current module (ID4).
11. **Python's case patterns still hold operators as members.** `pattern.case.splat` and `pattern.case.complex` each have an `operator` member, although the bindings spec has every operator be an axis value.

## Questions

Recommendation first. Each question is answered by its number.

**Neutral terms**

- **NT1.** `declaration.parameter.self` → `declaration.parameter.receiver`, with synonyms `self` and `this`. This is the maintainer's own example, and the bindings spec now says it.
- **NT2.** The handler clause (NO2):
  - (a) `clause.handler`, with synonyms `catch`, `except` and `rescue`;
  - (b) `clause.catch`, with synonyms `except` and `rescue`.
- **NT3.** Python's dictionaries, in five places:
  - (a) `map`, with synonyms `dictionary` and `dict`;
  - (b) keep `dictionary`, with synonym `dict`.
- **NT4.** The ten renames the table marks NT4:
  - (a) all of them;
  - (b) name the ones to drop.
- **NT5.** `expression.call.new`:
  - (a) `construct`, with synonym `new`;
  - (b) keep `new`.
- **NT6.** Python's `with`:
  - (a) `statement.resource`, `clause.resource` and `clause.resource.item`, with synonym `using`. `with` is excluded (NT10);
  - (b) keep `with`.
- **NT7.** Rust's `?`:
  - (a) `expression.propagate`, with synonym `try`;
  - (b) keep `expression.try`.
- **NT8.** Spreading and gathering, `*x` and `...x`:
  - (a) `spread` where a value is built (`element.spread`) and `rest` in patterns and types (`pattern.rest`, `type.rest`), each with synonyms `splat` and `unpack`. These are typescript's two words by position; rust's `..` rest pattern and Kotlin's and C#'s spread share them;
  - (b) `splat` everywhere;
  - (c) `unpack` everywhere.
- **NT9.** The synonym rows on names that stay (§1):
  - (a) as a block;
  - (b) strike rows.
- **NT10.** The excluded words (§1):
  - (a) as listed. The bindings spec states the rule with `mut` as its example.
- **NT11.** Flags can take synonyms, with the three checks of §4. No flag needs one in the three grammars, so the flags' table starts empty:
  - (a) agree.
- **NT12.** Readings of the mechanism, which the bindings spec now says:
  1. A level is a top-level namespace. A segment's synonyms hold at every position it has in its level. A segment that levels share takes its synonyms in each.
  2. The flags' synonyms are one table, since a flag name is one bit everywhere.
  3. A level's own name takes no synonym.
  4. A synonym is not gated. It follows its canonical segment.
  5. At each position, canonical names resolve first, then synonyms.
  6. A structure's `$kind` is canonical, so the bindings spec's "`$kind` may be spelled with the language's term" goes.
  - Answer: (a) all; (b) name the ones to change.
- **NT13.** `statement.loop.for` keeps `for`. Typescript's three-part loop stays `statement.loop.counted`, and `for` is no synonym of it:
  - (a) keep;
  - (b) rename to `for_each`.

**Name-only**

- **NO1.** Collapse trait into interface, splitting a `where-clauses` feature out of `bounded-quantification` and declaring `unsafe` on the interface. The bindings spec's placement paragraph, which keeps trait and protocol as refinements for SCIP's distinction, reverses:
  - (a) collapse;
  - (b) keep the refinement.
- **NO2 – NO11.** The collapses in §2's table:
  - (a) each as written;
  - (b) name the ones to change.
- **NO9** has its own alternative:
  - (b) keep python's class and keyword patterns as `pattern.class` and `pattern.keyword`.
- **NO12.** The marker features:
  - (a) keep them, as the feature table records, and give `nullable-types` its type, `type.nullable`;
  - (b) drop the five until a grammar needs them.

**Identifiers**

- **ID1.** The role kinds collapse into `identifier`: `identifier.type`, `.field`, `.property`, `.property.shorthand`, and typescript's label.
  - The parent's slot names the role.
  - In a build, a bare string fills the slot's own leaf kind.
  - `privateName` picks the private name.
  - Nothing but the slot tells a type name from a value name.

  This reverses the earlier ruling that typescript's shorthand keeps a kind because the grammar gives it one. It also changes the bindings spec's §2.1 identifier bullet and its §10 identifier tests.
  - (a) collapse;
  - (b) keep a role kind wherever the grammar has one.
- **ID2.** Qualified names become `identifier.qualified`, with synonyms `dotted`, `nested`, `scoped` and `path`. The pair forms take `qualifier` and `name`. Python's `dotted_name` is a flat list:
  - (a) it keeps `names`, which is `never` in the other grammars;
  - (b) python's grammar bindings nest it as pairs.
- **ID3.** The relaxations need nothing. Python's 6 words, typescript's 22 and rust's 20 already parse as the identifier kind they stand in:
  - (a) agree.
- **ID4.** Rust's path roots. `super` and `crate` claim `identifier`. Rust's `self` is one grammar kind with two meanings (finding 10):
  - (a) alias `self` at the path sites into a kind that claims `identifier`, so that `self` everywhere else is the receiver. Like the `crate` alias, it needs no clones. It is not measured;
  - (b) all of rust's `self` is the receiver, path roots included;
  - (c) all of it is `identifier`, so rust's receiver reads as python's does.
- **ID5.** The receiver: typescript's `this` and rust's `self` become `identifier.receiver`, with synonyms `self` and `this`, matching NT1:
  - (a) agree.
- **ID6.** Typescript's `super` keeps `identifier.super`, the base-class reference, with synonym `base`. Rust's `super` is a path root (ID4):
  - (a) agree.
- **ID7.** These stay: rust's `label`, `lifetime` and `metavariable`, and `type.primitive`:
  - (a) agree.
- **ID8.** `type.named` and `type.named.prelude` go (finding 6):
  - (a) agree.
