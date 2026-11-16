# Node-surface hoist

**Status:** Design spec. Design only: it states the end state and what stays open for the maintainer, and an implementer builds it from here.

## Decided by the maintainer

- **"The rule wherever it holds, the getter/setter and read shape (in the ts-side wrap layer) should be adjusted accordingly"** (2026-11-15). See §1 and §3.
- **"Here this has to be client side only"** (2026-11-15). This is the constraint §2 states.
- **"the portable api and bindings.scm should flatten scenarios like expression.expression"** (2026-11-15). That is the portable layer's counterpart, written in the bindings spec §6, rule 6. See §4.
- **A field a refine form pins has no setter: "the form defines"** (2026-11-15). See §8.

## 1. The rule

A holder's slot reads through a wrapper when all three hold:

1. the wrapper has one slot, and that slot holds nodes;
2. every other child of the wrapper is a token the wrapper always spells, so the wrapper carries no fact the holder couldn't rebuild;
3. the holder's slot admits only that wrapper.

Two cases fail condition 2 although every token is fixed:

- **The wrapper's presence is a fact** when its slot may be empty and the holder's slot is optional. Typescript's `new Foo` and `new Foo()` differ only in whether `arguments` is there.
- **A leaf is never a wrapper.** Rust's `'a` is a `lifetime` holding an `identifier` behind an always-spelled quote. Hoisted, it would read as an `Identifier`, and a lifetime read there couldn't be told from an identifier read anywhere else. The same holds for `label`. An alias leaf such as `type_identifier` has no child in the parse tree at all.

The rule composes. When the wrapper's own slot admits only another wrapper that meets the rule, the holder reads through both (§6).

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

- **Get.** The getter reads the holder's native slot, then each wrapper's one slot in turn, and returns the last read. It returns a list when any step holds a list.
- **Set.** The setter takes the hoisted type. When the holder already has the wrapper, it sets through it: it sets the innermost slot on the existing chain, so every wrapper keeps its own facts (question 1). When the holder has none, it builds each wrapper with that wrapper's own builder, innermost first, and each spells its fixed tokens.
- **Build.** A factory and a loose `from` input take the hoisted type and wrap it the same way.
- **An optional inner slot under a required holder.** The hoisted value is optional, and absent means the wrapper is there with its slot empty.

Cursors, queries, ranges and trivia work on the native tree, so the wrapper is still a node there, with its own range and comments. The getter is a convenience over the tree, not a different tree.

## 4. The portable flatten and the hoist

The two layers apply the same idea on their own terms. The portable layer flattens through `bindings.scm`: it drops the wrapper's claim and captures the child as `@element`. The hoist is the low-level counterpart. The wrappers the portable layer flattens also hoist (python's `type`, the decorators, the comprehension clauses). The hoist adds the list envelopes (`type_parameters`, `parameters`, `arguments`), which the portable layer already reads as lists.

## 5. Hoisted wrappers

Master's models. The holder slots are named `Type.getter`. Across the three grammars the rule holds at 221 holder slots: python 44 through 17 wrappers, rust 85 through 23, typescript 92 through 22. This section lists the single wrappers, §6 the chains, and §7 the wrappers held back for the maintainer's call.

**Python**

| wrapper | source | holder slots | before → after |
|---|---|---|---|
| `type` | `def f(x) -> int:` | 14: `FunctionDefinition.returnType`, `TypedParameter.type`, `TypeAliasStatement.value`, … | `Type` → `int`, an `Expression \| GenericType \| UnionType \| …` |
| `comprehension_clauses` | `[y for y in z if y]` | 4: the list, set, dictionary and generator comprehensions' `clauses` | `ComprehensionClauses` → `(ForInClause \| IfClause)[]` |
| `else_clause` | `for x in y: … else: …` | 3: `alternative` of `for`, `while`, `try` | `ElseClause` → the block |
| `decorator` | `@functools.cache` before a `def` | 2: `DecoratedDefinition.decorators` and the class form | `Decorator[]` → `Expression[]` |
| `chevron` | `print >> f, x` | `PrintStatementChevron.chevron` | `Chevron` → `f` |
| `finally_clause` | `try: … finally: …` | `TryStatement.finalizer` | `FinallyClause` → the block |
| `if_clause` | `case x if x > 0:` | `CaseClause.guard` | `IfClause` → `x > 0` |
| `match_block` | `match x:` then `case 1: …` | `MatchStatement.body` | `MatchBlock` → `CaseClause[]` |
| `subjects` | `match a, b:` | `MatchStatement.subject` | `Subjects` → `[a, b]` |
| `subscripts` | `a[i, j]` | `Subscript.index` | `Subscripts` → `[i, j]` |

**Rust**

| wrapper | source | holder slots | before → after |
|---|---|---|---|
| `attribute_item` | `struct S { #[serde(skip)] a: u8 }` | 10: every attributed form's `attributeItems`, `FieldInitializer.attributes`, … | `AttributeItem[]` → `Attribute[]` |
| `trait_bounds` | `fn f<T: A + B>()` | 6: `TypeParameter.bounds`, `WherePredicate.bounds`, `TraitItem.bounds`, … | `TraitBounds` → `[A, B]` |
| `macro_rules` | `macro_rules! m { () => {}; }` | 3: the brace, bracket and paren definitions' `macroRules` | `MacroRules` → `MacroRule[]` |
| `closure_parameters` | `\|a, b\| a + b` | 2: both closure forms' `parameters` | `ClosureParameters` → `[a, b]` |
| `declaration_list` | `mod m { fn f() {} }` | 2: `ModItemInline.body`, `ForeignModItemBody.body` | `DeclarationList` → `[fn f() {}]` |
| `else_clause` | `if a {} else {}` | `IfExpression.alternative` | `ElseClause` → `Block \| IfExpression` |
| `extension_declaration_body` | `impl S { fn f() {} }` | `ImplItemBody.body` | the body → `[fn f() {}]` |
| `trait_interface_declaration_body` | `trait T { fn f(); }` | `TraitItem.body` | the body → `[fn f();]` |
| `patterns` | `let S(a, b) = s;` | `TupleStructPattern.fields` | `Patterns` → `[a, b]` |
| `struct_pattern_elements` | `let S { a, .. } = s;` | `StructPattern.fields` | the list → `[a, ..]` |

**Typescript**

| wrapper | source | holder slots | before → after |
|---|---|---|---|
| `type_annotation` | `let x: T` | 14: the parameters', properties' and declarators' `type` | `TypeAnnotation` → `T` |
| `decorator` | `@x class A {}` | 11: every decorated class, member and parameter's `decorators` | `Decorator[]` → `[x]` |
| `arguments` | `f(a, b)` | 4: the call forms' `arguments` | `Arguments` → `[a, b]` |
| `class_body` | `class A { m() {} }` | 3: the class forms' `body` | `ClassBody` → `[m() {}]` |
| `object_type_content` | `interface I { a: string; b(): void }` | 2: `InterfaceBody.members`, `ObjectType.members` | the content → `[a: string, b(): void]` (question 1) |
| `default_type` | `function f<T = string>() {}` | `TypeParameter.default` | `DefaultType` → `string` |
| `else_clause` | `if (a) b(); else c();` | `IfStatement.alternative` | `ElseClause` → `c();` |
| `extends_clause` | `class A extends B {}` | `ClassHeritageExtendsClause.extendsClause` | `ExtendsClause` → `[B]` |
| `extends_type_clause` | `interface I extends A, B {}` | `InterfaceDeclaration.extendsTypeClause` | `ExtendsTypeClause` → `[A, B]` |
| `implements_clause` | `class A implements I, J {}` | `ClassHeritageExtendsClause.implementsClause` | `ImplementsClause` → `[I, J]` |
| `finally_clause` | `try {} finally {}` | `TryStatement.finalizer` | `FinallyClause` → the block |
| `import_clause_group` | `import a, * as ns from 'm'` | `ImportClauseDefaultImport.importClauseGroup` | `ImportClauseGroup` → `* as ns` |
| `switch_body` | `switch (x) { case 1: break; }` | `SwitchStatement.body` | `SwitchBody` → `[case 1: break;]` |

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
| `export_clause → export_specifiers` | t | `export { a, b } from 'm'` | the re-export's `exportClause` | `ExportClause` → `[a, b]` |
| `type_parameter → types → type` | p | `x: List[int, str]` | `GenericType.typeParameter` | `TypeParameter` → `[int, str]` |
| `list_pattern_case_patterns → case_pattern` | p | `case Point(x, y):` | `ClassPattern.fields` | the list → `[x, y]`, each one of `case_pattern`'s forms (§7) |

## 7. Wrappers the rule hoists that you may not want

These meet the three conditions, but a reader looking for the wrapper's kind would find something else. The recommendation for each group is to keep the wrapper, so they hoist only if the maintainer says so.

| group | wrapper | grammar | source | read today | read if hoisted | why keep it |
|---|---|---|---|---|---|---|
| a polymorph whose slot holds its own forms | `visibility_modifier` (20 holder slots) | r | `pub fn f() {}` | `VisibilityModifier`, holding its `pub` form | `VisibilityModifierPub` | the form is the same kind refined, so the read reaches no new content and loses the name a reader looks for. Upstream, `visibility_modifier` is a choice of `pub ( … )` tokens and fails condition 2. It passes only because sittir mints each arm as a form |
| | `case_pattern` (2) | p | `case {"k": v}:` | `CasePattern` | one of its forms | as above |
| | `except_clause_exception` (1) | p | `except E as e:` | `ExceptClauseException` | its `as` form | as above |
| | `class_heritage` (3) | t | `class A extends B {}` | `ClassHeritage` | its `extends` form | as above |
| | `import_clause` (1) | t | `import a, { b } from 'm'` | `ImportClause` | its default-import form | as above |
| a parameter list with a receiver form | `formal_parameters` (16) | t | `function f(this: T, a) {}` | `FormalParameters` | `FormalParametersElementsReceiver` | the hoist trades one list wrapper for another and never reaches the parameters |
| | `parameters` (5) | r | `fn f(&self, a: u8)` | `Parameters` | `ParametersElementsReceiver` | as above |
| the wrapper is the thing read | `template_string` (1) | t | `` tag`a${b}` `` | `TemplateString` | its fragments and substitutions | a tagged template's argument is the template literal, with its own raw text |
| | `extern_modifier` (2) | r | `extern "C" { … }` | `ExternModifier` | `"C"`, or nothing for `extern { … }` | the read would be a bare string literal, and an absent one for the plain form |
| | `object` (1) | t | `import j from './a.json' with { type: 'json' }` | `Object` | its pairs | the attributes are an object literal, and the read would lose that |

## 8. Pinned fields and the hoist

A refine form pins a token choice: typescript's member `operator` (`.` or `?.`), the `using` kind (`using` or `await using`), and `object_type`'s and `interface_body`'s braces. A pinned field has no setter, since the form defines it. A hoist chain runs only through node slots, in wrappers that spell every token they hold, so a pinned field is never on a chain, and a hoisted setter never sets one.

They meet only as neighbours, on the same holder. Typescript's `object_type` and `interface_body` pin their braces by form and hoist `members` through `object_type_content`. The hoisted `members` setter sets through the chain, and the braces stay without a setter.

## 9. Not hoisted

Multi-slot and slotless kinds aren't wrappers. These are the near misses, each failing one condition:

| reason | examples | the fact the hoist would lose |
|---|---|---|
| the holder slot admits other kinds | python `else_clause` at `if` (beside `elif_clause`), rust `attribute_item` at some holders | the getter couldn't tell a wrapper from a sibling kind, and the setter couldn't tell whether to wrap |
| presence carries meaning | rust `where_clause`, typescript `arguments` at `new`, python `argument_list` | a wrapper with an empty slot under an optional holder slot would read like no wrapper at all |
| a leaf | rust `lifetime`, `label` | §1: the read would be an `Identifier`, indistinguishable from one read anywhere else |
| an alias leaf | rust `type_identifier`, `field_identifier`, typescript `property_identifier` | the parse tree has no child to read through |
| a token spelled only sometimes | rust `return_expression`, `yield_expression` | the token is a fact the holder couldn't rebuild |

## 10. Open questions for the maintainer

**1. A hoisted list's own facts.** A separated list keeps facts of its own beside its items: python's lists record a trailing comma, and typescript's `object_type_content` separates its members with `,` or `;`, its model's two separator candidates. After the hoist, the holder's getter reads the items only.

| option | `$with.parameters([a, b, c])` on `def f(a, b,):` | `$with.members([…])` on `interface I { a: string; }` | cost |
|---|---|---|---|
| (a) set through the existing chain (recommended) | `def f(a, b, c,):` | keeps `;` | none: the list node keeps its facts |
| (b) rebuild the chain on every set | `def f(a, b, c):` | the grammar's default separator | a set drops facts the reader saw |

**2. The groups in §7.** Hoist none of them (recommended), or name the groups to hoist.

**3. Reaching the wrapper node from its holder** (its range, its comments).

| option | how | cost |
|---|---|---|
| (a) through the tree only (recommended) | a cursor or the node's children | none: the tree already has it |
| (b) a second getter per hoisted slot | `typeParametersNode()` | API surface for a fact the tree already gives |
