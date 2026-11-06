# Portable features: tree, packages and Python's convention claims

Status: proposal, for review. Nothing in it is applied yet.

Decided so far:
- **V:** PythonFeatures drops Visibility and adds Encapsulation, and `__x` claims privateName.
- **A:** PythonFeatures drops AbstractClasses.
- **N:** the five members no grammar holds stay as they are. The guard exempts them and lists them.
- **Granularity:** the tree in section 1 (about 148 new features) is too fine. Section 4 gives the options to choose from. Section 1 stays as the inventory those options merge.

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
- **S. Splitting by meaning within one holder set** (TypeAnnotations' typescript pieces, the Classes pieces) is optional. Recommended as proposed: names a reader can find, at no cost to any held set. *Superseded by section 4.*

## 4. Granularity options

The constraint is fixed: a grammar that has a feature holds all of its content. So pieces merge only within one holder set.
- **Split features:** the floor is one sub-feature per (parent feature, holder set) cell. After rulings V and A and the claims to write, that's **58** cells, including the new StructPatterns. Python holds 23 of them, rust 20 and typescript 28. 45 of them have a single holder.
- **Core content:** the floor is one feature per holder set, which is 6 (`p`, `r`, `t`, `pt`, `rt`, `pr`).

Section 1's tree has about 148 new features: about 95 sub-features and about 53 core features.

### Option 1: the floor everywhere (64 features)

- **Shape:** 58 sub-features plus 6 core features. Each one is named for what it adds.
- **Examples:**
  - AsyncAwait's four pieces become AsyncLambdas (`rt`), AsyncIteration (`pt`), AsyncFunctionExpressions (`t`) and AsyncContexts (`p`).
  - TypeAnnotations' 35 typescript items become one `TypeAlgebra` (`t`), and its 19 rust items one `SystemsTypes` (`r`).
  - Visibility becomes two pieces: `ModuleVisibility` (`r`: the item kinds and the scoped levels, rust's module-based visibility) and `ClassVisibility` (`t`: protected and the class-member kinds).
- **The core features** are the residue of each holder set: one python feature holding chained comparisons, identity, floor division, matrix multiplication, `<>`, map and set literals, `...`, implicit concatenation, triple-quoted strings, `del`, `elif`, loop `else` and docstrings. One typescript feature holds `++`, `??`, `>>>`, `typeof`, `void`, `delete`, sequences, function expressions, `new.target`, object literals, `const`, `let` and `var`, and HTML comments. Rust's holds block expressions, `[x; n]`, `mut`, `let … else`, literal suffixes and inner doc comments. Plus three for the shared sets.
- **Held sets:** python 23 + 3, rust 20 + 3, typescript 28 + 3.
- **What agnostic code loses:**
  - A core feature can only be named after the grammars that hold it. It's a language feature kept in the shared vocabulary, so a contract can't ask for "exponentiation" without also taking unary `+`, `in` and bitwise `~`.
  - A fourth grammar that holds part of a cell splits it again, which changes what every contract naming that cell means.

### Option 2: the floor for features, coarse meaning groups for core content (86 features) — recommended

- **Shape:** 58 sub-features, as in option 1. The core content is grouped by area (operators, literals, expressions, declarations, statements, comments, attributes, patterns), and each area is split only by holder set. That gives **28** core features.
- **Examples:**
  - Operators: `p` (comparison chains and comparators, identity, `not in`, floor division, matrix multiplication, `<>`), `pt` (`**`, `in`, unary `+`, `~`) and `t` (`??`, the logical assignments, `>>>`, `instanceof`, `typeof`, `void`, `delete`, `++` and `--`).
  - Literals: `p` (`...`, implicit concatenation, triple-quoted strings), `pt` (`null`, the float and radix facets), `r` (literal suffixes) and `t` (`undefined`).
  - Comments: `rt` (block and doc comments), `r` (inner doc comments) and `t` (HTML comments).
  - Small cells merge where the area has one item: rust's `pattern.mutable` goes with its declarations (`mut`), and the two attribute cells go with declarations. That leaves 25.
- **Held sets** (before the merges): python 23 + 10, rust 20 + 14, typescript 28 + 14.
- **What agnostic code loses:**
  - Within an area, a contract takes the whole cell. Code that wants `**` also gets unary `+`.
  - The lost precision stays inside one area, and every name says what the content is, so a diagnostic like "requires PythonOperators" points somewhere a reader can find.
  - A fourth grammar re-splits only the cells of the areas it touches.
- **Why it's recommended:** it's the coarsest level where every feature still names a part of a language instead of a set of grammars. The 58 feature cells are already at the floor, and their parents give them meaning (AsyncContexts, TypeAlgebra).

### Option 3: single-grammar tiny constructs become language features (needs the user's word)

- **Shape:** take option 2, and move each single-grammar core cell (18 of the 28) into that grammar's generated language features. That leaves 58 + 10 = **68** vocabulary features, plus about 6 language features per grammar.
- **Candidates:** python's `...`, docstrings, `<>`, implicit concatenation and `del`; typescript's HTML comments, `undefined`, `new.target`/`import.meta` and `void`; rust's `[x; n]`, literal suffixes and `let … else`. UnaryPlus, the example given, is held by python and typescript both, so it stays in the vocabulary under any option.
- **What agnostic code loses:**
  - Language features aren't in the shared vocabulary, so agnostic code can't name them at all. Under a contract they read as their nearest ancestor, or as opaque.
  - A fourth grammar with the same construct (C's `++`, Ruby's `**`) has to move it back into the vocabulary first.
  - It also revises the ruling that content already in the vocabulary stays there, which is why it needs the user's word.

### Recommendation

**Option 2**, at 86 features (83 after the one-item merges), against about 148 today. If that's still too many, the next step is option 3 for the 18 single-grammar core cells only, with the user's word. Splitting the 58 feature cells further by meaning should wait for a grammar that holds part of one.

## 5. The nine-language scrub

The cuts above follow the differences between three grammars. This section tests them against six more languages, so the cuts follow language families instead. The rule for real grammars doesn't change. The six only decide where to cut and how to name.

### Sources and method

**The matrix** is [`2026-11-05-portable-features-matrix.tsv`](2026-11-05-portable-features-matrix.tsv). It has one row per vocabulary kind (628) and per feature-owned or core-gap member (233), with nine columns. Each cell is H (has), L (lacks) or D (different shape).

- **Measured: python, rust and typescript,** from their bindings.
- **Measured: go and c,** from probe bindings on `probe/feature-scrub`. Each language was bootstrapped with `tool bootstrap-grammar` and left unstable. Its `bindings.scm` claims the vocabulary content the language has, and `derive()` gives the held set. After the bootstrap fixes all four were bootstrapped again from the fixed template, with no hand-written files. Go's and C's held sets came out identical, kind for kind and member for member.
  - A measured cell is H when the grammar claims the path, or routes the member. Otherwise the paper judgment decides between L and D.
  - Go makes 140 claims (162 kinds held), and C makes 112 (130 kinds held).
- **Paper: java and c#** (bootstrap blocked by core defects, see below), **swift and c++.** These are language knowledge, checked against each upstream grammar's `node-types.json` and `grammar.json` at the pinned tag. Spot-checked witness nodes all exist, except two. C++ has no `module` or `import` node, because it uses `#include`, a different shape. Java's text blocks lex as an ordinary `string_literal`. The judgments are rules, so each cell traces to one: `docs/superpowers/probes/2026-11-05-feature-scrub/paper_rules.py` on the probe branch.
- **Pins** (each a tagged release of the maintained repo): go v0.25.0, java v0.23.5, c-sharp v0.23.5 and c v0.24.2 (npm had only 0.24.1, so the git tag); c++ v0.23.4 and swift 0.7.3 (alex-pinkus). Downloaded files went into their own directories, and nothing from them was run. Bootstrap's `pnpm install` left every new package's build script unapproved.
- **Calibration of paper against measured.** The paper rules agree with the measured claims on 92% of rows for Go and 94% for C.
  - Go's disagreements:
    - visibility by capitalization is claimed (paper said "different shape"), and the compiler enforces it, so measured is right;
    - `++` and `--` are claimed though they're statements;
    - labels are on labeled statements (paper said loops).
  - The rest are the probe bindings' gaps: number-literal facets, `left`/`right`, receivers and a few members. They're measurement gaps, not language facts, and they show up as splits charged to Go and C below.

### Bootstrap blockers

| Language | Blocker | Class |
|---|---|---|
| all four | Fixed. The template had no `base.ts` and no `options.indent`, and plain `gen` lacked the transpile chain. The template now writes all three, and the rerun's `base.ts`, `package.json`, README and tsconfigs are byte-identical to the hand workarounds. | core (tooling), fixed |
| go | Allowed for the probe: `unclassifiable-shape` ×2, `union-slot-mixed-row`, `separator-default-undeclared` ×7, `dropped-token` ×4. Authored: `channel_type`'s three arms as variants. `chan<-` is now the `unresolved-enum-text` diagnostic, so authoring resolves it. | authoring |
| go, c | `--all` stops in render-module on a named alias over an inline token (Go's string contents, C's `char_literal` → `character`). Measured without the render module. | core (#1098) |
| java | The display-name error is fixed. Next, the template emitter's duplicate-slot violation on `formal_parameters` and `try_statement` was authored away with variants. Plain `gen` then throws `SyntaxError: Invalid regular expression … Invalid capture group name`, because the optional `.` in `hex_floating_point_literal` becomes a flag named `.`. Java is on paper. | core (#1100) |
| c# | The fixpoint error is fixed. Authored: `_optional_semi`'s `visibleExternals` text, field names on `argument` and `preproc_nullable`, and what enrich then adds on the declaration-list bodies, type argument lists and record bases. Plain `gen` then throws a raw leaf-registry error: its 11 visible scanner tokens have no `renderAs` shape, and the emitter reports them one throw at a time. `--all` also stops at the WASM build (#1097). C# is on paper. | core (#1101) |
| c | Allowed for the probe: `storagename-collision` (type_definition, type_descriptor), `unclassifiable-shape` ×4, `union-slot-mixed-row`, `display-union-mixed` (primitive_type), `content-collision` (alignas_qualifier), `dropped-token` | authoring |
| go, c bindings | A kind with only refining claims whose paths share no parent (`type_spec`, `pointer_expression`) must claim the kind itself | authoring |

### Re-cutting option 2 against nine languages

A cell is a (feature or core area, holder set over python, rust and typescript) piece, as in option 2. A fourth grammar *splits* a cell when it holds part of it.
- **Families:** C-procedural is go and c. C-family object-oriented is java, c# and c++. Swift stands alone.
- **The ceiling:** splits in parent and core cells (8 to 17 per language) can't be avoided by any cut of sub-features, so the comparison counts sub-feature cells.

| Cut | Features | Each real grammar holds | Sub-feature cells a fourth grammar splits (go, java, c#, c, swift, c++) |
|---|---|---|---|
| Option 2, cut by the three grammars | 83 | python 31, rust 30, typescript 38 | 20, 26, 32, 13, 33, 25 (149 in all) |
| **Option 2 with targeted family splits (recommended)** | **104** | python 45, rust 38, typescript 45 | **12, 15, 21, 9, 21, 16 (94)** |
| Option 2 with every sub-feature cell split by family | 162 | python 51, rust 63, typescript 81 | 3, 7, 18, 4, 0, 15 (47) |
| Every cell by its full nine-language signature | 334 | — | 7 to 35 per language when that language is held out of the cut |

The **targeted** cut splits a cell by family only where that saves at least two splits per feature it adds. That's 15 cells: +21 features, −55 splits. It's the knee. Past it, each added feature saves about one split, so cutting more pays now for languages that may never be bootstrapped. A split costs the same later as it does now. The family lines it draws:
- **Core operators** (python and typescript): `~` and unary `+` (C-family, held by all six) part from `**` and `in` (held by none).
- **Python-only operators:** identity (`is`, which Swift's `===` shares) parts from comparators and chains.
- **Comments:** block comments (all of the C family) part from doc comments (c, swift and c++ conventions) and from rust's inner doc comments.
- **Declarations:** fields, modifiers and attribute content (every C-family language) part from bodiless function signatures (go). `declaration.constant` (go and c#) parts from `argument`.
- **Structs:** the struct declaration (C family and swift) parts from struct literals and fields (C-procedural: go and c) and from rust's tuple and unit structs.
- **Destructuring:** the wildcard `_` (java, c# and swift) parts from tuple patterns (swift).
- **Imports:** wildcard imports (go, java and c++) part from aliases (go and c#).
- **ParametricPolymorphism, python's piece:** variadic type parameters (swift's and c++'s packs) part from ParamSpec and from generic constructors.
- **Literals, python's piece:** triple-quoted strings (java text blocks, c# and swift) part from implicit concatenation (c and c++) and from `...`.
- **Expressions:** map literals (go, c# and swift) part from set literals and `**` spreads.

The name for each comes from its family, for example `CFamilyUnaryOperators`, `BlockComments`, `MultilineStrings` and `WildcardImports`.

### Coverage: which language the current three cover worst

- **Measured:** the claims name 74% of Go's upstream node kinds and 52% of C's.
  - Go's misses are mostly list containers, plus constructs the vocabulary has no content for: channels, `go`, `select`, send and receive (ConcurrencySyntax is marker-only), `defer` (DeferredExecution is marker-only), `goto`, `fallthrough`, type sets (`~T`, unions in constraints) and `iota`.
  - C's misses are mostly the preprocessor and the MS and GNU extensions, plus `sizeof`, `alignof`, `offsetof`, `goto`, bitfields and designators.
- **Rows held:** C# holds the most vocabulary rows of the six (402), so the three cover its constructs broadly, but its cells cut differently: 21 splits.
- **Swift is covered worst.** It has the most splits under every cut (33, then 21), and its defining constructs have no vocabulary home or a misaligned one: optionals and `if let`/`guard let`, `guard`, `defer`, protocol extensions and conformance, property wrappers, result builders, actors, key paths, `inout`, `some` and `any`. **Swift is the likely first language to bootstrap**, and C# is next.
- **Go is the cheapest fourth grammar:** 12 splits under the recommended cut, almost all in the C-procedural family.

### Recommendation

The **targeted family cut: 104 features**, against 83 for option 2 cut by three grammars and about 148 for section 1.
- **Real grammars:** python holds 45 sub-features, rust 38 and typescript 45.
- **A fourth grammar** splits 9 to 21 sub-feature cells, against 13 to 33 before.
- **Every name is a family line,** not a set of grammars.

Two findings go with it:
- **ConcurrencySyntax and DeferredExecution** are marker-only today. They're the future home of Go's channels, `go`, `select`, send and receive, and `defer` (and later Swift's `defer` and actors). Their content waits until Go is bootstrapped. Until then they stay trivially held markers.
- The core defects the bootstrap found are filed as issues:
  - #1091 to #1094, fixed: the bootstrap template, Go's `chan<-` (now a diagnostic), Java's display name, and C#'s enrich fixpoint and template `PATTERN`;
  - #1098, open: render-module and a named alias over an inline token (Go, C);
  - #1100, open: Java's invalid regex group name;
  - #1101, open: C#'s scanner tokens without `renderAs` throw instead of reporting a diagnostic;
  - #1097, open: C#'s scanner symbols in the WASM build.
