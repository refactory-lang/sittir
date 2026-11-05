# Portable features: tree, packages and Python's convention claims

Status: proposal, for review. Nothing in it is applied yet.

This note proposes the content moves the portable grammar map needs, so that each grammar's claims equal its composition:

1. the feature tree: the sub-features split out of today's features, and the core content that moves into new features;
2. the first standard packages;
3. the claims Python writes for the features it spells by convention, and the ones Python doesn't state.

All counts come from `derive()` over each grammar's bindings and from the vocabulary planner's ownership, on 65c8b22b5. A grammar *holds* a path when it claims the path or a path under it. It *holds* a member when it routes the member at a path it holds. Holder sets are written `p` (python), `r` (rust) and `t` (typescript).

## How the tree is cut

- **A sub-feature is the content of one feature that one holder set holds.** The parent keeps what every grammar composing the feature holds, and each other holder set becomes a sub-feature. Where one holder set's content has unrelated meanings, it's split again by meaning. That second split is optional, because a split nobody needs doesn't change any grammar's held set.
- **Features form a graph.** A feature extends any number of features, at any depth. A grammar holds a feature when it holds the feature's own content and every feature it extends.
  - A piece that crosses two axes extends both. Protected member visibility, for example, extends the protected level and member-level visibility.
  - A piece that refines a kind another feature adds extends that feature too: `declaration.property.private` needs Accessors.
  - A folder is only where a feature's files live: under the feature it most belongs to, which is one of its parents.
- **Shape mismatches move,** per the ruling: where a language spells a construct on another node than the vocabulary member sits on, the member moves into a sub-feature the language lacks. Each one found is listed under "Shape mismatches" for #1086.
- **Claims are written first** where the language has the construct and a claim is missing. Those are listed under "Claims to write", and the held sets below assume them.

## 1. The feature tree

Folders are under `packages/types/src/vocabulary/features/`. A new folder is marked **new**, and a moved one **moved**.

### Visibility, on both axes

Only rust and typescript hold Visibility once Python's mapping is settled (see section 3, question V). The 143 kinds fall into three holder sets: `rt` 9, `r` 97 and `t` 37.

The shared piece is the root. The level axis (protected, scoped) and the kind axis (item, member) each extend it, and each crossing piece extends one piece from each axis:

```
Visibility ─┬─ ProtectedVisibility ──────┐
            ├─ ScopedVisibility ───────┐ │
            ├─ ItemVisibility ─────────┴─┼─ ScopedItemVisibility
            └─ MemberVisibility ─────────┴─ ProtectedMemberVisibility
```

| Feature (folder) | Holders | Extends | Content |
|---|---|---|---|
| `Visibility` (`visibility/`) | r t | — | `modifier.visibility`, `.private` and `.public`; `private` and `public` on `declaration.field`, `declaration.method` and `declaration.method.signature` |
| `ProtectedVisibility` (`visibility/protected-visibility/`, **new**) | t | Visibility | `modifier.visibility.protected`; `protected` on field, method and method.signature |
| `ScopedVisibility` (`visibility/scoped-visibility/`, existing) | r | Visibility | today's `public.restricted.scope`, plus `modifier.visibility.public.{internal,parent,restricted}` and those three levels on field, method and method.signature |
| `ItemVisibility` (`visibility/item-visibility/`, **new**) | r | Visibility, plus the features that add its bases | `private` and `public` on the 17 item kinds: constant, enum, enum_member (and its `struct` and `tuple`), function, function.signature, interface.trait, module, struct (and its `tuple` and `unit`), type_alias, union, variable, `statement.import` and `statement.import.package` (34 kinds) |
| `ScopedItemVisibility` (`visibility/item-visibility/scoped-item-visibility/`, **new**) | r | ItemVisibility, ScopedVisibility | `public.{internal,parent,restricted}` on the same 17 item kinds (51 kinds) |
| `MemberVisibility` (`visibility/member-visibility/`, **new**) | t | Visibility, Classes, Accessors, AbstractClasses | `private` and `public` on the 11 class-member kinds: constructor, field.signature, method.signature.abstract, parameter (parameter properties), property, property.getter, property.setter, property.signature.getter and .setter, and property.signature.abstract.getter and .setter (22 kinds) |
| `ProtectedMemberVisibility` (`visibility/member-visibility/protected-member-visibility/`, **new**) | t | MemberVisibility, ProtectedVisibility | `protected` on the same 11 kinds |

The counts check: r has 12 scoped kinds plus 34 plus 51, which is 97; t has 4 protected kinds plus 22 plus 11, which is 37.

### Struct patterns as Structs' parent

| Feature | Holders | Content |
|---|---|---|
| `StructPatterns` (`struct-patterns/`, **new**) | p r | `pattern.struct`, `pattern.struct.field` |
| `Structs` (**moved** to `struct-patterns/structs/`, extends StructPatterns) | r | the rest of today's Structs, `pattern.struct.rest` included (Python's class patterns have no `..`) |

### The other split features

The parent keeps the first row's content. Each row after it is a **new** sub-feature folder under the parent's folder.

**ArbitraryPrecisionIntegers** (p t), parent `literal.number.integer.big`
- `BigIntegerRadixes` (t): `big.binary`, `big.hex`, `big.octal`

**AsyncAwait** (p r t), parent `expression.await`, `declaration.function.async`, `declaration.method.async`
- `AsyncLambdas` (r t): `expression.lambda.async`
- `AsyncIteration` (p t): `statement.loop.for_each.async`
- `AsyncSignatures` (r t, after rust's claim): `declaration.function.signature.async`, `declaration.method.signature.async`. Extends FunctionSignatures and MethodSignatures.
- `AsyncFunctionExpressions` (t): `expression.function.async`. Extends FunctionExpressions.
- `AsyncContexts` (p): `clause.comprehension.for.async`, `statement.resource.async`, `declaration.constructor.async`. Extends Comprehensions, ResourceStatements and Classes.

**ByteStrings** (p r), parent `literal.string.bytes`
- `MultilineByteStrings` (p): `literal.string.bytes.multiline`. Extends MultilineStrings.

**Coroutines** (p r t), parent `expression.yield`
- `GeneratorBlocks` (r): `expression.block.generator`, `expression.lambda.static`. Extends ExpressionBlocks.

**Generators** (p t), parent `expression.yield.delegate`
- `GeneratorFunctions` (t): `declaration.function.generator`, `declaration.method.generator`, `expression.function.generator`. Python has no generator marker: a generator is known by its body. Extends FunctionExpressions.

**Decorators** (p t), parent `attribute.decorator`; `decorators` on method, class and constructor; `declaration.property.decorators` (once Python claims accessors)
- `FunctionDecorators` (p): `declaration.function.decorators`
- `MemberDecorators` (t): `decorators` on field, parameter and `expression.class` (extends ClassExpressions); the content kinds `attribute.content.call`, `.member` and `.parenthesized` (a shape mismatch: Python reads decorator content as expressions)

**DefaultArguments** (p t), parent `declaration.parameter.default` (the member)
- `DefaultParameterForms` (p): the core kinds `declaration.parameter.default` and `.typed_default`, with their `default` members (a shape mismatch; see below)

**Destructuring** (p r t), parent `pattern.list`
- `RestPatterns` (p t): `pattern.rest`. Rust: check `..` in slice and tuple patterns before settling.
- `TuplePatterns` (p r): `pattern.tuple`, `pattern.wildcard`
- `BareTuplePatterns` (p, under TuplePatterns): `pattern.tuple.bare`
- `ObjectPatterns` (t): `pattern.object`, `.object.assignment`, `.object.pair`, `pattern.assignment`

**ExplicitReceivers** (r t), parent the receiver parameter and `receiver` on function, method and their signatures
- `TypedReceivers` (t): `type.receiver`; `receiver` on `expression.function`, `type.function` and `declaration.signature.call`

**Interfaces** (r t), parent `declaration.interface`
- `InterfaceSignatures` (t): `clause.extends.type`, `declaration.field.signature`
- `Traits` (r): `declaration.interface.trait`

**LabeledControlFlow** (r t), parent `identifier.label`, `statement.break.label`, `statement.continue.label`
- `LoopLabels` (r): `label` on block, loop, for_each and while
- `LabeledStatements` (t): `statement.labeled`

**MatchExpressions** (p r), parent `clause.case.match`, `pattern.as`, `pattern.or`, `statement.match`
- `LetPatterns` (r): `clause.let`, `clause.let.chain`
- `MappingPatterns` (p): `pattern.map`, `pattern.rest.map`. Extends RestPatterns.

**Methods** (p r t), parent `declaration.method`
- `MethodSignatures` (r t): `declaration.method.signature`
- `ReceiverKeywords` (r t): `identifier.receiver`. Python's `self` is a convention, not a keyword.
- `SpecialMethods` (p): `declaration.method.special`
- `Specialization` (r): `declaration.function.default` (`default fn`)

**Accessors** (p t once Python claims them), parent `declaration.property`, `.getter`, `.setter`
- `AccessorSignatures` (t): `declaration.property.signature`, its `.getter` and `.setter`, and `.signature.abstract` with its `.getter` and `.setter`. Extends InterfaceSignatures and AbstractClasses.

**Classes** (p t), parent `declaration.class`, `declaration.constructor`
- `NewExpressions` (t): `expression.call.construct`, `.construct.bare`
- `ClassExpressions` (t): `expression.class`
- `StaticMembers` (t): `statement.block.static`; `static` on field, field.signature and property. Python's `@staticmethod` is `declaration.method.static`, which isn't in this set.

**AbstractClasses** (t only if Python leaves it; see question A): no split.

**ExplicitOverrides** (p t), parent `declaration.method.override`, `declaration.property.override`
- `MemberOverrides` (t): `override` on field, parameter, field.signature, method.signature and method.signature.abstract

**Modules** (p r t), parent `clause.import`, `statement.import`
- `NameImports` (p r): `clause.import.alias`, `clause.import.wildcard` (TypeScript's `{ a as b }` is a shape mismatch)
- `Exports` (t): `statement.export` with `.all` and `.default`; `clause.export` with `.namespace`, `.specifier` and `.specifier.typeof`
- `ImportSpecifiers` (t): `clause.import.names`, `.namespace`, `.specifier` (and `.typeof`), `.attribute` and `.require`; `statement.import.alias`, `statement.import.typeof`
- `DynamicImports` (t): `expression.call.import`, `type.import`
- `ImportTrees` (r): `clause.import.list`, `.list.scoped`, `statement.import.package`
- `RelativeImports` (p): `clause.import.relative`, `.relative.prefix` (rust's `super::` is a shape mismatch)
- `FromImports` (p): `statement.import.from`, `statement.import.future`

**ModuleDeclarations** (r t), parent `declaration.module`
- `ExternalModules` (t): `declaration.module.external`. Extends AmbientDeclarations.

**ParametricPolymorphism** (p r t), parent `declaration.type_parameter`; `typeParameters` on function, method and type_alias
- `GenericSignatures` (r t): `typeParameters` on function.signature, method.signature and interface
- `InstantiationExpressions` (r t): `expression.instantiation`
- `GenericClasses` (p t): `declaration.class.typeParameters`
- `GenericConstructors` (p): `declaration.constructor.typeParameters`
- `VariadicTypeParameters` (p): `declaration.type_parameter.parameters`, `.variadic`
- `ExplicitTypeArguments` (t): `typeArguments` on call, call.member and call.construct (the turbofish move); `clause.default` (rust: check type-parameter defaults `T = i32`)
- `GenericTypeExpressions` (t): `typeParameters` on `expression.function`, `expression.class`, `type.function`, `type.function.constructor`, `declaration.signature.call`, `.construct` and `declaration.method.signature.abstract`
- `GenericItems` (r): `typeParameters` on enum, interface.trait, extension, extension.conformance, type_alias.associated, union and `type.abstract`; `element.type_argument`, `pattern.generic`

**BoundedQuantification** (p r t), parent `declaration.type_parameter.bounds`
- `BoundClauses` (r t): `clause.bounds`
- `WhereClauses` (r): `clause.where`, `.where.predicate`, the 13 `whereClause` and `trailingWhereClause` members, `element.type_argument.bounds`
- `BoundModifiers` (r): `clause.bounds.removed`, `.bounds.use`
- `ConstrainedTypeParameters` (p): `type.constrained` with its `constraint`
- Held by no grammar: `bounds` on `type_parameter.parameters`, `.variadic` and `.value` (question N)

**RawStrings** (p r), parent `literal.string.raw`, `literal.string.bytes.raw`
- `MultilineRawStrings` (p): `raw.multiline`, `bytes.raw.multiline`. Extends MultilineStrings.
- `RawInterpolation` (p): `interpolated.raw` and its `.multiline`; `interpolated.deferred.raw` and its `.multiline`. Extends StringInterpolation.

**ResourceManagement** (p t): no common content, so the parent becomes a marker
- `ResourceStatements` (p): `statement.resource`, `clause.resource`, `.resource.item`
- `DisposableDeclarations` (t): `expression.assignment.disposable`

**StringInterpolation** (p t), parent `expression.interpolation`, `literal.string.interpolated`
- `TaggedTemplates` (t): `expression.call.template`
- `FormatSpecifiers` (p): `expression.interpolation.conversion`, `.format`
- `DeferredInterpolation` (p): `literal.string.interpolated.deferred` and its `.multiline`
- `MultilineInterpolation` (p): `literal.string.interpolated.multiline`. Extends MultilineStrings.

**Tuples** (p r), parent `expression.collection.tuple`
- `BareTuples` (p): `expression.collection.tuple.bare`
- `UnitValues` (r): `expression.unit`, `type.unit`

**TypeAnnotations** (p r t), parent `type.generic`; `returnType` on function and method; `type` on parameter and variable
- `PrimitiveTypes` (r t): `type.primitive` with `.boolean`, `.floating`, `.floating.float64`, `.never` and `.string`
- `TypeConstructors` (r t): `type.array`, `type.function`, `type.tuple`
- `TypeCasts` (r t): `expression.cast`
- `UnionTypes` (p t): `type.union`
- `VariadicTypes` (p t): `type.rest`
- `TypeComputation` (t): `type.conditional`, `.infer`, `.lookup`, `.index_query`, `.query`, `.template`; `clause.mapped_type`; `element.template`, `.template.substitution`
- `TypeAssertions` (t): `expression.cast.assertion`, `.assertion.angle_bracket`, `.satisfies`
- `StructuralTypes` (t): `type.object`, `.literal`, `.intersection`, `.optional`, `.readonly`, `.parenthesized`, `.existential`, `.function.constructor`; `element.tuple`, `.tuple.member`, `.tuple.member.optional`; `type` on field.signature and property; `declaration.variable.pattern.type`
- `TypePredicates` (t): `type.predicate`, `.predicate.asserts`
- `TopAndBottomTypes` (t): `type.primitive.object`, `.symbol`, `.unchecked`, `.unknown`, `.void`
- `SizedNumericTypes` (r): `type.primitive.integral` with `.int8` through `.int128` and `.size`; `type.primitive.floating.float32`
- `TraitObjectTypes` (r): `type.abstract`, `type.dynamic`, `type.bounded`
- `PointerTypes` (r): `type.pointer`, `type.reference`
- `QualifiedTypes` (r): `type.qualified`, `type.generic.turbofish`, `type.bracketed`
- `ConversionCasts` (r): `expression.cast.conversion`
- `AccessorAnnotations` (p t, after both grammars' claims): `returnType` on property.getter, property.signature.getter and property.signature.abstract.getter. Python holds only `property.getter.returnType`, so the signature members go with AccessorSignatures.
- `AnnotatedConstants` (p r, after Python's claim): `declaration.constant.type`
- `AnnotatedConstructors` (p): `declaration.constructor.returnType`
- `AnnotatedSignatures` (r t): `returnType` on function.signature and method.signature. Extends FunctionSignatures and MethodSignatures.
- `FieldAnnotations` (r t): `declaration.field.type`. Extends FieldDeclarations.
- Python's `declaration.parameter.typed` and its `type` members are a shape mismatch, which goes with `DefaultParameterForms`.

**NullableTypes** (p t once Python claims `Optional[X]`): no split.

**NonNullAssertions** and **OptionalMembers** (t): no split. Their `declaration.property.definite` and `declaration.property.optionality` are held by no grammar (question N).

The marker-only features (OperatorOverloading, ManifestTyping, Elisions, Overloading, ConcurrencySyntax, DeferredExecution) are trivially held and stay in the compositions as authored.

### Core content a grammar lacks

The spec moves core content a grammar lacks into a feature, the same way. Excluding fixed-text members (`operator`, `$value`, which come from model facts and not from claims), the core has 88 kinds and about 45 members that some grammar lacks. The proposed homes are below, each a **new** top-level folder unless it names a parent.

| Feature | Holders | Content |
|---|---|---|
| `ComparisonChains` | p | `element.comparator` and its 17 refinements; `expression.binary.comparison.chain` |
| `IdentityComparison` | p | `expression.binary.identity`, `.is`, `.is_not` |
| `MembershipTests` | p t | `expression.binary.membership`, `.membership.in` |
| `NegatedMembership` (under MembershipTests) | p | `expression.binary.membership.not_in` |
| `TypeTests` | t | `expression.binary.membership.instanceof`, `expression.unary.typeof` |
| `FloorDivision` | p | `expression.binary.arithmetic.floor_divide`, `expression.assignment.compound.floor_divide` |
| `MatrixMultiplication` | p | the binary and compound `matrix_multiply` |
| `Exponentiation` | p t | the binary and compound `exponent` |
| `LegacyInequality` | p | `comparison.not_equal.legacy` (the expression, and the comparator, which also extends ComparisonChains) |
| `NullishCoalescing` | t | `expression.binary.coalesce`, `compound.coalesce` |
| `LogicalAssignment` | t | `compound.and`, `compound.or` |
| `UnsignedShift` | t | `shift.right_unsigned`, `compound.shift_right_unsigned` |
| `IncrementDecrement` | t | `expression.update`, `.increment`, `.decrement` |
| `UnaryPlus` | p t | `expression.unary.plus` |
| `UnaryOperatorKeywords` | t | `expression.unary.delete`, `.void` |
| `SequenceExpressions` | t | `expression.sequence` |
| `FunctionExpressions` | t | `expression.function` |
| `MetaProperties` | t | `expression.meta` |
| `SuperReferences` | t | `identifier.super` |
| `ObjectLiterals` | t | `expression.collection.object` |
| `MapLiterals` | p | `expression.collection.map`, `element.spread.map` |
| `SetLiterals` | p | `expression.collection.set` |
| `KeyValuePairs` | p t | `element.pair` |
| `Spreads` | p t | `element.spread`; `element.spread.parenthesized` (p) as its sub-feature `ParenthesizedSpreads` |
| `NullLiteral` | p t | `literal.null` |
| `Undefined` (under NullLiteral) | t | `literal.null.undefined` |
| `EllipsisLiteral` | p | `literal.ellipsis` |
| `ImplicitConcatenation` | p | `literal.string.concatenated` |
| `MultilineStrings` | p | `literal.string.multiline` |
| `DeleteStatements` | p | `statement.delete` |
| `ElseIfClauses` | p | `clause.else_if`, `statement.if.alternatives` (a shape mismatch with rt's `statement.if.alternative`) |
| `LoopElse` | p | `alternative` on for_each and while |
| `Docstrings` | p | `declaration.function.doc` |
| `BindingKinds` | t | `declaration.variable.constant`, `.reassignable`, `.reassignable.function_scoped` (a shape mismatch with `declaration.constant`) |
| `PatternDeclarations` | t | `declaration.variable.pattern` |
| `MultipleDeclarators` | t | `declaration.variable.declarators` |
| `HtmlComments` | t | `comment.html` |
| `BlockComments` | r t | `comment.block` |
| `DocComments` (under BlockComments) | r t | `comment.block.doc` |
| `InnerDocComments` (under DocComments) | r | `comment.block.doc.inner`, `comment.line.doc`, `.line.doc.inner`, `comment.text`, `comment.block.doc.content` |
| `ExpressionBlocks` | r | `expression.block`, `statement.block.trailingExpression`, `statement.break.expression` |
| `QualifiedPaths` | r | `expression.call.qualified` |
| `ArrayRepeat` | r | `expression.collection.list.repeat` |
| `MutableBindings` | r | `pattern.mutable`; `mutable` on parameter and variable |
| `LetElse` | r | `declaration.variable.alternative` |
| `LiteralSuffixes` | r | `suffix` on the four integer literal kinds |
| `FieldDeclarations` | r t | `declaration.field`; `declaration.field.value` (t) as its sub-feature `FieldInitializers` |
| `FunctionSignatures` | r t | `declaration.function.signature`; its `functionModifiers` (r) as its sub-feature |
| `Modifiers` | r t | `modifier` |
| `AttributeContent` | r t | `attribute.content`; its `input` and `path` (r) as its sub-feature |
| `AnnotatedLambdas` | r t | `expression.lambda.returnType`. Extends TypeAnnotations. |

Still to check before this table is final:
- `argument` (p r): what TypeScript reads in its place.
- `expression.parenthesized.type` (t).
- `type.content` (p t).
- `literal.number.float.leading_point.integer` (p).

### Claims to write

The language has each of these constructs and the claim is missing. The held sets above assume them.

- **rust:** `declaration.function.signature.async`, `declaration.method.signature.async` (`async fn` in traits).
- **typescript:** `returnType` on property.getter, property.signature.getter and property.signature.abstract.getter (`get x(): T`).
- **python:**
  - `declaration.constant.type` (`X: int = 1` under the existing constant claim);
  - `file.shebang` (`#!`, read today as a comment);
  - section 3's mapping.
- **To check before settling:**
  - rust `pattern.rest` (`..` in slice and tuple patterns);
  - rust type-parameter defaults (`clause.default`);
  - Python class-body annotations as `declaration.field`. That would move Python into FieldDeclarations and FieldAnnotations.

### Shape mismatches (for #1086)

Each of these moves into a sub-feature the other-shape languages lack, as above, and is listed on #1086 to be unified later.
- Call type arguments on the call (t), where rust reads the turbofish on the callee.
- Loop labels on the loop (r), where TypeScript uses `statement.labeled`.
- Decorator content kinds (t), where Python reads expressions.
- Import aliases (p r), where TypeScript uses an alias on `clause.import.specifier`.
- Relative imports (p), where rust reads `super::` and `self::` in a path.
- Python's parameter kinds `declaration.parameter.typed`, `.default` and `.typed_default`, where the others put `type` and `default` members on `declaration.parameter`.
- `statement.if.alternatives` (p) and `statement.if.alternative` (r t).
- `declaration.constant` (p r) and `declaration.variable.constant` (t).
- `statement.expression.content` (p r) and `statement.expression.expression` (t).
- `statement.loop.for_each.left` and `.right` (p r) and `.header` (t).
- Numeric literal facets (p t): `fraction`, `exponent` and the other float parts; `radixPrefix`. Rust lexes a numeric literal as one token.
- Rust's bitwise not `!`, read as a logical not.

### Each grammar's held set after the split

The parents of every split feature a grammar composes, plus these sub-features.

- **python:**
  - Feature sub-features: AsyncIteration, AsyncContexts, MultilineByteStrings, FunctionDecorators, DefaultParameterForms, RestPatterns, TuplePatterns, BareTuplePatterns, MappingPatterns, SpecialMethods, GenericClasses, GenericConstructors, VariadicTypeParameters, ConstrainedTypeParameters, MultilineRawStrings, RawInterpolation, ResourceStatements, FormatSpecifiers, DeferredInterpolation, MultilineInterpolation, BareTuples, UnionTypes, VariadicTypes, AccessorAnnotations, AnnotatedConstants, AnnotatedConstructors, NameImports, RelativeImports, FromImports.
  - Struct and class features: StructPatterns, Accessors, ExplicitOverrides, NullableTypes.
  - Core features: ComparisonChains, IdentityComparison, MembershipTests, NegatedMembership, FloorDivision, MatrixMultiplication, Exponentiation, LegacyInequality, UnaryPlus, MapLiterals, SetLiterals, KeyValuePairs, Spreads, ParenthesizedSpreads, NullLiteral, EllipsisLiteral, ImplicitConcatenation, MultilineStrings, DeleteStatements, ElseIfClauses, LoopElse, Docstrings.
- **rust:**
  - Visibility: ScopedVisibility, ItemVisibility, ScopedItemVisibility.
  - Feature sub-features: AsyncLambdas, AsyncSignatures, GeneratorBlocks, TuplePatterns, LetPatterns, MethodSignatures, ReceiverKeywords, Specialization, Traits, LoopLabels, NameImports, ImportTrees, GenericSignatures, InstantiationExpressions, GenericItems, BoundClauses, WhereClauses, BoundModifiers, UnitValues, PrimitiveTypes, TypeConstructors, TypeCasts, SizedNumericTypes, TraitObjectTypes, PointerTypes, QualifiedTypes, ConversionCasts, AnnotatedConstants, AnnotatedSignatures, FieldAnnotations.
  - Structs: StructPatterns, Structs.
  - Core features: BlockComments, DocComments, InnerDocComments, ExpressionBlocks, QualifiedPaths, ArrayRepeat, MutableBindings, LetElse, LiteralSuffixes, FieldDeclarations, FunctionSignatures, Modifiers, AttributeContent, AnnotatedLambdas.
- **typescript:**
  - Visibility: ProtectedVisibility, MemberVisibility, ProtectedMemberVisibility.
  - Feature sub-features: BigIntegerRadixes, AsyncLambdas, AsyncIteration, AsyncSignatures, AsyncFunctionExpressions, GeneratorFunctions, MemberDecorators, RestPatterns, ObjectPatterns, TypedReceivers, InterfaceSignatures, LabeledStatements, MethodSignatures, ReceiverKeywords, AccessorSignatures, NewExpressions, ClassExpressions, StaticMembers, MemberOverrides, Exports, ImportSpecifiers, DynamicImports, ExternalModules, GenericSignatures, InstantiationExpressions, GenericClasses, ExplicitTypeArguments, GenericTypeExpressions, BoundClauses, DisposableDeclarations, TaggedTemplates, PrimitiveTypes, TypeConstructors, TypeCasts, UnionTypes, VariadicTypes, TypeComputation, TypeAssertions, StructuralTypes, TypePredicates, TopAndBottomTypes, AccessorAnnotations, AnnotatedSignatures, FieldAnnotations.
  - Core features: MembershipTests, TypeTests, Exponentiation, NullishCoalescing, LogicalAssignment, UnsignedShift, IncrementDecrement, UnaryPlus, UnaryOperatorKeywords, SequenceExpressions, FunctionExpressions, MetaProperties, SuperReferences, ObjectLiterals, KeyValuePairs, Spreads, NullLiteral, Undefined, BindingKinds, PatternDeclarations, MultipleDeclarators, HtmlComments, BlockComments, DocComments, FieldDeclarations, FieldInitializers, FunctionSignatures, Modifiers, AttributeContent, AnnotatedLambdas.

## 2. Standard packages

A package is a feature with no content of its own that extends the features it combines, so a grammar has it exactly when it holds each of them. Each one is a folder under `features/` with only its marker in `index.ts`. A grammar's composition then names a package the way it names any feature. These are the packages the compositions and the tree suggest.

| Package (marker extends) | Features | Members |
|---|---|---|
| `ObjectOriented` | Methods, Classes | python, typescript |
| `Generic` | ParametricPolymorphism, BoundedQuantification | python, rust, typescript |
| `Annotated` | TypeAnnotations, TypeAliases, ParametricPolymorphism | python, rust, typescript |
| `Asynchronous` | AsyncAwait, Coroutines | python, rust, typescript |
| `PatternMatching` | MatchExpressions, TuplePatterns | python, rust |
| `CLike` | CountedLoops, PostTestLoops, MultiwayBranch, ConditionalExpressions, IncrementDecrement, SequenceExpressions, BlockComments | typescript |
| `JavaScriptFeatures` | the existing composition | typescript |

`CLike` has one member today. It's the contract a C, Java or JavaScript grammar joins. `JavaScriptFeatures` is already a feature with no content of its own (TypeScriptFeatures extends it), so it's a package as it stands. Packages may extend packages: `Annotated` could extend `Generic` instead of listing ParametricPolymorphism again.

## 3. Python's convention claims

Each claim follows the existing content claims (`declaration.constant`'s `#match?`). The query sketches name the Python grammar's nodes as they read today. Exact node names are checked when the claims are written.

| Construct | Claim | Vocabulary fact it states | Verdict |
|---|---|---|---|
| `@property def x(self)` in a class body | `(decorated_definition (decorator (identifier) @_d) definition: (function_definition) @declaration.property.getter (#eq? @_d "property"))` | Accessors: a property read through a getter | states it |
| `@x.setter def x(self, v)` | `(decorated_definition (decorator (attribute attribute: (identifier) @_a)) definition: (function_definition) @declaration.property.setter (#eq? @_a "setter"))` | Accessors: written through a setter | states it. `@x.deleter` has no vocabulary kind and stays a method. |
| `@override` (from `typing`, PEP 698) | the `override` flag on `declaration.method`, and on `declaration.property` when it's also a getter, matched on `override` or `typing.override` | ExplicitOverrides: a member marked as overriding the one it replaces | states it |
| `Optional[X]` | `(generic_type (identifier) @_n (type_parameter (type) @type)) @type.nullable (#eq? @_n "Optional")` | NullableTypes: a type that admits null | states it. `X \| None` stays `type.union`, as TypeScript's `X \| null` does. |
| `__x` (not a dunder) in a class body | the `privateName` flag on `declaration.method` and `declaration.field`, and on `expression.member` where it's read: `#match? "^__.*[^_]$"` (except `^__.*__$`) | **Encapsulation**: a member hidden from code outside its class, flagged where it's declared and where it's read. Name mangling is this fact, as TypeScript's `#x` is. | states Encapsulation, not Visibility |
| `_x` | none | — | **doesn't state it:** a convention only. The one language fact is that `from m import *` skips `_x` at module level, which `__all__` overrides. |
| `@abstractmethod` | none | AbstractClasses' `declaration.method.signature.abstract` is a method without a body. Python's abstract method has a body that `super()` can call. | **doesn't state it** |
| `class C(ABC)` | none | `declaration.class.abstract` is a class nothing instantiates. A class deriving from `ABC` is only uninstantiable while it has an unimplemented abstract method, which is a fact about its body, not its declaration. | **doesn't state it** |

## Questions for review

- **V. Visibility leaves Python's composition, and Encapsulation joins it.** Python states no access level: `_x` is a convention, and `__x` is Encapsulation's name-spelled privacy. Recommended: PythonFeatures drops Visibility and adds Encapsulation, and its doc comment loses "visibility by naming convention".
- **A. AbstractClasses leaves Python's composition.** Python's abstract methods have bodies, and its abstract classes are known by their bodies, so no claim states the vocabulary's fact. Recommended: PythonFeatures drops AbstractClasses. The alternative is a vocabulary member for an abstract method with a body, which the rule against new member names excludes.
- **N. Five members no grammar holds:** `bounds` on the three type-parameter refinements, and `definite` and `optionality` on `declaration.property`. Recommended:
  - the three `bounds` restate as `?: never` on their refinements, as `Lifetime.default` already does, since no language bounds these forms;
  - the two property members, which accessors can't take, move to the field (where TypeScript holds them already) by dropping the Property declaration.
  
  Both options remove nothing a grammar reads.
- **C. Core content is in scope.** The plan's first task named the feature clusters. The spec also moves the 88 core kinds and the 45 or so core members above. Recommended: the same tasks move them, since the guard can't pass without it.
- **M. Item visibility extends the features that add its bases** (Structs, Enumerations, AlgebraicDataTypes, Traits, ModuleDeclarations, UntaggedUnions, ImportTrees). That keeps every held set sound, but only a grammar with all of them can hold ItemVisibility. The alternative splits it per base, for example struct visibility extending ItemVisibility and Structs. That's finer, and it only pays when a grammar has item visibility without one of those features. Recommended: one piece until such a grammar exists.
- **S. Splitting by meaning within one holder set** (TypeAnnotations' typescript pieces, the Classes pieces) is optional. Recommended as proposed: names a reader can find, at no cost to any held set.
