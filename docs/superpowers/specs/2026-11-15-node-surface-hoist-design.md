# Node-surface hoist

**Status:** Design spec. Design only: it states the end state, and an implementer builds it from here.

## Decided by the maintainer

- **"The rule wherever it holds, the getter/setter and read shape (in the ts-side wrap layer) should be adjusted accordingly"** (2026-11-15). See §1 and §3.
- **"Here this has to be client side only"** (2026-11-15). This is the constraint §2 states.
- **"the portable api and bindings.scm should flatten scenarios like expression.expression"** (2026-11-15). That is the portable layer's counterpart, written in the bindings spec §6, rule 6. See §4.
- **A field a refine form pins has no setter: "the form defines"** (2026-11-15). See §8.
- **"Approve the list"** (2026-11-15), then **"Approve all 55 and the setter read"** (2026-11-16). The 276 slots in §5 and §6 are the approved change to the node surface: 221 first, then 37 more slots, 18 chain hops, and the setter signatures reading their one parameter (§7).
- **"Approve 11; hold alternation.terms"** (2026-11-17). The rule also holds in regex and scm, which the 276 did not cover. Approved: regex's 8 group and assertion slots whose `pattern` reads `Pattern` → `Alternation | Term` (`anonymous_capturing_group`, `named_capturing_group`, `non_capturing_group`, the three inline-flags groups, the lookahead and lookbehind assertions), and scm's 3 (`string.stringContent` and `immediate_string.stringContent` read `StringContent | undefined` → `readonly (StringContentText | EscapeSequence)[]`; `predicate.parameters` reads `Parameters | undefined` → `readonly (Capture | String | Identifier)[]`). Held: regex `alternation.terms`, whose hoisted read `NonEmptyArray<TermGroup>` loses the empty arms `NonEmptyArray<Term | null>` holds; it stays as on master.
- **"The chain stops there"** (2026-11-17). A hoist does not read through a wrapper that holds a list when the holder slot is itself a list: reading through would flatten the arms, so regex `a|b` and `ab` would read the same. `alternation.terms` keeps `NonEmptyArray<Term | null>` (`a||b` reads `[Term(a), null, Term(b)]`). It is the only such slot in the five grammars; the counts are python 71, rust 103, typescript 102, regex 8 and scm 3.
- **"Set through the existing wrapper"** (2026-11-15). The setter replaces what the wrapper already there holds, so the wrapper's own facts stay, and it builds a wrapper only when the holder has none. See §3.
- **"Hoist all that meet the rule"** (2026-11-15). No wrapper that meets the rule is held back, including the polymorphs that hold their own forms, the parameter lists with a receiver form, and the wrappers that are the thing read. See §5 and §7.
- **"Through the tree only"** (2026-11-15). A wrapper node is reached through the tree, with no second getter. See §3.
- **"Hoist; separator via the tree"** (2026-11-16). A list whose trailing separator is optional still hoists, and the separator stays on the wrapper. See §1.
- **"Input also admits the wrapper"** (2026-11-18). A hoisted slot's input, strict and loose, in a factory and in a setter, admits the hoisted type and each wrapper on its chain; a wrapper given as input passes through whole, with what it holds (a list's delimiter included). Reads stay hoisted. So the route to a hoisted list's delimiter is the tree: reach the wrapper by query, set its delimiter, and give the wrapper back to the holder's setter. A setter does not refuse a wrapper of its own chain.
- **A hoisted list reads as an empty list when its wrapper is there and holds no items** ("An empty list", 2026-11-18). `undefined` means the wrapper is absent. `fn f() {}` reads `parameters()` as `[]`; a function with no `<…>` reads `typeParameters()` as `undefined`. This replaces, for a chain that ends in a list, §3's "absent means the wrapper is there with its slot empty".
- **The portable layer reads a wrapper it claims as its path** ("Portable reads the path", 2026-11-18). Where a wrapper the hoist reads through is a portable path of its own, or a portable pattern matches inside it, the low-level read stays hoisted and the generated portable reader stops its chain at that wrapper, reading it by the holder's stored slot. The wrappers are python `else_clause` (`clause.else`) and `finally_clause` (`clause.finally`); rust `else_clause` (`clause.else`), `use_list` (`clause.import.list`) and `extern_modifier` (captured as `@extern`); typescript `import_clause` (`clause.import.names`), `export_clause` (`clause.export`) and the patterns inside `arguments`. The portable surface stays as on master, so python's `for x in y: pass` / `else: z` reads `for.alternative()` as `Block` and `statement.for.alternative` as `clause.else`. The hoist's counts are unchanged.

## 1. The rule

A holder's slot reads through a wrapper when all three hold:

1. the wrapper has one slot, and that slot holds nodes;
2. every other child of the wrapper is a token the wrapper always spells, so the wrapper carries no fact the holder couldn't rebuild;
3. the holder's slot admits only that wrapper.

Two cases fail condition 2 although every token is fixed:

- **The wrapper's presence is a fact** when its slot may be empty and the holder's slot is optional. Typescript's `new Foo` and `new Foo()` differ only in whether `arguments` is there.
- **A leaf is never a wrapper.** Rust's `'a` is a `lifetime` holding an `identifier` behind an always-spelled quote. Hoisted, it would read as an `Identifier`, and a lifetime read there couldn't be told from an identifier read anywhere else. The same holds for `label`. An alias leaf such as `type_identifier` has no child in the parse tree at all.

Condition 2 accepts these tokens:

- **A separator a list wrapper spells between its items, or before each one.** The items rebuild it, so it carries no fact. Python's `print >> f, a, b` spells a comma before each argument.
- **An optional trailing separator.** It is a fact, but the list still hoists, and the separator stays on the wrapper. A set through the wrapper keeps it (§3), a read walks to the wrapper to see it, and a new build's options decide it. So python's `c[1,]` and `c[1]` both read `index: [1]`, and only the `subscripts` wrapper shows the comma.
- **A zero-width token the parser always produces**, such as python's `_indent` and `_dedent`, which open and close a block.
- **The tokens around a polymorph's forms.** A polymorph whose forms sit between tokens it always spells is an ordinary wrapper, and conditions 1–3 decide it. An example is rust's `visibility_modifier_pub_scope`, `(` … `)`.

The rule composes. When the wrapper's own slot admits only another wrapper that meets the rule, the holder reads through both (§6). A chain stops at a slot that admits more than one kind, so the read there is that slot's node.

A wrapper reached under an alias meets the rule as the kind its alias site names in the holder's rule, a hidden rule the holder inlines included. Python's `block_statement` is `block` under `suite_block` and `suite_inline` elsewhere. Typescript's setter signatures reach `formal_parameters` as the hidden `_formal_parameters_set_accessor_signature`, whose one slot admits only a one-parameter envelope (§7).

## 2. Client side only

The hoist is a view the TypeScript wrap layer gives. Nothing below it changes.

| changes | stays as it is |
|---|---|
| the generated slot types of each holder (`types.ts`) | the grammar: its rules, kinds and kind ids |
| the wrap getters (`emitters/wrap.ts`) | the parse tree: every wrapper is still a node in it |
| the `$with` setters (`emitters/node-members.ts`) | the rust crates: node structs, per-slot accessors, render |
| the factories and the loose `from` input | the native build, which receives the wrapper node |
| the validators' reconstruction of a node's config | cursors and queries, which walk the tree |
| the slot-descending `is` guards (`is.ts`) | |

## 3. One stamped fact, and its readers

Codegen decides the rule once per holder slot, at model time, and stamps the slot with its chain: the wrapper kinds, outermost first (`[type_parameters, type_parameters_elements]`). Every consumer in §2 reads the stamp, and none re-derives the three conditions. A slot the rule doesn't hold for carries no stamp.

Every slot the rule holds for is stamped, a wrapper's own slot included. §5 and §6 list a chain once, at its outermost holder slot. A wrapper reached through the tree reads its own slot through the rest of its chain, so a `TypeParameters` node's `elements` reads `TypeParameter[]`. A wrapper that hoists at none of its holders, because their slots admit other kinds, is a holder like any other. Python's `list` keeps its node, and its `elements` reads through `collection_elements`.

- **Get.** The getter keeps the holder slot's name. It reads the holder's native slot, then each wrapper's one slot in turn, and returns the last read. It returns a list when any step holds a list.
- **Set.** The setter takes the hoisted type. When the holder already has the wrapper, it replaces what the innermost wrapper holds and leaves every wrapper on the chain in place, with its own facts: `$with.parameters([a, b, c])` on `def f(a, b,):` writes `def f(a, b, c,):`. When the holder has none, it builds each wrapper with that wrapper's own builder, innermost first, and each spells its fixed tokens.
- **Build.** A factory and a loose `from` input take the hoisted type and wrap it the same way.
- **An optional inner slot under a required holder.** The hoisted value is optional, and absent means the wrapper is there with its slot empty (§7).

The wrapper is reached through the tree only. Cursors, queries, ranges and trivia work on the native tree, where the wrapper is still a node with its own range and comments. No second getter returns it.

## 4. The portable flatten and the hoist

The two layers apply the same idea on their own terms. The portable layer flattens through `bindings.scm`: it drops the wrapper's claim and captures the child as `@element`. The hoist is the low-level counterpart. The wrappers the portable layer flattens also hoist (python's `type`, the decorators, the comprehension clauses). The hoist adds the list envelopes (`type_parameters`, `parameters`, `arguments`), which the portable layer already reads as lists.

## 5. Hoisted wrappers

Master's models. The holder slots are named `Type.getter`. The rule holds at 276 slots: python 71, rust 103 and typescript 102.

- **221 are outermost holder slots listed by wrapper.** Python 44 go through 17 wrappers, rust 85 through 23, and typescript 92 through 22. This section lists their single wrappers, §6 their chains, and rows marked §7 have their exact reads and setters there.
- **37 are listed by holder slot** at the end of this section, most of them the slot of a wrapper that hoists nowhere itself.
- **18 are chain hops**, a wrapper's own slot on a chain (§3), listed after them.

`sittir tool hoist-census` prints these tables from the stamp (§3), and a test pins the counts.

**Python**

| wrapper | source | holder slots | before → after |
|---|---|---|---|
| `type` | `def f(x) -> int:` | 14: `FunctionDefinition.returnType`, `TypedParameter.type`, `TypeAliasStatement.value`, … | `Type` → `int`, an `Expression \| GenericType \| UnionType \| …` |
| `comprehension_clauses` | `[y for y in z if y]` | 4: the list, set, dictionary and generator comprehensions' `clauses` | `ComprehensionClauses` → `(ForInClause \| IfClause)[]` |
| `else_clause` | `for x in y: … else: …` | 3: `alternative` of `for`, `while`, `try` | `ElseClause` → the block |
| `decorator` | `@functools.cache` before a `def` | 2: `DecoratedDefinition.decorators` and the class form | `Decorator[]` → `Expression[]` |
| `case_pattern` | `case {"k": v}:` | 2: `KeyValuePattern.value`, `CaseAsPattern.casePattern` | `CasePattern` → its form: `CaseAsPattern \| KeywordPattern \| simple_pattern` |
| `chevron` | `print >> f, x` | `PrintStatementChevron.chevron` | `Chevron` → `f` |
| `except_clause_exception` | `except E as e:` | `ExceptClause.exception` | `ExceptClauseException` → its form: `ExceptClauseExceptionAs \| ExceptClauseExceptionList` |
| `finally_clause` | `try: … finally: …` | `TryStatement.finalizer` | `FinallyClause` → the block |
| `if_clause` | `case x if x > 0:` | `CaseClause.guard` | `IfClause` → `x > 0` |
| `match_block` | `match x:` then `case 1: …` | `MatchStatement.body` | `MatchBlock` → `CaseClause[]` |
| `subjects` | `match a, b:` | `MatchStatement.subject` | `Subjects` → `[a, b]` |
| `subscripts` | `a[i, j]` | `Subscript.index` | `Subscripts` → `[i, j]` |

**Rust**

| wrapper | source | holder slots | before → after |
|---|---|---|---|
| `visibility_modifier` | `pub fn f() {}` | 20: every item's and field's `visibilityModifier` | `VisibilityModifier` → its form: `VisibilityModifierPub \| CrateVisibilityModifier` |
| `attribute_item` | `struct S { #[serde(skip)] a: u8 }` | 10: every attributed form's `attributeItems`, `FieldInitializer.attributes`, … | `AttributeItem[]` → `Attribute[]` |
| `trait_bounds` | `fn f<T: A + B>()` | 6: `TypeParameter.bounds`, `WherePredicate.bounds`, `TraitItem.bounds`, … | `TraitBounds` → `[A, B]` |
| `parameters` | `fn f(a: u8)` | 5: functions', methods' and function types' `parameters` | §7 |
| `macro_rules` | `macro_rules! m { () => {}; }` | 3: the brace, bracket and paren definitions' `macroRules` | `MacroRules` → `MacroRule[]` |
| `closure_parameters` | `\|a, b\| a + b` | 2: both closure forms' `parameters` | `ClosureParameters` → `[a, b]` |
| `declaration_list` | `mod m { fn f() {} }` | 2: `ModItemInline.body`, `ForeignModItemBody.body` | `DeclarationList` → `[fn f() {}]` |
| `extern_modifier` | `extern "C" {}` | 2: `ForeignModItemBody.externModifier`, `ForeignModItemSemi.externModifier` | §7 |
| `else_clause` | `if a {} else {}` | `IfExpression.alternative` | `ElseClause` → `Block \| IfExpression` |
| `extension_declaration_body` | `impl S { fn f() {} }` | `ImplItemBody.body` | the body → `[fn f() {}]` |
| `trait_interface_declaration_body` | `trait T { fn f(); }` | `TraitItem.body` | the body → `[fn f();]` |
| `patterns` | `let S(a, b) = s;` | `TupleStructPattern.fields` | `Patterns` → `[a, b]` |
| `struct_pattern_elements` | `let S { a, .. } = s;` | `StructPattern.fields` | the list → `[a, ..]` |

**Typescript**

| wrapper | source | holder slots | before → after |
|---|---|---|---|
| `formal_parameters` | `function f(a, b) {}` | 16: every function, method and signature's `parameters` | §7 |
| `type_annotation` | `let x: T` | 14: the parameters', properties' and declarators' `type` | `TypeAnnotation` → `T` |
| `decorator` | `@x class A {}` | 11: every decorated class, member and parameter's `decorators` | `Decorator[]` → `[x]` |
| `arguments` | `f(a, b)` | 4: the call forms' `arguments` | `Arguments` → `[a, b]` |
| `class_body` | `class A { m() {} }` | 3: the class forms' `body` | `ClassBody` → `[m() {}]` |
| `class_heritage` | `class A extends B {}` | 3: the class forms' `heritage` | `ClassHeritage` → its form: `ClassHeritageExtendsClause \| ImplementsClause` |
| `object_type_content` | `interface I { a: string; b(): void }` | 2: `InterfaceBody.members`, `ObjectType.members` | the content → `[a: string, b(): void]` |
| `default_type` | `function f<T = string>() {}` | `TypeParameter.default` | `DefaultType` → `string` |
| `else_clause` | `if (a) b(); else c();` | `IfStatement.alternative` | `ElseClause` → `c();` |
| `extends_clause` | `class A extends B {}` | `ClassHeritageExtendsClause.extendsClause` | `ExtendsClause` → `[B]` |
| `extends_type_clause` | `interface I extends A, B {}` | `InterfaceDeclaration.extendsTypeClause` | `ExtendsTypeClause` → `[A, B]` |
| `implements_clause` | `class A implements I, J {}` | `ClassHeritageExtendsClause.implementsClause` | `ImplementsClause` → `[I, J]` |
| `finally_clause` | `try {} finally {}` | `TryStatement.finalizer` | `FinallyClause` → the block |
| `import_clause` | `import a, { b } from "m"` | `ImportStatementClauseFrom.importClause` | `ImportClause` → its form: `ImportClauseDefaultImport \| NamedImports \| NamespaceImport` |
| `import_clause_group` | `import a, * as ns from "m"` | `ImportClauseDefaultImport.importClauseGroup` | `ImportClauseGroup` → `* as ns` |
| `object` | `import j from "./a.json" with { type: "json" }` | `ImportAttribute.object` | §7 |
| `switch_body` | `switch (x) { case 1: break; }` | `SwitchStatement.body` | `SwitchBody` → `[case 1: break;]` |
| `template_string` | `` tag`a${b}` `` | `CallExpressionTemplateCall.arguments` | §7 |

A polymorph that holds its own forms reads as the form. Each such wrapper is a choice of forms with no token of its own, and its slot is required. Three of them have optional holders: rust's `visibility_modifier` (`fn f()` has none), typescript's `class_heritage` (`class A {}`) and python's `except_clause_exception` (a bare `except:`). The hoisted value is absent exactly when the wrapper is, and a set on a holder without one builds it. Python's `simple_pattern` is an alias site of the hidden `_simple_pattern`, and it reads as it does today.

### Slots listed by holder

A ⚑ marks a list with an optional trailing separator, which stays on the wrapper (§1).

In most of these 37, the holder is a wrapper that hoists at none of its holders, because their slots admit other kinds (§3). `PrintStatementChevron.arguments` is a multi-slot holder whose list spells a comma before each item (§1).

| holder slot | grammar | chain | before → after |
|---|---|---|---|
| `ArgumentList.arguments` | p | `argument_list_elements` | `ArgumentListElements` → `(DictionarySplat \| Expression \| KeywordArgument \| ListSplat \| ParenthesizedListSplat)[]` ⚑ |
| `SuiteBlock.block` | p | `block` | `Block` → `Statement[]` |
| `SuiteBlockClassDeclaration.blockClassDeclaration` | p | `block_class_declaration` | `BlockClassDeclaration` → `StatementClassDefinition[]` |
| `CasePatternList.elements` | p | `case_pattern` | `CasePattern[]` → `(CaseAsPattern \| KeywordPattern \| simple_pattern)[]` |
| `List.elements` | p | `collection_elements` | `CollectionElements` → `(Expression \| ListSplat \| ParenthesizedListSplat \| Yield)[]` ⚑ |
| `Set.elements` | p | `collection_elements` | `CollectionElements` → `(Expression \| ListSplat \| ParenthesizedListSplat \| Yield)[]` ⚑ |
| `DictPattern.elements` | p | `dict_pattern_elements` | `DictPatternElements` → `(KeyValuePattern \| SplatPattern)[]` ⚑ |
| `Dictionary.elements` | p | `dictionary_elements` | `DictionaryElements` → `(DictionarySplat \| Pair)[]` ⚑ |
| `ParenthesizedImportList.importList` | p | `import_list` | `ImportList` → `(AliasedImport \| qualified_identifier)[]` ⚑ |
| `CaseListPattern.elements` | p | `list_pattern_case_patterns → case_pattern` | `ListPatternCasePatterns` → `(CaseAsPattern \| KeywordPattern \| simple_pattern)[]` ⚑ |
| `CaseTuplePattern.elements` | p | `list_pattern_case_patterns → case_pattern` | `ListPatternCasePatterns` → `(CaseAsPattern \| KeywordPattern \| simple_pattern)[]` ⚑ |
| `ImportStatement.names` | p | `names` | `Names` → `(AliasedImport \| qualified_identifier)[]` ⚑ |
| `ListPattern.elements` | p | `patterns` | `Patterns` → `Pattern[]` ⚑ |
| `PrintStatementPlain.arguments` | p | `print_arguments` | `PrintArguments` → `Expression[]` ⚑ |
| `PrintStatementChevron.arguments` | p | `print_chevron_arguments` | `PrintChevronArguments` → `Expression[]` ⚑ |
| `SuiteInline.statements` | p | `simple_statements_elements` | `SimpleStatementsElements` → `SimpleStatement[]` ⚑ |
| `Tuple.elements` | p | `tuple_elements` | `TupleElements` → `(Expression \| ListSplat \| ParenthesizedListSplat \| Yield)[]` ⚑ |
| `TuplePattern.elements` | p | `tuple_pattern_elements` | `TuplePatternElements` → `Pattern[]` ⚑ |
| `Types.items` | p | `type` | `Type[]` → `(ConstrainedType \| Expression \| GenericType \| SplatType \| UnionType \| …)[]` |
| `WithClauseParen.items` | p | `with_clause_with_items → with_item` | `WithClauseWithItems` → `Expression[]` ⚑ |
| `WithClauseBare.items` | p | `with_item` | `WithItem[]` → `Expression[]` |
| `WithClauseWithItems.items` | p | `with_item` | `WithItem[]` → `Expression[]` |
| `ArrayExpressionList.elements` | r | `array_expression_list_elements` | `ArrayExpressionListElements` → `(AttributedElement \| Expression)[]` ⚑ |
| `ParametersElementsReceiverGroup.elements` | r | `parameters_elements` | `ParametersElements` → `AttributedParameter[]` ⚑ |
| `SlicePattern.elements` | r | `patterns` | `Patterns` → `Pattern[]` ⚑ |
| `TupleExpression.elements` | r | `tuple_expression_elements` | `TupleExpressionElements` → `(AttributedElement \| Expression)[]` ⚑ |
| `TuplePattern.elements` | r | `tuple_pattern_elements` | `TuplePatternElements` → `(ClosureExpression \| Pattern)[]` ⚑ |
| `TupleType.types` | r | `types` | `Types` → `Type[]` ⚑ |
| `UseBounds.bounds` | r | `use_bounds_elements` | `UseBoundsElements` → `(Lifetime \| TypeIdentifier)[]` ⚑ |
| `VisibilityModifierPub.visibilityModifierPubScope` | r | `visibility_modifier_pub_scope` | `VisibilityModifierPubScope` → `Crate \| SelfModule \| Super \| VisibilityModifierPubScopeInPath` |
| `WhereClause.wherePredicates` | r | `where_predicates` | `WherePredicates` → `WherePredicate[]` ⚑ |
| `TypeQueryCallExpression.arguments` | t | `arguments` | `Arguments` → `(Expression \| SpreadElement)[]` |
| `AssertsAnnotation.asserts` | t | `asserts` | `Asserts` → `Identifier \| This \| TypePredicate` |
| `FormalParametersElementsReceiverGroup.elements` | t | `formal_parameters_elements` | `FormalParametersElements` → `(OptionalParameter \| RequiredParameter)[]` ⚑ |
| `NamedImports.importSpecifiers` | t | `import_specifiers` | `ImportSpecifiers` → `ImportSpecifier[]` ⚑ |
| `ParenthesizedExpressionSequence.sequenceExpression` | t | `sequence_expression` | `SequenceExpression` → `Expression[]` |
| `TupleType.tupleTypeMembers` | t | `tuple_type_members` | `TupleTypeMembers` → `(OptionalTupleParameter \| OptionalType \| RestType \| TupleParameter \| Type)[]` ⚑ |

### Chain hops

In these 18, the wrapper hoists at its holders under a row above, and its own slot reads through the rest of the chain when the wrapper is reached through the tree (§3).

| wrapper slot | grammar | chain | before → after |
|---|---|---|---|
| `ListPatternCasePatterns.items` | p | `case_pattern` | `CasePattern[]` → `(CaseAsPattern \| KeywordPattern \| simple_pattern)[]` |
| `LambdaParameters.parametersElements` | p | `parameters_elements` | `ParametersElements` → `Parameter[]` ⚑ |
| `Parameters.elements` | p | `parameters_elements` | `ParametersElements` → `Parameter[]` ⚑ |
| `TypeParams.items` | p | `type_params_items` | `TypeParamsItems` → `TypeParam[]` ⚑ |
| `TypeParameter.types` | p | `types → type` | `Types` → `(ConstrainedType \| Expression \| GenericType \| SplatType \| UnionType \| …)[]` ⚑ |
| `Arguments.elements` | r | `arguments_elements` | `ArgumentsElements` → `Argument[]` ⚑ |
| `EnumVariantList.elements` | r | `enum_variant_list_elements` | `EnumVariantListElements` → `AttributedEnumVariant[]` ⚑ |
| `FieldDeclarationList.elements` | r | `field_declaration_list_elements` | `FieldDeclarationListElements` → `AttributedFieldDeclaration[]` ⚑ |
| `FieldInitializerList.initializers` | r | `field_initializer_list_elements` | `FieldInitializerListElements` → `(BaseFieldInitializer \| FieldInitializer \| ShorthandFieldInitializer)[]` ⚑ |
| `ForLifetimes.lifetimes` | r | `lifetimes` | `Lifetimes` → `Lifetime[]` ⚑ |
| `OrderedFieldDeclarationList.elements` | r | `ordered_field_declaration_list_elements` | `OrderedFieldDeclarationListElements` → `AttributedOrderedField[]` ⚑ |
| `TypeArguments.elements` | r | `type_arguments_elements` | `TypeArgumentsElements` → `TypeArgument[]` ⚑ |
| `TypeParameters.elements` | r | `type_parameters_elements` | `TypeParametersElements` → `AttributedTypeParameter[]` ⚑ |
| `UseList.useClauses` | r | `use_clauses` | `UseClauses` → `(Crate \| Identifier \| Metavariable \| ScopedUseList \| SelfModule \| …)[]` ⚑ |
| `EnumBody.elements` | t | `enum_body_elements` | `EnumBodyElements` → `EnumBodyElement[]` ⚑ |
| `ExportClause.exportSpecifiers` | t | `export_specifiers` | `ExportSpecifiers` → `ExportSpecifier[]` ⚑ |
| `TypeParameters.elements` | t | `type_parameters_elements` | `TypeParametersElements` → `TypeParameter[]` ⚑ |
| `TypeArguments.types` | t | `types` | `Types` → `Type[]` ⚑ |

## 6. Composed chains

Each chain reads through every wrapper on it. Most end in a list that sittir mints for the separated items (`…_elements`).

| chain | grammar | source | holder slots | before → composed result |
|---|---|---|---|---|
| `type_parameters → type_parameters_elements` | r | `fn f<T, U>()` | 16: every generic item's `typeParameters` | `TypeParameters` → `[T, U]`, `AttributedTypeParameter[]` |
| `type_parameters → type_parameters_elements` | t | `function f<T, U>() {}` | 17 | `TypeParameters` → `[T, U]`, `TypeParameter[]` |
| `type_arguments → types` | t | `f<T>()` | 9: calls, `new`, generic types, … | `TypeArguments` → `[T]`, `Type[]` |
| `type_arguments → type_arguments_elements` | r | `Vec<u8>` | 5: `GenericType.typeArguments`, the turbofish, … | `TypeArguments` → `[u8]`, `TypeArgument[]` |
| `type_params → type_params_items` | p | `def f[T, U](): …` | 5: functions, methods, classes, type aliases | `TypeParams` → `[T, U]`, `TypeParam[]` |
| `parameters → parameters_elements` | p | `def f(a, b):` | 3: functions, methods, constructors | `Parameters` → `[a, b]`, `Parameter[]` |
| `lambda_parameters → parameters_elements` | p | `lambda a, b: a` | 2 | `LambdaParameters` → `[a, b]` |
| `field_declaration_list → field_declaration_list_elements` | r | `struct S { a: u8 }` | 2: `StructItemBrace.body`, `UnionItem.body` | the list → `[a: u8]` |
| `arguments → arguments_elements` | r | `f(a, b)` | `CallExpression.arguments` | `Arguments` → `[a, b]`, `Argument[]` |
| `enum_variant_list → enum_variant_list_elements` | r | `enum E { A, B }` | `EnumItem.body` | the list → `[A, B]` |
| `enum_body → enum_body_elements` | t | `enum E { A, B }` | `EnumDeclaration.body` | `EnumBody` → `[A, B]` |
| `field_initializer_list → field_initializer_list_elements` | r | `S { a: 1, ..b }` | `StructExpression.body` | the list → `[a: 1, ..b]` |
| `ordered_field_declaration_list → ordered_field_declaration_list_elements` | r | `struct S(u8, u16);` | `StructItemTuple.body` | the list → `[u8, u16]` |
| `for_lifetimes → lifetimes` | r | `for<'a> fn(&'a u8)` | `FunctionType.forLifetimes` | `ForLifetimes` → `['a]`, `Lifetime[]` |
| `match_block → match_block_arms` | r | `match x { 1 => a, _ => b }` | `MatchExpression.body` | `MatchBlock` → the two arms |
| `use_list → use_clauses` | r | `use a::{b, c};` | `ScopedUseList.list` | `UseList` → `[b, c]` |
| `export_clause → export_specifiers` | t | `export { a, b } from "m"` | the re-export's `exportClause` | `ExportClause` → `[a, b]` |
| `type_parameter → types → type` | p | `x: List[int, str]` | `GenericType.typeParameter` | `TypeParameter` → `[int, str]` |
| `list_pattern_case_patterns → case_pattern` | p | `case Point(x, y):` | `ClassPattern.fields` | the list → `[x, y]`, each one of `case_pattern`'s forms |

## 7. Exact reads and setters

These five read something other than a plain list or a single node, so their getters and setters are written out in full. Each setter follows the maintainer's ruling: it replaces what the wrapper already there holds and keeps the wrapper with its facts.

**Typescript `formal_parameters`** (16 holder slots, all required). The node is `seq('(', optional(elements: formal_parameters_elements | formal_parameters_elements_receiver), ')')`. At 13 holder slots its slot admits two kinds, so the chain stops there, and the read is a list node, not an array.

The other three are the setter signatures: `MethodDefinitionSetter`, `MethodSignatureSetter` and `AbstractMethodSignatureSetter`. Each reaches `formal_parameters` as the hidden `_formal_parameters_set_accessor_signature`. Its one slot admits only a `formal_parameters_elements` that holds exactly one parameter (§1, aliases), so the chain continues. `set x(v) {}` reads `parameters()` as the `SetterParameter` `v`, and `$with.parameters(w)` replaces it inside the parentheses already there.

The 13 other holder slots read as follows:

| source | `parameters()` | `$with.parameters(x)` |
|---|---|---|
| `function f() {}` | `undefined` | `x` fills the parentheses; `undefined` empties them |
| `function f(a, b) {}` | `FormalParametersElements`, whose `items()` are `[a, b]` | `x` replaces the elements inside the parentheses already there |
| `function f(this: T, a) {}` | `FormalParametersElementsReceiver`: `receiver()` is `this: T`, and `formalParametersElementsReceiverGroup()` holds `, a`, its `elements()` a `FormalParametersElements` of `[a]` | as above |
| `function f(this: T) {}` | the receiver form with no group | as above |

The receiver form's group doesn't hoist: its slot is optional, and so is the group, so its presence is a fact (`(this: T,)` is a group with no elements).

**Rust `parameters`** (5 holder slots, all required) has the same shape: `seq('(', optional(elements: parameters_elements | parameters_elements_receiver), ')')`.

| source | `parameters()` | `$with.parameters(x)` |
|---|---|---|
| `fn f() {}` | `undefined` | `x` fills the parentheses; `undefined` empties them |
| `fn f(a: u8) {}` | `ParametersElements`, whose `items()` are `[a: u8]` | `x` replaces the elements inside the parentheses already there |
| `fn f(&self, a: u8) {}` | `ParametersElementsReceiver`: `receiver()` is `&self`, and `parametersElementsReceiverGroup()` holds `, a: u8` | as above |

**Rust `extern_modifier`** (`ForeignModItemBody.externModifier`, `ForeignModItemSemi.externModifier`, both required). The node is `seq('extern', optional(abi: string_literal))`, and the getter keeps the holder slot's name.

| source | `externModifier()` | `$with.externModifier(x)` |
|---|---|---|
| `extern "C" {}` | the `StringLiteral` `"C"` | `x` replaces the ABI inside the `extern_modifier` already there |
| `extern {}` | `undefined`: the modifier is there with no ABI | `undefined` removes the ABI and keeps `extern` |

In `extern "C" fn f()`, the function modifiers' slot admits other modifiers too, so `extern_modifier` stays a node there.

**Typescript `template_string` at a tagged call** (`CallExpressionTemplateCall.arguments`, required). The node is `` seq('`', elements: repeat(string_fragment | escape_sequence | template_substitution), '`') ``.

| source | `arguments()` | `$with.arguments(x)` |
|---|---|---|
| `` tag`a${b}c` `` | `[a, ${b}, c]`: `(string_fragment \| EscapeSequence \| TemplateSubstitution)[]` | `x` replaces the parts inside the backticks already there |
| `` tag`` `` | `[]` | `[]` leaves an empty template |

Elsewhere a template literal sits in a slot that admits other kinds, so it still reads as `TemplateString`.

**Typescript `object` in an import attribute** (`ImportAttribute.object`, required). The node is `seq('{', properties, '}')`, with commas between the properties and an optional one after them.

| source | `object()` | `$with.object(x)` |
|---|---|---|
| `import j from "./a.json" with { type: "json" }` | `[type: "json"]`: `(Pair \| SpreadElement \| MethodDefinition \| ShorthandPropertyIdentifier)[]` | `x` replaces the properties inside the braces already there, and a trailing comma stays |
| `with {}` | `[]` | `[]` leaves empty braces |

Elsewhere an object sits in a slot that admits other kinds, so it still reads as `Object`.

## 8. Pinned fields and the hoist

A refine form pins a token choice: typescript's member `operator` (`.` or `?.`), the `using` kind (`using` or `await using`), and `object_type`'s and `interface_body`'s braces. A pinned field has no setter, since the form defines it. A hoist chain runs only through node slots, in wrappers that spell every token they hold, so a pinned field is never on a chain, and a hoisted setter never sets one.

They meet only as neighbours, on the same holder. Typescript's `object_type` and `interface_body` pin their braces by form and hoist `members` through `object_type_content`. The hoisted `members` setter sets through the chain, and the braces stay without a setter.

## 9. Not hoisted

Multi-slot and slotless kinds aren't wrappers. These are the near misses, each failing one condition:

| reason | examples | the fact the hoist would lose |
|---|---|---|
| the holder slot admits other kinds | python `else_clause` at `if` (beside `elif_clause`), rust `attribute_item` at some holders | the getter couldn't tell a wrapper from a sibling kind, and the setter couldn't tell whether to wrap |
| presence carries meaning | rust `where_clause`, typescript `arguments` at `new`, python `argument_list`, the receiver groups of §7 | a wrapper with an empty slot under an optional holder slot would read like no wrapper at all |
| a leaf | rust `lifetime`, `label` | §1: the read would be an `Identifier`, indistinguishable from one read anywhere else |
| an alias leaf | rust `type_identifier`, `field_identifier`, typescript `property_identifier` | the parse tree has no child to read through |
| a token spelled only sometimes | rust `return_expression`, `yield_expression` | the token is a fact the holder couldn't rebuild |
