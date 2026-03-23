import type { RustGrammar } from './grammar.js';
import type { NodeType, BuilderConfig, ValidationResult } from '@sittir/types';

export type { RustGrammar };

export type AbstractType = NodeType<RustGrammar, 'abstract_type'>;
export type AbstractTypeConfig = BuilderConfig<RustGrammar, AbstractType>;

export type Arguments = NodeType<RustGrammar, 'arguments'>;
export type ArgumentsConfig = BuilderConfig<RustGrammar, Arguments>;

export type ArrayExpression = NodeType<RustGrammar, 'array_expression'>;
export type ArrayExpressionConfig = BuilderConfig<RustGrammar, ArrayExpression>;

export type ArrayType = NodeType<RustGrammar, 'array_type'>;
export type ArrayTypeConfig = BuilderConfig<RustGrammar, ArrayType>;

export type AssignmentExpression = NodeType<RustGrammar, 'assignment_expression'>;
export type AssignmentExpressionConfig = BuilderConfig<RustGrammar, AssignmentExpression>;

export type AssociatedType = NodeType<RustGrammar, 'associated_type'>;
export type AssociatedTypeConfig = BuilderConfig<RustGrammar, AssociatedType>;

export type AsyncBlock = NodeType<RustGrammar, 'async_block'>;
export type AsyncBlockConfig = BuilderConfig<RustGrammar, AsyncBlock>;

export type Attribute = NodeType<RustGrammar, 'attribute'>;
export type AttributeConfig = BuilderConfig<RustGrammar, Attribute>;

export type AttributeItem = NodeType<RustGrammar, 'attribute_item'>;
export type AttributeItemConfig = BuilderConfig<RustGrammar, AttributeItem>;

export type AwaitExpression = NodeType<RustGrammar, 'await_expression'>;
export type AwaitExpressionConfig = BuilderConfig<RustGrammar, AwaitExpression>;

export type BaseFieldInitializer = NodeType<RustGrammar, 'base_field_initializer'>;
export type BaseFieldInitializerConfig = BuilderConfig<RustGrammar, BaseFieldInitializer>;

export type BinaryExpression = NodeType<RustGrammar, 'binary_expression'>;
export type BinaryExpressionConfig = BuilderConfig<RustGrammar, BinaryExpression>;

export type Block = NodeType<RustGrammar, 'block'>;
export type BlockConfig = BuilderConfig<RustGrammar, Block>;

export type BlockComment = NodeType<RustGrammar, 'block_comment'>;
export type BlockCommentConfig = BuilderConfig<RustGrammar, BlockComment>;

export type BoundedType = NodeType<RustGrammar, 'bounded_type'>;
export type BoundedTypeConfig = BuilderConfig<RustGrammar, BoundedType>;

export type BracketedType = NodeType<RustGrammar, 'bracketed_type'>;
export type BracketedTypeConfig = BuilderConfig<RustGrammar, BracketedType>;

export type BreakExpression = NodeType<RustGrammar, 'break_expression'>;
export type BreakExpressionConfig = BuilderConfig<RustGrammar, BreakExpression>;

export type CallExpression = NodeType<RustGrammar, 'call_expression'>;
export type CallExpressionConfig = BuilderConfig<RustGrammar, CallExpression>;

export type CapturedPattern = NodeType<RustGrammar, 'captured_pattern'>;
export type CapturedPatternConfig = BuilderConfig<RustGrammar, CapturedPattern>;

export type ClosureExpression = NodeType<RustGrammar, 'closure_expression'>;
export type ClosureExpressionConfig = BuilderConfig<RustGrammar, ClosureExpression>;

export type ClosureParameters = NodeType<RustGrammar, 'closure_parameters'>;
export type ClosureParametersConfig = BuilderConfig<RustGrammar, ClosureParameters>;

export type CompoundAssignmentExpr = NodeType<RustGrammar, 'compound_assignment_expr'>;
export type CompoundAssignmentExprConfig = BuilderConfig<RustGrammar, CompoundAssignmentExpr>;

export type ConstBlock = NodeType<RustGrammar, 'const_block'>;
export type ConstBlockConfig = BuilderConfig<RustGrammar, ConstBlock>;

export type ConstItem = NodeType<RustGrammar, 'const_item'>;
export type ConstItemConfig = BuilderConfig<RustGrammar, ConstItem>;

export type ConstParameter = NodeType<RustGrammar, 'const_parameter'>;
export type ConstParameterConfig = BuilderConfig<RustGrammar, ConstParameter>;

export type ContinueExpression = NodeType<RustGrammar, 'continue_expression'>;
export type ContinueExpressionConfig = BuilderConfig<RustGrammar, ContinueExpression>;

export type DeclarationList = NodeType<RustGrammar, 'declaration_list'>;
export type DeclarationListConfig = BuilderConfig<RustGrammar, DeclarationList>;

export type DynamicType = NodeType<RustGrammar, 'dynamic_type'>;
export type DynamicTypeConfig = BuilderConfig<RustGrammar, DynamicType>;

export type ElseClause = NodeType<RustGrammar, 'else_clause'>;
export type ElseClauseConfig = BuilderConfig<RustGrammar, ElseClause>;

export type EnumItem = NodeType<RustGrammar, 'enum_item'>;
export type EnumItemConfig = BuilderConfig<RustGrammar, EnumItem>;

export type EnumVariant = NodeType<RustGrammar, 'enum_variant'>;
export type EnumVariantConfig = BuilderConfig<RustGrammar, EnumVariant>;

export type EnumVariantList = NodeType<RustGrammar, 'enum_variant_list'>;
export type EnumVariantListConfig = BuilderConfig<RustGrammar, EnumVariantList>;

export type ExpressionStatement = NodeType<RustGrammar, 'expression_statement'>;
export type ExpressionStatementConfig = BuilderConfig<RustGrammar, ExpressionStatement>;

export type ExternCrateDeclaration = NodeType<RustGrammar, 'extern_crate_declaration'>;
export type ExternCrateDeclarationConfig = BuilderConfig<RustGrammar, ExternCrateDeclaration>;

export type ExternModifier = NodeType<RustGrammar, 'extern_modifier'>;
export type ExternModifierConfig = BuilderConfig<RustGrammar, ExternModifier>;

export type FieldDeclaration = NodeType<RustGrammar, 'field_declaration'>;
export type FieldDeclarationConfig = BuilderConfig<RustGrammar, FieldDeclaration>;

export type FieldDeclarationList = NodeType<RustGrammar, 'field_declaration_list'>;
export type FieldDeclarationListConfig = BuilderConfig<RustGrammar, FieldDeclarationList>;

export type FieldExpression = NodeType<RustGrammar, 'field_expression'>;
export type FieldExpressionConfig = BuilderConfig<RustGrammar, FieldExpression>;

export type FieldInitializer = NodeType<RustGrammar, 'field_initializer'>;
export type FieldInitializerConfig = BuilderConfig<RustGrammar, FieldInitializer>;

export type FieldInitializerList = NodeType<RustGrammar, 'field_initializer_list'>;
export type FieldInitializerListConfig = BuilderConfig<RustGrammar, FieldInitializerList>;

export type FieldPattern = NodeType<RustGrammar, 'field_pattern'>;
export type FieldPatternConfig = BuilderConfig<RustGrammar, FieldPattern>;

export type ForExpression = NodeType<RustGrammar, 'for_expression'>;
export type ForExpressionConfig = BuilderConfig<RustGrammar, ForExpression>;

export type ForLifetimes = NodeType<RustGrammar, 'for_lifetimes'>;
export type ForLifetimesConfig = BuilderConfig<RustGrammar, ForLifetimes>;

export type ForeignModItem = NodeType<RustGrammar, 'foreign_mod_item'>;
export type ForeignModItemConfig = BuilderConfig<RustGrammar, ForeignModItem>;

export type FunctionItem = NodeType<RustGrammar, 'function_item'>;
export type FunctionItemConfig = BuilderConfig<RustGrammar, FunctionItem>;

export type FunctionModifiers = NodeType<RustGrammar, 'function_modifiers'>;
export type FunctionModifiersConfig = BuilderConfig<RustGrammar, FunctionModifiers>;

export type FunctionSignatureItem = NodeType<RustGrammar, 'function_signature_item'>;
export type FunctionSignatureItemConfig = BuilderConfig<RustGrammar, FunctionSignatureItem>;

export type FunctionType = NodeType<RustGrammar, 'function_type'>;
export type FunctionTypeConfig = BuilderConfig<RustGrammar, FunctionType>;

export type GenBlock = NodeType<RustGrammar, 'gen_block'>;
export type GenBlockConfig = BuilderConfig<RustGrammar, GenBlock>;

export type GenericFunction = NodeType<RustGrammar, 'generic_function'>;
export type GenericFunctionConfig = BuilderConfig<RustGrammar, GenericFunction>;

export type GenericPattern = NodeType<RustGrammar, 'generic_pattern'>;
export type GenericPatternConfig = BuilderConfig<RustGrammar, GenericPattern>;

export type GenericType = NodeType<RustGrammar, 'generic_type'>;
export type GenericTypeConfig = BuilderConfig<RustGrammar, GenericType>;

export type GenericTypeWithTurbofish = NodeType<RustGrammar, 'generic_type_with_turbofish'>;
export type GenericTypeWithTurbofishConfig = BuilderConfig<RustGrammar, GenericTypeWithTurbofish>;

export type HigherRankedTraitBound = NodeType<RustGrammar, 'higher_ranked_trait_bound'>;
export type HigherRankedTraitBoundConfig = BuilderConfig<RustGrammar, HigherRankedTraitBound>;

export type IfExpression = NodeType<RustGrammar, 'if_expression'>;
export type IfExpressionConfig = BuilderConfig<RustGrammar, IfExpression>;

export type ImplItem = NodeType<RustGrammar, 'impl_item'>;
export type ImplItemConfig = BuilderConfig<RustGrammar, ImplItem>;

export type IndexExpression = NodeType<RustGrammar, 'index_expression'>;
export type IndexExpressionConfig = BuilderConfig<RustGrammar, IndexExpression>;

export type InnerAttributeItem = NodeType<RustGrammar, 'inner_attribute_item'>;
export type InnerAttributeItemConfig = BuilderConfig<RustGrammar, InnerAttributeItem>;

export type Label = NodeType<RustGrammar, 'label'>;
export type LabelConfig = BuilderConfig<RustGrammar, Label>;

export type LetChain = NodeType<RustGrammar, 'let_chain'>;
export type LetChainConfig = BuilderConfig<RustGrammar, LetChain>;

export type LetCondition = NodeType<RustGrammar, 'let_condition'>;
export type LetConditionConfig = BuilderConfig<RustGrammar, LetCondition>;

export type LetDeclaration = NodeType<RustGrammar, 'let_declaration'>;
export type LetDeclarationConfig = BuilderConfig<RustGrammar, LetDeclaration>;

export type Lifetime = NodeType<RustGrammar, 'lifetime'>;
export type LifetimeConfig = BuilderConfig<RustGrammar, Lifetime>;

export type LifetimeParameter = NodeType<RustGrammar, 'lifetime_parameter'>;
export type LifetimeParameterConfig = BuilderConfig<RustGrammar, LifetimeParameter>;

export type LineComment = NodeType<RustGrammar, 'line_comment'>;
export type LineCommentConfig = BuilderConfig<RustGrammar, LineComment>;

export type LoopExpression = NodeType<RustGrammar, 'loop_expression'>;
export type LoopExpressionConfig = BuilderConfig<RustGrammar, LoopExpression>;

export type MacroDefinition = NodeType<RustGrammar, 'macro_definition'>;
export type MacroDefinitionConfig = BuilderConfig<RustGrammar, MacroDefinition>;

export type MacroInvocation = NodeType<RustGrammar, 'macro_invocation'>;
export type MacroInvocationConfig = BuilderConfig<RustGrammar, MacroInvocation>;

export type MacroRule = NodeType<RustGrammar, 'macro_rule'>;
export type MacroRuleConfig = BuilderConfig<RustGrammar, MacroRule>;

export type MatchArm = NodeType<RustGrammar, 'match_arm'>;
export type MatchArmConfig = BuilderConfig<RustGrammar, MatchArm>;

export type MatchBlock = NodeType<RustGrammar, 'match_block'>;
export type MatchBlockConfig = BuilderConfig<RustGrammar, MatchBlock>;

export type MatchExpression = NodeType<RustGrammar, 'match_expression'>;
export type MatchExpressionConfig = BuilderConfig<RustGrammar, MatchExpression>;

export type MatchPattern = NodeType<RustGrammar, 'match_pattern'>;
export type MatchPatternConfig = BuilderConfig<RustGrammar, MatchPattern>;

export type ModItem = NodeType<RustGrammar, 'mod_item'>;
export type ModItemConfig = BuilderConfig<RustGrammar, ModItem>;

export type MutPattern = NodeType<RustGrammar, 'mut_pattern'>;
export type MutPatternConfig = BuilderConfig<RustGrammar, MutPattern>;

export type NegativeLiteral = NodeType<RustGrammar, 'negative_literal'>;
export type NegativeLiteralConfig = BuilderConfig<RustGrammar, NegativeLiteral>;

export type OrPattern = NodeType<RustGrammar, 'or_pattern'>;
export type OrPatternConfig = BuilderConfig<RustGrammar, OrPattern>;

export type OrderedFieldDeclarationList = NodeType<RustGrammar, 'ordered_field_declaration_list'>;
export type OrderedFieldDeclarationListConfig = BuilderConfig<RustGrammar, OrderedFieldDeclarationList>;

export type Parameter = NodeType<RustGrammar, 'parameter'>;
export type ParameterConfig = BuilderConfig<RustGrammar, Parameter>;

export type Parameters = NodeType<RustGrammar, 'parameters'>;
export type ParametersConfig = BuilderConfig<RustGrammar, Parameters>;

export type ParenthesizedExpression = NodeType<RustGrammar, 'parenthesized_expression'>;
export type ParenthesizedExpressionConfig = BuilderConfig<RustGrammar, ParenthesizedExpression>;

export type PointerType = NodeType<RustGrammar, 'pointer_type'>;
export type PointerTypeConfig = BuilderConfig<RustGrammar, PointerType>;

export type QualifiedType = NodeType<RustGrammar, 'qualified_type'>;
export type QualifiedTypeConfig = BuilderConfig<RustGrammar, QualifiedType>;

export type RangeExpression = NodeType<RustGrammar, 'range_expression'>;
export type RangeExpressionConfig = BuilderConfig<RustGrammar, RangeExpression>;

export type RangePattern = NodeType<RustGrammar, 'range_pattern'>;
export type RangePatternConfig = BuilderConfig<RustGrammar, RangePattern>;

export type RawStringLiteral = NodeType<RustGrammar, 'raw_string_literal'>;
export type RawStringLiteralConfig = BuilderConfig<RustGrammar, RawStringLiteral>;

export type RefPattern = NodeType<RustGrammar, 'ref_pattern'>;
export type RefPatternConfig = BuilderConfig<RustGrammar, RefPattern>;

export type ReferenceExpression = NodeType<RustGrammar, 'reference_expression'>;
export type ReferenceExpressionConfig = BuilderConfig<RustGrammar, ReferenceExpression>;

export type ReferencePattern = NodeType<RustGrammar, 'reference_pattern'>;
export type ReferencePatternConfig = BuilderConfig<RustGrammar, ReferencePattern>;

export type ReferenceType = NodeType<RustGrammar, 'reference_type'>;
export type ReferenceTypeConfig = BuilderConfig<RustGrammar, ReferenceType>;

export type RemovedTraitBound = NodeType<RustGrammar, 'removed_trait_bound'>;
export type RemovedTraitBoundConfig = BuilderConfig<RustGrammar, RemovedTraitBound>;

export type ReturnExpression = NodeType<RustGrammar, 'return_expression'>;
export type ReturnExpressionConfig = BuilderConfig<RustGrammar, ReturnExpression>;

export type ScopedIdentifier = NodeType<RustGrammar, 'scoped_identifier'>;
export type ScopedIdentifierConfig = BuilderConfig<RustGrammar, ScopedIdentifier>;

export type ScopedTypeIdentifier = NodeType<RustGrammar, 'scoped_type_identifier'>;
export type ScopedTypeIdentifierConfig = BuilderConfig<RustGrammar, ScopedTypeIdentifier>;

export type ScopedUseList = NodeType<RustGrammar, 'scoped_use_list'>;
export type ScopedUseListConfig = BuilderConfig<RustGrammar, ScopedUseList>;

export type SelfParameter = NodeType<RustGrammar, 'self_parameter'>;
export type SelfParameterConfig = BuilderConfig<RustGrammar, SelfParameter>;

export type ShorthandFieldInitializer = NodeType<RustGrammar, 'shorthand_field_initializer'>;
export type ShorthandFieldInitializerConfig = BuilderConfig<RustGrammar, ShorthandFieldInitializer>;

export type SlicePattern = NodeType<RustGrammar, 'slice_pattern'>;
export type SlicePatternConfig = BuilderConfig<RustGrammar, SlicePattern>;

export type SourceFile = NodeType<RustGrammar, 'source_file'>;
export type SourceFileConfig = BuilderConfig<RustGrammar, SourceFile>;

export type StaticItem = NodeType<RustGrammar, 'static_item'>;
export type StaticItemConfig = BuilderConfig<RustGrammar, StaticItem>;

export type StringLiteral = NodeType<RustGrammar, 'string_literal'>;
export type StringLiteralConfig = BuilderConfig<RustGrammar, StringLiteral>;

export type StructExpression = NodeType<RustGrammar, 'struct_expression'>;
export type StructExpressionConfig = BuilderConfig<RustGrammar, StructExpression>;

export type StructItem = NodeType<RustGrammar, 'struct_item'>;
export type StructItemConfig = BuilderConfig<RustGrammar, StructItem>;

export type StructPattern = NodeType<RustGrammar, 'struct_pattern'>;
export type StructPatternConfig = BuilderConfig<RustGrammar, StructPattern>;

export type TokenBindingPattern = NodeType<RustGrammar, 'token_binding_pattern'>;
export type TokenBindingPatternConfig = BuilderConfig<RustGrammar, TokenBindingPattern>;

export type TokenRepetition = NodeType<RustGrammar, 'token_repetition'>;
export type TokenRepetitionConfig = BuilderConfig<RustGrammar, TokenRepetition>;

export type TokenRepetitionPattern = NodeType<RustGrammar, 'token_repetition_pattern'>;
export type TokenRepetitionPatternConfig = BuilderConfig<RustGrammar, TokenRepetitionPattern>;

export type TokenTree = NodeType<RustGrammar, 'token_tree'>;
export type TokenTreeConfig = BuilderConfig<RustGrammar, TokenTree>;

export type TokenTreePattern = NodeType<RustGrammar, 'token_tree_pattern'>;
export type TokenTreePatternConfig = BuilderConfig<RustGrammar, TokenTreePattern>;

export type TraitBounds = NodeType<RustGrammar, 'trait_bounds'>;
export type TraitBoundsConfig = BuilderConfig<RustGrammar, TraitBounds>;

export type TraitItem = NodeType<RustGrammar, 'trait_item'>;
export type TraitItemConfig = BuilderConfig<RustGrammar, TraitItem>;

export type TryBlock = NodeType<RustGrammar, 'try_block'>;
export type TryBlockConfig = BuilderConfig<RustGrammar, TryBlock>;

export type TryExpression = NodeType<RustGrammar, 'try_expression'>;
export type TryExpressionConfig = BuilderConfig<RustGrammar, TryExpression>;

export type TupleExpression = NodeType<RustGrammar, 'tuple_expression'>;
export type TupleExpressionConfig = BuilderConfig<RustGrammar, TupleExpression>;

export type TuplePattern = NodeType<RustGrammar, 'tuple_pattern'>;
export type TuplePatternConfig = BuilderConfig<RustGrammar, TuplePattern>;

export type TupleStructPattern = NodeType<RustGrammar, 'tuple_struct_pattern'>;
export type TupleStructPatternConfig = BuilderConfig<RustGrammar, TupleStructPattern>;

export type TupleType = NodeType<RustGrammar, 'tuple_type'>;
export type TupleTypeConfig = BuilderConfig<RustGrammar, TupleType>;

export type TypeArguments = NodeType<RustGrammar, 'type_arguments'>;
export type TypeArgumentsConfig = BuilderConfig<RustGrammar, TypeArguments>;

export type TypeBinding = NodeType<RustGrammar, 'type_binding'>;
export type TypeBindingConfig = BuilderConfig<RustGrammar, TypeBinding>;

export type TypeCastExpression = NodeType<RustGrammar, 'type_cast_expression'>;
export type TypeCastExpressionConfig = BuilderConfig<RustGrammar, TypeCastExpression>;

export type TypeItem = NodeType<RustGrammar, 'type_item'>;
export type TypeItemConfig = BuilderConfig<RustGrammar, TypeItem>;

export type TypeParameter = NodeType<RustGrammar, 'type_parameter'>;
export type TypeParameterConfig = BuilderConfig<RustGrammar, TypeParameter>;

export type TypeParameters = NodeType<RustGrammar, 'type_parameters'>;
export type TypeParametersConfig = BuilderConfig<RustGrammar, TypeParameters>;

export type UnaryExpression = NodeType<RustGrammar, 'unary_expression'>;
export type UnaryExpressionConfig = BuilderConfig<RustGrammar, UnaryExpression>;

export type UnionItem = NodeType<RustGrammar, 'union_item'>;
export type UnionItemConfig = BuilderConfig<RustGrammar, UnionItem>;

export type UnsafeBlock = NodeType<RustGrammar, 'unsafe_block'>;
export type UnsafeBlockConfig = BuilderConfig<RustGrammar, UnsafeBlock>;

export type UseAsClause = NodeType<RustGrammar, 'use_as_clause'>;
export type UseAsClauseConfig = BuilderConfig<RustGrammar, UseAsClause>;

export type UseBounds = NodeType<RustGrammar, 'use_bounds'>;
export type UseBoundsConfig = BuilderConfig<RustGrammar, UseBounds>;

export type UseDeclaration = NodeType<RustGrammar, 'use_declaration'>;
export type UseDeclarationConfig = BuilderConfig<RustGrammar, UseDeclaration>;

export type UseList = NodeType<RustGrammar, 'use_list'>;
export type UseListConfig = BuilderConfig<RustGrammar, UseList>;

export type UseWildcard = NodeType<RustGrammar, 'use_wildcard'>;
export type UseWildcardConfig = BuilderConfig<RustGrammar, UseWildcard>;

export type VariadicParameter = NodeType<RustGrammar, 'variadic_parameter'>;
export type VariadicParameterConfig = BuilderConfig<RustGrammar, VariadicParameter>;

export type VisibilityModifier = NodeType<RustGrammar, 'visibility_modifier'>;
export type VisibilityModifierConfig = BuilderConfig<RustGrammar, VisibilityModifier>;

export type WhereClause = NodeType<RustGrammar, 'where_clause'>;
export type WhereClauseConfig = BuilderConfig<RustGrammar, WhereClause>;

export type WherePredicate = NodeType<RustGrammar, 'where_predicate'>;
export type WherePredicateConfig = BuilderConfig<RustGrammar, WherePredicate>;

export type WhileExpression = NodeType<RustGrammar, 'while_expression'>;
export type WhileExpressionConfig = BuilderConfig<RustGrammar, WhileExpression>;

export type YieldExpression = NodeType<RustGrammar, 'yield_expression'>;
export type YieldExpressionConfig = BuilderConfig<RustGrammar, YieldExpression>;

// Leaf node types
export type BooleanLiteral = { kind: 'boolean_literal' };
export type EmptyStatement = { kind: 'empty_statement' };
export type FragmentSpecifier = { kind: 'fragment_specifier' };
export type InnerDocCommentMarker = { kind: 'inner_doc_comment_marker' };
export type NeverType = { kind: 'never_type' };
export type OuterDocCommentMarker = { kind: 'outer_doc_comment_marker' };
export type RemainingFieldPattern = { kind: 'remaining_field_pattern' };
export type UnitExpression = { kind: 'unit_expression' };
export type UnitType = { kind: 'unit_type' };
export type CharLiteral = { kind: 'char_literal' };
export type Crate = { kind: 'crate' };
export type DocComment = { kind: 'doc_comment' };
export type EscapeSequence = { kind: 'escape_sequence' };
export type FieldIdentifier = { kind: 'field_identifier' };
export type FloatLiteral = { kind: 'float_literal' };
export type Identifier = { kind: 'identifier' };
export type IntegerLiteral = { kind: 'integer_literal' };
export type Metavariable = { kind: 'metavariable' };
export type MutableSpecifier = { kind: 'mutable_specifier' };
export type PrimitiveType = { kind: 'primitive_type' };
export type Self = { kind: 'self' };
export type Shebang = { kind: 'shebang' };
export type ShorthandFieldIdentifier = { kind: 'shorthand_field_identifier' };
export type StringContent = { kind: 'string_content' };
export type Super = { kind: 'super' };
export type TypeIdentifier = { kind: 'type_identifier' };

// Supertype unions
export type DeclarationStatement =
  | AssociatedType
  | AttributeItem
  | ConstItem
  | EmptyStatement
  | EnumItem
  | ExternCrateDeclaration
  | ForeignModItem
  | FunctionItem
  | FunctionSignatureItem
  | ImplItem
  | InnerAttributeItem
  | LetDeclaration
  | MacroDefinition
  | MacroInvocation
  | ModItem
  | StaticItem
  | StructItem
  | TraitItem
  | TypeItem
  | UnionItem
  | UseDeclaration
;

export type Expression =
  | Literal
  | ArrayExpression
  | AssignmentExpression
  | AsyncBlock
  | AwaitExpression
  | BinaryExpression
  | Block
  | BreakExpression
  | CallExpression
  | ClosureExpression
  | CompoundAssignmentExpr
  | ConstBlock
  | ContinueExpression
  | FieldExpression
  | ForExpression
  | GenBlock
  | GenericFunction
  | Identifier
  | IfExpression
  | IndexExpression
  | LoopExpression
  | MacroInvocation
  | MatchExpression
  | Metavariable
  | ParenthesizedExpression
  | RangeExpression
  | ReferenceExpression
  | ReturnExpression
  | ScopedIdentifier
  | Self
  | StructExpression
  | TryBlock
  | TryExpression
  | TupleExpression
  | TypeCastExpression
  | UnaryExpression
  | UnitExpression
  | UnsafeBlock
  | WhileExpression
  | YieldExpression
;

export type Literal =
  | BooleanLiteral
  | CharLiteral
  | FloatLiteral
  | IntegerLiteral
  | RawStringLiteral
  | StringLiteral
;

export type LiteralPattern =
  | BooleanLiteral
  | CharLiteral
  | FloatLiteral
  | IntegerLiteral
  | NegativeLiteral
  | RawStringLiteral
  | StringLiteral
;

export type Pattern =
  | LiteralPattern
  | CapturedPattern
  | ConstBlock
  | GenericPattern
  | Identifier
  | MacroInvocation
  | MutPattern
  | OrPattern
  | RangePattern
  | RefPattern
  | ReferencePattern
  | RemainingFieldPattern
  | ScopedIdentifier
  | SlicePattern
  | StructPattern
  | TuplePattern
  | TupleStructPattern
;

export type Type =
  | AbstractType
  | ArrayType
  | BoundedType
  | DynamicType
  | FunctionType
  | GenericType
  | MacroInvocation
  | Metavariable
  | NeverType
  | PointerType
  | PrimitiveType
  | ReferenceType
  | RemovedTraitBound
  | ScopedTypeIdentifier
  | TupleType
  | TypeIdentifier
  | UnitType
;

export type RustIrNode =
  | AbstractType
  | Arguments
  | ArrayExpression
  | ArrayType
  | AssignmentExpression
  | AssociatedType
  | AsyncBlock
  | Attribute
  | AttributeItem
  | AwaitExpression
  | BaseFieldInitializer
  | BinaryExpression
  | Block
  | BlockComment
  | BoundedType
  | BracketedType
  | BreakExpression
  | CallExpression
  | CapturedPattern
  | ClosureExpression
  | ClosureParameters
  | CompoundAssignmentExpr
  | ConstBlock
  | ConstItem
  | ConstParameter
  | ContinueExpression
  | DeclarationList
  | DynamicType
  | ElseClause
  | EnumItem
  | EnumVariant
  | EnumVariantList
  | ExpressionStatement
  | ExternCrateDeclaration
  | ExternModifier
  | FieldDeclaration
  | FieldDeclarationList
  | FieldExpression
  | FieldInitializer
  | FieldInitializerList
  | FieldPattern
  | ForExpression
  | ForLifetimes
  | ForeignModItem
  | FunctionItem
  | FunctionModifiers
  | FunctionSignatureItem
  | FunctionType
  | GenBlock
  | GenericFunction
  | GenericPattern
  | GenericType
  | GenericTypeWithTurbofish
  | HigherRankedTraitBound
  | IfExpression
  | ImplItem
  | IndexExpression
  | InnerAttributeItem
  | Label
  | LetChain
  | LetCondition
  | LetDeclaration
  | Lifetime
  | LifetimeParameter
  | LineComment
  | LoopExpression
  | MacroDefinition
  | MacroInvocation
  | MacroRule
  | MatchArm
  | MatchBlock
  | MatchExpression
  | MatchPattern
  | ModItem
  | MutPattern
  | NegativeLiteral
  | OrPattern
  | OrderedFieldDeclarationList
  | Parameter
  | Parameters
  | ParenthesizedExpression
  | PointerType
  | QualifiedType
  | RangeExpression
  | RangePattern
  | RawStringLiteral
  | RefPattern
  | ReferenceExpression
  | ReferencePattern
  | ReferenceType
  | RemovedTraitBound
  | ReturnExpression
  | ScopedIdentifier
  | ScopedTypeIdentifier
  | ScopedUseList
  | SelfParameter
  | ShorthandFieldInitializer
  | SlicePattern
  | SourceFile
  | StaticItem
  | StringLiteral
  | StructExpression
  | StructItem
  | StructPattern
  | TokenBindingPattern
  | TokenRepetition
  | TokenRepetitionPattern
  | TokenTree
  | TokenTreePattern
  | TraitBounds
  | TraitItem
  | TryBlock
  | TryExpression
  | TupleExpression
  | TuplePattern
  | TupleStructPattern
  | TupleType
  | TypeArguments
  | TypeBinding
  | TypeCastExpression
  | TypeItem
  | TypeParameter
  | TypeParameters
  | UnaryExpression
  | UnionItem
  | UnsafeBlock
  | UseAsClause
  | UseBounds
  | UseDeclaration
  | UseList
  | UseWildcard
  | VariadicParameter
  | VisibilityModifier
  | WhereClause
  | WherePredicate
  | WhileExpression
  | YieldExpression
;

export type { ValidationResult };
